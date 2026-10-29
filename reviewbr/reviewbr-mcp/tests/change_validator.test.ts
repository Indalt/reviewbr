import { describe, it, expect } from "vitest";
import { ChangeValidator, ChangeType, ChangeProposalSchema } from "../src/services/change_validator.js";

const gate = new ChangeValidator();

describe("RV-11 — o caso que define a regra: sem tipo declarado, reprova", () => {
    it("REPROVA submissão sem change_type", () => {
        const r = gate.validateRaw({ summary: "mexer em algumas coisas", targets: ["src/index.ts"] });
        expect(r.valid).toBe(false);
        expect(r.change_type).toBeNull();
        expect(r.errors[0]).toMatch(/SEM tipo declarado/);
        // a mensagem precisa NOMEAR os tipos admitidos — reprovar sem dizer o que fazer não serve
        expect(r.errors[0]).toMatch(/CORRECAO \| CONFORMIDADE \| EXTENSAO/);
    });

    it("REPROVA tipo inventado (enum é fechado)", () => {
        const r = gate.validateRaw({ summary: "melhoria geral", change_type: "MELHORIA" });
        expect(r.valid).toBe(false);
        expect(r.change_type).toBeNull();
    });

    it("REPROVA a si mesmo: a própria RV-11 submetida sem tipo", () => {
        // auto-aplicação — não há caminho de exceção para a regra que introduz a regra
        const r = gate.validateRaw({
            summary: "introduzir o gate RV-11 e o agente de manutenção metodológica",
            targets: ["src/services/change_validator.ts"]
        });
        expect(r.valid).toBe(false);
        expect(r.errors[0]).toMatch(/SEM tipo declarado/);
    });

    it("APROVA a própria RV-11 quando submetida como EXTENSAO com protocolo travado", () => {
        const r = gate.validateRaw({
            summary: "introduzir o gate RV-11 e o agente de manutenção metodológica",
            change_type: ChangeType.EXTENSAO,
            targets: ["src/services/change_validator.ts", ".claude/agents/maintainer.md"],
            protocol_path: ".claude/maintenance/PROTOCOLO_revisao_reviewbr.md",
            protocol_locked: true
        });
        expect(r.valid).toBe(true);
        expect(r.change_type).toBe(ChangeType.EXTENSAO);
    });
});

describe("RV-11 — CORRECAO exige falha documentada E reproduzível", () => {
    it("REPROVA sem falha documentada nem reprodução", () => {
        const r = gate.validateRaw({ summary: "arrumar o dedupe", change_type: ChangeType.CORRECAO });
        expect(r.valid).toBe(false);
        expect(r.errors).toHaveLength(2);
        expect(r.requirement).toMatch(/falha documentada e reproduzível/);
    });

    it("REPROVA falha documentada SEM reprodução (impressão não é defeito)", () => {
        const r = gate.validateRaw({
            summary: "arrumar o dedupe",
            change_type: ChangeType.CORRECAO,
            documented_failure: "o dedupe parece deixar passar duplicata de DOI"
        });
        expect(r.valid).toBe(false);
        expect(r.errors).toHaveLength(1);
        expect(r.errors[0]).toMatch(/reproduction/);
    });

    it("APROVA correção com falha documentada e reprodução", () => {
        const r = gate.validateRaw({
            summary: "corrigir caminho do catálogo de repositórios",
            change_type: ChangeType.CORRECAO,
            targets: ["src/services/config_service.ts"],
            documented_failure:
                "promete carregar repositories_catalog.json do diretório de dados; resolve caminho relativo ao cwd e falha quando o servidor sobe de outro diretório",
            reproduction: "subir o MCP a partir de C:\\ e chamar validate_repository → catálogo vazio, 0 repositórios"
        });
        expect(r.valid).toBe(true);
        expect(r.errors).toHaveLength(0);
    });
});

describe("RV-11 — CONFORMIDADE exige padrão, versão e item", () => {
    it("REPROVA sem nada dos três", () => {
        const r = gate.validateRaw({ summary: "atualizar para o padrão novo", change_type: ChangeType.CONFORMIDADE });
        expect(r.valid).toBe(false);
        expect(r.errors).toHaveLength(3);
    });

    it("REPROVA padrão sem versão — é o que impede saber o que revisar depois", () => {
        const r = gate.validateRaw({
            summary: "aderir ao PRISMA novo",
            change_type: ChangeType.CONFORMIDADE,
            standard: "PRISMA",
            standard_item: "item 16a"
        });
        expect(r.valid).toBe(false);
        expect(r.errors[0]).toMatch(/standard_version/);
    });

    it("REPROVA padrão+versão sem item (citar o padrão inteiro não delimita)", () => {
        const r = gate.validateRaw({
            summary: "aderir ao PRISMA 2020",
            change_type: ChangeType.CONFORMIDADE,
            standard: "PRISMA",
            standard_version: "2020"
        });
        expect(r.valid).toBe(false);
        expect(r.errors[0]).toMatch(/standard_item/);
    });

    it("APROVA conformidade completa", () => {
        const r = gate.validateRaw({
            summary: "ajustar o fluxograma ao item 16a",
            change_type: ChangeType.CONFORMIDADE,
            standard: "PRISMA",
            standard_version: "2020",
            standard_item: "item 16a"
        });
        expect(r.valid).toBe(true);
    });
});

describe("RV-11 — EXTENSAO exige protocolo próprio TRAVADO", () => {
    it("REPROVA sem protocolo", () => {
        const r = gate.validateRaw({ summary: "módulo fontes-primarias", change_type: ChangeType.EXTENSAO });
        expect(r.valid).toBe(false);
        expect(r.errors).toHaveLength(2);
        expect(r.requirement).toMatch(/protocolo próprio, travado/);
    });

    it("REPROVA protocolo em rascunho — é a deriva que a regra existe para impedir", () => {
        const r = gate.validateRaw({
            summary: "módulo fontes-primarias",
            change_type: ChangeType.EXTENSAO,
            protocol_path: ".claude/maintenance/PROPOSTA_modulo_fontes_primarias.md",
            protocol_locked: false
        });
        expect(r.valid).toBe(false);
        expect(r.errors[0]).toMatch(/TRAVADO/);
    });

    it("REPROVA protocolo cujo travamento não foi declarado (ausente ≠ travado)", () => {
        const r = gate.validateRaw({
            summary: "módulo fontes-primarias",
            change_type: ChangeType.EXTENSAO,
            protocol_path: ".claude/maintenance/PROPOSTA_modulo_fontes_primarias.md"
        });
        expect(r.valid).toBe(false);
        expect(r.errors[0]).toMatch(/TRAVADO/);
    });
});

describe("RV-11 — o gate não decide por julgamento (RV-06)", () => {
    it("é determinístico: mesma entrada, mesma saída", () => {
        const proposal = {
            summary: "x",
            change_type: ChangeType.CORRECAO,
            documented_failure: "y",
            reproduction: "z"
        };
        const a = gate.validateRaw(proposal);
        const b = gate.validateRaw(proposal);
        expect(a).toEqual(b);
    });

    it("não infere tipo a partir do conteúdo: proposta com falha documentada mas sem tipo continua reprovada", () => {
        // o gate poderia "adivinhar" CORRECAO pelos campos preenchidos — de propósito, não adivinha
        const r = gate.validateRaw({
            summary: "x",
            documented_failure: "promete A, faz B",
            reproduction: "rodar tal comando"
        });
        expect(r.valid).toBe(false);
        expect(r.errors[0]).toMatch(/SEM tipo declarado/);
    });
});

/**
 * A ORDEM de correção, que o gate declarava e não conferia.
 *
 * A análise de conflito apurou 13 dependências de ordem e 1 exclusão mútua entre os pares
 * que tocam a mesma linha, e gravou isso no campo `depende_de` de cada achado. Era dado que
 * ninguém consultava no momento de decidir — a mesma classe de falha que o sistema
 * diagnostica em si desde o começo. Corrigir fora de ordem gera retrabalho já mapeado:
 * acrescentar gates ao manifest antes de existir quem os leia não muda comportamento algum.
 */
describe("ordem de correção — o pré-requisito é conferido, não só declarado", () => {
    const base = {
        summary: "teste", change_type: "CORRECAO" as const,
        documented_failure: "promete A, faz B", reproduction: "rodar tal comando", targets: [],
    };
    const prop = (addresses: string[]) => ChangeProposalSchema.parse({ ...base, addresses });

    const backlog = (findings: Array<{ id: string; status: string; summary: string; depende_de?: string[] }>) =>
        ({ status: "OK" as const, debt: { findings } });

    const COM_DEP = backlog([
        { id: "DEBT-A", status: "ABERTO", summary: "o pré-requisito" },
        { id: "DEBT-B", status: "ABERTO", summary: "depende do A", depende_de: ["DEBT-A"] },
    ]);

    it("REPROVA corrigir B enquanto o pré-requisito A está aberto", () => {
        const r = gate.checkOrder(prop(["DEBT-B"]), COM_DEP);
        expect(r.ok).toBe(false);
        expect(r.errors.join(" ")).toMatch(/FORA DE ORDEM/);
        expect(r.errors.join(" ")).toMatch(/DEBT-A/);
    });

    it("ACEITA quando o pré-requisito foi RESOLVIDO", () => {
        const r = gate.checkOrder(prop(["DEBT-B"]), backlog([
            { id: "DEBT-A", status: "RESOLVIDO", summary: "o pré-requisito" },
            { id: "DEBT-B", status: "ABERTO", summary: "depende do A", depende_de: ["DEBT-A"] },
        ]));
        expect(r.ok).toBe(true);
    });

    it("ACEITA quando o pré-requisito foi RECUSADO — decisão registrada também satisfaz", () => {
        // o que não pode é o pré-requisito seguir em aberto, sem ninguém ter decidido nada
        const r = gate.checkOrder(prop(["DEBT-B"]), backlog([
            { id: "DEBT-A", status: "RECUSADO", summary: "fora de escopo" },
            { id: "DEBT-B", status: "ABERTO", summary: "depende do A", depende_de: ["DEBT-A"] },
        ]));
        expect(r.ok).toBe(true);
    });

    it("ACEITA corrigir o próprio pré-requisito — controle positivo", () => {
        expect(gate.checkOrder(prop(["DEBT-A"]), COM_DEP).ok).toBe(true);
    });

    it("REPROVA achado que não existe no backlog", () => {
        const r = gate.checkOrder(prop(["DEBT-999"]), COM_DEP);
        expect(r.ok).toBe(false);
        expect(r.errors.join(" ")).toMatch(/não existe no backlog/);
    });

    it("proposta sem `addresses` passa — nem toda alteração fecha achado", () => {
        expect(gate.checkOrder(prop([]), COM_DEP).ok).toBe(true);
    });

    it("backlog ilegível NÃO reprova a proposta, mas avisa que não conferiu", () => {
        // punir o autor por um defeito do arquivo seria a falha oposta
        const r = gate.checkOrder(prop(["DEBT-B"]), { status: "ILEGIVEL", detail: "JSON inválido" });
        expect(r.ok).toBe(true);
        expect(r.errors.join(" ")).toMatch(/NÃO conferida/);
    });
});
