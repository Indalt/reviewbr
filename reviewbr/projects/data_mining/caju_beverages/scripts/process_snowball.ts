import fs from 'fs';
import path from 'path';

const projDir = "c:\\Users\\Vicente\\prismaid\\projects\\caju_beverages";
const datasetPath = path.join(projDir, '02_deduplicated', 'dataset.json');
const rawCandidatesPath = path.join(projDir, 'logs', 'snowballing_candidates_raw.txt');
const extractionPath = path.join(projDir, '04_extraction', 'study_characteristics_table.csv');
const outCandidatesPath = path.join(projDir, 'logs', 'snowballing_candidates.csv');

function normalize(str: string) {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function main() {
    // 1. Deduplicate Extraction CSV
    if (fs.existsSync(extractionPath)) {
        const lines = fs.readFileSync(extractionPath, 'utf8').split('\n');
        const header = lines[0];
        const dataLines = lines.slice(1).filter(l => l.trim().length > 0);
        const uniqueData = new Map<string, string>();

        for (const line of dataLines) {
            const titleMatch = line.match(/"[^"]*","[^"]*",("[^"]*")/);
            if (titleMatch) {
                const titleKey = normalize(titleMatch[1]);
                if (!uniqueData.has(titleKey)) {
                    uniqueData.set(titleKey, line);
                }
            }
        }

        fs.writeFileSync(extractionPath, header + '\n' + Array.from(uniqueData.values()).join('\n') + '\n');
        console.log(`Deduplicated extraction table: ${uniqueData.size} articles.`);
    }

    // 2. Cross-reference Snowballing Candidates
    if (fs.existsSync(datasetPath) && fs.existsSync(rawCandidatesPath)) {
        const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
        const records = Array.isArray(dataset) ? dataset : (dataset.unique || dataset.records || []);
        const knownTitles = new Set(records.map((r: any) => normalize(r.title)));

        const rawCandidates = fs.readFileSync(rawCandidatesPath, 'utf8').split('\n');
        const uniqueNewCandidates = new Map<string, string>();

        for (const cand of rawCandidates) {
            const clean = cand.trim();
            if (clean.length < 10) continue;

            const norm = normalize(clean);
            if (!knownTitles.has(norm) && !uniqueNewCandidates.has(norm)) {
                // Filter out common Noise (e.g. "Google Scholar", "DSpace", etc if they slipped in)
                if (norm.includes('google') || norm.includes('sciencedirect')) continue;

                uniqueNewCandidates.set(norm, clean);
            }
        }

        const header = "Candidate Title/Citation\n";
        const rows = Array.from(uniqueNewCandidates.values()).map(c => `"${c.replace(/"/g, '""')}"`).join('\n');
        fs.writeFileSync(outCandidatesPath, header + rows + '\n');

        console.log(`Snowballing analysis: Identified ${uniqueNewCandidates.size} new potential candidates from bibliographies.`);
    }
}

main();
