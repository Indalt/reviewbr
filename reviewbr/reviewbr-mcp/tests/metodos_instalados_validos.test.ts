import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MethodologyWriter } from "../src/services/maintenance_writes.js";

// DEBT-003 (com o DEBT-036) — os manifests declaravam RV-01..RV-08 sempre ativos e só tinham gate
// para quatro; o validate_methodology do próprio sistema reprovava os dois métodos, e nada rodava
// essa validação. Agora cada invariante tem gate ou declaração [NÃO COBERTO] com o motivo, e este
// teste roda o validador em todo método instalado — o "lembrar de chamar" vira suíte.
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const METODOS = fs.readdirSync(path.join(REPO, ".claude", "methodologies"), { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(REPO, ".claude", "methodologies", e.name, "manifest.json")))
    .map((e) => e.name);

describe("DEBT-003 — todo método instalado passa no validate_methodology", () => {
    it("há métodos instalados para conferir", () => {
        expect(METODOS).toEqual(expect.arrayContaining(["prisma-sr", "scoping-prisma-scr"]));
    });

    for (const m of METODOS) {
        it(`${m}: valida, e cada invariante tem gate ou [NÃO COBERTO] com motivo`, () => {
            const r = MethodologyWriter.validar(REPO, m);
            expect(r.errors).toEqual([]);
            expect(r.ok).toBe(true);
            const man = JSON.parse(fs.readFileSync(path.join(REPO, ".claude", "methodologies", m, "manifest.json"), "utf-8"));
            const gates = new Set(man.gates.map((g: any) => g.rule));
            for (const rv of man.invariants_always_on) {
                expect(gates.has(rv) || /\[NÃO COBERTO\]/.test(man.invariants_sem_gate?.[rv] ?? ""), rv).toBe(true);
            }
        });
    }

    it("RV-02 e RV-08 apontam para o export_dataset, que é quem barra; RV-04, para a decisão registrada", () => {
        for (const m of ["prisma-sr", "scoping-prisma-scr"]) {
            const gates = JSON.parse(fs.readFileSync(path.join(REPO, ".claude", "methodologies", m, "manifest.json"), "utf-8")).gates;
            const por = (rv: string) => gates.find((g: any) => g.rule === rv)?.tool;
            expect([por("RV-02"), por("RV-08"), por("RV-04")], m).toEqual(["export_dataset", "export_dataset", "record_researcher_decision"]);
        }
    });
});
