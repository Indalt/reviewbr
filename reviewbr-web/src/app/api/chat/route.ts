import { NextRequest, NextResponse } from "next/server";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { callLlm, PROVIDERS, type ProviderId, type LlmMessage, type ToolDeclaration } from "@/lib/llm-providers";

/**
 * ReviewBR Chat API Route — HERMETIC BRIDGE
 * 
 * The AI can ONLY call the functions declared in TOOL_DECLARATIONS.
 * No filesystem access, no terminal, no script creation.
 * Supports Gemini, OpenAI, and Anthropic via the provider abstraction.
 */

// ─── User Config Loader ─────────────────────────────────────

function loadUserEnv(): Record<string, string> {
    const envPath = path.join(os.homedir(), ".reviewbr", ".env");
    const env: Record<string, string> = {};
    if (!fs.existsSync(envPath)) return env;

    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.substring(0, eqIdx).trim();
        const val = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
        env[key] = val;
    }
    return env;
}

// ─── System Prompt ───────────────────────────────────────────

function loadSystemPrompt(): string {
    const possiblePaths = [
        path.join(process.cwd(), "..", "reviewbr", "SYSTEM_PROMPT.md"),
        path.join(process.cwd(), "..", "reviewbr", "reviewbr-mcp", "SYSTEM_PROMPT.md"),
    ];

    for (const p of possiblePaths) {
        if (fs.existsSync(p)) return fs.readFileSync(p, "utf-8");
    }

    return `Você é o ReviewBR, um assistente de pesquisa acadêmica especializado em revisões sistemáticas.
Você opera exclusivamente através das ferramentas (tools) registradas no sistema.
Você NÃO pode criar scripts, acessar o terminal, ou manipular arquivos diretamente.
Toda operação deve ser feita exclusivamente via as funções declaradas.`;
}

// ─── Tool Declarations ───────────────────────────────────────

const TOOL_DECLARATIONS: ToolDeclaration[] = [
    // ─── Search Tools (8) ────────────────────────────────────
    {
        name: "search_openalex",
        description: "Busca artigos no OpenAlex (multidisciplinar internacional). Ideal para listas mestras.",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "Termo de busca (ex: 'cashew OR Anacardium occidentale')" },
                maxResults: { type: "number", description: "Máximo de resultados (default: 200)" },
                projectPath: { type: "string", description: "Caminho do projeto" },
            },
            required: ["query"],
        },
    },
    {
        name: "search_pubmed",
        description: "Busca artigos no PubMed (biomédica internacional, via Biopython).",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "Termo de busca (ex: 'Anacardium occidentale AND antioxidant')" },
                maxResults: { type: "number", description: "Máximo de resultados (default: 20)" },
                projectPath: { type: "string", description: "Caminho do projeto" },
            },
            required: ["query"],
        },
    },
    {
        name: "search_scielo",
        description: "Busca artigos no SciELO (América Latina, Open Access).",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "Termo de busca" },
                maxResults: { type: "number", description: "Máximo de resultados (default: 200)" },
                projectPath: { type: "string", description: "Caminho do projeto" },
            },
            required: ["query"],
        },
    },
    {
        name: "search_crossref",
        description: "Busca no Crossref (metadados de DOIs, multidisciplinar).",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "Termo de busca" },
                maxResults: { type: "number", description: "Máximo de resultados (default: 200)" },
                projectPath: { type: "string", description: "Caminho do projeto" },
            },
            required: ["query"],
        },
    },
    {
        name: "search_core",
        description: "Busca no CORE (core.ac.uk), maior agregador Open Access mundial.",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "Termo de busca" },
                maxResults: { type: "number", description: "Máximo de resultados (default: 200)" },
                projectPath: { type: "string", description: "Caminho do projeto" },
            },
            required: ["query"],
        },
    },
    {
        name: "search_europe_pmc",
        description: "Busca no Europe PMC (ciências da vida e biomedicina).",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "Termo de busca" },
                maxResults: { type: "number", description: "Máximo de resultados (default: 200)" },
                projectPath: { type: "string", description: "Caminho do projeto" },
            },
            required: ["query"],
        },
    },
    {
        name: "search_semanticscholar",
        description: "Busca no Semantic Scholar (IA para agregar artigos com PDFs Open Access).",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "Termo de busca" },
                maxResults: { type: "number", description: "Máximo de resultados (default: 200)" },
                projectPath: { type: "string", description: "Caminho do projeto" },
            },
            required: ["query"],
        },
    },
    {
        name: "search_repository",
        description: "Busca em repositórios acadêmicos brasileiros (OAI-PMH, DSpace, scraping). Suporta filtros por estado, tipo de instituição, grau.",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "Termo de busca" },
                scope: { type: "string", description: "Escopo: global_open_science, regional_latam, national_br, institutional_br" },
                state: { type: "string", description: "UF do estado (ex: BA, SP)" },
                institutionType: { type: "string", description: "federal, estadual, privada, comunitaria, instituto_federal" },
                degreeType: { type: "string", description: "graduacao, mestrado, doutorado, pos-doutorado" },
                dateFrom: { type: "string", description: "Data inicial (YYYY-MM-DD)" },
                dateUntil: { type: "string", description: "Data final (YYYY-MM-DD)" },
                maxResults: { type: "number", description: "Máximo por repositório (default: 50)" },
                projectPath: { type: "string", description: "Caminho do projeto" },
            },
            required: ["query"],
        },
    },
    // ─── Search Expansion ────────────────────────────────────
    {
        name: "search_papers_optimized",
        description: "Busca otimizada por Camadas de Cobertura (Estratégia Nacional 5-Camadas).",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "Termo de busca" },
                layers: { type: "array", items: { type: "number" }, description: "Camadas (1-5)" },
                dateFrom: { type: "string", description: "Data inicial" },
                dateUntil: { type: "string", description: "Data final" },
                projectPath: { type: "string", description: "Caminho do projeto" },
            },
            required: ["query", "layers"],
        },
    },
    {
        name: "expand_search_snowball",
        description: "Expande busca via Snowballing (citações e referências via OpenAlex).",
        parameters: {
            type: "object",
            properties: {
                dataset: { type: "string", description: "JSON string com sementes (SearchResult[])" },
            },
            required: ["dataset"],
        },
    },
    // ─── Import & Normalization ───────────────────────────────
    {
        name: "import_dataset_ris",
        description: "Importa dados de arquivo RIS (Zotero/EndNote) para normalização.",
        parameters: {
            type: "object",
            properties: {
                content: { type: "string", description: "Conteúdo do arquivo .ris" },
                projectPath: { type: "string", description: "Caminho do projeto" },
            },
            required: ["content"],
        },
    },
    {
        name: "import_bvs_export",
        description: "Importa resultados exportados do portal BVS/LILACS (CSV).",
        parameters: {
            type: "object",
            properties: {
                filePath: { type: "string", description: "Caminho absoluto para o CSV da BVS" },
                projectPath: { type: "string", description: "Caminho do projeto" },
            },
            required: ["filePath"],
        },
    },
    {
        name: "deduplicate_dataset",
        description: "Remove duplicatas de um conjunto de resultados (por DOI, título normalizado, identificador).",
        parameters: {
            type: "object",
            properties: {
                dataset: { type: "string", description: "JSON string com array de resultados" },
            },
            required: ["dataset"],
        },
    },
    // ─── Screening & Extraction ──────────────────────────────
    {
        name: "screen_candidates",
        description: "Triagem de candidatos usando IA (Gemini). Classifica por critérios de inclusão/exclusão.",
        parameters: {
            type: "object",
            properties: {
                candidates: { type: "string", description: "JSON com candidatos" },
                criteria: { type: "string", description: "Critérios de inclusão/exclusão" },
                projectPath: { type: "string", description: "Caminho do projeto" },
            },
            required: ["candidates", "criteria"],
        },
    },
    {
        name: "retrieve_fulltexts",
        description: "Verifica acesso aberto e baixa PDFs (via Unpaywall).",
        parameters: {
            type: "object",
            properties: {
                projectPath: { type: "string", description: "Caminho do projeto" },
                datasetPath: { type: "string", description: "Caminho do dataset (opcional)" },
            },
            required: ["projectPath"],
        },
    },
    {
        name: "download_and_extract_pdfs",
        description: "Baixa PDFs e extrai texto para análise de conteúdo completo.",
        parameters: {
            type: "object",
            properties: {
                urls: { type: "array", items: { type: "string" }, description: "URLs dos PDFs" },
                projectPath: { type: "string", description: "Diretório para salvar" },
            },
            required: ["urls"],
        },
    },
    // ─── Audit & Validation ──────────────────────────────────
    {
        name: "audit_methodology",
        description: "Audita conformidade metodológica de pesquisa já concluída (Post-Hoc). 5 checks: cobertura de bases, estratégia de busca, PRISMA, duplicatas, viés de seleção.",
        parameters: {
            type: "object",
            properties: {
                dataset: { type: "string", description: "JSON com registros submetidos" },
                searchTermsUsed: { type: "string", description: "String de busca utilizada" },
                prismaFlowData: { type: "string", description: "JSON com dados do PRISMA Flow" },
                projectPath: { type: "string", description: "Caminho do projeto de auditoria" },
            },
            required: ["dataset"],
        },
    },
    {
        name: "validate_prisma_flow",
        description: "Valida a consistência matemática do Fluxograma PRISMA (10 campos obrigatórios).",
        parameters: {
            type: "object",
            properties: {
                flowData: { type: "string", description: "JSON com os 10 campos do PRISMA Flow" },
            },
            required: ["flowData"],
        },
    },
    {
        name: "validate_repository",
        description: "Verifica a saúde e capacidades de repositórios (conectividade, OAI-PMH, REST API).",
        parameters: {
            type: "object",
            properties: {
                repositoryId: { type: "string", description: "ID do repositório (omita para validar todos)" },
                checks: { type: "array", items: { type: "string" }, description: "Tipos: connectivity, oai_pmh, rest_api, search" },
            },
            required: [],
        },
    },
    // ─── Project Management ──────────────────────────────────
    {
        name: "plan_research_protocol",
        description: "Cria um novo projeto de pesquisa, registra no banco central e gera a estrutura de pastas com protocolo PRISMA.",
        parameters: {
            type: "object",
            properties: {
                name: { type: "string", description: "Nome do projeto" },
                userId: { type: "string", description: "ID do usuário" },
                topic: { type: "string", description: "Tema/objetivo da pesquisa" },
                researchType: { type: "string", description: "systematic_review, scoping_review, integrative_review, meta_analysis, rapid_review, exploratory" },
                projectPath: { type: "string", description: "Caminho base" },
            },
            required: ["name", "userId", "topic", "researchType", "projectPath"],
        },
    },
    // ─── Export ───────────────────────────────────────────────
    {
        name: "export_dataset",
        description: "Exporta dados para CSV, Markdown (bibliografia) ou JSON.",
        parameters: {
            type: "object",
            properties: {
                dataset: { type: "string", description: "JSON string com resultados" },
                format: { type: "string", description: "csv, markdown ou json" },
            },
            required: ["dataset", "format"],
        },
    },
    // ─── Repository Metadata ─────────────────────────────────
    {
        name: "get_record_metadata",
        description: "Obtém metadados completos (Dublin Core) de um registro específico em um repositório.",
        parameters: {
            type: "object",
            properties: {
                repositoryId: { type: "string", description: "ID do repositório (ex: 'BR-FED-0001')" },
                recordIdentifier: { type: "string", description: "Identificador OAI ou URL/handle do registro" },
            },
            required: ["repositoryId", "recordIdentifier"],
        },
    },
    {
        name: "harvest_records",
        description: "Coleta registros em massa via OAI-PMH de um repositório específico.",
        parameters: {
            type: "object",
            properties: {
                repositoryId: { type: "string", description: "ID do repositório" },
                set: { type: "string", description: "Conjunto OAI-PMH" },
                dateFrom: { type: "string", description: "Data inicial" },
                dateUntil: { type: "string", description: "Data final" },
                maxRecords: { type: "number", description: "Máximo de registros (default: 100)" },
            },
            required: ["repositoryId"],
        },
    },
    // ─── Screening Metrics ───────────────────────────────────
    {
        name: "get_screening_report",
        description: "Gera relatório de métricas de triagem com análise de saturação (Stopping Rule). Leitura pura — NUNCA modifica dados.",
        parameters: {
            type: "object",
            properties: {
                projectId: { type: "number", description: "ID do projeto" },
                batchSize: { type: "number", description: "Tamanho do batch para análise (default: 20)" },
                projectPath: { type: "string", description: "Caminho do projeto para salvar relatório" },
            },
            required: ["projectId"],
        },
    },
];

// ─── Chat Handler ────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const env = loadUserEnv();

    // Determine provider & model
    const provider = (env.LLM_PROVIDER || "gemini") as ProviderId;
    const model = env.LLM_MODEL || "gemini-2.0-flash";
    const providerInfo = PROVIDERS[provider];

    if (!providerInfo) {
        return NextResponse.json({ error: `Provider "${provider}" não suportado.` }, { status: 400 });
    }

    const apiKey = env[providerInfo.keyName];
    if (!apiKey) {
        return NextResponse.json(
            { error: `Chave ${providerInfo.keyName} não configurada. Vá em Configuração.` },
            { status: 401 }
        );
    }

    const { messages } = await req.json();
    const systemPrompt = loadSystemPrompt();

    const llmMessages: LlmMessage[] = messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
    }));

    try {
        const result = await callLlm(
            { provider, model, apiKey },
            systemPrompt,
            llmMessages,
            TOOL_DECLARATIONS
        );

        return NextResponse.json({
            response: result.text || "(A IA solicitou execução de ferramentas)",
            toolCalls: result.toolCalls,
            provider,
            model,
        });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return NextResponse.json({ error: `Erro: ${message}` }, { status: 500 });
    }
}
