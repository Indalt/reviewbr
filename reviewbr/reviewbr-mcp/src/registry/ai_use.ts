/**
 * ai_use — que tool usa automação, de que classe, e sob que categoria do RAISE 3.
 *
 * POR QUE EXISTE
 * --------------
 * O sistema usa IA e não declarava sob que norma (DEBT-131). O RAISE 3 classifica o uso
 * **por tarefa e por classe de ferramenta** — e isso corrige um erro de escopo: não é norma
 * de LLM, é norma de **automação**. A Tabela 2 distingue `rule-based`, `unsupervised`,
 * `supervised ML`, `generative LLM`, `agentic AI`, `hybrid` e `conversational`.
 *
 * O ReviewBR usa pelo menos quatro modos: LLM generativo, ML/aprendizado ativo, busca léxica
 * estatística (BM25) e similaridade algorítmica. Um mapa só de LLM deixaria três de fora.
 *
 * FAIL-CLOSED, E É O PONTO
 * ------------------------
 * Tool que usa automação e não está aqui **não roda em projeto**. Não é rigor decorativo: o
 * pesquisador declarou que *"podem existir outros modos de usar IA que ainda não sei"*, e um
 * mapa que libera por omissão é um mapa que não protege do desconhecido. O teste de
 * integração varre `src/` atrás de rota de automação não mapeada e reprova — para a lacuna
 * aparecer na suíte, não numa revisão.
 *
 * A CATEGORIA É DO RAISE, NÃO NOSSA. Cada entrada cita a linha da Tabela 2 que a sustenta
 * (`raise_row`), e `.claude/standards/raise-3.json` guarda a tabela como dado. Mudou a norma,
 * muda o dado — e as linhas aqui passam a divergir, o que é detectável.
 */

/** As 5 categorias de recomendação do RAISE 3 (Tabela 1), na ordem publicada. */
export type RaiseCategory =
    | "C1"  // Acceptable for use
    | "C2"  // Human verification required
    | "C3"  // Requires validation within the review
    | "C4"  // Exploratory and supplementary use
    | "C5"; // Not acceptable for use

/** Classes de ferramenta que a Tabela 2 distingue. */
export type ToolClass =
    | "rule-based"
    | "unsupervised"
    | "supervised-ml"
    | "generative-llm"
    | "agentic-ai"
    | "hybrid"
    | "conversational";

export interface AiUse {
    /** Tarefa, no vocabulário do RAISE — não no nosso. */
    task: string;
    tool_class: ToolClass;
    category: RaiseCategory;
    /** Linha da Tabela 2 que sustenta a classificação (T01..T45 em raise-3.json). */
    raise_row: string;
    /** Por que esta tool cai nesta linha. Verificável contra o código. */
    nota: string;
}

/**
 * O mapa. Toda tool que invoca automação precisa estar aqui — inclusive as de classe
 * `rule-based`, que são aceitáveis: declarar o aceitável é o que distingue "classificado
 * como seguro" de "nunca classificado".
 */
export const AI_USE: Record<string, AiUse> = {
    screen_candidates: {
        task: "Screening for relevance — study selection",
        tool_class: "generative-llm",
        category: "C3",
        raise_row: "T21",
        nota: "Decide inclusão por LLM sobre título/resumo ou texto completo. O RAISE exige " +
            "limiar pré-especificado e comparador apropriado, avaliados DENTRO da revisão.",
    },
    batch_db_screen: {
        task: "Screening for relevance — study selection",
        tool_class: "generative-llm",
        category: "C3",
        raise_row: "T21",
        nota: "Com useLlm=true decide relevância por LLM, hoje sem trilha de auditoria " +
            "(DEBT-117). Mesma tarefa do screen_candidates, logo mesma exigência.",
    },
    batch_llm_extract: {
        task: "Data extraction — named entity / quantitative extraction",
        tool_class: "generative-llm",
        category: "C3",
        raise_row: "T28/T29",
        nota: "O RAISE pede avaliação cuidadosa dos TIPOS DE ERRO — fabricações, valores " +
            "incorretos e dados faltantes —, não só de acurácia agregada.",
    },
    rag_query: {
        task: "Exploring the literature",
        tool_class: "rule-based",
        category: "C1",
        raise_row: "T02",
        nota: "Apesar do nome, é BM25 LÉXICO, não semântico nem LLM (registrado em " +
            "system-audit/SKILL.md). Classificar pelo nome o poria em C3 indevidamente — a " +
            "classe se conclui do código.",
    },
    rag_index_corpus: {
        task: "Exploring the literature",
        tool_class: "rule-based",
        category: "C1",
        raise_row: "T02",
        nota: "Indexação léxica do corpus; nenhuma decisão de conteúdo.",
    },
    batch_keyword_screen: {
        task: "Screening for relevance — study selection (dictionary-based)",
        tool_class: "rule-based",
        category: "C3",
        raise_row: "T17",
        nota: "Dicionário de termos aplicado a decisão de seleção. O RAISE classifica " +
            "rule-based em study selection como C3: dicionários não se adaptam a " +
            "terminologia nova, então exigem validação na revisão.",
    },
    deduplicate_dataset: {
        task: "The Search — duplicate removal",
        tool_class: "rule-based",
        category: "C1",
        raise_row: "T16",
        nota: "Hierarquia DOI > título+ano > similaridade. O RAISE pede que a ferramenta " +
            "permita baixar os pares duplicados para transparência — o sistema grava " +
            "dedupe_pairs.json.",
    },
    translate_document: {
        task: "Text Generation — machine translation of non-English studies",
        tool_class: "generative-llm",
        category: "C2",
        raise_row: "T43",
        nota: "O RAISE registra que a tradução automática ajuda mas não é suficientemente " +
            "acurada para tarefas complexas: exige verificação humana da saída.",
    },
    expand_search_snowball: {
        task: "The Search — citation chasing",
        tool_class: "rule-based",
        category: "C1",
        raise_row: "T10",
        nota: "Rastreio por grafo de citação. O RAISE alerta para viés de citação — obra mais " +
            "antiga ou mais citada é recuperada com mais frequência.",
    },
    assess_research_design: {
        task: "Developing a protocol — question formulation",
        tool_class: "rule-based",
        category: "C2",
        raise_row: "T01",
        nota: "Hoje classifica o tipo de revisão por regex sobre a intenção, sem LLM. A " +
            "sugestão apoia a formulação da pergunta e é do pesquisador decidir — por isso C2.",
    },
};

export interface AiGateResult {
    blocked: boolean;
    /** Mensagem para a resposta da tool. Vazia quando não há nada a declarar. */
    message: string;
    use: AiUse | null;
}

/**
 * Verifica o uso de IA de uma tool contra o RAISE 3.
 *
 * Ordem deliberada:
 *  1. tool sem automação → passa, sem ruído;
 *  2. tool com automação e **sem classificação** → BLOQUEIA (fail-closed);
 *  3. categoria C5 → BLOQUEIA sempre;
 *  4. C2/C4 → passa declarando o que o pesquisador precisa fazer com a saída;
 *  5. C3 → passa aqui, e a exigência de limiar é conferida no protocolo — porque
 *     "pré-especificado" só é verificável contra um artefato com trava de anterioridade,
 *     e esse artefato é o `protocol.md` (RV-01), nunca o manifest.
 *
 * `usaAutomacao` é informado por quem chama: só a tool sabe se de fato acionou o provedor
 * (ex.: `batch_db_screen` usa LLM apenas com `useLlm=true`).
 */
export function checarUsoDeIA(toolName: string, usaAutomacao: boolean): AiGateResult {
    if (!usaAutomacao) return { blocked: false, message: "", use: null };

    const use = AI_USE[toolName];
    if (!use) {
        return {
            blocked: true,
            use: null,
            message:
                `🚫 USO DE IA NÃO CLASSIFICADO — a tool "${toolName}" aciona automação e não está ` +
                "no mapa do RAISE 3 (src/registry/ai_use.ts). Nega por padrão: automação não " +
                "classificada não roda em projeto. Classifique a tarefa contra a Tabela 2 de " +
                "`.claude/standards/raise-3.json` antes de usá-la.",
        };
    }

    if (use.category === "C5") {
        return {
            blocked: true,
            use,
            message:
                `🚫 RAISE 3 — "${use.task}" é NÃO ACEITÁVEL (categoria C5, linha ${use.raise_row}). ` +
                "A norma diz que estas saídas devem ser consideradas não confiáveis e não usadas " +
                `em nenhum contexto formal de revisão. ${use.nota}`,
        };
    }

    const exigencia: Record<Exclude<RaiseCategory, "C5">, string> = {
        C1: "uso aceitável; declare limitações e vieses conhecidos",
        C2: "VERIFICAÇÃO HUMANA NECESSÁRIA — um humano precisa ler e corrigir a saída INTEIRA antes do uso",
        C3: "EXIGE VALIDAÇÃO DENTRO DA REVISÃO — o desempenho precisa ser avaliado contra limiar " +
            "pré-especificado e comparador apropriado, declarados no protocolo ANTES de ver os dados",
        C4: "USO EXPLORATÓRIO E SUPLEMENTAR — não substitui processo estabelecido",
    };

    return {
        blocked: false,
        use,
        message:
            `ℹ️ RAISE 3 · ${use.task} [${use.tool_class}] = ${use.category} (linha ${use.raise_row}): ` +
            `${exigencia[use.category as Exclude<RaiseCategory, "C5">]}.`,
    };
}
