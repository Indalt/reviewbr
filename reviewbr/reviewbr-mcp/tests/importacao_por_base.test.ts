import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { appendRawRecords, consolidateRaw } from "../src/services/project_artifacts.js";
import { DataService } from "../src/services/data.js";

/**
 * Falha F9 do projeto roda_aromas_ceara (19/11/2026, FILA, "Visto de passagem"): importar três
 * bases com o mesmo DOI descartava o registro da segunda base em 01_raw, sem relatório. A
 * remoção de duplicatas entre bases é da F3, com relatório; em 01_raw cada base conta o que trouxe.
 */
describe("F9 — 01_raw guarda cada base inteira; a duplicata entre bases fica para a F3", () => {
    const dirs: string[] = [];
    afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });
    const mk = () => { const p = fs.mkdtempSync(path.join(os.tmpdir(), "f9-")); dirs.push(p); return p; };
    const ris = (doi: string, ti: string) => `TY  - JOUR\nTI  - ${ti}\nDO  - ${doi}\nER  - \n`;

    it("o mesmo DOI vindo de Scopus e de Web of Science entra duas vezes", () => {
        const p = mk();
        const ds = new DataService();
        const scopus = ds.importRis(ris("10.1/a", "Cajuína A") + ris("10.1/b", "Cajuína B"), "Scopus");
        const wos = ds.importRis(ris("10.1/a", "Cajuina A") + ris("10.1/b", "Cajuina B"), "Web of Science");
        expect(appendRawRecords(p, scopus).added).toBe(2);
        const r = appendRawRecords(p, wos);
        expect(r.added).toBe(2);
        expect(r.total).toBe(4);
    });

    it("repetir a mesma importação da mesma base não duplica", () => {
        const p = mk();
        const ds = new DataService();
        appendRawRecords(p, ds.importRis(ris("10.1/a", "A"), "Scopus"));
        const r = appendRawRecords(p, ds.importRis(ris("10.1/a", "A"), "Scopus"));
        expect(r.added).toBe(0);
        expect(r.total).toBe(1);
    });

    it("consolidateRaw mantém as duas bases e não conta duas vezes ao rodar de novo", () => {
        const p = mk();
        const ds = new DataService();
        appendRawRecords(p, ds.importRis(ris("10.1/a", "A"), "Scopus"));
        fs.writeFileSync(path.join(p, "01_raw", "dataset_openalex_x.json"),
            JSON.stringify([{ repositoryId: "openalex", identifier: "W1", doi: "https://doi.org/10.1/a", title: "A" }]));
        expect(consolidateRaw(p).database).toHaveLength(2);
        expect(consolidateRaw(p).database).toHaveLength(2);
    });

    it("a base declarada e o endereço chegam aonde o gate da RV-08 os procura", () => {
        const ds = new DataService();
        const comBase = ds.importRis(ris("10.1/a", "A"), "Scopus");
        expect(comBase[0]!.repositoryName).toBe("Scopus");
        expect(comBase[0]!.url).toBe("https://doi.org/10.1/a");
        expect(ds.checkProvenance(comBase).missing).toHaveLength(0);
        // sem base declarada nem tag DB: continua sem origem, e o gate reprova
        expect(ds.checkProvenance(ds.importRis(ris("10.1/b", "B"))).missing).toHaveLength(1);
    });

    it("RIS com BOM: o primeiro registro é lido como TY (accessMethod gravado)", () => {
        const ds = new DataService();
        const out = ds.importRis("﻿" + ris("10.1/a", "A").replace(/\n/g, "\r\n"), "Web of Science");
        expect(out).toHaveLength(1);
        expect(out[0]!.accessMethod).toBe("manual_import");
        expect(out[0]!.title).toBe("A");
    });
});

/**
 * Falhas F10 e F11 do projeto roda_aromas_ceara (20/11/2026, linha 16 da FILA).
 * F10: o resumo de Porto-Luz et al. 2020 no RIS do Web of Science, em 5 linhas, entrava só com a
 * primeira; e o mesmo arquivo usa CR sozinho como fim de linha. F11: a FSTA tem dois registros
 * distintos com o mesmo DOI, e a importação gravava só um (13 de 14).
 */
describe("F10 — importRis lê o RIS como a base o exporta", () => {
    it("a linha de continuação entra no campo anterior", () => {
        const ds = new DataService();
        const out = ds.importRis(
            "TY  - JOUR\nTI  - Identification of antioxidant compounds\n   in cajuina\n" +
            "AU  - Porto-Luz, RGL\nKW  - vitamin C\nKW  - antioxidant\n   activity\n" +
            "AB  - Background: Cajuina is obtained.\n   Objective: identify phenolic compounds.\n   Conclusion: functional food.\n" +
            "ER  - \n", "Web of Science");
        expect(out).toHaveLength(1);
        expect(out[0]!.title).toBe("Identification of antioxidant compounds in cajuina");
        expect(out[0]!.description).toBe(
            "Background: Cajuina is obtained.\nObjective: identify phenolic compounds.\nConclusion: functional food.");
        expect(out[0]!.subjectAreas).toEqual(["vitamin C", "antioxidant activity"]);
    });

    it("CR sozinho é fim de linha", () => {
        const ds = new DataService();
        const out = ds.importRis("TY  - JOUR\rTI  - A\rDO  - 10.1/a\rER  - \rTY  - JOUR\r\nTI  - B\nER  - \n", "Web of Science");
        expect(out).toHaveLength(2);
        expect(out[0]!.title).toBe("A");
        expect(out[0]!.doi).toBe("10.1/a");
        expect(out[1]!.title).toBe("B");
    });

    it("linha de continuação que começa com letras de uma tag não vira campo", () => {
        const ds = new DataService();
        const out = ds.importRis("TY  - JOUR\nTI  - Titulo\nAB  - Primeira parte\nTIME and temperature\nER  - \n", "Scopus");
        expect(out[0]!.title).toBe("Titulo");
        expect(out[0]!.description).toBe("Primeira parte\nTIME and temperature");
    });
});

describe("F11 — o export é gravado inteiro; a duplicata é da F3", () => {
    const dirs: string[] = [];
    afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });
    const mk = () => { const p = fs.mkdtempSync(path.join(os.tmpdir(), "f11-")); dirs.push(p); return p; };
    const fsta =
        "TY  - JOUR\nAB  - Abstract: Fruit-based prebiotic beverages.\nAN  - 2026-06-0700081\nDO  - 10.1016/j.fbio.2025.107482\nTI  - Human gut microbiota responses\nER  - \n\n" +
        "TY  - JOUR\nAB  - Fruit-based prebiotic beverages.\nAN  - 2026-02-Hr0946\nDO  - 10.1016/j.fbio.2025.107482\nTI  - Human gut microbiota responses.\nER  - \n";

    it("dois registros distintos da mesma base com o mesmo DOI entram os dois", () => {
        const p = mk();
        const ds = new DataService();
        const r = appendRawRecords(p, ds.importRis(fsta, "FSTA"), "database", { manterTodosDoLote: true });
        expect(r.added).toBe(2);
        expect(r.total).toBe(2);
    });

    it("repetir a importação do mesmo arquivo não duplica", () => {
        const p = mk();
        const ds = new DataService();
        appendRawRecords(p, ds.importRis(fsta, "FSTA"), "database", { manterTodosDoLote: true });
        const r = appendRawRecords(p, ds.importRis(fsta, "FSTA"), "database", { manterTodosDoLote: true });
        expect(r.added).toBe(0);
        expect(r.total).toBe(2);
    });

    it("consolidateRaw não junta os dois registros do mesmo arquivo", () => {
        const p = mk();
        const ds = new DataService();
        appendRawRecords(p, ds.importRis(fsta, "FSTA"), "database", { manterTodosDoLote: true });
        expect(consolidateRaw(p).database).toHaveLength(2);
        expect(consolidateRaw(p).database).toHaveLength(2);
    });

    it("sem a opção (busca), o registro repetido no lote continua descartado", () => {
        const p = mk();
        const rec = { repositoryId: "openalex", identifier: "W1", doi: "10.1/a", title: "A" };
        expect(appendRawRecords(p, [rec, { ...rec }] as any).added).toBe(1);
    });
});
