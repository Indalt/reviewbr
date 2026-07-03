
import { SearchResult } from "../types.js";
import { config } from "../config.js";

interface OpenAlexWork {
    id: string;
    doi?: string;
    display_name: string;
    publication_year: number;
    referenced_works: string[];
}

export class SnowballService {
    private mailto: string = "vicente@prismaid.com";

    async expandSearch(seeds: SearchResult[]): Promise<{ newCandidates: SearchResult[]; stats: any }> {
        const newCandidates: SearchResult[] = [];
        const seen = new Set<string>();

        // Mark seeds as seen
        seeds.forEach(s => seen.add(this.normalizeId(s)));

        for (const seed of seeds) {
            try {
                // 1. Resolve OpenAlex Work ID
                const work = await this.resolveWork(seed);
                if (!work) continue;

                // 2. Backward Snowballing (References)
                if (work.referenced_works) {
                    // Fetch details for referenced works (batching would be better, doing simple here)
                    // For MVP, we might just get the IDs, but to be useful we need metadata.
                    // Let's implement a limited fetch.
                    console.log(`Processing references for ${work.display_name}`);
                }

                // 3. Forward Snowballing (Citations)
                const citations = await this.fetchCitations(work.id);

                for (const cit of citations) {
                    const id = this.normalizeId(cit);
                    if (!seen.has(id)) {
                        seen.add(id);
                        newCandidates.push(cit);
                    }
                }

            } catch (e) {
                console.error(`Error processing seed ${seed.title}:`, e);
            }
        }

        return {
            newCandidates,
            stats: {
                seeds: seeds.length,
                new_found: newCandidates.length
            }
        };
    }

    private normalizeId(item: SearchResult | string): string {
        if (typeof item === 'string') return item;
        return item.doi || item.url || item.title;
    }

    private async resolveWork(seed: SearchResult): Promise<OpenAlexWork | null> {
        // Try DOI first
        if (seed.doi) {
            const doi = seed.doi.replace("https://doi.org/", "").replace("http://doi.org/", "");
            const url = `https://api.openalex.org/works/https://doi.org/${doi}?mailto=${this.mailto}`;
            return await this.fetchJson(url);
        }

        // Try Title Search
        if (seed.title) {
            const url = `https://api.openalex.org/works?filter=display_name.search:${encodeURIComponent(seed.title)}&mailto=${this.mailto}`;
            const res = await this.fetchJson(url);
            if (res.results && res.results.length > 0) return res.results[0];
        }

        return null;
    }

    private async fetchCitations(workId: string): Promise<SearchResult[]> {
        const shortId = workId.split("/").pop();
        const url = `https://api.openalex.org/works?filter=cites:${shortId}&mailto=${this.mailto}`;
        const res = await this.fetchJson(url);

        if (!res.results) return [];

        return res.results.map((r: any) => ({
            repositoryId: "openalex",
            repositoryName: "OpenAlex (Snowball)",
            identifier: r.id,
            title: r.display_name,
            creators: r.authorships?.map((a: any) => a.author.display_name) || [],
            date: r.publication_date,
            doi: r.doi,
            type: r.type,
            accessMethod: "api",
            audit: {
                methodology: "CUSTOM" as any,
                searchQueryUsed: `Snowball citations for: ${workId}`,
                extractionDate: new Date().toISOString(),
                provenanceSource: "https://api.openalex.org/works"
            }
        }));
    }

    private delay(ms: number): Promise<void> {
        return new Promise((r) => setTimeout(r, ms));
    }

    async fetchJson(url: string): Promise<any> {
        // Anexa a chave gratuita do OpenAlex (acesso estável) quando configurada.
        let finalUrl = url;
        if (config.openalexApiKey && url.includes("api.openalex.org") && !url.includes("api_key=")) {
            finalUrl += (url.includes("?") ? "&" : "?") + "api_key=" + encodeURIComponent(config.openalexApiKey);
        }
        let lastStatus = 0;
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const res = await fetch(finalUrl);
                if (res.ok) return await res.json();
                lastStatus = res.status;
                // 503 (carga) / 429 (rate-limit) → backoff e nova tentativa
                if (res.status === 503 || res.status === 429) {
                    await this.delay(400 * (attempt + 1));
                    continue;
                }
                break;
            } catch {
                lastStatus = -1;
                await this.delay(400 * (attempt + 1));
            }
        }
        // Falha RUIDOSA (não devolve null silencioso): o chamador reporta a lacuna.
        return { __error: true, status: lastStatus };
    }

    async search(query: string, options: { maxResults?: number, filter?: string } = {}): Promise<{ results: SearchResult[]; totalFound: number; error?: string }> {
        const maxResults = options.maxResults || 200;
        let url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=${Math.min(maxResults, 200)}&mailto=${this.mailto}`;

        if (options.filter) {
            url += `&filter=${options.filter}`;
        }

        const res = await this.fetchJson(url);
        if (res && res.__error) {
            const hint = (res.status === 503 || res.status === 429)
                ? " Busca anônima do OpenAlex está sob rate-limit. Configure OPENALEX_API_KEY (chave grátis em openalex.org/rest-api) no seu ~/.reviewbr/.env ou em reviewbr-mcp/.env."
                : "";
            return { results: [], totalFound: 0, error: `OpenAlex indisponível (HTTP ${res.status}).${hint}` };
        }
        if (!res || !res.results) return { results: [], totalFound: 0 };

        const results = res.results.map((r: any) => ({
            repositoryId: "openalex",
            repositoryName: "OpenAlex",
            identifier: r.id,
            title: r.display_name,
            creators: r.authorships?.map((a: any) => a.author.display_name) || [],
            date: r.publication_date,
            doi: r.doi,
            type: r.type,
            accessMethod: "api",
            audit: {
                methodology: "CUSTOM" as any,
                searchQueryUsed: query,
                extractionDate: new Date().toISOString(),
                provenanceSource: "https://api.openalex.org/works"
            }
        }));

        return {
            results,
            totalFound: res.meta?.count || results.length
        };
    }
}
