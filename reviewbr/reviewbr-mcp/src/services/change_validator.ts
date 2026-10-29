import { z } from "zod";

/**
 * Validador de alterações do próprio ReviewBR (Regra RV-11).
 *
 * Simétrico ao RV-09 ("toda ocorrência exige controle positivo"): toda alteração do
 * sistema declara seu TIPO e satisfaz o requisito daquele tipo. O que motiva a regra não
 * é um caso de falha, e sim uma lacuna estrutural: os 7 agentes são todos de EXECUÇÃO de
 * revisão; nenhum tem escopo de construir, auditar ou manter o próprio ReviewBR. O sistema
 * trava a revisão de literatura e não trava o trabalho sobre si mesmo.
 *
 * Misturar os três tipos é o que vira reescrita sem fim:
 *  - CORRECAO     → o sistema não faz o que promete    → exige falha documentada e reproduzível
 *  - CONFORMIDADE → o padrão externo mudou              → exige citação do padrão novo e do item afetado
 *  - EXTENSAO     → método novo                          → exige protocolo próprio travado
 *
 * Como o PrismaFlowValidator (RV-05), este é um gate DETERMINÍSTICO: o agente produz o
 * insumo, a verificação aprova ou reprova, o orquestrador só avança com verde. Nada aqui
 * consulta modelo nem decide por julgamento — RV-06.
 */

export enum ChangeType {
    CORRECAO = "CORRECAO",
    CONFORMIDADE = "CONFORMIDADE",
    EXTENSAO = "EXTENSAO"
}

/**
 * Proposta de alteração submetida ao gate.
 *
 * `change_type` é deliberadamente um enum FECHADO e sem default: uma submissão que omite o
 * tipo, ou inventa um, é reprovada na desserialização. É o núcleo da regra — não existe
 * alteração sem tipo declarado, inclusive a alteração que introduziu este arquivo.
 */
export const ChangeProposalSchema = z.object({
    /** O que muda, em uma linha. */
    summary: z.string().min(1),

    /** Tipo declarado. Sem default e sem fallback: omitir é reprovar. */
    change_type: z.nativeEnum(ChangeType),

    /** Arquivos/artefatos tocados. Vazio é permitido só para proposta puramente documental. */
    targets: z.array(z.string()).default([]),

    /**
     * Achados do backlog que esta alteração corrige (ex.: ["DEBT-021"]).
     *
     * POR QUE EXISTE: a ordem de correção foi apurada (13 dependências e 1 exclusão mútua
     * entre pares que tocam a mesma linha) e vive no campo `depende_de` de cada achado —
     * mas o gate não a consultava. Corrigir na ordem errada gera retrabalho já mapeado:
     * acrescentar gates ao manifest antes de existir quem os leia, por exemplo, não muda
     * comportamento algum.
     *
     * Sem este campo o gate não tinha como saber QUE achado a proposta ataca, e portanto
     * não tinha como conferir o pré-requisito. Opcional: proposta que não fecha achado
     * nenhum (documental, exploratória) segue válida.
     */
    addresses: z.array(z.string()).default([]),

    // ─── Requisito de CORRECAO ────────────────────────────────────────────
    /** Falha documentada: o que o sistema promete e o que de fato faz. */
    documented_failure: z.string().optional(),
    /** Passos que reproduzem a falha. Documentar sem reproduzir não basta. */
    reproduction: z.string().optional(),

    // ─── Requisito de CONFORMIDADE ────────────────────────────────────────
    /** Padrão externo novo/alterado, com versão (ex.: "PRISMA 2020"). */
    standard: z.string().optional(),
    standard_version: z.string().optional(),
    /** Item específico do padrão afetado (ex.: "item 16a"). Padrão sem item é vago demais. */
    standard_item: z.string().optional(),

    // ─── Requisito de EXTENSAO ────────────────────────────────────────────
    /** Caminho do protocolo próprio que governa a extensão. */
    protocol_path: z.string().optional(),
    /** O protocolo está travado? Extensão sob protocolo em rascunho é deriva. */
    protocol_locked: z.boolean().optional()
});

export type ChangeProposal = z.infer<typeof ChangeProposalSchema>;

/**
 * O backlog, como `SystemDebtService.probe()` o devolve — tipado estruturalmente para não
 * importar o serviço (ver a nota sobre ciclo em `checkOrder`). Só o que a conferência de
 * ordem precisa: id, estado, dependências e o resumo para a mensagem de erro.
 */
export interface BacklogSonda {
    status: "AUSENTE" | "OK" | "ILEGIVEL";
    detail?: string;
    debt?: { findings: Array<{ id: string; status: string; summary: string; depende_de?: string[] }> };
}

export interface ChangeValidation {
    valid: boolean;
    change_type: ChangeType | null;
    errors: string[];
    /** O requisito que o tipo declarado impõe — devolvido também quando aprova, para o log. */
    requirement: string;
}

const REQUIREMENT: Record<ChangeType, string> = {
    [ChangeType.CORRECAO]: "falha documentada e reproduzível",
    [ChangeType.CONFORMIDADE]: "citação do padrão novo (com versão) e do item afetado",
    [ChangeType.EXTENSAO]: "protocolo próprio, travado"
};

export class ChangeValidator {
    /**
     * Valida uma proposta já desserializada contra o requisito do seu tipo (RV-11).
     *
     * Para submissão crua (JSON de fora), use `validateRaw` — é lá que a ausência de
     * `change_type` é pega, e é esse o caso que o gate precisa reprovar.
     */
    public validate(proposal: ChangeProposal): ChangeValidation {
        const errors: string[] = [];
        const type = proposal.change_type;

        switch (type) {
            case ChangeType.CORRECAO: {
                if (!proposal.documented_failure?.trim()) {
                    errors.push(
                        "CORRECAO exige 'documented_failure': o que o sistema promete e o que de fato faz. " +
                        "Sem falha documentada, a alteração é reescrita sem motivo (RV-11)."
                    );
                }
                if (!proposal.reproduction?.trim()) {
                    errors.push(
                        "CORRECAO exige 'reproduction': os passos que reproduzem a falha. " +
                        "Falha não reproduzível não distingue defeito real de impressão (RV-11)."
                    );
                }
                break;
            }

            case ChangeType.CONFORMIDADE: {
                if (!proposal.standard?.trim()) {
                    errors.push("CONFORMIDADE exige 'standard': que padrão externo mudou (RV-11).");
                }
                if (!proposal.standard_version?.trim()) {
                    errors.push(
                        "CONFORMIDADE exige 'standard_version': sem versão não há como saber o que revisar " +
                        "quando o padrão mudar de novo (RV-11)."
                    );
                }
                if (!proposal.standard_item?.trim()) {
                    errors.push(
                        "CONFORMIDADE exige 'standard_item': o item específico afetado. " +
                        "Citar o padrão inteiro não delimita a alteração (RV-11)."
                    );
                }
                break;
            }

            case ChangeType.EXTENSAO: {
                if (!proposal.protocol_path?.trim()) {
                    errors.push(
                        "EXTENSAO exige 'protocol_path': método novo entra com protocolo próprio, " +
                        "como qualquer revisão (RV-11)."
                    );
                }
                if (proposal.protocol_locked !== true) {
                    errors.push(
                        "EXTENSAO exige protocolo TRAVADO ('protocol_locked': true). " +
                        "Extensão sob protocolo em rascunho é exatamente a deriva que a regra impede (RV-11)."
                    );
                }
                break;
            }
        }

        return {
            valid: errors.length === 0,
            change_type: type,
            errors,
            requirement: REQUIREMENT[type]
        };
    }

    /**
     * Confere a ORDEM: o achado que a proposta ataca tem pré-requisito ainda aberto?
     *
     * A ordem de correção foi apurada por análise de conflito — 13 dependências e 1
     * exclusão mútua entre os pares que tocam a mesma linha — e vive no campo
     * `depende_de` de cada achado. Até aqui era dado que ninguém consultava no momento de
     * decidir: a mesma classe de falha que o sistema diagnostica em si desde o começo
     * (`validate_prisma_flow` existia, e nada o chamava).
     *
     * REPROVA, não avisa: corrigir fora de ordem gera retrabalho já mapeado, e aviso que
     * depende de alguém ler decai.
     *
     * Dependência satisfeita = pré-requisito RESOLVIDO ou RECUSADO. Recusado conta porque
     * é decisão registrada — o que não pode é o pré-requisito seguir em aberto, sem
     * ninguém ter decidido nada.
     *
     * Backlog ilegível NÃO reprova a proposta: seria punir o autor por um defeito do
     * arquivo. Devolve o aviso para quem chama decidir — é o mesmo cuidado que fez
     * `probe()` distinguir AUSENTE de ILEGIVEL.
     *
     * O backlog chega por INJEÇÃO, não por import: `system_debt.ts` importa `ChangeType`
     * daqui, e importar o serviço de volta faria ciclo — o enum ficaria `undefined` na
     * inicialização e derrubaria os dois módulos. Quem chama já tem o leitor em mãos.
     */
    public checkOrder(proposal: ChangeProposal, sonda: BacklogSonda): { ok: boolean; errors: string[] } {
        if (!proposal.addresses.length) return { ok: true, errors: [] };

        if (sonda.status !== "OK" || !sonda.debt) {
            return {
                ok: true,
                errors: [
                    `⚠️ Ordem de correção NÃO conferida: backlog ${sonda.status.toLowerCase()}` +
                    `${sonda.detail ? ` (${sonda.detail})` : ""}. A proposta segue, mas a dependência não foi verificada.`
                ]
            };
        }

        const porId = new Map(sonda.debt.findings.map((f) => [f.id, f]));
        const errors: string[] = [];

        for (const alvo of proposal.addresses) {
            const achado = porId.get(alvo);
            if (!achado) {
                errors.push(`'${alvo}' não existe no backlog. Registre o achado antes de propor a correção (RV-11).`);
                continue;
            }
            for (const pre of achado.depende_de ?? []) {
                const dep = porId.get(pre);
                if (!dep) {
                    errors.push(`${alvo} declara depender de '${pre}', que não existe no backlog.`);
                    continue;
                }
                if (dep.status === "ABERTO" || dep.status === "EM_CURSO") {
                    errors.push(
                        `🚫 FORA DE ORDEM: ${alvo} exige ${pre} corrigido ANTES, e ${pre} está ${dep.status}. ` +
                        `${pre}: ${dep.summary}`
                    );
                }
            }
        }

        return { ok: errors.length === 0, errors };
    }

    /**
     * Valida uma submissão crua (objeto vindo de JSON).
     *
     * É AQUI que mora o caso que define a regra: submissão sem `change_type` é reprovada,
     * com mensagem que nomeia os três tipos admitidos. O gate reprova a si mesmo se
     * submetido sem tipo declarado — não há caminho de exceção para a própria RV-11.
     */
    public validateRaw(raw: unknown): ChangeValidation {
        const parsed = ChangeProposalSchema.safeParse(raw);

        if (!parsed.success) {
            const missingType = parsed.error.issues.some((i) => i.path.join(".") === "change_type");
            const errors = missingType
                ? [
                    "Alteração submetida SEM tipo declarado. Toda alteração do ReviewBR declara " +
                    `'change_type' entre: ${Object.values(ChangeType).join(" | ")} (RV-11).`
                ]
                : parsed.error.issues.map((i) => `${i.path.join(".") || "(raiz)"}: ${i.message}`);

            return { valid: false, change_type: null, errors, requirement: "declarar o tipo da alteração" };
        }

        return this.validate(parsed.data);
    }
}
