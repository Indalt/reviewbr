import * as dotenv from "dotenv";
dotenv.config();

import { DatabaseService } from './src/services/database.js';
import { PdfExtractorService } from './src/services/pdf_extractor.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from 'fs';
import * as path from 'path';

async function run() {
    const db = new DatabaseService();
    const pdfService = new PdfExtractorService();
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("Missing GOOGLE_API_KEY environment variable.");
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const projectId = 1;

    console.log('--- Fetching Records with Fulltext for High-Fidelity Extraction ---');
    const records: any[] = await new Promise((resolve, reject) => {
        db['db'].all(
            'SELECT * FROM records WHERE project_id = ? AND stage = "fulltext_acquired"',
            [projectId],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            }
        );
    });

    console.log(`Total records to extract: ${records.length}`);
    if (records.length === 0) {
        console.log("No records found with fulltext acquired.");
        return;
    }

    const extractionCriteria = `Extraia os seguintes dados estruturados do texto científico fornecido:
1. **P (População/Contexto)**: Quem são os sujeitos ou qual o domínio científico?
2. **I (Intervenção/IA)**: Qual técnica de IA ou ferramenta foi utilizada?
3. **M (Metodologia)**: Como a IA foi integrada ao processo de pesquisa?
4. **O (Desfecho/Resultado)**: Qual foi o impacto na descoberta ou eficiência científica?
5. **Quality Score (0-10)**: Avalie o rigor metodológico do uso de IA.

Responda APENAS em formato JSON puro, seguindo este esquema:
{
  "population": "...",
  "intervention": "...",
  "methodology": "...",
  "outcome": "...",
  "quality_score": 0,
  "summary": "..."
}`;

    let count = 0;

    for (const record of records) {
        count++;
        console.log(`\n[${count}/${records.length}] Extracting from: ${record.title}`);

        const extractionData = JSON.parse(record.extraction_data || "{}");
        const textPath = extractionData.fulltext_path;

        if (!textPath || !fs.existsSync(textPath)) {
            console.log(`  [SKIP] Text file not found at: ${textPath}`);
            continue;
        }

        try {
            // Smart Chunking to avoid token limit errors and save cost
            const chunkedText = await pdfService.smartChunk(textPath);

            const prompt = `Critérios de Extração:\n${extractionCriteria}\n\nTexto do Artigo:\n${chunkedText}`;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            // Clean JSON
            const jsonStr = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
            const parsed = JSON.parse(jsonStr);

            // Update database
            extractionData.pico_extracted = parsed;

            await new Promise<void>((resolve, reject) => {
                db['db'].run(
                    'UPDATE records SET extraction_data = ?, stage = "extracted" WHERE id = ?',
                    [JSON.stringify(extractionData), record.id],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            console.log(`  [SUCCESS] Data extracted and saved.`);
        } catch (error: any) {
            console.error(`  [ERROR] Failed to extract from ID ${record.id}: ${error.message}`);
        }
    }

    console.log(`\n--- High-Fidelity Extraction Finished ---`);
}

run().catch(console.error);
