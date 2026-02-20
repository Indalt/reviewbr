
import { z } from "zod";
import { Registry } from "../registry/loader.js";
import { AccessStrategy } from "../access/strategy.js";
import { program } from "commander";

// CLI Definition
program
    .argument('[query]', 'Search query') // Optional positional
    .option('-q, --query <string>', 'Search query')
    .option('-m, --max <number>', 'Max results per repo', '10')
    .option('--start-year <number>', 'Filter results starting from this year')
    .option('--end-year <number>', 'Filter results up to this year')
    .option('--states <string>', 'Filter by state codes (comma separated, e.g. SP,RJ)')
    .option('--ids <string>', 'Filter by Repo IDs (comma separated)')
    .parse(process.argv);

const options = program.opts();
// console.error(`[CLI DEBUG] Parsed Options: ${JSON.stringify(options)}`);

// Support both positional and flag for query (flag takes precedence)
if (!options.query && program.args.length > 0) {
    options.query = program.args.join(' ');
}

if (!options.query) {
    console.error("Error: --query is required");
    process.exit(1);
}

// Helper: Year Filter
function filterByYear(item: any, start: number | undefined, end: number | undefined): boolean {
    if (!start && !end) return true; // No filter

    // Attempt to extract year from item
    const yearStr = item.year || (item.date ? item.date.substring(0, 4) : null);

    if (!yearStr) return true; // Keep if no year found

    const year = parseInt(yearStr);
    if (isNaN(year)) return true;

    if (start && year < start) return false;
    if (end && year > end) return false;

    return true;
}

// Wrap main logic in an IIFE to use await
async function main() {
    try {
        // Initialize
        const registry = Registry.loadDefault();
        const strategy = new AccessStrategy();

        // Filter Repos
        let repos = registry.getActive();

        if (options.ids) {
            const targetIds = options.ids.split(',').map((s: string) => s.trim());
            console.error(`Filter: Restricting to IDs: ${targetIds.join(', ')}`);
            repos = repos.filter(r => targetIds.includes(r.id));
        } else if (options.states) {
            const targetStates = options.states.split(',').map((s: string) => s.trim().toUpperCase());
            console.error(`Filter: Restricting to states: ${targetStates.join(', ')}`);
            repos = repos.filter(r => targetStates.includes(r.institution.state.toUpperCase()));
        }

        if (repos.length === 0) {
            console.log(JSON.stringify({ error: "No active repositories found" }));
            return;
        }

        console.error(`Starting search for "${options.query}" across ${repos.length} repositories...`);

        const allResults: any[] = [];
        const errors: any[] = [];

        for (const repo of repos) {
            try {
                console.error(`[${repo.id}] Searching...`);
                // Determine capabilities (cached inside strategy)
                const results = await strategy.search(repo, options.query, {
                    title: options.title ? options.query : undefined,
                    author: options.author,
                    dateFrom: options.from,
                    dateUntil: options.until,
                    maxResults: parseInt(options.max),
                });

                if (results && results.length > 0) {
                    // Apply Date Filtering locally
                    const filtered = results.filter((r: any) => filterByYear(r,
                        options.startYear ? parseInt(options.startYear) : undefined,
                        options.endYear ? parseInt(options.endYear) : undefined
                    ));

                    console.error(`[${repo.id}] Found ${results.length} results. (${filtered.length} kept after filter)`);
                    // Tag results with repo metadata
                    const tagged = filtered.map(r => ({ ...r, _origin: repo.id }));
                    allResults.push(...tagged);
                } else {
                    console.error(`[${repo.id}] Found 0 results.`);
                }

            } catch (e: any) {
                console.error(`[${repo.id}] Error: ${e.message}`);
                errors.push({ repo: repo.id, msg: e.message });
            }
        }

        // Output JSON for the UI to consume
        console.log("__JSON_START__");
        console.log(JSON.stringify({
            stats: {
                total: allResults.length,
                repos_queried: repos.length,
                errors: errors
            },
            results: allResults
        }, null, 2));
        console.log("__JSON_END__");

    } catch (e: any) {
        console.error(JSON.stringify({ error: e.message }));
        process.exit(1);
    }
}

main();
