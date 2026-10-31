// Experimento só-leitura: simula "comparar título + enunciado" trocando title por title+text num
// Standard em memória e chamando o checarMetodologia do dist. EQUIV inalterada.
import * as fs from "node:fs";
const R = "C:/reviewbr";
const dist = (f) => import("file:///C:/reviewbr/reviewbr/reviewbr-mcp/dist/services/" + f);
const { StandardsService } = await dist("standards.js");
const { MappingCoherenceService } = await dist("mapping_coherence.js");
const { lerMapeamento } = await dist("method_mapping.js");
const cru = (id) => JSON.parse(fs.readFileSync(`${R}/.claude/standards/${id}.json`, "utf-8"));
const comTexto = (id) => { const s = StandardsService.read(R, id); const t = new Map(cru(id).items.map((i) => [i.id, i.text ?? ""])); return { ...s, items: s.items.map((i) => ({ ...i, title: `${i.title} ${t.get(i.id) ?? ""}` })) }; };
const fmt = (r) => r.suspeitos.map((s) => `${s.subitem}→${s.item_declarado}:${s.item_sugerido}`);
const testeTxt = fs.readFileSync(`${R}/reviewbr/reviewbr-mcp/tests/prisma_s_scr_oficial.test.ts`, "utf-8");
const bloco = testeTxt.slice(testeTxt.indexOf("const ANTIGO"), testeTxt.indexOf("};", testeTxt.indexOf("const ANTIGO")) + 1);
const ANTIGO = eval("(" + bloco.replace(/^[^{]*/, "") + ")");
const antigo = new Map(Object.entries(ANTIGO).map(([id, cb]) => [id, { id, covered_by: cb, nao_coberto: "", nao_se_aplica: "" }]));
const casos = [
  ["prisma-s ANTIGO (controle S11/S13)", "prisma-sr", "prisma-s", antigo],
  ["prisma-s atual prisma-sr", "prisma-sr", "prisma-s", null],
  ["prisma-s atual scoping", "scoping-prisma-scr", "prisma-s", null],
  ["prisma-scr atual scoping", "scoping-prisma-scr", "prisma-scr", null],
  ["prisma-p atual prisma-sr", "prisma-sr", "prisma-p", null],
  ["prisma-2020 atual prisma-sr (sem text no padrão)", "prisma-sr", "prisma-2020", null],
];
for (const [nome, m, p, mapa] of casos) {
  const linhas = mapa ?? lerMapeamento(R, m, p).linhas;
  const so = MappingCoherenceService.checarMetodologia(R, m, StandardsService.read(R, p), linhas);
  const ct = MappingCoherenceService.checarMetodologia(R, m, comTexto(p), linhas);
  console.log(`== ${nome}\n  título só  (${so.suspeitos.length}): ${fmt(so).join(", ")}\n  +enunciado (${ct.suspeitos.length}): ${fmt(ct).join(", ")}`);
}
