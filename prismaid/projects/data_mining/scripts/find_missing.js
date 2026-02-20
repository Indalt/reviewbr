
const fs = require('fs');

const summaries = fs.readFileSync('c:/Users/Vicente/prismaid/prismaid/projects/data_mining/summaries_relevant.md', 'utf8');
const csv = fs.readFileSync('c:/Users/Vicente/prismaid/prismaid/projects/data_mining/study_characteristics_table.csv', 'utf8');

// Extract titles from MD (lines starting with ## )
const mdTitles = summaries.match(/^## (.*)$/gm).map(line => line.replace('## ', '').trim());

// Extract IDs from CSV (first column)
const csvLines = csv.split('\n').slice(1); // skip header
const csvIds = csvLines.map(line => {
    const parts = line.split(',');
    if (parts.length > 0) return parts[0].replace(/"/g, '').trim();
    return null;
}).filter(id => id);

// Find missing
const missing = mdTitles.filter(title => !csvIds.includes(title));

console.log("Missing ID (Excluded Article):", missing);
console.log("Total MD:", mdTitles.length);
console.log("Total CSV:", csvIds.length);
