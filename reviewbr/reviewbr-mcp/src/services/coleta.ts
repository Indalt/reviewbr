import type { OaiRecord, RepositoryEntry, SearchResult } from "../types.js";

/**
 * Linha 27 da FILA (ponto 8, grupo 2: coleta e importação) — o que as tools de coleta e de
 * importação dizem e gravam, em funções que o teste exercita sem rede nem servidor.
 */

/**
 * Rodapé da lista de resultados de uma busca que mostra só os primeiros. Antes, o `search_openalex`
 * dizia "salvos no arquivo JSON" também sem `projectPath`, quando nada era gravado.
 * `gravadoEm`: o arquivo onde a lista inteira foi gravada; `null` quando nada foi gravado.
 */
export function rodapeDosResultados(total: number, mostrados: number, gravadoEm: string | null): string {
    const restantes = total - mostrados;
    if (restantes <= 0) return "";
    return gravadoEm
        ? `\n... e mais ${restantes} resultados, que não aparecem aqui; a lista inteira (${total}) está em ${gravadoEm}.`
        : `\n... e mais ${restantes} resultados, que não aparecem aqui e não foram gravados: sem projectPath a busca é exploratória e nada é persistido.`;
}

/** O primeiro valor que parece DOI entre os identificadores Dublin Core de um registro OAI. */
function doiDe(ids: string[]): string | undefined {
    for (const id of ids) {
        const m = /(10\.\d{4,9}\/\S+)/.exec(id ?? "");
        if (m) return m[1]!.replace(/[.,;]+$/, "");
    }
    return undefined;
}

/**
 * Registro colhido por OAI-PMH (`harvest_records`) no formato que `01_raw/` guarda. Antes, a coleta
 * com `projectPath` entrava no log PRISMA-S e não gravava nada em `01_raw/`: o funil não a contava.
 */
export function registrosDaColetaOai(
    repo: RepositoryEntry,
    records: OaiRecord[],
    coleta: { endpoint: string; set?: string; dateFrom?: string; dateUntil?: string; metadataPrefix?: string },
): SearchResult[] {
    const extractionDate = new Date().toISOString();
    const filtros = [
        `metadataPrefix=${coleta.metadataPrefix ?? "oai_dc"}`,
        coleta.set ? `set=${coleta.set}` : "",
        coleta.dateFrom ? `from=${coleta.dateFrom}` : "",
        coleta.dateUntil ? `until=${coleta.dateUntil}` : "",
    ].filter(Boolean).join("&");
    return records.map((r) => {
        const md = r.metadata;
        const ids = md.identifier ?? [];
        const endereco = ids.find((i) => /^https?:\/\//i.test(i ?? ""));
        const doi = doiDe(ids);
        return {
            repositoryId: repo.id,
            repositoryName: repo.repository.name,
            identifier: r.identifier,
            title: md.title?.[0] ?? "",
            creators: md.creator ?? [],
            description: md.description?.[0] ?? "",
            date: md.date?.[0] ?? "",
            type: md.type?.[0] ?? "",
            url: endereco ?? (doi ? `https://doi.org/${doi}` : repo.repository.url),
            ...(doi ? { doi } : {}),
            subjectAreas: md.subject ?? [],
            ...(md.language?.[0] ? { language: md.language[0] } : {}),
            accessMethod: "oai-pmh" as const,
            audit: {
                methodology: "CUSTOM" as any,
                searchQueryUsed: `OAI-PMH ListRecords (${filtros})`,
                extractionDate,
                provenanceSource: coleta.endpoint,
            },
        };
    });
}

/**
 * A base de um export importado. Sob o plano congelado, quando a chamada não diz `sourceName`, a
 * trava da busca aceita a importação se o plano tem uma só fonte para a tool — e a base é essa
 * fonte. Antes, a importação ignorava o que o plano já dizia: os registros entravam sem base e o
 * gate de procedência reprovava na exportação. `fontesDoPlano`: as que a trava escolheu.
 */
export function baseDaImportacao(sourceName: string | undefined, fontesDoPlano?: string[]): string | undefined {
    const declarada = (sourceName ?? "").trim();
    if (declarada) return declarada;
    return fontesDoPlano && fontesDoPlano.length === 1 && fontesDoPlano[0]!.trim() ? fontesDoPlano[0]!.trim() : undefined;
}

/**
 * Aviso, na hora da importação, dos registros que ficaram sem base (nem `sourceName`, nem a fonte
 * do plano, nem a tag DB do RIS). A importação não fabrica procedência; o gate de procedência
 * reprova esses registros na exportação, e antes ninguém sabia disso até lá.
 */
export function avisoSemBase(results: SearchResult[]): string {
    const sem = results.filter((r) => !String(r?.repositoryName ?? "").trim()).length;
    if (sem === 0) return "";
    return `\n\n⚠️ ${sem} de ${results.length} registro(s) sem base declarada (nem sourceName, nem fonte do plano, nem tag DB no RIS): ` +
        `a exportação vai recusá-los (procedência, RV-08). Para corrigir, importe de novo dizendo a base em sourceName.`;
}

/** Rótulo da base no log PRISMA-S: a declarada ou a lida no RIS; "origem Indefinida" se nenhuma. */
export function rotuloDaBase(results: SearchResult[], base: string | undefined): string {
    if (base) return base;
    const lidas = [...new Set(results.map((r) => String(r?.repositoryName ?? "").trim()).filter(Boolean))];
    return lidas.join(" | ") || "origem Indefinida";
}
