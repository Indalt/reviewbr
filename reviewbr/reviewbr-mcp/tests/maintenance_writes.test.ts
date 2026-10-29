import { describe, it, expect, beforeEach, afterAll } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { BacklogWriter, CatalogWriter, MethodologyWriter } from "../src/services/maintenance_writes.js";
import { SystemDebtService } from "../src/services/system_debt.js";
import { MethodologyCatalogService } from "../src/services/methodology_catalog.js";

// Repositorio de brinquedo: escrever no backlog real o corromperia.
let RAIZ: string;
const criados: string[] = [];

function novaRaiz() {
    const d = fs.mkdtempSync(path.join(os.tmpdir(), "reviewbr-test-"));
    criados.push(d);
    fs.mkdirSync(path.join(d, ".claude", "standards"), { recursive: true });
    fs.mkdirSync(path.join(d, ".claude", "methodologies", "existente"), { recursive: true });
    fs.writeFileSync(path.join(d, ".claude", "standards", "padrao-x.json"), JSON.stringify({
        schemaVersion: 1, id: "X", name: "Padrão X", items: []
    }));
    fs.writeFileSync(path.join(d, "protocolo.md"), "# protocolo travado\n");
    return d;
}

beforeEach(() => { RAIZ = novaRaiz(); });
afterAll(() => { for (const d of criados) { try { fs.rmSync(d, { recursive: true, force: true }); } catch { } } });

const achado = (o: Record<string, unknown> = {}) => ({
    id: "T-1", summary: "algo", change_type: "EXTENSAO", evidence: "promete A, faz B",
    status: "ABERTO", destino: "FASE_1", ...o
});
const entrada = (o: Record<string, unknown> = {}) => ({
    id: "m1", name: "M1", kind: "review_method", what_it_is: "o que é",
    when_to_use: "quando usar", requires: "o que exige", source_url: "https://exemplo.org/m1", ...o
});

describe("backlog — escrita validada ANTES de gravar", () => {
    it("registra achado válido e o backlog passa na própria auditoria", () => {
        const r = BacklogWriter.registrar(RAIZ, achado());
        expect(r.ok).toBe(true);
        const a = SystemDebtService.audit(SystemDebtService.read(RAIZ));
        expect(a.valid).toBe(true);
        expect(a.total).toBe(1);
    });

    it("RECUSA CORRECAO sem reprodução — e não grava nada", () => {
        const r = BacklogWriter.registrar(RAIZ, achado({ change_type: "CORRECAO" }));
        expect(r.ok).toBe(false);
        expect(r.errors[0]).toMatch(/reproduction/);
        expect(SystemDebtService.read(RAIZ)).toBeNull(); // nada foi escrito
    });

    it("RECUSA achado entrando já RESOLVIDO sem justificativa", () => {
        const r = BacklogWriter.registrar(RAIZ, achado({ status: "RESOLVIDO" }));
        expect(r.ok).toBe(false);
        expect(r.errors[0]).toMatch(/resolution/);
    });

    it("RECUSA id duplicado, a menos que atualizar=true", () => {
        expect(BacklogWriter.registrar(RAIZ, achado()).ok).toBe(true);
        const dup = BacklogWriter.registrar(RAIZ, achado({ summary: "outro" }));
        expect(dup.ok).toBe(false);
        expect(dup.errors[0]).toMatch(/Já existe achado/);

        const upd = BacklogWriter.registrar(RAIZ, achado({ summary: "outro" }), true);
        expect(upd.ok).toBe(true);
        expect(SystemDebtService.read(RAIZ)!.findings).toHaveLength(1);
    });

    it("RECUSA atualizar achado inexistente", () => {
        const r = BacklogWriter.registrar(RAIZ, achado(), true);
        expect(r.ok).toBe(false);
        expect(r.errors[0]).toMatch(/Nenhum achado/);
    });

    it("atualização PARCIAL preserva os campos não enviados", () => {
        // bug real, pego pela suíte: o update sobrescrevia evidence/context/found_by com "",
        // porque o zod preenche default e o spread clobberava o registro antigo.
        BacklogWriter.registrar(RAIZ, achado({
            evidence: "evidência original", context: "contexto original", found_by: "quem achou"
        }));
        const r = BacklogWriter.registrar(RAIZ, { id: "T-1", status: "EM_CURSO" }, true);
        expect(r.ok).toBe(true);
        const f = SystemDebtService.read(RAIZ)!.findings[0];
        expect(f.status).toBe("EM_CURSO");
        expect(f.evidence).toBe("evidência original");
        expect(f.context).toBe("contexto original");
        expect(f.found_by).toBe("quem achou");
    });

    it("fechar achado usa a 'resolution' ENVIADA, mesmo que os outros campos não venham", () => {
        BacklogWriter.registrar(RAIZ, achado({ change_type: "CORRECAO", reproduction: "passos" }));
        const r = BacklogWriter.registrar(RAIZ, { id: "T-1", status: "RESOLVIDO", resolution: "corrigido em X" }, true);
        expect(r.ok).toBe(true);
        expect(SystemDebtService.read(RAIZ)!.findings[0].reproduction).toBe("passos");
    });

    it("RECUSA fechar sem resolution, olhando o estado FINAL e não só o enviado", () => {
        BacklogWriter.registrar(RAIZ, achado());
        const r = BacklogWriter.registrar(RAIZ, { id: "T-1", status: "RESOLVIDO" }, true);
        expect(r.ok).toBe(false);
        expect(r.errors[0]).toMatch(/resolution/);
    });

    it("RECUSA achado sem 'destino' — achado órfão some do radar", () => {
        // Foi assim que 57 de 85 abertos sumiram: registrados sem destino, nunca
        // classificados, nunca planejados. Agora o escritor não deixa nascer órfão.
        const r = BacklogWriter.registrar(RAIZ, achado({ destino: "" }));
        expect(r.ok).toBe(false);
        expect(r.errors.join(" ")).toMatch(/nasce órfão/);
        expect(SystemDebtService.read(RAIZ)).toBeNull(); // nada gravado
    });

    it("aceita 'depende_de' e a auditoria passa a apontar quem espera quem", () => {
        BacklogWriter.registrar(RAIZ, achado({ id: "A" }));
        BacklogWriter.registrar(RAIZ, achado({ id: "B", depende_de: ["A"] }));
        const a = SystemDebtService.audit(SystemDebtService.read(RAIZ));
        expect(a.bloqueados_por_dependencia).toEqual([{ id: "B", espera: ["A"] }]);
    });

    it("preenche found_at quando omitido — RV-04 pede data em toda decisão", () => {
        BacklogWriter.registrar(RAIZ, achado());
        expect(SystemDebtService.read(RAIZ)!.findings[0].found_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});

describe("arquivo ILEGÍVEL nunca é tratado como vazio — a perda silenciosa", () => {
    it("RECUSA escrever no backlog quando o arquivo em disco não passa no schema", () => {
        // O defeito medido: backlog real de 18 achados com um `change_type` escrito com
        // cedilha virava 1 achado. `read()` devolvia null, o escritor entendia "não existe"
        // e gravava por cima. A fila inteira de memória do sistema, em silêncio.
        BacklogWriter.registrar(RAIZ, achado({ id: "A-1" }));
        BacklogWriter.registrar(RAIZ, achado({ id: "A-2" }));
        expect(SystemDebtService.read(RAIZ)!.findings).toHaveLength(2);

        const p = SystemDebtService.debtPath(RAIZ);
        const bom = JSON.parse(fs.readFileSync(p, "utf-8"));
        bom.findings[0].change_type = "CORREÇÃO"; // valor fora do enum — plausível numa edição à mão
        fs.writeFileSync(p, JSON.stringify(bom));

        const r = BacklogWriter.registrar(RAIZ, achado({ id: "A-3" }));
        expect(r.ok).toBe(false);
        expect(r.errors[0]).toMatch(/ILEGÍVEL/);
        expect(r.errors[1]).toMatch(/apagaria/);
        // e o arquivo continua com os 2 achados originais, não foi sobrescrito
        expect(JSON.parse(fs.readFileSync(p, "utf-8")).findings).toHaveLength(2);
    });

    it("RECUSA escrever no catálogo ilegível", () => {
        CatalogWriter.absorver(RAIZ, entrada({ id: "m1" }));
        const p = MethodologyCatalogService.catalogPath(RAIZ);
        fs.writeFileSync(p, "{ isto não é json");
        const r = CatalogWriter.absorver(RAIZ, entrada({ id: "m2" }));
        expect(r.ok).toBe(false);
        expect(r.errors[0]).toMatch(/ILEGÍVEL/);
        expect(fs.readFileSync(p, "utf-8")).toBe("{ isto não é json"); // intocado
    });

    it("distingue AUSENTE de ILEGÍVEL — ausente segue sendo criação normal", () => {
        expect(SystemDebtService.probe(RAIZ).status).toBe("AUSENTE");
        expect(BacklogWriter.registrar(RAIZ, achado()).ok).toBe(true);
        expect(SystemDebtService.probe(RAIZ).status).toBe("OK");
    });
});

describe("catálogo — absorver exige fonte externa", () => {
    it("absorve entrada com fonte oficial e devolve o status DERIVADO", () => {
        const r = CatalogWriter.absorver(RAIZ, entrada());
        expect(r.ok).toBe(true);
        expect((r.resultado as any).status_derivado).toBe("AUSENTE"); // não implementada neste repo
        expect(MethodologyCatalogService.read(RAIZ)!.entries).toHaveLength(1);
    });

    it("RECUSA entrada sem source_url externo — palpite não é catálogo", () => {
        const semFonte = CatalogWriter.absorver(RAIZ, entrada({ source_url: "" }));
        expect(semFonte.ok).toBe(false);
        expect(semFonte.errors[0]).toMatch(/source_url/);

        // caminho interno também não serve: a fonte precisa ser a norma, não o próprio sistema
        const interna = CatalogWriter.absorver(RAIZ, entrada({ source_url: ".claude/methodologies/x/spec.md" }));
        expect(interna.ok).toBe(false);
    });

    it("RECUSA entrada sem os campos que a tornam útil", () => {
        const r = CatalogWriter.absorver(RAIZ, entrada({ when_to_use: "", requires: "" }));
        expect(r.ok).toBe(false);
        expect(r.errors.length).toBe(2);
    });

    it("NÃO grava status no arquivo — ele continua derivado do disco (RV-02)", () => {
        CatalogWriter.absorver(RAIZ, entrada({ methodology_dir: "existente" }));
        const bruto = fs.readFileSync(MethodologyCatalogService.catalogPath(RAIZ), "utf-8");
        expect(bruto).not.toContain("status_in_system");
        // e o derivado reflete o disco: a pasta 'existente' foi criada no fixture
        const rel = MethodologyCatalogService.resolve(RAIZ, MethodologyCatalogService.read(RAIZ));
        expect(rel.entries[0].status_in_system).toBe("IMPLEMENTADA");
    });
});

describe("metodologia — criar é EXTENSAO e passa pelo RV-11", () => {
    const nova = (o: Record<string, unknown> = {}) => ({
        id: "metodo-novo", name: "Método Novo", review_type: "Teste", description: "desc",
        standards: ["padrao-x"], question_frameworks: ["PICOS"],
        protocol_path: "protocolo.md", protocol_locked: true, ...o
    });

    it("cria o esqueleto quando o protocolo está travado e existe", () => {
        const r = MethodologyWriter.criar(RAIZ, nova());
        expect(r.ok).toBe(true);
        const dir = path.join(RAIZ, ".claude", "methodologies", "metodo-novo");
        expect(fs.existsSync(path.join(dir, "manifest.json"))).toBe(true);
        expect(fs.readFileSync(path.join(dir, "spec.md"), "utf-8")).toContain("[TBD]");
    });

    it("RECUSA protocolo em rascunho — é o caminho fácil de contornar o gate", () => {
        const r = MethodologyWriter.criar(RAIZ, nova({ protocol_locked: false }));
        expect(r.ok).toBe(false);
        expect(r.errors[0]).toMatch(/TRAVADO/);
    });

    it("RECUSA protocolo que não existe no disco", () => {
        const r = MethodologyWriter.criar(RAIZ, nova({ protocol_path: "nao-existe.md" }));
        expect(r.ok).toBe(false);
        expect(r.errors.some((e) => /não existe no disco/.test(e))).toBe(true);
    });

    it("RECUSA padrão declarado que não está em .claude/standards/", () => {
        const r = MethodologyWriter.criar(RAIZ, nova({ standards: ["inexistente"] }));
        expect(r.ok).toBe(false);
        expect(r.errors[0]).toMatch(/checklist/);
    });

    it("RECUSA sobrescrever metodologia existente", () => {
        const r = MethodologyWriter.criar(RAIZ, nova({ id: "existente" }));
        expect(r.ok).toBe(false);
        expect(r.errors[0]).toMatch(/Já existe/);
    });
});

describe("metodologia — validar é a verificação que faltava para ALTERAÇÕES", () => {
    // DEBT-100: metodologia bem formada declara a TRILHA — lista de etapas, cada uma com o
    // papel que a executa (agente que existe) e o artefato que a encerra.
    const TRILHA = [
        { id: "E1", name: "Desenho", role: "designer", closes_with: "protocol.md", producer_tools: ["plan_research_protocol"] },
        { id: "E2", name: "Campo", role: "designer", closes_with: "campo/notas.md", producer_tools: [] },
    ];
    function manifesto(o: Record<string, unknown>) {
        const dir = path.join(RAIZ, ".claude", "methodologies", "alvo");
        fs.mkdirSync(dir, { recursive: true });
        fs.mkdirSync(path.join(RAIZ, ".claude", "agents"), { recursive: true });
        fs.writeFileSync(path.join(RAIZ, ".claude", "agents", "designer.md"), "# designer\n");
        fs.writeFileSync(path.join(dir, "spec.md"), "# spec\n");
        fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify({
            id: "alvo", spec: "spec.md", conformance: { standards: ["padrao-x"] }, phases: TRILHA,
            invariants_always_on: ["RV-01"], gates: [{ rule: "RV-01", tool: "x" }], ...o
        }));
    }

    it("aprova metodologia bem formada", () => {
        manifesto({});
        expect(MethodologyWriter.validar(RAIZ, "alvo").ok).toBe(true);
    });

    it("DEBT-100: reprova trilha no formato antigo — mapa de interruptores não diz quais etapas existem", () => {
        manifesto({ phases: { F0: { name: "Pré-registro", active: true } } });
        const r = MethodologyWriter.validar(RAIZ, "alvo");
        expect(r.ok).toBe(false);
        expect(r.errors.join(" ")).toMatch(/formato antigo/);
    });

    it("DEBT-100: reprova etapa entregue a papel que não existe — ninguém a executaria", () => {
        manifesto({ phases: [{ ...TRILHA[0], role: "etnografo" }] });
        const r = MethodologyWriter.validar(RAIZ, "alvo");
        expect(r.ok).toBe(false);
        expect(r.errors.join(" ")).toMatch(/papel "etnografo" não existe/);
    });

    it("DEBT-100: reprova tool produtora inexistente — seria afirmar código que não há", () => {
        manifesto({ phases: [{ ...TRILHA[0], producer_tools: ["escreve_manuscrito"] }] });
        const r = MethodologyWriter.validar(RAIZ, "alvo");
        expect(r.ok).toBe(false);
        expect(r.errors.join(" ")).toMatch(/"escreve_manuscrito".*não existe/);
    });

    it("DEBT-100: reprova gate pendurado em etapa que a trilha não tem", () => {
        manifesto({ gates: [{ phase: "F4", rule: "RV-01", tool: "x" }] });
        const r = MethodologyWriter.validar(RAIZ, "alvo");
        expect(r.ok).toBe(false);
        expect(r.errors.join(" ")).toMatch(/etapa "F4", que não existe na trilha/);
    });

    it("DEBT-100: o esqueleto do scaffold nasce com a trilha por declarar — e é recusado por isso", () => {
        expect(MethodologyWriter.criar(RAIZ, {
            id: "metodo-esq", name: "Esq", review_type: "T", description: "d", standards: ["padrao-x"],
            question_frameworks: [], protocol_path: "protocolo.md", protocol_locked: true,
        }).ok).toBe(true);
        const r = MethodologyWriter.validar(RAIZ, "metodo-esq");
        expect(r.ok).toBe(false);
        expect(r.errors.join(" ")).toMatch(/esqueleto do scaffold/);
    });

    it("pega o DEBT-003: invariante 'always_on' sem gate que o ative", () => {
        manifesto({ invariants_always_on: ["RV-01", "RV-02", "RV-03"], gates: [{ rule: "RV-01", tool: "x" }] });
        const r = MethodologyWriter.validar(RAIZ, "alvo");
        expect(r.ok).toBe(false);
        expect(r.errors[0]).toMatch(/RV-02, RV-03/);
        expect(r.errors[0]).toMatch(/ninguém chama/);
    });

    it("pega o DEBT-004: metodologia que não declara contra que padrão verifica", () => {
        manifesto({ conformance: {} });
        const r = MethodologyWriter.validar(RAIZ, "alvo");
        expect(r.ok).toBe(false);
        expect(r.errors.some((e) => /conformance.standards/.test(e))).toBe(true);
    });

    it("pega padrão declarado que não existe como dado", () => {
        manifesto({ conformance: { standards: ["fantasma"] } });
        const r = MethodologyWriter.validar(RAIZ, "alvo");
        expect(r.ok).toBe(false);
        expect(r.errors.some((e) => /fantasma/.test(e))).toBe(true);
    });

    it("RECUSA metodologia inexistente", () => {
        expect(MethodologyWriter.validar(RAIZ, "nao-existe").ok).toBe(false);
    });

    /**
     * Metodologia se assimila COMPLETA, ou não entra.
     *
     * `tbd_na_spec` era contado e reportado sem reprovar — spec com campo por preencher
     * passava. Decisão do pesquisador (04/10/2026): não há custo que justifique assimilação
     * parcial (o maior padrão tem 12 KB; as duas metodologias somam 58 KB), e método meio
     * assimilado executa trilha que o sistema não sabe fundamentar ao pesquisador.
     */
    it("REPROVA spec com campo por preencher — assimilação é completa ou não é", () => {
        manifesto({});
        const dir = path.join(RAIZ, ".claude", "methodologies", "alvo");
        fs.writeFileSync(path.join(dir, "spec.md"), "| campo | valor |\n| Framework | [TBD] |\n");
        const r = MethodologyWriter.validar(RAIZ, "alvo");
        expect(r.ok).toBe(false);
        expect(r.errors.join(" ")).toMatch(/assimila COMPLETA/);
        expect((r.resultado as any).tbd_na_spec).toBe(1);
    });

    it("NÃO reprova a spec que apenas EXPLICA a regra do [TBD] — campo ≠ menção", () => {
        // A primeira versão desta trava contava toda ocorrência de "[TBD]" e reprovava as
        // duas metodologias reais por citarem o RV-03 ("campos ausentes são [TBD]"), uma
        // delas dentro da tabela de invariantes. Reprovar a metodologia por estar bem
        // documentada é o inverso do que se quer.
        manifesto({});
        const dir = path.join(RAIZ, ".claude", "methodologies", "alvo");
        fs.writeFileSync(
            path.join(dir, "spec.md"),
            "Campos ausentes recebem [TBD], nunca inventados (RV-03).\n| RV-03 | usa [TBD] | Todas |\n",
        );
        const r = MethodologyWriter.validar(RAIZ, "alvo");
        expect((r.resultado as any).tbd_na_spec).toBe(0);
        expect(r.ok).toBe(true);
    });

    it("as duas metodologias REAIS não têm campo pendente — controle positivo", () => {
        // Sem controle positivo a trava acima poderia estar sempre devolvendo 0 e ninguém
        // notaria. Aqui ela é exercida contra as metodologias de verdade, em disco.
        const REPO = path.resolve(process.cwd(), "..", "..");
        for (const id of ["prisma-sr", "scoping-prisma-scr"]) {
            const r = MethodologyWriter.validar(REPO, id);
            expect((r.resultado as any).tbd_na_spec, `${id} tem campo [TBD] por preencher`).toBe(0);
        }
    });

    it("DEBT-100: a trilha das duas metodologias REAIS é legível — papéis existem, tools produtoras existem", () => {
        // Elas ainda reprovam por OUTRO motivo, já registrado (DEBT-003: invariante sem gate).
        // O que este teste guarda é que nenhum erro de TRILHA se soma a ele.
        const REPO = path.resolve(process.cwd(), "..", "..");
        for (const id of ["prisma-sr", "scoping-prisma-scr"]) {
            const r = MethodologyWriter.validar(REPO, id);
            expect(r.errors.filter((e) => /Trilha|etapa/.test(e)), id).toEqual([]);
            expect((r.resultado as any).etapas, id).toBe(10);
        }
    });
});
