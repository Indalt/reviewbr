import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { registrarBuscaPrismaS, registrarHistorico, linhaPrismaS } from "../src/services/search_log.js";
import { resolveDir } from "../src/services/project_artifacts.js";

// DEBT-056 — o log PRISMA-S que a skill chama de obrigatório não tinha produtor: o agente o
// digitava. Decisão de 29/10/2026: o código grava o log de busca.
// DEBT-139 (parte 1) — logToLocalProject e o relatório do audit_methodology montavam o caminho
// com path.join(process.cwd(), projectPath, ...): com caminho absoluto, o log sumia em silêncio.

const MCP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INDEX = fs.readFileSync(path.join(MCP, "src", "index.ts"), "utf-8").replace(/\r\n/g, "\n");

/** Corpo de uma tool (`"nome",` no server.tool) ou de um handler (`const xHandler = async`). */
function corpo(inicio: string): string {
    const i = INDEX.indexOf(inicio);
    if (i < 0) throw new Error(`não achei ${inicio} em index.ts`);
    const resto = INDEX.slice(i + inicio.length);
    const fim = resto.search(/\n(server\.tool\(|const [A-Za-z]+Handler = async)/);
    return fim < 0 ? resto : resto.slice(0, fim);
}

describe("DEBT-056 — o código grava logs/search_log_prisma_s.csv", () => {
    const dirs: string[] = [];
    afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });
    function projeto(): string {
        const p = fs.mkdtempSync(path.join(os.tmpdir(), "logps-"));
        dirs.push(p);
        return p;
    }
    const ler = (p: string) => fs.readFileSync(path.join(p, "logs", "search_log_prisma_s.csv"), "utf-8").split("\n").filter(Boolean);

    it("cria o arquivo com as seis colunas da skill e anexa uma linha por execução", () => {
        const p = projeto();
        registrarBuscaPrismaS(p, { tool: "search_openalex", query: "cajuina", hits: 12, totalDeclarado: 12, filtros: { query: "cajuina", projectPath: p, maxResults: 200 } });
        registrarBuscaPrismaS(p, { tool: "search_pubmed", query: "cashew", hits: 3 });
        const linhas = ler(p);
        expect(linhas[0]).toBe("Datetime,Database,Filter,Query,Hits,Errors");
        expect(linhas).toHaveLength(3);
        expect(linhas[1]).toMatch(/^\d{4}-\d\d-\d\dT[^,]+,OpenAlex \(search_openalex\),maxResults=200,cajuina,12,$/);
        expect(linhas[2]).toMatch(/,PubMed \(search_pubmed\),,cashew,3,$/);
    });

    it("string exata com aspas e vírgula sai escapada, sem paráfrase", () => {
        const p = projeto();
        registrarBuscaPrismaS(p, { tool: "search_crossref", query: '"cajuína" AND (piauí, ceará)', hits: 0 });
        expect(ler(p)[1]).toContain(',"""cajuína"" AND (piauí, ceará)",0,');
    });

    it("busca que falhou deixa linha: Hits Indefinido e o erro em Errors", () => {
        const c = linhaPrismaS({ tool: "search_scielo", query: "x", hits: null, erros: "HTTP 503" });
        expect(c.slice(1)).toEqual(["SciELO (via OpenAlex) (search_scielo)", "", "x", "Indefinido", "HTTP 503"]);
    });

    it("truncamento vai para Errors; importação sem string sai com Query Indefinido", () => {
        expect(linhaPrismaS({ tool: "search_core", query: "x", hits: 200, totalDeclarado: 5000 })[5])
            .toBe("truncada: a fonte declarou 5000, vieram 200");
        const imp = linhaPrismaS({ tool: "import_dataset_ris", database: "Export RIS importado: Scopus", hits: 40, filtros: { sourceName: "Scopus" } });
        expect(imp.slice(1)).toEqual(["Export RIS importado: Scopus (import_dataset_ris)", "sourceName=Scopus", "Indefinido", "40", ""]);
    });

    it("toda rota de busca do index.ts chama registrarBusca", () => {
        const tools = ["search_papers_optimized", "search_pubmed", "search_repository", "harvest_records",
            "expand_search_snowball", "import_dataset_ris", "import_bvs_export"];
        for (const t of tools) expect(corpo(`\n    "${t}",`), t).toContain("registrarBusca(params.projectPath");
        const handlers = ["openAlexHandler", "crossrefHandler", "scieloHandler", "semanticScholarHandler", "coreHandler", "europePmcHandler"];
        for (const h of handlers) expect(corpo(`const ${h} = async`), h).toContain("registrarBusca(params.projectPath");
    });
});

describe("DEBT-139 — log e relatório não somem com projectPath absoluto", () => {
    const dirs: string[] = [];
    afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });

    it("com caminho absoluto, o histórico e o CSV vão para <projeto>/logs", () => {
        const abs = fs.mkdtempSync(path.join(os.tmpdir(), "logabs-"));
        dirs.push(abs);
        expect(path.isAbsolute(abs)).toBe(true);
        registrarHistorico(resolveDir(abs), "search_openalex", { query: "x", found: 1 });
        registrarBuscaPrismaS(resolveDir(abs), { tool: "search_openalex", query: "x", hits: 1 });
        expect(JSON.parse(fs.readFileSync(path.join(abs, "logs", "search_history.json"), "utf-8"))).toHaveLength(1);
        expect(fs.existsSync(path.join(abs, "logs", "search_log_prisma_s.csv"))).toBe(true);
    });

    it("index.ts não monta caminho de projeto com path.join(process.cwd(), projectPath, ...)", () => {
        expect(INDEX.match(/path\.join\(process\.cwd\(\),\s*(params\.)?projectPath\s*,/g) ?? []).toEqual([]);
        expect(corpo("async function logToLocalProject")).toContain("resolveProjectDir(projectPath)");
    });
});
