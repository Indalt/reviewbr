// Sessão 2c, item 3 (DEBT-149, B2) — grava no repositório a segunda leitura independente, tirada da
// TRANSCRIÇÃO do agente (sem redigitar), e a prova da independência: as chamadas de ferramenta que ele fez.
// A transcrição fica fora do repositório (~/.claude/projects/...); o que entra aqui é o resultado e a lista
// de chamadas, com o SHA-256 da mensagem original.
// Uso: node grava_segunda_leitura.mjs <transcrição do agente .jsonl>
import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const linhas = fs.readFileSync(process.argv[2], "utf-8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const chamadas = [];
for (const l of linhas) {
    for (const c of l.message?.content ?? []) if (c?.type === "tool_use") chamadas.push({ ferramenta: c.name, entrada: c.input });
}
const entrega = chamadas.find((c) => c.ferramenta === "SubagentHandback");
if (!entrega) { console.error("sem SubagentHandback na transcrição"); process.exit(1); }
const msg = entrega.entrada.message;
const json = JSON.parse(msg.replace(/^\s*```json\s*/, "").replace(/\s*```\s*$/, ""));
const outras = chamadas.filter((c) => c.ferramenta !== "SubagentHandback");
const leituras = outras.map((c) => `${c.ferramenta} ${c.entrada.file_path ?? JSON.stringify(c.entrada)}`);
const independente = outras.length === 1 && outras[0].ferramenta === "Read" && /segunda_leitura_entrada\.md$/.test(outras[0].entrada.file_path ?? "");
const saida = {
    leitura: "segunda",
    por: "agente independente (general-purpose, Claude Opus 5.5), aprovado na decisão B2 de 05/11/2026",
    em: "2026-11-06",
    entrada: ".claude/maintenance/sessao_2c/segunda_leitura_entrada.md",
    independencia: { chamadas_de_ferramenta: leituras, so_leu_a_entrada: independente },
    mensagem_original_sha256: createHash("sha256").update(msg, "utf8").digest("hex"),
    ...json,
};
fs.writeFileSync(path.join(aqui, "segunda_leitura.json"), JSON.stringify(saida, null, 2) + "\n");
console.log(`gravado: segunda_leitura.json — ${json.itens.length} itens, ${json.itens.reduce((n, i) => n + i.ponteiros.length, 0)} ponteiros; chamadas: ${leituras.join("; ")}; só leu a entrada: ${independente}`);
if (!independente) process.exitCode = 1;
