const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const cmd = `npx tsx src/scripts/run_search_cli.ts --query "\\"Anacardium occidentale\\" AND (bebida OR bebidas OR suco OR néctar OR vinho OR fermentado OR cajuína OR \\"cajuina\\")" --ids BR-AGG-0001,BR-AGG-0002,BR-AGG-0003,BR-AGG-0004,BR-AGG-0005,BR-RES-0002 --max 50`;

console.log("Running search...");
const stdout = execSync(cmd, { cwd: 'c:\\Users\\Vicente\\prismaid\\prismaid\\reviewbr-mcp', encoding: 'utf-8', maxBuffer: 1024 * 1024 * 10 });

const startIdx = stdout.indexOf('__JSON_START__') + '__JSON_START__'.length;
const endIdx = stdout.indexOf('__JSON_END__');
const jsonStr = stdout.substring(startIdx, endIdx).trim();

const data = JSON.parse(jsonStr);

// Save JSON
fs.writeFileSync('c:\\Users\\Vicente\\prismaid\\projects\\caju_beverages\\01_raw\\search_hubs.json', JSON.stringify(data, null, 2));

// Update CSV
const date = new Date().toISOString().split('T')[0];
let csvLines = [];
csvLines.push(`${date},Hubs (OASIS/BDTD/CAPES/LILACS/SciELO),N/A,"\\"Anacardium occidentale\\" AND (bebida OR bebidas OR suco OR néctar OR vinho OR fermentado OR cajuína OR \\"cajuina\\")",${data.stats.total},${data.stats.errors.length}`);

fs.appendFileSync('c:\\Users\\Vicente\\prismaid\\projects\\caju_beverages\\logs\\search_log_prisma_s.csv', '\\n' + csvLines.join('\\n'));

console.log("Done. Found " + data.stats.total + " results.");
console.log("Errors: ", data.stats.errors);
