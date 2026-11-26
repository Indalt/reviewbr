import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { gerarFormularios, importarPlanilha, gerarArtefatosDoFunil, lerDecisoes, manifestoRel, decidir } from "../src/services/decisoes_revisores.js";
import { lerFalhas } from "../src/services/procedencia.js";
import { INSUMO, REG, PERGUNTAS, CRITERIO, EBSCO, montarProjeto, conferir, preencher, tudoSim, abrir } from "./apoio/revisores.js";

// Linha 23 da FILA (decisão do Vicente de 26/11/2026): quando o ReviewBR não consegue conferir a procedência de um
// registro, ele registra a limitação, e a pesquisa segue. Substitui a regra de 23/11, em que a falha ia à manutenção e
// o registro ficava fora da leitura até o conserto — o que, com fonte que recusa robô, nunca acontecia, e o estágio não
// fechava. Insumo: cópia de 11 registros do roda_aromas_ceara; o link da EBSCO fica "fora do ar" na conferência.

describe("linha 23 — procedência que o sistema não confere: limitação registrada, a pesquisa segue", () => {
    const dirs: string[] = [];
    afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });
    const base = { estagio: "ta" as const, revisores: ["pesquisador", "estagiario"], perguntas: PERGUNTAS, perguntaIdiomaTipo: "c" };

    it("o registro que a conferência não confirmou vai à planilha, com a situação à vista e a instrução nova", async () => {
        const p = montarProjeto(dirs);
        await conferir(p);
        const r = await gerarFormularios(p, base);
        expect(r.lote.ids).toHaveLength(REG.length);
        expect(r.semProcedencia).toEqual([EBSCO.identifier]);
        expect(r.resumo).toMatch(/limitação registrada/);
        const { ws, controle } = await abrir(path.join(p, r.lote.arquivos.pesquisador));
        const n = r.lote.ids.indexOf(EBSCO.identifier);
        expect(String(ws.getCell(controle.primeira + n, controle.colunas.conferencia).value)).toMatch(/^fora do ar/);
        const topo: string[] = [];
        for (let i = 1; i < controle.cabecalho; i++) topo.push(String(ws.getCell(i, 1).value ?? ""));
        expect(topo.some((t) => /não tira o registro da leitura/.test(t))).toBe(true);
    });

    it("link que não abriu para os revisores, com as perguntas em branco (instrução de antes de 26/11): segue com dúvida; o estágio fecha, e o relatório traz a limitação", async () => {
        const p = montarProjeto(dirs);
        const fora = path.join(p, "..", `${path.basename(p)}_devolvidas`);
        dirs.push(fora);
        await conferir(p);
        const f = await gerarFormularios(p, base);
        const alvo = EBSCO.identifier;
        for (const rot of ["pesquisador", "estagiario"]) {
            const r = await importarPlanilha(p, { arquivo: await preencher(path.join(p, f.lote.arquivos[rot]), path.join(fora, `${rot}.xlsx`), {
                papel: rot === "pesquisador" ? "pesquisador" : "estagiário", linha: (id) => id === alvo ? { link_abriu: "não" } : tudoSim(),
            }) });
            expect(r.falhas).toEqual([alvo]);
        }
        expect(lerDecisoes(p, "ta").registros[alvo].estagiario).toMatchObject({ link_abriu: "não", decisao: "segue", com_duvida: ["a", "b", "c"] });
        expect(lerFalhas(p).map((x) => x.id)).toContain(alvo);
        const g = gerarArtefatosDoFunil(p, { estagio: "ta" });
        expect(g.relatorio.contagens).toMatchObject({ insumo: REG.length, seguem: REG.length, excluidos: 0, com_duvida: 1 });
        expect(g.relatorio.procedencia).toMatchObject({ nao_confirmada_pela_conferencia: 1, link_nao_abriu_para_revisor: 1 });
        expect(g.resumo).toMatch(/limitação registrada/);
        const inc = JSON.parse(fs.readFileSync(path.join(p, "03_screening/included_ta.json"), "utf-8"));
        expect(inc.find((x: any) => x.record.identifier === alvo).decision).toBe("MAYBE");
    });

    it("link que não abriu, com as perguntas respondidas: a decisão sai das respostas, e o \"não\" do link fica no motivo", () => {
        const ta = PERGUNTAS.slice(0, 3);
        expect(decidir("ta", ta, "não", undefined, { a: "não", b: "sim", c: "sim" })).toMatchObject({ decisao: "excluir" });
        const segue = decidir("ta", ta, "não", undefined, { a: "sim", b: "sim", c: "sim" });
        expect(segue).toMatchObject({ decisao: "segue" });
        expect(segue.motivo).toMatch(/link/);
        expect(decidir("fulltext", PERGUNTAS, "não", undefined, {})).toMatchObject({ decisao: "não recuperado" });
        expect(decidir("fulltext", PERGUNTAS, "não", "sim", { a: "sim", b: "sim", c: "sim", d: "sim" })).toMatchObject({ decisao: "incluir" });
    });

    it("planilhas geradas antes de 26/11, com registros fora por procedência (o estado do roda_aromas_ceara): 'pendentes' gera o lote deles", async () => {
        const p = montarProjeto(dirs);
        await conferir(p);
        await gerarFormularios(p, base);
        const mp = path.join(p, manifestoRel("ta"));
        const m = JSON.parse(fs.readFileSync(mp, "utf-8"));
        m.lotes[0].ids = m.lotes[0].ids.filter((id: string) => id !== EBSCO.identifier);
        m.fora_por_procedencia = [EBSCO.identifier];
        fs.writeFileSync(mp, JSON.stringify(m));
        const r2 = await gerarFormularios(p, { ...base, pendentes: true });
        expect(r2.lote.n).toBe(2);
        expect(r2.lote.ids).toEqual([EBSCO.identifier]);
        expect(r2.semProcedencia).toEqual([EBSCO.identifier]);
        await expect(gerarFormularios(p, { ...base, pendentes: true })).rejects.toThrow(/já estão em alguma planilha/);
    });

    it("texto completo: link que não abriu, sem leitura declarada, conta como não recuperado; com leitura, as respostas decidem", async () => {
        const p = montarProjeto(dirs);
        const fora = path.join(p, "..", `${path.basename(p)}_ft`);
        dirs.push(fora);
        await conferir(p);
        const tres = INSUMO.filter((x) => x.record !== EBSCO).slice(0, 3).map((x) => ({ record: x.record, decision: "SEGUE" }));
        fs.writeFileSync(path.join(p, "03_screening", "included_ta.json"), JSON.stringify(tres));
        const f = await gerarFormularios(p, { ...base, estagio: "fulltext", criterioNaoRecuperado: CRITERIO });
        const [semLeitura, lido] = f.lote.ids;
        const sim = { link_abriu: "sim", leu: "sim", "p:a": "sim", "p:b": "sim", "p:c": "sim", "p:d": "sim" };
        const r = await importarPlanilha(p, { arquivo: await preencher(path.join(p, f.lote.arquivos.pesquisador), path.join(fora, "p.xlsx"), {
            papel: "pesquisador",
            linha: (id) => id === semLeitura ? { link_abriu: "não" } : id === lido ? { ...sim, link_abriu: "não" } : sim,
        }) });
        expect(r.contagens).toEqual({ "não recuperado": 1, incluir: 2 });
        expect(lerDecisoes(p, "fulltext").registros[lido].pesquisador).toMatchObject({ link_abriu: "não", decisao: "incluir" });
    });
});
