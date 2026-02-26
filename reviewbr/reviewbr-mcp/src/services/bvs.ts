
import { SearchResult } from "../types.js";
import { parse } from "csv-parse/sync";

export class BvsService {
    /**
     * Parse CSV exported from BVS/LILACS.
     */
    parseCSV(csvContent: string): SearchResult[] {
        const records = parse(csvContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        return records.map((r: any) => ({
            repositoryId: "lilacs",
            repositoryName: "BVS/LILACS",
            identifier: r.id || r.ID || r.PMID || r.DOI || "",
            title: r.title || r.TI || r.Title || "Untitled",
            creators: this.parseAuthors(r.authors || r.AU || r.Author || ""),
            date: r.year || r.PY || r.Date || "",
            url: r.url || r.UR || "",
            doi: r.doi || r.DI || "",
            description: r.abstract || r.AB || "",
            journal: r.journal || r.SO || r.Source || "",
            type: "journal-article",
            accessMethod: "bvs_import"
        }));
    }

    private parseAuthors(authorStr: string): string[] {
        if (!authorStr) return [];
        // Common BVS separators: ; or |
        return authorStr.split(/[;|]/).map(a => a.trim()).filter(Boolean);
    }
}
