const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const query = '"Anacardium occidentale" AND (bebida OR bebidas OR suco OR néctar OR vinho OR fermentado OR cajuína OR "cajuina")';
const mcpDir = path.resolve(__dirname, '..', '..', 'mcp-repos-br');
const cmd = `npx.cmd tsx src/scripts/run_search_cli.ts --query '${query}' --ids BR-AGG-0001,BR-AGG-0002,BR-AGG-0003,BR-AGG-0004,BR-AGG-0005,BR-RES-0002 --max 50`;

console.log("Executando: " + cmd);

try {
    const stdout = execSync(cmd, { cwd: mcpDir, encoding: 'utf-8', maxBuffer: 1024 * 1024 * 50 });

    const startToken = '__JSON_START__';
    const endToken = '__JSON_END__';
    const startIdx = stdout.indexOf(startToken);
    const endIdx = stdout.indexOf(endToken);

    if (startIdx !== -1 && endIdx !== -1) {
        const jsonStr = stdout.substring(startIdx + startToken.length, endIdx).trim();
        const data = JSON.parse(jsonStr);

        const rawJsonPath = path.resolve(__dirname, '..', '01_raw', 'search_tier_1_raw.json');
        fs.writeFileSync(rawJsonPath, JSON.stringify(data, null, 2));

        const csvPath = path.resolve(__dirname, '..', 'logs', 'search_log_prisma_s.csv');
        const date = new Date().toISOString().split('T')[0];
        const logLine = `${date},Hubs Estratégicos,N/A,"${query.replace(/"/g, '""')}",${data.stats.total},${data.stats.errors.length}\\n`;
        fs.appendFileSync(csvPath, logLine);

        console.log("Sucesso! Total de hits:", data.stats.total);
    } else {
        console.error("Tokens JSON não encontrados. Output:");
        console.log(stdout);
    }
} catch (e) {
    console.error("Erro na execução:");
    console.error(e.stderr ? e.stderr.toString() : e.message);
}
