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
    authors: { primary?: Record<string, string[]>; secondary?: Record<string, string[]> };
    publicationDates?: string[];
    urls?: Array<{ url: string; desc?: string }>;
    subjects?: string[][];
    abstract?: string[];
    languages?: string[];
    formats?: string[];
    institutions?: string[];
    degreePrograms?: string[];
    degreeNames?: string[];
}

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

export class BdtdAdapter {
    private baseUrl = "https://bdtd.ibict.br/vufind";

    /**
     * Search BDTD via VuFind REST API with rich filters.
     */
    async search(query: string, opts?: SearchOptions): Promise<SearchResult[]> {
        const limit = opts?.maxResults ?? 20;
        const type = opts?.title ? "Title" : opts?.author ? "Author" : "AllFields";
        const lookfor = opts?.title ?? opts?.author ?? query;

        const params = new URLSearchParams();
        params.set("lookfor", lookfor);
        params.set("type", type);
        params.set("limit", String(limit));

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

        const url = `${this.baseUrl}/api/v1/search?${params}`;


        await rateLimiter.acquire(url);
        const text = await fetchText(url, {
            timeout: 30_000,
            headers: { Accept: "application/json" },
        });

        const data = JSON.parse(text) as BdtdSearchResponse;

        return data.records.map((r) => this.recordToSearchResult(r));
    }

    /**
     * Get record detail from BDTD.
     */
    async getRecord(id: string): Promise<Partial<DublinCoreMetadata>> {
        const url = `${this.baseUrl} /api/v1 / record ? id = ${encodeURIComponent(id)} `;
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
            description: r.abstract ?? [],
            subject: r.subjects?.flat() ?? [],
            language: r.languages ?? [],
            type: r.degreeNames ?? ["thesis/dissertation"],
            contributor: r.authors?.secondary ? Object.keys(r.authors.secondary) : [],
        };
    }

    /**
     * Convert BDTD record to SearchResult — guaranteed to have URL.
     */
    private recordToSearchResult(r: BdtdRecord): SearchResult {
        const authors = r.authors?.primary ? Object.keys(r.authors.primary) : [];
        const advisors = r.authors?.secondary ? Object.keys(r.authors.secondary) : [];

        // URL: first URL in record, or BDTD record page
        const itemUrl = r.urls?.[0]?.url ?? `${this.baseUrl} /Record/${r.id} `;

        // Determine degree type
        const degreeName = r.degreeNames?.[0] ?? r.formats?.[0] ?? "";

        return {
            repositoryId: "BR-AGG-0001",
            repositoryName: "BDTD (IBICT)",
            identifier: r.id,
            title: r.title ?? "",
            creators: [...authors, ...advisors.map((a) => `${a} (orientador)`)],
            description: r.abstract?.[0] ?? "",
            date: r.publicationDates?.[0] ?? "",
            type: "thesis/dissertation",
            url: itemUrl,
            degreeType: degreeName,
            institution: r.institutions?.[0],
            subjectAreas: r.subjects?.flat(),
            language: r.languages?.[0],
            accessMethod: "bdtd-vufind",
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
