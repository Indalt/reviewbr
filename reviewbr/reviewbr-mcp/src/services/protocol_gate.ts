import * as fs from "node:fs";
import * as path from "node:path";
import { ProjectStateService } from "./project_state.js";

/**
 * ProtocolGate — a trava do RV-01: nada de aquisição antes do protocolo travado.
 *
 * POR QUE EXISTE COMO SERVIÇO
 * ---------------------------
 * A lógica vivia dentro de uma função no `index.ts`, sem como ser testada. A auditoria
 * registrou que gate dentro de handler não é verificável — e foi justamente ali que três
 * defeitos se esconderam por tanto tempo.
 *
 * A MUDANÇA DE SEMÂNTICA: NEGAR POR PADRÃO
 * ----------------------------------------
 * A versão anterior liberava por omissão. Com `projectPath` informado e nenhum artefato
 * encontrado (sem `project_state.json`, sem `protocol.md`), a execução caía até o
 * `return null` final e **passava**. Um projeto vazio — ou com o nome digitado errado —
 * era indistinguível de um projeto aprovado.
 *
 * A análise de conflito apurou que os dois achados envolvidos eram **exclusão mútua**: não
 * são duas correções, é uma decisão de desenho única. A decisão é fail-closed.
 *
 * O QUE CONTINUA PASSANDO, E POR QUÊ
 * ----------------------------------
 * Chamada **sem** `projectPath` continua liberada. Não é brecha: é a fronteira entre
 * exploração e busca oficial. Sem projeto não há onde persistir, então nada do que se faz
 * ali entra no funil PRISMA. O que muda é que isso agora é regra declarada, e não efeito
 * colateral de um caminho não previsto.
 *
 * ⚠️ DÍVIDA CONHECIDA: `projectPath` é opcional nas tools guardadas, então omiti-lo segue
 * desligando a trava. Fechar isso exige decidir, tool a tool, o que é busca oficial e o que
 * é preview — e isso muda a assinatura pública. Fica declarado aqui em vez de silencioso.
 */

export type GateStatus =
    | "LIBERADO"
    | "SEM_PROJETO"        // chamada exploratória: passa, mas nada persiste
    | "NAO_TRAVADO"        // protocolo existe e está em rascunho
    | "SEM_PROTOCOLO"      // projeto declarado e nenhum artefato de protocolo
    | "ESTADO_CORROMPIDO"; // artefato existe e está ilegível — não é o mesmo que ausente

export interface GateResult {
    blocked: boolean;
    status: GateStatus;
    message: string | null;
    /**
     * Aviso que NÃO bloqueia, mas precisa aparecer na resposta ao pesquisador.
     *
     * POR QUE EXISTE
     * --------------
     * Passar em silêncio era o defeito. Chamada sem `projectPath` cai em `SEM_PROJETO` e
     * segue — correto, é a fronteira entre exploração e busca oficial (RV-04: a escolha é
     * do pesquisador). O problema é que o sistema não DIZIA em que modo operou: quem
     * esquecesse o `projectPath` em projeto aberto recebia resultados normais, e a busca
     * ficava fora do funil sem nenhum sinal. O PRISMA-S exige declarar o que foi
     * recuperado por base; o que não entrou, ninguém sabe que faltou.
     *
     * Tornar `projectPath` obrigatório mataria a busca exploratória e decidiria pelo
     * pesquisador. Declarar o modo preserva a escolha e elimina o silêncio: omissão
     * declarada é método, omissão silenciosa é falha.
     */
    advisory: string | null;
}

export class ProtocolGate {
    /**
     * Avalia a trava a partir do estado ON-DISK (RV-01: a fonte da verdade é o disco).
     *
     * Ordem deliberada: `project_state.json` primeiro, `protocol.md` como fallback. O
     * marcador `[LOCKED]` no Markdown é herança de projetos anteriores ao estado estruturado.
     */
    static check(projectPath?: string, cwd: string = process.cwd()): GateResult {
        if (!projectPath) {
            return {
                blocked: false, status: "SEM_PROJETO", message: null,
                // O aviso NÃO cita PRISMA. A versão anterior dizia "não entra no funil PRISMA"
                // e "não será contado no log PRISMA-S" — herança de quando o sistema só
                // conhecia um método. Busca exploratória não é PRISMA coisa nenhuma, e o
                // projeto a que ela poderia pertencer pode seguir outro método. O que o
                // aviso precisa dizer é o que de fato acontece: nada foi persistido.
                advisory: [
                    "⚠️ BUSCA EXPLORATÓRIA — nenhum `projectPath` foi informado.",
                    "Nada foi persistido: este resultado não entra no corpus de projeto nenhum",
                    "e não será contado em nenhum registro de busca.",
                    "Se esta busca é parte de um projeto, refaça informando `projectPath`.",
                ].join(" ")
            };
        }

        const projectDir = path.isAbsolute(projectPath) ? projectPath : path.join(cwd, projectPath);
        const statePath = path.join(projectDir, "project_state.json");
        const protoPath = path.join(projectDir, "protocol.md");

        // Corrompido ≠ ausente. `ProjectStateService.read` devolve null nos dois casos, e era
        // por aí que um estado ilegível virava "projeto sem estado" e seguia adiante.
        if (fs.existsSync(statePath)) {
            const st = ProjectStateService.read(projectDir);
            if (!st) {
                return {
                    blocked: true, status: "ESTADO_CORROMPIDO", advisory: null,
                    message: `🚫 ACESSO NEGADO: 'project_state.json' existe em ${projectDir} mas está ilegível. ` +
                        `Arquivo corrompido não é o mesmo que projeto novo — corrija o estado antes de buscar.`
                };
            }
            if (st.status !== "LOCKED") {
                return {
                    blocked: true, status: "NAO_TRAVADO", advisory: null,
                    message: `🚫 ACESSO NEGADO: o protocolo está em ${st.status}. Preencha o protocol.md e ` +
                        `aprove via 'submit_protocol_for_approval' antes de iniciar buscas ou aquisição.`
                };
            }
            return { blocked: false, status: "LIBERADO", message: null, advisory: null };
        }

        if (fs.existsSync(protoPath)) {
            const conteudo = fs.readFileSync(protoPath, "utf-8");
            if (!/\[LOCKED\]/.test(conteudo)) {
                return {
                    blocked: true, status: "NAO_TRAVADO", advisory: null,
                    message: `🚫 ACESSO NEGADO: o protocol.md ainda não está [LOCKED]. ` +
                        `Aprove via 'submit_protocol_for_approval'.`
                };
            }
            return { blocked: false, status: "LIBERADO", message: null, advisory: null };
        }

        // FAIL-CLOSED. Antes, este caminho caía no `return null` e liberava.
        return {
            blocked: true, status: "SEM_PROTOCOLO", advisory: null,
            message: `🚫 ACESSO NEGADO: o projeto "${projectPath}" foi declarado mas não tem protocolo — ` +
                `não há 'project_state.json' nem 'protocol.md' em ${projectDir}. ` +
                `Projeto sem protocolo não é projeto aprovado: crie com 'plan_research_protocol' e ` +
                `trave com 'submit_protocol_for_approval'. ` +
                `Se a intenção era uma busca exploratória, chame sem 'projectPath' — mas nada será persistido.`
        };
    }
}
