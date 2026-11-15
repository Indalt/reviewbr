# Passo 1 — falhas / incoerências do ReviewBR observadas (agente scout, 12/11/2026)

Registro sem contorno: nenhuma falha foi contornada com WebSearch, WebFetch ou script.

## F1 — search_openalex: campo URL sempre "undefined"
- Tool: `search_openalex`; parâmetros: `query="flavor wheel Ceará"`, `maxResults=50` (sem projectPath); idem `query="cajuína sensory"`.
- Erro exato: todo item exibe `**URL:** undefined`. Itens sem DOI ficam sem nenhuma origem rastreável além do título (ex.: "Perfil emocional de cafés ... Baturité", Souza 2019).
- Controle: a mesma saída traz DOI para outros itens, então a busca funciona; o defeito é só no campo URL.

## F2 — search_openalex: "mais N resultados salvos no arquivo JSON" sem arquivo
- Mesmos parâmetros de F1. A saída exibe só 10 de 50 e diz "... e mais 40 resultados salvos no arquivo JSON."
- Sem projectPath, não há caminho informado e nenhum .json novo foi achado em c:/reviewbr nos 5 min seguintes (busca por mtime).
- Consequência: 40 de 50 resultados retornados não são visíveis ao agente; o levantamento só enxerga os 10 primeiros por relevância de cada string. Mitigação dentro do sistema: usar strings mais específicas (mais buscas, cada uma vista no topo 10).

## F3 — search_openalex: saída sem resumo (abstract)
- Todas as chamadas de search_openalex desta sessão: a saída traz só título, autores, data e DOI; nenhum resumo.
- Consequência: a pergunta "o que descreve sobre aroma" só pode ser respondida pelo título; o relatório marca isso item a item. Não é contornado com WebFetch.

## F4 — search_repository sem `repositories`: timeout de 30 min
- Tool: `search_repository`; parâmetros: `query="cajuina"`, `maxResults=30`, `repositories` omitido (= todos os ativos), sem projectPath.
- Erro exato: `MCP server "reviewbr" tool "search_repository" sent no response or progress for 1800s; aborting.`
- Controle: na mesma sessão, `search_papers_optimized` (que também consulta repositórios) respondeu. Próximo passo: repetir `search_repository` com um repositório nomeado (busca nº 21 em diante) para ver se o problema é só o "todos".

## F5 — search_papers_optimized: repositórios da camada 3 devolvem registros fora da string
- Tool: `search_papers_optimized`; parâmetros: `query="perfil sensorial caju"`, `layers=[1,3]`.
- Observado: dos 55 registros, os 20 da BDTD são pertinentes; mas UFPI (20), Unifesp (10) e "Biblioteca Digital de Teses e Dissertações" UFCG (5) trazem registros sem relação com a string (ex.: "Processos de conversão ao movimento Hare Krishna em Campina Grande-PB"; "Genes do colágeno e metaloproteinases em queloide de lóbulo de orelha"). Parece coleta sem filtro pela string (ou filtro só por uma palavra, como "perfil" ou "caju").
- Também: registros da BDTD vêm com `description` vazia e `date` vazia.
- Consequência: a contagem "55" não é a contagem de registros que casam com a busca. Para o pesquisador, só os itens da BDTD foram usados.

## F6 — search_repository (BDTD): URL malformada com espaço
- Tool: `search_repository`, `repositories=["BR-AGG-0001"]`, `query="roda de aromas"` (e outras).
- Observado: registros cuja origem é a USP vêm com `URL: https://bdtd.ibict.br/vufind /Record/USP_...` — há um espaço entre "vufind" e "/Record", então o link não abre como está.
- Controle: registros de outras instituições na mesma resposta trazem URL válida (handle do repositório de origem).

## F7 — search_repository: UFC, UECE e Alice/Embrapa dão zero até para "caju" (falso negativo)
- Tool: `search_repository`; `repositories=["BR-FED-0004"]` (UFC), `["BR-EST-0006"]` (UECE), `["BR-RES-0001"]` (Alice/Embrapa); `query="perfil sensorial caju"` e depois `query="caju"`; `maxResults=20`.
- Resultado: UFC 0 e 0; UECE 0 e 0; Alice 2 (arroz, soja — sem relação) e 0.
- Controle positivo: na mesma sessão, a BDTD (BR-AGG-0001) devolveu registros com URL nesses três repositórios sobre caju (repositorio.ufc.br/handle/riufc/18641 e riufc/78207; siduece.uece.br id=84200 e id=84862; alice.cnptia.embrapa.br doc/1149343, doc/1104397, doc/1152668). Logo os zeros são da ferramenta, não da base.
- Causa provável (não verificada no código, só lida no catálogo `reviewbr-mcp/data/sources/repositories_catalog.json`): UFC e UECE estão com `oaiPmh.available: false` e `searchEndpoints: []`, mas `status: active` — a tool aceita o repositório e devolve 0 sem avisar que não tem como buscá-lo. A Alice tem OAI-PMH, mas o resultado parece filtrar só um lote colhido (registros de 2011 sem relação), não buscar no acervo.
- Consequência: os repositórios do Ceará escolhidos pelo pesquisador (UFC, UECE, Embrapa) só foram alcançados indiretamente, via BDTD. Infoteca-e (BR-RES-0004) está `inactive` no catálogo e não foi consultada.

## F8 — search_scielo: resultados incoerentes e falsos negativos
- Tool: `search_scielo`, `maxResults=20`, sem projectPath.
- `query="perfil sensorial Ceará"` → 1 resultado ("Sistema automático para a medição da concentração dos núcleos de condensação de nuvens...").
- `query="queijo coalho"` → 0. `query="cashew apple aroma"` → 0. `query="caju"` → "Total encontrado na base: 15", quase todos sem relação (ex.: nutrição mineral do milho; biodiesel; ocupação do MST).
- Controle positivo: na mesma sessão, o OpenAlex devolveu artigos com DOI SciELO (prefixo 10.1590, ex.: 10.1590/fst.17319 — cerveja com pedúnculo de caju; 10.1590/1981-6723.14224 — produtos de caju no Ceará; 10.1590/fst.13520). Um acervo SciELO com só 15 registros para "caju" e 0 para "queijo coalho" não é plausível. Os zeros e a contagem são da ferramenta.
- Consequência: SciELO não foi usado como fonte neste passo.

## Resumo das tools que funcionaram
- `search_openalex`: funcionou (com F1–F3).
- `search_repository` com `repositories=["BR-AGG-0001"]` (BDTD): funcionou e foi a única via de acesso efetivo a teses/dissertações da UFC, UECE e Embrapa (com F6 e cauda de ruído).
- `search_papers_optimized`: respondeu, com F5.
