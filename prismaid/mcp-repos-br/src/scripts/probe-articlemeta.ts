// Focused ArticleMeta probe — this is the only SciELO API that works
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function get(label: string, url: string): Promise<any> {
    console.log(`\n>>> ${label}`);
    console.log(`    ${url}`);
    try {
        const r = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { "User-Agent": "mcp-repos-br/1.0" } });
        const t = await r.text();
        console.log(`    Status: ${r.status} | ${t.length} bytes | CT: ${r.headers.get("content-type")}`);

        if (r.status !== 200) {
            console.log(`    Body: ${t.substring(0, 200)}`);
            return null;
        }

        try {
            const j = JSON.parse(t);
            if (Array.isArray(j)) {
                console.log(`    Array of ${j.length} items`);
                if (j[0]) console.log(`    First: ${JSON.stringify(j[0]).substring(0, 200)}`);
            } else {
                const keys = Object.keys(j);
                console.log(`    Keys: ${keys.join(", ")}`);
                if (j.meta) console.log(`    Meta: ${JSON.stringify(j.meta)}`);
                if (j.objects) {
                    console.log(`    Objects: ${j.objects.length}`);
                    if (j.objects[0]) {
                        const o = j.objects[0];
                        console.log(`    First object keys: ${Object.keys(o).join(", ")}`);
                        if (o.code) console.log(`    code: ${o.code}`);
                        if (o.doi) console.log(`    doi: ${o.doi}`);
                        if (o.processing_date) console.log(`    processing_date: ${o.processing_date}`);
                    }
                }
                // For single article response
                if (j.title) console.log(`    title: ${JSON.stringify(j.title).substring(0, 150)}`);
                if (j.doi) console.log(`    doi: ${j.doi}`);
                if (j.authors) console.log(`    authors: ${j.authors?.length} authors`);
                if (j.abstract) console.log(`    abstract keys: ${Object.keys(j.abstract || {}).join(", ")}`);
                if (j.subject_areas) console.log(`    subject_areas: ${j.subject_areas}`);
                if (j.publication_date) console.log(`    pub_date: ${j.publication_date}`);
                if (j.fulltexts) console.log(`    fulltexts: ${JSON.stringify(j.fulltexts).substring(0, 200)}`);
                if (j.pdf) console.log(`    pdf: ${JSON.stringify(j.pdf).substring(0, 200)}`);
                if (j.languages) console.log(`    languages: ${j.languages}`);
                if (j.aff_countries) console.log(`    aff_countries: ${j.aff_countries}`);
                if (j.journal) {
                    const jn = j.journal;
                    console.log(`    journal: ${jn.title || jn.v100?.[0]?._ || JSON.stringify(jn).substring(0, 100)}`);
                }
            }
            return j;
        } catch {
            console.log(`    Not JSON. First 200 chars: ${t.substring(0, 200)}`);
            return null;
        }
    } catch (e: any) {
        console.log(`    ERROR: ${e.message?.substring(0, 80)}`);
        return null;
    }
}

async function main() {
    console.log("══════════════════════════════════════════════");
    console.log("  SciELO ArticleMeta API — Deep Exploration");
    console.log("══════════════════════════════════════════════");

    // 1. Collections — what collections exist
    await get("Collections", "http://articlemeta.scielo.org/api/v1/collection/identifiers/");

    // 2. Journals — list journals in SCL (Brazil)
    const journals = await get("Journals SCL (first 3)", "http://articlemeta.scielo.org/api/v1/journal/identifiers/?collection=scl&limit=3");

    // 3. Single journal detail
    await get("Journal detail (ISSN 0100-4042 = Quimica Nova)", "http://articlemeta.scielo.org/api/v1/journal/?collection=scl&issn=0100-4042");

    // 4. Article identifiers — filtered by date
    await get("Articles IDs (from=2024-01-01, limit=5)", "http://articlemeta.scielo.org/api/v1/article/identifiers/?collection=scl&from=2024-01-01&limit=5");

    // 5. Article identifiers — filtered by ISSN
    await get("Articles IDs by ISSN (0100-4042, limit=5)", "http://articlemeta.scielo.org/api/v1/article/identifiers/?collection=scl&issn=0100-4042&limit=5");

    // 6. Single article by code 
    await get("Single article (S0100-40422024000100202)", "http://articlemeta.scielo.org/api/v1/article/?collection=scl&code=S0100-40422024000100202");

    // 7. Exists endpoint
    await get("Article exists?", "http://articlemeta.scielo.org/api/v1/article/exists/?collection=scl&code=S0100-40422024000100202");

    // 8. Try older article
    await get("Articles IDs (2023, limit=3)", "http://articlemeta.scielo.org/api/v1/article/identifiers/?collection=scl&from=2023-01-01&until=2023-06-30&limit=3");

    console.log("\n══════════════════════════════════════════════");
    console.log("  DONE");
    console.log("══════════════════════════════════════════════");
}

main().then(() => process.exit(0)).catch(console.error);
