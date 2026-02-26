/**
 * Central Audit Database Service
 * 
 * Uses SQLite to maintain a system-level audit trail of projects,
 * tool executions, and researcher actions. This is the "Master" layer
 * that remains autonomous and central.
 */

import sqlite3 from "sqlite3";
import { promisify } from "node:util";
import * as path from "node:path";
import * as fs from "node:fs";

export type BlindingType = "NONE" | "SINGLE_BLIND" | "DOUBLE_BLIND";

export interface ProjectMetadata {
    id?: number;
    user_id: string;
    project_name: string;
    project_type: string;
    topic?: string;
    project_path?: string; // Optional for DRAFT projects
    status: "DRAFT" | "ACTIVE" | "LOCKED_EXECUTION";
    blinding?: BlindingType;
    has_meta_analysis?: boolean;
    created_at?: string;
}

export interface AuditLog {
    id?: number;
    project_id?: number;
    tool_name: string;
    action_type: string; // 'search', 'screen', 'dedupe', 'init'
    params: string;      // JSON string
    result_summary: string;
    timestamp?: string;
}

export class DatabaseService {
    private db: sqlite3.Database;
    private dbPath: string;

    constructor() {
        // Database resides in the MCP root data directory
        const dataDir = path.join(process.cwd(), "data");
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        this.dbPath = path.join(dataDir, "system.db");
        this.db = new sqlite3.Database(this.dbPath);
        this.init();
    }

    private init() {
        this.db.serialize(() => {
            // Projects Table (base schema)
            this.db.run(`
                CREATE TABLE IF NOT EXISTS projects (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    project_name TEXT NOT NULL,
                    project_type TEXT NOT NULL,
                    topic TEXT,
                    project_path TEXT,
                    status TEXT DEFAULT 'DRAFT',
                    blinding TEXT DEFAULT 'NONE',
                    has_meta_analysis INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Safe migrations: add columns that may not exist in older DBs
            const migrations = [
                "ALTER TABLE projects ADD COLUMN topic TEXT",
                "ALTER TABLE projects ADD COLUMN status TEXT DEFAULT 'DRAFT'",
                "ALTER TABLE projects ADD COLUMN blinding TEXT DEFAULT 'NONE'",
                "ALTER TABLE projects ADD COLUMN has_meta_analysis INTEGER DEFAULT 0",
            ];
            for (const sql of migrations) {
                this.db.run(sql, (err) => {
                    // Ignore "duplicate column" errors — means column already exists
                    if (err && !err.message.includes("duplicate column")) {
                        console.error(`Migration warning: ${err.message}`);
                    }
                });
            }

            // Audit Logs Table
            this.db.run(`
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_id INTEGER,
                    tool_name TEXT NOT NULL,
                    action_type TEXT NOT NULL,
                    params TEXT,
                    result_summary TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(project_id) REFERENCES projects(id)
                )
            `);

            // Records Table (Central Data Backbone)
            this.db.run(`
                CREATE TABLE IF NOT EXISTS records (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_id INTEGER NOT NULL,
                    source TEXT NOT NULL,
                    identifier TEXT,
                    title TEXT NOT NULL,
                    creators TEXT,
                    description TEXT,
                    date TEXT,
                    url TEXT,
                    doi TEXT,
                    journal TEXT,
                    institution TEXT,
                    keywords TEXT,
                    raw_metadata TEXT,
                    stage TEXT DEFAULT 'raw',
                    is_duplicate_of INTEGER,
                    screening_decision TEXT,
                    screening_reason TEXT,
                    extraction_data TEXT,
                    imported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(project_id) REFERENCES projects(id)
                )
            `);
        });
    }

    /**
     * Register a new project in the central database.
     */
    async registerProject(project: ProjectMetadata): Promise<number> {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                INSERT INTO projects (user_id, project_name, project_type, topic, project_path, status, blinding, has_meta_analysis)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            stmt.run([
                project.user_id,
                project.project_name,
                project.project_type,
                project.topic || null,
                project.project_path || null,
                project.status,
                project.blinding || "NONE",
                project.has_meta_analysis ? 1 : 0
            ], function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
            stmt.finalize();
        });
    }

    /**
     * Update project to ACTIVE status and set its path.
     */
    async activateProject(projectId: number, projectPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                UPDATE projects SET status = 'ACTIVE', project_path = ? WHERE id = ?
            `);
            stmt.run([projectPath, projectId], (err) => {
                if (err) reject(err);
                else resolve();
            });
            stmt.finalize();
        });
    }

    /**
     * Update project to LOCKED_EXECUTION status.
     * This makes the project immutable to configuration changes.
     */
    async lockProject(projectId: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                UPDATE projects SET status = 'LOCKED_EXECUTION' WHERE id = ? AND status != 'LOCKED_EXECUTION'
            `);
            stmt.run([projectId], (err) => {
                if (err) reject(err);
                else resolve();
            });
            stmt.finalize();
        });
    }

    /**
     * Log a tool execution event.
     */
    async logAuditEvent(log: AuditLog): Promise<void> {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                INSERT INTO audit_logs (project_id, tool_name, action_type, params, result_summary)
                VALUES (?, ?, ?, ?, ?)
            `);
            stmt.run([log.project_id || null, log.tool_name, log.action_type, log.params, log.result_summary], (err) => {
                if (err) reject(err);
                else resolve();
            });
            stmt.finalize();
        });
    }

    /**
     * Get all projects for a user.
     */
    async getProjects(userId: string): Promise<ProjectMetadata[]> {
        return new Promise((resolve, reject) => {
            this.db.all("SELECT * FROM projects WHERE user_id = ?", [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows as ProjectMetadata[]);
            });
        });
    }

    /**
     * Get project by ID.
     */
    async getProjectById(id: number): Promise<ProjectMetadata | undefined> {
        return new Promise((resolve, reject) => {
            this.db.get("SELECT * FROM projects WHERE id = ?", [id], (err, row) => {
                if (err) reject(err);
                else resolve(row as ProjectMetadata | undefined);
            });
        });
    }

    /**
     * Find project by path (to associate tool calls with projects).
     */
    async findProjectByPath(projectPath: string): Promise<ProjectMetadata | undefined> {
        return new Promise((resolve, reject) => {
            this.db.get("SELECT * FROM projects WHERE project_path = ?", [projectPath], (err, row) => {
                if (err) reject(err);
                else resolve(row as ProjectMetadata | undefined);
            });
        });
    }

    /**
     * Batch insert records into the database.
     */
    async insertRecords(projectId: number, source: string, records: any[]): Promise<number> {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run("BEGIN TRANSACTION");
                const stmt = this.db.prepare(`
                    INSERT INTO records (
                        project_id, source, identifier, title, creators, description, 
                        date, url, doi, journal, raw_metadata
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);

                for (const r of records) {
                    stmt.run([
                        projectId,
                        source,
                        r.identifier || null,
                        r.title || "Untitled",
                        JSON.stringify(r.creators || []),
                        r.description || null,
                        r.date || null,
                        r.url || null,
                        r.doi || null,
                        r.journal || null,
                        JSON.stringify(r)
                    ]);
                }

                stmt.finalize();
                this.db.run("COMMIT", (err) => {
                    if (err) reject(err);
                    else resolve(records.length);
                });
            });
        });
    }

    /**
     * Update the stage of a record.
     */
    async updateRecordStage(recordId: number, stage: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run("UPDATE records SET stage = ? WHERE id = ?", [stage, recordId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Update screening decision for a record.
     */
    async updateScreening(recordId: number, decision: string, reason: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(
                "UPDATE records SET screening_decision = ?, screening_reason = ?, stage = 'screened' WHERE id = ?",
                [decision, reason, recordId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    /**
     * Get records for a project at a specific stage.
     */
    async getRecords(projectId: number, stage?: string): Promise<any[]> {
        return new Promise((resolve, reject) => {
            let sql = "SELECT * FROM records WHERE project_id = ?";
            const params: any[] = [projectId];
            if (stage) {
                sql += " AND stage = ?";
                params.push(stage);
            }
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    close() {
        this.db.close();
    }
}
