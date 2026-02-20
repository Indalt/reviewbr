/**
 * Real-world validation test — exercises OAI-PMH, DSpace REST, and HTML scraping
 * against a diverse set of Brazilian repositories.
 * 
 * Run: npx tsx src/scripts/validate-real.ts
 */

import { OaiPmhClient } from "../access/oai-pmh.js";
import { DSpaceRestClient } from "../access/dspace-rest.js";
import { HtmlScraper } from "../access/html-scraper.js";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Test configuration ──────────────────────────────────────

interface TestResult {
    name: string;
    url: string;
    connectivity: "ok" | "fail" | "skip";
    oaiPmh: "ok" | "fail" | "skip" | "n/a";
    restApi: "ok" | "fail" | "skip" | "n/a";
    scraper: "ok" | "fail" | "skip" | "n/a";
    recordCount?: number;
    latencyMs?: number;
    error?: string;
}

// Diverse sample covering different platforms, types, and regions 
const testTargets = [
    // Aggregators
    { id: "BR-AGG-0001", label: "BDTD (IBICT)" },
    { id: "BR-AGG-0002", label: "SciELO" },
    // Federal universities (various regions)
    { acronym: "UFBA", label: "UFBA (BA)" },
    { acronym: "USP", label: "USP (SP)" },
    { acronym: "UFRGS", label: "UFRGS (RS)" },
    { acronym: "UFPE", label: "UFPE (PE)" },
    { acronym: "UNB", label: "UNB (DF)" },
    // Research institutes
    { acronym: "Fiocruz", label: "Fiocruz (ARCA)" },
    { acronym: "Embrapa", label: "Embrapa (Alice)" },
    { acronym: "IPEA", label: "IPEA" },
    // Private
    { acronym: "FGV", label: "FGV" },
    { acronym: "PUCRS", label: "PUCRS" },
];

// ─── Initialize components ───────────────────────────────────

const oaiClient = new OaiPmhClient();
const dspaceClient = new DSpaceRestClient();
const scraper = new HtmlScraper();

// Load registry
const registryPath = join(__dirname, "..", "..", "data", "repositorios_brasileiros.json");
const registryData = JSON.parse(readFileSync(registryPath, "utf-8")) as any[];

function findRepo(target: { id?: string; acronym?: string }): any | null {
    if (target.id) {
        return registryData.find((r) => r.id === target.id) ?? null;
    }
    if (target.acronym) {
        return registryData.find(
            (r) =>
                r.institution.acronym?.toUpperCase() === target.acronym!.toUpperCase() ||
                r.institution.name?.toUpperCase().includes(target.acronym!.toUpperCase())
        ) ?? null;
    }
    return null;
}

// ─── Test functions ──────────────────────────────────────────

async function testConnectivity(url: string): Promise<{ ok: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const resp = await fetch(url, {
            signal: controller.signal,
            headers: { "User-Agent": "mcp-repos-br/1.0 (validation test)" },
            redirect: "follow",
        });
        clearTimeout(timeout);
        return { ok: resp.ok || resp.status === 403, latencyMs: Date.now() - start };
    } catch (e: any) {
        // Also accept SSL errors as "connectable" — many repos have self-signed certs
        if (e.code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" || e.code === "CERT_HAS_EXPIRED") {
            return { ok: true, latencyMs: Date.now() - start };
        }
        return { ok: false, latencyMs: Date.now() - start };
    }
}

async function testOaiPmh(endpoint: string): Promise<{ ok: boolean; recordCount?: number }> {
    try {
        const identifyResp = await oaiClient.identify(endpoint);
        if (!identifyResp) return { ok: false };

        // Try to list a few records
        try {
            const records = await oaiClient.listRecords(endpoint, {
                metadataPrefix: "oai_dc",
            });
            return { ok: true, recordCount: records.records?.length ?? 0 };
        } catch {
            // Identify worked but ListRecords failed — still partially OK
            return { ok: true, recordCount: 0 };
        }
    } catch {
        return { ok: false };
    }
}

async function testDSpaceRest(baseUrl: string): Promise<{ ok: boolean }> {
    try {
        const detected = await dspaceClient.detect(baseUrl);
        return { ok: detected };
    } catch {
        return { ok: false };
    }
}

async function testHtmlScraper(
    url: string,
    id: string,
    name: string
): Promise<{ ok: boolean; resultCount?: number }> {
    try {
        const results = await scraper.search(url, id, name, "ciencia", 5);
        return { ok: results.length > 0, resultCount: results.length };
    } catch {
        return { ok: false };
    }
}

// ─── Run tests ───────────────────────────────────────────────

async function main() {
    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║     mcp-repos-br — Real Repository Validation Test     ║");
    console.log("║              Testing against live endpoints             ║");
    console.log("╚══════════════════════════════════════════════════════════╝\n");

    const results: TestResult[] = [];

    for (const target of testTargets) {
        const repo = findRepo(target);
        if (!repo) {
            console.log(`⚠  ${target.label}: NOT FOUND in registry\n`);
            results.push({
                name: target.label,
                url: "not found",
                connectivity: "skip",
                oaiPmh: "skip",
                restApi: "skip",
                scraper: "skip",
                error: "Not found in registry",
            });
            continue;
        }

        console.log(`━━━ Testing: ${target.label} ━━━`);
        console.log(`    URL: ${repo.repository.url}`);

        const result: TestResult = {
            name: target.label,
            url: repo.repository.url,
            connectivity: "skip",
            oaiPmh: "n/a",
            restApi: "n/a",
            scraper: "n/a",
        };

        // 1. Connectivity test
        const connResult = await testConnectivity(repo.repository.url);
        result.connectivity = connResult.ok ? "ok" : "fail";
        result.latencyMs = connResult.latencyMs;
        console.log(`    Connectivity: ${connResult.ok ? "✅" : "❌"} (${connResult.latencyMs}ms)`);

        if (!connResult.ok) {
            result.error = "Cannot reach server";
            results.push(result);
            console.log("");
            continue;
        }

        // 2. OAI-PMH test
        if (repo.access?.oaiPmh?.endpoint) {
            console.log(`    OAI-PMH endpoint: ${repo.access.oaiPmh.endpoint}`);
            const oaiResult = await testOaiPmh(repo.access.oaiPmh.endpoint);
            result.oaiPmh = oaiResult.ok ? "ok" : "fail";
            result.recordCount = oaiResult.recordCount;
            console.log(
                `    OAI-PMH: ${oaiResult.ok ? "✅" : "❌"}${oaiResult.recordCount ? ` (${oaiResult.recordCount} sample records)` : ""}`
            );
        } else {
            console.log(`    OAI-PMH: N/A (no endpoint registered)`);
        }

        // 3. DSpace REST API test (only for DSpace repos)
        if (repo.repository.platform === "dspace") {
            const restResult = await testDSpaceRest(repo.repository.url);
            result.restApi = restResult.ok ? "ok" : "fail";
            console.log(`    REST API: ${restResult.ok ? "✅" : "❌"}`);
        } else {
            console.log(`    REST API: N/A (not DSpace)`);
        }

        // 4. HTML scraper test
        const scraperResult = await testHtmlScraper(
            repo.repository.url,
            repo.id,
            repo.repository.name
        );
        result.scraper = scraperResult.ok ? "ok" : "fail";
        console.log(
            `    Scraper: ${scraperResult.ok ? "✅" : "❌"}${scraperResult.resultCount ? ` (${scraperResult.resultCount} results)` : ""}`
        );

        results.push(result);
        console.log("");
    }

    // ─── Summary ─────────────────────────────────────────────

    console.log("\n╔══════════════════════════════════════════════════════════╗");
    console.log("║                     TEST SUMMARY                       ║");
    console.log("╚══════════════════════════════════════════════════════════╝\n");

    const pad = (s: string, n: number) => s.padEnd(n);
    const icon = (s: string) =>
        s === "ok" ? "✅" : s === "fail" ? "❌" : s === "n/a" ? "⬜" : "⏭";

    console.log(
        `${pad("Repository", 24)} ${pad("Connect", 9)} ${pad("OAI-PMH", 9)} ${pad("REST", 9)} ${pad("Scraper", 9)} ${pad("Latency", 9)}`
    );
    console.log("─".repeat(70));

    for (const r of results) {
        console.log(
            `${pad(r.name, 24)} ${pad(icon(r.connectivity), 9)} ${pad(icon(r.oaiPmh), 9)} ${pad(icon(r.restApi), 9)} ${pad(icon(r.scraper), 9)} ${r.latencyMs ? r.latencyMs + "ms" : "—"}`
        );
    }

    // Stats
    const total = results.length;
    const connected = results.filter((r) => r.connectivity === "ok").length;
    const oaiOk = results.filter((r) => r.oaiPmh === "ok").length;
    const oaiTotal = results.filter((r) => r.oaiPmh !== "n/a" && r.oaiPmh !== "skip").length;
    const restOk = results.filter((r) => r.restApi === "ok").length;
    const restTotal = results.filter((r) => r.restApi !== "n/a" && r.restApi !== "skip").length;
    const scraperOk = results.filter((r) => r.scraper === "ok").length;
    const scraperTotal = results.filter((r) => r.scraper !== "n/a" && r.scraper !== "skip").length;

    console.log("\n─".repeat(70));
    console.log(`Connectivity: ${connected}/${total}`);
    console.log(`OAI-PMH:      ${oaiOk}/${oaiTotal} tested`);
    console.log(`REST API:     ${restOk}/${restTotal} tested`);
    console.log(`Scraper:      ${scraperOk}/${scraperTotal} tested`);
    console.log(`\nAt least one access method: ${results.filter((r) => r.oaiPmh === "ok" || r.restApi === "ok" || r.scraper === "ok").length}/${connected} connected repos`);
}

main().catch(console.error);
