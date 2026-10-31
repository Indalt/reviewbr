// Mede o poder do falsificador atual: para cada par (subitem, item) do mapeamento real que hoje NÃO é
// suspeito, planta o subitem em cada OUTRO item (linha de checklist) e vê se o falsificador acusa o
// plantio. Só leitura; nada é gravado no repositório. Variante "+enunciado": title := title + text.
import * as fs from "node:fs";
const R = "C:/reviewbr";
const dist = (f) => import("file:///C:/reviewbr/reviewbr/reviewbr-mcp/dist/services/" + f);
const { StandardsService } = await dist("standards.js");
const { MappingCoherenceService } = await dist("mapping_coherence.js");
const { lerMapeamento } = await dist("method_mapping.js");
const cru = (id) => JSON.parse(fs.readFileSync(`${R}/.claude/standards/${id}.json`, "utf-8"));
const comTexto = (id) => { const s = StandardsService.read(R, id); const t = new Map(cru(id).items.map((i) => [i.id, i.text ?? ""])); return { ...s, items: s.items.map((i) => ({ ...i, title: `${i.title} ${t.get(i.id) ?? ""}` })) }; };
for (const [m, p] of [["prisma-sr","prisma-s"],["scoping-prisma-scr","prisma-scr"],["prisma-sr","prisma-p"]]) {
  for (const [nome, std] of [["título", StandardsService.read(R, p)], ["+enunciado", comTexto(p)]]) {
    const mapa = lerMapeamento(R, m, p).linhas;
    const fam = new Map(std.items.map((i) => [i.id, i.parent || i.id]));
    const linhas = std.items.filter((i) => !i.has_subitems).map((i) => i.id);
    const pares = []; for (const [id, l] of mapa) for (const s of l.covered_by) pares.push([s, id]);
    const susp0 = new Set(MappingCoherenceService.checarMetodologia(R, m, std, mapa).suspeitos.map((s) => s.subitem + "→" + s.item_declarado));
    let tent = 0, acus = 0, acusCerto = 0; const subsDetectaveis = new Set(), subs = new Set();
    for (const [s, certo] of pares) {
      if (susp0.has(s + "→" + certo)) continue;
      subs.add(s);
      for (const j of linhas) {
        if (fam.get(j) === fam.get(certo)) continue;
        tent++;
        const r = MappingCoherenceService.checarMetodologia(R, m, std, new Map([[j, { id: j, covered_by: [s], nao_coberto: "", nao_se_aplica: "" }]]));
        const hit = r.suspeitos.find((x) => x.subitem === s && x.item_declarado === j);
        if (hit) { acus++; subsDetectaveis.add(s); if (fam.get(hit.item_sugerido) === fam.get(certo)) acusCerto++; }
      }
    }
    console.log(`${p} × ${m} [${nome}]: ${pares.length} pares, ${subs.size} subitens; plantios ${tent}, acusados ${acus} (${(100*acus/tent).toFixed(1)}%), com sugestão = item certo ${acusCerto}; subitens que o falsificador consegue acusar em algum plantio: ${subsDetectaveis.size}/${subs.size}`);
  }
}
