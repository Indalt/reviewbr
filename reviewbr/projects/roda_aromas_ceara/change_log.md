# Emendas e desvios do protocolo — roda_aromas_ceara

O `protocol.md` v1.0, travado em 15/11/2026, não se edita. Pela RV-01, o que muda nele entra aqui como **emenda**,
com a aprovação do Vicente. O que a execução fez diferente do protocolo entra como **desvio**, e o relato declara os
dois.

## Emenda 1 — PROPOSTA em 20/11/2026, aguarda aprovação do Vicente

**O quê.** Muda o caminho de busca de cinco fontes da tabela "Fontes de Busca". Não entra nem sai nenhuma fonte, e
não mudam as strings, os critérios nem os controles positivos.

| Fonte | Protocolo v1.0 | Com a emenda |
|---|---|---|
| SciELO | `search_scielo`, na base SciELO | `search_scielo`, que busca no OpenAlex os registros com prefixo de DOI 10.1590 (SciELO Brasil). O total relatado é o do OpenAlex com esse filtro, não o da base SciELO |
| Embrapa — Alice | `search_repository` (`BR-RES-0001`), na busca do site | `search_repository`, que alcança a fonte pela Oasisbr (IBICT), filtrada pela rede da fonte. O total relatado é o da Oasisbr |
| Embrapa — Infoteca-e | `search_repository` (`BR-RES-0004`), na busca do site | idem |
| Repositório da UFC | `search_repository` (`BR-FED-0004`), na busca do site | idem |
| Repositório da UECE | `search_repository` (`BR-EST-0006`), na busca do site | idem |

**Por quê.** Lido em 19/11/2026 (`.claude/maintenance/CONFERENCIA_acesso_2026-11-19.md`):
- o `robots.txt` da busca do SciELO proíbe robôs;
- Alice, Infoteca-e e UECE recusam o acesso automatizado (HTTP 403), e o `robots.txt` delas proíbe a busca;
- o `robots.txt` da UFC proíbe a página de busca.

A regra que se aplica é a decisão do Vicente de 19/11/2026 (FILA, linha 14). A fonte que o ReviewBR não alcança
diretamente é alcançada pela plataforma de ciência aberta que a agrega, sempre declarando onde se viu. Origem: "sem
busca a mao para o que deve ser automatizado. (…) bastando declarar o que foi visto e onde se conseguiu".

**O que muda no protocolo com a emenda:**
1. **"Como se busca"**, na tabela de fontes: passa a ser o caminho acima para as cinco fontes.
2. **Prova de que "os humanos não refazem as buscas"**, em "Processo de Seleção". Hoje a prova é que qualquer pessoa
   pode repetir a busca no site da fonte e comparar. Para essas cinco fontes, a busca se repete onde foi vista: na
   Oasisbr, com o filtro da rede, ou no OpenAlex, com o prefixo 10.1590.
3. **Limite declarado novo.** O que a fonte tem e a plataforma não agrega não é encontrado. No SciELO, também não é
   encontrado o registro sem DOI ou com outro prefixo.
4. **Pendência 2 do protocolo** ("conserto das falhas F7 e F8 antes da F2"). Ela se resolve por esta emenda: as
   falhas não foram consertadas na fonte, mas trocadas pelos caminhos acima.

**Aprovação:** —

## Desvio 1 — período de cobertura das bases da CAPES (registrado em 20/11/2026)

O protocolo diz, em "Fontes de Busca": "O período que cada fonte cobre é lido na própria fonte no dia da busca e
fica no registro". Na busca de 19/11/2026 da Scopus, do Web of Science e da FSTA, esse período não foi lido nem
anotado (`01_raw/manual/ANOTACOES_busca_manual.md`). Falta a decisão do Vicente entre duas opções:
- (a) ler o período agora, com o registro dizendo a data da leitura;
- (b) declarar no relato que o período não foi anotado.

**Decisão:** —
