
import { SearchResult } from "../types.js";

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
            url: r.doi || r.id,
            doi: r.doi,
            type: r.type,
            accessMethod: "api"
        }));
    }

    async fetchJson(url: string): Promise<any> {
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.json();
    }

    async search(query: string, options: { maxResults?: number, filter?: string } = {}): Promise<{ results: SearchResult[]; totalFound: number }> {
        const maxResults = options.maxResults || 200;
        let url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=${Math.min(maxResults, 200)}&mailto=${this.mailto}`;

        if (options.filter) {
            url += `&filter=${options.filter}`;
        }

        const res = await this.fetchJson(url);
        if (!res || !res.results) return { results: [], totalFound: 0 };

        const results = res.results.map((r: any) => ({
            repositoryId: "openalex",
            repositoryName: "OpenAlex",
            identifier: r.id,
            title: r.display_name,
            creators: r.authorships?.map((a: any) => a.author.display_name) || [],
            date: r.publication_date,
            url: r.doi || r.id,
            doi: r.doi,
            type: r.type,
            accessMethod: "api"
        }));

        return {
            results,
            totalFound: res.meta?.count || results.length
        };
    }
}
