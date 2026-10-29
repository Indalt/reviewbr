import { describe, it, expect } from "vitest";
import { MethodologyAuditorService } from "../src/services/methodology_auditor.js";

const svc = new MethodologyAuditorService();

const rec = (over: Record<string, unknown> = {}) => ({
    identifier: "id-1", title: "Estudo", creators: ["Autor A"], date: "2020-01-01",
    description: "resumo", url: "https://repo.exemplo.org/item/1",
    repositoryId: "repo-x", repositoryName: "Repositório X", accessMethod: "api",
    ...over,
}) as any;

function residualCheck(report: ReturnType<typeof svc.audit>) {
    return report.checks.find((c) => c.id === "residual_duplicates")!;
}

describe("DEBT-024 — residual_duplicates deixa de ser um gate que nunca reprova", () => {
    it("SEM log (auditoria de pesquisa externa): mantém o re-run do algoritmo, controle positivo continua detectando duplicata real", () => {
        const dataset = [
            rec({ identifier: "a", doi: "10.1590/abc" }),
            rec({ identifier: "b", doi: "10.1590/abc" }), // mesmo DOI, normalização idêntica -> dup real
        ];
        const report = svc.audit({ dataset });
        const check = residualCheck(report);
        expect(check.status).not.toBe("PASS");
        expect(check.detail).toMatch(/duplicata/i);
    });

    it("COM log vazio (self-audit, 0 duplicatas removidas): PASS citando o LOG, não o algoritmo", () => {
        const dataset = [rec({ identifier: "a" }), rec({ identifier: "b", title: "Outro" })];
        const report = svc.audit({ dataset, dedupePairs: [] });
        const check = residualCheck(report);
        expect(check.status).toBe("PASS");
        expect(check.detail).toMatch(/LOG/);
    });

    it("REPROVA (FAIL) quando o log diz 'removido' mas o registro AINDA está no dataset submetido — o caso que antes sempre passava", () => {
        // Este é exatamente o cenário do achado original: dataset já passou pelo dedup
        // (dedupePairs existe), mas o artefato final diverge do log. Rodar o mesmo
        // algoritmo de novo sobre este dataset daria duplicates=0 (b não colide com a
        // pelas chaves do DeduplicationService) — só o log expõe a inconsistência.
        const dataset = [rec({ identifier: "a" }), rec({ identifier: "b", title: "Outro Título" })];
        const report = svc.audit({
            dataset,
            dedupePairs: [{ mantido: "a", removido: "b", criterio: "doi", fontes: ["X", "Y"] }],
        });
        const check = residualCheck(report);
        expect(check.status).toBe("FAIL");
        expect(check.detail).toMatch(/b/);
        expect(check.detail).toMatch(/divergem/);
    });

    it("WARNING quando um 'mantido' do log não aparece mais no dataset submetido", () => {
        const dataset = [rec({ identifier: "c" })];
        const report = svc.audit({
            dataset,
            dedupePairs: [{ mantido: "a", removido: "b", criterio: "url", fontes: ["X"] }],
        });
        const check = residualCheck(report);
        expect(check.status).toBe("WARNING");
        expect(check.detail).toMatch(/mantido/i);
    });

    it("PASS quando o log confere: removido ausente, mantido presente", () => {
        const dataset = [rec({ identifier: "a" }), rec({ identifier: "c", title: "Terceiro" })];
        const report = svc.audit({
            dataset,
            dedupePairs: [{ mantido: "a", removido: "b", criterio: "titulo_ano", fontes: ["X", "Y"] }],
        });
        const check = residualCheck(report);
        expect(check.status).toBe("PASS");
        expect(check.detail).toMatch(/LOG/);
    });
});
