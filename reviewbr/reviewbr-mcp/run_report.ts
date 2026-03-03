import { DatabaseService } from './src/services/database.js';
import { ScreeningMetricsService } from './src/services/screening_metrics.js';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
    const db = new DatabaseService();
    const metrics = new ScreeningMetricsService();

    const projectId = 1;
    const projectPath = 'c:\\Users\\Vicente\\reviewbr\\reviewbr\\projects\\vicente\\ai_in_science';

    console.log('--- Generating R1 Saturation Metrics Report ---');
    const report = await metrics.generateReport(db, projectId, 20);

    const reportDir = path.join(projectPath, "03_screening");
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportFilePath = path.join(reportDir, "screening_metrics_report.md");
    fs.writeFileSync(reportFilePath, report.markdownReport, "utf-8");

    console.log(report.markdownReport);
    console.log(`\nSuccess! Markdown report physically saved to: ${reportFilePath}`);
}

run().catch(console.error);
