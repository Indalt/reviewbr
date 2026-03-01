"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface Message {
    role: "user" | "assistant" | "system";
    content: string;
}

function ChatContent() {
    const searchParams = useSearchParams();
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "system",
            content: "ReviewBR IA conectada. Todas as operações passam exclusivamente pelas ferramentas auditadas do sistema.",
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [activeTools, setActiveTools] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-fill from URL params (quick action cards)
    useEffect(() => {
        const prompt = searchParams.get("prompt");
        const tool = searchParams.get("tool");
        if (prompt) {
            setInput(prompt);
            inputRef.current?.focus();
        } else if (tool) {
            const toolDescriptions: Record<string, string> = {
                search_openalex: "Busque artigos no OpenAlex sobre ",
                search_pubmed: "Busque artigos no PubMed sobre ",
                search_scielo: "Busque artigos no SciELO sobre ",
                deduplicate_dataset: "Remova duplicatas do dataset do projeto",
                screen_candidates: "Faça a triagem dos artigos usando IA",
                audit_methodology: "Quero auditar a metodologia da minha pesquisa já feita",
                export_dataset: "Exporte o dataset do projeto em formato CSV",
            };
            setInput(toolDescriptions[tool] || "");
            inputRef.current?.focus();
        }
    }, [searchParams]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, activeTools]);

    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const userMsg: Message = { role: "user", content: trimmed };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMsg].filter((m) => m.role !== "system"),
                }),
            });

            if (!res.ok) {
                let errorMsg = "Erro desconhecido";
                try {
                    const errData = await res.json();
                    errorMsg = errData.error || JSON.stringify(errData);
                } catch {
                    errorMsg = await res.text().catch(() => `Status ${res.status}`);
                }
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        content: res.status === 401
                            ? "⚠️ Chave de API não configurada. Vá em **Configuração** (⚙️) na sidebar para adicionar sua GOOGLE_API_KEY."
                            : `⚠️ Erro: ${errorMsg}`,
                    },
                ]);
                return;
            }

            const data = await res.json();

            // Show tool calls if any
            if (data.toolCalls && data.toolCalls.length > 0) {
                for (const tc of data.toolCalls) {
                    setActiveTools((prev) => [...prev, tc.name]);
                    setMessages((prev) => [
                        ...prev,
                        {
                            role: "system",
                            content: `🔧 Executando: ${tc.name}`,
                        },
                    ]);
                    // Simulate completion after a beat
                    await new Promise((r) => setTimeout(r, 500));
                    setActiveTools((prev) => prev.filter((t) => t !== tc.name));
                }
            }

            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: data.response },
            ]);
        } catch (e) {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "⚠️ Erro de conexão. Verifique se o servidor está rodando.",
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="chat-container">
            <header className="main-header">
                <h1>💬 Chat IA</h1>
                <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                    Gemini + ReviewBR Tools (sandbox hermético)
                </span>
            </header>

            <div className="chat-messages">
                {messages.map((msg, i) => (
                    <div key={i} className={`chat-message ${msg.role}`}>
                        {msg.content}
                    </div>
                ))}

                {isLoading && activeTools.length === 0 && (
                    <div className="tool-activity">
                        <div className="tool-activity-spinner" />
                        Processando...
                    </div>
                )}

                {activeTools.map((tool) => (
                    <div key={tool} className="tool-activity">
                        <div className="tool-activity-spinner" />
                        Executando {tool}...
                    </div>
                ))}

                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
                <textarea
                    ref={inputRef}
                    className="chat-input"
                    placeholder="Digite sua solicitação de pesquisa..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                />
                <button
                    className="chat-send-btn"
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                >
                    ▶
                </button>
            </div>
        </div>
    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={
            <div className="chat-container">
                <header className="main-header">
                    <h1>💬 Chat IA</h1>
                </header>
                <div className="chat-messages">
                    <div className="tool-activity">
                        <div className="tool-activity-spinner" />
                        Carregando...
                    </div>
                </div>
            </div>
        }>
            <ChatContent />
        </Suspense>
    );
}
