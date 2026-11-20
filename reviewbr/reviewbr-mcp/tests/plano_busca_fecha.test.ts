import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { Registry } from "../src/registry/loader.js";
import { ProjectStateService } from "../src/services/project_state.js";
import { congelarPlano, lerPlanoDoArquivo, registrarExecucao } from "../src/services/plano_busca.js";
import { registrarDesvio } from "../src/services/emendas.js";

/**
 * Linha 17 da FILA, FAZER 5 — a etapa da busca só fecha com cada fonte do plano executada ou com
 * desvio registrado. Caso real: `roda_aromas_ceara` (11 fontes no plano), copiado de `fixtures/`.
 */
const FIX = path.join(__dirname, "fixtures", "roda_aromas_ceara");
const registry = Registry.loadDefault();

function caso(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fecha-"));
    for (const f of ["protocol.md", "project_state.json", "plano_busca.json"]) fs.copyFileSync(path.join(FIX, f), path.join(dir, f));
    congelarPlano(dir, lerPlanoDoArquivo(dir).plano!, "F2", registry);
    ProjectStateService.logDecision(dir, { phase: "F2", agent: "coordinator", decision: "fechar a busca", por: "pesquisador", contribuicao: "conferi os totais de cada fonte e fecho a busca" });
    return dir;
}
const TODAS = ["scopus", "wos", "fsta", "scielo", "bdtd", "alice", "infoteca", "ufc", "uece", "ufpi", "openalex"];

describe("linha 17, FAZER 5 — a busca só fecha com o plano cumprido", () => {
    it("com a decisão do pesquisador mas sem execução, a etapa da busca não fecha e lista as fontes", () => {
        const r = ProjectStateService.podeAvancar(caso(), "F2");
        expect(r.ok).toBe(false);
        expect(r.motivo).toMatch(/11 fonte\(s\) do plano sem execução terminada nem desvio registrado/);
    });

    it("fonte não alcançada (execução sem fim) continua pendente; com desvio registrado, fecha", () => {
        const dir = caso();
        for (const f of TODAS.filter((x) => x !== "uece")) registrarExecucao(dir, [f], "search_repository", 3);
        registrarExecucao(dir, ["uece"], "search_repository", null);
        const r = ProjectStateService.podeAvancar(dir, "F2");
        expect(r.ok).toBe(false);
        expect(r.motivo).toMatch(/1 fonte\(s\).*Repositório da UECE \(uece\)/);
        expect(registrarDesvio(dir, { o_que: "UECE não alcançada pela rota do plano", porque: "HTTP 403 na Oasisbr", fonte: "uece" }).ok).toBe(true);
        expect(ProjectStateService.podeAvancar(dir, "F2").ok).toBe(true);
    });

    it("vale também no nível fluido, e não toca nas outras etapas", () => {
        const dir = caso();
        ProjectStateService.setControlLevel(dir, "fluido");
        expect(ProjectStateService.podeAvancar(dir, "F2").ok).toBe(false);
        expect(ProjectStateService.podeAvancar(dir, "F3").ok).toBe(true);
    });
});
