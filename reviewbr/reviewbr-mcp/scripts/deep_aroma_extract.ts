/**
 * Deep extraction: Read the most relevant PDFs about fermented cashew
 * and extract actual experimental findings about off-flavors/unpleasant aromas.
 * 
 * Focus: What do the experiments SAY about these aromas? 
 * What causes them? Any diagnostics or hypotheses?
 */

import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";

const PDF_DIR = path.resolve(
    import.meta.dirname,
    "../../projects/data_mining/caju_beverages/03_screening/pdfs"
);

// Target the PDFs most likely to have experimental findings on fermented cashew off-flavors
const TARGET_FILENAMES = [
    "441afd419b28a579724a7123cae5808d", // Fermentação alcoólica do suco de caju
    "bd79abacd709279e03cc6e6c2a73dbd8", // Desenvolvimento de uma bebida fermentada à base de
    "314767da999ae7ca39886fb7a836a296", // Estudo químico e tecnológico do caju
    "30ec96eece353dc45e1b9445cf1b8254", // Estudo cinético da fermentação de kefir e kombucha
    "231a484d995ddefa096eb7c2fbf806f9", // Avaliação sensorial e caracterização de cerveja
    "6f368b8a2a062636fc33aafcdfe01967", // Efeito do processamento sobre características
    "d382bdede3442d0974d4ebf10047eab2", // Processamento de suco de caju
    "988e31ac1a02682de181c8e8cb031007", // Caracterização e estudo da aplicabilidade do bio
    "21760",  // Aplicação de ferramentas de identificação molecular (off-flavor)
    "21042",  // Estudo de viabilidade técnica e econômica (sidra)
];

// Off-flavor related terms to search context around
const CONTEXT_TERMS = [
    "desagrad", "off-flavor", "off flavor", "defeito", "indesej",
    "borracha", "acetona", "estragad", "rançoso", "ranço",
    "azedo", "acético", "vinagre", "sulfuroso", "metálico",
    "adstringên", "adstringen", "amargo", "amargor",
    "diacetil", "acetaldeído", "ácido acético",
    "levedura", "brettanomyces", "brett",
    "oxidação", "oxidaç", "escurecimento",
    "volátil", "voláteis", "aroma", "sensorial",
    "caju maduro", "sobremaduro", "passado",
];

function extractContextWindows(text: string, terms: string[], windowSize: number = 400): string[] {
    const lower = text.toLowerCase();
    const windows: string[] = [];
    const usedPositions = new Set<number>();

    for (const term of terms) {
        let idx = -1;
        while ((idx = lower.indexOf(term.toLowerCase(), idx + 1)) !== -1) {
            // Avoid overlapping windows
            const bucket = Math.floor(idx / (windowSize / 2));
            if (usedPositions.has(bucket)) continue;
            usedPositions.add(bucket);

            const start = Math.max(0, idx - windowSize / 2);
            const end = Math.min(text.length, idx + term.length + windowSize / 2);
            const window = text.substring(start, end).replace(/\s+/g, " ").trim();
            windows.push(`[${term.toUpperCase()}]: ...${window}...`);

            if (windows.length >= 15) return windows;
        }
    }
    return windows;
}

async function main() {
    const pdfFiles = fs.readdirSync(PDF_DIR).filter(f => f.toLowerCase().endsWith(".pdf"));

    // Filter to target files
    const targets = pdfFiles.filter(f =>
        TARGET_FILENAMES.some(t => f.includes(t))
    );

    console.log(`\n${"=".repeat(80)}`);
    console.log("EXTRAÇÃO PROFUNDA: O que os experimentos dizem sobre aromas desagradáveis");
    console.log("em fermentados de caju?");
    console.log(`${"=".repeat(80)}\n`);
    console.log(`Alvos identificados: ${targets.length} PDFs\n`);

    for (const file of targets) {
        console.log(`\n${"─".repeat(80)}`);
        console.log(`📄 ${file.substring(0, 75)}`);
        console.log(`${"─".repeat(80)}`);

        try {
            const buffer = fs.readFileSync(path.join(PDF_DIR, file));
            const data = await pdfParse(buffer);
            const text = data.text;

            console.log(`   Páginas: ${data.numpages} | Caracteres: ${text.length}`);

            const windows = extractContextWindows(text, CONTEXT_TERMS);

            if (windows.length === 0) {
                console.log("   ⬚ Nenhum contexto relevante encontrado.");
            } else {
                console.log(`   ✅ ${windows.length} trechos relevantes:\n`);
                for (const w of windows) {
                    console.log(`   ${w}\n`);
                }
            }
        } catch (err: any) {
            console.log(`   ERRO: ${err.message}`);
        }
    }

    console.log(`\n${"=".repeat(80)}`);
    console.log("FIM DA EXTRAÇÃO");
    console.log(`${"=".repeat(80)}`);
}

main().catch(console.error);
