import { describe, it, expect, afterEach } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { ProjectStateService } from "../src/services/project_state.js";

/**
 * RV-04 como TRAVA, não como convenção (DEBT-037).
 *
 * "A decisão é do pesquisador" existia em seis comentários no código e em nenhuma
 * verificação. O escritor — `logDecision` — existia e nenhuma tool o chamava: o sistema não
 * registrava decisão nenhuma, logo não tinha como afirmar que houve supervisão humana.
 *
 * Isso deixou de ser higiene quando o RAISE 3 entrou no quadro: a categoria (e) do RAISE
 * classifica "síntese agêntica ponta a ponta executada AUTONOMAMENTE" como inaceitável, e o
 * argumento de que o ReviewBR escapa dela depende de supervisão humana DEMONSTRÁVEL.
 */
describe("RV-04 — a fase só avança com decisão registrada do pesquisador", () => {
    const dirs: string[] = [];
    afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });

    function projeto(control_level: "estrito" | "fluido" = "estrito"): string {
        const p = fs.mkdtempSync(path.join(os.tmpdir(), "rv04-"));
        dirs.push(p);
        ProjectStateService.init(p, {
            method: "prisma-sr", framework: "PICOS", reviewType: "Revisão Sistemática", topic: "t", phase: "F0",
        });
        ProjectStateService.setControlLevel(p, control_level);
        return p;
    }

    it("BLOQUEIA o avanço sem decisão registrada", () => {
        const r = ProjectStateService.podeAvancar(projeto(), "F4");
        expect(r.ok).toBe(false);
        expect(r.motivo).toMatch(/RV-04/);
    });

    it("LIBERA com a contribuição específica do pesquisador", () => {
        const p = projeto();
        ProjectStateService.logDecision(p, {
            phase: "F4", agent: "screener", por: "pesquisador",
            decision: "triagem TA conferida",
            contribuicao: "Revisei os 12 MAYBE; incluí 4 por desfecho secundário e excluí 8 por EX-03.",
        });
        expect(ProjectStateService.podeAvancar(p, "F4").ok).toBe(true);
    });

    it("um 'ok' genérico NÃO destrava — carimbo não é supervisão", () => {
        // É a diferença entre o pesquisador decidir e o pesquisador assinar embaixo.
        // Sem dizer o que avaliou e o que escolheu, não há o que sustente a
        // responsabilidade que o RAISE 1 (rec. 4.1) atribui ao autor humano.
        const p = projeto();
        ProjectStateService.logDecision(p, {
            phase: "F4", agent: "screener", por: "pesquisador", decision: "ok", contribuicao: "   ",
        });
        expect(ProjectStateService.podeAvancar(p, "F4").ok).toBe(false);
    });

    it("decisão do SISTEMA não destrava a si mesma", () => {
        const p = projeto();
        ProjectStateService.logDecision(p, {
            phase: "F4", agent: "screener", por: "sistema",
            decision: "triagem concluída", contribuicao: "12 incluídos, 40 excluídos.",
        });
        expect(ProjectStateService.podeAvancar(p, "F4").ok).toBe(false);
    });

    it("decisão de OUTRA fase não destrava esta", () => {
        const p = projeto();
        ProjectStateService.logDecision(p, {
            phase: "F3", agent: "screener", por: "pesquisador",
            decision: "dedup conferida", contribuicao: "Conferi os 8 pares removidos por DOI.",
        });
        expect(ProjectStateService.podeAvancar(p, "F4").ok).toBe(false);
    });

    it("'fluido' avança sem decisão — mas DECLARA que foi automático", () => {
        // `fluido` não é exceção à regra: é escolha declarada do pesquisador para trabalho
        // exploratório. O que ela não pode ser é silenciosa.
        const r = ProjectStateService.podeAvancar(projeto("fluido"), "F4");
        expect(r.ok).toBe(true);
        expect(r.motivo).toMatch(/fluido/);
        expect(r.motivo).toMatch(/sem decisão registrada/);
    });

    it("sem project_state.json não avança — não há o que verificar", () => {
        const vazio = fs.mkdtempSync(path.join(os.tmpdir(), "rv04-vazio-"));
        dirs.push(vazio);
        expect(ProjectStateService.podeAvancar(vazio, "F4").ok).toBe(false);
    });
});

/**
 * RV-03 — `patch` não inventa a metodologia da revisão.
 *
 * A versão anterior criava o estado com `method: "prisma-sr", framework: "PICOS"` quando o
 * arquivo não existia. Inofensivo enquanto ninguém lê `state.method` — e fatal no dia em
 * que o runtime ler o manifest a partir dele (DEBT-121): uma revisão de escopo cujo estado
 * se perdesse viraria sistemática em silêncio, e o `ProtocolGate` não veria (só olha status).
 */
describe("RV-03 — o estado não fabrica método por omissão", () => {
    const dirs: string[] = [];
    afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });

    it("patch em projeto SEM estado falha, em vez de inventar prisma-sr/PICOS", () => {
        const vazio = fs.mkdtempSync(path.join(os.tmpdir(), "rv03-"));
        dirs.push(vazio);
        expect(() => ProjectStateService.patch(vazio, { status: "LOCKED" })).toThrow(/ausente ou ilegível/);
        expect(fs.existsSync(path.join(vazio, "project_state.json"))).toBe(false);
    });

    it("patch em projeto COM estado preserva o método declarado — controle positivo", () => {
        const p = fs.mkdtempSync(path.join(os.tmpdir(), "rv03-ok-"));
        dirs.push(p);
        ProjectStateService.init(p, {
            method: "scoping-prisma-scr", framework: "PCC", reviewType: "Revisão de Escopo", topic: "t", phase: "F0",
        });
        const depois = ProjectStateService.patch(p, { status: "LOCKED" });
        expect(depois.method).toBe("scoping-prisma-scr");
        expect(depois.framework).toBe("PCC");
    });
});
