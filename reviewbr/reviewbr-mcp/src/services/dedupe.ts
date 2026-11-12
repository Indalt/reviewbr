
import { SearchResult } from "../types.js";

/** Rastro de uma duplicata removida: quem ficou, quem saiu, por que critério e de que fontes. */
export interface DedupePair {
    mantido: string;
    removido: string;
    criterio: "doi" | "handle" | "titulo_ano" | "titulo_autor" | "url";
    fontes: string[];
}

/** Nível 4: par de títulos parecidos no mesmo ano. NÃO é removido — vai ao pesquisador. */
export interface DedupeSinalizado {
    a: string;
    b: string;
    similaridade: number;
    ano: string;
    titulos: [string, string];
}

/** Limiar do nível 4 (similaridade de Dice sobre bigramas de caracteres do título). */
export const LIMIAR_SIMILARIDADE = 0.9;

/**
 * DEBT-025 — a hierarquia que a skill screening-rules declara, nesta ordem:
 *   1. DOI ou Handle idêntico, normalizado (sem resolvedor, sem "doi:", sem caixa);
 *   2. título normalizado idêntico (acento transliterado, não apagado) + mesmo ano;
 *   3. título normalizado + sobrenome do 1º autor, quando um dos dois registros não tem ano;
 *   4. título com similaridade ≥ 0,90 + mesmo ano: só SINALIZA o par (decisão de 29/10/2026);
 *      os dois registros ficam, e a decisão é do pesquisador.
 * Os níveis 2 e 3 foram fixados pelo Vicente em 12/11/2026: "título idêntico" sem ano juntaria
 * títulos genéricos de anos diferentes ("Editorial"). Dois registros com DOIs diferentes nunca
 * se juntam pelo título — o DOI é evidência mais forte de que são obras distintas. Registro com
 * DOI e registro sem DOI se comparam pelo título (antes, o ramo do DOI impedia).
 * Sem título, DOI nem Handle, o último recurso é a URL idêntica.
 */

const semAcento = (s: string): string => s.normalize("NFD").replace(/\p{M}/gu, "");

export function normalizarDoiDedup(doi: unknown): string {
    return String(doi ?? "").trim().toLowerCase()
        .replace(/^https?:\/\/(dx\.)?doi\.org\//, "").replace(/^doi:\s*/, "").trim();
}

function handleDe(r: any): string {
    for (const v of [r?.handle, r?.url, r?.identifier]) {
        const s = String(v ?? "");
        const m = s.match(/hdl\.handle\.net\/([^?#\s]+)/i) ?? s.match(/^hdl:\s*(\S+)/i);
        if (m) return m[1].toLowerCase().replace(/\/+$/, "");
    }
    return "";
}

/** Chave do título: transliterado, minúsculo, só letras e dígitos. */
export function tituloChave(t: unknown): string {
    return semAcento(String(t ?? "")).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function tituloTexto(t: unknown): string {
    return semAcento(String(t ?? "")).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function anoDe(date: unknown): string {
    return String(date ?? "").match(/(\d{4})/)?.[1] ?? "";
}

/** Sobrenome do autor: antes da vírgula ("Silva, João") ou a última palavra ("João da Silva"). */
function sobrenome(autor: unknown): string {
    const s = semAcento(String(autor ?? "")).toLowerCase().trim();
    if (!s) return "";
    const base = s.includes(",") ? s.split(",")[0] : (s.split(/\s+/).pop() ?? "");
    return base.replace(/[^a-z]/g, "");
}

function bigramas(s: string): Map<string, number> {
    const m = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
        const g = s.slice(i, i + 2);
        m.set(g, (m.get(g) ?? 0) + 1);
    }
    return m;
}

/** Similaridade de Dice (Sørensen) sobre bigramas de caracteres: 1 = idênticos. */
export function similaridadeTitulo(a: string, b: string): number {
    const x = tituloTexto(a), y = tituloTexto(b);
    if (x === y) return 1;
    if (x.length < 2 || y.length < 2) return 0;
    const A = bigramas(x), B = bigramas(y);
    let comum = 0;
    for (const [g, n] of A) comum += Math.min(n, B.get(g) ?? 0);
    return (2 * comum) / ((x.length - 1) + (y.length - 1));
}

interface Feicoes {
    doi: string;
    handle: string;
    titulo: string;
    ano: string;
    autor: string;
    url: string;
}

function feicoes(r: any): Feicoes {
    return {
        doi: normalizarDoiDedup(r?.doi),
        handle: handleDe(r),
        titulo: tituloChave(r?.title),
        ano: anoDe(r?.date),
        autor: sobrenome(Array.isArray(r?.creators) ? r.creators[0] : undefined),
        url: String(r?.url ?? "").trim(),
    };
}

const rotulo = (r: any): string => r?.identifier ?? r?.title ?? r?.url ?? "[TBD]";

export class DeduplicationService {

    deduplicate(records: SearchResult[]): {
        unique: SearchResult[];
        duplicates: SearchResult[];
        pairs: DedupePair[];
        sinalizados: DedupeSinalizado[];
        stats: any;
    } {
        const unique: SearchResult[] = [];
        const duplicates: SearchResult[] = [];
        const pairs: DedupePair[] = [];
        const f = new Map<SearchResult, Feicoes>();
        const porDoi = new Map<string, SearchResult>();
        const porHandle = new Map<string, SearchResult>();
        const porTituloAno = new Map<string, SearchResult[]>();
        const porTituloAutor = new Map<string, SearchResult[]>();
        const porUrl = new Map<string, SearchResult>();

        // Dois DOIs diferentes declaram obras diferentes: o título não os junta.
        const doiCompativel = (a: Feicoes, b: Feicoes) => !a.doi || !b.doi || a.doi === b.doi;
        const empilhar = (m: Map<string, SearchResult[]>, k: string, r: SearchResult) => {
            const l = m.get(k);
            if (l) l.push(r); else m.set(k, [r]);
        };

        const procurar = (x: Feicoes): { kept: SearchResult; criterio: DedupePair["criterio"] } | null => {
            if (x.doi && porDoi.has(x.doi)) return { kept: porDoi.get(x.doi)!, criterio: "doi" };
            if (x.handle && porHandle.has(x.handle)) return { kept: porHandle.get(x.handle)!, criterio: "handle" };
            if (x.titulo && x.ano) {
                const c = (porTituloAno.get(`${x.titulo}|${x.ano}`) ?? []).find((k) => doiCompativel(x, f.get(k)!));
                if (c) return { kept: c, criterio: "titulo_ano" };
            }
            if (x.titulo && x.autor) {
                const c = (porTituloAutor.get(`${x.titulo}|${x.autor}`) ?? [])
                    .find((k) => (!x.ano || !f.get(k)!.ano) && doiCompativel(x, f.get(k)!));
                if (c) return { kept: c, criterio: "titulo_autor" };
            }
            if (!x.titulo && !x.doi && !x.handle && x.url && porUrl.has(x.url)) return { kept: porUrl.get(x.url)!, criterio: "url" };
            return null;
        };

        for (const record of records) {
            const x = feicoes(record);
            f.set(record, x);
            const achado = procurar(x);
            if (achado) {
                duplicates.push(record);
                pairs.push({
                    mantido: rotulo(achado.kept),
                    removido: rotulo(record),
                    criterio: achado.criterio,
                    fontes: [achado.kept.repositoryName, record.repositoryName].filter((s): s is string => !!s),
                });
                continue;
            }
            unique.push(record);
            if (x.doi) porDoi.set(x.doi, record);
            if (x.handle) porHandle.set(x.handle, record);
            if (x.titulo && x.ano) empilhar(porTituloAno, `${x.titulo}|${x.ano}`, record);
            if (x.titulo && x.autor) empilhar(porTituloAutor, `${x.titulo}|${x.autor}`, record);
            if (x.url && !porUrl.has(x.url)) porUrl.set(x.url, record);
        }

        // Nível 4 — só sinaliza. Compara, entre os que ficaram, os do mesmo ano.
        const sinalizados: DedupeSinalizado[] = [];
        const porAno = new Map<string, SearchResult[]>();
        for (const r of unique) {
            const x = f.get(r)!;
            if (x.ano && x.titulo) empilhar(porAno, x.ano, r);
        }
        for (const [ano, grupo] of porAno) {
            for (let i = 0; i < grupo.length; i++) {
                for (let j = i + 1; j < grupo.length; j++) {
                    const s = similaridadeTitulo(grupo[i].title ?? "", grupo[j].title ?? "");
                    if (s >= LIMIAR_SIMILARIDADE) {
                        sinalizados.push({
                            a: rotulo(grupo[i]), b: rotulo(grupo[j]),
                            similaridade: Math.round(s * 1000) / 1000, ano,
                            titulos: [grupo[i].title ?? "", grupo[j].title ?? ""],
                        });
                    }
                }
            }
        }

        return {
            unique,
            duplicates,
            pairs,
            sinalizados,
            stats: {
                total: records.length,
                unique: unique.length,
                duplicates: duplicates.length,
                sinalizados: sinalizados.length,
            },
        };
    }
}
