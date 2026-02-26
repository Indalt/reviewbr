/**
 * Final validation: tests platform adapters directly + full strategy cascade.
 */
import { BdtdAdapter, ScieloAdapter, UspAdapter } from "../access/platform-adapters.js";
import { OaiPmhClient } from "../access/oai-pmh.js";
import { DSpaceRestClient } from "../access/dspace-rest.js";
import { HtmlScraper } from "../access/html-scraper.js";

// Allow self-signed certs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const query = "bebida fermentada";

interface TestResult {
    name: string;
    method: string;
    status: "ok" | "fail";
    count?: number;
    sample?: string;
    error?: string;
}

const results: TestResult[] = [];

async function test(name: string, method: string, fn: () => Promise<{ count: number; sample: string }>) {
    try {
        const r = await fn();
        console.log(`✅ ${name} [${method}]: ${r.count} results`);
        if (r.sample) console.log(`   Sample: ${r.sample.substring(0, 80)}`);
        results.push({ name, method, status: "ok", count: r.count, sample: r.sample });
    } catch (e: any) {
        console.log(`❌ ${name} [${method}]: ${e.message?.substring(0, 80)}`);
        results.push({ name, method, status: "fail", error: e.message?.substring(0, 80) });
    }
}

async function main() {
    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║  FINAL VALIDATION — Platform Adapters + OAI-PMH Fix    ║");
    console.log(`║  Query: "${query}"                                ║`);
    console.log("╚══════════════════════════════════════════════════════════╝\n");

    const bdtd = new BdtdAdapter();
    const scielo = new ScieloAdapter();
    const usp = new UspAdapter();
    const oai = new OaiPmhClient();
    const rest = new DSpaceRestClient();
    const scraper = new HtmlScraper();

    // 1. BDTD VuFind API
    console.log("━━━ BDTD (VuFind API) ━━━");
    await test("BDTD", "vufind-api", async () => {
        const r = await bdtd.search(query, { maxResults: 5 });
        return { count: r.length, sample: r[0]?.title ?? "" };
    });

    // 2. SciELO
    console.log("\n━━━ SciELO ━━━");
    await test("SciELO", "search-scraper", async () => {
        const r = await scielo.search(query, { maxResults: 5 });
        return { count: r.length, sample: r[0]?.title ?? "" };
    });


    // 3. USP
    console.log("\n━━━ USP (custom PHP) ━━━");
    await test("USP", "result-php", async () => {
        const r = await usp.search(query, { maxResults: 10 });
        return { count: r.length, sample: r[0]?.title ?? "" };
    });

    // 4. FGV OAI-PMH (fixed path: /server/oai/request)
    console.log("\n━━━ FGV (DSpace 7 OAI at /server/) ━━━");
    await test("FGV", "oai-pmh-server", async () => {
        const id = await oai.identify("https://repositorio.fgv.br/server/oai/request");
        return { count: 1, sample: id.repositoryName ?? "" };
    });

    // 5. UFBA (previously working OAI-PMH + scraper)
    console.log("\n━━━ UFBA (OAI-PMH) ━━━");
    await test("UFBA", "oai-pmh", async () => {
        const r = await oai.listRecords("https://repositorio.ufba.br/oai/request", { metadataPrefix: "oai_dc" });
        return { count: r.records.length, sample: r.records[0]?.metadata?.title?.[0] ?? "" };
    });

    // 6. PUCRS OAI-PMH
    console.log("\n━━━ PUCRS (OAI-PMH) ━━━");
    await test("PUCRS", "oai-pmh", async () => {
        const r = await oai.listRecords("https://repositorio.pucrs.br/oai/request", { metadataPrefix: "oai_dc" });
        return { count: r.records.length, sample: r.records[0]?.metadata?.title?.[0] ?? "" };
    });

    // 7. Embrapa OAI-PMH
    console.log("\n━━━ Embrapa (OAI-PMH) ━━━");
    await test("Embrapa", "oai-pmh", async () => {
        const r = await oai.listRecords("http://www.alice.cnptia.embrapa.br/oai/request", { metadataPrefix: "oai_dc" });
        return { count: r.records.length, sample: r.records[0]?.metadata?.title?.[0] ?? "" };
    });

    // 8. FGV REST (was already working)
    console.log("\n━━━ FGV (REST API) ━━━");
    await test("FGV", "rest-search", async () => {
        const r = await rest.search("https://repositorio.fgv.br", query, { size: 3 });
        return { count: r.items.length, sample: r.items[0]?.name ?? "" };
    });

    // 9. IPEA REST
    console.log("\n━━━ IPEA (REST API) ━━━");
    await test("IPEA", "rest-search", async () => {
        const r = await rest.search("http://repositorio.ipea.gov.br", query, { size: 3 });
        return { count: r.items.length, sample: r.items[0]?.name ?? "" };
    });

    // SUMMARY
    console.log("\n╔══════════════════════════════════════════════════════════╗");
    console.log("║                     FINAL SUMMARY                      ║");
    console.log("╚══════════════════════════════════════════════════════════╝\n");

    const ok = results.filter(r => r.status === "ok").length;
    const total = results.length;
    console.log(`Passed: ${ok}/${total}\n`);

    for (const r of results) {
        const icon = r.status === "ok" ? "✅" : "❌";
        console.log(`${icon} ${r.name.padEnd(12)} ${r.method.padEnd(25)} ${r.count ?? 0} results`);
    }
}

main().then(() => process.exit(0)).catch(console.error);
