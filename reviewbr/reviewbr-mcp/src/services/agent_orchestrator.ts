/**
 * Agent Orchestrator — RBAC for MCP Tools.
 * 
 * Implements Role-Based Access Control for the ReviewBR MCP server.
 * Each agent profile has a specific set of allowed tools.
 * The COORDINATOR is the only agent that can switch roles.
 * 
 * Default agent on startup: PROJETISTA (Designer).
 */

import { logger } from "../utils/structured_logger.js";

// ─── Agent Roles ─────────────────────────────────────────────

export type AgentRole =
    | "PROJETISTA"
    | "COORDINATOR"
    | "LIBRARIAN"
    | "SCREENER"
    | "EXTRACTOR"
    | "ANALYST";

export interface AgentProfile {
    role: AgentRole;
    name: string;
    description: string;
    allowedTools: ReadonlySet<string>;
}

// ─── Tool Permissions per Role ───────────────────────────────

const PROJETISTA_TOOLS = new Set([
    "plan_research_protocol",
    "validate_prisma_flow",
    "validate_repository",
    "heal_repositories",
    "get_current_agent",
]);

const COORDINATOR_TOOLS = new Set([
    // Exclusive
    "switch_agent",
    "get_current_agent",
    // Supervision & export
    "export_dataset",
    "audit_methodology",
    "validate_prisma_flow",
    "get_screening_report",
    // Inherits PROJETISTA tools
    "plan_research_protocol",
    "validate_repository",
    "heal_repositories",
]);

const LIBRARIAN_TOOLS = new Set([
    "get_current_agent",
    // Search (all providers)
    "search_papers_optimized",
    "search_openalex",
    "search_semanticscholar",
    "search_core",
    "search_crossref",
    "search_europe_pmc",
    "search_pubmed",
    "search_scielo",
    "search_repository",
    // Harvest & metadata
    "harvest_records",
    "get_record_metadata",
    // Download
    "retrieve_fulltexts",
    "download_and_extract_pdfs",
    // Discovery
    "snowball_search",
    // Import
    "import_dataset_ris",
    "import_bvs_export",
]);

const SCREENER_TOOLS = new Set([
    "get_current_agent",
    // Screening
    "screen_candidates",
    "screen_with_asreview",
    "deduplicate_dataset",
    // Batch screening
    "batch_keyword_screen",
    "batch_db_screen",
    // Metrics
    "get_screening_report",
]);

const EXTRACTOR_TOOLS = new Set([
    "get_current_agent",
    // Batch extraction
    "batch_llm_extract",
    // Translation (support text only)
    "translate_document",
    // Keyword exploration
    "batch_keyword_screen",
]);

const ANALYST_TOOLS = new Set([
    "get_current_agent",
    // Audit & validation
    "audit_methodology",
    "validate_prisma_flow",
    // Export
    "export_dataset",
    // Metrics
    "get_screening_report",
]);

// ─── Agent Profiles ──────────────────────────────────────────

const AGENT_PROFILES: Record<AgentRole, AgentProfile> = {
    PROJETISTA: {
        role: "PROJETISTA",
        name: "Projetista de Pesquisa",
        description: "Cria projetos, define protocolos e configura o ambiente de pesquisa. Primeiro agente ativado em cada sessão.",
        allowedTools: PROJETISTA_TOOLS,
    },
    COORDINATOR: {
        role: "COORDINATOR",
        name: "Coordenador Metodológico",
        description: "Orquestra o fluxo de trabalho, troca entre agentes e supervisiona o protocolo. Único agente que pode chamar switch_agent.",
        allowedTools: COORDINATOR_TOOLS,
    },
    LIBRARIAN: {
        role: "LIBRARIAN",
        name: "Bibliotecário",
        description: "Responsável por buscas e downloads. Mapeia bases e coleta dados. NÃO julga conteúdo.",
        allowedTools: LIBRARIAN_TOOLS,
    },
    SCREENER: {
        role: "SCREENER",
        name: "Triador",
        description: "Aplica triagem algorítmica e por IA. Aceita ou rejeita artigos conforme o protocolo PICO. NÃO faz downloads.",
        allowedTools: SCREENER_TOOLS,
    },
    EXTRACTOR: {
        role: "EXTRACTOR",
        name: "Minerador de Dados",
        description: "Extrai informações estruturadas dos artigos elegíveis. Gera traduções de apoio. Constrói planilhas e matrizes.",
        allowedTools: EXTRACTOR_TOOLS,
    },
    ANALYST: {
        role: "ANALYST",
        name: "Sintetizador/Analista",
        description: "Avalia datasets finais, audita conformidade metodológica e gera relatórios de síntese.",
        allowedTools: ANALYST_TOOLS,
    },
};

// ─── Orchestrator Service ────────────────────────────────────

export class AgentOrchestrator {
    private currentRole: AgentRole;

    constructor(initialRole: AgentRole = "PROJETISTA") {
        this.currentRole = initialRole;
        logger.info("ORCHESTRATOR", `Agente inicial: ${initialRole} (${AGENT_PROFILES[initialRole].name})`);
    }

    /**
     * Get the current active agent profile.
     */
    getCurrentAgent(): AgentProfile {
        return AGENT_PROFILES[this.currentRole];
    }

    /**
     * Get the current role string.
     */
    getCurrentRole(): AgentRole {
        return this.currentRole;
    }

    /**
     * Switch to a different agent role.
     * Only the COORDINATOR can perform this operation.
     * 
     * @param callerRole  The role attempting the switch (must be COORDINATOR)
     * @param targetRole  The target role to switch to
     * @returns           Success message or error
     */
    switchAgent(callerRole: AgentRole, targetRole: AgentRole): { success: boolean; message: string } {
        // Only COORDINATOR can switch agents
        if (callerRole !== "COORDINATOR") {
            const msg = `🚫 ACESSO NEGADO: Apenas o COORDINATOR pode trocar de agente. Agente atual: ${callerRole}.`;
            logger.warn("ORCHESTRATOR", msg);
            return { success: false, message: msg };
        }

        // Validate target role
        if (!AGENT_PROFILES[targetRole]) {
            const validRoles = Object.keys(AGENT_PROFILES).join(", ");
            return {
                success: false,
                message: `Papel inválido: "${targetRole}". Papéis válidos: ${validRoles}`,
            };
        }

        const previousRole = this.currentRole;
        this.currentRole = targetRole;
        const profile = AGENT_PROFILES[targetRole];

        const msg = `✅ Agente trocado: ${previousRole} → **${targetRole}** (${profile.name}).\n` +
            `Ferramentas disponíveis: ${[...profile.allowedTools].filter(t => t !== "get_current_agent").join(", ")}`;

        logger.info("ORCHESTRATOR", `Switch: ${previousRole} → ${targetRole}`, {
            previousRole,
            targetRole,
            toolCount: profile.allowedTools.size,
        });

        return { success: true, message: msg };
    }

    /**
     * Check if a tool is allowed for the current agent.
     * 
     * @param toolName  Name of the tool being called
     * @returns         true if allowed, false if blocked
     */
    isAllowed(toolName: string): boolean {
        return this.getCurrentAgent().allowedTools.has(toolName);
    }

    /**
     * Get a rejection message for a blocked tool call.
     */
    getRejectionMessage(toolName: string): string {
        const profile = this.getCurrentAgent();
        const allowedList = [...profile.allowedTools].filter(t => t !== "get_current_agent").join(", ");

        return `🚫 **ACESSO NEGADO** — O agente **${profile.role}** (${profile.name}) não tem permissão para usar \`${toolName}\`.\n\n` +
            `**Ferramentas disponíveis para ${profile.role}:**\n${allowedList}\n\n` +
            `Para usar \`${toolName}\`, peça ao COORDINATOR para trocar de agente via \`switch_agent\`.`;
    }

    /**
     * Get a formatted status report of the current agent.
     */
    getStatusReport(): string {
        const profile = this.getCurrentAgent();
        const tools = [...profile.allowedTools].filter(t => t !== "get_current_agent");

        return [
            `## 🎭 Agente Ativo: **${profile.role}**`,
            ``,
            `**${profile.name}**`,
            `> ${profile.description}`,
            ``,
            `### Ferramentas Disponíveis (${tools.length})`,
            ...tools.map(t => `- \`${t}\``),
            ``,
            `---`,
            `Para trocar de agente, o COORDINATOR deve chamar \`switch_agent\`.`,
        ].join("\n");
    }

    /**
     * Get all available roles and their descriptions.
     */
    static getAllProfiles(): AgentProfile[] {
        return Object.values(AGENT_PROFILES);
    }
}
