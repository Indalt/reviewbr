import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { extrairTextoComPaginas } from "../src/services/pdf_extractor.js";
import { chunkText, indexCorpus, queryCorpus } from "../src/services/rag_lexical.js";

// DEBT-031 — a skill de leitura exige citação [study_id, p.X], e nada fornecia a página: a
// extração gravava o texto sem fronteira de página, o chunking era só por parágrafo e o
// rag_query não tinha campo de página. Decisão de 29/10/2026: a página é guardada na extração.

/** PDF mínimo, uma linha de texto por página (Helvetica, só ASCII). */
function pdf(textos: string[]): Buffer {
    const objs: string[] = [];
    const kids = textos.map((_, i) => `${4 + i * 2} 0 R`).join(" ");
    objs.push("<< /Type /Catalog /Pages 2 0 R >>");
    objs.push(`<< /Type /Pages /Kids [${kids}] /Count ${textos.length} >>`);
    objs.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    textos.forEach((t, i) => {
        const stream = `BT /F1 12 Tf 72 720 Td (${t}) Tj ET`;
        objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + i * 2} 0 R >>`);
        objs.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    });
    let out = "%PDF-1.4\n";
    const offsets: number[] = [];
    objs.forEach((o, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
    const xref = out.length;
    out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
    out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    return Buffer.from(out, "latin1");
}

describe("DEBT-031 — a página vai da extração ao rag_query", () => {
    const dirs: string[] = [];
    afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });

    it("a extração grava a marca de cada página; o texto plano (guarda de qualidade) fica sem ela", async () => {
        const r = await extrairTextoComPaginas(pdf(["texto da pagina um", "texto da pagina dois"]));
        expect(r.numpages).toBe(2);
        expect(r.texto).toBe("[[p. 1]]\n\ntexto da pagina um\n\n[[p. 2]]\n\ntexto da pagina dois");
        expect(r.textoPlano).not.toContain("[[p.");
        expect(r.textoPlano).toContain("texto da pagina dois");
    });

    it("o chunking leva a página a cada trecho e nenhum trecho atravessa página", () => {
        const chunks = chunkText("[NATIVE PDF EXTRACTED]\n\n[[p. 1]]\n\nPrimeiro.\n\n[[p. 2]]\n\nSegundo.\n\nAinda dois.");
        expect(chunks.map((c) => [c.page, c.text])).toEqual([
            [null, "[NATIVE PDF EXTRACTED]"],
            [1, "Primeiro."],
            [2, "Segundo.\n\nAinda dois."],
        ]);
    });

    it("rag_query devolve page; texto sem marca sai com page null e é listado em semPagina", () => {
        const p = fs.mkdtempSync(path.join(os.tmpdir(), "rag-pagina-"));
        dirs.push(p);
        const ft = path.join(p, "04_extraction", "fulltext");
        fs.mkdirSync(ft, { recursive: true });
        const meta = (id: string) => JSON.stringify({ study_id: id, fonte_repositorio: "Repo", url_hospedagem: `https://x/${id}` });
        fs.writeFileSync(path.join(ft, "EST1.txt"), "[[p. 1]]\n\nintroducao geral\n\n[[p. 7]]\n\ncajuina clarificada artesanal");
        fs.writeFileSync(path.join(ft, "EST1.meta.json"), meta("EST1"));
        fs.writeFileSync(path.join(ft, "EST2.txt"), "texto antigo sobre rapadura sem marca");
        fs.writeFileSync(path.join(ft, "EST2.meta.json"), meta("EST2"));

        const r = indexCorpus(p);
        expect(r.semPagina).toEqual(["EST2"]);

        const [hit] = queryCorpus(p, "cajuina clarificada", 1);
        expect(hit.study_id).toBe("EST1");
        expect(hit.page).toBe(7);

        const [antigo] = queryCorpus(p, "rapadura", 1);
        expect(antigo.study_id).toBe("EST2");
        expect(antigo.page).toBeNull();
    });
});
