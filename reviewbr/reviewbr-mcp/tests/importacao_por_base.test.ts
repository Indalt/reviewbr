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
