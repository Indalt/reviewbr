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

**Última verificação:** 19/11/2026 — repositório limpo; build e suíte 552 de 552; backlog válido, 0 abertos; fila:
linha 10 a fazer, ainda sem definição do que testar; 36 itens no "Visto de passagem", entre eles a conferência do
passo A do `roda_aromas_ceara`.

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
| 10 | Fase de testes | — | — | a fazer; é a única linha que resta |

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
  O projeto espera o conserto de F7 e F8 antes da busca formal (decisão do Vicente):
  - F1 `search_openalex`: o campo URL vem "undefined" em todos os itens; item sem DOI fica sem link;
  - F2 `search_openalex`: mostra 10 resultados e diz que o resto foi salvo em JSON, mas sem `projectPath` nada é
    gravado;
  - F3 `search_openalex` e `search_repository`: nenhuma devolve resumo;
  - F4 `search_repository` sem `repositories` (todos os ativos): 1800 s sem resposta, abortada;
  - F5 `search_papers_optimized`: UFPI, Unifesp e UFCG devolvem registros sem relação com a string, e a contagem
    soma esses registros; os da BDTD vêm sem data e sem resumo;
  - F6 `search_repository` na BDTD: URLs de registros da USP vêm com espaço ("bdtd.ibict.br/vufind /Record/...");
  - F7 `search_repository` na UFC (BR-FED-0004), UECE (BR-EST-0006), Alice (BR-RES-0001) e IFCE: zero até para
    "caju", sem aviso, e a BDTD devolve handles desses repositórios sobre caju. No catálogo, UFC e UECE estão
    `status: active` com `oaiPmh.available: false` e sem `searchEndpoints`. Reconferido pelo coordenador em
    12/11/2026 (UFC + "caju" → 0);
  - F8 `search_scielo`: zero para "queijo coalho" e "cashew apple aroma"; 15 registros quase sem relação para
    "caju", enquanto o OpenAlex traz artigos SciELO (DOI 10.1590) sobre esses temas.
- (projeto `roda_aromas_ceara`, conferência de 19/11/2026, a pedido do Vicente, passo A do projeto; nada foi
  consertado) Reprodução pelas tools do ReviewBR, com controle positivo dentro da própria ferramenta (BDTD e OpenAlex):
  - F7 — continua real na UECE, na Alice e no IFCE: zero para "caju", sem aviso. A UFC deixou de falhar: 5
    resultados para "cajuína" pelo `html-scraper`, os mesmos handles que a BDTD devolve (riufc/67712, 80267, 58951).
    Controle: para "cajuína", a BDTD devolve registros da UECE (siduece id=96019 e 84564) e da Alice (doc/1152668); o
    IFCE ainda não tem controle. Causas no código:
    (a) `strategy.ts:94-113` usa o OAI-PMH como busca: colhe os primeiros `maxResults × 3` registros do acervo e
    filtra só esses;
    (b) `strategy.ts:309` compara `platform === "dspace"`, mas as 79 entradas DSpace do catálogo dizem "DSpace", então
    a API REST do DSpace 7 nunca é tentada (o `validate_repository` a detecta no IFCE);
    (c) o `html-scraper` tenta só caminhos do DSpace 5/6 na raiz do catálogo, mas Alice e Infoteca-e ficam em `/alice`
    e `/infoteca`; a UECE nem é DSpace (`trabalhoAcademicoPublico.jsf`);
    (d) toda falha vira lista vazia (`catch { return [] }`), e o `validate_repository` marca "✅ Busca: sem
    resultados" (`index.ts:1585`).
    O conserto exige: a busca sem a colheita parcial; a comparação sem diferença de maiúscula; o endereço de busca
    certo de cada repositório no catálogo; aviso explícito quando nenhum método funcionou, e o ✅ só com resultado.
    Cada um com teste de controle positivo.
  - F8 — real: "cajuína" e "cajuina" dão 0 no `search_scielo`, mas o `search_openalex` traz dois artigos SciELO com
    "cajuína" no título (10.1590/fst.25520; 10.1590/s0100-40422007000500017). Causa: o `search_scielo` não consulta o
    SciELO. Ele consulta o OpenAlex filtrado por `publisher_lineage:P4310312277` (`index.ts:2052`), e as revistas do
    SciELO têm editora própria. O "Total encontrado na base" é o do OpenAlex com esse filtro. O `ScieloAdapter`
    (ArticleMeta) do `search_repository` também só filtra os primeiros registros. O conserto exige escolher a fonte
    (a busca do próprio SciELO, ou o OpenAlex com um filtro que pegue as revistas do SciELO, como o prefixo 10.1590,
    que cobre só o Brasil) e um teste com este controle.
  - F3 — real: o mapeamento do OpenAlex (`snowball.ts:219-235`) não lê `abstract_inverted_index` nem o endereço (a F1
    é o mesmo ponto), então nem o JSON gravado em `01_raw` tem resumo. O `html-scraper` grava `description: ""`
    (`html-scraper.ts:171`). Pelo protocolo travado (F4.1.2), registro sem resumo vai para a leitura humana: iria
    todo registro dessas fontes. O conserto exige montar o resumo a partir do índice invertido, e o endereço. No
    scraper, exige ler a página de cada item (o `getItemMetadata` já lê `DC.description`), uma requisição por item.
  - Infoteca-e — o `inactive` está velho: vem do commit `9943f66` (26/02/2026), sem motivo registrado, e hoje o
    `validate_repository` dá conexão HTTP 200 e OAI-PMH respondendo. Nomeada em `repositories`, ela é consultada
    mesmo inativa e dá 0 para "cajuína", pelas causas (a) e (c) da F7. O controle é só indireto: o OpenAlex traz
    documentos da Embrapa intitulados "Cajuína" (2004 a 2009), mas sem endereço (F1). O conserto exige o da F7 e,
    depois dele, a entrada `active`.
  - UFPI (F5) — real: 0 para "cajuína" e "cajuina", sem aviso. O `validate_repository` dá "fetch failed" na conexão e
    no OAI-PMH e mesmo assim marca a busca com ✅. O sintoma de 12/11 (registros sem relação com "perfil sensorial
    caju") vem do `matchesQuery` (`strategy.ts:322-339`): basta uma palavra da string, aplicada sobre a colheita
    parcial (a). Não há controle positivo do servidor da UFPI pelas tools, e a consulta direta ao site foi barrada
    pelo modo automático. O conserto exige (a) e (d) da F7 e outra regra de casamento (todas as palavras; acento).
  - Dois revisores humanos — real: nenhuma tool grava, por registro, a decisão de um revisor nomeado. A
    `record_researcher_decision` grava uma decisão por etapa, sem revisor nem registro; o `screen_candidates` é
    triagem por IA. A `compararCorridas` (`screening_audit.ts:161`) calcula concordância e kappa entre duas triagens,
    mas nada a chama. O protocolo travado exige as decisões dos dois "gravadas no próprio projeto, com o nome de
    quem decidiu", e o consenso com o motivo. Isso bloqueia o passo D do projeto, não o C. O conserto exige uma
    capacidade nova: decisão por registro, revisor e estágio; consenso com motivo; o funil lendo o consenso.
  - Zero incluídos — a trilha aceita. Num projeto de teste (5 registros, 0 incluídos), o `compute_flow_counts`
    valida (`included` 0, conferência cruzada certa) e o `export_dataset` exporta 0 registros. Nenhuma regra dos
    métodos exige um mínimo. A skill do manuscrito não fala desse caso. Nada a consertar no código.
  - Visto na conferência, sem avaliação: para "cajuína", a BDTD devolve entre os 20 primeiros registros sem relação
    ("amor livre", biossurfactantes, assentamentos), que entram na contagem. E o `search.ts:26` põe na camada 2 todo
    repositório inativo, então o `search_papers_optimized` com a camada 2 também consulta os inativos.
  - Origem (git blame, 19/11): as causas acima são anteriores à manutenção. A camada de acesso vem do commit
    `28222ed` (03/03/2026); o mapeamento do OpenAlex, o filtro do SciELO e o "DSpace" do catálogo vêm do `9943f66`
    (26/02/2026). Nenhuma tool da trilha saiu; a única removida desde julho, a `screen_with_asreview` (DEBT-022,
    08/10/2026, com autorização do Vicente), não produzia decisão de triagem. A suíte passa porque não consulta as
    fontes reais.
- (projeto `roda_aromas_ceara`, 12/11/2026) No escopo, a avaliação crítica das fontes não tem onde ser registrada
  na trilha: com a condição `avaliacao_critica` = "sim", os itens 12 e 16 do PRISMA-ScR ficam `[NÃO COBERTO]`
  (o que ficou declarado ao resolver o DEBT-151). O projeto respondeu "não", mas o Vicente pediu o registro: "essa
  limitacao de falta de lugar para registrar tem de ser registrada para o agente de manutencao".
- (projeto `roda_aromas_ceara`, 12/11/2026) Incoerências vistas na F0/F1 do mesmo projeto, ao gerar o protocolo de
  escopo. Reprodução em `reviewbr/projects/roda_aromas_ceara/protocolo_falhas_reviewbr.md` (P1 a P8):
  - P1 `plan_research_protocol` gera um esqueleto genérico, e não o `protocol_template.md` do método; o
    `protocol_auditor.ts` lê os títulos desse esqueleto;
  - P2 o esqueleto já vem com valores que o pesquisador não deu ("Idiomas: Sem restrição", "Global", fontes PubMed
    e BVS);
  - P3 o esqueleto e o auditor citam itens do PRISMA 2020 (24a, 8) num método que declara PRISMA-ScR e PRISMA-S;
  - P4 a entrada do PRISMA-ScR no catálogo não tem data de leitura;
  - P5 e P6 `BR-AGG-0001` aparece como "IBICT — Oasisbr" (o projeto o usa como BDTD); o catálogo marca o OAI-PMH
    dele como indisponível, e a validação dá OK;
  - P7 e P8 a validação mostra OAI-PMH 404 em UFC e UECE e aprova a Alice, cuja busca falha. É a mesma F7, vista
    pela `validate_repository`.
- (projeto `roda_aromas_ceara`, 15/11/2026) Pontos de método que apareceram ao desenhar a revisão de escopo com o
  Vicente. Anotados sem avaliação; nenhum foi testado:
  - a trilha aceita uma revisão com zero estudos incluídos (funil, tabela de extração vazia, exportação,
    manuscrito)? O projeto espera pouco ou nada, e "não encontrar é um resultado";
  - o protocolo não tem campo para o motivo de cada fonte nem para o período que ela cobre (fontes escolhidas por
    relevância);
  - a busca feita à mão pelo pesquisador (Portal CAPES) e importada por `import_dataset_ris`: onde ficam o texto
    exato, a base, a plataforma, a data e a contagem no registro da busca?
  - triagem em duas camadas (por palavras, depois humana): como a camada por palavras fica registrada, e o que
    acontece com o registro sem resumo;
  - dois revisores humanos: onde se gravam as decisões do segundo e a concordância entre os dois;
  - o pesquisador perguntou "porque nao se pode seguir estritamente o que o metodo pede": o sistema não diz, em
    cada campo do protocolo, se a escolha é exigida pela norma de relato, recomendada por um manual de condução ou
    livre.
- (projeto `roda_aromas_ceara`, 15/11/2026) A `submit_protocol_for_approval` aprovou (3/3) e travou um protocolo
  com `[TBD]` em F0.1.6 a F0.1.9 (autores, instituição, financiamento, conflito de interesses), deixados em branco
  por decisão do pesquisador. A P1 (esqueleto genérico) não impediu a trava: o protocolo manteve os títulos do
  esqueleto e pôs dentro deles os campos do modelo do escopo.
