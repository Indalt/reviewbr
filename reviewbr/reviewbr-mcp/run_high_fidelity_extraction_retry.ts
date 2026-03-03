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

    console.log('--- Retrying Failed High-Fidelity Extractions ---');
    const records: any[] = await new Promise((resolve, reject) => {
        // Fetch records that have fulltext but haven't been successfully extracted yet
        db['db'].all(
            'SELECT * FROM records WHERE project_id = ? AND stage = "fulltext_acquired"',
            [projectId],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            }
        );
    });

    console.log(`Total records to retry: ${records.length}`);
    if (records.length === 0) {
        console.log("No pending records found.");
        return;
    }

    const extractionCriteria = `Extraia os seguintes dados estruturados do texto científico fornecido:
1. **P (População/Contexto)**: Quem são os sujeitos ou qual o domínio científico?
2. **I (Intervenção/IA)**: Qual técnica de IA ou ferramenta foi utilizada?
3. **M (Metodologia)**: Como a IA foi integrada ao processo de pesquisa?
4. **O (Desfecho/Resultado)**: Qual foi o impacto na descoberta ou eficiência científica?
5. **Quality Score (0-10)**: Avalie o rigor metodológico do uso de IA.

IMPORTANTE: Responda APENAS com o objeto JSON. Não inclua conversas, introduções ou explicações.
Esquema:
{
  "population": "...",
  "intervention": "...",
  "methodology": "...",
  "outcome": "...",
  "quality_score": 0,
  "summary": "..."
}`;

    for (const record of records) {
        console.log(`\nRetrying: ${record.title}`);

        const extractionData = JSON.parse(record.extraction_data || "{}");
        const textPath = extractionData.fulltext_path;

        if (!textPath || !fs.existsSync(textPath)) {
            console.log(`  [SKIP] Text file not found.`);
            continue;
        }

        try {
            const chunkedText = await pdfService.smartChunk(textPath);
            const prompt = `${extractionCriteria}\n\nTexto do Artigo:\n${chunkedText}`;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            // Robust JSON extraction: look for the first { and last }
            const startIdx = responseText.indexOf('{');
            const endIdx = responseText.lastIndexOf('}');

            if (startIdx === -1 || endIdx === -1) {
                throw new Error("No JSON object found in response.");
            }

            const jsonStr = responseText.substring(startIdx, endIdx + 1);
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

            console.log(`  [SUCCESS] Data extracted.`);
        } catch (error: any) {
            console.error(`  [ERROR] Failed: ${error.message}`);
        }
    }

    console.log(`\n--- Retry Finished ---`);
}

run().catch(console.error);
