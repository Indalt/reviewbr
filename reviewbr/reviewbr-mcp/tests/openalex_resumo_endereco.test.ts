import { describe, it, expect, vi } from "vitest";
import { SnowballService, resumoDoIndiceInvertido } from "../src/services/snowball.js";

/** Linha 12 da FILA (J), item 1: a busca do OpenAlex grava o resumo (remontado do
 *  abstract_inverted_index) e o endereço (página da fonte, senão DOI). Antes: sem resumo e
 *  url "undefined" (reprodução no commit 93c7997). Sem chamada real ao OpenAlex. */
describe("linha 12 — OpenAlex: resumo e endereço", () => {
    it("remonta o resumo na ordem das posições", () => {
        expect(resumoDoIndiceInvertido({ cajuína: [0, 3], é: [1], uma: [2] })).toBe("cajuína é uma cajuína");
        expect(resumoDoIndiceInvertido(null)).toBe("");
    });

    it("search grava description e url", async () => {
        const svc = new SnowballService();
        (svc as any).fetchJson = vi.fn(async () => ({
            meta: { count: 2 },
            results: [
                { id: "https://openalex.org/W1", display_name: "A", authorships: [], doi: "https://doi.org/10.1590/fst.25520",
                  abstract_inverted_index: { Cajuína: [0], clarificada: [1] },
                  primary_location: { landing_page_url: "https://www.scielo.br/j/cta/a/x" } },
                { id: "https://openalex.org/W2", display_name: "B", authorships: [], doi: "https://doi.org/10.1/b" },
            ],
        }));
        const { results } = await svc.search("cajuína");
        expect(results[0]!.description).toBe("Cajuína clarificada");
        expect(results[0]!.url).toBe("https://www.scielo.br/j/cta/a/x");
        expect(results[1]!.description).toBe("");
        expect(results[1]!.url).toBe("https://doi.org/10.1/b");
    });
});

/** Linha 12, item 2 (decisão do Vicente, 19/11/2026): o SciELO pela plataforma de ciência aberta.
 *  O filtro de editora P4310312277 não trazia os controles; o prefixo de DOI 10.1590 traz os dois
 *  (10.1590/fst.25520 e 10.1590/s0100-40422007000500017, conferido no OpenAlex em 19/11/2026). */
describe("linha 12 — SciELO Brasil visto no OpenAlex", () => {
    it("search_scielo usa o prefixo 10.1590 e declara onde viu", async () => {
        const { SCIELO_VIA_OPENALEX } = await import("../src/services/snowball.js");
        expect(SCIELO_VIA_OPENALEX.filtro).toBe("doi_starts_with:10.1590");
        expect(SCIELO_VIA_OPENALEX.rotulo).toMatch(/visto no OpenAlex/);
        const svc = new SnowballService();
        const f = vi.fn(async () => ({ meta: { count: 0 }, results: [] }));
        (svc as any).fetchJson = f;
        await svc.search("cajuína", { filter: SCIELO_VIA_OPENALEX.filtro });
        expect(f.mock.calls[0]![0]).toContain("filter=doi_starts_with:10.1590");
        const fonte = await import("node:fs").then((fs) => fs.readFileSync("src/index.ts", "utf-8"));
        expect(fonte).not.toMatch(/filter: "primary_location\.source\.publisher_lineage:P4310312277"/);
    });
});
