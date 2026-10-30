import { describe, it, expect, afterAll } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { StandardCoverageService } from "../src/services/standard_coverage.js";
import { StandardsService } from "../src/services/standards.js";
import { lerMapeamento } from "../src/services/method_mapping.js";
import { registrarDecisaoDoPesquisador, lerCondicoes } from "../src/services/method_trail.js";
import { ProjectStateService } from "../src/services/project_state.js";

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.slice(1)), "..", "..", "..");

/**
 * DEBT-142 — o mapeamento padrão → subitens e as declarações [NÃO COBERTO]/[NÃO SE APLICA]
 * moravam no arquivo do PADRÃO, compartilhado por todo método que o declara. Decisão do
 * pesquisador em 17/10/2026: "cada metodologia com as suas regras"; e o item que depende da
 * pesquisa: "o método declara a condição, o projeto responde".
 */

const temporarios: string[] = [];
afterAll(() => { for (const d of temporarios) fs.rmSync(d, { recursive: true, force: true }); });
const tmp = (prefixo: string) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), prefixo)); temporarios.push(d); return d; };
const escrever = (p: string, conteudo: unknown) => {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, typeof conteudo === "string" ? conteudo : JSON.stringify(conteudo));
};

/**
 * Repositório de brinquedo com o caso do DEBT-142: o padrão "busca", declarado por dois métodos
 * de trilhas DIFERENTES — "sr" (etapas F1, F2) e "qual" (etapa C1) —, cada um com o seu mapeamento.
 */
function repo(): string {
    const raiz = tmp("por-metodo-");
    const c = (p: string) => path.join(raiz, ".claude", p);
    for (const a of ["designer", "librarian"]) escrever(c(`agents/${a}.md`), `# ${a}\n`);
    escrever(c("standards/busca.json"), {
        schemaVersion: 1, id: "BUSCA", name: "Padrão de Busca", version: "1", titulos_oficiais: true,
        items: [
            { id: "1", section: "", title: "Database name" },
            { id: "2", section: "", title: "Search strategy" },
            { id: "3", section: "", title: "Peer review" },
        ],
    });
    escrever(c("methodologies/sr/manifest.json"), {
        id: "sr", spec: "spec.md", conformance: { standards: ["busca"] },
        phases: [
            { id: "F1", name: "Protocolo", role: "designer", closes_with: "protocol.md", producer_tools: ["plan_research_protocol"] },
            { id: "F2", name: "Busca", role: "librarian", closes_with: "01_raw/", producer_tools: [] },
        ],
    });
    escrever(c("methodologies/sr/spec.md"), [
        "| Subitem | Campo | Descrição | Obrigatório | Item |", "|---|---|---|---|---|",
        "| F2.1.1 | Nome da base | onde se buscou | ✅ | Item 1 |",
        "| F2.1.2 | Estratégia de busca | a string exata | ✅ | Item 2 |",
    ].join("\n") + "\n");
    escrever(c("methodologies/sr/conformance/busca.json"), {
        schemaVersion: 1, standard: "busca", items: [
            { id: "1", covered_by: ["F2.1.1"] },
            { id: "2", covered_by: ["F2.1.2"] },
            { id: "3", covered_by: [], nao_coberto: "a trilha não registra a revisão por pares da busca" },
        ],
    });
    escrever(c("methodologies/qual/manifest.json"), {
        id: "qual", spec: "spec.md", conformance: { standards: ["busca"] },
        phases: [{ id: "C1", name: "Corpus", role: "designer", closes_with: "corpus.md", producer_tools: [] }],
    });
    escrever(c("methodologies/qual/spec.md"), [
        "| Subitem | Campo | Descrição | Obrigatório |", "|---|---|---|---|",
        "| C1.1 | Base consultada | arquivo ou acervo | ✅ |",
        "| C1.2 | Estratégia de busca | como o corpus foi reunido | ✅ |",
    ].join("\n") + "\n");
    escrever(c("methodologies/qual/conformance/busca.json"), {
        schemaVersion: 1, standard: "busca", items: [
            { id: "1", covered_by: ["C1.1"] },
            { id: "2", covered_by: ["C1.2"] },
            { id: "3", nao_se_aplica: "o desenho não prevê revisão da busca por pares" },
        ],
    });
    return raiz;
}

const metodo = (r: ReturnType<typeof StandardCoverageService.conferir>, m: string) => r.conferencia_por_metodo.find((c) => c.metodologia === m)!;

describe("DEBT-142 — dois métodos de trilhas diferentes declaram o mesmo padrão, sem um quebrar o outro", () => {
    it("cada um é conferido contra o SEU mapeamento: nada contestado, fração e denominador de cada um", () => {
        const r = StandardCoverageService.conferir(repo(), "busca");
        expect(r.declarado_por).toEqual(["qual", "sr"]);
        expect(r.contestados).toEqual([]);
        for (const m of ["qual", "sr"]) expect(metodo(r, m).subitens_inexistentes, m).toEqual([]);
        // [NÃO SE APLICA] é do qual; no sr o item 3 é [NÃO COBERTO] e fica no denominador.
        expect(r.fracao).toBe("qual 2/2 · sr 2/3");
        expect(metodo(r, "qual").declaracoes).toEqual({ orphans: [], nao_coberto: [], nao_se_aplica: ["3"] });
        expect(metodo(r, "sr").declaracoes).toEqual({ orphans: [], nao_coberto: ["3"], nao_se_aplica: [] });
        expect(metodo(r, "sr").mapeamento).toEqual({ arquivo: ".claude/methodologies/sr/conformance/busca.json", existe: true });
        expect(r.valid).toBe(true);
    });

    it("mudar o mapeamento de um não muda a conferência do outro", () => {
        const raiz = repo();
        const antes = metodo(StandardCoverageService.conferir(raiz, "busca"), "qual");
        escrever(path.join(raiz, ".claude", "methodologies", "sr", "conformance", "busca.json"), {
            schemaVersion: 1, standard: "busca", items: [{ id: "1", covered_by: ["F2.1.1"] }],
        });
        const depois = StandardCoverageService.conferir(raiz, "busca");
        expect(metodo(depois, "qual")).toEqual(antes);
        expect(metodo(depois, "sr").fracao).toBe("1/3");
    });

    it("controle: com o mapeamento de um só para os dois — como era no arquivo do padrão — o segundo é todo contestado", () => {
        const raiz = repo();
        fs.copyFileSync(
            path.join(raiz, ".claude", "methodologies", "sr", "conformance", "busca.json"),
            path.join(raiz, ".claude", "methodologies", "qual", "conformance", "busca.json"),
        );
        const q = metodo(StandardCoverageService.conferir(raiz, "busca"), "qual");
        expect(q.subitens_inexistentes).toEqual([{ item: "1", subitem: "F2.1.1" }, { item: "2", subitem: "F2.1.2" }]);
        expect(q.contestados.map((x) => x.item)).toEqual(["1", "2"]);
    });

    it("método que declara o padrão e não tem o mapeamento dele reprova, com o caminho do arquivo que falta", () => {
        const raiz = repo();
        fs.rmSync(path.join(raiz, ".claude", "methodologies", "qual", "conformance", "busca.json"));
        const r = StandardCoverageService.conferir(raiz, "busca");
        expect(r.valid).toBe(false);
        expect(r.errors.join(" ")).toMatch(/\[qual\] "qual" declara "busca" e não tem o mapeamento dele \(\.claude\/methodologies\/qual\/conformance\/busca\.json\)/);
        expect(metodo(r, "qual").declaracoes.orphans).toEqual(["1", "2", "3"]);
    });

    it("o arquivo do padrão com mapeamento dentro é recusado — ponteiro ali seria ignorado em silêncio", () => {
        const raiz = repo();
        const sp = path.join(raiz, ".claude", "standards", "busca.json");
        const std = JSON.parse(fs.readFileSync(sp, "utf-8"));
        std.items[0].covered_by = ["F2.1.1"];
        fs.writeFileSync(sp, JSON.stringify(std));
        expect(StandardsService.read(raiz, "busca")).toBeNull();
        expect(StandardCoverageService.conferir(raiz, "busca").errors[0]).toMatch(/com mapeamento dentro.*DEBT-142/);
    });

    it("o checklist é de UM método: com dois declarando, sem escolher, recusa e diz quais", () => {
        const raiz = repo();
        expect(StandardCoverageService.checklist(raiz, "busca")).toMatch(/^ERRO: "busca" é declarado por 2 métodos \(qual, sr\)/);
        const linha3 = (m: string) => StandardCoverageService.checklist(raiz, "busca", m).split("\n").find((l) => /^\| 3 \|/.test(l))!;
        expect(linha3("qual")).toMatch(/\[NÃO SE APLICA\].*\| N\/A \|$/);
        expect(linha3("sr")).toMatch(/\[NÃO COBERTO\].*\| ☐ \|$/);
    });
});

/** O sr declara a condição; o item 3 do padrão só se aplica quando a busca passou por revisão por pares. */
function comCondicao(): string {
    const raiz = repo();
    const mp = path.join(raiz, ".claude", "methodologies", "sr", "manifest.json");
    const man = JSON.parse(fs.readFileSync(mp, "utf-8"));
    man.condicoes = [{
        id: "revisao_por_pares", pergunta: "A estratégia de busca passou por revisão por pares?", etapa: "F2", opcoes: ["sim", "não"],
    }];
    fs.writeFileSync(mp, JSON.stringify(man));
    escrever(path.join(raiz, ".claude", "methodologies", "sr", "conformance", "busca.json"), {
        schemaVersion: 1, standard: "busca", items: [
            { id: "1", covered_by: ["F2.1.1"] },
            { id: "2", covered_by: ["F2.1.2"] },
            { id: "3", covered_by: [], nao_coberto: "a trilha não registra a revisão por pares da busca", condicao: { id: "revisao_por_pares", aplica_se: ["sim"] } },
        ],
    });
    return raiz;
}

function projeto(raiz: string, method = "sr"): string {
    const p = tmp("projeto-condicao-");
    ProjectStateService.init(p, { method, framework: "x", reviewType: "x", topic: "t", phase: "F1" });
    return p;
}

const responder = (raiz: string, p: string, resposta: string, contribuicao = "A busca não passou por revisão por pares: a equipe tem um só bibliotecário, e isso vai declarado.") =>
    registrarDecisaoDoPesquisador(raiz, p, { condicao: "revisao_por_pares", resposta, contribuicao });

describe("DEBT-142 — item condicional: o método declara a condição, o projeto responde", () => {
    it("o método declara a condição, e ela é lida da trilha dele", () => {
        expect(lerCondicoes(comCondicao(), "sr")).toEqual({
            condicoes: [{ id: "revisao_por_pares", pergunta: "A estratégia de busca passou por revisão por pares?", etapa: "F2", opcoes: ["sim", "não"], note: "" }],
            erros: [],
        });
    });

    it("sem projeto, o item conta como o método o declarou — e vai apontado como pendente", () => {
        const r = StandardCoverageService.conferir(comCondicao(), "busca", "sr");
        expect(r.fracao).toBe("2/3");
        expect(r.conferencia_por_metodo[0].condicionais).toEqual([{
            item: "3", condicao: "revisao_por_pares", pergunta: "A estratégia de busca passou por revisão por pares?", etapa: "F2",
            aplica_se: ["sim"], resposta: null, aplica: null, respondida_em: "",
        }]);
        expect(r.avisos.join(" ")).toMatch(/sem resposta — sem projectPath: 3 \(revisao_por_pares\)/);
    });

    it("projeto que ainda não respondeu: igual, e o aviso diz que falta a resposta do projeto", () => {
        const raiz = comCondicao();
        const r = StandardCoverageService.conferir(raiz, "busca", undefined, projeto(raiz));
        expect(r.fracao).toBe("2/3");
        expect(r.avisos.join(" ")).toMatch(/sem resposta do projeto: 3/);
    });

    it("resposta 'não', gravada como decisão do pesquisador: o item sai do denominador, com o motivo", () => {
        const raiz = comCondicao();
        const p = projeto(raiz);
        const w = responder(raiz, p, "Não");
        expect(w.ok).toBe(true);
        const d = ProjectStateService.read(p)!.decisions[0];
        // A opção é gravada como o método a escreve, não como chegou.
        expect(d).toMatchObject({ phase: "F2", por: "pesquisador", condicao: { id: "revisao_por_pares", resposta: "não" } });

        const r = StandardCoverageService.conferir(raiz, "busca", undefined, p);
        expect(r.fracao).toBe("2/2");
        expect(r.nao_se_aplica.map((x) => x.id)).toEqual(["3"]);
        expect(r.nao_se_aplica[0].motivo).toMatch(/condição "revisao_por_pares" respondida "não" pelo pesquisador em .*: o método só aplica este item com sim/);
        expect(r.conferencia_por_metodo[0].condicionais[0]).toMatchObject({ resposta: "não", aplica: false });
        expect(r.valid).toBe(true);
        const linha3 = StandardCoverageService.checklist(raiz, "busca", undefined, p).split("\n").find((l) => /^\| 3 \|/.test(l))!;
        expect(linha3).toMatch(/\[NÃO SE APLICA\]\*\* condição "revisao_por_pares" respondida "não".*\| N\/A \|$/);
    });

    it("responder a condição NÃO é decidir sobre a etapa: não destrava nem avança", () => {
        const raiz = comCondicao();
        const p = projeto(raiz);
        fs.mkdirSync(path.join(p, "01_raw"), { recursive: true });
        fs.writeFileSync(path.join(p, "01_raw", "busca.json"), "[]");   // o artefato da F2 existe
        expect(responder(raiz, p, "não").ok).toBe(true);
        expect(ProjectStateService.podeAvancar(p, "F2").ok).toBe(false);
        expect(ProjectStateService.read(p)!.phase).toBe("F1");
    });

    it("a última resposta vale: 'sim' depois de 'não' devolve o item ao denominador, como o método o declarou", () => {
        const raiz = comCondicao();
        const p = projeto(raiz);
        responder(raiz, p, "não");
        responder(raiz, p, "sim", "Refizemos: a estratégia passou pela revisão PRESS de uma bibliotecária externa.");
        const r = StandardCoverageService.conferir(raiz, "busca", undefined, p);
        expect(r.fracao).toBe("2/3");
        expect(r.nao_coberto.map((x) => x.id)).toEqual(["3"]);
        expect(r.conferencia_por_metodo[0].condicionais[0]).toMatchObject({ resposta: "sim", aplica: true });
        expect(ProjectStateService.read(p)!.decisions).toHaveLength(2);   // registro cumulativo, não edição
    });

    it("recusa na escrita, sem gravar: carimbo, resposta fora das opções, condição que o método não declara, etapa trocada", () => {
        const raiz = comCondicao();
        const p = projeto(raiz);
        expect(responder(raiz, p, "não", "ok").mensagem).toMatch(/carimbo não é decisão/);
        expect(responder(raiz, p, "talvez").mensagem).toMatch(/"talvez" não é resposta da condição "revisao_por_pares".*"sim", "não"/);
        expect(registrarDecisaoDoPesquisador(raiz, p, { condicao: "metanalise", resposta: "sim", contribuicao: "fizemos metanálise de efeitos aleatórios" }).mensagem)
            .toMatch(/não declara a condição "metanalise".*revisao_por_pares/);
        expect(registrarDecisaoDoPesquisador(raiz, p, { etapa: "F1", condicao: "revisao_por_pares", resposta: "não", contribuicao: "sem revisão por pares nesta busca" }).mensagem)
            .toMatch(/perguntada pelo método na etapa F2, não em F1/);
        expect(ProjectStateService.read(p)!.decisions).toEqual([]);
    });

    it("o projeto é de um método: conferido a pedido contra outro, vale o do projeto — e isso é dito", () => {
        const raiz = comCondicao();
        const p = projeto(raiz);
        responder(raiz, p, "não");
        const r = StandardCoverageService.conferir(raiz, "busca", "qual", p);
        expect(r.conferencia_por_metodo.map((c) => c.metodologia)).toEqual(["sr"]);
        expect(r.errors[0]).toMatch(/O projeto é do método "sr", não de "qual"/);
    });

    it("mapeamento que condiciona item a condição não declarada, ou a resposta que ela não oferece, reprova", () => {
        const raiz = comCondicao();
        escrever(path.join(raiz, ".claude", "methodologies", "sr", "conformance", "busca.json"), {
            schemaVersion: 1, standard: "busca", items: [
                { id: "1", covered_by: ["F2.1.1"], condicao: { id: "fantasma", aplica_se: ["sim"] } },
                { id: "2", covered_by: ["F2.1.2"], condicao: { id: "revisao_por_pares", aplica_se: ["talvez"] } },
                { id: "3", nao_se_aplica: "x", condicao: { id: "revisao_por_pares", aplica_se: ["sim"] } },
            ],
        });
        const erros = lerMapeamento(raiz, "sr", "busca").erros.join(" | ");
        expect(erros).toMatch(/o item 1 depende da condição "fantasma"/);
        expect(erros).toMatch(/o item 2 aplica-se com resposta que a condição "revisao_por_pares" não oferece — talvez/);
        expect(erros).toMatch(/o item 3 é condicional e declarado \[NÃO SE APLICA\] ao mesmo tempo/);
    });
});

describe("DEBT-142 — o estado real: os padrões guardam só a norma; o mapeamento é de cada método", () => {
    const padroes = StandardsService.list(REPO);

    it("nenhum arquivo de .claude/standards/ traz covered_by, nao_coberto ou nao_se_aplica", () => {
        const comMapeamento: string[] = [];
        for (const id of padroes) {
            const bruto = JSON.parse(fs.readFileSync(path.join(REPO, ".claude", "standards", `${id}.json`), "utf-8"));
            for (const i of bruto.items) for (const k of ["covered_by", "nao_coberto", "nao_se_aplica"]) if (k in i) comMapeamento.push(`${id}/${i.id}.${k}`);
            expect(StandardsService.read(REPO, id), id).not.toBeNull();
        }
        expect(comMapeamento).toEqual([]);
    });

    it("todo método tem o mapeamento de cada padrão que declara, legível e com ids do padrão", () => {
        const base = path.join(REPO, ".claude", "methodologies");
        const problemas: string[] = [];
        for (const m of fs.readdirSync(base)) {
            const man = JSON.parse(fs.readFileSync(path.join(base, m, "manifest.json"), "utf-8"));
            for (const s of man.conformance?.standards ?? []) {
                const mapa = lerMapeamento(REPO, m, s, StandardsService.read(REPO, s));
                if (!mapa.existe) problemas.push(`${m}/${s}: sem mapeamento`);
                problemas.push(...mapa.erros);
            }
            problemas.push(...lerCondicoes(REPO, m).erros.map((e) => `${m}: ${e}`));
        }
        expect(problemas).toEqual([]);
    });
});
