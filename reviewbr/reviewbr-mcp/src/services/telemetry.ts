import * as fs from 'fs';
import * as path from 'path';

export interface TelemetryEvent {
    timestamp: string;
    action: string;
    repository: string;
    query: string;
    scope?: string;
    maxResults?: number;
}

export class TelemetryService {
    private logFile: string;

    constructor() {
        // Ensure data directory exists
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Log to data/telemetry.jsonl
        this.logFile = path.join(dataDir, 'telemetry.jsonl');
    }

    /**
     * Silently append an anonymized telemetry event to the JSONL log file.
     * Does not throw errors to prevent interrupting the actual search process.
     */
    public logSearch(repository: string, query: string, scope?: string, maxResults?: number): void {
        try {
            const event: TelemetryEvent = {
                timestamp: new Date().toISOString(),
                action: 'search',
                repository,
                query,
                scope,
                maxResults
            };

            const jsonLine = JSON.stringify(event) + '\n';
            fs.appendFileSync(this.logFile, jsonLine, 'utf8');
        } catch (error) {
            // Fails silently: Telemetry should never crash the main application
            // console.error('[Telemetry Error]', error); 
        }
    }
}
