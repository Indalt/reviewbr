const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2];
const outputFile = process.argv[3] || inputFile.replace('.json', '_deduped.json');

if (!inputFile) {
    console.error("Usage: node dedupe_batch.js <input.json> [output.json]");
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
let candidates = Array.isArray(data) ? data : (data.results || []);

console.log(`Input: ${candidates.length} records.`);

const seen = new Set();
const deduped = [];
let duplicates = 0;

candidates.forEach(item => {
    // Normalize logic
    // 1. Check Handle/DOI if present
    // 2. Fallback to Title

    let key = '';

    // Prefer ID/Link if unique? Handles are good.
    // e.g. item.link or item.id if available.
    // Let's use Title normalization as primary for "content" dupe check if IDs differ but paper is same.
    // But different repos might have different IDs for same paper. Title + Year is safer.

    const title = (item.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const year = (item.year || (item.date ? item.date.substring(0, 4) : ''));

    // Composite Key
    // If no title, skip or use ID?
    if (!title) {
        key = item.id || Math.random().toString();
    } else {
        key = `${title}_${year}`;
    }

    if (seen.has(key)) {
        duplicates++;
    } else {
        seen.add(key);
        deduped.push(item);
    }
});

console.log(`Duplicates removed: ${duplicates}`);
console.log(`Final count: ${deduped.length}`);

fs.writeFileSync(outputFile, JSON.stringify(deduped, null, 2));
console.log(`Saved to ${outputFile}`);
