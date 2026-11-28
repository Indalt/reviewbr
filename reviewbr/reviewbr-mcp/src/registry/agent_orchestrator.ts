
/**
 * Agent Roles and Capabilities Registry
 * 
 * RBAC (Role-Based Access Control) for the ReviewBR MCP pipeline.
 * Each tool MUST be mapped to authorized roles here.
 * Adding a new tool without mapping it is an architectural violation.
 */

export enum AgentRole {
    // Linha 25 da FILA (Hipótese A, 28/11/2026): os seis papéis de etapa (PROJETISTA, LIBRARIAN,
    // SCREENER, EXTRACTOR, READER, ANALYST) se fundiram no COORDINATOR, que executa cada etapa com a
    // skill do procedimento dela. O que separa as etapas é a trava de etapa no código (linhas 24 e 25).
    COORDINATOR = 'COORDINATOR', // Coordenador (skill conduct-review): executa a trilha F0–F8
    SCOUT = 'SCOUT',             // Exploratório fora-da-trilha PRISMA (busca ágil, não-protocolar)
    MAINTAINER = 'MAINTAINER'    // Manutenção metodológica do PRÓPRIO ReviewBR (fora da trilha de revisão) — RV-11
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
 *
 * DEBT-060 — o mapa cobre SÓ as tools do MCP. As nativas (Bash, Write, Edit, WebSearch,
 * WebFetch...) vêm do frontmatter de cada agente e nada aqui as confere: as proibições de
 * "gerar scripts" e de "busca externa" nos agentes são conduta, não trava — e cada agente
 * declara isso na própria seção de Proibições.
 */
const TOOL_PERMISSIONS: Record<string, AgentRole[]> = {
    // ─── Design de protocolo (PROJETISTA + COORDINATOR) ─────
    assess_research_design: [AgentRole.COORDINATOR],
    plan_research_protocol: [AgentRole.COORDINATOR],
    submit_protocol_for_approval: [AgentRole.COORDINATOR],
    // RV-04 (DEBT-143): quem fala com o pesquisador e registra a decisão dele é o coordenador.
    // Nenhum especialista registra decisão do pesquisador por conta própria.
    record_researcher_decision: [AgentRole.COORDINATOR],
    // Linha 17 (RV-01): emenda e desvio do protocolo travado — de quem cuida do protocolo e de quem
    // fala com o pesquisador. A aprovação exige as palavras dele; o especialista da busca não emenda.
    record_protocol_amendment: [AgentRole.COORDINATOR],
    // O plano e o roteiro de cada fonte: quem o escreve, quem busca por ele e quem conduz.
    get_search_plan: [AgentRole.COORDINATOR],
    // designer.md lista validate_repository/heal_repositories no seu contrato de papel → PROJETISTA autorizado
    validate_repository: [AgentRole.COORDINATOR],
    heal_repositories: [AgentRole.COORDINATOR],

    // ─── Leitura/RAG (READER + ANALYST) ─────────────────────
    rag_index_corpus: [AgentRole.COORDINATOR],
    rag_query: [AgentRole.COORDINATOR],

    // ─── Extração (EXTRACTOR) ───────────────────────────────
    batch_llm_extract: [AgentRole.COORDINATOR],
    translate_document: [AgentRole.COORDINATOR],
    batch_keyword_screen: [AgentRole.COORDINATOR],
    batch_db_screen: [AgentRole.COORDINATOR],

    // ─── Cálculo do funil (COORDINATOR + ANALYST) ───────────
    compute_flow_counts: [AgentRole.COORDINATOR],

    // ─── Search (LIBRARIAN + COORDINATOR; SCOUT nas 4 tools do seu contrato) ───
    search_openalex: [AgentRole.COORDINATOR, AgentRole.SCOUT],
    search_pubmed: [AgentRole.COORDINATOR, AgentRole.SCOUT],
    search_crossref: [AgentRole.COORDINATOR],
    search_core: [AgentRole.COORDINATOR],
    search_europe_pmc: [AgentRole.COORDINATOR],
    search_scielo: [AgentRole.COORDINATOR],
    search_semanticscholar: [AgentRole.COORDINATOR],
    search_papers_optimized: [AgentRole.COORDINATOR, AgentRole.SCOUT],
    search_repository: [AgentRole.COORDINATOR, AgentRole.SCOUT],
    harvest_records: [AgentRole.COORDINATOR],
    get_record_metadata: [AgentRole.COORDINATOR],
    complete_record_keywords: [AgentRole.COORDINATOR],
    // Abre os links dos registros na rede para conferir o título (linha 13 da FILA, 23/11/2026): é do librarian,
    // como o complete_record_keywords — o screener não baixa.
    verify_record_links: [AgentRole.COORDINATOR],
    // Existência e retratação das referências (linha 19 da FILA, 26/11/2026): do scout na busca exploratória, do
    // designer nas referências do protocolo e do librarian no insumo dos estágios.
    verify_references: [AgentRole.COORDINATOR, AgentRole.SCOUT],

    // ─── Import & Normalization (LIBRARIAN + COORDINATOR) ───
    import_dataset_ris: [AgentRole.COORDINATOR],
    import_bvs_export: [AgentRole.COORDINATOR],

    // ─── Screening (SCREENER) ───────────────────────────────
    screen_candidates: [AgentRole.COORDINATOR],
    // Decisões dos revisores humanos por planilha (linha 13 da FILA, 23/11/2026).
    record_screening_decisions: [AgentRole.COORDINATOR],
    deduplicate_dataset: [AgentRole.COORDINATOR],

    // ─── Screening Metrics (SCREENER + COORDINATOR + ANALYST) ─────────
    // analyst.md lista get_screening_report no seu contrato de papel → ANALYST autorizado
    get_screening_report: [AgentRole.COORDINATOR],

    // ─── Text Extraction / Aquisição (LIBRARIAN) ────────────
    download_and_extract_pdfs: [AgentRole.COORDINATOR],
    retrieve_fulltexts: [AgentRole.COORDINATOR],
    retrieve_fulltext_byos: [AgentRole.COORDINATOR], // Sci-Hub/BYOS opt-in — só após "sim" humano, que a tool exige em `consentimento`
    expand_search_snowball: [AgentRole.COORDINATOR], // nome real da tool registrada (antes mapeado errado como snowball_search)

    // ─── Data Export (EXTRACTOR + ANALYST + COORDINATOR) ────
    export_dataset: [AgentRole.COORDINATOR],

    // ─── Audit (COORDINATOR + ANALYST) ──────────────────────
    audit_methodology: [AgentRole.COORDINATOR],
    validate_prisma_flow: [AgentRole.COORDINATOR],

    // ─── Manutenção do próprio sistema (MAINTAINER) — RV-11 ──
    // Exclusiva do MAINTAINER de propósito: nenhum agente de execução de revisão altera o
    // sistema que o governa. O COORDINATOR fica de fora — quem conduz a revisão não muda
    // as regras dela no meio do caminho.
    validate_system_change: [AgentRole.MAINTAINER],
    audit_system_debt: [AgentRole.MAINTAINER],
    // Consulta de padrão: o MAINTAINER audita cobertura; o ANALYST gera o checklist de
    // conformidade na F8 (é suplemento obrigatório do manuscrito).
    check_standard_coverage: [AgentRole.COORDINATOR, AgentRole.MAINTAINER],
    // O catálogo é o mapa do território metodológico. PROJETISTA consulta ao desenhar o
    // protocolo (que método cabe nesta pergunta?); MAINTAINER mantém e audita.
    query_methodology_catalog: [AgentRole.COORDINATOR, AgentRole.MAINTAINER],
    // Lado de ESCRITA do mantenedor — exclusivo dele. Quem executa revisao nao altera o
    // sistema que a governa, e criar metodologia por fora do RV-11 seria o caminho facil
    // de contornar o gate.
    record_system_finding: [AgentRole.MAINTAINER],
    absorb_methodology: [AgentRole.MAINTAINER],
    scaffold_methodology: [AgentRole.MAINTAINER],
    validate_methodology: [AgentRole.MAINTAINER],
};

/**
 * AgentOrchestrator
 * Logic for isolation of research tasks by role.
 */
export class AgentOrchestrator {
    private static REGISTRY: Record<AgentRole, AgentCapability> = {
        [AgentRole.COORDINATOR]: {
            canWriteProtocol: true,
            canDownload: true,
            canAccessLLM: true,
            canDeleteFiles: true,
            canReadMetrics: true,
        },
        [AgentRole.SCOUT]: {
            canWriteProtocol: false,
            canDownload: false,
            canAccessLLM: true,
            canDeleteFiles: false,
            canReadMetrics: false,
        },
        // MAINTAINER trabalha sobre o SISTEMA, não sobre um projeto de revisão:
        // não escreve protocolo de revisão, não baixa acervo, não apaga artefato de projeto.
        // Lê métricas porque auditar o sistema exige ver o que ele produz.
        [AgentRole.MAINTAINER]: {
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

    /**
     * Returns every tool name that has a role mapping (the canonical allow-list surface).
     */
    static getGovernedTools(): string[] {
        return Object.keys(TOOL_PERMISSIONS);
    }

    /**
     * Guarda de completude da governança (o guardião "religado" no servidor único).
     *
     * O servidor MCP compartilhado NÃO sabe qual subagente chamou uma tool
     * (a fronteira por papel é imposta pelo harness via `tools:`/`mcpServers:` dos
     * subagentes). O papel do guardião no runtime é, portanto, garantir a INTEGRIDADE
     * do mapa: toda tool exposta precisa ter dono de papel, e todo mapeamento precisa
     * corresponder a uma tool que existe. Isso torna impossível adicionar uma tool
     * (nova capacidade/efeito colateral) sem governança — falha ruidosa no boot.
     *
     * Bidirecional de propósito:
     *  - tool registrada SEM mapeamento → GOVERNANCE ERROR (capacidade sem dono);
     *  - mapeamento SEM tool registrada → GOVERNANCE ERROR (regra morta / nome errado,
     *    ex.: o antigo `snowball_search`).
     *
     * @param registeredTools nomes de todas as tools expostas por `server.tool(...)`.
     */
    static assertGovernanceCompleteness(registeredTools: Iterable<string>): void {
        const registered = new Set(registeredTools);
        const governed = new Set(this.getGovernedTools());

        const unmapped = [...registered].filter((t) => !governed.has(t));
        if (unmapped.length > 0) {
            throw new Error(
                `GOVERNANCE ERROR: tool(s) sem mapeamento de papel em TOOL_PERMISSIONS: ${unmapped.join(", ")}. ` +
                `Toda tool exposta precisa declarar quais papéis podem usá-la (violação arquitetural — RV-06).`
            );
        }

        const dead = [...governed].filter((t) => !registered.has(t));
        if (dead.length > 0) {
            throw new Error(
                `GOVERNANCE ERROR: mapeamento(s) de papel para tool(s) inexistente(s): ${dead.join(", ")}. ` +
                `TOOL_PERMISSIONS deve refletir fielmente as tools realmente registradas.`
            );
        }
    }
}
