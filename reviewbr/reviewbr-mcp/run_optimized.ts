import { SearchService } from './src/services/search.js';
import { Registry } from './src/registry/loader.js';
import { AccessStrategy } from './src/access/strategy.js';
import { DatabaseService } from './src/services/database.js';

async function run() {
    console.log("Starting Optimized Search Protocol: AI in Science");

    // Ignore loader errors globally
    const registry = Registry.loadDefault();
    const strategy = new AccessStrategy();
    const dbService = new DatabaseService();
    const searchService = new SearchService(registry, strategy);

    const query = '("Artificial Intelligence" OR "Machine Learning") AND ("Science" OR "Academia" OR "Universidade")';
    const projectId = 1;

    console.log("\n--- Searching OAI-PMH & Institutional Layers [1,2,3,4,5] ---");
    const res = await searchService.searchPapers(query, [1, 2, 3, 4, 5]);
    const records = res.results;

    console.log(`Found: ${records.length} records. Errors: ${res.errors.length}`);
    await dbService.insertRecords(projectId, "search_papers_optimized", records);

    console.log("\nSearch phase completed and records saved to DataBase.");
}

run().catch(console.error);
