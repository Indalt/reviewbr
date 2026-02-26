
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * ProtocolGuard
 * Protects critical files from accidental modification or deletion.
 */
export class ProtocolGuard {
    private static CRITICAL_FILES = [
        'protocol.md',
        'registration.json',
        'incident_log.md',
        'search_history.json'
    ];

    /**
     * Checks if a file is critical and locked.
     */
    static isProtected(filePath: string): boolean {
        const basename = path.basename(filePath);
        return this.CRITICAL_FILES.includes(basename);
    }

    /**
     * Safely writes to a file, requiring an explicit override for protected files.
     */
    static safeWrite(filePath: string, content: string, force: boolean = false): void {
        if (this.isProtected(filePath) && !force && fs.existsSync(filePath)) {
            throw new Error(`GUARD VIOLATION: File '${filePath}' is protected. Use 'force: true' to overwrite.`);
        }

        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(filePath, content);
    }

    /**
     * Safely deletes a file.
     */
    static safeDelete(filePath: string, force: boolean = false): void {
        if (this.isProtected(filePath) && !force) {
            throw new Error(`GUARD VIOLATION: Attempting to delete protected file '${filePath}'.`);
        }
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
}
