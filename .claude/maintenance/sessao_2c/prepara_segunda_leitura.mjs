// Sessão 2c, item 3 (DEBT-149, B2) — monta a ENTRADA da segunda leitura independente do PRISMA-S do
// prisma-sr: os 16 itens oficiais (tópico, seção, enunciado) e os campos da trilha do prisma-sr, SEM
// nenhuma coluna de mapeamento ("Item PRISMA", "Item PRISMA-S", "Itens ... cobertos"). O agente não pode
// ver a primeira leitura nem o mapeamento atual; a spec traz o mapeamento nessas colunas, por isso ela é
// recortada aqui, e a saída é conferida: nenhum número de item do PRISMA-S nem do PRISMA 2020 sobra.
// Grava segunda_leitura_entrada.md ao lado. Só lê o resto do repositório.
// Uso: node prepara_segunda_leitura.mjs
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const R = path.resolve(aqui, "..", "..", "..");
const ID = /^[A-Z][A-Za-z0-9_-]*(?:\.[A-Za-z0-9_-]+)+$/;   // ID_SUBITEM de method_trail.ts

const padrao = JSON.parse(fs.readFileSync(path.join(R, ".claude", "standards", "prisma-s.json"), "utf-8"));
const spec = fs.readFileSync(path.join(R, ".claude", "methodologies", "prisma-sr", "spec.md"), "utf-8").split(/\r?\n/);

const saida = ["# PRISMA-S — os 16 itens oficiais", ""];
for (const i of padrao.items) {
    saida.push(`- **${i.id}** — seção ${i.section} — tópico: *${i.title}*`);
    saida.push(`  - enunciado: ${i.text}`);
}
saida.push("", "# Campos da trilha do método (cada linha: subitem | colunas da tabela, sem as de mapeamento)", "");

let cab = null, guardar = [];
for (const l of spec) {
    if (/^#{2,4} /.test(l)) { saida.push("", l.replace(/^#+ /, "## "), ""); cab = null; continue; }
    if (!l.startsWith("|")) { cab = null; continue; }
    const cel = l.split("|").slice(1, -1).map((c) => c.trim());
    if (cel.every((c) => /^-+$/.test(c))) continue;               // separador
    if (!cab) {                                                    // cabeçalho da tabela
        cab = cel;
        guardar = cel.map((h) => !/^Ite(m|ns)\b/i.test(h));         // tira "Item PRISMA…" e "Itens … cobertos"
        if (ID.test(cel[0])) cab = null;                           // tabela sem cabeçalho: não há
        else { saida.push("| " + cel.filter((_, k) => guardar[k]).join(" | ") + " |"); continue; }
    }
    if (!ID.test(cel[0])) continue;                                // linhas que não são subitem (ex.: EX-01)
    saida.push("| " + cel.filter((_, k) => guardar[k]).join(" | ") + " |");
}

const texto = saida.join("\n") + "\n";
// Conferência do recorte: nada de número de item (S1..S16, "Item 7") fora da parte dos itens oficiais.
const trilha = texto.slice(texto.indexOf("# Campos da trilha"));
const vazou = trilha.split("\n").filter((l) => /\bS\d{1,2}\b|\bItem \d|S\d{1,2}\s*[–-]\s*S\d/.test(l));
if (vazou.length) { console.error("VAZOU mapeamento na entrada:\n" + vazou.join("\n")); process.exit(1); }
const n = trilha.split("\n").filter((l) => /^\| [A-Z][A-Za-z0-9_-]*\.[A-Za-z0-9_.-]+ \|/.test(l)).length;
fs.writeFileSync(path.join(aqui, "segunda_leitura_entrada.md"), texto);
console.log(`gravado: segunda_leitura_entrada.md — 16 itens, ${n} campos da trilha, ${texto.length} caracteres; nenhum número de item na parte da trilha`);
