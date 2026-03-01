import * as fs from "node:fs";
import * as path from "node:path";
import { DownloadValidator } from "../utils/download_validator.js";
import { fetchBuffer } from "../utils/http.js";
import pdfParse from "pdf-parse";

export class PdfExtractorService {

    /**
     * Tries to download and extract text from a PDF URL.
     * Uses the project path to save the original PDF and the extracted text.
     */
    async downloadAndExtract(url: string, documentId: string, projectPath: string): Promise<{ success: boolean; textPath?: string; error?: string }> {
        const fulltextDir = path.join(process.cwd(), projectPath, "02_fulltext");
        if (!fs.existsSync(fulltextDir)) fs.mkdirSync(fulltextDir, { recursive: true });

        const pdfPath = path.join(fulltextDir, `${documentId}.pdf`);
        const textPath = path.join(fulltextDir, `${documentId}.txt`);

        // Skip if already extracted
        if (fs.existsSync(textPath)) {
            return { success: true, textPath };
        }

        try {
            console.log(`[ReviewBR] Downloading PDF: ${url}`);
            const { buffer, contentType } = await fetchBuffer(url, { timeout: 30000 });

            // Save the raw buffer temporarily to validate
            fs.writeFileSync(pdfPath, Buffer.from(buffer));

            const validation = DownloadValidator.validatePdf(pdfPath);

            if (validation.isValid) {
                // Native PDF - Extract Text
                try {
                    const dataBuffer = fs.readFileSync(pdfPath);
                    const data = await pdfParse(dataBuffer);

                    const extractedText = `[NATIVE PDF EXTRACTED]\nDocument ID: ${documentId}\nURL: ${url}\nPages: ${data.numpages}\n\n${data.text}`;
                    fs.writeFileSync(textPath, extractedText);
                    return { success: true, textPath };
                } catch (e: any) {
                    return { success: false, error: "Text extraction failed: " + e.message };
                }
            } else {
                // It's Masked HTML or Corrupted.
                fs.unlinkSync(pdfPath); // Cleanup fake PDF

                if (validation.mimeType === 'text/html') {
                    // Try to extract basic text from HTML
                    const htmlContent = Buffer.from(buffer).toString('utf-8');
                    const strippedText = htmlContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                        .replace(/<[^>]*>?/gm, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                    fs.writeFileSync(textPath, `[MASKED HTML EXTRACTED]\nDocument ID: ${documentId}\nOriginal URL: ${url}\n\n${strippedText.substring(0, 15000)}...`);
                    return { success: true, textPath };
                }

                return { success: false, error: validation.error || "Invalid file format." };
            }

        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Smart Chunking: Reads the extracted text and pulls out Key Sections (Abstract, Intro, Method, Conclusion)
     * so it doesn't blow up the LLM context window.
     */
    async smartChunk(textPath: string): Promise<string> {
        if (!fs.existsSync(textPath)) return "";
        let content = fs.readFileSync(textPath, "utf-8");

        // Very basic Smart Chunking logic:
        // We limit to first 15000 chars (usually covers Abstract, Intro, and parts of Method)
        // and the last 5000 chars (usually covers Conclusion).

        if (content.length < 20000) {
            return content;
        }

        const head = content.substring(0, 15000);
        const tail = content.substring(content.length - 5000);

        return head + "\n\n[... SMART CHUNK OMITTED FOR LLM CONTEXT ECONOMY ...]\n\n" + tail;
    }
}
