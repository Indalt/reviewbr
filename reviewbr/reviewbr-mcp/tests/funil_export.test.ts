import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { FlowComputer } from "../src/services/flow_computer.js";
import { PrismaFlowValidator } from "../src/services/prisma_validator.js";

// DEBT-071 — a validação RV-05 do compute_flow_counts era circular (os números saem das mesmas
// identidades que depois confere) e a única checagem independente, included.json, não reprovava.
// O fixture é o da reprodução original, que apontava para um scratchpad perdido (DEBT-105).
// DEBT-138 — decisão de 29/10/2026: o export recalcula o funil e bloqueia divergência.
const dirs: string[] = [];
afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });

function projeto(n: { raw: number; dedup: number; exclTa: number; naoRec: number; exclFt: number; incl: number }): string {
    const p = fs.mkdtempSync(path.join(os.tmpdir(), "funil-"));
    dirs.push(p);
    const arr = (k: number, pre: string) => JSON.stringify(Array.from({ length: k }, (_, i) => ({ identifier: `${pre}${i}` })));
    const grava = (rel: string, k: number, pre: string) => {
        fs.mkdirSync(path.dirname(path.join(p, rel)), { recursive: true });
        fs.writeFileSync(path.join(p, rel), arr(k, pre));
    };
    grava("01_raw/database_records.json", n.raw, "r");
    grava("02_deduplicated/dataset.json", n.dedup, "d");
    grava("03_screening/excluded_ta.json", n.exclTa, "t");
    grava("03_screening/fulltext_not_retrieved.json", n.naoRec, "n");
    grava("03_screening/excluded_fulltext.json", n.exclFt, "f");
    grava("03_screening/included.json", n.incl, "i");
    return p;
}
const FIXTURE = { raw: 100, dedup: 80, exclTa: 60, naoRec: 5, exclFt: 10, incl: 5 };

describe("DEBT-071 — a validação do funil deixa de ser circular", () => {
    it("funil com 5 e included.json com 999: reprova", () => {
        const r = new FlowComputer().compute(projeto({ ...FIXTURE, incl: 999 }));
        expect(r.computed.included).toBe(5);
        expect(r.includedCrossCheck.matches).toBe(false);
        expect(r.validation.valid).toBe(false);
        expect(r.validation.errors.join(" ")).toMatch(/included\.json/);
    });

    it("os mesmos artefatos com included.json de 5: aprova", () => {
        expect(new FlowComputer().compute(projeto(FIXTURE)).validation).toEqual({ valid: true, errors: [] });
    });

    it("identidade negativa não some no Math.max: mais registros depois da dedup do que antes reprova", () => {
        const r = new FlowComputer().compute(projeto({ ...FIXTURE, dedup: 120, incl: 45 }));
        expect(r.computed.duplicates_removed).toBe(0);
        expect(r.validation.valid).toBe(false);
        expect(r.validation.errors.join(" ")).toMatch(/duplicates_removed/);
    });
});

describe("DEBT-138 — o export recalcula o funil e bloqueia divergência", () => {
    it("prisma_flow.json editado à mão, com aritmética que fecha, passa no gate antigo e é barrado no novo", () => {
        const p = projeto(FIXTURE);
        const fc = new FlowComputer();
        fc.writeFlow(p, fc.compute(p).computed);
        expect(fc.checkExportGate(p).blocked).toBe(false);

        const editado = { ...fc.compute(p).computed, fulltext_excluded: 9, included: 6 };
        fs.writeFileSync(path.join(p, "prisma_flow.json"), JSON.stringify(editado));
        expect(new PrismaFlowValidator().checkExportGate(p).blocked).toBe(false); // a aritmética fecha
        const g = fc.checkExportGate(p);
        expect(g.blocked).toBe(true);
        expect(g.errors.join(" ")).toMatch(/included: arquivo=6 vs\. calculado=5/);
    });

    it("artefatos que não fecham barram o export mesmo sem prisma_flow.json", () => {
        const g = new FlowComputer().checkExportGate(projeto({ ...FIXTURE, incl: 999 }));
        expect(g.blocked).toBe(true);
    });

    it("o export_dataset usa o gate que recalcula", () => {
        const mcp = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
        const index = fs.readFileSync(path.join(mcp, "src", "index.ts"), "utf-8");
        const i = index.indexOf('"export_dataset",');
        const corpo = index.slice(i, index.indexOf("server.tool(", i));
        expect(corpo).toContain("new FlowComputer().checkExportGate(");
    });
});
