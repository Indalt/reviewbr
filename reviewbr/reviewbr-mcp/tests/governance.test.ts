import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { AgentOrchestrator, AgentRole } from "../src/registry/agent_orchestrator.js";

const here = path.dirname(fileURLToPath(import.meta.url));
// tests/ -> reviewbr-mcp -> reviewbr -> <repo root c:\reviewbr> -> .claude/agents
const AGENTS_DIR = path.resolve(here, "../../../.claude/agents");

// Mapa arquivo-de-agente → papel. Linha 25 da FILA (28/11/2026): os seis agentes de etapa se fundiram no
// coordenador (skill conduct-review, sessão principal, sem lista `tools:`); ficam o scout e o maintainer.
const AGENT_ROLE: Record<string, AgentRole> = {
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
        // Só as tools do MCP: as nativas do frontmatter não são conferidas aqui, e as proibições
        // delas nos agentes são conduta declarada como tal (DEBT-060).
        .filter((t) => t.startsWith("mcp__reviewbr__"))
        .map((t) => t.replace(/^mcp__reviewbr__/, ""));
}

describe("guardião — validateToolAccess (recusa por papel)", () => {
    it("permite tool autorizada para o papel", () => {
        expect(() => AgentOrchestrator.validateToolAccess(AgentRole.COORDINATOR, "search_pubmed")).not.toThrow();
        expect(() => AgentOrchestrator.validateToolAccess(AgentRole.SCOUT, "search_openalex")).not.toThrow();
    });

    it("RECUSA tool fora do papel (ex.: scout tentando baixar PDF; coordenador mudando o sistema)", () => {
        expect(() => AgentOrchestrator.validateToolAccess(AgentRole.SCOUT, "download_and_extract_pdfs"))
            .toThrow(/ACCESS DENIED/);
        expect(() => AgentOrchestrator.validateToolAccess(AgentRole.COORDINATOR, "validate_system_change"))
            .toThrow(/ACCESS DENIED/);
        expect(() => AgentOrchestrator.validateToolAccess(AgentRole.MAINTAINER, "search_pubmed"))
            .toThrow(/ACCESS DENIED/);
    });

    it("RECUSA tool sem mapeamento (violação de governança)", () => {
        expect(() => AgentOrchestrator.validateToolAccess(AgentRole.COORDINATOR, "tool_inexistente"))
            .toThrow(/GOVERNANCE ERROR/);
    });

    it("linha 25: o coordenador tem toda tool de projeto, e nenhuma de escrita da manutenção", () => {
        const so = ["validate_system_change", "audit_system_debt", "record_system_finding", "absorb_methodology", "scaffold_methodology", "validate_methodology"];
        const coord = new Set(AgentOrchestrator.getAuthorizedTools(AgentRole.COORDINATOR));
        for (const t of AgentOrchestrator.getGovernedTools()) expect(coord.has(t), t).toBe(!so.includes(t));
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

describe("consistência — frontmatter dos agentes (scout e maintainer) == tabela canônica", () => {
    for (const [file, role] of Object.entries(AGENT_ROLE)) {
        it(`${file}: tools reviewbr do frontmatter == getAuthorizedTools(${role})`, () => {
            const mirror = new Set(frontmatterReviewbrTools(path.join(AGENTS_DIR, file)));
            const canonical = new Set(AgentOrchestrator.getAuthorizedTools(role));
            expect([...mirror].sort()).toEqual([...canonical].sort());
        });
    }
});
