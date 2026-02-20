import fs from 'fs';
import path from 'path';
import { ScreeningService } from '../../../prismaid/mcp-repos-br/src/services/screen.js';

const projDir = "c:\\Users\\Vicente\\prismaid\\projects\\caju_beverages";

async function main() {
    try {
        const inPath = path.join(projDir, '02_deduplicated', 'dataset_snowball.json');

        if (!fs.existsSync(inPath)) {
            console.error(`Input dataset not found: ${inPath}`);
            return;
        }

        const data = JSON.parse(fs.readFileSync(inPath, 'utf8'));
        const candidates = data.unique || [];

        if (candidates.length === 0) {
            console.log("No candidates to screen.");
            return;
        }

        console.log(`Loading AI Screener for ${candidates.length} snowball candidates...`);
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            console.error("No GOOGLE_API_KEY found.");
            return;
        }

        const criteria = "O artigo deve tratar EXCLUSIVAMENTE de bebidas feitas a partir do CAJU (Anacardium occidentale) - alcoólicas ou não alcoólicas (suco, vinho, fermentado, néctar, cajuína). Excluir artigos focados em agropecuária animal, madeira, ração para frango/animais, propriedades da folha/tronco sem relação com a bebida, ou apenas sobre a castanha/amêndoa sem relação com a produção de leite/bebida de castanha.";

        const screener = new ScreeningService(apiKey);
        console.log("Running AI Screening... This will take a few minutes.");
        const screenResult = await screener.screenCandidates(candidates, criteria);

        const outDir = path.join(projDir, '03_screening');
        fs.writeFileSync(path.join(outDir, 'snowball_included.json'), JSON.stringify(screenResult.included, null, 2));
        fs.writeFileSync(path.join(outDir, 'snowball_excluded.json'), JSON.stringify(screenResult.excluded, null, 2));

        console.log(`\nSnowball Screening F4.b complete.`);
        console.log(`Included Candidates: ${screenResult.included.length}`);
        console.log(`Excluded Candidates: ${screenResult.excluded.length}`);

        // Update PRISMA Log
        const csvPath = path.join(projDir, 'logs', 'search_log_prisma_s.csv');
        const date = new Date().toISOString().split('T')[0];
        const logLine = `${date},Screening Phase (F4b),AI Gemini,"criteria: caju beverages",${screenResult.included.length},0\n`;
        fs.appendFileSync(csvPath, logLine);

        console.log("Successfully saved results to snowball_included.json and snowball_excluded.json");

    } catch (e) {
        console.error("Error during Snowball Screening F4.b:");
        console.error(e);
    }
}

main();
