import { describe, it, expect, beforeEach, afterAll } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CatalogWriter } from "../src/services/maintenance_writes.js";
import { MethodologyCatalogService } from "../src/services/methodology_catalog.js";

// FILA linha 8, item 6: o mapa de uma página é GERADO do catálogo — uma linha por metodologia
// (nome, quando usar, fonte, data de leitura) — e não se escreve à mão. É o que serve para sugerir
// ao pesquisador a metodologia mais adequada (decisão de 12/11/2026).

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.slice(1)), "..", "..", "..");
let RAIZ: string;
const criados: string[] = [];
beforeEach(() => {
    RAIZ = fs.mkdtempSync(path.join(os.tmpdir(), "reviewbr-mapa-"));
    criados.push(RAIZ);
});
afterAll(() => { for (const d of criados) { try { fs.rmSync(d, { recursive: true, force: true }); } catch { } } });

const entrada = (o: Record<string, unknown> = {}) => ({
    id: "m1", name: "M1", kind: "review_method", what_it_is: "o que é",
    when_to_use: "Quando o objeto pede A | B. Segunda frase que não entra.", requires: "o que exige",
    source_url: "https://exemplo.org/m1", read_at: "2026-11-12", ...o,
});

describe("mapa de uma página, gerado do catálogo", () => {
    it("a absorb_methodology regenera o mapa a cada escrita, com uma linha por entrada", () => {
        expect(CatalogWriter.absorver(RAIZ, entrada()).ok).toBe(true);
        expect(CatalogWriter.absorver(RAIZ, entrada({ id: "m2", name: "M2", read_at: "2026-10-01" })).ok).toBe(true);
        const mapa = fs.readFileSync(MethodologyCatalogService.mapaPath(RAIZ), "utf-8");
        expect(mapa).toMatch(/não edite à mão/);
        expect(mapa).toMatch(/\| M1 \(`m1`\) \| Quando o objeto pede A \\\| B\. \| https:\/\/exemplo\.org\/m1 \| 2026-11-12 \|/);
        expect(mapa).toMatch(/\| M2 \(`m2`\) \|.*\| 2026-10-01 \|/);
        expect(mapa).not.toMatch(/Segunda frase/);
        expect(mapa.split("\n").filter((l) => /^\| M\d /.test(l))).toHaveLength(2);
    });

    it("entrada sem data de leitura aparece como tal, sem data inventada", () => {
        const md = MethodologyCatalogService.renderMapa({
            schemaVersion: 1, updatedAt: "", source_note: "",
            entries: [{ ...entrada(), read_at: "" } as any],
        });
        expect(md).toMatch(/\| \[sem data\] \|/);
    });

    it("o MAPA.md do repositório é o que o catálogo gera — ninguém o escreveu à mão", () => {
        const cat = MethodologyCatalogService.read(REPO)!;
        const emDisco = fs.readFileSync(MethodologyCatalogService.mapaPath(REPO), "utf-8").replace(/\r\n/g, "\n");
        expect(emDisco).toBe(MethodologyCatalogService.renderMapa(cat));
        expect(emDisco.split("\n").filter((l) => /^\| .+ \(`[^`]+`\) \|/.test(l))).toHaveLength(cat.entries.length);
    });
});
