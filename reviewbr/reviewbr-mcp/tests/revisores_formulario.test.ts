import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { gerarFormularios, manifestoRel, type Pergunta } from "../src/services/decisoes_revisores.js";
import { FIX, INSUMO, REG, PERGUNTAS, CRITERIO, EBSCO, montarProjeto, conferir, abrir } from "./apoio/revisores.js";

// Linha 13 da FILA (23/11/2026), parte 3: a planilha de cada revisor (ação 'formulario'), como o Vicente decidiu.

describe("linha 13 — formulario: a planilha de cada revisor", () => {
    const dirs: string[] = [];
    afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });
    const base = { estagio: "ta" as const, revisores: ["pesquisador", "estagiário"], perguntas: PERGUNTAS, perguntaIdiomaTipo: "c" };

    it("recusa sem a conferência de procedência dos links", async () => {
        const p = montarProjeto(dirs);
        await expect(gerarFormularios(p, base)).rejects.toThrow(/verify_record_links/);
        expect(fs.existsSync(path.join(p, manifestoRel("ta")))).toBe(false);
    });

    it("recusa pergunta que não está escrita no protocolo", async () => {
        const p = montarProjeto(dirs);
        await conferir(p);
        const mudada = [{ id: "a", texto: "o produto é cajuína?" }];
        await expect(gerarFormularios(p, { ...base, perguntas: mudada })).rejects.toThrow(/não estão escritas no protocol\.md/);
    });

    it("uma planilha por revisor, com o insumo inteiro menos o link que não abriu", async () => {
        const p = montarProjeto(dirs);
        await conferir(p);
        const r = await gerarFormularios(p, base);
        expect(Object.keys(r.lote.arquivos)).toEqual(["pesquisador", "estagiario"]);
        expect(r.fora).toEqual([EBSCO.identifier]);
        expect(r.lote.ids).toHaveLength(REG.length - 1);
        const m = JSON.parse(fs.readFileSync(path.join(p, manifestoRel("ta")), "utf-8"));
        expect(m.perguntas.map((q: Pergunta) => q.id)).toEqual(["a", "b", "c"]); // a (d) é só do texto completo
        for (const rel of Object.values(r.lote.arquivos)) {
            const { ws, controle } = await abrir(path.join(p, rel));
            const ids: string[] = [];
            for (let i = controle.primeira; i <= controle.ultima; i++) ids.push(String(ws.getCell(i, controle.colunas.id).value));
            expect(ids).toEqual(r.lote.ids);
        }
    });

    it("topo, colunas travadas e abertas, listas de opções e o link pelo DOI", async () => {
        const p = montarProjeto(dirs);
        await conferir(p);
        const r = await gerarFormularios(p, base);
        const { ws, controle } = await abrir(path.join(p, r.lote.arquivos.estagiario));
        expect(controle).toMatchObject({ tipo: "formulario", estagio: "ta", rotulo: "estagiario", lote: 1 });
        // identificação aberta; papel com lista
        for (const k of ["nome", "papel", "inicio", "fim"]) expect(ws.getCell(controle.ident[k]).protection?.locked).toBe(false);
        expect(ws.getCell(controle.ident.papel).dataValidation?.formulae?.[0]).toBe('"pesquisador,estagiário"');
        // perguntas do protocolo no topo, como estão nele
        const topo: string[] = [];
        for (let i = 1; i < controle.cabecalho; i++) topo.push(String(ws.getCell(i, 1).value ?? ""));
        for (const q of PERGUNTAS.slice(0, 3)) expect(topo).toContain(`(${q.id}) ${q.texto}`);
        // colunas: (c) com o que a fonte declara logo antes; respostas abertas com sim/não/dúvida
        const c = controle.colunas;
        expect(c["declarado:c"]).toBe(c["p:c"] - 1);
        const linha = controle.primeira;
        for (const k of ["p:a", "p:b", "p:c"]) {
            const cell = ws.getCell(linha, c[k]);
            expect(cell.protection?.locked).toBe(false);
            expect(cell.dataValidation?.formulae?.[0]).toBe('"sim,não,dúvida"');
        }
        expect(ws.getCell(linha, c.link_abriu).dataValidation?.formulae?.[0]).toBe('"sim,não"');
        expect(ws.getCell(linha, c.observacao).protection?.locked).toBe(false);
        expect(ws.getCell(linha, c.titulo).protection?.locked).not.toBe(false);
        expect(ws.getCell(linha, c["declarado:c"]).protection?.locked).not.toBe(false);
        expect(String(ws.getCell(linha, c["declarado:c"]).value)).toMatch(/^idioma: .+ · tipo: .+/);
        expect((ws as any).sheetProtection?.sheet).toBe(true);
        // o registro da Scopus aparece com o DOI, não com a página da Scopus
        const scopus = REG.find((x) => String(x.url).includes("scopus"));
        const n = r.lote.ids.indexOf(scopus.identifier);
        const link: any = ws.getCell(controle.primeira + n, c.link).value;
        expect(link.hyperlink).toBe(`https://doi.org/${scopus.doi}`);
    });

    it("o par sinalizado na F3 fica junto, com o aviso nos dois", async () => {
        const p = montarProjeto(dirs);
        await conferir(p);
        const r = await gerarFormularios(p, base);
        const par = JSON.parse(fs.readFileSync(path.join(FIX, "linha13", "dedupe_report.json"), "utf-8")).pares_sinalizados[0];
        const ia = r.lote.ids.indexOf(par.a), ib = r.lote.ids.indexOf(par.b);
        expect(Math.abs(ia - ib)).toBe(1);
        const { ws, controle } = await abrir(path.join(p, r.lote.arquivos.pesquisador));
        expect(String(ws.getCell(controle.primeira + ia, controle.colunas.par).value)).toMatch(new RegExp(`par sinalizado na F3 com o nº ${ib + 1}`));
    });

    it("o que voltou da manutenção sai num lote novo, só com ele", async () => {
        const p = montarProjeto(dirs);
        await conferir(p);
        await gerarFormularios(p, base);
        await expect(gerarFormularios(p, { ...base, pendentes: true })).rejects.toThrow(/Nenhum registro voltou/);
        await conferir(p, false, { somenteFalhas: true });
        const r2 = await gerarFormularios(p, { ...base, pendentes: true });
        expect(r2.lote.n).toBe(2);
        expect(r2.lote.ids).toEqual([EBSCO.identifier]);
        expect(r2.lote.arquivos.pesquisador).toMatch(/ta_pesquisador_lote2\.xlsx$/);
    });

    it("texto completo: 'conseguiu ler?' antes das perguntas, sem 'dúvida', com o critério do protocolo no topo", async () => {
        const p = montarProjeto(dirs);
        await conferir(p);
        const incluidos = INSUMO.filter((x) => x.record !== EBSCO).slice(0, 3).map((x) => ({ record: x.record, decision: "SEGUE" }));
        fs.writeFileSync(path.join(p, "03_screening", "included_ta.json"), JSON.stringify(incluidos));
        await expect(gerarFormularios(p, { ...base, estagio: "fulltext", criterioNaoRecuperado: "excluído quando não se acha" })).rejects.toThrow(/critério/);
        const r = await gerarFormularios(p, { ...base, estagio: "fulltext", criterioNaoRecuperado: CRITERIO });
        expect(r.lote.ids).toHaveLength(3);
        const { ws, controle } = await abrir(path.join(p, r.lote.arquivos.pesquisador));
        const c = controle.colunas;
        expect(c.leu).toBeLessThan(c["p:a"]);
        expect(c["p:d"]).toBeDefined();
        expect(ws.getCell(controle.primeira, c["p:a"]).dataValidation?.formulae?.[0]).toBe('"sim,não"');
        const topo: string[] = [];
        for (let i = 1; i < controle.cabecalho; i++) topo.push(String(ws.getCell(i, 1).value ?? ""));
        expect(topo.some((t) => t.includes(CRITERIO))).toBe(true);
    });
});
