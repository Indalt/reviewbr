import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import ExcelJS from "exceljs";
import { resolveDir, readArray, insumoDoEstagio, PASSADOS_PALAVRAS } from "./project_artifacts.js";
import { lerPalavrasChaveCompletadas, chaveNaFonteDoRegistro } from "./camada_palavras.js";
import { lerConferencias, lerFalhas, linkDoRegistro, idDoRegistro, doiDoRegistro, registrarFalhasDoRevisor, type Falha } from "./procedencia.js";

/**
 * Decisões dos revisores humanos, por planilha (linha 13 da FILA; plano aprovado pelo Vicente em 23/11/2026).
 *
 * O protocolo que manda dois (ou mais) revisores decidirem em separado, primeiro pelo título e resumo e depois
 * pelo texto completo, com consenso nas divergências e decisão do pesquisador sem consenso, tem aqui as suas
 * decisões gravadas por registro, com o nome de quem decidiu. É o padrão das fontes oficiais conferidas em
 * 23/11/2026 (PRISMA 2020 itens 8 e 16a; PRISMA-ScR itens 9 e 14; JBI 2024, 10.2.6; Cochrane 6.5.1, 4.6.4).
 *
 * Ações: `formulario` (esta parte), `importar`, `consenso` e `gerar`. Nenhuma IA propõe nem decide: a decisão de
 * cada linha sai das respostas do revisor, por regra fixa.
 *
 * As perguntas entram como parâmetro e cada texto tem de estar escrito, letra por letra, no `protocol.md` (o código
 * não lê a prosa do protocolo — linha 17 da FILA).
 */

export type Estagio = "ta" | "fulltext";
export interface Pergunta { id: string; texto: string; estagios?: Estagio[] }

export const PASTA_REVISORES = "03_screening/revisores";
export const manifestoRel = (e: Estagio) => `${PASTA_REVISORES}/${e}_formularios.json`;
export const decisoesRel = (e: Estagio) => `${PASTA_REVISORES}/decisoes_${e}.json`;
export const planilhaRel = (e: Estagio, rotulo: string, lote: number) =>
    `${PASTA_REVISORES}/${e}_${rotulo}${lote > 1 ? `_lote${lote}` : ""}.xlsx`;

export const RESPOSTAS: Record<Estagio, string[]> = { ta: ["sim", "não", "dúvida"], fulltext: ["sim", "não"] };
export const SIM_NAO = ["sim", "não"];
export const PAPEIS_PADRAO = ["pesquisador", "estagiário"];
const NOME_ESTAGIO: Record<Estagio, string> = { ta: "título e resumo", fulltext: "texto completo" };

export const PERGUNTA_LINK = "o link abriu o documento certo?";
export const PERGUNTA_LEU = "conseguiu ler o texto completo?";

export interface Lote { n: number; quando: string; ids: string[]; arquivos: Record<string, string> }
export interface Manifesto {
    estagio: Estagio;
    criado: string;
    insumo: string;
    insumo_hash: string;
    protocolo_hash: string;
    perguntas: Pergunta[];
    criterio_nao_recuperado: string | null;
    pergunta_idioma_tipo: string | null;
    papeis: string[];
    revisores: string[];
    lotes: Lote[];
    fora_por_procedencia: string[];
}

// ─── utilidades ────────────────────────────────────────────────────────────

export function sha256(conteudo: string | Buffer): string {
    return crypto.createHash("sha256").update(conteudo).digest("hex");
}

function lerJson<T>(p: string): T | null {
    if (!fs.existsSync(p)) return null;
    try { return JSON.parse(fs.readFileSync(p, "utf-8")) as T; } catch { return null; }
}

function gravarJson(dir: string, rel: string, dado: unknown): string {
    const p = path.join(dir, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(dado, null, 2));
    return p;
}

export function lerManifesto(dir: string, e: Estagio): Manifesto | null {
    return lerJson<Manifesto>(path.join(dir, manifestoRel(e)));
}

/** Rótulo do revisor para o nome do arquivo: sem acento, minúsculo, só letras, números, _ e -. */
export function rotuloSeguro(r: string): string {
    const s = String(r ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim()
        .replace(/[^a-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
    if (!s) throw new Error(`Rótulo de revisor inválido: "${r}".`);
    return s;
}

export function anoDe(date: unknown): string {
    const m = String(date ?? "").match(/\b(1[5-9]\d\d|20\d\d)\b/);
    return m ? m[1] : "";
}

function hostDe(url: unknown): string {
    try { return new URL(String(url)).host.replace(/^www\./, ""); } catch { return ""; }
}

function lista(v: unknown): string[] {
    if (Array.isArray(v)) return v.flat().map((x) => String(x ?? "").trim()).filter(Boolean);
    if (typeof v === "string" && v.trim()) return [v.trim()];
    return [];
}

/** Perguntas do estágio, conferidas contra o protocolo. Recusa (lança) com o que está errado. */
export function perguntasDoEstagio(protocolo: string, perguntas: Pergunta[], estagio: Estagio): Pergunta[] {
    if (!Array.isArray(perguntas) || perguntas.length === 0) throw new Error("Nenhuma pergunta informada. As perguntas de elegibilidade vêm do protocolo.");
    const ids = new Set<string>();
    for (const p of perguntas) {
        const id = String(p?.id ?? "").trim();
        if (!id) throw new Error("Pergunta sem id.");
        if (ids.has(id)) throw new Error(`Id de pergunta repetido: ${id}.`);
        ids.add(id);
        if (!String(p?.texto ?? "").trim()) throw new Error(`Pergunta ${id} sem texto.`);
        for (const e of p.estagios ?? []) if (e !== "ta" && e !== "fulltext") throw new Error(`Pergunta ${id}: estágio desconhecido "${e}".`);
    }
    const fora = perguntas.filter((p) => !protocolo.includes(String(p.texto).trim()));
    if (fora.length) {
        throw new Error(`Pergunta(s) que não estão escritas no protocol.md: ${fora.map((p) => `(${p.id}) "${p.texto}"`).join("; ")}. ` +
            "Copie o texto do protocolo sem mudar nada. Nada foi gravado.");
    }
    const doEstagio = perguntas.filter((p) => !p.estagios || p.estagios.length === 0 || p.estagios.includes(estagio))
        .map((p) => ({ id: String(p.id).trim(), texto: String(p.texto).trim(), ...(p.estagios ? { estagios: p.estagios } : {}) }));
    if (doEstagio.length === 0) throw new Error(`Nenhuma pergunta vale para o estágio ${NOME_ESTAGIO[estagio]}.`);
    return doEstagio;
}

// ─── as linhas da planilha ─────────────────────────────────────────────────

export interface Linha {
    n: number;
    id: string;
    titulo: string;
    resumo: string;
    palavras: string;
    termos: string;
    ano: string;
    tipo: string;
    idioma: string;
    fonte: string;
    revista_site: string;
    link: string;
    conferencia: string;
    par: string;
    declarado: string;
}

function termosDaCamada(item: any): string {
    const cas = Array.isArray(item?.casamentos) ? item.casamentos : [];
    const partes = cas.map((c: any) => `${c.campo}: ${lista(c.termos).join(", ")}`);
    if (item?.sem_resumo) partes.push("sem resumo (passa sem termo)");
    return partes.join("; ");
}

/** Chaves com que a F3 identifica um registro nos pares sinalizados. */
function chavesDoRegistro(r: any): string[] {
    const doi = doiDoRegistro(r);
    return [r?.identifier, r?.url, doi ? `https://doi.org/${doi}` : null, doi].filter(Boolean).map(String);
}

/**
 * Ordem de leitura (ajuda permitida pelo Vicente, 23/11/2026): agrupados pela revista; sem revista, pelo site do
 * endereço do registro; dentro do grupo, pelo título. Os dois registros de um par sinalizado na F3 ficam juntos.
 * Nenhum registro sai nem é marcado por revista, idioma ou termo.
 */
export function montarLinhas(dir: string, registros: any[], itensDaCamada: Map<string, any>, perguntaIdiomaTipo: string | null): Linha[] {
    const completadas = lerPalavrasChaveCompletadas(dir);
    const conferencias = lerConferencias(dir);
    const base = registros.map((r) => {
        const id = idDoRegistro(r);
        const grupo = String(r?.journal ?? "").trim() || hostDe(r?.url) || "(sem revista nem site)";
        const palavras = [...new Set([...lista(r?.subjectAreas), ...lista(r?.keywords), ...(completadas.get(chaveNaFonteDoRegistro(r)) ?? [])])];
        const c = conferencias.get(id);
        const tipo = [String(r?.type ?? "").trim(), String(r?.degreeType ?? "").trim()].filter(Boolean);
        const idioma = String(r?.language ?? "").trim();
        return {
            r, id, grupo,
            linha: {
                n: 0, id,
                titulo: String(r?.title ?? ""),
                resumo: String(r?.description ?? "").trim() || "(sem resumo)",
                palavras: palavras.join("; "),
                termos: termosDaCamada(itensDaCamada.get(id)),
                ano: anoDe(r?.date),
                tipo: tipo.length ? (tipo.length === 2 ? `${tipo[0]} (${tipo[1]})` : tipo[0]) : "não declarado",
                idioma: idioma || "não declarado",
                fonte: String(r?.repositoryName ?? r?._dbTag ?? ""),
                revista_site: grupo,
                link: linkDoRegistro(r),
                conferencia: c ? `${c.situacao} (${c.motivo}; ${String(c.quando).slice(0, 10)})` : "",
                par: "",
                declarado: perguntaIdiomaTipo ? `idioma: ${idioma || "não declarado"} · tipo: ${tipo.length ? tipo.join(" / ") : "não declarado"}` : "",
            } as Linha,
        };
    });
    const norm = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
    base.sort((a, b) => norm(a.grupo).localeCompare(norm(b.grupo)) || norm(a.linha.titulo).localeCompare(norm(b.linha.titulo)) || a.id.localeCompare(b.id));

    // Pares sinalizados na F3, com os dois membros na planilha: o segundo vai logo depois do primeiro.
    const relatorio = lerJson<any>(path.join(dir, "02_deduplicated/dedupe_report.json"));
    const porChave = new Map<string, string>();
    for (const b of base) for (const k of chavesDoRegistro(b.r)) porChave.set(k, b.id);
    const pares: Array<{ a: string; b: string; sim: number }> = [];
    for (const p of Array.isArray(relatorio?.pares_sinalizados) ? relatorio.pares_sinalizados : []) {
        const a = porChave.get(String(p?.a)), b = porChave.get(String(p?.b));
        if (a && b && a !== b) pares.push({ a, b, sim: Number(p?.similaridade ?? 0) });
    }
    let ordem = base;
    for (const p of pares) {
        const ia = ordem.findIndex((x) => x.id === p.a), ib = ordem.findIndex((x) => x.id === p.b);
        const [primeiro, segundo] = ia <= ib ? [p.a, p.b] : [p.b, p.a];
        const mover = ordem.find((x) => x.id === segundo)!;
        ordem = ordem.filter((x) => x.id !== segundo);
        ordem.splice(ordem.findIndex((x) => x.id === primeiro) + 1, 0, mover);
    }
    ordem.forEach((x, i) => { x.linha.n = i + 1; });
    const nDe = new Map(ordem.map((x) => [x.id, x.linha.n]));
    for (const p of pares) {
        const sim = p.sim ? ` (similaridade ${p.sim.toFixed(2).replace(".", ",")})` : "";
        ordem.find((x) => x.id === p.a)!.linha.par = `par sinalizado na F3 com o nº ${nDe.get(p.b)}${sim}: leia os dois juntos`;
        ordem.find((x) => x.id === p.b)!.linha.par = `par sinalizado na F3 com o nº ${nDe.get(p.a)}${sim}: leia os dois juntos`;
    }
    return ordem.map((x) => x.linha);
}

// ─── a planilha do revisor ─────────────────────────────────────────────────

export interface Controle {
    tool: "record_screening_decisions";
    tipo: "formulario" | "consenso";
    estagio: Estagio;
    rotulo: string;
    lote: number;
    insumo_hash: string;
    cabecalho: number;
    primeira: number;
    ultima: number;
    colunas: Record<string, number>;
    ident: Record<string, string>;
}

export const PREFIXO_CONTROLE = "controle do ReviewBR (não altere): ";

const CINZA = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE7E6E6" } } as const;
const AMARELO = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF2CC" } } as const;
const AMARELO_FORTE = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFE699" } } as const;

function validacaoLista(opcoes: string[]): ExcelJS.DataValidation {
    return {
        type: "list", allowBlank: true, formulae: [`"${opcoes.join(",")}"`],
        showErrorMessage: true, errorStyle: "stop", errorTitle: "Valor fora da lista", error: `Escolha: ${opcoes.join(", ")}.`,
    };
}

function instrucoes(estagio: Estagio, temIdiomaTipo: string | null): string[] {
    const comum = [
        "Decida em separado: não veja as respostas do outro revisor antes de devolver esta planilha.",
        "Leia cada linha. O link abre o documento na internet (o DOI, quando há); use-o sempre que o título e o resumo não bastarem.",
        `Coluna "${PERGUNTA_LINK}": marque "não" se o link não abrir ou levar a outro documento. Esse registro vai para a manutenção do ReviewBR e volta para a leitura depois do conserto; deixe as perguntas dele em branco.`,
    ];
    const ta = [
        "Para cada pergunta, escolha na lista: sim, não ou dúvida.",
        "Um \"não\" em qualquer pergunta exclui o registro. Sem \"não\" e com alguma \"dúvida\", o registro segue para o texto completo. \"Sim\" em todas: segue para o texto completo.",
        "Marcou \"dúvida\"? Escreva na observação o que gerou a dúvida (obrigatório). Nas outras linhas, a observação é livre.",
    ];
    const ft = [
        `Primeiro, "${PERGUNTA_LEU}" (sim ou não). "Não": deixe as perguntas em branco; o registro conta como texto completo não recuperado, pelo critério do protocolo abaixo.`,
        "\"Sim\": responda cada pergunta com sim ou não. \"Sim\" em todas inclui o registro; um \"não\" o exclui. No texto completo não há \"dúvida\".",
        "A observação é livre.",
    ];
    const fim = [
        ...(temIdiomaTipo ? [`Ao lado da pergunta (${temIdiomaTipo}) está o idioma e o tipo que a fonte declara: confirme ou corrija na sua resposta.`] : []),
        "Só as células em amarelo se preenchem. Não mude a ordem das linhas nem das colunas e não apague linhas.",
        "Ao terminar, preencha a data de fim, salve o arquivo em .xlsx e devolva-o.",
    ];
    return [...comum, ...(estagio === "ta" ? ta : ft), ...fim];
}

export async function escreverPlanilhaDoRevisor(
    caminho: string,
    a: {
        estagio: Estagio; rotulo: string; lote: number; insumoHash: string;
        perguntas: Pergunta[]; criterio: string | null; perguntaIdiomaTipo: string | null; papeis: string[]; linhas: Linha[];
    },
): Promise<void> {
    const wb = new ExcelJS.Workbook();
    wb.creator = "ReviewBR";
    const ws = wb.addWorksheet(a.estagio === "ta" ? "Título e resumo" : "Texto completo");

    // Colunas: as de leitura (travadas) e as de resposta (abertas).
    type Col = { key: string; header: string; width: number; resposta?: string[] };
    const leitura: Col[] = [
        { key: "n", header: "nº", width: 6 }, { key: "id", header: "id", width: 22 },
        { key: "titulo", header: "título", width: 45 }, { key: "resumo", header: "resumo", width: 80 },
        { key: "palavras", header: "palavras-chave", width: 30 }, { key: "termos", header: "termos do protocolo que casaram", width: 24 },
        { key: "ano", header: "ano", width: 7 }, { key: "tipo", header: "tipo", width: 18 }, { key: "idioma", header: "idioma", width: 10 },
        { key: "fonte", header: "fonte", width: 24 }, { key: "revista_site", header: "revista ou site", width: 24 },
        { key: "link", header: "link", width: 36 }, { key: "conferencia", header: "conferência do link", width: 26 },
        { key: "par", header: "par da F3", width: 22 },
    ];
    const respostas: Col[] = [{ key: "link_abriu", header: PERGUNTA_LINK, width: 16, resposta: SIM_NAO }];
    if (a.estagio === "fulltext") respostas.push({ key: "leu", header: PERGUNTA_LEU, width: 16, resposta: SIM_NAO });
    for (const p of a.perguntas) {
        if (a.perguntaIdiomaTipo === p.id) respostas.push({ key: `declarado:${p.id}`, header: `(${p.id}) o que a fonte declara`, width: 24 });
        respostas.push({ key: `p:${p.id}`, header: `(${p.id}) ${p.texto}`, width: 22, resposta: RESPOSTAS[a.estagio] });
    }
    respostas.push({ key: "observacao", header: "observação", width: 40 });
    const colunas = [...leitura, ...respostas];
    colunas.forEach((c, i) => { ws.getColumn(i + 1).width = c.width; });
    const ultimaCol = colunas.length;

    // Topo.
    let r = 1;
    const linhaCheia = (texto: string, opc: { negrito?: boolean; tamanho?: number; cor?: string } = {}) => {
        ws.mergeCells(r, 1, r, Math.min(ultimaCol, 14));
        const c = ws.getCell(r, 1);
        c.value = texto;
        c.alignment = { wrapText: true, vertical: "top" };
        c.font = { bold: !!opc.negrito, size: opc.tamanho ?? 11, ...(opc.cor ? { color: { argb: opc.cor } } : {}) };
        const linhasDeTexto = Math.ceil(texto.length / 180);
        if (linhasDeTexto > 1) ws.getRow(r).height = 15 * linhasDeTexto;
        r++;
    };
    linhaCheia(`ReviewBR — triagem por ${NOME_ESTAGIO[a.estagio]} — planilha do revisor "${a.rotulo}"${a.lote > 1 ? ` — lote ${a.lote} (registros que voltaram da manutenção)` : ""}`, { negrito: true, tamanho: 13 });
    const linhaControle = r++;
    r++;
    ws.getCell(r, 1).value = "Identificação do revisor (preencha antes de começar)";
    ws.getCell(r, 1).font = { bold: true };
    r++;
    const ident: Record<string, string> = {};
    for (const [chave, rotulo] of [["nome", "Nome"], ["papel", "Papel"], ["inicio", "Data de início da leitura"], ["fim", "Data de fim da leitura"]] as const) {
        ws.getCell(r, 1).value = rotulo;
        ws.mergeCells(r, 1, r, 2);
        const c = ws.getCell(r, 3);
        c.fill = AMARELO_FORTE;
        c.protection = { locked: false };
        if (chave === "papel") c.dataValidation = validacaoLista(a.papeis);
        if (chave === "inicio" || chave === "fim") c.note = "dia/mês/ano";
        ident[chave] = c.address;
        r++;
    }
    r++;
    linhaCheia("O que fazer", { negrito: true });
    instrucoes(a.estagio, a.perguntaIdiomaTipo).forEach((t, i) => linhaCheia(`${i + 1}. ${t}`));
    r++;
    linhaCheia("Perguntas do protocolo, como estão escritas nele", { negrito: true });
    for (const p of a.perguntas) linhaCheia(`(${p.id}) ${p.texto}`);
    if (a.estagio === "fulltext") {
        linhaCheia(a.criterio ? `Critério do protocolo para o texto completo indisponível: ${a.criterio}` : "O protocolo não traz critério para o texto completo indisponível.");
    }
    r++;

    // Cabeçalho e linhas.
    const cab = r;
    colunas.forEach((c, i) => {
        const cell = ws.getCell(cab, i + 1);
        cell.value = c.header;
        cell.font = { bold: true };
        cell.alignment = { wrapText: true, vertical: "top" };
        cell.fill = c.resposta || c.key === "observacao" ? AMARELO_FORTE : CINZA;
        cell.border = { bottom: { style: "thin" } };
    });
    ws.getRow(cab).height = 60;
    const primeira = cab + 1;
    a.linhas.forEach((l, i) => {
        const row = ws.getRow(primeira + i);
        colunas.forEach((c, j) => {
            const cell = row.getCell(j + 1);
            if (c.key.startsWith("declarado:")) cell.value = l.declarado;
            else if (c.resposta || c.key === "observacao") {
                cell.protection = { locked: false };
                cell.fill = AMARELO;
                if (c.resposta) cell.dataValidation = validacaoLista(c.resposta);
            } else if (c.key === "link") {
                cell.value = l.link ? { text: l.link, hyperlink: l.link } : "";
                cell.font = { color: { argb: "FF0563C1" }, underline: true };
            } else {
                const v = (l as any)[c.key];
                cell.value = typeof v === "string" && v.length > 32000 ? v.slice(0, 32000) + " […]" : v;
            }
            cell.alignment = { wrapText: true, vertical: "top" };
        });
    });
    const ultima = primeira + a.linhas.length - 1;
    ws.views = [{ state: "frozen", xSplit: 3, ySplit: cab }];

    const controle: Controle = {
        tool: "record_screening_decisions", tipo: "formulario", estagio: a.estagio, rotulo: a.rotulo, lote: a.lote,
        insumo_hash: a.insumoHash, cabecalho: cab, primeira, ultima,
        colunas: Object.fromEntries(colunas.map((c, i) => [c.key, i + 1])), ident,
    };
    const cc = ws.getCell(linhaControle, 1);
    cc.value = PREFIXO_CONTROLE + JSON.stringify(controle);
    cc.font = { size: 8, color: { argb: "FF808080" } };

    await ws.protect("", {
        selectLockedCells: true, selectUnlockedCells: true, formatColumns: true, formatRows: true,
        sort: false, autoFilter: false, insertRows: false, deleteRows: false, insertColumns: false, deleteColumns: false,
    });
    fs.mkdirSync(path.dirname(caminho), { recursive: true });
    await wb.xlsx.writeFile(caminho);
}

// ─── ação formulario ───────────────────────────────────────────────────────

export interface OpcoesFormulario {
    estagio: Estagio;
    revisores: string[];
    perguntas: Pergunta[];
    criterioNaoRecuperado?: string;
    perguntaIdiomaTipo?: string;
    papeis?: string[];
    pendentes?: boolean;
    agora?: () => string;
}

/** O insumo do estágio, com os itens como gravados (para os termos que casaram) e os registros. */
export function lerInsumo(dir: string, estagio: Estagio): { rel: string; hash: string; registros: any[]; itensDaCamada: Map<string, any> } {
    const rel = insumoDoEstagio(dir, estagio);
    const p = path.join(dir, rel);
    if (!fs.existsSync(p)) throw new Error(`Insumo do estágio ${NOME_ESTAGIO[estagio]} não encontrado: ${rel}. Nada foi gravado.`);
    const bruto = fs.readFileSync(p, "utf-8");
    const registros = readArray(p).map((x: any) => x?.record ?? x);
    if (registros.length === 0) throw new Error(`${rel} sem registros. Nada foi gravado.`);
    const ids = new Set<string>();
    for (const r of registros) {
        const id = idDoRegistro(r);
        if (!id) throw new Error(`Registro sem identificador em ${rel}. Nada foi gravado.`);
        if (ids.has(id)) throw new Error(`Identificador repetido em ${rel}: ${id}. Nada foi gravado.`);
        ids.add(id);
    }
    // Os termos que casaram estão nos itens da camada por palavras (também no texto completo, cujo insumo é outro).
    const itensDaCamada = new Map<string, any>();
    for (const it of readArray(path.join(dir, PASSADOS_PALAVRAS))) itensDaCamada.set(idDoRegistro(it?.record ?? it), it);
    return { rel, hash: sha256(bruto), registros, itensDaCamada };
}

export interface ResultadoFormulario { manifesto: Manifesto; lote: Lote; fora: string[]; resumo: string }

export async function gerarFormularios(projectPath: string, o: OpcoesFormulario): Promise<ResultadoFormulario> {
    const dir = resolveDir(projectPath);
    const agora = o.agora ?? (() => new Date().toISOString());
    const estagio = o.estagio;
    if (estagio !== "ta" && estagio !== "fulltext") throw new Error(`Estágio desconhecido: ${estagio}.`);

    const protPath = path.join(dir, "protocol.md");
    if (!fs.existsSync(protPath)) throw new Error("Projeto sem protocol.md: as perguntas vêm do protocolo. Nada foi gravado.");
    const protocolo = fs.readFileSync(protPath, "utf-8");
    const perguntas = perguntasDoEstagio(protocolo, o.perguntas, estagio);
    const criterio = (o.criterioNaoRecuperado ?? "").trim() || null;
    if (criterio && !protocolo.includes(criterio)) throw new Error("O critério para o texto indisponível não está escrito no protocol.md. Copie-o sem mudar nada. Nada foi gravado.");
    if (criterio && estagio !== "fulltext") throw new Error("O critério para o texto indisponível só vale no estágio do texto completo. Nada foi gravado.");
    const perguntaIdiomaTipo = (o.perguntaIdiomaTipo ?? "").trim() || null;
    if (perguntaIdiomaTipo && !perguntas.some((p) => p.id === perguntaIdiomaTipo)) {
        throw new Error(`A pergunta indicada para o idioma e o tipo (${perguntaIdiomaTipo}) não está entre as do estágio. Nada foi gravado.`);
    }
    const papeis = (o.papeis && o.papeis.length ? o.papeis : PAPEIS_PADRAO).map((p) => String(p).trim()).filter(Boolean);
    if (!Array.isArray(o.revisores) || o.revisores.length === 0) throw new Error("Informe os rótulos dos revisores (um por revisor). Nada foi gravado.");
    const revisores = o.revisores.map(rotuloSeguro);
    if (new Set(revisores).size !== revisores.length) throw new Error("Rótulos de revisor repetidos. Nada foi gravado.");

    const insumo = lerInsumo(dir, estagio);
    const conferencias = lerConferencias(dir);
    const semConferencia = insumo.registros.filter((r) => !conferencias.has(idDoRegistro(r))).map(idDoRegistro);
    if (semConferencia.length) {
        throw new Error(`${semConferencia.length} registro(s) do insumo sem a conferência de procedência dos links (ex.: ${semConferencia.slice(0, 5).join(", ")}). ` +
            "Rode antes o verify_record_links. Nada foi gravado.");
    }
    const idsComFalha = new Set(lerFalhas(dir).map((f) => f.id));
    const elegivel = (r: any) => {
        const id = idDoRegistro(r);
        return !idsComFalha.has(id) && conferencias.get(id)?.situacao === "confere";
    };
    const fora = insumo.registros.filter((r) => !elegivel(r)).map(idDoRegistro);

    const existente = lerManifesto(dir, estagio);
    const decisoes = lerJson<any>(path.join(dir, decisoesRel(estagio)));
    const temImportacao = Array.isArray(decisoes?.importacoes) && decisoes.importacoes.length > 0;
    let manifesto: Manifesto;
    let idsDoLote: string[];
    let n: number;
    if (o.pendentes) {
        if (!existente) throw new Error("Não há planilhas geradas neste estágio: 'pendentes' só vale depois do primeiro lote. Nada foi gravado.");
        if (existente.insumo_hash !== insumo.hash) throw new Error(`O insumo (${insumo.rel}) mudou desde as planilhas de ${existente.criado.slice(0, 10)}. Nada foi gravado.`);
        const jaEmLote = new Set(existente.lotes.flatMap((l) => l.ids));
        const comFalhaDeRevisor = new Set<string>(
            Object.entries(decisoes?.registros ?? {}).filter(([, porRevisor]: [string, any]) =>
                Object.values(porRevisor ?? {}).some((d: any) => d?.decisao === "falha de procedência")).map(([id]) => id));
        idsDoLote = insumo.registros.filter((r) => elegivel(r) && (!jaEmLote.has(idDoRegistro(r)) || comFalhaDeRevisor.has(idDoRegistro(r)))).map(idDoRegistro);
        if (idsDoLote.length === 0) throw new Error("Nenhum registro voltou da manutenção para a leitura (confira com o verify_record_links e somenteFalhas). Nada foi gravado.");
        manifesto = existente;
        n = existente.lotes.length + 1;
    } else {
        if (existente && temImportacao) {
            throw new Error("Já há planilhas deste estágio importadas. Para os registros que voltaram da manutenção, use 'pendentes'. Nada foi gravado.");
        }
        idsDoLote = insumo.registros.filter(elegivel).map(idDoRegistro);
        if (idsDoLote.length === 0) throw new Error("Nenhum registro do insumo tem a procedência confirmada. Nada foi gravado.");
        n = 1;
        manifesto = {
            estagio, criado: agora(), insumo: insumo.rel, insumo_hash: insumo.hash, protocolo_hash: sha256(protocolo),
            perguntas, criterio_nao_recuperado: criterio, pergunta_idioma_tipo: perguntaIdiomaTipo, papeis, revisores,
            lotes: [], fora_por_procedencia: fora,
        };
    }
    if (o.pendentes) {
        // O lote novo usa as perguntas e os revisores do primeiro: o mesmo estágio não muda de regra no meio.
        const mesmo = JSON.stringify(manifesto.perguntas) === JSON.stringify(perguntas) && JSON.stringify(manifesto.revisores) === JSON.stringify(revisores);
        if (!mesmo) throw new Error("O lote dos que voltaram da manutenção usa as mesmas perguntas e os mesmos revisores das planilhas anteriores. Nada foi gravado.");
    }

    const porId = new Map(insumo.registros.map((r) => [idDoRegistro(r), r]));
    const linhas = montarLinhas(dir, idsDoLote.map((id) => porId.get(id)), insumo.itensDaCamada, manifesto.pergunta_idioma_tipo);
    const arquivos: Record<string, string> = {};
    for (const rotulo of manifesto.revisores) {
        const rel = planilhaRel(estagio, rotulo, n);
        await escreverPlanilhaDoRevisor(path.join(dir, rel), {
            estagio, rotulo, lote: n, insumoHash: insumo.hash, perguntas: manifesto.perguntas, criterio: manifesto.criterio_nao_recuperado,
            perguntaIdiomaTipo: manifesto.pergunta_idioma_tipo, papeis: manifesto.papeis, linhas,
        });
        arquivos[rotulo] = rel;
    }
    const lote: Lote = { n, quando: agora(), ids: linhas.map((l) => l.id), arquivos };
    manifesto.lotes = [...manifesto.lotes.filter((l) => l.n !== n), lote];
    if (!o.pendentes) manifesto.fora_por_procedencia = fora;
    gravarJson(dir, manifestoRel(estagio), manifesto);

    const resumo = [
        `## Planilhas dos revisores — ${NOME_ESTAGIO[estagio]}${n > 1 ? `, lote ${n}` : ""}`,
        `- **Insumo:** ${insumo.rel}, ${insumo.registros.length} registros; **na planilha:** ${lote.ids.length}`,
        fora.length ? `- **Fora, esperando a manutenção (procedência):** ${fora.length} — voltam depois do conserto (lista em 03_screening/revisores/falhas_procedencia.json)` : "- Todos os registros com a procedência confirmada.",
        `- **Perguntas:** ${manifesto.perguntas.map((p) => `(${p.id})`).join(" ")} — respostas ${RESPOSTAS[estagio].join(" / ")}${estagio === "fulltext" ? `; antes, "${PERGUNTA_LEU}"` : ""}`,
        `- **Uma planilha por revisor, todas com os mesmos registros:**`,
        ...Object.entries(arquivos).map(([rot, rel]) => `  - ${rot}: ${rel}`),
        `- Manifesto: ${manifestoRel(estagio)}. Envie cada planilha ao seu revisor; quando voltar preenchida, importe com a ação 'importar'.`,
    ].join("\n");
    return { manifesto, lote, fora, resumo };
}

// ─── leitura de uma planilha devolvida ─────────────────────────────────────

/** O texto de uma célula, qualquer que seja a forma em que a planilha o guardou. */
export function textoDaCelula(v: unknown): string {
    if (v === null || v === undefined) return "";
    if (v instanceof Date) return v.toISOString();
    if (typeof v === "object") {
        const o = v as any;
        if (Array.isArray(o.richText)) return o.richText.map((t: any) => String(t?.text ?? "")).join("").trim();
        if ("result" in o) return textoDaCelula(o.result);
        if ("text" in o) return textoDaCelula(o.text);
        return "";
    }
    return String(v).trim();
}

/** Data de uma célula: data do Excel, dd/mm/aaaa ou aaaa-mm-dd. Devolve aaaa-mm-dd ou null. */
export function dataDaCelula(v: unknown): string | null {
    if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString().slice(0, 10);
    const s = textoDaCelula(v);
    let m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
    if (m) {
        const [d, mes, a] = [Number(m[1]), Number(m[2]), Number(m[3])];
        const dt = new Date(Date.UTC(a, mes - 1, d));
        return dt.getUTCDate() === d && dt.getUTCMonth() === mes - 1 ? dt.toISOString().slice(0, 10) : null;
    }
    m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
        const dt = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
        return isNaN(dt.getTime()) ? null : dt.toISOString().slice(0, 10);
    }
    return null;
}

/** Resposta normalizada para uma das opções (sem diferença de acento nem de maiúscula), ou null se não for nenhuma. */
export function respostaDe(bruto: string, opcoes: string[]): string | null {
    const n = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
    const alvo = n(bruto);
    return opcoes.find((o) => n(o) === alvo) ?? null;
}

export async function lerControle(arquivo: string): Promise<{ wb: ExcelJS.Workbook; ws: ExcelJS.Worksheet; controle: Controle }> {
    if (!fs.existsSync(arquivo)) throw new Error(`Arquivo não encontrado: ${arquivo}. Nada foi gravado.`);
    const wb = new ExcelJS.Workbook();
    try { await wb.xlsx.readFile(arquivo); }
    catch (e: any) { throw new Error(`Não foi possível ler ${path.basename(arquivo)} como .xlsx (${e?.message ?? e}). Salve a planilha em .xlsx. Nada foi gravado.`); }
    for (const ws of wb.worksheets) {
        for (let i = 1; i <= Math.min(ws.rowCount, 12); i++) {
            const v = textoDaCelula(ws.getCell(i, 1).value);
            if (v.startsWith(PREFIXO_CONTROLE)) {
                try { return { wb, ws, controle: JSON.parse(v.slice(PREFIXO_CONTROLE.length)) as Controle }; }
                catch { throw new Error("A linha de controle do ReviewBR na planilha foi alterada. Use o arquivo gerado pela tool. Nada foi gravado."); }
            }
        }
    }
    throw new Error("A planilha não tem a linha de controle do ReviewBR: não é uma planilha gerada pela record_screening_decisions. Nada foi gravado.");
}

// ─── decisões gravadas ─────────────────────────────────────────────────────

export type Decisao = "segue" | "excluir" | "incluir" | "não recuperado" | "falha de procedência";

export interface DecisaoDoRevisor {
    nome: string;
    papel: string;
    lote: number;
    link_abriu: string;
    leu?: string;
    respostas: Record<string, string>;
    observacao: string;
    decisao: Decisao;
    motivo: string;
    com_duvida?: string[];
    historico?: Omit<DecisaoDoRevisor, "historico">[];
}

export interface Importacao {
    rotulo: string;
    lote: number;
    arquivo: string;
    copia: string;
    hash: string;
    quando: string;
    nome: string;
    papel: string;
    inicio: string;
    fim: string;
    linhas: number;
    substituiu?: { autorizacao: string; arquivada: string };
}

export interface ArquivoDeDecisoes {
    estagio: Estagio;
    importacoes: Importacao[];
    registros: Record<string, Record<string, DecisaoDoRevisor>>;
    consenso?: Record<string, any>;
    consensos?: any[];
}

export function lerDecisoes(dir: string, e: Estagio): ArquivoDeDecisoes {
    return lerJson<ArquivoDeDecisoes>(path.join(dir, decisoesRel(e))) ?? { estagio: e, importacoes: [], registros: {} };
}

/** A decisão de uma linha, pela regra fixa (decisões do Vicente de 23/11/2026). Sem escolha à mão. */
export function decidir(estagio: Estagio, perguntas: Pergunta[], linkAbriu: string, leu: string | undefined, respostas: Record<string, string>):
    { decisao: Decisao; motivo: string; com_duvida?: string[] } {
    if (linkAbriu === "não") return { decisao: "falha de procedência", motivo: "o revisor marcou que o link não abriu o documento certo" };
    if (estagio === "fulltext" && leu === "não") return { decisao: "não recuperado", motivo: "o revisor não conseguiu ler o texto completo" };
    const nao = perguntas.filter((p) => respostas[p.id] === "não");
    if (nao.length) return { decisao: "excluir", motivo: nao.map((p) => `(${p.id}) ${p.texto}`).join("; ") };
    if (estagio === "ta") {
        const duvida = perguntas.filter((p) => respostas[p.id] === "dúvida").map((p) => p.id);
        return duvida.length
            ? { decisao: "segue", motivo: `sem "não"; dúvida em ${duvida.map((d) => `(${d})`).join(" ")}`, com_duvida: duvida }
            : { decisao: "segue", motivo: "\"sim\" em todas as perguntas" };
    }
    return { decisao: "incluir", motivo: "\"sim\" em todas as perguntas" };
}

// ─── ação importar (planilha de revisor) ───────────────────────────────────

export interface OpcoesImportar { arquivo: string; substituicao?: string; agora?: () => string }

export interface ResultadoImportar {
    estagio: Estagio;
    rotulo: string;
    lote: number;
    contagens: Record<string, number>;
    falhas: string[];
    faltam: string[];
    resumo: string;
}

export async function importarPlanilha(projectPath: string, o: OpcoesImportar): Promise<ResultadoImportar> {
    const dir = resolveDir(projectPath);
    const agora = o.agora ?? (() => new Date().toISOString());
    const arquivo = path.isAbsolute(o.arquivo) ? o.arquivo : path.join(dir, o.arquivo);
    const { ws, controle } = await lerControle(arquivo);
    if (controle.tipo !== "formulario") {
        throw new Error(`Esta é uma planilha de ${controle.tipo}, não a de um revisor. Nada foi gravado.`);
    }
    const estagio = controle.estagio;
    const m = lerManifesto(dir, estagio);
    if (!m) throw new Error(`Não há planilhas geradas no estágio ${NOME_ESTAGIO[estagio]} deste projeto: a planilha é de outro projeto ou estágio. Nada foi gravado.`);
    if (controle.insumo_hash !== m.insumo_hash) throw new Error("A planilha foi gerada de outro insumo (hash diferente do manifesto): é de outro projeto ou de uma geração anterior. Nada foi gravado.");
    const insumoAtual = sha256(fs.readFileSync(path.join(dir, m.insumo), "utf-8"));
    if (insumoAtual !== m.insumo_hash) throw new Error(`O insumo (${m.insumo}) mudou depois que as planilhas foram geradas. Nada foi gravado.`);
    if (!m.revisores.includes(controle.rotulo)) throw new Error(`Revisor "${controle.rotulo}" não está no manifesto do estágio. Nada foi gravado.`);
    const lote = m.lotes.find((l) => l.n === controle.lote);
    if (!lote) throw new Error(`Lote ${controle.lote} não está no manifesto do estágio. Nada foi gravado.`);

    const erros: string[] = [];
    // Identificação.
    const nome = textoDaCelula(ws.getCell(controle.ident.nome).value);
    const papelBruto = textoDaCelula(ws.getCell(controle.ident.papel).value);
    const papel = respostaDe(papelBruto, m.papeis);
    const inicio = dataDaCelula(ws.getCell(controle.ident.inicio).value);
    const fim = dataDaCelula(ws.getCell(controle.ident.fim).value);
    if (!nome) erros.push("identificação: o nome do revisor está em branco");
    if (!papel) erros.push(`identificação: papel ${papelBruto ? `"${papelBruto}" fora da lista` : "em branco"} (${m.papeis.join(", ")})`);
    if (!inicio) erros.push("identificação: data de início em branco ou ilegível (use dia/mês/ano)");
    if (!fim) erros.push("identificação: data de fim em branco ou ilegível (use dia/mês/ano)");
    if (inicio && fim && fim < inicio) erros.push("identificação: a data de fim é anterior à de início");

    // Linhas.
    const c = controle.colunas;
    const opcoes = RESPOSTAS[estagio];
    const vistos = new Map<string, number>();
    const linhas: Array<{ id: string; d: DecisaoDoRevisor }> = [];
    for (let i = controle.primeira; i <= controle.ultima; i++) {
        const id = textoDaCelula(ws.getCell(i, c.id).value);
        const nOrdem = textoDaCelula(ws.getCell(i, c.n).value);
        const onde = `linha ${i} (nº ${nOrdem}, id ${id || "em branco"})`;
        if (!id) { erros.push(`${onde}: sem id`); continue; }
        if (vistos.has(id)) { erros.push(`${onde}: id repetido (também na linha ${vistos.get(id)})`); continue; }
        vistos.set(id, i);
        const val = (k: string) => textoDaCelula(ws.getCell(i, c[k]).value);
        const linkBruto = val("link_abriu");
        const link = respostaDe(linkBruto, SIM_NAO);
        if (!link) { erros.push(`${onde}: "${PERGUNTA_LINK}" ${linkBruto ? `com "${linkBruto}", fora da lista` : "em branco"}`); continue; }
        const observacao = val("observacao");
        const respostas: Record<string, string> = {};
        let leu: string | undefined;
        if (link === "sim") {
            if (estagio === "fulltext") {
                const leuBruto = val("leu");
                leu = respostaDe(leuBruto, SIM_NAO) ?? undefined;
                if (!leu) { erros.push(`${onde}: "${PERGUNTA_LEU}" ${leuBruto ? `com "${leuBruto}", fora da lista` : "em branco"}`); continue; }
            }
            if (!(estagio === "fulltext" && leu === "não")) {
                for (const p of m.perguntas) {
                    const bruto = val(`p:${p.id}`);
                    const r = respostaDe(bruto, opcoes);
                    if (!r) {
                        const dica = estagio === "fulltext" && respostaDe(bruto, ["dúvida"]) ? " (no texto completo não há \"dúvida\")" : "";
                        erros.push(`${onde}: pergunta (${p.id}) ${bruto ? `com "${bruto}", fora da lista${dica}` : "em branco"}`);
                    } else respostas[p.id] = r;
                }
                if (Object.values(respostas).includes("dúvida") && !observacao) {
                    erros.push(`${onde}: há "dúvida" e a observação está em branco (obrigatória na dúvida)`);
                }
            }
        }
        const d = decidir(estagio, m.perguntas, link, leu, respostas);
        linhas.push({ id, d: { nome, papel: papel ?? papelBruto, lote: controle.lote, link_abriu: link, ...(leu ? { leu } : {}), respostas, observacao, ...d } });
    }
    const esperados = new Set(lote.ids);
    const faltando = lote.ids.filter((id) => !vistos.has(id));
    const sobrando = [...vistos.keys()].filter((id) => !esperados.has(id));
    if (faltando.length) erros.push(`faltam ${faltando.length} registro(s) do lote: ${faltando.slice(0, 10).join(", ")}${faltando.length > 10 ? "…" : ""}`);
    if (sobrando.length) erros.push(`${sobrando.length} id(s) que não são do lote: ${sobrando.slice(0, 10).join(", ")}${sobrando.length > 10 ? "…" : ""}`);
    if (erros.length) {
        throw new Error(`Planilha de "${controle.rotulo}" (${NOME_ESTAGIO[estagio]}, lote ${controle.lote}) recusada, ${erros.length} problema(s):\n` +
            erros.slice(0, 40).map((e) => `- ${e}`).join("\n") + (erros.length > 40 ? `\n… e mais ${erros.length - 40}` : "") +
            "\nCorrija na planilha e importe de novo. Nada foi gravado.");
    }

    // Gravação.
    const decisoes = lerDecisoes(dir, estagio);
    const quando = agora();
    const bruto = fs.readFileSync(arquivo);
    const anterior = decisoes.importacoes.find((x) => x.rotulo === controle.rotulo && x.lote === controle.lote);
    let substituiu: Importacao["substituiu"];
    if (anterior) {
        const autorizacao = (o.substituicao ?? "").trim();
        if (!autorizacao) {
            throw new Error(`A planilha de "${controle.rotulo}" (lote ${controle.lote}) já foi importada em ${anterior.quando.slice(0, 10)}. ` +
                "Importá-la de novo substitui as decisões dela: exige a autorização do pesquisador, nas palavras dele ('substituicao'). Nada foi gravado.");
        }
        const arquivada = `${PASTA_REVISORES}/substituidas/${quando.replace(/[:.]/g, "-")}_decisoes_${estagio}.json`;
        gravarJson(dir, arquivada, decisoes);
        substituiu = { autorizacao, arquivada };
    }
    const copia = `${PASTA_REVISORES}/recebidos/${estagio}_${controle.rotulo}_lote${controle.lote}_${quando.replace(/[:.]/g, "-")}.xlsx`;
    fs.mkdirSync(path.dirname(path.join(dir, copia)), { recursive: true });
    fs.writeFileSync(path.join(dir, copia), bruto);

    for (const { id, d } of linhas) {
        const porRevisor = (decisoes.registros[id] ??= {});
        const antes = porRevisor[controle.rotulo];
        const historico = antes ? [...(antes.historico ?? []), (({ historico: _h, ...resto }) => resto)(antes)] : [];
        porRevisor[controle.rotulo] = historico.length ? { ...d, historico } : d;
    }
    decisoes.importacoes = [
        ...decisoes.importacoes.filter((x) => x !== anterior),
        {
            rotulo: controle.rotulo, lote: controle.lote, arquivo: path.basename(arquivo), copia, hash: sha256(bruto), quando,
            nome, papel: papel!, inicio: inicio!, fim: fim!, linhas: linhas.length, ...(substituiu ? { substituiu } : {}),
        },
    ];
    gravarJson(dir, decisoesRel(estagio), decisoes);

    const falhas: Falha[] = linhas.filter((l) => l.d.decisao === "falha de procedência").map((l) => ({
        id: l.id, titulo: "", link: "", situacao: "não abriu (revisor)", motivo: "o revisor marcou que o link não abriu o documento certo",
        origem: `revisor ${controle.rotulo} (${nome})`, quando,
    }));
    if (falhas.length) {
        const conf = lerConferencias(dir);
        for (const f of falhas) { const x = conf.get(f.id); if (x) { f.titulo = x.titulo_registro; f.link = x.link; } }
        registrarFalhasDoRevisor(projectPath, falhas);
    }

    const contagens: Record<string, number> = {};
    for (const l of linhas) contagens[l.d.decisao] = (contagens[l.d.decisao] ?? 0) + 1;
    const comDuvida = linhas.filter((l) => l.d.com_duvida?.length).length;
    const importados = new Set(decisoes.importacoes.filter((x) => x.lote === controle.lote).map((x) => x.rotulo));
    const faltam = m.revisores.filter((r) => !importados.has(r));
    const resumo = [
        `## Planilha importada — "${controle.rotulo}" (${nome}, ${papel}), ${NOME_ESTAGIO[estagio]}, lote ${controle.lote}`,
        `- **Leitura declarada:** ${inicio} a ${fim}; ${linhas.length} registros`,
        `- **Decisões (pela regra fixa das respostas):** ${Object.entries(contagens).map(([k, v]) => `${k}: ${v}`).join(" · ")}${comDuvida ? ` (com dúvida: ${comDuvida})` : ""}`,
        falhas.length ? `- **Link que não abriu, marcado pelo revisor:** ${falhas.length} — foram para 03_screening/revisores/falhas_procedencia.json; leve-os ao "Visto de passagem" da manutenção` : "",
        substituiu ? `- Substituiu a importação anterior (arquivada em ${substituiu.arquivada}), com a autorização: "${substituiu.autorizacao}"` : "",
        `- Gravado: ${decisoesRel(estagio)}; cópia do arquivo recebido em ${copia} (sha256 ${sha256(bruto).slice(0, 12)}…)`,
        faltam.length ? `- **Falta importar, neste lote:** ${faltam.join(", ")}` : "- Todos os revisores deste lote importados.",
    ].filter(Boolean).join("\n");
    return { estagio, rotulo: controle.rotulo, lote: controle.lote, contagens, falhas: falhas.map((f) => f.id), faltam, resumo };
}
