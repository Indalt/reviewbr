// Sessão 2c, item 3 (DEBT-149, B2) — compara as duas leituras documentadas do PRISMA-S do prisma-sr com o
// mapeamento atual e aplica a regra decidida pelo Vicente em 05/11/2026:
//  - onde as duas leituras CONCORDAM, vale: ponteiro que as duas dão entra; ponteiro do mapeamento atual
//    que nenhuma das duas dá sai; cobertura julgada igual pelas duas substitui a declarada;
//  - onde DIVERGEM, fica o mapeamento atual, e a divergência vai ao Vicente (divergencias_prisma_s.md).
// O trecho de cada ponteiro que fica vem da primeira leitura, ou da segunda quando só ela o dá.
// Grava comparacao_leituras.json e divergencias_prisma_s.md ao lado. Com --aplica, reescreve também o
// mapeamento do prisma-sr (covered_by, trechos e o registro da leitura); a nota e as declarações
// [NÃO COBERTO] só mudam se a comparação pedir, e então o script para e diz o que mudar à mão.
// Uso: node compara_leituras.mjs [--aplica]
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const R = path.resolve(aqui, "..", "..", "..");
const { lerMapeamento } = await import(pathToFileURL(path.join(R, "reviewbr", "reviewbr-mcp", "dist", "services", "method_mapping.js")).href);
const ler = (f) => JSON.parse(fs.readFileSync(path.join(aqui, f), "utf-8"));
const L1 = ler("primeira_leitura.json"), L2 = ler("segunda_leitura.json");
// A BASE da comparação é o mapeamento de antes da leitura (30/10), preso em arquivo: comparar com o
// mapeamento vivo depois de aplicar daria "0 correções" (aconteceu na 2c e foi refeito assim).
const vivo = lerMapeamento(R, "prisma-sr", "prisma-s");
const ARQ = path.join(R, vivo.arquivo);
const base = ler("mapeamento_prisma_s_antes_da_leitura.json");
const mapa = { linhas: new Map(base.items.map((i) => [i.id, { covered_by: i.covered_by ?? [], nao_coberto: i.nao_coberto ?? "" }])) };

const porItem = (L) => new Map(L.itens.map((i) => [i.item, i]));
const [I1, I2] = [porItem(L1), porItem(L2)];
const coberturaAtual = (l) => !l.nao_coberto?.trim() ? "completa" : l.covered_by.length ? "parcial" : "nenhuma";

const itens = [], divergencias = [], correcoes = [];
for (const [id, l] of mapa.linhas) {
    const a = I1.get(id), b = I2.get(id);
    const p1 = new Map(a.ponteiros.map((p) => [p.subitem, p])), p2 = new Map(b.ponteiros.map((p) => [p.subitem, p]));
    const atual = new Set(l.covered_by);
    const todos = [...new Set([...atual, ...p1.keys(), ...p2.keys()])];
    const final = [];
    for (const s of todos) {
        const em1 = p1.has(s), em2 = p2.has(s), naAtual = atual.has(s);
        if (em1 && em2) {
            final.push(s);
            if (!naAtual) correcoes.push({ item: id, subitem: s, tipo: "entra", motivo: "as duas leituras o dão" });
        } else if (!em1 && !em2) {
            // só no mapeamento atual: as duas leituras concordam em que não serve
            correcoes.push({ item: id, subitem: s, tipo: "sai", motivo: "nenhuma das duas leituras o dá" });
        } else {
            if (naAtual) final.push(s);
            const quem = em1 ? "primeira" : "segunda", p = em1 ? p1.get(s) : p2.get(s);
            divergencias.push({ item: id, subitem: s, so_na: quem, trecho: p.trecho, porque: p.porque ?? "", no_mapeamento_atual: naAtual, fica: naAtual ? "fica (é do mapeamento atual)" : "não entra (não é do mapeamento atual)" });
        }
    }
    const c1 = a.cobertura, c2 = b.cobertura, ca = coberturaAtual(l);
    let cobertura = ca;
    if (c1 === c2 && c1 !== ca) { cobertura = c1; correcoes.push({ item: id, subitem: "", tipo: "cobertura", motivo: `as duas leituras julgam "${c1}"; o mapeamento declarava "${ca}"` }); }
    if (c1 !== c2) divergencias.push({ item: id, subitem: "", so_na: "", cobertura: { primeira: c1, segunda: c2, atual: ca }, falta: { primeira: a.falta, segunda: b.falta }, fica: `fica "${ca}" (a do mapeamento atual)` });
    const ordem = (s) => l.covered_by.includes(s) ? l.covered_by.indexOf(s) : 1000 + todos.indexOf(s);
    final.sort((x, y) => ordem(x) - ordem(y));
    const trechos = Object.fromEntries(final.map((s) => [s, (p1.get(s) ?? p2.get(s))?.trecho]).filter(([, t]) => t));
    itens.push({ item: id, atual: l.covered_by, primeira: [...p1.keys()], segunda: [...p2.keys()], final, cobertura: { primeira: c1, segunda: c2, atual: ca, fica: cobertura }, trechos });
}

const resumo = {
    ponteiros: { atual: itens.reduce((n, i) => n + i.atual.length, 0), primeira: itens.reduce((n, i) => n + i.primeira.length, 0), segunda: itens.reduce((n, i) => n + i.segunda.length, 0), final: itens.reduce((n, i) => n + i.final.length, 0) },
    concordam: itens.reduce((n, i) => n + i.primeira.filter((s) => i.segunda.includes(s)).length, 0),
    correcoes: correcoes.length, divergencias: divergencias.length,
};
fs.writeFileSync(path.join(aqui, "comparacao_leituras.json"), JSON.stringify({ resumo, correcoes, divergencias, itens }, null, 2) + "\n");

// O arquivo para o Vicente: os temas das divergências, e cada uma, com o que cada leitura disse e o que ficou.
const semPonto = (s) => (s ?? "").replace(/\.+\s*$/, "");
const deP = divergencias.filter((d) => d.subitem), deC = divergencias.filter((d) => !d.subitem);
const tema = (f) => deP.filter(f).map((d) => `${d.item}→${d.subitem} (só na ${d.so_na})`).join(", ");
const md = [
    "# Divergências entre as duas leituras documentadas do PRISMA-S do prisma-sr",
    "",
    `Sessão 2c, item 3 (decisão de 05/11/2026, B2). Primeira leitura: ${L1.por}, ${L1.em}. Segunda leitura: ${L2.por ?? "agente independente"}, ${L2.em ?? ""}.`,
    "Onde as duas concordam, vale (correções aplicadas, abaixo). Onde divergem, ficou o mapeamento atual — e a decisão é sua.",
    "Os trechos são do enunciado oficial do item (.claude/standards/prisma-s.json), conferidos literais pelo conferidor.",
    "",
    `**Resumo:** ponteiros — mapeamento de 30/10: ${resumo.ponteiros.atual}; primeira leitura: ${resumo.ponteiros.primeira}; segunda: ${resumo.ponteiros.segunda}; concordam: ${resumo.concordam}; depois da comparação: ${resumo.ponteiros.final}. Correções: ${resumo.correcoes}. Divergências: ${resumo.divergencias} (${deP.length} de ponteiro, ${deC.length} de cobertura).`,
    "",
    "## As divergências por tema",
    "",
    `- **Seções do manuscrito (F8.3)** — ${deP.filter((d) => /^F8\.3\./.test(d.subitem)).length}. A segunda leitura não as aponta ("a trilha só dá o título da seção, sem descrever o conteúdo"); a primeira, sim, como lugar do relato. Decidir uma vez vale para todas: ${tema((d) => /^F8\.3\./.test(d.subitem))}.`,
    `- **Suplementos (SUP)** — ${deP.filter((d) => /^SUP\./.test(d.subitem)).length}: ${tema((d) => /^SUP\./.test(d.subitem))}.`,
    `- **Campos de coleta** — ${deP.filter((d) => !/^(F8\.3\.|SUP\.)/.test(d.subitem)).length}: ${tema((d) => !/^(F8\.3\.|SUP\.)/.test(d.subitem))}.`,
    `- **Cobertura** — ${deC.length}: ${deC.map((d) => `${d.item} (primeira "${d.cobertura.primeira}", segunda "${d.cobertura.segunda}")`).join(", ")}. Nos itens que a segunda julga parciais, ela nomeia o que a trilha não registra; se você concordar, a declaração [NÃO COBERTO] do item muda, e a fração cai.`,
    "",
    "## Correções aplicadas (as duas leituras concordam e diferem do mapeamento de 30/10)",
    "",
    ...(correcoes.length ? correcoes.map((c) => `- ${c.item}${c.subitem ? ` → ${c.subitem}` : ""}: ${c.tipo} — ${c.motivo}.`) : ["- nenhuma."]),
    "",
    "## Divergências — para você decidir",
    "",
    "| item | subitem | só na | trecho dado | por quê, segundo quem o deu | no mapeamento de 30/10? | o que ficou |",
    "|---|---|---|---|---|---|---|",
    ...divergencias.filter((d) => d.subitem).map((d) => `| ${d.item} | ${d.subitem} | ${d.so_na} leitura | "${d.trecho}" | ${d.porque} | ${d.no_mapeamento_atual ? "sim" : "não"} | ${d.fica} |`),
    "",
    ...deC.map((d) => `- **${d.item}, cobertura:** primeira "${d.cobertura.primeira}", segunda "${d.cobertura.segunda}", mapeamento de 30/10 "${d.cobertura.atual}" — ${d.fica}. Falta, segundo a primeira: ${semPonto(d.falta.primeira) || "—"}. Segundo a segunda: ${semPonto(d.falta.segunda) || "—"}.`),
];
fs.writeFileSync(path.join(aqui, "divergencias_prisma_s.md"), md.join("\n") + "\n");
console.log(JSON.stringify(resumo));
for (const c of correcoes) console.log("CORREÇÃO", c.item, c.subitem, c.tipo, "—", c.motivo);
for (const d of divergencias) console.log("DIVERGE ", d.item, d.subitem || "(cobertura)", d.subitem ? `só na ${d.so_na}; ${d.fica}` : JSON.stringify(d.cobertura));

if (process.argv.includes("--aplica")) {
    const coberturaMuda = correcoes.filter((c) => c.tipo === "cobertura");
    if (coberturaMuda.length) { console.error("PARE: a comparação muda declaração de cobertura — reescreva o [NÃO COBERTO] à mão:", coberturaMuda.map((c) => c.item).join(", ")); process.exit(1); }
    const j = JSON.parse(fs.readFileSync(ARQ, "utf-8"));
    for (const linha of j.items) {
        const i = itens.find((x) => x.item === linha.id);
        linha.covered_by = i.final;
        if (i.final.length) linha.trechos = i.trechos; else delete linha.trechos;
    }
    j.leitura_documentada = { em: L1.em, por: `primeira leitura: ${L1.por}; segunda, independente: ${L2.por ?? "agente"}`, registro: ".claude/maintenance/sessao_2c/divergencias_prisma_s.md" };
    const saida = {}; for (const [k, v] of Object.entries(j)) { if (k === "leitura_documentada") continue; saida[k] = v; if (k === "conferencia_por_palavras" || (k === "note" && !("conferencia_por_palavras" in j))) saida.leitura_documentada = j.leitura_documentada; }
    fs.writeFileSync(ARQ, JSON.stringify(saida, null, 2) + "\n");
    console.log("aplicado:", mapa.arquivo);
}
