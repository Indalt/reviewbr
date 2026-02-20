
import { execFile } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { SearchResult } from "../types.js";

export class PubMedService {
    private pythonPath: string;
    private scriptPath: string;

    constructor() {
        // Assume python is in path, or use a specific env var
        this.pythonPath = "python";

        // Resolve path relative to project root (where package.json is)
        // Since we run "node dist/index.js" from root, this is safer.
        this.scriptPath = join(process.cwd(), "python", "pubmed_search.py");
    }

    async search(query: string, maxResults: number = 20): Promise<{ results: SearchResult[]; error?: string }> {
        return new Promise((resolve, reject) => {
            const input = JSON.stringify({ query, maxResults });

            const child = execFile(this.pythonPath, [this.scriptPath], (error, stdout, stderr) => {
                if (error) {
                    console.error("PubMed Python error:", stderr);
                    resolve({ results: [], error: stderr || error.message });
                    return;
                }

                try {
                    const data = JSON.parse(stdout);
                    if (data.error) {
                        resolve({ results: [], error: data.error });
                    } else if (Array.isArray(data)) {
                        resolve({ results: data });
                    } else {
                        resolve({ results: [], error: "Invalid output format from Python script" });
                    }
                } catch (e) {
                    console.error("Failed to parse PubMed output:", stdout);
                    resolve({ results: [], error: "Failed to parse Python output" });
                }
            });

            if (child.stdin) {
                child.stdin.write(input);
                child.stdin.end();
            }
        });
    }
}
