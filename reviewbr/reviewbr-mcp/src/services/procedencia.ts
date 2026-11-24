import * as fs from "node:fs";
import * as path from "node:path";
import * as cheerio from "cheerio";
import { resolveDir, readArray, insumoDoEstagio } from "./project_artifacts.js";
import { fetchWithRetry } from "../utils/http.js";
import { robotsPermite } from "../utils/robots.js";

/**
 * Conferência de procedência dos links, antes da leitura humana (linha 13 da FILA; decisão do Vicente de
 * 23/11/2026). Motivo dele: a dúvida de que algum registro seja inventado ou de que o link leve a outro
 * documento minaria a confiança do revisor e do leitor.
 *
 * Determinística, sem IA: para cada registro do insumo do estágio, abre o endereço que a planilha vai mostrar
 * e compara o título que encontra lá com o título do registro.
 *  - Com DOI: pede a `doi.org` os metadados que o DOI registra (negociação de conteúdo, CSL-JSON) e compara o
 *    título registrado. DOI sem registro (HTTP 404) não abre. Agência que não atende a negociação devolve a
 *    página: lê-se então a página, como no caso sem DOI.
 *  - Sem DOI: abre a página (respeitando o `robots.txt`, com o User-Agent do ReviewBR) e lê o título que ela
 *    declara: `citation_title`, `DC.title`, `og:title` e `<title>`.
 *
 * O link que não confere ou não abre é falha do sistema: vai para `falhas_procedencia.json`, que a sessão do
 * projeto leva à manutenção, e o registro não é lido pelos revisores enquanto isso. Depois do conserto,
 * `somenteFalhas` confere de novo só esses, e o que passar a conferir volta para a leitura.
 */

export const PROCEDENCIA = "03_screening/procedencia.json";
export const PROCEDENCIA_RELATORIO = "03_screening/procedencia_relatorio.json";
export const FALHAS_PROCEDENCIA = "03_screening/revisores/falhas_procedencia.json";

export const REGRA_DE_CONFERENCIA =
    "Compara o título do registro com o título que o endereço devolve: com DOI, o título que o DOI registra em " +
    "doi.org (metadados CSL-JSON); sem DOI, o que a página declara (citation_title, DC.title, og:title ou <title>). " +
    "Os dois títulos são comparados sem acento, sem diferença de maiúscula, sem pontuação e sem espaço repetido. " +
    "Confere quando são iguais ou quando um é o começo do outro e o mais curto tem ao menos 3 palavras (título sem " +
    "o subtítulo, ou com o nome do site depois). Não confere: o endereço abre e nenhum título lido confere. Fora do " +
    "ar: o endereço não abre (DOI sem registro, erro HTTP, rede, robots.txt que proíbe, página sem título).";

export type Situacao = "confere" | "não confere" | "fora do ar";

export interface Conferencia {
    id: string;
    titulo_registro: string;
    link: string;
    metodo: "doi" | "página";
    titulo_lido: string | null;
    situacao: Situacao;
    motivo: string;
    quando: string;
}

export interface Falha {
    id: string;
    titulo: string;
    link: string;
    situacao: "não confere" | "fora do ar" | "não abriu (revisor)";
    motivo: string;
    origem: string;
    quando: string;
}

/** Resposta mínima de um pedido HTTP, para a conferência poder ser testada sem rede. */
export interface Resposta { status: number; url: string; contentType: string; body: string }
export type Buscador = (url: string, headers: Record<string, string>) => Promise<Resposta>;
export type Robots = (url: string) => Promise<{ permitido: boolean; motivo: string }>;

const buscadorPadrao: Buscador = async (url, headers) => {
    const r = await fetchWithRetry(url, { timeout: 20_000, maxRetries: 2, headers });
    return { status: r.status, url: r.url || url, contentType: r.headers.get("content-type") ?? "", body: await r.text() };
};

// ─── comparação ────────────────────────────────────────────────────────────

export function normalizarTitulo(s: unknown): string {
    return String(s ?? "")
        .replace(/<[^>]+>/g, " ")
        .normalize("NFD").replace(/\p{M}/gu, "")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();
}

export function titulosConferem(doRegistro: unknown, lido: unknown): boolean {
    const a = normalizarTitulo(doRegistro);
    const b = normalizarTitulo(lido);
    if (!a || !b) return false;
    if (a === b) return true;
    const [curto, longo] = a.length <= b.length ? [a, b] : [b, a];
    if (curto.split(" ").length < 3) return false;
    return longo.startsWith(curto + " ");
}

// ─── o link que a planilha mostra ──────────────────────────────────────────

export function doiDoRegistro(r: any): string | null {
    const d = String(r?.doi ?? "").trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "");
    return /^10\.\S+\/\S+/.test(d) ? d : null;
}

/** O link aberto a qualquer leitor: o DOI quando houver; senão, o endereço do registro. */
export function linkDoRegistro(r: any): string {
    const doi = doiDoRegistro(r);
    if (doi) return `https://doi.org/${doi}`;
    return String(r?.url ?? "").trim();
}

export function idDoRegistro(r: any): string {
    return String(r?.identifier ?? "").trim();
}

// ─── leitura do título ─────────────────────────────────────────────────────

function textos(v: unknown): string[] {
    if (Array.isArray(v)) return v.flatMap(textos);
    if (typeof v === "string" && v.trim()) return [v.trim()];
    return [];
}

/** Títulos que os metadados CSL-JSON de um DOI trazem (título, com e sem subtítulo, título original e curto). */
export function titulosDoCsl(csl: any): string[] {
    const titulo = textos(csl?.title);
    const sub = textos(csl?.subtitle);
    const comSub = titulo.length && sub.length ? [`${titulo[0]}: ${sub[0]}`] : [];
    return [...titulo, ...comSub, ...textos(csl?.["original-title"]), ...textos(csl?.["short-title"])];
}

/** Títulos que uma página declara, na ordem de confiança. */
export function titulosDaPagina(html: string): string[] {
    const $ = cheerio.load(html);
    const out: string[] = [];
    const meta = (sel: string) => $(sel).each((_, el) => { const c = $(el).attr("content"); if (c && c.trim()) out.push(c.trim()); });
    meta('meta[name="citation_title"]');
    meta('meta[name="DC.title" i], meta[name="dc.title" i], meta[name="DCTERMS.title" i]');
    meta('meta[property="og:title"]');
    const t = $("title").first().text().trim();
    if (t) out.push(t);
    return [...new Set(out)];
}

// ─── conferência de um registro ────────────────────────────────────────────

async function lerPagina(url: string, buscar: Buscador, robots: Robots): Promise<{ titulos: string[] } | { falha: string }> {
    let veredito;
    try { veredito = await robots(url); } catch (e: any) { return { falha: `robots.txt não lido: ${e?.message ?? e}` }; }
    if (!veredito.permitido) return { falha: veredito.motivo };
    let r: Resposta;
    try { r = await buscar(url, { Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8" }); }
    catch (e: any) { return { falha: `não abriu: ${e?.message ?? e}` }; }
    if (r.status >= 400) return { falha: `HTTP ${r.status}` };
    const titulos = titulosDaPagina(r.body);
    if (titulos.length === 0) return { falha: "a página abriu sem título declarado" };
    return { titulos };
}

export async function conferirRegistro(
    r: any,
    buscar: Buscador = buscadorPadrao,
    robots: Robots = robotsPermite,
    agora: () => string = () => new Date().toISOString(),
): Promise<Conferencia> {
    const id = idDoRegistro(r);
    const titulo_registro = String(r?.title ?? "");
    const link = linkDoRegistro(r);
    const doi = doiDoRegistro(r);
    const base = { id, titulo_registro, link, quando: agora() };
    const conclui = (metodo: Conferencia["metodo"], titulos: string[]): Conferencia => {
        const casou = titulos.find((t) => titulosConferem(titulo_registro, t));
        return casou
            ? { ...base, metodo, titulo_lido: casou, situacao: "confere", motivo: metodo === "doi" ? "título registrado no DOI" : "título declarado na página" }
            : { ...base, metodo, titulo_lido: titulos[0] ?? null, situacao: "não confere", motivo: `título lido: ${titulos.slice(0, 3).map((t) => `"${t}"`).join(" | ")}` };
    };
    const fora = (metodo: Conferencia["metodo"], motivo: string): Conferencia =>
        ({ ...base, metodo, titulo_lido: null, situacao: "fora do ar", motivo });

    if (!link) return fora("página", "registro sem DOI e sem endereço");

    if (doi) {
        let veredito;
        try { veredito = await robots(link); } catch (e: any) { return fora("doi", `robots.txt de doi.org não lido: ${e?.message ?? e}`); }
        if (!veredito.permitido) return fora("doi", veredito.motivo);
        let resp: Resposta;
        try { resp = await buscar(link, { Accept: "application/vnd.citationstyles.csl+json" }); }
        catch (e: any) { return fora("doi", `não abriu: ${e?.message ?? e}`); }
        if (resp.status === 404) return fora("doi", "DOI sem registro em doi.org (HTTP 404)");
        if (resp.status >= 400) return fora("doi", `HTTP ${resp.status} em doi.org`);
        if (/json/i.test(resp.contentType)) {
            let csl: any;
            try { csl = JSON.parse(resp.body); } catch { return fora("doi", "metadados do DOI ilegíveis"); }
            const titulos = titulosDoCsl(csl);
            if (titulos.length === 0) return fora("doi", "o DOI não registra título");
            return conclui("doi", titulos);
        }
        // A agência do DOI não atende a negociação de conteúdo: lê a página a que o DOI leva.
        const p = await lerPagina(resp.url || link, buscar, robots);
        return "falha" in p ? fora("página", `DOI sem metadados em doi.org; página: ${p.falha}`) : conclui("página", p.titulos);
    }

    const p = await lerPagina(link, buscar, robots);
    return "falha" in p ? fora("página", p.falha) : conclui("página", p.titulos);
}

// ─── conferência do insumo do estágio ──────────────────────────────────────

function hostDe(link: string): string {
    try { return new URL(link).host; } catch { return "(sem endereço)"; }
}

const esperar = (ms: number) => new Promise((res) => setTimeout(res, ms));

export interface OpcoesConferencia {
    estagio?: "ta" | "fulltext";
    refazer?: boolean;
    somenteFalhas?: boolean;
    /** Falhas marcadas por revisor que a manutenção declara consertadas: id → o que foi consertado. */
    consertadas?: Record<string, string>;
    buscar?: Buscador;
    robots?: Robots;
    intervaloMs?: number;
    sitesEmParalelo?: number;
    agora?: () => string;
}

export interface ResultadoConferencia {
    relatorio: Record<string, any>;
    falhas: Falha[];
    resumo: string;
}

function registrosDoInsumo(dir: string, estagio: "ta" | "fulltext"): { rel: string; registros: any[] } {
    const rel = insumoDoEstagio(dir, estagio);
    const p = path.join(dir, rel);
    if (!fs.existsSync(p)) throw new Error(`Insumo do estágio ${estagio} não encontrado: ${rel}. Nada foi conferido.`);
    const registros = readArray(p).map((x: any) => x?.record ?? x);
    if (registros.length === 0) throw new Error(`${rel} sem registros. Nada foi conferido.`);
    const vistos = new Set<string>();
    for (const r of registros) {
        const id = idDoRegistro(r);
        if (!id) throw new Error(`Registro sem identificador em ${rel} ("${String(r?.title ?? "").slice(0, 80)}"). Nada foi conferido.`);
        if (vistos.has(id)) throw new Error(`Identificador repetido em ${rel}: ${id}. Nada foi conferido.`);
        vistos.add(id);
    }
    return { rel, registros };
}

function gravar(dir: string, rel: string, dado: unknown): void {
    const p = path.join(dir, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(dado, null, 2));
}

/** As falhas de procedência que esperam a manutenção (lista vigente). */
export function lerFalhas(dir: string): Falha[] {
    return readArray(path.join(dir, FALHAS_PROCEDENCIA)) as Falha[];
}

/** A conferência gravada, por id do registro. */
export function lerConferencias(dir: string): Map<string, Conferencia & { historico?: Conferencia[] }> {
    const m = new Map<string, Conferencia & { historico?: Conferencia[] }>();
    for (const c of readArray(path.join(dir, PROCEDENCIA))) if (c?.id) m.set(String(c.id), c);
    return m;
}

export async function conferirProcedencia(projectPath: string, opcoes: OpcoesConferencia = {}): Promise<ResultadoConferencia> {
    const dir = resolveDir(projectPath);
    const estagio = opcoes.estagio ?? "ta";
    const agora = opcoes.agora ?? (() => new Date().toISOString());
    const { rel, registros } = registrosDoInsumo(dir, estagio);
    const gravadas = lerConferencias(dir);
    const falhasAntes = lerFalhas(dir);
    const idsComFalha = new Set(falhasAntes.map((f) => f.id));

    let alvo: any[];
    if (opcoes.somenteFalhas) {
        alvo = registros.filter((r) => idsComFalha.has(idDoRegistro(r)));
    } else if (opcoes.refazer) {
        alvo = registros;
    } else {
        alvo = registros.filter((r) => {
            const c = gravadas.get(idDoRegistro(r));
            return !c || c.link !== linkDoRegistro(r);
        });
    }

    const intervalo = opcoes.intervaloMs ?? 500;
    const paralelos = Math.max(1, opcoes.sitesEmParalelo ?? 4);
    const porSite = new Map<string, any[]>();
    for (const r of alvo) {
        const h = hostDe(linkDoRegistro(r));
        if (!porSite.has(h)) porSite.set(h, []);
        porSite.get(h)!.push(r);
    }

    const salvar = () => {
        const lista = registros.map((r) => gravadas.get(idDoRegistro(r))).filter(Boolean);
        gravar(dir, PROCEDENCIA, lista);
    };
    let desdeOUltimo = 0;
    const filas = [...porSite.values()];
    const trabalhador = async () => {
        for (let fila = filas.shift(); fila; fila = filas.shift()) {
            for (let i = 0; i < fila.length; i++) {
                if (i > 0 && intervalo > 0) await esperar(intervalo);
                const r = fila[i];
                const c = await conferirRegistro(r, opcoes.buscar, opcoes.robots, agora);
                const antes = gravadas.get(c.id);
                const historico = antes ? [...(antes.historico ?? []), { ...antes, historico: undefined } as Conferencia] : [];
                gravadas.set(c.id, historico.length ? { ...c, historico } : c);
                if (++desdeOUltimo >= 20) { salvar(); desdeOUltimo = 0; }
            }
        }
    };
    await Promise.all(Array.from({ length: Math.min(paralelos, Math.max(1, filas.length)) }, trabalhador));
    salvar();

    // Falhas vigentes. A da conferência sai quando a conferência passa a dar "confere". A que um revisor marcou
    // ("o link abriu o documento certo?" = não) a conferência já tinha dado como "confere": só sai com o conserto
    // declarado pela manutenção (`consertadas`) e a conferência de novo dando "confere".
    const quando = agora();
    const falhas: Falha[] = [];
    const consertadas = opcoes.consertadas ?? {};
    const conferidosAgora = new Set(alvo.map(idDoRegistro));
    for (const r of registros) {
        const id = idDoRegistro(r);
        const c = gravadas.get(id);
        const anterior = falhasAntes.find((f) => f.id === id);
        if (anterior && anterior.situacao === "não abriu (revisor)") {
            const resolvida = !!consertadas[id] && conferidosAgora.has(id) && c?.situacao === "confere";
            if (!resolvida) falhas.push(anterior);
            continue;
        }
        if (c && c.situacao !== "confere") {
            falhas.push({
                id, titulo: c.titulo_registro, link: c.link, situacao: c.situacao, motivo: c.motivo,
                origem: anterior?.origem ?? "conferência de procedência", quando: anterior?.quando ?? c.quando,
            });
        }
    }
    gravar(dir, FALHAS_PROCEDENCIA, falhas);
    const voltaram = falhasAntes.filter((f) => !falhas.some((g) => g.id === f.id)).map((f) => f.id);

    const todas = registros.map((r) => gravadas.get(idDoRegistro(r))!).filter(Boolean);
    const conta = (s: Situacao) => todas.filter((c) => c.situacao === s).length;
    const relatorio = {
        quando,
        ferramenta: "verify_record_links",
        estagio,
        insumo: rel,
        regra: REGRA_DE_CONFERENCIA,
        conferidos_nesta_chamada: alvo.length,
        modo: opcoes.somenteFalhas ? "só as falhas" : opcoes.refazer ? "todos de novo" : "os que faltavam",
        contagens: {
            insumo: registros.length,
            conferidos: todas.length,
            confere: conta("confere"),
            nao_confere: conta("não confere"),
            fora_do_ar: conta("fora do ar"),
            por_doi: todas.filter((c) => c.metodo === "doi").length,
            pela_pagina: todas.filter((c) => c.metodo === "página").length,
            falhas_pendentes: falhas.length,
        },
        voltaram_da_manutencao: voltaram,
        consertos_declarados: Object.fromEntries(Object.entries(consertadas).filter(([id]) => voltaram.includes(id))),
        arquivos: { conferencia: PROCEDENCIA, falhas: FALHAS_PROCEDENCIA },
    };
    gravar(dir, PROCEDENCIA_RELATORIO, relatorio);

    const k = relatorio.contagens;
    const linhasFalha = falhas.slice(0, 40).map((f) => `| ${f.id} | ${f.situacao} | ${f.motivo.slice(0, 120)} | ${f.link} |`);
    const resumo = [
        "## Conferência de procedência dos links",
        `- **Insumo:** ${rel}, ${k.insumo} registros; conferidos nesta chamada: ${alvo.length} (${relatorio.modo})`,
        `- **Confere:** ${k.confere} · **não confere:** ${k.nao_confere} · **fora do ar:** ${k.fora_do_ar} (pelo DOI: ${k.por_doi}; pela página: ${k.pela_pagina})`,
        k.conferidos < k.insumo ? `- ⚠️ ${k.insumo - k.conferidos} registro(s) ainda sem conferência: chame de novo.` : "",
        `- **Regra:** ${REGRA_DE_CONFERENCIA}`,
        voltaram.length ? `- **Voltaram da manutenção (agora conferem):** ${voltaram.join(", ")}` : "",
        falhas.length
            ? `\n### Falhas que esperam a manutenção (${falhas.length})\nNão vão para a planilha dos revisores; voltam depois do conserto (decisão do Vicente, 23/11/2026). Leve-as ao "Visto de passagem" da FILA da manutenção.\n\n| id | situação | motivo | link |\n|---|---|---|---|\n${linhasFalha.join("\n")}${falhas.length > 40 ? `\n… e mais ${falhas.length - 40} em ${FALHAS_PROCEDENCIA}` : ""}`
            : "- Nenhuma falha pendente.",
        `\nGravado: ${PROCEDENCIA}, ${PROCEDENCIA_RELATORIO} e ${FALHAS_PROCEDENCIA}.`,
    ].filter(Boolean).join("\n");

    return { relatorio, falhas, resumo };
}

/** Acrescenta à lista de falhas as que um revisor marcou ("o link abriu o documento certo?" = não). */
export function registrarFalhasDoRevisor(projectPath: string, novas: Falha[]): void {
    if (novas.length === 0) return;
    const dir = resolveDir(projectPath);
    const atuais = lerFalhas(dir);
    const ids = new Set(atuais.map((f) => f.id));
    gravar(dir, FALHAS_PROCEDENCIA, [...atuais, ...novas.filter((f) => !ids.has(f.id))]);
}
