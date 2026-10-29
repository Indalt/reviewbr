import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { ScreeningService } from "../src/services/screen.js";

/** DEBT-020 — screen_candidates com stage='fulltext' precisa realmente ler o texto
 *  completo, não repetir a decisão de título/resumo. Prova direta: um candidato cujo
 *  título/resumo sugerem inclusão, mas cujo texto completo contém um critério de
 *  exclusão explícito. TA inclui (só vê o resumo); FULLTEXT exclui (vê o texto real). */
describe("DEBT-020 — stage='fulltext' lê o texto completo de verdade", () => {
    const dirs: string[] = [];
    afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });

    function mkProjectWithFulltext(id: string, texto: string): string {
        const p = fs.mkdtempSync(path.join(os.tmpdir(), "screen-fulltext-"));
        dirs.push(p);
        const dir = path.join(p, "04_extraction", "fulltext");
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, `${id}.txt`), texto);
        return p;
    }

    /** Duplo de teste do LLM: decide YES se o prompt NÃO contém o marcador de texto
     *  completo; decide NO se o prompt contém o texto completo E a frase de exclusão. */
    function mockModel() {
        return {
            generateContent: async (prompt: string) => {
                const viuFulltext = prompt.includes("FULLTEXT EXTRACT");
                const decision = viuFulltext && prompt.includes("SOMENTE MODELOS ANIMAIS")
                    ? "NO" : "YES";
                const reasoning = viuFulltext
                    ? "Texto completo lido: estudo é apenas em modelo animal, critério de exclusão."
                    : "Resumo sugere resultados promissores em humanos.";
                return {
                    response: {
                        text: () => JSON.stringify({ relevance_score: viuFulltext ? 10 : 90, decision, reasoning }),
                    },
                };
            },
        };
    }

    const candidato = (over: Record<string, unknown> = {}) => ({
        identifier: "EST1", title: "Resultados promissores em ensaio clínico",
        description: "Resumo sugere resultados promissores relevantes ao tema.",
        creators: [], date: "2022", url: "u1", ...over,
    }) as any;

    it("stage='ta': decide só pelo resumo (YES) — não vê o texto completo", async () => {
        const projectPath = mkProjectWithFulltext("EST1", "Estudo conduzido SOMENTE MODELOS ANIMAIS, não humanos.");
        const svc = new ScreeningService("fake-key");
        (svc as any).model = mockModel();

        const r = await svc.screenCandidates([candidato()], { criteria: "Estudos em humanos", stage: "ta" }, projectPath);
        expect(r.included).toHaveLength(1);
        expect(r.included[0].decision).toBe("YES");
    });

    it("stage='fulltext': lê o texto completo de verdade e EXCLUI — a mesma info que 'ta' não via", async () => {
        const projectPath = mkProjectWithFulltext("EST1", "Estudo conduzido SOMENTE MODELOS ANIMAIS, não humanos.");
        const svc = new ScreeningService("fake-key");
        (svc as any).model = mockModel();

        const r = await svc.screenCandidates([candidato()], { criteria: "Estudos em humanos", stage: "fulltext" }, projectPath);
        expect(r.excluded).toHaveLength(1);
        expect(r.excluded[0].decision).toBe("NO");
        expect(r.excluded[0].reasoning).toMatch(/Texto completo lido/);
    });

    it("stage='fulltext' SEM o arquivo de texto completo: RECUSA decidir (erro, não inclusão silenciosa por resumo)", async () => {
        const projectPath = fs.mkdtempSync(path.join(os.tmpdir(), "screen-fulltext-vazio-"));
        (globalThis as any).__dirsCleanup ??= [];
        try {
            const svc = new ScreeningService("fake-key");
            (svc as any).model = mockModel();

            const r = await svc.screenCandidates([candidato()], { criteria: "Estudos em humanos", stage: "fulltext" }, projectPath);
            expect(r.included).toHaveLength(0);
            expect(r.excluded).toHaveLength(0);
            expect(r.errors).toHaveLength(1);
            expect(r.errors[0]).toMatch(/texto completo/i);
        } finally {
            fs.rmSync(projectPath, { recursive: true, force: true });
        }
    });

    it("stage='fulltext' com o arquivo em 03_screening/fulltext/ (fallback) também é lido", async () => {
        const p = fs.mkdtempSync(path.join(os.tmpdir(), "screen-fulltext-fallback-"));
        dirs.push(p);
        const dir = path.join(p, "03_screening", "fulltext");
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, "EST1.txt"), "Estudo conduzido SOMENTE MODELOS ANIMAIS, não humanos.");

        const svc = new ScreeningService("fake-key");
        (svc as any).model = mockModel();
        const r = await svc.screenCandidates([candidato()], { criteria: "Estudos em humanos", stage: "fulltext" }, p);
        expect(r.excluded).toHaveLength(1);
    });
});
