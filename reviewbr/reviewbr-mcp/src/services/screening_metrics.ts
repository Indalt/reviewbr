/**
 * Screening Metrics Service — Scientific Stopping Rule (R1)
 * 
 * Read-only service that computes screening saturation metrics
 * from the audit database. These metrics provide evidence-based
 * stopping criteria for systematic review screening phases.
 * 
 * Scientific basis:
 * - Saturation analysis: measures the rate of discovery of new relevant
 *   records across sequential batches. When the rate stabilizes near zero,
 *   continuing screening yields diminishing returns.
 * - Published in: van de Schoot et al. (2021) Nature Machine Intelligence.
 * 
 * This service NEVER modifies data. It only READS the existing
 * screening decisions from the database.
 */

import { DatabaseService } from "./database.js";

// ─── Types ───────────────────────────────────────────────────

interface BatchMetrics {
    batchNumber: number;
    totalScreened: number;
    relevantInBatch: number;
    irrelevantInBatch: number;
    uncertainInBatch: number;
    relevantRate: number;           // % of relevant in this batch
    cumulativeRelevant: number;
    cumulativeTotal: number;
    cumulativeRate: number;         // cumulative % of relevant
}

interface ScreeningReport {
    projectId: number;
    totalRecords: number;
    totalScreened: number;
    totalUnscreened: number;
    included: number;
    excluded: number;
    uncertain: number;
    screeningProgress: number;      // 0.0 – 1.0
    batches: BatchMetrics[];
    saturationAlert: boolean;
    saturationMessage: string;
    stoppingRecommendation: string;
    sourceCoverage: { source: string; count: number; screened: number }[];
    markdownReport: string;
    timestamp: string;
}

// ─── Service ─────────────────────────────────────────────────

export class ScreeningMetricsService {

    private static BATCH_SIZE = 20;         // Records per logical batch
    private static SATURATION_THRESHOLD = 0.05;  // 5% — below this → saturation
    private static SATURATION_WINDOW = 3;   // Consecutive batches to confirm

    /**
     * Generate a comprehensive screening report for a project.
     * Pure read-only operation on the database.
     */
    async generateReport(
        dbService: DatabaseService,
        projectId: number,
        batchSize?: number
    ): Promise<ScreeningReport> {
        const effectiveBatchSize = batchSize || ScreeningMetricsService.BATCH_SIZE;

        // 1. Get all records for the project
        const allRecords = await dbService.getRecords(projectId);
        const screenedRecords = allRecords.filter(r => r.stage === "screened");
        const unscreenedRecords = allRecords.filter(r => r.stage !== "screened");

        // 2. Count decisions
        const included = screenedRecords.filter(r =>
            r.screening_decision === "YES" || r.screening_decision === "MAYBE"
        ).length;
        const excluded = screenedRecords.filter(r =>
            r.screening_decision === "NO"
        ).length;
        const uncertain = screenedRecords.filter(r =>
            r.screening_decision === "MAYBE"
        ).length;

        // 3. Source coverage analysis
        const sourceMap = new Map<string, { count: number; screened: number }>();
        for (const r of allRecords) {
            const src = r.source || "unknown";
            if (!sourceMap.has(src)) sourceMap.set(src, { count: 0, screened: 0 });
            const entry = sourceMap.get(src)!;
            entry.count++;
            if (r.stage === "screened") entry.screened++;
        }
        const sourceCoverage = Array.from(sourceMap.entries()).map(([source, data]) => ({
            source,
            ...data,
        }));

        // 4. Compute batch metrics (simulated sequential batches)
        // We order by ID (insertion order ≈ screening order) to simulate batches
        const batches: BatchMetrics[] = [];
        let cumulativeRelevant = 0;
        let cumulativeTotal = 0;

        for (let i = 0; i < screenedRecords.length; i += effectiveBatchSize) {
            const batch = screenedRecords.slice(i, i + effectiveBatchSize);
            const batchNumber = Math.floor(i / effectiveBatchSize) + 1;

            const relevantInBatch = batch.filter(r =>
                r.screening_decision === "YES" || r.screening_decision === "MAYBE"
            ).length;
            const irrelevantInBatch = batch.filter(r =>
                r.screening_decision === "NO"
            ).length;
            const uncertainInBatch = batch.filter(r =>
                r.screening_decision === "MAYBE"
            ).length;

            cumulativeRelevant += relevantInBatch;
            cumulativeTotal += batch.length;

            batches.push({
                batchNumber,
                totalScreened: batch.length,
                relevantInBatch,
                irrelevantInBatch,
                uncertainInBatch,
                relevantRate: batch.length > 0 ? relevantInBatch / batch.length : 0,
                cumulativeRelevant,
                cumulativeTotal,
                cumulativeRate: cumulativeTotal > 0 ? cumulativeRelevant / cumulativeTotal : 0,
            });
        }

        // 5. Saturation analysis
        const { alert, message, recommendation } = this.computeSaturation(batches);

        // 6. Build markdown report
        const markdownReport = this.buildMarkdownReport({
            projectId,
            totalRecords: allRecords.length,
            totalScreened: screenedRecords.length,
            totalUnscreened: unscreenedRecords.length,
            included,
            excluded,
            uncertain,
            screeningProgress: allRecords.length > 0 ? screenedRecords.length / allRecords.length : 0,
            batches,
            saturationAlert: alert,
            saturationMessage: message,
            stoppingRecommendation: recommendation,
            sourceCoverage,
            markdownReport: "",
            timestamp: new Date().toISOString(),
        });

        return {
            projectId,
            totalRecords: allRecords.length,
            totalScreened: screenedRecords.length,
            totalUnscreened: unscreenedRecords.length,
            included,
            excluded,
            uncertain,
            screeningProgress: allRecords.length > 0 ? screenedRecords.length / allRecords.length : 0,
            batches,
            saturationAlert: alert,
            saturationMessage: message,
            stoppingRecommendation: recommendation,
            sourceCoverage,
            markdownReport,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Compute saturation alert based on batch metrics.
     * 
     * Algorithm: if the last N consecutive batches have a relevant rate
     * below the threshold, the screening is considered saturated.
     */
    private computeSaturation(batches: BatchMetrics[]): {
        alert: boolean;
        message: string;
        recommendation: string;
    } {
        if (batches.length === 0) {
            return {
                alert: false,
                message: "Nenhum registro triado ainda.",
                recommendation: "Inicie a triagem para obter métricas.",
            };
        }

        if (batches.length < ScreeningMetricsService.SATURATION_WINDOW) {
            return {
                alert: false,
                message: `Triados ${batches.length} batch(es). Mínimo de ${ScreeningMetricsService.SATURATION_WINDOW} batches necessários para análise de saturação.`,
                recommendation: "Continue a triagem — dados insuficientes para análise.",
            };
        }

        // Check last N batches
        const window = batches.slice(-ScreeningMetricsService.SATURATION_WINDOW);
        const allBelowThreshold = window.every(
            b => b.relevantRate < ScreeningMetricsService.SATURATION_THRESHOLD
        );

        const lastBatchRate = (batches[batches.length - 1].relevantRate * 100).toFixed(1);
        const avgWindowRate = (
            window.reduce((sum, b) => sum + b.relevantRate, 0) / window.length * 100
        ).toFixed(1);

        if (allBelowThreshold) {
            return {
                alert: true,
                message: `⚠️ SATURAÇÃO DETECTADA: Os últimos ${ScreeningMetricsService.SATURATION_WINDOW} batches tiveram taxa média de relevantes de ${avgWindowRate}% (limiar: ${ScreeningMetricsService.SATURATION_THRESHOLD * 100}%).`,
                recommendation: `A evidência sugere que a triagem pode ser encerrada. Os últimos ${ScreeningMetricsService.SATURATION_WINDOW} batches consecutivos apresentaram taxa de novos artigos relevantes abaixo de ${ScreeningMetricsService.SATURATION_THRESHOLD * 100}%. Decisão final cabe ao pesquisador.`,
            };
        }

        return {
            alert: false,
            message: `Taxa de relevantes no último batch: ${lastBatchRate}%. Média dos últimos ${ScreeningMetricsService.SATURATION_WINDOW} batches: ${avgWindowRate}%.`,
            recommendation: "Continue a triagem — taxa de descoberta ainda significativa.",
        };
    }

    /**
     * Build a structured Markdown report for the screening state.
     */
    private buildMarkdownReport(report: ScreeningReport): string {
        const lines: string[] = [
            `# Relatório de Triagem — Projeto #${report.projectId}`,
            `_Gerado em: ${new Date().toISOString()}_`,
            "",
            "## Resumo",
            "",
            `| Métrica | Valor |`,
            `|---------|-------|`,
            `| Total de registros | ${report.totalRecords} |`,
            `| Triados | ${report.totalScreened} (${(report.screeningProgress * 100).toFixed(1)}%) |`,
            `| Não triados | ${report.totalUnscreened} |`,
            `| Incluídos (YES/MAYBE) | ${report.included} |`,
            `| Excluídos (NO) | ${report.excluded} |`,
            `| Incertos (MAYBE) | ${report.uncertain} |`,
            "",
        ];

        // Source coverage
        if (report.sourceCoverage.length > 0) {
            lines.push("## Cobertura por Fonte");
            lines.push("");
            lines.push("| Fonte | Total | Triados | Cobertura |");
            lines.push("|-------|-------|---------|-----------|");
            for (const src of report.sourceCoverage) {
                const pct = src.count > 0 ? ((src.screened / src.count) * 100).toFixed(0) : "0";
                lines.push(`| ${src.source} | ${src.count} | ${src.screened} | ${pct}% |`);
            }
            lines.push("");
        }

        // Batch progression
        if (report.batches.length > 0) {
            lines.push("## Progressão por Batch");
            lines.push("");
            lines.push("| Batch | Triados | Relevantes | Taxa | Acumulado |");
            lines.push("|-------|---------|------------|------|-----------|");
            for (const b of report.batches) {
                lines.push(
                    `| ${b.batchNumber} | ${b.totalScreened} | ${b.relevantInBatch} | ${(b.relevantRate * 100).toFixed(1)}% | ${b.cumulativeRelevant}/${b.cumulativeTotal} (${(b.cumulativeRate * 100).toFixed(1)}%) |`
                );
            }
            lines.push("");
        }

        // Saturation analysis
        lines.push("## Análise de Saturação");
        lines.push("");
        lines.push(report.saturationMessage);
        lines.push("");
        lines.push(`**Recomendação:** ${report.stoppingRecommendation}`);
        lines.push("");

        return lines.join("\n");
    }
}
