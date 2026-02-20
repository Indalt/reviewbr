const fs = require('fs');
const content = fs.readFileSync('c:\\\\Users\\\\Vicente\\\\prismaid\\\\projects\\\\caju_beverages\\\\01_raw\\\\search_tier_1_dump.txt', 'utf8');

const startIdx = content.indexOf('__JSON_START__');
const endIdx = content.indexOf('__JSON_END__');

if (startIdx !== -1 && endIdx !== -1) {
    const jsonStr = content.substring(startIdx + '__JSON_START__'.length, endIdx).trim();
    const data = JSON.parse(jsonStr);

    fs.writeFileSync('c:\\\\Users\\\\Vicente\\\\prismaid\\\\projects\\\\caju_beverages\\\\01_raw\\\\search_tier_1_raw.json', JSON.stringify(data, null, 2));

    const csvPath = 'c:\\\\Users\\\\Vicente\\\\prismaid\\\\projects\\\\caju_beverages\\\\logs\\\\search_log_prisma_s.csv';
    const date = new Date().toISOString().split('T')[0];
    const query = '"Anacardium occidentale" AND (bebida OR bebidas OR suco OR néctar OR vinho OR fermentado OR cajuína OR "cajuina")';
    const logLine = `${date},Hubs Estratégicos (Camada 1),N/A,"${query.replace(/"/g, '""')}",${data.stats.total},0\\n`;
    fs.appendFileSync(csvPath, logLine);

    console.log("Processed tier 1 dump successfully.");
} else {
    console.log("Failed to find JSON.");
}
