# AUDIT SUMMARY

## 5 Maiores Riscos PRISMA/PRISMA-S Identificados

1. **PRISMA-S Item 8 (Full Search Strategy)**: O manuscrito original mencionava apenas "Sistemas PRISMAid" sem detalhar a string exata, JSON de configuração ou lista de repositórios, o que impedia a reprodutibilidade.
    * *Correção*: Criado `supplement_search_prisma_s.md` com a string CLI exata e lista de repositórios em `supplement_sources_registry.md`.
2. **PRISMA 2020 Item 6 (Information Sources)**: A lista de "21 repositórios" era vaga.
    * *Correção*: Listados os principais repositórios institucionais (UFBA, UFC, UFRN, etc.) no Suplemento 4.
3. **PRISMA 2020 Item 16a (Study Selection Process)**: A distinção entre "não recuperado" (226) e "excluído" (67) estava correta nos números, mas faltava o detalhamento das razões de exclusão (Automático vs Manual).
    * *Correção*: Criado `screening_report.md` detalhando as 66 exclusões por IA e 1 por humano.
4. **PRISMA 2020 Item 27 (Availability of Data)**: O draft original citava apenas um CSV de log.
    * *Correção*: Expandida a seção de Declarações para incluir referências a todos os novos suplementos de auditoria (Dedupe, Screening, Characteristics).
5. **Deduplicação (PRISMA-S Item 14)**: Não havia menção explícita ao método de desduplicação.
    * *Correção*: Criado `dedupe_report.md` explicando a normalização de Título/Ano.

## 5 Correções Aplicadas

1. **Geração de Tabela de Características**: Criado CSV estruturado (`study_characteristics_table.csv`) com metadados de todos os 41 estudos incluídos para cumprir o PRISMA Item 17.
2. **Mapeamento de Checklist**: Preenchidos os checklists PRISMA 2020 e PRISMA-S mapeando cada item para a seção correspondente do novo manuscrito.
3. **Detalhamento da Busca**: Extraído do log CSV a data exata (18/02/2026) e a string JSON para o Suplemento 1.
4. **Revisão do Fluxograma**: Validados os números (338 id -> 4 dup -> 334 screen -> 108 assessed -> 41 included) e gerado `prisma_flow_counts.md`.
5. **Padronização de Referências Cruzadas**: O manuscrito revisado agora cita explicitamente "Suplemento X" em vez de descrições genéricas.

## 5 Itens TBD (To Be Determined)

1. **Risk of Bias (Item 11/18)**: Marcado como "Não Realizado / Síntese Narrativa" devido à heterogeneidade. Requer input humano se for imperativo avaliar qualidade (ex: ROBIS/CASP).
2. **Effect Measures (Item 12)**: N/A dado ser uma revisão qualitativa/zootécnica sem meta-análise quantitativa.
3. **Study Registry (PRISMA-S Item 3)**: Não aplicável (search em repositórios, não em registros de ensaios clínicos), mas confirmado como N/A.
4. **Funding Sources dos Estudos Incluídos**: A tabela de características não extraiu financiamento individual de cada PDF (dado não estruturado).
5. **Certainty Assessment (Item 15/22)**: GRADE não aplicável para este tipo de revisão exploratória.

---

# CHANGE LOG

## Alterações no Manuscrito (`manuscript_prisma_revised.md`)

* **Seção 2 (Metodologia)**:
  * Adicionada referência explícita aos checklists PRISMA 2020 e PRISMA-S.
  * **2.1 Fontes**: Link para `supplement_sources_registry.md`.
  * **2.2 Busca**: Link para `supplement_search_prisma_s.md` e detalhamento da justificativa do termo "descritor taxonômico".
  * **2.4 Processamento**: Referências a `dedupe_report.md` e `screening_report.md`.
* **Seção 3 (Resultados)**:
  * **3.1 Seleção**: Texto ajustado para refletir a precisão dos números auditados (66 IA + 1 Humano).
  * **3.2 Características**: Adicionada referência à `study_characteristics_table.csv` substituindo a necessidade de descrever cada estudo no texto corrido (embora a síntese temática permaneça).
* **Seção 6 (Declarações)**:
  * Atualizada a lista de "Disponibilidade de Dados" para incluir os 6 novos artefatos de auditoria.
