import { describe, it, expect, afterAll } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { StandardCoverageService } from "../src/services/standard_coverage.js";
import { StandardsService } from "../src/services/standards.js";
import { lerMapeamento } from "../src/services/method_mapping.js";
import { conferirTrecho, normalizarEspaco } from "../src/services/leitura_documentada.js";

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.slice(1)), "..", "..", "..");

/**
 * DEBT-149, decisão de 05/11/2026 (B2) — a leitura documentada. Cada ponteiro do mapeamento traz o
 * trecho literal do enunciado oficial do item que o justifica, e um conferidor simples confere que o
 * trecho é literal (só o espaço se normaliza) e daquele item. Conferidor só vale como prova com teste
 * de resposta conhecida (A5): trecho literal aceito; trecho de outro item e trecho alterado recusados.
 */

const temporarios: string[] = [];
afterAll(() => { for (const d of temporarios) fs.rmSync(d, { recursive: true, force: true }); });
const escrever = (p: string, v: unknown) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(v, null, 2)); };

const ENUNCIADOS: Record<string, string> = {
    "1": "Report the registration information for the review, including register name and registration number.",
    "2": "Describe sources of financial or non-financial support for the review, and the role of the funders.",
    "3": "Describe any search peer review process.",
};
const TRECHOS: Record<string, Record<string, string>> = {
    "1": { "E1.1": "Report the registration information" },
    "2": { "E1.2": "sources of financial or\n    non-financial support" },   // quebra de linha e espaço a mais
    "3": { "E1.3": "Describe any search peer review process." },
};

/** Padrão de 3 itens com enunciado, método m1 com trilha e mapeamento — tudo escrito em disco e lido pelo zod. */
function brinquedo(o: {
    trechos?: Record<string, Record<string, string>>;
    examinados?: Record<string, unknown[]>;
    rotulo11?: string;
    semTexto3?: boolean;
    leitura?: unknown;
} = {}): string {
    const raiz = fs.mkdtempSync(path.join(os.tmpdir(), "leitura-"));
    temporarios.push(raiz);
    const c = (p: string) => path.join(raiz, ".claude", p);
    fs.mkdirSync(c("agents"), { recursive: true });
    fs.writeFileSync(c("agents/designer.md"), "# designer\n");
    escrever(c("standards/teste.json"), {
        schemaVersion: 1, id: "TESTE", name: "Padrão Teste", version: "1", titulos_oficiais: true,
        items: [
            { id: "1", title: "Registration", text: ENUNCIADOS["1"] },
            { id: "2", title: "Support", text: ENUNCIADOS["2"] },
            { id: "3", title: "Peer review", ...(o.semTexto3 ? {} : { text: ENUNCIADOS["3"] }) },
        ],
    });
    escrever(c("methodologies/m1/manifest.json"), {
        id: "m1", spec: "spec.md", conformance: { standards: ["teste"] },
        phases: [{ id: "E1", name: "Desenho", role: "designer", closes_with: "protocol.md", producer_tools: ["plan_research_protocol"] }],
    });
    fs.writeFileSync(c("methodologies/m1/spec.md"), [
        "| Subitem | Campo | Descrição | Obrigatório | Item |", "|---|---|---|---|---|",
        `| E1.1 | ${o.rotulo11 ?? "Financiamento"} | agência | ✅ | Item 1 |`,
        "| E1.2 | Support recebido | quem apoiou | ✅ | Item 2 |",
        "| E1.3 | Revisão da busca | por pares | ✅ | Item 3 |",
    ].join("\n") + "\n");
    const trechos = o.trechos ?? TRECHOS;
    const mapa: Record<string, unknown> = {
        schemaVersion: 1, standard: "teste",
        items: ["1", "2", "3"].map((id) => ({
            id, covered_by: [`E1.${id}`],
            ...(trechos[id] ? { trechos: trechos[id] } : {}),
            ...(o.examinados?.[id] ? { examinados: o.examinados[id] } : {}),
        })),
    };
    if (o.leitura) mapa.leitura_documentada = o.leitura;
    escrever(c("methodologies/m1/conformance/teste.json"), mapa);
    return raiz;
}
const conferir = (raiz: string) => StandardCoverageService.conferir(raiz, "teste");
const leituraDe = (raiz: string) => conferir(raiz).conferencia_por_metodo[0].leitura_documentada;

describe("o conferidor de literalidade, com resposta conhecida (A5)", () => {
    it("trecho literal — inclusive com quebra de linha e espaço a mais — é aceito: leitura completa, relatório válido", () => {
        const r = conferir(brinquedo());
        const l = r.conferencia_por_metodo[0].leitura_documentada;
        expect([l.estado, l.ponteiros, l.com_trecho, l.aceitos]).toEqual(["completa", 3, 3, 3]);
        expect(l.recusados).toEqual([]);
        expect(r.errors).toEqual([]);
        expect(r.valid).toBe(true);
        expect(l.texto).toMatch(/^Leitura documentada: os 3 ponteiros trazem trecho do enunciado oficial; 3 conferido\(s\) literal\(is\) e do item declarado\./);
    });

    it("trecho de OUTRO item é recusado, com o item de onde ele é — e o relatório reprova", () => {
        const r = conferir(brinquedo({ trechos: { ...TRECHOS, "1": { "E1.1": "sources of financial or non-financial support" } } }));
        const l = r.conferencia_por_metodo[0].leitura_documentada;
        expect(l.recusados).toEqual([{ item: "1", subitem: "E1.1", motivo: "o trecho não está no enunciado do item 1; está no do item 2" }]);
        expect(l.aceitos).toBe(2);
        expect(r.valid).toBe(false);
        expect(r.errors.join(" ")).toMatch(/\(leitura documentada\) 1 trecho\(s\) recusado\(s\) pelo conferidor de literalidade: 1→E1\.1/);
    });

    it("trecho ALTERADO é recusado — uma palavra trocada, ou só a maiúscula", () => {
        for (const alterado of ["Report the registration data", "report the registration information"]) {
            const l = leituraDe(brinquedo({ trechos: { ...TRECHOS, "1": { "E1.1": alterado } } }));
            expect(l.recusados.map((x) => x.motivo), alterado).toEqual([expect.stringMatching(/^o trecho não é literal/)]);
        }
    });

    it("item sem enunciado transcrito: o trecho é recusado, porque não há contra o que conferir", () => {
        const l = leituraDe(brinquedo({ semTexto3: true }));
        expect(l.recusados).toEqual([{ item: "3", subitem: "E1.3", motivo: "o item 3 não tem enunciado transcrito em Padrão Teste: não há contra o que conferir o trecho" }]);
    });

    it("trecho para subitem que a linha não aponta é recusado", () => {
        const l = leituraDe(brinquedo({ trechos: { ...TRECHOS, "2": { ...TRECHOS["2"], "E9.9": "the role of the funders" } } }));
        expect(l.recusados).toEqual([{ item: "2", subitem: "E9.9", motivo: "trecho para E9.9, que a linha não aponta em covered_by" }]);
    });

    it("o enunciado e o trecho chegam ao conferidor — o zod não os remove (armadilha 1)", () => {
        const raiz = brinquedo({ leitura: { em: "2026-11-06", por: "sessão de teste", registro: ".claude/maintenance/registro.md" } });
        expect(StandardsService.read(raiz, "teste")!.items.map((i) => i.text)).toEqual([ENUNCIADOS["1"], ENUNCIADOS["2"], ENUNCIADOS["3"]]);
        const m = lerMapeamento(raiz, "m1", "teste");
        expect(m.linhas.get("2")!.trechos).toEqual(TRECHOS["2"]);
        expect(m.leitura).toEqual({ em: "2026-11-06", por: "sessão de teste", registro: ".claude/maintenance/registro.md" });
        expect(leituraDe(raiz).texto).toMatch(/Feita em 06\/11\/2026 por sessão de teste; registro: \.claude\/maintenance\/registro\.md\.$/);
    });

    it("a normalização é só de espaço", () => {
        expect(normalizarEspaco("  a\n\t b   c  ")).toBe("a b c");
        expect(normalizarEspaco("A, b.")).toBe("A, b.");
    });
});

describe("o mesmo conferidor contra os enunciados REAIS do PRISMA-S", () => {
    const s = StandardsService.read(REPO, "prisma-s")!;

    it("aceita o trecho literal do item certo; recusa o mesmo trecho atribuído a outro item, e o trecho parafraseado", () => {
        expect(conferirTrecho(s, "S13", "provide the date when the last search occurred")).toEqual({ aceito: true });
        expect(conferirTrecho(s, "S12", "provide the date when the last search occurred"))
            .toEqual({ aceito: false, motivo: "o trecho não está no enunciado do item S12; está no do item S13" });
        expect(conferirTrecho(s, "S13", "provide the date of the last search")).toMatchObject({ aceito: false, motivo: expect.stringMatching(/não é literal/) });
    });

    it("o PRISMA 2020 não tem enunciado no padrão: todo trecho atribuído a ele é recusado", () => {
        const p = StandardsService.read(REPO, "prisma-2020")!;
        expect(conferirTrecho(p, "7", "Present the full search strategies")).toMatchObject({ aceito: false, motivo: expect.stringMatching(/não tem enunciado transcrito/) });
    });
});

describe("a primeira aplicação: o PRISMA-S do prisma-sr (sessão 2c, item 3)", () => {
    const sessao = path.join(REPO, ".claude", "maintenance", "sessao_2c");
    const ler = (f: string) => JSON.parse(fs.readFileSync(path.join(sessao, f), "utf-8"));

    it("todo ponteiro traz trecho literal do enunciado do item, aceito pelo conferidor, e o relatório diz quem leu, quando e onde", () => {
        const l = StandardCoverageService.conferir(REPO, "prisma-s", "prisma-sr").conferencia_por_metodo[0].leitura_documentada;
        expect([l.estado, l.ponteiros, l.aceitos, l.recusados]).toEqual(["completa", 55, 55, []]);
        expect(l.registro?.em).toBe("2026-11-06");
        expect(fs.existsSync(path.join(REPO, l.registro!.registro)), "o registro citado existe").toBe(true);
        expect(l.texto).toMatch(/^Leitura documentada: os 55 ponteiros trazem trecho do enunciado oficial; 55 conferido\(s\) literal\(is\) e do item declarado\. Feita em 06\/11\/2026/);
    });

    it("as duas leituras estão no repositório, e a segunda só leu a sua entrada — a independência fica provada pela transcrição", () => {
        const [a, b] = [ler("primeira_leitura.json"), ler("segunda_leitura.json")];
        expect([a.itens.length, b.itens.length]).toEqual([16, 16]);
        expect(b.independencia.so_leu_a_entrada).toBe(true);
        expect(b.independencia.chamadas_de_ferramenta).toEqual([expect.stringMatching(/^Read .*segunda_leitura_entrada\.md$/)]);
        // A entrada da segunda leitura não traz o mapeamento: nenhum número de item na parte da trilha.
        const entrada = fs.readFileSync(path.join(sessao, "segunda_leitura_entrada.md"), "utf-8");
        expect(entrada.slice(entrada.indexOf("# Campos da trilha"))).not.toMatch(/\bS\d{1,2}\b|\bItem \d/);
    });

    it("a cópia do escopo tem os mesmos ponteiros do prisma-sr, sem trechos (decisão de 08/11/2026)", () => {
        const [sr, esc] = ["prisma-sr", "scoping-prisma-scr"].map((m) => lerMapeamento(REPO, m, "prisma-s").linhas);
        expect([...esc].map(([id, l]) => [id, l.covered_by])).toEqual([...sr].map(([id, l]) => [id, l.covered_by]));
        expect(StandardCoverageService.conferir(REPO, "prisma-s", "scoping-prisma-scr").conferencia_por_metodo[0].leitura_documentada.estado).toBe("ausente");
    });
});

describe("leitura parcial ou ausente: dita, sem reprovar", () => {
    it("parcial: o relatório diz quantos ponteiros têm trecho e avisa quais não têm", () => {
        const r = conferir(brinquedo({ trechos: { "1": TRECHOS["1"], "2": TRECHOS["2"] } }));
        const l = r.conferencia_por_metodo[0].leitura_documentada;
        expect([l.estado, l.sem_trecho]).toEqual(["parcial", ["3→E1.3"]]);
        expect(l.texto).toMatch(/^Leitura documentada PARCIAL: 2 de 3 ponteiros/);
        expect(r.avisos.join(" ")).toMatch(/\[m1\] Leitura documentada parcial: 1 ponteiro\(s\) sem trecho do enunciado — 3→E1\.3/);
        expect(r.valid).toBe(true);
    });

    it("ausente: nenhum ponteiro com trecho — dito assim, e o relatório segue válido", () => {
        const r = conferir(brinquedo({ trechos: {} }));
        expect(r.conferencia_por_metodo[0].leitura_documentada.texto).toMatch(/^Sem leitura documentada: nenhum ponteiro deste mapeamento traz trecho/);
        expect(r.valid).toBe(true);
    });
});

describe("suspeito examinado na assimilação fica registrado — quem, quando, com que trecho (ponto 2 de 30/10)", () => {
    const EXAME = { subitem: "E1.1", rotulo: "Financiamento", por: "sessão de teste", em: "2026-11-06", trecho: "including register name and registration number" };

    it("controle: sem registro, o suspeito E1.1→1 é pedido de leitura pendente", () => {
        const r = conferir(brinquedo());
        expect(r.conferencia_por_metodo[0].conferencia_por_palavras.suspeitos.map((s) => [s.subitem, s.examinado])).toEqual([["E1.1", null]]);
        expect(r.avisos.join(" ")).toMatch(/\[m1\] 1 par\(es\) suspeito\(s\) pela conferência por palavras/);
    });

    it("com o exame registrado, o suspeito sai dos pendentes e o aviso diz quem o examinou e quando", () => {
        const r = conferir(brinquedo({ examinados: { "1": [EXAME] } }));
        expect(r.conferencia_por_metodo[0].conferencia_por_palavras.suspeitos[0].examinado).toEqual({ por: "sessão de teste", em: "2026-11-06" });
        expect(r.avisos.join(" ")).toMatch(/\[m1\] 1 suspeito\(s\) já examinado\(s\) na assimilação, com trecho do enunciado registrado no mapeamento: E1\.1→1 \(sessão de teste, 06\/11\/2026\)/);
        expect(r.avisos.join(" ")).not.toMatch(/par\(es\) suspeito\(s\) pela conferência por palavras/);
    });

    it("o exame caduca quando o rótulo do subitem muda: o suspeito volta a ser pendente", () => {
        const r = conferir(brinquedo({ examinados: { "1": [EXAME] }, rotulo11: "Financiamento recebido" }));
        const s = r.conferencia_por_metodo[0].conferencia_por_palavras.suspeitos;
        expect(s.map((x) => [x.subitem, x.rotulo, x.examinado])).toEqual([["E1.1", "Financiamento recebido", null]]);
    });

    it("exame com trecho que não é do item declarado é recusado — e o suspeito segue pendente", () => {
        const r = conferir(brinquedo({ examinados: { "1": [{ ...EXAME, trecho: "the role of the funders" }] } }));
        const c = r.conferencia_por_metodo[0];
        expect(c.leitura_documentada.recusados).toEqual([{ item: "1", subitem: "E1.1", motivo: "exame do suspeito: o trecho não está no enunciado do item 1; está no do item 2" }]);
        expect(c.conferencia_por_palavras.suspeitos[0].examinado).toBeNull();
        expect(r.valid).toBe(false);
    });
});
