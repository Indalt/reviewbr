// Sessão 2a — lê o audit_system_debt pelo serviço compilado e imprime só valid, counts e os achados pedidos.
// O audit inteiro passa de 150 mil caracteres; a abertura e o fechamento da sessão só precisam disto.
// Uso: node le_audit.mjs [ids separados por vírgula]   (FULL=1 imprime evidence, context e resolution)
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, "..", "..", "..");
const { SystemDebtService } = await import(pathToFileURL(path.join(raiz, "reviewbr", "reviewbr-mcp", "dist", "services", "system_debt.js")).href);

const sonda = SystemDebtService.probe(raiz);
if (sonda.status === "ILEGIVEL") { console.log("ILEGIVEL", sonda.detail); process.exit(1); }
const a = SystemDebtService.audit(sonda.debt ?? null);
console.log("valid:", a.valid);
for (const [k, v] of Object.entries(a)) {
    if (k === "valid") continue;
    if (Array.isArray(v)) console.log(`${k}: [${v.length}]`, k === "errors" || k === "warnings" ? JSON.stringify(v) : "");
    else if (v && typeof v === "object") console.log(`${k}:`, JSON.stringify(v).slice(0, 400));
    else console.log(`${k}:`, v);
}
const ids = (process.argv[2] ?? "").split(",").filter(Boolean);
const todos = sonda.debt?.findings ?? [];
for (const id of ids) {
    const f = todos.find((x) => x.id === id);
    if (!f) { console.log(`\n=== ${id}: NAO ENCONTRADO`); continue; }
    console.log(`\n=== ${id} [${f.status}] destino=${f.destino} tipo=${f.change_type} gravidade=${f.gravidade ?? "-"} depende_de=${JSON.stringify(f.depende_de ?? [])}`);
    console.log("summary:", f.summary);
    if (process.env.FULL) {
        for (const k of ["evidence", "reproduction", "location", "context", "resolution"]) if (f[k]) console.log(`${k}:`, typeof f[k] === "string" ? f[k] : JSON.stringify(f[k], null, 1));
    }
}
