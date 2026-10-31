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
| 2c | Falsificador com poder | DEBT-149 — decisão de 30/10: a conferência automática do mapeamento passa a dizer o que enxerga e é melhorada (redação no achado) | 2b | `com_poder` só com controle positivo plantado; suspeito lido e descartado registrado e fora da reprovação; comparação também com o enunciado, com equivalências português–inglês por padrão; acusa os deslocamentos conhecidos e não acusa os 4 falsos positivos do PRISMA-ScR |
| 2d | Escopo como método completo e RAISE 3 | DEBT-151 (com o ponto 2 do DEBT-142: scoping com spec e mapeamento próprios), 11 (DEBT-094) | 2c | `scoping-prisma-scr` sem `extends`, com o PCC em subitens próprios e o PRISMA-ScR mapeado neles; RAISE 3 declarado como condicional nos métodos que usam IA |
| 3 | Funil e gates | 3 (DEBT-138), 4 (DEBT-070), DEBT-071/043/105 | — | export bloqueia funil divergente; manifests dizem a verdade sobre os gates |
| 4 | Busca e triagem | 5 (DEBT-056), 6 (DEBT-021), 7 (DEBT-025) | — | log PRISMA-S gravado por código; saturação lê o disco; dedup com DOI/acentos e nível 4 só sinalizando |
| 5 | Leitura e governança | 8 (DEBT-031), 9 (DEBT-018), 12 (DEBT-016), DEBT-141 | — | citação com página; trava só pelo `project_state.json`; aviso na tool de `targets`; atualização do catálogo sem apagar campos |
| 6 | Sair do esqueleto PRISMA | DEBT-137 (agentes e skills descritos por F0–F8), DEBT-134 (protocolo exigido de todo projeto), DEBT-136 (tabela de tipos duplicada), tabela F0–F8 do `conduct-review` | sessões 2a–2d | agentes descritos por papel; cada etapa do manifest diz que skill a executa; o que é do `prisma-sr` fica no `prisma-sr` |
| 7+ | O resto da reclassificação | 19 declarações e consertos restantes; assimilação de métodos validados (JBI, GRADE/CERQual, exploratório…) | sessões 1–6 | um bloco por sessão, na ordem do arquivo de reclassificação |
| depois | Fase de testes do sistema e análise do trabalho | sequência decidida pelo Vicente em 27/09 (DEC-42 do `DECISOES_chat_a_conferir.md`); critério de entrada registrado em 03/10 (`DECISOES_2026-10-03.md`), a reconferir ao chegar lá | sessões 1–7+ | a definir |

**Estado:** sessões 0 (29/10/2026), 1, 2a (30/10/2026) e 2b (31/10/2026) fechadas, cada uma com a carta na sua
seção e conferida pelo acompanhamento. A sessão 2 virou quatro: três pela decisão do Vicente sobre o DEBT-149, e
a 2a fechou DIVIDIDA pela regra da janela — o item 3 dela ganhou a 2b; o falsificador é a 2c, e o escopo
completo, a 2d. **2c em preparo:** o material medido está em `sessao_2c/preparo/` (LEIAME.md), e o prompt
espera uma decisão do Vicente — o que "sem poder" faz depois da 2c (seção da 2c, no fim deste arquivo).

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
| 2c | max | não | 100–150% — planejar duas janelas (o preparo de 31/10 achou zod tirando o enunciado, dois sentidos no `com_poder`, PRISMA 2020 sem enunciado e 6 arquivos de teste a reescrever) | o falsificador é o que impede o mapeamento de mentir; precisa provar poder com controle positivo |
| 2d | max | não na execução; revisão independente depois, se aprovada | 60–100% | o escopo vira método completo: spec e mapeamento próprios |
| 3 | max | não | 40–60% | funil e gates: o que o export bloqueia e o que os manifests dizem dos gates |
| 4 | max | não | 40–60% | trilha de auditoria da busca (log PRISMA-S), critério de parada (saturação) e o que a dedup tira |
| 5 | max | não | 40–60% | o DEBT-018 mexe na trava do protocolo, com cuidado de compatibilidade com projetos antigos |
| 6 | max | não na execução; revisão independente depois, recomendada | 70–100%+ — planejar duas janelas | mudança de direção em agentes, skills e manifests: risco de deriva e de quebrar o `prisma-sr` |
| 7+ | high nas 19 declarações; max nos consertos e na assimilação de método validado | só na assimilação, para varrer fontes oficiais, com custo aprovado | um bloco por janela | declarar é mecânico; assimilar é ler norma |
| testes | high para rodar; max para analisar | não | a definir | rodar é conferir; analisar é julgar |
| acompanhamento | high | não | — | conferência e redação curta; o contexto deste chat já é longo e cada volta custa caro |

Uma sessão por janela de 5h, começando com a janela nova; trabalho pesado em outro projeto na mesma janela
reduz o que sobra para a sessão.

## Como trabalhar — para o disco e a sessão não dependerem um do outro

1. **Uma porta de entrada.** Este arquivo e o topo da `ESPECIFICACAO_vestir_metodos.md` dizem o estado; os
   outros documentos de `.claude/maintenance/` são histórico. Sessão nova lê só isso e roda `audit_system_debt`.
2. **Cada sessão tem carta** (modelo abaixo): abre com objetivo, entrada e saída verificável; fecha com o que
   foi feito, testes, commit e a próxima sessão. Sessão sem saída verificável não começa.
3. **Toda sessão termina com commit.** O que não está commitado não existe para a próxima sessão. Nunca mais
   semanas de trabalho só no working tree.
4. **Decisão do Vicente vai ao disco na hora**, pela tool (`record_system_finding` no achado, ou nesta carta),
   **escrita em forma precisa e autoexplicativa**: o que foi decidido, o alcance e a consequência, com os termos
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

### Os dois chats, e como cada sessão abre e fecha

*"este chat vai servir tanto para acompanhar as sessoes antes e ao fechar quanto para tirar duvidas ou registrar
decisoes para as sessoes me ajudando com a criacao do prompt de cada sessao"* (Vicente, 29/10/2026).

- **Chat de acompanhamento.** É o chat que fechou a sessão 0 (aberto em 29/10/2026). Ele prepara o prompt de
  abertura de cada sessão e o grava neste arquivo, na seção da sessão; tira dúvidas; grava no disco, na hora, as
  decisões do Vicente; e, no fechamento, confere a carta (saída verificável, suíte, commit, `audit_system_debt`) e
  prepara a próxima. Não executa sessão. Se ele se perder ou ficar caro demais, qualquer chat novo assume o papel
  lendo este arquivo.
- **Chat da sessão.** Um chat novo por sessão, aberto com o prompt preparado no acompanhamento. Executa só a sua
  sessão, escreve a carta logo abaixo do prompt, commita, faz push e para. Diante de um furo do plano, registra o
  achado, fecha o passo com segurança e devolve o assunto ao acompanhamento.

O ciclo: (1) no acompanhamento, "prepara a sessão N" — o prompt sai em `## Sessão N — prompt de abertura`;
(2) num chat novo, cola-se o prompt; (3) a sessão fecha com a carta; (4) no acompanhamento, "fecha a sessão N" —
confere a carta e prepara a N+1. A sessão começa de preferência numa janela de 5h nova.

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
com alternativas. O prompt da 2c entra aqui quando as duas respostas vierem.
