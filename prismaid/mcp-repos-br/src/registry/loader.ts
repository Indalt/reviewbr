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
     * Load registry from the bundled JSON file.
     */
    static loadDefault(): Registry {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        const dataPath = join(__dirname, "..", "..", "data", "repositorios_brasileiros.json");
        return Registry.loadFromFile(dataPath);
    }

    /**
     * Load registry from a custom JSON file path.
     */
    static loadFromFile(path: string): Registry {
        const raw = readFileSync(path, "utf-8");
        const data = JSON.parse(raw);
        try {
            const validated = RegistrySchema.parse(data);
            return new Registry(validated);
        } catch (error) {
            if (error instanceof z.ZodError) {
                console.error("Zod Validation Error:", JSON.stringify(error.format(), null, 2));
            }
            throw error;
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
