const url = "https://api.openalex.org/publishers?search=scielo";
fetch(url).then(r => r.json()).then(j => {
    console.log("Publishers:");
    const pubs = j.results.map(r => `${r.id} - ${r.display_name}`);
    console.log(pubs);
});
