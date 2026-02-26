
import { SearchResult } from "../types.js";
import * as crypto from "node:crypto";

export class DataService {

    exportDataset(records: SearchResult[], format: "csv" | "markdown" | "json"): string {
        if (format === "json") {
            const output = {
                _validation: {
                    stamp: "PRISMA-S Compliant / Strict Protocol Enforced",
                    timestamp: new Date().toISOString(),
                    engine: "ReviewBR MCP Coordinator"
                },
                results: records
            };
            return JSON.stringify(output, null, 2);
        }

        if (format === "csv") {
            const header = "id,title,year,authors,doi,url,repo,layer\n";
            const rows = records.map(r => {
                const authors = r.creators.join("; ").replace(/"/g, '""');
                const title = (r.title || "").replace(/"/g, '""');
                const year = r.date ? r.date.substring(0, 4) : "";
                return `"${r.identifier}","${title}","${year}","${authors}","${r.doi || ""}","${r.url}","${r.repositoryName}","${(r as any).layer || ""}"`;
            });
            const stamp = `# VALIDATION: PRISMA-S Compliant / Strict Protocol Enforced\n`;
            return stamp + header + rows.join("\n");
        }

        if (format === "markdown") {
            // Bibliography style
            const formatted = records.sort((a, b) => (a.title || "").localeCompare(b.title || "")).map(r => {
                const authors = r.creators.length > 0 ? `**${r.creators[0]} et al.**` : "**Unknown**";
                const year = r.date ? r.date.substring(0, 4) : "s.d.";
                return `- ${authors}. *${r.title}*. ${r.repositoryName}, ${year}. [Link](${r.url})`;
            });
            const stamp = `> **✓ VALIDATION STAMP:** PRISMA-S Compliant / Strict Protocol Enforced\n> **Gerado por:** ReviewBR MCP\n\n`;
            return stamp + formatted.join("\n");
        }

        return "";
    }

    importRis(risContent: string, sourceName: string = "Manual Import"): SearchResult[] {
        const entries: SearchResult[] = [];
        let current: Partial<SearchResult> = {};
        const lines = risContent.split('\n');

        for (const line of lines) {
            const tag = line.substring(0, 2);
            const value = line.substring(6).trim();

            if (tag === 'TY') {
                if (Object.keys(current).length > 0) entries.push(this.finalizeEntry(current));
                current = { accessMethod: "manual_import", repositoryName: sourceName };
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
            } else if (tag === 'JO' || tag === 'JF' || tag === 'T2') {
                current.journal = value;
            } else if (tag === 'KW') {
                if (!current.subjectAreas) current.subjectAreas = [];
                current.subjectAreas.push(value);
            } else if (tag === 'ER') {
                if (Object.keys(current).length > 0) {
                    entries.push(this.finalizeEntry(current));
                    current = {};
                }
            }
        }
        return entries;
    }

    /**
     * Parses CSV exported from BVS/LILACS portal.
     * Expected columns: ID, Title, Authors, Source, Journal, Database, Type, Language,
     * Publication year, Descriptor(s), Keyword(s), Publication Country, Fulltext URL,
     * Abstract, Entry Date, Volume number, Issue number, DOI, ISSN, Accession number, PMCID
     */
    importBvsCSV(csvContent: string): SearchResult[] {
        const entries: SearchResult[] = [];
        const lines = this.parseCSVLines(csvContent);

        if (lines.length < 2) return entries;

        // Normalize headers (trim whitespace, lowercase)
        const headers = lines[0].map(h => h.trim().toLowerCase());

        for (let i = 1; i < lines.length; i++) {
            const row = lines[i];
            if (row.length < 2) continue;

            const get = (col: string): string => {
                const idx = headers.indexOf(col);
                return idx >= 0 && idx < row.length ? row[idx].trim() : "";
            };

            const authors = get("authors")
                .split(";")
                .map(a => a.trim())
                .filter(a => a.length > 0);

            const keywords = [get("descriptor(s)"), get("keyword(s)")]
                .join("; ")
                .split(";")
                .map(k => k.trim())
                .filter(k => k.length > 0);

            const entry: SearchResult = {
                repositoryId: get("database") || "LILACS",
                repositoryName: `BVS/${get("database") || "LILACS"}`,
                identifier: get("id") || get("accession number") || `BVS-${i}`,
                title: get("title"),
                creators: authors,
                description: get("abstract"),
                date: get("publication year"),
                url: get("fulltext url"),
                doi: get("doi"),
                journal: get("journal"),
                issn: get("issn"),
                subjectAreas: keywords,
                type: get("type"),
                accessMethod: "bvs_import",
            };

            if (entry.title) {
                entries.push(entry);
            }
        }

        return entries;
    }

    /**
     * Simple RFC 4180-compliant CSV parser that handles quoted fields with commas and newlines.
     */
    private parseCSVLines(csv: string): string[][] {
        const results: string[][] = [];
        let current: string[] = [];
        let field = "";
        let inQuotes = false;

        for (let i = 0; i < csv.length; i++) {
            const ch = csv[i];

            if (inQuotes) {
                if (ch === '"') {
                    if (i + 1 < csv.length && csv[i + 1] === '"') {
                        field += '"';
                        i++; // Skip escaped quote
                    } else {
                        inQuotes = false;
                    }
                } else {
                    field += ch;
                }
            } else {
                if (ch === '"') {
                    inQuotes = true;
                } else if (ch === ',') {
                    current.push(field);
                    field = "";
                } else if (ch === '\n' || ch === '\r') {
                    if (ch === '\r' && i + 1 < csv.length && csv[i + 1] === '\n') {
                        i++;
                    }
                    current.push(field);
                    field = "";
                    if (current.some(f => f.length > 0)) {
                        results.push(current);
                    }
                    current = [];
                } else {
                    field += ch;
                }
            }
        }

        // Last field/row
        current.push(field);
        if (current.some(f => f.length > 0)) {
            results.push(current);
        }

        return results;
    }

    private finalizeEntry(entry: Partial<SearchResult>): SearchResult {
        if (!entry.identifier) {
            const hash = crypto.createHash('md5').update(JSON.stringify(entry)).digest('hex');
            entry.identifier = `MANUAL-${hash.substring(0, 8)}`;
        }
        return entry as SearchResult;
    }
}
