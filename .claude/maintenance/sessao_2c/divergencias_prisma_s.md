# Divergências entre as duas leituras documentadas do PRISMA-S do prisma-sr

> **Decisão de 08/11/2026 ("a sim"):** estas divergências são decididas pelo Vicente depois da sessão M, de
> uma vez. Até lá vale, em cada ponto, o mapeamento de 30/10.

Sessão 2c, item 3 (decisão de 05/11/2026, B2). Primeira leitura: sessão 2c (Claude Opus 5.5), no chat da sessão, 2026-11-06. Segunda leitura: agente independente (general-purpose, Claude Opus 5.5), aprovado na decisão B2 de 05/11/2026, 2026-11-06.
Onde as duas concordam, vale (correções aplicadas, abaixo). Onde divergem, ficou o mapeamento atual — e a decisão é sua.
Os trechos são do enunciado oficial do item (.claude/standards/prisma-s.json), conferidos literais pelo conferidor.

**Resumo:** ponteiros — mapeamento de 30/10: 59; primeira leitura: 60; segunda: 37; concordam: 34; depois da comparação: 55. Correções: 22. Divergências: 36 (29 de ponteiro, 7 de cobertura).

## As divergências por tema

- **Seções do manuscrito (F8.3)** — 13. A segunda leitura não as aponta ("a trilha só dá o título da seção, sem descrever o conteúdo"); a primeira, sim, como lugar do relato. Decidir uma vez vale para todas: S1→F8.3.6 (só na primeira), S2→F8.3.6 (só na primeira), S3→F8.3.6 (só na primeira), S4→F8.3.6 (só na primeira), S5→F8.3.6 (só na primeira), S6→F8.3.6 (só na primeira), S7→F8.3.6 (só na primeira), S8→F8.3.7 (só na primeira), S9→F8.3.7 (só na primeira), S10→F8.3.7 (só na primeira), S12→F8.3.7 (só na primeira), S13→F8.3.6 (só na primeira), S15→F8.3.16 (só na primeira).
- **Suplementos (SUP)** — 2: S1→SUP.3 (só na primeira), S2→SUP.3 (só na primeira).
- **Campos de coleta** — 14: S1→F2.1.1.5 (só na primeira), S1→F2.1.1.2 (só na segunda), S2→F2.1.1.1 (só na primeira), S2→F2.1.1.5 (só na primeira), S8→F2.1.1.6 (só na primeira), S8→F2.1.2.5 (só na primeira), S8→F2.1.2.6 (só na primeira), S9→F1.2.10 (só na segunda), S12→F2.1.2.8 (só na primeira), S15→F3.1.6 (só na primeira), S15→F8.1.1 (só na primeira), S15→F8.1.2 (só na primeira), S16→F1.3.2.5 (só na segunda), S16→F3.1.10 (só na primeira).
- **Cobertura** — 7: S1 (primeira "completa", segunda "parcial"), S2 (primeira "parcial", segunda "nenhuma"), S4 (primeira "completa", segunda "parcial"), S5 (primeira "completa", segunda "parcial"), S6 (primeira "completa", segunda "parcial"), S12 (primeira "parcial", segunda "nenhuma"), S15 (primeira "completa", segunda "parcial"). Nos itens que a segunda julga parciais, ela nomeia o que a trilha não registra; se você concordar, a declaração [NÃO COBERTO] do item muda, e a fração cai.

## Correções aplicadas (as duas leituras concordam e diferem do mapeamento de 30/10)

- S1 → F2.1.1.3: sai — nenhuma das duas leituras o dá.
- S1 → SUP.4: entra — as duas leituras o dão.
- S3 → F2.1.1.3: sai — nenhuma das duas leituras o dá.
- S3 → SUP.4: entra — as duas leituras o dão.
- S4 → SUP.4: entra — as duas leituras o dão.
- S7 → SUP.4: entra — as duas leituras o dão.
- S8 → F1.2.2: sai — nenhuma das duas leituras o dá.
- S8 → F1.2.4: sai — nenhuma das duas leituras o dá.
- S8 → F1.2.6: sai — nenhuma das duas leituras o dá.
- S8 → F1.2.8: sai — nenhuma das duas leituras o dá.
- S8 → F1.2.10: sai — nenhuma das duas leituras o dá.
- S8 → F1.4.1: sai — nenhuma das duas leituras o dá.
- S8 → F1.4.2: sai — nenhuma das duas leituras o dá.
- S8 → F1.4.3: sai — nenhuma das duas leituras o dá.
- S8 → F2.1.2.8: sai — nenhuma das duas leituras o dá.
- S8 → SUP.3: entra — as duas leituras o dão.
- S9 → SUP.3: entra — as duas leituras o dão.
- S12 → F2.1.2.1: sai — nenhuma das duas leituras o dá.
- S13 → SUP.3: entra — as duas leituras o dão.
- S15 → SUP.3: entra — as duas leituras o dão.
- S16 → F3.1.9: sai — nenhuma das duas leituras o dá.
- S16 → SUP.5: entra — as duas leituras o dão.

## Divergências — para você decidir

| item | subitem | só na | trecho dado | por quê, segundo quem o deu | no mapeamento de 30/10? | o que ficou |
|---|---|---|---|---|---|---|
| S1 | F2.1.1.5 | primeira leitura | "stating the platform for each" | interface usada em cada fonte | sim | fica (é do mapeamento atual) |
| S1 | F8.3.6 | primeira leitura | "Name each individual database searched, stating the platform for each" | seção do manuscrito que relata as fontes | sim | fica (é do mapeamento atual) |
| S1 | SUP.3 | primeira leitura | "stating the platform for each" | suplemento da busca traz as interfaces | não | não entra (não é do mapeamento atual) |
| S1 | F2.1.1.2 | segunda leitura | "database" | O tipo 'Base bibliográfica' separa as bases das demais fontes registradas. | não | não entra (não é do mapeamento atual) |
| S2 | F2.1.1.1 | primeira leitura | "listing all of the databases searched" | nome de cada fonte | sim | fica (é do mapeamento atual) |
| S2 | F2.1.1.5 | primeira leitura | "state the name of the platform" | interface usada na fonte | sim | fica (é do mapeamento atual) |
| S2 | F8.3.6 | primeira leitura | "state the name of the platform, listing all of the databases searched" | seção do manuscrito que relata as fontes | não | não entra (não é do mapeamento atual) |
| S2 | SUP.3 | primeira leitura | "state the name of the platform" | suplemento da busca traz as interfaces | não | não entra (não é do mapeamento atual) |
| S3 | F8.3.6 | primeira leitura | "List any study registries searched" | seção do manuscrito que relata as fontes | sim | fica (é do mapeamento atual) |
| S4 | F8.3.6 | primeira leitura | "Describe any online or print source purposefully searched or browsed" | seção do manuscrito que relata as fontes | sim | fica (é do mapeamento atual) |
| S5 | F8.3.6 | primeira leitura | "Indicate whether cited references or citing references were examined" | seção do manuscrito que relata as fontes | sim | fica (é do mapeamento atual) |
| S6 | F8.3.6 | primeira leitura | "Indicate whether additional studies or data were sought by contacting authors, experts, manufacturers, or others" | seção do manuscrito que relata as fontes | sim | fica (é do mapeamento atual) |
| S7 | F8.3.6 | primeira leitura | "Describe any additional information sources or search methods used." | seção do manuscrito que relata as fontes | não | não entra (não é do mapeamento atual) |
| S8 | F2.1.1.6 | primeira leitura | "the search strategies for each database and information source" | campos pesquisados, parte da estratégia executada | sim | fica (é do mapeamento atual) |
| S8 | F2.1.2.5 | primeira leitura | "the search strategies for each database and information source" | vocabulários controlados usados na execução | sim | fica (é do mapeamento atual) |
| S8 | F2.1.2.6 | primeira leitura | "the search strategies for each database and information source" | termos livres usados na execução | sim | fica (é do mapeamento atual) |
| S8 | F8.3.7 | primeira leitura | "Include the search strategies for each database and information source" | seção do manuscrito da estratégia de busca | sim | fica (é do mapeamento atual) |
| S9 | F8.3.7 | primeira leitura | "Specify that no limits were used, or describe any limits or restrictions applied to a search" | seção do manuscrito da estratégia de busca | sim | fica (é do mapeamento atual) |
| S9 | F1.2.10 | segunda leitura | "study design" | Termos de filtro de tipo de estudo na string restringem a busca por delineamento. | não | não entra (não é do mapeamento atual) |
| S10 | F8.3.7 | primeira leitura | "Indicate whether published search filters were used" | seção do manuscrito da estratégia de busca | não | não entra (não é do mapeamento atual) |
| S12 | F2.1.2.8 | primeira leitura | "rerunning searches" | rodadas de busca enumeradas | sim | fica (é do mapeamento atual) |
| S12 | F8.3.7 | primeira leitura | "Report the methods used to update the search(es)" | seção do manuscrito da estratégia de busca | não | não entra (não é do mapeamento atual) |
| S13 | F8.3.6 | primeira leitura | "provide the date when the last search occurred" | seção do manuscrito das fontes, onde a data da última busca é relatada | sim | fica (é do mapeamento atual) |
| S15 | F3.1.6 | primeira leitura | "Document the total number of records identified" | soma dos brutos antes da deduplicação | sim | fica (é do mapeamento atual) |
| S15 | F8.1.1 | primeira leitura | "Document the total number of records identified" | total identificado nas bases, no fluxograma | sim | fica (é do mapeamento atual) |
| S15 | F8.1.2 | primeira leitura | "other information sources" | total de outras fontes, no fluxograma | sim | fica (é do mapeamento atual) |
| S15 | F8.3.16 | primeira leitura | "Document the total number of records identified from each database and other information sources." | seção de resultados da seleção | sim | fica (é do mapeamento atual) |
| S16 | F1.3.2.5 | segunda leitura | "Describe the processes" | Registra, no protocolo, o critério de identificação e resolução de duplicatas. | sim | fica (é do mapeamento atual) |
| S16 | F3.1.10 | primeira leitura | "Describe the processes" | resolução manual dos conflitos, parte do processo | sim | fica (é do mapeamento atual) |

- **S1, cobertura:** primeira "completa", segunda "parcial", mapeamento de 30/10 "completa" — fica "completa" (a do mapeamento atual). Falta, segundo a primeira: —. Segundo a segunda: A plataforma de cada base (ex.: Ovid, EBSCOhost, PubMed) não tem campo. F2.1.1.5 registra só o modo de acesso (Web/API/OAI-PMH), e F2.1.1.3 registra a URL, da qual a plataforma apenas se infere.
- **S2, cobertura:** primeira "parcial", segunda "nenhuma", mapeamento de 30/10 "parcial" — fica "parcial" (a do mapeamento atual). Falta, segundo a primeira: a trilha tem uma entrada por fonte e não tem onde declarar que várias bases foram buscadas de uma vez numa mesma plataforma, nem listar sob ela as bases buscadas. Segundo a segunda: Nenhum campo registra a busca simultânea de várias bases numa mesma plataforma: falta o nome da plataforma e a lista das bases cobertas por uma única execução. F2.1 registra fonte a fonte, e F2.1.1.5 traz só o modo de acesso.
- **S4, cobertura:** primeira "completa", segunda "parcial", mapeamento de 30/10 "completa" — fica "completa" (a do mapeamento atual). Falta, segundo a primeira: —. Segundo a segunda: Nenhum campo registra como se navegou (sumários folheados, seções de sites, anais impressos). F2.2.5 registra só quais periódicos e volumes; F2.2.2 registra só strings, que não descrevem a navegação.
- **S5, cobertura:** primeira "completa", segunda "parcial", mapeamento de 30/10 "completa" — fica "completa" (a do mapeamento atual). Falta, segundo a primeira: —. Segundo a segunda: F2.2.4 não registra a direção do rastreamento (referências citadas × citantes). Só F2.2.7 deixa explícito que as referências citadas foram examinadas.
- **S6, cobertura:** primeira "completa", segunda "parcial", mapeamento de 30/10 "completa" — fica "completa" (a do mapeamento atual). Falta, segundo a primeira: —. Segundo a segunda: Não há campo para contato com autores (inclusive para obter dados), fabricantes ou outros. F2.2.6 cobre só especialistas e não registra se o contato buscava estudos ou dados.
- **S12, cobertura:** primeira "parcial", segunda "nenhuma", mapeamento de 30/10 "parcial" — fica "parcial" (a do mapeamento atual). Falta, segundo a primeira: o método de atualização (reexecução, alerta por e-mail), a frequência e o que mudou de uma rodada a outra. Segundo a segunda: Nenhum campo registra o método de atualização da busca (reexecução, alertas). F2.1.2.8 enumera rodadas de busca, mas não diz se são atualizações ou refinamentos nem como foram feitas. Na dúvida, não o apontei.
- **S15, cobertura:** primeira "completa", segunda "parcial", mapeamento de 30/10 "completa" — fica "completa" (a do mapeamento atual). Falta, segundo a primeira: —. Segundo a segunda: Não há contagem por fonte para rastreamento de citações, busca manual, especialistas e listas de referências: F2.2.4 a F2.2.7 não têm campo de número. F8.1.2 registra só a soma das 'outras fontes'.
