import { describe, it, expect, afterEach } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
    lerTrilha, errosDaTrilha, etapaDoArtefato, etapaSeguinte, etapaInicial, etapaDoSubitem, avancarPorArtefato,
} from "../src/services/method_trail.js";
import { metodosParaTipo } from "../src/services/methods_for_type.js";
import { ProjectStateService } from "../src/services/project_state.js";
import { ProjectInitService } from "../src/services/project_init.js";
import { ProtocolDesignAuditor } from "../src/services/protocol_auditor.js";

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.slice(1)), "..", "..", "..");
const SRC = path.resolve(REPO, "reviewbr", "reviewbr-mcp", "src");

/**
 * DEBT-100 — FASES COMO DADO.
 *
 * O manifest declarava um interruptor por fase; as fases mesmas estavam escritas no código
 * ("F1" ao nascer, "F2" ao travar, "F3"/"F4" depois da deduplicação e da triagem). Um método
 * de outra FORMA só cabia encaixado em oito fases vindas do PRISMA. Estes testes guardam as
 * duas metades: a trilha sai do manifest, e o código não carrega mais a forma de um método.
 */

const temporarios: string[] = [];
afterEach(() => { for (const d of temporarios.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });

/** Repositório de brinquedo com UM método de forma não-PRISMA — o caso que antes não se expressava. */
function repoComMetodoDeCampo(): string {
    const raiz = fs.mkdtempSync(path.join(os.tmpdir(), "trilha-"));
    temporarios.push(raiz);
    fs.mkdirSync(path.join(raiz, ".claude", "agents"), { recursive: true });
    for (const a of ["designer", "librarian"]) fs.writeFileSync(path.join(raiz, ".claude", "agents", `${a}.md`), `# ${a}\n`);
    const dir = path.join(raiz, ".claude", "methodologies", "campo-x");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "spec.md"), "# campo\n");
    fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify({
        id: "campo-x", name: "Pesquisa de campo X", spec: "spec.md", serves_research_types: ["campo"],
        default_question_framework: "livre",
        phases: [
            { id: "C1", name: "Definir corpus", role: "designer", closes_with: "protocol.md", producer_tools: ["plan_research_protocol"] },
            { id: "C2", name: "Trabalho de campo", role: "librarian", closes_with: "campo/", producer_tools: [] },
            { id: "C3", name: "Transcrição", role: "librarian", closes_with: "transcricoes/indice.md", producer_tools: [] },
            { id: "C4", name: "Saturação", active: false, note: "não se aplica a este desenho" },
        ],
    }));
    return raiz;
}

function projeto(method: string, control_level: "estrito" | "fluido" = "estrito"): string {
    const p = fs.mkdtempSync(path.join(os.tmpdir(), "proj-trilha-"));
    temporarios.push(p);
    ProjectStateService.init(p, { method, framework: "x", reviewType: "x", topic: "t", phase: "F0", control_level });
    return p;
}

describe("a trilha dos métodos instalados sai do manifest", () => {
    it("prisma-sr: as dez etapas, na ordem, cada uma com papel e artefato de encerramento", () => {
        const t = lerTrilha(REPO, "prisma-sr");
        expect(t.erros).toEqual([]);
        expect(t.etapas.map((e) => e.id)).toEqual(["F0", "F1", "F2", "F3", "F4", "F5", "F5_5", "F6", "F7", "F8"]);
        for (const e of t.etapas) {
            expect(e.role, e.id).not.toBe("");
            expect(e.closes_with, e.id).not.toBe("");
        }
    });

    it("scoping: a F6 não se aplica — declarado, com o motivo, e a trilha a pula", () => {
        const t = lerTrilha(REPO, "scoping-prisma-scr");
        expect(t.erros).toEqual([]);
        const f6 = t.etapas.find((e) => e.id === "F6")!;
        expect(f6.active).toBe(false);
        expect(f6.note).toMatch(/Não se aplica/);
        expect(etapaSeguinte(t.etapas, "F5_5")?.id).toBe("F7");
    });

    it("o artefato diz a etapa — pela trilha, não por literal no código", () => {
        const { etapas } = lerTrilha(REPO, "prisma-sr");
        expect(etapaDoArtefato(etapas, "02_deduplicated/dataset.json")?.id).toBe("F3");
        expect(etapaDoArtefato(etapas, "03_screening/included_ta.json")?.id).toBe("F4");
        expect(etapaDoArtefato(etapas, "03_screening/included.json")?.id).toBe("F4");
        // pasta: qualquer arquivo dentro de 01_raw/ pertence à busca
        expect(etapaDoArtefato(etapas, "01_raw/openalex_2026-10-09.json")?.id).toBe("F2");
        // o protocol.md encerra pré-registro E protocolo da questão: vale a última
        expect(etapaDoArtefato(etapas, "protocol.md")?.id).toBe("F1");
        expect(etapaSeguinte(etapas, "F1")?.id).toBe("F2");
        expect(etapaInicial(etapas)?.id).toBe("F0");
        expect(etapaDoArtefato(etapas, "arquivo/que/ninguem/declara.json")).toBeNull();
    });

    it("subitem da spec pertence à etapa do seu prefixo; suplemento não pertence a etapa", () => {
        const { etapas } = lerTrilha(REPO, "prisma-sr");
        expect(etapaDoSubitem(etapas, "F2.1.1.4")?.id).toBe("F2");
        expect(etapaDoSubitem(etapas, "F8.3.6")?.id).toBe("F8");
        expect(etapaDoSubitem(etapas, "SUP.1")).toBeNull();
    });
});

describe("um método de outra FORMA passa a ser expressável", () => {
    it("corpus → campo → transcrição: a trilha é lida e o método é escolhível", () => {
        const raiz = repoComMetodoDeCampo();
        const t = lerTrilha(raiz, "campo-x");
        expect(t.erros).toEqual([]);
        expect(t.etapas.map((e) => e.id)).toEqual(["C1", "C2", "C3", "C4"]);
        expect(etapaSeguinte(t.etapas, "C1")?.id).toBe("C2");
        expect(etapaSeguinte(t.etapas, "C3")).toBeNull(); // C4 desligada: não há próxima ativa
        expect(metodosParaTipo(raiz, "campo")[0].incompleto).toEqual([]);
    });

    it("artefato que a trilha do método não declara NÃO avança fase — e diz por quê", () => {
        const raiz = repoComMetodoDeCampo();
        const p = projeto("campo-x", "fluido");
        const r = avancarPorArtefato(raiz, p, "02_deduplicated/dataset.json");
        expect(r.ok).toBe(false);
        expect(r.etapa).toBeNull();
        expect(r.aviso).toMatch(/não declara etapa encerrada por 02_deduplicated\/dataset.json/);
        expect(ProjectStateService.read(p)!.phase).toBe("F0");
    });

    it("artefato declarado avança para a etapa DO MÉTODO (sob fluido, sem decisão)", () => {
        const raiz = repoComMetodoDeCampo();
        const p = projeto("campo-x", "fluido");
        const r = avancarPorArtefato(raiz, p, "campo/entrevista-01.md");
        expect(r.ok).toBe(true);
        expect(r.etapa).toBe("C2");
        expect(ProjectStateService.read(p)!.phase).toBe("C2");
    });
});

describe("RV-04 continua igual — só a origem do id da etapa mudou", () => {
    it("estrito sem decisão: a deduplicação grava, a fase NÃO avança", () => {
        const p = projeto("prisma-sr");
        const r = avancarPorArtefato(REPO, p, "02_deduplicated/dataset.json");
        expect(r.etapa).toBe("F3");
        expect(r.ok).toBe(false);
        expect(r.aviso).toMatch(/RV-04/);
        expect(ProjectStateService.read(p)!.phase).toBe("F0");
    });

    it("estrito com decisão do pesquisador sobre a etapa: avança", () => {
        const p = projeto("prisma-sr");
        const s = ProjectStateService.read(p)!;
        s.decisions.push({ phase: "F3", agent: "screener", por: "pesquisador", decision: "d", contribuicao: "conferi os pares removidos", ts: "x" });
        ProjectStateService.write(p, s);
        const r = avancarPorArtefato(REPO, p, "02_deduplicated/dataset.json");
        expect(r.ok).toBe(true);
        expect(ProjectStateService.read(p)!.phase).toBe("F3");
    });

    it("projeto sem estado: não inventa método, não avança", () => {
        const vazio = fs.mkdtempSync(path.join(os.tmpdir(), "sem-estado-"));
        temporarios.push(vazio);
        const r = avancarPorArtefato(REPO, vazio, "02_deduplicated/dataset.json");
        expect(r.ok).toBe(false);
        expect(fs.existsSync(path.join(vazio, "project_state.json"))).toBe(false);
    });
});

describe("formato antigo e esqueleto são recusados com o motivo", () => {
    it("mapa de interruptores não diz quais etapas existem", () => {
        expect(errosDaTrilha({ F0: { name: "x", active: true } })[0]).toMatch(/formato antigo/);
    });
    it("etapa desligada sem motivo: não se aplicar precisa ser declarado", () => {
        expect(errosDaTrilha([{ id: "A", name: "a", active: false }]).join(" ")).toMatch(/sem 'note'/);
    });
    it("etapa sem producer_tools: a ausência de código precisa ser dita, não presumida", () => {
        expect(errosDaTrilha([{ id: "A", name: "a", role: "r", closes_with: "x.md" }]).join(" ")).toMatch(/producer_tools/);
    });
});

describe("o protocolo gerado lista a trilha DO MÉTODO", () => {
    const meta = { label: "Revisão", prismaStandard: "", requiresRegistration: false, registrationPlatform: "N/A", description: "" };
    const gerar = (method: string) => (new ProjectInitService() as any).generateProtocol(
        { name: "p", userId: "u", researchType: "systematic_review", topic: "t" }, meta, "padrão", method, lerTrilha(REPO, method).etapas,
    ) as string;

    it("a F6 do prisma-sr é risco de viés e a síntese é a F7 — o template antigo chamava a F6 de Síntese", () => {
        const txt = gerar("prisma-sr");
        expect(txt).toMatch(/\*\*F6 — Risco de viés\*\*/);
        expect(txt).toMatch(/\*\*F7 — Síntese\*\*/);
        expect(txt).not.toMatch(/F6 — Síntese/);
    });

    it("no scoping a F6 aparece como não aplicável, com o motivo", () => {
        expect(gerar("scoping-prisma-scr")).toMatch(/~~F6 — Risco de viés~~ — não se aplica a este método: Não se aplica a scoping/);
    });

    it("os rótulos F4.1.2/F4.1.3 seguem dentro de 'Processo de Seleção' — o auditor do protocolo os acha", () => {
        const a = new ProtocolDesignAuditor();
        const txt = gerar("prisma-sr");
        // controle positivo: como gerado, os campos estão por preencher e o auditor acusa
        expect(a.auditContent(txt).errors.join(" ")).toMatch(/Processo de seleção incompleto/);
        const preenchido = txt
            .replace(/(\*\*F4\.1\.2 Processo de triagem:\*\*) \[[^\]]*\]/, "$1 Duplo independente, dois triadores sem ver a decisão do outro")
            .replace(/(\*\*F4\.1\.3 Ferramenta utilizada:\*\*) \[[^\]]*\]/, "$1 Planilha compartilhada em duas abas separadas")
            .replace(/(\*\*Resolução de discordâncias:\*\*) \[[^\]]*\]/, "$1 Terceiro revisor decide e o motivo é registrado");
        expect(a.auditContent(preenchido).errors.join(" ")).not.toMatch(/Processo de seleção incompleto/);
    });

    it("preenchido o que o protocolo gerado pede, o auditor aprova — o template traz as seções F0.3 que ele exige", () => {
        // Antes, o template não tinha Justificativa, Revisões Anteriores, Lacuna nem Relevância:
        // quem seguisse a instrução do próprio arquivo era reprovado por falta delas.
        const tudo = gerar("prisma-sr")
            .replace(/(## Estratégia de Busca \(Sintaxe\)\n)\[PREENCHIMENTO OBRIGATÓRIO:[^\]]*\]/, "$1(termo OR sinonimo) AND (conceito OR variante)")
            .replace(/\[PREENCHIMENTO OBRIGATÓRIO:[^\]]*\]/g, "Declaração feita pelo pesquisador, com o conteúdo pedido por este campo do protocolo.");
        const r = new ProtocolDesignAuditor().auditContent(tudo);
        expect(r.errors).toEqual([]);
        expect(r.valid).toBe(true);
    });
});

describe("nenhuma fase escrita no código", () => {
    // O que o DEBT-100 tirou: `podeAvancar(dir, "F3")`, `setPhase(dir, "F4")`, `phase: "F1"`/`"F2"`.
    const LITERAL_DE_FASE = /(podeAvancar|setPhase)\([^)]*["'`]F\d|phase:\s*["'`]F\d/;

    it("src/ não carrega id de etapa como literal de estado", () => {
        const sujos: string[] = [];
        const varrer = (d: string) => {
            for (const e of fs.readdirSync(d, { withFileTypes: true })) {
                const p = path.join(d, e.name);
                if (e.isDirectory()) varrer(p);
                else if (e.name.endsWith(".ts")) {
                    fs.readFileSync(p, "utf-8").split("\n").forEach((l, i) => {
                        if (LITERAL_DE_FASE.test(l)) sujos.push(`${path.relative(SRC, p)}:${i + 1}`);
                    });
                }
            }
        };
        varrer(SRC);
        expect(sujos).toEqual([]);
    });

    it("o padrão acha o literal quando ele existe — controle positivo", () => {
        expect(LITERAL_DE_FASE.test(`ProjectStateService.podeAvancar(dir, "F3")`)).toBe(true);
        expect(LITERAL_DE_FASE.test(`{ status: "LOCKED", phase: "F2" }`)).toBe(true);
        expect(LITERAL_DE_FASE.test(`avancarPorArtefato(RAIZ(), dir, "02_deduplicated/dataset.json")`)).toBe(false);
    });
});

describe("revisão de 09/10 — robustez da leitura da trilha", () => {
    it("[TBD] citado numa note não é esqueleto: o critério é estrutural, não textual", () => {
        expect(errosDaTrilha([{ id: "A", name: "a", role: "r", closes_with: "x.md", producer_tools: [],
            note: "Campo sem dado recebe [TBD], nunca valor inventado (RV-03)." }])).toEqual([]);
        expect(errosDaTrilha([{ id: "[TBD]", name: "[TBD]", role: "[TBD]", closes_with: "[TBD]", producer_tools: [] }]).join(" "))
            .toMatch(/esqueleto do scaffold/);
    });

    it("estado sem 'method' não derruba a tool: a trilha devolve o erro, não lança", () => {
        const t = lerTrilha(REPO, undefined as unknown as string);
        expect(t.etapas).toEqual([]);
        expect(t.erros.join(" ")).toMatch(/não declara 'method'/);
    });
});
