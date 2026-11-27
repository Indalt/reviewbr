/**
 * Linha 20 da FILA (decisão do Vicente de 26/11/2026): AGPL-3.0 para tudo, e o legado vai para
 * `old/` (fora do git) "sem esquecer que existem" — um arquivo rastreado lista o que foi.
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const MCP = path.resolve(__dirname, "..");
const PASTA_REVIEWBR = path.resolve(MCP, "..");
const RAIZ = path.resolve(PASTA_REVIEWBR, "..");

describe("licença única e legado listado (linha 20)", () => {
    it("os package.json declaram a mesma licença do LICENSE e do CITATION.cff", () => {
        const cff = fs.readFileSync(path.join(PASTA_REVIEWBR, "CITATION.cff"), "utf8");
        expect(cff).toMatch(/^license: AGPL-3\.0-only$/m);
        for (const p of [path.join(MCP, "package.json"), path.join(PASTA_REVIEWBR, "package.json")]) {
            expect(JSON.parse(fs.readFileSync(p, "utf8")).license, p).toBe("AGPL-3.0-only");
        }
    });

    it("o legado saiu da árvore e cada item está no arquivo rastreado", () => {
        const lista = fs.readFileSync(path.join(RAIZ, "LEGADO_em_old.md"), "utf8");
        const saiu = [
            "reviewbr/prismAId.go",
            "reviewbr/go.mod",
            "reviewbr/go.sum",
            "reviewbr/reviewbr-mcp/src/index.ts.tmp",
            "reviewbr/reviewbr-mcp/src/run_search_pubmed.ts",
            "reviewbr/reviewbr-mcp/src/run_search_repository.ts",
            "reviewbr-web/",
            "antigravity_conversas_export/",
            "claude-20261002T101131Z-1-001.zip",
        ];
        for (const rel of saiu) {
            expect(fs.existsSync(path.join(RAIZ, rel)), `${rel} ainda está na árvore`).toBe(false);
            expect(lista.includes(`\`${rel}\``), `${rel} não está em LEGADO_em_old.md`).toBe(true);
        }
        // nenhum .go fora de reviewbr/projects/
        const go: string[] = [];
        const varre = (d: string) => {
            for (const e of fs.readdirSync(d, { withFileTypes: true })) {
                if (["node_modules", "projects", "reviewbr-mcp", ".git"].includes(e.name)) continue;
                const p = path.join(d, e.name);
                if (e.isDirectory()) varre(p);
                else if (e.name.endsWith(".go")) go.push(path.relative(RAIZ, p));
            }
        };
        varre(PASTA_REVIEWBR);
        expect(go).toEqual([]);
    });
});
