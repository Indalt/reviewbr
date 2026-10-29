import * as fs from "node:fs";
import * as path from "node:path";
import { StandardsService, Standard, CoverageReport, declaracaoDe } from "./standards.js";
import { MappingCoherenceService, Suspeito } from "./mapping_coherence.js";
import { lerTrilha, subitensDaSpec, etapaDoSubitem, errosDaTrilha } from "./method_trail.js";
import { MethodologyCatalogService } from "./methodology_catalog.js";
import { AgentOrchestrator } from "../registry/agent_orchestrator.js";

/**
 * standard_coverage — a cobertura de um padrão passa a ser CONFERIDA, não só declarada (DEBT-140).
 *
 * POR QUE EXISTE
 * --------------
 * `check_standard_coverage` testava uma coisa: se `covered_by` estava vazio. Como `covered_by`
 * é dado fixo e versionado, a resposta era a mesma para qualquer projeto, sempre — verde por
 * construção. Foi assim que o PRISMA-P saiu 26/26 quando o honesto é 12/26.
 *
 * AS QUATRO CONFERÊNCIAS
 * ----------------------
 *   (a) o subitem apontado EXISTE na spec do método, numa etapa que SE APLICA a ele .... mecânica
 *   (b) o rótulo do subitem NÃO CONTRADIZ o item ............................ por falsificação
 *   (c) alguma tool PRODUZ o artefato das etapas que cobrem a linha ........... parcial: por etapa
 *   (d) a ausência está DECLARADA, não preenchida com encaixe ................ mecânica (`checkCoverage`)
 *
 * (a), (b) e (c) dependem do MÉTODO: os ids de `covered_by` são subitens da trilha de um método,
 * e quem os define é a spec dele. Por isso a conferência roda contra os métodos PRONTOS que
 * DECLARAM o padrão em `conformance.standards`, e a fração sai POR MÉTODO — um método não
 * contamina o número do outro. Padrão que nenhum método declara é dito assim, não conferido
 * contra uma trilha qualquer; esqueleto do scaffold que o declare é relatado à parte.
 *
 * O QUE NÃO É MECANIZÁVEL vai escrito AO LADO do resultado (`limite`), e a PREMISSA da
 * falsificação também (`premissa_da_falsificacao`): quem lê o veredito precisa saber sob que
 * premissa ele foi dado. O sistema falsifica; quem afirma é quem assimila.
 */

export const PREMISSA_DA_FALSIFICACAO =
    "Um rótulo da trilha que não tem conceito em comum com o título oficial do item que declara cobrir, " +
    "e que casa com exatamente UM outro item do mesmo padrão (item e seus subitens contam como um só), é " +
    "tratado como DESLOCAMENTO. É premissa derrotável: duas coisas podem se parecer sem haver " +
    "deslocamento — o suspeito é pedido de leitura, não prova de erro.";

export const LIMITE_DA_CONFERENCIA =
    "A máquina não julga se o mapeamento está CERTO: isso é leitura da norma, e é humana — o sistema " +
    "falsifica, quem afirma é quem assimila. A falsificação compara o rótulo com o TÍTULO do item, não " +
    "com o enunciado; acha deslocamento (rótulo apontando o item vizinho), não encaixe (item apontado " +
    "para campo que não coleta o que ele pede) — encaixe só aparece se quem assimila o declarar " +
    "[NÃO COBERTO]. Ponteiro que a falsificação não leu fica em `nao_conferidos`, sem verificação. " +
    "A conferência (c) é por ETAPA, não por campo: a linha só conta como produzida por código quando " +
    "TODAS as etapas que a cobrem têm tool produtora; com só algumas, é `parcial`. " +
    "As declarações e o mapeamento moram no arquivo do PADRÃO e valem para todo método que o declara: " +
    "[NÃO SE APLICA] é de toda pesquisa que declara o padrão — não há, ainda, declaração por método nem " +
    "por projeto; e um método de trilha própria não tem onde declarar o seu mapeamento sem quebrar o dos outros.";

export interface ConferenciaDoMetodo {
    metodologia: string;
    /** O método traz este padrão em `conformance.standards`? */
    declara_o_padrao: boolean;
    /** (a) ponteiros de `covered_by` para subitem que a spec do método não define. */
    subitens_inexistentes: Array<{ item: string; subitem: string }>;
    /** (a) ponteiros para subitem de etapa que o método declara NÃO se aplicar a ele. */
    em_etapa_que_nao_se_aplica: Array<{ item: string; subitem: string; etapa: string }>;
    /** (b) falsificação do rótulo contra o título oficial. */
    falsificacao: {
        com_poder: boolean;
        motivo_sem_poder: string;
        pares_conferidos: number;
        suspeitos: Suspeito[];
        nao_conferidos: string[];
    };
    /** (c) quem produz o artefato das etapas que cobrem cada linha. */
    producao: {
        /** todas as etapas da linha têm tool produtora */
        por_codigo: string[];
        /** só algumas têm — a parte restante fica com o agente */
        parcial: string[];
        /** nenhuma tem: só o agente grava */
        so_por_agente: string[];
        /** os subitens da linha não pertencem a etapa alguma (ex.: suplementos SUP.x) */
        sem_etapa: string[];
        /** Etapas da trilha cujo artefato de encerramento nenhuma tool grava. */
        etapas_sem_codigo: Array<{ etapa: string; artefato: string }>;
    };
    /** Linhas com correspondência não contestada NESTE método. */
    corresponde: number;
    /** "16/42" para este método: correspondência não contestada sobre as linhas que se aplicam. */
    fracao: string;
    contestados: Array<{ item: string; por: string }>;
    /**
     * Que itens do padrão cada etapa atende, NESTE método — só correspondência não contestada.
     * É a fonte do "porquê da etapa" que os agentes explicam (DEBT-126): ancorar o porquê na
     * coluna "Item" da spec ensinaria pares deslocados e, num método de escopo, a numeração
     * do PRISMA 2020 em vez da do padrão que o método declara.
     */
    itens_por_etapa: Record<string, string[]>;
    erros: string[];
}

export interface RelatorioCobertura extends CoverageReport {
    standard_id: string;
    /** Correspondências não contestadas — o menor número entre os métodos conferidos. */
    corresponde: number;
    /** Correspondências declaradas que (a) ou (b) contestaram, com o porquê e o método. */
    contestados: Array<{ item: string; por: string }>;
    /** Um método: "12/26". Vários: a fração de cada um — nunca uma soma que misture trilhas. */
    fracao: string;
    /** Métodos PRONTOS que declaram este padrão em `conformance.standards`. */
    declarado_por: string[];
    /** Esqueletos do scaffold (trilha por declarar ou spec sem subitens) que o declaram. */
    declarado_por_esqueleto: string[];
    conferencia_por_metodo: ConferenciaDoMetodo[];
    premissa_da_falsificacao: string;
    limite: string;
    avisos: string[];
}

function declarantes(repoRoot: string, standardId: string): { prontos: string[]; esqueletos: string[] } {
    const base = path.join(repoRoot, ".claude", "methodologies");
    if (!fs.existsSync(base)) return { prontos: [], esqueletos: [] };
    const prontos: string[] = [], esqueletos: string[] = [];
    for (const e of fs.readdirSync(base, { withFileTypes: true })) {
        if (!e.isDirectory()) continue;
        try {
            const man = JSON.parse(fs.readFileSync(path.join(base, e.name, "manifest.json"), "utf-8"));
            if (!Array.isArray(man?.conformance?.standards) || !man.conformance.standards.includes(standardId)) continue;
            // Esqueleto não conduz pesquisa: conferir o padrão contra ele contestaria tudo e
            // derrubaria o número dos métodos que existem de fato.
            const esqueleto = errosDaTrilha(man.phases).length > 0 || subitensDaSpec(repoRoot, e.name).size === 0;
            (esqueleto ? esqueletos : prontos).push(e.name);
        } catch { /* manifest ausente ou ilegível não declara nada */ }
    }
    return { prontos: prontos.sort(), esqueletos: esqueletos.sort() };
}

function conferirContraMetodo(repoRoot: string, std: Standard, standardId: string, metodo: string, declara: boolean): ConferenciaDoMetodo {
    const erros: string[] = [];
    const linhas = std.items.filter((i) => !i.has_subitems);
    // Ponteiro inexistente é erro de dado mesmo quando aponta cobertura parcial de um
    // [NÃO COBERTO]; já a produção (c) só interessa onde a correspondência é declarada.
    const mapeadas = linhas.filter((i) => i.covered_by.length > 0 && !declaracaoDe(i).naoSeAplica);
    const correspondencias = mapeadas.filter((i) => !declaracaoDe(i).naoCoberto);
    const trilha = lerTrilha(repoRoot, metodo);
    const contestados = new Map<string, string>();

    // (a) — o ponteiro existe na spec do método (seguindo `extends`) e cai numa etapa que se
    // aplica a ele. A spec herdada traz as etapas da base: a F6 do prisma-sr existe na spec do
    // escopo, que a declara desligada — e item coberto só por ela não é coberto ali.
    const definidos = subitensDaSpec(repoRoot, metodo);
    const subitens_inexistentes: Array<{ item: string; subitem: string }> = [];
    const em_etapa_que_nao_se_aplica: Array<{ item: string; subitem: string; etapa: string }> = [];
    for (const i of mapeadas) {
        for (const s of i.covered_by) {
            if (!definidos.has(s)) { subitens_inexistentes.push({ item: i.id, subitem: s }); continue; }
            const et = etapaDoSubitem(trilha.etapas, s);
            if (et && !et.active) em_etapa_que_nao_se_aplica.push({ item: i.id, subitem: s, etapa: et.id });
        }
    }
    if (!definidos.size) erros.push(`A spec de "${metodo}" não define subitem nenhum: não há contra o que conferir os ponteiros.`);
    else if (subitens_inexistentes.length) {
        erros.push(
            `(a) ${subitens_inexistentes.length} ponteiro(s) para subitem que a spec de "${metodo}" não define: ` +
            subitens_inexistentes.map((x) => `${x.item}→${x.subitem}`).join(", ") + "."
        );
    }
    for (const x of subitens_inexistentes) if (correspondencias.some((i) => i.id === x.item)) {
        contestados.set(x.item, `subitem ${x.subitem} não existe na spec de ${metodo}`);
    }
    // A linha só cai se TODOS os seus ponteiros estão em etapa desligada: um ponteiro numa
    // etapa ativa ainda pode cobri-la.
    for (const i of correspondencias) {
        const fora = em_etapa_que_nao_se_aplica.filter((x) => x.item === i.id);
        if (fora.length && fora.length === i.covered_by.length && !contestados.has(i.id)) {
            contestados.set(i.id, `coberto só por etapa que não se aplica a ${metodo} (${[...new Set(fora.map((x) => x.etapa))].join(", ")})`);
        }
    }
    if (em_etapa_que_nao_se_aplica.length) {
        erros.push(
            `(a) ${em_etapa_que_nao_se_aplica.length} ponteiro(s) para etapa que "${metodo}" declara não se aplicar: ` +
            em_etapa_que_nao_se_aplica.map((x) => `${x.item}→${x.subitem} (${x.etapa})`).join(", ") + "."
        );
    }

    // (b) — falsificação, com a premissa conferida antes de valer.
    const coer = MappingCoherenceService.checarMetodologia(repoRoot, metodo, std);
    const com_poder = std.titulos_oficiais === true;
    const motivo_sem_poder = com_poder ? "" :
        "Os títulos dos itens deste padrão não foram transcritos da fonte oficial (ver a nota do padrão). " +
        "Comparar o rótulo com eles não falsifica nada: o suspeito e a ausência de suspeito são igualmente inconclusivos.";
    if (!com_poder) erros.push(`(b) Falsificação SEM PODER em ${std.name}: ${motivo_sem_poder}`);
    else if (coer.suspeitos.length) {
        erros.push(
            `(b) ${coer.suspeitos.length} mapeamento(s) suspeito(s): o rótulo não tem conceito em comum com o item que ` +
            `declara cobrir e casa com outro — ${coer.suspeitos.map((s) => `${s.subitem}→${s.item_declarado} (sugere ${s.item_sugerido})`).join(", ")}.`
        );
        for (const s of coer.suspeitos) {
            if (correspondencias.some((i) => i.id === s.item_declarado) && !contestados.has(s.item_declarado)) {
                contestados.set(s.item_declarado, `${s.subitem} "${s.rotulo}" casa com o item ${s.item_sugerido}`);
            }
        }
    }

    // (c) — a etapa de cada subitem, e se alguma tool grava o artefato dela.
    const existentes = new Set(AgentOrchestrator.getGovernedTools());
    const comCodigo = (ids: string[]) => ids.some((t) => existentes.has(t));
    const por_codigo: string[] = [], parcial: string[] = [], so_por_agente: string[] = [], sem_etapa: string[] = [];
    const itens_por_etapa: Record<string, string[]> = {};
    for (const i of correspondencias) {
        const etapas = [...new Map(i.covered_by
            .map((s) => etapaDoSubitem(trilha.etapas, s))
            .filter((e): e is NonNullable<typeof e> => e !== null && e.active)
            .map((e) => [e.id, e])).values()];
        if (!etapas.length) sem_etapa.push(i.id);
        else if (etapas.every((e) => comCodigo(e.producer_tools))) por_codigo.push(i.id);
        else if (etapas.some((e) => comCodigo(e.producer_tools))) parcial.push(i.id);
        else so_por_agente.push(i.id);
        // Fundamento só de título conferido com a fonte: com títulos fora da fonte (PRISMA-S,
        // DEBT-128) o "porquê" ensinaria ao pesquisador um item com nome e número errados.
        if (!contestados.has(i.id) && com_poder) {
            for (const e of etapas) (itens_por_etapa[e.id] ??= []).push(i.id);
        }
    }
    if (trilha.erros.length) erros.push(`(c) A trilha de "${metodo}" não pôde ser lida: ${trilha.erros.join("; ")}.`);
    const etapas_sem_codigo = trilha.etapas
        .filter((e) => e.active && !comCodigo(e.producer_tools))
        .map((e) => ({ etapa: e.id, artefato: e.closes_with }));

    if (!declara) {
        erros.push(
            `"${metodo}" não declara "${standardId}" em conformance.standards: a conferência foi feita a pedido, ` +
            `mas nenhuma pesquisa conduzida por este método declara conformidade com este padrão.`
        );
    }

    const naoSeAplica = linhas.filter((i) => declaracaoDe(i).naoSeAplica && !declaracaoDe(i).naoCoberto).length;
    const corresponde = correspondencias.filter((i) => !contestados.has(i.id)).length;

    return {
        metodologia: metodo,
        declara_o_padrao: declara,
        subitens_inexistentes,
        em_etapa_que_nao_se_aplica,
        falsificacao: {
            com_poder, motivo_sem_poder,
            pares_conferidos: coer.pares_conferidos,
            suspeitos: coer.suspeitos,
            nao_conferidos: coer.nao_conferidos,
        },
        producao: { por_codigo, parcial, so_por_agente, sem_etapa, etapas_sem_codigo },
        corresponde,
        fracao: `${corresponde}/${linhas.length - naoSeAplica}`,
        contestados: [...contestados].map(([item, por]) => ({ item, por })),
        itens_por_etapa,
        erros,
    };
}

export interface PadraoNoPanorama {
    id: string;
    name: string;
    version: string;
    version_source: string;
    /** URL da fonte oficial: a do `version_source` ou, sem ela, a da entrada do catálogo ligada ao padrão. */
    fonte: string;
    declarado_por: string[];
    titulos_oficiais: boolean;
}

export class StandardCoverageService {
    /**
     * O que está assimilado, com a versão e a fonte de cada padrão — a lista de trabalho da
     * conferência de obsolescência (DEBT-010). Decidido em 09/10/2026: "conferido quando o
     * agente roda, não ao vivo" — sem vigia nem job de fundo. Esta função só junta o que a
     * conferência precisa; ir à fonte e relatar é passo da rotina de entrada do maintainer.
     */
    static panorama(repoRoot: string): PadraoNoPanorama[] {
        const catalogo = MethodologyCatalogService.read(repoRoot);
        const url = (t: string) => t.match(/https?:\/\/[^\s)"]+/)?.[0] ?? "";
        return StandardsService.list(repoRoot).map((id) => {
            const std = StandardsService.read(repoRoot, id);
            const entrada = catalogo?.entries.find((e) => e.standard_file === id);
            return {
                id,
                name: std?.name ?? "[ILEGÍVEL]",
                version: std?.version ?? "",
                version_source: std?.version_source ?? "",
                fonte: url(std?.version_source ?? "") || url(entrada?.source_url ?? "") || "[SEM URL — ver version_source]",
                declarado_por: declarantes(repoRoot, id).prontos,
                titulos_oficiais: std?.titulos_oficiais === true,
            };
        });
    }

    /**
     * Confere a cobertura de um padrão nos quatro pontos. Com `methodologyId` — o método do
     * projeto, quando há projeto —, contra aquele método; sem ele, contra TODOS os métodos
     * prontos que declaram o padrão, cada um com a sua fração. A falsificação deixou de ser
     * opcional: verificação que depende de alguém lembrar de pedir decai.
     */
    static conferir(repoRoot: string, standardId: string, methodologyId?: string): RelatorioCobertura {
        const std = StandardsService.read(repoRoot, standardId);
        const d = StandardsService.checkCoverage(std, standardId);
        const { prontos, esqueletos } = declarantes(repoRoot, standardId);
        const base: RelatorioCobertura = {
            ...d,
            standard_id: standardId,
            corresponde: d.covered,
            contestados: [],
            fracao: "",
            declarado_por: prontos,
            declarado_por_esqueleto: esqueletos,
            conferencia_por_metodo: [],
            premissa_da_falsificacao: PREMISSA_DA_FALSIFICACAO,
            limite: LIMITE_DA_CONFERENCIA,
            avisos: [],
        };
        if (!std) return { ...base, fracao: "0/0" };

        const avisos: string[] = [];
        const errors = [...d.errors];
        if (esqueletos.length) {
            avisos.push(
                `Declarado também por esqueleto(s) do scaffold — ${esqueletos.join(", ")} —, que não entram na conta: ` +
                `trilha por declarar não tem contra o que conferir.`
            );
        }
        if (!prontos.length) {
            errors.unshift(
                `Nenhum método pronto declara "${standardId}" em conformance.standards: o padrão está assimilado e não é usado ` +
                `por pesquisa alguma. A cobertura não tem trilha contra a qual se medir — e isso precisa estar dito, ` +
                `não implícito.`
            );
        }

        const alvos = methodologyId ? [methodologyId] : prontos;
        const conferencias = alvos.map((m) => conferirContraMetodo(repoRoot, std, standardId, m, prontos.includes(m) || esqueletos.includes(m)));
        for (const c of conferencias) errors.push(...c.erros.map((e) => `[${c.metodologia}] ${e}`));

        if (conferencias.some((c) => !c.falsificacao.com_poder)) {
            avisos.push("A fração conta correspondências DECLARADAS que a falsificação não tem como contestar neste padrão: é afirmação de quem assimilou, não verificação.");
        }
        const naoConf = conferencias.reduce((n, c) => n + c.falsificacao.nao_conferidos.length, 0);
        if (naoConf) avisos.push(`${naoConf} ponteiro(s) ficaram sem falsificação — ver nao_conferidos.`);

        const aplicaveis = d.total - d.nao_se_aplica.length;
        const corresponde = conferencias.length ? Math.min(...conferencias.map((c) => c.corresponde)) : d.covered;
        const fracao = conferencias.length === 1
            ? conferencias[0].fracao
            : conferencias.length
                ? conferencias.map((c) => `${c.metodologia} ${c.fracao}`).join(" · ")
                : `${d.covered}/${aplicaveis} declarado, sem método que o confira`;

        return {
            ...base,
            covered: corresponde,
            corresponde,
            contestados: conferencias.flatMap((c) => c.contestados.map((x) => ({ item: x.item, por: `[${c.metodologia}] ${x.por}` }))),
            fracao,
            conferencia_por_metodo: conferencias,
            valid: errors.length === 0,
            errors,
            avisos,
        };
    }
}
