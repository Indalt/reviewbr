import { describe, it, expect, afterAll } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { StandardCoverageService, CONFERENCIA_POR_PALAVRAS, LIMITE_DA_CONFERENCIA } from "../src/services/standard_coverage.js";
import { lerMapeamento, impressaoDosPares } from "../src/services/method_mapping.js";

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.slice(1)), "..", "..", "..");

/**
 * DEBT-149, decisão de 05/11/2026 (B1, ponto a) — a conferência por palavras sai da trava. Medida por
 * trocas propositais, ela percebe 3,4% no PRISMA-S; e acusava como erro pares que a leitura do
 * enunciado confirma, o que travava os projetos de escopo na F8. Agora o suspeito dela é pedido de
 * leitura a quem assimila: não reprova, não contesta, não tira item do porquê da etapa; e o relatório
 * diz o que ela é e quanto enxerga, com a medida e a fonte gravadas no mapeamento do método.
 */

const temporarios: string[] = [];
afterAll(() => { for (const d of temporarios) fs.rmSync(d, { recursive: true, force: true }); });
const escrever = (p: string, v: unknown) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(v, null, 2)); };

const MEDIDA = {
    medida_em: "2026-10-31", script: ".claude/maintenance/mede.mjs", pares_medidos: 2, impressao: "",
    trocas: { plantadas: 40, percebidas: 3 },
    erros_conhecidos: { total: 4, percebidos: 1, fonte: "achado de teste" },
};

/**
 * Brinquedo de 3 linhas em que a ÚNICA coisa que a conferência acharia é um suspeito: o subitem
 * "Financiamento" apontado para "Registration" casa com "Support" pela tabela de equivalências.
 * Sem omissão, sem ponteiro inexistente, sem declaração dupla.
 */
function brinquedo(opcoes: { medida?: unknown; titulos?: boolean } = {}): string {
    const raiz = fs.mkdtempSync(path.join(os.tmpdir(), "palavras-"));
    temporarios.push(raiz);
    const c = (p: string) => path.join(raiz, ".claude", p);
    fs.mkdirSync(c("agents"), { recursive: true });
    fs.writeFileSync(c("agents/designer.md"), "# designer\n");
    escrever(c("standards/teste.json"), {
        schemaVersion: 1, id: "TESTE", name: "Padrão Teste", version: "1", titulos_oficiais: opcoes.titulos ?? true,
        items: [{ id: "1", title: "Registration" }, { id: "2", title: "Support" }, { id: "3", title: "Peer review" }],
    });
    escrever(c("methodologies/m1/manifest.json"), {
        id: "m1", spec: "spec.md", conformance: { standards: ["teste"] },
        phases: [{ id: "E1", name: "Desenho", role: "designer", closes_with: "protocol.md", producer_tools: ["plan_research_protocol"] }],
    });
    fs.writeFileSync(c("methodologies/m1/spec.md"), [
        "| Subitem | Campo | Descrição | Obrigatório | Item |", "|---|---|---|---|---|",
        "| E1.1 | Financiamento | agência | ✅ | Item 1 |",
        "| E1.2 | Support recebido | quem apoiou | ✅ | Item 2 |",
    ].join("\n") + "\n");
    const items = [
        { id: "1", covered_by: ["E1.1"] },
        { id: "2", covered_by: ["E1.2"] },
        { id: "3", nao_coberto: "a trilha não registra revisão por pares" },
    ];
    const mapa: Record<string, unknown> = { schemaVersion: 1, standard: "teste", items };
    if (opcoes.medida) mapa.conferencia_por_palavras = opcoes.medida;
    escrever(c("methodologies/m1/conformance/teste.json"), mapa);
    return raiz;
}

/** A impressão dos pares do brinquedo, pela mesma função que o relatório usa. */
const impressaoDoBrinquedo = () => impressaoDosPares(lerMapeamento(brinquedo(), "m1", "teste").linhas).impressao;

describe("o suspeito da conferência por palavras não reprova (DEBT-149)", () => {
    const r = StandardCoverageService.conferir(brinquedo(), "teste");
    const c = r.conferencia_por_metodo[0];

    it("controle positivo: a conferência roda e acusa o suspeito — o verde abaixo não é por ela ter ficado cega", () => {
        expect(c.conferencia_por_palavras.suspeitos.map((s) => `${s.subitem}→${s.item_declarado}:${s.item_sugerido}`)).toEqual(["E1.1→1:2"]);
        expect(c.conferencia_por_palavras.pares_conferidos).toBe(2);
    });

    it("com o suspeito como única coisa achada, o relatório é válido: nenhum erro, nenhuma linha contestada", () => {
        expect(r.errors).toEqual([]);
        expect(r.valid).toBe(true);
        expect(r.contestados).toEqual([]);
        expect(r.fracao).toBe("2/3");
    });

    it("o suspeito vai aos avisos, como pedido de leitura a quem assimila", () => {
        expect(r.avisos.join(" ")).toMatch(/\[m1\] 1 par\(es\) suspeito\(s\) pela conferência por palavras — pedido de leitura a quem assimila, que não reprova nem contesta: E1\.1→1 \(sugere 2\)/);
    });

    it("o porquê da etapa inclui o item que só o suspeito tirava", () => {
        expect(c.itens_por_etapa).toEqual({ E1: ["1", "2"] });
    });

    it("o checklist do pesquisador não marca a linha do suspeito como contestada", () => {
        const md = StandardCoverageService.checklist(brinquedo(), "teste");
        expect(md.split("\n").find((l) => /^\| 1 \|/.test(l))).not.toMatch(/CONTESTADO/);
        expect(md).toMatch(/\*\*Fração:\*\* 2\/3 — correspondência declarada pelo mapeamento do método e não contestada/);
        expect(md).not.toMatch(/Premissa da falsificação|Fração conferida/);
    });
});

describe("o relatório diz o que a conferência é e quanto enxerga, com a medida e a fonte", () => {
    it("a medida gravada no mapeamento chega ao relatório (o zod não a remove) e é citada com data e script", () => {
        const medida = { ...MEDIDA, impressao: impressaoDoBrinquedo() };
        const c = StandardCoverageService.conferir(brinquedo({ medida }), "teste").conferencia_por_metodo[0];
        expect(c.conferencia_por_palavras.medida).toEqual({ ...medida, do_mapeamento_atual: true });
        expect(c.conferencia_por_palavras.quanto_enxerga).toBe(
            "Medida em 31/10/2026 por .claude/maintenance/mede.mjs, sobre este mapeamento (2 pares): percebeu 3 de 40 trocas propositais (7,5%) " +
            "— cada subitem mapeado posto, numa cópia, em cada outro item; nos erros reais conhecidos, 1 de 4 (achado de teste).",
        );
    });

    it("mapeamento que mudou depois da medida: a medida é dita de outra versão, e o aviso pede para refazê-la", () => {
        const raiz = brinquedo({ medida: { ...MEDIDA, impressao: impressaoDoBrinquedo() } });
        const arq = path.join(raiz, ".claude", "methodologies", "m1", "conformance", "teste.json");
        const mapa = JSON.parse(fs.readFileSync(arq, "utf-8"));
        mapa.items[1].covered_by = ["E1.1", "E1.2"];   // um ponteiro a mais, depois da medida
        fs.writeFileSync(arq, JSON.stringify(mapa));
        const r = StandardCoverageService.conferir(raiz, "teste");
        const c = r.conferencia_por_metodo[0];
        expect(c.conferencia_por_palavras.medida?.do_mapeamento_atual).toBe(false);
        expect(c.conferencia_por_palavras.quanto_enxerga).toMatch(/sobre uma versão ANTERIOR deste mapeamento \(2 pares então, 3 hoje, e os pares mudaram\) — não vale como medida do de hoje/);
        expect(r.avisos.join(" ")).toMatch(/\[m1\] A medida da conferência por palavras é de antes da última mudança do mapeamento: refaça-a \(\.claude\/maintenance\/mede\.mjs\)/);
    });

    it("troca de ponteiro com o mesmo número de pares também é mudança — a impressão a pega", () => {
        const raiz = brinquedo({ medida: { ...MEDIDA, impressao: impressaoDoBrinquedo() } });
        const arq = path.join(raiz, ".claude", "methodologies", "m1", "conformance", "teste.json");
        const mapa = JSON.parse(fs.readFileSync(arq, "utf-8"));
        [mapa.items[0].covered_by, mapa.items[1].covered_by] = [mapa.items[1].covered_by, mapa.items[0].covered_by];
        fs.writeFileSync(arq, JSON.stringify(mapa));
        expect(StandardCoverageService.conferir(raiz, "teste").conferencia_por_metodo[0].conferencia_por_palavras.medida?.do_mapeamento_atual).toBe(false);
    });

    it("sem medida, diz que não se sabe quanto ela enxerga", () => {
        const c = StandardCoverageService.conferir(brinquedo(), "teste").conferencia_por_metodo[0];
        expect(c.conferencia_por_palavras.medida).toBeNull();
        expect(c.conferencia_por_palavras.quanto_enxerga).toMatch(/^Sem medida neste mapeamento: não se sabe quanto a conferência por palavras enxerga aqui/);
    });

    it("medida sem número ou com mais percebidas que plantadas é mapeamento ilegível — e isso reprova", () => {
        for (const ruim of [{ ...MEDIDA, trocas: undefined, erros_conhecidos: undefined }, { ...MEDIDA, trocas: { plantadas: 2, percebidas: 3 } }]) {
            const r = StandardCoverageService.conferir(brinquedo({ medida: { ...ruim, impressao: "0".repeat(64) } }), "teste");
            expect(r.valid).toBe(false);
            expect(r.errors.join(" ")).toMatch(/mapeamento \.claude\/methodologies\/m1\/conformance\/teste\.json: conferencia_por_palavras/);
        }
    });

    it("o que ela é vai escrito no relatório, e o texto velho, que afirmava capacidade, não volta", () => {
        const r = StandardCoverageService.conferir(brinquedo(), "teste");
        expect(r.conferencia_por_palavras).toBe(CONFERENCIA_POR_PALAVRAS);
        expect(r.conferencia_por_palavras).toMatch(/pedido de leitura a quem assimila a metodologia: não reprova, não contesta a linha e não tira item do porquê da etapa/);
        expect(r.conferencia_por_palavras).toMatch(/derrotável/);
        expect(r.limite).toBe(LIMITE_DA_CONFERENCIA);
        expect(r.limite).toMatch(/feita ao assimilar a metodologia, e não a cada estudo/);
        expect(r.limite).toMatch(/conferida só no que é mecânico/);
        // Asserção negativa: as frases e os campos de antes não podem passar verdes.
        const tudo = JSON.stringify(r) + StandardCoverageService.checklist(brinquedo(), "teste");
        expect(tudo).not.toMatch(/com_poder|motivo_sem_poder|SEM PODER|premissa_da_falsificacao|o sistema falsifica|tratado como DESLOCAMENTO/);
    });
});

describe("sem título oficial, o porquê da etapa não sai e o relatório reprova — pelo título, não pela conferência", () => {
    const r = StandardCoverageService.conferir(brinquedo({ titulos: false }), "teste");

    it("reprova com o motivo do título, uma vez, e o porquê de cada etapa fica vazio", () => {
        expect(r.valid).toBe(false);
        expect(r.errors).toEqual([expect.stringMatching(/^Os títulos dos itens de Padrão Teste não foram transcritos da fonte oficial \(titulos_oficiais: false/)]);
        expect(r.conferencia_por_metodo[0].itens_por_etapa).toEqual({});
    });

    it("a fração é a mesma que com título oficial: título fora da fonte não contesta linha", () => {
        expect(r.fracao).toBe("2/3");
        expect(r.contestados).toEqual([]);
    });
});

describe("os mapeamentos reais: cada padrão declarado tem a medida dele, do mapeamento de hoje", () => {
    const DECLARADOS: Array<[string, string, RegExp]> = [
        ["prisma-sr", "prisma-s", /percebeu 30 de 825 trocas propositais \(3,6%\).*nos erros reais conhecidos, 2 de 58/],
        ["prisma-sr", "prisma-p", /percebeu 284 de 1966 trocas propositais \(14,4%\)/],
        ["prisma-sr", "prisma-2020", /nos erros reais conhecidos, 15 de 23 .*sem esses, 12 de 19/],
        ["scoping-prisma-scr", "prisma-scr", /percebeu 357 de 2730 trocas propositais \(13,1%\)/],
        ["scoping-prisma-scr", "prisma-s", /percebeu 30 de 825 trocas propositais \(3,6%\)/],
    ];
    for (const [m, p, numeros] of DECLARADOS) {
        it(`${m} × ${p}: a medida é do mapeamento de hoje e sai no relatório, com data e script`, () => {
            const c = StandardCoverageService.conferir(REPO, p, m).conferencia_por_metodo[0];
            expect(c.conferencia_por_palavras.medida?.do_mapeamento_atual, `${m}/${p}: refaça a medida`).toBe(true);
            expect(c.conferencia_por_palavras.quanto_enxerga).toMatch(/^Medida em \d\d\/\d\d\/2026 por \.claude\/maintenance\/sessao_2c\/[\w/]+\.mjs, sobre este mapeamento/);
            expect(c.conferencia_por_palavras.quanto_enxerga).toMatch(numeros);
            expect(fs.existsSync(path.join(REPO, c.conferencia_por_palavras.medida!.script)), "o script citado existe").toBe(true);
        });
    }

    it("nenhum suspeito entra nos erros de padrão algum", () => {
        for (const p of ["prisma-2020", "prisma-p", "prisma-s", "prisma-scr"]) {
            expect(StandardCoverageService.conferir(REPO, p).errors.join(" "), p).not.toMatch(/suspeito/);
        }
    });
});
