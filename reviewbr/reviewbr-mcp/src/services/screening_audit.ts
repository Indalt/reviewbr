import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";

/**
 * ScreeningAudit — a trilha de auditoria da triagem assistida por IA.
 *
 * POR QUE EXISTE
 * --------------
 * O RAISE (Responsible use of AI in Evidence SynthEsis, https://osf.io/fwaud/) define, no
 * §4.8, "uso substancial" de IA incluindo textualmente **decisões de elegibilidade de
 * estudo** — que é exatamente o que `screen_candidates` faz. O §4.9 exige declarar nome do
 * modelo, **versão** e **datas** (4.9.1), a finalidade e as partes do processo impactadas
 * (4.9.2), e tornar públicos os **prompts**, as saídas e os dados (4.9.3.2). O §4.3 exige
 * manter **trilhas de auditoria** e o **desenvolvimento dos prompts**.
 *
 * Nada disso existia: o prompt era montado em memória e descartado, o modelo era um alias
 * fixo em código, e nenhuma decisão deixava rastro.
 *
 * O PONTO QUE REORIENTA O DESENHO
 * -------------------------------
 * Reprodutibilidade de triagem por IA **não se obtém re-executando**. O modelo de 2026 não
 * existirá em 2028, e o nome `gemini-2.5-flash-lite` é um alias: o provedor atualiza para
 * onde ele aponta, sem aviso. Re-rodar é impossível por construção.
 *
 * Por isso o alvo não é determinismo — é **registro preservado**, como caderno de
 * laboratório. Ninguém refaz um experimento de 2019 com o lote exato de reagente; confere-se
 * o registro e faz-se o seu. E a área nunca exigiu identidade de resultado nem de humanos:
 * o padrão é dois triadores independentes com **concordância medida**, o que admite na
 * própria norma que dois competentes discordam.
 *
 * Fixar temperatura continua necessário — como parte do registro, não como o objetivo.
 */

export interface ScreeningProvenance {
    /** Nome pedido ao provedor. Pode ser alias; é por isso que `model_pinned` existe. */
    model: string;
    /** true quando o nome traz sufixo de versão e identifica um artefato estável. */
    model_pinned: boolean;
    temperature: number;
    /** Momento da chamada — o "quando" que o RAISE §4.9.1 exige. */
    timestamp: string;
    /** Identidade do prompt sem gravar milhares de cópias. */
    prompt_sha256: string;
}

export interface RunManifest {
    run_id: string;
    started_at: string;
    finished_at?: string;
    stage: string;
    model: string;
    model_pinned: boolean;
    temperature: number;
    prompt_template_sha256: string;
    total: number;
    decisions: Record<string, number>;
    /** Avisos de conformidade que o operador precisa ver antes de publicar. */
    raise_warnings: string[];
}

/** Um nome de modelo está "pinado" quando traz sufixo de versão, não só a família. */
export function isPinned(model: string): boolean {
    return /-(\d{3}|\d{4}-\d{2}-\d{2}|preview-\d|exp-\d)/.test(model);
}

export function sha256(s: string): string {
    return crypto.createHash("sha256").update(s, "utf-8").digest("hex");
}

export class ScreeningAuditService {
    private dir: string;
    private manifest: RunManifest;
    private linhas: string[] = [];

    /**
     * @param projectPath raiz do projeto. Sem ela não há onde gravar e o registro não acontece —
     *                    por isso `screen_candidates` deve exigi-la para triagem oficial.
     */
    constructor(projectPath: string, stage: string, model: string, temperature: number, promptTemplate: string, nowIso: string) {
        const pin = isPinned(model);
        const runId = `${nowIso.replace(/[:.]/g, "-")}_${stage}`;
        this.dir = path.join(projectPath, "03_screening", "ia_audit", runId);

        const warnings: string[] = [];
        if (!pin) {
            warnings.push(
                `RAISE §4.9.1: o modelo "${model}" é um ALIAS, não uma versão fixada. O provedor ` +
                `pode alterar para onde ele aponta sem aviso, e a mesma execução em outra data ` +
                `pode ser outro modelo. Para declaração completa, fixe uma versão com sufixo.`
            );
        }
        warnings.push(
            "RAISE §4.9.3.1/4.9.3.2: falta evidência de desempenho e validação nesta revisão — " +
            "padrão-ouro, meta de recall e concordância entre execuções. Este registro cobre o " +
            "QUE foi decidido; não substitui a avaliação de QUÃO BEM decide."
        );

        this.manifest = {
            run_id: runId, started_at: nowIso, stage, model, model_pinned: pin,
            temperature, prompt_template_sha256: sha256(promptTemplate),
            total: 0, decisions: {}, raise_warnings: warnings
        };

        fs.mkdirSync(this.dir, { recursive: true });
        // O prompt íntegro, uma vez por corrida — o "desenvolvimento dos prompts" do §4.3.
        fs.writeFileSync(path.join(this.dir, "prompt_template.txt"), promptTemplate, "utf-8");
    }

    /**
     * Registra UMA decisão, com a entrada que a produziu.
     *
     * Guarda o digest do prompt e não o prompt inteiro: com milhares de registros, gravar
     * cada cópia inflaria o projeto sem acrescentar informação — o template está salvo, e o
     * digest prova qual foi usado em cada decisão.
     */
    record(entry: {
        identifier: string;
        title: string;
        decision: string;
        score?: number;
        reasoning?: string;
        prompt: string;
        raw_response?: string;
        provenance: ScreeningProvenance;
    }): void {
        this.manifest.total++;
        const d = entry.decision || "(sem decisão)";
        this.manifest.decisions[d] = (this.manifest.decisions[d] ?? 0) + 1;
        this.linhas.push(JSON.stringify({
            identifier: entry.identifier,
            title: entry.title,
            decision: entry.decision,
            score: entry.score,
            reasoning: entry.reasoning,
            prompt_chars: entry.prompt.length,
            raw_response: entry.raw_response,
            ...entry.provenance
        }));
    }

    /** Fecha a corrida e grava. Sem isto o registro fica só em memória e se perde. */
    close(nowIso: string): RunManifest {
        this.manifest.finished_at = nowIso;
        fs.writeFileSync(path.join(this.dir, "decisions.jsonl"), this.linhas.join("\n") + (this.linhas.length ? "\n" : ""), "utf-8");
        fs.writeFileSync(path.join(this.dir, "run.json"), JSON.stringify(this.manifest, null, 2), "utf-8");
        return this.manifest;
    }

    get path(): string { return this.dir; }
}

/**
 * Compara duas corridas de triagem sobre o mesmo conjunto — o equivalente ao par de
 * triadores independentes e ao kappa que a área já exige de humanos.
 *
 * Devolve concordância bruta e Cohen's kappa. O kappa corrige a concordância esperada por
 * acaso: com 95% dos registros excluídos, dois triadores que chutassem "NO" sempre
 * concordariam em 95% e não teriam concordado em nada.
 */
export function compararCorridas(
    a: Array<{ identifier: string; decision: string }>,
    b: Array<{ identifier: string; decision: string }>
): { n: number; concordancia: number; kappa: number; discordantes: Array<{ identifier: string; a: string; b: string }> } {
    const mb = new Map(b.map((x) => [x.identifier, x.decision]));
    const pares: Array<[string, string]> = [];
    const discordantes: Array<{ identifier: string; a: string; b: string }> = [];

    for (const x of a) {
        const y = mb.get(x.identifier);
        if (y === undefined) continue;
        pares.push([x.decision, y]);
        if (x.decision !== y) discordantes.push({ identifier: x.identifier, a: x.decision, b: y });
    }

    const n = pares.length;
    if (n === 0) return { n: 0, concordancia: 0, kappa: 0, discordantes };

    const iguais = pares.filter(([p, q]) => p === q).length;
    const po = iguais / n;

    const cats = [...new Set(pares.flat())];
    let pe = 0;
    for (const c of cats) {
        const fa = pares.filter(([p]) => p === c).length / n;
        const fb = pares.filter(([, q]) => q === c).length / n;
        pe += fa * fb;
    }

    // pe === 1 quando só há uma categoria nas duas corridas: kappa é indefinido; devolvemos 1
    // quando concordam integralmente, para não reportar 0 concordância perfeita.
    const kappa = pe === 1 ? (po === 1 ? 1 : 0) : (po - pe) / (1 - pe);
    return { n, concordancia: po, kappa, discordantes };
}
