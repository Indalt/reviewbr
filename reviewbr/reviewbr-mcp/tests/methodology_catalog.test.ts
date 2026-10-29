import { describe, it, expect } from "vitest";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { MethodologyCatalogService as Cat } from "../src/services/methodology_catalog.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(here, "../../..");

const entrada = (over: Record<string, unknown> = {}) => ({
    id: "x", name: "X", full_name: "", kind: "", version: "", version_year: "",
    what_it_is: "", when_to_use: "", requires: "", item_count: "", related_standards: "",
    source_url: "https://exemplo.org", confidence: "alta", notes: "",
    standard_file: "", methodology_dir: "", ...over
});
const cat = (entries: any[]) => ({ schemaVersion: 1 as const, updatedAt: "", source_note: "", entries });

describe("catálogo real em disco — o mapa do território", () => {
    it("existe, é legível e tem as metodologias pesquisadas", () => {
        const r = Cat.resolve(REPO_ROOT, Cat.read(REPO_ROOT));
        expect(r.total).toBeGreaterThan(40);
    });

    it("TODA entrada tem fonte rastreável — conhecimento sem fonte é palpite", () => {
        const r = Cat.resolve(REPO_ROOT, Cat.read(REPO_ROOT));
        expect(r.without_source).toEqual([]);
    });

    it("conhece metodologias que o ReviewBR NÃO implementa — é o ponto do catálogo", () => {
        const r = Cat.resolve(REPO_ROOT, Cat.read(REPO_ROOT));
        // a distância entre o que se conhece e o que se implementa é a fila de trabalho
        expect(r.by_status.AUSENTE).toBeGreaterThan(r.by_status.IMPLEMENTADA);
    });

    it("responde a busca por finalidade, não só por nome", () => {
        const r = Cat.resolve(REPO_ROOT, Cat.read(REPO_ROOT));
        expect(Cat.find(r, "scoping").length).toBeGreaterThan(0);
        expect(Cat.find(r, "").length).toBe(r.total);
    });

    it("DEBT-050 resolvido: as DUAS metodologias implementadas têm o padrão como dado", () => {
        // Até 26/09/2026, scoping-prisma-scr executava e exigia prisma_scr_checklist_filled.md
        // sem que .claude/standards/prisma-scr.json existisse — o checklist não podia ser
        // gerado (implemented_without_standard continha "prisma-scr", r.valid=false). Criado
        // o padrão (22 itens, fonte: Tricco et al. 2018, DEBT-050), a lacuna fecha.
        const r = Cat.resolve(REPO_ROOT, Cat.read(REPO_ROOT));
        expect(r.implemented_without_standard).toEqual([]);
        expect(r.valid).toBe(true);
    });
});

describe("status é DERIVADO do disco, nunca declarado (princípio do RV-02)", () => {
    it("IMPLEMENTADA só quando a pasta da metodologia existe de fato", () => {
        const r = Cat.resolve(REPO_ROOT, cat([
            entrada({ id: "real", methodology_dir: "prisma-sr", standard_file: "prisma-2020" }),
            entrada({ id: "mentira", methodology_dir: "nao-existe-no-disco" })
        ]));
        const m = Object.fromEntries(r.entries.map((e) => [e.id, e.status_in_system]));
        expect(m["real"]).toBe("IMPLEMENTADA");
        // o arquivo pode AFIRMAR que implementa; o disco desmente
        expect(m["mentira"]).toBe("AUSENTE");
    });

    it("PADRAO_DISPONIVEL quando há o padrão como dado mas não implementação", () => {
        const r = Cat.resolve(REPO_ROOT, cat([entrada({ id: "s", standard_file: "prisma-s" })]));
        expect(r.entries[0].status_in_system).toBe("PADRAO_DISPONIVEL");
    });

    it("DECLARADA quando o sistema só a menciona em prosa", () => {
        const r = Cat.resolve(REPO_ROOT, cat([entrada({ id: "d", notes: "[DECLARADA] citada na spec" })]));
        expect(r.entries[0].status_in_system).toBe("DECLARADA");
    });
});

describe("rastreabilidade e incerteza", () => {
    it("REPROVA entrada sem source_url", () => {
        const r = Cat.resolve(REPO_ROOT, cat([entrada({ id: "sem", source_url: "" })]));
        expect(r.valid).toBe(false);
        expect(r.without_source).toEqual(["sem"]);
        expect(r.errors.some((e) => /palpite/.test(e))).toBe(true);
    });

    it("marca 'unverified' quando algum campo ficou [A VERIFICAR]", () => {
        const r = Cat.resolve(REPO_ROOT, cat([
            entrada({ id: "duvida", version: "[A VERIFICAR]" }),
            entrada({ id: "certa", version: "2020" })
        ]));
        const m = Object.fromEntries(r.entries.map((e) => [e.id, e.unverified]));
        expect(m["duvida"]).toBe(true);
        expect(m["certa"]).toBe(false);
    });

    it("REPROVA catálogo ausente — sem ele o agente não tem mapa", () => {
        const r = Cat.resolve(REPO_ROOT, null);
        expect(r.valid).toBe(false);
        expect(r.total).toBe(0);
        expect(r.errors[0]).toMatch(/ausente/);
    });
});
