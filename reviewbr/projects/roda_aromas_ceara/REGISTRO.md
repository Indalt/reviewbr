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
| 3 | 19/11/2026 | artigo 1, F2, busca (agente `librarian` + Vicente na CAPES) | strings do `protocol.md` | `01_raw/manual/` (RIS e `ANOTACOES_busca_manual.md`, fora do git) | **parte manual feita em 19/11/2026**: Scopus 23, Web of Science 17, FSTA 14 (2 patentes), todos com resumo e controle positivo. O resto espera a linha 12 da FILA e a decisão sobre UECE, Alice e Infoteca-e |

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
