import { describe, it, expect, afterAll } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { StandardCoverageService } from "../src/services/standard_coverage.js";
import { lerMapeamento } from "../src/services/method_mapping.js";
import { registrarDecisaoDoPesquisador, lerCondicoes } from "../src/services/method_trail.js";
import { ProjectStateService } from "../src/services/project_state.js";

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.slice(1)), "..", "..", "..");

/**
 * Sessão 2b — os primeiros usos do item condicional do DEBT-142, com as declarações REAIS dos dois
 * métodos. O repositório é de brinquedo: cópia de `.claude/` (agentes, padrões e métodos) num
 * diretório temporário, com projetos de brinquedo — nenhum projeto de pesquisa é tocado.
 */

const temporarios: string[] = [];
afterAll(() => { for (const d of temporarios) fs.rmSync(d, { recursive: true, force: true }); });
const tmp = (prefixo: string) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), prefixo)); temporarios.push(d); return d; };

function brinquedo(): string {
    const raiz = tmp("condicionais-em-uso-");
    for (const d of ["agents", "standards", "methodologies"]) {
        fs.cpSync(path.join(REPO, ".claude", d), path.join(raiz, ".claude", d), { recursive: true });
    }
    return raiz;
}

function projeto(method: string): string {
    const p = tmp("projeto-brinquedo-");
    ProjectStateService.init(p, { method, framework: "x", reviewType: "x", topic: "t", phase: "F1" });
    return p;
}

const linha = (checklist: string, item: string) => checklist.split("\n").find((l) => l.startsWith(`| ${item} |`))!;

describe("DEBT-150 — avaliação crítica no escopo: os itens 12 e 16 do PRISMA-ScR são condicionais", () => {
    const responder = (raiz: string, p: string, resposta: string, contribuicao: string) =>
        registrarDecisaoDoPesquisador(raiz, p, { condicao: "avaliacao_critica", resposta, contribuicao });

    it("o método declara a condição na F1, com sim / não, e só as linhas 12 e 16 dependem dela", () => {
        const raiz = brinquedo();
        const { condicoes, erros } = lerCondicoes(raiz, "scoping-prisma-scr");
        expect(erros).toEqual([]);
        expect(condicoes.map((c) => [c.id, c.etapa, c.opcoes])).toEqual([["avaliacao_critica", "F1", ["sim", "não"]]]);
        const mapa = lerMapeamento(raiz, "scoping-prisma-scr", "prisma-scr");
        expect(mapa.erros).toEqual([]);
        expect([...mapa.linhas.values()].filter((l) => l.condicao).map((l) => [l.id, l.condicao!.id, l.condicao!.aplica_se]))
            .toEqual([["12", "avaliacao_critica", ["sim"]], ["16", "avaliacao_critica", ["sim"]]]);
    });

    it("sem resposta: 12 e 16 contam como o método os declara — [NÃO COBERTO], no denominador — e o aviso pede a resposta", () => {
        const raiz = brinquedo();
        const r = StandardCoverageService.conferir(raiz, "prisma-scr", undefined, projeto("scoping-prisma-scr"));
        expect(r.fracao).toBe("12/22");
        expect(r.nao_coberto.map((x) => x.id)).toEqual(expect.arrayContaining(["12", "16"]));
        expect(r.nao_se_aplica).toEqual([]);
        expect(r.avisos.join(" ")).toMatch(/sem resposta do projeto: 12 \(avaliacao_critica\), 16 \(avaliacao_critica\)/);
    });

    it("'não', gravado como decisão do pesquisador na F1: 12 e 16 saem do denominador, com o motivo — e só eles", () => {
        const raiz = brinquedo();
        const p = projeto("scoping-prisma-scr");
        const w = responder(raiz, p, "Não", "Não faremos avaliação crítica: o objetivo é mapear a amplitude do que existe, e isso vai declarado no protocolo.");
        expect(w.ok).toBe(true);
        // Gravada na etapa em que o método pergunta, com a opção como o método a escreve.
        expect(ProjectStateService.read(p)!.decisions[0]).toMatchObject({ phase: "F1", por: "pesquisador", condicao: { id: "avaliacao_critica", resposta: "não" } });

        const r = StandardCoverageService.conferir(raiz, "prisma-scr", undefined, p);
        expect(r.fracao).toBe("12/20");
        expect(r.nao_se_aplica.map((x) => x.id)).toEqual(["12", "16"]);
        for (const x of r.nao_se_aplica) expect(x.motivo).toMatch(/condição "avaliacao_critica" respondida "não" pelo pesquisador em .*: o método só aplica este item com sim/);
        expect(r.nao_coberto.map((x) => x.id)).toEqual(["3", "6", "10", "11", "13", "22"]);
        expect(r.conferencia_por_metodo[0].condicionais.map((c) => [c.item, c.aplica])).toEqual([["12", false], ["16", false]]);
        const checklist = StandardCoverageService.checklist(raiz, "prisma-scr", undefined, p);
        for (const item of ["12", "16"]) expect(linha(checklist, item)).toMatch(/\[NÃO SE APLICA\]\*\* condição "avaliacao_critica" respondida "não".*\| N\/A \|$/);
        // O outro padrão do método não depende da condição.
        expect(StandardCoverageService.conferir(raiz, "prisma-s", undefined, p).fracao).toBe("9/16");
    });

    it("'sim': 12 e 16 ficam no denominador como o método os declara — [NÃO COBERTO], sem onde registrar a avaliação (DEBT-151)", () => {
        const raiz = brinquedo();
        const p = projeto("scoping-prisma-scr");
        expect(responder(raiz, p, "sim", "Faremos avaliação crítica com o checklist JBI do desenho de cada fonte, para qualificar o mapa.").ok).toBe(true);
        const r = StandardCoverageService.conferir(raiz, "prisma-scr", undefined, p);
        expect(r.fracao).toBe("12/22");
        expect(r.nao_se_aplica).toEqual([]);
        for (const item of ["12", "16"]) expect(r.nao_coberto.find((x) => x.id === item)!.motivo).toMatch(/DEBT-151/);
        expect(r.conferencia_por_metodo[0].condicionais.map((c) => [c.item, c.aplica])).toEqual([["12", true], ["16", true]]);
        expect(r.avisos.join(" ")).not.toMatch(/condicional\(is\) sem resposta/);
    });

    it("a condição é perguntada na F1: resposta atribuída a outra etapa é recusada, sem gravar", () => {
        const raiz = brinquedo();
        const p = projeto("scoping-prisma-scr");
        const w = registrarDecisaoDoPesquisador(raiz, p, {
            etapa: "F5", condicao: "avaliacao_critica", resposta: "não", contribuicao: "Na extração vimos que não precisa avaliar a qualidade das fontes.",
        });
        expect(w.ok).toBe(false);
        expect(w.mensagem).toMatch(/perguntada pelo método na etapa F1, não em F5/);
        expect(ProjectStateService.read(p)!.decisions).toEqual([]);
    });
});

/**
 * DEBT-008 — a abordagem de certeza é escolhida a priori, na F1. Lida a fonte (sessao_2b/fontes_certeza.md):
 * os itens 15 e 22 do PRISMA 2020 valem para toda revisão sistemática e o 17 do PRISMA-P manda declarar a
 * ausência com o motivo — nenhum depende da resposta, e por isso nenhuma linha do mapeamento a usa.
 */
describe("DEBT-008 — abordagem de certeza no prisma-sr: perguntada na F1, sem efeito no denominador, como a fonte manda", () => {
    const padroes = ["prisma-2020", "prisma-p", "prisma-s"];

    it("o método declara a condição na F1, com GRADE / CERQual / nenhuma, e nenhuma linha do mapeamento depende dela", () => {
        const raiz = brinquedo();
        const { condicoes, erros } = lerCondicoes(raiz, "prisma-sr");
        expect(erros).toEqual([]);
        expect(condicoes.map((c) => [c.id, c.etapa, c.opcoes])).toEqual([["abordagem_certeza", "F1", ["GRADE", "CERQual", "nenhuma"]]]);
        for (const s of padroes) {
            const mapa = lerMapeamento(raiz, "prisma-sr", s);
            expect(mapa.erros, s).toEqual([]);
            expect([...mapa.linhas.values()].filter((l) => l.condicao).map((l) => l.id), s).toEqual([]);
        }
    });

    it("qualquer resposta deixa os itens 15 e 22 do PRISMA 2020 e o 17 do PRISMA-P no denominador, com a mesma fração", () => {
        const raiz = brinquedo();
        const semResposta = Object.fromEntries(padroes.map((s) => [s, StandardCoverageService.conferir(raiz, s, undefined, projeto("prisma-sr"))]));
        expect(padroes.map((s) => semResposta[s].fracao)).toEqual(["16/42", "12/26", "9/16"]);
        for (const resposta of ["GRADE", "CERQual", "nenhuma"]) {
            const p = projeto("prisma-sr");
            const w = registrarDecisaoDoPesquisador(raiz, p, {
                condicao: "abordagem_certeza", resposta,
                contribuicao: `Abordagem de certeza decidida no protocolo: ${resposta}, pelo desenho dos estudos que esperamos incluir.`,
            });
            expect(w.ok, resposta).toBe(true);
            for (const s of padroes) {
                const r = StandardCoverageService.conferir(raiz, s, undefined, p);
                expect(r.fracao, `${s} com ${resposta}`).toBe(semResposta[s].fracao);
                expect(r.conferencia_por_metodo[0].declaracoes, `${s} com ${resposta}`).toEqual(semResposta[s].conferencia_por_metodo[0].declaracoes);
                expect(r.conferencia_por_metodo[0].condicionais).toEqual([]);
            }
        }
    });
});
