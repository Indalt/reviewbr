import * as fs from "node:fs";
import * as path from "node:path";
import { z } from "zod";
import { ChangeType } from "./change_validator.js";
import { SystemDebtService, DebtFindingSchema, SystemDebtSchema } from "./system_debt.js";
import { MethodologyCatalogService, CatalogEntrySchema, CatalogSchema } from "./methodology_catalog.js";
import { errosDaTrilha } from "./method_trail.js";
import { AgentOrchestrator } from "../registry/agent_orchestrator.js";

/**
 * MaintenanceWrites — o lado de ESCRITA do agente de manutenção.
 *
 * Por que existe: até 25/09/2026 as quatro tools do mantenedor eram todas de LEITURA. O
 * agente lia o backlog, o catálogo e os padrões, mas toda escrita era edição de JSON na mão
 * com Write/Edit — sem nenhuma verificação no momento de escrever.
 *
 * Isso contradizia o sistema em dois pontos:
 *
 *  1. `maintainer.md` manda "registre no backlog", "mantenha o manifesto", "proponha
 *     extensão". Capacidade declarada em prosa sem ferramenta que a sustente é o modo de
 *     falha que o próprio backlog registra sobre as RV-03/04/07.
 *  2. `SystemDebtService.write` existia e NENHUMA tool o chamava — código morto, o mesmo
 *     padrão do `validate_prisma_flow` que "já existia e nunca era chamada".
 *
 * REGRA DESTE MÓDULO: valida ANTES de escrever e recusa em vez de gravar sujo. Um backlog
 * que só é auditado depois do fato já foi corrompido quando o gate reprova.
 */

function agora(): string {
    return new Date().toISOString();
}

export interface Escrita {
    ok: boolean;
    errors: string[];
    /** O que mudou, para o registro. */
    resultado?: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Registro de achado no backlog
// ─────────────────────────────────────────────────────────────────────────────

export const NovoAchadoSchema = DebtFindingSchema.partial({
    reproduction: true, location: true, resolution: true,
    found_by: true, found_at: true, context: true
});

export class BacklogWriter {
    /**
     * Registra um achado novo, ou atualiza o estado de um existente.
     *
     * Valida no momento da escrita as mesmas regras que `audit_system_debt` cobra depois:
     * id único (ou atualização explícita), CORRECAO com reprodução, saída da fila com
     * justificativa. Recusar aqui é mais barato que descobrir no gate.
     */
    static registrar(repoRoot: string, bruto: unknown, atualizar = false): Escrita {
        const entrada = (bruto ?? {}) as Record<string, unknown>;
        const id = String(entrada.id ?? "").trim();
        if (!id) return { ok: false, errors: ["'id' é obrigatório."] };

        // NUNCA gravar por cima de arquivo ilegível. `read()` devolve null tanto para
        // "não existe" quanto para "não passa no schema", e o `?? {findings: []}` que estava
        // aqui transformava um caractere inválido — uma cedilha num `change_type` editado à
        // mão — na destruição silenciosa da fila inteira de memória do sistema. Medido: um
        // backlog de 18 achados virava 1.
        const sonda = SystemDebtService.probe(repoRoot);
        if (sonda.status === "ILEGIVEL") {
            return {
                ok: false,
                errors: [
                    `RECUSADO: o backlog existe em disco e está ILEGÍVEL — ${sonda.detail}`,
                    "Gravar agora apagaria todos os achados já registrados. Corrija o arquivo " +
                    "(ou restaure de uma versão anterior) antes de escrever."
                ]
            };
        }
        const debt = sonda.debt ?? { schemaVersion: 1 as const, updatedAt: "", findings: [] };
        const i = debt.findings.findIndex((x) => x.id === id);

        if (i >= 0 && !atualizar) {
            return { ok: false, errors: [`Já existe achado com id "${id}". Para alterá-lo, passe atualizar=true.`] };
        }
        if (i < 0 && atualizar) {
            return { ok: false, errors: [`Nenhum achado com id "${id}" para atualizar.`] };
        }

        // ATUALIZAÇÃO É MERGE, NUNCA SUBSTITUIÇÃO. Mesclar com o registro existente ANTES de
        // validar resolve dois problemas de uma vez: permite update parcial (mandar só
        // `status` e `resolution`) e impede que campos não enviados sejam apagados. Um
        // backlog que perde evidência em silêncio é pior que um backlog sem tool.
        const base: any = i >= 0 ? debt.findings[i] : {};

        // PROCEDÊNCIA É IMUTÁVEL. `found_by`/`found_at` respondem "quem ENCONTROU, quando" —
        // fato datado, não estado corrente. O merge `{...base, ...entrada}` deixava a
        // atualização sobrescrevê-los, e 11 achados passaram a dizer quem os TRATOU em vez
        // de quem os achou: o registro de origem foi apagado pela própria tool que existe
        // para preservá-lo (DEBT-107). Uma vez gravados, só o valor original vale.
        const entradaSegura: any = { ...(entrada as any) };
        if (i >= 0) {
            if (base.found_by?.trim()) delete entradaSegura.found_by;
            if (base.found_at?.trim()) delete entradaSegura.found_at;
        }
        const parsed = NovoAchadoSchema.safeParse({ ...base, ...entradaSegura });
        if (!parsed.success) {
            return { ok: false, errors: parsed.error.issues.map((x) => `${x.path.join(".") || "(raiz)"}: ${x.message}`) };
        }

        const f = { reproduction: "", location: "", resolution: "", found_by: "", found_at: "", context: "", ...parsed.data };
        const errors: string[] = [];

        // As validações olham o estado FINAL do achado, não só o que veio nesta chamada.
        if (f.change_type === ChangeType.CORRECAO && !f.reproduction.trim()) {
            errors.push(
                "Achado de tipo CORRECAO exige 'reproduction': sem os passos que reproduzem, " +
                "não se distingue defeito real de impressão (mesma exigência do RV-11)."
            );
        }
        if ((f.status === "RESOLVIDO" || f.status === "RECUSADO") && !f.resolution.trim()) {
            errors.push(
                `Achado ficando ${f.status} sem 'resolution'. Um achado só sai da fila com a ` +
                "decisão registrada — senão o registro vira esquecimento organizado."
            );
        }
        if (!f.found_at.trim()) f.found_at = agora().slice(0, 10);
        if (errors.length) return { ok: false, errors };

        if (i >= 0) debt.findings[i] = f;
        else debt.findings.push(f);

        // Cinto e suspensório: o backlog resultante tem de passar na própria auditoria.
        const audit = SystemDebtService.audit(SystemDebtSchema.parse(debt));
        if (!audit.valid) {
            return { ok: false, errors: ["A escrita deixaria o backlog inconsistente:", ...audit.errors] };
        }

        SystemDebtService.write(repoRoot, debt, agora());
        return { ok: true, errors: [], resultado: { id: f.id, acao: i >= 0 ? "atualizado" : "registrado", total: debt.findings.length } };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Absorção de metodologia no catálogo
// ─────────────────────────────────────────────────────────────────────────────

export class CatalogWriter {
    /**
     * Absorve uma metodologia no catálogo — o "conhecer sem implementar".
     *
     * `source_url` é obrigatório e precisa ser externo (http). O catálogo existe justamente
     * para que o conhecimento metodológico do agente NÃO seja o que o modelo afirma saber:
     * entrada sem fonte rastreável é palpite, e palpite no catálogo é a autocertificação que
     * o sistema recusa.
     */
    static absorver(repoRoot: string, bruto: unknown, atualizar = false): Escrita {
        const parsed = CatalogEntrySchema.safeParse(bruto);
        if (!parsed.success) {
            return { ok: false, errors: parsed.error.issues.map((i) => `${i.path.join(".") || "(raiz)"}: ${i.message}`) };
        }
        const e = parsed.data;
        const errors: string[] = [];

        if (!/^https?:\/\//i.test(e.source_url)) {
            errors.push(
                "Entrada de catálogo exige 'source_url' externo (http/https): a fonte oficial consultada. " +
                "Conhecimento sem fonte rastreável é palpite, não catálogo."
            );
        }
        for (const campo of ["what_it_is", "when_to_use", "requires"] as const) {
            if (!e[campo].trim()) errors.push(`Campo obrigatório vazio: '${campo}'.`);
        }
        if (!e.confidence.trim()) e.confidence = "media";

        // Mesma proteção do backlog: catálogo ilegível não é catálogo vazio.
        const sonda = MethodologyCatalogService.probe(repoRoot);
        if (sonda.status === "ILEGIVEL") {
            return {
                ok: false,
                errors: [
                    `RECUSADO: o catálogo existe em disco e está ILEGÍVEL — ${sonda.detail}`,
                    "Gravar agora apagaria todas as metodologias já absorvidas. Corrija o arquivo antes."
                ]
            };
        }
        const cat = sonda.catalog ?? { schemaVersion: 1 as const, updatedAt: "", source_note: "", entries: [] };
        const i = cat.entries.findIndex((x) => x.id === e.id);
        if (i >= 0 && !atualizar) errors.push(`Já existe entrada "${e.id}" no catálogo. Para alterá-la, passe atualizar=true.`);
        if (i < 0 && atualizar) errors.push(`Nenhuma entrada "${e.id}" para atualizar.`);
        if (errors.length) return { ok: false, errors };

        if (i >= 0) cat.entries[i] = { ...cat.entries[i], ...e };
        else cat.entries.push(e);
        cat.updatedAt = agora();

        const p = MethodologyCatalogService.catalogPath(repoRoot);
        fs.mkdirSync(path.dirname(p), { recursive: true });
        fs.writeFileSync(p, JSON.stringify(CatalogSchema.parse(cat), null, 2));

        // O status NÃO é escrito: continua derivado do disco a cada consulta (RV-02).
        const rel = MethodologyCatalogService.resolve(repoRoot, cat);
        const dela = rel.entries.find((x) => x.id === e.id);
        return {
            ok: true, errors: [],
            resultado: { id: e.id, acao: i >= 0 ? "atualizada" : "absorvida", total: cat.entries.length, status_derivado: dela?.status_in_system }
        };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Criação de metodologia (esqueleto) e validação de metodologia existente
// ─────────────────────────────────────────────────────────────────────────────

export const NovaMetodologiaSchema = z.object({
    id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "id em kebab-case, minúsculas"),
    name: z.string().min(1),
    review_type: z.string().min(1),
    description: z.string().min(1),
    /** Padrão(ões) externos que a governam, por id de `.claude/standards/`. */
    standards: z.array(z.string()).default([]),
    question_frameworks: z.array(z.string()).default([]),
    /** Caminho do protocolo próprio que autoriza a extensão (RV-11). */
    protocol_path: z.string().min(1),
    protocol_locked: z.boolean()
});

export class MethodologyWriter {
    /**
     * Cria o ESQUELETO de uma metodologia nova em `.claude/methodologies/<id>/`.
     *
     * Metodologia nova é EXTENSAO pelo RV-11, então exige protocolo próprio TRAVADO — a
     * mesma condição que `validate_system_change` cobra. A tool recusa sem isso, para que a
     * criação não vire o caminho fácil de contornar o gate.
     *
     * Escreve esqueleto com `[TBD]`, nunca conteúdo inventado (RV-03). Preencher a spec é
     * trabalho de metodologia, não de scaffold.
     */
    static criar(repoRoot: string, bruto: unknown): Escrita {
        const parsed = NovaMetodologiaSchema.safeParse(bruto);
        if (!parsed.success) {
            return { ok: false, errors: parsed.error.issues.map((i) => `${i.path.join(".") || "(raiz)"}: ${i.message}`) };
        }
        const m = parsed.data;
        const errors: string[] = [];

        if (!m.protocol_locked) {
            errors.push(
                "Metodologia nova é EXTENSAO e exige protocolo próprio TRAVADO ('protocol_locked': true) — RV-11. " +
                "Extensão sob protocolo em rascunho é exatamente a deriva que a regra impede."
            );
        }
        const prot = path.isAbsolute(m.protocol_path) ? m.protocol_path : path.join(repoRoot, m.protocol_path);
        if (!fs.existsSync(prot)) errors.push(`Protocolo declarado não existe no disco: ${m.protocol_path}`);

        const dir = path.join(repoRoot, ".claude", "methodologies", m.id);
        if (fs.existsSync(dir)) errors.push(`Já existe metodologia "${m.id}".`);

        for (const s of m.standards) {
            if (!fs.existsSync(path.join(repoRoot, ".claude", "standards", `${s}.json`))) {
                errors.push(
                    `Padrão declarado "${s}" não existe em .claude/standards/. Uma metodologia sem o padrão ` +
                    "como dado não consegue gerar o checklist de conformidade dela."
                );
            }
        }
        if (errors.length) return { ok: false, errors };

        fs.mkdirSync(dir, { recursive: true });
        const manifest = {
            id: m.id, name: m.name, review_type: m.review_type, description: m.description,
            spec: "spec.md", protocol_template: "protocol_template.md",
            conformance: { standards: m.standards },
            question_frameworks: m.question_frameworks,
            default_question_framework: m.question_frameworks[0] ?? "[TBD]",
            // DEBT-100: a trilha é LISTA de etapas, e a ordem é a posição. O esqueleto traz uma
            // etapa com todos os campos por declarar — o que `errosDaTrilha` reconhece e recusa.
            phases: [{
                id: "[TBD]", name: "[TBD]", role: "[TBD]", closes_with: "[TBD]",
                producer_tools: [], active: true,
            }],
            invariants_always_on: ["RV-01", "RV-02", "RV-03", "RV-04", "RV-05", "RV-06", "RV-07", "RV-08"],
            gates: [],
            required_supplements: [],
            _scaffold: {
                criado_em: agora(),
                protocolo: m.protocol_path,
                aviso: "ESQUELETO. Nenhum campo [TBD] pode chegar a uso real (RV-03). 'gates' vazio: " +
                    "declarar invariante sem gate que o ative é o achado DEBT-003."
            }
        };
        fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));
        fs.writeFileSync(path.join(dir, "spec.md"),
            `# ${m.name}\n\n<!-- ESQUELETO gerado em ${agora().slice(0, 10)} sob ${m.protocol_path} -->\n\n` +
            `${m.description}\n\n## Fases\n\n[TBD] — declarar as fases e os subitens obrigatórios.\n\n` +
            `## Mapeamento para o padrão\n\n[TBD] — cada subitem da trilha precisa apontar o item do padrão que atende.\n`);
        fs.writeFileSync(path.join(dir, "protocol_template.md"),
            `# Protocolo — ${m.name}\n\n**Estado:** [DRAFT]\n\n[TBD]\n`);

        return { ok: true, errors: [], resultado: { id: m.id, criada_em: path.relative(repoRoot, dir), arquivos: ["manifest.json", "spec.md", "protocol_template.md"] } };
    }

    /**
     * Valida uma metodologia existente — a verificação que falta para ALTERAÇÕES.
     *
     * Mudar uma metodologia é editar `spec.md`/`manifest.json`; não cabe tool para edição
     * arbitrária de texto. O controle certo é: RV-11 antes, e esta validação depois.
     *
     * Pega automaticamente o DEBT-003: invariante declarado `always_on` sem gate que o ative.
     */
    static validar(repoRoot: string, id: string): Escrita {
        const dir = path.join(repoRoot, ".claude", "methodologies", id);
        if (!fs.existsSync(dir)) return { ok: false, errors: [`Metodologia "${id}" não existe.`] };

        const errors: string[] = [];
        const mp = path.join(dir, "manifest.json");
        if (!fs.existsSync(mp)) return { ok: false, errors: [`"${id}" sem manifest.json.`] };

        let man: any;
        try { man = JSON.parse(fs.readFileSync(mp, "utf-8")); }
        catch (e: any) { return { ok: false, errors: [`manifest.json ilegível: ${e.message}`] }; }

        const spec = man.spec ?? "spec.md";
        const specPath = path.isAbsolute(spec) ? spec : path.join(dir, spec);
        if (!fs.existsSync(specPath)) errors.push(`spec declarada ("${spec}") não existe.`);

        // DEBT-100 — a trilha é dado que o runtime LÊ: etapa malformada não é estética, é
        // projeto que nasce numa etapa que ninguém declarou ou fase que nunca avança.
        for (const e of errosDaTrilha(man.phases, path.join(repoRoot, ".claude", "agents"))) {
            errors.push(`Trilha: ${e}.`);
        }
        const etapas: any[] = Array.isArray(man.phases) ? man.phases : [];
        // `producer_tools` é o que permite dizer se um item do padrão é produzido por código
        // ou só pelo agente (DEBT-140, conferência c). Tool que não existe ali é afirmação falsa.
        const existentes = new Set(AgentOrchestrator.getGovernedTools());
        for (const e of etapas) {
            for (const t of Array.isArray(e?.producer_tools) ? e.producer_tools : []) {
                if (!existentes.has(String(t))) {
                    errors.push(`Trilha: a etapa ${e.id} declara que a tool "${t}" grava seu artefato, e essa tool não existe.`);
                }
            }
        }

        const inv: string[] = man.invariants_always_on ?? [];
        const gates: any[] = man.gates ?? [];
        const idsDaTrilha = new Set(etapas.map((e) => String(e?.id ?? "")));
        for (const g of gates) {
            if (etapas.length && g?.phase && !idsDaTrilha.has(String(g.phase))) {
                errors.push(`Gate ${g.rule} declarado na etapa "${g.phase}", que não existe na trilha do método.`);
            }
        }
        const comGate = new Set(gates.map((g) => g.rule));
        const semGate = inv.filter((r) => !comGate.has(r));
        if (semGate.length) {
            errors.push(
                `Invariante(s) declarado(s) 'always_on' sem gate que os ative: ${semGate.join(", ")}. ` +
                "É a falha que o sistema registra de si: regra declarada que ninguém chama (DEBT-003)."
            );
        }

        const stds: string[] = man.conformance?.standards ?? [];
        if (stds.length === 0) {
            errors.push("Sem 'conformance.standards': a metodologia não declara contra que padrão verifica (DEBT-004).");
        }
        for (const s of stds) {
            if (!fs.existsSync(path.join(repoRoot, ".claude", "standards", `${s}.json`))) {
                errors.push(`Padrão "${s}" declarado mas ausente de .claude/standards/ — checklist não pode ser gerado.`);
            }
        }

        const bruto = fs.existsSync(specPath) ? fs.readFileSync(specPath, "utf-8") : "";

        // CAMPO pendente ≠ REGRA documentada. A spec cita `[TBD]` ao explicar o RV-03
        // ("campos ausentes são [TBD], nunca inventados") — inclusive dentro da tabela de
        // invariantes. Contar menção como lacuna reprovaria a metodologia por estar bem
        // documentada, que é o inverso do que se quer.
        //
        // O que marca campo por preencher é o mesmo marcador do template de protocolo, que
        // o auditor já reconhece: `[PREENCHIMENTO OBRIGATÓRIO` ou `[TBD]` ocupando o campo
        // sozinho — não citado no meio de uma frase.
        const tbd = bruto.split("\n").filter((l) => {
            if (/\[PREENCHIMENTO OBRIGAT/i.test(l)) return true;
            // `[TBD]` isolado numa célula de tabela: "| campo | [TBD] |"
            return /\|\s*\[TBD\]\s*\|/.test(l);
        }).length;

        // METODOLOGIA SE ASSIMILA COMPLETA, OU NÃO ENTRA. `tbd_na_spec` era contado e
        // reportado sem reprovar: uma spec com campo por preencher passava na validação.
        //
        // Decisão do pesquisador (04/10/2026): "as metodologias sempre devem ser assimiladas
        // completas (...) normalmente são textos que não ocupam espaço substancial em disco
        // ou no servidor MCP e não geram dificuldade". Os números confirmam — o maior padrão
        // tem 12 KB e as duas metodologias somam 58 KB. Não há custo que justifique
        // assimilação parcial, e meia assimilação é o que produz trilha que executa sem que
        // o sistema saiba explicá-la (DEBT-126) ou que declare conformidade sem lastro.
        //
        // `[TBD]` é conduta legítima no RASCUNHO (RV-03: declarar a lacuna em vez de
        // inventar valor). O que não pode é uma metodologia EM USO carregá-lo.
        if (tbd > 0) {
            errors.push(
                `Spec com ${tbd} campo(s) [TBD]: metodologia se assimila COMPLETA. ` +
                "Texto de norma não ocupa espaço que justifique assimilação parcial, e método " +
                "meio assimilado executa trilha que o sistema não sabe fundamentar ao pesquisador."
            );
        }

        return {
            ok: errors.length === 0, errors,
            resultado: { id, etapas: etapas.length, invariantes: inv.length, gates: gates.length, padroes: stds, tbd_na_spec: tbd }
        };
    }
}
