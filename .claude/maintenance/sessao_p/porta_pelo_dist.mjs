// Sessão P (08/11/2026) — a porta do backlog conferida pelo DIST, que é o que o servidor MCP roda
// (a tool deste chat roda o dist da abertura; armadilha 4 do prompt). Roda num repositório de
// brinquedo, criado e apagado aqui: nada toca o backlog real.
// Rodado antes do build, mostra a porta aberta (a reprodução); depois, os testes de resposta conhecida.
// Uso: node porta_pelo_dist.mjs
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(aqui, "..", "..", "..", "reviewbr", "reviewbr-mcp", "dist", "services");
const { BacklogWriter } = await import(pathToFileURL(path.join(dist, "maintenance_writes.js")).href);
const { SystemDebtService } = await import(pathToFileURL(path.join(dist, "system_debt.js")).href);

const raiz = fs.mkdtempSync(path.join(os.tmpdir(), "reviewbr-porta-dist-"));
fs.mkdirSync(path.join(raiz, "src"));
fs.writeFileSync(path.join(raiz, "src", "afirma.ts"), "// 1\nexport const promete = 'A';\n// 3\n");
const M = { arquivo: "src/afirma.ts", linha: 2, diz: "promete A", nao_se_sustenta: "faz B" };
const base = { summary: "s", change_type: "EXTENSAO", evidence: "e", status: "ABERTO", destino: "FASE_1" };
const casos = [
    ["ausência gravada como achado (o caso da triagem)", { id: "JBI", summary: "falta o JBI", change_type: "EXTENSAO", evidence: "o sistema não tem o JBI", status: "ABERTO", destino: "METODOLOGIA_NOVA" }, false, "recusa"],
    ["sem o campo", { id: "C1", ...base }, false, "recusa"],
    ["arquivo inexistente", { id: "C2", ...base, mentira_de_hoje: { ...M, arquivo: "src/nao_existe.ts" } }, false, "recusa"],
    ["linha além do fim", { id: "C3", ...base, mentira_de_hoje: { ...M, linha: 4 } }, false, "recusa"],
    ["campo completo", { id: "C4", ...base, mentira_de_hoje: M }, false, "aceita"],
    ["fechar sem o campo", { id: "C4", status: "RESOLVIDO", resolution: "corrigido" }, true, "aceita"],
    ["METODOLOGIA_NOVA em aberto", { id: "C5", ...base, destino: "METODOLOGIA_NOVA", mentira_de_hoje: M }, false, "recusa"],
    ["METODOLOGIA_NOVA em fechado", { id: "C6", ...base, destino: "METODOLOGIA_NOVA", status: "RECUSADO", resolution: "histórico" }, false, "aceita"],
];
let falhas = 0;
try {
    for (const [nome, achado, atualizar, esperado] of casos) {
        const r = BacklogWriter.registrar(raiz, achado, atualizar);
        const obtido = r.ok ? "aceita" : "recusa";
        if (obtido !== esperado) falhas++;
        console.log(`${obtido === esperado ? "ok  " : "DIFERE"} ${nome.padEnd(50)} esperado ${esperado}, obtido ${obtido}${r.ok ? "" : " — " + r.errors.join(" ").slice(0, 150)}`);
    }
    const a = SystemDebtService.audit(SystemDebtService.read(raiz));
    console.log(`audit do brinquedo: valid ${a.valid}; sem_mentira_de_hoje ${JSON.stringify(a.sem_mentira_de_hoje)}; warnings ${a.warnings?.length ?? "(campo ausente)"}`);
} finally {
    fs.rmSync(raiz, { recursive: true, force: true });
}
console.log(falhas ? `${falhas} caso(s) diferem do esperado.` : "Todos os casos como esperado.");
