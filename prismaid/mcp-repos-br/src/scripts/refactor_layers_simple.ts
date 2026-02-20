
import * as fs from 'fs';
import * as path from 'path';

const csvPath = path.join(__dirname, '../../projects/data_mining/master_register/repositorios_brasileiros.csv');
const content = fs.readFileSync(csvPath, 'utf-8');
const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');

if (lines.length === 0) {
    console.error("Empty CSV");
    process.exit(1);
}

const header = lines[0].split(',');
const records = lines.slice(1).map(line => {
    const values = line.split(',');
    // Handle simplistic CSV parsing (assuming no internal commas in this specific dataset for now)
    // If there are commas in quotes, this breaks. 
    // BUT looking at the file, most fields are simple. 
    // Let's do a slightly better parse.
    const row: any = {};
    let currentVal = '';
    let inQuote = false;
    let colIndex = 0;

    // Quick regex split matching comma outside quotes
    // This is a verified regex for CSV splitting
    const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');

    // Being lazy: The file I viewed earlier has NO quoted fields with commas.
    // e.g. "Universidade Federal da Bahia", "https://..."
    // So split(',') is *mostly* safe unless a name has a comma.
    // Let's assume split(',') is risky. 

    // Better manual parser:
    const parsedValues: string[] = [];
    let buffer = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
            parsedValues.push(buffer);
            buffer = '';
        } else {
            buffer += char;
        }
    }
    parsedValues.push(buffer);

    header.forEach((h, i) => {
        row[h] = parsedValues[i] || '';
    });
    return row;
});

// Define new records
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
        oai_pmh_endpoint: 'https://dspace.sti.ufcg.edu.br/oai/request',
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
    if (!records.find((r: any) => r.repo_id === newRec.repo_id)) {
        // Ensure all fields match header
        const r: any = {};
        header.forEach(h => {
            r[h] = (newRec as any)[h] || '';
        });
        records.push(r);
        console.log(`Added missing record: ${newRec.ies_sigla}`);
    }
});

const LAYER_3_TARGETS = ['UFC', 'UFERSA', 'UFCG', 'Infoteca-e', 'BR-FED-0004', 'BR-FED-0030'];

const finalRecords = records.map((record: any) => {
    let layer = '2'; // Default to "Covered by Oasisbr"
    const repo_id = record.repo_id;
    const name = record.ies_nome;
    const sigla = record.ies_sigla;
    const repo_name = record.repo_nome;

    // Layer 1
    if (repo_id.startsWith('BR-AGG') || repo_id === 'BR-RES-0002' || name.includes('IBICT') || name.includes('SciELO') || sigla === 'SciELO') {
        if (sigla === 'IBICT' || sigla === 'SciELO') {
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
    if (MEDIUM_PRIORITY_L3.includes(sigla)) {
        layer = '3';
    }

    record.camada_metodo = layer;
    return record;
});

finalRecords.sort((a: any, b: any) => a.repo_id.localeCompare(b.repo_id));

// Stringify manually
const csvLines = [header.join(',')];
finalRecords.forEach((r: any) => {
    const values = header.map(h => {
        const val = r[h] || '';
        if (val.includes(',') || val.includes('"')) {
            return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
    });
    csvLines.push(values.join(','));
});

fs.writeFileSync(csvPath, csvLines.join('\n'));
console.log(`Updated ${finalRecords.length} records manually.`);
