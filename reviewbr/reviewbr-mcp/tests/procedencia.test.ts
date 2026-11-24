import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import {
    titulosConferem, titulosDaPagina, titulosDoCsl, linkDoRegistro, conferirProcedencia, registrarFalhasDoRevisor,
    lerFalhas, PROCEDENCIA, PROCEDENCIA_RELATORIO, FALHAS_PROCEDENCIA, type Buscador, type Robots,
} from "../src/services/procedencia.js";

// Linha 13 da FILA (23/11/2026), parte 2: a conferência de procedência dos links, decidida pelo Vicente antes de
// gerar as planilhas dos revisores. Os registros são uma cópia de 11 dos 743 que a camada por palavras do
// roda_aromas_ceara passou (fixtures/roda_aromas_ceara/linha13); a rede é simulada.
const FIX = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "roda_aromas_ceara", "linha13");
const INSUMO: any[] = JSON.parse(fs.readFileSync(path.join(FIX, "passed_keywords.json"), "utf-8"));
const REG = INSUMO.map((x) => x.record);

describe("linha 13 — comparação de títulos (regra declarada)", () => {
    it("iguais sem acento, maiúscula nem pontuação", () => {
        expect(titulosConferem("Cajuína: produção e análise sensorial", "CAJUINA - PRODUCAO E ANALISE SENSORIAL")).toBe(true);
    });
    it("um é o começo do outro, com ao menos 3 palavras", () => {
        expect(titulosConferem("Aguardente de caju (Anacardium occidentale L.)", "Aguardente de caju (Anacardium occidentale L.): produção e análise sensorial")).toBe(true);
        expect(titulosConferem("Avaliação sensorial de bebidas", "Avaliação sensorial de bebidas | Repositório Institucional")).toBe(true);
    });
    it("começo com menos de 3 palavras não basta", () => {
        expect(titulosConferem("Cajuína.", "Cajuína do Piauí: patrimônio cultural")).toBe(false);
        expect(titulosConferem("Cajuína.", "Cajuína")).toBe(true);
    });
    it("entidades e marcação que o DOI registra no título não impedem conferir (achado no teste real, 23/11/2026)", () => {
        expect(titulosConferem("VINHO DE CAJU", "&lt;b&gt;VINHO DE CAJU&lt;/b&gt;")).toBe(true);
        expect(titulosConferem("TÊNUES FIOS DE INTERAÇÃO ENTRE EDUCAÇÃO & LINGUAGEM", "TÊNUES FIOS DE INTERAÇÃO ENTRE EDUCAÇÃO &amp; LINGUAGEM")).toBe(true);
        expect(titulosConferem("Antimicrobial and Antioxidant Activity of Anacardium occidentale L. Flowers",
            "Antimicrobial and Antioxidant Activity of &amp;lt;i&amp;gt;Anacardium occidentale&amp;lt;/i&amp;gt; L. Flowers")).toBe(true);
        expect(titulosConferem("Avaliação sensorial", "Avalia&#231;&#xE3;o sensorial")).toBe(true);
    });
    it("títulos diferentes não conferem; vazio não confere", () => {
        expect(titulosConferem("Perfil sensorial da cajuína", "O Comitê Gestor do IBS")).toBe(false);
        expect(titulosConferem("", "x")).toBe(false);
    });
    it("lê citation_title, DC.title, og:title e <title> da página", () => {
        const html = `<html><head><title>Site | Tese</title><meta name="citation_title" content="Título A">
            <meta name="DC.title" content="Título B"><meta property="og:title" content="Título C"></head></html>`;
        expect(titulosDaPagina(html)).toEqual(["Título A", "Título B", "Título C", "Site | Tese"]);
    });
    it("títulos do CSL-JSON: título, com subtítulo, original e curto", () => {
        expect(titulosDoCsl({ title: "A", subtitle: ["B"], "original-title": "C" })).toEqual(["A", "A: B", "C"]);
    });
    it("o link é o DOI quando há; a página da Scopus fica só como origem", () => {
        const scopus = REG.find((r) => String(r.url).includes("scopus.com"));
        expect(linkDoRegistro(scopus)).toBe(`https://doi.org/${scopus.doi}`);
        const semDoi = REG.find((r) => !r.doi);
        expect(linkDoRegistro(semDoi)).toBe(semDoi.url);
    });
});

describe("linha 13 — conferirProcedencia sobre o insumo do projeto", () => {
    const dirs: string[] = [];
    afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });
    function projeto(insumo: any[] = INSUMO): string {
        const p = fs.mkdtempSync(path.join(os.tmpdir(), "proced-"));
        dirs.push(p);
        fs.mkdirSync(path.join(p, "03_screening"), { recursive: true });
        fs.writeFileSync(path.join(p, "03_screening/passed_keywords.json"), JSON.stringify(insumo));
        return p;
    }
    const ler = (p: string, rel: string) => JSON.parse(fs.readFileSync(path.join(p, rel), "utf-8"));

    // Rede simulada: cada link devolve o título do próprio registro, menos os casos de falha pedidos.
    const tituloPorLink = new Map(REG.map((r) => [linkDoRegistro(r), String(r.title)]));
    const ufrn = REG.find((r) => String(r.url).includes("repositorio.ufrn.br"));
    const doiInexistente = REG.find((r) => r.doi && !String(r.url).includes("scopus"));
    const ebsco = REG.find((r) => String(r.url).includes("ebsco"));
    function rede(opcoes: { doi404?: boolean } = {}): Buscador {
        return async (url, headers) => {
            if (url.startsWith("https://doi.org/")) {
                if (opcoes.doi404 !== false && url === linkDoRegistro(doiInexistente)) return { status: 404, url, contentType: "text/html", body: "" };
                return { status: 200, url, contentType: "application/vnd.citationstyles.csl+json", body: JSON.stringify({ title: tituloPorLink.get(url) }) };
            }
            expect(headers.Accept).toMatch(/text\/html/);
            if (url === ufrn.url) return { status: 200, url, contentType: "text/html", body: `<meta name="citation_title" content="Outro documento qualquer sobre bebidas">` };
            if (url === ebsco.url) return { status: 403, url, contentType: "text/html", body: "" };
            const t = tituloPorLink.get(url);
            return { status: 200, url, contentType: "text/html", body: `<title>${t} | Repositório</title><meta name="citation_title" content="${t}">` };
        };
    }
    const robots: Robots = async (url) => url.includes("sucupira.capes.gov.br")
        ? { permitido: false, motivo: "o robots.txt de sucupira.capes.gov.br proíbe" }
        : { permitido: true, motivo: "permitido" };
    const opc = { robots, intervaloMs: 0, agora: () => "2026-11-23T22:00:00.000Z" };

    it("marca confere, não confere e fora do ar, com o motivo, e grava os três arquivos", async () => {
        const p = projeto();
        const r = await conferirProcedencia(p, { ...opc, buscar: rede() });
        const k = r.relatorio.contagens;
        expect(k.insumo).toBe(REG.length);
        expect(k.conferidos).toBe(REG.length);
        expect(k.nao_confere).toBe(1);
        expect(k.fora_do_ar).toBe(3); // DOI sem registro, HTTP 403, robots.txt
        expect(k.confere).toBe(REG.length - 4);
        const conf = ler(p, PROCEDENCIA) as any[];
        expect(conf.find((c) => c.id === ufrn.identifier)).toMatchObject({ situacao: "não confere", metodo: "página" });
        expect(conf.find((c) => c.id === doiInexistente.identifier)).toMatchObject({ situacao: "fora do ar", metodo: "doi", motivo: expect.stringMatching(/404/) });
        expect(conf.find((c) => c.id === ebsco.identifier)?.motivo).toMatch(/403/);
        expect(conf.find((c) => String(c.link).includes("sucupira"))?.motivo).toMatch(/robots/);
        expect((ler(p, FALHAS_PROCEDENCIA) as any[]).map((f) => f.id).sort()).toEqual(r.falhas.map((f) => f.id).sort());
        expect(r.falhas).toHaveLength(4);
        expect(ler(p, PROCEDENCIA_RELATORIO).regra).toMatch(/3 palavras/);
    });

    it("retomável: a segunda chamada não confere de novo o que já foi conferido", async () => {
        const p = projeto();
        await conferirProcedencia(p, { ...opc, buscar: rede() });
        let chamadas = 0;
        const contando: Buscador = async (u, h) => { chamadas++; return rede()(u, h); };
        const r = await conferirProcedencia(p, { ...opc, buscar: contando });
        expect(chamadas).toBe(0);
        expect(r.relatorio.conferidos_nesta_chamada).toBe(0);
        expect(r.falhas).toHaveLength(4);
    });

    it("depois do conserto, somenteFalhas confere só as falhas e devolve à leitura o que passou a conferir", async () => {
        const p = projeto();
        await conferirProcedencia(p, { ...opc, buscar: rede() });
        const r = await conferirProcedencia(p, { ...opc, buscar: rede({ doi404: false }), somenteFalhas: true });
        expect(r.relatorio.conferidos_nesta_chamada).toBe(4);
        expect(r.relatorio.voltaram_da_manutencao).toEqual([doiInexistente.identifier]);
        expect(lerFalhas(p)).toHaveLength(3);
        const c = (ler(p, PROCEDENCIA) as any[]).find((x) => x.id === doiInexistente.identifier);
        expect(c.situacao).toBe("confere");
        expect(c.historico[0].situacao).toBe("fora do ar");
    });

    it("falha marcada por revisor só sai com o conserto declarado pela manutenção", async () => {
        const p = projeto();
        await conferirProcedencia(p, { ...opc, buscar: rede() });
        const alvo = REG.find((r) => String(r.url).includes("repositorio.ufpi.br"));
        registrarFalhasDoRevisor(p, [{ id: alvo.identifier, titulo: alvo.title, link: alvo.url, situacao: "não abriu (revisor)", motivo: "marcado na planilha", origem: "revisor estagiario", quando: "x" }]);
        expect(lerFalhas(p)).toHaveLength(5);
        await conferirProcedencia(p, { ...opc, buscar: rede(), somenteFalhas: true });
        expect(lerFalhas(p).some((f) => f.id === alvo.identifier)).toBe(true);
        const r = await conferirProcedencia(p, { ...opc, buscar: rede(), somenteFalhas: true, consertadas: { [alvo.identifier]: "endereço do repositório corrigido no catálogo" } });
        expect(lerFalhas(p).some((f) => f.id === alvo.identifier)).toBe(false);
        expect(r.relatorio.consertos_declarados).toEqual({ [alvo.identifier]: "endereço do repositório corrigido no catálogo" });
    });

    it("recusa insumo com identificador repetido, sem gravar", async () => {
        const p = projeto([INSUMO[0], INSUMO[0]]);
        await expect(conferirProcedencia(p, { ...opc, buscar: rede() })).rejects.toThrow(/repetido/);
        expect(fs.existsSync(path.join(p, PROCEDENCIA))).toBe(false);
    });
});
