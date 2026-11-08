// Sessão P (08/11/2026), item 2 — os testes da porta do backlog pegam uma porta errada?
// (A5: conferidor só vale como prova com teste de resposta conhecida.) Cada mutação estraga, NO src,
// uma parte da trava; roda os testes do backlog e diz quantos caíram. O arquivo original é guardado
// antes e restaurado sempre (finally), e a restauração é conferida por SHA-256.
// Uso: node mutacao_porta.mjs     (roda do repositório; leva ~1 min)
import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const MCP = path.resolve(aqui, "..", "..", "..", "reviewbr", "reviewbr-mcp");
const svc = (f) => path.join(MCP, "src", "services", f);
const [MW, SD, IX] = [svc("maintenance_writes.ts"), svc("system_debt.ts"), path.join(MCP, "src", "index.ts")];
// item 3: os textos — a frase velha volta, e a asserção negativa tem de cair
const CL = path.resolve(aqui, "..", "..");
const [SK, MT, DI, PA] = [path.join(CL, "skills", "system-audit", "SKILL.md"), path.join(CL, "agents", "maintainer.md"),
    path.join(CL, "maintenance", "DIRECAO_ferramenta_que_veste_metodos.md"), path.join(CL, "maintenance", "PASSAGEM.md")];
const TESTES = ["tests/porta_do_backlog.test.ts", "tests/maintenance_writes.test.ts", "tests/system_debt.test.ts"];
const sha = (t) => createHash("sha256").update(t).digest("hex");

const MUTACOES = [
    ["porta desligada", MW, "        if (naFila(f.status)) {", "        if (false) {"],
    ["porta também no fechamento", MW, "        if (naFila(f.status)) {", "        if (true) {"],
    ["porta olha a entrada, não o mesclado", MW, "            const faltas = faltasDaMentira(f.mentira_de_hoje);", "            const faltas = faltasDaMentira(entradaSegura.mentira_de_hoje);"],
    ["não confere o disco", MW, "                const disco = conferirMentiraNoDisco(repoRoot, f.mentira_de_hoje!);", "                const disco: string[] = [];"],
    ["METODOLOGIA_NOVA aceita em aberto", MW, "            if (f.destino.trim() === DESTINO_SO_HISTORICO) {", "            if (false) {"],
    ["merge raso da mentira de hoje", MW, "            mesclado.mentira_de_hoje = { ...mBase, ...mNova };", "            mesclado.mentira_de_hoje = mNova;"],
    ["linha além do fim aceita (fronteira)", SD, "    if (m.linha > linhas) {", "    if (m.linha > linhas + 1) {"],
    ["caminho absoluto aceito", SD, "    if (path.isAbsolute(arquivo) || /^[a-zA-Z]:/.test(arquivo)) {", "    if (false) {"],
    ["caminho fora da raiz aceito", SD, '    if (rel === ".." || rel.startsWith(".." + path.sep) || path.isAbsolute(rel)) {', "    if (false) {"],
    ["CRLF conta linha a mais", SD, "    const partes = texto.split(/\\r\\n|\\n|\\r/);", "    const partes = texto.split(/\\n|\\r/);"],
    ["zod remove a mentira de hoje", SD, "    mentira_de_hoje: MentiraDeHojeSchema.optional()\n", ""],
    ["audit: aviso vira erro", SD, "            warnings.push(\n                `${sem_mentira_de_hoje.length}", "            errors.push(\n                `${sem_mentira_de_hoje.length}"],
    ["audit: incompleta não conta", SD, "            if (faltasDaMentira(f.mentira_de_hoje).length) sem_mentira_de_hoje.push(f.id);", "            if (!f.mentira_de_hoje) sem_mentira_de_hoje.push(f.id);"],
    ["audit: METODOLOGIA_NOVA aberto passa", SD, "            if (f.destino.trim() === DESTINO_SO_HISTORICO) destinoSoHistorico.push(f.id);", ""],
    ["descrição da tool volta à velha", IX, "METODOLOGIA_NOVA so em achado fechado, como historico", "METODOLOGIA_NOVA"],
    ["texto: EXTENSAO volta a ser ausência", SK, "| **EXTENSAO** | consertar o defeito exige capacidade nova | protocolo próprio |", "| **EXTENSAO** | falta capacidade que nunca foi prometida | protocolo próprio |"],
    ["texto: tabela do maintainer volta à velha", MT, "| achou um defeito de hoje | `record_system_finding` | achado aberto sem a mentira de hoje (arquivo e linha conferidos no disco) ou com destino METODOLOGIA_NOVA; CORRECAO sem reprodução; id duplicado; saída sem justificativa |", "| achou um problema | `record_system_finding` | CORRECAO sem reprodução; id duplicado; saída sem justificativa |"],
    ["texto: destino volta a ser agenda", MT, "   trabalha, o plano (`PLANO_sessoes_2026-10-29.md`).", "   trabalha, o plano (`PLANO_sessoes_2026-10-29.md`). Se você for escolher no que trabalhar, escolha daqui."],
    ["texto: DIRECAO sem a nota", DI, "> **Nota de 08/11/2026 (sessão P):** o destino não define escopo. Ele diz para onde vai o", "> Ele diz para onde vai o"],
    ["texto: PASSAGEM sem a nota", PA, "> **Nota de 08/11/2026 (sessão P):** este bloco está superado. O `DEBT-110` foi RECUSADO em", "> O `DEBT-110` foi RECUSADO em"],
];

for (const [nome, arq, de0, para0] of MUTACOES) {
    const original = fs.readFileSync(arq, "utf-8");
    // Os fontes podem estar em CRLF (core.autocrlf no Windows): a quebra do trecho segue a do arquivo.
    const eol = original.includes("\r\n") ? "\r\n" : "\n";
    const [de, para] = [de0, para0].map((s) => s.replace(/\r?\n/g, eol));
    if (!original.includes(de)) { console.log(`${nome.padEnd(40)} NÃO APLICADA — trecho não encontrado`); process.exitCode = 1; continue; }
    try {
        fs.writeFileSync(arq, original.replace(de, para));
        let saida = "";
        try { saida = execSync(`npx vitest run ${TESTES.join(" ")}`, { cwd: MCP, encoding: "utf-8", stdio: "pipe" }); }
        catch (e) { saida = (e.stdout ?? "") + (e.stderr ?? ""); }
        const limpa = saida.replace(/\x1b\[[0-9;]*m/g, "");
        const caiu = /Tests\s+.*?(\d+) failed/.exec(limpa);
        const quebrou = !caiu && /Test Files\s+.*?(\d+) failed/.exec(limpa);
        console.log(`${nome.padEnd(40)} ${caiu ? `PEGA — ${caiu[1]} teste(s) caíram` : quebrou ? "PEGA — arquivo de teste não carrega" : "NÃO PEGA — a suíte passou com a mutação"}`);
        if (!caiu && !quebrou) process.exitCode = 1;
    } finally {
        fs.writeFileSync(arq, original);
        if (sha(fs.readFileSync(arq, "utf-8")) !== sha(original)) { console.error("RESTAURAÇÃO FALHOU:", arq); process.exit(2); }
    }
}
