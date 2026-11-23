# Retomar — roda_aromas_ceara (página única de entrada)

**Não substitua esta página.** Sessão que precisar gravar onde parou atualiza a seção "Estado" e a tabela de passos.

Atualizado em 20/11/2026. Escrito para ser seguido por qualquer modelo (Opus ou mais barato).

## Regras para qualquer sessão

1. Leia esta página e as "Decisões" do `REGISTRO.md`. Não leia outras pastas de `reviewbr/projects/`.
2. Uma sessão faz **um** passo da tabela abaixo e para.
3. Não reabra o que o `REGISTRO.md` ou o `DESENHO_artigo1.md` marcam como decidido. Não pergunte de novo sobre
   Comitê de Ética, autoria (os campos ficam em branco) nem tipo de publicação (preprint; revista é desejável).
4. Decisão nova do Vicente: grave no `REGISTRO.md` em forma precisa (o quê, alcance, consequência), com a frase
   dele como origem. Decisão sobre etapa do método: também pela tool `record_researcher_decision`, com as palavras
   dele. Nunca escreva a contribuição por ele.
5. Tool do ReviewBR falhou ou devolveu algo incoerente: pare o passo, anote uma linha no "Visto de passagem" de
   `.claude/maintenance/FILA.md` e avise. Não contorne com script, WebSearch nem outra ferramenta. Não edite o
   código do ReviewBR a partir deste projeto.
6. Antes de disparar agente, diga quantos são e quanto devem gastar. Dispare sempre com o modelo declarado (`opus` ou mais barato): nenhum agente do ReviewBR fixa modelo, e sem isso ele herda o da sessão. Medida de 12/11: cada agente desta pasta
   custou cerca de 0,5% da semana (estimativa).
7. Zero resultado só vale com controle positivo na mesma fonte.
8. Termine com: `REGISTRO.md` e esta página atualizados, e commit.

## Estado

- **23/11/2026: F4, camada mecânica por palavras, feita.** `complete_record_keywords` completou as palavras-chave
  de 2847 registros pela fonte (dataset sem mudança); `batch_keyword_screen` com os 21 termos do protocolo:
  **743 passam para a leitura humana (533 por termo, 210 só por não ter resumo), 4703 excluídos; 743 + 4703 = 5446**,
  conferido também fora da tool. Detalhe no `REGISTRO.md`, "Passo D, F4, camada mecânica por palavras". **Próximo: a
  manutenção da linha 13 (planilha dos revisores), em chat de manutenção (prompt abaixo); depois, a camada humana
  sobre os 743.** Decidido em seguida (`REGISTRO.md`, "Decisões", 23/11/2026): triagem dupla sem emenda, coluna de
  "dúvida" (segue para o texto completo), nenhuma IA, conferência dos links por título antes da leitura. Falta
  decidir os campos de identificação do revisor no topo da planilha.
- Artigo 1: revisão de escopo (`scoping-prisma-scr`), controle estrito. **Protocolo v1.0 TRAVADO em 15/11/2026**
  (`project_state.json`: LOCKED, fase F2). Mudar o protocolo agora exige emenda registrada.
- **Emenda 2 APROVADA em 21/11/2026 (protocolo 1.1 → 1.2), feita na sessão de manutenção a pedido do Vicente.**
  Entra a **Oasisbr (IBICT) inteira** (fonte `oasisbr` do plano, `search_repository` `BR-AGG-0006`, sem filtro de
  rede, consultas `cajuína` e `cajuina`, com controle positivo): agora são 12 fontes. Motivo: o catálogo chamava a
  BDTD de "Oasisbr" e a Oasisbr inteira nunca foi buscável; a manutenção separou as duas no mesmo dia. A BDTD segue
  como `BR-AGG-0001`. Ver `change_log.md` (emenda-2) e `REGISTRO.md`. Em 21/11/2026 o DNS do `ibict.br` não
  respondia (BDTD e Oasisbr fora do ar).
- **A busca da F2 (passo C, segunda parte) só começa com a BDTD e a Oasisbr respondendo (Vicente, 21/11/2026).**
  Alcance: nenhuma fonte do plano é buscada antes disso, para as 12 rodarem juntas. Consequência: com o IBICT fora,
  a sessão confere se `bdtd.ibict.br` e `oasisbr.ibict.br` respondem e, se não, para sem buscar. Origem: "nao acho
  que disparar a pesquisa sem estes pode ser considerada uma busca de scopo".
- **22/11/2026: conferido de novo, parado sem buscar.** As páginas da BDTD e da Oasisbr respondem, mas a **busca da
  BDTD não**: a API devolve HTTP 400, "Problem connecting to Solr.", para qualquer consulta. A Oasisbr busca
  normalmente. Nada foi buscado (detalhe no `REGISTRO.md`, "Passo C, segunda parte: parada em 22/11/2026"). A
  conferência tem de testar uma **consulta na API** (`/vufind/api/v1/search?lookfor=agua&limit=0` devolvendo
  `"status":"OK"`), não só a página de entrada.
- **23/11/2026: F3 feita, com contorno anotado.**
  - O problema: o `deduplicate_dataset` soma todo `01_raw/*.json` e levaria junto a execução cortada do OpenAlex.
  - O que se fez: esse arquivo foi para `01_raw/fora_da_f3/`, com uma cópia dos 3148 da F2.
    O problema e o contorno estão no log da pesquisa, e a tool será consertada na manutenção (item no "Visto de
    passagem" da FILA).
  - O resultado: **5866 → 5446 únicos, 420 duplicatas removidas, 36 pares sinalizados e não removidos.** Não há
    par tese × artigo. Um par artigo × capítulo ficou em dúvida.
  - Detalhe no `REGISTRO.md`, "Passo D, F3".

  **Decisão do Vicente sobre a F3 gravada (23/11/2026):** os 36 pares sinalizados ficam e são resolvidos por
  nova deduplicação depois da triagem (`REGISTRO.md`, "Decisões"; `F3_pares_em_duvida.md`). **A F4 espera a
  manutenção:** nenhuma tool faz a camada por palavras como o protocolo manda (o `batch_keyword_screen` lê PDFs; o
  `batch_db_screen` lê o banco, sem curinga nem a regra do registro sem resumo). Item no "Visto de passagem" da
  FILA, 23/11/2026. A linha 13 (decisões dos revisores) teve o alcance decidido pelo Vicente em 23/11/2026: itens 1
  a 3; o item 4 sai. **Próximo: a sessão de manutenção, depois a F4 (prompts abaixo).**
- **23/11/2026: manutenção da camada por palavras feita** (FILA, seção "Pedido do Vicente de 23/11/2026"). O
  `batch_keyword_screen` roda a camada sobre os registros do projeto; antes dela, o `complete_record_keywords`
  completa as palavras-chave pela fonte (só 50 dos 5446 registros as tinham; a Oasisbr as guarda num campo que a busca
  não lia). Decidido pelo Vicente no mesmo dia: a camada segue sem diferença de acento, e as decisões dos revisores
  entram por planilha que o ReviewBR gera e importa (FILA, seção "Pedido do Vicente de 23/11/2026"). **Próximo: (1) a
  F4, camada por palavras, em chat novo; (2) depois, a manutenção da linha 13 (planilha dos revisores), em outro chat
  novo. Os dois prompts estão abaixo, nessa ordem; não rodar os dois ao mesmo tempo.**
- **23/11/2026: F2 completa.** Oasisbr (2997 + 2997) e OpenAlex (2639) refeitos com o servidor novo, tudo o que
  a fonte declarou. Próximo: linha 13 da FILA (decisões dos dois revisores) e depois o passo D (F3/F4).
- **23/11/2026, depois: busca seguida e teto consertado.** Feitas as 9 fontes abertas; com teto só a Oasisbr (1000
  de 2997) e o OpenAlex (200 de 2639). Teto consertado no ReviewBR (gate CORRECAO). **Próximo, em chat novo (ou
  depois de reconectar `reviewbr` no `/mcp`): refazer Oasisbr `cajuína`, Oasisbr `cajuina` e OpenAlex, com o
  mesmo `registroDaBusca` do `REGISTRO.md`, conferir declarado = recuperado, e fechar a F2.**
- **23/11/2026: busca começada e parada na Oasisbr.** BDTD feita (25, controle positivo passou). Oasisbr `cajuína`:
  declara 2997, a tool traz no máximo 1000 (teto não dito na resposta) → regra 5, parado, item no "Visto de
  passagem" da FILA. As outras fontes não foram buscadas. Detalhe, cobertura lida de cada fonte e tabela no
  `REGISTRO.md` ("Passo C, segunda parte: 23/11/2026"). Próximo: manutenção do teto, em chat de manutenção.
- O que vale é o `protocol.md`. O `DESENHO_artigo1.md` é o histórico de como se chegou a ele; onde os dois
  divergirem (a string, a conferência de 20%, o Rayyan), vale o protocolo.
- A parte do Vicente no passo C foi feita em 19/11/2026: Scopus 23, Web of Science 17 e FSTA 14 registros, todos com
  resumo e com controle positivo. Os RIS e as anotações (`ANOTACOES_busca_manual.md`) estão em `01_raw/manual/`,
  fora do git. A importação (`import_dataset_ris`) fica para o passo C.
- **Ordem combinada (Vicente, 19/11/2026):** as linhas 11 e 12 da `.claude/maintenance/FILA.md` vêm antes do passo C;
  a linha 13 vem antes do passo D.
  - Linha 11 (repositórios): **feita em 19/11/2026**, commit `4936c59`. BDTD, UFC e UFPI buscam e mostram o total da
    fonte. UECE, Alice e Infoteca-e ficaram marcadas como **não pesquisáveis pela ferramenta** (HTTP 403; o
    `robots.txt` proíbe a busca por robô), e a tool diz isso em vez de dar zero.
  - Linha 12 (OpenAlex e SciELO): **feita em 19/11/2026**, commits `f290ac9` e `ba21610`. O OpenAlex traz resumo e
    endereço; o SciELO é alcançado pelo OpenAlex com o prefixo de DOI 10.1590 (SciELO Brasil), por decisão do
    Vicente, e o registro da busca declara isso.
  - Linha 13 (decisões dos dois revisores): a fazer, antes do passo D.
  - Linha 14 (acesso por robô, conferência jurídica e ética): **feita em 19/11/2026**, mesmos commits; conferência em
    `.claude/maintenance/CONFERENCIA_acesso_2026-11-19.md`. O ReviewBR se identifica (User-Agent) e respeita o
    `robots.txt`. Decisão do Vicente (19/11/2026): fonte que o ReviewBR não alcança diretamente é alcançada pela
    plataforma de ciência aberta que a agrega, **sempre declarando onde se viu**; o total relatado é o da
    plataforma. **UECE, Alice, Infoteca-e e UFC agora são alcançadas pela Oasisbr; o SciELO, pelo OpenAlex com o
    prefixo 10.1590.** Se a tabela de fontes do protocolo precisar dizer isso, é emenda (`change_log.md` nesta
    pasta, `REGISTRO.md` e decisão dele na F2); esta sessão não a fez.
  - Linha 15 (falha F9): **feita em 19/11/2026**, mesmos commits. O `import_dataset_ris` só descarta o registro
    repetido da mesma fonte; o mesmo DOI de duas bases fica nas duas, e a remoção entre bases é da F3, com
    relatório. A importação grava a base declarada (`sourceName`) e usa o DOI como endereço quando falta `UR`.
- **Sessão do projeto:** só o que está travado ("nao fazer diferente do que foi travado. se travado= importar
  arquivos ok"). A próxima importa os três RIS da CAPES e para.
- **Ordem depois do reset de 19/11:** primeiro a importação dos RIS (passo C, primeira parte, curta), depois o chat de
  manutenção; nunca os dois ao mesmo tempo. Se a importação falhar, a falha vai ao "Visto de passagem" e entra nessa
  mesma manutenção (item 3 do prompt dela).
- **Importação dos RIS parada em 19/11/2026, antes de rodar (falha F9 no `REGISTRO.md`).** O `import_dataset_ris`
  com `projectPath` descarta o registro cujo DOI já está em `01_raw/database_records.json`; importar as três bases
  seria deduplicar entre elas sem relatório (o Web of Science entraria com 0 de 17; o arquivo ficaria com cerca de
  29 de 54). Nada foi importado. Consertado pela linha 15 da FILA (19/11/2026).
- **Importação dos RIS em 20/11/2026: Scopus 23 de 23 e Web of Science 17 de 17 importados** (`sourceName` com o
  nome da base; `01_raw/database_records.json` com 40; o registro da busca em `logs/search_log_prisma_s.csv`).
  **A FSTA não foi importada:** a tool descartaria um dos dois registros da FSTA com o mesmo DOI (falha F11) e
  entraria com 13 de 14. No WoS, um resumo entrou cortado (falha F10, Porto-Luz et al. 2020). As duas estão no
  "Visto de passagem" da FILA.
- **F10 e F11 consertadas em 20/11/2026** (linha 16 da FILA). Conferido com os três RIS, fora do projeto: 23 + 17 +
  14 = 54, nenhum sem resumo. Reimportar o WoS **não** recompõe o resumo cortado: o registro já gravado da mesma base
  é descartado, não substituído. **Decidido pelo Vicente (20/11/2026, `REGISTRO.md`):** apagar o
  `01_raw/database_records.json` de hoje (só os 40 importados) e importar as três de novo. Em chat novo: o servidor
  deste chat ainda era o anterior ao conserto (conferido: devolveu o resumo cortado). Prompt pronto abaixo.
- **Passo C, primeira parte, feita em 20/11/2026.** Teste sem `projectPath`: o resumo de Porto-Luz et al. 2020
  voltou inteiro. O `01_raw/database_records.json` antigo foi apagado e as três bases importadas de novo:
  **Scopus 23, Web of Science 17, FSTA 14; total 54, nenhum sem resumo**. Detalhe e conferência no `REGISTRO.md`
  ("Importação dos RIS, 20/11/2026"). Próximo: passo C, segunda parte (fontes abertas), em chat novo.
- **De volta ao protocolo (Vicente, 20/11/2026: "voltemos ao protocolo e vamos seguir com a revisão de escopo").**
  Conferida a F2 contra o `protocol.md` travado, item por item:
  - a busca de 19/11 cumpre o que o protocolo pede da busca feita à mão, menos o período de cobertura;
  - cinco fontes (SciELO, Alice, Infoteca-e, UFC e UECE) mudaram de caminho em 19/11 sem emenda.

  As duas coisas estão no **`change_log.md`**: a emenda 1 (proposta) e o desvio 1. **Pendente do Vicente:**
  - aprovar ou não a emenda 1;
  - escolher (a) ou (b) no desvio 1;
  - dizer onde ficam as anotações da busca, hoje fora do git: (a) cópia versionada na pasta do projeto, sem os RIS,
    ou (b) ficam onde estão e ele guarda uma cópia.

  Os nomes das edições do Web of Science não são pedidos, nem pelo protocolo nem pelo PRISMA-S (S1 e S2 lidos no
  texto oficial). **A segunda parte do passo C só roda depois da decisão sobre a emenda 1.**
- **PROJETO PARADO (Vicente, 20/11/2026) até a manutenção resolver por que a execução se afastou do protocolo
  travado sem o sistema parar.** Frase dele: "isso é mais importante que a pesquisa neste momento. depois de resolver
  voltamos para a pesquisa de acordo com o protocolo". A próxima sessão é de manutenção, em chat novo, depois do
  reset da janela de 5 h (prompt em "Prompts prontos"). A emenda 1 e o desvio 1 do `change_log.md` esperam essa
  sessão: o conserto pode mudar o modo de registrar e aprovar a emenda. Depois, a pesquisa volta pelo protocolo:
  primeiro a decisão sobre a emenda 1 e o desvio 1, depois a segunda parte do passo C.
- **Manutenção da linha 17 feita em 20/11/2026** (FILA): a busca, por tool ou à mão, segue só o plano de busca congelado,
  e o que muda é emenda aprovada pelo pesquisador. A pesquisa volta pela emenda 1 e pelo desvio 1 do `change_log.md`,
  agora gravados pela tool nova `record_protocol_amendment`: travado antes do conserto, o projeto não busca até o Vicente
  aprovar a emenda que traz o plano de busca. Em chat novo, para carregar o servidor novo.
- **Emenda 1 APROVADA em 20/11/2026** (protocolo 1.1): o plano de busca está congelado no `project_state.json`
  (`get_search_plan` mostra o roteiro de cada fonte). Emenda nova só se for impossível seguir sem ela (Vicente).
  **Desvio 1 decidido e gravado em 20/11/2026** (declara-se o que foi visto: todas as datas, registros de 2003 a
  2026). Na segunda parte do passo C, o período de cobertura de cada fonte aberta é **anotado** (o que a fonte mostra
  no dia), não perguntado ao Vicente. **Próximo: segunda parte do passo C**, em chat novo, pelo `get_search_plan`
  (prompt "Passo C, segunda parte" abaixo; a emenda 1 já tem decisão).
- **Servidor novo:** a linha 11 mudou o código. O passo C roda em chat novo, aberto depois do último build da
  manutenção, para carregar o servidor atualizado. Não rodar passo do projeto enquanto uma sessão de manutenção
  estiver mudando o servidor.
- Artigo 2: sessão própria; entrada em `artigo2/ABRIR_SESSAO.md`.

## Passos, na ordem

| # | passo | quem | pronto quando | para se |
|---|---|---|---|---|
| A | Conferir os problemas que tocam este projeto: F7 e F8 (fontes), F3 (resumos), Infoteca-e inativa e UFPI (F5), como se gravam as decisões de dois revisores humanos, e se a trilha aceita uma revisão com zero estudos incluídos | sessão de **manutenção**, por ordem do Vicente (a sessão de projeto não cria linha na FILA) | cada um está confirmado ou descartado, e o que foi confirmado tem conserto ou decisão do Vicente | **conferido em 19/11/2026** (FILA, "Visto de passagem", bloco de 19/11): são reais F7 na UECE, na Alice e no IFCE (a UFC voltou a funcionar), F8, F3, a Infoteca-e e a UFPI, e falta onde gravar os dois revisores; zero incluídos funciona. Os consertos esperam decisão do Vicente |
| B | Protocolo escrito, lido e aprovado pelo Vicente, e travado | — | **feito em 15/11/2026** | — |
| C | Busca (F2): o agente `librarian` roda as fontes abertas com as strings do `protocol.md` e os controles positivos; o Vicente roda Scopus, Web of Science e FSTA no Portal CAPES e salva os arquivos RIS em `01_raw/manual/`; importar com `import_dataset_ris` | 1 agente + o Vicente | `01_raw/` e o registro da busca preenchidos, com o controle de cada fonte | fonte com falha não consertada: não buscar nela, anotar |
| D | Deduplicação e triagem (F3/F4): camada mecânica por palavras, depois a leitura dos dois revisores humanos | agente `screener` + Vicente + estagiário | lista final de incluídos decidida pelo Vicente | — |
| E | Extração, leitura e manuscrito (F5 a F8); conferir a lista do PRISMA-ScR; publicar o preprint | agentes `extractor`, `reader`, `analyst` + Vicente | manuscrito aprovado pelo Vicente | a exportação barrar as contas do funil |

O passo C tem duas partes. A primeira (importar os RIS da CAPES) não depende de nada. A segunda (fontes abertas)
depende da linha 12 da FILA e do item de UECE, Alice e Infoteca-e. A parte do Vicente (Scopus, Web of Science e
FSTA) já foi feita em 19/11/2026.

## Prompts prontos

**Manutenção para a F4 (23/11/2026), em chat de manutenção, depois da virada da semana.** A primeira linha é para
o seletor; apague-a antes de enviar.

> Fable 5.2 · high
>
> Rotina de manutenção. Depois, só o que trava a F4 do projeto `roda_aromas_ceara`, nesta ordem:
> (1) o item do "Visto de passagem" de 23/11/2026 sobre a camada mecânica da triagem: uma tool que leia
> `02_deduplicated/dataset.json`, passe o registro cujo título, resumo ou palavras-chave tragam ao menos um dos
> termos do protocolo (com curinga), passe todo registro sem resumo e grave o resultado e os excluídos como
> artefatos do funil;
> (2) a linha 13 da FILA, com o alcance decidido pelo Vicente em 23/11/2026 (itens 1 a 3; o item 4 sai).
> Diagnostique e mostre-me antes de consertar. Nenhum subagente nem workflow.

**F4 — triagem, camada por palavras (23/11/2026), em chat novo, depois do build da manutenção acima.** A primeira
linha é para o seletor; apague-a antes de enviar.

> Opus 5.5 · medium
>
> Projeto `reviewbr/projects/roda_aromas_ceara`. Leia `RETOMAR.md`, o `protocol.md` (travado, versão 1.2) e, no
> `REGISTRO.md`, as "Decisões" e a seção "Passo D, F3". A F3 está fechada (5446 registros em
> `02_deduplicated/dataset.json`; os 36 pares sinalizados ficam para nova deduplicação depois da triagem). Faça só a
> camada mecânica da F4, como o "Processo de Seleção" do protocolo manda. Primeiro, `complete_record_keywords` (completa
> as palavras-chave pela fonte, sem mudar o dataset; leia o relatório). Depois, `batch_keyword_screen` com `projectPath`
> e sem `pdfDir`: passe os registros cujo título, resumo ou palavras-chave trazem ao menos um dos termos do protocolo,
> copiados dele sem mudar nada, e passe todo registro sem resumo. Confira que passados + excluídos = 5446. Não faça a leitura
> humana nem triagem por IA. Se a tool não existir ou devolver algo incoerente, pare e anote no "Visto de passagem"
> da FILA. Termine com `REGISTRO.md` e `RETOMAR.md` atualizados e commit.

**Manutenção da linha 13 — planilha dos revisores (23/11/2026), em chat de manutenção, depois da F4 acima.** A
primeira linha é para o seletor; apague-a antes de enviar.

> Fable 5.2 · high
>
> Rotina de manutenção. Depois, só a linha 13 da FILA (decisões dos revisores), com o alcance decidido em 23/11/2026
> (itens 1 a 3) e a proposta da seção "Pedido do Vicente de 23/11/2026", com a decisão do mesmo dia: o ReviewBR gera
> uma planilha por revisor com os campos que ele preenche e, nas primeiras linhas, o que fazer, de forma objetiva; eu
> envio, recebo o arquivo preenchido e o entrego para a tool importar. Antes de construir, faça-me a pergunta (2)
> daquela seção, se ainda estiver aberta. Teste com uma cópia dos dados do `roda_aromas_ceara`, sem gravar na pasta do
> projeto. Nenhum subagente nem workflow.

**F3 — deduplicação (23/11/2026), em chat novo.** A primeira linha é para o seletor; apague-a antes de enviar.

> Opus 5.5 · medium
>
> Projeto `reviewbr/projects/roda_aromas_ceara`. Leia `RETOMAR.md`, o `protocol.md` (travado, versão 1.2 pela
> emenda 2) e, no `REGISTRO.md`, as "Decisões" e a seção "Passo C, segunda parte: 23/11/2026". A F2 está completa.
> Faça só a F3 do protocolo: deduplique com `deduplicate_dataset` todos os registros da F2, com relatório. As
> entradas são `01_raw/database_records.json` (CAPES e repositórios, 3148), `01_raw/dataset_openalex_2026-11-23_16-03-18-636Z.json`
> (OpenAlex completo, 2639) e `01_raw/dataset_scielo_2026-11-23_15-21-55-819Z.json` (SciELO, 79). O
> `dataset_openalex_2026-11-23_15-21-53-903Z.json` é a execução cortada em 200 e não entra. Relatos diferentes do
> mesmo estudo (tese e artigo dela) não são duplicatas. Antes de rodar, confira na tool como ela recebe as entradas;
> se não aceitar as três, ou devolver algo incoerente, pare e anote no "Visto de passagem" da FILA. Não faça a
> triagem. Termine com `REGISTRO.md` e `RETOMAR.md` atualizados e commit.

**Volta à pesquisa depois da linha 17 (20/11/2026): plano de busca e emenda 1, em chat novo** (o servidor novo só carrega
em chat novo). A primeira linha é para o seletor; apague-a antes de enviar.

> Opus 5.5 · medium
>
> Projeto `reviewbr/projects/roda_aromas_ceara`. Leia `RETOMAR.md`, as "Decisões" do `REGISTRO.md`, o `protocol.md`
> (travado) e o `change_log.md`. O projeto foi travado antes da linha 17 da FILA e não tem plano de busca. (1) Escreva
> `plano_busca.json` a partir do protocolo travado, item por item: as fontes da tabela "Fontes de Busca", a tool e o id
> do catálogo de cada uma, os textos exatos da tabela de sintaxe, os filtros (o protocolo não dá nenhum) e o que o
> protocolo manda registrar em cada busca (o período de cobertura em todas; nas feitas à mão, também plataforma, data,
> filtros e total; o controle positivo). A UFPI não tem id no protocolo: diga qual id do catálogo o plano usa. Nada que o
> protocolo não peça. (2) Proponha a emenda 1 com `record_protocol_amendment` (tipo emenda, com o plano). (3) Mostre-me o
> plano, com a rota de hoje de cada fonte, e pare para a minha decisão. Não busque. Depois da minha decisão, grave-a pela
> mesma tool, com as minhas palavras, e registre o desvio 1 com a opção que eu escolher.

**Manutenção — protocolo travado (pedido do Vicente de 20/11/2026), em chat novo, depois do reset da janela de 5 h.**
A primeira linha é para o seletor; apague-a antes de enviar.

> Fable 5.2 · high
>
> Modelo e esforço desta sessão: Fable 5.2, high. Rotina de manutenção. Depois, faça o pedido do Vicente de
> 20/11/2026, que vem antes da pesquisa: "isso nao deveria ter acontecido com o protocolo travado. isso é mais
> importante que a pesquisa neste momento". O pedido junta três itens do "Visto de passagem": o de 19/11 sobre a
> RV-01 (nenhuma tool cria ou confere a emenda) e os dois de 20/11 (a execução da F2 do `roda_aromas_ceara` se
> afastou do protocolo travado; o roteiro da busca feita à mão). Faça deles a linha 17 da FILA e tire os três do
> "Visto de passagem". O caso real está em `reviewbr/projects/roda_aromas_ceara/change_log.md`.
>
> Primeiro diagnostique, sem consertar:
> (1) Por que a trilha deixou a execução se afastar do protocolo travado sem parar. Diga o que cada tool, skill e
> agente da F2 lê do protocolo, e o que a manutenção pode mudar que um protocolo travado usa, como o caminho de busca
> no catálogo.
> (2) O conserto mínimo, dito como FAZER ou DECLARAR, para que a busca, à mão ou por tool, siga só o que o protocolo
> travado pede, e para que o que mudar passe por emenda aprovada pelo pesquisador.
>
> Mostre-me antes de consertar. Nenhum subagente nem workflow.

Passo A, no chat de manutenção:

> Rotina de manutenção. Depois dela, confira só estes itens do "Visto de passagem" que tocam o projeto
> `roda_aromas_ceara`: F7, F8, F3, a Infoteca-e inativa, a UFPI (F5), onde se gravam as decisões de dois
> revisores humanos, e a pergunta "a trilha do escopo aceita uma revisão com zero estudos incluídos?". Para cada
> um: reproduza, diga se é real e o que o conserto exige. Não conserte sem me mostrar.

Manutenção, depois do reset da janela de 5 h:

> Rotina de manutenção. Depois: (1) o item do "Visto de passagem" de 19/11 sobre UECE, Alice e Infoteca-e, o
> `heal_repositories` e o User-Agent de navegador, começando pela conferência jurídica e ética, com fonte, antes de
> qualquer estratégia de acesso; (2) a linha 12 da FILA (J — OpenAlex e SciELO); (3) se a importação dos RIS do
> projeto `roda_aromas_ceara` deixou falha no "Visto de passagem", ela também.

Passo C, primeira parte, em chat novo — **Scopus e WoS importados em 20/11/2026; parada antes da FSTA pelas falhas
F10 e F11; o resto roda depois do conserto e do build da manutenção** (não rode enquanto um chat de manutenção
estiver trabalhando). Prompt original, de 19/11:

> Projeto `reviewbr/projects/roda_aromas_ceara`. Leia `RETOMAR.md` e o `protocol.md` (travado). Importe com
> `import_dataset_ris` os três RIS de `01_raw/manual/` (Scopus, Web of Science, FSTA), todos os registros, sem
> excluir nem deduplicar nada, conferindo os totais com `ANOTACOES_busca_manual.md`, e pare. Não precisa de agente.
> Não busque, não mude nada do protocolo.

Passo C, primeira parte, refeita (decisão de 20/11), em chat novo aberto depois do build da linha 16 — **feito em
20/11/2026** (54 registros):

> Projeto `reviewbr/projects/roda_aromas_ceara`. Leia `RETOMAR.md` e o `protocol.md` (travado). Confira com uma
> importação de teste, sem `projectPath`, que o `import_dataset_ris` junta a linha de continuação do resumo; se não
> juntar, pare. Apague `01_raw/database_records.json` e importe os três RIS de `01_raw/manual/` com `sourceName`
> (Scopus, Web of Science, FSTA), todos os registros, sem excluir nem deduplicar; confira 23, 17 e 14 (total 54) e
> que nenhum ficou sem resumo. Atualize `RETOMAR.md` e `REGISTRO.md`, commit, e pare. Não busque.

Passo C, segunda parte, em chat novo, **depois da decisão do Vicente sobre a emenda 1 do `change_log.md`**
(reescrito em 20/11/2026 para seguir o protocolo item por item):

> Projeto `reviewbr/projects/roda_aromas_ceara`. Leia `RETOMAR.md`, o `protocol.md` (travado) e o `change_log.md`.
> Se a emenda 1 não tiver decisão, pare. Confira que os três RIS da CAPES já foram importados (se não foram, pare).
> Rode a busca da F2 nas fontes abertas da tabela "Fontes de Busca", com o caminho que o protocolo e o
> `change_log.md` dão a cada uma. Antes de buscar, faça com o protocolo a lista de conferência de cada fonte e
> preencha-a: texto exato, data, total informado e total recuperado, **período que a fonte cobre, lido na própria
> fonte no dia da busca**, controle positivo, e onde o registro foi visto. Item do protocolo que não puder ser
> cumprido: não contorne; anote como desvio no `change_log.md` e avise. Fonte que a manutenção deixou fora: não
> busque, anote. Use um agente `librarian` com modelo `opus`, e passe a ele essa lista de conferência.

Passo B, em chat novo:

> Projeto `reviewbr/projects/roda_aromas_ceara`. Leia `RETOMAR.md`, as "Decisões" do `REGISTRO.md` e o
> `DESENHO_artigo1.md`. Faça o passo B: atualize o `protocol.md` para a v0.2 e me mostre as decisões do
> travamento, uma por vez.

Artigo 2: o prompt está no fim de `artigo2/ABRIR_SESSAO.md`.

## Prazos

- Artigo 2: coleta até o fim de novembro de 2026; dados tratados até meados de dezembro; preprint até 31/01/2027.
- Artigo 1: pode sair antes. Para servir de introdução ao artigo 2, os passos B a D precisam estar feitos até
  meados de dezembro.
