#!/usr/bin/env node
/**
 * MCP Server entry point.
 * Registers all tools, resources, and starts the stdio transport.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Registry } from "./registry/loader.js";
import { AccessStrategy } from "./access/strategy.js";
import { SearchService } from "./services/search.js";
import { DeduplicationService } from "./services/dedupe.js";
import { ScreeningService } from "./services/screen.js";
import { SnowballService } from "./services/snowball.js";
import { DataService } from "./services/data.js";
import { PubMedService } from "./services/pubmed.js";
import { CrossrefService } from "./services/crossref.js";
import { DatabaseService } from "./services/database.js";
import { PrismaFlowValidator, PrismaFlowSchema } from "./services/prisma_validator.js";
import { FlowComputer } from "./services/flow_computer.js";
import { indexCorpus, queryCorpus } from "./services/rag_lexical.js";
import { ProjectStateService } from "./services/project_state.js";
import { consolidateRaw, writeDeduped, appendRawRecords, writeScreening } from "./services/project_artifacts.js";
import { BvsService } from "./services/bvs.js";
import { ProjectInitService } from "./services/project_init.js";
import { SemanticScholarService } from "./services/semantic_scholar.js";
import { CoreService } from "./services/core.js";
import { EuropePmcService } from "./services/europe_pmc.js";
import { PdfExtractorService } from "./services/pdf_extractor.js";
import { TelemetryService } from "./services/telemetry.js";
import { MethodologyAuditorService } from "./services/methodology_auditor.js";
import { ProtocolDesignAuditor } from "./services/protocol_auditor.js";
import { ScreeningMetricsService } from "./services/screening_metrics.js";
import { AsreviewBridgeService } from "./services/asreview_bridge.js";
import { ScihubBridgeService } from "./services/scihub_bridge.js";
import { RepositoryHealerService } from "./services/repository_healer.js";
import { config } from "./config.js";
import { logger } from "./utils/structured_logger.js";
import { BatchProcessorService } from "./services/batch_processor.js";

import * as path from "node:path";
import * as fs from "node:fs";

// ─── Initialize ───────────────────────────────────────────────
const toolHandlers = new Map<string, (params: any) => Promise<any>>();

logger.info("MCP_SERVER", "Inicializando ReviewBR MCP Server", {
    hasLlmKey: config.hasLlmKey,
    hasZotero: config.hasZotero,
});

const registry = Registry.loadDefault();
const strategy = new AccessStrategy();
const searchService = new SearchService(registry, strategy);
const dedupeService = new DeduplicationService();
const screeningService = new ScreeningService(config.googleApiKey);
const snowballService = new SnowballService();
const dataService = new DataService();
const pubmedService = new PubMedService();
const crossrefService = new CrossrefService();
const semanticScholarService = new SemanticScholarService();
const coreService = new CoreService();
const europePmcService = new EuropePmcService();
const pdfExtractorService = new PdfExtractorService();
const dbService = new DatabaseService();
const bvsService = new BvsService();
const projectInitService = new ProjectInitService();
const telemetryService = new TelemetryService();
const auditorService = new MethodologyAuditorService();
const protocolAuditor = new ProtocolDesignAuditor();
const screeningMetricsService = new ScreeningMetricsService();
const asreviewBridge = new AsreviewBridgeService();
const scihubBridge = new ScihubBridgeService();
const repositoryHealerService = new RepositoryHealerService();

/**
 * RBAC de runtime APOSENTADO (modelo multi-subagente).
 *
 * O modelo antigo mantinha UM papel mutável no servidor ("um chapéu por vez") e
 * bloqueava toda tool fora dele — o que travava um cliente novo (default PROJETISTA)
 * de buscar ou triar até chamar switch_agent. No cockpit multi-subagente do Claude Code,
 * a fronteira de papéis é o allow-list de cada subagente em `.claude/agents/`, e o
 * guardião DECLARATIVO (consultável) vive em `registry/agent_orchestrator.ts`
 * (defense-in-depth). Por isso `guardedHandler` vira PASS-THROUGH — mantém os
 * call-sites existentes sem bloquear em runtime.
 */
function guardedHandler(_toolName: string, handler: (params: any) => Promise<any>) {
    return handler;
}

/**
 * Helper to log tool execution directly into the project's local directory.
 */
async function logToLocalProject(projectPath: string, toolName: string, data: any) {
    try {
        const logDir = path.join(process.cwd(), projectPath, "logs");
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
        const logPath = path.join(logDir, "search_history.json");
        const logEntry = {
            timestamp: new Date().toISOString(),
            tool: toolName,
            ...data
        };
        let history = [];
        if (fs.existsSync(logPath)) {
            try {
                history = JSON.parse(fs.readFileSync(logPath, "utf-8"));
            } catch (e) { history = []; }
        }
        history.push(logEntry);
        fs.writeFileSync(logPath, JSON.stringify(history, null, 2));
    } catch (e) {
        console.error("Local logging error:", e);
    }
}

async function checkDesignGuardrail(projectId?: number, projectPath?: string): Promise<string | null> {
    let id = projectId;
    // Fonte da verdade = estado ON-DISK (RV-01). Preview (sem projectPath) NUNCA bloqueia.
    if (projectPath) {
        const projectDir = path.isAbsolute(projectPath) ? projectPath : path.join(process.cwd(), projectPath);
        const st = ProjectStateService.read(projectDir);
        if (st) {
            if (st.status !== "LOCKED") {
                return `🚫 ACESSO NEGADO: o protocolo está em ${st.status}. Preencha o protocol.md e aprove via 'submit_protocol_for_approval' antes de iniciar buscas/mineração.`;
            }
            return null; // LOCKED → liberado
        }
        // Fallback: marcador [LOCKED] no protocol.md da raiz
        const protoPath = path.join(projectDir, "protocol.md");
        if (fs.existsSync(protoPath)) {
            if (!/\[LOCKED\]/.test(fs.readFileSync(protoPath, "utf-8"))) {
                return `🚫 ACESSO NEGADO: o protocol.md ainda não está [LOCKED]. Aprove via 'submit_protocol_for_approval'.`;
            }
            return null;
        }
    }
    // Fallback legado (projetos antigos rastreados só no SQLite)
    if (!id && projectPath) {
        const project = await dbService.findProjectByPath(projectPath);
        if (project) id = project.id;
    }
    if (id) {
        const project = await dbService.getProjectById(id);
        if (project && project.status === "DRAFT_DESIGN") {
            return `🚫 ACESSO NEGADO: O projeto "${project.project_name}" está bloqueado em DRAFT_DESIGN. Preencha o protocolo e solicite aprovação via 'submit_protocol_for_approval'.`;
        }
    }
    return null;
}

// ─── PROJETISTA Helper Functions ──────────────────────────────

interface ResearchTypeMeta {
    label: string;
    prismaStandard: string;
    requiresRegistration: boolean;
    registrationPlatform: string;
    description: string;
}

function detectResearchType(intent: string): string {
    const lower = intent.toLowerCase();

    // Direct match patterns
    if (/revis[aã]o\s+sistem[aá]tica|systematic\s+review/.test(lower)) return "systematic_review";
    if (/meta.an[aá]lise|meta.analysis/.test(lower)) return "meta_analysis";
    if (/scoping|escopo/.test(lower)) return "scoping_review";
    if (/revis[aã]o\s+integrativa|integrative/.test(lower)) return "integrative_review";
    if (/revis[aã]o\s+r[aá]pida|rapid\s+review/.test(lower)) return "rapid_review";
    if (/auditoria|audit/.test(lower)) return "methodological_audit";

    // Intent-based detection
    if (/mapear|mapeamento|panorama|amplitude|overview/.test(lower)) return "scoping_review";
    if (/quantificar|efeito|efic[aá]cia|efetividade|risco|odds/.test(lower)) return "meta_analysis";
    if (/responder|pergunta|foco|interven[cç][aã]o|tratamento/.test(lower)) return "systematic_review";
    if (/urgente|r[aá]pido|prazo|relat[oó]rio/.test(lower)) return "rapid_review";
    if (/validar|conferir|verificar/.test(lower)) return "methodological_audit";

    // Default: exploratory
    return "exploratory";
}

function getResearchTypeMeta(researchType: string): ResearchTypeMeta {
    const META: Record<string, ResearchTypeMeta> = {
        systematic_review: {
            label: "Revisão Sistemática",
            prismaStandard: "PRISMA 2020 (27 itens, 44 subitens) + PRISMA-S (16 itens) + PRISMA-P (protocolo)",
            requiresRegistration: true,
            registrationPlatform: "PROSPERO (saúde) ou OSF Registries (outros domínios)",
            description: "Revisão que responde a uma pergunta focada usando metodologia pré-definida, reprodutível e transparente."
        },
        scoping_review: {
            label: "Revisão de Escopo (Scoping Review)",
            prismaStandard: "PRISMA-ScR (Extensão para Scoping Reviews) + Guia JBI",
            requiresRegistration: false,
            registrationPlatform: "Opcional: OSF Registries",
            description: "Mapeia a extensão e natureza da literatura, identifica lacunas e conceitos-chave."
        },
        integrative_review: {
            label: "Revisão Integrativa",
            prismaStandard: "PRISMA 2020 adaptado (Whittemore & Knafl)",
            requiresRegistration: false,
            registrationPlatform: "Opcional: PROSPERO ou OSF",
            description: "Combina evidências experimentais e não-experimentais para compreensão abrangente."
        },
        meta_analysis: {
            label: "Meta-Análise",
            prismaStandard: "PRISMA 2020 (27 itens, 44 subitens) + PRISMA-S + Diretrizes de síntese estatística",
            requiresRegistration: true,
            registrationPlatform: "PROSPERO (obrigatório)",
            description: "Síntese quantitativa usando métodos estatísticos (forest plot, I², heterogeneidade)."
        },
        rapid_review: {
            label: "Revisão Rápida",
            prismaStandard: "PRISMA 2020 simplificado + Diretrizes Cochrane para Rapid Reviews",
            requiresRegistration: false,
            registrationPlatform: "Opcional: OSF",
            description: "Metodologia simplificada para prazos curtos. Risco de viés documentado."
        },
        exploratory: {
            label: "Pesquisa Exploratória / Básica",
            prismaStandard: "Sem PRISMA formal — protocolo de busca livre documentado",
            requiresRegistration: false,
            registrationPlatform: "N/A",
            description: "Busca bibliográfica sem metodologia sistemática formal."
        },
        methodological_audit: {
            label: "Auditoria Metodológica (Post-Hoc)",
            prismaStandard: "PRISMA 2020 + PRISMA-S (Validação Passiva — Somente Leitura)",
            requiresRegistration: false,
            registrationPlatform: "N/A",
            description: "Validação retroativa de pesquisa já concluída. O sistema NÃO gera novos dados."
        }
    };

    return META[researchType] || META["exploratory"];
}

function getCapabilitiesForType(researchType: string): { can: string[]; cannot: string[] } {
    const baseCan = [
        "Busca automatizada em 10+ bases (OpenAlex, PubMed, SciELO, CORE, Crossref, OasisBR, Europe PMC)",
        "Download e extração de texto de PDFs (com PDF Link Resolver)",
        "Deduplicação inteligente (DOI, autores, similaridade de títulos)",
        "Logs estruturados JSONL para reprodutibilidade",
    ];

    const baseCannot: string[] = [];

    switch (researchType) {
        case "systematic_review":
        case "meta_analysis":
            return {
                can: [
                    ...baseCan,
                    "Triagem por IA (Gemini/GPT/Claude) e por ML (ASReview)",
                    "Validação PRISMA (fluxograma matemático, 10 campos)",
                    "Auditoria metodológica (5 checks de conformidade)",
                    "Snowball search (forward/backward via OpenAlex/Crossref)",
                    "Tradução de apoio (texto auxiliar, NÃO fonte primária)",
                ],
                cannot: [
                    "Avaliação de risco de viés (RoB2, Newcastle-Ottawa) — requer julgamento humano",
                    ...(researchType === "meta_analysis" ? [
                        "Meta-análise estatística (forest plot, I²) — requer R/RevMan/Stata",
                    ] : []),
                    "Registro PROSPERO — feito manualmente pelo pesquisador no site",
                    "Cegamento multiusuário real — sistema simula separação de revisores",
                ],
            };
        case "scoping_review":
        case "integrative_review":
            return {
                can: [
                    ...baseCan,
                    "Triagem por IA e ML",
                    "Extração estruturada em lote (batch_llm_extract)",
                    "Processamento em lote (keyword screen, DB screen)",
                    "Tradução de apoio",
                ],
                cannot: [
                    "Categorização temática automática — requer validação humana",
                ],
            };
        case "exploratory":
        case "rapid_review":
            return {
                can: [
                    ...baseCan,
                    "Triagem por palavras-chave e IA",
                    "Tradução de apoio",
                ],
                cannot: [],
            };
        case "methodological_audit":
            return {
                can: [
                    "Auditoria de conformidade (5 checks)",
                    "Validação PRISMA (fluxograma matemático)",
                    "Detecção de duplicatas residuais",
                    "Análise de viés de seleção",
                ],
                cannot: [
                    "NÃO busca, baixa ou gera novos dados — apenas diagnostica",
                ],
            };
        default:
            return { can: baseCan, cannot: [] };
    }
}

const server = new McpServer({
    name: "reviewbr-mcp",
    version: "1.0.0",

});

// ─── RBAC Proxy REMOVIDO ──────────────────────────────────────
// O proxy que auto-embrulhava toda tool com o guard de runtime foi removido
// junto com o modelo "um chapéu por vez". A governança de papéis agora é
// declarativa (registry/agent_orchestrator.ts) + allow-list dos subagentes.

// ─── Resources ────────────────────────────────────────────────

server.resource(
    "registry",
    "repos://registry",
    { description: "Cadastro mestre de repositórios acadêmicos brasileiros" },
    async () => ({
        contents: [{
            uri: "repos://registry",
            mimeType: "application/json",
            text: JSON.stringify(registry.getAll(), null, 2),
        }],
    })
);

server.resource(
    "stats",
    "repos://stats",
    { description: "Estatísticas agregadas do cadastro de repositórios" },
    async () => ({
        contents: [{
            uri: "repos://stats",
            mimeType: "application/json",
            text: JSON.stringify(registry.getStats(), null, 2),
        }],
    })
);

// ─── Agent Orchestrator Tools REMOVIDAS ───────────────────────
// `get_current_agent` e `switch_agent` foram aposentadas com o modelo de papel
// mutável. No cockpit multi-subagente, cada subagente (.claude/agents/) já é um
// papel isolado com seu próprio allow-list — não há chapéu para trocar em runtime.

// ─── PROJETISTA Knowledge Resource ────────────────────────────

const protocolKnowledgePath = path.join(process.cwd(), "data", "knowledge", "research_protocols.md");
const protocolKnowledge = fs.existsSync(protocolKnowledgePath)
    ? fs.readFileSync(protocolKnowledgePath, "utf-8")
    : "⚠️ Base de conhecimento não encontrada. Certifique-se de que data/knowledge/research_protocols.md existe.";

server.resource(
    "research_protocols",
    "projetista://protocols",
    { description: "Base de conhecimento PRISMA, protocolos científicos e árvore de decisão do PROJETISTA. A LLM deve ler este recurso ao assumir o papel de Designer de Pesquisa." },
    async () => ({
        contents: [{
            uri: "projetista://protocols",
            mimeType: "text/markdown",
            text: protocolKnowledge,
        }],
    })
);

// ─── PROJETISTA: assess_research_design ───────────────────────

server.tool(
    "assess_research_design",
    "Avalia a intenção de pesquisa do usuário e recomenda o tipo de pesquisa, protocolo, requisitos e limitações. Aceita tanto pesquisadores que precisam de orientação quanto os que já sabem o que querem. Retorna briefing para o COORDINATOR.",
    {
        intent: z.string().describe("O que o pesquisador quer fazer — pode ser uma frase livre ou um tipo de pesquisa já definido"),
        area: z.string().optional().describe("Área do conhecimento (ex: Saúde, Engenharia, Ciência de Alimentos)"),
        researchType: z.enum([
            "systematic_review", "scoping_review", "integrative_review",
            "meta_analysis", "rapid_review", "exploratory", "methodological_audit"
        ]).optional().describe("Se o pesquisador já sabe o tipo, informe diretamente"),
    },
    guardedHandler("assess_research_design", async (params) => {
        const intent = params.intent.toLowerCase();
        const area = params.area || "Não especificada";

        // ─── Research type detection ───────────────────
        let detectedType = params.researchType || detectResearchType(intent);
        const meta = getResearchTypeMeta(detectedType);

        // ─── Topic analysis for design advice ──────────
        const designAdvice = ProjectInitService.getDesignAdvice(params.intent, detectedType as any);

        // ─── Build response ────────────────────────────
        const sections: string[] = [];

        sections.push(`## 🏗️ Diagnóstico de Design de Pesquisa\n`);

        // Mode indicator
        if (params.researchType) {
            sections.push(`> **Modo Direto** — O pesquisador já definiu: **${meta.label}**\n`);
        } else {
            sections.push(`> **Modo Guiado** — Tipo detectado pela intenção: **${meta.label}**\n`);
        }

        sections.push(`**Área:** ${area}\n**Intenção:** "${params.intent}"\n`);

        // Protocol requirements
        sections.push(`### 📋 Protocolo Recomendado\n`);
        sections.push(`- **Tipo:** ${meta.label}`);
        sections.push(`- **Padrão PRISMA:** ${meta.prismaStandard}`);
        sections.push(`- **Registro:** ${meta.requiresRegistration ? `⚠️ OBRIGATÓRIO (${meta.registrationPlatform})` : `Opcional (${meta.registrationPlatform})`}`);
        sections.push(`- **Descrição:** ${meta.description}\n`);

        // Design recommendations
        sections.push(`### ⚖️ Recomendações de Design\n`);
        sections.push(`- **Cegamento:** ${designAdvice.suggestBlinding}`);
        sections.push(`- **Meta-análise:** ${designAdvice.suggestMetaAnalysis ? "Recomendada" : "Não se aplica"}`);
        for (const advice of designAdvice.advice) {
            sections.push(`- ${advice}`);
        }

        // Capabilities check
        sections.push(`\n### ✅ O que o ReviewBR pode fazer para esta pesquisa\n`);
        const capabilities = getCapabilitiesForType(detectedType);
        for (const cap of capabilities.can) {
            sections.push(`- ✅ ${cap}`);
        }
        if (capabilities.cannot.length > 0) {
            sections.push(`\n### ⚠️ Limitações identificadas\n`);
            for (const lim of capabilities.cannot) {
                sections.push(`- ❌ ${lim}`);
            }
        }

        // COORDINATOR briefing
        sections.push(`\n### 📤 Briefing para o COORDINATOR\n`);
        sections.push(`Quando o PROJETISTA finalizar e o COORDINATOR assumir, comunique:`);
        sections.push(`1. **Tipo:** ${meta.label} (${detectedType})`);
        sections.push(`2. **PRISMA:** ${meta.prismaStandard}`);
        sections.push(`3. **Cegamento:** ${designAdvice.suggestBlinding}`);
        sections.push(`4. **Registro:** ${meta.requiresRegistration ? "OBRIGATÓRIO antes da busca" : "Opcional"}`);
        sections.push(`5. **Meta-análise:** ${designAdvice.suggestMetaAnalysis ? "Sim" : "Não"}`);
        sections.push(`6. **Limitações:** ${capabilities.cannot.length > 0 ? capabilities.cannot.join("; ") : "Nenhuma crítica identificada"}`);

        // Next steps
        sections.push(`\n### ➡️ Próximos Passos\n`);
        sections.push(`1. Pesquisador confirma ou ajusta o design`);
        sections.push(`2. O subagente **designer** chama \`plan_research_protocol\` e trava o protocolo`);
        sections.push(`3. O coordenador (skill conduct-review) aciona o subagente **librarian** para as buscas`);

        return {
            content: [{ type: "text", text: sections.join("\n") }],
        };
    })
);

// ─── Tools ────────────────────────────────────────────────────

server.tool(
    "search_papers_optimized",
    "Busca artigos em repositórios organizados por Camadas de Cobertura.",
    {
        query: z.string().describe("Termo de busca"),
        layers: z.array(z.number())
            .default([1, 3])
            .describe("Camadas: 1=Agregadores (Oasisbr/SciELO), 2=Instituições, 3=Prioridade, 4=Especializados, 5=Literatura Cinzenta"),
        dateFrom: z.string().optional(),
        dateUntil: z.string().optional(),
        projectId: z.number().optional(),
        projectPath: z.string().optional(),
    },
    async (params) => {
        const guardrailError = await checkDesignGuardrail(params.projectId, params.projectPath);
        if (guardrailError) return { content: [{ type: "text", text: guardrailError }] };

        telemetryService.logSearch("optimized_search", params.query, params.layers.join(','), undefined);
        const { results, errors } = await searchService.searchPapers(params.query, params.layers, {
            dateFrom: params.dateFrom,
            dateUntil: params.dateUntil
        });

        // Resolve project for audit
        let projectId = params.projectId;
        if (!projectId && params.projectPath) {
            const project = await dbService.findProjectByPath(params.projectPath);
            if (project) projectId = project.id;
        }

        if (projectId) {
            await dbService.insertRecords(projectId, "optimized_search", results);
            if (params.projectPath) appendRawRecords(params.projectPath, results, "database");
            await dbService.lockProject(projectId);
            await dbService.logAuditEvent({
                project_id: projectId,
                tool_name: "search_papers_optimized",
                action_type: "search",
                params: JSON.stringify(params),
                result_summary: `Busca otimizada: ${results.length} registros importados para o banco.`
            });
        }

        if (params.projectPath) {
            await logToLocalProject(params.projectPath, "search_papers_optimized", {
                query: params.query,
                found: results.length,
                errors
            });
        }

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    count: results.length,
                    errors: errors,
                    results: results
                }, null, 2)
            }]
        };
    }
);

server.tool(
    "deduplicate_dataset",
    "Deduplica os resultados (F3). Com projectPath: CONSOLIDA todos os brutos de 01_raw/*.json (todas as fontes), grava 01_raw/database_records.json e escreve 02_deduplicated/dataset.json + dedupe_report.json (RV-02). Sem projectPath: deduplica o JSON passado e só retorna.",
    {
        dataset: z.string().optional().describe("JSON string com array de resultados (opcional se projectPath for informado — nesse caso consolida 01_raw)"),
        projectPath: z.string().optional().describe("Raiz do projeto: consolida 01_raw e persiste os artefatos canônicos"),
    },
    async (params) => {
        let records: any[] = [];
        let consolidatedNote = "";

        if (params.projectPath) {
            const { database, other } = consolidateRaw(params.projectPath);
            records = [...database, ...other];
            consolidatedNote = `Consolidados de 01_raw: ${database.length} (bases) + ${other.length} (outras fontes).\n`;
        } else if (params.dataset) {
            try { records = JSON.parse(params.dataset); }
            catch { return { content: [{ type: "text", text: "Erro ao fazer parse do JSON." }] }; }
        } else {
            return { content: [{ type: "text", text: "Informe 'dataset' (JSON) ou 'projectPath' (para consolidar 01_raw)." }] };
        }

        const result = dedupeService.deduplicate(records);

        if (params.projectPath) {
            writeDeduped(params.projectPath, result.unique, {
                method: "DOI > título+ano > url",
                total_before: result.stats.total,
                duplicates_removed: result.stats.duplicates,
                total_after: result.stats.unique,
                generated: new Date().toISOString(),
            });
            ProjectStateService.setPhase(
                path.isAbsolute(params.projectPath) ? params.projectPath : path.join(process.cwd(), params.projectPath),
                "F3",
            );
        }

        return {
            content: [{
                type: "text",
                text: `${consolidatedNote}Deduplicação: ${result.stats.total} → ${result.stats.unique} únicos (${result.stats.duplicates} duplicatas removidas).` +
                    (params.projectPath ? `\nGravado: 02_deduplicated/dataset.json + dedupe_report.json.` : `\n\n${JSON.stringify(result.stats, null, 2)}`),
            }]
        };
    }
);

server.tool(
    "screen_candidates",
    "Triagem por IA (Gemini). stage='ta' (título/resumo) ou 'fulltext' (texto completo). Com projectPath e sem 'candidates', lê o insumo do funil automaticamente (ta ← 02_deduplicated/dataset.json; fulltext ← 03_screening/included_ta.json) e grava included/excluded por estágio (RV-02). A triagem TA deve ser DECISIVA usando os critérios+booleanos — não empurre tudo para 'maybe'.",
    {
        candidates: z.string().optional().describe("JSON com array de candidatos (opcional se projectPath+stage forem dados)"),
        criteria: z.string().describe("Critérios de inclusão/exclusão (derivados do protocolo)"),
        stage: z.enum(["ta", "fulltext"]).optional().describe("Fase da triagem (default: ta)"),
        projectPath: z.string().optional().describe("Raiz do projeto: lê o insumo e persiste os artefatos por estágio"),
    },
    async (params) => {
        if (!config.hasLlmKey) {
            return { content: [{ type: "text", text: "Nenhuma chave de API de LLM configurada (GOOGLE_API_KEY, OPENAI_API_KEY ou ANTHROPIC_API_KEY)." }] };
        }

        const stage = params.stage ?? "ta";
        let records: any[] = [];
        if (params.candidates) {
            try { records = JSON.parse(params.candidates); }
            catch { return { content: [{ type: "text", text: "Erro ao fazer parse do JSON." }] }; }
        } else if (params.projectPath) {
            const dir = path.isAbsolute(params.projectPath) ? params.projectPath : path.join(process.cwd(), params.projectPath);
            const inputRel = stage === "ta" ? "02_deduplicated/dataset.json" : "03_screening/included_ta.json";
            const inputPath = path.join(dir, inputRel);
            if (!fs.existsSync(inputPath)) {
                return { content: [{ type: "text", text: `Insumo da triagem ${stage} não encontrado: ${inputRel}. Rode a fase anterior primeiro.` }] };
            }
            try {
                const parsed = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
                records = Array.isArray(parsed) ? parsed : (parsed.records ?? parsed.included ?? []);
                // se vier de included_ta (ScreeningResult[]), extrai o .record
                records = records.map((r: any) => r?.record ?? r);
            } catch { return { content: [{ type: "text", text: `Erro ao ler ${inputRel}.` }] }; }
        } else {
            return { content: [{ type: "text", text: "Informe 'candidates' ou 'projectPath'+'stage'." }] };
        }

        const result = await screeningService.screenCandidates(records, params.criteria, params.projectPath);

        // Falha ruidosa: se TUDO errou, não finja sucesso silencioso nem avance a fase.
        const totalDecided = result.included.length + result.excluded.length;
        if (result.errors.length > 0 && totalDecided === 0) {
            const sample = [...new Set(result.errors)].slice(0, 3).join(" | ");
            return {
                content: [{
                    type: "text",
                    text: `❌ Triagem ${stage.toUpperCase()} FALHOU para todos os ${records.length} candidatos (0 decisões, ${result.errors.length} erros). Nada foi gravado, fase NÃO avançou.\nAmostra de erros: ${sample}\n\nVerifique GOOGLE_API_KEY/OPENAI_API_KEY/ANTHROPIC_API_KEY em reviewbr-mcp/.env (chave inválida/expirada é a causa mais comum).`,
                }]
            };
        }

        if (params.projectPath) {
            writeScreening(params.projectPath, stage, result.included, result.excluded);
            ProjectStateService.setPhase(
                path.isAbsolute(params.projectPath) ? params.projectPath : path.join(process.cwd(), params.projectPath),
                "F4",
            );
        }

        const excludedRel = stage === "ta" ? "excluded_ta.json" : "excluded_fulltext.json";
        const includedRel = stage === "ta" ? "included_ta.json (encaminhados p/ texto completo)" : "included.json (incluídos finais)";
        const errorNote = result.errors.length > 0
            ? `\n⚠️ ${result.errors.length} candidato(s) com erro na triagem (não decididos, não incluídos nem excluídos): ${[...new Set(result.errors)].slice(0, 3).join(" | ")}`
            : "";
        return {
            content: [{
                type: "text",
                text: `Triagem ${stage.toUpperCase()}: ${result.included.length} incluídos, ${result.excluded.length} excluídos.` +
                    (params.projectPath ? `\nGravado: 03_screening/${includedRel} + 03_screening/${excludedRel}.` : `\n\n${JSON.stringify(result, null, 2)}`) +
                    errorNote,
            }]
        };
    }
);

// ─── Phase 2: Refined Central Extraction ──────────────────────

server.tool(
    "download_and_extract_pdfs",
    "Realiza o download e a extração estruturada de texto a partir de PDFs ou páginas HTML. **Ferramenta OBRIGATÓRIA para leitura de documentos em background, não tente abrir links manualmente no navegador.**",
    {
        urlsAndIds: z.array(z.object({
            id: z.string().describe("Identificador / Nome do arquivo"),
            url: z.string().describe("URL aberta do PDF ou Página")
        })).describe("Lista de PDFs para baixar em massa"),
        projectPath: z.string().describe("Caminho do projeto (ex: projects/meu_projeto)"),
    },
    async (params) => {
        const results = [];
        for (const item of params.urlsAndIds) {
            const result = await pdfExtractorService.downloadAndExtract(item.url, item.id, params.projectPath);
            results.push({
                id: item.id,
                url: item.url,
                ...result
            });
        }

        return {
            content: [{
                type: "text",
                text: JSON.stringify({ extraction_batch: results }, null, 2)
            }]
        };
    }
);

// ─── Tools (Snowball & Data) ──────────────────────────────────

server.tool(
    "expand_search_snowball",
    "Expande a busca via Snowballing (Citações e Referências via OpenAlex).",
    {
        dataset: z.string().describe("JSON string com sementes (SearchResult[])"),
    },
    async (params) => {
        let seeds;
        try {
            seeds = JSON.parse(params.dataset);
        } catch (e) {
            return { content: [{ type: "text", text: "Erro ao fazer parse do JSON." }] };
        }

        const result = await snowballService.expandSearch(seeds);
        return {
            content: [{
                type: "text",
                text: JSON.stringify(result, null, 2)
            }]
        };
    }
);

server.tool(
    "export_dataset",
    "Exporta dados para CSV, Markdown (Bibliografia), JSON, ou formato ASReview.",
    {
        dataset: z.string().describe("JSON string com resultados"),
        format: z.enum(["csv", "markdown", "json", "asreview"]).default("json").describe("Formato de saída. Use 'asreview' para gerar CSV compatível com ASReview LAB."),
    },
    async (params) => {
        let records;
        try {
            records = JSON.parse(params.dataset);
            if (records.results) records = records.results; // Handle wrapper
        } catch (e) {
            return { content: [{ type: "text", text: "Erro ao fazer parse do JSON." }] };
        }

        const output = dataService.exportDataset(records, params.format as any);
        return {
            content: [{
                type: "text",
                text: output
            }]
        };
    }
);


server.tool(
    "import_dataset_ris",
    "Importa dados de arquivo RIS (ex: Zotero/EndNote).",
    {
        content: z.string().describe("Conteúdo do arquivo .ris"),
        projectId: z.number().optional(),
        projectPath: z.string().optional(),
    },
    async (params) => {
        const results = dataService.importRis(params.content);

        // Resolve project for audit
        let projectId = params.projectId;
        if (!projectId && params.projectPath) {
            const project = await dbService.findProjectByPath(params.projectPath);
            if (project) projectId = project.id;
        }

        if (projectId) {
            await dbService.insertRecords(projectId, "ris_import", results);
        }

        return {
            content: [{
                type: "text",
                text: JSON.stringify(results, null, 2)
            }]
        };
    }
);

server.tool(
    "import_bvs_export",
    "Importa resultados exportados do portal BVS/LILACS (CSV).",
    {
        filePath: z.string().describe("Caminho absoluto para o arquivo CSV exportado da BVS"),
        projectId: z.number().optional(),
        projectPath: z.string().optional(),
    },
    async (params) => {
        if (!fs.existsSync(params.filePath)) {
            return { content: [{ type: "text", text: `Arquivo não encontrado: ${params.filePath}` }] };
        }

        const csvContent = fs.readFileSync(params.filePath, "utf-8");
        const results = bvsService.parseCSV(csvContent);

        // Resolve project for audit
        let projectId = params.projectId;
        if (!projectId && params.projectPath) {
            const project = await dbService.findProjectByPath(params.projectPath);
            if (project) projectId = project.id;
        }

        if (projectId) {
            await dbService.insertRecords(projectId, "lilacs", results);
            await dbService.logAuditEvent({
                project_id: projectId,
                tool_name: "import_bvs_export",
                action_type: "import",
                params: JSON.stringify(params),
                result_summary: `Importado BVS CSV: ${results.length} registros.`
            });
        }

        return {
            content: [{
                type: "text",
                text: `Sucesso: ${results.length} registros importados da BVS para o projeto ${projectId || "(sem ID)"}.`
            }]
        };
    }
);

server.tool(
    "search_pubmed",
    "Busca artigos no PubMed (via Biopython). Ideal para literatura biomédica e de saúde.",
    {
        query: z.string().describe("Termo de busca (ex: 'Anacardium occidentale AND antioxidant')"),
        maxResults: z.number().default(20).describe("Máximo de resultados"),
        projectId: z.number().optional(),
        projectPath: z.string().optional(),
    },
    async (params) => {
        const guardrailError = await checkDesignGuardrail(params.projectId, params.projectPath);
        if (guardrailError) return { content: [{ type: "text", text: guardrailError }] };

        const { results, error } = await pubmedService.search(params.query, {
            maxResults: params.maxResults
        });

        if (error) {
            return { content: [{ type: "text", text: `Erro na busca PubMed: ${error}` }] };
        }

        // Resolve project for audit
        let projectId = params.projectId;
        if (!projectId && params.projectPath) {
            const project = await dbService.findProjectByPath(params.projectPath);
            if (project) projectId = project.id;
        }

        if (projectId) {
            await dbService.insertRecords(projectId, "pubmed", results);
            if (params.projectPath) appendRawRecords(params.projectPath, results, "database");
            await dbService.lockProject(projectId);
            await dbService.logAuditEvent({
                project_id: projectId,
                tool_name: "search_pubmed",
                action_type: "search",
                params: JSON.stringify(params),
                result_summary: `Busca PubMed: ${results.length} registros importados.`
            });
        }

        if (params.projectPath) {
            await logToLocalProject(params.projectPath, "search_pubmed", {
                query: params.query,
                found: results.length
            });
        }

        const summary = [
            `## Resultados PubMed: "${params.query}"`,
            `**Encontrados:** ${results.length}`,
            "",
            ...results.map((r, i) => [
                `### ${i + 1}. ${r.title}`,
                r.creators.length > 0 ? `**Autores:** ${r.creators.join("; ")}` : "",
                r.description ? `**Resumo:** ${r.description.slice(0, 300)}...` : "",
                r.date ? `**Data:** ${r.date}` : "",
                r.doi ? `**DOI:** [${r.doi}](https://doi.org/${r.doi})` : "",
                `**PMID:** ${r.identifier}`,
                `**URL:** ${r.url}`,
                "",
            ].filter(Boolean).join("\n"))
        ].join("\n");

        return {
            content: [{
                type: "text",
                text: summary // Return summary for easy reading
            }, {
                type: "text",
                text: JSON.stringify(results, null, 2) // Return JSON for processing
            }]
        };
    }
);

server.tool(
    "retrieve_fulltexts",
    "Verifica acesso aberto e baixa PDFs para o texto completo (F4.3).",
    {
        projectId: z.number().optional(),
        projectPath: z.string().describe("Caminho do projeto (ex: 'projects/data_mining/estado_arte_caju')"),
        datasetPath: z.string().optional(),
    },
    async (params) => {
        const projectDir = path.isAbsolute(params.projectPath) ? params.projectPath : path.join(process.cwd(), params.projectPath);
        const outputDir = path.join(projectDir, "03_screening/pdfs");
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        const inputPath = params.datasetPath || path.join(projectDir, "03_screening/audit_dataset_f4.json");
        if (!fs.existsSync(inputPath)) {
            return { content: [{ type: "text", text: `Dataset não encontrado: ${inputPath}` }] };
        }

        const dataContent = fs.readFileSync(inputPath, "utf-8");
        const data = JSON.parse(dataContent);
        const recordsToProcess = data.included || data;

        const stats = { found: 0, downloaded: 0, failed: 0 };
        const results: any[] = [];

        const batchSize = 10;
        for (let i = 0; i < recordsToProcess.length; i += batchSize) {
            const batch = recordsToProcess.slice(i, i + batchSize);
            const promises = batch.map(async (item: any) => {
                const r = item.record || item;
                const identifier = r.doi || r.identifier;

                let pdfUrl = r.pdfUrl;

                if (!pdfUrl && r.doi) {
                    try {
                        const unpayUrl = `https://api.unpaywall.org/v2/${encodeURIComponent(r.doi)}?email=reviewbr@prismaid.com`;
                        const res = await fetch(unpayUrl);
                        if (res.ok) {
                            const upData = await res.json();
                            pdfUrl = upData.best_oa_location?.url_for_pdf;
                        }
                    } catch (e) { }
                }

                if (!pdfUrl && r.repositoryId && r.repositoryId !== 'crossref' && r.repositoryId !== 'openalex') {
                    const repo = registry.getById(r.repositoryId);
                    if (repo) {
                        try {
                            pdfUrl = await strategy.findPdfUrl(repo, r.identifier);
                        } catch (e) { }
                    }
                }

                if (pdfUrl) {
                    stats.found++;
                    try {
                        const fileName = `${r.identifier.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
                        const filePath = path.join(outputDir, fileName);

                        const response = await fetch(pdfUrl);
                        if (response.ok) {
                            const buffer = await response.arrayBuffer();
                            fs.writeFileSync(filePath, Buffer.from(buffer));
                            stats.downloaded++;
                            r.pdfPath = filePath;
                        } else {
                            stats.failed++;
                        }
                    } catch (e) {
                        stats.failed++;
                    }
                }
                results.push(item);
            });
            await Promise.all(promises);
            fs.writeFileSync(inputPath, JSON.stringify({ ...data, included: results }, null, 2));
        }

        return {
            content: [{
                type: "text",
                text: `Processamento F4.3 concluído:\n- Encontrados links: ${stats.found}\n- Downloads realizados: ${stats.downloaded}\n- Falhas: ${stats.failed}\nLocal: ${outputDir}`
            }]
        };
    }
);

// ─── Legacy Tools ─────────────────────────────────────────────

server.tool(
    "search_repository",
    "Busca artigos/teses em repositórios acadêmicos. Usa OAI-PMH, DSpace REST ou scraping conforme disponibilidade.",
    {
        query: z.string().describe("Termo(s) de busca por tema (ex: 'bebida fermentada', 'inteligência artificial')"),
        repositories: z.array(z.string()).optional()
            .describe("IDs dos repos (ex: ['BR-FED-0001', 'BR-AGG-0001']). Omita para buscar em todos os ativos."),
        title: z.string().optional(),
        author: z.string().optional(),
        state: z.string().optional(),
        institutionType: z.enum(["federal", "estadual", "privada", "comunitaria", "instituto_federal"]).optional()
            .describe("Filtrar por tipo de instituição"),
        institution: z.string().optional(),
        degreeType: z.enum(["graduacao", "mestrado", "doutorado", "pos-doutorado", "livre-docencia"]).optional()
            .describe("Tipo de grau (mestrado, doutorado, etc.) — funciona em BDTD"),
        subjectArea: z.string().optional(),
        issn: z.string().optional(),
        dateFrom: z.string().optional(),
        dateUntil: z.string().optional(),
        maxResults: z.number().default(50).describe("Máximo de resultados por repositório"),
        projectId: z.number().optional(),
        projectPath: z.string().optional(),
    },
    async (params) => {
        const guardrailError = await checkDesignGuardrail(params.projectId, params.projectPath);
        if (guardrailError) return { content: [{ type: "text", text: guardrailError }] };

        let repos = registry.getActive();

        if (params.repositories && params.repositories.length > 0) {
            repos = params.repositories
                .map((id) => registry.getById(id))
                .filter((r): r is NonNullable<typeof r> => r !== undefined);
        } else {
            if (params.state) {
                repos = repos.filter((r) => r.institution.state.toUpperCase() === params.state!.toUpperCase());
            }
            if (params.institutionType) {
                repos = repos.filter((r) => r.institution.type === params.institutionType);
            }
        }

        if (repos.length === 0) {
            return { content: [{ type: "text", text: "Nenhum repositório encontrado com os filtros especificados." }] };
        }

        const allResults = [];
        const errors: string[] = [];

        for (const repo of repos) {
            try {
                const results = await strategy.search(repo, params.query, {
                    title: params.title,
                    author: params.author,
                    dateFrom: params.dateFrom,
                    dateUntil: params.dateUntil,
                    degreeType: params.degreeType,
                    institution: params.institution,
                    state: params.state,
                    subjectArea: params.subjectArea,
                    issn: params.issn,
                    maxResults: params.maxResults,
                });
                allResults.push(...results);
            } catch (error) {
                errors.push(`${repo.id} (${repo.institution.acronym}): ${(error as Error).message}`);
            }
        }

        // Resolve project for audit
        let projectId = params.projectId;
        if (!projectId && params.projectPath) {
            const project = await dbService.findProjectByPath(params.projectPath);
            if (project) projectId = project.id;
        }

        if (projectId) {
            await dbService.insertRecords(projectId, "repository", allResults);
            if (params.projectPath) appendRawRecords(params.projectPath, allResults, "database");
            await dbService.lockProject(projectId);
            await dbService.logAuditEvent({
                project_id: projectId,
                tool_name: "search_repository",
                action_type: "search",
                params: JSON.stringify(params),
                result_summary: `Busca Repositórios: ${allResults.length} registros importados.`
            });
        }

        if (params.projectPath) {
            await logToLocalProject(params.projectPath, "search_repository", {
                query: params.query,
                found: allResults.length,
                errors
            });
        }

        const summary = [
            `## Resultados da Busca: "${params.query}"`,
            `**Repositórios consultados:** ${repos.length}`,
            `**Resultados encontrados:** ${allResults.length}`,
            errors.length > 0 ? `**Erros:** ${errors.length}\n${errors.map((e) => `- ${e}`).join("\n")}` : "",
            "",
            ...allResults.map((r, i) => [
                `### ${i + 1}. ${r.title}`,
                r.creators.length > 0 ? `**Autores:** ${r.creators.join("; ")}` : "",
                r.description ? `**Resumo:** ${r.description.slice(0, 300)}${r.description.length > 300 ? "..." : ""}` : "",
                r.date ? `**Data:** ${r.date}` : "",
                r.doi ? `**DOI:** [${r.doi}](https://doi.org/${r.doi})` : "",
                r.journal ? `**Periódico:** ${r.journal}${r.issn ? ` (ISSN: ${r.issn})` : ""}` : "",
                r.degreeType ? `**Tipo:** ${r.degreeType}` : "",
                r.institution ? `**Instituição:** ${r.institution}${r.state ? ` (${r.state})` : ""}` : "",
                r.subjectAreas?.length ? `**Áreas:** ${r.subjectAreas.join(", ")}` : "",
                `**Repositório:** ${r.repositoryName}`,
                `**URL:** ${r.url}`,
                r.pdfUrl ? `**PDF:** ${r.pdfUrl}` : "",
                `**Método:** ${r.accessMethod}`,
                "",
            ].filter(Boolean).join("\n")),
        ].filter(Boolean).join("\n");

        return { content: [{ type: "text", text: summary }] };
    }
);

server.tool(
    "get_record_metadata",
    "Obtém metadados completos (Dublin Core) de um registro específico em um repositório.",
    {
        repositoryId: z.string().describe("ID do repositório (ex: 'BR-FED-0001')"),
        recordIdentifier: z.string()
            .describe("Identificador OAI ou URL/handle do registro (ex: 'oai:repositorio.ufba.br:ri/36884' ou 'https://repositorio.ufba.br/handle/ri/36884')"),
    },
    async (params) => {
        const repo = registry.getById(params.repositoryId);
        if (!repo) {
            return { content: [{ type: "text", text: `Repositório ${params.repositoryId} não encontrado.` }] };
        }

        const metadata = await strategy.getMetadata(repo, params.recordIdentifier);
        return {
            content: [{
                type: "text",
                text: JSON.stringify(metadata, null, 2),
            }],
        };
    }
);

server.tool(
    "harvest_records",
    "Coleta registros em massa via OAI-PMH de um repositório específico. Ideal para harvesting completo ou por coleção.",
    {
        repositoryId: z.string().describe("ID do repositório"),
        set: z.string().optional(),
        dateFrom: z.string().optional(),
        dateUntil: z.string().optional(),
        maxRecords: z.number().default(100).describe("Máximo de registros a coletar"),
        metadataPrefix: z.string().default("oai_dc").describe("Formato de metadados"),
    },
    async (params) => {
        const guardrailError = await checkDesignGuardrail(undefined, undefined);
        if (guardrailError) return { content: [{ type: "text", text: guardrailError }] };

        const repo = registry.getById(params.repositoryId);
        if (!repo) {
            return { content: [{ type: "text", text: `Repositório ${params.repositoryId} não encontrado.` }] };
        }

        if (!repo.access.oaiPmh.available || !repo.access.oaiPmh.endpoint) {
            return { content: [{ type: "text", text: `Repositório ${params.repositoryId} não tem OAI-PMH disponível. Use search_repository como alternativa.` }] };
        }

        const oai = strategy.getOaiClient();
        const records = await oai.listAllRecords(repo.access.oaiPmh.endpoint, {
            set: params.set,
            from: params.dateFrom,
            until: params.dateUntil,
            metadataPrefix: params.metadataPrefix,
            maxRecords: params.maxRecords,
        });

        const summary = [
            `## Harvest: ${repo.repository.name}`,
            `**Registros coletados:** ${records.length}`,
            "",
            ...records.slice(0, 20).map((r, i) => [
                `### ${i + 1}. ${r.metadata.title[0] ?? "(sem título)"}`,
                r.metadata.creator.length > 0 ? `**Autores:** ${r.metadata.creator.join("; ")}` : "",
                r.metadata.date[0] ? `**Data:** ${r.metadata.date[0]}` : "",
                `**ID:** ${r.identifier}`,
                "",
            ].filter(Boolean).join("\n")),
            records.length > 20 ? `\n... e mais ${records.length - 20} registros (use maxRecords para controlar)` : "",
        ].join("\n");

        return { content: [{ type: "text", text: summary }] };
    }
);

server.tool(
    "validate_repository",
    "Verifica a saúde e capacidades de um ou mais repositórios (conectividade, OAI-PMH, REST API).",
    {
        repositoryId: z.string().optional()
            .describe("ID específico ou omita para validar todos os ativos"),
        checks: z.array(z.enum(["connectivity", "oai_pmh", "rest_api", "search"]))
            .default(["connectivity", "oai_pmh"])
            .describe("Tipos de verificação a executar"),
    },
    async (params) => {
        const repos = params.repositoryId
            ? [registry.getById(params.repositoryId)].filter(Boolean) as NonNullable<ReturnType<Registry['getById']>>[]
            : registry.getActive();

        if (repos.length === 0) {
            return { content: [{ type: "text", text: "Nenhum repositório encontrado." }] };
        }

        const oai = strategy.getOaiClient();
        const rest = strategy.getRestClient();
        const results: string[] = [];

        for (const repo of repos) {
            const checks: string[] = [];

            // Connectivity
            if (params.checks.includes("connectivity")) {
                const start = Date.now();
                try {
                    const res = await fetch(repo.repository.url, {
                        signal: AbortSignal.timeout(10_000),
                    });
                    checks.push(`✅ Conectividade: HTTP ${res.status} (${Date.now() - start}ms)`);
                } catch (e) {
                    checks.push(`❌ Conectividade: ${(e as Error).message}`);
                }
            }

            // OAI-PMH
            if (params.checks.includes("oai_pmh") && repo.access.oaiPmh.endpoint) {
                const start = Date.now();
                try {
                    const identify = await oai.identify(repo.access.oaiPmh.endpoint);
                    checks.push(`✅ OAI-PMH: ${identify.repositoryName} (${Date.now() - start}ms)`);
                } catch (e) {
                    checks.push(`❌ OAI-PMH: ${(e as Error).message}`);
                }
            } else if (params.checks.includes("oai_pmh")) {
                checks.push("⏭️ OAI-PMH: sem endpoint configurado");
            }

            // REST API
            if (params.checks.includes("rest_api")) {
                const start = Date.now();
                const works = await rest.detect(repo.repository.url);
                if (works) {
                    checks.push(`✅ REST API: DSpace 7 detectado (${Date.now() - start}ms)`);
                } else {
                    checks.push(`❌ REST API: não detectado (${Date.now() - start}ms)`);
                }
            }

            // Search
            if (params.checks.includes("search")) {
                const start = Date.now();
                try {
                    const searchResults = await strategy.search(repo, "teste", { maxResults: 1 });
                    checks.push(`✅ Busca: ${searchResults.length > 0 ? "funcional" : "sem resultados"} (${Date.now() - start}ms)`);
                } catch (e) {
                    checks.push(`❌ Busca: ${(e as Error).message}`);
                }
            }

            results.push([
                `### ${repo.institution.acronym} — ${repo.repository.name}`,
                `**ID:** ${repo.id} | **URL:** ${repo.repository.url}`,
                ...checks,
            ].join("\n"));
        }

        return {
            content: [{
                type: "text",
                text: `# Relatório de Validação\n\n${results.join("\n\n---\n\n")}`,
            }],
        };
    }
);

server.tool(
    "plan_research_protocol",
    "Planeja um novo projeto de pesquisa, registra no banco central e cria a estrutura de pastas. CONVENÇÃO CANÔNICA (não pergunte ao usuário — use direto): todo projeto vive em '<raiz-do-repo>/reviewbr/projects/<nome-do-projeto>'. NUNCA crie projetos dentro de 'reviewbr/reviewbr-mcp/' (isso é código do servidor, não dado — reviewbr-mcp/projects/ é local legado, não usar).",
    {
        name: z.string().describe("Nome do projeto"),
        userId: z.string().describe("ID do usuário"),
        topic: z.string().describe("Tema/Objetivo da pesquisa"),
        researchType: z.enum([
            "systematic_review",
            "scoping_review",
            "integrative_review",
            "meta_analysis",
            "rapid_review",
            "exploratory"
        ]).describe("Tipo de pesquisa"),
        projectPath: z.string().describe("Caminho ONDE o projeto será criado. CONVENÇÃO FIXA: '<raiz-do-repo>/reviewbr/projects/<nome-do-projeto>' (ex: 'reviewbr/projects/bebidas_maca_do_coco'). Nunca dentro de reviewbr-mcp/."),
    },
    async (params) => {
        const projectId = await projectInitService.register(params as any, dbService);
        const result = await projectInitService.initializeWorkspace(projectId, params.projectPath, dbService);

        return {
            content: [{
                type: "text",
                text: `Projeto criado com sucesso!\nID: ${result.projectId}\nProtocolo: ${result.protocolPath}\nTipo: ${params.researchType}`
            }]
        };
    }
);

server.tool(
    "submit_protocol_for_approval",
    "Audita o 'protocol.md' (na raiz do projeto) e, se aprovado, TRAVA o protocolo ([LOCKED]) liberando a fase de mineração. Somente após aprovação as buscas oficiais podem ser feitas (RV-01).",
    {
        projectId: z.number().optional(),
        projectPath: z.string().describe("Caminho da raiz do projeto (onde está o 'protocol.md')"),
    },
    async (params) => {
        let projectId = params.projectId;
        if (!projectId && params.projectPath) {
            const project = await dbService.findProjectByPath(params.projectPath);
            if (project) projectId = project.id;
        }

        const projectDir = path.isAbsolute(params.projectPath) ? params.projectPath : path.join(process.cwd(), params.projectPath);
        const protocolPath = path.join(projectDir, "protocol.md");

        if (!fs.existsSync(protocolPath)) {
            return { content: [{ type: "text", text: `Erro: protocol.md não encontrado em ${projectDir}. Crie o projeto com plan_research_protocol primeiro.` }] };
        }

        const audit = protocolAuditor.auditFile(protocolPath);

        if (audit.valid) {
            // Trava o protocolo NO ARQUIVO ([DRAFT] → [LOCKED])
            let content = fs.readFileSync(protocolPath, "utf-8");
            content = /\[DRAFT\]/.test(content)
                ? content.replace(/\[DRAFT\]/g, "[LOCKED]")
                : content.replace(/^# /, "**Status**: [LOCKED]\n\n# ");
            fs.writeFileSync(protocolPath, content, "utf-8");

            // Estado on-disk = fonte da verdade
            ProjectStateService.patch(projectDir, { status: "LOCKED", phase: "F2" });

            // SQLite como cache/auditoria (não obrigatório)
            if (projectId) {
                await dbService.activateProject(projectId, params.projectPath);
                await dbService.logAuditEvent({
                    project_id: projectId,
                    tool_name: "submit_protocol_for_approval",
                    action_type: "protocol_approval",
                    params: JSON.stringify(params),
                    result_summary: `Protocolo APROVADO (${audit.score}/${audit.maxScore}). [LOCKED].`
                });
            }

            return {
                content: [{
                    type: "text",
                    text: `✅ SUCESSO! Protocolo aprovado (${audit.score}/${audit.maxScore}) e TRAVADO ([LOCKED]). As buscas oficiais estão liberadas.`
                }]
            };
        } else {
            return {
                content: [{
                    type: "text",
                    text: `❌ REPROVADO! O protocolo falhou na auditoria (Nota: ${audit.score}/${audit.maxScore}). Corrija o 'protocol.md' e tente novamente.\n\nErros pendentes:\n${audit.errors.join('\n')}\n\nSugestões:\n${audit.suggestions.join('\n')}`
                }]
            };
        }
    }
);

// ─── Verification Tools ─────────────────────────────────────────

server.tool(
    "validate_prisma_flow",
    "Valida matematicamente a consistência do Fluxograma PRISMA (Regra RV-05).",
    {
        flowData: z.string().describe("JSON string contendo os 10 campos obrigatórios do PRISMA Flow (ex: identified_db, screened, etc)"),
    },
    async (params) => {
        let data;
        try {
            data = JSON.parse(params.flowData);
        } catch (e) {
            return { content: [{ type: "text", text: "Erro ao fazer parse do JSON." }] };
        }

        const parseResult = PrismaFlowSchema.safeParse(data);
        if (!parseResult.success) {
            return {
                content: [{
                    type: "text",
                    text: `Estrutura JSON inválida. Faltam campos obrigatórios ou valores não são numéricos:\n${parseResult.error.message}`
                }]
            };
        }

        const validator = new PrismaFlowValidator();
        const validation = validator.validate(parseResult.data);

        return {
            content: [{
                type: "text",
                text: JSON.stringify(validation, null, 2)
            }]
        };
    }
);

server.tool(
    "compute_flow_counts",
    "Deriva o Fluxograma PRISMA (F8.1) a partir dos ARTEFATOS reais do projeto (Regra RV-02: os números emergem do processo, nunca são digitados). Conta os arquivos canônicos, aplica as identidades PRISMA, valida a aritmética (RV-05), faz checagem cruzada de 'included' e sinaliza edições manuais no prisma_flow.json. Grava o arquivo recomputado quando write=true.",
    {
        projectPath: z.string().describe("Caminho (absoluto ou relativo ao cwd) da raiz do projeto de revisão"),
        write: z.boolean().optional().describe("Se true (padrão), grava o prisma_flow.json recomputado; se false, apenas retorna o cálculo"),
    },
    async (params) => {
        const projectDir = path.isAbsolute(params.projectPath)
            ? params.projectPath
            : path.join(process.cwd(), params.projectPath);

        if (!fs.existsSync(projectDir)) {
            return { content: [{ type: "text", text: `Erro: diretório do projeto não encontrado: ${projectDir}` }] };
        }

        const computer = new FlowComputer();
        const result = computer.compute(projectDir);

        const shouldWrite = params.write !== false;
        if (shouldWrite) computer.writeFlow(projectDir, result.computed);

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    ...result,
                    written: shouldWrite ? "prisma_flow.json atualizado" : "não gravado (write=false)",
                }, null, 2),
            }],
        };
    }
);

// ─── Leitura/RAG do corpus curado (F5.5) ──────────────────────

server.tool(
    "rag_index_corpus",
    "Indexa o corpus curado (textos completos dos estudos incluídos) para leitura orientada a objetivo (F5.5). Retriever léxico BM25, 100% local. Cada trecho carrega proveniência (study_id, fonte, url) para citação rastreável (RV-08). Grava rag/index.json. Só indexa .txt/.md — PDFs precisam ser extraídos antes.",
    {
        projectPath: z.string().describe("Caminho (absoluto ou relativo ao cwd) da raiz do projeto"),
        corpusDir: z.string().optional().describe("Subpasta do corpus (padrão tenta 04_extraction/fulltext, 03_screening/fulltext, 03_screening/pdfs)"),
    },
    async (params) => {
        const projectDir = path.isAbsolute(params.projectPath) ? params.projectPath : path.join(process.cwd(), params.projectPath);
        try {
            const r = indexCorpus(projectDir, params.corpusDir);
            const warn = r.indexed === 0
                ? `\n\n⚠️ Nenhum texto indexado. ${r.skippedPdfsOnly > 0 ? `Há ${r.skippedPdfsOnly} PDF(s) que precisam ser extraídos para texto antes (o corpus RAG lê .txt/.md).` : ""}`
                : "";
            const provWarn = r.missingProvenance.length > 0
                ? `\n\n⚠️ ${r.missingProvenance.length} estudo(s) sem proveniência completa (RV-08): ${r.missingProvenance.slice(0, 10).join(", ")}`
                : "";
            return { content: [{ type: "text", text: JSON.stringify(r, null, 2) + warn + provWarn }] };
        } catch (e: any) {
            return { content: [{ type: "text", text: `Erro ao indexar corpus: ${e.message}` }] };
        }
    }
);

server.tool(
    "rag_query",
    "Recupera os trechos mais relevantes do corpus indexado para uma pergunta (F5.5), com proveniência rastreável. NÃO redige resposta nem sintetiza — só recupera (RV-06); a síntese/citação é do agente.",
    {
        projectPath: z.string().describe("Caminho (absoluto ou relativo ao cwd) da raiz do projeto"),
        question: z.string().describe("A subpergunta a recuperar"),
        topK: z.number().optional().describe("Número de trechos a retornar (padrão 8)"),
    },
    async (params) => {
        const projectDir = path.isAbsolute(params.projectPath) ? params.projectPath : path.join(process.cwd(), params.projectPath);
        try {
            const hits = queryCorpus(projectDir, params.question, params.topK ?? 8);
            return { content: [{ type: "text", text: JSON.stringify(hits, null, 2) }] };
        } catch (e: any) {
            return { content: [{ type: "text", text: `Erro na consulta RAG: ${e.message}` }] };
        }
    }
);

// ─── BYOS: recuperação via Sci-Hub (opt-in, nunca automático) ─
server.tool(
    "retrieve_fulltext_byos",
    "BYOS (opt-in): recupera o texto completo via Sci-Hub para um DOI quando o acesso aberto FALHOU. SÓ chame após 'sim' EXPLÍCITO do pesquisador — NUNCA automático. Salva o PDF em 03_screening/pdfs e o texto em 04_extraction/fulltext com proveniência 'Sci-Hub (BYOS)' registrada de forma separável. Requer python + plugins/scihub_extractor.py.",
    {
        doi: z.string().describe("DOI do artigo (ex: 10.1590/xyz)"),
        projectPath: z.string().describe("Raiz do projeto"),
    },
    async (params) => {
        const r = await scihubBridge.retrieveByDoi(params.doi, params.projectPath);
        if (params.projectPath) {
            await logToLocalProject(params.projectPath, "retrieve_fulltext_byos", {
                doi: params.doi, success: r.success, acquisition: "BYOS", error: r.error,
            });
        }
        return {
            content: [{
                type: "text",
                text: r.success
                    ? `✅ BYOS: full-text de ${params.doi} arquivado (PDF em 03_screening/pdfs, texto em 04_extraction/fulltext; proveniência: Sci-Hub/BYOS, registrada separadamente).` + (r.error ? `\n⚠️ ${r.error}` : "")
                    : `❌ BYOS falhou para ${params.doi}: ${r.error}`,
            }]
        };
    }
);

const openAlexHandler = async (params: any) => {
    const guardrailError = await checkDesignGuardrail(params.projectId, params.projectPath);
    if (guardrailError) return { content: [{ type: "text", text: guardrailError }] };

    // Resolve project for audit
    let projectId = params.projectId;
    if (!projectId && params.projectPath) {
        const project = await dbService.findProjectByPath(params.projectPath);
        if (project) projectId = project.id;
    }

    const { results, totalFound, error } = await snowballService.search(params.query, {
        maxResults: params.maxResults || 200
    });

    if (error) {
        return { content: [{ type: "text", text: `⚠️ **OpenAlex — lacuna de cobertura (não silenciosa):** ${error}` }] };
    }

    // Audit results
    await dbService.logAuditEvent({
        project_id: projectId,
        tool_name: "search_openalex",
        action_type: "search",
        params: JSON.stringify(params),
        result_summary: `Busca OpenAlex: ${results.length} artigos encontrados (${totalFound} total).`
    });

    // Local User Log & File Save
    if (params.projectPath) {
        await logToLocalProject(params.projectPath, "search_openalex", {
            query: params.query,
            found: results.length,
            totalFound,
            params
        });

        // Auto-save result set to 01_raw
        try {
            const { default: path } = await import("node:path");
            const { default: fs } = await import("node:fs");
            const rawDir = path.join(process.cwd(), params.projectPath, "01_raw");
            if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace("T", "_");
            const outputPath = path.join(rawDir, `dataset_openalex_${timestamp}.json`);
            fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        } catch (saveError) {
            console.error("Failed to auto-save OpenAlex results:", saveError);
        }
    }

    const summary = [
        `## Resultados OpenAlex: "${params.query}"`,
        `**Total encontrado na base:** ${totalFound}`,
        `**Retornados nesta página:** ${results.length}`,
        "",
        ...results.slice(0, 10).map((r: any, i: number) => [
            `### ${i + 1}. ${r.title}`,
            r.creators.length > 0 ? `**Autores:** ${r.creators.join("; ")}` : "",
            r.date ? `**Data:** ${r.date}` : "",
            r.doi ? `**DOI:** ${r.doi}` : "",
            `**URL:** ${r.url}`,
            "",
        ].filter(Boolean).join("\n")),
        results.length > 10 ? `\n... e mais ${results.length - 10} resultados salvos no arquivo JSON.` : "",
    ].join("\n");

    return { content: [{ type: "text", text: summary }] };
};

const crossrefHandler = async (params: any) => {
    const guardrailError = await checkDesignGuardrail(params.projectId, params.projectPath);
    if (guardrailError) return { content: [{ type: "text", text: guardrailError }] };

    // Resolve project for audit
    let projectId = params.projectId;
    if (!projectId && params.projectPath) {
        const project = await dbService.findProjectByPath(params.projectPath);
        if (project) projectId = project.id;
    }

    const { results, totalFound } = await crossrefService.search(params.query, {
        maxResults: params.maxResults || 200
    });

    // Audit results
    await dbService.logAuditEvent({
        project_id: projectId,
        tool_name: "search_crossref",
        action_type: "search",
        params: JSON.stringify(params),
        result_summary: `Busca Crossref: ${results.length} artigos encontrados (${totalFound} total).`
    });

    // Local User Log & File Save
    if (params.projectPath) {
        await logToLocalProject(params.projectPath, "search_crossref", {
            query: params.query,
            found: results.length,
            totalFound,
            params
        });

        // Auto-save result set to 01_raw
        try {
            const { default: path } = await import("node:path");
            const { default: fs } = await import("node:fs");
            const rawDir = path.join(process.cwd(), params.projectPath, "01_raw");
            if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace("T", "_");
            const outputPath = path.join(rawDir, `dataset_crossref_${timestamp}.json`);
            fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        } catch (saveError) {
            console.error("Failed to auto-save Crossref results:", saveError);
        }
    }

    const summary = [
        `## Resultados Crossref: "${params.query}"`,
        `**Total encontrado na base:** ${totalFound}`,
        `**Retornados nesta página:** ${results.length}`,
        "",
        ...results.slice(0, 10).map((r: any, i: number) => [
            `### ${i + 1}. ${r.title}`,
            r.creators.length > 0 ? `**Autores:** ${r.creators.join("; ")}` : "",
            r.date ? `**Data:** ${r.date}` : "",
            r.doi ? `**DOI:** ${r.doi}` : "",
            `**URL:** ${r.url}`,
            "",
        ].filter(Boolean).join("\n")),
        results.length > 10 ? `\n... e mais ${results.length - 10} resultados salvos no arquivo JSON.` : "",
    ].join("\n");

    return { content: [{ type: "text", text: summary }] };
};

const scieloHandler = async (params: any) => {
    const guardrailError = await checkDesignGuardrail(params.projectId, params.projectPath);
    if (guardrailError) return { content: [{ type: "text", text: guardrailError }] };

    let projectId = params.projectId;
    if (!projectId && params.projectPath) {
        const project = await dbService.findProjectByPath(params.projectPath);
        if (project) projectId = project.id;
    }

    // P4310312277 is the OpenAlex Publisher ID for SciELO
    const { results, totalFound, error } = await snowballService.search(params.query, {
        maxResults: params.maxResults || 200,
        filter: "primary_location.source.publisher_lineage:P4310312277"
    });

    if (error) {
        return { content: [{ type: "text", text: `⚠️ **SciELO (via OpenAlex) — lacuna de cobertura:** ${error}` }] };
    }

    results.forEach(r => {
        r.repositoryId = "scielo";
        r.repositoryName = "SciELO (via OpenAlex)";
    });

    await dbService.logAuditEvent({
        project_id: projectId,
        tool_name: "search_scielo",
        action_type: "search",
        params: JSON.stringify(params),
        result_summary: `Busca SciELO: ${results.length} artigos encontrados (${totalFound} total).`
    });

    if (params.projectPath) {
        await logToLocalProject(params.projectPath, "search_scielo", {
            query: params.query,
            found: results.length,
            totalFound,
            params
        });

        try {
            const { default: path } = await import("node:path");
            const { default: fs } = await import("node:fs");
            const rawDir = path.join(process.cwd(), params.projectPath, "01_raw");
            if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace("T", "_");
            const outputPath = path.join(rawDir, `dataset_scielo_${timestamp}.json`);
            fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        } catch (saveError) {
            console.error("Failed to auto-save SciELO results:", saveError);
        }
    }

    const summary = [
        `## Resultados SciELO: "${params.query}"`,
        `**Total encontrado na base:** ${totalFound}`,
        `**Retornados nesta página:** ${results.length}`,
        "",
        ...results.slice(0, 10).map((r: any, i: number) => [
            `### ${i + 1}. ${r.title}`,
            r.creators.length > 0 ? `**Autores:** ${r.creators.join("; ")}` : "",
            r.date ? `**Data:** ${r.date}` : "",
            `**URL:** ${r.url}`,
            "",
        ].filter(Boolean).join("\n")),
        results.length > 10 ? `\n... e mais ${results.length - 10} resultados salvos no arquivo JSON.` : "",
    ].join("\n");

    return { content: [{ type: "text", text: summary }] };
};

const semanticScholarHandler = async (params: any) => {
    const guardrailError = await checkDesignGuardrail(params.projectId, params.projectPath);
    if (guardrailError) return { content: [{ type: "text", text: guardrailError }] };

    let projectId = params.projectId;
    if (!projectId && params.projectPath) {
        const project = await dbService.findProjectByPath(params.projectPath);
        if (project) projectId = project.id;
    }

    const { results, totalFound } = await semanticScholarService.search(params.query, {
        maxResults: params.maxResults || 200
    });

    if (projectId) {
        await dbService.logAuditEvent({
            project_id: projectId,
            tool_name: "search_semanticscholar",
            action_type: "search",
            params: JSON.stringify(params),
            result_summary: `Busca SemanticScholar: ${results.length} artigos encontrados (${totalFound} total).`
        });
    }

    if (params.projectPath) {
        await logToLocalProject(params.projectPath, "search_semanticscholar", {
            query: params.query,
            found: results.length,
            totalFound,
            params
        });

        if (projectId) { // Only save raw files if it is not a preview run
            try {
                const { default: path } = await import("node:path");
                const { default: fs } = await import("node:fs");
                const rawDir = path.join(process.cwd(), params.projectPath, "01_raw");
                if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace("T", "_");
                const outputPath = path.join(rawDir, `dataset_semanticscholar_${timestamp}.json`);
                fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
            } catch (saveError) {
                console.error("Failed to auto-save SemanticScholar results:", saveError);
            }
        }
    }

    const summary = [
        `## Resultados Semantic Scholar (Open Access): "${params.query}"`,
        `**Total encontrado na base:** ${totalFound}`,
        `**Retornados nesta página:** ${results.length}`,
        "",
        ...results.slice(0, 10).map((r: any, i: number) => [
            `### ${i + 1}. ${r.title}`,
            r.creators.length > 0 ? `**Autores:** ${r.creators.join("; ")}` : "",
            r.date ? `**Data:** ${r.date}` : "",
            `**URL do PDF:** ${r.url}`, // Highlight the direct PDF access
            "",
        ].filter(Boolean).join("\n")),
        results.length > 10 ? `\n... e mais ${results.length - 10} resultados salvos no arquivo JSON.` : "",
    ].join("\n");

    return { content: [{ type: "text", text: summary }] };
};

const coreHandler = async (params: any) => {
    const guardrailError = await checkDesignGuardrail(params.projectId, params.projectPath);
    if (guardrailError) return { content: [{ type: "text", text: guardrailError }] };

    let projectId = params.projectId;
    if (!projectId && params.projectPath) {
        const project = await dbService.findProjectByPath(params.projectPath);
        if (project) projectId = project.id;
    }

    const { results, totalFound } = await coreService.search(params.query, {
        maxResults: params.maxResults || 200
    });

    if (projectId) {
        await dbService.logAuditEvent({
            project_id: projectId,
            tool_name: "search_core",
            action_type: "search",
            params: JSON.stringify(params),
            result_summary: `Busca CORE: ${results.length} artigos encontrados (${totalFound} total).`
        });
    }

    if (params.projectPath) {
        await logToLocalProject(params.projectPath, "search_core", {
            query: params.query,
            found: results.length,
            totalFound,
            params
        });

        if (projectId) {
            try {
                const { default: path } = await import("node:path");
                const { default: fs } = await import("node:fs");
                const rawDir = path.join(process.cwd(), params.projectPath, "01_raw");
                if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace("T", "_");
                const outputPath = path.join(rawDir, `dataset_core_${timestamp}.json`);
                fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
            } catch (saveError) {
                console.error("Failed to auto-save CORE results:", saveError);
            }
        }
    }

    const summary = [
        `## Resultados CORE (Open Access): "${params.query}"`,
        `**Total encontrado na base:** ${totalFound}`,
        `**Retornados nesta página:** ${results.length}`,
        "",
        ...results.slice(0, 10).map((r: any, i: number) => [
            `### ${i + 1}. ${r.title}`,
            r.creators.length > 0 ? `**Autores:** ${r.creators.join("; ")}` : "",
            r.date ? `**Data:** ${r.date}` : "",
            `**URL do PDF:** ${r.url}`,
            "",
        ].filter(Boolean).join("\n")),
        results.length > 10 ? `\n... e mais ${results.length - 10} resultados salvos no arquivo JSON.` : "",
    ].join("\n");

    return { content: [{ type: "text", text: summary }] };
};

const europePmcHandler = async (params: any) => {
    const guardrailError = await checkDesignGuardrail(params.projectId, params.projectPath);
    if (guardrailError) return { content: [{ type: "text", text: guardrailError }] };

    let projectId = params.projectId;
    if (!projectId && params.projectPath) {
        const project = await dbService.findProjectByPath(params.projectPath);
        if (project) projectId = project.id;
    }

    const { results, totalFound } = await europePmcService.search(params.query, {
        maxResults: params.maxResults || 200
    });

    if (projectId) {
        await dbService.logAuditEvent({
            project_id: projectId,
            tool_name: "search_europe_pmc",
            action_type: "search",
            params: JSON.stringify(params),
            result_summary: `Busca Europe PMC: ${results.length} artigos encontrados (${totalFound} total).`
        });
    }

    if (params.projectPath) {
        await logToLocalProject(params.projectPath, "search_europe_pmc", {
            query: params.query,
            found: results.length,
            totalFound,
            params
        });

        if (projectId) {
            try {
                const { default: path } = await import("node:path");
                const { default: fs } = await import("node:fs");
                const rawDir = path.join(process.cwd(), params.projectPath, "01_raw");
                if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace("T", "_");
                const outputPath = path.join(rawDir, `dataset_europe_pmc_${timestamp}.json`);
                fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
            } catch (saveError) {
                console.error("Failed to auto-save Europe PMC results:", saveError);
            }
        }
    }

    const summary = [
        `## Resultados Europe PMC (Open Access): "${params.query}"`,
        `**Total encontrado na base:** ${totalFound}`,
        `**Retornados nesta página:** ${results.length}`,
        "",
        ...results.slice(0, 10).map((r: any, i: number) => [
            `### ${i + 1}. ${r.title}`,
            r.creators.length > 0 ? `**Autores:** ${r.creators.join("; ")}` : "",
            r.date ? `**Data:** ${r.date}` : "",
            `**URL:** ${r.url}`,
            r.pdfUrl ? `**PDF Direto:** ${r.pdfUrl}` : "",
            "",
        ].filter(Boolean).join("\n")),
        results.length > 10 ? `\n... e mais ${results.length - 10} resultados salvos no arquivo JSON.` : "",
    ].join("\n");

    return { content: [{ type: "text", text: summary }] };
};

server.tool(
    "search_europe_pmc",
    "Busca artigos no Europe PMC, excelente repositório de ciências da vida e biomedicina.",
    {
        query: z.string().describe("Termo de busca (ex: 'dengue OR zika')"),
        maxResults: z.number().default(200).describe("Máximo de resultados (default: 200)"),
        projectId: z.number().optional(),
        projectPath: z.string().optional(),
    },
    europePmcHandler as any
);

server.tool(
    "search_core",
    "Busca artigos no CORE (core.ac.uk), o maior agregador mundial de repositórios Open Access.",
    {
        query: z.string().describe("Termo de busca (ex: 'quantum OR computadores')"),
        maxResults: z.number().default(200).describe("Máximo de resultados (default: 200)"),
        projectId: z.number().optional(),
        projectPath: z.string().optional(),
    },
    coreHandler as any
);

server.tool(
    "search_openalex",
    "Busca artigos diretamente no OpenAlex (Multidisciplinar). Ideal para construir listas mestras.",
    {
        query: z.string().describe("Termo de busca (ex: 'cashew OR Anacardium occidentale')"),
        maxResults: z.number().default(200).describe("Máximo de resultados (default: 200)"),
        projectId: z.number().optional(),
        projectPath: z.string().optional(),
    },
    openAlexHandler as any
);

server.tool(
    "search_crossref",
    "Busca artigos diretamente no Crossref (Multidisciplinar). Focado em metadados de DOIs.",
    {
        query: z.string().describe("Termo de busca"),
        maxResults: z.number().default(200).describe("Máximo de resultados"),
        projectId: z.number().optional(),
        projectPath: z.string().optional(),
    },
    crossrefHandler as any
);

server.tool(
    "search_scielo",
    "Busca artigos no SciELO (Scientific Electronic Library Online). Foco exclusivo na América Latina (Open Science).",
    {
        query: z.string().describe("Termo de busca para o SciELO (ex: 'dengue OR zika')"),
        maxResults: z.number().default(200).describe("Máximo de resultados (default: 200)"),
        projectId: z.number().optional(),
        projectPath: z.string().optional(),
    },
    scieloHandler as any
);

server.tool(
    "search_semanticscholar",
    "Busca artigos no Semantic Scholar. Utiliza IA para agregar artigos com **Acesso Aberto (PDFs diretos)**.",
    {
        query: z.string().describe("Termo de busca para o Semantic Scholar"),
        maxResults: z.number().default(200).describe("Máximo de resultados (default: 200, limite físico: 100 por chamada)"),
        projectId: z.number().optional(),
        projectPath: z.string().optional(),
    },
    semanticScholarHandler as any
);

// ─── Audit Tool ───────────────────────────────────────────────

server.tool(
    "audit_methodology",
    "Audita a conformidade metodológica de uma pesquisa já concluída (Post-Hoc Validation). NÃO busca, baixa ou gera dados novos. Apenas diagnostica.",
    {
        dataset: z.string().describe("JSON string com array de registros submetidos (SearchResult[])"),
        searchTermsUsed: z.string().optional().describe("String de busca completa utilizada pelo pesquisador (com operadores booleanos)"),
        prismaFlowData: z.string().optional().describe("JSON string com os 10 campos numéricos do PRISMA Flow (identified_db, screened, included, etc)"),
        projectPath: z.string().optional().describe("Caminho do projeto de auditoria (ex: projects/user/audit_minha_tese)"),
    },
    async (params) => {
        let records;
        try {
            records = JSON.parse(params.dataset);
        } catch (e) {
            return { content: [{ type: "text", text: "Erro ao fazer parse do JSON do dataset." }] };
        }

        let prismaFlow = undefined;
        if (params.prismaFlowData) {
            try {
                const parsed = JSON.parse(params.prismaFlowData);
                const validate = PrismaFlowSchema.safeParse(parsed);
                if (validate.success) prismaFlow = validate.data;
            } catch (e) { /* silently ignore malformed prisma data */ }
        }

        const report = auditorService.audit({
            dataset: records,
            searchTermsUsed: params.searchTermsUsed,
            prismaFlowData: prismaFlow,
        });

        // Save the conformity report to disk if projectPath is provided
        if (params.projectPath) {
            try {
                const reportDir = path.join(process.cwd(), params.projectPath, "audit_report");
                if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
                const reportPath = path.join(reportDir, "conformity_report.md");
                fs.writeFileSync(reportPath, report.markdownReport, "utf-8");
            } catch (e) {
                console.error("Failed to save audit report:", e);
            }
        }

        return {
            content: [{
                type: "text",
                text: report.markdownReport
            }]
        };
    }
);

// ─── Screening Metrics Tool ───────────────────────────────────

server.tool(
    "get_screening_report",
    "Gera relatório de métricas de triagem com análise de saturação (Stopping Rule). Leitura pura — NUNCA modifica dados. Use após cada batch de triagem para avaliar se a triagem pode ser encerrada.",
    {
        projectId: z.number().describe("ID do projeto"),
        batchSize: z.number().optional().describe("Tamanho do batch para análise (default: 20)"),
        projectPath: z.string().optional().describe("Caminho do projeto para salvar relatório"),
    },
    async (params) => {
        const report = await screeningMetricsService.generateReport(
            dbService,
            params.projectId,
            params.batchSize
        );

        // Save report to disk if projectPath is provided
        if (params.projectPath) {
            try {
                const reportDir = path.join(
                    path.isAbsolute(params.projectPath) ? params.projectPath : path.join(process.cwd(), params.projectPath),
                    "03_screening"
                );
                if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
                const reportPath = path.join(reportDir, "screening_metrics_report.md");
                fs.writeFileSync(reportPath, report.markdownReport, "utf-8");
            } catch (e) {
                console.error("Failed to save screening metrics report:", e);
            }
        }

        // Log the metrics check in audit
        await dbService.logAuditEvent({
            project_id: params.projectId,
            tool_name: "get_screening_report",
            action_type: "metrics",
            params: JSON.stringify({ projectId: params.projectId, batchSize: params.batchSize }),
            result_summary: `Métricas: ${report.totalScreened}/${report.totalRecords} triados, ${report.included} incluídos, saturação: ${report.saturationAlert ? "SIM" : "NÃO"}`
        });

        return {
            content: [{
                type: "text",
                text: report.markdownReport
            }, {
                type: "text",
                text: JSON.stringify({
                    totalRecords: report.totalRecords,
                    totalScreened: report.totalScreened,
                    included: report.included,
                    excluded: report.excluded,
                    screeningProgress: report.screeningProgress,
                    saturationAlert: report.saturationAlert,
                    stoppingRecommendation: report.stoppingRecommendation,
                }, null, 2)
            }]
        };
    }
);

// ─── ASReview Bridge Tool ─────────────────────────────────────

server.tool(
    "screen_with_asreview",
    "Executa a triagem via ASReview ML (Active Learning ELAS, validado pela Nature Machine Intelligence). Chama o ASReview como subprocesso, processa o dataset, e retorna os resultados. Requer Python + ASReview instalados.",
    {
        dataset: z.string().describe("JSON string com os registros a triar"),
        projectPath: z.string().describe("Caminho do projeto"),
        model: z.string().optional().describe("Modelo ELAS: 'elas_u4' (default), 'elas_l4', 'elas_h4'"),
        seed: z.number().optional().describe("Seed para reprodutibilidade (default: 42)"),
    },
    async (params) => {
        // 1. Check installation
        const { installed, version } = await asreviewBridge.checkInstalled();
        if (!installed) {
            return {
                content: [{
                    type: "text",
                    text: "❌ ASReview não está instalado.\nPara usar a triagem ML validada, instale com:\n\n```\npip install asreview\n```\n\nApós instalar, tente novamente."
                }]
            };
        }

        // 2. Parse dataset
        let records;
        try {
            records = JSON.parse(params.dataset);
            if (records.results) records = records.results;
        } catch (e) {
            return { content: [{ type: "text", text: "Erro ao fazer parse do JSON do dataset." }] };
        }

        // 3. Run ASReview simulate
        const result = await asreviewBridge.runSimulate(records, params.projectPath, {
            model: params.model || "elas_u4",
            seed: params.seed ?? 42,
            nStop: -1,
        });

        // 4. Log in audit
        await dbService.logAuditEvent({
            tool_name: "screen_with_asreview",
            action_type: "asreview_simulate",
            params: JSON.stringify({
                model: params.model || "elas_u4",
                seed: params.seed ?? 42,
                records: records.length,
                asreview_version: version,
            }),
            result_summary: result.success
                ? `ASReview ${version}: ${records.length} registros processados com ${params.model || 'elas_u4'}`
                : `ERRO: ${result.error}`,
        });

        // 5. Log to project dir
        if (params.projectPath) {
            logToLocalProject(params.projectPath, "screen_with_asreview", {
                model: params.model || "elas_u4",
                seed: params.seed ?? 42,
                records: records.length,
                asreview_version: version,
                success: result.success,
                screening_method: "asreview_ml",
            });
        }

        return {
            content: [{
                type: "text",
                text: result.success ? result.summary : `❌ ${result.error}`,
            }]
        };
    }
);

// ─── Repository Healer Tool ───────────────────────────────────

server.tool(
    "heal_repositories",
    "Realiza auto-cura do catálogo de repositórios (OAI-PMH). Lê o HTML da raiz das instituições desativadas para descobrir e reabilitar endpoints quebrados de Ciência Aberta.",
    {},
    async () => {
        const report = await repositoryHealerService.healRepositories();
        return {
            content: [{
                type: "text",
                text: report
            }]
        };
    }
);

// ─── Batch Processing Engines ─────────────────────────────────

const batchService = new BatchProcessorService();

server.tool(
    "batch_keyword_screen",
    "Triagem em lote de PDFs por palavras-chave. Lê todos os PDFs em um diretório e filtra por keywords no modo AND ou OR. Retorna relatório com trechos relevantes.",
    {
        pdfDir: z.string().describe("Caminho absoluto para o diretório de PDFs"),
        keywords: z.array(z.string()).describe("Lista de palavras-chave para buscar"),
        mode: z.enum(["AND", "OR"]).optional().describe("AND = todas devem aparecer; OR = qualquer uma basta (padrão: OR)"),
    },
    async (params) => {
        try {
            const { results, summary } = await batchService.screenByKeywords(
                params.pdfDir,
                params.keywords,
                params.mode ?? "OR",
            );
            return { content: [{ type: "text", text: summary }] };
        } catch (error: any) {
            return { content: [{ type: "text", text: `ERRO: ${error.message}` }] };
        }
    }
);

server.tool(
    "batch_llm_extract",
    "Extração LLM em lote. Aplica um prompt personalizado a cada PDF em um diretório via LLM (Gemini/OpenAI/Anthropic). Ideal para extrair dados estruturados de coleções de artigos.",
    {
        pdfDir: z.string().describe("Caminho absoluto para o diretório de PDFs"),
        prompt: z.string().describe("Instrução de extração (o que extrair de cada documento)"),
        maxPdfs: z.number().optional().describe("Número máximo de PDFs a processar (padrão: todos)"),
    },
    async (params) => {
        try {
            const { results, summary } = await batchService.llmExtract(
                params.pdfDir,
                params.prompt,
                params.maxPdfs,
            );
            return { content: [{ type: "text", text: summary }] };
        } catch (error: any) {
            return { content: [{ type: "text", text: `ERRO: ${error.message}` }] };
        }
    }
);

server.tool(
    "batch_db_screen",
    "Triagem em lote de registros do banco de dados por keywords ou LLM. Filtra títulos e/ou abstracts de um projeto.",
    {
        projectId: z.number().describe("ID do projeto no banco de dados"),
        criteria: z.string().describe("Critérios de triagem (keywords separadas por vírgula, ou texto livre para LLM)"),
        field: z.enum(["title", "abstract", "both"]).optional().describe("Campo a analisar (padrão: both)"),
        useLlm: z.boolean().optional().describe("Se true, usa LLM para classificação semântica (padrão: false = keywords)"),
    },
    async (params) => {
        try {
            const { results, summary } = await batchService.screenDbRecords(
                params.projectId,
                params.criteria,
                params.field ?? "both",
                params.useLlm ?? false,
            );
            return { content: [{ type: "text", text: summary }] };
        } catch (error: any) {
            return { content: [{ type: "text", text: `ERRO: ${error.message}` }] };
        }
    }
);

server.tool(
    "translate_document",
    "Traduz um documento PDF para o idioma alvo, gerando um arquivo Markdown. ⚠️ TEXTO DE APOIO: Traduções NÃO são fontes primárias e NÃO integram o protocolo de pesquisa. Toda tradução introduz perdas de sentido. Para citação e análise, utilize SEMPRE o original.",
    {
        pdfPath: z.string().describe("Caminho absoluto para o arquivo PDF a ser traduzido"),
        targetLang: z.string().optional().describe("Idioma alvo (padrão: português). Ex: 'português', 'english', 'español'"),
    },
    async (params) => {
        try {
            const { outputPath, summary } = await batchService.translateDocument(
                params.pdfPath,
                params.targetLang ?? "português",
            );
            return { content: [{ type: "text", text: summary }] };
        } catch (error: any) {
            return { content: [{ type: "text", text: `ERRO: ${error.message}` }] };
        }
    }
);

// ─── Start Server ─────────────────────────────────────────────


async function main() {
    const args = process.argv;
    const toolIdx = args.indexOf("--tool");

    if (toolIdx !== -1) {
        const name = args[toolIdx + 1];
        const argsIdx = args.indexOf("--args");
        let toolParams: any = {};

        if (argsIdx !== -1) {
            const rawArgs = args[argsIdx + 1];
            try {
                toolParams = JSON.parse(rawArgs);
            } catch (e: any) {
                try {
                    // Fallback for PowerShell escaped quotes
                    const fixed = rawArgs.replace(/\\"/g, '"').replace(/^"/, '').replace(/"$/, '');
                    toolParams = JSON.parse(fixed);
                } catch (e2: any) {
                    console.error(`Fatal error: Failed to parse --args. JSON error: ${e.message}`);
                    console.error(`Raw args received: ${rawArgs}`);
                    process.exit(1);
                }
            }
        }

        const handler = toolHandlers.get(name);
        if (handler) {
            console.error(`Running tool "${name}" via CLI...`);
            try {
                const result = await handler(toolParams);
                console.log(JSON.stringify(result, null, 2));
                process.exit(0);
            } catch (handlerError: any) {
                console.error(`Fatal error in tool "${name}":`, handlerError);
                process.exit(1);
            }
        } else {
            console.error(`Error: Tool "${name}" not found.`);
            process.exit(1);
        }
    }

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("mcp-repos-br server ready");
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
