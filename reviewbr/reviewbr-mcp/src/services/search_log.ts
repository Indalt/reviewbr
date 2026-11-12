import * as fs from "node:fs";
import * as path from "node:path";

/**
 * search_log — o registro da busca que o PRISMA-S pede, gravado pelo CÓDIGO (DEBT-056).
 *
 * A skill `prisma-s-logging` chama `logs/search_log_prisma_s.csv` de "log obrigatório" e o
 * `conduct-review` o usa como retorno da F2, mas quem o escrevia era o próprio agente, à mão:
 * o insumo e a assinatura saíam da mesma mão (autocertificação). Decisão do Vicente em
 * 29/10/2026: o código grava o log de busca. Cada tool que executa uma busca sob projeto chama
 * `registrarBuscaPrismaS` — também quando a busca falha, porque busca que falhou e não deixou
 * linha é busca que "não aconteceu" e some do relato.
 *
 * Colunas: as seis mínimas da skill, nesta ordem, para que um log antigo digitado pelo agente
 * continue legível ao receber as linhas novas:
 *   Datetime (ISO 8601) · Database (fonte, com a tool entre parênteses — a interface, S1) ·
 *   Filter (todos os parâmetros da execução, menos a string e o projeto) · Query (string exata;
 *   `Indefinido` quando a tool não a conhece, como num export importado) · Hits (registros que a
 *   execução devolveu; `Indefinido` quando ela não terminou) · Errors (falha e truncamento).
 *
 * `logs/search_history.json` (o log que a máquina já gravava) continua como registro bruto de
 * cada chamada; o CSV é o que a norma pede e o que os agentes leem.
 */

export const LOG_PRISMA_S = path.join("logs", "search_log_prisma_s.csv");
export const LOG_HISTORICO = path.join("logs", "search_history.json");
export const COLUNAS_PRISMA_S = ["Datetime", "Database", "Filter", "Query", "Hits", "Errors"] as const;

/** Nome da fonte por tool. A tool vai entre parênteses na coluna Database. */
const FONTE_POR_TOOL: Record<string, string> = {
    search_openalex: "OpenAlex",
    search_crossref: "Crossref",
    search_scielo: "SciELO (via OpenAlex)",
    search_semanticscholar: "Semantic Scholar",
    search_core: "CORE",
    search_europe_pmc: "Europe PMC",
    search_pubmed: "PubMed",
    search_papers_optimized: "Repositórios por camada",
    search_repository: "Repositórios",
    harvest_records: "OAI-PMH",
    expand_search_snowball: "OpenAlex, citações (snowballing)",
    import_dataset_ris: "Export RIS importado",
    import_bvs_export: "BVS/LILACS (export CSV importado)",
};

/** Parâmetros que não são filtro: a string vai em Query, o projeto não descreve a busca, e
 *  conteúdo bruto (dataset/arquivo) não cabe numa célula. */
const FORA_DO_FILTRO = new Set(["query", "projectPath", "projectId", "dataset", "content"]);

export interface BuscaExecutada {
    tool: string;
    /** String exata executada. Ausente = `Indefinido` (a tool não a conhece). */
    query?: string;
    /** Fonte, quando a da tabela não basta (ex.: a base declarada num export RIS). */
    database?: string;
    /** Parâmetros da execução; viram a coluna Filter. */
    filtros?: Record<string, unknown>;
    /** Registros que a execução devolveu. `null` = a execução não terminou (Indefinido). */
    hits: number | null;
    /** Total que a fonte declarou, quando declara; maior que `hits` = busca truncada. */
    totalDeclarado?: number;
    erros?: unknown;
    quando?: Date;
}

export function filtrosComoTexto(filtros?: Record<string, unknown>): string {
    if (!filtros) return "";
    return Object.entries(filtros)
        .filter(([k, v]) => !FORA_DO_FILTRO.has(k) && v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`)
        .join("; ");
}

/** As seis células de uma linha do log, sem escape de CSV. */
export function linhaPrismaS(b: BuscaExecutada): string[] {
    const erros: string[] = [];
    if (Array.isArray(b.erros)) erros.push(...b.erros.map((e) => String(e)).filter(Boolean));
    else if (b.erros) erros.push(String(b.erros));
    if (typeof b.totalDeclarado === "number" && typeof b.hits === "number" && b.totalDeclarado > b.hits) {
        erros.push(`truncada: a fonte declarou ${b.totalDeclarado}, vieram ${b.hits}`);
    }
    const fonte = b.database ?? FONTE_POR_TOOL[b.tool];
    return [
        (b.quando ?? new Date()).toISOString(),
        fonte ? `${fonte} (${b.tool})` : b.tool,
        filtrosComoTexto(b.filtros),
        typeof b.query === "string" && b.query.length > 0 ? b.query : "Indefinido",
        typeof b.hits === "number" ? String(b.hits) : "Indefinido",
        erros.join(" | "),
    ];
}

function celula(v: string): string {
    return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Anexa uma linha a `<projeto>/logs/search_log_prisma_s.csv` (cria o arquivo com o cabeçalho). */
export function registrarBuscaPrismaS(projectDir: string, b: BuscaExecutada): string {
    const file = path.join(projectDir, LOG_PRISMA_S);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const novo = !fs.existsSync(file) || fs.statSync(file).size === 0;
    const cabecalho = novo ? COLUNAS_PRISMA_S.join(",") + "\n" : "";
    fs.appendFileSync(file, cabecalho + linhaPrismaS(b).map(celula).join(",") + "\n", "utf-8");
    return file;
}

/**
 * DEBT-030 — registro de uma execução das tools em lote (batch_keyword_screen, batch_llm_extract,
 * batch_db_screen, translate_document): os parâmetros e o resultado POR ITEM, num arquivo por
 * execução em `<projeto>/logs/lote/`. Antes elas devolviam só o resumo e descartavam o resultado
 * — duas decidem por LLM, e decisão sem rastro não se reconstrói nem se contesta.
 */
export function gravarExecucaoEmLote(projectDir: string, tool: string, params: Record<string, unknown>, resultados: unknown): string {
    const quando = new Date().toISOString();
    const file = path.join(projectDir, "logs", "lote", `${quando.replace(/[:.]/g, "-")}_${tool}.json`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ quando, tool, params, resultados }, null, 2));
    return file;
}

/** Anexa uma entrada a `<projeto>/logs/search_history.json` (registro bruto de cada chamada). */
export function registrarHistorico(projectDir: string, tool: string, data: Record<string, unknown>): string {
    const file = path.join(projectDir, LOG_HISTORICO);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    let history: unknown[] = [];
    if (fs.existsSync(file)) {
        try {
            const lido = JSON.parse(fs.readFileSync(file, "utf-8"));
            if (Array.isArray(lido)) history = lido;
        } catch { history = []; }
    }
    history.push({ timestamp: new Date().toISOString(), tool, ...data });
    fs.writeFileSync(file, JSON.stringify(history, null, 2));
    return file;
}
