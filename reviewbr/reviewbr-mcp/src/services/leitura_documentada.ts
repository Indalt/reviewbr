import type { Standard } from "./standards.js";
import type { Mapeamento } from "./method_mapping.js";

/**
 * leitura_documentada — confere a TRANSCRIÇÃO de um padrão no mapeamento de um método.
 *
 * POR QUE EXISTE (DEBT-149, decisão do Vicente de 05/11/2026, B2)
 * --------------------------------------------------------------
 * Metodologia validada não se reverifica; o que se verifica é a nossa transcrição dela — o
 * mapeamento campo da trilha → item da norma —, uma vez, ao assimilar (A6). A conferência por
 * palavras não serve para isso: medida, percebe poucas trocas. A transcrição passa a ser conferida
 * por LEITURA DOCUMENTADA: cada ponteiro traz o trecho do enunciado oficial do item que o
 * justifica (`trechos`, no mapeamento); uma segunda leitura independente é comparada com a
 * primeira; onde concordam, vale; as divergências vão ao pesquisador.
 *
 * O QUE ESTE CONFERIDOR FAZ — E SÓ ISSO
 * -------------------------------------
 * Confere que cada trecho é LITERAL — só o espaço é normalizado; maiúscula, pontuação e palavra
 * contam — e DAQUELE item: está no enunciado do item declarado. Trecho que só existe no enunciado
 * de outro item, trecho alterado e trecho de item sem enunciado são recusados. Não julga se o
 * trecho justifica o ponteiro: isso é a leitura, conferida pela segunda leitura independente.
 * Simples de propósito, para uma pessoa o ler inteiro; e só vale como prova porque passa no teste
 * de resposta conhecida (tests/leitura_documentada.test.ts) — A5: script e agente erram.
 */

/** Só espaço: toda sequência de espaço em branco (inclusive quebra de linha) vira um espaço; pontas aparadas. */
export function normalizarEspaco(s: string): string {
    return s.replace(/\s+/g, " ").trim();
}

export type VereditoDoTrecho = { aceito: true } | { aceito: false; motivo: string };

/** O trecho é literal e está no enunciado do item declarado? */
export function conferirTrecho(std: Standard, item: string, trecho: string): VereditoDoTrecho {
    const t = normalizarEspaco(trecho);
    if (!t) return { aceito: false, motivo: "trecho vazio" };
    const alvo = std.items.find((i) => i.id === item);
    if (!alvo) return { aceito: false, motivo: `o item ${item} não existe em ${std.name}` };
    const enunciado = normalizarEspaco(alvo.text);
    if (!enunciado) {
        return { aceito: false, motivo: `o item ${item} não tem enunciado transcrito em ${std.name}: não há contra o que conferir o trecho` };
    }
    if (enunciado.includes(t)) return { aceito: true };
    const deOutro = std.items.filter((i) => i.id !== item && normalizarEspaco(i.text).includes(t)).map((i) => i.id);
    return {
        aceito: false,
        motivo: deOutro.length
            ? `o trecho não está no enunciado do item ${item}; está no do item ${deOutro.join(", ")}`
            : `o trecho não é literal: não está no enunciado do item ${item}, nem no de outro item, mesmo com o espaço normalizado`,
    };
}

export interface LeituraConferida {
    /** "completa": todo ponteiro de covered_by traz trecho; "parcial": só alguns; "ausente": nenhum. */
    estado: "completa" | "parcial" | "ausente";
    ponteiros: number;
    com_trecho: number;
    /** Ponteiros cujo trecho o conferidor aceitou: literal e do item declarado. */
    aceitos: number;
    /** Trechos que o conferidor recusou — de ponteiro ou de suspeito examinado —, com o motivo. */
    recusados: Array<{ item: string; subitem: string; motivo: string }>;
    /** Ponteiros sem trecho, "item→subitem". */
    sem_trecho: string[];
    /** Suspeitos examinados na assimilação, com trecho aceito. */
    examinados: Array<{ item: string; subitem: string; rotulo: string; por: string; em: string }>;
}

/** Confere a leitura documentada de um mapeamento: o trecho de cada ponteiro e o de cada suspeito examinado. */
export function conferirLeitura(std: Standard, mapa: Mapeamento): LeituraConferida {
    const recusados: LeituraConferida["recusados"] = [];
    const sem_trecho: string[] = [];
    const examinados: LeituraConferida["examinados"] = [];
    let ponteiros = 0, com_trecho = 0, aceitos = 0;
    for (const { id } of std.items) {
        const l = mapa.linhas.get(id);
        if (!l) continue;
        const trechos = l.trechos ?? {};
        for (const s of l.covered_by) {
            ponteiros++;
            if (trechos[s] === undefined) { sem_trecho.push(`${id}→${s}`); continue; }
            com_trecho++;
            const v = conferirTrecho(std, id, trechos[s]);
            if (v.aceito) aceitos++;
            else recusados.push({ item: id, subitem: s, motivo: v.motivo });
        }
        for (const s of Object.keys(trechos)) {
            if (!l.covered_by.includes(s)) recusados.push({ item: id, subitem: s, motivo: `trecho para ${s}, que a linha não aponta em covered_by` });
        }
        for (const e of l.examinados ?? []) {
            const v = conferirTrecho(std, id, e.trecho);
            if (!l.covered_by.includes(e.subitem)) recusados.push({ item: id, subitem: e.subitem, motivo: `suspeito examinado ${e.subitem}, que a linha não aponta em covered_by` });
            else if (!v.aceito) recusados.push({ item: id, subitem: e.subitem, motivo: `exame do suspeito: ${v.motivo}` });
            else examinados.push({ item: id, subitem: e.subitem, rotulo: e.rotulo, por: e.por, em: e.em });
        }
    }
    const estado = com_trecho === 0 ? "ausente" : sem_trecho.length ? "parcial" : "completa";
    return { estado, ponteiros, com_trecho, aceitos, recusados, sem_trecho, examinados };
}
