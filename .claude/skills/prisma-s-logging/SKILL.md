---
name: prisma-s-logging
description: Procedimento de registro PRISMA-S da busca (fase F2). Use ao executar buscas bibliográficas para registrar cada execução de forma auditável e reprodutível — string exata, fonte, filtros, data, contagem e erros — e preservar a origem de cada registro. Carregada pelo agente librarian.
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
- `Query` = `Indefinido` na importação de export (RIS, BVS): a string usada na interface da base não passa pela tool.
- `logs/search_history.json` segue como registro bruto de cada chamada; o que a norma pede é o CSV.

## Metadados de origem por registro (RV-08)
Cada registro salvo em `01_raw/` deve preservar: `provenanceSource` (URL da API/OAI-PMH), `searchQueryUsed`, `extractionDate` (ISO), e quando houver: repositório, instituição, URL de hospedagem. Faltando: `Indefinido`/`[TBD]`.

## Nomeação dos brutos
`01_raw/[fonte]_[YYYY-MM-DD]_[hash-da-query].json` — o hash liga o arquivo à linha do log.

## Cobertura por camada de escopo
Registre a qual camada cada fonte pertence (`global_open_science`, `regional_latam`, `national_br`, `institutional_br`) para o relatório de fontes (SUP.4).

## Mapeamento PRISMA-S
As colunas cobrem itens do PRISMA-S pela numeração oficial do checklist: interface → S1; campos, string, vocabulário e iterações → S8; filtros → S9 (limites) e, se for filtro de busca publicado, S10; iterações também → S12; data → S13. Ver a coluna "Item PRISMA-S" de `spec.md` F2 para o detalhamento subitem a subitem, e `check_standard_coverage("prisma-s")` para o que a trilha ainda não coleta.
