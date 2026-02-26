
import { SearchResult } from "../types.js";

export interface ZoteroConfig {
    userId: string;
    apiKey: string;
    groupWork?: boolean;
}

export class ZoteroService {

    /**
     * Pushes a dataset (array of SearchResult) to Zotero items.
     * Maps our internal format to Zotero's JSON API format.
     */
    async pushToZotero(results: SearchResult[], config: ZoteroConfig): Promise<{ success: number; failed: number; errors: string[] }> {
        const baseUrl = config.groupWork
            ? `https://api.zotero.org/groups/${config.userId}/items`
            : `https://api.zotero.org/users/${config.userId}/items`;

        const items = results.map(r => this.mapToZoteroItem(r));
        const errors: string[] = [];
        let successCount = 0;
        let failedCount = 0;

        // Zotero API accepts batches of up to 50 items for creation
        const batchSize = 50;
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            try {
                const response = await fetch(baseUrl, {
                    method: 'POST',
                    headers: {
                        'Zotero-API-Key': config.apiKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(batch)
                });

                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(`Zotero API Error (${response.status}): ${text}`);
                }

                successCount += batch.length;
            } catch (e) {
                failedCount += batch.length;
                errors.push((e as Error).message);
            }
        }

        return { success: successCount, failed: failedCount, errors };
    }

    private mapToZoteroItem(res: SearchResult): any {
        const itemType = this.mapItemType(res.type || "article");

        // Zotero requires authors to be split into firstName/lastName
        const creators = res.creators.map(name => {
            const parts = name.split(",").map(p => p.trim());
            if (parts.length >= 2) {
                return { creatorType: "author", firstName: parts[1], lastName: parts[0] };
            }
            return { creatorType: "author", name: name };
        });

        const item: any = {
            itemType: itemType,
            title: res.title,
            creators: creators,
            abstractNote: res.description,
            date: res.date,
            url: res.url,
            DOI: res.doi,
            extra: `Repository: ${res.repositoryName}\nID: ${res.identifier}\nProvider: ReviewBR`,
        };

        if (itemType === "journalArticle" && res.journal) {
            item.publicationTitle = res.journal;
        }

        if (itemType === "thesis" && res.institution) {
            item.university = res.institution;
        }

        return item;
    }

    private mapItemType(type: string): string {
        const t = type.toLowerCase();
        if (t.includes("article") || t.includes("periódico") || t.includes("journal")) return "journalArticle";
        if (t.includes("thesis") || t.includes("tese") || t.includes("dissertation") || t.includes("mestrado") || t.includes("doutorado")) return "thesis";
        if (t.includes("report") || t.includes("relatório")) return "report";
        if (t.includes("book") || t.includes("livro")) return "book";
        return "journalArticle"; // Default
    }
}
