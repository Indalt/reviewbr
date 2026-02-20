---
name: Conduct PRISMA Review
description: Standard operational procedure for conducting systematic reviews in Brazilian repositories using PRISMA 2020 and PRISMA-S guidelines.
---

# Conduct PRISMA Review (Skill)

This skill defines the **mandatory** workflow for all systematic review tasks in this project. You must follow these steps and generate the required artifacts.

## 0. Prerequisite Check

Before running any search, verify:

- [ ] Is there a frozen `protocol.md`?
- [ ] Is the "Definition of Brazilian Repository" met?
- [ ] Are we in Pilot Phase (Step 0) or Production (Step 1+)?

## 1. Governance & Protocol

- **Constraint**: No search runs without a recorded descriptor/string.
- **Output**: `protocol.md` (must be defined before Stage 1).
- **Template**: Use the structure defined in `docs/review/prisma_protocol_template.md`.

## 2. Execution Principles

1. **Evidence by URL**: Every repository claim (existence, count, full-text) must have a URL in the logs.
2. **No Hallucinations**: If a count or status is unknown, log as "Indefinido".
3. **Logs**: Every search execution MUST append to `search_log_prisma_s.csv`.

## 3. Workflow Steps (The "Pipeline")

### Etapa 0: Piloto

- Run 1 batch per main source.
- Validate `search_log_prisma_s.csv`.
- Output: `pilot_report.md`.

### Etapa 1: Mapa de Fontes (Sources)

- **Scope**: Brazilian repositories only (Domain .br, Oasisbr, BDTD, SciELO).
- Output: `sources_registry.md`.

### Etapa 2: Estratégia de Busca (Search)

- **Action**: Execute search via `run_search_cli.ts` or standard scripts.
- **Log**: Register exact string, fields, filters, timestamp, and raw count.
- **Output**: `search_strings.md` (list of strings) + `search_log_prisma_s.csv` (execution log).

### Etapa 3: Deduplicação

- **Rules**: DOI/Handle > Title+Author+Year.
- **Output**: `records_raw/` (folder) + `records_deduped.csv`.

### Etapa 4: Triagem (Screening)

- **Level 1**: Title/Abstract -> `screening_title_abstract.csv`.
- **Level 2**: Full Text -> `screening_fulltext.csv` (Must have specific exclusion reasons).

### Etapa 5-8: Extração, Qualidade, Síntese, Relato

- Follow standard PRISMA guidelines.
- Final Output: `manuscript.md` + `prisma_flow_diagram`.

## 4. Mandatory Artifacts Checklist

Ensure these exist and are updated:

- `protocol.md`
- `search_log_prisma_s.csv`
- `search_strings.md`
- `sources_registry.md`
- `prisma_flow_counts.md` (or .json)

## 5. User Interaction

- **Do not** invent results.
- **Ask** for clarification if the Protocol (Step 1) is ambiguous (e.g., "Acesso Aberto" vs "Misto").
