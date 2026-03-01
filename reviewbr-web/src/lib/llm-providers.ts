/**
 * LLM Provider Abstraction Layer
 * 
 * Supports: Gemini, OpenAI, Anthropic
 * Each provider implements the same interface for chat + function calling.
 */

// ─── Types ───────────────────────────────────────────────────

export interface LlmMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface ToolDeclaration {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
}

export interface LlmResponse {
    text: string;
    toolCalls: { name: string; args: Record<string, unknown> }[];
}

export type ProviderId = "gemini" | "openai" | "anthropic";

export interface ProviderConfig {
    provider: ProviderId;
    model: string;
    apiKey: string;
}

// ─── Provider Registry ──────────────────────────────────────

export const PROVIDERS: Record<ProviderId, { label: string; models: { id: string; label: string }[]; keyName: string }> = {
    gemini: {
        label: "Google Gemini",
        models: [
            { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash (Grátis)" },
            { id: "gemini-2.5-pro-preview-06-05", label: "Gemini 2.5 Pro (Preview)" },
            { id: "gemini-2.5-flash-preview-05-20", label: "Gemini 2.5 Flash (Preview)" },
        ],
        keyName: "GOOGLE_API_KEY",
    },
    openai: {
        label: "OpenAI",
        models: [
            { id: "gpt-4o", label: "GPT-4o" },
            { id: "gpt-4o-mini", label: "GPT-4o Mini" },
            { id: "gpt-4.1", label: "GPT-4.1" },
            { id: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
        ],
        keyName: "OPENAI_API_KEY",
    },
    anthropic: {
        label: "Anthropic",
        models: [
            { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
            { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
            { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" },
        ],
        keyName: "ANTHROPIC_API_KEY",
    },
};

// ─── Gemini Provider ─────────────────────────────────────────

async function callGemini(
    config: ProviderConfig,
    systemPrompt: string,
    messages: LlmMessage[],
    tools: ToolDeclaration[]
): Promise<LlmResponse> {
    const contents = messages
        .filter((m) => m.role !== "system")
        .map((msg) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
        }));

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents,
                tools: [{ function_declarations: tools }],
            }),
        }
    );

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini API ${res.status}: ${err}`);
    }

    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const textParts: string[] = [];
    const toolCalls: { name: string; args: Record<string, unknown> }[] = [];

    for (const part of parts) {
        if (part.text) textParts.push(part.text);
        if (part.functionCall) {
            toolCalls.push({ name: part.functionCall.name, args: part.functionCall.args || {} });
        }
    }

    return { text: textParts.join("\n"), toolCalls };
}

// ─── OpenAI Provider ─────────────────────────────────────────

async function callOpenAI(
    config: ProviderConfig,
    systemPrompt: string,
    messages: LlmMessage[],
    tools: ToolDeclaration[]
): Promise<LlmResponse> {
    const openaiMessages = [
        { role: "system", content: systemPrompt },
        ...messages.filter((m) => m.role !== "system").map((m) => ({
            role: m.role,
            content: m.content,
        })),
    ];

    const openaiTools = tools.map((t) => ({
        type: "function" as const,
        function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
        },
    }));

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
            model: config.model,
            messages: openaiMessages,
            tools: openaiTools,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenAI API ${res.status}: ${err}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    const text = choice?.message?.content || "";
    const toolCalls: { name: string; args: Record<string, unknown> }[] = [];

    if (choice?.message?.tool_calls) {
        for (const tc of choice.message.tool_calls) {
            if (tc.type === "function") {
                try {
                    toolCalls.push({
                        name: tc.function.name,
                        args: JSON.parse(tc.function.arguments || "{}"),
                    });
                } catch { /* skip malformed */ }
            }
        }
    }

    return { text, toolCalls };
}

// ─── Anthropic Provider ──────────────────────────────────────

async function callAnthropic(
    config: ProviderConfig,
    systemPrompt: string,
    messages: LlmMessage[],
    tools: ToolDeclaration[]
): Promise<LlmResponse> {
    const anthropicMessages = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
            role: m.role,
            content: m.content,
        }));

    const anthropicTools = tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
    }));

    const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": config.apiKey,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model: config.model,
            max_tokens: 4096,
            system: systemPrompt,
            messages: anthropicMessages,
            tools: anthropicTools,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Anthropic API ${res.status}: ${err}`);
    }

    const data = await res.json();
    const textParts: string[] = [];
    const toolCalls: { name: string; args: Record<string, unknown> }[] = [];

    for (const block of data.content || []) {
        if (block.type === "text") textParts.push(block.text);
        if (block.type === "tool_use") {
            toolCalls.push({ name: block.name, args: block.input || {} });
        }
    }

    return { text: textParts.join("\n"), toolCalls };
}

// ─── Unified Dispatcher ──────────────────────────────────────

export async function callLlm(
    config: ProviderConfig,
    systemPrompt: string,
    messages: LlmMessage[],
    tools: ToolDeclaration[]
): Promise<LlmResponse> {
    switch (config.provider) {
        case "gemini":
            return callGemini(config, systemPrompt, messages, tools);
        case "openai":
            return callOpenAI(config, systemPrompt, messages, tools);
        case "anthropic":
            return callAnthropic(config, systemPrompt, messages, tools);
        default:
            throw new Error(`Provider "${config.provider}" não suportado.`);
    }
}
