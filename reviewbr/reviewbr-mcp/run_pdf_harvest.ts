import * as dotenv from "dotenv";
dotenv.config();

import { DatabaseService } from './src/services/database.js';
import { PdfExtractorService } from './src/services/pdf_extractor.js';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
    const db = new DatabaseService();
    const pdfService = new PdfExtractorService();
    const projectId = 1;
    const projectPath = 'projects/vicente/ai_in_science';

    console.log('--- Fetching Candidates for Full-Text Harvesting ---');
    const records: any[] = await new Promise((resolve, reject) => {
        // Select articles marked as YES or MAYBE
        db['db'].all(
            'SELECT * FROM records WHERE project_id = ? AND (screening_decision = "YES" OR screening_decision = "MAYBE")',
            [projectId],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            }
        );
    });

    console.log(`Total candidates to harvest: ${records.length}`);
    if (records.length === 0) {
        console.log("No candidates found to harvest full-text.");
        return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const record of records) {
        console.log(`\nProcessing [ID ${record.id}]: ${record.title}`);

        if (!record.url) {
            console.log(`  [SKIP] No URL found for this record.`);
            failCount++;
            continue;
        }

        // documentId is a sanitized version of the title or just the record ID
        const documentId = `record_${record.id}`;

        const result = await pdfService.downloadAndExtract(record.url, documentId, projectPath);

        if (result.success && result.textPath) {
            console.log(`  [SUCCESS] Extracted text saved to: ${result.textPath}`);

            // Update extraction_data with the text path
            const extractionData = record.extraction_data ? JSON.parse(record.extraction_data) : {};
            extractionData.fulltext_available = true;
            extractionData.fulltext_path = result.textPath;

            await new Promise<void>((resolve, reject) => {
                db['db'].run(
                    'UPDATE records SET extraction_data = ?, stage = "fulltext_acquired" WHERE id = ?',
                    [JSON.stringify(extractionData), record.id],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
            successCount++;
        } else {
            console.log(`  [FAIL] ${result.error || "Unknown error"}`);

            const extractionData = record.extraction_data ? JSON.parse(record.extraction_data) : {};
            extractionData.fulltext_available = false;
            extractionData.harvest_error = result.error;

            await new Promise<void>((resolve, reject) => {
                db['db'].run(
                    'UPDATE records SET extraction_data = ?, stage = "harvest_failed" WHERE id = ?',
                    [JSON.stringify(extractionData), record.id],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
            failCount++;
        }
    }

    console.log(`\n--- Harvesting Phase Finished ---`);
    console.log(`Total: ${records.length}`);
    console.log(`Success: ${successCount}`);
    console.log(`Fail: ${failCount}`);
}

run().catch(console.error);
