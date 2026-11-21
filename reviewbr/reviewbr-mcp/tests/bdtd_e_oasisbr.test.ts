import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { AccessStrategy, rotaPrimaria, OASISBR_ID } from "../src/access/strategy.js";

/**
 * Pergunta do Vicente de 21/11/2026 ("Visto de passagem", commit 1573fc8): o catálogo chamava o
 * BR-AGG-0001 de "Oasisbr" e a busca ia à BDTD; a Oasisbr inteira nunca foi buscável. Decisão dele no
 * mesmo dia: "separar bdtd e oasisbr e colocar a oasisbr inteira". Sem chamada de rede.
 */
const catalogo: any[] = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "sources", "repositories_catalog.json"), "utf-8"));
const porId = (id: string) => catalogo.find((r) => r.id === id);

describe("BDTD e Oasisbr são duas fontes", () => {
    it("o catálogo diz o que a busca faz: BR-AGG-0001 é a BDTD, a Oasisbr tem id próprio", () => {
        expect(porId("BR-AGG-0001").repository.name).toMatch(/^BDTD/);
        expect(porId("BR-AGG-0001").repository.url).toContain("bdtd.ibict.br");
        expect(porId(OASISBR_ID).repository.name).toMatch(/^Oasisbr/);
        expect(porId(OASISBR_ID).repository.url).toContain("oasisbr.ibict.br");
        expect(porId(OASISBR_ID).status).toBe("active");
        expect(rotaPrimaria(porId("BR-AGG-0001"))).toBe("BDTD, API do VuFind");
        expect(rotaPrimaria(porId(OASISBR_ID))).toBe("Oasisbr (IBICT), API do VuFind, sem filtro de rede");
    });

    it("todo agregador do catálogo aponta para a Oasisbr pelo id dela", () => {
        const vias = catalogo.filter((r) => r.access?.viaAgregador).map((r) => r.access.viaAgregador.id);
        expect(vias.length).toBeGreaterThan(0);
        expect(new Set(vias)).toEqual(new Set([OASISBR_ID]));
    });

    it("a Oasisbr inteira é buscada sem filtro de rede e sem passar pela BDTD", async () => {
        const s = new AccessStrategy();
        const oasis = vi.fn(async () => ({ total: 40, results: [] }));
        const bdtd = vi.fn(async () => ({ total: 25, results: [] }));
        (s as any).oasisbr.searchDetailed = oasis;
        (s as any).bdtd.searchDetailed = bdtd;
        const r = await s.searchDetailed(porId(OASISBR_ID), "cajuína");
        expect(oasis).toHaveBeenCalledTimes(1);
        expect((oasis.mock.calls[0] as any)[2]).toBeUndefined();
        expect(bdtd).not.toHaveBeenCalled();
        expect(r.totalNaFonte).toBe(40);
        expect(r.metodo).toBe("Oasisbr (IBICT), API do VuFind, sem filtro de rede");
    });

    it("a BDTD continua na BDTD", async () => {
        const s = new AccessStrategy();
        const oasis = vi.fn(async () => ({ total: 40, results: [] }));
        const bdtd = vi.fn(async () => ({ total: 25, results: [] }));
        (s as any).oasisbr.searchDetailed = oasis;
        (s as any).bdtd.searchDetailed = bdtd;
        const r = await s.searchDetailed(porId("BR-AGG-0001"), "cajuína");
        expect(bdtd).toHaveBeenCalledTimes(1);
        expect(oasis).not.toHaveBeenCalled();
        expect(r.totalNaFonte).toBe(25);
    });
});
