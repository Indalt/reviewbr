/**
 * Methodology Auditor Service (Post-Hoc Validation)
 * 
 * Validates the methodological conformity of an already-completed research project.
 * This service NEVER searches, downloads, or generates new data.
 * It acts as a mirror, not a paintbrush.
 * 
 * Runs 5 conformity checks:
 *   1. Base Coverage (≥2 databases)
 *   2. Search Strategy Documentation
 *   3. PRISMA Flow Mathematical Consistency
 *   4. Residual Duplicates Detection
 *   5. Selection Bias Indicators
 */

import { SearchResult } from "../types.js";
import { DeduplicationService } from "./dedupe.js";
import { PrismaFlowValidator, PrismaFlowSchema, type PrismaFlowData } from "./prisma_validator.js";

// ─── Types ───────────────────────────────────────────────────

export interface AuditInput {
    dataset: SearchResult[];
    searchTermsUsed?: string;
    prismaFlowData?: PrismaFlowData;
}

export interface AuditCheckResult {
    id: string;
    name: string;
    status: "PASS" | "WARNING" | "FAIL";
    icon: string;
    detail: string;
    suggestion?: string;
}

export interface AuditReport {
    score: number;
    maxScore: number;
    checks: AuditCheckResult[];
    markdownReport: string;
    timestamp: string;
}

// ─── Service ─────────────────────────────────────────────────

export class MethodologyAuditorService {
    private dedupeService: DeduplicationService;
    private prismaValidator: PrismaFlowValidator;

    constructor() {
        this.dedupeService = new DeduplicationService();
        this.prismaValidator = new PrismaFlowValidator();
    }

    /**
     * Run all 5 conformity checks on the submitted dataset.
     */
    audit(input: AuditInput): AuditReport {
        const checks: AuditCheckResult[] = [];

        checks.push(this.checkBaseCoverage(input.dataset));
        checks.push(this.checkSearchStrategy(input.searchTermsUsed));
        checks.push(this.checkPrismaFlow(input.prismaFlowData));
        checks.push(this.checkResidualDuplicates(input.dataset));
        checks.push(this.checkSelectionBias(input.dataset));
        checks.push(this.checkTransparencyAudit(input.dataset));

        const score = checks.filter(c => c.status === "PASS").length;
        const report = this.generateMarkdownReport(checks, score, input.dataset.length);

        return {
            score,
            maxScore: 6,
            checks,
            markdownReport: report,
            timestamp: new Date().toISOString(),
        };
    }

    // ─── Check 1: Base Coverage ──────────────────────────────

    private checkBaseCoverage(dataset: SearchResult[]): AuditCheckResult {
        const bases = new Set<string>();
        for (const record of dataset) {
            if (record.repositoryName) bases.add(record.repositoryName);
            else if (record.repositoryId) bases.add(record.repositoryId);
        }

        const count = bases.size;

        if (count >= 3) {
            return {
                id: "base_coverage",
                name: "Cobertura de Bases de Dados",
                status: "PASS",
                icon: "✅",
                detail: `O dataset contém registros de ${count} bases distintas: ${[...bases].join(", ")}.`,
            };
        } else if (count === 2) {
            return {
                id: "base_coverage",
                name: "Cobertura de Bases de Dados",
                status: "WARNING",
                icon: "⚠️",
                detail: `Apenas ${count} bases representadas: ${[...bases].join(", ")}. PRISMA-S recomenda ≥3 para revisões sistemáticas.`,
                suggestion: "Considere documentar a justificativa para a escolha limitada de bases ou complementar com buscas em bases adicionais (ex: Scopus, Web of Science, bases regionais).",
            };
        } else {
            return {
                id: "base_coverage",
                name: "Cobertura de Bases de Dados",
                status: "FAIL",
                icon: "❌",
                detail: count === 1
                    ? `Apenas 1 base representada: ${[...bases].join(", ")}. Revisões sistemáticas exigem múltiplas fontes.`
                    : "Nenhuma base de dados identificada nos registros submetidos. Os campos `repositoryName` ou `repositoryId` estão vazios.",
                suggestion: "Documente todas as bases consultadas no protocolo. Se buscas manuais foram realizadas, registre-as como 'identified_other' no fluxograma PRISMA.",
            };
        }
    }

    // ─── Check 2: Search Strategy Documentation ──────────────

    private checkSearchStrategy(searchTerms?: string): AuditCheckResult {
        if (!searchTerms || searchTerms.trim().length === 0) {
            return {
                id: "search_strategy",
                name: "Documentação da Estratégia de Busca",
                status: "FAIL",
                icon: "❌",
                detail: "Os termos de busca utilizados não foram fornecidos. PRISMA-S (Item 3) exige documentação completa da estratégia de busca.",
                suggestion: "Forneça a string de busca completa utilizada em cada base (incluindo operadores booleanos, truncamentos e filtros). Exemplo: '(cashew OR \"Anacardium occidentale\") AND antioxidant'.",
            };
        }

        // Heuristics for quality
        const hasBooleans = /\b(AND|OR|NOT)\b/.test(searchTerms);
        const hasParentheses = /[()]/.test(searchTerms);
        const wordCount = searchTerms.split(/\s+/).length;

        if (hasBooleans && wordCount >= 3) {
            return {
                id: "search_strategy",
                name: "Documentação da Estratégia de Busca",
                status: "PASS",
                icon: "✅",
                detail: `Estratégia de busca documentada com ${wordCount} termos e operadores booleanos detectados.`,
            };
        } else {
            return {
                id: "search_strategy",
                name: "Documentação da Estratégia de Busca",
                status: "WARNING",
                icon: "⚠️",
                detail: `Termos fornecidos ("${searchTerms.slice(0, 80)}..."), porém ${!hasBooleans ? "sem operadores booleanos (AND/OR/NOT) detectados" : "com estrutura simples"}.`,
                suggestion: "PRISMA-S recomenda estratégias com operadores booleanos, truncamentos (*) e sinônimos para garantir sensibilidade. Documente a estratégia completa por base.",
            };
        }
    }

    // ─── Check 3: PRISMA Flow Consistency ────────────────────

    private checkPrismaFlow(flowData?: PrismaFlowData): AuditCheckResult {
        if (!flowData) {
            return {
                id: "prisma_flow",
                name: "Consistência do Fluxograma PRISMA",
                status: "FAIL",
                icon: "❌",
                detail: "Os dados do fluxograma PRISMA não foram fornecidos. Sem os números do funil, não é possível validar a consistência aritmética.",
                suggestion: "Forneça os 10 campos numéricos do PRISMA Flow: identified_db, identified_other, duplicates_removed, screened, title_abstract_excluded, retrieved_fulltext, fulltext_not_retrieved, fulltext_assessed, fulltext_excluded, included.",
            };
        }

        const validation = this.prismaValidator.validate(flowData);

        if (validation.valid) {
            return {
                id: "prisma_flow",
                name: "Consistência do Fluxograma PRISMA",
                status: "PASS",
                icon: "✅",
                detail: `Todas as equações do funil PRISMA estão matematicamente consistentes. Total identificado: ${flowData.identified_db + flowData.identified_other}, incluídos: ${flowData.included}.`,
            };
        } else {
            return {
                id: "prisma_flow",
                name: "Consistência do Fluxograma PRISMA",
                status: "FAIL",
                icon: "❌",
                detail: `Inconsistências matemáticas detectadas no funil:\n${validation.errors.map(e => `  - ${e}`).join("\n")}`,
                suggestion: "Revise os números do fluxograma. Os totais de cada etapa devem somar corretamente com as exclusões. Use a ferramenta `validate_prisma_flow` para testar correções.",
            };
        }
    }

    // ─── Check 4: Residual Duplicates ────────────────────────

    private checkResidualDuplicates(dataset: SearchResult[]): AuditCheckResult {
        if (dataset.length === 0) {
            return {
                id: "residual_duplicates",
                name: "Duplicatas Residuais",
                status: "WARNING",
                icon: "⚠️",
                detail: "Dataset vazio — não é possível verificar duplicatas.",
            };
        }

        const result = this.dedupeService.deduplicate(dataset);
        const dupRate = (result.stats.duplicates / result.stats.total) * 100;

        if (result.stats.duplicates === 0) {
            return {
                id: "residual_duplicates",
                name: "Duplicatas Residuais",
                status: "PASS",
                icon: "✅",
                detail: `Nenhuma duplicata detectada entre os ${result.stats.total} registros submetidos.`,
            };
        } else if (dupRate < 5) {
            return {
                id: "residual_duplicates",
                name: "Duplicatas Residuais",
                status: "WARNING",
                icon: "⚠️",
                detail: `${result.stats.duplicates} duplicatas residuais detectadas (${dupRate.toFixed(1)}% do dataset). Taxa aceitável, mas deve ser documentada.`,
                suggestion: "Remova as duplicatas residuais ou documente a justificativa (ex: versões diferentes do mesmo artigo em bases distintas).",
            };
        } else {
            return {
                id: "residual_duplicates",
                name: "Duplicatas Residuais",
                status: "FAIL",
                icon: "❌",
                detail: `${result.stats.duplicates} duplicatas detectadas (${dupRate.toFixed(1)}% do dataset). Taxa elevada sugere falha na etapa de deduplicação.`,
                suggestion: "Execute a ferramenta `deduplicate_dataset` sobre o dataset para remover repetições antes de prosseguir com a triagem.",
            };
        }
    }

    // ─── Check 5: Selection Bias Indicators ──────────────────

    private checkSelectionBias(dataset: SearchResult[]): AuditCheckResult {
        if (dataset.length < 5) {
            return {
                id: "selection_bias",
                name: "Indicadores de Viés de Seleção",
                status: "WARNING",
                icon: "⚠️",
                detail: `Dataset muito pequeno (${dataset.length} registros) para uma análise estatística de viés.`,
            };
        }

        const warnings: string[] = [];

        // Temporal analysis
        const years = dataset
            .map(r => r.date ? parseInt(r.date.substring(0, 4)) : null)
            .filter((y): y is number => y !== null && !isNaN(y));

        if (years.length > 0) {
            const uniqueYears = new Set(years);
            if (uniqueYears.size === 1) {
                warnings.push(`Todos os ${years.length} artigos com data são do mesmo ano (${[...uniqueYears][0]}). Concentração temporal extrema.`);
            } else {
                const sorted = [...years].sort((a, b) => a - b);
                const range = sorted[sorted.length - 1] - sorted[0];
                if (range <= 2 && dataset.length > 10) {
                    warnings.push(`Faixa temporal muito estreita (${sorted[0]}-${sorted[sorted.length - 1]}). Pode indicar restrição temporal excessiva.`);
                }
            }
        }

        // Geographic/institutional concentration
        const institutions = dataset
            .map(r => r.institution)
            .filter((inst): inst is string => !!inst);

        if (institutions.length > 0) {
            const uniqueInst = new Set(institutions);
            if (uniqueInst.size === 1 && institutions.length > 5) {
                warnings.push(`Todos os registros com instituição identificada (${institutions.length}) são da mesma fonte: "${[...uniqueInst][0]}".`);
            }
        }

        // Language concentration
        const languages = dataset
            .map(r => r.language)
            .filter((l): l is string => !!l);

        if (languages.length > 0) {
            const uniqueLangs = new Set(languages);
            if (uniqueLangs.size === 1 && languages.length > 10) {
                const lang = [...uniqueLangs][0];
                if (lang !== "en" && lang !== "eng") {
                    warnings.push(`Todos os artigos estão em um único idioma (${lang}). Pode haver viés linguístico.`);
                }
            }
        }

        if (warnings.length === 0) {
            return {
                id: "selection_bias",
                name: "Indicadores de Viés de Seleção",
                status: "PASS",
                icon: "✅",
                detail: `Nenhum indicador de viés detectado. Distribuição temporal, institucional e linguística aparenta diversidade adequada.`,
            };
        } else {
            return {
                id: "selection_bias",
                name: "Indicadores de Viés de Seleção",
                status: warnings.length >= 2 ? "FAIL" : "WARNING",
                icon: warnings.length >= 2 ? "❌" : "⚠️",
                detail: `Indicadores de viés detectados:\n${warnings.map(w => `  - ${w}`).join("\n")}`,
                suggestion: "Documente as justificativas para qualquer restrição intencional (ex: recorte temporal definido no protocolo). Se não foram intencionais, considere expandir os critérios.",
            };
        }
    }

    // ─── Check 6: Transparency & Data Retrieval (PRISMA-S) ──

    private checkTransparencyAudit(dataset: SearchResult[]): AuditCheckResult {
        if (dataset.length === 0) {
            return {
                id: "transparency_audit",
                name: "Auditoria de Transparência e Proveniência (PRISMA-S)",
                status: "WARNING",
                icon: "⚠️",
                detail: "Dataset vazio — não é possível auditar proveniência.",
            };
        }

        const missingAudit = dataset.filter(r => !r.audit).length;
        const missingQuery = dataset.filter(r => r.audit && !r.audit.searchQueryUsed).length;
        const missingProvenance = dataset.filter(r => r.audit && !r.audit.provenanceSource).length;
        const missingMethodology = dataset.filter(r => r.audit && !r.audit.methodology).length;

        const warnings: string[] = [];
        if (missingAudit > 0) warnings.push(`${missingAudit} registros sem bloco de auditoria estruturado.`);
        if (missingQuery > 0) warnings.push(`${missingQuery} registros sem registro da query exata utilizada (PRISMA-S Item 3).`);
        if (missingProvenance > 0) warnings.push(`${missingProvenance} registros sem fonte de proveniência técnica (URL/API).`);
        if (missingMethodology > 0) warnings.push(`${missingMethodology} registros sem metodologia de captura definida.`);

        if (warnings.length === 0) {
            return {
                id: "transparency_audit",
                name: "Auditoria de Transparência e Proveniência (PRISMA-S)",
                status: "PASS",
                icon: "✅",
                detail: `Proveniência completa: Todos os ${dataset.length} registros possuem metadados de auditoria estruturados (Query, Data, Fonte e Metodologia).`,
            };
        } else {
            return {
                id: "transparency_audit",
                name: "Auditoria de Transparência e Proveniência (PRISMA-S)",
                status: "FAIL",
                icon: "❌",
                detail: `Lacunas de transparência crítica detectadas (Violação do Item 3 e 8 do PRISMA-S):\n${warnings.map(w => `  - ${w}`).join("\n")}`,
                suggestion: "As novas travas do sistema exigem que toda captura de dados registre a query e a fonte exata. Registros antigos ou importações manuais incompletas devem ser enriquecidos.",
            };
        }
    }

    // ─── Report Generation ───────────────────────────────────

    private generateMarkdownReport(checks: AuditCheckResult[], score: number, datasetSize: number): string {
        const lines: string[] = [];

        lines.push("# 📋 Relatório de Auditoria Metodológica (Post-Hoc)");
        lines.push("");
        lines.push(`**Data:** ${new Date().toISOString().split("T")[0]}`);
        lines.push(`**Registros Submetidos:** ${datasetSize}`);
        lines.push(`**Score de Conformidade:** **${score}/5** ${score >= 4 ? "✅" : score >= 2 ? "⚠️" : "❌"}`);
        lines.push("");
        lines.push("> **Modo de Operação:** Auditoria Passiva — Nenhum dado novo foi gerado, buscado ou inserido. Este relatório reflete exclusivamente a análise do material submetido pelo pesquisador.");
        lines.push("");
        lines.push("---");
        lines.push("");

        for (const check of checks) {
            lines.push(`## ${check.icon} ${check.name}`);
            lines.push("");
            lines.push(check.detail);
            lines.push("");
            if (check.suggestion) {
                lines.push(`> **Sugestão:** ${check.suggestion}`);
                lines.push("");
            }
            lines.push("---");
            lines.push("");
        }

        // Final verdict
        lines.push("## Veredito");
        lines.push("");
        if (score === 5) {
            lines.push("A pesquisa submetida atende **todos os 5 critérios de conformidade** auditados. A metodologia está alinhada com as diretrizes PRISMA/PRISMA-S.");
        } else if (score >= 3) {
            lines.push(`A pesquisa atende ${score} de 5 critérios. Os itens pendentes devem ser documentados ou justificados antes da submissão para publicação.`);
        } else {
            lines.push(`A pesquisa atende apenas ${score} de 5 critérios. Recomenda-se revisão metodológica significativa antes da submissão.`);
        }
        lines.push("");
        lines.push("---");
        lines.push("*Relatório gerado automaticamente pelo ReviewBR — Modo de Auditoria Passiva.*");

        return lines.join("\n");
    }
}
