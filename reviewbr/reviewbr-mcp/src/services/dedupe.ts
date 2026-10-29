
import { SearchResult } from "../types.js";

/** Rastro de uma duplicata removida: quem ficou, quem saiu, por que critério e de que fontes. */
export interface DedupePair {
    mantido: string;
    removido: string;
    criterio: "doi" | "titulo_ano" | "url";
    fontes: string[];
}

export class DeduplicationService {

    deduplicate(records: SearchResult[]): { unique: SearchResult[]; duplicates: SearchResult[]; pairs: DedupePair[]; stats: any } {
        const uniqueMap = new Map<string, SearchResult>();
        const duplicates: SearchResult[] = [];
        const pairs: DedupePair[] = [];
        let dupCount = 0;

        for (const record of records) {
            const { key, criterio } = this.generateKey(record);

            const kept = uniqueMap.get(key);
            if (kept) {
                duplicates.push(record);
                dupCount++;
                pairs.push({
                    mantido: kept.identifier ?? kept.title ?? kept.url ?? "[TBD]",
                    removido: record.identifier ?? record.title ?? record.url ?? "[TBD]",
                    criterio,
                    fontes: [kept.repositoryName, record.repositoryName].filter((f): f is string => !!f),
                });
                // Optional: implementation could merge metadata from duplicates here
            } else {
                uniqueMap.set(key, record);
            }
        }

        return {
            unique: Array.from(uniqueMap.values()),
            duplicates,
            pairs,
            stats: {
                total: records.length,
                unique: uniqueMap.size,
                duplicates: dupCount
            }
        };
    }

    private generateKey(record: SearchResult): { key: string; criterio: DedupePair["criterio"] } {
        // Priority 1: DOI (normalized)
        if (record.doi) {
            return { key: `doi:${record.doi.toLowerCase().trim()}`, criterio: "doi" };
        }

        // Priority 2: Title + Year (normalized)
        if (record.title) {
            const titleNorm = record.title.toLowerCase().replace(/[^a-z0-9]/g, '');
            const year = record.date ? record.date.substring(0, 4) : '0000';
            return { key: `title:${titleNorm}_${year}`, criterio: "titulo_ano" };
        }

        // Fallback: URL
        return { key: `url:${record.url}`, criterio: "url" };
    }
}
