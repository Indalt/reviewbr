import * as fs from "node:fs";
import * as path from "node:path";
import { resolveDir, readArray, insumoDoEstagio } from "./project_artifacts.js";
import {
    conferirRegistro, titulosConferem, titulosDoCsl, doiDoRegistro, idDoRegistro, lerConferencias, buscadorPadrao,
    type Buscador, type Robots, type Conferencia,
} from "./procedencia.js";
import { robotsPermite } from "../utils/robots.js";

/**
 * Fonte inventada e retratação, desde a busca exploratória (linha 19 da FILA; pedido do Vicente de 25/11/2026,
 * ponto 4, 4.1 a 4.3, aprovado em 26/11/2026). Motivo dele: "uma tools de verificacao de retratacao que use o que
 * ja existe e que vai surgir (...) para que alguem nao comece uma pesquisa com fontes inventadas".
 *
 * Determinística, sem IA. Para cada referência:
 *  - **Existência (4.1).** Com DOI: o DOI tem registro em doi.org e o título registrado confere com o informado
 *    (a mesma regra do `verify_record_links`). Sem DOI, com endereço: o título que a página declara. Sem DOI nem
 *    endereço, só com título: a busca bibliográfica do Crossref, e confere se um dos primeiros resultados tem o
 *    mesmo título. Não achar no Crossref não prova que não existe (tese, repositório sem DOI): a situação diz isso.
 *  - **Atualizações (4.2): retratação, correção, manifestação de preocupação e as outras.** Pelo Crossref, que
 *    reúne os avisos que o editor registra e a base Retraction Watch (fonte oficial lida em 27/11/2026, abaixo).
 *    DOI fora do Crossref (DataCite, por exemplo): a consulta não se faz, e a situação diz isso.
 *  - **O resultado (4.3)** é gravado e mostrado; sozinho, não exclui ninguém. O que fazer com a referência
 *    retratada é do protocolo ou do pesquisador.
 *
 * Funciona sem projeto (busca exploratória: a lista vem na chamada), sobre o protocolo de um projeto (os DOIs que
 * o `protocol.md` cita) e sobre o insumo de um estágio (a existência já conferida pelo `verify_record_links` é
 * reaproveitada, sem pedido novo).
 */

export const FONTE_ATUALIZACOES =
    "Crossref REST API, api.crossref.org/v1/works/{DOI}: o campo 'updated-by' da obra lista os avisos que a " +
    "atualizam (tipo, rótulo, DOI do aviso, data e 'source': 'publisher', o editor, ou 'retraction-watch', a base " +
    "Retraction Watch, que o Crossref adquiriu em 09/2023 e atualiza a cada dia útil); o campo 'update-to' aparece no " +
    "próprio aviso. Documentação oficial: https://www.crossref.org/documentation/retrieve-metadata/retraction-watch/ " +
    "(atualizada em 19/01/2025) e os 12 tipos do esquema em " +
    "https://www.crossref.org/documentation/crossmark/participating-in-crossmark/ (atualizada em 12/08/2026); " +
    "lidas e conferidas na API em 27/11/2026. A própria documentação avisa: correções e manifestações de " +
    "preocupação da Retraction Watch não são tão completas quanto as retratações.";

/** Os 12 tipos de atualização do esquema do Crossref (Crossmark, lido em 27/11/2026). */
export const TIPOS_DE_ATUALIZACAO = [
    "addendum", "clarification", "correction", "corrigendum", "erratum", "expression_of_concern",
    "new_edition", "new_version", "partial_retraction", "removal", "retraction", "withdrawal",
] as const;

export const CROSSREF_WORKS = "https://api.crossref.org/v1/works";

export interface ReferenciaInformada { id?: string; titulo?: string; doi?: string; url?: string }

export type SituacaoExistencia =
    | "existe"
    | "não confere"
    | "DOI sem registro"
    | "não encontrada no Crossref"
    | "não conferida";

export interface Atualizacao {
    /** O tipo como o Crossref o dá, com hífen trocado por sublinhado (a API devolve os dois). */
    tipo: string;
    rotulo: string;
    fonte: string;
    doi_aviso: string | null;
    data: string | null;
    id_retraction_watch?: string;
}

export interface Verificacao {
    id: string;
    titulo_informado: string;
    doi_informado: string | null;
    existencia: { situacao: SituacaoExistencia; como: string; motivo: string; doi: string | null; titulo_lido: string | null };
    atualizacoes: {
        situacao: "consultada" | "não consultada";
        motivo: string;
        /** Avisos que atualizam esta referência ('updated-by'). */
        lista: Atualizacao[];
        /** A referência é ela mesma um aviso ('update-to'): o que ela atualiza. */
        e_aviso_de: Atualizacao[];
    };
    quando: string;
}

// ─── Crossref ──────────────────────────────────────────────────────────────

function dataDe(u: any): string | null {
    if (typeof u?.["date-time"] === "string") return u["date-time"].slice(0, 10);
    const p = u?.["date-parts"]?.[0];
    return Array.isArray(p) && p.length ? p.map((n: number) => String(n).padStart(2, "0")).join("-") : null;
}

export function atualizacoesDe(lista: unknown): Atualizacao[] {
    if (!Array.isArray(lista)) return [];
    return lista.map((u: any) => {
        const a: Atualizacao = {
            tipo: String(u?.type ?? "").trim().toLowerCase().replace(/-/g, "_") || "(sem tipo)",
            rotulo: String(u?.label ?? u?.type ?? ""),
            fonte: String(u?.source ?? "(não declarada)"),
            doi_aviso: u?.DOI ? String(u.DOI) : null,
            data: dataDe(u?.updated),
        };
        if (u?.["record-id"]) a.id_retraction_watch = String(u["record-id"]);
        return a;
    });
}

async function robotsDoCrossref(url: string, robots: Robots): Promise<string | null> {
    try { const v = await robots(url); return v.permitido ? null : v.motivo; }
    catch (e: any) { return `robots.txt do Crossref não lido: ${e?.message ?? e}`; }
}

export async function consultarAtualizacoes(doi: string, buscar: Buscador, robots: Robots = robotsPermite): Promise<Verificacao["atualizacoes"]> {
    const url = `${CROSSREF_WORKS}/${encodeURIComponent(doi)}`;
    const recusa = await robotsDoCrossref(url, robots);
    if (recusa) return { situacao: "não consultada", motivo: recusa, lista: [], e_aviso_de: [] };
    let r;
    try { r = await buscar(url, { Accept: "application/json" }); }
    catch (e: any) { return { situacao: "não consultada", motivo: `o Crossref não respondeu: ${e?.message ?? e}`, lista: [], e_aviso_de: [] }; }
    if (r.status === 404) {
        return { situacao: "não consultada", motivo: "DOI fora do Crossref (registrado em outra agência, como a DataCite): retratação não consultável aqui", lista: [], e_aviso_de: [] };
    }
    if (r.status >= 400) return { situacao: "não consultada", motivo: `HTTP ${r.status} no Crossref`, lista: [], e_aviso_de: [] };
    let m: any;
    try { m = JSON.parse(r.body)?.message; } catch { return { situacao: "não consultada", motivo: "resposta do Crossref ilegível", lista: [], e_aviso_de: [] }; }
    if (!m) return { situacao: "não consultada", motivo: "resposta do Crossref sem 'message'", lista: [], e_aviso_de: [] };
    const lista = atualizacoesDe(m["updated-by"]);
    const e_aviso_de = atualizacoesDe(m["update-to"]);
    const motivo = lista.length
        ? `${lista.length} aviso(s) no Crossref: ${[...new Set(lista.map((a) => a.rotulo || a.tipo))].join(", ")}`
        : "nenhum aviso de atualização no Crossref";
    return { situacao: "consultada", motivo, lista, e_aviso_de };
}

/** Sem DOI nem endereço: procura o título na busca bibliográfica do Crossref. */
async function procurarPeloTitulo(titulo: string, buscar: Buscador, robots: Robots): Promise<{ doi: string; titulo: string } | { falha: string } | null> {
    const url = `${CROSSREF_WORKS}?query.bibliographic=${encodeURIComponent(titulo)}&rows=5&select=DOI,title,subtitle`;
    const recusa = await robotsDoCrossref(url, robots);
    if (recusa) return { falha: recusa };
    let r;
    try { r = await buscar(url, { Accept: "application/json" }); }
    catch (e: any) { return { falha: `o Crossref não respondeu: ${e?.message ?? e}` }; }
    if (r.status >= 400) return { falha: `HTTP ${r.status} no Crossref` };
    let itens: any[];
    try { itens = JSON.parse(r.body)?.message?.items ?? []; } catch { return { falha: "resposta do Crossref ilegível" }; }
    for (const it of itens) {
        const casou = titulosDoCsl(it).find((t) => titulosConferem(titulo, t));
        if (casou && it?.DOI) return { doi: String(it.DOI), titulo: casou };
    }
    return null;
}

// ─── existência ────────────────────────────────────────────────────────────

function existenciaDaConferencia(c: Conferencia, comTitulo: boolean, como: string): Verificacao["existencia"] {
    const doi = c.metodo === "doi" || c.link.includes("doi.org/") ? c.link.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "") : null;
    if (c.situacao === "confere") return { situacao: "existe", como, motivo: c.motivo, doi, titulo_lido: c.titulo_lido };
    if (c.situacao === "não confere") {
        // Sem título informado, o DOI que abre e registra título prova só que o DOI existe.
        return comTitulo
            ? { situacao: "não confere", como, motivo: `o endereço abre e o título é outro (${c.motivo})`, doi, titulo_lido: c.titulo_lido }
            : { situacao: "existe", como, motivo: "o DOI tem registro em doi.org (sem título informado para comparar)", doi, titulo_lido: c.titulo_lido };
    }
    if (/HTTP 404/.test(c.motivo) && c.metodo === "doi") return { situacao: "DOI sem registro", como, motivo: c.motivo, doi, titulo_lido: null };
    return { situacao: "não conferida", como, motivo: c.motivo, doi, titulo_lido: null };
}

export interface OpcoesVerificacao {
    buscar?: Buscador;
    robots?: Robots;
    agora?: () => string;
    intervaloMs?: number;
    /** Conferências já gravadas pelo verify_record_links, por id: a existência se reaproveita. */
    conferidas?: Map<string, Conferencia>;
}

const esperar = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function verificarReferencia(ref: ReferenciaInformada, i: number, op: OpcoesVerificacao = {}): Promise<Verificacao> {
    const buscar = op.buscar ?? buscadorPadrao;
    const robots = op.robots ?? robotsPermite;
    const agora = op.agora ?? (() => new Date().toISOString());
    const titulo = String(ref.titulo ?? "").trim();
    const doiInf = doiDoRegistro({ doi: ref.doi });
    const id = String(ref.id ?? "").trim() || `ref-${i + 1}`;
    const registro = { identifier: id, title: titulo, doi: doiInf ?? "", url: String(ref.url ?? "").trim() };

    let existencia: Verificacao["existencia"];
    const gravada = op.conferidas?.get(id);
    if (gravada) {
        existencia = existenciaDaConferencia(gravada, !!titulo, `conferência do verify_record_links de ${gravada.quando.slice(0, 10)}`);
    } else if (doiInf || registro.url) {
        const c = await conferirRegistro(registro, buscar, robots, agora);
        existencia = existenciaDaConferencia(c, !!titulo, doiInf ? "metadados do DOI em doi.org" : "título declarado na página");
    } else if (titulo) {
        const achado = await procurarPeloTitulo(titulo, buscar, robots);
        if (achado && "falha" in achado) existencia = { situacao: "não conferida", como: "busca bibliográfica do Crossref", motivo: achado.falha, doi: null, titulo_lido: null };
        else if (achado) existencia = { situacao: "existe", como: "busca bibliográfica do Crossref", motivo: `título confere com o DOI ${achado.doi}`, doi: achado.doi, titulo_lido: achado.titulo };
        else existencia = {
            situacao: "não encontrada no Crossref", como: "busca bibliográfica do Crossref",
            motivo: "nenhum dos 5 primeiros resultados tem o mesmo título; o Crossref não cobre tudo (tese, repositório sem DOI), e isso não prova que a referência não existe",
            doi: null, titulo_lido: null,
        };
    } else {
        existencia = { situacao: "não conferida", como: "—", motivo: "referência sem DOI, sem endereço e sem título", doi: null, titulo_lido: null };
    }

    const doiParaConsulta = doiInf ?? existencia.doi;
    let atualizacoes: Verificacao["atualizacoes"];
    if (!doiParaConsulta) {
        atualizacoes = { situacao: "não consultada", motivo: "sem DOI: o Crossref só informa atualizações por DOI", lista: [], e_aviso_de: [] };
    } else if (existencia.situacao === "DOI sem registro") {
        atualizacoes = { situacao: "não consultada", motivo: "o DOI não tem registro em doi.org", lista: [], e_aviso_de: [] };
    } else {
        if (op.intervaloMs) await esperar(op.intervaloMs);
        atualizacoes = await consultarAtualizacoes(doiParaConsulta, buscar, robots);
    }

    return { id, titulo_informado: titulo, doi_informado: doiInf, existencia, atualizacoes, quando: agora() };
}

// ─── de onde vêm as referências ─────────────────────────────────────────────

const DOI_NO_TEXTO = /\b10\.\d{4,9}\/[^\s"'<>\]\)]+/gi;

/** Os DOIs que o texto do protocolo cita, sem repetição (o título, o protocolo não dá de forma que se leia sem IA). */
export function doisDoTexto(texto: string): string[] {
    const out = new Set<string>();
    for (const m of texto.matchAll(DOI_NO_TEXTO)) out.add(m[0].replace(/[.,;:]+$/, ""));
    return [...out];
}

export type Origem =
    | { tipo: "lista"; referencias: ReferenciaInformada[] }
    | { tipo: "protocolo"; projectPath: string }
    | { tipo: "estagio"; projectPath: string; estagio: "ta" | "fulltext" };

function referenciasDa(origem: Origem): { descricao: string; referencias: ReferenciaInformada[]; conferidas?: Map<string, Conferencia> } {
    if (origem.tipo === "lista") {
        if (!origem.referencias?.length) throw new Error("Lista de referências vazia. Nada foi verificado.");
        return { descricao: `lista informada (${origem.referencias.length})`, referencias: origem.referencias };
    }
    const dir = resolveDir(origem.projectPath);
    if (origem.tipo === "protocolo") {
        const p = path.join(dir, "protocol.md");
        if (!fs.existsSync(p)) throw new Error(`protocol.md não encontrado em ${dir}. Nada foi verificado.`);
        const dois = doisDoTexto(fs.readFileSync(p, "utf-8"));
        if (dois.length === 0) throw new Error("O protocol.md não cita nenhum DOI. As referências sem DOI vão pela lista ('referencias'), com o título. Nada foi verificado.");
        return { descricao: `DOIs citados no protocol.md (${dois.length})`, referencias: dois.map((d, i) => ({ id: `protocolo-${i + 1}`, doi: d })) };
    }
    const rel = insumoDoEstagio(dir, origem.estagio);
    const registros = readArray(path.join(dir, rel)).map((x: any) => x?.record ?? x);
    if (registros.length === 0) throw new Error(`Insumo do estágio ${origem.estagio} vazio ou ausente: ${rel}. Nada foi verificado.`);
    return {
        descricao: `insumo do estágio ${origem.estagio}, ${rel} (${registros.length})`,
        referencias: registros.map((r: any) => ({ id: idDoRegistro(r), titulo: String(r?.title ?? ""), doi: String(r?.doi ?? ""), url: String(r?.url ?? "") })),
        conferidas: lerConferencias(dir),
    };
}

// ─── a verificação de um conjunto ──────────────────────────────────────────

export interface ResultadoVerificacao { relatorio: Record<string, any>; verificacoes: Verificacao[]; resumo: string }

export async function verificarReferencias(origem: Origem, op: OpcoesVerificacao = {}): Promise<ResultadoVerificacao> {
    const { descricao, referencias, conferidas } = referenciasDa(origem);
    const opcoes = { intervaloMs: 200, ...op, conferidas: op.conferidas ?? conferidas };
    const verificacoes: Verificacao[] = [];
    for (let i = 0; i < referencias.length; i++) verificacoes.push(await verificarReferencia(referencias[i], i, opcoes));

    const porExistencia: Record<string, number> = {};
    for (const v of verificacoes) porExistencia[v.existencia.situacao] = (porExistencia[v.existencia.situacao] ?? 0) + 1;
    const porTipo: Record<string, number> = {};
    for (const v of verificacoes) for (const t of new Set(v.atualizacoes.lista.map((a) => a.tipo))) porTipo[t] = (porTipo[t] ?? 0) + 1;
    const comAviso = verificacoes.filter((v) => v.atualizacoes.lista.length > 0);
    const relatorio = {
        quando: (op.agora ?? (() => new Date().toISOString()))(),
        ferramenta: "verify_references",
        origem: descricao,
        fonte_das_atualizacoes: FONTE_ATUALIZACOES,
        regra: "Resultado gravado e mostrado; sozinho, não exclui ninguém. O que fazer com a referência retratada é do protocolo ou do pesquisador (linha 19 da FILA, 26/11/2026).",
        contagens: {
            referencias: verificacoes.length,
            existencia: porExistencia,
            atualizacoes_consultadas: verificacoes.filter((v) => v.atualizacoes.situacao === "consultada").length,
            com_algum_aviso: comAviso.length,
            referencias_por_tipo_de_aviso: porTipo,
            que_sao_avisos: verificacoes.filter((v) => v.atualizacoes.e_aviso_de.length > 0).length,
        },
    };

    const k = relatorio.contagens;
    const problema = verificacoes.filter((v) => v.existencia.situacao !== "existe" || v.atualizacoes.lista.length || v.atualizacoes.e_aviso_de.length);
    const linha = (v: Verificacao) => {
        const avisos = v.atualizacoes.lista.map((a) => `${a.rotulo || a.tipo} (${a.fonte}${a.data ? `, ${a.data}` : ""}${a.doi_aviso ? `, aviso ${a.doi_aviso}` : ""})`);
        const eAviso = v.atualizacoes.e_aviso_de.map((a) => `é aviso de ${a.rotulo || a.tipo} de ${a.doi_aviso}`);
        return `| ${v.id} | ${v.titulo_informado.slice(0, 70) || v.doi_informado || ""} | ${v.existencia.situacao}: ${v.existencia.motivo.slice(0, 110)} | ${[...avisos, ...eAviso].join("; ") || v.atualizacoes.motivo.slice(0, 90)} |`;
    };
    const resumo = [
        "## Verificação das referências: existência e retratação",
        `- **Origem:** ${descricao}`,
        `- **Existência:** ${Object.entries(k.existencia).map(([s, n]) => `${s} ${n}`).join(" · ")}`,
        `- **Atualizações no Crossref:** consultadas ${k.atualizacoes_consultadas} de ${k.referencias}; com algum aviso ${k.com_algum_aviso}` +
        (Object.keys(porTipo).length ? ` (${Object.entries(porTipo).map(([t, n]) => `${t} ${n}`).join(", ")})` : ""),
        "- O resultado não exclui ninguém: o que fazer com a referência retratada ou não encontrada é do protocolo ou do pesquisador.",
        problema.length
            ? `\n### O que pede atenção (${problema.length})\n\n| id | referência | existência | atualizações |\n|---|---|---|---|\n${problema.slice(0, 60).map(linha).join("\n")}${problema.length > 60 ? `\n… e mais ${problema.length - 60} no registro da execução` : ""}`
            : "- Todas as referências existem e nenhuma tem aviso de atualização no Crossref.",
        `\n**Fonte das atualizações:** ${FONTE_ATUALIZACOES}`,
    ].filter(Boolean).join("\n");

    return { relatorio, verificacoes, resumo };
}
