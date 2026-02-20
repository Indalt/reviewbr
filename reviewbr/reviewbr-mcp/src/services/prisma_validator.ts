import { z } from "zod";

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
}
