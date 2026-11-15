# Protocolo — roda_aromas_ceara

**Status**: [DRAFT] <!-- muda para [LOCKED] só na aprovação (submit_protocol_for_approval); a trava é o project_state.json -->

> Rascunho redigido pelo agente `designer` em 12/11/2026 a partir das decisões do pesquisador gravadas em
> `REGISTRO.md` (seção "Decisões", 12/11/2026). Tudo o que está marcado **PROPOSTA** é sugestão do agente e
> espera a aprovação do pesquisador. `[TBD]` = sem resposta do pesquisador (RV-03). A busca (F2) está
> bloqueada até a trava do protocolo e, por decisão do pesquisador, até o conserto das falhas F7 e F8 do ReviewBR.

**Tipo de pesquisa:** Revisão de Escopo
**Método:** `scoping-prisma-scr` (estende `prisma-sr`) — padrões declarados: PRISMA-ScR 2018 (22 itens) + PRISMA-S 2021 (16 itens). O PRISMA 2020 não é padrão deste método.
**Fonte oficial do PRISMA-ScR:** https://www.equator-network.org/wp-content/uploads/2018/09/PRISMA-ScR-Fillable-Checklist.pdf · **PRISMA-S:** https://osf.io/y765x/
**Nível de controle:** estrito (decisão do pesquisador, 12/11/2026; gravado no `project_state.json`)
**Data do protocolo:** 2026-11-12

> **Por que cada bloco é pedido.** Os itens citados abaixo são os que o mapeamento do método
> (`.claude/methodologies/scoping-prisma-scr/conformance/prisma-scr.json` e `prisma-s.json`) aponta para os
> subitens do bloco; títulos oficiais em `.claude/standards/`. Item que o mapeamento declara **parcialmente
> não coberto** é dito como tal e não é usado como fundamento pleno. Campo que não vem de norma é dito como
> "campo da trilha".

---

# F0 — Pré-registro

## F0.1 Identidade do projeto

*Por que:* F0.1.1 e F0.1.3 → PRISMA-ScR item 1 (*Title*: identificar o relato como revisão de escopo).
F0.1.5 → item 5 (*Protocol and registration*). F0.1.8 é apontado pelo item 22 (*Funding*), que o mapeamento
declara parcialmente não coberto (falta o papel dos financiadores). F0.1.4, F0.1.6, F0.1.7 e F0.1.9 são campos
da trilha, sem item do PRISMA-ScR que os peça.

- **Título completo da revisão** [F0.1.1]: PROPOSTA — "Descritores sensoriais e compostos de aroma da cajuína e de bebidas do pedúnculo de caju: protocolo de revisão de escopo". Aprovação: [TBD]
- **Título abreviado / slug** [F0.1.2]: `roda_aromas_ceara`
- **Tipo de revisão** [F0.1.3]: Revisão de Escopo (Scoping Review), PRISMA-ScR, framework PCC (decisão do pesquisador, 12/11/2026)
- **Data de início do protocolo** [F0.1.4]: 2026-11-12
- **Versão do protocolo** [F0.1.5]: 0.1 (rascunho; passa a 1.0 na trava)
- **Autores da revisão** [F0.1.6]: Vicente e coautores — nomes completos, instituição e ORCID: [TBD]
- **Instituição responsável** [F0.1.7]: [TBD]
- **Financiamento** [F0.1.8]: [TBD] (inclui o papel do financiador na revisão, que o item 22 pede)
- **Conflito de interesses** [F0.1.9]: [TBD] (declaração de cada autor)

## F0.2 Registro do protocolo (opcional em escopo)

*Por que:* F0.2.1–F0.2.5 → PRISMA-ScR item 5 (*Protocol and registration*: dizer se há protocolo, onde se
acessa e, se houver, o registro). A spec do método torna o registro opcional em escopo; declarar é obrigatório.

- **Status** [F0.2.5]: Não registrado.
- **Plataforma de registro** [F0.2.1]: não se aplica — não registrado.
- **Número / URL / data do registro** [F0.2.2/F0.2.3/F0.2.4]: não se aplica — não registrado.
- **Motivo:** decisão do pesquisador (12/11/2026): o registro (OSF) é opcional em revisão de escopo.
- **Onde o protocolo pode ser acessado:** [TBD] (o item 5 pede indicar se e onde o protocolo pode ser lido, ex.: anexo do artigo ou repositório).

## Justificativa

**F0.3.1 Justificativa da revisão.** *Por que:* F0.3.1–F0.3.4 são apontados pelo PRISMA-ScR item 3
(*Rationale*), que o mapeamento declara parcialmente não coberto: a trilha não pede por que a pergunta se presta
a uma revisão de **escopo**. O parágrafo "Por que escopo" abaixo preenche essa parte. O auditor do protocolo
exige as quatro seções (Justificativa, Revisões Anteriores, Lacuna, Relevância).

PROPOSTA (aprovação: [TBD]). A cajuína é uma bebida tradicional não alcoólica do pedúnculo de caju, produzida no
Ceará, no Piauí e em outros estados do Nordeste. O pesquisador prepara um artigo sobre a ausência de roda
sensorial ou de descritores sensoriais da cajuína cearense (meta declarada em `REGISTRO.md`, 12/11/2026). Para
afirmar uma ausência, é preciso antes mapear de forma sistemática e reprodutível o que já foi relatado — os
descritores sensoriais e os compostos de aroma da cajuína e das bebidas do pedúnculo de caju — e com que métodos.

Contexto (busca **exploratória, não exaustiva**, sem protocolo, só títulos e palavras-chave, 43 execuções em
12/11/2026; `exploratoria/01_o_que_existe.md`): para o caju apareceram vários estudos de compostos voláteis e de
aroma (suco, suco concentrado, vinho, fermentados espumantes, pedúnculos de clones); para a cajuína não apareceu
perfil descritivo de aroma nem estudo de voláteis; nenhuma roda de aromas nem léxico sensorial de produto cearense
apareceu. A busca exploratória tem limites declarados (repositórios do Ceará alcançados só via BDTD; SciELO
inutilizável; nenhum resumo lido) e por isso não sustenta a afirmação de ausência — é o que esta revisão faz.

**Por que escopo (2ª parte do item 3).** PROPOSTA. A pergunta é de mapeamento (que descritores, que compostos,
que métodos, onde), não de efeito; a evidência esperada é heterogênea (análise sensorial descritiva, química de
voláteis, literatura cinzenta como teses e documentos técnicos); e o objetivo inclui identificar lacunas. Esses são
os usos de uma revisão de escopo, não de uma revisão sistemática.

## Revisões Anteriores

**F0.3.2.** [TBD] — a busca exploratória não procurou revisões sobre o tema; nenhuma revisão apareceu nas 43
execuções, mas isso não foi alvo e não vale como "nenhuma encontrada". Proposta: verificar revisões existentes
(ex.: sobre voláteis do caju ou sobre produtos do pedúnculo) antes da trava, ou declarar que serão identificadas
na própria busca da F2.

## Lacuna

**F0.3.3.** PROPOSTA (aprovação: [TBD]). Não se sabe, de forma sistemática, que descritores sensoriais e que
compostos de aroma foram relatados para a cajuína em comparação com as demais bebidas do pedúnculo de caju; se
existe roda sensorial, léxico ou perfil descritivo da cajuína (do Ceará, do Piauí ou de outro estado produtor);
e se os estudos ligam descritores sensoriais a compostos.

## Relevância

**F0.3.4 Objetivo do mapeamento** (neste método o F0.3.4 é o objetivo do mapeamento, não "relevância para
política"; a seção conserva o nome "Relevância" porque é o que o auditor do protocolo lê). PROPOSTA (aprovação:
[TBD]). Mapear os descritores sensoriais (aroma e sabor) e os compostos voláteis/odorantes relatados para a
cajuína, as bebidas do pedúnculo de caju e o pedúnculo in natura, e os métodos usados, com o Ceará destacado,
para fundamentar o artigo 1 do pesquisador e identificar se há base publicada para uma roda ou léxico sensorial da
cajuína. Interessados: pesquisa sensorial de alimentos regionais, produtores de cajuína, iniciativas de valorização
e indicação de procedência.

---

# F1 — Protocolo da questão (PCC)

## Objetivo

### F1.1 Questão de pesquisa

*Por que:* F1.1.1–F1.1.3 → PRISMA-ScR item 4 (*Objectives*: questões e objetivos explícitos, com seus elementos-chave).

- **Questão principal** [F1.1.1]: "Que descritores sensoriais e compostos de aroma já foram relatados para a cajuína e para as bebidas do pedúnculo de caju, e com que métodos?" (formulação escolhida pelo pesquisador, 12/11/2026). Âmbito geral, com o Ceará destacado.
- **Questões secundárias** [F1.1.2]: PROPOSTA (no máximo 3; aprovação: [TBD]):
  1. Como os descritores e compostos relatados se distribuem por produto (cajuína; suco, néctar e polpa; fermentados e vinho; pedúnculo in natura) e por tipo de método (sensorial descritivo, instrumental, combinado)?
  2. Há roda sensorial, léxico ou perfil descritivo publicado para a cajuína do Ceará, do Piauí ou de outro estado produtor — e de que estados e instituições vêm os estudos?
  3. Os estudos ligam descritores sensoriais a compostos (ex.: olfatometria, correlação estatística), e para que produtos?
- **Framework utilizado** [F1.1.3]: PCC (População/Problema — Conceito — Contexto), framework do método.

### F1.2 PCC completo

*Por que:* os termos de busca são apontados pelo PRISMA-ScR item 8 (*Search*: estratégia completa de ao menos
uma base, com limites, repetível). Neste método o Contexto não tem subitem em F1.2 (delta da spec); a tabela é a
do template do método.

| Elemento | Definição (decisão do pesquisador, 12/11/2026) | Termos de busca — PROPOSTA (pt / en / es) |
|---|---|---|
| P — Produto | Cajuína; todas as bebidas do pedúnculo de caju (suco, néctar, polpa, fermentados, vinho); pedúnculo de caju in natura. | pt: cajuína, cajuina, caju, cajú, pedúnculo de caju, pseudofruto do caju, suco de caju, néctar de caju, polpa de caju, vinho de caju, fermentado de caju · en: cashew, cashew apple, cashew pseudofruit, cashew peduncle, cashew apple juice, cashew wine · es: marañón, maranon, merey, cajuil, manzana de marañón, jugo de marañón · científico: Anacardium occidentale. **Na string entram só os termos-raiz** (cajuína/cajuina, caju/cajú, cashew, marañón/maranon, merey, cajuil, "Anacardium occidentale"), que já contêm as formas compostas; o recorte por produto é feito pelos critérios de elegibilidade. |
| C — Conceito | Descritores sensoriais (aroma e sabor; léxico, roda, perfil descritivo, ADQ, CATA etc.) **e** compostos voláteis/odorantes. | en: sensory, flavor, flavour, taste, aroma, odor, odour, odorant, volatile, lexicon, flavor wheel, aroma wheel, descriptive analysis, QDA, CATA, check-all-that-apply, olfactometry, GC-O, GC-MS, SPME, headspace · pt: sensorial, sabor, aroma, odor, odorante, volátil, voláteis, léxico, roda de aromas, análise descritiva (quantitativa), ADQ, perfil sensorial, olfatometria · es: sensorial, sabor, olor, volátiles, léxico, rueda de sabores, análisis descriptivo, olfatometría |
| C — Contexto | Qualquer país ou região; o Ceará é destacado na análise (e registra-se roda/léxico da cajuína do Piauí ou de outro estado produtor). | **Sem termos na string** (PROPOSTA): pôr Ceará/Piauí na busca cortaria estudos que não citam o estado no título/resumo. O estado e a instituição de origem entram como campo da extração (charting) e da síntese. |

## Critérios de Elegibilidade

*Por que:* F1.3.1.x e F1.3.2.x são apontados pelo PRISMA-ScR item 6 (*Eligibility criteria*), que o mapeamento
declara parcialmente não coberto (a trilha só pede justificativa para o idioma; o item pede a justificativa dos
critérios). Por isso cada critério abaixo traz a sua. F1.3.2.5 (duplicatas) → PRISMA-S S16 (*Deduplication*).
Os critérios estão marcados PROPOSTA onde vão além do que o pesquisador decidiu.

### Critérios de Inclusão

- **Produto** [F1.3.1.1]: fontes que estudam cajuína, qualquer bebida do pedúnculo de caju (suco, néctar, polpa, fermentados, vinho) ou o pedúnculo de caju in natura (decisão do pesquisador). Justificativa: é o produto da pergunta, ampliado às bebidas do mesmo pedúnculo para dar comparação à cajuína.
- **Conceito** [F1.3.1.2]: a fonte relata ao menos um descritor sensorial de aroma ou sabor (por qualquer método: léxico, roda, perfil descritivo, ADQ, CATA, perfil flash ou outro) **ou** ao menos um composto volátil/odorante identificado no produto (decisão do pesquisador). Justificativa: o Conceito do PCC tem as duas faces, sensorial e química.
- **Contexto** [F1.3.1.3]: qualquer país ou região (decisão do pesquisador). Justificativa: o âmbito é geral; o Ceará é destacado na análise, não no filtro.
- **Tipo de documento** [F1.3.1.4]: artigos, teses, dissertações, trabalhos em anais e documentos técnicos (literatura cinzenta incluída; decisão do pesquisador). Capítulos de livro e resumos simples de congresso: [TBD — decidir se entram].
- **Período** [F1.3.1.5]: sem limite de período (decisão do pesquisador). Justificativa: mapeamento do que existe, sem recorte temporal.
- **Idiomas** [F1.3.1.6]: português, inglês e espanhol (decisão do pesquisador). Justificativa: línguas de leitura da equipe e as de maior produção sobre o caju (Brasil, América Latina, literatura internacional). [TBD — o pesquisador confirma a justificativa]
- **Acesso ao texto completo** [F1.3.1.7]: PROPOSTA — texto completo obtido, porque a extração (charting) dos descritores e compostos exige o texto. Aprovação: [TBD]

### Critérios de Exclusão

- **Escopo** [F1.3.2.1] (PROPOSTA; aprovação: [TBD]):
  - castanha/amêndoa de caju, óleo de amêndoa, LCC (líquido da casca da castanha), folhas, casca, goma ou outras partes do cajueiro que não o pedúnculo;
  - fontes que relatam só aceitação ou preferência (escala hedônica, intenção de compra), sem nenhum descritor sensorial nem composto;
  - fontes que medem só composição não volátil (vitamina C, taninos, açúcares, acidez, carotenoides como pigmento) sem descritor nem composto de aroma;
  - [TBD — decidir] produtos em que o caju é ingrediente de outro produto (ex.: cerveja com pedúnculo, kombucha com cajuína, néctar misto de frutas): entram só se o relato atribui descritores/compostos ao caju? ou ficam de fora?
  - [TBD — decidir] coprodutos do processamento (fibra/bagaço do caju, essências e *water phase* recuperadas na concentração do suco): entram ou não?
- **Tipo de documento** [F1.3.2.2]: patentes, notícias, páginas web e blogs, materiais de divulgação (fora dos tipos decididos). Revisões de literatura: [TBD — decidir se entram como fonte ou só como fonte de referências].
- **Período** [F1.3.2.3]: não se aplica (sem limite de período).
- **Idioma** [F1.3.2.4]: idiomas que não português, inglês ou espanhol.
- **Duplicatas** [F1.3.2.5]: PROPOSTA — o mesmo registro vindo de várias bases é removido na F3 (`deduplicate_dataset`: DOI, autores, similaridade de título), com relatório. Relatos diferentes do mesmo estudo (ex.: tese e artigo dela derivado) não são duplicatas: ficam como relatos ligados a um estudo, e a extração é feita uma vez por estudo. Aprovação: [TBD]
- **Texto completo indisponível** [F1.3.2.6]: PROPOSTA — excluído depois das tentativas de recuperação: acesso aberto (`retrieve_fulltexts`) e acesso do pesquisador pelo Portal CAPES. Contato com autores: [TBD]. Uso do Sci-Hub (`retrieve_fulltext_byos`): só com consentimento explícito do pesquisador para cada DOI — [TBD].
- **Qualidade mínima** [F1.3.2.7]: não se aplica. A condição `avaliacao_critica` foi respondida **"não"** pelo pesquisador (12/11/2026): não há avaliação crítica das fontes, e os itens 12 e 16 do PRISMA-ScR saem do denominador. (A resposta precisa ser gravada no `project_state.json` pelo `record_researcher_decision`, com as palavras do pesquisador — ainda não foi.)
- **EX-03 ("desfecho não reportado")**: não se aplica neste método.

## Fontes de Busca

*Por que:* PRISMA-ScR item 7 (*Information sources*) e PRISMA-S S1 (*Database name*: cada base, com a
plataforma). Fontes = "as que o método pede" (decisão do pesquisador, 12/11/2026). Conferência de conectividade
feita pelo `designer` em 12/11/2026 com `validate_repository` (sem busca de conteúdo).

### Bases abertas, executadas pelo ReviewBR

| Fonte | Tool | Plataforma / API | Estado em 12/11/2026 |
|---|---|---|---|
| OpenAlex | `search_openalex` | API OpenAlex | disponível |
| Crossref | `search_crossref` | API Crossref | disponível |
| CORE | `search_core` | API CORE v3 | disponível |
| Semantic Scholar | `search_semanticscholar` | API Semantic Scholar (*bulk search*) | disponível |
| Europe PMC | `search_europe_pmc` | API Europe PMC | disponível |
| BDTD / Oasisbr | `search_repository` (`BR-AGG-0001`) | IBICT | conectividade e OAI-PMH OK. **Atenção:** o catálogo do ReviewBR chama `BR-AGG-0001` de "IBICT — Oasisbr", e a busca exploratória o tratou como BDTD; qual base é, de fato, precisa ser declarada (S1). [TBD — conferir na manutenção] |
| SciELO | `search_scielo` | SciELO | **quebrada (falha F8)** — a F2 espera o conserto (decisão do pesquisador) |
| Repositório UFC | `search_repository` (`BR-FED-0004`) | repositorio.ufc.br | conectividade OK; OAI-PMH 404. **Quebrada (falha F7)** — a F2 espera o conserto |
| Repositório UECE | `search_repository` (`BR-EST-0006`) | siduece.uece.br | conectividade OK; OAI-PMH 404. **Quebrada (falha F7)** — a F2 espera o conserto |
| Alice / Embrapa | `search_repository` (`BR-RES-0001`) | alice.cnptia.embrapa.br | conectividade e OAI-PMH OK, mas busca devolve zero até para "caju" (**falha F7**) — a F2 espera o conserto |

Fontes possíveis, **não decididas** ([TBD — o pesquisador decide]): Infoteca-e da Embrapa (`BR-RES-0004`,
inativa no catálogo; é onde ficam muitos documentos técnicos da Embrapa); repositório da UFPI (Piauí, estado
produtor de cajuína; a exploratória registrou ruído nele, falha F5); PubMed (o conteúdo MEDLINE já vem pelo Europe PMC).

### Bases do Portal CAPES, executadas à mão pelo pesquisador

Scopus, Web of Science (Core Collection) e FSTA, se disponíveis no Portal CAPES (decisão do pesquisador). O
pesquisador roda as strings aprovadas, exporta em RIS e o ReviewBR importa (`import_dataset_ris`, com
`sourceName` = nome da base). Plataforma do FSTA no Portal CAPES (EBSCOhost, Web of Science ou outra): [TBD].
Para cada execução manual o pesquisador anota data, string exata, filtros e total (PRISMA-S S8, S9, S13, S15).

### Outros métodos

Busca de citações (*snowballing*), contato com autores e especialistas, consulta a sites: [TBD — não decidido].
Se houver, entram como "outros métodos" no fluxograma (S5, S6, S7).

## Estratégia de Busca (Sintaxe)

*Por que:* F1.4.1–F1.4.3 → PRISMA-ScR item 8 (*Search*). As strings derivam do F1.2 (RV-07).

**PROPOSTA — versão 0.1, de 12/11/2026. Aprovação do pesquisador [F1.4.4]: [TBD].** Nada aqui foi executado.

- **Operadores booleanos** [F1.4.2]: AND entre os blocos P e C; OR dentro de cada bloco; **sem NOT** (para não perder sensibilidade: o ruído — castanha, LCC — sai na triagem). Truncamento (`*`) só nas bases que o aceitam (Scopus, Web of Science, FSTA/EBSCO). Frases entre aspas.
- **Vocabulários controlados** [F1.4.3]: nenhum na versão 0.1 — só termos livres. Motivo: o MeSH/DeCS cobre mal o tema; o tesauro do FSTA pode ser acrescentado depois de conferido na própria base [TBD].
- **Limites** (PRISMA-S S9): nenhum limite de data, idioma ou tipo nas strings; idioma e tipo são aplicados na triagem (critérios F1.3).
- **Versão da string** [F1.4.5]: 0.1 (rascunho).
- **Teto de resultados nas tools abertas:** o `maxResults` de cada execução tem de cobrir o total da base, ou o total e o número recuperado ficam registrados (S15). Valor: [TBD — definir com o librarian antes da F2].

**String-base (OpenAlex, CORE, Europe PMC, SciELO).** OpenAlex não aceita truncamento, por isso as variantes estão escritas por extenso:

```
(cajuína OR cajuina OR caju OR cajú OR cashew OR "Anacardium occidentale" OR marañón OR maranon OR merey OR cajuil)
AND
(sensory OR sensorial OR flavor OR flavour OR sabor OR taste OR aroma OR aromas OR odor OR odour OR olor OR odorant OR odorants OR odorante OR odorantes OR volatile OR volatiles OR volátil OR voláteis OR volátiles OR lexicon OR léxico OR "flavor wheel" OR "aroma wheel" OR "roda de aromas" OR "rueda de sabores" OR "descriptive analysis" OR "análise descritiva" OR "análisis descriptivo" OR "perfil sensorial" OR QDA OR ADQ OR CATA OR "check-all-that-apply" OR olfactometry OR olfatometria OR olfatometría OR "GC-O" OR "GC-MS" OR SPME OR headspace)
```

Nota para CORE e Europe PMC: por padrão as duas buscam também no texto completo dos documentos abertos, o que
traz muito ruído. [TBD — decidir se a string é restrita a título, resumo e palavras-chave com os campos de cada
API; a sintaxe dos campos precisa ser conferida na documentação de cada uma antes da trava.]

**Semantic Scholar** (*bulk search*: `|` = OR, `+` = AND; sintaxe a conferir na documentação da API antes da trava):

```
(cajuína | cajuina | caju | cajú | cashew | "Anacardium occidentale" | marañón | maranon | merey | cajuil) + (sensory | sensorial | flavor | flavour | sabor | taste | aroma | odor | odour | olor | odorant | volatile | volatiles | volátil | voláteis | volátiles | lexicon | léxico | "flavor wheel" | "aroma wheel" | "descriptive analysis" | "análise descritiva" | "perfil sensorial" | QDA | ADQ | CATA | olfactometry | olfatometria | "GC-O" | "GC-MS" | SPME | headspace)
```

**Crossref** (a API não aceita booleanos: a busca é por relevância). PROPOSTA de conjunto de consultas curtas, cada uma registrada como execução própria:
`cajuína aroma` · `cajuína sensorial` · `cashew apple aroma volatile` · `cashew apple juice sensory` · `cashew wine aroma` · `caju aroma voláteis` · `caju perfil sensorial` · `marañón aroma volátiles`

**BDTD/Oasisbr, UFC, UECE, Alice/Embrapa** (`search_repository`; a exploratória mostrou busca por palavra, não por frase, e sem garantia de operadores). PROPOSTA de conjunto de consultas simples, sem acento:
`cajuina` · `caju aroma` · `caju sensorial` · `caju volateis` · `pedunculo de caju` · `suco de caju` · `vinho de caju` · `fermentado de caju`

**Scopus** (Portal CAPES, execução manual):

```
TITLE-ABS-KEY ( cajuína OR cajuina OR caju OR cajú OR cashew OR "Anacardium occidentale" OR marañón OR maranon OR merey OR cajuil )
AND
TITLE-ABS-KEY ( sensory OR sensorial OR flavo*r OR sabor OR taste OR aroma* OR odo*r* OR olor OR odorant* OR volatil* OR volátil* OR voláteis OR lexic* OR léxico OR "flavo*r wheel" OR "aroma wheel" OR "roda de aromas" OR "rueda de sabores" OR "descriptive analys*" OR "análise descritiva" OR "análisis descriptivo" OR "perfil sensorial" OR qda OR adq OR cata OR "check-all-that-apply" OR olfactometr* OR olfatometr* OR "GC-O" OR "GC-MS" OR spme OR headspace )
```

**Web of Science — Core Collection** (Portal CAPES, execução manual; campo TS = título, resumo, palavras-chave):

```
TS=(cajuína OR cajuina OR caju OR cajú OR cashew OR "Anacardium occidentale" OR marañón OR maranon OR merey OR cajuil)
AND
TS=(sensory OR sensorial OR flavor OR flavour OR sabor OR taste OR aroma* OR odor* OR odour* OR olor OR volatil* OR volátil* OR voláteis OR lexicon* OR léxico OR "flavor wheel" OR "aroma wheel" OR "roda de aromas" OR "rueda de sabores" OR "descriptive analys*" OR "análise descritiva" OR "análisis descriptivo" OR "perfil sensorial" OR QDA OR ADQ OR CATA OR "check-all-that-apply" OR olfactometr* OR olfatometr* OR "GC-O" OR "GC-MS" OR SPME OR headspace)
```

**FSTA** (Portal CAPES, execução manual). Plataforma [TBD]. Se for EBSCOhost (TI = título, AB = resumo, SU = assuntos):

```
( TI ( cajuína OR cajuina OR caju OR cajú OR cashew OR "Anacardium occidentale" OR marañón OR maranon OR merey OR cajuil ) OR AB ( cajuína OR cajuina OR caju OR cajú OR cashew OR "Anacardium occidentale" OR marañón OR maranon OR merey OR cajuil ) OR SU ( cajuína OR cajuina OR caju OR cajú OR cashew OR "Anacardium occidentale" OR marañón OR maranon OR merey OR cajuil ) )
AND
( TI ( sensory OR sensorial OR flavo#r OR sabor OR taste OR aroma* OR odo#r* OR olor OR volatil* OR voláteis OR lexic* OR léxico OR "descriptive analys*" OR "análise descritiva" OR "perfil sensorial" OR QDA OR ADQ OR CATA OR olfactometr* OR olfatometr* OR "GC-O" OR "GC-MS" OR SPME OR headspace ) OR AB ( sensory OR sensorial OR flavo#r OR sabor OR taste OR aroma* OR odo#r* OR olor OR volatil* OR voláteis OR lexic* OR léxico OR "descriptive analys*" OR "análise descritiva" OR "perfil sensorial" OR QDA OR ADQ OR CATA OR olfactometr* OR olfatometr* OR "GC-O" OR "GC-MS" OR SPME OR headspace ) OR SU ( sensory OR flavo#r OR aroma* OR odo#r* OR volatil* ) )
```

Se o FSTA estiver na plataforma Web of Science, usa-se a string do Web of Science acima.

**Pontos da v0.1 para o pesquisador decidir** ([TBD]): (a) manter `caju`/`cashew` isolados no bloco P (mais
sensibilidade, mais ruído de castanha) ou exigir as formas compostas (pedúnculo, *cashew apple*, suco, vinho);
(b) restringir CORE e Europe PMC a título/resumo; (c) acrescentar o tesauro do FSTA.

## Processo de Seleção

*Por que:* F4.1.2, F4.1.3 e F4.1.5 → PRISMA-ScR item 9 (*Selection of sources of evidence*: o processo de
triagem e elegibilidade). O auditor do protocolo exige os três rótulos abaixo.

Trilha do método `scoping-prisma-scr`, lida de `.claude/methodologies/scoping-prisma-scr/manifest.json`:

1. **F0 — Pré-registro** (executa: `designer`)
2. **F1 — Protocolo da questão (PCC)** (executa: `designer`)
3. **F2 — Busca (PRISMA-S)** (executa: `librarian`) — só depois da trava **e** do conserto de F7 e F8 (decisão do pesquisador)
4. **F3 — Deduplicação** (executa: `screener`)
5. **F4 — Triagem TA + full-text** (executa: `screener`)
6. **F5 — Extração / charting** (executa: `extractor`)
7. **F5_5 — Leitura/RAG orientada a objetivo** (executa: `reader`)
8. ~~F6 — Risco de viés~~ — não se aplica a este método
9. **F7 — Síntese** descritiva e por mapeamento, sem meta-análise (executa: `analyst`)
10. **F8 — Resultados e manuscrito** (executa: `analyst`)

**Declaração do processo de triagem:**
   - **F4.1.2 Processo de triagem:** Individual — um revisor humano (o pesquisador) aplica os critérios a cada registro; a IA propõe a decisão e o pesquisador decide a inclusão (RV-04). [TBD — confirmar: haverá segundo revisor humano? O `assess_research_design` lembra que a JBI recomenda triagem em duplicata; triagem individual é escolha legítima se declarada.]
   - **F4.1.3 Ferramenta utilizada:** ReviewBR — `deduplicate_dataset` (F3), `screen_candidates` (proposta da IA em título/resumo e em texto completo), `get_screening_report` (métricas e saturação); as decisões do pesquisador são gravadas com `record_researcher_decision`. [TBD — confirmar]
   - **Resolução de discordâncias:** [TBD — depende da resposta sobre o segundo revisor. Se a triagem for individual: "não se aplica (triagem individual)"; a divergência entre a proposta da IA e o pesquisador é resolvida pelo pesquisador.]
   - Fase 1: Triagem por título e resumo
   - Fase 2: Leitura de texto completo
   - Saturação e lista final de incluídos: decisão do pesquisador (RV-04).

**Extração (charting), F5 — PROPOSTA de campos** (aprovação: [TBD]). *Por que:* PRISMA-ScR itens 10 e 11, que o
mapeamento declara parcialmente não cobertos (faltam as dimensões próprias do escopo); por isso ficam listadas aqui.
Por fonte: referência e tipo de documento; país, estado e instituição; produto (cajuína / suco / néctar / polpa /
fermentado / vinho / pedúnculo) e origem do material; método sensorial (tipo, painel treinado ou consumidores,
número de avaliadores); descritores relatados (como no original); método instrumental (extração, GC-MS, GC-O etc.);
compostos voláteis/odorantes relatados; se liga descritor a composto, e como; se apresenta roda, léxico ou perfil.
A IA propõe a extração; o pesquisador confere (RV-04). Cada dado com origem (RV-08).

**Síntese, F7 — PROPOSTA.** Descritiva e por mapeamento: tabelas e frequências por produto, método e estado;
quadro descritor × produto e composto × produto; destaque do Ceará e registro de roda/léxico da cajuína de outros
estados. Sem meta-análise (o método não a permite).

## Registro de Protocolo

**Registro:** não registrado — decisão do pesquisador (12/11/2026); o registro é opcional em revisão de escopo (PRISMA-ScR item 5 pede declarar se há protocolo e se foi registrado).

## Auditoria PRISMA

Checklist PRISMA-ScR 2018 (22 itens; itens 12 e 16 fora do denominador pela condição `avaliacao_critica` = "não")
+ PRISMA-S 2021 (16 itens), preenchidos ao final do estudo.

## Pendências antes da trava (lista de [TBD])

1. F0.1.1 aprovação do título · F0.1.6 autores (nomes, instituição, ORCID) · F0.1.7 instituição · F0.1.8 financiamento e papel do financiador · F0.1.9 conflito de interesses.
2. F0.2 onde o protocolo poderá ser acessado.
3. F0.3.1, F0.3.3, F0.3.4 aprovação das propostas · F0.3.2 revisões anteriores.
4. F1.1.2 aprovação das questões secundárias.
5. F1.3: aprovação das propostas; capítulos de livro e resumos simples; produtos em que o caju é ingrediente; coprodutos (fibra, essências, *water phase*); revisões de literatura; contato com autores; uso do Sci-Hub; justificativa do idioma.
6. Fontes: identidade de `BR-AGG-0001` (BDTD × Oasisbr); Infoteca-e, UFPI, PubMed; plataforma do FSTA; outros métodos (citações, contatos).
7. F1.4: aprovação das strings (F1.4.4), pontos (a)–(c), campos de CORE e Europe PMC, `maxResults`.
8. F4.1.2/F4.1.3/discordâncias: segundo revisor humano.
9. Extração e síntese: aprovação dos campos propostos.
10. Gravar com `record_researcher_decision` (palavras do pesquisador): a resposta "não" à condição `avaliacao_critica` e as decisões da F0/F1.
