---
name: methodology-router
description: Roteia a revisão para a metodologia correta e informa quais fases estão ativas e quais gates aplicar. Use ao iniciar um projeto ou ao decidir quais etapas rodar, para carregar o manifest.json e o spec.md do método escolhido (revisão sistemática, de escopo, narrativa, etc.). Garante agnosticismo metodológico sem perder rigor.
---

# Methodology Router — seletor de metodologia plugável

O sistema é **agnóstico a método**: os agentes são genéricos; a metodologia é **dado**. Esta skill escolhe e carrega esse dado.

## Como rotear
1. Projeto já criado: o método está em `project_state.json` (`method`) — não o re-deduza.
2. Projeto novo: o **tipo de pesquisa filtra os métodos assimilados**. Cada metodologia declara em `serves_research_types` a que tipos serve, e `assess_research_design` apresenta os que servem ao tipo — com a trilha e o contexto do catálogo (o que é, quando usar, o que exige, fonte oficial) —, para o pesquisador escolher sabendo o que escolhe (DEBT-095). Tipo sem método assimilado **recusa**: não vira outro método.
   - Hoje: `prisma-sr/` serve a revisão sistemática e a exploratória; `scoping-prisma-scr/` serve a revisão de escopo (framework PCC; F6 e meta-análise desligadas).
   - Método novo entra como pasta nova no mesmo formato e passa a ser escolhível sem tocar no código, para os tipos da lista. A lista de tipos é fixa até que um método assimilado peça outro (decisão do administrador).
3. Carregue `manifest.json` e `spec.md`. A **trilha** do método está em `phases`: lista ordenada de etapas, cada uma com o papel que a executa (`role`), o artefato que a encerra (`closes_with`) e as tools que gravam esse artefato (`producer_tools` — vazia quando quem grava é o agente, sem código). Etapa com `active: false` não se aplica ao método e traz o motivo em `note`. A `spec.md` detalha os subitens de cada etapa.

## Invariante que sustenta o agnosticismo
- **Etapas são do método**, não da ferramenta: o `manifest.json` declara quais existem, em que ordem e quem executa cada uma, e o runtime **lê** essa lista — a etapa em que o projeto nasce, a que abre quando o protocolo trava e a etapa que cada artefato encerra vêm dela (DEBT-100). Um método de outra forma pode declarar outras etapas.
  - **O que ainda é da forma do `prisma-sr`, para não prometer além:** o auditor do protocolo exige as seções F0.3 e os rótulos F4.1.2/F4.1.3; os agentes ainda se descrevem pelas fases F0–F8 (DEBT-134, DEBT-137); e o mapeamento padrão → subitens, com as declarações `[NÃO COBERTO]`/`[NÃO SE APLICA]`, mora no arquivo do padrão, compartilhado por todo método que o declara — um método de trilha própria ainda não tem onde declarar o seu (DEBT-142). Um método de outra forma se **declara** hoje; conduzi-lo ponta a ponta depende desses três.
- **Invariantes RV-01..RV-08** valem em **todo** método e **nunca** são desligados. Desligar uma etapa ≠ afrouxar integridade. Assim uma scoping review continua rigorosa (protocolo travado, números que fecham, origem rastreável) mesmo sem RoB2.

## Saída
Informe ao orquestrador: caminho do método, framework de pergunta (PICOS/PCC/SPIDER), a trilha (etapas na ordem, com papel, artefato de encerramento e as não aplicáveis com o motivo), gates obrigatórios e caminhos dos templates (protocolo, fluxo, extração).
