
/**
 * Agent Roles and Capabilities Registry
 * 
 * RBAC (Role-Based Access Control) for the ReviewBR MCP pipeline.
 * Each tool MUST be mapped to authorized roles here.
 * Adding a new tool without mapping it is an architectural violation.
 */

export enum AgentRole {
    PROJETISTA = 'PROJETISTA',   // F0/F1: Protocol design
    COORDINATOR = 'COORDINATOR', // Orquestrador (skill conduct-review)
    LIBRARIAN = 'LIBRARIAN',     // F2: Search/Download
    SCREENER = 'SCREENER',       // F3/F4: Screening
    EXTRACTOR = 'EXTRACTOR',     // F5: Data Extraction
    READER = 'READER',           // F5.5: Leitura/RAG do corpus curado
    ANALYST = 'ANALYST'          // F6-F8: Synthesis/Stats/Manuscript
}

export interface AgentCapability {
    canWriteProtocol: boolean;
    canDownload: boolean;
    canAccessLLM: boolean;
    canDeleteFiles: boolean;
    canReadMetrics: boolean;
}

/**
 * Tool-to-Role Authorization Map.
 * 
 * Every registered MCP tool must appear here with the list of
 * roles authorized to invoke it. This ensures architectural integrity:
 * a tool without a mapping is a tool without governance.
 */
const TOOL_PERMISSIONS: Record<string, AgentRole[]> = {
    // ─── Design de protocolo (PROJETISTA + COORDINATOR) ─────
    assess_research_design: [AgentRole.PROJETISTA, AgentRole.COORDINATOR],
    submit_protocol_for_approval: [AgentRole.PROJETISTA, AgentRole.COORDINATOR],

    // ─── Leitura/RAG (READER + ANALYST) ─────────────────────
    rag_index_corpus: [AgentRole.READER],
    rag_query: [AgentRole.READER, AgentRole.ANALYST],

    // ─── Extração (EXTRACTOR) ───────────────────────────────
    batch_llm_extract: [AgentRole.EXTRACTOR],
    translate_document: [AgentRole.EXTRACTOR, AgentRole.READER],
    batch_keyword_screen: [AgentRole.SCREENER, AgentRole.EXTRACTOR],
    batch_db_screen: [AgentRole.SCREENER],

    // ─── Cálculo do funil (COORDINATOR + ANALYST) ───────────
    compute_flow_counts: [AgentRole.COORDINATOR, AgentRole.ANALYST],

    // ─── Search (LIBRARIAN + COORDINATOR) ───────────────────
    search_openalex: [AgentRole.LIBRARIAN, AgentRole.COORDINATOR],
    search_pubmed: [AgentRole.LIBRARIAN, AgentRole.COORDINATOR],
    search_crossref: [AgentRole.LIBRARIAN, AgentRole.COORDINATOR],
    search_core: [AgentRole.LIBRARIAN, AgentRole.COORDINATOR],
    search_europe_pmc: [AgentRole.LIBRARIAN, AgentRole.COORDINATOR],
    search_scielo: [AgentRole.LIBRARIAN, AgentRole.COORDINATOR],
    search_semanticscholar: [AgentRole.LIBRARIAN, AgentRole.COORDINATOR],
    search_papers_optimized: [AgentRole.LIBRARIAN, AgentRole.COORDINATOR],
    search_repository: [AgentRole.LIBRARIAN, AgentRole.COORDINATOR],
    harvest_records: [AgentRole.LIBRARIAN, AgentRole.COORDINATOR],
    get_record_metadata: [AgentRole.LIBRARIAN, AgentRole.COORDINATOR],
    validate_repository: [AgentRole.LIBRARIAN, AgentRole.COORDINATOR],
    heal_repositories: [AgentRole.LIBRARIAN, AgentRole.COORDINATOR],

    // ─── Import & Normalization (LIBRARIAN + COORDINATOR) ───
    import_dataset_ris: [AgentRole.LIBRARIAN, AgentRole.COORDINATOR],
    import_bvs_export: [AgentRole.LIBRARIAN, AgentRole.COORDINATOR],

    // ─── Screening (SCREENER) ───────────────────────────────
    screen_candidates: [AgentRole.SCREENER],
    deduplicate_dataset: [AgentRole.SCREENER, AgentRole.COORDINATOR],

    // ─── Screening Metrics (SCREENER + COORDINATOR) ─────────
    get_screening_report: [AgentRole.SCREENER, AgentRole.COORDINATOR],
    screen_with_asreview: [AgentRole.SCREENER],

    // ─── Text Extraction (LIBRARIAN) ────────────────────────
    download_and_extract_pdfs: [AgentRole.LIBRARIAN],
    retrieve_fulltexts: [AgentRole.LIBRARIAN],
    snowball_search: [AgentRole.LIBRARIAN],

    // ─── Data Export (EXTRACTOR + ANALYST + COORDINATOR) ────
    export_dataset: [AgentRole.EXTRACTOR, AgentRole.ANALYST, AgentRole.COORDINATOR],

    // ─── Project Management (PROJETISTA + COORDINATOR) ──────
    plan_research_protocol: [AgentRole.PROJETISTA, AgentRole.COORDINATOR],

    // ─── Audit (COORDINATOR + ANALYST) ──────────────────────
    audit_methodology: [AgentRole.COORDINATOR, AgentRole.ANALYST],
    validate_prisma_flow: [AgentRole.COORDINATOR, AgentRole.ANALYST],
};

/**
 * AgentOrchestrator
 * Logic for isolation of research tasks by role.
 */
export class AgentOrchestrator {
    private static REGISTRY: Record<AgentRole, AgentCapability> = {
        [AgentRole.PROJETISTA]: {
            canWriteProtocol: true,
            canDownload: false,
            canAccessLLM: true,
            canDeleteFiles: false,
            canReadMetrics: false,
        },
        [AgentRole.COORDINATOR]: {
            canWriteProtocol: true,
            canDownload: true,
            canAccessLLM: true,
            canDeleteFiles: true,
            canReadMetrics: true,
        },
        [AgentRole.LIBRARIAN]: {
            canWriteProtocol: false,
            canDownload: true,
            canAccessLLM: false,
            canDeleteFiles: false,
            canReadMetrics: false,
        },
        [AgentRole.SCREENER]: {
            canWriteProtocol: false,
            canDownload: false,
            canAccessLLM: true,
            canDeleteFiles: false,
            canReadMetrics: true,
        },
        [AgentRole.EXTRACTOR]: {
            canWriteProtocol: false,
            canDownload: false,
            canAccessLLM: true,
            canDeleteFiles: false,
            canReadMetrics: false,
        },
        [AgentRole.READER]: {
            canWriteProtocol: false,
            canDownload: false,
            canAccessLLM: true,
            canDeleteFiles: false,
            canReadMetrics: false,
        },
        [AgentRole.ANALYST]: {
            canWriteProtocol: false,
            canDownload: false,
            canAccessLLM: true,
            canDeleteFiles: false,
            canReadMetrics: true,
        }
    };

    /**
     * Enforces role-based access control for a given capability.
     */
    static validateAction(role: AgentRole, action: keyof AgentCapability): void {
        const capability = this.REGISTRY[role];
        if (!capability[action]) {
            throw new Error(`ACCESS DENIED: Role ${role} is not authorized for action ${action}.`);
        }
    }

    /**
     * Enforces tool-level access control.
     * Returns true if the role is authorized to use the given tool.
     */
    static validateToolAccess(role: AgentRole, toolName: string): void {
        const authorized = TOOL_PERMISSIONS[toolName];
        if (!authorized) {
            throw new Error(`GOVERNANCE ERROR: Tool "${toolName}" has no role mapping in TOOL_PERMISSIONS. This is an architectural violation.`);
        }
        if (!authorized.includes(role)) {
            throw new Error(`ACCESS DENIED: Role ${role} is not authorized to use tool "${toolName}". Authorized roles: ${authorized.join(', ')}.`);
        }
    }

    /**
     * Returns the list of tools authorized for a given role.
     */
    static getAuthorizedTools(role: AgentRole): string[] {
        return Object.entries(TOOL_PERMISSIONS)
            .filter(([, roles]) => roles.includes(role))
            .map(([tool]) => tool);
    }
}
