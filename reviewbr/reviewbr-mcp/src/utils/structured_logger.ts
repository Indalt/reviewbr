/**
 * Structured logger for scientific reproducibility.
 * Every external API call, error, and significant event is logged
 * with timestamp, service name, severity level, and context.
 * 
 * Uses JSON Lines format (.jsonl) for atomic append operations.
 */

import * as fs from "node:fs";
import * as path from "node:path";

export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    service: string;
    message: string;
    context?: Record<string, unknown>;
}

/**
 * Append-only structured logger.
 * Each log entry is a single JSON line, safe for concurrent writes.
 */
export class StructuredLogger {
    private logDir: string;
    private logFile: string;

    constructor(logDir?: string) {
        this.logDir = logDir ?? path.resolve(process.cwd(), "logs");
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
        const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        this.logFile = path.join(this.logDir, `reviewbr_${date}.jsonl`);
    }

    private write(level: LogLevel, service: string, message: string, context?: Record<string, unknown>) {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            service,
            message,
            ...(context ? { context } : {}),
        };
        const line = JSON.stringify(entry) + "\n";

        // Atomic append — safe without locks for single-process use
        fs.appendFileSync(this.logFile, line, "utf-8");

        // Also emit to stderr for real-time observability (MCP uses stdout for protocol)
        if (level === "ERROR") {
            console.error(`[${entry.timestamp}] ❌ ${service}: ${message}`);
        } else if (level === "WARN") {
            console.error(`[${entry.timestamp}] ⚠️  ${service}: ${message}`);
        }
    }

    info(service: string, message: string, context?: Record<string, unknown>) {
        this.write("INFO", service, message, context);
    }

    warn(service: string, message: string, context?: Record<string, unknown>) {
        this.write("WARN", service, message, context);
    }

    error(service: string, message: string, context?: Record<string, unknown>) {
        this.write("ERROR", service, message, context);
    }

    debug(service: string, message: string, context?: Record<string, unknown>) {
        this.write("DEBUG", service, message, context);
    }

    /**
     * Log an external API call result.
     * Convenience method for the common pattern of logging search/API interactions.
     */
    apiCall(service: string, params: {
        endpoint: string;
        query?: string;
        statusCode?: number;
        resultCount?: number;
        durationMs?: number;
        error?: string;
    }) {
        const level: LogLevel = params.error ? "ERROR" : "INFO";
        const message = params.error
            ? `API FALHA: ${params.endpoint} → ${params.error}`
            : `API OK: ${params.endpoint} → ${params.resultCount ?? "?"} resultados (${params.durationMs ?? "?"}ms)`;

        this.write(level, service, message, params as unknown as Record<string, unknown>);
    }
}

// ─── Singleton for the application ──────────────────────────
export const logger = new StructuredLogger();
