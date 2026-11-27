import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import {
    verificarReferencias, verificarReferencia, atualizacoesDe, doisDoTexto, TIPOS_DE_ATUALIZACAO,
} from "../src/services/referencias.js";
import { titulosConferem, type Buscador, type Robots } from "../src/services/procedencia.js";

// Linha 19 da FILA (pedido do Vicente de 25/11/2026, ponto 4, aprovado em 26/11/2026): fonte inventada e
// retratação, desde a busca exploratória. As respostas do Crossref abaixo copiam a forma do que a API devolveu em
// 27/11/2026 para 10.1177/1758835919874651 (retratada; aviso 10.1177/17588359211061903, do editor e da Retraction
// Watch) e para 10.1371/journal.pone.0100716 (aviso de "expression-of-concern", com hífen). A rede é simulada.

const RETRATADO = "10.1177/1758835919874651";
const TITULO_RETRATADO = "Downregulation of long noncoding RNA LINC01419 inhibits cell migration, invasion, and tumor growth";
const UPDATED_BY = [
    { DOI: "10.1177/17588359211061903", type: "retraction", label: "Retraction", source: "retraction-watch",
        updated: { "date-parts": [[2021, 12, 15]], "date-time": "2021-12-15T00:00:00Z" }, "record-id": "34999" },
    { DOI: "10.1177/17588359211061903", type: "retraction", label: "Retraction", source: "publisher",
        updated: { "date-parts": [[2021, 12, 15]], "date-time": "2021-12-15T00:00:00Z" } },
];

const robots: Robots = async () => ({ permitido: true, motivo: "sem robots.txt" });

function rede(rotas: Record<string, { status: number; body?: unknown; contentType?: string }>): { buscar: Buscador; pedidos: string[] } {
    const pedidos: string[] = [];
    const buscar: Buscador = async (url) => {
        pedidos.push(url);
        const chave = Object.keys(rotas).find((k) => url.startsWith(k));
        if (!chave) return { status: 404, url, contentType: "text/plain", body: "Resource not found." };
        const r = rotas[chave];
        return { status: r.status, url, contentType: r.contentType ?? "application/json", body: typeof r.body === "string" ? r.body : JSON.stringify(r.body ?? {}) };
    };
    return { buscar, pedidos };
}

const op = (buscar: Buscador) => ({ buscar, robots, intervaloMs: 0, agora: () => "2026-11-27T00:00:00.000Z" });

describe("linha 19 — atualizações pelo Crossref (forma conferida na fonte oficial em 27/11/2026)", () => {
    it("lê 'updated-by': tipo, rótulo, fonte (editor e Retraction Watch), DOI do aviso, data e id da Retraction Watch", () => {
        const a = atualizacoesDe(UPDATED_BY);
        expect(a).toHaveLength(2);
        expect(a[0]).toEqual({ tipo: "retraction", rotulo: "Retraction", fonte: "retraction-watch", doi_aviso: "10.1177/17588359211061903", data: "2021-12-15", id_retraction_watch: "34999" });
        expect(a[1].fonte).toBe("publisher");
    });
    it("o tipo com hífen ('expression-of-concern') vira o do esquema ('expression_of_concern')", () => {
        const [a] = atualizacoesDe([{ DOI: "10.1371/journal.pone.0100716", type: "expression-of-concern", label: "Expression of Concern", source: "publisher", updated: { "date-parts": [[2014, 7, 10]] } }]);
        expect(a.tipo).toBe("expression_of_concern");
        expect(TIPOS_DE_ATUALIZACAO).toContain(a.tipo);
        expect(a.data).toBe("2014-07-10");
    });
});

describe("linha 19 — a marca de retratação no título registrado não impede conferir", () => {
    it("'RETRACTED: <título>' confere com o título original; título diferente segue sem conferir", () => {
        expect(titulosConferem(TITULO_RETRATADO, `RETRACTED: ${TITULO_RETRATADO}`)).toBe(true);
        expect(titulosConferem(TITULO_RETRATADO, `Retracted Article: ${TITULO_RETRATADO}`)).toBe(true);
        expect(titulosConferem(TITULO_RETRATADO, "RETRACTED: Effect of Treadmill Exercise on Bone Mass")).toBe(false);
    });
});

describe("linha 19 — existência e retratação de uma referência, sem projeto", () => {
    it("DOI registrado, título que confere e retratado: existe, e os avisos aparecem — sem excluir nada", async () => {
        const { buscar } = rede({
            [`https://doi.org/${RETRATADO}`]: { status: 200, contentType: "application/vnd.citationstyles.csl+json", body: { title: `RETRACTED: ${TITULO_RETRATADO}` } },
            [`https://api.crossref.org/v1/works/${encodeURIComponent(RETRATADO)}`]: { status: 200, body: { message: { DOI: RETRATADO, "updated-by": UPDATED_BY } } },
        });
        // O Crossref põe "RETRACTED:" no título; o título do registro é o original, e confere.
        const v = await verificarReferencia({ titulo: TITULO_RETRATADO, doi: RETRATADO }, 0, op(buscar));
        expect(v.existencia.situacao).toBe("existe");
        expect(v.atualizacoes.situacao).toBe("consultada");
        expect(v.atualizacoes.lista.map((a) => `${a.tipo}/${a.fonte}`)).toEqual(["retraction/retraction-watch", "retraction/publisher"]);
    });

    it("DOI inventado (sem registro em doi.org): 'DOI sem registro', e a retratação não se consulta", async () => {
        const { buscar, pedidos } = rede({ "https://doi.org/": { status: 404, contentType: "text/html", body: "" } });
        const v = await verificarReferencia({ titulo: "Um estudo que não existe sobre aromas", doi: "10.9999/inventado.2025.1" }, 0, op(buscar));
        expect(v.existencia.situacao).toBe("DOI sem registro");
        expect(v.atualizacoes.situacao).toBe("não consultada");
        expect(pedidos.some((u) => u.includes("api.crossref.org"))).toBe(false);
    });

    it("DOI real com outro título: 'não confere'", async () => {
        const { buscar } = rede({
            "https://doi.org/": { status: 200, contentType: "application/vnd.citationstyles.csl+json", body: { title: "Effect of Treadmill Exercise on Bone Mass in Female Rats" } },
            "https://api.crossref.org/v1/works/": { status: 200, body: { message: {} } },
        });
        const v = await verificarReferencia({ titulo: "Perfil sensorial da cajuína artesanal", doi: "10.1538/expanim.54.1" }, 0, op(buscar));
        expect(v.existencia.situacao).toBe("não confere");
        expect(v.atualizacoes.motivo).toBe("nenhum aviso de atualização no Crossref");
    });

    it("só título: a busca bibliográfica do Crossref acha o DOI, e a retratação se consulta por ele", async () => {
        const { buscar, pedidos } = rede({
            "https://api.crossref.org/v1/works?query.bibliographic=": { status: 200, body: { message: { items: [{ DOI: "10.1/outro", title: ["Outra coisa"] }, { DOI: RETRATADO, title: [TITULO_RETRATADO] }] } } },
            [`https://api.crossref.org/v1/works/${encodeURIComponent(RETRATADO)}`]: { status: 200, body: { message: { "updated-by": UPDATED_BY } } },
        });
        const v = await verificarReferencia({ titulo: TITULO_RETRATADO }, 0, op(buscar));
        expect(v.existencia).toMatchObject({ situacao: "existe", como: "busca bibliográfica do Crossref", doi: RETRATADO });
        expect(v.atualizacoes.lista).toHaveLength(2);
        expect(pedidos).toHaveLength(2);
    });

    it("só título, nada no Crossref: 'não encontrada no Crossref', dizendo que isso não prova que não existe", async () => {
        const { buscar } = rede({ "https://api.crossref.org/v1/works?query.bibliographic=": { status: 200, body: { message: { items: [{ DOI: "10.1/x", title: ["Outra coisa qualquer aqui"] }] } } } });
        const v = await verificarReferencia({ titulo: "Dissertação sobre a roda de aromas da cajuína" }, 0, op(buscar));
        expect(v.existencia.situacao).toBe("não encontrada no Crossref");
        expect(v.existencia.motivo).toMatch(/não prova/);
        expect(v.atualizacoes.situacao).toBe("não consultada");
    });

    it("DOI de outra agência (fora do Crossref): a retratação 'não consultada', com o motivo", async () => {
        const { buscar } = rede({
            "https://doi.org/": { status: 200, contentType: "application/vnd.citationstyles.csl+json", body: { title: "Conjunto de dados sensoriais de cajuína" } },
            "https://api.crossref.org/v1/works/": { status: 404, contentType: "text/plain", body: "Resource not found." },
        });
        const v = await verificarReferencia({ titulo: "Conjunto de dados sensoriais de cajuína", doi: "10.5281/zenodo.123" }, 0, op(buscar));
        expect(v.existencia.situacao).toBe("existe");
        expect(v.atualizacoes).toMatchObject({ situacao: "não consultada" });
        expect(v.atualizacoes.motivo).toMatch(/fora do Crossref/);
    });

    it("a referência que é ela mesma um aviso ('update-to') é mostrada como aviso", async () => {
        const { buscar } = rede({
            "https://doi.org/": { status: 200, contentType: "application/vnd.citationstyles.csl+json", body: { title: "Retraction notice" } },
            "https://api.crossref.org/v1/works/": { status: 200, body: { message: { "update-to": [{ DOI: RETRATADO, type: "retraction", label: "Retraction", source: "publisher" }] } } },
        });
        const r = await verificarReferencias({ tipo: "lista", referencias: [{ doi: "10.1177/17588359211061903" }] }, op(buscar));
        expect(r.verificacoes[0].existencia.situacao).toBe("existe"); // sem título informado: basta o DOI ter registro
        expect(r.verificacoes[0].atualizacoes.e_aviso_de[0].doi_aviso).toBe(RETRATADO);
        expect(r.relatorio.contagens.que_sao_avisos).toBe(1);
        expect(r.resumo).toMatch(/é aviso de Retraction de 10\.1177\/1758835919874651/);
    });
});

describe("linha 19 — as três origens: lista (sem projeto), protocolo e insumo do estágio", () => {
    const dirs: string[] = [];
    afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });
    const tmp = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), "linha19-")); dirs.push(d); return d; };

    it("sem projeto: conta, mostra e não exclui nenhuma referência", async () => {
        const { buscar } = rede({
            [`https://doi.org/${RETRATADO}`]: { status: 200, contentType: "application/vnd.citationstyles.csl+json", body: { title: TITULO_RETRATADO } },
            [`https://api.crossref.org/v1/works/${encodeURIComponent(RETRATADO)}`]: { status: 200, body: { message: { "updated-by": UPDATED_BY } } },
            "https://doi.org/10.9999": { status: 404, contentType: "text/html" },
        });
        const r = await verificarReferencias({ tipo: "lista", referencias: [{ id: "a", titulo: TITULO_RETRATADO, doi: RETRATADO }, { id: "b", titulo: "Inventada", doi: "10.9999/x" }] }, op(buscar));
        expect(r.verificacoes.map((v) => v.id)).toEqual(["a", "b"]);
        expect(r.relatorio.contagens).toMatchObject({ referencias: 2, existencia: { existe: 1, "DOI sem registro": 1 }, com_algum_aviso: 1, referencias_por_tipo_de_aviso: { retraction: 1 } });
        expect(r.relatorio.regra).toMatch(/não exclui ninguém/);
        expect(r.resumo).toMatch(/retraction-watch/);
    });

    it("lista vazia recusa", async () => {
        await expect(verificarReferencias({ tipo: "lista", referencias: [] }, op(rede({}).buscar))).rejects.toThrow(/vazia/);
    });

    it("protocolo: lê os DOIs que o protocol.md cita, sem repetição e sem a pontuação do fim", async () => {
        expect(doisDoTexto("Ver (doi:10.1000/abc.1). E https://doi.org/10.1000/abc.1, e 10.5555/X-2;")).toEqual(["10.1000/abc.1", "10.5555/X-2"]);
        const d = tmp();
        fs.writeFileSync(path.join(d, "protocol.md"), `# Protocolo\nReferência: https://doi.org/${RETRATADO}.\n`);
        const { buscar } = rede({
            "https://doi.org/": { status: 200, contentType: "application/vnd.citationstyles.csl+json", body: { title: TITULO_RETRATADO } },
            "https://api.crossref.org/v1/works/": { status: 200, body: { message: { "updated-by": UPDATED_BY } } },
        });
        const r = await verificarReferencias({ tipo: "protocolo", projectPath: d }, op(buscar));
        expect(r.verificacoes).toHaveLength(1);
        expect(r.verificacoes[0]).toMatchObject({ id: "protocolo-1", doi_informado: RETRATADO });
        expect(r.verificacoes[0].atualizacoes.lista).toHaveLength(2);
    });

    it("protocolo sem DOI recusa e diz o caminho (a lista, com o título)", async () => {
        const d = tmp();
        fs.writeFileSync(path.join(d, "protocol.md"), "# Protocolo\nSem DOI.\n");
        await expect(verificarReferencias({ tipo: "protocolo", projectPath: d }, op(rede({}).buscar))).rejects.toThrow(/referencias/);
    });

    it("insumo do estágio: a existência que o verify_record_links gravou se reaproveita, sem pedido a doi.org", async () => {
        const d = tmp();
        fs.mkdirSync(path.join(d, "02_deduplicated"), { recursive: true });
        fs.mkdirSync(path.join(d, "03_screening"), { recursive: true });
        fs.writeFileSync(path.join(d, "02_deduplicated", "dataset.json"), JSON.stringify([{ identifier: "r1", title: TITULO_RETRATADO, doi: RETRATADO }]));
        fs.writeFileSync(path.join(d, "03_screening", "procedencia.json"), JSON.stringify([
            { id: "r1", titulo_registro: TITULO_RETRATADO, link: `https://doi.org/${RETRATADO}`, metodo: "doi", titulo_lido: TITULO_RETRATADO, situacao: "confere", motivo: "título registrado no DOI", quando: "2026-11-24T10:00:00.000Z" },
        ]));
        const { buscar, pedidos } = rede({ "https://api.crossref.org/v1/works/": { status: 200, body: { message: { "updated-by": UPDATED_BY } } } });
        const r = await verificarReferencias({ tipo: "estagio", projectPath: d, estagio: "ta" }, op(buscar));
        expect(r.verificacoes[0].existencia).toMatchObject({ situacao: "existe", como: "conferência do verify_record_links de 2026-11-24" });
        expect(pedidos.every((u) => u.startsWith("https://api.crossref.org/"))).toBe(true);
        expect(r.verificacoes[0].atualizacoes.lista).toHaveLength(2);
        // Não grava nada no projeto: o registro da execução é da tool (logs/lote e audit_logs).
        expect(fs.readdirSync(path.join(d, "03_screening"))).toEqual(["procedencia.json"]);
    });
});
