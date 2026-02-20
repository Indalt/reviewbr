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

export class HtmlScraper {

    /**
     * Search a repository by trying multiple search endpoints.
     */
    async search(
        repoUrl: string,
        repoId: string,
        repoName: string,
        query: string,
        maxResults: number = 50
    ): Promise<SearchResult[]> {
        const baseUrl = repoUrl.replace(/\/+$/, "");
        const results: SearchResult[] = [];

        for (const endpoint of SEARCH_ENDPOINTS) {
            if (results.length >= maxResults) break;

            try {
                const searchUrl = new URL(`${baseUrl}${endpoint}`);
                searchUrl.searchParams.set("query", query);
                searchUrl.searchParams.set("rpp", String(Math.min(maxResults, 20)));

                await rateLimiter.acquire(searchUrl.toString());
                const html = await fetchText(searchUrl.toString(), {
                    timeout: 30_000,
                    maxRetries: 2,
                });

                const hits = this.parseSearchResults(html, baseUrl, repoId, repoName, query);
                if (hits.length > 0) {
                    results.push(...hits);
                    break; // Found a working endpoint
                }
            } catch {
                continue; // Try next endpoint
            }
        }

        // Deduplicate by URL
        const seen = new Set<string>();
        return results.filter((r) => {
            if (seen.has(r.url)) return false;
            seen.add(r.url);
            return true;
        }).slice(0, maxResults);
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
        const tagMap: Record<string, keyof DublinCoreMetadata> = {
            citation_title: "title",
            citation_author: "creator",
            citation_date: "date",
            "DC.title": "title",
            "DC.creator": "creator",
            "DC.date": "date",
            "DC.description": "description",
            "DC.subject": "subject",
            "DC.language": "language",
            "DC.type": "type",
            "DC.publisher": "publisher",
            "DCTERMS.abstract": "description",
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
