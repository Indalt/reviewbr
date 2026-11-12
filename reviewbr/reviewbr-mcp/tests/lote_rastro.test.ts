import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { gravarExecucaoEmLote } from "../src/services/search_log.js";

// DEBT-030 — batch_keyword_screen, batch_llm_extract, batch_db_screen e translate_document não
// deixavam rastro nenhum — nem banco, nem disco — e descartavam o resultado por item. Duas decidem
// por LLM.
const MCP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INDEX = fs.readFileSync(path.join(MCP, "src", "index.ts"), "utf-8").replace(/\r\n/g, "\n");

function corpoDaTool(nome: string): string {
    const i = INDEX.indexOf(`\n    "${nome}",`);
    if (i < 0) throw new Error(`não achei a tool ${nome}`);
    const resto = INDEX.slice(i + 1);
    return resto.slice(0, resto.indexOf("\nserver.tool("));
}

describe("DEBT-030 — as tools em lote deixam rastro", () => {
    const dirs: string[] = [];
    afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });

    it("gravarExecucaoEmLote grava params e o resultado por item em logs/lote/", () => {
        const p = fs.mkdtempSync(path.join(os.tmpdir(), "lote-"));
        dirs.push(p);
        const resultados = [{ id: 1, title: "A", matched: true, llmClassification: "SIM: trata do tema" }];
        const f = gravarExecucaoEmLote(p, "batch_db_screen", { projectId: 3, criteria: "cajuína", useLlm: true }, resultados);
        expect(path.dirname(f)).toBe(path.join(p, "logs", "lote"));
        expect(JSON.parse(fs.readFileSync(f, "utf-8"))).toMatchObject({
            tool: "batch_db_screen", params: { criteria: "cajuína", useLlm: true }, resultados,
        });
    });

    for (const tool of ["batch_keyword_screen", "batch_llm_extract", "batch_db_screen", "translate_document"]) {
        it(`${tool} registra a execução (banco sempre; disco com projectPath)`, () => {
            const corpo = corpoDaTool(tool);
            expect(corpo).toContain(`registrarLote("${tool}"`);
            expect(corpo).toContain("projectPath: z.string().optional().describe(DESC_PROJECT_PATH_LOTE)");
        });
    }

    it("registrarLote grava no audit_logs do banco e, com projectPath, em logs/lote/", () => {
        const i = INDEX.indexOf("async function registrarLote(");
        const corpo = INDEX.slice(i, INDEX.indexOf("\n}\n", i));
        expect(corpo).toContain("dbService.logAuditEvent(");
        expect(corpo).toContain("gravarExecucaoEmLote(resolveProjectDir(params.projectPath)");
    });
});
