
const fs = require('fs');
const path = require('path');
const { program } = require('commander');

// Helper to download file
async function downloadFile(url, dest) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`);

    // Check content type
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/pdf') && !contentType.includes('application/octet-stream')) {
        // Maybe it's a redirect or HTML page? 
        // For now, strict check or warning.
        console.warn(`[WARN] Content-Type is ${contentType} for ${url}`);
    }

    const fileStream = fs.createWriteStream(dest);
    const readable = require('stream').Readable.fromWeb(response.body);

    return new Promise((resolve, reject) => {
        readable.pipe(fileStream);
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
    });
}

program
    .name('download_snowball')
    .description('Download PDFs from snowballing results')
    .requiredOption('-i, --input <path>', 'Path to candidates.json')
    .parse();

const options = program.opts();

async function main() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Ignore SSL for broad compatibility

    const inputPath = options.input;
    const baseDir = path.dirname(inputPath);
    const downloadDir = path.join(baseDir, 'downloads');

    if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
    }

    console.log(`📂 Reading candidates from: ${inputPath}`);
    const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

    let candidates = [];
    // Handle different formats if needed (data might be array or object)
    if (Array.isArray(data)) {
        candidates = data;
    } else if (data.results) {
        candidates = data.results;
    } else {
        console.error("Unknown JSON format. Expected array or object with 'results'.");
        process.exit(1);
    }

    console.log(`🔍 Found ${candidates.length} candidates.`);

    let downloaded = 0;
    let failed = 0;
    let skipped = 0;

    for (const item of candidates) {
        const paper = item.work || item;
        // Check if OA
        if (!paper.open_access || !paper.open_access.is_oa) {
            console.log(`Create skipped entry: ${paper.title} (Not Open Access)`);
            skipped++;
            continue;
        }

        const pdfUrl = paper.best_oa_location ? paper.best_oa_location.pdf_url : null;
        if (!pdfUrl) {
            console.log(`⏭️ Skipped: ${paper.title} (No PDF URL)`);
            skipped++;
            continue;
        }

        const safeTitle = paper.title.replace(/[^a-z0-9]/gi, '_').substring(0, 100);
        const filename = `${safeTitle}.pdf`;
        const destPath = path.join(downloadDir, filename);

        if (fs.existsSync(destPath)) {
            console.log(`✅ Exists: ${filename}`);
            downloaded++;
            continue;
        }

        console.log(`⬇️ Downloading: ${paper.title}...`);
        try {
            await downloadFile(pdfUrl, destPath);
            console.log(`   ✅ Saved.`);
            downloaded++;
        } catch (e) {
            console.error(`   ❌ Failed: ${e.message} (${pdfUrl})`);
            failed++;
        }
    }

    console.log(`\n🎉 Done.`);
    console.log(`   Downloaded: ${downloaded}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Failed: ${failed}`);
    console.log(`📂 Output: ${downloadDir}`);
}

main();
