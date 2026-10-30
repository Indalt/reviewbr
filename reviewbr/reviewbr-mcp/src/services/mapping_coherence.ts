import * as fs from "node:fs";
import { Standard } from "./standards.js";
import { textoDaSpec, ID_SUBITEM } from "./method_trail.js";
import type { LinhaDoMapeamento } from "./method_mapping.js";

/**
 * mapping_coherence — falsifica o mapeamento trilha ⟶ padrão.
 *
 * POR QUE EXISTE
 * --------------
 * `checkCoverage` (standards.ts) verifica se `covered_by` está VAZIO. Um `covered_by`
 * preenchido com o item ERRADO devolve `valid: true` — e foi assim que seis itens do
 * PRISMA 2020 ficaram deslocados e reportados como cobertos (DEBT-045/DEBT-124). O
 * pesquisador atento não percebe, porque o sistema diz verde.
 *
 * O PRINCÍPIO
 * -----------
 * O sistema **não consegue gerar** o mapeamento certo: `covered_by` é julgamento, não tem
 * referente externo. Mas **consegue provar que um mapeamento proposto está errado**,
 * comparando o rótulo que a trilha dá ao subitem com o título oficial do item do padrão.
 * Falsificação é automatizável; geração não é. É o que torna defensável qualquer
 * automação futura da assimilação de metodologias.
 *
 * NÃO CORRIGE — SINALIZA. A correção é do pesquisador (RV-04). O que a verificação
 * entrega é o par divergente e, quando acha, o item cujo título de fato casa.
 *
 * O CRUZAMENTO QUE TEM VALOR, E O QUE NÃO TEM
 * -------------------------------------------
 * A spec declara o mapeamento DUAS vezes: na coluna "Item N" das tabelas e no `covered_by`
 * do padrão. Elas concordam 100% — são a mesma declaração escrita duas vezes e **não se
 * verificam mutuamente**. O único cruzamento com poder de falsificação é contra o TÍTULO
 * OFICIAL do item, que vem da norma e não de nós.
 *
 * SEM LLM E SEM REDE: comparação determinística de termos. Um verificador que dependesse
 * de modelo reintroduziria o julgamento que o achado existe para controlar.
 */

/** Um par (subitem da trilha, item do padrão) que a spec declara. */
export interface ParDeclarado {
    subitem: string;
    rotulo: string;
    item: string;
}

export interface Suspeito {
    subitem: string;
    rotulo: string;
    item_declarado: string;
    titulo_oficial: string;
    /** Item cujo título casa com o rótulo, quando existe exatamente um. */
    item_sugerido: string;
    titulo_sugerido: string;
}

export interface CoerenciaReport {
    standard: string;
    pares_conferidos: number;
    suspeitos: Suspeito[];
    /** Pares sem termo comparável (rótulo ou título vazio) — declarados, não escondidos. */
    nao_conferidos: string[];
    valid: boolean;
    errors: string[];
}

/**
 * Normaliza para comparação: minúsculas, sem acento, sem pontuação.
 * Termos de estrutura ("métodos", "resultados") e palavras vazias saem — eles aparecem em
 * dezenas de rótulos e casariam com qualquer coisa, produzindo falso "coerente".
 */
const VAZIAS = new Set([
    "de", "da", "do", "das", "dos", "e", "em", "a", "o", "as", "os", "no", "na", "por", "para",
    "com", "sem", "ou", "the", "of", "and", "in", "to", "for", "other", "outros", "outras",
    "metodos", "resultados", "discussao", "introducao", "informacoes", "dados", "data",
    "estudo", "estudos", "study", "studies", "assessment", "avaliacao", "process", "processo",
]);

function termos(texto: string): Set<string> {
    const limpo = texto
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ");
    return new Set(limpo.split(/\s+/).filter((t) => t.length > 3 && !VAZIAS.has(t)));
}

/**
 * Pares PT⟷EN dos conceitos que a norma nomeia. Derivados dos TÍTULOS DO PADRÃO, nunca de
 * tema — o sistema é agnóstico a domínio e `tests/integracao.test.ts` reprova termo temático.
 * Sem isto, "Certeza da evidência" nunca casaria com "Certainty assessment" e TODO par
 * viraria suspeito, o que é tão inútil quanto nenhum viria.
 */
const EQUIV: Array<[string, string[]]> = [
    ["certainty", ["certeza"]],
    ["certeza", ["certainty"]],
    ["registration", ["registro"]],
    ["registro", ["registration"]],
    ["protocol", ["protocolo"]],
    ["protocolo", ["protocol"]],
    ["support", ["financiamento", "apoio"]],
    ["financiamento", ["support", "funding"]],
    ["competing", ["conflito", "interesses"]],
    ["conflito", ["competing", "interests"]],
    ["interests", ["interesses"]],
    ["interesses", ["interests", "competing"]],
    ["availability", ["disponibilidade"]],
    ["disponibilidade", ["availability"]],
    ["reporting", ["relato"]],
    ["relato", ["reporting"]],
    ["bias", ["vies"]],
    ["vies", ["bias"]],
    ["selection", ["selecao"]],
    ["selecao", ["selection"]],
    ["eligibility", ["elegibilidade"]],
    ["elegibilidade", ["eligibility"]],
    ["synthesis", ["sintese"]],
    ["sintese", ["synthesis"]],
    ["results", ["resultado"]],
    ["characteristics", ["caracteristicas"]],
    ["caracteristicas", ["characteristics"]],
    ["individual", ["individuais"]],
    ["individuais", ["individual"]],
    ["effect", ["efeito"]],
    ["efeito", ["effect"]],
    ["measures", ["medidas"]],
    ["medidas", ["measures"]],
    ["sources", ["fontes"]],
    ["fontes", ["sources"]],
    ["search", ["busca"]],
    ["busca", ["search"]],
    ["strategy", ["estrategia"]],
    ["estrategia", ["strategy"]],
    ["items", ["itens"]],
    ["itens", ["items"]],
    ["collection", ["coleta"]],
    ["coleta", ["collection"]],
    ["title", ["titulo"]],
    ["titulo", ["title"]],
    ["abstract", ["resumo"]],
    ["resumo", ["abstract"]],
    // "rationale" ⟷ "justificativa" foi REMOVIDO deliberadamente. A palavra aparece em
    // cinco rótulos da trilha como campo de formulário — "Justificativa se N/A",
    // "Justificativa por julgamento" — que nada têm com o item 3 do PRISMA (Rationale, a
    // justificativa DA REVISÃO). O par produzia cinco suspeitos falsos, todos sugerindo o
    // item 3. Equivalência que casa por homonímia, e não por conceito, degrada a verificação.
    ["objectives", ["objetivos"]],
    ["objetivos", ["objectives"]],
    ["evidence", ["evidencia"]],
    ["evidencia", ["evidence"]],
    ["additional", ["adicionais"]],
    ["adicionais", ["additional"]],
];

const MAPA_EQUIV = new Map(EQUIV);

/** Há conceito em comum entre rótulo e título? Compara termo a termo, com os pares PT⟷EN. */
function casam(rotulo: Set<string>, titulo: Set<string>): boolean {
    for (const t of rotulo) {
        if (titulo.has(t)) return true;
        for (const eq of MAPA_EQUIV.get(t) ?? []) {
            if (titulo.has(eq)) return true;
        }
    }
    return false;
}

export class MappingCoherenceService {
    /**
     * Extrai da spec os pares (subitem, rótulo, item) que ela declara.
     *
     * A spec tem tabelas de 5 colunas (`| Fx | rótulo | descrição | obrigatório | Item N |`)
     * e de 3 (`| Fx | rótulo | Item N |`). As duas formas são lidas: os seis pares
     * deslocados do DEBT-045 vivem justamente na de 3 colunas, que um regex de 5 não alcança.
     */
    private static extrairPares(specPath: string): ParDeclarado[] {
        if (!fs.existsSync(specPath)) return [];
        return this.paresDoTexto(fs.readFileSync(specPath, "utf-8"));
    }

    private static paresDoTexto(texto: string): ParDeclarado[] {
        const pares: ParDeclarado[] = [];
        const vistos = new Set<string>();

        const padroes = [
            new RegExp(`^\\|\\s*(${ID_SUBITEM})\\s*\\|([^|]*)\\|[^|]*\\|[^|]*\\|\\s*Item\\s*([0-9]+[a-z]?)\\s*\\|`, "gm"),
            new RegExp(`^\\|\\s*(${ID_SUBITEM})\\s*\\|([^|]*)\\|\\s*Item\\s*([0-9]+[a-z]?)\\s*\\|`, "gm"),
        ];
        for (const re of padroes) {
            for (const m of texto.matchAll(re)) {
                const chave = `${m[1]}→${m[3]}`;
                if (vistos.has(chave)) continue;
                vistos.add(chave);
                pares.push({ subitem: m[1], rotulo: m[2].trim(), item: m[3] });
            }
        }
        return pares;
    }

    /**
     * Confere cada par declarado contra o título oficial do item.
     *
     * `valid` é false quando há suspeito: mapeamento que aponta item cujo título não tem
     * conceito em comum com o rótulo. Não é prova de erro — é prova de que alguém precisa
     * olhar. A decisão é do pesquisador.
     */
    private static checar(std: Standard | null, pares: ParDeclarado[], semLeitura: string[] = []): CoerenciaReport {
        if (!std) {
            return {
                standard: "", pares_conferidos: 0, suspeitos: [], nao_conferidos: [],
                valid: false, errors: ["Padrão ausente ou ilegível: não há título oficial contra o que conferir."],
            };
        }
        const titulos = new Map(std.items.map((i) => [i.id, i.title ?? ""]));
        const suspeitos: Suspeito[] = [];
        // Ponteiro que nem chegou a par (subitem sem rótulo na spec) também é não conferido —
        // e precisa aparecer aqui, senão o relatório diz ter conferido o que não leu.
        const naoConferidos: string[] = [...semLeitura];
        // Item e seus subitens são UMA família: no PRISMA 2020 os 21 subitens repetem o título
        // do pai ("Registration and protocol — 24a"), e o critério "casa com exatamente UM
        // outro item" nunca disparava para deslocamento rumo a item que tem subitens — o pai e
        // os filhos contavam como quatro candidatos.
        const familia = new Map(std.items.map((i) => [i.id, i.parent || i.id]));

        for (const p of pares) {
            const oficial = titulos.get(p.item);
            if (oficial === undefined) {
                naoConferidos.push(`${p.subitem} aponta item "${p.item}", que não existe em ${std.name}`);
                continue;
            }
            const tr = termos(p.rotulo);
            const tt = termos(oficial);
            if (tr.size === 0 || tt.size === 0) {
                naoConferidos.push(`${p.subitem}: rótulo ou título sem termo comparável`);
                continue;
            }
            if (casam(tr, tt)) continue;

            // NÃO casar com o item declarado NÃO é suspeita suficiente, e a primeira versão
            // desta verificação errou exatamente aí: acusou 89 de 112 pares, porque um
            // subitem da trilha é mais granular que o item do padrão e não precisa repetir
            // as palavras dele — "Total de registros triados" cobre "Study selection" sem
            // nenhum termo em comum, e está certo. Verificação que acusa 80% é ruído, e
            // ruído faz o pesquisador ignorar o sinal.
            //
            // O que de fato falsifica é a CONTRADIÇÃO: o rótulo não casa com o item que
            // declara cobrir E casa, de forma única, com OUTRO item do mesmo padrão. Aí não
            // é granularidade — é o rótulo apontando para o vizinho errado, que é a
            // assinatura do deslocamento do DEBT-045.
            const daDeclarada = familia.get(p.item) ?? p.item;
            const familias = [...new Set(std.items
                .filter((i) => (familia.get(i.id) ?? i.id) !== daDeclarada && casam(tr, termos(i.title ?? "")))
                .map((i) => familia.get(i.id) ?? i.id))];
            if (familias.length !== 1) continue;

            const sug = std.items.find((i) => i.id === familias[0])!;
            suspeitos.push({
                subitem: p.subitem,
                rotulo: p.rotulo,
                item_declarado: p.item,
                titulo_oficial: oficial,
                item_sugerido: sug.id,
                titulo_sugerido: sug.title ?? "",
            });
        }

        const errors = suspeitos.length > 0
            ? [
                `${suspeitos.length} mapeamento(s) SUSPEITO(s) em ${std.name}: o rótulo da trilha não tem ` +
                `conceito em comum com o título oficial do item que ele declara cobrir. ` +
                `checkCoverage reporta esses itens como COBERTOS — é a falha que o DEBT-124 registra.`,
            ]
            : [];

        return {
            standard: std.name,
            pares_conferidos: pares.length - (naoConferidos.length - semLeitura.length),
            suspeitos,
            nao_conferidos: naoConferidos,
            valid: suspeitos.length === 0,
            errors,
        };
    }

    /**
     * ÚNICA entrada pública. `extrairPares` e `checar` são privados de propósito: expor
     * três métodos para um chamador criaria dois públicos sem invocador, que é o defeito
     * que `tests/integracao.test.ts` reprova — e que o sistema registra de si desde o
     * começo. Os dois continuam testáveis através daqui.
     */
    static checarMetodologia(repoRoot: string, methodologyId: string, std: Standard | null, mapa: Map<string, LinhaDoMapeamento>): CoerenciaReport {
        // A coluna "Item N" da spec numera o PRISMA 2020, e SÓ ele. Conferi-la contra outro
        // padrão compara numerações incomparáveis: o item 15 é "Certainty assessment" no
        // PRISMA 2020 e "Data synthesis" no PRISMA-P. Rodar assim acusou 12 suspeitos falsos
        // no mapeamento do PRISMA-P, todos por essa colisão de numeração.
        //
        // O mapeamento dos outros padrões vive no `covered_by` do MÉTODO (`mapa`, DEBT-142),
        // e é por ali que ele deve ser falsificado — não pela coluna da spec.
        //
        // A spec é lida SEGUINDO `extends` (DEBT-140): a do scoping só traz deltas, e lida
        // sozinha não tinha rótulo nenhum — a falsificação voltava limpa sem ter conferido nada.
        if (!std) return this.checar(std, []);
        const doPadrao = this.paresDoCoveredBy(repoRoot, methodologyId, std, mapa);
        if (std.id !== "PRISMA 2020" && std.name !== "PRISMA 2020") {
            return this.checar(std, doPadrao.pares, doPadrao.semRotulo);
        }
        // PRISMA 2020: a coluna da spec E o `covered_by` do padrão. Só a coluna deixava de
        // fora 17 ponteiros de linha de checklist (células "Item 5 / S10", tabelas de 6
        // colunas) sem dizer que não os lera.
        const vistos = new Set<string>();
        const pares = [...this.paresDoTexto(textoDaSpec(repoRoot, methodologyId)), ...doPadrao.pares].filter((p) => {
            const k = `${p.subitem}→${p.item}`;
            if (vistos.has(k)) return false;
            vistos.add(k);
            return true;
        });
        return this.checar(std, pares, doPadrao.semRotulo);
    }

    /**
     * Pares declarados pelo `covered_by` do método, com o rótulo que a spec dá a cada subitem.
     * É a fonte de mapeamento dos padrões que não são o PRISMA 2020. Percorre os itens na ordem
     * do padrão, para os suspeitos saírem na ordem da norma.
     */
    private static paresDoCoveredBy(repoRoot: string, methodologyId: string, std: Standard, mapa: Map<string, LinhaDoMapeamento>): { pares: ParDeclarado[]; semRotulo: string[] } {
        const texto = textoDaSpec(repoRoot, methodologyId);
        if (!texto) return { pares: [], semRotulo: [] };

        // Rótulo de cada subitem da trilha, lido da 2ª coluna de qualquer tabela da spec.
        const rotulo = new Map<string, string>();
        // Id de subitem na forma de QUALQUER trilha (ID_SUBITEM), não só na F0..F8 do PRISMA.
        for (const m of texto.matchAll(new RegExp(`^\\|\\s*(${ID_SUBITEM})\\s*\\|([^|]*)\\|`, "gm"))) {
            if (!rotulo.has(m[1])) rotulo.set(m[1], m[2].trim());
        }

        const pares: ParDeclarado[] = [];
        const semRotulo: string[] = [];
        for (const item of std.items) {
            if (item.has_subitems) continue;
            for (const sub of mapa.get(item.id)?.covered_by ?? []) {
                const r = rotulo.get(sub);
                if (r) pares.push({ subitem: sub, rotulo: r, item: item.id });
                else semRotulo.push(`${sub} (item ${item.id}): a spec do método não dá rótulo a este subitem`);
            }
        }
        return { pares, semRotulo };
    }
}
