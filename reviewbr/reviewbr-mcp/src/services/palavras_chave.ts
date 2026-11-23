import * as fs from "node:fs";
import * as path from "node:path";
import { resolveDir, readArray, PALAVRAS_CHAVE_COMPLETADAS } from "./project_artifacts.js";
import { chaveNaFonteDoRegistro } from "./camada_palavras.js";

/**
 * Completa as palavras-chave dos registros já deduplicados, pela fonte (pedido do Vicente de 23/11/2026,
 * F4 do `roda_aromas_ceara`). O protocolo passa o registro pelo título, resumo OU palavras-chave, e só 50
 * dos 5446 registros as tinham: a Oasisbr devolve `subjects` vazio e guarda a lista em `topic` (no
 * `rawData`), e o adaptador do DSpace não gravava o `dc.subject`. Os adaptadores foram corrigidos para as
 * buscas novas; para os registros já gravados, esta função pergunta à fonte pelo id de cada um.
 *
 * Não toca no `02_deduplicated/dataset.json` nem nos totais: grava à parte, em
 * `02_deduplicated/palavras_chave.json` (uma entrada por registro consultado, com a fonte e a data), que
 * a camada por palavras lê. O que não tem como ser consultado fica dito no relatório, com o motivo.
 */

export const RELATORIO_PALAVRAS_CHAVE = "02_deduplicated/palavras_chave_relatorio.json";
const OASISBR_ID = "BR-AGG-0006";

export interface LoteDePalavras { palavras: Map<string, string[]>; naoEncontrados: string[]; falhas: string[]; endereco: string }
export interface FontesDePalavras {
    oasisbr(ids: string[]): Promise<LoteDePalavras>;
    dspace(repositoryId: string, uuids: string[]): Promise<LoteDePalavras>;
}

function temPalavras(r: any): boolean {
    const l = (v: unknown) => (Array.isArray(v) ? v.flat().filter((x) => String(x ?? "").trim()) : []);
    return l(r?.subjectAreas).length > 0 || l(r?.keywords).length > 0;
}

/** Por onde consultar a fonte do registro, ou o motivo de não haver consulta. */
export function rotaDasPalavras(r: any): { rota: "oasisbr" } | { rota: "dspace"; repositoryId: string } | { rota: null; motivo: string } {
    const am = String(r?.accessMethod ?? "");
    if (am === "oasisbr-vufind" || (am === "bdtd-vufind" && r?.repositoryId === OASISBR_ID)) return { rota: "oasisbr" };
    if (am === "dspace-rest" && r?.repositoryId) return { rota: "dspace", repositoryId: String(r.repositoryId) };
    if (am === "api" && /openalex|scielo/i.test(String(r?.repositoryName ?? ""))) {
        return { rota: null, motivo: "OpenAlex: não traz as palavras-chave do autor (as keywords dele são atribuídas pelo próprio OpenAlex)" };
    }
    if (am === "manual_import" || am === "bvs_import") return { rota: null, motivo: "importado de arquivo exportado pela base: as palavras-chave são as do arquivo" };
    if (am === "bdtd-vufind") return { rota: null, motivo: "BDTD: a busca já pede as palavras-chave (subjects); o registro veio sem elas" };
    return { rota: null, motivo: `sem consulta por id para esta fonte (accessMethod "${am || "vazio"}")` };
}

export interface PalavrasCompletadas {
    relatorio: Record<string, any>;
    resumo: string;
}

export async function completarPalavrasChave(
    projectPath: string,
    fontes: FontesDePalavras,
    opcoes: { refazer?: boolean } = {},
): Promise<PalavrasCompletadas> {
    const dir = resolveDir(projectPath);
    const entradaRel = "02_deduplicated/dataset.json";
    const entradaPath = path.join(dir, entradaRel);
    if (!fs.existsSync(entradaPath)) throw new Error(`${entradaRel} não existe: as palavras-chave se completam depois da deduplicação (F3). Nada foi gravado.`);
    const registros = readArray(entradaPath);

    const arquivo = path.join(dir, PALAVRAS_CHAVE_COMPLETADAS);
    const existentes = new Map<string, any>();
    for (const e of readArray(arquivo)) existentes.set(`${e?.repositoryId ?? ""}|${e?.identifier ?? ""}`, e);

    let jaTinham = 0;
    let jaConsultados = 0;
    const semRota: Record<string, number> = {};
    const oasisbr = new Map<string, any>();
    const dspace = new Map<string, Map<string, any>>();
    for (const item of registros) {
        const r = item?.record ?? item;
        if (temPalavras(r)) { jaTinham++; continue; }
        if (!opcoes.refazer && existentes.has(chaveNaFonteDoRegistro(r))) { jaConsultados++; continue; }
        const rota = rotaDasPalavras(r);
        if (rota.rota === "oasisbr") oasisbr.set(String(r.identifier), r);
        else if (rota.rota === "dspace") {
            const m = dspace.get(rota.repositoryId) ?? new Map<string, any>();
            m.set(String(r.identifier), r);
            dspace.set(rota.repositoryId, m);
        } else semRota[rota.motivo] = (semRota[rota.motivo] ?? 0) + 1;
    }

    const quando = new Date().toISOString();
    const consultas: Array<{ rota: string; endereco: string; consultados: number; com_palavras: number; sem_palavras_na_fonte: number; nao_encontrados: string[]; falhas: string[] }> = [];
    const guardar = (lote: LoteDePalavras, regs: Map<string, any>, rota: string) => {
        let com = 0, sem = 0;
        for (const [id, palavras] of lote.palavras) {
            const r = regs.get(id);
            if (!r) continue;
            existentes.set(chaveNaFonteDoRegistro(r), {
                repositoryId: r.repositoryId ?? r.repositoryName, identifier: r.identifier, palavras,
                fonte: lote.endereco, lido_em: quando,
            });
            if (palavras.length) com++; else sem++;
        }
        consultas.push({ rota, endereco: lote.endereco, consultados: regs.size, com_palavras: com, sem_palavras_na_fonte: sem, nao_encontrados: lote.naoEncontrados, falhas: lote.falhas });
    };
    if (oasisbr.size) guardar(await fontes.oasisbr([...oasisbr.keys()]), oasisbr, "Oasisbr (IBICT), /api/v1/record com rawData");
    for (const [repoId, regs] of dspace) guardar(await fontes.dspace(repoId, [...regs.keys()]), regs, `DSpace REST de ${repoId}, core/items`);

    fs.mkdirSync(path.dirname(arquivo), { recursive: true });
    fs.writeFileSync(arquivo, JSON.stringify([...existentes.values()], null, 2));

    const relatorio = {
        quando,
        entrada: entradaRel,
        total: registros.length,
        ja_tinham_palavras_chave: jaTinham,
        ja_consultados_antes: jaConsultados,
        consultas,
        sem_consulta: semRota,
        arquivo: PALAVRAS_CHAVE_COMPLETADAS,
        nota: "O dataset.json e os totais não mudam. Registro com falha ou não encontrado não é gravado e é consultado de novo na próxima execução.",
    };
    fs.writeFileSync(path.join(dir, RELATORIO_PALAVRAS_CHAVE), JSON.stringify(relatorio, null, 2));

    const resumo = [
        "## Palavras-chave completadas pela fonte",
        `- **Registros:** ${registros.length} em ${entradaRel}; ${jaTinham} já tinham palavras-chave${jaConsultados ? `; ${jaConsultados} já consultados antes` : ""}`,
        ...consultas.map((c) => `- **${c.rota}:** ${c.consultados} consultados; ${c.com_palavras} com palavras-chave, ${c.sem_palavras_na_fonte} sem na fonte` +
            (c.nao_encontrados.length ? `; ${c.nao_encontrados.length} não encontrados` : "") +
            (c.falhas.length ? `; ⚠️ ${c.falhas.length} falha(s): ${c.falhas.slice(0, 3).join(" | ")}` : "")),
        ...Object.entries(semRota).map(([m, n]) => `- **Sem consulta (${n}):** ${m}`),
        `- **Gravado:** ${PALAVRAS_CHAVE_COMPLETADAS} e ${RELATORIO_PALAVRAS_CHAVE}. O dataset.json e os totais não mudam; a camada por palavras (batch_keyword_screen) lê esse arquivo.`,
    ].join("\n");
    return { relatorio, resumo };
}
