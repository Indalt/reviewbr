import * as fs from "node:fs";
import * as path from "node:path";
import { SearchResult } from "../types.js";
import { ProjectStateService } from "./project_state.js";

/**
 * project_artifacts — leitura/gravação dos ARTEFATOS CANÔNICOS on-disk de um projeto.
 * É a cola que faz o funil (compute_flow_counts) e o RAG (rag_index_corpus) encontrarem
 * o que as tools produzem. Fonte da verdade = estes arquivos (RV-02).
 *
 * Contrato:
 *   01_raw/database_records.json   (bases)      | 01_raw/other_records.json (snowball/cinzenta)
 *   02_deduplicated/dataset.json                | 02_deduplicated/dedupe_report.json
 *   03_screening/included.json / excluded_ta.json / excluded_fulltext.json / fulltext_not_retrieved.json
 *
 * ─── A SEPARAÇÃO QUE PROTEGE O FUNIL ──────────────────────────────────────────
 *
 * `consolidateRaw` soma TUDO que estiver em `01_raw/*.json`. Logo, o que cai ali entra no
 * funil PRISMA e passa a contar no fluxograma. Isso torna `01_raw/` território exclusivo da
 * busca com **metodologia declarada** — a que correu sob protocolo travado (RV-01).
 *
 * Resultado de busca exploratória (sem `projectPath`, pelo `scout` ou por tool de aquisição
 * chamada sem projeto) **nunca** é gravado aqui. Não é efeito colateral de um caminho não
 * previsto: é a regra. Misturar as duas origens contaminaria a contagem com registros que
 * nenhum protocolo autorizou, e o PRISMA-S exige declarar o que foi recuperado por base.
 *
 * Como isso é garantido hoje: toda chamada a `appendRawRecords` em `index.ts` está dentro de
 * `if (params.projectPath)`, e sem `projectPath` o `ProtocolGate` devolve `SEM_PROJETO` com
 * aviso declarado (não em silêncio — ver `declararModo`). Quem quiser guardar o exploratório
 * grava FORA do diretório do projeto; o `scout` usa `innovation_reports/`.
 */

/** Resolve projectPath para diretório absoluto, tratando o caso em que ele JÁ é absoluto
 *  (o guardrail em index.ts aceita esse formato). Exportado para reuso em index.ts
 *  (DEBT-084: as 6 tools search_* usavam path.join(cwd, projectPath) sem essa checagem,
 *  o que produz caminho inválido no Windows quando projectPath já é absoluto). */
export function resolveDir(projectPath: string): string {
    // NEGA POR PADRÃO. `projectPath` vazio resolvia para `process.cwd()` — o diretório do
    // próprio servidor MCP —, e ali criaria um `01_raw/` que o funil de nenhum projeto conta
    // e que nenhum protocolo autorizou. `undefined` só falhava por acidente, com TypeError
    // de dentro do path.join. Sem projeto declarado não há onde persistir: é a fronteira
    // entre exploração e busca oficial, e ela precisa ser explícita (mesma semântica do
    // ProtocolGate, que passou a negar por padrão em vez de liberar por omissão).
    if (typeof projectPath !== "string" || !projectPath.trim()) {
        throw new Error(
            "projectPath vazio ou ausente: não há onde persistir. Resultado de busca sem projeto " +
            "declarado é exploratório e NÃO entra no funil PRISMA — grave fora do diretório do projeto."
        );
    }
    return path.isAbsolute(projectPath) ? projectPath : path.join(process.cwd(), projectPath);
}

function readArray(file: string): any[] {
    if (!fs.existsSync(file)) return [];
    try {
        const parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
        if (Array.isArray(parsed)) return parsed;
        for (const k of ["records", "results", "included", "data", "items"]) {
            if (Array.isArray(parsed?.[k])) return parsed[k];
        }
        return [];
    } catch { return []; }
}

function writeJson(dir: string, rel: string, data: unknown): string {
    const p = path.join(dir, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
    return p;
}

/** Chave de identidade de um registro (para merge/dedup leve entre chamadas). */
function recordKey(r: any): string {
    const doi = (r?.doi || "").toString().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, "").trim();
    if (doi) return "doi:" + doi;
    if (r?.identifier) return "id:" + String(r.identifier).toLowerCase();
    if (r?.url) return "url:" + String(r.url).toLowerCase();
    return "title:" + String(r?.title || "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** Faz merge de novos registros no arquivo canônico (dedup leve por chave). Retorna contagens. */
export function appendRawRecords(
    projectPath: string,
    records: SearchResult[],
    kind: "database" | "other" = "database",
): { total: number; added: number; file: string } {
    const dir = resolveDir(projectPath);
    const rel = kind === "other" ? "01_raw/other_records.json" : "01_raw/database_records.json";
    const existing = readArray(path.join(dir, rel));
    const seen = new Set(existing.map(recordKey));
    let added = 0;
    for (const r of records) {
        const k = recordKey(r);
        if (!seen.has(k)) { seen.add(k); existing.push(r); added++; }
    }
    const file = writeJson(dir, rel, existing);
    return { total: existing.length, added, file };
}

/** Lê e consolida TODOS os brutos de 01_raw/*.json (per-fonte + database_records) num único conjunto. */
export function consolidateRaw(projectPath: string): { database: any[]; other: any[] } {
    const dir = resolveDir(projectPath);
    const rawDir = path.join(dir, "01_raw");
    const database: any[] = [];
    const other: any[] = [];
    const seenDb = new Set<string>();
    const seenOther = new Set<string>();
    if (fs.existsSync(rawDir)) {
        for (const f of fs.readdirSync(rawDir)) {
            if (!f.endsWith(".json")) continue;
            const isOther = /snowball|other/i.test(f);
            for (const r of readArray(path.join(rawDir, f))) {
                const k = recordKey(r);
                if (isOther) { if (!seenOther.has(k)) { seenOther.add(k); other.push(r); } }
                else { if (!seenDb.has(k)) { seenDb.add(k); database.push(r); } }
            }
        }
    }
    // Persiste os consolidados canônicos
    writeJson(dir, "01_raw/database_records.json", database);
    if (other.length) writeJson(dir, "01_raw/other_records.json", other);
    return { database, other };
}

export function writeDeduped(projectPath: string, unique: any[], report: unknown, pairs?: unknown[]): void {
    const dir = resolveDir(projectPath);
    writeJson(dir, "02_deduplicated/dataset.json", unique);
    writeJson(dir, "02_deduplicated/dedupe_report.json", report);
    // DEBT-029: sem o rastro (mantido, removido, critério, fontes) a deduplicação é
    // irreversível e inauditável — o número emerge, o processo evapora. Gravado sempre
    // que houver pares (mesmo array vazio, para declarar "zero duplicatas" em vez de
    // omitir o arquivo, o que um leitor não distingue de "nunca rodou").
    if (pairs !== undefined) writeJson(dir, "02_deduplicated/dedupe_pairs.json", pairs);
}

/** Lê (sem gravar nada) o universo de registros já conhecidos do projeto, para dedup em
 *  outras tools (ex.: expand_search_snowball, DEBT-059). Prioridade: 02_deduplicated/
 *  dataset.json (se a deduplicação já rodou) senão 01_raw/*.json somado em memória —
 *  leitura pura, ao contrário de consolidateRaw() ela NÃO reescreve os arquivos canônicos. */
export function readExistingDataset(projectPath: string): any[] {
    const dir = resolveDir(projectPath);
    const dedupFile = path.join(dir, "02_deduplicated", "dataset.json");
    if (fs.existsSync(dedupFile)) return readArray(dedupFile);

    const rawDir = path.join(dir, "01_raw");
    const all: any[] = [];
    if (fs.existsSync(rawDir)) {
        for (const f of fs.readdirSync(rawDir)) {
            if (f.endsWith(".json")) all.push(...readArray(path.join(rawDir, f)));
        }
    }
    return all;
}

/** Lê 02_deduplicated/dedupe_pairs.json (DEBT-029). `null` quando o arquivo não existe —
 *  distinto de array vazio, que significa "rodou e não achou duplicata nenhuma". Usado
 *  por audit_methodology (DEBT-024) para auditar o LOG em vez de re-rodar o dedup. */
export function readDedupePairs(projectPath: string): any[] | null {
    const dir = resolveDir(projectPath);
    const file = path.join(dir, "02_deduplicated", "dedupe_pairs.json");
    if (!fs.existsSync(file)) return null;
    try {
        const parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
        return Array.isArray(parsed) ? parsed : null;
    } catch { return null; }
}

/**
 * Composição declarada de um conjunto de triagem (DEBT-028).
 *
 * `included` mistura SIM e MAYBE desde sempre, e isso NÃO muda aqui: quem entra no corpus
 * é regra de inclusão, e mexer nela fora de uma decisão do pesquisador alteraria o resultado
 * da revisão (RV-04). O defeito era o silêncio — "12 incluídos" não dizia se eram 12 sins ou
 * 3 sins e 9 dúvidas, e as duas coisas levam a revisões diferentes.
 *
 * Lê o mesmo artefato que `writeScreening` grava: cada item é um ScreeningResult e carrega
 * `decision`. Logo o número declarado na resposta e o número que um auditor contar do disco
 * são o mesmo número — que é a única forma de a declaração valer alguma coisa (RV-02).
 */
export function composicaoTriagem(itens: any[]): { total: number; sim: number; maybe: number } {
    const lista = Array.isArray(itens) ? itens : [];
    const maybe = lista.filter((r) => r?.decision === "MAYBE").length;
    return { total: lista.length, sim: lista.length - maybe, maybe };
}

/** Grava JSON por arquivo temporário + rename: uma queda no meio da escrita não deixa o
 *  arquivo pela metade (o rename substitui o destino de uma vez). */
function gravarJsonAtomico(file: string, data: unknown): void {
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, file);
}

/**
 * Percorre um dataset em lotes (retrieve_fulltexts, F4.3) e regrava o arquivo INTEIRO depois
 * de cada lote — DEBT-089.
 *
 * Antes, o laço regravava o próprio arquivo de entrada só com os registros já processados
 * (`{ ...data, included: results }`): depois do primeiro lote o arquivo tinha 10 incluídos, e
 * uma queda no lote seguinte apagava o resto do corpus sem cópia nem log. Também transformava
 * entrada em array cru num objeto com chaves numéricas e reordenava os registros (push em
 * paralelo).
 *
 * Agora `processar` altera cada item no lugar (ex.: grava `pdfPath`) e o que se grava é a raiz
 * lida — array ou objeto, com todas as chaves e na ordem original. A escrita é atômica.
 */
export async function processarDatasetEmLotes(
    inputPath: string,
    processar: (item: any) => Promise<void>,
    tamanhoLote = 10,
): Promise<{ total: number }> {
    const data = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
    const registros: any[] | null = Array.isArray(data) ? data : Array.isArray(data?.included) ? data.included : null;
    if (!registros) {
        throw new Error(`Dataset sem lista de registros (array ou chave 'included'): ${inputPath}`);
    }
    for (let i = 0; i < registros.length; i += tamanhoLote) {
        await Promise.all(registros.slice(i, i + tamanhoLote).map(processar));
        gravarJsonAtomico(inputPath, data);
    }
    return { total: registros.length };
}

function artefatosDaTriagem(stage: "ta" | "fulltext"): { includedRel: string; excludedRel: string } {
    // Na fase TA, os incluídos são os "encaminhados para texto completo"; na fase fulltext, são os incluídos FINAIS.
    return stage === "ta"
        ? { includedRel: "03_screening/included_ta.json", excludedRel: "03_screening/excluded_ta.json" }
        : { includedRel: "03_screening/included.json", excludedRel: "03_screening/excluded_fulltext.json" };
}

/** A triagem já gravada do estágio, ou `null` quando não há nenhuma decisão gravada (DEBT-112). */
export function triagemGravada(projectPath: string, stage: "ta" | "fulltext"): { incluidos: number; excluidos: number } | null {
    const dir = resolveDir(projectPath);
    const { includedRel, excludedRel } = artefatosDaTriagem(stage);
    const incluidos = readArray(path.join(dir, includedRel)).length;
    const excluidos = readArray(path.join(dir, excludedRel)).length;
    return incluidos + excluidos > 0 ? { incluidos, excluidos } : null;
}

/**
 * Grava os artefatos de triagem conforme o estágio (ta = título/resumo; fulltext = texto completo).
 *
 * DEBT-112 — a segunda corrida apagava a primeira sem registro. Decisão do Vicente de 08/10/2026:
 * sobrescrever pode, depois da análise do pesquisador; sem registro do que havia, do que passa a
 * haver e de quem autorizou, não. Então, quando já há triagem gravada no estágio:
 *  - sem `substituicao.autorizacao` (a decisão do pesquisador, nas palavras dele), recusa;
 *  - com ela, copia os artefatos anteriores para 03_screening/substituidas/<quando>_<estágio>/,
 *    grava ali substituicao.json (havia, passa a haver, autorização) e registra a autorização como
 *    decisão do pesquisador no project_state — com fase própria, para não destravar a etapa (RV-04).
 * Os nomes canônicos continuam os mesmos: o funil lê sempre a triagem vigente.
 */
export function writeScreening(
    projectPath: string,
    stage: "ta" | "fulltext",
    included: any[],
    excluded: any[],
    substituicao?: { autorizacao?: string },
): { includedFile: string; excludedFile: string; substituicao?: { pasta: string; havia: { incluidos: number; excluidos: number } } } {
    const dir = resolveDir(projectPath);
    const { includedRel, excludedRel } = artefatosDaTriagem(stage);

    let registro: { pasta: string; havia: { incluidos: number; excluidos: number } } | undefined;
    const havia = triagemGravada(projectPath, stage);
    if (havia) {
        const autorizacao = (substituicao?.autorizacao ?? "").trim();
        if (!autorizacao) {
            throw new Error(
                `Já há triagem ${stage} gravada (${havia.incluidos} incluídos, ${havia.excluidos} excluídos). ` +
                "Substituí-la exige a autorização do pesquisador, nas palavras dele ('substituicao'): sem ela a " +
                "corrida anterior sumiria sem registro (DEBT-112)."
            );
        }
        const quando = new Date().toISOString();
        const pasta = `03_screening/substituidas/${quando.replace(/[:.]/g, "-")}_${stage}`;
        fs.mkdirSync(path.join(dir, pasta), { recursive: true });
        for (const rel of [includedRel, excludedRel]) {
            const origem = path.join(dir, rel);
            if (fs.existsSync(origem)) fs.copyFileSync(origem, path.join(dir, pasta, path.basename(rel)));
        }
        const passa = { incluidos: included.length, excluidos: excluded.length };
        writeJson(dir, `${pasta}/substituicao.json`, { quando, estagio: stage, autorizacao, havia, passa_a_haver: passa, arquivos_anteriores: pasta });
        ProjectStateService.logDecision(dir, {
            phase: `substituicao_triagem_${stage}`,
            agent: "screen_candidates",
            decision: `Triagem ${stage} substituída: havia ${havia.incluidos} incluídos e ${havia.excluidos} excluídos; ` +
                `passa a haver ${passa.incluidos} e ${passa.excluidos}. Anterior arquivada em ${pasta}.`,
            por: "pesquisador",
            contribuicao: autorizacao,
        });
        registro = { pasta, havia };
    }

    const includedFile = writeJson(dir, includedRel, included);
    const excludedFile = writeJson(dir, excludedRel, excluded);
    return { includedFile, excludedFile, ...(registro ? { substituicao: registro } : {}) };
}
