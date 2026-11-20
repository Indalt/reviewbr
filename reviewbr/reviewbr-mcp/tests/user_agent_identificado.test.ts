import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "fs";
import { fetchWithRetry, REVIEWBR_USER_AGENT } from "../src/utils/http.js";

/** Conferência jurídica e ética de 19/11/2026 (.claude/maintenance/CONFERENCIA_acesso_2026-11-19.md):
 *  o cliente HTTP da camada de acesso se identifica como ReviewBR e não sorteia User-Agent de
 *  navegador. Antes: Chrome em Windows, Linux ou Mac. */
describe("User-Agent identificado", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("fetchWithRetry envia o User-Agent do ReviewBR", async () => {
        const f = vi.fn(async () => new Response("ok"));
        vi.stubGlobal("fetch", f);
        await fetchWithRetry("https://exemplo.invalid/", { maxRetries: 1 });
        const headers = (f.mock.calls[0] as any)[1].headers;
        expect(headers["User-Agent"]).toBe(REVIEWBR_USER_AGENT);
        expect(headers["User-Agent"]).toMatch(/^ReviewBR-MCP\//);
    });

    it("nenhum módulo da camada de acesso nem o healer usa User-Agent de navegador", () => {
        for (const f of ["src/utils/http.ts", "src/services/repository_healer.ts"]) {
            expect(fs.readFileSync(f, "utf-8")).not.toMatch(/Mozilla\/5\.0/);
        }
    });
});
