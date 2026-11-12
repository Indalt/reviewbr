# Organização da manutenção do ReviewBR — 11/11/2026

> **O que este arquivo é.** O resultado da sessão de leitura e organização pedida no
> `BRIEFING_fable_2026-11-10.md` (Fable 5.2, esforço high). Diz o que foi feito, o que falta de verdade e o que
> sai da fila. É escrito bloco a bloco; cada bloco fecha com commit.
>
> **Estado: bloco 1 de 3 feito (11/11).** Faltam o bloco 2 (partes 6 a 9) e o bloco 3 (decisões do Vicente,
> parte 10, e a limpeza que ele aprovar). Nada aqui está decidido: as propostas esperam o Vicente na parte 10.
>
> **Regras desta sessão.** Não cria achado, sessão nem frente. O número de achados abertos só pode cair. O que
> aparecer de passagem vira uma linha na parte 11, sem avaliação.

## 1. Resumo

- **A fila não é infinita.** São 32 defeitos distintos: 17 consertos de código, 13 correções de texto e 2
  mapeamentos de norma. Os 43 abertos do backlog incluem 10 duplicatas e 1 já consertado.
- **O backlog parou de crescer.** Achados registrados por mês: 102 em setembro, 50 em outubro, 1 em novembro. A
  regra do backlog (05/11) e a porta da sessão P (08/11) funcionam.
- **O que cresce é a camada em volta dos consertos**: rodadas de triagem não aplicadas, perguntas empurradas para
  a sessão M e o balde "7+" (parte 4).
- **Dos 32 defeitos, 26 não dependem da sessão M.** Hoje a M (duas janelas, sem tocar em código) está na frente
  de todos eles.
- **Proposta:** oito sessões, uma função do ReviewBR em cada, com todo defeito aberto numa delas (parte 5).

## 2. A trajetória do briefing confere com o que está gravado

O §2 do briefing descreve três momentos: revisão sistemática automatizada baseada em PRISMA; apoio à pesquisa;
apoio à pesquisa especializado em metodologias validadas, capaz de assimilar novas. Confere com o disco:

| o que o briefing diz | onde está gravado |
|---|---|
| deixou de ser aplicador de PRISMA e passou a "vestir" métodos | `DIRECAO_ferramenta_que_veste_metodos.md`, 04/10 |
| PRISMA é um conjunto de metodologias, não o esqueleto da ferramenta | plano, respostas de 29/10 |
| só se assimila metodologia validada cientificamente | plano, pergunta 10 (29/10); `maintainer.md` |
| mudança geral do sistema junto com uma ferramenta interna de manutenção e assimilação | DIRECAO §3 e §4; agente `maintainer` e as tools `absorb_methodology`, `scaffold_methodology`, `validate_methodology` |
| "servidor MCP" e "modular" | o sistema já é um servidor MCP (`reviewbr/reviewbr-mcp`); o modular existe como um manifest por método |

Três pontos em que o registro é mais preciso que o briefing:

1. **A natureza não está mudando agora.** Em 08/11 o Vicente corrigiu: a função "continua a ser apoio para
   pesquisa com atividade principal especializado em metodologias científicas podendo assimilar as que vão
   surgindo. Isso não mudou". O terceiro momento do briefing já vale desde 04/10.
2. **Duas funções gravadas que o briefing não cita:** conduzir o projeto de pesquisa indicando a metodologia
   mais adequada (08/11) e educar o pesquisador pelo uso (04/10; A7).
3. **O tamanho real hoje:** 107 entradas no catálogo, 5 normas assimiladas (`prisma-2020`, `prisma-s`,
   `prisma-scr`, `prisma-p`, `raise-3`) e 2 métodos que executam (`prisma-sr`, `scoping-prisma-scr`).

## 3. O que foi feito

- **Backlog:** 153 achados registrados. 79 resolvidos, 31 recusados, 43 abertos (41 abertos e 2 em curso).
  Audit válido.
- **Sessões fechadas de 29/10 a 08/11:** 0 (troca de computador), 1 (escopo e PRISMA-S), 2a (declarações por
  método), 2b (itens condicionais), 2c (conferência do mapeamento e leitura documentada), P (porta do backlog).
  Suíte em 474 de 474 testes, 38 arquivos.
- **Três construções que valem ser mantidas, porque encurtam o que falta:**
  - a regra do backlog e a porta (`record_system_finding` recusa achado sem a "mentira de hoje");
  - as declarações por método (2a), que permitem consertar uma promessa falsa declarando a verdade, sem
    construir a capacidade;
  - a leitura documentada (2c), que é o procedimento para conferir a transcrição de uma norma.

## 4. Por que a fila parecia infinita

Quatro mecanismos, todos fora do backlog:

1. **Proposta aprovada e não aplicada.** A mesma fila foi triada cinco vezes (04/10, 08/10, 18/10, 31/10 e
   05/11). A de 18/10 diz "nada aqui foi executado"; a de 05/11 deixou 10 fusões e 16 enxugamentos para "cada
   sessão conferir quando tocar". Cada rodada nova relê as anteriores.
2. **Pergunta empurrada para uma sessão futura.** A sessão M recebeu, uma a uma: A1 a A9, as três perguntas
   da 2c, D01, D09 e D17, três princípios vindos do backlog, o critério do D07, a posição sobre o RAISE 3 e os
   fundamentos na filosofia da ciência. Passou a duas janelas e ficou na frente de tudo.
3. **O balde "7+".** Dezesseis dos 32 defeitos não têm sessão nomeada: estão no "7+" ou fora da tabela do
   plano. Entre eles o de maior dano a uma pesquisa:
   o DEBT-089 (`retrieve_fulltexts` reescreve o dataset de entrada e pode truncar o corpus), aberto desde 25/09.
4. **O rito custa mais que o conserto.** Cada sessão tem prompt preparado no acompanhamento, abertura, carta e
   conferência. Exemplo: o DEBT-139 (BLOQUEIA, aberto desde 09/10) se conserta trocando duas linhas de
   `index.ts` (:107 e :2344) pela função `resolveProjectDir`, que já existe e já é usada em seis pontos do
   mesmo arquivo.

Conferi no código de hoje cinco dos defeitos de maior dano (DEBT-089, 133, 135, 139 e 141): os cinco seguem
vivos, nas linhas que a triagem de 05/11 aponta.

## 5. O que falta de verdade — 32 defeitos em oito sessões

Critério de ordem: o da DIRECAO §10 — o que mais prejudica uma pesquisa conduzida hoje vem primeiro (perder
dado elegível, publicar algo falso, decidir errado). "(+NNN)" é duplicata que se funde no achado (parte 6).
Tipo do conserto: **C** código com teste; **T** texto (declarar a verdade); **M** mapeamento contra a norma.

| # | função do ReviewBR | achados | tipo | depende da M? |
|---|---|---|---|---|
| A | Texto completo e leitura | 089 · 062 (+090) · 031 | C C C | não |
| B | Registro da busca | 056 (+091) · 139 (+085) · 087 · 093 · 030 · 058 · 077 | C C C C C T T | não |
| C | Triagem e deduplicação | 021 · 025 · 112 · 026 | C C C T | não |
| D | Funil e gates | 138 (+039, +040) · 071 (+105) · 003 (+036) · 002 · 066 (+063) | C C T T T | não |
| E | Trava do protocolo | 018 · 133 · 042 · 060 | C C C T | não |
| F | Ferramentas da manutenção | 141 · 016 · 153 | C T T | não |
| G | Papéis e métodos fora do esqueleto PRISMA | 137 · 151 · 135 · 008 | T T T T | sim (decisão de 05/11) |
| H | Mapeamento das normas | 045 (+012) · 014 (+054) · as 36 divergências do PRISMA-S | M M | sim (as três perguntas da 2c) |

Observações por linha, só onde há algo a dizer:

- **A.** O 089 é o único defeito aberto que pode apagar dado de um projeto em andamento. O DEBT-102 fecha
  aqui como RESOLVIDO (a guarda contra texto vazio já existe; o OCR é funcionalidade, não defeito).
- **B.** O 058 (snowball "para trás" anunciado e nunca executado) e o 077 se consertam dizendo o que a tool faz,
  sem construir o que falta. O 030 a sessão confere: registrar por código ou declarar.
- **D.** É a antiga sessão 3. Os três de texto são uma passada só nos dois manifests e na skill de gates.
- **F.** O 141 vem antes de qualquer atualização do catálogo: hoje `absorb_methodology` com `atualizar=true`
  apaga os campos não reenviados.
- **G.** É a antiga sessão 6, reduzida aos quatro textos. As correções são de descrição: cada skill e cada
  agente passa a dizer o que cobre hoje.
- **H.** Junta o remapeamento do PRISMA 2020 (hoje declarado "deslocado", o que é verdade) com a antiga sessão
  V. É o único trabalho que pede leitura de norma e decisão item a item do Vicente.

**O que não é fila** (regra do backlog, 05/11): assimilar metodologia validada (JBI, GRADE, CERQual,
instrumentos de risco de viés), OCR, validação da IA dentro da revisão, trava da escolha de método e a forma de
abrir o ReviewBR numa IDE. Acontecem quando o Vicente pedir. A fase de testes vem depois das oito sessões, como
decidido em 27/09.

## 6 a 9. Bloco 2 — a escrever

6. Limpeza proposta do backlog e dos arquivos (as 10 fusões, o DEBT-102, os documentos históricos).
7. As 41 decisões D01–D41 e as 36 divergências do PRISMA-S: destino por grupo.
8. Lógica simples de manutenção e de assimilação de metodologia nova.
9. Catálogo da Anthropic (skills, conectores, plugins): o que serve, o que é seguro, o que falta para ir a
   público.

## 10. Decisões para o Vicente — bloco 3

Redação provisória; o bloco 2 pode acrescentar itens. Nenhuma foi tomada.

1. **Posição em relação à M.** As sessões A a F (26 defeitos) passam à frente da M, que fica antes só de G e H?
2. **A M se divide?** Uma parte curta responde às três perguntas da 2c e a D01, D09 e D17, e destrava a
   sessão H. A descrição completa do método (A2), com os fundamentos na filosofia da ciência, segue no ritmo da
   leitura do Vicente, sem prender nenhum conserto.
3. **Esta página é a "página única" decidida em 08/11?** Se sim, as sessões passam a ler só ela, e o
   `PLANO_sessoes_2026-10-29.md` vira histórico.
4. **O balde "7+" deixa de existir?** Os defeitos dele já estão nas linhas A a H; o resto vira "quando o
   Vicente pedir".
5. **Aplicar a limpeza do backlog** (parte 6): 43 abertos passam a 32.

## 11. Visto de passagem — não avaliado

- `reviewbr/reviewbr-mcp/src/index.ts.tmp` segue no disco (já anotado na triagem de 05/11).

## 12. Custo medido

Unidade `c` do medidor de `~/.claude/uso/` (0,44% da semana por c; janela de 5 h ≈ 38 c). Teto da sessão
inteira: 113 c (50% da semana).

| bloco | previsto | medido | acumulado |
|---|---|---|---|
| cálculo e plano | 3,5 c | 2,6 c | 2,6 c |
| 1 — leitura e diagnóstico | 21 c | 2,5 c | 5,1 c (2,2% da semana; 13% da janela de 5 h) |

Sinal sobre a virada da semana: a última leitura declarada era 99% (10/11). Esta sessão já gastou o
equivalente a 2% da semana sem corte, o que indica que a semana virou em 11/11 por volta das 23h30.
