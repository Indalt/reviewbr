import { SearchResult } from "../types.js";

export class EuropePmcService {
    async search(query: string, options: { maxResults?: number } = {}): Promise<{ results: SearchResult[]; totalFound: number }> {
        const maxResults = options.maxResults || 200;
        const pageSize = Math.min(maxResults, 100);

        const headers: any = {
            "User-Agent": "ReviewBR-MCP/1.0 (https://github.com/Indalt/reviewbr)",
            "Accept": "application/json"
        };

        let allResults: any[] = [];
        let totalFound = 0;
        let nextCursorMark = "*";

        try {
            while (allResults.length < maxResults) {
                const url = new URL("https://www.ebi.ac.uk/europepmc/webservices/rest/search");
                url.searchParams.append("query", query);
                url.searchParams.append("format", "json");
                url.searchParams.append("resultType", "core");
                url.searchParams.append("cursorMark", nextCursorMark);
                url.searchParams.append("pageSize", pageSize.toString());

                const res = await fetch(url.toString(), { headers });

                if (res.status === 429) {
                    console.warn(`[ReviewBR] Europe PMC API 429 Rate Limit hit. Fetched ${allResults.length} so far.`);
                    break;
                }

                if (!res.ok) {
                    const errorBody = await res.text();
                    console.error("Europe PMC API Error:", res.status, res.statusText, errorBody);
                    break;
                }

                const data: any = await res.json();

                if (totalFound === 0 && data.hitCount !== undefined) {
                    totalFound = data.hitCount;
                }

                const resultsArray = data.resultList?.result || [];
                if (resultsArray.length === 0) break;

                allResults = allResults.concat(resultsArray);
                nextCursorMark = data.nextCursorMark;

                if (!nextCursorMark || allResults.length >= totalFound) break;

                // Be polite
                if (allResults.length < maxResults) {
                    await new Promise(r => setTimeout(r, 1000));
                }
            }

            const finalized = allResults.slice(0, maxResults);

            const results: SearchResult[] = finalized.map((r: any) => {
                let pdfUrl = "";
                let accessUrl = r.url || "";

                if (r.pmcid) {
                    pdfUrl = `https://europepmc.org/articles/${r.pmcid}?pdf=render`;
                    accessUrl = `https://europepmc.org/article/PMC/${r.pmcid.replace("PMC", "")}`;
                } else if (r.doi) {
                    accessUrl = `https://doi.org/${r.doi}`;
                }

                const authors = r.authorList?.author?.map((a: any) => a.fullName || a.lastName) || [];

                return {
                    repositoryId: "europe_pmc",
                    repositoryName: "Europe PMC",
                    identifier: r.pmcid || r.pmid || r.id || "",
                    title: r.title || "",
                    creators: authors,
                    description: r.abstractText || "",
                    date: r.firstPublicationDate ? r.firstPublicationDate.substring(0, 4) : r.pubYear?.toString() || "",
                    type: r.pubType || "research",
                    url: accessUrl,
                    doi: r.doi || "",
                    pdfUrl: pdfUrl,
                    accessMethod: "api"
                };
            });

            return {
                results,
                totalFound: totalFound > 0 ? totalFound : results.length
            };
        } catch (error) {
            console.error("Europe PMC API search error:", error);
            return { results: [], totalFound: 0 };
        }
    }
}
