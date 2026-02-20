import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projDir = path.resolve(__dirname, '..');
const outDir = path.join(projDir, '03_screening', 'pdfs');

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

async function downloadFile(url, destPath) {
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        rejectUnauthorized: false
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    const arrayBuf = await res.arrayBuffer();
    fs.writeFileSync(destPath, Buffer.from(arrayBuf));
}

async function resolvePdfUrl(pageUrl) {
    try {
        const res = await fetch(pageUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            rejectUnauthorized: false
        });
        if (!res.ok) return null;
        const html = await res.text();

        // Standard DSpace Meta tag
        const metaMatch = html.match(/<meta[^>]*name=["']citation_pdf_url["'][^>]*content=["']([^"']+)["']/i);
        if (metaMatch && metaMatch[1]) return metaMatch[1];

        // Fallback: look for generic bitstream link ending in .pdf
        let href = null;
        let p = /href=["']([^"']*?bitstream[^"']*?\.pdf[^"']*?)["']/ig;
        let match;
        while ((match = p.exec(html)) !== null) {
            href = match[1];
            break;
        }

        if (href) {
            href = href.replace(/&amp;/g, '&');
            if (href.startsWith('http')) return href;
            const parsedUrl = new URL(pageUrl);
            return `${parsedUrl.origin}${href}`;
        }
    } catch (e) {
        return null;
    }
    return null;
}

async function main() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const dataPath = path.join(projDir, '03_screening', 'included.json');
    const articles = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    console.log(`Starting PDF download for ${articles.length} articles...`);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        const pageUrl = article.record.url;
        const safeId = article.record.identifier.replace(/[^a-z0-9]/gi, '_');
        const baseName = `[${safeId}]_${article.record.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}.pdf`;
        const destPath = path.join(outDir, baseName);

        if (fs.existsSync(destPath)) {
            console.log(`[${i + 1}/${articles.length}] ALREADY EXISTS: ${baseName}`);
            successCount++;
            continue;
        }

        console.log(`[${i + 1}/${articles.length}] Resolving ${pageUrl} ...`);
        const pdfUrl = await resolvePdfUrl(pageUrl);

        if (!pdfUrl) {
            console.log(`  -> FAILED to find PDF link on page.`);
            failCount++;
            continue;
        }

        console.log(`  -> Found PDF: ${pdfUrl}. Downloading...`);
        try {
            await downloadFile(pdfUrl, destPath);
            console.log(`  -> SUCCESS! Saved to ${baseName}`);
            successCount++;
        } catch (e) {
            console.log(`  -> FAILED to download PDF: ${e.message}`);
            failCount++;
        }

        // Anti-rate-limit sleep
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`\\nDownload Complete. Success: ${successCount}, Failed: ${failCount}`);
    fs.writeFileSync(path.join(projDir, '03_screening', 'download_report.txt'), `Total: ${articles.length}\\nSuccess: ${successCount}\\nFailed: ${failCount}\\n`);
}

main();
