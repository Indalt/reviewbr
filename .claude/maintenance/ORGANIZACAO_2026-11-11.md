# Organização da manutenção do ReviewBR — 11/11/2026

> **O que este arquivo é.** O resultado da sessão de leitura e organização pedida no
> `BRIEFING_fable_2026-11-10.md` (Fable 5.2, esforço high). Diz o que foi feito, o que falta de verdade e o que
> sai da fila. É escrito bloco a bloco; cada bloco fecha com commit.
>
> **Estado (12/11): leitura, análise e limpeza do backlog feitas.** Duas decisões do Vicente estão gravadas na
> parte 10.1. O resto é proposta e espera as seis decisões da parte 10.2.
>
> **Regras desta sessão.** Não cria achado, sessão nem frente. O número de achados abertos só pode cair. O que
> aparecer de passagem vira uma linha na parte 11, sem avaliação.

## 1. Resumo

- **A fila não é infinita.** São 32 defeitos distintos: 18 consertos de código, 12 correções de texto e 2
  mapeamentos de norma. O backlog mostrava 43 abertos por causa de 10 duplicatas e de 1 já consertado; em 12/11
  passou a 32 (parte 6.1).
- **O backlog parou de crescer.** Achados registrados por mês: 102 em setembro, 50 em outubro, 1 em novembro. A
  regra do backlog (05/11) e a porta da sessão P (08/11) funcionam.
- **O que cresce é a camada em volta dos consertos**: rodadas de triagem não aplicadas, perguntas empurradas para
  a sessão M e o balde "7+" (parte 4).
- **Nenhum dos 32 defeitos depende da sessão M.** As definições que o mapeamento das normas pede cabem na
  abertura da sessão que as usa (parte 5.2).
- **Decidido em 12/11:** os consertos vêm antes da M, e as 11 saídas do backlog foram gravadas (parte 10.1).
- **Proposto, a decidir:** oito sessões de conserto, uma função do ReviewBR em cada; depois a M, reformulada; depois
  a fase de testes (partes 5.4 e 10.2).

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

- **Backlog em 11/11, antes da limpeza da parte 6.1:** 153 achados registrados. 79 resolvidos, 31 recusados,
  43 abertos (41 abertos e 2 em curso). Audit válido.
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

## 5. O que falta — as oito sessões analisadas pelos critérios (12/11)

Em 12/11 o Vicente pediu que as oito sessões propostas fossem analisadas pelos critérios desta sessão, incluindo
a ideia de página única, e que se visse se a M e as sessões programadas depois dela precisam ser reformuladas.
Os critérios são três perguntas por achado:

1. O sistema mente hoje nisto?
2. Isso pesa numa pesquisa conduzida hoje (perder dado elegível, publicar algo falso, decidir errado)?
3. Há conserto menor — declarar a verdade em vez de construir?

Vereditos: **FAZER** (código com teste), **DECLARAR** (texto ou dado), **MAPEAR** (leitura da norma). "(+NNN)" é
duplicata já fundida no achado (parte 6.1).

### 5.1 Achado por achado

**A — Texto completo e leitura**

| achado | o que mente hoje | pesa numa pesquisa? | conserto | veredito |
|---|---|---|---|---|
| 089 | `retrieve_fulltexts` regrava o dataset de entrada a cada lote de 10 (`index.ts:1228`) | sim: se o processo cair, os incluídos ainda não processados somem | gravar em arquivo próprio, ou só ao final | FAZER — o primeiro de todos |
| 062 (+090) | o "sim explícito" do pesquisador para a rota BYOS só existe na descrição da tool | sim, na responsabilidade do pesquisador; não nos números | parâmetro de consentimento, gravado no log | FAZER, pequeno; sai se a rota for retirada (10.2, item 6) |
| 031 | a skill de leitura exige citação com página, e o `rag_query` não devolve página | sim: o agente é obrigado a citar um dado que não tem | menor: citar estudo e trecho literal. Decidido em 29/10: guardar a página na extração | FAZER, como decidido |

**B — Registro da busca**

| achado | o que mente hoje | pesa numa pesquisa? | conserto | veredito |
|---|---|---|---|---|
| 056 (+091) | o log "obrigatório" do PRISMA-S é um CSV digitado pelo agente; nenhum código o grava nem confere | sim: o log publicado pode não ser o que foi executado | decidido em 29/10: o código grava | FAZER |
| 139 (+085) | com caminho absoluto, o log e o relatório somem e a tool responde sucesso | sim | duas linhas (`resolveProjectDir`) e um teste | FAZER, junto do 056 |
| 087 | o snowball devolve registros e não os grava; o funil conta "outros métodos" como zero | sim: número publicado errado | gravar em `01_raw/other_records.json` | FAZER |
| 093 | três tools de busca só gravam em `01_raw` se o projeto estiver no SQLite; senão, calam | sim: registro perdido sem aviso | tirar a condição ou avisar | FAZER |
| 058 | o `librarian.md` manda "puxar referências"; a tool só busca citações | pouco | uma frase no agente e a direção na saída | DECLARAR |
| 077 | `heal_repositories` diz "todos ativos e operantes" sem testar nenhum | pouco | trocar a frase | DECLARAR |

**C — Triagem, deduplicação e tools em lote**

| achado | o que mente hoje | pesa numa pesquisa? | conserto | veredito |
|---|---|---|---|---|
| 021 | a skill manda decidir a parada pela saturação; o relatório lê um campo que nenhuma tool grava | sim: decide-se parar sobre um universo vazio | decidido em 29/10: ler a triagem do disco | FAZER |
| 025 | a skill promete 4 níveis de deduplicação; o código faz 2 e erra em DOI com prefixo e em acento | sim: muda número publicado | decidido em 29/10 | FAZER |
| 112 | a segunda corrida de triagem apaga a primeira sem registro | sim: decisão de inclusão sem trilha | registrar a substituição antes de sobrescrever | FAZER |
| 030 | quatro tools em lote, duas delas decidindo por IA, não deixam rastro | sim: o uso de IA do projeto não fica declarável (D07) | chamar o registro que já existe | FAZER |
| 026 | exclusão "por motivo padronizado" consta como atendida; os códigos EX não existem no código | sim, no checklist | declarar `[NÃO COBERTO]` por método | DECLARAR |

**D — Funil e gates**

| achado | o que mente hoje | pesa numa pesquisa? | conserto | veredito |
|---|---|---|---|---|
| 138 (+039, +040) | os manifests dizem que dois gates barram; o código só avisa | sim: funil divergente chega à exportação | decidido em 29/10: a exportação recalcula e bloqueia | FAZER |
| 071 (+105) | a validação do funil é circular, e a checagem cruzada não impede a gravação | sim | a checagem cruzada entra no `valid`; teste | FAZER |
| 003 (+036) | os manifests declaram 8 invariantes sempre ativos e só 4 têm gate; o validador do próprio sistema reprova os dois métodos | não nos números; sim no que o método afirma de si | cada invariante aponta o seu gate ou se declara conduta | DECLARAR |
| 002 | a skill de gates promete verificação determinística para RV-03, RV-06 e RV-07, que são conduta | idem | declarar | DECLARAR |
| 066 (+063) | a skill promete conferência de completude de subitem, que não existe | idem | declarar | DECLARAR |

**E — Trava do protocolo**

| achado | o que mente hoje | pesa numa pesquisa? | conserto | veredito |
|---|---|---|---|---|
| 018 | em projeto sem estado, trocar `[DRAFT]` por `[LOCKED]` no markdown libera a busca | sim: o manuscrito afirma protocolo travado que nunca foi aprovado | decidido em 29/10: o estado é a fonte única | FAZER |
| 133 | a aprovação grava `[LOCKED]` no arquivo antes do estado; se o estado falhar, as duas fontes divergem | sim, enquanto o 018 existir | inverter a ordem | FAZER, no mesmo conserto do 018 |
| 042 | replanejar no caminho de um projeto travado zera o protocolo e as decisões | sim: destrói protocolo aprovado | a guarda confere o caminho | FAZER |
| 060 | "não gere scripts" e "não busque" valem só em prosa; o frontmatter dos agentes dá Bash, Write e busca | pouco nos números; é trava que depende de convencer o agente | tirar do frontmatter o que o papel não usa, ou dizer que é conduta | DECLARAR |

**F — Ferramentas da manutenção**

| achado | o que mente hoje | pesa numa pesquisa? | conserto | veredito |
|---|---|---|---|---|
| 141 | `absorb_methodology` com `atualizar=true` responde ok e apaga campos | não numa pesquisa; sim em toda atualização do catálogo | mesclar antes de validar, como o backlog já faz | FAZER |
| 016 | `validate_system_change` diz que valida a alteração e só confere a prosa da proposta | não | o aviso decidido em 29/10 | DECLARAR |
| 153 | o catálogo diz que o RAISE é obrigatório; o texto oficial diz que as organizações apoiam os objetivos dele | sim, se um projeto consultar o catálogo sobre uso de IA | corrigir a entrada, depois do 141 | DECLARAR |

**G — Textos que prendem o sistema à revisão sistemática**

| achado | o que mente hoje | pesa numa pesquisa? | conserto | veredito |
|---|---|---|---|---|
| 135 | o sistema mostra "Registro: OBRIGATÓRIO (PROSPERO)" a toda revisão sistemática; nenhuma norma assimilada exige | sim: exige do pesquisador o que a metodologia não pede | tirar o OBRIGATÓRIO; campo de declaração no protocolo | FAZER, pequeno |
| 137 | skills de nome genérico dizem servir qualquer método; o conteúdo é a trilha do `prisma-sr` | pouco | a descrição diz o que cobre hoje | DECLARAR |
| 151 | o escopo herda rótulos do PICOS, a exclusão por desfecho e a certeza da evidência | sim, na triagem de um projeto de escopo | texto e manifest na camada do escopo | DECLARAR |
| 008 | textos amarram GRADE e CERQual à metanálise, contra a fonte | sim, no relato | corrigir os quatro textos | DECLARAR |

**H — Mapeamento das normas**

| achado | o que mente hoje | pesa numa pesquisa? | conserto | veredito |
|---|---|---|---|---|
| 045 (+012) | a spec que o `analyst` lê numera errado seis itens do PRISMA 2020; o mapeamento já os declara "deslocado" | sim: o checklist do manuscrito pode citar o item errado | corrigir a spec e os seis ponteiros | MAPEAR |
| 014 (+054) | 21 subitens do PRISMA 2020 nunca foram mapeados, e a skill diz que órfão impede a finalização | sim: toda revisão `prisma-sr` para na F8 | menor e imediato: declarar os 21 `[NÃO COBERTO]` como lacuna do sistema; completo: mapear | DECLARAR já, na sessão D; MAPEAR aqui |
| 36 divergências do PRISMA-S | — | — | uma definição e 21 decisões (parte 7.2) | decisão do Vicente |

**O que a análise mudou na proposta do bloco 1:**

- **Nenhum achado sai.** Os 32 mentem hoje. Cinco foram conferidos no código nesta sessão; os outros trazem a
  linha conferida na triagem de 05/11.
- **A sessão G não depende da M.** Os quatro consertos dela são de texto. O que dependia da M era a arquitetura
  da antiga sessão 6, que é construção, não defeito (5.2).
- **O 030 passou da B para a C:** as quatro tools são de triagem e extração em lote, não de busca.
- **A declaração do 014 sobe para a D:** é o que hoje faz toda revisão sistemática parar na F8, e se conserta
  declarando.
- **Em 12 dos 32 o conserto menor basta** (DECLARAR). Em 3 havia conserto menor e o Vicente já decidiu
  construir (021, 031 e 056, em 29/10): vale a decisão.

### 5.2 A M e as sessões programadas, reformuladas

| no plano de hoje | passa a ser | por quê |
|---|---|---|
| **M** — duas janelas, antes de tudo | **a última antes dos testes**, numa janela. Redige o `METODO_ReviewBR.md` com o que já está decidido (A1 a A9, o princípio de 08/11, D04, D07, D14) e leva ao Vicente só as escolhas dele: os fundamentos na filosofia da ciência, os três princípios vindos do backlog, a posição sobre o RAISE 3, o critério de credibilidade, D01 e D09 | Descrever o método antes dos consertos obriga o texto a ressalvar cada defeito aberto (é a armadilha 3 do próprio prompt da M). Depois deles, o texto descreve o que o sistema faz. |
| as três perguntas da 2c, dentro da M | abertura da sessão H | São definições sobre mapeamento; quem as usa é a H. |
| **V** — aplicar as divergências do PRISMA-S | dentro da H | Mesmo trabalho, na mesma norma. |
| **3** — funil e gates | D | Igual, mais os três textos que estavam no "7+" e a declaração do 014. |
| **4** — busca e triagem | B e C | São duas funções. |
| **5** — leitura e governança | A, E e F | São três funções. |
| **6** — sair do esqueleto PRISMA, duas janelas | G, com quatro textos. A parte de arquitetura (agentes descritos por papel; cada etapa do manifest diz que skill a executa) sai da fila | É construção, não defeito. Passa a ser necessária quando a primeira metodologia nova for assimilada, e entra como parte dessa assimilação. A D17 vai com a G. |
| **7+** | deixa de existir | Os defeitos dele estão em A a H; assimilação e funcionalidades ficam para quando o Vicente pedir. |
| fase de testes | igual, depois da M | — |

### 5.3 A página única, pelos mesmos critérios

- **O problema que ela resolve existe.** Uma sessão nova lê hoje um plano de 1.500 linhas, e o `maintainer.md`
  manda ler 13 documentos.
- **O risco dela também.** O plano chegou a 1.500 linhas por acréscimo. Uma página que liste achados com os
  seus detalhes repete o backlog e envelhece do mesmo jeito.
- **O que ela precisa ter é só o que o backlog não tem:** a ordem das sessões, que achados vão em cada uma e
  as três perguntas. O resto já sai do `audit_system_debt`, que é derivado do dado.
- **Proposta:** um arquivo próprio, de uma tela, com a tabela da parte 5.4 e nada mais. Decisão e carta não
  entram nele. Cada linha serve de prompt de abertura da sessão: os achados, "abrir e fechar conferindo" e
  "aplicar a proposta da triagem de 05/11 para estes achados". Este arquivo fica como a análise que a justifica.

### 5.4 A fila proposta

| ordem | sessão | função do ReviewBR | achados |
|---|---|---|---|
| 1 | A | Texto completo e leitura | 089 · 062 · 031 |
| 2 | B | Registro da busca | 056 · 139 · 087 · 093 · 058 · 077 |
| 3 | C | Triagem, deduplicação e tools em lote | 021 · 025 · 112 · 030 · 026 |
| 4 | D | Funil e gates | 138 · 071 · 003 · 002 · 066 · a declaração do 014 |
| 5 | E | Trava do protocolo | 018 · 133 · 042 · 060 |
| 6 | F | Ferramentas da manutenção | 141 · 016 · 153 · a rota do `maintainer.md` (parte 8.3) |
| 7 | G | Textos que prendem o sistema à revisão sistemática | 135 · 137 · 151 · 008 |
| 8 | H | Mapeamento das normas, com o Vicente | 045 · 014 · as 36 divergências do PRISMA-S |
| 9 | M | Descrição do método, com o Vicente | — |
| 10 | — | Fase de testes | — |

A ordem de A a E segue o dano a uma pesquisa de hoje: primeiro o que apaga dado, depois o que muda número
publicado, depois o que afirma uma trava que não existe. Cada sessão de A a G cabe numa janela de 5 h; a H pode
pedir duas.

**O que não é fila** (regra do backlog, 05/11): assimilar metodologia validada (JBI, GRADE, CERQual,
instrumentos de risco de viés), OCR, validação da IA dentro da revisão, trava da escolha de método, a forma de
abrir o ReviewBR numa IDE e a arquitetura da antiga sessão 6. Acontecem quando o Vicente pedir.

## 6. Limpeza

### 6.1 Backlog — aplicado em 12/11: 43 abertos passaram a 32, sem tocar em código

Onze gravações pela `record_system_finding`, por decisão do Vicente (parte 10.1). As dez fusões são da triagem
de 05/11 (e já estavam na reclassificação de 18/10); nenhuma tinha sido contestada nem aplicada.

Conferido depois de gravar: `audit_system_debt` válido, com 32 abertos, nenhum em curso, 80 resolvidos e 41
recusados; `sessao_p/compara_backlog.mjs` mostra só `status` e `resolution` alterados, e só nesses 11.

| sai | fica em | por quê |
|---|---|---|
| DEBT-012 | DEBT-045 | mesmo remapeamento do PRISMA 2020, mesmos ponteiros |
| DEBT-054 | DEBT-014 | as 39 referências são material do mesmo conserto |
| DEBT-036 | DEBT-003 | mesma declaração de invariantes sem gate |
| DEBT-039, DEBT-040 | DEBT-138 | mesmas duas metades dos gates que não travam |
| DEBT-105 | DEBT-071 | reprodução perdida do mesmo defeito |
| DEBT-063 | DEBT-066 | a F6 por autocertificação é a mesma promessa de verificação inexistente |
| DEBT-085 | DEBT-139 | é a parte (1) do 139 |
| DEBT-091 | DEBT-056 | rotas de busca sem log são o escopo do log gravado por código |
| DEBT-090 | DEBT-062 | mesma restrição que só existe na descrição da tool |
| DEBT-102 | RESOLVIDO | a guarda contra texto vazio existe; o OCR vai para "quando o Vicente pedir" |

Cada duplicata saiu como RECUSADO, com a resolution apontando o achado que fica e o que a sessão dele precisa
levar. O achado que fica recebe esse conteúdo quando a sessão dele abrir (a porta exige a "mentira de hoje",
que a triagem já propõe para cada um).

### 6.2 Documentos — nada se move nesta sessão

`.claude/maintenance/` tem 24 documentos `.md` e 5 `.json` na raiz. Dois fatos impedem movê-los agora:

- `maintainer.md` (linhas 187 a 248) manda toda sessão nova ler 13 deles em ordem fixa, a maioria de setembro e
  outubro. O plano diz o contrário desde 29/10: "uma porta de entrada", o resto é histórico ("Como trabalhar",
  item 1).
- `tests/integracao.test.ts` reprova documento que a rota do `maintainer.md` não alcança.

Mover arquivo exige mudar agente e teste, e isso é trabalho da sessão F (parte 8.3), pelo gate RV-11. O que
está vivo hoje:

| documento | para que serve |
|---|---|
| este arquivo | estado e fila de sessões |
| `system_debt.json`, lido por `audit_system_debt` | a fila de defeitos |
| `triagem_backlog_2026-11-05/TRIAGEM.md` | a "mentira de hoje" proposta para cada achado aberto |
| `revisao_decisoes_2026-10-31/lista_decisoes.md` | consulta: redação proposta de cada decisão (parte 7) |
| `sessao_2c/divergencias_prisma_s.md` | entrada da sessão H |
| `PLANO_sessoes_2026-10-29.md` | registro das decisões de 29/10 a 10/11 e cartas das sessões fechadas |
| `DIRECAO_ferramenta_que_veste_metodos.md` | o rumo de 04/10; os §2, §3, §4 e §6 valem, o §1 e o §7 estão vencidos |

Exemplo de parte vencida: a DIRECAO §1 diz que há 3 normas assimiladas e que nada lê o manifest do método. Hoje
são 5 normas, e desde a sessão 2a o mapeamento e as declarações são lidos do método. Documento vencido na rota
de leitura é fonte de achado repetido.

## 7. As 41 decisões e as 36 divergências não são fila

### 7.1 D01 a D41

A lista de 31/10 traz 41 decisões gravadas sem precisão, cada uma com uma redação proposta. A regra já existe
(09/11): vai a cada sessão só a que pesa nela. Distribuídas pelo título — a sessão confere na abertura:

| destino | decisões | quantas |
|---|---|---|
| já decididas ou cobertas | D04, D07, D14 | 3 |
| sessão M | D01, D09 | 2 |
| sessão A | D23, D39 (pergunta 8) | 2 |
| sessão B | D02, D20, D30 | 3 |
| sessão C | D19, D24, D35, D37, D39 (pergunta 7) | 5 |
| sessão D | D29, D36 | 2 |
| sessão E | D06, D39 (pergunta 9) | 2 |
| sessão F | D03, D05, D08, D16, D21, D22 | 6 |
| sessão G | D10, D11, D12, D13, D17, D26 | 6 |
| sessão H | D15, D27 | 2 |
| nenhuma sessão: só se o assunto voltar | D18, D25, D28, D31, D32, D33, D34, D38, D40, D41 | 10 |

A D39 aparece em três sessões porque junta três perguntas. Nenhuma sessão abre com mais de seis redações a
conferir, e dez decisões não pedem nada de ninguém.

### 7.2 As 36 divergências do PRISMA-S

Pelos temas do próprio arquivo, são uma definição e 21 decisões:

- **15 dependem de uma definição só** (13 de seções do manuscrito e 2 de suplementos): o lugar onde o item é
  relatado conta como cobertura? É a primeira das três perguntas da 2c ("o que é cobrir um item da norma").
  Respondida, as 15 se resolvem de uma vez.
- **14 são ponteiros para campos de coleta** e **7 são juízos de cobertura** (completa, parcial ou nenhuma):
  essas 21 o Vicente decide item a item, na sessão H.

## 8. Lógica de manutenção e de assimilação

Nada aqui é regra nova. É o que já está decidido, reduzido ao que se usa.

### 8.1 Manutenção — quatro perguntas

1. **É defeito de hoje?** O sistema afirma, exige ou entrega algo que não se sustenta, e dá para apontar o
   arquivo e a linha. Se não for, não entra no backlog:
   - metodologia ou norma que falta vai ao catálogo;
   - decisão do Vicente vai ao registro de decisões;
   - ideia e agenda vão à lista "quando o Vicente pedir";
   - problema só futuro não se registra.
2. **Qual é o menor conserto que faz o sistema dizer a verdade?** Declarar (texto, manifest, `[NÃO COBERTO]`)
   ou construir (código com teste). Constrói-se quando a falta prejudica uma pesquisa — perder dado elegível,
   publicar algo falso, decidir errado — ou quando o Vicente já decidiu construir.
3. **Em que função do ReviewBR ele cai?** O conserto entra na sessão dessa função. Sessão abre e fecha
   conferindo: `git status`, testes, `audit_system_debt`; alteração pelo gate RV-11, com o tipo declarado
   (correção, conformidade ou extensão); commit.
4. **A fila é o `audit_system_debt`.** Nenhum outro documento é fila.

### 8.2 Assimilação de metodologia — seis passos

O fundamento científico: a validade de uma metodologia vem da literatura que a publica, não da ferramenta. O
ReviewBR não julga mérito; confere que a transcrição é fiel (A6, A9). O fundamento lógico: a máquina não sabe
gerar o mapeamento certo, mas sabe provar que um mapeamento proposto está errado (DIRECAO §2). Por isso a
máquina transcreve e confere, e o juízo fica com o pesquisador.

| passo | o que acontece | quem decide | como se confere |
|---|---|---|---|
| 0. Pedido | o Vicente pede a metodologia | Vicente | nunca é automático |
| 1. Elegibilidade | há fonte oficial publicada (norma, manual, diretriz) | — | a fonte abre e é citável; sem fonte, não entra |
| 2. Catálogo | resumo e ponteiro para a fonte (`absorb_methodology`) | — | a tool recusa entrada sem `source_url` externo |
| 3. Norma como dado | transcrição em `.claude/standards/` | Vicente, só nas divergências | contagem de itens fecha; trecho literal por item; segunda leitura independente |
| 4. Mapeamento | cada item da norma apontado para a trilha, com trecho literal; o que a trilha não cobre se declara | Vicente, só nas divergências | `check_standard_coverage` |
| 5. Trilha que executa | `scaffold_methodology`; entra completa ou não entra | — | `validate_methodology` e a suíte |

Três regras já decididas valem em todos os passos: o que a metodologia torna obrigatório é obrigatório, e o que
torna opcional é opcional (08/11); um método não herda de outro o que é próprio dele (D14); pergunta que o
protocolo do método não tem não é feita ao projeto.

Duas pendências de definição, ambas para a abertura da sessão H: se a leitura documentada confere também o que a
ferramenta garante por código, e se o gate RV-11 a exige quando um mapeamento muda.

### 8.3 Onde o procedimento de hoje pesa mais que o necessário

Tudo cabe na sessão F, sem achado novo:

- A rota de leitura do `maintainer.md` cai de 13 documentos para três passos: este arquivo, o
  `audit_system_debt` e, quando pedido, a conferência de versão das normas assimiladas. Os outros documentos
  viram histórico, e o teste de integração passa a conferir a rota nova.
- O fechamento de sessão do `maintainer.md` manda atualizar o `EXECUCAO_checklist.md` e o manifesto de
  conformidade a cada alteração. O primeiro não é atualizado desde 09/10: as sessões fecham pela carta no plano.

## 9. Catálogo da Anthropic — o que serve, o que é seguro, o que falta para ir a público

Consultado em 11/11/2026. O Bio Research não foi relido: segue a análise de 05/11 (DEBT-110, recusado).

### 9.1 O que existe e como se relaciona com o ReviewBR

| item | o que é | relação com o ReviewBR |
|---|---|---|
| Conectores de literatura: PubMed, bioRxiv e medRxiv, Scholar Gateway (só conteúdo da Wiley), Consensus, Elicit | servidores de terceiros listados no diretório | **Não substituem as tools de busca do ReviewBR.** Busca por conector não grava a string exata, a data e a contagem que o PRISMA-S exige, e a Anthropic avisa que não verifica se o conector funciona como descrito nem se muda. Servem só ao modo exploratório (`scout`). |
| Plugins `knowledge-work-plugins` (11: produtividade, vendas, suporte, produto, marketing, jurídico, finanças, dados, busca corporativa, bio-research, gestão de plugins) | pacotes de skills e conectores, só markdown e JSON | Nenhum trata de metodologia de pesquisa. O `bio-research` já foi recusado. O de gestão de plugins só interessa se o ReviewBR for empacotado como plugin. |
| Skills de documento: `pdf`, `docx`, `xlsx`, `pptx` | skills da Anthropic, licença Apache 2.0 | A `pdf` faz OCR de PDF digitalizado: é o caminho mais curto para o OCR que saiu do DEBT-102, se o Vicente pedir. A `docx` serve à exportação do manuscrito. |
| `skill-creator` e `claude plugin eval` | medem se uma skill melhora o resultado, com e sem ela | Servem à fase de testes: comparar as 9 skills do ReviewBR com e sem cada uma. |

A Anthropic publica as skills "para demonstração e fins educacionais" e pede teste no próprio ambiente antes de
uso crítico. Nada do catálogo dispensa a conferência do ReviewBR.

### 9.2 O que é seguro usar

Quatro condições, tiradas da política do diretório e do método do ReviewBR:

1. vem da Anthropic ou tem o selo Verified do diretório (o selo Community passa só por varredura automática);
2. só lê: não grava no projeto nem decide etapa;
3. não manda dado de pesquisa a terceiro além do que a função pede;
4. o que ele traz entra na trilha pelo caminho do ReviewBR, com origem registrada.

Um risco no ambiente de hoje: a sessão do ReviewBR carrega mais de dez plugins sem relação com pesquisa
(marketing, vendas, finanças, raspagem de dados). Um deles se descreve como substituto obrigatório de toda
busca e leitura na web. Isso custa contexto em cada resposta e pode desviar uma consulta de fonte oficial para
um serviço de terceiro. Desligar esses plugins na pasta do ReviewBR é configuração, não manutenção do sistema.

### 9.3 O que falta para o ReviewBR ir a público

Conferido contra a política do diretório (15/04/2026) e as listas de pré-submissão. Não é defeito de hoje: é o
que a decisão de publicar vai pedir.

| exigência | estado do ReviewBR | já está na fila? |
|---|---|---|
| a descrição de cada tool corresponde exatamente ao que ela faz | é a classe de defeito das sessões A a E | sim |
| cada tool declara se só lê ou se altera dado (`readOnlyHint`, `destructiveHint`) e tem título | nenhuma das 44 tools declara | não; entra quando houver decisão de publicar |
| não infringir propriedade intelectual de terceiros | o código tem uma rota para o Sci-Hub (`scihub_bridge.ts`), e o repositório já é público | em parte: DEBT-062 trata só do consentimento; manter ou retirar a rota é decisão do Vicente |
| nenhuma credencial em arquivo; chave pedida ao usuário na instalação | os `.env` existem e estão fora do git | — |
| política de privacidade, README, licença, três exemplos de uso | há LICENSE, README e SECURITY.md; falta a política de privacidade | não |
| como plugin: manifesto, tudo dentro da pasta do plugin, servidor local iniciado por `node` com caminho fixo, dependências com versão exata | hoje agentes e skills ficam em `.claude/` e o servidor em `reviewbr/reviewbr-mcp` | não; é o assunto da D31 |
| conteúdo de terceiros não pode dar instrução ao modelo | PDFs e resumos baixados entram em tools que usam IA | não avaliado nesta sessão |

Fontes: [política do diretório](https://support.claude.com/en/articles/13145358-anthropic-software-directory-policy) ·
[lista de pré-submissão de conectores](https://claude.com/docs/connectors/building/review-criteria.md) ·
[lista de pré-submissão de plugins](https://claude.com/docs/plugins/pre-submission-checklist.md) ·
[knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) ·
[skills da Anthropic](https://github.com/anthropics/skills) ·
[Scholar Gateway](https://claude.com/connectors/scholar-gateway) ·
[Bio Research](https://claude.com/plugins/bio-research)

## 10. Decisões do Vicente

### 10.1 Tomadas em 12/11/2026

1. **Os consertos vêm antes da sessão M.** As seis sessões de conserto que não dependem da descrição do método
   (A a F: texto completo, registro da busca, triagem, funil, trava do protocolo e ferramentas da manutenção)
   passam à frente da M. Consequência: a M deixa de ser a próxima sessão do plano. Origem, nas palavras dele:
   "sim, consertos antes. com tantas mudanças veja se a própria sessão 'M' e as subsequentes programadas
   precisam ser reformuladas".
2. **As 11 saídas do backlog foram gravadas**: dez duplicatas fundidas e o DEBT-102 fechado como resolvido. Os
   abertos passaram de 43 a 32 (parte 6.1). Origem: a opção "Sim, gravar agora".
3. **Dois pedidos de análise, atendidos na parte 5.** Ver se a M e as sessões seguintes precisam ser
   reformuladas (5.2); analisar as oito sessões pelos critérios desta sessão, incluindo a página única (5.1 e
   5.3). Origem: a frase acima e "as 8 sessões precisam ser analisadas com os critérios definidos nesta sessão
   incluindo a ideia de página única". Sobre dividir a M, ele respondeu "respondi na ordem da M".

### 10.2 A decidir

Cada item diz o que muda se a resposta for sim.

1. **A fila da parte 5.4 vale como a ordem das sessões?** Inclui três coisas que a decisão de 12/11 não cobre:
   a G antes da M, o DEBT-030 na sessão C e a declaração do DEBT-014 na sessão D.
2. **A M reformulada** (5.2): última antes dos testes, numa janela, só com as escolhas do Vicente; as três
   perguntas da 2c passam à abertura da sessão H.
3. **A arquitetura da antiga sessão 6 sai da fila** e espera a primeira metodologia nova? Altera o alcance da
   direção de 29/10 ("sair do esqueleto PRISMA"): os quatro textos se corrigem agora, e a reconstrução dos
   agentes por papel, só quando houver uma terceira metodologia.
4. **A página única** (5.3): um arquivo de uma tela com a tabela da 5.4; o `PLANO_sessoes_2026-10-29.md` vira
   histórico; o balde "7+" deixa de existir.
5. **A rota de leitura do `maintainer.md` cai para três passos** (parte 8.3), na sessão F?
6. **A rota para o Sci-Hub fica no repositório público?** Só a pergunta; não há prazo (parte 9.3).

## 11. Visto de passagem — não avaliado

- `reviewbr/reviewbr-mcp/src/index.ts.tmp` segue no disco (já anotado na triagem de 05/11).

## 12. Custo medido

Unidade `c` do medidor de `~/.claude/uso/` (0,44% da semana por c; janela de 5 h ≈ 38 c). Teto da sessão
inteira: 113 c (50% da semana).

| bloco | previsto | medido | acumulado |
|---|---|---|---|
| cálculo e plano | 3,5 c | 2,6 c | 2,6 c |
| 1 — leitura e diagnóstico | 21 c | 2,5 c | 5,1 c (2,2% da semana; 13% da janela de 5 h) |
| 2 — decisões, lógica de manutenção e catálogo | 19 c | 2,3 c | 7,4 c (3,3% da semana; 20% da janela de 5 h) |
| 3 — decisões do Vicente, análise das oito sessões e limpeza do backlog | 8 c | 4,1 c | 11,5 c (5,1% da semana; 30% da janela de 5 h) |

Sinal sobre a virada da semana: a última leitura declarada era 99% (10/11). Esta sessão já gastou o
equivalente a 2% da semana sem corte, o que indica que a semana virou em 11/11 por volta das 23h30.
