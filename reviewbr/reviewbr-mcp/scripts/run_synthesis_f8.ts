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
const protocolPath = path.join(projDir, 'protocol.md');
const flowPath = path.join(projDir, 'prisma_flow.json');
const extractionPath = path.join(projDir, '04_extraction', 'study_characteristics_table.csv');
const outDir = path.join(projDir, '05_synthesis');

async function generateManuscript(protocol: string, flow: string, data: string) {
    console.log("Synthesizing PRISMA 2020 Manuscript with Gemini...");

    const prompt = `
You are an expert scientific researcher and synthesis agent. Your task is to write a formally structured PRISMA 2020 compliant Systematic Review Manuscript based on the provided Protocol, Flow Diagram counts, and Extracted Data.

MANDATORY STRUCTURE (Strictly follow these exact headings, no more, no less):
# Title
(Must be descriptive, ending with "A Systematic Review")

# Abstract
(Must be structured: Background, Methods, Results, Conclusions)

# 1. Introduction
(Rationale and Objectives based on the Protocol)

# 2. Methods
(Eligibility criteria, Information sources, Search strategy, Selection process, Data collection process. Mention the use of the PRISMA-compliant prismaid ecosystem and backward snowballing)

# 3. Results
## 3.1 Study Selection
(Cite the PRISMA Flow Diagram numbers provided below)
## 3.2 Study Characteristics
(Summarize the types of cashew beverages found, years of publication, and general methodologies based on the CSV)
## 3.3 Synthesis of Results 
(Synthesize the Key Findings from the CSV data. Group them logically, e.g., by beverage type such as juices, alcoholic beverages, fermented products, nutritional/functional properties)

# 4. Discussion
(Summary of evidence, implications for practice/industry, limitations of the review)

# 5. Conclusion
(Brief final takeaway)

--------------------------------------------------
CONTEXT MATERIALS:

1. PROTOCOL (F0/F1):
${protocol}

2. PRISMA FLOW DATA:
${flow}
(Note: 71 unique records screened, 47 included via title/abstract, 34 PDFs retrieved, yielding 30 final articles + 12 from Backward Snowballing = 42 total in synthesis)

3. EXTRACTED DATA (F5):
${data}

Write the manuscript in Portuguese, maintaining a highly academic, objective, and rigorously scientific tone. Use markdown formatting.
`;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Error generating manuscript:", error);
        return null;
    }
}

async function main() {
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    const protocol = fs.existsSync(protocolPath) ? fs.readFileSync(protocolPath, 'utf8') : "Protocol missing";
    const flow = fs.existsSync(flowPath) ? fs.readFileSync(flowPath, 'utf8') : "Flow data missing";
    let extraction = "Extraction data missing";
    if (fs.existsSync(extractionPath)) {
        // Read the CSV but limit size if it's too huge (not the case here, but safe practice)
        extraction = fs.readFileSync(extractionPath, 'utf8');
    }

    const manuscriptContent = await generateManuscript(protocol, flow, extraction);

    if (manuscriptContent) {
        const outPath = path.join(outDir, 'manuscript.md');
        fs.writeFileSync(outPath, manuscriptContent);
        console.log(`\nSynthesis F8 Complete!`);
        console.log(`Manuscript saved securely to: ${outPath}`);
    } else {
        console.log("Failed to generate manuscript.");
    }
}

main();
