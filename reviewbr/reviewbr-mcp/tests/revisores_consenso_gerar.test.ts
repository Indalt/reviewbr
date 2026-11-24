import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
    gerarFormularios, importarPlanilha, gerarPlanilhaDeConsenso, gerarArtefatosDoFunil, lerDecisoes,
} from "../src/services/decisoes_revisores.js";
import { FlowComputer } from "../src/services/flow_computer.js";
import { NAO_RECUPERADOS } from "../src/services/project_artifacts.js";
import { INSUMO, PERGUNTAS, CRITERIO, EBSCO, montarProjeto, conferir, preencher, tudoSim, abrir } from "./apoio/revisores.js";

// Linha 13 da FILA (23/11/2026), parte 5: a planilha das divergências (ação 'consenso') e a gravação dos artefatos do
// funil a partir das decisões dos revisores (ação 'gerar'), nas duas fases. Insumo: cópia de 11 registros do
// roda_aromas_ceara. Nada é gravado na pasta do projeto.

const ler = (p: string, rel: string) => JSON.parse(fs.readFileSync(path.join(p, rel), "utf-8"));

async function preencherConsenso(gerada: string, devolvida: string, ident: { presentes?: string; pesquisador?: string; data?: string },
    linha: (id: string) => { resultado?: string; motivo?: string; decidido_por?: string }): Promise<string> {
    const { wb, ws, controle } = await abrir(gerada);
    ws.getCell(controle.ident.presentes).value = ident.presentes ?? "";
    ws.getCell(controle.ident.pesquisador).value = ident.pesquisador ?? "";
    ws.getCell(controle.ident.data).value = ident.data ?? "";
    for (let i = controle.primeira; i <= controle.ultima; i++) {
        const id = String(ws.getCell(i, controle.colunas.id).value);
        for (const [k, v] of Object.entries(linha(id))) if (v !== undefined) ws.getCell(i, controle.colunas[k]).value = v;
    }
    fs.mkdirSync(path.dirname(devolvida), { recursive: true });
    await wb.xlsx.writeFile(devolvida);
    return devolvida;
}

describe("linha 13 — consenso e gerar", () => {
    const dirs: string[] = [];
    afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });
    const base = { estagio: "ta" as const, revisores: ["pesquisador", "estagiario"], perguntas: PERGUNTAS, perguntaIdiomaTipo: "c" };

    /** Título e resumo lidos pelos dois, com uma concordância em excluir, uma divergência e uma dúvida. */
    async function triagemTA() {
        const p = montarProjeto(dirs);
        const fora = path.join(p, "..", `${path.basename(p)}_devolvidas`);
        dirs.push(fora);
        await conferir(p);
        const f = await gerarFormularios(p, base);
        const [um, dois, tres] = f.lote.ids;
        await importarPlanilha(p, { arquivo: await preencher(path.join(p, f.lote.arquivos.pesquisador), path.join(fora, "p1.xlsx"), {
            nome: "Pesquisador P", papel: "pesquisador",
            linha: (id) => id === um ? { ...tudoSim(), "p:b": "não" } : tudoSim(),
        }) });
        await importarPlanilha(p, { arquivo: await preencher(path.join(p, f.lote.arquivos.estagiario), path.join(fora, "e1.xlsx"), {
            nome: "Estagiária E", linha: (id) => id === um ? { ...tudoSim(), "p:a": "não" }
                : id === dois ? { ...tudoSim(), "p:c": "não" }
                : id === tres ? { ...tudoSim(), "p:b": "dúvida", observacao: "resumo não diz se há painel" }
                : tudoSim(),
        }) });
        return { p, f, fora, um, dois, tres };
    }

    it("gerar recusa enquanto há falha de procedência, divergência sem consenso ou revisor faltando", async () => {
        const { p, dois } = await triagemTA();
        const erro = await Promise.resolve().then(() => gerarArtefatosDoFunil(p, { estagio: "ta" })).catch((e) => e.message);
        expect(erro).toMatch(/1 registro\(s\) com falha de procedência/);
        expect(erro).toContain(EBSCO.identifier);
        expect(erro).toMatch(new RegExp(`1 divergência\\(s\\) sem consenso.*${dois}`));
        expect(fs.existsSync(path.join(p, "03_screening/included_ta.json"))).toBe(false);
    });

    it("consenso: só as divergências; exige motivo e, sem consenso, o nome do pesquisador", async () => {
        const { p, fora, dois } = await triagemTA();
        const c = await gerarPlanilhaDeConsenso(p, { estagio: "ta" });
        expect(c.ids).toEqual([dois]);
        const ruim = await preencherConsenso(path.join(p, c.arquivo!), path.join(fora, "c-ruim.xlsx"), { presentes: "P e E", data: "01/12/2026" },
            () => ({ resultado: "excluir", motivo: "", decidido_por: "pesquisador" }));
        const erro = await importarPlanilha(p, { arquivo: ruim }).catch((e) => e.message);
        expect(erro).toMatch(/motivo do resultado em branco/);
        expect(erro).toMatch(/nome dele no topo está em branco/);
        const boa = await preencherConsenso(path.join(p, c.arquivo!), path.join(fora, "c-boa.xlsx"), { presentes: "P e E", pesquisador: "Pesquisador P", data: "01/12/2026" },
            () => ({ resultado: "excluir", motivo: "é refrigerante com o nome, não a bebida", decidido_por: "pesquisador" }));
        const r = await importarPlanilha(p, { arquivo: boa });
        expect(r.contagens).toEqual({ "excluir (pesquisador)": 1 });
        expect(lerDecisoes(p, "ta").consenso![dois]).toMatchObject({ resultado: "excluir", decidido_por: "pesquisador", pesquisador: "Pesquisador P", data: "2026-12-01" });
        // não há outra divergência
        expect((await gerarPlanilhaDeConsenso(p, { estagio: "ta" })).arquivo).toBeNull();
    });

    it("consenso recusado se as decisões dos revisores mudaram depois da planilha de consenso", async () => {
        const { p, f, fora, dois } = await triagemTA();
        const c = await gerarPlanilhaDeConsenso(p, { estagio: "ta" });
        await importarPlanilha(p, {
            arquivo: await preencher(path.join(p, f.lote.arquivos.estagiario), path.join(fora, "e2.xlsx"), { nome: "Estagiária E", linha: tudoSim }),
            substituicao: "A estagiária revisou a linha do refrigerante; importar de novo.",
        });
        const cons = await preencherConsenso(path.join(p, c.arquivo!), path.join(fora, "c.xlsx"), { presentes: "P e E", data: "01/12/2026" },
            () => ({ resultado: "segue", motivo: "x", decidido_por: "consenso" }));
        await expect(importarPlanilha(p, { arquivo: cons })).rejects.toThrow(new RegExp(`id ${dois}\\): as decisões dos revisores mudaram`));
    });

    it("título e resumo, de ponta a ponta: grava included_ta e excluded_ta com as decisões, o consenso e os motivos", async () => {
        const { p, f, fora, um, dois, tres } = await triagemTA();
        // a EBSCO volta da manutenção e é lida pelos dois no lote 2
        await conferir(p, false, { somenteFalhas: true });
        const l2 = await gerarFormularios(p, { ...base, pendentes: true });
        for (const rot of ["pesquisador", "estagiario"]) {
            await importarPlanilha(p, { arquivo: await preencher(path.join(p, l2.lote.arquivos[rot]), path.join(fora, `${rot}-l2.xlsx`), { nome: rot, papel: rot === "pesquisador" ? "pesquisador" : "estagiário", linha: tudoSim }) });
        }
        const c = await gerarPlanilhaDeConsenso(p, { estagio: "ta" });
        await importarPlanilha(p, { arquivo: await preencherConsenso(path.join(p, c.arquivo!), path.join(fora, "c.xlsx"), { presentes: "P e E", data: "01/12/2026" },
            () => ({ resultado: "excluir", motivo: "refrigerante", decidido_por: "consenso" })) });
        const r = gerarArtefatosDoFunil(p, { estagio: "ta" });
        const k = r.relatorio.contagens;
        expect(k).toMatchObject({ insumo: INSUMO.length, seguem: INSUMO.length - 2, excluidos: 2, com_duvida: 1, por_concordancia: INSUMO.length - 1, por_consenso: 1 });
        const exc = ler(p, "03_screening/excluded_ta.json");
        expect(exc.map((x: any) => x.record.identifier).sort()).toEqual([um, dois].sort());
        expect(exc.find((x: any) => x.record.identifier === dois)).toMatchObject({ decision: "NO", decisao: "excluir", origem: "consenso", motivo: "refrigerante" });
        expect(exc.find((x: any) => x.record.identifier === um).decisoes.pesquisador.respostas.b).toBe("não");
        const inc = ler(p, "03_screening/included_ta.json");
        expect(inc.find((x: any) => x.record.identifier === tres).decision).toBe("MAYBE");
        expect(inc.find((x: any) => x.record.identifier === EBSCO.identifier).decisoes.estagiario.lote).toBe(2);
        expect(r.relatorio.motivos_de_exclusao_por_pergunta).toEqual({ "(a) (b)": 1, "(c)": 1 });
        expect(r.relatorio.revisores.map((x: any) => x.nome)).toContain("Estagiária E");
        // regravar exige autorização (DEBT-112)
        expect(() => gerarArtefatosDoFunil(p, { estagio: "ta" })).toThrow(/autoriza/);
        void f;
    });

    it("texto completo, de ponta a ponta: incluídos, excluídos e não recuperados; o funil fecha", async () => {
        const p = montarProjeto(dirs);
        const fora = path.join(p, "..", `${path.basename(p)}_ft`);
        dirs.push(fora);
        await conferir(p, false);
        // funil até a TA: 11 identificados e deduplicados; TA com 3 excluídos (gravada pela ação gerar)
        const regs = INSUMO.map((x) => x.record);
        fs.mkdirSync(path.join(p, "01_raw"), { recursive: true });
        fs.writeFileSync(path.join(p, "01_raw/database_records.json"), JSON.stringify(regs));
        fs.writeFileSync(path.join(p, "02_deduplicated/dataset.json"), JSON.stringify(regs));
        const fta = await gerarFormularios(p, base);
        const excluirTA = new Set(fta.lote.ids.slice(0, 3));
        for (const rot of ["pesquisador", "estagiario"]) {
            await importarPlanilha(p, { arquivo: await preencher(path.join(p, fta.lote.arquivos[rot]), path.join(fora, `${rot}-ta.xlsx`), {
                papel: rot === "pesquisador" ? "pesquisador" : "estagiário", linha: (id) => excluirTA.has(id) ? { ...tudoSim(), "p:a": "não" } : tudoSim(),
            }) });
        }
        gerarArtefatosDoFunil(p, { estagio: "ta" });
        // texto completo sobre os 8 que seguiram
        const fft = await gerarFormularios(p, { ...base, estagio: "fulltext", criterioNaoRecuperado: CRITERIO });
        expect(fft.lote.ids).toHaveLength(8);
        const [naoLido, excluido] = fft.lote.ids;
        const sim = { link_abriu: "sim", leu: "sim", "p:a": "sim", "p:b": "sim", "p:c": "sim", "p:d": "sim" };
        for (const rot of ["pesquisador", "estagiario"]) {
            await importarPlanilha(p, { arquivo: await preencher(path.join(p, fft.lote.arquivos[rot]), path.join(fora, `${rot}-ft.xlsx`), {
                papel: rot === "pesquisador" ? "pesquisador" : "estagiário",
                linha: (id) => id === naoLido ? { link_abriu: "sim", leu: "não" } : id === excluido ? { ...sim, "p:d": "não" } : sim,
            }) });
        }
        const r = gerarArtefatosDoFunil(p, { estagio: "fulltext" });
        expect(r.relatorio.contagens).toMatchObject({ insumo: 8, incluidos: 6, excluidos: 1, nao_recuperados: 1 });
        expect(ler(p, NAO_RECUPERADOS).map((x: any) => x.record.identifier)).toEqual([naoLido]);
        const fluxo = new FlowComputer().compute(p);
        expect(fluxo.computed).toMatchObject({ screened: 11, title_abstract_excluded: 3, retrieved_fulltext: 8, fulltext_not_retrieved: 1, fulltext_assessed: 7, fulltext_excluded: 1, included: 6 });
        expect(fluxo.includedCrossCheck.matches).toBe(true);
        expect(fluxo.validation.valid).toBe(true);
    });
});
