import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { ScreeningMetricsService } from "../src/services/screening_metrics.js";

// DEBT-021 — a regra de saturação lia screening_decision do banco, que nenhuma tool preenche:
// o get_screening_report devolvia sempre "nada triado" e alerta false. Decisão de 29/10/2026:
// a saturação lê a triagem gravada em disco.
const svc = new ScreeningMetricsService();

describe("DEBT-021 — a saturação lê a triagem gravada em 03_screening/", () => {
    const dirs: string[] = [];
    afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });

    function projeto(n: number): string {
        const p = fs.mkdtempSync(path.join(os.tmpdir(), "satur-"));
        dirs.push(p);
        fs.mkdirSync(path.join(p, "02_deduplicated"), { recursive: true });
        fs.mkdirSync(path.join(p, "03_screening"), { recursive: true });
        const ds = Array.from({ length: n }, (_, i) => ({ identifier: `id${i + 1}`, title: `T${i + 1}`, repositoryName: i % 2 ? "SciELO" : "OpenAlex" }));
        fs.writeFileSync(path.join(p, "02_deduplicated", "dataset.json"), JSON.stringify(ds));
        return p;
    }
    const grava = (p: string, rel: string, ids: number[], decision: string) =>
        fs.writeFileSync(path.join(p, "03_screening", rel), JSON.stringify(ids.map((i) => ({ decision, reasoning: "r", record: { identifier: `id${i}` } }))));
    const faixa = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

    it("80 triados, relevantes só no 1º lote de 20: alerta de saturação", async () => {
        const p = projeto(80);
        grava(p, "included_ta.json", faixa(1, 10), "YES");
        grava(p, "excluded_ta.json", faixa(11, 80), "NO");
        const r = await svc.generateReport(p, "ta", 20);
        expect(r).toMatchObject({ totalRecords: 80, totalScreened: 80, included: 10, excluded: 70, saturationAlert: true });
        expect(r.batches.map((b) => b.relevantInBatch)).toEqual([10, 0, 0, 0]);
    });

    it("triagem pela metade: conta os não triados e não alerta com relevantes no fim", async () => {
        const p = projeto(60);
        grava(p, "included_ta.json", [25, 30], "MAYBE");
        grava(p, "excluded_ta.json", faixa(1, 24), "NO");
        const r = await svc.generateReport(p, "ta", 10);
        expect(r).toMatchObject({ totalRecords: 60, totalScreened: 26, totalUnscreened: 34, included: 2, uncertain: 2 });
        expect(r.saturationAlert).toBe(false);
    });

    it("sem triagem gravada: diz que nada foi triado", async () => {
        const r = await svc.generateReport(projeto(5), "ta");
        expect(r.totalScreened).toBe(0);
        expect(r.saturationMessage).toMatch(/Nenhum registro triado/);
    });

    it("o get_screening_report não lê mais o banco", () => {
        const mcp = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
        const index = fs.readFileSync(path.join(mcp, "src", "index.ts"), "utf-8");
        const i = index.indexOf('"get_screening_report",');
        const corpo = index.slice(i, index.indexOf("server.tool(", i));
        expect(corpo).not.toContain("dbService,");
        expect(corpo).toContain("screeningMetricsService.generateReport(");
    });
});
