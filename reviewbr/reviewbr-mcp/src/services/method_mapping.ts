import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";
import { z } from "zod";
import type { Standard } from "./standards.js";
import { lerCondicoes, Condicao, RespostaDeCondicao } from "./method_trail.js";

/**
 * method_mapping — o mapeamento padrão → trilha é do MÉTODO (DEBT-142).
 *
 * POR QUE EXISTE
 * --------------
 * `covered_by`, `nao_coberto` e `nao_se_aplica` moravam no arquivo do PADRÃO, compartilhado por
 * todo método que o declara. Um método de trilha própria não tinha onde dizer como cobre o mesmo
 * padrão sem apagar o mapeamento do outro: numa trilha C, os ponteiros F2.1.x do método F apontam
 * subitem que não existe, e a conferência contesta tudo. E [NÃO SE APLICA], dito no padrão, valia
 * para toda pesquisa de todo método. Decisão do pesquisador em 17/10/2026: "cada metodologia com as
 * suas regras".
 *
 * A SEPARAÇÃO
 * -----------
 *  - `.claude/standards/<padrão>.json`                          → a NORMA: itens, títulos, enunciados, versão
 *  - `.claude/methodologies/<método>/conformance/<padrão>.json` → como ESTE método cobre cada linha
 *
 * Repetição entre métodos é correta — eles são independentes; o que não pode repetir é o código.
 *
 * AS DUAS DECLARAÇÕES (DEBT-140), e confundi-las esconde a segunda:
 *  - `nao_coberto`: o sistema AINDA NÃO implementa o que o item pede — fila de manutenção. Um
 *    `covered_by` que só ENCAIXA o item num campo que não coleta o que ele pede é declarado aqui, e
 *    pode manter os ponteiros, que mostram onde mora a cobertura parcial.
 *  - `nao_se_aplica`: o item nunca será coberto pela pesquisa deste método, e isso NÃO é falha.
 *
 * ITEM CONDICIONAL
 * ----------------
 * Linha cuja aplicabilidade depende da pesquisa ("If done", "se houver metanálise") traz
 * `condicao: { id, aplica_se }`. A condição é declarada no manifest do método (`condicoes`); o
 * projeto responde por `record_researcher_decision`; com resposta fora de `aplica_se`, a linha sai
 * do denominador como [NÃO SE APLICA], com o motivo e a data. Sem resposta vale o que o método
 * declarou — o que não foi respondido não se presume respondido.
 *
 * QUANTO A CONFERÊNCIA POR PALAVRAS ENXERGA (DEBT-149)
 * ----------------------------------------------------
 * `conferencia_por_palavras` guarda a MEDIDA, feita por script, de quanto a conferência por
 * palavras (mapping_coherence.ts) percebe neste mapeamento: a data, o script, e a impressão dos
 * pares medidos (`impressaoDosPares`). O relatório da cobertura a cita, e diz quando o mapeamento
 * mudou depois dela — medida de outro mapeamento não é medida deste. Decisão de 05/11/2026: a
 * conferência por palavras não trava o estudo; o relatório diz o que ela é e quanto enxerga.
 *
 * A LEITURA DOCUMENTADA (DEBT-149, B2)
 * ------------------------------------
 * A transcrição se confere ao assimilar, lendo a norma: em cada linha, `trechos` dá, por ponteiro,
 * o trecho literal do enunciado oficial do item que o justifica, e `examinados` registra o suspeito
 * da conferência por palavras lido e julgado certo (quem, quando, com que trecho). No mapeamento,
 * `leitura_documentada` diz quem fez a leitura, quando, e onde está o registro das duas leituras
 * independentes e da comparação. Quem confere os trechos é `leitura_documentada.ts`.
 */

/**
 * A medida de quanto a conferência por palavras enxerga num mapeamento. Sem número, não é medida:
 * traz as trocas propositais, os erros reais conhecidos, ou os dois.
 */
const MedidaDaConferenciaSchema = z.object({
    /** Data da medida, AAAA-MM-DD. */
    medida_em: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    /** O script que mediu, relativo à raiz do repositório: quem quiser refaz. */
    script: z.string().min(1),
    /** Pares (item, subitem) do covered_by no dia da medida, e a impressão deles (`impressaoDosPares`). */
    pares_medidos: z.number().int().nonnegative(),
    impressao: z.string().regex(/^[0-9a-f]{64}$/),
    /** Trocas propositais: cada subitem mapeado posto, numa cópia, em cada outro item, uma de cada vez. */
    trocas: z.object({ plantadas: z.number().int().positive(), percebidas: z.number().int().nonnegative() }).optional(),
    /**
     * Erros reais conhecidos — de uma versão deste mapeamento, achados lendo a norma — e quantos a
     * conferência percebeu. A fonte diz de que versão e onde se confere.
     */
    erros_conhecidos: z.object({
        total: z.number().int().positive(),
        percebidos: z.number().int().nonnegative(),
        fonte: z.string().min(1),
    }).optional(),
})
    .refine((m) => m.trocas || m.erros_conhecidos, { message: "medida sem número: traga trocas, erros_conhecidos ou os dois" })
    .refine((m) => !m.trocas || m.trocas.percebidas <= m.trocas.plantadas, { message: "mais trocas percebidas que plantadas" })
    .refine((m) => !m.erros_conhecidos || m.erros_conhecidos.percebidos <= m.erros_conhecidos.total, { message: "mais erros percebidos que conhecidos" });

export type MedidaDaConferencia = z.infer<typeof MedidaDaConferenciaSchema>;

const DATA = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const LinhaSchema = z.object({
    id: z.string().min(1),
    /** Subitens da trilha DESTE método que cobrem o item — a consulta reversa. */
    covered_by: z.array(z.string()).default([]),
    nao_coberto: z.string().default(""),
    nao_se_aplica: z.string().default(""),
    condicao: z.object({ id: z.string().min(1), aplica_se: z.array(z.string().min(1)).min(1) }).optional(),
    /**
     * Leitura documentada (DEBT-149, B2): por ponteiro de `covered_by`, o trecho LITERAL do
     * enunciado oficial do item que o justifica. Quem confere é `leitura_documentada.ts`.
     */
    trechos: z.record(z.string().min(1), z.string().min(1)).optional(),
    /**
     * Suspeitos da conferência por palavras examinados na assimilação e julgados certos: quem
     * examinou, quando, com que trecho do enunciado do item declarado. O `rotulo` é o do subitem
     * no dia do exame: se a spec o muda, o exame caduca e o suspeito volta a pedir leitura.
     */
    examinados: z.array(z.object({
        subitem: z.string().min(1),
        rotulo: z.string().min(1),
        por: z.string().min(1),
        em: DATA,
        trecho: z.string().min(1),
    })).optional(),
});

const MapeamentoSchema = z.object({
    schemaVersion: z.literal(1),
    /** Id do padrão — o nome do arquivo em `.claude/standards/`, sem `.json`. */
    standard: z.string().min(1),
    note: z.string().default(""),
    conferencia_por_palavras: MedidaDaConferenciaSchema.optional(),
    /**
     * A leitura documentada deste mapeamento (DEBT-149, B2): quando, por quem, e o registro — o
     * arquivo com as duas leituras independentes, a comparação e as divergências levadas ao
     * pesquisador. Os trechos moram em cada linha (`trechos`).
     */
    leitura_documentada: z.object({ em: DATA, por: z.string().min(1), registro: z.string().min(1) }).optional(),
    items: z.array(LinhaSchema).default([]),
});

export type LinhaDoMapeamento = z.infer<typeof LinhaSchema>;

export interface Mapeamento {
    metodo: string;
    padrao: string;
    /** Relativo à raiz do repositório. */
    arquivo: string;
    existe: boolean;
    note: string;
    /** Por id do item do padrão. Item sem linha = sem mapeamento = omissão, se o método declara o padrão. */
    linhas: Map<string, LinhaDoMapeamento>;
    /** Quanto a conferência por palavras enxerga neste mapeamento, se foi medido. */
    medida: MedidaDaConferencia | null;
    /** Quando e por quem a leitura documentada foi feita, e onde está o registro dela. */
    leitura: { em: string; por: string; registro: string } | null;
    erros: string[];
}

/**
 * A impressão dos pares de um mapeamento: SHA-256 das linhas "item<TAB>subitem" de todo
 * `covered_by`, em ordem. Muda quando um ponteiro entra, sai ou troca de item — e é assim que o
 * relatório sabe se a medida da conferência por palavras é deste mapeamento ou de um anterior.
 * Não capta mudança de rótulo na spec, de título no padrão nem da tabela de equivalências.
 */
export function impressaoDosPares(linhas: Map<string, LinhaDoMapeamento>): { pares: number; impressao: string } {
    const pares = [...linhas.values()].flatMap((l) => l.covered_by.map((s) => `${l.id}\t${s}`)).sort();
    return { pares: pares.length, impressao: createHash("sha256").update(pares.join("\n"), "utf8").digest("hex") };
}

export function arquivoDoMapeamento(metodo: string, padrao: string): string {
    return [".claude", "methodologies", metodo, "conformance", `${padrao}.json`].join("/");
}

/**
 * Lê o mapeamento de um padrão por um método. Nunca lança: o que impede usar o mapeamento vai
 * para `erros`. Arquivo ausente não é erro AQUI — é `existe: false`, e quem confere o padrão diz
 * se o método o declara e não o mapeou. Com `std`, confere também que os ids são do padrão.
 */
export function lerMapeamento(repoRoot: string, metodo: string, padrao: string, std?: Standard | null): Mapeamento {
    const arquivo = arquivoDoMapeamento(metodo, padrao);
    const base: Mapeamento = { metodo, padrao, arquivo, existe: false, note: "", linhas: new Map(), medida: null, leitura: null, erros: [] };
    const p = path.join(repoRoot, arquivo);
    if (!fs.existsSync(p)) return base;

    let bruto: unknown;
    try { bruto = JSON.parse(fs.readFileSync(p, "utf-8")); }
    catch (e: any) { return { ...base, existe: true, erros: [`mapeamento ${arquivo} ilegível: ${e.message}`] }; }
    const lido = MapeamentoSchema.safeParse(bruto);
    if (!lido.success) {
        return { ...base, existe: true, erros: lido.error.issues.map((i) => `mapeamento ${arquivo}: ${i.path.join(".") || "(raiz)"} — ${i.message}`) };
    }

    const erros: string[] = [];
    if (lido.data.standard !== padrao) erros.push(`mapeamento ${arquivo} declara o padrão "${lido.data.standard}", não "${padrao}"`);
    const linhas = new Map<string, LinhaDoMapeamento>();
    for (const l of lido.data.items) {
        if (linhas.has(l.id)) erros.push(`mapeamento ${arquivo}: o item ${l.id} aparece mais de uma vez`);
        linhas.set(l.id, l);
    }
    if (std) {
        const doPadrao = new Set(std.items.map((i) => i.id));
        const alheios = [...linhas.keys()].filter((id) => !doPadrao.has(id));
        if (alheios.length) erros.push(`mapeamento ${arquivo}: item(ns) que o padrão não tem — ${alheios.join(", ")}`);
    }

    const condicionais = [...linhas.values()].filter((l) => l.condicao);
    if (condicionais.length) {
        const { condicoes } = lerCondicoes(repoRoot, metodo);
        for (const l of condicionais) {
            const c = condicoes.find((x) => x.id === l.condicao!.id);
            if (!c) {
                erros.push(`mapeamento ${arquivo}: o item ${l.id} depende da condição "${l.condicao!.id}", que o manifest de "${metodo}" não declara (ou declara ilegível)`);
                continue;
            }
            const alheias = l.condicao!.aplica_se.filter((v) => !c.opcoes.includes(v));
            if (alheias.length) erros.push(`mapeamento ${arquivo}: o item ${l.id} aplica-se com resposta que a condição "${c.id}" não oferece — ${alheias.join(", ")}`);
            // A condição é que diz quando não se aplica; declarar [NÃO SE APLICA] por cima a anularia.
            if (l.nao_se_aplica.trim()) erros.push(`mapeamento ${arquivo}: o item ${l.id} é condicional e declarado [NÃO SE APLICA] ao mesmo tempo`);
        }
    }
    return {
        ...base, existe: true, note: lido.data.note, linhas, erros,
        medida: lido.data.conferencia_por_palavras ?? null,
        leitura: lido.data.leitura_documentada ?? null,
    };
}

/** As declarações de ausência de uma linha, lidas de forma robusta: linha ausente é "não declarada". */
export function declaracaoDe(l: LinhaDoMapeamento | undefined): { naoCoberto: string; naoSeAplica: string } {
    return { naoCoberto: (l?.nao_coberto ?? "").trim(), naoSeAplica: (l?.nao_se_aplica ?? "").trim() };
}

export interface ItemCondicional {
    item: string;
    condicao: string;
    pergunta: string;
    etapa: string;
    aplica_se: string[];
    /** null = sem projeto, ou o projeto ainda não respondeu: vale o que o método declarou. */
    resposta: string | null;
    aplica: boolean | null;
    respondida_em: string;
}

/**
 * As linhas que valem PARA O PROJETO. Condição respondida fora de `aplica_se` tira a linha do
 * denominador como [NÃO SE APLICA], com o motivo. Sem projeto ou sem resposta, as linhas são as que
 * o método declarou — e cada condicional é apontada, para ninguém ler a fração como definitiva.
 */
export function aplicarRespostas(
    mapa: Mapeamento,
    condicoes: Condicao[],
    respostas: Map<string, RespostaDeCondicao> | null,
): { linhas: Map<string, LinhaDoMapeamento>; condicionais: ItemCondicional[] } {
    const linhas = new Map(mapa.linhas);
    const condicionais: ItemCondicional[] = [];
    for (const [id, l] of mapa.linhas) {
        if (!l.condicao) continue;
        const c = condicoes.find((x) => x.id === l.condicao!.id);
        const r = respostas?.get(l.condicao.id) ?? null;
        const aplica = r ? l.condicao.aplica_se.includes(r.resposta) : null;
        condicionais.push({
            item: id, condicao: l.condicao.id, pergunta: c?.pergunta ?? "", etapa: c?.etapa ?? "",
            aplica_se: l.condicao.aplica_se, resposta: r?.resposta ?? null, aplica, respondida_em: r?.ts ?? "",
        });
        if (r && aplica === false) {
            linhas.set(id, {
                ...l, nao_coberto: "",
                nao_se_aplica: `condição "${l.condicao.id}" respondida "${r.resposta}" pelo pesquisador em ${r.ts}` +
                    `${c ? ` (${c.pergunta})` : ""}: o método só aplica este item com ${l.condicao.aplica_se.join(" ou ")}.`,
            });
        }
    }
    return { linhas, condicionais };
}
