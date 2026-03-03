import sqlite3 from 'sqlite3';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
    const db = new sqlite3.Database('./data/system.db');
    const projectId = 1;
    const projectPath = 'projects/vicente/ai_in_science';

    const records: any[] = await new Promise((resolve, reject) => {
        db.all(
            'SELECT title, creators, doi, url, extraction_data FROM records WHERE project_id = ? AND stage = "extracted"',
            [projectId],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            }
        );
    });

    db.close();

    let markdown = `# Matriz de Evidências — IA na Ciência\n\n`;
    markdown += `Este documento apresenta a extração estruturada dos ${records.length} artigos selecionados para a revisão sistemática.\n\n`;

    markdown += `## Resumo da Extração\n\n`;
    markdown += `| Artigo | Qualidade | Principais Achados |\n`;
    markdown += `| :--- | :---: | :--- |\n`;

    for (const record of records) {
        const data = JSON.parse(record.extraction_data || "{}");
        const pico = data.pico_extracted || {};
        const score = pico.quality_score || 0;
        const summary = pico.summary || "Sem dados extraídos.";

        // Link title to URL if available
        const titleLink = record.url ? `[${record.title}](${record.url})` : record.title;
        markdown += `| ${titleLink} | ${score}/10 | ${summary} |\n`;
    }

    markdown += `\n---\n\n## Detalhes por Artigo\n\n`;

    for (const record of records) {
        const data = JSON.parse(record.extraction_data || "{}");
        const pico = data.pico_extracted || {};

        if (pico.quality_score === 0) continue; // Skip low quality/empty ones in detailed view

        markdown += `### ${record.title}\n\n`;
        markdown += `- **População/Contexto**: ${pico.population || "N/A"}\n`;
        markdown += `- **Intervenção/IA**: ${pico.intervention || "N/A"}\n`;
        markdown += `- **Metodologia**: ${pico.methodology || "N/A"}\n`;
        markdown += `- **Desfecho/Impacto**: ${pico.outcome || "N/A"}\n`;
        markdown += `- **Score de Qualidade**: ${pico.quality_score}/10\n`;
        markdown += `- **Resumo**: ${pico.summary || "N/A"}\n\n`;
        markdown += `---\n\n`;
    }

    const reportDir = path.join(process.cwd(), projectPath, "04_extraction");
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

    const reportPath = path.join(reportDir, "evidence_matrix.md");
    fs.writeFileSync(reportPath, markdown, "utf-8");

    console.log(`Success! Evidence matrix generated at: ${reportPath}`);
}

run().catch(console.error);
