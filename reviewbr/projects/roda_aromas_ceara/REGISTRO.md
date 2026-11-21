# Roda de aromas no Ceará — registro do projeto

Aberto em 12/11/2026. Primeiro teste do ReviewBR depois da manutenção.

## Regras deste projeto

- **Começa do zero.** Por decisão do Vicente (12/11/2026), nada da pasta `reviewbr/projects/roda_de_aromas/` nem de
  pesquisas anteriores sobre o tema entra aqui. Se algo de lá for reaproveitado, isso é uma decisão nova e fica
  registrada abaixo.
- **Do começo ao fim com o ReviewBR.** Primeiro a busca exploratória (agente `scout`, sem protocolo); depois, se o
  Vicente decidir, um projeto formal (agente `designer` em diante).
- **Cada passo:** o assistente propõe as perguntas possíveis, o Vicente escolhe, a escolha e o resultado ficam
  registrados aqui com a data.
- **Ferramenta do ReviewBR quebrada:** para o passo, registra na seção "Falhas do ReviewBR" e não se contorna aqui.
- **Busca com zero resultado** só vale com uma busca de controle positivo na mesma base.

## O que o Vicente declarou como meta (12/11/2026)

- **Artigo 1, sobre a falta:** a ausência de roda sensorial ou de descritores sensoriais da cajuína cearense. Pode
  sair antes do artigo 2.
- **Artigo 2, resultados e métodos da pesquisa da bolsa** (Escola de Gastronomia Social Ivens Dias Branco).
  Pesquisa exploratória, com visitas de campo que não seguem uma metodologia particular, por falta de pesquisas
  anteriores. Ainda em coleta. Prazo: "tem de sair" até o fim de janeiro de 2027.
- Em aberto: o que "sair" quer dizer (submetido, preprint ou publicado); a pasta da coleta; a questão de ética.
  Respondido em 12/11/2026, ver as decisões.

## Passos

| # | data | etapa | pergunta escolhida | resultado (arquivo) | estado |
|---|---|---|---|---|---|
| 1 | 12/11/2026 | exploratória (agente `scout`) | O que já existe: há roda de aromas, léxico sensorial ou descrição de aroma publicados para algum produto cearense? | `exploratoria/01_o_que_existe.md` (log: `01_buscas_log.md`, 43 execuções) | feito, **parcial**: repositórios do CE só alcançados via BDTD; SciELO inutilizável; só títulos, sem resumo. Aguarda decisão do Vicente |
| 2 | 12/11/2026 | artigo 1, F0/F1, protocolo (agente `designer`) | revisão de escopo (PCC): descritores sensoriais e compostos de aroma da cajuína e das bebidas do pedúnculo de caju, em geral, com o Ceará destacado | `protocol.md` v0.1 (DRAFT); `project_state.json` (projeto 3, estrito); `protocolo_falhas_reviewbr.md` (P1 a P8) | **feito: protocolo v1.0 travado em 15/11/2026**; condição `avaliacao_critica` = "não" gravada; busca bloqueada até o conserto de F7 e F8 |
| 3 | 19/11/2026 | artigo 1, F2, busca (agente `librarian` + Vicente na CAPES) | strings do `protocol.md` | `01_raw/manual/` (RIS e `ANOTACOES_busca_manual.md`, fora do git) | **parte manual feita em 19/11/2026**: Scopus 23, Web of Science 17, FSTA 14 (2 patentes), todos com resumo e controle positivo. O resto espera a linha 12 da FILA e a decisão sobre UECE, Alice e Infoteca-e. **Importação parada em 19/11/2026, antes de rodar:** a tool deduplicaria entre as bases (falha F9). **Importação refeita em 20/11/2026, depois do conserto de F9, F10 e F11:** `01_raw/database_records.json` com 54 registros (Scopus 23, Web of Science 17, FSTA 14), nenhum sem resumo nem sem título; ver "Importação dos RIS, 20/11/2026" abaixo |

### Importação dos RIS, 20/11/2026 (passo C, primeira parte, refeita)

- **Teste antes:** `import_dataset_ris` sem `projectPath`, só com o registro de Porto-Luz et al. 2020 do Web of
  Science: o resumo voltou com as 5 partes (falha F10 consertada). Nada foi gravado no projeto nem no registro da
  busca.
- **Apagado** o `01_raw/database_records.json` de 20/11 (40 registros: Scopus 23 e WoS 17, feitos com a tool
  defeituosa), conforme a decisão do Vicente de 20/11.
- **Importado** com `projectPath` e `sourceName` ("Scopus", "Web of Science", "FSTA"), uma chamada por base:
  23 de 23, 17 de 17 e 14 de 14; total 54, sem exclusão nem deduplicação. A FSTA entrou com os dois registros do DOI
  10.1016/j.fbio.2025.107482 (F11 consertada). O registro da busca (`logs/search_log_prisma_s.csv`) tem as três
  linhas novas (06:37, 06:38 e 06:40 UTC) além das duas de 20/11 feitas com a tool defeituosa, que ficam como
  histórico; o relato da F2 usa as três novas.
- **Como o texto foi passado à tool:** a tool recebe o conteúdo do RIS, não o caminho do arquivo. Os fins de linha
  foram normalizados (o WoS usa CR sozinho) e foram passadas só as linhas das tags que o `importRis` lê (TY, TI, AU,
  PY/Y1, UR, DO, AB, T2/JO, KW, DB, ER, com as linhas de continuação delas); as demais (AD, N1, SN, PB etc.) a tool
  descarta, e os registros gravados são os mesmos. Os RIS completos continuam em `01_raw/manual/`.
- **Conferência** dos 54 registros gravados contra os três RIS originais (título, resumo e DOI, lidos por fora com
  as mesmas regras): iguais, salvo dois resumos em que o espaço não separável (U+00A0) entre número e unidade virou
  espaço comum na transcrição (Scopus, Solon-Júnior et al. 2025; FSTA, segundo registro de Fonteles et al. 2025).
  Nenhuma palavra muda. Sem DOI, como no RIS: 5 registros (1 da Scopus e 4 da FSTA, entre eles as 2 patentes).

## Decisões

- **12/11/2026, passo 1, pergunta.** Opções apresentadas: (a) o que já existe; (b) que produto escolher; (c) como se
  constrói uma roda; (d) as três em sequência. Escolhida: **(a)**. Alcance: a busca mapeia o que foi publicado, não
  escolhe produto nem método. Consequência: (b) e (c) ficam como candidatas aos próximos passos.
- **12/11/2026, passo 1, fontes.** Opções: bases + repositórios brasileiros; só bases internacionais; também web
  aberta. Escolhida: **bases abertas (OpenAlex e afins) + repositórios brasileiros (UFC, UECE, Embrapa, BDTD)**.
  Alcance: material não acadêmico (web aberta) fica de fora deste passo.
- **12/11/2026, artigo 1, tipo.** Opções: (a) cajuína e bebidas do pedúnculo de caju; (b) só cajuína; (c) rodas e
  léxicos de alimentos tradicionais do Nordeste. Escolhida: **(a), revisão de escopo (PRISMA-ScR)**. Alcance: é a
  cajuína em geral, com o Ceará destacado, e o artigo comenta se houver roda sensorial da cajuína do Piauí ou de
  outro estado produtor. Consequência: o artigo 1 roda pela trilha `scoping-prisma-scr` do ReviewBR, neste projeto.
- **12/11/2026, artigo 1, registro.** O protocolo **não** será registrado no OSF. No escopo o registro é opcional;
  o protocolo declara "não registrado" e o motivo.
- **12/11/2026, artigo 1, bases.** As que o método pede.
- **12/11/2026, artigo 1, triagem, extração e síntese.** O Vicente autoriza a IA a fazê-las se o método permitir;
  onde não permitir, a IA sugere e ele escolhe. O que o método diz: a IA pode propor em todas as etapas, mas a
  inclusão, a saturação e a lista final são decisões dele (RV-04), e o número de revisores (individual ou duplo)
  é declarado no relato.
- **12/11/2026, artigo 2.** Vai para outra sessão; a entrada dela é `artigo2/ABRIR_SESSAO.md`. Preprint serve, não
  é exigência da bolsa. A coleta termina em novembro e os dados ficam tratados até meados de dezembro de 2026. Há
  aprovação do Comitê de Ética.
- **12/11/2026, artigo 1, produto.** Opções: bebidas + pedúnculo; só bebidas; só bebidas não alcoólicas.
  Escolhida: **cajuína, todas as bebidas do pedúnculo de caju (suco, néctar, polpa, fermentados, vinho) e o
  pedúnculo in natura**.
- **12/11/2026, artigo 1, limites.** Opções: amplo; só artigos e teses; de 2000 em diante. Escolhido: **amplo**.
  Sem limite de período; português, inglês e espanhol; artigos, teses, dissertações, anais e documentos técnicos.
- **12/11/2026, artigo 1, condição `avaliacao_critica`.** Resposta: **não**. Os itens 12 e 16 do PRISMA-ScR saem do
  denominador. O Vicente pediu que a falta de lugar para registrar essa avaliação na trilha vá para a manutenção:
  foi para o "Visto de passagem" da FILA.
- **12/11/2026, artigo 1, nível de controle.** **Estrito.**
- **12/11/2026, artigo 1, bases do Portal CAPES.** O Vicente tem acesso, mas a senha não entra no sistema. Ele
  roda as buscas à mão (Scopus, Web of Science e FSTA, se disponíveis) com as strings aprovadas e exporta os
  resultados; o ReviewBR importa os arquivos (`import_dataset_ris`).
- **12/11/2026, falhas do ReviewBR.** Opções: "Visto de passagem" da FILA; achado no backlog. Escolhido: **"Visto de
  passagem"**. As 8 falhas e a limitação da avaliação crítica foram registradas lá.
- **12/11/2026, F7 e F8 na busca formal.** Opções: esperar o conserto; declarar e seguir. Escolhido: **esperar o
  conserto**. O protocolo é escrito agora, e a busca da F2 só começa depois que a manutenção consertar F7 e F8.
- **12/11/2026, artigo 1, autoria.** Vicente e outros. Faltam os nomes, a instituição e o financiamento.
- **15/11/2026, publicação.** Meta dos dois artigos: preprint no ar; publicação em revista é desejável, não
  obrigatória.
- **15/11/2026, artigo 1, autoria.** O protocolo deixa os campos de autoria em branco, para preencher depois. Não se
  sabe se haverá ORCID. Consequência: os campos F0.1.6 a F0.1.9 seguem como espaço a preencher, e o assistente não
  pergunta de novo.
- **15/11/2026, artigo 1, critérios de exclusão.** Ficam de fora: (a) produtos em que o caju é ingrediente de outro
  produto (cerveja, kombucha, néctar misto); (b) coprodutos do processamento (fibra, essências, *water phase*).
- **15/11/2026, artigo 1, conceito.** Só entram as fontes que tratam **expressamente** de aroma e sabor. Frase dele:
  "apenas os artigos que expressamente falam de aromas e sabores entram. a revisao é de rodas de aroma para a
  cajuina".
- **15/11/2026, artigo 1, PENDENTE: o produto.** A frase acima e "produtos que nao sao cajuina e coprodutos nao
  entram" admitem duas leituras, e o assistente não escolheu: (i) saem só os casos de fronteira, e continuam
  dentro o suco, o néctar, a polpa, os fermentados e o pedúnculo in natura (decisão de 12/11); (ii) só a cajuína
  entra, e a decisão de 12/11 é trocada. O protocolo não foi alterado nesse ponto.
- **15/11/2026, artigo 1, PENDENTE: tipo de documento e fontes.** O Vicente pediu análise de duas ideias antes de
  decidir: deixar de fora capítulos de livro e resumos de congresso (quem fizesse uma roda publicaria artigo); e
  escolher as fontes por relevância para a pergunta. A análise foi dada no chat em 15/11; a decisão é dele.
- **15/11/2026, artigo 1, PENDENTE: segundo revisor humano.** O Vicente perguntou o que ele faria. Respondido no
  chat; a decisão é dele.
- **15/11/2026, artigo 1, o produto: RESOLVIDO.** Frase dele: "só a cajuina". Só a cajuína entra na revisão. Troca
  a decisão de 12/11 (bebidas do pedúnculo e pedúnculo in natura). Consequência: o resultado esperado é pouco ou
  nada, e ele declarou "nao encontrar é um resultado". A literatura do caju só pode aparecer na discussão, como
  contexto.
- **15/11/2026, artigo 1, fontes: RESOLVIDO.** "fontes por relevancia ganha, pode retirar a baixas". Ficam Scopus,
  Web of Science, FSTA, SciELO, BDTD, Embrapa, repositórios da UFC, UECE e UFPI, e OpenAlex. Saem PubMed, Europe
  PMC, CORE, Semantic Scholar e Crossref.
- **15/11/2026, artigo 1, revisores: RESOLVIDO em parte.** Até dois revisores humanos: o Vicente e um estagiário,
  que entra como coautor (no protocolo, "estagiário" no lugar do nome). O que cada um revisa fica para o
  travamento; ele levantou se as buscas feitas pela máquina precisam ser refeitas pelos humanos. Resposta dada:
  não; o método pede o registro da busca, não a repetição.
- **15/11/2026, artigo 1, triagem e extração.** Ideias dele: a triagem "sobre os boleanos que poderiam encontrar
  roda de aroma da cajuina"; a extração como descrição de cada fonte; cabem comentários sobre o debate científico
  do aroma e do sabor da cajuína. Viraram proposta no `DESENHO_artigo1.md`, seções 5, 6 e 8.
- **15/11/2026, artigo 1, declaração.** O artigo declara que a parte mecânica da condução foi feita com o
  ReviewBR. Com essa condição ele não vê objeção aos critérios ("sobre os criterios nao vejo objecao se for
  declarado..."); o assistente leu isso como aceite de restringir pelo conteúdo e não pelo tipo de documento, a
  confirmar no travamento.
- **15/11/2026, condução daqui em diante.** Os agentes rodam em Opus ou em modelo mais barato, depois de revistos
  os supostos problemas do ReviewBR. O Fable deixa de estar disponível; restam cerca de 10% dos tokens da semana.
  Tudo o que falta está em `RETOMAR.md` (passos A a E) e em `DESENHO_artigo1.md`.
- **15/11/2026, artigo 1, respostas ao travamento.** Compostos voláteis da cajuína entram, sem condição. Título e
  questões secundárias aprovados. A busca exploratória fica como parcial e como motivação da revisão. A conferência
  de 20% foi recusada. Os humanos não refazem as buscas, com a condição de provar que o ReviewBR usa o que um
  humano usaria.
- **15/11/2026, artigo 1, suco de caju clarificado.** "suco clarificado sem cozimento e sem o uso do termo cajuina
  saem por criterio de busca". O assistente aplicou assim: a string é só `cajuína OR cajuina`; o produto é
  definido pelo termo. Consequência: fonte que não usa a palavra "cajuína" não é encontrada; fica declarado como
  limite no protocolo.
- **15/11/2026, artigo 1, uso do nome.** Produtos que usam o nome "cajuína" sem ser a bebida (refrigerante) ficam
  fora, contados e anotados para a discussão. Resumos de congresso entram, como literatura cinzenta.
- **15/11/2026, artigo 1, revisão humana.** Haverá revisão pelos dois humanos dos registros que passarem pela
  camada de palavras. Ele pediu que seja agilizada fora do ReviewBR, "com ferramentas que a ciencia legitima e que
  as revistas mais importantes aceitam". Proposta do assistente no protocolo: Rayyan. Não decidido.
- **15/11/2026, pergunta dele fora da trava.** "o que podemos decidir quando a decisao aconteceu nos criterios de
  busca?" Respondida no chat; não entra no protocolo.
- **15/11/2026, textos para o artigo.** Ficam como estão em `notas_para_o_artigo.md`.
- **15/11/2026, protocolo v0.2.** Escrito pelo assistente a partir das decisões acima.
- **15/11/2026, PROTOCOLO TRAVADO (v1.0).** Frases dele: "como aplicou o ponto 1 tudo bem, mas vale deixar como
  comentario a ciencia das bebidas clirificadas"; "se o desenho agiliza nao precisa de ferramenta alem do
  reviewbr"; "basta descrever o criterio do que fica para os revisores humanos e seguir"; "aprovo os ponto
  menores"; "li e aprovo o registro"; "li e aprovo o protocolo". Os três ajustes pedidos entraram antes da trava:
  o comentário sobre as bebidas clarificadas; nenhuma ferramenta além do ReviewBR (o Rayyan saiu); o critério do
  que fica para os revisores humanos (todo registro que passa pela camada de palavras e todo registro sem resumo,
  com quatro perguntas). As decisões de F0 e F1 foram gravadas com `record_researcher_decision`, e a
  `submit_protocol_for_approval` aprovou (3/3). Estado: LOCKED, fase F2. Consequência: mudar o protocolo exige
  emenda registrada; a busca espera o conserto de F7 e F8.
- **15/11/2026, falhas do ReviewBR.** Ficam com a manutenção (já estão no "Visto de passagem").
- **19/11/2026, manutenção antes da busca.** Frase dele: "se precisa realizar a fila para a roda de aromas ser
  feita apropriadamente vamos executar." Os consertos confirmados na conferência do passo A viraram as linhas 11 a
  13 da FILA. As linhas 11 e 12 vêm antes do passo C; a 13, antes do passo D. A busca dele no Portal CAPES não
  espera. Consequência: o projeto para até essas linhas.
- **19/11/2026, linha 11 feita** (commit `4936c59`, sessão de manutenção). BDTD, UFC e UFPI buscam pela interface
  da própria fonte e mostram o total que ela declara. UECE, Alice e Infoteca-e ficaram marcadas como não
  pesquisáveis pela ferramenta (HTTP 403; o `robots.txt` proíbe busca por robô), e a tool diz isso em vez de dar
  zero.
- **19/11/2026, PENDENTE: UECE, Alice e Infoteca-e.** As três estão no protocolo travado como fontes buscadas pela
  ferramenta. Mudar a forma de busca ou tirar a fonte é emenda ao protocolo. Opções levadas ao Vicente: (a) busca
  manual no site, feita por ele como na CAPES; (b) fonte declarada como não alcançada, com a cobertura parcial que
  a BDTD dá. Não decidido.
- **19/11/2026, UECE, Alice e Infoteca-e: resposta.** Nem (a) nem (b) por ora. Frases dele: "se tres fontes = sobre
  linha 11 - tentar estrategias"; "ciencia aberta deve ser ciencia aberta e estrategias para a minha compreensao nao
  sao burlar etica. ver isso em juridico antes de fazer algo. mas havia tb um healer. veja isso." Consequência: a
  manutenção, depois do reset da janela de 5 h, confere primeiro o lado jurídico e ético e o `heal_repositories`, e
  só então tenta estratégias de acesso para as três fontes. O protocolo não muda até lá.
- **19/11/2026, sessão do projeto: só o que está travado.** Frase dele: "nao fazer diferente do que foi travado. se
  travado= importar arquivos ok". A próxima sessão do projeto importa os três RIS da CAPES; não muda fonte, string
  nem critério.
- **20/11/2026, passo C, reimportação dos RIS.** Opções: (a) importar só a FSTA e deixar cortado, anotado, o resumo
  de Porto-Luz et al. 2020 no Web of Science (falha F10); (b) apagar o `01_raw/database_records.json` de 20/11 (só os
  40 registros da Scopus e do WoS) e importar as três bases de novo com a tool consertada. Escolhida: **(b)**
  ("pode apagar e importar tudo novamente"). Alcance: só `01_raw/database_records.json`; os RIS em `01_raw/manual/`
  ficam. Consequência: o registro da busca (`logs/search_log_prisma_s.csv`) mantém as duas importações de 20/11
  feitas com a tool defeituosa e ganha as três novas; o relato da F2 usa as três novas.
- **20/11/2026, PENDENTE: de volta ao protocolo.** Frases dele: "nao deveria ter acontecido isso com protocolo
  travado. o problema é mais embaixo. voltemos ao protocolo e vamos seguir com a revisao de escopo." A F2 foi
  conferida contra o `protocol.md`. O que ficou fora dele está no `change_log.md`:
  - emenda 1 (proposta): o caminho de busca de SciELO, Alice, Infoteca-e, UFC e UECE, pela decisão de 19/11 da
    linha 14;
  - desvio 1: o período de cobertura das três bases da CAPES, não anotado em 19/11.

  Consequência: a segunda parte do passo C espera a decisão sobre a emenda 1. Nas três bases da CAPES, o pedido dos
  nomes das edições do Web of Science foi retirado, porque nem o protocolo nem o PRISMA-S o fazem.
- **20/11/2026, o sistema antes da pesquisa.** O projeto para até a manutenção do ReviewBR resolver por que a
  execução da F2 se afastou do protocolo travado sem que o sistema parasse. O alcance é a pesquisa inteira, a
  partir da segunda parte do passo C. A emenda 1 e o desvio 1 do `change_log.md` ficam pendentes até essa sessão.
  Consequências:
  - a próxima sessão é de manutenção, em chat novo, com o prompt do `RETOMAR.md`;
  - depois dela a pesquisa volta pelo protocolo.

  Origem: "isso nao deveria ter acontecido com o protocolo travado. isso é mais importante que a pesquisa neste
  momento. depois de resolver voltamos para a pesquisa de acordo com o protocolo".
- **20/11/2026, emenda 1 APROVADA (protocolo 1.0 → 1.1).** Entra o plano de busca (`plano_busca.json`, 11 fontes,
  tirado das tabelas "Fontes de Busca" e de sintaxe do `protocol.md`), congelado no `project_state.json` com a rota de
  hoje de cada fonte. SciELO pelo OpenAlex (DOI 10.1590); Alice, Infoteca-e, UFC e UECE pela Oasisbr, filtradas pela
  rede; UFPI = `BR-FED-0014`. Toda busca registra o período de cobertura e o controle positivo; as feitas à mão,
  também plataforma, data, filtros e total. Gravada por `record_protocol_amendment`. Alcance: toda a F2; o que o
  plano não traz, a busca recusa. Consequência: emenda nova só se for impossível seguir sem ela. Origem: "sobre
  emenda1 ok e espero que nao seja necessarias novas, apenas se impossivel continuar sem emendas".
- **20/11/2026, desvio 1: DECIDIDO.** Nas três bases da CAPES o relato declara o que foi visto: todas as datas
  marcadas (sem recorte) e registros de 2003 a 2026 (`logs/anos_dos_registros_CAPES_2026-11-20.md`), no lugar do
  período que a base cobre, que não foi lido. Gravado como desvio-1 por `record_protocol_amendment`. Alcance: Scopus,
  Web of Science e FSTA. Consequência: o que a plataforma disponibiliza é anotado, não perguntado ao Vicente. Origem:
  "em todas as buscas foi marcado todas as datas. (…) isso nao precisaria ser perguntado. apenas anotado. (…)
  declarar o que foi visto me parece o suficiente."
- **21/11/2026, emenda 2 APROVADA (protocolo 1.1 → 1.2).** Entra a Oasisbr (IBICT) inteira como fonte própria
  (`BR-AGG-0006`, sem filtro de rede); a BDTD segue como `BR-AGG-0001`. Frase dele: "separar bdtd e oasisbr e
  colocar a oasisbr inteira para nao sair uma pesquisa de escopo que nao faz um scopo. especialmente um nacional,
  mas como existe producao de cajuina em outros paises, talvez nao com esse nome, mas se em um artigo do exterior
  tiver o termo cajuina ele vai vir. faça a emenda aqui mesmo para nao baguncar a sessao da pesquisa". Alcance: a
  busca da F2 passa a ter 12 fontes; strings, critérios e controles não mudam. Consequência: a cobertura nacional
  vem da Oasisbr; a do exterior, das bases internacionais do protocolo (OpenAlex, Scopus, Web of Science, FSTA).
- **19/11/2026, linha 13.** Ele não sabia se vinha antes das buscas. Resposta dada: não; ela grava as decisões dos
  dois revisores, que só existem na triagem (passo D). A ordem de 19/11 fica: linha 13 antes do passo D.
- **16/11/2026, só o Claude.** O Vicente perguntou se outro assistente (Gemini) poderia tocar parte do trabalho e
  decidiu que não: "decidi continuar apenas com o claude". A seção do `RETOMAR.md` com as regras para assistente
  fora do Claude Code foi retirada. Consequência: os passos A, C, D e E rodam no Claude Code, em Opus ou modelo
  mais barato, quando os tokens renovarem.
- **15/11/2026, artigo 2.** A pasta da coleta é `G:\Meu Drive\roda_de_aromas`, e o Vicente quer organizá-la. Há
  conversas gravadas, algumas já transcritas; as transcrições são feitas por uma ferramenta a que o bolsista tem
  acesso, não pelo assistente. O Comitê de Ética cobre o projeto, com numeração: **não perguntar mais sobre isso**.
  Houve um trabalho exploratório anterior ao edital, sem protocolo nem metodologia; importa pouco.

## Falhas do ReviewBR encontradas

Detalhe e reprodução de cada uma em `exploratoria/01_falhas_reviewbr.md`. Nenhuma foi contornada. Foram levadas ao
"Visto de passagem" de `.claude/maintenance/FILA.md` em 12/11/2026.

| id | tool | o que falha | conferido pelo coordenador |
|---|---|---|---|
| F1 | search_openalex | campo URL vem "undefined"; item sem DOI fica sem link | — |
| F2 | search_openalex | mostra 10 e diz que o resto foi salvo em JSON, mas sem projectPath nada é gravado | — |
| F3 | search_openalex, search_repository | nenhuma devolve resumo | — |
| F4 | search_repository sem `repositories` | 1800 s sem resposta, abortada | — |
| F5 | search_papers_optimized | UFPI, Unifesp e UFCG devolvem registros sem relação com a busca; contagem não corresponde | — |
| F6 | search_repository (BDTD) | URLs da USP com espaço no meio | — |
| F7 | search_repository (UFC, UECE, Alice, IFCE) | zero até para "caju", sem aviso; a BDTD mostra que existem | **sim**, 12/11/2026: UFC (BR-FED-0004) + "caju" → 0 |
| F8 | search_scielo | zero para "queijo coalho"; 15 registros quase todos sem relação para "caju" | — |
| F9 | import_dataset_ris | com `projectPath`, descarta o registro cujo DOI (ou URL, ou título) já está em `01_raw/database_records.json`: deduplica entre bases na importação, sem relatório. Nos três RIS, o Web of Science entraria com 0 de 17 e o arquivo ficaria com cerca de 29 de 54. Lido no código (`project_artifacts.ts:82`), não executado. Levada ao "Visto de passagem" em 19/11/2026 | **sim**, 19/11/2026, pela leitura do código e pela contagem dos DOIs nos RIS |
| F10 | import_dataset_ris | ignora a linha de continuação de um campo (linha sem tag): o resumo de Porto-Luz et al. 2020 no Web of Science (10.2174/1573401315666190206124545), em 5 linhas no RIS, entrou só com a primeira. O RIS do WoS também usa CR sozinho como fim de linha em 34 lugares, que o `importRis` não reconhece (nesta importação o texto foi passado com as quebras normalizadas). Levada ao "Visto de passagem" em 20/11/2026 | **sim**, 20/11/2026, na importação do WoS; consertada pela linha 16 da FILA, 20/11/2026 |
| F11 | import_dataset_ris | descarta o segundo registro da mesma base com o mesmo DOI. Na FSTA há dois registros distintos (AN `2026-06-0700081` e `2026-02-Hr0946`) com o DOI 10.1016/j.fbio.2025.107482: entraria com 13 de 14. Lido no código (`project_artifacts.ts:97`), não executado; a FSTA não foi importada. Levada ao "Visto de passagem" em 20/11/2026 | **sim**, 20/11/2026, pela leitura do código e do RIS; consertada pela linha 16 da FILA, 20/11/2026 |
