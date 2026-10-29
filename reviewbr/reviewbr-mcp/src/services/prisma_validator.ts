import { z } from "zod";
import * as fs from "node:fs";
import * as path from "node:path";

export const PrismaFlowSchema = z.object({
    identified_db: z.number().min(0),
    identified_other: z.number().min(0),
    duplicates_removed: z.number().min(0),
    screened: z.number().min(0),
    title_abstract_excluded: z.number().min(0),
    retrieved_fulltext: z.number().min(0),
    fulltext_not_retrieved: z.number().min(0),
    fulltext_assessed: z.number().min(0),
    fulltext_excluded: z.number().min(0),
    included: z.number().min(0)
});

export type PrismaFlowData = z.infer<typeof PrismaFlowSchema>;

export class PrismaFlowValidator {
    /**
     * Validates the mathematical consistency of a PRISMA Flow Diagram
     * according to Rule RV-05 of the Master Specification.
     */
    public validate(data: PrismaFlowData): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // F8.1.4: screened = identified_db + identified_other - duplicates_removed
        const expectedScreened = data.identified_db + data.identified_other - data.duplicates_removed;
        if (data.screened !== expectedScreened) {
            errors.push(`Math mismatch (F8.1.4): 'screened' (${data.screened}) should be 'identified_db' (${data.identified_db}) + 'identified_other' (${data.identified_other}) - 'duplicates_removed' (${data.duplicates_removed}) = ${expectedScreened}`);
        }

        // F8.1.6: retrieved_fulltext = screened - title_abstract_excluded
        const expectedRetrieved = data.screened - data.title_abstract_excluded;
        if (data.retrieved_fulltext !== expectedRetrieved) {
            errors.push(`Math mismatch (F8.1.6): 'retrieved_fulltext' (${data.retrieved_fulltext}) should be 'screened' (${data.screened}) - 'title_abstract_excluded' (${data.title_abstract_excluded}) = ${expectedRetrieved}`);
        }

        // F8.1.8: fulltext_assessed = retrieved_fulltext - fulltext_not_retrieved
        const expectedAssessed = data.retrieved_fulltext - data.fulltext_not_retrieved;
        if (data.fulltext_assessed !== expectedAssessed) {
            errors.push(`Math mismatch (F8.1.8): 'fulltext_assessed' (${data.fulltext_assessed}) should be 'retrieved_fulltext' (${data.retrieved_fulltext}) - 'fulltext_not_retrieved' (${data.fulltext_not_retrieved}) = ${expectedAssessed}`);
        }

        // F8.1.10: included = fulltext_assessed - fulltext_excluded
        const expectedIncluded = data.fulltext_assessed - data.fulltext_excluded;
        if (data.included !== expectedIncluded) {
            errors.push(`Math mismatch (F8.1.10): 'included' (${data.included}) should be 'fulltext_assessed' (${data.fulltext_assessed}) - 'fulltext_excluded' (${data.fulltext_excluded}) = ${expectedIncluded}`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Gate de export (RV-05): lê o `prisma_flow.json` do projeto e valida a aritmética.
     *
     * Existe como método, e não embutido no handler da tool, para ser testável — a auditoria
     * registrou que lógica de gate dentro do handler não tem como ser verificada.
     *
     * Semântica deliberada, em três estados:
     *  - fluxo AUSENTE  → `blocked: false`. Em F2–F4 ele ainda não existe e exportar é legítimo.
     *  - fluxo ILEGÍVEL ou incompleto → bloqueia. Arquivo corrompido não é o mesmo que ausente.
     *  - fluxo que NÃO FECHA → bloqueia, com a conta que falhou.
     */
    public checkExportGate(projectDir: string): { blocked: boolean; reason?: string; errors: string[] } {
        const flowPath = path.join(projectDir, "prisma_flow.json");
        if (!fs.existsSync(flowPath)) {
            return { blocked: false, errors: [] };
        }

        let raw: unknown;
        try {
            raw = JSON.parse(fs.readFileSync(flowPath, "utf-8"));
        } catch {
            return {
                blocked: true,
                reason: `prisma_flow.json ilegível em ${flowPath}. Recompute com 'compute_flow_counts'.`,
                errors: []
            };
        }

        const parsed = PrismaFlowSchema.safeParse(raw);
        if (!parsed.success) {
            return {
                blocked: true,
                reason: "prisma_flow.json não tem os 10 campos canônicos.",
                errors: parsed.error.issues.map((i) => `${i.path.join(".") || "(raiz)"}: ${i.message}`)
            };
        }

        const v = this.validate(parsed.data);
        if (!v.valid) {
            return {
                blocked: true,
                reason: "A aritmética do funil não fecha. Recompute com 'compute_flow_counts' " +
                    "(RV-02: as contagens emergem dos artefatos, nunca são digitadas).",
                errors: v.errors
            };
        }

        return { blocked: false, errors: [] };
    }
}
