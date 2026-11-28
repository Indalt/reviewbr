import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Registry } from "../src/registry/loader.js";
import { ProjectStateService, type ProjectState } from "../src/services/project_state.js";
import { avancarPorArtefato } from "../src/services/method_trail.js";
import { proporEmenda, decidirEmenda } from "../src/services/emendas.js";
import { congelarDecisoes, conferirEtapa } from "../src/services/travas_etapa.js";
import { congelarVersao, conferirVersao, versaoAtual, ARQUIVO_CONFERENCIA } from "../src/services/versao_sistema.js";

/**
 * Trava 3, pedido do Vicente de 28/11/2026 ("faça o recomendado"): a mudança do sistema que não alcança o
 * que falta da pesquisa não se exige do projeto — texto, nomes e etapas que já correram. Quando alcança,
 * a emenda de migração diz, na frase dele, no que a atualização implica; a demonstração de que nada já
 * feito muda vai a um registro de conferência em logs/, nunca ao change_log.md nem a outro suplemento do
 * relato. Controle positivo em projeto de teste, nunca na pasta de uma pesquisa real.
 */
const MCP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = path.resolve(MCP, "..", "..");
const registry = Registry.loadDefault();
const TODAS = { quem_decide_triagem: "revisores humanos, por planilha", revisores_por_registro: "dois ou mais", camada_por_palavras: "sim" };
const FRASE = /Durante a execução desta pesquisa o sistema passou por atualizações que implicam em .+ e por isso a emenda é necessária\./;

function repoDeTeste(): string {
    const r = fs.mkdtempSync(path.join(os.tmpdir(), "trava3b-repo-"));
    fs.cpSync(path.join(REPO, ".claude", "methodologies", "prisma-sr"), path.join(r, ".claude", "methodologies", "prisma-sr"), { recursive: true });
    fs.cpSync(path.join(REPO, ".claude", "skills"), path.join(r, ".claude", "skills"), { recursive: true });
    fs.cpSync(path.join(MCP, "data", "sources"), path.join(r, "reviewbr", "reviewbr-mcp", "data", "sources"), { recursive: true });
    fs.copyFileSync(path.join(MCP, "package.json"), path.join(r, "reviewbr", "reviewbr-mcp", "package.json"));
    return r;
}

function grava(dir: string, rel: string, dado: unknown): void {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), JSON.stringify(dado, null, 2));
}

function projeto(over: Partial<ProjectState> = {}): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trava3b-proj-"));
    fs.writeFileSync(path.join(dir, "protocol.md"), "# Protocolo de teste\n\n**Status**: [LOCKED]\n");
    const agora = new Date().toISOString();
    const st: ProjectState = {
        schemaVersion: 1, method: "prisma-sr", framework: "PICOS", reviewType: "teste", topic: "teste", userId: "teste",
        status: "LOCKED", control_level: "fluido", phase: "F2", createdAt: agora, updatedAt: agora, decisions: [], ...over,
    };
    fs.writeFileSync(path.join(dir, "project_state.json"), JSON.stringify(st, null, 2));
    grava(dir, "01_raw/database_records.json", [{ title: "A", doi: "10.1/a" }]);
    return dir;
}

/** Projeto travado na versão do repo de teste, com a busca e a deduplicação já fechadas (está na F4). */
function naTriagem(repo: string): string {
    const dir = projeto();
    congelarDecisoes(dir, "prisma-sr", TODAS, "F2");
    congelarVersao(repo, dir, "trava");
    expect(conferirEtapa(repo, dir, "deduplicate_dataset").ok).toBe(true);
    grava(dir, "02_deduplicated/dataset.json", [{ title: "A" }]);
    expect(avancarPorArtefato(repo, dir, "02_deduplicated/dataset.json").ok).toBe(true);
    const f4 = conferirEtapa(repo, dir, "verify_record_links"); // fecha a F3
    expect(f4.ok ? "" : f4.motivo).toBe("");
    return dir;
}

function mudaManifest(repo: string, f: (m: any) => void): void {
    const p = path.join(repo, ".claude", "methodologies", "prisma-sr", "manifest.json");
    const m = JSON.parse(fs.readFileSync(p, "utf-8"));
    f(m);
    fs.writeFileSync(p, JSON.stringify(m, null, 2));
}

const etapa = (m: any, id: string) => m.phases.find((e: any) => e.id === id);

describe("trava 3 — só o que alcança o que falta da pesquisa se exige do projeto", () => {
    it("mudança de texto e nome (nome da etapa, nota) não se exige: passa, com aviso e registro de conferência", () => {
        const repo = repoDeTeste();
        const dir = naTriagem(repo);
        mudaManifest(repo, (m) => { etapa(m, "F4").name = "Triagem"; etapa(m, "F4").note = "nota nova"; m.description = "outra descrição"; });
        const r = conferirVersao(repo, dir, "verify_record_links");
        expect(r.ok).toBe(true);
        expect(r.ok && r.aviso).toMatch(/nada que alcance o que falta da pesquisa/);
        const conf = fs.readFileSync(path.join(dir, ARQUIVO_CONFERENCIA), "utf-8");
        expect(conf).toMatch(/mudança só de texto ou de nome/);
        expect(conf).toMatch(/Não é suplemento do relato/);
        expect(fs.existsSync(path.join(dir, "change_log.md"))).toBe(false);
        expect(conferirVersao(repo, dir, "verify_record_links")).toEqual({ ok: true, aviso: "" }); // a versão gravada passou a ser a de hoje
    });

    it("mudança numa etapa que já correu não se exige", () => {
        const repo = repoDeTeste();
        const dir = naTriagem(repo);
        mudaManifest(repo, (m) => { etapa(m, "F2").step_tools.push("get_record_metadata"); });
        const r = conferirVersao(repo, dir, "verify_record_links");
        expect(r.ok).toBe(true);
        expect(fs.readFileSync(path.join(dir, ARQUIVO_CONFERENCIA), "utf-8")).toMatch(/a etapa F2 já correu, e a mudança não a alcança/);
    });

    it("só o sistema mudou numa etapa que ainda vai correr (as operações cuja ordem ele confere): recusa, mas não é emenda", () => {
        const repo = repoDeTeste();
        const dir = naTriagem(repo);
        mudaManifest(repo, (m) => { etapa(m, "F4").step_tools.push("get_record_metadata"); etapa(m, "F4").name = "Triagem"; });
        const r = conferirVersao(repo, dir, "verify_record_links");
        expect(r.ok).toBe(false);
        const m = r.ok ? "" : r.motivo;
        expect(m).toMatch(/Muda só o sistema \(não é emenda\):\n- na etapa F4 \(Triagem\), o sistema passa a conferir a ordem de get_record_metadata/);
        expect(m).not.toMatch(/Muda o método/);
        expect(m).toMatch(/Não é emenda: o método não muda/);
    });

    it("atualização só do sistema: a decisão do pesquisador fica na conferência; nada vai ao change_log.md nem vira emenda", () => {
        const repo = repoDeTeste();
        const dir = naTriagem(repo);
        mudaManifest(repo, (m) => { etapa(m, "F4").step_tools.push("get_record_metadata"); });
        const sem = proporEmenda(dir, { o_que: "", porque: "", migracao: true }, registry, repo);
        expect(sem.ok).toBe(false);
        expect(sem.mensagem).toMatch(/não é emenda/);
        const p = proporEmenda(dir, { o_que: "", porque: "", migracao: true, contribuicao: "entendi que só muda como o sistema confere a ordem; sigo na versão nova" }, registry, repo);
        expect(p.ok).toBe(true);
        const st = ProjectStateService.read(dir)!;
        expect(st.emendas ?? []).toEqual([]);
        expect(st.atualizacoes_sistema![0].contribuicao).toMatch(/sigo na versão nova/);
        expect(fs.existsSync(path.join(dir, "change_log.md"))).toBe(false);
        const conf = fs.readFileSync(path.join(dir, ARQUIVO_CONFERENCIA), "utf-8");
        expect(conf).toMatch(/O que mudou só no sistema/);
        expect(conf).toMatch(/F2: 01_raw\/, fechada em .* inalterado/);
        expect(conf).toMatch(/Decisão do pesquisador: "entendi que só muda/);
        expect(conferirVersao(repo, dir, "verify_record_links").ok).toBe(true);
    });

    it("mudou o método numa etapa que ainda vai correr: é emenda, com a frase em termos do método e sem falar do sistema", () => {
        const repo = repoDeTeste();
        const dir = naTriagem(repo);
        mudaManifest(repo, (m) => {
            m.decisoes.find((d: any) => d.id === "camada_por_palavras").opcoes.push({ valor: "só no texto completo", consequencia: "a camada por palavras corre só sobre o texto completo, depois da leitura por título e resumo" });
        });
        const r = conferirVersao(repo, dir, "verify_record_links");
        expect(r.ok ? "" : r.motivo).toMatch(/Muda o método \(é emenda\):\n- mudança na etapa F4 \(.*\): mudam as decisões que o método exige antes dela/);
        const falaDoSistema = proporEmenda(dir, { o_que: "", porque: "a verify_record_links passar a aceitar outra opção", migracao: true }, registry, repo);
        expect(falaDoSistema.ok).toBe(false);
        expect(falaDoSistema.mensagem).toMatch(/fala do sistema \(verify_record_links\)/);
        const p = proporEmenda(dir, { o_que: "", porque: "uma nova opção para a camada por palavras na triagem, aplicada só ao texto completo", migracao: true }, registry, repo);
        expect(p.ok).toBe(true);
        const e = ProjectStateService.read(dir)!.emendas![0];
        expect(e.porque).toBe("Durante a execução desta pesquisa o sistema passou por atualizações que implicam em uma nova opção para a camada por palavras na triagem, aplicada só ao texto completo e por isso a emenda é necessária.");
        const log = fs.readFileSync(path.join(dir, "change_log.md"), "utf-8");
        expect(log).toMatch(FRASE);
        expect(log).not.toMatch(/\btools?\b|record_protocol_amendment|inalterado|conferência|hash|sha256|[0-9a-f]{12}…|servidor|catálogo/i);
        const conf = fs.readFileSync(path.join(dir, ARQUIVO_CONFERENCIA), "utf-8");
        expect(conf).toMatch(/F3: 02_deduplicated\/dataset\.json, fechada em .* inalterado/);
        expect(conf).toMatch(/camada_por_palavras: "sim" \(trava\)/);
        expect(conf).toMatch(/A atualização vale só a partir daqui, nas etapas que ainda vão correr/);
        expect(conferirVersao(repo, dir, "verify_record_links").ok).toBe(false); // proposta não vale
        expect(decidirEmenda(dir, { id: "emenda-1", acao: "aprovar", contribuicao: "li no que a atualização implica e aceito a nova opção na triagem" }, registry, repo).ok).toBe(true);
        expect(conferirVersao(repo, dir, "verify_record_links").ok).toBe(true);
        expect(fs.readFileSync(path.join(dir, "change_log.md"), "utf-8")).not.toMatch(/\btools?\b|versão de hoje do sistema/i);
    });

    it("sem mudança que alcance a pesquisa, a emenda de migração é recusada", () => {
        const repo = repoDeTeste();
        const dir = naTriagem(repo);
        mudaManifest(repo, (m) => { etapa(m, "F4").note = "só texto"; });
        const p = proporEmenda(dir, { o_que: "", porque: "", migracao: true }, registry, repo);
        expect(p.ok).toBe(false);
        expect(p.mensagem).toMatch(/nada do que mudou no sistema alcança o que falta da pesquisa/);
    });
});

describe("trava 3 — versão gravada no formato antigo (o arquivo inteiro), convertida pelo git", () => {
    const sha = (b: Buffer) => createHash("sha256").update(b).digest("hex");
    const show = (rel: string) => execFileSync("git", ["-C", REPO, "show", `e25af55:${rel}`]);

    /** Projeto que gravou a versão no dia da trava 3 (commit e25af55), antes da linha 25. */
    function legado(phase: string): string {
        const dir = projeto({ phase });
        const hoje = versaoAtual(REPO, "prisma-sr");
        ProjectStateService.patch(dir, {
            versao_sistema: {
                componentes: {
                    "método prisma-sr: manifest.json": sha(show(".claude/methodologies/prisma-sr/manifest.json")),
                    "método prisma-sr: spec.md": sha(show(".claude/methodologies/prisma-sr/spec.md")),
                    "catálogo: repositories_catalog.json": hoje["catálogo: repositories_catalog.json"],
                    "catálogo: bases_internacionais.json": hoje["catálogo: bases_internacionais.json"],
                    "servidor: versão": hoje["servidor: versão"],
                },
                desde: "2026-11-28T10:00:00.000Z", origem: "primeira conferência (projeto travado antes de 28/11/2026)",
            },
        });
        return dir;
    }

    it("projeto que já passou da triagem: a linha 25 (nomes dos procedimentos, tools da F2 e da F4) não se exige", () => {
        const dir = legado("F5");
        const r = conferirVersao(REPO, dir, "rag_index_corpus");
        expect(r.ok).toBe(true);
        expect(ProjectStateService.read(dir)!.versao_sistema!.formato).toBe(2);
    });

    it("projeto ainda na triagem: só a F4 se exige, como atualização do sistema (não é emenda), e o nome do procedimento não aparece", () => {
        const dir = legado("F3");
        const r = conferirVersao(REPO, dir, "verify_record_links");
        expect(r.ok).toBe(false);
        const m = r.ok ? "" : r.motivo;
        expect(m).toMatch(/Muda só o sistema \(não é emenda\):\n- na etapa F4 .*o sistema passa a conferir a ordem de complete_record_keywords, download_and_extract_pdfs, retrieve_fulltext_byos, retrieve_fulltexts, verify_record_links/);
        expect(m).not.toMatch(/Muda o método|etapa F2|role|screening-rules/);
    });
});
