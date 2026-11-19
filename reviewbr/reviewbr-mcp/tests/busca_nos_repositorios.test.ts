import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { AccessStrategy } from "../src/access/strategy.js";
import { rateLimiter } from "../src/utils/rate-limiter.js";
import type { RepositoryEntry } from "../src/types.js";

// Linha 11 da FILA (I — busca nos repositórios), decidida pelo Vicente em 19/11/2026.
// Reprodução no commit 93c7997: para "caju" e "cajuína", UECE, Alice, IFCE, UFPI e Infoteca-e davam
// zero sem aviso, e a BDTD devolvia registros dessas mesmas instituições. A suíte passava porque não
// consulta as fontes reais; aqui o fetch é simulado com a forma das respostas lidas em 19/11/2026.

const MCP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INDEX = fs.readFileSync(path.join(MCP, "src", "index.ts"), "utf-8").replace(/\r\n/g, "\n");
const CATALOGO: RepositoryEntry[] = JSON.parse(
    fs.readFileSync(path.join(MCP, "data", "sources", "repositories_catalog.json"), "utf-8"),
);

type Rota = (url: URL) => { status?: number; body: string } | undefined;
let chamadas: string[] = [];

function simularFetch(rota: Rota) {
    chamadas = [];
    vi.stubGlobal("fetch", async (input: string | URL) => {
        const u = new URL(String(input));
        chamadas.push(u.toString());
        rateLimiter.setRate(u.hostname, 1000);
        const r = rota(u) ?? { status: 404, body: "<html>404</html>" };
        return new Response(r.body, { status: r.status ?? 200 });
    });
}

for (const h of ["repo.teste.br", "bdtd.ibict.br", "outro.teste.br"]) rateLimiter.setRate(h, 1000);

function repo(parcial: { platform?: string; url?: string; access?: Record<string, unknown>; id?: string }): RepositoryEntry {
    return {
        id: parcial.id ?? "BR-TST-0001",
        institution: { name: "Teste", acronym: "TST", type: "federal", state: "CE", city: "Fortaleza" },
        repository: { name: "Repositório de teste", url: parcial.url ?? "https://repo.teste.br/", platform: parcial.platform ?? "DSpace", contentType: "Misto" },
        access: {
            oaiPmh: { available: true, endpoint: "https://repo.teste.br/oai/request", verified: true },
            searchEndpoints: [],
            ...(parcial.access ?? {}),
        },
        status: "active",
    } as RepositoryEntry;
}

const OAI_IDENTIFY = `<?xml version="1.0"?><OAI-PMH><Identify><repositoryName>Teste</repositoryName><baseURL>x</baseURL><protocolVersion>2.0</protocolVersion><earliestDatestamp>2000</earliestDatestamp><deletedRecord>no</deletedRecord><granularity>YYYY</granularity></Identify></OAI-PMH>`;
const OAI_LISTA = `<?xml version="1.0"?><OAI-PMH><ListRecords><record><header><identifier>oai:x:1</identifier><datestamp>2011</datestamp></header><metadata><oai_dc:dc xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Perfil sensorial do arroz</dc:title><dc:description>arroz</dc:description></oai_dc:dc></metadata></record></ListRecords></OAI-PMH>`;

function respostaRest(total: number, titulos: string[]) {
    return JSON.stringify({
        _embedded: { searchResult: {
            page: { size: 20, totalElements: total, totalPages: 1, number: 0 },
            _embedded: { objects: titulos.map((t, i) => ({ _embedded: { indexableObject: {
                uuid: `uuid-${i}`, name: t, handle: `123/${i}`, type: "item",
                metadata: {
                    "dc.title": [{ value: t }],
                    "dc.description.abstract": [{ value: `resumo de ${t}` }],
                    "dc.date.issued": [{ value: "2020" }],
                },
            } } })) },
        } },
    });
}

beforeEach(() => { chamadas = []; });
afterEach(() => { vi.unstubAllGlobals(); });

describe("linha 11, itens 1 e 2 — a busca usa a interface do repositório, não a colheita OAI", () => {
    it("DSpace 7 com 'DSpace' no catálogo: busca pela API REST e traz o total da fonte; não colhe pelo OAI", async () => {
        simularFetch((u) => {
            if (u.pathname === "/server/api") return { body: JSON.stringify({ _links: {} }) };
            if (u.pathname === "/server/api/discover/search/objects") return { body: respostaRest(41, ["Cajuína: processo", "Cajuína e saúde"]) };
            if (u.pathname.endsWith("/oai/request") && u.searchParams.get("verb") === "Identify") return { body: OAI_IDENTIFY };
            if (u.pathname.endsWith("/oai/request")) return { body: OAI_LISTA };
        });
        const r = await new AccessStrategy().searchDetailed(repo({ platform: "DSpace" }), "cajuína", { maxResults: 2 });
        expect(r.results.map((x) => x.accessMethod)).toEqual(["dspace-rest", "dspace-rest"]);
        expect(r.totalNaFonte).toBe(41);
        expect(r.results[0]!.description).toBe("resumo de Cajuína: processo");
        expect(chamadas.some((c) => c.includes("verb=ListRecords"))).toBe(false);
    });

    it("API REST num caminho próprio (como a UFPI, /srv-ufpi-s01/api) vem do catálogo", async () => {
        simularFetch((u) => {
            if (u.pathname === "/srv-x/api/discover/search/objects") return { body: respostaRest(1, ["Cajuína"]) };
        });
        const r = await new AccessStrategy().searchDetailed(
            repo({ access: { oaiPmh: { available: false, verified: false }, restApi: { available: true, endpoint: "https://repo.teste.br/srv-x/api" } } }),
            "cajuína", { maxResults: 5 },
        );
        expect(r.totalNaFonte).toBe(1);
        expect(r.results).toHaveLength(1);
    });
});

describe("linha 11, item 4 e DECLARAR — zero só quando a fonte disse zero", () => {
    it("repositório marcado como não pesquisável: a tool diz por quê, em vez de lista vazia", async () => {
        simularFetch(() => undefined);
        const r = repo({ access: { oaiPmh: { available: true, endpoint: "https://repo.teste.br/oai/request", verified: true }, searchable: false, searchUnavailableReason: "o site recusa busca automatizada (HTTP 403)" } });
        await expect(new AccessStrategy().search(r, "cajuína")).rejects.toThrow(/não pesquisável.*HTTP 403/);
        expect(chamadas).toHaveLength(0);
    });

    it("nenhum método funcionou: erro com o que falhou em cada um", async () => {
        simularFetch(() => ({ status: 403, body: "Forbidden" }));
        await expect(new AccessStrategy().search(repo({}), "cajuína")).rejects.toThrow(/nenhum método de busca funcionou.*403/s);
    });

    it("página de busca do DSpace sem resultado: zero declarado pela fonte, sem erro", async () => {
        simularFetch((u) => {
            if (u.pathname === "/simple-search") return { body: `<html><div class="discovery-search-filters panel-body">filtros</div></html>` };
        });
        const r = await new AccessStrategy().searchDetailed(repo({ platform: "dspace-jspui" }), "xyzqwerty");
        expect(r.results).toEqual([]);
        expect(r.totalNaFonte).toBe(0);
    });

    it("validate_repository só marca a busca com ✅ quando há resultado", () => {
        const i = INDEX.indexOf('"validate_repository"');
        const corpo = INDEX.slice(i, INDEX.indexOf("server.tool(", i + 10));
        expect(corpo).not.toMatch(/✅ Busca: \$\{[^}]*"sem resultados"/);
        expect(corpo).toMatch(/results\.length > 0\s*\n?\s*\?\s*`✅ Busca/);
    });
});

describe("linha 11, item 5 — matchesQuery exige todas as palavras, sem diferença de acento", () => {
    const rec = (titulo: string) => ({ identifier: "x", datestamp: "", sets: [], metadata: {
        title: [titulo], description: [], subject: [], creator: [], date: [], type: [], format: [], identifier: [],
        language: [], rights: [], publisher: [], source: [], relation: [], coverage: [], contributor: [] } });
    const casa = (titulo: string, q: string) => (new AccessStrategy() as any).matchesQuery(rec(titulo), q);
    it("uma palavra só não basta", () => {
        expect(casa("Perfil sensorial do arroz", "perfil sensorial caju")).toBe(false);
        expect(casa("Perfil sensorial do caju", "perfil sensorial caju")).toBe(true);
    });
    it("acento não separa", () => {
        expect(casa("Produção de Cajuína", "cajuina")).toBe(true);
        expect(casa("Producao de cajuina", "cajuína")).toBe(true);
    });
});

describe("linha 11, item 6 — resumo nos resultados", () => {
    it("html-scraper: lê o total da página e o resumo da página do registro", async () => {
        const lista = `<html><div class="alert alert-info">Resultado 1-2 de 2.</div><table>
<tr><td headers="t1">2022</td><td headers="t2"><a href="/handle/riufc/1">Cajuína e kombucha</a></td><td headers="t3"><em><a href="/browse?type=author">Freitas, A.</a></em></td></tr>
<tr><td headers="t1">2025</td><td headers="t2"><a href="/handle/riufc/2">Cinco doses de cajuína</a></td><td headers="t3"><em><a href="/browse?type=author">Oliveira, J.</a></em></td></tr>
</table></html>`;
        const item = (n: string) => `<html><meta name="DC.title" content="t${n}"/><meta name="DCTERMS.abstract" content="resumo ${n}"/><meta name="DCTERMS.issued" content="202${n}"/></html>`;
        simularFetch((u) => {
            if (u.pathname === "/simple-search") return { body: lista };
            if (u.pathname.startsWith("/handle/riufc/")) return { body: item(u.pathname.slice(-1)) };
        });
        const r = await new AccessStrategy().searchDetailed(repo({ platform: "dspace-jspui", access: { oaiPmh: { available: false, verified: false }, searchEndpoints: ["https://repo.teste.br/simple-search"] } }), "cajuína");
        expect(r.totalNaFonte).toBe(2);
        expect(r.results.map((x) => x.description)).toEqual(["resumo 1", "resumo 2"]);
        expect(r.results.map((x) => x.creators)).toEqual([["Freitas, A."], ["Oliveira, J."]]);
        expect(r.results[0]!.date).toBe("2022");
    });

    it("BDTD: pede resumo e data à API do VuFind e os grava", async () => {
        let pedido: URL | undefined;
        simularFetch((u) => {
            if (u.pathname === "/vufind/api/v1/search") {
                pedido = u;
                return { body: JSON.stringify({ resultCount: 25, status: "OK", records: [
                    { id: "UFRN_913b", title: "Obtenção da cajuína", summary: ["A cajuína é uma bebida"], publicationDates: ["2017"], institutions: ["UFRN"], authors: { primary: { "Silva, A.": [] } } },
                ] }) };
            }
        });
        const r = await new AccessStrategy().searchDetailed(repo({ id: "BR-AGG-0001", url: "https://bdtd.ibict.br/vufind/" }), "cajuína", { maxResults: 5 });
        expect(pedido!.searchParams.getAll("field[]")).toEqual(expect.arrayContaining(["summary", "publicationDates"]));
        expect(r.results[0]!.description).toBe("A cajuína é uma bebida");
        expect(r.results[0]!.date).toBe("2017");
        expect(r.totalNaFonte).toBe(25);
    });
});

describe("linha 11, item 7 — URL da BDTD sem espaço", () => {
    it("registro sem URL de origem aponta para a página do registro na BDTD", async () => {
        simularFetch((u) => {
            if (u.pathname === "/vufind/api/v1/search") return { body: JSON.stringify({ resultCount: 1, status: "OK", records: [{ id: "USP_88fc", title: "t" }] }) };
        });
        const r = await new AccessStrategy().search(repo({ id: "BR-AGG-0001", url: "https://bdtd.ibict.br/vufind/" }), "x");
        expect(r[0]!.url).toBe("https://bdtd.ibict.br/vufind/Record/USP_88fc");
    });
    it("getRecord monta a URL da API sem espaço", () => {
        const src = fs.readFileSync(path.join(MCP, "src", "access", "platform-adapters.ts"), "utf-8");
        expect(src).not.toMatch(/\$\{this\.baseUrl\} \//);
        expect(src).not.toMatch(/vufind \/|\/api\/v1 \//);
    });
});

describe("linha 11, itens 3, 8 e 9 e DECLARAR — o catálogo diz o que a tool consegue buscar", () => {
    const porId = (id: string) => CATALOGO.find((r) => r.id === id) as any;
    it("UECE: sistema próprio (SIDUECE), não DSpace, e não pesquisável pela tool", () => {
        const u = porId("BR-EST-0006");
        expect(u.repository.platform.toLowerCase()).not.toBe("dspace");
        expect(u.repository.url).toContain("/siduece");
        expect(u.access.searchable).toBe(false);
        expect(u.access.searchUnavailableReason).toBeTruthy();
    });
    it("Alice e Infoteca-e: endereço de busca certo e marcadas como não pesquisáveis, com o motivo", () => {
        for (const [id, trecho] of [["BR-RES-0001", "/alice/"], ["BR-RES-0004", "/infoteca/"]] as const) {
            const r = porId(id);
            expect(r.access.searchEndpoints.join(" ")).toContain(trecho);
            expect(r.access.searchable).toBe(false);
            expect(r.access.searchUnavailableReason).toMatch(/403/);
        }
    });
    it("Infoteca-e: o controle positivo não passou, segue inativa, agora com o motivo", () => {
        expect(porId("BR-RES-0004").status).toBe("inactive");
    });
    it("UFPI e IFCE: a API REST do DSpace no endereço que responde", () => {
        expect(porId("BR-FED-0014").access.restApi.endpoint).toBe("https://repositorio.ufpi.br/srv-ufpi-s01/api");
        expect(porId("BR-FED-0027").access.restApi.endpoint).toBe("https://repositorio.ifce.edu.br/server/api");
    });
});
