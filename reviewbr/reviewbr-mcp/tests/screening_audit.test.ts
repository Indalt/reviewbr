import { describe, it, expect, beforeEach, afterAll } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { ScreeningAuditService, isPinned, sha256, compararCorridas } from "../src/services/screening_audit.js";

let DIR: string;
const criados: string[] = [];
beforeEach(() => { DIR = fs.mkdtempSync(path.join(os.tmpdir(), "triagem-")); criados.push(DIR); });
afterAll(() => { for (const d of criados) { try { fs.rmSync(d, { recursive: true, force: true }); } catch { } } });

const prov = (over: Record<string, unknown> = {}) => ({
    model: "gemini-2.5-flash-lite", model_pinned: false, temperature: 0,
    timestamp: "2026-09-26T00:00:00.000Z", prompt_sha256: sha256("p"), ...over
}) as any;

describe("alias x versão fixada — a distinção que o RAISE §4.9.1 exige", () => {
    it("reconhece ALIAS: nome de família sem sufixo de versão", () => {
        expect(isPinned("gemini-2.5-flash-lite")).toBe(false);
        expect(isPinned("gpt-4o")).toBe(false);
    });

    it("reconhece VERSÃO FIXADA por sufixo numérico ou data", () => {
        expect(isPinned("gemini-2.5-flash-lite-001")).toBe(true);
        expect(isPinned("gemini-2.0-flash-2025-01-21")).toBe(true);
        expect(isPinned("gemini-2.5-pro-preview-3")).toBe(true);
    });
});

describe("trilha de auditoria — o registro que torna a triagem declarável", () => {
    it("grava o prompt ÍNTEGRO uma vez, e o digest em cada decisão", () => {
        const a = new ScreeningAuditService(DIR, "ta", "gemini-2.5-flash-lite", 0, "TEMPLATE DO PROMPT", "2026-09-26T00:00:00.000Z");
        a.record({ identifier: "id1", title: "T1", decision: "YES", prompt: "p1", provenance: prov({ prompt_sha256: sha256("p1") }) });
        a.close("2026-09-26T00:01:00.000Z");

        const tpl = fs.readFileSync(path.join(a.path, "prompt_template.txt"), "utf-8");
        expect(tpl).toBe("TEMPLATE DO PROMPT");

        const linha = JSON.parse(fs.readFileSync(path.join(a.path, "decisions.jsonl"), "utf-8").trim());
        expect(linha.prompt_sha256).toBe(sha256("p1"));
        // o prompt inteiro NÃO é duplicado por registro — só o digest e o tamanho
        expect(linha.prompt).toBeUndefined();
        expect(linha.prompt_chars).toBe(2);
    });

    it("registra ERRO como decisão, não como silêncio", () => {
        const a = new ScreeningAuditService(DIR, "ta", "m", 0, "t", "2026-09-26T00:00:00.000Z");
        a.record({ identifier: "id1", title: "T", decision: "ERRO: timeout", prompt: "p", provenance: prov() });
        const m = a.close("2026-09-26T00:01:00.000Z");
        expect(m.total).toBe(1);
        expect(m.decisions["ERRO: timeout"]).toBe(1);
    });

    it("conta MAYBE separado de YES — torna visível a promoção silenciosa a incluído", () => {
        const a = new ScreeningAuditService(DIR, "ta", "m", 0, "t", "2026-09-26T00:00:00.000Z");
        for (const d of ["YES", "YES", "MAYBE", "NO"]) {
            a.record({ identifier: d + Math.random(), title: "T", decision: d, prompt: "p", provenance: prov() });
        }
        const m = a.close("2026-09-26T00:01:00.000Z");
        expect(m.decisions).toEqual({ YES: 2, MAYBE: 1, NO: 1 });
    });

    it("AVISA quando o modelo é alias — o operador precisa saber antes de publicar", () => {
        const a = new ScreeningAuditService(DIR, "ta", "gemini-2.5-flash-lite", 0, "t", "2026-09-26T00:00:00.000Z");
        const m = a.close("2026-09-26T00:01:00.000Z");
        expect(m.model_pinned).toBe(false);
        expect(m.raise_warnings.join(" ")).toMatch(/ALIAS/);
        expect(m.raise_warnings.join(" ")).toMatch(/4\.9\.1/);
    });

    it("NÃO avisa de alias quando a versão está fixada", () => {
        const a = new ScreeningAuditService(DIR, "ta", "gemini-2.5-flash-lite-001", 0, "t", "2026-09-26T00:00:00.000Z");
        const m = a.close("2026-09-26T00:01:00.000Z");
        expect(m.model_pinned).toBe(true);
        expect(m.raise_warnings.join(" ")).not.toMatch(/ALIAS/);
    });

    it("avisa SEMPRE que o registro não substitui a avaliação de desempenho", () => {
        // registrar O QUE foi decidido nao diz QUAO BEM decide — RAISE §4.9.3.1/4.9.3.2
        const a = new ScreeningAuditService(DIR, "ta", "m-001", 0, "t", "2026-09-26T00:00:00.000Z");
        expect(a.close("2026-09-26T00:01:00.000Z").raise_warnings.join(" ")).toMatch(/padrão-ouro/);
    });

    it("o manifesto traz modelo, temperatura e datas — o §4.9.1 completo", () => {
        const a = new ScreeningAuditService(DIR, "fulltext", "m-001", 0.2, "t", "2026-09-26T00:00:00.000Z");
        const m = a.close("2026-09-26T00:05:00.000Z");
        expect(m).toMatchObject({ stage: "fulltext", model: "m-001", temperature: 0.2 });
        expect(m.started_at).toBe("2026-09-26T00:00:00.000Z");
        expect(m.finished_at).toBe("2026-09-26T00:05:00.000Z");
    });
});

describe("concordância entre corridas — o equivalente ao par de triadores e ao kappa", () => {
    const A = [{ identifier: "1", decision: "YES" }, { identifier: "2", decision: "NO" }, { identifier: "3", decision: "YES" }];

    it("concordância total dá kappa 1", () => {
        const r = compararCorridas(A, A);
        expect(r.n).toBe(3);
        expect(r.concordancia).toBe(1);
        expect(r.kappa).toBe(1);
        expect(r.discordantes).toEqual([]);
    });

    it("nomeia QUAIS registros divergiram, não só quantos", () => {
        const B = [{ identifier: "1", decision: "YES" }, { identifier: "2", decision: "YES" }, { identifier: "3", decision: "YES" }];
        const r = compararCorridas(A, B);
        expect(r.discordantes).toEqual([{ identifier: "2", a: "NO", b: "YES" }]);
        expect(r.concordancia).toBeCloseTo(2 / 3, 5);
    });

    it("kappa corrige a concordância por acaso — alta concordância bruta pode valer pouco", () => {
        // 9 de 10 excluídos: duas corridas que quase sempre dizem NO concordam em 90%
        // por acaso. O kappa mostra que o acordo real e menor que o bruto sugere.
        const a = Array.from({ length: 10 }, (_, i) => ({ identifier: String(i), decision: i === 0 ? "YES" : "NO" }));
        const b = Array.from({ length: 10 }, (_, i) => ({ identifier: String(i), decision: i === 1 ? "YES" : "NO" }));
        const r = compararCorridas(a, b);
        expect(r.concordancia).toBeCloseTo(0.8, 5);
        expect(r.kappa).toBeLessThan(r.concordancia);
    });

    it("ignora registros que só existem numa das corridas", () => {
        const r = compararCorridas(A, [{ identifier: "1", decision: "YES" }]);
        expect(r.n).toBe(1);
    });

    it("conjunto vazio não finge concordância", () => {
        const r = compararCorridas([], []);
        expect(r.n).toBe(0);
        expect(r.kappa).toBe(0);
    });
});
