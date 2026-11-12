/**
 * Sci-Hub Bridge (BYOS — Bring Your Own Script)
 *
 * Envolve o plugin privado `plugins/scihub_extractor.py` via subprocesso Python.
 * É OPT-IN e NUNCA automático: só é chamado
 * após "sim" explícito do pesquisador, quando o acesso aberto falhou.
 * A proveniência é registrada como "Sci-Hub (BYOS)" de forma SEPARÁVEL (transparência).
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import * as path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";
import { extrairTextoComPaginas } from "./pdf_extractor.js";

const execAsync = promisify(exec);

export interface ByosResult {
    success: boolean;
    pdfPath?: string;
    textPath?: string;
    error?: string;
    log?: string;
}

function findPlugin(): string | null {
    const here = path.dirname(fileURLToPath(import.meta.url)); // dist/services
    const candidates = [
        path.resolve(here, "..", "..", "..", "..", "plugins", "scihub_extractor.py"), // raiz do repo
        path.join(process.cwd(), "plugins", "scihub_extractor.py"),
    ];
    for (const c of candidates) if (fs.existsSync(c)) return c;
    return null;
}

/** DOI comparável: minúsculas, sem o resolvedor (https://doi.org/) nem o prefixo "doi:". */
export function normalizarDoi(doi: unknown): string {
    return String(doi ?? "").trim().toLowerCase()
        .replace(/^https?:\/\/(dx\.)?doi\.org\//, "").replace(/^doi:\s*/, "").trim();
}

/** Lista de um arquivo JSON (array, ou o primeiro array sob as chaves que o funil aceita). `null` se não houver. */
function lerLista(file: string): any[] | null {
    if (!fs.existsSync(file)) return null;
    try {
        const parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
        if (Array.isArray(parsed)) return parsed;
        for (const k of ["records", "included", "excluded", "items", "results", "data"]) {
            if (Array.isArray(parsed?.[k])) return parsed[k];
        }
        return null;
    } catch { return null; }
}

/**
 * DEBT-062 (com o DEBT-090, fundido nele) — as duas condições que a descrição do BYOS prometia
 * e nada conferia. Devolve o motivo da recusa, ou `null` quando o pedido pode seguir.
 *
 * 1. `consentimento`: a resposta do pesquisador, nas palavras dele. O código não tem como saber
 *    se um humano a deu; o que ele garante é que ninguém aciona o Sci-Hub sem declará-la, e que
 *    ela fica gravada (log e .meta.json) — o caso consentido passa a ser distinguível do outro.
 * 2. O DOI tem de constar em `03_screening/fulltext_not_retrieved.json`: o BYOS é só para o que
 *    o acesso aberto não recuperou, e esse arquivo é onde a triagem declara isso (F4.2.2).
 */
export function conferirPedidoByos(projectDir: string, doi: string, consentimento: unknown): string | null {
    if (typeof consentimento !== "string" || !consentimento.trim()) {
        return "BYOS recusado: falta 'consentimento' — a resposta do pesquisador autorizando o Sci-Hub para este DOI, " +
            "nas palavras dele. Pergunte a ele antes; nunca preencha por ele.";
    }
    const alvo = normalizarDoi(doi);
    if (!alvo) return "BYOS recusado: DOI vazio.";
    const lista = lerLista(path.join(projectDir, "03_screening", "fulltext_not_retrieved.json"));
    if (lista === null) {
        return "BYOS recusado: 03_screening/fulltext_not_retrieved.json não existe ou não tem lista. O BYOS só vale " +
            "para o que o acesso aberto não recuperou: registre o DOI ali, com o motivo (F4.2.2), antes.";
    }
    const consta = lista.some((item) => normalizarDoi(typeof item === "string" ? item : (item?.record ?? item)?.doi) === alvo);
    if (!consta) {
        return `BYOS recusado: ${doi} não está em 03_screening/fulltext_not_retrieved.json. O BYOS só vale para o que ` +
            "o acesso aberto não recuperou: tente retrieve_fulltexts/download_and_extract_pdfs e registre a falha ali antes.";
    }
    return null;
}

export class ScihubBridgeService {
    /** Recupera o full-text de um DOI via Sci-Hub e o arquiva localmente (PDF + texto + proveniência BYOS).
     *  `consentimento` (DEBT-062) vai para o .meta.json, ao lado da proveniência. */
    async retrieveByDoi(doi: string, projectPath: string, consentimento?: string): Promise<ByosResult> {
        const script = findPlugin();
        if (!script) {
            return { success: false, error: "Plugin plugins/scihub_extractor.py não encontrado — BYOS indisponível." };
        }

        const base = path.isAbsolute(projectPath) ? projectPath : path.join(process.cwd(), projectPath);
        const pdfDir = path.join(base, "03_screening", "pdfs");
        const textDir = path.join(base, "04_extraction", "fulltext");
        fs.mkdirSync(pdfDir, { recursive: true });
        fs.mkdirSync(textDir, { recursive: true });

        let log = "";
        try {
            const { stdout } = await execAsync(`python "${script}" --doi "${doi}" --out "${pdfDir}"`, { timeout: 90000 });
            log = stdout;
        } catch (e: any) {
            return { success: false, error: `Falha no Sci-Hub (BYOS) para ${doi}: ${e?.stderr || e?.message || "erro"}`, log: e?.stdout };
        }

        const safeDoi = doi.replace(/[/:]/g, "_");
        const pdfPath = path.join(pdfDir, `${safeDoi}.pdf`);
        if (!fs.existsSync(pdfPath)) {
            return { success: false, error: `Sci-Hub não retornou PDF para ${doi}.`, log };
        }

        // Extrai texto para o corpus do RAG + sidecar de proveniência (fonte = Sci-Hub/BYOS, separável)
        try {
            const data = await extrairTextoComPaginas(fs.readFileSync(pdfPath)); // DEBT-031: texto com a página
            const textPath = path.join(textDir, `${safeDoi}.txt`);
            fs.writeFileSync(textPath, `[BYOS SCI-HUB EXTRACTED]\nDOI: ${doi}\n\n${data.texto}`);
            fs.writeFileSync(path.join(textDir, `${safeDoi}.meta.json`), JSON.stringify({
                study_id: safeDoi,
                doi,
                fonte_repositorio: "Sci-Hub (BYOS)",
                url_hospedagem: `https://doi.org/${doi}`,
                acquisition: "BYOS",
                consentimento: consentimento ?? null,
            }, null, 2));
            return { success: true, pdfPath, textPath, log };
        } catch (e: any) {
            // PDF arquivado, mas extração de texto falhou — sucesso parcial
            return { success: true, pdfPath, error: `PDF salvo, mas extração de texto falhou: ${e?.message}`, log };
        }
    }
}
