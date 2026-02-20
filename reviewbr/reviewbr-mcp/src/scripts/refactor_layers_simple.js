
const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../../projects/data_mining/master_register/repositorios_brasileiros.csv');
const content = fs.readFileSync(csvPath, 'utf-8');
const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');

if (lines.length === 0) {
    console.error("Empty CSV");
    process.exit(1);
}

const header = lines[0].split(',');
const records = lines.slice(1).map(line => {
    // Simple split by comma, assuming no internal commas for now
    // If strict parsing is needed, we'd use a regex, but this dataset is controlled.
    // However, let's use a slightly safer split if possible.
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

// New Records
const newRecords = [
    {
        repo_id: 'BR-FED-0033',
        ies_nome: 'Universidade Federal de Campina Grande',
        ies_sigla: 'UFCG',
        ies_tipo: 'Universidade',
        ies_categoria: 'Pública Federal',
        ies_uf: 'PB',
        ies_cidade: 'Campina Grande',
        ies_site_principal: 'https://portal.ufcg.edu.br/',
        repo_nome: 'Biblioteca Digital de Teses e Dissertações',
        repo_url_home: 'https://dspace.sti.ufcg.edu.br/',
        repo_plataforma: 'DSpace',
        repo_tipo_conteudo: 'Misto',
        texto_completo_oa: 'Sempre',
        evidencia_oa_url: 'https://dspace.sti.ufcg.edu.br/',
        politica_acesso_url: '',
        restricao_login: 'Não',
        indexacao_robos: 'OK',
        oai_pmh_disponivel: 'Sim',
        oai_pmh_endpoint: 'https://dspace.sti.ufcg.edu.br/oai/request', // Corrected per user input
        oai_pmh_verificado: 'Não',
        outros_endpoints: '',
        aparece_oasisbr: 'Sim',
        aparece_bdtd: 'Sim',
        aparece_scielo: 'NA',
        aparece_opendoar: 'Sim',
        aparece_roar: 'Sim',
        metodo_descoberta: 'Busca Específica',
        data_verificacao: '2026-02-19',
        evidencias_urls: 'https://portal.ufcg.edu.br/',
        observacoes: '',
        status_repo: 'Ativo'
    },
    {
        repo_id: 'BR-RES-0004',
        ies_nome: 'Empresa Brasileira de Pesquisa Agropecuária',
        ies_sigla: 'Embrapa',
        ies_tipo: 'Instituto de Pesquisa',
        ies_categoria: 'Pública Federal',
        ies_uf: 'DF',
        ies_cidade: 'Brasília',
        ies_site_principal: 'https://www.embrapa.br/',
        repo_nome: 'Infoteca-e',
        repo_url_home: 'https://www.infoteca.cnptia.embrapa.br/',
        repo_plataforma: 'DSpace',
        repo_tipo_conteudo: 'Misto',
        texto_completo_oa: 'Sempre',
        evidencia_oa_url: 'https://www.infoteca.cnptia.embrapa.br/',
        politica_acesso_url: '',
        restricao_login: 'Não',
        indexacao_robos: 'OK',
        oai_pmh_disponivel: 'Sim',
        oai_pmh_endpoint: 'https://www.infoteca.cnptia.embrapa.br/oai/request',
        oai_pmh_verificado: 'Não',
        outros_endpoints: '',
        aparece_oasisbr: 'Sim',
        aparece_bdtd: 'Sim',
        aparece_scielo: 'NA',
        aparece_opendoar: 'Sim',
        aparece_roar: 'Sim',
        metodo_descoberta: 'Busca Específica',
        data_verificacao: '2026-02-19',
        evidencias_urls: 'https://www.embrapa.br/',
        observacoes: '',
        status_repo: 'Ativo'
    }
];

newRecords.forEach(newRec => {
    if (!records.find(r => r.repo_id === newRec.repo_id)) {
        // Ensure all Header fields exist
        const r = {};
        header.forEach(h => {
            r[h] = newRec[h] || '';
        });
        records.push(r);
        console.log(`Added missing record: ${newRec.ies_sigla}`);
    }
});

const LAYER_3_TARGETS = ['UFC', 'UFERSA', 'UFCG', 'Infoteca-e', 'BR-FED-0004', 'BR-FED-0030'];

const finalRecords = records.map(record => {
    let layer = '2'; // Default to "Covered by Oasisbr"
    const repo_id = record.repo_id;
    const name = record.ies_nome;
    const sigla = record.ies_sigla;
    const repo_name = record.repo_nome;

    // Layer 1
    if (repo_id.startsWith('BR-AGG') ||
        repo_id === 'BR-RES-0002' ||
        name.includes('IBICT') ||
        repo_name.includes('SciELO') ||
        sigla === 'SciELO') {
        if (sigla === 'IBICT' || sigla === 'SciELO' || repo_id.startsWith('BR-AGG')) {
            layer = '1';
        }
    }

    // Layer 3
    if (LAYER_3_TARGETS.includes(sigla) ||
        LAYER_3_TARGETS.includes(repo_id) ||
        repo_name.includes('Infoteca') ||
        (sigla === 'Embrapa' && repo_name.includes('Infoteca'))
    ) {
        layer = '3';
    }
    if (repo_name === 'Infoteca-e') {
        layer = '3';
    }

    const MEDIUM_PRIORITY_L3 = ['UFPI', 'UFAM', 'UFRJ', 'UNIFESP', 'UFRR', 'UFAC'];
    // But wait, user's optimized list put UFRJ in Layer 2 (Covered), but separately listed "Pantheon/UFRJ" in Layer 3 as Média Prioridade.
    // "Pantheon/UFRJ ... Média Prioridade ... Buscar separado? ... Sim".
    // So UFRJ Pantheon IS Layer 3. 
    if (MEDIUM_PRIORITY_L3.includes(sigla)) {
        layer = '3';
    }

    // Is ALICE Layer 3? User put "EMBRAPA ALICE" in Layer 2 (Covered).
    // But user listed "Infoteca-e" in Layer 3 (Must).

    record.camada_metodo = layer;
    return record;
});

finalRecords.sort((a, b) => a.repo_id.localeCompare(b.repo_id));

// Stringify manually
const csvLines = [header.join(',')];
finalRecords.forEach(r => {
    const values = header.map(h => {
        let val = r[h] || '';
        if (val.includes(',') || val.includes('"')) {
            val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
    });
    csvLines.push(values.join(','));
});

fs.writeFileSync(csvPath, csvLines.join('\n'));
console.log(`Updated ${finalRecords.length} records manually.`);
