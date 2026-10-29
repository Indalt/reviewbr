# Retomar — estado em 25/09/2026


> **Atualização de 08/10/2026 — leia ANTES de tudo:** o Vicente decidiu nove pontos que
> mudam o alvo da manutenção — entre eles que **atualizar o MCP para instalar método novo não
> é defeito**, que **registro de protocolo deixa de ser pré-condição**, que o **RAISE não é
> canônico** e que **agente não se multiplica por método, skill sim**. O grave passou a ser o
> **resíduo de PRISMA no modo de agir**. Está tudo em `DECISOES_2026-10-08.md`, com os fatos
> apurados com controle positivo (não reapurar) e o que lá diverge deste documento.
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

> Ponto de retomada para sessao NOVA. Leia isto, depois rode `audit_system_debt`.
>
> **Ha trabalho EM CURSO:** leia `.claude/maintenance/CONTINUAR.md` primeiro — traz o orcamento
> de tokens medido, a politica de esforco e onde a auditoria da Frente 2 parou.
> Se essa tool responder "desconhecida", o build esta velho: rode `npm run build` em
> `reviewbr/reviewbr-mcp` antes de qualquer outra coisa.

## Estado das etapas

| Etapa | Estado |
|---|---|
| 0 protocolo / 1 manifesto / 2 RV-11 + backlog + padroes | concluidas |
| 2b catalogo de metodologias | concluida — catalogo com fonte oficial; reapure o total com query_methodology_catalog (numero escrito aqui envelhece) |
| **2c agente de manutencao** | **concluida** — leitura, escrita, procedimento de auditoria |
| **5 auditoria (Frente 2)** | **CONCLUIDA** 25/09 — 75 achados, 22 bloqueando; ver DIAGNOSTICO_frente_2.md |
| 3 RV-09 / 4 RV-10 / 6 estado da arte | nao iniciadas |

A **execucao da revisao ainda nao comecou**. Tudo ate aqui foi preparacao do ambiente.
Os achados do backlog NAO sao resultado de auditoria: apareceram de passagem.

## O agente de manutencao — o que ele tem

| Camada | Onde |
|---|---|
| Identidade, limites e procedimento | `.claude/agents/maintainer.md` |
| Procedimento de auditoria | `.claude/skills/system-audit/SKILL.md` |
| Catalogo (mapa do territorio) | `.claude/catalog/methodologies.json` — reapure com `query_methodology_catalog` |
| Padroes (a norma como dado) | `.claude/standards/` — `prisma-2020.json`, `prisma-s.json` |
| Implementacoes | `.claude/methodologies/` — `prisma-sr`, `scoping-prisma-scr` |
| Backlog | `.claude/maintenance/system_debt.json` |

**Tools (8).** Leitura: `audit_system_debt`, `check_standard_coverage`,
`query_methodology_catalog`. Gate: `validate_system_change`. Escrita:
`record_system_finding`, `absorb_methodology`, `scaffold_methodology`,
`validate_methodology`.

**Sempre a tool, nunca o arquivo.** Editar `system_debt.json` ou o catalogo a mao contorna a
verificacao que as tools fazem antes de gravar.

## Proximos passos, em ordem de valor

1. **Frente 2 — a auditoria.** Carregue a skill `system-audit` e varra o sistema. E o que o
   agente foi construido para fazer, e o unico item que nao depende de decisao nova.
2. **DEBT-012 (EM_CURSO) + DEBT-014** — 12 mapeamentos PRISMA errados na spec e os 21
   subitens sem cobertura. Tratar JUNTOS; a fonte oficial ja esta citada no backlog.
3. **DEBT-016** — o gate RV-11 valida a prosa da proposta, nunca a alteracao real. Levantado
   por revisao adversarial. Decisao do pesquisador pendente.
4. **`prisma-scr.json`** — `scoping-prisma-scr` esta implementada e exige o checklist ScR, mas
   o padrao nao existe como dado. O catalogo ja acusa isso sozinho.

## Nada esta quebrado

`tsc` limpo, suite verde, servidor sobe com o guardiao RV-06 validando todas as tools, e
`dist/` esta em dia com `src/` — travado por `tests/build_frescor.test.ts`.

## Historico de verificacao

O agente passou por revisao adversarial de quatro lentes independentes em 25/09/2026
(completude, coerencia, declarado-vs-real, operabilidade). As quatro devolveram NAO PRONTO.
Os quatro achados que bloqueavam foram corrigidos; o registro esta no §7 do protocolo.
Rode a revisao de novo depois de mudancas grandes: o script esta em
`~/.claude/projects/c--reviewbr/<sessao>/workflows/scripts/revisao-agente-manutencao-*.js`.
