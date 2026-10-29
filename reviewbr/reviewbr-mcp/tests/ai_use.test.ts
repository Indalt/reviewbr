import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { AI_USE, checarUsoDeIA } from "../src/registry/ai_use.js";
import { StandardsService } from "../src/services/standards.js";

const MCP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = path.resolve(MCP, "..", "..");

/**
 * DEBT-131 — o sistema usa IA e precisa declarar sob que norma.
 *
 * O RAISE 3 classifica por tarefa E POR CLASSE DE FERRAMENTA: rule-based, unsupervised,
 * supervised ML, generative LLM, agentic AI, hybrid, conversational. Não é norma de LLM —
 * é norma de automação, e o ReviewBR usa pelo menos quatro modos.
 */
describe("RAISE 3 — o uso de IA é classificado, e o não classificado não roda", () => {
    it("tool sem automação passa sem ruído", () => {
        const r = checarUsoDeIA("compute_flow_counts", false);
        expect(r.blocked).toBe(false);
        expect(r.message).toBe("");
    });

    it("FAIL-CLOSED: automação não classificada BLOQUEIA", () => {
        // É o ponto do mapa. O pesquisador declarou que "podem existir outros modos de usar
        // IA que ainda não sei" — um mapa que libera por omissão não protege do desconhecido.
        const r = checarUsoDeIA("tool_que_ninguem_classificou", true);
        expect(r.blocked).toBe(true);
        expect(r.message).toMatch(/NÃO CLASSIFICADO/);
    });

    it("C3 passa declarando a exigência de limiar pré-especificado", () => {
        const r = checarUsoDeIA("screen_candidates", true);
        expect(r.blocked).toBe(false);
        expect(r.use?.category).toBe("C3");
        expect(r.message).toMatch(/VALIDAÇÃO DENTRO DA REVISÃO/);
        expect(r.message).toMatch(/pré-especificado/);
    });

    it("C1 passa; C2 declara que exige leitura humana da saída inteira", () => {
        expect(checarUsoDeIA("deduplicate_dataset", true).use?.category).toBe("C1");
        const c2 = checarUsoDeIA("translate_document", true);
        expect(c2.blocked).toBe(false);
        expect(c2.message).toMatch(/VERIFICAÇÃO HUMANA/);
    });

    it("a classe se conclui do CÓDIGO, não do nome: rag_query é BM25 léxico, não LLM", () => {
        // Classificar pelo nome o poria em C3 indevidamente. O sistema já registra de si
        // que "rag_query soa semântico e é BM25 léxico" (system-audit/SKILL.md).
        const r = checarUsoDeIA("rag_query", true);
        expect(r.use?.tool_class).toBe("rule-based");
        expect(r.use?.category).toBe("C1");
    });

    it("C5 BLOQUEIA sempre, citando a norma", () => {
        // Nenhuma tool é C5 hoje; a trava precisa existir antes de alguém criar uma.
        const falsa = { ...AI_USE.screen_candidates, category: "C5" as const };
        const salvo = AI_USE.sintetizar_entre_estudos;
        (AI_USE as any).sintetizar_entre_estudos = falsa;
        const r = checarUsoDeIA("sintetizar_entre_estudos", true);
        if (salvo === undefined) delete (AI_USE as any).sintetizar_entre_estudos;
        expect(r.blocked).toBe(true);
        expect(r.message).toMatch(/NÃO ACEITÁVEL/);
    });
});

/**
 * A varredura. Sem ela o mapa depende de alguém lembrar de cadastrar — e é exatamente a
 * classe de falha que o sistema registra de si desde o começo.
 */
describe("varredura — nenhuma rota de automação fica fora do mapa", () => {
    function arquivos(dir: string): string[] {
        const out: string[] = [];
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            const p = path.join(dir, e.name);
            if (e.isDirectory()) out.push(...arquivos(p));
            else if (e.name.endsWith(".ts")) out.push(p);
        }
        return out;
    }

    it("todo arquivo que aciona provedor de LLM tem tool mapeada", () => {
        const SRC = path.join(MCP, "src");
        const comLlm = arquivos(SRC).filter((f) => {
            const t = fs.readFileSync(f, "utf-8");
            return /createDefaultProvider|LLMProvider|generateContent/.test(t);
        }).map((f) => path.relative(SRC, f).replace(/\\/g, "/"));

        // Controle positivo: a varredura tem de ACHAR as rotas conhecidas. Se o regex
        // quebrar e devolver zero, o teste passaria sem verificar nada.
        expect(comLlm.length).toBeGreaterThan(0);
        expect(comLlm).toContain("services/llm_provider.ts");

        // Cada arquivo com LLM precisa ter ao menos uma tool sua no mapa. A ligação é por
        // serviço, não por arquivo, então a conferência é de COBERTURA: há entrada de
        // categoria generative-llm no mapa para cada serviço que aciona o provedor.
        const porServico: Record<string, string[]> = {
            "services/screen.ts": ["screen_candidates"],
            "services/batch_processor.ts": ["batch_db_screen", "batch_llm_extract"],
            "services/llm_provider.ts": [], // a fábrica em si não é tool
        };
        const semMapa = comLlm.filter((f) => {
            const tools = porServico[f];
            if (tools === undefined) return true;            // serviço novo, não previsto
            return tools.some((t) => !AI_USE[t]);            // tool prevista e não mapeada
        });
        expect(semMapa, `Serviço aciona LLM e não tem tool classificada no RAISE: ${semMapa.join(", ")}`).toEqual([]);
    });

    it("toda categoria do mapa existe na Tabela 2 do raise-3.json", () => {
        const std = StandardsService.read(REPO, "raise-3");
        expect(std, "raise-3.json precisa estar assimilado").not.toBeNull();

        const linhas = new Set(std!.items.map((i) => i.id));
        const orfas: string[] = [];
        for (const [tool, uso] of Object.entries(AI_USE)) {
            // `raise_row` pode citar mais de uma linha (ex.: "T28/T29").
            for (const row of uso.raise_row.split("/")) {
                if (!linhas.has(row.trim())) orfas.push(`${tool} → ${row}`);
            }
        }
        expect(orfas, `Linha da Tabela 2 citada e inexistente no padrão: ${orfas.join(", ")}`).toEqual([]);
    });

    it("toda entrada do mapa declara classe, categoria e justificativa", () => {
        const incompletas = Object.entries(AI_USE)
            .filter(([, u]) => !u.task.trim() || !u.tool_class || !u.category || !u.nota.trim())
            .map(([t]) => t);
        expect(incompletas).toEqual([]);
    });
});
