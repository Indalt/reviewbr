# Retomar — roda_aromas_ceara (página única de entrada)

**Não substitua esta página.** Sessão que precisar gravar onde parou atualiza a seção "Estado" e a tabela de passos.

Atualizado em 15/11/2026. Escrito para ser seguido por qualquer modelo (Opus ou mais barato): o Fable deixa de
estar disponível, e o Vicente tem cerca de 10% dos tokens da semana.

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
- Próximo passo: a decisão do Vicente sobre os consertos que o passo A confirmou (19/11/2026); depois, C (busca). A
  busca espera o conserto de F7 e F8, ou uma decisão nova sobre essas fontes.
- Artigo 2: sessão própria; entrada em `artigo2/ABRIR_SESSAO.md`.

## Passos, na ordem

| # | passo | quem | pronto quando | para se |
|---|---|---|---|---|
| A | Conferir os problemas que tocam este projeto: F7 e F8 (fontes), F3 (resumos), Infoteca-e inativa e UFPI (F5), como se gravam as decisões de dois revisores humanos, e se a trilha aceita uma revisão com zero estudos incluídos | sessão de **manutenção**, por ordem do Vicente (a sessão de projeto não cria linha na FILA) | cada um está confirmado ou descartado, e o que foi confirmado tem conserto ou decisão do Vicente | **conferido em 19/11/2026** (FILA, "Visto de passagem", bloco de 19/11): são reais F7 na UECE, na Alice e no IFCE (a UFC voltou a funcionar), F8, F3, a Infoteca-e e a UFPI, e falta onde gravar os dois revisores; zero incluídos funciona. Os consertos esperam decisão do Vicente |
| B | Protocolo escrito, lido e aprovado pelo Vicente, e travado | — | **feito em 15/11/2026** | — |
| C | Busca (F2): o agente `librarian` roda as fontes abertas com as strings do `protocol.md` e os controles positivos; o Vicente roda Scopus, Web of Science e FSTA no Portal CAPES e salva os arquivos RIS em `01_raw/manual/`; importar com `import_dataset_ris` | 1 agente + o Vicente | `01_raw/` e o registro da busca preenchidos, com o controle de cada fonte | fonte com falha não consertada: não buscar nela, anotar |
| D | Deduplicação e triagem (F3/F4): camada mecânica por palavras, depois a leitura dos dois revisores humanos | agente `screener` + Vicente + estagiário | lista final de incluídos decidida pelo Vicente | — |
| E | Extração, leitura e manuscrito (F5 a F8); conferir a lista do PRISMA-ScR; publicar o preprint | agentes `extractor`, `reader`, `analyst` + Vicente | manuscrito aprovado pelo Vicente | a exportação barrar as contas do funil |

O passo C depende do A (F7 e F8) ou de uma decisão nova do Vicente sobre essas fontes. A parte do Vicente no
passo C (Scopus, Web of Science e FSTA pelo Portal CAPES) não depende de nada e pode ser feita já, com as strings
do `protocol.md`, anotando base, plataforma, data, texto exato e total.

## Prompts prontos

Passo A, no chat de manutenção:

> Rotina de manutenção. Depois dela, confira só estes itens do "Visto de passagem" que tocam o projeto
> `roda_aromas_ceara`: F7, F8, F3, a Infoteca-e inativa, a UFPI (F5), onde se gravam as decisões de dois
> revisores humanos, e a pergunta "a trilha do escopo aceita uma revisão com zero estudos incluídos?". Para cada
> um: reproduza, diga se é real e o que o conserto exige. Não conserte sem me mostrar.

Passo C, em chat novo, depois do passo A:

> Projeto `reviewbr/projects/roda_aromas_ceara`. Leia `RETOMAR.md` e o `protocol.md` (travado). Faça o passo C:
> a busca da F2 nas fontes abertas, com o controle positivo de cada uma. Os arquivos que exportei da CAPES estão
> em `01_raw/manual/`.

Passo B, em chat novo:

> Projeto `reviewbr/projects/roda_aromas_ceara`. Leia `RETOMAR.md`, as "Decisões" do `REGISTRO.md` e o
> `DESENHO_artigo1.md`. Faça o passo B: atualize o `protocol.md` para a v0.2 e me mostre as decisões do
> travamento, uma por vez.

Artigo 2: o prompt está no fim de `artigo2/ABRIR_SESSAO.md`.

## Prazos

- Artigo 2: coleta até o fim de novembro de 2026; dados tratados até meados de dezembro; preprint até 31/01/2027.
- Artigo 1: pode sair antes. Para servir de introdução ao artigo 2, os passos B a D precisam estar feitos até
  meados de dezembro.
