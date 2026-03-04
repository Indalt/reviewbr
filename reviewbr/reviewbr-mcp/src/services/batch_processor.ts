/**
 * Batch Processing Service.
 * Provides three parametric engines for batch operations on project data,
 * eliminating the need for disposable scripts.
 * 
 * Engine 1: batch_keyword_screen — Filter PDFs or DB records by keywords
 * Engine 2: batch_llm_extract — Apply a custom LLM prompt to all PDFs
 * Engine 3: batch_db_screen — Screen database records by keyword or LLM
 */

import * as fs from "node:fs";
import * as path from "node:path";
import pdfParse from "pdf-parse";
import { DatabaseService } from "./database.js";
import { createDefaultProvider, type LLMProvider } from "./llm_provider.js";
import { logger } from "../utils/structured_logger.js";
import { sandboxedPath } from "../utils/path_sandbox.js";

// ─── Types ──────────────────────────────────────────────────

export interface KeywordScreenResult {
    filename: string;
    matchedKeywords: string[];
    excerpts: string[];
    isRelevant: boolean;
}

export interface LlmExtractResult {
    filename: string;
    extraction: string;
    error?: string;
}

export interface DbScreenResult {
    id: number;
    title: string;
    matched: boolean;
    matchedKeywords?: string[];
    llmClassification?: string;
}

// ─── Engine 1: Keyword Screen ───────────────────────────────

export class BatchProcessorService {
    private dbService: DatabaseService;

    constructor() {
        this.dbService = new DatabaseService();
    }

    /**
     * Engine 1: Screen PDFs in a directory by keywords.
     * 
     * @param pdfDir   Absolute path to PDF directory
     * @param keywords Keywords to search for
     * @param mode     "AND" (all keywords must match) or "OR" (any keyword matches)
     * @returns        Array of results with matched keywords and excerpts
     */
    async screenByKeywords(
        pdfDir: string,
        keywords: string[],
        mode: "AND" | "OR" = "OR"
    ): Promise<{ results: KeywordScreenResult[]; summary: string }> {
        const startTime = Date.now();
        logger.info("BATCH_KEYWORD", `Iniciando triagem por keywords em ${pdfDir}`, {
            keywords, mode,
        });

        if (!fs.existsSync(pdfDir)) {
            throw new Error(`Diretório não encontrado: ${pdfDir}`);
        }

        const pdfFiles = fs.readdirSync(pdfDir).filter(f => f.toLowerCase().endsWith(".pdf"));
        const results: KeywordScreenResult[] = [];

        for (let i = 0; i < pdfFiles.length; i++) {
            const file = pdfFiles[i];
            try {
                const buffer = fs.readFileSync(path.join(pdfDir, file));
                const data = await pdfParse(buffer);
                const text = data.text.toLowerCase();

                const matched: string[] = [];
                const excerpts: string[] = [];

                for (const kw of keywords) {
                    const kwLower = kw.toLowerCase();
                    if (text.includes(kwLower)) {
                        matched.push(kw);
                        // Extract context around first occurrence
                        const idx = text.indexOf(kwLower);
                        const start = Math.max(0, idx - 150);
                        const end = Math.min(text.length, idx + kwLower.length + 150);
                        const excerpt = data.text.substring(start, end).replace(/\s+/g, " ").trim();
                        if (excerpts.length < 3) {
                            excerpts.push(`...${excerpt}...`);
                        }
                    }
                }

                const isRelevant = mode === "AND"
                    ? matched.length === keywords.length
                    : matched.length > 0;

                results.push({
                    filename: file,
                    matchedKeywords: [...new Set(matched)],
                    excerpts,
                    isRelevant,
                });
            } catch (err: any) {
                logger.error("BATCH_KEYWORD", `Erro ao ler PDF: ${file}`, { error: err.message });
                results.push({
                    filename: file,
                    matchedKeywords: [],
                    excerpts: [`ERRO: ${err.message}`],
                    isRelevant: false,
                });
            }
        }

        const relevant = results.filter(r => r.isRelevant);
        const durationMs = Date.now() - startTime;

        logger.apiCall("BATCH_KEYWORD", {
            endpoint: pdfDir,
            query: keywords.join(", "),
            resultCount: relevant.length,
            durationMs,
        });

        const summary = [
            `## Triagem por Keywords (modo ${mode})`,
            `- **PDFs analisados:** ${results.length}`,
            `- **Relevantes:** ${relevant.length}`,
            `- **Não relevantes:** ${results.length - relevant.length}`,
            `- **Keywords:** ${keywords.join(", ")}`,
            `- **Tempo:** ${(durationMs / 1000).toFixed(1)}s`,
            "",
            "### Resultados Relevantes",
            ...relevant.map(r =>
                `- **${r.filename.substring(0, 70)}**\n  Keywords: ${r.matchedKeywords.join(", ")}\n  ${r.excerpts[0] ?? ""}`
            ),
            "",
            "### Não Relevantes",
            ...results.filter(r => !r.isRelevant).map(r =>
                `- ${r.filename.substring(0, 70)}`
            ),
        ].join("\n");

        return { results, summary };
    }

    // ─── Engine 2: LLM Extract ───────────────────────────────

    /**
     * Engine 2: Apply a custom LLM prompt to each PDF in a directory.
     * 
     * @param pdfDir   Absolute path to PDF directory
     * @param prompt   Extraction prompt (what to extract from each document)
     * @param maxPdfs  Max number of PDFs to process (default: all)
     * @returns        Array of extraction results + markdown summary
     */
    async llmExtract(
        pdfDir: string,
        prompt: string,
        maxPdfs?: number,
    ): Promise<{ results: LlmExtractResult[]; summary: string }> {
        const startTime = Date.now();
        const llm = createDefaultProvider();

        if (!llm) {
            throw new Error("Nenhuma chave de API LLM configurada. Configure GOOGLE_API_KEY, OPENAI_API_KEY ou ANTHROPIC_API_KEY.");
        }

        logger.info("BATCH_LLM", `Iniciando extração LLM em ${pdfDir}`, { prompt: prompt.substring(0, 100) });

        if (!fs.existsSync(pdfDir)) {
            throw new Error(`Diretório não encontrado: ${pdfDir}`);
        }

        const pdfFiles = fs.readdirSync(pdfDir).filter(f => f.toLowerCase().endsWith(".pdf"));
        const targets = maxPdfs ? pdfFiles.slice(0, maxPdfs) : pdfFiles;
        const results: LlmExtractResult[] = [];

        for (let i = 0; i < targets.length; i++) {
            const file = targets[i];
            try {
                const buffer = fs.readFileSync(path.join(pdfDir, file));
                const data = await pdfParse(buffer);

                // Smart chunk: first 15k + last 5k chars to fit in context
                let text = data.text;
                if (text.length > 20000) {
                    text = text.substring(0, 15000) + "\n\n[... conteúdo omitido ...]\n\n" + text.substring(text.length - 5000);
                }

                const fullPrompt = `Documento: ${file}\n\n${text}\n\n---\n\nINSTRUÇÃO: ${prompt}\n\nResponda de forma estruturada e concisa.`;

                const response = await llm.generateContent(fullPrompt);
                results.push({ filename: file, extraction: response });

                logger.info("BATCH_LLM", `[${i + 1}/${targets.length}] Extraído: ${file.substring(0, 50)}`, {
                    chars: text.length,
                });

            } catch (err: any) {
                logger.error("BATCH_LLM", `Erro em ${file}`, { error: err.message });
                results.push({ filename: file, extraction: "", error: err.message });
            }
        }

        const durationMs = Date.now() - startTime;
        const successful = results.filter(r => !r.error);

        logger.apiCall("BATCH_LLM", {
            endpoint: pdfDir,
            query: prompt.substring(0, 80),
            resultCount: successful.length,
            durationMs,
        });

        const summary = [
            `## Extração LLM`,
            `- **PDFs processados:** ${results.length}/${pdfFiles.length}`,
            `- **Sucesso:** ${successful.length}`,
            `- **Erros:** ${results.filter(r => r.error).length}`,
            `- **Tempo:** ${(durationMs / 1000).toFixed(1)}s`,
            `- **Prompt:** ${prompt.substring(0, 100)}...`,
            "",
            ...successful.map(r =>
                `### ${r.filename.substring(0, 60)}\n${r.extraction}\n`
            ),
        ].join("\n");

        return { results, summary };
    }

    // ─── Engine 3: DB Screen ─────────────────────────────────

    /**
     * Engine 3: Screen database records by keyword or LLM classification.
     * 
     * @param projectId  Project ID in the database
     * @param criteria   Keywords or screening criteria (natural language for LLM)
     * @param field      Which field to check: "title", "abstract", or "both"
     * @param useLlm     If true, uses LLM for semantic classification; false = keywords only
     * @returns          Array of screening results + markdown summary
     */
    async screenDbRecords(
        projectId: number,
        criteria: string,
        field: "title" | "abstract" | "both" = "both",
        useLlm: boolean = false,
    ): Promise<{ results: DbScreenResult[]; summary: string }> {
        const startTime = Date.now();
        logger.info("BATCH_DB", `Triagem de registros do projeto ${projectId}`, {
            criteria: criteria.substring(0, 100),
            field,
            useLlm,
        });

        // Get all records from the project
        const records = await this.dbService.getRecords(projectId);
        if (!records || records.length === 0) {
            return {
                results: [],
                summary: `Nenhum registro encontrado para o projeto ${projectId}.`,
            };
        }

        const results: DbScreenResult[] = [];
        const criteriaLower = criteria.toLowerCase();
        const criteriaKeywords = criteriaLower.split(/[,;\s]+/).filter(k => k.length > 2);

        if (useLlm) {
            // LLM-based screening
            const llm = createDefaultProvider();
            if (!llm) {
                throw new Error("LLM não configurado para triagem semântica.");
            }

            for (let i = 0; i < records.length; i++) {
                const record = records[i] as any;
                const textToCheck = field === "title" ? record.title
                    : field === "abstract" ? (record.abstract ?? "")
                        : `${record.title} ${record.abstract ?? ""}`;

                try {
                    const prompt = `Classifique este registro como YES (relevante) ou NO (não relevante) para o seguinte critério:\n\nCRITÉRIO: ${criteria}\n\nTÍTULO: ${record.title}\nTEXTO: ${textToCheck.substring(0, 3000)}\n\nResponda APENAS "YES" ou "NO" seguido de uma justificativa de uma linha.`;

                    const response = await llm.generateContent(prompt);
                    const matched = response.trim().toUpperCase().startsWith("YES");

                    results.push({
                        id: record.id,
                        title: record.title,
                        matched,
                        llmClassification: response.trim().substring(0, 200),
                    });
                } catch (err: any) {
                    logger.error("BATCH_DB", `Erro LLM para registro ${record.id}`, { error: err.message });
                    results.push({
                        id: record.id,
                        title: record.title,
                        matched: false,
                        llmClassification: `ERRO: ${err.message}`,
                    });
                }
            }
        } else {
            // Keyword-based screening
            for (const record of records) {
                const rec = record as any;
                const textToCheck = field === "title" ? (rec.title ?? "").toLowerCase()
                    : field === "abstract" ? (rec.abstract ?? "").toLowerCase()
                        : `${(rec.title ?? "").toLowerCase()} ${(rec.abstract ?? "").toLowerCase()}`;

                const matchedKws = criteriaKeywords.filter(kw => textToCheck.includes(kw));
                results.push({
                    id: rec.id,
                    title: rec.title,
                    matched: matchedKws.length > 0,
                    matchedKeywords: matchedKws.length > 0 ? matchedKws : undefined,
                });
            }
        }

        const durationMs = Date.now() - startTime;
        const matched = results.filter(r => r.matched);

        logger.apiCall("BATCH_DB", {
            endpoint: `projeto/${projectId}`,
            query: criteria.substring(0, 80),
            resultCount: matched.length,
            durationMs,
        });

        const summary = [
            `## Triagem de Registros (${useLlm ? "LLM" : "Keywords"})`,
            `- **Registros analisados:** ${results.length}`,
            `- **Relevantes:** ${matched.length}`,
            `- **Não relevantes:** ${results.length - matched.length}`,
            `- **Campo:** ${field}`,
            `- **Critério:** ${criteria}`,
            `- **Tempo:** ${(durationMs / 1000).toFixed(1)}s`,
            "",
            "### Relevantes",
            ...matched.map(r =>
                `- [${r.id}] **${r.title}**${r.llmClassification ? `\n  → ${r.llmClassification}` : ""}`
            ),
        ].join("\n");

        return { results, summary };
    }
}
