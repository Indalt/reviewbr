import { SearchResult } from "../types.js";

export class SemanticScholarService {
    // Semantic Scholar Bulk API allows massive extraction without keys.
    // Limit: 100 requests per 5 minutes per IP.
    // We fetch batches of 500 articles and use a 3-second delay between pages to be polite.

    async search(query: string, options: { maxResults?: number } = {}): Promise<{ results: SearchResult[]; totalFound: number }> {
        const maxResults = options.maxResults || 500;

        // Requesting openAccessPdf, title, authors, year, externalIds (for DOI), abstract, url
        const fields = "title,authors,year,externalIds,openAccessPdf,abstract,url";
        const url = `https://api.semanticscholar.org/graph/v1/paper/search/bulk?query=${encodeURIComponent(query)}&fields=${fields}&openAccessPdf=true`;

        const headers: any = {
            "User-Agent": "ReviewBR-MCP/1.0 (https://github.com/Indalt/reviewbr)",
            "Accept": "application/json"
        };

        let allResults: any[] = [];
        let totalFound = 0;
        let token: string | undefined = undefined;

        try {
            while (allResults.length < maxResults) {
                const currentUrl: string = token ? `${url}&token=${token}` : url;

                const res: any = await fetch(currentUrl, { headers });

                if (res.status === 429) {
                    console.warn(`[ReviewBR] Semantic Scholar 429 Rate Limit hit. Fetched ${allResults.length} so far. Stopping pagination.`);
                    break;
                }

                if (!res.ok) {
                    const errorBody = await res.text();
                    console.error("Semantic Scholar API Error:", res.status, res.statusText, errorBody);
                    break;
                }

                const data: any = await res.json();

                if (!token && data.total !== undefined) {
                    totalFound = data.total;
                }

                if (!data.data || data.data.length === 0) break;

                allResults = allResults.concat(data.data);
                token = data.token;

                if (!token) break;

                // Be kind to the API: 3-second delay to stay safely within limits
                if (allResults.length < maxResults) {
                    await new Promise(r => setTimeout(r, 3000));
                }
            }

            const finalized = allResults.slice(0, maxResults);

            const results: SearchResult[] = finalized.map((r: any) => ({
                repositoryId: "semanticscholar",
                repositoryName: "Semantic Scholar",
                identifier: r.paperId,
                title: r.title || "",
                creators: r.authors?.map((a: any) => a.name) || [],
                description: r.abstract || "",
                date: r.year?.toString() || "",
                url: r.openAccessPdf?.url || r.url || (r.externalIds?.DOI ? `https://doi.org/${r.externalIds.DOI}` : ""),
                doi: r.externalIds?.DOI || "",
                type: "journal-article",
                accessMethod: "api"
            }));

            return {
                results,
                totalFound: totalFound > 0 ? totalFound : results.length
            };
        } catch (error) {
            console.error("Semantic Scholar search error:", error);
            return { results: [], totalFound: 0 };
        }
    }
}
