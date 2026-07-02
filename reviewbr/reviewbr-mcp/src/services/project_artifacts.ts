import * as fs from "node:fs";
import * as path from "node:path";
import { SearchResult } from "../types.js";

/**
 * project_artifacts — leitura/gravação dos ARTEFATOS CANÔNICOS on-disk de um projeto.
 * É a cola que faz o funil (compute_flow_counts) e o RAG (rag_index_corpus) encontrarem
 * o que as tools produzem. Fonte da verdade = estes arquivos (RV-02).
 *
 * Contrato:
 *   01_raw/database_records.json   (bases)      | 01_raw/other_records.json (snowball/cinzenta)
 *   02_deduplicated/dataset.json                | 02_deduplicated/dedupe_report.json
 *   03_screening/included.json / excluded_ta.json / excluded_fulltext.json / fulltext_not_retrieved.json
 */

function resolveDir(projectPath: string): string {
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

export function writeDeduped(projectPath: string, unique: any[], report: unknown): void {
    const dir = resolveDir(projectPath);
    writeJson(dir, "02_deduplicated/dataset.json", unique);
    writeJson(dir, "02_deduplicated/dedupe_report.json", report);
}

/** Grava os artefatos de triagem conforme o estágio (ta = título/resumo; fulltext = texto completo). */
export function writeScreening(
    projectPath: string,
    stage: "ta" | "fulltext",
    included: any[],
    excluded: any[],
): { includedFile: string; excludedFile: string } {
    const dir = resolveDir(projectPath);
    const excludedRel = stage === "ta" ? "03_screening/excluded_ta.json" : "03_screening/excluded_fulltext.json";
    // Na fase TA, os incluídos são os "encaminhados para texto completo"; na fase fulltext, são os incluídos FINAIS.
    const includedRel = stage === "ta" ? "03_screening/included_ta.json" : "03_screening/included.json";
    const includedFile = writeJson(dir, includedRel, included);
    const excludedFile = writeJson(dir, excludedRel, excluded);
    return { includedFile, excludedFile };
}
