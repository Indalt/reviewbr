/**
 * HTML scraper — fallback access layer.
 * Scrapes DSpace search pages and item metadata from HTML.
 * Equivalent of direct_search.go but in TypeScript.
 */

import * as cheerio from "cheerio";
import { fetchText } from "../utils/http.js";
import { rateLimiter } from "../utils/rate-limiter.js";
import type { SearchResult, DublinCoreMetadata } from "../types.js";

const SEARCH_ENDPOINTS = [
    "/discover",
    "/simple-search",
    "/jspui/simple-search",
    "/xmlui/simple-search",
    "/jspui/discover",
    "/xmlui/discover",
];

/** Resultado de uma busca pela página de busca do repositório (linha 11 da FILA). */
export interface BuscaHtml {
    results: SearchResult[];
    /** Total que a página declarou ("Resultado 1-10 de 11"); 0 quando é a página de busca sem
     *  resultado; null quando a página de busca não declara o total. */
    total: number | null;
    endpoint: string;
}

/** "Resultado 1-10 de 11" (JSPUI), "Now showing items 1-10 of 25" (XMLUI) e variantes. */
const TOTAL_NA_PAGINA = /(?:Resultados?|Results?|Exibindo itens|Mostrando itens|Now showing items)\s+\d+\s*-\s*\d+\s+(?:de|of)\s+([\d.,]+)/i;

/** Marca da página de busca do DSpace: presente também quando a busca não achou nada. */
const PAGINA_DE_BUSCA = /discovery-search-filters|discovery-result-results|ds-search-form|id="aspect_discovery/i;

export class HtmlScraper {

    /**
     * Busca pela página de busca do repositório — a mesma que uma pessoa usa no site, para que o
     * total bata com o que ela vê (linha 11 da FILA). Os endereços vêm do catálogo
     * (`searchEndpoints`, absolutos); sem eles, tenta os caminhos comuns do DSpace.
     *
     * Só devolve quando reconhece a página: com o total declarado, ou como página de busca do
     * DSpace sem resultado (total 0). Página que não reconhece é falha, com o motivo de cada
     * endereço tentado — nunca lista vazia calada.
     */
    async searchDetailed(
        repoUrl: string,
        repoId: string,
        repoName: string,
        query: string,
        maxResults: number = 50,
        endpoints?: string[],
    ): Promise<BuscaHtml> {
        const baseUrl = repoUrl.replace(/\/+$/, "");
        const candidatos = endpoints && endpoints.length > 0
            ? endpoints
            : SEARCH_ENDPOINTS.map((e) => `${baseUrl}${e}`);
        const falhas: string[] = [];
        const rpp = Math.max(1, Math.min(maxResults, 100));

        for (const endpoint of candidatos) {
            try {
                const results: SearchResult[] = [];
                const seen = new Set<string>();
                let total: number | null = null;
                for (let start = 0; results.length < maxResults; start += rpp) {
                    const searchUrl = new URL(endpoint);
                    searchUrl.searchParams.set("query", query);
                    searchUrl.searchParams.set("rpp", String(rpp));
                    if (start > 0) searchUrl.searchParams.set("start", String(start));

                    await rateLimiter.acquire(searchUrl.toString());
                    const html = await fetchText(searchUrl.toString(), { timeout: 30_000, maxRetries: 2 });

                    const hits = this.parseSearchResults(html, baseUrl, repoId, repoName, query)
                        .filter((h) => !seen.has(h.url));
                    if (start === 0) {
                        const m = html.match(TOTAL_NA_PAGINA);
                        if (m) total = Number(m[1]!.replace(/[.,]/g, ""));
                        else if (!PAGINA_DE_BUSCA.test(html)) {
                            throw new Error("a página respondeu, mas não é uma página de busca reconhecida (sem total nem formulário de busca do DSpace)");
                        } else if (hits.length === 0) total = 0;
                    }
                    for (const h of hits) { seen.add(h.url); results.push(h); }
                    if (hits.length === 0 || total === null || results.length >= total) break;
                }

                const lista = results.slice(0, maxResults);
                await this.completarPeloRegistro(lista);
                return { results: lista, total, endpoint };
            } catch (e) {
                falhas.push(`${endpoint}: ${(e as Error).message}`);
            }
        }

        throw new Error(`busca pela página do site falhou — ${falhas.join(" | ")}`);
    }

    /** Compatibilidade: só a lista. */
    async search(
        repoUrl: string,
        repoId: string,
        repoName: string,
        query: string,
        maxResults: number = 50
    ): Promise<SearchResult[]> {
        return (await this.searchDetailed(repoUrl, repoId, repoName, query, maxResults)).results;
    }

    /**
     * A lista de resultados do DSpace não traz resumo: ele vem da página do registro (linha 11,
     * item 6). Registro cuja página não abre fica como veio da lista.
     */
    private async completarPeloRegistro(results: SearchResult[]): Promise<void> {
        for (const r of results) {
            try {
                const meta = await this.getItemMetadata(r.url);
                if (!r.description) r.description = meta.description?.[0] ?? "";
                if (!r.date) r.date = meta.date?.[0] ?? "";
                if (r.creators.length === 0 && meta.creator?.length) r.creators = meta.creator;
                if (!r.type) r.type = meta.type?.[0] ?? "";
            } catch { /* fica como veio da lista */ }
        }
    }

    /**
     * Extract metadata from an item page (handle page).
     */
    async getItemMetadata(itemUrl: string): Promise<Partial<DublinCoreMetadata>> {
        await rateLimiter.acquire(itemUrl);
        const html = await fetchText(itemUrl, { timeout: 30_000 });
        return this.parseItemPage(html);
    }

    /**
     * Find PDF download URL from an item page.
     */
    async findPdfUrl(itemUrl: string): Promise<string | null> {
        await rateLimiter.acquire(itemUrl);
        const html = await fetchText(itemUrl, { timeout: 30_000 });
        const $ = cheerio.load(html);
        const baseUrl = new URL(itemUrl);

        // Strategy 1: citation_pdf_url meta tag
        const citationPdf = $("meta[name='citation_pdf_url']").attr("content");
        if (citationPdf) {
            return this.resolveUrl(citationPdf, baseUrl);
        }

        // Strategy 2: Link containing /bitstream/ and .pdf
        let pdfUrl: string | null = null;
        $("a").each((_, el) => {
            const href = $(el).attr("href");
            if (!href) return;
            const lower = href.toLowerCase();
            if (lower.includes("bitstream") && lower.endsWith(".pdf")) {
                pdfUrl = href;
                return false; // break
            }
        });

        if (pdfUrl) {
            return this.resolveUrl(pdfUrl, baseUrl);
        }

        // Strategy 3: Any link ending in .pdf
        $("a").each((_, el) => {
            const href = $(el).attr("href");
            if (!href) return;
            if (href.toLowerCase().endsWith(".pdf")) {
                pdfUrl = href;
                return false;
            }
        });

        return pdfUrl ? this.resolveUrl(pdfUrl, baseUrl) : null;
    }

    /**
     * Parse search result page HTML.
     */
    private parseSearchResults(
        html: string,
        baseUrl: string,
        repoId: string,
        repoName: string,
        query: string
    ): SearchResult[] {
        const $ = cheerio.load(html);
        const results: SearchResult[] = [];
        const seen = new Set<string>();

        // DSpace JSPUI: tabela de resultados com colunas t1 (data), t2 (título), t3 (autores), t4 (tipo).
        // Lida pela tabela, o resultado não pega link de comunidade ou de navegação.
        const linhasJspui = $("td[headers='t2'] a[href*='/handle/']");
        if (linhasJspui.length > 0) {
            linhasJspui.each((_, el) => {
                const href = $(el).attr("href")!;
                const title = $(el).text().trim();
                const tr = $(el).closest("tr");
                let finalUrl: string;
                try { finalUrl = new URL(href, `${baseUrl}/`).toString(); } catch { return; }
                if (!title || seen.has(finalUrl)) return;
                seen.add(finalUrl);
                results.push({
                    repositoryId: repoId,
                    repositoryName: repoName,
                    identifier: href,
                    title,
                    creators: tr.find("td[headers='t3'] a").map((_, a) => $(a).text().trim()).get().filter(Boolean),
                    description: "",
                    date: tr.find("td[headers='t1']").text().trim(),
                    type: tr.find("td[headers='t4']").text().trim(),
                    url: finalUrl,
                    accessMethod: "html-scraper",
                    audit: {
                        methodology: "CUSTOM" as any,
                        searchQueryUsed: query,
                        extractionDate: new Date().toISOString(),
                        provenanceSource: baseUrl
                    }
                });
            });
            return results;
        }

        $("a").each((_, el) => {
            const href = $(el).attr("href");
            if (!href) return;

            // Must contain /handle/ (DSpace item links)
            if (!href.includes("/handle/")) return;

            // Filter out functional links
            if (href.includes("?") || href.includes("sort_by") || href.includes("filtername")) return;

            const title = $(el).text().trim();
            if (!title || title.length < 3) return;

            // Resolve URL
            let finalUrl: string;
            try {
                if (href.startsWith("http")) {
                    finalUrl = href;
                } else {
                    const base = new URL(baseUrl);
                    finalUrl = `${base.protocol}//${base.host}${href.startsWith("/") ? "" : "/"}${href}`;
                }
            } catch {
                return;
            }

            if (seen.has(finalUrl)) return;
            seen.add(finalUrl);

            results.push({
                repositoryId: repoId,
                repositoryName: repoName,
                identifier: href,
                title,
                creators: [],
                description: "",
                date: "",
                type: "",
                url: finalUrl,
                accessMethod: "html-scraper",
                audit: {
                    methodology: "CUSTOM" as any,
                    searchQueryUsed: query,
                    extractionDate: new Date().toISOString(),
                    provenanceSource: baseUrl
                }
            });
        });

        return results;
    }

    /**
     * Parse item page HTML for metadata (using meta tags and DSpace tables).
     */
    private parseItemPage(html: string): Partial<DublinCoreMetadata> {
        const $ = cheerio.load(html);
        const meta: Partial<DublinCoreMetadata> = {};

        // Citation meta tags (Google Scholar / DSpace standard)
        // A ordem conta: o primeiro valor de cada campo é o que vai para o resultado. O resumo
        // (DCTERMS.abstract) vem antes de DC.description, que em muitos DSpace é nota.
        const tagMap: Record<string, keyof DublinCoreMetadata> = {
            citation_title: "title",
            citation_author: "creator",
            citation_date: "date",
            "DCTERMS.abstract": "description",
            citation_abstract: "description",
            "DC.title": "title",
            "DC.creator": "creator",
            "DCTERMS.issued": "date",
            "DC.date": "date",
            "DC.description": "description",
            "DC.subject": "subject",
            "DC.language": "language",
            "DC.type": "type",
            "DC.publisher": "publisher",
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

    /**
     * Resolve a potentially relative URL against a base.
     */
    private resolveUrl(href: string, base: URL): string {
        try {
            return new URL(href, base).toString();
        } catch {
            return href;
        }
    }
}
