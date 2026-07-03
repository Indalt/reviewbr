# Contrato de Tools do MCP exigidas pela camada agêntica

Este documento é o **contrato** entre os subagentes/skills (`.claude/`) e o servidor MCP `reviewbr`. Define o que o MCP precisa expor para a camada agêntica funcionar. As tools **existentes** já estão listadas no `README.md` do MCP; abaixo estão as **3 tools novas** (Fase 3) e os ajustes de orquestração (Fase 4). Implementar o MCP **contra este contrato** — não o contrário.

Princípio: **tools são determinísticas e não decidem** (RV-06). Elas executam, calculam e retornam dados com origem; o julgamento é do agente.

---

## 1. `compute_flow_counts` — deriva o funil PRISMA dos logs (serve RV-02, RV-05)

**Por quê:** hoje as contagens do `prisma_flow.json` são digitadas/geradas por scripts (`generate_f4_report.mjs`, etc.). RV-02 exige que os números **emerjam do processo**. Esta tool substitui esses scripts.

**Status: IMPLEMENTADA E TESTADA** (`src/services/flow_computer.ts` + registrada em `src/index.ts`; testes de lógica passando).

- **Input:** `{ projectPath: string, write?: boolean }` (write padrão = true).
- **Schema canônico de artefatos** que a tool CONTA (arrays JSON; a camada agêntica DEVE produzi-los com estes nomes):
  - `01_raw/database_records.json` → `identified_db`
  - `01_raw/other_records.json` → `identified_other` (opcional; snowball/cinzenta)
  - `02_deduplicated/dataset.json` → base para `duplicates_removed` e `screened`
  - `03_screening/excluded_ta.json` → `title_abstract_excluded`
  - `03_screening/fulltext_not_retrieved.json` → `fulltext_not_retrieved` (opcional)
  - `03_screening/excluded_fulltext.json` → `fulltext_excluded`
  - `03_screening/included.json` → checagem cruzada independente de `included`
- **Campos calculados por identidade PRISMA (F8.1):** `screened`, `retrieved_fulltext`, `fulltext_assessed`, `included`.
- **Output:** `{ computed, provenance (origem de cada número), missing (arquivos ausentes → RV-03), validation (RV-05), manualEditWarnings (divergência vs. prisma_flow.json existente → RV-02), includedCrossCheck }`. Grava `prisma_flow.json` quando `write=true`.
- **Reusa:** `services/prisma_validator.ts` (aritmética RV-05).
- **Fronteira:** não decide inclusão; só conta artefatos e aplica identidades.

---

## 2. `rag_index_corpus` — indexa o corpus curado para leitura (serve F5.5, RV-08)

**Status: IMPLEMENTADA E TESTADA** (`src/services/rag_lexical.ts` — retriever **léxico BM25**, sem embeddings, 100% local e testável sem chave).

- **Input:** `{ projectPath: string, corpusDir?: string }` (default tenta `04_extraction/fulltext`, `03_screening/fulltext`, `03_screening/pdfs`).
- **Comportamento:** varre arquivos **`.txt`/`.md`**, faz chunking por parágrafo/seção (rastreia headings), tokeniza (stopwords PT/EN) e grava `<projectPath>/rag/index.json` (BM25: df, avgdl, tf por chunk). PDFs sem texto extraído são **reportados como skipped** (precisam de extração antes).
- **Proveniência por chunk (RV-08):** resolvida por sidecar `<arquivo>.meta.json` (`{study_id, fonte_repositorio, url_hospedagem}`) → senão por match de `identifier` de `03_screening/included.json` no nome do arquivo → senão `[TBD]` (sinalizado em `missingProvenance`).
- **Output:** `{ indexed, studies, skippedPdfsOnly, indexPath, missingProvenance }`.
- **Upgrade path:** o mesmo `index.json` pode ganhar `embedding` por chunk + ranker vetorial sem mudar o contrato das tools.
- **Fronteira:** não interpreta conteúdo; só indexa com proveniência.

---

## 3. `rag_query` — recupera trechos relevantes com origem (serve F5.5, F7)

**Status: IMPLEMENTADA E TESTADA** (BM25 sobre `rag/index.json`).

- **Input:** `{ projectPath: string, question: string, topK?: number }` (default topK=8).
- **Comportamento:** pontua os chunks por BM25 e retorna os melhores.
- **Output:** lista de `{ text, study_id, fonte_repositorio, url_hospedagem, section, score }`.
- **Fronteira:** **não redige resposta nem sintetiza** — só recupera. A síntese/citação é do agente (RV-06).

---

## Ajustes de orquestração no MCP (Fase 4)

- **Aposentar** `switch_agent` / `get_current_agent` e o runtime `src/services/agent_orchestrator.ts` (RBAC "um chapéu por vez" — obsoleto no modelo multi-subagente).
- **Manter** `src/registry/agent_orchestrator.ts` como **guardião server-side** (defense-in-depth): corrigir o enum de papéis (5→ inclui PROJETISTA e READER) e espelhar os allow-lists dos frontmatters de `.claude/agents/`. Um subagente que peça uma tool fora do seu papel é recusado pelo MCP.
- **Reescrever** `SYSTEM_PROMPT.md` para o mundo multi-subagente (hoje assume o coordenador único com `switch_agent`).
- **Bridge Go↔MCP** (`services/go_bridge.ts`, padrão `asreview_bridge.ts`): conversão de PDF e download em massa delegados ao binário `prismaid.exe`; APIs bibliográficas seguem no TS. Cada capacidade tem um dono. *(Adiável se o acoplamento ao binário preocupar.)*
- **Sci-Hub BYOS:** `plugins/scihub_extractor.py` como tool opt-in `retrieve_fulltext_byos`, só do `librarian` e só com flag ligada; nunca automático.

## Compatibilidade de nomes
As tools são expostas no Claude Code como `mcp__reviewbr__<tool>` (chave `reviewbr` em `.mcp.json`). Os contratos de papel nos agentes usam os nomes lógicos (`compute_flow_counts`, etc.).
