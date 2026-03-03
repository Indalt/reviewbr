import sqlite3 from 'sqlite3';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
    const db = new sqlite3.Database('./data/system.db');
    const projectId = 1;
    const projectPath = 'projects/vicente/ai_in_science';

    const records: any[] = await new Promise((resolve, reject) => {
        db.all(
            'SELECT id, title, creators, doi, url, screening_decision, screening_reason, stage FROM records WHERE project_id = ? ORDER BY id ASC',
            [projectId],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            }
        );
    });

    db.close();

    let markdown = `# Supplementary Material: Full Audit Trail for Systematic Review (Project #1)\n\n`;
    markdown += `**Project:** AI in Science\n`;
    markdown += `**Date of Export:** 2026-03-02\n`;
    markdown += `**Total Records Processed:** ${records.length}\n`;
    markdown += `**Methodology:** AI-Native Screening (Gemini 2.0 Flash)\n\n`;

    markdown += `--- \n\n`;
    markdown += `## 1. Audit Table: Screening Decisions and Rationales\n\n`;
    markdown += `This table documents every decision made during the screening phase, ensuring full transparency for peer review and replication.\n\n`;

    markdown += `| ID | Decision | Title | Rationale (Raw AI Output) |\n`;
    markdown += `| :--- | :---: | :--- | :--- |\n`;

    for (const record of records) {
        const title = record.title.length > 100 ? record.title.substring(0, 97) + "..." : record.title;
        const reason = record.screening_reason || "N/A";
        markdown += `| ${record.id} | **${record.screening_decision}** | ${title} | ${reason} |\n`;
    }

    markdown += `\n--- \n\n`;
    markdown += `## 2. Technical Metadata\n\n`;
    markdown += `- **LLM Provider:** Google Generative AI (Gemini 2.0 Flash)\n`;
    markdown += `- **System Prompt Version:** v2.1 (PICO-Science-Native)\n`;
    markdown += `- **Deduplication Logic:** Exact DOI match + Title Fuzzy Match (85% threshold)\n`;
    markdown += `- **Database Snapshot:** \`system.db\` @ 2026-03-02-10:27\n`;

    const auditDir = path.join(process.cwd(), projectPath, "04_audit");
    if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir, { recursive: true });

    const auditPath = path.join(auditDir, "full_audit_trail.md");
    fs.writeFileSync(auditPath, markdown, "utf-8");

    console.log(`Success! Full audit trail generated at: ${auditPath}`);
}

run().catch(console.error);
