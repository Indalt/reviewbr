
import { SearchResult } from "../types.js";

interface ProviderConfig {
    id: string;
    baseUrl: string;
    endpoints: Record<string, string>;
    mapping: Record<string, string>;
}

export class UniversalProvider {
    /**
     * Generic search implementation for academic REST APIs.
     * Uses configurable mappings to transform diverse JSON responses into SearchResult[].
     */
    async search(config: ProviderConfig, query: string, options: { maxResults?: number } = {}): Promise<{ results: SearchResult[]; totalFound: number }> {
        const searchPath = config.endpoints?.search || "";
        // Simple search query expansion - will be refined per-provider
        const url = `${config.baseUrl}${searchPath}?query=${encodeURIComponent(query)}&format=json&pageSize=${options.maxResults || 50}`;

        try {
            const res = await fetch(url);
            if (!res.ok) return { results: [], totalFound: 0 };
            const data = await res.json();

            // Transform based on mapping (simplified for now)
            const listPath = config.mapping.list || "resultList.result";
            const items = this.resolvePath(data, listPath) || [];

            const results = items.map((item: any) => ({
                repositoryId: config.id.toLowerCase(),
                repositoryName: config.id,
                identifier: this.resolvePath(item, config.mapping.id || "id"),
                title: this.resolvePath(item, config.mapping.title || "title"),
                creators: [this.resolvePath(item, config.mapping.author || "authorString")],
                date: this.resolvePath(item, config.mapping.year || "pubYear"),
                url: this.resolvePath(item, config.mapping.url || "url"),
                doi: this.resolvePath(item, config.mapping.doi || "doi"),
                accessMethod: "api"
            }));

            return {
                results,
                totalFound: this.resolvePath(data, config.mapping.total || "hitCount") || results.length
            };
        } catch (error) {
            console.error(`Error in UniversalProvider (${config.id}):`, error);
            return { results: [], totalFound: 0 };
        }
    }

    private resolvePath(obj: any, path: string): any {
        if (!path) return undefined;
        return path.split('.').reduce((prev, curr) => {
            if (prev && Array.isArray(prev)) {
                // If we reach an array, assume we want the first element or map it?
                // For now, let's take the first element if it's a simple path
                return prev[0] ? prev[0][curr] : undefined;
            }
            return prev && prev[curr];
        }, obj);
    }
}
