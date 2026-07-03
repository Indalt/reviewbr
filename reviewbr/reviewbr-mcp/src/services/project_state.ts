import * as fs from "node:fs";
import * as path from "node:path";

/**
 * ProjectState — fonte da verdade do ESTADO de um projeto, em `project_state.json`
 * na raiz do projeto. Substitui a dispersão anterior (SQLite + 00_protocol/database.json).
 *
 * O SQLite (DatabaseService) permanece como cache/auditoria; os gates e o coordenador
 * leem/escrevem AQUI. Alinha com RV-04 (toda decisão registrada com agente+timestamp)
 * e com a portabilidade (estado on-disk, não preso a um banco).
 */

export type ProjectStatus = "DRAFT" | "LOCKED";
export type ControlLevel = "estrito" | "fluido";

export interface ProjectDecision {
    phase: string;
    agent: string;
    decision: string;
    ts: string;
}

export interface ProjectState {
    schemaVersion: 1;
    method: string;            // ex.: "prisma-sr", "scoping-prisma-scr"
    framework: string;         // PICOS / PCC / SPIDER / livre
    reviewType: string;        // rótulo humano do tipo de revisão
    topic: string;
    userId: string;            // workspace/usuário — preservado (gancho de retribuição/telemetria futura)
    status: ProjectStatus;     // DRAFT até o protocolo ser travado
    control_level: ControlLevel;
    phase: string;             // fase corrente (ex.: "F1", "F2"...)
    createdAt: string;
    updatedAt: string;
    decisions: ProjectDecision[];
}

function statePath(projectDir: string): string {
    return path.join(projectDir, "project_state.json");
}

export class ProjectStateService {
    static exists(projectDir: string): boolean {
        return fs.existsSync(statePath(projectDir));
    }

    static read(projectDir: string): ProjectState | null {
        const p = statePath(projectDir);
        if (!fs.existsSync(p)) return null;
        try {
            return JSON.parse(fs.readFileSync(p, "utf-8")) as ProjectState;
        } catch {
            return null;
        }
    }

    static write(projectDir: string, state: ProjectState): void {
        state.updatedAt = new Date().toISOString();
        fs.mkdirSync(projectDir, { recursive: true });
        fs.writeFileSync(statePath(projectDir), JSON.stringify(state, null, 2));
    }

    static init(projectDir: string, opts: {
        method: string;
        framework: string;
        reviewType: string;
        topic: string;
        userId?: string;
        control_level?: ControlLevel;
    }): ProjectState {
        const now = new Date().toISOString();
        const state: ProjectState = {
            schemaVersion: 1,
            method: opts.method,
            framework: opts.framework,
            reviewType: opts.reviewType,
            topic: opts.topic,
            userId: opts.userId ?? "default",
            status: "DRAFT",
            control_level: opts.control_level ?? "estrito",
            phase: "F1",
            createdAt: now,
            updatedAt: now,
            decisions: [],
        };
        this.write(projectDir, state);
        return state;
    }

    /** Atualiza campos parciais preservando o resto. Cria estado mínimo se ausente. */
    static patch(projectDir: string, patch: Partial<ProjectState>): ProjectState {
        const current = this.read(projectDir) ?? this.init(projectDir, {
            method: "prisma-sr", framework: "PICOS", reviewType: "Revisão Sistemática", topic: "",
        });
        const next = { ...current, ...patch };
        this.write(projectDir, next);
        return next;
    }

    static setStatus(projectDir: string, status: ProjectStatus): void {
        this.patch(projectDir, { status });
    }

    static setControlLevel(projectDir: string, level: ControlLevel): void {
        this.patch(projectDir, { control_level: level });
    }

    static setPhase(projectDir: string, phase: string): void {
        this.patch(projectDir, { phase });
    }

    static isLocked(projectDir: string): boolean {
        return this.read(projectDir)?.status === "LOCKED";
    }

    static logDecision(projectDir: string, d: Omit<ProjectDecision, "ts">): void {
        const state = this.read(projectDir);
        if (!state) return;
        state.decisions.push({ ...d, ts: new Date().toISOString() });
        this.write(projectDir, state);
    }
}
