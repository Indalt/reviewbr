/**
 * LLM Provider Abstraction Layer
 * 
 * Absorbs the multi-provider pattern from Go legacy (config/configuration.go).
 * Supports Google (Gemini), OpenAI-compatible, and Anthropic APIs via REST.
 * No additional SDKs required — uses native fetch for OpenAI/Anthropic.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── Interfaces ──────────────────────────────────────────────

export interface LLMProviderConfig {
    provider: "google" | "openai" | "anthropic";
    apiKey: string;
    model?: string;
    temperature?: number;
    baseUrl?: string;       // For self-hosted OpenAI-compatible endpoints
}

export interface LLMProvider {
    generateContent(prompt: string): Promise<string>;
    readonly providerName: string;
    readonly modelName: string;
}

// ─── Google (Gemini) Provider ────────────────────────────────

class GoogleProvider implements LLMProvider {
    private model: any;
    readonly providerName = "google";
    readonly modelName: string;

    constructor(apiKey: string, model: string = "gemini-2.0-flash", temperature: number = 0) {
        const genAI = new GoogleGenerativeAI(apiKey);
        this.model = genAI.getGenerativeModel({
            model,
            generationConfig: { temperature },
        });
        this.modelName = model;
    }

    async generateContent(prompt: string): Promise<string> {
        const result = await this.model.generateContent(prompt);
        return result.response.text();
    }
}

// ─── OpenAI-Compatible Provider ──────────────────────────────

class OpenAIProvider implements LLMProvider {
    private apiKey: string;
    private baseUrl: string;
    readonly providerName = "openai";
    readonly modelName: string;
    private temperature: number;

    constructor(apiKey: string, model: string = "gpt-4o-mini", temperature: number = 0, baseUrl?: string) {
        this.apiKey = apiKey;
        this.modelName = model;
        this.temperature = temperature;
        this.baseUrl = baseUrl || "https://api.openai.com/v1";
    }

    async generateContent(prompt: string): Promise<string> {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.modelName,
                messages: [{ role: "user", content: prompt }],
                temperature: this.temperature,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API error (${response.status}): ${error}`);
        }

        const data = await response.json() as any;
        return data.choices?.[0]?.message?.content ?? "";
    }
}

// ─── Anthropic Provider ──────────────────────────────────────

class AnthropicProvider implements LLMProvider {
    private apiKey: string;
    readonly providerName = "anthropic";
    readonly modelName: string;
    private temperature: number;

    constructor(apiKey: string, model: string = "claude-sonnet-4-20250514", temperature: number = 0) {
        this.apiKey = apiKey;
        this.modelName = model;
        this.temperature = temperature;
    }

    async generateContent(prompt: string): Promise<string> {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": this.apiKey,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
                model: this.modelName,
                max_tokens: 4096,
                temperature: this.temperature,
                messages: [{ role: "user", content: prompt }],
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Anthropic API error (${response.status}): ${error}`);
        }

        const data = await response.json() as any;
        return data.content?.[0]?.text ?? "";
    }
}

// ─── Factory ─────────────────────────────────────────────────

/**
 * Create an LLM provider from configuration.
 * Absorbs the multi-provider pattern from Go legacy.
 */
export function createProvider(config: LLMProviderConfig): LLMProvider {
    switch (config.provider) {
        case "google":
            return new GoogleProvider(
                config.apiKey,
                config.model || "gemini-2.0-flash",
                config.temperature ?? 0
            );
        case "openai":
            return new OpenAIProvider(
                config.apiKey,
                config.model || "gpt-4o-mini",
                config.temperature ?? 0,
                config.baseUrl
            );
        case "anthropic":
            return new AnthropicProvider(
                config.apiKey,
                config.model || "claude-sonnet-4-20250514",
                config.temperature ?? 0
            );
        default:
            throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
}

/**
 * Create a provider from environment variables.
 * Checks GOOGLE_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY in order.
 */
export function createDefaultProvider(): LLMProvider | null {
    if (process.env.GOOGLE_API_KEY) {
        return createProvider({ provider: "google", apiKey: process.env.GOOGLE_API_KEY });
    }
    if (process.env.OPENAI_API_KEY) {
        return createProvider({ provider: "openai", apiKey: process.env.OPENAI_API_KEY });
    }
    if (process.env.ANTHROPIC_API_KEY) {
        return createProvider({ provider: "anthropic", apiKey: process.env.ANTHROPIC_API_KEY });
    }
    return null;
}
