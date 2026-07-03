/**
 * Sci-Hub Bridge (BYOS — Bring Your Own Script)
 *
 * Envolve o plugin privado `plugins/scihub_extractor.py` via subprocesso Python
 * (mesmo padrão do asreview_bridge). É OPT-IN e NUNCA automático: só é chamado
 * após "sim" explícito do pesquisador, quando o acesso aberto falhou.
 * A proveniência é registrada como "Sci-Hub (BYOS)" de forma SEPARÁVEL (transparência).
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import * as path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";
import pdfParse from "pdf-parse";

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

export class ScihubBridgeService {
    /** Recupera o full-text de um DOI via Sci-Hub e o arquiva localmente (PDF + texto + proveniência BYOS). */
    async retrieveByDoi(doi: string, projectPath: string): Promise<ByosResult> {
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
            const data = await pdfParse(fs.readFileSync(pdfPath));
            const textPath = path.join(textDir, `${safeDoi}.txt`);
            fs.writeFileSync(textPath, `[BYOS SCI-HUB EXTRACTED]\nDOI: ${doi}\n\n${data.text}`);
            fs.writeFileSync(path.join(textDir, `${safeDoi}.meta.json`), JSON.stringify({
                study_id: safeDoi,
                doi,
                fonte_repositorio: "Sci-Hub (BYOS)",
                url_hospedagem: `https://doi.org/${doi}`,
                acquisition: "BYOS",
            }, null, 2));
            return { success: true, pdfPath, textPath, log };
        } catch (e: any) {
            // PDF arquivado, mas extração de texto falhou — sucesso parcial
            return { success: true, pdfPath, error: `PDF salvo, mas extração de texto falhou: ${e?.message}`, log };
        }
    }
}
