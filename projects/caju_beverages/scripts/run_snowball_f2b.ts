import fs from 'fs';
import path from 'path';

const projDir = "c:\\Users\\Vicente\\prismaid\\projects\\caju_beverages";
const inCandidatesPath = path.join(projDir, 'logs', 'snowballing_candidates.csv');
const outDatasetPath = path.join(projDir, '01_raw', 'dataset_snowball_raw.json');
const logPath = path.join(projDir, 'logs', 'snowball_openalex_log.txt');

// Simple delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchFromOpenAlex(query: string) {
    // OpenAlex works best when query is clean of special chars and limited length
    const cleanQuery = query.replace(/[^a-zA-Z0-9 ]/g, ' ').substring(0, 150).trim();
    // Use the /works endpoint with the search parameter
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(cleanQuery)}&per-page=1`;

    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'reviewbr-mcp (mailto:vicente@example.com)' }
        });

        if (!response.ok) {
            console.error(`HTTP error ${response.status} for query: ${cleanQuery}`);
            return null;
        }

        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const hit = data.results[0];
            // Only accept if relevance score > 10 (heuristic) to avoid random matches
            if (hit.relevance_score && hit.relevance_score < 5) return null;

            return {
                repositoryId: "OpenAlex-Snowball",
                repositoryName: "OpenAlex",
                identifier: hit.id,
                title: hit.title,
                creators: hit.authorships ? hit.authorships.map((a: any) => a.author?.display_name).filter(Boolean) : [],
                description: hit.abstract_inverted_index ? reconstructAbstract(hit.abstract_inverted_index) : "",
                date: hit.publication_year ? hit.publication_year.toString() : "",
                type: hit.type || "article",
                url: hit.doi || hit.id,
                language: hit.language || "unknown",
                _origin: "SNOWBALL-F5",
                _rawCitation: query
            };
        }
    } catch (error) {
        console.error(`Fetch error for query: ${cleanQuery}`, error);
    }
    return null;
}

// OpenAlex returns abstracts as inverted index to save bandwidth
function reconstructAbstract(invertedIndex: Record<string, number[]>): string {
    if (!invertedIndex) return "";
    const words: string[] = [];
    for (const [word, positions] of Object.entries(invertedIndex)) {
        for (const pos of positions) {
            words[pos] = word;
        }
    }
    return words.join(' ').trim();
}

async function main() {
    if (!fs.existsSync(inCandidatesPath)) {
        console.error("Snowball candidates file not found!");
        return;
    }

    const lines = fs.readFileSync(inCandidatesPath, 'utf8').split('\n');
    // Skip header line
    const candidates = lines.slice(1).map(l => l.replace(/^"/, '').replace(/"$/, '').trim()).filter(l => l.length > 0);

    console.log(`Starting OpenAlex retrieval for ${candidates.length} candidates...`);

    const results = [];
    const logEntries = [];

    let successCount = 0;

    for (let i = 0; i < candidates.length; i++) {
        const cand = candidates[i];
        if (i % 10 === 0) console.log(`Processing ${i}/${candidates.length}... (Found: ${successCount})`);

        const data = await fetchFromOpenAlex(cand);
        if (data) {
            results.push(data);
            successCount++;
            logEntries.push(`[MATCH] ${cand}\n  -> Found: ${data.title}`);
        } else {
            logEntries.push(`[MISS]  ${cand}`);
        }

        // Polite delay (OpenAlex suggests max 10 requests per second)
        await delay(150);
    }

    fs.writeFileSync(outDatasetPath, JSON.stringify({ unique: results }, null, 2));
    fs.writeFileSync(logPath, logEntries.join('\n'));

    console.log(`\nRetrieval Complete!`);
    console.log(`Total Candidates: ${candidates.length}`);
    console.log(`Successfully mapped to OpenAlex: ${successCount} (${((successCount / candidates.length) * 100).toFixed(1)}%)`);
    console.log(`Results saved to ${outDatasetPath}`);
}

main();
