# Protocolo — roda_aromas_ceara

**Status**: [DRAFT] <!-- muda para [LOCKED] só na aprovação (submit_protocol_for_approval); a trava é o project_state.json -->

> Versão 0.2, de 15/11/2026. Substitui a 0.1 (12/11/2026) depois das decisões do pesquisador de 15/11/2026,
> gravadas em `REGISTRO.md` (seção "Decisões") e em `DESENHO_artigo1.md`. **DECIDIDO** = decisão do pesquisador,
> com a data. **PROPOSTA** = sugestão do assistente, que só vale com a aprovação dele na trava. `[TBD]` = sem
> resposta do pesquisador (RV-03). A busca (F2) só começa depois da trava e, por decisão do pesquisador
> (12/11/2026), depois do conserto das falhas F7 e F8 do ReviewBR.

**Tipo de pesquisa:** Revisão de Escopo
**Método:** `scoping-prisma-scr` (estende `prisma-sr`) — padrões declarados: PRISMA-ScR 2018 (22 itens) + PRISMA-S 2021 (16 itens). O PRISMA 2020 não é padrão deste método.
**Fonte oficial do PRISMA-ScR:** https://www.equator-network.org/wp-content/uploads/2018/09/PRISMA-ScR-Fillable-Checklist.pdf · **PRISMA-S:** https://osf.io/y765x/
**Nível de controle:** estrito (DECIDIDO, 12/11/2026; gravado no `project_state.json`)
**Data do protocolo:** 2026-11-15

> **Por que cada bloco é pedido.** Os itens citados são os que o mapeamento do método
> (`.claude/methodologies/scoping-prisma-scr/conformance/prisma-scr.json` e `prisma-s.json`) aponta para os
> subitens do bloco. Item que o mapeamento declara **parcialmente não coberto** é dito como tal. Campo que não
> vem de norma é dito como "campo da trilha".

---

# F0 — Pré-registro

## F0.1 Identidade do projeto

*Por que:* F0.1.1 e F0.1.3 → PRISMA-ScR item 1 (*Title*). F0.1.5 → item 5 (*Protocol and registration*). F0.1.8 é
apontado pelo item 22 (*Funding*), parcialmente não coberto. F0.1.4, F0.1.6, F0.1.7 e F0.1.9 são campos da trilha.

- **Título completo da revisão** [F0.1.1]: "Rodas de aroma e descritores sensoriais da cajuína: revisão de escopo" (DECIDIDO, 15/11/2026)
- **Título abreviado / slug** [F0.1.2]: `roda_aromas_ceara`
- **Tipo de revisão** [F0.1.3]: Revisão de Escopo (Scoping Review), PRISMA-ScR, framework PCC (DECIDIDO, 12/11/2026)
- **Data de início do protocolo** [F0.1.4]: 2026-11-12
- **Versão do protocolo** [F0.1.5]: 0.2 (rascunho; passa a 1.0 na trava)
- **Autores da revisão** [F0.1.6]: Vicente [sobrenome: TBD]; estagiário [nome: TBD]; demais coautores [TBD]. Por decisão do pesquisador (15/11/2026), os nomes ficam em branco agora e são preenchidos depois; não se sabe se haverá ORCID.
- **Instituição responsável** [F0.1.7]: [TBD] (em branco por decisão do pesquisador, 15/11/2026)
- **Financiamento** [F0.1.8]: [TBD] (em branco por decisão do pesquisador, 15/11/2026; inclui o papel do financiador, que o item 22 pede)
- **Conflito de interesses** [F0.1.9]: [TBD] (em branco por decisão do pesquisador, 15/11/2026)

## F0.2 Registro do protocolo (opcional em escopo)

*Por que:* F0.2.1–F0.2.5 → PRISMA-ScR item 5. O registro é opcional em escopo; declarar é obrigatório.

- **Status** [F0.2.5]: Não registrado.
- **Plataforma de registro** [F0.2.1]: não se aplica — não registrado.
- **Número / URL / data do registro** [F0.2.2/F0.2.3/F0.2.4]: não se aplica — não registrado.
- **Motivo:** decisão do pesquisador (12/11/2026): o registro (OSF) é opcional em revisão de escopo.
- **Onde o protocolo pode ser acessado:** PROPOSTA — como material suplementar do preprint e do artigo.

## Justificativa

**F0.3.1 Justificativa da revisão.** *Por que:* F0.3.1–F0.3.4 são apontados pelo PRISMA-ScR item 3 (*Rationale*),
parcialmente não coberto: a trilha não pede por que a pergunta se presta a uma revisão de **escopo**. O parágrafo
"Por que escopo" preenche essa parte. O auditor do protocolo exige as quatro seções (Justificativa, Revisões
Anteriores, Lacuna, Relevância).

PROPOSTA de redação. A cajuína é uma bebida tradicional não alcoólica feita do pedúnculo do caju, produzida no
Ceará, no Piauí e em outros estados do Nordeste. A roda de aromas é um instrumento técnico que organiza os
descritores de aroma e sabor de uma categoria de bebida. O pesquisador quer saber se existe roda de aromas,
léxico ou conjunto de descritores publicado para a cajuína.

Motivação (DECIDIDO, 15/11/2026: a busca exploratória fica registrada como parcial e como motivação desta
revisão). Uma busca exploratória de 12/11/2026 (`exploratoria/01_o_que_existe.md`; sem protocolo, só títulos e
palavras-chave, 43 execuções) não trouxe nenhuma roda de aromas, léxico sensorial, perfil descritivo de aroma nem
estudo de voláteis da cajuína. Essa busca tem limites declarados: os repositórios do Ceará só foram alcançados
através da BDTD, o SciELO não pôde ser usado e nenhum resumo foi lido. Ela não sustenta a afirmação de ausência.
É o que esta revisão faz, com busca registrada e reprodutível. **Não encontrar é um resultado** (DECIDIDO,
15/11/2026).

**Por que escopo (2ª parte do item 3).** PROPOSTA. A pergunta é de mapeamento (o que existe, onde, com que
métodos), não de efeito. A evidência esperada é escassa e heterogênea (análise sensorial, química de voláteis,
teses, documentos técnicos). O objetivo inclui identificar uma lacuna.

## Revisões Anteriores

**F0.3.2.** O pesquisador não conhece revisão anterior sobre o aroma ou o sabor da cajuína. A busca exploratória
não procurou revisões e não vale como "nenhuma encontrada". As revisões que existirem serão identificadas na
própria busca da F2, que traz tudo o que usa o termo "cajuína".

## Lacuna

**F0.3.3.** PROPOSTA de redação. Não se sabe, de forma sistemática, se existe roda de aromas, léxico ou perfil
descritivo publicado para a cajuína (do Ceará, do Piauí ou de outro estado produtor), que descritores de aroma e
sabor e que compostos voláteis já foram relatados para ela, nem com que métodos.

## Relevância

**F0.3.4 Objetivo do mapeamento** (neste método o F0.3.4 é o objetivo do mapeamento; a seção conserva o nome
"Relevância" porque é o que o auditor do protocolo lê). PROPOSTA de redação. Mapear as rodas de aroma, os léxicos,
os descritores de aroma e sabor e os compostos voláteis relatados para a cajuína, e os métodos usados, com o
Ceará destacado, para estabelecer o estado da arte dos estudos sensoriais da cajuína e dizer se há base publicada
para uma roda de aromas. Interessados: pesquisa sensorial de alimentos regionais, produtores de cajuína e
iniciativas de valorização do produto.

---

# F1 — Protocolo da questão (PCC)

## Objetivo

### F1.1 Questão de pesquisa

*Por que:* F1.1.1–F1.1.3 → PRISMA-ScR item 4 (*Objectives*).

- **Questão principal** [F1.1.1]: "Que rodas de aroma, léxicos ou descritores de aroma e sabor já foram publicados para a cajuína, e com que métodos foram obtidos?" (DECIDIDO, 15/11/2026). Âmbito geral, com o Ceará destacado.
- **Questões secundárias** [F1.1.2] (DECIDIDO, 15/11/2026):
  1. De que estados e instituições vêm as fontes (Ceará, Piauí, outros)?
  2. Com que métodos os descritores foram obtidos (painel treinado, consumidores, análise instrumental)?
  3. Alguma fonte liga descritores sensoriais a compostos de aroma?
- **Framework utilizado** [F1.1.3]: PCC (População/Problema — Conceito — Contexto), framework do método.

### F1.2 PCC completo

*Por que:* os termos de busca são apontados pelo PRISMA-ScR item 8 (*Search*). Neste método o Contexto não tem
subitem em F1.2; a tabela é a do template do método.

| Elemento | Definição | Termos |
|---|---|---|
| P — Produto | **Só a cajuína** (DECIDIDO, 15/11/2026). O produto é identificado pelo termo: a fonte tem de usar a palavra "cajuína". O suco de caju clarificado sem cozimento e sem o uso do termo cajuína fica fora já na busca (DECIDIDO, 15/11/2026). | `cajuína`, `cajuina`. É o único bloco da string. |
| C — Conceito | A fonte trata expressamente de aroma ou sabor da cajuína: roda de aromas, léxico, perfil descritivo, descritores; ou compostos voláteis (DECIDIDO, 15/11/2026: os estudos de voláteis entram "para identificar o estado da arte em relacao a estudos sensoriais da cajuina"). | Não entram na string. São as palavras da primeira camada da triagem (ver "Processo de Seleção"). |
| C — Contexto | Qualquer estado ou país; o Ceará é destacado na análise; registra-se o que houver do Piauí e de outros estados produtores (DECIDIDO, 12/11/2026). | Sem termos na string. O estado e a instituição são campos da extração. |

## Critérios de Elegibilidade

*Por que:* F1.3.1.x e F1.3.2.x são apontados pelo PRISMA-ScR item 6 (*Eligibility criteria*), parcialmente não
coberto (o item pede a justificativa dos critérios; por isso cada um traz a sua). F1.3.2.5 → PRISMA-S S16.

### Critérios de Inclusão

- **Produto** [F1.3.1.1]: fontes que estudam a cajuína e a chamam por esse nome (DECIDIDO, 15/11/2026). Justificativa: a revisão parte do produto ligado ao seu termo.
- **Conceito** [F1.3.1.2]: a fonte trata expressamente de aroma ou sabor da cajuína — roda, léxico, perfil descritivo, descritores sensoriais — ou relata compostos voláteis da cajuína (DECIDIDO, 15/11/2026). Justificativa: é o objeto da pergunta; os voláteis mostram o estado da arte em torno dos estudos sensoriais.
- **Contexto** [F1.3.1.3]: qualquer estado ou país (DECIDIDO, 12/11/2026). Justificativa: o âmbito é geral; o Ceará é destacado na análise, não no filtro.
- **Tipo de documento** [F1.3.1.4]: artigos, teses, dissertações, documentos técnicos, capítulos de livro, trabalhos e resumos em anais de congresso. Os resumos de congresso entram como literatura cinzenta (DECIDIDO, 15/11/2026). Revisões de literatura que tratem do aroma ou do sabor da cajuína entram como fonte (PROPOSTA). Justificativa: numa revisão que pode concluir pela ausência, restringe-se pelo conteúdo, não pelo tipo de documento.
- **Período** [F1.3.1.5]: sem limite; vale tudo o que cada fonte tiver até a data da busca, que fica registrada (DECIDIDO, 12/11/2026).
- **Idiomas** [F1.3.1.6]: português, inglês e espanhol (DECIDIDO, 12/11/2026). Justificativa (PROPOSTA): são as línguas de leitura da equipe e as da produção sobre o caju.
- **Acesso ao texto completo** [F1.3.1.7]: PROPOSTA — texto completo obtido, porque a extração dos descritores exige o texto.

### Critérios de Exclusão

- **Escopo** [F1.3.2.1]:
  - qualquer outro produto do caju: suco, néctar, polpa, fermentados, vinho, pedúnculo in natura, castanha (DECIDIDO, 15/11/2026);
  - produtos em que a cajuína ou o caju é ingrediente de outro produto: cerveja, kombucha, néctar misto (DECIDIDO, 15/11/2026);
  - coprodutos do processamento: fibra, essências, *water phase* (DECIDIDO, 15/11/2026);
  - produtos que usam o nome "cajuína" sem ser a bebida do pedúnculo de caju, como refrigerantes: ficam fora, **contados e anotados** como uso do termo, para a discussão (DECIDIDO, 15/11/2026);
  - fontes sobre a cajuína que não tratam de aroma nem de sabor (processo, físico-química, mercado, história) ou que relatam só aceitação e preferência, sem nenhum descritor (PROPOSTA).
- **Tipo de documento** [F1.3.2.2]: patentes, notícias, páginas web e blogs, material de divulgação.
- **Período** [F1.3.2.3]: não se aplica (sem limite de período).
- **Idioma** [F1.3.2.4]: idiomas que não português, inglês ou espanhol.
- **Duplicatas** [F1.3.2.5]: PROPOSTA — o mesmo registro vindo de várias fontes é removido na F3 (`deduplicate_dataset`), com relatório. Relatos diferentes do mesmo estudo (tese e artigo dela derivado) não são duplicatas: ficam ligados a um estudo, e a extração é feita uma vez por estudo.
- **Texto completo indisponível** [F1.3.2.6]: PROPOSTA — excluído depois das tentativas de recuperação por acesso aberto (`retrieve_fulltexts`) e pelo acesso do pesquisador ao Portal CAPES. Sem contato com autores e sem uso do Sci-Hub.
- **Qualidade mínima** [F1.3.2.7]: não se aplica. A condição `avaliacao_critica` foi respondida "não" pelo pesquisador (12/11/2026; gravada no `project_state.json`): não há avaliação crítica das fontes, e os itens 12 e 16 do PRISMA-ScR saem do denominador.
- **EX-03 ("desfecho não reportado")**: não se aplica neste método.

## Fontes de Busca

*Por que:* PRISMA-ScR item 7 (*Information sources*) e PRISMA-S S1 (*Database name*). As fontes foram escolhidas
por relevância para a pergunta (DECIDIDO, 15/11/2026: "fontes por relevancia ganha, pode retirar a baixas"). Cada
uma traz o motivo. O período que cada fonte cobre é lido na própria fonte no dia da busca e fica no registro.

| Fonte | Por que é relevante | Como se busca | Estado em 15/11/2026 |
|---|---|---|---|
| Scopus | artigos de ciência de alimentos | à mão, pelo pesquisador, no Portal CAPES; exporta RIS; `import_dataset_ris` | sem bloqueio |
| Web of Science (Core Collection) | idem | idem | sem bloqueio |
| FSTA | base própria da ciência de alimentos | idem; a plataforma (EBSCOhost, Web of Science ou outra) é anotada no dia | sem bloqueio |
| SciELO | revistas brasileiras | `search_scielo` | **falha F8**; a F2 espera o conserto |
| BDTD (IBICT) | teses e dissertações | `search_repository` (`BR-AGG-0001`) | funciona. O catálogo do ReviewBR chama essa fonte de "Oasisbr"; os registros de 12/11 têm endereço `bdtd.ibict.br`. O nome a relatar é conferido na execução |
| Embrapa — Alice | principal grupo de pesquisa do caju; artigos e documentos técnicos | `search_repository` (`BR-RES-0001`) | **falha F7**; a F2 espera o conserto |
| Embrapa — Infoteca-e | documentos técnicos | `search_repository` (`BR-RES-0004`) | inativa no catálogo do ReviewBR; depende da manutenção |
| Repositório da UFC | Ceará | `search_repository` (`BR-FED-0004`) | **falha F7**; a F2 espera o conserto |
| Repositório da UECE | Ceará | `search_repository` (`BR-EST-0006`) | **falha F7**; a F2 espera o conserto |
| Repositório da UFPI | Piauí, estado produtor | `search_repository` | devolveu registros sem relação em 12/11 (falha F5); depende da manutenção |
| OpenAlex | cobertura ampla; pega o que escapa das outras | `search_openalex` | funciona |

Ficam fora, por baixa relevância para a pergunta (DECIDIDO, 15/11/2026): PubMed, Europe PMC, CORE, Semantic
Scholar e Crossref.

Para cada busca feita à mão, o pesquisador anota a base, a plataforma, a data, o texto exato, os filtros e o
total (PRISMA-S S1, S8, S9, S13, S15).

### Outros métodos

PROPOSTA — conferência das listas de referências das fontes incluídas, registrada como "outros métodos" no
fluxograma (PRISMA-S S5). Sem contato com autores e sem consulta a sites.

## Estratégia de Busca (Sintaxe)

*Por que:* F1.4.1–F1.4.3 → PRISMA-ScR item 8 (*Search*). As strings derivam do F1.2 (RV-07).

**Versão 0.2, de 15/11/2026. Nada aqui foi executado.** A busca é só pelo produto, e as palavras de aroma e sabor
formam a primeira camada da triagem (DECIDIDO, 15/11/2026). Os critérios de busca são determinísticos: o mesmo
texto, na mesma fonte, na mesma data.

- **Operadores booleanos** [F1.4.2]: só OR, entre as duas grafias. Sem AND e sem NOT.
- **Vocabulários controlados** [F1.4.3]: nenhum; a busca é pelo termo.
- **Limites** (PRISMA-S S9): nenhum limite de data, idioma ou tipo de documento. Idioma e tipo são aplicados na triagem.
- **Versão da string** [F1.4.5]: 0.2.
- **Aprovação do pesquisador** [F1.4.4]: [TBD — dada na trava].
- **Total recuperado:** cada execução tem de recuperar todos os registros que a fonte informa; se não recuperar, o total informado e o número recuperado ficam no registro (S15).

| Fonte | Texto exato |
|---|---|
| OpenAlex, SciELO | `cajuína OR cajuina` |
| BDTD, Alice, Infoteca-e, UFC, UECE, UFPI | duas consultas simples: `cajuína` e `cajuina` |
| Scopus | `TITLE-ABS-KEY ( cajuína OR cajuina )` |
| Web of Science | `TS=(cajuína OR cajuina)` |
| FSTA (EBSCOhost) | `TI ( cajuína OR cajuina ) OR AB ( cajuína OR cajuina ) OR SU ( cajuína OR cajuina )`; se a plataforma for Web of Science, a string do Web of Science |

**Controle positivo de cada fonte** (zero resultado só vale com controle): a busca tem de devolver mais que zero;
onde couber, tem de trazer um registro que se sabe existir. Vistos em 12/11/2026: na BDTD, as dissertações
`riufc/78207` (fermentado de cajuína) e `riufc/67712` (kombucha com cajuína); no OpenAlex, "Cajuína: como produzir
com qualidade" (Abreu e Souza, 2004).

**Limite declarado.** Uma fonte que estude a bebida sem usar a palavra "cajuína" no texto que a base indexa não é
encontrada. É consequência da definição do produto pelo termo.

## Processo de Seleção

*Por que:* F4.1.2, F4.1.3 e F4.1.5 → PRISMA-ScR item 9 (*Selection of sources of evidence*). O auditor do
protocolo exige os três rótulos abaixo.

Trilha do método `scoping-prisma-scr`:

1. **F0 — Pré-registro** (`designer`)
2. **F1 — Protocolo da questão (PCC)** (`designer`)
3. **F2 — Busca (PRISMA-S)** (`librarian`) — só depois da trava **e** do conserto de F7 e F8
4. **F3 — Deduplicação** (`screener`)
5. **F4 — Triagem por título e resumo, depois por texto completo** (`screener`)
6. **F5 — Extração / charting** (`extractor`)
7. **F5_5 — Leitura orientada a objetivo** (`reader`)
8. ~~F6 — Risco de viés~~ — não se aplica a este método
9. **F7 — Síntese** descritiva, sem meta-análise (`analyst`)
10. **F8 — Resultados e manuscrito** (`analyst`)

**Declaração do processo de triagem:**
   - **F4.1.2 Processo de triagem:** Duplo — dois revisores humanos, o pesquisador e um estagiário, que entra como coautor (DECIDIDO, 15/11/2026). Em duas camadas:
     1. **Camada mecânica, por palavras** (ReviewBR). Depois da deduplicação, passam os registros cujo título, resumo ou palavras-chave trazem ao menos um destes termos: `aroma*`, `sabor*`, `gosto`, `flavor`, `flavour`, `taste`, `sensor*`, `descritor*`, `descriptor*`, `léxico`, `lexicon`, `roda`, `wheel`, `volát*`, `volatil*`, `odor*`, `olor`, `olfat*`, `olfact*`, `perfil`, `profile`. **Registro sem resumo não é excluído por falta de palavra: passa para a leitura humana.** Os humanos não redecidem o que esta camada excluiu, e não há conferência por amostra (DECIDIDO, 15/11/2026).
     2. **Camada humana.** Os dois revisores leem e decidem, cada um sem ver a decisão do outro, todos os registros que passaram: primeiro pelo título e resumo, depois pelo texto completo.
   - Os humanos **não refazem as buscas** (DECIDIDO, 15/11/2026). Condição do pesquisador: provar que o ReviewBR usa exatamente o que um humano usaria. Prova (PROPOSTA): o registro de cada busca guarda o texto exato, a fonte, a data e o total, de modo que qualquer pessoa pode repetir a busca no site da fonte e comparar; e cada fonte tem o seu controle positivo.
   - **F4.1.3 Ferramenta utilizada:** ReviewBR para a parte mecânica — busca, importação, deduplicação (`deduplicate_dataset`), camada por palavras (`batch_keyword_screen`), contagem do funil e registro das decisões. O artigo declara que a parte mecânica da condução foi feita com o ReviewBR (DECIDIDO, 15/11/2026). A leitura dos dois revisores é feita fora do ReviewBR, numa ferramenta de triagem às cegas (PROPOSTA: Rayyan); as decisões voltam ao projeto e ficam gravadas com o nome de quem decidiu. Proposta de inclusão feita por IA, se for usada, é apoio: não decide e fica registrada como tal.
   - **Resolução de discordâncias:** conversa entre os dois revisores até o consenso; o resultado e o motivo ficam registrados. Sem consenso, decide o pesquisador.
   - Fase 1: Triagem por título e resumo
   - Fase 2: Leitura de texto completo
   - Saturação e lista final de incluídos: decisão do pesquisador (RV-04).

**Extração (charting), F5.** *Por que:* PRISMA-ScR itens 10 e 11, parcialmente não cobertos (faltam as dimensões
próprias do escopo); por isso ficam listadas aqui. A extração é a descrição de cada fonte incluída (DECIDIDO,
15/11/2026). Campos (PROPOSTA): referência e tipo de documento; estado e instituição; origem da cajuína estudada;
termo que a fonte usa para o produto; método (painel treinado, consumidores, instrumental); descritores de aroma
e sabor, com as palavras da fonte; compostos voláteis relatados; se organiza os descritores em roda ou léxico; se
liga descritor a composto; onde a fonte está (base, repositório, endereço). A IA propõe a extração; os revisores
conferem (RV-04). Cada dado com origem (RV-08).

**Síntese, F7.** Descritiva: quantas fontes, de que estados e instituições, com que métodos; quadro dos
descritores e dos compostos relatados; o que não foi encontrado, com os controles. Sem meta-análise. Na discussão
cabem comentários sobre o debate científico em torno do aroma e do sabor da cajuína (DECIDIDO, 15/11/2026); a
literatura de fora do recorte só aparece aí, citada como contexto, nunca como resultado.

## Registro de Protocolo

**Registro:** não registrado — decisão do pesquisador (12/11/2026); o registro é opcional em revisão de escopo (PRISMA-ScR item 5 pede declarar se há protocolo e se foi registrado).

## Auditoria PRISMA

Checklist PRISMA-ScR 2018 (22 itens; itens 12 e 16 fora do denominador pela condição `avaliacao_critica` = "não")
+ PRISMA-S 2021 (16 itens), preenchidos ao final do estudo.

## Pendências antes da trava

1. Autoria, instituição, financiamento e conflito de interesses: em branco por decisão do pesquisador.
2. Leitura do pesquisador e aprovação do que está marcado PROPOSTA: onde o protocolo será acessado; redação da justificativa, da lacuna e do objetivo; revisões como fonte; justificativa do idioma; texto completo, duplicatas e fontes sobre cajuína sem aroma; conferência das referências; prova da equivalência das buscas; Rayyan; campos da extração.
3. A decisão do pesquisador sobre a F1, com as palavras dele (`record_researcher_decision`), e a trava (`submit_protocol_for_approval`).
