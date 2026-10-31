// Variante: o item DECLARADO é comparado com título+enunciado (aceita mais), os CANDIDATOS só com o
// título (como hoje). Reimplementa termos/casam/checar copiando o EQUIV do dist. Só leitura.
import * as fs from "node:fs";
const R = "C:/reviewbr";
const src = fs.readFileSync(`${R}/reviewbr/reviewbr-mcp/dist/services/mapping_coherence.js`, "utf-8");
const EQUIV = eval(src.slice(src.indexOf("const EQUIV = ") + 14, src.indexOf("];", src.indexOf("const EQUIV = ")) + 1));
const VAZ = eval("new Set(" + src.slice(src.indexOf("new Set([", src.indexOf("const VAZIAS")) + 8, src.indexOf("]);", src.indexOf("const VAZIAS")) + 1) + ")");
const EXTRA = JSON.parse(process.env.EXTRA || "[]"); const ME = new Map([...EQUIV, ...EXTRA]);
const termos = (t) => new Set(t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((x) => x.length > 3 && !VAZ.has(x)));
const casam = (a, b) => { for (const t of a) { if (b.has(t)) return true; for (const e of ME.get(t) ?? []) if (b.has(e)) return true; } return false; };
const dist = (f) => import("file:///C:/reviewbr/reviewbr/reviewbr-mcp/dist/services/" + f);
const { StandardsService } = await dist("standards.js");
const { lerMapeamento } = await dist("method_mapping.js");
const { textoDaSpec } = await dist("method_trail.js");
function checar(std, texto, pares, modo) {
  const fam = new Map(std.items.map((i) => [i.id, i.parent || i.id]));
  const T = new Map(std.items.map((i) => [i.id, i.title])); const X = new Map(std.items.map((i) => [i.id, (i.title + " " + (texto.get(i.id) ?? ""))]));
  const out = [];
  for (const p of pares) {
    const tr = termos(p.rotulo); if (!tr.size || !T.has(p.item)) continue;
    const decl = modo === "titulo" ? T.get(p.item) : X.get(p.item);
    if (casam(tr, termos(decl))) continue;
    const fd = fam.get(p.item);
    const fs_ = [...new Set(std.items.filter((i) => fam.get(i.id) !== fd && casam(tr, termos(modo === "ambos" ? X.get(i.id) : i.title))).map((i) => fam.get(i.id)))];
    if (fs_.length === 1) out.push(`${p.subitem}→${p.item}:${fs_[0]}`);
  }
  return out;
}
const rotulos = (m) => { const r = new Map(); for (const x of textoDaSpec(R, m).matchAll(/^\|\s*([A-Z][A-Za-z0-9_-]*(?:\.[A-Za-z0-9_-]+)+)\s*\|([^|]*)\|/gm)) if (!r.has(x[1])) r.set(x[1], x[2].trim()); return r; };
const testeTxt = fs.readFileSync(`${R}/reviewbr/reviewbr-mcp/tests/prisma_s_scr_oficial.test.ts`, "utf-8");
const b = testeTxt.slice(testeTxt.indexOf("const ANTIGO"), testeTxt.indexOf("};", testeTxt.indexOf("const ANTIGO")) + 1);
const ANTIGO = eval("(" + b.replace(/^[^{]*/, "") + ")");
for (const [nome, m, p, mapaObj] of [["prisma-s ANTIGO", "prisma-sr", "prisma-s", ANTIGO], ["prisma-scr atual", "scoping-prisma-scr", "prisma-scr", null], ["prisma-p atual", "prisma-sr", "prisma-p", null]]) {
  const std = StandardsService.read(R, p); const txt = new Map(JSON.parse(fs.readFileSync(`${R}/.claude/standards/${p}.json`, "utf-8")).items.map((i) => [i.id, i.text ?? ""]));
  const rot = rotulos(m); const mapa = mapaObj ?? Object.fromEntries([...lerMapeamento(R, m, p).linhas].map(([k, v]) => [k, v.covered_by]));
  const pares = []; for (const it of std.items) for (const s of mapa[it.id] ?? []) if (rot.get(s)) pares.push({ subitem: s, rotulo: rot.get(s), item: it.id });
  console.log(`== ${nome}\n  reimpl. título  : ${checar(std, txt, pares, "titulo").join(", ")}\n  declarado+enunc.: ${checar(std, txt, pares, "assim").join(", ")}
  ambos+enunc.    : ${checar(std, txt, pares, "ambos").join(", ")}`);
}
