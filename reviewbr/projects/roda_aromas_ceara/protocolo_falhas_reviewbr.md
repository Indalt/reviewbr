# Protocolo (F0/F1) — incoerências do ReviewBR encontradas pelo `designer`

12/11/2026. Nenhuma foi contornada com script. Nenhuma tool recusou o pedido: `plan_research_protocol` criou o
`project_state.json` certo (método `scoping-prisma-scr`, PCC, `control_level` estrito, `status` DRAFT, fase F0,
`decisions` vazio) e as pastas do `manifest.json`. As incoerências estão no texto que a tool escreve e no catálogo.
O `protocol.md` foi preenchido pelo `designer` com Write (conduta normal da F0/F1), mantendo os títulos de seção
que o auditor do protocolo lê.

| id | tool / arquivo | o que acontece | por que é incoerente | reprodução |
|---|---|---|---|---|
| P1 | `plan_research_protocol` (`reviewbr-mcp/src/services/project_init.ts`) | escreve um `protocol.md` genérico, não o `protocol_template.md` do método: sem os ids F0.x/F1.x e sem a tabela PCC | a skill do `designer` manda copiar o `protocol_template.md` do método; a tool usa outro esqueleto. O auditor (`protocol_auditor.ts`) lê os títulos do esqueleto genérico ("Justificativa", "Relevância", "Critérios de Inclusão", "Estratégia de Busca (Sintaxe)", "Processo de Seleção", "Registro de Protocolo"), e não os do template do método — um protocolo feito só pelo template do método não passaria no auditor | `plan_research_protocol` com `methodId: scoping-prisma-scr`, `researchType: scoping_review`; abrir o `protocol.md` gerado |
| P2 | `plan_research_protocol` | o esqueleto já vem com valores que o pesquisador não deu: "Escopo de busca: Global", "Idiomas aceitos: Sem restrição", e lista de fontes com PubMed, BVS/LILACS/BDENF e OasisBR | RV-03: campo sem resposta deveria vir `[TBD]`. Aqui o pesquisador escolheu pt/en/es, e um rascunho não preenchido declararia "sem restrição" | idem P1 |
| P3 | `plan_research_protocol` e `protocol_auditor.ts` | o texto do campo "Registro" e as mensagens do auditor citam o **PRISMA 2020** (item 24a para o registro; item 8 para a triagem) | o método declara só PRISMA-ScR + PRISMA-S, e o `manifest.json` diz que "o PRISMA 2020 não se aplica aqui". Num escopo os itens são PRISMA-ScR 5 (registro) e 9 (seleção) | idem P1; e `submit_protocol_for_approval` com campos vazios (não executado aqui: a fase manda não travar) |
| P4 | `plan_research_protocol` | o cabeçalho diz "entrada `prisma-scr` do catálogo, sem data de leitura no catálogo" | a regra de 12/11/2026 (metodologia se aponta com fonte e data de leitura) não está satisfeita pela entrada do catálogo | idem P1 |
| P5 | `validate_repository` (`BR-AGG-0001`) | a tool chama `BR-AGG-0001` de "IBICT — Oasisbr"; a busca exploratória e o `REGISTRO.md` o chamam de BDTD | o PRISMA-S S1 pede o nome de cada base com a plataforma; hoje não se sabe se a "BDTD" do projeto é a BDTD ou o Oasisbr | `validate_repository` com `repositoryId: BR-AGG-0001` |
| P6 | catálogo `reviewbr-mcp/data/sources/repositories_catalog.json` | `BR-AGG-0001` está com `oaiPmh.available: false`, `verified: false`, mas `validate_repository` responde OAI-PMH OK | o catálogo está desatualizado em relação ao que a tool mede | idem P5 |
| P7 | `validate_repository` (`BR-FED-0004` UFC, `BR-EST-0006` UECE) | conectividade HTTP 200, OAI-PMH HTTP 404 no endpoint do catálogo | confirma, pelo lado do endpoint, a falha F7 já registrada (zero até para "caju"); não é achado novo | `validate_repository` com cada id, checks connectivity + oai_pmh |
| P8 | `validate_repository` (`BR-RES-0001` Alice) | conectividade e OAI-PMH OK | a busca devolve zero até para "caju" (F7): a validação não enxerga a falha de busca | `validate_repository` com `BR-RES-0001`; comparar com a busca 30 de `exploratoria/01_buscas_log.md` |

Não executado de propósito: `heal_repositories` (altera o catálogo do sistema; projeto não altera o ReviewBR) e o
check `search` do `validate_repository` (faz busca de conteúdo).
