import * as fs from "node:fs";
import * as path from "node:path";
import { ProjectStateService, type ProjectState } from "../services/project_state.js";

/**
 * Guarda do protocolo travado, sobre o DISCO.
 *
 * DEBT-042 — aqui morava a classe ProtocolGuard (CRITICAL_FILES, safeWrite, safeDelete), que
 * nenhum código chamava: declarava o protocol.md "protegido" e o protocolo era reescrito direto
 * por fs.writeFileSync. E a guarda que o project_init anunciava ("projeto travado não pode ser
 * re-inicializado") olhava o status da linha do SQLite que o próprio plan_research_protocol
 * acabara de criar — replanejar no caminho de um projeto travado passava, reescrevia o
 * protocol.md e regravava o project_state.json como DRAFT, com as decisões zeradas.
 *
 * DEBT-133 — o submit_protocol_for_approval gravava [LOCKED] no protocol.md ANTES de atualizar
 * o estado; sem project_state.json, o patch lançava depois de o arquivo já estar travado.
 *
 * A trava vale só pelo project_state.json (decisão de 29/10/2026, DEBT-018). O marcador no
 * protocol.md é espelho para quem lê o arquivo, gravado depois do estado.
 */

/** Motivo pelo qual o protocolo deste diretório está travado (ou ilegível), ou `null`. */
export function protocoloTravadoNoDisco(projectDir: string): string | null {
    if (fs.existsSync(path.join(projectDir, "project_state.json"))) {
        const st = ProjectStateService.read(projectDir);
        if (!st) return "project_state.json existe e está ilegível";
        if (st.status === "LOCKED") return "project_state.json com status LOCKED";
    }
    // Projeto anterior ao estado estruturado: o marcador não libera busca (DEBT-018), mas o
    // arquivo é o protocolo do pesquisador e não se sobrescreve.
    const proto = path.join(projectDir, "protocol.md");
    if (fs.existsSync(proto) && /\[LOCKED\]/.test(fs.readFileSync(proto, "utf-8"))) {
        return "protocol.md com o marcador [LOCKED] (projeto anterior ao estado estruturado)";
    }
    return null;
}

/**
 * Trava o protocolo: primeiro o estado (a trava), depois o marcador no protocol.md (o espelho).
 * Sem project_state.json legível, recusa sem tocar em nada.
 */
export function travarProtocolo(projectDir: string, patch: Partial<ProjectState>): { ok: true } | { ok: false; motivo: string } {
    if (!ProjectStateService.read(projectDir)) {
        return {
            ok: false,
            motivo: `Sem project_state.json legível em ${projectDir}: a trava vale só pelo estado estruturado ` +
                "(decisão de 29/10/2026), e ele não é criado por omissão — método e framework são declarados pelo " +
                "pesquisador em plan_research_protocol. Nada foi alterado: o protocol.md segue como estava.",
        };
    }
    ProjectStateService.patch(projectDir, { ...patch, status: "LOCKED" });
    const protocolPath = path.join(projectDir, "protocol.md");
    let content = fs.readFileSync(protocolPath, "utf-8");
    content = /\[DRAFT\]/.test(content)
        ? content.replace(/\[DRAFT\]/g, "[LOCKED]")
        : /\[LOCKED\]/.test(content) ? content : content.replace(/^# /, "**Status**: [LOCKED]\n\n# ");
    fs.writeFileSync(protocolPath, content, "utf-8");
    return { ok: true };
}
