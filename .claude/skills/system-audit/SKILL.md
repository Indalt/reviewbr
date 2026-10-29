---
name: system-audit
description: Procedimento de AUDITORIA do próprio ReviewBR (Frente 2). Use para varrer o sistema de forma sistemática e responder "o sistema faz o que declara fazer?" — classificando cada tool (executa ou decide, RV-06), apontando o verificador real de cada invariante, conferindo cada agente contra seus limites e medindo a cobertura de cada padrão. Produz DIAGNÓSTICO tipado no backlog, nunca reescrita. Carregada pelo agente maintainer.
---

# Auditoria do sistema — procedimento

Esta skill responde a **uma** pergunta: *o sistema faz o que declara fazer?*

Ela produz **diagnóstico**, não correção. Todo achado entra no backlog com tipo declarado
(RV-11) e espera decisão. Corrigir durante a varredura é a deriva que o protocolo existe
para impedir — e contamina a própria auditoria, porque o que você corrige deixa de ser
medido.

## Regra zero — apure o denominador, nunca o herde

**Antes de qualquer varredura, conte.** Não aceite número de documento, de conversa anterior
nem de memória.

```bash
cd reviewbr/reviewbr-mcp
grep -A1 -E '^server\.tool\($' src/index.ts | grep -oE '"[a-z_0-9]+"' | tr -d '"' | sort -u | wc -l   # tools
ls ../../.claude/agents/ | wc -l          # agentes
ls ../../.claude/skills/ | wc -l          # skills
ls ../../.claude/methodologies/ | wc -l   # metodologias
ls ../../.claude/standards/ | wc -l       # padrões
```

Precedente: o briefing desta revisão declarava **14 tools**. A contagem real era muito maior —
e mudou três vezes no mesmo mês, à medida que tools novas entravam. Auditar o número herdado
e declarar o sistema auditado deixaria o resto fora **sem que ninguém percebesse**. É a mesma
classe do falso negativo que a RV-09 existe para pegar: relatório fechado sobre leitura que
não houve.

Por isso **este documento não cita nenhum total**: qualquer número escrito aqui envelhece e
passa a autorizar auditoria incompleta.

Registre o denominador apurado no cabeçalho do diagnóstico, com a data.

## Regra um — zero exige controle positivo

Toda vez que a varredura produzir *"nenhum X encontrado"*, **prove o método** com um caso
que certamente existe. Se o controle também der zero, o defeito é do seu método, não do
sistema.

Precedente desta própria revisão: uma extração acusou *"4 itens PRISMA sem cobertura"*. Era
falso — o padrão de busca exigia tabelas de 5 colunas e a seção tinha 3. Sem o controle,
quatro itens íntegros teriam entrado no backlog como lacuna.

---

## Varredura A — tools: executa ou decide? (RV-06)

Para **cada** tool do denominador apurado, classifique:

| Classe | Critério | Exemplo |
|---|---|---|
| **EXECUTA** | mesma entrada → mesma saída, sempre; nenhum julgamento | `validate_prisma_flow`, `compute_flow_counts` |
| **DECIDE** | chama LLM ou aplica julgamento que muda entre execuções | `screen_candidates`, `batch_llm_extract` |
| **MISTA** | executa, mas um ramo decide | conferir caso a caso |

Ponto de partida — onde o LLM é de fato chamado:

```bash
cd reviewbr/reviewbr-mcp/src
grep -rln "llm_provider\|universal_provider\|generateContent\|genAI" services/ --include=*.ts
# confira CADA acerto abrindo o arquivo: o padrão casa import e comentário, não só chamada real
```

Uma tool que **DECIDE** não é defeito por si: o RV-06 diz que o MCP executa e o agente
decide, então tool que decide é violação — **mas** uma tool que decide *e tem verificação
determinística por cima* é aceitável, porque o gate recupera a auditabilidade. Registre as
duas coisas: a classe e se existe verificação por cima.

**Cuidado com o nome.** `rag_query` soa semântico e é BM25 léxico; `batch_db_screen`
soa determinístico ("db") e vira LLM quando `useLlm=true`. Classifique pelo código,
nunca pelo nome — e confira o registro de uso de IA (`src/registry/ai_use.ts`), que
classifica por **tarefa e classe de ferramenta**, não pelo rótulo da tool.

## Varredura B — invariantes: quem verifica cada RV?

Para **cada** RV declarada, aponte o verificador **real** e classifique:

- **determinística** — existe tool/serviço que aprova ou reprova
- **parcial** — existe verificação, mas não do que a regra promete
- **`[AUSENTE]`** — a regra é conduta em prosa; nada a verifica

```bash
grep -rnoE "RV-[0-9]+" .claude/skills/prisma-rigor-gates/SKILL.md | sort -u   # o que é declarado
grep -rloE "RV-[0-9]+" reviewbr/reviewbr-mcp/src/services/                    # o que existe
python -c "import json;d=json.load(open('.claude/methodologies/prisma-sr/manifest.json'));print(len(d['invariants_always_on']),'invariantes /',len(d['gates']),'gates')"
```

A discrepância entre invariantes declarados `always_on` e gates existentes é achado por si.

## Varredura C — agentes: respeitam os limites?

Para **cada** agente, confronte três coisas que deveriam concordar:

1. o que o corpo do `.md` diz que ele faz;
2. as tools do `frontmatter`;
3. o mapa canônico `TOOL_PERMISSIONS` em `agent_orchestrator.ts`.

```bash
cd reviewbr/reviewbr-mcp && npx vitest run tests/governance.test.ts
```

E, para cada metodologia, rode **`validate_methodology`**: ela pega invariante declarado
`always_on` sem gate que o ative, e metodologia que não declara contra que padrão verifica.

A suíte já confere (2) contra (3). **O que nenhum teste confere é (1) contra (2)**:
capacidade declarada em prosa sem ferramenta que a sustente. Foi assim que se descobriu que
o `maintainer` dizia rastrear padrões sem ter busca externa. Leia cada agente procurando
verbo de ação sem tool correspondente.

## Varredura D — padrões: cobertura

```
check_standard_coverage  →  para cada padrão em .claude/standards/
query_methodology_catalog →  panorama do catálogo
```

Três achados possíveis: item do padrão sem nenhum subitem da trilha que o cubra; metodologia
implementada sem o padrão como dado; versão não confirmada contra a fonte.

---

## Registro dos achados

Todo achado entra pela tool **`record_system_finding`** — nunca por edição do JSON. Ela valida
antes de gravar; a edição manual contorna a verificação. Tipo **sempre** declarado:

| Tipo | Quando | Exige |
|---|---|---|
| **CORRECAO** | o sistema promete e não cumpre | falha documentada **e reproduzível** |
| **CONFORMIDADE** | diverge de padrão externo | padrão, **versão** e item afetado |
| **EXTENSAO** | falta capacidade que nunca foi prometida | protocolo próprio |

Classificar na descoberta é mais fiel que classificar meses depois, de memória. E o campo
`reproduction` não é burocracia: é o que distingue defeito real de impressão.

**Nada é corrigido durante a varredura.** Nem o achado trivial.

## Critério de parada

A auditoria fecha quando, para o denominador apurado **nesta** corrida:

- [ ] toda tool tem classe (executa / decide / mista) e nota sobre verificação por cima
- [ ] toda RV tem verificador apontado ou marcado `[AUSENTE]`
- [ ] todo agente foi conferido nas três frentes (prosa × frontmatter × mapa)
- [ ] toda metodologia passou por `validate_methodology`
- [ ] todo padrão tem relatório de cobertura
- [ ] todo achado está no backlog, tipado, com evidência — e `audit_system_debt` passa
- [ ] **nenhuma linha de código foi alterada**

O último item é o mais fácil de violar e o que mais compromete o resultado.

## Fronteiras

- Não corrija. Não refatore. Não "melhore de passagem".
- Não conclua a partir de documento: conclua a partir do código.
- Não feche achado que o pesquisador ainda não leu.
- Se a varredura revelar trabalho grande demais para uma sessão, **pare e registre onde
  parou** — em `.claude/maintenance/RETOMAR.md`. Auditoria pela metade, registrada, vale
  mais que auditoria inteira perdida no fim de uma janela de tokens.
