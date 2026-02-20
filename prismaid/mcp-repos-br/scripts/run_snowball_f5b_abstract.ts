import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '..', 'prismaid', 'mcp-repos-br', '.env') });

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
    console.error("Critical: GOOGLE_API_KEY is not set.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const projDir = "c:\\Users\\Vicente\\prismaid\\projects\\caju_beverages";
const outDir = path.join(projDir, '04_extraction');
const snowballIncludedPath = path.join(projDir, '03_screening', 'snowball_included.json');

async function extractFromAbstract(record: any) {
    console.log(`Extracting: ${record.title.substring(0, 50)}...`);

    const prompt = `
You are an expert scientific data extractor. You are analyzing the abstract of an article about cashew beverages.

FIELD DEFINITIONS:
- Authors: Primary authors (from metadata).
- Year: Year of publication.
- Title: Academic title.
- Beverage Type: Specific type of cashew beverage mentioned (e.g., fermentado, suco, cajuína, nectár). Be specific. If none is explicitly named but 'cashew apple processing' is, infer the beverage if possible, otherwise write "Not Specified (General Processing)".
- Methodology: Brief description of what they did, based on the abstract (max 2 sentences).
- Key Findings: Significant results related to cashew beverages (max 3 sentences).

OUTPUT FORMAT (JSON ONLY):
{
  "authors": "string",
  "year": "string",
  "title": "string",
  "beverage_type": "string",
  "methodology": "string",
  "key_findings": "string"
}

METADATA:
Title: ${record.title}
Authors: ${Array.isArray(record.creators) ? record.creators.join(', ') : record.creators}
Year: ${record.date}

ABSTRACT:
${record.description}
`;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        const match = responseText.match(/\{[\s\S]*\}/);
        if (!match) return null;

        let jsonStr = match[0].trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error(`Error extracting:`, error);
        return null;
    }
}

function jsonToCsvRow(data: any): string {
    const escapeCsv = (str: any) => {
        if (!str) return '""';
        return `"${String(str).replace(/"/g, '""')}"`;
    };
    return [
        escapeCsv(data.authors),
        escapeCsv(data.year),
        escapeCsv(data.title),
        escapeCsv(data.beverage_type),
        escapeCsv(data.methodology),
        escapeCsv(data.key_findings)
    ].join(',');
}

async function main() {
    if (!fs.existsSync(snowballIncludedPath)) {
        console.error("snowball_included.json not found!");
        return;
    }

    const data = JSON.parse(fs.readFileSync(snowballIncludedPath, 'utf8'));

    const csvPath = path.join(outDir, 'study_characteristics_table.csv');
    let hasHeader = false;
    if (fs.existsSync(csvPath)) {
        const content = fs.readFileSync(csvPath, 'utf8');
        hasHeader = content.startsWith('Authors');
    }

    if (!hasHeader) {
        fs.writeFileSync(csvPath, "Authors,Year,Title,Beverage Type,Methodology,Key Findings\n");
    }

    let successCount = 0;
    for (const item of data) {
        const record = item.record;

        // Prevent double extraction (check if title already in CSV)
        const currentCsv = fs.readFileSync(csvPath, 'utf8');
        if (currentCsv.includes(record.title.replace(/"/g, '""'))) {
            console.log(`Skipping already extracted: ${record.title.substring(0, 30)}...`);
            continue;
        }

        const extData = await extractFromAbstract(record);
        if (extData) {
            fs.appendFileSync(csvPath, jsonToCsvRow(extData) + "\n");
            successCount++;
        }
        await new Promise(r => setTimeout(r, 1500)); // rate limit
    }

    console.log(`\nSnowball Extraction F5.b Complete!`);
    console.log(`Appended ${successCount} new items to study_characteristics_table.csv based on abstracts.`);
}

main();
