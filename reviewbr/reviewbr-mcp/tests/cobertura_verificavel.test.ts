import { describe, it, expect, afterAll } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { StandardCoverageService, CONFERENCIA_POR_PALAVRAS } from "../src/services/standard_coverage.js";
import { StandardsService } from "../src/services/standards.js";
import { lerMapeamento } from "../src/services/method_mapping.js";

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.slice(1)), "..", "..", "..");

/**
 * DEBT-140 — a cobertura de um padrão era VERDE POR CONSTRUÇÃO: só se testava se `covered_by`
 * estava vazio, e `covered_by` é dado fixo — a resposta era a mesma para qualquer projeto. Foi
 * assim que o PRISMA-P saiu 26/26 quando o honesto é 12/26.
 *
 * Agora quatro conferências: (a) o subitem existe na spec do método; (b) a conferência por
 * palavras, que desde 05/11/2026 é ajuda para quem assimila e não trava (DEBT-149 — o detalhe está
 * em conferencia_por_palavras.test.ts); (c) alguma tool produz o artefato da etapa; (d) a ausência
 * está declarada — [NÃO COBERTO] ou [NÃO SE APLICA] —, nunca silenciosa.
 */

const temporarios: string[] = [];
afterAll(() => { for (const d of temporarios) fs.rmSync(d, { recursive: true, force: true }); });

/** Repositório de brinquedo: um padrão de 8 linhas, um método que o declara, a trilha e o mapeamento desse método. */
function repo(titulosOficiais = true): string {
    const raiz = fs.mkdtempSync(path.join(os.tmpdir(), "cobertura-"));
    temporarios.push(raiz);
    const c = (p: string) => path.join(raiz, ".claude", p);
    for (const d of ["agents", "standards", "methodologies/m1/conformance"]) fs.mkdirSync(c(d), { recursive: true });
    for (const a of ["designer", "analyst"]) fs.writeFileSync(c(`agents/${a}.md`), `# ${a}\n`);
    const item = (id: string, title: string) => ({ id, section: "", title });
    fs.writeFileSync(c("standards/teste.json"), JSON.stringify({
        schemaVersion: 1, id: "TESTE", name: "Padrão Teste", version: "1", titulos_oficiais: titulosOficiais,
        items: [
            item("1", "Registration"), item("2", "Support"), item("3", "Availability of data"), item("4", "Protocol amendments"),
            item("5", "Peer review"), item("6", "Meta-analysis"), item("7", "Limitations"), item("8", "Supplementary material"),
        ],
    }));
    // DEBT-142: o mapeamento é do método, não do padrão.
    fs.writeFileSync(c("methodologies/m1/conformance/teste.json"), JSON.stringify({
        schemaVersion: 1, standard: "teste",
        items: [
            { id: "1", covered_by: ["E1.1"] },              // rótulo "Financiamento": deslocado para o 2
            { id: "2", covered_by: ["E1.2"] },              // corresponde, etapa com código
            { id: "3", covered_by: ["E2.1"] },              // corresponde, etapa só do agente
            { id: "4", covered_by: ["E9.9"] },              // ponteiro para subitem inexistente
            { id: "5", nao_coberto: "a trilha não tem campo para revisão por pares" },
            { id: "6", nao_se_aplica: "o método não faz metanálise" },
            // 7: sem linha — omissão silenciosa
            { id: "8", covered_by: ["SUP.1"] },             // suplemento: sem etapa
        ],
    }));
    fs.writeFileSync(c("standards/sem-dono.json"), JSON.stringify({
        schemaVersion: 1, id: "SD", name: "Sem dono", titulos_oficiais: true, items: [item("1", "Title")],
    }));
    fs.writeFileSync(c("methodologies/m1/spec.md"), [
        "| Subitem | Campo | Descrição | Obrigatório | Item |", "|---|---|---|---|---|",
        "| E1.1 | Financiamento | agência | ✅ | Item 1 |",
        "| E1.2 | Support recebido | quem apoiou | ✅ | Item 2 |",
        "| E2.1 | Disponibilidade | onde estão os dados | ✅ | Item 3 |",
        "| SUP.1 | relatorio.md | suplemento | Item 8 |",
    ].join("\n") + "\n");
    fs.writeFileSync(c("methodologies/m1/manifest.json"), JSON.stringify({
        id: "m1", spec: "spec.md", conformance: { standards: ["teste"] },
        phases: [
            { id: "E1", name: "Desenho", role: "designer", closes_with: "protocol.md", producer_tools: ["plan_research_protocol"] },
            { id: "E2", name: "Relato", role: "analyst", closes_with: "x/relatorio.md", producer_tools: [] },
        ],
    }));
    return raiz;
}

describe("o verificador deixou de ser verde por construção", () => {
    const r = StandardCoverageService.conferir(repo(), "teste");
    const m1 = r.conferencia_por_metodo[0];

    it("(d) omissão silenciosa reprova; [NÃO COBERTO] não conta como coberto; [NÃO SE APLICA] sai do denominador", () => {
        expect(r.orphans.map((o) => o.id)).toEqual(["7"]);
        expect(r.nao_coberto.map((x) => x.id)).toEqual(["5"]);
        expect(r.nao_se_aplica.map((x) => x.id)).toEqual(["6"]);
        expect(r.errors.join(" ")).toMatch(/sem declaração \[NÃO COBERTO\] ou \[NÃO SE APLICA\]: 7/);
    });

    it("(a) ponteiro para subitem que a spec do método não define é erro — e deixa de contar", () => {
        expect(m1.subitens_inexistentes).toEqual([{ item: "4", subitem: "E9.9" }]);
        expect(r.contestados.map((c) => c.item)).toContain("4");
    });

    it("(b) rótulo que casa com OUTRO item é suspeito — pedido de leitura, que não contesta a correspondência (DEBT-149)", () => {
        expect(m1.conferencia_por_palavras.suspeitos.map((s) => `${s.subitem}→${s.item_declarado}:${s.item_sugerido}`)).toEqual(["E1.1→1:2"]);
        expect(r.contestados.map((c) => c.item)).not.toContain("1");
        expect(r.errors.join(" ")).not.toMatch(/E1\.1/);
        expect(r.avisos.join(" ")).toMatch(/E1\.1→1 \(sugere 2\)/);
    });

    it("(c) diz quem produz: tool da etapa, só o agente, ou etapa nenhuma", () => {
        expect(m1.producao.por_codigo.sort()).toEqual(["1", "2"]);
        expect(m1.producao.so_por_agente).toEqual(["3"]);
        expect(m1.producao.sem_etapa.sort()).toEqual(["4", "8"]);
        expect(m1.producao.etapas_sem_codigo).toEqual([{ etapa: "E2", artefato: "x/relatorio.md" }]);
    });

    it("a fração é a honesta: só correspondência não contestada por (a), sobre as linhas que se aplicam", () => {
        // 8 linhas, 1 não se aplica → 7. Declaradas cobertas: 1,2,3,4,8; contestada só a 4 (ponteiro
        // para subitem inexistente) → 4. O suspeito do 1 não contesta (DEBT-149).
        expect(r.fracao).toBe("4/7");
        // Reprova pela omissão do 7 e pelo ponteiro inexistente do 4 — não pelo suspeito.
        expect(r.valid).toBe(false);
        expect(r.errors).toHaveLength(2);
    });

    it("o que a conferência por palavras é, e o LIMITE, vão escritos onde o resultado é lido", () => {
        expect(r.conferencia_por_palavras).toBe(CONFERENCIA_POR_PALAVRAS);
        expect(r.conferencia_por_palavras).toMatch(/derrotável/);
        expect(r.limite).toMatch(/A máquina não julga se o mapeamento está CERTO/);
        expect(r.limite).toMatch(/O encaixe .* só aparece se quem assimila o declarar \[NÃO COBERTO\]/);
        expect(r.limite).toMatch(/é afirmação de quem assimilou, conferida só no que é mecânico/);
    });

    // FILA linha 8, item 3 (decisão de 12/11/2026: norma se aponta, não se copia).
    it("o relatório diz que o mapeamento é do sistema, não conferido contra a fonte, e que o relato é o formulário oficial", () => {
        expect(r.limite).toMatch(/O mapeamento é do ReviewBR e não foi conferido contra a fonte/);
        expect(r.limite).toMatch(/o pesquisador preenche o formulário oficial da norma/);
    });
});

describe("sem título oficial, a etapa não ganha fundamento — e o padrão reprova pelo título", () => {
    const r = StandardCoverageService.conferir(repo(false), "teste");

    it("o padrão reprova porque os títulos não são da fonte oficial — e só diz isso uma vez", () => {
        expect(r.errors.filter((e) => /não foram transcritos da fonte oficial/.test(e))).toHaveLength(1);
        expect(r.errors.join(" ")).not.toMatch(/SEM PODER/);
    });

    it("sem título oficial a etapa não ganha fundamento; com ele, ganha (controle), inclusive o item que só o suspeito tirava", () => {
        // Era o PRISMA-S que exercia este ramo, até ganhar os títulos oficiais (DEBT-128).
        expect(r.conferencia_por_metodo[0].itens_por_etapa).toEqual({});
        expect(StandardCoverageService.conferir(repo(), "teste").conferencia_por_metodo[0].itens_por_etapa)
            .toEqual({ E1: ["1", "2"], E2: ["3"] });
    });

    it("título fora da fonte não muda a fração: o que contesta é só (a)", () => {
        expect(r.contestados.map((c) => c.item)).toEqual(["4"]);
        expect(r.fracao).toBe("4/7");
    });
});

describe("padrão que nenhum método declara é dito assim", () => {
    it("sem método que o declare, reprova com o motivo — não confere contra trilha qualquer", () => {
        const r = StandardCoverageService.conferir(repo(), "sem-dono");
        expect(r.declarado_por).toEqual([]);
        expect(r.conferencia_por_metodo).toEqual([]);
        expect(r.errors[0]).toMatch(/Nenhum método pronto declara "sem-dono"/);
    });

    it("conferido a pedido contra um método, avisa que o método não o declara", () => {
        const r = StandardCoverageService.conferir(repo(), "sem-dono", "m1");
        expect(r.conferencia_por_metodo[0].declara_o_padrao).toBe(false);
        expect(r.errors.join(" ")).toMatch(/"m1" não declara "sem-dono"/);
    });
});

describe("o estado REAL dos padrões assimilados, medido", () => {
    it("PRISMA-P: 12/26 — as 14 linhas de encaixe e parcial estão declaradas, cada uma com o motivo", () => {
        const r = StandardCoverageService.conferir(REPO, "prisma-p");
        expect(r.fracao).toBe("12/26");
        expect(r.nao_coberto.map((x) => x.id).sort()).toEqual(
            ["10", "11a", "11c", "12", "13", "14", "16", "1b", "3a", "3b", "4", "5c", "8", "9"].sort(),
        );
        for (const x of r.nao_coberto) expect(x.motivo, x.id).toMatch(/^(encaixe|parcial) — /);
        // controle positivo do que mudou: pela regra antiga ("covered_by não vazio") eram 26/26
        const std = StandardsService.read(REPO, "prisma-p")!;
        const mapa = lerMapeamento(REPO, "prisma-sr", "prisma-p").linhas;
        expect(std.items.filter((i) => !i.has_subitems && (mapa.get(i.id)?.covered_by.length ?? 0) > 0)).toHaveLength(26);
    });

    it("PRISMA-P: declarado pelo prisma-sr (17/10/2026) — lacunas declaradas, sem omissão silenciosa", () => {
        // Era assimilado e não usado (§5 da especificação). O pesquisador decidiu: é a norma do
        // protocolo da revisão sistemática. `valid` verde aqui NÃO é cobertura completa — é a
        // ausência de omissão silenciosa; a fração continua 12/26.
        const r = StandardCoverageService.conferir(REPO, "prisma-p");
        expect(r.declarado_por).toEqual(["prisma-sr"]);
        expect(r.errors).toEqual([]);
        expect(r.valid).toBe(true);
    });

    it("PRISMA-S: títulos oficiais e mapeamento refeito (DEBT-128) — 9/16, as lacunas declaradas", () => {
        // Até 30/10/2026 os títulos vinham da trilha. O zero suspeito de agora NÃO prova acerto:
        // neste padrão a conferência por palavras percebe 3,6% das trocas propositais (DEBT-149),
        // e o relatório diz isso — a medida está em conferencia_por_palavras.test.ts.
        const r = StandardCoverageService.conferir(REPO, "prisma-s");
        expect(r.declarado_por).toEqual(["prisma-sr", "scoping-prisma-scr"]);
        expect(r.conferencia_por_metodo.every((c) => /\(3,6%\)/.test(c.conferencia_por_palavras.quanto_enxerga))).toBe(true);
        expect(r.conferencia_por_metodo.flatMap((c) => c.conferencia_por_palavras.suspeitos)).toEqual([]);
        expect(r.orphans).toEqual([]);
        expect(r.nao_coberto.map((x) => x.id)).toEqual(["S2", "S7", "S9", "S10", "S11", "S12", "S14"]);
        expect(r.fracao).toBe("prisma-sr 9/16 · scoping-prisma-scr 9/16");
        expect(r.valid).toBe(true);
    });

    it("scoping herda a spec-base: os subitens existem e a conferência por palavras tem rótulo a comparar", () => {
        // Antes, a spec do scoping era lida sozinha (só deltas): zero pares, e a conferência
        // voltava limpa por não ter conferido nada.
        const r = StandardCoverageService.conferir(REPO, "prisma-s", "scoping-prisma-scr");
        const c = r.conferencia_por_metodo[0];
        expect(c.subitens_inexistentes).toEqual([]);
        expect(c.conferencia_por_palavras.pares_conferidos).toBeGreaterThan(0);
    });

    it("PRISMA 2020: os 5 deslocados do DEBT-045 declarados [NÃO COBERTO]; a fração é 16/42, não 42/42", () => {
        const r = StandardCoverageService.conferir(REPO, "prisma-2020");
        const deslocados = r.nao_coberto.filter((x) => /DEBT-045/.test(x.motivo)).map((x) => x.id).sort();
        expect(deslocados).toEqual(["14", "15", "25", "26", "27"]);
        expect(r.fracao).toBe("16/42");
    });

    it("PRISMA 2020: os 21 subitens sem mapeamento estão declarados [NÃO COBERTO] (DEBT-014) — valid true, e os suspeitos não reprovam", () => {
        // Até 12/11/2026 eram 21 órfãos e o padrão reprovava: toda revisão prisma-sr parava na F8
        // por omissão do mapeamento do sistema. Declarados, vão ao checklist como não cobertos.
        const r = StandardCoverageService.conferir(REPO, "prisma-2020");
        expect(r.orphans).toEqual([]);
        const subitens = r.nao_coberto.filter((x) => /DEBT-014/.test(x.motivo)).map((x) => x.id);
        expect(subitens).toHaveLength(21);
        expect(subitens).toEqual(expect.arrayContaining(["10a", "13f", "16b", "20d", "23d", "24c"]));
        expect(r.errors).toEqual([]);
        expect(r.valid).toBe(true);
    });

    it("PRISMA 2020: a conferência por palavras enxerga o deslocamento rumo a item COM subitens (família pai+filhos)", () => {
        // Os 21 subitens repetem o título do pai; antes, pai e filhos contavam como candidatos
        // distintos e o critério "exatamente UM outro item" nunca disparava rumo ao 24.
        const c = StandardCoverageService.conferir(REPO, "prisma-2020").conferencia_por_metodo[0];
        const pares = c.conferencia_por_palavras.suspeitos.map((s) => `${s.subitem}→${s.item_declarado}:${s.item_sugerido}`);
        expect(pares).toContain("F0.2.1→15:24");
        expect(pares).toContain("F8.3.15→15:24");
    });

    it("PRISMA 2020: a conferência por palavras lê também o covered_by — ponteiro não lido vai para nao_conferidos", () => {
        const c = StandardCoverageService.conferir(REPO, "prisma-2020").conferencia_por_metodo[0];
        expect(c.conferencia_por_palavras.pares_conferidos).toBeGreaterThan(112); // só a coluna da spec dava 112
    });

    it("(c) é parcial quando só algumas etapas da linha têm código — o manuscrito (F8) não tem", () => {
        const c = StandardCoverageService.conferir(REPO, "prisma-2020").conferencia_por_metodo[0];
        expect(c.producao.por_codigo).toEqual([]);
        expect(c.producao.parcial).toContain("11");
        expect(c.producao.etapas_sem_codigo.map((e) => e.etapa)).toEqual(expect.arrayContaining(["F6", "F7", "F8"]));
    });

    it("itens_por_etapa: o porquê da etapa sai do mapeamento do padrão, sem os itens declarados [NÃO COBERTO]", () => {
        const c = StandardCoverageService.conferir(REPO, "prisma-2020", "prisma-sr").conferencia_por_metodo[0];
        expect(c.itens_por_etapa["F4"]).toContain("8");          // seleção de estudos
        expect(c.itens_por_etapa["F6"]).toEqual(expect.arrayContaining(["11", "18"])); // risco de viés
        const todos = Object.values(c.itens_por_etapa).flat();
        for (const deslocado of ["14", "15", "25", "26", "27"]) expect(todos).not.toContain(deslocado);
    });

    it("itens_por_etapa: com os títulos oficiais, o PRISMA-S fundamenta as etapas — sem os [NÃO COBERTO] (DEBT-128)", () => {
        const c = StandardCoverageService.conferir(REPO, "prisma-s", "prisma-sr").conferencia_por_metodo[0];
        expect(c.itens_por_etapa["F2"]).toEqual(expect.arrayContaining(["S1", "S8", "S13"]));
        expect(c.itens_por_etapa["F3"]).toEqual(expect.arrayContaining(["S15", "S16"])); // total de registros, deduplicação
        const todos = Object.values(c.itens_por_etapa).flat();
        for (const lacuna of ["S2", "S7", "S9", "S10", "S11", "S12", "S14"]) expect(todos).not.toContain(lacuna);
    });
});

describe("o checklist gerado mostra as declarações como tais", () => {
    it("[NÃO COBERTO] aparece com o motivo e os ponteiros parciais; não vira cobertura", () => {
        const md = StandardCoverageService.checklist(REPO, "prisma-p");
        const linha4 = md.split("\n").find((l) => /^\| 4 \|/.test(l))!;
        expect(linha4).toMatch(/\*\*\[NÃO COBERTO\]\*\* encaixe/);
        expect(linha4).toMatch(/ponteiros atuais: F0\.1\.5/);   // encaixe: o ponteiro é o erro, não cobertura parcial
        const linha3a = md.split("\n").find((l) => /3a \|/.test(l))!;
        expect(linha3a).toMatch(/parcial em F0\.1\.6/);           // parcial: a cobertura parcial mora ali
    });

    it("[NÃO SE APLICA] sai marcado N/A, não como pendência", () => {
        const raiz = repo();
        const md = StandardCoverageService.checklist(raiz, "teste");
        const linha6 = md.split("\n").find((l) => /^\| 6 \|/.test(l))!;
        expect(linha6).toMatch(/\[NÃO SE APLICA\]/);
        expect(linha6).toMatch(/\| N\/A \|$/);
    });
});

describe("revisão de 09/10 — um método não contamina o número do outro", () => {
    function addMetodo(raiz: string, id: string, phases: unknown, spec: string) {
        const dir = path.join(raiz, ".claude", "methodologies", id);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, "spec.md"), spec);
        fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify({ id, spec: "spec.md", conformance: { standards: ["teste"] }, phases }));
    }

    it("esqueleto do scaffold que declara o padrão é relatado à parte e não derruba a fração", () => {
        const raiz = repo();
        addMetodo(raiz, "esq", [{ id: "[TBD]", name: "[TBD]", role: "[TBD]", closes_with: "[TBD]", producer_tools: [] }], "# esqueleto\n");
        const r = StandardCoverageService.conferir(raiz, "teste");
        expect(r.declarado_por).toEqual(["m1"]);
        expect(r.declarado_por_esqueleto).toEqual(["esq"]);
        expect(r.fracao).toBe("4/7");
        expect(r.avisos.join(" ")).toMatch(/esqueleto/);
    });

    it("dois métodos prontos: a fração sai por método, cada um com o seu mapeamento e o seu denominador", () => {
        const raiz = repo();
        addMetodo(raiz, "m2", [{ id: "E1", name: "Desenho", role: "designer", closes_with: "protocol.md", producer_tools: [] }],
            "| Subitem | Campo | Descrição | Obrigatório | Item |\n|---|---|---|---|---|\n| E1.2 | Support recebido | x | ✅ | Item 2 |\n");
        fs.mkdirSync(path.join(raiz, ".claude", "methodologies", "m2", "conformance"), { recursive: true });
        fs.writeFileSync(path.join(raiz, ".claude", "methodologies", "m2", "conformance", "teste.json"),
            JSON.stringify({ schemaVersion: 1, standard: "teste", items: [{ id: "2", covered_by: ["E1.2"] }] }));
        const r = StandardCoverageService.conferir(raiz, "teste");
        expect(r.declarado_por).toEqual(["m1", "m2"]);
        // O [NÃO SE APLICA] do item 6 é do m1 (DEBT-142): no m2 o 6 fica no denominador.
        expect(r.fracao).toBe("m1 4/7 · m2 1/8");
    });

    it("ponteiro para etapa que o método declara não se aplicar contesta a linha", () => {
        const raiz = repo();
        const mp = path.join(raiz, ".claude", "methodologies", "m1", "manifest.json");
        const man = JSON.parse(fs.readFileSync(mp, "utf-8"));
        man.phases.push({ id: "E3", name: "Apreciação crítica", active: false, note: "não se aplica a este desenho" });
        fs.writeFileSync(mp, JSON.stringify(man));
        fs.appendFileSync(path.join(raiz, ".claude", "methodologies", "m1", "spec.md"), "| E3.1 | Ferramenta de apreciação | x | ✅ | Item 3 |\n");
        const ap = path.join(raiz, ".claude", "methodologies", "m1", "conformance", "teste.json");
        const mapa = JSON.parse(fs.readFileSync(ap, "utf-8"));
        mapa.items.find((i: any) => i.id === "3").covered_by = ["E3.1"];
        fs.writeFileSync(ap, JSON.stringify(mapa));
        const c = StandardCoverageService.conferir(raiz, "teste").conferencia_por_metodo[0];
        expect(c.em_etapa_que_nao_se_aplica).toEqual([{ item: "3", subitem: "E3.1", etapa: "E3" }]);
        expect(c.contestados.map((x) => x.item)).toContain("3");
        expect(c.producao.so_por_agente).not.toContain("3");
    });

    it("o checklist gerado marca o contestado por (a) e leva fração e limite no rodapé — não o suspeito", () => {
        const md = StandardCoverageService.checklist(repo(), "teste");
        const linha = (id: string) => md.split("\n").find((l) => new RegExp(`^\\| ${id} \\|`).test(l))!;
        expect(linha("4")).toMatch(/\*\*\[CONTESTADO\]\*\* \[m1\] subitem E9\.9 não existe na spec de m1/);
        expect(linha("1")).not.toMatch(/CONTESTADO/);     // o suspeito da conferência por palavras não marca linha
        expect(md).toMatch(/\*\*Fração:\*\* 4\/7 — correspondência declarada pelo mapeamento do método e não contestada/);
        expect(md).toMatch(/\*\*Limite da conferência:\*\*/);
        expect(md).not.toMatch(/Premissa da falsificação|Fração conferida/);
    });
});
