# Ordem de correção — dependências apuradas

**Data:** 26/09/2026 · **Origem:** análise de conflito sobre os 27 pares que citam a mesma linha de código


> Corrigir na ordem errada gera retrabalho. Esta tabela existe para que o executor não
> descubra a dependência depois de já ter consertado o lado errado.


## Como isto foi apurado

1. **Script** achou os pares que citam a mesma `arquivo:linha` — 27 entre os 94 abertos.
   Sinal mais forte que "mesmo arquivo" e mais preciso que semelhança de texto, que só achou 1.
2. **Dois agentes** abriram o código de cada linha e julgaram. Resultado: **10 independentes,
   13 de ordem, 3 duplicatas, 1 exclusão mútua** — e 3 achados factualmente errados.


*10 de 27 serem independentes importa: pares no mesmo arquivo em geral **não** conflitam.*


---

## Exclusão mútua — decisão única, não duas correções


### DEBT-080 x DEBT-081

São as duas metades da mesma porta aberta. DEBT-081 é o caso projectPath ausente (o bloco inteiro do guardrail é pulado); DEBT-080 é o caso projectPath presente mas sem project_state.json e sem protocol.md (cai no fall-through e retorna null). Fechar o fall-through com 'negar por padrão' torna a correção de DEBT-081 supérflua em termos de segurança, e vice-versa muda o sentido do outro.


**Evidência:** `C:\reviewbr\reviewbr\reviewbr-mcp\src\index.ts:125-157 — o if (projectPath) da linha 128 delimita toda a verificação on-disk e a função termina em return null na linha 157; C:\reviewbr\reviewbr\reviewbr-mcp\src\index.ts:`


**Ação:** Tratar como uma única decisão de desenho: mudar checkDesignGuardrail para negar por padrão e, na mesma mudança, decidir a obrigatoriedade de projectPath. Não corrigir em PRs separados.


---

## Dependências de ordem

| Corrigir ANTES | depois | por quê |
|---|---|---|
| DEBT-023 x DEBT-061 | — | Corrigir DEBT-023 antes de DEBT-061: marcar/excluir na seleção da linha 141 os arquivos derivados (tradução) e só depois realinhar reader.md e o formato/extensões do índice. |
| DEBT-024 x DEBT-029 | — | Corrigir DEBT-029 primeiro (gravar 02_deduplicated/dedupe_pairs.json com mantido/removido/critério) e só então DEBT-024, fazendo o verificador auditar esse log em vez de re-rodar o |
| DEBT-033 x DEBT-083 | — | Corrigir DEBT-033 primeiro (fail-closed quando há projectPath e nenhum artefato válido) e depois DEBT-083, que vira apenas distinguir 'corrompido' de 'ausente' na mensagem. Vale ca |
| DEBT-041 x DEBT-076 | — | Decidir DEBT-041 primeiro (reativar o guardião em runtime ou declará-lo formalmente declarativo). DEBT-076 é consequência: se reativar, guardedHandler é o lugar natural do enforcem |
| DEBT-027 x DEBT-098 | — | Respeitar a ordem já registrada no bloco DEBT-027/098/099/101: DEBT-027 antes de DEBT-098. Nenhuma fusão. |
| DEBT-027 x DEBT-099 | — | Manter a ordem do bloco já registrado: DEBT-099 (pinning) antes da parte de log de DEBT-027. Nenhuma fusão. |
| DEBT-046 x DEBT-065 | — | Corrigir DEBT-046 primeiro (definir em que gate/skill check_standard_coverage é invocado) e só então DEBT-065 (sincronizar os corpos dos agentes divergentes: analyst, designer, ext |
| DEBT-048 x DEBT-049 | — | Corrigir DEBT-049 antes de DEBT-048: primeiro fazer o runtime da revisão consumir o array gates, depois preencher os gates de RV-03, RV-04, RV-06 e RV-07. |
| DEBT-050 x DEBT-051 | — | Corrigir DEBT-051 primeiro (gerador emitir cabeçalho mesmo com section vazia) e depois DEBT-050 (criar .claude/standards/prisma-scr.json ou parar de anunciar os 22 itens). |
| DEBT-069 x DEBT-097 | — | Corrigir DEBT-069 primeiro (detecção de [TBD] e lista de campos obrigatórios no auditor) e depois reavaliar o que sobra de DEBT-097. Não fundir. |
| DEBT-081 x DEBT-093 | — | Corrigir DEBT-081 (projectPath obrigatório nas tools que persistem) antes de DEBT-093 (desaninhar appendRawRecords do if (projectId)). |
| DEBT-084 x DEBT-086 | — | Corrigir DEBT-084 primeiro, unificando as 6 gravações em appendRawRecords; depois DEBT-086 vira uma chamada de uma linha em cada importador. |
| DEBT-086 x DEBT-088 | — | Corrigir DEBT-088 primeiro (expor e propagar a origem real no import_dataset_ris) e só depois DEBT-086 (gravar os importados em 01_raw). |

### Detalhe de cada dependência


**DEBT-023 x DEBT-061** — Os dois recaem sobre o mesmo filtro de arquivos do indexCorpus. DEBT-061 quer alargar/realinhar o que entra no índice (reader.md manda indexar 03_screening/pdfs, que a linha 141 descarta, e cita rag/index.sqlite que não existe — o código grava rag/index.json). DEBT-023 mostra que o diretório do corpus também contém as traduções geradas por LLM, gravadas como '<base>_tradução_*.md' ao lado do PDF, 

> Corrigir DEBT-023 antes de DEBT-061: marcar/excluir na seleção da linha 141 os arquivos derivados (tradução) e só depois realinhar reader.md e o formato/extensões do índice.


**DEBT-024 x DEBT-029** — DEBT-029 é a ausência do registro (mantido, removido, critério): writeDeduped grava só os únicos e as estatísticas, e result.duplicates é descartado. DEBT-024 é a tautologia: o 'verificador' de duplicatas residuais roda o MESMO DeduplicationService.deduplicate, então depois do deduplicate_dataset ele sempre encontra zero e dá PASS. O insumo natural de um verificador independente é justamente o log

> Corrigir DEBT-029 primeiro (gravar 02_deduplicated/dedupe_pairs.json com mantido/removido/critério) e só então DEBT-024, fazendo o verificador auditar esse log em vez de re-rodar o mesmo algoritmo.


**DEBT-033 x DEBT-083** — São dois caminhos de entrada para o MESMO fall-through. DEBT-033: sem project_state.json e sem protocol.md, checkDesignGuardrail desce até o 'return null' final e libera. DEBT-083: project_state.json corrompido faz ProjectStateService.read cair no catch e devolver null, entrando exatamente no mesmo fall-through. Uma correção fail-closed no guardrail resolve os dois; corrigir só a mensagem de corru

> Corrigir DEBT-033 primeiro (fail-closed quando há projectPath e nenhum artefato válido) e depois DEBT-083, que vira apenas distinguir 'corrompido' de 'ausente' na mensagem. Vale casar com DEBT-080, que é a mesma família.


**DEBT-041 x DEBT-076** — São dois resíduos do mesmo desmonte do RBAC de runtime. DEBT-041: validateToolAccess e validateAction só existem como definição, zero call sites. DEBT-076: guardedHandler foi transformado em pass-through (return handler) e sobrevive num único uso. O comentário do próprio index.ts:85-94 declara o RBAC 'APOSENTADO' e explica que por isso guardedHandler virou pass-through: o destino do wrapper depend

> Decidir DEBT-041 primeiro (reativar o guardião em runtime ou declará-lo formalmente declarativo). DEBT-076 é consequência: se reativar, guardedHandler é o lugar natural do enforcement; se não, remove-se o wrapper e o call site da linha 407.


**DEBT-027 x DEBT-098** — São defeitos distintos sobre as duas rotas de LLM. DEBT-027 descreve a rota de triagem (ScreeningService, sem generationConfig, temperatura não fixada); DEBT-098 é a comparação entre as duas rotas e mostra que a menos reprodutível é justamente a que decide inclusão. Consertar DEBT-027 fecha metade de DEBT-098.

> Respeitar a ordem já registrada no bloco DEBT-027/098/099/101: DEBT-027 antes de DEBT-098. Nenhuma fusão.


**DEBT-027 x DEBT-099** — DEBT-099 (alias de modelo sem versão fixada e sem registro de qual modelo rodou) é o componente de identidade do modelo; DEBT-027 é a irreprodutibilidade da triagem como um todo. A correção de DEBT-027 precisa decidir como o modelo é registrado, o que só faz sentido depois do pinning de DEBT-099 — senão o log registra um alias que não identifica nada.

> Manter a ordem do bloco já registrado: DEBT-099 (pinning) antes da parte de log de DEBT-027. Nenhuma fusão.


**DEBT-046 x DEBT-065** — Tocam a linha de tools do analyst por motivos diferentes, mas se sobrepõem num ponto concreto: check_standard_coverage é concedido no frontmatter e ausente do 'contrato de papel' do corpo. DEBT-046 é a causa (nenhum procedimento chama a verificação) e DEBT-065 é o sintoma na documentação do agente. Corrigir DEBT-065 antes obrigaria a reescrever o mesmo corpo de novo.

> Corrigir DEBT-046 primeiro (definir em que gate/skill check_standard_coverage é invocado) e só então DEBT-065 (sincronizar os corpos dos agentes divergentes: analyst, designer, extractor e librarian).


**DEBT-048 x DEBT-049** — DEBT-048 diz que faltam gates para 4 invariantes; DEBT-049 diz que o array gates não é consumido pelo fluxo da revisão. Acrescentar 4 entradas em gates sem antes existir quem as leia não muda comportamento algum — é retrabalho garantido.

> Corrigir DEBT-049 antes de DEBT-048: primeiro fazer o runtime da revisão consumir o array gates, depois preencher os gates de RV-03, RV-04, RV-06 e RV-07.


**DEBT-050 x DEBT-051** — A colisão em 'manifest.json:38' é falso positivo do agrupador: a linha 38 de prisma-sr é 'prisma_s_checklist_filled.md' e a de scoping-prisma-scr é 'prisma_scr_checklist_filled.md' — arquivos diferentes. Ainda assim há dependência real: o gerador só emite cabeçalho e separador quando o item tem 'section' preenchida. Criar o padrão PRISMA-ScR antes de consertar o gerador produziria mais um checklis

> Corrigir DEBT-051 primeiro (gerador emitir cabeçalho mesmo com section vazia) e depois DEBT-050 (criar .claude/standards/prisma-scr.json ou parar de anunciar os 22 itens).


**DEBT-069 x DEBT-097** — O auditor faz exatamente três checagens (inclusão, exclusão, sintaxe) e nenhuma olha [TBD]. DEBT-069 é a fragilidade dessas três; DEBT-097 é a ausência total de checagem sobre pergunta, justificativa e lacuna. Um detector de [TBD] sobre campos obrigatórios — correção natural de DEBT-069 — já pega justificativa e lacuna, que no template nascem como [TBD].

> Corrigir DEBT-069 primeiro (detecção de [TBD] e lista de campos obrigatórios no auditor) e depois reavaliar o que sobra de DEBT-097. Não fundir.


**DEBT-081 x DEBT-093** — Há acoplamento real pela mesma variável. DEBT-093 se resolve tirando appendRawRecords de dentro do if (projectId) e passando a depender só de projectPath; mas se projectPath continuar opcional (DEBT-081), a gravação segue condicional a um parâmetro que o chamador pode omitir.

> Corrigir DEBT-081 (projectPath obrigatório nas tools que persistem) antes de DEBT-093 (desaninhar appendRawRecords do if (projectId)).


**DEBT-084 x DEBT-086** — Confirmei DEBT-084 no código: são exatamente 6 tools de busca gravando em 01_raw com path.join(process.cwd(), params.projectPath, "01_raw") sem tratar caminho absoluto, em paralelo à via correta (appendRawRecords, que usa resolveDir com isAbsolute). DEBT-086 é a ausência total dessa gravação nos dois importadores. A correção certa dos dois é a mesma: unificar em appendRawRecords.

> Corrigir DEBT-084 primeiro, unificando as 6 gravações em appendRawRecords; depois DEBT-086 vira uma chamada de uma linha em cada importador.


**DEBT-086 x DEBT-088** — Confirmei que importRis aceita sourceName com default 'Manual Import' e que o handler nunca passa esse argumento nem o expõe no schema — a origem real some. Se DEBT-086 for corrigido antes, a origem falsa entra no corpus canônico e o gate RV-08 do export passa a bloquear a revisão inteira.

> Corrigir DEBT-088 primeiro (expor e propagar a origem real no import_dataset_ris) e só depois DEBT-086 (gravar os importados em 01_raw).


---

## Duplicatas fundidas

| par | resolução |
|---|---|
| DEBT-079 → DEBT-034 | guardrail chamado com `(undefined, undefined)` em `index.ts:1180` |
| DEBT-048 → DEBT-003 | 8 invariantes `always_on`, 4 gates, nos dois manifests |
| DEBT-067 → DEBT-044 | `audit()` tem 6 checagens e reporta `/5`; o cenário de 067 vira caso de teste |

Nos três, os achados vieram de **varreduras independentes** que convergiram sem se conhecer —
sinal de que o achado é sólido, não de que alguém se repetiu.


## Achados factualmente errados

| id | o que estava errado | estado |
|---|---|---|
| DEBT-040 | *"o export não valida nada"* — ficou **falso** depois da correção de 25/09 | metade corrigida; a outra metade (`audit_methodology` não olha origem) segue válida |
| DEBT-015 | dizia *"das 40 tools"* — são **44** | núcleo intacto; erro meu, por herdar denominador |
| DEBT-049 | *"o array `gates` não é lido por runtime"* — contestado | **REABERTO** — duas leituras do código se contradizem; exige terceiro controle antes de agir |

> O DEBT-049 não deve ser corrigido enquanto a contradição não for resolvida. O precedente
> do DEBT-017 mostra que o achado pode estar errado — mas o revisor também pode.
