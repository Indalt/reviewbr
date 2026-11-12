---
name: prisma-rigor-gates
description: Conferência das regras e subregras de rigor de uma revisão — os invariantes anti-viés RV-01..RV-08 (uns com verificação por tool, outros conduta declarada [NÃO COBERTO]), a completude dos subitens da spec (conferida pelo agente, sem tool) e a cobertura dos checklists PRISMA 2020 e PRISMA-S pela trilha do método (check_standard_coverage). Use ao conduzir ou revisar qualquer fase para garantir protocolo travado, números que emergem do processo, aritmética do funil que fecha e origem rastreável, sabendo o que uma tool confere e o que fica com o agente. Um gate reprovado bloqueia o avanço.
---

# Gates de Rigor — todas as regras e subregras

Rigor não é autocertificação do agente — e esta skill diz **onde há verificação determinística (por tool) e onde não há**. Onde há, o agente produz o insumo, a tool aprova ou reprova e o orquestrador só avança com verde. Onde não há, está escrito `[NÃO COBERTO]`: a conferência é do agente e a decisão é do pesquisador, sem fingir que uma tool conferiu. A conferência tem **três camadas**, todas obrigatórias.

## Camada 1 — Invariantes anti-viés (RV-01..RV-08) — NUNCA desligáveis

| Regra | O que garante | Verificação | Reprovação bloqueia |
|---|---|---|---|
| **RV-01** | Protocolo fechado antes da busca | `submit_protocol_for_approval` (score 0–3; sem `[TBD]` obrigatório) | acionar o `librarian` |
| **RV-02** | Números emergem do processo, não digitados | `compute_flow_counts` deriva o funil dos artefatos e reprova quando eles não fecham; `export_dataset` recalcula e compara com o `prisma_flow.json` | o export, se o `prisma_flow.json` divergir do recalculado ou os artefatos não fecharem |
| **RV-03** | Campos ausentes = `[TBD]`, nunca inventados | `[NÃO COBERTO]` — conduta de todos os agentes; nenhuma tool confere o invariante | — |
| **RV-04** | Toda decisão do pesquisador fica registrada | `record_researcher_decision` grava; `podeAvancar` confere | sob `estrito`, avançar de etapa sem decisão registrada do pesquisador sobre a que se encerra |
| **RV-05** | Aritmética do fluxograma fecha | `validate_prisma_flow` (e o mesmo validador dentro do `export_dataset`) | o export do dataset; o manuscrito não é barrado por tool |
| **RV-06** | MCP executa, não decide | `[NÃO COBERTO]` — conduta: o orquestrador confere só que toda tool tem papel dono | — |
| **RV-07** | Strings derivam do protocolo aprovado | `[NÃO COBERTO]` — conduta: nenhuma tool confere a string contra a F1.4; o log PRISMA-S guarda a string exata de cada busca | — |
| **RV-08** | Origem rastreável (repositório+instituição+URL) | validação em `export_dataset`; `audit_methodology` só diagnostica | o export; a síntese não é barrada |

Os manifests dizem o mesmo: `gates` para o que uma tool barra, `invariants_sem_gate` para o que é conduta.

## Camada 2 — Completude granular dos subitens (a spec inteira, não só as RV)
Cada fase tem subitens obrigatórios na spec do método (`.claude/methodologies/<metodo>/spec.md`). **`[NÃO COBERTO]` por tool: nenhum gate confere a completude dos subitens** — os gates do manifest são por invariante. A conferência é sua: confira que **todos os subitens marcados obrigatórios (✅) estão preenchidos ou explicitamente `[TBD]`** — nenhum silenciosamente ausente — e leve ao pesquisador o que faltar:
- **F0**: F0.1.1–F0.1.9 (identidade), F0.2.1–F0.2.5 (registro, se o método exigir), F0.3.1–F0.3.4 (justificativa).
- **F1**: F1.1.1–F1.1.3 (questão/framework), F1.2.x (PICOS/PCC completo), F1.3.1.x/F1.3.2.x (elegibilidade), F1.4.1–F1.4.5 (strings + booleanos + vocabulário + aprovação + versão).
- **F2**: F2.1.1.x (identificação da fonte), F2.1.2.x (execução: string exata, data, filtros), F2.1.3.x (resultados brutos), F2.2.x (outros recursos).
- **F3**: F3.1.1–F3.1.10 (método, critérios, contagens, pares, conflitos).
- **F4**: F4.1.x + F4.2.x (contagens por fase) e F4.3 (motivos EX-01..EX-11 derivados de F1.3 — o código é atribuído pelo pesquisador; nenhuma tool o grava, DEBT-026).
- **F5**: F5.1.x (processo) + F5.2.x (todos os campos por estudo, incluindo origem RV-08).
- **F6** (se ativa): ferramenta, domínios, julgamentos. `[NÃO COBERTO]` — risco de viés não tem tool nem gate (o manifest declara a F6 sem artefato e sem tool): é julgamento do agente e decisão do pesquisador.
- **F7** (se ativa): tipo de síntese, medida de efeito, heterogeneidade. A certeza da evidência (F7.3) não é gate: nenhuma tool a confere — está declarada `[NÃO COBERTO]` por tool na spec do método; o agente propõe, o pesquisador decide (DEBT-008).
- **F8**: F8.1.1–F8.1.10 (todos calculados), F8.2 (colunas obrigatórias da tabela), F8.3.1–F8.3.27 (seções do manuscrito), F8.4.x (disponibilidade).

## Camada 3 — Checklists de conformidade (suplementos obrigatórios)
Antes de declarar a revisão pronta, **chame `check_standard_coverage`** para cada padrão do
método, com `projectPath` = a raiz do projeto — o método é o do `project_state.json`, e as
respostas do pesquisador às condições do método entram na conta — não confira "de olho": é a
verificação determinística, a mesma classe de `validate_prisma_flow` (RV-05). Sem projeto
a tool confere contra todos os métodos que declaram o padrão, e a fração sai por método. **Ela confere a
trilha do método contra o padrão — que subitem da trilha atende cada item —, não o que o seu projeto
preencheu**: item coberto pela trilha pode estar vazio no projeto, e conferir o preenchimento é da
Camada 2. Ela olha quatro coisas na trilha e no
mapeamento de cada método (DEBT-140, DEBT-142): **(a)** o subitem apontado existe na spec e cai numa
etapa que se aplica; **(b)** a conferência por palavras compara o rótulo do subitem com o título do
item — é ajuda para quem assimila a metodologia e não entra no veredito (DEBT-149); **(c)** se
alguma tool produz o artefato da etapa ou só o agente; **(d)** toda linha está coberta ou declarada
`[NÃO COBERTO]` / `[NÃO SE APLICA]`.
- **SUP.1 — PRISMA 2020**: `check_standard_coverage("prisma-2020")` — 27 itens (42 linhas
  contando subitens a/b/c). Os 21 subitens que a trilha não mapeia estão declarados `[NÃO COBERTO]`
  no mapeamento do `prisma-sr` (DEBT-014): vão ao checklist como não cobertos, e não param a F8.
- **SUP.2 — PRISMA-S**: `check_standard_coverage("prisma-s")` — 16 itens (S1–S16).
- Demais suplementos do `manifest.json` (`supplement_search_prisma_s.md`, `dedupe_report.md`, `screening_report.md`, `change_log.md`, `audit_summary.md`, ...).

**Leia o veredito com o limite que vem junto** (`limite`): a tool confere o que é mecânico, não se o
mapeamento está certo — isso se confere ao assimilar a metodologia, lendo a norma. O suspeito da
conferência por palavras (`conferencia_por_palavras`, nos `avisos`) não reprova nem contesta: é
pedido de leitura ao `maintainer`, não pendência do pesquisador, e o relatório diz quanto ela
enxerga em cada mapeamento (`quanto_enxerga`, com a medida e a fonte). E não confunda as três
situações de uma linha:
- **`orphans`** — sem cobertura e sem declaração: omissão silenciosa, **impede a finalização**.
  Reporte ao pesquisador em vez de gerar o suplemento como se estivesse completo.
- **`[NÃO COBERTO]`** — lacuna do sistema, declarada: o item vai ao checklist como não coberto
  pela trilha, e cobri-lo por conta própria ou declará-lo no manuscrito é decisão do pesquisador.
- **`[NÃO SE APLICA]`** — não é falha: o item vai ao checklist como N/A, com o motivo.
- **`condicionais`** — item cuja aplicabilidade depende da pesquisa: o método declara a condição,
  e só a resposta do pesquisador (`record_researcher_decision`) o tira do denominador. Sem
  resposta, conta como o método o declarou: pergunte, não presuma.

`valid=false` **bloqueia** declarar o checklist completo — por omissão silenciosa, título fora da
fonte oficial, mapeamento ilegível ou ponteiro para subitem que não existe ou etapa desligada, ou
declaração dupla; nunca por suspeito da conferência por palavras. A `fracao` (ex.: 12/26) é o que se
pode afirmar — nunca a arredonde para "coberto".

## Regra de ouro
Um gate **vermelho para tudo**. Nunca contorne: corrija o insumo e re-rode a verificação, ou leve a decisão ao pesquisador. Foi a ausência de um agente que **chamasse** essas verificações no momento certo (não a ausência delas) que travou o sistema antigo — `validate_prisma_flow` (RV-05) já existia e nunca era chamada.
