import { DatabaseService } from './src/services/database.js';
import { DataService } from './src/services/data.js';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
    const db = new DatabaseService();
    const dataService = new DataService();
    const projectId = 1;

    console.log('--- Fetching from SQLite ---');
    const records: any[] = await new Promise((resolve, reject) => {
        db['db'].all('SELECT * FROM records WHERE project_id = ? AND identifier IS NOT NULL', [projectId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });

    console.log(`Total valid DB Rows: ${records.length}`);

    // Map to SearchResult format expected by DataService
    const searchResults = records.filter(r => r).map(r => ({
        identifier: r.identifier || '',
        title: r.title || '',
        description: r.description || '',
        creators: r.creators ? r.creators.split(';') : [],
        date: r.date || '',
        url: r.url || '',
        doi: r.doi || '',
        repositoryName: r.source || '',
        repositoryId: '',
        type: '',
        accessMethod: '',
        subjectAreas: r.keywords ? r.keywords.split(';') : []
    }));

    console.log('--- Exporting to ASReview Format ---');
    if (searchResults.length > 0) {
        const csvContent = dataService.exportDataset(searchResults, "asreview");

        // Write to the screening folder
        const exportPath = path.join(process.cwd(), 'projects/vicente/ai_in_science/03_screening', 'asreview_dataset.csv');
        fs.writeFileSync(exportPath, csvContent, 'utf-8');

        console.log(`\nSuccess! ASReview-ready CSV generated at: ${exportPath}`);
        console.log('Ready for the researcher to import into ASReview LAB.');
    } else {
        console.log("No records found to export.");
    }
}

run().catch(console.error);
