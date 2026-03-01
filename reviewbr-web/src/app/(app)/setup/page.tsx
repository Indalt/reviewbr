"use client";

import { useState, useEffect } from "react";

interface ProviderInfo {
    label: string;
    models: { id: string; label: string }[];
    keyName: string;
}

const PROVIDERS: Record<string, ProviderInfo> = {
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

export default function SetupPage() {
    const [provider, setProvider] = useState("gemini");
    const [model, setModel] = useState("gemini-2.0-flash");

    const [googleKey, setGoogleKey] = useState("");
    const [openaiKey, setOpenaiKey] = useState("");
    const [anthropicKey, setAnthropicKey] = useState("");
    const [zoteroId, setZoteroId] = useState("");
    const [zoteroKey, setZoteroKey] = useState("");

    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/config")
            .then((res) => res.json())
            .then((data) => {
                if (data.hasGoogleKey) setGoogleKey("••••••••••••••••");
                if (data.hasOpenaiKey) setOpenaiKey("••••••••••••••••");
                if (data.hasAnthropicKey) setAnthropicKey("••••••••••••••••");
                if (data.hasZoteroId) setZoteroId("••••••");
                if (data.hasZoteroKey) setZoteroKey("••••••••");
                if (data.provider) setProvider(data.provider);
                if (data.model) setModel(data.model);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    // When provider changes, auto-select the first model of that provider
    const handleProviderChange = (newProvider: string) => {
        setProvider(newProvider);
        const firstModel = PROVIDERS[newProvider]?.models[0]?.id || "";
        setModel(firstModel);
    };

    const handleSave = async () => {
        const res = await fetch("/api/config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                provider,
                model,
                googleKey: googleKey.includes("•") ? undefined : googleKey || undefined,
                openaiKey: openaiKey.includes("•") ? undefined : openaiKey || undefined,
                anthropicKey: anthropicKey.includes("•") ? undefined : anthropicKey || undefined,
                zoteroId: zoteroId.includes("•") ? undefined : zoteroId || undefined,
                zoteroKey: zoteroKey.includes("•") ? undefined : zoteroKey || undefined,
            }),
        });

        if (res.ok) {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
    };

    const clearField = (setter: (v: string) => void, value: string) => {
        if (value.includes("•")) setter("");
    };

    if (loading) return null;

    const currentProvider = PROVIDERS[provider];
    // Which key field to highlight as "active"
    const activeKeyName = currentProvider?.keyName;

    return (
        <>
            <header className="main-header">
                <h1>⚙️ Configuração</h1>
            </header>

            <div className="main-body">
                <div style={{ maxWidth: 560 }}>
                    {/* Provider + Model Selection */}
                    <section className="welcome-section">
                        <h2 className="welcome-title">Modelo de IA</h2>
                        <p className="welcome-subtitle">
                            Escolha o provedor e modelo para o chat e a triagem.
                        </p>
                    </section>

                    <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Provedor</label>
                            <select
                                className="form-input"
                                value={provider}
                                onChange={(e) => handleProviderChange(e.target.value)}
                                style={{ fontFamily: "var(--font-sans)", cursor: "pointer" }}
                            >
                                {Object.entries(PROVIDERS).map(([id, info]) => (
                                    <option key={id} value={id}>{info.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Modelo</label>
                            <select
                                className="form-input"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                style={{ fontFamily: "var(--font-sans)", cursor: "pointer" }}
                            >
                                {currentProvider?.models.map((m) => (
                                    <option key={m.id} value={m.id}>{m.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* API Keys */}
                    <section style={{ marginBottom: 24 }}>
                        <h2 className="welcome-title" style={{ fontSize: 18 }}>Chaves de API</h2>
                        <p className="welcome-subtitle">
                            As chaves ficam salvas apenas no seu computador em{" "}
                            <code style={{ color: "var(--accent)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                                ~/.reviewbr/.env
                            </code>
                        </p>
                    </section>

                    <div className="form-group">
                        <label className="form-label" style={{ color: activeKeyName === "GOOGLE_API_KEY" ? "var(--accent)" : undefined }}>
                            {activeKeyName === "GOOGLE_API_KEY" ? "● " : ""}Google API Key{provider === "gemini" ? " (ativa)" : ""}
                        </label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="AIzaSyA..."
                            value={googleKey}
                            onChange={(e) => setGoogleKey(e.target.value)}
                            onFocus={() => clearField(setGoogleKey, googleKey)}
                            style={activeKeyName === "GOOGLE_API_KEY" ? { borderColor: "var(--accent)" } : undefined}
                        />
                        <div className="form-hint">
                            Obtenha em{" "}
                            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Google AI Studio</a>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" style={{ color: activeKeyName === "OPENAI_API_KEY" ? "var(--accent)" : undefined }}>
                            {activeKeyName === "OPENAI_API_KEY" ? "● " : ""}OpenAI API Key{provider === "openai" ? " (ativa)" : ""}
                        </label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="sk-..."
                            value={openaiKey}
                            onChange={(e) => setOpenaiKey(e.target.value)}
                            onFocus={() => clearField(setOpenaiKey, openaiKey)}
                            style={activeKeyName === "OPENAI_API_KEY" ? { borderColor: "var(--accent)" } : undefined}
                        />
                        <div className="form-hint">
                            Obtenha em{" "}
                            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">OpenAI Platform</a>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" style={{ color: activeKeyName === "ANTHROPIC_API_KEY" ? "var(--accent)" : undefined }}>
                            {activeKeyName === "ANTHROPIC_API_KEY" ? "● " : ""}Anthropic API Key{provider === "anthropic" ? " (ativa)" : ""}
                        </label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="sk-ant-..."
                            value={anthropicKey}
                            onChange={(e) => setAnthropicKey(e.target.value)}
                            onFocus={() => clearField(setAnthropicKey, anthropicKey)}
                            style={activeKeyName === "ANTHROPIC_API_KEY" ? { borderColor: "var(--accent)" } : undefined}
                        />
                        <div className="form-hint">
                            Obtenha em{" "}
                            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">Anthropic Console</a>
                        </div>
                    </div>

                    <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "24px 0" }} />

                    <div className="form-group">
                        <label className="form-label">Zotero User ID (opcional)</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="123456"
                            value={zoteroId}
                            onChange={(e) => setZoteroId(e.target.value)}
                            onFocus={() => clearField(setZoteroId, zoteroId)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Zotero API Key (opcional)</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="abcd..."
                            value={zoteroKey}
                            onChange={(e) => setZoteroKey(e.target.value)}
                            onFocus={() => clearField(setZoteroKey, zoteroKey)}
                        />
                    </div>

                    <button className="btn-primary" onClick={handleSave}>
                        {saved ? "✅ Salvo!" : "Salvar Configuração"}
                    </button>
                </div>
            </div>
        </>
    );
}
