import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { ProjectStateService, type ProjectState } from "../src/services/project_state.js";
import { lerTrilha, avancarPorArtefato, errosDaTrilha } from "../src/services/method_trail.js";
import { congelarDecisoes, conferirEtapa, etapaDaTool } from "../src/services/travas_etapa.js";

/**
 * Linha 25 da FILA — Hipótese A (ponto 6.4, aprovado em 26/11/2026 com a condição "se isso nao implicar
 * nos desvios comuns de IA"). Antes de fundir os agentes de etapa no coordenador, a barreira que só a
 * lista `tools:` de cada agente dava vira trava em código: sete tools que só um agente tinha e que
 * nenhuma etapa da trilha prendia.
 * - F2 (só o librarian): expand_search_snowball e harvest_records — gravam em 01_raw/ como a busca.
 * - F4 (o librarian baixa, o screener não; o librarian completa e confere o insumo da triagem):
 *   complete_record_keywords, verify_record_links, retrieve_fulltexts, download_and_extract_pdfs e
 *   retrieve_fulltext_byos.
 * Com elas na trilha, a trava 2 da linha 24 as recusa fora da ordem: baixar texto completo antes da
 * deduplicação fechar, ou colher registros depois que a busca fechou. Controle positivo num projeto de
 * teste criado aqui, nunca a pasta de uma pesquisa real.
 */
const MCP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = path.resolve(MCP, "..", "..");
const INDEX = fs.readFileSync(path.join(MCP, "src", "index.ts"), "utf-8");

const DA_F2 = ["expand_search_snowball", "harvest_records"];
const DA_F4 = ["complete_record_keywords", "verify_record_links", "retrieve_fulltexts", "download_and_extract_pdfs", "retrieve_fulltext_byos"];
const TODAS = { quem_decide_triagem: "revisores humanos, por planilha", revisores_por_registro: "dois ou mais", camada_por_palavras: "sim" };

function grava(dir: string, rel: string, dado: unknown): void {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), JSON.stringify(dado, null, 2));
}

function travado(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fusao-barreiras-"));
    fs.writeFileSync(path.join(dir, "protocol.md"), "# Protocolo de teste\n\n**Status**: [LOCKED]\n");
    const agora = new Date().toISOString();
    const st: ProjectState = {
        schemaVersion: 1, method: "prisma-sr", framework: "PICOS", reviewType: "teste", topic: "teste", userId: "teste",
        status: "LOCKED", control_level: "fluido", phase: "F2", createdAt: agora, updatedAt: agora, decisions: [],
    };
    fs.writeFileSync(path.join(dir, "project_state.json"), JSON.stringify(st, null, 2));
    congelarDecisoes(dir, "prisma-sr", TODAS, "F2");
    grava(dir, "01_raw/database_records.json", [{ title: "A", doi: "10.1/a" }, { title: "B", doi: "10.1/b" }]);
    return dir;
}

function fechaF3(dir: string): void {
    expect(conferirEtapa(REPO, dir, "deduplicate_dataset").ok).toBe(true);
    grava(dir, "02_deduplicated/dataset.json", [{ title: "A" }, { title: "B" }]);
    expect(avancarPorArtefato(REPO, dir, "02_deduplicated/dataset.json").ok).toBe(true);
}

const motivo = (r: ReturnType<typeof conferirEtapa>) => (r.ok ? "" : r.motivo);

describe("linha 25 — a barreira que só a lista do agente dava passa a ser da trilha", () => {
    for (const m of ["prisma-sr", "scoping-prisma-scr"]) {
        it(`${m}: as sete tools pertencem a uma etapa`, () => {
            const etapas = lerTrilha(REPO, m).etapas;
            for (const t of DA_F2) expect(etapaDaTool(etapas, t)?.id, t).toBe("F2");
            for (const t of DA_F4) expect(etapaDaTool(etapas, t)?.id, t).toBe("F4");
        });
    }

    it("texto completo antes de a deduplicação fechar: recusado (o librarian não baixava para triar)", () => {
        const dir = travado();
        for (const t of DA_F4) expect(motivo(conferirEtapa(REPO, dir, t)), t).toMatch(/RECUSADO.*etapa F4[\s\S]*a etapa anterior, F3 .*não fechou/);
    });

    it("na triagem, o texto completo roda; depois que a extração começa, não", () => {
        const dir = travado();
        fechaF3(dir);
        for (const t of DA_F4) expect(conferirEtapa(REPO, dir, t).ok, t).toBe(true);
        grava(dir, "03_screening/included.json", [{ title: "A" }]);
        expect(conferirEtapa(REPO, dir, "batch_llm_extract").ok).toBe(true);
        for (const t of DA_F4) expect(motivo(conferirEtapa(REPO, dir, t)), t).toMatch(/a etapa F4 já fechou/);
    });

    it("snowball e colheita depois que a busca fechou: recusados, com o caminho da emenda", () => {
        const dir = travado();
        for (const t of DA_F2) expect(conferirEtapa(REPO, dir, t).ok, t).toBe(true);
        fechaF3(dir);
        for (const t of DA_F2) {
            const m = motivo(conferirEtapa(REPO, dir, t));
            expect(m, t).toMatch(/a etapa F\d já fechou/);
            expect(m, t).toMatch(/reabrir: "F2"/);
        }
        expect(ProjectStateService.read(dir)!.status).toBe("LOCKED");
    });

    it("no servidor, cada uma das sete chama a trava da etapa com o próprio nome", () => {
        for (const t of [...DA_F2, ...DA_F4]) {
            expect(INDEX, t).toMatch(new RegExp(`(checkDesignGuardrail\\([^)]*"${t}"|travaDaEtapa\\(params\\.projectPath, "${t}")`));
        }
    });

    it("retrieve_fulltexts com datasetPath do chamador: o insumo vai à trava como do chamador", () => {
        expect(INDEX).toMatch(/travaDaEtapa\(params\.projectPath, "retrieve_fulltexts", \{[^}]*insumoDoChamador: params\.datasetPath/);
    });
});

describe("linha 25 — a etapa é executada pelo coordenador, com a skill do procedimento dela", () => {
    it("o role de cada etapa dos dois métodos é uma skill que existe; os agentes de etapa saíram", () => {
        for (const m of ["prisma-sr", "scoping-prisma-scr"]) {
            const man = JSON.parse(fs.readFileSync(path.join(REPO, ".claude", "methodologies", m, "manifest.json"), "utf-8"));
            expect(errosDaTrilha(man.phases, path.join(REPO, ".claude", "skills")), m).toEqual([]);
            expect(lerTrilha(REPO, m).erros, m).toEqual([]);
        }
        const agentes = fs.readdirSync(path.join(REPO, ".claude", "agents")).filter((f) => f.endsWith(".md")).sort();
        expect(agentes).toEqual(["maintainer.md", "scout.md"]);
    });

    it("role que não é skill reprova a trilha (era o nome de um agente)", () => {
        const erros = errosDaTrilha([{ id: "A", name: "a", role: "librarian", closes_with: "x.md", producer_tools: [], active: true }],
            path.join(REPO, ".claude", "skills"));
        expect(erros.join(" ")).toMatch(/o procedimento "librarian" não existe em \.claude\/skills\//);
    });
});
