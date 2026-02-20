import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projDir = path.resolve(__dirname, '..');
const pdfsDir = path.join(projDir, '03_screening', 'pdfs');
const outDir = path.join(projDir, '04_extraction');
const logDir = path.join(projDir, 'logs');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
    console.error("GOOGLE_API_KEY not found in environment.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
// Using 1.5-pro for better extraction from long text
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

async function extractFromText(text: string, filename: string) {
    console.log(`Processing ${filename}...`);

    // Limits: If text is extremely large, we take the beginning (metadata/intro) and end (references)
    // However, for typical theses/articles (100-300kb), 1.5-pro handles it easily.
    const prompt = `
You are an expert scientific data extractor. You are analyzing a full-text article/thesis about cashew beverages.

FIELD DEFINITIONS:
- Authors: Primary authors of the study.
- Year: Year of publication/defense.
- Title: Academic title of the work.
- Beverage Type: Specific type of cashew beverage (e.g., fermented juice, cajuína, wine, beer, nectar, probiotic drink).
- Methodology: Brief description of the methods (max 2 sentences).
- Key Findings: Significant results related to cashew beverages (max 3 sentences).
- References: A clean list of citations found in the "References" or "Referências" section.

TASK:
1. Extract the data fields.
2. Extract ALL citations/references from the bibliography section.

OUTPUT FORMAT (JSON ONLY):
{
  "authors": "string",
  "year": "string",
  "title": "string",
  "beverage_type": "string",
  "methodology": "string",
  "key_findings": "string",
  "references": ["string", "string", ...]
}

TEXT CONTENT:
${text}
`;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const jsonStr = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error(`Error processing ${filename}:`, error);
        return null;
    }
}

function jsonToCsvRow(data: any) {
    const fields = [
        data.authors,
        data.year,
        data.title,
        data.beverage_type,
        data.methodology,
        data.key_findings
    ];
    return fields.map(f => `"${String(f || "").replace(/"/g, '""')}"`).join(",");
}

async function main() {
    const files = fs.readdirSync(pdfsDir).filter(f => f.endsWith('.txt'));
    console.log(`Found ${files.length} text files to process.`);

    const csvHeader = "Authors,Year,Title,Beverage Type,Methodology,Key Findings\n";
    fs.writeFileSync(path.join(outDir, 'study_characteristics_table.csv'), csvHeader);

    const allSnowballCandidates: string[] = [];

    // Process in sequence to avoid rate limits and OOM
    for (const file of files) {
        const filePath = path.join(pdfsDir, file);
        const text = fs.readFileSync(filePath, 'utf8');

        // Safety truncation if > 1MB (unlikely for text, but good practice)
        let processedText = text;
        if (text.length > 800000) {
            console.warn(`File ${file} is very large (${text.length} chars). Truncating to intro + references.`);
            processedText = text.substring(0, 400000) + "\n[...]\n" + text.substring(text.length - 400000);
        }

        const data = await extractFromText(processedText, file);
        if (data) {
            // Write to CSV
            fs.appendFileSync(path.join(outDir, 'study_characteristics_table.csv'), jsonToCsvRow(data) + "\n");

            // Add raw references to snowball list
            if (data.references && Array.isArray(data.references)) {
                allSnowballCandidates.push(...data.references);
            }
        }

        // Small delay to respect rate limits
        await new Promise(r => setTimeout(r, 2000));
    }

    // Save snowballing results
    const snowballPath = path.join(logDir, 'snowballing_candidates_raw.txt');
    fs.writeFileSync(snowballPath, allSnowballCandidates.join("\n"));

    console.log(`Extraction complete. Created study_characteristics_table.csv and snowballing_candidates_raw.txt`);
}

main();
