
import * as fs from 'node:fs';
import { Buffer } from 'node:buffer';

export interface ValidationResult {
    isValid: boolean;
    mimeType: string;
    error?: string;
}

/**
 * DownloadValidator
 * Ensures research data integrity by checking file headers.
 */
export class DownloadValidator {
    /**
     * Verifies if a file is a valid PDF by checking for the %PDF header.
     * Prevents "Masked HTML" corruption where paywalls are saved as .pdf.
     */
    static validatePdf(filePath: string): ValidationResult {
        try {
            if (!fs.existsSync(filePath)) {
                return { isValid: false, mimeType: 'unknown', error: 'File not found' };
            }

            const stats = fs.statSync(filePath);
            if (stats.size === 0) {
                return { isValid: false, mimeType: 'empty', error: 'File is empty' };
            }

            // Read first 100 bytes to detect HTML vs PDF
            const fd = fs.openSync(filePath, 'r');
            const buffer = Buffer.alloc(100);
            fs.readSync(fd, buffer, 0, 100, 0);
            fs.closeSync(fd);

            const content = buffer.toString('utf8');
            const header = content.slice(0, 4);

            if (header === '%PDF') {
                return { isValid: true, mimeType: 'application/pdf' };
            }

            if (content.toLowerCase().includes('<!doctype html') || content.toLowerCase().includes('<html')) {
                return { isValid: false, mimeType: 'text/html', error: 'Masked HTML detected (Redirect/Paywall)' };
            }

            return { isValid: false, mimeType: 'unknown', error: 'Invalid file header' };

        } catch (e: any) {
            return { isValid: false, mimeType: 'error', error: e.message };
        }
    }
}
