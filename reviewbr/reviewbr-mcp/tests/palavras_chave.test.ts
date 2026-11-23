import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { palavrasChaveDoVufind } from "../src/access/platform-adapters.js";
import { assuntosDoDspace } from "../src/access/strategy.js";
import { completarPalavrasChave, type FontesDePalavras } from "../src/services/palavras_chave.js";
import { gravarCamadaPorPalavras } from "../src/services/camada_palavras.js";

// Pedido do Vicente de 23/11/2026 (F4 do roda_aromas_ceara): o protocolo lê título, resumo OU palavras-chave,
// e só 50 dos 5446 registros deduplicados as tinham. A Oasisbr devolve `subjects` vazio e guarda a lista em
// `topic` (inteira só no rawData); o DSpace REST não gravava o dc.subject.

describe("palavras-chave na fonte", () => {
    it("VuFind: subjects quando vem; senão a lista do rawData.topic; senão o topic da API", () => {
        expect(palavrasChaveDoVufind({ id: "b", title: "", subjects: [["Cajuína"], ["Caju"]] } as any)).toEqual(["Cajuína", "Caju"]);
        expect(palavrasChaveDoVufind({ id: "o", title: "", subjects: [], topic: "cashew juice",
            rawData: { topic: ["cashew juice", "cajuina", "vitamin C"] } } as any)).toEqual(["cashew juice", "cajuina", "vitamin C"]);
        expect(palavrasChaveDoVufind({ id: "t", title: "", subjects: [], topic: "Caju" } as any)).toEqual(["Caju"]);
    });

    it("DSpace: todo dc.subject e seus qualificadores", () => {
        expect(assuntosDoDspace({ "dc.title": [{ value: "x" }], "dc.subject": [{ value: "Cajuína" }], "dc.subject.cnpq": [{ value: "Ciência de Alimentos" }] }))
            .toEqual(["Cajuína", "Ciência de Alimentos"]);
    });

    it("a Oasisbr da busca pede o rawData", () => {
        const mcp = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
        const s = fs.readFileSync(path.join(mcp, "src", "access", "strategy.ts"), "utf-8");
        expect(s).toMatch(/new BdtdAdapter\("https:\/\/oasisbr\.ibict\.br\/vufind", \{[^}]*\}, \{ rawData: true \}\)/);
    });
});

describe("complete_record_keywords — completa sem mexer no dataset", () => {
    const dirs: string[] = [];
    afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });

    const DATASET = [
        { repositoryId: "BR-AGG-0006", repositoryName: "Oasisbr (IBICT)", identifier: "O1", accessMethod: "bdtd-vufind", title: "Cajuína", description: "Resumo." },
        { repositoryId: "BR-RES-0001", repositoryName: "ALICE (visto na Oasisbr)", identifier: "EMBR_1", accessMethod: "oasisbr-vufind", title: "Cajuína", description: "Resumo." },
        { repositoryId: "BR-FED-0014", repositoryName: "UFPI", identifier: "uuid-1", accessMethod: "dspace-rest", title: "Cajuína", description: "Resumo." },
        { repositoryId: "OPENALEX", repositoryName: "OpenAlex", identifier: "W1", accessMethod: "api", title: "Cajuína", description: "Resumo." },
        { repositoryName: "Scopus", identifier: "S1", accessMethod: "manual_import", title: "Cajuína", description: "Resumo.", subjectAreas: ["Taste"] },
    ];
    function projeto(): string {
        const p = fs.mkdtempSync(path.join(os.tmpdir(), "palavras-"));
        dirs.push(p);
        fs.mkdirSync(path.join(p, "02_deduplicated"));
        fs.writeFileSync(path.join(p, "02_deduplicated", "dataset.json"), JSON.stringify(DATASET));
        fs.writeFileSync(path.join(p, "protocol.md"), "Termos: `aroma*`, `taste`.");
        return p;
    }
    const lote = (pares: Record<string, string[]>, falhas: string[] = []) => ({
        palavras: new Map(Object.entries(pares)), naoEncontrados: [], falhas, endereco: "teste",
    });

    it("consulta Oasisbr e DSpace pelo id, declara o OpenAlex, e não toca no dataset", async () => {
        const p = projeto();
        const antes = fs.readFileSync(path.join(p, "02_deduplicated", "dataset.json"), "utf-8");
        const pedidos: string[][] = [];
        const fontes: FontesDePalavras = {
            oasisbr: async (ids) => { pedidos.push(ids); return lote({ O1: ["Aroma"], EMBR_1: [] }); },
            dspace: async (repo, ids) => { pedidos.push([repo, ...ids]); return lote({ "uuid-1": ["Cajuína"] }); },
        };
        const r = await completarPalavrasChave(p, fontes);
        expect(pedidos).toEqual([["O1", "EMBR_1"], ["BR-FED-0014", "uuid-1"]]);
        expect(fs.readFileSync(path.join(p, "02_deduplicated", "dataset.json"), "utf-8")).toBe(antes);
        const gravado = JSON.parse(fs.readFileSync(path.join(p, "02_deduplicated", "palavras_chave.json"), "utf-8"));
        expect(gravado.map((e: any) => [e.repositoryId, e.identifier, e.palavras])).toEqual([
            ["BR-AGG-0006", "O1", ["Aroma"]], ["BR-RES-0001", "EMBR_1", []], ["BR-FED-0014", "uuid-1", ["Cajuína"]],
        ]);
        expect(r.relatorio.ja_tinham_palavras_chave).toBe(1);
        expect(Object.keys(r.relatorio.sem_consulta)[0]).toMatch(/OpenAlex: não traz as palavras-chave do autor/);
    });

    it("a segunda execução só consulta o que falhou", async () => {
        const p = projeto();
        await completarPalavrasChave(p, {
            oasisbr: async () => ({ palavras: new Map([["O1", ["Aroma"]]]), naoEncontrados: [], falhas: ["ids 2 a 2: HTTP 503"], endereco: "teste" }),
            dspace: async () => lote({ "uuid-1": [] }),
        });
        const pedidos: string[][] = [];
        await completarPalavrasChave(p, {
            oasisbr: async (ids) => { pedidos.push(ids); return lote({ EMBR_1: ["Sabor"] }); },
            dspace: async (_r, ids) => { pedidos.push(ids); return lote({}); },
        });
        expect(pedidos).toEqual([["EMBR_1"]]);
    });

    it("a camada por palavras passa o registro pela palavra-chave completada", async () => {
        const p = projeto();
        await completarPalavrasChave(p, {
            oasisbr: async () => lote({ O1: ["Aroma"], EMBR_1: [] }),
            dspace: async () => lote({ "uuid-1": [] }),
        });
        gravarCamadaPorPalavras(p, ["aroma*", "taste"]);
        const passados = JSON.parse(fs.readFileSync(path.join(p, "03_screening", "passed_keywords.json"), "utf-8"));
        expect(passados.map((x: any) => x.record.identifier)).toEqual(["O1", "S1"]);
    });
});
