import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { writeScreening } from "../src/services/project_artifacts.js";
import { ProjectStateService } from "../src/services/project_state.js";

// DEBT-112 — a segunda corrida de triagem apagava a primeira sem registro. Decisão do Vicente de
// 08/10/2026: sobrescrever pode, depois da análise do pesquisador; sem registro do que havia, do
// que passa a haver e de quem autorizou, não.
const r = (decision: string, id: string) => ({ decision, score: 1, reasoning: "x", record: { identifier: id } });

describe("DEBT-112 — substituir uma triagem gravada exige autorização e deixa registro", () => {
    const dirs: string[] = [];
    afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });
    function projeto(comEstado = false): string {
        const p = fs.mkdtempSync(path.join(os.tmpdir(), "subst-"));
        dirs.push(p);
        if (comEstado) {
            fs.writeFileSync(path.join(p, "project_state.json"), JSON.stringify({
                schemaVersion: 1, method: "prisma-sr", framework: "PICOS", reviewType: "sr", topic: "t", userId: "u",
                status: "LOCKED", control_level: "estrito", phase: "F4", createdAt: "x", updatedAt: "x", decisions: [],
            }));
        }
        return p;
    }
    const ler = (p: string, rel: string) => JSON.parse(fs.readFileSync(path.join(p, rel), "utf-8"));

    it("primeira triagem do estágio grava sem pedir nada", () => {
        const p = projeto();
        const w = writeScreening(p, "ta", [r("YES", "a")], [r("NO", "b")]);
        expect(w.substituicao).toBeUndefined();
        expect(ler(p, "03_screening/included_ta.json")).toHaveLength(1);
    });

    it("segunda triagem sem autorização: recusa e não toca na anterior", () => {
        const p = projeto();
        writeScreening(p, "ta", [r("YES", "a")], [r("NO", "b")]);
        expect(() => writeScreening(p, "ta", [], [r("NO", "a"), r("NO", "b")])).toThrow(/autoriza/);
        expect(ler(p, "03_screening/included_ta.json").map((x: any) => x.record.identifier)).toEqual(["a"]);
    });

    it("com autorização: arquiva a anterior, registra a substituição e grava a nova", () => {
        const p = projeto(true);
        writeScreening(p, "ta", [r("YES", "a")], [r("NO", "b")]);
        const w = writeScreening(p, "ta", [], [r("NO", "a"), r("NO", "b")], { autorizacao: "Revi os critérios: refazer a TA com o critério de período corrigido." });

        expect(ler(p, "03_screening/excluded_ta.json")).toHaveLength(2);
        const pasta = w.substituicao!.pasta;
        expect(ler(p, `${pasta}/included_ta.json`).map((x: any) => x.record.identifier)).toEqual(["a"]);
        expect(ler(p, `${pasta}/substituicao.json`)).toMatchObject({
            estagio: "ta",
            autorizacao: "Revi os critérios: refazer a TA com o critério de período corrigido.",
            havia: { incluidos: 1, excluidos: 1 },
            passa_a_haver: { incluidos: 0, excluidos: 2 },
        });

        const d = ProjectStateService.read(p)!.decisions;
        expect(d).toHaveLength(1);
        expect(d[0]).toMatchObject({ por: "pesquisador", phase: "substituicao_triagem_ta", contribuicao: expect.stringContaining("critério de período") });
        // A autorização de substituir não é a decisão sobre a etapa: não destrava a F4.
        expect(ProjectStateService.podeAvancar(p, "F4").ok).toBe(false);
    });

    it("o screen_candidates confere antes de rodar a triagem, para não gastar a corrida", () => {
        const mcp = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
        const index = fs.readFileSync(path.join(mcp, "src", "index.ts"), "utf-8").replace(/\r\n/g, "\n");
        const i = index.indexOf('\n    "screen_candidates",');
        const corpo = index.slice(i, index.indexOf("\nserver.tool(", i + 1));
        const confere = corpo.indexOf("triagemGravada(");
        expect(confere).toBeGreaterThan(0);
        expect(confere).toBeLessThan(corpo.indexOf("screeningService.screenCandidates("));
        expect(corpo).toContain("autorizacao: params.substituicao");
    });
});
