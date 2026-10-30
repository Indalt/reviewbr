import { describe, it, expect } from "vitest";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { MappingCoherenceService } from "../src/services/mapping_coherence.js";
import { StandardsService, Standard } from "../src/services/standards.js";
import { lerMapeamento } from "../src/services/method_mapping.js";

const MCP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = path.resolve(MCP, "..", "..");

/**
 * DEBT-124 — `checkCoverage` verifica se `covered_by` está VAZIO, nunca se está CERTO.
 * Mapeamento apontando o item errado volta verde, e foi assim que o deslocamento do
 * DEBT-045 ficou invisível.
 *
 * O princípio: o sistema NÃO consegue gerar o mapeamento certo (é julgamento, sem referente
 * externo) mas CONSEGUE provar que um proposto está errado. Falsificação é automatizável.
 */
describe("DEBT-124 — o mapeamento é falsificado contra o título oficial", () => {
    const padrao = (itens: Array<{ id: string; title: string }>): Standard => ({
        schemaVersion: 1, id: "teste", name: "PADRÃO DE TESTE", version: "1",
        version_source: "", note: "", structure_warning: "", items_are_top_level_only: false,
        items: itens.map((i) => ({
            ...i, section: "", has_subitems: false, is_subitem: false, parent: "",
        })),
    } as Standard);

    it("ACUSA o rótulo que casa com OUTRO item — a assinatura do deslocamento", () => {
        const std = padrao([
            { id: "24", title: "Registration and protocol" },
            { id: "25", title: "Support" },
        ]);
        const r = MappingCoherenceService.checar(std, [
            { subitem: "F8.3.24", rotulo: "Financiamento", item: "24" },
        ]);
        expect(r.valid).toBe(false);
        expect(r.suspeitos).toHaveLength(1);
        expect(r.suspeitos[0].item_sugerido).toBe("25"); // "Support" ⟷ "Financiamento"
    });

    it("NÃO acusa subitem mais granular que o item — o falso positivo que matou a v1", () => {
        // "Total de registros triados" cobre "Study selection" sem nenhum termo em comum,
        // e está CERTO. A primeira versão desta verificação acusou 89 de 112 pares por
        // exigir termo comum; verificação que acusa 80% é ruído, e ruído esconde o sinal.
        const std = padrao([{ id: "16", title: "Study selection" }]);
        const r = MappingCoherenceService.checar(std, [
            { subitem: "F4.1.1", rotulo: "Total de registros triados", item: "16" },
        ]);
        expect(r.valid).toBe(true);
        expect(r.suspeitos).toEqual([]);
    });

    it("não acusa quando o rótulo casa com MAIS DE UM item — ambiguidade não é prova", () => {
        const std = padrao([
            { id: "11", title: "Study risk of bias assessment" },
            { id: "18", title: "Risk of bias in studies" },
            { id: "21", title: "Reporting biases" },
        ]);
        const r = MappingCoherenceService.checar(std, [
            { subitem: "F6.1.3", rotulo: "Domínios de viés avaliados", item: "11" },
        ]);
        expect(r.suspeitos).toEqual([]);
    });

    it("declara o que NÃO conseguiu conferir, em vez de contar como coerente", () => {
        const std = padrao([{ id: "1", title: "Title" }]);
        const r = MappingCoherenceService.checar(std, [
            { subitem: "F9.9.9", rotulo: "qualquer", item: "99" }, // item inexistente
        ]);
        expect(r.nao_conferidos.length).toBe(1);
        expect(r.nao_conferidos[0]).toMatch(/não existe/);
    });

    it("padrão ausente REPROVA — não há título oficial contra o que conferir", () => {
        const r = MappingCoherenceService.checar(null, []);
        expect(r.valid).toBe(false);
        expect(r.errors[0]).toMatch(/ausente ou ilegível/);
    });

    it("lê os dois formatos de tabela da spec — o de 3 colunas tem o deslocamento", () => {
        // Os pares do DEBT-045 vivem na tabela de 3 colunas (| Fx | rótulo | Item N |),
        // que um regex de 5 colunas não alcança. Ler só um formato esconderia o achado.
        const pares = MappingCoherenceService.extrairPares(
            path.join(REPO, ".claude", "methodologies", "prisma-sr", "spec.md"),
        );
        expect(pares.some((p) => p.subitem === "F0.1.1")).toBe(true);   // 5 colunas
        expect(pares.some((p) => p.subitem === "F8.3.24")).toBe(true);  // 3 colunas
    });
});

/**
 * O estado REAL em disco. Este bloco reprova enquanto o DEBT-045 existir — é o ponto:
 * a verificação vira teste, e o teste falha na hora, em vez de auditoria que decai.
 */
describe("DEBT-045 — o deslocamento real do PRISMA 2020, medido", () => {
    it("o mapeamento da trilha contra o PRISMA 2020 ainda tem suspeitos", () => {
        const std = StandardsService.read(REPO, "prisma-2020");
        // O covered_by é do método (DEBT-142): o do prisma-sr para o PRISMA 2020.
        const r = MappingCoherenceService.checarMetodologia(REPO, "prisma-sr", std, lerMapeamento(REPO, "prisma-sr", "prisma-2020").linhas);

        // Quando o DEBT-045 for corrigido, este número cai a zero e o teste abaixo troca
        // para `toEqual([])`. Enquanto isso, trava o número: não pode AUMENTAR em silêncio.
        // Subiu de 8 para 15 em 09/10/2026, e não em silêncio: a falsificação passou a tratar
        // item e subitens como uma família e a ler também o covered_by, e com isso enxergou o
        // deslocamento do item 15 rumo ao 24 (registro de protocolo), que o DEBT-045 já descrevia.
        expect(r.suspeitos.length).toBeLessThanOrEqual(15);
        // Todo suspeito traz o item sugerido — sinalizar sem apontar o candidato é inútil.
        expect(r.suspeitos.filter((s) => !s.item_sugerido)).toEqual([]);
    });
});
