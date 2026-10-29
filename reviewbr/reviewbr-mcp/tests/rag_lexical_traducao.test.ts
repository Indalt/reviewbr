import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { indexCorpus, queryCorpus } from "../src/services/rag_lexical.js";

/** DEBT-023 — a tradução gerada por LLM não pode entrar no índice herdando a
 *  proveniência (fonte/URL) do estudo primário. Reprodução baseada no achado do
 *  system_debt.json (AUDITORIA Frente 2, 25/09/2026). */
describe("DEBT-023 — rag_index_corpus exclui derivados de tradução", () => {
    const dirs: string[] = [];

    afterEach(() => {
        for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
    });

    function setupProject(): string {
        const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "ragprova-"));
        dirs.push(projectDir);
        const fulltextDir = path.join(projectDir, "04_extraction", "fulltext");
        const screeningDir = path.join(projectDir, "03_screening");
        fs.mkdirSync(fulltextDir, { recursive: true });
        fs.mkdirSync(screeningDir, { recursive: true });

        fs.writeFileSync(path.join(fulltextDir, "EST001.txt"), "Cajuina.\n\nTexto original do estudo.\n");
        fs.writeFileSync(
            path.join(fulltextDir, "EST001_tradução_português.md"),
            "> TEXTO DE APOIO - NAO E FONTE PRIMARIA\n\nCajuina traduzida com termo inventado XPTOZZ.\n"
        );
        fs.writeFileSync(
            path.join(screeningDir, "included.json"),
            JSON.stringify([{ record: { identifier: "EST001", repositoryName: "SciELO", url: "http://exemplo/1" } }])
        );
        return projectDir;
    }

    it("skippedTranslations aponta a tradução e ela some da contagem indexada", () => {
        const projectDir = setupProject();
        const r = indexCorpus(projectDir);
        expect(r.skippedTranslations).toEqual(["EST001_tradução_português.md"]);
        expect(r.studies).toBe(1); // só EST001.txt (original) contribui
    });

    it("queryCorpus NUNCA devolve o termo inventado da tradução com a proveniência do estudo real", () => {
        const projectDir = setupProject();
        indexCorpus(projectDir);
        const hits = queryCorpus(projectDir, "XPTOZZ");
        // o termo só existe na tradução; com ela excluída, a busca não acha nada —
        // e, portanto, não pode devolver texto de LLM rotulado como SciELO/EST001.
        expect(hits.find((h) => h.text.includes("XPTOZZ"))).toBeUndefined();
    });

    it("controle positivo: o texto original genuíno segue indexado e recuperável", () => {
        const projectDir = setupProject();
        indexCorpus(projectDir);
        const hits = queryCorpus(projectDir, "estudo");
        expect(hits.length).toBeGreaterThan(0);
        expect(hits[0].study_id).toBe("EST001");
        expect(hits[0].fonte_repositorio).toBe("SciELO");
    });
});
