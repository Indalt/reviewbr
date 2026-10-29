# Reclassificação da fila — 18/10/2026

> §6 de `ESPECIFICACAO_vestir_metodos.md`. Os 56 achados abertos foram conferidos contra o código de
> 18/10/2026 (workflow `wf_9ed1cbe7-810`, 7 lotes, retomada com o resgate da tentativa de 17/10 que
> caiu no limite de sessão). O dado completo, item a item, está em `RECLASSIFICACAO_fila_2026-10-18.json`.
> **Proposta para o Vicente decidir — nada aqui foi executado.**

| gaveta | achados |
|---|---|
| Já resolvido — fechar com a evidência | 4 |
| Incompletude de método instalado — o conserto é DECLARAR | 19 |
| Quebra pesquisa — manutenção comum, conserta-se | 25 |
| Impede vestir método — o trabalho principal | 3 |
| Ainda não existe — fila de extensão | 5 |

## Já resolvido — fechar com a evidência

| achado | vale hoje? | custo | o que fazer |
|---|---|---|---|
| DEBT-039 | PARCIAL | P | Fechar como resolvido pelo gate de export, com a sonda como evidência. Não trocar para 'não gravar': o arquivo antigo, possivelmente digitado à mão, ficaria no lugar e passaria no export. |
| DEBT-130 **(decisão)** | NAO | P | Fechar, levando ao DEBT-137 a leitura do administrador de 08/10 sobre o 'resquício de PRISMA no modo de agir'. |
| DEBT-114 | NAO | P | Fechar. Sobram dois detalhes que cabem em outros achados: o F4.1.5 (kappa, 'se dupla') está no `covered_by` do item 8 sem a condição, que é caso do item condicional do DEBT-142; e o `depende_de: DEBT-112` ficou obsoleto pelo próprio contexto do achado. |
| DEBT-096 **(decisão)** | NAO | P | Fechar, apontando os passos 1a e 2 do maintainer. A ordem das correções nas tools de IA passa a ser do DEBT-094. |

## Incompletude de método instalado — o conserto é DECLARAR

| achado | vale hoje? | custo | o que fazer |
|---|---|---|---|
| DEBT-002 | PARCIAL | P | Na skill e nos manifests, por método: declarar RV-03, RV-06 e RV-07 como conduta sem verificador ([NÃO COBERTO]) e tirar a promessa de bloqueio do RV-07. Apontar o RV-04 para a trava que já existe. |
| DEBT-003 | SIM | M | Cada manifest declara, invariante por invariante, qual gate o ativa ou [NÃO COBERTO] com motivo (o RV-04 aponta `podeAvancar`/`record_researcher_decision`), e o `validate_methodology` passa a aceitar essa declaração. Tirar o DEBT-070 do `depende_de`: para declarar, o runtime não precisa ler o array. |
| DEBT-036 | SIM | P | Fechar como duplicado do DEBT-003: a declaração que conserta aquele faz o validador passar. Depois, um teste na suíte roda o validador em cada metodologia instalada, para a lacuna aparecer na suíte (mesmo precedente do ai_use). |
| DEBT-066 | PARCIAL | P | Declarar na skill que a completude por subitem (F2–F8) e o preenchimento do checklist no projeto são conferidos pelo agente, sem tool ([NÃO COBERTO]), e corrigir a frase de abertura (SKILL.md:8). |
| DEBT-070 **(decisão)** | PARCIAL | P | Declarar que `gates` é uma declaração conferida na instalação pelo `validate_methodology`, e não configuração do runtime; se cada entrada diz a verdade fica no DEBT-138. Tirar este achado do `depende_de` do DEBT-003. |
| DEBT-138 **(decisão)** | SIM | P | Corrigir o `blocks` nos dois manifests: o RV-02 passa a dizer 'recalcula e sobrescreve, avisando a divergência', e o RV-08 aponta `export_dataset` (bloqueia o export; a síntese não é bloqueada). Remover o `ProtocolGuard` morto. |
| DEBT-040 | PARCIAL | P | Fechar fundido no DEBT-138: a mesma correção do `tool`/`blocks` do RV-08, apontando `export_dataset`, resolve este. |
| DEBT-012 | PARCIAL | P | Fechar como duplicata do DEBT-045. É o mesmo remapeamento, e é o DEBT-045 que as declarações, os agentes e o DEBT-145 citam. |
| DEBT-045 | PARCIAL | M | Remapear seguindo o falsificador (registro→24a-c, financiamento→25, conflito→26, dados→27, certeza da evidência→15), conferindo no texto dos itens que o catálogo já tem, já no formato por método do DEBT-142. Com o remapeamento feito, as 5 declarações saem. |
| DEBT-014 | SIM | M | Distribuir pelos 21 subitens as 39 referências hoje estacionadas nos cabeçalhos (DEBT-054), conferindo no texto dos subitens que o catálogo já tem, e declarar o que sobrar. Os de metanálise e heterogeneidade (ex.: 13e, 13f, 20c, 20d) entram como item condicional do DEBT-142: o método declara a condição e o projeto responde. |
| DEBT-054 | PARCIAL | P | Fundir no DEBT-014: as 39 referências são o material para cobrir as 21 linhas órfãs, e o trabalho é um só. O código está certo em não contar cabeçalho; o erro está no dado. |
| DEBT-055 **(decisão)** | SIM | M | Mapear os 22 itens contra a trilha do próprio método de escopo (decisão 3), lendo o checklist oficial que já está em `reviewbr/download/PRISMA-ScR-Fillable-Checklist_11Sept2019.pdf` (o `prisma-scr.json` já tem os títulos oficiais). O que ficar sem cobertura vai declarado, e a avaliação crítica (item 12, 'se feita') entra como item condicional. |
| DEBT-056 **(decisão)** | SIM | P | Declarar [NÃO COBERTO] o log de busca PRISMA-S, que o agente digita e nada verifica, e reescrever o gate da F2 como simples conferência de que o arquivo existe. A declaração item a item no padrão espera o DEBT-128 (títulos) e o DEBT-142 (declaração por método). |
| DEBT-091 | SIM | P | Declarar [NÃO COBERTO] o registro de busca da coleta OAI-PMH, do snowballing e da importação, e tirar do achado as rotas de texto completo e de metadado avulso. Se a resposta no DEBT-056 for sim, essas três rotas entram no log que o código grava. |
| DEBT-058 | PARCIAL | P | Corrigir o librarian.md e fazer a saída da tool declarar a direção: só trabalhos que citam, com as referências citadas [NÃO COBERTO]. É isso que o item de busca por citação do PRISMA-S pede para relatar. |
| DEBT-026 | SIM | P | Declarar F4.1.4 e F4.2.4 como [NÃO COBERTO] no prisma-sr (por método, junto do DEBT-142) e tirar da skill screening-rules a frase 'toda exclusão recebe motivo padronizado'. Gravar o código EX na saída da triagem fica na fila, como extensão. |
| DEBT-008 **(decisão)** | SIM | P | Declarar na F7.3 do prisma-sr que a certeza da evidência é [NÃO COBERTO] por tool (julgamento do agente, decisão do pesquisador) e tirar da prisma-rigor-gates (SKILL.md:31) o gate de 'certeza (GRADE/CERQual)', que não existe. A escolha entre GRADE, CERQual ou N/A é item condicional: o método declara, o projeto responde (DEBT-142). |
| DEBT-063 | SIM | P | Declarar na F6 do prisma-sr que não há instrumento implementado nem gate: o julgamento é do agente, a decisão é do pesquisador, [NÃO COBERTO]. Corrigir a Camada 2 da prisma-rigor-gates para não prometer verificação que não existe. |
| DEBT-094 **(decisão)** | PARCIAL | M | Declarar o RAISE 3 (rascunho v4, documento vivo) nos métodos cuja trilha usa IA (o F4 do prisma-sr tem screen_candidates como produtora) como item condicional que o projeto responde, com as linhas não atendidas em [NÃO COBERTO] e as que não se aplicam em [NÃO SE APLICA]. Depende das declarações por método (DEBT-142). |

## Quebra pesquisa — manutenção comum, conserta-se

| achado | vale hoje? | custo | o que fazer |
|---|---|---|---|
| DEBT-043 | SIM | P | Escrever o teste do FlowComputer junto com o conserto do DEBT-071, que precisa dele, e um teste do caminho do handler do checkDesignGuardrail. |
| DEBT-071 | SIM | P | Fazer a checagem cruzada contar no `valid` e o `checkExportGate` bloquear quando o `included` do prisma_flow.json diferir do included.json, com teste do FlowComputer (a metade do DEBT-043). |
| DEBT-128 **(decisão)** | SIM | M | Reconferir no OSF os 16 títulos do catálogo, gravá-los no `prisma-s.json` com a validação no `version_source` e passar para `titulos_oficiais: true`. Depois, rodar o falsificador e remapear os ponteiros S1–S16 da spec, que hoje seguem a numeração do ReviewBR. |
| DEBT-085 | SIM | P | Trocar por resolveProjectDir em logToLocalProject. É a parte (1) do DEBT-139. |
| DEBT-139 | SIM | P | Parte (1): usar resolveProjectDir em index.ts:107 e :2342, com teste de caminho absoluto. As partes (2) e (3) são o DEBT-056 e seguem a resposta dada lá. |
| DEBT-087 | PARCIAL | P | Com projectPath, gravar os candidatos em 01_raw/other_records.json pelo appendRawRecords 'other', que já existe. Declarar a tool como produtora da F2 nos manifests. |
| DEBT-093 | SIM | P | Nas 6 tools, gravar em 01_raw sempre que houver projectPath, como o DEBT-086 fez nas importações. |
| DEBT-089 | SIM | P | Gravar uma vez só, no fim, com todos os registros (processados ou não) na ordem de entrada, de preferência num arquivo à parte, sem sobrescrever a entrada. |
| DEBT-021 **(decisão)** | SIM | M | O conserto anotado (chamar updateScreening com o projectId do screen_candidates) não cabe mais: a tool não tem projectId, e os registros em disco não carregam o id do banco. O caminho natural é a saturação ler a triagem do disco (03_screening e ia_audit), como o funil já faz (flow_computer.ts só lê disco). |
| DEBT-025 **(decisão)** | SIM | M | Normalizar o DOI (reusando esse regex), transliterar os acentos (NFD) e comparar título+ano também quando há DOI. Os níveis 3 e 4 prometidos na skill (screening-rules SKILL.md:9) ou se implementam, ou saem do texto da skill. |
| DEBT-030 | SIM | M | Registrar cada chamada e gravar os resultados no projeto (projectPath opcional nas três tools de PDF). Começar pelo batch_llm_extract, que é a rota de extração F5 do extractor (extractor.md:17), e pelo batch_db_screen com LLM. |
| DEBT-031 **(decisão)** | SIM | M | Ou a extração passa a marcar as páginas e o chunk carrega a página (M), ou a skill e o reader passam a pedir [study_id, seção], que a tool já entrega (P). Enquanto isso, a instrução não pode pedir um número que nada fornece. |
| DEBT-112 | SIM | M | Antes de sobrescrever, gravar a substituição: o run_id anterior e o novo, as contagens de antes e depois, e a decisão do pesquisador que a autorizou (ou 'sem decisão registrada'). Tudo reusa peças que já existem. |
| DEBT-102 | PARCIAL | P | Aplicar avaliarExtracao nas duas rotas que faltam, o que fecha a parte da guarda. O OCR (custo G: portar o controle_ocr.py e depender do tesseract) vira item próprio na fila de extensão. |
| DEBT-018 **(decisão)** | SIM | P | Remover a leitura do [LOCKED] no markdown e deixar o project_state.json como única fonte. Gravar uma vez o estado do caju_beverages, com o método declarado pelo pesquisador. |
| DEBT-042 | SIM | P | initializeWorkspace passa a recusar caminho que já tenha protocol.md ou project_state.json. Apagar o ProtocolGuard, que declara uma proteção que ninguém aplica. |
| DEBT-060 | SIM | P | Tirar o Bash dos 7 agentes que proíbem scripts e o WebSearch/WebFetch dos que proíbem busca. Estender o governance.test.ts para conferir as tools nativas contra a proibição escrita. |
| DEBT-062 | SIM | P | A tool passa a exigir o consentimento do pesquisador para aquele DOI, nas palavras dele, e grava esse consentimento no log ao lado do 'BYOS'. |
| DEBT-090 | PARCIAL | P | Fundir no DEBT-062 e acrescentar a recusa de DOI que não esteja em fulltext_not_retrieved.json. |
| DEBT-133 | SIM | P | Conferir ProjectStateService.exists antes de mexer no arquivo, ou gravar o estado primeiro e o arquivo depois. |
| DEBT-105 | PARCIAL | P | Ao consertar o DEBT-071, gravar o fixture dele (100/80/60/5/10, included.json com 999) como teste em tests/ e fechar os dois juntos. |
| DEBT-015 | PARCIAL | M | Ligar checarUsoDeIA e uma trilha igual à da triagem no batch_llm_extract, e declarar ou eliminar o corte do meio do texto; é a mesma correção do DEBT-030. A validação de desempenho fica com o DEBT-094 e o DEBT-101. |
| DEBT-077 | PARCIAL | P | Trocar a frase da linha 20 por uma que diga só o que foi medido: nenhum marcado como quebrado, os ativos não foram testados, use validate_repository. |
| DEBT-132 | PARCIAL | M | Levar os três níveis para o que o pesquisador lê (README e conduct-review), retirando a promessa do README:17. Detectar em vez de bloquear: gravar o hash do protocol.md na trava e recomputar o funil no export, comparando com o declarado. |
| DEBT-135 | SIM | P | Retirar o 'OBRIGATÓRIO' das tabelas de tipo e pôr no protocolo um campo de declaração ('registrado em X sob nº Y' ou 'não registrado'), sem que nenhuma das duas respostas reprove. Antes disso, ler o item 24 na fonte oficial e preencher os subitens. |

## Impede vestir método — o trabalho principal

| achado | vale hoje? | custo | o que fazer |
|---|---|---|---|
| DEBT-134 | PARCIAL | M | Cada método declara no manifest se a aquisição exige protocolo travado e quais seções o auditor confere, e a trava e o auditor passam a ler essa declaração. Para os dois métodos atuais o comportamento não muda. |
| DEBT-136 | PARCIAL | P | Trocar o fallback por 'o método não declara padrão' e apagar a cópia da tabela no index.ts. Fazer junto com o DEBT-135, que mexe nas mesmas linhas. |
| DEBT-137 | PARCIAL | M | Reescrever o description dos agentes por papel e dar a cada etapa do manifest a lista das skills que a executam, conferida pelo validate_methodology. Separar o conteúdo PRISMA das duas skills de nome genérico. |

## Ainda não existe — fila de extensão

| achado | vale hoje? | custo | o que fazer |
|---|---|---|---|
| DEBT-101 | PARCIAL | M | Construir a tool que compara duas corridas preservadas e reporta ao pesquisador a concordância, o kappa e os discordantes. Até ela existir, o F4.1.5 do prisma-sr (kappa, se a triagem for dupla) fica declarado como não coberto. |
| DEBT-016 **(decisão)** | SIM | M | Quando entrar: ao fechar o achado, conferir os arquivos alterados (git diff) contra os `targets` aprovados. Até lá, a descrição da tool avisa que `targets` não é conferido. |
| DEBT-106 | SIM | P | Nada agora. Quando o OCR for portado (parte b do DEBT-102), a pasta do projeto e o tessdata viram parâmetro. |
| DEBT-007 | PARCIAL | G | Assimilar os métodos JBI pela decisão 1, cada um como método próprio, completo, da fonte oficial (Manual JBI 2024, já no catálogo), com trilha e protocolo. A parte 'JBI na F6' (checklists de avaliação crítica) é a mesma lacuna do DEBT-063. |
| DEBT-110 | PARCIAL | M | Manter na fila de extensão a etapa anterior ao protocolo: busca-piloto com controle positivo e diagnóstico de PICOS/PCC antes das strings. Quando for construída, apoiar a etapa na norma do método ou declarar que ela não vem de norma (DEBT-126). |

## Perguntas ao pesquisador

- **DEBT-070** — Basta declarar que o array `gates` é conferido só na instalação, sem passar a lê-lo em runtime? *Recomendação:* Fechar por declaração junto com o DEBT-138: enquanto os gates forem os RV, que valem para todo método, o runtime ler o array não muda comportamento.
- **DEBT-138** — O export deve passar a recomputar o funil a partir dos artefatos e bloquear quando o prisma_flow.json divergir, fazendo o RV-02 travar de fato? *Recomendação:* Declarar a verdade agora, que é barato; já fazer o export recomputar o funil muda comportamento da revisão e é decisão sua.
- **DEBT-055** — Mapear já o PRISMA-ScR no formato atual, antes do DEBT-142, para os dois projetos de escopo não pararem na F8? *Recomendação:* É o primeiro deste lote, porque é o único que já atinge pesquisa em curso.
- **DEBT-128** — Posso transcrever para o `prisma-s.json` os 16 títulos que o catálogo já tem, depois de reconferir no OSF, sem esperar a sua leitura da fonte? *Recomendação:* Fazer cedo: a parte dos títulos é barata, vale para os dois métodos instalados e corrige o suplemento dos projetos de escopo.
- **DEBT-130** — Fechar o DEBT-130 e acompanhar o resíduo (agentes definidos por fase do PRISMA) só no DEBT-137? *Recomendação:* Fechar; o que ainda impede vestir método de outra forma está no DEBT-137.
- **DEBT-056** — O código deve passar a gravar o log de busca PRISMA-S, que hoje o agente digita à mão? *Recomendação:* Declarar agora; a ponte do código para o CSV só entra na fila se a resposta abaixo for sim.
- **DEBT-021** — A saturação pode passar a ler a triagem gravada em disco, como o funil já faz, em vez de gravar a decisão também no banco? *Recomendação:* Consertar já: hoje a skill manda usar uma regra de parada que sempre diz que nada foi triado.
- **DEBT-025** — No nível 4 (títulos ≥90% parecidos), o sistema deve só apontar o par para você decidir, em vez de remover sozinho? *Recomendação:* Consertar já os três casos: o número de duplicatas removidas do funil PRISMA sai daqui.
- **DEBT-031** — Quer a página de verdade na citação (guardar a página na extração), em vez de citar por seção? *Recomendação:* Guardar a página, que é o que torna a citação conferível, e trocar já o texto da skill até isso existir.
- **DEBT-016** — Pode ficar na fila de extensão, sem prazo, com a descrição avisando que `targets` não é conferido? *Recomendação:* É uma verificação que nunca foi construída, da mesma família do DEBT-072 (recusado), e entra como extensão, não como defeito.
- **DEBT-018** — Posso remover a leitura do [LOCKED] no markdown, sabendo que o caju_beverages fica sem busca nova até você declarar o método dele? *Recomendação:* Consertar junto com o DEBT-133: sem essa leitura, a gravação pela metade do DEBT-133 deixa de liberar a busca.
- **DEBT-008** — GRADE e CERQual entram na fila de assimilação pela decisão 1, mesmo sendo instrumentos dentro do método e não métodos de pesquisa? *Recomendação:* Declarar já (custo P); assimilar GRADE e CERQual depende da resposta à pergunta abaixo.
- **DEBT-094** — O prisma-sr e o método de escopo passam a declarar o RAISE 3 como norma condicional, que vale quando o projeto usar IA na triagem ou na extração? *Recomendação:* Recomendo sim, executado depois do DEBT-142: o projeto que não usa IA responde [NÃO SE APLICA], e o que usa vê o que falta.
- **DEBT-096** — Fecho o DEBT-096 e deixo a ordem com o DEBT-094 (assimilar o RAISE inteiro antes de mexer de novo nas tools de IA)? *Recomendação:* Fechar: a pergunta 'o que o sistema declara ainda basta?' já é rotina de entrada, e a diretriz de IA que se aplica já é conhecida.

## Observações dos lotes

- **invariantes-gates:** O lote se resolve em três consertos. (1) Declaração, quase só texto em manifest e skill: DEBT-002, 003, 036, 066, 070, 138 e 040. Só o DEBT-003 mexe em código (o `validate_methodology` passar a aceitar [NÃO COBERTO]). DEBT-036 e DEBT-040 fecham como duplicados. (2) DEBT-071 mais a metade do DEBT-043: é o único item do lote que quebra pesquisa, porque um funil que discorda do included.json sai como válido e passa no export. (3) Fechar o DEBT-039, que o export barra desde 26/09. A pergunta do RV-02 (o export recomputar o funil) é a mesma do DEBT-060, que está em outro lote. As sondas estão em scratchpad/probe_flow (clamp_export.mjs e errs.mjs, com proj2 e proj3), fora do repositório.
- **mapeamento-padroes:** Três pares se juntam (DEBT-012 entra no DEBT-045, DEBT-054 entra no DEBT-014, e o resíduo do DEBT-130 fica no DEBT-137), e o lote vira 4 frentes. Ordem sugerida: primeiro o DEBT-055, porque os dois projetos reais de escopo, em F4 e F5, vão parar na F8 pela regra dos órfãos, junto com os títulos do DEBT-128; depois o DEBT-045 e o DEBT-014 juntos, no formato por método do DEBT-142. Os quatro são pré-requisito do DEBT-145. As fontes para remapear já estão no repositório: o catálogo traz o texto dos 21 subitens do PRISMA 2020 (traduzido do PDF oficial) e os 16 títulos do PRISMA-S, e o PDF do PRISMA-ScR está em reviewbr/download/. Fora do lote, para registrar se o pesquisador quiser: o rodapé do checklist publicado (index.ts:2692-2696) leva a fração, mas não o `valid` nem os avisos da conferência.
- **busca-log-aquisicao:** O lote tem dois grupos. (1) Log PRISMA-S: o 085 é a parte (1) do 139 e deve ser fechado como duplicata (o conserto é uma linha em index.ts:107 e outra em :2342); o 056 corresponde às partes (2) e (3) do 139; o 091 segue a resposta do 056. A pergunta fica só no 056. (2) expand_search_snowball: o 058, o 087 e a parte do 091 que é dela se resolvem com um conserto só (gravar em other_records, registrar a busca e declarar a direção). Fora do lote, para registrar: methodology_auditor.ts:140 e :416 chamam a estratégia de busca de 'PRISMA-S Item 3', mas pela estrutura confirmada no próprio prisma-s.json a estratégia de busca fica nos itens 8 a 13. É a mesma família do DEBT-128. Nenhum arquivo do repositório foi editado; as sondas rodaram só no diretório temporário.
- **triagem-extracao:** 1) Há duas fontes de verdade: só o get_screening_report lê o banco, enquanto triagem, funil e auditoria de IA vivem no disco. O contexto do DEBT-021 cita um projectId em index.ts:587-588 que não existe mais. 2) A resolução do DEBT-102 afirma mais do que o sistema cumpre (o .txt vazio continua sendo gravado na rota BYOS); o texto da resolução precisa ser corrigido junto com a guarda. 3) O batch_processor.ts concentra o DEBT-030 e o DEBT-102, e o batch_llm_extract é a rota F5 do extractor: dá para consertar os dois de uma vez. 4) O destino METODOLOGIA_NOVA dos DEBT-025, 026 e 030 não corresponde ao que eles são (consertos). 5) Nenhum arquivo do repositório foi editado; a sonda do dedupe ficou no scratchpad.
- **governanca-seguranca:** Nenhum dos 9 depende de método (governança vale com método ou sem), por isso nada caiu em IMPEDE_VESTIR_METODO nem em INCOMPLETUDE_DE_METODO. Fusões propostas: DEBT-090 no DEBT-062, DEBT-105 no DEBT-071 e DEBT-106 no DEBT-102 (parte b); DEBT-018 e DEBT-133 se consertam juntos. O DEBT-042 tem hoje um caminho por acidente, mais concreto que o do achado: planejar de novo no caminho de um projeto existente zera o protocolo travado e as decisões, sem que ninguém precise adulterar nada.
- **metodos-externos:** Critério usado: instrumento dentro de um método instalado (RoB 2, ROBINS-I, NOS, checklists JBI, GRADE, CERQual) foi tratado como incompletude a declarar (§6); método de revisão que falta (JBI) foi tratado como assimilação (decisão 1). A resposta à pergunta do DEBT-008 vale também para os instrumentos do DEBT-063. Pontos de fora do lote, conferidos no código e sem achado explícito no backlog: (1) o catálogo dá prisma-p e raise-3 como AUSENTE, embora os dois arquivos de padrão existam e o prisma-p seja declarado pelo prisma-sr, porque as entradas não apontam standard_file; ligar isso hoje por absorb_methodology apagaria campos (DEBT-141). (2) methodology-router/SKILL.md:13 ainda diz que o prisma-sr serve o tipo exploratório, que agora recusa. (3) F6 e F7, sem artefato, nunca fecham e podem ser puladas até a F8 sem decisão registrada nelas. (4) O corte do meio do PDF no batch_llm_extract (batch_processor.ts:194-195) está anotado no DEBT-015, mas merece achado próprio. Nada foi editado no repositório; as sondas ficaram no scratchpad.
- **escopo-agentes:** 1) Inconsistência nova, fora do lote: a methodology-router/SKILL.md:13 ainda diz que o prisma-sr serve à pesquisa exploratória, o que deixou de valer em 17/10 (o manifest dele declara só systematic_review); um comentário no index.ts, perto da linha 510, repete isso. É o sistema afirmando o que não cumpre; o conserto é de uma linha. 2) DEBT-134, DEBT-136 e DEBT-137, junto com o DEBT-142, formam o bloco que a própria router declara como 'ainda da forma do prisma-sr'; convém tratá-los em sequência. 3) DEBT-135 e DEBT-136 mexem nas mesmas tabelas de tipo (index.ts:242-295 e project_init.ts:126-178): fazer os dois juntos. 4) O DEBT-132 cita o DEBT-060 para recomputar o funil no export, mas o DEBT-060 de hoje trata de Bash e Write nos agentes; recomputar o funil no export não tem outro achado responsável.
