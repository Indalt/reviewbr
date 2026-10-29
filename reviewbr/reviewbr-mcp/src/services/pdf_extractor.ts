import * as fs from "node:fs";
import * as path from "node:path";
import { DownloadValidator } from "../utils/download_validator.js";
import { fetchBuffer } from "../utils/http.js";
import { logger } from "../utils/structured_logger.js";
import pdfParse from "pdf-parse";

export class PdfExtractorService {

    /**
     * Tries to download and extract text from a PDF URL.
     * If the URL returns a landing page (HTML), the system resolves
     * the actual PDF link from the HTML and retries the download.
     */
    async downloadAndExtract(url: string, documentId: string, projectPath: string): Promise<{ success: boolean; textPath?: string; error?: string }> {
        // Contrato unificado: PDF em 03_screening/pdfs; TEXTO em 04_extraction/fulltext
        // (corpus lido pelo rag_index_corpus; proveniência resolvida via included.json pelo id).
        const base = path.isAbsolute(projectPath) ? projectPath : path.join(process.cwd(), projectPath);
        const pdfDir = path.join(base, "03_screening", "pdfs");
        const textDir = path.join(base, "04_extraction", "fulltext");
        fs.mkdirSync(pdfDir, { recursive: true });
        fs.mkdirSync(textDir, { recursive: true });

        const pdfPath = path.join(pdfDir, `${documentId}.pdf`);
        const textPath = path.join(textDir, `${documentId}.txt`);

        // Skip if already extracted as NATIVE PDF (re-process MASKED HTML)
        if (fs.existsSync(textPath)) {
            const existing = fs.readFileSync(textPath, "utf-8");
            if (existing.startsWith("[NATIVE PDF EXTRACTED]")) {
                return { success: true, textPath };
            }
            // If it was MASKED HTML, try again with the resolver
            logger.info("PDF_EXTRACTOR", `Re-tentando download para ${documentId} (anteriormente obteve HTML)`);
        }

        try {
            logger.info("PDF_EXTRACTOR", `Baixando: ${url}`);
            const { buffer, contentType } = await fetchBuffer(url, { timeout: 30000 });

            // Save the raw buffer temporarily to validate
            fs.writeFileSync(pdfPath, Buffer.from(buffer));

            const validation = DownloadValidator.validatePdf(pdfPath);

            if (validation.isValid) {
                return this.extractFromPdf(pdfPath, textPath, documentId, url);
            }

            // It's not a PDF — probably a landing page HTML
            fs.unlinkSync(pdfPath); // Cleanup fake PDF

            if (validation.mimeType === 'text/html') {
                const htmlContent = Buffer.from(buffer).toString('utf-8');

                // ─── PDF Link Resolver ─────────────────────────
                // Try to find the real PDF link inside the HTML
                const resolvedUrl = this.resolvePdfLink(htmlContent, url);

                if (resolvedUrl) {
                    logger.info("PDF_EXTRACTOR", `Link resolver: encontrou PDF real → ${resolvedUrl}`);

                    try {
                        const { buffer: pdfBuffer } = await fetchBuffer(resolvedUrl, { timeout: 45000 });
                        fs.writeFileSync(pdfPath, Buffer.from(pdfBuffer));

                        const pdfValidation = DownloadValidator.validatePdf(pdfPath);
                        if (pdfValidation.isValid) {
                            return this.extractFromPdf(pdfPath, textPath, documentId, resolvedUrl);
                        }

                        // Resolved link also wasn't a real PDF
                        fs.unlinkSync(pdfPath);
                        logger.warn("PDF_EXTRACTOR", `Link resolvido não é PDF válido: ${resolvedUrl}`);
                    } catch (resolveErr: any) {
                        logger.warn("PDF_EXTRACTOR", `Falha ao baixar link resolvido: ${resolveErr.message}`);
                    }
                } else {
                    logger.info("PDF_EXTRACTOR", `Nenhum link PDF encontrado na landing page de ${documentId}`);
                }

                // Fallback: extract text from the HTML landing page
                const strippedText = htmlContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/<[^>]*>?/gm, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                fs.writeFileSync(textPath, `[MASKED HTML EXTRACTED]\nDocument ID: ${documentId}\nOriginal URL: ${url}\n\n${strippedText.substring(0, 15000)}...`);
                return { success: true, textPath };
            }

            return { success: false, error: validation.error || "Invalid file format." };

        } catch (error: any) {
            logger.error("PDF_EXTRACTOR", `Erro ao baixar ${documentId}`, { error: error.message, url });
            return { success: false, error: error.message };
        }
    }

    /**
     * PDF Link Resolver.
     * Parses an HTML landing page to find the actual PDF download link.
     * Covers TEDE/DSpace, USP BDTD, and generic repository patterns.
     */
    private resolvePdfLink(html: string, baseUrl: string): string | null {
        // Priority-ordered patterns for finding PDF links in repository pages
        const patterns = [
            // DSpace/TEDE bitstream links (most common in Brazilian repos)
            /href\s*=\s*["']([^"']*bitstream[^"']*\.pdf[^"']*)/gi,
            // Direct .pdf file links
            /href\s*=\s*["']([^"']*\.pdf)["']/gi,
            // USP-style download links  
            /href\s*=\s*["']([^"']*\/tde-[^"']*)/gi,
            // Generic "download" or "baixar" links that might lead to PDF
            /href\s*=\s*["']([^"']*(?:download|baixar|retrieve|getfile)[^"']*)["']/gi,
            // JSPUI bitstream links without .pdf extension
            /href\s*=\s*["']([^"']*bitstream\/[^"']+)["']/gi,
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(html)) !== null) {
                let link = match[1];

                // Skip navigation/style/icon links
                if (link.includes('.css') || link.includes('.js') || link.includes('icon')
                    || link.includes('logo') || link.includes('favicon') || link.length < 5) {
                    continue;
                }

                // Resolve relative URLs
                if (link.startsWith('/')) {
                    try {
                        const base = new URL(baseUrl);
                        link = `${base.protocol}//${base.host}${link}`;
                    } catch { continue; }
                } else if (!link.startsWith('http')) {
                    try {
                        link = new URL(link, baseUrl).href;
                    } catch { continue; }
                }

                return link;
            }
        }

        return null;
    }

    /**
     * Extract text from a validated PDF file.
     */
    /**
     * A extração produziu texto que dá para ler? Devolve o motivo da recusa, ou `null`.
     *
     * Dois critérios, e os dois são deliberadamente frouxos — a guarda existe para pegar o
     * PDF-imagem, não para julgar qualidade de redação. Recusar demais seria trocar um falso
     * negativo por outro.
     *
     *  1. VOLUME ABSOLUTO: menos de 200 caracteres não é artigo nenhum — é capa, erro de
     *     download ou página de login.
     *  2. DENSIDADE POR PÁGINA: menos de 100 caracteres por página indica PDF digitalizado,
     *     em que o `pdf-parse` só colhe cabeçalho e número de página. Um artigo tem milhares.
     *
     * Não checa densidade léxica nem idioma: isso julgaria o conteúdo, e o sistema não
     * decide o que é bom — decide se LEU.
     */
    static avaliarExtracao(texto: string, paginas: number): string | null {
        const limpo = (texto ?? "").replace(/\s+/g, " ").trim();

        if (limpo.length < 200) {
            return `PDF sem texto extraível (${limpo.length} caracteres). Provavelmente é um ` +
                "digitalizado, que exige OCR — o `pdf-parse` só lê texto já embutido no arquivo. " +
                "NÃO foi gravado .txt: o estudo não foi lido, e a revisão não pode tratá-lo como " +
                "se nada dissesse (DEBT-102).";
        }

        if (paginas > 0) {
            const porPagina = Math.round(limpo.length / paginas);
            if (porPagina < 100) {
                return `PDF com texto insuficiente: ${limpo.length} caracteres em ${paginas} ` +
                    `páginas (${porPagina}/página). Densidade de documento digitalizado — o texto ` +
                    "colhido tende a ser só cabeçalho e numeração. Exige OCR. NÃO foi gravado " +
                    ".txt, para o estudo não entrar no corpus como vazio (DEBT-102).";
            }
        }

        return null;
    }

    private async extractFromPdf(
        pdfPath: string, textPath: string, documentId: string, url: string
    ): Promise<{ success: boolean; textPath?: string; error?: string }> {
        try {
            const dataBuffer = fs.readFileSync(pdfPath);
            const data = await pdfParse(dataBuffer);
            const sizeKB = Math.round(fs.statSync(pdfPath).size / 1024);

            // DEBT-102 — GUARDA DE QUALIDADE. `pdf-parse` extrai texto JÁ EMBUTIDO no
            // arquivo; não faz OCR. Um PDF digitalizado (só imagem) devolve quase nada, e a
            // versão anterior gravava esse quase-nada e declarava sucesso. O caminho da
            // falha, ponta a ponta: .txt vazio → rag_index_corpus indexa vazio → rag_query
            // não acha → o analyst conclui que o estudo NÃO TRATA DO TEMA. O estudo foi lido
            // por ninguém e a revisão segue como se ele nada dissesse.
            //
            // É falso negativo silencioso, a classe mais cara: não aparece em lugar nenhum.
            // A guarda não lê o PDF digitalizado — para isso é preciso OCR, que é outra
            // decisão. O que ela faz é o sistema PARAR DE FINGIR que leu.
            const falha = PdfExtractorService.avaliarExtracao(data.text, data.numpages);
            if (falha) {
                logger.error("PDF_EXTRACTOR", `Extração sem texto útil: ${documentId}`, { motivo: falha });
                return { success: false, error: falha };
            }

            const extractedText = `[NATIVE PDF EXTRACTED]\nDocument ID: ${documentId}\nURL: ${url}\nPages: ${data.numpages}\nSize: ${sizeKB} KB\n\n${data.text}`;
            fs.writeFileSync(textPath, extractedText);

            logger.info("PDF_EXTRACTOR", `✅ PDF extraído: ${documentId} (${data.numpages} págs, ${sizeKB} KB)`);
            return { success: true, textPath };
        } catch (e: any) {
            logger.error("PDF_EXTRACTOR", `Falha na extração de texto: ${documentId}`, { error: e.message });
            return { success: false, error: "Text extraction failed: " + e.message };
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
