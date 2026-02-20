import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
    const transport = new StdioClientTransport({
        command: "node",
        args: ["dist/index.js"],
    });

    const client = new Client({
        name: "test-client",
        version: "1.0.0",
    }, {
        capabilities: {}
    });

    await client.connect(transport);

    try {
        console.log("--- 1. Search (Layer 3: Priority - e.g. Embrapa/UFC) ---");
        // Searching for a broad term in a specific layer to simulate "expanding reach"
        const searchResult = await client.callTool({
            name: "search_papers_optimized",
            arguments: {
                query: "Anacardium occidentale",
                layers: [3], // Focusing on Priority layer (Layer 3)
                dateFrom: "2023-01-01"
            }
        });

        const searchData = JSON.parse(searchResult.content[0].text);
        console.log(`Found ${searchData.count} papers.`);
        let papers = searchData.results.slice(0, 5); // Take top 5 for speed

        console.log("\n--- 2. Deduplicate ---");
        // Duplicate some for testing
        if (papers.length > 0) {
            papers.push(papers[0]);
        }

        const dedupeResult = await client.callTool({
            name: "deduplicate_dataset",
            arguments: {
                dataset: JSON.stringify(papers)
            }
        });
        const uniquePapers = JSON.parse(dedupeResult.content[0].text).filter(p => p.accessMethod !== 'duplicate');
        console.log(`After dedupe: ${uniquePapers.length} unique papers.`);


        console.log("\n--- 3. Screen (Generic) ---");
        // Simple criteria
        const screenResult = await client.callTool({
            name: "screen_candidates",
            arguments: {
                candidates: JSON.stringify(uniquePapers),
                criteria: "Include only papers about production or diseases."
            }
        });
        const screenedData = JSON.parse(screenResult.content[0].text);
        const included = screenedData.included;
        console.log(`Included: ${included.length}, Excluded: ${screenedData.excluded.length}`);

        if (included.length > 0) {
            console.log("\n--- 4. Snowball (Expand Reach) ---");
            const snowballResult = await client.callTool({
                name: "expand_search_snowball",
                arguments: {
                    dataset: JSON.stringify(included)
                }
            });
            const snowballData = JSON.parse(snowballResult.content[0].text);
            console.log(`Snowball Candidates Found: ${snowballData.newCandidates.length}`);

            console.log("\n--- 5. Export ---");
            const allPapers = [...included, ...snowballData.newCandidates];
            const exportResult = await client.callTool({
                name: "export_dataset",
                arguments: {
                    dataset: JSON.stringify(allPapers),
                    format: "markdown"
                }
            });
            console.log("Generated Bibliography (Preview):");
            console.log(exportResult.content[0].text.substring(0, 200) + "...");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await transport.close();
    }
}

main();
