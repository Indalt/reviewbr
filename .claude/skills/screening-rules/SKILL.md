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

## Processo de triagem — método, não menu de ferramenta
A triagem depende do **método declarado no protocolo**, não do software. Antes de triar, leia do `protocol.md` e **obedeça**:

- **F4.1.2 Processo de triagem** — Individual | Duplo independente | Duplo com desempate. Define *quantos* aplicam os critérios a cada registro e *se* trabalham sem ver a decisão do outro.
- **F4.1.3 Ferramenta utilizada** — que sistema executa. É detalhe de execução: **nenhuma ferramenta torna a triagem mais ou menos publicável**.
- **Resolução de discordâncias** — como as divergências se resolvem (ou "não se aplica").

O gate do protocolo (`submit_protocol_for_approval`) **reprova** se os três não estiverem preenchidos: um protocolo travado sem eles permitiria escolher o método depois de ver os registros. Se o protocolo divergir do que você for executar, **pare e avise** — o protocolo manda (RV-01).


## MAYBE — dúvida declarada, não inclusão
`MAYBE` entra no conjunto de incluídos, e isso é **declarado**: `screen_candidates` responde a
composição (quantos SIM, quantos MAYBE) e cada registro carrega `decision` no artefato, então o
número dá para recontar do disco.

- **F4.1 (título/resumo)** — "não dá para saber pelo resumo" é a resposta **certa**: segue para
  texto completo, onde se decide. Não force SIM nem NÃO para zerar a coluna.
- **F4.2 (texto completo)** — MAYBE que sobra é estudo **indeciso dentro dos incluídos finais**,
  e o funil o contaria como decisão. Resolva cada um antes de fechar a F4: incluir, ou excluir
  com motivo `EX-01..EX-11`. **A decisão é do pesquisador** (RV-04) — apresente a lista, não
  resolva por ele.

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
