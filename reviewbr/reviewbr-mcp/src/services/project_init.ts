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
import { DatabaseService, BlindingType } from "./database.js";

// ─── Types ───────────────────────────────────────────────────

export type ResearchType =
    | "systematic_review"
    | "scoping_review"
    | "integrative_review"
    | "meta_analysis"
    | "rapid_review"
    | "exploratory";

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
    searchScope: "national" | "international" | "both";
    dateRestriction?: {
        minDate: string;
        maxDate: string;
    };
    languages?: string[];
    registrationRequired?: boolean;
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
            status: "DRAFT",
            blinding: config.blinding || "NONE",
            has_meta_analysis: config.hasMetaAnalysis || false
        });
    }

    /**
     * Activate a project by creating its physical folder structure.
     */
    async initializeWorkspace(projectId: number, basePath: string, dbService: DatabaseService): Promise<ProjectInitResult> {
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

        // Create project directory name
        const safeName = config.name
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, "_")
            .replace(/_+/g, "_");
        const userPath = path.join(basePath, config.userId);
        const projectPath = path.join(userPath, safeName);

        // Create folder structure
        const folders = [
            "00_protocol",
            "01_raw",
            "01_raw/downloads",
            "02_deduplicated",
            "03_screening",
            "03_screening/included",
            "03_screening/excluded",
            "04_audit",
            "05_extraction",
            "06_synthesis",
            "logs",
            "scripts",
        ];

        for (const folder of folders) {
            fs.mkdirSync(path.join(projectPath, folder), { recursive: true });
        }

        // Generate protocol (minimal for now)
        const protocol = this.generateProtocol(config, meta);
        const protocolPath = path.join(projectPath, "00_protocol", "protocol.md");
        fs.writeFileSync(protocolPath, protocol, "utf8");

        // Update database
        await dbService.activateProject(projectId, projectPath);

        return {
            projectId,
            projectPath,
            protocolPath,
            researchType: config.researchType,
            prismaStandard: meta.prismaStandard,
            registrationAdvice: meta.requiresRegistration ? "Required" : "Optional",
            searchStrategy: this.getSearchStrategy(config),
            folderStructure: folders,
            warnings,
        };
    }

    /**
     * Generate a protocol document based on research type.
     */
    private generateProtocol(config: ProjectConfig, meta: typeof RESEARCH_TYPE_META[ResearchType]): string {
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

        return `# Protocolo — ${config.name}

**Tipo de pesquisa:** ${meta.label}
**PRISMA aplicável:** ${meta.prismaStandard}
**Data do protocolo:** ${new Date().toISOString().split("T")[0]}

## Objetivo

${config.topic}

${picoSection}
## Critérios de Elegibilidade

**Escopo de busca:** ${config.searchScope === "national" ? "Nacional (repositórios brasileiros)" : config.searchScope === "international" ? "Internacional (PubMed, Scopus, WoS)" : "Nacional + Internacional"}
**Período:** ${dateRange}
${langSection}

## Fontes de Busca

${this.getSearchSourcesSection(config)}

## Estratégia de Busca

Strings de busca a serem definidas com base nos descritores DeCS/MeSH do tema.

## Processo de Seleção

1. **F2 — Mineração:** Busca nas fontes definidas
2. **F3 — Deduplicação:** Remoção de duplicatas (DOI + título)
3. **F4 — Triagem:**
   - Fase 1: Triagem por título e resumo (IA + revisão manual)
   - Fase 2: Leitura de texto completo
4. **F5 — Extração:** Extração de dados estruturados
5. **F6 — Síntese:** ${config.researchType === "meta_analysis" ? "Síntese estatística (meta-análise)" : "Síntese narrativa/temática"}

## Registro de Protocolo

${meta.requiresRegistration
                ? `**Status:** Pendente de registro no ${meta.registrationPlatform}`
                : `**Status:** Registro ${config.registrationRequired ? "planejado" : "não obrigatório"} (${meta.registrationPlatform})`}

## Auditoria PRISMA

Checklist ${meta.prismaStandard} será preenchido ao final do estudo.
`;
    }

    /**
     * Get search sources section based on scope.
     */
    private getSearchSourcesSection(config: ProjectConfig): string {
        const sections: string[] = [];

        if (config.searchScope === "national" || config.searchScope === "both") {
            sections.push(`### Fontes Nacionais
- BDTD (Biblioteca Digital Brasileira de Teses e Dissertações)
- OasisBR (Portal Brasileiro de Publicações Científicas)
- SciELO Brasil
- Repositórios institucionais (via Registry)`);
        }

        if (config.searchScope === "international" || config.searchScope === "both") {
            sections.push(`### Fontes Internacionais
- PubMed / MEDLINE (via E-utilities)
- Scopus (pendente integração)
- Web of Science (pendente integração)
- OpenAlex (via Snowballing)`);
        }

        return sections.join("\n\n");
    }

    /**
     * Get search strategy recommendation.
     */
    private getSearchStrategy(config: ProjectConfig): string {
        const parts: string[] = [];

        if (config.searchScope === "national" || config.searchScope === "both") {
            parts.push("→ search_papers_optimized (repositórios brasileiros, Layers 1-5)");
        }
        if (config.searchScope === "international" || config.searchScope === "both") {
            const dateNote = config.dateRestriction
                ? `, minDate: "${config.dateRestriction.minDate}", maxDate: "${config.dateRestriction.maxDate}"`
                : " (sem restrição temporal — busca completa)";
            parts.push(`→ search_pubmed (PubMed/MEDLINE${dateNote})`);
        }
        parts.push("→ deduplicate_dataset");
        parts.push("→ screen_candidates (com filtros conforme protocolo)");
        parts.push("→ expand_search_snowball (se aplicável)");

        return parts.join("\n");
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

4. **Escopo de busca:**
   - Nacional (repos brasileiros)
   - Internacional (PubMed, Scopus, etc.)
   - Ambos

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

8. **Cegamento da revisão?**
   - Nenhum (NONE)
   - Cego simples (SINGLE_BLIND — um revisor independente)
   - Duplo cego (DOUBLE_BLIND — dois revisores independentes)

9. **Inclui metanálise?**
   - Sim (síntese estatística quantitativa)
   - Não`;
    }

    /**
     * Proactive design advice based on topic keywords and research type.
     * Returns recommendations about blinding and meta-analysis.
     */
    static getDesignAdvice(topic: string, researchType: ResearchType): {
        suggestBlinding: BlindingType;
        suggestMetaAnalysis: boolean;
        advice: string[];
    } {
        const lowerTopic = topic.toLowerCase();
        const advice: string[] = [];
        let suggestBlinding: BlindingType = "NONE";
        let suggestMetaAnalysis = false;

        // Keywords that suggest clinical/intervention studies
        const clinicalKeywords = [
            "treatment", "tratamento", "therapy", "terapia",
            "efficacy", "eficácia", "effectiveness", "efetividade",
            "clinical trial", "ensaio clínico", "intervention", "intervenção",
            "drug", "medicamento", "fármaco", "pharmaceutical",
            "randomized", "randomizado", "placebo",
            "dosage", "dose", "posologia",
            "surgical", "cirúrgico", "cirurgia",
        ];

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

        const hasClinicalIndicators = clinicalKeywords.some(kw => lowerTopic.includes(kw));
        const hasQuantitativeIndicators = quantitativeKeywords.some(kw => lowerTopic.includes(kw));

        // Research type-based suggestions
        if (researchType === "systematic_review" || researchType === "meta_analysis") {
            suggestBlinding = "DOUBLE_BLIND";
            advice.push(
                "⚖️ **Cegamento Duplo Recomendado**: Revisões sistemáticas de alta evidência devem ter pelo menos dois revisores independentes na triagem e extração."
            );
        }

        if (researchType === "meta_analysis") {
            suggestMetaAnalysis = true;
            advice.push(
                "📊 **Metanálise Ativada**: Tipo de pesquisa selecionado como Meta-Análise. Os dados deverão ser estruturados para síntese estatística."
            );
        }

        // Topic-based suggestions
        if (hasClinicalIndicators && researchType !== "meta_analysis" && researchType !== "exploratory") {
            if (suggestBlinding !== "DOUBLE_BLIND") {
                suggestBlinding = "DOUBLE_BLIND";
            }
            advice.push(
                "🔬 **Tema Clínico Detectado**: O tema " +
                "sugere estudos de intervenção/tratamento. Considere cegamento duplo para reduzir viés de seleção."
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
            suggestBlinding = "NONE";
            suggestMetaAnalysis = false;
            advice.push(
                "📋 **Revisão de Escopo**: Cegamento e metanálise geralmente não se aplicam. Foco no mapeamento da literatura."
            );
        }

        if (researchType === "exploratory") {
            suggestBlinding = "NONE";
            suggestMetaAnalysis = false;
            advice.push(
                "🔍 **Pesquisa Exploratória**: Sem requisitos formais de cegamento ou metanálise."
            );
        }

        if (advice.length === 0) {
            advice.push(
                "ℹ️ Não foram detectadas palavras-chave específicas. Revise manualmente se cegamento ou metanálise se aplicam ao tema."
            );
        }

        return { suggestBlinding, suggestMetaAnalysis, advice };
    }
}
