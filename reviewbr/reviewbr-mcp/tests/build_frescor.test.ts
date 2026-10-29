import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const MCP = path.resolve(here, "..");
const REPO = path.resolve(MCP, "..", "..");

/**
 * O `.mcp.json` roda `dist/index.js`, não o `src/`. Um dist velho é um sistema que MENTE:
 * o código tem a tool, o servidor não a serve, e o agente que a chama recebe erro de tool
 * desconhecida no primeiro ato.
 *
 * Aconteceu de verdade: o dist ficou 2 meses e meio atrás do src (DEBT-006), expondo
 * `integrative_review` — que não existe mais no código — e nenhuma das 8 tools do mantenedor.
 * O agente de manutenção era inoperante e nada acusava.
 */
function listar(dir: string, out: string[] = []): string[] {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) listar(p, out);
        else if (e.name.endsWith(".ts") && !e.name.endsWith(".d.ts")) out.push(p);
    }
    return out;
}

const toolsDe = (arquivo: string) =>
    new Set([...fs.readFileSync(arquivo, "utf-8").matchAll(/server\.tool\(\s*"([a-z_0-9]+)"/g)].map((m) => m[1]));

describe("frescor do build — o que roda tem de ser o que está escrito", () => {
    const dist = path.join(MCP, "dist", "index.js");

    it("dist/index.js existe", () => {
        expect(fs.existsSync(dist)).toBe(true);
    });

    it("dist é mais novo que TODO arquivo de src/", () => {
        const tDist = fs.statSync(dist).mtimeMs;
        const atrasados = listar(path.join(MCP, "src"))
            .filter((f) => fs.statSync(f).mtimeMs > tDist)
            .map((f) => path.relative(MCP, f));
        expect(atrasados, `src mais novo que o dist — rode 'npm run build'`).toEqual([]);
    });

    it("o conjunto de tools do dist é IGUAL ao do src", () => {
        const noSrc = toolsDe(path.join(MCP, "src", "index.ts"));
        const noDist = toolsDe(dist);
        const faltando = [...noSrc].filter((t) => !noDist.has(t));
        const sobrando = [...noDist].filter((t) => !noSrc.has(t));
        expect(faltando, "tools no código que o servidor NÃO serve").toEqual([]);
        expect(sobrando, "tools que o servidor serve e não existem mais no código").toEqual([]);
    });

    it("o .mcp.json aponta para um arquivo que existe", () => {
        const p = path.join(REPO, ".mcp.json");
        if (!fs.existsSync(p)) return; // ambiente sem .mcp.json não falha
        const cfg = JSON.parse(fs.readFileSync(p, "utf-8"));
        for (const [nome, srv] of Object.entries<any>(cfg.mcpServers ?? {})) {
            const alvo = (srv.args ?? []).find((a: string) => a.endsWith(".js") || a.endsWith(".ts"));
            if (!alvo) continue;
            const abs = path.isAbsolute(alvo) ? alvo : path.join(REPO, alvo);
            expect(fs.existsSync(abs), `${nome} aponta para ${alvo}, que não existe`).toBe(true);
        }
    });
});
