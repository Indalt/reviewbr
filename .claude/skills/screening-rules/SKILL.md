---
name: screening-rules
description: Procedimento de deduplicação e triagem (fases F3/F4). Use ao deduplicar e decidir inclusão/exclusão de registros com critérios do protocolo, motivos de exclusão padronizados (EX-01..EX-11) e regra de saturação. Carregada pelo agente screener.
---

# Screening Rules — deduplicação e triagem rigorosas

## F3 — Deduplicação (hierarquia)
1. DOI/Handle idêntico → 2. Título normalizado idêntico → 3. Título+ano+1º autor → 4. Similaridade de título ≥90% + mesmo ano.
Registre cada par (ID mantido, ID removido, critério, fontes) em `02_deduplicated/`. Conflitos não resolvidos automaticamente = decisão manual do pesquisador.

## F4 — Triagem (duas fases)
- **F4.1 Título/Resumo** e **F4.2 Texto completo**. Toda exclusão recebe um **motivo padronizado** derivado dos critérios F1.3:

| Código | Motivo | Origem |
|---|---|---|
| EX-01 | Fora do escopo — P | F1.3.2.1 |
| EX-02 | Intervenção não elegível — I | F1.3.1.2 |
| EX-03 | Desfecho não reportado — O | F1.3.1.3 |
| EX-04 | Tipo de estudo inelegível — S | F1.3.1.4 |
| EX-05 | Tipo de documento inelegível | F1.3.2.2 |
| EX-06 | Período fora do recorte | F1.3.2.3 |
| EX-07 | Idioma não elegível | F1.3.2.4 |
| EX-08 | Texto completo indisponível | F1.3.2.6 |
| EX-09 | Duplicata não capturada | F1.3.2.5 |
| EX-10 | Qualidade insuficiente | F1.3.2.7 |
| EX-11 | Outro (descrição obrigatória) | — |

Full-text não recuperado (F4.2.2): registre por registro com motivo — entra em `fulltext_not_retrieved` no funil.

## Trilha única por projeto
Pergunte no início: **(A)** `screen_candidates` (LLM, ágil) ou **(B)** `screen_with_asreview` (ML validado, para publicação). Não misture as duas no mesmo projeto. Registre `screening_method`.

## Saturação (stopping rule)
Após cada batch de `screen_candidates`, chame `get_screening_report`. Se `saturationAlert:true` (últimos 3 batches <5% de novos relevantes), apresente os números e pergunte se encerra. **A decisão de parar é do pesquisador** (RV-04), nunca automática. Se cobertura de alguma fonte <50%, avise a lacuna.

## Artefatos canônicos que você DEVE gravar (para o funil emergir — RV-02)
O `compute_flow_counts` conta estes arrays JSON. Grave-os com estes nomes exatos:
- `02_deduplicated/dataset.json` — registros após dedup.
- `03_screening/excluded_ta.json` — exclusões na fase Título/Resumo.
- `03_screening/fulltext_not_retrieved.json` — não recuperados (com motivo).
- `03_screening/excluded_fulltext.json` — exclusões na fase texto completo.
- `03_screening/included.json` — incluídos finais (usado como checagem cruzada).

## Justificativa por decisão
Registro aceito/rejeitado carrega a **justificativa textual real** (não só "SIM/NÃO") e o modelo LLM usado, quando triagem automatizada (auditoria).
