
const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const { parse } = require('csv-parse/sync');

program
    .name('select_seeds')
    .description('Select seeds for snowballing from screening reports')
    .requiredOption('-s, --source <path>', 'Path to screening_report.csv')
    .option('-t, --top <number>', 'Select top N highest scoring papers', parseInt)
    .option('-m, --min <number>', 'Select papers with score >= min', parseInt)
    .option('-f, --files <path>', 'Text file with list of filenames to select')
    .option('-o, --out <path>', 'Output JSON file', 'seeds.json');

program.parse();
const options = program.opts();

function main() {
    console.log(`🔍 Reading report: ${options.source}`);

    let records;
    try {
        const input = fs.readFileSync(options.source, 'utf-8');
        records = parse(input, {
            columns: true,
            skip_empty_lines: true
        });
    } catch (e) {
        console.error(`Error reading CSV: ${e.message}`);
        process.exit(1);
    }

    console.log(`Loaded ${records.length} records.`);

    // Filter Logic
    let selected = [];

    // 1. By File List
    if (options.files) {
        const fileList = fs.readFileSync(options.files, 'utf-8')
            .split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 0);

        const set = new Set(fileList);
        selected = records.filter(r => set.has(r.Filename));
        console.log(`Start filters: ${selected.length} found by filename list.`);
    } else {
        selected = records; // Start with all if no specific list
    }

    // 2. By Score (Min)
    if (options.min !== undefined) {
        selected = selected.filter(r => parseInt(r.Score) >= options.min);
        console.log(`After Min Score (${options.min}): ${selected.length}`);
    }

    // 3. Sort by Score (Desc)
    selected.sort((a, b) => parseInt(b.Score) - parseInt(a.Score));

    // 4. Top N
    if (options.top !== undefined) {
        selected = selected.slice(0, options.top);
        console.log(`After Top (${options.top}): ${selected.length}`);
    }

    // Convert to Seeds format
    // Note: screening_report.csv has "Filename" but snowball needs Title or DOI.
    // Filename is usually sanitized title. Ideally we should have the original JSON metadata too.
    // Heuristic: Use Filename as Title (cleaning underscores) or try to find a sidecar metadata file?
    // For now, let's clean the filename.
    // "Title of paper.pdf" -> "Title of paper"

    const seeds = selected.map(r => {
        let title = r.Filename.replace(/\.pdf$/i, '').replace(/_/g, ' ');

        // Prioritize SuggestedCitation if available (Targeted Snowballing)
        if (r.SuggestedCitation && r.SuggestedCitation.trim().length > 5) {
            title = r.SuggestedCitation.trim();
        }

        return {
            title: title,
            note: `Score: ${r.Score} (${r.Decision})`
        };
    });

    // Write Output
    fs.writeFileSync(options.out, JSON.stringify(seeds, null, 2));
    console.log(`\n✅ Saved ${seeds.length} seeds to ${options.out}`);

    if (seeds.length > 0) {
        console.log("Preview:");
        seeds.slice(0, 3).forEach(s => console.log(` - ${s.title}`));
    }
}

main();
