// Sessão 2a (DEBT-142) — migração do mapeamento: do arquivo do PADRÃO para cada MÉTODO que o declara.
// Roda uma vez. Não muda o que o mapeamento diz: copia covered_by, nao_coberto e nao_se_aplica item a
// item, divide a nota de cada padrão entre a norma e o mapeamento (sem perder palavra — conferido
// abaixo) e grava os padrões só com a norma, preservando a terminação de linha de cada arquivo.
// Uso: node migra_mapeamento.mjs
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, "..", "..", "..");
const STD = path.join(raiz, ".claude", "standards");
const MET = path.join(raiz, ".claude", "methodologies");
const CAMPOS = ["covered_by", "nao_coberto", "nao_se_aplica"];
const falha = (m) => { console.error("FALHA:", m); process.exit(1); };

const PONTEIRO = (id) => ` O mapeamento contra a trilha — covered_by e as declarações [NÃO COBERTO] / [NÃO SE APLICA] — é de cada ` +
    `método que declara o padrão, em .claude/methodologies/<método>/conformance/${id}.json (DEBT-142, 30/10/2026).`;

// Divisão de cada nota: [trecho da norma, trecho do mapeamento, resto da norma]. O texto de cada trecho
// é localizado por início e fim exatos; a concatenação tem de devolver a nota original.
const DIVISAO = {
    "prisma-2020": { mapa: ["O campo covered_by dos itens de topo", "trabalho pendente."] },
    "prisma-p": { mapa: ["COBERTURA HONESTA: 12/26", "e a norma do protocolo da revisao sistematica."] },
    "prisma-s": { mapa: ["REMAPEADO em 30/10/2026 (DEBT-128)", "o zero suspeito depois do remapeamento não prova acerto."] },
    "prisma-scr": { mapa: ["MAPEADO em 30/10/2026 (DEBT-055)", "Registrado no DEBT-149."] },
};

function dividir(id, nota) {
    const d = DIVISAO[id];
    if (!d) return { norma: nota, mapa: "" };
    const ini = nota.indexOf(d.mapa[0]);
    const fimTxt = nota.indexOf(d.mapa[1], ini);
    if (ini < 0 || fimTxt < 0) falha(`${id}: trecho do mapeamento não encontrado na nota`);
    const fim = fimTxt + d.mapa[1].length;
    const antes = nota.slice(0, ini).trimEnd();
    const mapa = nota.slice(ini, fim);
    const depois = nota.slice(fim).trimStart();
    // Sem perder palavra: as três partes, juntas por um espaço, devolvem a nota.
    if ([antes, mapa, depois].filter(Boolean).join(" ") !== nota) falha(`${id}: a divisão da nota perde ou acrescenta texto`);
    return { norma: [antes, depois].filter(Boolean).join(" "), mapa };
}

// 1. Quem declara o quê.
const metodos = fs.readdirSync(MET, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
const declara = Object.fromEntries(metodos.map((m) => {
    const man = JSON.parse(fs.readFileSync(path.join(MET, m, "manifest.json"), "utf-8"));
    return [m, man?.conformance?.standards ?? []];
}));

// 2. Lê os padrões crus, com o estilo do arquivo.
const padroes = {};
for (const f of fs.readdirSync(STD).filter((f) => f.endsWith(".json"))) {
    const id = f.replace(/\.json$/, "");
    const texto = fs.readFileSync(path.join(STD, f), "utf-8");
    padroes[id] = { texto, crlf: texto.includes("\r\n"), fimComQuebra: /\n$/.test(texto), json: JSON.parse(texto) };
}

// 3. O mapeamento de cada método, item a item, na ordem do padrão.
const notas = Object.fromEntries(Object.entries(padroes).map(([id, p]) => [id, dividir(id, p.json.note ?? "")]));
const gravados = [];
for (const m of metodos) {
    for (const s of declara[m]) {
        const p = padroes[s];
        if (!p) falha(`${m} declara ${s}, que não existe em .claude/standards/`);
        const items = p.json.items
            .filter((i) => (i.covered_by?.length ?? 0) > 0 || (i.nao_coberto ?? "").trim() || (i.nao_se_aplica ?? "").trim())
            .map((i) => ({
                id: i.id,
                covered_by: i.covered_by ?? [],
                ...((i.nao_coberto ?? "").trim() ? { nao_coberto: i.nao_coberto } : {}),
                ...((i.nao_se_aplica ?? "").trim() ? { nao_se_aplica: i.nao_se_aplica } : {}),
            }));
        // O scoping lê a spec do prisma-sr por `extends`: o mapeamento do PRISMA-S é o mesmo, e cada
        // método guarda a sua cópia — repetição entre métodos é correta; no código, não.
        const prefixo = m === "scoping-prisma-scr" && s === "prisma-s"
            ? "Cópia do mapeamento do prisma-sr: a trilha deste método é a spec do prisma-sr lida por `extends`, até ele ter spec própria (ponto 2 do DEBT-142). "
            : "";
        const mapa = { schemaVersion: 1, standard: s, note: prefixo + notas[s].mapa, items };
        const dir = path.join(MET, m, "conformance");
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, `${s}.json`), JSON.stringify(mapa, null, 2) + "\n");
        gravados.push(`${m}/conformance/${s}.json (${items.length} linhas)`);
    }
}

// 4. O padrão fica só com a norma.
for (const [id, p] of Object.entries(padroes)) {
    const j = p.json;
    for (const i of j.items) for (const k of CAMPOS) delete i[k];
    if (DIVISAO[id]) j.note = notas[id].norma + PONTEIRO(id);
    let saida = JSON.stringify(j, null, 2) + (p.fimComQuebra ? "\n" : "");
    if (p.crlf) saida = saida.replace(/\n/g, "\r\n");
    fs.writeFileSync(path.join(STD, `${id}.json`), saida);
}

// 5. Conferência: o que cada método diz é, campo a campo, o que o padrão dizia.
for (const m of metodos) for (const s of declara[m]) {
    const mapa = JSON.parse(fs.readFileSync(path.join(MET, m, "conformance", `${s}.json`), "utf-8"));
    const porId = new Map(mapa.items.map((l) => [l.id, l]));
    const original = JSON.parse(padroes[s].texto).items;
    for (const i of original) {
        const l = porId.get(i.id);
        const cb = JSON.stringify(i.covered_by ?? []), nc = (i.nao_coberto ?? ""), na = (i.nao_se_aplica ?? "");
        if (!l) { if (cb !== "[]" || nc.trim() || na.trim()) falha(`${m}/${s}: item ${i.id} perdeu o mapeamento`); continue; }
        if (JSON.stringify(l.covered_by) !== cb || (l.nao_coberto ?? "") !== nc || (l.nao_se_aplica ?? "") !== na) falha(`${m}/${s}: item ${i.id} mudou`);
    }
}
for (const [id] of Object.entries(padroes)) {
    const j = JSON.parse(fs.readFileSync(path.join(STD, `${id}.json`), "utf-8"));
    if (j.items.some((i) => CAMPOS.some((k) => k in i))) falha(`${id}: ainda traz campo de mapeamento`);
}
console.log("mapeamentos gravados:\n  " + gravados.join("\n  "));
console.log("padrões só com a norma:", Object.keys(padroes).join(", "));
