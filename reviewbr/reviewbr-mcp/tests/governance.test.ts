import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { AgentOrchestrator, AgentRole } from "../src/registry/agent_orchestrator.js";

const here = path.dirname(fileURLToPath(import.meta.url));
// tests/ -> reviewbr-mcp -> reviewbr -> <repo root c:\reviewbr> -> .claude/agents
const AGENTS_DIR = path.resolve(here, "../../../.claude/agents");

// Mapa arquivo-de-agente → papel (fonte-da-verdade dos frontmatters espelha a tabela canônica).
const AGENT_ROLE: Record<string, AgentRole> = {
    "designer.md": AgentRole.PROJETISTA,
    "librarian.md": AgentRole.LIBRARIAN,
    "screener.md": AgentRole.SCREENER,
    "extractor.md": AgentRole.EXTRACTOR,
    "reader.md": AgentRole.READER,
    "analyst.md": AgentRole.ANALYST,
    "scout.md": AgentRole.SCOUT,
    "maintainer.md": AgentRole.MAINTAINER,
};

/** Extrai os nomes de tool reviewbr (sem o prefixo) da linha `tools:` do frontmatter. */
function frontmatterReviewbrTools(file: string): string[] {
    const text = fs.readFileSync(file, "utf-8");
    const line = text.split(/\r?\n/).find((l) => l.startsWith("tools:"));
    if (!line) return [];
    return line
        .slice("tools:".length)
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.startsWith("mcp__reviewbr__"))
        .map((t) => t.replace(/^mcp__reviewbr__/, ""));
}

describe("guardião — validateToolAccess (recusa por papel)", () => {
    it("permite tool autorizada para o papel", () => {
        expect(() => AgentOrchestrator.validateToolAccess(AgentRole.LIBRARIAN, "search_pubmed")).not.toThrow();
        expect(() => AgentOrchestrator.validateToolAccess(AgentRole.SCOUT, "search_openalex")).not.toThrow();
    });

    it("RECUSA tool fora do papel (ex.: scout tentando baixar PDF)", () => {
        expect(() => AgentOrchestrator.validateToolAccess(AgentRole.SCOUT, "download_and_extract_pdfs"))
            .toThrow(/ACCESS DENIED/);
        // screener não pode buscar; librarian não pode extrair dados
        expect(() => AgentOrchestrator.validateToolAccess(AgentRole.SCREENER, "search_pubmed"))
            .toThrow(/ACCESS DENIED/);
        expect(() => AgentOrchestrator.validateToolAccess(AgentRole.LIBRARIAN, "batch_llm_extract"))
            .toThrow(/ACCESS DENIED/);
    });

    it("RECUSA tool sem mapeamento (violação de governança)", () => {
        expect(() => AgentOrchestrator.validateToolAccess(AgentRole.LIBRARIAN, "tool_inexistente"))
            .toThrow(/GOVERNANCE ERROR/);
    });
});

describe("guardião — assertGovernanceCompleteness (guarda de completude bidirecional)", () => {
    it("passa quando o conjunto registrado == mapa canônico", () => {
        const governed = AgentOrchestrator.getGovernedTools();
        expect(() => AgentOrchestrator.assertGovernanceCompleteness(governed)).not.toThrow();
    });

    it("falha quando uma tool registrada não tem mapeamento", () => {
        const governed = AgentOrchestrator.getGovernedTools();
        expect(() => AgentOrchestrator.assertGovernanceCompleteness([...governed, "tool_nova_sem_dono"]))
            .toThrow(/sem mapeamento de papel/);
    });

    it("falha quando há mapeamento morto (tool que não foi registrada)", () => {
        const governed = AgentOrchestrator.getGovernedTools();
        // remove uma tool do conjunto registrado → o mapeamento correspondente fica órfão
        const missingOne = governed.filter((t) => t !== "expand_search_snowball");
        expect(() => AgentOrchestrator.assertGovernanceCompleteness(missingOne))
            .toThrow(/tool\(s\) inexistente/);
    });
});

describe("consistência — frontmatter dos 8 agentes == tabela canônica", () => {
    for (const [file, role] of Object.entries(AGENT_ROLE)) {
        it(`${file}: tools reviewbr do frontmatter == getAuthorizedTools(${role})`, () => {
            const mirror = new Set(frontmatterReviewbrTools(path.join(AGENTS_DIR, file)));
            const canonical = new Set(AgentOrchestrator.getAuthorizedTools(role));
            expect([...mirror].sort()).toEqual([...canonical].sort());
        });
    }
});
