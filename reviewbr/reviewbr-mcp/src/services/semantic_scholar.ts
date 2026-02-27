import { SearchResult } from "../types.js";

export class SemanticScholarService {
    // S2 allows 100 requests per 5 minutes without an API key. 
    // Field 'openAccessPdf' ensures compliance with Open Science Directive.

    async search(query: string, options: { maxResults?: number } = {}): Promise<{ results: SearchResult[]; totalFound: number }> {
        const maxResults = options.maxResults || 200;
        const limit = Math.min(maxResults, 100); // S2 max limit per page is 100

        // Requesting openAccessPdf, title, authors, year, externalIds (for DOI), abstract
        const fields = "title,authors,year,externalIds,openAccessPdf,abstract,url";
        const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=${fields}&openAccessPdf=true`;

        const headers: any = {
            "User-Agent": "ReviewBR-MCP/1.0 (https://github.com/Indalt/reviewbr)",
            "Accept": "application/json"
        };
        if (process.env.SEMANTIC_SCHOLAR_API_KEY) {
            headers["x-api-key"] = process.env.SEMANTIC_SCHOLAR_API_KEY;
        }

        try {
            const res = await fetch(url, { headers });
            if (!res.ok) {
                console.error("Semantic Scholar API Error:", res.status, res.statusText);
                return { results: [], totalFound: 0 };
            }
            const data = await res.json();

            if (!data.data || data.data.length === 0) return { results: [], totalFound: 0 };

            const results = data.data.map((r: any) => ({
                repositoryId: "semanticscholar",
                repositoryName: "Semantic Scholar",
                identifier: r.paperId,
                title: r.title || "",
                creators: r.authors?.map((a: any) => a.name) || [],
                date: r.year?.toString() || "",
                url: r.openAccessPdf?.url || r.url || (r.externalIds?.DOI ? `https://doi.org/${r.externalIds.DOI}` : ""),
                doi: r.externalIds?.DOI || "",
                type: "journal-article",
                accessMethod: "api"
            }));

            return {
                results,
                totalFound: data.total || results.length
            };
        } catch (error) {
            console.error("Semantic Scholar search error:", error);
            return { results: [], totalFound: 0 };
        }
    }
}
