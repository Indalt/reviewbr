import * as fs from "node:fs";
import * as path from "node:path";
import { PrismaFlowValidator, PrismaFlowData } from "./prisma_validator.js";

/**
 * FlowComputer — deriva o Fluxograma PRISMA (F8.1) a partir dos ARTEFATOS reais
 * do projeto, nunca de números digitados (Regra RV-02: "os números emergem do processo").
 *
 * Alguns campos são CONTADOS de arquivos canônicos; os demais são COMPUTADOS pelas
 * identidades PRISMA (F8.1.4/6/8/10). O campo `included` é computado E cruzado com
 * `included.json` como verificação independente. O resultado é validado pelo
 * PrismaFlowValidator (RV-05) antes de ser gravado.
 *
 * Schema canônico de artefatos (relativo à raiz do projeto):
 *   01_raw/database_records.json          -> identified_db      (array de registros)
 *   01_raw/other_records.json             -> identified_other   (opcional; snowball/cinzenta)
 *   02_deduplicated/dataset.json          -> após dedup         (=> duplicates_removed, screened)
 *   03_screening/excluded_ta.json         -> title_abstract_excluded
 *   03_screening/fulltext_not_retrieved.json -> fulltext_not_retrieved (opcional)
 *   03_screening/excluded_fulltext.json   -> fulltext_excluded
 *   03_screening/included.json            -> checagem cruzada de `included`
 */

export interface FlowComputationResult {
    computed: PrismaFlowData;
    /** Como cada número foi obtido (arquivo contado ou identidade calculada). */
    provenance: Record<keyof PrismaFlowData, string>;
    /** Arquivos canônicos ausentes (contam como 0, mas ficam sinalizados — RV-03). */
    missing: string[];
    /** Validação matemática RV-05. */
    validation: { valid: boolean; errors: string[] };
    /** Divergências entre o prisma_flow.json existente e o recomputado (sinal de edição manual — RV-02). */
    manualEditWarnings: string[];
    /** Checagem cruzada: included calculado vs. tamanho de included.json. */
    includedCrossCheck: { computed: number; countedInFile: number | null; matches: boolean | null };
}

/** Conta o comprimento de um array JSON. Aceita array puro ou {records|included|excluded|items:[...]}. */
function countArray(filePath: string): number | null {
    if (!fs.existsSync(filePath)) return null;
    try {
        const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        if (Array.isArray(parsed)) return parsed.length;
        for (const key of ["records", "included", "excluded", "items", "results", "data"]) {
            if (Array.isArray(parsed?.[key])) return parsed[key].length;
        }
        return null;
    } catch {
        return null;
    }
}

export class FlowComputer {
    private validator = new PrismaFlowValidator();

    public compute(projectDir: string): FlowComputationResult {
        const missing: string[] = [];
        const provenance = {} as Record<keyof PrismaFlowData, string>;

        const countOrZero = (rel: string, label: string): number => {
            const n = countArray(path.join(projectDir, rel));
            if (n === null) {
                missing.push(rel);
                provenance[label as keyof PrismaFlowData] = `${rel} ausente → assumido 0 (verificar — RV-03)`;
                return 0;
            }
            provenance[label as keyof PrismaFlowData] = `contado de ${rel} (${n})`;
            return n;
        };

        // Campos CONTADOS de arquivos
        const identified_db = countOrZero("01_raw/database_records.json", "identified_db");
        const identified_other = countOrZero("01_raw/other_records.json", "identified_other");
        const afterDedup = countArray(path.join(projectDir, "02_deduplicated/dataset.json"));
        const title_abstract_excluded = countOrZero("03_screening/excluded_ta.json", "title_abstract_excluded");
        const fulltext_not_retrieved = countOrZero("03_screening/fulltext_not_retrieved.json", "fulltext_not_retrieved");
        const fulltext_excluded = countOrZero("03_screening/excluded_fulltext.json", "fulltext_excluded");

        // Campos COMPUTADOS por identidade PRISMA (F8.1)
        const rawTotal = identified_db + identified_other;
        const screened = afterDedup ?? rawTotal;
        if (afterDedup === null) missing.push("02_deduplicated/dataset.json");
        const duplicates_removed = Math.max(0, rawTotal - screened);
        provenance.duplicates_removed = `calculado: (identified_db + identified_other) − após_dedup = ${rawTotal} − ${screened}`;
        provenance.screened = afterDedup !== null
            ? `contado de 02_deduplicated/dataset.json (${screened})`
            : `sem dataset dedup → assumido = bruto (${screened})`;

        const retrieved_fulltext = Math.max(0, screened - title_abstract_excluded);
        provenance.retrieved_fulltext = `calculado (F8.1.6): screened − title_abstract_excluded = ${screened} − ${title_abstract_excluded}`;

        const fulltext_assessed = Math.max(0, retrieved_fulltext - fulltext_not_retrieved);
        provenance.fulltext_assessed = `calculado (F8.1.8): retrieved_fulltext − fulltext_not_retrieved = ${retrieved_fulltext} − ${fulltext_not_retrieved}`;

        const included = Math.max(0, fulltext_assessed - fulltext_excluded);
        provenance.included = `calculado (F8.1.10): fulltext_assessed − fulltext_excluded = ${fulltext_assessed} − ${fulltext_excluded}`;

        const computed: PrismaFlowData = {
            identified_db,
            identified_other,
            duplicates_removed,
            screened,
            title_abstract_excluded,
            retrieved_fulltext,
            fulltext_not_retrieved,
            fulltext_assessed,
            fulltext_excluded,
            included,
        };

        // Checagem cruzada independente de `included`
        const countedIncluded = countArray(path.join(projectDir, "03_screening/included.json"));
        const includedCrossCheck = {
            computed: included,
            countedInFile: countedIncluded,
            matches: countedIncluded === null ? null : countedIncluded === included,
        };

        // Sinal de edição manual (RV-02): comparar com prisma_flow.json existente
        const manualEditWarnings: string[] = [];
        const existingPath = path.join(projectDir, "prisma_flow.json");
        if (fs.existsSync(existingPath)) {
            try {
                const prev = JSON.parse(fs.readFileSync(existingPath, "utf-8"));
                for (const k of Object.keys(computed) as (keyof PrismaFlowData)[]) {
                    if (typeof prev[k] === "number" && prev[k] !== computed[k]) {
                        manualEditWarnings.push(`${k}: arquivo=${prev[k]} vs. calculado=${computed[k]}`);
                    }
                }
            } catch { /* ignore parse errors */ }
        }

        const validation = this.validator.validate(computed);
        return { computed, provenance, missing, validation, manualEditWarnings, includedCrossCheck };
    }

    /** Grava o prisma_flow.json recomputado (somente os 10 campos canônicos). */
    public writeFlow(projectDir: string, data: PrismaFlowData): void {
        fs.writeFileSync(path.join(projectDir, "prisma_flow.json"), JSON.stringify(data, null, 4) + "\n");
    }
}
