
import { Registry } from "../registry/loader.js";
import { AccessStrategy } from "../access/strategy.js";
import { SearchResult, SearchOptions } from "../types.js";

export class SearchService {
    private registry: Registry;
    private strategy: AccessStrategy;

    constructor(registry: Registry, strategy: AccessStrategy) {
        this.registry = registry;
        this.strategy = strategy;
    }

    async searchPapers(
        query: string,
        layers: number[] = [1, 3],
        options: SearchOptions = {}
    ): Promise<{ results: SearchResult[]; errors: string[] }> {
        const allResults: SearchResult[] = [];
        const errors: string[] = [];

        // 1. Filter Repositories by Layer
        const activeRepos = this.registry.getActive();
        const targetRepos = activeRepos.filter(repo => {
            const layer = parseInt(repo.status === 'active' ? (repo as any).layer ?? "2" : "2");
            return layers.includes(layer);
        });

        if (targetRepos.length === 0) {
            return { results: [], errors: ["No repositories found for the specified layers."] };
        }

        // 2. Execute Search in Parallel (with rate limiting managed by strategy)
        // We chunk the requests to avoid overwhelming the system/network
        const chunkSize = 5;
        for (let i = 0; i < targetRepos.length; i += chunkSize) {
            const chunk = targetRepos.slice(i, i + chunkSize);
            const promises = chunk.map(async (repo) => {
                try {
                    const results = await this.strategy.search(repo, query, options);
                    // Inject layer info into results
                    const layer = (repo as any).layer ?? "unknown";
                    const enriched = results.map(r => ({ ...r, layer }));
                    return { repoId: repo.id, results: enriched };
                } catch (error) {
                    return { repoId: repo.id, error: (error as Error).message };
                }
            });

            const responses = await Promise.all(promises);

            for (const res of responses) {
                if ('error' in res && res.error) {
                    errors.push(`${res.repoId}: ${res.error}`);
                } else if ('results' in res && res.results) {
                    allResults.push(...res.results);
                }
            }
        }

        return { results: allResults, errors };
    }
}
