import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const projDir = "c:\\Users\\Vicente\\prismaid\\projects\\caju_beverages";
const manuscriptPath = path.join(projDir, '05_synthesis', 'manuscript.md');
const csvPath = path.join(projDir, '04_extraction', 'study_characteristics_table.csv');
const flowPath = path.join(projDir, 'prisma_flow.json');

function main() {
    let manuscript = fs.readFileSync(manuscriptPath, 'utf8');

    // 1. Rename prismaid to reviewbr
    manuscript = manuscript.replace(/prismaid/g, 'reviewbr');

    // 2. Load PRISMA Flow
    const flow = JSON.parse(fs.readFileSync(flowPath, 'utf8'));

    // 3. Generate PRISMA Flow Mermaid Diagram
    const prismaDiagram = `
### Diagrama de Fluxo PRISMA 2020

\`\`\`mermaid
graph TD
    A[Registros identificados em bases de dados: n=${flow.identified_db}] --> C
    B[Registros identificados via snowballing: n=${flow.identified_other}] --> C
    C[Total de registros antes da deduplicação: n=${flow.identified_db + flow.identified_other}] --> D[Duplicatas removidas: n=${flow.duplicates_removed}]
    C --> E[Registros triados: n=${flow.screened}]
    E --> F[Registros excluídos pelo título/resumo: n=${flow.title_abstract_excluded}]
    E --> G[Relatórios buscados para recuperação: n=${flow.screened - flow.title_abstract_excluded}]
    G --> H[Relatórios não recuperados: n=${flow.fulltext_not_retrieved}]
    G --> I[Relatórios avaliados para elegibilidade: n=${flow.fulltext_assessed}]
    I --> J[Relatórios excluídos após leitura: n=${flow.fulltext_excluded}]
    I --> K[Estudos incluídos na revisão final: n=${flow.included}]
\`\`\`
`;

    // Try to insert the diagram after "## 3.1 Study Selection"
    const section31Regex = /(## 3\.1 Study Selection\n\n.*?)(?=\n## 3\.2)/s;
    if (section31Regex.test(manuscript)) {
        manuscript = manuscript.replace(section31Regex, `$1\n${prismaDiagram}\n`);
    } else {
        console.log("Could not find section 3.1");
    }

    // 4. Parse CSV for Data Distributions and References
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const records = parse(csvContent, { columns: true, skip_empty_lines: true });

    // Aggregate data
    const years: Record<string, number> = {};
    const beverages: Record<string, number> = {};
    const references: string[] = [];

    records.forEach((record: any, index: number) => {
        // Year distribution
        const y = record['Year'];
        if (y) years[y] = (years[y] || 0) + 1;

        // Beverage distribution
        let bev = String(record['Beverage Type'] || 'Outros').toLowerCase();
        if (bev.includes('suco') || bev.includes('juice') || bev.includes('nectar') || bev.includes('néctar')) {
            bev = 'Sucos e Néctares';
        } else if (bev.includes('fermentado') || bev.includes('kefir') || bev.includes('kombucha') || bev.includes('wine') || bev.includes('beer') || bev.includes('cerveja') || bev.includes('cider') || bev.includes('sidra')) {
            bev = 'Bebidas Fermentadas';
        } else if (bev.includes('cajuina') || bev.includes('cajuína')) {
            bev = 'Cajuína';
        } else if (bev.includes('vegetal') || bev.includes('milk')) {
            bev = 'Bebidas Vegetais';
        } else {
            bev = 'Outros Derivados';
        }
        beverages[bev] = (beverages[bev] || 0) + 1;

        // Reference list
        const authors = record['Authors'] || 'Autor Desconhecido';
        const title = record['Title'] || 'Título Desconhecido';
        references.push(`[${index + 1}] ${authors} (${y}). *${title}*.`);
    });

    // Generate Charts
    let yearChart = `
### Gráficos de Distribuição

**Distribuição de Publicações por Ano**
\`\`\`mermaid
xychart-beta
    title "Publicações Incluídas por Ano (2015-2025)"
    x-axis [${Object.keys(years).sort().join(', ')}]
    y-axis "Quantidade de Estudos"
    bar [${Object.keys(years).sort().map(y => years[y]).join(', ')}]
\`\`\`
`;

    let bevChart = `
**Distribuição por Tipo de Bebida**
\`\`\`mermaid
pie title "Tipos de Bebidas Estudadas"
${Object.entries(beverages).map(([k, v]) => `    "${k}" : ${v}`).join('\n')}
\`\`\`
`;

    const section32Regex = /(## 3\.2 Study Characteristics\n\n.*?)(?=\n## 3\.3)/s;
    if (section32Regex.test(manuscript)) {
        manuscript = manuscript.replace(section32Regex, `$1\n${yearChart}\n${bevChart}\n`);
    } else {
        console.log("Could not find section 3.2");
    }

    // Append References
    const refsSection = `
# References

As fontes originais extraídas e incluídas na síntese quantitativa e qualitativa (${records.length} estudos):

${references.map(r => r).join('\n\n')}
`;
    manuscript += `\n${refsSection}\n`;

    fs.writeFileSync(manuscriptPath, manuscript);
    console.log("Manuscript successfully enriched with diagrams and references.");
}

main();
