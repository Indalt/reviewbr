import { pathToFileURL } from "node:url";
const B = "C:/reviewbr/reviewbr/reviewbr-mcp/dist/services/";
const imp = (f) => import(pathToFileURL(B + f).href);
const { StandardCoverageService } = await imp("standard_coverage.js");
const REPO = "C:/reviewbr";
for (const id of ["prisma-2020", "prisma-p", "prisma-s", "prisma-scr", "raise-3"]) {
  const r = StandardCoverageService.conferir(REPO, id);
  console.log("=====", id, "declarado_por", JSON.stringify(r.declarado_por), "fracao", r.fracao, "valid", r.valid);
  for (const c of r.conferencia_por_metodo ?? []) {
    const f = c.falsificacao;
    console.log(" metodo", c.methodology ?? c.metodo ?? c.id, "com_poder", f.com_poder, "pares", f.pares_conferidos);
    for (const s of f.suspeitos) console.log("  SUSP", s.subitem, JSON.stringify(s.rotulo), s.item_declarado, "->", s.item_sugerido, JSON.stringify(s.titulo_sugerido));
    console.log("  nao_conferidos", f.nao_conferidos.length, JSON.stringify(f.nao_conferidos.slice(0, 40)));
  }
}
