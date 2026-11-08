import { describe, it, expect, beforeEach, afterAll } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { BacklogWriter } from "../src/services/maintenance_writes.js";
import { SystemDebtService, conferirMentiraNoDisco, faltasDaMentira } from "../src/services/system_debt.js";

/**
 * A PORTA DO BACKLOG — sessão P, 08/11/2026.
 *
 * Regra do backlog e decisão 5 (05/11/2026, à tarde): o backlog registra só defeito — o que o
 * sistema afirma, exige ou entrega hoje e não se sustenta (DIRECAO §9) —, e o destino
 * METODOLOGIA_NOVA deixa de valer para defeito. A `record_system_finding` passa a pedir, para
 * achado ABERTO ou EM_CURSO, a mentira de hoje: onde o sistema afirma ou exige (arquivo e linha,
 * conferidos no disco), o que diz ali e o que mostra que não se sustenta.
 *
 * Testes de resposta conhecida (A5: conferidor só vale como prova com eles): sem o campo,
 * recusa; arquivo inexistente, recusa; linha além do fim, recusa; campo completo, aceita;
 * fechar sem o campo, aceita; METODOLOGIA_NOVA em aberto, recusa; em fechado, aceita. E a
 * trava vale para o registro MESCLADO, porque o BacklogWriter mescla antes de validar (DEBT-107).
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, "../../..");
const MCP = path.resolve(here, "..");
const CLAUDE = path.join(REPO, ".claude");

let RAIZ: string;
const criados: string[] = [];
beforeEach(() => {
    RAIZ = fs.mkdtempSync(path.join(os.tmpdir(), "reviewbr-porta-"));
    criados.push(RAIZ);
    fs.mkdirSync(path.join(RAIZ, "src"), { recursive: true });
    // 3 linhas, com quebra no fim: a linha 3 existe, a 4 já passa do fim.
    fs.writeFileSync(path.join(RAIZ, "src", "afirma.ts"), "// linha 1\nexport const promete = 'A';\n// linha 3\n");
});
afterAll(() => { for (const d of criados) { try { fs.rmSync(d, { recursive: true, force: true }); } catch { } } });

const MENTIRA = { arquivo: "src/afirma.ts", linha: 2, diz: "promete A", nao_se_sustenta: "o handler faz B" };
const achado = (o: Record<string, unknown> = {}) => ({
    id: "P-1", summary: "s", change_type: "CORRECAO", evidence: "promete A, faz B", reproduction: "passos",
    status: "ABERTO", destino: "FASE_1", mentira_de_hoje: MENTIRA, ...o
});
const semMentira = (o: Record<string, unknown> = {}) => {
    const a: any = achado(o);
    delete a.mentira_de_hoje;
    return a;
};
const lido = () => SystemDebtService.read(RAIZ);
const gravado = (id = "P-1") => lido()!.findings.find((f) => f.id === id)!;

/** Grava direto no disco um backlog de antes da regra — o que os 43 abertos de 08/11 são. */
function backlogAntigo(...findings: any[]) {
    SystemDebtService.write(RAIZ, { schemaVersion: 1, updatedAt: "", findings: findings.map((f) => ({
        reproduction: "", location: "", resolution: "", found_by: "", found_at: "2026-09-25", context: "",
        gravidade: "", depende_de: [], ...f
    })) }, "2026-11-08T00:00:00Z");
}

describe("a porta — testes de resposta conhecida", () => {
    it("sem o campo, RECUSA — e a mensagem diz o que falta e cita a regra", () => {
        const r = BacklogWriter.registrar(RAIZ, semMentira());
        expect(r.ok).toBe(false);
        const msg = r.errors.join(" ");
        expect(msg).toMatch(/sem a "mentira de hoje" completa — falta: mentira_de_hoje \(arquivo, linha, diz, nao_se_sustenta\)/);
        expect(msg).toMatch(/O backlog registra só defeito: o que o sistema afirma, exige ou entrega hoje e não se sustenta/);
        expect(msg).toMatch(/regra do backlog, 05\/11\/2026; DIRECAO §9/);
        expect(msg).toMatch(/Ausência não é achado/);
        expect(lido()).toBeNull(); // nada gravado
    });

    it("campo incompleto, RECUSA — e diz quais partes faltam", () => {
        const r = BacklogWriter.registrar(RAIZ, achado({ mentira_de_hoje: { arquivo: "src/afirma.ts", linha: 0 } }));
        expect(r.ok).toBe(false);
        expect(r.errors.join(" ")).toMatch(/falta: linha \(a partir de 1\), diz, nao_se_sustenta\./);
    });

    it("arquivo inexistente, RECUSA", () => {
        const r = BacklogWriter.registrar(RAIZ, achado({ mentira_de_hoje: { ...MENTIRA, arquivo: "src/nao_existe.ts" } }));
        expect(r.ok).toBe(false);
        expect(r.errors.join(" ")).toMatch(/"src\/nao_existe\.ts" não existe no repositório/);
        expect(lido()).toBeNull();
    });

    it("linha além do fim, RECUSA — e a última linha é aceita (a fronteira)", () => {
        const alem = BacklogWriter.registrar(RAIZ, achado({ mentira_de_hoje: { ...MENTIRA, linha: 4 } }));
        expect(alem.ok).toBe(false);
        expect(alem.errors.join(" ")).toMatch(/linha 4 passa do fim de "src\/afirma\.ts", que tem 3 linha\(s\)/);
        expect(lido()).toBeNull();
        expect(BacklogWriter.registrar(RAIZ, achado({ mentira_de_hoje: { ...MENTIRA, linha: 3 } })).ok).toBe(true);
    });

    it("campo completo, ACEITA — e grava a mentira de hoje como veio", () => {
        const r = BacklogWriter.registrar(RAIZ, achado());
        expect(r.ok).toBe(true);
        expect(gravado().mentira_de_hoje).toEqual(MENTIRA);
        expect(SystemDebtService.audit(lido()).sem_mentira_de_hoje).toEqual([]);
    });

    it("EM_CURSO pede o mesmo que ABERTO", () => {
        expect(BacklogWriter.registrar(RAIZ, semMentira({ status: "EM_CURSO" })).ok).toBe(false);
        expect(BacklogWriter.registrar(RAIZ, achado({ status: "EM_CURSO" })).ok).toBe(true);
    });

    it("fechar sem o campo, ACEITA — sair da fila exige só a resolução", () => {
        expect(BacklogWriter.registrar(RAIZ, semMentira({ id: "R", status: "RESOLVIDO", resolution: "feito" })).ok).toBe(true);
        expect(BacklogWriter.registrar(RAIZ, semMentira({ id: "X", status: "RECUSADO", resolution: "não é defeito" })).ok).toBe(true);
        // e fechar um aberto de antes da regra, que não tem o campo
        backlogAntigo({ id: "V", summary: "s", change_type: "EXTENSAO", evidence: "e", status: "ABERTO", destino: "FASE_1" });
        const r = BacklogWriter.registrar(RAIZ, { id: "V", status: "RECUSADO", resolution: "ausência, não defeito" }, true);
        expect(r.ok).toBe(true);
        expect(gravado("V").status).toBe("RECUSADO");
    });

    it("METODOLOGIA_NOVA em aberto, RECUSA — mesmo com a mentira de hoje completa", () => {
        for (const status of ["ABERTO", "EM_CURSO"]) {
            const r = BacklogWriter.registrar(RAIZ, achado({ destino: "METODOLOGIA_NOVA", status }));
            expect(r.ok, status).toBe(false);
            expect(r.errors.join(" ")).toMatch(new RegExp(`Destino METODOLOGIA_NOVA não vale para achado ${status} \\(decisão 5, 05/11/2026\\)`));
            expect(r.errors.join(" ")).toMatch(/fica no catálogo/);
        }
        expect(lido()).toBeNull();
    });

    it("METODOLOGIA_NOVA em fechado, ACEITA — segue válido como histórico", () => {
        expect(BacklogWriter.registrar(RAIZ, semMentira({ destino: "METODOLOGIA_NOVA", status: "RECUSADO", resolution: "assimilação, não defeito" })).ok).toBe(true);
        // e editar a resolução de um fechado com esse destino também passa
        expect(BacklogWriter.registrar(RAIZ, { id: "P-1", resolution: "assimilação; vai ao catálogo" }, true).ok).toBe(true);
        expect(SystemDebtService.audit(lido()).valid).toBe(true);
    });
});

describe("a porta vale para o registro MESCLADO (o merge vem antes da validação — DEBT-107)", () => {
    it("aberto de antes da regra: atualizar só o estado é RECUSADO; com a mentira de hoje, aceito", () => {
        backlogAntigo({ id: "V", summary: "s", change_type: "EXTENSAO", evidence: "e", status: "ABERTO", destino: "FASE_1" });
        const so = BacklogWriter.registrar(RAIZ, { id: "V", status: "EM_CURSO" }, true);
        expect(so.ok).toBe(false);
        expect(so.errors.join(" ")).toMatch(/Achado EM_CURSO sem a "mentira de hoje" completa/);
        expect(gravado("V").status).toBe("ABERTO"); // o disco não mudou

        const com = BacklogWriter.registrar(RAIZ, { id: "V", status: "EM_CURSO", mentira_de_hoje: MENTIRA }, true);
        expect(com.ok).toBe(true);
        expect(gravado("V").status).toBe("EM_CURSO");
        expect(gravado("V").found_at).toBe("2026-09-25"); // procedência intocada
    });

    it("aberto com a mentira gravada: atualização que não a reenvia é aceita, e ela fica", () => {
        BacklogWriter.registrar(RAIZ, achado());
        const r = BacklogWriter.registrar(RAIZ, { id: "P-1", context: "tocado na sessão N" }, true);
        expect(r.ok).toBe(true);
        expect(gravado().mentira_de_hoje).toEqual(MENTIRA);
    });

    it("mandar só a linha que andou mescla com o gravado — e a linha errada é recusada sem estragar o disco", () => {
        BacklogWriter.registrar(RAIZ, achado());
        expect(BacklogWriter.registrar(RAIZ, { id: "P-1", mentira_de_hoje: { linha: 3 } }, true).ok).toBe(true);
        expect(gravado().mentira_de_hoje).toEqual({ ...MENTIRA, linha: 3 });

        const errada = BacklogWriter.registrar(RAIZ, { id: "P-1", mentira_de_hoje: { linha: 9 } }, true);
        expect(errada.ok).toBe(false);
        expect(errada.errors.join(" ")).toMatch(/linha 9 passa do fim/);
        expect(gravado().mentira_de_hoje).toEqual({ ...MENTIRA, linha: 3 });
    });

    it("fechar mandando parte da mentira de hoje não apaga o resto — fechar não a confere", () => {
        BacklogWriter.registrar(RAIZ, achado());
        const r = BacklogWriter.registrar(RAIZ, { id: "P-1", status: "RESOLVIDO", resolution: "corrigido", mentira_de_hoje: { linha: 99 } }, true);
        expect(r.ok).toBe(true);
        expect(gravado().mentira_de_hoje).toEqual({ ...MENTIRA, linha: 99 });
    });

    it("reabrir um fechado exige a mentira de hoje de novo", () => {
        BacklogWriter.registrar(RAIZ, semMentira({ status: "RESOLVIDO", resolution: "feito" }));
        expect(BacklogWriter.registrar(RAIZ, { id: "P-1", status: "ABERTO" }, true).ok).toBe(false);
        expect(BacklogWriter.registrar(RAIZ, { id: "P-1", status: "ABERTO", mentira_de_hoje: MENTIRA }, true).ok).toBe(true);
    });

    it("trocar para METODOLOGIA_NOVA um aberto que tem a mentira de hoje é recusado", () => {
        BacklogWriter.registrar(RAIZ, achado());
        const r = BacklogWriter.registrar(RAIZ, { id: "P-1", destino: "METODOLOGIA_NOVA" }, true);
        expect(r.ok).toBe(false);
        expect(gravado().destino).toBe("FASE_1");
    });
});

describe("o lugar da afirmação é conferido no disco", () => {
    it("caminho absoluto é recusado — o backlog muda de máquina com o repositório", () => {
        const r = BacklogWriter.registrar(RAIZ, achado({ mentira_de_hoje: { ...MENTIRA, arquivo: path.join(RAIZ, "src", "afirma.ts") } }));
        expect(r.ok).toBe(false);
        expect(r.errors.join(" ")).toMatch(/caminho absoluto: use o caminho relativo à raiz do repositório/);
    });

    it("caminho que sai da raiz é recusado, mesmo que o arquivo exista lá fora", () => {
        const fora = path.join(path.dirname(RAIZ), "fora-da-raiz.txt");
        fs.writeFileSync(fora, "x\n");
        criados.push(fora);
        const r = BacklogWriter.registrar(RAIZ, achado({ mentira_de_hoje: { ...MENTIRA, arquivo: "../fora-da-raiz.txt", linha: 1 } }));
        expect(r.ok).toBe(false);
        expect(r.errors.join(" ")).toMatch(/sai da raiz do repositório/);
    });

    it("pasta não é arquivo", () => {
        expect(conferirMentiraNoDisco(RAIZ, { ...MENTIRA, arquivo: "src", linha: 1 })).toEqual(['mentira_de_hoje.arquivo "src" não é arquivo.']);
    });

    it("'arquivo:linha' no caminho é recusado, com a dica de onde vai a linha", () => {
        const e = conferirMentiraNoDisco(RAIZ, { ...MENTIRA, arquivo: "src/afirma.ts:2" });
        expect(e.join(" ")).toMatch(/não existe no repositório\. A linha vai no campo 'linha'/);
    });

    it("CRLF e arquivo sem quebra no fim contam as linhas como o editor", () => {
        fs.writeFileSync(path.join(RAIZ, "crlf.md"), "a\r\nb\r\n");
        fs.writeFileSync(path.join(RAIZ, "sem_quebra.md"), "a\nb");
        fs.writeFileSync(path.join(RAIZ, "vazio.md"), "");
        for (const arq of ["crlf.md", "sem_quebra.md"]) {
            expect(conferirMentiraNoDisco(RAIZ, { ...MENTIRA, arquivo: arq, linha: 2 }), arq).toEqual([]);
            expect(conferirMentiraNoDisco(RAIZ, { ...MENTIRA, arquivo: arq, linha: 3 }).join(" "), arq).toMatch(/tem 2 linha/);
        }
        expect(conferirMentiraNoDisco(RAIZ, { ...MENTIRA, arquivo: "vazio.md", linha: 1 }).join(" ")).toMatch(/tem 0 linha/);
    });

    it("faltasDaMentira não olha o disco: só diz o que falta", () => {
        expect(faltasDaMentira(undefined)).toEqual(["mentira_de_hoje (arquivo, linha, diz, nao_se_sustenta)"]);
        expect(faltasDaMentira({ arquivo: " ", linha: 1, diz: "d", nao_se_sustenta: "n" })).toEqual(["arquivo"]);
        expect(faltasDaMentira(MENTIRA)).toEqual([]);
    });
});

describe("audit_system_debt — aviso, não erro, para os abertos sem a mentira de hoje", () => {
    const f = (o: Record<string, unknown>) => ({
        id: "A", summary: "s", change_type: "EXTENSAO", evidence: "e", reproduction: "", location: "",
        status: "ABERTO", resolution: "", found_by: "", found_at: "2026-11-08", context: "", gravidade: "",
        destino: "FASE_1", depende_de: [], ...o
    });
    const audit = (...fs_: any[]) => SystemDebtService.audit({ schemaVersion: 1, updatedAt: "", findings: fs_ });

    it("conta os abertos sem ela e AVISA — o backlog segue válido", () => {
        const a = audit(
            f({ id: "A" }),
            f({ id: "B", status: "EM_CURSO" }),
            f({ id: "C", mentira_de_hoje: MENTIRA }),
            f({ id: "D", status: "RESOLVIDO", resolution: "feito" }),
            f({ id: "E", mentira_de_hoje: { ...MENTIRA, diz: "" } }), // incompleta conta como sem
        );
        expect(a.valid).toBe(true);
        expect(a.errors).toEqual([]);
        expect(a.sem_mentira_de_hoje).toEqual(["A", "B", "E"]);
        expect(a.warnings).toHaveLength(1);
        expect(a.warnings[0]).toMatch(/^3 achado\(s\) aberto\(s\) sem a "mentira de hoje" \(arquivo, linha, diz, nao_se_sustenta\): A, B, E\. Não reprova/);
        expect(a.warnings[0]).toMatch(/regra do backlog, 05\/11\/2026/);
    });

    it("sem nenhum aberto sem ela, não há aviso", () => {
        const a = audit(f({ mentira_de_hoje: MENTIRA }));
        expect(a.warnings).toEqual([]);
        expect(a.sem_mentira_de_hoje).toEqual([]);
    });

    it("lista longa: o aviso cita 10 e manda à lista completa", () => {
        const muitos = Array.from({ length: 12 }, (_, i) => f({ id: `M-${i}` }));
        const a = audit(...muitos);
        expect(a.sem_mentira_de_hoje).toHaveLength(12);
        expect(a.warnings[0]).toMatch(/^12 achado\(s\).*M-9 … e mais 2 \(lista em sem_mentira_de_hoje\)\./);
    });

    it("aberto com METODOLOGIA_NOVA REPROVA; fechado com ele, não", () => {
        const aberto = audit(f({ destino: "METODOLOGIA_NOVA", mentira_de_hoje: MENTIRA }));
        expect(aberto.valid).toBe(false);
        expect(aberto.errors.join(" ")).toMatch(/1 achado\(s\) aberto\(s\) com o destino METODOLOGIA_NOVA: A\. Esse destino deixou de valer para defeito \(decisão 5, 05\/11\/2026\)/);
        expect(audit(f({ destino: "METODOLOGIA_NOVA", status: "RECUSADO", resolution: "x" })).valid).toBe(true);
    });
});

describe("backlog real em disco — a saída do item 1 e o aviso", () => {
    const real = SystemDebtService.read(REPO)!;
    const abertos = real.findings.filter((x) => x.status === "ABERTO" || x.status === "EM_CURSO");

    it("nenhum achado aberto com o destino METODOLOGIA_NOVA (sessão P, item 1)", () => {
        expect(abertos.filter((x) => x.destino === "METODOLOGIA_NOVA").map((x) => x.id)).toEqual([]);
    });

    it("a auditoria é válida e conta, no aviso, os abertos sem a mentira de hoje", () => {
        const a = SystemDebtService.audit(real);
        expect(a.valid).toBe(true);
        // contagem independente da que a auditoria faz: sem o campo, ou com parte vazia
        const sem = abertos.filter((x) => {
            const m = x.mentira_de_hoje;
            return !m || !m.arquivo.trim() || !(m.linha >= 1) || !m.diz.trim() || !m.nao_se_sustenta.trim();
        }).map((x) => x.id);
        expect(a.sem_mentira_de_hoje).toEqual(sem);
        if (sem.length) expect(a.warnings.join(" ")).toContain(`${sem.length} achado(s) aberto(s) sem a "mentira de hoje"`);
        else expect(a.warnings).toEqual([]);
    });
});

describe("a descrição das tools diz a regra — a frase velha não passa", () => {
    const src = fs.readFileSync(path.join(MCP, "src", "index.ts"), "utf-8");
    const bloco = (tool: string) => {
        const i = src.indexOf(`"${tool}",`);
        return src.slice(i, src.indexOf("server.tool(", i));
    };

    it("record_system_finding: só defeito, a mentira de hoje e o destino histórico", () => {
        const d = bloco("record_system_finding");
        expect(d).toMatch(/O backlog registra so DEFEITO: o que o sistema afirma, exige ou entrega HOJE e nao se sustenta/);
        expect(d).toMatch(/exige mentira_de_hoje: arquivo \(caminho relativo a raiz do repositorio\) e linha/);
        expect(d).toMatch(/o texto da linha nao e conferido/);
        expect(d).toMatch(/METODOLOGIA_NOVA so em achado fechado, como historico/);
        expect(d).toMatch(/fechar exige so a justificativa/);
        // a lista velha oferecia METODOLOGIA_NOVA como destino de qualquer achado
        expect(d).not.toContain("CONFORM_EXTERNA|METODOLOGIA_NOVA|");
    });

    it("audit_system_debt: avisa os abertos sem a mentira de hoje e reprova METODOLOGIA_NOVA aberto", () => {
        const d = bloco("audit_system_debt");
        expect(d).toMatch(/AVISA, sem reprovar, os abertos sem a \\"mentira de hoje\\"/);
        expect(d).toMatch(/tem o destino METODOLOGIA_NOVA \(decisão 5, 05\/11\/2026\)/);
    });
});
