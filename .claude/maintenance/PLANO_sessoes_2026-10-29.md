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
- **Única decisão que falta:** o que vai ao GitHub (público) no commit da sessão 0.

## Contexto que desfaz ambiguidades: o sistema mudou DURANTE a troca de computador

Registro pedido pelo Vicente em 29/10/2026. A manutenção do ReviewBR não parou durante a troca de PC, e por
isso há três retratos do sistema, de datas diferentes:

| onde | retrato de | edita-se? |
|---|---|---|
| PC antigo (e as sessões que ficaram nele) | até a cópia, em 02/10/2026 | não — ficou para trás |
| `D:\backupantigravity` e `C:\Antigravity` | a cópia de 02/10/2026, conferida arquivo a arquivo (`TRANSICAO_PC_2026-10-02.md`) | não |
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
| 2 | Declarações por método | DEBT-142, 11 (DEBT-094), 10 (DEBT-008, registrar na fila) | sessão 1 | mapeamento e declarações lidos do método; item condicional respondido pelo projeto; testes |
| 3 | Funil e gates | 3 (DEBT-138), 4 (DEBT-070), DEBT-071/043/105 | — | export bloqueia funil divergente; manifests dizem a verdade sobre os gates |
| 4 | Busca e triagem | 5 (DEBT-056), 6 (DEBT-021), 7 (DEBT-025) | — | log PRISMA-S gravado por código; saturação lê o disco; dedup com DOI/acentos e nível 4 só sinalizando |
| 5 | Leitura e governança | 8 (DEBT-031), 9 (DEBT-018), 12 (DEBT-016), DEBT-141 | — | citação com página; trava só pelo `project_state.json`; aviso na tool de `targets`; atualização do catálogo sem apagar campos |
| 6 | Sair do esqueleto PRISMA | DEBT-137 (agentes e skills descritos por F0–F8), DEBT-134 (protocolo exigido de todo projeto), DEBT-136 (tabela de tipos duplicada), tabela F0–F8 do `conduct-review` | sessão 2 | agentes descritos por papel; cada etapa do manifest diz que skill a executa; o que é do `prisma-sr` fica no `prisma-sr` |
| 7+ | O resto da reclassificação | 19 declarações e consertos restantes; assimilação de métodos validados (JBI, GRADE/CERQual, exploratório…) | sessões 1–6 | um bloco por sessão, na ordem do arquivo de reclassificação |

## Como trabalhar — para o disco e a sessão não dependerem um do outro

1. **Uma porta de entrada.** Este arquivo e o topo da `ESPECIFICACAO_vestir_metodos.md` dizem o estado; os
   outros documentos de `.claude/maintenance/` são histórico. Sessão nova lê só isso e roda `audit_system_debt`.
2. **Cada sessão tem carta** (modelo abaixo): abre com objetivo, entrada e saída verificável; fecha com o que
   foi feito, testes, commit e a próxima sessão. Sessão sem saída verificável não começa.
3. **Toda sessão termina com commit.** O que não está commitado não existe para a próxima sessão. Nunca mais
   semanas de trabalho só no working tree.
4. **Decisão do Vicente vai ao disco na hora**, pela tool (`record_system_finding` no achado, ou nesta carta),
   com as palavras dele. Decisão que fica só no chat é o que gerou o `DECISOES_chat_a_conferir.md`.
5. **Evidência dentro do repositório.** Sonda e reprodução de achado não ficam no scratchpad da sessão.
6. **Fan-out só com saldo combinado** e com o resultado de cada agente gravado ao terminar; senão, trabalho
   inline. Duas mortes por limite (03/10 e 17/10) e uma interrupção (29/10) ensinaram isso.
7. **Um assunto por sessão.** Furo do plano encerra a sessão com registro, não com improviso.
8. **Abrir e fechar conferindo, não lembrando:** testes verdes, build em dia, `git status` e `audit_system_debt`
   no começo e no fim.

### Tokens — registro, acompanhamento e projeção (para não perder trabalho no limite)

O limite é da conta, por janela de 5h, e só o Vicente vê a porcentagem. O agente mede o que já passou com
`python .claude/maintenance/medir_esforco.py` (chat principal) e `--workflows` (subagentes). **O `--workflows`
estava cego até 29/10/2026** — somava consumo do journal, que não o traz, e dizia "nenhum journal" com 10 corridas
em disco; corrigido para ler as transcrições dos agentes. O que ele mostrou explica o 91% de 29/10: os 2 agentes
da corrida interrompida gastaram **154 mil tokens de saída em ~15 minutos**, mais que o dobro do chat principal
na mesma janela (68 mil). E das 10 corridas em disco, 6 morreram com agentes pela metade.

1. **Registro.** Ao abrir e ao fechar a sessão, a carta anota a porcentagem que o Vicente lê e o que o
   `medir_esforco.py` mede (principal e `--workflows`). Cada par calibra a régua do `CONTINUAR.md`.
2. **Projeção antes de executar.** Estimar a sessão: chat principal + subagentes. Medido: agente que lê código
   gasta de 10 a 80 mil de saída; a revisão de 3 agentes gastou 138 mil, a reclassificação de 7, 76 mil. Se a
   projeção passa do que resta com folga de 15%, a sessão se divide ou roda sem fan-out.
3. **Acompanhamento.** Gravar em disco a cada passo concluído (arquivo ou commit). A 85% não se começa passo
   novo: fecha-se a sessão com carta e commit.
4. **Corte seguro.** Fan-out só se cada agente gravar o resultado ao terminar; se cortar, o parcial se extrai das
   transcrições (foi o resgate de 18/10) antes de qualquer outra coisa.

### Carta de sessão (modelo)

```
## Sessão N — <assunto> — <data>
Objetivo: <uma frase>
Entrada: <o que precisa estar pronto/decidido>
Saída verificável: <teste, comando ou número que prova o fim>
Tokens na abertura: <% que o Vicente lê> · medido: principal <saída>, subagentes <saída> · projeção da sessão: <estimativa>
--- fechamento ---
Tokens no fechamento: <%> · medido: principal <saída>, subagentes <saída>
Feito: <achados fechados, com id>
Verificação: <suíte X testes verde; build; audit_system_debt ok>
Commit: <hash>
Decisões do Vicente registradas: <ids>
Próxima sessão: <N+1>
```
