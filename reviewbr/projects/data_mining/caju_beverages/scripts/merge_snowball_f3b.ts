import fs from 'fs';
import path from 'path';

const projDir = "c:\\Users\\Vicente\\prismaid\\projects\\caju_beverages";
const mainDatasetPath = path.join(projDir, '02_deduplicated', 'dataset.json');
const snowballRawPath = path.join(projDir, '01_raw', 'dataset_snowball_raw.json');
const snowballMergedPath = path.join(projDir, '02_deduplicated', 'dataset_snowball.json');

function normalize(str: string) {
    if (!str) return "";
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function main() {
    if (!fs.existsSync(mainDatasetPath) || !fs.existsSync(snowballRawPath)) {
        console.error("Required datasets not found.");
        return;
    }

    // 1. Load existing main dataset to prevent re-screening
    const mainData = JSON.parse(fs.readFileSync(mainDatasetPath, 'utf8'));
    const mainRecords = Array.isArray(mainData) ? mainData : (mainData.unique || mainData.records || []);
    const knownTitles = new Set(mainRecords.map((r: any) => normalize(r.title)));

    // 2. Load the newly retrieved Snowball candidates
    const snowballData = JSON.parse(fs.readFileSync(snowballRawPath, 'utf8'));
    const snowballRecords = Array.isArray(snowballData) ? snowballData : (snowballData.unique || snowballData.records || []);

    // 3. Filter and Format
    const uniqueSnowballs = [];
    const localTitles = new Set<string>();

    for (const record of snowballRecords) {
        const titleKey = normalize(record.title);

        // Skip if we already screened it in the main flow, or if it's a duplicate within the snowball set itself
        if (knownTitles.has(titleKey) || localTitles.has(titleKey)) continue;

        localTitles.add(titleKey);

        // Ensure it has an abstract (description) for the AI to screen
        if (!record.description || record.description.trim().length < 50) {
            console.log(`Skipping ${record.title.substring(0, 30)}... (No abstract found in OpenAlex)`);
            continue;
        }

        uniqueSnowballs.push(record);
    }

    // 4. Save the cleanly formatted snowball dataset
    fs.writeFileSync(snowballMergedPath, JSON.stringify({ unique: uniqueSnowballs }, null, 2));

    console.log(`\nF3.b Merge Complete.`);
    console.log(`Original Snowball Retrieves: ${snowballRecords.length}`);
    console.log(`Unique, Screenable Candidates (Abstract present, not in main flow): ${uniqueSnowballs.length}`);
    console.log(`Saved to: ${snowballMergedPath}`);
}

main();
