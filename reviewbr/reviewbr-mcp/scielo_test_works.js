const url = "https://api.openalex.org/works?search=dengue&filter=primary_location.source.publisher_lineage:P4310312277&per_page=3";
fetch(url).then(r => r.json()).then(j => {
    console.log(`Found ${j.meta?.count} works for Scielo`);
    j.results?.forEach(r => console.log(`- ${r.title} | ${r.language} | DOI: ${r.doi}`));
}).catch(console.error);
