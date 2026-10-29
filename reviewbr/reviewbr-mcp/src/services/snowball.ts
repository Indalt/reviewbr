
import { SearchResult } from "../types.js";
import { config } from "../config.js";

interface OpenAlexWork {
    id: string;
    doi?: string;
    display_name: string;
    publication_year: number;
    referenced_works: string[];
}

/** DEBT-059 — as 4 salvaguardas que librarian.md:24-27 declara obrigatórias. */
export interface SnowballExpandOptions {
    /** Níveis de expansão. Padrão 1 (só as citações das sementes, sem recursar). */
    depth?: number;
    /** Descritores/termos do protocolo. Um candidato só é aceito se título+descrição
     *  contiver PELO MENOS UM (case-insensitive). Vazio/omitido = filtro não aplicado
     *  (declarado em stats.filter_applied — não fabricamos poda sem critério). */
    filterKeywords?: string[];
    /** Registros já conhecidos do projeto (01_raw/02_deduplicated) para dedup real —
     *  além do dedup intra-lote que 'seen' já fazia. */
    existingDataset?: SearchResult[];
    /** Teto de candidatos aceitos. Padrão 200. Ao atingir, a expansão para e o motivo
     *  entra em stats.stop_reason — "relatório de parada". */
    maxCandidates?: number;
}

export class SnowballService {
    private mailto: string = "vicente@prismaid.com";

    async expandSearch(
        seeds: SearchResult[],
        options: SnowballExpandOptions = {},
    ): Promise<{ newCandidates: SearchResult[]; stats: any }> {
        const depth = Number.isFinite(options.depth) && (options.depth as number) > 0
            ? Math.floor(options.depth as number) : 1;
        const maxCandidates = Number.isFinite(options.maxCandidates) && (options.maxCandidates as number) > 0
            ? Math.floor(options.maxCandidates as number) : 200;
        const filterKeywords = (options.filterKeywords ?? []).map((k) => k.toLowerCase().trim()).filter(Boolean);

        // knownIds = sementes + dataset já existente do projeto: nunca reentra como "novo".
        const knownIds = new Set<string>();
        seeds.forEach((s) => knownIds.add(this.normalizeId(s)));
        (options.existingDataset ?? []).forEach((r) => knownIds.add(this.normalizeId(r)));

        const matchesFilter = (r: SearchResult): boolean => {
            if (filterKeywords.length === 0) return true;
            const haystack = `${r.title ?? ""} ${(r as any).description ?? ""}`.toLowerCase();
            return filterKeywords.some((k) => haystack.includes(k));
        };

        const newCandidates: SearchResult[] = [];
        const perLevel: { level: number; fetched: number; accepted: number }[] = [];
        let alreadyKnown = 0;
        let filteredOutByKeyword = 0;
        let capped = false;

        let currentLevelSeeds = seeds;
        for (let level = 1; level <= depth && !capped && currentLevelSeeds.length > 0; level++) {
            const levelAccepted: SearchResult[] = [];
            let fetchedThisLevel = 0;

            for (const seed of currentLevelSeeds) {
                if (capped) break;
                try {
                    const work = await this.resolveWork(seed);
                    if (!work) continue;

                    // Backward snowballing (referências) NÃO é implementado aqui — segue
                    // como estava (só forward/citações). Fora do escopo do DEBT-059, que é
                    // sobre as 4 salvaguardas de profundidade/filtro/dedup/teto, não sobre
                    // adicionar a direção "para trás".
                    const citations = await this.fetchCitations(work.id);
                    fetchedThisLevel += citations.length;

                    for (const cit of citations) {
                        const id = this.normalizeId(cit);
                        if (knownIds.has(id)) { alreadyKnown++; continue; }
                        knownIds.add(id); // evita reprocessar o mesmo candidato dentro desta expansão

                        if (!matchesFilter(cit)) { filteredOutByKeyword++; continue; }

                        newCandidates.push(cit);
                        levelAccepted.push(cit);
                        if (newCandidates.length >= maxCandidates) { capped = true; break; }
                    }
                } catch (e) {
                    console.error(`Error processing seed ${seed.title}:`, e);
                }
            }

            perLevel.push({ level, fetched: fetchedThisLevel, accepted: levelAccepted.length });
            currentLevelSeeds = levelAccepted;
        }

        const stopReason = capped
            ? `Teto de ${maxCandidates} candidatos atingido — expansão interrompida antes de esgotar a profundidade ${depth}.`
            : perLevel.length < depth
                ? `Expansão esgotou candidatos no nível ${perLevel.length} (nenhum aceito para recursar) antes de atingir a profundidade ${depth}.`
                : `Profundidade ${depth} concluída sem atingir o teto de ${maxCandidates}.`;

        return {
            newCandidates,
            stats: {
                seeds: seeds.length,
                new_found: newCandidates.length,
                depth,
                max_candidates: maxCandidates,
                capped,
                already_known: alreadyKnown,
                filter_applied: filterKeywords.length > 0,
                filter_keywords: filterKeywords,
                filtered_out_by_keyword: filteredOutByKeyword,
                per_level: perLevel,
                stop_reason: stopReason,
            }
        };
    }

    private normalizeId(item: SearchResult | string): string {
        if (typeof item === 'string') return item;
        return item.doi || item.url || item.title;
    }

    private async resolveWork(seed: SearchResult): Promise<OpenAlexWork | null> {
        // Try DOI first
        if (seed.doi) {
            const doi = seed.doi.replace("https://doi.org/", "").replace("http://doi.org/", "");
            const url = `https://api.openalex.org/works/https://doi.org/${doi}?mailto=${this.mailto}`;
            return await this.fetchJson(url);
        }

        // Try Title Search
        if (seed.title) {
            const url = `https://api.openalex.org/works?filter=display_name.search:${encodeURIComponent(seed.title)}&mailto=${this.mailto}`;
            const res = await this.fetchJson(url);
            if (res.results && res.results.length > 0) return res.results[0];
        }

        return null;
    }

    private async fetchCitations(workId: string): Promise<SearchResult[]> {
        const shortId = workId.split("/").pop();
        const url = `https://api.openalex.org/works?filter=cites:${shortId}&mailto=${this.mailto}`;
        const res = await this.fetchJson(url);

        if (!res.results) return [];

        return res.results.map((r: any) => ({
            repositoryId: "openalex",
            repositoryName: "OpenAlex (Snowball)",
            identifier: r.id,
            title: r.display_name,
            creators: r.authorships?.map((a: any) => a.author.display_name) || [],
            date: r.publication_date,
            doi: r.doi,
            type: r.type,
            accessMethod: "api",
            audit: {
                methodology: "CUSTOM" as any,
                searchQueryUsed: `Snowball citations for: ${workId}`,
                extractionDate: new Date().toISOString(),
                provenanceSource: "https://api.openalex.org/works"
            }
        }));
    }

    private delay(ms: number): Promise<void> {
        return new Promise((r) => setTimeout(r, ms));
    }

    async fetchJson(url: string): Promise<any> {
        // Anexa a chave gratuita do OpenAlex (acesso estável) quando configurada.
        let finalUrl = url;
        if (config.openalexApiKey && url.includes("api.openalex.org") && !url.includes("api_key=")) {
            finalUrl += (url.includes("?") ? "&" : "?") + "api_key=" + encodeURIComponent(config.openalexApiKey);
        }
        let lastStatus = 0;
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const res = await fetch(finalUrl);
                if (res.ok) return await res.json();
                lastStatus = res.status;
                // 503 (carga) / 429 (rate-limit) → backoff e nova tentativa
                if (res.status === 503 || res.status === 429) {
                    await this.delay(400 * (attempt + 1));
                    continue;
                }
                break;
            } catch {
                lastStatus = -1;
                await this.delay(400 * (attempt + 1));
            }
        }
        // Falha RUIDOSA (não devolve null silencioso): o chamador reporta a lacuna.
        return { __error: true, status: lastStatus };
    }

    async search(query: string, options: { maxResults?: number, filter?: string } = {}): Promise<{ results: SearchResult[]; totalFound: number; error?: string }> {
        const maxResults = options.maxResults || 200;
        let url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=${Math.min(maxResults, 200)}&mailto=${this.mailto}`;

        if (options.filter) {
            url += `&filter=${options.filter}`;
        }

        const res = await this.fetchJson(url);
        if (res && res.__error) {
            const hint = (res.status === 503 || res.status === 429)
                ? " Busca anônima do OpenAlex está sob rate-limit. Configure OPENALEX_API_KEY (chave grátis em openalex.org/rest-api) no seu ~/.reviewbr/.env ou em reviewbr-mcp/.env."
                : "";
            return { results: [], totalFound: 0, error: `OpenAlex indisponível (HTTP ${res.status}).${hint}` };
        }
        if (!res || !res.results) return { results: [], totalFound: 0 };

        const results = res.results.map((r: any) => ({
            repositoryId: "openalex",
            repositoryName: "OpenAlex",
            identifier: r.id,
            title: r.display_name,
            creators: r.authorships?.map((a: any) => a.author.display_name) || [],
            date: r.publication_date,
            doi: r.doi,
            type: r.type,
            accessMethod: "api",
            audit: {
                methodology: "CUSTOM" as any,
                searchQueryUsed: query,
                extractionDate: new Date().toISOString(),
                provenanceSource: "https://api.openalex.org/works"
            }
        }));

        return {
            results,
            totalFound: res.meta?.count || results.length
        };
    }
}
