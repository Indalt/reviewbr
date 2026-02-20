
import { SearchResult } from "../types.js";

export class DeduplicationService {

    deduplicate(records: SearchResult[]): { unique: SearchResult[]; duplicates: SearchResult[]; stats: any } {
        const uniqueMap = new Map<string, SearchResult>();
        const duplicates: SearchResult[] = [];
        let dupCount = 0;

        for (const record of records) {
            const key = this.generateKey(record);

            if (uniqueMap.has(key)) {
                duplicates.push(record);
                dupCount++;
                // Optional: implementation could merge metadata from duplicates here
            } else {
                uniqueMap.set(key, record);
            }
        }

        return {
            unique: Array.from(uniqueMap.values()),
            duplicates,
            stats: {
                total: records.length,
                unique: uniqueMap.size,
                duplicates: dupCount
            }
        };
    }

    private generateKey(record: SearchResult): string {
        // Priority 1: DOI (normalized)
        if (record.doi) {
            return `doi:${record.doi.toLowerCase().trim()}`;
        }

        // Priority 2: Title + Year (normalized)
        if (record.title) {
            const titleNorm = record.title.toLowerCase().replace(/[^a-z0-9]/g, '');
            const year = record.date ? record.date.substring(0, 4) : '0000';
            return `title:${titleNorm}_${year}`;
        }

        // Fallback: URL
        return `url:${record.url}`;
    }
}
