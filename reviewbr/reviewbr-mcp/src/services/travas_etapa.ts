import * as fs from "node:fs";
import * as path from "node:path";
import { ProjectStateService } from "./project_state.js";
import { lerTrilha, etapaDoArtefato, etapaSeguinte, type Etapa } from "./method_trail.js";
import { hashDoArtefato, fechamentoDe, registrarFechamento } from "./fechamentos.js";
import { conferirVersao } from "./versao_sistema.js";

/**
 * Travas em código por etapa (linha 24 da FILA; pontos 6.2 e 6.3 do pedido do Vicente de 25/11/2026,
 * aprovados em 26/11/2026 com as condições dele).
 *
 * POR QUE EXISTE
 * --------------
 * Com o protocolo travado, decisões de etapa foram tomadas no chat (a camada por palavras, a "dúvida",
 * o registro sem resumo, a planilha), e nada impedia um modelo fraco de pular uma etapa ou um arquivo
 * editado à mão de entrar como insumo. Até aqui, só a busca tinha conferência em código (linha 17) e as
 * planilhas tinham o hash do insumo. Esta é a extensão às outras etapas, sem refazer as duas.
 *
 * TRAVA 1 — DECISÃO ANTES DA ETAPA
 * O MÉTODO declara, no manifest (`decisoes`), o que cada etapa vai precisar ter decidido: a pergunta, o
 * que se decide, as opções e a consequência de cada uma. Na trava do protocolo o projeto responde, em
 * `decisoes_etapas.json` (a resposta pode ficar `null`: a decidir). Etapa com decisão faltando não roda,
 * e a decisão só entra por emenda aprovada pelo pesquisador (`record_protocol_amendment`), nunca pelo
 * chat. A resposta tem efeito em código: a opção pode declarar as tools que ela recusa e os limites de
 * parâmetro que impõe.
 *
 * TRAVA 2 — ORDEM E INSUMO
 * A tool pertence à etapa que a lista em `producer_tools` ou `step_tools`. Ela recusa rodar se a própria
 * etapa, ou uma posterior, já fechou; se a etapa anterior não fechou; se o artefato que encerrou a
 * etapa anterior mudou depois do fechamento (hash); e se recebe o insumo do chamador em vez de lê-lo do
 * disco. A ordem e as etapas vêm da trilha do método (P1), não de um F0–F8 fixo.
 *
 * TODA RECUSA diz o que foi recusado e a regra do projeto que a causou e, quando a ação mudaria o
 * projeto de pesquisa, diz que não pode e que o caminho é a emenda.
 *
 * LIMITE: o servidor não impede a IA de perguntar no chat nem alguém de editar o código ou o
 * `project_state.json`; impede que uma tool de etapa rode contra o que o projeto decidiu.
 */

export const ARQUIVO_DECISOES = "decisoes_etapas.json";

export interface OpcaoDecisao {
    valor: string;
    /** O que acontece no projeto com esta opção — o que o pesquisador lê antes de escolher. */
    consequencia: string;
    /** Tools que esta opção recusa. */
    recusa_tools?: string[];
    /** Limites de parâmetro que esta opção impõe: tool → parâmetro (lista) → mínimo/máximo de itens. */
    parametros?: Record<string, Record<string, { min_itens?: number; max_itens?: number }>>;
}

export interface DecisaoDeEtapa {
    id: string;
    /** Etapa da trilha que não roda sem esta decisão. */
    etapa: string;
    pergunta: string;
    /** O que se decide, em uma frase: o contexto da pergunta. */
    o_que_se_decide: string;
    opcoes: OpcaoDecisao[];
    note: string;
}

export interface RespostaDeEtapa {
    resposta: string;
    /** "trava" ou o id da emenda que a trouxe. */
    origem: string;
    em: string;
}

export interface TravaEtapas {
    metodo: string;
    desde: string;
    /** Primeira etapa sob as travas. Projeto travado antes de 27/11/2026: a seguinte à fase em que estava. */
    desde_etapa: string;
    respostas: Record<string, RespostaDeEtapa>;
}

const texto = (x: unknown) => (typeof x === "string" ? x.trim() : "");
const norm = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

const CAMINHO_EMENDA =
    "Isso mudaria o projeto de pesquisa e não pode ser feito aqui nem pelo chat: o caminho é a emenda " +
    "(`record_protocol_amendment`, tipo 'emenda'), proposta e aprovada pelo pesquisador nas palavras dele.";

function recusa(tool: string, etapa: Etapa, o_que: string, regra: string, mudaProjeto: boolean, caminho?: string): string {
    return [
        `🚫 RECUSADO: \`${tool}\` (etapa ${etapa.id} — ${etapa.name}) ${o_que}`,
        `Regra do projeto: ${regra}`,
        mudaProjeto ? CAMINHO_EMENDA : "",
        caminho ?? "",
    ].filter(Boolean).join("\n");
}

// ─── decisões declaradas pelo método ───────────────────────────────────────

function lerManifest(repoRoot: string, methodId: string): any | null {
    try { return JSON.parse(fs.readFileSync(path.join(repoRoot, ".claude", "methodologies", methodId, "manifest.json"), "utf-8")); }
    catch { return null; }
}

/** As decisões que o método declara, conferidas contra a trilha. Nunca lança. */
export function lerDecisoesDoMetodo(repoRoot: string, methodId: string): { decisoes: DecisaoDeEtapa[]; erros: string[] } {
    const man = lerManifest(repoRoot, methodId);
    if (!man || man.decisoes === undefined) return { decisoes: [], erros: [] };
    if (!Array.isArray(man.decisoes)) return { decisoes: [], erros: ["'decisoes' precisa ser lista"] };
    const etapas = lerTrilha(repoRoot, methodId).etapas;
    const decisoes: DecisaoDeEtapa[] = [];
    const erros: string[] = [];
    const ids = new Set<string>();
    man.decisoes.forEach((d: any, i: number) => {
        const id = texto(d?.id);
        const rot = `decisão ${i + 1}${id ? ` (${id})` : ""}`;
        const antes = erros.length;
        if (!id) erros.push(`${rot}: sem 'id'`);
        else if (ids.has(id)) erros.push(`${rot}: id repetido`);
        const etapa = etapas.find((e) => e.id === texto(d?.etapa));
        if (!etapa) erros.push(`${rot}: a etapa "${texto(d?.etapa)}" não existe na trilha do método`);
        else if (!etapa.active) erros.push(`${rot}: a etapa ${etapa.id} não se aplica ao método`);
        if (!texto(d?.pergunta)) erros.push(`${rot}: sem 'pergunta'`);
        if (!texto(d?.o_que_se_decide)) erros.push(`${rot}: sem 'o_que_se_decide' — a pergunta vem com o contexto`);
        const opcoes: OpcaoDecisao[] = Array.isArray(d?.opcoes) ? d.opcoes : [];
        if (opcoes.length < 2) erros.push(`${rot}: 'opcoes' precisa de duas ou mais`);
        const valores = new Set<string>();
        opcoes.forEach((o: any, j: number) => {
            if (!texto(o?.valor)) erros.push(`${rot}, opção ${j + 1}: sem 'valor'`);
            else if (valores.has(norm(o.valor))) erros.push(`${rot}, opção ${j + 1}: valor repetido`);
            else valores.add(norm(o.valor));
            if (!texto(o?.consequencia)) erros.push(`${rot}, opção ${j + 1}: sem 'consequencia' — cada opção diz o que acontece com ela`);
        });
        if (id) ids.add(id);
        if (erros.length === antes) {
            decisoes.push({
                id, etapa: etapa!.id, pergunta: texto(d.pergunta), o_que_se_decide: texto(d.o_que_se_decide),
                opcoes: opcoes.map((o) => ({ ...o, valor: texto(o.valor), consequencia: texto(o.consequencia) })), note: texto(d.note),
            });
        }
    });
    return { decisoes, erros };
}

/** A pergunta como o pesquisador a lê: o que se decide, as opções e a consequência de cada uma. */
export function textoDaPergunta(d: DecisaoDeEtapa): string {
    return [
        `- **${d.id}** (etapa ${d.etapa}): ${d.pergunta}`,
        `  O que se decide: ${d.o_que_se_decide}`,
        ...d.opcoes.map((o) => `  • "${o.valor}" — ${o.consequencia}`),
    ].join("\n");
}

function opcaoDe(d: DecisaoDeEtapa, valor: string): OpcaoDecisao | undefined {
    return d.opcoes.find((o) => norm(o.valor) === norm(valor));
}

/**
 * Confere um conjunto de respostas contra as decisões do método. `exigirTodas`: na trava, cada decisão
 * aparece (com uma opção ou `null`, a decidir); na emenda, só as que ela traz.
 */
export function conferirRespostas(
    decisoes: DecisaoDeEtapa[], dado: unknown, exigirTodas: boolean,
): { respostas: Record<string, string | null>; erros: string[] } {
    const erros: string[] = [];
    const respostas: Record<string, string | null> = {};
    if (!dado || typeof dado !== "object" || Array.isArray(dado)) return { respostas, erros: ["as respostas são um objeto { id da decisão: opção escolhida ou null }"] };
    const entrada = dado as Record<string, unknown>;
    for (const k of Object.keys(entrada)) {
        if (!decisoes.some((d) => d.id === k)) erros.push(`"${k}" não é decisão que o método declara (${decisoes.map((d) => d.id).join(", ") || "nenhuma"})`);
    }
    for (const d of decisoes) {
        if (!(d.id in entrada)) {
            if (exigirTodas) erros.push(`falta "${d.id}" — responda com uma opção, ou null se ainda não decidido (a etapa ${d.etapa} não roda até a emenda)`);
            continue;
        }
        const v = entrada[d.id];
        if (v === null) { respostas[d.id] = null; continue; }
        const o = typeof v === "string" ? opcaoDe(d, v) : undefined;
        if (!o) erros.push(`"${d.id}": "${String(v)}" não é opção; o método declara ${d.opcoes.map((x) => `"${x.valor}"`).join(", ")}`);
        else respostas[d.id] = o.valor;
    }
    return { respostas, erros };
}

/** Lê `decisoes_etapas.json` da raiz do projeto (o objeto inteiro, ou o campo `decisoes`). */
export function lerRespostasDoArquivo(projectDir: string, decisoes: DecisaoDeEtapa[]): { respostas: Record<string, string | null>; erros: string[] } {
    const p = path.join(projectDir, ARQUIVO_DECISOES);
    if (!fs.existsSync(p)) {
        return {
            respostas: {},
            erros: [`Falta ${ARQUIVO_DECISOES} na raiz do projeto: na trava, o pesquisador responde o que cada etapa do método vai ` +
                `precisar decidir. Pergunte a ele e grave { "decisoes": { id: opção escolhida, ou null se ainda não decidido } }. ` +
                `As perguntas:\n${decisoes.map(textoDaPergunta).join("\n")}`],
        };
    }
    let dado: any;
    try { dado = JSON.parse(fs.readFileSync(p, "utf-8")); }
    catch (e: any) { return { respostas: {}, erros: [`${ARQUIVO_DECISOES} ilegível: ${e?.message ?? e}`] }; }
    const r = conferirRespostas(decisoes, dado?.decisoes ?? dado, true);
    return { respostas: r.respostas, erros: r.erros.map((e) => `${ARQUIVO_DECISOES}: ${e}`) };
}

/** Congela na trava as respostas dadas; `null` fica de fora (a decidir, por emenda). */
export function congelarDecisoes(projectDir: string, metodo: string, respostas: Record<string, string | null>, desdeEtapa: string): TravaEtapas {
    const em = new Date().toISOString();
    const r: Record<string, RespostaDeEtapa> = {};
    for (const [k, v] of Object.entries(respostas)) if (v !== null) r[k] = { resposta: v, origem: "trava", em };
    const trava: TravaEtapas = { metodo, desde: em, desde_etapa: desdeEtapa, respostas: r };
    ProjectStateService.patch(projectDir, { trava_etapas: trava });
    return trava;
}

/** A primeira etapa sob as travas, para projeto travado antes delas: a seguinte à fase em que ele está. */
function desdeEtapaLegado(repoRoot: string, projectDir: string): string {
    const st = ProjectStateService.read(projectDir)!;
    const etapas = lerTrilha(repoRoot, st.method).etapas;
    return etapaSeguinte(etapas, st.phase)?.id ?? st.phase;
}

/** Grava as respostas de uma emenda aprovada (cria a trava das etapas em projeto travado antes dela). */
export function aplicarRespostasDeEmenda(repoRoot: string, projectDir: string, respostas: Record<string, string | null>, origem: string): void {
    const st = ProjectStateService.read(projectDir)!;
    const em = new Date().toISOString();
    const trava: TravaEtapas = st.trava_etapas
        ? { ...st.trava_etapas, respostas: { ...st.trava_etapas.respostas } }
        : { metodo: st.method, desde: em, desde_etapa: desdeEtapaLegado(repoRoot, projectDir), respostas: {} };
    for (const [k, v] of Object.entries(respostas)) {
        if (v === null) delete trava.respostas[k];
        else trava.respostas[k] = { resposta: v, origem, em };
    }
    ProjectStateService.patch(projectDir, { trava_etapas: trava });
}

/** Reabre uma etapa por emenda aprovada: apaga o fechamento dela e das seguintes, para refazê-las em ordem. */
export function reabrirEtapa(repoRoot: string, projectDir: string, etapaId: string): string[] {
    const st = ProjectStateService.read(projectDir)!;
    const etapas = lerTrilha(repoRoot, st.method).etapas;
    const i = etapas.findIndex((e) => e.id === etapaId);
    const apagar = new Set(etapas.slice(i).map((e) => e.id));
    ProjectStateService.patch(projectDir, { etapas_fechadas: (st.etapas_fechadas ?? []).filter((f) => !apagar.has(f.etapa)) });
    return [...apagar];
}

/** Resumo das decisões para a resposta da trava e da emenda. */
export function resumoDasDecisoes(repoRoot: string, projectDir: string): string {
    const st = ProjectStateService.read(projectDir);
    if (!st) return "";
    const { decisoes } = lerDecisoesDoMetodo(repoRoot, st.method);
    if (!decisoes.length) return "O método não declara decisões de etapa.";
    return decisoes.map((d) => {
        const r = st.trava_etapas?.respostas[d.id];
        return r
            ? `- ${d.id} (etapa ${d.etapa}): "${r.resposta}" (${r.origem}) — ${opcaoDe(d, r.resposta)?.consequencia ?? ""}`
            : `- ${d.id} (etapa ${d.etapa}): A DECIDIR — a etapa ${d.etapa} não roda até a emenda. ${d.pergunta}`;
    }).join("\n");
}

// ─── a conferência que cada tool de etapa faz ──────────────────────────────

/** A etapa da trilha a que a tool pertence (`producer_tools` ou `step_tools`), se pertence a alguma. */
export function etapaDaTool(etapas: Etapa[], tool: string): Etapa | null {
    return etapas.find((e) => e.active && (e.producer_tools.includes(tool) || e.step_tools.includes(tool))) ?? null;
}

export interface ContextoDaTool {
    /** A tool recebeu os registros do chamador (JSON, banco) em vez de ler o artefato da etapa anterior. */
    insumoDoChamador?: string;
    /** Parâmetros da chamada, para os limites que uma opção impõe. */
    parametros?: Record<string, unknown>;
}

export type ConferenciaDaEtapa = { ok: true; aviso: string } | { ok: false; motivo: string };

/**
 * Confere, ANTES de a tool rodar, as travas 1 e 2 para a etapa a que ela pertence. Só vale para
 * projeto LOCKED (antes da trava, quem para é o `ProtocolGate`) e para etapas a partir de `desde_etapa`.
 */
export function conferirEtapa(repoRoot: string, projectDir: string, tool: string, ctx: ContextoDaTool = {}): ConferenciaDaEtapa {
    const st = ProjectStateService.read(projectDir);
    if (!st || st.status !== "LOCKED") return { ok: true, aviso: "" };
    const etapas = lerTrilha(repoRoot, st.method).etapas;
    const etapa = etapaDaTool(etapas, tool);
    if (!etapa) return { ok: true, aviso: "" };
    // ── Trava 3: a versão do sistema que o projeto usa (vale em toda etapa do projeto travado) ──
    const v = conferirVersao(repoRoot, projectDir, tool);
    if (!v.ok) return v;
    const r = conferirTravas12(repoRoot, projectDir, tool, ctx, etapas, etapa);
    if (!r.ok || !v.aviso) return r;
    return { ok: true, aviso: [v.aviso, r.aviso].filter(Boolean).join("\n") };
}

function conferirTravas12(repoRoot: string, projectDir: string, tool: string, ctx: ContextoDaTool, etapas: Etapa[], etapa: Etapa): ConferenciaDaEtapa {
    const st = ProjectStateService.read(projectDir)!;
    const idx = (id: string) => etapas.findIndex((e) => e.id === id);
    const desde = st.trava_etapas?.desde_etapa ?? desdeEtapaLegado(repoRoot, projectDir);
    if (idx(etapa.id) < idx(desde)) return { ok: true, aviso: "" };

    // ── Trava 1: decisão antes da etapa ──
    const { decisoes } = lerDecisoesDoMetodo(repoRoot, st.method);
    const respostas = st.trava_etapas?.respostas ?? {};
    const faltando = decisoes.filter((d) => d.etapa === etapa.id && !respostas[d.id]);
    if (faltando.length) {
        return {
            ok: false,
            motivo: recusa(tool, etapa,
                `não roda: falta(m) ${faltando.length} decisão(ões) que o método exige antes desta etapa, e o protocolo travado não as tem.\n` +
                faltando.map(textoDaPergunta).join("\n"),
                "trava 1 da linha 24 — etapa com decisão faltando não roda; o que o protocolo travado não decidiu não se decide no chat (RV-01).",
                true,
                "Na emenda, as respostas vão em `decisoes` (JSON: { id: opção })."),
        };
    }
    for (const d of decisoes) {
        const r = respostas[d.id];
        const o = r ? opcaoDe(d, r.resposta) : undefined;
        if (!o) continue;
        if ((o.recusa_tools ?? []).includes(tool)) {
            return {
                ok: false,
                motivo: recusa(tool, etapa,
                    `não roda neste projeto: a decisão "${d.id}" é "${o.valor}" (${r!.origem}), e com ela ${o.consequencia}`,
                    `trava 1 da linha 24 — a decisão gravada do projeto vale em código (${d.pergunta}).`, true),
            };
        }
        for (const [param, lim] of Object.entries(o.parametros?.[tool] ?? {})) {
            const v = ctx.parametros?.[param];
            if (!Array.isArray(v)) continue;
            if ((lim.min_itens !== undefined && v.length < lim.min_itens) || (lim.max_itens !== undefined && v.length > lim.max_itens)) {
                const faixa = lim.min_itens !== undefined && lim.max_itens !== undefined
                    ? `entre ${lim.min_itens} e ${lim.max_itens}` : lim.min_itens !== undefined ? `ao menos ${lim.min_itens}` : `no máximo ${lim.max_itens}`;
                return {
                    ok: false,
                    motivo: recusa(tool, etapa,
                        `recusou '${param}' com ${v.length} item(ns): a decisão "${d.id}" é "${o.valor}" (${r!.origem}), que pede ${faixa}.`,
                        `trava 1 da linha 24 — a decisão gravada do projeto vale em código (${d.pergunta}).`, true),
                };
            }
        }
    }

    // ── Trava 2: ordem e insumo ──
    const fechadas = st.etapas_fechadas ?? [];
    const jaFechou = fechadas.filter((f) => idx(f.etapa) >= idx(etapa.id));
    if (jaFechou.length) {
        const f = jaFechou[jaFechou.length - 1];
        return {
            ok: false,
            motivo: recusa(tool, etapa,
                `não roda: a etapa ${f.etapa} já fechou em ${f.em.slice(0, 10)}, e rodar a ${etapa.id} de novo mudaria o que ela e as seguintes leram.`,
                "trava 2 da linha 24 — as etapas correm na ordem da trilha do método; etapa fechada não se refaz por fora.",
                true,
                `Se a etapa precisa ser refeita, a emenda diz por quê e traz \`reabrir: "${etapa.id}"\`; aprovada, a ${etapa.id} e as seguintes reabrem e correm de novo em ordem.`),
        };
    }
    if (ctx.insumoDoChamador) {
        return {
            ok: false,
            motivo: recusa(tool, etapa,
                `recusou o insumo ${ctx.insumoDoChamador}: com o projeto travado, a etapa lê do disco o que saiu da etapa anterior.`,
                "trava 2 da linha 24 — insumo que não saiu da etapa anterior não entra.", false,
                "Chame a tool só com `projectPath`, sem passar os registros."),
        };
    }
    const anterior = [...etapas.slice(0, idx(etapa.id))].reverse().find((e) => e.active);
    const doProtocolo = etapaDoArtefato(etapas, "protocol.md");
    // A etapa anterior é fechada pela própria trava do protocolo: o projeto está LOCKED, e o hash do
    // protocol.md já é conferido pela busca (linha 17).
    if (!anterior || (doProtocolo && idx(anterior.id) <= idx(doProtocolo.id))) return { ok: true, aviso: "" };

    let aviso = "";
    let f = fechamentoDe(projectDir, anterior.id);
    if (!f) {
        // A etapa anterior fecha quando a seguinte começa, se a regra dela deixa (artefato gravado; RV-01 e RV-04).
        const artefato = hashDoArtefato(projectDir, anterior.closes_with);
        if (!artefato) {
            return {
                ok: false,
                motivo: recusa(tool, etapa,
                    `não roda: a etapa anterior, ${anterior.id} (${anterior.name}), não fechou — o artefato que a encerra (${anterior.closes_with}) não existe.`,
                    "trava 2 da linha 24 — as etapas correm na ordem da trilha do método.", false,
                    `Faça antes a etapa ${anterior.id} (procedimento: skill \`${anterior.role}\`).`),
            };
        }
        const gate = ProjectStateService.podeAvancar(projectDir, anterior.id);
        if (!gate.ok) {
            return {
                ok: false,
                motivo: recusa(tool, etapa,
                    `não roda: a etapa anterior, ${anterior.id} (${anterior.name}), não pode fechar. ${gate.motivo}`,
                    "trava 2 da linha 24 — as etapas correm na ordem da trilha do método; a anterior fecha pela regra dela.", false),
            };
        }
        f = registrarFechamento(projectDir, anterior.id, anterior.closes_with)!;
        if (idx(st.phase) < idx(anterior.id)) ProjectStateService.setPhase(projectDir, anterior.id);
        aviso = `🔒 A etapa ${anterior.id} (${anterior.name}) fechou agora, com o hash do ${anterior.closes_with} (${f.sha256.slice(0, 12)}…): ` +
            `é o insumo desta etapa, e mudar esse artefato daqui em diante faz a etapa ${etapa.id} recusar.`;
    }
    const atual = hashDoArtefato(projectDir, anterior.closes_with);
    if (atual !== f.sha256) {
        return {
            ok: false,
            motivo: recusa(tool, etapa,
                `recusou o insumo: ${anterior.closes_with} ${atual ? "mudou" : "sumiu"} depois que a etapa ${anterior.id} fechou em ${f.em.slice(0, 10)} ` +
                `(hash do fechamento ${f.sha256.slice(0, 12)}…, hoje ${atual ? `${atual.slice(0, 12)}…` : "nenhum"}). Insumo editado à mão ou regravado fora da ordem não entra.`,
                "trava 2 da linha 24 — o insumo de cada etapa é o artefato que fechou a anterior, conferido por hash.",
                true,
                `Restaure o artefato do fechamento; se a etapa ${anterior.id} precisa ser refeita, a emenda traz \`reabrir: "${anterior.id}"\`.`),
        };
    }
    return { ok: true, aviso };
}
