
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
    const transport = new StdioClientTransport({
        command: "node",
        args: ["dist/index.js"],
        stderr: "inherit" // Crucial to see server errors
    });

    const client = new Client(
        { name: "verify-client", version: "1.0.0" },
        { capabilities: {} }
    );

    try {
        await client.connect(transport);
        console.log("Connected to MCP server.");

        // LIST TOOLS
        const tools = await client.listTools();
        const hasPubMed = tools.tools.some(t => t.name === "search_pubmed");

        if (!hasPubMed) {
            console.error("FAIL: search_pubmed tool not found in registry.");
            process.exit(1);
        }
        console.log("PASS: search_pubmed tool found.");

        // EXECUTE SEARCH (Use a broad term that definitely returns results)
        console.log("Executing search_pubmed for 'Anacardium occidentale'...");
        const result = await client.callTool({
            name: "search_pubmed",
            arguments: {
                query: "Anacardium occidentale",
                maxResults: 5
            }
        });

        // @ts-ignore
        const textContent = result.content[0].text;
        console.log("--- Tool Output ---");
        console.log(textContent);

        if (textContent.includes("## Resultados PubMed") && textContent.includes("Anacardium")) {
            console.log("\nPASS: Tool execution and output verification successful.");
        } else {
            console.error("\nFAIL: Output did not contain expected data.");
        }

    } catch (e) {
        console.error("Verification failed:", e);
    } finally {
        await client.close();
    }
}

main();
