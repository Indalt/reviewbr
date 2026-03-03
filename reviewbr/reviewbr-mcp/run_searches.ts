import { execSync } from 'child_process';

const projectId = 1;
const projectPath = 'projects/vicente/ai_in_science';

// Use a simpler query without nested quotes to prevent CLI escaping issues
const openAlexQuery = "Artificial Intelligence OR Machine Learning OR LLM AND Scientific Research OR Scientist";
const pmQuery = '("Artificial Intelligence"[Title/Abstract] OR "Machine Learning"[Title/Abstract]) AND ("Scientific Research"[Title/Abstract] OR "Publishing"[Title/Abstract])';

const tools = [
    { name: 'search_openalex', args: { query: openAlexQuery, maxResults: 60, projectId, projectPath } },
    { name: 'search_semanticscholar', args: { query: openAlexQuery, maxResults: 60, projectId, projectPath } },
    { name: 'search_pubmed', args: { query: pmQuery, maxResults: 40, projectId, projectPath } }
];

console.log("Starting Search Protocol: AI in Science");

for (const tool of tools) {
    console.log(`\n--- Running ${tool.name} ---`);
    try {
        // Stringify twice to escape the JSON quotes for the CLI arg
        const argsJson = JSON.stringify(tool.args);
        const cliArgs = JSON.stringify(argsJson);

        // Let Windows/Node handle the spawning
        const cmd = `node dist/index.js --tool ${tool.name} --args ${cliArgs}`;
        const output = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });

        // Attempt to parse the MCP tool output format
        try {
            const parsed = JSON.parse(output);
            const rawContent = parsed.content[0].text;
            const res = JSON.parse(rawContent);
            console.log(`Found: ${res.count || res.results?.length || 0} records.`);
        } catch (e) {
            console.log("Output received, but couldn't parse record count. Proceeding.");
        }
    } catch (e: any) {
        console.error(`Error running ${tool.name}:`, e.message);
        if (e.stdout) console.error("STDOUT:", e.stdout.toString());
        if (e.stderr) console.error("STDERR:", e.stderr.toString());
    }
}

console.log("\nSearch phase completed.");
