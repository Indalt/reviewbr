import { describe, it, expect, afterEach } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { Registry } from "../src/registry/loader.js";
import { congelarPlano, lerPlanoDoArquivo, conferirExecucao } from "../src/services/plano_busca.js";
import { DataService } from "../src/services/data.js";
import { BvsService } from "../src/services/bvs.js";
import { SnowballService } from "../src/services/snowball.js";
import { appendRawRecords } from "../src/services/project_artifacts.js";
import { rodapeDosResultados, registrosDaColetaOai, baseDaImportacao, avisoSemBase, rotuloDaBase } from "../src/services/coleta.js";

/**
 * Linha 27 da FILA — ponto 8, grupo 2 (coleta e importação), lista levada ao Vicente em 26/11/2026.
 * Sem rede: o OpenAlex é um duplo de teste, a coleta OAI-PMH é um registro montado à mão, e o
 * projeto travado é uma cópia do `fixtures/roda_aromas_ceara` (não a pasta da pesquisa).
 */
const MCP = path.resolve(__dirname, "..");
const INDEX = fs.readFileSync(path.join(MCP, "src", "index.ts"), "utf-8").replace(/\r\n/g, "\n");
const FIX = path.join(__dirname, "fixtures", "roda_aromas_ceara");
const registry = Registry.loadDefault();
const dirs: string[] = [];
afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });

function tmp(prefixo: string): string {
    const d = fs.mkdtempSync(path.join(os.tmpdir(), prefixo));
    dirs.push(d);
    return d;
}

function corpo(inicio: string): string {
    const i = INDEX.indexOf(inicio);
    if (i < 0) throw new Error(`não achei ${inicio}`);
    const resto = INDEX.slice(i + inicio.length);
    const fim = resto.search(/\n(server\.tool\(|const [A-Za-z]+Handler = async)/);
    return fim < 0 ? resto : resto.slice(0, fim);
}

describe("search_openalex — sem projectPath não diz que gravou", () => {
    it("o rodapé sem arquivo gravado diz que nada foi gravado; com arquivo, diz onde", () => {
        expect(rodapeDosResultados(200, 10, null)).toMatch(/não foram gravados: sem projectPath/);
        expect(rodapeDosResultados(200, 10, null)).not.toMatch(/salvos|gravad[ao]s? em/);
        expect(rodapeDosResultados(200, 10, "01_raw/dataset_openalex_x.json")).toMatch(/lista inteira \(200\) está em 01_raw\/dataset_openalex_x\.json/);
        expect(rodapeDosResultados(10, 10, null)).toBe("");
    });

    it("o handler usa o rodapé com o arquivo que gravou, e não a frase fixa", () => {
        const c = corpo("const openAlexHandler = async");
        expect(c).not.toContain("resultados salvos no arquivo JSON");
        expect(c).toMatch(/rodapeDosResultados\(results\.length, Math\.min\(results\.length, 10\), arquivoGravado\)/);
    });
});

describe("harvest_records — com projectPath, a coleta vai para 01_raw", () => {
    const repo = { id: "BR-TESTE-0001", repository: { name: "Repositório de Teste", url: "https://repo.teste" } } as any;
    const oai = [{
        identifier: "oai:repo.teste:123/1", datestamp: "2026-01-01", sets: [],
        metadata: {
            title: ["Cajuína: tradição e processo"], creator: ["Silva, A."], subject: ["cajuína"], description: ["Resumo."],
            date: ["2020"], type: ["Dissertação"], format: [], identifier: ["https://repo.teste/handle/123/1", "doi:10.1234/abc.1"],
            language: ["por"], rights: [], publisher: [], source: [], relation: [], coverage: [], contributor: [],
        },
    }];

    it("o registro OAI vira registro do funil, com repositório, endereço, DOI e procedência", () => {
        const [r] = registrosDaColetaOai(repo, oai as any, { endpoint: "https://repo.teste/oai/request", set: "col_1" });
        expect(r).toMatchObject({
            repositoryId: "BR-TESTE-0001", repositoryName: "Repositório de Teste", identifier: "oai:repo.teste:123/1",
            title: "Cajuína: tradição e processo", url: "https://repo.teste/handle/123/1", doi: "10.1234/abc.1",
            accessMethod: "oai-pmh",
            audit: { provenanceSource: "https://repo.teste/oai/request", searchQueryUsed: "OAI-PMH ListRecords (metadataPrefix=oai_dc&set=col_1)" },
        });
        const p = tmp("coleta-");
        appendRawRecords(p, registrosDaColetaOai(repo, oai as any, { endpoint: "e" }), "database");
        expect(JSON.parse(fs.readFileSync(path.join(p, "01_raw", "database_records.json"), "utf-8"))).toHaveLength(1);
    });

    it("o handler grava em 01_raw com projectPath, e a descrição diz isso", () => {
        const c = corpo('\n    "harvest_records",');
        expect(c).toMatch(/gravarBrutos\(params\.projectPath, registrosDaColetaOai\(/);
        expect(c).toMatch(/Com ele, os registros colhidos são gravados em 01_raw\/database_records\.json/);
    });
});

describe("expand_search_snowball — todas as páginas de citações; erro não vira lista vazia", () => {
    const seed = { identifier: "s", title: "Semente", doi: "10.1/seed", creators: [], url: "u" } as any;
    const cit = (i: number) => ({ id: `https://openalex.org/W${i}`, display_name: `Estudo ${i}`, authorships: [], publication_date: "2021-01-01", doi: `https://doi.org/10.9/${i}`, type: "article" });

    it("lê as páginas seguintes pelo cursor, com per_page=200", async () => {
        const svc = new SnowballService();
        const pedidos: string[] = [];
        (svc as any).fetchJson = async (url: string) => {
            pedidos.push(url);
            if (url.includes("/works/https://doi.org/10.1/seed")) return { id: "https://openalex.org/WSEED" };
            if (url.includes("cursor=c2")) return { meta: { count: 250, next_cursor: null }, results: Array.from({ length: 50 }, (_, i) => cit(200 + i)) };
            return { meta: { count: 250, next_cursor: "c2" }, results: Array.from({ length: 200 }, (_, i) => cit(i)) };
        };
        const r = await svc.expandSearch([seed], { maxCandidates: 1000 });
        expect(r.newCandidates).toHaveLength(250);
        expect(pedidos.filter((u) => u.includes("cites:WSEED")).every((u) => u.includes("per_page=200"))).toBe(true);
        expect(r.stats.falhas).toEqual([]);
    });

    it("erro do OpenAlex nas citações entra em stats.falhas, com a semente e o que foi lido", async () => {
        const svc = new SnowballService();
        (svc as any).fetchJson = async (url: string) => {
            if (url.includes("/works/https://doi.org/10.1/seed")) return { id: "https://openalex.org/WSEED" };
            if (url.includes("cursor=c2")) return { __error: true, status: 503 };
            return { meta: { count: 250, next_cursor: "c2" }, results: Array.from({ length: 200 }, (_, i) => cit(i)) };
        };
        const r = await svc.expandSearch([seed], { maxCandidates: 1000 });
        expect(r.stats.falhas).toHaveLength(1);
        expect(r.stats.falhas[0]).toMatchObject({ semente: "10.1/seed" });
        expect(r.stats.falhas[0].erro).toMatch(/HTTP 503.*200 de 250/);
    });

    it("erro ao achar a semente também entra em stats.falhas, em vez de sumir", async () => {
        const svc = new SnowballService();
        (svc as any).fetchJson = async () => ({ __error: true, status: 429 });
        const r = await svc.expandSearch([seed]);
        expect(r.newCandidates).toEqual([]);
        expect(r.stats.falhas).toHaveLength(1);
        expect(r.stats.falhas[0].erro).toMatch(/HTTP 429/);
    });

    it("o handler leva as falhas ao log PRISMA-S e à resposta", () => {
        const c = corpo('\n    "expand_search_snowball",');
        expect(c).toMatch(/result\.stats\.falhas/);
    });
});

describe("import_dataset_ris — a base vem do plano quando a chamada não a diz", () => {
    function projetoComUmaFonteRis(): string {
        const dir = tmp("ris-");
        for (const f of ["protocol.md", "project_state.json"]) fs.copyFileSync(path.join(FIX, f), path.join(dir, f));
        const plano = JSON.parse(fs.readFileSync(path.join(FIX, "plano_busca.json"), "utf-8"));
        plano.fontes = plano.fontes.filter((f: any) => !["wos", "fsta"].includes(f.id));
        fs.writeFileSync(path.join(dir, "plano_busca.json"), JSON.stringify(plano, null, 2));
        congelarPlano(dir, lerPlanoDoArquivo(dir).plano!, "F2", registry);
        return dir;
    }
    const RIS = "TY  - JOUR\nTI  - Cajuína do Piauí\nDO  - 10.1/caj\nER  - \n";
    const reg = { plataforma: "Scopus", "data da busca": "28/11/2026", filtros: "nenhum", "total mostrado": "1", "período de cobertura": "não obtido: teste" };

    it("com uma só fonte do plano para a tool, a trava aceita sem sourceName, e o registro sai com a base do plano", () => {
        const dir = projetoComUmaFonteRis();
        const c = conferirExecucao(dir, "import_dataset_ris", { textoExato: "TITLE-ABS-KEY ( cajuína OR cajuina )", registroDaBusca: reg }, registry);
        expect(c).toMatchObject({ aplica: true, ok: true });
        const base = baseDaImportacao(undefined, c.aplica && c.ok ? c.fontes.map((f) => f.nome) : undefined);
        expect(base).toBe("Scopus");
        const [r] = new DataService().importRis(RIS, base);
        expect(r!.repositoryName).toBe("Scopus");
        expect(avisoSemBase([r!])).toBe("");
    });

    it("o handler passa à importação a base do plano, e o guardrail a entrega", () => {
        const c = corpo('\n    "import_dataset_ris",');
        expect(c).toMatch(/baseDaImportacao\(params\.sourceName, \(params as any\)\.basePlano\)/);
        expect(c).toMatch(/dataService\.importRis\(params\.content, base\)/);
        expect(c).toMatch(/avisoSemBase\(results\)/);
        expect(INDEX).toMatch(/if \(TOOLS_DE_IMPORTACAO\.has\(tool\)\) params\.basePlano = c\.fontes\.map\(\(f\) => f\.nome\);/);
    });

    it("sem base nenhuma, a importação avisa na hora e o log diz 'origem Indefinida'", () => {
        const rs = new DataService().importRis(RIS, undefined);
        expect(avisoSemBase(rs)).toMatch(/1 de 1 registro\(s\) sem base declarada.*sourceName/);
        expect(rotuloDaBase(rs, undefined)).toBe("origem Indefinida");
        expect(rotuloDaBase(new DataService().importRis("TY  - JOUR\nTI  - X\nDB  - FSTA\nER  - \n"), undefined)).toBe("FSTA");
        expect(corpo('\n    "import_dataset_ris",')).toMatch(/rotuloDaBase\(results, base\)/);
    });
});

describe("import_bvs_export — registros distintos com o mesmo DOI ficam os dois", () => {
    const CSV = "id,title,doi,authors,year\nlil-1,Estudo A,10.5/x,Silva,2020\nlil-2,Estudo A (outra entrada),10.5/x,Souza,2020\n";

    it("o export inteiro entra em 01_raw; repetir a importação não conta duas vezes", () => {
        const rs = new BvsService().parseCSV(CSV);
        expect(rs).toHaveLength(2);
        const p = tmp("bvs-");
        expect(appendRawRecords(p, rs, "database", { manterTodosDoLote: true }).added).toBe(2);
        expect(appendRawRecords(p, rs, "database", { manterTodosDoLote: true }).added).toBe(0);
    });

    it("o handler grava com manterTodosDoLote", () => {
        expect(corpo('\n    "import_bvs_export",')).toContain('appendRawRecords(params.projectPath, results, "database", { manterTodosDoLote: true })');
    });
});
