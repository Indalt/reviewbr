import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";
import { ProjectStateService } from "./project_state.js";
import { SCIELO_VIA_OPENALEX } from "./snowball.js";
import { rotaPrimaria } from "../access/strategy.js";
import type { RepositoryEntry } from "../types.js";

/**
 * Plano de busca — a parte de busca do protocolo como DADO (linha 17 da FILA, aprovada pelo
 * Vicente em 20/11/2026).
 *
 * POR QUE EXISTE
 * --------------
 * A trava do protocolo protegia o momento (nada se busca antes de travar), não o conteúdo: depois
 * da trava nenhum código lia o protocolo, nada guardava o que ele usava no dia da trava, e a emenda
 * da RV-01 existia só como frase da spec. No `roda_aromas_ceara` (travado em 15/11/2026), a
 * manutenção de 19/11 mudou o caminho de cinco fontes atrás dos mesmos nomes (tool e id do
 * catálogo), e a busca seguiria por ele sem nada parar.
 *
 * O QUE ELE É
 * -----------
 * O `designer` escreve, a partir do protocolo, `plano_busca.json` na raiz do projeto: por fonte, o
 * modo (tool ou à mão), a tool, o id do catálogo, os textos exatos, os filtros e o que o protocolo
 * manda registrar em cada busca. O `submit_protocol_for_approval` não trava sem ele, mostra-o ao
 * pesquisador e congela no `project_state.json` o plano — com a rota que o sistema dá hoje a cada
 * fonte — e o hash do `protocol.md`. Vale para todo protocolo e toda fonte que ele nomear (decisão
 * do Vicente, 20/11/2026): nada aqui conhece uma base pelo nome.
 *
 * O QUE ELE NÃO É: leitura da prosa do protocolo por código. O plano é escrito pelo agente e
 * aprovado pelo pesquisador na trava; a correspondência com a prosa é dele conferir ao ver o plano.
 */

export const ARQUIVO_PLANO = "plano_busca.json";

/** Tools que executam uma busca ou importam um export para a identificação (01_raw). */
export const TOOLS_DE_BUSCA = new Set([
    "search_openalex", "search_pubmed", "search_crossref", "search_core", "search_europe_pmc",
    "search_scielo", "search_semanticscholar", "search_papers_optimized", "search_repository",
    "harvest_records", "expand_search_snowball", "import_dataset_ris", "import_bvs_export",
]);
/** Importam o export de uma busca feita à mão na interface da base. */
export const TOOLS_DE_IMPORTACAO = new Set(["import_dataset_ris", "import_bvs_export"]);
/** Não recebem texto de busca (colheita OAI-PMH, busca por citação). */
export const TOOLS_SEM_TEXTO = new Set(["harvest_records", "expand_search_snowball"]);
/** Buscam num repositório do catálogo, que a fonte do plano nomeia pelo id. */
export const TOOLS_COM_REPOSITORIO = new Set(["search_repository", "harvest_records"]);

/**
 * Rota de cada tool que não depende do catálogo: o endereço e o filtro fixos no código. Quem mudar
 * a rota de uma destas tools muda a descrição aqui, e o projeto travado para na próxima busca
 * (maintainer.md). A do SciELO é lida da própria constante que a busca usa.
 */
export const ROTA_POR_TOOL: Record<string, string> = {
    search_openalex: "OpenAlex, https://api.openalex.org/works?search=",
    search_crossref: "Crossref, https://api.crossref.org/works?query=",
    search_core: "CORE, https://api.core.ac.uk/v3/search/works",
    search_europe_pmc: "Europe PMC, https://www.ebi.ac.uk/europepmc/webservices/rest/search",
    search_semanticscholar: "Semantic Scholar, https://api.semanticscholar.org/graph/v1/paper/search/bulk",
    search_pubmed: "PubMed, https://eutils.ncbi.nlm.nih.gov/entrez/eutils",
    search_scielo: `OpenAlex, https://api.openalex.org/works?search=, filtro ${SCIELO_VIA_OPENALEX.filtro}`,
    expand_search_snowball: "OpenAlex, https://api.openalex.org/works?filter=cites: (quem cita as sementes)",
};

export interface FontePlano {
    /** Identificador único da fonte no plano. */
    id: string;
    /** Nome da fonte como o protocolo a chama. */
    nome: string;
    /** `tool`: a tool executa a busca. `manual`: o pesquisador busca na interface da base e a tool importa o export. */
    modo: "tool" | "manual";
    /** Tool que executa a busca (modo tool) ou que importa o export (modo manual). */
    tool: string;
    /** Id do catálogo de repositórios, quando a tool busca num repositório do catálogo. */
    repositorio?: string;
    /** Textos exatos que o protocolo dá a esta fonte (RV-07). */
    textos: string[];
    /** Filtros que o protocolo dá a esta fonte (parâmetro da tool → valor). Ausente = nenhum. */
    filtros?: Record<string, unknown>;
    /** O que o protocolo manda registrar em cada busca desta fonte, além do que a tool grava. */
    registrar?: string[];
    /** Congelada na trava: a rota que o sistema dava a esta fonte. */
    rota?: string;
}

export interface PlanoBusca {
    /** Versão do protocolo a que o plano corresponde, como o protocolo a declara. */
    versao_protocolo?: string;
    fontes: FontePlano[];
}

export interface ExecucaoPlano {
    fonte: string;
    tool: string;
    em: string;
    /** Registros que a execução devolveu; null = não terminou (a fonte não foi alcançada). */
    hits: number | null;
}

/** O plano congelado na trava (ou na última emenda aprovada), no `project_state.json`. */
export interface TravaBusca {
    versao_protocolo: string;
    /** Etapa da trilha em que a busca acontece: a que abre com o protocolo travado. */
    etapa: string;
    protocolo_sha256: string;
    plano: PlanoBusca;
    desde: string;
    execucoes: ExecucaoPlano[];
}

export interface CatalogoDeRepositorios {
    getById(id: string): RepositoryEntry | undefined;
    getActive(): RepositoryEntry[];
}

/** Lê `plano_busca.json` da raiz do projeto. */
export function lerPlanoDoArquivo(projectDir: string): { plano: PlanoBusca | null; erros: string[] } {
    const p = path.join(projectDir, ARQUIVO_PLANO);
    if (!fs.existsSync(p)) {
        return {
            plano: null,
            erros: [`Falta o plano de busca (${ARQUIVO_PLANO} na raiz do projeto). O designer o escreve a partir do ` +
                "protocolo: por fonte, o modo (tool ou à mão), a tool, o id do catálogo, os textos exatos, os filtros " +
                "e o que o protocolo manda registrar em cada busca."],
        };
    }
    try {
        return { plano: JSON.parse(fs.readFileSync(p, "utf-8")) as PlanoBusca, erros: [] };
    } catch (e: any) {
        return { plano: null, erros: [`${ARQUIVO_PLANO} ilegível: ${e?.message ?? e}`] };
    }
}

const ehTexto = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

/** Confere a forma do plano. Não confere a prosa do protocolo: isso é do pesquisador, ao ver o plano. */
export function validarPlano(plano: PlanoBusca | null, catalogo: CatalogoDeRepositorios): string[] {
    if (!plano || !Array.isArray(plano.fontes) || plano.fontes.length === 0) {
        return ["O plano de busca precisa de ao menos uma fonte em `fontes`."];
    }
    const erros: string[] = [];
    const ids = new Set<string>();
    for (const [i, f] of plano.fontes.entries()) {
        const onde = `fonte ${i + 1}${ehTexto(f?.id) ? ` (${f.id})` : ""}`;
        if (!ehTexto(f?.id)) erros.push(`${onde}: falta \`id\`.`);
        else if (ids.has(f.id)) erros.push(`${onde}: \`id\` repetido.`);
        else ids.add(f.id);
        if (!ehTexto(f?.nome)) erros.push(`${onde}: falta \`nome\`.`);
        if (f?.modo !== "tool" && f?.modo !== "manual") {
            erros.push(`${onde}: \`modo\` é "tool" ou "manual".`);
            continue;
        }
        if (!ehTexto(f.tool) || !TOOLS_DE_BUSCA.has(f.tool)) {
            erros.push(`${onde}: \`tool\` "${f.tool ?? ""}" não é tool de busca nem de importação do ReviewBR (${[...TOOLS_DE_BUSCA].join(", ")}).`);
            continue;
        }
        if (f.modo === "manual" && !TOOLS_DE_IMPORTACAO.has(f.tool)) {
            erros.push(`${onde}: busca à mão entra pela tool que importa o export (${[...TOOLS_DE_IMPORTACAO].join(", ")}), não por ${f.tool}.`);
        }
        if (f.modo === "tool" && TOOLS_DE_IMPORTACAO.has(f.tool)) {
            erros.push(`${onde}: ${f.tool} importa o export de uma busca feita à mão; o modo é "manual".`);
        }
        if (TOOLS_COM_REPOSITORIO.has(f.tool)) {
            if (!ehTexto(f.repositorio)) erros.push(`${onde}: ${f.tool} busca num repositório do catálogo; falta \`repositorio\` (o id).`);
            else if (!catalogo.getById(f.repositorio)) erros.push(`${onde}: o repositório "${f.repositorio}" não existe no catálogo.`);
        }
        const precisaTexto = !TOOLS_SEM_TEXTO.has(f.tool);
        if (!Array.isArray(f.textos) || (precisaTexto && (f.textos.length === 0 || !f.textos.every(ehTexto)))) {
            erros.push(`${onde}: \`textos\` são os textos exatos que o protocolo dá a esta fonte (lista de textos não vazios).`);
        }
        if (f.filtros !== undefined && (typeof f.filtros !== "object" || f.filtros === null || Array.isArray(f.filtros))) {
            erros.push(`${onde}: \`filtros\` é um objeto (parâmetro da tool → valor), ou fica ausente quando o protocolo não dá filtro.`);
        }
        if (f.registrar !== undefined && (!Array.isArray(f.registrar) || !f.registrar.every(ehTexto))) {
            erros.push(`${onde}: \`registrar\` é a lista do que o protocolo manda registrar em cada busca.`);
        }
    }
    return erros;
}

/** Repositórios ativos das camadas pedidas, como a busca por camada os escolhe (`search.ts`). */
function repositoriosDasCamadas(catalogo: CatalogoDeRepositorios, camadas: number[]): RepositoryEntry[] {
    return catalogo.getActive().filter((repo) => {
        const layer = parseInt(repo.status === "active" ? (repo as any).layer ?? "2" : "2");
        return camadas.includes(layer);
    });
}

/** A rota que o sistema dá HOJE a uma fonte do plano. */
export function rotaDaFonte(f: FontePlano, catalogo: CatalogoDeRepositorios): string {
    if (f.modo === "manual") return `busca à mão na interface da base; importação do export (${f.tool})`;
    if (f.tool === "search_repository") {
        const repo = catalogo.getById(f.repositorio ?? "");
        return repo ? rotaPrimaria(repo) : `repositório ${f.repositorio} fora do catálogo`;
    }
    if (f.tool === "harvest_records") {
        const repo = catalogo.getById(f.repositorio ?? "");
        return repo ? `OAI-PMH ${repo.access.oaiPmh?.endpoint ?? "sem endereço no catálogo"}` : `repositório ${f.repositorio} fora do catálogo`;
    }
    if (f.tool === "search_papers_optimized") {
        const camadas = Array.isArray(f.filtros?.layers) ? (f.filtros!.layers as number[]) : [1, 3];
        const repos = repositoriosDasCamadas(catalogo, camadas);
        return `camadas ${JSON.stringify(camadas)}: ${repos.map((r) => `${r.id} → ${rotaPrimaria(r)}`).join("; ") || "nenhum repositório ativo"}`;
    }
    return ROTA_POR_TOOL[f.tool] ?? `${f.tool} (sem rota descrita)`;
}

export function hashProtocolo(projectDir: string): string {
    const p = path.join(projectDir, "protocol.md");
    return createHash("sha256").update(fs.existsSync(p) ? fs.readFileSync(p) : Buffer.from("")).digest("hex");
}

/** Congela o plano no `project_state.json`, com a rota de hoje de cada fonte e o hash do protocolo. */
export function congelarPlano(
    projectDir: string,
    plano: PlanoBusca,
    etapa: string,
    catalogo: CatalogoDeRepositorios,
    versaoProtocolo?: string,
): TravaBusca {
    const fontes = plano.fontes.map((f) => ({ ...f, rota: rotaDaFonte(f, catalogo) }));
    const trava: TravaBusca = {
        versao_protocolo: versaoProtocolo ?? (ehTexto(plano.versao_protocolo) ? plano.versao_protocolo : "1.0"),
        etapa,
        protocolo_sha256: hashProtocolo(projectDir),
        plano: { ...plano, fontes },
        desde: new Date().toISOString(),
        execucoes: ProjectStateService.read(projectDir)?.trava_busca?.execucoes ?? [],
    };
    ProjectStateService.patch(projectDir, { trava_busca: trava });
    return trava;
}

// ─── FAZER 2: a busca confere o plano ─────────────────────────────────────────

/** Parâmetros que não são filtro: o texto, o projeto, o tamanho do lote, o conteúdo, a fonte e o registro. */
const NAO_FILTRO = new Set([
    "query", "projectPath", "projectId", "maxResults", "maxRecords", "maxCandidates", "metadataPrefix",
    "content", "dataset", "sourceName", "repositories", "repositoryId", "registroDaBusca", "textoExato",
    "fontePlano", "rota", "filePath",
]);

const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

/** JSON com as chaves em ordem, para comparar filtros sem depender da ordem em que vieram. */
function canonico(v: unknown): string {
    if (Array.isArray(v)) return `[${v.map(canonico).join(",")}]`;
    if (v && typeof v === "object") return `{${Object.keys(v as object).sort().map((k) => `${JSON.stringify(k)}:${canonico((v as any)[k])}`).join(",")}}`;
    return JSON.stringify(v);
}

function filtrosDaChamada(params: Record<string, unknown>): Record<string, unknown> {
    const f: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(params)) {
        if (NAO_FILTRO.has(k) || v === undefined || v === null || v === "") continue;
        if (Array.isArray(v) && v.length === 0) continue;
        f[k] = v;
    }
    return f;
}

export type ConferenciaDoPlano =
    | { aplica: false }
    | { aplica: true; ok: false; motivo: string }
    | { aplica: true; ok: true; fontes: FontePlano[]; rota: string };

const RECUSA = "🚫 FORA DO PROTOCOLO TRAVADO (linha 17 da FILA) —";
const PEDE_EMENDA = "O protocolo travado só muda por emenda aprovada pelo pesquisador (`record_protocol_amendment`).";

/**
 * Confere uma chamada de busca ou de importação contra o plano congelado. Só se aplica a projeto
 * LOCKED e às tools que gravam a identificação; o resto passa como antes. Recusa dizendo o quê:
 * sem plano; protocolo editado depois da trava; fonte, tool ou id fora do plano; texto diferente
 * do texto exato; filtro fora do plano; rota de hoje diferente da congelada; e o que o plano manda
 * registrar e não veio em `registroDaBusca`.
 */
export function conferirExecucao(
    projectDir: string,
    tool: string,
    params: Record<string, any>,
    catalogo: CatalogoDeRepositorios,
): ConferenciaDoPlano {
    if (!TOOLS_DE_BUSCA.has(tool)) return { aplica: false };
    const state = ProjectStateService.read(projectDir);
    if (!state || state.status !== "LOCKED") return { aplica: false };
    const trava = state.trava_busca;
    if (!trava) {
        return {
            aplica: true, ok: false,
            motivo: `${RECUSA} o projeto está travado sem plano de busca congelado (travado antes de 20/11/2026, quando a trava ` +
                "passou a guardar o plano). A busca não tem como saber o que o protocolo pede. O plano entra por emenda " +
                "aprovada pelo pesquisador (`record_protocol_amendment`, com o plano); nada se busca até lá.",
        };
    }
    if (hashProtocolo(projectDir) !== trava.protocolo_sha256) {
        return {
            aplica: true, ok: false,
            motivo: `${RECUSA} o protocol.md mudou depois da trava (o hash não é o de ${trava.desde}). O protocolo travado ` +
                `não se edita: restaure o arquivo travado. ${PEDE_EMENDA}`,
        };
    }
    const doPlano = trava.plano.fontes;
    let candidatas = doPlano.filter((f) => f.tool === tool);
    const listar = (fs: FontePlano[]) => fs.map((f) => `${f.nome} (${f.tool}${f.repositorio ? ` ${f.repositorio}` : ""})`).join("; ");
    if (!candidatas.length) {
        return { aplica: true, ok: false, motivo: `${RECUSA} a tool ${tool} não está no plano de busca travado. Fontes do plano: ${listar(doPlano)}. ${PEDE_EMENDA}` };
    }

    // Que fonte(s) do plano esta chamada executa.
    let fontes: FontePlano[];
    if (TOOLS_COM_REPOSITORIO.has(tool)) {
        const pedidos: string[] = tool === "harvest_records" ? [params.repositoryId].filter(Boolean) : (params.repositories ?? []);
        if (!pedidos.length) {
            return { aplica: true, ok: false, motivo: `${RECUSA} sob o plano, diga os repositórios em \`repositories\`: ${listar(candidatas)}. Buscar "em todos os ativos" não está no plano.` };
        }
        fontes = [];
        for (const id of pedidos) {
            const f = candidatas.find((c) => c.repositorio === id);
            if (!f) return { aplica: true, ok: false, motivo: `${RECUSA} o repositório ${id} não está no plano para ${tool}. Fontes do plano: ${listar(candidatas)}. ${PEDE_EMENDA}` };
            fontes.push(f);
        }
    } else if (TOOLS_DE_IMPORTACAO.has(tool)) {
        const base = typeof params.sourceName === "string" ? normalizar(params.sourceName) : "";
        const f = base ? candidatas.filter((c) => normalizar(c.nome) === base || normalizar(c.id) === base) : candidatas.length === 1 ? candidatas : [];
        if (f.length !== 1) {
            return { aplica: true, ok: false, motivo: `${RECUSA} diga em \`sourceName\` a base do export, com o nome do plano: ${candidatas.map((c) => c.nome).join("; ")}.` };
        }
        fontes = f;
    } else {
        fontes = candidatas;
    }

    // RV-07: o texto executado é um dos textos exatos que o plano dá à fonte.
    if (!TOOLS_SEM_TEXTO.has(tool)) {
        const campo = TOOLS_DE_IMPORTACAO.has(tool) ? "textoExato" : "query";
        const texto = typeof params[campo] === "string" ? params[campo].trim() : "";
        if (!texto) {
            return { aplica: true, ok: false, motivo: `${RECUSA} falta \`${campo}\`${campo === "textoExato" ? ", o texto digitado na interface da base" : ""}. Textos do plano: ${fontes.map((f) => `${f.nome}: ${f.textos.join(" · ")}`).join("; ")}.` };
        }
        const comTexto = fontes.filter((f) => f.textos.some((t) => t.trim() === texto));
        if (comTexto.length !== fontes.length || !comTexto.length) {
            const sem = fontes.filter((f) => !comTexto.includes(f));
            return {
                aplica: true, ok: false,
                motivo: `${RECUSA} o texto "${texto}" não é texto exato do plano para ${sem.map((f) => `${f.nome} (${f.textos.map((t) => `"${t}"`).join(" · ")})`).join("; ")}. Texto diferente é emenda. ${PEDE_EMENDA}`,
            };
        }
    }

    // Filtros: os que o plano dá, nem mais nem menos.
    const chamados = filtrosDaChamada(params);
    for (const f of fontes) {
        const doPlanoF = f.filtros ?? {};
        if (canonico(chamados) !== canonico(doPlanoF)) {
            return {
                aplica: true, ok: false,
                motivo: `${RECUSA} filtros fora do plano em ${f.nome}: a chamada traz ${canonico(chamados)}, o plano dá ${canonico(doPlanoF)}. ${PEDE_EMENDA}`,
            };
        }
    }

    // A rota de hoje é a congelada.
    for (const f of fontes) {
        const hoje = rotaDaFonte(f, catalogo);
        if (hoje !== f.rota) {
            return {
                aplica: true, ok: false,
                motivo: `${RECUSA} a rota de ${f.nome} mudou depois da trava: era "${f.rota}", hoje é "${hoje}". A manutenção mudou o ` +
                    `catálogo ou a tool, e o projeto travado não muda junto. ${PEDE_EMENDA}`,
            };
        }
    }

    // O que o plano manda registrar e a tool não produz.
    const dado = (params.registroDaBusca && typeof params.registroDaBusca === "object") ? params.registroDaBusca as Record<string, unknown> : {};
    const chaves = new Map(Object.entries(dado).map(([k, v]) => [normalizar(k), v]));
    for (const f of fontes) {
        const faltam = (f.registrar ?? []).filter((r) => !ehTexto(chaves.get(normalizar(r))));
        if (faltam.length) {
            return {
                aplica: true, ok: false,
                motivo: `${RECUSA} o plano manda registrar nesta busca de ${f.nome}: ${faltam.join("; ")}. Passe em \`registroDaBusca\` ` +
                    `cada um, com o valor e onde foi lido, ou "não obtido: <motivo>".`,
            };
        }
    }

    return { aplica: true, ok: true, fontes, rota: fontes.map((f) => `${f.id}: ${f.rota}`).join(" | ") };
}

/** Grava no estado que a fonte do plano foi executada (hits null = não alcançada). */
export function registrarExecucao(projectDir: string, fontesIds: string[], tool: string, hits: number | null): void {
    const state = ProjectStateService.read(projectDir);
    if (!state?.trava_busca) return;
    const em = new Date().toISOString();
    state.trava_busca.execucoes = [...(state.trava_busca.execucoes ?? []), ...fontesIds.map((fonte) => ({ fonte, tool, em, hits }))];
    ProjectStateService.write(projectDir, state);
}

/** O plano como o pesquisador o lê, uma linha por fonte. */
export function resumoDoPlano(trava: TravaBusca): string {
    return trava.plano.fontes.map((f) => {
        const partes = [
            `- **${f.nome}** (${f.id}) — ${f.modo === "manual" ? "à mão" : "por tool"}: ${f.tool}${f.repositorio ? ` (${f.repositorio})` : ""}`,
            `  rota: ${f.rota}`,
            `  textos: ${f.textos.length ? f.textos.map((t) => `\`${t}\``).join(" · ") : "nenhum (a tool não recebe texto)"}`,
            `  filtros: ${f.filtros && Object.keys(f.filtros).length ? JSON.stringify(f.filtros) : "nenhum"}`,
        ];
        if (f.registrar?.length) partes.push(`  registrar em cada busca: ${f.registrar.join("; ")}`);
        return partes.join("\n");
    }).join("\n");
}
