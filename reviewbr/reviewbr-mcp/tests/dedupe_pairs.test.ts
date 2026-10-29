import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { DeduplicationService } from "../src/services/dedupe.js";
import { writeDeduped } from "../src/services/project_artifacts.js";

/** DEBT-029 — o rastro de cada duplicata removida (mantido/removido/critério/fontes)
 *  precisa ser gravado, não descartado. Sem ele a deduplicação é irreversível e
 *  inauditável (skill screening-rules; RV-02). */
describe("DEBT-029 — deduplicate grava o par (mantido, removido, critério, fontes)", () => {
    const svc = new DeduplicationService();

    it("duplicata por DOI produz um par com criterio='doi' e as duas fontes", () => {
        const records = [
            { identifier: "a", title: "Cajuína no Piauí", date: "2020", doi: "10.1590/abc", url: "u1", creators: [], repositoryName: "SciELO" } as any,
            { identifier: "b", title: "Cajuína no Piauí", date: "2020", doi: "10.1590/abc", url: "u2", creators: [], repositoryName: "OpenAlex" } as any,
        ];
        const r = svc.deduplicate(records);
        expect(r.stats.duplicates).toBe(1);
        expect(r.pairs).toHaveLength(1);
        expect(r.pairs[0]).toEqual({
            mantido: "a",
            removido: "b",
            criterio: "doi",
            fontes: ["SciELO", "OpenAlex"],
        });
    });

    it("duplicata por título+ano usa criterio='titulo_ano'; sem duplicata, pairs vazio", () => {
        const records = [
            { identifier: "a", title: "Mesmo Título", date: "2019-01-01", url: "u1", creators: [], repositoryName: "R1" } as any,
            { identifier: "b", title: "Mesmo Título", date: "2019-06-01", url: "u2", creators: [], repositoryName: "R2" } as any,
            { identifier: "c", title: "Título Diferente", date: "2019-01-01", url: "u3", creators: [], repositoryName: "R3" } as any,
        ];
        const r = svc.deduplicate(records);
        expect(r.pairs).toEqual([{ mantido: "a", removido: "b", criterio: "titulo_ano", fontes: ["R1", "R2"] }]);
        expect(svc.deduplicate([records[0], records[2]]).pairs).toEqual([]);
    });

    it("writeDeduped grava 02_deduplicated/dedupe_pairs.json quando pairs é informado", () => {
        const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "dedupepairs-"));
        try {
            writeDeduped(projectDir, [{ identifier: "a" }], { total_before: 2 }, [
                { mantido: "a", removido: "b", criterio: "doi", fontes: ["X"] },
            ]);
            const written = JSON.parse(
                fs.readFileSync(path.join(projectDir, "02_deduplicated", "dedupe_pairs.json"), "utf-8")
            );
            expect(written).toEqual([{ mantido: "a", removido: "b", criterio: "doi", fontes: ["X"] }]);
        } finally {
            fs.rmSync(projectDir, { recursive: true, force: true });
        }
    });

    it("writeDeduped NÃO grava dedupe_pairs.json quando pairs é omitido (retrocompatível)", () => {
        const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "dedupepairs-"));
        try {
            writeDeduped(projectDir, [{ identifier: "a" }], { total_before: 1 });
            expect(fs.existsSync(path.join(projectDir, "02_deduplicated", "dedupe_pairs.json"))).toBe(false);
        } finally {
            fs.rmSync(projectDir, { recursive: true, force: true });
        }
    });
});
