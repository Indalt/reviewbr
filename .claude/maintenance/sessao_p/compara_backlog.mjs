// Sessão P (08/11/2026) — compara o backlog de uma revisão do git com o do disco, campo a campo.
// Prova a saída do item 1: só o campo `destino` mudou, e só nos 14 achados que tinham
// METODOLOGIA_NOVA aberto. A ordem das chaves não conta: o BacklogWriter regrava o arquivo
// inteiro, e a ordem das chaves do achado gravado por último muda sem mudar o dado.
// Uso: node compara_backlog.mjs [revisão do git, padrão HEAD]
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, "..", "..", "..");
const rev = process.argv[2] ?? "HEAD";
const rel = ".claude/maintenance/system_debt.json";
const antes = JSON.parse(execFileSync("git", ["show", `${rev}:${rel}`], { cwd: raiz, encoding: "utf-8", maxBuffer: 64 * 1024 * 1024 }));
const depois = JSON.parse(fs.readFileSync(path.join(raiz, rel), "utf-8"));

const ids = (d) => d.findings.map((f) => f.id).join(",");
console.log(`revisão: ${rev}`);
console.log(`achados: ${antes.findings.length} -> ${depois.findings.length}; mesma ordem de ids: ${ids(antes) === ids(depois)}`);
const mudancas = [];
for (const fa of antes.findings) {
    const fb = depois.findings.find((x) => x.id === fa.id);
    if (!fb) { mudancas.push(`${fa.id}: SUMIU`); continue; }
    for (const k of new Set([...Object.keys(fa), ...Object.keys(fb)])) {
        if (JSON.stringify(fa[k]) !== JSON.stringify(fb[k])) {
            mudancas.push(`${fa.id}.${k}: ${JSON.stringify(fa[k]).slice(0, 80)} -> ${JSON.stringify(fb[k]).slice(0, 80)}`);
        }
    }
}
for (const fb of depois.findings) if (!antes.findings.some((x) => x.id === fb.id)) mudancas.push(`${fb.id}: NOVO`);
console.log(`${mudancas.length} campo(s) mudaram:`);
for (const m of mudancas) console.log("  " + m);
const abertosMN = depois.findings.filter((f) => (f.status === "ABERTO" || f.status === "EM_CURSO") && f.destino === "METODOLOGIA_NOVA").map((f) => f.id);
console.log(`abertos com METODOLOGIA_NOVA no disco: ${abertosMN.length}${abertosMN.length ? " — " + abertosMN.join(", ") : ""}`);
