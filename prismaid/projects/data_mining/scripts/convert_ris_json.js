
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const INPUT_DIR = 'projects/data_mining/manual_import/bvs';
const OUTPUT_FILE = 'projects/data_mining/downloads/stage_1_bvs.json';

function parseRIS(content) {
    const entries = [];
    let current = {};
    const lines = content.split('\n');

    for (const line of lines) {
        const tag = line.substring(0, 2);
        const value = line.substring(6).trim();

        if (tag === 'TY') {
            if (Object.keys(current).length > 0) entries.push(current);
            current = { type: value, source: 'BVS/LILACS (Manual)' };
        } else if (tag === 'TI' || tag === 'T1') {
            current.title = value;
        } else if (tag === 'AU' || tag === 'A1') {
            if (!current.authors) current.authors = [];
            current.authors.push(value);
        } else if (tag === 'PY' || tag === 'Y1') {
            current.year = value.substring(0, 4);
        } else if (tag === 'AB' || tag === 'N2') {
            current.abstract = value;
        } else if (tag === 'UR' || tag === 'L1') {
            current.url = value;
        } else if (tag === 'ER') {
            if (Object.keys(current).length > 0) {
                // Generate ID
                const hash = crypto.createHash('md5').update(JSON.stringify(current)).digest('hex');
                current.id = `MANUAL-BVS-${hash.substring(0, 8)}`;
                entries.push(current);
            }
            current = {};
        }
    }
    return entries;
}

if (!fs.existsSync(INPUT_DIR)) {
    console.log(`Directory ${INPUT_DIR} does not exist.`);
    process.exit(0);
}

const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.ris') || f.endsWith('.txt'));
let allEntries = [];

for (const file of files) {
    const content = fs.readFileSync(path.join(INPUT_DIR, file), 'utf8');
    const entries = parseRIS(content);
    console.log(`Parsed ${entries.length} records from ${file}`);
    allEntries = allEntries.concat(entries);
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allEntries, null, 2));
console.log(`Saved ${allEntries.length} BVS records to ${OUTPUT_FILE}`);
