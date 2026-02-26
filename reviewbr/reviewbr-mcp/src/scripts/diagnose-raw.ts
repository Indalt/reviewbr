// Quick diagnostic: raw HTTP calls to understand why OAI-PMH, REST, and scraper fail

async function diagnose() {
    const tests = [
        { label: "UFBA OAI-PMH", url: "https://repositorio.ufba.br/oai/request?verb=Identify" },
        { label: "FGV OAI-PMH", url: "https://repositorio.fgv.br/server/oai/request?verb=Identify" },
        { label: "PUCRS OAI-PMH", url: "https://repositorio.pucrs.br/oai/request?verb=Identify" },
        { label: "BDTD OAI-PMH", url: "http://oai.ibict.br/mypoai/oai2.php?verb=Identify" },
        { label: "SciELO OAI-PMH", url: "http://www.scielo.br/oai/scielo-oai.php?verb=Identify" },
        { label: "USP OAI-PMH", url: "https://repositorio.usp.br/oai/request?verb=Identify" },
        { label: "UFBA REST detect", url: "https://repositorio.ufba.br/server/api" },
        { label: "FGV REST detect", url: "https://repositorio.fgv.br/server/api" },
        { label: "UFBA scraper search", url: "https://repositorio.ufba.br/simple-search?query=bebida+fermentada" },
        { label: "UFBA discover", url: "https://repositorio.ufba.br/discover?query=bebida+fermentada" },
    ];

    for (const t of tests) {
        console.log(`\n━━━ ${t.label} ━━━`);
        console.log(`URL: ${t.url}`);
        try {
            const resp = await fetch(t.url, {
                redirect: "follow",
                headers: { "User-Agent": "mcp-repos-br/1.0 (validation test)" },
                signal: AbortSignal.timeout(10000),
            });
            console.log(`Status: ${resp.status} ${resp.statusText}`);
            console.log(`Content-Type: ${resp.headers.get("content-type")}`);
            const body = await resp.text();
            // Show first 300 chars, omitting HTML boilerplate
            const clean = body.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
            console.log(`Body length: ${body.length}`);
            console.log(`Preview: ${clean.substring(0, 300)}`);
        } catch (e: any) {
            console.log(`ERROR: ${e.code || e.name}: ${e.message}`);
        }
    }
}

diagnose();
