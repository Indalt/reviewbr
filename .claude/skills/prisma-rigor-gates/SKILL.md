---
name: prisma-rigor-gates
description: Verifica TODAS as regras e subregras de rigor de uma revisão — os invariantes anti-viés RV-01..RV-08, a completude granular dos subitens da spec (F0.1.1, F1.2.3, ...) e os checklists PRISMA 2020 (27 itens) e PRISMA-S (16 itens). Use ao conduzir ou revisar qualquer fase para garantir protocolo travado, números que emergem do processo, aritmética do funil que fecha, origem rastreável e nenhum item obrigatório em falta. Um gate reprovado bloqueia o avanço.
---

# Gates de Rigor — todas as regras e subregras

Rigor não é autocertificação do agente: **cada gate é uma verificação determinística** (por tool do MCP ou checagem de completude contra a spec). O agente produz o insumo; a verificação aprova ou reprova; o orquestrador só avança com verde. A conferência tem **três camadas**, todas obrigatórias.

## Camada 1 — Invariantes anti-viés (RV-01..RV-08) — NUNCA desligáveis

| Regra | O que garante | Verificação | Reprovação bloqueia |
|---|---|---|---|
| **RV-01** | Protocolo fechado antes da busca | `submit_protocol_for_approval` (score 0–3; sem `[TBD]` obrigatório) | acionar o `librarian` |
| **RV-02** | Números emergem do processo, não digitados | `compute_flow_counts` (deriva contagens dos logs reais) | contagem manual no fluxo |
| **RV-03** | Campos ausentes = `[TBD]`, nunca inventados | inspeção de artefatos | — (conduta de todos os agentes) |
| **RV-04** | Toda decisão tem agente + timestamp | `project_state.json` + logs | — |
| **RV-05** | Aritmética do fluxograma fecha | `validate_prisma_flow` | export do manuscrito |
| **RV-06** | MCP executa, não decide | conduta: agente decide, tool executa | — |
| **RV-07** | Strings derivam do protocolo aprovado | conferência F1.2→F1.4 | busca com string ad-hoc |
| **RV-08** | Origem rastreável (repositório+instituição+URL) | `audit_methodology` + validação em `export_dataset` | síntese/export |

## Camada 2 — Completude granular dos subitens (a spec inteira, não só as RV)
Cada fase tem subitens obrigatórios na spec do método (`.claude/methodologies/<metodo>/spec.md`). O gate de cada fase confere que **todos os subitens marcados obrigatórios (✅) estão preenchidos ou explicitamente `[TBD]`** — nenhum silenciosamente ausente:
- **F0**: F0.1.1–F0.1.9 (identidade), F0.2.1–F0.2.5 (registro, se o método exigir), F0.3.1–F0.3.4 (justificativa).
- **F1**: F1.1.1–F1.1.3 (questão/framework), F1.2.x (PICOS/PCC completo), F1.3.1.x/F1.3.2.x (elegibilidade), F1.4.1–F1.4.5 (strings + booleanos + vocabulário + aprovação + versão).
- **F2**: F2.1.1.x (identificação da fonte), F2.1.2.x (execução: string exata, data, filtros), F2.1.3.x (resultados brutos), F2.2.x (outros recursos).
- **F3**: F3.1.1–F3.1.10 (método, critérios, contagens, pares, conflitos).
- **F4**: F4.1.x + F4.2.x (contagens por fase) e F4.3 (motivos EX-01..EX-11 derivados de F1.3).
- **F5**: F5.1.x (processo) + F5.2.x (todos os campos por estudo, incluindo origem RV-08).
- **F6/F7** (se ativas): ferramenta, domínios, julgamentos; tipo de síntese, medida de efeito, heterogeneidade, certeza (GRADE/CERQual).
- **F8**: F8.1.1–F8.1.10 (todos calculados), F8.2 (colunas obrigatórias da tabela), F8.3.1–F8.3.27 (seções do manuscrito), F8.4.x (disponibilidade).

## Camada 3 — Checklists de conformidade (suplementos obrigatórios)
Antes de declarar a revisão pronta, confira os checklists item a item:
- **SUP.1 — PRISMA 2020**: 27 itens, cada um com status e evidência (arquivo/seção que o cumpre).
- **SUP.2 — PRISMA-S**: 16 itens (S1–S16), idem.
- Demais suplementos do `manifest.json` (`supplement_search_prisma_s.md`, `dedupe_report.md`, `screening_report.md`, `change_log.md`, `audit_summary.md`, ...).
Um item de checklist sem evidência é uma pendência que **impede a finalização**.

## Regra de ouro
Um gate **vermelho para tudo**. Nunca contorne: corrija o insumo e re-rode a verificação, ou leve a decisão ao pesquisador. Foi a ausência de um agente que **chamasse** essas verificações no momento certo (não a ausência delas) que travou o sistema antigo — `validate_prisma_flow` (RV-05) já existia e nunca era chamada.
