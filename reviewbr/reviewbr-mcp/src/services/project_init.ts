/**
 * Project Initialization Service
 * 
 * Creates research project workspaces with the correct structure,
 * protocol template, and PRISMA standard based on the research type.
 * 
 * Research types supported:
 * - Systematic Review → PRISMA 2020 + PRISMA-S
 * - Scoping Review → PRISMA-ScR
 * - Integrative Review → PRISMA 2020 (adapted)
 * - Meta-Analysis → PRISMA 2020 + PRISMA-MA
 * - Rapid Review → PRISMA-RR (when available)
 * - Exploratory / Basic Research → Simplified protocol
 */

import * as fs from "fs";
import * as path from "path";
import { DatabaseService, BlindingType, ScreeningProcess } from "./database.js";
import { ProjectStateService } from "./project_state.js";
import { escolherMetodo } from "./methods_for_type.js";
import { lerTrilha, etapaInicial, Etapa } from "./method_trail.js";
import { StandardsService } from "./standards.js";
import { fileURLToPath } from "node:url";

/** Mapeia o tipo de pesquisa do MCP para o método/framework da camada de metodologia (.claude). */

/**
 * Raiz do repositório, a partir da localização DESTE módulo — não do cwd.
 * O cwd varia conforme o cliente que sobe o MCP; foi a classe de bug que quebrou o
 * catálogo de repositórios (commit 1c697d1) e a gravação de 01_raw (DEBT-084).
 */
function repoRoot(): string {
    const mcpRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
    return path.resolve(mcpRoot, "..", "..");
}

/**
 * Os padrões que a metodologia declara cumprir, lidos do `conformance.standards` do
 * manifest (DEBT-047). Devolve [] quando a metodologia não declara — e aí o chamador cai
 * no texto antigo, em vez de afirmar conformidade que o dado não sustenta.
 */
function standardsOfMethod(methodId: string): string[] {
    try {
        const mp = path.join(repoRoot(), ".claude", "methodologies", methodId, "manifest.json");
        if (!fs.existsSync(mp)) return [];
        const man = JSON.parse(fs.readFileSync(mp, "utf-8"));
        const stds = man?.conformance?.standards;
        return Array.isArray(stds) ? stds.filter((x: unknown) => typeof x === "string") : [];
    } catch {
        return [];
    }
}

/**
 * O tipo de pesquisa FILTRA os metodos assimilados (ver services/methods_for_type.ts).
 *
 * Era um `switch` com `default: prisma-sr`: cinco dos sete tipos caiam no ramo de escape e
 * recebiam a trilha da revisao sistematica PRISMA em silencio. Agora quem declara servir a um
 * tipo e o proprio metodo, no `serves_research_types` do manifest, e tipo sem metodo assimilado
 * e RECUSA com explicacao — nunca substituicao.
 */
function mapMethod(researchType: ResearchType, escolhido?: string): { method: string; framework: string } {
    return escolherMetodo(repoRoot(), researchType, escolhido);
}

// ─── Types ───────────────────────────────────────────────────

export type ResearchType =
    | "systematic_review"
    | "scoping_review"
    | "integrative_review"
    | "meta_analysis"
    | "rapid_review"
    | "exploratory"
    | "methodological_audit";

export interface ProjectConfig {
    name: string;
    userId: string;
    researchType: ResearchType;
    topic: string;
    pico?: {
        population: string;
        intervention?: string;
        comparison?: string;
        outcome: string;
    };
    /** @deprecated Busca é global por padrão. Mantido para retrocompatibilidade. */
    searchScope?: "national" | "international" | "both";
    dateRestriction?: {
        minDate: string;
        maxDate: string;
    };
    languages?: string[];
    registrationRequired?: boolean;
    /**
     * @deprecated Nunca foi lido. O campo colapsava três coisas distintas: cegamento de
     * avaliador (ocultar autor/periódico — NÃO implementado: o prompt de triagem envia
     * repositório e data ao modelo), separação multiusuário real (declarada em `cannot`:
     * "o sistema simula separação de revisores") e triagem em duplicata por dois revisores
     * independentes — que é o que a pergunta de fato queria dizer e não é cegamento.
     * O que o PRISMA 2020 item 8 exige é esse terceiro, e ele agora é declarado no
     * protocolo como F4.1.2. Dado já gravado NÃO migra: traduzir resposta a pergunta mal
     * formulada em declaração metodológica seria inventar declaração.
     */
    blinding?: BlindingType;
    hasMetaAnalysis?: boolean;
}

export interface ProjectInitResult {
    projectId: number;
    projectPath: string;
    protocolPath: string;
    researchType: ResearchType;
    prismaStandard: string;
    registrationAdvice: string;
    searchStrategy: string;
    folderStructure: string[];
    warnings: string[];
}

// ─── Research Type Metadata ──────────────────────────────────

const RESEARCH_TYPE_META: Record<ResearchType, {
    label: string;
    prismaStandard: string;
    requiresRegistration: boolean;
    registrationPlatform: string;
    description: string;
}> = {
    systematic_review: {
        label: "Revisão Sistemática",
        prismaStandard: "PRISMA 2020 (27 itens) + PRISMA-S (16 itens)",
        requiresRegistration: true,
        registrationPlatform: "PROSPERO (https://www.crd.york.ac.uk/prospero/)",
        description: "Revisão rigorosa com metodologia pré-definida, busca exaustiva, e síntese quantitativa ou qualitativa."
    },
    scoping_review: {
        label: "Revisão de Escopo",
        prismaStandard: "PRISMA-ScR (22 itens)",
        requiresRegistration: false,
        registrationPlatform: "Opcional: OSF Registries (https://osf.io/registries)",
        description: "Mapeamento da literatura para identificar conceitos-chave, lacunas, e extensão da evidência."
    },
    integrative_review: {
        label: "Revisão Integrativa",
        prismaStandard: "PRISMA 2020 (adaptado) + Whittemore & Knafl framework",
        requiresRegistration: false,
        registrationPlatform: "Opcional: PROSPERO ou OSF",
        description: "Combina evidências de estudos experimentais e não-experimentais para compreensão abrangente de um fenômeno."
    },
    meta_analysis: {
        label: "Meta-Análise",
        prismaStandard: "PRISMA 2020 (27 itens) + PRISMA-S + Diretrizes de meta-análise estatística",
        requiresRegistration: true,
        registrationPlatform: "PROSPERO (https://www.crd.york.ac.uk/prospero/)",
        description: "Síntese estatística quantitativa de resultados de múltiplos estudos."
    },
    rapid_review: {
        label: "Revisão Rápida",
        prismaStandard: "PRISMA 2020 (simplificado) — documentar atalhos metodológicos",
        requiresRegistration: false,
        registrationPlatform: "N/A",
        description: "Revisão acelerada com etapas simplificadas para responder urgências de saúde pública ou políticas."
    },
    exploratory: {
        label: "Pesquisa Exploratória / Básica",
        prismaStandard: "Sem PRISMA — protocolo de busca livre documentado",
        requiresRegistration: false,
        registrationPlatform: "N/A",
        description: "Busca bibliográfica sem metodologia sistemática formal."
    },
    methodological_audit: {
        label: "Auditoria Metodológica (Post-Hoc)",
        prismaStandard: "PRISMA 2020 + PRISMA-S (Validação Passiva — Somente Leitura)",
        requiresRegistration: false,
        registrationPlatform: "N/A",
        description: "Validação retroativa de pesquisa já concluída. O sistema NÃO busca, baixa ou gera novos dados. Apenas diagnostica a conformidade metodológica do material submetido pelo pesquisador."
    }
};

// ─── Service ─────────────────────────────────────────────────

export class ProjectInitService {

    /**
     * Register project metadata in the central database without creating folders.
     */
    async register(config: ProjectConfig, dbService: DatabaseService): Promise<number> {
        return await dbService.registerProject({
            user_id: config.userId,
            project_name: config.name,
            project_type: config.researchType,
            topic: config.topic,
            status: "DRAFT_DESIGN",
            blinding: config.blinding || "NONE",
            has_meta_analysis: config.hasMetaAnalysis || false
        });
    }

    /**
     * Activate a project by creating its physical folder structure.
     */
    async initializeWorkspace(projectId: number, basePath: string, dbService: DatabaseService, methodId?: string): Promise<ProjectInitResult> {
        const project = await dbService.getProjectById(projectId);
        if (!project) throw new Error(`Project ${projectId} not found.`);
        if (project.status === 'LOCKED_EXECUTION') {
            throw new Error(`Project ${project.project_name} está em estado LOCKED_EXECUTION. O protocolo de pesquisa já foi iniciado e não pode ser re-inicializado. Crie um novo projeto se precisar alterar o plano.`);
        }

        const config: ProjectConfig = {
            name: project.project_name,
            userId: project.user_id,
            researchType: project.project_type as ResearchType,
            topic: project.topic || "",
            searchScope: "both",
        };

        const meta = RESEARCH_TYPE_META[config.researchType];
        const warnings: string[] = [];

        // DEBT-122/DEBT-053 — a frase "PRISMA aplicável" DERIVA do padrão, não é prosa.
        // Era string literal duplicada aqui e em index.ts, e as duas divergiam: uma dizia
        // "27 itens", a outra "27 itens, 44 subitens" (são 42 linhas) e anunciava PRISMA-P,
        // que não existe em .claude/standards/. Os critérios de uma metodologia são DELA,
        // publicados com a norma; o ReviewBR assimila e declara, não digita de memória.
        const metodo = mapMethod(config.researchType, methodId);
        const padroesDoMetodo = standardsOfMethod(metodo.method);
        const prismaStandard = padroesDoMetodo.length
            ? StandardsService.describeStandards(repoRoot(), padroesDoMetodo)
            : meta.prismaStandard;

        // DEBT-100 — a trilha é do MÉTODO, lida do manifest. `escolherMetodo` já recusou método
        // sem trilha legível; conferir de novo aqui é o que impede o projeto de nascer numa
        // etapa que ninguém declarou.
        const trilha = lerTrilha(repoRoot(), metodo.method);
        const inicial = etapaInicial(trilha.etapas);
        if (!inicial) {
            throw new Error(`A trilha do método "${metodo.method}" não tem etapa ativa: ${trilha.erros.join("; ") || "lista vazia"}.`);
        }

        // A raiz do projeto É o caminho passado (sem aninhar userId/safeName) — alinha
        // com a camada de agentes, que trabalha com o diretório absoluto do projeto.
        const projectPath = basePath;

        // Estrutura de pastas — CONTRATO UNIFICADO (consumido por flow_computer/rag_lexical e agentes)
        const isAudit = config.researchType === "methodological_audit";
        const folders = isAudit ? [
            "00_submitted",
            "audit_report",
            "logs",
        ] : [
            "01_raw",
            "02_deduplicated",
            "03_screening",
            "03_screening/pdfs",
            "04_extraction",
            "04_extraction/fulltext",
            "05_synthesis",
            "logs",
            "rag",
        ];

        for (const folder of folders) {
            fs.mkdirSync(path.join(projectPath, folder), { recursive: true });
        }

        // Protocolo na RAIZ com marcador [DRAFT] (o gate RV-01 e o guardrail leem isto)
        const protocol = this.generateProtocol(config, meta, prismaStandard, metodo.method, trilha.etapas);
        const protocolPath = path.join(projectPath, "protocol.md");
        fs.writeFileSync(protocolPath, protocol, "utf8");

        // Estado on-disk = fonte da verdade (project_state.json). O projeto nasce na primeira
        // etapa ativa da trilha do método — não numa fase escrita aqui.
        if (!isAudit) {
            ProjectStateService.init(projectPath, {
                method: metodo.method, framework: metodo.framework, reviewType: meta.label,
                topic: config.topic, userId: config.userId, phase: inicial.id,
            });
        }

        // Atualiza o SQLite como CACHE/auditoria (não é mais a fonte da verdade do estado)
        await dbService.activateProject(projectId, projectPath);

        return {
            projectId,
            projectPath,
            protocolPath,
            researchType: config.researchType,
            prismaStandard,
            registrationAdvice: meta.requiresRegistration ? "Required" : "Optional",
            searchStrategy: this.getSearchStrategy(config),
            folderStructure: folders,
            warnings,
        };
    }

    /**
     * Generate a protocol document based on research type.
     */
    private generateProtocol(
        config: ProjectConfig,
        meta: typeof RESEARCH_TYPE_META[ResearchType],
        /** Já DERIVADO do padrão em disco (DEBT-122); `meta.prismaStandard` é só fallback. */
        prismaStandard: string,
        /** Método assumido e a trilha dele, lida do manifest (DEBT-100). */
        method: string,
        etapas: Etapa[],
    ): string {
        const dateRange = config.dateRestriction
            ? `${config.dateRestriction.minDate} a ${config.dateRestriction.maxDate}`
            : "Sem restrição temporal";

        const picoSection = config.pico
            ? `## PICO/PCC

| Componente | Descrição |
|---|---|
| **População (P)** | ${config.pico.population} |
${config.pico.intervention ? `| **Intervenção (I)** | ${config.pico.intervention} |\n` : ""}${config.pico.comparison ? `| **Comparação (C)** | ${config.pico.comparison} |\n` : ""}| **Desfecho (O)** | ${config.pico.outcome} |
`
            : "";

        const langSection = config.languages && config.languages.length > 0
            ? `**Idiomas aceitos:** ${config.languages.join(", ")}`
            : "**Idiomas aceitos:** Sem restrição";

        // DEBT-100 — a lista de etapas sai da trilha do método. Era escrita aqui, F2→F6, e
        // errava a do próprio método de referência: chamava a F6 de "Síntese", quando no
        // prisma-sr a F6 é risco de viés e a síntese é a F7. Etapa que não se aplica ao
        // método aparece riscada e com o motivo — declarada, não omitida.
        const trilhaTexto = etapas.length
            ? etapas.map((e, i) => e.active
                ? `${i + 1}. **${e.id} — ${e.name}** (executa: \`${e.role}\`)`
                : `${i + 1}. ~~${e.id} — ${e.name}~~ — não se aplica a este método: ${e.note}`).join("\n")
            : "[SEM TRILHA DECLARADA]";

        return `# Protocolo — ${config.name}

**Status**: [DRAFT] <!-- muda para [LOCKED] na aprovação (submit_protocol_for_approval) -->

> ⚠️ Projeto em rascunho: a busca fica bloqueada até o protocolo ser aprovado.
> Preencha as seções com [PREENCHIMENTO OBRIGATÓRIO] e solicite a aprovação.

**Tipo de pesquisa:** ${meta.label}
**PRISMA aplicável:** ${prismaStandard}
**Data do protocolo:** ${new Date().toISOString().split("T")[0]}

## Objetivo

${config.topic}

## Justificativa
[PREENCHIMENTO OBRIGATÓRIO: por que esta pesquisa é necessária agora.]

## Revisões Anteriores
[PREENCHIMENTO OBRIGATÓRIO: revisões que já existem sobre o tema e por que uma nova se justifica — ou "nenhuma encontrada", com onde se procurou.]

## Lacuna
[PREENCHIMENTO OBRIGATÓRIO: o que a literatura ainda não respondeu.]

## Relevância
[PREENCHIMENTO OBRIGATÓRIO: para quem o resultado importa e que uso ele terá.]

${picoSection}

## Critérios de Elegibilidade

### Critérios de Inclusão
[PREENCHIMENTO OBRIGATÓRIO: Liste 2 a 3 critérios claros do que DEVE estar no artigo para ele ser aceito. Ex: "Estudos que aplicaram deep learning", "Estudos em humanos"]

### Critérios de Exclusão
[PREENCHIMENTO OBRIGATÓRIO: Liste 2 a 3 critérios claros do que ELIMINA o artigo. Ex: "Revisões de literatura", "Estudos em animais", "Artigos sem texto completo disponível"]

**Escopo de busca:** Global (todas as fontes disponíveis)
**Período:** ${dateRange}
${langSection}

## Fontes de Busca

${this.getSearchSourcesSection(config)}

## Estratégia de Busca (Sintaxe)
[PREENCHIMENTO OBRIGATÓRIO: Escreva a string de busca exata utilizando operadores booleanos (AND, OR). Use parênteses para agrupar as lógicas. Ex. de FORMA, não de tema: (<termo> OR <sinônimo>) AND (<conceito> OR <variante>)]

## Processo de Seleção

Trilha do método \`${method}\`, lida de \`.claude/methodologies/${method}/manifest.json\` — a ordem das etapas e o papel que executa cada uma são do método:

${trilhaTexto}

**Declaração do processo de triagem** (obrigatória antes de travar):
   - **F4.1.2 Processo de triagem:** [PREENCHIMENTO OBRIGATÓRIO: Individual | Duplo independente | Duplo com desempate. Quem aplica os critérios a cada registro, e quantos aplicam de forma independente.]
   - **F4.1.3 Ferramenta utilizada:** [PREENCHIMENTO OBRIGATÓRIO: que sistema, software ou planilha executa a triagem, e em que etapa. É detalhe de execução, não substitui o processo declarado acima.]
   - **Resolução de discordâncias:** [PREENCHIMENTO OBRIGATÓRIO: como as divergências entre triadores são resolvidas — ou "não se aplica (triagem individual)".]
   - Fase 1: Triagem por título e resumo
   - Fase 2: Leitura de texto completo

## Registro de Protocolo

${meta.requiresRegistration
                ? `**Status:** Pendente de registro no ${meta.registrationPlatform}`
                : `**Status:** Registro ${config.registrationRequired ? "planejado" : "não obrigatório"} (${meta.registrationPlatform})`}

## Auditoria PRISMA

Checklist ${prismaStandard} será preenchido ao final do estudo.
`;
    }

    /**
     * Get search sources section — always lists ALL available sources.
     * Science has no borders. Regional filtering only if researcher explicitly requests.
     */
    private getSearchSourcesSection(config: ProjectConfig): string {
        return `### Fontes Científicas Globais
- OpenAlex (maior índice aberto do mundo)
- PubMed / MEDLINE (ciências da saúde)
- Crossref (metadados de DOIs)
- Semantic Scholar (IA + grafo de citações)
- CORE (maior agregador Open Access)
- Europe PMC (ciências da vida — Europa)

### Fontes Latino-Americanas e Brasileiras
- SciELO (América Latina, Open Access)
- BVS / LILACS / BDENF (saúde — BIREME)
- OasisBR (portal brasileiro de publicações)
- BDTD (teses e dissertações brasileiras)
- Repositórios institucionais (via Registry ReviewBR)`;
    }

    /**
     * Get search strategy recommendation — always global, all sources.
     */
    private getSearchStrategy(config: ProjectConfig): string {
        const dateNote = config.dateRestriction
            ? `, minDate: "${config.dateRestriction.minDate}", maxDate: "${config.dateRestriction.maxDate}"`
            : " (sem restrição temporal)";

        return [
            `→ search_openalex (OpenAlex${dateNote})`,
            `→ search_pubmed (PubMed/MEDLINE${dateNote})`,
            `→ search_crossref (Crossref)`,
            `→ search_semanticscholar (Semantic Scholar)`,
            `→ search_core (CORE Open Access)`,
            `→ search_europe_pmc (Europe PMC)`,
            `→ search_scielo (SciELO)`,
            `→ search_papers_optimized (BVS/LILACS/OasisBR)`,
            `→ search_repository (repositórios institucionais)`,
            `→ deduplicate_dataset`,
            `→ screen_candidates (conforme o processo declarado no protocolo, F4.1.2)`,
            `→ get_screening_report (métricas de saturação)`,
            `→ snowball_search (se aplicável)`,
        ].join("\n");
    }

    /**
     * Returns the questions the coordinator should ask before starting a project.
     */
    static getProjectQuestions(): string {
        return `## Perguntas Obrigatórias para Planejamento

1. **Qual o tipo de pesquisa?**
   - Revisão Sistemática
   - Revisão de Escopo (Scoping Review)
   - Revisão Integrativa
   - Meta-Análise
   - Revisão Rápida
   - Pesquisa Exploratória / Básica

2. **Qual o tema/objetivo principal?**

3. **Qual o framework (PICO/PCC)?**
   - P (População): ?
   - I (Intervenção) ou C (Conceito): ?
   - C (Comparação) ou C (Contexto): ?
   - O (Desfecho/Outcome): ?

4. **Confirmar escopo de busca:**
   A busca será realizada em TODAS as fontes disponíveis (globais + latino-americanas + brasileiras).
   Deseja restringir a alguma região ou base específica? (Padrão: busca global)

5. **Restrição temporal?**
   - Sem restrição (toda a literatura)
   - De [ano] até [ano]

6. **Idiomas aceitos?**
   - Português, Inglês, Espanhol (padrão)
   - Outros

7. **Necessita registro de protocolo?**
   - PROSPERO (obrigatório para SR/MA)
   - OSF Registries (opcional)
   - Não

8. **Processo de triagem (PRISMA 2020 item 8)?**
   - Individual (um triador aplica os critérios a cada registro)
   - Duplo independente (dois triadores aplicam em paralelo, sem ver a decisão do outro)
   - Duplo com desempate (duplo independente + terceiro resolve as divergências)

   E, à parte: que **ferramenta** executa a triagem? A ferramenta é detalhe de execução —
   ela não define o processo nem o torna mais ou menos publicável.

9. **Inclui metanálise?**
   - Sim (síntese estatística quantitativa)
   - Não`;
    }

    /**
     * Recomendação de desenho a partir do TIPO de revisão.
     *
     * `suggestScreeningProcess` é o F4.1.2 da spec (PRISMA 2020 item 8): quantos triadores
     * aplicam os critérios e se trabalham de forma independente. NÃO é cegamento — cegar o
     * avaliador é ocultar dele autor, periódico ou resultados, coisa que este sistema não
     * faz (o prompt de triagem envia repositório e data ao modelo) e que nenhuma norma exige
     * na triagem. O campo antigo chamava "duplo cego" o que é triagem em duplicata.
     *
     * A recomendação deriva do `researchType`, que é categoria metodológica. NÃO deriva de
     * palavra-chave do tema: inferir método a partir de domínio quebra o princípio de que o
     * sistema é agnóstico a domínio, e `tests/integracao.test.ts` reprova termo temático no
     * código. A metanálise segue sugerida por desfecho quantitativo porque isso é
     * propriedade do DADO a sintetizar, não do assunto da revisão.
     */
    static getDesignAdvice(topic: string, researchType: ResearchType): {
        suggestScreeningProcess: ScreeningProcess;
        suggestMetaAnalysis: boolean;
        advice: string[];
    } {
        const lowerTopic = topic.toLowerCase();
        const advice: string[] = [];
        let suggestScreeningProcess: ScreeningProcess = "INDIVIDUAL";
        let suggestMetaAnalysis = false;

        // Keywords that suggest quantitative outcomes (meta-analysis candidates)
        const quantitativeKeywords = [
            "prevalence", "prevalência", "incidence", "incidência",
            "mortality", "mortalidade", "survival", "sobrevida",
            "risk", "risco", "odds ratio", "razão de chances",
            "hazard", "relative risk", "risco relativo",
            "effect size", "tamanho do efeito",
            "outcome", "desfecho",
            "cohort", "coorte", "case-control", "caso-controle",
        ];

        const hasQuantitativeIndicators = quantitativeKeywords.some(kw => lowerTopic.includes(kw));

        // Research type-based suggestions
        if (researchType === "systematic_review" || researchType === "meta_analysis") {
            suggestScreeningProcess = "DUPLO_COM_DESEMPATE";
            advice.push(
                "⚖️ **Triagem em duplicata recomendada**: revisões sistemáticas de alta evidência usam " +
                "dois triadores independentes, com desempate declarado — e relatam a concordância entre eles " +
                "(PRISMA 2020 item 8; Cochrane MECIR C40-C41). Declare o processo no protocolo (F4.1.2); " +
                "a ferramenta que o executa é item separado (F4.1.3)."
            );
        }

        if (researchType === "meta_analysis") {
            suggestMetaAnalysis = true;
            advice.push(
                "📊 **Metanálise Ativada**: Tipo de pesquisa selecionado como Meta-Análise. Os dados deverão ser estruturados para síntese estatística."
            );
        }

        if (hasQuantitativeIndicators && !suggestMetaAnalysis && researchType !== "exploratory" && researchType !== "rapid_review") {
            suggestMetaAnalysis = true;
            advice.push(
                "📈 **Metanálise Sugerida**: O tema menciona desfechos quantitativos (prevalência, risco, etc.). " +
                "Se houver estudos suficientes com dados comparáveis, uma metanálise fortalecerá as conclusões."
            );
        }

        if (researchType === "scoping_review") {
            // A JBI recomenda duplicata também em revisão de escopo; o desempate formal é
            // que costuma não se aplicar. Metanálise não se aplica por definição.
            suggestScreeningProcess = "DUPLO_INDEPENDENTE";
            suggestMetaAnalysis = false;
            advice.push(
                "📋 **Revisão de Escopo**: metanálise não se aplica. A triagem em duplicata continua " +
                "recomendada (JBI); declare em F4.1.2 o processo que de fato usar."
            );
        }

        if (researchType === "exploratory") {
            suggestScreeningProcess = "INDIVIDUAL";
            suggestMetaAnalysis = false;
            advice.push(
                "🔍 **Pesquisa Exploratória**: sem exigência de duplicata nem de metanálise; triagem " +
                "individual é adequada, desde que declarada. Hoje este tipo é conduzido pela trilha do " +
                "método que o serve — não por protocolo livre."
            );
        }

        if (advice.length === 0) {
            advice.push(
                "ℹ️ Sem recomendação automática para este tipo de revisão. Declare no protocolo o " +
                "processo de triagem (F4.1.2) e a ferramenta (F4.1.3): o gate exige ambos antes de travar."
            );
        }

        return { suggestScreeningProcess, suggestMetaAnalysis, advice };
    }
}
