import { describe, it, expect } from "vitest";
import { MethodologyAuditorService } from "../src/services/methodology_auditor.js";

const svc = new MethodologyAuditorService();

const rec = (over: Record<string, unknown> = {}) => ({
    identifier: "id-1", title: "Estudo", creators: ["Autor A"], date: "2020-01-01",
    description: "resumo", url: "https://repo.exemplo.org/item/1",
    repositoryId: "repo-x", repositoryName: "Repositório X", accessMethod: "api",
    ...over,
}) as any;

/** DEBT-044 — audit_methodology roda 6 checagens mas o relatório dizia "score/5" e o
 *  veredito testava score===5, então 6 aprovações imprimiam "6/5" e "atende 6 de 5
 *  critérios" — denominador errado no artefato que existe para ser confiável. */
describe("DEBT-044 — maxScore do relatório bate com o nº real de checagens (6, não 5)", () => {
    it("report.maxScore é sempre 6 e igual ao nº de checks rodados", () => {
        const report = svc.audit({ dataset: [rec()] });
        expect(report.maxScore).toBe(6);
        expect(report.checks).toHaveLength(6);
    });

    it("o markdown NUNCA mostra '/5' fixo — o denominador é o maxScore real", () => {
        const report = svc.audit({ dataset: [rec()] });
        expect(report.markdownReport).toMatch(new RegExp(`\\*\\*${report.score}/${report.maxScore}\\*\\*`));
        expect(report.markdownReport).not.toMatch(/\/5\*\*/);
    });

    it("veredito compara com maxScore, não com 5 hardcoded — 'de 6 critérios'", () => {
        const report = svc.audit({ dataset: [rec()] });
        expect(report.markdownReport).toMatch(new RegExp(`de ${report.maxScore} crit[ée]rios|todos os ${report.maxScore} crit[ée]rios`));
        expect(report.markdownReport).not.toMatch(/de 5 crit[ée]rios|todos os 5 crit[ée]rios/);
    });
});
