
import { Registry } from "../registry/loader.js";
import { AccessStrategy } from "../access/strategy.js";
import { SearchOptions } from "../types.js";
import * as fs from "node:fs/promises";
import * as path from "node:path";

// Disable SSL verification for CLI usage
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log("Usage: npx tsx src/scripts/search-export.ts <query> [options]");
        console.log("Options:");
        console.log("  --repo=<id>       Specific repository ID (default: all/auto)");
        console.log("  --degree=<type>   Degree type (mestrado, doutorado)");
        console.log("  --limit=<num>     Max results (default: 50)");
        process.exit(1);
    }

    const query = args[0];
    const opts: SearchOptions = { maxResults: 50 };
    let repoId: string | undefined;

    // specialized parsing
    for (const arg of args.slice(1)) {
        if (arg.startsWith("--repo=")) repoId = arg.split("=")[1];
        if (arg.startsWith("--degree=")) opts.degreeType = arg.split("=")[1] as any;
        if (arg.startsWith("--limit=")) opts.maxResults = parseInt(arg.split("=")[1]);
    }

    const registry = Registry.loadDefault();
    const strategy = new AccessStrategy();

    console.log(`Searching for '${query}'...`);

    let results: any[] = [];

    if (repoId) {
        const repo = registry.getById(repoId);
        if (repo) {
            results = await strategy.search(repo, query, opts);
        }
    } else {
        // Broad search strategy: Check BDTD and SciELO primarily if no repo specified
        // This avoids checking 138 repos sequentially which is slow
        console.log("Broad search across main aggregators (BDTD, SciELO)...");

        const tasks = [];

        // BDTD
        const bdtd = registry.getById("BR-AGG-0001");
        if (bdtd) tasks.push(strategy.search(bdtd, query, opts));

        // SciELO
        const scielo = registry.getById("BR-AGG-0002");
        if (scielo) tasks.push(strategy.search(scielo, query, opts));

        // Add USP for good measure
        const usp = registry.getById("BR-EST-0001");
        if (usp) tasks.push(strategy.search(usp, query, opts));

        const resultsArrays = await Promise.all(tasks);
        results = resultsArrays.flat();
    }

    console.log(`Found ${results.length} results.`);

    // Structure for Prismaid
    const output = {
        query: query,
        timestamp: new Date().toISOString(),
        strategy: "mcp-repos-br",
        filters: opts,
        results: results.map(r => ({
            repo_id: r.repositoryId,
            repo_name: r.repositoryName,
            title: r.title,
            url: r.url,
            doi: r.doi || null,
            pdf_url: r.pdfUrl || null,
            published_date: r.date,
            type: r.type,
            creators: r.creators,
            scraped_at: new Date().toISOString()
        }))
    };

    const fileName = query.toLowerCase().replace(/[^a-z0-9]+/g, "_") + ".json";
    const outDir = path.resolve("c:\\Users\\Vicente\\prismaid\\prismaid\\projects\\buscas");
    const outPath = path.join(outDir, fileName);

    await fs.writeFile(outPath, JSON.stringify(output, null, 2));
    console.log(`✅ Search results saved to: ${outPath}`);
}

main().catch(console.error);
