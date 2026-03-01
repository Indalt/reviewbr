import { NextRequest, NextResponse } from "next/server";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

function getEnvPath(): string {
    return path.join(os.homedir(), ".reviewbr", ".env");
}

function loadUserEnv(): Record<string, string> {
    const envPath = getEnvPath();
    const env: Record<string, string> = {};

    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        for (const line of content.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;
            const eqIdx = trimmed.indexOf("=");
            if (eqIdx === -1) continue;
            const key = trimmed.substring(0, eqIdx).trim();
            const val = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
            env[key] = val;
        }
    }

    return env;
}

/** GET: Check which keys exist and current provider settings */
export async function GET() {
    const env = loadUserEnv();
    return NextResponse.json({
        hasGoogleKey: !!env.GOOGLE_API_KEY,
        hasOpenaiKey: !!env.OPENAI_API_KEY,
        hasAnthropicKey: !!env.ANTHROPIC_API_KEY,
        hasZoteroId: !!env.ZOTERO_USER_ID,
        hasZoteroKey: !!env.ZOTERO_API_KEY,
        provider: env.LLM_PROVIDER || "gemini",
        model: env.LLM_MODEL || "gemini-2.0-flash",
    });
}

/** POST: Save config to ~/.reviewbr/.env */
export async function POST(req: NextRequest) {
    const body = await req.json();
    const existing = loadUserEnv();

    // Update keys if provided (non-masked values)
    if (body.googleKey) existing.GOOGLE_API_KEY = body.googleKey;
    if (body.openaiKey) existing.OPENAI_API_KEY = body.openaiKey;
    if (body.anthropicKey) existing.ANTHROPIC_API_KEY = body.anthropicKey;
    if (body.zoteroId) existing.ZOTERO_USER_ID = body.zoteroId;
    if (body.zoteroKey) existing.ZOTERO_API_KEY = body.zoteroKey;

    // Always update provider/model selection
    if (body.provider) existing.LLM_PROVIDER = body.provider;
    if (body.model) existing.LLM_MODEL = body.model;

    const envDir = path.dirname(getEnvPath());
    if (!fs.existsSync(envDir)) fs.mkdirSync(envDir, { recursive: true });

    const content = Object.entries(existing)
        .map(([k, v]) => `${k}="${v}"`)
        .join("\n");

    fs.writeFileSync(getEnvPath(), content, "utf-8");

    return NextResponse.json({ success: true });
}
