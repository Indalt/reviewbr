---
name: prisma-s-logging
description: Procedimento de registro PRISMA-S da busca (fase F2). Use ao executar buscas bibliográficas para registrar cada execução de forma auditável e reprodutível — string exata, fonte, filtros, data, contagem e erros — e preservar a origem de cada registro. Carregada pelo agente librarian.
---

# PRISMA-S Logging — registro auditável de busca

Toda busca deixa rastro reprodutível. Sem registro, a busca não aconteceu (para fins de auditoria).

## Log obrigatório: `logs/search_log_prisma_s.csv`
Uma linha por busca tentada, em **cada** fonte. Colunas mínimas:
`Datetime` (ISO8601), `Database`, `Filter`, `Query` (string **exata**, sem parafrasear), `Hits`, `Errors`.
- Se a busca falhou/truncou/deu timeout: registre em `Errors`, não omita (RV-06).
- Contagem desconhecida = `Indefinido`, nunca um chute.

## Metadados de origem por registro (RV-08)
Cada registro salvo em `01_raw/` deve preservar: `provenanceSource` (URL da API/OAI-PMH), `searchQueryUsed`, `extractionDate` (ISO), e quando houver: repositório, instituição, URL de hospedagem. Faltando: `Indefinido`/`[TBD]`.

## Nomeação dos brutos
`01_raw/[fonte]_[YYYY-MM-DD]_[hash-da-query].json` — o hash liga o arquivo à linha do log.

## Cobertura por camada de escopo
Registre a qual camada cada fonte pertence (`global_open_science`, `regional_latam`, `national_br`, `institutional_br`) para o relatório de fontes (SUP.4).

## Mapeamento PRISMA-S
As colunas cobrem S7–S14 (interface, campos, data, string, vocabulário, filtros, iterações). Ver `spec.md` F2 para o detalhamento item a item.
