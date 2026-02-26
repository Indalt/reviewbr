// Probing SciELO APIs — OAI-PMH + ArticleMeta
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function probe(label: string, url: string) {
    try {
        const r = await fetch(url, { signal: AbortSignal.timeout(20000), headers: { "User-Agent": "mcp-repos-br/1.0" } });
        const t = await r.text();
        const isXml = t.includes("<OAI-PMH") || t.trimStart().startsWith("<?xml");
        const isJson = t.trimStart().startsWith("{") || t.trimStart().startsWith("[");
        console.log(`  ${r.status === 200 ? "✅" : "⚠️ " + r.status} ${label} | ${isXml ? "XML" : isJson ? "JSON" : "HTML"} | ${t.length} bytes`);
        if (isXml) {
            // Extract key info
            if (t.includes("<repositoryName>")) console.log(`    Repo: ${t.match(/<repositoryName>([^<]+)/)?.[1]}`);
            if (t.includes("<metadataPrefix>")) {
                const formats = [...t.matchAll(/<metadataPrefix>([^<]+)/g)].map(m => m[1]);
                console.log(`    Formats: ${formats.join(", ")}`);
            }
            if (t.includes("<setSpec>")) {
                const sets = [...t.matchAll(/<setSpec>([^<]+)/g)].map(m => m[1]).slice(0, 5);
                console.log(`    Sets (first 5): ${sets.join(", ")}`);
                const totalSets = [...t.matchAll(/<setSpec>/g)].length;
                console.log(`    Total sets in page: ${totalSets}`);
            }
            if (t.includes("<record")) {
                const records = [...t.matchAll(/<record>/g)].length;
                console.log(`    Records in page: ${records}`);
                // Show first record DOI and URL if present
                const doi = t.match(/<identifier[^>]*>([^<]*doi[^<]*)/i)?.[1];
                const firstTitle = t.match(/<dc:title[^>]*>([^<]+)/)?.[1];
                if (doi) console.log(`    First DOI: ${doi}`);
                if (firstTitle) console.log(`    First title: ${firstTitle?.substring(0, 80)}`);
            }
            if (t.includes("resumptionToken")) {
                const token = t.match(/<resumptionToken[^>]*>([^<]*)/)?.[1];
                const totalSize = t.match(/completeListSize="(\d+)"/)?.[1];
                if (totalSize) console.log(`    Total collection size: ${totalSize}`);
                if (token) console.log(`    Has resumption token: yes`);
            }
        }
        if (isJson) {
            try {
                const j = JSON.parse(t);
                if (Array.isArray(j)) {
                    console.log(`    Array length: ${j.length}`);
                    if (j[0]) console.log(`    First item keys: ${Object.keys(j[0]).join(", ")}`);
                } else {
                    console.log(`    Keys: ${Object.keys(j).join(", ")}`);
                    if (j.meta) console.log(`    Meta: ${JSON.stringify(j.meta)}`);
                    if (j.objects) console.log(`    Objects count: ${j.objects.length}`);
                }
            } catch { }
        }
    } catch (e: any) {
        console.log(`  ❌ ${label}: ${e.message?.substring(0, 80)}`);
    }
}

async function main() {
    console.log("═══ SciELO OAI-PMH (scielo-oai.php) ═══\n");

    await probe("Identify", "http://www.scielo.br/oai/scielo-oai.php?verb=Identify");
    await probe("ListMetadataFormats", "http://www.scielo.br/oai/scielo-oai.php?verb=ListMetadataFormats");
    await probe("ListSets", "http://www.scielo.br/oai/scielo-oai.php?verb=ListSets");
    await probe("ListRecords Jan 2024", "http://www.scielo.br/oai/scielo-oai.php?verb=ListRecords&metadataPrefix=oai_dc&from=2024-01-01&until=2024-01-31");

    console.log("\n═══ SciELO ArticleMeta API ═══\n");

    await probe("Collection IDs", "http://articlemeta.scielo.org/api/v1/collection/identifiers/");
    await probe("Journal IDs (scl)", "http://articlemeta.scielo.org/api/v1/journal/identifiers/?collection=scl&limit=3");
    await probe("Journal detail", "http://articlemeta.scielo.org/api/v1/journal/?collection=scl&issn=0100-4042");
    await probe("Article IDs (scl)", "http://articlemeta.scielo.org/api/v1/article/identifiers/?collection=scl&limit=3");
    await probe("Article detail", "http://articlemeta.scielo.org/api/v1/article/?collection=scl&code=S0100-40422024000100202");

    console.log("\n═══ SciELO search.scielo.org ═══\n");

    await probe("Search HTML", "https://search.scielo.org/?q=bebida+fermentada&lang=pt&count=5");
    await probe("Search JSON", "https://search.scielo.org/?q=bebida+fermentada&lang=pt&count=5&output=json");
}

main().then(() => process.exit(0)).catch(console.error);
