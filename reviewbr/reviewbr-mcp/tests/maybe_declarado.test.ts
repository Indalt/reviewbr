import { describe, it, expect, beforeEach, afterAll } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { writeScreening, composicaoTriagem } from "../src/services/project_artifacts.js";

/**
 * DEBT-028 — "o MAYBE é silenciosamente promovido a INCLUÍDO".
 *
 * A correção NÃO é tirar o MAYBE dos incluídos: quem entra no corpus é regra de inclusão, e
 * mudá-la por dentro de um conserto decidiria pelo pesquisador (RV-04). A correção é acabar
 * com o silêncio — e o teste guarda as DUAS metades, porque consertar uma e quebrar a outra
 * é o modo mais provável de este achado voltar.
 */

let DIR: string;
const criados: string[] = [];
beforeEach(() => { DIR = fs.mkdtempSync(path.join(os.tmpdir(), "maybe-")); criados.push(DIR); });
afterAll(() => { for (const d of criados) { try { fs.rmSync(d, { recursive: true, force: true }); } catch { } } });

const r = (decision: string, id: string) => ({
    decision, score: 0.5, reasoning: "x", record: { identifier: id, title: "t " + id }
});

describe("a composição é contada, não presumida", () => {
    it("separa SIM de MAYBE dentro do mesmo conjunto de incluídos", () => {
        const c = composicaoTriagem([r("YES", "a"), r("MAYBE", "b"), r("MAYBE", "c")]);
        expect(c).toEqual({ total: 3, sim: 1, maybe: 2 });
    });

    it("conjunto sem dúvida nenhuma declara zero — e não some com o campo", () => {
        expect(composicaoTriagem([r("YES", "a")])).toEqual({ total: 1, sim: 1, maybe: 0 });
    });

    it("entrada inválida não vira contagem inventada (RV-03)", () => {
        expect(composicaoTriagem(undefined as any)).toEqual({ total: 0, sim: 0, maybe: 0 });
    });
});

describe("o número declarado e o número auditável são o mesmo número (RV-02)", () => {
    /**
     * De nada serve a resposta da tool dizer "3 SIM + 2 MAYBE" se o arquivo que fica no
     * projeto não permitir recontar. O artefato é a fonte da verdade; a resposta é cópia.
     */
    it("included_ta.json carrega `decision` por registro, e recontar do disco bate", () => {
        const incluidos = [r("YES", "a"), r("YES", "b"), r("MAYBE", "c")];
        writeScreening(DIR, "ta", incluidos, [r("NO", "d")]);

        const doDisco = JSON.parse(fs.readFileSync(path.join(DIR, "03_screening/included_ta.json"), "utf-8"));
        expect(doDisco.map((x: any) => x.decision)).toEqual(["YES", "YES", "MAYBE"]);
        expect(composicaoTriagem(doDisco)).toEqual(composicaoTriagem(incluidos));
    });

    it("vale também para included.json, o conjunto FINAL — onde um MAYBE é mais grave", () => {
        writeScreening(DIR, "fulltext", [r("YES", "a"), r("MAYBE", "b")], []);
        const doDisco = JSON.parse(fs.readFileSync(path.join(DIR, "03_screening/included.json"), "utf-8"));
        expect(composicaoTriagem(doDisco).maybe).toBe(1);
    });
});

describe("a regra de inclusão continua intacta — o conserto é de silêncio, não de corpus", () => {
    const screen = fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname.slice(1)), "..", "src", "services", "screen.ts"), "utf-8");

    it("MAYBE segue entrando em `included` (mudar isso exige decisão do pesquisador)", () => {
        expect(screen).toMatch(/decision === "YES" \|\| res\.result\.decision === "MAYBE"/);
    });

    it("screen_candidates declara a composição em vez de só somar", () => {
        const index = fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname.slice(1)), "..", "src", "index.ts"), "utf-8");
        expect(index).toMatch(/composicaoTriagem\(result\.included\)/);
        // os dois estágios recebem tratamento diferente: dúvida no TA é resposta certa,
        // dúvida no fulltext é indecisão que o funil publicaria como decisão.
        expect(index).toMatch(/incluídos FINAIS estão como MAYBE/);
    });
});
