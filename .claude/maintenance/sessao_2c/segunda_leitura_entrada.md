# PRISMA-S — os 16 itens oficiais

- **S1** — seção INFORMATION SOURCES AND METHODS — tópico: *Database name*
  - enunciado: Name each individual database searched, stating the platform for each.
- **S2** — seção INFORMATION SOURCES AND METHODS — tópico: *Multi-database searching*
  - enunciado: If databases were searched simultaneously on a single platform, state the name of the platform, listing all of the databases searched.
- **S3** — seção INFORMATION SOURCES AND METHODS — tópico: *Study registries*
  - enunciado: List any study registries searched.
- **S4** — seção INFORMATION SOURCES AND METHODS — tópico: *Online resources and browsing*
  - enunciado: Describe any online or print source purposefully searched or browsed (e.g., tables of contents, print conference proceedings, web sites), and how this was done.
- **S5** — seção INFORMATION SOURCES AND METHODS — tópico: *Citation searching*
  - enunciado: Indicate whether cited references or citing references were examined, and describe any methods used for locating cited/citing references (e.g., browsing reference lists, using a citation index, setting up email alerts for references citing included studies).
- **S6** — seção INFORMATION SOURCES AND METHODS — tópico: *Contacts*
  - enunciado: Indicate whether additional studies or data were sought by contacting authors, experts, manufacturers, or others.
- **S7** — seção INFORMATION SOURCES AND METHODS — tópico: *Other methods*
  - enunciado: Describe any additional information sources or search methods used.
- **S8** — seção SEARCH STRATEGIES — tópico: *Full search strategies*
  - enunciado: Include the search strategies for each database and information source, copied and pasted exactly as run.
- **S9** — seção SEARCH STRATEGIES — tópico: *Limits and restrictions*
  - enunciado: Specify that no limits were used, or describe any limits or restrictions applied to a search (e.g., date or time period, language, study design) and provide justification for their use.
- **S10** — seção SEARCH STRATEGIES — tópico: *Search filters*
  - enunciado: Indicate whether published search filters were used (as originally designed or modified), and if so, cite the filter(s) used.
- **S11** — seção SEARCH STRATEGIES — tópico: *Prior work*
  - enunciado: Indicate when search strategies from other literature reviews were adapted or reused for a substantive part or all of the search, citing the previous review(s).
- **S12** — seção SEARCH STRATEGIES — tópico: *Updates*
  - enunciado: Report the methods used to update the search(es) (e.g., rerunning searches, email alerts).
- **S13** — seção SEARCH STRATEGIES — tópico: *Dates of searches*
  - enunciado: For each search strategy, provide the date when the last search occurred.
- **S14** — seção PEER REVIEW — tópico: *Peer review*
  - enunciado: Describe any search peer review process.
- **S15** — seção MANAGING RECORDS — tópico: *Total Records*
  - enunciado: Document the total number of records identified from each database and other information sources.
- **S16** — seção MANAGING RECORDS — tópico: *Deduplication*
  - enunciado: Describe the processes and any software used to deduplicate records from multiple database searches and other information sources.

# Campos da trilha do método (cada linha: subitem | colunas da tabela, sem as de mapeamento)


## F0 — PRÉ-REGISTRO


## F0.1 — Identidade do Projeto

| Subitem | Campo | Descrição | Obrigatório |
| F0.1.1 | Título completo da revisão | Deve identificar como revisão sistemática ou scoping review | ✅ |
| F0.1.2 | Título abreviado / slug | Gerado automaticamente pelo sistema | ✅ |
| F0.1.3 | Tipo de revisão | Sistemática / Scoping / Meta-análise / Mista | ✅ |
| F0.1.4 | Data de início do protocolo | YYYY-MM-DD | ✅ |
| F0.1.5 | Versão do protocolo | Ex: v1.0 | ✅ |
| F0.1.6 | Autores da revisão | Nome completo, instituição, ORCID | ✅ |
| F0.1.7 | Instituição responsável | Nome completo + sigla | ✅ |
| F0.1.8 | Financiamento | Agência, número do edital ou "sem financiamento" | ✅ |
| F0.1.9 | Conflito de interesses | Declaração explícita de cada autor | ✅ |

## F0.2 — Registro do Protocolo

| Subitem | Campo | Descrição | Obrigatório |
| F0.2.1 | Plataforma de registro | PROSPERO / OSF / INPLASY / Research Registry | ✅ |
| F0.2.2 | Número de registro | CRD... / osf.io/... / INPLASY... | ✅ |
| F0.2.3 | URL do registro | Link público do protocolo registrado | ✅ |
| F0.2.4 | Data do registro | Deve ser anterior ao início da busca | ✅ |
| F0.2.5 | Status | Registrado / Em processo / Não aplicável + justificativa | ✅ |

## F0.3 — Justificativa e Contexto

| Subitem | Campo | Descrição | Obrigatório |
| F0.3.1 | Justificativa da revisão | Por que esta revisão é necessária agora | ✅ |
| F0.3.2 | Revisões anteriores sobre o tema | Citar e explicar por que nova revisão é necessária | ✅ |
| F0.3.3 | Lacuna identificada na literatura | O que ainda não foi respondido | ✅ |
| F0.3.4 | Relevância para política ou prática | Impacto esperado dos resultados | ✅ |

## F1 — PROTOCOLO DA QUESTÃO DE PESQUISA


## F1.1 — Questão de Pesquisa

| Subitem | Campo | Descrição | Obrigatório |
| F1.1.1 | Questão principal | Formulada de forma clara e verificável | ✅ |
| F1.1.2 | Questões secundárias | Se houver — listar todas | ⚠️ se houver |
| F1.1.3 | Framework utilizado | PICOS / PECO / SPIDER / PCC | ✅ |

## F1.2 — PICOS Completo

| Subitem | Elemento | Campo | Descrição | Obrigatório |
| F1.2.1 | P | População/Problema | Definição precisa da população ou problema | ✅ |
| F1.2.2 | P | Termos de busca — P | MeSH + DeCS + termos livres pt/en/es | ✅ |
| F1.2.3 | I | Intervenção/Exposição | O que foi feito, aplicado ou estudado | ✅ |
| F1.2.4 | I | Termos de busca — I | MeSH + DeCS + termos livres pt/en/es | ✅ |
| F1.2.5 | C | Comparador | Grupo controle, comparação ou "N/A + justificativa" | ✅ |
| F1.2.6 | C | Termos de busca — C | Se aplicável | ⚠️ se aplicável |
| F1.2.7 | O | Outcomes/Desfechos | Listar TODOS os desfechos primários e secundários | ✅ |
| F1.2.8 | O | Termos de busca — O | Se incluídos na string | ⚠️ se aplicável |
| F1.2.9 | S | Tipo de Estudo | Delineamentos elegíveis | ✅ |
| F1.2.10 | S | Termos de busca — S | Filtros de tipo de estudo | ⚠️ se aplicável |

## F1.3 — Critérios de Elegibilidade Completos


## F1.3.1 — Critérios de Inclusão

| Subitem | Campo | Descrição | Obrigatório |
| F1.3.1.1 | Matéria-prima / População | Definição exata do que será incluído | ✅ |
| F1.3.1.2 | Intervenção / Objeto | Tipos de intervenção ou objeto de estudo aceitos | ✅ |
| F1.3.1.3 | Desfechos mínimos | Ao menos um desfecho que o estudo deve reportar | ✅ |
| F1.3.1.4 | Tipo de documento | Artigo / Tese / Dissertação / etc. | ✅ |
| F1.3.1.5 | Período de publicação | Ano inicial e ano final | ✅ |
| F1.3.1.6 | Idiomas aceitos | pt / en / es / outros + justificativa | ✅ |
| F1.3.1.7 | Acesso ao texto completo | Texto completo disponível | ✅ |

## F1.3.2 — Critérios de Exclusão

| Subitem | Campo | Descrição | Obrigatório |
| F1.3.2.1 | Escopo | O que está fora do escopo por definição | ✅ |
| F1.3.2.2 | Tipo de documento | O que não será aceito | ✅ |
| F1.3.2.3 | Período | Publicações fora do recorte | ✅ |
| F1.3.2.4 | Idioma | Idiomas não aceitos | ✅ |
| F1.3.2.5 | Duplicatas | Critério de identificação e resolução | ✅ |
| F1.3.2.6 | Texto completo indisponível | Após tentativas de recuperação | ✅ |
| F1.3.2.7 | Qualidade mínima | Se aplicável — ferramenta ou critério usado | ⚠️ se aplicável |

## F1.4 — Geração das Strings de Busca

| Subitem | Campo | Descrição | Obrigatório |
| F1.4.1 | String por repositório | Gerada pelo sistema com base no PICOS | ✅ |
| F1.4.2 | Operadores booleanos definidos | AND / OR / NOT / proximidade | ✅ |
| F1.4.3 | Vocabulários controlados definidos | MeSH / DeCS / Emtree / Nenhum | ✅ |
| F1.4.4 | Aprovação do pesquisador | Data e confirmação explícita | ✅ |
| F1.4.5 | Versão da string | Número de versão para controle de alterações | ✅ |

## F2 — PROTOCOLO DE BUSCA


## F2.1 — Metadados de Cada Fonte


## F2.1.1 — Identificação da Fonte

| Subitem | Campo | Descrição | Obrigatório |
| F2.1.1.1 | Nome da fonte | Nome completo e sigla | ✅ |
| F2.1.1.2 | Tipo de fonte | Base bibliográfica / Registro / Repositório institucional / Literatura cinzenta / Outro | ✅ |
| F2.1.1.3 | URL base | Endereço de acesso | ✅ |
| F2.1.1.4 | Camada na estratégia | Camada 1 / 2 / 3 / 4 / 5 | ✅ |
| F2.1.1.5 | Interface utilizada | Web / API / OAI-PMH + versão se disponível | ✅ |
| F2.1.1.6 | Campos pesquisados | Título / Resumo / Assunto / Texto completo / Todos | ✅ |
| F2.1.1.7 | Limitações de acesso | Requer login / Acesso restrito / Livre | ✅ |

## F2.1.2 — Execução da Busca

| Subitem | Campo | Descrição | Obrigatório |
| F2.1.2.1 | Data e hora da busca | ISO8601 completo | ✅ |
| F2.1.2.2 | Abrangência cronológica aplicada | Datas de início e fim do filtro | ✅ |
| F2.1.2.3 | Restrição de idioma aplicada | Idiomas filtrados na fonte | ✅ |
| F2.1.2.4 | String exata executada | Copiar literalmente — sem parafrasear | ✅ |
| F2.1.2.5 | Vocabulários controlados usados | MeSH / DeCS / Emtree / Outros / Nenhum | ✅ |
| F2.1.2.6 | Termos livres usados | Lista de todos termos não controlados | ✅ |
| F2.1.2.7 | Filtros adicionais aplicados | Tipo de doc / Idioma / Período / Revisado por pares | ✅ |
| F2.1.2.8 | Iterações de busca | Se houve mais de uma rodada — enumerar todas | ✅ |
| F2.1.2.9 | Notas de limitações | Timeout / Truncamento / Bloqueio / Resultado parcial | ✅ |

## F2.1.3 — Resultados da Fonte

| Subitem | Campo | Descrição | Obrigatório |
| F2.1.3.1 | Total de resultados brutos | Número exato antes de qualquer filtro manual | ✅ |
| F2.1.3.2 | Formato de exportação | RIS / BibTeX / CSV / JSON / XML | ✅ |
| F2.1.3.3 | Identificador do arquivo exportado | Nome ou hash para rastreamento | ✅ |
| F2.1.3.4 | Registros não recuperados | Artigos identificados mas não obtidos + motivo | ✅ |

## F2.2 — Outros Recursos de Busca

| Subitem | Campo | Descrição | Obrigatório |
| F2.2.1 | Literatura cinzenta — fontes | Nome das fontes consultadas | ✅ |
| F2.2.2 | Literatura cinzenta — strings | Strings usadas por fonte | ✅ |
| F2.2.3 | Literatura cinzenta — resultados | Número de registros por fonte | ✅ |
| F2.2.4 | Rastreamento de citações | De quais estudos / ferramenta usada | ⚠️ se aplicável |
| F2.2.5 | Busca manual em periódicos | Quais periódicos / volumes consultados | ⚠️ se aplicável |
| F2.2.6 | Especialistas contatados | Nome, instituição, data, resposta | ⚠️ se aplicável |
| F2.2.7 | Listas de referências verificadas | De quais estudos incluídos | ⚠️ se aplicável |

## F3 — DEDUPLICAÇÃO


## F3.1 — Relatório de Deduplicação

| Subitem | Campo | Descrição | Obrigatório |
| F3.1.1 | Método de deduplicação | Algoritmo do sistema / Critérios aplicados | ✅ |
| F3.1.2 | Critério nível 1 | DOI idêntico | ✅ |
| F3.1.3 | Critério nível 2 | Título normalizado idêntico | ✅ |
| F3.1.4 | Critério nível 3 | Título normalizado + ano + primeiro autor | ✅ |
| F3.1.5 | Critério nível 4 | Similaridade de título ≥ 90% + mesmo ano | ✅ |
| F3.1.6 | Total antes da deduplicação | Soma de todos os brutos por fonte | ✅ |
| F3.1.7 | Total de duplicatas removidas | Por critério aplicado | ✅ |
| F3.1.8 | Total após deduplicação | Encaminhado para triagem | ✅ |
| F3.1.9 | Registro de cada par | ID mantido + ID removido + critério + fontes | ✅ |
| F3.1.10 | Conflitos para decisão manual | Casos não resolvidos automaticamente | ✅ |

## F4 — TRIAGEM


## F4.1 — Triagem de Título e Resumo

| Subitem | Campo | Descrição | Obrigatório |
| F4.1.1 | Total de registros triados | Após deduplicação | ✅ |
| F4.1.2 | Processo de triagem | Individual / Duplo / Com desempate | ✅ |
| F4.1.3 | Ferramenta utilizada | Sistema / Software / Planilha | ✅ |
| F4.1.4 | Total excluído com motivo | Por motivo padronizado — tabela de frequências | ✅ |
| F4.1.5 | Kappa ou índice de concordância | Se triagem dupla | ⚠️ se dupla |

## F4.2 — Triagem de Texto Completo

| Subitem | Campo | Descrição | Obrigatório |
| F4.2.1 | Total recuperado para leitura | Após triagem TA | ✅ |
| F4.2.2 | Total não recuperado | Com motivo por registro | ✅ |
| F4.2.3 | Total avaliado em texto completo |  | ✅ |
| F4.2.4 | Total excluído com motivo | Tabela por motivo padronizado | ✅ |
| F4.2.5 | Total final incluído |  | ✅ |

## F4.3 — Motivos de Exclusão Padronizados

| Código | Motivo | Critério de origem |

## F5 — EXTRAÇÃO DE DADOS


## F5.1 — Processo de Extração

| Subitem | Campo | Descrição | Obrigatório |
| F5.1.1 | Formulário pilotado | Testado antes do uso? Sim/Não + data | ✅ |
| F5.1.2 | Número de revisores | Individual / Duplo | ✅ |
| F5.1.3 | Resolução de conflitos | Como discordâncias foram resolvidas | ✅ |
| F5.1.4 | Software utilizado | Nome e versão | ✅ |

## F5.2 — Campos de Extração por Estudo


## F5.2.1 — Identificação

| Subitem | Campo | Descrição | Obrigatório |
| F5.2.1.1 | ID do estudo | Gerado pelo sistema (ex: S001) | ✅ |
| F5.2.1.2 | Referência completa | Autores, ano, título, periódico/instituição, DOI/URL | ✅ |
| F5.2.1.3 | Fonte / repositório de origem | Nome do repositório onde foi encontrado | ✅ |
| F5.2.1.4 | Tipo de documento | Artigo / Tese / Dissertação | ✅ |
| F5.2.1.5 | País do estudo |  | ✅ |
| F5.2.1.6 | Idioma |  | ✅ |
| F5.2.1.7 | Período de execução | Distinto do período de publicação | ✅ |

## F5.2.2 — Características Metodológicas

| Subitem | Campo | Descrição | Obrigatório |
| F5.2.2.1 | Delineamento do estudo |  | ✅ |
| F5.2.2.2 | Amostra (n) |  | ✅ |
| F5.2.2.3 | Instrumento / método de medida |  | ✅ |

## F5.2.3 — Elementos PICOS do Estudo

| Subitem | Campo | Descrição | Obrigatório |
| F5.2.3.1 | Descrição da população/problema | Conforme P do PICOS | ✅ |
| F5.2.3.2 | Descrição da intervenção | Conforme I do PICOS | ✅ |
| F5.2.3.3 | Descrição do comparador | Conforme C ou N/A | ✅ |
| F5.2.3.4 | Desfecho primário reportado | Com valores e unidades | ✅ |
| F5.2.3.5 | Desfechos secundários reportados | Com valores e unidades | ✅ |

## F5.2.4 — Resultados e Conclusões

| Subitem | Campo | Descrição | Obrigatório |
| F5.2.4.1 | Resultado principal | Síntese em uma frase | ✅ |
| F5.2.4.2 | Conclusão dos autores | Literal ou parafrasada | ✅ |
| F5.2.4.3 | Limitações relatadas pelos autores |  | ✅ |

## F5.2.5 — Informações Administrativas

| Subitem | Campo | Descrição | Obrigatório |
| F5.2.5.1 | Financiamento do estudo |  | ✅ |
| F5.2.5.2 | Conflito de interesses declarado |  | ✅ |
| F5.2.5.3 | Disponibilidade de dados | Abertos / Sob solicitação / Não disponível | ✅ |
| F5.2.5.4 | Notas do revisor | Observações não capturadas acima | ⚠️ se necessário |

## F6 — AVALIAÇÃO DE QUALIDADE / RISCO DE VIÉS


## F6.1 — Definição do Processo

| Subitem | Campo | Descrição | Obrigatório |
| F6.1.1 | Ferramenta utilizada | RoB2 / ROBINS-I / Newcastle-Ottawa / JBI / Outro / N/A | ✅ |
| F6.1.2 | Justificativa se N/A | Por que não foi feita avaliação | ✅ se N/A |
| F6.1.3 | Domínios avaliados | Lista dos domínios da ferramenta escolhida | ✅ |
| F6.1.4 | Número de revisores | Individual / Duplo | ✅ |
| F6.1.5 | Resolução de discordâncias | Como conflitos foram resolvidos | ✅ |

## F6.2 — Por Estudo Incluído

| Subitem | Campo | Descrição | Obrigatório |
| F6.2.1 | Julgamento por domínio | Baixo / Moderado / Alto / Incerto | ✅ |
| F6.2.2 | Julgamento global | Por estudo | ✅ |
| F6.2.3 | Justificativa por julgamento | Evidência que sustenta a decisão | ✅ |

## F7 — SÍNTESE


## F7.1 — Métodos de Síntese

| Subitem | Campo | Descrição | Obrigatório |
| F7.1.1 | Tipo de síntese | Quantitativa / Qualitativa / Narrativa / Mista | ✅ |
| F7.1.2 | Critério para síntese quantitativa | Quando estudos são elegíveis para meta-análise | ✅ se quantitativa |
| F7.1.3 | Medida de efeito utilizada | RR / OR / MD / SMD / Outro / N/A | ✅ |
| F7.1.4 | Justificativa se N/A | Por que não há medida de efeito | ✅ se N/A |
| F7.1.5 | Método de pooling | Modelo fixo / aleatório / N/A | ✅ se meta-análise |
| F7.1.6 | Avaliação de heterogeneidade | I² / Q de Cochran / N/A | ✅ se meta-análise |
| F7.1.7 | Análises de sensibilidade | Planejadas? Quais? | ⚠️ se aplicável |
| F7.1.8 | Análises de subgrupo | Planejadas? Quais? | ⚠️ se aplicável |

## F7.2 — Viés de Relato

| Subitem | Campo | Descrição | Obrigatório |
| F7.2.1 | Método de avaliação | Funil / Egger / Trim and fill / N/A | ✅ |
| F7.2.2 | Justificativa se N/A |  | ✅ se N/A |
| F7.2.3 | Resultado da avaliação | Por desfecho sintetizado | ✅ |

## F7.3 — Certeza da Evidência

| Subitem | Campo | Descrição | Obrigatório |
| F7.3.1 | Sistema utilizado | GRADE / CERQual / N/A + justificativa | ✅ |
| F7.3.2 | Domínios avaliados | Lista dos domínios do sistema | ✅ |
| F7.3.3 | Nível de certeza por desfecho | Alta / Moderada / Baixa / Muito baixa | ✅ |
| F7.3.4 | Justificativa por nível | Fatores que elevaram ou rebaixaram a certeza | ✅ |

## F8 — RESULTADOS E MANUSCRITO


## F8.1 — Fluxograma PRISMA

| Subitem | Variável | Fonte do número |
| F8.1.1 | identified_db | Soma dos brutos por fonte (bases de dados) |
| F8.1.2 | identified_other | Soma de outras fontes (cinzenta, especialistas) |
| F8.1.3 | duplicates_removed | Calculado em F3 |
| F8.1.4 | screened | F8.1.1 + F8.1.2 − F8.1.3 |
| F8.1.5 | title_abstract_excluded | Calculado em F4.1 |
| F8.1.6 | retrieved_fulltext | F8.1.4 − F8.1.5 |
| F8.1.7 | fulltext_not_retrieved | Registrado em F4.2.2 |
| F8.1.8 | fulltext_assessed | F8.1.6 − F8.1.7 |
| F8.1.9 | fulltext_excluded | Calculado em F4.2 com tabela de motivos |
| F8.1.10 | included | F8.1.8 − F8.1.9 |

## F8.2 — Tabela de Características dos Estudos

| Subitem | Coluna | Fonte |
| F8.2.1 | study_id | Gerado pelo sistema |
| F8.2.2 | referencia_completa | F5.2.1.2 |
| F8.2.3 | ano | F5.2.1.2 |
| F8.2.4 | tipo_documento | F5.2.1.4 |
| F8.2.5 | fonte_repositorio | F5.2.1.3 |
| F8.2.6 | url_item | F5.2.1.2 |
| F8.2.7 | idioma | F5.2.1.6 |
| F8.2.8 | pais_contexto | F5.2.1.5 |
| F8.2.9 | delineamento | F5.2.2.1 |
| F8.2.10 | nota_resumo_escopo | F5.2.4.1 |

## F8.3 — Seções do Manuscrito

| Subitem | Seção |
| F8.3.1 | Título |
| F8.3.2 | Resumo estruturado |
| F8.3.3 | Introdução — Justificativa |
| F8.3.4 | Introdução — Objetivos |
| F8.3.5 | Métodos — Critérios de elegibilidade |
| F8.3.6 | Métodos — Fontes de informação |
| F8.3.7 | Métodos — Estratégia de busca |
| F8.3.8 | Métodos — Seleção de estudos |
| F8.3.9 | Métodos — Coleta de dados |
| F8.3.10 | Métodos — Itens dos dados |
| F8.3.11 | Métodos — Risco de viés |
| F8.3.12 | Métodos — Medidas de efeito |
| F8.3.13 | Métodos — Síntese |
| F8.3.14 | Métodos — Certeza da evidência |
| F8.3.15 | Métodos — Registro e protocolo |
| F8.3.16 | Resultados — Seleção |
| F8.3.17 | Resultados — Características |
| F8.3.18 | Resultados — Risco de viés |
| F8.3.19 | Resultados — Individuais |
| F8.3.20 | Resultados — Sínteses |
| F8.3.21 | Resultados — Viés de relato |
| F8.3.22 | Resultados — Certeza |
| F8.3.23 | Discussão |
| F8.3.24 | Financiamento |
| F8.3.25 | Conflito de interesses |
| F8.3.26 | Disponibilidade de dados |
| F8.3.27 | Informações adicionais |

## F8.4 — Disponibilidade de Dados

| Subitem | Campo | Descrição | Obrigatório |
| F8.4.1 | Dados da revisão disponíveis | Onde estão / Como acessar | ✅ |
| F8.4.2 | Código analítico disponível | Script / software — se meta-análise | ⚠️ se aplicável |
| F8.4.3 | Materiais suplementares | Lista de suplementos gerados | ✅ |

## SUPLEMENTOS OBRIGATÓRIOS

| Subitem | Arquivo | Conteúdo |
| SUP.1 | prisma_checklist_filled.md | 27 itens PRISMA 2020 com status e evidência |
| SUP.2 | prisma_s_checklist_filled.md | 16 itens PRISMA-S com status e evidência |
| SUP.3 | supplement_search_prisma_s.md | Strings + interfaces + filtros + datas + contagens |
| SUP.4 | supplement_sources_registry.md | Todas as fontes com URLs e evidências |
| SUP.5 | dedupe_report.md | Regras + contagens + pares + conflitos |
| SUP.6 | screening_report.md | Processo + contagens + motivos + não recuperados |
| SUP.7 | study_characteristics_table.csv | Tabela mínima de estudos incluídos |
| SUP.8 | prisma_flow_counts.md | Números calculados pelo sistema |
| SUP.9 | manuscript_prisma_revised.md | Manuscrito completo revisado |
| SUP.10 | change_log.md | O que foi alterado, seção a seção, com versão |
| SUP.11 | audit_summary.md | 5 riscos + 5 correções + 5 TBDs |

## REGRAS ANTI-VIÉS DO SISTEMA

| Código | Regra | Fase |
