import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { Registry } from "../src/registry/loader.js";
import { ProjectStateService } from "../src/services/project_state.js";
import { congelarPlano, lerPlanoDoArquivo, roteiroDoPlano, conferirExecucao } from "../src/services/plano_busca.js";
import { desviosDeCamposNaoObtidos } from "../src/services/emendas.js";

/**
 * Linha 17 da FILA, FAZER 4 — busca feita à mão. Caso real: no `roda_aromas_ceara`, a anotação de
 * 19/11 da Scopus, do Web of Science e da FSTA ficou sem o período de cobertura que o protocolo
 * pede, e a importação gravou o texto como "Indefinido". Copiado de `fixtures/`.
 */
const FIX = path.join(__dirname, "fixtures", "roda_aromas_ceara");
const INDEX = fs.readFileSync(path.join(__dirname, "..", "src", "index.ts"), "utf-8");
const registry = Registry.loadDefault();

function caso(congelado = true): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "a-mao-"));
    for (const f of ["protocol.md", "project_state.json", "plano_busca.json"]) fs.copyFileSync(path.join(FIX, f), path.join(dir, f));
    if (congelado) congelarPlano(dir, lerPlanoDoArquivo(dir).plano!, "F2", registry);
    return dir;
}

describe("linha 17, FAZER 4 — busca feita à mão", () => {
    it("o roteiro sai do plano, antes da busca: texto exato, filtros e o que anotar — inclusive o período de cobertura", () => {
        const r = roteiroDoPlano(caso(), "wos");
        expect(r).toMatch(/Web of Science \(wos\) — busca à mão/);
        expect(r).toContain("`TS=(cajuína OR cajuina)`");
        expect(r).toMatch(/Filtros: nenhum\. Nenhum outro\./);
        expect(r).toMatch(/Anote, no dia da busca: plataforma; data da busca; filtros; total mostrado; período de cobertura/);
        expect(r).toMatch(/import_dataset_ris.*sourceName = "Web of Science", textoExato/);
    });

    it("o roteiro da busca por tool diz o que o agente passa à tool", () => {
        const r = roteiroDoPlano(caso(), "alice");
        expect(r).toMatch(/por tool: `search_repository` \(repositories: \["BR-RES-0001"\]\)/);
        expect(r).toMatch(/rota congelada: Oasisbr/);
        expect(r).toMatch(/registroDaBusca: período de cobertura/);
    });

    it("sem plano congelado, o roteiro diz como ele entra", () => {
        const dir = caso(false);
        fs.rmSync(path.join(dir, "plano_busca.json"));
        expect(roteiroDoPlano(dir)).toMatch(/sem plano de busca congelado: o plano entra por emenda/);
    });

    it("campo do plano não obtido entra declarado, como desvio do sistema", () => {
        const dir = caso();
        const reg = { plataforma: "Web of Science", "data da busca": "19/11/2026", filtros: "nenhum", "total mostrado": "17", "Período de cobertura": "não obtido: não foi lido no dia da busca" };
        const c = conferirExecucao(dir, "import_dataset_ris", { sourceName: "Web of Science", textoExato: "TS=(cajuína OR cajuina)", registroDaBusca: reg }, registry);
        expect(c).toMatchObject({ aplica: true, ok: true });
        const ids = desviosDeCamposNaoObtidos(dir, c.aplica && c.ok ? c.fontes : [], reg, "import_dataset_ris");
        expect(ids).toEqual(["desvio-1"]);
        expect(ProjectStateService.read(dir)!.desvios).toMatchObject([{ fonte: "wos", por: "sistema", porque: "não obtido: não foi lido no dia da busca" }]);
        expect(fs.readFileSync(path.join(dir, "change_log.md"), "utf-8")).toMatch(/"período de cobertura", que o plano manda registrar, não foi obtido na busca de Web of Science/);
    });

    it("a importação grava o texto exato no log (deixa de ser Indefinido), com a fonte do plano e o registro", () => {
        for (const t of ["import_dataset_ris", "import_bvs_export"]) {
            const i = INDEX.indexOf(`\n    "${t}",`);
            const corpo = INDEX.slice(i, INDEX.indexOf("\nserver.tool(", i + 1));
            expect(corpo).toContain("query: params.textoExato");
            expect(corpo).toContain("registroDaBusca: params.registroDaBusca");
        }
        expect(INDEX).toContain('"get_search_plan",');
        expect(INDEX).toContain("desviosDeCamposNaoObtidos(resolveProjectDir(projectPath), c.fontes, params.registroDaBusca, tool)");
    });
});
