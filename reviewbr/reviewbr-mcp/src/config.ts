/**
 * Centralized configuration module.
 * All environment variables are validated HERE and exposed as typed constants.
 * No other module should read process.env directly.
 * 
 * Fails fast at import time if critical variables are missing.
 */

import { z } from "zod";
import dotenv from "dotenv";
import * as os from "node:os";
import * as fsNode from "node:fs";
import * as pathNode from "node:path";
import { fileURLToPath } from "node:url";

// Carregamento robusto de .env: procura em múltiplos locais canônicos, pois o
// diretório de execução do servidor MCP varia conforme o cliente. dotenv.config()
// NÃO sobrescreve variáveis já definidas, então a ordem = prioridade.
// Ordem: pasta do MCP (onde ficam as chaves de dev) → ~/.reviewbr/.env (canônico do
// README) → raiz do repo → cwd.
const mcpRoot = pathNode.resolve(pathNode.dirname(fileURLToPath(import.meta.url)), "..");
const envCandidates = [
    pathNode.join(mcpRoot, ".env"),                       // reviewbr-mcp/.env
    pathNode.join(os.homedir(), ".reviewbr", ".env"),     // ~/.reviewbr/.env (canônico)
    pathNode.join(mcpRoot, "..", ".env"),                 // reviewbr/.env
    pathNode.join(process.cwd(), ".env"),                 // cwd
];
for (const p of envCandidates) {
    if (fsNode.existsSync(p)) dotenv.config({ path: p });
}

// ─── Schema ──────────────────────────────────────────────────
const envSchema = z.object({
    // LLM API keys (at least one required)
    GOOGLE_API_KEY: z.string().optional(),
    GEMINI_API_KEY: z.string().optional(), // alias comum (nome do modelo, não da empresa) — mesmo efeito de GOOGLE_API_KEY
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

// GEMINI_API_KEY é aceita como alias de GOOGLE_API_KEY (mesmo provedor, nome mais intuitivo)
const googleKey = env.GOOGLE_API_KEY ?? env.GEMINI_API_KEY;

// Validate that at least one LLM key is available
const hasLlmKey = !!(googleKey || env.OPENAI_API_KEY || env.ANTHROPIC_API_KEY);
if (!hasLlmKey) {
    console.error(
        "⚠️  AVISO: Nenhuma chave de API de LLM encontrada (GOOGLE_API_KEY/GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY).\n" +
        "   Ferramentas que dependem de LLM não estarão disponíveis."
    );
}

// ─── Typed Exports ───────────────────────────────────────────
export const config = {
    /** Primary LLM key (first available) */
    llmApiKey: googleKey ?? env.OPENAI_API_KEY ?? env.ANTHROPIC_API_KEY ?? "",

    /** Individual provider keys */
    googleApiKey: googleKey ?? "",
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
