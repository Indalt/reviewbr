# Protocolo de Revisão de Escopo (Scoping Review): Violência Contra a Mulher no Audiovisual

## Título Provisório

**"Entre a Tela e a Realidade: Uma Revisão de Escopo sobre as Evidências Empíricas do Consumo Audiovisual no Comportamento Humano e o Mapeamento Histórico da Violência contra a Mulher no Cinema (1930-1990)"**

---

## 1. Introdução e Racional Teórico

### 1.1 O Problema

A relação entre consumo de mídia audiovisual e comportamento humano é objeto de intenso debate público, frequentemente sustentado por correlações intuitivas ou senso comum. Paralelamente, décadas de produção cinematográfica normalizaram, romantizaram ou instrumentalizaram a violência contra a mulher — muitas vezes sob o manto da comédia ou do entretenimento comercial — antes mesmo que a internet amplificasse o alcance dessas narrativas.

### 1.2 Objetivo

Esta Revisão de Escopo tem como objetivo **mapear** dois eixos complementares:

1. **Eixo Empírico:** Identificar e categorizar as evidências científicas (experimentais, observacionais, longitudinais) sobre os efeitos do consumo audiovisual no comportamento humano, com ênfase em estudos que ultrapassem a mera correlação intuitiva.
2. **Eixo Histórico:** Cartografar como a violência contra a mulher foi retratada, analisada e discutida academicamente no período pré-internet (1930-1990), mapeando a evolução das representações e do discurso científico sobre o tema.

### 1.3 Pergunta de Revisão (PCC Framework)

| Elemento | Eixo 1 (Empírico) | Eixo 2 (Histórico) |
|---|---|---|
| **P** (População) | Espectadores/consumidores de mídia audiovisual | Obras audiovisuais (filmes, TV, documentários) |
| **C** (Conceito) | Efeitos mensuráveis no comportamento: dessensibilização, normalização, imitação, mudança atitudinal | Violência contra a mulher: representação, romantização, naturalização |
| **C** (Contexto) | Estudos empíricos com rigor metodológico (experimentos, grupo controle, longitudinal) | Produção e análise acadêmica entre 1930 e 1990 (era pré-internet) |

**Pergunta Eixo 1:** *"Quais evidências empíricas a ciência produziu sobre os efeitos mensuráveis do consumo de mídia audiovisual no comportamento humano — para além da intuição e da correlação imaginada?"*

**Pergunta Eixo 2:** *"Como a violência contra a mulher foi retratada e analisada academicamente no cinema e na televisão durante o período entre 1930 e 1990?"*

---

## 2. Metodologia (PRISMA-ScR + JBI)

Padrão de reporte: **PRISMA-ScR** (Tricco et al., 2018).
Framework metodológico: **JBI Manual for Evidence Synthesis** (Peters et al., 2020).

### 2.1 Estrutura em Dois Braços

A extração será conduzida em dois braços independentes para evitar contaminação conceitual. A síntese cruzada ocorrerá apenas na fase final de discussão.

---

### 2.2 Braço 1: Eixo Empírico — Consumo Audiovisual × Comportamento

#### String de Busca

> [!IMPORTANT]
> O bloco "Empirical" é o diferencial desta busca. Ele garante que só entrem estudos com algum rigor de prova, excluindo ensaios puramente teóricos ou opinativos.

**Inglês (Bases Internacionais):**

```text
(film OR films OR movies OR cinema OR television OR "mass media" OR audiovisual) 
AND 
(behavior OR "social behavior" OR attitude OR aggression OR imitation 
 OR normalization OR desensitization OR "copycat" OR "prosocial" OR empathy) 
AND 
(empirical OR experiment OR "controlled study" OR "control group" 
 OR "randomized" OR longitudinal OR "meta-analysis" OR "systematic review" 
 OR "effect size" OR "causal" OR "measured" OR "observational study")
```

**Português (Bases Nacionais):**

```text
(filme OR filmes OR cinema OR televisão OR "mídia de massa" OR audiovisual) 
AND 
(comportamento OR atitude OR agressividade OR imitação 
 OR normalização OR dessensibilização OR "comportamento pró-social" OR empatia) 
AND 
(empírico OR experimento OR "grupo controle" OR "estudo controlado" 
 OR longitudinal OR "meta-análise" OR "revisão sistemática" OR "tamanho do efeito" 
 OR causal OR mensurado OR "estudo observacional")
```

#### Critérios de Inclusão (Eixo 1)

- Estudos empíricos originais (experimentais, quasi-experimentais, observacionais, longitudinais)
- Meta-análises e revisões sistemáticas sobre o tema
- Publicações em qualquer idioma com resumo em inglês, português ou espanhol
- Sem restrição temporal (todo o período coberto pelas bases)

#### Critérios de Exclusão (Eixo 1)

- Ensaios teóricos ou opinativos sem coleta de dados
- Editoriais, cartas ao editor, resenhas de filmes
- Estudos sobre videogames exclusivamente (sem componente de cinema/TV)
- Estudos sobre efeitos de noticiários/jornalismo (foco deve ser ficção/entretenimento)

---

### 2.3 Braço 2: Eixo Histórico — Violência contra a Mulher no Audiovisual (1930-1990)

#### String de Busca

**Inglês (Bases Internacionais):**

```text
("violence against women" OR "gender-based violence" OR "domestic violence" 
 OR "intimate partner violence" OR femicide OR "sexual violence" 
 OR "battered women" OR misogyny OR "sexual assault") 
AND 
(film OR films OR movies OR cinema OR television OR broadcast OR "motion picture")
```

**Português (Bases Nacionais):**

```text
("violência contra a mulher" OR "violência contra as mulheres" 
 OR "violência de gênero" OR "violência doméstica" 
 OR feminicídio OR "violência sexual" OR misoginia OR "agressão sexual") 
AND 
(filme OR filmes OR cinema OR televisão OR transmissão OR audiovisual)
```

> [!IMPORTANT]
> **Filtro temporal obrigatório:** `publication_year: 1930-1990`. Este filtro refere-se ao **ano de publicação do artigo/estudo**, não ao ano de produção do filme analisado. Será aplicado via API (parâmetro `dateFrom` / `dateUntil` nas ferramentas do MCP), e NÃO embutido no booleano textual.

#### Critérios de Inclusão (Eixo 2)

- Artigos, teses, dissertações e capítulos que analisem representações de violência contra a mulher em obras audiovisuais
- Publicações entre 1930 e 1990 (inclusive)
- Qualquer idioma com resumo em inglês, português, espanhol ou francês
- Estudos empíricos E teóricos (neste eixo, a análise fílmica/semiótica é aceita)

#### Critérios de Exclusão (Eixo 2)

- Publicações após 1990 (mesmo que analisem filmes do período)
- Resenhas jornalísticas sem análise acadêmica
- Fichas técnicas ou catálogos de festivais

---

## 3. Fontes de Dados (Bases a Consultar)

| Base | Tipo | Eixo 1 | Eixo 2 |
|---|---|---|---|
| **OpenAlex** | Agregador global | ✅ | ✅ |
| **PubMed** | Biomédica/Psicologia | ✅ | ✅ |
| **BDTD** | Teses/Diss. Brasil | ✅ | ✅ |
| **SciELO** | Periódicos Lat. Am. | ✅ | ✅ |
| **CORE** | Textos completos OA | ✅ | ✅ |
| **Europe PMC** | Biomédica/Europa | ✅ | ✅ |
| **Crossref** | Metadados globais | ✅ | ✅ |

> [!NOTE]
> Todas as bases são Open Access, em conformidade com a diretriz de Ciência Aberta do ReviewBR.

---

## 4. Volume Estimado (Amostragem Prévia — OpenAlex)

| Eixo | Query | Período | Volume |
|---|---|---|---|
| **Eixo 1** (Empírico + Violência) | Audiovisual + Behavior + Empirical + Violence Against Women | 1930-1990 | **250 artigos** ✅ |
| **Eixo 1** (Empírico + Violência) | Mesma query | 1991-2026 | 41.396 artigos |
| **Eixo 2** (Histórico) | Violence Against Women + Media | 1930-1990 | **329 artigos** ✅ |

> [!TIP]
> **Ambos os eixos possuem volume ideal para triagem completa dentro da janela 1930-1990.** Soma estimada: ~579 artigos (antes da deduplicação, que provavelmente reduzirá para ~400-450).

---

## 5. Estratégia de Triagem

1. **Remoção de duplicatas** — `deduplicate_dataset` (DOI + similaridade de títulos)
2. **Triagem automatizada por IA** — `screen_candidates` (Trilha LLM via Gemini)
3. **Métricas de saturação** — `get_screening_report` após cada batch
4. **Decisão humana** sobre o ponto de parada

---

## 6. Extração de Dados

Para cada artigo incluído, serão extraídos:

| Campo | Eixo 1 | Eixo 2 |
|---|---|---|
| Título, Autores, Ano, DOI | ✅ | ✅ |
| Desenho do estudo (experimental, observ., etc.) | ✅ | — |
| Tipo de mídia analisada (filme, TV, doc.) | ✅ | ✅ |
| Desfecho medido (dessensibilização, atitude, etc.) | ✅ | — |
| Tipo de violência representada | — | ✅ |
| Como a violência é enquadrada (romantização, denúncia, humor) | — | ✅ |
| Resultados principais / conclusões | ✅ | ✅ |

---

## 7. Execução no MCP (Plano Técnico)

### Passos no Sistema ReviewBR

1. `assess_research_design` → Confirmar tipo `scoping_review`
2. `plan_research_protocol` → Registrar o protocolo PCC
3. `switch_agent` → COORDINATOR → LIBRARIAN
4. `search_papers_optimized` (Eixo 2) → Busca com filtro 1930-1990
5. `search_papers_optimized` (Eixo 1) → Busca cruzada empírica + violência
6. `search_pubmed` → Complementar com PubMed (psicologia experimental)
7. `deduplicate_dataset` → Limpeza
8. `screen_candidates` → Triagem por IA
9. `get_screening_report` → Métricas de saturação
10. `download_and_extract_pdfs` → Texto completo
11. `export_dataset` → Exportação final para análise

### Verificação

- Conferir se o projeto está em estado `locked_execution` após a primeira busca oficial
- Validar que os logs `search_history.json` registram corretamente cada busca
- Rodar `validate_prisma_flow` ao final para conferir a aritmética do funil

---

## 8. Cronograma Estimado

| Fase | Prazo |
|---|---|
| Aprovação do Protocolo | Hoje |
| Busca Oficial (Eixo 2) | Imediato após aprovação |
| Busca Oficial (Eixo 1 refinado) | Após definição do cruzamento |
| Triagem | 1-2 sessões |
| Extração de Texto Completo | 1 sessão |
| Síntese Cruzada | A definir |

---

## 9. Declaração de Viés e Limitações

- Não está prevista avaliação formal de Risco de Viés (RoB2), conforme padrão PRISMA-ScR
- A restrição temporal do Eixo 2 (1930-1990) pode excluir análises retrospectivas publicadas após 1990 que abordam filmes do período
- O Eixo 1 em sua forma pura é excessivamente amplo e dependerá de refinamento temático

---

## User Review Required

> [!NOTE]
> **Eixo 1 refinado:** O booleano empírico foi cruzado com `("violence against women" OR "gender-based violence" OR ...)` e filtrado para 1930-1990, resultando em **250 artigos**. Volume confirmado e viável.

> [!NOTE]
> **Critério temporal confirmado:** O filtro `1930-1990` aplica-se ao **ano de publicação do estudo** (não ao ano do filme). Um estudo de 1985 sobre um filme de 1940 **entra**; um estudo de 2010 sobre esse mesmo filme **não entra**.
