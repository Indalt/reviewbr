
import { Registry } from "../registry/loader.js";
import { AccessStrategy } from "../access/strategy.js";
import { SearchOptions, RepositoryEntry } from "../types.js";
import * as fs from "node:fs/promises";
import * as path from "node:path";

// Disable SSL verification for mass scraping
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

interface RepoResult {
    id: string;
    name: string;
    status: "found" | "not_found" | "error";
    count: number;
    error?: string;
    sampleTitle?: string;
}

async function searchRepo(repo: RepositoryEntry, strategy: AccessStrategy, query: string): Promise<{ results: any[], status: RepoResult }> {
    try {
        // Timeout wrapper (20s)
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Search timeout (20s)")), 20000)
        );

        const searchPromise = strategy.search(repo, query, { maxResults: 3 });

        const results = await Promise.race([searchPromise, timeoutPromise]) as any[];

        return {
            results,
            status: {
                id: repo.id,
                name: repo.repository.name,
                status: results.length > 0 ? "found" : "not_found",
                count: results.length,
                sampleTitle: results[0]?.title
            }
        };

    } catch (e: any) {
        return {
            results: [],
            status: {
                id: repo.id,
                name: repo.repository.name,
                status: "error",
                count: 0,
                error: e.message || "Unknown error"
            }
        };
    }
}

async function main() {
    console.log("🚀 Starting Exhaustive 'Caju' Search across all repositories...");

    const registry = Registry.loadDefault();
    const strategy = new AccessStrategy();
    const repos = registry.getAll();
    const query = "caju";

    console.log(`Target: ${repos.length} repositories.`);

    const allResults: any[] = [];
    const stats: RepoResult[] = [];
    const CONCURRENCY = 5;

    for (let i = 0; i < repos.length; i += CONCURRENCY) {
        const batch = repos.slice(i, i + CONCURRENCY);
        console.log(`Processing batch ${i + 1}-${Math.min(i + CONCURRENCY, repos.length)}...`);

        const batchPromises = batch.map(repo => searchRepo(repo, strategy, query));
        const batchOutputs = await Promise.all(batchPromises);

        for (const out of batchOutputs) {
            allResults.push(...out.results);
            stats.push(out.status);
        }
    }

    console.log("\n✅ Search complete.");

    // 1. Save JSON (Prismaid Format)
    const jsonOutput = {
        query: query,
        timestamp: new Date().toISOString(),
        strategy: "exhaustive-mcp-repos-br",
        total_results: allResults.length,
        results: allResults.map(r => ({
            repo_id: r.repositoryId,
            repo_name: r.repositoryName,
            title: r.title,
            url: r.url,
            doi: r.doi || null,
            pdf_url: r.pdfUrl || null,
            published_date: r.date,
            type: r.type,
            creators: r.creators,
            scraped_at: new Date().toISOString()
        }))
    };

    const outDir = path.resolve("c:\\Users\\Vicente\\prismaid\\prismaid\\projects\\buscas");
    const jsonPath = path.join(outDir, "caju.json");
    await fs.writeFile(jsonPath, JSON.stringify(jsonOutput, null, 2));
    console.log(`Saved JSON: ${jsonPath}`);

    // 2. Generate Markdown Report
    const found = stats.filter(s => s.status === "found");
    const notFound = stats.filter(s => s.status === "not_found");
    const errors = stats.filter(s => s.status === "error");

    let report = `# Relatório de Busca Exaustiva: "${query}"\n\n`;
    report += `**Data:** ${new Date().toISOString()}\n`;
    report += `**Repositórios Verificados:** ${repos.length}\n`;
    report += `**Artigos Encontrados:** ${allResults.length}\n\n`;

    report += `## Resumo\n`;
    report += `- ✅ **Sucesso (com resultados):** ${found.length} repositórios\n`;
    report += `- ⚠️ **Sem resultados (online):** ${notFound.length} repositórios\n`;
    report += `- ❌ **Erro/Timeout:** ${errors.length} repositórios\n\n`;

    report += `## Detalhes por Repositório\n\n`;
    report += `| Status | Repositório | Artigos | Exemplo |\n`;
    report += `|---|---|---|---|\n`;

    // Sort: Found first, then Not Found, then Error
    const sortedStats = [...found, ...notFound, ...errors];

    for (const s of sortedStats) {
        let icon = "❌";
        if (s.status === "found") icon = "✅";
        if (s.status === "not_found") icon = "⚠️";

        const example = s.sampleTitle ? `"${s.sampleTitle.substring(0, 50)}..."` : (s.error || "-");
        report += `| ${icon} | **${s.name}** | ${s.count} | ${example} |\n`;
    }

    const reportPath = path.join(outDir, "caju_report.md");
    await fs.writeFile(reportPath, report);
    console.log(`Saved Report: ${reportPath}`);
}

main().catch(console.error);
