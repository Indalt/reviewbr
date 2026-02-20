/**
 * Access strategy — orchestrates access layers with platform-specific routing.
 * Chooses the best method for each repository automatically:
 * - BDTD → VuFind API (from ApoenaX/bdtd-scraper pattern)
 * - SciELO → ArticleMeta/Search API (from scieloorg/articles_meta)
 * - USP → Custom result.php scraper
 * - DSpace 7 → REST API + /server/oai/request
 * - DSpace 5/6 → OAI-PMH + /oai/request
 * - Others → HTML scraper fallback
 */

import { OaiPmhClient } from "./oai-pmh.js";
import { DSpaceRestClient } from "./dspace-rest.js";
import { HtmlScraper } from "./html-scraper.js";
import { BdtdAdapter, ScieloAdapter, UspAdapter, resolveOaiEndpoint } from "./platform-adapters.js";
import type { RepositoryEntry, SearchResult, SearchOptions, OaiRecord, DublinCoreMetadata, DSpaceItem } from "../types.js";

interface CapabilityCache {
    oaiPmhWorks: boolean | null;
    oaiPmhEndpoint: string | null; // the actual working endpoint (may differ from registered)
    restApiWorks: boolean | null;
    checkedAt: number;
}

export class AccessStrategy {
    private oai = new OaiPmhClient();
    private rest = new DSpaceRestClient();
    private scraper = new HtmlScraper();
    private bdtd = new BdtdAdapter();
    private scielo = new ScieloAdapter();
    private usp = new UspAdapter();
    private capabilities = new Map<string, CapabilityCache>();

    /**
     * Search a repository using the best available method.
     */
    async search(
        repo: RepositoryEntry,
        query: string,
        opts?: SearchOptions
    ): Promise<SearchResult[]> {
        const maxResults = opts?.maxResults ?? 50;

        // ─── Platform-specific fast paths ────────────────────────

        // BDTD: use VuFind API (proven by ApoenaX/bdtd-scraper)
        if (repo.id === "BR-AGG-0001" || repo.repository.url.includes("bdtd.ibict.br")) {
            try {
                return await this.bdtd.search(query, opts);
            } catch {
                // Fall through to generic methods
            }
        }

        // SciELO: use ArticleMeta/Search API
        if (repo.id === "BR-AGG-0002" || repo.repository.url.includes("scielo.br")) {
            try {
                return await this.scielo.search(query, opts);
            } catch {
                // Fall through
            }
        }

        // USP: custom result.php
        if (repo.repository.url.includes("repositorio.usp.br")) {
            try {
                const results = await this.usp.search(query, opts);
                if (results.length > 0) return results;
            } catch {
                // Fall through
            }
        }

        // ─── Standard access layer cascade ───────────────────────

        const cap = await this.detectCapabilities(repo);

        // Strategy 1: OAI-PMH (most reliable, but search = full harvest + filter)
        if (cap.oaiPmhWorks && cap.oaiPmhEndpoint) {
            try {
                const records = await this.oai.listAllRecords(cap.oaiPmhEndpoint, {
                    from: opts?.dateFrom,
                    until: opts?.dateUntil,
                    set: opts?.set,
                    maxRecords: maxResults * 3, // Over-fetch to filter
                });

                const results = records
                    .filter((r) => this.matchesQuery(r, query))
                    .map((r) => this.oaiRecordToSearchResult(r, repo))
                    .slice(0, maxResults);

                if (results.length > 0) return results;
            } catch (error) {
                // Fall through to next strategy
            }
        }

        // Strategy 2: DSpace REST API
        if (cap.restApiWorks) {
            try {
                const result = await this.rest.search(repo.repository.url, query, {
                    size: maxResults,
                });

                if (result.items.length > 0) {
                    return result.items.map((item) =>
                        this.dspaceItemToSearchResult(item, repo)
                    );
                }
            } catch {
                // Fall through
            }
        }

        // Strategy 3: HTML Scraper (universal fallback)
        try {
            return await this.scraper.search(
                repo.repository.url,
                repo.id,
                repo.repository.name,
                query,
                maxResults
            );
        } catch {
            return [];
        }
    }

    /**
     * Get metadata for a specific record.
     */
    async getMetadata(
        repo: RepositoryEntry,
        identifier: string
    ): Promise<Partial<DublinCoreMetadata>> {
        // BDTD-specific
        if (repo.id === "BR-AGG-0001" || repo.repository.url.includes("bdtd.ibict.br")) {
            try {
                return await this.bdtd.getRecord(identifier);
            } catch { /* fall through */ }
        }

        // SciELO-specific
        if (repo.id === "BR-AGG-0002" || repo.repository.url.includes("scielo.br")) {
            try {
                return await this.scielo.getMetadata(identifier);
            } catch { /* fall through */ }
        }

        // USP-specific
        if (repo.repository.url.includes("repositorio.usp.br")) {
            try {
                return await this.usp.getItemMetadata(identifier);
            } catch { /* fall through */ }
        }

        // Standard: OAI-PMH first
        const cap = await this.detectCapabilities(repo);
        if (cap.oaiPmhWorks && cap.oaiPmhEndpoint) {
            try {
                const record = await this.oai.getRecord(
                    cap.oaiPmhEndpoint,
                    identifier
                );
                return record.metadata;
            } catch {
                // Fall through
            }
        }

        // HTML scraper fallback
        try {
            let itemUrl = identifier;
            if (!identifier.startsWith("http")) {
                const base = repo.repository.url.replace(/\/+$/, "");
                itemUrl = identifier.startsWith("/")
                    ? `${new URL(base).origin}${identifier}`
                    : `${base}/${identifier}`;
            }
            return await this.scraper.getItemMetadata(itemUrl);
        } catch {
            return {};
        }
    }

    /**
     * Find PDF download URL for a record.
     */
    async findPdfUrl(
        repo: RepositoryEntry,
        identifier: string
    ): Promise<string | null> {
        const cap = await this.detectCapabilities(repo);

        // DSpace REST: get bitstreams
        if (cap.restApiWorks && identifier.length === 36) {
            // UUID format
            try {
                const bitstreams = await this.rest.getBitstreams(
                    repo.repository.url,
                    identifier
                );
                const pdf = bitstreams.find((b) =>
                    b.mimeType === "application/pdf" || b.name.toLowerCase().endsWith(".pdf")
                );
                if (pdf) return pdf.retrieveLink;
            } catch {
                // Fall through
            }
        }

        // HTML scraper: parse item page
        try {
            let itemUrl = identifier;
            if (!identifier.startsWith("http")) {
                const base = repo.repository.url.replace(/\/+$/, "");
                itemUrl = identifier.startsWith("/")
                    ? `${new URL(base).origin}${identifier}`
                    : `${base}/${identifier}`;
            }
            return await this.scraper.findPdfUrl(itemUrl);
        } catch {
            return null;
        }
    }

    /**
     * Get the OAI-PMH client for direct access (used by harvest tool).
     */
    getOaiClient(): OaiPmhClient {
        return this.oai;
    }

    /**
     * Get the DSpace REST client for direct access.
     */
    getRestClient(): DSpaceRestClient {
        return this.rest;
    }

    /**
     * Detect which access methods work for a repository.
     * Results are cached for 1 hour.
     * 
     * Key improvement: tries multiple OAI-PMH endpoint paths,
     * because DSpace 7 uses /server/oai/request, not /oai/request.
     */
    private async detectCapabilities(repo: RepositoryEntry): Promise<CapabilityCache> {
        const cached = this.capabilities.get(repo.id);
        if (cached && Date.now() - cached.checkedAt < 3600_000) {
            return cached;
        }

        const cap: CapabilityCache = {
            oaiPmhWorks: null,
            oaiPmhEndpoint: null,
            restApiWorks: null,
            checkedAt: Date.now(),
        };

        // Check OAI-PMH — try registered endpoint first, then alternatives
        const oaiCandidates: string[] = [];

        if (repo.access.oaiPmh.available && repo.access.oaiPmh.endpoint) {
            oaiCandidates.push(repo.access.oaiPmh.endpoint);
        }

        // Add alternative paths (DSpace 7 vs 5/6)
        const altEndpoints = resolveOaiEndpoint(repo.repository.url, repo.repository.platform);
        for (const alt of altEndpoints) {
            if (!oaiCandidates.includes(alt)) {
                oaiCandidates.push(alt);
            }
        }

        for (const endpoint of oaiCandidates) {
            try {
                await this.oai.identify(endpoint);
                cap.oaiPmhWorks = true;
                cap.oaiPmhEndpoint = endpoint;
                break;
            } catch {
                continue;
            }
        }

        if (!cap.oaiPmhWorks) {
            cap.oaiPmhWorks = false;
        }

        // Check DSpace REST
        if (repo.repository.platform === "dspace") {
            cap.restApiWorks = await this.rest.detect(repo.repository.url);
        } else {
            cap.restApiWorks = false;
        }

        this.capabilities.set(repo.id, cap);
        return cap;
    }

    /**
     * Check if an OAI record matches a search query (simple text matching).
     */
    private matchesQuery(record: OaiRecord, query: string): boolean {
        const terms = query
            .toLowerCase()
            .replace(/['"()]/g, "")
            .split(/\s+(?:AND|OR)\s+/i)
            .flatMap((t) => t.split(/\s+/))
            .filter((t) => t.length > 2 && !t.startsWith("-"));

        const text = [
            ...record.metadata.title,
            ...record.metadata.description,
            ...record.metadata.subject,
        ]
            .join(" ")
            .toLowerCase();

        return terms.some((term) => text.includes(term));
    }

    /**
     * Convert OAI-PMH record to SearchResult.
     */
    private oaiRecordToSearchResult(
        record: OaiRecord,
        repo: RepositoryEntry
    ): SearchResult {
        // Try to find a URL in the identifiers
        const urls = record.metadata.identifier.filter((id) => id.startsWith("http"));
        const url = urls[0] ?? `${repo.repository.url}handle/${record.identifier.split(":").pop()}`;

        return {
            repositoryId: repo.id,
            repositoryName: repo.repository.name,
            identifier: record.identifier,
            title: record.metadata.title[0] ?? "",
            creators: record.metadata.creator,
            description: record.metadata.description[0] ?? "",
            date: record.metadata.date[0] ?? "",
            type: record.metadata.type[0] ?? "",
            url,
            accessMethod: "oai-pmh",
        };
    }

    /**
     * Convert DSpace REST item to SearchResult.
     */
    private dspaceItemToSearchResult(
        item: DSpaceItem,
        repo: RepositoryEntry
    ): SearchResult {
        const metadata = item.metadata as Record<string, Array<{ value: string }>> | undefined;
        const getFirst = (key: string): string =>
            metadata?.[key]?.[0]?.value ?? "";
        const getAll = (key: string): string[] =>
            metadata?.[key]?.map((v) => v.value) ?? [];

        const handle = item.handle as string | undefined;
        const baseUrl = repo.repository.url.replace(/\/+$/, "");
        const url = handle ? `${baseUrl}/handle/${handle}` : baseUrl;

        return {
            repositoryId: repo.id,
            repositoryName: repo.repository.name,
            identifier: (item.uuid as string) ?? "",
            title: getFirst("dc.title") || (item.name as string) || "",
            creators: getAll("dc.contributor.author"),
            description: getFirst("dc.description.abstract"),
            date: getFirst("dc.date.issued"),
            type: getFirst("dc.type"),
            url,
            accessMethod: "dspace-rest",
        };
    }
}
