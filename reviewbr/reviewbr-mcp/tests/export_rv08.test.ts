import { describe, it, expect } from "vitest";
import { DataService } from "../src/services/data.js";

const svc = new DataService();

/** Registro mínimo com origem completa. */
const ok = (over: Record<string, unknown> = {}) => ({
    identifier: "id-1", title: "Estudo", creators: ["Autor A"], date: "2020-01-01",
    description: "resumo", subjectAreas: ["tema"], doi: "10.1/x",
    url: "https://repo.exemplo.org/item/1",
    repositoryId: "repo-x", repositoryName: "Repositório X",
    institution: "Universidade Y", accessMethod: "api",
    ...over
}) as any;

describe("RV-08 — o carimbo só sai quando a origem foi verificada", () => {
    it("APROVA quando todo registro tem repositório e URL", () => {
        const c = svc.checkProvenance([ok(), ok({ identifier: "id-2" })]);
        expect(c.valid).toBe(true);
        expect(c.missing).toEqual([]);
        expect(c.total).toBe(2);
    });

    it("REPROVA registro sem URL — origem não rastreável", () => {
        const c = svc.checkProvenance([ok(), ok({ identifier: "id-2", url: "" })]);
        expect(c.valid).toBe(false);
        expect(c.missing).toHaveLength(1);
        expect(c.missing[0].identifier).toBe("id-2");
        expect(c.missing[0].faltando).toContain("url");
    });

    it("REPROVA registro sem repositório algum", () => {
        const c = svc.checkProvenance([ok({ repositoryId: "", repositoryName: "" })]);
        expect(c.valid).toBe(false);
        expect(c.missing[0].faltando).toContain("repositoryName/repositoryId");
    });

    it("ACEITA repositoryId sozinho — um dos dois basta para rastrear", () => {
        expect(svc.checkProvenance([ok({ repositoryName: "" })]).valid).toBe(true);
        expect(svc.checkProvenance([ok({ repositoryId: "" })]).valid).toBe(true);
    });

    it("instituição ausente CONTA mas NÃO bloqueia — o campo é opcional no tipo", () => {
        // APIs como OpenAlex e Crossref costumam não trazer instituição; exigi-la
        // bloquearia export legítimo. O número aparece para a decisão ser do pesquisador.
        const c = svc.checkProvenance([ok({ institution: "" }), ok({ identifier: "id-2" })]);
        expect(c.valid).toBe(true);
        expect(c.semInstituicao).toBe(1);
    });

    it("a mensagem de erro nomeia os registros, não só a contagem", () => {
        const c = svc.checkProvenance([ok({ identifier: "problema-1", url: "" })]);
        expect(c.errors[0]).toMatch(/problema-1/);
        expect(c.errors[0]).toMatch(/RV-08/);
    });
});

describe("o carimbo de conformidade nunca mais é incondicional", () => {
    it("JSON: traz rv08_valid=false e lista os registros sem origem", () => {
        const out = JSON.parse(svc.exportDataset([ok({ url: "" })], "json"));
        expect(out._validation.rv08_valid).toBe(false);
        expect(out._validation.stamp).toMatch(/NAO CONFORME/);
        expect(out._validation.registros_sem_origem).toHaveLength(1);
    });

    it("JSON: quando tudo está certo, o selo declara o que foi verificado", () => {
        const out = JSON.parse(svc.exportDataset([ok()], "json"));
        expect(out._validation.rv08_valid).toBe(true);
        expect(out._validation.stamp).toMatch(/RV-08 verificada/);
    });

    it("CSV e Markdown não carregam 'PRISMA-S Compliant' quando a origem falta", () => {
        const csv = svc.exportDataset([ok({ url: "" })], "csv");
        const md = svc.exportDataset([ok({ url: "" })], "markdown");
        expect(csv).not.toMatch(/PRISMA-S Compliant/);
        expect(md).not.toMatch(/PRISMA-S Compliant/);
        expect(md).toMatch(/NÃO serve como evidência de conformidade/);
    });

    it("nenhum formato emite carimbo de conformidade sobre dado não verificado", () => {
        // o defeito original: 'PRISMA-S Compliant / Strict Protocol Enforced' saía sempre
        for (const f of ["json", "csv", "markdown"] as const) {
            expect(svc.exportDataset([ok({ url: "", repositoryName: "", repositoryId: "" })], f))
                .not.toMatch(/Strict Protocol Enforced/);
        }
    });

    it("o formato asreview segue limpo — é insumo de máquina, não evidência", () => {
        const csv = svc.exportDataset([ok()], "asreview");
        expect(csv.split("\n")[0]).toBe("title,abstract,keywords,authors,doi,url");
        expect(csv).not.toMatch(/RV-08/);
    });
});
