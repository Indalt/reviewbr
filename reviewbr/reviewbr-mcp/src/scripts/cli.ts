
import { Registry } from "../registry/loader.js";
import { AccessStrategy } from "../access/strategy.js";
import { SearchOptions } from "../types.js";

// Disable SSL verification for CLI usage
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log("Usage: npx tsx src/scripts/cli.ts <query> [options]");
        console.log("Options:");
        console.log("  --repo=<id>       Specific repository ID (default: all/auto)");
        console.log("  --degree=<type>   Degree type (mestrado, doutorado)");
        console.log("  --limit=<num>     Max results (default: 5)");
        console.log("  --json            Output JSON");
        process.exit(1);
    }

    const query = args[0];
    const opts: SearchOptions = { maxResults: 5 };
    let repoId: string | undefined;
    let jsonOutput = false;

    // specialized parsing
    for (const arg of args.slice(1)) {
        if (arg.startsWith("--repo=")) repoId = arg.split("=")[1];
        if (arg.startsWith("--degree=")) opts.degreeType = arg.split("=")[1] as any;
        if (arg.startsWith("--limit=")) opts.maxResults = parseInt(arg.split("=")[1]);
        if (arg === "--json") jsonOutput = true;
    }

    const registry = Registry.loadDefault();
    const strategy = new AccessStrategy();

    let results: any[] = [];

    if (repoId) {
        const repo = registry.getById(repoId);
        if (!repo) {
            console.error(`Repo ${repoId} not found.`);
            process.exit(1);
        }
        results = await strategy.search(repo, query, opts);
    } else {
        // Default to BDTD for broad search if no repo specified
        console.log("No repo specified, searching BDTD (BR-AGG-0001)...");
        const bdtd = registry.getById("BR-AGG-0001");
        if (bdtd) {
            results = await strategy.search(bdtd, query, opts);
        }
    }

    if (jsonOutput) {
        console.log(JSON.stringify(results, null, 2));
    } else {
        console.log(`\nFound ${results.length} results for '${query}':\n`);
        results.forEach((r, i) => {
            console.log(`[${i + 1}] ${r.title}`);
            console.log(`    Author: ${r.creators.join(", ")}`);
            console.log(`    Type: ${r.degreeType || r.type}`);
            console.log(`    Repo: ${r.repositoryName}`);
            console.log(`    URL: ${r.url}`);
            if (r.doi) console.log(`    DOI: ${r.doi}`);
            console.log("");
        });
    }
}

main().catch(console.error);
