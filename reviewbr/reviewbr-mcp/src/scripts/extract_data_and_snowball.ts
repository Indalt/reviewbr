import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projDir = "c:\\Users\\Vicente\\prismaid\\projects\\caju_beverages";
const pdfsDir = path.join(projDir, '03_screening', 'pdfs');
const outDir = path.join(projDir, '04_extraction');
const logDir = path.join(projDir, 'logs');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Manual .env loader
const envPath = path.join(__dirname, '..', '..', '.env');
console.log(`Checking for .env at: ${envPath}`);
if (fs.existsSync(envPath)) {
    const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of envLines) {
        const [key, val] = line.split('=');
        if (key && val) {
            process.env[key.trim()] = val.trim();
        }
    }
}

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
    console.error("GOOGLE_API_KEY not found in environment.");
    process.exit(1);
} else {
    console.log("GOOGLE_API_KEY loaded successfully (len: " + apiKey.length + ")");
}

const genAI = new GoogleGenerativeAI(apiKey);
// Using gemini-2.0-flash for consistency with screening service
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
- References: A clean list of citations found in the "References" or "Referências" section. LIMIT TO THE FIRST 50 REFERENCES to avoid truncation.

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

        // Surgical JSON isolation
        const match = responseText.match(/\{[\s\S]*\}/);
        if (!match) {
            console.warn(`No JSON found in response for ${filename}`);
            return null;
        }

        let jsonStr = match[0].trim();

        // Soft-repair logic for truncated JSON
        const repairJson = (str: string) => {
            let s = str;
            // 1. Check if we are inside a string (odd number of quotes at the end)
            // We only look at the last 100 chars to see if a quote is left open
            const lastPart = s.slice(-100);
            const quoteCount = (lastPart.match(/"/g) || []).length;
            if (quoteCount % 2 !== 0) s += '"';

            // 2. Check if we are inside an array
            const openBrackets = (s.match(/\[/g) || []).length;
            const closeBrackets = (s.match(/\]/g) || []).length;
            if (openBrackets > closeBrackets) {
                if (s.trim().endsWith(',')) s = s.trim().slice(0, -1);
                s += ']';
            }

            // 3. Check if we are inside an object
            const openBraces = (s.match(/\{/g) || []).length;
            const closeBraces = (s.match(/\}/g) || []).length;
            if (openBraces > closeBraces) {
                if (s.trim().endsWith(',')) s = s.trim().slice(0, -1);
                s += '}';
            }
            return s;
        };

        const repairedStr = repairJson(jsonStr);

        try {
            return JSON.parse(repairedStr);
        } catch (parseError) {
            console.warn(`Parse failed for ${filename}, even after repair. Trying very aggressive slice...`);
            // Find the LAST closing brace that actually works
            let tempStr = repairedStr;
            while (tempStr.length > 0) {
                try {
                    return JSON.parse(tempStr);
                } catch (e) {
                    const lastBrace = tempStr.lastIndexOf('}');
                    if (lastBrace === -1) break;
                    tempStr = tempStr.substring(0, lastBrace);
                    tempStr = repairJson(tempStr);
                }
            }
            throw parseError;
        }
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
    const rawFiles = fs.readdirSync(pdfsDir).filter(f => f.endsWith('.txt'));

    // Deduplicate files by taking the one with underscores if both exist
    const seenFiles = new Set<string>();
    const files: string[] = [];
    for (const f of rawFiles) {
        const normalized = f.replace(/[_-]/g, '_');
        if (!seenFiles.has(normalized)) {
            seenFiles.add(normalized);
            files.push(f);
        }
    }

    console.log(`Found ${files.length} unique text files to process after deduplication.`);

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

main().catch(err => {
    console.error("Critical Failure in Main:", err);
    process.exit(1);
});
