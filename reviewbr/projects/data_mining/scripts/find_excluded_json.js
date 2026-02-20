
const fs = require('fs');

try {
    const jsonPath = 'c:/Users/Vicente/prismaid/prismaid/projects/data_mining/downloads/stage_2_candidates_deduped.json';
    if (!fs.existsSync(jsonPath)) throw new Error("JSON not found at " + jsonPath);

    // Read JSON
    const jsonContent = fs.readFileSync(jsonPath, 'utf8');
    const json = JSON.parse(jsonContent);
    const jsonTitles = json.map(item => item.title ? item.title.trim().toUpperCase() : "NO_TITLE");

    // Read CSV
    const csvPath = 'c:/Users/Vicente/prismaid/prismaid/projects/data_mining/study_characteristics_table.csv';
    const csv = fs.readFileSync(csvPath, 'utf8');

    // Extract CSV Titles (Column 2)
    const csvLines = csv.split('\n').slice(1);
    const csvTitles = csvLines.map(line => {
        // Match 2nd quoted string
        const match = line.match(/^"[^"]*","([^"]*)",/);
        if (match) return match[1].trim().toUpperCase();
        return null; // or try split if not quoted
    }).filter(t => t);

    // Find Missing (JSON items not in CSV)
    const missing = json.filter(item => {
        const title = item.title ? item.title.trim().toUpperCase() : "NO_TITLE";
        // Check if title is in CSV (fuzzy match or exact?)
        // Let's try exact first, then includes?
        return !csvTitles.some(csvTitle => csvTitle === title || csvTitle.includes(title) || title.includes(csvTitle));
    });

    console.log("Total JSON Candidates:", json.length);
    console.log("Total CSV Included:", csvTitles.length);
    console.log("First 3 JSON Titles:", jsonTitles.slice(0, 3));
    console.log("First 3 CSV Titles:", csvTitles.slice(0, 3));
    console.log("Missing/Excluded Items:", JSON.stringify(missing.map(m => m.title)));

} catch (err) {
    console.error("Error:", err.message);
}
