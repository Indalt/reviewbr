import { describe, it, expect, vi, beforeEach } from "vitest";
import { SnowballService } from "../src/services/snowball.js";

/** DEBT-059 — as 4 salvaguardas obrigatórias (librarian.md:24-27): profundidade limitada,
 *  filtro por descritores, dedup contra dataset existente, teto com relatório de parada.
 *  fetchJson é substituído por um duplo de teste — sem chamadas reais ao OpenAlex. */

function work(id: string, doi?: string) {
    return { id, display_name: `Work ${id}`, publication_year: 2021, referenced_works: [] };
}

function citation(id: string, title: string, doi: string) {
    return {
        id, display_name: title, authorships: [], publication_date: "2021-01-01",
        doi, type: "article",
    };
}

const seed = { identifier: "seed-1", title: "Semente", doi: "10.1/seed", creators: [], url: "u-seed" } as any;

function makeFetchJsonMock(routes: Record<string, any>) {
    return vi.fn(async (url: string) => {
        for (const [needle, response] of Object.entries(routes)) {
            if (url.includes(needle)) return response;
        }
        return { results: [] };
    });
}

describe("DEBT-059 — expand_search_snowball com as 4 salvaguardas", () => {
    let svc: SnowballService;

    beforeEach(() => {
        svc = new SnowballService();
    });

    it("profundidade 1 (padrão): não recursa além das citações das sementes", async () => {
        (svc as any).fetchJson = makeFetchJsonMock({
            "/works/https://doi.org/10.1/seed": work("W_SEED"),
            "filter=cites:W_SEED": { results: [citation("W1", "Estudo sobre cajuína", "10.1/w1")] },
            // se recursar (bug), chamaria isto — não deve acontecer com depth=1
            "filter=cites:W1": { results: [citation("W3", "Não deveria aparecer", "10.1/w3")] },
        });

        const r = await svc.expandSearch([seed]);
        expect(r.stats.depth).toBe(1);
        expect(r.newCandidates.map((c) => c.identifier)).toEqual(["W1"]);
        expect(r.stats.per_level).toHaveLength(1);
    });

    it("depth=2 recursa sobre o aceito no nível 1, e só ele", async () => {
        (svc as any).fetchJson = makeFetchJsonMock({
            "/works/https://doi.org/10.1/seed": work("W_SEED"),
            "filter=cites:W_SEED": { results: [citation("W1", "Estudo sobre cajuína", "10.1/w1")] },
            "/works/https://doi.org/10.1/w1": work("W1"),
            "filter=cites:W1": { results: [citation("W3", "Segundo nível sobre cajuína", "10.1/w3")] },
        });

        const r = await svc.expandSearch([seed], { depth: 2 });
        expect(r.stats.per_level).toEqual([
            { level: 1, fetched: 1, accepted: 1 },
            { level: 2, fetched: 1, accepted: 1 },
        ]);
        expect(r.newCandidates.map((c) => c.identifier).sort()).toEqual(["W1", "W3"]);
    });

    it("filterKeywords poda quem não casa com nenhum descritor; sem keywords, nada é podado", async () => {
        (svc as any).fetchJson = makeFetchJsonMock({
            "/works/https://doi.org/10.1/seed": work("W_SEED"),
            "filter=cites:W_SEED": {
                results: [
                    citation("W1", "Estudo sobre CAJUÍNA no Piauí", "10.1/w1"),
                    citation("W2", "Tema totalmente irrelevante", "10.1/w2"),
                ],
            },
        });

        const filtered = await svc.expandSearch([seed], { filterKeywords: ["cajuína"] });
        expect(filtered.newCandidates.map((c) => c.identifier)).toEqual(["W1"]);
        expect(filtered.stats.filtered_out_by_keyword).toBe(1);
        expect(filtered.stats.filter_applied).toBe(true);

        (svc as any).fetchJson = makeFetchJsonMock({
            "/works/https://doi.org/10.1/seed": work("W_SEED"),
            "filter=cites:W_SEED": {
                results: [
                    citation("W1", "Estudo sobre CAJUÍNA no Piauí", "10.1/w1"),
                    citation("W2", "Tema totalmente irrelevante", "10.1/w2"),
                ],
            },
        });
        const unfiltered = await svc.expandSearch([seed]);
        expect(unfiltered.newCandidates).toHaveLength(2);
        expect(unfiltered.stats.filter_applied).toBe(false);
    });

    it("dedup contra existingDataset: candidato já no dataset do projeto NÃO entra como novo", async () => {
        (svc as any).fetchJson = makeFetchJsonMock({
            "/works/https://doi.org/10.1/seed": work("W_SEED"),
            "filter=cites:W_SEED": {
                results: [
                    citation("W1", "Já está no dataset", "10.1/w1"),
                    citation("W2", "Genuinamente novo", "10.1/w2"),
                ],
            },
        });

        const r = await svc.expandSearch([seed], {
            existingDataset: [{ doi: "10.1/w1", title: "Já está no dataset", url: "u1" } as any],
        });
        expect(r.newCandidates.map((c) => c.identifier)).toEqual(["W2"]);
        expect(r.stats.already_known).toBe(1);
    });

    it("maxCandidates: para ao atingir o teto e declara o motivo no relatório de parada", async () => {
        (svc as any).fetchJson = makeFetchJsonMock({
            "/works/https://doi.org/10.1/seed": work("W_SEED"),
            "filter=cites:W_SEED": {
                results: [
                    citation("W1", "Primeiro", "10.1/w1"),
                    citation("W2", "Segundo", "10.1/w2"),
                ],
            },
        });

        const r = await svc.expandSearch([seed], { maxCandidates: 1 });
        expect(r.newCandidates).toHaveLength(1);
        expect(r.stats.capped).toBe(true);
        expect(r.stats.stop_reason).toMatch(/[Tt]eto de 1/);
    });
});
