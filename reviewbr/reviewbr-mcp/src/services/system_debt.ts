import * as fs from "node:fs";
import * as path from "node:path";
import { z } from "zod";
import { ChangeType } from "./change_validator.js";

/**
 * SystemDebt — backlog de achados sobre o PRÓPRIO ReviewBR, em `system_debt.json`.
 *
 * Por que existe: registrar um achado em prosa, numa tabela de documento, não é fila — é
 * esquecimento organizado. O protocolo manda "registrar sem executar" para impedir deriva,
 * mas registrar sem SAÍDA transforma a disciplina em arquivo morto. Este serviço dá à fila
 * uma saída verificável.
 *
 * O precedente é o do próprio sistema: `validate_prisma_flow` (RV-05) existia e nunca era
 * chamada. Um backlog que ninguém é obrigado a consultar tem exatamente esse destino.
 *
 * Fonte da verdade ON-DISK, como `project_state.json` (RV-04: agente + timestamp em toda
 * decisão). É o que permite que uma sessão NOVA — sem nenhum contexto de conversa anterior —
 * saiba onde o trabalho parou.
 */

export type DebtStatus =
    | "ABERTO"      // achado registrado, sem decisão
    | "EM_CURSO"    // decidido corrigir; trabalho em andamento
    | "RESOLVIDO"   // corrigido, com referência à correção
    | "RECUSADO";   // decidido não corrigir, COM justificativa

export const DebtFindingSchema = z.object({
    /** Identificador estável, usado para referenciar o achado entre sessões. */
    id: z.string().min(1),

    /** O que foi encontrado, em uma linha. */
    summary: z.string().min(1),

    /**
     * Tipo de alteração que o achado exigiria, se for corrigido (RV-11).
     * Declarado já no registro: classificar na hora da descoberta é mais fiel do que
     * classificar meses depois, de memória.
     */
    change_type: z.nativeEnum(ChangeType),

    /** Evidência: o que o sistema promete e o que de fato faz. */
    evidence: z.string().min(1),

    /** Passos que reproduzem. Vazio só é aceitável para achado que não é CORRECAO. */
    reproduction: z.string().default(""),

    /** Onde foi encontrado (arquivo:linha, quando aplicável). */
    location: z.string().default(""),

    status: z.enum(["ABERTO", "EM_CURSO", "RESOLVIDO", "RECUSADO"]),

    /**
     * Justificativa da decisão. Obrigatória para RESOLVIDO e RECUSADO — é o que impede
     * que um achado desapareça da fila sem que ninguém saiba por quê.
     */
    resolution: z.string().default(""),

    /** Quem registrou e quando (RV-04). */
    found_by: z.string().default(""),
    found_at: z.string().default(""),

    /** De onde veio: o trabalho/protocolo durante o qual o achado apareceu. */
    context: z.string().default(""),

    // ─── Campos que eram documento e viraram DADO ────────────────────────────
    // Os três abaixo viviam fora do backlog: a gravidade enterrada no texto de `evidence`
    // como prefixo, o destino só num mapa gerado à mão, a dependência só numa tabela.
    // Documento gerado decai; dado o agente regenera. Enquanto eram documento, o mantenedor
    // precisava CONFIAR num snapshot — que é exatamente o que este sistema recusa.

    /** BLOQUEIA | SERIO | MENOR. Vazio = não classificado. */
    gravidade: z.string().default(""),

    /**
     * Para onde este achado vai. Sem isto, achado nasce órfão — e foi assim que 57 dos 85
     * abertos sumiram do radar sem decisão. Valores usados:
     * FASE_1 | FASE_2 | CONFORM_EXTERNA | METODOLOGIA_NOVA | AGENTE_SKILL | DECISAO_PESQ |
     * BLOQUEADO | DIAGNOSTICO
     */
    destino: z.string().default(""),

    /** Ids que precisam ser corrigidos ANTES deste. Corrigir fora de ordem gera retrabalho. */
    depende_de: z.array(z.string()).default([])
});

export type DebtFinding = z.infer<typeof DebtFindingSchema>;

export const SystemDebtSchema = z.object({
    schemaVersion: z.literal(1),
    updatedAt: z.string().default(""),
    findings: z.array(DebtFindingSchema).default([])
});

export type SystemDebt = z.infer<typeof SystemDebtSchema>;

export interface DebtAudit {
    valid: boolean;
    errors: string[];
    /** Contagem por estado — o panorama que uma sessão nova precisa ver primeiro. */
    counts: Record<DebtStatus, number>;
    /** Achados que exigem atenção agora, em ordem de registro. */
    open: DebtFinding[];
    total: number;
    /** Panorama por destino — substitui o mapa de cobertura que era documento gerado. */
    by_destino: Record<string, number>;
    /** Panorama por gravidade. */
    by_gravidade: Record<string, number>;
    /** Abertos sem destino declarado: nascem órfãos e somem do radar. */
    sem_destino: string[];
    /** Abertos cujo `depende_de` aponta para achado ainda não resolvido. */
    bloqueados_por_dependencia: Array<{ id: string; espera: string[] }>;
}

export class SystemDebtService {
    /**
     * Caminho canônico do backlog, relativo à raiz do repositório.
     *
     * Vive em `.claude/maintenance/` — junto dos agentes, skills e metodologias, que é onde
     * já mora tudo que governa o sistema. NÃO em `reviewbr/docs/`: aquela árvore é o site
     * publicado do prismAId (CNAME prismaid.review), e estado operacional dentro do site de
     * outro projeto some numa sincronização com o upstream.
     */
    static debtPath(repoRoot: string): string {
        return path.join(repoRoot, ".claude", "maintenance", "system_debt.json");
    }

    /**
     * Sonda o arquivo distinguindo AUSENTE de ILEGÍVEL.
     *
     * `read()` devolve null nos dois casos, e era por aí que o backlog inteiro se perdia: o
     * escritor lia null, entendia "ainda não existe" e gravava por cima. Um único caractere
     * inválido — uma cedilha num `change_type` editado à mão — apagava a fila de memória do
     * sistema entre sessões, em silêncio, e `audit_system_debt` passava a responder
     * "backlog ausente" como se nada tivesse havido.
     */
    static probe(repoRoot: string): { status: "AUSENTE" | "OK" | "ILEGIVEL"; debt?: SystemDebt; detail?: string } {
        const p = this.debtPath(repoRoot);
        if (!fs.existsSync(p)) return { status: "AUSENTE" };
        let bruto: string;
        try {
            bruto = fs.readFileSync(p, "utf-8");
        } catch (e: any) {
            return { status: "ILEGIVEL", detail: `não foi possível ler o arquivo: ${e.message}` };
        }
        let json: unknown;
        try {
            json = JSON.parse(bruto);
        } catch (e: any) {
            return { status: "ILEGIVEL", detail: `JSON inválido: ${e.message}` };
        }
        const parsed = SystemDebtSchema.safeParse(json);
        if (!parsed.success) {
            return {
                status: "ILEGIVEL",
                detail: "não passa no schema: " + parsed.error.issues.slice(0, 5)
                    .map((i) => `${i.path.join(".") || "(raiz)"}: ${i.message}`).join("; ")
            };
        }
        return { status: "OK", debt: parsed.data };
    }

    static read(repoRoot: string): SystemDebt | null {
        const p = this.debtPath(repoRoot);
        if (!fs.existsSync(p)) return null;
        try {
            const parsed = SystemDebtSchema.safeParse(JSON.parse(fs.readFileSync(p, "utf-8")));
            return parsed.success ? parsed.data : null;
        } catch {
            return null;
        }
    }

    static write(repoRoot: string, debt: SystemDebt, nowIso: string): void {
        const p = this.debtPath(repoRoot);
        debt.updatedAt = nowIso;
        fs.mkdirSync(path.dirname(p), { recursive: true });
        fs.writeFileSync(p, JSON.stringify(debt, null, 2));
    }

    /**
     * Audita a integridade do backlog (o gate de dívida).
     *
     * Reprova quando:
     *  - um achado saiu da fila (RESOLVIDO/RECUSADO) sem justificativa — desaparecimento
     *    silencioso é o que a fila existe para impedir;
     *  - um achado do tipo CORRECAO está registrado sem reprodução — sem ela não se
     *    distingue defeito real de impressão (mesma exigência do RV-11);
     *  - há ids duplicados — referência ambígua entre sessões.
     *
     * NÃO reprova por existirem achados ABERTOS: fila com item aberto é estado normal.
     * O gate cobra que cada item tenha DECISÃO registrada quando sai, não que a fila
     * esteja vazia.
     */
    static audit(debt: SystemDebt | null): DebtAudit {
        const counts: Record<DebtStatus, number> = { ABERTO: 0, EM_CURSO: 0, RESOLVIDO: 0, RECUSADO: 0 };

        if (!debt) {
            return {
                valid: false,
                errors: ["Backlog de dívida ausente: `.claude/maintenance/system_debt.json` não existe ou é ilegível."],
                counts,
                open: [],
                total: 0,
                by_destino: {}, by_gravidade: {}, sem_destino: [], bloqueados_por_dependencia: []
            };
        }

        const errors: string[] = [];
        const seen = new Set<string>();

        for (const f of debt.findings) {
            counts[f.status as DebtStatus]++;

            if (seen.has(f.id)) {
                errors.push(`Achado com id duplicado: "${f.id}". Ids precisam ser únicos para referência entre sessões.`);
            }
            seen.add(f.id);

            if ((f.status === "RESOLVIDO" || f.status === "RECUSADO") && !f.resolution.trim()) {
                errors.push(
                    `Achado "${f.id}" está ${f.status} sem 'resolution'. ` +
                    `Um achado só sai da fila com a decisão registrada — senão o registro vira esquecimento organizado.`
                );
            }

            if (f.change_type === ChangeType.CORRECAO && !f.reproduction.trim()) {
                errors.push(
                    `Achado "${f.id}" é CORRECAO sem 'reproduction'. ` +
                    `Falha não reproduzível não distingue defeito real de impressão (mesma exigência do RV-11).`
                );
            }
        }

        const abertos = debt.findings.filter((f) => f.status === "ABERTO" || f.status === "EM_CURSO");
        const resolvidos = new Set(
            debt.findings.filter((f) => f.status === "RESOLVIDO" || f.status === "RECUSADO").map((f) => f.id)
        );

        const by_destino: Record<string, number> = {};
        const by_gravidade: Record<string, number> = {};
        const sem_destino: string[] = [];
        const bloqueados_por_dependencia: Array<{ id: string; espera: string[] }> = [];

        for (const f of abertos) {
            const d = f.destino.trim() || "(sem destino)";
            by_destino[d] = (by_destino[d] ?? 0) + 1;
            if (!f.destino.trim()) sem_destino.push(f.id);

            const g = f.gravidade.trim() || "(sem gravidade)";
            by_gravidade[g] = (by_gravidade[g] ?? 0) + 1;

            // Dependência aponta para achado ainda aberto: corrigir este antes gera retrabalho.
            const espera = f.depende_de.filter((x) => !resolvidos.has(x));
            if (espera.length) bloqueados_por_dependencia.push({ id: f.id, espera });
        }

        if (sem_destino.length) {
            errors.push(
                `${sem_destino.length} achado(s) aberto(s) sem 'destino' declarado: ${sem_destino.slice(0, 10).join(", ")}` +
                (sem_destino.length > 10 ? ` … e mais ${sem_destino.length - 10}.` : "") +
                " Achado sem destino nasce órfão e some do radar sem decisão — foi assim que 57 de 85 se perderam."
            );
        }

        return {
            valid: errors.length === 0,
            errors,
            counts,
            open: abertos,
            total: debt.findings.length,
            by_destino, by_gravidade, sem_destino, bloqueados_por_dependencia
        };
    }
}
