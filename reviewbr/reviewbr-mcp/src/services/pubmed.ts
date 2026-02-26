/**
 * PubMed Search Service — Native TypeScript
 * 
 * Uses NCBI E-utilities REST API directly (no Python dependency).
 * Supports temporal coverage control via minDate/maxDate.
 * 
 * API Reference: https://www.ncbi.nlm.nih.gov/books/NBK25499/
 */

import { XMLParser } from "fast-xml-parser";
import { fetchText } from "../utils/http.js";
import { SearchResult } from "../types.js";

const EUTILS_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const TOOL_NAME = "reviewbr-mcp";
const TOOL_EMAIL = "reviewbr@prismaid.com";

// Batch size for efetch (NCBI max is 200; we use 150 for safety margin)
const EFETCH_BATCH_SIZE = 150;

const xmlParser = new XMLParser({
    ignoreAttributes: true,
    removeNSPrefix: true,
    isArray: (name) => {
        return ["PubmedArticle", "AbstractText", "Author", "ELocationID", "MeshHeading", "Keyword"].includes(name);
    },
    textNodeName: "#text",
});

export interface PubMedSearchOptions {
    maxResults?: number;    // Default: 5000
    minDate?: string;       // Format: YYYY or YYYY/MM/DD
    maxDate?: string;       // Format: YYYY or YYYY/MM/DD
    sort?: "relevance" | "pub_date";  // Default: relevance
}

export class PubMedService {

    /**
     * Search PubMed and return structured results.
     * Uses esearch (get IDs) → efetch (get metadata) pipeline.
     */
    async search(
        query: string,
        options: PubMedSearchOptions = {}
    ): Promise<{ results: SearchResult[]; error?: string; totalFound?: number }> {
        const maxResults = options.maxResults ?? 5000;
        const sort = options.sort ?? "relevance";

        try {
            // Step 1: esearch — get PMIDs
            const ids = await this.esearch(query, maxResults, options.minDate, options.maxDate, sort);

            if (ids.length === 0) {
                return { results: [], totalFound: 0 };
            }

            // Step 2: efetch — get full metadata in batches
            const results: SearchResult[] = [];
            for (let i = 0; i < ids.length; i += EFETCH_BATCH_SIZE) {
                const batch = ids.slice(i, i + EFETCH_BATCH_SIZE);
                const batchResults = await this.efetch(batch);
                results.push(...batchResults);

                // Polite delay between batches (NCBI requires max 3 requests/sec without API key)
                if (i + EFETCH_BATCH_SIZE < ids.length) {
                    await this.sleep(400);
                }
            }

            return { results, totalFound: ids.length };

        } catch (error) {
            return { results: [], error: (error as Error).message };
        }
    }

    /**
     * Step 1: ESearch — search PubMed and return list of PMIDs.
     */
    private async esearch(
        query: string,
        maxResults: number,
        minDate?: string,
        maxDate?: string,
        sort: string = "relevance"
    ): Promise<string[]> {
        const params = new URLSearchParams({
            db: "pubmed",
            term: query,
            retmax: String(maxResults),
            retmode: "json",
            sort: sort,
            tool: TOOL_NAME,
            email: TOOL_EMAIL,
        });

        if (minDate) {
            params.set("mindate", minDate);
            params.set("datetype", "pdat"); // Publication date
        }
        if (maxDate) {
            params.set("maxdate", maxDate);
            params.set("datetype", "pdat");
        }

        const url = `${EUTILS_BASE}/esearch.fcgi?${params.toString()}`;
        const response = await fetchText(url, { timeout: 30_000 });
        const data = JSON.parse(response);

        if (data.esearchresult?.ERROR) {
            throw new Error(`ESearch error: ${data.esearchresult.ERROR}`);
        }

        return data.esearchresult?.idlist ?? [];
    }

    /**
     * Step 2: EFetch — fetch full article metadata for a batch of PMIDs.
     * Returns PubMed XML, parsed into SearchResult[].
     */
    private async efetch(ids: string[]): Promise<SearchResult[]> {
        const params = new URLSearchParams({
            db: "pubmed",
            id: ids.join(","),
            retmode: "xml",
            tool: TOOL_NAME,
            email: TOOL_EMAIL,
        });

        const url = `${EUTILS_BASE}/efetch.fcgi?${params.toString()}`;
        const xml = await fetchText(url, { timeout: 60_000 });
        return this.parsePubmedXml(xml);
    }

    /**
     * Parse PubMed XML (efetch response) into SearchResult[].
     */
    private parsePubmedXml(xml: string): SearchResult[] {
        const parsed = xmlParser.parse(xml);
        const articles = parsed?.PubmedArticleSet?.PubmedArticle;
        if (!articles) return [];

        const articleArray = Array.isArray(articles) ? articles : [articles];
        const results: SearchResult[] = [];

        for (const article of articleArray) {
            try {
                const result = this.parseOneArticle(article);
                if (result) results.push(result);
            } catch {
                // Skip unparseable articles
                continue;
            }
        }

        return results;
    }

    /**
     * Parse a single PubmedArticle node into a SearchResult.
     */
    private parseOneArticle(article: any): SearchResult | null {
        const medline = article?.MedlineCitation;
        if (!medline) return null;

        const articleData = medline.Article;
        if (!articleData) return null;

        // PMID
        const pmid = String(medline.PMID?.["#text"] ?? medline.PMID ?? "");

        // Title
        const title = this.extractText(articleData.ArticleTitle);
        if (!title) return null;

        // Abstract
        let abstract = "";
        const abstractParts = articleData.Abstract?.AbstractText;
        if (abstractParts) {
            if (Array.isArray(abstractParts)) {
                abstract = abstractParts.map((p: any) => this.extractText(p)).join(" ");
            } else {
                abstract = this.extractText(abstractParts);
            }
        }

        // Authors
        const creators: string[] = [];
        const authorList = articleData.AuthorList?.Author;
        if (authorList && Array.isArray(authorList)) {
            for (const author of authorList) {
                const lastName = this.extractText(author.LastName);
                const foreName = this.extractText(author.ForeName);
                if (lastName && foreName) {
                    creators.push(`${lastName}, ${foreName}`);
                } else if (lastName) {
                    creators.push(lastName);
                }
            }
        }

        // Publication date
        let date = "";
        const journal = articleData.Journal;
        if (journal?.JournalIssue?.PubDate) {
            const pubDate = journal.JournalIssue.PubDate;
            date = this.extractText(pubDate.Year) || this.extractText(pubDate.MedlineDate) || "";
        }

        // Journal name
        const journalName = this.extractText(journal?.Title) || "";

        // DOI
        let doi = "";
        let pdfUrl = "";
        const elocIds = articleData.ELocationID;
        if (elocIds && Array.isArray(elocIds)) {
            for (const eloc of elocIds) {
                if (typeof eloc === "object" && eloc?.["#text"]) {
                    doi = String(eloc["#text"]);
                    pdfUrl = `https://doi.org/${doi}`;
                    break;
                } else if (typeof eloc === "string" && eloc.includes("10.")) {
                    doi = eloc;
                    pdfUrl = `https://doi.org/${doi}`;
                    break;
                }
            }
        }

        // Keywords / MeSH
        const subjectAreas: string[] = [];
        const meshList = medline.MeshHeadingList?.MeshHeading;
        if (meshList && Array.isArray(meshList)) {
            for (const mesh of meshList) {
                const desc = this.extractText(mesh.DescriptorName);
                if (desc) subjectAreas.push(desc);
            }
        }
        const keywords = medline.KeywordList?.Keyword;
        if (keywords && Array.isArray(keywords)) {
            for (const kw of keywords) {
                const kwText = this.extractText(kw);
                if (kwText) subjectAreas.push(kwText);
            }
        }

        return {
            repositoryId: "pubmed",
            repositoryName: "PubMed (via E-utilities)",
            identifier: pmid,
            title,
            creators,
            description: abstract,
            date,
            type: "article",
            url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
            doi,
            pdfUrl,
            journal: journalName,
            subjectAreas,
            accessMethod: "api",
        };
    }

    /**
     * Extract text from XML node that may be string, object with #text, or number.
     */
    private extractText(node: unknown): string {
        if (node === undefined || node === null) return "";
        if (typeof node === "string") return node;
        if (typeof node === "number") return String(node);
        if (typeof node === "object" && node !== null && "#text" in node) {
            return String((node as Record<string, unknown>)["#text"]);
        }
        return String(node);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
