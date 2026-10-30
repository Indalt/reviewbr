import { describe, it, expect } from "vitest";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { StandardsService } from "../src/services/standards.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(here, "../../..");

describe("padrões em disco — PRISMA 2020 e PRISMA-S como dado", () => {
    it("os dois padrões existem e são legíveis", () => {
        expect(StandardsService.list(REPO_ROOT)).toEqual(expect.arrayContaining(["prisma-2020", "prisma-s"]));
    });

    it("PRISMA 2020 tem os 27 itens de topo, 1..27, sem buracos", () => {
        const std = StandardsService.read(REPO_ROOT, "prisma-2020")!;
        expect(std).not.toBeNull();
        const topo = std.items.filter((i) => !i.is_subitem);
        expect(topo).toHaveLength(27);
        expect(topo.map((i) => i.id).sort((a, b) => +a - +b)).toEqual(
            Array.from({ length: 27 }, (_, i) => String(i + 1))
        );
    });

    it("representa os SUBITENS por letra — 6 itens se desdobram em 21 linhas (DEBT-013 resolvido)", () => {
        const std = StandardsService.read(REPO_ROOT, "prisma-2020")!;
        const subs = std.items.filter((i) => i.is_subitem);
        expect(subs).toHaveLength(21);
        // os 6 itens que têm subitens, confirmados contra a fonte oficial
        expect(std.items.filter((i) => i.has_subitems).map((i) => i.id).sort((a, b) => +a - +b))
            .toEqual(["10", "13", "16", "20", "23", "24"]);
        expect(subs.map((i) => i.id)).toEqual(expect.arrayContaining(["10a", "13f", "16b", "20d", "23d", "24c"]));
    });

    it("o checklist tem 42 LINHAS, não 27 — pai com subitens é cabeçalho", () => {
        const std = StandardsService.read(REPO_ROOT, "prisma-2020")!;
        expect(std.structure?.checklist_lines).toBe(42);
        expect(std.structure?.top_level_items).toBe(27);
        // 48 nós = 21 itens simples + 6 pais + 21 subitens; 42 linhas = 48 − 6 pais
        expect(std.items).toHaveLength(48);
        expect(std.items.filter((i) => !i.has_subitems)).toHaveLength(42);
    });

    it("os itens 24-27 seguem a numeração OFICIAL (DEBT-012)", () => {
        const std = StandardsService.read(REPO_ROOT, "prisma-2020")!;
        const t = (id: string) => std.items.find((i) => i.id === id)!.title;
        expect(t("24")).toMatch(/Registration and protocol/);
        expect(t("25")).toMatch(/Support/);
        expect(t("26")).toMatch(/Competing interests/);
        expect(t("27")).toMatch(/Availability of data/);
    });

    it("PRISMA-S tem exatamente os 16 itens S1..S16", () => {
        const std = StandardsService.read(REPO_ROOT, "prisma-s")!;
        expect(std.items).toHaveLength(16);
        expect(std.items.map((i) => i.id).sort((a, b) => +a.slice(1) - +b.slice(1))).toEqual(
            Array.from({ length: 16 }, (_, i) => `S${i + 1}`)
        );
    });
});

describe("cobertura — nenhum item do padrão fica órfão", () => {
    it("PRISMA 2020: conta as 42 linhas de checklist, e os subitens ainda estão descobertos", () => {
        const r = StandardsService.checkCoverage(StandardsService.read(REPO_ROOT, "prisma-2020"), "prisma-2020");
        expect(r.total).toBe(42);
        // Os 21 subitens não têm covered_by: a trilha do ReviewBR foi mapeada contra itens de
        // topo, nunca contra subitens. REPROVAR aqui é o comportamento correto — a lacuna
        // passa a ser visível em vez de presumida. Remapear é trabalho pendente (DEBT-014).
        expect(r.valid).toBe(false);
        expect(r.orphans.length).toBeGreaterThanOrEqual(21);
    });

    it("PRISMA-S: nenhum item órfão — 9 com correspondência e 7 declarados [NÃO COBERTO] (DEBT-128)", () => {
        // Eram 16/16 enquanto o mapeamento seguia a numeração da trilha; refeito contra os
        // enunciados oficiais, o que a trilha não coleta ficou declarado, não encaixado.
        const r = StandardsService.checkCoverage(StandardsService.read(REPO_ROOT, "prisma-s"), "prisma-s");
        expect(r.orphans).toEqual([]);
        expect(r.covered).toBe(9);
        expect(r.nao_coberto).toHaveLength(7);
    });

    it("REPROVA quando um item do padrão não é coberto por nenhum subitem", () => {
        const r = StandardsService.checkCoverage(
            {
                schemaVersion: 1, id: "X", name: "Padrão X", version: "1", version_source: "", note: "",
                items: [
                    { id: "1", section: "S", title: "coberto", covered_by: ["F0.1.1"] },
                    { id: "2", section: "S", title: "órfão", covered_by: [] }
                ]
            },
            "X"
        );
        expect(r.valid).toBe(false);
        expect(r.orphans.map((o) => o.id)).toEqual(["2"]);
        expect(r.errors[0]).toMatch(/sem nenhum subitem da trilha/);
    });

    it("REPROVA padrão ausente", () => {
        const r = StandardsService.checkCoverage(StandardsService.read(REPO_ROOT, "nao-existe"), "nao-existe");
        expect(r.valid).toBe(false);
        expect(r.errors[0]).toMatch(/ausente ou ilegível/);
    });

    it("versão do PRISMA 2020 agora está CONFIRMADA contra a fonte oficial", () => {
        const r = StandardsService.checkCoverage(StandardsService.read(REPO_ROOT, "prisma-2020"), "prisma-2020");
        expect(r.version_unverified).toBe(false);
        expect(r.version).toBe("2020");
    });
});

describe("consulta reversa — a pergunta que a spec sozinha não responde", () => {
    it("diz quais subitens da trilha cobrem um item dado", () => {
        const std = StandardsService.read(REPO_ROOT, "prisma-2020")!;
        const item1 = std.items.find((i) => i.id === "1")!;
        expect(item1.covered_by.length).toBeGreaterThan(0);
        expect(item1.covered_by).toContain("F0.1.1");
    });
});

describe("checklist — gerado do dado, não escrito à mão", () => {
    it("emite as 42 linhas do checklist, incluindo os subitens", () => {
        const md = StandardsService.renderChecklist(StandardsService.read(REPO_ROOT, "prisma-2020")!);
        expect(md).toMatch(/# Checklist de conformidade — PRISMA 2020/);
        const linhas = md.split("\n").filter((l) => /^\| (&nbsp;)*\d+[a-z]? \|/.test(l));
        expect(linhas).toHaveLength(42);
        expect(md).toContain("13f");
        expect(md).toContain("[TBD]");
    });

    it("marca visivelmente item sem cobertura, em vez de omiti-lo", () => {
        const md = StandardsService.renderChecklist({
            schemaVersion: 1, id: "X", name: "X", version: "1", version_source: "", note: "",
            items: [{ id: "1", section: "S", title: "órfão", covered_by: [] }]
        });
        expect(md).toContain("**[SEM COBERTURA]**");
    });

    it("declara a versão e a origem dela", () => {
        const md = StandardsService.renderChecklist(StandardsService.read(REPO_ROOT, "prisma-2020")!);
        expect(md).toMatch(/\*\*Versão:\*\* 2020/);
        expect(md).toMatch(/CONFIRMADO/);
    });

    it("DEBT-051 — PRISMA-S (todos os itens com section vazia) sai com cabeçalho e separador, não pipes soltos", () => {
        const md = StandardsService.renderChecklist(StandardsService.read(REPO_ROOT, "prisma-s")!);
        const separadores = md.split("\n").filter((l) => l.startsWith("|---")).length;
        const linhas = md.split("\n").filter((l) => /^\| S\d+ \|/.test(l));
        expect(separadores).toBeGreaterThanOrEqual(1); // antes da correção: 0
        expect(linhas).toHaveLength(16);
        expect(md).toContain("| Item | Título | Coberto por (trilha) | Evidência | Status |");
    });

    it("controle positivo: PRISMA 2020 (COM sections) continua emitindo 1 cabeçalho por seção — comportamento não regrediu", () => {
        const md = StandardsService.renderChecklist(StandardsService.read(REPO_ROOT, "prisma-2020")!);
        const separadores = md.split("\n").filter((l) => l.startsWith("|---")).length;
        expect(separadores).toBeGreaterThan(1); // várias seções, várias tabelas — igual já era antes
    });
});
