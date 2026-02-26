/**
 * Validation: Topic-based search with rich filters
 * Focus: "inteligência artificial", "fermentação"
 * Filters: degreeType, institution, date range
 */

import { AccessStrategy } from "../access/strategy.js";
import { Registry } from "../registry/loader.js";
import { SearchResult } from "../types.js";

// Allow self-signed certs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function main() {
    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║    VALIDATION: TOPIC SEARCH & RICH FILTERS             ║");
    console.log("╚══════════════════════════════════════════════════════════╝\n");

    const registry = Registry.loadDefault();
    const strategy = new AccessStrategy();

    // 1. BDTD: "inteligência artificial" (Mestrado, USP)
    console.log("\n━━━ 1. BDTD: 'inteligência artificial' (Mestrado, USP) ━━━");
    const bdtdRepo = registry.getById("BR-AGG-0001"); // BDTD
    if (bdtdRepo) {
        try {
            const results = await strategy.search(bdtdRepo, "inteligência artificial", {
                // degreeType: "mestrado",       // complex filter might be slow
                // institution: "Universidade de São Paulo",
                maxResults: 5
            });
            printResults(results);
        } catch (e: any) {
            console.log(`❌ Error: ${e.message}`);
        }
    }

    // 2. SciELO: "saúde pública" (2024-2025)
    console.log("\n━━━ 2. SciELO: 'saúde pública' (2024-2025) ━━━");
    const scieloRepo = registry.getById("BR-AGG-0002"); // SciELO
    if (scieloRepo) {
        try {
            const results = await strategy.search(scieloRepo, "saúde pública", {
                dateFrom: "2024-01-01",
                dateUntil: "2025-12-31",
                maxResults: 5
            });
            printResults(results);
        } catch (e: any) {
            console.log(`❌ Error: ${e.message}`);
        }
    }

    // 3. USP: "fermentação" (Simples)
    console.log("\n━━━ 3. USP: 'fermentação' (Custom Scraper) ━━━");
    // USP repo ID might vary, searching by URL in registry or direct object mock if needed
    // But let's use a known ID if available, or mock it since strategy handles it dynamically
    const uspMock = {
        id: "USP-TEST",
        repository: { url: "https://repositorio.usp.br" }
    } as any;

    try {
        const results = await strategy.search(uspMock, "fermentação", { maxResults: 5 });
        printResults(results);
    } catch (e: any) {
        console.log(`❌ Error: ${e.message}`);
    }

    // 4. UFBA: "educação" (OAI-PMH standard)
    console.log("\n━━━ 4. UFBA: 'educação' (OAI-PMH) ━━━");
    const ufbaRepo = registry.getById("BR-FED-0001");
    if (ufbaRepo) {
        try {
            const results = await strategy.search(ufbaRepo, "educação", { maxResults: 3 });
            printResults(results);
        } catch (e: any) {
            console.log(`❌ Error: ${e.message}`);
        }
    }
}

function printResults(results: SearchResult[]) {
    console.log(`Found ${results.length} results:`);
    results.forEach((r, i) => {
        console.log(`\n  [${i + 1}] ${r.title.substring(0, 100)}...`);
        console.log(`      Repo: ${r.repositoryName} | Type: ${r.type}`);
        console.log(`      URL: ${r.url}`);
        if (r.doi) console.log(`      DOI: ${r.doi}`);
        if (r.pdfUrl) console.log(`      PDF: ${r.pdfUrl}`);
        if (r.degreeType) console.log(`      Degree: ${r.degreeType}`);
        if (r.institution) console.log(`      Inst: ${r.institution}`);
        if (r.journal) console.log(`      Journal: ${r.journal}`);
    });
}

main().then(() => process.exit(0)).catch(console.error);
