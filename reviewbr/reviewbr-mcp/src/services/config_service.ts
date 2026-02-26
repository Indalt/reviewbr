
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface ProjectConfig {
    geminiModel: string;
    pdfParserVersion: string;
    protocolPath: string;
    isLocked: boolean;
    lastUpdated: string;
}

/**
 * ConfigService
 * Manages project-level configuration to prevent context drift and ensure robustness.
 */
export class ConfigService {
    private static CONFIG_FILENAME = 'research_config.json';
    private configPath: string;

    constructor(projectRootDir: string) {
        this.configPath = path.join(projectRootDir, ConfigService.CONFIG_FILENAME);
    }

    /**
     * Loads the project configuration. Returns defaults if not found.
     */
    load(): ProjectConfig {
        if (!fs.existsSync(this.configPath)) {
            return this.getDefaults();
        }
        try {
            return JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
        } catch (e) {
            console.error("Failed to load config, using defaults.");
            return this.getDefaults();
        }
    }

    /**
     * Saves the project configuration.
     */
    save(config: ProjectConfig): void {
        config.lastUpdated = new Date().toISOString();
        fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    }

    /**
     * Default invariant settings.
     */
    private getDefaults(): ProjectConfig {
        return {
            geminiModel: 'gemini-2.0-flash',
            pdfParserVersion: '1.1.4',
            protocolPath: '00_protocol/protocol.md',
            isLocked: false,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Specific guard for model version.
     */
    getGeminiModel(): string {
        return this.load().geminiModel;
    }
}
