/**
 * Screen PDFs for olfactory characteristics of fermented products.
 * 
 * This script reads all PDFs in the caju_beverages project,
 * extracts text, and searches for keywords related to:
 * - Olfactory / aroma / sensory analysis
 * - Fermentation processes
 * - Volatile compounds
 */

import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";

const PDF_DIR = path.resolve(
    import.meta.dirname,
    "../../projects/data_mining/caju_beverages/03_screening/pdfs"
);

// Keywords related to negative descriptors / off-flavors
const NEGATIVE_KEYWORDS = [
    "borracha", "acetona", "estragado", "estragar", "rançoso", "ranço",
    "desagradável", "desagradavel", "caju maduro", "sobremaduro",
    "passado", "off-flavor", "off flavor", "férreo", "metálico",
    "azedo", "acético", "vinagre", "solvente", "sulfuroso"
];

interface PdfResult {
    filename: string;
    matchedKeywords: string[];
    relevantExcerpts: string[];
    isRelevant: boolean;
}

async function screenPdf(filePath: string): Promise<PdfResult> {
    const filename = path.basename(filePath);
    try {
        const buffer = fs.readFileSync(filePath);
        const data = await pdfParse(buffer);
        const text = data.text.toLowerCase();

        const matchedKeywords: string[] = [];
        const relevantExcerpts: string[] = [];

        for (const keyword of NEGATIVE_KEYWORDS) {
            const kw = keyword.toLowerCase();
            if (text.includes(kw)) {
                matchedKeywords.push(keyword);

                // Extract a short excerpt around the keyword
                let idx = -1;
                while ((idx = text.indexOf(kw, idx + 1)) !== -1) {
                    const start = Math.max(0, idx - 150);
                    const end = Math.min(text.length, idx + kw.length + 150);
                    const excerpt = text.substring(start, end).replace(/\s+/g, " ").trim();
                    if (relevantExcerpts.length < 5) { // get up to 5 excerpts
                        relevantExcerpts.push(`...${excerpt}...`);
                    }
                }
            }
        }

        // Consider relevant if it matches any negative descriptor
        const isRelevant = matchedKeywords.length > 0;

        return {
            filename,
            matchedKeywords: [...new Set(matchedKeywords)],
            relevantExcerpts,
            isRelevant: isRelevant,
        };
    } catch (err: any) {
        return {
            filename,
            matchedKeywords: [],
            relevantExcerpts: [`ERRO ao ler PDF: ${err.message}`],
            isRelevant: false,
        };
    }
}

async function main() {
    console.log("=".repeat(80));
    console.log("TRIAGEM FINA: Aromas Desagradáveis (Borracha, Acetona, etc)");
    console.log("=".repeat(80));

    if (!fs.existsSync(PDF_DIR)) {
        console.error(`Diretório não encontrado: ${PDF_DIR}`);
        process.exit(1);
    }

    const pdfFiles = fs.readdirSync(PDF_DIR).filter(f => f.toLowerCase().endsWith(".pdf"));
    console.log(`\nEncontrados ${pdfFiles.length} PDFs para analisar.\n`);

    const results: PdfResult[] = [];

    for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];
        console.log(`[${i + 1}/${pdfFiles.length}] Processando: ${file.substring(0, 70)}...`);
        const result = await screenPdf(path.join(PDF_DIR, file));
        results.push(result);
    }

    // Separate relevant from non-relevant
    const relevant = results.filter(r => r.isRelevant);
    const notRelevant = results.filter(r => !r.isRelevant);

    console.log("\n" + "=".repeat(80));
    console.log(`\n✅ RELEVANTES (Aromas off-flavor/desagradáveis encontrados): ${relevant.length} artigo(s)\n`);

    for (const r of relevant) {
        console.log(`  📄 ${r.filename}`);
        console.log(`     Keywords: ${r.matchedKeywords.join(", ")}`);
        for (const ex of r.relevantExcerpts) {
            console.log(`     Trecho: ${ex}`);
        }
        console.log();
    }

    console.log("─".repeat(80));
    console.log(`\n❌ NÃO MENCIONAM (sem descritores negativos): ${notRelevant.length} artigo(s)\n`);

    for (const r of notRelevant) {
        const kws = r.matchedKeywords.length > 0
            ? `Keywords parciais: ${r.matchedKeywords.slice(0, 5).join(", ")}`
            : "Nenhuma keyword encontrada";
        console.log(`  ⬚ ${r.filename.substring(0, 70)}...`);
        console.log(`     ${kws}`);
    }

    console.log("\n" + "=".repeat(80));
    console.log(`RESUMO: ${relevant.length}/${results.length} artigos abordam compostos de odor ruim/off-flavor.`);
    console.log("=".repeat(80));
}

main().catch(console.error);
