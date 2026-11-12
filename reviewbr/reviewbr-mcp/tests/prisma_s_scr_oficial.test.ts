import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { MappingCoherenceService } from "../src/services/mapping_coherence.js";
import { StandardCoverageService } from "../src/services/standard_coverage.js";
import { StandardsService } from "../src/services/standards.js";
import { lerMapeamento, impressaoDosPares, LinhaDoMapeamento } from "../src/services/method_mapping.js";
import { textoDaSpec } from "../src/services/method_trail.js";

const MCP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = path.resolve(MCP, "..", "..");
const cru = (id: string) => JSON.parse(fs.readFileSync(path.join(REPO, ".claude", "standards", `${id}.json`), "utf-8"));
/** O mapeamento é do método que declara o padrão (DEBT-142). */
const mapa = (metodo: string, padrao: string) => lerMapeamento(REPO, metodo, padrao).linhas;

/**
 * DEBT-128 — os 16 títulos do PRISMA-S vinham da trilha do ReviewBR, não da norma, e o
 * mapeamento seguia a numeração da trilha. Em 30/10/2026 os tópicos e enunciados foram
 * transcritos do checklist oficial (OSF y765x) e conferidos contra a Tabela 1 do artigo de 2021;
 * o covered_by e a coluna da spec foram refeitos contra os enunciados.
 */
describe("PRISMA-S — a norma, não a trilha (DEBT-128)", () => {
    const std = StandardsService.read(REPO, "prisma-s")!;

    it("os 16 tópicos são os do checklist oficial, nas quatro seções oficiais", () => {
        expect(std.titulos_oficiais).toBe(true);
        expect(std.items.map((i) => i.title)).toEqual([
            "Database name", "Multi-database searching", "Study registries", "Online resources and browsing",
            "Citation searching", "Contacts", "Other methods", "Full search strategies", "Limits and restrictions",
            "Search filters", "Prior work", "Updates", "Dates of searches", "Peer review", "Total Records", "Deduplication",
        ]);
        const secao = (s: string) => std.items.filter((i) => i.section === s).map((i) => i.id);
        expect(secao("INFORMATION SOURCES AND METHODS")).toEqual(["S1", "S2", "S3", "S4", "S5", "S6", "S7"]);
        expect(secao("SEARCH STRATEGIES")).toEqual(["S8", "S9", "S10", "S11", "S12", "S13"]);
        expect(secao("PEER REVIEW")).toEqual(["S14"]);
        expect(secao("MANAGING RECORDS")).toEqual(["S15", "S16"]);
    });

    it("cada item traz o enunciado oficial, e a fonte dele está no version_source", () => {
        const itens = cru("prisma-s").items as Array<{ id: string; text: string }>;
        expect(itens.every((i) => i.text?.trim().length > 0)).toBe(true);
        const texto = (id: string) => itens.find((i) => i.id === id)!.text;
        expect(texto("S8")).toBe("Include the search strategies for each database and information source, copied and pasted exactly as run.");
        expect(texto("S13")).toBe("For each search strategy, provide the date when the last search occurred.");
        expect(std.version_source).toMatch(/osf\.io\/y765x/);
        expect(std.version_source).toMatch(/s13643-020-01542-z\/tables\/1/);
    });

    for (const metodo of ["prisma-sr", "scoping-prisma-scr"]) {
        it(`a coluna 'Item PRISMA-S' da spec que o ${metodo} lê declara o mesmo mapeamento que o covered_by dele`, () => {
            // As duas declarações não se verificam mutuamente (mapping_coherence.ts) — mas não podem
            // divergir: a spec é o que o agente lê, o covered_by do método é o que a conferência lê.
            // O scoping lê a spec do prisma-sr por `extends` e guarda a sua cópia do mapeamento (DEBT-142);
            // desde 08/11/2026 a cópia segue as correções da leitura documentada do prisma-sr (sessão 2c).
            // Os suplementos (SUP) entram desde a 2c, porque as duas leituras os apontaram; "Todos" (o
            // próprio checklist) não é ponteiro.
            const inverso = new Map<string, string[]>();
            for (const it of std.items) for (const s of mapa(metodo, "prisma-s").get(it.id)?.covered_by ?? []) (inverso.get(s) ?? inverso.set(s, []).get(s)!).push(it.id);
            const naSpec = new Map<string, string[]>();
            for (const l of textoDaSpec(REPO, metodo).split(/\r?\n/)) {
                const m = l.match(/^\|\s*(F[0-9][A-Za-z0-9_.-]*|SUP\.[0-9]+)\s*\|/);
                if (!m) continue;
                const celulas = l.split("|");
                const ultima = celulas[celulas.length - 2];
                const ss = [...ultima.matchAll(/\bS(\d+)\b/g)].map((x) => `S${x[1]}`);
                expect(ultima, `${m[1]}: intervalo na coluna — escreva os itens um a um`).not.toMatch(/S\d+\s*[–-]\s*S\d+/);
                if (ss.length) naSpec.set(m[1], ss);
            }
            const ordena = (mp: Map<string, string[]>) => [...mp].map(([k, v]) => `${k}:${[...v].sort().join(",")}`).sort();
            expect(ordena(naSpec)).toEqual(ordena(inverso));
        });
    }
});

/**
 * DEBT-149 — o controle positivo que o prompt da sessão 1 pediu: com os títulos oficiais e o
 * mapeamento ANTIGO, a conferência por palavras devia acusar os ponteiros de S11 e S13, que o
 * DEBT-128 já mostrara deslocados. Não acusa. Desde 05/11/2026 ela não trava (decisão B1): este
 * bloco é a FONTE da medida 'erros_conhecidos' que o mapeamento do prisma-sr grava e o relatório
 * cita (2 de 58). Se a conferência mudar, o teste e a medida mudam juntos.
 */
describe("o que a conferência por palavras percebe no PRISMA-S antigo (DEBT-149) — a medida que o relatório cita", () => {
    // covered_by de antes do remapeamento (git show d64067d:.claude/standards/prisma-s.json).
    const ANTIGO: Record<string, string[]> = {
        S1: ["F2.1.1.1", "F2.1.1.2", "F2.1.1.3", "F2.1.1.4", "F8.3.6"],
        S2: ["F2.1.1.1", "F2.1.1.2", "F8.3.6"],
        S3: ["F2.1.1.2", "F2.2.1", "F2.2.2", "F2.2.3", "F8.3.6"],
        S4: ["F2.1.1.2", "F2.2.4", "F2.2.5", "F8.3.6"],
        S5: ["F2.2.6", "F8.3.6"],
        S6: ["F2.2.7", "F8.3.6"],
        S7: ["F2.1.1.5", "F2.1.1.6", "F8.3.6"],
        S8: ["F2.1.1.7", "F2.1.2.9", "F8.3.6"],
        S9: ["F2.1.2.1", "F8.3.6"],
        S10: ["F1.3.1.5", "F2.1.2.2"],
        S11: ["F1.3.1.6", "F1.3.2.4", "F2.1.2.3"],
        S12: ["F1.2.2", "F1.2.4", "F1.2.6", "F1.2.8", "F1.2.10", "F1.4.1", "F1.4.2", "F1.4.4", "F1.4.5", "F2.1.2.4", "F2.1.2.6", "F2.1.2.8", "F2.1.3.1", "F2.1.3.2", "F2.1.3.3", "F8.3.7"],
        S13: ["F1.4.3", "F2.1.2.5", "F8.3.7"],
        S14: ["F2.1.2.7", "F8.3.7"],
        S15: ["F1.3.2.5", "F3.1.1", "F3.1.2", "F3.1.3", "F3.1.4", "F3.1.5", "F3.1.6", "F3.1.7", "F3.1.8", "F3.1.9", "F3.1.10"],
        S16: ["F1.3.2.6", "F2.1.3.4", "F4.2.2", "F8.1.7"],
    };
    const oficial = StandardsService.read(REPO, "prisma-s")!;
    const antigo = new Map<string, LinhaDoMapeamento>(
        Object.entries(ANTIGO).map(([id, cb]) => [id, { id, covered_by: cb, nao_coberto: "", nao_se_aplica: "" }]),
    );
    const r = MappingCoherenceService.checarMetodologia(REPO, "prisma-sr", oficial, antigo);

    it("acusa só 2 pares — e nenhum dos ponteiros de S11 ('Prior work') e S13 ('Dates of searches')", () => {
        expect(r.suspeitos.map((s) => `${s.subitem}→${s.item_declarado}:${s.item_sugerido}`))
            .toEqual(["F2.1.3.1→S12:S15", "F4.2.2→S16:S15"]);
        expect(r.suspeitos.filter((s) => s.item_declarado === "S11" || s.item_declarado === "S13")).toEqual([]);
    });

    it("dos 70 pares antigos, 58 mudaram no remapeamento de 30/10 e 1 mais na leitura documentada de 06/11 — a conferência viu 2", () => {
        let total = 0; const fora: string[] = [];
        const atual = mapa("prisma-sr", "prisma-s");
        for (const it of oficial.items) for (const s of ANTIGO[it.id]) { total++; if (!(atual.get(it.id)?.covered_by ?? []).includes(s)) fora.push(`${it.id}→${s}`); }
        // 58 saíram em 30/10 (DEBT-128); S1→F2.1.1.3 saiu em 06/11, quando as duas leituras concordaram (sessão 2c).
        expect([total, fora.length]).toEqual([70, 59]);
        expect(fora).toContain("S1→F2.1.1.3");
    });

    it("a medida gravada no mapeamento do prisma-sr é a que este bloco mede: 2 de 58", () => {
        const medida = lerMapeamento(REPO, "prisma-sr", "prisma-s").medida!;
        // O número gravado é o que a conferência acusa no mapeamento antigo, medido aqui.
        expect(medida.erros_conhecidos).toMatchObject({ total: 58, percebidos: r.suspeitos.length });
        expect(medida.erros_conhecidos?.fonte).toMatch(/tests\/prisma_s_scr_oficial\.test\.ts/);
    });
});

/**
 * DEBT-055 — a spec do escopo não mapeava subitem nenhum a item nenhum do PRISMA-ScR: os 22
 * covered_by estavam vazios. Mapeado em 30/10/2026 contra o checklist oficial, no formato atual
 * (antes do DEBT-142); o que a trilha não coleta ficou declarado, não encaixado.
 */
describe("PRISMA-ScR — os 22 itens contra a trilha do scoping (DEBT-055)", () => {
    const r = StandardCoverageService.conferir(REPO, "prisma-scr");
    const c = r.conferencia_por_metodo[0];

    it("nenhuma omissão silenciosa: toda linha tem correspondência ou está declarada [NÃO COBERTO]", () => {
        expect(r.declarado_por).toEqual(["scoping-prisma-scr"]);
        expect(r.orphans).toEqual([]);
        // DEBT-026 (12/11/2026): o 14 passou a [NÃO COBERTO] parcial — nenhuma tool grava o código EX.
        expect(r.nao_coberto.map((x) => x.id)).toEqual(["3", "6", "10", "11", "12", "13", "14", "16", "22"]);
        expect(r.nao_se_aplica).toEqual([]);
    });

    it("nenhum ponteiro para subitem que a trilha não define, nem para a F6, desligada no escopo", () => {
        expect(c.subitens_inexistentes).toEqual([]);
        expect(c.em_etapa_que_nao_se_aplica).toEqual([]);
    });

    // Até a sessão 2b ficavam só declarados, à espera do item condicional (DEBT-142). Agora dependem
    // da condição do método; a resposta do projeto está em condicionais_em_uso.test.ts.
    it("os condicionais 12 e 16 ('If done') dependem da condição 'avaliacao_critica' do método, sem ponteiro para a F6 (DEBT-150)", () => {
        for (const id of ["12", "16"]) {
            const it = mapa("scoping-prisma-scr", "prisma-scr").get(id)!;
            expect(it.covered_by, id).toEqual([]);
            expect(it.condicao, id).toEqual({ id: "avaliacao_critica", aplica_se: ["sim"] });
            expect(it.nao_coberto, id).toMatch(/condicional/);
            // Com "sim", a trilha do escopo não tem onde registrar a avaliação: é do DEBT-151.
            expect(it.nao_coberto, id).toMatch(/DEBT-151/);
        }
    });

    it("cada item traz o enunciado oficial", () => {
        const itens = cru("prisma-scr").items as Array<{ id: string; text: string }>;
        expect(itens).toHaveLength(22);
        expect(itens.every((i) => i.text?.trim().length > 0)).toBe(true);
        expect(itens.find((i) => i.id === "1")!.text).toBe("Identify the report as a scoping review.");
        expect(itens.find((i) => i.id === "12")!.text).toMatch(/^If done, provide a rationale for conducting a critical appraisal/);
    });

    it("a conferência por palavras acusa 4 pares que a leitura do enunciado confirma — e não reprova mais: 13/22 (o 14 declarado parcial pelo DEBT-026), valid true (DEBT-149)", () => {
        // Até a 2c, os 4 falsos positivos reprovavam o padrão e contestavam 7 e 14 (12/22): os dois
        // projetos de escopo paravam na F8. Desde 05/11/2026 o suspeito é pedido de leitura.
        expect(c.conferencia_por_palavras.suspeitos.map((s) => `${s.subitem}→${s.item_declarado}:${s.item_sugerido}`))
            .toEqual(["F2.1.2.1→7:8", "F2.2.5→7:8", "F5.2.5.1→11:22", "F8.1.5→14:1"]);
        expect(r.contestados).toEqual([]);
        expect(r.errors).toEqual([]);
        expect(r.valid).toBe(true);
        expect(r.fracao).toBe("13/22"); // DEBT-026: o 14 passou a [NÃO COBERTO] parcial
        expect(r.avisos.join(" ")).toMatch(/\[scoping-prisma-scr\] 4 par\(es\) suspeito\(s\) pela conferência por palavras — pedido de leitura/);
        // ... e o porquê da etapa volta a ter o item 7. O 14 saiu dele em 12/11/2026: declarado
        // [NÃO COBERTO] parcial (DEBT-026), ele deixa de ser contado como servido por etapa.
        expect(Object.values(c.itens_por_etapa).flat()).toEqual(expect.arrayContaining(["7"]));
        expect(Object.values(c.itens_por_etapa).flat()).not.toContain("14");
    });

    it("sem mexer no mapeamento: os pares são os mesmos que a medida de 31/10/2026 mediu", () => {
        const m = lerMapeamento(REPO, "scoping-prisma-scr", "prisma-scr");
        expect(impressaoDosPares(m.linhas)).toEqual({ pares: 134, impressao: "3fc9adcac6705cda1f56086f27c765e1c13238d7936ecff36103b38d6cda4e39" });
        expect(m.medida?.impressao).toBe("3fc9adcac6705cda1f56086f27c765e1c13238d7936ecff36103b38d6cda4e39");
    });
});
