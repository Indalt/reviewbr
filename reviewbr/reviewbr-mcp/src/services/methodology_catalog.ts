import * as fs from "node:fs";
import * as path from "node:path";
import { z } from "zod";

/**
 * MethodologyCatalog — o MAPA DO TERRITÓRIO metodológico, em `.claude/catalog/`.
 *
 * Por que existe: o agente de manutenção precisa SABER quais metodologias existem, não só
 * as que o ReviewBR implementa. Antes disto, o "conhecimento" do agente sobre JBI, GRADE ou
 * MECIR eram 17 menções em prosa — nomes sem conteúdo. Conhecimento que mora na prosa do
 * agente (ou na memória do modelo) é a autocertificação que o próprio sistema recusa:
 * "rigor não é autocertificação do agente".
 *
 * As três camadas, e por que são distintas:
 *
 *   .claude/catalog/       → o MAPA: que métodos existem, quando usar, o que exigem
 *   .claude/standards/     → a NORMA: os itens de cada checklist
 *   .claude/methodologies/ → a IMPLEMENTAÇÃO: como o ReviewBR executa
 *
 * Um método pode estar no catálogo sem estar implementado — e é isso que torna a lacuna
 * visível em vez de invisível. A distância entre o catálogo e as implementações é a fila de
 * trabalho do mantenedor.
 *
 * REGRA CENTRAL: `status_in_system` é DERIVADO do disco, nunca declarado no arquivo. É o
 * princípio do RV-02 ("os números emergem do processo, não são digitados") aplicado ao
 * catálogo: se alguém escrevesse "implementada" à mão, o catálogo poderia mentir sobre o
 * estado do sistema.
 */

export type MethodologyStatus =
    /** tem pasta em .claude/methodologies/ — o ReviewBR executa */
    | "IMPLEMENTADA"
    /** tem o padrão como dado em .claude/standards/, mas não executa */
    | "PADRAO_DISPONIVEL"
    /** o sistema a menciona em prosa, sem dado nem implementação */
    | "DECLARADA"
    /** conhecida pelo catálogo, ausente do sistema */
    | "AUSENTE";

export const CatalogEntrySchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    full_name: z.string().default(""),
    /** reporting_guideline | review_method | appraisal_tool | certainty_framework | registry | risk_of_bias_tool */
    kind: z.string().default(""),
    version: z.string().default(""),
    version_year: z.string().default(""),
    what_it_is: z.string().default(""),
    when_to_use: z.string().default(""),
    requires: z.string().default(""),
    item_count: z.string().default(""),
    related_standards: z.string().default(""),
    /** URL da fonte oficial consultada. Sem fonte, a entrada não é conhecimento — é palpite. */
    source_url: z.string().default(""),
    confidence: z.string().default(""),
    notes: z.string().default(""),
    /** Id do arquivo em .claude/standards/, quando o padrão já estiver como dado. */
    standard_file: z.string().default(""),
    /** Id da pasta em .claude/methodologies/, quando implementada. */
    methodology_dir: z.string().default("")
});

export type CatalogEntry = z.infer<typeof CatalogEntrySchema>;

export const CatalogSchema = z.object({
    schemaVersion: z.literal(1),
    updatedAt: z.string().default(""),
    source_note: z.string().default(""),
    entries: z.array(CatalogEntrySchema).default([])
});

export type Catalog = z.infer<typeof CatalogSchema>;

export interface CatalogEntryResolved extends CatalogEntry {
    status_in_system: MethodologyStatus;
    /** true quando algum campo ficou por confirmar contra a fonte. */
    unverified: boolean;
}

export interface CatalogReport {
    total: number;
    by_status: Record<MethodologyStatus, number>;
    entries: CatalogEntryResolved[];
    /** Entradas sem URL de fonte — conhecimento não rastreável. */
    without_source: string[];
    /** Metodologias implementadas cujo padrão NÃO existe como dado. */
    implemented_without_standard: string[];
    valid: boolean;
    errors: string[];
}

export class MethodologyCatalogService {
    static catalogPath(repoRoot: string): string {
        return path.join(repoRoot, ".claude", "catalog", "methodologies.json");
    }

    /** Mesma sonda do backlog: AUSENTE e ILEGÍVEL não podem ser o mesmo estado. */
    static probe(repoRoot: string): { status: "AUSENTE" | "OK" | "ILEGIVEL"; catalog?: Catalog; detail?: string } {
        const p = this.catalogPath(repoRoot);
        if (!fs.existsSync(p)) return { status: "AUSENTE" };
        let json: unknown;
        try {
            json = JSON.parse(fs.readFileSync(p, "utf-8"));
        } catch (e: any) {
            return { status: "ILEGIVEL", detail: `JSON inválido: ${e.message}` };
        }
        const parsed = CatalogSchema.safeParse(json);
        if (!parsed.success) {
            return {
                status: "ILEGIVEL",
                detail: "não passa no schema: " + parsed.error.issues.slice(0, 5)
                    .map((i) => `${i.path.join(".") || "(raiz)"}: ${i.message}`).join("; ")
            };
        }
        return { status: "OK", catalog: parsed.data };
    }

    static read(repoRoot: string): Catalog | null {
        const p = this.catalogPath(repoRoot);
        if (!fs.existsSync(p)) return null;
        try {
            const parsed = CatalogSchema.safeParse(JSON.parse(fs.readFileSync(p, "utf-8")));
            return parsed.success ? parsed.data : null;
        } catch {
            return null;
        }
    }

    /** Pastas em `.claude/methodologies/` — o que o ReviewBR de fato executa. */
    private static implementedDirs(repoRoot: string): Set<string> {
        const dir = path.join(repoRoot, ".claude", "methodologies");
        if (!fs.existsSync(dir)) return new Set();
        return new Set(fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name));
    }

    /** Arquivos em `.claude/standards/` — os padrões já disponíveis como dado. */
    private static standardFiles(repoRoot: string): Set<string> {
        const dir = path.join(repoRoot, ".claude", "standards");
        if (!fs.existsSync(dir)) return new Set();
        return new Set(fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")));
    }

    /**
     * Resolve o catálogo contra o estado real do disco.
     *
     * O status NÃO vem do arquivo: é computado aqui. Assim o catálogo não consegue afirmar
     * que algo está implementado quando não está — a mesma garantia que `compute_flow_counts`
     * dá ao fluxograma PRISMA.
     */
    static resolve(repoRoot: string, catalog: Catalog | null): CatalogReport {
        const by_status: Record<MethodologyStatus, number> = {
            IMPLEMENTADA: 0, PADRAO_DISPONIVEL: 0, DECLARADA: 0, AUSENTE: 0
        };

        if (!catalog) {
            return {
                total: 0, by_status, entries: [], without_source: [], implemented_without_standard: [],
                valid: false,
                errors: ["Catálogo ausente: `.claude/catalog/methodologies.json` não existe ou é ilegível."]
            };
        }

        const impl = this.implementedDirs(repoRoot);
        const stds = this.standardFiles(repoRoot);
        const errors: string[] = [];
        const without_source: string[] = [];

        const entries: CatalogEntryResolved[] = catalog.entries.map((e) => {
            let status: MethodologyStatus;
            if (e.methodology_dir && impl.has(e.methodology_dir)) status = "IMPLEMENTADA";
            else if (e.standard_file && stds.has(e.standard_file)) status = "PADRAO_DISPONIVEL";
            else if (e.notes.includes("[DECLARADA]")) status = "DECLARADA";
            else status = "AUSENTE";

            by_status[status]++;

            if (!e.source_url.trim()) without_source.push(e.id);

            const unverified = /\[A VERIFICAR\]|\[SEM VERSÃO|\[SEM VERSAO/.test(
                e.version + e.version_year + e.item_count + e.requires + e.notes
            );

            return { ...e, status_in_system: status, unverified };
        });

        // Metodologia que o sistema EXECUTA mas cujo padrão não existe como dado: o gerador
        // de checklist não consegue atendê-la. Foi assim que a lacuna do PRISMA-ScR apareceu.
        const implemented_without_standard = entries
            .filter((e) => e.status_in_system === "IMPLEMENTADA" && (!e.standard_file || !stds.has(e.standard_file)))
            .map((e) => e.id);

        if (implemented_without_standard.length > 0) {
            errors.push(
                `Metodologia(s) implementada(s) sem o padrão como dado em .claude/standards/: ` +
                `${implemented_without_standard.join(", ")}. O checklist obrigatório dela não pode ser gerado.`
            );
        }

        if (without_source.length > 0) {
            errors.push(
                `Entrada(s) sem 'source_url': ${without_source.join(", ")}. ` +
                `Conhecimento sem fonte rastreável é palpite, não catálogo.`
            );
        }

        return {
            total: entries.length,
            by_status,
            entries,
            without_source,
            implemented_without_standard,
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * As entradas do catálogo que explicam um método assimilado: a que aponta a pasta dele
     * (`methodology_dir`) e as dos padrões que ele declara (`standard_file`).
     *
     * É o contexto que o pesquisador recebe NA ESCOLHA (DEBT-095): "o pesquisador pode não
     * conhecer o método e poderia saber o que está escolhendo de fato". Vem do dado com fonte
     * oficial — não da prosa do agente nem da memória do modelo. Elo que não existe no dado
     * não é inventado: método sem entrada ligada sai sem contexto, e isso aparece.
     */
    static entradasDoMetodo(report: CatalogReport, methodId: string, standards: string[]): CatalogEntryResolved[] {
        const vistas = new Set<string>();
        return report.entries.filter((e) => {
            const liga = e.methodology_dir === methodId || (!!e.standard_file && standards.includes(e.standard_file));
            if (!liga || vistas.has(e.id)) return false;
            vistas.add(e.id);
            return true;
        });
    }

    /** Busca por id, nome ou palavra do "quando usar" — o agente perguntando "existe método para X?". */
    static find(report: CatalogReport, termo: string): CatalogEntryResolved[] {
        const t = termo.toLowerCase().trim();
        if (!t) return report.entries;
        return report.entries.filter((e) =>
            e.id.toLowerCase().includes(t) ||
            e.name.toLowerCase().includes(t) ||
            e.full_name.toLowerCase().includes(t) ||
            e.when_to_use.toLowerCase().includes(t) ||
            e.what_it_is.toLowerCase().includes(t) ||
            e.kind.toLowerCase().includes(t)
        );
    }
}
