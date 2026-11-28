import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { Registry } from "../src/registry/loader.js";
import { ProjectStateService, type ProjectState } from "../src/services/project_state.js";
import { proporEmenda, decidirEmenda } from "../src/services/emendas.js";
import { congelarDecisoes, conferirEtapa } from "../src/services/travas_etapa.js";
import {
    versaoAtual, congelarVersao, conferirPosse, ARQUIVO_POSSE, POSSE_PARADA_MS, type Sessao,
} from "../src/services/versao_sistema.js";

/**
 * Linha 24 da FILA, trava 3 — sistema e sessão presos ao projeto (desenho aprovado pelo Vicente em
 * 28/11/2026). Versão: o que o projeto usa (método, catálogos, servidor), gravado na trava; mudou, as
 * tools de etapa recusam até a emenda de migração. Posse: uma sessão por vez grava no projeto. O
 * controle positivo é um repositório e um projeto de teste criados aqui.
 */
const MCP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = path.resolve(MCP, "..", "..");
const INDEX = fs.readFileSync(path.join(MCP, "src", "index.ts"), "utf-8");
const registry = Registry.loadDefault();
const TODAS = { quem_decide_triagem: "revisores humanos, por planilha", revisores_por_registro: "dois ou mais", camada_por_palavras: "sim" };

/** Cópia mínima do ReviewBR: o método, os catálogos e o package.json do servidor. */
function repoDeTeste(): string {
    const r = fs.mkdtempSync(path.join(os.tmpdir(), "trava3-repo-"));
    fs.cpSync(path.join(REPO, ".claude", "methodologies", "prisma-sr"), path.join(r, ".claude", "methodologies", "prisma-sr"), { recursive: true });
    fs.cpSync(path.join(REPO, ".claude", "skills"), path.join(r, ".claude", "skills"), { recursive: true });
    fs.cpSync(path.join(MCP, "data", "sources"), path.join(r, "reviewbr", "reviewbr-mcp", "data", "sources"), { recursive: true });
    fs.copyFileSync(path.join(MCP, "package.json"), path.join(r, "reviewbr", "reviewbr-mcp", "package.json"));
    return r;
}

function projeto(over: Partial<ProjectState> = {}): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trava3-proj-"));
    fs.writeFileSync(path.join(dir, "protocol.md"), "# Protocolo de teste\n\n**Status**: [LOCKED]\n");
    const agora = new Date().toISOString();
    const st: ProjectState = {
        schemaVersion: 1, method: "prisma-sr", framework: "PICOS", reviewType: "teste", topic: "teste", userId: "teste",
        status: "LOCKED", control_level: "fluido", phase: "F2", createdAt: agora, updatedAt: agora, decisions: [], ...over,
    };
    fs.writeFileSync(path.join(dir, "project_state.json"), JSON.stringify(st, null, 2));
    fs.mkdirSync(path.join(dir, "01_raw"));
    fs.writeFileSync(path.join(dir, "01_raw", "database_records.json"), JSON.stringify([{ title: "A", doi: "10.1/a" }]));
    return dir;
}

const recusa = (r: { ok: boolean; motivo?: string }) => (r.ok ? "" : r.motivo ?? "");

describe("trava 3 — a versão do sistema que o projeto usa", () => {
    it("é só o que o projeto usa: o método por etapa (seguindo extends), os dois catálogos e a versão do servidor", () => {
        // Desde 28/11/2026 (pedido do Vicente) a versão é por etapa: o que cada etapa faz e o texto normativo dela.
        const v = versaoAtual(REPO, "scoping-prisma-scr");
        const k = Object.keys(v);
        for (const m of ["scoping-prisma-scr", "prisma-sr"]) {
            expect(k).toContain(`método ${m}: ordem das etapas`);
            expect(k).toContain(`método ${m}: etapa F4`);
            expect(k).toContain(`método ${m}: regras gerais do manifest`);
            expect(k).toContain(`método ${m}: spec fora das etapas`);
        }
        expect(k).toContain("método prisma-sr: spec F4");
        expect(k.slice(-3)).toEqual(["catálogo: repositories_catalog.json", "catálogo: bases_internacionais.json", "servidor: versão"]);
        expect(k.some((x) => x.endsWith("manifest.json"))).toBe(false);
        for (const x of Object.values(v)) expect(x).not.toBe("ausente");
    });

    it("mudou o método depois da trava: a tool de etapa recusa, diz o que mudou, a regra e o caminho da emenda de migração", () => {
        const repo = repoDeTeste();
        const dir = projeto();
        congelarDecisoes(dir, "prisma-sr", TODAS, "F2");
        congelarVersao(repo, dir, "trava");
        expect(conferirEtapa(repo, dir, "deduplicate_dataset").ok).toBe(true);
        fs.appendFileSync(path.join(repo, ".claude", "methodologies", "prisma-sr", "spec.md"), "\nregra nova\n");
        const m = recusa(conferirEtapa(repo, dir, "deduplicate_dataset"));
        expect(m).toContain("🚫 RECUSADO: `deduplicate_dataset`");
        expect(m).toContain("texto normativo geral do método prisma-sr");
        expect(m).toContain("Regra do projeto: trava 3");
        expect(m).toContain("migracao: true");
    });

    it("a emenda de migração lista o que mudou e, aprovada pelo pesquisador, a versão de hoje passa a ser a do projeto", () => {
        const repo = repoDeTeste();
        const dir = projeto();
        congelarDecisoes(dir, "prisma-sr", TODAS, "F2");
        congelarVersao(repo, dir, "trava");
        const pkg = path.join(repo, "reviewbr", "reviewbr-mcp", "package.json");
        fs.writeFileSync(pkg, JSON.stringify({ ...JSON.parse(fs.readFileSync(pkg, "utf-8")), version: "9.9.9" }));
        expect(conferirEtapa(repo, dir, "deduplicate_dataset").ok).toBe(false);
        // Só o servidor mudou: não é emenda (28/11/2026); a decisão do pesquisador fica na conferência.
        const p = proporEmenda(dir, { o_que: "", porque: "", migracao: true, contribuicao: "li o que mudou no servidor e sigo na versão nova, nada muda no método" }, registry, repo);
        expect(p.ok).toBe(true);
        expect(ProjectStateService.read(dir)!.atualizacoes_sistema![0].mudancas[0]).toContain("o servidor do ReviewBR passou da versão");
        expect(fs.existsSync(path.join(dir, "change_log.md"))).toBe(false);
        expect(ProjectStateService.read(dir)!.versao_sistema!.origem).toMatch(/atualização só do sistema registrada/);
        expect(conferirEtapa(repo, dir, "deduplicate_dataset").ok).toBe(true);
    });

    it("emenda de migração sem mudança é recusada", () => {
        const repo = repoDeTeste();
        const dir = projeto();
        congelarVersao(repo, dir, "trava");
        const p = proporEmenda(dir, { o_que: "migrar", porque: "teste", migracao: true }, registry, repo);
        expect(p.ok).toBe(false);
        expect(p.mensagem).toContain("Não há migração a fazer");
    });

    it("projeto travado antes desta trava: a versão de hoje é gravada na primeira conferência, com aviso", () => {
        const repo = repoDeTeste();
        const dir = projeto();
        congelarDecisoes(dir, "prisma-sr", TODAS, "F2");
        const r = conferirEtapa(repo, dir, "deduplicate_dataset");
        expect(r.ok).toBe(true);
        expect(r.ok && r.aviso).toContain("Trava 3");
        expect(ProjectStateService.read(dir)!.versao_sistema!.origem).toContain("primeira conferência");
    });

    it("projeto em rascunho não tem versão a conferir", () => {
        const repo = repoDeTeste();
        const dir = projeto({ status: "DRAFT" });
        expect(conferirEtapa(repo, dir, "deduplicate_dataset").ok).toBe(true);
        expect(ProjectStateService.read(dir)!.versao_sistema).toBeUndefined();
    });
});

describe("trava 3 — a posse do projeto pela sessão", () => {
    const A: Sessao = { id: "maq:100", pid: 100, maquina: "maq" };
    const B: Sessao = { id: "maq:200", pid: 200, maquina: "maq" };
    const vivo = () => true;
    const t0 = Date.parse("2026-11-28T10:00:00Z");

    it("a primeira tool abre a posse; a mesma sessão renova; outra sessão viva é recusada com a regra", () => {
        const dir = projeto();
        expect(conferirPosse(dir, "deduplicate_dataset", A, t0, vivo).ok).toBe(true);
        expect(JSON.parse(fs.readFileSync(path.join(dir, ARQUIVO_POSSE), "utf-8")).id).toBe("maq:100");
        expect(conferirPosse(dir, "deduplicate_dataset", A, t0 + 60_000, vivo).ok).toBe(true);
        const m = recusa(conferirPosse(dir, "batch_llm_extract", B, t0 + 120_000, vivo));
        expect(m).toContain("🚫 RECUSADO: `batch_llm_extract`");
        expect(m).toContain("maq:100");
        expect(m).toContain("Regra do projeto: trava 3");
    });

    it("posse parada há mais de 2 h é retomada, com registro no project_state.json", () => {
        const dir = projeto();
        conferirPosse(dir, "x", A, t0, vivo);
        expect(conferirPosse(dir, "x", B, t0 + POSSE_PARADA_MS - 1000, vivo).ok).toBe(false);
        const r = conferirPosse(dir, "x", B, t0 + POSSE_PARADA_MS + 1000, vivo);
        expect(r.ok && r.aviso).toContain("retomada");
        const st = ProjectStateService.read(dir)!;
        expect(st.posses_retomadas![0].de.id).toBe("maq:100");
        expect(st.posses_retomadas![0].para.id).toBe("maq:200");
        expect(conferirPosse(dir, "x", A, t0 + POSSE_PARADA_MS + 2000, vivo).ok).toBe(false);
    });

    it("posse de sessão cujo processo já não existe nesta máquina é retomada; em outra máquina, só depois de 2 h", () => {
        const dir = projeto();
        conferirPosse(dir, "x", A, t0, vivo);
        expect(conferirPosse(dir, "x", B, t0 + 1000, (pid) => pid !== 100).ok).toBe(true);
        const dir2 = projeto();
        conferirPosse(dir2, "x", { id: "outra:100", pid: 100, maquina: "outra" }, t0, vivo);
        expect(conferirPosse(dir2, "x", B, t0 + 1000, () => false).ok).toBe(false);
    });

    it("sem project_state.json não há posse a abrir", () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trava3-vazio-"));
        expect(conferirPosse(dir, "x", A, t0, vivo).ok).toBe(true);
        expect(fs.existsSync(path.join(dir, ARQUIVO_POSSE))).toBe(false);
    });
});

describe("trava 3 — ligada no servidor", () => {
    it("a trava grava a versão; a emenda aceita migracao; as tools de etapa e as de decisão conferem a posse", () => {
        expect(INDEX).toContain('congelarVersao(RAIZ(), projectDir, "trava")');
        expect(INDEX).toContain("migracao: z.boolean()");
        expect(INDEX).toContain("migracao: params.migracao");
        expect(INDEX).toMatch(/function travaDaEtapa[\s\S]{0,200}posseDoProjeto\(/);
        for (const t of ["record_researcher_decision", "record_protocol_amendment", "submit_protocol_for_approval"]) {
            expect(INDEX).toContain(`posseDoProjeto(params.projectPath, "${t}"`);
        }
    });
});
