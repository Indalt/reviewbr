import * as dotenv from "dotenv";
dotenv.config();

import { DatabaseService } from './src/services/database.js';
import { ScreeningService, ScreeningConfig } from './src/services/screen.js';

async function run() {
    const db = new DatabaseService();
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("Missing GOOGLE_API_KEY environment variable. Check your .env file.");
        process.exit(1);
    }

    const screeningService = new ScreeningService(apiKey);
    const projectId = 1;

    console.log('--- Fetching from SQLite ---');
    const records: any[] = await new Promise((resolve, reject) => {
        db['db'].all('SELECT * FROM records WHERE project_id = ? AND identifier IS NOT NULL AND (stage = "raw" OR stage IS NULL)', [projectId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });

    console.log(`Total valid DB Rows to screen: ${records.length}`);
    if (records.length === 0) {
        console.log("No raw records left to screen.");
        return;
    }

    const config: ScreeningConfig = {
        criteria: `Tema: Inteligência Artificial na Ciência.
Critérios de INCLUSÃO:
- Trata do uso de IA (GenAI, ML, LLMs) no método científico, descoberta científica, redação acadêmica ou revisão por pares.
- Foco em pesquisadores, cientistas ou universidades.
Critérios de EXCLUSÃO:
- Aplicações clínicas de IA apenas (ex: diagnosticar raio-X), sem focar no método de pesquisa científica.
- IA apenas técnica corporativa/desenvolvimento de software puro.`,
        cotJustification: true
    };

    console.log('--- Starting Native AI Screening ---');

    let processedCount = 0;
    const concurrency = 10; // Batch limit for Gemini

    // Test logic: only screen the first 50 to avoid consuming a lot of time in the test
    const recordsToScreen = records; // Screen all 1104

    for (let i = 0; i < recordsToScreen.length; i += concurrency) {
        const chunk = recordsToScreen.slice(i, i + concurrency);

        // Map to SearchResult for the service
        const candidates = chunk.map(r => ({
            identifier: r.identifier || '',
            title: r.title || '',
            description: r.description || '',
            creators: r.creators ? JSON.parse(r.creators) : [],
            date: r.date || '',
            url: r.url || '',
            doi: r.doi || '',
            repositoryName: r.source || '',
            repositoryId: '',
            type: '',
            accessMethod: '',
            subjectAreas: r.keywords ? r.keywords.split(';') : []
        }));

        console.log(`Screening batch ${i / concurrency + 1}/${Math.ceil(recordsToScreen.length / concurrency)}...`);
        const res = await screeningService.screenCandidates(candidates, config);

        // Match results back to DB ID and update database
        for (const included of res.included) {
            const originalRecord = chunk.find(r => r.identifier === included.record.identifier && r.title === included.record.title);
            if (originalRecord) {
                await db.updateScreening(originalRecord.id, included.decision, included.reasoning);
            }
        }
        for (const excluded of res.excluded) {
            const originalRecord = chunk.find(r => r.identifier === excluded.record.identifier && r.title === excluded.record.title);
            if (originalRecord) {
                await db.updateScreening(originalRecord.id, excluded.decision, excluded.reasoning);
            }
        }

        processedCount += chunk.length;
        console.log(`Progress: ${processedCount}/${recordsToScreen.length} screened. Included in this batch: ${res.included.length}. Errors: ${res.errors.length}`);
    }

    console.log("\nScreening phase completed safely and saved to DataBase.");
}

run().catch(console.error);
