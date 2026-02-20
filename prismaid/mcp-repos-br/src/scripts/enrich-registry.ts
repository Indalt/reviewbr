/**
 * Enrichment script — merges OpenDOAR/ROAR data into our registry,
 * adds national aggregators (BDTD, OASIS.BR, SciELO), and deduplicates.
 * 
 * Run: npx tsx src/scripts/enrich-registry.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const registryPath = join(__dirname, "..", "..", "data", "repositorios_brasileiros.json");

// ─── Load existing registry ──────────────────────────────────

const existing = JSON.parse(readFileSync(registryPath, "utf-8")) as any[];
console.log(`Existing registry: ${existing.length} entries`);

// Build lookup maps for deduplication
const existingByUrl = new Map<string, any>();
const existingByAcronym = new Map<string, any>();
for (const e of existing) {
    const norm = normalizeUrl(e.repository.url);
    existingByUrl.set(norm, e);
    if (e.institution.acronym) {
        existingByAcronym.set(e.institution.acronym.toUpperCase(), e);
    }
}

// ─── OpenDOAR/ROAR data (extracted from browser) ─────────────

const openDoarData: Array<{
    name: string;
    url: string;
    oaiUrl: string | null;
    software: string;
    institution: string;
}> = [
        // ── Research Institutes ──
        { name: "ARCA - Repositório Institucional Fiocruz", url: "https://arca.fiocruz.br", oaiUrl: "https://api.arca.fiocruz.br/oai/request", software: "dspace", institution: "Fundação Oswaldo Cruz" },
        { name: "Repositório Alice (Embrapa)", url: "http://www.embrapa.br/alice", oaiUrl: "http://www.alice.cnptia.embrapa.br/oai/request", software: "dspace", institution: "Embrapa" },
        { name: "Infoteca-e (Embrapa)", url: "http://www.embrapa.br/infoteca", oaiUrl: "http://www.infoteca.cnptia.embrapa.br/oai/request", software: "dspace", institution: "Embrapa" },
        { name: "Biblioteca Digital da Memória Científica do INPE", url: "http://bibdigital.sid.inpe.br", oaiUrl: "http://bibdigital.sid.inpe.br/col/iconet.com.br/banon/2003/11.21.21.08/doc/oai.cgi", software: "other", institution: "INPE" },
        { name: "Carpe dIEN - Instituto de Engenharia Nuclear", url: "http://carpedien.ien.gov.br/", oaiUrl: null, software: "dspace", institution: "IEN" },
        { name: "IPEA - Repositório do Conhecimento", url: "http://repositorio.ipea.gov.br/", oaiUrl: null, software: "dspace", institution: "IPEA" },
        { name: "Patuá - Instituto Evandro Chagas", url: "https://patua.iec.gov.br/", oaiUrl: "https://patua.iec.gov.br/oai/request", software: "dspace", institution: "Instituto Evandro Chagas" },
        { name: "IPEN - Repositório Institucional", url: "http://repositorio.ipen.br:8080/xmlui/", oaiUrl: "http://repositorio.ipen.br:8080/oai/request", software: "dspace", institution: "IPEN" },
        { name: "Repositório INT", url: "http://repositorio.int.gov.br:8080/repositorio", oaiUrl: null, software: "dspace", institution: "INT" },
        { name: "RIGEO - Repositório Institucional de Geociências", url: "http://rigeo.cprm.gov.br/jspui/", oaiUrl: null, software: "dspace", institution: "CPRM" },
        { name: "RIDI - Repositório Digital do IBICT", url: "http://repositorio.ibict.br", oaiUrl: "http://repositorio.ibict.br/oai/request", software: "dspace", institution: "IBICT" },
        { name: "ENAP - Repositório Institucional", url: "http://repositorio.enap.gov.br/", oaiUrl: "http://repositorio.enap.gov.br/oai", software: "dspace", institution: "ENAP" },

        // ── Government / Legal ──
        { name: "Biblioteca Digital do Senado Federal", url: "http://www2.senado.gov.br/bdsf/", oaiUrl: "http://www2.senado.gov.br/bdsf-oai/request", software: "dspace", institution: "Senado Federal" },
        { name: "STJ - Biblioteca Digital Jurídica", url: "http://bdjur.stj.gov.br/", oaiUrl: "http://bdjur.stj.gov.br/dspace-oai/request", software: "dspace", institution: "STJ" },
        { name: "Acervo Digital do Inmetro", url: "http://xrepo01s.inmetro.gov.br/", oaiUrl: null, software: "dspace", institution: "Inmetro" },
        { name: "Livro Aberto - IBICT", url: "http://livroaberto.ibict.br/", oaiUrl: null, software: "dspace", institution: "IBICT" },

        // ── Universities NOT in our CSV ──
        { name: "Repositório FGV", url: "https://repositorio.fgv.br/", oaiUrl: "https://repositorio.fgv.br/server/oai/request", software: "dspace", institution: "FGV" },
        { name: "FGV - Biblioteca Digital", url: "http://bibliotecadigital.fgv.br/dspace/", oaiUrl: "http://bibliotecadigital.fgv.br/dspace-oai", software: "dspace", institution: "FGV" },
        { name: "Pantheon - Repositório UFRJ", url: "https://pantheon.ufrj.br", oaiUrl: "https://pantheon.ufrj.br/oai", software: "dspace", institution: "UFRJ" },
        { name: "Repositório UFSC", url: "http://repositorio.ufsc.br", oaiUrl: "http://repositorio.ufsc.br/oai/request", software: "dspace", institution: "UFSC" },
        { name: "Repositório UFPA", url: "http://www.repositorio.ufpa.br/jspui/", oaiUrl: "http://www.repositorio.ufpa.br:8080/oai/request", software: "dspace", institution: "UFPA" },
        { name: "Repositório UFRN", url: "http://repositorio.ufrn.br:8080/jspui/", oaiUrl: "http://repositorio.ufrn.br:8080/oai/request", software: "dspace", institution: "UFRN" },
        { name: "Repositório UFPE", url: "http://repositorio.ufpe.br", oaiUrl: "http://www.repositorio.ufpe.br/oai/request", software: "dspace", institution: "UFPE" },
        { name: "Repositório UFT", url: "http://repositorio.uft.edu.br/", oaiUrl: "http://repositorio.uft.edu.br/oai/request", software: "dspace", institution: "UFT" },
        { name: "LUME - UFRGS", url: "http://www.lume.ufrgs.br/", oaiUrl: "http://www.lume.ufrgs.br/oai", software: "dspace", institution: "UFRGS" },
        { name: "Manancial - UFSM", url: "http://repositorio.ufsm.br", oaiUrl: "http://repositorio.ufsm.br/oai", software: "dspace", institution: "UFSM" },
        { name: "Repositório UNIFESP", url: "https://repositorio.unifesp.br/", oaiUrl: "https://repositorio.unifesp.br/server/oai/", software: "dspace", institution: "UNIFESP" },
        { name: "Repositório UNESP", url: "http://base.repositorio.unesp.br", oaiUrl: "http://base.repositorio.unesp.br/oai/request", software: "dspace", institution: "UNESP" },
        { name: "Repositório USP - Produção Intelectual", url: "https://repositorio.usp.br/", oaiUrl: "http://repositorio.usp.br/oai/request", software: "dspace", institution: "USP" },
        { name: "USP - Teses e Dissertações", url: "http://www.teses.usp.br/", oaiUrl: "http://www.teses.usp.br/cgi-bin/oai.pl", software: "other", institution: "USP" },
        { name: "Repositório UFMG", url: "https://repositorio.ufmg.br/", oaiUrl: "https://repositorio.ufmg.br/oai", software: "dspace", institution: "UFMG" },
        { name: "Repositório UFJF", url: "https://repositorio.ufjf.br", oaiUrl: "https://repositorio.ufjf.br/cgi/oai", software: "dspace", institution: "UFJF" },
        { name: "LOCUS - UFV", url: "https://www.locus.ufv.br/", oaiUrl: "https://www.locus.ufv.br/oai", software: "dspace", institution: "UFV" },
        { name: "Repositório UFLA", url: "http://repositorio.ufla.br/", oaiUrl: null, software: "dspace", institution: "UFLA" },
        { name: "Repositório UNIR", url: "http://www.ri.unir.br/jspui/", oaiUrl: "http://www.ri.unir.br/oai/request", software: "dspace", institution: "UNIR" },
        { name: "Repositório UFS", url: "https://ri.ufs.br", oaiUrl: null, software: "dspace", institution: "UFS" },
        { name: "Repositório UFC", url: "http://www.repositorio.ufc.br:8080/ri/", oaiUrl: null, software: "dspace", institution: "UFC" },
        { name: "Repositório FURG", url: "http://repositorio.furg.br/", oaiUrl: null, software: "dspace", institution: "FURG" },
        { name: "Repositório UNB", url: "http://repositorio.unb.br", oaiUrl: "http://repositorio.unb.br/oai/request", software: "dspace", institution: "UNB" },
        { name: "Acervo Digital UFPR", url: "http://acervodigital.ufpr.br/", oaiUrl: "http://acervodigital.ufpr.br/oai/request", software: "dspace", institution: "UFPR" },
        { name: "Repositório UFES", url: "http://repositorio.ufes.br/", oaiUrl: null, software: "dspace", institution: "UFES" },
        { name: "RIUFF - UFF", url: "https://app.uff.br/riuff/", oaiUrl: "https://app.uff.br/oai", software: "dspace", institution: "UFF" },
        { name: "Repositório UFRA", url: "http://repositorio.ufra.edu.br/", oaiUrl: null, software: "dspace", institution: "UFRA" },
        { name: "Repositório UFERSA", url: "https://repositorio.ufersa.edu.br/", oaiUrl: "https://repositorio.ufersa.edu.br/oai/request", software: "dspace", institution: "UFERSA" },
        { name: "Repositório UFAC", url: "http://repositorios.ufac.br:8080/repositorio/", oaiUrl: "http://repositorios.ufac.br:8080/oai/request", software: "dspace", institution: "UFAC" },
        { name: "Repositório UFOPA", url: "https://repositorio.ufopa.edu.br/jspui/", oaiUrl: null, software: "dspace", institution: "UFOPA" },
        { name: "RD-UFFS", url: "https://rd.uffs.edu.br/", oaiUrl: "https://rd.uffs.edu.br/oai/request", software: "dspace", institution: "UFFS" },
        { name: "Repositório UNIFAP", url: "http://repositorio.unifap.br", oaiUrl: null, software: "dspace", institution: "UNIFAP" },
        { name: "BDM - UnB Monografias", url: "http://bdm.bce.unb.br/", oaiUrl: "http://bdm.bce.unb.br/dspace-oai/request", software: "dspace", institution: "UNB" },
        { name: "Repositório UFMS", url: "http://repositorio.cbc.ufms.br:8080/jspui/", oaiUrl: null, software: "dspace", institution: "UFMS" },
        { name: "RI-UEM", url: "http://repositorio.uem.br:8080/jspui/", oaiUrl: null, software: "dspace", institution: "UEM" },
        { name: "RI-UEPG", url: "http://ri.uepg.br:8080/riuepg", oaiUrl: "http://200.201.9.45:8080/oai/request", software: "dspace", institution: "UEPG" },
        { name: "RI-UFGD", url: "http://www.ufgd.edu.br:8080/jspui/", oaiUrl: null, software: "dspace", institution: "UFGD" },
        { name: "Repositório UFOP", url: "http://www.repositorio.ufop.br/", oaiUrl: null, software: "dspace", institution: "UFOP" },
        { name: "Saber Aberto - UNEB", url: "https://saberaberto.uneb.br/home", oaiUrl: "https://saberaberto.uneb.br/server/oai/", software: "dspace", institution: "UNEB" },
        { name: "Repositório UDESC", url: "https://repositorio.udesc.br/home", oaiUrl: "https://repositorio-api.udesc.br/server/oai/request", software: "dspace", institution: "UDESC" },

        // ── Institutos Federais ──
        { name: "Memoria - IFRN", url: "http://memoria.ifrn.edu.br", oaiUrl: null, software: "dspace", institution: "IFRN" },
        { name: "RI-IFRS", url: "https://repositorio.ifrs.edu.br/", oaiUrl: "https://repositorio.ifrs.edu.br/oai", software: "dspace", institution: "IFRS" },
        { name: "RI-IFES", url: "http://repositorio.ifes.edu.br/", oaiUrl: "http://repositorio.ifes.edu.br/oai", software: "dspace", institution: "IFES" },
        { name: "Arandu - IFFarroupilha", url: "http://arandu.iffarroupilha.edu.br/", oaiUrl: "http://arandu.iffarroupilha.edu.br/oai/", software: "dspace", institution: "IFFarroupilha" },

        // ── Private/Community Institutions ──
        { name: "PUCRS - Repositório", url: "http://repositorio.pucrs.br/dspace/", oaiUrl: "http://repositorio.pucrs.br/oai/request", software: "dspace", institution: "PUCRS" },
        { name: "Maxwell - PUC-Rio", url: "http://www.maxwell.lambda.ele.puc-rio.br/", oaiUrl: null, software: "other", institution: "PUC-Rio" },
        { name: "Repositório UniCEUB", url: "http://repositorio.uniceub.br/", oaiUrl: "http://repositorio.uniceub.br/oai/request", software: "dspace", institution: "UniCEUB" },
        { name: "RUNA - Ânima Educação", url: "https://repositorio.animaeducacao.com.br/", oaiUrl: null, software: "dspace", institution: "Ânima" },
        { name: "Repositório FUMEC", url: "https://repositorio.fumec.br", oaiUrl: null, software: "dspace", institution: "FUMEC" },
        { name: "Repositório Universidade Brasil", url: "https://repositorioacademico.universidadebrasil.edu.br/", oaiUrl: "https://repositorioacademico.universidadebrasil.edu.br/server/oai/request", software: "dspace", institution: "Universidade Brasil" },
        { name: "BDU - Univates", url: "http://www.univates.br/bdu/", oaiUrl: "http://www.univates.br/bdu_oai/request", software: "dspace", institution: "Univates" },
        { name: "Repositório USCS", url: "http://repositorio.uscs.edu.br", oaiUrl: null, software: "dspace", institution: "USCS" },
        { name: "Repositório FJP", url: "https://repositorio.fjp.mg.gov.br/", oaiUrl: "https://repositorio.fjp.mg.gov.br/server/oai/", software: "dspace", institution: "FJP" },
        { name: "RIUT - UTFPR", url: "http://repositorio.utfpr.edu.br/jspui/", oaiUrl: "http://repositorio.utfpr.edu.br:8080/oai/request", software: "dspace", institution: "UTFPR" },

        // ── Special / Cultural ──
        { name: "RUBI - Casa de Rui Barbosa", url: "http://rubi.casaruibarbosa.gov.br", oaiUrl: "http://rubi.casaruibarbosa.gov.br/oai", software: "dspace", institution: "Fundação Casa de Rui Barbosa" },
        { name: "ARES - UNA-SUS", url: "https://ares.unasus.gov.br/acervo/", oaiUrl: "https://ares.unasus.gov.br/oai/request", software: "dspace", institution: "UNA-SUS" },
        { name: "Repositório Digital Huet (INES)", url: "http://repositorio.ines.gov.br/ilustra/", oaiUrl: null, software: "dspace", institution: "INES" },
        { name: "Repositório UNILAB", url: "http://www.repositorio.unilab.edu.br/jspui/", oaiUrl: null, software: "dspace", institution: "UNILAB" },
        { name: "Repositório UNILA", url: "http://dspace.unila.edu.br/", oaiUrl: "http://dspace.unila.edu.br/oai/request", software: "dspace", institution: "UNILA" },
        { name: "Unipampa Digital Repository", url: "http://dspace.unipampa.edu.br:8080/xmlui/", oaiUrl: null, software: "dspace", institution: "Unipampa" },
        { name: "Base de Dados Científicos UFPR", url: "https://bdc.c3sl.ufpr.br/", oaiUrl: "https://bdc.c3sl.ufpr.br/oai/request", software: "dspace", institution: "UFPR" },
        { name: "Portal de Periódicos UFRJ", url: "https://revistas.ufrj.br", oaiUrl: "https://revistas.ufrj.br/index.php/index/oai", software: "ojs", institution: "UFRJ" },
        { name: "BDTD UERJ", url: "http://www.bdtd.uerj.br/", oaiUrl: "http://www.bdtd.uerj.br/tde_oai/oai3.php", software: "other", institution: "UERJ" },
        { name: "Repositório Rede CEDES", url: "http://www.cedes.ufsc.br:8080/xmlui", oaiUrl: "http://www.cedes.ufsc.br:8080/oai/request", software: "dspace", institution: "Rede CEDES" },
        { name: "Repositório FEBAB", url: "http://repositorio.febab.org.br/", oaiUrl: "http://repositorio.febab.org.br/oai-pmh-repository/request", software: "other", institution: "FEBAB" },
        { name: "IME-USP Eprints", url: "http://eprints.ime.usp.br/", oaiUrl: "http://eprints.ime.usp.br/perl/oai2", software: "eprints", institution: "USP" },
        { name: "Repositório CFB/CRB", url: "http://repositorio.cfb.org.br/", oaiUrl: null, software: "dspace", institution: "CFB/CRB" },
        { name: "Repositório FAEMA", url: "http://repositorio.faema.edu.br:8000/", oaiUrl: null, software: "dspace", institution: "FAEMA" },
        { name: "Repositório Fasipe", url: "https://repositorio.fasipe.com.br/home", oaiUrl: null, software: "dspace", institution: "Fasipe" },
        { name: "FACIMED - Alpha Repositório", url: "http://repositorio.facimed.edu.br/xmlui/", oaiUrl: "http://repositorio.facimed.edu.br/solr/oai", software: "dspace", institution: "FACIMED" },
    ];

// ─── National aggregators ─────────────────────────────────────

const aggregators = [
    {
        id: "BR-AGG-0001",
        institution: { name: "IBICT - Biblioteca Digital Brasileira de Teses e Dissertações", acronym: "BDTD", type: "federal", state: "DF", city: "Brasília" },
        repository: { name: "BDTD", url: "http://bdtd.ibict.br/", platform: "other", contentType: "theses" },
        access: {
            oaiPmh: { available: true, endpoint: "http://oai.ibict.br/mypoai/oai2.php", verified: false, lastVerified: null },
            restApi: { available: false, endpoint: null, version: null },
            searchEndpoints: ["/vufind/Search/Results"],
        },
        status: "active",
    },
    {
        id: "BR-AGG-0002",
        institution: { name: "SciELO - Scientific Electronic Library Online", acronym: "SciELO", type: "federal", state: "SP", city: "São Paulo" },
        repository: { name: "SciELO Brasil", url: "https://scielo.br/", platform: "other", contentType: "articles" },
        access: {
            oaiPmh: { available: true, endpoint: "http://www.scielo.br/oai/scielo-oai.php", verified: false, lastVerified: null },
            restApi: { available: false, endpoint: null, version: null },
            searchEndpoints: ["/cgi-bin/wxis.exe/"],
        },
        status: "active",
    },
    {
        id: "BR-AGG-0003",
        institution: { name: "IBICT - Portal Brasileiro de Publicações Científicas em Acesso Aberto", acronym: "OASIS.BR", type: "federal", state: "DF", city: "Brasília" },
        repository: { name: "OASIS.BR", url: "https://oasisbr.ibict.br/", platform: "other", contentType: "mixed" },
        access: {
            oaiPmh: { available: false, endpoint: null, verified: false, lastVerified: null },
            restApi: { available: false, endpoint: null, version: null },
            searchEndpoints: ["/solr/"],
        },
        status: "active",
    },
];

// ─── Merge logic ──────────────────────────────────────────────

let nextId = existing.length + 1;

function normalizeUrl(url: string): string {
    return url
        .replace(/^https?:\/\//, "")
        .replace(/www\./, "")
        .replace(/\/+$/, "")
        .replace(/:8080/, "")
        .replace(/\/jspui.*$/, "")
        .replace(/\/xmlui.*$/, "")
        .replace(/\/dspace.*$/, "")
        .toLowerCase();
}

function guessState(institution: string): string {
    const stateHints: Record<string, string> = {
        "Fiocruz": "RJ", "Embrapa": "DF", "INPE": "SP", "IEN": "RJ", "IPEA": "DF",
        "IPEN": "SP", "INT": "RJ", "CPRM": "RJ", "IBICT": "DF", "ENAP": "DF",
        "Inmetro": "RJ", "FGV": "RJ", "UFRJ": "RJ", "UFSC": "SC", "UFPA": "PA",
        "UFRN": "RN", "UFPE": "PE", "UFT": "TO", "UFRGS": "RS", "UFSM": "RS",
        "UNIFESP": "SP", "UNESP": "SP", "USP": "SP", "UFMG": "MG", "UFJF": "MG",
        "UFV": "MG", "UFLA": "MG", "UNIR": "RO", "UFS": "SE", "UFC": "CE",
        "FURG": "RS", "UNB": "DF", "UFPR": "PR", "UFES": "ES", "UFF": "RJ",
        "UFRA": "PA", "UFERSA": "RN", "UFAC": "AC", "UFOPA": "PA", "UFFS": "SC",
        "UNIFAP": "AP", "UFMS": "MS", "UEM": "PR", "UEPG": "PR", "UFGD": "MS",
        "UFOP": "MG", "UNEB": "BA", "UDESC": "SC", "IFRN": "RN", "IFRS": "RS",
        "IFES": "ES", "IFFarroupilha": "RS", "PUCRS": "RS", "PUC-Rio": "RJ",
        "UniCEUB": "DF", "FUMEC": "MG", "Univates": "RS", "USCS": "SP",
        "FJP": "MG", "UTFPR": "PR", "INES": "RJ", "UNILAB": "CE",
        "UNILA": "PR", "Unipampa": "RS", "UERJ": "RJ", "UFMA": "MA",
        "Senado Federal": "DF", "STJ": "DF", "UNA-SUS": "DF",
        "Ânima": "SC", "Universidade Brasil": "SP", "FAEMA": "RO",
        "Fasipe": "MT", "FACIMED": "RO", "FEBAB": "SP", "CFB/CRB": "DF",
        "Rede CEDES": "SC", "Instituto Evandro Chagas": "PA",
        "Fundação Casa de Rui Barbosa": "RJ",
    };
    return stateHints[institution] ?? "??";
}

function guessInstitutionType(institution: string): string {
    const federalKeywords = ["UF", "UFRJ", "UFSC", "UFPA", "UFRN", "UFPE", "UFT", "UFRGS", "UFSM",
        "UNIFESP", "UFMG", "UFJF", "UFV", "UFLA", "UNIR", "UFS", "UFC", "FURG", "UNB", "UFPR",
        "UFES", "UFF", "UFRA", "UFERSA", "UFAC", "UFOPA", "UFFS", "UNIFAP", "UFMS", "UFGD",
        "UFOP", "UNILA", "UNILAB", "Embrapa", "INPE", "IPEA", "IBICT", "ENAP", "Fiocruz",
        "IEN", "IPEN", "INT", "CPRM", "Inmetro", "INES", "UNA-SUS", "Senado", "STJ", "UFMA",
        "Instituto Evandro", "Fundação Casa de Rui", "Unipampa"];
    const estadualKeywords = ["UNESP", "USP", "UERJ", "UNEB", "UDESC", "UEM", "UEPG"];
    const ifKeywords = ["IFRN", "IFRS", "IFES", "IFFarroupilha"];

    for (const k of ifKeywords) {
        if (institution.includes(k)) return "instituto_federal";
    }
    for (const k of federalKeywords) {
        if (institution.includes(k)) return "federal";
    }
    for (const k of estadualKeywords) {
        if (institution.includes(k)) return "estadual";
    }
    return "privada";
}

const newEntries: any[] = [];
let duplicates = 0;

for (const od of openDoarData) {
    const normUrl = normalizeUrl(od.url);

    // Check if already in registry by URL
    if (existingByUrl.has(normUrl)) {
        // Update OAI info if available and missing
        const existing = existingByUrl.get(normUrl)!;
        if (od.oaiUrl && !existing.access.oaiPmh.endpoint) {
            existing.access.oaiPmh.available = true;
            existing.access.oaiPmh.endpoint = od.oaiUrl;
            console.log(`  ↺ Updated OAI-PMH for ${existing.id}: ${od.oaiUrl}`);
        }
        duplicates++;
        continue;
    }

    // Check by institution acronym
    if (existingByAcronym.has(od.institution.toUpperCase())) {
        const existing = existingByAcronym.get(od.institution.toUpperCase())!;
        if (od.oaiUrl && !existing.access.oaiPmh.endpoint) {
            existing.access.oaiPmh.available = true;
            existing.access.oaiPmh.endpoint = od.oaiUrl;
            console.log(`  ↺ Updated OAI-PMH for ${existing.id} (by acronym ${od.institution}): ${od.oaiUrl}`);
        }
        duplicates++;
        continue;
    }

    const state = guessState(od.institution);
    const type = guessInstitutionType(od.institution);
    const id = `BR-${type === "instituto_federal" ? "IF" : type === "federal" ? "FED" : type === "estadual" ? "EST" : "PRI"}-${String(nextId).padStart(4, "0")}`;
    nextId++;

    newEntries.push({
        id,
        institution: {
            name: od.institution,
            acronym: od.institution,
            type,
            state,
            city: "",
        },
        repository: {
            name: od.name,
            url: od.url,
            platform: od.software === "dspace" ? "dspace" : od.software === "eprints" ? "other" : od.software === "ojs" ? "ojs" : "other",
            contentType: "mixed",
        },
        access: {
            oaiPmh: {
                available: !!od.oaiUrl,
                endpoint: od.oaiUrl,
                verified: false,
                lastVerified: null,
            },
            restApi: {
                available: od.software === "dspace",
                endpoint: od.software === "dspace" ? "/server/api" : null,
                version: od.software === "dspace" ? 7 : null,
            },
            searchEndpoints: od.software === "dspace"
                ? ["/discover", "/simple-search", "/jspui/simple-search"]
                : ["/simple-search"],
        },
        status: "active",
    });
}

console.log(`\nDeduplication: ${duplicates} existing matches`);
console.log(`New entries from OpenDOAR: ${newEntries.length}`);

// Add aggregators
const allEntries = [...existing, ...aggregators, ...newEntries];
console.log(`\nFinal registry: ${allEntries.length} entries`);
console.log(`  - Original: ${existing.length}`);
console.log(`  - Aggregators: ${aggregators.length}`);
console.log(`  - New from OpenDOAR: ${newEntries.length}`);

// Write enriched registry
writeFileSync(registryPath, JSON.stringify(allEntries, null, 2), "utf-8");
console.log(`\nWritten to ${registryPath}`);
