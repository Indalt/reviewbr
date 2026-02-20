// Quick test of alternative APIs for failing repos
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function probe(label: string, url: string) {
    try {
        const r = await fetch(url, {
            signal: AbortSignal.timeout(15000),
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
            redirect: "follow",
        });
        const t = await r.text();
        const isXml = t.trimStart().startsWith("<?xml") || t.includes("<OAI-PMH");
        const isJson = t.trimStart().startsWith("{") || t.trimStart().startsWith("[");
        console.log(`✅ ${label}: ${r.status} | ${isXml ? "XML" : isJson ? "JSON" : "HTML"} | ${t.length} bytes`);
        if (isJson) {
            try {
                const j = JSON.parse(t);
                console.log(`   Keys: ${Object.keys(j).join(", ")}`);
                if (j.resultCount !== undefined) console.log(`   Results: ${j.resultCount}`);
                if (j.records) console.log(`   Records: ${j.records.length}`);
                if (j._embedded) console.log(`   Embedded keys: ${Object.keys(j._embedded).join(", ")}`);
            } catch { }
        }
        if (isXml && t.includes("<repositoryName>")) {
            const name = t.match(/<repositoryName>([^<]+)/)?.[1];
            console.log(`   Repo: ${name}`);
        }
    } catch (e: any) {
        console.log(`❌ ${label}: ${e.code || e.name}: ${e.message?.substring(0, 80)}`);
    }
}

async function main() {
    console.log("=== BDTD VuFind API ===");
    await probe("VuFind search", "https://bdtd.ibict.br/vufind/api/v1/search?lookfor=bebida+fermentada&type=AllFields&limit=5");
    await probe("VuFind JSON", "https://bdtd.ibict.br/vufind/Search/Results?lookfor=bebida+fermentada&type=AllFields&limit=5&format=json");

    console.log("\n=== SciELO APIs ===");
    await probe("search.scielo.org JSON", "https://search.scielo.org/?q=bebida+fermentada&lang=pt&count=5&from=0&output=json");
    await probe("ArticleMeta collections", "http://articlemeta.scielo.org/api/v1/collection/identifiers/");
    await probe("ArticleMeta article", "http://articlemeta.scielo.org/api/v1/article/?collection=scl&limit=3");

    console.log("\n=== FGV OAI-PMH (correct path) ===");
    await probe("FGV /server/oai", "https://repositorio.fgv.br/server/oai/request?verb=Identify");

    console.log("\n=== USP custom search ===");
    await probe("result.php", "https://repositorio.usp.br/result.php?q=bebida+fermentada");
}

main().then(() => process.exit(0)).catch(console.error);
