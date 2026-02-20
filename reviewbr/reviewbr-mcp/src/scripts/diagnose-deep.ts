/**
 * Deep diagnosis of every failing repo — tests actual URLs and alternative endpoints.
 * Goal: find what works and fix what doesn't.
 */

// Allow self-signed certs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const registryPath = join(__dirname, "..", "..", "data", "repositorios_brasileiros.json");
const registry = JSON.parse(readFileSync(registryPath, "utf-8")) as any[];

async function probe(label: string, url: string, timeout = 15000): Promise<void> {
    try {
        const resp = await fetch(url, {
            signal: AbortSignal.timeout(timeout),
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
            redirect: "follow",
        });
        const body = await resp.text();
        const isXml = body.trimStart().startsWith("<?xml") || body.includes("<OAI-PMH");
        const isJson = body.trimStart().startsWith("{");
        const isHtml = body.includes("<html") || body.includes("<!DOCTYPE");
        const type = isXml ? "XML" : isJson ? "JSON" : isHtml ? "HTML" : "OTHER";
        const hasHandle = body.includes("/handle/");
        const hasRecords = body.includes("<record") || body.includes("<ListRecords");
        const snippet = body.replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .substring(0, 200);
        console.log(`  ✅ ${label}: ${resp.status} ${type} (${body.length} bytes)` +
            (hasHandle ? " [HAS /handle/ LINKS]" : "") +
            (hasRecords ? " [HAS OAI RECORDS]" : ""));
        if (type === "XML" || type === "JSON") console.log(`     Preview: ${snippet.substring(0, 150)}`);
    } catch (e: any) {
        console.log(`  ❌ ${label}: ${e.code || e.name}: ${e.message?.substring(0, 80)}`);
    }
}

async function main() {
    console.log("\n═══════════════════════════════════════════════");
    console.log("     DEEP DIAGNOSIS OF FAILING REPOSITORIES");
    console.log("═══════════════════════════════════════════════\n");

    // ─── 1. UFRGS — Timeout ───
    console.log("━━━ UFRGS (timeout at https://lume.ufrgs.br/) ━━━");
    await probe("https://lume.ufrgs.br", "https://lume.ufrgs.br/");
    await probe("http (no SSL)", "http://lume.ufrgs.br/");
    await probe("www variant", "https://www.lume.ufrgs.br/");
    await probe("OAI-PMH", "https://lume.ufrgs.br/oai/request?verb=Identify");
    await probe("DSpace server/api", "https://lume.ufrgs.br/server/api");
    await probe("discover search", "https://lume.ufrgs.br/discover?query=ciencia");

    // ─── 2. UNB — Connection refused ───
    console.log("\n━━━ UNB (refused at https://repositorio.unb.br/) ━━━");
    await probe("https", "https://repositorio.unb.br/");
    await probe("http", "http://repositorio.unb.br/");
    await probe("OAI-PMH", "https://repositorio.unb.br/oai/request?verb=Identify");
    await probe("OAI-PMH http", "http://repositorio.unb.br/oai/request?verb=Identify");
    await probe("server/api", "https://repositorio.unb.br/server/api");

    // ─── 3. UFPE — Timeout ───
    console.log("\n━━━ UFPE (timeout at https://repositorio.ufpe.br/) ━━━");
    await probe("https", "https://repositorio.ufpe.br/");
    await probe("http", "http://repositorio.ufpe.br/");
    await probe("attena variant", "https://attena.ufpe.br/");
    await probe("OAI-PMH", "https://repositorio.ufpe.br/oai/request?verb=Identify");

    // ─── 4. USP — Reachable but all methods fail ───
    console.log("\n━━━ USP (reachable, all methods fail) ━━━");
    await probe("Main URL", "https://repositorio.usp.br/");
    // USP doesn't use standard DSpace — it's a custom system
    await probe("OAI-PMH registered", "https://repositorio.usp.br/oai/request?verb=Identify");
    await probe("USP Teses", "https://www.teses.usp.br/");
    await probe("USP Teses OAI", "https://www.teses.usp.br/cgi-bin/oai?verb=Identify");
    await probe("USP search", "https://repositorio.usp.br/result.php?q=ciencia");
    await probe("USP advanced", "https://repositorio.usp.br/search.php?q=ciencia");
    await probe("simple-search", "https://repositorio.usp.br/simple-search?query=ciencia");
    await probe("discover", "https://repositorio.usp.br/discover?query=ciencia");

    // ─── 5. BDTD — Reachable but OAI-PMH PHP legacy fails ───
    console.log("\n━━━ BDTD (reachable, OAI-PMH fails) ━━━");
    await probe("Main page", "http://bdtd.ibict.br/");
    await probe("OAI registered", "http://oai.ibict.br/mypoai/oai2.php?verb=Identify");
    await probe("BDTD OAI variant", "http://bdtd.ibict.br/oai/request?verb=Identify");
    await probe("BDTD vufind search", "http://bdtd.ibict.br/vufind/Search/Results?lookfor=ciencia&type=AllFields");

    // ─── 6. SciELO — Reachable but OAI-PMH fails ───
    console.log("\n━━━ SciELO (reachable, OAI-PMH fails) ━━━");
    await probe("Main page", "https://scielo.br/");
    await probe("OAI registered", "http://www.scielo.br/oai/scielo-oai.php?verb=Identify");
    await probe("SciELO search API", "https://search.scielo.org/?q=ciencia&lang=pt&count=5&from=0&format=json");
    await probe("SciELO search HTML", "https://search.scielo.org/?q=ciencia&lang=pt");

    // ─── 7. FGV — REST works, OAI-PMH fails ───
    console.log("\n━━━ FGV (REST works, OAI-PMH at /oai/request fails) ━━━");
    await probe("OAI registered", "https://repositorio.fgv.br/oai/request?verb=Identify");
    await probe("OAI server path", "https://repositorio.fgv.br/server/oai/request?verb=Identify");
    await probe("REST discover search", "https://repositorio.fgv.br/server/api/discover/search/objects?query=ciencia&dsoType=ITEM&size=5");

    console.log("\n═══════════════════════════════════════════════");
    console.log("     DIAGNOSIS COMPLETE");
    console.log("═══════════════════════════════════════════════\n");
}

main().catch(console.error);
