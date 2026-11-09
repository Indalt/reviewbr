# Plano de sessões — 29/10/2026

> Pedido do Vicente: uma sessão nova e única (Opus 5.5 no máximo, ultracode + thinking) para fechar a troca de
> computador; depois, as 14 perguntas da reclassificação em sessões únicas, cada uma com começo, meio e fim.
> Este arquivo é a entrada das próximas sessões. Estado de referência: `RECLASSIFICACAO_fila_2026-10-18.md`.

## O que este chat cravou

- **As 14 perguntas seguem atuais.** Foram conferidas contra o código em 18/10, e nenhum arquivo de `src/`,
  `tests/` ou `.claude/` mudou depois disso (conferido por data de modificação em 29/10), nem houve outra sessão.
- **Três já estão respondidas por decisões de 17/10** e não precisam de nova pergunta:
  pergunta 2 (DEBT-128, títulos do PRISMA-S) e pergunta 10 (DEBT-008, GRADE/CERQual) pela diretriz *"se existe
  metodologia, vamos assimilar"*; pergunta 11 (DEBT-094, RAISE 3 condicional) pela decisão do item condicional
  (DEBT-142).
- **Duas são só fechamento** (perguntas 13 e 14: DEBT-130 e DEBT-096) e entram na sessão do funil.
- **Ficam 9 para o Vicente responder** (1, 3, 4, 5, 6, 7, 8, 9, 12) — recomendação "sim" em todas.
- **Dependência que ordena tudo:** declarações por método (DEBT-142) vêm antes do RAISE condicional (DEBT-094) e
  do remapeamento completo (DEBT-045/014); o mapeamento do escopo (DEBT-055) pode vir antes, no formato atual,
  porque os dois projetos de bebidas travam na F8 sem ele.

## Respostas do Vicente em 29/10/2026 (registradas)

- **Sessão 0:** fechar a troca de computador — aprovada.
- **Pergunta 10:** assimilar só metodologia **validada cientificamente**, não qualquer uma (escrito no
  `maintainer.md`).
- **Perguntas 13 e 14:** fechadas — `DEBT-130` e `DEBT-096` RESOLVIDOS.
- **Direção:** *"sair do modelo mental de tratar qualquer pesquisa ou busca do esqueleto prisma; prisma é
  apenas um conjunto de metodologias"*. Responde a decisão pendente 1 da `DECISOES_2026-10-08.md` §6: a trilha
  F0–F8 é do método `prisma-sr`, não o esqueleto da ferramenta. Vira a sessão 6 abaixo.
- **Perguntas 1, 3, 4, 5, 6, 7, 8, 9 e 12: SIM para todas** — *"As perguntas 1, 3, 4, 5, 6, 7, 8, 9 e 12 sim
  para todas"* (Vicente, 29/10/2026). Cada sessão executa a sua sem perguntar de novo; ao fechar o achado, a
  resolução cita esta decisão:
  1 mapear já o PRISMA-ScR (DEBT-055) · 3 export recalcula o funil e bloqueia divergência (DEBT-138) · 4 gates
  conferidos só na instalação (DEBT-070) · 5 o código grava o log de busca PRISMA-S (DEBT-056) · 6 saturação lê a
  triagem do disco (DEBT-021) · 7 dedup ≥90% só sinaliza o par (DEBT-025) · 8 página guardada na extração
  (DEBT-031) · 9 trava só pelo `project_state.json` (DEBT-018) · 12 `targets` na fila de extensão, com aviso
  (DEBT-016).
- **O que vai ao GitHub (sessão 0):** *"Só o sistema"* — código, testes, agentes, skills, normas e o
  registro da manutenção. Ficam no `.gitignore`: as pesquisas (cajuína e Roda de Aromas), as conversas do
  Antigravity, o zip, o plugin Bio Research e a configuração local do Claude Code e do Antigravity. Push:
  *"Sim, push agora"*.
- **Tokens (sessão 0):** *"5% (5h) e 18% semanal queria nao precisar informar sempre. se eu posso olhar vc
  deveria ser capaz"* — virou a regra 1 de §Tokens.
- **`DECISOES_chat_a_conferir.md` (sessão 0):** conferir *"só inline"*; DEC-M1 *"parar, registrar,
  consertar"*; DEC-M3 *"arquivar como superado"*; DEC-09 *"ja existe como mcp server, mas quero sim com
  node."* (`DEBT-147`). Resolução item a item no §7 do próprio arquivo.

## Decisões de 31/10 a 05/11/2026 (registradas)

Vale o texto aprovado em `REVISAO_decisoes_2026-10-31.md` (parte A, com os vereditos no topo, e parte B) e,
para B1, B2 e D14, a redação precisa no achado. Aqui fica só o assunto de cada uma.
- **A1 a A9 (31/10 e 05/11).** O que cada uma trata:
  - A1: o método do ReviewBR e as trilhas das metodologias.
  - A2: o método do ReviewBR descrito como se descreve uma metodologia, com fundamentos na filosofia da ciência.
  - A3: duas camadas, o método do ReviewBR e a metodologia escolhida. "Campo da trilha" é sempre campo da
    metodologia escolhida.
  - A4: campo vazio nem sempre é erro.
  - A5: script e agente erram. O que produzem é revisado, e conferidor só vale como prova com teste de resposta
    conhecida.
  - A6: metodologia validada não se reverifica. Verifica-se a nossa transcrição dela, ao assimilar, e o estudo,
    a cada uso.
  - A7: o propósito do ReviewBR é aplicar a metodologia escolhida com certeza científica e de forma publicável,
    como um guia; o simples uso educa o pesquisador.
  - A8: estudo falso como controle na fase de testes.
  - A9: assimilar é tarefa de transcrição precisa e descrição.
- **B1 e B2 (05/11): a 2c redefinida.**
  - A conferência por palavras sai da trava.
  - A transcrição passa a ser conferida na assimilação, por leitura documentada, com conferidor testado e
    segunda leitura independente.
  - O Vicente revisa só as divergências.
  - Redação no DEBT-149.
- **D14 (04/11; corrigida em 05/11, à tarde): a revisão de escopo.**
  - O método de escopo não herda da revisão sistemática o que é próprio dela: rótulos do PICOS, exclusão por
    desfecho, certeza da evidência. Herdar isso é contaminação do PRISMA, no sentido de o ReviewBR usar o modelo
    da revisão sistemática como espelho do seu modo de trabalhar. O PRISMA não é proibido: os seus conjuntos de
    metodologias são importantes e vão existir no sistema.
  - Não pede assimilar metodologia nova nem migrar projetos. O defeito que aponta é o do DEBT-151, na sessão 6;
    a 2d saiu do plano.
  - Redação aprovada no DEBT-151 e na REVISAO, parte A.
- **Regra de registro (31/10):** decisão vai ao disco em forma precisa (item 4 do "Como trabalhar").
- **Decisões de 05/11, à tarde.** Origem: o Vicente apontou que a D14 tinha virado achado e sessão sem ser
  problema ("esse comentário não deveria gerar um debt 'empurrando com a barriga' problemas que não existem") e
  aprovou as cinco decisões com "aplicar as decisões". Texto completo em `triagem_backlog_2026-11-05/TRIAGEM.md`.
  - **Regra do backlog.** O backlog registra só defeito: o que o sistema afirma, exige ou entrega hoje e não se
    sustenta (DIRECAO §9). Reflexão ou decisão do Vicente que aponta defeito real entra no achado desse defeito,
    e só isso: não abre sessão nem agenda trabalho que o plano não tem. O princípio geral vai ao registro de
    decisões, e a agenda, ao plano. Metodologia validada que falta fica no catálogo e é assimilada pelo
    procedimento quando o Vicente decidir; o sistema não a assimila sozinho. Problema só futuro não se
    registra. Aplicada no item 4 do "Como trabalhar" e no `maintainer.md` (gate RV-11).
  - **2c.** O DEBT-149 fecha no item 1. A leitura documentada (itens 2 e 3) segue na 2c como construção do
    procedimento de assimilação, sem prender o fechamento. Sai o item 4: a trava da escolha de método (DEBT-145)
    é a D15.
  - **Triagem.** A proposta para os 58 abertos não se aplica de uma vez: cada sessão a confere para os achados
    que toca (item 9 do "Como trabalhar"). As 15 saídas esperam o Vicente.
  - **Sessão P**, curta, depois da 2c: a porta do backlog (tabela de sessões).
  - **Confirmações de 05/11, à tarde** ("saídas confirmadas. ok para posição M. Ok para D07"): as 15 saídas da
    triagem aplicadas (RECUSADO, com o destino de cada uma na resolution); a M fica antes da 6; o D07 é
    respondido antes de mexer no RAISE. A pergunta do D07 (quando o RAISE vale num projeto) segue aberta.
  - **D07, decidido em 05/11, à tarde.** Todo projeto declara onde e como a IA foi usada, e, quando a
    metodologia, a norma de relato ou o periódico exigem mais, todas as informações que se pede ("Levamos as
    metodologias a sério"). O RAISE não é norma canônica; entra como norma quando o método ou o destino o
    exigem. Texto em `lista_decisoes.md` (D07) e em `d07_raise_fontes_2026-11-05.md`. O mapa de uso de IA
    das tools fica como política do sistema para as suas ferramentas (bloqueia o não aceitável e exige
    validação onde o RAISE 3 exige), e a citação do RAISE 1 no `maintainer.md` fica ("1 sim, 2 fica", 05/11). A frase da
    credibilidade virou critério científico, redigido pelo acompanhamento a pedido dele, a conferir na M.
  - **Respostas à 2c, 08/11** ("a sim, b sim").
    - (a) As 36 divergências da leitura documentada do PRISMA-S do prisma-sr
      (`sessao_2c/divergencias_prisma_s.md`) são decididas pelo Vicente depois da sessão M, de uma vez, porque
      duas classes delas dependem de definições da M. Até lá vale, em cada ponto, o mapeamento de 30/10, e nada
      trava.
    - (b) A M responde a três perguntas da 2c: (1) o que é "cobrir um item da norma" no método do ReviewBR —
      coletar a informação (campo da trilha), relatá-la (seção do manuscrito, suplemento) ou garanti-la por
      código (o que a ferramenta grava sozinha); (2) se a leitura documentada confere a norma também contra o
      que a ferramenta garante por código e pelos invariantes RV, e não só contra os campos da trilha
      (procedimento de assimilação, no `maintainer.md`; vale para o PRISMA-P e o PRISMA 2020); (3) se o gate
      RV-11 (`validate_system_change`) passa a exigir leitura documentada quando um mapeamento muda.
  - **Opcional e obrigatório seguem a metodologia (08/11).** Redação do acompanhamento, corrigida pelo Vicente
    em 08/11; vai à descrição do método (M).
    - O ReviewBR segue o que cada metodologia diz: o que ela torna obrigatório é obrigatório, e o que torna
      opcional é opcional. Vale para todas.
    - Opcional não deixa o protocolo em branco: o protocolo registra a escolha, conforme os objetivos do projeto
      de pesquisa.
    - Pergunta que o protocolo do método não tem não é feita ao projeto.
    - Contradições de hoje, já no backlog: o DEBT-151 (o escopo herda do prisma-sr a certeza da evidência e a
      exclusão por desfecho) e o DEBT-135 (registro de protocolo exigido sem norma que o exija).
    - Origem, nas palavras dele: "sobre f1 não é obrigatório como diz o método de escopo e isso vale para todas
      as metodologias. seguimos o que elas dizem. o que não quer que não se preenche os protocolos com os
      objetivos. se não vai fazer avaliação crítica preenche com não. se o método não tem em seu protocolo não
      responde"; correção dele: "os objetivos do projeto de pesquisa. Não precisa fazer novas definições para uma
      metodologia específica já que temos a diretriz para todas".
  - **Como a manutenção segue (08/11).** Redação do acompanhamento, a conferir pelo Vicente no chat novo.
    - A abertura de compreensão de outubro e novembro, que mudou a natureza do ReviewBR e abriu muitas frentes,
      não se repete nas próximas manutenções.
    - A manutenção passa a buscar clareza, limpeza e redução ao necessário.
    - Cada sessão faz uma tarefa simples e específica a uma função do ReviewBR, com começo, meio e fim, numa
      janela quando possível.
    - Não se abre frente nova sem que um defeito (regra do backlog) ou uma decisão do Vicente a peça.
    - Das decisões D01 a D41, vai a cada sessão só a que pesa nela.
    - Origem, nas palavras dele: "além de mudar a natureza do reviewbr que nos levou a abrir muitas frentes de
      trabalho não serão assim para as próximas manutenções. uma das funções da manutenção é ter clareza, limpeza
      e redução ao necessário após a grande abertura de compreensão que fizemos para que as tarefas de manutenção
      fiquem simples e específicas para as funções do reviewbr com abertura de sessões com começo meio e fim".
  - **D04 coberta; D05, D10 e D16 fora da M (08/11).**
    - A D04 (âncora científica de cada metodologia e isenção da ferramenta: o sistema não assume cultura
      epistemológica além do que o método exige) está coberta e não volta à discussão. Não contradiz a A2, porque
      as duas tratam de camadas diferentes (A3): os fundamentos na filosofia da ciência (A2) são do método da
      própria ferramenta; a D04 trata da metodologia do projeto, e ali o princípio de 08/11 já diz o mesmo —
      segue-se o que o método pede, e não se pergunta nada além do protocolo dele.
    - Consequência: a M leva a D04 entre o "já decidido", sem pergunta.
    - A M não leva ao Vicente a D05 ("assimilada completa"), a D10 ("o rigor que eles pedem") nem a D16 ("validada
      cientificamente"), salvo se o texto dela tocar nesses pontos; aí leva a redação proposta da lista antes de
      usá-la.
    - Origem, nas palavras dele: "D04, sim, mas só para registrar que já está coberta. Sem abrir discussão nova.
      Não há contradição com a A2, porque são camadas diferentes"; "D05, D10 e D16, não. A M só as leva a você se
      o texto dela tocar nesses pontos".
  - **Página única depois da M (08/11).** Depois da M e antes da V, o acompanhamento reescreve numa página só as
    sessões que faltam (V, 3, 4, 5, 6, 7+), uma função do ReviewBR por sessão: a sessão que hoje junta funções
    diferentes se divide (as 3, 4 e 5 juntam de duas a quatro; a 4, por exemplo, log de busca, saturação e
    dedup). O resto do plano vira histórico, e cada sessão passa a ler só essa página. Origem: proposta do
    acompanhamento, aprovada por ele com "Sim, uma função por sessão" (08/11).

## Contexto que desfaz ambiguidades: o sistema mudou DURANTE a troca de computador

Registro pedido pelo Vicente em 29/10/2026. A manutenção do ReviewBR não parou durante a troca de PC, e por
isso há três retratos do sistema, de datas diferentes:

| onde | retrato de | edita-se? |
|---|---|---|
| PC antigo (e as sessões que ficaram nele) | até a cópia, em 02/10/2026 | não — ficou para trás |
| `D:\backupantigravity\reviewbr` | a cópia de 02/10/2026, conferida arquivo a arquivo (`TRANSICAO_PC_2026-10-02.md`); reconferida íntegra em 29/10 (nenhum arquivo alterado depois de 03/10) | não — arquivo morto, única outra cópia do que o `.gitignore` deixa de fora |
| `C:\Antigravity` | nada do ReviewBR: é a pasta das outras aplicações do Vicente, em uso (corrigido em 29/10; aqui dizia "cópia de 02/10") | — |
| `C:\reviewbr` | o sistema de hoje: tudo o que mudou de 02/10 em diante só existe aqui, **sem commit** | sim — o único |

Consequências para ler o disco sem se enganar:
- Documento ou achado que descreve o sistema **antes de 02/10** pode estar descrevendo um sistema que já mudou;
  vale o código de hoje, conferido.
- O `DECISOES_chat_a_conferir.md` foi montado **no meio da troca**, a partir das conversas do PC antigo: cada
  item pode já ter sido superado por decisão posterior (03/10, 03b, 08/10, 17/10, 29/10).
- O trabalho de 02/10 a 29/10 só existe no working tree de `C:\reviewbr`. É por isso que o commit da sessão 0
  vem antes de qualquer outra coisa.

## Sessões

| # | sessão | perguntas / achados | entrada | saída verificável |
|---|---|---|---|---|
| 0 | Fechar a troca de computador | commit seguro, `.gitignore`, `DECISOES_chat_a_conferir.md`, cópias antigas | decisão do Vicente sobre o que vai ao GitHub (público) | commit feito sem `.env`, conversas de outras aplicações nem o zip; `git status` limpo; arquivo a conferir resolvido ou recusado item a item |
| 1 | Escopo e PRISMA-S | 1 (DEBT-055), 2 (DEBT-128) | sessão 0 | `check_standard_coverage` do PRISMA-ScR sem omissão silenciosa; PRISMA-S com `titulos_oficiais: true` e falsificação com poder |
| 2a | Declarações por método — o núcleo | DEBT-142 (mapeamento e declarações por método; item condicional); DEBT-150 e DEBT-008 passaram à 2b pela regra da janela | sessão 1 | mapeamento e declarações lidos do método; `check_standard_coverage` idêntico antes e depois, salvo o deliberado; item condicional respondido pelo projeto; testes |
| 2b | Itens condicionais em uso | DEBT-150 (avaliação crítica no escopo), DEBT-008 (certeza da evidência: declarar; a assimilação vai às 7+), DEBT-152 (frases velhas em agentes e skill) | 2a | condição declarada pelo método, perguntada na F1 e respondida pelo projeto, com o efeito no denominador que a fonte manda, com teste; F7.3 declarada [NÃO COBERTO] por tool; `prisma-rigor-gates` sem a certeza que nenhum gate confere; agentes sem as frases velhas |
| 2c | Conferência do mapeamento: fora da trava; leitura documentada | DEBT-149 — decisão de 05/11 (B1, B2), que substitui os pontos (1) e (4) da de 30/10; fecha no item 1 (decisão de 05/11, à tarde) | 2b | suspeito da conferência por palavras não reprova, e o relatório diz o que ela é e quanto enxerga; o porquê de cada etapa não depende dela; PRISMA-ScR do escopo `valid: true` sem mexer no mapeamento; leitura documentada com conferidor testado; PRISMA-S do prisma-sr lido e relido de forma independente, com as divergências levadas ao Vicente |
| P | A porta do backlog | regra do backlog e decisão 5 de 05/11, à tarde | 2c | a `record_system_finding` recusa achado novo ou atualizado sem a "mentira de hoje" (onde o sistema afirma ou exige, com arquivo:linha, e o que contradiz), com teste; o destino `METODOLOGIA_NOVA` deixa de valer para defeito, e os abertos com esse destino que são defeito (14, pela triagem de 05/11) recebem o destino certo; outras instruções que mandem registrar ausência como achado, se houver (o crítico da triagem não rodou), alinhadas à regra |
| M | Método do ReviewBR — descrição | A1–A3, A7, A9 (31/10–05/11); D09 e D17 da revisão de decisões; os princípios que saíram do backlog em 05/11, para redação e aprovação do Vicente: o alvo da triagem por IA (DEBT-101, D01), o modo de agir (DEBT-132) e a auditoria de protocolo por método (DEBT-134); o critério de credibilidade do D07, reformulado em 05/11; as três perguntas da 2c (08/11): o que é cobrir um item da norma, se a leitura documentada confere também o que a ferramenta garante por código, e se o gate RV-11 exige leitura documentada quando um mapeamento muda — as 36 divergências do PRISMA-S se decidem depois delas; o princípio de 08/11 (opcional e obrigatório seguem a metodologia) | 2c (antes da 6, que depende dela; posição confirmada pelo Vicente em 05/11) | o método da ferramenta descrito como metodologia — objetivo, fundamentos na filosofia da ciência, princípios, etapas, critérios de validade e limites —, aprovado pelo Vicente |
| V | Divergências do PRISMA-S aplicadas | decisão (a) de 08/11; a decisão do Vicente sobre as 36, tomada no acompanhamento pelo arquivo `sessao_2c/divergencias_prisma_s.md` | M | o que ele aceitar entra no mapeamento do prisma-sr e na cópia do escopo (decisão de 08/11), com trecho por ponteiro, teste, a coluna da spec acompanhando e a medida da conferência por palavras refeita; o que ele recusar fica registrado no arquivo |
| 3 | Funil e gates | 3 (DEBT-138), 4 (a decisão de 29/10 sobre gates, que vai no conserto do DEBT-138; o DEBT-070 saiu do backlog em 05/11), DEBT-071/105 | — | export bloqueia funil divergente; manifests dizem a verdade sobre os gates; teste do FlowComputer e do caminho do handler do checkDesignGuardrail (do DEBT-043, que saiu do backlog em 05/11) |
| 4 | Busca e triagem | 5 (DEBT-056), 6 (DEBT-021), 7 (DEBT-025) | — | log PRISMA-S gravado por código; saturação lê o disco; dedup com DOI/acentos e nível 4 só sinalizando |
| 5 | Leitura e governança | 8 (DEBT-031), 9 (DEBT-018), 12 (DEBT-016), DEBT-141 | — | citação com página; trava só pelo `project_state.json`; aviso na tool de `targets`; atualização do catálogo sem apagar campos |
| 6 | Sair do esqueleto PRISMA | DEBT-137 (agentes e skills descritos por F0–F8), a cópia da tabela de tipos e a enum do `plan_research_protocol` (do DEBT-136, que saiu do backlog em 05/11), tabela F0–F8 do `conduct-review`; DEBT-151 (o escopo herda do `prisma-sr` o que é da revisão sistemática; D14, 05/11; antes, numa sessão curta, se os projetos de escopo chegarem à triagem) | sessões 2a–2c, P e M | agentes descritos por papel, com teste que compara a seção "Ferramentas (contrato de papel)" de cada agente com o frontmatter (do DEBT-146, que saiu do backlog em 05/11); cada etapa do manifest diz que skill a executa; o que é do `prisma-sr` fica no `prisma-sr` |
| 7+ | O resto da reclassificação | 19 declarações e consertos restantes; assimilação de métodos validados (JBI, GRADE/CERQual, exploratório…); funcionalidades que saíram do backlog em 05/11, quando o Vicente pedir: validação da IA dentro da revisão (do DEBT-015, DEBT-094 e DEBT-101), a trava da escolha de método (do DEBT-145, depois do DEBT-014 e do DEBT-045), o OCR (DEBT-102, com os caminhos fixos do DEBT-106 como parâmetro) e a forma de abrir o ReviewBR numa IDE com IA (do DEBT-147, D31); a declaração de uso de IA de todo projeto — onde e como foi usada e, quando exigido, tudo o que se pede (D07, 05/11) —, pronta antes de algum projeto chegar ao relato (F8) | sessões 1–6 | um bloco por sessão, na ordem do arquivo de reclassificação |
| depois | Fase de testes do sistema e análise do trabalho | sequência decidida pelo Vicente em 27/09 (DEC-42 do `DECISOES_chat_a_conferir.md`); critério de entrada registrado em 03/10 (`DECISOES_2026-10-03.md`), a reconferir ao chegar lá | sessões 1–7+ | a definir |

**Estado:** sessões 0 (29/10/2026), 1, 2a (30/10/2026) e 2b (31/10/2026) fechadas, cada uma com a carta na sua
seção e conferida pelo acompanhamento. Entre 31/10 e 05/11 o Vicente aprovou as considerações A1–A9 e redefiniu
a 2c (B1, B2); em 05/11, à tarde, corrigiu a D14, aprovou a regra do backlog e tirou a 2d do plano (ver
"Decisões de 31/10 a 05/11/2026", acima, e `triagem_backlog_2026-11-05/TRIAGEM.md`). A 2c fechou (parte 1 em 05/11; parte 2 de 06 a 08/11) e foi
conferida pelo acompanhamento em 08/11: suíte 440/440 em 37 arquivos, audit válido, DEBT-149 resolvido, PRISMA-S
9/16 nos dois métodos, PRISMA-ScR do escopo 14/22 e valid. A P fechou em 08/11 e foi conferida no mesmo dia: suíte
474/474 em 38 arquivos, audit válido, nenhum aberto com METODOLOGIA_NOVA, e a porta conferida à parte, pelo dist,
numa cópia do backlog (8 casos). **Próxima: M, com o prompt na seção dela; depois, o Vicente decide as 36
divergências do PRISMA-S no acompanhamento, e a V as aplica.** As 36 divergências do PRISMA-S (`sessao_2c/divergencias_prisma_s.md`) esperam a M, e a M responde às
três perguntas da 2c (decisões de 08/11). Depois da M e antes da V, o acompanhamento reescreve numa página só as
sessões que faltam, uma função por sessão (decisão de 08/11, "Página única depois da M").

A M fica antes da 6, e as 15 saídas da triagem foram aplicadas (confirmações do Vicente de 05/11). Pendentes que
não bloqueiam a M:
- as 41 decisões da lista D01–D41 (`revisao_decisoes_2026-10-31/lista_decisoes.md`), cada uma antes da sessão
  em que pesa;
- do pesquisador, em cada projeto de escopo: responder a condição avaliacao_critica (pendência da 2b), conforme o
  protocolo travado de cada um.

A régua do `--agora` foi recalibrada em 05/11: 10,0–13,5 M (`CONTINUAR.md` §1, item 6).

### Modelo e esforço de cada sessão (calculado em 29/10/2026)

Modelo: **Opus 5.5 em todas** — *"nunca deixar de usar o opus pela complexidade das tarefas"* (Vicente, 25/09).
Esforço: **max** nas sessões 1 a 6 — mexem em norma oficial, arquitetura, gates, travas e trilha de auditoria,
onde um erro faz o sistema mentir em silêncio; **high** só onde o trabalho é mecânico ou de conferência. O
seletor do Antigravity vai até *max* e não mostra *xhigh* (Vicente, 30/10); o padrão salvo do Opus 5.5 está em
xhigh. **Cada prompt começa com uma linha de modelo e esforço, para o Vicente ajustar o seletor e apagá-la antes
de enviar** (pedido dele, 29/10). Custo estimado pela sessão 0, que rodou em max (~4 M de ponderado ≈ 40% de uma
janela de 5h, sem contar outro projeto aberto na mesma janela).

| # | esforço | ultracode | custo estimado (janela de 5h) | por quê |
|---|---|---|---|---|
| 1 | max | não | 40–60% | leitura do checklist oficial e mapeamento contra a norma; o falsificador só confere em parte |
| 2a | max | não | 60–80% (medido: 4,5 M ≈ 40–48% só com os itens 1 e 2; a janela foi a 81–98% com outro projeto em paralelo) | DEBT-142 muda onde mapeamento e declarações moram e é pré-requisito do DEBT-045/014 e da sessão 6 |
| 2b | max | não | 40–60% | primeiro uso do item condicional nos dois métodos; a certeza da evidência pede a leitura da fonte antes de mexer no denominador |
| 2c | max | não; um agente para a segunda leitura independente, aprovado pela decisão B2 (05/11) | 70–110% — planejar até duas janelas | tira a conferência fraca da trava sem fazer o relatório mentir, e cria a leitura documentada que vai conferir toda transcrição |
| P | max | não | 20–40% | mexe no registro de achados, que é a trilha de auditoria da manutenção |
| M | max | não | 60–100% por janela, com muita participação do Vicente; planejar duas | é a descrição que fundamenta o resto; os fundamentos na filosofia da ciência são leitura e decisão dele |
| V | max | não | 20–40% | mexe em mapeamento de norma oficial, com teste e medida |
| 3 | max | não | 40–60% | funil e gates: o que o export bloqueia e o que os manifests dizem dos gates |
| 4 | max | não | 40–60% | trilha de auditoria da busca (log PRISMA-S), critério de parada (saturação) e o que a dedup tira |
| 5 | max | não | 40–60% | o DEBT-018 mexe na trava do protocolo, com cuidado de compatibilidade com projetos antigos |
| 6 | max | não na execução; revisão independente depois, recomendada | 70–100%+ — planejar duas janelas | mudança de direção em agentes, skills e manifests: risco de deriva e de quebrar o `prisma-sr` |
| 7+ | high nas 19 declarações; max nos consertos e na assimilação de método validado | só na assimilação, para varrer fontes oficiais, com custo aprovado | um bloco por janela | declarar é mecânico; assimilar é ler norma |
| testes | high para rodar; max para analisar | não | a definir | rodar é conferir; analisar é julgar |
| acompanhamento | max (desde 08/11; era high) | não; agentes em paralelo só com custo aprovado | — | as decisões que ele grava viram fundamento, e erro ali se propaga (a D14 virou sessão em 05/11); o custo se controla com chat novo e contexto curto, não com esforço menor |

Uma sessão por janela de 5h, começando com a janela nova; trabalho pesado em outro projeto na mesma janela
reduz o que sobra para a sessão.

## Como trabalhar — para o disco e a sessão não dependerem um do outro

1. **Uma porta de entrada.** Este arquivo e o topo da `ESPECIFICACAO_vestir_metodos.md` dizem o estado; os
   outros documentos de `.claude/maintenance/` são histórico. Sessão nova lê só isso e roda `audit_system_debt`.
2. **Cada sessão tem carta** (modelo abaixo): abre com objetivo, entrada e saída verificável; fecha com o que
   foi feito, testes, commit e a próxima sessão. Sessão sem saída verificável não começa.
3. **Toda sessão termina com commit.** O que não está commitado não existe para a próxima sessão. Nunca mais
   semanas de trabalho só no working tree.
4. **Decisão do Vicente vai ao disco na hora**, no lugar certo (regra do backlog, 05/11: no achado, pela tool
   `record_system_finding`, só a que aponta o defeito dele ou decide o conserto dele; o princípio geral, no
   registro de decisões; a agenda, neste plano), **escrita em forma precisa e autoexplicativa**: o que foi decidido, o alcance e a consequência, com os termos
   definidos, legível por quem não viu a conversa. A frase dele, ou o rótulo da opção que ele escolheu, vai junto
   só como origem, nunca como o texto da decisão; quando a redação reinterpreta o que ele disse, ele a confere
   antes de gravar (pedido dele, 31/10/2026: frase gravada "do jeito que eu disse", sem tratamento, gera
   problema). Decisão que fica só no chat é o que gerou o `DECISOES_chat_a_conferir.md`.
5. **Evidência dentro do repositório.** Sonda e reprodução de achado não ficam no scratchpad da sessão.
6. **Fan-out só com saldo combinado** e com o resultado de cada agente gravado ao terminar; senão, trabalho
   inline. Duas mortes por limite (03/10 e 17/10) e uma interrupção (29/10) ensinaram isso.
7. **Um assunto por sessão.** Furo do plano encerra a sessão com registro, não com improviso.
8. **Abrir e fechar conferindo, não lembrando:** testes verdes, build em dia, `git status` e `audit_system_debt`
   no começo e no fim.
9. **Achado tocado, conferido contra a triagem de 05/11.** Na abertura, a sessão lê em
   `triagem_backlog_2026-11-05/TRIAGEM.md` a proposta para os achados que vai tocar (ficar, enxugar, fundir) e,
   ao fechar, a aplica pela tool se ela se sustentar no código. As 15 saídas foram aplicadas em 05/11. Desde a
   sessão P (08/11), gravar achado aberto — inclusive passá-lo a EM_CURSO — exige a mentira de hoje dele,
   conferida na linha (a triagem traz uma proposta para cada, não contestada). Para conferir uma troca no
   backlog, use `sessao_p/compara_backlog.mjs`: o BacklogWriter regrava o arquivo e reordena chaves.

### Os dois chats, e como cada sessão abre e fecha

*"este chat vai servir tanto para acompanhar as sessoes antes e ao fechar quanto para tirar duvidas ou registrar
decisoes para as sessoes me ajudando com a criacao do prompt de cada sessao"* (Vicente, 29/10/2026).

- **Chat de acompanhamento.** É o chat que fechou a sessão 0 (aberto em 29/10/2026). Ele prepara o prompt de
  abertura de cada sessão e o grava neste arquivo, na seção da sessão; tira dúvidas; grava no disco, na hora, as
  decisões do Vicente; e, no fechamento, confere a carta (saída verificável, suíte, commit, `audit_system_debt`) e
  prepara a próxima. Não executa sessão. Se ele se perder ou ficar caro demais, qualquer chat novo assume o papel
  lendo este arquivo.
- **Chat da sessão.** Um chat novo por sessão, aberto com o prompt preparado no acompanhamento. Executa só a sua
  sessão, escreve a carta logo abaixo do prompt, commita, faz push e para. Diante de um furo do plano, anota-o na
  carta (defeito vai pela tool, com a mentira de hoje), fecha o passo com segurança e devolve o assunto ao
  acompanhamento.

O ciclo: (1) no acompanhamento, "prepara a sessão N" — o prompt sai em `## Sessão N — prompt de abertura`;
(2) num chat novo, cola-se o prompt; (3) a sessão fecha com a carta; (4) no acompanhamento, "fecha a sessão N" —
confere a carta e prepara a N+1. A sessão começa de preferência numa janela de 5h nova.

### Abrir um chat de acompanhamento novo

Quando o chat de acompanhamento ficar caro, ou rodar uma versão antiga do servidor MCP, abra outro com o prompt
abaixo (preparado em 08/11/2026). Nada se perde: o estado está no disco e no git, a memória do projeto carrega
sozinha no chat novo, e ele lê a versão atual do servidor. Ajuste o seletor pela primeira linha e apague-a antes de
enviar.

```
>>> APAGUE ESTA LINHA ANTES DE ENVIAR — seletor: Opus 5.5 · esforço max <<<
Chat de acompanhamento da manutenção do ReviewBR — novo, a partir de 08/11/2026.
Modelo e esforço: Opus 5.5, max; nenhum subagente nem workflow sem custo combinado com o Vicente.

O seu papel ("Os dois chats", no plano): preparar o prompt de cada sessão e entregá-lo aqui, pronto para copiar;
registrar na hora as decisões do Vicente, em forma precisa; conferir, sem lembrar, o fechamento de cada sessão
quando ele disser "fecha a sessão N"; e dizer o próximo passo. Você não executa sessão.

Abertura — leia, nesta ordem, sem confiar em memória de conversa:
1. .claude/maintenance/PLANO_sessoes_2026-10-29.md: "O que este chat cravou"; "Decisões de 31/10 a 05/11/2026",
   inteiras (vão até 08/11); "Sessões", com a linha "Estado" e os pendentes; "Modelo e esforço"; "Como
   trabalhar" (itens 1 a 9); "Os dois chats"; "Tokens"; "Carta de sessão"; as conferências da 2c e da P e o prompt
   da M, no fim do arquivo.
2. .claude/maintenance/REVISAO_decisoes_2026-10-31.md — partes A e B aprovadas; a parte C, a conferir — e
   .claude/maintenance/revisao_decisoes_2026-10-31/lista_decisoes.md: cada decisão D01 a D41 vai ao Vicente antes
   da sessão em que pesa.
3. .claude/maintenance/triagem_backlog_2026-11-05/TRIAGEM.md: a regra do backlog e a proposta por achado, que
   cada sessão confere para os achados que toca.
4. Rode git status e git log -10, node .claude/maintenance/sessao_2a/le_audit.mjs e python
   .claude/maintenance/medir_esforco.py --agora.

Regras que valem aqui (estão no plano e na memória; a lista é só lembrete):
- Decisão do Vicente vai ao disco na hora, em forma precisa: o quê, alcance e consequência, com os termos
  definidos. A frase dele vai só como origem; redação que reinterpreta, ele confere antes. Princípio geral fica
  geral.
- Regra do backlog (05/11): achado é só defeito — o que o sistema afirma, exige ou entrega hoje e não se sustenta.
  Metodologia que falta vai ao catálogo; decisão, ao registro de decisões; agenda, ao plano. A
  record_system_finding exige a mentira de hoje (arquivo, linha, diz, nao_se_sustenta).
- Não pergunte ao Vicente a porcentagem de uso: meça. A régua não vê subagente; em 05/11 um workflow de 9
  agentes, lançado sem custo combinado, estourou a janela.
- Prompt de sessão: a primeira linha diz modelo e esforço, e ele a apaga; sem a palavra do modo de orquestração de
  agentes; furo do plano vai à carta; uma sessão por janela; a 75% estimados não se começa passo novo; toda sessão
  termina com commit e push.
- Só o sistema vai ao GitHub público: nunca .env, conversas de outras aplicações, os projetos de pesquisa em
  reviewbr/projects/, o plugin Bio Research ou configuração local. Não abra antigravity_conversas_export/.
- A manutenção não toca reviewbr/projects/; decisão de pesquisa se responde no chat de cada projeto.

Onde estamos em 08/11/2026: sessões 0, 1, 2a, 2b, 2c e P fechadas e conferidas. Próxima: M (descrição do método do
ReviewBR), com o prompt no fim do plano. Depois da M, o Vicente decide aqui as 36 divergências do PRISMA-S
(.claude/maintenance/sessao_2c/divergencias_prisma_s.md), e a sessão V as aplica; depois vêm 3, 4, 5, 6 e 7+.
Pendências e alertas: na linha "Estado" do plano. Terminada a leitura, diga ao Vicente, em até 5 linhas, o estado
e o próximo passo, e espere.
```

### Tokens — registro, acompanhamento e projeção (para não perder trabalho no limite)

O limite é da conta, por janela de 5h, e só o Vicente vê a porcentagem. O agente mede o que já passou com
`python .claude/maintenance/medir_esforco.py` (chat principal) e `--workflows` (subagentes). **O `--workflows`
estava cego até 29/10/2026** — somava consumo do journal, que não o traz, e dizia "nenhum journal" com 10 corridas
em disco; corrigido para ler as transcrições dos agentes. O que ele mostrou explica o 91% de 29/10: os 2 agentes
da corrida interrompida gastaram **154 mil tokens de saída em ~15 minutos**, mais que o dobro do chat principal
na mesma janela (68 mil). E das 10 corridas em disco, 6 morreram com agentes pela metade.

1. **Registro — o agente mede; o Vicente não precisa informar.** *"queria nao precisar informar sempre. se eu
   posso olhar vc deveria ser capaz"* (Vicente, 29/10/2026). Ao abrir e ao fechar a sessão, a carta anota o que
   `python .claude/maintenance/medir_esforco.py --agora` estima para a janela de 5h da conta (todos os projetos
   desta máquina, com subagentes) e a régua usada. Se o Vicente disser a porcentagem, ela entra ao lado como
   par de calibração (`CONTINUAR.md` §1). A estimativa é piso: o uso no claude.ai não deixa transcrito aqui.
   A barra de status global que daria a leitura exata do painel (29/10, aprovada pelo Vicente) foi retirada em
   30/10, como ele decidira para o caso de não vir dado: em três sessões e ~36 h o comando nunca rodou — a
   extensão do Claude Code no Antigravity não executa a barra de status (`CONTINUAR.md` §1).
2. **Projeção antes de executar.** Estimar a sessão: chat principal + subagentes. Medido: agente que lê código
   gasta de 10 a 80 mil de saída; a revisão de 3 agentes gastou 138 mil, a reclassificação de 7, 76 mil. Se a
   projeção passa do que resta com folga de 15%, a sessão se divide ou roda sem fan-out.
3. **Acompanhamento.** Gravar em disco a cada passo concluído (arquivo ou commit). A 85% lidos — ou 75%
   estimados, porque a estimativa é piso — não se começa passo novo: fecha-se a sessão com carta e commit.
4. **Corte seguro.** Fan-out só se cada agente gravar o resultado ao terminar; se cortar, o parcial se extrai das
   transcrições (foi o resgate de 18/10) antes de qualquer outra coisa.

### Carta de sessão (modelo)

```
## Sessão N — <assunto> — <data>
Objetivo: <uma frase>
Entrada: <o que precisa estar pronto/decidido>
Saída verificável: <teste, comando ou número que prova o fim>
Modelo e esforço: <modelo · esforço · ultracode sim/não>
Tokens na abertura: <% estimada pelo --agora (piso), ou lida no painel> · medido: principal, subagentes · projeção da sessão: <estimativa>
--- fechamento ---
Tokens no fechamento: <%> · medido: principal <saída>, subagentes <saída>
Feito: <achados fechados, com id>
Verificação: <suíte X testes verde; build; audit_system_debt ok>
Commit: <hash>
Decisões do Vicente registradas: <ids>
Próxima sessão: <N+1>
```

## Sessão 0 — Fechar a troca de computador — 29/10/2026

```
Objetivo: commitar com segurança o trabalho de 02/10 a 29/10 e fechar as pendências da troca de computador.
Entrada: decisão do Vicente sobre o que vai ao GitHub — "Só o sistema", com push.
Saída verificável: commit sem .env, conversas de outras aplicações nem o zip; git status limpo;
  DECISOES_chat_a_conferir.md resolvido item a item.
Tokens na abertura: 5% (5h) e 18% (semanal), lidos pelo Vicente · medido: principal 0,52 M ponderado
  (unidade nova, deduplicada; 42,5 mil de saída na unidade antiga), subagentes 0 · projeção: só inline.
--- fechamento ---
Tokens no fechamento: 54% a 65% da janela de 5h da conta, estimados (--agora, piso) · medido: o chat
  principal e uma consulta ao claude-code-guide, que sozinha gastou ~206 mil tokens em 28 min, mais o
  projeto Cultura Líquida aberto na mesma janela. (Na primeira versão desta carta, 40% a 48%: medido
  antes de a consulta terminar.)
Feito:
- Commit a2391e4 (137 arquivos) e push para origin/reorg/agentic-layer. O .gitignore recebeu o que fica fora;
  207 arquivos de conversas do Antigravity saíram do stage (5 trechos com cara de chave de API, nunca
  enviados); varredura de segredos no que entrou: zero, com controle positivo. Sete sondas de 09/10
  (reviewbr-mcp/_*_tmp*) foram para old/descarte_2026-10-29/ (regra do DEC-10).
- DECISOES_chat_a_conferir.md resolvido item a item (§7): 55/55 citações na linha citada
  (confere_decisoes_chat.py); DEC-17, DEC-19 e DEC-48 corrigidos sob gate RV-11; DEC-08, DEC-13 e DEC-45
  transcritos; DEC-M1, DEC-M3 e DEC-09 respondidos pelo Vicente; achados novos DEBT-146 (DEC-43) e
  DEBT-147 (DEC-09).
- Cópias antigas: D:\backupantigravity\reviewbr íntegra, mantida como arquivo morto; C:\Antigravity não tem
  ReviewBR (tabela do contexto corrigida).
- Tokens: o Vicente deixa de informar a porcentagem. DEBT-148 (o medir_esforco.py contava cada bloco de
  uma resposta como mensagem, ~2,2×, e não via o Agent tool nem outros projetos) corrigido sob gate RV-11,
  com --agora e régua nova no CONTINUAR §1. Barra de status global configurada com a aprovação dele, para a
  leitura exata do painel; até o fechamento ela ainda não tinha gravado nada (a conferir na próxima sessão:
  se o Team não entregar o dado, desfazer).
Verificação: suíte 361/361 em 32 arquivos; build ok; audit_system_debt válido — 148 achados (55 abertos,
  4 em curso, 73 resolvidos, 16 recusados); git status limpo depois do commit de fechamento.
Commit: a2391e4 (o trabalho de 02/10 a 29/10) + o commit de fechamento desta carta.
Decisões do Vicente registradas: o que vai ao GitHub; push; conferência inline; DEC-M1; DEC-M3;
  DEC-09 (DEBT-147); tokens (§Tokens, regra 1).
Próxima sessão: 1 — Escopo e PRISMA-S (DEBT-055, DEBT-128).
```

## Sessão 1 — prompt de abertura

Preparado no chat de acompanhamento em 29/10/2026. Cole num chat novo, ajuste o seletor pela primeira linha e
apague-a antes de enviar:

```
>>> APAGUE ESTA LINHA ANTES DE ENVIAR — seletor: Opus 5.5 · esforço max · sem ultracode <<<
Sessão 1 do .claude/maintenance/PLANO_sessoes_2026-10-29.md — Escopo e PRISMA-S.
Modelo e esforço: Opus 5.5, max, sem ultracode (anote na carta).

Este é o chat da sessão 1: execute só ela. Decisões, dúvidas e a próxima sessão ficam no chat de
acompanhamento. Furo do plano (algo que este prompt e o plano não decidem): registre pela tool, feche o passo
com segurança e pare com "FURO DO PLANO — levar ao acompanhamento", em até 3 linhas.

Abertura, conferindo e não lembrando: leia neste plano o "Como trabalhar" e a seção da sessão 1; rode a suíte
(npx vitest run em reviewbr/reviewbr-mcp), git status, python .claude/maintenance/medir_esforco.py --agora e
audit_system_debt (devolve ~150 mil caracteres: leia por script só valid, counts e os achados desta sessão).
Não pergunte ao Vicente a porcentagem de uso.

Já decidido, não perguntar de novo:
- DEBT-055: "As perguntas 1, 3, 4, 5, 6, 7, 8, 9 e 12 sim para todas" (Vicente, 29/10). Mapear já os 22
  itens do PRISMA-ScR contra a trilha do método scoping-prisma-scr, no formato atual (antes do DEBT-142),
  lendo o checklist oficial em reviewbr/download/PRISMA-ScR-Fillable-Checklist_11Sept2019.pdf (fora do git,
  existe no disco). Item sem cobertura vai declarado, nunca encaixado.
- DEBT-128: "se existe metodologia, vamos assimilar" (17/10) e "assimilar só metodologia validada
  cientificamente" (29/10). Gravar no prisma-s.json os 16 enunciados oficiais com a fonte no
  version_source, passar titulos_oficiais para true, rodar o falsificador (mapping_coherence) e remapear os
  ponteiros S1–S16 da spec do prisma-sr, que hoje seguem a numeração do ReviewBR.

Armadilhas já conhecidas:
1. O catálogo NÃO tem os 16 títulos do PRISMA-S, só a contagem e as seções (context do DEBT-128). A fonte é
   o checklist oficial (OSF, https://osf.io/y765x/) ou o artigo de 2021, em acesso aberto. Sem ler a fonte,
   não transcreva de memória (RV-03): é furo.
2. O item 12 do PRISMA-ScR (avaliação crítica, "se feita") pede item condicional, e o mecanismo de condição
   é o DEBT-142, da sessão 2. Se o formato atual não comportar, declare e registre — não invente o
   mecanismo aqui.
3. Toda alteração passa pelo gate RV-11 (validate_system_change, com addresses) e todo achado pela tool,
   nunca pelo JSON à mão.

Saída verificável: check_standard_coverage do PRISMA-ScR sem omissão silenciosa; prisma-s.json com
titulos_oficiais: true; o falsificador com poder — com os títulos oficiais e antes do remapeamento, ele
deve acusar os ponteiros S11 e S13, que o DEBT-128 já mostrou deslocados (controle positivo), e depois do
remapeamento não acusar mais; se não acusar antes, ele não tem poder, e isso é achado a registrar (atenção:
os rótulos da spec estão em português e os títulos oficiais, em inglês); suíte verde, build em dia,
audit_system_debt válido; DEBT-055 e DEBT-128 fechados citando as decisões acima.

Fechamento: escreva a carta da sessão 1 no plano, logo abaixo deste prompt (modelo "Carta de sessão"),
commit e push, e responda ao Vicente em até 5 linhas, com a decisão primeiro. Workflow só com o custo
projetado e aprovado por ele; a 75% estimados não comece passo novo.
```

## Sessão 1 — Escopo e PRISMA-S — 30/10/2026

```
Objetivo: mapear os 22 itens do PRISMA-ScR contra a trilha do scoping (DEBT-055) e assimilar os 16
  enunciados oficiais do PRISMA-S, com falsificação e remapeamento (DEBT-128).
Entrada: decisões do Vicente — perguntas 1, 3–9 e 12 "sim para todas" (29/10); "se existe metodologia,
  vamos assimilar" (17/10) e "só metodologia validada cientificamente" (29/10).
Saída verificável: check_standard_coverage do PRISMA-ScR sem omissão silenciosa; prisma-s.json com
  titulos_oficiais: true; falsificador acusando S11 e S13 antes do remapeamento e nada depois — ou o achado
  da falta de poder; suíte verde, build em dia, audit_system_debt válido; DEBT-055 e DEBT-128 fechados.
Modelo e esforço: Opus 5.5 · max · sem ultracode
Tokens na abertura: 17% a 20% da janela de 5h (--agora, piso; 1,94 M ponderado, 0,81 M deste chat e o resto
  do projeto Cultura Líquida) · subagentes: 0 · projeção: 40–60%, só inline.
--- fechamento ---
Tokens no fechamento: 71% a 86% (--agora, piso; 8,13 M ponderado) · medido: principal 4,82 M ponderado
  (198 mil de saída), subagentes 0; o Cultura Líquida somou 3,31 M na mesma janela. Esta sessão: ~4,0 M
  (~39% de uma janela). Medido já no limiar de 75%: depois disso, só o fechamento.
Feito:
- DEBT-128 RESOLVIDO. prisma-s.json com os 16 tópicos, enunciados e seções oficiais, de duas fontes lidas
  por inteiro e conferidas por script, sem divergência (checklist do OSF y765x e Tabela 1 do artigo de
  2021); fonte no version_source; titulos_oficiais: true. Controle positivo ANTES do remapeamento, pela tool:
  com_poder true, 14/16 e 2 suspeitos (F2.1.3.1→S12, F4.2.2→S16) — NÃO acusou S11 nem S13. Dos 70 pares
  antigos, 58 mudaram no remapeamento e ele viu 2: sem poder → DEBT-149. Remapeamento contra os enunciados
  e o E&E do artigo: covered_by e a coluna "Item PRISMA-S" da spec do prisma-sr (inverso exato, com teste
  que reprova divergência); skill prisma-s-logging e agente librarian na numeração oficial. Depois: zero
  suspeito, 9/16; lacunas declaradas — 2, 7, 9, 10 e 12 parciais; 11 (prior work) e 14 (peer review) sem
  campo na trilha.
- DEBT-055 RESOLVIDO. Os 22 itens do PRISMA-ScR mapeados contra a trilha do scoping, lendo o checklist
  oficial, com o enunciado gravado: 14 com correspondência, 8 [NÃO COBERTO] (3, 6, 10, 11, 13 e 22 parciais;
  12 e 16 condicionais, "If done"). check_standard_coverage: orphans [] — sem omissão silenciosa. Fração
  12/22 e valid false só porque a falsificação contesta 4 pares que a leitura confirma (falsos positivos,
  no DEBT-149).
- Achados novos: DEBT-149 (falsificador sem poder no PRISMA-S e com falsos positivos no PRISMA-ScR;
  com_poder sai só de titulos_oficiais — DECISAO_PESQ); DEBT-150 (itens 12 e 16 do PRISMA-ScR à espera do
  item condicional; depende do DEBT-142); DEBT-151 (o template de protocolo do scoping dá outro sentido a
  F1.3.1.2, F1.3.1.3 e F0.3.4, e o Contexto do PCC não tem subitem; depende do DEBT-142). O DEBT-145 passou
  a depender também do DEBT-149: com "mapeamento contestado" como trava, o scoping seria recusado por falso
  positivo.
Verificação: suíte 372/372 em 33 arquivos (era 361/32: +10 em tests/prisma_s_scr_oficial.test.ts, +1 em
  cobertura_verificavel); build ok (tsc); audit_system_debt válido — 151 achados (56 abertos, 4 em curso,
  75 resolvidos, 16 recusados). validate_methodology segue reprovando os dois métodos pelo DEBT-003
  (RV-03/04/06/07 sem gate), de antes desta sessão.
Commit: d52c22a (o trabalho) + o commit desta carta; push para origin/reorg/agentic-layer.
Decisões do Vicente registradas: nenhuma nova — executadas as de 17/10 e 29/10, citadas nas resoluções.
Para o acompanhamento: o DEBT-149 pede decisão — dar poder à falsificação (comparar o enunciado?
  equivalências por padrão? controle positivo por padrão para afirmar com_poder? registrar o suspeito lido e
  descartado?) e se a trava do DEBT-145 usa contestação ou só omissão. A barra de status ainda não gravou
  ~/.claude/uso_atual.json (o --agora segue sem leitura do painel). O MANIFESTO_conformidade.md (retrato de
  24/09) cita o PRISMA-S nas linhas do RV-07 e do RV-08 pela numeração antiga; é histórico, não foi mexido.
Próxima sessão: 2 — Declarações por método (DEBT-142, DEBT-094, DEBT-008); DEBT-150 e DEBT-151 esperam o
  DEBT-142.
```

**Conferência do acompanhamento (30/10/2026) — aceita.** Refeito, não lido da carta: suíte 372/372 em 33
arquivos; build ok; `audit_system_debt` válido, 151 achados (56/4/75/16); DEBT-055 e DEBT-128 resolvidos citando
as decisões; `prisma-s.json` com `titulos_oficiais: true`; `check_standard_coverage`: PRISMA-S válido, 9/16 nos
dois métodos; PRISMA-ScR com `orphans: []` (nenhuma omissão silenciosa), 12/22 e `valid: false` pelos 4 falsos
positivos, que a leitura da norma confirma como falsos (data da busca e busca manual são do item 7,
financiamento do estudo é dado do item 11, `title_abstract_excluded` é seleção, item 14). Consequência que pesa
na decisão: a `prisma-rigor-gates` (SKILL.md:56) faz `valid=false` bloquear a declaração do checklist completo na
F8, e os dois projetos de escopo pararão ali até o DEBT-149. **Decisão do Vicente sobre o DEBT-149:** a
conferência automática do mapeamento passa a dizer a verdade sobre o que enxerga e é melhorada na mesma sessão
(redação precisa no achado, conferida por ele em 31/10) — vira a sessão 2b, depois do núcleo do DEBT-142.

## Sessão 2a — prompt de abertura

Preparado no chat de acompanhamento em 30/10/2026. Cole num chat novo, ajuste o seletor pela primeira linha e
apague-a antes de enviar:

```
>>> APAGUE ESTA LINHA ANTES DE ENVIAR — seletor: Opus 5.5 · esforço max · sem ultracode <<<
Sessão 2a do .claude/maintenance/PLANO_sessoes_2026-10-29.md — Declarações por método, o núcleo.
Modelo e esforço: Opus 5.5, max, sem ultracode (anote na carta).

Este é o chat da sessão 2a: execute só ela. Decisões, dúvidas e a próxima sessão ficam no chat de
acompanhamento. Furo do plano (algo que este prompt e o plano não decidem): registre pela tool, feche o passo
com segurança e pare com "FURO DO PLANO — levar ao acompanhamento", em até 3 linhas.

Abertura, conferindo e não lembrando: leia neste plano o "Como trabalhar", a carta e a conferência da sessão 1
e a seção da sessão 2a; rode a suíte (npx vitest run em reviewbr/reviewbr-mcp), git status, python
.claude/maintenance/medir_esforco.py --agora e audit_system_debt (devolve ~150 mil caracteres: leia por script
só valid, counts e os achados desta sessão). Não pergunte ao Vicente a porcentagem de uso.

Já decidido, não perguntar de novo (Vicente, 17/10/2026, confirmado "ok"): "cada metodologia com as suas
regras"; método que aplica partes de outro é método único; o item que depende da pesquisa: "o método declara a
condição, o projeto responde". E "assimilar só metodologia validada cientificamente" (29/10).

Escopo — o núcleo do DEBT-142 (leia a "LEITURA PARA EXECUÇÃO" no context dele):
1. O mapeamento padrão → subitens e as declarações [NÃO COBERTO]/[NÃO SE APLICA] passam a ser POR MÉTODO; o
   arquivo do padrão (.claude/standards/<id>.json) guarda só a norma (itens, títulos, enunciados, versão).
2. Item condicional: o método declara o item com a sua condição; o projeto responde, com a resposta gravada
   por tool como decisão do pesquisador (o caminho do record_researcher_decision, DEBT-143), nunca digitada
   pelo agente; com a condição falsa, o item sai do denominador.
3. Primeiros usos do mecanismo: o DEBT-150 (itens 12 e 16 do PRISMA-ScR, "If done") e o DEBT-008 — declarar
   na F7.3 do prisma-sr que a certeza da evidência é [NÃO COBERTO] por tool, tirar da prisma-rigor-gates o gate
   de "certeza (GRADE/CERQual)", que não existe, e fazer da escolha GRADE / CERQual / não se aplica um item
   condicional; a assimilação de GRADE e CERQual vai à fila como METODOLOGIA_NOVA.
Não é desta sessão: o falsificador (DEBT-149, sessão 2b) e o scoping como método completo, com o RAISE 3
(DEBT-142 ponto 2, DEBT-151 e DEBT-094, sessão 2c).

Armadilhas já conhecidas:
1. Mudar ONDE o mapeamento mora não pode mudar O QUE ele diz. Antes de mexer, grave a saída do
   check_standard_coverage de cada padrão assimilado, por método (standardId "" lista os padrões); depois da
   migração ela tem de sair idêntica, salvo o que esta sessão muda de propósito, listado item a item.
2. Os 4 suspeitos do PRISMA-ScR são falsos positivos do falsificador (DEBT-149, sessão 2b): não mexa no
   mapeamento para calá-los. O valid: false do PRISMA-ScR continua até a 2b.
3. Não toque nos projetos de pesquisa em reviewbr/projects/. Teste em repositório de brinquedo, inclusive o
   caso do DEBT-142: dois métodos de trilhas diferentes declarando o mesmo padrão, sem um quebrar o outro.
4. O validate_methodology reprova os dois métodos pelo DEBT-003, de antes; não é desta sessão.
5. Toda alteração passa pelo gate RV-11 (validate_system_change, com addresses) e todo achado pela tool,
   nunca pelo JSON à mão.

Saída verificável: o arquivo do padrão sem covered_by, nao_coberto e nao_se_aplica, e o mapeamento e as
declarações lidos do método; check_standard_coverage idêntico antes e depois, salvo as mudanças deliberadas,
listadas; item condicional respondido pelo projeto e fora do denominador quando a condição é falsa, com teste;
o teste dos dois métodos no repositório de brinquedo; DEBT-142 (núcleo) e DEBT-150 resolvidos; DEBT-008 com a
declaração feita e a assimilação na fila; suíte verde, build em dia, audit_system_debt válido.

Divisão: se a projeção passar de 75% da janela antes do item 3, feche com a carta no fim do item 2 — o item 3
passa para a abertura da 2b.

Fechamento: escreva a carta da sessão 2a no plano, logo abaixo deste prompt (modelo "Carta de sessão"),
commit e push, e responda ao Vicente em até 5 linhas, com a decisão primeiro. Workflow só com o custo
projetado e aprovado por ele; a 75% estimados não comece passo novo.
```

## Sessão 2a — Declarações por método, o núcleo — 30/10/2026

```
Objetivo: mapeamento e declarações [NÃO COBERTO]/[NÃO SE APLICA] por método e o item condicional
  (DEBT-142, núcleo); primeiros usos do mecanismo (DEBT-150, DEBT-008) se a janela permitisse.
Entrada: decisões do Vicente de 17/10 ("cada metodologia com as suas regras"; "o método declara a
  condição, o projeto responde") e de 29/10 ("só metodologia validada cientificamente").
Saída verificável: padrões sem covered_by/nao_coberto/nao_se_aplica e mapeamento lido do método;
  check_standard_coverage idêntico antes e depois, salvo o deliberado; condicional respondido pelo
  projeto e fora do denominador, com teste; dois métodos no repositório de brinquedo; suíte verde,
  build em dia, audit_system_debt válido.
Modelo e esforço: Opus 5.5 · max · sem ultracode
Tokens na abertura: 12% a 15% (--agora, piso; 1,41 M ponderado, quase todo do Cultura Líquida) ·
  subagentes: 0 · projeção: 60–80%, só inline.
--- fechamento ---
Tokens no fechamento: 81% a 98% (--agora, piso; 9,32 M ponderado) · medido: principal 4,53 M ponderado
  (180 mil de saída), subagentes 0; o Cultura Líquida somou ~4,8 M na mesma janela, em paralelo.
  Medido em 72–88% com os itens 1 e 2 prontos e testados: pela regra de DIVISÃO, o item 3 passou à
  abertura da 2b, e depois disso só se fechou o item 2.
Feito:
- DEBT-142 RESOLVIDO (núcleo). (1) .claude/standards/*.json só com a norma — o leitor RECUSA padrão
  com mapeamento dentro; mapeamento e declarações em .claude/methodologies/<método>/conformance/
  <padrão>.json (src/services/method_mapping.ts): prisma-sr com prisma-2020, prisma-s e prisma-p; o
  scoping com prisma-scr e a sua cópia do prisma-s. Migração por script, conferida item a item; a nota
  de cada padrão foi dividida entre norma e mapeamento sem perder texto. (2) Item condicional: o
  manifest declara 'condicoes' (id, pergunta, etapa, opcoes); a linha do mapeamento, 'condicao'
  {id, aplica_se}; o projeto responde por record_researcher_decision (condicao + resposta +
  contribuição, carimbo recusado), e a resposta NÃO destrava a etapa; check_standard_coverage ganhou
  projectPath — resposta fora de aplica_se tira o item do denominador como [NÃO SE APLICA], com motivo
  e data; sem resposta, conta como declarado e é avisado. validate_methodology confere mapeamento e
  condições; scaffold_methodology cria o esqueleto do mapeamento. Os 6 agentes da trilha e as skills
  conduct-review, methodology-router, prisma-rigor-gates e synthesis-manuscript apontam o mapeamento
  no método e o projectPath.
- check_standard_coverage antes × depois, 15 relatórios e 15 checklists (.claude/maintenance/sessao_2a/:
  retrato_antes.json, retrato_depois.json, diff_antes_depois.txt; scripts retrato_cobertura.mjs e
  compara_retratos.mjs): IDÊNTICO em todo par padrão × método que o declara — 16/42, 12/26, 9/16 e
  9/16, 12/22, como antes. Mudanças deliberadas, uma a uma: (a) três campos novos por método:
  mapeamento, declaracoes, condicionais; (b) o texto do 'limite'; (c) a nota de cada padrão dividida —
  o checklist ganha a linha "Nota sobre o mapeamento (<método>)"; (d) método que NÃO declara o padrão
  deixa de ser conferido com o mapeamento de outro — prisma-2020 e prisma-p contra o scoping e
  prisma-scr contra o prisma-sr passam de 16/42, 12/26 e 12/22 a 0/N; (e) o checklist do prisma-s sem
  método escolhido recusa, porque dois métodos o declaram, e pede projectPath ou methodologyId; (f) a
  mensagem de padrão ilegível passa a dizer "ou com mapeamento dentro".
- DEBT-151 atualizado: carrega o ponto (2) do DEBT-142 (scoping como método único, sem extends) até a
  2c. Achado novo: DEBT-152 (agentes e conduct-review ainda dizem que o PRISMA-S tem títulos fora da
  fonte e que o PRISMA-ScR não tem mapeamento — frase velha desde a sessão 1, não mexida).
- NÃO FEITO, pela divisão: o item 3 — DEBT-150 (itens 12 e 16 do PRISMA-ScR condicionais) e DEBT-008
  (F7.3 declarada [NÃO COBERTO] por tool, gate de "certeza (GRADE/CERQual)" tirado da
  prisma-rigor-gates, escolha GRADE / CERQual / não se aplica como condicional, assimilação na fila).
  Seguem ABERTOS; o DEBT-150 já não está bloqueado. O mecanismo está pronto e testado para eles.
Verificação: suíte 393/393 em 34 arquivos (era 372/33: +17 em tests/declaracao_por_metodo.test.ts,
  +4 nos testes ajustados); build ok (tsc); audit_system_debt válido — 152 achados (56 abertos, 4 em
  curso, 76 resolvidos, 16 recusados); validate_methodology segue reprovando os dois métodos só pelo
  DEBT-003, de antes; nenhum projeto de reviewbr/projects/ tocado.
Commit: ver git log ("sessão 2a") — push para origin/reorg/agentic-layer.
Decisões do Vicente registradas: nenhuma nova — executadas as de 17/10 e 29/10, citadas na resolução.
Para o acompanhamento: (1) a 2b abre pelo item 3 da 2a; com o falsificador estimado em ~100% de uma
  janela, talvez caiba dar ao item 3 sessão própria. (2) Ao declarar a condição dos itens 12 e 16 do
  scoping, escolher a etapa em que o método a pergunta: a F6, onde a avaliação crítica estaria, está
  desligada no scoping, e a spec dele põe o "charting de qualidade opcional" na F5.
Próxima sessão: 2b — começa pelo item 3 da 2a (DEBT-150, DEBT-008), depois o falsificador (DEBT-149).
```

**Conferência do acompanhamento (30/10/2026) — aceita.** Refeito, não lido da carta: suíte 393/393 em 34
arquivos; build em dia (nenhum arquivo de `src/` mais novo que o `dist/`); `git status` limpo e igual ao origin;
`.claude/standards/` sem `covered_by`, `nao_coberto` nem `nao_se_aplica`; `sessao_2a/retrato_cobertura.mjs`
rodado de novo contra o dist de hoje: 0 diferença do `retrato_depois.json` da sessão; `audit_system_debt`
válido, 152 achados (56/4/76/16); nenhum arquivo de `reviewbr/projects/` alterado desde a abertura da 2a; os
testes do condicional e dos dois métodos estão em `tests/declaracao_por_metodo.test.ts`. A divisão veio da
janela da conta, não do custo da sessão: a 2a gastou 4,5 M (≈ 40–48%), e o outro projeto aberto na mesma
janela, outro tanto. As duas questões da carta, decididas pelo acompanhamento:
1. **O item 3 ganha sessão própria, a 2b**, com o DEBT-152 (curto, e do mesmo assunto: o que agentes e skills
   dizem dos padrões). O falsificador sozinho ocupa uma janela e passa à 2c; o escopo completo, à 2d. DEBT-149
   e DEBT-151 reagendados pela tool.
2. **A condição é perguntada na F1, o protocolo** — a da avaliação crítica do escopo (DEBT-150) e a da
   abordagem de certeza do prisma-sr (DEBT-008). Fazer ou não avaliação crítica, e com que abordagem avaliar a
   certeza, é método, decidido a priori como tudo o que o protocolo trava (RV-01); perguntar na F5 seria
   decidir depois de ver os dados, e a F6 está desligada no escopo. Com "sim", onde a trilha do escopo registra
   a avaliação é da 2d. Gravado no DEBT-150 e no DEBT-008.

Junto com esta conferência, a barra de status foi retirada (§Tokens, regra 1): nunca rodou no Antigravity.

## Sessão 2b — prompt de abertura

Preparado no chat de acompanhamento em 30/10/2026. Cole num chat novo, ajuste o seletor pela primeira linha e
apague-a antes de enviar:

```
>>> APAGUE ESTA LINHA ANTES DE ENVIAR — seletor: Opus 5.5 · esforço max · sem ultracode <<<
Sessão 2b do .claude/maintenance/PLANO_sessoes_2026-10-29.md — Itens condicionais em uso.
Modelo e esforço: Opus 5.5, max, sem ultracode (anote na carta).

Este é o chat da sessão 2b: execute só ela. Decisões, dúvidas e a próxima sessão ficam no chat de
acompanhamento. Furo do plano (algo que este prompt e o plano não decidem): registre pela tool, feche o passo
com segurança e pare com "FURO DO PLANO — levar ao acompanhamento", em até 3 linhas.

Abertura, conferindo e não lembrando: leia neste plano o "Como trabalhar", a carta e a conferência da sessão 2a
e a seção da sessão 2b; rode a suíte (npx vitest run em reviewbr/reviewbr-mcp), git status, python
.claude/maintenance/medir_esforco.py --agora e o audit pelo script da 2a — node
.claude/maintenance/sessao_2a/le_audit.mjs DEBT-150,DEBT-008,DEBT-152 (FULL=1 traz o texto inteiro) —, que
imprime só valid, counts e os achados pedidos. Não pergunte ao Vicente a porcentagem de uso.

Já decidido, não perguntar de novo: "cada metodologia com as suas regras" e, para o item que depende da
pesquisa, "o método declara a condição, o projeto responde" (Vicente, 17/10/2026, confirmado "ok"); "assimilar
só metodologia validada cientificamente" (29/10). E pelo acompanhamento, na conferência da 2a: a condição é
perguntada na F1, o protocolo — fazer ou não avaliação crítica, e com que abordagem avaliar a certeza, é
método, decidido a priori (RV-01); perguntar na F5 seria decidir depois de ver os dados, e a F6 está
desligada no escopo.

Escopo — os primeiros usos do item condicional do DEBT-142, que a 2a deixou pronto e testado:
1. DEBT-150, no scoping-prisma-scr: o manifest declara a condição "avaliação crítica das fontes incluídas"
   (etapa F1; sim / não), e as linhas dos itens 12 e 16 do PRISMA-ScR, no mapeamento do método, passam a
   depender dela. Com "não", saem do denominador; com "sim", apontam o subitem da trilha que registra a
   avaliação, se existir, ou ficam [NÃO COBERTO] com o motivo. Não ligue a F6 nem crie subitem: onde o
   escopo registra a avaliação é da sessão 2d.
2. DEBT-008, no prisma-sr: declarar na F7.3 que a certeza da evidência é [NÃO COBERTO] por tool (o agente
   propõe, o pesquisador decide); tirar da prisma-rigor-gates (SKILL.md:31) a "certeza (GRADE/CERQual)",
   que nenhum gate confere; declarar a condição "abordagem de certeza" (etapa F1; GRADE / CERQual /
   nenhuma). A assimilação de GRADE e CERQual fica no DEBT-008, aberto, para as sessões 7+.
3. DEBT-152: tirar dos 6 agentes e da conduct-review os dois exemplos datados (PRISMA-S "fora da fonte",
   PRISMA-ScR "sem mapeamento"), mantendo a regra.
Não é desta sessão: o falsificador (DEBT-149, sessão 2c) e o escopo como método completo, com o RAISE 3
(DEBT-151 e DEBT-094, sessão 2d).

Armadilhas já conhecidas:
1. A resposta só tira item do denominador onde a FONTE faz o item depender dela. Antes de ligar a condição
   de certeza a algum item, leia na fonte oficial os itens 15 e 22 do PRISMA 2020 e o 17 do PRISMA-P
   (checklist e explicação e elaboração). Item que vale sempre (relatar o método, ou que não houve) fica no
   denominador como o método o declara, e a leitura vai citada na resolução. Fonte que não decide: FURO DO
   PLANO.
2. Não remapeie o PRISMA 2020: os ponteiros dos itens 14 e 15 estão deslocados e declarados assim (DEBT-045,
   sessões 7+). Se a condição tiver de entrar numa linha deslocada, entre sem mexer nos ponteiros, e diga.
3. Mudar a declaração não pode mudar o resto: grave o check_standard_coverage de cada padrão, por método,
   antes e depois (sessao_2a/retrato_cobertura.mjs e compara_retratos.mjs chamam o dist recompilado; a tool
   MCP deste chat roda o dist da abertura). O diff só traz o deliberado, listado item a item; os retratos
   ficam no repositório e citados na carta.
4. Os 4 suspeitos do PRISMA-ScR são falsos positivos do falsificador (DEBT-149, sessão 2c): não mexa no
   mapeamento para calá-los. O valid: false do PRISMA-ScR continua até a 2c.
5. Não toque nos projetos de pesquisa em reviewbr/projects/; teste em repositório de brinquedo. Os dois
   projetos de escopo vão precisar responder a condição da F1 pela tool — é do pesquisador, no chat de cada
   projeto: anote na carta.
6. O validate_methodology reprova os dois métodos pelo DEBT-003, de antes; se a declaração da F7.3 somar
   reprovação da mesma classe, anote, sem consertar o DEBT-003.
7. Toda alteração passa pelo gate RV-11 (validate_system_change, com addresses) e todo achado pela tool,
   nunca pelo JSON à mão.

Saída verificável: no brinquedo, a condição da avaliação crítica respondida — "não" tira 12 e 16 do
denominador; "sim" e sem resposta os mantêm como o método declara —, com teste; F7.3 declarada [NÃO COBERTO]
por tool; prisma-rigor-gates sem a certeza que nenhum gate confere; condição de certeza declarada, com o
efeito no denominador que a fonte manda, citada; check_standard_coverage antes × depois só com o deliberado;
agentes e conduct-review sem as frases velhas; DEBT-150 e DEBT-152 resolvidos; DEBT-008 aberto, com a
declaração feita; suíte verde, build em dia, audit válido.

Divisão: se a projeção passar de 75% da janela antes do item 3, feche no fim do item 2 — o DEBT-152 vai para
a sessão 6, que reescreve agentes e skills.

Fechamento: escreva a carta da sessão 2b no plano, logo abaixo deste prompt (modelo "Carta de sessão"),
commit e push, e responda ao Vicente em até 5 linhas, com a decisão primeiro. Workflow só com o custo
projetado e aprovado por ele; a 75% estimados não comece passo novo.
```

## Sessão 2b — Itens condicionais em uso — 31/10/2026

```
Objetivo: os primeiros usos do item condicional do DEBT-142 — avaliação crítica no escopo (DEBT-150) e
  abordagem de certeza no prisma-sr (DEBT-008, a parte de declarar) — e tirar dos agentes e da
  conduct-review as frases velhas (DEBT-152).
Entrada: mecanismo do DEBT-142 pronto e testado (2a); decisões de 17/10 ("o método declara a condição, o
  projeto responde"), de 29/10 ("só metodologia validada cientificamente") e do acompanhamento na
  conferência da 2a (a condição é perguntada na F1, o protocolo).
Saída verificável: no brinquedo, "não" tira 12 e 16 do denominador, "sim" e sem resposta os mantêm, com
  teste; F7.3 declarada [NÃO COBERTO] por tool; prisma-rigor-gates sem a certeza; condição de certeza com
  o efeito que a fonte manda, citada; check_standard_coverage antes × depois só com o deliberado; agentes
  e conduct-review sem as frases velhas; suíte verde, build em dia, audit válido.
Modelo e esforço: Opus 5.5 · max · sem ultracode
Tokens na abertura: 1% a 2% (--agora, piso; 0,16 M ponderado) · subagentes: 0 · projeção: 40–60%, só inline.
--- fechamento ---
Tokens no fechamento: 30% a 37% (--agora, piso; ~3,5 M ponderado) · medido: principal ~3,1 M ponderado
  (~110 mil de saída), subagentes 0. Sem divisão: 22% a 26% antes do item 3.
Feito:
- DEBT-150 RESOLVIDO. O manifest do scoping-prisma-scr declara a condição 'avaliacao_critica' (F1;
  sim / não); no mapeamento do método, as linhas 12 e 16 do PRISMA-ScR dependem dela (aplica_se: sim),
  com covered_by vazio e [NÃO COBERTO] cujo motivo diz que, com "sim", a trilha do escopo não tem onde
  registrar a avaliação — onde registrar é do DEBT-151 (2d). F6 não ligada, subitem não criado, nenhum
  código mudado.
- DEBT-008, parte 1 (declarar) — segue ABERTO para a assimilação de GRADE e CERQual (7+). A F7.3 da spec
  do prisma-sr declara a certeza [NÃO COBERTO] por tool (o agente propõe, o pesquisador decide); a
  prisma-rigor-gates não lista mais a "certeza (GRADE/CERQual)" como gate; o manifest do prisma-sr
  declara a condição 'abordagem_certeza' (F1; GRADE / CERQual / nenhuma). Lida a fonte
  (sessao_2b/fontes_certeza.md, trechos verbatim conferidos por confere_citacoes.mjs, com URL e SHA-256):
  os itens 15 e 22 do PRISMA 2020 valem para toda revisão sistemática (E&E n160: elemento essencial sem
  "If…" se relata em todas) e o 17 do PRISMA-P manda declarar a falta com o motivo (E&E g7647) — a fonte
  decide, e decide que a resposta NÃO tira item do denominador: nenhuma linha do mapeamento recebe a
  condição. Junto, por ser a mesma declaração: a conduct-review deixou de dizer que toda resposta a
  condição decide itens do padrão ("ou nenhum, quando a fonte não os condiciona").
- DEBT-152 RESOLVIDO. Os 6 agentes e a conduct-review sem os exemplos datados (PRISMA-S "fora da fonte",
  PRISMA-ScR "sem mapeamento"); a regra ficou nos 7 arquivos.
- check_standard_coverage antes × depois (sessao_2b/retrato_antes.json, retrato_depois.json,
  diff_antes_depois.txt; o antes saiu idêntico ao depois da 2a): 20 diferenças, todas no prisma-scr do
  escopo e deliberadas — (a) o motivo de 12 e 16; (b) 'condicionais' passa de [] a 12 e 16, sem
  resposta; (c) o aviso de condicional sem resposta; (d) no checklist, as linhas 12 e 16 e a nota do
  mapeamento. Zero diferença em prisma-2020, prisma-p, prisma-s e raise-3, nos dois métodos: a condição
  de certeza não mexe no denominador, como a fonte manda. Fração do escopo segue 12/22, e o valid: false
  segue pelos 4 falsos positivos do DEBT-149.
- Ferramenta de manutenção: retrato_cobertura.mjs e compara_retratos.mjs aceitam DIR= (pasta dos retratos).
Verificação: suíte 400/400 em 35 arquivos (era 393/34: +7 em tests/condicionais_em_uso.test.ts, em
  repositório de brinquedo com as declarações reais, com controle negativo; 1 teste reescrito em
  prisma_s_scr_oficial.test.ts, que fixava 12 e 16 "até o item condicional existir"); build ok (tsc;
  nenhum arquivo de src/ mudou); audit_system_debt válido — 152 achados (54 abertos, 4 em curso, 78
  resolvidos, 16 recusados); validate_methodology segue reprovando os dois métodos só pelo DEBT-003, sem
  reprovação nova; nenhum projeto de reviewbr/projects/ tocado.
Commit: ver git log ("sessão 2b") — push para origin/reorg/agentic-layer.
Decisões do Vicente registradas: nenhuma nova — executadas as de 17/10 e 29/10 e a do acompanhamento (30/10).
Para o acompanhamento:
  (1) Do pesquisador, no chat de cada projeto: os dois projetos de escopo respondem 'avaliacao_critica'
      pela tool (record_researcher_decision). Os dois já passaram da F1 (bebidas_maca_do_coco na F4,
      bebidas_maca_do_coco_global na F5): a resposta de agora vem depois do protocolo, e a contribuição
      deve dizer o que ele decidiu. Até lá 12 e 16 contam como declarados, com aviso.
  (2) Para a 2d (no DEBT-151): a F7.3 da spec-base, lida pelo escopo por extends, cita a condição
      do prisma-sr, que o escopo não declara; o PRISMA-ScR não tem item de certeza — decidir se a F7.3
      vale no escopo.
  (3) Para as 7+ (no DEBT-008): a synthesis-manuscript põe a certeza sob "Se meta-análise"; a fonte a
      pede de toda revisão, e o CERQual é de síntese qualitativa.
Próxima sessão: 2c — falsificador com poder (DEBT-149).
```

**Conferência do acompanhamento (31/10/2026) — aceita.** Refeito, não lido da carta: suíte 400/400 em 35
arquivos; build em dia (a 2b não mexeu em `src/`); `git status` limpo e igual ao origin; retrato do
`check_standard_coverage` refeito contra o dist de hoje: 0 diferença do `sessao_2b/retrato_depois.json`; audit
válido, 152 achados (54/4/78/16); nenhum arquivo de `reviewbr/projects/` alterado desde 30/10 13:58. Com dois
agentes independentes (resultado em `sessao_2c/preparo/resultado_agentes.json`, chaves `fonte` e `diff`): a
leitura de fonte se sustenta — as 4 fontes, baixadas de novo, têm o mesmo SHA-256, os 14 trechos conferem e
cada um está na fonte a que é atribuído, e o PRISMA 2020 não tem regra geral de "não aplicável" que mude a
modelagem; os 9 itens da saída verificável estão cumpridos, e o teste do DEBT-150 cai nas 4 mutações tentadas.
Nenhum defeito novo. Uma MENOR já registrada pela própria 2b (a F7.3 herdada pelo escopo cita a condição do
prisma-sr — DEBT-151, 2d) e cinco notas para a parte 2 do DEBT-008, gravadas nele (a condição de certeza não
tem leitor nem aviso; texto da tool vago para condição sem item; etiqueta [NÃO COBERTO] com dois sentidos;
F7.3.2–4 com "nenhuma"; um teste que passa por construção). **Do pesquisador**, no chat de cada projeto de
escopo: responder `avaliacao_critica` pela tool, com o que o protocolo travado previu.

## Sessão 2c — em preparo (31/10/2026)

Material do acompanhamento, medido por 4 agentes em só leitura: `.claude/maintenance/sessao_2c/preparo/`
(LEIAME.md, scripts e resultado bruto). O que muda o desenho: o falsificador acusa de 3% a 14% dos deslocamentos
plantados, e há classe de erro sem âncora de palavra (o S13); com o controle positivo honesto, a maioria dos
padrões ficará "sem poder" — e hoje "sem poder" é erro (`valid: false`, F8 bloqueada) e zera o fundamento por
etapa. **Decisão pendente do Vicente:** o que "sem poder" faz depois da 2c — avisa (o relatório diz quanto a
conferência enxerga; reprova só a evidência de erro: omissão, suspeito sem explicação, título fora da fonte) ou
reprova (toda revisão para na F8 até haver poder). A decisão de 30/10 ganhou redação precisa, conferida pelo
Vicente em 31/10 e gravada no DEBT-149: "por padrão" quer dizer por norma, e o erro de teste é erro conhecido,
lido no enunciado oficial, nunca escolhido pelo próprio código. Em 31/10 ele também questionou o dicionário
como meio de conferir ("temos de ter alguma solução melhor que dicionário") — o item 4 da decisão volta a ele
com alternativas. Depois, ainda em 31/10, ele pôs em dúvida reverificar metodologia já validada e voltou o
foco para a aplicação, isto é, para o estudo. Daí saiu uma redefinição proposta da 2c: a conferência por
palavras sai da trava e vira ajuda na assimilação, e a transcrição de cada metodologia passa a ser conferida
ao assimilar, por leitura documentada e revisada. Ela está em `REVISAO_decisoes_2026-10-31.md`, parte B, com
duas decisões pendentes. As duas vieram em 05/11 (B1 aprovada; B2, opção (a)), e o prompt está logo abaixo.

## Sessão 2c — prompt de abertura

Preparado no chat de acompanhamento em 05/11/2026 e ajustado à tarde pelas decisões da triagem do backlog. Cole
num chat novo, ajuste o seletor pela primeira linha e apague-a antes de enviar:

```
>>> APAGUE ESTA LINHA ANTES DE ENVIAR — seletor: Opus 5.5 · esforço max · sem ultracode <<<
Sessão 2c do .claude/maintenance/PLANO_sessoes_2026-10-29.md — Conferência do mapeamento: fora da trava, e
leitura documentada.
Modelo e esforço: Opus 5.5, max, sem ultracode; um agente para a segunda leitura independente, aprovado pelo
Vicente (decisão B2, 05/11). Anote na carta.

Este é o chat da sessão 2c: execute só ela. Decisões, dúvidas e a próxima sessão ficam no chat de
acompanhamento. Furo do plano (algo que este prompt e o plano não decidem): registre pela tool, feche o passo
com segurança e pare com "FURO DO PLANO — levar ao acompanhamento", em até 3 linhas.

Abertura, conferindo e não lembrando: leia neste plano o "Como trabalhar" (atenção aos itens 4 e 9: decisão
gravada em forma precisa e no lugar certo; a triagem de 05/11), as "Decisões de 31/10 a 05/11/2026", a carta e a conferência da 2b e as seções da 2c; leia
as partes A e B de .claude/maintenance/REVISAO_decisoes_2026-10-31.md (textos aprovados) e
.claude/maintenance/sessao_2c/preparo/LEIAME.md — mapa feito por agentes em 31/10: confira antes de usar. Rode a
suíte (npx vitest run em reviewbr/reviewbr-mcp), git status, python .claude/maintenance/medir_esforco.py
--agora (régua recalibrada em 05/11) e node .claude/maintenance/sessao_2a/le_audit.mjs
DEBT-149 (FULL=1 para o texto inteiro). Não pergunte ao Vicente a porcentagem de uso.

Já decidido, não perguntar de novo — o DEBT-149 tem a redação precisa (decisão de 05/11, que substitui os
pontos 1 e 4 da de 30/10):
(a) a conferência por palavras deixa de travar o estudo: suspeito dela não torna valid false; o relatório diz
    o que ela é e quanto enxerga, com a medida e a fonte da medida; ela vira ajuda para quem assimila;
(b) a transcrição de cada metodologia é conferida na assimilação, por leitura documentada: cada ponteiro (campo
    da trilha → item da norma) traz o trecho do texto oficial do item que o justifica, e um conferidor testado
    com resposta conhecida confere que o trecho é literal e daquele item;
(c) uma segunda leitura independente, por agente que não vê a primeira nem o mapeamento atual, é comparada com
    ela: onde concordam, vale; as divergências vão ao Vicente;
(d) fica da decisão de 30/10: suspeito examinado registrado (quem, quando, com que trecho), agora na
    assimilação. A trava da escolha de método (DEBT-145) não é desta sessão (D15).
Fechamento (decisão de 05/11, à tarde): o DEBT-149 fecha no item 1; os itens 2 e 3 constroem o procedimento de
assimilação decidido em B1 e B2 e não prendem o fechamento.
Fundamento: A5, A6 e A9 de 31/10 (REVISAO, parte A).

Escopo, em ordem:
1. Tirar da trava. Em standard_coverage.ts, suspeito da conferência (b) deixa de entrar nos erros; valid passa
   a depender de omissão, título da fonte, legibilidade do mapeamento e declarações. O com_poder deixa de
   afirmar capacidade: o relatório diz o que a conferência é e quanto enxerga, citando a medição (data e
   script; a de 31/10 está em sessao_2c/preparo/). O porquê de cada etapa (itens_por_etapa) passa a depender só
   de título oficial. Atualize os textos que mentiriam (premissa e limite em standard_coverage.ts, cabeçalho de
   mapping_coherence.ts, descrição da tool em index.ts) e os consumidores: prisma-rigor-gates (:48-49, :60),
   synthesis-manuscript (:22), analyst (:23, :27), conduct-review (:61), maintainer.md e system-audit. Os 4
   suspeitos do PRISMA-ScR deixam de reprovar sem mexer no mapeamento.
2. A leitura documentada. O schema da linha de mapeamento ganha, por ponteiro, o trecho literal do texto
   oficial do item declarado; o StandardItemSchema guarda o enunciado (text); um serviço confere a literalidade
   (só normalização de espaço), com teste de resposta conhecida: trecho de outro item e trecho alterado
   recusados, trecho literal aceito. Suspeito examinado na assimilação fica registrado no mapeamento (quem,
   quando, com que trecho).
3. Primeira aplicação: o PRISMA-S do prisma-sr (16 itens, cerca de 53 ponteiros), cuja trilha não muda.
   Primeira leitura pela sessão, com os trechos. Segunda leitura por um agente que recebe só os textos oficiais
   do PRISMA-S e os campos da trilha do prisma-sr — sem a primeira leitura e sem o mapeamento atual — e devolve
   o seu mapeamento com trechos, gravado no repositório. Compare: onde as duas concordam, vale (se diferem do
   mapeamento atual, a correção entra, listada na carta); onde divergem, mantenha o atual e liste a divergência
   para o Vicente num arquivo da sessão. Projete o custo do agente na abertura e anote na carta.
Não é desta sessão: o PRISMA-ScR e a cópia do PRISMA-S no escopo (o escopo herda do prisma-sr o que é da revisão
sistemática: DEBT-151, sessão 6, D14 corrigida em 05/11); o PRISMA-P e o PRISMA 2020 (este precisa antes dos
enunciados oficiais e do remapeamento do DEBT-045); a descrição do método do ReviewBR (sessão M); a trava da
escolha de método (DEBT-145, D15).

Armadilhas já conhecidas:
1. O zod remove chave desconhecida: prove com teste que o trecho e o enunciado chegam ao serviço.
2. O com_poder tem hoje dois sentidos (a conferência vale × o título é da fonte): separe antes de mudar, ou o
   porquê de cada etapa some.
3. Testes que fixam o comportamento atual vão mudar — reescrita, não regressão: prisma_s_scr_oficial (bloco SEM
   PODER e os 4 falsos positivos), condicionais_em_uso (12/22 → 14/22), cobertura_verificavel,
   declaracao_por_metodo, trilha_como_dado e mapping_coherence. Texto novo ganha asserção negativa: a frase
   velha não pode passar verde.
4. Independência da segunda leitura: o agente não vê a primeira nem o mapeamento; se vir, a leitura não é
   independente e não vale. Script e agente erram (A5): o conferidor de literalidade só vale como prova depois
   do teste de resposta conhecida.
5. Grave o check_standard_coverage de todo padrão, por método, antes e depois (sessao_2a/retrato_cobertura.mjs
   e compara_retratos.mjs, com DIR= numa pasta da sessão); o diff só pode trazer o deliberado, listado. A tool
   MCP deste chat roda o dist da abertura: confira pelo dist recompilado.
6. O PRISMA 2020 segue valid: false pelos 21 itens esquecidos (DEBT-014): é esperado e não é desta sessão.
7. Não toque nos projetos em reviewbr/projects/; teste em repositório de brinquedo.
8. Toda alteração passa pelo gate RV-11 (validate_system_change, com addresses) e todo achado pela tool, nunca
   pelo JSON à mão. Decisão do Vicente que surgir vai em forma precisa (item 4 do "Como trabalhar").

Saída verificável: suspeito da conferência por palavras não reprova, com teste; relatório sem afirmar
capacidade, com a medida citada; o porquê de cada etapa continua saindo para padrão com título oficial (e passa
a incluir os itens que só estavam fora por suspeito); PRISMA-ScR do escopo valid: true sem mudar o mapeamento;
trecho literal por ponteiro no schema, com o conferidor testado; PRISMA-S do prisma-sr com os trechos, a segunda
leitura independente gravada, as concordâncias aplicadas e as divergências listadas para o Vicente;
check_standard_coverage antes × depois só com o deliberado; DEBT-149 resolvido no item 1, com a proposta da
triagem de 05/11 conferida; suíte verde, build em dia, audit válido.

Divisão: se a projeção passar de 75% da janela antes do item 3, feche no fim do item 2; o item 3 abre a sessão
seguinte, antes da P e da M.

Fechamento: escreva a carta da sessão 2c no plano, logo abaixo deste prompt (modelo "Carta de sessão"), commit
e push, e responda ao Vicente em até 5 linhas, com a decisão primeiro. A 75% estimados não comece passo novo.
```

## Sessão 2c — Conferência do mapeamento: fora da trava (parte 1, item 1) — 05/11/2026

```
Objetivo: tirar da trava a conferência por palavras (DEBT-149, ponto (a) da decisão de 05/11). O
  suspeito dela não reprova; o relatório diz o que ela é e quanto enxerga, com a medida e a fonte; e
  o porquê de cada etapa depende só de título oficial.
Entrada: decisões de 05/11 — B1, B2 e a 3 da triagem (o DEBT-149 fecha no item 1); preparo de 31/10
  (sessao_2c/preparo/), conferido na abertura: as três medidas refeitas deram o mesmo número.
Saída verificável (desta parte):
  - suspeito não reprova, com teste;
  - relatório sem afirmar capacidade, com a medida citada;
  - porquê de cada etapa com os itens que só o suspeito tirava;
  - PRISMA-ScR do escopo valid: true sem mexer nos pares;
  - check_standard_coverage antes × depois só com o deliberado;
  - DEBT-149 resolvido, com a proposta da triagem conferida;
  - suíte verde, build em dia, audit válido.
Modelo e esforço: Opus 5.5 · max · sem ultracode.
  - O aviso automático de "ultracode" saiu da palavra em "sem ultracode" e não foi seguido: nenhum
    workflow.
  - O agente da segunda leitura (B2) não rodou: o item 3 passou à parte 2. Custo projetado: ele
    recebe os 16 enunciados (~2 mil tokens) e os campos da trilha do prisma-sr (~9 mil) e devolve
    ~59 ponteiros com trechos — 0,6 a 1,5 M ponderado, 5% a 15% de uma janela.
Tokens na abertura: 31% a 42% (--agora, piso; 4,18 M ponderado, dos quais 3,12 M de outro projeto na
  mesma janela, gastos antes da abertura) · subagentes: 0 · projeção da sessão: 70% a 110% (plano),
  acima do que restava.
--- fechamento ---
Tokens no fechamento: 56% a 76% (--agora, piso; 7,6 M ponderado, medido antes desta carta) ·
  medido: principal ~4,5 M ponderado (~160 mil de saída), subagentes 0.
Divisão: a sessão fechou no fim do item 1, pela regra da janela (§Tokens, regras 2 e 3).
  - No fim do item 1, o --agora dava 54% a 73%. O item 2, projetado em 2 a 3 M, não cabia com a
    folga de 15%.
  - O prompt previa dividir antes do item 3. Dividiu-se antes do item 2, porque a janela abriu com
    31% a 42% já gastos por outro projeto.
  - O item 1 é o fechamento do DEBT-149; os itens 2 e 3 não o prendem (decisão de 05/11, à tarde).
Feito:
- DEBT-149 RESOLVIDO (item 1), em standard_coverage.ts:
  - O suspeito da conferência por palavras saiu dos erros e da contestação. Vai aos avisos, como
    pedido de leitura a quem assimila.
  - valid depende de: omissão; título fora da fonte (erro próprio, uma vez por padrão); legibilidade
    do mapeamento, o que inclui a conferência (a) — ponteiro para subitem inexistente ou para etapa
    desligada; e declaração dupla.
  - com_poder e motivo_sem_poder saíram. O campo falsificacao virou conferencia_por_palavras
    (quanto_enxerga, medida, pares, suspeitos, não comparados); premissa_da_falsificacao virou
    conferencia_por_palavras (o que ela é); o limite foi reescrito.
  - itens_por_etapa depende só de titulos_oficiais e da conferência (a).
- A medida mora no mapeamento de cada método: campo novo conferencia_por_palavras, no schema
  (method_mapping.ts). Traz data, script, pares medidos, impressão SHA-256 dos pares e as trocas
  e/ou os erros conhecidos. Se o mapeamento muda depois da medida, o relatório diz isso e pede para
  refazê-la. Gravada nos 5 mapeamentos declarados por sessao_2c/grava_medidas.mjs, que confere a
  impressão antes de gravar:
  - PRISMA-S do prisma-sr: 30/885 trocas (3,4%) e 2/58 nos erros reais;
  - PRISMA-P: 284/1.966 (14,4%);
  - PRISMA-ScR: 357/2.730 (13,1%);
  - PRISMA 2020: 15/23 nos erros reais — 3 de destino contestado e 1 incerto; sem eles, 12/19;
  - PRISMA-S do escopo: 30/885, medida em 05/11 por sessao_2c/mede_conferencia_por_palavras.mjs.
  As três de 31/10 (PRISMA-S do prisma-sr, PRISMA-P e PRISMA-ScR) foram refeitas na abertura, com o
  mesmo resultado, e o script de 05/11 as reproduz.
- Textos que mentiriam:
  - cabeçalho de mapping_coherence.ts: o que ela é, quanto enxerga, o que não é;
  - o valid do relatório da conferência por palavras só cai quando não há padrão;
  - docstring de titulos_oficiais; descrição da tool em index.ts; rodapé do checklist, sem a premissa.
- Consumidores:
  - prisma-rigor-gates, Camada 3, inclusive o que torna valid false;
  - synthesis-manuscript, F8, item 4;
  - analyst.md, F8 e ferramentas;
  - conduct-review:61;
  - maintainer.md, tabela de consulta;
  - system-audit, Varredura D: suspeito não é achado.
  Junto, por ser a mesma frase: o analyst passa a chamar a tool com o projectPath, como a
  synthesis-manuscript que ele carrega. Com methodologyId, as respostas do projeto às condições não
  entravam.
- check_standard_coverage antes × depois: sessao_2c/retrato_antes.json (idêntico ao depois da 2b),
  retrato_depois_item1.json e diff_antes_depois_item1.txt. São 195 diferenças, todas deliberadas:
  (a) nos 15 relatórios, falsificacao → conferencia_por_palavras, premissa → o que ela é, e o limite;
  (b) avisos: o dos não comparados reescrito; os suspeitos do PRISMA 2020 e do ScR como pedido de
      leitura;
  (c) o rodapé dos 14 checklists;
  (d) PRISMA 2020: some o erro dos 15 suspeitos; segue valid: false só pelos 21 órfãos (DEBT-014),
      com 16/42;
  (e) PRISMA-ScR do escopo: valid false → true; 12/22 → 14/22; contestados [7, 14] → [];
      itens_por_etapa ganha o 7 (F2, F8) e o 14 (F4, F8); as linhas 7 e 14 do checklist saem sem
      [CONTESTADO]. Pares e declarações do mapeamento do escopo não mudaram: a impressão é 3fc9adca…,
      a da medida de 31/10, com teste; o arquivo ganhou só a medida.
  PRISMA-S, PRISMA-P e RAISE 3: só (a), (b) e (c).
Verificação:
  - Suíte 422/422 em 36 arquivos (era 400/35): +19 testes no arquivo novo
    tests/conferencia_por_palavras.test.ts, +1 em cobertura_verificavel, +2 em prisma_s_scr_oficial.
  - Reescritos, não regressão, os testes que fixavam o comportamento velho: cobertura_verificavel,
    prisma_s_scr_oficial, condicionais_em_uso (12/22 → 14/22 e 12/20 → 14/20) e mapping_coherence.
    declaracao_por_metodo e trilha_como_dado não precisaram mudar.
  - Asserção negativa contra com_poder, SEM PODER, premissa_da_falsificacao e "o sistema falsifica".
  - Mutação (sessao_2c/mutacao_item1.mjs, saída em mutacao_item1.txt): as 5 voltas ao comportamento
    velho derrubam testes — suspeito nos erros (6), suspeito contestando (15), suspeito tirando item
    do porquê (3), medida que nunca envelhece (2), zod removendo a medida (12).
  - Build em dia (tsc). Gate RV-11 aprovado (CORRECAO, addresses DEBT-149).
  - audit_system_debt válido: 153 achados (41 abertos, 2 em curso, 79 resolvidos, 31 recusados).
  - Nenhum arquivo de reviewbr/projects/ alterado.
Commit: ver git log ("sessão 2c, parte 1") — push para origin/reorg/agentic-layer.
Decisões do Vicente registradas: nenhuma nova — executadas a B1(a) e a decisão 3 da triagem (05/11).
Para o acompanhamento:
  (1) A parte 2 (itens 2 e 3) abre numa janela nova, antes da P e da M. O prompt da 2c vale para
      ela, tirando o item 1. O registro do B2 no maintainer.md e na RV-11 fica para lá.
  (2) Escolhas desta sessão, a conferir:
      - A medida mora no mapeamento do método, não no padrão: depende dos pares e dos rótulos do
        método.
      - O PRISMA 2020 ficou só com os erros reais. O plantio de hoje dá 640/5.299 (12,1%), mas o
        mapeamento dele tem ponteiros errados conhecidos (DEBT-045), e plantar a partir deles
        contamina a medida.
      - Os erros de (a) ficaram em "legibilidade do mapeamento".
  (3) Furo previsto para o item 3, a decidir no prompt da parte 2:
      - Se as duas leituras concordarem numa correção do PRISMA-S do prisma-sr, a coluna "Item
        PRISMA-S" da spec do prisma-sr muda junto (teste em prisma_s_scr_oficial).
      - O escopo lê essa spec por extends e guarda a sua cópia do mapeamento, que não é da 2c.
        Copiar a correção para a cópia ou não? O mesmo teste reprova a divergência.
      - A medida do prisma-sr × PRISMA-S terá de ser refeita (mede_conferencia_por_palavras.mjs e
        grava_medidas.mjs). O teste dos mapeamentos reais reprova até lá, de propósito.
  (4) A tool MCP deste chat roda o dist da abertura: o check_standard_coverage do chat mostra o
      comportamento velho até o servidor reiniciar. O dist em disco é o novo.
  (5) Do pesquisador: nada novo. Os dois projetos de escopo deixam de parar na F8 pelos 4 falsos
      positivos. Segue a pendência da 2b: responder avaliacao_critica.
Próxima sessão: 2c, parte 2 (itens 2 e 3); depois, a P.
```

## Sessão 2c — parte 2: leitura documentada (itens 2 e 3) — 06/11 a 08/11/2026

```
Objetivo: construir a leitura documentada (item 2) e aplicá-la ao PRISMA-S do prisma-sr (item 3).
Entrada: a parte 1 (0421dc9); a decisão B2 de 05/11; o "pode seguir" do Vicente em 06/11, neste mesmo
  chat (ele leu 0% da janela de 5h e 50% do semanal).
Saída verificável:
  - trecho literal por ponteiro no schema, com o conferidor testado com resposta conhecida;
  - o PRISMA-S do prisma-sr com os trechos, a segunda leitura independente gravada, as concordâncias
    aplicadas e as divergências listadas para o Vicente;
  - check_standard_coverage antes × depois só com o deliberado;
  - suíte verde, build em dia, audit válido.
Modelo e esforço: Opus 5.5 · max · sem ultracode; um agente, para a segunda leitura, como aprovado em B2.
Tokens na abertura (06/11, 06:10 UTC): 0% da janela de 5h e 50% do semanal, lidos pelo Vicente no
  painel; --agora 4% a 5% (par de calibração) · projeção: 2,5 a 4 M ponderado, agente 0,3 a 0,5 M.
--- fechamento ---
Tokens no fechamento (08/11, 14:00 UTC, outra janela): 26% a 35% (--agora, piso; 3,5 M, dos quais
  1,8 M de outro projeto) · medido: principal ~1,8 M nesta janela; o agente gastou 137 mil tokens
  (notificação: 2 chamadas de ferramenta, 11,6 min). Sem divisão.
Feito:
- Item 2 (commit d7cc06e) — a leitura documentada, no schema e no relatório:
  - o padrão guarda o enunciado oficial (text), que o zod removia;
  - a linha do mapeamento ganha trechos (por ponteiro, o trecho literal do enunciado do item) e
    examinados (o suspeito da conferência por palavras lido na assimilação: quem, quando, rótulo de
    então, trecho);
  - o mapeamento ganha leitura_documentada (quando, quem, onde está o registro);
  - o conferidor (leitura_documentada.ts) aceita só trecho literal — normaliza só o espaço — e do
    item declarado. Trecho recusado reprova, como erro do dado; leitura parcial avisa; suspeito
    examinado sai dos pendentes enquanto o rótulo do subitem não muda;
  - o maintainer.md ganhou o procedimento (leitura documentada, segunda leitura independente,
    divergências ao pesquisador).
- Item 3 — a primeira aplicação, no PRISMA-S do prisma-sr:
  - Entrada da segunda leitura (sessao_2c/segunda_leitura_entrada.md, por prepara_segunda_leitura.mjs):
    os 16 enunciados e os 207 campos da trilha, sem coluna de mapeamento. O script confere que nenhum
    número de item sobra na parte da trilha.
  - A segunda leitura foi independente: a transcrição do agente tem 2 chamadas, o Read da entrada e
    a entrega. Gravada em sessao_2c/segunda_leitura.json por grava_segunda_leitura.mjs, tirada da
    transcrição, com o SHA-256 da mensagem: 37 ponteiros, todos os trechos aceitos.
  - Primeira leitura (sessao_2c/primeira_leitura.json), gravada antes de ver a segunda: 60 ponteiros,
    todos aceitos.
  - Comparação com o mapeamento de 30/10, que tinha 59 ponteiros (compara_leituras.mjs; base presa
    em mapeamento_prisma_s_antes_da_leitura.json): as leituras concordam em 34 ponteiros, e há 22
    correções aplicadas.
    · Saem 13: F2.1.1.3 de S1 e S3; de S8, F1.2.2, F1.2.4, F1.2.6, F1.2.8, F1.2.10, F1.4.1–3 e
      F2.1.2.8; F2.1.2.1 de S12; F3.1.9 de S16.
    · Entram 9: SUP.4 em S1, S3, S4 e S7; SUP.3 em S8, S9, S13 e S15; SUP.5 em S16.
  - 36 divergências (29 de ponteiro, 7 de cobertura) ficaram como em 30/10. Estão para o Vicente,
    por tema, em sessao_2c/divergencias_prisma_s.md: 13 de seções do manuscrito (F8.3), 2 de
    suplemento, 14 de campos de coleta, e 7 coberturas — em 5 itens a segunda leitura julga parcial o
    que o mapeamento declara completo.
  - Resultado: 55 ponteiros, todos com trecho aceito; leitura registrada (06/11). Fração segue 9/16;
    o porquê da F1 deixa de citar o S8.
  - A spec acompanha: 12 linhas F (atualiza_coluna_spec.mjs) e 3 células da tabela de suplementos
    (SUP.2, o próprio checklist, passa a "Todos", como o SUP.1). O teste da coluna passou a cobrir os
    SUP.
  - A cópia do escopo recebeu os mesmos ponteiros, sem trechos (copia_para_escopo.mjs, que conferiu
    antes que ela era cópia do mapeamento de 30/10), por decisão do Vicente (abaixo).
  - A medida da conferência por palavras foi refeita nos dois: 30 de 825 trocas (3,6%), 08/11.
- Dois erros meus, achados e consertados na sessão:
  - a nota do mapeamento dizia "30 ponteiros e 6 coberturas" — são 29 e 7;
  - rodar de novo a comparação contra o mapeamento já corrigido gravou "0 correções". Refeita contra
    a base presa, ela reproduz as 22 correções e as 36 divergências, e o mapeamento é exatamente o
    resultado dela, nos ponteiros e nos trechos.
Verificação:
  - Suíte 440/440 em 37 arquivos (era 422/36 no fim da parte 1): +15 em
    tests/leitura_documentada.test.ts, que tem os testes de resposta conhecida (literal aceito; de
    outro item e alterado recusados; zod) e +3 testes da aplicação; reescritos os que fixavam a medida
    de 31/10, a contagem de 58 (hoje 59, com S1→F2.1.1.3) e a coluna da spec.
  - Mutação (sessao_2c/mutacao_item2.mjs; saída em mutacao_item2.txt): as 9 derrubam testes.
  - check_standard_coverage, item 1 → item 2: 423 diferenças, sem mudar veredito — enunciado nos
    órfãos, examinado por suspeito, leitura_documentada por método, os textos.
  - check_standard_coverage, item 2 → item 3: 99 diferenças, só nos relatórios do PRISMA-S.
  - Diffs em sessao_2c/diff_item1_item2.txt e diff_item2_item3.txt.
  - Gates RV-11: EXTENSAO (item 2, protocolo = este plano) e CONFORMIDADE (item 3, PRISMA-S 2021).
  - audit_system_debt válido (153: 41 abertos, 2 em curso, 79 resolvidos, 31 recusados). Nenhum
    arquivo de reviewbr/projects/ alterado.
Commit: ver git log ("sessão 2c, parte 2") — push para origin/reorg/agentic-layer.
Decisões do Vicente registradas:
  08/11/2026 — a cópia do PRISMA-S no escopo segue as correções da leitura documentada do prisma-sr.
  - O quê: a cópia do mapeamento PRISMA-S do scoping-prisma-scr recebe as mesmas correções de
    ponteiro que a leitura documentada aplicou ao do prisma-sr (13 saem, 9 entram), sem trechos e sem
    leitura documentada própria.
  - Alcance: só os ponteiros dessa cópia. As declarações [NÃO COBERTO] dela não mudam, e o
    PRISMA-ScR não é tocado.
  - Por quê: a trilha do escopo é a spec do prisma-sr lida por extends, e a coluna "Item PRISMA-S"
    dessa spec é a mesma para os dois métodos. Sem a cópia, o agente do escopo leria na spec ponteiros
    que a conferência dele não usa.
  - Consequência: a fração do escopo segue 9/16. A leitura documentada do escopo fica para quando ele
    tiver trilha própria (DEBT-151, sessão 6).
  - Origem: resposta "Copiar os ponteiros (Recomendado)" à pergunta da sessão, em 08/11/2026.
Para o acompanhamento:
  (1) Do Vicente: as 36 divergências, em sessao_2c/divergencias_prisma_s.md.
      - As 13 de seção do manuscrito se decidem de uma vez: a seção F8.3 conta como lugar do relato?
      - Se ele aceitar as 5 coberturas parciais da segunda leitura (S1, S4, S5, S6, S15), cada uma
        vira [NÃO COBERTO] parcial, e a fração do PRISMA-S cai.
  (2) O "na RV-11" da triagem ficou no maintainer.md, como procedimento. O gate validate_system_change
      não exige leitura documentada em mudança de mapeamento; exigir é decisão, não defeito.
  (3) O procedimento está pronto para o PRISMA-P e para o PRISMA 2020. Este precisa antes dos
      enunciados oficiais, que o conferidor exige.
Próxima sessão: P (a porta do backlog).
```

## Sessão P — prompt de abertura

Preparado no chat de acompanhamento em 08/11/2026, depois da conferência da 2c. Cole num chat novo, ajuste o
seletor pela primeira linha e apague-a antes de enviar. O prompt não traz a palavra do modo de orquestração de
agentes: na 2c, ela disparou o aviso do modo mesmo precedida de "sem" (carta da 2c, parte 1).

```
>>> APAGUE ESTA LINHA ANTES DE ENVIAR — seletor: Opus 5.5 · esforço max <<<
Sessão P do .claude/maintenance/PLANO_sessoes_2026-10-29.md — A porta do backlog.
Modelo e esforço: Opus 5.5, max; nenhum subagente nem workflow. Anote na carta.

Este é o chat da sessão P: execute só ela. Decisões, dúvidas e a próxima sessão ficam no chat de
acompanhamento. Furo do plano (algo que este prompt e o plano não decidem): anote na carta, feche o passo com
segurança e pare com "FURO DO PLANO — levar ao acompanhamento", em até 3 linhas. Defeito achado de passagem vai
pela tool, com a "mentira de hoje" (regra do backlog, 05/11).

Abertura, conferindo e não lembrando: leia neste plano o "Como trabalhar" (itens 4 e 9), as "Decisões de 31/10
a 05/11/2026" (a regra do backlog e a decisão 5, de 05/11 à tarde) e a carta da 2c (partes 1 e 2); em
.claude/maintenance/triagem_backlog_2026-11-05/TRIAGEM.md, o teste, a seção "O que a varredura achou" e as
propostas para os achados com destino METODOLOGIA_NOVA; e os §9 a §11 da DIRECAO_ferramenta_que_veste_metodos.md.
Rode a suíte (npx vitest run em reviewbr/reviewbr-mcp), git status, python .claude/maintenance/medir_esforco.py
--agora e node .claude/maintenance/sessao_2a/le_audit.mjs (com os ids e FULL=1 para o texto inteiro). Não
pergunte ao Vicente a porcentagem de uso.

Já decidido, não perguntar de novo:
- Regra do backlog (05/11): o backlog registra só defeito — o que o sistema afirma, exige ou entrega hoje e não
  se sustenta (DIRECAO §9). Metodologia ou norma que falta fica no catálogo; decisão do Vicente vai ao registro
  de decisões, e a agenda, ao plano; problema só futuro não se registra.
- Decisão 5 (05/11): a tool que registra achado passa a recusar o que não traz a "mentira de hoje", e o destino
  METODOLOGIA_NOVA deixa de valer para defeito.

Escopo, em ordem:
1. Destinos. Os 14 achados abertos com destino METODOLOGIA_NOVA têm, pela triagem de 05/11, defeito de hoje (só
   a parte 2 do DEBT-008 é assimilação; a proposta da triagem a tira do achado, mas isso é da sessão que o
   consertar). Para cada um, escolha o destino pelo significado dos destinos no código do backlog e pela sessão
   que o conserta (coluna "Sessão" do TRIAGEM.md), e grave pela tool. Só o destino muda; o resto da proposta da
   triagem fica para a sessão de cada achado (item 9 do "Como trabalhar").
2. A trava de escrita. Na record_system_finding e no serviço que ela chama, achado novo ou atualizado em ABERTO
   ou EM_CURSO passa a exigir a "mentira de hoje": onde o sistema afirma ou exige (caminho relativo à raiz do
   repositório e linha, conferidos no disco: o arquivo existe e tem a linha), o que ele diz ali e o que mostra
   que não se sustenta. Sem isso, a escrita é recusada com mensagem que diz o que falta e cita a regra. Fechar
   achado (RESOLVIDO, RECUSADO) segue exigindo só a resolução. METODOLOGIA_NOVA passa a ser recusado como destino
   de achado aberto; nos fechados segue válido, como histórico. O audit_system_debt lista como aviso, não erro,
   os abertos ainda sem a "mentira de hoje": eles a recebem quando a sessão deles os tocar.
3. Os textos que fabricam o problema. Alinhe à regra as instruções que mandam registrar ausência como achado ou
   tratam destino como escopo: a descrição da record_system_finding em index.ts, a system-audit (SKILL.md), os
   agentes em .claude/agents/, e PASSAGEM.md e PROTOCOLO_revisao_reviewbr.md, se disserem isso. No §11 da DIRECAO,
   que deu 23 achados "travando" por escopo só pelo destino, basta uma nota datada: o destino não define escopo,
   e o teste é o do §9. O documento é histórico; não o reescreva. O maintainer.md foi corrigido em 05/11:
   confira, não refaça.

Armadilhas já conhecidas:
1. Ordem: o item 1 vem antes do item 2. Trocar o destino depois de ligar a trava exigiria agora a "mentira de
   hoje" dos 14. A triagem traz uma para cada, mas é proposta não contestada (A5), e conferi-las não é desta
   sessão.
2. O BacklogWriter mescla antes de validar (DEBT-107): a trava vale para o registro mesclado, e o teste prova
   isso. Testes de resposta conhecida: sem o campo, recusa; arquivo inexistente, recusa; linha além do fim,
   recusa; campo completo, aceita; fechar sem o campo, aceita; METODOLOGIA_NOVA em aberto, recusa; em fechado,
   aceita.
3. Testes que fixam a descrição da tool, o enum de destinos ou o texto de skill e agente vão mudar: reescrita, não
   regressão. Texto novo ganha asserção negativa — a frase velha não pode passar verde.
4. A tool MCP deste chat roda o dist da abertura: confira pelo dist recompilado (node, como o le_audit.mjs).
5. Não toque nos projetos em reviewbr/projects/.
6. Toda alteração passa pelo gate RV-11 (validate_system_change). Decisão do Vicente que surgir vai em forma
   precisa (item 4 do "Como trabalhar").

Saída verificável: nenhum achado aberto com destino METODOLOGIA_NOVA, com cada troca listada na carta; a trava
recusando e aceitando como nos testes de resposta conhecida, e um teste de mutação que a derruba; audit válido,
com o aviso e a contagem dos abertos sem "mentira de hoje"; os textos alinhados, com asserção negativa; suíte
verde e build em dia.

Fechamento: escreva a carta da sessão P no plano, logo abaixo deste prompt (modelo "Carta de sessão"), commit e
push, e responda ao Vicente em até 5 linhas, com a decisão primeiro. A 75% estimados não comece passo novo.
```

## Sessão P — A porta do backlog — 08/11/2026

```
Objetivo: a record_system_finding recusa achado aberto sem a "mentira de hoje" e o destino
  METODOLOGIA_NOVA para defeito; os 14 abertos com esse destino recebem o do conserto; os textos
  que fabricavam o problema ficam alinhados à regra do backlog.
Entrada: a regra do backlog e a decisão 5 (05/11, à tarde); a 2c fechada e conferida (08/11).
  Lidos na abertura: "Como trabalhar" (4 e 9), as decisões de 31/10 a 05/11, a carta da 2c,
  o TRIAGEM.md (o teste, "O que a varredura achou", as propostas dos 14) e a DIRECAO §9–§11.
  Conferido: suíte 440/440 em 37 arquivos, git limpo, audit válido com 14 abertos em
  METODOLOGIA_NOVA.
Saída verificável: a do prompt — nenhum aberto com METODOLOGIA_NOVA, cada troca listada; a
  trava nos testes de resposta conhecida, com mutação que a derruba; audit válido, com o aviso
  e a contagem; textos alinhados, com asserção negativa; suíte verde e build em dia.
Modelo e esforço: Opus 5.5 · max · sem subagente nem workflow.
Tokens na abertura (08/11, ~20:05 UTC): 1% (--agora, piso; 0,15 M ponderado) · o Vicente
  informou 0% da janela de 5h e 84% do semanal (par de calibração) · subagentes: 0 ·
  projeção: 20% a 40% (plano).
--- fechamento ---
Tokens no fechamento: 22% a 30% (--agora, piso; 2,96 M ponderado, medido antes desta carta) ·
  medido: principal ~138 mil de saída, subagentes 0.
Feito:
- Item 1 (commit 6b2b766) — os 14 trocados pela tool, depois do gate RV-11 (CORRECAO). Só o
  destino mudou: compara_backlog.mjs dá 14 campos alterados, todos destino.
  - Critério: o destino diz para onde vai o conserto. O código só listava os valores. O sentido
    de FASE_1 ("parar de mentir") vem do PLANO_usabilidade.md, de 25/09; o de AGENTE_SKILL, do
    nome e do uso de 27/09. A sessão da coluna do TRIAGEM.md desempata.
  - AGENTE_SKILL (3):
    · DEBT-002: a mentira está na prisma-rigor-gates (sessão 3, proposta);
    · DEBT-008: texto de skill, de spec e da descrição de uma tool (a 6, por exemplo);
    · DEBT-060: a prosa e o frontmatter dos agentes (família do DEBT-018; o teste de
      frontmatter é da 6).
  - FASE_1 (11):
    · DEBT-025: dedupe.ts (sessão 4, pergunta 7 de 29/10);
    · DEBT-026: é o item 5 da "Fase 1", e o EXECUCAO_checklist.md, item 12, já pedia esta troca
      em 03/10. A mentira inclui o covered_by do PRISMA 2020 e do ScR, mas o conserto que o
      achado pede hoje é de código; reduzi-lo às declarações é proposta da triagem, da sessão dele;
    · DEBT-030: rastro nas 4 tools do lote (7+, ou a 4);
    · DEBT-039: funde no DEBT-138, que é FASE_1 (sessão 3);
    · DEBT-042: ProtocolGuard (sessão 5, com o DEBT-018 e o DEBT-133);
    · DEBT-058 e DEBT-087: a mesma tool de snowball (sessão 4);
    · DEBT-062 e DEBT-090 (que funde nele): consentimento do BYOS (7+ ou 5);
    · DEBT-071: compute_flow_counts (sessão 3);
    · DEBT-089: retrieve_fulltexts trunca o corpus (7+, com prioridade).
  - O resto da proposta da triagem (enxugar, fundir) fica para a sessão de cada um.
- Item 2 (commit a6bf83b) — a porta:
  - Campo mentira_de_hoje: arquivo, linha, diz, nao_se_sustenta.
  - O BacklogWriter recusa achado que fica ABERTO ou EM_CURSO, olhando o registro já mesclado
    (DEBT-107), sem o campo completo ou sem conferência no disco:
    · caminho relativo e dentro da raiz;
    · o arquivo existe e tem a linha (CRLF contado como no editor).
    A mensagem diz o que falta e cita a regra. METODOLOGIA_NOVA em aberto é recusado; fechar
    exige só a resolução. A mentira se mescla campo a campo: mandar só a linha que andou não
    apaga o resto, nem num fechamento.
  - O audit_system_debt avisa (warnings, sem_mentira_de_hoje) e reprova aberto com
    METODOLOGIA_NOVA.
  - As descrições das duas tools em index.ts e o comentário do destino no schema: o destino
    não define escopo.
  - Limite declarado: a tool não confere que o texto de "diz" esteja na linha.
- Item 3 (commit 1fbe6ad) — os textos:
  - system-audit: achado é só defeito de hoje, com a mentira de hoje; EXTENSAO é o tipo do
    conserto, não "capacidade nunca prometida"; [NÃO COBERTO] declarado não é achado.
  - maintainer.md: a correção de 05/11 (:118-132) conferida e mantida, com asserção. Alinhados
    os resíduos: versão nova de padrão no 1a, destino como agenda no item 6 da rota, furo do
    plano registrado como achado, e o que a tool recusa e a auditoria reprova.
  - DIRECAO §11 e o bloco do DEBT-110 na PASSAGEM: nota datada; o texto histórico ficou.
  - Sem mudança: o PROTOCOLO_revisao_reviewbr.md (o §3.2 fala de defeito achado fora do escopo
    do trabalho) e os outros 7 agentes, que não falam do backlog (com teste).
Verificação:
  - Suíte 474/474 em 38 arquivos (era 440/37): +34 em tests/porta_do_backlog.test.ts. Lá estão
    os 7 testes de resposta conhecida do prompt, o merge, o disco, o aviso, o backlog real e os
    textos. Reescrito, não regressão: o fixture achado() de maintenance_writes.test.ts ganhou a
    mentira de hoje.
  - Mutação (sessao_p/mutacao_porta.mjs; saída em mutacao_porta.txt): as 20 derrubam testes,
    15 no código e 5 nos textos (cada frase velha devolvida).
  - Pelo dist (sessao_p/porta_pelo_dist.mjs): antes do build, 5 dos 8 casos passavam pela porta,
    inclusive a ausência "falta o JBI" com METODOLOGIA_NOVA; depois, os 8 como esperado.
  - audit_system_debt (dist, le_audit.mjs) válido: 153 achados (41 abertos, 2 em curso, 79
    resolvidos, 31 recusados); by_destino FASE_1 23, CONFORM_EXTERNA 12, AGENTE_SKILL 6,
    DECISAO_PESQ 1, DIAGNOSTICO 1. O aviso conta 43 abertos sem a mentira de hoje — todos.
  - Gates RV-11: três, CORRECAO (itens 1, 2 e 3). Build em dia (tsc). Nenhum arquivo de
    reviewbr/projects/ alterado.
Commit: 6b2b766, a6bf83b, 1fbe6ad e o desta carta ("sessão P") — push para
  origin/reorg/agentic-layer.
Decisões do Vicente registradas: nenhuma nova — executadas a regra do backlog e a decisão 5.
Para o acompanhamento:
  (1) Escolhas desta sessão, a conferir:
      - O audit também reprova aberto com METODOLOGIA_NOVA; o prompt pedia só a recusa na
        escrita. Sem isso, edição à mão passaria. Hoje não há nenhum.
      - O critério dos destinos, acima.
      - A mentira de hoje é um lugar só; os outros vão na evidência.
  (2) Os 43 abertos estão sem a mentira de hoje. A primeira escrita de cada um em ABERTO ou
      EM_CURSO pede o campo, inclusive passar a EM_CURSO na abertura de uma sessão; fechar não
      pede. A triagem traz uma proposta para cada, não contestada (A5).
  (3) O plano diz em "Os dois chats" (:253-254) "Diante de um furo do plano, registra o achado"
      — a frase que saiu do maintainer.md. O texto é do acompanhamento.
  (4) A descrição da check_standard_coverage chama o [NÃO COBERTO] de "(fila de manutenção)". Se
      "fila" for o backlog, a frase contraria a regra: item declarado não é achado. Não estava na
      lista do item 3; fica a pergunta.
  (5) O BacklogWriter regrava o arquivo inteiro e muda a ordem das chaves do último achado
      gravado. O dado não muda, mas o diff do git mostra linhas mexidas (no item 1, DEBT-090 e
      DEBT-149). Para conferir uma troca, use sessao_p/compara_backlog.mjs, que compara campo a
      campo.
  (6) A tool MCP deste chat roda o dist da abertura e grava sem a porta até o servidor
      reiniciar. O dist em disco é o novo.
Próxima sessão: M.
```

## Sessão P — conferência do acompanhamento (08/11/2026)

- Conferido, não lembrado: os quatro commits, com push; git limpo; suíte 474/474 em 38 arquivos; audit válido, sem
  METODOLOGIA_NOVA em aberto e com o aviso dos 43 abertos sem a mentira de hoje.
- A porta, conferida à parte pelo dist numa cópia do backlog, com script do acompanhamento e não o da sessão:
  - recusa: aberto sem a mentira; arquivo inexistente; linha além do fim; caminho fora da raiz; METODOLOGIA_NOVA
    em aberto; atualização de aberto sem a mentira;
  - aceita: mentira válida; fechamento sem ela.
- Respostas ao "Para o acompanhamento" da P:
  (1) as três escolhas ficam: o audit reprovar METODOLOGIA_NOVA em aberto; o critério dos destinos; a mentira de
      hoje num lugar só;
  (2) e (5) entraram no item 9 do "Como trabalhar";
  (3) corrigido em "Os dois chats": furo do plano vai à carta;
  (4) "[NÃO COBERTO] (fila de manutenção)", na descrição da check_standard_coverage, quer dizer escopo — o que
      falta construir —, não o backlog. Não é mentira; a palavra pode ficar mais clara quando uma sessão mexer
      nessa descrição;
  (6) este chat de acompanhamento roda o dist antigo: gravar achado por ele passaria sem a porta. Achado novo, daqui
      em diante, por um chat aberto depois de 08/11.

## Sessão M — prompt de abertura

Preparado no chat de acompanhamento em 08/11/2026, depois da conferência da P, e ajustado no mesmo dia pelas
respostas do Vicente sobre D04, D05, D10 e D16. Cole num chat novo, ajuste o seletor pela primeira linha e apague-a
antes de enviar.

```
>>> APAGUE ESTA LINHA ANTES DE ENVIAR — seletor: Opus 5.5 · esforço max <<<
Sessão M do .claude/maintenance/PLANO_sessoes_2026-10-29.md — Método do ReviewBR: descrição.
Modelo e esforço: Opus 5.5, max; nenhum subagente nem workflow. Anote na carta.

Este é o chat da sessão M: execute só ela. As decisões que são o objeto desta sessão (listadas abaixo) o Vicente
toma aqui; as outras, e a próxima sessão, ficam no chat de acompanhamento. Furo do plano (algo que este prompt e o
plano não decidem): anote na carta, feche o passo com segurança e pare com "FURO DO PLANO — levar ao
acompanhamento", em até 3 linhas. Defeito achado de passagem vai pela tool, com a "mentira de hoje".

O que esta sessão é: descrever o método da própria ferramenta como se descreve uma metodologia — objetivo,
fundamentos na filosofia da ciência, princípios, etapas, critérios de validade e limites —, com aprovação do
Vicente seção por seção. Não muda código, skill, agente nem manifest: o que a descrição pedir de mudança no
sistema vai ao plano, como agenda; defeito, pela tool.

Abertura, conferindo e não lembrando: leia neste plano o "Como trabalhar" (itens 4 e 9) e as "Decisões de 31/10 a
05/11/2026" inteiras, inclusive as de 05/11 à tarde e as de 08/11; a parte A de
.claude/maintenance/REVISAO_decisoes_2026-10-31.md (A1 a A9, com os vereditos, e a resposta a "quem verifica o
verificador?"); em .claude/maintenance/revisao_decisoes_2026-10-31/lista_decisoes.md, D01, D07, D09, D14 e D17;
.claude/maintenance/revisao_decisoes_2026-10-31/d07_raise_fontes_2026-11-05.md (a resposta 4); o modo de agir em
.claude/agents/maintainer.md (linhas 14 a 30); e a carta da 2c, parte 2. Rode git status, python
.claude/maintenance/medir_esforco.py --agora e node .claude/maintenance/sessao_2a/le_audit.mjs. Não pergunte ao
Vicente a porcentagem de uso.

O documento: .claude/METODO_ReviewBR.md, novo. As referências a ele em agentes e skills são da sessão 6.

Já decidido — entra no documento como está, em forma precisa e citando a origem; não perguntar de novo:
- A1 a A9 (31/10 a 05/11), no texto aprovado da parte A.
- O princípio de 08/11, já corrigido por ele: o ReviewBR segue o que cada metodologia diz sobre o que é
  obrigatório e o que é opcional, e isso vale para todas; opcional não deixa o protocolo em branco — o protocolo
  registra a escolha conforme os objetivos do projeto de pesquisa; pergunta que o protocolo do método não tem não
  é feita.
- A D14: um método não herda de outro o que é próprio dele, e o ReviewBR não usa o modelo da revisão sistemática
  como espelho do seu modo de trabalhar; o PRISMA não é proibido.
- O D07: todo projeto declara onde e como usou IA e, quando exigido, tudo o que se pede; o RAISE não é norma
  canônica; o mapa de uso de IA das tools é política do próprio sistema para as suas ferramentas.
- A D04, coberta (08/11): a âncora científica e a isenção da ferramenta tratam da metodologia do projeto, onde o
  princípio de 08/11 já diz o mesmo; os fundamentos na filosofia da ciência (A2) são do método da própria
  ferramenta. São camadas diferentes (A3): não há contradição, e não se abre discussão sobre ela.

Para decidir aqui, com o Vicente, em forma precisa (item 4 do "Como trabalhar"):
1. As três perguntas da 2c (decisão de 08/11):
   (a) o que é "cobrir um item da norma" no método do ReviewBR — coletar a informação (campo da trilha), relatá-la
       (seção do manuscrito, suplemento) ou garanti-la por código (o que a ferramenta grava sozinha);
   (b) se a leitura documentada confere a norma também contra o que a ferramenta garante por código e pelos
       invariantes RV, e não só contra os campos da trilha;
   (c) se o gate RV-11 passa a exigir leitura documentada quando um mapeamento muda.
2. D01, D09 e D17, que pesam aqui e ainda estão a conferir: leve a ele a redação proposta de cada um, na lista de
   decisões, antes de usá-los. D05, D10 e D16 não são desta sessão (08/11): só vão a ele se o texto da M tocar
   nesses pontos, com a redação proposta da lista, antes de usá-la.
3. Os princípios que saíram do backlog em 05/11: o alvo da triagem por IA — auditabilidade e variabilidade medida,
   não determinismo (DEBT-101, D01); o modo de agir — o que o sistema garante, o que torna visível e o que não
   protege (DEBT-132, maintainer.md); e a auditoria de protocolo por método (DEBT-134).
4. O critério de credibilidade do D07, redigido pelo acompanhamento: ele o confere aqui.
5. O que o RAISE 3 dá como não aceitável — síntese agêntica de ponta a ponta e síntese de resultados entre
   estudos por LLM — e como o método do ReviewBR fica fora disso: onde o pesquisador decide, e quem sintetiza.
6. Os fundamentos na filosofia da ciência (A2) são leitura e decisão dele. Apresente três ou quatro referências
   candidatas, cada uma com duas ou três linhas neutras, a fonte completa e o que no ReviewBR ela sustentaria; ele
   escolhe. Não escreva a seção antes da escolha dele.

Como trabalhar nesta sessão:
- Uma seção por vez: você propõe o texto, o Vicente aprova ou corrige, e a seção entra no documento com a data e
  a origem. A pergunta a ele define os termos e diz a consequência.
- O que já está decidido entra como está; o que é proposta sua fica marcado como proposta até ele aprovar.
- Não invente fundamento nem cite fonte que você não leu; ao citar uma, dê a referência completa.

Armadilhas já conhecidas:
1. Pôr no documento obrigação que nenhuma metodologia impõe (o DEBT-135 é um caso no sistema).
2. Gravar resposta curta dele como aprovação de texto longo: a aprovação vale para o texto que ele leu.
3. Prometer o que o sistema não cumpre: onde o código ainda não garante, diga, e aponte o achado aberto.
4. Princípio geral fica geral: nada de regra ou exemplo de uma metodologia específica quando a diretriz vale para
   todas (correção dele, 08/11).
5. Não toque nos projetos em reviewbr/projects/ nem no código.

Saída verificável: .claude/METODO_ReviewBR.md com as seções objetivo, fundamentos, princípios, etapas, critérios de
validade e limites, cada uma aprovada pelo Vicente (data e origem); as três perguntas da 2c, D01, D09 e D17
respondidos em forma precisa e gravados no plano; os três princípios do backlog redigidos e aprovados; o critério
de credibilidade conferido; a posição sobre o RAISE 3 escrita; a agenda que surgir, no plano; git limpo e audit
válido.

Divisão: a sessão foi planejada para duas janelas. Se a projeção passar de 75%, feche no fim da seção em curso; a
próxima janela retoma pela carta.

Fechamento: escreva a carta da sessão M no plano, logo abaixo deste prompt (modelo "Carta de sessão"), commit e
push, e responda ao Vicente em até 5 linhas, com a decisão primeiro. A 75% estimados não comece passo novo.
```
