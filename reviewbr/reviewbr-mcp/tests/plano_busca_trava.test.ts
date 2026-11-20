import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createHash } from "node:crypto";
import { Registry } from "../src/registry/loader.js";
import { ProjectStateService } from "../src/services/project_state.js";
import { lerPlanoDoArquivo, validarPlano, congelarPlano, type PlanoBusca } from "../src/services/plano_busca.js";

/**
 * Linha 17 da FILA, FAZER 1 — a trava guarda o que o protocolo usa. O caso real é o
 * `roda_aromas_ceara` (travado em 15/11/2026), copiado para `fixtures/`: nada se grava na pasta
 * do projeto. O `plano_busca.json` do fixture é a tabela de fontes do protocolo dele como dado,
 * escrito para o teste; o do projeto entra por emenda aprovada pelo pesquisador.
 */
const FIX = path.join(__dirname, "fixtures", "roda_aromas_ceara");
const INDEX = fs.readFileSync(path.join(__dirname, "..", "src", "index.ts"), "utf-8");
const registry = Registry.loadDefault();

function copiaDoCaso(comPlano = true): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "plano-trava-"));
    for (const f of ["protocol.md", "project_state.json", ...(comPlano ? ["plano_busca.json"] : [])]) {
        fs.copyFileSync(path.join(FIX, f), path.join(dir, f));
    }
    return dir;
}

describe("linha 17, FAZER 1 — plano de busca na trava", () => {
    it("sem plano_busca.json não há o que travar, e a recusa diz o que o designer escreve", () => {
        const { plano, erros } = lerPlanoDoArquivo(copiaDoCaso(false));
        expect(plano).toBeNull();
        expect(erros[0]).toMatch(/Falta o plano de busca/);
        expect(erros[0]).toMatch(/textos exatos/);
    });

    it("o plano do caso real é válido", () => {
        const { plano } = lerPlanoDoArquivo(copiaDoCaso());
        expect(validarPlano(plano, registry)).toEqual([]);
    });

    it("plano malformado: cada defeito sai com a fonte e o motivo", () => {
        const ruim: PlanoBusca = {
            fontes: [
                { id: "a", nome: "A", modo: "manual", tool: "search_repository", repositorio: "BR-RES-0001", textos: ["x"] },
                { id: "b", nome: "B", modo: "tool", tool: "search_repository", textos: ["x"] },
                { id: "c", nome: "C", modo: "tool", tool: "search_repository", repositorio: "XX-0000", textos: ["x"] },
                { id: "d", nome: "D", modo: "tool", tool: "search_openalex", textos: [] },
                { id: "e", nome: "E", modo: "tool", tool: "busca_inventada", textos: ["x"] },
                { id: "e", nome: "E2", modo: "manual", tool: "import_dataset_ris", textos: ["x"] },
            ],
        };
        const erros = validarPlano(ruim, registry).join("\n");
        expect(erros).toMatch(/fonte 1 \(a\): busca à mão entra pela tool que importa/);
        expect(erros).toMatch(/fonte 2 \(b\): .*falta `repositorio`/);
        expect(erros).toMatch(/fonte 3 \(c\): o repositório "XX-0000" não existe/);
        expect(erros).toMatch(/fonte 4 \(d\): `textos`/);
        expect(erros).toMatch(/fonte 5 \(e\): `tool` "busca_inventada"/);
        expect(erros).toMatch(/fonte 6 \(e\): `id` repetido/);
    });

    it("congelar grava no estado o plano, a rota de hoje de cada fonte e o hash do protocolo", () => {
        const dir = copiaDoCaso();
        const { plano } = lerPlanoDoArquivo(dir);
        const trava = congelarPlano(dir, plano!, "F2", registry);
        const hash = createHash("sha256").update(fs.readFileSync(path.join(dir, "protocol.md"))).digest("hex");
        const salvo = ProjectStateService.read(dir)!.trava_busca!;
        expect(salvo.protocolo_sha256).toBe(hash);
        expect(salvo.etapa).toBe("F2");
        expect(salvo.versao_protocolo).toBe("1.0");
        const rota = (id: string) => salvo.plano.fontes.find((f) => f.id === id)!.rota!;
        // As rotas de hoje, lidas do catálogo e do código — inclusive as que a manutenção mudou em 19/11.
        expect(rota("alice")).toMatch(/Oasisbr .*filtro network_acronym_str:"EMBR"/);
        expect(rota("bdtd")).toBe("BDTD, API do VuFind");
        expect(rota("ufpi")).toMatch(/^DSpace REST \(https:\/\/repositorio\.ufpi\.br\/srv-ufpi-s01\/api\)$/);
        expect(rota("scielo")).toMatch(/doi_starts_with:10\.1590/);
        expect(rota("scopus")).toMatch(/busca à mão/);
        expect(trava.plano.fontes).toHaveLength(11);
    });

    it("o submit confere o plano antes de travar e o congela depois do marcador", () => {
        const i = INDEX.indexOf('\n    "submit_protocol_for_approval",');
        const corpo = INDEX.slice(i, INDEX.indexOf("\nserver.tool(", i + 1));
        expect(corpo.indexOf("validarPlano(")).toBeGreaterThan(-1);
        expect(corpo.indexOf("validarPlano(")).toBeLessThan(corpo.indexOf("travarProtocolo(projectDir"));
        expect(corpo.indexOf("congelarPlano(")).toBeGreaterThan(corpo.indexOf("travarProtocolo(projectDir"));
    });
});
