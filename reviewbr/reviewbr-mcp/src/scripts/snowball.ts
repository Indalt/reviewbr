
// import { OpenAlexClient } from "openalex-sdk"; 
// Actually openalex-sdk might not be the package name, it might be 'openalex' or similar. 
// I installed 'openalex-sdk' in previous step. Let's assume standard usage or use 'fetch' if sdk is complex.
// Re-reading: I ran 'npm install openalex-sdk'.

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { z } from "zod";

// --- Configuration ---
const OPENALEX_API_KEY = process.env.OPENALEX_API_KEY; // Optional, but recommended
const MAILTO = "vicente@prismaid.com"; // Polite for OpenAlex

// --- Types ---
interface SeedArticle {
    doi?: string;
    title?: string;
}

interface SnowballResult {
    source_doi?: string;
    source_title?: string;
    type: "reference" | "citation";
    work: any;
}

// --- Main ---

async function main() {
    const args = process.argv.slice(2);
    const seedsPath = args[0]; // e.g., "seeds.json"
    const outPath = args[1] || "snowball_results.json";

    if (!seedsPath) {
        console.error("Usage: ts-node snowball.ts <seeds.json> [output.json]");
        process.exit(1);
    }

    console.log(`❄️ Starting Snowballing on ${seedsPath}...`);

    // 1. Load Seeds
    let seeds: SeedArticle[] = [];
    try {
        const raw = await fs.readFile(seedsPath, "utf-8");
        const json = JSON.parse(raw);
        // Handle different formats (array of strings, or array of objects)
        if (Array.isArray(json)) {
            seeds = json.map((x: any) => typeof x === "string" ? { doi: x } : x);
        }
    } catch (e) {
        console.error("Failed to load seeds:", e);
        process.exit(1);
    }

    console.log(`Loaded ${seeds.length} seeds.`);

    const results: SnowballResult[] = [];
    const seen = new Set<string>();

    for (const seed of seeds) {
        let workId: string | null = null;
        let doi = seed.doi ? cleanDOI(seed.doi) : null;
        const title = seed.title;

        console.log(`\nProcessing Seed: ${doi || title}`);

        try {
            // A. Get the Work ID
            let workResp: any = null;

            if (doi) {
                // Try DOI first
                const workUrl = `https://api.openalex.org/works/https://doi.org/${doi}?mailto=${MAILTO}`;
                workResp = await fetchWithRetry(workUrl);
            }

            if (!workResp && title) {
                // Try Title Search
                console.log(`  🔍 Looking up by title: "${title}"`);
                const searchUrl = `https://api.openalex.org/works?filter=display_name.search:${encodeURIComponent(title)}&mailto=${MAILTO}`;
                const searchResp = await fetchWithRetry(searchUrl);

                if (searchResp && searchResp.results && searchResp.results.length > 0) {
                    // Simple heuristic: Take top result. In prod, matching authors/year would be better.
                    workResp = searchResp.results[0];
                    console.log(`  ✅ Found match: "${workResp.display_name}" (${workResp.id})`);
                    workId = workResp.id;
                    if (workResp.doi) doi = cleanDOI(workResp.doi); // Update DOI if found
                }
            }

            if (!workResp) {
                console.warn(`  ❌ Work not found in OpenAlex: ${doi || title}`);
                continue;
            }

            // B. References (Backward Snowballing)
            const references = workResp.referenced_works || []; // List of OpenAlex IDs
            console.log(`  -> Found ${references.length} references.`);

            // Save References (IDs only for now)
            results.push({
                source_doi: doi || undefined,
                source_title: title || workResp.display_name,
                type: "reference",
                work: { id: references }
            });

            // C. Citations (Forward Snowballing)
            // "https://api.openalex.org/works?filter=cites:WORK_ID"
            if (!workId) workId = workResp.id; // Ensure we have ID
            const shortId = workId!.split("/").pop();

            const citedByUrl = `https://api.openalex.org/works?filter=cites:${shortId}&mailto=${MAILTO}`;
            const citedByResp = await fetchWithRetry(citedByUrl);
            const citations = (citedByResp as any).results || [];
            console.log(`  -> Found ${citations.length} citations (1st page).`);

            // Save Citations
            for (const cit of citations) {
                results.push({
                    source_doi: doi || undefined,
                    source_title: title || workResp.display_name,
                    type: "citation",
                    work: {
                        id: cit.id,
                        doi: cit.doi,
                        title: cit.display_name, // Changed from title to display_name as per OpenAlex
                        publication_year: cit.publication_year
                    }
                });
            }

        } catch (e: any) {
            console.error(`  Error processing ${doi || title}:`, e.message);
        }
    }

    // 3. Save
    await fs.writeFile(outPath, JSON.stringify(results, null, 2));
    console.log(`\n✅ Saved raw snowball results to ${outPath}`);
    console.log(`Total Relationships: ${results.length}`);
}

// --- Helpers ---

function cleanDOI(doi: string): string {
    return doi.replace("https://doi.org/", "").replace("http://doi.org/", "");
}

async function fetchWithRetry(url: string, retries = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
        try {
            const resp = await fetch(url);
            if (resp.status === 404) return null;
            if (resp.status === 429) {
                const wait = (i + 1) * 2000;
                console.log(`    Rate limit. Waiting ${wait}ms...`);
                await new Promise(r => setTimeout(r, wait));
                continue;
            }
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            return await resp.json();
        } catch (e) {
            if (i === retries - 1) throw e;
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}

main().catch(console.error);
