
import { SearchResult } from "../types.js";
import * as crypto from "node:crypto";

/**
 * Resultado da verificação de origem (RV-08).
 *
 * Existe porque a skill `prisma-rigor-gates` declara `export_dataset` como verificador da
 * RV-08 — "Origem rastreável (repositório + instituição + URL)" — e o código carimbava
 * "PRISMA-S Compliant / Strict Protocol Enforced" incondicionalmente, inclusive sobre
 * registro sem repositório e sem URL. Um carimbo que não verifica nada é pior que carimbo
 * nenhum: ele viaja para dentro do artigo publicado como afirmação de conformidade.
 */
export interface ProvenanceCheck {
    valid: boolean;
    total: number;
    /** Registros sem repositório ou sem URL — origem não rastreável. Bloqueia. */
    missing: Array<{ identifier: string; title: string; faltando: string[] }>;
    /** Sem instituição. NÃO bloqueia: o campo é opcional no tipo e nem toda fonte a expõe. */
    semInstituicao: number;
    errors: string[];
}

export class DataService {

    /**
     * Verifica a origem de cada registro (RV-08), antes de qualquer carimbo.
     *
     * HARD (bloqueia): `repositoryName` ou `repositoryId`, e `url`. Sem esses dois a origem
     * não é rastreável de forma nenhuma, e a revisão não consegue dizer de onde o estudo veio.
     *
     * SOFT (só informa): `institution`. É opcional no `SearchResult` e fontes de API como
     * OpenAlex e Crossref frequentemente não a trazem — exigi-la bloquearia export legítimo.
     * O número aparece no relatório para que a decisão seja do pesquisador, não silenciosa.
     */
    checkProvenance(records: SearchResult[]): ProvenanceCheck {
        const missing: ProvenanceCheck["missing"] = [];
        let semInstituicao = 0;

        for (const r of records) {
            const faltando: string[] = [];
            if (!String(r.repositoryName || "").trim() && !String(r.repositoryId || "").trim()) {
                faltando.push("repositoryName/repositoryId");
            }
            if (!String(r.url || "").trim()) faltando.push("url");
            if (!String(r.institution || "").trim()) semInstituicao++;
            if (faltando.length) {
                missing.push({
                    identifier: String(r.identifier || "(sem id)"),
                    title: String(r.title || "").slice(0, 80),
                    faltando
                });
            }
        }

        const errors: string[] = [];
        if (missing.length) {
            errors.push(
                `RV-08: ${missing.length} de ${records.length} registro(s) sem origem rastreável. ` +
                `A revisão não pode declarar de onde esses estudos vieram. ` +
                `Primeiros: ${missing.slice(0, 5).map((m) => `${m.identifier} (falta ${m.faltando.join(", ")})`).join("; ")}` +
                (missing.length > 5 ? ` … e mais ${missing.length - 5}.` : "")
            );
        }

        return { valid: missing.length === 0, total: records.length, missing, semInstituicao, errors };
    }

    /** Carimbo emitido SOMENTE quando a verificação passa. */
    private selo(check: ProvenanceCheck): string {
        return check.valid
            ? `RV-08 verificada: ${check.total} registro(s), origem rastreável em todos`
            : `NAO CONFORME — RV-08: ${check.missing.length} de ${check.total} registro(s) sem origem rastreavel`;
    }

    exportDataset(records: SearchResult[], format: "csv" | "markdown" | "json" | "asreview"): string {
        const check = this.checkProvenance(records);
        if (format === "json") {
            const output = {
                _validation: {
                    rv08_valid: check.valid,
                    stamp: this.selo(check),
                    registros_sem_origem: check.missing,
                    registros_sem_instituicao: check.semInstituicao,
                    timestamp: new Date().toISOString(),
                    engine: "ReviewBR MCP Coordinator"
                },
                results: records
            };
            return JSON.stringify(output, null, 2);
        }

        // ASReview-compatible CSV: clean format, no comment lines, required columns
        if (format === "asreview") {
            const header = "title,abstract,keywords,authors,doi,url\n";
            const rows = records.map(r => {
                const title = (r.title || "").replace(/"/g, '""');
                const abstract = (r.description || "").replace(/"/g, '""');
                const keywords = (r.subjectAreas || []).join("; ").replace(/"/g, '""');
                const authors = r.creators.join("; ").replace(/"/g, '""');
                const doi = (r.doi || "").replace(/"/g, '""');
                const url = (r.url || "").replace(/"/g, '""');
                return `"${title}","${abstract}","${keywords}","${authors}","${doi}","${url}"`;
            });
            return header + rows.join("\n");
        }

        if (format === "csv") {
            const header = "id,title,abstract,year,authors,keywords,doi,url,repo,layer\n";
            const rows = records.map(r => {
                const authors = r.creators.join("; ").replace(/"/g, '""');
                const title = (r.title || "").replace(/"/g, '""');
                const abstract = (r.description || "").replace(/"/g, '""');
                const keywords = (r.subjectAreas || []).join("; ").replace(/"/g, '""');
                const year = r.date ? r.date.substring(0, 4) : "";
                return `"${r.identifier}","${title}","${abstract}","${year}","${authors}","${keywords}","${r.doi || ""}","${r.url}","${r.repositoryName}","${(r as any).layer || ""}"`;
            });
            const stamp = `# ${this.selo(check)}\n`;
            return stamp + header + rows.join("\n");
        }

        if (format === "markdown") {
            // Bibliography style
            const formatted = records.sort((a, b) => (a.title || "").localeCompare(b.title || "")).map(r => {
                const authors = r.creators.length > 0 ? `**${r.creators[0]} et al.**` : "**Unknown**";
                const year = r.date ? r.date.substring(0, 4) : "s.d.";
                return `- ${authors}. *${r.title}*. ${r.repositoryName}, ${year}. [Link](${r.url})`;
            });
            const stamp = check.valid
                ? `> **✓ ${this.selo(check)}**\n> **Gerado por:** ReviewBR MCP\n\n`
                : `> **⚠️ ${this.selo(check)}**\n> Este arquivo NÃO serve como evidência de conformidade.\n> **Gerado por:** ReviewBR MCP\n\n`;
            return stamp + formatted.join("\n");
        }

        return "";
    }

    /**
     * Importa RIS preservando a ORIGEM REAL.
     *
     * O defeito corrigido: `sourceName` tinha default "Manual Import" e o handler nunca o
     * passava, então TODO registro importado nascia com `repositoryName: "Manual Import"` —
     * a origem real, que frequentemente está no próprio arquivo (tag `DB`, o nome da base de
     * onde o export saiu), era descartada.
     *
     * E o agravante é a interação com o gate da RV-08 no export: "Manual Import" é texto
     * não-vazio, logo PASSA na verificação de origem. O export carimbaria "RV-08 verificada"
     * sobre registros cuja procedência foi apagada na importação. Origem falsa que satisfaz o
     * verificador é pior que origem ausente, porque a ausência ao menos reprova.
     *
     * Ordem de precedência da origem: (1) `sourceName` declarado por quem importa; (2) tag
     * `DB` do próprio RIS; (3) nada — e nada é deixado VAZIO de propósito, para que o gate da
     * RV-08 reprove no export em vez de aprovar uma procedência inventada.
     */
    importRis(risContent: string, sourceName?: string): SearchResult[] {
        // Vazio quando não há origem declarada nem no RIS: o gate da RV-08 reprova no export,
        // que é o comportamento correto. Carimbar "Manual Import" faria a origem apagada PASSAR.
        const origemDe = (e: Partial<SearchResult>): string =>
            (sourceName ?? "").trim() || String((e as any)._dbTag ?? "").trim() || "";

        const entries: SearchResult[] = [];
        let current: Partial<SearchResult> = {};
        // O export do Web of Science começa com BOM: sem retirá-lo, a primeira linha não é lida
        // como `TY` e o primeiro registro entra sem `accessMethod` (falha F9, 19/11/2026).
        // O mesmo export usa CR sozinho como fim de linha em parte do arquivo (falha F10,
        // 20/11/2026): partir só por \r?\n fundia essas linhas.
        const lines = risContent.replace(/^﻿/, "").split(/\r\n|\n|\r/);
        // Campo RIS: duas letras (ou letra e dígito), dois espaços, hífen. Linha fora desse
        // formato é continuação do campo anterior (o WoS quebra o resumo em parágrafos). Antes,
        // a tag era lida nos dois primeiros caracteres de qualquer linha: a continuação sumia
        // (falha F10: o resumo de Porto-Luz et al. 2020 entrou só com a primeira linha), e uma
        // continuação começada por "TI…" ou "AB…" sobrescreveria o campo.
        const CAMPO = /^([A-Z][A-Z0-9])  -(?: (.*))?$/;
        let ultimo = "";

        for (const line of lines) {
            const m = CAMPO.exec(line);
            if (!m) {
                const resto = line.trim();
                if (resto) this.continuarCampo(current, ultimo, resto);
                continue;
            }
            const tag = m[1]!;
            const value = (m[2] ?? "").trim();
            ultimo = tag;

            if (tag === 'TY') {
                if (Object.keys(current).length > 0) entries.push(this.finalizeEntry(current, origemDe(current)));
                current = { accessMethod: "manual_import" };
            } else if (tag === 'TI' || tag === 'T1') {
                current.title = value;
            } else if (tag === 'AU' || tag === 'A1') {
                if (!current.creators) current.creators = [];
                current.creators.push(value);
            } else if (tag === 'PY' || tag === 'Y1') {
                current.date = value;
            } else if (tag === 'UR' || tag === 'L1') {
                current.url = value;
            } else if (tag === 'DO') {
                current.doi = value;
            } else if (tag === 'AB' || tag === 'N2') {
                current.description = value;
            } else if (tag === 'JO' || tag === 'JF' || tag === 'T2') {
                current.journal = value;
            } else if (tag === 'KW') {
                if (!current.subjectAreas) current.subjectAreas = [];
                current.subjectAreas.push(value);
            } else if (tag === 'DB') {
                // A base de onde o export saiu, quando o gerador do RIS a informa.
                (current as any)._dbTag = value;
            } else if (tag === 'ER') {
                if (Object.keys(current).length > 0) {
                    entries.push(this.finalizeEntry(current, origemDe(current)));
                    current = {};
                }
            }
        }
        return entries;
    }

    /** Junta a linha de continuação ao campo RIS lido por último. Resumo guarda a quebra de
     *  parágrafo; título, autor, palavra-chave e periódico continuam na mesma linha. Campo que
     *  a importação não lê (AD, N1…) leva a continuação junto. */
    private continuarCampo(current: Partial<SearchResult>, tag: string, resto: string): void {
        const junta = (a: string | undefined, sep: string) => (a ? a + sep + resto : resto);
        const ultimoDe = (arr: string[] | undefined) => {
            if (arr && arr.length) arr[arr.length - 1] = junta(arr[arr.length - 1], " ");
        };
        if (tag === 'AB' || tag === 'N2') current.description = junta(current.description, "\n");
        else if (tag === 'TI' || tag === 'T1') current.title = junta(current.title, " ");
        else if (tag === 'JO' || tag === 'JF' || tag === 'T2') current.journal = junta(current.journal, " ");
        else if (tag === 'AU' || tag === 'A1') ultimoDe(current.creators);
        else if (tag === 'KW') ultimoDe(current.subjectAreas);
    }

    /**
     * Parses CSV exported from BVS/LILACS portal.
     * Expected columns: ID, Title, Authors, Source, Journal, Database, Type, Language,
     * Publication year, Descriptor(s), Keyword(s), Publication Country, Fulltext URL,
     * Abstract, Entry Date, Volume number, Issue number, DOI, ISSN, Accession number, PMCID
     */
    importBvsCSV(csvContent: string): SearchResult[] {
        const entries: SearchResult[] = [];
        const lines = this.parseCSVLines(csvContent);

        if (lines.length < 2) return entries;

        // Normalize headers (trim whitespace, lowercase)
        const headers = lines[0].map(h => h.trim().toLowerCase());

        for (let i = 1; i < lines.length; i++) {
            const row = lines[i];
            if (row.length < 2) continue;

            const get = (col: string): string => {
                const idx = headers.indexOf(col);
                return idx >= 0 && idx < row.length ? row[idx].trim() : "";
            };

            const authors = get("authors")
                .split(";")
                .map(a => a.trim())
                .filter(a => a.length > 0);

            const keywords = [get("descriptor(s)"), get("keyword(s)")]
                .join("; ")
                .split(";")
                .map(k => k.trim())
                .filter(k => k.length > 0);

            const entry: SearchResult = {
                repositoryId: get("database") || "LILACS",
                repositoryName: `BVS/${get("database") || "LILACS"}`,
                identifier: get("id") || get("accession number") || `BVS-${i}`,
                title: get("title"),
                creators: authors,
                description: get("abstract"),
                date: get("publication year"),
                url: get("fulltext url"),
                doi: get("doi"),
                journal: get("journal"),
                issn: get("issn"),
                subjectAreas: keywords,
                type: get("type"),
                accessMethod: "bvs_import",
                audit: {
                    methodology: "CUSTOM" as any,
                    searchQueryUsed: "BVS_LILACS_EXPORT",
                    extractionDate: new Date().toISOString(),
                    provenanceSource: get("database") ? `BVS/${get("database")}` : "BVS/LILACS Portal CSV"
                }
            };

            if (entry.title) {
                entries.push(entry);
            }
        }

        return entries;
    }

    /**
     * Simple RFC 4180-compliant CSV parser that handles quoted fields with commas and newlines.
     */
    private parseCSVLines(csv: string): string[][] {
        const results: string[][] = [];
        let current: string[] = [];
        let field = "";
        let inQuotes = false;

        for (let i = 0; i < csv.length; i++) {
            const ch = csv[i];

            if (inQuotes) {
                if (ch === '"') {
                    if (i + 1 < csv.length && csv[i + 1] === '"') {
                        field += '"';
                        i++; // Skip escaped quote
                    } else {
                        inQuotes = false;
                    }
                } else {
                    field += ch;
                }
            } else {
                if (ch === '"') {
                    inQuotes = true;
                } else if (ch === ',') {
                    current.push(field);
                    field = "";
                } else if (ch === '\n' || ch === '\r') {
                    if (ch === '\r' && i + 1 < csv.length && csv[i + 1] === '\n') {
                        i++;
                    }
                    current.push(field);
                    field = "";
                    if (current.some(f => f.length > 0)) {
                        results.push(current);
                    }
                    current = [];
                } else {
                    field += ch;
                }
            }
        }

        // Last field/row
        current.push(field);
        if (current.some(f => f.length > 0)) {
            results.push(current);
        }

        return results;
    }

    private finalizeEntry(entry: Partial<SearchResult>, sourceName?: string): SearchResult {
        if (!entry.identifier) {
            const hash = crypto.createHash('md5').update(JSON.stringify(entry)).digest('hex');
            entry.identifier = `MANUAL-${hash.substring(0, 8)}`;
        }

        entry.audit = {
            methodology: "CUSTOM" as any,
            searchQueryUsed: "MANUAL_IMPORT",
            extractionDate: new Date().toISOString(),
            provenanceSource: sourceName || "Local File Import"
        };

        // O gate da RV-08 (checkProvenance) procura a origem em repositoryName/repositoryId e o
        // endereço em url. Com a base declarada só em audit.provenanceSource, todo registro
        // importado era bloqueado na exportação (visto na falha F9, 19/11/2026). Sem base
        // declarada, continua vazio, para o gate reprovar.
        if (sourceName && !String(entry.repositoryName ?? "").trim()) entry.repositoryName = sourceName;
        if (!String(entry.url ?? "").trim() && entry.doi) {
            entry.url = "https://doi.org/" + String(entry.doi).trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
        }

        return entry as SearchResult;
    }
}
