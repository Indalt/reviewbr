import { search_repository } from "./src/index.js";

async function run() {
    try {
        const result = await search_repository({
            query: "computação quântica",
            scope: "national_br",
            maxResults: 10
        });
        console.log(result.content[0].text);
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
