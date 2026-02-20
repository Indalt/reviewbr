# Supplement 1: Search Strategy (PRISMA-S)

**Review Title**: Produção Científica sobre *Anacardium occidentale* no Nordeste do Brasil
**Date Evaluated**: 2026-02-18
**System**: Prismaid MCP (Multi-Repository Search CLI)

## 1. Global Search Configuration

The search was executed using a single unified query string propagated to all 21 sources via the Prismaid CLI.

* **Search Interface**: Command Line Interface (CLI) / Node.js
* **Search Term**: `"Anacardium occidentale"`
* **Fields Searched**: All Fields (Title, Abstract, Keywords, Subject)
* **Date Limits**: None (All years)
* **Language Limits**: None (System defaults to repository native languages: PT, EN, ES)
* **Geographic Filters**:
  * `states`: `['BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE']`

## 2. Exact Execution Log

The following entry is extracted from the automated search log (`search_log_prisma_s.csv`):

```json
{
  "run_id": "run_2026_02_18_cli_01",
  "timestamp": "2026-02-18T12:05:00.000Z",
  "interface": "CLI",
  "term": "Anacardium occidentale",
  "filters": {
    "states": ["BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"]
  },
  "results_count": 338
}
```

## 3. Results by Source Category

*Estimates based on source metadata*

* **Aggregators (BDTD/SciELO)**: ~70% of results
* **Institutional Repositories**: ~30% of results

## 4. Limitations

* **OAI-PMH Constraints**: Some repositories limit result sets to 100 items per request token. Pagination was handled automatically by the `mcp-repos-br` adapters.
* **Availability**: 21/21 sources were responsive at the time of search.
