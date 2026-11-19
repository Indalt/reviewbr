/**
 * Access strategy — orchestrates access layers with platform-specific routing.
 * Busca (linha 11 da FILA): sempre pela interface de busca do repositório, nunca pela colheita.
 * - BDTD → VuFind API (from ApoenaX/bdtd-scraper pattern)
 * - SciELO → ArticleMeta/Search API (from scieloorg/articles_meta)
 * - USP → Custom result.php scraper
 * - DSpace 7 → REST API (/server/api, ou o endereço do catálogo)
 * - DSpace 5/6 e outros → página de busca do site (endereço do catálogo ou os caminhos comuns)
 * - Catálogo com `searchable: false` → erro com o motivo
 * OAI-PMH → só colheita e metadados de um registro.
 */

import { OaiPmhClient } from "./oai-pmh.js";
import { DSpaceRestClient } from "./dspace-rest.js";
import { HtmlScraper } from "./html-scraper.js";
import { UniversalProvider } from "../services/universal_provider.js";
import { BdtdAdapter, ScieloAdapter, UspAdapter, resolveOaiEndpoint } from "./platform-adapters.js";
import type { RepositoryEntry, SearchResult, SearchOptions, OaiRecord, DublinCoreMetadata, DSpaceItem } from "../types.js";

/** O que uma busca num repositório devolveu, e de onde veio a contagem (linha 11 da FILA). */
export interface RelatorioBusca {
    results: SearchResult[];
    /** Total que a fonte declarou para a string; null quando o método não o informa. */
    totalNaFonte: number | null;
    /** Método e endereço usados, para o registro da busca. */
    metodo: string;
}

/** Plataforma do catálogo comparada sem diferença de maiúscula ("DSpace" × "dspace", item 2). */
function ehDspace(repo: RepositoryEntry): boolean {
    return (repo.repository.platform ?? "").toLowerCase().startsWith("dspace");
}

/** Endereço da API REST: o do catálogo (`access.restApi.endpoint`) ou o do repositório. */
function baseRest(repo: RepositoryEntry): string {
    return repo.access.restApi?.endpoint || repo.repository.url;
}

/** Texto sem acento e em minúscula, para comparar palavras (item 5). */
function semAcento(s: string): string {
    return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

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
    private universal = new UniversalProvider();
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
        return (await this.searchDetailed(repo, query, opts)).results;
    }

    /**
     * Busca pela interface de busca do próprio repositório, para que o total bata com o que uma
     * pessoa vê no site (linha 11 da FILA, decidida pelo Vicente em 19/11/2026).
     *
     * O OAI-PMH NÃO serve de busca: ele colhia os primeiros `maxResults × 3` registros do acervo
     * e filtrava só esses — o zero sem aviso na UECE, na Alice, no IFCE e na UFPI (commit 93c7997) vinha daí.
     * O OAI fica para a colheita (`harvest_records`).
     *
     * Zero só quando a fonte disse zero. Repositório marcado no catálogo como não pesquisável, ou
     * em que nenhum método funcionou, é ERRO com o motivo — antes era lista vazia calada.
     */
    async searchDetailed(
        repo: RepositoryEntry,
        query: string,
        opts?: SearchOptions
    ): Promise<RelatorioBusca> {
        const maxResults = opts?.maxResults ?? 50;
        const falhas: string[] = [];

        // DECLARAR (linha 11): o catálogo diz quando a tool não tem busca que consiga usar.
        if (repo.access.searchable === false) {
            throw new Error(
                `não pesquisável pela tool: ${(repo.access.searchUnavailableReason ?? "sem motivo registrado no catálogo").replace(/\.\s*$/, "")}. ` +
                `Zero aqui não quer dizer que a fonte não tem registros; anote a fonte como não alcançada ou busque no site.`,
            );
        }

        // ─── Platform-specific fast paths ────────────────────────

        // BDTD: use VuFind API (proven by ApoenaX/bdtd-scraper)
        if (repo.id === "BR-AGG-0001" || repo.repository.url.includes("bdtd.ibict.br")) {
            try {
                const r = await this.bdtd.searchDetailed(query, opts);
                return { results: r.results, totalNaFonte: r.total, metodo: "BDTD, API do VuFind" };
            } catch (e) {
                falhas.push(`BDTD (API do VuFind): ${(e as Error).message}`);
            }
        }

        // SciELO: use ArticleMeta/Search API
        if (repo.id === "BR-AGG-0002" || repo.repository.url.includes("scielo.br")) {
            try {
                return { results: await this.scielo.search(query, opts), totalNaFonte: null, metodo: "SciELO ArticleMeta" };
            } catch (e) {
                falhas.push(`SciELO ArticleMeta: ${(e as Error).message}`);
            }
        }

        // USP: custom result.php
        if (repo.repository.url.includes("repositorio.usp.br")) {
            try {
                const results = await this.usp.search(query, opts);
                if (results.length > 0) return { results, totalNaFonte: null, metodo: "USP result.php" };
            } catch (e) {
                falhas.push(`USP result.php: ${(e as Error).message}`);
            }
        }

        // Universal API Provider: for repositories with mapping config (Europe PMC, DOAJ, etc)
        if ((repo as any).access?.mapping) {
            try {
                const config = {
                    id: repo.id,
                    baseUrl: (repo.access as any).baseUrl,
                    endpoints: (repo.access as any).endpoints || {},
                    mapping: (repo as any).access.mapping
                };
                const results = await this.universal.search(config, query, opts);
                if (results.results.length > 0) return { results: results.results, totalNaFonte: null, metodo: "API mapeada no catálogo" };
            } catch (e) {
                falhas.push(`API mapeada: ${(e as Error).message}`);
            }
        }

        // ─── Busca do próprio repositório ────────────────────────

        // 1. API REST do DSpace 7 — a mesma que a interface do site consulta.
        if (ehDspace(repo) || repo.access.restApi?.endpoint) {
            const apiUrl = this.rest.resolveApiUrl(baseRest(repo));
            try {
                const items: SearchResult[] = [];
                const vistos = new Set<string>();
                let total = 0;
                const size = Math.max(1, Math.min(maxResults, 100));
                for (let page = 0; items.length < maxResults; page++) {
                    const r = await this.rest.search(baseRest(repo), query, { size, page });
                    total = r.totalElements;
                    const novos = r.items.filter((it) => !vistos.has(it.uuid));
                    for (const it of novos) vistos.add(it.uuid);
                    items.push(...novos.map((item) => this.dspaceItemToSearchResult(item, repo)));
                    if (novos.length === 0 || items.length >= total) break;
                }
                return { results: items.slice(0, maxResults), totalNaFonte: total, metodo: `DSpace REST (${apiUrl})` };
            } catch (e) {
                falhas.push(`DSpace REST (${apiUrl}): ${(e as Error).message}`);
            }
        }

        // 2. Página de busca do site (DSpace 5/6 e outros): endereços do catálogo ou os comuns.
        try {
            const r = await this.scraper.searchDetailed(
                repo.repository.url,
                repo.id,
                repo.repository.name,
                query,
                maxResults,
                repo.access.searchEndpoints,
            );
            return { results: r.results, totalNaFonte: r.total, metodo: `página de busca (${r.endpoint})` };
        } catch (e) {
            falhas.push((e as Error).message);
        }

        throw new Error(`nenhum método de busca funcionou — ${falhas.join(" | ")}`);
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
                    baseRest(repo),
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
        if (ehDspace(repo) || repo.access.restApi?.endpoint) {
            cap.restApiWorks = await this.rest.detect(baseRest(repo));
        } else {
            cap.restApiWorks = false;
        }

        this.capabilities.set(repo.id, cap);
        return cap;
    }

    /**
     * Confere se um registro OAI casa com a string: TODAS as palavras, sem diferença de acento
     * (linha 11, item 5). Antes bastava uma palavra de três, e vinha registro sem relação com a string.
     *
     * Desde a linha 11 nenhuma busca filtra pelo OAI (item 1), então hoje nada chama este método;
     * ficou corrigido como a fila manda.
     */
    private matchesQuery(record: OaiRecord, query: string): boolean {
        const terms = semAcento(query)
            .replace(/['"()]/g, "")
            .split(/\s+(?:and|or)\s+/i)
            .flatMap((t) => t.split(/\s+/))
            .filter((t) => t.length > 2 && !t.startsWith("-") && t !== "and" && t !== "or" && t !== "not");

        const text = semAcento([
            ...record.metadata.title,
            ...record.metadata.description,
            ...record.metadata.subject,
        ].join(" "));

        return terms.length > 0 && terms.every((term) => text.includes(term));
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
            audit: {
                methodology: "CUSTOM" as any,
                searchQueryUsed: "DSPACE_REST_API_QUERY",
                extractionDate: new Date().toISOString(),
                provenanceSource: baseUrl
            }
        };
    }
}
