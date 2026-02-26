/**
 * Registry loader — reads the JSON repository database,
 * validates with Zod, and provides query methods.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { z } from "zod";
import { RepositoryEntrySchema, type RepositoryEntry, type Platform, type InstitutionType } from "../types.js";

const RegistrySchema = z.array(RepositoryEntrySchema);

export class Registry {
    private entries: RepositoryEntry[];

    constructor(entries: RepositoryEntry[]) {
        this.entries = entries;
    }

    /**
     * Load registry from the bundled JSON files (BR + International).
     */
    static loadDefault(): Registry {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        const brPath = join(__dirname, "..", "..", "data", "sources", "repositorios_brasileiros.json");
        const intPath = join(__dirname, "..", "..", "data", "sources", "bases_internacionais.json");

        try {
            const brRaw = readFileSync(brPath, "utf-8");
            const intRaw = readFileSync(intPath, "utf-8");

            const brData = JSON.parse(brRaw);
            const intData = JSON.parse(intRaw);

            if (!Array.isArray(brData) || !Array.isArray(intData)) {
                throw new Error("One or more repository files are not JSON arrays.");
            }

            const combined = [...brData, ...intData];

            console.log(`[Registry] Validating ${combined.length} entries...`);
            const validated = RegistrySchema.parse(combined);

            console.log(`[Registry] Successfully loaded ${validated.length} repositories (${brData.length} BR, ${intData.length} INT).`);
            return new Registry(validated);
        } catch (error) {
            if (error instanceof z.ZodError) {
                console.error("[Registry] Validation Error:", JSON.stringify(error.format(), null, 2));
            } else {
                console.error("[Registry] Load Error:", error);
            }
            // Fallback to BR only but without recursion risk
            console.warn("[Registry] Falling back to BR repositories only.");
            return Registry.loadBrOnly(brPath);
        }
    }

    private static loadBrOnly(path: string): Registry {
        try {
            const data = JSON.parse(readFileSync(path, "utf-8"));
            return new Registry(RegistrySchema.parse(data));
        } catch (e) {
            console.error("[Registry] Fatal: Failed to load BR fallback.", e);
            return new Registry([]);
        }
    }

    /**
     * Load registry from a custom JSON file path.
     */
    static loadFromFile(path: string): Registry {
        try {
            const raw = readFileSync(path, "utf-8");
            const data = JSON.parse(raw);
            const validated = RegistrySchema.parse(data);
            return new Registry(validated);
        } catch (error) {
            if (error instanceof z.ZodError) {
                console.error("[Registry] Zod Validation Error:", JSON.stringify(error.format(), null, 2));
            }
            console.error("[Registry] Error loading from file:", error);
            return new Registry([]);
        }
    }

    getAll(): RepositoryEntry[] {
        return [...this.entries];
    }

    getById(id: string): RepositoryEntry | undefined {
        return this.entries.find((e) => e.id === id);
    }

    getByState(uf: string): RepositoryEntry[] {
        return this.entries.filter((e) => e.institution.state.toUpperCase() === uf.toUpperCase());
    }

    getByPlatform(platform: Platform): RepositoryEntry[] {
        return this.entries.filter((e) => e.repository.platform === platform);
    }

    getByInstitutionType(type: InstitutionType): RepositoryEntry[] {
        return this.entries.filter((e) => e.institution.type === type);
    }

    getActive(): RepositoryEntry[] {
        return this.entries.filter((e) => e.status === "active");
    }

    getWithOaiPmh(): RepositoryEntry[] {
        return this.entries.filter((e) => e.access.oaiPmh.available && e.access.oaiPmh.endpoint);
    }

    /**
     * Stats summary for the repos://stats resource.
     */
    getStats(): Record<string, unknown> {
        const byType: Record<string, number> = {};
        const byState: Record<string, number> = {};
        const byPlatform: Record<string, number> = {};
        let oaiAvailable = 0;
        let oaiVerified = 0;

        for (const e of this.entries) {
            byType[e.institution.type] = (byType[e.institution.type] ?? 0) + 1;
            byState[e.institution.state] = (byState[e.institution.state] ?? 0) + 1;
            byPlatform[e.repository.platform] = (byPlatform[e.repository.platform] ?? 0) + 1;
            if (e.access.oaiPmh.available) oaiAvailable++;
            if (e.access.oaiPmh.verified) oaiVerified++;
        }

        return {
            total: this.entries.length,
            active: this.getActive().length,
            byInstitutionType: byType,
            byState,
            byPlatform,
            oaiPmh: { available: oaiAvailable, verified: oaiVerified },
        };
    }

    count(): number {
        return this.entries.length;
    }
}
