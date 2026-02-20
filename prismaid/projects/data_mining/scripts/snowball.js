
const fs = require('fs').promises;
const path = require('path');

// --- Configuration ---
const OPENALEX_API_KEY = process.env.OPENALEX_API_KEY;
const MAILTO = "vicente@prismaid.com";

// --- Main ---

async function main() {
    const args = process.argv.slice(2);
    const seedsPath = args[0];
    const outPath = args[1] || "snowball_results.json";

    if (!seedsPath) {
        console.error("Usage: node snowball.cjs <seeds.json> [output.json]");
        process.exit(1);
    }

    console.log(`❄️ Starting Snowballing on ${seedsPath}...`);

    let seeds = [];
    try {
        const raw = await fs.readFile(seedsPath, "utf-8");
        const json = JSON.parse(raw);
        if (Array.isArray(json)) {
            seeds = json.map((x) => typeof x === "string" ? { doi: x } : x);
        }
    } catch (e) {
        console.error("Failed to load seeds:", e);
        process.exit(1);
    }

    console.log(`Loaded ${seeds.length} seeds.`);
    const results = [];

    for (const seed of seeds) {
        let workId = null;
        let doi = seed.doi ? cleanDOI(seed.doi) : null;
        const title = seed.title;

        console.log(`\nProcessing Seed: ${doi || title}`);

        try {
            // A. Get the Work ID
            let workResp = null;

            if (doi) {
                const workUrl = `https://api.openalex.org/works/https://doi.org/${doi}?mailto=${MAILTO}`;
                workResp = await fetchWithRetry(workUrl);
            }

            if (!workResp && title) {
                console.log(`  🔍 Looking up by title: "${title}"`);
                const searchUrl = `https://api.openalex.org/works?filter=display_name.search:${encodeURIComponent(title)}&mailto=${MAILTO}`;
                // console.log("DEBUG: URL", searchUrl);
                const searchResp = await fetchWithRetry(searchUrl);

                if (searchResp && searchResp.results && searchResp.results.length > 0) {
                    workResp = searchResp.results[0];
                    console.log(`  ✅ Found match: "${workResp.display_name}" (${workResp.id})`);
                    workId = workResp.id;
                    if (workResp.doi) doi = cleanDOI(workResp.doi);
                }
            }

            if (!workResp) {
                console.warn(`  ❌ Work not found in OpenAlex: ${doi || title}`);
                continue;
            }

            // B. References
            const references = workResp.referenced_works || [];
            console.log(`  -> Found ${references.length} references.`);

            results.push({
                source_doi: doi || undefined,
                source_title: title || workResp.display_name,
                type: "reference",
                work: { id: references }
            });

            // C. Citations
            if (!workId) workId = workResp.id;
            const shortId = workId.split("/").pop();

            const citedByUrl = `https://api.openalex.org/works?filter=cites:${shortId}&mailto=${MAILTO}`;
            const citedByResp = await fetchWithRetry(citedByUrl);
            const citations = (citedByResp && citedByResp.results) ? citedByResp.results : [];
            console.log(`  -> Found ${citations.length} citations (1st page).`);

            for (const cit of citations) {
                results.push({
                    source_doi: doi || undefined,
                    source_title: title || workResp.display_name,
                    type: "citation",
                    work: {
                        id: cit.id,
                        doi: cit.doi,
                        title: cit.display_name,
                        publication_year: cit.publication_year
                    }
                });
            }

        } catch (e) {
            console.error(`  Error processing ${doi || title}:`, e.message);
            console.error(e); // Full stack
        }
    }

    try {
        await fs.writeFile(outPath, JSON.stringify(results, null, 2));
        console.log(`\n✅ Saved raw snowball results to ${outPath}`);
        console.log(`Total Relationships: ${results.length}`);
    } catch (e) {
        console.error("Failed to save output:", e);
    }
}

function cleanDOI(doi) {
    if (!doi) return "";
    return doi.replace("https://doi.org/", "").replace("http://doi.org/", "");
}

async function fetchWithRetry(url, retries = 3) {
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
            if (!resp.ok) throw new Error(`HTTP ${resp.status} - ${resp.statusText}`);
            return await resp.json();
        } catch (e) {
            // console.error(`    Retry ${i+1} failed: ${e.message}`);
            if (i === retries - 1) throw e;
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}

main().catch((e) => {
    console.error("FATAL:", e);
    process.exit(1);
});
