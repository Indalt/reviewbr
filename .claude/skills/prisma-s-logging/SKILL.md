---
name: prisma-s-logging
description: Procedimento de registro PRISMA-S da busca (fase F2). Use ao executar buscas bibliográficas para registrar cada execução de forma auditável e reprodutível — string exata, fonte, filtros, data, contagem e erros — e preservar a origem de cada registro. Carregada pelo coordenador (skill conduct-review) na F2.
---

# PRISMA-S Logging — registro auditável de busca

Toda busca deixa rastro reprodutível. Sem registro, a busca não aconteceu (para fins de auditoria).

## Log obrigatório: `logs/search_log_prisma_s.csv` — gravado pelo código
Quem grava é a tool, não o agente (decisão de 29/10/2026): cada execução de `search_*`, `harvest_records`,
`expand_search_snowball`, `import_dataset_ris` e `import_bvs_export` **com `projectPath`** anexa uma linha, também
quando a busca falha. Sem `projectPath` não há linha (exploratório, RV-01). **Não escreva nesse arquivo** — confira-o.
Colunas: `Datetime` (ISO8601), `Database` (fonte, com a tool entre parênteses), `Filter` (os parâmetros da execução,
menos a string e o projeto), `Query` (string **exata**), `Hits`, `Errors`.
- `Hits` = registros que a execução devolveu. Busca que não terminou: `Indefinido`, com o motivo em `Errors`.
- Truncamento vai em `Errors`: a fonte declarou mais do que veio, ou a coleta parou no teto.
- Na importação de export (RIS, BVS) sob projeto travado, `Query` = o `textoExato` digitado na interface da base, que tem de ser um texto do plano de busca congelado; o que o plano manda anotar (ex.: plataforma, data, total mostrado, período de cobertura) vai em `registroDaBusca` e sai em `Filter`. Sem projeto travado, `Query` = `Indefinido`. Limite: a busca à mão acontece fora do sistema — a importação grava o que o pesquisador declara, e o sistema não confere a tela.
- Sob projeto travado, `Filter` traz também a fonte do plano (`fontePlano`) e a rota usada (`rota`); a busca recusada por sair do plano também deixa linha, com o motivo em `Errors`.
- `logs/search_history.json` segue como registro bruto de cada chamada; o que a norma pede é o CSV.

## Metadados de origem por registro (RV-08)
Cada registro salvo em `01_raw/` deve preservar: `provenanceSource` (URL da API/OAI-PMH), `searchQueryUsed`, `extractionDate` (ISO), e quando houver: repositório, instituição, URL de hospedagem. Faltando: `Indefinido`/`[TBD]`.

## Nomeação dos brutos
`01_raw/[fonte]_[YYYY-MM-DD]_[hash-da-query].json` — o hash liga o arquivo à linha do log.

## Cobertura por camada de escopo
Registre a qual camada cada fonte pertence (`global_open_science`, `regional_latam`, `national_br`, `institutional_br`) para o relatório de fontes (SUP.4).

## Mapeamento PRISMA-S
As colunas cobrem itens do PRISMA-S pela numeração oficial do checklist: interface → S1; campos, string, vocabulário e iterações → S8; filtros → S9 (limites) e, se for filtro de busca publicado, S10; iterações também → S12; data → S13. Ver a coluna "Item PRISMA-S" de `spec.md` F2 para o detalhamento subitem a subitem, e `check_standard_coverage("prisma-s")` para o que a trilha ainda não coleta.

## Execução da etapa F2

Procedimento que o coordenador (skill `conduct-review`) executa na F2. Até 28/11/2026 era o agente `librarian`; ele se fundiu no coordenador (linha 25 da FILA, Hipótese A). O que separa esta etapa das outras é a trava de etapa no código (linhas 24 e 25): as tools da etapa recusam fora da ordem da trilha, com decisão de etapa faltando, com insumo mudado ou passado pelo chamador.

**Pré-condição:** protocolo travado — status `LOCKED` no `project_state.json`, que o `submit_protocol_for_approval`
grava (o `[LOCKED]` no `protocol.md` é só espelho e não libera nada). Sem ele, as tools de busca recusam (RV-01).

1. Leia o **plano de busca congelado** com `get_search_plan`: por fonte, a tool, o repositório, os textos exatos, os
   filtros e o que registrar. **Execute-o literalmente** — não parafraseie, não "melhore", não acrescente fonte nem
   filtro (RV-06/RV-07). As tools recusam o que sai dele (linha 17 da FILA); recusa não se contorna: leve-a ao
   pesquisador, e o que mudaria o protocolo é emenda aprovada nas palavras dele. O que o plano manda registrar e a tool
   não produz (ex.: o período de cobertura), leia na própria fonte e passe em `registroDaBusca`, com onde foi lido, ou
   "não obtido: <motivo>", que vira desvio declarado.
2. Para cada fonte, chame a tool de busca do plano, sempre com `projectPath`; a tool grava o bruto em `01_raw/` e a
   linha do log. Busca feita à mão na interface de uma base: o pesquisador recebe antes o roteiro (`get_search_plan`,
   a fonte do plano), e o export entra pelo `import_dataset_ris`/`import_bvs_export` com `sourceName` (o nome do
   plano), `textoExato` (o texto digitado) e `registroDaBusca` (o que o plano manda anotar).
3. Camadas de escopo (`global_open_science`, `regional_latam`, `national_br`, `institutional_br`): só em busca sem
   protocolo travado. Com o protocolo travado, as fontes são as do plano, e nada mais.

### Tools da etapa
Busca: `search_papers_optimized`, `search_openalex`, `search_pubmed`, `search_scielo`, `search_core`,
`search_crossref`, `search_europe_pmc`, `search_semanticscholar`, `search_repository`, `harvest_records` (as do plano
congelado); `get_record_metadata` (metadados de um registro, sem gravar). Importação: `import_dataset_ris`,
`import_bvs_export`. Expansão: `expand_search_snowball`. Repositórios: `validate_repository` (conectividade antes de
buscar num repositório novo ou suspeito), `heal_repositories` (muda o catálogo de repositórios, que a trava 3 confere:
com projeto travado, a etapa seguinte recusa até a emenda de migração). Plano: `get_search_plan`.

### Snowballing (busca por citação — PRISMA-S S5) — sempre limitado, e só na F2
A `expand_search_snowball` busca **só para a frente**: quem cita as sementes (OpenAlex). As **referências** das
sementes (para trás) **não são buscadas** — a saída declara isso em `stats.direcao`; não relate busca por referências.
Com `projectPath`, os candidatos aceitos vão para `01_raw/other_records.json` ("outros métodos" do funil) e a execução
entra no log PRISMA-S. Ela e a `harvest_records` são da F2 (linha 25): depois que a busca fecha (a deduplicação
começou), recusam; refazer a busca é emenda com `reabrir: "F2"`. Regras:
- **Profundidade = 1** por padrão: só quem cita as sementes, sem recursar; só suba se o protocolo pedir.
- `projectPath` sempre (dedup real contra o que o projeto já tem) e `filterKeywords` com os descritores do protocolo
  (sem eles nenhuma poda ocorre, e a tool declara `stats.filter_applied: false` — não invente critério).
- Leia `stats.stop_reason`, `stats.capped` e `stats.per_level` e mostre ao pesquisador: é o relatório de parada.
- Na revisão sistemática entra como passo **suplementar limitado** (F2.2.4/S5), nunca como busca primária.

### Nesta etapa, não
- Não decida inclusão nem exclusão: é a F4 (skill `screening-rules`), e as tools dela recusam antes de a F3 fechar.
- Não baixe texto completo: é a F4.3 (skill `screening-rules`), e as tools recusam antes de a F3 fechar (linha 25).

### Ao fechar a etapa
Mostre ao pesquisador: fontes consultadas, hits por fonte, total bruto, o caminho de `01_raw/` e do log PRISMA-S, os
erros e as limitações, e o porquê da etapa (ver "Explique o porquê" no `conduct-review`).
