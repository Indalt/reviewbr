import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { Registry } from "../src/registry/loader.js";
import { AccessStrategy } from "../src/access/strategy.js";
import { ProjectStateService } from "../src/services/project_state.js";
import { lerPlanoDoArquivo, congelarPlano, conferirExecucao, registrarExecucao, TOOLS_DE_BUSCA, type CatalogoDeRepositorios } from "../src/services/plano_busca.js";

/**
 * Linha 17 da FILA, FAZER 2 — sob projeto LOCKED, a busca e a importação seguem só o plano
 * congelado. Caso real: `roda_aromas_ceara`, copiado de `fixtures/` para uma pasta temporária.
 */
const FIX = path.join(__dirname, "fixtures", "roda_aromas_ceara");
const INDEX = fs.readFileSync(path.join(__dirname, "..", "src", "index.ts"), "utf-8");
const registry = Registry.loadDefault();
const PERIODO = { "período de cobertura": "lido na página da fonte em 20/11/2026" };

function caso(congelado: boolean): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "plano-exec-"));
    for (const f of ["protocol.md", "project_state.json", "plano_busca.json"]) fs.copyFileSync(path.join(FIX, f), path.join(dir, f));
    if (congelado) congelarPlano(dir, lerPlanoDoArquivo(dir).plano!, "F2", registry);
    return dir;
}
const recusa = (r: ReturnType<typeof conferirExecucao>) => (r.aplica && !r.ok ? r.motivo : "");

describe("linha 17, FAZER 2 — a busca confere o plano", () => {
    it("o caso real hoje (travado em 15/11, sem plano): a busca recusa e aponta a emenda", () => {
        const r = conferirExecucao(caso(false), "search_repository", { query: "cajuína", repositories: ["BR-RES-0001"] }, registry);
        expect(recusa(r)).toMatch(/sem plano de busca congelado/);
        expect(recusa(r)).toMatch(/record_protocol_amendment/);
    });

    it("chamada que segue o plano passa e diz a fonte e a rota", () => {
        const r = conferirExecucao(caso(true), "search_repository", { query: "cajuína", repositories: ["BR-RES-0001"], maxResults: 50, registroDaBusca: PERIODO }, registry);
        expect(r).toMatchObject({ aplica: true, ok: true });
        if (r.aplica && r.ok) {
            expect(r.fontes.map((f) => f.id)).toEqual(["alice"]);
            expect(r.rota).toMatch(/alice: Oasisbr/);
        }
    });

    it("recusa o que diverge do plano, dizendo o quê", () => {
        const dir = caso(true);
        const ok = { query: "cajuína", repositories: ["BR-RES-0001"], registroDaBusca: PERIODO };
        expect(recusa(conferirExecucao(dir, "search_pubmed", { query: "cajuína", registroDaBusca: PERIODO }, registry))).toMatch(/search_pubmed não está no plano/);
        expect(recusa(conferirExecucao(dir, "search_repository", { ...ok, repositories: ["BR-FED-0001"] }, registry))).toMatch(/BR-FED-0001 não está no plano/);
        expect(recusa(conferirExecucao(dir, "search_repository", { ...ok, repositories: [] }, registry))).toMatch(/diga os repositórios/);
        expect(recusa(conferirExecucao(dir, "search_repository", { ...ok, query: "cajuína aroma" }, registry))).toMatch(/não é texto exato do plano/);
        expect(recusa(conferirExecucao(dir, "search_repository", { ...ok, dateFrom: "2000" }, registry))).toMatch(/filtros fora do plano/);
        expect(recusa(conferirExecucao(dir, "search_repository", { ...ok, registroDaBusca: {} }, registry))).toMatch(/manda registrar .*período de cobertura/);
        expect(recusa(conferirExecucao(dir, "search_openalex", { query: "cajuina", registroDaBusca: PERIODO }, registry))).toMatch(/não é texto exato/);
    });

    it("protocolo editado depois da trava: recusa", () => {
        const dir = caso(true);
        fs.appendFileSync(path.join(dir, "protocol.md"), "\nmudança depois da trava\n");
        const r = conferirExecucao(dir, "search_openalex", { query: "cajuína OR cajuina", registroDaBusca: PERIODO }, registry);
        expect(recusa(r)).toMatch(/protocol\.md mudou depois da trava/);
    });

    it("rota mudada pela manutenção depois da trava: recusa e pede emenda", () => {
        const dir = caso(true);
        const real = registry.getById("BR-RES-0001")!;
        // A manutenção "conserta" a Alice: volta a buscar no site, sem agregador.
        const mudado: CatalogoDeRepositorios = {
            getById: (id) => id === "BR-RES-0001" ? { ...real, access: { ...real.access, searchable: undefined, viaAgregador: undefined } } as any : registry.getById(id),
            getActive: () => registry.getActive(),
        };
        const r = conferirExecucao(dir, "search_repository", { query: "cajuína", repositories: ["BR-RES-0001"], registroDaBusca: PERIODO }, mudado);
        expect(recusa(r)).toMatch(/a rota de Embrapa — Alice mudou depois da trava: era "Oasisbr/);
        expect(recusa(r)).toMatch(/emenda aprovada pelo pesquisador/);
    });

    it("importação de busca feita à mão: base pelo nome do plano e o texto exato digitado", () => {
        const dir = caso(true);
        const reg = { plataforma: "Web of Science", "data da busca": "19/11/2026", filtros: "nenhum", "total mostrado": "17", "período de cobertura": "não obtido: não lido no dia" };
        expect(conferirExecucao(dir, "import_dataset_ris", { sourceName: "Web of Science", textoExato: "TS=(cajuína OR cajuina)", registroDaBusca: reg }, registry)).toMatchObject({ aplica: true, ok: true });
        expect(recusa(conferirExecucao(dir, "import_dataset_ris", { sourceName: "Web of Science", textoExato: "TS=(cajuina)", registroDaBusca: reg }, registry))).toMatch(/não é texto exato/);
        expect(recusa(conferirExecucao(dir, "import_dataset_ris", { textoExato: "TS=(cajuína OR cajuina)", registroDaBusca: reg }, registry))).toMatch(/sourceName/);
        expect(recusa(conferirExecucao(dir, "import_dataset_ris", { sourceName: "Web of Science", registroDaBusca: reg }, registry))).toMatch(/falta `textoExato`/);
    });

    it("projeto em DRAFT e tool que não é de busca: a conferência não se aplica", () => {
        const dir = caso(true);
        expect(conferirExecucao(dir, "retrieve_fulltexts", {}, registry)).toEqual({ aplica: false });
        ProjectStateService.patch(dir, { status: "DRAFT" });
        expect(conferirExecucao(dir, "search_pubmed", { query: "x" }, registry)).toEqual({ aplica: false });
    });

    it("a execução da fonte do plano fica no estado", () => {
        const dir = caso(true);
        registrarExecucao(dir, ["alice"], "search_repository", 3);
        expect(ProjectStateService.read(dir)!.trava_busca!.execucoes).toMatchObject([{ fonte: "alice", tool: "search_repository", hits: 3 }]);
    });

    it("sob o plano, a busca usa só a rota do plano: falhou, a fonte fica não alcançada (sem cascata)", async () => {
        const strategy = new AccessStrategy();
        (strategy as any).bdtd.searchDetailed = async () => { throw new Error("fora do ar"); };
        const bdtd = registry.getById("BR-AGG-0001")!;
        await expect(strategy.searchDetailed(bdtd, "cajuína", { somentePrimaria: true }))
            .rejects.toThrow(/rota do plano \(BDTD, API do VuFind\) falhou: fora do ar.*sem cascata nem agregador de reserva/);
    });

    it("toda tool de busca e de importação passa pela conferência do plano no index.ts", () => {
        for (const t of TOOLS_DE_BUSCA) expect(INDEX).toContain(`checkDesignGuardrail(params.projectId, params.projectPath, "${t}", params)`);
        expect(INDEX).toContain("somentePrimaria: Boolean((params as any).fontePlano)");
    });
});
