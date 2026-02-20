
const https = require('https');

const term = "Anacardium occidentale";
const url = `https://pesquisa.bvsalud.org/portal/?output=xml&lang=pt&from=0&sort=&format=summary&count=20&fb=&Page=1&q=${encodeURIComponent(term)}`;

console.log("Testing access to BVS/LILACS XML output...");
console.log("URL:", url);

https.get(url, (res) => {
    console.log("Status Code:", res.statusCode);
    console.log("Headers:", res.headers);

    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log("Body Preview (first 500 chars):");
            console.log(data.substring(0, 500));
            // Check if it's actual XML/Content
            if (data.includes("Anacardium") || data.includes("total")) {
                console.log("SUCCESS: Content retrieved.");
            } else {
                console.log("WARNING: 200 OK but content might be empty or blocked.");
            }
        } else {
            console.log("FAILURE: Non-200 status.");
        }
    });

}).on('error', (err) => {
    console.error("Error:", err.message);
});
