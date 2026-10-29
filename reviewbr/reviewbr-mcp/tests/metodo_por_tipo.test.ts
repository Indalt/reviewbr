import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { metodosParaTipo, tiposAtendidos, escolherMetodo } from "../src/services/methods_for_type.js";

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname.slice(1)), "..", "..", "..");

/**
 * O tipo de pesquisa LIMITA as trilhas — e tipo sem método assimilado RECUSA.
 *
 * O defeito que estes testes guardam: `mapMethod` tinha `default: prisma-sr`, então cinco dos
 * sete tipos oferecidos recebiam a trilha da revisão sistemática PRISMA sem aviso, e o
 * `protocol.md` saía declarando conformidade com um padrão que a pesquisa não seguiu.
 */

describe("o tipo filtra os métodos assimilados", () => {
    it("revisão de escopo encontra a trilha de escopo, não a sistemática", () => {
        const m = metodosParaTipo(REPO, "scoping_review");
        expect(m.map(x => x.id)).toEqual(["scoping-prisma-scr"]);
        expect(escolherMetodo(REPO, "scoping_review").method).toBe("scoping-prisma-scr");
    });

    it("revisão sistemática encontra a trilha sistemática", () => {
        expect(escolherMetodo(REPO, "systematic_review").method).toBe("prisma-sr");
    });

    it("o framework vem do método, não de tabela no código", () => {
        // `default_question_framework` é declarado no manifest: trocar lá troca aqui.
        const esc = escolherMetodo(REPO, "scoping_review");
        const man = JSON.parse(fs.readFileSync(
            path.join(REPO, ".claude/methodologies/scoping-prisma-scr/manifest.json"), "utf-8"));
        expect(esc.framework).toBe(man.default_question_framework);
    });
});

describe("tipo sem método assimilado RECUSA — não vira outro método", () => {
    // "exploratory" entrou nesta lista em 17/10/2026: era servido pela trilha do prisma-sr por herança do
    // switch antigo, e o pesquisador decidiu que cada proposição tem de ter o seu método.
    for (const tipo of ["integrative_review", "meta_analysis", "rapid_review", "methodological_audit", "exploratory"]) {
        it(`${tipo} não é silenciosamente convertido`, () => {
            expect(() => escolherMetodo(REPO, tipo)).toThrow(/Nenhum método assimilado serve/);
        });
    }

    it("a recusa ENSINA: diz que tipos existem e por que não substitui", () => {
        try {
            escolherMetodo(REPO, "meta_analysis");
            throw new Error("devia ter lançado");
        } catch (e: any) {
            expect(e.message).toMatch(/Tipos atendidos hoje/);
            expect(e.message).toMatch(/scoping_review/);
            expect(e.message).toMatch(/declarar conformidade com um padrão que não foi seguido/);
        }
    });

    it("tipo desconhecido também recusa — nada de fall-through", () => {
        expect(() => escolherMetodo(REPO, "etnografia")).toThrow(/Nenhum método assimilado serve/);
    });
});

describe("esqueleto do scaffold não conduz pesquisa", () => {
    it("método com [TBD] é encontrado, marcado incompleto, e recusado com o motivo", () => {
        const base = fs.mkdtempSync(path.join(os.tmpdir(), "met-"));
        const dir = path.join(base, ".claude/methodologies/esqueleto-x");
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify({
            id: "esqueleto-x", name: "Esqueleto X", serves_research_types: ["etnografia"],
            spec: "spec.md", default_question_framework: "livre",
            phases: { "[TBD]": "declarar as fases ativas antes de usar" },
        }));
        fs.writeFileSync(path.join(dir, "spec.md"), "# Esqueleto X\n\n[TBD]\n");

        const achados = metodosParaTipo(base, "etnografia");
        expect(achados).toHaveLength(1);
        expect(achados[0].incompleto.length).toBeGreaterThan(0);
        expect(() => escolherMetodo(base, "etnografia")).toThrow(/nenhum está pronto para uso/);

        fs.rmSync(base, { recursive: true, force: true });
    });
});

describe("instalar método novo não exige editar código", () => {
    it("os tipos atendidos saem do disco, não de lista escrita à mão", () => {
        const t = tiposAtendidos(REPO);
        expect(t).toContain("systematic_review");
        expect(t).toContain("scoping_review");
        // controle positivo do instrumento: um tipo que nenhum manifest declara não aparece
        expect(t).not.toContain("meta_analysis");
    });
});
