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
import { ChangeValidator, ChangeProposalSchema } from "./services/change_validator.js";
import { SystemDebtService } from "./services/system_debt.js";
import { StandardCoverageService } from "./services/standard_coverage.js";
import { checarUsoDeIA } from "./registry/ai_use.js";
import { StandardsService } from "./services/standards.js";
import { MethodologyCatalogService } from "./services/methodology_catalog.js";
import { BacklogWriter, CatalogWriter, MethodologyWriter } from "./services/maintenance_writes.js";
import { FlowComputer } from "./services/flow_computer.js";
import { indexCorpus, queryCorpus } from "./services/rag_lexical.js";
import { ProtocolGate } from "./services/protocol_gate.js";
import { ProjectStateService } from "./services/project_state.js";
import { avancarPorArtefato, lerTrilha, etapaDoArtefato, etapaSeguinte, registrarDecisaoDoPesquisador } from "./services/method_trail.js";
import { apresentarMetodos } from "./services/methods_for_type.js";
import { consolidateRaw, writeDeduped, appendRawRecords, writeScreening, readDedupePairs, readExistingDataset, composicaoTriagem, resolveDir as resolveProjectDir } from "./services/project_artifacts.js";
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
import { ScihubBridgeService } from "./services/scihub_bridge.js";
import { RepositoryHealerService } from "./services/repository_healer.js";
import { AgentOrchestrator } from "./registry/agent_orchestrator.js";
import { config } from "./config.js";
import { logger } from "./utils/structured_logger.js";
import { BatchProcessorService } from "./services/batch_processor.js";

import * as path from "node:path";
import { fileURLToPath } from "node:url";
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

/**
 * Prefixo que DECLARA o modo em que a busca operou, quando não é a trilha oficial.
 *
 * Passar em silêncio era o defeito. Busca sem `projectPath` é legítima — é a fronteira
 * entre exploração e busca oficial, e a escolha é do pesquisador (RV-04). Mas o sistema
 * não dizia em que modo operou: quem esquecesse o parâmetro com um projeto aberto recebia
 * resultados normais, e a busca ficava fora do funil sem nenhum sinal. O PRISMA-S exige
 * declarar o que foi recuperado por base; o que não entrou, ninguém sabe que faltou.
 *
 * Tornar `projectPath` obrigatório mataria a busca exploratória e decidiria pelo
 * pesquisador. Declarar o modo preserva a escolha e tira o silêncio — a mesma regra que
 * vale para a triagem individual: **omissão declarada é método, omissão silenciosa é falha.**
 *
 * Função pura, sem estado entre chamadas: estado de módulo daria corrida entre tools.
 */
/**
 * Envolve a resposta de uma tool de aquisição declarando o modo em que ela operou.
 *
 * Aplicado no RETORNO, não no início: o aviso tem de chegar junto com os resultados, que é
 * onde o pesquisador olha. Texto recebe prefixo; JSON recebe o campo `modo_busca`, porque
 * prefixar texto em JSON quebraria quem faz parse — o aviso não pode custar a máquina.
 */

function declararModo(projectPath: string | undefined, resposta: any): any {
    const aviso = ProtocolGate.check(projectPath).advisory;
    if (!aviso) return resposta;

    const bloco = resposta?.content?.[0];
    if (!bloco || bloco.type !== "text" || typeof bloco.text !== "string") return resposta;

    const txt = bloco.text.trimStart();
    if (txt.startsWith("{") || txt.startsWith("[")) {
        try {
            const dados = JSON.parse(bloco.text);
            if (dados && typeof dados === "object" && !Array.isArray(dados)) {
                return { ...resposta, content: [{ ...bloco, text: JSON.stringify({ modo_busca: aviso, ...dados }, null, 2) }] };
            }
        } catch { /* não era JSON: cai no prefixo de texto */ }
    }
    return { ...resposta, content: [{ ...bloco, text: `${aviso}\n\n---\n\n${bloco.text}` }] };
}

async function checkDesignGuardrail(projectId?: number, projectPath?: string): Promise<string | null> {
    // A decisão vive em `ProtocolGate` (src/services/protocol_gate.ts), como serviço testável.
    // A mudança de semântica mais importante está lá: o gate passou a NEGAR POR PADRÃO.
    // Antes, projeto declarado e sem nenhum artefato de protocolo caía num `return null` e
    // seguia adiante — um projeto vazio era indistinguível de um aprovado.
    const gate = ProtocolGate.check(projectPath);

    // O estado ON-DISK decide (RV-01). O SQLite só é consultado quando o disco não tem o
    // que dizer — projetos antigos, rastreados só no banco, anteriores ao estado estruturado.
    if (gate.status !== "SEM_PROTOCOLO") {
        return gate.message;
    }

    let id = projectId;
    if (!id && projectPath) {
        const project = await dbService.findProjectByPath(projectPath);
        if (project) id = project.id;
    }
    if (id) {
        const project = await dbService.getProjectById(id);
        if (project) {
            // LISTA DE PERMISSÃO, não de negação. Antes, só `DRAFT_DESIGN` bloqueava e todo o
            // resto passava — inclusive qualquer status que viesse a ser acrescentado depois,
            // que nasceria liberado sem ninguém decidir isso. É a mesma inversão que o ramo
            // em disco recebeu: quem não está explicitamente autorizado, não passa.
            const AUTORIZADOS = ["ACTIVE_MINING", "LOCKED_EXECUTION"];
            if (AUTORIZADOS.includes(project.status)) return null;

            if (project.status === "DRAFT_DESIGN") {
                return `🚫 ACESSO NEGADO: O projeto "${project.project_name}" está bloqueado em DRAFT_DESIGN. Preencha o protocolo e solicite aprovação via 'submit_protocol_for_approval'.`;
            }
            return `🚫 ACESSO NEGADO: o projeto "${project.project_name}" está com status "${project.status}", que não autoriza busca nem aquisição. ` +
                `Autorizados: ${AUTORIZADOS.join(", ")}. Status desconhecido não libera por omissão.`;
        }
    }

    // Nada no disco e nada no banco: nega. É a correção do fall-through.
    return gate.message;
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
                    "Triagem assistida por IA (Gemini/GPT/Claude), com trilha de auditoria por decisão",
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

// ─── Guardião de completude (RV-06) ───────────────────────────
// A fronteira de papéis POR CHAMADOR é imposta pelo harness do Claude Code
// (campos `tools:`/`mcpServers:` de cada subagente em `.claude/agents/`), pois o
// servidor único compartilhado não sabe qual subagente chamou. O guardião no
// runtime do servidor garante a INTEGRIDADE do mapa de governança: registramos
// o nome de toda tool exposta e, no boot (main()), exigimos que cada uma tenha
// dono de papel em TOOL_PERMISSIONS. Assim é impossível adicionar uma capacidade
// (efeito colateral) sem governança — o servidor falha ruidosamente no boot.
const REGISTERED_TOOLS = new Set<string>();
const _serverTool = server.tool.bind(server);
(server as any).tool = (name: string, ...rest: any[]) => {
    REGISTERED_TOOLS.add(name);
    return (_serverTool as any)(name, ...rest);
};

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
    "Avalia a intenção de pesquisa e apresenta ao pesquisador os MÉTODOS ASSIMILADOS que servem ao tipo — cada um com a trilha que traz, os padrões que declara e o contexto do catálogo (o que é, quando usar, o que exige, fonte oficial) —, para que ele saiba o que está escolhendo. Tipo sem método assimilado recusa e diz o que existe. Sem researchType, o tipo é palpite por palavra-chave, a confirmar. Retorna briefing para o COORDINATOR.",
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
        const repoRoot = RAIZ();

        // ─── Build response ────────────────────────────
        const sections: string[] = [];

        sections.push(`## 🏗️ Diagnóstico de Design de Pesquisa\n`);

        // Mode indicator. O modo guiado é correspondência de palavra-chave (DEBT-095): dizê-lo
        // "detectado" vendia como diagnóstico o que é palpite.
        if (params.researchType) {
            sections.push(`> **Modo Direto** — O pesquisador já definiu: **${meta.label}**\n`);
        } else {
            sections.push(`> **Modo Guiado** — palpite por palavra-chave na intenção: **${meta.label}**. Não é diagnóstico: confirme o tipo com o pesquisador antes de seguir.\n`);
        }

        sections.push(`**Área:** ${area}\n**Intenção:** "${params.intent}"\n`);

        // ─── DEBT-095: os métodos que servem ao tipo, com o contexto do catálogo ───
        // "O pesquisador pode não conhecer o método e poderia saber o que está escolhendo de
        // fato." O tipo FILTRA os métodos assimilados (methods_for_type); o que se apresenta é o
        // método, com a trilha que traz e o que o catálogo diz dele, com fonte oficial. Antes,
        // esta tool descrevia o padrão por um ternário que mandava todo tipo que não fosse
        // escopo para o prisma-sr — o 7→2 que o DEBT-121 tirou do project_init.ts e que aqui
        // sobrevivia, anunciando PRISMA 2020 para revisão integrativa.
        const { metodos, linhas: apresentacao, recusa } = apresentarMetodos(repoRoot, detectedType);

        if (!metodos.length) {
            // A mesma recusa de plan_research_protocol — uma fonte só para o texto.
            sections.push(`### 🚫 Nenhum método assimilado serve a este tipo\n`);
            sections.push(recusa);
            sections.push(
                `\nO catálogo pode conhecer o método sem que o sistema o execute: consulte \`query_methodology_catalog\` ` +
                `com o nome do método — o status diz se ele está AUSENTE, só com o padrão disponível, ou implementado. ` +
                `Assimilar um método é trabalho de manutenção, não desta conversa.`
            );
            sections.push(`\n### ➡️ Próximos Passos\n`);
            sections.push(`1. Pesquisador escolhe um dos tipos atendidos hoje, ou pede a assimilação do método que a pergunta pede (manutenção)`);
            return { content: [{ type: "text", text: sections.join("\n") }] };
        }

        sections.push(`### 🧭 ${metodos.length > 1 ? "Métodos que servem" : "Método que serve"} a este tipo — o que se está escolhendo\n`);
        sections.push(...apresentacao);

        // ─── Topic analysis for design advice ──────────
        const designAdvice = ProjectInitService.getDesignAdvice(params.intent, detectedType as any);

        // Sobre o TIPO — não sobre o método. A tabela de tipos descreve cada tipo em abstrato, e
        // pode divergir da trilha do método que o serve (ex.: o tipo exploratório é servido hoje
        // pela trilha do prisma-sr). Dizer isso é o que impede a resposta de se contradizer na
        // hora da escolha.
        sections.push(`### 📋 Sobre o tipo de pesquisa\n`);
        sections.push(`> Esta seção descreve o TIPO. O que se executa é a trilha do método acima: onde as duas divergirem, vale a trilha.\n`);
        sections.push(`- **Tipo:** ${meta.label}`);
        sections.push(`- **Registro:** ${meta.requiresRegistration ? `⚠️ OBRIGATÓRIO (${meta.registrationPlatform})` : `Opcional (${meta.registrationPlatform})`}`);
        sections.push(`- **Descrição:** ${meta.description}\n`);

        // Design recommendations
        sections.push(`### ⚖️ Recomendações de Design\n`);
        // Sem citar o item de UMA norma: no PRISMA-ScR o item 8 é "Search" (cada norma inteira).
        sections.push(`- **Processo de triagem (F4.1.2):** ${designAdvice.suggestScreeningProcess}`);
        sections.push(`- **Meta-análise:** ${designAdvice.suggestMetaAnalysis ? "Recomendada" : "Não se aplica"}`);
        for (const advice of designAdvice.advice) {
            sections.push(`- ${advice}`);
        }

        // Capabilities check
        sections.push(`\n### ✅ O que o ReviewBR pode fazer para esta pesquisa\n`);
        const capabilities = getCapabilitiesForType(detectedType);
        // A limitação é da TRILHA executada, não do rótulo do tipo: etapa ativa do método sem tool
        // que grave o artefato é feita pelo agente, com julgamento humano. Sem isto, o tipo
        // exploratório — servido pela trilha do prisma-sr — saía com "Nenhuma crítica identificada".
        const toolsExistentes = new Set(AgentOrchestrator.getGovernedTools());
        for (const m of metodos) {
            for (const e of lerTrilha(repoRoot, m.id).etapas) {
                if (e.active && !e.producer_tools.some((t) => toolsExistentes.has(t))) {
                    capabilities.cannot.push(`${e.id} — ${e.name} (${m.id}): nenhuma tool grava o artefato da etapa; o agente executa e o pesquisador julga`);
                }
            }
        }
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
        sections.push(`2. **Método(s) que servem:** ${metodos.map((m) => `${m.id} (${m.padroes.join(" + ") || "sem padrão declarado"})`).join("; ")}`);
        sections.push(`3. **Processo de triagem (F4.1.2):** ${designAdvice.suggestScreeningProcess}`);
        sections.push(`4. **Registro:** ${meta.requiresRegistration ? "OBRIGATÓRIO antes da busca" : "Opcional"}`);
        sections.push(`5. **Meta-análise:** ${designAdvice.suggestMetaAnalysis ? "Sim" : "Não"}`);
        sections.push(`6. **Limitações:** ${capabilities.cannot.length > 0 ? capabilities.cannot.join("; ") : "Nenhuma crítica identificada"}`);

        // Next steps
        sections.push(`\n### ➡️ Próximos Passos\n`);
        sections.push(`1. Pesquisador confirma o tipo e o método, sabendo o que cada um exige`);
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

        return declararModo(params.projectPath, {
            content: [{
                type: "text",
                text: JSON.stringify({
                    count: results.length,
                    errors: errors,
                    results: results
                }, null, 2)
            }]
        });
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

        let avisoRV04Dedup = "";
        if (params.projectPath) {
            writeDeduped(params.projectPath, result.unique, {
                method: "DOI > título+ano > url",
                total_before: result.stats.total,
                duplicates_removed: result.stats.duplicates,
                total_after: result.stats.unique,
                generated: new Date().toISOString(),
            }, result.pairs);

            // RV-04 (DEBT-037). A deduplicação decide o que SAI do corpus: cada par removido
            // é um estudo que não será mais visto. Sob `estrito`, a fase seguinte só abre com
            // a decisão registrada do pesquisador — o resultado fica gravado de qualquer
            // forma, porque perder trabalho não é trava, é dano.
            // DEBT-100: a tool sabe que artefato gravou; QUE ETAPA ele encerra é da trilha do
            // método. O literal "F3" morava aqui.
            const dirDedup = path.isAbsolute(params.projectPath) ? params.projectPath : path.join(process.cwd(), params.projectPath);
            avisoRV04Dedup = `\n\n${avancarPorArtefato(RAIZ(), dirDedup, "02_deduplicated/dataset.json").aviso}`;
        }

        return {
            content: [{
                type: "text",
                text: `${consolidatedNote}Deduplicação: ${result.stats.total} → ${result.stats.unique} únicos (${result.stats.duplicates} duplicatas removidas).` +
                    (params.projectPath ? `\nGravado: 02_deduplicated/dataset.json + dedupe_report.json + dedupe_pairs.json (${result.pairs.length} par(es): mantido/removido/critério/fontes).` : `\n\n${JSON.stringify(result.stats, null, 2)}`) +
                    avisoRV04Dedup,
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

        // DEBT-020: passar criteria como string pura descartava `stage` (o serviço aceita
        // string só por compatibilidade retroativa, tratando-a como {criteria} sem stage) —
        // 'fulltext' nunca chegava a buildPrompt, então a triagem de texto completo nunca
        // lia o texto completo. Monta o ScreeningConfig real, com o stage que o schema pediu.
        // RAISE 3 (DEBT-131). Triagem de relevância por LLM generativo é a linha T21 da
        // Tabela 2: C3, "requires validation within the review". A exigência de limiar
        // pré-especificado é conferida no protocolo, que é o único artefato com trava de
        // anterioridade (RV-01) — aqui o uso é declarado na resposta, para não acontecer
        // em silêncio.
        const iaScreen = checarUsoDeIA("screen_candidates", true);
        if (iaScreen.blocked) return { content: [{ type: "text", text: iaScreen.message }] };

        const result = await screeningService.screenCandidates(records, { criteria: params.criteria, stage }, params.projectPath);

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

        let avisoRV04 = "";
        if (params.projectPath) {
            writeScreening(params.projectPath, stage, result.included, result.excluded);
            const dir = path.isAbsolute(params.projectPath) ? params.projectPath : path.join(process.cwd(), params.projectPath);

            // RV-04 COMO TRAVA (DEBT-037). A triagem produz a decisão metodológica mais
            // consequente da revisão: que estudos entram. Sob `estrito`, a fase seguinte só
            // abre com a contribuição específica do pesquisador sobre esta — e o resultado
            // da triagem fica gravado de qualquer forma, porque perder trabalho não é trava,
            // é dano. O que a trava impede é AVANÇAR sem supervisão humana registrada.
            // DEBT-100: a etapa vem da trilha do método, pelo artefato que este estágio gravou.
            const artefatoTriagem = stage === "ta" ? "03_screening/included_ta.json" : "03_screening/included.json";
            avisoRV04 = `\n\n${avancarPorArtefato(RAIZ(), dir, artefatoTriagem).aviso}`;
        }

        const excludedRel = stage === "ta" ? "excluded_ta.json" : "excluded_fulltext.json";
        const includedRel = stage === "ta" ? "included_ta.json (encaminhados p/ texto completo)" : "included.json (incluídos finais)";

        // ─── O MAYBE É DECLARADO (DEBT-028) ─────────────────────────────────
        // MAYBE continua entrando em `included` — a regra de inclusão NÃO muda aqui, porque
        // mudar quem entra no corpus no meio de um conserto alteraria o resultado da revisão
        // sem decisão do pesquisador (RV-04). O que muda é o SILÊNCIO: a composição do
        // conjunto passa a ser dita. O artefato já a carrega — cada item de included_ta.json
        // é um ScreeningResult com `decision` —, então quem auditar depois acha o mesmo número.
        //
        // Os dois estágios não são o mesmo caso:
        //   TA       — "não sei pelo título/resumo" é a resposta CERTA: segue para texto completo.
        //   FULLTEXT — "não sei com o texto na mão" é estudo indeciso dentro dos incluídos
        //                FINAIS, e o funil publicado o contaria como decidido. Isso o pesquisador
        //                precisa ver, e não cabe ao sistema resolver por omissão (RV-04).
        const { sim: sims, maybe: maybes } = composicaoTriagem(result.included);
        const notaMaybe = maybes === 0 ? "" : (stage === "ta"
            ? `
⚖️ Composição dos ${result.included.length} encaminhados: ${sims} SIM + ${maybes} MAYBE. `
            + `MAYBE é dúvida declarada, não inclusão — segue para o texto completo, onde se decide.`
            : `
⚠️ ${maybes} dos ${result.included.length} incluídos FINAIS estão como MAYBE: indecisão `
            + `depois de ler o texto completo, que o funil contaria como decisão. Resolva cada um `
            + `(incluir, ou excluir com motivo EX-01..EX-11) antes de fechar a F4 — a decisão é sua (RV-04).`);
        const errorNote = result.errors.length > 0
            ? `\n⚠️ ${result.errors.length} candidato(s) com erro na triagem (não decididos, não incluídos nem excluídos): ${[...new Set(result.errors)].slice(0, 3).join(" | ")}`
            : "";
        return {
            content: [{
                type: "text",
                text: `Triagem ${stage.toUpperCase()}: ${result.included.length} incluídos, ${result.excluded.length} excluídos.` +
                    notaMaybe +
                    (params.projectPath ? `\nGravado: 03_screening/${includedRel} + 03_screening/${excludedRel}.` : `\n\n${JSON.stringify(result, null, 2)}`) +
                    errorNote + avisoRV04 + `\n${iaScreen.message}`,
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
        const guardrailError = await checkDesignGuardrail(undefined, params.projectPath);
        if (guardrailError) return { content: [{ type: "text", text: guardrailError }] };
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
    "Expande a busca via Snowballing (Citações via OpenAlex), com as 4 salvaguardas obrigatórias da skill do librarian: profundidade limitada (padrão 1, sem recursão), filtro por descritores do protocolo, dedup contra o dataset já existente do projeto e teto de candidatos com relatório de parada.",
    {
        dataset: z.string().describe("JSON string com sementes (SearchResult[])"),
        projectId: z.number().optional(),
        projectPath: z.string().optional().describe("Projeto sob o qual a operação é feita. Sem ele é exploratório e nada persiste (RV-01). Também usado para ler o dataset já existente (dedup real) quando informado."),
        depth: z.number().optional().describe("Níveis de expansão. Padrão 1 (só citações das sementes, sem recursar)."),
        filterKeywords: z.array(z.string()).optional().describe("Descritores/critérios do protocolo: um candidato só é aceito se título+descrição contiver ao menos um termo. Omitido = filtro não aplicado (declarado em stats.filter_applied)."),
        maxCandidates: z.number().optional().describe("Teto de candidatos aceitos. Padrão 200."),
    },
    async (params) => {
        const guardrailError = await checkDesignGuardrail(params.projectId, params.projectPath);
        if (guardrailError) return { content: [{ type: "text", text: guardrailError }] };
        let seeds;
        try {
            seeds = JSON.parse(params.dataset);
        } catch (e) {
            return { content: [{ type: "text", text: "Erro ao fazer parse do JSON." }] };
        }

        const existingDataset = params.projectPath ? readExistingDataset(params.projectPath) : undefined;

        const result = await snowballService.expandSearch(seeds, {
            depth: params.depth,
            filterKeywords: params.filterKeywords,
            maxCandidates: params.maxCandidates,
            existingDataset,
        });
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
        projectPath: z.string().optional().describe("Caminho do projeto. Quando informado e houver prisma_flow.json, a aritmética do funil é validada (RV-05) e o export é BLOQUEADO se não fechar."),
    },
    async (params) => {
        let records;
        try {
            records = JSON.parse(params.dataset);
            if (records.results) records = records.results; // Handle wrapper
        } catch (e) {
            return { content: [{ type: "text", text: "Erro ao fazer parse do JSON." }] };
        }

        // RV-05 no caminho do export. O manifest declara o gate F8:
        //   { rule: "RV-05", tool: "validate_prisma_flow", blocks: "export/manuscrito se a
        //     aritmética do funil não fechar" }
        // O verificador existia, reprovava de verdade, e o único caminho que ele deveria
        // bloquear não o chamava — o precedente que a skill de gates conta como passado e
        // que seguia sendo presente.
        //
        // ⚠️ DÍVIDA CONHECIDA (DEBT-081): `projectPath` opcional significa que omitir o
        // parâmetro desliga a trava. Mantido opcional por consistência com as outras 10 tools
        // guardadas, e porque export sem projeto é uso legítimo (ex.: gerar CSV para o
        // ASReview no meio do processo). A decisão de negar-por-padrão é sistêmica
        // (DEBT-080 × DEBT-081, exclusão mútua) e não deve ser tomada dentro deste conserto.
        if (params.projectPath) {
            const projectDir = path.isAbsolute(params.projectPath)
                ? params.projectPath
                : path.join(process.cwd(), params.projectPath);
            const gate = new PrismaFlowValidator().checkExportGate(projectDir);
            if (gate.blocked) {
                return {
                    content: [{
                        type: "text",
                        text: "🚫 EXPORT BLOQUEADO — RV-05 (aritmética do funil).\n\n"
                            + gate.reason + "\n\n" + gate.errors.join("\n")
                    }]
                };
            }
        }

        // RV-08 é gate, não aviso: a skill `prisma-rigor-gates` declara que a reprovação aqui
        // BLOQUEIA a síntese e o export. Antes, o carimbo de conformidade saía incondicional —
        // e viajava para dentro do artigo publicado como afirmação que ninguém verificou.
        const check = dataService.checkProvenance(records);
        if (!check.valid) {
            return {
                content: [{
                    type: "text",
                    text:
                        `🚫 EXPORT BLOQUEADO — RV-08 (origem rastreável).\n\n` +
                        check.errors.join("\n") +
                        `\n\nCorrija a origem dos registros e exporte de novo. Se a origem não existir` +
                        ` mesmo, o estudo não pode entrar na síntese: a revisão não teria como dizer` +
                        ` de onde ele veio.\n\n` +
                        `Detalhe: ${JSON.stringify(check.missing.slice(0, 20), null, 2)}`
                }]
            };
        }

        const output = dataService.exportDataset(records, params.format as any);
        const nota = check.semInstituicao > 0
            ? `\n\n⚠️ ${check.semInstituicao} de ${check.total} registro(s) sem 'institution'. Não bloqueia` +
              ` (o campo é opcional e nem toda fonte o expõe), mas a RV-08 nomeia instituição —` +
              ` decida se isso basta para a sua revisão.`
            : "";
        return {
            content: [{
                type: "text",
                text: output + nota
            }]
        };
    }
);


server.tool(
    "import_dataset_ris",
    "Importa dados de arquivo RIS (ex: Zotero/EndNote).",
    {
        content: z.string().describe("Conteúdo do arquivo .ris"),
        sourceName: z.string().optional().describe("Base de onde o export saiu (ex.: Scopus, Web of Science). Omitido: usa a tag DB do próprio RIS; sem nenhuma das duas, os registros ficam SEM origem e o export é bloqueado pela RV-08 — a importação não fabrica procedência."),
        projectId: z.number().optional(),
        projectPath: z.string().optional(),
    },
    async (params) => {
        const guardrailError = await checkDesignGuardrail(params.projectId, params.projectPath);
        if (guardrailError) return { content: [{ type: "text", text: guardrailError }] };
        // A origem vem de quem importa ou do próprio RIS. Antes, o handler nunca passava
        // `sourceName` e o default "Manual Import" carimbava procedência falsa em tudo — que
        // ainda por cima PASSAVA no gate da RV-08, porque é texto não-vazio.
        const results = dataService.importRis(params.content, params.sourceName);

        // Resolve project for audit
        let projectId = params.projectId;
        if (!projectId && params.projectPath) {
            const project = await dbService.findProjectByPath(params.projectPath);
            if (project) projectId = project.id;
        }

        if (projectId) {
            await dbService.insertRecords(projectId, "ris_import", results);
        }

        // DEBT-086: sem isto, o importado entra no SQLite mas nunca no funil PRISMA —
        // flow_computer.ts só conta 01_raw/database_records.json. Fonte da verdade é
        // on-disk (project_artifacts.ts:7-8), não o banco.
        let rawWriteNote = "";
        if (params.projectPath) {
            try {
                const raw = appendRawRecords(params.projectPath, results, "database");
                rawWriteNote = `\n\n01_raw/database_records.json: ${raw.added} novo(s) de ${results.length} (total no arquivo: ${raw.total}).`;
            } catch (e: any) {
                rawWriteNote = `\n\n⚠️ Registros importados mas NÃO gravados em 01_raw (${e?.message ?? e}). O funil PRISMA não vai contá-los até isso ser corrigido.`;
            }
        }

        return {
            content: [{
                type: "text",
                text: JSON.stringify(results, null, 2) + rawWriteNote
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
        const guardrailError = await checkDesignGuardrail(params.projectId, params.projectPath);
        if (guardrailError) return { content: [{ type: "text", text: guardrailError }] };
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

        // DEBT-086: sem isto, o importado entra no SQLite mas nunca no funil PRISMA —
        // flow_computer.ts só conta 01_raw/database_records.json. Fonte da verdade é
        // on-disk (project_artifacts.ts:7-8), não o banco.
        let rawWriteNote = "";
        if (params.projectPath) {
            try {
                const raw = appendRawRecords(params.projectPath, results, "database");
                rawWriteNote = ` 01_raw/database_records.json: ${raw.added} novo(s) (total no arquivo: ${raw.total}).`;
            } catch (e: any) {
                rawWriteNote = ` ⚠️ NÃO gravados em 01_raw (${e?.message ?? e}). O funil PRISMA não vai contá-los até isso ser corrigido.`;
            }
        }

        return {
            content: [{
                type: "text",
                text: `Sucesso: ${results.length} registros importados da BVS para o projeto ${projectId || "(sem ID)"}.${rawWriteNote}`
            }]
        };
    }
);

server.tool(
    "search_pubmed",
    "Busca artigos no PubMed (via Biopython). Ideal para literatura biomédica e de saúde.",
    {
        query: z.string().describe("Termo de busca (ex: '<conceito> AND <desfecho>')"),
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

        return declararModo(params.projectPath, {
            content: [{
                type: "text",
                text: summary // Return summary for easy reading
            }, {
                type: "text",
                text: JSON.stringify(results, null, 2) // Return JSON for processing
            }]
        });
    }
);

server.tool(
    "retrieve_fulltexts",
    "Verifica acesso aberto e baixa PDFs para o texto completo (F4.3).",
    {
        projectId: z.number().optional(),
        projectPath: z.string().describe("Caminho do projeto (ex: 'reviewbr/projects/<nome-do-projeto>')"),
        datasetPath: z.string().optional(),
    },
    async (params) => {
        const guardrailError = await checkDesignGuardrail(params.projectId, params.projectPath);
        if (guardrailError) return { content: [{ type: "text", text: guardrailError }] };
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
        query: z.string().describe("Termo(s) de busca por tema (ex: '<tema da sua revisão>')"),
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
        projectId: z.number().optional(),
        projectPath: z.string().optional().describe("Projeto sob o qual a operação é feita. Sem ele é exploratório e nada persiste (RV-01)."),
    },
    async (params) => {
        const guardrailError = await checkDesignGuardrail(params.projectId, params.projectPath);
        if (guardrailError) return { content: [{ type: "text", text: guardrailError }] };
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
        projectId: z.number().optional(),
        projectPath: z.string().optional().describe("Projeto sob o qual a coleta é feita. Sem ele, a coleta é exploratória e nada é persistido (RV-01)."),
    },
    async (params) => {
        // Antes: checkDesignGuardrail(undefined, undefined) — a tool nem expunha projectId ou
        // projectPath no schema, então a trava era sintaticamente presente e semanticamente
        // morta. Duas varreduras independentes acharam isto; foi o único caso em que a guarda
        // estava no código e não podia bloquear coisa alguma.
        const guardrailError = await checkDesignGuardrail(params.projectId, params.projectPath);
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
        projectPath: z.string().describe("Caminho ONDE o projeto será criado. CONVENÇÃO FIXA: '<raiz-do-repo>/reviewbr/projects/<nome-do-projeto>' (ex: 'reviewbr/projects/<nome-do-projeto>'). Nunca dentro de reviewbr-mcp/."),
        methodId: z.string().optional().describe("Método que o pesquisador escolheu, quando mais de um método assimilado serve ao tipo (assess_research_design os apresenta). A escolha é dele (RV-04): o sistema confere que o método serve ao tipo e está pronto, e não elege por ele. Com um método só, pode ser omitido."),
    },
    async (params) => {
        const projectId = await projectInitService.register(params as any, dbService);
        const result = await projectInitService.initializeWorkspace(projectId, params.projectPath, dbService, params.methodId);

        return {
            content: [{
                type: "text",
                text: `Projeto criado com sucesso!\nID: ${result.projectId}\nProtocolo: ${result.protocolPath}\nTipo: ${params.researchType}`
            }]
        };
    }
);

server.tool(
    "record_researcher_decision",
    "Grava a DECISÃO DO PESQUISADOR sobre uma etapa da trilha (RV-04) — é o que destrava a etapa seguinte sob control_level 'estrito'. Exige a contribuição específica dele, nas palavras dele: 'ok', 'pode seguir', 'aprovado' são recusados, porque carimbo não é supervisão. Confere que a etapa existe na trilha do método do projeto. Se o artefato que encerra a etapa já foi gravado, a fase avança agora. Com 'condicao' e 'resposta', grava a RESPOSTA dele a uma condição que o método declara (manifest 'condicoes', DEBT-142): a resposta tem de ser uma das opções do método, decide que itens condicionais do padrão se aplicam ao projeto e NÃO destrava a etapa. NÃO escreva a contribuição nem a resposta pelo pesquisador.",
    {
        projectPath: z.string().describe("Raiz do projeto (onde está o project_state.json)"),
        etapa: z.string().optional().describe("Id da etapa na trilha do método do projeto (ex.: 'F3') — a etapa sobre a qual ele decidiu. Com 'condicao', dispensável: a etapa é a da condição."),
        contribuicao: z.string().describe("O que o pesquisador avaliou e o que decidiu, nas palavras dele"),
        decisao: z.string().optional().describe("Resumo curto da decisão, se diferente da contribuição"),
        agente: z.string().optional().describe("Quem levou a decisão ao registro (ex.: 'coordinator', 'screener')"),
        condicao: z.string().optional().describe("Id de uma condição declarada no manifest do método do projeto (ex.: 'avaliacao_critica') — para gravar a resposta do pesquisador a ela"),
        resposta: z.string().optional().describe("Com 'condicao': a opção que o pesquisador escolheu, uma das declaradas pelo método"),
    },
    async (params) => {
        // DEBT-143 — a trava do RV-04 existia sem escritor legítimo: logDecision não tinha
        // chamador, e sob 'estrito' a fase só avançava com edição à mão do project_state.json.
        const r = registrarDecisaoDoPesquisador(RAIZ(), resolveProjectDir(params.projectPath), params);
        return { content: [{ type: "text", text: r.mensagem }] };
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

            // Estado on-disk = fonte da verdade. DEBT-100: a etapa que abre com o protocolo
            // travado é a que vem DEPOIS da última que o `protocol.md` encerra, na trilha do
            // método — o literal "F2" morava aqui.
            const estadoAtual = ProjectStateService.read(projectDir);
            const trilhaProj = estadoAtual ? lerTrilha(RAIZ(), estadoAtual.method) : null;
            const fechadaPeloProtocolo = trilhaProj ? etapaDoArtefato(trilhaProj.etapas, "protocol.md") : null;
            const abre = trilhaProj && fechadaPeloProtocolo ? etapaSeguinte(trilhaProj.etapas, fechadaPeloProtocolo.id) : null;
            ProjectStateService.patch(projectDir, abre ? { status: "LOCKED", phase: abre.id } : { status: "LOCKED" });
            // Trilha ilegível não é trilha sem etapa seguinte: afirmar uma propriedade de uma
            // trilha que nem foi lida esconderia a causa real.
            const notaEtapa = abre
                ? `\nEtapa seguinte na trilha do método: ${abre.id} — ${abre.name} (executa: ${abre.role}).`
                : trilhaProj && trilhaProj.erros.length
                    ? `\n🚧 A trilha do método não pôde ser lida (${trilhaProj.erros.join("; ")}): a fase do projeto NÃO mudou.`
                    : `\n🚧 A trilha do método não declara etapa depois do protocolo: a fase do projeto NÃO mudou.`;

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
                    text: `✅ SUCESSO! Protocolo aprovado (${audit.score}/${audit.maxScore}) e TRAVADO ([LOCKED]). As buscas oficiais estão liberadas.${notaEtapa}`
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
            const tradWarn = r.skippedTranslations.length > 0
                ? `\n\nℹ️ ${r.skippedTranslations.length} tradução(ões) NÃO indexada(s) (texto de apoio, não é fonte primária — DEBT-023): ${r.skippedTranslations.slice(0, 10).join(", ")}`
                : "";
            return { content: [{ type: "text", text: JSON.stringify(r, null, 2) + warn + provWarn + tradWarn }] };
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
        const guardrailError = await checkDesignGuardrail(undefined, params.projectPath);
        if (guardrailError) return { content: [{ type: "text", text: guardrailError }] };
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
    let rawSaveError: string | null = null; // DEBT-084: falha de gravação deixa de ser só console.error

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

        // Auto-save result set to 01_raw (DEBT-084: caminho absoluto tratado, falha visível)
        try {
            const rawDir = path.join(resolveProjectDir(params.projectPath), "01_raw");
            if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace("T", "_");
            const outputPath = path.join(rawDir, `dataset_openalex_${timestamp}.json`);
            fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        } catch (saveError: any) {
            console.error("Failed to auto-save OpenAlex results:", saveError);
            rawSaveError = `⚠️ Resultados encontrados mas NÃO gravados em 01_raw (${saveError?.message ?? saveError}). O funil PRISMA não vai contá-los até isso ser corrigido.`;
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
        rawSaveError ?? "",
    ].join("\n");

    return { content: [{ type: "text", text: summary }] };
};

const crossrefHandler = async (params: any) => {
    const guardrailError = await checkDesignGuardrail(params.projectId, params.projectPath);
    if (guardrailError) return { content: [{ type: "text", text: guardrailError }] };
    let rawSaveError: string | null = null; // DEBT-084: falha de gravação deixa de ser só console.error

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

        // Auto-save result set to 01_raw (DEBT-084: caminho absoluto tratado, falha visível)
        try {
            const rawDir = path.join(resolveProjectDir(params.projectPath), "01_raw");
            if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace("T", "_");
            const outputPath = path.join(rawDir, `dataset_crossref_${timestamp}.json`);
            fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        } catch (saveError: any) {
            console.error("Failed to auto-save Crossref results:", saveError);
            rawSaveError = `⚠️ Resultados encontrados mas NÃO gravados em 01_raw (${saveError?.message ?? saveError}). O funil PRISMA não vai contá-los até isso ser corrigido.`;
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
        rawSaveError ?? "",
    ].join("\n");

    return { content: [{ type: "text", text: summary }] };
};

const scieloHandler = async (params: any) => {
    const guardrailError = await checkDesignGuardrail(params.projectId, params.projectPath);
    if (guardrailError) return { content: [{ type: "text", text: guardrailError }] };
    let rawSaveError: string | null = null; // DEBT-084: falha de gravação deixa de ser só console.error

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
            const rawDir = path.join(resolveProjectDir(params.projectPath), "01_raw");
            if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace("T", "_");
            const outputPath = path.join(rawDir, `dataset_scielo_${timestamp}.json`);
            fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        } catch (saveError: any) {
            console.error("Failed to auto-save SciELO results:", saveError);
            rawSaveError = `⚠️ Resultados encontrados mas NÃO gravados em 01_raw (${saveError?.message ?? saveError}). O funil PRISMA não vai contá-los até isso ser corrigido.`;
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
        rawSaveError ?? "",
    ].join("\n");

    return { content: [{ type: "text", text: summary }] };
};

const semanticScholarHandler = async (params: any) => {
    const guardrailError = await checkDesignGuardrail(params.projectId, params.projectPath);
    if (guardrailError) return { content: [{ type: "text", text: guardrailError }] };
    let rawSaveError: string | null = null; // DEBT-084: falha de gravação deixa de ser só console.error

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
                const rawDir = path.join(resolveProjectDir(params.projectPath), "01_raw");
                if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace("T", "_");
                const outputPath = path.join(rawDir, `dataset_semanticscholar_${timestamp}.json`);
                fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
            } catch (saveError: any) {
                console.error("Failed to auto-save SemanticScholar results:", saveError);
                rawSaveError = `⚠️ Resultados encontrados mas NÃO gravados em 01_raw (${saveError?.message ?? saveError}). O funil PRISMA não vai contá-los até isso ser corrigido.`;
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
        rawSaveError ?? "",
    ].join("\n");

    return { content: [{ type: "text", text: summary }] };
};

const coreHandler = async (params: any) => {
    const guardrailError = await checkDesignGuardrail(params.projectId, params.projectPath);
    if (guardrailError) return { content: [{ type: "text", text: guardrailError }] };
    let rawSaveError: string | null = null; // DEBT-084: falha de gravação deixa de ser só console.error

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
                const rawDir = path.join(resolveProjectDir(params.projectPath), "01_raw");
                if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace("T", "_");
                const outputPath = path.join(rawDir, `dataset_core_${timestamp}.json`);
                fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
            } catch (saveError: any) {
                console.error("Failed to auto-save CORE results:", saveError);
                rawSaveError = `⚠️ Resultados encontrados mas NÃO gravados em 01_raw (${saveError?.message ?? saveError}). O funil PRISMA não vai contá-los até isso ser corrigido.`;
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
        rawSaveError ?? "",
    ].join("\n");

    return { content: [{ type: "text", text: summary }] };
};

const europePmcHandler = async (params: any) => {
    const guardrailError = await checkDesignGuardrail(params.projectId, params.projectPath);
    if (guardrailError) return { content: [{ type: "text", text: guardrailError }] };
    let rawSaveError: string | null = null; // DEBT-084: falha de gravação deixa de ser só console.error

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
                const rawDir = path.join(resolveProjectDir(params.projectPath), "01_raw");
                if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace("T", "_");
                const outputPath = path.join(rawDir, `dataset_europe_pmc_${timestamp}.json`);
                fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
            } catch (saveError: any) {
                console.error("Failed to auto-save Europe PMC results:", saveError);
                rawSaveError = `⚠️ Resultados encontrados mas NÃO gravados em 01_raw (${saveError?.message ?? saveError}). O funil PRISMA não vai contá-los até isso ser corrigido.`;
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
        rawSaveError ?? "",
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
        query: z.string().describe("Termo de busca (ex: '<termo> OR <sinônimo>')"),
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

        // DEBT-024: se o projeto tem 02_deduplicated/dedupe_pairs.json (produzido por
        // deduplicate_dataset, DEBT-029), o dataset submetido já passou pelo mesmo
        // DeduplicationService — reaplicá-lo daria sempre PASS por construção. Nesse
        // caso o check audita o LOG; sem projectPath ou sem o arquivo (auditoria de
        // pesquisa externa), undefined preserva o re-run como única verificação possível.
        const dedupePairs = params.projectPath ? readDedupePairs(params.projectPath) ?? undefined : undefined;

        const report = auditorService.audit({
            dataset: records,
            searchTermsUsed: params.searchTermsUsed,
            prismaFlowData: prismaFlow,
            dedupePairs,
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
            // RAISE 3 (DEBT-131). `useLlm` decide se há automação generativa nesta corrida —
            // só a tool sabe. Com LLM, a tarefa é "screening for relevance" (Tabela 2, T21) e
            // cai em C3: exige validação dentro da revisão. Sem LLM, é filtro por keyword e
            // não aciona o gate.
            const ia = checarUsoDeIA("batch_db_screen", params.useLlm ?? false);
            if (ia.blocked) return { content: [{ type: "text", text: ia.message }] };

            const { results, summary } = await batchService.screenDbRecords(
                params.projectId,
                params.criteria,
                params.field ?? "both",
                params.useLlm ?? false,
            );
            return { content: [{ type: "text", text: ia.message ? `${ia.message}\n\n${summary}` : summary }] };
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

server.tool(
    "validate_system_change",
    "Valida uma alteração do PRÓPRIO ReviewBR contra a Regra RV-11: toda alteração declara seu TIPO (CORRECAO | CONFORMIDADE | EXTENSAO) e satisfaz o requisito daquele tipo — correção exige falha documentada e reproduzível; conformidade exige padrão, versão e item; extensão exige protocolo próprio travado. Submissão sem tipo declarado é REPROVADA. Verificação determinística: não infere o tipo a partir do conteúdo (RV-06).",
    {
        proposal: z.string().describe(
            "JSON da proposta. Campos: summary (obrigatório), change_type ('CORRECAO'|'CONFORMIDADE'|'EXTENSAO', obrigatório), targets[]; " +
            "para CORRECAO: documented_failure, reproduction; " +
            "para CONFORMIDADE: standard, standard_version, standard_item; " +
            "para EXTENSAO: protocol_path, protocol_locked; " +
            "addresses[]: ids dos achados que esta alteração corrige (ex.: ['DEBT-021']) — o gate confere a ORDEM e reprova se um pré-requisito seguir aberto"
        ),
        repoRoot: z.string().optional().describe(
            "Raiz do repositório, para ler o backlog e conferir a ordem de correção. Omitido: resolve a partir do próprio módulo."
        ),
    },
    async (params) => {
        let raw: unknown;
        try {
            raw = JSON.parse(params.proposal);
        } catch {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        valid: false,
                        change_type: null,
                        errors: ["Proposta não é JSON válido."],
                        requirement: "declarar o tipo da alteração"
                    }, null, 2)
                }]
            };
        }

        const validador = new ChangeValidator();
        const validation = validador.validateRaw(raw);

        // ORDEM DE CORREÇÃO (RV-11). Só confere se o tipo já passou: proposta sem tipo
        // declarado não chega a ter ordem a conferir. Corrigir fora de ordem gera
        // retrabalho já mapeado — 13 dependências e 1 exclusão mútua apuradas —, e até
        // aqui esse dado existia sem ninguém consultá-lo no momento de decidir.
        if (validation.valid) {
            const proposta = ChangeProposalSchema.parse(raw);
            const raizMcp = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
            const raizRepo = params.repoRoot ?? path.resolve(raizMcp, "..", "..");
            const ordem = validador.checkOrder(proposta, SystemDebtService.probe(raizRepo));
            if (ordem.errors.length > 0) {
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            ...validation,
                            valid: ordem.ok && validation.valid,
                            errors: [...validation.errors, ...ordem.errors]
                        }, null, 2)
                    }]
                };
            }
        }

        return { content: [{ type: "text", text: JSON.stringify(validation, null, 2) }] };
    }
);

server.tool(
    "audit_system_debt",
    "Lê o backlog de achados sobre o PRÓPRIO ReviewBR (system_debt.json) e audita sua integridade (Regra RV-11). PONTO DE ENTRADA do agente maintainer em sessão nova: devolve o panorama por estado, por DESTINO e por GRAVIDADE, os achados abertos e quais deles ESPERAM outro ser corrigido antes — tudo DERIVADO do dado, nunca lido de documento que envelhece. Sem depender de nenhum contexto de conversa anterior. REPROVA se um achado saiu da fila sem decisão registrada, se um achado de tipo CORRECAO não tem reprodução, ou se há ids duplicados. Fila com item ABERTO é estado normal e não reprova.",
    {
        repoRoot: z.string().optional().describe(
            "Raiz do repositório ReviewBR. Omitido: resolve a partir da localização do próprio módulo (não do cwd — mesma classe do bug que quebrou o catálogo de repositórios)."
        ),
    },
    async (params) => {
        // Resolução relativa ao MÓDULO: src/ -> reviewbr-mcp -> reviewbr -> raiz do repo.
        const mcpRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
        const repoRoot = params.repoRoot ?? path.resolve(mcpRoot, "..", "..");

        // `probe`, não `read`. Esta tool é o PONTO DE ENTRADA do mantenedor em sessão nova, e
        // `read()` devolve null tanto para ausente quanto para ilegível — um backlog de
        // centenas de achados corrompido era anunciado como "possivelmente inexistente", sem
        // dizer qual dos dois nem por quê. O DEBT-068 corrigiu os ESCRITORES e deixou o LEITOR
        // com a mesma confusão: a sessão nova começaria acreditando que não há memória.
        const sonda = SystemDebtService.probe(repoRoot);
        if (sonda.status === "ILEGIVEL") {
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        valid: false,
                        status: "ILEGIVEL",
                        errors: [
                            `O backlog EXISTE em ${SystemDebtService.debtPath(repoRoot)} e está ILEGÍVEL — ${sonda.detail}`,
                            "Isto NÃO é 'backlog ausente': há memória em disco e ela não pode ser lida. " +
                            "Corrija o arquivo ou restaure uma versão anterior. Escrever agora é recusado " +
                            "pelas tools de escrita, justamente para não apagar o que está lá."
                        ]
                    }, null, 2)
                }]
            };
        }

        const debt = sonda.debt ?? null;
        const audit = SystemDebtService.audit(debt);

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    repoRoot,
                    debtPath: SystemDebtService.debtPath(repoRoot),
                    ...audit
                }, null, 2)
            }]
        };
    }
);

server.tool(
    "check_standard_coverage",
    "Confere a cobertura de um padrão metodológico (.claude/standards/) em QUATRO pontos (DEBT-140): (a) cada subitem apontado existe na spec do método; (b) o rótulo do subitem não contradiz o item — por falsificação contra o título oficial, com a PREMISSA declarada no resultado; (c) se alguma tool produz o artefato da etapa do subitem ou só o agente; (d) toda linha ou é coberta, ou declarada [NÃO COBERTO] (fila de manutenção) ou [NÃO SE APLICA] (não é falha) — omissão silenciosa REPROVA. O mapeamento e as declarações são do MÉTODO (.claude/methodologies/<método>/conformance/<padrão>.json, DEBT-142). Roda contra os métodos que DECLARAM o padrão em conformance.standards, cada um com o seu mapeamento, e diz quando nenhum declara. Com projectPath, confere contra o método do projeto e aplica as respostas dele às condições do método: item condicional respondido fora do que o método exige sai do denominador. Devolve a fração honesta (ex.: 12/26), o que foi contestado, os itens condicionais e o LIMITE do que a máquina não julga. Com render=true, emite o template do checklist de conformidade do método.",
    {
        standardId: z.string().describe("Id do padrão, como o nome do arquivo sem .json (ex.: 'prisma-2020', 'prisma-s'). Vazio (\"\"): lista os padrões assimilados com versão, version_source, fonte oficial e os métodos que declaram cada um — a lista de trabalho da conferência de obsolescência."),
        render: z.boolean().optional().describe("true: devolve o template do checklist em Markdown, em vez do relatório de cobertura. Padrão declarado por mais de um método pede projectPath ou methodologyId."),
        methodologyId: z.string().optional().describe("Id da metodologia em .claude/methodologies/ (ex.: 'prisma-sr'). Omitido: confere contra TODOS os métodos que declaram o padrão. Informado: só contra ele — e avisa se ele não declara o padrão."),
        projectPath: z.string().optional().describe("Raiz do projeto (onde está o project_state.json). Informado: confere contra o método do projeto, com as respostas dele às condições do método."),
        repoRoot: z.string().optional().describe("Raiz do repositório. Omitido: resolve a partir do módulo, não do cwd."),
    },
    async (params) => {
        const mcpRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
        const repoRoot = params.repoRoot ?? path.resolve(mcpRoot, "..", "..");

        if (!params.standardId) {
            // DEBT-010 — a lista de trabalho da conferência de obsolescência: versão, fonte e
            // quem declara cada padrão. Ir à fonte e relatar é passo da rotina do maintainer.
            return {
                content: [{
                    type: "text", text: JSON.stringify({
                        available: StandardsService.list(repoRoot),
                        padroes: StandardCoverageService.panorama(repoRoot),
                    }, null, 2)
                }]
            };
        }

        const projectDir = params.projectPath ? resolveProjectDir(params.projectPath) : undefined;
        if (params.render) {
            // O template leva a conferência junto: contestado sai marcado, e a fração, a premissa
            // e o limite vão no rodapé — é o documento que o pesquisador preenche e publica. É de
            // UM método, porque o mapeamento é do método (DEBT-142).
            return { content: [{ type: "text", text: StandardCoverageService.checklist(repoRoot, params.standardId, params.methodologyId, projectDir) }] };
        }

        // DEBT-140 — `checkCoverage` sozinho só via `covered_by` vazio: verde por construção, o
        // mesmo resultado para qualquer projeto. A conferência roda contra os métodos que
        // declaram o padrão, e a falsificação (DEBT-124) deixou de depender de alguém pedir.
        const report = StandardCoverageService.conferir(repoRoot, params.standardId, params.methodologyId, projectDir);

        return { content: [{ type: "text", text: JSON.stringify(report, null, 2) }] };
    }
);

server.tool(
    "query_methodology_catalog",
    "Consulta o CATÁLOGO de metodologias de revisão (.claude/catalog/) — o mapa do território: que métodos existem, quando usar cada um, o que exigem e qual o status de cada um NO SISTEMA (implementada / padrão disponível / declarada / ausente). O status é DERIVADO do disco, nunca declarado: o catálogo não consegue afirmar que algo está implementado quando não está (mesmo princípio do RV-02). Reprova entrada sem fonte rastreável e metodologia implementada cujo padrão não existe como dado.",
    {
        termo: z.string().optional().describe("Filtra por id, nome, tipo ou pelo 'quando usar' (ex.: 'scoping', 'qualitativa', 'risco de viés'). Omita para o panorama completo."),
        detalhe: z.boolean().optional().describe("true: devolve os campos completos de cada entrada. false (padrão): devolve o resumo."),
        repoRoot: z.string().optional().describe("Raiz do repositório. Omitido: resolve a partir do módulo, não do cwd."),
    },
    async (params) => {
        const mcpRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
        const repoRoot = params.repoRoot ?? path.resolve(mcpRoot, "..", "..");

        const report = MethodologyCatalogService.resolve(repoRoot, MethodologyCatalogService.read(repoRoot));
        const achadas = MethodologyCatalogService.find(report, params.termo ?? "");

        const corpo = params.detalhe
            ? achadas
            : achadas.map((e) => ({
                id: e.id, name: e.name, kind: e.kind, version: e.version,
                status: e.status_in_system, unverified: e.unverified,
                when_to_use: e.when_to_use
            }));

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    total_no_catalogo: report.total,
                    por_status: report.by_status,
                    encontradas: corpo.length,
                    valid: report.valid,
                    errors: report.errors,
                    entries: corpo
                }, null, 2)
            }]
        };
    }
);

// ─── Escrita do mantenedor ────────────────────────────────────
// Ate 25/09/2026 o maintainer so tinha tools de LEITURA: toda escrita era edicao de JSON na
// mao, sem verificacao no momento de escrever. Estas quatro fecham o lado de escrita, e cada
// uma valida ANTES de gravar em vez de deixar o gate descobrir depois.

const RAIZ = () => path.resolve(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), "..", "..");
const RESP = (r: any) => ({ content: [{ type: "text" as const, text: JSON.stringify(r, null, 2) }] });
const JSONP = (s: string, campo: string) => {
    try { return { ok: true as const, v: JSON.parse(s) }; }
    catch { return { ok: false as const, v: null, erro: `'${campo}' nao e JSON valido.` }; }
};

server.tool(
    "record_system_finding",
    "REGISTRA (ou atualiza) um achado no backlog de divida do ReviewBR. Valida NO MOMENTO DA ESCRITA as mesmas regras que audit_system_debt cobra depois: id unico, tipo declarado (RV-11), CORRECAO exige reproducao, e saida da fila (RESOLVIDO/RECUSADO) exige justificativa. Recusa a escrita em vez de gravar backlog inconsistente.",
    {
        finding: z.string().describe("JSON do achado: id, summary, change_type (CORRECAO|CONFORMIDADE|EXTENSAO), evidence, status (ABERTO|EM_CURSO|RESOLVIDO|RECUSADO), destino (FASE_1|FASE_2|CONFORM_EXTERNA|METODOLOGIA_NOVA|AGENTE_SKILL|DECISAO_PESQ|BLOQUEADO|DIAGNOSTICO); opcionais gravidade (BLOQUEIA|SERIO|MENOR), depende_de[] (ids a corrigir ANTES deste), reproduction, location, resolution, found_by, found_at, context. SEM 'destino' o achado nasce orfao e a auditoria reprova."),
        atualizar: z.boolean().optional().describe("true para alterar achado existente. Sem isto, id repetido e recusado."),
        repoRoot: z.string().optional(),
    },
    async (p) => {
        const j = JSONP(p.finding, "finding");
        if (!j.ok) return RESP({ ok: false, errors: [j.erro] });
        return RESP(BacklogWriter.registrar(p.repoRoot ?? RAIZ(), j.v, p.atualizar ?? false));
    }
);

server.tool(
    "absorb_methodology",
    "ABSORVE uma metodologia no catalogo (.claude/catalog/) — o 'conhecer sem implementar'. Exige source_url EXTERNO (http/https) da fonte oficial consultada: entrada sem fonte rastreavel e palpite, nao catalogo. O status no sistema NAO e escrito: continua derivado do disco a cada consulta (RV-02).",
    {
        entry: z.string().describe("JSON da entrada: id, name, kind, version, what_it_is, when_to_use, requires, source_url (obrigatorio, http); opcionais full_name, version_year, item_count, related_standards, confidence, notes, standard_file, methodology_dir."),
        atualizar: z.boolean().optional().describe("true para alterar entrada existente."),
        repoRoot: z.string().optional(),
    },
    async (p) => {
        const j = JSONP(p.entry, "entry");
        if (!j.ok) return RESP({ ok: false, errors: [j.erro] });
        return RESP(CatalogWriter.absorver(p.repoRoot ?? RAIZ(), j.v, p.atualizar ?? false));
    }
);

server.tool(
    "scaffold_methodology",
    "CRIA o esqueleto de uma metodologia nova em .claude/methodologies/<id>/. Metodologia nova e EXTENSAO pelo RV-11: exige protocolo proprio TRAVADO, que precisa existir no disco, e exige que cada padrao declarado ja exista em .claude/standards/. Escreve so esqueleto com [TBD] (RV-03) — nunca conteudo inventado.",
    {
        methodology: z.string().describe("JSON: id (kebab-case), name, review_type, description, standards[] (ids de .claude/standards/), question_frameworks[], protocol_path, protocol_locked."),
        repoRoot: z.string().optional(),
    },
    async (p) => {
        const j = JSONP(p.methodology, "methodology");
        if (!j.ok) return RESP({ ok: false, errors: [j.erro] });
        return RESP(MethodologyWriter.criar(p.repoRoot ?? RAIZ(), j.v));
    }
);

server.tool(
    "validate_methodology",
    "VALIDA uma metodologia existente — a verificacao que faltava para ALTERACOES. Mudar metodologia e editar spec.md/manifest.json; o controle certo e RV-11 antes e esta validacao depois. Reprova: spec declarada ausente, invariante 'always_on' sem gate que o ative (pega o DEBT-003 automaticamente), ausencia de conformance.standards (DEBT-004) e padrao declarado que nao existe como dado.",
    {
        methodologyId: z.string().describe("Id da pasta em .claude/methodologies/ (ex.: 'prisma-sr')."),
        repoRoot: z.string().optional(),
    },
    async (p) => RESP(MethodologyWriter.validar(p.repoRoot ?? RAIZ(), p.methodologyId))
);

// ─── Start Server ─────────────────────────────────────────────


async function main() {
    // Guardião de completude: toda tool exposta precisa ter dono de papel (RV-06),
    // e todo mapeamento precisa corresponder a uma tool real. Falha ruidosa no boot
    // (vale para o modo servidor e para o modo CLI `--tool`). As tools são todas
    // registradas em nível de módulo, então REGISTERED_TOOLS já está completo aqui.
    AgentOrchestrator.assertGovernanceCompleteness(REGISTERED_TOOLS);
    logger.info("MCP_SERVER", "Guardião de governança OK", {
        governedTools: AgentOrchestrator.getGovernedTools().length,
        registeredTools: REGISTERED_TOOLS.size,
    });

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
