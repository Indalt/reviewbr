# Manifesto de conformidade — ReviewBR

**Estado:** levantamento do estado atual em 24/09/2026
**Atualizado em 24/09/2026** com a RV-11 (§1) — a primeira alteração a passar pelo próprio gate
**Branch:** `reorg/agentic-layer`
**Protocolo que o governa:** `PROTOCOLO_revisao_reviewbr.md` §3, etapa 1
**Tipo de alteração:** Extensão (artefato novo; nenhum código alterado)

> **Para que serve.** Sem este documento, a pergunta *"o sistema ainda corresponde ao estado
> da metodologia?"* não tem resposta possível — não há contra o que comparar. Ele declara,
> para cada trava, skill e metodologia, **contra que padrão e que versão** ela verifica, e
> **o que de fato a verifica**.
>
> **Regra de preenchimento.** Lacuna se declara, nunca se omite. `[SEM VERIFICADOR]` e
> `[SEM VERSÃO DECLARADA]` são preenchimentos válidos; uma linha ausente não é.

---

## 0. Sumário do que este levantamento encontrou

| Achado | Consequência |
|---|---|
| **Nenhum campo de versão de padrão existe no sistema** — nem em `.json`, nem em `.ts` | o sistema não sabe declarar de que versão de que padrão depende; uma revisão do PRISMA passaria despercebida |
| **4 das 8 RV não têm verificador determinístico** (RV-03, RV-04, RV-07) ou têm verificação parcial (RV-06) | metade dos invariantes é autocertificação — o que a skill declara não ser |
| **Os manifests declaram 8 invariantes e apenas 4 gates** | as 4 RV sem tool estão marcadas `always_on` sem nada que as ative |
| **MECIR, EQUATOR e Cochrane Handbook: zero menções** no sistema inteiro | confirma o briefing; são ausência, não implementação parcial |
| **JBI aparece 4 vezes, sempre como nome numa lista** de ferramentas de risco de viés | citado, não implementado — confirma o briefing |
| **O modo CLI `--tool` está morto para as 37 tools** — `toolHandlers` é declarado e lido, nunca populado | defeito preexistente (reproduzido com `validate_prisma_flow`); registrado no protocolo §7, **fora do escopo deste trabalho** |

---

## 1. Invariantes RV-01..RV-08, mais RV-11

> **RV-09 e RV-10** ainda não existem — são propostas do briefing, previstas nas etapas 3 e 4
> do protocolo. **RV-11** foi implementada em 24/09/2026 e entra na tabela abaixo; a
> numeração salta porque a ordem de execução foi invertida (protocolo §2.3).

Colunas: **Padrão/versão** = contra que norma externa a trava verifica, tal como o sistema
declara. **Verificador** = o que de fato aprova ou reprova. **Natureza** = determinística
(código decide) ou conduta (agente se autocertifica).

| RV | O que garante | Padrão / versão | Verificador de fato | Natureza |
|---|---|---|---|---|
| **RV-01** | protocolo fechado antes da busca | PRISMA 2020, item 24a (registro e protocolo) — `[SEM VERSÃO DECLARADA]` no código | `submit_protocol_for_approval` → `project_init.ts` (marcador `[DRAFT]`/`[LOCKED]`) | **determinística** |
| **RV-02** | números emergem do processo | PRISMA 2020, item 16a (seleção dos estudos) — `[SEM VERSÃO DECLARADA]` | `compute_flow_counts` → `flow_computer.ts` (deriva dos artefatos; sinaliza edição manual) | **determinística** |
| **RV-03** | campo ausente = `[TBD]`, nunca inventado | interno; sem padrão externo correspondente | **`[SEM VERIFICADOR]`** — a skill diz "inspeção de artefatos"; nenhuma tool implementa | **conduta** |
| **RV-04** | toda decisão tem agente + timestamp | interno; aproxima-se de PRISMA 2020 item 16b, sem declará-lo | **`[SEM VERIFICADOR]`** — `project_state.ts` oferece onde escrever; nada confere que foi escrito | **conduta** |
| **RV-05** | aritmética do fluxograma fecha | PRISMA 2020, item 16a + diagrama de fluxo — `[SEM VERSÃO DECLARADA]` | `validate_prisma_flow` → `prisma_validator.ts` | **determinística** |
| **RV-06** | MCP executa, não decide | interno (princípio de arquitetura) | **parcial** — `agent_orchestrator.ts` exige que toda tool declare papéis donos; **não verifica determinismo** da tool | **parcial** |
| **RV-07** | strings derivam do protocolo aprovado | PRISMA-S, itens S1–S4 (estratégia de busca) — `[SEM VERSÃO DECLARADA]` | **`[SEM VERIFICADOR]`** — a skill diz "conferência F1.2→F1.4"; é leitura humana | **conduta** |
| **RV-08** | origem rastreável (repositório + instituição + URL) | PRISMA-S, itens S13–S16 (registro e reprodutibilidade) — `[SEM VERSÃO DECLARADA]` | `audit_methodology` + validação em `export_dataset`; `rag_lexical.ts` carrega proveniência por chunk | **determinística** |
| **RV-11** | toda alteração do sistema declara tipo e satisfaz o requisito dele | interno (governança do próprio sistema); **sem padrão externo correspondente** — é a regra que gerencia a adoção de padrões | `validate_system_change` → `change_validator.ts` (enum fechado, sem default; não infere tipo do conteúdo) | **determinística** |

### 1.1 A discrepância entre invariantes declarados e gates ativos

Ambos os manifests (`prisma-sr`, `scoping-prisma-scr`) trazem:

```json
"invariants_always_on": ["RV-01","RV-02","RV-03","RV-04","RV-05","RV-06","RV-07","RV-08"]
```

e, logo abaixo, **4 gates** — `RV-01`, `RV-02`, `RV-05`, `RV-08`. As quatro restantes estão
declaradas como sempre ativas sem nada que as ative.

Isto é a mesma classe de falha que o sistema já registra sobre si na skill de gates:

> *"Foi a ausência de um agente que **chamasse** essas verificações no momento certo (não a
> ausência delas) que travou o sistema antigo."*

Com uma diferença que agrava: em RV-03, RV-04 e RV-07 **não há o que chamar**.

---

## 2. Skills

| Skill | Padrão / versão que invoca | Verificador | Observação |
|---|---|---|---|
| `prisma-rigor-gates` | **PRISMA 2020** (27 itens) + **PRISMA-S** (16 itens), citados por nome e contagem, `[SEM VERSÃO DECLARADA]` como dado | as 4 tools de gate; camadas 2 e 3 são conferência por leitura | é a única skill que nomeia contagem de itens de checklist |
| `conduct-review` | herda das metodologias | orquestra as tools de gate | chama os gates; não os implementa |
| `methodology-router` | carrega `manifest.json` + `spec.md` | leitura de manifest | é o ponto onde um campo de versão deveria ser lido |
| `prisma-s-logging` | **PRISMA-S** | `[SEM VERIFICADOR]` — procedimento de escrita de log | conduta do `librarian` |
| `screening-rules` | PRISMA 2020, itens 8–9 (seleção) | `screen_candidates`, `deduplicate_dataset` | motivos EX-01..EX-11 são convenção interna |
| `extraction-form` | PRISMA 2020, item 10 (itens de dados) | `batch_llm_extract` | rastreio RV-08 obrigatório por campo |
| `evidence-reading` | interno (F5.5, não previsto no PRISMA) | `rag_index_corpus`, `rag_query` | fase sem correspondente no padrão externo |
| `synthesis-manuscript` | PRISMA 2020, itens 13, 20–23; **GRADE**/**CERQual** citados | `validate_prisma_flow`, `audit_methodology` | GRADE e CERQual são nome em prosa, sem implementação |

---

## 3. Metodologias

| Metodologia | Padrão declarado | Versão | Fases ativas | Gates |
|---|---|---|---|---|
| `prisma-sr` | PRISMA 2020 + PRISMA-S | **`[SEM VERSÃO DECLARADA]`** (só no campo `name`, em prosa) | F0–F8, todas | 4 |
| `scoping-prisma-scr` | PRISMA-ScR + PRISMA-S | **`[SEM VERSÃO DECLARADA]`** | F0–F8, com F6 inativa | 4 |

**Ferramentas de risco de viés declaradas em `prisma-sr` (F6):** RoB2, ROBINS-I,
Newcastle-Ottawa, JBI — todas como **string numa lista**, nenhuma com implementação.
**Certeza da evidência (F7):** GRADE, CERQual — idem.

---

## 4. Padrões ausentes

| Padrão | Situação verificada | Tipo de alteração que o introduziria |
|---|---|---|
| **JBI** | 4 menções, todas como item de lista | Extensão |
| **GRADE** | 5 menções, prosa | Extensão |
| **CERQual** | 4 menções, prosa | Extensão |
| **MECIR** | **zero menções** | Extensão |
| **EQUATOR Network** | **zero menções** | Extensão |
| **Cochrane Handbook** | **zero menções** | Extensão |

Nenhuma destas entra no trabalho atual — o §4 do protocolo as põe fora de escopo.

---

## 5. A lacuna estrutural: versionamento

Não existe, em nenhum arquivo do sistema, um campo que declare a versão de um padrão.
A busca por `"version"`, `"standard"`, `"conformance"`, `"checklist_version"` e
`"spec_version"` nos `.json` do `.claude/` retorna **zero resultados**.

Consequência prática: quando o PRISMA 2020 tiver sucessor — como substituiu o de 2009 —
**nada no sistema detectará isso, e nada saberá dizer o que precisa ser revisto.**

### 5.1 Forma mínima proposta

Este manifesto **não implementa** o campo; a implementação é alteração tipada e passa pelo
gate RV-11, ainda inexistente. Fica registrada a forma mínima que atenderia:

```json
"conformance": {
  "standards": [
    { "id": "PRISMA", "version": "2020", "items": 27, "verified_by": ["RV-01","RV-02","RV-05"] },
    { "id": "PRISMA-S", "version": "2021", "items": 16, "verified_by": ["RV-07","RV-08"] }
  ]
}
```

⚠️ A versão do PRISMA-S acima está marcada como **a verificar**: o sistema nunca a declarou,
e confirmá-la exige consultar a fonte — o que o §4 do protocolo põe fora deste trabalho.

---

## 6. O que este manifesto deixa em aberto — por decisão, não por esquecimento

| Em aberto | Onde se resolve |
|---|---|
| a versão real de cada padrão externo | rastreio ativo — fora de escopo (protocolo §4) |
| se RV-03, RV-04, RV-06 e RV-07 **podem** ter verificador determinístico | Frente 2 (diagnóstico) |
| se as 36 tools executam ou decidem | Frente 2 |
| implementar o campo `conformance` | depende de RV-11 existir |

---

## 7. Fecho do critério de parada

O protocolo §3 fecha esta etapa quando *"cada uma das 8 RV, 8 skills e 2 metodologias tem
linha declarando padrão, versão e verificador; toda lacuna marcada `[SEM VERIFICADOR]` em
vez de omitida"*.

| Exigência | Estado |
|---|---|
| 8 RV com linha completa | §1 — 8 de 8 (mais RV-11, acrescentada depois) |
| 8 skills com linha completa | §2 — 8 de 8 |
| 2 metodologias com linha completa | §3 — 2 de 2 |
| lacunas marcadas, não omitidas | 3 × `[SEM VERIFICADOR]`, 1 × parcial, 6 × `[SEM VERSÃO DECLARADA]` |

**Etapa 1 fechada** em 24/09/2026.

---

## 8. Etapa 2 — RV-11, fechada em 24/09/2026

Critério do protocolo §3: *"o gate existe, classifica correção/conformidade/extensão, reprova
alteração sem o requisito do tipo, e reprova a si mesma se submetida sem tipo declarado"*.

| Exigência | Estado | Prova |
|---|---|---|
| o gate existe | `change_validator.ts` + tool `validate_system_change` | compila limpo (`tsc --noEmit`) |
| classifica os três tipos | enum fechado `ChangeType`, sem default | 16 testes em `tests/change_validator.test.ts` |
| reprova sem o requisito do tipo | correção sem reprodução, conformidade sem versão, extensão sem protocolo travado | 8 testes de reprovação |
| **reprova a si mesma sem tipo** | submissão da própria RV-11 sem `change_type` → reprovada | teste dedicado + execução sobre caso real |
| não infere tipo do conteúdo (RV-06) | proposta com `documented_failure` preenchido mas sem tipo continua reprovada | teste dedicado |

**Governança:** papel `MAINTAINER` criado, tool mapeada exclusivamente a ele — nenhum agente
de execução de revisão altera o sistema que o governa, e o `COORDINATOR` fica de fora de
propósito (quem conduz a revisão não muda as regras dela no meio do caminho). O guardião de
completude do RV-06 valida as **37** tools no boot, e a suíte confere que o frontmatter de
`maintainer.md` espelha o mapa canônico (30 testes, todos verdes).

**Tipo desta alteração:** EXTENSAO, sob o protocolo travado — submetida ao próprio gate e
aprovada.

---

## 9. Backlog de dívida — a saída da fila (24/09/2026)

Acrescentado por decisão do pesquisador, com um requisito que reorienta o desenho:
**a sessão de conversa é descartável; o sistema não é.** Todo estado necessário para retomar
a manutenção vive em disco, estruturado — nunca numa transcrição.

| Peça | O que faz |
|---|---|
| `system_debt.json` | backlog versionado: id, tipo (RV-11), evidência, reprodução, estado, decisão |
| `audit_system_debt` | lê o backlog, devolve o panorama e **reprova** saída sem decisão registrada |
| `maintainer.md` §"sessão nova" | ordem de leitura ao ser acionado sem contexto: backlog → manifesto → protocolo |

**O que o gate reprova:** achado `RESOLVIDO`/`RECUSADO` sem `resolution`; achado de tipo
`CORRECAO` sem reprodução; id duplicado; backlog ausente.
**O que não reprova:** fila com itens abertos — é estado normal. O gate cobra decisão
registrada na **saída**, não fila vazia.

**Estado do backlog nesta data:** 4 abertos, 1 resolvido.

| id | tipo | estado | achado |
|---|---|---|---|
| DEBT-001 | CORRECAO | ABERTO | modo CLI `--tool` morto para as 38 tools |
| DEBT-002 | CORRECAO | ABERTO | RV-03, RV-04, RV-07 sem verificador; RV-06 parcial |
| DEBT-003 | CORRECAO | ABERTO | manifests declaram 8 invariantes e listam 4 gates |
| DEBT-004 | EXTENSAO | ABERTO | nenhum campo de versão de padrão existe |
| DEBT-005 | CORRECAO | RESOLVIDO | briefing declarava 14 tools; eram 36 |

**Verificação:** 41 testes verdes, `tsc` limpo, servidor sobe com as **38** tools governadas.
A auditoria do backlog real em disco é ela própria um teste — se o arquivo for corrompido ou
um achado sair da fila em silêncio, a suíte quebra.

---

## 10. Os padrões como dado — `.claude/standards/` (24/09/2026)

Resposta à pergunta: *"uma coisa é saber que existe uma metodologia, outra é aplicar"*.

**O que faltava.** A spec mapeia em **uma direção só**: "o subitem F0.1.1 atende ao Item 1".
Ninguém conseguia perguntar o inverso — *"o Item 17 está coberto por quê?"* — sem ler 457
linhas à mão. E o manifest exigia `prisma_checklist_filled.md` (27 itens) como suplemento
obrigatório **sem que existisse template dele em lugar nenhum**.

**Separação adotada:**

| Camada | Onde | O que é |
|---|---|---|
| **Norma** | `.claude/standards/<padrão>.json` | externa, estável, versionada — os itens do padrão |
| **Método** | `.claude/methodologies/<método>/` | como o ReviewBR implementa a norma |

PRISMA-S é usado por `prisma-sr` **e** por `scoping-prisma-scr`: arquivo próprio evita duas
cópias que divergem.

**Cobertura verificada** (extraída da própria spec — nada veio de fonte externa):

| Padrão | Itens | Cobertos | Órfãos |
|---|---|---|---|
| PRISMA 2020 | 27 | **27** | nenhum |
| PRISMA-S | 16 | **16** | nenhum |

**Tool `check_standard_coverage`:** consulta reversa (item → subitens que o cobrem), reprova
item órfão e, com `render=true`, gera o template do checklist a partir do dado — estrutura
do padrão, evidência a cargo do pesquisador.

**Versão continua marcada `[A VERIFICAR]`**, e isso é deliberado: o sistema nunca conferiu
a versão contra a fonte oficial, e o rastreio externo está fora de escopo (protocolo §4).
Declarar a incerteza é melhor do que afirmar o que não se verificou — o relatório de
cobertura devolve `version_unverified: true`, e o checklist gerado carrega o aviso.

### 10.1 Achado de conformidade — DEBT-012

A extração expôs um desalinhamento na seção "Outras informações": a spec mapeia F8.3.26
("Disponibilidade de dados") ao **Item 26** e F8.4.1-3 também ao **Item 26**, mas no PRISMA
2020 o item 26 é *conflitos de interesse* e o 27 é *disponibilidade de dados, código e
materiais*. A numeração parece deslocada em um a partir do 25.

**Não corrigido.** É CONFORMIDADE: exige citar padrão, versão e item afetado — o que só se
obtém na fonte oficial. Os títulos em `.claude/standards/prisma-2020.json` seguem a
numeração oficial presumida, e a coluna `covered_by` **expõe** a divergência em vez de
escondê-la.

### 10.2 Um falso negativo desta própria etapa

A primeira extração acusou "4 itens PRISMA sem cobertura: 6, 7, 20 e 27". Era **falso**: o
padrão de extração exigia tabelas de 5 colunas, e a seção F8.3 tem 3. Os quatro estavam
mapeados.

O controle positivo pegou o erro antes que ele virasse achado — exatamente o princípio que a
RV-09 vai codificar, aplicado aqui ao trabalho sobre o sistema. Sem ele, quatro itens
íntegros teriam sido registrados como lacuna.

**Verificação:** 53 testes verdes, `tsc` limpo, servidor sobe com **39** tools governadas.

**Próxima etapa:** RV-09 (prova de leitura em resultado negativo).
