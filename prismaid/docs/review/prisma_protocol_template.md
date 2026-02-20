# Workflow PRISMA 2020 + PRISMA-S — Revisão Sistemática em Repositórios Brasileiros (Template Geral)

## 0) Propósito

Este workflow padroniza uma revisão sistemática (com ou sem meta-análise) conduzida **exclusivamente em repositórios brasileiros**, com apoio de LLM em parceria com revisores humanos. O objetivo é garantir:

- aderência a **PRISMA 2020** e **PRISMA-S**;
- rastreabilidade e reprodutibilidade (logs, strings, contagens, exclusões);
- controle de risco de “alucinação”/inferência indevida por LLM;
- produção de manuscrito publicável e apêndices completos.

---

## 1) Escopo e definições (preencher no protocolo)

### 1.1 Definição operacional: “repositório brasileiro”

Considera-se “repositório brasileiro” qualquer fonte que:

- seja mantida por instituição brasileira (domínio .br, gov.br, edu.br, ou repositório institucional brasileiro), **ou**
- integre redes nacionais de acesso aberto (ex.: Oasisbr, BDTD, SciELO Brasil), **ou**
- esteja registrada em diretórios de repositórios (OpenDOAR/ROAR) como Brasil, com evidência verificável.

### 1.2 Critério de acesso (definir no protocolo)

- **Opção A (recomendado): Acesso aberto duro** — incluir apenas texto completo disponível sem paywall/login no momento da coleta.
- **Opção B: mista** — incluir texto completo + itens fechados apenas para análise de lacunas (não no corpus).

> O protocolo deve declarar explicitamente qual opção será usada.

### 1.3 Tema / pergunta (PICO/PEO/SPIDER etc.)

- Pergunta principal: <<FILL>>
- Estrutura da pergunta (ex.: PICO/PEO): <<FILL>>
- Desfechos/constructos e definições operacionais: <<FILL>>

### 1.4 Idiomas

- Idiomas elegíveis: <<FILL>> (recomendado: PT/EN; outros se relevantes)

---

## 2) Princípios (não-negociáveis)

1. **Evidência por URL**: toda afirmação sobre existência de repositório, disponibilidade de texto completo, contagem de resultados, endpoints e filtros deve ter evidência (URL/print/export).
2. **Sem invenção**: quando não for possível confirmar, marcar como **Indefinido**.
3. **Separação: Mapa de fontes ≠ Corpus**:
   - Mapa de fontes serve para cobertura e lacunas.
   - Corpus é definido por critérios de elegibilidade por documento.
4. **Congelamento pós-piloto**:
   - O workflow pode ser ajustado apenas durante um piloto inicial.
   - Após piloto: alterações só via **Emenda** (registro datado e justificado).

---

## 3) Papéis e responsabilidades

### 3.1 LLM pode

- sugerir strings e adaptar sintaxe por interface;
- identificar URLs de repositórios candidatos e seus endpoints (p.ex. OAI-PMH), **se citar evidência**;
- estruturar resultados brutos em tabelas (CSV/JSON/Markdown);
- sugerir rótulos/códigos e extrair termos (com auditoria humana).

### 3.2 LLM não pode

- decidir inclusão/exclusão final sem validação humana;
- declarar “texto completo aberto” sem abrir/verificar evidência;
- inventar contagens, filtros ou repositórios.

### 3.3 Humano deve

- aprovar protocolo e congelar metodologia pós-piloto;
- auditar amostras de evidência (OA, PDFs, endpoints);
- conduzir (ou validar) triagem e extração;
- assinar PRISMA/PRISMA-S preenchidos e o manuscrito final.

---

## 4) Artefatos obrigatórios (outputs do sistema)
>
> Cada artefato deve ter versão e data.

### 4.1 Protocolo e governança

- `protocol.md` — protocolo congelado (PRISMA items 4–15)
- `amendments.md` — emendas (PRISMA 24c)
- `decisions.md` — decisões operacionais (ex.: filtros, softwares)

### 4.2 Busca e rastreio (PRISMA-S)

- `search_strings.md` — strings completas por fonte/interface (PRISMA 7; PRISMA-S 8)
- `search_log_prisma_s.csv` — log detalhado por execução (PRISMA-S 13)
- `sources_registry.md` — lista final das fontes/repositórios consultados

### 4.3 Registros, dedupe, triagem

- `records_raw/` — exports brutos (CSV/RIS/BibTeX/JSON/PDF prints)
- `records_deduped.csv` + `dedupe_rules.md` (PRISMA-S 16)
- `screening_title_abstract.csv`
- `screening_fulltext.csv` (com motivos padronizados)
- `prisma_flow_counts.md` (ou json) — números para o fluxograma PRISMA

### 4.4 Extração, qualidade, síntese

- `data_extraction.csv`
- `codebook.md`
- `quality_appraisal.csv` (se aplicável)
- `synthesis.md` + tabelas/figuras derivadas

### 4.5 Relato

- `manuscript.md`
- `prisma_checklist_filled.md`
- `prisma_s_checklist_filled.md`
- `prisma_flow_diagram.(svg|pdf)`

---

## 5) Pipeline operacional (workflow)

### Etapa 0 — Piloto (instrumentação)

**Objetivo:** testar saídas, limites de tamanho e rastreabilidade do sistema.
**Regras:**

- executar 1 lote de busca por fonte principal + 1 lote de mapeamento de repositórios;
- validar que logs e strings completas são gerados corretamente;
- congelar protocolo após piloto.
**Saída:** `pilot_report.md` + `protocol.md` congelado.

---

### Etapa 1 — Identificação e registro de fontes (somente repositórios brasileiros)

**Meta:** construir o **Registro de Fontes** (não é corpus).

#### 1.1 Camada A — Agregadores e redes nacionais

- Oasisbr (IBICT)
- BDTD (IBICT)
- SciELO Brasil (se aplicável ao tema)

> Adicionar outros agregadores nacionais relevantes ao tema: <<FILL>>

#### 1.2 Camada B — Diretórios de repositórios

- Lista IBICT (quando aplicável)
- OpenDOAR / ROAR (Brasil)

> Usar para checar lacunas de cobertura.

#### 1.3 Camada C — Varredura dirigida

- Busca dirigida em domínios brasileiros e sites institucionais para localizar repositórios não recuperados.
- Procurar padrões técnicos comuns (DSpace/TEDE/OJS; handle/bitstream/xmlui/jspui; oai/request; cgi/oai2).
**Requisito:** registrar evidência URL de cada repositório.

**Saída:**

- `sources_registry.md` (lista final de fontes)
- `repo_map_v1.csv` (opcional, se o sistema separar mapa de fontes)

> Nota: se o sistema já contém catálogo interno de fontes, esta etapa pode ser substituída por “validação e atualização do catálogo”, mantendo logs e evidências.

---

### Etapa 2 — Estratégia de busca (por fonte/interface) [PRISMA 7; PRISMA-S 8]

#### 2.1 Construção de blocos conceituais (template)

- Bloco Tema (sinônimos, PT/EN, termos técnicos)
- Bloco Contexto (Brasil/território/recorte, se aplicável)
- Bloco Tipo de evidência / população / intervenção / fenômeno (conforme pergunta)
- Bloco Exclusões (quando necessário)

#### 2.2 Execução por fonte (registro obrigatório)

Para cada fonte:

- registrar a string completa (copiar e colar exatamente)
- registrar campos (título/resumo/assunto/todos), filtros e data/hora
- registrar contagem bruta e método de exportação
**Saída:** atualizar `search_strings.md` + `search_log_prisma_s.csv`.

#### 2.3 Iterações (se aplicável)

- Expansão por evidência (p.ex., termos extraídos de resultados iniciais).
- Cada iteração deve ter ID, string e log no PRISMA-S.

---

### Etapa 3 — Exportação e deduplicação [PRISMA-S 16]

- Exportar resultados brutos por fonte para `records_raw/`.
- Deduplicar por DOI/handle e, na ausência, por título+autoria+ano.
- Registrar regras e exceções em `dedupe_rules.md`.
**Saída:** `records_deduped.csv`.

---

### Etapa 4 — Triagem [PRISMA 8; 16]

#### 4.1 Título/Resumo

- Registrar decisão (Incluir/Excluir/Incerto) + motivo breve.
- Se automação/LLM sugerir, humano valida.
**Saída:** `screening_title_abstract.csv`.

#### 4.2 Texto completo

- Confirmar elegibilidade (incluindo acesso conforme protocolo).
- Registrar motivo padronizado para exclusão.
**Saída:** `screening_fulltext.csv`.

---

### Etapa 5 — Extração de dados [PRISMA 9–10]

- Usar formulário padronizado + codebook.
- Pilotar extração em amostra pequena e congelar codebook.
**Saída:** `data_extraction.csv` + `codebook.md`.

---

### Etapa 6 — Avaliação de qualidade (se aplicável) [PRISMA 11]

- Escolher instrumento conforme tipo de estudo (p.ex., MMAT, AACODS, CASP etc.).
- Definir uso: ponderação da síntese, não exclusão automática (a menos que protocolo diga).
**Saída:** `quality_appraisal.csv`.

---

### Etapa 7 — Síntese e análise [PRISMA 13]

- Definir tipo de síntese: narrativa, temática, meta-análise, meta-síntese etc.
- Produzir tabelas e figuras rastreáveis (de `data_extraction.csv`).
**Saída:** `synthesis.md` + outputs.

---

### Etapa 8 — Relato e publicação [PRISMA 16–27]

- Preencher fluxograma PRISMA a partir de `prisma_flow_counts.json` ou `prisma_flow_counts.md`.
- Preencher PRISMA checklist e PRISMA-S checklist (apêndices).
- Redigir `manuscript.md` sem checklist exposto no corpo.
**Saída:** `manuscript.md` + checklists + fluxograma.

---

## 6) Templates de log (para o sistema)

### 6.1 `search_log_prisma_s.csv` (mínimo)

Colunas recomendadas:

- run_id
- data_hora
- fonte (Oasisbr/BDTD/SciELO/Repo X)
- interface (web/API/OAI)
- consulta_exata
- campos
- filtros
- resultado_bruto_n
- export_formato
- dedupe_batch_id (se aplicável)
- observacoes
- evidencia_urls

### 6.2 `screening_fulltext.csv` (mínimo)

- record_id
- decisao (Incluir/Excluir)
- motivo_exclusao (controlado)
- url_texto_completo
- data
- revisor
- notas

---

## 7) PRISMA 2020 — checklist operacional (status)

O sistema deve manter `prisma_checklist_filled.md` com cada item marcado como:

- OK (preenchido)
- TBD (depende da execução)
- NA (não aplicável; justificar)

---

## 8) PRISMA-S — checklist operacional (status)

O sistema deve manter `prisma_s_checklist_filled.md` com os 16 itens e status OK/TBD/NA.

---

## 9) Condições de “publicável”

O output só é considerado publicável quando:

- PRISMA 2020 completo + fluxograma;
- PRISMA-S completo com strings, datas, logs e dedupe;
- motivos de exclusão em texto completo registrados;
- extração e codebook versionados;
- evidência por URL para itens críticos (OA, fontes, endpoints quando alegados);
- emendas registradas (se houver).

---

## 10) Campos a preencher antes de executar

- Tema/pergunta: <<FILL>>
- Critério de acesso (A ou B): <<FILL>>
- Fontes (Camada A): <<FILL>>
- Estratégia inicial de busca (blocos): <<FILL>>
- Ferramentas (Zotero/planilha): <<FILL>>
- Revisores (quantos e como resolvem divergência): <<FILL>>
- Instrumento de qualidade (se aplicável): <<FILL>>
- Registro do protocolo (OSF/RI/nenhum): <<FILL>>

---

## 11) (Apêndice) Fluxograma PRISMA sem `prisma_flow_counts.json` — Opção 2 (Markdown computável)

Se o sistema não gerar `prisma_flow_counts.json`, o workflow deve produzir um artefato equivalente em Markdown para consolidar os números do fluxograma PRISMA:

### Artefato obrigatório (alternativo)

- `prisma_flow_counts.md` — arquivo em formato key:value, versionado e auditável.

### Estrutura mínima de `prisma_flow_counts.md`

O arquivo deve conter, no mínimo, as seguintes chaves (uma por linha):

```
identified_db: <<FILL>>
identified_other: <<FILL>>
duplicates_removed: <<FILL>>
screened: <<FILL>>
title_abstract_excluded: <<FILL>>
retrieved_fulltext: <<FILL>>
fulltext_not_retrieved: <<FILL>>
fulltext_assessed: <<FILL>>
fulltext_excluded: <<FILL>>
included: <<FILL>>
```

### Regras

- Os valores devem ser **derivados** das tabelas/logs do sistema (busca, dedupe, triagem), ou preenchidos manualmente com indicação de fonte.
- O workflow deve manter consistência interna (ex.: screened = identified_db + identified_other − duplicates_removed).
- Quando `fulltext_not_retrieved > 0`, deve haver registro da razão (p.ex., link quebrado, embargo, login).
- O fluxograma PRISMA final (`prisma_flow_diagram.(svg|pdf)`) pode ser gerado manualmente a partir do `prisma_flow_counts.md` ou por rotina automatizada, mas o artefato `prisma_flow_counts.md` deve sempre permanecer como fonte de auditoria.
