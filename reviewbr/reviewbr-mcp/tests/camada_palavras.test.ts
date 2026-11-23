import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { compilarTermos, termosQueCasam, gravarCamadaPorPalavras, aplicarCamadaPorPalavras } from "../src/services/camada_palavras.js";
import { FlowComputer } from "../src/services/flow_computer.js";
import { ScreeningMetricsService } from "../src/services/screening_metrics.js";
import { insumoDoEstagio } from "../src/services/project_artifacts.js";

// Pedido do Vicente de 23/11/2026 (FILA, "Visto de passagem", F4 do roda_aromas_ceara): a camada mecânica
// da triagem não tinha tool. O protocolo (F4.1.2) passa o registro com ao menos um termo no título, no
// resumo ou nas palavras-chave, com curinga, e todo registro sem resumo; os termos abaixo são os dele.
const TERMOS = ["aroma*", "sabor*", "gosto", "flavor", "flavour", "taste", "sensor*", "descritor*", "descriptor*",
    "léxico", "lexicon", "roda", "wheel", "volát*", "volatil*", "odor*", "olor", "olfat*", "olfact*", "perfil", "profile"];
const PROTOCOLO = "Camada mecânica: " + TERMOS.map((t) => "`" + t + "`").join(", ") + ".";

const reg = (id: string, campos: Record<string, unknown>) => ({
    repositoryId: "BR-AGG-0006", repositoryName: "Oasisbr (IBICT)", identifier: id, title: "", description: "Um resumo.", ...campos,
});

describe("camada por palavras — regra de casamento", () => {
    const casa = (texto: string, termos = TERMOS) => termosQueCasam(texto, compilarTermos(termos));

    it("curinga no fim aceita qualquer terminação, sem diferença de maiúscula nem de acento", () => {
        expect(casa("Compostos AROMÁTICOS da cajuína")).toEqual(["aroma*"]);
        expect(casa("compostos voláteis")).toEqual(["volát*"]);
        expect(casa("volatile compounds")).toEqual(["volát*", "volatil*"]);
        expect(casa("análise sensorial")).toEqual(["sensor*"]);
    });

    it("termo sem curinga é a palavra inteira", () => {
        expect(casa("perfis de consumo")).toEqual([]);
        expect(casa("rodada de negócios")).toEqual([]);
        expect(casa("Lexico do caju")).toEqual(["léxico"]);
        expect(casa("off-flavor in juice")).toEqual(["flavor"]);
    });

    it("termo de mais de uma palavra casa as palavras seguidas", () => {
        expect(casa("the flavor wheel", ["flavor wheel"])).toEqual(["flavor wheel"]);
        expect(casa("wheel of flavor", ["flavor wheel"])).toEqual([]);
    });

    it("curinga no meio é recusado", () => {
        expect(() => compilarTermos(["ar*ma"])).toThrow(/só é aceito no fim/);
    });

    it("passa por título, resumo ou palavras-chave; sem resumo passa; o resto sai", () => {
        const r = aplicarCamadaPorPalavras([
            reg("t", { title: "Aroma da cajuína" }),
            reg("r", { description: "Perfil sensorial." }),
            reg("k", { subjectAreas: ["Cajuína", "Compostos voláteis"] }),
            reg("c", {}),
            reg("s", { description: "" }),
            reg("x", { title: "Cajuína e saúde" }),
        ], TERMOS, new Map([["BR-AGG-0006|c", ["Odor"]]]));
        expect(r.passados.map((p) => [p.record.identifier, p.motivo])).toEqual([
            ["t", "termo"], ["r", "termo"], ["k", "termo"], ["c", "termo"], ["s", "sem resumo"],
        ]);
        expect(r.excluidos.map((p) => p.record.identifier)).toEqual(["x"]);
        expect(r.passados[2].casamentos).toEqual([{ campo: "palavras-chave", termos: ["volát*"] }]);
        expect(r.contagens).toMatchObject({ entrada: 6, passados: 5, excluidos: 1, sem_resumo: 1, com_palavras_chave_completadas: 1 });
    });
});

describe("camada por palavras — artefatos do funil", () => {
    const dirs: string[] = [];
    afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });
    function projeto(registros: any[]): string {
        const p = fs.mkdtempSync(path.join(os.tmpdir(), "camada-"));
        dirs.push(p);
        fs.writeFileSync(path.join(p, "protocol.md"), PROTOCOLO);
        fs.mkdirSync(path.join(p, "02_deduplicated"));
        fs.writeFileSync(path.join(p, "02_deduplicated", "dataset.json"), JSON.stringify(registros));
        fs.mkdirSync(path.join(p, "01_raw"));
        fs.writeFileSync(path.join(p, "01_raw", "database_records.json"), JSON.stringify(registros));
        return p;
    }
    const ler = (p: string, rel: string) => JSON.parse(fs.readFileSync(path.join(p, rel), "utf-8"));
    const tres = () => [reg("a", { title: "Aroma" }), reg("b", { description: "" }), reg("c", { title: "Saúde" })];

    it("grava os que passam, os excluídos e o relatório, e a conta fecha", () => {
        const p = projeto(tres());
        const g = gravarCamadaPorPalavras(p, TERMOS);
        expect(ler(p, "03_screening/passed_keywords.json").map((x: any) => x.record.identifier)).toEqual(["a", "b"]);
        expect(ler(p, "03_screening/excluded_keywords.json").map((x: any) => x.record.identifier)).toEqual(["c"]);
        const rel = ler(p, "03_screening/keywords_report.json");
        expect(rel.conferencia).toEqual({ passados_mais_excluidos: 3, entrada: 3, fecha: true });
        expect(rel.termos).toEqual(TERMOS);
        expect(g.resumo).toContain("2 (1 por termo; 1 só por não ter resumo)");
    });

    it("lê as palavras-chave completadas pela fonte em 02_deduplicated/palavras_chave.json", () => {
        const p = projeto([reg("c", { title: "Saúde" })]);
        fs.writeFileSync(path.join(p, "02_deduplicated", "palavras_chave.json"), JSON.stringify([
            { repositoryId: "BR-AGG-0006", identifier: "c", palavras: ["Sabor"], fonte: "teste", lido_em: "2026-11-23" },
        ]));
        gravarCamadaPorPalavras(p, TERMOS);
        expect(ler(p, "03_screening/passed_keywords.json")).toHaveLength(1);
    });

    it("termo que não está escrito no protocolo: recusa e não grava nada", () => {
        const p = projeto(tres());
        expect(() => gravarCamadaPorPalavras(p, [...TERMOS, "aromatic*"])).toThrow(/não estão escritos no protocol.md: "aromatic\*"/);
        expect(fs.existsSync(path.join(p, "03_screening"))).toBe(false);
    });

    it("regravar exige a autorização do pesquisador; com ela, a anterior fica arquivada", () => {
        const p = projeto(tres());
        gravarCamadaPorPalavras(p, TERMOS);
        expect(() => gravarCamadaPorPalavras(p, TERMOS)).toThrow(/autoriza/);
        const g = gravarCamadaPorPalavras(p, TERMOS, { substituicao: "Rodar de novo depois de completar as palavras-chave." });
        expect(fs.existsSync(path.join(p, g.substituicao!.pasta, "keywords_report.json"))).toBe(true);
        expect(fs.existsSync(path.join(p, g.substituicao!.pasta, "passed_keywords.json"))).toBe(true);
    });

    it("o funil soma os excluídos pela camada aos excluídos na triagem, com as duas parcelas", () => {
        const p = projeto(tres());
        gravarCamadaPorPalavras(p, TERMOS);
        fs.writeFileSync(path.join(p, "03_screening", "excluded_ta.json"), JSON.stringify([{ record: { identifier: "b" }, decision: "NO" }]));
        const f = new FlowComputer().compute(p);
        expect(f.computed.title_abstract_excluded).toBe(2);
        expect(f.computed.retrieved_fulltext).toBe(1);
        expect(f.provenance.title_abstract_excluded).toContain("excluded_keywords.json (1, camada por palavras)");
    });

    it("a leitura por título e resumo lê o que a camada passou", async () => {
        const p = projeto(tres());
        expect(insumoDoEstagio(p, "ta")).toBe("02_deduplicated/dataset.json");
        gravarCamadaPorPalavras(p, TERMOS);
        expect(insumoDoEstagio(p, "ta")).toBe("03_screening/passed_keywords.json");
        const rel = await new ScreeningMetricsService().generateReport(p, "ta");
        expect(rel.totalRecords).toBe(2);
    });

    it("o batch_keyword_screen tem o modo dos registros, sem pdfDir obrigatório", () => {
        const mcp = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
        const index = fs.readFileSync(path.join(mcp, "src", "index.ts"), "utf-8").replace(/\r\n/g, "\n");
        const i = index.indexOf('\n    "batch_keyword_screen",');
        const corpo = index.slice(i, index.indexOf("\nserver.tool(", i + 1));
        expect(corpo).toContain("pdfDir: z.string().optional()");
        expect(corpo).toContain("gravarCamadaPorPalavras(params.projectPath, params.keywords");
    });
});
