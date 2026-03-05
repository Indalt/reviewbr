# Base de Conhecimento — Protocolos de Pesquisa Científica

> Este documento é a referência metodológica do PROJETISTA (Designer de Pesquisa).
> É lido automaticamente pela LLM via MCP Resource `projetista://protocols`.

---

## 1. Espectro de Pesquisa — Da Descoberta ao Rigor Máximo

O ReviewBR suporta o espectro completo da pesquisa acadêmica. O PROJETISTA deve
avaliar a intenção do pesquisador e recomendar o nível adequado.

### 1.1 Pesquisa Exploratória / Básica

- **Quando usar:** Curiosidade, mapeamento inicial, perguntas abertas.
- **Protocolo:** Sem PRISMA formal. Busca livre, documentada em log.
- **Cegamento:** Não necessário.
- **Registro:** Não necessário.
- **Meta-análise:** Não se aplica.
- **Limitação:** Resultados NÃO têm validade para publicação de alto impacto.
- **Escalabilidade:** Pode evoluir para Scoping Review se o pesquisador decidir publicar.

### 1.2 Revisão Rápida (Rapid Review)

- **Quando usar:** Prazos curtos, decisões urgentes, relatórios técnicos.
- **Protocolo:** PRISMA simplificado. Um único pesquisador, busca em ≥2 bases.
- **Cegamento:** Não obrigatório (SINGLE_BLIND recomendado se possível).
- **Registro:** Opcional (OSF Registries).
- **Meta-análise:** Geralmente não.
- **Limitação:** Reconhecida como revisão com risco de viés documentado.
- **Referência:** Cochrane Rapid Reviews Methods Group.

### 1.3 Revisão de Escopo (Scoping Review)

- **Quando usar:** Mapear a amplitude e natureza da literatura existente.
- **Protocolo:** PRISMA-ScR (Extensão para Scoping Reviews) + Guia JBI.
- **Framework:** PCC (População, Conceito, Contexto) em vez de PICO.
- **Cegamento:** Não se aplica.
- **Registro:** Opcional (OSF, PROSPERO não aceita Scoping Reviews).
- **Meta-análise:** Não se aplica (é descritiva, não analítica).
- **Saída:** Mapa da literatura com categorização temática.
- **Referência:** Arksey & O'Malley (2005), Levac et al. (2010), Tricco et al. (2018) — PRISMA-ScR.

### 1.4 Revisão Integrativa

- **Quando usar:** Combinar evidências experimentais e não-experimentais.
- **Protocolo:** Whittemore & Knafl (2005), PRISMA adaptado.
- **Cegamento:** Não obrigatório.
- **Registro:** Opcional (PROSPERO ou OSF).
- **Meta-análise:** Possível se dados quantitativos forem comparáveis.

### 1.5 Revisão Sistemática

- **Quando usar:** Pergunta focada, evidência de alta qualidade, publicação de alto impacto.
- **Protocolo:** PRISMA 2020 (27 itens, 44 subitens) + PRISMA-S (16 itens) + PRISMA-P (protocolo).
- **Framework:** PICO obrigatório.
- **Cegamento:** DOUBLE_BLIND obrigatório (≥2 revisores independentes).
- **Registro:** Obrigatório (PROSPERO para saúde; OSF para outros domínios).
- **Meta-análise:** Recomendada se dados quantitativos comparáveis existirem.
- **Saída:** Relatório PRISMA completo, fluxograma, risco de viés.
- **Requisito crítico:** Protocolo DEVE ser registrado ANTES da busca.

### 1.6 Meta-Análise

- **Quando usar:** Síntese estatística de múltiplos estudos com desfechos quantitativos.
- **Protocolo:** PRISMA 2020 + Diretrizes estatísticas (forest plot, heterogeneidade I²).
- **Cegamento:** DOUBLE_BLIND obrigatório.
- **Registro:** Obrigatório.
- **Ferramentas adicionais:** Análise de heterogeneidade, funnel plot, análise de sensibilidade.

---

## 2. PRISMA 2020 — Checklist Completo (27 itens, 44+ subitens)

### Seção: Título

- **Item 1** — Identifique como revisão sistemática no título.

### Seção: Resumo

- **Item 2** — Resumo estruturado (PRISMA para Resumos).

### Seção: Introdução

- **Item 3** — Justificativa: por que a revisão é necessária, evidências prévias.
- **Item 4** — Objetivos: perguntas de pesquisa usando PICO.

### Seção: Métodos

- **Item 5** — Protocolo e registro: link PROSPERO/OSF, DOI do protocolo.
- **Item 6a** — Critérios de elegibilidade: características dos estudos (PICO, desenho, contexto).
- **Item 6b** — Critérios de elegibilidade: restrições (idioma, data, status de publicação).
- **Item 7** — Fontes de informação: bases pesquisadas, datas, contatos com autores, última busca.
- **Item 8** — Estratégia de busca: sintaxe completa para CADA base (reprodutível).
- **Item 9** — Processo de seleção: quantos revisores, software usado, resolução de discordâncias.
- **Item 10a** — Extração de dados: como dados foram extraídos, quem extraiu, formulário usado.
- **Item 10b** — Extração de dados: como autores foram contactados para dados ausentes.
- **Item 11** — Itens de dados (variáveis): todos os desfechos e dados coletados.
- **Item 12** — Avaliação de risco de viés: ferramenta (RoB2, ROBINS-I, Newcastle-Ottawa, JBI).
- **Item 13a** — Medidas de efeito: OR, RR, HR, diferença de médias, SMD.
- **Item 13b** — Medidas de efeito: como intervalos de confiança foram calculados.
- **Item 13c** — Medidas de efeito: como dados foram transformados para meta-análise.
- **Item 13d** — Medidas de efeito: como dados ausentes foram tratados.
- **Item 14** — Síntese: como estudos foram agrupados, modelo de efeitos (fixo/randômico).
- **Item 15** — Análise de sensibilidade e subgrupos: planejadas a priori.
- **Item 16a** — Viés de publicação: avaliação (funnel plot, teste de Egger).
- **Item 16b** — Viés de publicação: como impactou a síntese.
- **Item 17** — Certeza da evidência: escala GRADE ou equivalente por desfecho.

### Seção: Resultados

- **Item 18** — Seleção de estudos: fluxograma PRISMA com números em cada etapa.
- **Item 19** — Características dos estudos: tabela completa (autor, ano, N, desenho, intervenção, desfecho).
- **Item 20a** — Risco de viés: resultado por estudo e por domínio.
- **Item 20b** — Risco de viés: impacto do viés nos resultados.
- **Item 21** — Resultados individuais: dados de cada estudo para cada desfecho.
- **Item 22** — Síntese: resultados combinados (forest plot, estimativa sumária, I²).

### Seção: Discussão

- **Item 23a** — Resumo das evidências: achados em relação aos objetivos.
- **Item 23b** — Resumo: limitações da evidência (GRADE).
- **Item 23c** — Resumo: limitações do processo de revisão.
- **Item 23d** — Resumo: implicações para prática e pesquisa futura.

### Seção: Outras Informações

- **Item 24a** — Registro: número PROSPERO/OSF, acesso ao protocolo.
- **Item 24b** — Registro: desvios do protocolo e justificativas.
- **Item 24c** — Registro: emendas ao protocolo.
- **Item 25** — Apoio: fontes de financiamento, papel do financiador.
- **Item 26** — Conflitos de interesse: declaração de cada autor.
- **Item 27** — Disponibilidade de dados: onde acessar dados, scripts, materiais.

---

## 3. PRISMA-S — Checklist de Estratégia de Busca (16 itens)

- **S1** — Nome da base de dados pesquisada.
- **S2** — Plataforma/interface usada (PubMed via MEDLINE, API OpenAlex, etc.).
- **S3** — Operadores booleanos documentados (AND, OR, NOT).
- **S4** — Filtros e limites aplicados (data, idioma, tipo de publicação).
- **S5** — Estratégia completa reprodutível para CADA base.
- **S6** — Vocabulário controlado usado (MeSH, DeCS, Emtree).
- **S7** — Termos de busca em linguagem natural / texto livre.
- **S8** — Campos pesquisados (título, abstract, todos os campos).
- **S9** — Busca por referências (forward/backward citation — snowball).
- **S10** — Busca em registros de ensaios (ClinicalTrials.gov, PROSPERO).
- **S11** — Contato com autores/especialistas para dados adicionais.
- **S12** — Busca em literatura cinzenta (teses, conferências, pré-prints).
- **S13** — Restrições de idioma com justificativa.
- **S14** — Restrições de data com justificativa.
- **S15** — Atualizações da busca antes da publicação.
- **S16** — Gestão de registros: software de deduplicação (Zotero, ReviewBR, Mendeley).

---

## 4. Outros Protocolos Científicos

### 4.1 PRISMA-P (Protocolo)

Checklist para **publicação do protocolo** antes da execução da revisão:

- 17 itens que especificam o que deve constar no documento de protocolo
- Inclui: justificativa, objetivos, critérios PICO, estratégia de busca planejada,
  plano de extração, plano de risco de viés, plano de síntese
- **Obrigatório para:** Revisões Sistemáticas e Meta-Análises registradas no PROSPERO

### 4.2 PRISMA-ScR (Extensão para Scoping Reviews)

Adaptação do PRISMA para Revisões de Escopo (Tricco et al., 2018):

- 20 itens + 2 opcionais
- Diferenças do PRISMA 2020:
  - Não exige avaliação de risco de viés (item 12 removido)
  - Não exige avaliação de certeza (item 17 removido)
  - Usa PCC em vez de PICO
  - Foco em mapeamento, não em síntese analítica

### 4.3 MOOSE (Meta-analyses Of Observational Studies in Epidemiology)

Para **meta-análises de estudos observacionais** (não ensaios clínicos):

- 6 seções com 35 subitens
- Seções: Antecedentes, Estratégia de Busca, Métodos, Resultados, Discussão, Conclusão
- Foco em heterogeneidade clínica e estatística de estudos observacionais
- **Quando usar:** Meta-análise de coortes, caso-controle, séries transversais

### 4.4 AMSTAR-2 (A MeaSurement Tool to Assess systematic Reviews)

Ferramenta de **avaliação da qualidade** de revisões sistemáticas já publicadas:

- 16 itens (7 críticos + 9 não-críticos)
- Itens críticos: protocolo, busca, risco de viés, métodos estatísticos, publicação bias, conflitos
- Classificação: Alta, Moderada, Baixa, Criticamente Baixa
- **Quando usar:** Para avaliar revisões existentes (auditoria metodológica)

### 4.5 ENTREQ (Enhancing Transparency in Reporting the Synthesis of Qualitative Research)

Para **sínteses qualitativas** (metassínteses):

- 21 itens em 5 domínios
- Domínios: Introdução, Métodos, Literatura, Avaliação, Síntese
- **Quando usar:** Pesquisas que sintetizam estudos qualitativos (etnografia, fenomenologia)

### 4.6 JBI (Joanna Briggs Institute) Manual

Diretrizes abrangentes para **todos os tipos de revisão**:

- Revisão Sistemática, Scoping Review, Umbrella Review, Revisão de Texto e Opinião
- Ferramentas de avaliação crítica (JBI Critical Appraisal Checklists)
- Padrão de referência para enfermagem e ciências da saúde

### 4.7 GRADE (Grading of Recommendations, Assessment, Development and Evaluations)

Sistema para avaliar **certeza da evidência** por desfecho:

- 5 fatores que diminuem: risco de viés, inconsistência, imprecisão,
  indiretividade, viés de publicação
- 3 fatores que aumentam: grande efeito, dose-resposta, confundidores residuais
- Classifica em: Alta, Moderada, Baixa, Muito Baixa
- Usado em conjunto com PRISMA item 17

---

## 5. Framework PICO / PCC

### PICO (para revisões focadas em intervenção)

- **P** (Population) — Quem é o grupo estudado?
- **I** (Intervention) — Qual intervenção, exposição ou tratamento?
- **C** (Comparison) — Contra o que é comparado? (placebo, controle, outro tratamento)
- **O** (Outcome) — Qual o desfecho medido?

### PCC (para scoping reviews e mapeamento)

- **P** (Population) — Quem é o grupo?
- **C** (Concept) — Qual o conceito central investigado?
- **C** (Context) — Em qual contexto geográfico, temporal ou institucional?

---

## 6. Árvore de Decisão do PROJETISTA

```text
O pesquisador quer...
│
├─ "Saber sobre um tema" → Pesquisa Exploratória
│  └─ Sem PRISMA, busca livre, log documentado
│
├─ "Mapear o que existe" → Scoping Review (PRISMA-ScR)
│  └─ PCC, sem meta-análise, categorização temática
│
├─ "Relatório urgente" → Rapid Review
│  └─ PRISMA simplificado, ≥2 bases, viés documentado
│
├─ "Combinar evidências diversas" → Revisão Integrativa
│  └─ PRISMA adaptado, pode incluir quanti + quali
│
├─ "Responder pergunta clínica focada" → Revisão Sistemática
│  └─ PRISMA 2020 + PRISMA-S + PRISMA-P, PICO, DOUBLE_BLIND, PROSPERO
│
├─ "Quantificar efeito de intervenção" → Meta-Análise
│  └─ Tudo da SR + forest plot, I², funnel plot
│  └─ Se observacional: considere MOOSE em vez de PRISMA
│
├─ "Sintetizar estudos qualitativos" → Metassíntese (ENTREQ)
│  └─ Checklist ENTREQ, análise temática
│
└─ "Validar pesquisa já feita" → Auditoria Metodológica (AMSTAR-2)
   └─ PRISMA passivo, somente leitura, 5 checks + 16 itens AMSTAR-2
```

---

## 7. Capacidades e Limitações do ReviewBR

### O que o sistema PODE fazer

- Busca automatizada em 10+ bases (OpenAlex, PubMed, SciELO, CORE, Crossref, OasisBR, etc.)
- Download e extração de texto de PDFs (com PDF Link Resolver para repos brasileiros)
- Triagem por IA (Gemini/GPT/Claude) e por ML (ASReview Active Learning)
- Deduplicação inteligente (DOI, autores, similaridade de títulos)
- Validação PRISMA (fluxograma matemático, 10 campos)
- Auditoria metodológica (5 checks de conformidade)
- Processamento em lote (keyword screen, LLM extract, DB screen)
- Tradução de apoio (texto auxiliar, NÃO fonte primária)
- Snowball search (forward/backward via OpenAlex, Crossref, Zotero)

### O que o sistema NÃO pode fazer

- Avaliação de risco de viés (RoB2, Newcastle-Ottawa) — requer julgamento humano
- Meta-análise estatística (forest plot, I²) — requer software especializado (R/RevMan)
- Registro de protocolo em PROSPERO — é feito manualmente pelo pesquisador
- Cegamento real — o sistema simula separação de revisores, mas não há multiusuário
- Substituir o julgamento científico humano — a IA é ferramenta, não pesquisador

### Alertas para o pesquisador

- Traduções são TEXTO DE APOIO — para citação, use o original
- Triagem por IA pode ter falsos positivos/negativos — validação humana recomendada
- O sistema documenta tudo em logs JSONL — reprodutibilidade garantida
- Pesquisa exploratória NÃO tem validade para publicação de alta evidência

---

## 8. Comunicação PROJETISTA → COORDINATOR

Ao finalizar o desenho do projeto, o PROJETISTA deve comunicar ao COORDINATOR:

1. **Tipo de pesquisa definido** e protocolo aplicável
2. **Bases de dados a serem consultadas** (todas por padrão, restrições se solicitado)
3. **Requisitos de cegamento** e se o pesquisador aceitou a recomendação
4. **Necessidade de registro** (PROSPERO, OSF) — se obrigatório, alertar antes de iniciar
5. **Limitações identificadas** — o que o sistema pode e não pode fazer para este projeto
6. **Recomendações de escalabilidade** — se o escopo pode/deve ser ampliado
7. **Protocolo(s) de reporte** — qual checklist será usado (PRISMA 2020, PRISMA-ScR, MOOSE, ENTREQ)

---

## 9. Dois Modos de Operação do PROJETISTA

### Modo Guiado (pesquisador precisa de orientação)

O pesquisador expressa uma intenção vaga ("quero estudar X"). O PROJETISTA:

1. Consulta esta base de conhecimento
2. Detecta o tipo de pesquisa mais adequado
3. Apresenta requisitos, limitações e alternativas
4. Dialoga até o pesquisador confirmar o design

### Modo Direto (pesquisador já sabe o que quer)

O pesquisador já definiu o tipo ("preciso de uma revisão sistemática sobre X"). O PROJETISTA:

1. Valida se o tipo solicitado é viável com os recursos do sistema
2. Informa requisitos obrigatórios (registro PROSPERO, PICO, cegamento)
3. Alerta sobre limitações relevantes
4. Desenha o projeto diretamente, sem questionário extenso
