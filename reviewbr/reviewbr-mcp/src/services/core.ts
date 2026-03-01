import { SearchResult } from "../types.js";

export class CoreService {
    // CORE API v3 allows open access to their massive aggregation of repositories.
    // They request a user-agent and suggest a polite crawl rate.

    async search(query: string, options: { maxResults?: number } = {}): Promise<{ results: SearchResult[]; totalFound: number }> {
        const maxResults = options.maxResults || 200;
        // Limit per request in CORE API v3 is typical 10-100. We will use 100 per page to be safe.
        const pageSize = 100;

        const headers: any = {
            "User-Agent": "ReviewBR-MCP/1.0 (https://github.com/Indalt/reviewbr)",
            "Accept": "application/json",
            "Content-Type": "application/json"
        };

        let allResults: any[] = [];
        let totalFound = 0;
        let offset = 0;

        try {
            while (allResults.length < maxResults) {
                const limit = Math.min(pageSize, maxResults - allResults.length);
                const body = JSON.stringify({
                    q: query,
                    limit: limit,
                    offset: offset
                });

                const res = await fetch("https://api.core.ac.uk/v3/search/works", {
                    method: "POST",
                    headers,
                    body
                });

                if (res.status === 429) {
                    console.warn(`[ReviewBR] CORE API 429 Rate Limit hit. Fetched ${allResults.length} so far. Stopping pagination.`);
                    break;
                }

                if (!res.ok) {
                    const errorBody = await res.text();
                    console.error("CORE API Error:", res.status, res.statusText, errorBody);
                    break;
                }

                const data: any = await res.json();

                if (offset === 0 && data.totalHits !== undefined) {
                    totalFound = data.totalHits;
                }

                const resultsArray = data.results || [];
                if (resultsArray.length === 0) break;

                allResults = allResults.concat(resultsArray);
                offset += resultsArray.length;

                // Stop if we've reached the total hits
                if (offset >= totalFound) break;

                // Be kind to the public API: 2-second delay between pages
                if (allResults.length < maxResults) {
                    await new Promise(r => setTimeout(r, 2000));
                }
            }

            const finalized = allResults.slice(0, maxResults);

            const results: SearchResult[] = finalized.map((r: any) => {
                const displayUrl = r.downloadUrl || (r.links && r.links.find((l: any) => l.type === "display")?.url) || "";

                return {
                    repositoryId: "core",
                    repositoryName: "CORE (core.ac.uk)",
                    identifier: r.id?.toString() || r.arxivId || "",
                    title: r.title || "",
                    creators: r.authors?.map((a: any) => a.name) || [],
                    description: r.abstract || "",
                    date: r.publishedDate ? r.publishedDate.substring(0, 4) : (r.yearPublished ? r.yearPublished.toString() : ""),
                    type: r.documentType || "research",
                    url: displayUrl,
                    doi: r.doi || "",
                    pdfUrl: r.downloadUrl || "",
                    accessMethod: "api"
                };
            });

            return {
                results,
                totalFound: totalFound > 0 ? totalFound : results.length
            };
        } catch (error) {
            console.error("CORE API search error:", error);
            return { results: [], totalFound: 0 };
        }
    }
}
