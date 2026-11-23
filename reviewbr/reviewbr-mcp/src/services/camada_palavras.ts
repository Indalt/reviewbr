import * as fs from "node:fs";
import * as path from "node:path";
import {
    resolveDir, readArray, writeScreening,
    PASSADOS_PALAVRAS, EXCLUIDOS_PALAVRAS, RELATORIO_PALAVRAS, PALAVRAS_CHAVE_COMPLETADAS,
} from "./project_artifacts.js";

/**
 * Camada mecânica da triagem, por palavras (pedido do Vicente de 23/11/2026; F4.1.2 e F4.1.3 do
 * protocolo do `roda_aromas_ceara`, que a atribui ao `batch_keyword_screen`).
 *
 * Antes, nenhuma tool a fazia: o `batch_keyword_screen` só lia PDFs de uma pasta, por trecho e sem
 * curinga; o `batch_db_screen` lia o banco, sem curinga, sem palavras-chave e sem a regra do
 * registro sem resumo; nenhum dos dois gravava artefato do funil.
 *
 * O que faz: lê `02_deduplicated/dataset.json` e passa o registro com ao menos um dos termos no
 * título, no resumo ou nas palavras-chave (as do próprio registro e as completadas pela fonte em
 * `02_deduplicated/palavras_chave.json`). Passa também todo registro com o resumo vazio. Grava os
 * que passam e os excluídos como artefatos do funil, com o relatório.
 *
 * Os termos vêm do protocolo, como parâmetro: o código não lê a prosa do protocolo (linha 17). A
 * conferência é só esta: cada termo tem de estar escrito, letra por letra, no `protocol.md`.
 */

export const REGRA_DE_CASAMENTO =
    "Passa o registro com ao menos um termo no título, no resumo ou nas palavras-chave. Termo terminado em * " +
    "aceita qualquer terminação da palavra (aroma* pega aroma, aromas, aromático); termo sem * é a palavra " +
    "inteira (perfil não pega perfis); termo de mais de uma palavra casa as palavras seguidas. Sem diferença " +
    "de maiúscula nem de acento. Palavra é a sequência de letras e números entre espaços e pontuação. Passa " +
    "também todo registro com o resumo vazio, com ou sem termo.";

export const MOTIVO_EXCLUSAO = "nenhum termo do protocolo no título, no resumo nem nas palavras-chave";

export function normalizar(s: unknown): string {
    return String(s ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function palavrasDe(texto: unknown): string[] {
    return normalizar(texto).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

export interface TermoCompilado { termo: string; palavras: string[]; prefixo: boolean }

export function compilarTermos(termos: string[]): TermoCompilado[] {
    if (!Array.isArray(termos) || termos.length === 0) throw new Error("Nenhum termo informado.");
    return termos.map((bruto) => {
        const termo = String(bruto ?? "").trim();
        if (!termo) throw new Error("Termo vazio na lista.");
        const prefixo = termo.endsWith("*");
        const corpo = prefixo ? termo.slice(0, -1) : termo;
        if (corpo.includes("*")) throw new Error(`Termo "${termo}": o curinga * só é aceito no fim.`);
        const palavras = palavrasDe(corpo);
        if (palavras.length === 0) throw new Error(`Termo "${termo}" sem letra nem número.`);
        return { termo, palavras, prefixo };
    });
}

function casaTermo(palavras: string[], t: TermoCompilado): boolean {
    const n = t.palavras.length;
    for (let i = 0; i + n <= palavras.length; i++) {
        let casou = true;
        for (let j = 0; j < n; j++) {
            const ultima = j === n - 1;
            const w = palavras[i + j];
            const p = t.palavras[j];
            if (!(ultima && t.prefixo ? w.startsWith(p) : w === p)) { casou = false; break; }
        }
        if (casou) return true;
    }
    return false;
}

/** Os termos (como escritos) que casam com o texto. */
export function termosQueCasam(texto: unknown, termos: TermoCompilado[]): string[] {
    const palavras = palavrasDe(texto);
    if (palavras.length === 0) return [];
    return termos.filter((t) => casaTermo(palavras, t)).map((t) => t.termo);
}

function textoDe(v: unknown): string {
    if (Array.isArray(v)) return v.map((x) => String(x ?? "")).join(" ");
    return String(v ?? "");
}

function listaDe(v: unknown): string[] {
    if (Array.isArray(v)) return v.flat().map((x) => String(x ?? "").trim()).filter(Boolean);
    if (typeof v === "string" && v.trim()) return [v.trim()];
    return [];
}

/** Chave do registro na fonte: a mesma que o `complete_record_keywords` grava. */
export function chaveNaFonteDoRegistro(r: any): string {
    return `${String(r?.repositoryId ?? r?.repositoryName ?? "").trim()}|${String(r?.identifier ?? "").trim()}`;
}

/** Lê `02_deduplicated/palavras_chave.json` como mapa chave → palavras. Ausente: mapa vazio. */
export function lerPalavrasChaveCompletadas(projectDir: string): Map<string, string[]> {
    const mapa = new Map<string, string[]>();
    for (const e of readArray(path.join(projectDir, PALAVRAS_CHAVE_COMPLETADAS))) {
        const chave = `${String(e?.repositoryId ?? "").trim()}|${String(e?.identifier ?? "").trim()}`;
        const palavras = listaDe(e?.palavras);
        if (palavras.length) mapa.set(chave, palavras);
    }
    return mapa;
}

export interface Casamento { campo: "título" | "resumo" | "palavras-chave"; termos: string[] }

export interface ResultadoCamada {
    passados: any[];
    excluidos: any[];
    contagens: {
        entrada: number;
        passados: number;
        passados_por_termo: number;
        passados_so_por_nao_ter_resumo: number;
        sem_resumo: number;
        excluidos: number;
        excluidos_sem_palavras_chave: number;
        com_palavras_chave: number;
        com_palavras_chave_completadas: number;
    };
    por_fonte: Record<string, { entrada: number; passados: number; excluidos: number; sem_palavras_chave: number }>;
    por_termo: Record<string, number>;
}

export function aplicarCamadaPorPalavras(
    registros: any[],
    termos: string[],
    completadas: Map<string, string[]> = new Map(),
): ResultadoCamada {
    const compilados = compilarTermos(termos);
    const passados: any[] = [];
    const excluidos: any[] = [];
    const por_fonte: ResultadoCamada["por_fonte"] = {};
    const por_termo: Record<string, number> = Object.fromEntries(compilados.map((t) => [t.termo, 0]));
    const c = {
        entrada: registros.length, passados: 0, passados_por_termo: 0, passados_so_por_nao_ter_resumo: 0,
        sem_resumo: 0, excluidos: 0, excluidos_sem_palavras_chave: 0, com_palavras_chave: 0, com_palavras_chave_completadas: 0,
    };

    for (const item of registros) {
        const r = item?.record ?? item;
        const fonte = String(r?.repositoryName ?? r?.repositoryId ?? "sem fonte");
        const f = (por_fonte[fonte] ??= { entrada: 0, passados: 0, excluidos: 0, sem_palavras_chave: 0 });
        f.entrada++;

        const resumo = textoDe(r?.description ?? r?.abstract).trim();
        const semResumo = resumo.length === 0;
        if (semResumo) c.sem_resumo++;

        const extras = completadas.get(chaveNaFonteDoRegistro(r)) ?? [];
        const palavrasChave = [...new Set([...listaDe(r?.subjectAreas), ...listaDe(r?.keywords), ...extras])];
        if (palavrasChave.length) c.com_palavras_chave++; else f.sem_palavras_chave++;
        if (extras.length) c.com_palavras_chave_completadas++;

        const casamentos: Casamento[] = [];
        const noTitulo = termosQueCasam(textoDe(r?.title), compilados);
        if (noTitulo.length) casamentos.push({ campo: "título", termos: noTitulo });
        const noResumo = termosQueCasam(resumo, compilados);
        if (noResumo.length) casamentos.push({ campo: "resumo", termos: noResumo });
        const nasPalavras = [...new Set(palavrasChave.flatMap((p) => termosQueCasam(p, compilados)))];
        if (nasPalavras.length) casamentos.push({ campo: "palavras-chave", termos: nasPalavras });

        if (casamentos.length) {
            for (const t of new Set(casamentos.flatMap((x) => x.termos))) por_termo[t]++;
            passados.push({ record: r, camada: "palavras", motivo: "termo", sem_resumo: semResumo, casamentos });
            c.passados_por_termo++;
            f.passados++;
        } else if (semResumo) {
            passados.push({ record: r, camada: "palavras", motivo: "sem resumo", sem_resumo: true, casamentos: [] });
            c.passados_so_por_nao_ter_resumo++;
            f.passados++;
        } else {
            excluidos.push({ record: r, camada: "palavras", motivo: MOTIVO_EXCLUSAO, palavras_chave_lidas: palavrasChave.length > 0 });
            if (!palavrasChave.length) c.excluidos_sem_palavras_chave++;
            f.excluidos++;
        }
    }
    c.passados = passados.length;
    c.excluidos = excluidos.length;
    return { passados, excluidos, contagens: c, por_fonte, por_termo };
}

/** Os termos que não estão escritos, letra por letra, no protocolo. */
export function termosForaDoProtocolo(protocolo: string, termos: string[]): string[] {
    return termos.filter((t) => !protocolo.includes(String(t ?? "").trim()));
}

export interface CamadaGravada {
    relatorio: Record<string, unknown>;
    arquivos: { passados: string; excluidos: string; relatorio: string };
    substituicao?: { pasta: string; havia: { incluidos: number; excluidos: number } };
    resumo: string;
}

/**
 * Roda a camada sobre o dataset deduplicado do projeto e grava os artefatos do funil. Recusa, sem gravar
 * nada: sem `protocol.md`, termo que não está escrito nele, sem `02_deduplicated/dataset.json`, e camada já
 * gravada sem a autorização do pesquisador para regravá-la (regra do DEBT-112).
 */
export function gravarCamadaPorPalavras(
    projectPath: string,
    termos: string[],
    opcoes: { substituicao?: string } = {},
): CamadaGravada {
    const dir = resolveDir(projectPath);
    const protocoloPath = path.join(dir, "protocol.md");
    if (!fs.existsSync(protocoloPath)) throw new Error("Projeto sem protocol.md: os termos da camada vêm do protocolo. Nada foi gravado.");
    const fora = termosForaDoProtocolo(fs.readFileSync(protocoloPath, "utf-8"), termos);
    if (fora.length) {
        throw new Error(`Termo(s) que não estão escritos no protocol.md: ${fora.map((t) => `"${t}"`).join(", ")}. ` +
            "Copie os termos do protocolo sem mudar nada. Nada foi gravado.");
    }
    compilarTermos(termos);

    const entradaRel = "02_deduplicated/dataset.json";
    const entradaPath = path.join(dir, entradaRel);
    if (!fs.existsSync(entradaPath)) throw new Error(`${entradaRel} não existe: a camada roda depois da deduplicação (F3). Nada foi gravado.`);
    const registros = readArray(entradaPath);
    if (registros.length === 0) throw new Error(`${entradaRel} sem registros. Nada foi gravado.`);

    const completadas = lerPalavrasChaveCompletadas(dir);
    const r = aplicarCamadaPorPalavras(registros, termos, completadas);
    const fecha = r.passados.length + r.excluidos.length === registros.length;
    if (!fecha) {
        throw new Error(`Passados (${r.passados.length}) + excluídos (${r.excluidos.length}) ≠ entrada (${registros.length}). Nada foi gravado.`);
    }

    const relatorioAnterior = path.join(dir, RELATORIO_PALAVRAS);
    const relatorioAntigo = fs.existsSync(relatorioAnterior) ? fs.readFileSync(relatorioAnterior, "utf-8") : null;
    const gravado = writeScreening(projectPath, "palavras", r.passados, r.excluidos, { autorizacao: opcoes.substituicao }, "batch_keyword_screen");
    if (gravado.substituicao && relatorioAntigo !== null) {
        fs.writeFileSync(path.join(dir, gravado.substituicao.pasta, path.basename(RELATORIO_PALAVRAS)), relatorioAntigo);
    }

    const relatorio = {
        quando: new Date().toISOString(),
        ferramenta: "batch_keyword_screen (modo dos registros do projeto)",
        entrada: entradaRel,
        termos,
        regra: REGRA_DE_CASAMENTO,
        campos: ["título (title)", "resumo (description)", "palavras-chave (subjectAreas, keywords e " + PALAVRAS_CHAVE_COMPLETADAS + ")"],
        palavras_chave_completadas: fs.existsSync(path.join(dir, PALAVRAS_CHAVE_COMPLETADAS)) ? PALAVRAS_CHAVE_COMPLETADAS : null,
        contagens: r.contagens,
        conferencia: { passados_mais_excluidos: r.passados.length + r.excluidos.length, entrada: registros.length, fecha },
        por_fonte: r.por_fonte,
        por_termo: r.por_termo,
        arquivos: { passados: PASSADOS_PALAVRAS, excluidos: EXCLUIDOS_PALAVRAS },
        ...(gravado.substituicao ? { substituiu: gravado.substituicao } : {}),
    };
    fs.writeFileSync(path.join(dir, RELATORIO_PALAVRAS), JSON.stringify(relatorio, null, 2));

    const k = r.contagens;
    const linhasFonte = Object.entries(r.por_fonte)
        .map(([f, v]) => `| ${f} | ${v.entrada} | ${v.passados} | ${v.excluidos} | ${v.sem_palavras_chave} |`);
    const resumo = [
        "## Camada por palavras (registros do projeto)",
        `- **Entrada:** ${entradaRel}, ${k.entrada} registros`,
        `- **Passam para a leitura humana:** ${k.passados} (${k.passados_por_termo} por termo; ${k.passados_so_por_nao_ter_resumo} só por não ter resumo)`,
        `- **Excluídos:** ${k.excluidos} (${k.excluidos_sem_palavras_chave} deles sem palavras-chave para ler)`,
        `- **Conferência:** ${k.passados} + ${k.excluidos} = ${k.passados + k.excluidos} (entrada ${k.entrada}) ${fecha ? "✅" : "❌"}`,
        `- **Palavras-chave:** ${k.com_palavras_chave} registros com elas (${k.com_palavras_chave_completadas} completadas pela fonte em ${PALAVRAS_CHAVE_COMPLETADAS}); ${k.entrada - k.com_palavras_chave} sem`,
        `- **Termos:** ${termos.join(", ")}`,
        `- **Regra:** ${REGRA_DE_CASAMENTO}`,
        `- **Gravado:** ${PASSADOS_PALAVRAS}, ${EXCLUIDOS_PALAVRAS}, ${RELATORIO_PALAVRAS}. O funil soma os excluídos aos da triagem; a leitura humana por título e resumo lê os que passaram.`,
        ...(gravado.substituicao ? [`- ♻️ Substituiu a camada anterior, arquivada em ${gravado.substituicao.pasta} com a autorização.`] : []),
        "",
        "| fonte | entrada | passam | excluídos | sem palavras-chave |",
        "|---|---|---|---|---|",
        ...linhasFonte,
    ].join("\n");

    return {
        relatorio,
        arquivos: { passados: gravado.includedFile, excluidos: gravado.excludedFile, relatorio: path.join(dir, RELATORIO_PALAVRAS) },
        ...(gravado.substituicao ? { substituicao: gravado.substituicao } : {}),
        resumo,
    };
}
