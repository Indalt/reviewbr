import { describe, it, expect, afterEach } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { registrarDecisaoDoPesquisador } from "../src/services/method_trail.js";
import { ProjectStateService } from "../src/services/project_state.js";

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.slice(1)), "..", "..", "..");

/**
 * DEBT-143 — a trava do RV-04 não tinha escritor legítimo. `podeAvancar` exige decisão do
 * pesquisador com contribuição específica; `logDecision` não tinha chamador e nenhuma tool
 * gravava decisão, então sob 'estrito' a fase só avançava editando o project_state.json à mão.
 * `record_researcher_decision` é o escritor, e confere a regra da trava NA ESCRITA.
 */

const dirs: string[] = [];
afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });

function projeto(method = "prisma-sr", phase = "F0"): string {
    const p = fs.mkdtempSync(path.join(os.tmpdir(), "decisao-"));
    dirs.push(p);
    ProjectStateService.init(p, { method, framework: "x", reviewType: "x", topic: "t", phase });
    return p;
}

describe("o que NÃO conta como decisão é recusado na escrita", () => {
    for (const carimbo of ["ok", "Pode seguir!", "aprovado.", "  sim  ", "Tudo certo"]) {
        it(`"${carimbo}" é carimbo — nada é gravado`, () => {
            const p = projeto();
            const r = registrarDecisaoDoPesquisador(REPO, p, { etapa: "F3", contribuicao: carimbo });
            expect(r.ok).toBe(false);
            expect(r.mensagem).toMatch(/carimbo não é decisão/);
            expect(ProjectStateService.read(p)!.decisions).toEqual([]);
        });
    }

    it("etapa que a trilha do método não tem é recusada, com as etapas que existem", () => {
        const r = registrarDecisaoDoPesquisador(REPO, projeto(), { etapa: "F9", contribuicao: "conferi os pares removidos" });
        expect(r.ok).toBe(false);
        expect(r.mensagem).toMatch(/não existe na trilha.*F0, F1, F2/);
    });

    it("etapa que não se aplica ao método (F6 no escopo) não tem o que decidir", () => {
        const r = registrarDecisaoDoPesquisador(REPO, projeto("scoping-prisma-scr"), { etapa: "F6", contribuicao: "avaliei o risco de viés" });
        expect(r.ok).toBe(false);
        expect(r.mensagem).toMatch(/não se aplica/);
    });
});

describe("decisão com contribuição específica destrava a etapa", () => {
    it("grava por: pesquisador, com as palavras dele, e a trava passa a abrir", () => {
        const p = projeto();
        const r = registrarDecisaoDoPesquisador(REPO, p, { etapa: "F3", contribuicao: "Conferi os 14 pares removidos; mantenho a deduplicação." });
        expect(r.ok).toBe(true);
        const d = ProjectStateService.read(p)!.decisions[0];
        expect(d).toMatchObject({ phase: "F3", por: "pesquisador", contribuicao: "Conferi os 14 pares removidos; mantenho a deduplicação." });
        expect(ProjectStateService.podeAvancar(p, "F3").ok).toBe(true);
    });

    it("com o artefato da etapa já gravado, a fase avança na hora", () => {
        const p = projeto("prisma-sr", "F2");
        fs.mkdirSync(path.join(p, "02_deduplicated"), { recursive: true });
        fs.writeFileSync(path.join(p, "02_deduplicated", "dataset.json"), "[]");
        const r = registrarDecisaoDoPesquisador(REPO, p, { etapa: "F3", contribuicao: "Conferi os pares e mantenho." });
        expect(r.mensagem).toMatch(/a fase avançou para F3/);
        expect(ProjectStateService.read(p)!.phase).toBe("F3");
    });

    it("sem o artefato, registra e espera a tool da etapa", () => {
        const p = projeto("prisma-sr", "F2");
        const r = registrarDecisaoDoPesquisador(REPO, p, { etapa: "F3", contribuicao: "Pode deduplicar por DOI e título." });
        expect(r.ok).toBe(true);
        expect(r.mensagem).toMatch(/ainda não existe/);
        expect(ProjectStateService.read(p)!.phase).toBe("F2");
    });

    it("decisão sobre etapa já passada é registro: a fase não volta", () => {
        const p = projeto("prisma-sr", "F4");
        fs.mkdirSync(path.join(p, "02_deduplicated"), { recursive: true });
        fs.writeFileSync(path.join(p, "02_deduplicated", "dataset.json"), "[]");
        registrarDecisaoDoPesquisador(REPO, p, { etapa: "F3", contribuicao: "Registro tardio: mantenho os pares removidos." });
        expect(ProjectStateService.read(p)!.phase).toBe("F4");
    });
});
