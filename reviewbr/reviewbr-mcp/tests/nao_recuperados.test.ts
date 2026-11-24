import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { writeScreening, triagemGravada, NAO_RECUPERADOS } from "../src/services/project_artifacts.js";
import { FlowComputer } from "../src/services/flow_computer.js";

// Linha 13 da FILA (23/11/2026), item 4 do plano: o estágio do texto completo tem três saídas — incluídos,
// excluídos e não recuperados (F1.3.2.6 do protocolo do roda_aromas_ceara; PRISMA 2020, item 16a: "potentially
// eligible reports that were not retrievable"). O funil já contava 03_screening/fulltext_not_retrieved.json, e
// nenhum código o gravava.
const r = (decision: string, id: string) => ({ decision, record: { identifier: id, title: `t-${id}` } });

describe("linha 13 — o texto completo grava os não recuperados", () => {
    const dirs: string[] = [];
    afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });
    function projeto(): string {
        const p = fs.mkdtempSync(path.join(os.tmpdir(), "naorec-"));
        dirs.push(p);
        return p;
    }
    const ler = (p: string, rel: string) => JSON.parse(fs.readFileSync(path.join(p, rel), "utf-8"));

    it("grava fulltext_not_retrieved.json junto com incluídos e excluídos", () => {
        const p = projeto();
        const w = writeScreening(p, "fulltext", [r("INCLUIR", "a")], [r("EXCLUIR", "b")], undefined, "teste", [r("NAO_RECUPERADO", "c"), r("NAO_RECUPERADO", "d")]);
        expect(w.naoRecuperadosFile).toBeDefined();
        expect(ler(p, NAO_RECUPERADOS)).toHaveLength(2);
        expect(ler(p, "03_screening/included.json")).toHaveLength(1);
    });

    it("o funil conta os não recuperados gravados e a aritmética fecha", () => {
        const p = projeto();
        const registros = ["a", "b", "c", "d", "e", "f"].map((id) => ({ identifier: id }));
        fs.mkdirSync(path.join(p, "01_raw"), { recursive: true });
        fs.mkdirSync(path.join(p, "02_deduplicated"), { recursive: true });
        fs.writeFileSync(path.join(p, "01_raw/database_records.json"), JSON.stringify(registros));
        fs.writeFileSync(path.join(p, "02_deduplicated/dataset.json"), JSON.stringify(registros));
        writeScreening(p, "ta", ["a", "b", "c", "d"].map((id) => r("SEGUE", id)), [r("EXCLUIR", "e"), r("EXCLUIR", "f")]);
        writeScreening(p, "fulltext", [r("INCLUIR", "a")], [r("EXCLUIR", "b")], undefined, "teste", [r("NAO_RECUPERADO", "c"), r("NAO_RECUPERADO", "d")]);
        const f = new FlowComputer().compute(p);
        expect(f.computed.fulltext_not_retrieved).toBe(2);
        expect(f.computed.fulltext_assessed).toBe(2);
        expect(f.computed.included).toBe(1);
        expect(f.includedCrossCheck.matches).toBe(true);
        expect(f.missing).not.toContain(NAO_RECUPERADOS);
    });

    it("estágio só com não recuperados também é triagem gravada: regravar exige autorização", () => {
        const p = projeto();
        writeScreening(p, "fulltext", [], [], undefined, "teste", [r("NAO_RECUPERADO", "a")]);
        expect(triagemGravada(p, "fulltext")).toEqual({ incluidos: 0, excluidos: 0, naoRecuperados: 1 });
        expect(() => writeScreening(p, "fulltext", [r("INCLUIR", "a")], [], undefined, "teste", [])).toThrow(/autoriza/);
    });

    it("a substituição arquiva também os não recuperados anteriores", () => {
        const p = projeto();
        writeScreening(p, "fulltext", [r("INCLUIR", "a")], [], undefined, "teste", [r("NAO_RECUPERADO", "b")]);
        const w = writeScreening(p, "fulltext", [r("INCLUIR", "a"), r("INCLUIR", "b")], [], { autorizacao: "O texto de b foi obtido pelo Portal CAPES; refazer o texto completo." }, "teste", []);
        expect(w.substituicao?.havia).toEqual({ incluidos: 1, excluidos: 0, naoRecuperados: 1 });
        expect(fs.existsSync(path.join(p, w.substituicao!.pasta, "fulltext_not_retrieved.json"))).toBe(true);
        expect(ler(p, NAO_RECUPERADOS)).toHaveLength(0);
    });

    it("não recuperados fora do texto completo: recusa sem gravar", () => {
        const p = projeto();
        expect(() => writeScreening(p, "ta", [], [], undefined, "teste", [r("NAO_RECUPERADO", "a")])).toThrow(/texto completo/);
        expect(fs.existsSync(path.join(p, "03_screening"))).toBe(false);
    });
});
