import { describe, it, expect, beforeEach, afterAll } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { PrismaFlowValidator } from "../src/services/prisma_validator.js";

const v = new PrismaFlowValidator();
let DIR: string;
const criados: string[] = [];

beforeEach(() => { DIR = fs.mkdtempSync(path.join(os.tmpdir(), "rv05-")); criados.push(DIR); });
afterAll(() => { for (const d of criados) { try { fs.rmSync(d, { recursive: true, force: true }); } catch { } } });

/** Fluxo cuja aritmética fecha nas quatro identidades do PRISMA. */
const fecha = {
    identified_db: 100, identified_other: 20, duplicates_removed: 20,
    screened: 100,                 // 100 + 20 - 20
    title_abstract_excluded: 60,
    retrieved_fulltext: 40,        // 100 - 60
    fulltext_not_retrieved: 5,
    fulltext_assessed: 35,         // 40 - 5
    fulltext_excluded: 25,
    included: 10                   // 35 - 25
};
const escreve = (o: unknown) => fs.writeFileSync(path.join(DIR, "prisma_flow.json"), JSON.stringify(o));

describe("RV-05 no caminho do export — o precedente do sistema, fechado", () => {
    it("NÃO bloqueia quando o fluxo ainda não existe — em F2–F4 exportar é legítimo", () => {
        const g = v.checkExportGate(DIR);
        expect(g.blocked).toBe(false);
    });

    it("NÃO bloqueia quando a aritmética fecha", () => {
        escreve(fecha);
        expect(v.checkExportGate(DIR).blocked).toBe(false);
    });

    it("BLOQUEIA quando a conta do funil não fecha", () => {
        escreve({ ...fecha, included: 11 }); // 35 - 25 = 10, não 11
        const g = v.checkExportGate(DIR);
        expect(g.blocked).toBe(true);
        expect(g.reason).toMatch(/aritmética do funil não fecha/);
        expect(g.errors.join(" ")).toMatch(/F8\.1\.10/);
    });

    it("BLOQUEIA erro no meio do funil, não só no fim", () => {
        escreve({ ...fecha, screened: 99 }); // 100 + 20 - 20 = 100
        const g = v.checkExportGate(DIR);
        expect(g.blocked).toBe(true);
        expect(g.errors.join(" ")).toMatch(/F8\.1\.4/);
    });

    it("BLOQUEIA fluxo ILEGÍVEL — corrompido não é o mesmo que ausente", () => {
        fs.writeFileSync(path.join(DIR, "prisma_flow.json"), "{ isto não é json");
        const g = v.checkExportGate(DIR);
        expect(g.blocked).toBe(true);
        expect(g.reason).toMatch(/ilegível/);
    });

    it("BLOQUEIA fluxo sem os 10 campos canônicos", () => {
        escreve({ identified_db: 100, included: 10 });
        const g = v.checkExportGate(DIR);
        expect(g.blocked).toBe(true);
        expect(g.reason).toMatch(/10 campos canônicos/);
        expect(g.errors.length).toBeGreaterThan(0);
    });

    it("a mensagem manda recomputar, não digitar — RV-02", () => {
        escreve({ ...fecha, included: 11 });
        expect(v.checkExportGate(DIR).reason).toMatch(/compute_flow_counts/);
    });
});
