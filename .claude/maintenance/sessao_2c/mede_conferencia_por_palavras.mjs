// Sessão 2c (DEBT-149) — mede quanto a conferência por palavras enxerga em cada mapeamento que um
// método declara, pelo mesmo procedimento de preparo/poder_plantado.mjs (31/10/2026): para cada par
// (subitem, item) do mapeamento real que hoje não é suspeito, planta o subitem em cada OUTRO item
// (linha de checklist, fora da família do item certo) e vê se a conferência acusa o plantio.
// Imprime também a impressão dos pares (impressaoDosPares, a mesma função que o relatório usa) —
// é ela que diz, depois, se a medida gravada é do mapeamento de hoje.
// Só lê; nada é gravado. Chama o dist recompilado.
// Uso: node mede_conferencia_por_palavras.mjs [metodo:padrao ...]   (sem argumento: todos os declarados)
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const R = path.resolve(aqui, "..", "..", "..");
const dist = (f) => import(pathToFileURL(path.join(R, "reviewbr", "reviewbr-mcp", "dist", "services", f)).href);
const { StandardsService } = await dist("standards.js");
const { MappingCoherenceService } = await dist("mapping_coherence.js");
const { lerMapeamento, impressaoDosPares } = await dist("method_mapping.js");

let alvos = process.argv.slice(2).map((a) => a.split(":"));
if (!alvos.length) {
    const base = path.join(R, ".claude", "methodologies");
    for (const m of fs.readdirSync(base).sort()) {
        const man = JSON.parse(fs.readFileSync(path.join(base, m, "manifest.json"), "utf-8"));
        for (const p of man.conformance?.standards ?? []) alvos.push([m, p]);
    }
}

for (const [m, p] of alvos) {
    const std = StandardsService.read(R, p);
    const mapa = lerMapeamento(R, m, p, std).linhas;
    const { pares: n, impressao } = impressaoDosPares(mapa);
    const fam = new Map(std.items.map((i) => [i.id, i.parent || i.id]));
    const linhas = std.items.filter((i) => !i.has_subitems).map((i) => i.id);
    const pares = []; for (const [id, l] of mapa) for (const s of l.covered_by) pares.push([s, id]);
    const susp0 = new Set(MappingCoherenceService.checarMetodologia(R, m, std, mapa).suspeitos.map((s) => s.subitem + "→" + s.item_declarado));
    let tent = 0, acus = 0, acusCerto = 0; const subs = new Set(), detect = new Set();
    for (const [s, certo] of pares) {
        if (susp0.has(s + "→" + certo)) continue;
        subs.add(s);
        for (const j of linhas) {
            if (fam.get(j) === fam.get(certo)) continue;
            tent++;
            const r = MappingCoherenceService.checarMetodologia(R, m, std, new Map([[j, { id: j, covered_by: [s], nao_coberto: "", nao_se_aplica: "" }]]));
            const hit = r.suspeitos.find((x) => x.subitem === s && x.item_declarado === j);
            if (hit) { acus++; detect.add(s); if (fam.get(hit.item_sugerido) === fam.get(certo)) acusCerto++; }
        }
    }
    console.log(JSON.stringify({ metodo: m, padrao: p, pares: n, impressao, suspeitos_hoje: susp0.size, plantadas: tent, percebidas: acus,
        pct: tent ? +(100 * acus / tent).toFixed(1) : null, sugestao_certa: acusCerto, subitens_acusaveis: `${detect.size}/${subs.size}` }));
}
