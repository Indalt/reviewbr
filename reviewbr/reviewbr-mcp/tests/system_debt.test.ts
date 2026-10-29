import { describe, it, expect, afterAll } from "vitest";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as fs from "node:fs";
import * as os from "node:os";
import { SystemDebtService } from "../src/services/system_debt.js";
import { ChangeType } from "../src/services/change_validator.js";

const here = path.dirname(fileURLToPath(import.meta.url));
// tests/ -> reviewbr-mcp -> reviewbr -> <raiz do repo>
const REPO_ROOT = path.resolve(here, "../../..");
const tmp: string[] = [];
afterAll(() => { for (const d of tmp) { try { fs.rmSync(d, { recursive: true, force: true }); } catch { } } });

function finding(over: Record<string, unknown> = {}) {
    return {
        id: "X-1",
        summary: "algo",
        change_type: ChangeType.EXTENSAO,
        evidence: "promete A, faz B",
        reproduction: "",
        location: "",
        status: "ABERTO" as const,
        resolution: "",
        found_by: "",
        found_at: "",
        context: "",
        gravidade: "",
        destino: "FASE_1",
        depende_de: [],
        ...over
    };
}

function debt(findings: any[]) {
    return { schemaVersion: 1 as const, updatedAt: "", findings };
}

describe("backlog — o achado não sai da fila em silêncio", () => {
    it("REPROVA achado RESOLVIDO sem justificativa", () => {
        const r = SystemDebtService.audit(debt([finding({ status: "RESOLVIDO" })]));
        expect(r.valid).toBe(false);
        expect(r.errors[0]).toMatch(/sem 'resolution'/);
    });

    it("REPROVA achado RECUSADO sem justificativa — recusar é legítimo, recusar calado não", () => {
        const r = SystemDebtService.audit(debt([finding({ status: "RECUSADO" })]));
        expect(r.valid).toBe(false);
        expect(r.errors[0]).toMatch(/sem 'resolution'/);
    });

    it("APROVA saída da fila com justificativa", () => {
        const r = SystemDebtService.audit(debt([
            finding({ status: "RECUSADO", resolution: "comportamento é intencional; documentado na spec" })
        ]));
        expect(r.valid).toBe(true);
    });

    it("NÃO reprova por existir achado ABERTO — fila com item aberto é estado normal", () => {
        const r = SystemDebtService.audit(debt([finding({ status: "ABERTO" }), finding({ id: "X-2", status: "EM_CURSO" })]));
        expect(r.valid).toBe(true);
        expect(r.open).toHaveLength(2);
    });
});

describe("backlog — integridade do registro", () => {
    it("REPROVA achado CORRECAO sem reprodução (mesma exigência do RV-11)", () => {
        const r = SystemDebtService.audit(debt([finding({ change_type: ChangeType.CORRECAO })]));
        expect(r.valid).toBe(false);
        expect(r.errors[0]).toMatch(/CORRECAO sem 'reproduction'/);
    });

    it("ACEITA EXTENSAO sem reprodução — não há promessa descumprida a reproduzir", () => {
        const r = SystemDebtService.audit(debt([finding({ change_type: ChangeType.EXTENSAO })]));
        expect(r.valid).toBe(true);
    });

    it("REPROVA ids duplicados — referência entre sessões ficaria ambígua", () => {
        const r = SystemDebtService.audit(debt([finding(), finding()]));
        expect(r.valid).toBe(false);
        expect(r.errors[0]).toMatch(/id duplicado/);
    });

    it("REPROVA backlog ausente — sem ele não há de onde retomar", () => {
        const r = SystemDebtService.audit(null);
        expect(r.valid).toBe(false);
        expect(r.errors[0]).toMatch(/ausente/);
        expect(r.total).toBe(0);
    });
});

describe("destino, gravidade e dependência — documento que virou DADO", () => {
    it("REPROVA achado aberto sem destino — órfão some do radar", () => {
        const r = SystemDebtService.audit(debt([finding({ destino: "" })]));
        expect(r.valid).toBe(false);
        expect(r.sem_destino).toEqual(["X-1"]);
        expect(r.errors.join(" ")).toMatch(/nasce órfão/);
    });

    it("agrupa por destino e por gravidade — o mapa de cobertura, derivado", () => {
        const r = SystemDebtService.audit(debt([
            finding({ id: "A", destino: "FASE_1", gravidade: "BLOQUEIA" }),
            finding({ id: "B", destino: "FASE_1", gravidade: "SERIO" }),
            finding({ id: "C", destino: "DECISAO_PESQ", gravidade: "SERIO" }),
        ]));
        expect(r.by_destino).toEqual({ FASE_1: 2, DECISAO_PESQ: 1 });
        expect(r.by_gravidade).toEqual({ BLOQUEIA: 1, SERIO: 2 });
    });

    it("aponta quem espera quem — a ordem de correção, derivada", () => {
        const r = SystemDebtService.audit(debt([
            finding({ id: "A", destino: "FASE_1" }),
            finding({ id: "B", destino: "FASE_1", depende_de: ["A"] }),
        ]));
        expect(r.bloqueados_por_dependencia).toEqual([{ id: "B", espera: ["A"] }]);
    });

    it("dependência já RESOLVIDA deixa de bloquear", () => {
        const r = SystemDebtService.audit(debt([
            finding({ id: "A", destino: "FASE_1", status: "RESOLVIDO", resolution: "feito" }),
            finding({ id: "B", destino: "FASE_1", depende_de: ["A"] }),
        ]));
        expect(r.bloqueados_por_dependencia).toEqual([]);
    });

    it("só conta ABERTO e EM_CURSO — resolvido não polui o panorama", () => {
        const r = SystemDebtService.audit(debt([
            finding({ id: "A", destino: "FASE_1" }),
            finding({ id: "B", destino: "FASE_2", status: "RESOLVIDO", resolution: "feito" }),
        ]));
        expect(r.by_destino).toEqual({ FASE_1: 1 });
    });
});

describe("backlog real — o mapa agora é derivado, não snapshot", () => {
    it("todo achado aberto tem destino declarado", () => {
        const r = SystemDebtService.audit(SystemDebtService.read(REPO_ROOT));
        expect(r.sem_destino).toEqual([]);
    });

    it("nenhuma dependência aponta para achado inexistente", () => {
        const real = SystemDebtService.read(REPO_ROOT)!;
        const ids = new Set(real.findings.map((f) => f.id));
        const quebradas = real.findings.flatMap((f) => f.depende_de.filter((x) => !ids.has(x)).map((x) => `${f.id}->${x}`));
        expect(quebradas).toEqual([]);
    });

    it("nenhum achado depende de si mesmo", () => {
        const real = SystemDebtService.read(REPO_ROOT)!;
        expect(real.findings.filter((f) => f.depende_de.includes(f.id)).map((f) => f.id)).toEqual([]);
    });
});

describe("probe() — AUSENTE, OK e ILEGÍVEL são três estados, não dois", () => {
    it("AUSENTE quando o arquivo não existe", () => {
        const d = fs.mkdtempSync(path.join(os.tmpdir(), "probe-"));
        tmp.push(d);
        expect(SystemDebtService.probe(d).status).toBe("AUSENTE");
    });

    it("ILEGÍVEL quando o JSON está quebrado — e diz por quê", () => {
        const d = fs.mkdtempSync(path.join(os.tmpdir(), "probe-"));
        tmp.push(d);
        fs.mkdirSync(path.dirname(SystemDebtService.debtPath(d)), { recursive: true });
        fs.writeFileSync(SystemDebtService.debtPath(d), "{ nao e json");
        const r = SystemDebtService.probe(d);
        expect(r.status).toBe("ILEGIVEL");
        expect(r.detail).toMatch(/JSON inválido/);
    });

    it("ILEGÍVEL quando o JSON é válido mas não passa no schema", () => {
        // o caso real: um `change_type` escrito com cedilha numa edição à mão
        const d = fs.mkdtempSync(path.join(os.tmpdir(), "probe-"));
        tmp.push(d);
        fs.mkdirSync(path.dirname(SystemDebtService.debtPath(d)), { recursive: true });
        fs.writeFileSync(SystemDebtService.debtPath(d), JSON.stringify({
            schemaVersion: 1, updatedAt: "", findings: [{ id: "X", summary: "s", change_type: "CORREÇÃO", evidence: "e", status: "ABERTO" }]
        }));
        const r = SystemDebtService.probe(d);
        expect(r.status).toBe("ILEGIVEL");
        expect(r.detail).toMatch(/schema/);
    });

    it("OK no backlog real — controle positivo do método", () => {
        expect(SystemDebtService.probe(REPO_ROOT).status).toBe("OK");
    });
});

describe("backlog real em disco — o que uma sessão nova encontra", () => {
    it("existe, é legível e passa na auditoria", () => {
        const real = SystemDebtService.read(REPO_ROOT);
        expect(real).not.toBeNull();
        const audit = SystemDebtService.audit(real);
        expect(audit.errors).toEqual([]);
        expect(audit.valid).toBe(true);
    });

    it("a fila tem saída, não é decorativa: há achado ABERTO de CORRECAO com reprodução", () => {
        // Antes este teste fixava o DEBT-001 como ABERTO e exigia uma string da reprodução
        // dele. Usar um achado VIVO como fixture faz o fechamento legítimo de um achado
        // quebrar a suíte — foi o que aconteceu quando o DEBT-001 foi recusado em 04/10/2026,
        // com motivo verificado no código. O backlog é dado que muda; o teste passa a afirmar
        // a PROPRIEDADE que precisa valer sempre, não o estado de um item.
        const real = SystemDebtService.read(REPO_ROOT)!;
        const correcoes = real.findings.filter(
            (f) => f.status === "ABERTO" && f.change_type === ChangeType.CORRECAO,
        );
        expect(correcoes.length).toBeGreaterThan(0);
        // CORRECAO sem reprodução é o que o próprio gate recusa (RV-11): nenhuma pode escapar.
        expect(correcoes.filter((f) => !f.reproduction?.trim()).map((f) => f.id)).toEqual([]);
    });

    it("todo achado tem id, evidência e contexto — o que permite retomar sem a conversa original", () => {
        const real = SystemDebtService.read(REPO_ROOT)!;
        expect(real.findings.length).toBeGreaterThan(0);
        for (const f of real.findings) {
            expect(f.id).toBeTruthy();
            expect(f.evidence).toBeTruthy();
            expect(f.context).toBeTruthy();
            expect(f.found_at).toBeTruthy();
        }
    });
});
