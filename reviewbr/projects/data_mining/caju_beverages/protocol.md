# PRISMA Protocol & Checklist

**Status**: [LOCKED] <!-- Options: [DRAFT], [LOCKED] -->
**Date**: 2026-02-19

---

## F0. Identificação Inicial

**Título**: Bebidas à Base de Caju (*Anacardium occidentale* L.): Uma Revisão de Escopo sobre Aspectos Tecnológicos e Saberes Populares
**Tipo de Revisão**: Revisão de Escopo (Scoping Review)
**Justificativa do Tipo**: O tema é amplo e exploratório, mapeando o "estado da arte" de produtos derivados de qualquer parte da planta do caju (alcoólicos e não alcoólicos). Não visa avaliar uma intervenção clínica específica, o que justifica a escolha pelo mapeamento (Scoping) em vez de uma revisão sistemática clássica (Intervention).

---

## F1. Introdução e Métodos (Protocolo)

### F1.1 Racional

O caju (*Anacardium occidentale* L.) possui vasto potencial agroindustrial e cultural do qual derivam inúmeras bebidas (cajuína, sucos, vinhos, fermentados). Faz-se necessário mapear a produção científica sobre esses derivados para entender não apenas as tendências industriais, mas também o uso popular e as inovações em tecnologias sociais (conhecimentos tradicionais aplicados à formulação de bebidas).

### F1.2 Objetivos (PICOS / PCC)

Para Revisões de Escopo, utilizamos o framework PCC (População/Problema, Conceito, Contexto):

- **Problema**: Produção, formulação e uso popular.
- **Conceito**: Bebidas (alcoólicas e não alcoólicas) produzidas a partir de qualquer parte anatômica da planta do caju (*Anacardium occidentale*).
- **Contexto**: Aspectos da tecnologia industrial, físico-químicos, sensoriais e tecnologias sociais/saberes populares disponíveis na literatura alocada em repositórios científicos brasileiros.

### F1.3 Critérios de Elegibilidade (F4.1, F4.2)

- **F1.3.1 Critérios de Inclusão ([INC])**:
  - `INC_01`: Focus on development, analysis, or production of a beverage using any anatomical part of *Anacardium occidentale*.
  - `INC_02`: Estudos originais (artigos experimentais, teses, dissertações e relatos de experiência/uso popular) depositados em repositórios científicos baseados no Brasil.
  - `INC_03`: Published within the defined date range: **2015 a 2025** (Últimos 10 anos).
- **F1.3.2 Critérios de Exclusão (Para fase F4.2 - Leitura Completa)**:
  - `EXC_01`: Agronomic studies of the plant with no relation to beverage formulation.
  - `EXC_02`: Literature reviews.
  - `EXC_03`: Published before 2015.

### F1.4 Fontes de Informação (Bases de Dados)

Foco principal na literatura científica alocada em repositórios reconhecidos como brasileiros, testando as integrações primárias do servidor MCP:

- BDTD (Biblioteca Digital Brasileira de Teses e Dissertações)
- Oasisbr (Portal Brasileiro de Publicações Científicas em Acesso Aberto)
- SciELO (Scientific Electronic Library Online - Coleção Brasil)

### F1.5 Strings de Busca (F2)

Conforme orientação metodológica para evitar ruídos semânticos com o termo "caju" (que pode assumir outros significados ou referir-se a produtos não relacionados à planta em si), a busca será ancorada **exclusivamente no nome científico**.

**String Principal (Bases em Português):**
`"Anacardium occidentale" AND (bebida OR bebidas OR suco OR néctar OR vinho OR fermentado OR cajuína OR "cajuina")`

### F1.6 Variáveis de Extração (F5.2)

*O Synthesis Agent extrairá:*

- `tipo_bebida` (e.g., Alcoólica, Não Alcoólica, Fermentado, Suco)
- `parte_da_planta` (e.g., Pseudofruto, Castanha, Casca do Caule)
- `resultado_principal` (e.g., Aspectos físico-químicos, aceitação sensorial)
- As strings obrigatórias (`fonte_repositorio`, `instituicao_origem`, `url_hospedagem`) estabelecidas pela RV-08.

---
**Nota Anti-Viés (RV-01)**: Nenhuma busca deve ser iniciada até que o status do protocolo seja marcado como `[LOCKED]`.
