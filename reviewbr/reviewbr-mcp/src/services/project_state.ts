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
    /**
     * Quem decidiu. `pesquisador` é o único valor que destrava fase sob `control_level`
     * estrito — e a distinção é o RV-04 virando dado em vez de convenção.
     */
    por?: "pesquisador" | "sistema";
    /**
     * A CONTRIBUIÇÃO ESPECÍFICA do pesquisador — o que ele decidiu, com as palavras dele.
     * Um "ok" genérico não é decisão: não diz o que foi avaliado nem o que foi escolhido,
     * e não sustenta a afirmação de que houve supervisão humana (RAISE 1, rec. 4.1).
     */
    contribuicao?: string;
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
    phase: string;             // etapa corrente — um `id` da trilha do método (manifest `phases`)
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
        /**
         * Etapa em que o projeto nasce. Vem da trilha do MÉTODO (`etapaInicial`), não daqui:
         * o literal "F1" que morava nesta função era a forma da trilha do PRISMA escrita no
         * código (DEBT-100).
         */
        phase: string;
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
            phase: opts.phase,
            createdAt: now,
            updatedAt: now,
            decisions: [],
        };
        this.write(projectDir, state);
        return state;
    }

    /** Atualiza campos parciais preservando o resto. Cria estado mínimo se ausente. */
    static patch(projectDir: string, patch: Partial<ProjectState>): ProjectState {
        // NÃO INVENTAR MÉTODO (RV-03). A versão anterior criava o estado com
        // `method: "prisma-sr", framework: "PICOS"` quando o arquivo não existia. Hoje isso
        // é inofensivo porque ninguém lê `state.method` — mas o dia em que o runtime ler o
        // manifest a partir dele (DEBT-121), uma revisão de escopo cujo `project_state.json`
        // se perdesse viraria sistemática em silêncio, e o `ProtocolGate` não veria nada:
        // ele só olha `status`. Fabricar a metodologia de uma revisão é a falha mais cara
        // que este arquivo poderia cometer. Sem estado, falha — e diz o que fazer.
        const current = this.read(projectDir);
        if (!current) {
            throw new Error(
                `project_state.json ausente ou ilegível em "${projectDir}". O estado não é criado ` +
                "aqui por omissão: method, framework e tipo de revisão são declarados pelo " +
                "pesquisador em plan_research_protocol. Inventá-los fabricaria a metodologia da " +
                "revisão (RV-03)."
            );
        }
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

    /**
     * RV-04 COMO TRAVA, não como convenção.
     *
     * "A decisão é do pesquisador" existia em seis comentários no código e em nenhuma
     * verificação (DEBT-037). Com `control_level: estrito`, avançar de fase passa a exigir
     * uma decisão REGISTRADA do pesquisador sobre a fase que se encerra.
     *
     * O que conta como decisão, e por quê:
     *  - `por: "pesquisador"` — decisão do sistema não destrava a si mesma;
     *  - `contribuicao` com conteúdo — um "ok" genérico não diz o que foi avaliado nem o
     *    que foi escolhido. O RAISE 1 (rec. 4.1) responsabiliza o autor humano pelos
     *    métodos e achados; sem a contribuição específica, não há o que sustentar essa
     *    responsabilidade — e é ela que separa supervisão de carimbo.
     *
     * `fluido` não é exceção à regra: é escolha declarada do pesquisador, gravada no
     * estado, para trabalho exploratório. O que ele não pode é ser silenciosa — por isso
     * o motivo volta no resultado, para quem chama declarar em que modo operou.
     */
    static podeAvancar(projectDir: string, faseQueEncerra: string): { ok: boolean; motivo: string } {
        const state = this.read(projectDir);
        if (!state) {
            return { ok: false, motivo: "Sem project_state.json: não há onde registrar decisão nem o que verificar." };
        }
        if (state.control_level === "fluido") {
            return { ok: true, motivo: `control_level 'fluido' declarado: avanço automático em ${faseQueEncerra}, sem decisão registrada.` };
        }
        const d = state.decisions.find(
            (x) => x.phase === faseQueEncerra && x.por === "pesquisador" && (x.contribuicao ?? "").trim().length > 0,
        );
        if (!d) {
            return {
                ok: false,
                motivo:
                    `🚫 RV-04 — a fase ${faseQueEncerra} não tem decisão registrada do pesquisador. ` +
                    "Sob 'estrito', a fase seguinte só abre com a contribuição específica dele: o que foi " +
                    "avaliado e o que foi decidido, nas palavras dele. Um 'ok' genérico não destrava — " +
                    "sem isso o sistema não tem como afirmar que houve supervisão humana.",
            };
        }
        return { ok: true, motivo: `Decisão do pesquisador em ${faseQueEncerra} registrada em ${d.ts}.` };
    }
}
