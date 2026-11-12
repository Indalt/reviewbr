import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { protocoloTravadoNoDisco, travarProtocolo } from "../src/utils/protocol_guard.js";
import { ProjectInitService } from "../src/services/project_init.js";
import { ProjectStateService } from "../src/services/project_state.js";

// DEBT-133 — o submit_protocol_for_approval gravava [LOCKED] no protocol.md antes do estado: sem
// project_state.json, o arquivo ficava travado e o estado não.
// DEBT-042 — replanejar no caminho de um projeto travado passava pela guarda (que olhava a linha
// do SQLite recém-criada), reescrevia o protocol.md e zerava o project_state.json; o ProtocolGuard,
// que declarava esses arquivos protegidos, não era chamado por ninguém.
const dirs: string[] = [];
afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });
const MCP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INDEX = fs.readFileSync(path.join(MCP, "src", "index.ts"), "utf-8").replace(/\r\n/g, "\n");

function projeto(opts: { status?: string; protocolo?: string } = {}): string {
    const p = fs.mkdtempSync(path.join(os.tmpdir(), "trava-"));
    dirs.push(p);
    if (opts.protocolo !== undefined) fs.writeFileSync(path.join(p, "protocol.md"), opts.protocolo);
    if (opts.status) {
        fs.writeFileSync(path.join(p, "project_state.json"), JSON.stringify({
            schemaVersion: 1, method: "prisma-sr", framework: "PICOS", reviewType: "Sistemática", topic: "t", userId: "u",
            status: opts.status, control_level: "estrito", phase: "F1", createdAt: "x", updatedAt: "x",
            decisions: [{ phase: "F1", agent: "designer", decision: "d", ts: "x", por: "pesquisador", contribuicao: "decidi" }],
        }));
    }
    return p;
}

describe("DEBT-133 — travar começa pelo estado; sem estado, nada muda", () => {
    it("sem project_state.json: recusa e o protocol.md fica como estava", () => {
        const p = projeto({ protocolo: "# Protocolo\n**Status**: [DRAFT]\n" });
        const r = travarProtocolo(p, { phase: "F2" });
        expect(r.ok).toBe(false);
        expect(fs.readFileSync(path.join(p, "protocol.md"), "utf-8")).toContain("[DRAFT]");
        expect(fs.existsSync(path.join(p, "project_state.json"))).toBe(false);
    });

    it("com estado: o estado fica LOCKED e o protocol.md recebe o marcador", () => {
        const p = projeto({ status: "DRAFT", protocolo: "# Protocolo\n**Status**: [DRAFT]\n" });
        expect(travarProtocolo(p, { phase: "F2" }).ok).toBe(true);
        expect(ProjectStateService.read(p)).toMatchObject({ status: "LOCKED", phase: "F2" });
        expect(fs.readFileSync(path.join(p, "protocol.md"), "utf-8")).toContain("[LOCKED]");
    });

    it("o handler não escreve mais o protocol.md por conta própria", () => {
        const i = INDEX.indexOf('\n    "submit_protocol_for_approval",');
        const corpo = INDEX.slice(i, INDEX.indexOf("\nserver.tool(", i + 1));
        expect(corpo).toContain("travarProtocolo(projectDir");
        expect(corpo).not.toContain("fs.writeFileSync(protocolPath");
    });
});

describe("DEBT-042 — projeto travado no disco não se re-inicializa", () => {
    it("protocoloTravadoNoDisco: estado LOCKED, estado ilegível e marcador legado travam; DRAFT não", () => {
        expect(protocoloTravadoNoDisco(projeto({ status: "LOCKED" }))).toMatch(/LOCKED/);
        const corrompido = projeto();
        fs.writeFileSync(path.join(corrompido, "project_state.json"), "{ não é json");
        expect(protocoloTravadoNoDisco(corrompido)).toMatch(/ilegível/);
        expect(protocoloTravadoNoDisco(projeto({ protocolo: "**Status**: [LOCKED]" }))).toMatch(/marcador/);
        expect(protocoloTravadoNoDisco(projeto({ status: "DRAFT", protocolo: "[DRAFT]" }))).toBeNull();
    });

    it("plan_research_protocol no caminho de um projeto travado: recusa sem reescrever protocolo nem estado", async () => {
        const p = projeto({ status: "LOCKED", protocolo: "# Meu protocolo travado\n**Status**: [LOCKED]\n" });
        const antesEstado = fs.readFileSync(path.join(p, "project_state.json"), "utf-8");
        // A linha do SQLite é a recém-criada pelo register: DRAFT_DESIGN, como no caminho real.
        const db: any = {
            getProjectById: async () => ({ project_name: "novo", user_id: "u", project_type: "systematic_review", topic: "t", status: "DRAFT_DESIGN" }),
            activateProject: async () => { throw new Error("não devia chegar aqui"); },
        };
        await expect(new ProjectInitService().initializeWorkspace(1, p, db, "prisma-sr")).rejects.toThrow(/travado/);
        expect(fs.readFileSync(path.join(p, "protocol.md"), "utf-8")).toContain("Meu protocolo travado");
        expect(fs.readFileSync(path.join(p, "project_state.json"), "utf-8")).toBe(antesEstado);
    });
});
