import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { processarDatasetEmLotes } from "../src/services/project_artifacts.js";

// DEBT-089 — o retrieve_fulltexts regravava o dataset de entrada, a cada lote, só com os
// registros já processados. Se o processo caísse no lote seguinte, os incluídos ainda não
// processados sumiam do arquivo, sem cópia nem log.
describe("DEBT-089 — retrieve_fulltexts não trunca o dataset entre lotes", () => {
    const dirs: string[] = [];
    afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });

    function dataset(conteudo: unknown): string {
        const d = fs.mkdtempSync(path.join(os.tmpdir(), "lotes-"));
        dirs.push(d);
        const f = path.join(d, "audit_dataset_f4.json");
        fs.writeFileSync(f, JSON.stringify(conteudo, null, 2));
        return f;
    }
    const registros = (n: number) => Array.from({ length: n }, (_, i) => ({ record: { identifier: `id${i + 1}` } }));
    const ler = (f: string) => JSON.parse(fs.readFileSync(f, "utf-8"));

    it("queda no segundo lote: o arquivo continua com os 25 incluídos, e os 10 processados levam a marca", async () => {
        const f = dataset({ projeto: "x", included: registros(25) });
        const processar = async (item: any) => {
            if (item.record.identifier === "id15") throw new Error("processo caiu");
            item.record.pdfPath = `pdfs/${item.record.identifier}.pdf`;
        };

        await expect(processarDatasetEmLotes(f, processar, 10)).rejects.toThrow("processo caiu");

        const depois = ler(f);
        expect(depois.projeto).toBe("x");
        expect(depois.included).toHaveLength(25);
        expect(depois.included.map((x: any) => x.record.identifier)).toEqual(registros(25).map((x) => x.record.identifier));
        expect(depois.included.slice(0, 10).every((x: any) => x.record.pdfPath)).toBe(true);
        expect(fs.readdirSync(path.dirname(f))).toEqual(["audit_dataset_f4.json"]);
    });

    it("entrada em array continua array, na ordem original, mesmo com o lote terminando fora de ordem", async () => {
        const f = dataset(registros(12));
        const processar = async (item: any) => {
            const n = Number(item.record.identifier.slice(2));
            await new Promise((r) => setTimeout(r, (12 - n) * 2));
            item.record.pdfPath = "ok";
        };

        const r = await processarDatasetEmLotes(f, processar, 10);

        const depois = ler(f);
        expect(r.total).toBe(12);
        expect(Array.isArray(depois)).toBe(true);
        expect(depois.map((x: any) => x.record.identifier)).toEqual(registros(12).map((x) => x.record.identifier));
        expect(depois.every((x: any) => x.record.pdfPath === "ok")).toBe(true);
    });

    it("dataset sem lista de registros: recusa com motivo e não grava nada", async () => {
        const f = dataset({ projeto: "x" });
        const antes = fs.readFileSync(f, "utf-8");
        await expect(processarDatasetEmLotes(f, async () => {}, 10)).rejects.toThrow(/sem lista de registros/);
        expect(fs.readFileSync(f, "utf-8")).toBe(antes);
    });
});
