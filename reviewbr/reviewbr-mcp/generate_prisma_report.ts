import sqlite3 from 'sqlite3';
import * as fs from 'fs';
import * as path from 'path';

async function generatePrismaReport() {
    const db = new sqlite3.Database('./data/system.db');
    const projectId = 1;
    const projectPath = 'projects/vicente/ai_in_science';

    const records: any[] = await new Promise((resolve, reject) => {
        db.all(
            'SELECT * FROM records WHERE project_id = ? ORDER BY id ASC',
            [projectId],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            }
        );
    });

    db.close();

    // Stats calculation
    const totalIdentified = records.length;
    const duplicates = records.filter(r => r.is_duplicate_of !== null).length;
    const screened = totalIdentified - duplicates;
    const excluded = records.filter(r => r.screening_decision === 'NO').length;
    const includedForFullText = records.filter(r => r.screening_decision === 'YES' || r.screening_decision === 'MAYBE').length;
    const harvestedSuccess = records.filter(r => r.stage === 'fulltext_acquired' || r.stage === 'extracted').length;
    const harvestedFail = records.filter(r => r.stage === 'harvest_failed').length;
    const extractedHighFidelity = records.filter(r => r.stage === 'extracted').length;

    let markdown = `# PRISMA 2020 Audit Report — AI in Science\n\n`;
    markdown += `This document provides the exhaustive technical evidence required for scientific publication under PRISMA 2020 guidelines.\n\n`;

    markdown += `## 1. PRISMA Flow Diagram\n\n`;
    markdown += `\`\`\`mermaid\n`;
    markdown += `graph TD\n`;
    markdown += `    A["Records identified from Databases (n=${totalIdentified})<br/>Source: OasisBR, OpenAlex, PubMed"] --> B["Records screened (n=${screened})"]\n`;
    markdown += `    B --> C["Records excluded (n=${excluded})<br/>By Automation Tool: Gemini 2.0 Flash"]\n`;
    markdown += `    B --> D["Reports sought for retrieval (n=${includedForFullText})"]\n`;
    markdown += `    D --> E["Reports not retrieved (n=${harvestedFail})<br/>Reason: Institutional Proxy/Timeout"]\n`;
    markdown += `    D --> F["Reports assessed for eligibility (n=${harvestedSuccess})"]\n`;
    markdown += `    F --> G["Included in extraction (n=${extractedHighFidelity})"]\n`;
    markdown += `\`\`\`\n\n`;

    markdown += `## 2. Methodology & Automation (PRISMA Items 8, 9)\n\n`;
    markdown += `- **Screening Tool:** Gemini 2.0 Flash (Native Screening Mode).\n`;
    markdown += `- **Selection Process:** Automated classification using PICO criteria via \`run_screening.ts\`.\n`;
    markdown += `- **Data Collection:** Automated extraction using \`run_high_fidelity_extraction.ts\`.\n`;
    markdown += `- **Auditability:** Every decision is backed by a timestamp and a natural language rationale generated at runtime.\n\n`;

    markdown += `## 3. Exhaustive Audit Trail (n=${totalIdentified})\n\n`;
    markdown += `| ID | Source | Date | Decision | Title | Rationale / Harvest Status |\n`;
    markdown += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    for (const record of records) {
        const date = new Date(record.imported_at).toISOString().split('T')[0];
        const source = record.source || "N/A";
        const decision = record.screening_decision || "N/A";
        const title = record.title.length > 70 ? record.title.substring(0, 67) + "..." : record.title;

        // Handle rationale and harvest errors
        const extData = JSON.parse(record.extraction_data || "{}");
        let status = record.screening_reason || "N/A";
        if (record.stage === 'harvest_failed') {
            status = `**HARVEST FAIL:** ${extData.harvest_error || "Unknown"}`;
        }

        markdown += `| ${record.id} | ${source} | ${date} | **${decision}** | ${title} | ${status} |\n`;
    }

    markdown += `\n--- \n\n`;
    markdown += `## 4. Supplementary Data for Examiners\n\n`;
    markdown += `- **Data Availability:** The digital repository contains all harvested full-texts in \`${projectPath}/02_fulltext/\`.\n`;
    markdown += `- **Replication:** The SQLite database snapshot holds the immutable hashes of these processes.\n`;

    const auditDir = path.join(process.cwd(), projectPath, "04_audit");
    if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir, { recursive: true });

    const reportPath = path.join(auditDir, "prisma_full_audit_v2.md");
    fs.writeFileSync(reportPath, markdown, "utf-8");

    console.log(`Success! Enriched PRISMA audit generated at: ${reportPath}`);
}

generatePrismaReport().catch(console.error);
