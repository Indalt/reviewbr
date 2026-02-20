/**
 * Utility script to convert repositorios_brasileiros.csv to JSON.
 * Run with: npx tsx src/scripts/convert-csv.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath = join(__dirname, "..", "..", "..", "projects", "data_mining", "master_register", "repositorios_brasileiros.csv");
const outputPath = join(__dirname, "..", "..", "data", "repositorios_brasileiros.json");

const csv = readFileSync(csvPath, "utf-8");
const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
const headers = lines[0]!.split(",");

function mapInstitutionType(tipo: string, categoria: string): string {
    const cat = categoria.toLowerCase();
    if (cat.includes("instituto federal") || tipo.toLowerCase().includes("instituto federal"))
        return "instituto_federal";
    if (cat.includes("pública federal")) return "federal";
    if (cat.includes("pública estadual")) return "estadual";
    if (cat.includes("comunitária")) return "comunitaria";
    return "privada";
}

function mapPlatform(raw: string): string {
    const lower = raw.toLowerCase();
    if (lower.includes("dspace")) return "dspace";
    if (lower.includes("tede")) return "tede";
    if (lower.includes("ojs")) return "ojs";
    return "other";
}

function mapContentType(raw: string): string {
    const lower = raw.toLowerCase();
    if (lower.includes("tese") || lower === "teses" || lower === "teses/dissertações") return "theses";
    if (lower.includes("artigo") || lower === "artigos") return "articles";
    return "mixed";
}

function guessSearchEndpoints(platform: string, url: string): string[] {
    if (platform === "dspace") {
        return ["/discover", "/simple-search", "/jspui/simple-search", "/xmlui/simple-search"];
    }
    if (platform === "tede") {
        return ["/tede/simple-search", "/simple-search"];
    }
    return ["/simple-search"];
}

const entries = [];

for (let i = 1; i < lines.length; i++) {
    // Simple CSV parse (handles quoted fields)
    const row: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of lines[i]!) {
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
            row.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }
    row.push(current.trim());

    if (row.length < 10) continue;

    const id = row[0]!;
    const platform = mapPlatform(row[10] ?? "");
    const oaiEndpoint = (row[18] ?? "").trim();
    const oaiAvailable = (row[17] ?? "").toLowerCase() === "sim";

    entries.push({
        id,
        institution: {
            name: row[1] ?? "",
            acronym: row[2] ?? "",
            type: mapInstitutionType(row[3] ?? "", row[4] ?? ""),
            state: row[5] ?? "",
            city: row[6] ?? "",
        },
        repository: {
            name: row[8] ?? "",
            url: row[9] ?? "",
            platform,
            contentType: mapContentType(row[11] ?? ""),
        },
        access: {
            oaiPmh: {
                available: oaiAvailable,
                endpoint: oaiEndpoint || null,
                verified: (row[19] ?? "").toLowerCase() === "sim",
                lastVerified: (row[28] ?? "") || null,
            },
            restApi: {
                available: platform === "dspace",
                endpoint: platform === "dspace" ? "/server/api" : null,
                version: platform === "dspace" ? 7 : null,
            },
            searchEndpoints: guessSearchEndpoints(platform, row[9] ?? ""),
        },
        status: "active" as const,
    });
}

writeFileSync(outputPath, JSON.stringify(entries, null, 2), "utf-8");
console.log(`Converted ${entries.length} entries to ${outputPath}`);
