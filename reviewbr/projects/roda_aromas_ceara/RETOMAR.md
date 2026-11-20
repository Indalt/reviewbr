# Retomar — roda_aromas_ceara (página única de entrada)

**Não substitua esta página.** Sessão que precisar gravar onde parou atualiza a seção "Estado" e a tabela de passos.

Atualizado em 19/11/2026. Escrito para ser seguido por qualquer modelo (Opus ou mais barato).

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

- Artigo 1: revisão de escopo (`scoping-prisma-scr`), controle estrito. **Protocolo v1.0 TRAVADO em 15/11/2026**
  (`project_state.json`: LOCKED, fase F2). Mudar o protocolo agora exige emenda registrada.
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
  é descartado, não substituído. **Espera decisão do Vicente:** (a) só importar a FSTA e deixar o resumo cortado,
  anotado; ou (b) tirar o `01_raw/database_records.json` de hoje (só os 40 importados) e importar as três de novo
  (o registro da busca passa a ter as duas importações de hoje e as três novas). Em chat novo, aberto depois deste build.
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

Passo C, segunda parte, em chat novo, depois da linha 12 e do item das três fontes:

> Projeto `reviewbr/projects/roda_aromas_ceara`. Leia `RETOMAR.md` e o `protocol.md` (travado). Faça a segunda
> parte do passo C: confira que os três RIS da CAPES já foram importados (se não foram, pare) e rode a busca da F2
> nas fontes abertas, com as strings do protocolo e o controle positivo de cada fonte. Fonte que a manutenção
> deixou fora: não busque, anote. Use um agente `librarian` com modelo `opus`.

Passo B, em chat novo:

> Projeto `reviewbr/projects/roda_aromas_ceara`. Leia `RETOMAR.md`, as "Decisões" do `REGISTRO.md` e o
> `DESENHO_artigo1.md`. Faça o passo B: atualize o `protocol.md` para a v0.2 e me mostre as decisões do
> travamento, uma por vez.

Artigo 2: o prompt está no fim de `artigo2/ABRIR_SESSAO.md`.

## Prazos

- Artigo 2: coleta até o fim de novembro de 2026; dados tratados até meados de dezembro; preprint até 31/01/2027.
- Artigo 1: pode sair antes. Para servir de introdução ao artigo 2, os passos B a D precisam estar feitos até
  meados de dezembro.
