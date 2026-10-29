import { describe, it, expect, beforeEach, afterAll } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { ProtocolGate } from "../src/services/protocol_gate.js";

let DIR: string;
const criados: string[] = [];
beforeEach(() => { DIR = fs.mkdtempSync(path.join(os.tmpdir(), "gate-")); criados.push(DIR); });
afterAll(() => { for (const d of criados) { try { fs.rmSync(d, { recursive: true, force: true }); } catch { } } });

const estado = (status: string) => fs.writeFileSync(path.join(DIR, "project_state.json"), JSON.stringify({
    schemaVersion: 1, method: "prisma-sr", framework: "PICOS", reviewType: "Sistemática",
    topic: "t", userId: "u", status, control_level: "estrito", phase: "F1",
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z", decisions: []
}));

describe("RV-01 — a trava passou a NEGAR POR PADRÃO", () => {
    it("BLOQUEIA projeto declarado sem nenhum artefato de protocolo", () => {
        // ESTE é o fall-through corrigido: antes caía no `return null` e LIBERAVA.
        // Projeto vazio, ou com o nome digitado errado, era indistinguível de aprovado.
        const g = ProtocolGate.check(DIR);
        expect(g.blocked).toBe(true);
        expect(g.status).toBe("SEM_PROTOCOLO");
        expect(g.message).toMatch(/não tem protocolo/);
    });

    it("a mensagem ensina os dois caminhos: criar protocolo, ou chamar sem projeto", () => {
        const m = ProtocolGate.check(DIR).message!;
        expect(m).toMatch(/plan_research_protocol/);
        expect(m).toMatch(/submit_protocol_for_approval/);
        expect(m).toMatch(/sem 'projectPath'/);
    });

    it("LIBERA chamada sem projectPath — é exploração, e nada persiste", () => {
        const g = ProtocolGate.check(undefined);
        expect(g.blocked).toBe(false);
        expect(g.status).toBe("SEM_PROJETO");
    });
});

describe("estado estruturado (project_state.json)", () => {
    it("LIBERA quando LOCKED", () => {
        estado("LOCKED");
        expect(ProtocolGate.check(DIR)).toMatchObject({ blocked: false, status: "LIBERADO" });
    });

    it("BLOQUEIA quando DRAFT", () => {
        estado("DRAFT");
        const g = ProtocolGate.check(DIR);
        expect(g.blocked).toBe(true);
        expect(g.status).toBe("NAO_TRAVADO");
        expect(g.message).toMatch(/DRAFT/);
    });

    it("BLOQUEIA estado CORROMPIDO — e o distingue de ausente", () => {
        // Antes, ProjectStateService.read devolvia null nos dois casos, e o arquivo ilegível
        // virava 'projeto sem estado' e seguia para o fall-through que liberava.
        fs.writeFileSync(path.join(DIR, "project_state.json"), "{ isto não é json");
        const g = ProtocolGate.check(DIR);
        expect(g.blocked).toBe(true);
        expect(g.status).toBe("ESTADO_CORROMPIDO");
        expect(g.message).toMatch(/ilegível/);
        expect(g.message).toMatch(/não é o mesmo que projeto novo/);
    });
});

describe("fallback pelo marcador [LOCKED] no protocol.md", () => {
    it("LIBERA com o marcador presente", () => {
        fs.writeFileSync(path.join(DIR, "protocol.md"), "# Protocolo\n**Estado:** [LOCKED]\n");
        expect(ProtocolGate.check(DIR)).toMatchObject({ blocked: false, status: "LIBERADO" });
    });

    it("BLOQUEIA sem o marcador", () => {
        fs.writeFileSync(path.join(DIR, "protocol.md"), "# Protocolo\n**Estado:** [DRAFT]\n");
        const g = ProtocolGate.check(DIR);
        expect(g.blocked).toBe(true);
        expect(g.status).toBe("NAO_TRAVADO");
    });

    it("o estado estruturado tem precedência sobre o marcador", () => {
        // project_state.json é a fonte da verdade; protocol.md é herança de projetos antigos
        estado("DRAFT");
        fs.writeFileSync(path.join(DIR, "protocol.md"), "[LOCKED]");
        expect(ProtocolGate.check(DIR).blocked).toBe(true);
    });
});

describe("caminho relativo resolve contra o cwd informado", () => {
    it("aceita caminho relativo", () => {
        estado("LOCKED");
        const g = ProtocolGate.check(path.basename(DIR), path.dirname(DIR));
        expect(g.blocked).toBe(false);
    });

    it("bloqueia caminho relativo que não existe", () => {
        expect(ProtocolGate.check("projeto-que-nao-existe", DIR).blocked).toBe(true);
    });
});

/**
 * O defeito não era a busca livre — era o SILÊNCIO.
 *
 * Busca sem `projectPath` é legítima: é a fronteira entre exploração e busca oficial, e a
 * escolha é do pesquisador (RV-04). Mas o sistema passava sem dizer em que modo operou.
 * Quem esquecesse o parâmetro com um projeto aberto recebia resultados normais, e a busca
 * ficava fora do funil sem nenhum sinal — o PRISMA-S exige declarar o que foi recuperado
 * por base, e o que não entrou ninguém sabe que faltou.
 *
 * Regra: omissão DECLARADA é método; omissão SILENCIOSA é falha.
 */
describe("o modo de busca é declarado, não silencioso", () => {
    it("sem projectPath: passa, mas DECLARA que é exploratória", () => {
        const g = ProtocolGate.check(undefined);
        expect(g.blocked).toBe(false);
        expect(g.status).toBe("SEM_PROJETO");
        expect(g.advisory).toBeTruthy();
    });

    it("o aviso diz o que está em jogo, não só que falta um parâmetro", () => {
        const aviso = ProtocolGate.check(undefined).advisory ?? "";
        // O aviso NÃO cita método nenhum, e o teste não pode exigir que cite. A versão
        // anterior fixava "funil PRISMA" e "PRISMA-S" — tratava todo projeto como PRISMA,
        // que é a herança que o DEBT-134 registra. Busca exploratória não é PRISMA coisa
        // alguma, e o projeto a que ela poderia pertencer pode seguir outro método.
        expect(aviso).toMatch(/não entra no corpus/);
        expect(aviso).toMatch(/nada foi persistido/i);
        expect(aviso).toMatch(/projectPath/);
        expect(aviso, "o aviso não deve assumir PRISMA").not.toMatch(/PRISMA/);
    });

    it("quem PASSA na trilha oficial não recebe aviso — senão o aviso vira ruído", () => {
        estado("LOCKED");
        const g = ProtocolGate.check(DIR);
        expect(g.blocked).toBe(false);
        expect(g.advisory).toBeNull();
    });

    it("quem é BLOQUEADO não recebe aviso: a mensagem de bloqueio já diz tudo", () => {
        const g = ProtocolGate.check("projeto-que-nao-existe", DIR);
        expect(g.blocked).toBe(true);
        expect(g.advisory).toBeNull();
    });
});
