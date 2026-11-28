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
9. **Acordo de condução Gemini ↔ Claude** (aprovado pelo Vicente em 26/11/2026; a proposta está no ponto 1 da seção
   "Pedido do Vicente de 25/11/2026"):
   - uma fila, esta página; em cada projeto, o `RETOMAR.md`. Documento do Antigravity (`brain/…`) é insumo, não fila,
     e a numeração dele (V-xx, R-xx, S-x, ondas, blocos) não se usa aqui;
   - uma sessão por vez escreve em `C:\reviewbr`, de qualquer modelo; sessão de pesquisa e de manutenção nunca ao
     mesmo tempo;
   - o Claude conduz a manutenção; o passo de pesquisa segue o `RETOMAR.md`, com o modelo que o prompt declara; o
     Gemini trabalha quando o Vicente passa o bastão, numa tarefa que já está aqui ou no `RETOMAR.md`, e não cria
     tarefa nem frente; agente que dirige navegador, de qualquer modelo, não abre página cujo `robots.txt` proíbe robô
     ou cujo servidor recusa robô (linha 14);
   - a regra 7 vale para todos: as ondas 1 a 3 do inventário do Gemini não se executam como estão;
   - a passagem de bastão fica no repositório (na manutenção, em "Última verificação"; na pesquisa, no `RETOMAR.md`):
     último commit e `git status`; decisões novas do Vicente, com a data e a frase dele; o único próximo passo; quem
     assume e o que fica intocado.

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

**Última verificação:** 28/11/2026, linha 25 feita (Hipótese A): os seis agentes de etapa se fundiram no
coordenador, depois de as sete tools que só uma lista `tools:` prendia entrarem na trilha — build e suíte 744 de 744;
audit válido, 0 achados abertos; gate CORRECAO válido nas duas partes; fila: linha 10 em curso, 22 e 26 a 30 a fazer;
53 itens no "Visto de passagem". `git status`: só os 17 arquivos rastreados do `roda_aromas_ceara` como apagados
(nenhum commit grava essa deleção). Decisões novas do Vicente: nenhuma. **Atenção para a pesquisa:** os dois
`manifest.json` mudaram (etapa das sete tools e `role`), e a trava 3 faz as tools de etapa de um projeto travado
recusarem até a emenda de migração (`record_protocol_amendment`, `migracao: true`), aprovada pelo pesquisador.
**Próximo passo:** a linha 22 ou a 26, à escolha do Vicente. Assume: o Claude, na manutenção. Intocado: a pasta
`C:\roda_aromas_ceara` (esta sessão não a leu nem gravou).

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
| 13 | K — Decisões dos dois revisores humanos | ver abaixo | — | **feita em 23/11/2026** (commits `aa25eed`, `d01def1`, `3637cc1`, `4bc0ae3`, `7cf56d7`, `2a8297e` e o do fechamento): `verify_record_links` e `record_screening_decisions` (formulario, importar, consenso, gerar); detalhe na seção "Pedido do Vicente de 23/11/2026", (2) |
| 14 | L — Acesso por robô: conferência jurídica e ética (UECE, Alice, Infoteca-e) | User-Agent identificado | `CONFERENCIA_acesso_2026-11-19.md` | **feita em 19/11/2026**: robots.txt respeitado; UECE, Alice, Infoteca-e e UFC pela Oasisbr, declarando onde se viu |
| 15 | F9 — importação de várias bases em `01_raw` | ver abaixo | — | **feita em 19/11/2026** |
| 16 | F10 e F11 — importação de RIS: linha de continuação, CR sozinho e registros distintos da mesma base | ver abaixo | — | **feita em 20/11/2026** |
| 17 | Protocolo travado na busca: a execução segue só o protocolo, e o que muda é emenda | ver abaixo | ver abaixo | **feita em 20/11/2026** (commits `9c4cff2`, `3a25e69`, `7dc2d85`, `73f6380`, `b5496a1`, `7dfb6e1`) |
| 18 | BDTD e Oasisbr separadas; a Oasisbr inteira buscável | — | — | **feita em 21/11/2026** (pergunta e decisão do Vicente no mesmo dia; item tirado do "Visto de passagem"): `BR-AGG-0001` é a BDTD, como a busca sempre fez; a Oasisbr é `BR-AGG-0006`, buscada sem filtro de rede; os quatro `viaAgregador` apontam para ela. Emenda 2 do `roda_aromas_ceara` aprovada (protocolo 1.2, 12 fontes). Em 21/11 o DNS do `ibict.br` falhava (8.8.8.8 e 1.1.1.1): controle positivo da Oasisbr inteira fica para a busca |
| 19 | Fonte inventada e retratação, desde a busca exploratória | ponto 4 da seção "Pedido do Vicente de 25/11/2026" (4.1 a 4.3) | — | **feita em 27/11/2026**: tool `verify_references`; detalhe em "Linha 19", logo antes de "Linha 23" |
| 20 | Legado Go do prismAId e sobras para `old/` | — | ponto 5 e o bloco de 26/11 da mesma seção: o que vai, e um arquivo rastreado que lista o que foi para `old/` e o último commit de cada coisa | **feita em 27/11/2026**: 56 `.go`, `go.mod`, `go.sum`, `src/index.ts.tmp`, os dois `src/run_search_*.ts` (com os compilados), `reviewbr-web/`, o `.zip` e `antigravity_conversas_export/` em `old/legado_2026-11-27/`; lista rastreada em `LEGADO_em_old.md` (84 caminhos com o último commit); os dois `package.json` em `AGPL-3.0-only` ("5 ok para agpl", 26/11); `README.md`, `GUIA.md` e `DICIONARIO_modos_de_acao.md` deixam de apontar para o `reviewbr-web`; exceção do DEBT-103 tirada do teste de integração; `tests/licenca_legado.test.ts` (2, falham antes) |
| 21 | `METODO_ReviewBR.md` e `maintainer.md` | — | pontos 7.1, 7.2 e 6.5 da mesma seção | **feita em 27/11/2026**: o `METODO_ReviewBR.md` ficou só com as regras, numeradas (1.1 a 6.2, P1 a P11); os nove blocos "Hoje" saíram (a última versão com eles é a do commit `17af311`); a origem de cada regra foi para o anexo A, e os doze canônicos para o anexo B, "resumo do agente; obra não lida"; nenhuma linha de origem num autor entrou numa regra, porque nenhuma obra foi conferida. `maintainer.md`: L28 com o texto do P9; o RAISE 3 deixa de ser classificação em uso (L35-40 reescritas, L231); a leitura documentada vale só para o mapeamento das cinco normas já transcritas; L380-385 como estavam. Gate CORRECAO; suíte 704 de 704. Não mudou o servidor |
| 22 | Investigação: DataCite, OpenAIRE Graph, OSF, ASReview v2 e a camada do 4.4 | — | — | **a fazer** (aprovada em 26/11/2026): só leitura, na fonte oficial; nem todos são fontes de busca de artigo |
| 23 | Procedência que o sistema não confere: registra a limitação, e a pesquisa segue | ponto 3 da segunda resposta de 26/11, na seção "Pedido do Vicente de 25/11/2026" | os textos do `verify_record_links`, da `record_screening_decisions`, da skill `screening-rules` e do `screener` | **feita em 26/11/2026** (commit `6125977`): detalhe em "Linha 23", logo antes de "Como uma linha entra na fila" |
| 24 | Travas em código por etapa: decisão antes da etapa, ordem e insumo, sistema e sessão presos ao projeto | pontos 6.2 e 6.3, reescritos em 26/11, com as condições da segunda resposta | — | **feita em 28/11/2026**: travas 1 e 2 em 27/11, trava 3 em 28/11 depois da aprovação do Vicente (detalhe em "Linha 24", logo antes de "Linha 19") |
| 25 | Hipótese A: os agentes de etapa num coordenador, com o `maintainer` à parte | ponto 6.4 | — | **feita em 28/11/2026** (commits `2d83e43` e o seguinte): sete tools entraram na trilha antes da fusão; os seis agentes de etapa em `old/agentes_2026-11-28/`; detalhe em "Linha 25", logo antes de "Linha 24" |
| 26 | Ressalvas das tools: rede e repositórios | ponto 8, grupo 1 da lista de 26/11 | — | **a fazer**: começa conferindo cada item no código |
| 27 | Ressalvas das tools: coleta e importação | ponto 8, grupo 2 | — | **a fazer**: começa conferindo cada item no código |
| 28 | Ressalvas das tools: protocolo e estado | ponto 8, grupo 3 | — | **a fazer**: começa conferindo cada item no código |
| 29 | Ressalvas das tools: texto completo | ponto 8, grupo 4 | — | **a fazer**: começa conferindo cada item no código |
| 30 | Ressalvas das tools: método e IA | ponto 8, grupo 5 | — | **a fazer**: começa conferindo cada item no código; depois da 24 e da 25 |

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

> **Decidido pelo Vicente em 23/11/2026:** a linha 13 grava só as decisões da pesquisa que o protocolo manda e que
> o artigo relata, isto é, os itens 1 a 3. **O item 4 sai** (a concordância entre os revisores; o protocolo não a
> pede). Consequência: a linha fica pronta quando grava por registro a decisão de cada revisor, o consenso e a
> decisão do pesquisador sem consenso, e gera os artefatos do funil. Origem: "acho que podem apenas relativas a
> pesquisa e que precisam estar no artigo porque o protocolo manda".

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

### Linha 17 — protocolo travado na busca (diagnóstico de 20/11/2026; o conserto espera o Vicente)

> **Mandado fazer pelo Vicente em 20/11/2026, antes da pesquisa.** A execução da F2 segue só o que o protocolo
> travado pede, e o que mudar nele passa por emenda aprovada pelo pesquisador. Consequência: o `roda_aromas_ceara`
> fica parado até o conserto. A linha junta três itens que estavam no "Visto de passagem":
> - (19/11) a spec diz que o protocolo travado só muda por emenda registrada no `change_log` (RV-01), e nenhuma tool
>   cria ou confere a emenda;
> - (20/11) a F2 do projeto se afastou do protocolo de dois modos: o período de cobertura pedido não foi anotado nas
>   três bases da CAPES, e cinco fontes (SciELO, Alice, Infoteca-e, UFC e UECE) mudaram de caminho em 19/11 sem
>   emenda. Caso real em `reviewbr/projects/roda_aromas_ceara/change_log.md` (emenda 1 proposta, desvio 1);
> - (20/11) o roteiro da busca feita à mão, entregue antes da busca e adaptado a cada base conhecida.
>
> Origem: "isso nao deveria ter acontecido com o protocolo travado. isso é mais importante que a pesquisa neste
> momento. depois de resolver voltamos para a pesquisa de acordo com o protocolo"; "Orientar tudo o que for
> necessario de ser realizado para as buscas manuais quando for indicada. Esse detalhe deve se adaptar para as buscas
> conhecidas que devem ser feitas manualmente com o apoio do reviewbr."

**Diagnóstico 1 — por que a execução se afastou sem o sistema parar.** A trava protege o momento, não o conteúdo:
nada se busca antes de travar, mas depois da trava nada no código lê o protocolo, nada guarda o que ele usava no dia
da trava, e a emenda existe só como frase da spec (`prisma-sr/spec.md:60` e `:454`).

| quem, na F2 | o que lê do protocolo travado |
|---|---|
| `ProtocolGate` (`protocol_gate.ts:77`), em toda tool de busca e de importação | só o `status` do `project_state.json`. Com LOCKED, passa qualquer fonte, texto, filtro e rota |
| `submit_protocol_for_approval` (`index.ts:1670`) | os títulos das seções, na hora de travar. Não guarda o hash do `protocol.md` nem a rota de cada fonte: depois da trava, o arquivo pode ser editado sem que nada perceba |
| `search_repository` | nada; fonte e texto vêm do agente. A rota sai do catálogo na hora (`strategy.ts:99`; e `strategy.ts:195` vai ao agregador quando a busca direta falha). O log grava "Repositórios" e o id, sem a rota (`index.ts:1390`) |
| `search_scielo`, `search_openalex` e as outras `search_*`; `search_papers_optimized` | nada; o `search_papers_optimized` busca por camada, que o protocolo não usa |
| `import_dataset_ris` (busca à mão) | nada; recebe o RIS e o nome da base, e o log grava o texto como "Indefinido" (`index.ts:1043`). Ninguém pede, antes ou na importação, o que o protocolo manda anotar |
| `heal_repositories` (está com o `librarian`) | nada; reescreve o catálogo do sistema (`repository_healer.ts:94`) no meio de um projeto |
| `record_researcher_decision` · `audit_methodology` | nada; a primeira grava decisão por etapa, sem tipo "emenda"; a segunda roda depois do projeto feito |
| agente `librarian` | só as strings (passo 1). Não lê a tabela de fontes ("Como se busca"), o período de cobertura nem os controles; o passo 5 manda perguntar a camada de escopo, que o protocolo já respondeu com a lista de fontes |
| skill `prisma-s-logging` | nada; diz que a importação grava o texto como "Indefinido" |
| skill `conduct-review` | o status. "Ao menor sinal de fuga, pare e pergunte" é conduta (linha 57); o gate da F2 é "log e `01_raw/` preenchidos" (linha 83) |
| skill `prisma-rigor-gates` | RV-01 = só a trava antes da busca (linha 14); RV-07 `[NÃO COBERTO]` (linha 20); os subitens da F2 ficam com o agente (linha 29); o `change_log.md` é suplemento do fim (linha 55) |
| skill `methodology-router` | nada; lê o `manifest.json` e a `spec.md` |

O que a manutenção pode mudar e um protocolo travado usa, sem que o projeto saiba (nada no projeto grava contra que
versão do sistema ele travou):
- o catálogo de repositórios (`reviewbr-mcp/data/sources/*.json`): estado, endereços, API, `searchable`,
  `viaAgregador`. O protocolo nomeia a fonte pelo id (`BR-RES-0001`), e o caminho atrás do id muda. Foi o caso: os
  commits `4936c59` e `ba21610` (19/11) mudaram Alice, Infoteca-e, UFC e UECE depois da trava (15/11);
- o código das tools: a rota (o `search_scielo` passou ao OpenAlex com o prefixo 10.1590 em 19/11), a cascata e a
  reserva pelo agregador, o `robots.txt`, a regra de casamento, o que a importação grava;
- a spec, o manifest, o mapeamento e o modelo de protocolo do método; os textos dos agentes e das skills; o catálogo
  de metodologias (fonte e data de leitura que o protocolo cita).

**Proposta 2 — conserto mínimo.** A parte de busca do protocolo vira dado, aprovado pelo pesquisador e congelado na
trava; cada execução, por tool ou à mão, é conferida contra esse dado na hora; o que diverge para, e só volta por
emenda ou desvio gravado por tool, com a aprovação do pesquisador.

FAZER (cada item com teste que falha antes e passa depois; o caso do `roda_aromas_ceara` copiado para o teste, sem
gravar na pasta do projeto):
1. **Plano de busca na trava.** O `designer` escreve, a partir do protocolo, o plano de busca como dado: por fonte, o
   modo (tool ou à mão), a tool, o id do catálogo, a rota que o sistema dá hoje, os textos exatos, os filtros e o que o
   protocolo manda registrar em cada busca. O `submit_protocol_for_approval` não trava sem o plano, mostra-o ao
   pesquisador e congela no `project_state.json` o plano e o hash do `protocol.md`.
2. **A busca confere o plano.** Sob projeto LOCKED, as tools de busca e de importação recusam, dizendo o quê:
   `protocol.md` diferente do da trava; fonte, tool ou id fora do plano; texto diferente do texto exato da fonte (a
   RV-07 deixa de ser `[NÃO COBERTO]`); filtro fora do plano; rota de hoje diferente da do plano (catálogo, código ou
   `heal_repositories`). Usa só a rota do plano, sem cascata nem agregador de reserva: se ela falhar, a fonte fica não
   alcançada, com o motivo. O que o plano manda registrar e a tool não produz (o período de cobertura) entra como
   parâmetro, com o lugar onde foi lido, ou declarado como não obtido. A recusa e a rota entram no log de busca.
3. **Emenda e desvio por tool.** Uma tool grava no `change_log.md` e no estado a emenda (o que muda no protocolo,
   antes e depois, por quê) e o desvio (o que a execução fez diferente, sem mudar o protocolo). A emenda nasce
   proposta e só vale com a aprovação do pesquisador nas palavras dele (recusa carimbo, como a
   `record_researcher_decision`); aprovada, renova o plano e sobe a versão (1.0 → 1.1). O `protocol.md` travado não se
   edita.
4. **Busca à mão.** Antes da busca, uma tool devolve, do plano, o roteiro de cada base feita à mão: o texto exato, os
   filtros e o que anotar. Sob projeto LOCKED, `import_dataset_ris` e `import_bvs_export` exigem o que o plano manda
   anotar e conferem o texto exato; campo não anotado entra declarado, com o motivo, como desvio. O log grava o texto
   exato (deixa de ser "Indefinido"), a plataforma, a data da busca e o total mostrado.
5. **A F2 só fecha** (`podeAvancar`) com cada fonte do plano executada ou com desvio registrado.

DECLARAR:
1. `librarian.md`: o passo 1 lê o plano travado, não só as strings; o passo 5 (camada de escopo) não vale em projeto
   travado.
2. `maintainer.md`: a manutenção pode mudar a rota no catálogo ou numa tool; o projeto travado não muda junto: para
   na próxima busca e pede emenda.
3. RV-01 e RV-07 (`prisma-rigor-gates`, `manifest.json` dos dois métodos), `prisma-s-logging` e o gate da F2 no
   `conduct-review` passam a dizer o que o sistema confere depois do conserto.
4. Limite: a busca à mão acontece fora do sistema; a importação grava o que o pesquisador declara, e o sistema não
   confere a tela. Busca sem `projectPath` segue exploratória, sem conferência (já declarado em `protocol_gate.ts:31`).

Não fazer: ler a prosa do protocolo por código (o plano é dado, escrito pelo `designer` e aprovado pelo
pesquisador); tirar o `heal_repositories` do `librarian` (é outro item do "Visto de passagem"; o item 2 já para o
projeto quando o catálogo muda); decidir a emenda 1 e o desvio 1 do projeto.

Consequência para o `roda_aromas_ceara`: travado antes do conserto, não tem plano e não busca até o Vicente aprovar,
pela tool do item 3, o plano com as rotas de hoje (é a emenda 1) e decidir o desvio 1.

**Decidido pelo Vicente em 20/11/2026, ao ler o diagnóstico:** os controles e as regras desta linha valem para todo
protocolo e para toda fonte que um protocolo nomear, não para os exemplos do caso (Scopus, Web of Science,
EBSCOhost). Consequência: não há roteiro nem regra por base; o roteiro e as conferências saem do plano de cada
protocolo. O objetivo do ReviewBR é oferecer os protocolos possíveis e garantir a execução de cada um; enquanto essa
garantia não existir, não faz sentido seguir com manutenção em cima de manutenção. Ele registrou, como impressão, que
o trabalho se desvia desse objetivo há tempo. Origem: "controles e regras nao valem apenas para os exemplos citados.
(Scopus, Web of Science, EBSCOhost) tem de valer para todos os protocolos. o reviewbr deve ser uma ferramenta que
disponibiliza todos os protocolos possiveis e garante a sua execucao. nao faz sentido fazer manutencao em cima de
manutencao se isso nao esta garantido. estamos desviando dos objetivos centrais faz tempo. essa é uma impressao".

**Conserto aprovado pelo Vicente em 20/11/2026**, para rodar depois das 15h30 (depois do reset da janela de 5 h).
Origem: "agende o conserto 15h30 e pode executar apos esse horario aqui mesmo nesta sessao".

**Estado da execução** (atualizar a cada item feito, com o commit):
- FAZER 1 feito em 20/11/2026: `src/services/plano_busca.ts` (forma, validação, rota de hoje por fonte, hash);
  `rotaPrimaria` no `strategy.ts`; o `submit_protocol_for_approval` recusa sem `plano_busca.json` válido e congela o
  plano em `project_state.json` (`trava_busca`); `designer.md` passo 4. Teste: `tests/plano_busca_trava.test.ts`, com o
  caso real em `tests/fixtures/roda_aromas_ceara/`.
- FAZER 2 feito em 20/11/2026: `conferirExecucao` no `plano_busca.ts`, chamada pelo `checkDesignGuardrail` nas 13 tools
  de busca e de importação (`TOOLS_DE_BUSCA`); a recusa entra no log; `registroDaBusca` nas 13 e `textoExato` nas duas
  de importação; `somentePrimaria` no `strategy.ts` (sem cascata nem agregador de reserva); a fonte do plano e a rota
  vão ao log, e a execução fica em `trava_busca.execucoes`. Teste: `tests/plano_busca_execucao.test.ts` (10 de 10
  falhavam antes).
- FAZER 3 feito em 20/11/2026: tool `record_protocol_amendment` (`src/services/emendas.ts`), papel PROJETISTA e
  COORDINATOR (`designer.md` com a tool). Emenda proposta → aprovada ou recusada com as palavras do pesquisador; aprovada,
  sobe a versão e congela o plano de novo; desvio registrado. Tudo anexado ao `change_log.md` e guardado no estado.
  Teste: `tests/emendas.test.ts`.
- FAZER 4 feito em 20/11/2026: tool `get_search_plan` (roteiro de cada fonte, só do plano; papel PROJETISTA, LIBRARIAN e
  COORDINATOR, nos dois agentes); as importações gravam o texto exato na coluna Query, com a fonte do plano e o
  `registroDaBusca`; campo "não obtido: <motivo>" vira desvio do sistema (`desviosDeCamposNaoObtidos`). Teste:
  `tests/busca_a_mao.test.ts` (5 de 5 falhavam antes).
- FAZER 5 feito em 20/11/2026: `podeAvancar` não fecha a etapa do plano com fonte sem execução terminada nem desvio, em
  qualquer nível de controle. Projeto travado sem plano não tem essa conferência, mas também não busca até o plano
  entrar por emenda. Teste: `tests/plano_busca_fecha.test.ts` (3 de 3 falhavam antes).
- DECLARAR 1 a 4 feitos em 20/11/2026: `librarian.md` (passos 1, 3 e 5), `maintainer.md` (seção "Projeto travado não
  muda com a manutenção"), RV-01 e RV-07 na `prisma-rigor-gates` e nos dois `manifest.json` (a RV-07 ganhou gate e saiu
  de `invariants_sem_gate`), `prisma-s-logging` e `conduct-review` (gate da F2 e guardrail 4); o limite da busca à mão
  está no `librarian.md` e na `prisma-s-logging`.
- **Linha feita.** Suíte 622 de 622 (592 antes; 30 testes novos em cinco arquivos), build e audit válidos. Para o
  `roda_aromas_ceara`: em chat novo (servidor novo), o projeto propõe a emenda 1 com o plano de busca pela
  `record_protocol_amendment`, o Vicente a aprova ou recusa nas palavras dele, e o desvio 1 entra pela mesma tool.

### Pedido do Vicente de 23/11/2026 — o que trava a F4 do `roda_aromas_ceara` (diagnóstico; o conserto espera o Vicente)

> Pedido: "Rotina de manutenção. Depois, só o que trava a F4 do projeto roda_aromas_ceara, nesta ordem: (1) o item do
> 'Visto de passagem' de 23/11/2026 sobre a camada mecânica da triagem (…); (2) a linha 13 da FILA, com o alcance
> decidido pelo Vicente em 23/11/2026 (itens 1 a 3; o item 4 sai). Diagnostique e mostre-me antes de consertar."
> Nada foi consertado. Os números abaixo vêm de leitura do `02_deduplicated/dataset.json` (5446), sem gravar no projeto.

**(1) Camada por palavras — diagnóstico.**
- Nenhuma tool a faz. O `batch_keyword_screen` (`index.ts:2676`, `batch_processor.ts:59`) lê PDFs de uma pasta e casa
  por trecho (`includes`), sem curinga. O `batch_db_screen` (`index.ts:2724`) lê o banco por `projectId`, sem curinga,
  sem palavras-chave e sem a regra do registro sem resumo. Nenhum dos dois grava artefato do funil.
- O funil não tem lugar para a camada. O `compute_flow_counts` conta como excluído na triagem só
  `03_screening/excluded_ta.json` (`flow_computer.ts:75`), o mesmo arquivo que a leitura humana grava (linha 13), e o
  `writeScreening` recusa a segunda gravação sem autorização (DEBT-112). O insumo da triagem humana é o
  `02_deduplicated/dataset.json` (`index.ts:761`, `screening_metrics.ts:48`), não o que passou pelas palavras.
- **As palavras-chave quase não estão no dataset: 50 de 5446** (Scopus 22 de 23, FSTA 5 de 5, BDTD 23 de 23).
  - Oasisbr (2941, contando Alice, Infoteca-e e UFC vistas por ela): devolve `subjects` vazio e guarda as
    palavras-chave em `topic`. O campo `topic` da API traz só a primeira; a lista inteira está no `rawData` do
    registro (conferido hoje no registro `SBQ-3_c22ff270…`: "cashew juice", "cajuina", "vitamin C"). O adaptador do
    VuFind pede só `subjects` (`platform-adapters.ts:266` e `:500`). Na BDTD, `subjects` vem preenchido.
  - UFPI (41, DSpace REST): o registro gravado não tem o campo. Não conferido se a fonte o dá.
  - OpenAlex (2413): o registro gravado não tem o campo; o OpenAlex não traz as palavras-chave do autor (as `keywords`
    dele são atribuídas por ele).
- Sem resumo (campo vazio): 220 (Oasisbr 78, OpenAlex 142). Outros 56 têm "resumo" com menos de 60 caracteres
  ("xx", "Poesia", "539 p. ; 2 v.").
- Ordem de grandeza, pela regra do protocolo aplicada fora do projeto: 220 passam por não ter resumo, 517 por título ou
  resumo, 4709 sairiam. Dos 4709, 4674 não têm palavras-chave gravadas. Nos 50 que as têm, nenhum passaria só por elas.

**(1) Proposta.** FAZER, cada item com teste que falha antes e passa depois:
1. O `batch_keyword_screen`, nome que o protocolo dá (F4.1.3), ganha o modo dos registros do projeto; assim não há
   emenda. Com `projectPath` e sem `pdfDir`, lê `02_deduplicated/dataset.json` e passa o registro com ao menos um termo
   no título, no resumo ou nas palavras-chave. A regra de casamento:
   - `*` no fim aceita qualquer terminação; termo sem `*` é palavra inteira (`perfil` não pega "perfis");
   - sem diferença de maiúscula nem de acento, como a busca (linha 11, item 5);
   - passa todo registro com o resumo vazio.

   Os termos entram como parâmetro, e a tool confere que cada um está escrito no `protocol.md` travado. Grava
   `03_screening/passed_keywords.json`, com o termo e o campo que passaram cada registro, ou "sem resumo". Grava
   também `03_screening/excluded_keywords.json` (motivo: nenhum termo) e o relatório: termos, regra, data, contagens e
   passados + excluídos = entrada. Regravar exige a autorização do pesquisador (regra do DEBT-112). O modo PDF não
   muda.
2. Funil: o `compute_flow_counts` soma `excluded_keywords.json` aos excluídos na triagem, porque o protocolo põe a
   camada dentro dela (F4.1.2); as duas parcelas aparecem na origem do número. Quando o `passed_keywords.json` existe,
   ele passa a ser o insumo da triagem humana (linha 13), do `screen_candidates` e do `get_screening_report`.
3. Palavras-chave da Oasisbr: o adaptador do VuFind lê a lista inteira de `topic`; o da UFPI grava o assunto, se a
   fonte o der. Nos 5446 já deduplicados, uma tool da busca (papel do `librarian`; o `screener` não baixa) completa as
   palavras-chave pelo id de cada registro, em lote, num arquivo à parte (`02_deduplicated/palavras_chave.json`, com
   fonte e data). O `dataset.json` e os totais não mudam, e a camada lê esse arquivo. O OpenAlex fica declarado como
   fonte sem palavras-chave do autor. O que não se completar fica dito no relatório da camada.

DECLARAR: o `screener.md` e a `screening-rules` dizem que a camada por palavras é o `batch_keyword_screen` sobre os
registros; a descrição da tool diz a regra de casamento.

> **Decidido pelo Vicente em 23/11/2026, ao ler o diagnóstico:** as decisões dos revisores vêm depois da camada por
> palavras, e a ordem proposta segue: primeiro o item (1). Consequência: o item (1) foi consertado nesta sessão; a
> linha 13 espera a resposta à pergunta do fim desta seção, antes de os revisores gravarem a leitura por título e
> resumo. Origem: "as decisoes sao para apos a triagem, nao? o que o protocolo manda?"; depois, "dos revisores",
> precisado na escolha "as decisões são dos revisores" (vêm depois da camada por palavras; item 1 primeiro).

**(1) Feito em 23/11/2026** (gate `validate_system_change` CORRECAO; commits `8f3466b` e `9a679aa`; suíte 644 de 644,
18 testes novos em `tests/camada_palavras.test.ts` e `tests/palavras_chave.test.ts`):
- FAZER 1 e 2: `src/services/camada_palavras.ts`; o `batch_keyword_screen` sem `pdfDir` roda a camada e grava
  `passed_keywords.json`, `excluded_keywords.json` e `keywords_report.json`; `writeScreening` aceita o estágio
  `palavras` (regravar exige autorização); o `compute_flow_counts` soma as duas parcelas; `insumoDoEstagio` dá à
  leitura por título e resumo (`screen_candidates`, `get_screening_report`) o que a camada passou.
- FAZER 3: o adaptador do VuFind pede o `rawData` na Oasisbr e lê a lista de `topic` (`palavrasChaveDoVufind`); o do
  DSpace grava todo `dc.subject`; a tool nova `complete_record_keywords` (papel do `librarian`) completa, pelo id na
  fonte, as palavras-chave dos registros já deduplicados em `02_deduplicated/palavras_chave.json`, sem mudar o
  `dataset.json` nem os totais, e declara no relatório a fonte sem consulta (OpenAlex, com o motivo). Controle
  positivo em 23/11/2026, fora do projeto: 5 ids da Oasisbr (2 da Alice vistos por ela) e 2 uuids da UFPI devolvem as
  palavras-chave.
- DECLARAR: `screener.md`, `screening-rules` e `librarian.md`.
- Para o projeto, em chat novo (servidor novo): `complete_record_keywords` e depois `batch_keyword_screen` com os
  termos do protocolo.

**(1) Conferido contra o protocolo em 23/11/2026, a pedido do Vicente** ("tudo dentro do protocolo? quais as palavras
chave? deterministicamente?"). Seguem o protocolo: os 21 termos copiados e conferidos no `protocol.md`; título, resumo
ou palavras-chave; registro sem resumo passa; sem amostra nem nova decisão humana sobre os excluídos; a camada contada
dentro da triagem; a tool que o F4.1.3 nomeia. É determinística: sem IA nem sorteio, os mesmos arquivos e termos dão
sempre o mesmo resultado, na mesma ordem. As palavras-chave completadas ficam gravadas com a data e não são lidas de
novo sem `refazer`. O protocolo não diz, e a tool fez assim:
- sem diferença de acento. Hoje, 4 registros com resumo passam só por isso; as fontes também buscaram assim (Oasisbr:
  2997 para `cajuína` e 2997 para `cajuina`);
- "palavras-chave" é o campo de assunto que cada fonte grava. No Scopus ele junta as do autor e os termos de indexação;
  na FSTA são descritores do tesauro; na UFPI entra a área do CNPq. O arquivo do Scopus e o da FSTA não separam as do
  autor;
- "sem resumo" é o campo vazio: os 56 com texto curto ("xx", "Poesia") contam como com resumo;
- completar as palavras-chave pela fonte depois da F3 é um passo que o protocolo não descreve; não muda a busca nem os
  totais.

**Perguntas ao Vicente (23/11/2026):** (1) manter a camada sem diferença de acento? (2) Na leitura por título e
resumo, quando o registro não permite responder às perguntas (os 220 sem resumo, por exemplo): segue para o texto
completo ou conta como "não"? O protocolo não diz. (3) A pergunta da linha 13, no fim desta seção.

> **Decidido pelo Vicente em 23/11/2026, ao ler as perguntas:** a camada por palavras segue como foi feita, sem
> diferença de acento (pergunta 1). As decisões dos revisores entram por **planilha** (pergunta 3, opção a). O
> ReviewBR gera, do insumo do estágio, a lista dos registros numa planilha por revisor. A planilha traz os campos que
> o revisor preenche e, nas primeiras linhas, o que ele tem de fazer, dito de forma objetiva. O Vicente envia a
> planilha a cada revisor, recebe de volta o arquivo preenchido e o entrega ao ReviewBR, que o importa.
> Consequência: na linha 13, o `formulario` gera planilha, não CSV de texto, e o `importar` lê a planilha
> devolvida. A pergunta (2) segue aberta e é feita antes de construir a linha 13. Origem: "ok. seguir assim, mas com
> a ressalva de que vou mandar a lista do artigos em uma planilha e nessa planilha tem de haver os campos onde os
> revisores vao preencher. assim posso enviar as planilhas e receber o arquivo digital com as decisoes dos revisores.
> as primeira linhas da planilha podem dizer objetivamente o que fazer para cada revisor."

**(2) Linha 13 — diagnóstico.** Nenhuma tool grava decisão por registro e por revisor. A `record_researcher_decision`
(`index.ts:1694`) grava uma contribuição por etapa no `project_state.json`. O `screen_candidates` (`index.ts:723`) é
triagem por IA e grava os artefatos do estágio pelo `writeScreening` (`project_artifacts.ts:295`). O funil e o relatório
de triagem leem esses artefatos (`flow_computer.ts:75-77`, `screening_metrics.ts:48`). Os itens de `included*.json` têm
a forma `{record, decision, …}`, que o texto completo e a leitura esperam (`index.ts:770`, `rag_lexical.ts:104`). Pela
estimativa de (1), a leitura por título e resumo terá cerca de 740 registros para cada revisor, cerca de 1480
decisões: uma chamada de tool por decisão não serve.

**(2) Proposta.** FAZER, numa tool nova da triagem, `record_screening_decisions` (papéis SCREENER e COORDINATOR). Ela
serve a qualquer protocolo: qualquer número de revisores e as perguntas de elegibilidade que o protocolo tiver.
1. `formulario`: gera do insumo do estágio um formulário por revisor, `03_screening/revisores/<estagio>_<nome>.csv`.
   O insumo de `ta` é o `passed_keywords.json` ou, sem ele, o `dataset.json`; o de `fulltext` é o `included_ta.json`.
   O formulário traz id, título, resumo, palavras-chave e endereço. A preencher: uma coluna por pergunta do estágio
   (`sim` ou `não`) e observação. Se o protocolo não tiver perguntas, uma coluna de decisão (`incluir` ou `excluir`) e
   o motivo. Com perguntas, a decisão e o motivo saem das respostas, sem escolha à mão: entra só com "sim" em todas,
   e o motivo da exclusão são as perguntas com "não". Assim o motivo de cada estágio, que o PRISMA-ScR pede no item 14,
   sai padronizado.
2. `importar`: lê o formulário preenchido e grava, por registro, o nome do revisor, o estágio, a decisão, o motivo e as
   respostas, com a data e o hash do arquivo, em `03_screening/revisores/decisoes_<estagio>.json`. Recusa linha sem
   decisão, id fora do insumo e formulário de outro estágio. Reimportar o mesmo revisor exige autorização; a versão
   anterior fica guardada.
3. `consenso`: onde os revisores divergem, grava o resultado, o motivo e quem decidiu (`consenso` ou o nome do
   pesquisador, quando não houve consenso). Onde todos concordam, o resultado é o deles, marcado como concordância,
   com o motivo de cada um.
4. `gerar`: só quando todo registro do insumo tem a decisão de cada revisor declarado e toda divergência está
   resolvida. Grava pelo `writeScreening` os artefatos do funil do estágio, cada registro com as decisões, o consenso e
   o motivo, e passa pela trava da RV-04, como o `screen_candidates`.

Teste de cada ação com o caso do `roda_aromas_ceara` copiado para o teste, sem gravar na pasta do projeto. DECLARAR: o
`screener.md` e a `screening-rules` nomeiam a tool para as decisões dos revisores humanos. Não fazer: o item 4
(concordância), triagem por IA, cegamento entre revisores.

Fora do alcance, e trava mais adiante: nenhum código grava `03_screening/fulltext_not_retrieved.json` ("Visto de
passagem", linha 1). A leitura por título e resumo não depende disso; o texto completo, sim.

**Pergunta ao Vicente:** como os revisores entregam as decisões? (a) No formulário que o ReviewBR gera, preenchido numa
planilha ou num editor e importado de volta (proposta). O protocolo diz que nenhuma outra ferramenta é usada; a
planilha só preenche o arquivo do ReviewBR. (b) Uma decisão por vez, ditada no chat.

> **Decidido pelo Vicente em 23/11/2026, depois da camada por palavras do `roda_aromas_ceara` (743 passaram), sobre a
> planilha da linha 13.** O que muda na proposta (2) acima:
> - **Pergunta (2) respondida: há "dúvida".** Na leitura por título e resumo, cada pergunta do estágio admite `sim`,
>   `não` ou `dúvida`. Decisão que sai das respostas: um "não" exclui (motivo: as perguntas com "não"); sem "não" e com
>   alguma "dúvida", o registro segue para o texto completo; "sim" em todas, segue também. No texto completo não há
>   "dúvida": `sim` ou `não`.
> - **Triagem dupla, sem emenda:** os dois revisores leem todo o insumo (no projeto, os 743), cada um no seu arquivo.
>   Não se divide o insumo entre eles. Nenhuma IA na planilha: nem proposta, nem decisão.
> - **Conferência de procedência, determinística, antes de gerar a planilha:** a tool abre o endereço de cada registro e
>   compara o título da página de destino com o do registro; marca `confere`, `não confere` ou `fora do ar`, e lista à
>   parte os dois últimos para o pesquisador ver antes da leitura. O relato pode declarar a data e as contagens.
>   Motivo dele: a dúvida de que algum registro seja inventado ou de que o link leve a outro documento minaria a
>   confiança do estagiário e do leitor.
> - **Endereço aberto a qualquer leitor:** o link da planilha é o DOI quando houver; a página da Scopus (pede login)
>   fica só como origem.
> - **Colunas só de leitura** (travadas): número de ordem, id, título, resumo inteiro na célula, palavras-chave, termos
>   do protocolo que casaram, ano, tipo, idioma, fonte e revista, link e situação da conferência, aviso de par
>   sinalizado na F3 (os dois do par lidos juntos).
> - **Colunas que o revisor preenche** (lista de opções, só elas abertas): uma por pergunta do estágio; "o link abriu o
>   documento certo?" (`sim` ou `não`); observação, livre. A pergunta (c) do protocolo vem pré-preenchida com o idioma e
>   o tipo que a fonte declara, para o revisor confirmar ou corrigir.
> - **Nas primeiras linhas:** as perguntas do protocolo como estão escritas nele e a instrução objetiva do que marcar.
> - Ajuda à leitura permitida: agrupar os registros da mesma revista. Não permitido: excluir de antemão por revista,
>   idioma ou ausência de um termo (seria critério que o protocolo não tem).
> - Na volta, a planilha das divergências para o consenso (ação `consenso`). O item 4 (concordância) segue fora.
> - **Link que não confere ou não abre (decidido no mesmo dia):** o registro cujo link leva a documento com outro
>   título ("não confere") ou não abre ("fora do ar" na conferência, ou "não abriu" marcado pelo revisor) é gravado
>   como falha do sistema e vai para a manutenção resolver; não é excluído nem decidido pelos revisores enquanto isso.
>   Depois do conserto, volta para a revisão. Motivo dele: o registro sem procedência confirmada perde a legitimidade.
>   Origem: "quando nao confere entra como registro de falha da IA e isso fica pra manutencao resolver para depois
>   voltar a ser revisado porque perde a legitimidade"; "se o link nao abrir nada marca que nao abriu e isso tb volta
>   pra manutencao". **Substituído pelo Vicente em 26/11/2026 (linha 23):** a procedência que o sistema não consegue
>   conferir fica registrada como limitação e não impede a pesquisa; o registro vai à leitura com a situação à vista.
> - **Sem download (decidido no mesmo dia):** os revisores leem pelo link DOI, na internet; a planilha não traz nem
>   pede texto baixado. Origem: "nao precisa ter o texto completo, tanto o estagiario quanto o pesquisador tenha acesso
>   a internet e podem clicar no link doi".
> - Formato: `.xlsx`.
> - **Planilha do texto completo (decidido no mesmo dia):** traz a pergunta "conseguiu ler o texto completo? sim /
>   não". Caso que ele deu: o título e o resumo não indicam painel sensorial, mas o texto completo pode ter. Pelo
>   protocolo (F1.3.2.6), o texto indisponível depois das tentativas, incluindo o acesso dele ao Portal CAPES, é
>   excluído como não recuperado e conta nessa caixa do fluxograma. Cada planilha volta para a tool quando o revisor
>   termina de preencher. Origem: "pode conter sim a pergunta quando no titulo e resumo nao há indicios de que pode
>   haver painel dentro do artigo completo. a planilha voltaria para a ferramento quando os revisores terminarem de
>   preencher."
> - **Pergunta dele para a manutenção:** "situacoes assim sao comuns em outras pesquisas? se sim o reviewbr deve ter as
>   tools necessarias". Resposta dada no chat: sim (triagem dupla independente por planilha, divergências por
>   consenso, texto completo não recuperado como caixa do fluxograma do PRISMA 2020 e do PRISMA-ScR); por isso a
>   proposta (2) já é geral, para qualquer protocolo. A manutenção confere com a fonte oficial e inclui o registro dos
>   não recuperados ("Visto de passagem", item do `fulltext_not_retrieved.json`) no mesmo desenho.
> - **Identificação do revisor, decidida no mesmo dia:** no topo de cada planilha, uma vez, o revisor preenche nome,
>   papel (pesquisador ou estagiário), data de início e data de fim da leitura. Sem instituição (é dado da autoria,
>   deixada em branco no protocolo) e sem data por linha (a tool grava a data e o hash do arquivo na importação). O
>   `importar` recusa planilha sem nome, papel ou datas.
> - **Observação obrigatória na "dúvida":** linha com alguma pergunta marcada "dúvida" e observação vazia é recusada
>   pelo `importar`. Nas outras linhas, a observação segue livre.
>
> Origem: "ok, entao deve ter a coluna de duvida para preencher"; "tudo bem ser triagem dupla sem emenadas"; "nao vamos
> usar ia para substituir a triagem"; "ainda cabe a duvida sobre todos os artigos nao serem mockup de ia e de os links
> levarem a artigos que nao sao os que se diz"; "ok, vamos gravar e incluir os campos para marcar sim ou nao"; sobre a
> identificação e a observação na dúvida: "concordo. gravar como decisoes minhas."

**(2) Linha 13 — fonte oficial, diagnóstico e plano (23/11/2026, sessão da linha 13; nada construído).** Pedido:
"Antes de construir, confira com a fonte oficial a minha pergunta gravada ali (…) e mostre-me o diagnóstico e o plano."

*Fonte oficial, lida em 23/11/2026* (pergunta dele: "situacoes assim sao comuns em outras pesquisas?"):
- PRISMA 2020, declaração (Page et al., BMJ 2021; texto em PMC8008539), item 8: relatar "how many reviewers screened
  each record and each report retrieved, whether they worked independently". Explicação e elaboração (PMC8005925),
  item 8: também o modo de resolver divergências ("referral to a third reviewer or by consensus"); independente quer
  dizer "unaware of each other's decisions". Item 16a: contar, entre outros, os "potentially eligible reports that were
  not retrievable" e os motivos principais de exclusão no texto completo.
- PRISMA-ScR, checklist oficial (prisma-statement.org, versão de 11/09/2019): item 9, o processo de seleção (triagem e
  elegibilidade); item 14, os números triados, avaliados e incluídos, "with reasons for exclusions at each stage".
- JBI Manual for Evidence Synthesis 2024, 10.2.6: "source selection (both at title/abstract screening and full-text
  screening) is performed by two or more reviewers, independently. Any disagreements are solved by consensus or by the
  decision of a third reviewer"; o fluxograma inclui a recuperação do texto completo; os motivos de exclusão são ditos.
- Cochrane Handbook 6.5.1, cap. 4: 4.6.4 e MECIR C39 (obrigatório nas revisões Cochrane), dois revisores independentes e
  o modo de resolver divergências definido antes; no título e resumo, "authors should generally be over-inclusive"; as
  decisões e os motivos podem ficar em "a simple document or spreadsheet".

*Resposta:* sim. Triagem dupla independente nas duas fases, divergência por consenso ou terceiro, a dúvida que segue
para o texto completo, a planilha e a caixa dos não recuperados estão nas quatro fontes; a tool é geral (qualquer número
de revisores e de perguntas). O que as fontes trazem e o desenho não muda: a conferência de procedência dos links não é
passo descrito nelas (o mais próximo é a Cochrane 4.4.6, retratação e estudo fraudulento): é decisão dele, a mais, e não
exclui ninguém; a independência do PRISMA 2020 (não saber da decisão do outro) o sistema não garante, e o relato declara
como foi feita. Só informação: o JBI recomenda piloto antes da triagem (25 títulos e resumos; começar com 75% ou mais de
concordância) e a Cochrane, piloto dos critérios; o protocolo travado não tem piloto.

*Diagnóstico*, além do de (2) acima (código e insumo lidos; nada gravado no projeto):
- O servidor não tem biblioteca de planilha (`package.json`: só `csv-parse`). O `.xlsx` com lista de opções, colunas
  travadas e aba oculta precisa de uma.
- `writeScreening` grava dois arquivos por estágio; nada grava `fulltext_not_retrieved.json`, que o funil já conta
  (`flow_computer.ts:87`).
- O funil calcula os encaminhados ao texto completo como triados − excluídos (`flow_computer.ts:106`): registro fora dos
  dois arquivos conta como encaminhado. Por isso a falha de procedência pendente impede o fechamento do estágio.
- Insumo do projeto: 743 em `passed_keywords.json` (`{record, camada, motivo, sem_resumo, casamentos}`; os termos que
  casaram vêm de `casamentos`; as palavras-chave, do registro e de `02_deduplicated/palavras_chave.json`); 220 sem
  resumo. Endereço: 329 com DOI; 414 só com a página (321 em `v3.cadernoscajuina.pro.br`, 16 na Infoteca-e, 7 no
  Sucupira, 2 na EBSCO, que pede login, e outros). Sem idioma declarado: 401; sem tipo: 6. Revista: só 6 a têm (Scopus e
  FSTA). Pares sinalizados na F3: 36; os dois do par estão no insumo em 3, um só em 2.
- `doi.org` devolve, por negociação de conteúdo, os metadados registrados do DOI (com o título; 404 para DOI
  inexistente), e o `robots.txt` dele não proíbe.

*Plano.* Gate `validate_system_change` CORRECAO (falha: nenhuma tool grava a decisão por revisor que o F4.1.3 do
protocolo atribui ao ReviewBR). Cada item com teste que falha antes e passa depois, sobre registros do
`roda_aromas_ceara` copiados para `tests/fixtures/`, com a rede simulada. FAZER:
1. Dependência `exceljs` 4.4.0 (MIT), para escrever e ler a planilha.
2. Tool `verify_record_links` (LIBRARIAN e COORDINATOR: abre endereços na rede, como o `complete_record_keywords`). Com
   DOI, compara o título que o DOI registra em `doi.org`; sem DOI, abre a página (`robots.txt` respeitado, User-Agent do
   ReviewBR) e lê o título que ela declara (`citation_title`, `DC.title`, `og:title`, `<title>`). Regra declarada:
   títulos sem acento, maiúscula, pontuação nem espaço repetido; confere se iguais ou se um é o começo do outro (título
   sem subtítulo). Marca `confere`, `não confere` ou `fora do ar`, com o motivo (DOI não registrado, HTTP, pede login,
   `robots.txt`, página sem título). Grava `03_screening/procedencia.json` (link, título lido, situação, motivo, data) e
   o relatório (data e contagens, para o relato); as falhas vão para `03_screening/revisores/falhas_procedencia.json`,
   que a sessão do projeto leva ao "Visto de passagem". Com `somente_pendentes`, refaz só as falhas, depois do conserto.
3. Tool `record_screening_decisions` (SCREENER e COORDINATOR):
   - `formulario`: recusa sem a conferência do insumo. Uma planilha por revisor (rótulos do pesquisador; cada uma com o
     insumo inteiro, menos as falhas de procedência), `03_screening/revisores/<estagio>_<rotulo>.xlsx`, e o manifesto do
     estágio (insumo e hash, ids, revisores, perguntas, hash do `protocol.md`). As perguntas entram como parâmetro, com o
     estágio de cada uma, e cada texto tem de estar escrito no `protocol.md`. No topo: nome, papel (lista), datas de
     início e de fim (só estes abertos), a instrução objetiva e as perguntas como estão no protocolo; no texto completo,
     também o critério do protocolo para texto indisponível. Travadas: nº, id, título, resumo inteiro, palavras-chave,
     termos que casaram, ano, tipo, idioma, fonte e revista, link (DOI; sem DOI, a página; a da Scopus só como origem),
     conferência do link, aviso de par da F3. Abertas, com lista: uma coluna por pergunta (`sim`/`não`/`dúvida` no título
     e resumo; `sim`/`não` no texto completo), "o link abriu o documento certo?" (`sim`/`não`), no texto completo
     "conseguiu ler o texto completo?" (`sim`/`não`) antes das perguntas, e observação livre. Ao lado da pergunta que o
     pesquisador indicar (no projeto, a (c)), travado, o idioma e o tipo que a fonte declara, para o revisor confirmar ou
     corrigir. Ordem: por revista; sem revista (737 dos 743), pelo site do link; os dois do par da F3 juntos. Aba oculta
     com estágio, revisor, hash do insumo e ids. Com `pendentes`, só os registros que voltaram da manutenção.
   - `importar`: recusa, dizendo a linha: identificação incompleta; id ausente, a mais ou repetido; planilha de outro
     estágio ou insumo; resposta em branco (no texto completo, as perguntas só ficam em branco com "conseguiu ler?" =
     `não`); `dúvida` sem observação; `dúvida` no texto completo. Decisão de cada linha, sem escolha à mão: link `não` →
     falha de procedência (vai à lista, não é decidida); título e resumo: um `não` exclui (motivo: as perguntas com
     `não`), senão segue (marcado "com dúvida" se houver); texto completo: "conseguiu ler?" `não` → não recuperado, um
     `não` exclui, `sim` em todas inclui. Grava `03_screening/revisores/decisoes_<estagio>.json` (por registro e revisor:
     nome, papel, respostas, observação, decisão, motivo) e a importação (arquivo, hash, data, datas declaradas), e guarda
     a planilha recebida. Reimportar o mesmo revisor exige autorização e arquiva a anterior. Lê também a do consenso.
   - `consenso`: gera `03_screening/revisores/<estagio>_consenso.xlsx` só com os registros em que as decisões divergem,
     as respostas e observações de cada revisor lado a lado (travadas); abertas: resultado (lista do estágio), motivo e
     "decidido por" (`consenso` ou `pesquisador`); no topo, quem participou e o nome do pesquisador. Onde concordam, o
     resultado é o deles, com o motivo de cada um.
   - `gerar`: recusa enquanto faltar revisor, houver divergência sem consenso ou falha de procedência pendente (lista os
     ids). Grava pelo `writeScreening`: título e resumo → `included_ta.json` e `excluded_ta.json`; texto completo →
     `included.json`, `excluded_fulltext.json` e `fulltext_not_retrieved.json`; cada item `{record, decision, motivo,
     decisoes, consenso}`. Relatório do estágio (revisores, papéis, datas, contagens, divergências e como se resolveram,
     motivos de exclusão por pergunta, conferência dos links). Passa pela trava da RV-04, como o `screen_candidates`.
4. `writeScreening` e `triagemGravada`: o estágio do texto completo ganha o terceiro arquivo; o funil já o conta.

DECLARAR: `screener.md` e `screening-rules` (decisões dos revisores humanos pela `record_screening_decisions`);
`librarian.md` (a conferência pelo `verify_record_links`); limites: o sistema não garante a independência entre os
revisores; a trava das colunas evita edição acidental, e a importação confere pelo id e pelo hash do insumo.

Teste real, depois da suíte, numa cópia do `roda_aromas_ceara` fora do projeto: a conferência dos 743 links pela rede, as
duas planilhas geradas e relidas, e planilhas de teste preenchidas para importar, consensuar, gerar e contar o funil.

Não fazer: o item 4 (concordância), triagem por IA, cegamento, piloto, o conserto de cada falha de procedência (é da
manutenção, caso a caso) e o registro das falhas do `retrieve_fulltexts` (fica no "Visto de passagem").

> **Aprovado pelo Vicente em 23/11/2026, ao ler o plano:** construir o plano acima como está, em partes, com commit a
> cada parte. Consequência: nenhum dos pontos apontados para veto (a `exceljs`, as duas tools, o agrupamento pelo site
> do link, o idioma e o tipo ao lado da (c), o estágio que não fecha com link pendente) muda. Origem: "siga em partes".
> Gate `validate_system_change`: CORRECAO, válido.

**Estado da execução** (atualizar a cada parte, com o commit):
- Parte 1, `exceljs` e o terceiro arquivo do texto completo (item 4 do plano): **feita em 23/11/2026**. `exceljs`
  4.4.0 no `package.json` (o `npm audit` aponta, moderado, o `uuid` < 11.1.1 que ela traz: falta de checagem de limite
  quando se passa `buf` às versões v3/v5/v6; a `exceljs` usa a v4 sem `buf`). `writeScreening` grava
  `fulltext_not_retrieved.json` (parâmetro `naoRecuperados`, só no texto completo); `triagemGravada` o conta; a
  substituição o arquiva. Teste: `tests/nao_recuperados.test.ts` (5 de 5 falhavam antes).
- Parte 2, `verify_record_links`: **feita em 23/11/2026**. `src/services/procedencia.ts` e a tool (LIBRARIAN e
  COORDINATOR; `librarian.md` com a tool). Retomável (grava a cada 20); pedidos ao mesmo site espaçados (500 ms), até 4
  sites em paralelo; a falha marcada por revisor só sai com o conserto declarado (`consertadas`) e a conferência de
  novo dando "confere". Teste: `tests/procedencia.test.ts` (12, sobre 11 registros do projeto copiados para
  `tests/fixtures/roda_aromas_ceara/linha13/`; rede simulada; todos falhavam antes, sem o módulo). Controle pela rede,
  fora do projeto, nos 11: 8 conferem (4 pelo DOI), 2 fora do ar (`robots.txt` da EBSCO e do Sucupira proíbem) e 1 não
  confere (a página da UFRN devolve só o título "DSpace").
- Parte 3, `formulario`: **feita em 23/11/2026**. `src/services/decisoes_revisores.ts` e a tool
  `record_screening_decisions` com a ação `formulario` (SCREENER e COORDINATOR; `screener.md` com a tool; as outras
  ações entram nas partes 4 e 5). Grava `03_screening/revisores/<estagio>_<rotulo>.xlsx` e
  `<estagio>_formularios.json` (manifesto, com os lotes). A linha de controle (estágio, revisor, lote, hash do insumo,
  posição das colunas) fica no topo da planilha, visível e travada, para a importação. Teste:
  `tests/revisores_formulario.test.ts` (7; apoio em `tests/apoio/revisores.ts`; todos falhavam antes, sem o módulo).
- Parte 4, `importar`: **feita em 23/11/2026**. Lê a planilha devolvida pela linha de controle; grava
  `03_screening/revisores/decisoes_<estagio>.json` (por registro e revisor; importações com arquivo, cópia em
  `recebidos/`, sha256, data, nome, papel e datas declaradas); recusa tudo, dizendo a linha, quando há um problema;
  aceita resposta sem acento ou com maiúscula ("Nao" = "não"); link "não" vai para a lista de falhas, com a origem
  "revisor". Teste: `tests/revisores_importar.test.ts` (7; todos falhavam antes, sem a função).
- Parte 5, `consenso` e `gerar`: **feita em 23/11/2026**. `consenso` gera `<estagio>_consenso_<n>.xlsx` só com as
  divergências que não têm consenso, guarda o retrato das decisões de cada uma e recusa a importação se elas mudaram
  depois; a importação pede motivo e, quando decide o pesquisador, o nome dele. `gerar` recusa enquanto houver falha de
  procedência, registro fora de planilha, revisor faltando ou divergência sem consenso; grava pelo `writeScreening`
  (com a autorização para regravar) os itens `{record, decision, decisao, motivo, origem, decisoes, consenso}`
  (`decision` no vocabulário do relatório de triagem: YES, MAYBE quando seguiu com dúvida, NO, NAO_RECUPERADO) e
  `03_screening/revisores/relatorio_<estagio>.json` (revisores, datas, contagens, origem da decisão, motivos por
  pergunta); passa pela trava da RV-04. Teste: `tests/revisores_consenso_gerar.test.ts` (5; o funil fecha de ponta a
  ponta: 11 → 3 excluídos na TA → 8 → 1 não recuperado, 1 excluído → 6 incluídos).
- Parte 6, DECLARAR, teste real na cópia e fechamento da linha: **feita em 23/11/2026**. DECLARAR: `screener.md`,
  `librarian.md` e `screening-rules` (com os limites). Teste real numa cópia do `roda_aromas_ceara` no scratchpad, nada
  gravado no projeto: a conferência dos 743 links levou 7 min 19 s; deu 683 conferem, 25 não conferem e 35 fora do ar.
  Dela saíram dois consertos, cada um com teste que falhava antes: (1) o título que o DOI registra vem com entidades
  HTML ("&lt;b&gt;", "&amp;lt;i&amp;gt;"), e 7 registros não conferiam por isso: a comparação as desfaz; (2) 315
  registros do OpenAlex têm o próprio DOI como endereço, e o agrupamento pelo site os juntava em "doi.org": sem revista e
  com o endereço no DOI, o grupo é o prefixo do DOI (quem o registrou). Conferidas de novo só as falhas: **692 conferem,
  18 não conferem, 33 fora do ar (51 esperam a manutenção)**. As duas planilhas (692 linhas, 411 KB cada) foram geradas
  e relidas; planilhas de teste preenchidas foram importadas (cerca de 1 s as duas), o consenso gerou a planilha das
  divergências, e o `gerar` recusou, como deve, com as 51 falhas e mais 1 marcada pelo revisor de teste.
- **Linha feita.** Suíte 682 de 682 (644 antes; 38 testes novos em cinco arquivos), build e audit válidos.
  Para o `roda_aromas_ceara`, em chat novo (servidor novo): `verify_record_links`; as falhas vão ao "Visto de
  passagem"; depois `record_screening_decisions` com `acao=formulario`, `estagio=ta`, os dois rótulos, as quatro
  perguntas copiadas do protocolo (a (d) só no texto completo) e `perguntaIdiomaTipo=c`.

### Pedido do Vicente de 25/11/2026 — acordo com o Gemini e plano único (proposta de 26/11/2026; respondida em parte no mesmo dia)

> Pedido, na conversa do Gemini de 25/11/2026 passada ao Claude: "esse é o momento tb de entrar em acordo sobre como
> vao conduzir juntos"; e, para a resposta: "primeiro o que se pode fazer para melhorar e depois as explicações do
> porque em cada ponto (…) considere que farei a leitura de cima para baixo e talvez sejam feitos comentarios enquanto
> se vai lendo". Insumos: a passagem do Gemini e o inventário dele, em
> `C:\Users\alqui\.gemini\antigravity\brain\730630b2-0aef-4810-a728-4e47d68560db\` (fora do repositório). As frases
> do Vicente citadas aqui foram conferidas, em 26/11, na transcrição dessa conversa
> (`.system_generated/logs/transcript.jsonl`). Nada desta seção vale antes da decisão dele, e nenhuma linha entra na
> tabela "Fila" sem ele.

> **Respondido pelo Vicente em 26/11/2026, ponto a ponto.** O texto de cada decisão está reescrito em forma precisa, e
> a frase dele vai como origem. O que é interpretação minha está marcado e foi mostrado a ele no mesmo dia.
> - **1, aprovado.** O acordo é a regra 9 desta página. Origem: "1-aprovo".
> - **2, trocado pelo dele.** Durante os consertos, a pasta `reviewbr/projects/roda_aromas_ceara/` fica fora do
>   `C:\reviewbr`: o Vicente a tira inteira, no estado em que está, e ela volta quando os consertos terminarem. Isso
>   substitui o worktree e a regra de só mexer entre dois passos da pesquisa (2.2 a 2.4); a manutenção trabalha no
>   próprio `C:\reviewbr`. Consequências: a pesquisa não roda até a volta (os revisores seguem lendo fora do sistema, e
>   a importação das planilhas espera); com a pasta fora, os 17 arquivos dela rastreados aparecem apagados no
>   `git status`, e nenhum commit grava essa deleção (commit só por caminho explícito); linha que muda o servidor só
>   roda com a pasta fora. Levado a ele no mesmo dia: fechar as planilhas antes; destino fora do `C:\reviewbr` (não
>   `old/`, que fica dentro dele); dizer onde ficou, para a manutenção ler, sem gravar, a lista das 64 falhas; a volta
>   depois de o sistema consertado importar as duas planilhas numa cópia da pasta. Origem: "posso mover a pasta da
>   pesquisa no estado em que ela se encontra e depois voltar quando os concertos terminarem."
> - **3, não respondido.** Ele o leu como passo da pesquisa: "Se trata-se apenas da pesquisa roda de aroma já tenho as
>   planilhas e elas estao sendo conferidas pelos revisores. nosso trabalho aqui é sobre o reviewbr como um todo." É
>   do ReviewBR; reformulado em "Levado de novo ao Vicente em 26/11/2026", no fim desta seção. O 3.1 (rodar o
>   `verify_record_links` com `somenteFalhas` no projeto) é passo da pesquisa e fica para a sessão dela, depois da
>   volta da pasta.
> - **4, respondido.** A linha 4 (4.1 a 4.3: existência e retratação) entra na fila, como linha 19: é o pedido dele de
>   25/11, e ele respondeu à única pergunta do ponto. A "camada a mais" (4.4) não se constrói agora e vai para a
>   investigação da linha 22, que diz se ela é necessária (interpretação). Origem: "a camada a mais seria usar as tools
>   como parceira e criar uma tool nossa para a triagem. talvez nao seja necessario."
> - **5, aprovado, linha 20; a licença foi levada de novo.** Vão para `C:\reviewbr\old\` o código Go do prismAId (ponto
>   5) e as sobras do ponto 10: `src/index.ts.tmp`, os `run_search_*.ts`, `reviewbr-web/`, o `.zip` de 150 MB da raiz
>   e `antigravity_conversas_export/` (interpretação: a pergunta do resumo trazia as sobras junto). "Sem esquecer que
>   existem": como `old/` está fora do git (`.gitignore:28`), um arquivo rastreado lista o que foi para lá, de onde,
>   quando e o último commit em que cada coisa estava no git; o crédito ao prismAId fica no `README.md` e no
>   `CITATION.cff`. Origem: "pode mover para old mas sem esquecer que existem."
> - **6.1, pediu contexto:** "até o primeiro passo que o metdo exige antes de que? contextualize." Levado de novo.
> - **6.2, não decidível com o texto:** "nao é possivel decidir com esse texto. o plano por etapa sozinho nao
>   basta..." Reescrito com o 6.3 e levado de novo.
> - **6.3, corrigido por ele:** contra os quatro desvios, o ReviewBR busca meios de impedir; registrar é complemento.
>   Origem: "nao apenas registra. estamos buscando criar meios de impedir." Reescrito com o 6.2.
> - **6.4, aprovado:** a Hipótese A (os agentes de cada etapa fundidos num coordenador, com o `maintainer` à parte) vem
>   depois da recusa em código da ordem das etapas. Origem: "6.4 ok".
> - **6.5, aprovado, na linha 21:** o `maintainer` fica, com o DECLARAR do 6.5 (L28; o RAISE 3 nas L35-40 e na L231;
>   as L183-193 só para norma já transcrita). As L380-385 ficam como estão: com os canônicos fora do texto normativo
>   (7.2), deixam de contradizer o `METODO_ReviewBR.md` (interpretação). Origem: "6.5 sim, agente mainteiner fica."
> - **7, aprovado, na linha 21:** 7.1 e 7.2 como propostos; a lista dos doze vai para um anexo marcado "resumo do
>   agente; obra não lida" (interpretação: o "sim" respondeu às duas perguntas do resumo). Origem: "7 sim, aprovo."
> - **8, pediu as tools:** "que tools?" Levado de novo, com a lista. O ponto 8 abaixo deixou de fora o grupo do texto
>   completo e o `deduplicate_dataset`; a lista de 26/11 os inclui.
> - **9, aprovado como investigação, linha 22:** nem todos são fontes de busca de artigo (DataCite e OSF registram
>   dados, teses, projetos e protocolos; o OpenAIRE Graph agrega vários tipos, artigos entre eles). A linha investiga,
>   só lendo a fonte oficial, o papel de cada um, junto com o ASReview v2 e a camada do 4.4. Não depende da linha da
>   rede. Origem: "sim, mas alguns nomes nao sao exatamente fontes de busca de artigo, ok? entra como investigacao."
> - **10, pediu contexto:** "pouco contexto para decidir." Levado de novo; a parte das listas R/V se resolveu pelo 1
>   (regra 9).
>
> A linha do ponto 3, quando ele a aprovar, vem antes da 19. Saíram do "Visto de passagem", por virarem linha: o
> `index.ts.tmp` (linha 20) e o subitem P9 dos pedidos de 12/11 (linha 21).

> **Segunda resposta do Vicente, 26/11/2026, ao "Levado de novo".**
> - **2, feito.** A pasta saiu e está em `C:\roda_aromas_ceara`, fora do `C:\reviewbr` (conferido no mesmo dia: os 17
>   arquivos rastreados dela aparecem apagados no `git status`, e nenhum commit grava isso). Origem: "ficou no c:\ fora
>   da pasta reviewbr"; "acabei de tirar a pasta da pesquisa".
> - **3, decidido; é a linha 23.** Quando o ReviewBR não consegue conferir a procedência de um registro (a fonte recusa
>   robô, a página não abre, o DOI não tem registro, o título lido não confere), ele registra a limitação — o registro,
>   o motivo e a data — e a pesquisa segue: o registro vai aos revisores como os outros, com a situação da conferência
>   à vista; o "não" do revisor em "o link abriu o documento certo?" também fica registrado e não tira o registro da
>   leitura; nada disso impede gerar o estágio, e o relatório do estágio traz as contagens da limitação, para o relato.
>   Vale para qualquer pesquisa. Substitui a regra de 23/11 ("Link que não confere ou não abre": a falha ia à manutenção
>   e voltava depois do conserto). A proposta (i)/(ii) de 26/11 não se constrói. Origem: "na minha interpretacao é caso
>   de se registrar a limitacao do sistema quando ele nao consegue algo e isso seria o suficiente. o que eu pedi foi para
>   tentar consertar o reviewbr enquanto fazemos uma pesquisa real e isso nao deveria impedir a pesquisa"; "vamos seguir
>   nos 3 juntos da melhor forma possivel". Direção dele para a manutenção: "concentrar no que fazer para o sistema
>   funcionar sem aumentar problemas menores que podem ser resolvidos facilmente".
> - **5, licença:** AGPL-3.0 para tudo; o `package.json` do servidor passa de MIT a `AGPL-3.0-only`, na linha 20.
>   Origem: "5 ok para agpl".
> - **6.1, pergunta dele:** "achei que protocolo ja seria uma parte do metodo, de qualquer metodo, nao é?" Respondida no
>   mesmo dia: nas revisões, sim (o JBI exige protocolo a priori em todas as suas metodologias: catálogo, entrada
>   `jbi-manual`); então o método se escolhe antes da busca formal, e antes dela só há a busca exploratória, gravada
>   para qualquer método. Espera só objeção dele.
> - **6.2 e 6.3, aprovados; é a linha 24.** As três travas em código. (1) Decisão antes da etapa, perguntada na trava "a
>   partir de informações claras e contextualizadas": cada pergunta diz o que se decide, as opções e a consequência de
>   cada uma. (2) Ordem e insumo. (3) Sistema e sessão presos ao projeto: "parece ok", então o desenho dela volta a ele
>   antes de ser construído. Toda recusa informa o que foi recusado e a regra do projeto que a causou e, quando a ação
>   mudaria o projeto de pesquisa, diz que não pode e qual é o caminho (a emenda). Origem: "1 decisao a partir de
>   informacoes claras e contextualizadas. 2 ok 3 parece ok nao apenas impede, informa e diz que nao pode se isso mudar
>   o projeto de pesquisa."
> - **6.4:** a linha 25 (Hipótese A) vem depois da 24.
> - **8, aprovado; são as linhas 26 a 30**, uma por grupo da lista de 26/11, nesta ordem, cada uma começando por conferir
>   cada item no código: 26 rede e repositórios; 27 coleta e importação; 28 protocolo e estado; 29 texto completo; 30
>   método e IA, depois da 24 e da 25. Origem: "8 aprovo".
> - **9:** "ok" (linha 22).
> - **As interpretações de 4, 5, 6.5 e 7 estão confirmadas:** "4 ok 5 ok 6.5 ok 7 ok". As marcas "(interpretação)" do
>   bloco anterior valem como decididas.
> - **10:** sem resposta ("tiro?"); o "Visto de passagem" fica como está.
>
> Ordem de execução: 23 (aberta no mesmo dia) → 19 → 20 → 21 → 24 → 25 → 26 a 30; a 22 a qualquer momento (só leitura).

**Como ler.** Primeiro a lista do que proponho, e a ordem. Depois, ponto a ponto, três partes nesta ordem:
**Proposta**; **Hoje** (só fato, conferido em 26/11/2026, com a fonte); **Por quê**. Comente pelo número.

#### O que proponho

1. Fechar o acordo de condução Gemini ↔ Claude com o texto do ponto 1, que passa a ser regra desta página.
2. Montar o isolamento antes de qualquer mudança estrutural: cópia da pasta do projeto fora do repositório, e a mudança
   estrutural numa cópia de trabalho separada do git (worktree).
3. Próximo passo durante a F4: as 64 falhas de procedência em três tempos, com um caminho novo para a falha que é da
   fonte. Sem esse caminho, a etapa de título e resumo do `roda_aromas_ceara` não fecha.
4. Uma linha para retratação e fonte inexistente, usável desde a busca exploratória.
5. Mover o legado Go para `old/`, como decidido, e decidir junto o arquivo de licença.
6. Decidir a arquitetura pelas respostas do ponto 6 (plugabilidade, plano por etapa, quatro desvios, Hipótese A,
   `maintainer.md`). É decisão, sem código.
7. Limpar o `METODO_ReviewBR.md`: tirar do texto normativo os retratos "Hoje", as atas e os doze canônicos.
8. Ressalvas das tools: uma linha por área, cada uma começando por conferir se o item é real hoje.
9. Fontes novas (DataCite, OpenAIRE Graph, OSF) depois da linha da rede; ASReview v2 como investigação.
10. Não manter as listas R-01..R-28 e V-01..V-49 do Gemini; tirar do "Visto de passagem" 8 itens e 6 subitens já
    feitos ou só de registro.

**Ordem proposta** (cada uma vira linha quando ele aprovar): 2 → 3 → 4 → 5 → 7 → 6.2 → 6.4 → 8 → 9. Os pontos 1, 6 e
10 se resolvem na leitura desta página. Por quê: primeiro a segurança da pesquisa (2) e o que a trava (3); depois o
pedido de 25/11 sobre fonte inventada e retratação (4) e o que é curto e já tem decisão (5, 7); a garantia de execução antes de mais
consertos (6.2, depois 6.4), porque "nao faz sentido fazer manutencao em cima de manutencao se isso nao esta
garantido" (20/11, linha 17); por fim os consertos (8) e as fontes novas (9), que dependem da linha da rede.

#### 1. Acordo de condução Gemini ↔ Claude

**Proposta** — o texto que passa a valer:
1. **Uma fila.** A `FILA.md` é a única fila do ReviewBR, e o `RETOMAR.md` é a única entrada de cada projeto. Documento
   do Antigravity (`brain/…`) é insumo: não é fila, e a numeração dele (V-xx, R-xx, S-x, ondas, blocos) não se usa aqui.
2. **Uma sessão por vez.** Só uma sessão escreve em `C:\reviewbr` por vez, de qualquer modelo. Sessão de pesquisa e
   sessão de manutenção nunca ao mesmo tempo.
3. **Quem faz o quê.** O Claude conduz a manutenção e esta revisão. O passo de pesquisa segue o `RETOMAR.md` do projeto,
   com o modelo que o prompt declara. O Gemini trabalha quando o Vicente passa o bastão, numa tarefa que já está nesta
   página ou no `RETOMAR.md`, sob as mesmas regras; não cria tarefa nem frente. Agente que dirige navegador, de qualquer
   modelo, não abre página cujo `robots.txt` proíbe robô ou cujo servidor recusa robô (linha 14).
4. **Sem execução em paralelo.** A regra 7 fica. As ondas 1 a 3 do inventário do Gemini não se executam como estão.
5. **Passagem de bastão gravada no repositório**, com: último commit e `git status`; decisões novas do Vicente, com a
   data e a frase dele; o único próximo passo; quem assume e o que fica intocado. Na manutenção, na linha "Última
   verificação"; na pesquisa, no `RETOMAR.md`.

**Hoje**
- Em 25/11 o Gemini não alterou `C:\reviewbr`: HEAD `7a84e68` (24/11), e só `roda_aromas_ceara/03_screening/` e
  `logs/lote/` sem commit. O `7a84e68` não estava no GitHub (o ramo estava um commit à frente).
- Em 24/11 um passo da pesquisa (a conferência de procedência e as planilhas) rodou no Antigravity, com o servidor do
  ReviewBR (`RETOMAR.md`, "Estado", 24/11). O acordo proposto pelo Gemini não fala de sessão de pesquisa.
- Numa sessão do Gemini, os agentes e as skills do ReviewBR não são lidos: o `.agents/skills.json` aponta para
  `C:/REVIEWBRGEMINI/skills`, que não existe neste PC. O que guia a trilha ali é o código e o `RETOMAR.md`.
- As frases do Vicente na seção 3 da passagem conferem com a transcrição. A coluna "consequência" é redação do Gemini, e
  ainda diz "após a pesquisa liberar" e "pós-pesquisa".
- A conferência de 19/11 não permite "User-Agent de navegador" nem "busca por robô em caminho que o `robots.txt` proíbe
  ou que o servidor recusa" (`CONFERENCIA_acesso_2026-11-19.md:51`).
- O inventário do Gemini (7.6, item 5) pede suspender a regra 7 para as ondas: agentes em paralelo, e um "integrador"
  para `index.ts`, `FILA.md` e `system_debt.json`.

**Por quê**
- 1.1: duas numerações das mesmas coisas são duas filas na prática, o que ele pediu para evitar: "Cuidado para não
  construir tarefas para o gemini em paralelo com as tarefas já existentes do claude. Vocês precisam chegar em um
  acordo."
- 1.3: o passo de pesquisa já rodou no Antigravity, então o acordo tem de dizer quem o roda. E o papel de "navegação
  real no Chrome" para as 64 URLs, como o Gemini o escreveu, choca com a decisão de 19/11 em 30 delas (9 com
  `robots.txt` que proíbe; 21 com `robots.txt` inalcançável, que a RFC 9309 manda tratar como proibição): agente que
  dirige navegador é robô que se apresenta como navegador.
- 1.4: as ondas mexem ao mesmo tempo nos arquivos que toda linha toca, e a fase é de fechar frentes.
- 1.5: a pasta do Antigravity fica fora do repositório, e nenhuma sessão a lê sem que o prompt aponte; "se algo não
  está no disco, não está decidido" (`maintainer.md:236-237`).

#### 2. Isolamento para a mudança estrutural

**Proposta**
1. Agora, antes de qualquer mudança: copiar a pasta `reviewbr/projects/roda_aromas_ceara/` inteira (com `01_raw/`,
   `02_deduplicated/` e `03_screening/`) para fora do repositório. Repetir ao fim de cada passo da pesquisa.
2. A mudança estrutural se faz numa cópia de trabalho separada do git (worktree; por exemplo `C:\reviewbr-estrutural`,
   ramo próprio), com servidor, agentes e skills dela. O `C:\reviewbr`, de onde a pesquisa roda, não é rebuildado por
   ela.
3. No `C:\reviewbr` só entra, durante a pesquisa, conserto que a pesquisa precisa (como as linhas 11 a 18 e o ponto 3),
   entre dois passos dela, como hoje.
4. A mudança estrutural entra no `C:\reviewbr` com a decisão do Vicente, numa pausa da pesquisa, depois de rodar numa
   cópia da pesquisa e de mostrar o que muda para ela. Se mudar etapa que ainda falta à pesquisa, espera o fim dela.
5. No `C:\reviewbr`, nenhum comando que apague o que não está no git (`git clean`, `git stash -u`, `git reset --hard`,
   `git checkout --force`) enquanto a pesquisa tiver dados fora dele.

**Hoje**
- O Claude Code (`.mcp.json`) e o Antigravity (`~/.gemini/config/mcp_config.json`) sobem o mesmo arquivo,
  `c:/reviewbr/reviewbr/reviewbr-mcp/dist/index.js`, com a pasta de trabalho `c:/reviewbr`.
- O `dist/` está fora do git (`.gitignore:7`), e o `npm run build` o reescreve no lugar: a sessão seguinte, de pesquisa
  ou não, sobe o servidor novo.
- O servidor lê `.claude/` e o catálogo de repositórios a partir da pasta dele (`index.ts:3128`, `registry/loader.ts:27`,
  `services/project_init.ts:35`), e lê e grava os projetos, `data/system.db` e `logs/` a partir da pasta de trabalho
  (`project_artifacts.ts:50`, `database.ts:61`, `structured_logger.ts:31`). Um worktree com build próprio não troca o
  servidor da pesquisa.
- Os dados da pesquisa estão só neste disco: `01_raw/` e `02_deduplicated/` são ignorados pelo git; `03_screening/`
  (15 MB: camada por palavras, procedência e as duas planilhas) e `logs/lote/` estão sem commit. O backup em `D:` é de
  02/10.
- As planilhas guardam o hash do insumo: `importar` e `gerar` recusam se o `03_screening/passed_keywords.json` mudar
  (`decisoes_revisores.ts:1074`).
- A linha 17 congela o plano de busca e o hash do protocolo; o resto do sistema não fica congelado para as etapas
  seguintes ("nada no projeto grava contra que versão do sistema ele travou", diagnóstico da linha 17).

**Por quê**
- É a condição que ele pôs: "podemos fazer as mudanças estruturais de fato apos termos uma seguranca de que nao sera
  alterada a pesquisa em andamento para finalmente finalizar a construcao da manutenção/atualizacao do reviewbr"
  (25/11, 17h34). Com o worktree, a mudança estrutural anda sem esperar o fim da pesquisa e sem trocar o servidor dela.
- Ele corrigiu o rótulo "pós-pesquisa" do Gemini: "estamos falando sobre o reviewbr. (…) não estamos falando dela"
  (25/11, 17h29). O isolamento separa as duas coisas sem parar nenhuma.
- A cópia do projeto custa minutos e é a única proteção dos dados da F2 à F4 contra perda.

#### 3. As 64 falhas de procedência — o próximo passo durante a F4

**Proposta**
1. Sessão do projeto, curta, sem código: `verify_record_links` com `somenteFalhas`. A falha passageira sai, e o que
   voltar a conferir vai ao lote de pendentes.
2. Linha da manutenção, para as que restarem, pela ordem de 23/11: dizer, uma a uma, se o defeito existe e se a causa é
   do ReviewBR ou da fonte. A manutenção confere o que o robô pode abrir (título lido errado, codificação, idioma,
   metadado do DOI); o que a fonte recusa a robô (`robots.txt`, página de verificação anti-robô, HTTP 403) uma pessoa
   abre — o Vicente ou o estagiário. Causa do ReviewBR (por exemplo, a página da UECE lida fora da codificação dela):
   conserto geral, com teste. Causa da fonte: não é achado.
3. FAZER, na mesma linha: o registro cuja falha é da fonte entra no lote de pendentes com "o link abriu o documento
   certo?" obrigatória; o "sim" confirma a procedência e grava quem e quando; o "não" mantém a falha, com o motivo.
   Vale para qualquer pesquisa.

Decisões dele: (a) aprovar o item 3, e quem confirma (os dois revisores, na planilha, como proposto; ou só o
pesquisador, antes); (b) o registro cuja procedência ninguém confirma (o link leva a outro documento, ou não abre para
ninguém) sai do funil com que motivo? O protocolo não diz.

**Hoje**
- 64 falhas em `03_screening/revisores/falhas_procedencia.json` (24/11): 46 "fora do ar" (`robots.txt` inalcançável 21;
  `robots.txt` que proíbe 9, Sucupira 7 e EBSCO 2; HTTP 404 5; HTTP 403 3; DOI sem título 3; página sem título 3; DOI
  sem registro 2) e 18 "não confere".
- No teste de 23/11, numa cópia, foram 51. A diferença de 13 está toda em "`robots.txt` inalcançável" (8 em 23/11, 21
  em 24/11); as outras classes têm os mesmos números.
- A falha da conferência só sai quando uma conferência nova dá "confere" (`procedencia.ts:333-352`); o lote de
  pendentes só leva registro com a procedência confirmada (`decisoes_revisores.ts:495-499`); o `gerar` recusa enquanto
  houver falha (`decisoes_revisores.ts:1083`). Página que proíbe robô, HTTP 404 e DOI sem registro não passam a
  "confere" enquanto a fonte não mudar: hoje a etapa de título e resumo não fecha.
- Lote 1: 679 registros em cada planilha; os revisores leem fora do sistema.

**Por quê**
- Pergunta dele: "(as solucoes para uma pesquisa em particular deveriam resolver os problemas dela e ajudar a construir
  o sistema para novas pesquisas) isso está de acordo com o que estamos planejando?" Sim, e é regra desde 20/11
  ("controles e regras (…) tem de valer para todos os protocolos"): as linhas 11 a 18 saíram desta pesquisa e valem
  para qualquer projeto. Aqui, o item 2 resolve o problema desta pesquisa, e o item 3 deixa no sistema o caminho para
  qualquer pesquisa que encontre fonte que recusa robô.
- Sem o item 3, a verificação pedida em 23/11 ("mandar verificar se sao e nao apenas inventar erros") pode concluir que
  a causa é da fonte, e a etapa continua sem fechar.
- Os revisores estão lendo agora: o ponto 3 tem de estar pronto antes de eles devolverem as planilhas.

#### 4. Retratação e fonte inexistente

**Proposta** — uma linha, geral:
1. Existência: conferir se a referência existe (DOI registrado em `doi.org`, título que confere) também sem projeto (na
   busca exploratória) e nas referências que o protocolo cita.
2. Retratação, correção e manifestação de preocupação, pelos metadados do Crossref, que reúne os dados do Retraction
   Watch (a conferir na fonte oficial, na própria linha).
3. O resultado é gravado e mostrado; sozinho, não exclui ninguém. O que fazer com a retratada é do protocolo ou do
   pesquisador.
4. A "camada a mais" inspirada no PaperQA2 (Future-House) espera ele dizer o que ela deve fazer; uso de IA nela é
   declarado (P6).

Decisão dele: o que a "camada a mais" faz — por exemplo, conferir se o que um texto cita existe e diz o que se afirma,
ou outra coisa.

**Hoje**
- O `verify_record_links` confere o título pelo DOI em `doi.org` (Crossref e DataCite) ou pela página, só sobre o
  insumo de uma etapa do projeto, com `projectPath` (`procedencia.ts:285-299`).
- Nenhum código lê retratação: nada em `crossref.ts` nem em `procedencia.ts`.
- O contato que o ReviewBR manda ao Crossref e ao Unpaywall é `vicente@prismaid.com` e `reviewbr@prismaid.com`
  (`crossref.ts:5`, `index.ts:1280`).

**Por quê**
- "penso que uma tools de verificacao de retratacao que use o que ja existe e que vai surgir possa ser muito util para
  o reviewbr para que alguem nao comece uma pesquisa com fontes inventadas" (25/11, 17h34); e, antes, "explicar ao
  inves de concordar" por que a retratação ficara para depois (17h24).
- O que existe faz metade, a existência; falta usá-la antes do projeto e somar a retratação.
- Na leitura das fontes oficiais de 23/11 (linha 13), a Cochrane trata retratação e estudo fraudulento (4.4.6). A
  conferência de procedência foi decisão dele, a mais, e não exclui ninguém; a retratação segue o mesmo desenho.

#### 5. Legado Go para `old/`

**Proposta** — linha curta: mover o código Go do prismAId que está em `reviewbr/` (56 arquivos `.go` rastreados fora
de `projects/`, `go.mod`, `go.sum` e as pastas que só têm Go, a conferir na linha) para `C:\reviewbr\old\` (fora do
git), mantendo o crédito ao prismAId no `CITATION.cff` e no `README.md`. Os três `.go` de
`reviewbr/projects/data_mining/scripts/` são do projeto e ficam.

Decisão dele, junto: o `reviewbr/LICENSE` (AGPL-3.0) sai com o Go, fica, ou o repositório passa a declarar a licença
do que fica?

**Hoje**
- `reviewbr/` é a árvore do prismAId: `LICENSE` (GNU AGPL 3.0), `CITATION.cff`, `go.mod`, `prismAId.go`, `cmd/`,
  `conversion/` e outras. O `prismaid.exe` está no disco, ignorado pelo git (`reviewbr/.gitignore:26`).
- O servidor está em `reviewbr/reviewbr-mcp/` (`package.json`: MIT) e não chama código Go: buscando "prismaid" no
  `src/`, só aparecem os dois endereços de contato do ponto 4.

**Por quê**
- Decidido: "2.1.1 e 21.2 ok, pode mover pra legado" (25/11; também em 24/11).
- O motivo que se sustenta é técnico: nenhuma tool usa o Go. O motivo jurídico do inventário ("contaminação" pela AGPL
  por estar na mesma pasta) não se sustenta como foi dito: a AGPL diz que a inclusão num agregado não estende a licença
  às outras partes (`reviewbr/LICENSE:223-231`, §5). Importaria o código TypeScript ser derivado do Go, o que não
  conferi. E mover não tira o Go do histórico público do git.
- Sem o Go, o `LICENSE` da pasta descreve o que não está mais lá; por isso a decisão vai junto.

#### 6. Arquitetura — o que decidir, sem código

**6.1 Plugabilidade** ("A plugabilidade pode ser a adequação as exigencias previamente (…) mas pode ser uma isenção
para todos para se adequar ao momento em que se exige um método. a segunda me parece muito mais difícil, e acho até que
impossível, mas imagino que seria a ideal.")
- Proposta: adotar a segunda forma até onde ela é possível. O núcleo registra tudo desde a busca exploratória, e o
  ReviewBR diz, para cada método candidato, que passo ele exige fixado antes; esse passo é o último momento de escolher
  o método. O primeiro passo concreto já está decidido desde 12/11: registrar a busca exploratória por padrão.
- Hoje: a busca sem projeto não grava nada no registro da busca (`index.ts:129-130`); o pedido de 12/11 está no "Visto
  de passagem" (linha 9). O controle por código (P5) já serve a qualquer protocolo: plano de busca, procedência e
  decisões dos revisores.
- Por quê: a isenção é impossível só no que o método exige antes da coleta (protocolo, critérios e plano fixados antes
  da busca), que não se cumpre depois. Tudo o que é registro (origem, contagem, decisão, log) se cumpre depois, se foi
  gravado desde o início. A segunda forma não é impossível: é possível até o primeiro passo que o método fixa antes.

**6.2 O plano por etapa** ("1.2 pode ser uma solução, mas seria a melhor?")
- Proposta: sozinho, não. A combinação: (a) o plano de cada etapa como dado, aprovado e congelado na trava, estendendo
  às outras etapas o que a linha 17 fez para a busca; (b) o código sabe a ordem das etapas e recusa a chamada fora
  dela; (c) na trava, a lista do que cada etapa precisa ter decidido, perguntada ao pesquisador, para o protocolo não
  chegar mudo à etapa; (d) só depois, um executor sem modelo para as etapas mecânicas.
- Hoje: a busca já funciona assim (plano congelado no `project_state.json`, cada execução conferida, emenda e desvio por
  tool, `podeAvancar`; linha 17). Da F3 em diante, não: a camada por palavras, a "dúvida", o registro sem resumo e a
  planilha foram decididos no chat depois da trava (seção "Pedido do Vicente de 23/11/2026").
- Por quê: o `plano_execucao.json` do Gemini resolve o que o protocolo já decidiu, mas as intervenções de 23/11 vieram
  do que o protocolo não dizia; sem (c), o plano congela o silêncio. (b) é o que protege contra o modelo fraco (6.3,
  desvio 3). (d) ajuda o pesquisador sem IA poderosa ("Visto de passagem", pedido de 23/11).

**6.3 Os quatro desvios** ("a ia criar sempre perguntas ao final de uma atividade, (…) o pesquisar querer fazer
alteracoes para burlar metodologia, (…) IAs de menor poder de processamento (…) não conseguirem seguir uma trilha,
outras possibilidades de uma pesquisa sair da trilha")
- Proposta, por desvio:
  1. Pergunta da IA no fim da atividade: o próximo passo sai do estado do projeto, por tool, e a sessão fecha dizendo só
     ele. Ideia fora do plano vai ao registro (`REGISTRO.md` ou "Visto de passagem"), não vira pergunta.
  2. Tentativa de burlar: toda recusa de trava fica gravada no projeto (quem, quando, o quê) e aparece no relato. É a
     decisão de 12/11 (P6), ainda não feita.
  3. Modelo fraco: a ordem e as conferências de cada etapa vão para o código (6.2 b). Teste de aceitação: um modelo
     menor roda um projeto de teste de ponta a ponta.
  4. Outras fugas: manutenção mudando o sistema debaixo da pesquisa (ponto 2); duas sessões ao mesmo tempo (ponto 1);
     tool quebrada contornada e decisão tomada no chat sem registro (já são as regras 5 e 4 do `RETOMAR.md`).
- Hoje: só a busca tem conferência por código depois da trava (linha 17), e a recusa dela já vai ao log. "Ao menor
  sinal de fuga, pare e pergunte" é conduta (skill `conduct-review`). A gravação da tentativa de burla foi decidida em
  12/11 e não existe ("Visto de passagem", linha 9). Numa sessão do Gemini, os agentes e as skills não são lidos
  (ponto 1, "Hoje").
- Por quê: o que funcionou na pesquisa foi trava em código, não texto de agente. A F2 se afastou do protocolo quando a
  trava era só texto, e parou de se afastar com a linha 17. Texto controla só o modelo que o lê; código controla
  qualquer modelo.

**6.4 Hipótese A** ("de acordo preferindo a hipotese A se isso nao implicar nos desvios comuns de IA")
- Proposta: a Hipótese A vem depois do 6.2 (b), não antes. Primeiro cada etapa ganha a conferência em código; depois os
  agentes de "troca de chapéu" se fundem num coordenador, e o `maintainer` fica separado.
- Hoje: fora da busca, o que separa as etapas é a lista de tools de cada agente (`tools:` no cabeçalho), que o Claude
  Code respeita e o Gemini não lê. "A arquitetura de agentes por papel" está em "O que não é fila" até ele pedir.
- Por quê: com um coordenador só, que tem todas as tools, a única barreira é o código. Onde a conferência ainda não está
  no código, tirar os agentes tira uma barreira, e isso é o desvio 3. Com o 6.2 (b) feito, a fusão quase só limpa texto.

**6.5 `maintainer.md`** ("nao lembro se o vi mencionado nesse inventario exautivo que pode tb ter sido superado (…) a
ver")
- Proposta: o agente fica, porque é a fronteira entre mexer no sistema e fazer pesquisa, com as tools de escrita da
  manutenção. DECLARAR: corrigir a L28 (P9: "sem o protocolo que a metodologia exige"); tirar a classificação pelo RAISE
  3 das L35-40 e da L231; dizer que as L183-193 valem só para o mapeamento de norma já transcrita; decidir as L380-385
  junto com os canônicos (7.2).
- Hoje: 385 linhas e 8 tools de manutenção no cabeçalho. A L28 diz "nada entra no funil sem protocolo travado"; as
  L35-40 e a L231 tratam o RAISE 3 como classificação em uso; as L183-193 descrevem a leitura documentada, que a linha 8
  deixou só para mapeamento de norma já transcrita; as L380-385 dizem "Não dê ao sistema uma tese própria (…) a isenção
  da ferramenta vem justamente de ela não ter epistemologia própria".
- Por quê: esses trechos dizem o que o sistema decidiu deixar de fazer (P9 e P6, 12/11). E as L380-385 contradizem a
  seção 2 do `METODO_ReviewBR.md` ("O ReviewBR tem os seus fundamentos científicos, os canônicos"), o que só se resolve
  com a decisão do 7.2.

#### 7. `METODO_ReviewBR.md`

**7.1 Atas e retratos** ("mas isso foi pontual e corrigido, não? de toda forma deve-se limpar traços disso.")
- Proposta: DECLARAR. O texto normativo fica com as regras (objetivo, princípios, etapas, critérios, limites), sem os
  blocos "Hoje" e sem as marcas de decisão no corpo. A origem de cada regra (A1..A9, D01..D41, datas, frases dele) vai
  para um anexo no fim. Nenhuma regra muda de sentido.
- Hoje: não foi pontual. O documento foi aprovado em 12/11 com dois tipos de texto, de propósito: "Decidido" (vale, com
  data e origem) e "Hoje" (fato do sistema em 12/11) — legenda em `METODO_ReviewBR.md:3-9`. São 9 blocos "Hoje" (linhas
  54, 100, 215, 251, 262, 294, 330, 366 e 411). A maioria ainda é verdade e já está no "Visto de passagem" (linha 9);
  parte envelheceu: o da linha 366 não conta a conferência por código da busca, que a linha 17 criou em 20/11.
- Por quê: retrato do sistema envelhece a cada linha da fila e passa a dizer o falso dentro do texto do método; o lugar
  do retrato é esta página.

**7.2 Os doze canônicos** ("Essa imaginação pode ser criticada e abandonada, não tentar encaixar se não comprir com
essas pretensões.")
- Proposta: tirar a lista do texto normativo. Onde uma regra tem origem real num autor (por exemplo, o protocolo fixado
  antes da busca, ou o controle positivo), fica uma linha de origem na própria regra, depois de conferida na obra. Se
  ele quiser a lista como leitura, ela vai para um anexo marcado "resumo do agente; obra não lida".
- Hoje: dos doze, os quatro primeiros foram aprovados um a um; os oito seguintes foram escolhidos e redigidos pelo
  agente, e "nenhuma obra foi lida nesta sessão: o resumo de cada uma é do agente" (`METODO_ReviewBR.md:103-106` e
  `:155`). Nenhum código, trilha ou tool lê a lista, que ocupa cerca de 60 linhas. Em 04/10 ele decidiu a isenção: "não
  acho que precisamos que o sistema assuma uma cultura para além do que exige o método" (`DIRECAO`, 5b), que é o que o
  `maintainer.md:380-385` ainda diz.
- Por quê, pelas três pretensões dele: "trilhas de pesquisa fidegnicas" — a fidelidade da trilha vem do controle por
  código (P5), não da lista; "educativo" — só educa resumo conferido na obra, e oito dos doze são resumo escrito antes
  de qualquer leitura; "cosmeticamente interessante" — é o ganho que fica, e não pede lugar no texto normativo.

#### 8. Ressalvas das tools ("4 resolver as ressalvas para tornar funcionais")

**Proposta** — "ressalva" é item do "Visto de passagem" ligado a uma tool. Uma linha por área, em série; cada uma
começa conferindo se o item é real hoje, e o que não se confirmar sai do "Visto" sem conserto:
- 8a, rede e repositórios: verificação de certificado desligada no processo inteiro (`http.ts`); HTTP 503 que derruba a
  busca grande; `search_repository` sem repositórios (1800 s); camada 2 com repositórios inativos; espera de ~90 s no
  DSpace sem API; UECE como "federal" no catálogo;
- 8b, importação e coleta: `harvest_records` sem gravar em `01_raw`; citações do snowball só na primeira página;
  `import_bvs_export` juntando registros distintos; `importRis` sem base declarada; aviso do `search_openalex` sem
  `projectPath`;
- 8c, projeto e estado: `initializeWorkspace` em DRAFT; SQLite gravado antes da validação; `topic` desatualizado;
  `projectPath` absoluto no log;
- 8d, os pedidos de 12/11 ao código (linha 9 do "Visto"), depois do ponto 6: tirar o mapa do RAISE 3 mantendo a guarda
  contra IA não declarada e gravando a tentativa, e os demais.

O que tocar etapa que ainda falta à pesquisa (a deduplicação depois da triagem, o texto completo) segue o ponto 2.

**Hoje**
- 49 tools registradas (`index.ts`: 49 chamadas `server.tool`; o guardião de governança contou 49 ao subir o servidor em
  26/11, `logs/reviewbr_2026-11-26.jsonl`). A divisão "30 íntegras e 19 com ressalvas" é do inventário do Gemini e não
  foi conferida.
- Os itens de cada área estão no "Visto de passagem", anotados sem avaliação. Conferido hoje só um: `http.ts:42-43` põe
  `NODE_TLS_REJECT_UNAUTHORIZED = "0"` durante o pedido, com `acceptSelfSigned: true` por padrão (`http.ts:24`).

**Por quê**
- Em 23/11 ele mandou verificar antes de tratar como defeito: "mandar verificar se sao e nao apenas inventar erros para
  justificar os achados". E só é achado o que o sistema afirma e não cumpre (`DIRECAO`, §9).
- Em série, para não editar em paralelo os mesmos arquivos; por área, para caber numa janela de 5 h. A rede vem antes
  das fontes novas, que herdariam os mesmos defeitos.

#### 9. Fontes novas e ASReview

**Proposta**
- DataCite, OpenAIRE Graph e OSF entram como fontes depois da 8a: cada uma com a tool ou o adaptador, a entrada no
  catálogo e o controle positivo, como as fontes de hoje.
- ASReview v2: investigação só de leitura, na fonte oficial: o que a versão atual oferece (API, MCP, formato de troca) e
  se cabe como parceiro externo e opcional. Triagem com aprendizado de máquina é escolha do protocolo de cada projeto, e
  é declarada (P6).

**Hoje**
- Não há serviço de DataCite, OpenAIRE nem OSF em `src/services/`. O DOI da DataCite já é conferido pela procedência,
  via `doi.org`.
- O ReviewBR exporta CSV para o ASReview LAB (`export_dataset`, formato `asreview`: `index.ts:958`, `data.ts:94`).
- O `roda_aromas_ceara` decidiu triagem sem IA (23/11).

**Por quê**
- "2.2.2 vamos incluir como fonte"; "asreview tb foi uma fonte de inspiracao. nao sei se ainda há isso como legado, mas
  vale investigar mais (…) talvez acoplar se tiver um mcp ou criar uma ferramenta para usar como parceiro" (25/11).
- Depois da 8a porque usam a mesma camada de rede. O ASReview como investigação porque hoje não se sabe o que a versão 2
  oferece.

#### 10. As listas do Gemini e o "Visto de passagem"

**Proposta**
- As listas R-01..R-28 e V-01..V-49 do inventário não viram índice desta página. Das R: a R-27 é o ponto 5; a R-24 (Bio
  Research) fica, como ele decidiu em 24/11; a R-03 vai à 8d. As R-01, R-02, R-22, R-23, R-25 e R-26 (mover para `old/`
  o `index.ts.tmp`, os `run_search_*.ts`, o `reviewbr-web/`, o `.zip` de 150 MB da raiz e o export de conversas do
  Antigravity; apontar o `.agents/skills.json`) entram no ponto 5 se ele disser. As demais, o próprio Gemini propôs
  conservar.
- Saem do "Visto de passagem", se ele mandar:
  - 2 que o próprio texto dá como consertados: o teto da Oasisbr, do OpenAlex e do SciELO; a camada mecânica por
    palavras;
  - 5 que são só registro: o `PASSAGEM.md` que o teste lê; o Git Bash com `c:/` (a rotina já manda usar o PowerShell);
    a decisão da deduplicação gravada no DEBT-025; o `data_mining/caju_beverages`; o servidor aberto antes do build de
    12/11;
  - 1 substituído: o das 51 falhas do teste de 23/11 (fica o de 24/11, com as 64 oficiais);
  - 6 subitens: no bloco de 15/11, "zero estudos incluídos" (conferido em 19/11), a busca à mão (linha 17) e a triagem
    em duas camadas (23/11); no bloco P1 a P6, o P5 (o catálogo chama hoje o `BR-AGG-0001` de BDTD, linha 18); no bloco
    da linha 11, a UFC que alternava e o IFCE com 1 registro (comportamento da fonte).

  Ficam 41 itens.

**Hoje**
- O "Visto de passagem" tem 49 itens. O inventário do Gemini dá 19 itens e subitens como resolvidos; pelo texto desta
  página, 13 deles estão; os outros vão com a linha da área deles, para conferir no código.

**Por quê**
- "5 talvez mude com os comentarios deste input"; "7 na proxima resposta tornar o quadro mais limpo e objetivo" (25/11).
- Duas listas das mesmas coisas são o risco do ponto 1.1; tirar o que já foi feito deixa no "Visto" só o que espera
  decisão.

#### Levado de novo ao Vicente em 26/11/2026 — o que ele não pôde responder

**3 — é do ReviewBR.** Pela regra de 23/11 ("Link que não confere ou não abre", na seção "Pedido do Vicente de
23/11/2026"), o registro com falha de procedência vai à manutenção e volta à revisão depois do conserto. Quando a causa
é da fonte (`robots.txt` que proíbe robô, HTTP 404, DOI sem registro), não há conserto no ReviewBR: a falha só sai com
uma conferência nova que dê "confere" (`procedencia.ts:333-352`), o lote de pendentes só leva registro conferido
(`decisoes_revisores.ts:495-499`) e o `gerar` recusa enquanto houver falha (`decisoes_revisores.ts:1083`). Em qualquer
pesquisa com fonte assim, a etapa de título e resumo não fecha. As 64 do `roda_aromas_ceara` só o mostraram; as
planilhas dos revisores têm os 679 que conferiram. Parte das 64 pode ser defeito do ReviewBR (a página da UECE lida
fora da codificação dela; página de verificação anti-robô contada como "não confere"; título do registro em inglês e o
da página em português): é o 3.2, conserto geral, com teste.
Proposta (FAZER, para qualquer pesquisa): (i) falha cuja causa é a fonte: o registro vai ao lote de pendentes com "o
link abriu o documento certo?" obrigatória; o "sim" confirma a procedência e grava quem e quando; (ii) se ninguém
confirma (o link leva a outro documento, ou não abre para ninguém), o registro sai do funil antes da leitura, com o
motivo "procedência não confirmada", contado à parte no fluxograma. Pergunta: aprova (i) e (ii)? Quem confirma: os
revisores, na planilha (recomendado: já têm a coluna), ou o pesquisador, antes?

**5 — a licença.** O repositório declara duas: AGPL-3.0 (`reviewbr/LICENSE`, `reviewbr/README.md:289`,
`reviewbr/CITATION.cff:26`) e MIT (`reviewbr/reviewbr-mcp/package.json:25`). Se o TypeScript deriva do código Go do
prismAId, que é AGPL, ele só pode ser AGPL; isso não foi conferido. Recomendação: AGPL para tudo, e o `package.json`
passa a dizer `AGPL-3.0-only` (DECLARAR, na linha 20). Trocar para MIT só depois de conferir que o TypeScript não
deriva do Go. Pergunta: de acordo?

**6.1 — antes de quê.** Antes da busca formal, a que conta para a revisão (etapa 4, "Execução", do
`METODO_ReviewBR.md`). Revisão sistemática e de escopo exigem o protocolo (pergunta, critérios, fontes, strings)
fixado antes dela, e isso não se recupera depois (P11, aprovado em 12/11: auditoria e trava antes da busca, quando a
metodologia as exige). Então: o ReviewBR grava tudo desde a busca exploratória sem pedir método; o método pode ser
escolhido a qualquer momento até a busca formal; depois dela, trocar de método vira desvio a declarar ou busca nova.
Metodologia que não exige protocolo prévio não tem esse limite. No `roda_aromas_ceara`: exploratória em 12/11,
protocolo travado em 15/11, busca formal de 19 a 23/11; o método de escopo tinha de estar escolhido até 15/11. Falta no
código: gravar a busca exploratória (pedido de 12/11, "Visto de passagem", linha 9). Pergunta: de acordo?

**6.2 e 6.3 — reescritos para impedir.** O problema (pedido de 23/11, "Visto de passagem"): mesmo com o protocolo
travado, decisões foram tomadas no chat (a camada por palavras, a "dúvida", o registro sem resumo, a planilha), e um
modelo fraco pode pular etapa. O plano por etapa do Gemini (inventário, 1.2: na trava, um `plano_execucao.json` com as
regras de todas as etapas) é dado: só impede se o código recusar o que foge dele, e só cobre o que o protocolo disse.
Proposta: três travas em código, que recusam:
1. **Decisão antes da etapa:** na trava, o ReviewBR pergunta o que cada etapa do método vai precisar decidir (registro
   sem resumo, "dúvida", número de revisores, como entregam). Etapa com decisão faltando não roda; a decisão só entra
   por emenda gravada (`record_protocol_amendment`), nunca no chat. Contra os desvios 1 e 2: a pergunta da IA que vira
   decisão no chat; a mudança sem registro.
2. **Ordem e insumo:** cada tool de etapa recusa rodar fora da ordem e recusa insumo que não saiu da etapa anterior
   (conferido por hash). Contra os desvios 3 e 2: o modelo fraco que pula etapa; o arquivo editado à mão.
3. **Sistema e sessão presos ao projeto:** o projeto grava a versão do ReviewBR com que travou (outra versão só roda
   com migração declarada) e aceita uma sessão por vez. Contra o desvio 4: o sistema mudado debaixo da pesquisa; duas
   sessões ao mesmo tempo.

Hoje, a 1 e a 2 existem só para a busca (linha 17: plano congelado, cada execução conferida, emenda por tool,
`podeAvancar`) e para as planilhas (hash do insumo, `decisoes_revisores.ts:1074`); a 3 não existe. Limite: o servidor
não impede a IA de perguntar no chat nem alguém de editar o código ou apagar o projeto; impede que isso mude o projeto.
O `plano_execucao.json` vira o formato dos dados da 1 e da 2. Depois, se ele quiser, um executor sem modelo para as
etapas mecânicas (6.2 d). Pergunta: aprova as três?

**8 — as tools.** São as 19 que o inventário do Gemini (seção 4) marca com ressalva; cada uma tem item neste "Visto de
passagem", e nenhuma foi conferida no código (ordem de 23/11). Uma linha por grupo, nesta ordem:
- rede e repositórios: toda tool que acessa a rede (`http.ts`: certificado sem verificação no processo inteiro);
  `search_repository` (sem `repositories`, 1800 s; HTTP 503 derruba a busca grande; ~90 s no DSpace sem API);
  `search_papers_optimized` (a camada 2 consulta inativos); `heal_repositories` (muda o catálogo do sistema e está
  entre as tools do `librarian`);
- coleta e importação: `search_openalex` (sem `projectPath`, diz que salvou e não salva); `harvest_records` (não grava
  em `01_raw`); `expand_search_snowball` (só a 1ª página de citações; erro vira lista vazia); `import_dataset_ris` (sem
  base declarada, o gate reprova); `import_bvs_export` (junta registros distintos com o mesmo DOI);
  `deduplicate_dataset` (não deixa escolher as entradas; reescreve o `database_records.json`);
- protocolo e estado: `plan_research_protocol` (esqueleto genérico com valores que ninguém deu; reescreve rascunho;
  grava no banco antes de validar; `topic` velho); `submit_protocol_for_approval` (auditor com itens do PRISMA 2020 em
  método de escopo; travou com `[TBD]`); toda tool que grava log com `projectPath` absoluto (`logToLocalProject`);
- texto completo: `retrieve_fulltexts` (não registra falhas); `retrieve_fulltext_byos` (DOI dentro de comando de shell;
  o recuperado segue contado como não recuperado); `download_and_extract_pdfs` (texto de antes de 12/11 sem página);
- método e IA, depois do ponto 6: `assess_research_design`, `query_methodology_catalog`, `absorb_methodology` (pedidos
  de 12/11) e `screen_candidates`, `batch_db_screen` (o RAISE 3).

Pergunta: aprova uma linha por grupo, nessa ordem, cada uma começando por conferir?

**10 — contexto.** Com a regra 9, a numeração R/V do Gemini não se usa. Resta tirar do "Visto de passagem" o que não
espera decisão:
- consertados: o teto de 1000 resultados da Oasisbr, do OpenAlex e do SciELO (23/11); a camada mecânica por palavras
  (23/11);
- só registro: o `PASSAGEM.md` que o teste lê; o Git Bash com `c:/` (a rotina já manda o PowerShell); a decisão da
  deduplicação (no DEBT-025 e na skill); o `data_mining/caju_beverages`; o servidor aberto antes do build de 12/11;
- substituído: as 51 falhas do teste de 23/11 (ficam as 64 de 24/11);
- subitens resolvidos: zero estudos incluídos (19/11); a busca à mão (linha 17); a triagem em duas camadas (23/11); o
  P5 (linha 18); a UFC que alternava e o IFCE com 1 registro (comportamento da fonte).

Pergunta: tiro?

### Linha 25 — Hipótese A: os agentes de etapa no coordenador (feita em 28/11/2026)

Decisão do Vicente: ponto 6.4 da seção "Pedido do Vicente de 25/11/2026", "6.4 ok" em 26/11, com a condição "preferindo
a hipotese A se isso nao implicar nos desvios comuns de IA". A condição veio primeiro: nenhuma barreira que a lista
`tools:` dava sumiu sem virar trava em código.

**Inventário — o que cada lista `tools:` barrava, e se o código já barrava** (antes da fusão):
- **Já em código (linha 24):** as 11 de busca e importação da F2; `deduplicate_dataset` (F3); `screen_candidates`,
  `batch_keyword_screen` (modo dos registros), `batch_db_screen` e `record_screening_decisions` (F4);
  `batch_llm_extract` (F5); `rag_index_corpus` (F5.5). Antes da trava, toda tool de busca, importação e texto completo
  recusa (`ProtocolGate`): o `designer` não buscava, e a tool também não deixa. O screener não buscar, o librarian não
  triar, o screener não extrair: a trava 2 recusa fora da ordem.
- **Só na lista — viraram trava (FAZER, commit `2d83e43`):** `expand_search_snowball` e `harvest_records` (só do
  librarian; tinham o nome passado à trava, mas nenhuma etapa os listava, e a `etapaDaTool` devolvia nada) → F2;
  `complete_record_keywords`, `verify_record_links`, `retrieve_fulltexts`, `download_and_extract_pdfs` e
  `retrieve_fulltext_byos` (só do librarian; "o screener não baixa"; o librarian "baixa só os incluídos") → F4 (F4.3),
  e o `retrieve_fulltexts` com `datasetPath` do chamador recusa o insumo. Consequência: texto completo antes de a F3
  fechar e colheita depois de a F2 fechar são recusados; o que faltar depois é emenda com `reabrir`.
- **Sem barreira a perder:** `record_researcher_decision`, a aprovação da `record_protocol_amendment` e a
  `submit_protocol_for_approval` já eram do coordenador, que é a sessão principal e não tem lista: quem grava as
  palavras do pesquisador não muda. Limite, que já existia: o código recusa o carimbo e não sabe quem escreveu.
  `heal_repositories` muda o catálogo, e a trava 3 já faz o projeto travado recusar até a emenda de migração. As de
  leitura e os gates (`get_screening_report`, `compute_flow_counts`, `validate_prisma_flow`, `audit_methodology`,
  `check_standard_coverage`, `rag_query`, `get_search_plan`, `query_methodology_catalog`, `assess_research_design`,
  `validate_repository`, `get_record_metadata`, `export_dataset`, `translate_document`, `batch_keyword_screen` no modo
  PDF) não gravam artefato do funil.
- **Nunca foi barreira:** as nativas (Read, Write, Edit, Bash, WebFetch) estavam em todo agente de etapa; "o screener
  não baixa" nunca impediu `curl` nem `Write` em `01_raw/`. O arquivo de etapa editado à mão é pego pelo hash quando a
  etapa seguinte roda (linha 24). No Gemini, os agentes não são lidos: lá a lista nunca valeu.

**Etapas sem tool, o que a fusão muda nelas:** nada em código, e não há trava a prometer. A extração escrita pelo
agente sem `batch_llm_extract`, o `evidence_synthesis.md`, o risco de viés, a síntese e o manuscrito só têm trava
quando uma tool da etapa é chamada; F6, F7 e F8 não têm tool de etapa. O que muda é o contexto: antes, o subagente
recebia só a fase corrente; agora o coordenador tem todas. O que segura a ordem é a trava 2 (a tool da etapa seguinte
recusa enquanto a corrente não fecha; sob `estrito`, só fecha com a decisão do pesquisador). Nas etapas sem tool, o
que confere são os gates da F8 (`export_dataset`, `validate_prisma_flow`, `check_standard_coverage`) e o pesquisador.
Está escrito assim na `conduct-review` e nas skills de etapa.

**Feito.**
- **FAZER, parte 1 (commit `2d83e43`):** as sete tools nos dois `manifest.json` (`step_tools` da F2 e da F4) e o nome
  delas na trava (`index.ts`). `tests/fusao_barreiras.test.ts`, 7 testes, falham antes; suíte 747 de 747.
- **FAZER, parte 2:** `role` da trilha passa a ser a skill do procedimento da etapa (`.claude/skills/<role>/SKILL.md`),
  não um agente: `errosDaTrilha` (e quem a chama: `lerTrilha`, `MethodologyWriter.validar`, `pendencias`) confere a
  skill; as mensagens dizem "procedimento: skill X". Nos dois manifests: F0/F1 `protocol-design`, F2
  `prisma-s-logging`, F3/F4 `screening-rules`, F5 `extraction-form`, F5.5 `evidence-reading`, F6–F8
  `synthesis-manuscript`. `agent_orchestrator`: os seis papéis de etapa saem; o COORDINATOR tem toda tool de projeto e
  nenhuma de escrita da manutenção. Testes: 2 novos no `fusao_barreiras`, o DEBT-100 do `maintenance_writes` com a
  mensagem nova (falham antes); `governance`, `escolha_com_contexto`, `porta_do_backlog` reescritos para o
  coordenador; 7 fixtures criam a skill em vez do agente. Suíte 744 de 744.
- **DECLARAR:** skill nova `protocol-design` com o corpo do `designer`; o corpo dos outros cinco foi para a skill da
  etapa (a aquisição de texto completo do `librarian` foi para a `screening-rules`, F4.3); `conduct-review` executa
  cada etapa com a skill dela e diz o que separa as etapas e o que não tem trava; `methodology-router`,
  `prisma-rigor-gates`, `scout.md`, `maintainer.md` (L170, L365), `.claude/README.md`, `TOOL_CONTRACTS.md`,
  `SYSTEM_PROMPT.md`, `METODO_ReviewBR.md` (6.2, só o sujeito: "o agente que propõe a síntese"), comentários e
  mensagens do servidor. Os seis agentes em `old/agentes_2026-11-28/`, listados no `LEGADO_em_old.md` com o último
  commit de cada um.

**Limite:** os dois `manifest.json` mudaram; pela trava 3, projeto travado recusa as tools de etapa até a emenda de
migração aprovada pelo pesquisador (é o alcance decidido em 28/11). Esta sessão não leu a pasta do `roda_aromas_ceara`.

### Linha 24 — travas em código por etapa (travas 1 e 2 feitas em 27/11/2026; a 3 em 28/11/2026)

Decisão do Vicente: pontos 6.2 e 6.3 ("Levado de novo ao Vicente em 26/11/2026") e a segunda resposta de 26/11, na
seção "Pedido do Vicente de 25/11/2026". Estende o que a linha 17 fez para a busca e o hash do insumo das planilhas.

**Feito (FAZER, com teste).** `tests/travas_etapa.test.ts`, 25 testes, falham antes (os módulos não existiam); suíte
729 de 729; gate CORRECAO.
- **Trava 1, decisão antes da etapa.** O método declara no `manifest.json` (`decisoes`) o que cada etapa vai precisar
  ter decidido: a pergunta, o que se decide, as opções e a consequência de cada uma. No `prisma-sr` e no
  `scoping-prisma-scr`, três, da F4: quem decide a triagem (revisores humanos por planilha, ou modelo de linguagem),
  quantos revisores por registro (dois ou mais, ou um) e a camada por palavras (sim ou não). Na trava, o
  `submit_protocol_for_approval` não trava sem `decisoes_etapas.json` (a resposta pode ficar `null`, a decidir) e
  congela as respostas no `project_state.json` (`trava_etapas`). Etapa com decisão faltando não roda; a decisão só
  entra pela `record_protocol_amendment` (`decisoes`), aprovada nas palavras do pesquisador. A resposta vale em
  código: a opção recusa tools (`recusa_tools`) e limita parâmetros (o número de revisores do formulário).
- **Trava 2, ordem e insumo.** A etapa de cada tool vem da trilha (`producer_tools` e o campo novo `step_tools`). A
  tool recusa se a etapa dela, ou uma posterior, já fechou; se a anterior não fechou (ela fecha quando a seguinte
  começa, pela regra dela: artefato gravado e, sob "estrito", a decisão do pesquisador); se o artefato que fechou a
  anterior mudou (hash gravado em `etapas_fechadas`; a pasta `01_raw/` pelo conjunto dos registros, que a
  consolidação da deduplicação não muda); e se recebe o insumo do chamador (`candidates`, o banco). Etapa fechada só
  reabre por emenda aprovada (`reabrir`).
- **Toda recusa** diz o que foi recusado, a regra do projeto e, quando a ação mudaria o projeto, que não pode e que o
  caminho é a emenda.
- Tools ligadas: as 13 de busca (pelo `checkDesignGuardrail`), `deduplicate_dataset`, `screen_candidates`,
  `batch_keyword_screen` (modo dos registros), `batch_db_screen`, `record_screening_decisions`, `batch_llm_extract` e
  `rag_index_corpus`. Textos: `designer.md` (passo 4) e `screener.md`.
- **Projeto travado antes de 27/11** (o `roda_aromas_ceara`): as travas valem das etapas depois da fase em que ele
  está no `project_state.json`; as decisões delas entram por emenda. Esta sessão não leu a pasta dele.

**Não declarado como decisão, e por quê:** o registro sem resumo e a "dúvida" no título e resumo. O código executa um
só comportamento para cada um (vai às planilhas como os outros; a dúvida segue para o texto completo), e opção que o
sistema não executa seria mentira. Entram como decisão quando houver o segundo caminho em código.

**Limite:** o servidor não impede a IA de perguntar no chat nem alguém de editar o `project_state.json` ou o código;
impede que uma tool de etapa rode contra o que o projeto decidiu. As etapas sem tool (extração escrita pelo agente,
síntese, manuscrito) só têm a trava quando uma tool da etapa é chamada.

**Trava 3, desenho levado ao Vicente em 27/11/2026** (o texto abaixo é o que ele leu):
1. Na trava, o projeto grava a versão do sistema que usa: o hash do `manifest.json` e da spec do método, do catálogo
   de repositórios e a versão do servidor.
2. Cada tool de etapa compara com a de hoje; diferente, recusa dizendo o que mudou, até uma emenda de migração (o que
   mudou no sistema e a decisão do pesquisador) congelar a versão nova.
3. Sessão: a primeira tool que grava abre a posse do projeto (arquivo com quem e quando), renovada a cada chamada;
   outra sessão é recusada enquanto a posse estiver viva; posse parada há mais de 2 h é retomada, com registro.
4. Limite: não vê quem edita os arquivos fora das tools. Pergunta: aprova, e a versão é só o que o projeto usa
   (recomendado) ou o commit inteiro (toda manutenção pararia a pesquisa)?

**Decisão do Vicente, 28/11/2026** (origem: "aprovo a trava 3"): a trava 3 se constrói como desenhada. Alcance: a
versão gravada é só o que o projeto usa — a opção recomendada no desenho; ele não escolheu a outra, e a frase não a
menciona. Consequência: manutenção que não toca no método do projeto, nos catálogos nem na versão do servidor não para
a pesquisa; a que toca para as tools de etapa até a emenda de migração.

**Trava 3, feita em 28/11/2026 (FAZER, com teste).** `tests/trava3_versao_posse.test.ts`, 11 testes, falham antes (o
módulo não existia); suíte 740 de 740; gate CORRECAO. Código em `src/services/versao_sistema.ts`.
- **Versão.** Componentes: `manifest.json` e `spec.md` do método, seguindo `extends` (o escopo leva os do
  `prisma-sr`), `repositories_catalog.json`, `bases_internacionais.json` e a versão do `package.json` do servidor. O
  `submit_protocol_for_approval` grava (`versao_sistema` no `project_state.json`); a `conferirEtapa` compara antes das
  travas 1 e 2, em toda etapa do projeto travado, e recusa listando cada componente que mudou. A emenda de migração é a
  `record_protocol_amendment` com `migracao: true`: lista o que mudou no `change_log.md` e, aprovada, grava a versão
  de hoje com a origem na emenda. Emenda de migração sem mudança é recusada.
- **Posse.** Arquivo `.posse_sessao.json` na raiz do projeto (sessão, máquina, aberta e renovada em). A sessão é o
  processo do Claude Code que abriu o servidor (pid pai) nesta máquina: reiniciar o servidor na mesma sessão não troca
  a posse. Conferida em toda tool de etapa (pela `travaDaEtapa`) e na `record_researcher_decision`, na
  `record_protocol_amendment` e na `submit_protocol_for_approval`. Retomada, com registro em `posses_retomadas`, se
  parada há mais de 2 h ou — acréscimo ao desenho — se o processo da sessão dona já não existe nesta máquina (sessão
  fechada não tem posse viva).
- **Projeto travado antes de 28/11** (o `roda_aromas_ceara`): a versão de hoje é gravada na primeira conferência de
  uma tool de etapa, com aviso; daí em diante vale a regra.
- **Limite:** não vê quem edita os arquivos fora das tools; a mudança de código que não sobe a versão do servidor nem
  toca no método ou nos catálogos não é vista (é o alcance decidido). Nas tools que não repassam avisos (busca,
  `rag_index_corpus`, `batch_keyword_screen`, `record_screening_decisions`, `batch_llm_extract`, `batch_db_screen`), a
  gravação da versão do projeto legado e a retomada da posse ficam só no `project_state.json`, sem aviso na resposta.

### Linha 19 — fonte inventada e retratação, desde a busca exploratória (feita em 27/11/2026)

Decisão do Vicente: ponto 4 (4.1 a 4.3) da seção "Pedido do Vicente de 25/11/2026", respondido em 26/11.
- **Fonte oficial, lida antes de construir (27/11/2026).** Crossref, "Retraction Watch" (documentação atualizada em
  19/01/2025): o Crossref adquiriu a base Retraction Watch em 09/2023 e a atualiza a cada dia útil; na REST API, o
  aviso traz `update-to`, e cada atualização tem `source` = `publisher` (o editor) ou `retraction-watch`; correções e
  manifestações de preocupação da Retraction Watch não são tão completas quanto as retratações. "Participating in
  Crossmark" (atualizada em 12/08/2026): 12 tipos de atualização no esquema (addendum, clarification, correction,
  corrigendum, erratum, expression_of_concern, new_edition, new_version, partial_retraction, removal, retraction,
  withdrawal). Conferido na API no mesmo dia: a obra atualizada traz `updated-by` (a documentação não o cita); a API
  devolve também `expression-of-concern`, com hífen; o editor pode pôr "RETRACTED:" no título registrado.
- **FAZER, com teste.** Tool `verify_references` (`services/referencias.ts`). Existência: com DOI, registro em doi.org
  e título que confere (a regra do `verify_record_links`); sem DOI, com endereço, o título da página; só com título, a
  busca bibliográfica do Crossref (não achar ali não prova que não existe, e a situação diz isso). Atualizações: o
  `updated-by` do Crossref, por aviso (tipo, rótulo, fonte, DOI do aviso, data, id da Retraction Watch), e o
  `update-to` quando a referência é ela mesma um aviso; DOI fora do Crossref (DataCite) sai como "não consultada", com o
  motivo. Três origens: lista, sem projeto (busca exploratória); os DOIs do `protocol.md`; o insumo do estágio, que
  reaproveita a conferência gravada do `verify_record_links`. O resultado vai a `logs/lote/` (com projeto) e ao
  `audit_logs` (sempre) e é mostrado; não exclui ninguém e não grava nos dados do projeto. Junto: a marca
  "RETRACTED:"/"WITHDRAWN:" no começo do título registrado deixa de impedir a conferência de título (vale também para o
  `verify_record_links`).
- **DECLARAR:** `scout`, `designer` e `librarian` dizem quando usar a tool; papéis no `agent_orchestrator`.
- **Conferência:** `tests/referencias_retratacao.test.ts` (15 testes; falham no código anterior); suíte 702 de 702;
  build; gate `validate_system_change` CORRECAO válido. Controle na rede real, 27/11: 10.1177/1758835919874651
  retratado (editor e Retraction Watch); 10.1371/journal.pone.0085625 com manifestação de preocupação; DOI inventado
  "DOI sem registro"; 10.5061/dryad.8515 (DataCite) existe e "não consultada"; um título só, achado pela busca
  bibliográfica (10.1538/expanim.54.1, retratado); um título inventado "não encontrada no Crossref".
- **Não fez:** a "camada a mais" (4.4), que vai à investigação da linha 22; referência do protocolo sem DOI só entra
  pela lista, com o título (ler a bibliografia do `protocol.md` sem IA não é confiável).
- **Decisão do Vicente, 27/11/2026:** as planilhas dos revisores não terão coluna de retratação. O resultado do
  `verify_references` fica só no registro da execução (`logs/lote/` e `audit_logs`) e não muda planilha, insumo nem
  relatório do estágio. Motivo: o protocolo está travado, e a falta da coluna não torna impossível seguir a pesquisa
  (a mesma regra de 20/11: emenda só se for impossível seguir). Origem: "nao terá essa coluna de retratacao na
  planilha. protocolo esta fechado e isso não torna impossivel seguir."

### Linha 23 — procedência que a conferência não confirma: limitação registrada (feita em 26/11/2026)

Decisão do Vicente: segunda resposta de 26/11, ponto 3, na seção "Pedido do Vicente de 25/11/2026". Commit `6125977`.
- **FAZER, com teste.** `formulario`: todo o insumo vai à planilha; o registro cuja procedência a conferência não
  confirmou entra com a situação na coluna "conferência do link", e o resumo o conta como limitação registrada.
  `pendentes`: um lote com o que não está em planilha nenhuma (as planilhas de antes de 26/11 deixavam fora por
  procedência). `importar`: o "não" do revisor no link vai à lista de procedência, como antes, e não decide nada; com
  ele, pergunta em branco é aceita (a instrução de antes de 26/11 mandava deixar em branco). `gerar`: não recusa por
  procedência; o relatório do estágio traz `procedencia` (os não confirmados pela conferência, por motivo, e os que
  algum revisor marcou com o link que não abriu), para o relato.
- **Escolha minha, mostrada ao Vicente em 26/11:** no título e resumo, a pergunta em branco ao lado do link que não
  abriu conta como dúvida, e o registro segue para o texto completo (MAYBE), como na regra da dúvida de 23/11; no texto
  completo, sem "conseguiu ler?", o registro é não recuperado.
- **DECLARAR:** as descrições do `verify_record_links` e da `record_screening_decisions`, o `procedencia.ts`, a
  instrução da planilha, a skill `screening-rules` e o agente `screener` dizem a regra nova.
- **Conferência:** `tests/procedencia_limitacao.test.ts` (5 testes, que falham no código anterior); 4 testes antigos
  reescritos para a regra nova; suíte 687 de 687; build; gate `validate_system_change` CORRECAO válido.
- **Controle no caso real**, numa cópia temporária de `C:\roda_aromas_ceara` (apagada depois; a pasta real não foi
  tocada): `pendentes` gerou o lote 2 com exatamente os 64 que o manifesto de 24/11 deixou fora; com respostas
  sintéticas (lote 1: "sim" em tudo; lote 2: link "não" e perguntas em branco), `importar`, `consenso` e `gerar`
  fecharam o estágio, 743 = 743, com a limitação: 64 não confirmados (21 com `robots.txt` inalcançável; 18 não
  conferem; 7 da Sucupira e 2 da EBSCO com `robots.txt` que proíbe; 5 HTTP 404; 3 HTTP 403; 3 DOI sem título; 3
  páginas sem título; 2 DOI sem registro).
- **Para a pesquisa** (passo da sessão dela, não da manutenção): gerar o lote 2 com `pendentes` e mandá-lo aos
  revisores; as planilhas do lote 1 seguem como estão, e a importação aceita a instrução antiga.
- **Não fez:** o 3.2, conferir uma a uma se o ReviewBR lê errado alguma das 64 (o acento da UECE, a página anti-robô
  contada como "não confere", o título em outro idioma). Fica no "Visto de passagem", como problema menor, pela direção
  dele de 26/11.

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

- Cinco skills dizem a que agente pertencem, e nenhum desses cinco agentes nomeia a sua skill: `reader` e
  `evidence-reading`, `extractor` e `extraction-form`, `librarian` e `prisma-s-logging`, `screener` e
  `screening-rules`, `analyst` e `synthesis-manuscript`.
- `reviewbr/projects/` tem cerca de 380 arquivos rastreados no repositório público.
- `PASSAGEM.md` ficou na pasta da manutenção porque `tests/porta_do_backlog.test.ts` lê o texto dele.
- (linha 1) `scihub_bridge.ts` monta o comando do python interpolando o DOI numa string de shell (`exec`,
  `--doi "${doi}"`).
- (linha 1) O `retrieve_fulltexts` não registra os que falharam. Desde a linha 1, o BYOS só aceita DOI que esteja em
  `03_screening/fulltext_not_retrieved.json`; desde a linha 13 (23/11/2026), quem grava esse arquivo é o `gerar` do
  texto completo da `record_screening_decisions`, a partir das planilhas dos revisores.
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
    travado em 15/11 tem outra (só a cajuína). Nada atualiza o campo depois da `plan_research_protocol`.
- (projeto `roda_aromas_ceara`, 19/11/2026) `src/utils/http.ts`, com `acceptSelfSigned: true` por padrão, põe
  `NODE_TLS_REJECT_UNAUTHORIZED = "0"` no processo inteiro durante o pedido: a verificação do certificado fica
  desligada também para pedidos simultâneos.
- (linha 14, 19/11/2026) O `heal_repositories` muda o catálogo do sistema e está entre as tools do `librarian`, agente
  do projeto.
- (linha 15, 19/11/2026) O `importRis` grava `provenanceSource: "Local File Import"` quando não há base declarada nem
  tag `DB` (já anotado na linha 2); o `repositoryName` continua vazio nesse caso, e o gate reprova.
- (linha 16, 20/11/2026) O `import_bvs_export` grava pelo mesmo `appendRawRecords` sem `manterTodosDoLote`: dois
  registros distintos do mesmo export BVS com o mesmo DOI continuam virando um.
- (projeto `roda_aromas_ceara`, passo C, 23/11/2026) O `search_repository` na Oasisbr inteira (`BR-AGG-0006`),
  consulta `cajuína`: a fonte declara 2997 e vêm só 1000, com `maxResults` 1000 e também com 5000 (o teto de 1000
  não vem do parâmetro e não é dito na resposta; o log marca "truncada"). O protocolo pede recuperar tudo o que a
  fonte informa. Passo parado depois dessa fonte. Visto também: entre os 1000 há registros sem relação aparente com
  o termo (ex.: nº 51, "O Comitê Gestor do IBS"); não conferido se a consulta casa com texto completo.
  **Consertado em 23/11/2026** a pedido do Vicente ("a busca é de escopo, nao deve ter teto!"), gate
  `validate_system_change`: CORRECAO. Causa: a API do VuFind não pagina além da página 10 (a 11 repete a 10). O
  `searchDetailed` cobre o que passa de 1000 em fatias (ano por bisseção, sem ano, rede, prefixo do id `REDE_<hash>`);
  o `search_openalex`/`search_scielo` também tinham teto (só a 1ª página, 200) e agora paginam por cursor. Conferido
  no `dist`: Oasisbr `cajuína` 2997 de 2997; OpenAlex 2639 de 2639; SciELO 79 de 79. A suíte (`npm test`) não roda
  neste PC: "No test suite found" nos 64 arquivos, igual sem a mudança.
- (projeto `roda_aromas_ceara`, 23/11/2026) Com a cobertura sem teto, a Oasisbr recebe ~100+ pedidos por busca grande;
  um HTTP 503 no meio derruba a execução inteira (sem nova tentativa no `fetchText` para 503). Repetida, completou.
- (projeto `roda_aromas_ceara`, F3, 23/11/2026) O `deduplicate_dataset` não deixa escolher as entradas: com
  `projectPath`, o `consolidateRaw` soma todo `01_raw/*.json`, e ali está também a execução do OpenAlex cortada em 200
  (`dataset_openalex_2026-11-23_15-21-53-903Z.json`), que fica como histórico e não entra na F3. Lidos em ordem
  alfabética, os 200 entram pelo arquivo cortado e o arquivo completo (2639) contribui só 2439: o total fecha (3148 +
  2639 + 79 = 5866, conferido fora da tool, sem gravar), mas 200 registros ficam com o `audit` da execução cortada
  (`extractionDate` 15:21:53), não da completa. A consolidação também reescreve `01_raw/database_records.json` (fora
  do git, única cópia dos 3148 da CAPES e dos repositórios) com os 5866. Sem `projectPath`, a tool pede o JSON inteiro
  como texto e não grava relatório. Passo F3 parado antes de rodar.
  **Contornado no projeto no mesmo dia** (anotado no log da pesquisa; não impede a execução): o arquivo cortado foi para `01_raw/fora_da_f3/`, e a F3 rodou (5866 → 5446). O conserto segue a fazer.
- (projeto `roda_aromas_ceara`, F4, 23/11/2026) A camada mecânica da triagem não tem tool que a faça como o protocolo
  manda: passar os registros de `02_deduplicated/dataset.json` (5446) cujo título, resumo ou palavras-chave trazem
  ao menos um dos termos, com curinga (`aroma*`, `volát*`…), e passar também todo registro sem resumo. O
  `batch_keyword_screen`, que o protocolo nomeia (F4.1.3), lê PDFs de uma pasta. O `batch_db_screen` lê o banco por
  `projectId`, não o arquivo; não trata curinga nem palavras-chave nem registro sem resumo, e não grava os artefatos
  do funil. A F4 não começa; nada foi rodado.
  **Consertado em 23/11/2026** a pedido do Vicente (commits `8f3466b` e `9a679aa`): o `batch_keyword_screen` roda a
  camada sobre os registros do projeto, e o `complete_record_keywords` completa as palavras-chave pela fonte. Detalhe
  na seção "Pedido do Vicente de 23/11/2026", acima.
- (pedido do Vicente, 23/11/2026, ao fechar o desenho da planilha dos revisores do `roda_aromas_ceara`) Avaliar o
  ReviewBR para o pesquisador que não tem uma IA poderosa ligada a ele. Mesmo com o protocolo travado, decisões que
  pareciam simples (a camada por palavras, o que fazer com a dúvida, a planilha dos revisores, a procedência dos links)
  pediram muitas intervenções no chat com a IA. Pergunta dele: como um sistema assim facilita a vida de um pesquisador
  sem essa possibilidade? **Antes de avaliar, conferir se isso já foi pensado e resolvido** (DIRECAO, METODO, decisões
  de organização, débitos e catálogo). Origem: "precisamos avaliar se dadas as necessidades de tantas intervencoes no
  chat com ia para decisoes que pareciam simples quando há protocolo travado, como que um sistema assim facilitaria a
  vida de um pesquisador sem que ele tenha a possibilidade de plugar o reviewbr em uma IA poderosa como as que eu tenho
  acesso. vale colocar isso como insumo da manutencao com aviso de avaliar se isso ja nao foi pensado e solucionado."
- (linha 13, teste real numa cópia do `roda_aromas_ceara`, 23/11/2026) Visto na conferência de procedência, sem
  avaliação; a sessão do projeto, ao rodá-la, leva a lista dela para cá (decisão de 23/11). Dos 51 que não conferiram
  ou não abriram: 9 cujo `robots.txt` proíbe (Sucupira 7, EBSCO 2); 8 em 4 sites com `robots.txt` inalcançável, que a
  RFC 9309 manda tratar como proibido (teses da UFC, DSpace da UFCG, revistas da UFPI, TCC da USP); 8 com HTTP 403 ou
  404; 3 páginas sem título declarado; 5 DOI sem título registrado (3) ou sem registro (2); 9 páginas de verificação
  contra robô ou que só declaram o nome do sistema ("Verificando conexão" na Oasisbr, "Certificando de que você não é um
  bot!", Biblat, UIS, "DSpace" na UFRN, "Sophia Biblioteca"), que contam como "não confere"; 3 na UECE, cuja página dá só
  "SidUece", com o acento estragado (a página não é lida na codificação dela); 4 com o título do registro em inglês e o
  da página em português (3 dos Cadernos Cajuína, 1 da UFCG); 2 registros que não são o documento ("Template for
  Authors"; "In Other Journals", com o DOI de outro artigo).
  **Ordem do Vicente (23/11/2026), ao ler este item:** estas falhas não parecem ser do ReviewBR. Antes de tratá-las como
  falha do sistema, verificar cada uma: abrir o link como uma pessoa abriria e dizer se o defeito existe e se a causa é
  do ReviewBR (a conferência, o registro gravado) ou da fonte (bloqueio a robô, página fora do ar, metadado da fonte).
  Não contar como achado o que não se confirmar. Consequência: nenhuma destas 51 vira achado nem conserto sem essa
  verificação. Origem: "estes erros nao parecem ser da ferramenta reviewbr. mandar verificar se sao e nao apenas
  inventar erros para justificar os achados."
- (projeto `roda_aromas_ceara`, F4, 24/11/2026) Conferência oficial de procedência (`verify_record_links`, estágio `ta`, sobre os 743 de `03_screening/passed_keywords.json`): 679 conferem e 64 ficaram em `reviewbr/projects/roda_aromas_ceara/03_screening/revisores/falhas_procedencia.json` (18 "não confere", 46 "fora do ar"); planilhas do lote 1 geradas com os 679. Vale a ordem do Vicente de 23/11 acima antes de tratar qualquer uma das 64 como falha do ReviewBR. **Desde a linha 23 (26/11/2026)**, as 64 são limitação registrada e não impedem a pesquisa; conferir se alguma é defeito do ReviewBR fica como problema menor.
- (26/11/2026, ao gravar as respostas do Vicente à revisão do plano) O `.agents/skills.json` aponta para
  `C:/REVIEWBRGEMINI/skills`, que não existe neste PC: numa sessão do Gemini, os agentes e as skills do ReviewBR não são
  lidos (ponto 1 da seção de 25/11, "Hoje"; o inventário do Gemini, R-22, propõe apontar para `.claude/skills`). A
  resposta dele ao ponto 5 (mover para `old/`) não alcança este item.
- (linha 19, 27/11/2026) `librarian.md:43` ainda diz que o registro cuja procedência não confere "só volta à leitura
  depois do conserto (`somenteFalhas`)"; desde a linha 23 ele vai à planilha com a situação à vista. A linha 23
  declarou a regra nova na skill `screening-rules` e no `screener`, não no `librarian`.
- (linha 20, 27/11/2026) Ficaram em `reviewbr/` restos do prismAId que não são Go e que a decisão não alcança: `docs/`
  (o site do prismAId), `figures/`, `.github/` (workflows que compilam o Go que saiu; numa subpasta, o GitHub não os
  roda), `test.sh`, `tika-service.sh`, `CHANGELOG.md`, `changelog260226.md`, `deleted_files.txt`, `missing_scripts.txt`
  e, fora do git, o `prismaid.exe`.
- (linha 20, 27/11/2026) `PLANO_TECNICO_aquisicao_premissa.md` (raiz, linhas 238 e 258) ainda planeja mudanças no
  `reviewbr-web/`, que foi para `old/`.
- (linha 20, 27/11/2026) Os scripts de `reviewbr/projects/data_mining/` (`caju_beverages/scripts/*.js`,
  `web_ui/server.js`) chamam `src/scripts/run_search_cli.ts`, que já não existia antes desta linha; só sobrava o
  compilado em `dist/scripts/`, fora do git.
