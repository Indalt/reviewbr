/**
 * Centralized configuration module.
 * All environment variables are validated HERE and exposed as typed constants.
 * No other module should read process.env directly.
 * 
 * Fails fast at import time if critical variables are missing.
 */

import { z } from "zod";
import dotenv from "dotenv";

// Load .env file (safe to call multiple times)
dotenv.config();

// ─── Schema ──────────────────────────────────────────────────
const envSchema = z.object({
    // LLM API keys (at least one required)
    GOOGLE_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),

    // Zotero (optional)
    ZOTERO_USER: z.string().optional(),
    ZOTERO_API_KEY: z.string().optional(),

    // OpenAlex (optional but recommended)
    OPENALEX_API_KEY: z.string().optional(),

    // CORE API (optional)
    CORE_API_KEY: z.string().optional(),
});

// ─── Parse & Validate ────────────────────────────────────────
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("❌ CONFIGURAÇÃO INVÁLIDA:");
    for (const issue of parsed.error.issues) {
        console.error(`   → ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
}

const env = parsed.data;

// Validate that at least one LLM key is available
const hasLlmKey = !!(env.GOOGLE_API_KEY || env.OPENAI_API_KEY || env.ANTHROPIC_API_KEY);
if (!hasLlmKey) {
    console.error(
        "⚠️  AVISO: Nenhuma chave de API de LLM encontrada (GOOGLE_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY).\n" +
        "   Ferramentas que dependem de LLM não estarão disponíveis."
    );
}

// ─── Typed Exports ───────────────────────────────────────────
export const config = {
    /** Primary LLM key (first available) */
    llmApiKey: env.GOOGLE_API_KEY ?? env.OPENAI_API_KEY ?? env.ANTHROPIC_API_KEY ?? "",

    /** Individual provider keys */
    googleApiKey: env.GOOGLE_API_KEY ?? "",
    openaiApiKey: env.OPENAI_API_KEY ?? "",
    anthropicApiKey: env.ANTHROPIC_API_KEY ?? "",

    /** Zotero */
    zoteroUser: env.ZOTERO_USER ?? "",
    zoteroApiKey: env.ZOTERO_API_KEY ?? "",

    /** Academic APIs */
    openalexApiKey: env.OPENALEX_API_KEY ?? "",
    coreApiKey: env.CORE_API_KEY ?? "",

    /** Computed flags */
    hasLlmKey,
    hasZotero: !!(env.ZOTERO_USER && env.ZOTERO_API_KEY),
} as const;

export type AppConfig = typeof config;
