import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { Registry } from "../src/registry/loader.js";
import { ProjectStateService } from "../src/services/project_state.js";
import { conferirExecucao } from "../src/services/plano_busca.js";
import { proporEmenda, decidirEmenda, registrarDesvio } from "../src/services/emendas.js";

/**
 * Linha 17 da FILA, FAZER 3 — emenda e desvio por tool. Caso real: o `roda_aromas_ceara`, travado
 * em 15/11/2026 sem plano, com a emenda 1 e o desvio 1 escritos à mão no change_log.md. Copiado de
 * `fixtures/`; nada se grava na pasta do projeto.
 */
const FIX = path.join(__dirname, "fixtures", "roda_aromas_ceara");
const INDEX = fs.readFileSync(path.join(__dirname, "..", "src", "index.ts"), "utf-8");
const registry = Registry.loadDefault();
const PLANO = fs.readFileSync(path.join(FIX, "plano_busca.json"), "utf-8");
const PERIODO = { "período de cobertura": "lido na página da fonte em 20/11/2026" };

function caso(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "emenda-"));
    for (const f of ["protocol.md", "project_state.json"]) fs.copyFileSync(path.join(FIX, f), path.join(dir, f));
    fs.writeFileSync(path.join(dir, "change_log.md"), "# Emendas e desvios — escrito à mão\n\n## Emenda 1 — PROPOSTA em 20/11/2026 (à mão)\n");
    return dir;
}
const log = (dir: string) => fs.readFileSync(path.join(dir, "change_log.md"), "utf-8");

describe("linha 17, FAZER 3 — emenda e desvio por tool", () => {
    it("o caso real: a emenda com o plano nasce proposta e não libera a busca", () => {
        const dir = caso();
        const r = proporEmenda(dir, { o_que: "caminho de busca de cinco fontes", porque: "robots.txt e HTTP 403 (19/11/2026)", plano: PLANO }, registry);
        expect(r.ok).toBe(true);
        expect(ProjectStateService.read(dir)!.emendas).toMatchObject([{ id: "emenda-1", status: "PROPOSTA" }]);
        expect(log(dir)).toMatch(/^# Emendas e desvios — escrito à mão/);
        expect(log(dir)).toMatch(/## emenda-1 — PROPOSTA em .*record_protocol_amendment/);
        expect(conferirExecucao(dir, "search_openalex", { query: "cajuína OR cajuina", registroDaBusca: PERIODO }, registry))
            .toMatchObject({ aplica: true, ok: false });
    });

    it("aprovar exige as palavras do pesquisador; aprovada, sobe a versão e congela o plano com as rotas de hoje", () => {
        const dir = caso();
        proporEmenda(dir, { o_que: "caminho de busca de cinco fontes", porque: "robots.txt e HTTP 403", plano: PLANO }, registry);
        expect(decidirEmenda(dir, { id: "emenda-1", acao: "aprovar", contribuicao: "ok" }, registry).mensagem).toMatch(/carimbo/);
        const r = decidirEmenda(dir, { id: "emenda-1", acao: "aprovar", contribuicao: "aprovo os caminhos pela Oasisbr e pelo OpenAlex, declarando onde se viu" }, registry);
        expect(r.ok).toBe(true);
        const st = ProjectStateService.read(dir)!;
        expect(st.emendas![0]).toMatchObject({ status: "APROVADA", decisao: { por: "pesquisador", versao_protocolo: "1.1" } });
        expect(st.trava_busca!.versao_protocolo).toBe("1.1");
        expect(log(dir)).toMatch(/### emenda-1 — APROVADA .*\n\nDecisão do pesquisador: "aprovo os caminhos/);
        expect(log(dir)).toMatch(/1\.0 → 1\.1/);
        expect(conferirExecucao(dir, "search_repository", { query: "cajuína", repositories: ["BR-RES-0001"], registroDaBusca: PERIODO }, registry))
            .toMatchObject({ aplica: true, ok: true });
        expect(decidirEmenda(dir, { id: "emenda-1", acao: "recusar", contribuicao: "mudei de ideia sobre a emenda" }, registry).mensagem).toMatch(/já foi decidida/);
        // A aprovação da emenda não é a decisão sobre a etapa: não destrava a F2.
        expect(st.decisions.some((d) => d.contribuicao?.includes("Oasisbr"))).toBe(false);
    });

    it("recusada, o protocolo e o plano seguem como estavam", () => {
        const dir = caso();
        proporEmenda(dir, { o_que: "tirar a UECE", porque: "fonte não alcançada" }, registry);
        expect(decidirEmenda(dir, { id: "emenda-1", acao: "recusar", contribuicao: "a UECE fica: declarar como não alcançada" }, registry).ok).toBe(true);
        expect(ProjectStateService.read(dir)!.trava_busca).toBeUndefined();
        expect(log(dir)).toMatch(/emenda-1 — RECUSADA/);
    });

    it("emenda com plano malformado é recusada antes de existir", () => {
        const r = proporEmenda(caso(), { o_que: "x", porque: "y", plano: '{"fontes":[{"id":"a","nome":"A","modo":"tool","tool":"search_repository","textos":["x"]}]}' }, registry);
        expect(r.ok).toBe(false);
        expect(r.mensagem).toMatch(/falta `repositorio`/);
    });

    it("protocolo em rascunho não tem emenda: edita-se direto", () => {
        const dir = caso();
        ProjectStateService.patch(dir, { status: "DRAFT" });
        expect(proporEmenda(dir, { o_que: "x", porque: "y" }, registry).mensagem).toMatch(/rascunho/);
    });

    it("desvio: o que a execução fez diferente, com a fonte do plano", () => {
        const dir = caso();
        proporEmenda(dir, { o_que: "plano", porque: "trava sem plano", plano: PLANO }, registry);
        decidirEmenda(dir, { id: "emenda-1", acao: "aprovar", contribuicao: "aprovo o plano como está no protocolo" }, registry);
        expect(registrarDesvio(dir, { o_que: "x", porque: "y", fonte: "inexistente" }).mensagem).toMatch(/não está no plano/);
        const r = registrarDesvio(dir, { o_que: "o período de cobertura não foi lido no dia da busca", porque: "a anotação de 19/11 não o pediu", fonte: "scopus" });
        expect(r).toMatchObject({ ok: true, id: "desvio-1" });
        expect(log(dir)).toMatch(/## desvio-1 — registrado em .*\n\n\*\*O quê\.\*\* o período de cobertura .*\(fonte do plano: scopus\)/);
    });

    it("a tool está registrada", () => {
        expect(INDEX).toContain('"record_protocol_amendment",');
    });
});
