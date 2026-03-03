---
protocol: PRISMA_2020
version: 1.0.0
description: "Master Ruleset for PRISMA 2020 Systematic Reviews"
---

# PRISMA 2020 Core Protocol for AI Agents

Este documento é a **ÚNICA FONTE DA VERDADE (Single Source of Truth)** para qualquer agente de inteligência artificial ou script que execute coleta, triagem ou extração de dados no ReviewBR sob a metodologia PRISMA 2020. Nenhum registro pode entrar no sistema se violar estas regras.

## 1. Proveniência de Dados (Item 8)

**Regra Estrita:** A origem de cada registro DEVE ser perfeitamente rastreável.

- **`provenanceSource`:** Deve conter a URL exata da API ou Endpoint OAI-PMH (ex: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/`).
- **`searchQueryUsed`:** A string de busca exata que retornou o artigo não pode ser omitida.
- **`extractionDate`:** O timestamp em formato ISO `YYYY-MM-DDTHH:mm:ssZ`.

**Consequência de Falha:** O banco de dados (`DatabaseService.insertRecords`) aplicará um `ROLLBACK` e retornará erro letal.

## 2. Automação e Triagem (Item 16)

**Regra Estrita:** Ao utilizar triagem automatizada (Native Screening com LLMs), os seguintes metadados são obrigatórios:

- Todo registro rejeitado ou aceito DEVE conter a justificativa textual real gerada pelo modelo (não apenas labels "YES"/"NO").
- O modelo específico usado (ex: `Gemini 2.0 Flash`) deve ser registrado no Audit Trail.

## 3. Comportamento do Agente (Contenção de Danos)

Se um agente notar a ausência de campos obrigatórios ao processar dados brutos, ele DEVE:

1. Paralisar a ingestão.
2. Sugerir proativamente a execução da ferramenta `MethodologyAuditorService.checkTransparencyAudit`.
3. Informar ao pesquisador coordenador qual banco de dados/scraper quebrou a regra metodológica.
