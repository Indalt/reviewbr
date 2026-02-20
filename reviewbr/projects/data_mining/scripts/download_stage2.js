const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { exec } = require('child_process');

// Configuration
const INPUT_FILE = 'projects/data_mining/downloads/stage_2_candidates_deduped.json';
const DOWNLOAD_DIR = 'projects/data_mining/downloads/stage_2_fulltext';
const CONCURRENCY = 5;

if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

const candidates = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
console.log(`Loaded ${candidates.length} candidates.`);

let processed = 0;
let downloaded = 0;
let failed = 0;

async function processQueue() {
    const queue = [...candidates];
    const active = [];

    while (queue.length > 0 || active.length > 0) {
        while (active.length < CONCURRENCY && queue.length > 0) {
            const item = queue.shift();
            const p = processItem(item).then(() => {
                active.splice(active.indexOf(p), 1);
            });
            active.push(p);
        }
        if (active.length > 0) {
            await Promise.race(active);
        }
    }
}

async function processItem(item) {
    processed++;
    const safeTitle = (item.title || 'untitled').replace(/[^a-z0-9]/gi, '_').substring(0, 100);
    const filename = `${safeTitle}.pdf`;
    const destPath = path.join(DOWNLOAD_DIR, filename);

    if (fs.existsSync(destPath)) {
        console.log(`[SKIP] Exists: ${filename}`);
        return;
    }

    console.log(`[${processed}/${candidates.length}] Processing: ${item.title.substring(0, 50)}...`);

    // 1. Try to find PDF URL from Landing Page
    let pdfUrl = null;
    try {
        const html = await fetchUrl(item.url);
        if (html) {
            // Look for <meta name="citation_pdf_url" content="...">
            const match = html.match(/<meta\s+name=["']citation_pdf_url["']\s+content=["'](.*?)["']/i);
            if (match && match[1]) {
                pdfUrl = match[1];
            } else {
                // Fallback: look for generic bitstream link if DSpace
                // Common pattern: /bitstream/handle/.../filename.pdf
                // Or just any link ending in .pdf
                const pdfLinkMatch = html.match(/href=["'](.*?.pdf)["']/i);
                if (pdfLinkMatch) {
                    // Resolve relative
                    pdfUrl = resolveUrl(item.url, pdfLinkMatch[1]);
                }
            }
        }
    } catch (e) {
        console.error(`   Error fetching landing page ${item.url}: ${e.message}`);
    }

    // 2. Download if found
    if (pdfUrl) {
        console.log(`   Found PDF: ${pdfUrl}`);
        try {
            await downloadFile(pdfUrl, destPath);
            console.log(`   ✅ Downloaded.`);
            downloaded++;
        } catch (e) {
            console.error(`   ❌ Download Failed: ${e.message}`);
            failed++;
        }
    } else {
        console.log(`   ⚠️ No PDF found in landing page.`);
        failed++;
    }
}

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, { rejectUnauthorized: false }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                resolve(fetchUrl(res.headers.location)); // Follow redirect
                return;
            }
            if (res.statusCode !== 200) {
                reject(new Error(`Status ${res.statusCode}`));
                return;
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(dest);
        const req = client.get(url, { rejectUnauthorized: false }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                file.close();
                fs.unlinkSync(dest);
                resolve(downloadFile(res.headers.location, dest)); // Follow redirect
                return;
            }
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        });
        req.on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}

function resolveUrl(base, relative) {
    if (relative.startsWith('http')) return relative;
    const u = new URL(base);
    if (relative.startsWith('/')) {
        return `${u.protocol}//${u.host}${relative}`;
    }
    return `${u.protocol}//${u.host}${path.dirname(u.pathname)}/${relative}`;
}

processQueue().then(() => {
    console.log(`\nDone.`);
    console.log(`Downloaded: ${downloaded}`);
    console.log(`Failed/NoPDF: ${failed}`);
});
