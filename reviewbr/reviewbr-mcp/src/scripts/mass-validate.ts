/**
 * Mass validation script.
 * Validates all registered repositories.
 * 
 * Strategy:
 * 1. Load registry (138 repos).
 * 2. For each repo, attempt a simple search query "educação" (max 1 results).
 * 3. With 10s timeout per repo.
 * 4. Record success/failure/latency.
 * 5. Generate validation-report.md in current directory.
 */

import { Registry } from "../registry/loader.js";
import { AccessStrategy } from "../access/strategy.js";
import { RepositoryEntry } from "../types.js";
import * as fs from "node:fs/promises";

// Disable SSL verification for mass validation (many old university certs)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

interface ValidationResult {
    id: string;
    name: string;
    url: string;
    status: "online" | "offline" | "slow";
    latency: number;
    method: string;
    error?: string;
}

async function validateRepo(repo: RepositoryEntry, strategy: AccessStrategy): Promise<ValidationResult> {
    const start = Date.now();
    try {
        // Enforce strict 15s timeout
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Validation timeout (15s)")), 15000)
        );

        const searchPromise = strategy.search(repo, "educação", { maxResults: 1 });

        const results = await Promise.race([searchPromise, timeoutPromise]);

        const latency = Date.now() - start;

        if (results.length > 0) {
            return {
                id: repo.id,
                name: repo.repository.name,
                url: repo.repository.url,
                status: latency > 5000 ? "slow" : "online",
                latency,
                method: results[0].accessMethod,
            };
        } else {
            return {
                id: repo.id,
                name: repo.repository.name,
                url: repo.repository.url,
                status: "online",
                latency,
                method: "unknown (0 results)",
                error: "No results found for 'educação'",
            };
        }
    } catch (e: any) {
        return {
            id: repo.id,
            name: repo.repository.name,
            url: repo.repository.url,
            status: "offline",
            latency: Date.now() - start,
            method: "failed",
            error: e.message || "Unknown error",
        };
    }
}

async function main() {
    console.log("🚀 Starting Mass Validation of Brazilian Academic Repositories...");

    const registry = Registry.loadDefault();
    const strategy = new AccessStrategy();
    const repos = registry.getAll();

    console.log(`Found ${repos.length} repositories.`);

    const results: ValidationResult[] = [];
    const CONCURRENCY = 5;

    // Process in batches
    for (let i = 0; i < repos.length; i += CONCURRENCY) {
        const batch = repos.slice(i, i + CONCURRENCY);
        console.log(`Processing batch ${i + 1}-${Math.min(i + CONCURRENCY, repos.length)}...`);

        const batchResults = await Promise.all(
            batch.map(repo => validateRepo(repo, strategy))
        );

        results.push(...batchResults);
    }

    // Generate Report
    const online = results.filter(r => r.status === "online" || r.status === "slow");
    const offline = results.filter(r => r.status === "offline");

    const report = `
# Relatório de Validação de Repositórios

**Data:** ${new Date().toISOString()}
**Total:** ${results.length}
**Online:** ${online.length} (${((online.length / results.length) * 100).toFixed(1)}%)
**Offline:** ${offline.length} (${((offline.length / results.length) * 100).toFixed(1)}%)

## Resumo por Estado

${generateStateSummary(results)}

## Repositórios Offline (${offline.length})

| ID | Nome | Erro |
|----|------|------|
${offline.map(r => `| ${r.id} | ${r.name} | ${r.error} |`).join("\n")}

## Detalhes (Online)

| ID | Nome | Latência | Método |
|----|------|----------|--------|
${online.map(r => `| ${r.id} | ${r.name} | ${r.latency}ms | ${r.method} |`).join("\n")}
`;

    await fs.writeFile("validation_report.md", report);
    console.log("✅ Validation complete! Report saved to validation_report.md");
}

function generateStateSummary(results: ValidationResult[]): string {
    // This requires access to repo state, which isn't in ValidationResult.
    // Simplifying report for now.
    return "Ver detalhes na tabela abaixo.";
}

main().catch(console.error);
