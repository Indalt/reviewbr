const fs = require('fs');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const DRAFT_FILE = 'projects/data_mining/review_article_draft.md';

function extractLinks(text) {
    const regex = /<((?:https?|ftp):\/\/[^>]+)>/g;
    const links = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
        links.push(match[1]);
    }
    return links;
}

function checkUrl(urlStr) {
    return new Promise((resolve) => {
        const urlOpts = new URL(urlStr);
        const lib = urlOpts.protocol === 'https:' ? https : http;

        const req = lib.request(urlStr, { method: 'HEAD', timeout: 10000 }, (res) => {
            resolve({ url: urlStr, status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 400 });
        });

        req.on('error', (err) => {
            // Retry with GET if HEAD fails (some servers block HEAD)
            const getReq = lib.request(urlStr, { method: 'GET', timeout: 10000 }, (getRes) => {
                getRes.destroy(); // Don't download body
                resolve({ url: urlStr, status: getRes.statusCode, ok: getRes.statusCode >= 200 && res.statusCode < 400 });
            });
            getReq.on('error', (err2) => {
                resolve({ url: urlStr, status: 'ERROR', error: err2.message, ok: false });
            });
            getReq.end();
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({ url: urlStr, status: 'TIMEOUT', ok: false });
        });

        req.end();
    });
}

async function main() {
    console.log(`Scanning ${DRAFT_FILE} for links...`);

    if (!fs.existsSync(DRAFT_FILE)) {
        console.error("Draft file not found!");
        process.exit(1);
    }

    const content = fs.readFileSync(DRAFT_FILE, 'utf8');
    const links = extractLinks(content);

    console.log(`Found ${links.length} links. Verifying accessibility...`);

    const results = [];
    for (const link of links) {
        process.stdout.write(`Checking ${link}... `);
        const res = await checkUrl(link);
        console.log(`[${res.status}]`);
        results.push(res);
    }

    const failed = results.filter(r => !r.ok);

    console.log("\n--- Report ---");
    console.log(`Total: ${results.length}`);
    console.log(`Active: ${results.length - failed.length}`);
    console.log(`Broken/Unreachable: ${failed.length}`);

    if (failed.length > 0) {
        console.log("\nBroken Links:");
        failed.forEach(f => console.log(`- ${f.url} (${f.status})`));
    }
}

main();
