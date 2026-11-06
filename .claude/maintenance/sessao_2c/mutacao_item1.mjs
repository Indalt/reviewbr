// Sessão 2c, item 1 (DEBT-149) — os testes novos pegam a volta do comportamento velho? (A5: teste só
// vale como prova se cai num erro conhecido.) Cada mutação reintroduz, NO src, uma parte do que a
// decisão de 05/11/2026 tirou; roda os testes da conferência e diz quais caíram. O arquivo original
// é guardado antes e restaurado sempre (finally), e a restauração é conferida por SHA-256.
// Uso: node mutacao_item1.mjs     (roda do repositório; leva ~1 min)
import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const MCP = path.resolve(aqui, "..", "..", "..", "reviewbr", "reviewbr-mcp");
const SC = path.join(MCP, "src", "services", "standard_coverage.ts");
const MM = path.join(MCP, "src", "services", "method_mapping.ts");
const TESTES = ["tests/conferencia_por_palavras.test.ts", "tests/prisma_s_scr_oficial.test.ts", "tests/cobertura_verificavel.test.ts", "tests/condicionais_em_uso.test.ts"];
const sha = (t) => createHash("sha256").update(t).digest("hex");

const MUTACOES = [
    ["suspeito volta aos erros", SC, "const enxerga = quantoEnxerga(", "if (coer.suspeitos.length) erros.push(`(b) ${coer.suspeitos.length} suspeito(s)`);\n    const enxerga = quantoEnxerga("],
    ["suspeito volta a contestar", SC, "const enxerga = quantoEnxerga(",
        "for (const s of coer.suspeitos) if (correspondencias.some((i) => i.id === s.item_declarado) && !contestados.has(s.item_declarado)) contestados.set(s.item_declarado, s.subitem);\n    const enxerga = quantoEnxerga("],
    ["suspeito volta a tirar item do porquê", SC, "if (!contestados.has(i.id) && std.titulos_oficiais === true) {",
        "if (!contestados.has(i.id) && std.titulos_oficiais === true && !coer.suspeitos.some((s) => s.item_declarado === i.id)) {"],
    ["medida nunca envelhece", SC, "const atualiza = medida.impressao === atual.impressao && medida.pares_medidos === atual.pares;", "const atualiza = true;"],
    ["zod remove a medida", MM, "    conferencia_por_palavras: MedidaDaConferenciaSchema.optional(),\n", ""],
];

for (const [nome, arq, de, para] of MUTACOES) {
    const original = fs.readFileSync(arq, "utf-8");
    if (!original.includes(de)) { console.log(`${nome.padEnd(40)} NÃO APLICADA — trecho não encontrado`); process.exitCode = 1; continue; }
    try {
        fs.writeFileSync(arq, original.replace(de, para));
        let saida = "";
        try { saida = execSync(`npx vitest run ${TESTES.join(" ")}`, { cwd: MCP, encoding: "utf-8", stdio: "pipe" }); }
        catch (e) { saida = (e.stdout ?? "") + (e.stderr ?? ""); }
        const caiu = /Tests\s+.*?(\d+) failed/.exec(saida.replace(/\x1b\[[0-9;]*m/g, ""));
        console.log(`${nome.padEnd(40)} ${caiu ? `PEGA — ${caiu[1]} teste(s) caíram` : "NÃO PEGA — a suíte passou com a mutação"}`);
        if (!caiu) process.exitCode = 1;
    } finally {
        fs.writeFileSync(arq, original);
        if (sha(fs.readFileSync(arq, "utf-8")) !== sha(original)) { console.error("RESTAURAÇÃO FALHOU:", arq); process.exit(2); }
    }
}
