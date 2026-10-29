# Protocolo — revisão do ReviewBR

**Estado:** `[LOCKED]` — travado em 24/09/2026
**Objeto da revisão:** o próprio ReviewBR (sistema), não uma literatura
**Motivo de existir:** o §3 do briefing — "revisar o ReviewBR" tem o mesmo perfil de risco
que fez a investigação da cajuína derivar. Sem critério de parada, vira reescrita sem fim.

> Este protocolo aplica ao trabalho sobre o sistema a mesma disciplina que o sistema aplica
> a uma revisão de literatura: escopo declarado antes de começar, critério de parada por
> frente, e o que está explicitamente fora. Alterá-lo exige registro no §7.

---

## 1. Estado de partida — verificado, não herdado

Conferido contra o código em 24/09/2026, por dois caminhos independentes (extração dos
registros em `src/index.ts` e a lista de tools carregada pelo runtime MCP).

| Item | Briefing §1 | Verificado | Fonte |
|---|---|---|---|
| Ferramentas MCP | 14 | **36** | `src/index.ts`, 36 chamadas `server.tool(` |
| Repositórios catalogados | 93 | 93 | `data/sources/repositories_catalog.json` |
| Agentes | 7 | 7 | `.claude/agents/` |
| Skills | 8 | 8 | `.claude/skills/` |
| Serviços | ~30 | 31 | `src/services/` |
| Invariantes | RV-01..RV-08 | RV-01..RV-08 | `prisma-rigor-gates/SKILL.md` |
| RV-09/10/11 | propostas | **só em papel**, zero código | 22 ocorrências, todas nos 2 docs do briefing |
| Metodologias | 2 | 2 (`prisma-sr`, `scoping-prisma-scr`) | `.claude/methodologies/` |

### 1.1 Correção com consequência: 36 tools, não 14

A Frente 2 se define no briefing como *"as 14 tools são determinísticas?"*. São **36**.
Auditar 14 e declarar o sistema auditado deixaria **22 fora do escopo sem que ninguém
percebesse** — a mesma classe do falso negativo nº 8: relatório fechado sobre leitura que
não houve. O §3 deste protocolo corrige o denominador.

### 1.2 Achado da conferência: metade das RV não tem verificação

A skill `prisma-rigor-gates` abre afirmando que *"rigor não é autocertificação do agente:
cada gate é uma verificação determinística"*. Conferido item a item:

| RV | Verificação declarada na skill | O que existe de fato | Determinística? |
|---|---|---|---|
| RV-01 | `submit_protocol_for_approval` | tool registrada | **sim** |
| RV-02 | `compute_flow_counts` | tool + `flow_computer.ts` | **sim** |
| RV-03 | "inspeção de artefatos" | nenhuma tool; conduta em prosa | **não** |
| RV-04 | "`project_state.json` + logs" | convenção de escrita; nenhum verificador | **não** |
| RV-05 | `validate_prisma_flow` | tool + `prisma_validator.ts` | **sim** |
| RV-06 | "conduta: agente decide, tool executa" | guardião em `agent_orchestrator.ts`, mas só checa **dono de papel**, não determinismo | **parcial** |
| RV-07 | "conferência F1.2→F1.4" | conferência manual; nenhuma tool | **não** |
| RV-08 | `audit_methodology` + `export_dataset` | tool registrada | **sim** |

**Quatro das oito RV são autocertificação** — exatamente o que a skill declara não ser.
Este achado é matéria da Frente 2; foi registrado aqui porque emergiu da conferência do §1
e é o argumento que sustenta a ordem adotada no §2.3.

---

## 2. Escopo

### 2.1 Objeto

O ReviewBR tal como está no branch `reorg/agentic-layer`: **todas** as tools, agentes, skills,
metodologias, serviços e invariantes. O denominador se apura no momento da auditoria, contra o
código — não se congela aqui (ver a nota do §3 e a regra zero da skill `system-audit`).

### 2.2 Pergunta de cada frente

| Frente | Pergunta |
|---|---|
| **1 — Lacunas provadas** | as três lacunas do §2 do briefing têm trava que as pegue, chamada no momento certo? |
| **2 — Auditoria** | o sistema faz o que declara fazer? |
| **3 — Estado da arte** | o sistema ainda corresponde ao estado da metodologia e das ferramentas? |

### 2.3 Ordem de execução — alterada em relação ao briefing

O briefing põe RV-09, RV-10 e RV-11 juntas na Frente 1. **Decisão do pesquisador
(24/09/2026): RV-11 e o manifesto de conformidade vêm primeiro.**

**Razão:** RV-11 é a trava que governa *como* uma alteração entra no sistema. Implementar
RV-09 e RV-10 antes dela significa que as duas primeiras mudanças do sistema entram
exatamente pelo processo informal que o §2.4 do briefing identifica como a terceira lacuna.
O manifesto vem junto porque é o insumo sem o qual RV-11 não tem contra o que verificar.

Sequência travada:

```
0. protocolo travado           ← este documento
1. manifesto de conformidade   ← estado atual: cada trava × padrão × versão
2. RV-11 + agente construtor   ← o gate que governa as mudanças seguintes
3. RV-09                       ← prova de leitura (resultado negativo)
4. RV-10                       ← sentido dos termos (aceito / recusado)
5. Frente 2 — auditoria        ← diagnóstico das 36 tools e dos 7 agentes
6. Frente 3 — estado da arte   ← comparação externa
```

Cada etapa só abre com a anterior fechada pelo seu critério do §3.

---

## 3. Critérios de parada, por etapa

Um critério de parada é uma condição **verificável**, não uma impressão de suficiência.
Atingido o critério, a etapa fecha — mesmo que ainda haja melhorias imagináveis.

| # | Etapa | Fecha quando |
|---|---|---|
| 0 | Protocolo | este arquivo existe com `[LOCKED]` e o §1 conferido contra o código |
| 1 | Manifesto | cada uma das 8 RV, 8 skills e 2 metodologias tem linha declarando padrão, versão e verificador; toda lacuna marcada `[SEM VERIFICADOR]` em vez de omitida |
| 2 | RV-11 | o gate existe, classifica correção/conformidade/extensão, reprova alteração sem o requisito do tipo, e **reprova a si mesma se submetida sem tipo declarado** |
| 2b | Catálogo de metodologias | cada método conhecido tem linha com o que é, quando usar, que padrão o governa, o que exige e o status no sistema (implementado / declarado / ausente); toda afirmação traz fonte, e o não confirmado fica `[A VERIFICAR]` |
| 3 | RV-09 | a trava deriva do princípio (*um negativo exige prova de leitura*) e, aplicada aos 8 falsos negativos conhecidos, teria pego os 8 |
| 4 | RV-10 | o protocolo admite termo **aceito** e termo **recusado com registro obrigatório**; um gate reprova busca com termo fora da lista aprovada |
| 5 | Frente 2 | **todas** as tools classificadas (executa / decide), as RV com verificador apontado ou `[AUSENTE]`, **todos** os agentes conferidos contra seus limites — em **diagnóstico escrito**, sem uma linha de reescrita |
| 6 | Frente 3 | as 4 ferramentas comparadas contra critério declarado antes da comparação; veredicto por item: obsoleto / diferencial / indiferente |

> **Denominadores não se congelam no protocolo.** A versão anterior desta tabela dizia "as 36
> tools" e "os 7 agentes" — números corretos em 24/09/2026 de manhã e desatualizados à tarde
> (39 tools, 8 agentes). Um critério de parada que embute uma contagem envelhece e passa a
> autorizar auditoria incompleta. O denominador é apurado no momento da auditoria, contra o
> código — regra §5.1.

### 3.1 Onde o trabalho está — fase de preparação vs. execução

Registrado em 24/09/2026, a partir da leitura do pesquisador de que *"até o presente momento
eu estava preparando o ambiente para o trabalho"*. A leitura é correta e vale como marco:

| Fase | Etapas | Estado |
|---|---|---|
| **Preparação do ambiente** | 0 (protocolo), 1 (manifesto), 2 (RV-11, agente, backlog, padrões) | **concluída** |
| **Execução da revisão** | 3 (RV-09), 4 (RV-10), 5 (Frente 2), 6 (Frente 3) | **não iniciada** |

**A auditoria nunca rodou.** Os achados DEBT-001..013 no backlog **não são resultado de
varredura**: apareceram de passagem, enquanto se construía outra coisa. São subproduto da
preparação, não diagnóstico da Frente 2. Tratá-los como se fossem a auditoria seria declarar
feita uma etapa que não começou — a mesma classe de erro do falso negativo nº 8.

**O procedimento de auditoria existe** desde 25/09/2026: `.claude/skills/system-audit/SKILL.md`
— apuração do denominador, quatro varreduras (tools, invariantes, agentes, padrões), registro
tipado e critério de parada. O `maintainer.md` manda carregá-la antes de auditar.

**Duas etapas estão bloqueadas por dependência externa, não por ordem:**

| Etapa | Bloqueio |
|---|---|
| RV-09 | o critério exige provar contra os 8 falsos negativos conhecidos; eles existem só em prosa no briefing — não há fixture nem caso de teste |
| DEBT-004 (campo de versão) | DEBT-012 e DEBT-013 mostram que o sistema não sabe a numeração nem a granularidade do padrão que já usa; preencher versão agora registraria como dado algo não verificado |

Ambas esbarravam no §4 (rastreio externo fora de escopo). **O §4 foi revogado em 24/09/2026**
(ver §7): o rastreio das fontes oficiais entrou no escopo. Nenhuma fecha sem a fonte oficial do
PRISMA em mãos.

### 3.2 Regra de parada por deriva — e a saída da fila

Se qualquer etapa produzir achado fora do escopo do §2, ele é **registrado e não executado**.
Corrigi-lo na hora é a deriva que este protocolo existe para impedir.

**Registrar onde, e com que saída** (acrescentado em 24/09/2026): o achado entra no backlog
estruturado `.claude/maintenance/system_debt.json`, com id estável, tipo já classificado,
evidência e reprodução — não apenas em prosa no §7. A entrada no §7 permanece como registro
narrativo do trabalho; o backlog é o que uma sessão nova consulta.

A fila tem saída obrigatória: a tool `audit_system_debt` reprova se um achado sair do estado
aberto sem `resolution` preenchida, se um achado de tipo CORRECAO não tiver reprodução, ou se
houver id duplicado. **Fila com item aberto não reprova** — o gate cobra decisão registrada na
saída, não fila vazia. Recusar corrigir é legítimo; recusar em silêncio, não.

Sem isso, "registrado, não executado" seria a mesma classe de falha que o sistema já registra
de si: `validate_prisma_flow` existia e ninguém chamava.

---

## 4. Fora de escopo — explícito

| Fora | Por quê |
|---|---|
| ~~Rastreio ativo de padrões~~ | **REVOGADO em 24/09/2026** — ver §7. O rastreio das fontes oficiais passou a estar DENTRO do escopo, por decisão do pesquisador, para construir o catálogo de metodologias. Critério de parada próprio no §3, etapa 2b |
| Implementar o módulo `fontes-primarias` | é Extensão (§2.4 do briefing); exige protocolo próprio. Aqui entram só RV-09 e RV-10, que são Correção |
| Implementar JBI, GRADE, CERQual, MECIR | metodologia nova é Extensão |
| Reescrever o que funciona sem falha documentada | §5 do briefing |
| Portar linguagem por homogeneidade | §5 do briefing |
| "Melhorar o sistema em geral" | §5 do briefing |
| Adotar o **Jev** / TypeSafe AI | já investigado e recusado (briefing §4, nota da Frente 3): sem paper, sem pesos, sem auto-hospedagem — contradiz verificação auditável |
| Tocar em `F:` | o repositório de trabalho é `C:` |
| Alterar o ReviewBR a partir de um projeto de pesquisa | ferramenta quebrada se conserta na ferramenta, nunca se contorna dentro do projeto |

---

## 5. Regras de conduta deste trabalho

1. **Número herdado é hipótese.** Toda contagem vinda de documento é conferida contra o
   código antes de virar premissa. O §1 é o primeiro exercício disso — e achou um erro.
2. **Zero exige controle positivo.** "Não encontrei X no sistema" só vale com um controle
   que certamente existe encontrado pelo mesmo método. Vale para esta revisão, não só para
   a RV-09 que ela vai escrever.
3. **Os 8 falsos negativos são dado, não cânone.** A trava deriva do princípio; os oito
   servem para conferir que o princípio os teria pego. Desenhar para passar nos oito produz
   trava cega para o resto.
4. **Diagnóstico não é correção.** A Frente 2 produz texto. Toda correção que ela sugerir
   passa por RV-11 e entra como alteração tipada.
5. **A leitura é do pesquisador.** O agente aponta, corrige e sugere; não decide por ele nem
   fecha achado que ele ainda não leu.

---

## 6. Tipagem das alterações (antecipa RV-11)

Toda alteração feita neste trabalho declara seu tipo e satisfaz o requisito dele:

| Tipo | Requisito | Alterações previstas |
|---|---|---|
| **Correção** | falha documentada e reproduzível | RV-09, RV-10 |
| **Conformidade** | citação do padrão novo e do item afetado | nenhuma prevista |
| **Extensão** | protocolo próprio, como qualquer revisão | RV-11 + agente construtor |

RV-11 é Extensão: método novo, sem falha documentada que a motive — o argumento que a
sustenta é estrutural (§2.4 do briefing), não um caso de falha. Por isso ela precisa de
protocolo próprio, e este documento é esse protocolo.

---

## 7. Registro de alterações do protocolo e de achados fora de escopo

Toda mudança neste protocolo e todo achado que o §3.2 manda registrar sem executar entram
aqui, com data e motivo.

| Data | Tipo | Registro |
|---|---|---|
| 24/09/2026 | alteração de escopo | ordem invertida: RV-11 + manifesto antes de RV-09/RV-10 (decisão do pesquisador; razão no §2.3) |
| 24/09/2026 | correção de premissa | briefing §1 declara 14 tools MCP; são 36. Denominador da Frente 2 corrigido |
| 24/09/2026 | achado fora de escopo | RV-03, RV-04 e RV-07 não têm verificador; RV-06 tem verificação parcial. Matéria da Frente 2 — **registrado, não corrigido** |
| 24/09/2026 | achado fora de escopo | **Nenhum campo de versão de padrão existe no sistema.** Busca por `version`/`standard`/`conformance`/`checklist_version`/`spec_version` nos `.json` do `.claude/`: zero resultados. Registrado no manifesto §5 — **não corrigido** (implementar o campo depende de RV-11, e é alteração tipada própria) |
| 24/09/2026 | achado fora de escopo | **Os manifests declaram 8 invariantes `always_on` e listam 4 gates.** RV-03, RV-04, RV-06 e RV-07 constam como sempre ativas sem nada que as ative. Matéria da Frente 2 — **registrado, não corrigido** |
| 24/09/2026 | **achado fora de escopo — defeito preexistente** | **O modo CLI `--tool` está morto para as 37 tools.** `src/index.ts` declara `toolHandlers` na linha 48 e o lê na 2365, mas **nunca o popula**; toda invocação cai em `Tool "X" not found`. Reproduzido com `validate_prisma_flow` (tool do RV-05, anterior a este trabalho), o que descarta relação com as alterações desta sessão. É **Correção** e tem falha documentada e reproduzível — mas está fora do escopo do §2. **Registrado, não corrigido** |
| 24/09/2026 | alteração executada | **RV-11 implementada** como EXTENSAO sob este protocolo travado: `change_validator.ts`, tool `validate_system_change`, papel `MAINTAINER`, agente `maintainer.md`, 16 testes. Submetida ao próprio gate e aprovada; submetida sem tipo, reprovada |
| 24/09/2026 | **alteração de escopo** | **Backlog de dívida acrescentado ao escopo** (decisão do pesquisador). Razão: registrar achado em prosa, numa tabela de documento, não é fila — é esquecimento organizado. O §3.2 (então §3.1) mandava "registrar sem executar" sem dizer quando, quem, nem o que acontece se ninguém executar. Requisito adicional declarado pelo pesquisador: **este chat é descartável; o sistema não é** — uma sessão nova deve retomar a manutenção sem depender de nenhuma conversa anterior |
| 24/09/2026 | **alteração de escopo — revogação do §4** | **O rastreio ativo de padrões entra no escopo.** Decisão do pesquisador, tomada depois de o custo ser sinalizado (é pesquisa, o que este chat vinha evitando). Razão: o agente de manutenção não pode ter como conhecimento metodológico aquilo que o modelo afirma saber — isso é a autocertificação que o próprio sistema recusa. O conhecimento precisa ser dado consultável, e dado consultável exige fonte. Destrava também DEBT-004, DEBT-012 e DEBT-013, que estavam bloqueados por falta da fonte oficial |
| 24/09/2026 | **lacuna encontrada** | `scoping-prisma-scr` está implementada e exige `prisma_scr_checklist_filled.md` como suplemento obrigatório, mas **não existe `prisma-scr.json`** em `.claude/standards/`. O gerador de checklist não consegue atender uma metodologia que o sistema já tem |
| 25/09/2026 | **FRENTE 2 CONCLUÍDA** | Auditoria sistemática rodada pela skill `system-audit`, em seis lotes. Denominador apurado na corrida: 44 tools, 8 agentes, 9 skills, 2 metodologias, 2 padrões, 8 RV — **cobertura integral**. Resultado: **75 achados, 22 bloqueando**. Diagnóstico em `.claude/maintenance/DIAGNOSTICO_frente_2.md`; backlog com 93 achados. **Nenhuma linha de código alterada** |
| 25/09/2026 | **correção de achado próprio** | O DEBT-017, levantado por conversa, afirmava que 5 de 16 tools de aquisição chamavam o guardrail do RV-01. A varredura A1 foi instruída a confirmar ou contradizer de forma independente e **contradisse**: as 9 `search_*` chamam corretamente, `harvest_records` chama com `(undefined, undefined)` e as 7 de aquisição/importação não chamam. O método anterior fatiava `index.ts` por `server.tool(` e atribuía handlers nomeados à tool errada |
| 25/09/2026 | alteração executada | **Etapa 2b concluída** — catálogo de 57 metodologias em `.claude/catalog/`, todas com fonte oficial, a partir de 9 frentes de pesquisa. Padrões `prisma-2020.json` (48 nós, 42 linhas de checklist, estrutura CONFIRMADA) e `prisma-s.json` em `.claude/standards/`. Tools `check_standard_coverage` e `query_methodology_catalog` |
| 25/09/2026 | alteração executada | **Procedimento de auditoria criado** — skill `system-audit`, com a regra zero (apure o denominador) e a regra um (zero exige controle positivo), ambas derivadas de falhas reais desta revisão |
| 25/09/2026 | alteração executada | **Lado de ESCRITA do mantenedor** (EXTENSAO). Até então as tools do papel eram todas de leitura e `SystemDebtService.write` era código morto — o padrão `validate_prisma_flow`. Criadas `record_system_finding`, `absorb_methodology`, `scaffold_methodology` e `validate_methodology`, todas validando ANTES de gravar |
| 25/09/2026 | **revisão adversarial** | Quatro lentes independentes revisaram o agente: **4/4 devolveram NÃO PRONTO**. Achados que bloqueavam: (a) `dist` de 13/07 sem nenhuma tool do mantenedor — o passo 1 do agente falhava em cliente real; (b) as 4 tools de escrita entraram no frontmatter e **nenhuma instrução as chamava**; (c) este protocolo e o RETOMAR declaravam inexistente a skill recém-criada; (d) `maintainer.md` afirmava "Funciona hoje" em negrito sobre uma rota quebrada. Todos corrigidos; ver DEBT-006 e DEBT-016 |
| 24/09/2026 | **marco de fase** | Leitura do pesquisador registrada: *"até o presente momento eu estava preparando o ambiente para o trabalho"*. Correta. Etapas 0-2 = preparação, concluída; etapas 3-6 = execução, **não iniciada**. A auditoria (Frente 2) nunca rodou; os 13 achados do backlog são subproduto da preparação, não diagnóstico |
| 24/09/2026 | correção de premissa | **"27 itens PRISMA" era afirmação não verificada.** O padrão usa subitens por letra (16a, 16b, 24a...) — o próprio sistema os cita no manifesto e no agente, mas a spec nunca os usa e o `prisma-2020.json` não os representa. O arquivo recebeu `structure_warning` e `items_are_top_level_only`; o checklist gerado passou a carregar o aviso; teste trava a declaração. Ver DEBT-013 |
| 24/09/2026 | correção de premissa | Os critérios de parada da Frente 2 embutiam "36 tools" e "7 agentes" — desatualizados no mesmo dia (39 e 8). Denominador agora se apura na hora da auditoria, não no protocolo |
| 24/09/2026 | alteração executada | **Backlog + gate de dívida implementados** como EXTENSAO: `system_debt.ts`, `system_debt.json` (5 achados migrados de prosa para estrutura), tool `audit_system_debt`, 11 testes. O `maintainer.md` ganhou o procedimento de entrada em sessão nova. Total: 38 tools, 41 testes |
| 29/10/2026 | correção de premissa | **§3.1 corrigido (DEC-17 do `DECISOES_chat_a_conferir.md`).** A frase "o rastreio externo está fora de escopo" sobreviveu à revogação do §4 de 24/09; agora diz que o §4 foi revogado. A lente 5 de 26/09 já apontava. Gate RV-11 aprovado (CORRECAO) |
| 29/10/2026 | decisão do pesquisador transcrita | **O estado da manutenção mora em `.claude/maintenance/`, não em `reviewbr/docs/` (DEC-08).** Escolha do Vicente em 25/09 (27fac9ba L495, Ask: "`.claude/maintenance/` na raiz"). A razão dada na hora: `docs/` é o site publicado do prismAId e, sincronizado com o upstream, os arquivos iriam junto ou sumiriam. O `origem/BRIEFING_revisao_reviewbr.md` ainda manda ir a `reviewbr/docs/` — é histórico, não siga |
| 29/10/2026 | decisão do pesquisador transcrita | **Regra de `old/` (DEC-13):** *"o que está em old fica em old se não é projeto de pesquisa"* (Vicente, 25/09, 27fac9ba L650). Foi assim que o curso, que era pesquisa, virou projeto em `reviewbr/projects/` (DEC-11) |
| 29/10/2026 | decisão do pesquisador | **Ferramenta quebrada no meio de uma pesquisa (DEC-M1): vale a última linha do §4.** Perguntado em 29/10, o Vicente escolheu: a pesquisa para naquele passo, o defeito vai à fila pelo `record_system_finding` e é consertado numa sessão de manutenção — não se contorna dentro do projeto. A memória que dizia o contrário foi corrigida. Coerente com *"scripts só são usados em último caso"* (25/09, bbfd7ac8 L4193) |
