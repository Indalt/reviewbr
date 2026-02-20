const fs = require('fs');
const path = require('path');

const SUMMARIES_FILE = 'projects/data_mining/summaries_relevant.md';
const METADATA_FILE = 'projects/data_mining/downloads/stage_2_candidates_deduped.json';
const OUTPUT_FILE = 'projects/data_mining/study_characteristics_table.csv';

function cleanText(text) {
    if (!text) return "Indefinido";
    return text.replace(/[\n\r]+/g, ' ').replace(/"/g, '""').trim();
}

function normalizeTitle(title) {
    return title.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function main() {
    // 1. Load Summaries (Included Studies)
    const summariesContent = fs.readFileSync(SUMMARIES_FILE, 'utf8');
    const includedFiles = [];
    const summaryMap = {};

    // Parse Markdown: ## Filename\n\nSummary...
    const sections = summariesContent.split('## ');
    for (let i = 1; i < sections.length; i++) {
        const section = sections[i];
        const lines = section.split('\n');
        const filename = lines[0].trim();
        let summary = "";

        // Extract summary text (skip blank lines and ---)
        for (let j = 1; j < lines.length; j++) {
            const line = lines[j].trim();
            if (line === '---' || line.startsWith('> **Erro')) break;
            if (line.length > 0) summary += line + " ";
        }

        includedFiles.push(filename);
        summaryMap[filename] = summary.trim();
    }

    console.log(`Found ${includedFiles.length} included studies in summaries.`);

    // 2. Load Metadata
    const metadataRaw = fs.readFileSync(METADATA_FILE, 'utf8');
    const metadataList = JSON.parse(metadataRaw).results || JSON.parse(metadataRaw); // Handle structure

    // Create lookup map based on approximate filename matching
    // Filename in summaries is like: "Title_Slug.pdf"
    // Metadata has "title"

    // We need to match filenames to metadata entries.
    // Heuristic: Tokenize filename and find best match in metadata titles.

    const matchedData = [];

    for (const filename of includedFiles) {
        let bestMatch = null;
        let maxScore = 0;

        // Prepare filename tokens
        const fileTokens = filename.toLowerCase()
            .replace('.pdf', '')
            .split(/_+/)
            .filter(t => t.length > 3);

        for (const item of metadataList) {
            const title = (item.title || "").toLowerCase();
            let score = 0;

            for (const token of fileTokens) {
                if (title.includes(token)) score++;
            }

            if (score > maxScore && score >= fileTokens.length * 0.4) { // 40% match threshold
                maxScore = score;
                bestMatch = item;
            }
        }

        const studyData = {
            study_id: filename.replace('.pdf', ''),
            referencia_completa: "Indefinido",
            ano: "s.d.",
            tipo_documento: "Indefinido",
            fonte_repositorio: "Indefinido",
            url_item: "Indefinido",
            idioma: "pt",
            area_campo: "Indefinido",
            pais_contexto: "Brasil",
            nota_resumo_escopo: summaryMap[filename] || "Indefinido"
        };

        if (bestMatch) {
            studyData.referencia_completa = cleanText(bestMatch.title);
            studyData.ano = bestMatch.year || (bestMatch.date ? bestMatch.date.substring(0, 4) : "s.d.");
            studyData.tipo_documento = bestMatch.type || "Texto";
            studyData.fonte_repositorio = bestMatch.repository || "Repository";
            studyData.url_item = bestMatch.url || (bestMatch.identifiers ? bestMatch.identifiers.url : "Indefinido");
            if (bestMatch.publisher) studyData.fonte_repositorio = bestMatch.publisher;
        } else {
            // Fallback: Try to make title readable from filename
            studyData.referencia_completa = filename.replace(/_/g, ' ').replace('.pdf', '');
        }

        matchedData.push(studyData);
    }

    // 3. Write CSV
    const header = "study_id,referencia_completa,ano,tipo_documento,fonte_repositorio,url_item,idioma,area_campo,país_contexto,nota_resumo_escopo\n";
    const rows = matchedData.map(d => {
        return `"${d.study_id}","${d.referencia_completa}","${d.ano}","${d.tipo_documento}","${d.fonte_repositorio}","${d.url_item}","${d.idioma}","${d.area_campo}","${d.pais_contexto}","${cleanText(d.nota_resumo_escopo).substring(0, 300)}..."`;
    }).join('\n');

    fs.writeFileSync(OUTPUT_FILE, header + rows);
    console.log(`Written CSV to ${OUTPUT_FILE}`);
}

main();
