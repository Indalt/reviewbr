import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { fetchWithRetry, fetchText } from "../src/utils/http.js";
import { AccessStrategy } from "../src/access/strategy.js";
import { rateLimiter } from "../src/utils/rate-limiter.js";
import { AgentOrchestrator, AgentRole } from "../src/registry/agent_orchestrator.js";
import { buscarEmRepositorios } from "../src/services/busca_repositorios.js";
import type { RepositoryEntry } from "../src/types.js";

// Linha 26 da FILA (28/11/2026): ressalvas das tools, grupo 1 — rede e repositórios
// (ponto 8 da lista levada ao Vicente em 26/11/2026). Cada teste falha antes do conserto.

const MCP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = path.resolve(MCP, "..", "..");

afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
});

describe("item 1 — certificado: a exceção vale só para o pedido, não para o processo", () => {
    it("acceptSelfSigned não desliga a verificação do processo inteiro, nem durante nem depois do pedido", async () => {
        let duranteOPedido: string | undefined = "não chamado";
        vi.stubGlobal("fetch", vi.fn(async () => {
            duranteOPedido = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
            return new Response("ok");
        }));
        await fetchWithRetry("https://exemplo.invalid/", { maxRetries: 1, acceptSelfSigned: true });
        expect(duranteOPedido).toBeUndefined();
        expect(process.env.NODE_TLS_REJECT_UNAUTHORIZED).toBeUndefined();
    });

    it("o pedido que aceita certificado próprio leva um dispatcher só dele; o que não aceita, não", async () => {
        const f = vi.fn(async () => new Response("ok"));
        vi.stubGlobal("fetch", f);
        await fetchWithRetry("https://a.invalid/", { maxRetries: 1, acceptSelfSigned: true });
        await fetchWithRetry("https://b.invalid/", { maxRetries: 1, acceptSelfSigned: false });
        expect((f.mock.calls[0] as any)[1].dispatcher).toBeDefined();
        expect((f.mock.calls[1] as any)[1].dispatcher).toBeUndefined();
    });

    it("nenhum módulo do servidor mexe em NODE_TLS_REJECT_UNAUTHORIZED", () => {
        const arquivos: string[] = [];
        const varrer = (d: string) => {
            for (const e of fs.readdirSync(d, { withFileTypes: true })) {
                const p = path.join(d, e.name);
                if (e.isDirectory()) varrer(p);
                else if (p.endsWith(".ts")) arquivos.push(p);
            }
        };
        varrer(path.join(MCP, "src"));
        expect(arquivos.length).toBeGreaterThan(20); // controle positivo da varredura
        expect(arquivos.filter((a) => /process\.env\.NODE_TLS_REJECT_UNAUTHORIZED\s*=/.test(fs.readFileSync(a, "utf-8")))).toEqual([]);
    });
});

describe("item 3 — HTTP 503 no meio da busca grande ganha nova tentativa", () => {
    it("503 e depois 200: fetchText devolve o corpo em vez de derrubar a execução", async () => {
        let n = 0;
        vi.stubGlobal("fetch", vi.fn(async () => (++n === 1 ? new Response("ocupado", { status: 503 }) : new Response("corpo"))));
        await expect(fetchText("https://exemplo.invalid/", { maxRetries: 2 })).resolves.toBe("corpo");
        expect(n).toBe(2);
    });

    it("404 não se repete: erro da fonte não é sobrecarga", async () => {
        let n = 0;
        vi.stubGlobal("fetch", vi.fn(async () => { n++; return new Response("x", { status: 404 }); }));
        await expect(fetchText("https://exemplo.invalid/", { maxRetries: 3 })).rejects.toThrow(/HTTP 404/);
        expect(n).toBe(1);
    });

    it("503 até o fim das tentativas: o erro diz o status", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => new Response("x", { status: 503 })));
        await expect(fetchText("https://exemplo.invalid/", { maxRetries: 2 })).rejects.toThrow(/HTTP 503/);
    });
});

function repoDspace(): RepositoryEntry {
    return {
        id: "BR-TST-0026",
        institution: { name: "Teste", acronym: "TST", type: "federal", state: "CE", city: "Fortaleza" },
        repository: { name: "Repositório de teste", url: "https://dspace.teste.br/", platform: "DSpace", contentType: "Misto" },
        access: { oaiPmh: { available: false, endpoint: "", verified: false, lastVerified: "2026-11-28" }, searchEndpoints: [], searchable: true },
        status: "active",
    } as unknown as RepositoryEntry;
}

describe("item 4 — DSpace sem API REST no catálogo: uma sondagem curta antes da página de busca", () => {
    it("API que não responde: um só pedido a /server/api, sem as novas tentativas da busca, e segue para a página", async () => {
        rateLimiter.setRate("dspace.teste.br", 1000);
        const pedidosApi: string[] = [];
        vi.stubGlobal("fetch", vi.fn(async (input: string | URL) => {
            const u = new URL(String(input));
            if (u.pathname === "/robots.txt") return new Response("", { status: 404 });
            if (u.pathname.startsWith("/server/api")) {
                pedidosApi.push(u.pathname);
                throw new Error("ECONNRESET");
            }
            return new Response("<html><body>Nenhum resultado</body></html>");
        }));
        const s = new AccessStrategy();
        await s.searchDetailed(repoDspace(), "cajuína", { maxResults: 10 }).catch(() => undefined);
        expect(pedidosApi).toEqual(["/server/api"]);
    }, 20_000);

    it("controle positivo: API que responde segue buscando pela API REST", async () => {
        rateLimiter.setRate("dspace.teste.br", 1000);
        vi.stubGlobal("fetch", vi.fn(async (input: string | URL) => {
            const u = new URL(String(input));
            if (u.pathname === "/robots.txt") return new Response("", { status: 404 });
            if (u.pathname === "/server/api") return new Response(JSON.stringify({ _links: {} }));
            if (u.pathname === "/server/api/discover/search/objects") {
                return new Response(JSON.stringify({ _embedded: { searchResult: { _embedded: { objects: [] }, page: { totalElements: 0 } } } }));
            }
            return new Response("", { status: 404 });
        }));
        const r = await new AccessStrategy().searchDetailed(repoDspace(), "cajuína", { maxResults: 10 });
        expect(r.metodo).toMatch(/DSpace REST/);
    });
});

describe("item 2 — search_repository sem `repositories`: os repositórios em paralelo, não um atrás do outro", () => {
    it("10 repositórios de 200 ms cada terminam bem antes dos 2 s da fila em série, na ordem do catálogo", async () => {
        const ids = Array.from({ length: 10 }, (_, i) => `R${i}`);
        const t0 = Date.now();
        const r = await buscarEmRepositorios(ids, async (id) => {
            await new Promise((ok) => setTimeout(ok, 200));
            if (id === "R3") throw new Error("falhou");
            return id;
        });
        expect(Date.now() - t0).toBeLessThan(1000);
        expect(r.map((x) => x.item)).toEqual(ids);
        expect(r[3]).toMatchObject({ erro: "falhou" });
        expect(r[0]).toMatchObject({ valor: "R0" });
    });

    it("a tool usa a busca em paralelo", () => {
        const index = fs.readFileSync(path.join(MCP, "src", "index.ts"), "utf-8");
        const corpo = index.slice(index.indexOf('"search_repository",'), index.indexOf('"get_record_metadata",'));
        expect(corpo).toMatch(/buscarEmRepositorios\(/);
    });
});

describe("item 6 — heal_repositories muda o catálogo do sistema: é da manutenção, não do projeto", () => {
    it("só o MAINTAINER a tem no mapa de papéis", () => {
        expect(() => AgentOrchestrator.validateToolAccess(AgentRole.MAINTAINER, "heal_repositories")).not.toThrow();
        expect(() => AgentOrchestrator.validateToolAccess(AgentRole.COORDINATOR, "heal_repositories")).toThrow(/ACCESS DENIED/);
    });

    it("está na lista de tools do maintainer.md e em nenhuma skill de etapa", () => {
        const maint = fs.readFileSync(path.join(REPO, ".claude", "agents", "maintainer.md"), "utf-8");
        expect(maint.split("\n").find((l) => l.startsWith("tools:"))).toMatch(/mcp__reviewbr__heal_repositories/);
        for (const s of ["prisma-s-logging", "protocol-design", "conduct-review"]) {
            const t = fs.readFileSync(path.join(REPO, ".claude", "skills", s, "SKILL.md"), "utf-8");
            expect(t, s).not.toMatch(/heal_repositories/);
        }
    });
});
