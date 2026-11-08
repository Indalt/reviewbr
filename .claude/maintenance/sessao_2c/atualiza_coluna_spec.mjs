// Sessão 2c, item 3 — a coluna de mapeamento da spec do prisma-sr acompanha o covered_by do PRISMA-S do
// método (tests/prisma_s_scr_oficial.test.ts: as duas declarações não podem divergir). Para cada linha de
// subitem F… da spec, tira da última célula os itens S do PRISMA-S e põe os que o covered_by dá ao subitem,
// um a um; as referências ao PRISMA 2020 ("Item 7") ficam como estão. Célula que fica vazia vira "—".
// Mostra o diff de cada linha mudada; com --grava, reescreve a spec (mantém o fim de linha do arquivo).
// Uso: node atualiza_coluna_spec.mjs [--grava]
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const R = path.resolve(aqui, "..", "..", "..");
const { lerMapeamento } = await import(pathToFileURL(path.join(R, "reviewbr", "reviewbr-mcp", "dist", "services", "method_mapping.js")).href);
const SPEC = path.join(R, ".claude", "methodologies", "prisma-sr", "spec.md");
const bruto = fs.readFileSync(SPEC, "utf-8");
const eol = bruto.includes("\r\n") ? "\r\n" : "\n";

const inverso = new Map();
for (const [id, l] of lerMapeamento(R, "prisma-sr", "prisma-s").linhas) for (const s of l.covered_by) (inverso.get(s) ?? inverso.set(s, []).get(s)).push(id);
const ordemS = (a, b) => Number(a.slice(1)) - Number(b.slice(1));

let mudou = 0;
const linhas = bruto.split(eol).map((l) => {
    const m = l.match(/^\|\s*(F[0-9][A-Za-z0-9_.-]*)\s*\|/);
    if (!m) return l;
    const cel = l.split("|");
    const k = cel.length - 2;                        // última célula
    const tokens = cel[k].split("/").map((x) => x.trim()).filter((x) => x && x !== "—");
    const partes = tokens.filter((x) => !/^S\d+$/.test(x));
    const antes = tokens.filter((x) => /^S\d+$/.test(x)).sort(ordemS);
    const s = (inverso.get(m[1]) ?? []).slice().sort(ordemS);
    if (JSON.stringify(antes) === JSON.stringify(s)) return l;     // mesmos itens: não reordena
    const nova = (/^S\d+$/.test(tokens[0] ?? "") ? [...s, ...partes] : [...partes, ...s]).join(" / ") || "—";
    cel[k] = ` ${nova} `;
    const out = cel.join("|");
    console.log(`- ${l}\n+ ${out}`);
    mudou++;
    return out;
});
console.log(`${mudou} linha(s) da spec mudam.`);
if (process.argv.includes("--grava") && mudou) { fs.writeFileSync(SPEC, linhas.join(eol)); console.log("gravado:", path.relative(R, SPEC)); }
