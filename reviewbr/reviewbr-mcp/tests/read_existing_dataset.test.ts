import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { readExistingDataset } from "../src/services/project_artifacts.js";

describe("DEBT-059 — readExistingDataset (leitura pura, sem side-effect)", () => {
    const dirs: string[] = [];
    afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });

    function mkProject(): string {
        const p = fs.mkdtempSync(path.join(os.tmpdir(), "existing-ds-"));
        dirs.push(p);
        return p;
    }

    it("prioriza 02_deduplicated/dataset.json quando existe", () => {
        const p = mkProject();
        fs.mkdirSync(path.join(p, "02_deduplicated"), { recursive: true });
        fs.writeFileSync(path.join(p, "02_deduplicated", "dataset.json"), JSON.stringify([{ identifier: "a" }]));
        fs.mkdirSync(path.join(p, "01_raw"), { recursive: true });
        fs.writeFileSync(path.join(p, "01_raw", "x.json"), JSON.stringify([{ identifier: "b" }]));

        expect(readExistingDataset(p)).toEqual([{ identifier: "a" }]);
    });

    it("cai para 01_raw/*.json somado quando não há dedup ainda", () => {
        const p = mkProject();
        fs.mkdirSync(path.join(p, "01_raw"), { recursive: true });
        fs.writeFileSync(path.join(p, "01_raw", "x.json"), JSON.stringify([{ identifier: "b" }]));
        fs.writeFileSync(path.join(p, "01_raw", "y.json"), JSON.stringify([{ identifier: "c" }]));

        expect(readExistingDataset(p).map((r: any) => r.identifier).sort()).toEqual(["b", "c"]);
    });

    it("projeto sem nenhum artefato ainda: devolve [] sem criar arquivo ou diretório", () => {
        const p = mkProject();
        expect(readExistingDataset(p)).toEqual([]);
        expect(fs.existsSync(path.join(p, "01_raw"))).toBe(false);
        expect(fs.existsSync(path.join(p, "02_deduplicated"))).toBe(false);
    });
});
