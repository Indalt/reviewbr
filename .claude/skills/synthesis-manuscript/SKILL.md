---
name: synthesis-manuscript
description: Procedimento de risco de viés, síntese e geração do manuscrito e suplementos (fases F6/F7/F8), com os gates de integridade finais. Use ao fechar uma revisão para avaliar qualidade, sintetizar achados ancorados, validar o fluxograma e produzir o relatório final auditável. Carregada pelo agente analyst.
---

# Synthesis & Manuscript — fechamento auditável da revisão

Só rode com extração (F5) e leitura (F5.5) completas. Respeite o `manifest.json`: fases desligadas pelo método (ex.: F6 em scoping) são puladas — invariantes RV continuam ativos.

## F6 — Risco de viés (se ativa)
Ferramenta declarada no protocolo (RoB2/ROBINS-I/Newcastle-Ottawa/JBI). Julgamento por domínio + global, cada um com justificativa. Nº de revisores e resolução de conflitos registrados.

## F7 — Síntese
- Tipo: quantitativa / qualitativa / narrativa / mista.
- **Ancoragem obrigatória**: cada afirmação vem de `evidence_synthesis.md` e da tabela de características — **não alucine**. Use `rag_query` para reconferir trechos.
- Se meta-análise: medida de efeito (RR/OR/MD/SMD), modelo de pooling (fixo/aleatório), heterogeneidade (I²/Q), viés de relato (funil/Egger), certeza (GRADE/CERQual).

## F8 — Gates de integridade (rodar ANTES de exportar; qualquer vermelho para tudo)
1. `compute_flow_counts` → (re)deriva `prisma_flow.json` dos logs reais (RV-02).
2. `validate_prisma_flow` → se a aritmética do funil (F8.1.1–F8.1.10) não fechar, **não gere o manuscrito** (RV-05).
3. `audit_methodology` → se algum estudo incluído não tem origem completa, **bloqueie a síntese** (RV-08).
4. `check_standard_coverage` para cada padrão do método (ex.: `prisma-2020`, `prisma-s`), com `methodologyId` = o `method` do `project_state.json` → confere os subitens contra a spec, falsifica o mapeamento e separa o coberto do declarado `[NÃO COBERTO]`/`[NÃO SE APLICA]`. `valid=false` **bloqueia declarar o suplemento completo** (ver skill `prisma-rigor-gates`, Camada 3) — gere o checklist com a `fracao` e as declarações que a tool devolve, nunca como se estivesse inteiro.

## Entregáveis (F8 + suplementos do `manifest.json`)
`05_synthesis/manuscript.md` (seções F8.3.1–F8.3.27) + suplementos: `prisma_checklist_filled.md`, `prisma_s_checklist_filled.md`, `supplement_search_prisma_s.md`, `supplement_sources_registry.md`, `dedupe_report.md`, `screening_report.md`, `prisma_flow_counts.md`, `change_log.md`, `audit_summary.md`.

## Fluxograma
Números **calculados**, nunca digitados. O diagrama reflete `prisma_flow.json` validado.
