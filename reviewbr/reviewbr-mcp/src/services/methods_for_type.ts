import * as fs from "node:fs";
import * as path from "node:path";
import { errosDaTrilha, lerTrilha } from "./method_trail.js";
import { MethodologyCatalogService } from "./methodology_catalog.js";
import { StandardsService } from "./standards.js";

/**
 * methods_for_type — o tipo de pesquisa FILTRA os métodos assimilados; não os substitui.
 *
 * Antes, `mapMethod` era um `switch` com `default: prisma-sr`: dos sete tipos oferecidos ao
 * pesquisador, cinco caíam no ramo de escape e recebiam a trilha da revisão sistemática
 * PRISMA sem que nada dissesse. O `method` resultante entra no `project_state.json` e é ele
 * que produz a frase de conformidade do `protocol.md` — então uma revisão integrativa saía
 * declarando aderência a PRISMA 2020 + PRISMA-S, e isso seguia para o registro e para o
 * manuscrito.
 *
 * A regra agora é a do desenho: **o tipo limita as trilhas**. Quem declara que um método
 * serve a um tipo é o próprio método, no `serves_research_types` do manifest — dado que a
 * metodologia traz consigo, não lista escrita no código. Instalar método novo deixa de exigir
 * edição deste arquivo.
 *
 * E FALHA FECHADA: tipo sem método assimilado é recusa com explicação, nunca substituição.
 * Oferecer sete escolhas sustentadas por duas trilhas é o mesmo erro do rótulo "ML validado" —
 * emprestar ao trabalho uma autoridade metodológica que não foi executada.
 */

export interface MetodoAssimilado {
    id: string;
    name: string;
    /** Framework de pergunta que o método declara por padrão (PICOS, PCC, livre…). */
    framework: string;
    /** Padrões que o método declara cumprir (`conformance.standards`) — o elo com o catálogo. */
    padroes: string[];
    /** Vazio = pronto para uso. Preenchido = esqueleto do scaffold ainda por completar. */
    incompleto: string[];
}

function dirMetodologias(repoRoot: string): string {
    return path.join(repoRoot, ".claude", "methodologies");
}

/**
 * O que separa um metodo PRONTO de um esqueleto do `scaffold_methodology`.
 *
 * O criterio e ESTRUTURAL, nao textual: o scaffold grava "[TBD]" nos campos das etapas de
 * `phases`, e e isso que se detecta — junto com o resto do que torna a trilha conduzivel
 * (`errosDaTrilha`: lista de etapas, papel que existe, artefato de encerramento declarado).
 *
 * A primeira versao deste checador procurava a string "[TBD]" no manifest e na spec inteiros,
 * e reprovava as duas metodologias reais — porque "[TBD]" aparece nelas como DOCUMENTACAO da
 * convencao da RV-03 ("campos sem dado recebem [TBD] e sao sinalizados"), e dentro do texto de
 * um gate. Procurar a palavra onde ela e explicada, e nao onde ela e placeholder, e falso
 * positivo — a mesma classe de erro que o controle positivo existe para pegar.
 */
function pendencias(dir: string, manifest: any): string[] {
    const agentes = path.join(dir, "..", "..", "agents");
    const faltas: string[] = errosDaTrilha(manifest?.phases, agentes);

    const spec = manifest?.spec;
    if (!spec || !fs.existsSync(path.join(dir, String(spec)))) faltas.push("spec.md ausente");

    return faltas;
}

/** Métodos assimilados que DECLARAM servir a este tipo de pesquisa. Lê o disco a cada
 *  chamada: o que vale é o que está instalado agora, não o que alguém lembrou de listar. */
export function metodosParaTipo(repoRoot: string, researchType: string): MetodoAssimilado[] {
    const base = dirMetodologias(repoRoot);
    if (!fs.existsSync(base)) return [];
    const achados: MetodoAssimilado[] = [];
    for (const e of fs.readdirSync(base, { withFileTypes: true })) {
        if (!e.isDirectory()) continue;
        const dir = path.join(base, e.name);
        const mp = path.join(dir, "manifest.json");
        if (!fs.existsSync(mp)) continue;
        let man: any;
        try { man = JSON.parse(fs.readFileSync(mp, "utf-8")); } catch { continue; }
        const serve: unknown = man?.serves_research_types;
        if (!Array.isArray(serve) || !serve.includes(researchType)) continue;
        const stds: unknown = man?.conformance?.standards;
        achados.push({
            id: String(man.id ?? e.name),
            name: String(man.name ?? e.name),
            framework: String(man.default_question_framework ?? "livre"),
            padroes: Array.isArray(stds) ? stds.filter((s): s is string => typeof s === "string") : [],
            incompleto: pendencias(dir, man),
        });
    }
    return achados;
}

/** Todos os tipos que algum método assimilado declara atender — para a recusa poder ensinar
 *  o que existe, em vez de só dizer não. */
export function tiposAtendidos(repoRoot: string): string[] {
    const base = dirMetodologias(repoRoot);
    if (!fs.existsSync(base)) return [];
    const tipos = new Set<string>();
    for (const e of fs.readdirSync(base, { withFileTypes: true })) {
        if (!e.isDirectory()) continue;
        const mp = path.join(base, e.name, "manifest.json");
        if (!fs.existsSync(mp)) continue;
        try {
            const man = JSON.parse(fs.readFileSync(mp, "utf-8"));
            for (const t of man?.serves_research_types ?? []) tipos.add(String(t));
        } catch { /* manifest ilegível não contribui — e não derruba os outros */ }
    }
    return [...tipos].sort();
}

/**
 * Resolve o método de um tipo de pesquisa. LANÇA quando não há o que resolver.
 *
 * Lançar é a parte importante: o chamador cria o projeto e grava o `method` no estado, e um
 * valor inventado ali contamina tudo o que vem depois sem deixar rastro de onde veio.
 */
export function escolherMetodo(repoRoot: string, researchType: string, escolhido?: string): { method: string; framework: string } {
    const servem = metodosParaTipo(repoRoot, researchType);
    const prontos = servem.filter((m) => m.incompleto.length === 0);

    // A escolha do pesquisador, quando informada, é conferida — não obedecida às cegas: o
    // método tem de servir ao tipo e estar pronto. Sem isto, apresentar dois métodos na escolha
    // (DEBT-095) levaria a uma criação de projeto que não tem como receber a escolha.
    if (escolhido) {
        const m = prontos.find((x) => x.id === escolhido);
        if (m) return { method: m.id, framework: m.framework };
        const incompleto = servem.find((x) => x.id === escolhido);
        if (incompleto) {
            throw new Error(`O método "${escolhido}" serve a "${researchType}", mas não está pronto: falta ${incompleto.incompleto.join(", ")}.`);
        }
        throw new Error(
            `O método "${escolhido}" não serve ao tipo "${researchType}". ` +
            `Servem hoje: ${prontos.map((x) => x.id).join(", ") || "(nenhum)"}.`
        );
    }

    if (prontos.length === 1) return { method: prontos[0].id, framework: prontos[0].framework };

    if (prontos.length > 1) {
        // Mais de um método serve: a escolha é do pesquisador (RV-04), não do código. Enquanto
        // a tool não receber a escolha, recusar é mais honesto que eleger um por ordem de pasta.
        const lista = prontos.map((m) => `  • ${m.id} — ${m.name} (framework ${m.framework})`).join("\n");
        throw new Error(
            `Mais de um método assimilado serve a "${researchType}". A escolha é do pesquisador, não do sistema:\n${lista}\n\n` +
            `Informe qual método assumir ao criar o projeto (parâmetro methodId de plan_research_protocol).`
        );
    }

    const incompletos = servem.filter((m) => m.incompleto.length > 0);
    if (incompletos.length) {
        const lista = incompletos.map((m) => `  • ${m.id}: falta ${m.incompleto.join(", ")}`).join("\n");
        throw new Error(
            `Há método declarado para "${researchType}", mas nenhum está pronto para uso:\n${lista}\n\n` +
            `Esqueleto do scaffold não conduz pesquisa: a trilha e o mapeamento para o padrão precisam ser ` +
            `escritos a partir da fonte oficial do método (trabalho de manutenção).`
        );
    }

    const atendidos = tiposAtendidos(repoRoot);
    throw new Error(
        `Nenhum método assimilado serve ao tipo "${researchType}".\n` +
        `Tipos atendidos hoje: ${atendidos.length ? atendidos.join(", ") : "(nenhum)"}.\n\n` +
        `O sistema NÃO substitui por outro método. Conduzir uma pesquisa por uma trilha que não é a do ` +
        `método escolhido faz o protocolo declarar conformidade com um padrão que não foi seguido — e esse ` +
        `protocolo vai para o registro e para o manuscrito. Para usar este tipo, assimile o método ` +
        `correspondente (scaffold_methodology e, depois, preencher a spec a partir da fonte oficial).`
    );
}

/** O `requires` de um padrão chega a 6 mil caracteres: corta e aponta onde está o resto. */
function resumir(texto: string, max: number): string {
    const t = texto.replace(/\s+/g, " ").trim();
    return t.length <= max ? t : `${t.slice(0, max).replace(/\s\S*$/, "")}…`;
}

function primeiraUrl(texto: string): string {
    return texto.match(/https?:\/\/[^\s)]+/)?.[0] ?? "[SEM URL DE FONTE]";
}

/**
 * O que o pesquisador vê NA ESCOLHA do método (DEBT-095).
 *
 * "O pesquisador pode não conhecer o método e poderia saber o que está escolhendo de fato."
 * O tipo FILTRA os métodos assimilados; o que se apresenta é cada MÉTODO, com a trilha que traz,
 * os padrões que declara e o que o catálogo diz dele — o que é, quando usar, o que exige, com a
 * fonte oficial. Tudo vem do dado: método sem entrada ligada no catálogo sai sem contexto, e
 * isso aparece em vez de ser preenchido pela prosa do agente.
 *
 * Tipo sem método pronto devolve `recusa` — o mesmo texto de `escolherMetodo`, para a escolha e
 * a criação do projeto nunca dizerem coisas diferentes.
 */
export function apresentarMetodos(repoRoot: string, researchType: string): { metodos: MetodoAssimilado[]; linhas: string[]; recusa: string } {
    const metodos = metodosParaTipo(repoRoot, researchType).filter((m) => m.incompleto.length === 0);
    if (!metodos.length) {
        let recusa = "";
        try { escolherMetodo(repoRoot, researchType); } catch (e: any) { recusa = e.message; }
        return { metodos, linhas: [], recusa };
    }

    const catalogo = MethodologyCatalogService.resolve(repoRoot, MethodologyCatalogService.read(repoRoot));
    const linhas: string[] = [];
    metodos.forEach((m, i) => {
        linhas.push(`**${i + 1}. \`${m.id}\` — ${m.name}** · framework da pergunta: ${m.framework}`);
        linhas.push(`- **Padrões que declara:** ${m.padroes.length ? StandardsService.describeStandards(repoRoot, m.padroes) : "[SEM PADRÃO DECLARADO]"}`);
        const trilha = lerTrilha(repoRoot, m.id);
        linhas.push(`- **Trilha:** ${trilha.etapas.map((e) => e.active ? `${e.id} ${e.name}` : `~~${e.id} ${e.name}~~ (não se aplica)`).join(" → ")}`);
        const ctx = MethodologyCatalogService.entradasDoMetodo(catalogo, m.id, m.padroes);
        if (!ctx.length) linhas.push(`- **Contexto do catálogo:** [SEM ENTRADA DO CATÁLOGO LIGADA A ESTE MÉTODO]`);
        for (const e of ctx) {
            linhas.push(`- **${e.name}** — ${resumir(e.what_it_is, 600)}`);
            linhas.push(`  - *Quando usar:* ${resumir(e.when_to_use, 600)}`);
            linhas.push(`  - *O que exige:* ${resumir(e.requires, 400)} (íntegra: \`query_methodology_catalog\` termo "${e.id}", detalhe=true)`);
            linhas.push(`  - *Fonte oficial:* ${primeiraUrl(e.source_url)}`);
        }
        linhas.push("");
    });
    if (metodos.length > 1) {
        linhas.push(`> Mais de um método serve a este tipo: a escolha é do pesquisador (RV-04), e o sistema não elege por ele. Ela é informada em \`plan_research_protocol\` (\`methodId\`).\n`);
    }
    return { metodos, linhas, recusa: "" };
}
