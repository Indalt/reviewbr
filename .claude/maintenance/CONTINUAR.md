# Continuar — frente de trabalho do ReviewBR


> **Atualização de 08/10/2026 — leia ANTES de tudo:** o Vicente decidiu nove pontos que
> mudam o alvo da manutenção — entre eles que **atualizar o MCP para instalar método novo não
> é defeito**, que **registro de protocolo deixa de ser pré-condição**, que o **RAISE não é
> canônico** e que **agente não se multiplica por método, skill sim**. O grave passou a ser o
> **resíduo de PRISMA no modo de agir**. Está tudo em `DECISOES_2026-10-08.md`, com os fatos
> apurados com controle positivo (não reapurar) e o que lá diverge deste documento.
>

> **Direção decidida em 04/10/2026 — leia junto:** o sistema deixa de ser aplicador de PRISMA e
> passa a ser ferramenta de pesquisa que **veste** métodos, com assimilação **automatizada**.
> O rumo, o pipeline de assimilação, a fronteira do que é modular e o CORTE do que entra antes
> da fase de testes estão em `DIRECAO_ferramenta_que_veste_metodos.md`.
>

> **Atualização de 03/10/2026 (reverificação) — leia ANTES de tudo:** a correção da skill
> `screening-rules:32` foi aprovada e revelou que o erro era maior: a afirmação falsa sobre o
> ASReview estava em **9 superfícies**, e a causa era o sistema não saber representar
> *procedimento* de triagem. O protocolo já **não trava** com o item 8 do PRISMA em branco
> (`DEBT-113`, resolvido). Ver `DECISOES_2026-10-03b_reverificacao.md`, que corrige o que o
> `DECISOES_2026-10-03.md` deixou passar — inclusive a ordem de execução.
>

> **Atualização de 03/10/2026 — leia PRIMEIRO:** os seis furos que travavam a execução
> (A–F) estão decididos em `DECISOES_2026-10-03.md`. Dois mudaram de natureza na verificação:
> o `DEBT-049` estava resolvido por evidência, e o `DEBT-022` foi reenquadrado (a causa é a
> skill oferecer ferramenta como se fosse método, não a tool). Onde este documento divergir,
> vale aquele.
>
> **Atualização de 02/10/2026 — leia antes deste documento:** a manutenção continuou depois
> dele. As 11 decisões do Vicente de 27/09 e onde a execução parou estão em
> `DECISOES_2026-09-27.md`. A troca de computador e o que precisa estar instalado estão em
> `TRANSICAO_PC_2026-10-02.md`. Onde este documento divergir deles, valem eles.

> **Sessão nova? Comece por `PASSAGEM.md`**, que consolida tudo o que foi decidido. Este
> documento traz o orçamento de tokens e o estado corrente.

> Escrito em 25/09/2026 08:40, com ~70% da janela de 5h consumida.
> Uma sessão nova lê este arquivo, roda `audit_system_debt` e continua. Nada depende de
> conversa anterior.

---

## 1. Orçamento de tokens — a régua, medida

> **Atualização de 29/10/2026 — vale esta, não a régua de 25/09 logo abaixo.**
> 1. **O Vicente não informa o consumo; o agente mede e estima.** *"1% de tokens. apenas
>    avisando ja que nas proximas situacoes nao vou avisar"* (26/09, be12a326 L35) e *"queria nao
>    precisar informar sempre. se eu posso olhar vc deveria ser capaz"* (29/10). O comando é
>    `python .claude/maintenance/medir_esforco.py --agora`.
> 2. **A régua de 25/09 está numa unidade inflada.** O script contava cada bloco de uma resposta
>    como uma mensagem (~2,2×) e não via os subagentes do Agent tool nem os outros projetos da
>    conta (`DEBT-148`, corrigido em 29/10).
> 3. **Régua nova: ~10,4 M de ponderado deduplicado = 100% da janela de 5h**, somando todos os
>    projetos desta máquina (faixa de 9,5 a 11,5 M). Vem de dois pares que concordam: 24/10
>    14:40Z, 20% com 2,08 M (projeto Cultura Líquida), e 29/10 19:50Z, 5% com 0,52 M. Discordam
>    três: 24/09 (estouro com 7,97 M visíveis) e 25/09 (70% com 4,07 M), quando o uso fora deste
>    PC não era visível; e a manhã de 29/10 (91% lido, 17,1 M na janela aproximada), muito
>    provavelmente porque a janela real da conta não coincide com a que o script reconstrói.
> 4. **A estimativa é piso:** o uso no claude.ai (web e app) não deixa transcrito aqui. Onde a
>    regra diz 85% lidos, use 75% estimados.
> 5. **Semanal:** um par só (18% em 29/10/2026, logo depois de um reset), ainda sem régua.

Calibrada com dois pontos reais desta conta (Claude Team):

| Janela | Saída | Ponderado | Estado observado |
|---|---|---|---|
| 24/09 23:19 | 407.831 | 14,88 M | **estourou** (100%) |
| 25/09 10:50 | 298.189 | 9,34 M | **70%** |

Projetando o segundo para 100%: **426 mil de saída**, contra 407 mil medidos no estouro —
erro de 4,5%. Pelo ponderado o erro é 10%.

> **Régua: ~410–425 mil tokens de SAÍDA por janela de 5h.**
> O token de saída prevê melhor que o volume bruto. Pare em 85% (~350 mil) para ter margem.

Meça a qualquer momento:

```bash
python .claude/maintenance/medir_esforco.py          # janelas de 5h
python .claude/maintenance/medir_esforco.py --tudo   # + sessões + workflows
```

### 1.1 Onde o custo realmente mora

Decomposição da janela que estourou, por peso de preço da API:

| Parcela | Bruto | Fatia do custo |
|---|---|---|
| Leitura de cache | 100,3 M | **67,4%** |
| Escrita de cache | 2,25 M | 18,9% |
| Saída | 408 mil | 13,7% |

**A leitura de cache é dois terços do custo.** Ela não vem do esforço do modelo: vem de
**tamanho de contexto × número de turnos**. Uma sessão de 427 mensagens relê o contexto
inteiro a cada turno.

**Consequência prática, e é a maior alavanca:** nunca carregue arquivo grande no contexto.
Processe por script. Nesta sessão, 194 KB de resultado de pesquisa foram processados por
Python e nunca entraram no contexto — se tivessem entrado, entrariam na leitura de cache de
**todos** os turnos seguintes.

---

## 2. Política de esforço — o que merece Opus no talo

**Modelo: Opus, sempre** — *"podemos não precisar do ultracode para tudo, mas nunca deixar de
usar o opus pela complexidade das tarefas"* (Vicente, 25/09/2026, 27fac9ba L1054). O que se
regula é o **esforço** (e o ultracode); o que é mecânico vai para script, sem agente. Em 26/09 a
execução rodou em Sonnet por escolha dele no seletor do cliente (be12a326 L3), e isso não mudou a
regra. (Corrigido em 29/10/2026: aqui dizia "Opus para tudo, sempre: não" — DEC-19 do
`DECISOES_chat_a_conferir.md`.)

| Tipo de tarefa | Modelo / esforço | Por quê |
|---|---|---|
| Contar, listar, extrair campo, converter formato | **script (Python/Bash)**, zero agente | determinístico e exato; agente aqui é desperdício e ainda pode errar |
| Varredura mecânica sobre muitos arquivos | script + `Grep`/`Glob` | idem |
| Classificar item por critério claro | Opus, **esforço baixo/médio** | tem julgamento, mas raso |
| Auditar, revisar adversarialmente, decidir arquitetura | Opus, **esforço alto** | é onde o erro custa caro |
| Pesquisa em fonte externa (fan-out) | subagentes em workflow | paraleliza e não polui o contexto principal |
| Síntese final, redação do diagnóstico | Opus, esforço alto | é o entregável |

Nas chamadas de `Agent` e dentro de `Workflow`, isso se expressa em `opts.effort`
(`low` | `medium` | `high` | `xhigh` | `max`); `opts.model` não serve para rebaixar o modelo.
**Omitir herda a sessão** — então declare explicitamente o esforço baixo quando a tarefa for
mecânica.

### 2.1 Regras que economizam mais que trocar de modelo

1. **Script em vez de leitura.** Processar arquivo grande por script custa uma fração de
   carregá-lo no contexto — e o custo de carregar se repete em todo turno seguinte.
2. **Sessão curta.** O custo cresce com turnos × contexto. Fechar e retomar por disco é mais
   barato que uma sessão de 400 mensagens.
3. **Subagente isola contexto.** O que o subagente lê não entra no contexto principal.
4. **Não reler para conferir.** As tools de edição falham se a edição falhar.

---

## 3. Estado do trabalho

| Etapa | Estado |
|---|---|
| 0 protocolo / 1 manifesto / 2 RV-11 + backlog + padrões | concluídas |
| 2b catálogo / 2c agente de manutenção | concluídas — reapure o total com `query_methodology_catalog` |
| 5 Frente 2 — auditoria | **CONCLUÍDA** em 25/09/2026 — 75 achados, 22 bloqueando |
| 3 RV-09 / 4 RV-10 / 6 estado da arte | não iniciadas |

**Denominador apurado em 25/09/2026** (não herde; reapure):
44 tools · 8 agentes · 9 skills · 2 metodologias · 2 padrões · 36 serviços · 8 RV.
Controle positivo: `dist` e `src` expõem as mesmas 44.

---

## 4. Frente 2 — CONCLUÍDA em 25/09/2026

Cobertura integral do denominador: 44 tools, 8 agentes, 9 skills, 2 metodologias, 2 padrões, 8 RV.
**75 achados: 22 bloqueiam, 42 sérios, 11 menores.** Todos no backlog, tipados, com evidência.
Diagnóstico: `.claude/maintenance/DIAGNOSTICO_frente_2.md`.

Veredicto em uma frase: **a verificação existe, está escrita, está declarada — e não está no
caminho.** É o mesmo diagnóstico que o sistema já fazia de si, herdado em vez de corrigido.

### Próximo passo

Nada foi corrigido, e **nada deve ser corrigido sem passar pelo RV-11**. A decisão de por onde
começar é do pesquisador. Os 22 que bloqueiam estão no §4 do diagnóstico.

Frentes ainda não iniciadas: **RV-09** (prova de leitura), **RV-10** (sentido dos termos),
**Frente 3** (estado da arte).

---

## 5. Histórico desta janela

A auditoria rodou em **seis lotes paralelos** (A1 busca/aquisição, A2 triagem/extração,
A3 gates/manutenção, B invariantes, C agentes+skills, D padrões+metodologias). Cinco
retornaram na primeira corrida; o A1 morreu no limite de sessão e foi executado à parte,
já na janela seguinte — sem ele, 17 tools teriam ficado fora.

Resultados brutos, caso seja preciso reconferir (leia por script, nunca no contexto):
`~/.claude/projects/c--reviewbr/<sessão>/subagents/workflows/wf_3d8711f8-8ae/journal.jsonl`
e `.../wf_cbb93c50-81f/journal.jsonl` (lote A1).

**Uma correção que a auditoria fez no auditor:** o DEBT-017, levantado antes por conversa,
afirmava que 5 de 16 tools de aquisição chamavam o guardrail do RV-01. O lote A1 foi
instruído a confirmar **ou contradizer** de forma independente, e contradisse — o método
anterior fatiava `index.ts` por `server.tool(` e atribuía handlers nomeados à tool errada.
O achado foi corrigido no backlog. Número errado publicado como achado é tão ruim quanto
lacuna não vista.

---

## 6. Fronteiras desta frente

- **Nada se corrige durante a auditoria.** O que se corrige deixa de ser medido.
- **Conclua do código, nunca do nome.** `rag_query` soa semântico e é BM25 léxico.
- **Zero exige controle positivo.**
- **Não feche achado que o pesquisador ainda não leu.**
- Se a janela acabar no meio, **pare e atualize este arquivo**. Auditoria pela metade,
  registrada, vale mais que auditoria inteira perdida.

---

## 7. ESTADO — apurado em 26/09/2026

> ⚠️ **Este bloco substitui a versão anterior, que afirmava três números falsos** (101 achados,
> 105 testes, "nenhum código alterado") e mandava executar passos que já estavam feitos. Uma
> verificação de integridade por cinco lentes independentes pegou isso. **Não confie em número
> escrito aqui: reapure.** Os comandos estão ao lado de cada linha.

| Item | Valor apurado | Como reapurar |
|---|---|---|
| Achados no backlog | **102** (81 abertos, 15 resolvidos, 3 em curso, 3 recusados) | `audit_system_debt` |
| Testes | rode e veja | `cd reviewbr/reviewbr-mcp && npx vitest run` |
| Tools MCP | **44** | `grep -c '^server.tool($' src/index.ts` |
| Catálogo | **107** metodologias | `query_methodology_catalog` |

### Fase 1 — quatro dos cinco itens FEITOS

| # | Estado | O quê |
|---|---|---|
| 1 | ✅ 25/09 | `export_dataset` parou de carimbar conformidade sem verificar (DEBT-019, 057) |
| 2 | ✅ 26/09 | RV-05 entrou no caminho do export e bloqueia (DEBT-038) |
| 3 | ✅ 26/09 | Triagem auditável: trilha, temperatura fixada, alias detectado (DEBT-027, 098, 099) |
| 4 | ✅ 26/09 | Guardrail cobre aquisição, nega por padrão, 17/17 tools (DEBT-017, 033, 034, 080, 083) |
| 5 | ⬜ | **Único pendente:** motivos de exclusão padronizados (EX-01..EX-11) |

**Fora da ordem, por urgência:** DEBT-068 — as tools de escrita **apagavam o backlog e o
catálogo em silêncio** quando o arquivo em disco não passava no schema. Fechado. Era nas tools
que o próprio mantenedor usa para registrar achados.

### Fase 2 — teste de integração: FEITO

`tests/integracao.test.ts` verifica, a cada suíte: método público sem chamador, tool que
nenhuma instrução invoca, gate apontando para tool inexistente, e documento de estado
inalcançável a partir do `maintainer.md`. Exceções declaradas com o DEBT que as cobre.

### O que falta

1. **Fase 1 item 5** — EX-01..EX-11 (`grep -rn "EX-01" src/` não devolve nada).
2. ~~Mapa de cobertura~~ — **FEITO** em 26/09: `COBERTURA_achados.md` dá destino declarado aos
   83 abertos. Revelou que **14 são da Fase 1**, e não os 5 que o plano listava.
3. **Decisões do pesquisador pendentes:** DEBT-100 (fases como dado), DEBT-101 (tool que roda
   a triagem duas vezes e reporta o kappa), DEBT-102 (OCR), DEBT-081 (`projectPath`
   obrigatório), DEBT-016 (RV-11 valida a prosa, não a alteração).
4. **DEBT-049 — PROIBIDO CORRIGIR.** Duas leituras do código se contradizem; exige terceiro
   controle antes de qualquer ação.

### Leia também

`ORDEM_correcoes.md` — **antes de corrigir qualquer coisa.** 13 dependências de ordem e 1
exclusão mútua apuradas. `DIAGNOSTICO_frente_2.md` — a auditoria completa.
`CONFORMIDADE_raise.md` — os 6 itens do RAISE §4.9 que o sistema descumpre.

### Nada está quebrado

`tsc` limpo, suíte verde, `dist` em dia com `src` (travado por `tests/build_frescor.test.ts`).
