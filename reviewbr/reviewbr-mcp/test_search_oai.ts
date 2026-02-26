import { OaiPmhService } from "./src/services/oaipmh.js";

async function run() {
    const service = new OaiPmhService();
    try {
        console.log("Searching national_br repositories...");
        const { results, totalFound } = await service.search("computação quântica", {
            maxResults: 10,
            scopeVars: ["national_br"]
        });

        console.log(`Total Found: ${totalFound}`);
        results.forEach(r => {
            console.log(`- ${r.title} | ${r.repositoryName} | ${r.date}`);
        });
        console.log("Done.");
    } catch (e) {
        console.error("Error:", e);
    }
}
run();
