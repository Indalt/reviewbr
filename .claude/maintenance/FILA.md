# Fila da manutenção do ReviewBR — página única

> Aprovada pelo Vicente em 12/11/2026. É a página permanente da manutenção: **toda sessão do `maintainer` começa
> por ela**, com fila ou sem fila. Tem três partes:
> - **Rotina:** o que se verifica toda vez. Nunca fica vazia.
> - **Fila:** os consertos que o Vicente decidiu. Pode estar vazia.
> - **Visto de passagem:** o que apareceu e ele ainda não avaliou.
>
> Substituiu a tabela de sessões do `PLANO_sessoes_2026-10-29.md` (M, V, 3, 4, 5, 6 e 7+). A análise que a
> justifica está em `ORGANIZACAO_2026-11-11.md` e não é leitura de sessão.

## Regras — valem para qualquer modelo

1. **Uma sessão faz uma linha, e só ela.** Não lê outros documentos de `.claude/maintenance/` além dos que esta
   página cita.
2. **Não cria achado, sessão, frente nem documento.** O que aparecer de passagem vira uma linha em "Visto de
   passagem", no fim desta página, sem avaliação. Quem decide se vira achado é o Vicente.
3. **Para cada achado da linha:** leia a "mentira de hoje" na entrada dele em
   `triagem_backlog_2026-11-05/TRIAGEM.md` e o registro por `node .claude/maintenance/sessao_2a/le_audit.mjs
   <ids>`; confira no código; aplique o veredito.
   - **FAZER:** conserto de código, com teste que falha antes e passa depois.
   - **DECLARAR:** corrigir o texto ou o dado para dizer o que o sistema faz hoje. Não construir a capacidade.
4. **Veredito e decisão já dados não se reavaliam.** Não troque DECLARAR por FAZER. Dúvida que o disco não
   resolve: pare e pergunte ao Vicente em até 3 linhas.
5. **Abrir conferindo:** `git status` limpo, `npx vitest run` verde (em `reviewbr/reviewbr-mcp`), audit válido.
6. **Fechar conferindo:** `npm run build`, suíte verde, cada achado fechado pela `record_system_finding`
   (RESOLVIDO, com `resolution`), audit válido, a linha marcada aqui com data e commit, commit e push.
7. **Sem subagente nem workflow.** Alteração do sistema passa pelo gate `validate_system_change`, com o tipo
   declarado.
8. **Resposta ao Vicente em até 5 linhas, com a decisão primeiro.**

## Dois princípios decididos em 12/11/2026

- **Metodologia e norma se apontam, não se copiam.** O ReviewBR guarda a fonte oficial e a data em que ela foi
  lida, e mantém um mapa central para sugerir ao pesquisador a metodologia mais adequada. Não se transcreve
  norma nova nem se confere mapeamento item a item. As cinco normas já transcritas ficam como ajuda, sem crescer.
  - **Para que serve o mapa** (Vicente, 12/11/2026, ao autorizar apagar duplicatas do catálogo): quando um projeto
    de pesquisa começa, o ReviewBR sugere a metodologia mais adequada a partir do que o pesquisador deu de entrada,
    incluindo a pesquisa exploratória. O log da pesquisa exploratória é mantido, como referência para entender o
    projeto mais depressa e guiar o pesquisador no projeto iniciado, depois de formulado o objeto e desenhado o
    projeto. Por isso o catálogo tem uma entrada por documento: duplicata se apaga.
    Origem: "apagar as duplicatas se mantiver a ideia de ter as entradas de metodologias como um mapa e quando um
    projeto de pesquisa for iniciado sugerir a melhor metodologia de acordo com o conjunto de informações que foi
    dado nos inputs".
- **O controle por código vale em todo o ReviewBR**, da busca exploratória à formulação do objeto de pesquisa e
  à publicação: contagem, trava, registro, deduplicação e persistência não se simplificam.

## Rotina — o que se verifica toda vez

Toda sessão do `maintainer` roda estes cinco passos antes de qualquer outra coisa, nesta ordem. Com a fila vazia,
a sessão é só a rotina.

| # | o que verificar | como | se não estiver certo |
|---|---|---|---|
| 1 | O repositório está limpo | `git status` | diga o que está sem commit. Não apague nem descarte nada |
| 2 | O servidor monta e a suíte passa | em `reviewbr/reviewbr-mcp`, pelo PowerShell em `C:\`: `npm run build` e `npx vitest run` | diga qual teste falhou e pare. Não siga para uma linha da fila com a suíte vermelha |
| 3 | O backlog é válido | tool `audit_system_debt` | inválido: conserte o backlog antes de tudo. Achado aberto que não está em linha nenhuma da fila: relate os ids ao Vicente |
| 4 | Há linha a fazer ou em curso | a tabela "Fila", abaixo | se houver, é o trabalho da sessão, uma linha só. Se não houver, a sessão termina na rotina |
| 5 | Quantos itens esperam decisão | conte os itens de "Visto de passagem" | relate o número. Não avalie nem conserte nenhum |

**Só quando o Vicente pedir:** conferir a versão das normas e o ambiente de IA para pesquisa (passos 3a e 3b do
`.claude/agents/maintainer.md`).

**Ao terminar a rotina:**
- troque a linha "Última verificação", abaixo, pela de hoje. É uma linha só; a anterior fica no histórico do git;
- relate ao Vicente em até 5 linhas: o que passou, o que não passou e o que espera decisão dele;
- commit e push.

**Última verificação:** 20/11/2026, sessão da linha 16 — repositório limpo; build e suíte 585 de 585 (592 depois);
backlog válido, 0 abertos; fila: linha 10 em curso, 16 feita, 13 a fazer; 42 itens no "Visto de passagem".

## Fila

| ordem | sessão | FAZER | DECLARAR | estado |
|---|---|---|---|---|
| 0 | Limpeza dos documentos e rota do `maintainer.md` | — | — | **feita em 12/11/2026** |
| 1 | A — Texto completo e leitura | 089 (primeiro) · 062 · 031 | — | **feita em 12/11/2026** (commit `71ce06b`) |
| 2 | B — Registro da busca | 056 · 139 · 087 · 093 | 058 · 077 | **feita em 12/11/2026** (commit `bf9e156`) |
| 3 | C — Triagem, deduplicação e tools em lote | 021 · 025 · 112 · 030 | 026 | **feita em 12/11/2026** (commit `6456a4a`) |
| 4 | D — Funil e gates | 138 · 071 | 003 · 002 · 066 · os 21 subitens do 014 como `[NÃO COBERTO]` | **feita em 12/11/2026** (commit `83bf50f`) |
| 5 | E — Trava do protocolo | 018 · 133 (mesmo conserto) · 042 | 060 | **feita em 12/11/2026** (commit `4a2c082`) |
| 6 | F — Ferramentas da manutenção | 141 | 016 · 153 (depois do 141) | **feita em 12/11/2026** (commit `c436b28`) |
| 7 | G — Textos que prendem o sistema à revisão sistemática | 135 | 137 · 151 · 008 | **feita em 12/11/2026** (commit `6cf7ae8`) |
| 8 | H — Normas por ponteiro | ver abaixo | 045 · ver abaixo | **feita em 12/11/2026** (commits `fe53fb8`, `36e687a`, `c0cefbf`, `e61d713`) |
| 9 | M — Descrição do método, com o Vicente | — | — | **feita em 12/11/2026** (`.claude/METODO_ReviewBR.md`; commits `898d79b`, `2a36336`, `216d13d`, `17af311`) |
| 10 | Fase de testes | — | — | **em curso:** o teste é a pesquisa real `roda_aromas_ceara` (Vicente, 19/11/2026); as linhas 11 a 13 saíram dele |
| 11 | I — Busca nos repositórios do `roda_aromas_ceara` | ver abaixo | ver abaixo | **feita em 19/11/2026** (commit `4936c59`): UFPI e IFCE buscam pela API REST; UECE, Alice e Infoteca-e marcadas como não pesquisáveis (HTTP 403), e a tool diz isso; Infoteca-e segue `inactive`; `matchesQuery` corrigido, sem chamador desde o item 1 |
| 12 | J — OpenAlex e SciELO: resumo, endereço e a fonte do SciELO | ver abaixo | ver abaixo | **feita em 19/11/2026** (commits `f290ac9` e o seguinte): item 2 pelo OpenAlex com o prefixo 10.1590, por decisão do Vicente |
| 13 | K — Decisões dos dois revisores humanos | ver abaixo | — | a fazer; antes da triagem do projeto (passo D) |
| 14 | L — Acesso por robô: conferência jurídica e ética (UECE, Alice, Infoteca-e) | User-Agent identificado | `CONFERENCIA_acesso_2026-11-19.md` | **feita em 19/11/2026**: robots.txt respeitado; UECE, Alice, Infoteca-e e UFC pela Oasisbr, declarando onde se viu |
| 15 | F9 — importação de várias bases em `01_raw` | ver abaixo | — | **feita em 19/11/2026** |
| 16 | F10 e F11 — importação de RIS: linha de continuação, CR sozinho e registros distintos da mesma base | ver abaixo | — | **feita em 20/11/2026** |

Os números são ids `DEBT-NNN`. Cada linha de 1 a 8 cabe numa janela de 5 h. As linhas 1 a 7 não dependem uma
da outra; a ordem é a do dano a uma pesquisa em andamento.

Decisões de 29/10 que valem nos consertos: 021 (a saturação lê a triagem do disco), 025 (similaridade de 90%
ou mais só sinaliza o par), 031 (a página é guardada na extração), 056 (o código grava o log de busca), 018 (a
trava vale só pelo `project_state.json`), 138 (a exportação recalcula o funil e bloqueia divergência), 016 (aviso
na tool sobre `targets`).

### Linha 8 — o que a H faz, e só isto

1. **DEBT-045:** corrigir, na spec do `prisma-sr`, os números de item do PRISMA 2020 que o `analyst` lê para
   escrever o relato. Sem remapeamento.
2. **DEBT-014:** fecha na linha 4, com a declaração. Aqui, só se ainda estiver aberto. Sem mapear os 21
   subitens.
3. **Relatório do `check_standard_coverage`:** passa a dizer que o mapeamento é do sistema, não foi conferido
   contra a fonte, e que o pesquisador preenche o formulário oficial da norma.
4. **`sessao_2c/divergencias_prisma_s.md`:** fica como está. As 36 divergências não se decidem item a item, e o
   mapeamento de 30/10 segue valendo como ajuda.
5. **Data de leitura:** a entrada do catálogo guarda a data em que a fonte foi lida; quando um projeto escolhe o
   método, o protocolo dele grava o método, a fonte e essa data.
6. **Mapa de uma página:** um arquivo gerado do catálogo, com uma linha por metodologia (nome, quando usar,
   fonte, data de leitura). Não se escreve à mão.
7. **`maintainer.md`:** a assimilação passa a dois passos (fonte oficial; entrada no catálogo com a data), e a
   leitura documentada deixa de ser exigida para norma nova.

A linha 9 (M) redige o `METODO_ReviewBR.md` com o que já está decidido e leva ao Vicente só as escolhas dele. As
três perguntas da sessão 2c deixaram de ser necessárias.

### Linhas 11 a 13 — o que fazem, e só isto

> **Decidido pelo Vicente em 19/11/2026:** os consertos que a conferência do passo A do `roda_aromas_ceara`
> confirmou entram na fila, para que a pesquisa seja feita apropriadamente. As linhas 11 e 12 vêm antes da busca
> do projeto (passo C), e a 13 antes da triagem (passo D). Consequência: o projeto espera essas linhas. A parte do
> Vicente na busca, pelo Portal CAPES, não espera. Origem: "se precisa realizar a fila para a roda de aromas ser
> feita apropriadamente vamos executar."

Valem para as três:
- cada conserto tem teste que falha antes e passa depois;
- toda busca tem controle positivo com o termo do projeto, "cajuína";
- a reprodução de cada falha está no commit `93c7997`;
- nenhuma das três grava na pasta do projeto. O teste real é o passo C, feito depois pela sessão do projeto.

As causas são de antes da manutenção: a camada de acesso vem do commit `28222ed` (03/03/2026); o OpenAlex, o SciELO
e o "DSpace" do catálogo vêm do `9943f66` (26/02/2026). A suíte passava porque não consulta as fontes reais.

**Linha 11 — I, busca nos repositórios** (F5 na UFPI, F6, F7, Infoteca-e, P7 e P8). Hoje UECE, Alice, IFCE, UFPI e
Infoteca-e dão zero para "caju" e "cajuína", sem aviso. A BDTD devolve, para "cajuína", registros da UECE (siduece
id=96019 e 84564) e da Alice (doc/1152668). A UFC voltou a funcionar e serve de comparação.
1. `strategy.ts:94-113`: o OAI-PMH deixa de servir de busca. Hoje ele colhe os primeiros `maxResults × 3` registros
   do acervo e filtra só esses. A busca passa a usar a interface de busca do próprio repositório, para o total bater
   com o que uma pessoa vê no site (condição do protocolo do projeto, F4.1.2). O OAI fica para a colheita.
2. `strategy.ts:309`: a plataforma passa a ser comparada sem diferença de maiúscula (o catálogo diz "DSpace"), para
   a API REST do DSpace 7 rodar (IFCE).
3. Catálogo: o endereço de busca certo da Alice (`/alice`), da Infoteca-e (`/infoteca`) e da UECE (sistema próprio,
   `trabalhoAcademicoPublico.jsf`, não DSpace).
4. Zero com aviso: quando nenhum método funciona, a tool diz qual falhou, em vez de lista vazia (`catch { return [] }`
   em toda a cascata). O `validate_repository` só marca a busca com ✅ quando há resultado (`index.ts:1585`).
5. `matchesQuery` (`strategy.ts:322-339`): exige todas as palavras, sem diferença de acento. Hoje basta uma palavra.
6. Resumo nos resultados: o `html-scraper` grava `description: ""`, e o adaptador da BDTD não pede resumo nem data à
   API. Conferir o nome do campo na documentação do VuFind.
7. URL da BDTD sem espaço (`platform-adapters.ts`): a F6 e a URL de registro, que tem o mesmo defeito.
8. Infoteca-e: volta a `active` depois do conserto, se o controle positivo passar. O `inactive` vem do `9943f66`,
   sem motivo registrado, e hoje o servidor responde.
9. UFPI: hoje o servidor não conecta ("fetch failed"). Conferir se é queda ou bloqueio. Se continuar, a tool avisa
   (item 4), e a sessão do projeto anota a fonte como não alcançada.

DECLARAR: repositório sem busca que a tool consiga usar fica marcado como não pesquisável no catálogo, e a tool diz
isso em vez de dar zero. Não fazer: a busca em "todos os ativos" (F4).

**Linha 12 — J, OpenAlex e SciELO** (F1, F3, F8).
1. `snowball.ts:219-235`: montar o resumo a partir de `abstract_inverted_index` e gravar o endereço (página da
   fonte ou DOI), que hoje sai "undefined". Hoje nem o JSON de `01_raw` tem resumo. Pelo protocolo do projeto,
   registro sem resumo vai inteiro para a leitura humana.
2. `search_scielo` (`index.ts:2052`): hoje consulta o OpenAlex filtrado por `publisher_lineage:P4310312277`, e as
   revistas do SciELO têm editora própria. Passa a consultar a busca do próprio SciELO, para o total bater com o
   site (mesma condição do protocolo). Se ela não tiver interface que a tool consiga ler, a sessão para e leva ao
   Vicente, em até 3 linhas, a alternativa: o OpenAlex com o prefixo 10.1590, que só cobre o Brasil. O controle são
   os dois artigos SciELO com "cajuína" no título: 10.1590/fst.25520 e 10.1590/s0100-40422007000500017.

DECLARAR: a saída diz de onde vem cada contagem; um número do OpenAlex não aparece como "total da base" do SciELO.
Não fazer: o `ScieloAdapter` (ArticleMeta) do `search_repository` e a F2.

**Linha 12, resultado (19/11/2026).** Item 1: o `search` e as citações do snowball gravam o resumo e o endereço
(página da fonte, senão DOI). DECLARAR: a descrição e a saída do `search_scielo` dizem que a busca é no OpenAlex com
o filtro de editora e que o total não é o da base SciELO. Item 2: o `robots.txt` de `search.scielo.org`
proíbe robôs; pela decisão do Vicente na linha 14, o `search_scielo` busca no OpenAlex com o prefixo de DOI 10.1590
(SciELO Brasil) e declara isso. Controle em 19/11/2026: 78 registros, com os dois DOIs de controle; o filtro de
editora antigo não trazia nenhum.

**Linha 13 — K, decisões dos dois revisores humanos.** O protocolo travado do projeto (F4.1.2, F4.1.3) exige gravar
no próprio projeto, com o nome de quem decidiu:
- a decisão de cada revisor, em separado, na triagem por título e resumo e no texto completo;
- o consenso, com o motivo;
- sem consenso, a decisão do pesquisador.

Hoje nenhuma tool faz isso. A `record_researcher_decision` grava uma decisão por etapa, sem revisor nem registro, e
o `screen_candidates` é triagem por IA. A linha faz:
1. gravar a decisão por registro, revisor (nome) e estágio (`ta`, `fulltext`), com o motivo e, se o protocolo tiver
   perguntas de elegibilidade, a resposta a cada uma;
2. gravar o consenso de cada registro, com o motivo, e quem decidiu quando não houve consenso;
3. gerar do consenso os artefatos do funil (`excluded_ta.json`, `excluded_fulltext.json`, `included.json`), para o
   `compute_flow_counts` contar;
4. relatar a concordância entre os dois revisores como informação, pela `compararCorridas`
   (`screening_audit.ts:161`), que existe e nada chama. O protocolo não a exige.

Não fazer: triagem por IA nem cegamento entre revisores (o sistema não separa usuários, o que já está declarado).

**Linha 14 — L, acesso por robô** (ordem do Vicente, 19/11/2026: "ciencia aberta deve ser ciencia aberta e
estrategias para a minha compreensao nao sao burlar etica. ver isso em juridico antes de fazer algo. mas havia tb um
healer. veja isso."). A conferência, com as fontes, está em `CONFERENCIA_acesso_2026-11-19.md`. Decide: o ReviewBR se
identifica e não busca por robô onde o `robots.txt` proíbe ou o servidor recusa. Feito: User-Agent identificado no
`src/utils/http.ts` e no `heal_repositories`.

> **Decidido pelo Vicente em 19/11/2026:** o que deve ser automatizado não vai para busca à mão. A fonte que o
> ReviewBR não alcança diretamente não se força nem se discute: a tool declara o que foi visto e onde, e a alcança
> por uma plataforma de ciência aberta que a agrega. Consequência: o total relatado é o da plataforma, e o registro
> da busca diz isso. Origem: "sem busca a mao para o que deve ser automatizado. (…) seguir com o que nao é possivel
> e nem falar, bastando declarar o que foi visto e onde se conseguiu. existem muitos repositorios que podem ser
> acessados por plataformas de ciencia aberta".

Feito depois da decisão: `src/utils/robots.ts` (RFC 9309) antes de toda busca da camada de acesso; `viaAgregador`
no catálogo; UECE, Alice, Infoteca-e (de volta a `active`) e UFC pela Oasisbr, cada uma pela sua rede, com controle
positivo; o SciELO pela linha 12. A tabela dos totais está no fim da conferência.

**Linha 15 — F9, importação de várias bases** (ordem do Vicente, 19/11/2026, item 3 do prompt da sessão). Feito:
`appendRawRecords` e `consolidateRaw` só descartam o registro repetido da mesma fonte; o mesmo DOI de duas bases
fica nas duas, e a remoção entre bases é da F3, com relatório. O `importRis` retira o BOM e grava a base declarada em
`repositoryName` e o DOI como endereço quando falta `UR`, onde o gate da RV-08 os procura (sem isso, a exportação
bloquearia todo registro importado). O passo C, primeira parte, do projeto pode rodar de novo, com o mesmo prompt,
em chat aberto depois deste build.

**Linha 16 — F10 e F11, importação de RIS** (ordem do Vicente, 20/11/2026: "realizar a manutencao entao", depois de a
sessão do projeto parar a importação da FSTA e levar as duas falhas ao "Visto de passagem"). Feito:
- F10: o `importRis` reconhece CR sozinho como fim de linha, só lê como campo a linha no formato `XX  - ` e junta a
  linha de continuação ao campo anterior (resumo com quebra de parágrafo; título, autor, palavra-chave e periódico
  com espaço). Antes, uma continuação começada por "TI…" ou "AB…" sobrescreveria o campo;
- F11: `import_dataset_ris` grava o export inteiro (`appendRawRecords` com `manterTodosDoLote`): dois registros da
  mesma base com o mesmo DOI entram os dois, e só se descarta o que já estava em `01_raw` vindo da mesma base, de
  modo que repetir a importação não duplica. `consolidateRaw` só descarta o repetido entre arquivos, não dentro de um.
  A busca não muda: o repetido dentro do lote de uma busca continua descartado.

Conferido com os três RIS do projeto, fora dele: Scopus 23, Web of Science 17 e FSTA 14 (total 54), nenhum sem
resumo; a FSTA importada de novo grava 0; o resumo de Porto-Luz et al. 2020 entra com as 5 linhas. **O que o conserto
não faz:** reimportar o Web of Science não recompõe o resumo cortado em `01_raw` do projeto, porque o registro já
gravado da mesma base é descartado, não substituído. Recompor é decisão do projeto.

### Como uma linha entra na fila

- Só o Vicente cria linha. A sessão não cria, nem a pedido de outro documento.
- Uma linha nasce de um destes três lugares: um item do "Visto de passagem" que ele mandou fazer; um achado aberto
  no backlog; um pedido dele.
- A linha diz o que fazer e o que não fazer, como as de 1 a 8: FAZER é código com teste; DECLARAR é corrigir o
  texto, sem construir.
- Item do "Visto de passagem" que virou linha, ou que ele mandou descartar, sai de lá.

## O que não é fila

Trilha executável para metodologia nova, OCR, validação da IA dentro da revisão, trava da escolha de método,
abrir o ReviewBR numa IDE, a arquitetura de agentes por papel, a rota para o Sci-Hub. Acontecem quando o
Vicente pedir.

## Visto de passagem — não avaliado

- `reviewbr/reviewbr-mcp/src/index.ts.tmp` segue no disco.
- Cinco skills dizem a que agente pertencem, e nenhum desses cinco agentes nomeia a sua skill: `reader` e
  `evidence-reading`, `extractor` e `extraction-form`, `librarian` e `prisma-s-logging`, `screener` e
  `screening-rules`, `analyst` e `synthesis-manuscript`.
- `reviewbr/projects/` tem cerca de 380 arquivos rastreados no repositório público.
- `PASSAGEM.md` ficou na pasta da manutenção porque `tests/porta_do_backlog.test.ts` lê o texto dele.
- (linha 1) `scihub_bridge.ts` monta o comando do python interpolando o DOI numa string de shell (`exec`,
  `--doi "${doi}"`).
- (linha 1) Nenhum código grava `03_screening/fulltext_not_retrieved.json`; o `retrieve_fulltexts` não registra
  os que falharam. Desde a linha 1, o BYOS só aceita DOI que esteja nesse arquivo.
- (linha 1) DOI recuperado pelo BYOS continua em `fulltext_not_retrieved.json`, que o funil conta como não
  recuperado.
- (linha 1) `download_and_extract_pdfs` pula o texto já gravado como `[NATIVE PDF EXTRACTED]`: texto extraído
  antes de 12/11/2026 não ganha página quando a tool roda de novo.
- (linha 1) `logToLocalProject` (`index.ts`) monta o caminho com `path.join(process.cwd(), projectPath)`, sem
  tratar `projectPath` absoluto.
- (linha 1) Pelo Git Bash com a unidade em minúscula (`c:/`), o `npx vitest run` acusa "No test suite found" em
  todo arquivo; pelo PowerShell em `C:\` a suíte roda.
- (linha 2) `snowball.ts:147` (`fetchCitations`) pede só a primeira página de `filter=cites:`, sem `per_page` nem
  paginação, e trata a resposta de erro do `fetchJson` (`__error`) como lista vazia.
- (linha 2) `harvest_records` não grava em `01_raw` nem com `projectPath`; a descrição do parâmetro diz "Sem ele,
  a coleta é exploratória e nada é persistido". Desde a linha 2 a coleta entra no log PRISMA-S.
- (linha 2) `librarian.md` passo 2 manda o agente salvar o JSON bruto em `01_raw/[fonte]_[data]_[hash].json`; as
  tools de busca já gravam em `01_raw`.
- (linha 2) `data.ts:333` grava `provenanceSource: "Local File Import"` quando a origem do RIS vem vazia; o
  comentário de `data.ts:156` diz que a origem fica vazia nesse caso.
- (linha 3) Decisão do Vicente em 12/11/2026, na sessão C, sobre a deduplicação: nível 2 = título normalizado + mesmo
  ano; nível 3 = título + 1º autor quando um dos dois registros não tem ano. Gravada no DEBT-025 e na skill.
- (linha 3) `reviewbr-web/src/app/api/chat/route.ts:365` declara o `get_screening_report` com `projectId`
  obrigatório e sem `stage`; desde a linha 3 a tool exige `projectPath`.
- (linha 3) `screen_candidates` com `candidates` em lotes e `projectPath`: cada lote substitui o anterior nos
  artefatos canônicos, sem acumular; desde a linha 3, o segundo lote pede `substituicao`.
- (linha 3) `screener.md` passo 3 manda salvar `03_screening/included.json` e `excluded.json`; o `screen_candidates`
  grava `excluded_fulltext.json`.
- (linha 3) `prisma-rigor-gates/SKILL.md:29` lista "F4.3 (motivos EX-01..EX-11 derivados de F1.3)" entre o que a
  verificação de completude confere.
- (linha 5) `initializeWorkspace` segue reescrevendo o `protocol.md` e zerando as decisões de um projeto em DRAFT
  quando se replaneja no mesmo caminho; desde a linha 5 só o protocolo travado é protegido.
- (linha 5) `plan_research_protocol` registra a linha no SQLite antes do `initializeWorkspace`; quando a
  re-inicialização é recusada, a linha nova fica no banco.
- (linha 5) `data_mining/caju_beverages` (protocol.md `[LOCKED]`, sem `project_state.json`) é o único projeto do
  repositório que perdeu a busca com a trava só pelo estado; `plan_research_protocol` também recusa o caminho dele.
- (linha 6) A `absorb_methodology` não remove entrada. As duas duplicatas da declaração conjunta de 2025
  (`position-statement-ia-sintese-2025` e `declaracao-conjunta-ia-sintese-evidencia`) foram apagadas editando o
  arquivo, com autorização do Vicente em 12/11/2026; o catálogo tem 106 entradas.
- (linha 7) Os `protocol_template.md` dos métodos têm a F0.2 com campos próprios (`[TBD]`), e nenhum código os lê
  para gerar o protocolo; o auditor confere a linha `**Registro:**` do protocolo que o `project_init` gera.
- (linha 7) O servidor do ReviewBR aberto antes do build de 12/11 segue com o texto antigo (registro
  "OBRIGATÓRIO") até ser reiniciado.
- (linha 8) As 106 entradas do catálogo estão sem `read_at`: o `MAPA.md` mostra `[sem data]` em todas.
- (linha 8) Nenhuma tool lê o `MAPA.md`: o `assess_research_design` sugere o método pelos que servem ao tipo
  (`serves_research_types`), não pelo mapa.
- (linha 8) Pedido do Vicente em 12/11/2026, para verificar depois de finalizar a fila. (1) Antes de sugerir uma
  metodologia ao pesquisador, o sistema confere na fonte oficial se ela mudou desde a data de leitura (`read_at`).
  Isso muda a decisão de 09/10/2026 (DEBT-010), que conferia a obsolescência só quando o maintainer roda; a
  mudança foi decidida por ele em 12/11/2026. (2) A `absorb_methodology` grava os passos de cada metodologia e o
  mapa os mostra, para a tool que sugere informar os passos ao pesquisador ou ao projeto. A regeneração do mapa a
  cada uso da tool já é da linha 8. Em aberto: quem confere a fonte (tool ou `designer`) e o que fazer se ela não
  abrir; se os passos são resumo com ponteiro ou lista completa ("metodologia se aponta, não se copia"); a data de
  leitura das 106 entradas. Origem: "absorb_methodology deve manter o catalogo atualizado sempre que for
  utilizado. verificar se a metodologia escolhida sofreu alteracoes ou atualizacoes antes de ser sugerida. Essa
  tool também deve ficar responsável por detalhar o mapa (…)"; "se nao teve duplicidade muda-se a decisao de 09/10".
- (linha 9) Nenhuma tool do `registry/ai_use.ts` tem a categoria C5 ("não aceitável"); a síntese entre estudos (F7)
  está com o agente `analyst`, que o mapa de uso de IA não cobre.
- (linha 9) Pedidos ao sistema que saem das respostas do Vicente de 12/11/2026, gravadas no
  `.claude/METODO_ReviewBR.md`; nenhum foi feito:
  - seção 2: uma tool que avalie as metodologias já mapeadas e as que vão entrar, e informe se cada uma é
    validada e se declara os seus fundamentos; para a validada que não os declara, trazer os fundamentos canônicos
    do ReviewBR só como informação; para a que não tem validação, o alerta e a sugestão de outra. O catálogo não
    tem campo de fundamentos nem de validação. Origem: "tem de ter uma tool para avaliar as metodologias ques tao
    mapeadas e as que vao ser incluidas. pode ser uma tool ja existente que lida com as metodologias mapeadas";
  - seção 1: registrar a busca exploratória por padrão; o registro entra no projeto quando o protocolo é travado e,
    sem projeto, fica só como informação. Hoje a busca sem projeto não grava nada no log de busca;
  - seção 1 e seção 4: a sugestão de metodologia de acordo com o projeto, o objeto e a publicação; hoje o
    `assess_research_design` sugere por palavra-chave, e a sugestão não fica gravada;
  - P9: o `maintainer.md` diz "nada entra no funil sem protocolo travado"; o texto aprovado diz "sem o protocolo
    que a metodologia exige";
  - P6: tirar do código a classificação pelo RAISE 3 (`registry/ai_use.ts`, as chamadas no `screen_candidates` e
    no `batch_db_screen`, a citação na skill `system-audit`); a resolução do DEBT-117 se apoia nela. Fica o teste
    que reprova a tool que aciona IA sem declará-la, e a tentativa passa a ser registrada; hoje nada a grava.
    Origem: "o teste de segurança do reviewbr para nao criar tools para burlar pesquisa deve ser mantido e
    registrar quando há tentativa de burlar";
  - P6: o registro do uso de IA quando a metodologia escolhida obriga, no que ela obriga; não há tool, skill ou
    agente que monte o registro por etapa nem o texto da declaração no relato;
  - P10: medir e relatar a concordância entre a IA e o pesquisador numa amostra do projeto, quando a metodologia
    ou o destino exigem; hoje nenhuma tool faz isso;
  - seção 6: quando o projeto exige o RAISE, informar ao pesquisador que o RAISE 3 dá a síntese entre estudos por
    LLM como não aceitável e pedir que ele a traga; hoje nada informa, e o `analyst` se descreve como quem
    sintetiza;
  - seção 4: nenhuma tool pede os elementos do projeto de pesquisa da NBR 15287 (justificativa,
    referencial teórico, recursos, cronograma).
- (projeto `roda_aromas_ceara`, 12/11/2026) Falhas de tool vistas na busca exploratória do primeiro teste depois da
  manutenção. Reprodução de cada uma em `reviewbr/projects/roda_aromas_ceara/exploratoria/01_falhas_reviewbr.md`.
  F1, F3, F6, F7, F8 e a UFPI da F5 viraram as linhas 11 e 12 (19/11/2026). Restam:
  - F2 `search_openalex`: mostra 10 resultados e diz que o resto foi salvo em JSON, mas sem `projectPath` nada é
    gravado;
  - F4 `search_repository` sem `repositories` (todos os ativos): 1800 s sem resposta, abortada;
  - F5 `search_papers_optimized`: Unifesp e UFCG devolvem registros sem relação com a string, e a contagem soma
    esses registros. A causa geral (colheita parcial; basta uma palavra) é tratada na linha 11.
- (projeto `roda_aromas_ceara`, 19/11/2026) Visto na conferência do passo A, sem avaliação: para "cajuína", a BDTD
  devolve entre os 20 primeiros registros sem relação ("amor livre", biossurfactantes, assentamentos), que entram
  na contagem. E o `search.ts:26` põe na camada 2 todo repositório inativo, então o `search_papers_optimized` com a
  camada 2 também consulta os inativos.
- (projeto `roda_aromas_ceara`, 12/11/2026) No escopo, a avaliação crítica das fontes não tem onde ser registrada
  na trilha: com a condição `avaliacao_critica` = "sim", os itens 12 e 16 do PRISMA-ScR ficam `[NÃO COBERTO]`
  (o que ficou declarado ao resolver o DEBT-151). O projeto respondeu "não", mas o Vicente pediu o registro: "essa
  limitacao de falta de lugar para registrar tem de ser registrada para o agente de manutencao".
- (projeto `roda_aromas_ceara`, 12/11/2026) Incoerências vistas na F0/F1 do mesmo projeto, ao gerar o protocolo de
  escopo. Reprodução em `reviewbr/projects/roda_aromas_ceara/protocolo_falhas_reviewbr.md` (P1 a P8; P7 e P8, a F7
  vista pela `validate_repository`, viraram a linha 11):
  - P1 `plan_research_protocol` gera um esqueleto genérico, e não o `protocol_template.md` do método; o
    `protocol_auditor.ts` lê os títulos desse esqueleto;
  - P2 o esqueleto já vem com valores que o pesquisador não deu ("Idiomas: Sem restrição", "Global", fontes PubMed
    e BVS);
  - P3 o esqueleto e o auditor citam itens do PRISMA 2020 (24a, 8) num método que declara PRISMA-ScR e PRISMA-S;
  - P4 a entrada do PRISMA-ScR no catálogo não tem data de leitura;
  - P5 e P6 `BR-AGG-0001` aparece como "IBICT — Oasisbr" (o projeto o usa como BDTD); o catálogo marca o OAI-PMH
    dele como indisponível, e a validação dá OK;
- (projeto `roda_aromas_ceara`, 15/11/2026) Pontos de método que apareceram ao desenhar a revisão de escopo com o
  Vicente. Anotados sem avaliação; nenhum foi testado:
  - zero estudos incluídos: conferido em 19/11/2026, a trilha aceita. Num projeto de teste com 0 incluídos, o
    `compute_flow_counts` valida e o `export_dataset` exporta 0 registros; a skill do manuscrito não fala do caso;
  - o protocolo não tem campo para o motivo de cada fonte nem para o período que ela cobre (fontes escolhidas por
    relevância);
  - a busca feita à mão pelo pesquisador (Portal CAPES) e importada por `import_dataset_ris`: onde ficam o texto
    exato, a base, a plataforma, a data e a contagem no registro da busca?
  - triagem em duas camadas (por palavras, depois humana): como a camada por palavras fica registrada, e o que
    acontece com o registro sem resumo;
  - o pesquisador perguntou "porque nao se pode seguir estritamente o que o metodo pede": o sistema não diz, em
    cada campo do protocolo, se a escolha é exigida pela norma de relato, recomendada por um manual de condução ou
    livre.
- (projeto `roda_aromas_ceara`, 15/11/2026) A `submit_protocol_for_approval` aprovou (3/3) e travou um protocolo
  com `[TBD]` em F0.1.6 a F0.1.9 (autores, instituição, financiamento, conflito de interesses), deixados em branco
  por decisão do pesquisador. A P1 (esqueleto genérico) não impediu a trava: o protocolo manteve os títulos do
  esqueleto e pôs dentro deles os campos do modelo do escopo.
- (linha 11, 19/11/2026) Visto ao fazer a linha, sem avaliação:
  - repositório DSpace sem `restApi` no catálogo tenta antes a API em `/server/api`; quando o servidor não responde, as
    novas tentativas do `fetchWithRetry` custam até cerca de 90 s antes da página de busca (a UFC levou 52 s);
  - a UFC alternou entre responder e fechar a conexão (`ECONNRESET`, também pelo curl) na mesma hora;
  - no catálogo, a UECE (`BR-EST-0006`) está com `institution.type` "federal";
  - para "cajuína", o IFCE devolve 1 registro, cujo título não traz a palavra ("Construção de uma perspectiva de ensino
    interdisciplinar…"); é o que a busca do site devolve.
- (projeto `roda_aromas_ceara`, 19/11/2026) Visto ao retomar o projeto, sem avaliação:
  - o `project_state.json` guarda em `topic` a pergunta de 12/11 (cajuína e bebidas do pedúnculo); o protocolo
    travado em 15/11 tem outra (só a cajuína). Nada atualiza o campo depois da `plan_research_protocol`;
  - a spec (RV-01) diz que o protocolo travado só muda por emenda registrada no `change_log`, e a skill
    `prisma-rigor-gates` lista `change_log.md` como suplemento, mas nenhuma tool cria ou confere a emenda. O
    projeto pode precisar de uma: UECE, Alice e Infoteca-e estão no protocolo e a linha 11 as marcou como não
    pesquisáveis.
- (projeto `roda_aromas_ceara`, 19/11/2026) `src/utils/http.ts`, com `acceptSelfSigned: true` por padrão, põe
  `NODE_TLS_REJECT_UNAUTHORIZED = "0"` no processo inteiro durante o pedido: a verificação do certificado fica
  desligada também para pedidos simultâneos.
- (linha 14, 19/11/2026) O `heal_repositories` muda o catálogo do sistema e está entre as tools do `librarian`, agente
  do projeto.
- (linha 15, 19/11/2026) O `importRis` grava `provenanceSource: "Local File Import"` quando não há base declarada nem
  tag `DB` (já anotado na linha 2); o `repositoryName` continua vazio nesse caso, e o gate reprova.
- (linha 16, 20/11/2026) O `import_bvs_export` grava pelo mesmo `appendRawRecords` sem `manterTodosDoLote`: dois
  registros distintos do mesmo export BVS com o mesmo DOI continuam virando um.
- (projeto `roda_aromas_ceara`, 20/11/2026) Pedido do Vicente, sem avaliação: quando o protocolo indicar uma busca que
  o pesquisador faz à mão na interface da base (Portal CAPES), o ReviewBR lhe entrega, antes da busca, o roteiro do que
  fazer e anotar naquela base, adaptado a cada base já conhecida. Exemplos: no Web of Science, as edições da Coleção
  principal e os anos de cada uma; no EBSCOhost, as bases marcadas juntas; em todas, plataforma e acesso, onde se
  digita, texto exato, filtros e expansores, total mostrado, formato e campos da exportação, data. Hoje nenhuma skill,
  agente ou tool fala de busca manual (conferido em 20/11 em `.claude/skills`, `.claude/agents` e
  `reviewbr-mcp/src`), e o `import_dataset_ris` grava a Query como "Indefinido". O que se viu: a anotação de 19/11 do
  projeto, escrita pelo Claude a partir das telas, ficou sem o período que cada base cobre, que o protocolo do
  projeto pede ("lido na própria fonte no dia da busca"), e sem as edições do Web of Science. Liga-se ao item de
  15/11/2026 sobre onde ficam o texto exato, a base e a plataforma da busca feita à mão. Origem: "Orientar tudo o que
  for necessario de ser realizado para as buscas manuais quando for indicada. Esse detalhe deve se adaptar para as
  buscas conhecidas que devem ser feitas manualmente com o apoio do reviewbr."
