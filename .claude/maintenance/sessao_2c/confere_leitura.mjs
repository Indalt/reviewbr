// Sessão 2c, item 3 — confere uma leitura documentada do PRISMA-S do prisma-sr (primeira ou segunda):
// cada trecho pelo conferidor de literalidade (leitura_documentada.ts, o mesmo que o relatório usa), e cada
// subitem contra a trilha do prisma-sr (subitensDaSpec). Só lê. Chama o dist recompilado.
// Uso: node confere_leitura.mjs <arquivo.json>
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const R = path.resolve(aqui, "..", "..", "..");
const dist = (f) => import(pathToFileURL(path.join(R, "reviewbr", "reviewbr-mcp", "dist", "services", f)).href);
const { StandardsService } = await dist("standards.js");
const { conferirTrecho } = await dist("leitura_documentada.js");
const { subitensDaSpec } = await dist("method_trail.js");

const arq = path.resolve(aqui, process.argv[2]);
const leitura = JSON.parse(fs.readFileSync(arq, "utf-8"));
const std = StandardsService.read(R, "prisma-s");
const trilha = subitensDaSpec(R, "prisma-sr");
let n = 0; const problemas = [];
const itens = leitura.itens.map((i) => i.item);
if (JSON.stringify(itens) !== JSON.stringify(std.items.map((i) => i.id))) problemas.push(`itens fora da ordem ou faltando: ${itens.join(",")}`);
for (const i of leitura.itens) {
    if (!["completa", "parcial", "nenhuma"].includes(i.cobertura)) problemas.push(`${i.item}: cobertura "${i.cobertura}"`);
    for (const p of i.ponteiros) {
        n++;
        if (!trilha.has(p.subitem)) problemas.push(`${i.item}→${p.subitem}: subitem que a trilha do prisma-sr não define`);
        const v = conferirTrecho(std, i.item, p.trecho);
        if (!v.aceito) problemas.push(`${i.item}→${p.subitem}: ${v.motivo} — "${p.trecho}"`);
    }
}
console.log(`${path.basename(arq)}: ${n} ponteiros em ${leitura.itens.length} itens; ${problemas.length} problema(s)`);
for (const p of problemas) console.log("  " + p);
process.exitCode = problemas.length ? 1 : 0;
