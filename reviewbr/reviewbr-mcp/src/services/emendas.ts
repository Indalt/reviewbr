import * as fs from "node:fs";
import * as path from "node:path";
import { ProjectStateService } from "./project_state.js";
import { ehCarimbo } from "./method_trail.js";
import { validarPlano, congelarPlano, resumoDoPlano, type PlanoBusca, type CatalogoDeRepositorios } from "./plano_busca.js";

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
    entrada: { o_que: string; antes?: string; depois?: string; porque: string; plano?: string },
    catalogo: CatalogoDeRepositorios,
): { ok: boolean; mensagem: string } {
    const t = travado(projectDir);
    if (!t.ok) return { ok: false, mensagem: t.mensagem };
    if (!texto(entrada.o_que) || !texto(entrada.porque)) {
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
    const emendas = st.emendas ?? [];
    const e: Emenda = {
        id: `emenda-${emendas.length + 1}`, status: "PROPOSTA",
        o_que: texto(entrada.o_que), antes: texto(entrada.antes) || undefined, depois: texto(entrada.depois) || undefined,
        porque: texto(entrada.porque), plano, proposta_em: hoje(),
    };
    ProjectStateService.patch(projectDir, { emendas: [...emendas, e] });
    anexarAoChangeLog(projectDir, [
        `## ${e.id} — PROPOSTA em ${e.proposta_em.slice(0, 10)} (registrada pela tool \`record_protocol_amendment\`)`,
        "", `**O quê.** ${e.o_que}`,
        e.antes ? `\n**Antes.** ${e.antes}` : "", e.depois ? `\n**Depois.** ${e.depois}` : "",
        "", `**Por quê.** ${e.porque}`,
        plano ? `\n**Plano de busca da emenda** (é o que a busca vai seguir, se aprovada):\n${plano.fontes.map((f) => `- ${f.nome} (${f.id}): ${f.modo === "manual" ? "à mão" : "por tool"}, ${f.tool}${f.repositorio ? ` ${f.repositorio}` : ""}; textos ${f.textos.map((x) => `\`${x}\``).join(" · ") || "nenhum"}`).join("\n")}` : "",
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
    anexarAoChangeLog(projectDir, `### ${e.id} — APROVADA em ${em.slice(0, 10)}\n\nDecisão do pesquisador: "${contribuicao}". ` +
        `Versão do protocolo: ${anterior} → ${versao}. ${e.plano ? "O plano de busca da emenda foi congelado, com as rotas de hoje." : "O plano de busca não muda."}`);
    return { ok: true, mensagem: `✅ ${e.id} APROVADA (protocolo ${anterior} → ${versao}) e anexada ao change_log.md. ${notaPlano}` };
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
        `## ${d.id} — registrado em ${d.registrado_em.slice(0, 10)} por ${d.por} (tool \`record_protocol_amendment\`)`,
        "", `**O quê.** ${d.o_que}${d.fonte ? ` (fonte do plano: ${d.fonte})` : ""}`,
        "", `**Por quê.** ${d.porque}`,
        "", `**Decisão do pesquisador:** ${d.decisao ? `"${d.decisao.contribuicao}"` : "—"}`,
    ].join("\n"));
    return { ok: true, id: d.id, mensagem: `✅ ${d.id} registrado no change_log.md e no estado. O relato o declara.` };
}
