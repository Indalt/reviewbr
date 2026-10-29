# Diagnóstico — Frente 2, auditoria do ReviewBR

**Data:** 25/09/2026 · **Procedimento:** skill `system-audit` · **Produz diagnóstico, não correção**

**Denominador apurado nesta corrida** (controle positivo: `dist` e `src` expõem as mesmas 44 tools):
44 tools · 8 agentes · 9 skills · 2 metodologias · 2 padrões · 36 serviços · 8 invariantes RV


## 1. Veredicto

**75 achados**, dos quais **22 bloqueiam**, 42 são sérios e 11 menores.


A pergunta era *o sistema faz o que declara fazer?*. A resposta é **não** — e por um motivo único,
que se repete em toda camada auditada: **a verificação existe, está escrita, está declarada — e
não está no caminho.** Não é ausência de rigor; é rigor que ninguém invoca.


É, palavra por palavra, o diagnóstico que o próprio sistema já fazia de si na skill de gates:


> *"Foi a ausência de um agente que **chamasse** essas verificações no momento certo (não a
> ausência delas) que travou o sistema antigo."*


O padrão não foi corrigido: foi herdado.


## 2. Cobertura

| Lote | Escopo | Estado |
|---|---|---|
| A1 | 17 tools de busca, aquisição e importação | 17 de 17 (rodou à parte) |
| A2 | 12 tools de triagem, extração e leitura | 12 de 12 |
| A3 | 16 tools de protocolo, validação e manutenção | 16 de 16 |
| B | 8 invariantes RV + guardrail + RBAC | 15 de 15 |
| C | 8 agentes + 9 skills | 17 de 17 |
| D | 2 padrões + 2 metodologias | 5 de 5 |

**Denominador coberto por inteiro.** O lote A1 morreu no limite de sessão na primeira corrida
e foi executado separadamente — sem ele a auditoria teria deixado 17 tools fora.


## 3. Classificação

### 3.1 Tools — executa ou decide? (RV-06)

| Classe | Quantas |
|---|---|
| EXECUTA | 41 |
| DECIDE | 3 |
| MISTA | 1 |

O baixo número de tools que DECIDEM é **coerente** com o RV-06 — a inteligência mora na camada
de agente. O problema não é a quantidade: é que **nenhuma das que decidem tem verificação
determinística por cima**, e elas estão concentradas na triagem e na extração, onde a decisão
mais afeta o viés.


### 3.2 Invariantes — quem verifica cada RV?

| Classe | Quantos |
|---|---|
| determinística | 3 |
| parcial | 5 |
| AUSENTE | 7 |

### 3.3 Agentes e skills

| Classe | Quantos |
|---|---|
| OK | 6 |
| DIVERGENTE | 16 |

---

## 4. Os achados que BLOQUEIAM


### DEBT-019 — export_dataset carimba "PRISMA-S Compliant" em qualquer coisa — inclusive em registro sem URL e sem repositório

src/services/data.ts:11-13 (`stamp: "PRISMA-S Compliant / Strict Protocol Enforced"`), :45 (`# VALIDATION: PRISMA-S Compliant...`), :56 (`> **✓ VALIDATION STAMP:** PRISMA-S Compliant...`). Nenhuma validação em todo o método exportDataset (data.ts:7-61). A skill que define os gates declara esta tool como o verificador da RV-08: .claude/skills/prisma-rigor-gates/SKILL.md:21


**Por que importa:** É autocertificação — exatamente o que o princípio do sistema proíbe ("Rigor não é autocertificação do agente: cada gate é uma verificação determinística"). O verificador declarado da RV-08 (origem rastreável: repositório + instituição + URL) não verifica nada e ainda assina conformidade. Pior: o export sai com a string literal "undefined" nas colunas url e repo, carimbado como conforme. Um export 


### DEBT-020 — screen_candidates com stage='fulltext' nunca lê o texto completo — a inclusão final é decidida por título e resumo

src/services/screen.ts:219 monta o caminho `path.join(process.cwd(), projectPath, "02_fulltext", ...)`; essa pasta não existe em lugar nenhum do sistema — project_init.ts:193 cria `04_extraction/fulltext`, e `grep -rn "02_fulltext" src/` devolve UM único acerto, a própria linha 219. Além disso o parâmetro `stage` nunca chega ao serviço: src/index.ts:632 chama `screenCandidates(records, params.criteria, params.projectPath)` e `grep -n "stage" src/services/screen.ts` devolve ZERO. O resultado é gravado como `03_screening/included.json` = incluídos FINAIS (project_artifacts.ts:108)


**Por que importa:** A triagem de texto completo (F4.2) é onde a revisão descarta o que parecia elegível pelo resumo. Aqui ela roda com o MESMO prompt e os MESMOS dados da triagem TA — o funil PRISMA fecha certinho (compute_flow_counts só confere aritmética) exibindo uma fase de leitura integral que não aconteceu. É o viés mais caro possível numa revisão sistemática: inclusão final sem leitura do estudo.


### DEBT-021 — A regra de saturação (get_screening_report) é cega: nenhuma tool grava screening_decision no banco

src/services/database.ts:312-316 define `updateScreening` (único lugar que faz `UPDATE records SET screening_decision = ?, ... stage = 'screened'`) e ela NÃO TEM UM ÚNICO CHAMADOR em todo o src/. src/services/screening_metrics.ts:73-85 filtra exatamente por `r.stage === "screened"` e `r.screening_decision`. screen_candidates grava só em disco (src/index.ts:648, writeScreening) e nunca toca o banco


**Por que importa:** A skill screening-rules manda: "Após cada batch de screen_candidates, chame get_screening_report. Se saturationAlert:true ... pergunte se encerra". Como a coluna nunca é preenchida, screenedRecords é sempre vazio e o relatório devolve invariavelmente "Nenhum registro triado ainda" / alerta false. É um gate que NUNCA pode reprovar — o mesmo padrão do validate_prisma_flow e do validateToolAccess já 


### DEBT-022 — screen_with_asreview não produz nenhuma decisão de triagem: roda `simulate` sobre dataset sem rótulos e nunca lê a saída

O próprio comentário do serviço diz a precondição: src/services/asreview_bridge.ts:84-86 — "`asreview simulate` requires a FULLY LABELED dataset. This means the records must already have screening_decision set." Mas o CSV enviado (asreview_bridge.ts:123 → src/services/data.ts:22) tem header `title,abstract,keywords,authors,doi,url` — SEM coluna de rótulo. E o arquivo de saída nunca é lido: `grep -rn "\.asreview" src/` devolve só asreview_bridge.ts:82, :127 e :183, todas escrita/menção. O handler (src/index.ts:2116) devolve apenas `result.summary`


**Por que importa:** A tool se apresenta como "Executa a triagem via ASReview ML ... processa o dataset, e retorna os resultados" e a skill screening-rules a oferece como a trilha (B) "ML validado, para publicação". Na prática ela grava um CSV, dispara um subprocesso e responde "✅ Simulação ASReview concluída com sucesso" com um caminho de arquivo — zero registros triados, zero artefato do funil, nada que compute_flow


### DEBT-023 — rag_query devolve tradução gerada por LLM como se fosse trecho do estudo primário, com a proveniência real do estudo

src/services/batch_processor.ts:435-438 grava a tradução em `path.dirname(pdfPath)` como `<base>_tradução_<lang>.md`; src/services/rag_lexical.ts:141 indexa TODO `.txt|.md` do diretório do corpus sem filtro; :118-119 resolve a proveniência por `base.includes(id)` — o nome do arquivo traduzido contém o identifier, então herda fonte e URL do original; :213-219 devolve o trecho com `fonte_repositorio` e `url_hospedagem` do estudo real e nenhum campo que distinga texto primário de tradução


**Por que importa:** A própria tool de tradução declara "NÃO É FONTE PRIMÁRIA ... NÃO integra o protocolo de pesquisa" (index.ts:2279, batch_processor.ts:442-449). Mas a salvaguarda é uma frase DENTRO do texto, não um campo: quando o trecho volta pelo rag_query, o agente reader (skill evidence-reading) recebe texto de LLM etiquetado com o study_id e a URL do artigo real e o cita como evidência. Além disso o índice rep


### DEBT-033 — RV-01: projeto sem protocol.md e sem project_state.json passa pelo guardrail (fall-through para `return null`)

src/index.ts:157 `return null;` — se `projectPath` aponta para um diretorio sem project_state.json (ProjectStateService.read -> null) e sem protocol.md, as duas guardas de src/index.ts:130-146 sao puladas, o fallback SQLite de :147-156 nao acha projeto, e a funcao LIBERA.


**Por que importa:** O primeiro invariante do sistema — 'protocolo fechado antes da busca' — inverte a logica de trava: em vez de negar por padrao e liberar com prova de [LOCKED], o guardrail nega so quando encontra prova de DRAFT e libera na ausencia de prova. Um projeto que nunca teve protocolo e o caso MAIS permissivo. 10 dos 12 projetos reais em reviewbr/projects/ estao nesse estado.


### DEBT-036 — RV-03, RV-04, RV-06 e RV-07 sao declarados `always_on` sem nenhum gate — e o proprio sistema sabe disso

.claude/methodologies/prisma-sr/manifest.json (invariants_always_on: 8 itens; gates: 4 — RV-01, RV-02, RV-05, RV-08) e o mesmo em .claude/methodologies/scoping-prisma-scr/manifest.json. A verificacao que pega isso existe e reprova: src/services/maintenance_writes.ts:281-289 (MethodologyWriter.validar).


**Por que importa:** Metade dos invariantes 'NUNCA desligaveis' da Camada 1 e conduta em prosa. Nao e uma suspeita da auditoria: o verificador do proprio sistema REPROVA as duas metodologias por isso, e a tool que o expoe (validate_methodology) so pode ser chamada pelo maintainer — que ate hoje nunca rodou. A regra que detecta o buraco depende de alguem lembrar de chama-la, que e o buraco.


### DEBT-038 — RV-05: o verificador existe, reprova de verdade e nao esta no caminho do export — o precedente do sistema, intacto

.claude/methodologies/prisma-sr/manifest.json declara o gate F8: `{"rule":"RV-05","tool":"validate_prisma_flow","blocks":"export/manuscrito se a aritmetica do funil nao fechar"}`. src/index.ts:728-753 (export_dataset) nao importa nem chama PrismaFlowValidator: faz JSON.parse, chama dataService.exportDataset e devolve.


**Por que importa:** A skill fecha com: "Foi a ausencia de um agente que CHAMASSE essas verificacoes no momento certo (nao a ausencia delas) que travou o sistema antigo — `validate_prisma_flow` (RV-05) ja existia e nunca era chamada." O precedente esta descrito como passado e continua sendo presente: a verificacao funciona (provado por execucao no controle positivo) e o unico caminho que o manifest diz que ela bloquei


### DEBT-045 — O mapeamento da trilha para o PRISMA 2020 está deslocado em 6 itens; a verificação de cobertura reporta 5 deles como VERDES

.claude/methodologies/prisma-sr/spec.md:404 (`F8.3.14 | Métodos — Certeza da evidência | Item 14`), :405 (`F8.3.15 | Métodos — Registro e protocolo | Item 15`), :414-417 (`F8.3.24 Financiamento → Item 24`, `F8.3.25 Conflito de interesses → Item 25`, `F8.3.26 Disponibilidade de dados → Item 26`, `F8.3.27 Informações adicionais → Item 27`). Os títulos oficiais, no próprio arquivo do sistema, contradizem isso: .claude/standards/prisma-2020.json:288 (14=Reporting bias assessment), :299 (15=Certainty assessment), :513 (24=Registration and protocol), :550 (25=Support), :561 (26=Competing interests), :574 (27=Availability of data, code and other materials). A contaminação chegou ao dado do padrão: 


**Por que importa:** Não é um órfão — é pior. Órfão o gate enxerga e reprova. Aqui os itens 14, 15, 25, 26 e 27 têm covered_by preenchido, então `check_standard_coverage` os conta como cobertos e devolve verde. A revisão declara aderência a 'Certainty assessment' exibindo como evidência a data de início do protocolo, e a 'Reporting bias assessment' exibindo o sistema GRADE. O registro de protocolo — o artefato que o R


### DEBT-046 — 21 das 42 linhas do checklist PRISMA 2020 não têm cobertura, e nenhum procedimento de revisão chama a verificação que detecta isso

Execução real: StandardsService.checkCoverage(prisma-2020) → total=42, covered=21, orphans=21, valid=false; órfãos = 10a, 10b, 13a-13f, 16a, 16b, 20a-20d, 23a-23d, 24a-24c (todos com covered_by:[] em .claude/standards/prisma-2020.json:184, 192, 241, 249, 257, 265, 273, 281, 346, 354, 417, 425, 433, 441, 482, 490, 498, 506, 527, 535, 543). A tool que reprova está em src/index.ts:2360-2388 e é concedida ao analyst (.claude/agents/analyst.md:4), mas grep 'check_standard_coverage' em .claude/skills/prisma-rigor-gates/SKILL.md, synthesis-manuscript/SKILL.md e conduct-review/SKILL.md dá 0, 0 e 0.


**Por que importa:** É o precedente do próprio sistema repetido na íntegra: '.claude/skills/prisma-rigor-gates/SKILL.md:42 — foi a ausência de um agente que CHAMASSE essas verificações no momento certo (não a ausência delas) que travou o sistema antigo; validate_prisma_flow (RV-05) já existia e nunca era chamada'. A verificação de cobertura existe, é determinística, já está vermelha, e nenhuma fase a aciona. O manuscr


### DEBT-047 — Nenhuma das 2 metodologias declara conformance.standards: elas não sabem contra que padrão verificam

Não existe a chave `conformance` em .claude/methodologies/prisma-sr/manifest.json (51 linhas) nem em .claude/methodologies/scoping-prisma-scr/manifest.json (52 linhas). O validador que exige o campo está em src/services/maintenance_writes.ts:291-293 (`const stds = man.conformance?.standards ?? []; if (stds.length === 0) errors.push("Sem 'conformance.standards' ...")`). Execução real: ambas retornam padroes:[].


**Por que importa:** O padrão só aparece em prosa, no campo `name` do manifest ('Revisão Sistemática (PRISMA 2020 + PRISMA-S)'). Nada em tempo de execução liga a metodologia ao arquivo de .claude/standards/ que ela deve cumprir, então nenhum gate pode descobrir sozinho qual checklist gerar nem contra o que medir cobertura. Quando o PRISMA 2020 tiver sucessor — como substituiu o de 2009 — nada no sistema detecta que aq


### DEBT-048 — RV-03, RV-04, RV-06 e RV-07 são declaradas 'sempre ativas' nas duas metodologias e nenhum gate as ativa

.claude/methodologies/prisma-sr/manifest.json:27 declara invariants_always_on com as 8 RV; :29-34 traz gates com 4 entradas apenas — RV-01 (submit_protocol_for_approval), RV-02 (compute_flow_counts), RV-05 (validate_prisma_flow), RV-08 (audit_methodology). Idêntico em scoping-prisma-scr/manifest.json:28 e :30-35. A própria skill confirma que as quatro faltantes não têm verificador determinístico: .claude/skills/prisma-rigor-gates/SKILL.md:16 (RV-03 → 'inspeção de artefatos'), :17 (RV-04 → 'project_state.json + logs'), :19 (RV-06 → 'conduta: agente decide, tool executa'), :20 (RV-07 → 'conferência F1.2→F1.4').


**Por que importa:** Metade dos invariantes anti-viés é autocertificação — exatamente o que o princípio do sistema recusa: 'Rigor não é autocertificação do agente: cada gate é uma verificação determinística.' RV-06 ('MCP executa, não decide') e RV-07 ('strings derivam do protocolo aprovado') são justamente os dois que dependeriam de verificação externa para valer, e a coluna 'Verificador' os resolve com a palavra 'con


### DEBT-049 — O array `gates` do manifest não é lido por nenhum código de runtime: a declaração de gate é dado inerte

grep por `gates` em reviewbr/reviewbr-mcp/src/ (excluindo .tmp) retorna apenas src/services/maintenance_writes.ts:236 (escreve gates:[] ao criar esqueleto), :281-282 e :306 (o validador que só CONTA os gates). Nenhum orquestrador, nenhuma tool de fase e nenhum serviço lê `manifest.gates` para bloquear coisa alguma. O único leitor de manifest.json em runtime é o próprio validador (maintenance_writes.ts:269) e o MethodologyCatalogService, que só lista nomes de pasta (methodology_catalog.ts:110-112). A skill que deveria consumir isso é prosa: .claude/skills/methodology-router/SKILL.md:16 e :23 mandam 'carregue manifest.json (... gates ...)' e 'informe ao orquestrador ... gates obrigatórios'.


**Por que importa:** O manifest declara `blocks: "spawn do librarian se protocolo não estiver [LOCKED]"` (prisma-sr/manifest.json:30). Nada executa esse bloqueio: a string é lida por um humano ou por um agente que decide obedecê-la. É a definição de autocertificação aplicada ao próprio mecanismo de gate. O princípio diz 'o orquestrador só avança com verde' — mas o orquestrador nem sabe que existe um array chamado gate


### DEBT-056 — O log PRISMA-S obrigatório não tem produtor nem verificador — e o log que a máquina escreve é ignorado por todo o sistema

.claude/agents/librarian.md:19 ("Para cada busca tentada, anexe uma linha a logs/search_log_prisma_s.csv... Nenhuma busca sem registro"); .claude/skills/prisma-s-logging/SKILL.md:10-12; .claude/skills/conduct-review/SKILL.md:55 usa esse CSV como gate de retorno da F2. No código: grep -rn "search_log_prisma_s" src/ = 0. O único log escrito por tool é src/index.ts:102-123 (logToLocalProject → logs/search_history.json), chamado por 11 tools de busca (src/index.ts:528, 871, 1085, 1551, 1617, 1691, 1754, 1819, 1884).


**Por que importa:** A F2 inteira — a busca, o artefato mais auditável de uma revisão PRISMA-S — repousa num CSV que o próprio agente digita. O gate da conduct-review confere se o arquivo existe, não se ele corresponde ao que foi executado. É exatamente a autocertificação que a skill de gates proíbe: o agente produz o insumo E assina a verificação. Pior: os dados reais (query, hits, timestamp, erro) já são gravados pe


### DEBT-057 — export_dataset carimba "PRISMA-S Compliant / Strict Protocol Enforced" sem verificar nada — e a skill de gates o declara verificador do RV-08

.claude/skills/prisma-rigor-gates/SKILL.md:21 — "RV-08 | Origem rastreável (repositório+instituição+URL) | audit_methodology + validação em export_dataset". Implementação: src/services/data.ts:6-59 — o método exportDataset não lê nem confere fonte_repositorio, instituicao_origem ou url_hospedagem; emite o carimbo incondicionalmente em data.ts:10-13 (json), :43 (csv) e :55 (markdown).


**Por que importa:** O selo de conformidade é emitido para qualquer conteúdo, inclusive um registro com origem vazia. Um suplemento exportado sai com a etiqueta de conformidade PRISMA-S sem que o RV-08 tenha sido conferido uma única vez — e a skill de gates afirma ao orquestrador que essa validação ocorre. É um verificador declarado que é, na prática, um adesivo. Se o pesquisador confiar no carimbo, o RV-08 fica cober


### DEBT-067 — audit_methodology emite aprovação total ("5/5 ✅") com um check REPROVADO — inclusive o do RV-08

src/services/methodology_auditor.ts:74 declara `maxScore: 6` e as linhas 62-67 empilham SEIS checks; mas o relatório é gerado com denominador 5 fixo: linha 376 `\`**Score de Conformidade:** **${score}/5**\`` e linhas 398-402 `if (score === 5) { ... "atende **todos os 5 critérios de conformidade**" }`. Rodado sobre um dataset com 5 PASS e transparency_audit=FAIL, a saída foi literalmente: `**Score de Conformidade:** **5/5** ✅` e `A pesquisa submetida atende **todos os 5 critérios de conformidade** auditados. A metodologia está alinhada com as diretrizes PRISMA/PRISMA-S.`


**Por que importa:** É a tool que o manifest de prisma-sr nomeia como gate do RV-08 (gates[3]: "blocks síntese se algum estudo incluído não tiver fonte_repositorio/url_hospedagem"). O check que reprovou é exatamente esse — checkTransparencyAudit, methodology_auditor.ts:346-364, que cita "Violação do Item 3 e 8 do PRISMA-S". O sistema entrega atestado de conformidade PRISMA/PRISMA-S sobre uma revisão que violou o invar


### DEBT-068 — record_system_finding e absorb_methodology APAGAM o backlog e o catálogo em silêncio quando o arquivo em disco não passa no schema

src/services/system_debt.ts:100-107 e src/services/methodology_catalog.ts:97-106: `read()` devolve `null` tanto para arquivo ausente quanto para safeParse reprovado. Os escritores tratam esse `null` como "ainda não existe": src/services/maintenance_writes.ts:60 `SystemDebtService.read(repoRoot) ?? { schemaVersion: 1, updatedAt: "", findings: [] }` e maintenance_writes.ts:145 `MethodologyCatalogService.read(repoRoot) ?? { ... entries: [] }`. Em seguida gravam por cima (system_debt.ts:110-115 e maintenance_writes.ts:157). Medido: backlog real de 18 achados com um `change_type` escrito "CORREÇÃO" (com cedilha) virou 1 achado; catálogo real de 57 entradas com `schemaVersion` como string virou 1 


**Por que importa:** É a fila inteira de memória do sistema entre sessões — os 18 achados que o próprio maintainer registrou, inclusive os DEBT abertos. A corrupção necessária é mínima e plausível: uma edição manual do JSON, exatamente o que a skill diz que o maintainer fazia antes destas tools existirem. E o sintoma é invisível: audit_system_debt responde "Backlog de dívida ausente: `.claude/maintenance/system_debt.j


### DEBT-069 — submit_protocol_for_approval TRAVA como aprovado um protocolo sem conteúdo e um protocolo feito só de [TBD]

src/services/protocol_auditor.ts:41-95. O auditor faz três testes: (1) e (2) exigem apenas que o texto-molde `[PREENCHIMENTO OBRIGATÓRIO: ...]` tenha sumido e que a seção tenha `length > 20` (linhas 48-49 e 58-59); (3) aceita a estratégia de busca se `hasBooleans || hasParentheses` (linha 78) — um par de parênteses vazio basta. Nada olha `[TBD]`. Medido: protocolo cujos critérios são 30 caracteres 'x' e cuja estratégia de busca é a string `(   )` → `{"valid":true,"score":3,"maxScore":3}`; protocolo em que todas as seções são `[TBD]` e a busca é `[TBD] AND [TBD]` → `{"valid":true,"score":3,"maxScore":3}`. Aprovado, src/index.ts:1338-1346 reescreve [DRAFT]→[LOCKED] e grava status LOCKED.


**Por que importa:** Este é o gate nº 1 do sistema — o RV-01, "protocolo fechado antes da busca", o invariante que o manifest de prisma-sr declara bloquear o spawn do librarian. O manifest diz textualmente que ele bloqueia se o protocolo "tiver campos [TBD] obrigatórios"; o código nunca procura `[TBD]`. Ou seja: a condição declarada no manifest não existe no gate. Na prática o pesquisador trava um protocolo vazio, o g


### DEBT-078 — DEBT-017 esta errado nos dois sentidos: sao 10 chamadas ao guardrail, nao 5 — e retrieve_fulltext_byos nao e uma delas

Definicao: reviewbr/reviewbr-mcp/src/index.ts:125. Chamadas: :498 (search_papers_optimized), :839 (search_pubmed), :1019 (search_repository), :1156 (harvest_records), :1522 (search_openalex), :1592 (search_crossref), :1658 (search_scielo), :1730 (search_semanticscholar), :1795 (search_core), :1860 (search_europe_pmc). O bloco server.tool("retrieve_fulltext_byos") ocupa :1496-1519 e tem ZERO ocorrencias; a chamada de :1522 esta dentro de 'const openAlexHandler' declarado em :1521. dist/index.js tem as mesmas 11 ocorrencias (1 definicao + 10 chamadas), ou seja o binario publicado concorda com a fonte.


**Por que importa:** O DEBT-017 subestima a cobertura (perdeu as 6 tools search_* porque os handlers sao consts nomeados fora do server.tool) e simultaneamente credita trava a tool MAIS sensivel do sistema — a aquisicao fora de acesso aberto via Sci-Hub. Quem ler o backlog conclui que o BYOS esta protegido pelo protocolo travado. Nao esta: e possivel baixar full-text por Sci-Hub num projeto em rascunho.


### DEBT-079 — harvest_records chama o guardrail com (undefined, undefined): a trava e sintaticamente presente e semanticamente morta

reviewbr/reviewbr-mcp/src/index.ts:1156 — 'await checkDesignGuardrail(undefined, undefined)'. O schema da tool (:1148-1154) nao tem projectId nem projectPath, entao nao ha o que passar. Com ambos undefined, o corpo de :127 ('if (projectPath)') e pulado, :147 ('if (!id && projectPath)') e pulado, :151 ('if (id)') e pulado, e a funcao cai em 'return null' (:157). Mesma linha no artefato compilado: dist/index.js:999.


**Por que importa:** harvest_records e a tool de maior volume do lote (coleta OAI-PMH em massa). O DEBT-017 a contava como protegida; ela e a unica chamada do sistema que NAO PODE bloquear nada. Pior que ausencia: e uma trava decorativa que passa em qualquer auditoria que conte call-sites em vez de ler argumentos. E exatamente a autocertificacao que a skill de gates proibe.


### DEBT-080 — Fall-through do guardrail: projeto sem project_state.json e sem protocol.md passa liberado — verificado em 3 projetos reais do repositorio

reviewbr/reviewbr-mcp/src/index.ts:127-157. Se ProjectStateService.read retorna null (:130) e protocol.md nao existe (:139), o fluxo cai no fallback SQLite (:146-156) e, se o projeto nao estiver cadastrado no banco, chega em 'return null' (:157) = LIBERADO. Prova on-disk: C:/reviewbr/reviewbr/projects/test, .../buscas e .../roda_de_aromas nao tem nenhum dos dois arquivos.


**Por que importa:** RV-01 exige protocolo [LOCKED] antes de buscar. A implementacao e permissiva por omissao: a ausencia de protocolo — que e exatamente o estado 'ainda nao planejei' que a regra quer barrar — resulta em liberacao. A negacao so acontece quando ALGUEM JA criou o estado. Um projeto novo em pasta limpa e o caso mais provavel de violacao do RV-01 e e justamente o que passa.


### DEBT-081 — projectPath e opcional em 9 das 10 chamadas: omitir o parametro desliga a trava por desenho declarado

reviewbr/reviewbr-mcp/src/index.ts:127-128 traz o comentario explicito 'Preview (sem projectPath) NUNCA bloqueia'. Schemas com 'projectPath: z.string().optional()': :495 (search_papers_optimized), :836 (search_pubmed), :1016 (search_repository), :1958 (search_europe_pmc), :1946 (search_core), :1969 (search_openalex), :1970 (search_crossref), :1982 (search_scielo), :1994 (search_semanticscholar). harvest_records nem tem o campo.


**Por que importa:** A trava do RV-01 e opt-in do chamador. Como o modelo tambem escolhe os argumentos, 'preview' e indistinguivel de 'busca oficial sem protocolo': basta omitir projectPath para executar a mesma busca, na mesma API, com os mesmos resultados, sem passar pela trava. Sobra o fallback SQLite, que tambem depende de projectPath para achar o projeto (:147), entao tampouco atua. Verificacao deterministica e a


---

## 5. Sérios

| id | achado |
|---|---|
| DEBT-024 | A verificação por cima do deduplicate_dataset é o próprio deduplicate_dataset — gate que não pode reprovar |
| DEBT-025 | Deduplicação implementa 2 dos 4 níveis prometidos e falha em DOI com prefixo, em acento e em registro sem DOI |
| DEBT-026 | Nenhuma exclusão recebe motivo padronizado: EX-01..EX-11 não existem no código |
| DEBT-027 | A triagem por LLM é irreprodutível: temperatura não fixada, modelo não registrado, nenhum log de auditoria |
| DEBT-028 | MAYBE é silenciosamente promovido a INCLUÍDO, nas duas pontas do sistema |
| DEBT-029 | Os registros removidos na deduplicação são descartados: nenhum par (mantido, removido, critério) é gravado |
| DEBT-030 | Quatro tools do lote não deixam nenhum rastro de auditoria — nem banco, nem disco |
| DEBT-034 | RV-01: harvest_records chama o guardrail com os dois argumentos `undefined` — guarda morta por construcao |
| DEBT-035 | RV-01: o auditor de protocolo nao verifica [TBD], ao contrario do que a skill declara |
| DEBT-037 | RV-04 nao tem escritor: ProjectStateService.logDecision existe e nunca e chamado; o log SQLite nao tem campo de agente |
| DEBT-039 | RV-02: compute_flow_counts grava o prisma_flow.json mesmo com a validacao REPROVADA, e edicao manual so vira aviso |
| DEBT-040 | RV-08: o gate nomeia audit_methodology mas a tool nao olha fonte_repositorio/url_hospedagem, e o export nao valida nad |
| DEBT-041 | O RBAC por papel (validateToolAccess/validateAction) nao tem um unico call site em runtime |
| DEBT-042 | ProtocolGuard e codigo morto integral: protocol.md e sobrescrito direto por fs.writeFileSync |
| DEBT-043 | Nenhum teste cobre os invariantes RV-01..RV-08; a suite testa o RV-11 e a governanca |
| DEBT-050 | Metodologia scoping-prisma-scr está IMPLEMENTADA e o padrão PRISMA-ScR não existe como dado; o sistema anuncia ao pesq |
| DEBT-051 | O gerador do suplemento obrigatório produz uma tabela Markdown quebrada para o PRISMA-S: 16 linhas sem cabeçalho nem s |
| DEBT-052 | A versão do PRISMA-S nunca foi confirmada, e versão não confirmada não reprova: checkCoverage devolve valid=true |
| DEBT-053 | O sistema anuncia 'PRISMA 2020 (27 itens, 44 subitens)' — número que o próprio padrão desmente (21 subitens, 42 linhas |
| DEBT-054 | 39 referências da trilha estão estacionadas em 6 itens-cabeçalho e são descartadas pelo cálculo de cobertura |
| DEBT-058 | Snowballing "para trás" (referências) é código morto: a tool anuncia "Citações e Referências" e nunca busca uma única  |
| DEBT-059 | As quatro travas obrigatórias do snowballing existem só na prosa do librarian: a tool não tem profundidade, filtro, te |
| DEBT-060 | Sete de oito agentes proíbem "gerar scripts" em prosa e recebem Bash + Write no frontmatter; o mapa de governança não  |
| DEBT-061 | reader.md manda indexar um diretório de PDFs num indexador que só lê .txt/.md, e aponta um arquivo de índice que não e |
| DEBT-062 | O consentimento humano do Sci-Hub/BYOS existe só como frase na descrição da tool — nada o exige, registra ou verifica |
| DEBT-063 | A F6 (risco de viés) está ativa na metodologia, é mandada pelo analyst e pela skill, e não tem tool nem gate — fase in |
| DEBT-064 | O COORDINATOR é o maior papel do sistema (24 tools) e é o único sem agente, sem espelho e sem teste |
| DEBT-066 | As Camadas 2 e 3 da skill de gates prometem verificação de completude que não existe em nenhum lugar |
| DEBT-070 | Nenhum gate é chamado por código: o campo `gates[].blocks` do manifest não é lido em lugar nenhum do runtime |
| DEBT-071 | compute_flow_counts: a validação RV-05 que ele roda é tautológica, e ele grava o prisma_flow.json mesmo com a checagem |
| DEBT-072 | validate_system_change aceita `protocol_locked` autodeclarado e nunca confere o protocolo no disco — o gate do RV-11 a |
| DEBT-073 | submit_protocol_for_approval INVENTA método, framework e tipo de revisão quando o project_state.json não existe |
| DEBT-082 | O ramo legado SQLite do guardrail e allow-by-default: so o status literal 'DRAFT_DESIGN' bloqueia, e as proprias busca |
| DEBT-083 | project_state.json corrompido e tratado como inexistente e vira liberacao silenciosa |
| DEBT-084 | As 6 tools search_* gravam 01_raw com path.join(process.cwd(), projectPath) sem tratar caminho absoluto — o insumo do  |
| DEBT-085 | logToLocalProject tem a mesma classe de bug: com projectPath absoluto o log PRISMA-S nao e escrito |
| DEBT-086 | import_dataset_ris e import_bvs_export nao gravam em 01_raw: registros importados ficam invisiveis ao funil PRISMA |
| DEBT-087 | expand_search_snowball nao tem projectPath: a fonte 'outros metodos' do PRISMA nunca chega a 01_raw/other_records.json |
| DEBT-088 | import_dataset_ris apaga a origem real: todo registro vira repositoryName 'Manual Import' |
| DEBT-089 | retrieve_fulltexts reescreve o dataset de entrada a cada lote e pode truncar o corpus |
| DEBT-090 | A restricao de uso do BYOS existe so na descricao em linguagem natural — nao ha verificacao no codigo |
| DEBT-091 | Seis rotas de aquisicao nao deixam nenhum registro de auditoria PRISMA-S |

## 6. Menores

| id | achado |
|---|---|
| DEBT-031 | rag_query não devolve página, mas a skill de leitura exige citação [study_id, p.X] |
| DEBT-032 | path_sandbox importado e nunca aplicado em batch_processor: caminhos arbitrários de tool param |
| DEBT-044 | audit_methodology relata 6 checagens como se fossem 5: score maximo e veredito inconsistentes |
| DEBT-055 | A spec da revisão de escopo não mapeia nenhum subitem a nenhum item de padrão |
| DEBT-065 | Em cinco dos oito agentes o "contrato de papel" escrito no corpo está defasado em relação ao frontmatter — inclusive c |
| DEBT-074 | check_standard_coverage: o comportamento de listagem que a própria tool documenta é inalcançável |
| DEBT-075 | assess_research_design anuncia ao COORDINATOR uma auditoria de "5 checks" que na verdade tem 6 |
| DEBT-076 | guardedHandler é um pass-through e sobrevive numa única tool — código morto com nome de trava |
| DEBT-077 | heal_repositories só olha os repositórios já marcados como quebrados: nunca detecta regressão de um endpoint saudável |
| DEBT-092 | search_scielo grava os registros com a origem 'OpenAlex', nao SciELO |
| DEBT-093 | Persistencia em 01_raw condicionada a resolucao de projectId em tres tools de busca |

---

## 7. Uma correção que a auditoria fez no auditor

O **DEBT-017** foi levantado por conversa, antes da auditoria, afirmando que *5 de 16* tools de
aquisição chamavam o guardrail do RV-01. **Estava errado.** O lote A1 foi instruído a confirmar
ou contradizer de forma independente, e contradisse.


O quadro real: as **9 tools `search_*` chamam** o guardrail corretamente; `harvest_records` o
chama com `(undefined, undefined)` — guarda morta; e as **7 de aquisição e importação não o
chamam**. Ou seja: não se *busca* com protocolo em rascunho, mas se **baixa PDF, faz snowballing
e importa dataset inteiro** sem trava nenhuma.


O método anterior fatiava `src/index.ts` pelos marcadores `server.tool("nome"`. Seis handlers
são declarados como constante nomeada **fora** do `server.tool` e passados por referência —
caíam no balde errado. **Número errado publicado como achado é tão ruim quanto lacuna não vista**,
e foi a regra do controle positivo que o pegou.


---

## 8. Critério de parada

| Exigência | Estado |
|---|---|
| toda tool com classe e nota de verificação | **44 de 44** |
| toda RV com verificador apontado ou `[AUSENTE]` | 8 de 8 |
| todo agente conferido nas três frentes | 8 de 8 |
| toda metodologia por `validate_methodology` | 2 de 2 |
| todo padrão com relatório de cobertura | 2 de 2 |
| todo achado no backlog, tipado, com evidência | 75 registrados; `audit_system_debt` passa |
| **nenhuma linha de código alterada** | cumprido |

**A Frente 2 está FECHADA.** O que vem a seguir é decisão do pesquisador: nenhum destes achados
foi corrigido, e nenhum deve ser corrigido sem passar pelo RV-11.
