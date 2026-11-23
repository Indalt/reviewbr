/**
 * Platform-specific API adapters for repositories that don't follow
 * standard OAI-PMH or DSpace REST patterns.
 * 
 * Informed by:
 * - ApoenaX/bdtd-scraper (GitHub): BDTD uses VuFind API
 * - scieloorg/articles_meta (GitHub): SciELO ArticleMeta REST API
 * - USP uses custom result.php (not DSpace)
 * - DSpace 7: OAI-PMH at /server/oai/request (not /oai/request)
 */

import { robotsPermite } from "../utils/robots.js";
import * as cheerio from "cheerio";
import { fetchText } from "../utils/http.js";
import { rateLimiter } from "../utils/rate-limiter.js";
import type { SearchResult, SearchOptions, DublinCoreMetadata } from "../types.js";

// ─── SciELO ArticleMeta API ─────────────────────────────────
// Base: http://articlemeta.scielo.org/api/v1/
// Docs: github.com/scieloorg/articles_meta
// Confirmed working: article identifiers, article detail, journal listing

interface ArticleMetaIdentifier {
    code: string;
    collection: string;
    processing_date: string;
    doi?: string;
}

interface ArticleMetaResponse {
    meta: { filter: Record<string, unknown>; total: number };
    objects: ArticleMetaIdentifier[];
}

interface ArticleMetaArticle {
    code: string;
    collection: string;
    doi?: string;
    title?: Record<string, string>;
    authors?: Array<{
        given_names: string;
        surname: string;
        xref?: string[];
        affiliation?: string;
    }>;
    publication_date?: string;
    abstract?: Record<string, string>;
    subject_areas?: string[];
    subject_descriptors?: string[];
    languages?: string[];
    fulltexts?: Record<string, Record<string, string>>; // e.g. {"pdf": {"pt": "url"}}
    journal?: {
        v100?: Array<{ _: string }>;
        v435?: Array<{ _: string }>; // ISSN
        v150?: Array<{ _: string }>; // abbreviated title
    };
    journal_title?: string;
    issn?: string;
    aff_countries?: string[];
    document_type?: string;
}

export class ScieloAdapter {
    private baseUrl = "http://articlemeta.scielo.org/api/v1";

    /**
     * Search SciELO articles via ArticleMeta REST API.
     *
     * Strategy: ArticleMeta doesn't have fulltext search.
     * We list article identifiers (filterable by date/ISSN),
     * then fetch details and filter client-side by query/title/author.
     */
    async search(query: string, opts?: SearchOptions): Promise<SearchResult[]> {
        const limit = opts?.maxResults ?? 20;
        const collection = "scl"; // SciELO Brazil

        // Step 1: Get article identifiers with server-side filters
        const params = new URLSearchParams();
        params.set("collection", collection);
        params.set("limit", String(Math.min(limit * 5, 200))); // over-fetch for client-side filtering

        if (opts?.dateFrom) params.set("from", opts.dateFrom);
        if (opts?.dateUntil) params.set("until", opts.dateUntil);
        if (opts?.issn) params.set("issn", opts.issn);

        const idsUrl = `${this.baseUrl}/article/identifiers/?${params}`;
        await rateLimiter.acquire(idsUrl);
        const idsText = await fetchText(idsUrl, {
            timeout: 30_000,
            headers: { Accept: "application/json" },
        });

        const idsData = JSON.parse(idsText) as ArticleMetaResponse;
        if (!idsData.objects?.length) return [];



        // Step 2: Fetch article details in parallel (batches of 5)
        const results: SearchResult[] = [];
        const queryLower = query.toLowerCase();
        const titleFilter = opts?.title?.toLowerCase();
        const authorFilter = opts?.author?.toLowerCase();

        const batchSize = 5;
        for (let i = 0; i < idsData.objects.length && results.length < limit; i += batchSize) {

            const batch = idsData.objects.slice(i, i + batchSize);
            const articles = await Promise.allSettled(
                batch.map((id) => this.getArticleDetail(id.code, collection))
            );

            for (const settled of articles) {
                if (settled.status !== "fulfilled" || !settled.value) continue;
                const art = settled.value;

                // Client-side filtering
                const allText = [
                    ...Object.values(art.title ?? {}),
                    ...Object.values(art.abstract ?? {}),
                    ...(art.subject_areas ?? []),
                    ...(art.subject_descriptors ?? []),
                ].join(" ").toLowerCase();

                if (queryLower && !allText.includes(queryLower)) continue;

                if (titleFilter) {
                    const titleText = Object.values(art.title ?? {}).join(" ").toLowerCase();
                    if (!titleText.includes(titleFilter)) continue;
                }

                if (authorFilter) {
                    const authorText = (art.authors ?? [])
                        .map((a) => `${a.given_names} ${a.surname}`.toLowerCase())
                        .join(" ");
                    if (!authorText.includes(authorFilter)) continue;
                }

                if (opts?.subjectArea) {
                    const areas = (art.subject_areas ?? []).map((a) => a.toLowerCase());
                    if (!areas.some((a) => a.includes(opts.subjectArea!.toLowerCase()))) continue;
                }

                results.push(this.articleToSearchResult(art));
                if (results.length >= limit) break;
            }
        }

        return results;
    }

    /**
     * Get full article metadata from ArticleMeta API.
     */
    async getArticleDetail(code: string, collection = "scl"): Promise<ArticleMetaArticle> {
        const url = `${this.baseUrl}/article/?collection=${collection}&code=${code}`;
        await rateLimiter.acquire(url);
        const text = await fetchText(url, {
            timeout: 15_000,
            headers: { Accept: "application/json" },
        });
        return JSON.parse(text) as ArticleMetaArticle;
    }

    /**
     * Get article metadata as Dublin Core.
     */
    async getMetadata(code: string, collection = "scl"): Promise<Partial<DublinCoreMetadata>> {
        const art = await this.getArticleDetail(code, collection);
        return {
            title: art.title ? Object.values(art.title) : [],
            creator: art.authors?.map((a) => `${a.given_names} ${a.surname}`) ?? [],
            date: art.publication_date ? [art.publication_date] : [],
            description: art.abstract ? Object.values(art.abstract) : [],
            subject: [...(art.subject_areas ?? []), ...(art.subject_descriptors ?? [])],
            language: art.languages ?? [],
            identifier: [art.code, ...(art.doi ? [`doi:${art.doi}`] : [])],
        };
    }

    /**
     * List journals in SciELO Brazil.
     */
    async listJournals(limit = 100): Promise<Array<{ code: string; issn: string }>> {
        const url = `${this.baseUrl}/journal/identifiers/?collection=scl&limit=${limit}`;
        await rateLimiter.acquire(url);
        const text = await fetchText(url, {
            timeout: 15_000,
            headers: { Accept: "application/json" },
        });
        const data = JSON.parse(text) as { objects: Array<{ code: string }> };
        return data.objects.map((j) => ({ code: j.code, issn: j.code }));
    }

    /**
     * Convert ArticleMeta article to SearchResult — guaranteed to have URL.
     */
    private articleToSearchResult(art: ArticleMetaArticle): SearchResult {
        // Build URL: either DOI URL or SciELO article page
        const doiUrl = art.doi ? `https://doi.org/${art.doi}` : null;
        const scieloUrl = `https://www.scielo.br/j/article/${art.code}`;
        const url = doiUrl ?? scieloUrl;

        // Find PDF URL from fulltexts
        let pdfUrl: string | undefined;
        if (art.fulltexts?.pdf) {
            pdfUrl = Object.values(art.fulltexts.pdf)[0];
        }

        // Get title — prefer Portuguese, then English, then any
        const title = art.title?.pt ?? art.title?.en ?? Object.values(art.title ?? {})[0] ?? "";

        // Get journal title
        const journalTitle = art.journal_title ?? art.journal?.v100?.[0]?._ ?? undefined;
        const issn = art.issn ?? art.journal?.v435?.[0]?._ ?? undefined;

        return {
            repositoryId: "BR-AGG-0002",
            repositoryName: "SciELO",
            identifier: art.code,
            title,
            creators: art.authors?.map((a) => `${a.given_names} ${a.surname}`) ?? [],
            description: art.abstract?.pt ?? art.abstract?.en ?? Object.values(art.abstract ?? {})[0] ?? "",
            date: art.publication_date ?? "",
            type: art.document_type ?? "article",
            url,
            doi: art.doi,
            pdfUrl,
            journal: journalTitle,
            issn,
            subjectAreas: art.subject_areas,
            language: art.languages?.[0],
            accessMethod: "scielo-articlemeta",
            audit: {
                methodology: "CUSTOM" as any,
                searchQueryUsed: "SCIELO_ARTICLE_META_QUERY",
                extractionDate: new Date().toISOString(),
                provenanceSource: this.baseUrl
            }
        };
    }
}

// ─── BDTD VuFind API ────────────────────────────────────────
// Base: https://bdtd.ibict.br/vufind
// Inspired by: ApoenaX/bdtd-scraper (GitHub)
// Confirmed: /api/v1/search returns JSON with resultCount, records

interface BdtdRecord {
    id: string;
    title: string;
    authors?: { primary?: Record<string, string[]>; secondary?: Record<string, string[]> | unknown[] };
    publicationDates?: string[];
    urls?: Array<{ url: string; desc?: string }>;
    subjects?: string[][];
    /** Resumo. Na API do VuFind o campo é `summary` (swagger da BDTD, lido em 19/11/2026). */
    summary?: string[];
    languages?: string[];
    formats?: string[];
    institutions?: string[];
    /** Oasisbr: a API devolve só a primeira palavra-chave em `topic` (texto); a lista inteira está no `rawData`. */
    topic?: string | string[];
    rawData?: { topic?: string | string[] };
}

/**
 * Campos pedidos à API. Sem `field[]`, o VuFind devolve só os padrão (authors, formats, id,
 * languages, series, subjects, title, urls) — sem resumo nem data (linha 11, item 6).
 */
const BDTD_CAMPOS = ["id", "title", "authors", "publicationDates", "summary", "urls", "subjects", "languages", "formats", "institutions"];

function listaDeTexto(v: unknown): string[] {
    if (Array.isArray(v)) return v.flat().map((x) => String(x ?? "").trim()).filter(Boolean);
    return typeof v === "string" && v.trim() ? [v.trim()] : [];
}

/**
 * Palavras-chave de um registro do VuFind. A BDTD as dá em `subjects`; a Oasisbr devolve `subjects`
 * vazio e as guarda em `topic`, cuja lista inteira só vem no `rawData` (lido em 23/11/2026, registro
 * SBQ-3_c22ff270ac33e616a82b767965c1cd0c: `topic` da API = só o primeiro termo; `rawData.topic` = os três).
 */
export function palavrasChaveDoVufind(r: BdtdRecord): string[] {
    const subjects = listaDeTexto(r.subjects);
    if (subjects.length) return subjects;
    const doRaw = listaDeTexto(r.rawData?.topic);
    if (doRaw.length) return [...new Set(doRaw)];
    return listaDeTexto(r.topic);
}

/** Quantos ids o VuFind recebe por pedido em /api/v1/record (id[]). */
const VUFIND_IDS_POR_PEDIDO = 50;

/** A API do VuFind não pagina além da página 10 (lido na Oasisbr em 23/11/2026: a 11 repete a 10). */
const VUFIND_PAGINAS = 10;

/** Total que a BDTD declarou na última busca deste adaptador (resultCount). */
export interface BdtdBusca { results: SearchResult[]; total: number }

interface BdtdSearchResponse {
    resultCount: number;
    records: BdtdRecord[];
    status: string;
    facets?: Record<string, Array<{ value: string; count: number }>>;
}

// Map degree type filter values
const DEGREE_TYPE_MAP: Record<string, string> = {
    graduacao: "Graduação",
    mestrado: "Mestrado",
    doutorado: "Doutorado",
    "pos-doutorado": "Pós-Doutorado",
    "livre-docencia": "Livre-Docência",
};

/** A BDTD devolve `secondary` como objeto { nome: papéis } ou como lista vazia. */
function nomesSecundarios(r: BdtdRecord): string[] {
    const s = r.authors?.secondary;
    return s && !Array.isArray(s) ? Object.keys(s) : [];
}

export class BdtdAdapter {
    /** A mesma API do VuFind serve a BDTD e a Oasisbr (IBICT), que agrega repositórios brasileiros. */
    constructor(
        private baseUrl = "https://bdtd.ibict.br/vufind",
        private nome = { id: "BR-AGG-0001", rotulo: "BDTD (IBICT)" },
        /** `rawData`: pedir o registro bruto, onde a Oasisbr guarda a lista inteira de palavras-chave. */
        private opcoes: { rawData?: boolean } = {},
    ) {}

    private get campos(): string[] {
        return this.opcoes.rawData ? [...BDTD_CAMPOS, "rawData"] : BDTD_CAMPOS;
    }

    /**
     * Palavras-chave de registros já gravados, pelo id na fonte, em lotes de 50 ids por pedido
     * (complete_record_keywords, 23/11/2026). Respeita o robots.txt. Id que a fonte não devolve fica em
     * `naoEncontrados`; pedido que falha fica em `falhas`, com os ids dele.
     */
    async palavrasChavePorId(ids: string[]): Promise<{ palavras: Map<string, string[]>; naoEncontrados: string[]; falhas: string[]; endereco: string }> {
        const endereco = `${this.baseUrl}/api/v1/record`;
        const palavras = new Map<string, string[]>();
        const falhas: string[] = [];
        const vistos = new Set<string>();
        const unicos = [...new Set(ids.filter(Boolean))];
        if (unicos.length) {
            const robots = await robotsPermite(`${endereco}?id=${encodeURIComponent(unicos[0])}`);
            if (!robots.permitido) throw new Error(robots.motivo);
        }
        for (let i = 0; i < unicos.length; i += VUFIND_IDS_POR_PEDIDO) {
            const lote = unicos.slice(i, i + VUFIND_IDS_POR_PEDIDO);
            const p = new URLSearchParams();
            for (const id of lote) p.append("id[]", id);
            for (const c of ["id", "subjects", "topic", ...(this.opcoes.rawData ? ["rawData"] : [])]) p.append("field[]", c);
            const url = `${endereco}?${p}`;
            try {
                await rateLimiter.acquire(url);
                const data = JSON.parse(await fetchText(url, { timeout: 60_000, headers: { Accept: "application/json" } })) as { records?: BdtdRecord[] };
                for (const r of data.records ?? []) {
                    vistos.add(r.id);
                    palavras.set(r.id, palavrasChaveDoVufind(r));
                }
            } catch (e) {
                falhas.push(`ids ${i + 1} a ${i + lote.length}: ${(e as Error).message}`);
                for (const id of lote) vistos.add(id);
            }
        }
        const naoEncontrados = unicos.filter((id) => !vistos.has(id));
        return { palavras, naoEncontrados, falhas, endereco };
    }

    /**
     * Search BDTD via VuFind REST API with rich filters.
     */
    async search(query: string, opts?: SearchOptions): Promise<SearchResult[]> {
        return (await this.searchDetailed(query, opts)).results;
    }

    /** Busca com o total que a BDTD declara (resultCount), página a página até maxResults. */
    async searchDetailed(query: string, opts?: SearchOptions, filtrosExtras: string[] = []): Promise<BdtdBusca> {
        const limit = opts?.maxResults ?? 20;
        const type = opts?.title ? "Title" : opts?.author ? "Author" : "AllFields";
        const lookfor = opts?.title ?? opts?.author ?? query;

        const params = new URLSearchParams();
        params.set("lookfor", lookfor);
        params.set("type", type);
        params.set("limit", String(Math.min(limit, 100)));
        for (const campo of this.campos) params.append("field[]", campo);

        // VuFind facet filters
        if (opts?.degreeType) {
            const mapped = DEGREE_TYPE_MAP[opts.degreeType] ?? opts.degreeType;
            params.append("filter[]", `degree_name_str:"${mapped}"`);
        }

        if (opts?.institution) {
            params.append("filter[]", `institution_str:"${opts.institution}"`);
        }

        if (opts?.state) {
            params.append("filter[]", `region_str:"${opts.state}"`);
        }

        if (opts?.dateFrom || opts?.dateUntil) {
            const from = opts?.dateFrom?.substring(0, 4) ?? "*";
            const until = opts?.dateUntil?.substring(0, 4) ?? "*";
            params.append("filter[]", `publishDate:[${from} TO ${until}]`);
        }

        if (opts?.subjectArea) {
            params.append("filter[]", `subject_str:"${opts.subjectArea}"`);
        }
        for (const f of filtrosExtras) params.append("filter[]", f);

        const vistos = new Map<string, SearchResult>();
        const pedir = async (p: URLSearchParams): Promise<BdtdSearchResponse> => {
            const url = `${this.baseUrl}/api/v1/search?${p}`;
            await rateLimiter.acquire(url);
            const text = await fetchText(url, { timeout: 60_000, headers: { Accept: "application/json" } });
            const data = JSON.parse(text) as BdtdSearchResponse;
            if (typeof data.resultCount !== "number") throw new Error(`BDTD sem resultCount na resposta (${url})`);
            return data;
        };
        const comFiltros = (filtros: string[]): URLSearchParams => {
            const p = new URLSearchParams(params);
            for (const f of filtros) p.append("filter[]", f);
            return p;
        };
        /** Páginas de uma fatia; o VuFind não passa da página 10 (100 × 10 = 1000 registros). */
        const paginar = async (filtros: string[]): Promise<number> => {
            const p = comFiltros(filtros);
            let total = 0;
            for (let page = 1; page <= VUFIND_PAGINAS && vistos.size < limit; page++) {
                p.set("page", String(page));
                const data = await pedir(p);
                total = data.resultCount;
                const recs = data.records ?? [];
                for (const r of recs) if (!vistos.has(r.id)) vistos.set(r.id, this.recordToSearchResult(r));
                if (recs.length < 100 || page * 100 >= total) break;
            }
            return total;
        };
        const contar = async (filtros: string[]): Promise<number> => {
            const p = comFiltros(filtros);
            p.set("limit", "0");
            return (await pedir(p)).resultCount;
        };
        const facetas = async (filtros: string[], campo: string): Promise<string[]> => {
            const p = comFiltros(filtros);
            p.set("limit", "0");
            p.append("facet[]", campo);
            p.set("facetLimit", "1000");
            return ((await pedir(p)).facets?.[campo] ?? []).map((x) => String(x.value));
        };
        const CABE = VUFIND_PAGINAS * 100;
        const aspas = (v: string) => `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
        /**
         * Busca de mais de 1000 registros, coberta em fatias que caibam em 1000 (linha do "Visto de passagem"
         * de 23/11/2026: busca de escopo não tem teto). Ordem: ano (faixas, bisseção), registros sem ano,
         * rede do repositório (faceta), e dentro de uma rede o prefixo do id (`REDE_<hash>`, 16 fatias por
         * nível). O resto de cada divisão entra numa fatia que exclui as partes, para nada ficar de fora.
         * Fatia que nada disso divide é paginada até 1000, e o total declarado mostra a diferença.
         */
        const porId = async (filtros: string[], prefixo: string, qtd: number): Promise<void> => {
            if (vistos.size >= limit) return;
            if (qtd <= CABE || prefixo.length > 80) { await paginar(filtros); return; }
            const partes = "0123456789abcdef".split("").map((c) => `${prefixo}${c}`);
            for (const p of partes) {
                const f = [...filtros, `id:${p}*`];
                const n = await contar(f);
                if (n > 0) await porId(f, p, n);
            }
            const fora = [...filtros, ...partes.map((p) => `-id:${p}*`)];
            const sobra = await contar(fora);
            if (sobra > 0 && sobra < qtd) await paginar(fora);
        };
        const porRede = async (filtros: string[], qtd: number): Promise<void> => {
            const redes = (await facetas(filtros, "network_acronym_str")).slice(0, 60);
            if (redes.length === 0) { await paginar(filtros); return; }
            for (const r of redes) {
                const f = [...filtros, `network_acronym_str:${aspas(r)}`];
                const n = await contar(f);
                if (n > 0) await porId(f, `${r}_`, n);
            }
            const fora = [...filtros, ...redes.map((r) => `-network_acronym_str:${aspas(r)}`)];
            const sobra = await contar(fora);
            if (sobra > 0 && sobra < qtd) await porRede(fora, sobra);
        };
        const porAno = async (filtros: string[], de: number, ate: number, qtd: number): Promise<void> => {
            if (vistos.size >= limit || qtd === 0) return;
            if (qtd <= CABE) { await paginar([...filtros, `publishDate:[${de} TO ${ate}]`]); return; }
            if (de === ate) { await porRede([...filtros, `publishDate:[${de} TO ${ate}]`], qtd); return; }
            const meio = Math.floor((de + ate) / 2);
            for (const [a, b] of [[de, meio], [meio + 1, ate]]) {
                await porAno(filtros, a, b, await contar([...filtros, `publishDate:[${a} TO ${b}]`]));
            }
        };
        const cobrir = async (): Promise<void> => {
            await porAno([], 0, 9999, await contar(["publishDate:[0 TO 9999]"]));
            const semAno = ["-publishDate:[* TO *]"];
            const n = await contar(semAno);
            if (n > 0) await (n <= CABE ? paginar(semAno) : porRede(semAno, n));
        };

        const primeira = new URLSearchParams(params);
        primeira.set("page", "1");
        const robots = await robotsPermite(`${this.baseUrl}/api/v1/search?${primeira}`);
        if (!robots.permitido) throw new Error(robots.motivo);
        const total = await paginar([]);
        if (total > vistos.size && vistos.size < limit) await cobrir();

        return { results: [...vistos.values()].slice(0, limit), total };
    }

    /**
     * Get record detail from BDTD.
     */
    async getRecord(id: string): Promise<Partial<DublinCoreMetadata>> {
        const campos = this.campos.map((c) => `&field[]=${c}`).join("");
        const url = `${this.baseUrl}/api/v1/record?id=${encodeURIComponent(id)}${campos}`;
        await rateLimiter.acquire(url);
        const text = await fetchText(url, {
            timeout: 15_000,
            headers: { Accept: "application/json" },
        });

        const data = JSON.parse(text) as { records?: BdtdRecord[] };
        const r = data.records?.[0];
        if (!r) throw new Error(`BDTD record not found: ${id} `);

        return {
            title: [r.title],
            creator: r.authors?.primary ? Object.keys(r.authors.primary) : [],
            date: r.publicationDates ?? [],
            description: r.summary ?? [],
            subject: palavrasChaveDoVufind(r),
            language: r.languages ?? [],
            type: r.formats ?? ["thesis/dissertation"],
            contributor: nomesSecundarios(r),
        };
    }

    /**
     * Convert BDTD record to SearchResult — guaranteed to have URL.
     */
    private recordToSearchResult(r: BdtdRecord): SearchResult {
        const authors = r.authors?.primary ? Object.keys(r.authors.primary) : [];
        const advisors = nomesSecundarios(r);

        // URL: first URL in record, or BDTD record page (sem espaço: linha 11, item 7)
        const itemUrl = r.urls?.[0]?.url ?? `${this.baseUrl}/Record/${encodeURIComponent(r.id)}`;

        // Determine degree type
        const degreeName = r.formats?.[0] ?? "";

        return {
            repositoryId: this.nome.id,
            repositoryName: this.nome.rotulo,
            identifier: r.id,
            title: r.title ?? "",
            creators: [...authors, ...advisors.map((a) => `${a} (orientador)`)],
            description: r.summary?.[0] ?? "",
            date: r.publicationDates?.[0] ?? "",
            type: "thesis/dissertation",
            url: itemUrl,
            degreeType: degreeName,
            institution: r.institutions?.[0],
            subjectAreas: palavrasChaveDoVufind(r),
            language: r.languages?.[0],
            accessMethod: "bdtd-vufind",
            audit: {
                methodology: "CUSTOM" as any,
                searchQueryUsed: "BDTD_VUFIND_API_QUERY",
                extractionDate: new Date().toISOString(),
                provenanceSource: this.baseUrl
            }
        };
    }
}

// ─── USP Custom Scraper ──────────────────────────────────────

export class UspAdapter {
    private baseUrl = "https://repositorio.usp.br";

    /**
     * Search USP repository via custom result.php endpoint.
     */
    async search(query: string, opts?: SearchOptions): Promise<SearchResult[]> {
        const searchTerm = opts?.title ?? query;
        const url = `${this.baseUrl}/result.php?q=${encodeURIComponent(searchTerm)}`;

        await rateLimiter.acquire(url);
        const html = await fetchText(url, { timeout: 30_000 });
        const maxResults = opts?.maxResults ?? 50;
        return this.parseResults(html, maxResults);
    }

    private parseResults(html: string, maxResults: number): SearchResult[] {
        const $ = cheerio.load(html);
        const results: SearchResult[] = [];
        const seen = new Set<string>();

        $("a").each((_, el) => {
            if (results.length >= maxResults) return;
            const href = $(el).attr("href");
            if (!href) return;

            if (!href.includes("result.php?id=") && !href.includes("/result.php?")) return;
            // Strict exclusion of filter/order links which are navigational
            if (href.includes("filter[]=") || href.includes("order=") || href.includes("pag=") || href.includes("q=")) return;

            const title = $(el).text().trim();
            if (!title || title.length < 5) return;

            const finalUrl = href.startsWith("http") ? href : `${this.baseUrl}/${href.replace(/^\//, "")}`;
            if (seen.has(finalUrl)) return;
            seen.add(finalUrl);

            // Attempt DOI extraction from text context (heuristic)
            const doiMatch = $(el).parent().text().match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
            const doi = doiMatch ? doiMatch[0] : undefined;

            results.push({
                repositoryId: "USP-001",
                repositoryName: "Repositório USP",
                identifier: href,
                title,
                creators: [], // USP result.php listing doesn't easily show authors without details fetch
                description: "",
                date: "",
                type: "thesis/dissertation",
                url: finalUrl,
                doi,
                institution: "Universidade de São Paulo",
                state: "SP",
                accessMethod: "usp-custom",
                audit: {
                    methodology: "CUSTOM" as any,
                    searchQueryUsed: "USP_CUSTOM_HTML_QUERY",
                    extractionDate: new Date().toISOString(),
                    provenanceSource: this.baseUrl
                }
            });
        });

        return results;
    }

    async getItemMetadata(itemUrl: string): Promise<Partial<DublinCoreMetadata>> {
        await rateLimiter.acquire(itemUrl);
        const html = await fetchText(itemUrl, { timeout: 30_000 });
        const $ = cheerio.load(html);
        const meta: Partial<DublinCoreMetadata> = {};

        const tagMap: Record<string, keyof DublinCoreMetadata> = {
            "DC.title": "title",
            "DC.creator": "creator",
            "DC.date": "date",
            "DC.description": "description",
            "DC.subject": "subject",
            "DC.language": "language",
            "DC.type": "type",
            "DC.publisher": "publisher",
            citation_title: "title",
            citation_author: "creator",
            citation_date: "date",
        };

        for (const [tagName, field] of Object.entries(tagMap)) {
            const values: string[] = [];
            $(`meta[name='${tagName}']`).each((_, el) => {
                const content = $(el).attr("content")?.trim();
                if (content) values.push(content);
            });
            if (values.length > 0) {
                meta[field] = [...(meta[field] ?? []), ...values];
            }
        }

        return meta;
    }
}

// ─── DSpace 7 OAI-PMH Path Fix ──────────────────────────────

/**
 * DSpace 7 serves OAI-PMH at /server/oai/request, not /oai/request.
 * Returns multiple candidates in priority order.
 */
export function resolveOaiEndpoint(baseUrl: string, platform?: string): string[] {
    const clean = baseUrl.replace(/\/+$/, "");
    return [
        `${clean}/server/oai/request`,   // DSpace 7
        `${clean}/oai/request`,           // DSpace 5/6
        `${clean}/jspui/oai/request`,     // JSPUI variant
        `${clean}/xmlui/oai/request`,     // XMLUI variant
    ];
}
