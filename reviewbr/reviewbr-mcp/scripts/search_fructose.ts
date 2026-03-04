/**
 * Search PDFs specifically for: frutose, glicose, levedura (quantity/concentration),
 * and related fermentation defects.
 */

import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";

const PDF_DIR = path.resolve(
    import.meta.dirname,
    "../../projects/data_mining/caju_beverages/03_screening/pdfs"
);

const TERMS = [
    "frutose", "fructose", "glicose", "glucose",
    "razão glicose", "razão frutose", "relação glicose/frutose",
    "concentração de levedura", "inóculo", "inoculo", "população de levedura",
    "baixa concentração", "insuficien",
    "açúcar residual", "açúcares residuais", "açúcar remanescente",
    "fermentação incompleta", "fermentação lenta", "fermentação presa",
    "stuck fermentation",
    "fruta estragada", "passado", "estragad", "adulter",
    "álcool superior", "álcoois superiores", "fusel", "fuseis",
];

function extractWindows(text: string, windowSize: number = 500): string[] {
    const lower = text.toLowerCase();
    const windows: string[] = [];
    const used = new Set<number>();

    for (const term of TERMS) {
        let idx = -1;
        while ((idx = lower.indexOf(term.toLowerCase(), idx + 1)) !== -1) {
            const bucket = Math.floor(idx / (windowSize * 0.5));
            if (used.has(bucket)) continue;
            used.add(bucket);

            const start = Math.max(0, idx - windowSize / 2);
            const end = Math.min(text.length, idx + term.length + windowSize / 2);
            const w = text.substring(start, end).replace(/\s+/g, " ").trim();
            windows.push(`[${term.toUpperCase()}] ...${w}...`);
            if (windows.length >= 20) return windows;
        }
    }
    return windows;
}

async function main() {
    console.log("=".repeat(80));
    console.log("BUSCA: Frutose, Glicose, Concentração de Levedura e Defeitos");
    console.log("=".repeat(80));

    const files = fs.readdirSync(PDF_DIR).filter(f => f.endsWith(".pdf"));
    let totalHits = 0;

    for (const file of files) {
        try {
            const buf = fs.readFileSync(path.join(PDF_DIR, file));
            const data = await pdfParse(buf);
            const text = data.text;
            const windows = extractWindows(text);

            if (windows.length > 0) {
                totalHits++;
                console.log(`\n${"━".repeat(80)}`);
                console.log(`📄 ${file.substring(0, 75)}`);
                console.log(`   ${windows.length} trechos:\n`);
                for (const w of windows) {
                    console.log(`   ${w}\n`);
                }
            }
        } catch { }
    }

    console.log(`\n${"=".repeat(80)}`);
    console.log(`TOTAL: ${totalHits} PDFs com trechos relevantes sobre frutose/glicose/levedura`);
    console.log("=".repeat(80));
}

main().catch(console.error);
