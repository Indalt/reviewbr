// Sessão 2a (DEBT-142) — compara dois retratos do check_standard_coverage (retrato_cobertura.mjs).
// A comparação é SEMÂNTICA: ordem de chave não conta; o que conta é o que o relatório diz. Campos
// acrescentados de propósito são listados à parte, não escondidos.
// Uso: node compara_retratos.mjs <antes> <depois>   (rótulos dos arquivos retrato_<rótulo>.json;
// DIR=<pasta> os lê dela, como em retrato_cobertura.mjs)
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const aqui = process.env.DIR ? path.resolve(process.env.DIR) : path.dirname(fileURLToPath(import.meta.url));
const ler = (r) => JSON.parse(fs.readFileSync(path.join(aqui, `retrato_${r}.json`), "utf-8"));
const [ra, rb] = process.argv.slice(2);
const A = ler(ra), B = ler(rb);

const ordenar = (v) => Array.isArray(v) ? v.map(ordenar)
    : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, ordenar(v[k])])) : v;
const igual = (x, y) => JSON.stringify(ordenar(x)) === JSON.stringify(ordenar(y));

function difs(a, b, caminho, saida) {
    if (igual(a, b)) return;
    if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
        for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
            if (!(k in a)) saida.push(`${caminho}.${k}: ACRESCENTADO`);
            else if (!(k in b)) saida.push(`${caminho}.${k}: REMOVIDO`);
            else difs(a[k], b[k], `${caminho}.${k}`, saida);
        }
        return;
    }
    if (Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x) => x && typeof x === "object")) {
        a.forEach((x, i) => difs(x, b[i], `${caminho}[${i}]`, saida));
        return;
    }
    const curto = (v) => { const s = JSON.stringify(v); return s.length > 160 ? s.slice(0, 160) + "…" : s; };
    saida.push(`${caminho}: ${curto(a)}  →  ${curto(b)}`);
}

let total = 0;
const relatar = (titulo, saida) => { if (!saida.length) return; total += saida.length; console.log(`\n## ${titulo}`); for (const s of saida) console.log("  " + s); };

const pan = []; difs(A.panorama, B.panorama, "panorama", pan); relatar("panorama", pan);
for (const k of new Set([...Object.keys(A.conferir), ...Object.keys(B.conferir)])) {
    const s = []; difs(A.conferir[k], B.conferir[k], "", s); relatar(`conferir ${k}`, s);
}
for (const k of new Set([...Object.keys(A.render), ...Object.keys(B.render)])) {
    if (A.render[k] === B.render[k]) continue;
    const la = (A.render[k] ?? "").split("\n"), lb = (B.render[k] ?? "").split("\n");
    const sa = new Set(la), sb = new Set(lb);
    const so_a = la.filter((l) => !sb.has(l)), so_b = lb.filter((l) => !sa.has(l));
    const corta = (l) => l.length > 160 ? l.slice(0, 160) + "…" : l;
    relatar(`render ${k}`, [...so_a.map((l) => `- ${corta(l)}`), ...so_b.map((l) => `+ ${corta(l)}`)]);
}
console.log(`\n${total} diferença(s).`);
