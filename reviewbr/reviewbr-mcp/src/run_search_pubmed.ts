import { PubMedService } from "./services/pubmed.js";
import { DatabaseService } from "./services/database.js";
import * as path from "node:path";
import * as fs from "node:fs";

async function main() {
    const pubmedService = new PubMedService();
    const dbService = new DatabaseService();
    const projectId = 2;
    const projectPath = "projects/data_mining/estado_arte_caju";
    const query = "cashew OR \"Anacardium occidentale\"";

    try {
        console.log(`Starting PubMed search for: ${query}`);
        const { results, totalFound, error } = await pubmedService.search(query);

        if (error) throw new Error(error);

        console.log(`Found ${results.length} results (Total in PubMed: ${totalFound}).`);

        const rawDir = path.join(process.cwd(), projectPath, "01_raw");
        if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });

        const outputPath = path.join(rawDir, "dataset_pubmed.json");
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        console.log(`Saved to ${outputPath}`);

        await dbService.logAuditEvent({
            project_id: projectId,
            tool_name: "search_pubmed",
            action_type: "search",
            params: JSON.stringify({ query }),
            result_summary: `Busca PubMed: ${results.length} artigos encontrados.`
        });
        console.log("Logged to audit.");
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        dbService.close();
    }
}

main();
