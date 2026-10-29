import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { apresentarMetodos, escolherMetodo } from "../src/services/methods_for_type.js";
import { MethodologyCatalogService, CatalogReport } from "../src/services/methodology_catalog.js";
import { StandardCoverageService } from "../src/services/standard_coverage.js";

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.slice(1)), "..", "..", "..");
const SRC = path.join(REPO, "reviewbr", "reviewbr-mcp", "src");
const CLAUDE = path.join(REPO, ".claude");

/**
 * DEBT-095 — o pesquisador sabe o que está escolhendo. Na escolha, os métodos que servem ao
 * tipo vêm com a trilha e o contexto do catálogo (o que é, quando usar, o que exige, fonte
 * oficial). A rota antiga era regex + um ternário que mandava todo tipo não-escopo ao prisma-sr.
 *
 * DEBT-010 — a obsolescência dos padrões é conferida quando o maintainer roda: a lista de
 * trabalho (versão, fonte, quem declara) sai do dado.
 *
 * DEBT-126 — os papéis da trilha devolvem o porquê da etapa, ancorado no item da norma.
 */

describe("DEBT-095 — a escolha vem com o contexto do catálogo", () => {
    it("revisão de escopo: o método, a trilha (F6 riscada) e o que o catálogo diz, com fonte oficial", () => {
        const r = apresentarMetodos(REPO, "scoping_review");
        expect(r.metodos.map((m) => m.id)).toEqual(["scoping-prisma-scr"]);
        const txt = r.linhas.join("\n");
        expect(txt).toMatch(/~~F6 Risco de viés~~ \(não se aplica\)/);
        expect(txt).toMatch(/\*\*PRISMA-ScR\*\* — Extensão oficial do PRISMA para revisões de escopo/);
        expect(txt).toMatch(/\*Quando usar:\*/);
        expect(txt).toMatch(/\*O que exige:\*/);
        expect(txt).toMatch(/\*Fonte oficial:\* https:\/\//);
    });

    it("revisão sistemática: o contexto é o do método e dos padrões que ELE declara", () => {
        const r = apresentarMetodos(REPO, "systematic_review");
        expect(r.metodos.map((m) => m.id)).toEqual(["prisma-sr"]);
        expect(r.metodos[0].padroes).toEqual(["prisma-2020", "prisma-s", "prisma-p"]); // PRISMA-P: o protocolo (17/10)
        const txt = r.linhas.join("\n");
        expect(txt).toMatch(/\*\*PRISMA 2020\*\* — /);
        expect(txt).toMatch(/\*\*PRISMA-S\*\* — /);
        expect(txt).not.toMatch(/\*\*PRISMA-ScR\*\* — /); // nenhuma entrada do método de escopo
    });

    for (const tipo of ["integrative_review", "meta_analysis", "rapid_review"]) {
        it(`${tipo}: recusa com o MESMO texto da criação do projeto — não anuncia o padrão de outro método`, () => {
            const r = apresentarMetodos(REPO, tipo);
            expect(r.metodos).toEqual([]);
            expect(r.linhas).toEqual([]);
            let daCriacao = "";
            try { escolherMetodo(REPO, tipo); } catch (e: any) { daCriacao = e.message; }
            expect(r.recusa).toBe(daCriacao);
            expect(r.recusa).toMatch(/Nenhum método assimilado serve/);
        });
    }

    it("o elo método → catálogo é o dado (pasta e padrão declarados), sem duplicar entrada", () => {
        const rel = { entries: [
            { id: "a", methodology_dir: "m", standard_file: "p1" },
            { id: "b", methodology_dir: "", standard_file: "p2" },
            { id: "c", methodology_dir: "outro", standard_file: "p3" },
        ] } as unknown as CatalogReport;
        expect(MethodologyCatalogService.entradasDoMetodo(rel, "m", ["p1", "p2"]).map((e) => e.id)).toEqual(["a", "b"]);
        expect(MethodologyCatalogService.entradasDoMetodo(rel, "sem-elo", [])).toEqual([]);
    });
});

describe("DEBT-095 — nenhum tipo é convertido em método por literal no código", () => {
    // O ternário que sobreviveu ao DEBT-121: `researchType === "scoping_review" ? "scoping-prisma-scr" : "prisma-sr"`.
    // `[^.\s]\s*:` deixa de fora o "ex.: 'prisma-sr'" das descrições de parâmetro.
    const LITERAL_DE_METODO = /(\?|={1,3}|[^.\s]\s*:)\s*["'`](prisma-sr|scoping-prisma-scr)["'`]/;

    it("src/ não atribui id de metodologia por literal (comentário e exemplo de descrição não contam)", () => {
        const sujos: string[] = [];
        const varrer = (d: string) => {
            for (const e of fs.readdirSync(d, { withFileTypes: true })) {
                const p = path.join(d, e.name);
                if (e.isDirectory()) varrer(p);
                else if (e.name.endsWith(".ts")) {
                    fs.readFileSync(p, "utf-8").split("\n").forEach((l, i) => {
                        const t = l.trim();
                        if (t.startsWith("//") || t.startsWith("*")) return;
                        if (LITERAL_DE_METODO.test(l)) sujos.push(`${path.relative(SRC, p)}:${i + 1}`);
                    });
                }
            }
        };
        varrer(SRC);
        expect(sujos).toEqual([]);
    });

    it("o padrão acha o ternário quando ele existe — controle positivo", () => {
        expect(LITERAL_DE_METODO.test(`const methodId = researchType === "scoping_review" ? "scoping-prisma-scr" : "prisma-sr";`)).toBe(true);
        expect(LITERAL_DE_METODO.test(`describe("Id da metodologia (ex.: 'prisma-sr').")`)).toBe(false);
        expect(LITERAL_DE_METODO.test(`{ method: "prisma-sr", framework: "PICOS" }`)).toBe(true);
    });
});

describe("DEBT-010 — a obsolescência tem lista de trabalho, e a rotina a confere", () => {
    it("cada padrão assimilado sai com versão, fonte e os métodos que o declaram", () => {
        const p = StandardCoverageService.panorama(REPO);
        expect(p.map((x) => x.id)).toEqual(expect.arrayContaining(["prisma-2020", "prisma-p", "prisma-s", "prisma-scr", "raise-3"]));
        for (const x of p) {
            expect(x.version, x.id).not.toBe("");
            expect(x.fonte, x.id).not.toBe("");
        }
        expect(p.find((x) => x.id === "prisma-2020")!.fonte).toMatch(/^https:\/\//); // vem do catálogo: o version_source não traz URL
        expect(p.find((x) => x.id === "prisma-p")!.declarado_por).toEqual(["prisma-sr"]); // desde 17/10/2026
        expect(p.find((x) => x.id === "raise-3")!.declarado_por).toEqual([]);              // entra quando um método o exigir
    });

    it("o passo está na rotina de entrada do maintainer — conferido quando ele roda, sem vigia", () => {
        const md = fs.readFileSync(path.join(CLAUDE, "agents", "maintainer.md"), "utf-8");
        const passo = md.slice(md.indexOf("Obsolescência dos padrões assimilados"));
        expect(passo.length).toBeGreaterThan(100);
        expect(passo).toMatch(/DEBT-010/);
        expect(passo).toMatch(/check_standard_coverage/);
        expect(passo).toMatch(/WebFetch/);
        expect(passo).toMatch(/não presuma/);
    });
});

describe("DEBT-126 — quem executa a etapa devolve o porquê dela", () => {
    it("os seis papéis da trilha e o coordenador têm a instrução, ancorada no item da norma", () => {
        const faltando: string[] = [];
        for (const a of ["designer", "librarian", "screener", "extractor", "reader", "analyst"]) {
            const md = fs.readFileSync(path.join(CLAUDE, "agents", `${a}.md`), "utf-8");
            if (!/DEBT-126/.test(md) || !/não invente fundamento/.test(md)) faltando.push(a);
        }
        const coord = fs.readFileSync(path.join(CLAUDE, "skills", "conduct-review", "SKILL.md"), "utf-8");
        if (!/Explique o porquê de cada etapa/.test(coord)) faltando.push("conduct-review");
        expect(faltando).toEqual([]);
    });
});

describe("revisão de 09/10 — a escolha do pesquisador chega à criação do projeto", () => {
    it("método informado e que serve ao tipo é aceito", () => {
        expect(escolherMetodo(REPO, "scoping_review", "scoping-prisma-scr").method).toBe("scoping-prisma-scr");
    });
    it("método informado que NÃO serve ao tipo é recusado com o que serve", () => {
        expect(() => escolherMetodo(REPO, "scoping_review", "prisma-sr")).toThrow(/não serve ao tipo "scoping_review".*scoping-prisma-scr/);
    });
});
