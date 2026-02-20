import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DeduplicationService } from '../../../prismaid/mcp-repos-br/src/services/dedupe.js';
import { ScreeningService } from '../../../prismaid/mcp-repos-br/src/services/screen.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projDir = path.resolve(__dirname, '..');

async function main() {
    try {
        console.log("Loading datasets...");
        const t1 = JSON.parse(fs.readFileSync(path.join(projDir, '01_raw', 'search_tier_1_raw.json'), 'utf8'));
        const t3 = JSON.parse(fs.readFileSync(path.join(projDir, '01_raw', 'search_tier_3_raw.json'), 'utf8'));

        const combined = [...t1.results, ...t3.results];
        console.log(`Total raw items: ${combined.length}`);

        console.log("Deduplicating...");
        const dedupe = new DeduplicationService();
        const dedupedResult = dedupe.deduplicate(combined);

        fs.writeFileSync(path.join(projDir, '02_deduplicated', 'dataset.json'), JSON.stringify(dedupedResult, null, 2));
        console.log(`Deduplicated dataset saved. Original: ${dedupedResult.stats.total} | Unique: ${dedupedResult.stats.unique} | Duplicates removed: ${dedupedResult.stats.duplicates}`);

        console.log("Loading AI Screener...");
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            console.error("No GOOGLE_API_KEY found. Halting before AI screening. Deduplication succeeded.");

            // Update PRISMA Log for dedupe only
            const csvPath = path.join(projDir, 'logs', 'search_log_prisma_s.csv');
            const date = new Date().toISOString().split('T')[0];
            const logLine = `${date},Deduplication Phase,All Sources,"Merge and Dedupe",${dedupedResult.stats.unique},0\\n`;
            fs.appendFileSync(csvPath, logLine);
            return;
        }

        const criteria = "O artigo deve tratar EXCLUSIVAMENTE de bebidas feitas a partir do CAJU (Anacardium occidentale) - alcoólicas ou não alcoólicas (suco, vinho, fermentado, néctar, cajuína). Excluir artigos focados em agropecuária animal, madeira, ração para frango/animais, propriedades da folha/tronco sem relação com a bebida, ou apenas sobre a castanha/amêndoa sem relação com a produção de leite/bebida de castanha.";

        const screener = new ScreeningService(apiKey);
        console.log("Running AI Screening on " + dedupedResult.unique.length + " candidates. This may take a while...");
        const screenResult = await screener.screenCandidates(dedupedResult.unique, criteria);

        fs.writeFileSync(path.join(projDir, '03_screening', 'included.json'), JSON.stringify(screenResult.included, null, 2));
        fs.writeFileSync(path.join(projDir, '03_screening', 'excluded.json'), JSON.stringify(screenResult.excluded, null, 2));

        console.log(`Screening complete. Included: ${screenResult.included.length} | Excluded: ${screenResult.excluded.length}`);

        // Update PRISMA Log
        const csvPath = path.join(projDir, 'logs', 'search_log_prisma_s.csv');
        const date = new Date().toISOString().split('T')[0];
        const logLine = `${date},Deduplication Phase,All Sources,"Merge and Dedupe",${dedupedResult.stats.unique},0\\n` +
            `${date},Screening Phase (F3),AI Gemini,"criteria: caju beverages",${screenResult.included.length},0\\n`;
        fs.appendFileSync(csvPath, logLine);

        console.log("Flow completed successfully.");

    } catch (e) {
        console.error("Error during Synthesis Phase F3:");
        console.error(e);
    }
}

main();
