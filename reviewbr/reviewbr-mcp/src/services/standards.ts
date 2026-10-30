import * as fs from "node:fs";
import * as path from "node:path";
import { z } from "zod";
import { declaracaoDe, LinhaDoMapeamento } from "./method_mapping.js";

/**
 * Standards — os padrões metodológicos como DADO consultável, em `.claude/standards/`.
 *
 * Por que existe: a spec mapeia em UMA direção — "o subitem F0.1.1 atende ao Item 1".
 * Ninguém consegue perguntar o inverso: "o Item 17 está coberto por quê?". Sem a consulta
 * reversa não há como verificar cobertura, e o suplemento obrigatório
 * `prisma_checklist_filled.md` (27 itens) era exigido pelo manifest sem que existisse
 * template dele em lugar nenhum.
 *
 * Separação deliberada:
 *  - `.claude/standards/`     → a NORMA (externa, estável, versionada)
 *  - `.claude/methodologies/` → o MÉTODO (como o ReviewBR implementa a norma)
 *
 * PRISMA-S é usado por prisma-sr E por scoping-prisma-scr: mantê-lo num arquivo próprio
 * evita duas cópias que divergem.
 *
 * O MAPEAMENTO NÃO MORA AQUI (DEBT-142): `covered_by` e as declarações [NÃO COBERTO] /
 * [NÃO SE APLICA] são de cada método que declara o padrão, em
 * `.claude/methodologies/<método>/conformance/<padrão>.json` (`method_mapping.ts`). O arquivo do
 * padrão guarda só a norma — e o leitor RECUSA padrão que traga mapeamento: ponteiro esquecido
 * aqui seria ignorado em silêncio, e quem o escreveu acharia que conta.
 *
 * Os itens foram EXTRAÍDOS do mapeamento que a própria spec já continha — nada veio de
 * fonte externa, porque o rastreio ativo está fora de escopo (protocolo §4). Por isso o
 * campo `version` pode trazer `[A VERIFICAR]`: declarar a incerteza é melhor do que
 * afirmar uma versão não conferida.
 */

export const StandardItemSchema = z.object({
    id: z.string().min(1),
    section: z.string().default(""),
    title: z.string().default(""),
    /** true no item de topo que se desdobra em subitens por letra (ex.: 13 → 13a..13f). */
    has_subitems: z.boolean().default(false),
    /** true na LINHA de subitem; `parent` aponta o item de topo. */
    is_subitem: z.boolean().default(false),
    parent: z.string().default("")
});

/** Campos do MAPEAMENTO, que é do método (DEBT-142): no arquivo do padrão, o leitor os recusa. */
const CAMPOS_DO_METODO = ["covered_by", "nao_coberto", "nao_se_aplica"];

export const StandardSchema = z.object({
    schemaVersion: z.literal(1),
    id: z.string().min(1),
    name: z.string().min(1),
    version: z.string().default(""),
    version_source: z.string().default(""),
    note: z.string().default(""),
    /**
     * Limitação estrutural declarada. O PRISMA 2020 tem subitens por letra (10a/10b,
     * 13a-13f, 16a/16b, 24a-24c) e o sistema já os cita (RV-02 ⟵ item 16a). Esta
     * representação é PLANA: "27" é o número de itens de TOPO, não de linhas do checklist.
     * Confirmar a granularidade exige a fonte oficial — DEBT-013.
     */
    structure_warning: z.string().default(""),
    items_are_top_level_only: z.boolean().default(false),
    /**
     * DEBT-140 — a PREMISSA da falsificação do mapeamento. `mapping_coherence` compara o
     * rótulo da trilha com o título do item; isso só falsifica alguma coisa se o título veio
     * da FONTE OFICIAL. Título extraído da própria trilha (o caso do PRISMA-S, DEBT-128) faz a
     * comparação circular: nem o suspeito nem a ausência dele dizem algo. `false` por padrão —
     * o que não foi conferido contra a fonte não se presume conferido.
     */
    titulos_oficiais: z.boolean().default(false),
    /**
     * Estrutura confirmada do padrão. `checklist_lines` ≠ número de nós: um item de topo que
     * tem subitens é cabeçalho, não linha de checklist. No PRISMA 2020: 48 nós (21 itens
     * simples + 6 pais + 21 subitens) e 42 linhas de checklist (48 − 6 pais).
     */
    structure: z.object({
        top_level_items: z.number().default(0),
        checklist_lines: z.number().default(0),
        items_with_subitems: z.record(z.string(), z.array(z.string())).default({}),
        note: z.string().default("")
    }).optional(),
    items: z.array(StandardItemSchema).default([])
});

export type Standard = z.infer<typeof StandardSchema>;
export type StandardItem = z.infer<typeof StandardItemSchema>;

export interface Declaracao {
    id: string;
    title: string;
    motivo: string;
}

export interface CoverageReport {
    standard: string;
    version: string;
    total: number;
    /** Linhas com correspondência DECLARADA (covered_by preenchido, sem declaração de ausência). */
    covered: number;
    /** Linhas declaradas [NÃO COBERTO] — o sistema ainda não implementa; fila de manutenção. */
    nao_coberto: Declaracao[];
    /** Linhas declaradas [NÃO SE APLICA] — nunca serão cobertas, e não é falha. */
    nao_se_aplica: Declaracao[];
    /** Linhas sem cobertura E sem declaração — omissão silenciosa, o que reprova. */
    orphans: LinhaDoChecklist[];
    /** Versão não confirmada contra a fonte oficial. */
    version_unverified: boolean;
    valid: boolean;
    errors: string[];
}

/** O item do padrão com o que o método diz dele — a linha como o checklist a mostra. */
export type LinhaDoChecklist = StandardItem & { covered_by: string[]; nao_coberto: string; nao_se_aplica: string };

export class StandardsService {
    static standardsDir(repoRoot: string): string {
        return path.join(repoRoot, ".claude", "standards");
    }

    /** null = ausente, ilegível, fora do schema ou com mapeamento dentro (que é do método — DEBT-142). */
    static read(repoRoot: string, standardId: string): Standard | null {
        const p = path.join(this.standardsDir(repoRoot), `${standardId}.json`);
        if (!fs.existsSync(p)) return null;
        try {
            const bruto = JSON.parse(fs.readFileSync(p, "utf-8"));
            const itens: unknown[] = Array.isArray(bruto?.items) ? bruto.items : [];
            if (itens.some((i) => i && typeof i === "object" && CAMPOS_DO_METODO.some((k) => k in (i as object)))) return null;
            const parsed = StandardSchema.safeParse(bruto);
            return parsed.success ? parsed.data : null;
        } catch {
            return null;
        }
    }

    /**
     * Descreve os padrões de uma metodologia a partir do DADO, não de prosa digitada.
     *
     * POR QUE EXISTE (DEBT-122/DEBT-053): a frase "PRISMA aplicável" era string literal,
     * duplicada em `project_init.ts` e `index.ts` e divergente entre as duas — uma dizia
     * "27 itens", a outra "27 itens, 44 subitens" (são 42 linhas de checklist) e anunciava
     * PRISMA-P, que não existe em `.claude/standards/`. Duas cópias de uma tabela são, por
     * si, a condição para divergirem; e prosa sobre o padrão envelhece sem ninguém notar.
     *
     * Os critérios de uma metodologia — itens, subitens, exigências — são DELA, publicados
     * com a norma. O ReviewBR não os decide: assimila e declara. Por isso a contagem vem do
     * arquivo do padrão, e padrão que não existe como dado simplesmente não é anunciado.
     */
    static describeStandards(repoRoot: string, standardIds: string[]): string {
        if (!standardIds.length) return "[SEM PADRÃO DECLARADO]";
        const partes: string[] = [];
        for (const id of standardIds) {
            const std = this.read(repoRoot, id);
            if (!std) {
                // Não anunciar o que não se tem. Declarar a ausência é diferente de omiti-la.
                partes.push(`${id} [NÃO ASSIMILADO: sem arquivo em .claude/standards/]`);
                continue;
            }
            const linhas = std.structure?.checklist_lines
                ?? std.items.filter((i) => !i.has_subitems).length;
            const topo = std.structure?.top_level_items
                ?? std.items.filter((i) => !i.is_subitem).length;
            // Só anexa a versão quando o nome não a traz: "PRISMA 2020" + " 2020" lia mal.
            const temVersaoNoNome = std.version && std.name.includes(std.version);
            const versao = std.version && !/^\[/.test(std.version) && !temVersaoNoNome
                ? ` ${std.version}` : "";
            const detalhe = topo && linhas && topo !== linhas
                ? `${topo} itens, ${linhas} linhas de checklist`
                : `${linhas || topo} itens`;
            partes.push(`${std.name}${versao} (${detalhe})`);
        }
        return partes.join(" + ");
    }

    static list(repoRoot: string): string[] {
        const dir = this.standardsDir(repoRoot);
        if (!fs.existsSync(dir)) return [];
        return fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")).sort();
    }

    /**
     * Confere a DECLARAÇÃO de cobertura de um padrão, linha a linha — a conferência (d) do
     * DEBT-140: toda linha ou aponta subitens da trilha, ou declara [NÃO COBERTO], ou declara
     * [NÃO SE APLICA]. Nenhuma das três é omissão silenciosa, e é ela que reprova.
     *
     * O QUE ESTA FUNÇÃO NÃO FAZ, e não pode fazer sozinha: conferir que os subitens apontados
     * existem, que o rótulo deles não contradiz o item e que alguma coisa produz o artefato.
     * Isso depende do MÉTODO que declara o padrão — é `StandardCoverageService`. Esta função
     * olhava só `covered_by` vazio, e era assim que o PRISMA-P saía 26/26 com 14 linhas de
     * encaixe: verde por construção, o mesmo resultado para qualquer projeto.
     *
     * `mapa` é o mapeamento do MÉTODO (DEBT-142): linha sem entrada nele não tem cobertura nem
     * declaração. Sem mapa — padrão que nenhum método declara —, toda linha é omissão.
     */
    static checkCoverage(std: Standard | null, standardId: string, mapa: Map<string, LinhaDoMapeamento> = new Map()): CoverageReport {
        if (!std) {
            return {
                standard: standardId, version: "", total: 0, covered: 0, nao_coberto: [], nao_se_aplica: [], orphans: [],
                version_unverified: true, valid: false,
                errors: [`Padrão "${standardId}" ausente, ilegível ou com mapeamento dentro em .claude/standards/ (o mapeamento é do método — DEBT-142).`]
            };
        }

        // Um pai com subitens é cabeçalho: quem precisa de cobertura são suas LINHAS.
        const linhas = std.items.filter((i) => !i.has_subitems);
        const cb = (i: StandardItem) => mapa.get(i.id)?.covered_by ?? [];
        const nc = (i: StandardItem) => declaracaoDe(mapa.get(i.id)).naoCoberto;
        const na = (i: StandardItem) => declaracaoDe(mapa.get(i.id)).naoSeAplica;
        const orphans = linhas.filter((i) => cb(i).length === 0 && !nc(i) && !na(i))
            .map((i) => ({ ...i, covered_by: [], nao_coberto: "", nao_se_aplica: "" }));
        const corresponde = linhas.filter((i) => cb(i).length > 0 && !nc(i) && !na(i));
        const errors: string[] = [];

        if (orphans.length > 0) {
            errors.push(
                `${orphans.length} item(ns) do ${std.name} sem nenhum subitem da trilha que os cubra e sem declaração ` +
                `[NÃO COBERTO] ou [NÃO SE APLICA]: ${orphans.map((o) => o.id).join(", ")}. Omissão silenciosa — ` +
                `a revisão não pode declarar aderência ao padrão inteiro.`
            );
        }
        const duplas = linhas.filter((i) => nc(i) && na(i));
        if (duplas.length > 0) {
            errors.push(
                `${duplas.map((i) => i.id).join(", ")}: declarado(s) [NÃO COBERTO] e [NÃO SE APLICA] ao mesmo tempo. ` +
                `Uma é fila de manutenção, a outra é não-falha: são excludentes, e a escolha é de quem assimila.`
            );
        }

        const unverified = /\[A VERIFICAR\]|\[SEM VERSÃO/.test(std.version + std.version_source);

        return {
            standard: std.name,
            version: std.version,
            total: linhas.length,
            covered: corresponde.length,
            nao_coberto: linhas.filter((i) => nc(i) && !na(i)).map((i) => ({ id: i.id, title: i.title, motivo: nc(i) })),
            nao_se_aplica: linhas.filter((i) => na(i) && !nc(i)).map((i) => ({ id: i.id, title: i.title, motivo: na(i) })),
            orphans,
            version_unverified: unverified,
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Gera o template do checklist de conformidade a partir do DADO do padrão.
     *
     * O manifest exige `prisma_checklist_filled.md` como suplemento obrigatório, mas não
     * havia template: o pesquisador teria de escrever a estrutura inteira à mão, e ela
     * divergiria da spec ao primeiro ajuste. Aqui a estrutura vem do padrão; ao pesquisador
     * cabe preencher a EVIDÊNCIA — o arquivo e a seção que cumprem cada item.
     *
     * `conferencia` (DEBT-140): o template é o suplemento que o pesquisador preenche e publica.
     * Sem ela, item que a conferência CONTESTA sairia como cobertura limpa, sem a premissa sob a
     * qual o veredito foi dado. Com ela, o contestado sai marcado e a fração, a premissa e o
     * limite vão no rodapé. A coluna "Coberto por" vem do mapeamento do MÉTODO (`linhas`,
     * DEBT-142), e a nota dele vai ao pé, ao lado da nota da norma.
     */
    static renderChecklist(std: Standard, conferencia?: {
        linhas?: Map<string, LinhaDoMapeamento>;
        contestados?: Record<string, string>;
        rodape?: string[];
        notaDoMapeamento?: { metodo: string; texto: string };
    }): string {
        const mapa = conferencia?.linhas ?? new Map<string, LinhaDoMapeamento>();
        const linhas: string[] = [];
        linhas.push(`# Checklist de conformidade — ${std.name}`);
        linhas.push("");
        linhas.push(`**Padrão:** ${std.name} | **Versão:** ${std.version || "[SEM VERSÃO DECLARADA]"}`);
        if (std.version_source) linhas.push(`**Origem da versão:** ${std.version_source}`);
        linhas.push("");
        linhas.push("> Gerado a partir de `.claude/standards/` — não edite a estrutura à mão.");
        linhas.push("> Preencha a coluna **Evidência**: o arquivo e a seção que cumprem o item.");
        linhas.push("> Item sem evidência é pendência e **impede a finalização** da revisão.");
        if (std.items_are_top_level_only || std.structure_warning) {
            linhas.push(">");
            linhas.push("> ⚠️ **Granularidade não confirmada.** Este checklist lista os itens de TOPO. O padrão");
            linhas.push("> pode exigir subitens por letra (ex.: 16a/16b) como linhas separadas — ver DEBT-013.");
        }
        linhas.push("");

        let secaoAtual = "";
        let cabecalhoEmitido = false;
        for (const item of std.items) {
            if (item.section && item.section !== secaoAtual) {
                secaoAtual = item.section;
                linhas.push("");
                linhas.push(`## ${secaoAtual}`);
                linhas.push("");
                linhas.push("| Item | Título | Coberto por (trilha) | Evidência | Status |");
                linhas.push("|---|---|---|---|---|");
                cabecalhoEmitido = true;
            } else if (!cabecalhoEmitido) {
                // DEBT-051: padrão sem `section` (ex.: PRISMA-S, todos os 16 itens com
                // section="") nunca entrava no ramo acima — a tabela saía sem cabeçalho
                // nem separador em NENHUM item. Emite uma vez, antes da primeira linha.
                linhas.push("| Item | Título | Coberto por (trilha) | Evidência | Status |");
                linhas.push("|---|---|---|---|---|");
                cabecalhoEmitido = true;
            }
            if (item.has_subitems) {
                // cabeçalho: os subitens abaixo é que são linhas de checklist
                linhas.push(`| **${item.id}** | **${item.title}** | *(ver subitens)* | — | — |`);
                continue;
            }
            // DEBT-140: as duas declarações aparecem como tais — [NÃO SE APLICA] não é pendência,
            // e [NÃO COBERTO] não é cobertura, mesmo quando o item tem ponteiros parciais.
            const { naoSeAplica: naoAplica, naoCoberto } = declaracaoDe(mapa.get(item.id));
            const ponteiros = mapa.get(item.id)?.covered_by ?? [];
            const cobertura = naoAplica
                ? `**[NÃO SE APLICA]** ${naoAplica}`
                : naoCoberto
                    // Só "parcial" mora nos ponteiros; em encaixe e deslocamento eles são o erro.
                    ? `**[NÃO COBERTO]** ${naoCoberto}${ponteiros.length
                        ? (/^parcial/i.test(naoCoberto) ? ` (parcial em ${ponteiros.join(", ")})` : ` (ponteiros atuais: ${ponteiros.join(", ")})`)
                        : ""}`
                    : conferencia?.contestados?.[item.id]
                        ? `**[CONTESTADO]** ${conferencia.contestados[item.id]} (ponteiros: ${ponteiros.join(", ")})`
                        : ponteiros.length ? ponteiros.join(", ") : "**[SEM COBERTURA]**";
            const rotulo = item.is_subitem ? `&nbsp;&nbsp;${item.id}` : item.id;
            linhas.push(`| ${rotulo} | ${item.title} | ${cobertura.replace(/\|/g, "/")} | ${naoAplica ? "—" : "[TBD]"} | ${naoAplica ? "N/A" : "☐"} |`);
        }

        linhas.push("");
        if (conferencia?.rodape?.length) {
            linhas.push("---");
            linhas.push("");
            for (const r of conferencia.rodape) { linhas.push(r); linhas.push(""); }
        }
        if (std.note) {
            linhas.push("---");
            linhas.push("");
            linhas.push(`**Nota sobre a origem dos itens:** ${std.note}`);
        }
        if (conferencia?.notaDoMapeamento?.texto) {
            linhas.push("");
            linhas.push(`**Nota sobre o mapeamento (${conferencia.notaDoMapeamento.metodo}):** ${conferencia.notaDoMapeamento.texto}`);
        }
        return linhas.join("\n") + "\n";
    }
}
