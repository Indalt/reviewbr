import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import ExcelJS from "exceljs";
import { conferirProcedencia, linkDoRegistro, type Buscador, type Robots } from "../../src/services/procedencia.js";
import { PREFIXO_CONTROLE, type Pergunta } from "../../src/services/decisoes_revisores.js";

// Apoio dos testes da linha 13 da FILA (23/11/2026): 11 dos 743 registros que a camada por palavras do
// roda_aromas_ceara passou, com o protocolo travado do projeto (cópias em tests/fixtures). Nada é gravado na pasta do
// projeto.
const AQUI = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const FIX = path.join(AQUI, "fixtures", "roda_aromas_ceara");
export const INSUMO: any[] = JSON.parse(fs.readFileSync(path.join(FIX, "linha13", "passed_keywords.json"), "utf-8"));
export const REG = INSUMO.map((x) => x.record);

export const PERGUNTAS: Pergunta[] = [
    { id: "a", texto: "o produto é a bebida cajuína, e não um refrigerante com esse nome nem um produto em que ela é ingrediente?" },
    { id: "b", texto: "a fonte trata expressamente de aroma ou sabor, ou relata compostos voláteis?" },
    { id: "c", texto: "o idioma e o tipo de documento atendem aos critérios?" },
    { id: "d", texto: "no texto completo, a fonte traz de fato o que o resumo indicava?", estagios: ["fulltext"] },
];
export const CRITERIO = "excluído depois das tentativas de recuperação por acesso aberto (`retrieve_fulltexts`) e pelo acesso do pesquisador ao Portal CAPES";

/** Projeto temporário com o protocolo, o insumo, as palavras-chave completadas e o relatório da F3 do projeto. */
export function montarProjeto(dirs: string[]): string {
    const p = fs.mkdtempSync(path.join(os.tmpdir(), "revisores-"));
    dirs.push(p);
    fs.mkdirSync(path.join(p, "03_screening"), { recursive: true });
    fs.mkdirSync(path.join(p, "02_deduplicated"), { recursive: true });
    fs.copyFileSync(path.join(FIX, "protocol.md"), path.join(p, "protocol.md"));
    fs.copyFileSync(path.join(FIX, "linha13", "passed_keywords.json"), path.join(p, "03_screening", "passed_keywords.json"));
    fs.copyFileSync(path.join(FIX, "linha13", "palavras_chave.json"), path.join(p, "02_deduplicated", "palavras_chave.json"));
    fs.copyFileSync(path.join(FIX, "linha13", "dedupe_report.json"), path.join(p, "02_deduplicated", "dedupe_report.json"));
    return p;
}

export const EBSCO = REG.find((r) => String(r.url).includes("ebsco"));
const titulo = new Map(REG.map((r) => [linkDoRegistro(r), String(r.title)]));
/** Rede simulada: tudo confere, menos o link da EBSCO (fora do ar), enquanto `ebscoFora` for verdadeiro. */
export function rede(ebscoFora = true): Buscador {
    return async (url) => {
        if (ebscoFora && url === EBSCO.url) return { status: 403, url, contentType: "text/html", body: "" };
        if (url.startsWith("https://doi.org/")) return { status: 200, url, contentType: "application/json", body: JSON.stringify({ title: titulo.get(url) }) };
        return { status: 200, url, contentType: "text/html", body: `<meta name="citation_title" content="${titulo.get(url) ?? "título da EBSCO"}">` };
    };
}
export const robots: Robots = async () => ({ permitido: true, motivo: "permitido" });
export const conferir = (p: string, ebscoFora = true, extra: Record<string, unknown> = {}) =>
    conferirProcedencia(p, { buscar: rede(ebscoFora), robots, intervaloMs: 0, ...extra });

export async function abrir(arquivo: string) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(arquivo);
    const ws = wb.worksheets[0];
    let controle: any = null;
    ws.eachRow((row) => {
        const v = row.getCell(1).value;
        if (typeof v === "string" && v.startsWith(PREFIXO_CONTROLE)) controle = JSON.parse(v.slice(PREFIXO_CONTROLE.length));
    });
    return { wb, ws, controle };
}

