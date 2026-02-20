const fs = require('fs');
const path = require('path');

// Paths
const RELEVANT_DIR = 'projects/data_mining/downloads/stage_2_fulltext/relevant';
const METADATA_FILE = 'projects/data_mining/downloads/stage_2_candidates_deduped.json';
const OUTPUT_FILE = 'projects/data_mining/bibliography.md';

// Helper to clean filenames for matching
function cleanName(name) {
    if (!name) return '';
    return name.toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\.pdf$/, '')
        .replace(/[^a-z0-9 ]/g, '')
        .trim();
}

function cleanTitle(title) {
    if (!title) return '';
    return title.toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .trim();
}

async function main() {
    // 1. Load Metadata
    const rawData = fs.readFileSync(METADATA_FILE, 'utf8');
    const metadata = JSON.parse(rawData);
    const candidates = metadata.results || metadata; // Handle structure

    console.log(`Loaded ${candidates.length} candidate records.`);

    // 2. Get List of Included Files
    const files = fs.readdirSync(RELEVANT_DIR).filter(f => f.endsWith('.pdf'));
    console.log(`Found ${files.length} included files.`);

    const bibliography = [];
    const notFound = [];

    // 3. Match
    for (const file of files) {
        // Strategy: Token-based matching
        // Filename: "Obten____o_da_farinha..." -> tokens: [Obten, farinha]
        // Title: "Obtenção da farinha..." -> tokens: [obtencao, farinha]

        const fileTokens = file.toLowerCase()
            .replace(/\.pdf$/, '')
            .split(/_+/)
            .filter(t => t.length > 3); // Only words > 3 chars

        let bestMatch = null;
        let bestScore = 0;

        for (const candidate of candidates) {
            const title = (candidate.title || "").toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove accents

            let score = 0;
            for (const token of fileTokens) {
                // Remove accents from token too just in case
                const normToken = token.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if (title.includes(normToken)) {
                    score++;
                }
            }

            // Calculate overlap ratio
            if (fileTokens.length > 0) {
                const ratio = score / fileTokens.length;
                if (ratio > 0.5 && score > bestScore) { // At least 50% of filename words matched
                    bestScore = score;
                    bestMatch = candidate;
                }
            }
        }

        if (bestMatch) {
            bibliography.push(formatCitation(bestMatch));
        } else {
            notFound.push(file);
            // Fallback: Use filename as title
            bibliography.push(`- **[Unknown Author]**. *${file.replace(/_/g, ' ').replace('.pdf', '')}*. [No Metadata Found].`);
        }
    }

    // 4. Sort and Write
    bibliography.sort(); // Alphabetical order

    let content = "# 6. References\n\n";
    content += bibliography.join('\n') + "\n";

    if (notFound.length > 0) {
        console.log("WARNING: Could not match metadata for:");
        notFound.forEach(f => console.log(` - ${f}`));
    }

    fs.writeFileSync(OUTPUT_FILE, content);
    console.log(`Bibliography written to ${OUTPUT_FILE}`);
}

function formatCitation(item) {
    // ABNT Style-ish
    // TITLE. Publisher/Journal, Year. [Link]
    // If authors exist: AUTHOR, F. Title...

    let citation = "";

    if (item.authors && item.authors.length > 0) {
        let authors = item.authors[0].toUpperCase();
        if (item.authors.length > 1) authors += " et al.";
        citation += `**${authors}**. `;
    } else if (item.author) {
        citation += `**${item.author.toUpperCase()}**. `;
    }
    // If no author, start with Title (Standard for unknown authorship)

    const title = item.title ? item.title.trim() : "No Title";
    const year = item.year || (item.date ? item.date.substring(0, 4) : "s.d.");
    const publisher = item.publisher || item.repository || "Repository";
    const url = item.url || (item.identifiers ? item.identifiers.url : null) || "";

    citation += `*${title}*. ${publisher}, ${year}. Disponível em: <${url}>.`;

    return `- ${citation}`;
}

main();
