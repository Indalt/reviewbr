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

/**
 * A REGRA DO BACKLOG (decidida pelo pesquisador em 05/11/2026, à tarde; DIRECAO §9, 04/10/2026):
 * o backlog registra só DEFEITO — o que o sistema afirma, exige ou entrega hoje e não se
 * sustenta. Metodologia ou norma que falta fica no catálogo; decisão do pesquisador vai ao
 * registro de decisões, e a agenda, ao plano; problema só futuro não se registra.
 *
 * Por que virou campo: o `record_system_finding` aceitava achado sem perguntar onde o sistema
 * afirma ou exige algo hoje, e ausência e decisão entraram na fila como achado (triagem de
 * 05/11, "O que a varredura achou", 1). Do outro lado, defeitos de hoje esperavam com o destino
 * METODOLOGIA_NOVA, e a DIRECAO §11 (08/10) contou como escopo, só pelo destino, 23 achados que
 * travavam. A pergunta passa a ser feita na escrita: onde está a afirmação, o que ela diz, e o
 * que mostra que não se sustenta.
 */
export const REGRA_DO_BACKLOG =
    "O backlog registra só defeito: o que o sistema afirma, exige ou entrega hoje e não se sustenta " +
    "(regra do backlog, 05/11/2026; DIRECAO §9). Ausência não é achado: metodologia ou norma que falta " +
    "vai ao catálogo (absorb_methodology); decisão do pesquisador, ao registro de decisões; agenda, ao " +
    "plano; problema só futuro não se registra.";

/**
 * A "mentira de hoje" de um achado: ONDE o sistema afirma ou exige, O QUE diz ali, e O QUE
 * mostra que não se sustenta. Os padrões vazios existem só para a mensagem dizer o que falta,
 * campo a campo; a exigência é da escrita (`BacklogWriter`) e o aviso, da auditoria.
 */
export const MentiraDeHojeSchema = z.object({
    /** Caminho do arquivo onde o sistema afirma ou exige, relativo à raiz do repositório. */
    arquivo: z.string().default(""),
    /** Linha desse arquivo, a partir de 1. */
    linha: z.number().int().default(0),
    /** O que o sistema diz ali. */
    diz: z.string().default(""),
    /** O que mostra que não se sustenta: o código, a medida, a reprodução. */
    nao_se_sustenta: z.string().default("")
});

export type MentiraDeHoje = z.infer<typeof MentiraDeHojeSchema>;

/** ABERTO e EM_CURSO: o achado está na fila, e é aí que a mentira de hoje é exigida. */
export function naFila(status: string): boolean {
    return status === "ABERTO" || status === "EM_CURSO";
}

/**
 * O destino que deixou de valer para defeito (decisão 5, 05/11/2026). Defeito vai ao destino
 * do seu conserto; metodologia que falta não é achado. Nos fechados ele segue válido, como
 * histórico do que foi decidido com ele.
 */
export const DESTINO_SO_HISTORICO = "METODOLOGIA_NOVA";

/** Os campos que faltam à mentira de hoje — vazio quando está completa. Não olha o disco. */
export function faltasDaMentira(m: MentiraDeHoje | undefined): string[] {
    if (!m) return ["mentira_de_hoje (arquivo, linha, diz, nao_se_sustenta)"];
    const faltas: string[] = [];
    if (!m.arquivo.trim()) faltas.push("arquivo");
    if (!(m.linha >= 1)) faltas.push("linha (a partir de 1)");
    if (!m.diz.trim()) faltas.push("diz");
    if (!m.nao_se_sustenta.trim()) faltas.push("nao_se_sustenta");
    return faltas;
}

/**
 * Confere a mentira de hoje no disco: o caminho é relativo à raiz do repositório e fica
 * dentro dela, o arquivo existe e tem a linha. NÃO confere que o texto de `diz` esteja na
 * linha: isso é leitura de quem registra, e a máquina não a julga.
 */
export function conferirMentiraNoDisco(repoRoot: string, m: MentiraDeHoje): string[] {
    const arquivo = m.arquivo.trim();
    if (path.isAbsolute(arquivo) || /^[a-zA-Z]:/.test(arquivo)) {
        return [`mentira_de_hoje.arquivo "${arquivo}" é caminho absoluto: use o caminho relativo à raiz do repositório.`];
    }
    const raiz = path.resolve(repoRoot);
    const alvo = path.resolve(raiz, arquivo);
    const rel = path.relative(raiz, alvo);
    if (rel === ".." || rel.startsWith(".." + path.sep) || path.isAbsolute(rel)) {
        return [`mentira_de_hoje.arquivo "${arquivo}" sai da raiz do repositório.`];
    }
    if (!fs.existsSync(alvo)) {
        const dica = /:\d+(-\d+)?$/.test(arquivo) ? " A linha vai no campo 'linha', não no caminho." : "";
        return [`mentira_de_hoje.arquivo "${arquivo}" não existe no repositório.${dica}`];
    }
    if (!fs.statSync(alvo).isFile()) {
        return [`mentira_de_hoje.arquivo "${arquivo}" não é arquivo.`];
    }
    const texto = fs.readFileSync(alvo, "utf-8");
    const partes = texto.split(/\r\n|\n|\r/);
    const linhas = texto === "" ? 0 : (partes[partes.length - 1] === "" ? partes.length - 1 : partes.length);
    if (m.linha > linhas) {
        return [`mentira_de_hoje.linha ${m.linha} passa do fim de "${arquivo}", que tem ${linhas} linha(s).`];
    }
    return [];
}

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
     * Para onde o CONSERTO deste achado vai. Sem isto, achado nasce órfão — e foi assim que 57
     * dos 85 abertos sumiram do radar sem decisão. O destino NÃO define escopo nem agenda: se
     * algo é achado decide o teste da DIRECAO §9 (a mentira de hoje), e o que cada sessão
     * conserta, o plano (PLANO_sessoes_2026-10-29.md). Valores:
     * FASE_1 | FASE_2 | CONFORM_EXTERNA | AGENTE_SKILL | DECISAO_PESQ | BLOQUEADO | DIAGNOSTICO,
     * e METODOLOGIA_NOVA só em achado FECHADO, como histórico (decisão 5, 05/11/2026): metodologia
     * que falta não é achado, fica no catálogo. FASE_1 e FASE_2 vêm das fases do
     * PLANO_usabilidade.md (25/09/2026): "parar de mentir" e "impedir que a classe volte".
     */
    destino: z.string().default(""),

    /** Ids que precisam ser corrigidos ANTES deste. Corrigir fora de ordem gera retrabalho. */
    depende_de: z.array(z.string()).default([]),

    /**
     * Onde o sistema afirma ou exige hoje o que não se sustenta (regra do backlog, 05/11/2026).
     * Exigida na escrita de achado ABERTO ou EM_CURSO; fechar não a exige. Os abertos de antes
     * da regra a recebem quando a sessão deles os tocar — até lá, a auditoria os AVISA.
     */
    mentira_de_hoje: MentiraDeHojeSchema.optional()
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
    /** Abertos sem a mentira de hoje completa (regra do backlog, 05/11/2026). AVISO, não erro. */
    sem_mentira_de_hoje: string[];
    /** O que pede atenção sem reprovar o backlog. */
    warnings: string[];
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
     *
     * Também reprova achado aberto com o destino METODOLOGIA_NOVA (decisão 5, 05/11/2026) e
     * AVISA, sem reprovar, os abertos sem a mentira de hoje: os de antes da regra a recebem
     * quando a sessão deles os tocar, e a escrita já não os aceita em ABERTO ou EM_CURSO sem ela.
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
                by_destino: {}, by_gravidade: {}, sem_destino: [], bloqueados_por_dependencia: [],
                sem_mentira_de_hoje: [], warnings: []
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
        const sem_mentira_de_hoje: string[] = [];
        const destinoSoHistorico: string[] = [];
        const warnings: string[] = [];

        for (const f of abertos) {
            const d = f.destino.trim() || "(sem destino)";
            by_destino[d] = (by_destino[d] ?? 0) + 1;
            if (!f.destino.trim()) sem_destino.push(f.id);
            if (f.destino.trim() === DESTINO_SO_HISTORICO) destinoSoHistorico.push(f.id);
            if (faltasDaMentira(f.mentira_de_hoje).length) sem_mentira_de_hoje.push(f.id);

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

        if (destinoSoHistorico.length) {
            errors.push(
                `${destinoSoHistorico.length} achado(s) aberto(s) com o destino ${DESTINO_SO_HISTORICO}: ${destinoSoHistorico.join(", ")}. ` +
                "Esse destino deixou de valer para defeito (decisão 5, 05/11/2026): defeito vai ao destino do seu " +
                "conserto, e metodologia que falta não é achado — fica no catálogo. Nos fechados ele segue como histórico."
            );
        }

        if (sem_mentira_de_hoje.length) {
            warnings.push(
                `${sem_mentira_de_hoje.length} achado(s) aberto(s) sem a "mentira de hoje" (arquivo, linha, diz, ` +
                `nao_se_sustenta): ${sem_mentira_de_hoje.slice(0, 10).join(", ")}` +
                (sem_mentira_de_hoje.length > 10 ? ` … e mais ${sem_mentira_de_hoje.length - 10} (lista em sem_mentira_de_hoje).` : ".") +
                " Não reprova: cada um a recebe quando a sessão dele o tocar, porque a record_system_finding " +
                "não grava achado ABERTO ou EM_CURSO sem ela. " + REGRA_DO_BACKLOG
            );
        }

        return {
            valid: errors.length === 0,
            errors,
            counts,
            open: abertos,
            total: debt.findings.length,
            by_destino, by_gravidade, sem_destino, bloqueados_por_dependencia,
            sem_mentira_de_hoje, warnings
        };
    }
}
