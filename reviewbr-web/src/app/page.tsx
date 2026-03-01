"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    if (!name.trim()) {
      setError("Digite seu nome.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Save user name to localStorage
      localStorage.setItem("reviewbr_user", name.trim());

      // If API key provided, save it
      if (apiKey.trim()) {
        await fetch("/api/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ googleKey: apiKey.trim() }),
        });
      }

      router.push("/dashboard");
    } catch {
      setError("Erro ao salvar configuração.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">Review<span>BR</span></div>
        <p className="login-subtitle">
          Revisões sistemáticas com excelência metodológica
        </p>

        <div className="form-group">
          <label className="form-label">Seu nome</label>
          <input
            type="text"
            className="form-input"
            placeholder="Ex: Vicente"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>

        <div className="login-divider">opcional</div>

        <div className="form-group">
          <label className="form-label">API Key (pode configurar depois)</label>
          <input
            type="password"
            className="form-input"
            placeholder="AIzaSyA... ou sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="form-hint">
            Aceita Google, OpenAI ou Anthropic. Configure em Configuração.
          </div>
        </div>

        {error && (
          <p style={{ color: "var(--error)", fontSize: 13, marginBottom: 8 }}>
            {error}
          </p>
        )}

        <button
          className="btn-primary"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </div>
  );
}
