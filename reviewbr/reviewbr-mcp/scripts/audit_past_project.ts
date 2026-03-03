import { DatabaseService } from "../src/services/database.js";
import { MethodologyAuditorService } from "../src/services/methodology_auditor.js";
import * as fs from "fs";
import * as path from "path";

async function runAudit() {
    console.log("Starting audit of past project 'ai_in_science'...");

    // Initialize DB service
    const dbService = new DatabaseService();

    // Find the past project
    const projects = await dbService.getProjects("vicente");
    const proj = projects.find(p => p.project_path?.includes("ai_in_science") || p.project_name === "AI in Science");
    if (!proj) throw new Error("Project ai_in_science not found in the database. Available: " + projects.map(p => p.project_name).join(", "));

    // Get all records for this project
    const rows = await dbService.getRecords(proj.id!);

    // Reconstruct SearchResult objects from DB rows
    const records = rows.map(r => {
        const raw = r.raw_metadata ? JSON.parse(r.raw_metadata) : {};
        if (r.audit_metadata) {
            raw.audit = JSON.parse(r.audit_metadata);
        }
        raw.repositoryName = raw.repositoryName || r.source;
        return raw;
    });

    console.log(`Loaded ${records.length} records from the database using project ID ${proj.id}.`);

    // Initialize Auditor
    const auditor = new MethodologyAuditorService();

    // The Prisma Flow data was manually generated in previous steps
    // Let's pass the approximate numbers from our previous walkthrough
    const prismaFlowData = {
        identified_db: 1104,
        identified_other: 0,
        duplicates_removed: 0,
        screened: 1104,
        title_abstract_excluded: 1067,
        retrieved_fulltext: 35,
        fulltext_not_retrieved: 2,
        fulltext_assessed: 35,
        fulltext_excluded: 0,
        included: 35
    };

    // We also know the search terms used theoretically, but the DB didn't enforce it before.
    // Let's pass what we think we used, but the Transparency Audit (Check 6) will check the DB itself.
    const searchTerms = '(cashew OR "Anacardium occidentale") AND ("machine learning" OR "artificial intelligence" OR "deep learning" OR "computer vision" OR "neural network*")';

    // Run audit
    const report = auditor.audit({
        dataset: records,
        searchTermsUsed: searchTerms,
        prismaFlowData: prismaFlowData
    });

    console.log(`Audit complete. Score: ${report.score}/${report.maxScore}`);

    // Save report
    const auditDir = path.join(process.cwd(), "projects", "vicente", "ai_in_science", "04_audit");
    if (!fs.existsSync(auditDir)) {
        fs.mkdirSync(auditDir, { recursive: true });
    }

    const reportPath = path.join(auditDir, "system_guardrails_audit.md");
    fs.writeFileSync(reportPath, report.markdownReport, "utf-8");
    console.log(`Report saved to ${reportPath}`);
}

runAudit().catch(console.error);
