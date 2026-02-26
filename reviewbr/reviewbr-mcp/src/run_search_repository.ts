import { SearchService } from "./services/search.js";
import { Registry } from "./registry/loader.js";
import { AccessStrategy } from "./access/strategy.js";
import { DatabaseService } from "./services/database.js";
import * as path from "node:path";
import * as fs from "node:fs";

async function main() {
    const registry = Registry.loadDefault();
    const strategy = new AccessStrategy();
    const searchService = new SearchService(registry, strategy);
    const dbService = new DatabaseService();

    const projectId = 2;
    const projectPath = "projects/data_mining/estado_arte_caju";
    const query = "caju OR cajueiro OR \"Anacardium occidentale\"";
    const layers = [1, 3];

    try {
        console.log(`Starting Repository search for: ${query} (Layers: ${layers})`);
        const { results, errors } = await searchService.searchPapers(query, layers);

        console.log(`Found ${results.length} results.`);
        if (errors.length > 0) {
            console.warn("Errors encountered during search:", errors);
        }

        const rawDir = path.join(process.cwd(), projectPath, "01_raw");
        if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });

        const outputPath = path.join(rawDir, "dataset_repository.json");
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        console.log(`Saved to ${outputPath}`);

        await dbService.logAuditEvent({
            project_id: projectId,
            tool_name: "search_papers_optimized",
            action_type: "search",
            params: JSON.stringify({ query, layers }),
            result_summary: `Busca Repositórios: ${results.length} artigos encontrados.`
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
