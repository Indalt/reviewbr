/**
 * DSpace REST API client — secondary access layer.
 * Supports DSpace 7 REST API for search and item retrieval.
 */

import { fetchText } from "../utils/http.js";
import { rateLimiter } from "../utils/rate-limiter.js";
import type { DSpaceSearchResult, DSpaceItem, Bitstream } from "../types.js";

export class DSpaceRestClient {
    /**
     * Detect if a DSpace 7 REST API is available at the given base URL.
     */
    async detect(baseUrl: string): Promise<boolean> {
        try {
            const apiUrl = this.resolveApiUrl(baseUrl);
            await rateLimiter.acquire(apiUrl);
            const text = await fetchText(apiUrl, { timeout: 10_000, maxRetries: 1 });
            const data = JSON.parse(text);
            return data?._links !== undefined;
        } catch {
            return false;
        }
    }

    /**
     * Search for items in a DSpace 7 repository.
     */
    async search(
        baseUrl: string,
        query: string,
        opts?: { scope?: string; page?: number; size?: number; sort?: string }
    ): Promise<DSpaceSearchResult> {
        const apiUrl = this.resolveApiUrl(baseUrl);
        const searchUrl = new URL(`${apiUrl}/discover/search/objects`);
        searchUrl.searchParams.set("query", query);
        searchUrl.searchParams.set("dsoType", "ITEM");
        searchUrl.searchParams.set("page", String(opts?.page ?? 0));
        searchUrl.searchParams.set("size", String(opts?.size ?? 20));
        if (opts?.scope) searchUrl.searchParams.set("scope", opts.scope);
        if (opts?.sort) searchUrl.searchParams.set("sort", opts.sort);

        await rateLimiter.acquire(searchUrl.toString());
        const text = await fetchText(searchUrl.toString(), {
            timeout: 30_000,
            headers: { Accept: "application/json" },
        });

        const data = JSON.parse(text);
        const embedded = data?._embedded?.searchResult?._embedded?.objects ?? [];

        const items: DSpaceItem[] = embedded.map((obj: Record<string, unknown>) => {
            const indexObj = obj._embedded as Record<string, unknown> | undefined;
            const item = indexObj?.indexableObject as Record<string, unknown> | undefined;
            if (!item) return null;

            return {
                uuid: item.uuid as string,
                name: item.name as string,
                handle: item.handle as string,
                metadata: item.metadata as Record<string, unknown[]>,
                type: (item.type as string) ?? "item",
            };
        }).filter(Boolean) as DSpaceItem[];

        return {
            totalElements: data?.page?.totalElements ?? items.length,
            page: data?.page ?? { size: 20, totalElements: items.length, totalPages: 1, number: 0 },
            items,
        };
    }

    /**
     * Get a single item by UUID.
     */
    async getItem(baseUrl: string, uuid: string): Promise<DSpaceItem> {
        const apiUrl = this.resolveApiUrl(baseUrl);
        const url = `${apiUrl}/core/items/${uuid}`;

        await rateLimiter.acquire(url);
        const text = await fetchText(url, {
            timeout: 15_000,
            headers: { Accept: "application/json" },
        });

        return JSON.parse(text) as DSpaceItem;
    }

    /**
     * Get bitstreams (files) for an item.
     */
    async getBitstreams(baseUrl: string, itemUuid: string): Promise<Bitstream[]> {
        const apiUrl = this.resolveApiUrl(baseUrl);
        const url = `${apiUrl}/core/items/${itemUuid}/bitstreams`;

        await rateLimiter.acquire(url);
        const text = await fetchText(url, {
            timeout: 15_000,
            headers: { Accept: "application/json" },
        });

        const data = JSON.parse(text);
        const embedded = data?._embedded?.bitstreams ?? [];

        return embedded.map((b: Record<string, unknown>) => ({
            uuid: b.uuid as string,
            name: b.name as string,
            sizeBytes: (b.sizeBytes as number) ?? 0,
            mimeType: ((b as Record<string, Record<string, string>>)._format?.mimetype) ?? "application/octet-stream",
            retrieveLink: `${apiUrl}/core/bitstreams/${b.uuid}/content`,
        }));
    }

    /**
     * Resolve the REST API base URL from a repository base URL.
     * DSpace 7 typically serves REST at /server/api
     */
    private resolveApiUrl(baseUrl: string): string {
        const clean = baseUrl.replace(/\/+$/, "");
        if (clean.endsWith("/server/api")) return clean;
        if (clean.endsWith("/server")) return `${clean}/api`;
        return `${clean}/server/api`;
    }
}
