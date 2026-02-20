
import { SearchResult } from "../types.js";
import * as crypto from "node:crypto";

export class DataService {

    exportDataset(records: SearchResult[], format: "csv" | "markdown" | "json"): string {
        if (format === "json") return JSON.stringify(records, null, 2);

        if (format === "csv") {
            const header = "id,title,year,authors,doi,url,repo,layer\n";
            const rows = records.map(r => {
                const authors = r.creators.join("; ").replace(/"/g, '""');
                const title = (r.title || "").replace(/"/g, '""');
                const year = r.date ? r.date.substring(0, 4) : "";
                return `"${r.identifier}","${title}","${year}","${authors}","${r.doi || ""}","${r.url}","${r.repositoryName}","${(r as any).layer || ""}"`;
            });
            return header + rows.join("\n");
        }

        if (format === "markdown") {
            // Bibliography style
            return records.sort((a, b) => (a.title || "").localeCompare(b.title || "")).map(r => {
                const authors = r.creators.length > 0 ? `**${r.creators[0]} et al.**` : "**Unknown**";
                const year = r.date ? r.date.substring(0, 4) : "s.d.";
                return `- ${authors}. *${r.title}*. ${r.repositoryName}, ${year}. [Link](${r.url})`;
            }).join("\n");
        }

        return "";
    }

    importRis(risContent: string): SearchResult[] {
        const entries: SearchResult[] = [];
        let current: Partial<SearchResult> = {};
        const lines = risContent.split('\n');

        // Basic RIS parser
        for (const line of lines) {
            const tag = line.substring(0, 2);
            const value = line.substring(6).trim();

            if (tag === 'TY') {
                if (Object.keys(current).length > 0) entries.push(this.finalizeEntry(current));
                current = { accessMethod: "manual_import", repositoryName: "Manual Import" };
            } else if (tag === 'TI' || tag === 'T1') {
                current.title = value;
            } else if (tag === 'AU' || tag === 'A1') {
                if (!current.creators) current.creators = [];
                current.creators.push(value);
            } else if (tag === 'PY' || tag === 'Y1') {
                current.date = value;
            } else if (tag === 'UR' || tag === 'L1') {
                current.url = value;
            } else if (tag === 'DO') {
                current.doi = value;
            } else if (tag === 'AB' || tag === 'N2') {
                current.description = value;
            } else if (tag === 'ER') {
                if (Object.keys(current).length > 0) {
                    entries.push(this.finalizeEntry(current));
                    current = {};
                }
            }
        }
        return entries;
    }

    private finalizeEntry(entry: Partial<SearchResult>): SearchResult {
        // ensure required fields
        if (!entry.identifier) {
            const hash = crypto.createHash('md5').update(JSON.stringify(entry)).digest('hex');
            entry.identifier = `MANUAL-${hash.substring(0, 8)}`;
        }
        return entry as SearchResult;
    }
}
