import { SemanticScholarService } from "./src/services/semantic_scholar.js";

async function run() {
    const s2 = new SemanticScholarService();
    console.log("Searching Semantic Scholar for 'quantum computers'...");

    try {
        const result = await s2.search("quantum computers", { maxResults: 5 });
        console.log(`Total Found: ${result.totalFound}`);
        result.results.forEach(r => {
            console.log(`- [${r.date}] ${r.title}`);
            console.log(`  URL/PDF: ${r.url}`);
        });
    } catch (e) {
        console.error("Test failed:", e);
    }
}
run();
