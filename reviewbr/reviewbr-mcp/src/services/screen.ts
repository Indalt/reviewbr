
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SearchResult } from "../types.js";

export interface ScreeningResult {
    decision: "YES" | "NO" | "MAYBE";
    score: number;
    reasoning: string;
    record: SearchResult;
}

export class ScreeningService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    }

    async screenCandidates(
        candidates: SearchResult[],
        criteria: string
    ): Promise<{ included: ScreeningResult[]; excluded: ScreeningResult[]; errors: string[] }> {
        const included: ScreeningResult[] = [];
        const excluded: ScreeningResult[] = [];
        const errors: string[] = [];

        // Process in parallel with concurrency limit
        const concurrency = 5;
        for (let i = 0; i < candidates.length; i += concurrency) {
            const chunk = candidates.slice(i, i + concurrency);
            const promises = chunk.map(candidate => this.screenOne(candidate, criteria));

            const results = await Promise.all(promises);

            for (const res of results) {
                if (res.error) {
                    console.error(`Error screening ${res.record?.title}: ${res.error}`);
                    // Keep unknown as excluded or maybe? Let's just log error
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

    private async screenOne(candidate: SearchResult, criteria: string): Promise<{ result?: ScreeningResult; record?: SearchResult; error?: string }> {
        try {
            const prompt = `
You are an expert systematic reviewer. Evaluate the following academic paper against the provided criteria.

CRITERIA:
${criteria}

PAPER:
Title: ${candidate.title}
Abstract: ${candidate.description || "No abstract available."}
Keywords: ${candidate.subjectAreas?.join(", ") || ""}

TASK:
1. Assign a Relevance Score (0-100).
2. Make a Decision: YES (include), NO (exclude), or MAYBE (unsure/missing info).
3. Provide brief Reasoning.

OUTPUT FORMAT (JSON ONLY):
{
  "relevance_score": number,
  "decision": "YES" | "NO" | "MAYBE",
  "reasoning": "string"
}
`;

            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();

            // Clean JSON
            const jsonStr = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
            const parsed = JSON.parse(jsonStr);

            return {
                result: {
                    decision: parsed.decision,
                    score: parsed.relevance_score,
                    reasoning: parsed.reasoning,
                    record: candidate
                }
            };

        } catch (error) {
            return { record: candidate, error: (error as Error).message };
        }
    }
}
