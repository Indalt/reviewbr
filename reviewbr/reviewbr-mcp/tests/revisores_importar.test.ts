import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { gerarFormularios, importarPlanilha, decisoesRel, lerDecisoes, dataDaCelula } from "../src/services/decisoes_revisores.js";
import { lerFalhas } from "../src/services/procedencia.js";
import { INSUMO, PERGUNTAS, CRITERIO, EBSCO, montarProjeto, conferir, preencher, tudoSim } from "./apoio/revisores.js";

// Linha 13 da FILA (23/11/2026), parte 4: a importação da planilha devolvida pelo revisor (ação 'importar'), com as
// recusas e a regra fixa de decisão que o Vicente decidiu. Insumo: cópia de 11 registros do roda_aromas_ceara.

describe("linha 13 — importar a planilha do revisor", () => {
    const dirs: string[] = [];
    afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });
    const base = { estagio: "ta" as const, revisores: ["pesquisador", "estagiario"], perguntas: PERGUNTAS, perguntaIdiomaTipo: "c" };

    async function preparar() {
        const p = montarProjeto(dirs);
        await conferir(p);
        const f = await gerarFormularios(p, base);
        const gerada = (rot: string) => path.join(p, f.lote.arquivos[rot]);
        const devolvida = (nome: string) => path.join(p, "..", `${path.basename(p)}_devolvidas`, nome);
        dirs.push(path.join(p, "..", `${path.basename(p)}_devolvidas`));
        return { p, f, gerada, devolvida };
    }

    it("grava por registro e revisor a decisão que sai das respostas, com nome, papel, datas, hash e cópia", async () => {
        const { p, f, gerada, devolvida } = await preparar();
        const [um, dois, tres] = f.lote.ids;
        const arq = await preencher(gerada("estagiario"), devolvida("estagiario.xlsx"), {
            nome: "Fulana de Tal", papel: "Estagiario", // sem acento e com maiúscula: vale
            linha: (id) => id === um ? { ...tudoSim(), "p:b": "Não" }
                : id === dois ? { ...tudoSim(), "p:c": "dúvida", observacao: "o idioma não está declarado" }
                : tudoSim(),
        });
        const r = await importarPlanilha(p, { arquivo: arq });
        expect(r.contagens).toEqual({ excluir: 1, segue: f.lote.ids.length - 1 });
        expect(r.faltam).toEqual(["pesquisador"]);
        const d = lerDecisoes(p, "ta");
        expect(d.registros[um].estagiario).toMatchObject({ nome: "Fulana de Tal", papel: "estagiário", decisao: "excluir", motivo: `(b) ${PERGUNTAS[1].texto}` });
        expect(d.registros[dois].estagiario).toMatchObject({ decisao: "segue", com_duvida: ["c"], observacao: "o idioma não está declarado" });
        expect(d.registros[tres].estagiario).toMatchObject({ decisao: "segue", respostas: { a: "sim", b: "sim", c: "sim" } });
        const imp = d.importacoes[0];
        expect(imp).toMatchObject({ rotulo: "estagiario", lote: 1, nome: "Fulana de Tal", inicio: "2026-11-24", fim: "2026-11-30", linhas: f.lote.ids.length });
        expect(imp.hash).toMatch(/^[0-9a-f]{64}$/);
        expect(fs.existsSync(path.join(p, imp.copia))).toBe(true);
    });

    it("recusa identificação incompleta, dizendo o quê, e não grava nada", async () => {
        const { p, gerada, devolvida } = await preparar();
        const arq = await preencher(gerada("pesquisador"), devolvida("p.xlsx"), { nome: "", papel: "coordenador", fim: "", linha: tudoSim });
        const erro = await importarPlanilha(p, { arquivo: arq }).catch((e) => e.message);
        expect(erro).toMatch(/nome do revisor está em branco/);
        expect(erro).toMatch(/papel "coordenador" fora da lista/);
        expect(erro).toMatch(/data de fim em branco/);
        expect(fs.existsSync(path.join(p, decisoesRel("ta")))).toBe(false);
    });

    it("recusa 'dúvida' sem observação, resposta em branco e valor fora da lista, dizendo a linha", async () => {
        const { p, f, gerada, devolvida } = await preparar();
        const [um, dois, tres] = f.lote.ids;
        const arq = await preencher(gerada("pesquisador"), devolvida("p.xlsx"), {
            linha: (id) => id === um ? { ...tudoSim(), "p:a": "dúvida" }
                : id === dois ? { ...tudoSim(), "p:b": undefined }
                : id === tres ? { ...tudoSim(), "p:c": "talvez" }
                : tudoSim(),
        });
        const erro = await importarPlanilha(p, { arquivo: arq }).catch((e) => e.message);
        expect(erro).toMatch(new RegExp(`id ${um}\\): há "dúvida" e a observação está em branco`));
        expect(erro).toMatch(new RegExp(`id ${dois}\\): pergunta \\(b\\) em branco`));
        expect(erro).toMatch(new RegExp(`id ${tres}\\): pergunta \\(c\\) com "talvez", fora da lista`));
        expect(fs.existsSync(path.join(p, decisoesRel("ta")))).toBe(false);
    });

    it("link que não abriu: falha de procedência, sem decisão, na lista da manutenção; volta no lote 2 depois do conserto", async () => {
        const { p, f, gerada, devolvida } = await preparar();
        const alvo = f.lote.ids[4];
        const arq = await preencher(gerada("estagiario"), devolvida("e.xlsx"), {
            linha: (id) => id === alvo ? { link_abriu: "não" } : tudoSim(),
        });
        const r = await importarPlanilha(p, { arquivo: arq });
        expect(r.falhas).toEqual([alvo]);
        expect(lerDecisoes(p, "ta").registros[alvo].estagiario.decisao).toBe("falha de procedência");
        const falha = lerFalhas(p).find((x) => x.id === alvo)!;
        expect(falha).toMatchObject({ situacao: "não abriu (revisor)", origem: "revisor estagiario (Fulana de Tal)" });
        expect(falha.link).toMatch(/^https?:\/\//);
        // a manutenção declara o conserto; a conferência confirma; o registro volta num lote novo (com a EBSCO, que também voltou)
        await conferir(p, false, { somenteFalhas: true, consertadas: { [alvo]: "teste: endereço corrigido" } });
        const lote2 = await gerarFormularios(p, { ...base, pendentes: true });
        expect(lote2.lote.ids.sort()).toEqual([alvo, EBSCO.identifier].sort());
    });

    it("recusa planilha de insumo que mudou e reimportação sem autorização; com ela, arquiva a anterior", async () => {
        const { p, gerada, devolvida } = await preparar();
        const arq = await preencher(gerada("pesquisador"), devolvida("p.xlsx"), { linha: tudoSim });
        await importarPlanilha(p, { arquivo: arq });
        await expect(importarPlanilha(p, { arquivo: arq })).rejects.toThrow(/já foi importada.*substituicao/s);
        const r = await importarPlanilha(p, { arquivo: arq, substituicao: "A estagiária corrigiu a data de fim; importar de novo." });
        expect(r.resumo).toMatch(/Substituiu a importação anterior/);
        const d = lerDecisoes(p, "ta");
        expect(d.importacoes).toHaveLength(1);
        expect(fs.existsSync(path.join(p, d.importacoes[0].substituiu!.arquivada))).toBe(true);
        // insumo mudou depois da geração: recusa
        const ins = path.join(p, "03_screening", "passed_keywords.json");
        fs.writeFileSync(ins, JSON.stringify(INSUMO.slice(0, 5)));
        await expect(importarPlanilha(p, { arquivo: arq, substituicao: "x" })).rejects.toThrow(/insumo .* mudou/);
    });

    it("texto completo: 'conseguiu ler?' não → não recuperado; 'dúvida' é recusada", async () => {
        const p = montarProjeto(dirs);
        await conferir(p);
        const incluidos = INSUMO.filter((x) => x.record !== EBSCO).slice(0, 3).map((x) => ({ record: x.record, decision: "SEGUE" }));
        fs.writeFileSync(path.join(p, "03_screening", "included_ta.json"), JSON.stringify(incluidos));
        const f = await gerarFormularios(p, { ...base, estagio: "fulltext", criterioNaoRecuperado: CRITERIO });
        const [um, dois] = f.lote.ids;
        const sim4 = { link_abriu: "sim", leu: "sim", "p:a": "sim", "p:b": "sim", "p:c": "sim", "p:d": "sim" };
        const fora = path.join(p, "..", `${path.basename(p)}_ft`);
        dirs.push(fora);
        const ruim = await preencher(path.join(p, f.lote.arquivos.pesquisador), path.join(fora, "ruim.xlsx"), {
            linha: (id) => id === um ? { ...sim4, "p:d": "dúvida", observacao: "x" } : sim4,
        });
        await expect(importarPlanilha(p, { arquivo: ruim })).rejects.toThrow(/no texto completo não há "dúvida"/);
        const boa = await preencher(path.join(p, f.lote.arquivos.pesquisador), path.join(fora, "boa.xlsx"), {
            linha: (id) => id === um ? { link_abriu: "sim", leu: "não" } : id === dois ? { ...sim4, "p:b": "não" } : sim4,
        });
        const r = await importarPlanilha(p, { arquivo: boa });
        expect(r.contagens).toEqual({ "não recuperado": 1, excluir: 1, incluir: 1 });
    });

    it("datas: aceita data do Excel, dd/mm/aaaa e aaaa-mm-dd; recusa data impossível", () => {
        expect(dataDaCelula(new Date(Date.UTC(2026, 10, 24)))).toBe("2026-11-24");
        expect(dataDaCelula("24/11/2026")).toBe("2026-11-24");
        expect(dataDaCelula("2026-11-24")).toBe("2026-11-24");
        expect(dataDaCelula("31/02/2026")).toBeNull();
        expect(dataDaCelula("")).toBeNull();
    });
});
