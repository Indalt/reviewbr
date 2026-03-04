/**
 * Focused extraction: ONLY fermented cashew beverages.
 * 
 * Step 1: Read all PDF titles, filter only those about caju/cashew fermentation
 * Step 2: Extract full sensory/quality findings from those PDFs
 */

import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";

const PDF_DIR = path.resolve(
    import.meta.dirname,
    "../../projects/data_mining/caju_beverages/03_screening/pdfs"
);

// Caju-fermentation filter: title must contain caju AND fermentation-related terms
function isCajuFermentationPdf(filename: string): boolean {
    const lower = filename.toLowerCase();
    const hasCaju = lower.includes("caju") || lower.includes("anacardium") || lower.includes("cashew") || lower.includes("cajuina");
    const hasFermentation = lower.includes("ferment") || lower.includes("bebida")
        || lower.includes("cervej") || lower.includes("vin")
        || lower.includes("alcol") || lower.includes("kefir") || lower.includes("kombu");
    return hasCaju && hasFermentation;
}

// Broader: any PDF about caju that might discuss sensory properties
function isCajuSensoryPdf(filename: string): boolean {
    const lower = filename.toLowerCase();
    const hasCaju = lower.includes("caju") || lower.includes("anacardium");
    const hasSensory = lower.includes("sensorial") || lower.includes("caracter")
        || lower.includes("elabora") || lower.includes("qu_mico")
        || lower.includes("processamento") || lower.includes("estudo");
    return hasCaju && hasSensory;
}

// Terms to extract context about
const SCIENCE_TERMS = [
    // Sensory descriptors
    "sensorial", "análise sensorial", "avaliação sensorial", "painel", "provador",
    "aroma", "odor", "sabor", "gosto", "flavor", "off-flavor",
    "adstringên", "adstringen", "amargo", "amargor", "doce", "ácido", "azedo",
    "desagrad", "indesej", "defeito",
    // Chemical compounds driving aroma/flavor
    "volátil", "voláteis", "éster", "aldeído", "acetaldeído", "diacetil",
    "ácido acético", "etanol", "álcool", "tanino", "polifenol", "fenólico",
    "terpeno", "acetona", "furfural",
    // Fermentation parameters 
    "levedura", "saccharomyces", "brix", "pH", "acidez", "atenuação",
    "temperatura de fermentação", "tempo de fermentação", "maturação",
    // Quality conclusions
    "aceitação", "aceitabilidade", "rejeição", "qualidade", "aprovação",
    "escala hedônica", "hedônica", "intenção de compra",
];

function extractRichContext(text: string, terms: string[], windowSize: number = 500): string[] {
    const lower = text.toLowerCase();
    const windows: string[] = [];
    const usedRanges: number[] = [];

    for (const term of terms) {
        let idx = -1;
        while ((idx = lower.indexOf(term.toLowerCase(), idx + 1)) !== -1) {
            // Skip if too close to an already-extracted window
            if (usedRanges.some(r => Math.abs(r - idx) < windowSize * 0.6)) continue;
            usedRanges.push(idx);

            const start = Math.max(0, idx - windowSize / 2);
            const end = Math.min(text.length, idx + term.length + windowSize / 2);
            const window = text.substring(start, end).replace(/\s+/g, " ").trim();
            windows.push(`[${term.toUpperCase()}] ...${window}...`);

            if (windows.length >= 20) return windows;
        }
    }
    return windows;
}

async function main() {
    console.log("=".repeat(80));
    console.log("EXTRAÇÃO FOCADA: O que a ciência diz sobre FERMENTADOS DE CAJU");
    console.log("(Excluindo achados sobre cerveja, vinho de uva e outras bebidas)");
    console.log("=".repeat(80));

    const allFiles = fs.readdirSync(PDF_DIR).filter(f => f.endsWith(".pdf"));

    // Filter: only caju fermentation PDFs
    const cajuFerment = allFiles.filter(f => isCajuFermentationPdf(f));
    const cajuSensory = allFiles.filter(f => isCajuSensoryPdf(f) && !cajuFerment.includes(f));
    const targets = [...new Set([...cajuFerment, ...cajuSensory])];

    console.log(`\nTotal PDFs no acervo: ${allFiles.length}`);
    console.log(`PDFs sobre FERMENTADO de caju: ${cajuFerment.length}`);
    console.log(`PDFs sobre caju + propriedades sensoriais: ${cajuSensory.length}`);
    console.log(`Total de alvos: ${targets.length}\n`);

    console.log("Alvos selecionados:");
    for (const t of targets) {
        console.log(`  📄 ${t.substring(0, 80)}`);
    }

    for (const file of targets) {
        console.log(`\n${"━".repeat(80)}`);
        console.log(`📄 ${file}`);
        console.log(`${"━".repeat(80)}`);

        try {
            const buffer = fs.readFileSync(path.join(PDF_DIR, file));
            const data = await pdfParse(buffer);
            const text = data.text;

            console.log(`   Páginas: ${data.numpages} | Caracteres: ${text.length}`);

            const windows = extractRichContext(text, SCIENCE_TERMS);

            if (windows.length === 0) {
                console.log("   ⬚ Nenhum trecho relevante sobre sensorial/qualidade.");
            } else {
                console.log(`\n   ${windows.length} trechos extraídos:\n`);
                for (let i = 0; i < windows.length; i++) {
                    console.log(`   [${i + 1}] ${windows[i]}\n`);
                }
            }
        } catch (err: any) {
            console.log(`   ERRO: ${err.message}`);
        }
    }

    console.log(`\n${"=".repeat(80)}`);
    console.log("FIM DA EXTRAÇÃO FOCADA");
    console.log(`${"=".repeat(80)}`);
}

main().catch(console.error);
