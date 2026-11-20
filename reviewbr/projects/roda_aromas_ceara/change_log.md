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

## emenda-1 — PROPOSTA em 2026-11-20 (registrada pela tool `record_protocol_amendment`)
**O quê.** Entra no protocolo travado o plano de busca (plano_busca.json), escrito a partir das tabelas "Fontes de Busca" e "Estratégia de Busca (Sintaxe)" do protocol.md v1.0: as 11 fontes, a tool e o id do catálogo de cada uma, os textos exatos, nenhum filtro e o que o protocolo manda registrar em cada busca. Aprovado, o plano é congelado com a rota de hoje de cada fonte; cinco delas (SciELO, Embrapa — Alice, Embrapa — Infoteca-e, UFC e UECE) têm hoje rota diferente da que o protocolo descreve. A UFPI, sem id no protocolo, entra com BR-FED-0014 (Repositório Institucional da UFPI). Não entra nem sai fonte; não mudam strings, critérios nem controles positivos.

**Antes.** Protocolo travado em 15/11/2026 sem plano de busca congelado. Na tabela "Fontes de Busca", SciELO por search_scielo na base SciELO; Alice (BR-RES-0001), Infoteca-e (BR-RES-0004), UFC (BR-FED-0004) e UECE (BR-EST-0006) por search_repository na busca do próprio site; UFPI por search_repository, sem id.

**Depois.** Plano de busca congelado (11 fontes). SciELO: search_scielo, que busca no OpenAlex com o filtro doi_starts_with:10.1590 (SciELO Brasil); o total relatado é o do OpenAlex com esse filtro. Alice, Infoteca-e, UFC e UECE: search_repository, que as alcança pela Oasisbr (IBICT), API do VuFind, filtrada pela rede de cada uma (EMBR, EMBRAPA-9, UFC-7, UECE-0); o total relatado é o da Oasisbr. UFPI: BR-FED-0014, DSpace REST. Registrar em todas: período de cobertura e controle positivo; nas feitas à mão (Scopus, Web of Science, FSTA), também plataforma, data, filtros e total. Consequências no texto do protocolo: a prova de que "os humanos não refazem as buscas" passa a ser repetir a busca onde foi vista (Oasisbr com o filtro da rede, ou OpenAlex com o prefixo 10.1590); limite novo declarado (o que a fonte tem e a plataforma não agrega não é encontrado; no SciELO, também o registro sem DOI ou com outro prefixo); a pendência 2 (conserto de F7 e F8) se resolve por esta troca de caminho, não por conserto na fonte.
**Por quê.** O projeto foi travado antes de 20/11/2026, quando a trava passou a congelar o plano de busca; sem plano, nenhuma busca roda (linha 17 da FILA). As cinco rotas mudaram em 19/11/2026 sem emenda: o robots.txt da busca do SciELO proíbe robôs; Alice, Infoteca-e e UECE recusam acesso automatizado (HTTP 403) e o robots.txt delas proíbe a busca; o robots.txt da UFC proíbe a página de busca (.claude/maintenance/CONFERENCIA_acesso_2026-11-19.md). Regra aplicada: decisão do Vicente de 19/11/2026 (FILA, linha 14), fonte que o ReviewBR não alcança diretamente é alcançada pela plataforma de ciência aberta que a agrega, declarando onde se viu; origem: "sem busca a mao para o que deve ser automatizado. (…) bastando declarar o que foi visto e onde se conseguiu". Substitui a emenda 1 escrita à mão no change_log.md em 20/11/2026.

**Plano de busca da emenda** (é o que a busca vai seguir, se aprovada):
- Scopus (scopus): à mão, import_dataset_ris; textos `TITLE-ABS-KEY ( cajuína OR cajuina )`
- Web of Science (wos): à mão, import_dataset_ris; textos `TS=(cajuína OR cajuina)`
- FSTA (fsta): à mão, import_dataset_ris; textos `TI ( cajuína OR cajuina ) OR AB ( cajuína OR cajuina ) OR SU ( cajuína OR cajuina )` · `TS=(cajuína OR cajuina)`
- SciELO (scielo): por tool, search_scielo; textos `cajuína OR cajuina`
- BDTD (IBICT) (bdtd): por tool, search_repository BR-AGG-0001; textos `cajuína` · `cajuina`
- Embrapa — Alice (alice): por tool, search_repository BR-RES-0001; textos `cajuína` · `cajuina`
- Embrapa — Infoteca-e (infoteca): por tool, search_repository BR-RES-0004; textos `cajuína` · `cajuina`
- Repositório da UFC (ufc): por tool, search_repository BR-FED-0004; textos `cajuína` · `cajuina`
- Repositório da UECE (uece): por tool, search_repository BR-EST-0006; textos `cajuína` · `cajuina`
- Repositório da UFPI (ufpi): por tool, search_repository BR-FED-0014; textos `cajuína` · `cajuina`
- OpenAlex (openalex): por tool, search_openalex; textos `cajuína OR cajuina`
**Aprovação:** — (só com a decisão do pesquisador, nas palavras dele)

### emenda-1 — APROVADA em 2026-11-20

Decisão do pesquisador: ""sobre emenda1 ok e espero que nao seja necessarias novas, apenas se impossivel continuar sem emendas" (Vicente, 20/11/2026, depois de ver o plano de busca com a rota de hoje de cada fonte e a explicação do que a emenda 1 muda)". Versão do protocolo: 1.0 → 1.1. O plano de busca da emenda foi congelado, com as rotas de hoje.

## desvio-1 — registrado em 2026-11-20 por agente (tool `record_protocol_amendment`)

**O quê.** Na busca à mão de 19/11/2026 na Scopus, no Web of Science e na FSTA (fontes do plano scopus, wos, fsta), o período que cada base cobre não foi lido nem anotado, como pede o protocolo em "Fontes de Busca". Foi anotado o que se viu: em todas as buscas foram marcadas todas as datas (sem recorte, como o protocolo decide), e os registros recuperados vão de 2003 a 2026 nas três bases (Scopus 23, Web of Science 17, FSTA 14; anos por base em logs/anos_dos_registros_CAPES_2026-11-20.md, lidos em 20/11/2026). O relato declara isso no lugar do período de cobertura da base.

**Por quê.** A busca foi feita antes de existir o roteiro da busca à mão (linha 17 da FILA) e o item não estava na anotação da busca. Para o pesquisador, a disponibilidade de cada plataforma é dela; basta declarar o que foi visto.

**Decisão do pesquisador:** ""em todas as buscas foi marcado todas as datas. se voce ve problema as plataformas escolhem datas isso nao precisaria ser perguntado. apenas anotado. as plataformas nao disponibilizam todos os artigos por essa e aquela razao que a plataforma deve ter disponivel. declarar o que foi visto me parece o suficiente." (Vicente, 20/11/2026, ao decidir o desvio 1)"
