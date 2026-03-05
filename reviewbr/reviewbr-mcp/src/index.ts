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
import { RepositoryHealerService } from "./services/repository_healer.js";
import { config } from "./config.js";
import { logger } from "./utils/structured_logger.js";
import { BatchProcessorService } from "./services/batch_processor.js";
import { AgentOrchestrator } from "./services/agent_orchestrator.js";

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
const repositoryHealerService = new RepositoryHealerService();
const orchestrator = new AgentOrchestrator("PROJETISTA");

/**
 * RBAC Guard: wraps every tool handler with permission checking.
 * If the current agent doesn't have permission, returns a rejection
 * message instead of executing. This avoids modifying all handlers.
 */
function guardedHandler(toolName: string, handler: (params: any) => Promise<any>) {
    return async (params: any) => {
        if (!orchestrator.isAllowed(toolName)) {
            return {
                content: [{ type: "text", text: orchestrator.getRejectionMessage(toolName) }],
            };
        }
        return handler(params);
    };
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
    if (!id && projectPath) {
        const project = await dbService.findProjectByPath(projectPath);
        if (project) id = project.id;
    }
    if (id) {
        const project = await dbService.getProjectById(id);
        if (project && project.status === "DRAFT_DESIGN") {
            return `🚫 ACESSO NEGADO: O projeto "${project.project_name}" está bloqueado em DRAFT_DESIGN. A fase de execução e mineração (ferramentas de busca/triagem) não pode iniciar sem um planejamento metodológico. Preencha o arquivo 'draft_protocol.md' e solicite aprovação via 'submit_protocol_for_approval'.`;
        }
    }
    return null;
}

const server = new McpServer({
    name: "reviewbr-mcp",
    version: "1.0.0",
});

// ─── RBAC Proxy ───────────────────────────────────────────────
// Wrap the server.tool method to automatically apply RBAC guard
// to every tool registration. This avoids modifying 29+ handlers.

const RBAC_EXEMPT_TOOLS = new Set(["get_current_agent", "switch_agent"]);
const originalToolMethod = server.tool.bind(server);

server.tool = function (...args: any[]) {
    const toolName = args[0] as string;
    const handlerIdx = args.length - 1; // handler is always the last arg
    const originalHandler = args[handlerIdx];

    if (!RBAC_EXEMPT_TOOLS.has(toolName) && typeof originalHandler === "function") {
        args[handlerIdx] = guardedHandler(toolName, originalHandler);
    }

    return (originalToolMethod as any)(...args);
} as any;


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

// ─── Agent Orchestrator Tools ─────────────────────────────────

server.tool(
    "get_current_agent",
    "Mostra o agente ativo e suas ferramentas disponíveis. Acessível por todos os agentes.",
    {},
    async () => {
        return {
            content: [{ type: "text", text: orchestrator.getStatusReport() }],
        };
    }
);

server.tool(
    "switch_agent",
    "Troca o agente ativo. EXCLUSIVO DO COORDINATOR. Papéis: PROJETISTA, COORDINATOR, LIBRARIAN, SCREENER, EXTRACTOR, ANALYST.",
    {
        targetRole: z.enum(["PROJETISTA", "COORDINATOR", "LIBRARIAN", "SCREENER", "EXTRACTOR", "ANALYST"])
            .describe("O papel do agente para ativar"),
    },
    async (params) => {
        const result = orchestrator.switchAgent(orchestrator.getCurrentRole(), params.targetRole);
        return {
            content: [{ type: "text", text: result.message }],
        };
    }
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
    "Remove duplicatas de um conjunto de resultados (JSON).",
    {
        dataset: z.string().describe("JSON string com array de resultados (SearchResult[])"),
    },
    async (params) => {
        let records;
        try {
            records = JSON.parse(params.dataset);
        } catch (e) {
            return { content: [{ type: "text", text: "Erro ao fazer parse do JSON." }] };
        }

        const result = dedupeService.deduplicate(records);
        return {
            content: [{
                type: "text",
                text: JSON.stringify(result, null, 2)
            }]
        };
    }
);

server.tool(
    "screen_candidates",
    "Triagem de candidatos usando IA (Gemini). Requer GOOGLE_API_KEY. Irá usar o texto completo extraído automaticamente se disponível no projectPath.",
    {
        candidates: z.string().describe("JSON string com array de candidatos"),
        criteria: z.string().describe("Critérios de inclusão/exclusão"),
        projectPath: z.string().optional().describe("Caminho do projeto (ex: projects/meu_projeto) para buscar o texto completo."),
    },
    async (params) => {
        if (!config.hasLlmKey) {
            return { content: [{ type: "text", text: "Nenhuma chave de API de LLM configurada (GOOGLE_API_KEY, OPENAI_API_KEY ou ANTHROPIC_API_KEY)." }] };
        }

        let records;
        try {
            records = JSON.parse(params.candidates);
        } catch (e) {
            return { content: [{ type: "text", text: "Erro ao fazer parse do JSON." }] };
        }

        const result = await screeningService.screenCandidates(records, params.criteria, params.projectPath);
        return {
            content: [{
                type: "text",
                text: JSON.stringify(result, null, 2)
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
    "Planeja um novo projeto de pesquisa, registra no banco central e cria a estrutura de pastas.",
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
        projectPath: z.string().describe("Caminho base onde o projeto será criado"),
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
    "Analisa o 'draft_protocol.md' para liberar o projeto para a fase de mineração (ACTIVE_MINING). Somente após aprovação, as buscas poderão ser feitas.",
    {
        projectId: z.number().optional(),
        projectPath: z.string().describe("Caminho do projeto onde está o '00_protocol/draft_protocol.md'"),
    },
    async (params) => {
        let projectId = params.projectId;
        if (!projectId && params.projectPath) {
            const project = await dbService.findProjectByPath(params.projectPath);
            if (project) projectId = project.id;
        }

        if (!projectId) {
            return { content: [{ type: "text", text: "Erro: Projeto não encontrado no banco." }] };
        }

        const projectDir = path.isAbsolute(params.projectPath) ? params.projectPath : path.join(process.cwd(), params.projectPath);
        const protocolPath = path.join(projectDir, "00_protocol", "draft_protocol.md");

        const audit = protocolAuditor.auditFile(protocolPath);

        if (audit.valid) {
            await dbService.activateProject(projectId, params.projectPath); // Updates to ACTIVE_MINING
            await dbService.logAuditEvent({
                project_id: projectId,
                tool_name: "submit_protocol_for_approval",
                action_type: "protocol_approval",
                params: JSON.stringify(params),
                result_summary: `Protocolo APROVADO! Score: ${audit.score}/${audit.maxScore}. Status alterado para ACTIVE_MINING.`
            });

            // Rename draft to final protocol
            const finalPath = path.join(projectDir, "00_protocol", "protocol.md");
            if (fs.existsSync(protocolPath)) fs.renameSync(protocolPath, finalPath);

            return {
                content: [{
                    type: "text",
                    text: `✅ SUCESSO! Protocolo aprovado por atingir nota ${audit.score}/${audit.maxScore}. O sistema alterou o status do projeto para ACTIVE_MINING e removeu as travas de pesquisa. As ferramentas de busca agora estão liberadas.`
                }]
            };
        } else {
            return {
                content: [{
                    type: "text",
                    text: `❌ REPROVADO! O protocolo falhou na auditoria (Nota: ${audit.score}/${audit.maxScore}). Corrija o arquivo draft_protocol.md e tente novamente.\n\nErros pendentes:\n${audit.errors.join('\n')}\n\nSugestões:\n${audit.suggestions.join('\n')}`
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

const openAlexHandler = async (params: any) => {
    const guardrailError = await checkDesignGuardrail(params.projectId, params.projectPath);
    if (guardrailError) return { content: [{ type: "text", text: guardrailError }] };

    // Resolve project for audit
    let projectId = params.projectId;
    if (!projectId && params.projectPath) {
        const project = await dbService.findProjectByPath(params.projectPath);
        if (project) projectId = project.id;
    }

    const { results, totalFound } = await snowballService.search(params.query, {
        maxResults: params.maxResults || 200
    });

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
    const { results, totalFound } = await snowballService.search(params.query, {
        maxResults: params.maxResults || 200,
        filter: "primary_location.source.publisher_lineage:P4310312277"
    });

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
