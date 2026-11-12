import { describe, it, expect } from "vitest";
import { DeduplicationService } from "../src/services/dedupe.js";

// DEBT-025 — a skill screening-rules promete quatro níveis de deduplicação, e o código fazia
// dois: DOI sem tirar o resolvedor, e título+ano apagando o acento em vez de transliterar. O
// ramo do DOI ainda impedia comparar registro com DOI e registro sem DOI.
// Níveis decididos pelo Vicente em 12/11/2026 (2 com o mesmo ano; 3 com o 1º autor quando um
// dos dois não tem ano); nível 4 só sinaliza o par (decisão de 29/10/2026).
const svc = new DeduplicationService();
const reg = (o: any) => ({ url: `u-${o.identifier}`, creators: [], ...o });

describe("DEBT-025 — deduplicação em quatro níveis", () => {
    it("o mesmo estudo com DOI cru, DOI com resolvedor, sem DOI com acento e sem DOI sem acento vira um só", () => {
        const r = svc.deduplicate([
            reg({ identifier: "a", title: "Cajuina no Piaui", date: "2020", doi: "10.1590/abc" }),
            reg({ identifier: "b", title: "Cajuina no Piaui", date: "2020", doi: "https://doi.org/10.1590/ABC" }),
            reg({ identifier: "c", title: "Cajuína no Piauí", date: "2020" }),
            reg({ identifier: "d", title: "Cajuina no Piaui", date: "2020-05-01" }),
        ]);
        expect(r.stats).toMatchObject({ total: 4, unique: 1, duplicates: 3 });
        expect(r.pairs.map((p) => [p.removido, p.criterio])).toEqual([["b", "doi"], ["c", "titulo_ano"], ["d", "titulo_ano"]]);
    });

    it("nível 1 também pelo Handle", () => {
        const r = svc.deduplicate([
            reg({ identifier: "a", title: "Um", url: "http://hdl.handle.net/123/456" }),
            reg({ identifier: "b", title: "Outro título", url: "https://hdl.handle.net/123/456?locale=pt" }),
        ]);
        expect(r.pairs.map((p) => p.criterio)).toEqual(["handle"]);
    });

    it("nível 2 exige o mesmo ano: título genérico de anos diferentes não é duplicata", () => {
        const r = svc.deduplicate([
            reg({ identifier: "a", title: "Editorial", date: "2019" }),
            reg({ identifier: "b", title: "Editorial", date: "2020" }),
        ]);
        expect(r.stats.duplicates).toBe(0);
    });

    it("dois DOIs diferentes não se juntam pelo título", () => {
        const r = svc.deduplicate([
            reg({ identifier: "a", title: "Mesmo título", date: "2020", doi: "10.1/x" }),
            reg({ identifier: "b", title: "Mesmo título", date: "2020", doi: "10.1/y" }),
        ]);
        expect(r.stats.duplicates).toBe(0);
    });

    it("nível 3: título + sobrenome do 1º autor quando um dos dois não tem ano", () => {
        const r = svc.deduplicate([
            reg({ identifier: "a", title: "Cajuína artesanal", date: "2018", creators: ["Silva, João"] }),
            reg({ identifier: "b", title: "Cajuina artesanal", creators: ["João da Silva"] }),
            reg({ identifier: "c", title: "Cajuína artesanal", creators: ["Souza, Maria"] }),
        ]);
        expect(r.pairs.map((p) => [p.mantido, p.removido, p.criterio])).toEqual([["a", "b", "titulo_autor"]]);
    });

    it("nível 4: título ≥ 0,90 parecido e mesmo ano só sinaliza — os dois ficam", () => {
        const r = svc.deduplicate([
            reg({ identifier: "a", title: "Consumo de cajuina no estado do Piaui entre 2010 e 2020", date: "2021" }),
            reg({ identifier: "b", title: "Consumo da cajuina no estado do Piaui entre 2010 e 2020", date: "2021" }),
            reg({ identifier: "c", title: "Consumo da cajuina no estado do Piaui entre 2010 e 2020", date: "2015" }),
        ]);
        expect(r.stats).toMatchObject({ unique: 3, duplicates: 0 });
        expect(r.sinalizados).toHaveLength(1);
        expect(r.sinalizados[0]).toMatchObject({ a: "a", b: "b", ano: "2021" });
        expect(r.sinalizados[0].similaridade).toBeGreaterThanOrEqual(0.9);
    });
});
