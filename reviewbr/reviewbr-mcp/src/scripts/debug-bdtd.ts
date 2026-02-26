
// Minimal BDTD debug
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const url = "https://bdtd.ibict.br/vufind/api/v1/search?lookfor=inteligencia&type=AllFields&limit=1";

async function main() {
    console.log(`Fetching ${url}...`);
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
        });
        const json = await response.json();
        const record = json.records?.[0];
        if (record) {
            console.log("Search Result ID:", record.id);
            const recUrl = `https://bdtd.ibict.br/vufind/api/v1/record?id=${encodeURIComponent(record.id)}`;
            console.log(`Fetching record: ${recUrl}...`);
            const recResp = await fetch(recUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
            const recJson = await recResp.json();
            const fullRec = recJson.records?.[0];
            if (fullRec) {
                console.log("Full Record Keys:", Object.keys(fullRec));
                console.log("clean_doi:", fullRec.clean_doi);
                console.log("doi_str:", fullRec.doi_str);
                console.log("dc.identifier:", fullRec["dc.identifier"]);
            }
        } else {
            console.log("No records found.");
        }
    } catch (e) {
        console.error(e);
    }
}

main();
