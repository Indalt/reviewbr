import { execSync } from 'child_process';
import fs from 'fs';

const query = '"Anacardium occidentale" AND (bebida OR bebidas OR suco OR néctar OR vinho OR fermentado OR cajuína OR "cajuina")';
const cmd = `npx tsx src/scripts/run_search_cli.ts --query '${query}' --ids BR-AGG-0001,BR-AGG-0002,BR-AGG-0003,BR-AGG-0004,BR-AGG-0005,BR-RES-0002 --max 50`;

console.log("Running:", cmd);
try {
    const stdout = execSync(cmd, { cwd: 'c:\\\\Users\\\\Vicente\\\\prismaid\\\\prismaid\\\\mcp-repos-br', encoding: 'utf-8', maxBuffer: 1024 * 1024 * 50 });

    // Extract JSON
    const startIdx = stdout.indexOf('__JSON_START__') + '__JSON_START__'.length;
    const endIdx = stdout.indexOf('__JSON_END__');
    if (startIdx > '__JSON_START__'.length - 1 && endIdx > -1) {
        const jsonStr = stdout.substring(startIdx, endIdx).trim();
        const data = JSON.parse(jsonStr);

        fs.writeFileSync('c:\\\\Users\\\\Vicente\\\\prismaid\\\\projects\\\\caju_beverages\\\\01_raw\\\\search_tier_1_raw.json', JSON.stringify(data, null, 2));

        const date = new Date().toISOString().split('T')[0];
        const logLine = `${date},Hubs Estrategicos,N/A,"${query.replace(/"/g, '""')}",${data.stats.total},${data.stats.errors.length}\\n`;
        fs.appendFileSync('c:\\\\Users\\\\Vicente\\\\prismaid\\\\projects\\\\caju_beverages\\\\logs\\\\search_log_prisma_s.csv', logLine);

        console.log("Success! Total hits:", data.stats.total);
    } else {
        console.error("Could not find JSON payload.");
    }
} catch (e) {
    console.error("Search failed.");
    console.error(e.stdout);
    console.error(e.stderr);
}
