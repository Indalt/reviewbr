import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { Registry } from "../src/registry/loader.js";
import { ProjectStateService, type ProjectState } from "../src/services/project_state.js";
import { lerTrilha, avancarPorArtefato } from "../src/services/method_trail.js";
import { consolidateRaw } from "../src/services/project_artifacts.js";
import { proporEmenda, decidirEmenda } from "../src/services/emendas.js";
import { hashDoArtefato, fechamentoDe } from "../src/services/fechamentos.js";
import {
    lerDecisoesDoMetodo, lerRespostasDoArquivo, congelarDecisoes, conferirEtapa, ARQUIVO_DECISOES,
} from "../src/services/travas_etapa.js";

/**
 * Linha 24 da FILA — travas em código por etapa (pontos 6.2 e 6.3 do pedido do Vicente de 25/11/2026,
 * aprovados em 26/11/2026). Trava 1: decisão antes da etapa, só por emenda. Trava 2: ordem da trilha e
 * insumo conferido por hash. Toda recusa diz o que recusou, a regra do projeto e, se a ação mudaria o
 * projeto, que o caminho é a emenda. O controle positivo é um projeto de teste criado aqui, nunca a
 * pasta de uma pesquisa real.
 */
const MCP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = path.resolve(MCP, "..", "..");
const INDEX = fs.readFileSync(path.join(MCP, "src", "index.ts"), "utf-8");
const registry = Registry.loadDefault();

const TODAS = { quem_decide_triagem: "revisores humanos, por planilha", revisores_por_registro: "dois ou mais", camada_por_palavras: "sim" };

function projeto(over: Partial<ProjectState> = {}): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "travas-etapa-"));
    fs.writeFileSync(path.join(dir, "protocol.md"), "# Protocolo de teste\n\n**Status**: [LOCKED]\n");
    const agora = new Date().toISOString();
    const st: ProjectState = {
        schemaVersion: 1, method: "prisma-sr", framework: "PICOS", reviewType: "teste", topic: "teste", userId: "teste",
        status: "LOCKED", control_level: "fluido", phase: "F2", createdAt: agora, updatedAt: agora, decisions: [], ...over,
    };
    fs.writeFileSync(path.join(dir, "project_state.json"), JSON.stringify(st, null, 2));
    return dir;
}

function grava(dir: string, rel: string, dado: unknown): void {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), JSON.stringify(dado, null, 2));
}

const recusa = (r: ReturnType<typeof conferirEtapa>) => (r.ok ? "" : r.motivo);

/** Projeto travado depois da linha 24, com as respostas dadas na trava, e a busca já com registros. */
function travadoComDecisoes(respostas: Record<string, string | null> = TODAS): string {
    const dir = projeto();
    congelarDecisoes(dir, "prisma-sr", respostas, "F2");
    grava(dir, "01_raw/database_records.json", [{ title: "A", doi: "10.1/a" }, { title: "B", doi: "10.1/b" }]);
    return dir;
}

/** Fecha a deduplicação como a tool faria: grava o artefato e avança pela trilha. */
function fechaF3(dir: string): void {
    expect(conferirEtapa(REPO, dir, "deduplicate_dataset").ok).toBe(true);
    grava(dir, "02_deduplicated/dataset.json", [{ title: "A" }, { title: "B" }]);
    expect(avancarPorArtefato(REPO, dir, "02_deduplicated/dataset.json").ok).toBe(true);
}

describe("linha 24 — o método declara as decisões de etapa e as tools de cada etapa", () => {
    for (const m of ["prisma-sr", "scoping-prisma-scr"]) {
        it(`${m}: cada decisão tem pergunta, o que se decide e a consequência de cada opção`, () => {
            const { decisoes, erros } = lerDecisoesDoMetodo(REPO, m);
            expect(erros).toEqual([]);
            expect(decisoes.map((d) => d.id)).toEqual(["quem_decide_triagem", "revisores_por_registro", "camada_por_palavras"]);
            for (const d of decisoes) for (const o of d.opcoes) expect(o.consequencia.length).toBeGreaterThan(20);
            const f4 = lerTrilha(REPO, m).etapas.find((e) => e.id === "F4")!;
            expect(f4.step_tools).toEqual(["batch_keyword_screen", "batch_db_screen", "record_screening_decisions"]);
        });
    }
});

describe("linha 24, trava 1 — na trava, o pesquisador responde; o que falta não roda", () => {
    it("sem decisoes_etapas.json a trava recusa e mostra as perguntas com o contexto", () => {
        const { decisoes } = lerDecisoesDoMetodo(REPO, "prisma-sr");
        const { erros } = lerRespostasDoArquivo(projeto(), decisoes);
        expect(erros[0]).toMatch(new RegExp(`Falta ${ARQUIVO_DECISOES}`));
        expect(erros[0]).toMatch(/O que se decide:/);
        expect(erros[0]).toMatch(/"revisores humanos, por planilha" — a triagem corre pela record_screening_decisions/);
    });

    it("opção que o método não declara é recusada; null fica a decidir", () => {
        const dir = projeto();
        const { decisoes } = lerDecisoesDoMetodo(REPO, "prisma-sr");
        grava(dir, ARQUIVO_DECISOES, { decisoes: { ...TODAS, camada_por_palavras: "talvez" } });
        expect(lerRespostasDoArquivo(dir, decisoes).erros.join("\n")).toMatch(/"camada_por_palavras": "talvez" não é opção/);
        grava(dir, ARQUIVO_DECISOES, { decisoes: { ...TODAS, camada_por_palavras: null } });
        const ok = lerRespostasDoArquivo(dir, decisoes);
        expect(ok.erros).toEqual([]);
        expect(ok.respostas.camada_por_palavras).toBeNull();
    });

    it("etapa com decisão faltando não roda, e a recusa diz a regra e o caminho da emenda", () => {
        const dir = travadoComDecisoes({ ...TODAS, camada_por_palavras: null });
        fechaF3(dir);
        const m = recusa(conferirEtapa(REPO, dir, "record_screening_decisions"));
        expect(m).toMatch(/RECUSADO: `record_screening_decisions` \(etapa F4/);
        expect(m).toMatch(/Regra do projeto: trava 1/);
        expect(m).toMatch(/camada_por_palavras/);
        expect(m).toMatch(/• "não" — a batch_keyword_screen é recusada/);
        expect(m).toMatch(/mudaria o projeto de pesquisa .* o caminho é a emenda/);
    });

    it("a decisão entra só por emenda aprovada nas palavras do pesquisador; aprovada, a etapa roda", () => {
        const dir = travadoComDecisoes({ ...TODAS, camada_por_palavras: null });
        fechaF3(dir);
        const ruim = proporEmenda(dir, { o_que: "decide a camada", porque: "faltava", decisoes: JSON.stringify({ camada_por_palavras: "talvez" }) }, registry, REPO);
        expect(ruim.ok).toBe(false);
        expect(ruim.mensagem).toMatch(/não é opção/);
        expect(proporEmenda(dir, { o_que: "decide a camada", porque: "faltava", decisoes: JSON.stringify({ camada_por_palavras: "não" }) }, registry, REPO).ok).toBe(true);
        expect(conferirEtapa(REPO, dir, "record_screening_decisions").ok).toBe(false); // proposta não vale
        expect(decidirEmenda(dir, { id: "emenda-1", acao: "aprovar", contribuicao: "ok" }, registry, REPO).ok).toBe(false); // carimbo
        const ap = decidirEmenda(dir, { id: "emenda-1", acao: "aprovar", contribuicao: "sem camada por palavras: os revisores leem tudo" }, registry, REPO);
        expect(ap.ok).toBe(true);
        expect(ProjectStateService.read(dir)!.trava_etapas!.respostas.camada_por_palavras).toMatchObject({ resposta: "não", origem: "emenda-1" });
        expect(conferirEtapa(REPO, dir, "record_screening_decisions").ok).toBe(true);
        expect(fs.readFileSync(path.join(dir, "change_log.md"), "utf-8")).toMatch(/camada_por_palavras = "não"/);
    });

    it("a resposta vale em código: a opção recusa tools e limita parâmetros", () => {
        const dir = travadoComDecisoes({ ...TODAS, camada_por_palavras: "não" });
        fechaF3(dir);
        const ia = recusa(conferirEtapa(REPO, dir, "screen_candidates"));
        expect(ia).toMatch(/a decisão "quem_decide_triagem" é "revisores humanos, por planilha" \(trava\)/);
        expect(ia).toMatch(/o caminho é a emenda/);
        expect(recusa(conferirEtapa(REPO, dir, "batch_keyword_screen"))).toMatch(/"camada_por_palavras" é "não"/);
        const um = recusa(conferirEtapa(REPO, dir, "record_screening_decisions", { parametros: { revisores: ["pesquisador"] } }));
        expect(um).toMatch(/recusou 'revisores' com 1 item\(ns\): .* pede ao menos 2/);
        expect(conferirEtapa(REPO, dir, "record_screening_decisions", { parametros: { revisores: ["pesquisador", "estagiario"] } }).ok).toBe(true);
    });
});

describe("linha 24, trava 2 — ordem da trilha e insumo conferido por hash", () => {
    it("a etapa não roda antes da anterior: sem o artefato da busca, a deduplicação é recusada", () => {
        const dir = projeto();
        congelarDecisoes(dir, "prisma-sr", TODAS, "F2");
        const m = recusa(conferirEtapa(REPO, dir, "deduplicate_dataset"));
        expect(m).toMatch(/a etapa anterior, F2 .* não fechou — o artefato que a encerra \(01_raw\/\) não existe/);
        expect(m).toMatch(/Regra do projeto: trava 2/);
    });

    it("pular etapa: a triagem não roda com a deduplicação por fazer", () => {
        const dir = travadoComDecisoes();
        expect(recusa(conferirEtapa(REPO, dir, "record_screening_decisions"))).toMatch(/a etapa anterior, F3 .* não fechou/);
    });

    it("a anterior fecha quando a seguinte começa, pela regra dela (sob 'estrito', só com a decisão do pesquisador)", () => {
        const dir = travadoComDecisoes();
        ProjectStateService.patch(dir, { control_level: "estrito" });
        expect(recusa(conferirEtapa(REPO, dir, "deduplicate_dataset"))).toMatch(/não pode fechar\. 🚫 RV-04/);
        ProjectStateService.logDecision(dir, { phase: "F2", agent: "t", decision: "d", por: "pesquisador", contribuicao: "as 12 fontes do plano foram buscadas" });
        const r = conferirEtapa(REPO, dir, "deduplicate_dataset");
        expect(r.ok && r.aviso).toMatch(/A etapa F2 .* fechou agora/);
        expect(fechamentoDe(dir, "F2")!.sha256).toBe(hashDoArtefato(dir, "01_raw/"));
    });

    it("etapa fechada não se refaz por fora: busca depois do fechamento é recusada; reabrir é emenda", () => {
        const dir = travadoComDecisoes();
        fechaF3(dir);
        expect(recusa(conferirEtapa(REPO, dir, "search_openalex"))).toMatch(/a etapa F3 já fechou .* rodar a F2 de novo/);
        const de = recusa(conferirEtapa(REPO, dir, "deduplicate_dataset"));
        expect(de).toMatch(/reabrir: "F3"/);
        expect(de).toMatch(/o caminho é a emenda/);
        expect(proporEmenda(dir, { o_que: "refaz a deduplicação", porque: "par errado", reabrir: "F9" }, registry, REPO).ok).toBe(false);
        expect(proporEmenda(dir, { o_que: "refaz a deduplicação", porque: "par errado", reabrir: "F3" }, registry, REPO).ok).toBe(true);
        expect(decidirEmenda(dir, { id: "emenda-1", acao: "aprovar", contribuicao: "refazer a F3: um par foi removido sem ser duplicata" }, registry, REPO).ok).toBe(true);
        expect(conferirEtapa(REPO, dir, "deduplicate_dataset").ok).toBe(true);
    });

    it("insumo editado à mão depois do fechamento é recusado; restaurado, volta a rodar", () => {
        const dir = travadoComDecisoes();
        fechaF3(dir);
        const p = path.join(dir, "02_deduplicated/dataset.json");
        const original = fs.readFileSync(p);
        fs.writeFileSync(p, JSON.stringify([{ title: "A" }], null, 2));
        const m = recusa(conferirEtapa(REPO, dir, "record_screening_decisions"));
        expect(m).toMatch(/02_deduplicated\/dataset\.json mudou depois que a etapa F3 fechou/);
        expect(m).toMatch(/Regra do projeto: trava 2/);
        fs.writeFileSync(p, original);
        expect(conferirEtapa(REPO, dir, "record_screening_decisions").ok).toBe(true);
    });

    it("o hash da pasta da busca não muda com a consolidação da deduplicação, e muda com um registro editado", () => {
        const dir = travadoComDecisoes();
        grava(dir, "01_raw/bvs.json", [{ title: "C", doi: "10.1/c" }]);
        const antes = hashDoArtefato(dir, "01_raw/");
        consolidateRaw(dir);
        expect(hashDoArtefato(dir, "01_raw/")).toBe(antes);
        grava(dir, "01_raw/bvs.json", [{ title: "C editado", doi: "10.1/c" }]);
        expect(hashDoArtefato(dir, "01_raw/")).not.toBe(antes);
    });

    it("insumo passado pelo chamador não entra", () => {
        const dir = travadoComDecisoes();
        fechaF3(dir);
        expect(recusa(conferirEtapa(REPO, dir, "record_screening_decisions", { insumoDoChamador: "passado em 'candidates'" })))
            .toMatch(/recusou o insumo passado em 'candidates'/);
    });

    it("projeto travado antes da linha 24: as travas valem das etapas depois da fase em que ele está", () => {
        const emF4 = projeto({ phase: "F4" });
        expect(conferirEtapa(REPO, emF4, "record_screening_decisions").ok).toBe(true);
        expect(recusa(conferirEtapa(REPO, emF4, "batch_llm_extract"))).toMatch(/a etapa anterior, F4 .* não fechou/);
        const emF3 = projeto({ phase: "F3" });
        expect(recusa(conferirEtapa(REPO, emF3, "record_screening_decisions"))).toMatch(/Regra do projeto: trava 1/);
    });

    it("rascunho, tool fora da trilha e chamada sem projeto não passam pelas travas", () => {
        expect(conferirEtapa(REPO, projeto({ status: "DRAFT" }), "deduplicate_dataset").ok).toBe(true);
        expect(conferirEtapa(REPO, travadoComDecisoes(), "verify_references").ok).toBe(true);
    });
});

describe("linha 24 — as tools de etapa chamam a conferência antes de rodar", () => {
    for (const tool of ["deduplicate_dataset", "screen_candidates", "batch_keyword_screen", "batch_db_screen", "record_screening_decisions", "batch_llm_extract", "rag_index_corpus"]) {
        it(tool, () => expect(INDEX).toContain(`travaDaEtapa(params.projectPath, "${tool}"`));
    }
    it("as buscas, pelo checkDesignGuardrail", () => expect(INDEX).toMatch(/const etapa = travaDaEtapa\(projectPath, tool, \{ parametros: params \}\)/));
    it("a trava do protocolo pede as decisões e as congela; a emenda as recebe", () => {
        expect(INDEX).toContain("lerRespostasDoArquivo(projectDir, decMetodo.decisoes)");
        expect(INDEX).toContain("congelarDecisoes(projectDir, metodoProj, decProj.respostas");
        expect(INDEX).toContain("decisoes: params.decisoes, reabrir: params.reabrir }, registry, RAIZ())");
    });
});
