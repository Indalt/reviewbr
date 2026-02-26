
const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../../projects/data_mining/master_register/repositorios_brasileiros.csv');
const jsonPath = path.join(__dirname, '../../data/repositorios_brasileiros.json');

try {
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');

    if (lines.length === 0) {
        console.error("Empty CSV");
        process.exit(1);
    }

    const header = lines[0].split(',');
    const records = lines.slice(1).map(line => {
        // Simple split
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const row = {};
        header.forEach((h, i) => {
            let val = values[i] || '';
            if (val.startsWith('"') && val.endsWith('"')) {
                val = val.substring(1, val.length - 1).replace(/""/g, '"');
            }
            row[h] = val;
        });
        return row;
    });

    // Transform to JSON format
    // We need to map CSV columns to JSON structure
    const jsonOutput = records.map(record => {
        return {
            id: record.repo_id,
            institution: {
                name: record.ies_nome,
                acronym: record.ies_sigla,
                type: record.ies_tipo === 'Universidade' ? 'federal' : (record.ies_tipo === 'Instituto Federal' ? 'federal' : 'other'), // Simplified logic, use real type later if needed
                state: record.ies_uf,
                city: record.ies_cidade
            },
            repository: {
                name: record.repo_nome,
                url: record.repo_url_home,
                platform: record.repo_plataforma,
                contentType: record.repo_tipo_conteudo
            },
            access: {
                oaiPmh: {
                    available: record.oai_pmh_disponivel === 'Sim',
                    endpoint: record.oai_pmh_endpoint,
                    verified: record.oai_pmh_verificado === 'Sim',
                    lastVerified: record.data_verificacao
                },
                searchEndpoints: []
            },
            status: record.status_repo === 'Ativo' ? 'active' : 'inactive',
            layer: record.camada_metodo // Add layer property
        };
    });

    fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2));
    console.log(`Successfully converted ${jsonOutput.length} records to JSON.`);

} catch (error) {
    console.error("Error converting CSV:", error);
    process.exit(1);
}
