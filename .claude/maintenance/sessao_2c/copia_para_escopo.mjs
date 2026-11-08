// Sessão 2c, item 3 — decisão do Vicente de 08/11/2026 ("Copiar os ponteiros"): a cópia do mapeamento
// PRISMA-S do scoping-prisma-scr recebe as mesmas correções de ponteiro que a leitura documentada aplicou
// ao prisma-sr — sem trechos e sem leitura documentada própria —, porque a trilha do escopo é a spec do
// prisma-sr lida por `extends`, e a coluna "Item PRISMA-S" dessa spec é compartilhada. A leitura
// documentada do escopo fica para quando ele tiver trilha própria (DEBT-151, sessão 6).
// Antes de gravar, confere que a cópia era mesmo cópia: o covered_by dela tem de ser o do prisma-sr de
// antes da aplicação (comparacao_leituras.json, campo `atual`). As declarações não mudam.
// Uso: node copia_para_escopo.mjs
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const R = path.resolve(aqui, "..", "..", "..");
const comp = JSON.parse(fs.readFileSync(path.join(aqui, "comparacao_leituras.json"), "utf-8"));
const arq = (m) => path.join(R, ".claude", "methodologies", m, "conformance", "prisma-s.json");
const sr = JSON.parse(fs.readFileSync(arq("prisma-sr"), "utf-8"));
const esc = JSON.parse(fs.readFileSync(arq("scoping-prisma-scr"), "utf-8"));

for (const linha of esc.items) {
    const antes = comp.itens.find((i) => i.item === linha.id).atual;
    if (JSON.stringify(linha.covered_by) !== JSON.stringify(antes)) {
        console.error(`RECUSADO: a cópia do escopo, item ${linha.id}, não era cópia do prisma-sr de 30/10 (${linha.covered_by} × ${antes})`);
        process.exit(1);
    }
    const depois = sr.items.find((i) => i.id === linha.id).covered_by;
    if (JSON.stringify(depois) !== JSON.stringify(comp.itens.find((i) => i.item === linha.id).final)) {
        console.error(`RECUSADO: o prisma-sr, item ${linha.id}, não tem o resultado da comparação — rode compara_leituras.mjs --aplica antes`);
        process.exit(1);
    }
    linha.covered_by = depois;
}
fs.writeFileSync(arq("scoping-prisma-scr"), JSON.stringify(esc, null, 2) + "\n");
console.log("gravado:", path.relative(R, arq("scoping-prisma-scr")), "— covered_by igual ao do prisma-sr; declarações e medida intactas");
