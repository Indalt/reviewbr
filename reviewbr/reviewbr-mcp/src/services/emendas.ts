import * as fs from "node:fs";
import * as path from "node:path";
import { ProjectStateService } from "./project_state.js";
import { ehCarimbo } from "./method_trail.js";
import { validarPlano, congelarPlano, resumoDoPlano, type PlanoBusca, type CatalogoDeRepositorios } from "./plano_busca.js";
import { congelarVersao, analisarMudancas, fraseDaMigracao, registrarConferencia } from "./versao_sistema.js";
import { AgentOrchestrator } from "../registry/agent_orchestrator.js";
import { lerDecisoesDoMetodo, conferirRespostas, aplicarRespostasDeEmenda, reabrirEtapa, resumoDasDecisoes, textoDaPergunta } from "./travas_etapa.js";
import { lerTrilha } from "./method_trail.js";

/**
 * Emenda e desvio do protocolo travado, gravados por tool (linha 17 da FILA, FAZER 3).
 *
 * A spec diz desde 19/02/2026 que o protocolo travado só muda "via emenda registrada no change_log"
 * (RV-01), e nenhuma tool criava, aprovava ou conferia a emenda: no `roda_aromas_ceara` ela foi
 * escrita à mão, depois de a execução já ter mudado o caminho de cinco fontes.
 *
 * - **Emenda:** o que muda no protocolo (antes, depois, por quê). Nasce PROPOSTA e só vale com a
 *   aprovação do pesquisador, nas palavras dele (carimbo é recusado, como na
 *   `record_researcher_decision`). Aprovada, sobe a versão do protocolo e, se traz plano de busca,
 *   congela-o de novo com as rotas de hoje. O `protocol.md` travado não se edita.
 * - **Desvio:** o que a execução fez diferente do protocolo, sem mudá-lo. É fato: entra no
 *   registro para o relato declará-lo; a decisão do pesquisador sobre ele, se houver, vai junto.
 *
 * Tudo é anexado ao `change_log.md` do projeto, sem reescrever o que já está lá, e guardado no
 * `project_state.json`.
 */

export interface Emenda {
    id: string;
    status: "PROPOSTA" | "APROVADA" | "RECUSADA";
    o_que: string;
    antes?: string;
    depois?: string;
    porque: string;
    plano?: PlanoBusca;
    /** Linha 24, trava 1: respostas às decisões de etapa que o método declara (id → opção; null = volta a "a decidir"). */
    decisoes?: Record<string, string | null>;
    /** Linha 24, trava 2: etapa que a emenda reabre (ela e as seguintes correm de novo, em ordem). */
    reabrir?: string;
    /** Linha 24, trava 3: emenda de migração — aprovada, a versão de hoje do sistema passa a ser a do projeto. */
    /** mudancas: no que a atualização implica; conferencia: o arquivo em logs/ com a conferência (fora do relato). */
    migracao?: { mudancas: string[]; conferencia?: string };
    proposta_em: string;
    decisao?: { por: "pesquisador"; contribuicao: string; em: string; versao_protocolo?: string };
}

export interface Desvio {
    id: string;
    fonte?: string;
    o_que: string;
    porque: string;
    registrado_em: string;
    /** Quem registrou: o agente, ou o sistema (campo do plano declarado como não obtido). */
    por: string;
    decisao?: { contribuicao: string; em: string };
}

const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const hoje = () => new Date().toISOString();

/** A pergunta da decisão de etapa, como o pesquisador a leu (o id é do sistema). */
function perguntaDe(repoRoot: string | undefined, metodo: string, id: string): string {
    if (!repoRoot) return id;
    return lerDecisoesDoMetodo(repoRoot, metodo).decisoes.find((d) => d.id === id)?.pergunta ?? id;
}

export function anexarAoChangeLog(projectDir: string, bloco: string): void {
    const p = path.join(projectDir, "change_log.md");
    const cabecalho = fs.existsSync(p) ? "" :
        "# Emendas e desvios do protocolo\n\nO `protocol.md` travado não se edita. O que muda nele entra aqui como emenda, " +
        "aprovada pelo pesquisador; o que a execução fez diferente entra como desvio. O relato declara os dois.\n";
    fs.appendFileSync(p, `${cabecalho}\n${bloco.trim()}\n`, "utf-8");
}

function subirVersao(v: string): string {
    const m = /^(\d+)\.(\d+)$/.exec(v.trim());
    return m ? `${m[1]}.${Number(m[2]) + 1}` : `${v.trim() || "1.0"}+1`;
}

function travado(projectDir: string): { ok: true } | { ok: false; mensagem: string } {
    const st = ProjectStateService.read(projectDir);
    if (!st) return { ok: false, mensagem: "Sem project_state.json: não há protocolo travado a emendar." };
    if (st.status !== "LOCKED") {
        return { ok: false, mensagem: "O protocolo está em rascunho (DRAFT): ele se edita direto. Emenda e desvio são do protocolo travado." };
    }
    return { ok: true };
}

export function proporEmenda(
    projectDir: string,
    entrada: { o_que: string; antes?: string; depois?: string; porque: string; plano?: string; decisoes?: string; reabrir?: string; migracao?: boolean; contribuicao?: string },
    catalogo: CatalogoDeRepositorios,
    repoRoot?: string,
): { ok: boolean; mensagem: string } {
    const t = travado(projectDir);
    if (!t.ok) return { ok: false, mensagem: t.mensagem };
    // Migração (decisão do Vicente, 28/11/2026): a tool escreve no que a atualização implica; o_que e porque
    // do chamador são opcionais.
    if (!entrada.migracao && (!texto(entrada.o_que) || !texto(entrada.porque))) {
        return { ok: false, mensagem: "A emenda diz o que muda no protocolo (`o_que`) e por quê (`porque`)." };
    }
    let plano: PlanoBusca | undefined;
    if (texto(entrada.plano)) {
        try {
            plano = JSON.parse(entrada.plano!) as PlanoBusca;
        } catch (e: any) {
            return { ok: false, mensagem: `O plano de busca da emenda não é JSON legível: ${e?.message ?? e}` };
        }
        const erros = validarPlano(plano, catalogo);
        if (erros.length) return { ok: false, mensagem: `O plano de busca da emenda não está pronto:\n${erros.map((e) => `- ${e}`).join("\n")}` };
    }
    const st = ProjectStateService.read(projectDir)!;
    // Linha 24: decisões de etapa e reabertura de etapa, conferidas contra o método do projeto.
    let decisoes: Record<string, string | null> | undefined;
    if (texto(entrada.decisoes)) {
        if (!repoRoot) return { ok: false, mensagem: "Sem a raiz do ReviewBR não há como ler as decisões que o método declara." };
        let dado: unknown;
        try { dado = JSON.parse(entrada.decisoes!); }
        catch (e: any) { return { ok: false, mensagem: `As decisões da emenda não são JSON legível: ${e?.message ?? e}` }; }
        const { decisoes: doMetodo, erros: errosMetodo } = lerDecisoesDoMetodo(repoRoot, st.method);
        if (errosMetodo.length) return { ok: false, mensagem: `As decisões do método "${st.method}" não puderam ser lidas: ${errosMetodo.join("; ")}` };
        const r = conferirRespostas(doMetodo, dado, false);
        if (r.erros.length) {
            return { ok: false, mensagem: `As decisões da emenda não conferem com o método:\n${r.erros.map((x) => `- ${x}`).join("\n")}\n\nAs perguntas:\n${doMetodo.map(textoDaPergunta).join("\n")}` };
        }
        decisoes = r.respostas;
    }
    const reabrir = texto(entrada.reabrir) || undefined;
    if (reabrir) {
        if (!repoRoot) return { ok: false, mensagem: "Sem a raiz do ReviewBR não há como ler a trilha do método." };
        const etapas = lerTrilha(repoRoot, st.method).etapas;
        if (!etapas.some((x) => x.id === reabrir && x.active)) {
            return { ok: false, mensagem: `"${reabrir}" não é etapa ativa da trilha do método "${st.method}" (${etapas.filter((x) => x.active).map((x) => x.id).join(", ")}).` };
        }
    }
    let migracao: Emenda["migracao"];
    if (entrada.migracao) {
        if (!repoRoot) return { ok: false, mensagem: "Sem a raiz do ReviewBR não há como ler a versão do sistema." };
        const a = analisarMudancas(repoRoot, projectDir);
        if (!a || !a.contam.length) {
            return { ok: false, mensagem: "Não há migração a fazer: nada do que mudou no sistema alcança o que falta da pesquisa (texto, nomes e etapas já feitas não se exigem do projeto)." };
        }
        const doMetodo = a.contam.filter((m) => m.tipo === "metodo");
        if (!doMetodo.length) {
            // Só o sistema mudou (como o ReviewBR executa e confere): não é emenda do protocolo, não vai ao
            // change_log.md e não sobe a versão do protocolo. Fica a decisão do pesquisador de seguir na versão
            // nova, na conferência (pedido do Vicente, 28/11/2026).
            const contribuicao = texto(entrada.contribuicao);
            if (!contribuicao || ehCarimbo(contribuicao)) {
                return {
                    ok: false,
                    mensagem: "Só o sistema mudou, não o método: não é emenda. Registre a decisão do pesquisador de seguir na versão nova, " +
                        "nas palavras dele, em `contribuicao` (carimbo é recusado). O que mudou:\n" + a.contam.map((m) => `- ${m.implica}`).join("\n"),
                };
            }
            const arq = registrarConferencia(projectDir, "Atualização só do sistema, registrada com a decisão do pesquisador", a);
            const em = hoje();
            ProjectStateService.patch(projectDir, {
                atualizacoes_sistema: [...(st.atualizacoes_sistema ?? []), { em, mudancas: a.contam.map((m) => m.implica), contribuicao, conferencia: arq }],
            });
            congelarVersao(repoRoot, projectDir, `atualização só do sistema registrada em ${em.slice(0, 10)}`);
            fs.appendFileSync(path.join(projectDir, arq), `Decisão do pesquisador: "${contribuicao}". A versão de hoje passa a ser a do projeto.\n\n`);
            return {
                ok: true,
                mensagem: `✅ Atualização só do sistema registrada (não é emenda: o método não muda, e nada vai ao change_log.md). ` +
                    `A versão de hoje passa a ser a do projeto. Conferência em ${arq}.`,
            };
        }
        // Muda o método: emenda. Quem a lê é quem avalia a pesquisa, então a implicação vem em termos do
        // método, escrita por quem propõe — nunca sobre tools ou o sistema.
        const implica = texto(entrada.porque);
        const proibidas = [...AgentOrchestrator.getGovernedTools(), "tool", "tools", "MCP", "servidor", "ReviewBR"];
        const palavras = new Set(implica.toLowerCase().split(/[^\p{L}\p{N}_]+/u));
        const achadas = proibidas.filter((t) => palavras.has(t.toLowerCase()));
        if (!implica || achadas.length) {
            return {
                ok: false,
                mensagem: (implica ? `A implicação fala do sistema (${achadas.join(", ")}). ` : "") +
                    "Em `porque`, diga em termos do método, para quem avalia a pesquisa, no que a atualização implica; a tool monta a frase " +
                    "\"Durante a execução desta pesquisa o sistema passou por atualizações que implicam em (…) e por isso a emenda é necessária.\" " +
                    "O que mudou no método:\n" + doMetodo.map((m) => `- ${m.implica}`).join("\n"),
            };
        }
        migracao = { mudancas: a.contam.map((m) => m.implica) };
        entrada = {
            ...entrada,
            o_que: texto(entrada.o_que) || "O método das etapas que ainda vão correr passa a ser o da versão atual.",
            porque: fraseDaMigracao(implica),
        };
        migracao.conferencia = registrarConferencia(projectDir, `emenda-${(st.emendas ?? []).length + 1} (migração), proposta`, a);
    }
    const emendas = st.emendas ?? [];
    const e: Emenda = {
        id: `emenda-${emendas.length + 1}`, status: "PROPOSTA",
        o_que: texto(entrada.o_que), antes: texto(entrada.antes) || undefined, depois: texto(entrada.depois) || undefined,
        porque: texto(entrada.porque), plano, decisoes, reabrir, migracao, proposta_em: hoje(),
    };
    ProjectStateService.patch(projectDir, { emendas: [...emendas, e] });
    anexarAoChangeLog(projectDir, [
        `## ${e.id} — PROPOSTA em ${e.proposta_em.slice(0, 10)}`,
        "", `**O quê.** ${e.o_que}`,
        e.antes ? `\n**Antes.** ${e.antes}` : "", e.depois ? `\n**Depois.** ${e.depois}` : "",
        "", `**Por quê.** ${e.porque}`,
        decisoes ? `\n**Decisões de etapa da emenda:** ${Object.entries(decisoes).map(([k, v]) => `${perguntaDe(repoRoot, st.method, k)} — ${v === null ? "a decidir" : `"${v}"`}`).join("; ")}` : "",
        reabrir ? `\n**Reabre a etapa** ${reabrir} (ela e as seguintes correm de novo, em ordem).` : "",
        plano ? `\n**Plano de busca da emenda** (é o que a busca vai seguir, se aprovada):\n${plano.fontes.map((f) => `- ${f.nome}: ${f.modo === "manual" ? "busca na interface da base, pelo pesquisador" : "busca automatizada"}; textos ${f.textos.map((x) => `\`${x}\``).join(" · ") || "nenhum"}`).join("\n")}` : "",
        "", "**Aprovação:** — (só com a decisão do pesquisador, nas palavras dele)",
    ].filter((l) => l !== "").join("\n"));
    return {
        ok: true,
        mensagem: `✅ ${e.id} PROPOSTA e anexada ao change_log.md. Não vale até o pesquisador decidir: leve-a a ele e grave a ` +
            `decisão dele, nas palavras dele, com acao "aprovar" ou "recusar".`,
    };
}

export function decidirEmenda(
    projectDir: string,
    entrada: { id: string; acao: "aprovar" | "recusar"; contribuicao: string },
    catalogo: CatalogoDeRepositorios,
    repoRoot?: string,
): { ok: boolean; mensagem: string } {
    const t = travado(projectDir);
    if (!t.ok) return { ok: false, mensagem: t.mensagem };
    const st = ProjectStateService.read(projectDir)!;
    const emendas = st.emendas ?? [];
    const e = emendas.find((x) => x.id === texto(entrada.id));
    if (!e) return { ok: false, mensagem: `Não há "${entrada.id}". Emendas: ${emendas.map((x) => `${x.id} (${x.status})`).join(", ") || "nenhuma"}.` };
    if (e.status !== "PROPOSTA") return { ok: false, mensagem: `${e.id} já foi decidida (${e.status}).` };
    const contribuicao = texto(entrada.contribuicao);
    if (ehCarimbo(contribuicao)) {
        return { ok: false, mensagem: "🚫 RV-04 — carimbo não é decisão. A emenda muda o protocolo travado: a contribuição diz, nas palavras do pesquisador, o que ele avaliou e o que decidiu." };
    }
    const em = hoje();
    if (entrada.acao === "recusar") {
        e.status = "RECUSADA";
        e.decisao = { por: "pesquisador", contribuicao, em };
        ProjectStateService.patch(projectDir, { emendas });
        anexarAoChangeLog(projectDir, `### ${e.id} — RECUSADA em ${em.slice(0, 10)}\n\nDecisão do pesquisador: "${contribuicao}". O protocolo segue como estava.`);
        return { ok: true, mensagem: `✅ ${e.id} RECUSADA e anexada ao change_log.md. O protocolo e o plano seguem como estavam.` };
    }
    const anterior = st.trava_busca?.versao_protocolo ?? e.plano?.versao_protocolo ?? "1.0";
    const versao = subirVersao(anterior);
    e.status = "APROVADA";
    e.decisao = { por: "pesquisador", contribuicao, em, versao_protocolo: versao };
    ProjectStateService.patch(projectDir, { emendas });
    let notaPlano = "O plano de busca não muda.";
    if (e.plano) {
        const trava = congelarPlano(projectDir, e.plano, st.trava_busca?.etapa ?? st.phase, catalogo, versao);
        notaPlano = `Plano de busca congelado de novo, com as rotas de hoje:\n${resumoDoPlano(trava)}`;
    } else if (st.trava_busca) {
        ProjectStateService.patch(projectDir, { trava_busca: { ...ProjectStateService.read(projectDir)!.trava_busca!, versao_protocolo: versao } });
    }
    let notaEtapas = "";
    if (e.decisoes && repoRoot) {
        aplicarRespostasDeEmenda(repoRoot, projectDir, e.decisoes, e.id);
        notaEtapas += `\nDecisões de etapa do projeto agora:\n${resumoDasDecisoes(repoRoot, projectDir)}`;
    }
    if (e.reabrir && repoRoot) {
        const reabertas = reabrirEtapa(repoRoot, projectDir, e.reabrir);
        notaEtapas += `\nReabertas, para correr de novo em ordem: ${reabertas.join(", ")}.`;
    }
    if (e.migracao && repoRoot) {
        const a = analisarMudancas(repoRoot, projectDir);
        if (a) registrarConferencia(projectDir, `${e.id} (migração), aprovada — conferência no momento da aprovação`, a);
        congelarVersao(repoRoot, projectDir, e.id);
        notaEtapas += "\nA versão de hoje do sistema passa a ser a do projeto.";
    }
    anexarAoChangeLog(projectDir, `### ${e.id} — APROVADA em ${em.slice(0, 10)}\n\nDecisão do pesquisador: "${contribuicao}". ` +
        `Versão do protocolo: ${anterior} → ${versao}. ${e.plano ? "O plano de busca da emenda passa a valer." : "O plano de busca não muda."}` +
        (e.decisoes ? " As decisões de etapa da emenda passam a valer." : "") + (e.reabrir ? ` A etapa ${e.reabrir} e as seguintes reabrem.` : "") +
        (e.migracao ? " O método da versão atual passa a valer nas etapas que ainda vão correr." : ""));
    return { ok: true, mensagem: `✅ ${e.id} APROVADA (protocolo ${anterior} → ${versao}) e anexada ao change_log.md. ${notaPlano}${notaEtapas}` };
}

export function registrarDesvio(
    projectDir: string,
    entrada: { o_que: string; porque: string; fonte?: string; por?: string; contribuicao?: string },
): { ok: boolean; mensagem: string; id?: string } {
    const t = travado(projectDir);
    if (!t.ok) return { ok: false, mensagem: t.mensagem };
    if (!texto(entrada.o_que) || !texto(entrada.porque)) {
        return { ok: false, mensagem: "O desvio diz o que a execução fez diferente do protocolo (`o_que`) e por quê (`porque`)." };
    }
    const st = ProjectStateService.read(projectDir)!;
    const fonte = texto(entrada.fonte);
    if (fonte && st.trava_busca && !st.trava_busca.plano.fontes.some((f) => f.id === fonte)) {
        return { ok: false, mensagem: `A fonte "${fonte}" não está no plano de busca. Fontes: ${st.trava_busca.plano.fontes.map((f) => f.id).join(", ")}.` };
    }
    const contribuicao = texto(entrada.contribuicao);
    if (contribuicao && ehCarimbo(contribuicao)) {
        return { ok: false, mensagem: "🚫 RV-04 — carimbo não é decisão: a decisão do pesquisador sobre o desvio vai nas palavras dele, ou fica de fora." };
    }
    const desvios = st.desvios ?? [];
    const d: Desvio = {
        id: `desvio-${desvios.length + 1}`, fonte: fonte || undefined, o_que: texto(entrada.o_que), porque: texto(entrada.porque),
        registrado_em: hoje(), por: texto(entrada.por) || "agente",
        decisao: contribuicao ? { contribuicao, em: hoje() } : undefined,
    };
    ProjectStateService.patch(projectDir, { desvios: [...desvios, d] });
    anexarAoChangeLog(projectDir, [
        `## ${d.id} — registrado em ${d.registrado_em.slice(0, 10)} por ${d.por}`,
        "", `**O quê.** ${d.o_que}${d.fonte ? ` (fonte do plano: ${d.fonte})` : ""}`,
        "", `**Por quê.** ${d.porque}`,
        "", `**Decisão do pesquisador:** ${d.decisao ? `"${d.decisao.contribuicao}"` : "—"}`,
    ].join("\n"));
    return { ok: true, id: d.id, mensagem: `✅ ${d.id} registrado no change_log.md e no estado. O relato o declara.` };
}

/**
 * Campo que o plano manda registrar e veio como "não obtido: <motivo>" (linha 17, FAZER 4): entra
 * declarado, como desvio, registrado pelo sistema — omissão declarada é método, silenciosa é falha.
 */
export function desviosDeCamposNaoObtidos(
    projectDir: string,
    fontes: { id: string; nome: string; registrar?: string[] }[],
    registro: Record<string, unknown> | undefined,
    tool: string,
): string[] {
    if (!registro) return [];
    const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    const ids: string[] = [];
    for (const f of fontes) {
        for (const campo of f.registrar ?? []) {
            const valor = Object.entries(registro).find(([k]) => norm(k) === norm(campo))?.[1];
            if (typeof valor === "string" && norm(valor).startsWith("nao obtido")) {
                const r = registrarDesvio(projectDir, {
                    o_que: `"${campo}", que o plano manda registrar, não foi obtido na busca de ${f.nome} (${tool})`,
                    porque: valor.trim(), fonte: f.id, por: "sistema",
                });
                if (r.id) ids.push(r.id);
            }
        }
    }
    return ids;
}
