
import { SearchResult } from "../types.js";

export class CrossrefService {
    private mailto: string = "vicente@prismaid.com";

    async search(query: string, options: { maxResults?: number } = {}): Promise<{ results: SearchResult[]; totalFound: number }> {
        const mailto = this.mailto;
        const maxResults = options.maxResults || 200;
        // Crossref API works works?query=...
        const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=${Math.min(maxResults, 1000)}&mailto=${mailto}`;

        try {
            const res = await fetch(url);
            if (!res.ok) return { results: [], totalFound: 0 };
            const data = await res.json();

            if (!data.message || !data.message.items) return { results: [], totalFound: 0 };

            const results = data.message.items.map((r: any) => ({
                repositoryId: "crossref",
                repositoryName: "Crossref",
                identifier: r.DOI || r.URL,
                title: (r.title && r.title[0]) || "",
                creators: r.author?.map((a: any) => `${a.family}, ${a.given}`) || [],
                date: r.issued?.["date-parts"]?.[0]?.[0]?.toString() || "",
                url: r.URL || (r.DOI ? `https://doi.org/${r.DOI}` : ""),
                doi: r.DOI || "",
                type: r.type || "",
                accessMethod: "api"
            }));

            return {
                results,
                totalFound: data.message["total-results"] || results.length
            };
        } catch (error) {
            console.error("Crossref search error:", error);
            return { results: [], totalFound: 0 };
        }
    }
}
