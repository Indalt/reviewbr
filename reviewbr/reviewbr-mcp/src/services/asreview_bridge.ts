/**
 * ASReview Bridge Service
 * 
 * Calls ASReview CLI as a subprocess from Node.js.
 * The ReviewBR MCP server prepares the data, sends it to ASReview,
 * and imports the results — all transparently.
 * 
 * ASReview is NOT embedded. It runs as an external process.
 * The researcher must have Python + ASReview installed.
 * 
 * Scientific basis: ASReview uses ELAS (active learning with
 * TF-IDF + Naive Bayes), published in Nature Machine Intelligence (2021).
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import * as path from "node:path";
import * as fs from "node:fs";
import { SearchResult } from "../types.js";
import { DataService } from "./data.js";

const execAsync = promisify(exec);

// ─── Types ───────────────────────────────────────────────────

export interface AsreviewConfig {
    model: string;           // "elas_u4" (default), "elas_l4", "elas_h4"
    seed: number;            // reproducibility seed (default: 42)
    nStop: number;           // stop after N labels (-1 = all, default: -1)
}

export interface AsreviewResult {
    success: boolean;
    asreviewVersion: string;
    outputPath: string;
    totalRecords: number;
    summary: string;
    error?: string;
}

// ─── Service ─────────────────────────────────────────────────

export class AsreviewBridgeService {

    private dataService = new DataService();

    /**
     * Check if ASReview is installed and accessible.
     */
    async checkInstalled(): Promise<{ installed: boolean; version: string; pythonPath: string }> {
        try {
            const { stdout } = await execAsync("python -m asreview --version", {
                timeout: 15000,
            });
            const version = stdout.trim();

            // Get Python path for reference
            const { stdout: pyPath } = await execAsync("python -c \"import sys; print(sys.executable)\"", {
                timeout: 5000,
            });

            return {
                installed: true,
                version,
                pythonPath: pyPath.trim(),
            };
        } catch {
            return {
                installed: false,
                version: "",
                pythonPath: "",
            };
        }
    }

    /**
     * Run ASReview simulate on a dataset.
     * 
     * Flow:
     * 1. Export records to ASReview-compatible CSV
     * 2. Call `asreview simulate` as subprocess
     * 3. Return path to .asreview output file + summary
     * 
     * IMPORTANT: `asreview simulate` requires a FULLY LABELED dataset.
     * This means the records must already have screening_decision set.
     * The simulation then evaluates how efficiently ASReview's ML would
     * have found the relevant records.
     */
    async runSimulate(
        records: SearchResult[],
        projectPath: string,
        config: Partial<AsreviewConfig> = {}
    ): Promise<AsreviewResult> {
        const model = config.model || "elas_u4";
        const seed = config.seed ?? 42;
        const nStop = config.nStop ?? -1;

        // Resolve project path
        const absProjectPath = path.isAbsolute(projectPath)
            ? projectPath
            : path.join(process.cwd(), projectPath);

        const screeningDir = path.join(absProjectPath, "03_screening");
        if (!fs.existsSync(screeningDir)) {
            fs.mkdirSync(screeningDir, { recursive: true });
        }

        // 1. Check ASReview is installed
        const { installed, version } = await this.checkInstalled();
        if (!installed) {
            return {
                success: false,
                asreviewVersion: "",
                outputPath: "",
                totalRecords: records.length,
                summary: "",
                error: "ASReview não está instalado. Instale com: pip install asreview",
            };
        }

        // 2. Export dataset to ASReview-compatible CSV
        const csvPath = path.join(screeningDir, "asreview_input.csv");
        const csvContent = this.dataService.exportDataset(records, "asreview");
        fs.writeFileSync(csvPath, csvContent, "utf-8");

        // 3. Run ASReview simulate
        const outputPath = path.join(screeningDir, "asreview_output.asreview");

        // Remove old output if exists (ASReview won't overwrite)
        if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }

        const cmd = [
            "python", "-m", "asreview", "simulate",
            `"${csvPath}"`,
            `-o`, `"${outputPath}"`,
            `--ai`, model,
            `--seed`, String(seed),
        ];

        if (nStop !== -1) {
            cmd.push(`--n-stop`, String(nStop));
        }

        try {
            const { stdout, stderr } = await execAsync(cmd.join(" "), {
                timeout: 300000, // 5 minutes max
                cwd: absProjectPath,
            });

            // 4. Log the execution
            const logPath = path.join(screeningDir, "asreview_execution_log.txt");
            const logContent = [
                `# ASReview Simulation Log`,
                `Timestamp: ${new Date().toISOString()}`,
                `ASReview Version: ${version}`,
                `Model: ${model}`,
                `Seed: ${seed}`,
                `N-Stop: ${nStop}`,
                `Records: ${records.length}`,
                `Input: ${csvPath}`,
                `Output: ${outputPath}`,
                ``,
                `## stdout`,
                stdout,
                ``,
                `## stderr`,
                stderr,
            ].join("\n");
            fs.writeFileSync(logPath, logContent, "utf-8");

            // 5. Build summary
            const summary = [
                `✅ Simulação ASReview concluída com sucesso.`,
                ``,
                `- **Versão:** ${version}`,
                `- **Modelo:** ${model} (Active Learning ELAS)`,
                `- **Seed:** ${seed} (reproduzível)`,
                `- **Registros processados:** ${records.length}`,
                `- **Arquivo de saída:** ${outputPath}`,
                ``,
                `O resultado foi gravado em \`03_screening/asreview_output.asreview\`.`,
                `O log completo está em \`03_screening/asreview_execution_log.txt\`.`,
            ].join("\n");

            return {
                success: true,
                asreviewVersion: version,
                outputPath,
                totalRecords: records.length,
                summary,
            };

        } catch (error: any) {
            const errorMsg = error.stderr || error.message || String(error);
            return {
                success: false,
                asreviewVersion: version,
                outputPath: "",
                totalRecords: records.length,
                summary: "",
                error: `Erro ao executar ASReview: ${errorMsg}`,
            };
        }
    }

    /**
     * Export dataset specifically for ASReview (convenience method).
     * Saves the CSV to the project's screening directory and returns the path.
     */
    async exportForAsreview(
        records: SearchResult[],
        projectPath: string
    ): Promise<{ csvPath: string; recordCount: number }> {
        const absProjectPath = path.isAbsolute(projectPath)
            ? projectPath
            : path.join(process.cwd(), projectPath);

        const screeningDir = path.join(absProjectPath, "03_screening");
        if (!fs.existsSync(screeningDir)) {
            fs.mkdirSync(screeningDir, { recursive: true });
        }

        const csvPath = path.join(screeningDir, "asreview_input.csv");
        const csvContent = this.dataService.exportDataset(records, "asreview");
        fs.writeFileSync(csvPath, csvContent, "utf-8");

        return { csvPath, recordCount: records.length };
    }
}
