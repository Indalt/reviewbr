# Direção — de aplicador de PRISMA a ferramenta que veste métodos

> **Decidido pelo pesquisador em 04/10/2026.** Leia junto com `DECISOES_2026-10-03b_reverificacao.md`.
> Este documento fixa o RUMO e o CORTE; a ordem operacional está no fim.

## O que muda, nas palavras do pesquisador

> *"não é mais um sistema de aplicação do PRISMA. vamos virar uma ferramenta de pesquisa de uma
> forma geral que pode **vestir** diversos métodos e isso de uma forma sutil **informa e educa** o
> pesquisador que não sabe, por exemplo, que existem vários modos de pesquisar."*
>
> *"o sistema novo não precisa ser complexo e difícil, ele precisa ter as capacidades que declara
> **de verdade** e ser confiável."*
>
> *"qualquer metodologia existente ou que pode vir a existir poderia ser assimilada pela aplicação."*
>
> *"engenharia libera mas fica registrado que **assimilação é automatizada**. o modo como
> automatizar poderia ser discutido."*

E, sobre padrão anunciado e não implementado (caso PRISMA-P):

> *"se hoje são fantasmas, a função do briefing deveria ser **consertar** o modo de pesquisar."*
> → **Decisão: implementar o padrão, não apagar a menção.**

---

## 1. O diagnóstico: a arquitetura existe e não está ligada

O sistema **já tem** as três camadas certas, e isso é a boa notícia:

| camada | onde | estado |
|---|---|---|
| **conhecer** — o mapa dos métodos | `.claude/catalog/methodologies.json` | **107 entradas**, 15 delas `review_method`, todas com fonte oficial |
| **a norma como dado** | `.claude/standards/*.json` | **só 3**: prisma-2020, prisma-s, prisma-scr |
| **executar** — a trilha | `.claude/methodologies/<id>/manifest.json` | **só 2**: prisma-sr, scoping-prisma-scr |

O `manifest.json` **já é uma definição declarativa de trilha**: fases com `active: true/false`, gates,
frameworks de pergunta, suplementos obrigatórios, templates, pastas do projeto.

**O furo (`DEBT-121`):** nenhum código de runtime de revisão lê esse manifest. Quem governa a trilha
é o enum `ResearchType` (`project_init.ts:32-39`, 7 valores fixos) e `RESEARCH_TYPE_META`. Criar
pasta de metodologia nova **não faz o sistema executar aquela trilha**.
*Controle positivo:* `grep "join(.*standards"` acha leitura real em `standards.ts:87`;
`grep "join(.*methodologies"` só acha listagem e manutenção.

**A ponte já está construída e nunca é atravessada:** `project_state.json` grava o campo `method`
(`project_state.ts:25`, escrito em `project_init.ts:219`) e o único leitor do estado
(`protocol_gate.ts:93`) consulta apenas `st.status`.

É a mesma classe de falha de todo o resto desta semana: **capacidade declarada, nada a invoca.**

---

## 2. A descoberta que torna a automação defensável

A pergunta difícil era: **como assimilar metodologia automaticamente sem nunca inventar metodologia?**

A resposta está numa assimetria:

> **O sistema NÃO consegue gerar o mapeamento certo, mas CONSEGUE provar que um mapeamento proposto
> está errado. Falsificação é automatizável; geração não é.**

A linha do que automatiza não é "catálogo vs. norma vs. implementação" — é a **natureza da asserção**:

| natureza | exemplo | verificável por | automatiza? |
|---|---|---|---|
| **transcrição** | "o PRISMA-P tem 17 itens" | contagem + citação literal + 2ª fonte | **sim, integral** |
| **estrutura** | "6 itens têm subitens; 42 linhas" | aritmética que fecha | **sim** |
| **mapeamento** (`covered_by`) | "F8.3.15 cumpre o item 15" | **nada externo — é julgamento** | **não decide; o sistema FALSIFICA** |
| **adequação** | "Umbrella Review serve aqui" | nada | **nunca** (RV-04) |

### A prova de que isso importa — verificado, não suposto

`checkCoverage` (`standards.ts:114-147`) só testa `covered_by.length === 0`. **Mapeamento apontando
para o item errado volta VERDE.** Cruzando os rótulos da spec com os títulos oficiais:

| subitem | rótulo na spec | título oficial do item para onde aponta |
|---|---|---|
| F8.3.14 | Certeza da evidência | Reporting bias assessment ✗ (o certo é o 15) |
| F8.3.15 | Registro e protocolo | Certainty assessment ✗ (o certo é o 24) |
| F8.3.24 | Financiamento | Registration and protocol ✗ |
| F8.3.25 | Conflito de interesses | Support ✗ |
| F8.3.26 | Disponibilidade de dados | Competing interests ✗ |
| F8.3.27 | Informações adicionais | Availability of data… ✗ |

Itens 1–13 casam; de 14 em diante há deslocamento sistemático. **São os 6 do `DEBT-045`, e os 6
reportam "coberto" hoje.** *Controle negativo:* a hipótese simples "F8.3.N cobre o item N" **não**
detecta — pela posição os 27 parecem coerentes. O erro só aparece comparando o **sentido** do rótulo
com o título oficial. Registrado como **`DEBT-124`**.

Sem esse falsificador, um LLM gerando `covered_by` reproduziria o `DEBT-045` em escala — com o
sistema dizendo verde. **Com ele, a automação da assimilação fica auditável por máquina.**

---

## 3. O pipeline de assimilação

Padrão do sistema: *agente produz insumo → verificação determinística aprova → só avança no verde.*

| | etapa | automático | pesquisador | verificação |
|---|---|---|---|---|
| E0 | intenção → achar no catálogo | sim | — | entrada existe com `source_url` — **já pronto** |
| E1 | absorver no catálogo | sim | nada | `source_url` http, campos não vazios — **já pronto** |
| E2 | que norma o método exige | propõe de `related_standards` | **1 pergunta** | id existe ou entra em E3 |
| E3 | extrair a norma → `standards/<id>.json` | sim | só divergências | **3 controles, abaixo** |
| E4 | mapear `covered_by` | **propõe** | **decide** | falsificador do §2 |
| E5 | scaffold da implementação | sim | completa `[TBD]` | `scaffold_methodology` — **já pronto** |
| E6 | o manifest governar a execução | — | — | **é o `DEBT-121`** |

### Os três controles que impedem a extração de virar invenção (E3)

1. **Contagem declarada** — `item_count` já existe no catálogo (o PRISMA-P registra *"17 itens de
   topo; 26 linhas contando subitens"*, com `notes` dizendo que é a formulação dos próprios autores).
   Extração que não fecha a contagem **reprova**. Pega inserção e omissão; não pega substituição.
2. **Ancoragem literal** — cada item carrega `source_quote` com o trecho da fonte. Verificação:
   o texto está mesmo no documento baixado. Transforma "o modelo afirma" em "o documento diz, e
   aqui está onde". É a mesma régua do `source_url` obrigatório em `absorb_methodology`.
3. **Dupla extração independente** — duas passagens, fontes distintas quando possível, diff
   determinístico. Só o que divergir vai ao pesquisador.
   **Não é invenção nossa:** `prisma-scr.json` já documenta exatamente esse procedimento, aplicado à
   mão, resolvendo uma discrepância do rodapé oficial. O desenho só mecaniza o que já funcionou.

### E2 é mais barato do que parecia

As 15 `review_method` não precisam de norma nova — precisam **referenciar** a certa. `related_standards`
já aponta: `jbi-umbrella-review` → "PRISMA 2020, AMSTAR 2, JBI Checklist"; `jbi-scoping-review` →
"PRISMA-ScR". **Consequência:** a trava de `scaffold_methodology:244-251` (padrão declarado precisa
existir) **não é defeito** — é a porta certa, que impede metodologia sem norma de nascer. O que falta
é o caminho E3 que a destrava, e isso é **etapa a construir**, não conserto.

---

## 4. Assimilação é completa, ou não é — e ferramenta ≠ resumo

> **Correção de 04/10/2026.** A versão anterior desta seção propunha graus de completude
> (CATALOGADA / ESQUELETO / **PARCIAL** / COMPLETA), em que uma metodologia parcial podia
> *executar o funil* desde que não assinasse conformidade. **Isso foi recusado pelo
> pesquisador, e a recusa está certa:** eu tinha inventado um estado intermediário para
> resolver um problema de custo que não existe.

**A regra, nas palavras dele:**

> *"As metodologias sempre devem ser assimiladas completas. Normalmente são textos que não
> ocupam espaço substancial em disco ou no servidor MCP e não geram dificuldade."*
>
> *"Não deve haver confusão entre resumo de algo — seja de trabalho, seja de método — com as
> **ferramentas que podemos ofertar**. As ferramentas são sempre completas e funcionais.
> Resumir para educar ou informar não é proibido: já é claro que são coisas diferentes, e
> acionadas de modo diferente."*

Os números confirmam que não há custo a otimizar: o maior padrão tem **12 KB**; as duas
metodologias somam **58 KB**.

### As duas coisas, e o que separa uma da outra

| | o que é | regra |
|---|---|---|
| **Ferramenta ofertada** — metodologia em `.claude/methodologies/` | a trilha que o sistema **executa** | **completa e funcional, sempre.** Sem campo por preencher, sem gate vazio, sem padrão declarado e ausente. Ou entra inteira, ou não entra |
| **Resumo para informar** — entrada no catálogo | o mapa do que existe na literatura | legítimo, e **acionado de outro modo**: orienta a escolha, nunca executa. Nenhuma entrada do catálogo é trilha |

**O que isso elimina:** não existe metodologia "em uso pela metade". O erro que o grau de
completude criava era permitir que o sistema **ofertasse como ferramenta** algo meio
assimilado — e trilha meio assimilada é a que executa sem que o sistema saiba fundamentá-la
ao pesquisador (`DEBT-126`).

### A condição de entrada, e quem a cumpre

> *"Não deve haver metodologia assimilada sem estar **validada externamente e completa**. A
> função da manutenção é resolver estes problemas e inclusive **atualizar o que existe**.
> Então o agente de manutenção, que só é acionado pelo administrador, pode ter acesso à
> internet."* — 04/10/2026

Duas condições, ambas necessárias, nenhuma suficiente:

| | o que significa | onde se verifica |
|---|---|---|
| **validada externamente** | a norma tem fonte oficial, e o arquivo **demonstra** qual foi lida | `version_source` em `.claude/standards/` |
| **completa** | sem campo por preencher, sem gate vazio, sem padrão declarado e ausente | `MethodologyWriter.validar` reprova |

**O acesso à internet do maintainer é consequência disso, não concessão.** Manter padrão
atualizado exige ler a fonte; sem acesso, a manutenção não cumpre a própria função — foi o que
travou o `DEBT-129` (PRISMA-P) e o que fez o `DEBT-052` depender de leitura feita antes, por
outra sessão. Apurado em 04/10: **o acesso nunca foi barrado por decisão** — os sete agentes da
trilha sempre tiveram `WebSearch`/`WebFetch`, e a ausência no maintainer era omissão. As
proibições de busca que existem no sistema são de **papel** (o `reader` não busca porque lê o
corpus curado), não de acesso.

**A fronteira que permanece:** consultar fonte **metodológica** é manutenção; buscar
**literatura para uma revisão** é pesquisa, e segue proibida ao maintainer.

### As três camadas — a separação já existe, não há o que inventar

Decidido em 04/10/2026: *"basta separar o que existe do que temos assimilado. Me parece que essa
separação já existe em `standards` dentro de `.claude`. Não há por que confundir."*

| camada | o que é | como demonstra a validação |
|---|---|---|
| `catalog/` | o que **existe** na literatura — 107 entradas | `source_url` obrigatório: onde a norma está completa |
| `standards/` | o que está **assimilado** — a norma como dado | `version_source` com a citação da fonte oficial |
| `methodologies/` | a trilha que **executa** | `conformance.standards` → aponta para os assimilados |

**Por isso não se acrescenta campo de fonte à metodologia** (era o `DEBT-127`, recusado): ela
aponta para os padrões, e cada padrão já declara a sua validação. Um terceiro lugar dizendo o
mesmo é a condição para divergir — o defeito que o `DEBT-122` acabou de consertar.

**A regra, e onde ela morde:** só entra o padrão que demonstra a própria validação. Hoje
`prisma-2020` e `prisma-scr` demonstram; **`prisma-s` não** — entrou com `[A VERIFICAR]`. É o
`DEBT-052`, e é leitura de fonte, não engenharia.

### Metodologia não assimilada: sob demanda do administrador

> *"Metodologias que não estão assimiladas ainda só serão assimiladas **sob demanda do
> administrador**, que sou eu. Para que eu ou qualquer pessoa possa usar uma metodologia nova
> ou não assimilada, precisamos de algum tipo de **resumo dela e do local onde ela existe
> completa**."*

Isso fecha o que o catálogo é e o que ele não é: **resumo + ponteiro para a fonte**, para que o
pesquisador saiba que o método existe e onde lê a norma inteira. Não é metodologia pela metade,
e não vira trilha sozinho. A assimilação é um ato do administrador, não um efeito colateral de
alguém consultar o catálogo.

### Onde isso já está no código

`MethodologyWriter.validar` **reprova** spec com campo por preencher — binário, sem estado
intermediário. A verificação distingue **campo pendente** (`| Framework | [TBD] |` ou
`[PREENCHIMENTO OBRIGATÓRIO`) de **menção à regra** RV-03: a primeira versão da trava contava
toda ocorrência de `[TBD]` e reprovava as duas metodologias reais por *citarem* o invariante,
o que seria reprová-las por estarem bem documentadas. Testes em
`tests/maintenance_writes.test.ts`, com controle positivo contra as metodologias em disco.

---

## 5. Como o sistema educa sem virar palestra

O material já existe: `when_to_use` das 15 `review_method`. O momento é `assess_research_design`
(`index.ts:443`) — o único ponto em que o pesquisador já parou para decidir e ainda não gastou nada.
A tool `query_methodology_catalog` já tem permissão para o PROJETISTA (`agent_orchestrator.ts:109`);
ela simplesmente não é consultada.

A assimetria que já existe no código (`index.ts:471-475`, "Modo Direto" vs "Modo Guiado") vira a
política:

- **Modo direto** (o pesquisador informou o tipo — sabe o que quer): **uma linha**, no fim.
  *"O catálogo conhece 15 métodos de revisão; 2 estão implementados. `query_methodology_catalog`
  lista os demais."* Não é pergunta, não bloqueia, passa em 2 segundos.
- **Modo guiado** (o tipo foi inferido da prosa — o sistema está adivinhando): a educação é **devida**.
  No máximo **3** entradas, uma linha cada, com o default já escolhido e a pergunta sendo
  *"quer mudar?"* — nunca *"escolha entre 15"*.

O que torna isso honesto: o rótulo `[não implementado]` é **derivado do disco**. O sistema não
consegue sugerir um método e mentir que o executa; e quando a pasta existir, o rótulo vira
`[implementado]` sozinho.

**Não** colocar `when_to_use` no `protocol.md`: protocolo é artefato de publicação, não material didático.

---

## 5b. A isenção da ferramenta — decidido em 04/10/2026

> *"Normalmente as metodologias são ancoradas em teses científicas, e por isso não acho que
> precisamos que o sistema assuma uma cultura para além do que exige o método. Uma simples
> menção disso poderia denotar a **isenção** da nossa ferramenta, contanto que cada método
> tenha de fato um ancoramento e que isso seja **declarado**. Apenas o que ocorreu — fatos — e
> por que ocorreu — argumentos. Não precisa sujar o sistema com a história das ciências."*

**O ReviewBR não tem tese própria, e é daí que vem a sua isenção.** O rigor de uma revisão não
é conferido pela ferramenta: vem do método, que se ancora em literatura. Um sistema que
declarasse epistemologia própria estaria fazendo, um nível acima, o mesmo que o rótulo
"ML validado" fazia com o ASReview — emprestando autoridade científica ao software.

**O que a ferramenta deve garantir é verificável, não filosófico:** que cada método declare a
sua âncora, e que essa declaração seja conferível.

### Onde isso já vale, e onde não vale

| camada | exige âncora? | estado apurado em 04/10/2026 |
|---|---|---|
| **catálogo** — o que o sistema conhece | **sim**, `absorb_methodology` recusa sem `source_url` http | **107/107 com fonte.** ✅ |
| **padrões** — a norma como dado | parcialmente, via `version_source` | prisma-2020 e prisma-scr CONFIRMADOS; **prisma-s `[A VERIFICAR]`** |
| **metodologias** — o que o sistema executa | **declara o padrão** (`DEBT-047`, resolvido) | prisma-sr → `[prisma-2020, prisma-s]`; scoping → `[prisma-scr, prisma-s]` ✅ |
| **metodologias** — a fonte que as valida | **não exige ainda** | `NovaMetodologiaSchema` sem campo de fonte; zero URL nos manifests — é o `DEBT-127` |

**O que foi fechado e o que falta:** a metodologia já declara **contra que padrão** verifica
(`DEBT-047`). Falta declarar **onde está a validação externa dela** (`DEBT-127`) — são duas
coisas, e eu as tratei como uma só ao fechar o 047. Pelo critério do pesquisador, a segunda é
o que basta para a ferramenta se isentar.

### A regra que fica

> Nenhuma metodologia executa sem âncora declarada. O que o sistema registra é **o que ocorreu
> (fatos) e por que ocorreu (argumentos)** — não teoria, não história das ciências.

Isso é consequência direta do §4: metodologia se assimila completa, e **completa inclui a
âncora**. Sem ela a metodologia não entra — não existe o estado intermediário em que ela
executa e só não assina conformidade. A âncora não é ornamento no
manifest — é condição para a asserção de aderência existir.

---

## 6. A fronteira do modular

> **Varia o que distingue métodos legítimos; é estrutural tudo que, se variasse, deixaria o sistema
> mentir sobre o que fez.**

**Plugável (dado, no manifest):** fases ativas · framework de pergunta (PICOS/PCC/SPIDER) ·
meta-análise ligada/desligada · ferramentas de risco de viés · framework de certeza (GRADE/CERQual) ·
padrão de conformidade · suplementos obrigatórios · templates · pastas do projeto · registro obrigatório.

**Estrutural (código, lei):** RV-01 a RV-08 · números emergem de artefato · a aritmética do funil
fecha · origem rastreável · a decisão é do pesquisador · governança por papel · proveniência do
próprio método.

**O caso difícil, e a regra que o resolve:** `exploratory` não tem protocolo travado — isso parece
desligar o RV-01. Não desliga. `ProtocolGate` já trata: sem `projectPath`, a busca é exploratória,
passa e **nada persiste**. A distinção não é "invariante desligado", é "isto não está no funil".

> **Um invariante nunca é desligado por método. O que varia é se o artefato que ele protege chega a
> existir.** Scoping não roda RoB2 porque não há artefato de RoB para auditar — não porque o RV-08
> foi relaxado.

**`methodological_audit` fica fora do manifest**: não é método de revisão, é modo de operação (já tem
pastas próprias e pula o `ProjectStateService.init`). O enum não vai a zero — vai a **2**
(`exploratory`, `methodological_audit`), e isso é o correto, não resíduo.

---

## 7. Ordem e corte

**Critério:** é pré-requisito dos testes só o que, ausente, faz o teste **medir mentira**.

### Entra ANTES / durante os testes — automatiza a HONESTIDADE, não a assimilação

Nenhum destes toca o caminho de execução de uma revisão. São baratos e de alto retorno.

1. **`DEBT-124` — o falsificador de mapeamento.** Verificação determinística (zero LLM, zero rede)
   que cruza rótulo da spec × título oficial e marca **SUSPEITO**, sugerindo o item que casa. Não
   corrige: sinaliza (RV-04). Vira **teste que reprova enquanto o `DEBT-045` existir**.
   *Sem isto, testar uma revisão valida um mapeamento errado como verde — o teste certifica o defeito.*
2. **Grau de completude derivado + trava de asserção** (§4). Sem ele, qualquer teste que chegue ao
   manuscrito emite conformidade falsa.
3. **`DEBT-047` — `conformance.standards` nos 2 manifests.** Uma linha de JSON em cada; é insumo de 1 e 2.
4. **`DEBT-122` — a duplicata divergente e o PRISMA-P fantasma.** `index.ts:243` promete PRISMA-P e
   `.claude/standards/` não o tem. **Decisão: implementar** (§8), e unificar as duas
   `RESEARCH_TYPE_META`.

### Espera o FIM dos testes

5. **`DEBT-121` — o runtime obedecer o manifest.** É o rumo certo e é estrutural: mexe no caminho de
   execução de **toda** revisão, com 20 achados BLOQUEIA abertos. Fazer durante a fase de testes
   troca um problema conhecido por um desconhecido.
6. **E3 automatizada** (extração por agente). Tem dependência externa — rede, fonte, LLM. Até lá a
   absorção manual de norma continua funcionando: foi assim que o `prisma-scr.json` nasceu, e nasceu bem.
7. **E2/E5 para as 15 `review_method`.** Depende de 5 e 6.

### O que NÃO fazer

- **Remover valores do enum.** Ele encolhe por **teste** (contar os que não resolvem para pasta, e
  travar o número em disco), não por deleção.
- **Gates executáveis** (`DEBT-049`): o campo `blocks` é prosa em português, não predicado.
  Virar predicado é redesenho de schema no meio do teste.
- **Vocabulário canônico de fases / composição automática de trilha.** Pede conhecimento que o
  sistema não tem como dado: é metodologia inventada com engenharia por cima.
- **Criar os 13 manifests faltantes** antes de 5 e 6: cada um nasceria incapaz de gerar seu checklist.

---

## 8. O caso PRISMA-P, como prova do pipeline

O pesquisador decidiu **implementar**. O caminho concreto:

- **E0/E1 — já feito.** O catálogo tem `prisma-p` com `confidence: alta`, `source_url` (PMC4320440) e
  `item_count` *"17 itens de topo; 26 linhas contando subitens"*. Zero trabalho.
- **E2 — pular.** PRISMA-P **é** a norma.
- **E3 — automático.** Duas extrações independentes (PMC + a E&E no BMJ), validadas pelos três
  controles. O `StandardSchema` já suporta a estrutura com subitens.
  **Pesquisador: aceita a contagem e resolve divergências. Minutos.**
- **E4 — o custo real.** 26 linhas a mapear. O agente propõe com o título oficial ao lado, o
  falsificador marca os suspeitos. **Pesquisador revisa ~26 decisões.** É a hora humana, e é irredutível.
- **E5/E6 — não precisa de pasta nova.** PRISMA-P é norma adicional do `prisma-sr`:
  `conformance.standards: ["prisma-2020", "prisma-s", "prisma-p"]`. Resolve o `DEBT-047` de carona, e
  `index.ts:243` deixa de mentir.

### A honestidade sobre o ganho

O pipeline reduz E1 e E3 a quase zero — transcrever 26 itens e conferir passa de horas para minutos
de revisão. **Não reduz E4:** o mapeamento continua sendo trabalho humano de cabeça. O ganho ali não
é volume, é **erro**: o pesquisador decide com o título oficial ao lado e os suspeitos pré-sinalizados,
em vez de decidir às cegas — que é exatamente como os 6 erros do `DEBT-045` entraram e ficaram verdes.

**Se o critério for "o humano não mapeia", o pipeline falha** e não adianta fingir o contrário:
`covered_by` não tem referente externo. Se o critério for "o humano só faz o que exige julgamento, e
erra menos", entrega.

---

## 9. Achados que esta direção abriu

| id | o quê | gravidade |
|---|---|---|
| `DEBT-121` | a modularidade de método é só de papel: nada lê o manifest | BLOQUEIA |
| `DEBT-122` | `RESEARCH_TYPE_META` duplicado e divergente; promete PRISMA-P inexistente | SERIO |
| `DEBT-123` | ~~`scaffold_methodology` não atende 13 dos 15 métodos~~ — **RECUSADO**: era escopo, não defeito (ver abaixo) | — |

### Uma distinção que precisa ficar clara

**Defeito** é o sistema afirmar o que não cumpre — e existe hoje, independentemente de a manutenção
ter começado. **Ausência** é o que ainda não foi construído *porque é o que vamos construir*.

Os 13 métodos sem pasta, os padrões que faltam em `.claude/standards/` e o que falta ligar de uma
correção em curso **não são achados: são o escopo deste trabalho.** Registrá-los no backlog faz a
mesma tarefa aparecer duas vezes na fila e confunde a decisão — exatamente o que o backlog existe
para impedir. Por isso `DEBT-120` e `DEBT-123` foram recusados, com o motivo registrado.

O que vale registrar como achado é o que **mente**: cobertura reportada verde sobre mapeamento
errado, padrão prometido e inexistente, promessa de modularidade que nada sustenta.

---

## 10. A triagem de 04/10/2026 — o que saiu da fila, e com que prova

O pesquisador perguntou: *"que debts são exageros quando as metodologias são travas o suficiente?
quais não são essenciais para que a aplicação não prejudique uma pesquisa?"* — e precisou a
leitura: *"se o sistema é para que pesquisas sejam feitas, a lógica me manda não focar em uma
pesquisa qualquer em particular. o ReviewBR não prejudicando uma pesquisa é o que digo sobre o
sistema."*

**O critério, portanto:** alguma pesquisa conduzida com este sistema seria prejudicada — publicar
algo falso, perder dado elegível, decidir errado — por este achado estar aberto?

Três lentes independentes (pesquisador que publica, metodologista, cético que quer encurtar a
fila) classificaram os 81 abertos; 27 divergiram e foram a arbitragem. Os candidatos a recusa
passaram por um **verificador por achado, instruído a contestar a recusa** e a manter em caso de
dúvida. O resultado item a item está em
[`verificacao_recusas_2026-10-04.json`](verificacao_recusas_2026-10-04.json), com o caminho até
artefato publicado (ou a ausência dele) e o texto que foi para cada `resolution`.

**A contestação valeu a pena: 5 dos 13 verificados voltaram como MANTER**, quatro deles com
caminho verificado até o manuscrito. Dois subiram para BLOQUEIA:

- **`DEBT-018`** — todos os 8 subagentes têm `Write`/`Edit`, e `ProtocolGate` confia no *conteúdo*
  do arquivo, não na procedência: dá para trocar `[DRAFT]` por `[LOCKED]` sem passar pelo auditor,
  e o manuscrito afirma protocolo travado a priori sobre protocolo nunca aprovado.
- **`DEBT-060`** — a mesma classe no funil: `flow_computer` detecta edição manual do
  `prisma_flow.json` derivado, mas **nada protege os arquivos de origem**, e o `checkExportGate`
  nunca recomputa a partir do corpus. Funil forjado que fecha a aritmética passa no gate.

**Lição de método:** recusar na minha palavra teria removido cinco achados reais. A contestação
adversarial é o que separa "encurtar a fila" de "esconder defeito".

### 11. O que falta para encerrar a revisão do agente de manutenção — apurado em 08/10/2026

O pesquisador perguntou: *"estes últimos debts talvez tenham resolvido muitos debts anteriores.
Que debts faltam para encerrar a revisão do agente de manutenção?"* A hipótese se confirmou, e a
verificação item a item está em
[`verificacao_abertos_2026-10-08.json`](verificacao_abertos_2026-10-08.json) — os 62 abertos
conferidos contra o código atual, em quatro lotes por gravidade, com a instrução de responder
ABERTO na dúvida.

**Resultado:** 4 **vencidos** (a premissa caducou: `DEBT-004`, `009`, `020`, `073`) e 20
**parciais** — metade de um achado corrigida, metade de pé. Parcial é o estado mais comum, e é
honesto: dizer "resolvido" sobre meio conserto seria a asserção falsa que o sistema existe para
impedir.

**Critério de encerramento, aplicado:** só trava o que impede o agente de trabalhar ou faz o
sistema afirmar o que não cumpre. Dos 35 que os verificadores marcaram como travando, **23 têm
destino `METODOLOGIA_NOVA` ou `CONFORM_EXTERNA`** — que é **escopo**, e o pesquisador já decidiu
que escopo não é achado (§9). Sobram **12**.

| `DEBT-124` | `checkCoverage` verifica existência, nunca correção: mapeamento errado volta verde | BLOQUEIA |
