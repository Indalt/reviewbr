// Sessão 2c, item 2 (DEBT-149, B2) — os testes do conferidor de literalidade pegam um conferidor errado?
// (A5: conferidor só vale como prova com teste de resposta conhecida.) Cada mutação estraga, NO src, uma
// parte da leitura documentada; roda os testes dela e diz quais caíram. O arquivo original é guardado
// antes e restaurado sempre (finally), e a restauração é conferida por SHA-256.
// Uso: node mutacao_item2.mjs     (roda do repositório; leva ~1 min)
import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const MCP = path.resolve(aqui, "..", "..", "..", "reviewbr", "reviewbr-mcp");
const svc = (f) => path.join(MCP, "src", "services", f);
const [SC, MM, LD, ST] = ["standard_coverage.ts", "method_mapping.ts", "leitura_documentada.ts", "standards.ts"].map(svc);
const TESTES = ["tests/leitura_documentada.test.ts"];
const sha = (t) => createHash("sha256").update(t).digest("hex");
const ACEITA = "    if (enunciado.includes(t)) return { aceito: true };";

const MUTACOES = [
    ["zod remove o enunciado", ST, '    text: z.string().default(""),', ""],
    ["zod remove os trechos", MM, "    trechos: z.record(z.string().min(1), z.string().min(1)).optional(),\n", ""],
    ["zod remove os exames", MM, "    examinados: z.array(z.object({", "    _x: z.array(z.object({"],
    ["conferidor aceita tudo", LD, ACEITA, "    return { aceito: true };"],
    ["conferidor ignora maiúscula", LD, ACEITA, "    if (enunciado.toLowerCase().includes(t.toLowerCase())) return { aceito: true };"],
    ["conferidor aceita trecho de qualquer item", LD, ACEITA, "    if (std.items.some((i) => normalizarEspaco(i.text).includes(t))) return { aceito: true };"],
    ["normalização tira pontuação", LD, '    return s.replace(/\\s+/g, " ").trim();', '    return s.replace(/[^\\w\\s]/g, "").replace(/\\s+/g, " ").trim();'],
    ["exame não caduca com o rótulo", SC, " && e.rotulo === s.rotulo);", ");"],
    ["trecho recusado não reprova", SC, "    if (leitura.recusados.length) {\n        erros.push(", "    if (leitura.recusados.length) {\n        [].push("],
];

for (const [nome, arq, de, para] of MUTACOES) {
    const original = fs.readFileSync(arq, "utf-8");
    if (!original.includes(de)) { console.log(`${nome.padEnd(42)} NÃO APLICADA — trecho não encontrado`); process.exitCode = 1; continue; }
    try {
        fs.writeFileSync(arq, original.replace(de, para));
        let saida = "";
        try { saida = execSync(`npx vitest run ${TESTES.join(" ")}`, { cwd: MCP, encoding: "utf-8", stdio: "pipe" }); }
        catch (e) { saida = (e.stdout ?? "") + (e.stderr ?? ""); }
        const caiu = /Tests\s+.*?(\d+) failed/.exec(saida.replace(/\x1b\[[0-9;]*m/g, ""));
        console.log(`${nome.padEnd(42)} ${caiu ? `PEGA — ${caiu[1]} teste(s) caíram` : "NÃO PEGA — a suíte passou com a mutação"}`);
        if (!caiu) process.exitCode = 1;
    } finally {
        fs.writeFileSync(arq, original);
        if (sha(fs.readFileSync(arq, "utf-8")) !== sha(original)) { console.error("RESTAURAÇÃO FALHOU:", arq); process.exit(2); }
    }
}
