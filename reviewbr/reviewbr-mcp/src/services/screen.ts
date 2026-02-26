
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SearchResult } from "../types.js";

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
}

// ─── Service ─────────────────────────────────────────────────

export class ScreeningService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    }

    /**
     * Screen candidates with multi-filter support and optional CoT justification.
     * Backward-compatible: if config is a string, uses it as criteria (legacy mode).
     */
    async screenCandidates(
        candidates: SearchResult[],
        configOrCriteria: ScreeningConfig | string
    ): Promise<{ included: ScreeningResult[]; excluded: ScreeningResult[]; errors: string[] }> {
        // Backward-compatible: accept string as criteria
        const config: ScreeningConfig = typeof configOrCriteria === "string"
            ? { criteria: configOrCriteria }
            : configOrCriteria;

        const included: ScreeningResult[] = [];
        const excluded: ScreeningResult[] = [];
        const errors: string[] = [];

        // Process in parallel with concurrency limit
        const concurrency = 5;
        for (let i = 0; i < candidates.length; i += concurrency) {
            const chunk = candidates.slice(i, i + concurrency);
            const promises = chunk.map(candidate => this.screenOne(candidate, config));

            const results = await Promise.all(promises);

            for (const res of results) {
                if (res.error) {
                    console.error(`Error screening ${res.record?.title}: ${res.error}`);
                    errors.push(`${res.record?.title}: ${res.error}`);
                } else if (res.result) {
                    if (res.result.decision === "YES" || res.result.decision === "MAYBE") {
                        included.push(res.result);
                    } else {
                        excluded.push(res.result);
                    }
                }
            }
        }

        return { included, excluded, errors };
    }

    private async screenOne(
        candidate: SearchResult,
        config: ScreeningConfig
    ): Promise<{ result?: ScreeningResult; record?: SearchResult; error?: string }> {
        try {
            const prompt = this.buildPrompt(candidate, config);

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

            return { result: screeningResult };

        } catch (error) {
            return { record: candidate, error: (error as Error).message };
        }
    }

    /**
     * Build the screening prompt with multi-filter support and optional CoT.
     * Absorbs patterns from Go Screening() and prompt.PrepareInput().
     */
    private buildPrompt(candidate: SearchResult, config: ScreeningConfig): string {
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

        return `You are an expert systematic reviewer. Evaluate the following academic paper against the provided criteria.

CRITERIA:
${config.criteria}
${filtersBlock}
PAPER:
Title: ${candidate.title}
Abstract: ${candidate.description || "No abstract available."}
Keywords: ${candidate.subjectAreas?.join(", ") || ""}
Date: ${candidate.date || "Unknown"}
Repository: ${candidate.repositoryName || "Unknown"}

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
