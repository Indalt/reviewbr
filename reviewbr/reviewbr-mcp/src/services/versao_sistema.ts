import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { ProjectStateService } from "./project_state.js";
import { lerTrilha, etapaSeguinte, type Etapa } from "./method_trail.js";
import { hashDoArtefato, type Fechamento } from "./fechamentos.js";

/**
 * Trava 3 da linha 24 da FILA — sistema e sessão presos ao projeto (desenho aprovado pelo Vicente em
 * 28/11/2026, "aprovo a trava 3"; a versão é só o que o projeto usa, a opção recomendada no desenho).
 *
 * VERSÃO DO SISTEMA
 * Na trava, o projeto grava a versão do ReviewBR que usa: o hash do `manifest.json` e da `spec.md` do
 * método (seguindo `extends`), dos dois catálogos de repositórios e a versão do servidor. Cada tool de
 * etapa compara com a de hoje e, se mudou o que alcança o que falta da pesquisa, recusa dizendo no
 * que a mudança implica, até uma emenda de migração aprovada pelo pesquisador (`record_protocol_amendment`,
 * `migracao: true`) congelar a versão nova. Uma manutenção que não toca no que o projeto usa não para a
 * pesquisa; desde 28/11/2026 (pedido do Vicente), também não a para a mudança de texto ou de nome, nem a
 * de uma etapa que já correu: a comparação é por etapa, e só as etapas abertas contam.
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
    /** componente → hash (ou versão, no caso do servidor). Só o que, mudando, muda a pesquisa. */
    componentes: Record<string, string>;
    /** Hash do arquivo inteiro (manifest, spec): mudança só aqui é de texto e não conta. */
    texto?: Record<string, string>;
    /** Retrato de cada etapa (o que conta dela), para dizer no que a mudança implica. */
    trilha?: Record<string, unknown>;
    /** 2 = por etapa (desde 28/11/2026, pedido do Vicente); ausente = o arquivo inteiro (formato da trava 3 original). */
    formato?: number;
    desde: string;
    /** "trava", "primeira conferência (...)", "conversão de formato" ou o id da emenda de migração. */
    origem: string;
}

const sha = (b: Buffer | string) => createHash("sha256").update(b).digest("hex");

function lerSeExiste(p: string): Buffer | null {
    try { return fs.readFileSync(p); } catch { return null; }
}

/**
 * Texto e nomes não contam (decisão do Vicente, 28/11/2026): estas chaves são prosa — o nome e o
 * procedimento (`role`) da etapa, as notas, as descrições, o texto dos gates e das perguntas.
 * O que conta é o que muda o que a pesquisa faz: a ordem das etapas, as tools de cada uma, o artefato
 * que a fecha, as decisões e as opções, as regras (gates, condições, suplementos).
 */
const PROSA = new Set(["name", "description", "note", "blocks", "role", "pergunta", "o_que_se_decide", "consequencia", "spec",
    "protocol_template", "flow_template", "extraction_template"]);

function semantico(x: unknown): unknown {
    if (Array.isArray(x)) return x.map(semantico);
    if (x && typeof x === "object") {
        const out: Record<string, unknown> = {};
        for (const k of Object.keys(x as object).sort()) {
            if (PROSA.has(k) || k.startsWith("_")) continue;
            out[k] = semantico((x as any)[k]);
        }
        return out;
    }
    return x;
}

/** Seções `## Fx — ...` da spec, por etapa; o resto é "fora das etapas". */
function secoesDaSpec(spec: string): { porEtapa: Record<string, string>; fora: string } {
    const porEtapa: Record<string, string> = {};
    let fora = "";
    let atual: string | null = null;
    for (const linha of spec.replace(/\r\n/g, "\n").split("\n")) {
        const m = /^## (F\d+(?:[._]\d+)?)\b/.exec(linha);
        if (m) atual = m[1].replace(".", "_");
        else if (/^## /.test(linha) || /^# /.test(linha)) atual = null;
        if (atual) porEtapa[atual] = (porEtapa[atual] ?? "") + linha + "\n";
        else fora += linha + "\n";
    }
    return { porEtapa, fora };
}

interface Partes { componentes: Record<string, string>; texto: Record<string, string>; trilha: Record<string, unknown> }

/** Os componentes de um método a partir do conteúdo do manifest e da spec (de hoje ou de um commit antigo). */
function partesDoMetodo(m: string, man: Buffer | null, spec: Buffer | null, p: Partes): string | undefined {
    p.texto[`método ${m}: manifest.json`] = man ? sha(man) : "ausente";
    p.texto[`método ${m}: spec.md`] = spec ? sha(spec) : "ausente";
    let j: any = null;
    try { j = man ? JSON.parse(man.toString("utf-8")) : null; } catch { j = null; }
    if (!j) {
        p.componentes[`método ${m}: manifest.json`] = man ? sha(man) : "ausente";
    } else {
        const fases: any[] = Array.isArray(j.phases) ? j.phases : [];
        const decisoes: any[] = Array.isArray(j.decisoes) ? j.decisoes : [];
        p.componentes[`método ${m}: ordem das etapas`] = sha(JSON.stringify(fases.map((e) => [e?.id, e?.active !== false])));
        for (const e of fases) {
            // As tools da etapa são do SISTEMA (como ele confere a ordem), não do método: a mudança delas não
            // é emenda (pedido do Vicente, 28/11/2026: "nao tem nada que explicar sobre tools do sistema").
            const { producer_tools, step_tools, ...doMetodo } = e ?? {};
            const retrato = semantico({ ...doMetodo, decisoes: decisoes.filter((d) => d?.etapa === e?.id) });
            const tools = [...listaTools(producer_tools), ...listaTools(step_tools)].sort();
            p.componentes[`método ${m}: etapa ${e?.id}`] = sha(JSON.stringify(retrato));
            p.componentes[`sistema: tools da etapa ${e?.id} (${m})`] = sha(JSON.stringify(tools));
            p.trilha[`${m}:${e?.id}`] = { nome: e?.name, ...(retrato as object), tools };
        }
        const { phases: _f, decisoes: _d, ...resto } = j;
        p.componentes[`método ${m}: regras gerais do manifest`] = sha(JSON.stringify(semantico(resto)));
    }
    const s = secoesDaSpec(spec ? spec.toString("utf-8") : "");
    for (const [id, t] of Object.entries(s.porEtapa)) p.componentes[`método ${m}: spec ${id}`] = sha(t);
    p.componentes[`método ${m}: spec fora das etapas`] = spec ? sha(s.fora) : "ausente";
    const ext = j?.extends;
    return typeof ext === "string" && ext ? ext : undefined;
}

function partesDeHoje(repoRoot: string, methodId: string): Partes {
    const p: Partes = { componentes: {}, texto: {}, trilha: {} };
    const vistos = new Set<string>();
    let m: string | undefined = methodId;
    while (m && !vistos.has(m)) {
        vistos.add(m);
        const dir = path.join(repoRoot, ".claude", "methodologies", m);
        m = partesDoMetodo(m, lerSeExiste(path.join(dir, "manifest.json")), lerSeExiste(path.join(dir, "spec.md")), p);
    }
    const mcp = path.join(repoRoot, "reviewbr", "reviewbr-mcp");
    for (const f of ["repositories_catalog.json", "bases_internacionais.json"]) {
        const b = lerSeExiste(path.join(mcp, "data", "sources", f));
        p.componentes[`catálogo: ${f}`] = b ? sha(b) : "ausente";
    }
    let v = "ausente";
    try { v = String(JSON.parse(fs.readFileSync(path.join(mcp, "package.json"), "utf-8")).version ?? "ausente"); } catch { /* ausente */ }
    p.componentes["servidor: versão"] = v;
    return p;
}

/** A versão de hoje do que o projeto usa (só os componentes que contam). */
export function versaoAtual(repoRoot: string, methodId: string): Record<string, string> {
    return partesDeHoje(repoRoot, methodId).componentes;
}

export function congelarVersao(repoRoot: string, projectDir: string, origem: string): VersaoSistema {
    const st = ProjectStateService.read(projectDir)!;
    const p = partesDeHoje(repoRoot, st.method);
    const versao: VersaoSistema = { ...p, formato: 2, desde: new Date().toISOString(), origem };
    ProjectStateService.patch(projectDir, { versao_sistema: versao });
    return versao;
}

/** O que mudou entre a versão gravada e a de hoje. */
export function diferencas(gravada: Record<string, string>, hoje: Record<string, string>): string[] {
    const nomes = [...new Set([...Object.keys(gravada), ...Object.keys(hoje)])];
    const curto = (x?: string) => (x === undefined ? "não usado" : /^[0-9a-f]{64}$/.test(x) ? `${x.slice(0, 12)}…` : x);
    return nomes.filter((n) => gravada[n] !== hoje[n]).map((n) => `${n}: ${curto(gravada[n])} → ${curto(hoje[n])}`);
}

// ─── versão gravada no formato antigo: reconstruída pelo git ──────────────

/** O conteúdo de um arquivo do repositório num commit antigo cujo sha256 é `alvo`, ou null. */
function conteudoNoGit(repoRoot: string, rel: string, alvo: string): Buffer | null {
    try {
        const commits = execFileSync("git", ["-C", repoRoot, "log", "--format=%H", "-n", "300", "--", rel], { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] })
            .split("\n").filter(Boolean);
        for (const c of commits) {
            for (const variante of [false, true]) {
                let b: Buffer;
                try { b = execFileSync("git", ["-C", repoRoot, "show", `${c}:${rel}`], { stdio: ["ignore", "pipe", "ignore"] }); } catch { break; }
                if (variante) b = Buffer.from(b.toString("utf-8").replace(/\r?\n/g, "\r\n"), "utf-8");
                if (sha(b) === alvo) return b;
            }
        }
    } catch { /* sem git */ }
    return null;
}

/**
 * A versão gravada antes de 28/11/2026 guardava o hash do manifest e da spec inteiros. Para comparar
 * por etapa, o conteúdo daquele dia é procurado no histórico do git. Achado, a versão gravada é
 * convertida (é o mesmo retrato, em outra forma); não achado, devolve null e a regra antiga vale.
 */
function converterFormatoAntigo(repoRoot: string, st: any): VersaoSistema | null {
    const g: VersaoSistema = st.versao_sistema;
    const p: Partes = { componentes: {}, texto: {}, trilha: {} };
    const vistos = new Set<string>();
    let m: string | undefined = st.method;
    while (m && !vistos.has(m)) {
        vistos.add(m);
        const hm = g.componentes[`método ${m}: manifest.json`];
        const hs = g.componentes[`método ${m}: spec.md`];
        if (!hm || !hs || hm === "ausente" || hs === "ausente") return null;
        const base = `.claude/methodologies/${m}`;
        const atualM = lerSeExiste(path.join(repoRoot, base, "manifest.json"));
        const atualS = lerSeExiste(path.join(repoRoot, base, "spec.md"));
        const man = atualM && sha(atualM) === hm ? atualM : conteudoNoGit(repoRoot, `${base}/manifest.json`, hm);
        const spec = atualS && sha(atualS) === hs ? atualS : conteudoNoGit(repoRoot, `${base}/spec.md`, hs);
        if (!man || !spec) return null;
        m = partesDoMetodo(m, man, spec, p);
    }
    for (const k of Object.keys(g.componentes)) if (!k.startsWith("método ")) p.componentes[k] = g.componentes[k];
    return { ...p, formato: 2, desde: g.desde, origem: `${g.origem}; convertida por etapa em ${new Date().toISOString().slice(0, 10)}` };
}

// ─── o que conta: só o que muda o que falta da pesquisa ────────────────────

/**
 * `metodo`: o que o método da pesquisa diz (ordem e definição das etapas, decisões, texto normativo, regras):
 * é emenda, e o pesquisador a explica em termos do método. `sistema`: como o ReviewBR executa e confere
 * (tools de cada etapa, catálogos, servidor): não é emenda; o pesquisador registra que o projeto segue na
 * versão nova, e o registro fica só na conferência.
 */
export interface Mudanca { componente: string; antes: string; hoje: string; implica: string; tipo: "metodo" | "sistema" }

export interface Analise {
    /** Mudanças que alteram o que falta da pesquisa: exigem a emenda de migração. */
    contam: Mudanca[];
    /** Mudanças de texto, ou de etapas já fechadas: não se exigem do projeto. */
    naoContam: Mudanca[];
    /** Etapas abertas (as que ainda vão correr). */
    abertas: string[];
    gravada: VersaoSistema;
    hoje: VersaoSistema;
    /** A versão gravada estava no formato antigo e não foi achada no git: compara-se o arquivo inteiro. */
    semConversao?: boolean;
}

function etapasAbertas(repoRoot: string, st: any): { abertas: Set<string>; etapas: Etapa[] } {
    const etapas = lerTrilha(repoRoot, st.method).etapas;
    const idx = (id: string) => etapas.findIndex((e) => e.id === id);
    const desde = st.trava_etapas?.desde_etapa ?? etapaSeguinte(etapas, st.phase)?.id ?? st.phase;
    const fechadas = new Set((st.etapas_fechadas ?? []).map((f: any) => f.etapa));
    return { abertas: new Set(etapas.filter((e) => idx(e.id) >= idx(desde) && !fechadas.has(e.id)).map((e) => e.id)), etapas };
}

function listaTools(x: unknown): string[] { return Array.isArray(x) ? x.map(String) : []; }

/** No que a mudança implica, em uma frase curta, para o pesquisador. */
function implicacao(c: string, antes: string, hoje: string, gravada: VersaoSistema, atual: VersaoSistema): string {
    let m = /^método (\S+): etapa (\S+)$/.exec(c);
    if (m) {
        const a: any = gravada.trilha?.[`${m[1]}:${m[2]}`] ?? {};
        const h: any = atual.trilha?.[`${m[1]}:${m[2]}`] ?? {};
        const nome = `a etapa ${m[2]}${h.nome || a.nome ? ` (${h.nome ?? a.nome})` : ""}`;
        if (antes === undefined || antes === "não usado") return `${nome} passa a existir no método`;
        if (hoje === undefined || hoje === "não usado") return `${nome} deixa de existir no método`;
        const partes: string[] = [];
        if (a.closes_with !== h.closes_with) partes.push(`o artefato que a encerra passa de ${a.closes_with} a ${h.closes_with}`);
        if (a.active !== h.active) partes.push(h.active === false ? "ela deixa de se aplicar ao método" : "ela passa a se aplicar ao método");
        if (JSON.stringify(a.decisoes) !== JSON.stringify(h.decisoes)) partes.push("mudam as decisões que o método exige antes dela");
        if (JSON.stringify(a.produces) !== JSON.stringify(h.produces)) partes.push("mudam os artefatos que ela grava");
        return `mudança n${nome}: ${partes.join("; ") || "muda a definição dela no método"}`;
    }
    if ((m = /^sistema: tools da etapa (\S+) \((\S+)\)$/.exec(c))) {
        const a: any = gravada.trilha?.[`${m[2]}:${m[1]}`] ?? {};
        const h: any = atual.trilha?.[`${m[2]}:${m[1]}`] ?? {};
        const ta = new Set(listaTools(a.tools ?? [...listaTools(a.producer_tools), ...listaTools(a.step_tools)]));
        const th = new Set(listaTools(h.tools));
        const mais = [...th].filter((t) => !ta.has(t));
        const menos = [...ta].filter((t) => !th.has(t));
        const partes = [
            mais.length ? `passa a conferir a ordem de ${mais.join(", ")}` : "",
            menos.length ? `deixa de conferir a ordem de ${menos.join(", ")}` : "",
        ].filter(Boolean);
        return `na etapa ${m[1]}${h.nome ? ` (${h.nome})` : ""}, o sistema ${partes.join(" e ") || "muda as operações cuja ordem confere"}`;
    }
    if ((m = /^método (\S+): spec (F\S+)$/.exec(c))) return `mudança no texto normativo da etapa ${m[2]} (spec.md do método ${m[1]}), que diz o que a etapa faz`;
    if ((m = /^método (\S+): spec fora das etapas$/.exec(c))) return `mudança no texto normativo geral do método ${m[1]} (spec.md)`;
    if ((m = /^método (\S+): ordem das etapas$/.exec(c))) return `mudança na ordem ou no conjunto das etapas do método ${m[1]}`;
    if ((m = /^método (\S+): regras gerais do manifest$/.exec(c))) return `mudança nas regras gerais do método ${m[1]} (gates, condições, suplementos ou invariantes)`;
    if ((m = /^método (\S+): manifest.json$/.exec(c))) return `mudança no manifest.json do método ${m[1]}`;
    if ((m = /^método (\S+): spec.md$/.exec(c))) return `mudança na spec.md do método ${m[1]}`;
    if ((m = /^catálogo: (.+)$/.exec(c))) return `mudança no catálogo de fontes (${m[1]}), de onde as tools tiram endereço e forma de acesso`;
    if (c === "servidor: versão") return `o servidor do ReviewBR passou da versão ${antes} para a ${hoje}`;
    return `mudança em ${c}`;
}

/** Separa o que mudou no sistema entre o que conta para o que falta da pesquisa e o que não conta. */
export function analisarMudancas(repoRoot: string, projectDir: string): Analise | null {
    const st = ProjectStateService.read(projectDir);
    if (!st?.versao_sistema) return null;
    const p = partesDeHoje(repoRoot, st.method);
    const hoje: VersaoSistema = { ...p, formato: 2, desde: new Date().toISOString(), origem: "" };
    let gravada: VersaoSistema = st.versao_sistema;
    let semConversao = false;
    if (gravada.formato !== 2) {
        const conv = converterFormatoAntigo(repoRoot, st);
        if (conv) gravada = conv;
        else semConversao = true;
    }
    const { abertas } = etapasAbertas(repoRoot, st);
    const contam: Mudanca[] = [];
    const naoContam: Mudanca[] = [];
    const foraDoMetodo = Object.fromEntries(Object.entries(p.componentes).filter(([k]) => !k.startsWith("método ")));
    const g = gravada.componentes;
    const h = semConversao ? { ...foraDoMetodo, ...versaoAntigaDeHoje(repoRoot, st.method) } : p.componentes;
    for (const c of [...new Set([...Object.keys(g), ...Object.keys(h)])]) {
        if (g[c] === h[c]) continue;
        const tipo: Mudanca["tipo"] = c.startsWith("método ") ? "metodo" : "sistema";
        const mu: Mudanca = { componente: c, antes: g[c] ?? "não usado", hoje: h[c] ?? "não usado", implica: implicacao(c, g[c], h[c], gravada, hoje), tipo };
        const etapa = /(?:: (?:etapa|spec) |tools da etapa )(F[^\s)]+)/.exec(c)?.[1];
        if (etapa && !abertas.has(etapa)) naoContam.push({ ...mu, implica: `${mu.implica} — a etapa ${etapa} já correu, e a mudança não a alcança` });
        else contam.push(mu);
    }
    if (!semConversao) {
        for (const c of Object.keys(p.texto)) {
            if (gravada.texto?.[c] === undefined || gravada.texto[c] === p.texto[c]) continue;
            const semEfeito = !contam.some((x) => x.componente.startsWith(c.split(":")[0] + ":"));
            if (semEfeito) naoContam.push({ componente: c, antes: gravada.texto[c], hoje: p.texto[c], implica: `mudança só de texto ou de nome em ${c} (procedimento, notas, descrições); nada muda no que a pesquisa faz`, tipo: "metodo" });
        }
    }
    return { contam, naoContam, abertas: [...abertas], gravada, hoje, semConversao };
}

/** No formato antigo sem conversão possível, compara-se o arquivo inteiro, como antes. */
function versaoAntigaDeHoje(repoRoot: string, methodId: string): Record<string, string> {
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
    return c;
}

/** A frase da emenda de migração (decisão do Vicente, 28/11/2026), com o que a atualização implica. */
export function fraseDaMigracao(implica: string): string {
    return `Durante a execução desta pesquisa o sistema passou por atualizações que implicam em ${implica.trim().replace(/[.;\s]+$/, "")} ` +
        "e por isso a emenda é necessária.";
}

export const ARQUIVO_CONFERENCIA = "logs/conferencia_atualizacoes_do_sistema.md";

/**
 * A conferência de que a atualização não põe o projeto em suspeita: o que mudou e conta, o que mudou e
 * não conta, as etapas fechadas com o hash do artefato (igual ou não ao do fechamento) e as decisões
 * gravadas. Vai a `logs/`, que é registro de conferência — nunca ao `change_log.md` nem a outro
 * suplemento do relato (decisão do Vicente, 28/11/2026).
 */
export function registrarConferencia(projectDir: string, titulo: string, a: Analise): string {
    const st = ProjectStateService.read(projectDir)!;
    const fechadas = (st.etapas_fechadas ?? []).map((f: Fechamento) => {
        const hoje = hashDoArtefato(projectDir, f.artefato);
        return `- ${f.etapa}: ${f.artefato}, fechada em ${f.em.slice(0, 10)} — hash do fechamento ${f.sha256.slice(0, 12)}…, hoje ${hoje ? `${hoje.slice(0, 12)}…` : "ausente"}: ` +
            (hoje === f.sha256 ? "inalterado" : "⚠ DIFERENTE — conferir antes de aprovar");
    });
    const respostas = Object.entries(st.trava_etapas?.respostas ?? {}).map(([k, r]: [string, any]) => `- ${k}: "${r.resposta}" (${r.origem})`);
    const lista = (xs: Mudanca[]) => xs.length ? xs.map((m) => `- ${m.implica}`).join("\n") : "- nenhuma";
    const bloco = [
        `## ${titulo} — ${new Date().toISOString().slice(0, 10)}`,
        "",
        `Versão do sistema gravada no projeto: desde ${a.gravada.desde.slice(0, 10)} (${a.gravada.origem}).`,
        a.semConversao ? "A versão gravada é do formato antigo e não foi achada no histórico do git: a comparação é do arquivo inteiro." : "",
        `Etapas que ainda vão correr: ${a.abertas.join(", ") || "nenhuma"}.`,
        "",
        "**O que mudou no método e alcança o que falta da pesquisa:**", lista(a.contam.filter((m) => m.tipo === "metodo")),
        "",
        "**O que mudou só no sistema** (como o ReviewBR executa e confere; o método não muda):", lista(a.contam.filter((m) => m.tipo === "sistema")),
        "",
        "**O que mudou e não alcança a pesquisa** (texto, nomes, ou etapas que já correram):", lista(a.naoContam),
        "",
        "**O que já foi feito não muda** — etapas fechadas, conferidas pelo hash do artefato que as encerrou:",
        fechadas.length ? fechadas.join("\n") : "- nenhuma etapa fechada sob a trava 2 (o projeto pode ter etapas feitas antes dela, que não têm hash gravado)",
        "",
        "**Decisões de etapa gravadas** (a atualização não as altera; só uma emenda as muda):",
        respostas.length ? respostas.join("\n") : "- nenhuma",
        "",
        "A atualização vale só a partir daqui, nas etapas que ainda vão correr. Registro de conferência; não entra no relato da pesquisa.",
        "",
    ].filter((l, i, xs) => !(l === "" && xs[i - 1] === "")).join("\n");
    const arq = path.join(projectDir, ARQUIVO_CONFERENCIA);
    fs.mkdirSync(path.dirname(arq), { recursive: true });
    const cabeca = fs.existsSync(arq) ? "" : "# Conferência das atualizações do sistema\n\nRegistro de conferência sobre a pesquisa (trava 3). Não é suplemento do relato.\n\n";
    fs.appendFileSync(arq, cabeca + bloco + "\n");
    return ARQUIVO_CONFERENCIA;
}

export type ConferenciaDaVersao = { ok: true; aviso: string } | { ok: false; motivo: string };

/**
 * Confere a versão do sistema de um projeto LOCKED. Projeto travado antes desta trava não tem versão
 * gravada: a de hoje é gravada na primeira conferência, com aviso — é o retrato do que ele passa a usar.
 * Decisão do Vicente de 28/11/2026: só a mudança que alcança o que falta da pesquisa (ordem, tools e
 * decisões das etapas ainda abertas, o texto normativo delas, as regras gerais, os catálogos, o
 * servidor) exige a emenda; texto, nomes e etapas que já correram não se exigem do projeto — a versão
 * gravada é atualizada, e a conferência vai a `logs/`.
 */
export function conferirVersao(repoRoot: string, projectDir: string, tool: string): ConferenciaDaVersao {
    const st = ProjectStateService.read(projectDir);
    if (!st || st.status !== "LOCKED") return { ok: true, aviso: "" };
    if (!st.versao_sistema) {
        const v = congelarVersao(repoRoot, projectDir, "primeira conferência (projeto travado antes de 28/11/2026)");
        return {
            ok: true,
            aviso: `🔒 Trava 3: o projeto foi travado antes de gravar a versão do sistema; a de hoje foi gravada agora ` +
                `(${Object.keys(v.componentes).length} componentes). Daqui em diante, se mudar no sistema o que alcança o que falta da pesquisa, ` +
                "as tools de etapa recusam até a emenda de migração.",
        };
    }
    const a = analisarMudancas(repoRoot, projectDir)!;
    if (!a.contam.length) {
        if (!a.naoContam.length && st.versao_sistema.formato === 2) return { ok: true, aviso: "" };
        // Nada que alcance a pesquisa: a versão gravada passa a ser a de hoje, com o registro de conferência.
        const arq = a.naoContam.length ? registrarConferencia(projectDir, "Atualização do sistema sem efeito no que falta da pesquisa", a) : "";
        ProjectStateService.patch(projectDir, {
            versao_sistema: {
                ...a.hoje, desde: new Date().toISOString(),
                origem: a.naoContam.length ? `atualização sem efeito na pesquisa (antes: ${st.versao_sistema.origem})` : a.gravada.origem,
            },
        });
        return {
            ok: true,
            aviso: a.naoContam.length
                ? `🔒 Trava 3: o sistema mudou desde a versão do projeto, mas nada que alcance o que falta da pesquisa (${a.naoContam.length} mudança(s) de texto, nome ou etapa já feita). ` +
                    `Não se exige emenda; a conferência ficou em ${arq}.`
                : "",
        };
    }
    const doMetodo = a.contam.filter((m) => m.tipo === "metodo");
    const doSistema = a.contam.filter((m) => m.tipo === "sistema");
    return {
        ok: false,
        motivo: [
            `🚫 RECUSADO: \`${tool}\` não roda: o sistema que este projeto usa mudou desde ${st.versao_sistema.desde.slice(0, 10)} (${st.versao_sistema.origem}), e a mudança alcança o que falta da pesquisa.`,
            doMetodo.length ? `Muda o método (é emenda):\n${doMetodo.map((m) => `- ${m.implica}`).join("\n")}` : "",
            doSistema.length ? `Muda só o sistema (não é emenda):\n${doSistema.map((m) => `- ${m.implica}`).join("\n")}` : "",
            a.naoContam.length ? `(${a.naoContam.length} outra(s) mudança(s), de texto, nome ou etapa já feita, não se exigem do projeto.)` : "",
            "Regra do projeto: trava 3 da linha 24 — o projeto corre na versão do sistema gravada na trava; mudar de versão no meio da pesquisa sem decisão do pesquisador mudaria o que falta dela.",
            doMetodo.length
                ? "Isso mudaria o método da pesquisa e não pode ser feito aqui nem pelo chat: o caminho é a emenda de migração " +
                    "(`record_protocol_amendment`, tipo 'emenda', `migracao: true`), com `porque` dizendo, em termos do método e para quem avalia a pesquisa, " +
                    "no que a atualização implica — sem falar de tools nem do sistema. A tool monta a frase da emenda; aprovada pelo pesquisador, a versão de hoje passa a ser a do projeto."
                : "Não é emenda: o método não muda. O caminho é registrar a decisão do pesquisador de seguir na versão nova " +
                    "(`record_protocol_amendment`, tipo 'emenda', `migracao: true`, com `contribuicao` nas palavras dele); o registro fica só na conferência, fora do change_log.md.",
            `A conferência de que nada já feito muda vai a ${ARQUIVO_CONFERENCIA}.`,
        ].filter(Boolean).join("\n"),
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
