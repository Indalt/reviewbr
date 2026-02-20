# Especificação Completa da Trilha de Pesquisa

PRISMA 2020 + PRISMA-S + PRISMA-ScR — Mapa Total de Coleta

**Versão**: 1.0
**Uso**: Documento de referência para o sistema PRISMA Research Tool e orquestração do MCP
**Princípio**: Nenhum campo é preenchido com valor inventado. Campos sem dado recebem [TBD] e são sinalizados para resolução humana.
**Notação**: Itens PRISMA 2020 = números (ex: Item 1). Itens PRISMA-S = prefixo S (ex: S1). Subitens da trilha = notação decimal (ex: F0.1, F1.2.3).

## F0 — PRÉ-REGISTRO

Executado antes de qualquer busca. Protocolo deve ser fechado e registrado antes de avançar para F1.

### F0.1 — Identidade do Projeto

| Subitem | Campo | Descrição | Obrigatório | Item PRISMA |
|---|---|---|---|---|
| F0.1.1 | Título completo da revisão | Deve identificar como revisão sistemática ou scoping review | ✅ | Item 1 |
| F0.1.2 | Título abreviado / slug | Gerado automaticamente pelo sistema | ✅ | — |
| F0.1.3 | Tipo de revisão | Sistemática / Scoping / Meta-análise / Mista | ✅ | Item 1 |
| F0.1.4 | Data de início do protocolo | YYYY-MM-DD | ✅ | Item 15 |
| F0.1.5 | Versão do protocolo | Ex: v1.0 | ✅ | Item 15 |
| F0.1.6 | Autores da revisão | Nome completo, instituição, ORCID | ✅ | Item 24 |
| F0.1.7 | Instituição responsável | Nome completo + sigla | ✅ | Item 24 |
| F0.1.8 | Financiamento | Agência, número do edital ou "sem financiamento" | ✅ | Item 24 |
| F0.1.9 | Conflito de interesses | Declaração explícita de cada autor | ✅ | Item 25 |

### F0.2 — Registro do Protocolo

| Subitem | Campo | Descrição | Obrigatório | Item PRISMA |
|---|---|---|---|---|
| F0.2.1 | Plataforma de registro | PROSPERO / OSF / INPLASY / Research Registry | ✅ | Item 15 |
| F0.2.2 | Número de registro | CRD... / osf.io/... / INPLASY... | ✅ | Item 15 |
| F0.2.3 | URL do registro | Link público do protocolo registrado | ✅ | Item 15 |
| F0.2.4 | Data do registro | Deve ser anterior ao início da busca | ✅ | Item 15 |
| F0.2.5 | Status | Registrado / Em processo / Não aplicável + justificativa | ✅ | Item 15 |

### F0.3 — Justificativa e Contexto

| Subitem | Campo | Descrição | Obrigatório | Item PRISMA |
|---|---|---|---|---|
| F0.3.1 | Justificativa da revisão | Por que esta revisão é necessária agora | ✅ | Item 3 |
| F0.3.2 | Revisões anteriores sobre o tema | Citar e explicar por que nova revisão é necessária | ✅ | Item 3 |
| F0.3.3 | Lacuna identificada na literatura | O que ainda não foi respondido | ✅ | Item 3 |
| F0.3.4 | Relevância para política ou prática | Impacto esperado dos resultados | ✅ | Item 3 |

## F1 — PROTOCOLO DA QUESTÃO DE PESQUISA

Fechado após F0. Nenhum critério pode ser alterado após início da busca sem emenda registrada.

### F1.1 — Questão de Pesquisa

| Subitem | Campo | Descrição | Obrigatório | Item PRISMA |
|---|---|---|---|---|
| F1.1.1 | Questão principal | Formulada de forma clara e verificável | ✅ | Item 4 |
| F1.1.2 | Questões secundárias | Se houver — listar todas | ⚠️ se houver | Item 4 |
| F1.1.3 | Framework utilizado | PICOS / PECO / SPIDER / PCC | ✅ | Item 4 |

### F1.2 — PICOS Completo

| Subitem | Elemento | Campo | Descrição | Obrigatório | Item PRISMA |
|---|---|---|---|---|---|
| F1.2.1 | P | População/Problema | Definição precisa da população ou problema | ✅ | Item 5 |
| F1.2.2 | P | Termos de busca — P | MeSH + DeCS + termos livres pt/en/es | ✅ | Item 7 / S12 |
| F1.2.3 | I | Intervenção/Exposição | O que foi feito, aplicado ou estudado | ✅ | Item 5 |
| F1.2.4 | I | Termos de busca — I | MeSH + DeCS + termos livres pt/en/es | ✅ | Item 7 / S12 |
| F1.2.5 | C | Comparador | Grupo controle, comparação ou "N/A + justificativa" | ✅ | Item 5 |
| F1.2.6 | C | Termos de busca — C | Se aplicável | ⚠️ se aplicável | Item 7 / S12 |
| F1.2.7 | O | Outcomes/Desfechos | Listar TODOS os desfechos primários e secundários | ✅ | Item 5 |
| F1.2.8 | O | Termos de busca — O | Se incluídos na string | ⚠️ se aplicável | Item 7 / S12 |
| F1.2.9 | S | Tipo de Estudo | Delineamentos elegíveis | ✅ | Item 5 |
| F1.2.10| S | Termos de busca — S | Filtros de tipo de estudo | ⚠️ se aplicável | Item 7 / S12 |

### F1.3 — Critérios de Elegibilidade Completos

#### F1.3.1 — Critérios de Inclusão

| Subitem | Campo | Descrição | Obrigatório | Item PRISMA |
|---|---|---|---|---|
| F1.3.1.1 | Matéria-prima / População | Definição exata do que será incluído | ✅ | Item 5 |
| F1.3.1.2 | Intervenção / Objeto | Tipos de intervenção ou objeto de estudo aceitos | ✅ | Item 5 |
| F1.3.1.3 | Desfechos mínimos | Ao menos um desfecho que o estudo deve reportar | ✅ | Item 5 |
| F1.3.1.4 | Tipo de documento | Artigo / Tese / Dissertação / etc. | ✅ | Item 5 |
| F1.3.1.5 | Período de publicação | Ano inicial e ano final | ✅ | Item 5 / S10 |
| F1.3.1.6 | Idiomas aceitos | pt / en / es / outros + justificativa | ✅ | Item 5 / S11 |
| F1.3.1.7 | Acesso ao texto completo | Texto completo disponível | ✅ | Item 5 |

#### F1.3.2 — Critérios de Exclusão

| Subitem | Campo | Descrição | Obrigatório | Item PRISMA |
|---|---|---|---|---|
| F1.3.2.1 | Escopo | O que está fora do escopo por definição | ✅ | Item 5 |
| F1.3.2.2 | Tipo de documento | O que não será aceito | ✅ | Item 5 |
| F1.3.2.3 | Período | Publicações fora do recorte | ✅ | Item 5 |
| F1.3.2.4 | Idioma | Idiomas não aceitos | ✅ | Item 5 / S11 |
| F1.3.2.5 | Duplicatas | Critério de identificação e resolução | ✅ | Item 5 / S15 |
| F1.3.2.6 | Texto completo indisponível | Após tentativas de recuperação | ✅ | Item 5 / S16 |
| F1.3.2.7 | Qualidade mínima | Se aplicável — ferramenta ou critério usado | ⚠️ se aplicável | Item 11 |

### F1.4 — Geração das Strings de Busca

O sistema gera as strings a partir do F1.2. O pesquisador revisa e aprova antes de enviar ao MCP.

| Subitem | Campo | Descrição | Obrigatório | Item PRISMA-S |
|---|---|---|---|---|
| F1.4.1 | String por repositório | Gerada pelo sistema com base no PICOS | ✅ | S12 |
| F1.4.2 | Operadores booleanos definidos | AND / OR / NOT / proximidade | ✅ | S12 |
| F1.4.3 | Vocabulários controlados definidos | MeSH / DeCS / Emtree / Nenhum | ✅ | S13 |
| F1.4.4 | Aprovação do pesquisador | Data e confirmação explícita | ✅ | S12 |
| F1.4.5 | Versão da string | Número de versão para controle de alterações | ✅ | S12 |

## F2 — PROTOCOLO DE BUSCA

Executado pelo MCP sob orquestração do sistema. Uma entrada por fonte/repositório.

### F2.1 — Metadados de Cada Fonte

#### F2.1.1 — Identificação da Fonte

| Subitem | Campo | Descrição | Obrigatório | Item PRISMA-S |
|---|---|---|---|---|
| F2.1.1.1 | Nome da fonte | Nome completo e sigla | ✅ | S1 / S2 |
| F2.1.1.2 | Tipo de fonte | Base bibliográfica / Registro / Repositório institucional / Literatura cinzenta / Outro | ✅ | S1 / S2 / S3 / S4 |
| F2.1.1.3 | URL base | Endereço de acesso | ✅ | S1 |
| F2.1.1.4 | Camada na estratégia | Camada 1 / 2 / 3 / 4 / 5 | ✅ | S1 |
| F2.1.1.5 | Interface utilizada | Web / API / OAI-PMH + versão se disponível | ✅ | S7 |
| F2.1.1.6 | Campos pesquisados | Título / Resumo / Assunto / Texto completo / Todos | ✅ | S7 |
| F2.1.1.7 | Limitações de acesso | Requer login / Acesso restrito / Livre | ✅ | S8 |

#### F2.1.2 — Execução da Busca

| Subitem | Campo | Descrição | Obrigatório | Item PRISMA-S |
|---|---|---|---|---|
| F2.1.2.1 | Data e hora da busca | ISO8601 completo | ✅ | S9 |
| F2.1.2.2 | Abrangência cronológica aplicada | Datas de início e fim do filtro | ✅ | S10 |
| F2.1.2.3 | Restrição de idioma aplicada | Idiomas filtrados na fonte | ✅ | S11 |
| F2.1.2.4 | String exata executada | Copiar literalmente — sem parafrasear | ✅ | S12 |
| F2.1.2.5 | Vocabulários controlados usados | MeSH / DeCS / Emtree / Outros / Nenhum | ✅ | S13 |
| F2.1.2.6 | Termos livres usados | Lista de todos termos não controlados | ✅ | S12 |
| F2.1.2.7 | Filtros adicionais aplicados | Tipo de doc / Idioma / Período / Revisado por pares | ✅ | S14 |
| F2.1.2.8 | Iterações de busca | Se houve mais de uma rodada — enumerar todas | ✅ | S12 |
| F2.1.2.9 | Notas de limitações | Timeout / Truncamento / Bloqueio / Resultado parcial | ✅ | S8 |

#### F2.1.3 — Resultados da Fonte

| Subitem | Campo | Descrição | Obrigatório | Item PRISMA-S / PRISMA |
|---|---|---|---|---|
| F2.1.3.1 | Total de resultados brutos | Número exato antes de qualquer filtro manual | ✅ | S12 / Item 16 |
| F2.1.3.2 | Formato de exportação | RIS / BibTeX / CSV / JSON / XML | ✅ | S12 |
| F2.1.3.3 | Identificador do arquivo exportado | Nome ou hash para rastreamento | ✅ | S12 |
| F2.1.3.4 | Registros não recuperados | Artigos identificados mas não obtidos + motivo | ✅ | S16 |

### F2.2 — Outros Recursos de Busca

| Subitem | Campo | Descrição | Obrigatório | Item PRISMA-S |
|---|---|---|---|---|
| F2.2.1 | Literatura cinzenta — fontes | Nome das fontes consultadas | ✅ | S3 |
| F2.2.2 | Literatura cinzenta — strings | Strings usadas por fonte | ✅ | S3 |
| F2.2.3 | Literatura cinzenta — resultados | Número de registros por fonte | ✅ | S3 |
| F2.2.4 | Rastreamento de citações | De quais estudos / ferramenta usada | ⚠️ se aplicável | S4 |
| F2.2.5 | Busca manual em periódicos | Quais periódicos / volumes consultados | ⚠️ se aplicável | S4 |
| F2.2.6 | Especialistas contatados | Nome, instituição, data, resposta | ⚠️ se aplicável | S5 |
| F2.2.7 | Listas de referências verificadas | De quais estudos incluídos | ⚠️ se aplicável | S6 |

## F3 — DEDUPLICAÇÃO

Executada pelo sistema sobre os dados brutos entregues pelo MCP.

### F3.1 — Relatório de Deduplicação

| Subitem | Campo | Descrição | Obrigatório | Item PRISMA-S |
|---|---|---|---|---|
| F3.1.1 | Método de deduplicação | Algoritmo do sistema / Critérios aplicados | ✅ | S15 |
| F3.1.2 | Critério nível 1 | DOI idêntico | ✅ | S15 |
| F3.1.3 | Critério nível 2 | Título normalizado idêntico | ✅ | S15 |
| F3.1.4 | Critério nível 3 | Título normalizado + ano + primeiro autor | ✅ | S15 |
| F3.1.5 | Critério nível 4 | Similaridade de título ≥ 90% + mesmo ano | ✅ | S15 |
| F3.1.6 | Total antes da deduplicação | Soma de todos os brutos por fonte | ✅ | S15 / Item 16 |
| F3.1.7 | Total de duplicatas removidas | Por critério aplicado | ✅ | S15 / Item 16 |
| F3.1.8 | Total após deduplicação | Encaminhado para triagem | ✅ | S15 / Item 16 |
| F3.1.9 | Registro de cada par | ID mantido + ID removido + critério + fontes | ✅ | S15 |
| F3.1.10 | Conflitos para decisão manual | Casos não resolvidos automaticamente | ✅ | S15 |

## F4 — TRIAGEM

Todas as decisões registradas com agente (Sistema / IA / Pesquisador) e timestamp.

### F4.1 — Triagem de Título e Resumo

| Subitem | Campo | Descrição | Obrigatório | Item PRISMA |
|---|---|---|---|---|
| F4.1.1 | Total de registros triados | Após deduplicação | ✅ | Item 16 |
| F4.1.2 | Processo de triagem | Individual / Duplo / Com desempate | ✅ | Item 8 |
| F4.1.3 | Ferramenta utilizada | Sistema / Software / Planilha | ✅ | Item 8 |
| F4.1.4 | Total excluído com motivo | Por motivo padronizado — tabela de frequências | ✅ | Item 16 |
| F4.1.5 | Kappa ou índice de concordância | Se triagem dupla | ⚠️ se dupla | Item 8 |

### F4.2 — Triagem de Texto Completo

| Subitem | Campo | Descrição | Obrigatório | Item PRISMA |
|---|---|---|---|---|
| F4.2.1 | Total recuperado para leitura | Após triagem TA | ✅ | Item 16 |
| F4.2.2 | Total não recuperado | Com motivo por registro | ✅ | Item 16 / S16 |
| F4.2.3 | Total avaliado em texto completo | | ✅ | Item 16 |
| F4.2.4 | Total excluído com motivo | Tabela por motivo padronizado | ✅ | Item 16 |
| F4.2.5 | Total final incluído | | ✅ | Item 16 |

### F4.3 — Motivos de Exclusão Padronizados

Os mesmos motivos são aplicados nas fases F4.1 e F4.2. Derivados diretamente dos critérios F1.3.

| Código | Motivo | Critério de origem |
|---|---|---|
| EX-01 | Fora do escopo — P | F1.3.2.1 |
| EX-02 | Intervenção não elegível — I | F1.3.1.2 |
| EX-03 | Desfecho não reportado — O | F1.3.1.3 |
| EX-04 | Tipo de estudo inelegível — S | F1.3.1.4 |
| EX-05 | Tipo de documento inelegível | F1.3.2.2 |
| EX-06 | Período fora do recorte | F1.3.2.3 |
| EX-07 | Idioma não elegível | F1.3.2.4 |
| EX-08 | Texto completo indisponível | F1.3.2.6 |
| EX-09 | Duplicata não capturada | F1.3.2.5 |
| EX-10 | Qualidade metodológica insuficiente | F1.3.2.7 |
| EX-11 | Outro | Descrição obrigatória |

## F5 — EXTRAÇÃO DE DADOS

Um formulário por estudo incluído. Pilotado antes do uso.

### F5.1 — Processo de Extração

| Subitem | Campo | Descrição | Obrigatório | Item PRISMA |
|---|---|---|---|---|
| F5.1.1 | Formulário pilotado | Testado antes do uso? Sim/Não + data | ✅ | Item 9 |
| F5.1.2 | Número de revisores | Individual / Duplo | ✅ | Item 9 |
| F5.1.3 | Resolução de conflitos | Como discordâncias foram resolvidas | ✅ | Item 9 |
| F5.1.4 | Software utilizado | Nome e versão | ✅ | Item 9 |

### F5.2 — Campos de Extração por Estudo

#### F5.2.1 — Identificação

| Subitem | Campo | Descrição | Obrigatório | Item PRISMA |
|---|---|---|---|---|
| F5.2.1.1 | ID do estudo | Gerado pelo sistema (ex: S001) | ✅ | Item 17 |
| F5.2.1.2 | Referência completa | Autores, ano, título, periódico/instituição, DOI/URL | ✅ | Item 17 |
| F5.2.1.3 | Fonte / repositório de origem | Nome do repositório onde foi encontrado | ✅ | Item 17 |
| F5.2.1.4 | Tipo de documento | Artigo / Tese / Dissertação | ✅ | Item 17 |
| F5.2.1.5 | País do estudo | | ✅ | Item 17 |
| F5.2.1.6 | Idioma | | ✅ | Item 17 |
| F5.2.1.7 | Período de execução | Distinto do período de publicação | ✅ | Item 17 |

#### F5.2.2 — Características Metodológicas

| Subitem | Campo | Descrição | Obrigatório | Item PRISMA |
|---|---|---|---|---|
| F5.2.2.1 | Delineamento do estudo | | ✅ | Item 17 |
| F5.2.2.2 | Amostra (n) | | ✅ | Item 17 |
| F5.2.2.3 | Instrumento / método de medida | | ✅ | Item 10 |

#### F5.2.3 — Elementos PICOS do Estudo

| Subitem | Campo | Descrição | Obrigatório | Item PRISMA |
|---|---|---|---|---|
| F5.2.3.1 | Descrição da população/problema | Conforme P do PICOS | ✅ | Item 17 |
| F5.2.3.2 | Descrição da intervenção | Conforme I do PICOS | ✅ | Item 17 |
| F5.2.3.3 | Descrição do comparador | Conforme C ou N/A | ✅ | Item 17 |
| F5.2.3.4 | Desfecho primário reportado | Com valores e unidades | ✅ | Item 19 |
| F5.2.3.5 | Desfechos secundários reportados | Com valores e unidades | ✅ | Item 19 |

#### F5.2.4 — Resultados e Conclusões

| Subitem | Campo | Descrição | Obrigatório | Item PRISMA |
|---|---|---|---|---|
| F5.2.4.1 | Resultado principal | Síntese em uma frase | ✅ | Item 19 |
| F5.2.4.2 | Conclusão dos autores | Literal ou parafrasada | ✅ | Item 19 |
| F5.2.4.3 | Limitações relatadas pelos autores | | ✅ | Item 23 |

#### F5.2.5 — Informações Administrativas

| Subitem | Campo | Descrição | Obrigatório | Item PRISMA |
|---|---|---|---|---|
| F5.2.5.1 | Financiamento do estudo | | ✅ | Item 24 |
| F5.2.5.2 | Conflito de interesses declarado | | ✅ | Item 25 |
| F5.2.5.3 | Disponibilidade de dados | Abertos / Sob solicitação / Não disponível | ✅ | Item 26 |
| F5.2.5.4 | Notas do revisor | Observações não capturadas acima | ⚠️ se necessário | — |

## F6 — AVALIAÇÃO DE QUALIDADE / RISCO DE VIÉS

### F6.1 — Definição do Processo

| Subitem | Campo | Descrição | Obrigatório | Item PRISMA |
|---|---|---|---|---|
| F6.1.1 | Ferramenta utilizada | RoB2 / ROBINS-I / Newcastle-Ottawa / JBI / Outro / N/A | ✅ | Item 11 |
| F6.1.2 | Justificativa se N/A | Por que não foi feita avaliação | ✅ se N/A | Item 11 |
| F6.1.3 | Domínios avaliados | Lista dos domínios da ferramenta escolhida | ✅ | Item 11 |
| F6.1.4 | Número de revisores | Individual / Duplo | ✅ | Item 11 |
| F6.1.5 | Resolução de discordâncias | Como conflitos foram resolvidos | ✅ | Item 11 |

### F6.2 — Por Estudo Incluído

| Subitem | Campo | Descrição | Obrigatório | Item PRISMA |
|---|---|---|---|---|
| F6.2.1 | Julgamento por domínio | Baixo / Moderado / Alto / Incerto | ✅ | Item 18 |
| F6.2.2 | Julgamento global | Por estudo | ✅ | Item 18 |
| F6.2.3 | Justificativa por julgamento | Evidência que sustenta a decisão | ✅ | Item 18 |

## F7 — SÍNTESE

### F7.1 — Métodos de Síntese

| Subitem | Campo | Descrição | Obrigatório | Item PRISMA |
|---|---|---|---|---|
| F7.1.1 | Tipo de síntese | Quantitativa / Qualitativa / Narrativa / Mista | ✅ | Item 13 |
| F7.1.2 | Critério para síntese quantitativa | Quando estudos são elegíveis para meta-análise | ✅ se quantitativa | Item 13 |
| F7.1.3 | Medida de efeito utilizada | RR / OR / MD / SMD / Outro / N/A | ✅ | Item 12 |
| F7.1.4 | Justificativa se N/A | Por que não há medida de efeito | ✅ se N/A | Item 12 |
| F7.1.5 | Método de pooling | Modelo fixo / aleatório / N/A | ✅ se meta-análise | Item 13 |
| F7.1.6 | Avaliação de heterogeneidade| I² / Q de Cochran / N/A | ✅ se meta-análise | Item 13 |
| F7.1.7 | Análises de sensibilidade | Planejadas? Quais? | ⚠️ se aplicável | Item 13 |
| F7.1.8 | Análises de subgrupo | Planejadas? Quais? | ⚠️ se aplicável | Item 13 |

### F7.2 — Viés de Relato

| Subitem | Campo | Descrição | Obrigatório | Item PRISMA |
|---|---|---|---|---|
| F7.2.1 | Método de avaliação | Funil / Egger / Trim and fill / N/A | ✅ | Item 21 |
| F7.2.2 | Justificativa se N/A | | ✅ se N/A | Item 21 |
| F7.2.3 | Resultado da avaliação | Por desfecho sintetizado | ✅ | Item 21 |

### F7.3 — Certeza da Evidência

| Subitem | Campo | Descrição | Obrigatório | Item PRISMA |
|---|---|---|---|---|
| F7.3.1 | Sistema utilizado | GRADE / CERQual / N/A + justificativa | ✅ | Item 14 |
| F7.3.2 | Domínios avaliados | Lista dos domínios do sistema | ✅ | Item 14 |
| F7.3.3 | Nível de certeza por desfecho | Alta / Moderada / Baixa / Muito baixa | ✅ | Item 22 |
| F7.3.4 | Justificativa por nível | Fatores que elevaram ou rebaixaram a certeza | ✅ | Item 22 |

## F8 — RESULTADOS E MANUSCRITO

### F8.1 — Fluxograma PRISMA

Todos os números calculados pelo sistema — nunca importados prontos.

| Subitem | Variável | Fonte do número | Item PRISMA |
|---|---|---|---|
| F8.1.1 | identified_db | Soma dos brutos por fonte (bases de dados) | Item 16 |
| F8.1.2 | identified_other | Soma de outras fontes (cinzenta, especialistas) | Item 16 |
| F8.1.3 | duplicates_removed | Calculado em F3 | Item 16 |
| F8.1.4 | screened | F8.1.1 + F8.1.2 − F8.1.3 | Item 16 |
| F8.1.5 | title_abstract_excluded | Calculado em F4.1 | Item 16 |
| F8.1.6 | retrieved_fulltext | F8.1.4 − F8.1.5 | Item 16 |
| F8.1.7 | fulltext_not_retrieved | Registrado em F4.2.2 | Item 16 / S16 |
| F8.1.8 | fulltext_assessed | F8.1.6 − F8.1.7 | Item 16 |
| F8.1.9 | fulltext_excluded | Calculado em F4.2 com tabela de motivos | Item 16 |
| F8.1.10 | included | F8.1.8 − F8.1.9 | Item 16 |

### F8.2 — Tabela de Características dos Estudos

Colunas obrigatórias do study_characteristics_table.csv

| Subitem | Coluna | Fonte |
|---|---|---|
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

### F8.3 — Seções do Manuscrito

| Subitem | Seção | Itens PRISMA cobertos |
|---|---|---|
| F8.3.1 | Título | Item 1 |
| F8.3.2 | Resumo estruturado | Item 2 |
| F8.3.3 | Introdução — Justificativa | Item 3 |
| F8.3.4 | Introdução — Objetivos | Item 4 |
| F8.3.5 | Métodos — Critérios de elegibilidade | Item 5 |
| F8.3.6 | Métodos — Fontes de informação | Item 6 / S1–S9 |
| F8.3.7 | Métodos — Estratégia de busca | Item 7 / S12–S14 |
| F8.3.8 | Métodos — Seleção de estudos | Item 8 |
| F8.3.9 | Métodos — Coleta de dados | Item 9 |
| F8.3.10 | Métodos — Itens dos dados | Item 10 |
| F8.3.11 | Métodos — Risco de viés | Item 11 |
| F8.3.12 | Métodos — Medidas de efeito | Item 12 |
| F8.3.13 | Métodos — Síntese | Item 13 |
| F8.3.14 | Métodos — Certeza da evidência | Item 14 |
| F8.3.15 | Métodos — Registro e protocolo | Item 15 |
| F8.3.16 | Resultados — Seleção | Item 16 |
| F8.3.17 | Resultados — Características | Item 17 |
| F8.3.18 | Resultados — Risco de viés | Item 18 |
| F8.3.19 | Resultados — Individuais | Item 19 |
| F8.3.20 | Resultados — Sínteses | Item 20 |
| F8.3.21 | Resultados — Viés de relato | Item 21 |
| F8.3.22 | Resultados — Certeza | Item 22 |
| F8.3.23 | Discussão | Item 23 |
| F8.3.24 | Financiamento | Item 24 |
| F8.3.25 | Conflito de interesses | Item 25 |
| F8.3.26 | Disponibilidade de dados | Item 26 |
| F8.3.27 | Informações adicionais | Item 27 |

### F8.4 — Disponibilidade de Dados

| Subitem | Campo | Descrição | Obrigatório | Item PRISMA |
|---|---|---|---|---|
| F8.4.1 | Dados da revisão disponíveis | Onde estão / Como acessar | ✅ | Item 26 |
| F8.4.2 | Código analítico disponível | Script / software — se meta-análise | ⚠️ se aplicável | Item 26 |
| F8.4.3 | Materiais suplementares | Lista de suplementos gerados | ✅ | Item 26 |

## SUPLEMENTOS OBRIGATÓRIOS

| Subitem | Arquivo | Conteúdo | Itens cobertos |
|---|---|---|---|
| SUP.1 | prisma_checklist_filled.md | 27 itens PRISMA 2020 com status e evidência | Todos |
| SUP.2 | prisma_s_checklist_filled.md | 16 itens PRISMA-S com status e evidência | S1–S16 |
| SUP.3 | supplement_search_prisma_s.md | Strings + interfaces + filtros + datas + contagens | S7–S14 |
| SUP.4 | supplement_sources_registry.md | Todas as fontes com URLs e evidências | S1–S4 |
| SUP.5 | dedupe_report.md | Regras + contagens + pares + conflitos | S15 |
| SUP.6 | screening_report.md | Processo + contagens + motivos + não recuperados | Item 16 / S16 |
| SUP.7 | study_characteristics_table.csv | Tabela mínima de estudos incluídos | Item 17 |
| SUP.8 | prisma_flow_counts.md | Números calculados pelo sistema | Item 16 |
| SUP.9 | manuscript_prisma_revised.md | Manuscrito completo revisado | Todos |
| SUP.10 | change_log.md | O que foi alterado, seção a seção, com versão | — |
| SUP.11 | audit_summary.md | 5 riscos + 5 correções + 5 TBDs | — |

## REGRAS ANTI-VIÉS DO SISTEMA

| Código | Regra | Fase |
|---|---|---|
| RV-01 | Protocolo fechado antes da busca — critérios só podem ser alterados via emenda registrada no change_log | F0 / F1 |
| RV-02 | Números emergem do processo — o sistema calcula todos os valores do fluxograma; nenhum é importado pronto | F3 / F4 / F8 |
| RV-03 | Campos ausentes são [TBD] — nunca inventados, estimados ou preenchidos com "N/A" sem justificativa | Todas |
| RV-04 | Toda decisão tem agente registrado — Sistema / IA / Pesquisador + timestamp | F3 / F4 / F5 |
| RV-05 | Inconsistências numéricas bloqueiam exportação — o sistema não gera o manuscrito final enquanto os números do fluxograma não fecharem | F8 |
| RV-06 | MCP é executor, não decisor — entrega dados brutos; todas as decisões são da ferramenta ou do pesquisador | F2 |
| RV-07 | Strings derivam do protocolo — geradas a partir do F1.2 aprovado; o MCP executa exatamente essas strings | F1 / F2 |
| RV-08 | Rastreio estrito de origem — Identificação obrigatória do repositório, instituição, URL de hospedagem e autonomia do estudo em todos os relatórios finais. A omissão bloqueia a síntese. | F2 / F5 / F8 |

*Este documento é a especificação de referência para o PRISMA Research Tool e para o servidor MCP.*
*Versão 1.1 — 2026-02-19*
