import { describe, it, expect, vi, afterEach } from "vitest";
import { lerGrupos, decidir, robotsPermite, limparCacheRobots } from "../src/utils/robots.js";
import { HtmlScraper } from "../src/access/html-scraper.js";
import { AccessStrategy } from "../src/access/strategy.js";

/** Conferência de 19/11/2026 e decisão do Vicente no mesmo dia: o ReviewBR não busca por robô onde o
 *  robots.txt proíbe; o repositório que não se alcança diretamente é buscado na plataforma de ciência
 *  aberta que o agrega, declarando onde o registro foi visto. Sem chamada de rede. */

const ROBOTS_DSPACE = "User-agent: *\nDisallow: /discover \nDisallow: /simple-search\n\nUser-agent: WebCopier\nDisallow: /\n";

describe("robots.txt", () => {
    afterEach(() => { vi.unstubAllGlobals(); limparCacheRobots(); });

    it("grupo *, prefixo, regra mais longa e Allow", () => {
        const r = lerGrupos(ROBOTS_DSPACE);
        expect(decidir(r, "/simple-search?query=caju").permitido).toBe(false);
        expect(decidir(r, "/handle/123").permitido).toBe(true);
        expect(decidir(r, "/oai/request?verb=Identify").permitido).toBe(true);
        const r2 = lerGrupos("User-agent: *\nDisallow: /search\nAllow: /search/api\n");
        expect(decidir(r2, "/search/api/x").permitido).toBe(true);
        expect(decidir(lerGrupos("User-agent: *\nDisallow: /*.pdf$\n"), "/a/b.pdf").permitido).toBe(false);
    });

    it("grupo próprio do ReviewBR vence o *", () => {
        const r = lerGrupos("User-agent: *\nDisallow: /\n\nUser-agent: ReviewBR\nAllow: /\n");
        expect(decidir(r, "/simple-search").permitido).toBe(true);
    });

    it("404 libera; 5xx ou rede proíbe (RFC 9309)", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 404 })));
        expect((await robotsPermite("https://a.invalid/simple-search")).permitido).toBe(true);
        limparCacheRobots();
        vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 503 })));
        expect((await robotsPermite("https://b.invalid/x")).permitido).toBe(false);
    });

    it("a página de busca proibida não é pedida, e a falha diz o motivo", async () => {
        const pedidos: string[] = [];
        vi.stubGlobal("fetch", vi.fn(async (url: string) => {
            pedidos.push(String(url));
            if (String(url).endsWith("/robots.txt")) return new Response(ROBOTS_DSPACE);
            return new Response("<html>busca</html>");
        }));
        await expect(new HtmlScraper().searchDetailed("https://repo.invalid/", "X", "X", "cajuína", 10))
            .rejects.toThrow(/robots\.txt de repo\.invalid proíbe \(Disallow: \/simple-search\)/);
        expect(pedidos.some((p) => p.startsWith("https://repo.invalid/simple-search"))).toBe(false);
    });
});

describe("repositório alcançado pela plataforma que o agrega", () => {
    const repo = (via: boolean): any => ({
        id: "BR-EST-0006",
        institution: { name: "Universidade Estadual do Ceará", acronym: "UECE", type: "estadual", state: "CE", city: "Fortaleza" },
        repository: { name: "Repositório Institucional da UECE", url: "https://siduece.uece.br/siduece/", platform: "SIDUECE", contentType: "Misto" },
        access: {
            oaiPmh: { available: false, verified: false }, searchEndpoints: [], searchable: false,
            searchUnavailableReason: "formulário com estado de sessão; HTTP 403.",
            ...(via ? { viaAgregador: { id: "BR-AGG-0006", plataforma: "Oasisbr (IBICT)", filtro: 'network_acronym_str:"UECE-0"' } } : {}),
        },
        status: "active", layer: "2",
    });

    it("declara onde viu cada registro e de onde vem o total", async () => {
        const s = new AccessStrategy();
        const busca = vi.fn(async () => ({
            total: 3,
            results: [{ repositoryId: "BR-AGG-0001", repositoryName: "Oasisbr (IBICT)", identifier: "UECE-0_1", title: "Cajuína", creators: [], description: "", date: "", type: "", url: "https://siduece.uece.br/siduece/trabalhoAcademicoPublico.jsf?id=96019", accessMethod: "bdtd-vufind", audit: { methodology: "CUSTOM", searchQueryUsed: "q", extractionDate: "", provenanceSource: "x" } }],
        }));
        (s as any).oasisbr.searchDetailed = busca;
        const r = await s.searchDetailed(repo(true), "cajuína");
        expect((busca.mock.calls[0] as any)[2]).toEqual(['network_acronym_str:"UECE-0"']);
        expect(r.totalNaFonte).toBe(3);
        expect(r.metodo).toMatch(/Oasisbr \(IBICT\).*total da plataforma, não do site do repositório/);
        expect(r.results[0]!.repositoryId).toBe("BR-EST-0006");
        expect(r.results[0]!.repositoryName).toBe('Repositório Institucional da UECE (visto na Oasisbr (IBICT), filtro network_acronym_str:"UECE-0")');
        expect(r.results[0]!.accessMethod).toBe("oasisbr-vufind");
    });

    it("sem agregador no catálogo, segue o erro com o motivo", async () => {
        await expect(new AccessStrategy().searchDetailed(repo(false), "cajuína")).rejects.toThrow(/não pesquisável pela tool/);
    });
});
