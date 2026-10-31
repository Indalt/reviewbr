import * as fs from "node:fs"; import * as path from "node:path"; import * as os from "node:os";
const D="file:///C:/reviewbr/reviewbr/reviewbr-mcp/dist/services/";
const { StandardCoverageService } = await import(D+"standard_coverage.js");
const { registrarDecisaoDoPesquisador } = await import(D+"method_trail.js");
const { ProjectStateService } = await import(D+"project_state.js");
const base = process.argv[2];
function toy(mut){ const r=fs.mkdtempSync(path.join(base,"toy-")); for(const d of ["agents","standards","methodologies"]) fs.cpSync("C:/reviewbr/.claude/"+d, path.join(r,".claude",d),{recursive:true}); mut&&mut(r); return r;}
function proj(){const p=fs.mkdtempSync(path.join(base,"proj-")); ProjectStateService.init(p,{method:"scoping-prisma-scr",framework:"x",reviewType:"x",topic:"t",phase:"F1"}); return p;}
const muts = {
  real: null,
  sem_condicao_12: (r)=>{const f=path.join(r,".claude/methodologies/scoping-prisma-scr/conformance/prisma-scr.json"); const j=JSON.parse(fs.readFileSync(f)); delete j.items.find(i=>i.id==="12").condicao; fs.writeFileSync(f,JSON.stringify(j));},
  aplica_se_ambos: (r)=>{const f=path.join(r,".claude/methodologies/scoping-prisma-scr/conformance/prisma-scr.json"); const j=JSON.parse(fs.readFileSync(f)); for(const id of ["12","16"]) j.items.find(i=>i.id===id).condicao.aplica_se=["sim","não"]; fs.writeFileSync(f,JSON.stringify(j));},
  manifest_sem_condicoes: (r)=>{const f=path.join(r,".claude/methodologies/scoping-prisma-scr/manifest.json"); const j=JSON.parse(fs.readFileSync(f)); delete j.condicoes; fs.writeFileSync(f,JSON.stringify(j));},
};
for (const [n,m] of Object.entries(muts)) { const r=toy(m); const p=proj(); const w=registrarDecisaoDoPesquisador(r,p,{condicao:"avaliacao_critica",resposta:"não",contribuicao:"Não faremos avaliação crítica: o objetivo é mapear a amplitude do que existe."}); const c=StandardCoverageService.conferir(r,"prisma-scr",undefined,p); console.log(n.padEnd(24),"grava",w.ok,"fracao",c.fracao,"nsa",JSON.stringify(c.nao_se_aplica.map(x=>x.id)),"valid",c.valid, (c.erros||[]).length?("erros "+JSON.stringify(c.erros).slice(0,160)):""); }
