import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { conferirPedidoByos } from "../src/services/scihub_bridge.js";

// DEBT-062 (com o DEBT-090, fundido nele) — o consentimento do pesquisador para o Sci-Hub e a
// condição "só quando o acesso aberto falhou" existiam só na descrição da tool: o schema tinha
// doi e projectPath, e nada exigia, registrava ou conferia nenhuma das duas.
describe("DEBT-062 — retrieve_fulltext_byos exige consentimento e DOI não recuperado", () => {
    const dirs: string[] = [];
    afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });

    function projeto(naoRecuperados?: unknown): string {
        const p = fs.mkdtempSync(path.join(os.tmpdir(), "byos-"));
        dirs.push(p);
        if (naoRecuperados !== undefined) {
            fs.mkdirSync(path.join(p, "03_screening"), { recursive: true });
            fs.writeFileSync(path.join(p, "03_screening", "fulltext_not_retrieved.json"), JSON.stringify(naoRecuperados));
        }
        return p;
    }
    const lista = [{ record: { identifier: "a", doi: "https://doi.org/10.1590/ABC.123" }, motivo: "sem acesso aberto" }];

    it("sem consentimento: recusa", () => {
        expect(conferirPedidoByos(projeto(lista), "10.1590/abc.123", undefined)).toMatch(/falta 'consentimento'/);
    });

    it("consentimento em branco: recusa", () => {
        expect(conferirPedidoByos(projeto(lista), "10.1590/abc.123", "   ")).toMatch(/falta 'consentimento'/);
    });

    it("sem 03_screening/fulltext_not_retrieved.json: recusa", () => {
        expect(conferirPedidoByos(projeto(), "10.1590/abc.123", "sim, pode")).toMatch(/não existe ou não tem lista/);
    });

    it("DOI que não consta entre os não recuperados: recusa", () => {
        expect(conferirPedidoByos(projeto(lista), "10.1590/outro", "sim, pode")).toMatch(/não está em 03_screening/);
    });

    it("consentimento e DOI não recuperado (comparação sem resolvedor e sem caixa): segue", () => {
        expect(conferirPedidoByos(projeto(lista), "doi:10.1590/abc.123", "sim, pode usar o Sci-Hub para o artigo a")).toBeNull();
        expect(conferirPedidoByos(projeto({ records: [{ doi: "10.1590/ABC.123" }] }), "10.1590/abc.123", "sim")).toBeNull();
    });
});
