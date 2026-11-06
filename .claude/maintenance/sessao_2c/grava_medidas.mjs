// Sessão 2c (DEBT-149) — grava, no mapeamento de cada método, a medida de quanto a conferência por
// palavras enxerga nele (campo `conferencia_por_palavras`, MedidaDaConferenciaSchema em
// method_mapping.ts). Antes de gravar, confere que a impressão dos pares de hoje é a do mapeamento
// medido: medida de outro mapeamento não se grava como medida deste. Os números vêm de:
//  - preparo/poder_plantado.mjs (31/10/2026), refeito na abertura da 2c com o mesmo resultado, e de
//    mede_conferencia_por_palavras.mjs (05/11/2026), que reproduz os três de 31/10;
//  - para o PRISMA 2020, dos controles do preparo (resultado_agentes.json, chave `controles`),
//    conferidos par a par na 2c contra os 15 suspeitos que o dist acusa hoje (preparo/roda.mjs).
// Uso: node grava_medidas.mjs   (reescreve só os 5 arquivos abaixo; formato JSON com 2 espaços)
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const R = path.resolve(aqui, "..", "..", "..");
const { lerMapeamento, impressaoDosPares } = await import(pathToFileURL(path.join(R, "reviewbr", "reviewbr-mcp", "dist", "services", "method_mapping.js")).href);

const PLANTIO_31_10 = { medida_em: "2026-10-31", script: ".claude/maintenance/sessao_2c/preparo/poder_plantado.mjs" };
const MEDIDAS = [
    ["prisma-sr", "prisma-s", {
        ...PLANTIO_31_10, pares_medidos: 59, impressao: "56c1caf0dd658965605d6bd653e5f726e2e7f7481b078c6b215fc58324ec78ec",
        trocas: { plantadas: 885, percebidas: 30 },
        erros_conhecidos: {
            total: 58, percebidos: 2,
            fonte: "os 58 dos 70 pares do mapeamento anterior a 30/10/2026 que o remapeamento contra os enunciados mudou (DEBT-128); " +
                "percebeu F2.1.3.1→S12 e F4.2.2→S16, nenhum de S11 nem de S13 — tests/prisma_s_scr_oficial.test.ts",
        },
    }],
    ["prisma-sr", "prisma-p", {
        ...PLANTIO_31_10, pares_medidos: 81, impressao: "4d349aaece2da2079716962c5c39e7c6b1bbe729b6af3c86f744a8d90c34aa3b",
        trocas: { plantadas: 1966, percebidas: 284 },
    }],
    ["prisma-sr", "prisma-2020", {
        medida_em: "2026-10-31", script: ".claude/maintenance/sessao_2c/preparo/roda.mjs",
        pares_medidos: 146, impressao: "4b7ef3d2f10b4778d609c25f1b5fd85d0e62ed71c264acf4f218ce312598a63a",
        erros_conhecidos: {
            total: 23, percebidos: 15,
            fonte: "23 pares deslocados com fonte nos achados DEBT-012, DEBT-045 e DEBT-124 (preparo da 2c, resultado_agentes.json, chave " +
                "controles), 3 deles de destino contestado (F5.2.5.1–3, percebidos) e 1 incerto (F8.3.27, não percebido): sem esses, 12 de 19; " +
                "escapam F0.2.5, F7.3.1, F7.3.2, F8.3.14 e F8.4.1–3",
        },
    }],
    ["scoping-prisma-scr", "prisma-scr", {
        ...PLANTIO_31_10, pares_medidos: 134, impressao: "3fc9adcac6705cda1f56086f27c765e1c13238d7936ecff36103b38d6cda4e39",
        trocas: { plantadas: 2730, percebidas: 357 },
    }],
    ["scoping-prisma-scr", "prisma-s", {
        medida_em: "2026-11-05", script: ".claude/maintenance/sessao_2c/mede_conferencia_por_palavras.mjs",
        pares_medidos: 59, impressao: "56c1caf0dd658965605d6bd653e5f726e2e7f7481b078c6b215fc58324ec78ec",
        trocas: { plantadas: 885, percebidas: 30 },
    }],
];

for (const [m, p, medida] of MEDIDAS) {
    const atual = impressaoDosPares(lerMapeamento(R, m, p).linhas);
    if (atual.impressao !== medida.impressao || atual.pares !== medida.pares_medidos) {
        console.error(`RECUSADO ${m}/${p}: o mapeamento de hoje (${atual.pares} pares, ${atual.impressao}) não é o medido`);
        process.exitCode = 1;
        continue;
    }
    const arq = path.join(R, ".claude", "methodologies", m, "conformance", `${p}.json`);
    const j = JSON.parse(fs.readFileSync(arq, "utf-8"));
    // `conferencia_por_palavras` logo depois da `note`, antes dos itens.
    const saida = {};
    for (const [k, v] of Object.entries(j)) { if (k === "conferencia_por_palavras") continue; saida[k] = v; if (k === "note") saida.conferencia_por_palavras = medida; }
    if (!("conferencia_por_palavras" in saida)) saida.conferencia_por_palavras = medida;
    fs.writeFileSync(arq, JSON.stringify(saida, null, 2) + "\n");
    console.log("gravado:", path.relative(R, arq));
}
