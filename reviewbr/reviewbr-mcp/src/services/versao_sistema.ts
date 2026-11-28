import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createHash } from "node:crypto";
import { ProjectStateService } from "./project_state.js";

/**
 * Trava 3 da linha 24 da FILA — sistema e sessão presos ao projeto (desenho aprovado pelo Vicente em
 * 28/11/2026, "aprovo a trava 3"; a versão é só o que o projeto usa, a opção recomendada no desenho).
 *
 * VERSÃO DO SISTEMA
 * Na trava, o projeto grava a versão do ReviewBR que usa: o hash do `manifest.json` e da `spec.md` do
 * método (seguindo `extends`), dos dois catálogos de repositórios e a versão do servidor. Cada tool de
 * etapa compara com a de hoje e, se mudou, recusa dizendo o que mudou, até uma emenda de migração
 * aprovada pelo pesquisador (`record_protocol_amendment`, `migracao: true`) congelar a versão nova.
 * Uma manutenção que não toca no que o projeto usa não para a pesquisa.
 *
 * POSSE DA SESSÃO
 * A primeira tool que grava no projeto abre a posse dele para a sessão que a chamou; cada chamada a
 * renova. Outra sessão é recusada enquanto a posse estiver viva. A posse parada há mais de 2 h, ou de
 * uma sessão cujo processo já não existe nesta máquina, é retomada, com registro no `project_state.json`.
 * A sessão é o processo do Claude Code que abriu o servidor (o pid pai), nesta máquina: reiniciar o
 * servidor na mesma sessão não troca a posse.
 *
 * LIMITE: não vê quem edita os arquivos por fora das tools.
 */

export interface VersaoSistema {
    /** componente → hash (ou versão, no caso do servidor). */
    componentes: Record<string, string>;
    desde: string;
    /** "trava", "primeira conferência (projeto travado antes de 28/11/2026)" ou o id da emenda de migração. */
    origem: string;
}

const sha = (b: Buffer | string) => createHash("sha256").update(b).digest("hex");

function lerSeExiste(p: string): Buffer | null {
    try { return fs.readFileSync(p); } catch { return null; }
}

/** A versão de hoje do que o projeto usa. Arquivo ausente entra como "ausente" (também é mudança). */
export function versaoAtual(repoRoot: string, methodId: string): Record<string, string> {
    const c: Record<string, string> = {};
    const vistos = new Set<string>();
    let m: string | undefined = methodId;
    while (m && !vistos.has(m)) {
        vistos.add(m);
        const dir = path.join(repoRoot, ".claude", "methodologies", m);
        const man = lerSeExiste(path.join(dir, "manifest.json"));
        const spec = lerSeExiste(path.join(dir, "spec.md"));
        c[`método ${m}: manifest.json`] = man ? sha(man) : "ausente";
        c[`método ${m}: spec.md`] = spec ? sha(spec) : "ausente";
        let ext: unknown;
        try { ext = man ? JSON.parse(man.toString("utf-8"))?.extends : undefined; } catch { ext = undefined; }
        m = typeof ext === "string" && ext ? ext : undefined;
    }
    const mcp = path.join(repoRoot, "reviewbr", "reviewbr-mcp");
    for (const f of ["repositories_catalog.json", "bases_internacionais.json"]) {
        const b = lerSeExiste(path.join(mcp, "data", "sources", f));
        c[`catálogo: ${f}`] = b ? sha(b) : "ausente";
    }
    let v = "ausente";
    try { v = String(JSON.parse(fs.readFileSync(path.join(mcp, "package.json"), "utf-8")).version ?? "ausente"); } catch { /* ausente */ }
    c["servidor: versão"] = v;
    return c;
}

export function congelarVersao(repoRoot: string, projectDir: string, origem: string): VersaoSistema {
    const st = ProjectStateService.read(projectDir)!;
    const versao: VersaoSistema = { componentes: versaoAtual(repoRoot, st.method), desde: new Date().toISOString(), origem };
    ProjectStateService.patch(projectDir, { versao_sistema: versao });
    return versao;
}

/** O que mudou entre a versão gravada e a de hoje. */
export function diferencas(gravada: Record<string, string>, hoje: Record<string, string>): string[] {
    const nomes = [...new Set([...Object.keys(gravada), ...Object.keys(hoje)])];
    const curto = (x?: string) => (x === undefined ? "não usado" : /^[0-9a-f]{64}$/.test(x) ? `${x.slice(0, 12)}…` : x);
    return nomes.filter((n) => gravada[n] !== hoje[n]).map((n) => `${n}: ${curto(gravada[n])} → ${curto(hoje[n])}`);
}

export type ConferenciaDaVersao = { ok: true; aviso: string } | { ok: false; motivo: string };

/**
 * Confere a versão do sistema de um projeto LOCKED. Projeto travado antes desta trava não tem versão
 * gravada: a de hoje é gravada na primeira conferência, com aviso — é o retrato do que ele passa a usar.
 */
export function conferirVersao(repoRoot: string, projectDir: string, tool: string): ConferenciaDaVersao {
    const st = ProjectStateService.read(projectDir);
    if (!st || st.status !== "LOCKED") return { ok: true, aviso: "" };
    if (!st.versao_sistema) {
        const v = congelarVersao(repoRoot, projectDir, "primeira conferência (projeto travado antes de 28/11/2026)");
        return {
            ok: true,
            aviso: `🔒 Trava 3: o projeto foi travado antes de gravar a versão do sistema; a de hoje foi gravada agora ` +
                `(${Object.keys(v.componentes).length} componentes). Daqui em diante, se o método, os catálogos ou o servidor mudarem, ` +
                "as tools de etapa recusam até a emenda de migração.",
        };
    }
    const mudou = diferencas(st.versao_sistema.componentes, versaoAtual(repoRoot, st.method));
    if (!mudou.length) return { ok: true, aviso: "" };
    return {
        ok: false,
        motivo: [
            `🚫 RECUSADO: \`${tool}\` não roda: o sistema que este projeto usa mudou desde ${st.versao_sistema.desde.slice(0, 10)} (${st.versao_sistema.origem}).`,
            ...mudou.map((d) => `- ${d}`),
            "Regra do projeto: trava 3 da linha 24 — o projeto corre na versão do sistema gravada na trava; mudar de versão no meio da etapa mudaria o método da pesquisa sem decisão do pesquisador.",
            "Isso mudaria o projeto de pesquisa e não pode ser feito aqui nem pelo chat: o caminho é a emenda de migração " +
                "(`record_protocol_amendment`, tipo 'emenda', com `migracao: true`), que diz o que mudou no sistema e traz a decisão do pesquisador; aprovada, a versão de hoje passa a ser a do projeto.",
        ].join("\n"),
    };
}

// ─── posse da sessão ───────────────────────────────────────────────────────

export const ARQUIVO_POSSE = ".posse_sessao.json";
export const POSSE_PARADA_MS = 2 * 60 * 60 * 1000;

export interface Sessao { id: string; pid: number; maquina: string }
export interface Posse extends Sessao { aberta_em: string; renovada_em: string }
export interface Retomada { de: Posse; para: Sessao; em: string; motivo: string }

/** A sessão desta chamada: o processo do Claude Code que abriu o servidor, nesta máquina. */
export function sessaoAtual(): Sessao {
    const maquina = os.hostname();
    return { id: `${maquina}:${process.ppid}`, pid: process.ppid, maquina };
}

function processoVivo(pid: number): boolean {
    try { process.kill(pid, 0); return true; } catch (e: any) { return e?.code === "EPERM"; }
}

export type ConferenciaDaPosse = { ok: true; aviso: string } | { ok: false; motivo: string };

export function conferirPosse(
    projectDir: string, tool: string, sessao: Sessao = sessaoAtual(), agora: number = Date.now(),
    vivo: (pid: number) => boolean = processoVivo,
): ConferenciaDaPosse {
    if (!ProjectStateService.exists(projectDir)) return { ok: true, aviso: "" };
    const p = path.join(projectDir, ARQUIVO_POSSE);
    const iso = new Date(agora).toISOString();
    let atual: Posse | null = null;
    try { atual = JSON.parse(fs.readFileSync(p, "utf-8")); } catch { atual = null; }
    const grava = (x: Posse) => fs.writeFileSync(p, JSON.stringify(x, null, 2));
    if (!atual || !atual.id) {
        grava({ ...sessao, aberta_em: iso, renovada_em: iso });
        return { ok: true, aviso: "" };
    }
    if (atual.id === sessao.id) {
        grava({ ...atual, renovada_em: iso });
        return { ok: true, aviso: "" };
    }
    const parada = agora - Date.parse(atual.renovada_em);
    const morta = atual.maquina === sessao.maquina && !vivo(atual.pid);
    if (parada <= POSSE_PARADA_MS && !morta) {
        const min = Math.max(0, Math.round(parada / 60000));
        return {
            ok: false,
            motivo: [
                `🚫 RECUSADO: \`${tool}\` não roda: o projeto está com outra sessão (${atual.id}), aberta em ${atual.aberta_em.slice(0, 16).replace("T", " ")} ` +
                    `e usada há ${min} min.`,
                "Regra do projeto: trava 3 da linha 24 — uma sessão por vez grava no projeto; duas sessões ao mesmo tempo poderiam rodar etapas sobre insumos diferentes.",
                `Termine o trabalho na outra sessão. A posse é retomada quando aquela sessão fechar ou ficar mais de ${POSSE_PARADA_MS / 3600000} h parada.`,
            ].join("\n"),
        };
    }
    const motivo = morta ? "o processo da sessão anterior já não existe nesta máquina" : `posse parada há mais de ${POSSE_PARADA_MS / 3600000} h`;
    const st = ProjectStateService.read(projectDir)!;
    const ret: Retomada = { de: atual, para: sessao, em: iso, motivo };
    ProjectStateService.patch(projectDir, { posses_retomadas: [...(st.posses_retomadas ?? []), ret] });
    grava({ ...sessao, aberta_em: iso, renovada_em: iso });
    return { ok: true, aviso: `🔑 Trava 3: posse do projeto retomada da sessão ${atual.id} (${motivo}); a retomada ficou registrada no project_state.json.` };
}
