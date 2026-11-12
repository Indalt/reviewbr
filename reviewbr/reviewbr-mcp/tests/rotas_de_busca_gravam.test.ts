import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// DEBT-093 — três tools só gravavam em 01_raw dentro do `if (projectId)`: projeto que existe no
// disco mas não no SQLite buscava, recebia os resultados e não alimentava o funil, sem aviso.
// DEBT-087 — expand_search_snowball tinha projectPath e não gravava nada: o braço "outros
// métodos" do funil (01_raw/other_records.json) nunca era alimentado.
// São consertos de fiação dentro dos handlers do index.ts; o teste confere o fio no código.

const MCP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INDEX = fs.readFileSync(path.join(MCP, "src", "index.ts"), "utf-8").replace(/\r\n/g, "\n");

function corpoDaTool(nome: string): string {
    const inicio = `\n    "${nome}",`;
    const i = INDEX.indexOf(inicio);
    if (i < 0) throw new Error(`não achei a tool ${nome}`);
    const resto = INDEX.slice(i + inicio.length);
    const fim = resto.search(/\n(server\.tool\(|const [A-Za-z]+Handler = async)/);
    return fim < 0 ? resto : resto.slice(0, fim);
}

/** Texto de cada bloco `if (projectId) { ... }`, por casamento de chaves. */
function blocosIfProjectId(corpo: string): string[] {
    const blocos: string[] = [];
    let i = corpo.indexOf("if (projectId) {");
    while (i >= 0) {
        let nivel = 0;
        let j = corpo.indexOf("{", i);
        const ini = j;
        for (; j < corpo.length; j++) {
            if (corpo[j] === "{") nivel++;
            else if (corpo[j] === "}" && --nivel === 0) break;
        }
        blocos.push(corpo.slice(ini, j + 1));
        i = corpo.indexOf("if (projectId) {", j);
    }
    return blocos;
}

describe("DEBT-093 — a gravação em 01_raw não depende de linha no SQLite", () => {
    for (const tool of ["search_papers_optimized", "search_pubmed", "search_repository"]) {
        it(`${tool}: grava com projectPath, fora do if (projectId)`, () => {
            const corpo = corpoDaTool(tool);
            expect(corpo).toMatch(/gravarBrutos\(params\.projectPath, [A-Za-z]+, "database"\)/);
            const blocos = blocosIfProjectId(corpo);
            expect(blocos.length).toBeGreaterThan(0);
            for (const b of blocos) expect(b).not.toMatch(/appendRawRecords|gravarBrutos/);
        });
    }
});

describe("DEBT-087 — o snowballing alimenta 'outros métodos'", () => {
    it("expand_search_snowball grava os candidatos aceitos em 01_raw/other_records.json", () => {
        expect(corpoDaTool("expand_search_snowball")).toContain('gravarBrutos(params.projectPath, result.newCandidates, "other")');
    });
});
