import * as fs from "node:fs";
import * as path from "node:path";

/**
 * RAG léxico (BM25) sobre o corpus curado — fase F5.5.
 *
 * Baseline SEM embeddings: totalmente local, determinístico e testável sem chave de API.
 * A recuperação é lexical (BM25); o índice é gravado em `<projeto>/rag/index.json`.
 * Cada chunk carrega proveniência (study_id, fonte, url, seção) para citação rastreável (RV-08).
 *
 * Caminho de upgrade: o mesmo índice pode ganhar um campo `embedding` por chunk e um
 * ranker vetorial, sem mudar o contrato das tools (`rag_index_corpus` / `rag_query`).
 */

export interface RagChunk {
    id: string;
    studyId: string;
    source: string;   // fonte_repositorio (RV-08)
    url: string;       // url_hospedagem (RV-08)
    section: string;
    text: string;
}

interface IndexedDoc extends RagChunk {
    len: number;
    tf: Record<string, number>;
}

export interface RagIndexFile {
    version: 1;
    method: "bm25";
    N: number;
    avgdl: number;
    df: Record<string, number>;
    docs: IndexedDoc[];
}

export interface RagQueryHit {
    text: string;
    study_id: string;
    fonte_repositorio: string;
    url_hospedagem: string;
    section: string;
    score: number;
}

// Stopwords mínimas PT/EN (não exaustivo — só ruído mais comum).
const STOP = new Set([
    "a", "o", "os", "as", "de", "da", "do", "das", "dos", "e", "ou", "que", "em", "no", "na",
    "um", "uma", "para", "por", "com", "se", "ao", "à", "às", "aos", "the", "of", "and", "or",
    "to", "in", "on", "for", "is", "are", "as", "at", "by", "an", "be", "this", "that", "with",
]);

export function tokenize(text: string): string[] {
    return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])
        .filter((t) => t.length > 2 && !STOP.has(t));
}

/** Divide um texto em chunks por parágrafos, agrupando até ~alvo de caracteres; rastreia a seção (heading markdown/ALL-CAPS). */
export function chunkText(text: string, targetChars = 1200): { section: string; text: string }[] {
    const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    const chunks: { section: string; text: string }[] = [];
    let section = "";
    let buf = "";
    const flush = () => {
        if (buf.trim()) chunks.push({ section, text: buf.trim() });
        buf = "";
    };
    for (const p of paras) {
        const headingMatch = p.match(/^#{1,6}\s+(.*)$/);
        const isCapsHeading = p.length <= 80 && /^[\p{Lu}\p{N}\s.:–-]+$/u.test(p) && /\p{Lu}/u.test(p);
        if (headingMatch || isCapsHeading) {
            flush();
            section = (headingMatch ? headingMatch[1] : p).trim();
            continue;
        }
        if ((buf + "\n\n" + p).length > targetChars && buf) flush();
        buf = buf ? buf + "\n\n" + p : p;
    }
    flush();
    return chunks;
}

/** Constrói o mapa identifier→proveniência a partir de included.json (array de {record:{identifier,repositoryName,url}}). */
function buildProvenanceMap(projectDir: string): Record<string, { source: string; url: string }> {
    const map: Record<string, { source: string; url: string }> = {};
    const p = path.join(projectDir, "03_screening", "included.json");
    if (!fs.existsSync(p)) return map;
    try {
        const arr = JSON.parse(fs.readFileSync(p, "utf-8"));
        const list = Array.isArray(arr) ? arr : arr?.included ?? [];
        for (const item of list) {
            const rec = item.record ?? item;
            const id = rec?.identifier ?? rec?.study_id ?? rec?.id;
            if (id) map[String(id)] = { source: rec?.repositoryName ?? rec?.fonte_repositorio ?? "[TBD]", url: rec?.url ?? rec?.url_hospedagem ?? "[TBD]" };
        }
    } catch { /* ignore */ }
    return map;
}

/** Resolve a proveniência de um arquivo de texto: sidecar .meta.json > match por identifier no nome > [TBD]. */
function resolveProvenance(
    filePath: string,
    provMap: Record<string, { source: string; url: string }>,
): { studyId: string; source: string; url: string } {
    const base = path.basename(filePath).replace(/\.(txt|md)$/i, "");
    const metaPath = filePath.replace(/\.(txt|md)$/i, ".meta.json");
    if (fs.existsSync(metaPath)) {
        try {
            const m = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
            return {
                studyId: m.study_id ?? base,
                source: m.fonte_repositorio ?? "[TBD]",
                url: m.url_hospedagem ?? "[TBD]",
            };
        } catch { /* fall through */ }
    }
    for (const id of Object.keys(provMap)) {
        if (base.includes(id)) return { studyId: id, source: provMap[id].source, url: provMap[id].url };
    }
    return { studyId: base, source: "[TBD]", url: "[TBD]" };
}

/** Indexa os arquivos de texto (.txt/.md) de um diretório do corpus e grava rag/index.json. */
export function indexCorpus(
    projectDir: string,
    corpusRelDir?: string,
): { indexed: number; studies: number; skippedPdfsOnly: number; indexPath: string; missingProvenance: string[]; skippedTranslations: string[] } {
    const candidates = corpusRelDir
        ? [corpusRelDir]
        : ["04_extraction/fulltext", "03_screening/fulltext", "03_screening/pdfs"];
    let corpusDir = "";
    for (const c of candidates) {
        const abs = path.join(projectDir, c);
        if (fs.existsSync(abs)) { corpusDir = abs; break; }
    }
    if (!corpusDir) throw new Error(`Nenhum diretório de corpus encontrado (tentado: ${candidates.join(", ")})`);

    const provMap = buildProvenanceMap(projectDir);
    const files = fs.readdirSync(corpusDir);
    // Arquivos gerados por translate_document (batch_processor.ts) seguem o padrão
    // "<basename>_tradução_<idioma>.md" e trazem, no próprio corpo, o aviso "TEXTO DE
    // APOIO — NÃO É FONTE PRIMÁRIA". Sem excluí-los aqui, o match por identifier na
    // resolução de proveniência (base.includes(id)) faz a tradução herdar a fonte e a
    // URL do estudo real: texto gerado por LLM sai do rag_query com o rótulo do artigo
    // primário (DEBT-023 — fabricação de evidência com rastro aparentemente íntegro).
    const isTranslationDerivative = (f: string) => /_tradu[cç][aã]o_/i.test(f);
    const textFiles = files.filter((f) => /\.(txt|md)$/i.test(f) && !isTranslationDerivative(f));
    const skippedTranslations = files.filter((f) => /\.(txt|md)$/i.test(f) && isTranslationDerivative(f));
    const skippedPdfsOnly = files.filter((f) => /\.pdf$/i.test(f)).length;

    const docs: IndexedDoc[] = [];
    const df: Record<string, number> = {};
    const studies = new Set<string>();
    const missingProvenance: string[] = [];

    for (const f of textFiles) {
        const fp = path.join(corpusDir, f);
        const raw = fs.readFileSync(fp, "utf-8");
        const prov = resolveProvenance(fp, provMap);
        studies.add(prov.studyId);
        if (prov.source === "[TBD]" || prov.url === "[TBD]") missingProvenance.push(prov.studyId);
        const chunks = chunkText(raw);
        chunks.forEach((ch, i) => {
            const tokens = tokenize(ch.text);
            const tf: Record<string, number> = {};
            for (const t of tokens) tf[t] = (tf[t] ?? 0) + 1;
            for (const t of Object.keys(tf)) df[t] = (df[t] ?? 0) + 1;
            docs.push({
                id: `${prov.studyId}#${i}`,
                studyId: prov.studyId,
                source: prov.source,
                url: prov.url,
                section: ch.section,
                text: ch.text,
                len: tokens.length,
                tf,
            });
        });
    }

    const N = docs.length;
    const avgdl = N > 0 ? docs.reduce((s, d) => s + d.len, 0) / N : 0;
    const index: RagIndexFile = { version: 1, method: "bm25", N, avgdl, df, docs };

    const ragDir = path.join(projectDir, "rag");
    if (!fs.existsSync(ragDir)) fs.mkdirSync(ragDir, { recursive: true });
    const indexPath = path.join(ragDir, "index.json");
    fs.writeFileSync(indexPath, JSON.stringify(index));

    return { indexed: N, studies: studies.size, skippedPdfsOnly, indexPath, missingProvenance, skippedTranslations };
}

/** Consulta o índice por BM25 e retorna os top-k trechos com proveniência. */
export function queryCorpus(projectDir: string, question: string, topK = 8): RagQueryHit[] {
    const indexPath = path.join(projectDir, "rag", "index.json");
    if (!fs.existsSync(indexPath)) {
        throw new Error("Índice RAG não encontrado. Rode rag_index_corpus primeiro.");
    }
    const idx: RagIndexFile = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    const qTerms = [...new Set(tokenize(question))];
    const k1 = 1.5, b = 0.75;

    const scored = idx.docs.map((d) => {
        let score = 0;
        for (const t of qTerms) {
            const f = d.tf[t];
            if (!f) continue;
            const n = idx.df[t] ?? 0;
            const idf = Math.log(1 + (idx.N - n + 0.5) / (n + 0.5));
            const denom = f + k1 * (1 - b + b * (d.len / (idx.avgdl || 1)));
            score += idf * ((f * (k1 + 1)) / (denom || 1));
        }
        return { d, score };
    });

    return scored
        .filter((s) => s.score > 0)
        .sort((a, b2) => b2.score - a.score)
        .slice(0, topK)
        .map((s) => ({
            text: s.d.text,
            study_id: s.d.studyId,
            fonte_repositorio: s.d.source,
            url_hospedagem: s.d.url,
            section: s.d.section,
            score: Math.round(s.score * 1000) / 1000,
        }));
}
