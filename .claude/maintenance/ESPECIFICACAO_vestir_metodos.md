# Especificação — o ReviewBR vestindo métodos

> **Para quem executa:** o chat do agente de manutenção. Isto não é documento de reflexão — é o
> que fazer. As decisões já foram tomadas pelo Vicente (09/10/2026) e estão marcadas **[D]**.
> Furo da especificação: pare, registre achado, leve ao pesquisador. Não decida por ele.

**Entra por:** `DECISOES_2026-10-08.md` (direção) → aqui (execução).

> **ESTADO EM 09/10/2026 — os quatro itens desta especificação estão EXECUTADOS, REVISADOS e
> fechados no backlog**, cada um com o detalhe no `resolution` (`audit_system_debt`):
> §1 `DEBT-140` · §2 `DEBT-100` · §3 `DEBT-010` · §4 `DEBT-095` + `DEBT-126`. Uma revisão
> independente (três lentes: fidelidade, correção, honestidade) achou 21 pontos; os que eram
> defeito foram corrigidos e estão no `resolution` de cada item. Suíte 349 testes / 31 arquivos
> verde, build em dia. Abertos por esta execução: `DEBT-141` (atualização do catálogo apaga
> campos), `DEBT-142` (mapeamento e declarações só por padrão — decisão), `DEBT-143` (a trava do
> RV-04 não tem tool que grave a decisão do pesquisador).
>
> **Decidido pelo Vicente em 17/10/2026, e executado:** §5 resolvido — o `prisma-sr` declara o
> PRISMA-P (norma do protocolo da revisão sistemática; "as metodologias são bem descritas") e a
> cobertura dele contra a trilha é 12/26, com as 14 lacunas declaradas; a decisão do pesquisador
> é gravada por tool (`record_researcher_decision`, `DEBT-143` fechado); §6 é o próximo trabalho.
> Anotado a pedido dele: o LeapSpace (Elsevier), disponibilizado pela CAPES desde 03/07/2026, não
> foi visto pela manutenção — `DEBT-144`, com a análise do porquê.
>
> **Decidido pelo Vicente em 17/10/2026 (segunda rodada), e registrado:**
> - *"se existe metodologia, vamos assimilar. não há porque divagar."* — diretriz geral, escrita no
>   `maintainer.md`. Cada proposição de pesquisa tem de ter o seu método, e ajuda para escolher.
> - A cobertura vira TRAVA na escolha de método só depois dos mapeamentos corrigidos — `DEBT-145`,
>   com `depende_de` DEBT-014, 045, 055 e 128.
> - *"cada metodologia com as suas regras"*; método que aplica partes de outro é método único —
>   `DEBT-142` (mapeamento e declarações por método). Levado a ele: o item que depende da PESQUISA
>   dentro do mesmo método (metanálise sim ou não) — proposta: o método declara a condição, o
>   projeto responde.
> - O tipo exploratório deixou de usar a trilha do `prisma-sr` e passa a recusar até haver método
>   exploratório assimilado.
> - Ferramentas de IA e infraestrutura brasileira: acompanhadas como contexto, não definidor —
>   `DEBT-144` fechado (passo 1b da rotina; o LeapSpace entrou no catálogo, `kind: ferramenta_ia`).
>
> Confirmado por ele na rodada seguinte: 1, 2 e 3 "ok" (inclusive o item condicional — o método
> declara a condição, o projeto responde); 4 "parece ok".
>
> **§6, a reclassificação da fila — FEITA em 18/10/2026, esperando as decisões do Vicente.** A
> primeira tentativa (17/10) caiu no limite de sessão; a evidência que dois lotes já tinham colhido
> foi resgatada das transcrições e a reclassificação foi retomada (workflow `wf_9ed1cbe7-810`).
> Resultado em `RECLASSIFICACAO_fila_2026-10-18.md` (leitura) e
> `RECLASSIFICACAO_fila_2026-10-18.json` (dado): dos 56 abertos, 4 já resolvidos, 19 incompletude
> de método (declarar), 25 quebram pesquisa (consertar), 3 impedem vestir método, 5 fila de
> extensão; 14 perguntas ao Vicente, todas com recomendação "sim".
>
> **A PARTIR DE 29/10/2026 o trabalho segue em sessões únicas: `PLANO_sessoes_2026-10-29.md`** é a
> entrada (sessão 0 fecha a troca de computador; sessões 1–5 resolvem as 14 perguntas; método de
> trabalho e modelo de carta de sessão).
>
> **Registro do Vicente (09/10/2026):** os debts vinham sendo tratados para HABILITAR o agente de
> manutenção. Com a execução desta especificação a manutenção COMEÇOU, e não há volta atrás. A
> execução foi feita no **chat de execução do agente de manutenção**: a sessão seguiu o
> procedimento do `maintainer.md` (gate RV-11 antes de cada alteração, backlog pela tool depois,
> build e suíte verdes), conduzida pela sessão principal e não pelo subagente `maintainer`. O
> chat parou por falta de tokens, foi retomado quando eles foram liberados, e fechou aqui. O que
> falta decidir (acima) volta ao chat de trabalho sobre o agente de manutenção.

---

## A regra que organiza tudo

**[D]** *Tipo escolhe método; método traz trilha; trilha pede artefatos; a norma do método diz o
que precisa ser declarado — e o que não se aplica, declara-se que não se aplica.*

**As fases dependem do MÉTODO, não do tipo.** O tipo só filtra qual método serve. Se dois métodos
servirem ao mesmo tipo, terão trilhas diferentes, e quem decide é o método. Uma dependência, não
duas.

**[D] Cada norma inteira — nunca pedaço de uma com pedaço de outra.** Repetição **entre métodos**
é correta (são independentes). O que não pode repetir é no código.

---

## Já feito (09/10/2026) — não refazer

**O tipo filtra os métodos assimilados.** Cada metodologia declara `serves_research_types` no
próprio manifest; `escolherMetodo` (`src/services/methods_for_type.ts`) resolve ou **recusa**;
o `switch` com `default: prisma-sr` morreu. Tipo sem método assimilado deixou de virar `prisma-sr`
em silêncio. `tests/metodo_por_tipo.test.ts`, 11 testes. Fecha o `DEBT-121`.

**A lista de tipos continua fixa, e está certa assim** — palavras do Vicente: *"plan research deve
ser assim mesmo até que um método seja assimilado"*. O defeito nunca foi a lista ser fixa; era
oferecer 7 tipos com 2 trilhas atrás.

---

## 1. `DEBT-140` — tornar a cobertura verificável

Hoje `StandardsService.checkCoverage` testa **uma coisa**: se `covered_by` está vazio
(`standards.ts:164`). Como `covered_by` é dado fixo e versionado, a resposta é a mesma para todo
projeto, sempre: **verde por construção**. Foi assim que o PRISMA-P foi declarado 26/26 quando o
honesto é 12/26.

Passa a conferir quatro coisas:

| | conferência | mecanizável? |
|---|---|---|
| a | o subitem apontado **existe** na spec do método | sim, trivial |
| b | o rótulo do subitem **não contradiz** o que o item pede | sim, por falsificação — `mapping_coherence.ts` já faz e este gate **não o chama** |
| c | alguma coisa **produz** o artefato daquele subitem | parcial (foi assim que se achou que o manuscrito não existe em código) |
| d | a ausência está **declarada**, não preenchida com encaixe | sim |

**O que NÃO é mecanizável, e precisa estar escrito ao lado do resultado:** julgar se o mapeamento
está *certo*. Isso é leitura da norma, e é humana. O sistema **falsifica**; quem afirma é quem
assimila.

**[D] A premissa do falsificador tem de ser declarada onde o resultado é lido**, não só viver
dentro da função. Ela é: *um rótulo que contradiz o item declarado e corresponde a exatamente um
outro item é deslocamento.* É premissa **derrotável** — duas coisas podem se parecer sem haver
deslocamento —, e quem lê o veredito precisa saber sob que premissa ele foi dado.

### 1.1 Duas declarações distintas, e hoje não existe nenhuma

**[D]** Confundi-las esconde a segunda.

- **`[NÃO COBERTO]`** — o sistema ainda não implementa. **É coberível no futuro**; é fila de
  manutenção.
- **`[NÃO SE APLICA]`** — aquela pesquisa nunca vai cobrir, e isso **não é falha**. Casos reais:
  heterogeneidade e viés de relato numa revisão sem metanálise; avaliação crítica numa revisão de
  escopo (o JBI diz que geralmente não se faz); o item sobre estudos que atenderam aos critérios e
  foram excluídos, quando não houve nenhum; registro no PROSPERO para revisão de escopo, que o
  PROSPERO não aceita; plano de emendas em protocolo retrospectivo.

O próprio PRISMA prevê "não se aplica". O sistema precisa das duas.

---

## 2. `DEBT-100` — fases como dado

**Hoje:** o manifest declara `phases: { F0: true, …, F6: false }` — um **booleano por fase**. Um
método só consegue dizer *"esta fase da trilha do ReviewBR está ligada ou desligada"*. Não
consegue dizer quais são as suas etapas. Prova: o `scoping-prisma-scr` é o F0–F8 do `prisma-sr`
com `F6: false`. E os nomes estão escritos à mão no código: `project_state.ts:92` nasce em `"F1"`;
`index.ts` chama `podeAvancar(dir, "F3")`, `"F4"` e grava `phase: "F2"`.

**Passa a ser:** o manifest declara a **lista** de etapas — id, nome, ordem, que papel executa,
que artefato a encerra. O código **lê a lista**. Os literais de fase saem do código.

Efeito: um método de outra forma (definir corpus → trabalho de campo → transcrição → codificação →
saturação) **pode ser expresso**. Hoje só pode ser encaixado em oito fases que vieram do PRISMA.

A frase curta, para não se perder: hoje o sistema é agnóstico ao **conteúdo** das fases, não à
**forma** delas.

**Consequência no `DEBT-140`:** com fases como dado, o `covered_by` deixa de apontar para `F4.1.2`
(subitem da trilha do ReviewBR, herança do PRISMA) e passa a apontar para as etapas do próprio
método. A conferência (a) não muda; muda de quem são os ids.

---

## 3. `DEBT-010` — gatilho de obsolescência

**[D] Conferido quando o agente roda, não ao vivo.** Sem vigia, sem job de fundo: vira passo da
rotina de entrada — para cada padrão assimilado, reconferir o `version_source` na fonte e relatar.

Serve à longevidade pela razão certa: é **procedimento, não infraestrutura**. Nada novo para manter.

---

## 4. `DEBT-095` + `DEBT-126` — o pesquisador sabe o que está escolhendo

**[D]** *"o pesquisador pode não conhecer o método e poderia saber o que está escolhendo de fato."*

Na escolha, apresentar os métodos que servem ao tipo **com o contexto do catálogo** —
`what_it_is`, `when_to_use`, `requires`, com fonte oficial. O material **já existe como dado**
(`.claude/catalog/methodologies.json`); falta usá-lo. Hoje a rota da ideia até o protocolo é regex
e roteia só entre as implementadas (`DEBT-095`).

E durante a execução, o agente **explica o porquê da trilha** (`DEBT-126`). Executar sem explicar é
meia execução: o propósito declarado é informar e educar sobre os modos de pesquisar.

---

## 5. Pendência concreta: o `prisma-p` está órfão

```
prisma-sr          → conformance.standards: [prisma-2020, prisma-s]
scoping-prisma-scr → conformance.standards: [prisma-scr, prisma-s]
prisma-p           → declarado por NENHUM método
```

Eu assimilei o PRISMA-P e ele não pertence a método algum. É o sintoma exato da regra do §"cada
norma inteira": ou ele é declarado por um método (é a norma do **protocolo**, artefato anterior à
revisão), ou fica declarado como assimilado-e-não-usado. **Não deixar implícito.**

Taxonomia, para não repetir a confusão: **PRISMA 2020** é diretriz de *relato* da revisão
sistemática; **PRISMA-S** é extensão dele (itens 6, 7 e 8 — busca) e não existe sozinho;
**PRISMA-P** é do *protocolo*, outro artefato e outro momento; **PRISMA-ScR** é extensão
**substitutiva** para revisão de escopo — ocupa o lugar do 2020, não soma a ele.

---

## 6. Depois destes quatro: a reclassificação da fila

Com (1) e (2) prontos, ~24 dos achados abertos **deixam de ser defeito do sistema** e passam a ser
incompletude declarada de um método instalado — invariante sem gate, mapeamento deslocado, log sem
verificador, item 8 com um campo em vez de quatro, risco de viés sem tool. O conserto deles é
**declarar**, não construir.

As gavetas, no vocabulário que vale (nenhuma nomeia método):

| gaveta | o que fazer |
|---|---|
| **impede vestir método** | é o trabalho |
| **incompletude de um método instalado** | declarar `[NÃO COBERTO]` ou `[NÃO SE APLICA]` |
| **quebra pesquisa, com método ou sem** | manutenção comum — fica de pé em qualquer cenário |
| **ainda não existe** | fila de extensão, não dívida |

---

## 7. UX — é do pesquisador, e sai de graça se o resto estiver certo

**[D]** *"o agente de manutenção pode trabalhar em cima do que chamei de ux para que um pesquisador
não se complique com muita informação acessória."*

Se o pesquisador vir **só o que o método dele pede**, a informação acessória desaparece sozinha —
não é tela nova, é consequência de o sistema saber de que método se trata. É isto que o Vicente
chamou de *"ciência aplicada e não confusão"*.
