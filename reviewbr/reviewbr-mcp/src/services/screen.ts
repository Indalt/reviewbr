
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SearchResult } from "../types.js";
import { PdfExtractorService } from "./pdf_extractor.js";
import { ScreeningAuditService, isPinned, sha256 } from "./screening_audit.js";
import * as path from "node:path";
import * as fs from "node:fs";

// ─── Interfaces ──────────────────────────────────────────────

export interface ScreeningResult {
    decision: "YES" | "NO" | "MAYBE";
    score: number;
    reasoning: string;
    justification?: {
        reasoning_steps: string[];
        supporting_sentences: string[];
    };
    filters_applied?: {
        language?: string;
        article_type?: string;
        topic_score?: number;
    };
    record: SearchResult;
}

/**
 * Screening configuration — absorbs multi-filter architecture from Go legacy.
 */
export interface ScreeningConfig {
    criteria: string;
    filters?: {
        language?: {
            enabled: boolean;
            accepted: string[];         // e.g. ["pt", "en", "es"]
        };
        articleType?: {
            enabled: boolean;
            excludeReviews?: boolean;
            excludeEditorials?: boolean;
            excludeLetters?: boolean;
            excludeTheoreticalOnly?: boolean;
        };
        topicRelevance?: {
            enabled: boolean;
            minScore: number;           // 0-100
        };
    };
    cotJustification?: boolean;          // Chain-of-thought (from Go legacy)
    /** 'ta' (título/resumo) ou 'fulltext'. Usado só para nomear a corrida na trilha. */
    stage?: string;
}

// ─── Service ─────────────────────────────────────────────────

export class ScreeningService {
    private genAI: GoogleGenerativeAI;
    private model: any;
    private pdfExtractor: PdfExtractorService;
    /** Registrados para a trilha de auditoria (RAISE §4.9.1: nome, versão e datas). */
    public readonly modelName: string;
    public readonly temperature: number;

    /**
     * @param modelName nome do modelo. Aceita alias (ex.: "gemini-2.5-flash-lite") ou versão
     *                  fixada (ex.: "gemini-2.5-flash-lite-001"). A trilha de auditoria avisa
     *                  quando é alias, porque alias pode mudar de artefato sem aviso.
     * @param temperature fixada em 0 por padrão. A rota de extração (`llm_provider.ts`) já
     *                    fazia isso; a de triagem — que decide INCLUSÃO — não fazia, e era a
     *                    assimetria mais grave do sistema: a decisão mais consequente estava
     *                    na rota menos controlada.
     */
    constructor(apiKey: string, modelName: string = "gemini-2.5-flash-lite", temperature: number = 0) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.modelName = modelName;
        this.temperature = temperature;
        this.model = this.genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { temperature }
        });
        this.pdfExtractor = new PdfExtractorService();
    }

    /**
     * Screen candidates with multi-filter support and optional CoT justification.
     * Backward-compatible: if config is a string, uses it as criteria (legacy mode).
     */
    async screenCandidates(
        candidates: SearchResult[],
        configOrCriteria: ScreeningConfig | string,
        projectPath?: string
    ): Promise<{ included: ScreeningResult[]; excluded: ScreeningResult[]; errors: string[] }> {
        // Backward-compatible: accept string as criteria
        const config: ScreeningConfig = typeof configOrCriteria === "string"
            ? { criteria: configOrCriteria }
            : configOrCriteria;

        const included: ScreeningResult[] = [];
        const excluded: ScreeningResult[] = [];
        const errors: string[] = [];

        // Trilha de auditoria (RAISE §4.3 e §4.9). Só existe com projectPath: sem projeto não
        // há onde gravar, e triagem sem rastro não é declarável. O template do prompt é
        // amostrado do primeiro candidato — é o mesmo para todos, variando só o registro.
        let audit: ScreeningAuditService | undefined;
        if (projectPath && candidates.length > 0) {
            // DEBT-020: buildPrompt agora pode lançar (stage='fulltext' sem o texto do
            // 1º candidato) — isso é erro DAQUELE candidato, não motivo para a corrida
            // inteira falhar antes de processar ninguém. O template é só amostra para a
            // trilha; se o 1º candidato não tem fulltext, screenOne vai capturar o mesmo
            // erro para ELE especificamente quando for a vez dele.
            const template = await this.buildPrompt(candidates[0], config, projectPath)
                .catch((e) => `[amostra indisponível: ${(e as Error).message}]`);
            audit = new ScreeningAuditService(
                projectPath, config.stage ?? "ta", this.modelName, this.temperature,
                template, new Date().toISOString()
            );
        }

        // Process in parallel with concurrency limit
        const concurrency = 5;
        for (let i = 0; i < candidates.length; i += concurrency) {
            const chunk = candidates.slice(i, i + concurrency);
            const promises = chunk.map(candidate => this.screenOne(candidate, config, projectPath));

            const results = await Promise.all(promises);

            for (let k = 0; k < results.length; k++) {
                const res = results[k];
                const cand = chunk[k];

                if (audit) {
                    const prompt = res.prompt ?? "";
                    audit.record({
                        identifier: String(cand.identifier ?? ""),
                        title: String(cand.title ?? ""),
                        // Erro é decisão registrada como erro, não silêncio.
                        decision: res.error ? `ERRO: ${res.error.slice(0, 120)}` : (res.result?.decision ?? "(vazio)"),
                        score: res.result?.score,
                        reasoning: res.result?.reasoning,
                        prompt,
                        raw_response: res.raw,
                        provenance: {
                            model: this.modelName,
                            model_pinned: isPinned(this.modelName),
                            temperature: this.temperature,
                            timestamp: new Date().toISOString(),
                            prompt_sha256: sha256(prompt)
                        }
                    });
                }

                if (res.error) {
                    console.error(`Error screening ${res.record?.title}: ${res.error}`);
                    errors.push(`${res.record?.title}: ${res.error}`);
                } else if (res.result) {
                    // MAYBE entra em `included` — e isso é DECLARADO, não silencioso (DEBT-028).
                    // A regra de inclusão fica como está: mudá-la decide por fora quem entra no
                    // corpus, e isso é do pesquisador (RV-04). O que o sistema deve é não esconder
                    // a composição: `decision` vai gravado por registro em included_ta.json, a
                    // resposta de screen_candidates diz quantos SIM e quantos MAYBE, e na fase
                    // fulltext um MAYBE restante é apontado como indeciso dentro dos incluídos
                    // FINAIS — onde o funil o contaria como decisão.
                    if (res.result.decision === "YES" || res.result.decision === "MAYBE") {
                        included.push(res.result);
                    } else {
                        excluded.push(res.result);
                    }
                }
            }
        }

        if (audit) {
            const m = audit.close(new Date().toISOString());
            console.error(`[TRIAGEM] trilha em ${audit.path} — ${m.total} decisões, modelo ${m.model}${m.model_pinned ? "" : " (ALIAS, não versão fixada)"}`);
        }

        return { included, excluded, errors };
    }

    private async screenOne(
        candidate: SearchResult,
        config: ScreeningConfig,
        projectPath?: string
    ): Promise<{ result?: ScreeningResult; record?: SearchResult; error?: string; prompt?: string; raw?: string }> {
        let prompt = "";
        try {
            prompt = await this.buildPrompt(candidate, config, projectPath);

            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();

            // Clean JSON
            const jsonStr = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
            const parsed = JSON.parse(jsonStr);

            const screeningResult: ScreeningResult = {
                decision: parsed.decision,
                score: parsed.relevance_score,
                reasoning: parsed.reasoning,
                record: candidate,
            };

            // CoT justification (from Go legacy pattern)
            if (config.cotJustification && parsed.justification) {
                screeningResult.justification = {
                    reasoning_steps: parsed.justification.reasoning_steps || [],
                    supporting_sentences: parsed.justification.supporting_sentences || [],
                };
            }

            // Filters applied (for audit trail)
            if (parsed.filters_applied) {
                screeningResult.filters_applied = parsed.filters_applied;
            }

            return { result: screeningResult, prompt, raw: responseText };

        } catch (error) {
            // O prompt viaja junto mesmo no erro: uma decisão que FALHOU também precisa de
            // rastro, senão o registro conta só os sucessos e a trilha mente por omissão.
            return { record: candidate, error: (error as Error).message, prompt };
        }
    }

    /**
     * Build the screening prompt with multi-filter support and optional CoT.
     * Absorbs patterns from Go Screening() and prompt.PrepareInput().
     */
    private async buildPrompt(candidate: SearchResult, config: ScreeningConfig, projectPath?: string): Promise<string> {
        const filterInstructions: string[] = [];

        // Language filter (from Go filters.language)
        if (config.filters?.language?.enabled) {
            const langs = config.filters.language.accepted.join(", ");
            filterInstructions.push(
                `LANGUAGE FILTER: The paper must be in one of these languages: ${langs}. ` +
                `If the paper is in a different language, set decision to NO and note the detected language in filters_applied.language.`
            );
        }

        // Article type filter (from Go filters.article_type)
        if (config.filters?.articleType?.enabled) {
            const exclusions: string[] = [];
            if (config.filters.articleType.excludeReviews) exclusions.push("systematic reviews / literature reviews");
            if (config.filters.articleType.excludeEditorials) exclusions.push("editorials / opinion pieces");
            if (config.filters.articleType.excludeLetters) exclusions.push("letters to the editor");
            if (config.filters.articleType.excludeTheoreticalOnly) exclusions.push("purely theoretical papers without empirical data");

            if (exclusions.length > 0) {
                filterInstructions.push(
                    `ARTICLE TYPE FILTER: Exclude the following types: ${exclusions.join("; ")}. ` +
                    `Note the detected type in filters_applied.article_type.`
                );
            }
        }

        // Topic relevance filter (from Go filters.topic_relevance)
        if (config.filters?.topicRelevance?.enabled) {
            filterInstructions.push(
                `TOPIC RELEVANCE: Minimum score required: ${config.filters.topicRelevance.minScore}/100. ` +
                `Note the score in filters_applied.topic_score.`
            );
        }

        // CoT justification section (from Go justification_query pattern)
        const cotSection = config.cotJustification
            ? `\n4. Provide chain-of-thought JUSTIFICATION with:
   - "reasoning_steps": array of 2-4 brief reasoning steps leading to your decision
   - "supporting_sentences": array of 1-3 sentences from the abstract that support your decision`
            : "";

        const cotOutputFormat = config.cotJustification
            ? `,
  "justification": {
    "reasoning_steps": ["Step 1", "Step 2"],
    "supporting_sentences": ["Relevant sentence from abstract"]
  }`
            : "";

        const filtersBlock = filterInstructions.length > 0
            ? `\nFILTERS TO APPLY:\n${filterInstructions.map((f, i) => `${i + 1}. ${f}`).join("\n")}\n`
            : "";

        const filtersOutputFormat = filterInstructions.length > 0
            ? `,
  "filters_applied": {
    "language": "detected language code or null",
    "article_type": "detected article type or null",
    "topic_score": 0
  }`
            : "";

        // DEBT-020: só tenta anexar texto completo quando o estágio É fulltext. Em 'ta'
        // (default), NUNCA — mesmo que o arquivo exista — porque a triagem de título/resumo
        // não deve enviesar-se com o texto integral (é a fase seguinte, deliberadamente
        // mais restrita). Locais na mesma prioridade de rag_lexical.ts (RAG do reader):
        // 04_extraction/fulltext primeiro (canônico, escrito por download_and_extract_pdfs),
        // 03_screening/fulltext como fallback. '02_fulltext' NUNCA existiu no sistema.
        let fulltextContent = "";
        if (config.stage === "fulltext" && projectPath && candidate.identifier) {
            const base = path.isAbsolute(projectPath) ? projectPath : path.join(process.cwd(), projectPath);
            const candidatePaths = [
                path.join(base, "04_extraction", "fulltext", `${candidate.identifier}.txt`),
                path.join(base, "03_screening", "fulltext", `${candidate.identifier}.txt`),
            ];
            const textPath = candidatePaths.find((p) => fs.existsSync(p));
            if (textPath) {
                fulltextContent = await this.pdfExtractor.smartChunk(textPath);
            } else {
                // Recusa NÃO-SILENCIOSA: stage='fulltext' promete leitura integral. Sem o
                // arquivo, decidir mesmo assim (por resumo) seria exatamente o defeito do
                // DEBT-020 — inclusão final sem leitura do estudo. screenOne captura este
                // throw e registra como erro do candidato (não decide, não inclui, não exclui).
                throw new Error(
                    `stage='fulltext' mas o texto completo de '${candidate.identifier}' não foi encontrado ` +
                    `(tentado: ${candidatePaths.join(", ")}). Rode download_and_extract_pdfs antes de triar texto completo — ` +
                    `decidir por resumo aqui seria o próprio defeito que esta tool existe para não ter.`
                );
            }
        }

        const fulltextBlock = fulltextContent ? `\n\n--- FULLTEXT EXTRACT (SMART CHUNKS) ---\n${fulltextContent}` : "";

        return `You are an expert systematic reviewer. Evaluate the following academic paper against the provided criteria.

CRITERIA:
${config.criteria}
${filtersBlock}
PAPER METADATA:
Title: ${candidate.title}
Abstract: ${candidate.description || "No abstract available."}
Keywords: ${candidate.subjectAreas?.join(", ") || ""}
Date: ${candidate.date || "Unknown"}
Repository: ${candidate.repositoryName || "Unknown"}
${fulltextBlock}

TASK:
1. Assign a Relevance Score (0-100).
2. Make a Decision: YES (include), NO (exclude), or MAYBE (unsure/missing info).
3. Provide brief Reasoning.${cotSection}

OUTPUT FORMAT (JSON ONLY):
{
  "relevance_score": number,
  "decision": "YES" | "NO" | "MAYBE",
  "reasoning": "string"${cotOutputFormat}${filtersOutputFormat}
}`;
    }
}
