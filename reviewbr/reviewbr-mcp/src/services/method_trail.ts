import * as fs from "node:fs";
import * as path from "node:path";
import { ProjectStateService } from "./project_state.js";

/**
 * method_trail — a TRILHA do método como dado (DEBT-100).
 *
 * POR QUE EXISTE
 * --------------
 * O manifest declarava `phases` como um mapa de interruptores (`F6: { active: false }`): um
 * método conseguia dizer "esta fase da trilha do ReviewBR está ligada ou desligada", nunca
 * quais são as SUAS etapas. E os nomes das fases estavam escritos à mão no código —
 * `project_state.ts` nascia em F1, `index.ts` gravava F2 ao travar o protocolo e passava F3 e
 * F4 a `podeAvancar` depois da deduplicação e da triagem. Um método de outra forma (definir
 * corpus → trabalho de campo → transcrição → codificação → saturação) só podia ser ENCAIXADO
 * em oito fases que vieram do PRISMA.
 *
 * A REGRA
 * -------
 * O manifest declara a LISTA de etapas — id, nome, papel que executa, artefato que a encerra,
 * tools que gravam esse artefato. A ORDEM é a posição na lista: um campo `order` ao lado da
 * posição seriam duas fontes para o mesmo fato, e duas fontes divergem. O código lê a lista.
 *
 * A divisão de responsabilidade que tira os literais do código: a tool sabe QUE ARTEFATO
 * grava (é o trabalho dela); QUE ETAPA esse artefato encerra é do método.
 *
 * O sistema era agnóstico ao CONTEÚDO das fases. Passa a ser também à FORMA delas.
 */

export interface Etapa {
    id: string;
    name: string;
    /** Papel que executa a etapa — nome de um agente em `.claude/agents/`. */
    role: string;
    /**
     * Artefato que ENCERRA a etapa, relativo à raiz do projeto. Terminado em "/" é pasta.
     * Lacuna se declara com `[NÃO DEFINIDO] motivo` — omissão declarada, nunca silenciosa.
     */
    closes_with: string;
    /** Artefatos intermediários que a etapa grava antes de encerrar (ex.: triagem TA). */
    produces: string[];
    /** Tools do MCP que gravam o artefato de encerramento. Vazio = quem grava é o agente, sem código. */
    producer_tools: string[];
    /** `false` = a etapa não se aplica a este método, e `note` diz por quê. */
    active: boolean;
    note: string;
}

export interface Trilha {
    methodId: string;
    etapas: Etapa[];
    /** Vazio = trilha legível. Preenchido = o método não tem trilha que se possa conduzir. */
    erros: string[];
}

/** Marca de lacuna DECLARADA no artefato de encerramento: a trilha não nomeia o arquivo, e diz isso. */
export const ARTEFATO_NAO_DEFINIDO = "[NÃO DEFINIDO";

function texto(x: unknown): string {
    return typeof x === "string" ? x.trim() : "";
}

function normalizar(rel: string): string {
    return rel.replace(/\\/g, "/").replace(/^\.\//, "");
}

/**
 * Erros ESTRUTURAIS da trilha declarada em `phases`. Lista vazia = trilha legível.
 *
 * Com `agentesDir`, confere também que o papel de cada etapa existe como agente: etapa
 * entregue a um papel que não existe é etapa que ninguém executa.
 */
export function errosDaTrilha(phases: unknown, agentesDir?: string): string[] {
    if (!Array.isArray(phases)) {
        if (phases && typeof phases === "object") {
            const chaves = Object.keys(phases);
            if (!chaves.length) return ["nenhuma fase declarada em 'phases'"];
            if (chaves.some((k) => k.includes("[TBD]"))) return ["fases por declarar (esqueleto do scaffold)"];
            return [
                "'phases' no formato antigo (mapa de interruptores): o método precisa declarar a LISTA " +
                "das suas etapas — id, name, role, closes_with, producer_tools (DEBT-100)",
            ];
        }
        return ["nenhuma fase declarada em 'phases'"];
    }
    if (!phases.length) return ["nenhuma fase declarada em 'phases'"];

    const erros: string[] = [];
    const ids = new Set<string>();
    phases.forEach((e: any, i: number) => {
        const rot = `etapa ${i + 1}${texto(e?.id) ? ` (${texto(e.id)})` : ""}`;
        if (!e || typeof e !== "object" || Array.isArray(e)) {
            erros.push(`${rot}: não é objeto`);
            return;
        }
        // O scaffold grava "[TBD]" como VALOR dos campos da etapa. Esqueleto não conduz pesquisa.
        // Critério estrutural, não textual: uma `note` que documenta a convenção da RV-03
        // ("campo sem dado recebe [TBD]") não é campo por declarar — a mesma classe de falso
        // positivo que o DEBT-121 registrou ao procurar a palavra onde ela é explicada.
        if (["id", "name", "role", "closes_with"].some((k) => texto(e[k]) === "[TBD]")) {
            erros.push(`${rot}: campo por declarar ([TBD]) — esqueleto do scaffold`);
            return;
        }
        const id = texto(e.id);
        if (!id) erros.push(`${rot}: sem 'id'`);
        else if (ids.has(id)) erros.push(`${rot}: id repetido — a etapa deixaria de ser identificável`);
        else ids.add(id);
        if (!texto(e.name)) erros.push(`${rot}: sem 'name'`);

        if (e.active === false) {
            // Não se aplicar é declaração do método, com o motivo — não ausência.
            if (!texto(e.note)) erros.push(`${rot}: etapa desligada sem 'note' — o que não se aplica se declara, com o motivo`);
            return;
        }

        const role = texto(e.role);
        if (!role) erros.push(`${rot}: sem 'role' — que papel executa a etapa`);
        else if (agentesDir && !fs.existsSync(path.join(agentesDir, `${role}.md`))) {
            erros.push(`${rot}: papel "${role}" não existe em .claude/agents/`);
        }
        if (!texto(e.closes_with)) {
            erros.push(`${rot}: sem 'closes_with' — que artefato encerra a etapa (lacuna se declara com "${ARTEFATO_NAO_DEFINIDO}] motivo")`);
        }
        // Obrigatório e explícito: lista vazia DECLARA que nenhum código grava o artefato.
        // Campo ausente diria a mesma coisa em silêncio.
        if (!Array.isArray(e.producer_tools)) {
            erros.push(`${rot}: sem 'producer_tools' — lista das tools que gravam o artefato (vazia = o agente grava, sem código)`);
        }
        if (e.produces !== undefined && !Array.isArray(e.produces)) erros.push(`${rot}: 'produces' precisa ser lista`);
    });
    return erros;
}

/**
 * DEBT-142 — uma CONDIÇÃO que o método declara: a pergunta cuja resposta depende da pesquisa
 * ("a avaliação crítica foi feita?", "que sistema de certeza da evidência?"). Decisão do
 * pesquisador em 17/10/2026: "o método declara a condição, o projeto responde" — a regra
 * continua sendo do método; o projeto só diz qual das opções vale para ele.
 */
export interface Condicao {
    id: string;
    pergunta: string;
    /** Etapa da trilha em que o método faz a pergunta — onde o coordenador a apresenta. */
    etapa: string;
    /** As respostas possíveis, declaradas pelo método. */
    opcoes: string[];
    note: string;
}

/**
 * As condições declaradas no manifest do método (`condicoes`), conferidas contra a trilha.
 * Nunca lança: o que impede usar uma condição vai para `erros`. Manifest sem `condicoes` não
 * declara condição alguma, e isso não é erro.
 */
export function lerCondicoes(repoRoot: string, methodId: string): { condicoes: Condicao[]; erros: string[] } {
    const mp = path.join(repoRoot, ".claude", "methodologies", methodId, "manifest.json");
    let man: any;
    try { man = JSON.parse(fs.readFileSync(mp, "utf-8")); }
    catch { return { condicoes: [], erros: [] }; }   // sem manifest legível, quem lê a trilha já diz por quê
    if (man?.condicoes === undefined) return { condicoes: [], erros: [] };
    if (!Array.isArray(man.condicoes)) return { condicoes: [], erros: ["'condicoes' precisa ser lista"] };

    const etapas = lerTrilha(repoRoot, methodId).etapas;
    const condicoes: Condicao[] = [];
    const erros: string[] = [];
    const ids = new Set<string>();
    man.condicoes.forEach((c: any, i: number) => {
        const id = texto(c?.id);
        const rot = `condição ${i + 1}${id ? ` (${id})` : ""}`;
        const antes = erros.length;
        if (!id) erros.push(`${rot}: sem 'id'`);
        else if (ids.has(id)) erros.push(`${rot}: id repetido`);
        if (!texto(c?.pergunta)) erros.push(`${rot}: sem 'pergunta' — o que o pesquisador responde`);
        const etapa = etapas.find((e) => e.id === texto(c?.etapa));
        if (!etapa) erros.push(`${rot}: a etapa "${texto(c?.etapa)}" não existe na trilha do método`);
        else if (!etapa.active) erros.push(`${rot}: a etapa ${etapa.id} não se aplica ao método — ninguém faria a pergunta`);
        const opcoes = Array.isArray(c?.opcoes) ? c.opcoes.map(texto).filter(Boolean) : [];
        if (opcoes.length < 2 || new Set(opcoes.map(normalizarFala)).size !== opcoes.length) {
            erros.push(`${rot}: 'opcoes' precisa de duas ou mais respostas distintas`);
        }
        if (id) ids.add(id);
        if (erros.length === antes) condicoes.push({ id, pergunta: texto(c.pergunta), etapa: etapa!.id, opcoes, note: texto(c.note) });
    });
    return { condicoes, erros };
}

/** Uma resposta do projeto a uma condição, como o pesquisador a deu (DEBT-142). */
export interface RespostaDeCondicao {
    condicao: string;
    resposta: string;
    contribuicao: string;
    ts: string;
}

/**
 * As respostas do projeto às condições do método — só as gravadas como decisão do pesquisador,
 * com contribuição. A última resposta a cada condição vale: o registro é cumulativo, e mudar de
 * resposta (o pesquisador decidiu fazer a avaliação crítica, afinal) é nova decisão, não edição.
 */
export function respostasDasCondicoes(projectDir: string): Map<string, RespostaDeCondicao> {
    const r = new Map<string, RespostaDeCondicao>();
    for (const d of ProjectStateService.read(projectDir)?.decisions ?? []) {
        if (d.por !== "pesquisador" || !d.condicao?.id || !(d.contribuicao ?? "").trim()) continue;
        r.set(d.condicao.id, { condicao: d.condicao.id, resposta: d.condicao.resposta, contribuicao: d.contribuicao!, ts: d.ts });
    }
    return r;
}

/** Lê a trilha de um método instalado. Nunca lança: o que impede ler vai para `erros`. */
export function lerTrilha(repoRoot: string, methodId: string): Trilha {
    // `project_state.json` é lido sem validação e pode chegar sem `method`: sem esta guarda o
    // path.join lançava TypeError DEPOIS de a tool já ter gravado o artefato.
    if (typeof methodId !== "string" || !methodId.trim()) {
        return { methodId: String(methodId ?? ""), etapas: [], erros: ["o projeto não declara 'method' em project_state.json: não há trilha a ler"] };
    }
    const mp = path.join(repoRoot, ".claude", "methodologies", methodId, "manifest.json");
    if (!fs.existsSync(mp)) return { methodId, etapas: [], erros: [`método "${methodId}" sem manifest.json`] };
    let man: any;
    try {
        man = JSON.parse(fs.readFileSync(mp, "utf-8"));
    } catch (e: any) {
        return { methodId, etapas: [], erros: [`manifest.json de "${methodId}" ilegível: ${e.message}`] };
    }
    const erros = errosDaTrilha(man?.phases, path.join(repoRoot, ".claude", "agents"));
    if (erros.length) return { methodId, etapas: [], erros };

    const etapas: Etapa[] = (man.phases as any[]).map((e) => ({
        id: texto(e.id),
        name: texto(e.name),
        role: texto(e.role),
        closes_with: normalizar(texto(e.closes_with)),
        produces: Array.isArray(e.produces) ? e.produces.map((p: unknown) => normalizar(String(p))) : [],
        producer_tools: Array.isArray(e.producer_tools) ? e.producer_tools.map(String) : [],
        active: e.active !== false,
        note: texto(e.note),
    }));
    return { methodId, etapas, erros: [] };
}

function declara(e: Etapa, artefato: string): boolean {
    const a = normalizar(artefato);
    if (e.closes_with === a || e.produces.includes(a)) return true;
    // Pasta: "01_raw/" é encerrada por qualquer arquivo gravado dentro dela.
    return e.closes_with.endsWith("/") && a.startsWith(e.closes_with);
}

/**
 * A etapa a que um artefato pertence, pela trilha do método. Se mais de uma etapa o declara
 * (o `protocol.md` encerra o pré-registro E o protocolo da questão), vale a ÚLTIMA: fechar o
 * artefato fecha as etapas que ele acumula.
 */
export function etapaDoArtefato(etapas: Etapa[], artefato: string): Etapa | null {
    let achada: Etapa | null = null;
    for (const e of etapas) if (e.active && declara(e, artefato)) achada = e;
    return achada;
}

/** A próxima etapa ATIVA depois de `id`, na ordem da trilha. */
export function etapaSeguinte(etapas: Etapa[], id: string): Etapa | null {
    const i = etapas.findIndex((e) => e.id === id);
    if (i < 0) return null;
    return etapas.slice(i + 1).find((e) => e.active) ?? null;
}

/** Onde o projeto nasce: a primeira etapa ativa da trilha do método. */
export function etapaInicial(etapas: Etapa[]): Etapa | null {
    return etapas.find((e) => e.active) ?? null;
}

/**
 * A etapa de um subitem da spec ("F2.1.1.4" → etapa "F2"). Subitem que não pertence a etapa
 * alguma (ex.: "SUP.1", os suplementos) devolve null — e quem chama declara isso.
 */
export function etapaDoSubitem(etapas: Etapa[], subitem: string): Etapa | null {
    const prefixo = subitem.split(".")[0];
    return etapas.find((e) => e.id === prefixo || e.id === subitem) ?? null;
}

/**
 * O texto da spec de um método, SEGUINDO `extends`: a spec do `scoping-prisma-scr` descreve só
 * os deltas e diz "leia a spec-base primeiro". Ler só o arquivo da pasta deixava o método sem
 * subitem nenhum — e a falsificação do mapeamento, sem rótulo a conferir, voltava limpa por
 * não ter conferido nada.
 */
export function textoDaSpec(repoRoot: string, methodId: string, vistos: Set<string> = new Set()): string {
    if (vistos.has(methodId)) return "";
    vistos.add(methodId);
    const dir = path.join(repoRoot, ".claude", "methodologies", methodId);
    let man: any = {};
    try { man = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf-8")); } catch { /* sem manifest: só a spec */ }
    const sp = path.join(dir, typeof man?.spec === "string" && man.spec ? man.spec : "spec.md");
    const proprio = fs.existsSync(sp) ? fs.readFileSync(sp, "utf-8") : "";
    const base = typeof man?.extends === "string" && man.extends ? textoDaSpec(repoRoot, man.extends, vistos) : "";
    return base ? `${proprio}\n${base}` : proprio;
}

/**
 * Forma de um id de subitem na 1ª coluna das tabelas da spec: segmentos separados por ponto
 * (F0.1.1, F8.3.24, SUP.1, C2.3). Era `F[0-9]…` — a forma da trilha do PRISMA escrita no
 * regex: um método cujas etapas se chamam C1, C2 não teria subitem reconhecido.
 */
export const ID_SUBITEM = "[A-Z][A-Za-z0-9_-]*(?:\\.[A-Za-z0-9_-]+)+";

/** Ids de subitem que a spec do método define (1ª coluna das tabelas: F0.1.1, F8.3.24, SUP.1…). */
export function subitensDaSpec(repoRoot: string, methodId: string): Set<string> {
    const ids = new Set<string>();
    for (const m of textoDaSpec(repoRoot, methodId).matchAll(new RegExp(`^\\|\\s*(${ID_SUBITEM})\\s*\\|`, "gm"))) ids.add(m[1]);
    return ids;
}

/**
 * Fecha no estado do projeto a etapa que um artefato acabou de encerrar — se a decisão do
 * pesquisador permitir (RV-04). Devolve o aviso que a tool anexa à resposta.
 *
 * O artefato já foi gravado antes desta chamada, e fica gravado em qualquer caso: perder
 * trabalho não é trava, é dano. O que a trava impede é AVANÇAR sem supervisão registrada.
 */
export function avancarPorArtefato(repoRoot: string, projectDir: string, artefato: string): { ok: boolean; etapa: string | null; aviso: string } {
    const state = ProjectStateService.read(projectDir);
    if (!state) {
        return { ok: false, etapa: null, aviso: "🚧 Sem project_state.json: não há onde registrar decisão nem o que verificar." };
    }
    const trilha = lerTrilha(repoRoot, state.method);
    const etapa = etapaDoArtefato(trilha.etapas, artefato);
    if (!etapa) {
        const porque = trilha.erros.length ? ` A trilha não pôde ser lida: ${trilha.erros.join("; ")}.` : "";
        return {
            ok: false, etapa: null,
            aviso: `🚧 A trilha do método "${state.method}" não declara etapa encerrada por ${artefato}: ` +
                `o artefato foi gravado, a fase NÃO avançou.${porque}`,
        };
    }
    const gate = ProjectStateService.podeAvancar(projectDir, etapa.id);
    if (gate.ok) ProjectStateService.setPhase(projectDir, etapa.id);
    return { ok: gate.ok, etapa: etapa.id, aviso: `${gate.ok ? "✅" : "🚧"} ${gate.motivo}` };
}

/**
 * Resposta que não diz o que foi avaliado nem o que foi escolhido: carimbo, não decisão.
 * Comparada depois de normalizar (minúsculas, sem acento, sem pontuação).
 */
const CARIMBO = /^(ok|okay|sim|s|pode|pode seguir|segue|siga|seguir|aprovado|aprovo|de acordo|concordo|certo|beleza|tudo bem|tudo certo|continue|continuar|prossiga|prosseguir|vai|manda ver|feito)$/;

const RECUSA_CARIMBO =
    "🚫 RV-04 — carimbo não é decisão. A contribuição precisa dizer, nas palavras do pesquisador, " +
    "o que ele avaliou e o que decidiu; \"ok\" ou \"pode seguir\" não sustentam que houve supervisão humana.";

function normalizarFala(t: string): string {
    return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function artefatoExiste(projectDir: string, rel: string): boolean {
    if (!rel || rel.startsWith(ARTEFATO_NAO_DEFINIDO)) return false;
    const p = path.join(projectDir, rel);
    if (!fs.existsSync(p)) return false;
    return !rel.endsWith("/") || fs.readdirSync(p).length > 0;
}

/**
 * Grava a DECISÃO DO PESQUISADOR sobre uma etapa — o lado de ESCRITA da trava do RV-04 (DEBT-143).
 *
 * A trava (`podeAvancar`) existia desde 04/10/2026 e nada a alimentava pelo caminho legítimo:
 * `logDecision` não tinha chamador, nenhuma tool gravava decisão, e sob `estrito` a fase só
 * avançava editando o `project_state.json` à mão. Aqui a regra da trava é conferida NA ESCRITA:
 * a etapa tem de existir na trilha do método, e a contribuição tem de dizer o que foi avaliado
 * e decidido — carimbo é recusado. Se o artefato que encerra a etapa já está gravado, a fase
 * avança agora, como a tool da etapa faria com a decisão já registrada.
 *
 * Com `condicao` (DEBT-142), grava a RESPOSTA do pesquisador a uma condição que o método declara
 * — o caminho pelo qual "o projeto responde". A resposta tem de ser uma das opções do método, com
 * a mesma exigência de contribuição; é gravada na etapa em que o método faz a pergunta, e não
 * destrava nem avança a etapa: responder a condição não é decidir sobre a etapa.
 *
 * O que esta função NÃO garante, e não pode: que as palavras sejam do pesquisador. Ela torna a
 * decisão visível, datada e atribuída; não impede quem tem acesso de escrever por ele.
 */
export function registrarDecisaoDoPesquisador(
    repoRoot: string,
    projectDir: string,
    entrada: { etapa?: string; contribuicao: string; decisao?: string; agente?: string; condicao?: string; resposta?: string },
): { ok: boolean; mensagem: string } {
    const state = ProjectStateService.read(projectDir);
    if (!state) return { ok: false, mensagem: "Sem project_state.json: não há onde registrar a decisão." };

    const trilha = lerTrilha(repoRoot, state.method);
    if (trilha.erros.length) {
        return { ok: false, mensagem: `A trilha do método "${state.method}" não pôde ser lida: ${trilha.erros.join("; ")}.` };
    }
    if (texto(entrada.condicao)) return responderCondicao(repoRoot, projectDir, state.method, entrada);
    if (!texto(entrada.etapa)) {
        return { ok: false, mensagem: "Informe a etapa sobre a qual o pesquisador decidiu — ou a condição que ele responde." };
    }
    const etapa = trilha.etapas.find((e) => e.id === texto(entrada.etapa));
    if (!etapa) {
        return {
            ok: false,
            mensagem: `A etapa "${entrada.etapa}" não existe na trilha do método "${state.method}". ` +
                `Etapas: ${trilha.etapas.map((e) => e.id).join(", ")}.`,
        };
    }
    if (!etapa.active) {
        return { ok: false, mensagem: `A etapa ${etapa.id} não se aplica ao método "${state.method}" (${etapa.note}): não há o que decidir nela.` };
    }

    const contribuicao = texto(entrada.contribuicao);
    if (!contribuicao || CARIMBO.test(normalizarFala(contribuicao))) return { ok: false, mensagem: RECUSA_CARIMBO };

    ProjectStateService.logDecision(projectDir, {
        phase: etapa.id,
        agent: texto(entrada.agente) || "coordinator",
        decision: texto(entrada.decisao) || contribuicao,
        por: "pesquisador",
        contribuicao,
    });

    // Decisão sobre etapa já passada é registro, não retrocesso: a fase só anda para a frente.
    const ordem = (id: string) => trilha.etapas.findIndex((e) => e.id === id);
    const atrasada = ordem(etapa.id) < ordem(state.phase);
    if (artefatoExiste(projectDir, etapa.closes_with) && !atrasada) {
        const gate = ProjectStateService.podeAvancar(projectDir, etapa.id);
        if (gate.ok) ProjectStateService.setPhase(projectDir, etapa.id);
        return { ok: true, mensagem: `✅ Decisão do pesquisador registrada na etapa ${etapa.id} — ${etapa.name}. O artefato da etapa já existe: a fase avançou para ${etapa.id}.` };
    }
    if (atrasada) {
        return { ok: true, mensagem: `✅ Decisão do pesquisador registrada na etapa ${etapa.id} — ${etapa.name}. O projeto já está em ${state.phase}: a fase não volta.` };
    }
    return {
        ok: true,
        mensagem: `✅ Decisão do pesquisador registrada na etapa ${etapa.id} — ${etapa.name}. ` +
            `O artefato que a encerra (${etapa.closes_with}) ainda não existe: a fase avança quando a tool da etapa o gravar.`,
    };
}

/**
 * A resposta do projeto a uma condição do método (DEBT-142). Confere NA ESCRITA: a condição
 * existe no método, a resposta é uma das opções que ele declara, e a contribuição não é carimbo.
 * Grava a opção como o método a escreve, não como chegou digitada.
 */
function responderCondicao(
    repoRoot: string,
    projectDir: string,
    metodo: string,
    entrada: { etapa?: string; contribuicao: string; decisao?: string; agente?: string; condicao?: string; resposta?: string },
): { ok: boolean; mensagem: string } {
    const { condicoes, erros } = lerCondicoes(repoRoot, metodo);
    const id = texto(entrada.condicao);
    const cond = condicoes.find((c) => c.id === id);
    if (!cond) {
        const porque = erros.length ? ` Condições ilegíveis no manifest: ${erros.join("; ")}.` : "";
        return {
            ok: false,
            mensagem: `O método "${metodo}" não declara a condição "${id}". ` +
                (condicoes.length ? `Condições declaradas: ${condicoes.map((c) => c.id).join(", ")}.` : "Ele não declara condição alguma.") + porque,
        };
    }
    if (texto(entrada.etapa) && texto(entrada.etapa) !== cond.etapa) {
        return { ok: false, mensagem: `A condição "${cond.id}" é perguntada pelo método na etapa ${cond.etapa}, não em ${texto(entrada.etapa)}.` };
    }
    const opcao = cond.opcoes.find((o) => normalizarFala(o) === normalizarFala(texto(entrada.resposta)));
    if (!opcao) {
        return {
            ok: false,
            mensagem: `"${texto(entrada.resposta)}" não é resposta da condição "${cond.id}" (${cond.pergunta}). ` +
                `O método declara: ${cond.opcoes.map((o) => `"${o}"`).join(", ")}.`,
        };
    }
    const contribuicao = texto(entrada.contribuicao);
    if (!contribuicao || CARIMBO.test(normalizarFala(contribuicao))) return { ok: false, mensagem: RECUSA_CARIMBO };

    ProjectStateService.logDecision(projectDir, {
        phase: cond.etapa,
        agent: texto(entrada.agente) || "coordinator",
        decision: texto(entrada.decisao) || `${cond.pergunta} — ${opcao}`,
        por: "pesquisador",
        contribuicao,
        condicao: { id: cond.id, resposta: opcao },
    });
    return {
        ok: true,
        mensagem: `✅ Resposta do pesquisador à condição "${cond.id}" registrada: ${opcao}. ` +
            `Os itens que o método condiciona a ela seguem esta resposta em check_standard_coverage com o projectPath. ` +
            `Não é a decisão sobre a etapa ${cond.etapa}: a etapa continua precisando dela para avançar.`,
    };
}
