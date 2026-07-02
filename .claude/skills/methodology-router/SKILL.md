---
name: methodology-router
description: Roteia a revisão para a metodologia correta e informa quais fases estão ativas e quais gates aplicar. Use ao iniciar um projeto ou ao decidir quais etapas rodar, para carregar o manifest.json e o spec.md do método escolhido (revisão sistemática, de escopo, narrativa, etc.). Garante agnosticismo metodológico sem perder rigor.
---

# Methodology Router — seletor de metodologia plugável

O sistema é **agnóstico a método**: os agentes são genéricos; a metodologia é **dado**. Esta skill escolhe e carrega esse dado.

## Como rotear
1. Leia o tipo de revisão de `F0.1.3` do `protocol.md` (ou pergunte ao pesquisador).
2. Mapeie para uma pasta em `.claude/methodologies/`:
   - **Sistemática (+ meta-análise)** → `prisma-sr/`  ← função principal do sistema
   - **Scoping / Revisão de escopo** → `scoping-prisma-scr/` (framework PCC; F6 e meta-análise desligadas)
   - *(outros métodos, se um dia necessários, entram como nova pasta no mesmo formato — sem tocar no núcleo nem no MCP)*
3. Carregue `manifest.json` (fases ativas, framework de pergunta, gates, templates) e `spec.md` (a trilha detalhada).

## Invariante que sustenta o agnosticismo
- **Fases** (F6 risco de viés, F7 meta-análise, F0.2 registro, GRADE) são **ligadas/desligadas** pelo `manifest.json`.
- **Invariantes RV-01..RV-08** valem em **todo** método e **nunca** são desligados. Desligar uma fase ≠ afrouxar integridade. Assim uma scoping review continua rigorosa (protocolo travado, números que fecham, origem rastreável) mesmo sem RoB2.

## Saída
Informe ao orquestrador: caminho do método, framework de pergunta (PICOS/PCC/SPIDER), lista de fases ativas, gates obrigatórios e caminhos dos templates (protocolo, fluxo, extração).
