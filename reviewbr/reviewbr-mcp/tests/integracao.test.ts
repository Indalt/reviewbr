import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const MCP = path.resolve(here, "..");
const REPO = path.resolve(MCP, "..", "..");
const CLAUDE = path.join(REPO, ".claude");

/**
 * TESTE DE INTEGRAÇÃO — contra a classe de defeito que atravessa o sistema inteiro:
 * **capacidade construída, nada a invoca no momento certo.**
 *
 * O próprio sistema conta essa falha como passado na skill de gates ("validate_prisma_flow já
 * existia e nunca era chamada") e a auditoria a encontrou em toda camada: o RBAC de runtime
 * sem call site, `logDecision` sem escritor, `updateScreening` sem chamador, o array `gates`
 * do manifest sem leitor, tools no frontmatter que nenhuma instrução invoca.
 *
 * Auditoria acha isso uma vez e decai. Teste falha no instante em que alguém desliga um fio —
 * e é por isso que estas verificações são teste, não relatório.
 *
 * TODA exceção é declarada aqui, com motivo. Lista de exceção sem justificativa é o mesmo
 * vício em outra forma.
 */

function arquivosTs(dir: string, out: string[] = []): string[] {
    if (!fs.existsSync(dir)) return out;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) arquivosTs(p, out);
        else if (e.name.endsWith(".ts") && !e.name.endsWith(".d.ts") && !e.name.endsWith(".tmp")) out.push(p);
    }
    return out;
}

const SRC = arquivosTs(path.join(MCP, "src"));
const CORPO = new Map(SRC.map((f) => [f, fs.readFileSync(f, "utf-8")]));
const TODO_SRC = [...CORPO.values()].join("\n");

const agentes = fs.existsSync(path.join(CLAUDE, "agents"))
    ? fs.readdirSync(path.join(CLAUDE, "agents")).filter((f) => f.endsWith(".md"))
    : [];
const skills = fs.existsSync(path.join(CLAUDE, "skills"))
    ? fs.readdirSync(path.join(CLAUDE, "skills")).map((d) => path.join(CLAUDE, "skills", d, "SKILL.md")).filter(fs.existsSync)
    : [];
const PROSA = [
    ...agentes.map((f) => fs.readFileSync(path.join(CLAUDE, "agents", f), "utf-8")),
    ...skills.map((f) => fs.readFileSync(f, "utf-8")),
].join("\n");

// ─────────────────────────────────────────────────────────────────────────────

describe("integração 1 — método público sem nenhum chamador externo", () => {
    /**
     * Exceções, cada uma com motivo. São métodos legitimamente não chamados de fora.
     */
    const PERMITIDO = new Set([
        // Ponto de entrada de fachada: quem chama é o handler da tool, por outro nome.
        "implementedDirs", "standardFiles",   // privados, usados só dentro da própria classe
        "standardsDir",                        // idem
        "loadBrOnly", "loadFromFile",          // carregadores alternativos do catálogo de repositórios
        "getProjectQuestions",                 // usado pelo fluxo de entrevista do designer, em prosa

        // DEBT-102 — público de propósito, e chamado só de dentro da própria classe. A guarda
        // de qualidade da extração é REGRA METODOLÓGICA (o que conta como "o estudo foi
        // lido"), não detalhe de implementação: precisa ser testável de frente, e não por uma
        // porta que o compilador fechou. Coberto por tests/pdf_guarda_qualidade.test.ts.
        "avaliarExtracao",

        // ⚠️ MORTOS CONHECIDOS, cada um com achado aberto. Estão aqui para que o teste falhe
        // sobre código morto NOVO, sem ficar vermelho por dívida já registrada e decidida.
        // Remover da lista quando o achado for tratado — é o que liga o teste ao backlog.
        "validateAction", "validateToolAccess", "getAuthorizedTools",  // DEBT-041: RBAC de runtime sem call site
        "exists", "setStatus", "setControlLevel", "isLocked", // DEBT-037/073: escritores de project_state
        // `logDecision` saiu desta lista em 17/10/2026: ganhou chamador (record_researcher_decision, DEBT-143).
    ]);

    it("todo método estático público é chamado de algum outro arquivo", () => {
        const mortos: string[] = [];
        for (const [f, s] of CORPO) {
            const rel = path.relative(MCP, f).replace(/\\/g, "/");
            if (!rel.includes("services/") && !rel.includes("registry/")) continue;
            for (const m of s.matchAll(/^\s*(?:public\s+)?static\s+(?:async\s+)?([a-zA-Z][\w]*)\s*\(/gm)) {
                const nome = m[1];
                if (PERMITIDO.has(nome)) continue;
                const usos = [...CORPO.entries()]
                    .filter(([g]) => g !== f)
                    .reduce((n, [, o]) => n + (o.match(new RegExp("\\." + nome + "\\s*\\(", "g")) ?? []).length, 0);
                if (usos === 0) mortos.push(`${path.basename(f)}::${nome}`);
            }
        }
        expect(
            mortos,
            "Método público sem chamador. Ou religue, ou remova, ou declare a exceção com motivo em PERMITIDO."
        ).toEqual([]);
    });
});

describe("integração 2 — tool registrada que nenhuma instrução invoca", () => {
    /**
     * Uma tool no mapa de papéis e no frontmatter, que nenhum corpo de agente nem skill
     * manda usar, é `validate_prisma_flow` de novo: existe e ninguém chama no momento certo.
     */
    const SEM_PROSA_OK = new Set([
        // Chamadas internamente por outras tools ou pelo boot; não há instrução de agente.
        "heal_repositories",        // acionada pelo próprio validate_repository quando falha
    ]);

    it("toda tool exposta é citada em algum corpo de agente ou skill", () => {
        const index = fs.readFileSync(path.join(MCP, "src", "index.ts"), "utf-8");
        const tools = [...index.matchAll(/server\.tool\(\s*"([a-z_0-9]+)"/g)].map((m) => m[1]);
        expect(tools.length).toBeGreaterThan(30); // controle positivo do método de extração

        const orfas = tools.filter((t) => {
            if (SEM_PROSA_OK.has(t)) return false;
            // o frontmatter não conta: é declaração de permissão, não instrução de uso
            const semFrontmatter = PROSA.replace(/^tools:.*$/gm, "");
            return !semFrontmatter.includes(t);
        });

        expect(
            orfas,
            "Tool que nenhuma instrução manda usar. É o padrão do `validate_prisma_flow`: a ferramenta existe e ninguém a chama."
        ).toEqual([]);
    });
});

describe("integração 3 — agnosticidade de DOMÍNIO: nenhum tema no código do sistema", () => {
    /**
     * O sistema declara agnosticismo METODOLÓGICO em três lugares (`methodology-router`, a
     * spec do `prisma-sr`). Agnosticismo de DOMÍNIO — de tema — nunca foi declarado, e por
     * isso nunca foi verificado.
     *
     * A contaminação entrou pelo caminho previsível: o commit que validou o pipeline
     * end-to-end usou projetos reais de um tema, e o tema vazou para exemplos de tool, para
     * mensagens de auditor e para dois scripts executáveis em `src/`. Não foi descuido — é o
     * resíduo de validar com caso real, e é justamente o que ninguém pega sem teste.
     *
     * Exemplo em `describe()` de tool NÃO é comentário: é contexto que o modelo lê a cada
     * chamada. Se toda ilustração de busca é do mesmo domínio, o prior do agente é empurrado
     * para lá — e o sistema que promete servir a qualquer pesquisa passa a sugerir uma.
     */
    const TEMAS = /\b(caju|cajuína|cajuina|cashew|anacardium|cajueiro)\b/i;

    /** Exceções declaradas, com motivo. Lista sem justificativa é o mesmo vício. */
    const PERMITIDO_TEMA = new Set<string>([
        // DEBT-103: dois scripts com projectPath e query HARD-CODED num único tema. Não são
        // exemplo: são executáveis, e vão para o `dist`. Ninguém os importa. Removê-los é
        // decisão do pesquisador (pode haver uso manual que nenhum import revela), não
        // conserto de rotina — por isso estão aqui em vez de a suíte ficar vermelha.
        // Remover desta lista é o que fecha o DEBT-103.
        "src/run_search_pubmed.ts",
        "src/run_search_repository.ts",
    ]);

    it("nenhum arquivo de src/ cita termo de domínio específico", () => {
        const sujos: string[] = [];
        for (const [f, s] of CORPO) {
            const rel = path.relative(MCP, f).replace(/\\/g, "/");
            if (PERMITIDO_TEMA.has(rel)) continue;
            const linhas = s.split("\n")
                .map((l, i) => ({ l, i: i + 1 }))
                .filter(({ l }) => TEMAS.test(l));
            for (const { i } of linhas) sujos.push(`${rel}:${i}`);
        }
        expect(
            sujos,
            "Tema de pesquisa dentro do código do sistema. Troque por placeholder neutro " +
            "(<termo>, <sinônimo>, <desfecho>) ou declare a exceção com motivo."
        ).toEqual([]);
    });

    it("o padrão de busca funciona — controle positivo", () => {
        // sem isto, um regex quebrado devolveria lista vazia e o teste passaria sempre
        expect(TEMAS.test("estudo sobre cashew e antioxidantes")).toBe(true);
        expect(TEMAS.test("estudo sobre metodologia de revisão")).toBe(false);
    });
});

describe("integração 4 — gate declarado no manifest precisa existir como tool", () => {
    it("toda tool citada em `gates` está registrada", () => {
        const dir = path.join(CLAUDE, "methodologies");
        if (!fs.existsSync(dir)) return;
        const index = fs.readFileSync(path.join(MCP, "src", "index.ts"), "utf-8");
        const registradas = new Set([...index.matchAll(/server\.tool\(\s*"([a-z_0-9]+)"/g)].map((m) => m[1]));

        const quebrados: string[] = [];
        for (const m of fs.readdirSync(dir)) {
            const mp = path.join(dir, m, "manifest.json");
            if (!fs.existsSync(mp)) continue;
            const man = JSON.parse(fs.readFileSync(mp, "utf-8"));
            for (const g of man.gates ?? []) {
                if (g.tool && !registradas.has(g.tool)) quebrados.push(`${m}: gate ${g.rule} → tool inexistente "${g.tool}"`);
            }
        }
        expect(quebrados, "Gate apontando para tool que não existe é regra morta.").toEqual([]);
    });
});

describe("integração 4 — o estado da manutenção é alcançável a partir do ponto de entrada", () => {
    /**
     * O requisito declarado pelo pesquisador: "este chat é descartável; o sistema não é".
     * Documento de estado que o ponto de entrada não cita é documento que ninguém lê.
     */
    it("todo documento de estado é ALCANÇÁVEL a partir do maintainer, por caminho transitivo", () => {
        /**
         * Mera menção não basta, e esta foi uma falha real deste teste: `ORDEM_correcoes.md`
         * passava porque o `system_debt.json` o citava no texto de um achado. Mas a sessão
         * nova segue a rota do `maintainer.md` — e nunca chegaria lá. Uma tabela de
         * dependências que o executor não lê é pior que nenhuma: cria a ilusão de que a
         * ordem está governada.
         *
         * Alcançabilidade = partir do agente e seguir só as referências que um leitor
         * seguiria, documento a documento, até o ponto fixo.
         */
        const dir = path.join(CLAUDE, "maintenance");
        if (!fs.existsSync(dir)) return;
        const docs = fs.readdirSync(dir).filter((f) => /\.(md|json|py)$/.test(f));

        const alcancados = new Set<string>();
        let fronteira = [fs.readFileSync(path.join(CLAUDE, "agents", "maintainer.md"), "utf-8")];
        for (let volta = 0; volta < 6 && fronteira.length; volta++) {
            const proxima: string[] = [];
            for (const texto of fronteira) {
                for (const f of docs) {
                    if (alcancados.has(f) || !texto.includes(f)) continue;
                    alcancados.add(f);
                    try { proxima.push(fs.readFileSync(path.join(dir, f), "utf-8")); } catch { /* binário */ }
                }
            }
            fronteira = proxima;
        }

        const inalcancaveis = docs.filter((f) => !alcancados.has(f));
        expect(
            inalcancaveis,
            "Documento de estado que a sessão nova NUNCA encontraria seguindo a rota do maintainer.md."
        ).toEqual([]);
    });

    it("todo documento de `.claude/maintenance/` é citado pelo agente ou por outro documento dele", () => {
        const dir = path.join(CLAUDE, "maintenance");
        if (!fs.existsSync(dir)) return;
        const docs = fs.readdirSync(dir).filter((f) => f.endsWith(".md") || f.endsWith(".json") || f.endsWith(".py"));
        const maintainer = fs.readFileSync(path.join(CLAUDE, "agents", "maintainer.md"), "utf-8");
        const corpoDocs = docs.map((f) => {
            try { return fs.readFileSync(path.join(dir, f), "utf-8"); } catch { return ""; }
        }).join("\n");
        // O universo inclui as SKILLS e as metodologias. Uma falha do primeiro desenho deste
        // teste foi buscar só no agente e nos próprios documentos, e acusar RETOMAR.md de
        // órfão quando três skills o citavam. Controle positivo do instrumento antes de
        // acusar o sistema — a mesma regra que a skill de auditoria impõe.
        const metodologias = fs.existsSync(path.join(CLAUDE, "methodologies"))
            ? fs.readdirSync(path.join(CLAUDE, "methodologies"))
                .flatMap((d) => ["manifest.json", "spec.md"].map((x) => path.join(CLAUDE, "methodologies", d, x)))
                .filter(fs.existsSync).map((x) => fs.readFileSync(x, "utf-8")).join("\n")
            : "";
        const universo = [maintainer, corpoDocs, TODO_SRC, PROSA, metodologias].join("\n");

        const orfaos = docs.filter((f) => !universo.includes(f));
        expect(
            orfaos,
            "Documento de estado que ninguém referencia. Uma sessão nova nunca vai abri-lo."
        ).toEqual([]);
    });

    it("todo caminho de arquivo citado pelo maintainer existe de fato", () => {
        const md = fs.readFileSync(path.join(CLAUDE, "agents", "maintainer.md"), "utf-8");
        const caminhos = [...md.matchAll(/`(\.claude\/[\w./-]+|reviewbr\/[\w./-]+)`/g)].map((m) => m[1]);
        const faltando = caminhos.filter((c) => !fs.existsSync(path.join(REPO, c)));
        expect(faltando, "O agente manda ler arquivo que não existe.").toEqual([]);
    });
});
