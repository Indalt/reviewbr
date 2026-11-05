# Triagem do backlog: defeito × ausência — 05/11/2026

> **Estado (05/11, à tarde): as cinco decisões abaixo foram aprovadas pelo Vicente ("aplicar as decisões") e
> aplicadas.** No backlog: o DEBT-151 (decisão 2), o fechamento do DEBT-149 (decisão 3) e as 15 saídas,
> confirmadas pelo Vicente ("saídas confirmadas") e gravadas como RECUSADO, com o destino de cada uma na resolution
> — o aberto passou de 58 para 43. O resto da proposta (ficar, enxugar, fundir) não foi contestado: cada sessão o
> confere para os achados que toca (item 9 do "Como trabalhar" do plano). Os 4 classificadores do workflow
> `wf_69aa6db2-8ea` terminaram; os
> contestadores e o crítico não rodaram, porque o limite de 5h estourou (fan-out lançado sem custo combinado,
> contra a regra 6 do "Como trabalhar"). Saída bruta: `classificadores.json`.

## Por que

Pedido do Vicente, 05/11/2026. Origem, nas palavras dele: *"você colocou uma tarefa com detalhamentos como se
fosse uma metodologia desconhecida ou heterodoxa. como se não já soubéssemos quais as metodologias de escopo
[...] esse comentário não deveria gerar um debt 'empurrando com a barriga' problemas que não existem. me entregue
solução para este e para outros problemas como esse sem ter de revisar todo o código para cada problema [...]
o sistema já iria adicionar a(s) metodologia(s). Se eu estiver errado me corrija"*.

**O caso.** O DEBT-151 tinha um defeito pequeno: a trilha do escopo mostra rótulos do PICOS nos campos que o
template usa para o PCC. Em 05/11 o acompanhamento acrescentou a ele a decisão D14 como "consequência". Com isso,
abriu a sessão 2d, de duas janelas, para assimilar uma metodologia de escopo e migrar os dois projetos. Três
coisas já existiam:
- o catálogo já tinha a entrada `jbi-scoping-review`: capítulo 10 do JBI Manual 2024, com o PCC, os 9 passos
  de Peters (que expandem Arksey e O'Malley e Levac) e o PRISMA-ScR como norma de relato;
- a DIRECAO §9, de 04/10, já dizia que ausência não é achado;
- o plano já tinha a assimilação de métodos validados na 7+.

**O teste aplicado** usa só fundamentos já gravados:
- DIRECAO §9: defeito é o sistema afirmar o que não cumpre; ausência é escopo.
- DIRECAO §10: o critério do prejuízo a uma pesquisa (publicar algo falso, perder dado elegível, decidir
  errado).
- Regra de 09/10: o que é defeito, sempre, é o sistema mentir.
- Diretriz de 17/10, precisada em 29/10: assimilar metodologia validada é manutenção com protocolo próprio.

Classes: DEFEITO, AUSÊNCIA, PRINCÍPIO, ADIAMENTO e MISTO. Ações: MANTER, ENXUGAR (fica o defeito, sai o
acréscimo), FUNDIR e RECUSAR.

## Resultado (58 achados abertos)

| ação | quantos | o que significa |
|---|---|---|
| MANTER | 17 | defeito vivo, sem acréscimo |
| ENXUGAR | 16 | fica o defeito; sai o acréscimo de decisão, agenda ou ausência (o DEBT-102 fecha como RESOLVIDO) |
| FUNDIR | 10 | o mesmo defeito já está em outro achado aberto |
| RECUSAR | 15 | não é achado: 5 ausências, 5 princípios, 5 adiamentos |

Aplicada, a proposta deixa cerca de 32 abertos (58 − 10 fundidos − 15 recusados − o DEBT-102 resolvido).

## O que a varredura achou além do caso

1. **O erro tem duas direções, com a mesma raiz.**
   - **Uma direção: ausência e decisão gravadas como achado.** Esse é o caso do Vicente: DEBT-007 (JBI), parte 2
     do DEBT-008 (GRADE e CERQual), DEBT-094 (RAISE), DEBT-110, DEBT-101, DEBT-132, DEBT-145 e DEBT-147. O
     catálogo já tem todas as metodologias citadas.
   - **A outra direção: defeito de hoje escondido como escopo.**
     - Defeito de texto empacotado com uma assimilação. No DEBT-008, a skill de síntese amarra GRADE e CERQual à
       metanálise. No DEBT-151, a F7.3 (certeza da evidência) e o motivo EX-03 ("desfecho não reportado") valem
       na revisão de escopo. Esses consertos ficariam esperando a metodologia.
     - Defeito rotulado como escopo. Dos 15 abertos com destino `METODOLOGIA_NOVA`, 14 são defeito pela
       classificação, e só uma parte do DEBT-008 é assimilação de verdade. Em 08/10, a DIRECAO §11 deu 23 dos 35
       achados marcados como "travando" por escopo, só pelo destino `METODOLOGIA_NOVA` ou `CONFORM_EXTERNA`. Hoje,
       defeitos com esse destino estão na 7+, sem sessão nomeada (conferido na tabela de sessões do plano):
       - DEBT-089: o `retrieve_fulltexts` reescreve o dataset e pode truncar o corpus;
       - DEBT-060: os agentes têm `Bash` e `Write` apesar da proibição;
       - DEBT-062: o consentimento do Sci-Hub só existe na descrição.
   - **A raiz**: um campo que mistura o que o achado é com onde ele será feito.
2. **A causa está em três pontos do sistema, e corrigi-los não exige revisar achado por achado.**
   - `maintainer.md:118-125` manda registrar no backlog, como EXTENSÃO, toda metodologia ausente. Isso contraria
     a DIRECAO §9.
   - `record_system_finding` aceita achado sem perguntar onde o sistema afirma ou exige algo hoje.
   - Os acréscimos DECISÃO, CONSEQUÊNCIA e REAGENDADO, escritos no `context` dos achados, transformaram o
     DEBT-149 e o DEBT-151 em sessões de duas janelas.
3. **A reclassificação de 18/10 já propunha quase todas as fusões e enxugamentos.** O arquivo é
   `RECLASSIFICACAO_fila_2026-10-18.md`, que diz "nada aqui foi executado".
4. **O DEBT-141 vem antes da rota "ausência vai ao catálogo".** A `absorb_methodology` com `atualizar=true` apaga
   campos. Até o conserto, só criar entrada nova.

## Decisões aprovadas pelo Vicente (05/11/2026, à tarde)

Origem: "aplicar as decisões". Antes, sobre o caso: "as sessões trouxeram reflexões que entrar em debt sem impedir o
plano de manutenção e sem acrescentar problemas que não existem"; "achei que fosse mais uma contaminação do prisma
e por isso pontuei"; "a palavra prisma não é proibida e tem conjuntos de metodologias importantes que vão
existir".

1. **Regra do backlog.**
   > O backlog de manutenção (`system_debt.json`) registra só defeito: o que o sistema afirma, exige ou entrega
   > hoje e não se sustenta (DIRECAO §9, 04/10). Reflexão ou decisão do Vicente que aponta um defeito real entra
   > no achado desse defeito, e só isso: não abre sessão nem agenda migração ou trabalho que o plano não tem. O
   > princípio geral vai ao registro de decisões (e à descrição do método, sessão M), e a agenda, ao plano. Não
   > entram no backlog: metodologia ou norma consolidada e validada que o sistema ainda não tem, que fica no
   > catálogo e é assimilada pelo procedimento de manutenção quando o Vicente decidir, sem achado nem sessão
   > desenhada para ela; e problema que só existiria no futuro. O sistema não assimila metodologia sozinho:
   > cada assimilação é uma rodada de manutenção a partir da fonte oficial.

   Aplicada no item 4 do "Como trabalhar" do plano e no `maintainer.md` (gate RV-11 aprovado).
2. **D14 e DEBT-151.**
   > O método de revisão de escopo não herda da revisão sistemática o que é próprio dela: rótulos do PICOS,
   > exclusão por desfecho, certeza da evidência. Herdar isso é contaminação do PRISMA — e a palavra, aqui,
   > nomeia só isto: o ReviewBR usava o modelo da revisão sistemática como espelho do seu próprio modo de
   > trabalhar. O PRISMA não é proibido: os seus conjuntos de metodologias são importantes e vão existir no
   > sistema. A D14 não pede assimilar metodologia nova nem migrar projetos.

   - O DEBT-151 ficou só com o defeito e vai para a sessão 6, ou antes, numa sessão curta, se os projetos de
     escopo chegarem à triagem.
   - A 2d saiu do plano. Assimilar o `jbi-scoping-review` é trabalho de catálogo, quando o Vicente decidir.
   - O RAISE (DEBT-094) espera a resposta ao D07.
3. **2c.** O DEBT-149 fecha no item 1. A leitura documentada (itens 2 e 3) segue na 2c como construção do
   procedimento de assimilação (B1, B2), sem prender o fechamento. Sai o item 4: a trava da escolha de método
   (DEBT-145) é a D15.
4. **Os outros 55.** Sem agente: cada sessão confere, na abertura, a proposta para os achados que vai tocar e a
   aplica pela tool ao fechar, se ela se sustentar no código (item 9 do "Como trabalhar"). As 15 saídas foram
   confirmadas pelo Vicente e aplicadas (05/11).
5. **Sessão P, curta, depois da 2c: a porta do backlog.** A `record_system_finding` recusa achado novo ou
   atualizado sem a "mentira de hoje" (arquivo:linha e o que a contradiz), com teste; o destino
   `METODOLOGIA_NOVA` deixa de valer para defeito.

## Vistos de passagem, fora dos 58 (a conferir antes de registrar)

- `.claude/skills/methodology-router/SKILL.md:13` diz que o `prisma-sr` serve "a revisão sistemática e a
  exploratória". O manifest dele declara só `systematic_review`. Isso foi notado em 18/10 e não tem achado.
  Conferido em 05/11 pelo acompanhamento: a frase está lá.
- `harvest_records`: a descrição do `projectPath` sugere persistência, e o handler não chama
  `appendRawRecords`. É a mesma classe do DEBT-087, sem achado aberto que a cubra. Não conferido.
- A descrição do manifest do `prisma-sr` ("Trilha completa ... com rastreabilidade PRISMA 2020") afirma mais do
  que os 21 itens órfãos e os 5 deslocados sustentam. Não conferido.
- Há um arquivo solto, `reviewbr/reviewbr-mcp/src/index.ts.tmp`. Conferido: existe.
- `batch_llm_extract`: o registro de uso de IA lhe atribui o aviso C3 (`registry/ai_use.ts:78`), e ele não o
  emite (só `index.ts:741` e `:2504` chamam a checagem). Visto pelo classificador do DEBT-015. Não conferido.
- A DIRECAO termina na linha 469 com a primeira linha de uma tabela sem cabeçalho. A lista dos 12 que "sobram"
  no §11 não está no disco. Conferido.

## Proposta por achado


### Saem do backlog (RECUSAR) — 15

**DEBT-007** (RECUSADO, SERIO, destino CONFORM_EXTERNA) — JBI (Joanna Briggs Institute) citado mas nao implementado

- Classe: AUSENCIA · confiança: alta
- Mentira de hoje: Nenhuma. 'JBI' é uma das opções de instrumento que o protocolo declara na F6 do prisma-sr (manifest.json:131-138, com producer_tools vazio; spec.md:305). Nenhuma tool diz aplicá-lo e nenhum gate o confere. O método de escopo não cita o JBI. A única promessa ('PRISMA-ScR + Guia JBI', src/index.ts:253) é texto morto: assess_research_design só lê do META o rótulo, o registro e a descrição (index.ts:463-519). A tabela duplicada é o DEBT-136, sessão 6.
- Fica: Nada.
- Sai: Tudo: 'JBI citado e não implementado' e 'o JBI tem metodologia própria (escopo, umbrella) que o sistema não cobre'.
- Vai para: Catálogo: jbi-critical-appraisal-tools (o 'JBI' da F6), jbi-manual, jbi-scoping-review, jbi-umbrella-review e jbi-sr-*. Assimilação pelo procedimento (RV-11, fonte oficial, completa) quando o Vicente decidir, como o plano já prevê na 7+. Corrigir também maintainer.md:124-125, que apresenta o DEBT-007 como o 'registro' do JBI.
- Sessão: Nenhuma para o achado. A assimilação do JBI segue na 7+ como trabalho de catálogo.
- Por quê: É o caso-tipo do §9 da DIRECAO: metodologia conhecida registrada como dívida. Conferi a promessa que o context alega para o escopo, e ela não chega ao pesquisador.

**DEBT-015** (RECUSADO, SERIO, destino CONFORM_EXTERNA) — Das 40 tools, so 4 usam IA — e as 4 estao na triagem/extracao, sem verificacao deterministica por cima

- Classe: AUSENCIA · confiança: media
- Mentira de hoje: Nenhuma nos trechos citados. screen_candidates se apresenta como 'Triagem por IA (Gemini)' (src/index.ts:698) e emite o aviso do RAISE 3 'EXIGE VALIDAÇÃO DENTRO DA REVISÃO' (index.ts:741; registry/ai_use.ts:198). O RAG se declara 'Retriever léxico BM25' (index.ts:1745), e o reader escreve [TBD] onde o corpus não responde, em vez de concluir ausência (reader.md:27). Nada afirma que a saída da IA foi conferida.
- Fica: Nada.
- Sai: Tudo: a 'verificação determinística por cima' (validação dentro da revisão: padrão-ouro, meta de recall, duas corridas com kappa) e a recuperação semântica no lugar do BM25. O denominador também está vencido: são 44 tools, não 40.
- Vai para: Plano: um único item de funcionalidade, 'validação da IA dentro da revisão', o mesmo que sobra do DEBT-101 e do DEBT-094. As normas estão no catálogo (raise-2, raise-3). A recuperação semântica vai ao plano, se o Vicente quiser.
- Sessão: Nenhuma marcada.
- Por quê: O destino CONFORM_EXTERNA já é tratado como escopo pelo §11 da DIRECAO. A confiança é média porque vi de passagem que batch_llm_extract, que o extractor usa por padrão (extractor.md:17), não emite o aviso C3 que o registro lhe atribui (ai_use.ts:78; só index.ts:741 e :2504 chamam checarUsoDeIA). Não é mentira, porque nada afirma validação, mas entra na resposta ao D07.

**DEBT-043** (RECUSADO, MENOR, destino AGENTE_SKILL) — Nenhum teste cobre os invariantes RV-01..RV-08; a suite testa o RV-11 e a governanca

- Classe: AUSENCIA · confiança: media
- Mentira de hoje: Nenhuma. Nada afirma que o FlowComputer ou o caminho do handler do checkDesignGuardrail tenham teste, e o próprio achado registra que 4 dos 6 verificadores já têm.
- Fica: Nada no backlog.
- Sai: O achado inteiro.
- Vai para: O teste do FlowComputer vai ao conserto do DEBT-071; a linha dele em 18/10 já diz 'com teste do FlowComputer (a metade do DEBT-043)'. O teste do caminho do handler do checkDesignGuardrail vai ao plano, como saída verificável da sessão 3.
- Sessão: 3: já está listado lá e deixa de ser achado para virar item da saída verificável.
- Por quê: Um teste que falta não mente nem prejudica: é o que falta ligar de uma correção em curso (§9), ou seja, escopo do trabalho. Confiança média porque a verificação de 04/10 o manteve, estreitado, mas por precisão e não por prejuízo.

**DEBT-070** (RECUSADO, MENOR, destino CONFORM_EXTERNA) — Nenhum gate é chamado por código: o campo `gates[].blocks` do manifest não é lido em lugar nenhum do runtime

- Classe: PRINCIPIO · confiança: alta
- Mentira de hoje: Nenhuma própria. O que o achado ainda sustenta é que o runtime não lê o array gates, e isso é arquitetura. O DEBT-049 tratou o mesmo ponto e foi fechado em 04/10 por distinção de escopo; a regra de 09/10 dispensou essa arquitetura; e o Vicente respondeu SIM à pergunta 4 em 29/10 (gates conferidos só na instalação). Se cada entrada diz a verdade é assunto do DEBT-138, e o próprio achado reconhece que o gate do RV-05 roda por código.
- Fica: Nada.
- Sai: O achado inteiro, e com ele o depende_de do DEBT-003.
- Vai para: A frase decidida em 29/10 ('gates é declaração conferida na instalação pelo validate_methodology, não configuração do runtime') entra no conserto do DEBT-138, na sessão 3, no mesmo arquivo, e a resolução cita a decisão de 29/10. Nada a construir.
- Sessão: 3: sai da lista, e a frase vai com o DEBT-138
- Por quê: 'Quando o runtime passar a ler o manifest, este achado fecha junto' é um adiamento à espera de uma arquitetura já dispensada. Mantê-lo prendia o DEBT-003 por dependência.

**DEBT-094** (RECUSADO, BLOQUEIA, destino CONFORM_EXTERNA) — RAISE 2026: o sistema descumpre os 6 itens do §4.9 e as 5 exigencias de triagem do RAISE 2

- Classe: AUSENCIA · confiança: media
- Mentira de hoje: Nenhuma encontrada. Nenhum método declara o RAISE em conformance.standards (o grep nos manifests e nas pastas conformance dá zero). O sistema informa a categoria C3 na triagem por LLM (ai_use.ts:198; index.ts:741 e :2504) e não afirma validação. Parte da evidência de 25/09 está vencida: temperatura, modelo com alias resolvido, prompt e proveniência por decisão já foram feitos (DEBT-027/098/099). E o critério de fechamento escrito no próprio context, absorver no catálogo, já está cumprido.
- Fica: Nada.
- Sai: Tudo, em três partes: (1) se o RAISE vale num projeto, que é a decisão D07; (2) a validação dentro da revisão (padrão-ouro, meta de recall, variabilidade), que é funcionalidade; (3) os itens de relato 4.9.x, que são conformidade a uma norma e seguem o procedimento se o D07 disser que ela vale.
- Vai para: (1) Fundamentos: o D07 (lista_decisoes.md:80), que só o Vicente responde. O 'não tornar canônico raise' de 08/10 já pesa contra tratar o descumprimento como defeito. (2) Plano: o mesmo item do DEBT-015 e do DEBT-101. (3) Catálogo e procedimento: declarar raise-3 (e raise-1) no método, se for o caso.
- Sessão: 2d: sai o item 11 (DEBT-094, RAISE 3). Fica só a pergunta D07, que é decisão, não conserto.
- Por quê: O destino CONFORM_EXTERNA é escopo pelo §11. A confiança é média pelo histórico (BLOQUEIA, EM_CURSO) e porque a extração por LLM roda sem o aviso C3 (ver DEBT-015). Se o D07 tornar o RAISE 3 exigível, isso vira conformidade a fazer, não mentira de hoje.

**DEBT-101** (RECUSADO, SERIO, destino DECISAO_PESQ) — O alvo da triagem por IA nao e determinismo: e auditabilidade e variabilidade medida — como ja se exige de humanos

- Classe: PRINCIPIO · confiança: alta
- Mentira de hoje: Nenhuma. compararCorridas (screening_audit.ts:161) existe, mas nenhuma tool a chama, e nada afirma que o kappa entre corridas é medido ou relatado. O kappa da spec (F4.1.5, spec.md:207) é um campo que o pesquisador preenche quando a triagem é dupla.
- Fica: Nada.
- Sai: O princípio ('o alvo da triagem por IA é auditabilidade e variabilidade medida, não determinismo') e a 'metade da MEDIDA' que falta: uma tool que rode a triagem duas vezes, chame compararCorridas e leve as discordâncias ao humano. A metade do registro já foi feita (DEBT-027/098/099).
- Vai para: O princípio vai aos fundamentos: já está no D01 (lista_decisoes.md:12), a confirmar pelo Vicente, e cabe na descrição do método (M). A medida vai ao plano, no mesmo item de validação do DEBT-015 e do DEBT-094.
- Sessão: Nenhuma; a sessão M recebe o princípio.
- Por quê: O próprio achado se define como 'PRINCÍPIO DE DESENHO', e o que falta é funcionalidade.

**DEBT-106** (RECUSADO, MENOR, destino METODOLOGIA_NOVA) — Os scripts de origem/codigo_origem/ têm caminhos absolutos da máquina antiga: TESSDATA_PREFIX=C:/Users/alqui/tessdata em 6 scripts e a pasta do projeto cajuína fixada em…

- Classe: ADIAMENTO · confiança: alta
- Mentira de hoje: Nenhuma. Os scripts de origem/codigo_origem/ são registro de origem, não código do sistema. Nada em src/ os importa ou chama (o próprio achado conferiu), e o sistema não afirma rodá-los.
- Fica: Nada.
- Sai: O achado inteiro.
- Vai para: Plano: uma nota no item de portar o OCR (parte b do DEBT-102, EM_CURSO) dizendo que, ao portar, a pasta do projeto e o TESSDATA_PREFIX viram parâmetro. Não precisa de achado próprio.
- Sessão: Nenhuma.
- Por quê: O próprio context diz 'só importa quando o DEBT-102 for implementado' e 'não corrigido agora: os scripts são registro de origem'. É adiamento puro; a reclassificação de 18/10 já dizia 'nada agora'.

**DEBT-110** (RECUSADO, MENOR, destino AGENTE_SKILL) — Não há etapa antes do F0: assess_research_design classifica o tipo de revisão e devolve requisitos, mas ninguém avalia se a pergunta é viável nem para quem o resultado…

- Classe: AUSENCIA · confiança: alta
- Mentira de hoje: Nenhuma. A descrição de assess_research_design (src/index.ts) diz que a tool apresenta os métodos assimilados que servem ao tipo; não diz que avalia viabilidade. O próprio achado registra que 'nada quebra por não a ter'.
- Fica: Nada.
- Sai: Tudo: a etapa pré-F0 adaptada da skill scientific-problem-selection (Fischbach & Walsh, Cell 2024).
- Vai para: O que serve a uma revisão já está na trilha (F0.3.1–F0.3.4: justificativa, revisões anteriores, lacuna e relevância; spec.md:53-56) ou chega com a assimilação dos métodos de condução, como a busca preliminar por revisões existentes (conferir na fonte do jbi-manual, jbi-scoping-review e cochrane-handbook ao assimilar). Adaptar um arcabouço de escolha de problema científico, que não é metodologia de revisão validada, não passa a premissa de assimilação. Vai ao plano só como proposta, se o Vicente mantiver o interesse.
- Sessão: Nenhuma.
- Por quê: É o mesmo padrão que o Vicente apontou: um método heterodoxo montado como tarefa, quando as metodologias de revisão já trazem o passo.

**DEBT-114** (RECUSADO, SERIO, destino FASE_1) — O item 8 do PRISMA (Selection process) exige 4 declaracoes e o sistema tem campo para UMA: o catalogo declara o item coberto por 4 subitens, nenhum dos quais tem…

- Classe: ADIAMENTO · confiança: alta
- Mentira de hoje: Nenhuma. O próprio achado, reavaliado em 08/10, registra que três das quatro declarações do item 8 são de protocolo, e o protocol_auditor já as exige: ROTULOS_F41 (protocol_auditor.ts:72-76) reprova o travamento sem elas (DEBT-113). A quarta está na trilha de auditoria de IA. O resíduo (kappa, F4.1.5, só com triagem dupla) já está na spec, marcado 'se dupla' (spec.md:207), e o item 8 fica coberto por F4.1.2/F4.1.3 de qualquer forma.
- Fica: Nada.
- Sai: O achado inteiro, fechado com o DEBT-113 citado como o conserto.
- Vai para: Nada. Se o F4.1.5 virar condição de método, isso entra no remapeamento do PRISMA 2020 (DEBT-045/014); o kappa calculado depende da ferramenta do DEBT-101. O depende_de DEBT-112 ficou obsoleto pelo próprio contexto.
- Sessão: nenhuma
- Por quê: O defeito foi consertado por outro achado, e o que sobra é uma conferência sem falha mostrada. A reclassificação de 18/10 já marcava 'não vale hoje — fechar'.

**DEBT-132** (RECUSADO, SERIO, destino FASE_1) — O modo de agir do ReviewBR: o que o sistema garante, o que apenas torna visivel, e o que nao protege — declarado para nao prometer o que nao cumpre

- Classe: PRINCIPIO · confiança: alta
- Mentira de hoje: Nenhuma própria. A decisão de 04/10 (garante / torna visível / não protege) já está escrita nos fundamentos (maintainer.md:24-30), e nenhum texto voltado ao pesquisador promete proteção contra fraude (conferi a conduct-review e os READMEs). Os caminhos abertos que o achado lista têm achados próprios, abertos e com sessão: DEBT-018 ([LOCKED] lido pelo conteúdo, sessão 5), DEBT-138 (o export não recomputa o funil, sessão 3) e DEBT-060 (agentes com Write e Bash).
- Fica: Nada.
- Sai: Tudo: a decisão e a consequência 'priorizar detecção e registro sobre bloqueio impossível'.
- Vai para: Fundamentos: já está em maintainer.md:24-30 e entra na descrição do método (M). Os consertos seguem no DEBT-018 e no DEBT-138.
- Sessão: M.
- Por quê: É uma decisão registrada como achado. A tabela do maintainer.md só fica verdadeira quando o DEBT-018 e o DEBT-138 fecharem, e os dois já estão na fila.

**DEBT-134** (RECUSADO, SERIO, destino DECISAO_PESQ) — O ProtocolDesignAuditor e o ProtocolGate exigem protocolo travado de TODO projeto, inclusive dos que nao assumiram metodologia — e o aviso de busca exploratoria citava…

- Classe: PRINCIPIO · confiança: media
- Mentira de hoje: Nenhuma hoje. Todo projeto que se pode criar tem um método que exige protocolo travado: o prisma-sr serve só systematic_review e o scoping-prisma-scr só scoping_review (serves_research_types nos manifests), e tipo sem método assimilado é recusado (resolução do DEBT-121, 09/10). A parte (1) foi corrigida em 08/10. A própria reclassificação de 18/10 diz do conserto proposto: 'para os dois métodos atuais o comportamento não muda'.
- Fica: Nada no backlog.
- Sai: O achado inteiro, com o depende_de DEBT-121. Como o DEBT-121 já está RESOLVIDO, o audit daria este achado por liberado em falso.
- Vai para: (a) Fundamentos, em forma precisa: a auditoria de protocolo antes da busca vale para o método que exige protocolo; os dois métodos instalados exigem; o modo de agir (RV-04) vale para toda pesquisa. A distinção entre os dois auditores (ProtocolDesignAuditor antes da busca, MethodologyAuditorService depois) vai à descrição do método do ReviewBR, na sessão M. (b) Procedimento de assimilação: o método que não exija protocolo travado declara isso no manifest, e a trava passa a ler essa declaração, dentro da própria assimilação. (c) A mistura dos auditores no discurso dos gates (o audit_methodology apresentado como gate que bloqueia a síntese) já está no DEBT-138.
- Sessão: 6 (sai da lista) e M (a decisão)
- Por quê: É exatamente o caso que o Vicente descreveu: preparar o sistema para um método que ainda não existe. Quando esse método for assimilado com rigor, a trava se ajusta na própria assimilação. Pela regra de 09/10, mudar código quando o administrador decide é fluxo de trabalho, não dívida.

**DEBT-136** (RECUSADO, SERIO, destino FASE_1) — A tabela de tipos de pesquisa continua DUPLICADA e divergente (o DEBT-122 consertou a frase derivada, nao a copia), e a z.enum de plan_research_protocol tem 6 valores…

- Classe: ADIAMENTO · confiança: media
- Mentira de hoje: Nenhuma que chegue ao pesquisador hoje. O fallback com '44 subitens' saiu do index.ts: o campo prismaStandard da cópia (index.ts:246-288) não é lido em lugar nenhum. O fallback do project_init.ts:229-231 só dispara para método sem padrão declarado, e os dois instalados declaram. methodological_audit ficar fora da z.enum de plan_research_protocol (index.ts:1549) não promete nada: nenhum método serve a esse tipo, e o assess_research_design recusa com a mensagem honesta. O que a cópia ainda leva ao pesquisador ('Registro: OBRIGATÓRIO') é o DEBT-135, aberto.
- Fica: Nada no backlog.
- Sai: O achado.
- Vai para: Plano, sessão 6, onde já consta ('tabela de tipos duplicada'): apagar a cópia morta da tabela no index.ts e alinhar a enum do plan_research_protocol aos tipos que têm método, junto do DEBT-135, que mexe nas mesmas linhas. A linha da sessão 6 passa a descrever a tarefa sem o id.
- Sessão: 6
- Por quê: A mentira que justificava o achado saiu. Sobra duplicação de código e um limite que só pesa no futuro: pela regra de 09/10, precisar de mudança no código não é defeito, e a tarefa já está no plano.

**DEBT-145** (RECUSADO, SERIO, destino FASE_2) — A cobertura dos padroes vira TRAVA na escolha de metodo so depois que os mapeamentos forem corrigidos — ate la o sistema mostra a fracao e o que falta, e o pesquisador…

- Classe: ADIAMENTO · confiança: alta
- Mentira de hoje: Nenhuma. A trava não existe e nada diz que existe; check_standard_coverage mostra as lacunas quando é chamado. O passo intermediário, 'a escolha de método mostra a fração', não foi feito: metodosParaTipo devolve os padrões e as pendências da trilha, sem fração (methods_for_type.ts:55-90). Mas também não é afirmado. É uma decisão (D15) ainda não executada.
- Fica: Nada.
- Sai: Tudo: a decisão de 17/10, o ponto (3) de 30/10 mantido em 05/11 ('a trava considera só item esquecido') e a trava futura ('quando os quatro fecharem...'), com o depende_de.
- Vai para: A decisão e o ponto (3) vão aos fundamentos, no D15 (lista_decisoes.md:179). A trava e a fração na escolha de método vão ao plano, como funcionalidade a construir depois do DEBT-014 e do DEBT-045. Com o ponto (3), a dependência do DEBT-149 cai.
- Sessão: 2c: sai da saída verificável o 'DEBT-145 atualizado'; o ponto (3) vai ao D15.
- Por quê: O texto é literalmente 'quando X existir': adiamento de funcionalidade, não falha de hoje.

**DEBT-146** (RECUSADO, MENOR, destino AGENTE_SKILL) — Nenhum teste trava o corpo dos agentes ('Ferramentas (contrato de papel)') contra o frontmatter: as correções do DEBT-061 e do DEBT-065 podem regredir sem nada reprovar

- Classe: ADIAMENTO · confiança: alta
- Mentira de hoje: Nenhuma. O próprio achado diz que corpo e frontmatter foram sincronizados em 26/09 (DEBT-065, resolvido) e que 'o risco é regressão silenciosa, não defeito apurado hoje'.
- Fica: Nada no backlog.
- Sai: O achado inteiro.
- Vai para: Plano: saída verificável da sessão 6. É lá que os agentes são reescritos por papel e que a seção 'Ferramentas (contrato de papel)' muda, e é lá que entra um teste comparando essa seção com o frontmatter.
- Sessão: 6
- Por quê: Teste de regressão de uma correção já feita é o que falta ligar de uma correção em curso (§9), não achado. Foi registrado em 29/10 por causa da DEC-43, que é de 27/09 e anterior a esse critério. Pôr o teste na sessão 6 é decisão do Vicente.

**DEBT-147** (RECUSADO, MENOR, destino DECISAO_PESQ) — Requisito do Vicente: abrir a pasta numa IDE com IA e o ReviewBR funcionar, com o Node como pré-requisito — hoje o clone só funciona depois de npm install e npm run build

- Classe: PRINCIPIO · confiança: alta
- Mentira de hoje: Nenhuma. .claude/README.md:28-31 manda rodar 'npm install && npm run build' antes de usar, e nenhum texto diz que a pasta funciona sem instalação.
- Fica: Nada.
- Sai: Tudo: o requisito ('abrir a pasta numa IDE com IA e funcionar, com Node') e a escolha da forma.
- Vai para: Fundamentos: o D31 (lista_decisoes.md:374), que define os termos com o Vicente. Plano: a funcionalidade, quando ele decidir a forma.
- Sessão: Nenhuma.
- Por quê: É requisito de produto com decisão pendente, e o sistema diz a verdade sobre a instalação.


### Fundem-se em outro achado (FUNDIR) — 10

**DEBT-012** (EM_CURSO, BLOQUEIA, destino CONFORM_EXTERNA) — A spec mapeia 12 subitens da trilha a itens PRISMA ERRADOS — confirmado contra a fonte oficial

- Classe: DEFEITO · confiança: alta · fundir em: DEBT-045
- Mentira de hoje: É a mesma do DEBT-045. Os ponteiros de registro (F0.1.4, F0.1.5, F0.2.1-4 para o item 15) e o deslocamento de +1 a partir do 25 (F0.1.9/F5.2.5.2 para o 25; F5.2.5.3/F8.3.26/F8.4.1-3 para o 26) continuam em .claude/methodologies/prisma-sr/conformance/prisma-2020.json, hoje declarados 'deslocado' com o DEBT-045 como âncora. A spec ainda numera errado (spec.md:406-407, :416-419; F8.4.x 'Item 26').
- Fica: Nada aqui; tudo fica no DEBT-045.
- Sai: O achado inteiro. É o mesmo remapeamento, e o DEBT-045 já lista estes 12 ponteiros e é a âncora das declarações 'deslocado'.
- Vai para: DEBT-045. A nota do mapeamento do prisma-sr ('Ver DEBT-012 e DEBT-014') passa a citar o DEBT-045 e o DEBT-014.
- Sessão: 7+ (remapeamento do PRISMA 2020, pela leitura documentada que a 2c cria)
- Por quê: Mesmo defeito, mesmos ponteiros. A reclassificação de 18/10 já propunha fechar como duplicata. Está EM_CURSO sem resolução nem sessão: é duplicata parada na fila.

**DEBT-036** (ABERTO, BLOQUEIA, destino CONFORM_EXTERNA) — RV-03, RV-04, RV-06 e RV-07 sao declarados `always_on` sem nenhum gate — e o proprio sistema sabe disso

- Classe: DEFEITO · confiança: alta · fundir em: DEBT-003
- Mentira de hoje: A mesma do DEBT-003: os dois manifests declaram RV-03, RV-04, RV-06 e RV-07 como always_on sem gate, e o MethodologyWriter.validar reprova os dois métodos.
- Fica: Nada como item próprio.
- Sai: O achado como item próprio, e o trecho 'só pode ser chamada pelo maintainer — que até hoje nunca rodou. A regra que detecta o buraco depende de alguém lembrar de chamá-la'.
- Vai para: A reprodução pelo MethodologyWriter.validar vai ao DEBT-003, como evidência e como teste na suíte. O 'depende de alguém lembrar' não vai para lugar nenhum: rodar a manutenção é fluxo do administrador (regra de 09/10), e o teste na suíte resolve o lembrar.
- Sessão: 3, pelo DEBT-003
- Por quê: Mesmo fato, mesmos arquivos e mesmo conserto. A reclassificação de 18/10 já propunha fechá-lo como duplicado do DEBT-003.

**DEBT-039** (ABERTO, SERIO, destino METODOLOGIA_NOVA) — RV-02: compute_flow_counts grava o prisma_flow.json mesmo com a validacao REPROVADA, e edicao manual so vira aviso

- Classe: DEFEITO · confiança: alta · fundir em: DEBT-138
- Mentira de hoje: O manifest do prisma-sr declara que o RV-02 (compute_flow_counts) 'blocks escrita manual de contagens no prisma_flow.json'. A tool só devolve manualEditWarnings e grava por cima, sem consultar validation.valid (index.ts:1726-1727, conferido hoje).
- Fica: Nada separado. O defeito continua inteiro no DEBT-138 e no DEBT-071.
- Sai: O achado como item separado. A metade 'o RV-02 declarado como bloqueio só avisa e sobrescreve' é, quase com as mesmas palavras, a primeira metade do DEBT-138. A metade 'grava mesmo com a validação reprovada' está no DEBT-071, que também grava sem consultar validation.valid nem includedCrossCheck.
- Vai para: Vai para o DEBT-138, com a ressalva de 18/10: não trocar para 'não gravar', porque o arquivo antigo, talvez digitado à mão, ficaria no lugar e passaria no export. O caso do clamp por Math.max (flow_computer.ts) vai como teste do DEBT-071.
- Sessão: 3 (Funil e gates)
- Por quê: Com o mesmo defeito em dois achados abertos, a sessão 3 consertaria e fecharia duas vezes. O DEBT-138 já tem o conserto decidido (29/10, pergunta 3: o export recalcula o funil e bloqueia divergência).

**DEBT-040** (ABERTO, SERIO, destino CONFORM_EXTERNA) — RV-08: o gate nomeia audit_methodology mas a tool nao olha fonte_repositorio/url_hospedagem, e o export nao valida nada

- Classe: DEFEITO · confiança: alta · fundir em: DEBT-138
- Mentira de hoje: O manifest do prisma-sr (manifest.json:191-196) e o do scoping (:179) dizem que audit_methodology bloqueia a síntese de estudo sem fonte_repositorio/url_hospedagem. methodology_auditor.ts tem 0 ocorrências desses campos, e a tool se declara 'Apenas diagnostica' (index.ts:2303). Os textos de agente e skill repetem a promessa: synthesis-manuscript/SKILL.md:21, analyst.md:22, prisma-rigor-gates/SKILL.md:21 e conduct-review/SKILL.md:87.
- Fica: Nada aqui; fica no DEBT-138, que passa a citar também as localizações de skill e agente que hoje não cita.
- Sai: O achado inteiro. A metade do export já foi corrigida em 25/09, e a outra metade é o RV-08 que o DEBT-138 já descreve.
- Vai para: DEBT-138, acrescido de synthesis-manuscript/SKILL.md:21, analyst.md:22, prisma-rigor-gates/SKILL.md:21, conduct-review/SKILL.md:87 e do gate RV-08 do manifest do scoping.
- Sessão: 3 (funil e gates: 'manifests dizem a verdade sobre os gates')
- Por quê: É o mesmo defeito do DEBT-138 (gate RV-08 apontado para a tool errada), que está aberto e já tem sessão. A reclassificação de 18/10 já propunha a fusão. Conferido no código hoje.

**DEBT-054** (ABERTO, SERIO, destino CONFORM_EXTERNA) — 39 referências da trilha estão estacionadas em 6 itens-cabeçalho e são descartadas pelo cálculo de cobertura

- Classe: DEFEITO · confiança: alta · fundir em: DEBT-014
- Mentira de hoje: Nenhuma própria. O código acerta ao não contar cabeçalho (standards.ts:204), e a tool reporta os 21 órfãos. As 39 referências estacionadas nos itens 10, 13, 16, 20, 23 e 24 do mapeamento são exatamente o dado que falta nos subitens do DEBT-014.
- Fica: Nada aqui; no DEBT-014, como material do conserto: redistribuir as 39 referências pelos 21 subitens, conferindo no texto oficial.
- Sai: O achado inteiro.
- Vai para: DEBT-014
- Sessão: 7+ (com o DEBT-014 e o DEBT-045)
- Por quê: A reclassificação de 18/10 já concluiu: 'o código está certo em não contar cabeçalho; o erro está no dado'. O trabalho é o mesmo do DEBT-014.

**DEBT-063** (ABERTO, SERIO, destino CONFORM_EXTERNA) — A F6 (risco de viés) está ativa na metodologia, é mandada pelo analyst e pela skill, e não tem tool nem gate — fase inteira por autocertificação

- Classe: MISTO · confiança: media · fundir em: DEBT-066
- Mentira de hoje: A Camada 2 da prisma-rigor-gates promete que 'o gate de cada fase confere' os subitens obrigatórios e, para a F6, 'ferramenta, domínios, julgamentos' (:24 e :31). Não existe gate nem tool de F6. O manifest do prisma-sr já declara a F6 sem artefato e sem tool (closes_with '[NÃO DEFINIDO]…' e producer_tools vazio).
- Fica: Nada como item próprio.
- Sai: O achado como item próprio, e a falta dos instrumentos (RoB 2, ROBINS-I, Newcastle-Ottawa, checklists JBI) e de tool ou gate de F6.
- Vai para: A promessa falsa sobre a F6 vai ao DEBT-066 (mesma frase, mesmo conserto), junto com a declaração da F6 proposta em 18/10: 'julgamento do agente, decisão do pesquisador, [NÃO COBERTO]'. Os instrumentos já estão no catálogo e serão assimilados quando o Vicente decidir (7+); a resposta à pergunta do DEBT-008 vale também para eles (nota de 18/10). Tool ou gate de F6 vai ao plano, se for decidido.
- Sessão: 3, pelo DEBT-066; os instrumentos na 7+
- Por quê: A mentira que resta é a da Camada 2, que já está no DEBT-066. O resto são instrumentos conhecidos, que o catálogo já tem e o procedimento de assimilação cobre.

**DEBT-085** (ABERTO, SERIO, destino CONFORM_EXTERNA) — logToLocalProject tem a mesma classe de bug: com projectPath absoluto o log PRISMA-S nao e escrito

- Classe: DEFEITO · confiança: alta · fundir em: DEBT-139
- Mentira de hoje: index.ts:107 ainda faz path.join(process.cwd(), projectPath, 'logs'). Com caminho absoluto o log some, o catch (:123-125) só escreve no stderr, e a busca responde sucesso.
- Fica: Nada aqui; fica no DEBT-139.
- Sai: O achado inteiro. É a parte (1) do DEBT-139, que descreve o mesmo defeito de forma mais completa (inclui o audit_methodology em :2344 e o resolveProjectDir que já resolve).
- Vai para: DEBT-139
- Sessão: 4 (natural, com o DEBT-056); hoje não está em nenhuma.
- Por quê: Mesmo defeito, mesma linha; a reclassificação de 18/10 já propunha fechar como duplicata.

**DEBT-090** (ABERTO, SERIO, destino METODOLOGIA_NOVA) — A restricao de uso do BYOS existe so na descricao em linguagem natural — nao ha verificacao no codigo

- Classe: DEFEITO · confiança: alta · fundir em: DEBT-062
- Mentira de hoje: É a mesma do DEBT-062: a descrição promete uso só depois de um 'sim' explícito e só 'quando o acesso aberto FALHOU', e nada confere nenhuma das duas condições. Uma das três partes do achado já não vale: hoje o handler chama checkDesignGuardrail (index.ts:1798, conferido), então a parte 'não chama o guardrail' está resolvida.
- Fica: Nada separado.
- Sai: O achado como item separado.
- Vai para: Vai para o DEBT-062, levando a única condição que só este achado tem (recusar DOI que não esteja em fulltext_not_retrieved.json) e o registro de que a parte do guardrail foi resolvida.
- Sessão: A mesma do DEBT-062.
- Por quê: É o mesmo defeito, na mesma tool e nas mesmas linhas, encontrado por duas corridas da auditoria. A reclassificação de 18/10 já propunha esta fusão.

**DEBT-091** (ABERTO, SERIO, destino CONFORM_EXTERNA) — Seis rotas de aquisicao nao deixam nenhum registro de auditoria PRISMA-S

- Classe: DEFEITO · confiança: media · fundir em: DEBT-056
- Mentira de hoje: Sozinho, nenhuma além da do DEBT-056. harvest_records, expand_search_snowball e import_dataset_ris continuam sem logAuditEvent e sem logToLocalProject (conferido hoje). Mas o log que vale hoje é o CSV digitado pelo agente (DEBT-056). O vazio dessas rotas passa a pesar quando o código gravar o log, como o Vicente decidiu em 29/10.
- Fica: Nada aqui. No DEBT-056, como escopo explícito do log gravado por código: harvest_records, expand_search_snowball e import_dataset_ris (import_bvs_export é o controle e já registra).
- Sai: O achado. As rotas de texto completo e de metadado avulso (retrieve_fulltexts, download_and_extract_pdfs, get_record_metadata) saem de vez: não são execução de busca, e o PRISMA-S não as pede.
- Vai para: DEBT-056 (as três rotas de busca); o restante, nada.
- Sessão: 4
- Por quê: É a mesma lacuna do DEBT-056 vista pelo lado das rotas. A fusão só não perde nada se o DEBT-056 passar a listar as três rotas; sem isso, o conserto da sessão 4 poderia cobrir só as search_*.

**DEBT-105** (ABERTO, MENOR, destino AGENTE_SKILL) — Reprodução de achado apontando para scratchpad temporário, fora do repositório: 6 achados citam arquivos que não existem mais, 3 deles abertos e de tipo CORRECAO

- Classe: MISTO · confiança: alta · fundir em: DEBT-071
- Mentira de hoje: O backlog dá ao DEBT-071 (aberto, CORRECAO) uma reprodução que aponta para o scratchpad da máquina antiga (t2_flow.ts e proj), que não existe mais. A reprodução que o RV-11 exige existe só como prosa.
- Fica: Nada separado.
- Sai: O achado como item separado, inclusive a parte de classe (record_system_finding e audit_system_debt aceitam caminho temporário), que a contestação de 04/10 já tinha tirado do escopo.
- Vai para: Vai para o DEBT-071: reconstituir o fixture como teste em tests/ e fechar os dois juntos, que é exatamente o escopo que 04/10 deixou. A regra de classe já está nos fundamentos, no item 5 do 'Como trabalhar' (evidência dentro do repositório).
- Sessão: 3 (Funil e gates)
- Por quê: O que sobrou depois de 04/10 é uma tarefa do conserto do DEBT-071. Manter dois itens para um único conserto duplica a fila (§9). A reclassificação de 18/10 propôs a mesma fusão.


### Ficam só com o defeito (ENXUGAR) — 16

**DEBT-002** (ABERTO, BLOQUEIA, destino METODOLOGIA_NOVA) — RV-03, RV-04 e RV-07 não têm verificador determinístico; RV-06 tem verificação apenas parcial

- Classe: MISTO · confiança: alta
- Mentira de hoje: Na Camada 1 da .claude/skills/prisma-rigor-gates/SKILL.md, a abertura (:8) diz 'cada gate é uma verificação determinística'. Logo abaixo, RV-03 (:16) e RV-06 (:19) são conduta, sem tool. RV-07 (:20) promete 'Reprovação bloqueia: busca com string ad-hoc', e nenhuma tool confere a string contra o protocolo.
- Fica: A Camada 1 promete verificação determinística e bloqueio para RV-03, RV-06 e RV-07, que são conduta. O conserto é de texto (proposta de 18/10): declarar os três como conduta sem verificador [NÃO COBERTO], tirar a promessa de bloqueio do RV-07 e apontar o RV-04 para a trava. A frase de abertura (:3 e :8) fica com o DEBT-066, para não haver duas tarefas na mesma linha.
- Sai: (1) O RV-04 na lista do que não tem verificador. Isso está desatualizado: ProjectStateService.podeAvancar (project_state.ts:177, chamado em method_trail.ts:333 e :420) impede avançar de etapa sem decisão registrada. (2) O enunciado como ausência ('não têm verificador determinístico'), que convida a construir verificadores.
- Vai para: (1) Nada a construir. Basta a linha :17 da skill apontar para podeAvancar/record_researcher_decision, na mesma passada de texto. (2) Vai ao plano só se o Vicente decidir construir verificador para RV-03 e RV-07. Consertar a mentira não depende disso.
- Sessão: 3, como proposta: mesma passada de declaração do DEBT-138, na mesma skill e nos mesmos manifests. Hoje está entre as '19 declarações' da 7+.
- Por quê: A mentira está viva no texto que governa o orquestrador. A parte do RV-04 envelheceu, porque a trava existe. Construir verificador é uma escolha, não o conserto mínimo.

**DEBT-003** (ABERTO, BLOQUEIA, destino CONFORM_EXTERNA) — Os manifests declaram 8 invariantes `always_on` mas listam apenas 4 gates

- Classe: MISTO · confiança: alta
- Mentira de hoje: Os manifests do prisma-sr e do scoping-prisma-scr declaram RV-01 a RV-08 em invariants_always_on, mas só têm gate para RV-01, 02, 05 e 08. O validate_methodology do próprio sistema (MethodologyWriter.validar) reprova os dois métodos por isso. O plano registra essa reprovação como permanente ('segue reprovando os dois métodos pelo DEBT-003').
- Fica: Os manifests declaram 8 invariantes sempre ativos e só 4 têm gate, e o validador do próprio sistema reprova os dois métodos. Conserto (proposta de 18/10): cada manifest declara, invariante por invariante, o gate que o ativa (o RV-04 aponta para podeAvancar/record_researcher_decision) ou [NÃO COBERTO] com o motivo. O validate_methodology passa a aceitar essa declaração, e um teste na suíte roda o validador em cada método instalado (ideia vinda do DEBT-036).
- Sai: O depende_de DEBT-070 e o parágrafo 'DEPENDE_DE REPONTADO... primeiro fazer o runtime da revisão consumir o array gates, depois preencher os gates... DEBT-070... DEBT-121... DEBT-115'. Sai também a 'NOTA DE TRIAGEM' (REDUNDANTE, reavaliar com o DEBT-121).
- Vai para: Nada. A condição 'o runtime ler o array' é a arquitetura dispensada em 09/10: o DEBT-121 foi resolvido sem ela, e o Vicente respondeu SIM à pergunta 4 em 29/10 (gates conferidos só na instalação). A redundância se resolve fundindo aqui o DEBT-036.
- Sessão: 3, como proposta, na mesma passada do DEBT-138. Hoje está na 7+.
- Por quê: O defeito é real: o validador do próprio sistema está vermelho. A dependência do DEBT-070 adiava o conserto à espera de uma arquitetura que o administrador dispensou. É o 'empurrar com a barriga'.

**DEBT-008** (ABERTO, SERIO, destino METODOLOGIA_NOVA) — GRADE e CERQual citados na spec, sem implementacao

- Classe: MISTO · confiança: alta
- Mentira de hoje: Depois da parte 1 (31/10) sobram textos que dizem o que a fonte não diz. (i) synthesis-manuscript/SKILL.md:16 amarra a certeza à metanálise ('Se meta-análise: ... certeza (GRADE/CERQual)'). Isso contraria a spec, que exige a certeza sempre (spec.md:348-351), e o PRISMA 2020, em que os itens 15 e 22 são essenciais (leitura da 2b); além disso, põe o CERQual, que é qualitativo, sob metanálise. (ii) Com a resposta 'nenhuma', F7.3.2–F7.3.4 continuam obrigatórios (spec.md:349-351) sem dizer o que devem conter, quando o PRISMA-P 17 só pede declarar a ausência e o motivo. (iii) A descrição de record_researcher_decision (src/index.ts:1575) diz que a resposta 'decide que itens condicionais do padrão se aplicam'; para abordagem_certeza ela não decide item nenhum. A conduct-review foi corrigida, a tool não. (iv) '[NÃO COBERTO] por tool' na F7.3 (spec.md:344) usa a etiqueta num sentido diferente do da conformidade, que dá o item 22 como coberto por F7.3.3/F7.3.4.
- Fica: Os textos (i) a (iv), a corrigir como texto sem esperar a assimilação. O resumo do achado passa a ser 'textos sobre a certeza da evidência que dizem o que a fonte não diz', no lugar de 'GRADE e CERQual sem implementação'.
- Sai: A PARTE 2 inteira (ASSIMILAR GRADE e CERQual, sessões 7+). Também a nota (a) da conferência da 2b (dar leitor e aviso a abordagem_certeza), que acompanha a assimilação, e a nota (e) (o 2º teste passa por construção), que é observação de teste, não mentira ao pesquisador.
- Vai para: Catálogo: grade e grade-cerqual já existem, com fonte oficial. A assimilação segue o procedimento quando o Vicente decidir (plano, 7+). A nota (a) vai junto com a assimilação; a (e) vai ao plano de testes.
- Sessão: A 7+ deixa de ter a assimilação como conserto deste achado. O resíduo de texto não tem sessão marcada e cabe em qualquer uma que mexa em skills e tools (por exemplo, a 6).
- Por quê: A mentira principal foi resolvida na 2b. A que sobrou foi empacotada na 'parte 2' junto com a assimilação. É o erro inverso: um defeito de texto ficaria esperando a metodologia. Conferi (i), (ii) e (iii) no disco.

**DEBT-016** (ABERTO, MENOR, destino DECISAO_PESQ) — O gate RV-11 valida a PROSA da proposta, nunca a alteracao real

- Classe: MISTO · confiança: alta
- Mentira de hoje: validate_system_change diz 'Valida uma alteração do PRÓPRIO ReviewBR' e lista targets[] entre os campos (src/index.ts:2541-2549), mas só confere a prosa da proposta: change_validator.ts não lê o disco e nada consome targets.
- Fica: O texto da tool, que afirma validar a alteração e aceita targets sem avisar que não os confere. O conserto é o aviso decidido em 29/10.
- Sai: 'Conserto natural quando entrar: o gate conferir cada target no disco', porque a conferência real é extensão. Sai também o destino DECISAO_PESQ: a decisão já foi tomada em 29/10 (pergunta 12, 'targets na fila de extensão, com aviso').
- Vai para: Plano (fila de extensão), como o Vicente decidiu em 29/10.
- Sessão: 5, onde já está listado o 'aviso na tool de targets'.
- Por quê: O núcleo é mentira de texto, com conserto já decidido. A capacidade nova é ausência.

**DEBT-018** (ABERTO, SERIO, destino FASE_1) — O caminho de forjar o [LOCKED] vem de uma REDUNDANCIA ja diagnosticada: o ProtocolGate le o marcador no markdown como fallback, e o proprio codigo declara que isso e…

- Classe: MISTO · confiança: alta
- Mentira de hoje: O ProtocolGate libera a aquisição pelo marcador [LOCKED] no protocol.md quando o projeto não tem project_state.json: é o ramo do protoPath, que vem depois do ramo do estado. O próprio código chama isso de herança (protocol_gate.ts:70-71). Num projeto antigo sem estado, trocar [DRAFT] por [LOCKED] libera a busca sem passar pelo auditor, e o manuscrito afirma protocolo travado a priori. Quando o estado existe, o markdown já não é lido.
- Fica: A redundância: a trava tem duas fontes, e a do markdown pode ser forjada por um atalho de agente nos projetos sem estado. O conserto foi decidido em 29/10 (pergunta 9, SIM): remover o fallback e deixar o project_state.json como fonte única. O caju_beverages fica sem busca nova até o Vicente declarar o método dele. Fazer junto com o DEBT-133. A forja pelo status do project_state.json continua possível e é assunto do DEBT-132 (tornar visível).
- Sai: O evidence sobre os três modos de trava, os hooks PreToolUse, o settings.json sem 'hooks' e o validateToolAccess sem chamada, junto com as duas linhas de reproduction correspondentes.
- Vai para: Nada. O próprio context de 08/10 já registrou que hooks não resolvem: pela decisão do DEBT-132, o sistema torna a adulteração visível, mas não impede quem tem acesso ao disco. O validateToolAccess sem chamada não promete nada a ninguém. A fronteira de papel é imposta pelo harness via frontmatter, como o próprio evidence diz, e nenhum agente, skill ou manifest cita essa função.
- Sessão: 5 (item 9)
- Por quê: O defeito foi confirmado em 04/10 e continua no código. O que sai é a proposta de hooks, que o próprio achado já tinha descartado, e uma nota sobre código morto que não engana ninguém.

**DEBT-021** (ABERTO, SERIO, destino FASE_1) — A regra de saturação (get_screening_report) é cega: nenhuma tool grava screening_decision no banco

- Classe: DEFEITO · confiança: alta
- Mentira de hoje: A skill screening-rules manda chamar get_screening_report depois de cada lote de screen_candidates e decidir quando parar pelo saturationAlert (SKILL.md:53-54; a description, na linha 3, anuncia 'regra de saturação'). O relatório lê screening_decision do banco, e nenhuma tool grava esse campo: conferi hoje que updateScreening (database.ts:327) continua sem nenhum chamador. O relatório devolve sempre 'nada triado' e alerta false. É uma salvaguarda citada que nunca dispara.
- Fica: Ficam o summary, a evidence, a reproduction, o 'POR QUE IMPORTA' e a 'NOTA DE ORDEM' (relatar sobre um universo vazio é pior que não relatar). A frase de 08/10 ('deve ser chamado quando for adequado') fica só como origem.
- Sai: No context, o bloco de 08/10 que vai de 'APURADO O QUE E ADEQUADO' até 'REUSAR, nao reescrever' (QUANDO E ADEQUADO CHAMAR / QUANDO NAO E / CONSERTO: chamar dbService.updateScreening com o projectId do screen_candidates). A premissa caiu por dois motivos. Primeiro, o screen_candidates não tem projectId, só projectPath opcional (conferi hoje; a reclassificação de 18/10 já tinha apontado que o index.ts:587-588 não existe mais). Segundo, o Vicente escolheu outro caminho em 29/10 (pergunta 6: a saturação lê a triagem gravada em disco).
- Vai para: Nada, porque o conserto ficou obsoleto. No lugar entra uma linha que remete à decisão de 29/10 (pergunta 6), que é o conserto a fazer.
- Sessão: 4 (Busca e triagem, item 6)
- Por quê: O defeito está vivo e o conserto já foi decidido. O único acréscimo é um conserto de 08/10 que aponta para um caminho que não existe e contradiz a decisão de 29/10. Se ficar no achado, pode levar a sessão 4 a gastar tokens tentando ligar o updateScreening sem projectId.

**DEBT-026** (ABERTO, SERIO, destino METODOLOGIA_NOVA) — Nenhuma exclusão recebe motivo padronizado: EX-01..EX-11 não existem no código

- Classe: MISTO · confiança: media
- Mentira de hoje: O sistema declara atendida a exclusão por motivo padronizado em quatro lugares. (1) O prisma-sr/spec.md:206 e :216 marca F4.1.4 e F4.2.4 ('por motivo padronizado — tabela de frequências') como atendidos para o item 16. (2) Os dois subitens estão no covered_by do prisma-2020.json (:169, :173) e do prisma-scr.json do escopo (:180, :184). (3) A skill screening-rules diz que 'toda exclusão recebe um motivo padronizado' (linhas 3, 13 e 50). (4) A mensagem do screen_candidates pede ao pesquisador que exclua 'com motivo EX-01..EX-11' (index.ts:796). Mesmo assim, nenhum código grava ou agrega código EX: a triagem guarda só o reasoning em texto livre do LLM.
- Fica: Fica a mentira: F4.1.4 e F4.2.4 dados como atendidos no spec e no covered_by do item 16 nos dois métodos, a frase da skill e a mensagem do index.ts:796. O conserto é declarar [NÃO COBERTO] por método (o DEBT-142 tornou isso possível) e corrigir o texto, listando o efeito no check_standard_coverage como deliberado.
- Sai: A exigência implícita no summary ('EX-01..EX-11 não existem no código') de construir a gravação e a agregação dos códigos EX na saída da triagem.
- Vai para: Plano, como funcionalidade na fila de extensão. É o que a reclassificação de 18/10 já propunha: 'gravar o código EX na saída da triagem fica na fila, como extensão'. Se o Vicente quiser construir já, isso volta como decisão dele, não como achado.
- Sessão: Nenhuma das sessões 1–6 o nomeia (fica no 7+, bloco das declarações). Ele mexe no covered_by do prisma-scr, que a 2c e a 2d também tocam; o acompanhamento decide se entra numa delas.
- Por quê: Está redigido como ausência, mas há mentira hoje: a cobertura é declarada e o sistema pede um código que não tem onde ser gravado. A mentira se conserta declarando. Construir os códigos é funcionalidade, e pelo §9 isso não é achado.

**DEBT-077** (ABERTO, MENOR, destino DIAGNOSTICO) — heal_repositories só olha os repositórios já marcados como quebrados: nunca detecta regressão de um endpoint saudável

- Classe: MISTO · confiança: alta
- Mentira de hoje: repository_healer.ts:18-20: quando nenhum repositório está marcado como quebrado, a tool devolve '✅ Diagnóstico: Todos os repositórios OAI-PMH no catálogo estão ativos e operantes' sem fazer um único pedido de rede. Afirma uma saúde que não mediu.
- Fica: A frase de diagnóstico. O conserto é de texto: dizer que só os repositórios marcados como inativos foram examinados e que os marcados como ativos não foram testados.
- Sai: Revalidar os endpoints marcados como saudáveis (detectar regressão) e o backup/dry-run na gravação do catálogo (:87). O próprio achado diz que essa capacidade nunca foi prometida. A nota de que a varredura A1 das 16 tools de busca não rodou é lacuna de auditoria, não deste achado.
- Vai para: Plano (funcionalidade). A varredura A1 vai ao plano de auditoria.
- Sessão: Nenhuma marcada; cabe na 4 (busca).
- Por quê: Conferido no código: a frase sai antes de qualquer fetch. O próprio achado separa a mentira (a frase) da ausência (a revalidação).

**DEBT-102** (EM_CURSO, SERIO, destino FASE_1) — PDF digitalizado produz texto VAZIO e nada percebe: nao ha OCR, nao ha deteccao de rotacao, nao ha guarda de qualidade

- Classe: MISTO · confiança: alta
- Mentira de hoje: Nenhuma. A falha calada (PDF digitalizado gravado como texto vazio e depois lido como 'não trata do tema') foi resolvida em 08/10: PdfExtractorService.avaliarExtracao (pdf_extractor.ts:168, chamada em :209) recusa a extração e diz isso, com testes em tests/pdf_guarda_qualidade.test.ts.
- Fica: Nada aberto. O defeito resolvido pela guarda fecha como RESOLVIDO, com o OCR transferido ao plano. Não deve ser RECUSADO, porque a falha calada era real.
- Sai: O OCR (portar controle_ocr.py, com a dependência do tesseract), que é o único motivo de o achado seguir EM_CURSO. O próprio achado diz que 'o sistema nunca prometeu OCR'.
- Vai para: Plano (funcionalidade; a PROPOSTA_modulo_fontes_primarias.md já o previa).
- Sessão: Nenhuma.
- Por quê: O defeito foi consertado; a parte que segue aberta é ausência pura.

**DEBT-112** (ABERTO, SERIO, destino FASE_1) — A segunda corrida de triagem sobrescreve a primeira SEM REGISTRO do que foi escolhido e contra o que — sobrescrever e legitimo apos analise do pesquisador; apagar em…

- Classe: MISTO · confiança: media
- Mentira de hoje: É falha calada que contradiz uma decisão gravada. O writeScreening (project_artifacts.ts) grava em nomes fixos (included_ta e excluded_ta, included e excluded_fulltext). A segunda corrida apaga a primeira sem registrar o que havia, o que passa a haver e quem autorizou: conferi hoje que o arquivo não tem nenhum registro de substituição. A decisão do Vicente de 08/10 foi que a triagem pode sobrescrever, mas nunca sem esse registro.
- Fica: Ficam o summary, os itens (1) e (2) da evidence (o banco também guarda uma decisão por registro, então a anterior some ali também), as partes 1 e 2 da reproduction e o REENQUADRAMENTO de 08/10 com o conserto: registrar a substituição antes de sobrescrever, usando o logDecision que já existe.
- Sai: Saem três coisas. (a) Os itens (3) e (4) da evidence ('zero código de resolução de conflito / dois triadores' e 'o kappa compara duas execuções da mesma LLM') e a parte 3 da reproduction (compararCorridas). São do enquadramento original, que o próprio context de 08/10 descartou ao dizer que a infraestrutura de duas corridas simultâneas deixou de ser pré-requisito. (b) Os parágrafos 'CONSEQUÊNCIA PARA O DEBT-101' e 'CONSEQUÊNCIA PARA O DEBT-114'. (c) O depende_de DEBT-111, que já foi resolvido.
- Vai para: O item (4), a parte 3 da reproduction e a consequência do kappa vão para o DEBT-101 (EM_CURSO), que é o assunto dele. A consequência do item 8 vai para o DEBT-114, que a reclassificação de 18/10 propôs fechar porque o item 8 é uma declaração no protocolo (F4.1.2). O item (3) e o depende_de não vão a lugar nenhum: o primeiro foi descartado pela decisão de 08/10, o segundo está resolvido.
- Sessão: Nenhuma das sessões 1–6 o nomeia (fica no 7+, consertos). Cabe na 4 (triagem) se o acompanhamento juntar.
- Por quê: O núcleo é defeito com prova e contraria uma decisão do Vicente. Os acréscimos descrevem uma infraestrutura que a própria decisão descartou, mais notas que pertencem a outros achados. Se ficarem, podem levar uma sessão a construir resolução de conflito entre dois triadores, que ninguém pediu.

**DEBT-135** (ABERTO, SERIO, destino FASE_1) — O sistema declara registro de protocolo (PROSPERO) como OBRIGATORIO antes da busca — exigencia que nenhuma norma assimilada faz e que o administrador decidiu que nao e…

- Classe: MISTO · confiança: alta
- Mentira de hoje: index.ts:517 mostra ao pesquisador 'Registro: OBRIGATÓRIO (PROSPERO…)', com sinal de alerta, e :559 manda o coordenador comunicar 'OBRIGATÓRIO antes da busca'. project_init.ts:291 grava registrationAdvice 'Required', e o template (:401-403) escreve 'Pendente de registro no PROSPERO'. Isso vale para todo systematic_review, de qualquer domínio. Nenhuma norma assimilada exige registro: o item 24a do PRISMA 2020 pede informar o registro ou declarar que não houve. E o Vicente decidiu em 08/10 que registro não é pré-condição.
- Fica: A exigência falsa em index.ts:517 e :559 e em project_init.ts:291 e :401-403, inclusive o PROSPERO imposto a todo domínio. Conserto (proposta de 18/10, na forma a confirmar pelo Vicente): tirar o OBRIGATÓRIO e pôr no protocolo um campo de declaração ('registrado em X sob nº Y' ou 'não registrado'), sem que nenhuma das duas respostas reprove. Fazer junto com o DEBT-136, que mexe nas mesmas tabelas de tipo.
- Sai: (1) O bloco 'ATENÇÃO À LACUNA DE DADO' (item 24 do prisma-2020.json sem texto e 21 subitens sem covered_by). (2) A citação por extenso da decisão de 08/10. (3) O trecho 'A ORIGEM DA REGRA ERA ESSA… RAISE 3'. (4) A linha 'Relacionado: DEBT-134… DEBT-121'.
- Vai para: (1) Vai ao DEBT-014, que trata os 21 subitens. Conferir a redação do campo novo contra o 24a é um passo do conserto, não uma dependência, porque o catálogo já traz os itens 24a a 24c. (2) Vai ao registro de decisões, em forma precisa; no achado fica só o ponteiro, como prova da contradição. (3) Vai aos fundamentos, na descrição do método do ReviewBR (sessão M): a credibilidade vem de declarar o uso de IA. (4) Nada: o DEBT-121 está resolvido e o DEBT-134 foi recusado.
- Sessão: 6, com o DEBT-136. Hoje está fora da tabela do plano.
- Por quê: O sistema exige do pesquisador algo que a norma não pede e que o administrador recusou. O resto do texto é decisão, argumento e lacuna que pertence a outro achado.

**DEBT-137** (ABERTO, SERIO, destino AGENTE_SKILL) — Papel e procedimento estao amarrados ao PRISMA por prosa: 3 skills de nome generico carregam conteudo de um metodo so, os 6 agentes se definem por fase F0-F8, e o…

- Classe: MISTO · confiança: media
- Mentira de hoje: É pequena e de texto. Duas skills de nome genérico se anunciam como servindo qualquer método: a conduct-review ('revisão sistemática, de escopo ou outro método') e a methodology-router ('revisão sistemática, de escopo, narrativa, etc.', 'Garante agnosticismo metodológico'). O procedimento delas, e o da synthesis-manuscript, é a trilha F0–F8 do prisma-sr: há a tabela F0–F8 da conduct-review, e a synthesis-manuscript pede o manuscrito em F8.3.1–F8.3.27 e o prisma_checklist_filled.md. Não há método narrativo implementado. O resto do achado não mente hoje: a própria methodology-router, na linha 19, já declara que 'os agentes ainda se descrevem pelas fases F0–F8'.
- Fica: Fica o defeito de honestidade do item (1): a descrição de skill de nome genérico promete servir qualquer método, mas o conteúdo é a trilha do prisma-sr. O conserto é de texto (a descrição passa a dizer o que cobre hoje), barato e independente da sessão 6.
- Sai: Saem quatro partes. (a) A DECISÃO DO ADMINISTRADOR de 08/10 ('agente não se multiplica por método; skill sim'), com a RAZÃO REGISTRADA e a ARRUMAÇÃO PROPOSTA em três camadas (papel, trilha e procedimento). (b) O item (3): o manifest não tem campo de skill. (c) O item (2): os agentes são descritos por fase. (d) A frase 'DEPENDE da decisão pendente ... (DEBT-130)'.
- Vai para: (a) Vai aos fundamentos: registro de decisões e descrição do método do ReviewBR (sessão M), em forma precisa. (b) e (c) vão ao plano da sessão 6, cuja saída verificável já é 'agentes descritos por papel; cada etapa do manifest diz que skill a executa'. A linha da sessão 6 passa a citar a direção de 29/10 e a decisão de 08/10 em vez do achado. (d) Não vai a lugar nenhum: o DEBT-130 foi resolvido em 29/10 (a trilha F0–F8 é do prisma-sr).
- Sessão: 6, e a M, que recebe a decisão de 08/10.
- Por quê: É o caso típico do pedido. O grosso do achado é a arquitetura que a sessão 6 vai construir, e pelo §9 isso é escopo, não achado. Há também uma decisão que pertence aos fundamentos. Só a promessa das descrições mente hoje.

**DEBT-138** (ABERTO, BLOQUEIA, destino FASE_1) — Dos 4 gates que o manifest declara, DOIS nao travam: compute_flow_counts so avisa e sobrescreve, e audit_methodology se declara 'apenas diagnostica' — o manifest mente…

- Classe: MISTO · confiança: alta
- Mentira de hoje: Nos DOIS manifests (o achado cita só o do prisma-sr), o campo blocks diz que o compute_flow_counts barra a contagem manual e que o audit_methodology barra a síntese. O código só devolve manualEditWarnings e sobrescreve o arquivo (flow_computer.ts:120-134), e o audit_methodology se descreve como 'Apenas diagnostica' (index.ts:2303). A skill repete a promessa do RV-02 (prisma-rigor-gates:15).
- Fica: Os 2 dos 4 gates que não fazem o que o blocks promete, nos dois manifests e na linha :15 da skill. O conserto foi decidido em 29/10 (pergunta 3, SIM): o export recalcula o funil e bloqueia divergência, e o RV-02 passa a travar de fato. O RV-08 passa a apontar o export_dataset, que barra o export; a síntese não é barrada. O conserto leva também a frase do DEBT-070.
- Sai: (1) O parágrafo 'DE BRINDE' (ProtocolGuard sem chamada) e o passo 4 da reproduction. (2) No parágrafo 'ATINGE DIRETAMENTE A CONDIÇÃO…', a frase 'Qualquer critério de aceitação de método assimilado tem de conferir o campo blocks contra o código, senão herda a mentira'.
- Vai para: (1) Vai ao DEBT-042, que é esse defeito. (2) Vai aos fundamentos, como critério do procedimento de assimilação (RV-11 e validate_methodology): conferir cada blocks contra o ponto do código que o executa. É regra de procedimento, não achado.
- Sessão: 3 (item 3)
- Por quê: A mentira está viva no dado que declara o método. O que sai é duplicata de outro achado e um critério de procedimento.

**DEBT-139** (ABERTO, BLOQUEIA, destino FASE_1) — O log de busca do PRISMA-S some em silencio com projectPath absoluto (path.join sobre cwd) e, mesmo quando grava, escreve um arquivo que nao e o que o metodo exige e que…

- Classe: MISTO · confiança: alta
- Mentira de hoje: A parte (1) está viva. index.ts:107 (logToLocalProject) e :2344 (relatório do audit_methodology) montam o caminho com path.join(process.cwd(), projectPath, ...). Com caminho absoluto, o log de busca e o relatório somem e o catch engole o erro, enquanto a tool responde sucesso. O resolveProjectDir (project_artifacts.ts) já trata o caso e já está importado no index.ts.
- Fica: A parte (1), nos dois call sites, com teste de caminho absoluto. Recebe o DEBT-085.
- Sai: Saem: as partes (2) (o arquivo que o código grava não é o que o método exige) e (3) (search_history sem leitor); a 'ORDEM', que trata as duas como decisão pendente; e os parágrafos 'CONSEQUÊNCIA PARA A NORMA' e 'PESO METODOLÓGICO'.
- Vai para: As partes (2) e (3) vão para o DEBT-056 (mesmo defeito; decidido em 29/10: o código grava o log PRISMA-S). Os parágrafos de consequência saem sem destino: o 'verde 16/16' do PRISMA-S era o DEBT-140, resolvido, e o poder da conferência no PRISMA-S é o DEBT-149, da 2c.
- Sessão: 4
- Por quê: O núcleo é falha calada real, conserto de uma linha em dois lugares. O resto duplica o DEBT-056 ou cita estado já superado, e manter tudo junto faria a sessão 4 tratar a mesma coisa duas vezes.

**DEBT-149** (ABERTO, SERIO, destino FASE_1) — O falsificador do mapeamento (check_standard_coverage, conferência b) não tem poder no PRISMA-S: com os títulos oficiais, não acusa os deslocamentos conhecidos de S11 e…

- Classe: MISTO · confiança: alta
- Mentira de hoje: standard_coverage.ts:217 deriva com_poder só de titulos_oficiais. Por isso o relatório diz com_poder: true no PRISMA-S, onde a conferência pegou 2 de 58 erros conhecidos (cerca de 3%). Um suspeito da conferência por palavras torna valid false (:221): o PRISMA-ScR sai valid: false por 4 falsos positivos, o que impede declarar o checklist completo na F8 (prisma-rigor-gates:60) nos dois projetos de escopo. E, sem poder, itens_por_etapa fica vazio (:250), o que corta o porquê de cada etapa (conduct-review:61).
- Fica: A mentira e o conserto da decisão B1(a). Suspeito não reprova. O relatório diz o que a conferência é e quanto enxerga, com a medida do preparo da 2c e a fonte: 3,4% no PRISMA-S, 13,1% no ScR e 14,4% no PRISMA-P; 2 de 58 e 15 de 23 nos erros reais. O porquê de cada etapa deixa de depender dela. As medidas do preparo ficam como evidência.
- Sai: Da decisão de 05/11 saem os pontos (b) e (c), a leitura documentada (trecho literal por ponteiro, conferidor testado com resposta conhecida, segunda leitura independente, divergências ao Vicente), e o ponto (2) de 30/10 (suspeito examinado registrado na assimilação). Eles são o procedimento de assimilação, não o conserto da mentira. Saem também o ponto (3) (trava só por item esquecido), o 'a do PRISMA-ScR fica para a 2d, sobre a trilha própria do escopo' (adiamento ligado à assimilação) e as notas de reagendamento.
- Vai para: A leitura documentada vai aos fundamentos (B2 no registro de decisões; procedimento de assimilação no maintainer.md e na RV-11) e ao plano: construir no schema o campo do trecho e o conferidor, e aplicá-los a cada norma ao assimilar ou reassimilar. O PRISMA-S do prisma-sr fica na 2c, se o Vicente mantiver o B2 lá. O ponto (3) vai ao D15, com o DEBT-145. O PRISMA-ScR vai ao plano, junto da assimilação do método de escopo.
- Sessão: 2c: o achado fecha com o B1(a). A leitura documentada continua no plano, como o Vicente decidiu, mas como procedimento e não como critério de fechamento; pode ficar numa janela própria.
- Por quê: O núcleo é mentira: o relatório afirma um poder que não tem e trava por falso positivo. A leitura documentada é o modo de assimilar com rigor, que o Vicente quer em toda assimilação. Por isso é fundamento e procedimento, não dívida.

**DEBT-151** (ABERTO, MENOR, destino FASE_1) — O método de escopo herda do prisma-sr, por extends, o que é próprio da revisão sistemática: os mesmos subitens têm o sentido do PICOS na trilha e o do PCC no template…

- Classe: MISTO · confiança: alta
- Mentira de hoje: A trilha do escopo (a spec do prisma-sr, lida por extends) e o template do escopo dão sentidos diferentes aos mesmos ids. Na spec: 'Intervenção / Objeto' e 'Desfechos mínimos — ao menos um desfecho que o estudo deve reportar' (spec.md:92-93), com o motivo de exclusão EX-03 'Desfecho não reportado' ligado a F1.3.1.3 (spec.md:227), e 'Relevância para política ou prática' (spec.md:56). No template: 'Conceito', 'Contexto' (protocol_template.md:53-54) e 'Objetivo do mapeamento' (:29). O Contexto do PCC não tem subitem. Além disso, a F7.3 herdada (certeza da evidência, F7.3.1–4 obrigatórios, spec.md:348-351) vale no escopo, porque a F7 está ativa no manifest do escopo, embora o PRISMA-ScR não tenha item de certeza. E ela cita a condição abordagem_certeza (spec.md:344), que o manifest do escopo não declara (ele só declara avaliacao_critica).
- Fica: O conflito de hoje: ids com dois sentidos, Contexto sem subitem, EX-03 aplicável ao escopo e F7.3 obrigatória no escopo, citando uma condição que o método não declara. O conserto pode ser de texto e manifest na camada do escopo (rótulos e critérios do PCC, EX-03 fora, F7.3 fora) ou a assimilação do jbi-scoping-review, o que vier primeiro; a assimilação fecha o achado de carona.
- Sai: (1) A DECISÃO D14 (o escopo não é um delta da sistemática; cada metodologia de escopo validada pode ser método próprio; o PRISMA-ScR é a norma de relato). (2) A CONSEQUÊNCIA: a 2d 'assimilar a primeira metodologia de revisão de escopo, com transcrição precisa e descrição', e a leitura documentada do PRISMA-ScR sobre a trilha nova. (3) O 'caminho de migração dos dois projetos de escopo'. (4) 'A 2d decide onde registrar a avaliação crítica com sim'; hoje isso está declarado [NÃO COBERTO], com motivo, e não mente. (5) 'A 2d decide se a F7.3 vale no escopo': não é decisão, porque a fonte responde (o PRISMA-ScR não tem item de certeza), e o fato passa para o que fica. (6) O depende_de DEBT-142, já resolvido no núcleo.
- Vai para: (1) Fundamentos: registro de decisões e descrição do método (M). (2) Catálogo: o jbi-scoping-review já traz o capítulo 10 do JBI Manual 2024 (PCC; os 9 passos de Peters, sobre Arksey e O'Malley e Levac; o PRISMA-ScR como norma). A assimilação segue o procedimento quando o Vicente decidir, no plano; outra metodologia de escopo validada entra no catálogo do mesmo modo. (3) Adiamento: vai ao plano, junto da assimilação. (4) A resposta vem da fonte do método assimilado.
- Sessão: 2d: deixa de ser 'assimilar para consertar o achado'. A assimilação é trabalho de catálogo quando o Vicente decidir, e o conserto de texto não depende dela.
- Por quê: O Vicente está certo sobre o acréscimo: a metodologia é conhecida e está no catálogo. Mas não está certo se o achado inteiro cair: o rótulo e a F7.3 mentem hoje e podem afetar a triagem. O 'a 2d decide' empurrava esse defeito para dentro da assimilação.


### Ficam como estão (MANTER) — 17

**DEBT-014** (ABERTO, BLOQUEIA, destino CONFORM_EXTERNA) — A trilha do ReviewBR nunca foi mapeada contra os SUBITENS do PRISMA — 21 linhas de checklist sem cobertura

- Classe: DEFEITO · confiança: media
- Mentira de hoje: No relatório, nenhuma: check_standard_coverage reprova com os 21 órfãos, e o mapeamento declara 'remapear ... é trabalho pendente'. O defeito está na exigência. prisma-rigor-gates/SKILL.md:51 diz que órfão 'impede a finalização', e os 21 órfãos são lacuna do mapeamento do próprio sistema (39 referências estacionadas nos cabeçalhos, DEBT-054), não da revisão. Toda revisão prisma-sr para na F8 por algo que o pesquisador não tem como sanar e que a norma não pede a ele.
- Por quê: Não é ausência de metodologia: o PRISMA 2020 está instalado e o prisma-sr o declara. O que falta é completar a transcrição dele, e essa falta trava a F8 hoje. Fica pelo critério de prejuízo e pela regra 'na dúvida, MANTER'. Com o DEBT-045 forma UMA tarefa só (retranscrever o PRISMA 2020 no prisma-sr pela leitura documentada), não duas.
- Sessão: 7+, junto do DEBT-045. É pré-requisito do DEBT-145; a 2c não mexe nele (armadilha 6).

**DEBT-025** (ABERTO, SERIO, destino METODOLOGIA_NOVA) — Deduplicação implementa 2 dos 4 níveis prometidos e falha em DOI com prefixo, em acento e em registro sem DOI

- Classe: DEFEITO · confiança: alta
- Mentira de hoje: A skill screening-rules (SKILL.md:9) promete 4 níveis de deduplicação: DOI/Handle, título normalizado, título+ano+1º autor e similaridade de 90% ou mais com o mesmo ano. O dedupe.ts faz só dois. O primeiro é o DOI com toLowerCase().trim(), sem tirar o prefixo https://doi.org/ (linha 54). O segundo é título+ano, que apaga os acentos em vez de transliterar (linha 59). Além disso, o ramo do DOI impede que um registro com DOI seja comparado com um sem DOI. Conferi hoje. O duplicates_removed do funil sai daqui.
- Por quê: A skill promete o que o código não cumpre, e o bug muda um número publicado. Não há metodologia a assimilar: o destino METODOLOGIA_NOVA é rótulo errado (já apontado em 18/10), e o achado é conserto.
- Sessão: 4 (Busca e triagem, item 7)

**DEBT-030** (ABERTO, SERIO, destino METODOLOGIA_NOVA) — Quatro tools do lote não deixam nenhum rastro de auditoria — nem banco, nem disco

- Classe: DEFEITO · confiança: alta
- Mentira de hoje: É falha calada. As tools batch_keyword_screen, batch_llm_extract, batch_db_screen e translate_document não chamam logAuditEvent nem logToLocalProject: conferi hoje que não há nenhuma chamada nos quatro handlers (index.ts:2446-2540). Elas devolvem só o summary. Duas decidem por LLM: o batch_llm_extract, que é a rota F5 do extractor, e o batch_db_screen no ramo useLlm. Isso contraria a decisão gravada de que a triagem por IA tem de ser auditável (DEBT-101) e contraria o que as tools vizinhas fazem.
- Por quê: É defeito de execução vivo, sem nada de metodologia. O destino METODOLOGIA_NOVA é rótulo errado.
- Sessão: Nenhuma das sessões 1–6 o nomeia (fica no 7+, consertos). Cabe na 4 se o acompanhamento juntar com a triagem.

**DEBT-031** (ABERTO, MENOR, destino AGENTE_SKILL) — rag_query não devolve página, mas a skill de leitura exige citação [study_id, p.X]

- Classe: DEFEITO · confiança: alta
- Mentira de hoje: A skill evidence-reading exige que cada afirmação tenha citação [study_id, p.X] (SKILL.md:14 e :28). O rag_query não tem campo de página, e o chunking não marca página: conferi hoje que não há nenhuma ocorrência de page ou página em rag_lexical.ts. O sistema exige do agente um dado que nada fornece.
- Por quê: O sistema exige algo que nenhum insumo sustenta. Isso é defeito pela própria definição, e o conserto já está decidido.
- Sessão: 5 (Leitura e governança, item 8)

**DEBT-042** (ABERTO, SERIO, destino METODOLOGIA_NOVA) — ProtocolGuard e codigo morto integral: protocol.md e sobrescrito direto por fs.writeFileSync

- Classe: DEFEITO · confiança: alta
- Mentira de hoje: project_init.ts:207-208 avisa que projeto travado 'não pode ser re-inicializado'. Mas a guarda olha o status da linha que o plan_research_protocol acabou de criar no SQLite, e o register não confere se o caminho já é usado (index.ts:1561-1562). Assim, replanejar no caminho de um projeto travado passa pela guarda. O protocol.md é reescrito (:270-271) e o project_state.json é regravado como DRAFT, com a lista de decisões vazia (:276; project_state.ts:80-111). O ProtocolGuard, que declara esses arquivos como críticos, não é chamado em lugar nenhum.
- Por quê: Conferido hoje no código. Coincide com a leitura independente de 18/10: 'planejar de novo no caminho de um projeto existente zera o protocolo travado e as decisões'. O sistema promete uma proteção que o caminho real não aciona.
- Sessão: 5, junto do DEBT-018 e do DEBT-133, por ser a mesma trava. Hoje está fora da tabela do plano.

**DEBT-045** (ABERTO, BLOQUEIA, destino CONFORM_EXTERNA) — O mapeamento da trilha para o PRISMA 2020 está deslocado em 6 itens; a verificação de cobertura reporta 5 deles como VERDES

- Classe: DEFEITO · confiança: alta
- Mentira de hoje: O 'verde' do summary não aparece mais: os itens 14, 15, 25, 26 e 27 estão declarados [NÃO COBERTO] 'deslocado' no mapeamento do prisma-sr, com este achado como âncora, e a tool não os conta (standards.ts:209). Ainda mente a spec que o analyst lê para escrever a F8: spec.md:406-407 (certeza no Item 14, registro no Item 15), :416-419 (financiamento no 24 até informações adicionais no 27) e F8.4.1-3 no Item 26. E os ponteiros continuam trocados no mapeamento.
- Por quê: É o exemplo literal do §9 ('cobertura reportada verde sobre mapeamento errado'), contido pela declaração mas não consertado; as declarações 'deslocado' só saem quando ele for resolvido. Não é assimilar metodologia: é corrigir a transcrição de uma norma já instalada.
- Sessão: 7+ (o plano diz 'DEBT-045, sessões 7+'), depois da leitura documentada da 2c. É pré-requisito do DEBT-145.

**DEBT-056** (ABERTO, BLOQUEIA, destino CONFORM_EXTERNA) — O log PRISMA-S obrigatório não tem produtor nem verificador — e o log que a máquina escreve é ignorado por todo o sistema

- Classe: DEFEITO · confiança: alta
- Mentira de hoje: prisma-s-logging/SKILL.md:8-10 chama o CSV de 'Log obrigatório' e diz que 'sem registro, a busca não aconteceu'. conduct-review/SKILL.md:83 usa o CSV como retorno da F2, e librarian.md:19 manda o agente digitá-lo. Nenhum código produz o CSV nem o compara com o que foi executado (grep 'search_log_prisma_s' em src = 0): é a autocertificação que a prisma-rigor-gates proíbe. O log que a máquina grava (search_history.json, index.ts:109) não tem leitor.
- Por quê: O sistema apresenta como trilha auditável um arquivo autodeclarado. A correção está decidida e tem sessão; não há acréscimo a tirar.
- Sessão: 4

**DEBT-058** (ABERTO, SERIO, destino METODOLOGIA_NOVA) — Snowballing "para trás" (referências) é código morto: a tool anuncia "Citações e Referências" e nunca busca uma única referência

- Classe: DEFEITO · confiança: alta
- Mentira de hoje: A descrição da tool já foi corrigida ('Citações via OpenAlex', index.ts:850). Mas librarian.md:24-25 ainda diz 'Puxar referências...' e 'puxe referências apenas das sementes', a saída da tool não declara a direção, e snowball.ts:70 confirma que o ramo de referências (para trás) não existe.
- Por quê: A mentira mudou de lugar (da tool para o agente), mas continua. O rótulo METODOLOGIA_NOVA é o que convidaria a abrir 'assimilação' onde o conserto é uma frase e um campo de saída.
- Sessão: Nenhuma explícita. Cabe na 4 (busca), junto do DEBT-087 (mesma tool); senão, 7+.

**DEBT-060** (ABERTO, BLOQUEIA, destino METODOLOGIA_NOVA) — Sete de oito agentes proíbem "gerar scripts" em prosa e recebem Bash + Write no frontmatter; o mapa de governança não cobre tool nativa

- Classe: DEFEITO · confiança: alta
- Mentira de hoje: Sete agentes dizem 'Não gere scripts', e três (reader, screener e extractor) proíbem busca externa, tudo em prosa. Os oito frontmatters, porém, concedem Bash, Write, WebSearch e WebFetch (conferido hoje). O governance.test.ts filtra só as tools mcp__reviewbr__ (linha 32), então nenhuma tool nativa é conferida. A trava declarada depende só de convencer o agente.
- Por quê: Foi mantido e elevado a BLOQUEIA pela contestação adversarial de 04/10, e nada mudou desde então. O destino METODOLOGIA_NOVA está errado e faz o achado parecer escopo.
- Sessão: Nenhuma das sessões 1–6 o nomeia. É da família do DEBT-018 (sessão 5, governança), onde caberia.

**DEBT-062** (ABERTO, SERIO, destino METODOLOGIA_NOVA) — O consentimento humano do Sci-Hub/BYOS existe só como frase na descrição da tool — nada o exige, registra ou verifica

- Classe: DEFEITO · confiança: media
- Mentira de hoje: A descrição do retrieve_fulltext_byos diz 'BYOS (opt-in) ... SÓ chame após sim EXPLÍCITO do pesquisador — NUNCA automático' (index.ts:1792), e o librarian.md repete a regra. O schema tem só doi e projectPath: nada exige nem registra o consentimento. O log grava acquisition:'BYOS' sem campo de consentimento (conferido hoje).
- Por quê: É uma trava que depende de convencer o agente, sobre uma decisão que é do pesquisador. É a mesma família que a contestação de 04/10 confirmou como real no DEBT-018 e no DEBT-060. O conserto é pequeno: um parâmetro de consentimento gravado no log.
- Sessão: Nenhuma das sessões 1–6 o nomeia (fica no 7+, consertos). É da família do DEBT-018 e do DEBT-060 (sessão 5).

**DEBT-066** (ABERTO, SERIO, destino CONFORM_EXTERNA) — As Camadas 2 e 3 da skill de gates prometem verificação de completude que não existe em nenhum lugar

- Classe: DEFEITO · confiança: alta
- Mentira de hoje: Três frases da SKILL.md da prisma-rigor-gates. (a) Em :24, 'O gate de cada fase confere que todos os subitens marcados obrigatórios estão preenchidos ou explicitamente [TBD]': não existe gate de completude de subitem para fase nenhuma, e os gates do manifest são os 4 de RV. (b) Em :8, 'cada gate é uma verificação determinística… três camadas, todas obrigatórias'. (c) Em :3, 'Verifica… os checklists PRISMA 2020 e PRISMA-S… nenhum item obrigatório em falta', quando o check_standard_coverage confere a trilha do método, e não o que o projeto preencheu.
- Por quê: A promessa está ativa no texto que governa o orquestrador e o achado não traz acréscimo de agenda. Só a evidência da Camada 3 precisa ser atualizada.
- Sessão: 3, como proposta, na mesma passada dos DEBT-002, 003 e 138. Hoje está na 7+.

**DEBT-071** (ABERTO, SERIO, destino METODOLOGIA_NOVA) — compute_flow_counts: a validação RV-05 que ele roda é tautológica, e ele grava o prisma_flow.json mesmo com a checagem cruzada reprovada

- Classe: DEFEITO · confiança: alta
- Mentira de hoje: O compute_flow_counts devolve 'validation (RV-05): valid: true', e essa validação é circular: os números saem das mesmas identidades que depois são conferidas (flow_computer.ts:88-105 e :136, segundo o achado). A única checagem independente é o includedCrossCheck, que compara o included do funil com o tamanho do included.json. Ela não entra no valid nem impede a gravação (index.ts:1726-1727, conferido hoje). Medido: funil com 5 e included.json com 999 dá valid:true.
- Por quê: É 'sucesso que não executa' e 'número que não se sustenta', o centro da definição de defeito. Não há nada a tirar.
- Sessão: 3 (Funil e gates)

**DEBT-087** (ABERTO, SERIO, destino METODOLOGIA_NOVA) — expand_search_snowball nao tem projectPath: a fonte 'outros metodos' do PRISMA nunca chega a 01_raw/other_records.json

- Classe: DEFEITO · confiança: alta
- Mentira de hoje: O summary ('não tem projectPath') envelheceu. A tool tem projectPath, e a descrição dele diz 'Sem ele é exploratório e nada persiste (RV-01)', prometendo por implicação que com ele algo persiste. O handler (index.ts:849-883), porém, só devolve JSON: nenhum appendRawRecords 'other'. E flow_computer.ts:73 conta 01_raw/other_records.json como zero.
- Por quê: Sucesso que não executa: a descrição sugere persistência e o funil perde o ramo 'outros métodos'. Conferido no código hoje.
- Sessão: Nenhuma explícita. Cabe na 4, junto do DEBT-058; senão, 7+.

**DEBT-089** (ABERTO, SERIO, destino METODOLOGIA_NOVA) — retrieve_fulltexts reescreve o dataset de entrada a cada lote e pode truncar o corpus

- Classe: DEFEITO · confiança: alta
- Mentira de hoje: É falha calada. O retrieve_fulltexts lê o dataset de entrada e, dentro do laço de lotes de 10, regrava o próprio arquivo só com os registros já processados (index.ts:1228, depois do Promise.all; conferido hoje). Se o processo cair no lote seguinte, os incluídos ainda não processados somem do arquivo, sem cópia nem log.
- Por quê: É perda silenciosa de corpus, sem nada de metodologia. O destino METODOLOGIA_NOVA é rótulo errado.
- Sessão: Nenhuma das sessões 1–6 o nomeia (fica no 7+, consertos). Pelo dano, merece prioridade no acompanhamento.

**DEBT-093** (ABERTO, MENOR, destino FASE_1) — Persistencia em 01_raw condicionada a resolucao de projectId em tres tools de busca

- Classe: DEFEITO · confiança: alta
- Mentira de hoje: Falha calada. Em search_papers_optimized (index.ts:607-609), search_pubmed (:1104) e search_repository (:1320), o appendRawRecords continua dentro do 'if (projectId)'. Um projeto que existe no disco mas não no SQLite recebe os resultados na resposta, e nada vai a 01_raw, sem aviso (o declararModo só avisa o modo exploratório).
- Por quê: Sucesso que não executa, conferido no código de hoje. Nada de metodologia envolvido.
- Sessão: Nenhuma explícita. Cabe na 4 (busca); senão, 7+.

**DEBT-133** (ABERTO, SERIO, destino FASE_1) — submit_protocol_for_approval grava [LOCKED] no protocol.md ANTES de atualizar o project_state: se o estado nao existir, o arquivo fica travado e o estado nao — e as duas…

- Classe: DEFEITO · confiança: media
- Mentira de hoje: O submit_protocol_for_approval grava [LOCKED] no protocol.md (index.ts:1617-1622) antes de chamar o ProjectStateService.patch (:1631), que lança erro quando não há project_state.json. A tool devolve erro depois de já ter travado o arquivo, e o ProtocolGate libera a busca pelo fallback do markdown.
- Por quê: A gravação pela metade é real, conferida no código de hoje, e o achado não traz acréscimo de agenda. Confiança média porque o dano depende de projeto sem estado (os antigos) e encolhe muito com o conserto do DEBT-018.
- Sessão: 5, com o DEBT-018. Hoje está fora da tabela do plano.

**DEBT-141** (ABERTO, SERIO, destino FASE_1) — absorb_methodology com atualizar=true APAGA os campos da entrada que nao foram reenviados: o 'merge' acontece depois de o schema preencher os ausentes com defaults vazios

- Classe: DEFEITO · confiança: alta
- Mentira de hoje: A absorb_methodology com atualizar=true responde ok:true e apaga os campos que não foram reenviados. O CatalogWriter.absorver faz CatalogEntrySchema.safeParse(bruto) (maintenance_writes.ts:158), que preenche os campos ausentes com vazio, e só depois mescla {...cat.entries[i], ...e} (:193). Conferi hoje. O BacklogWriter já mescla antes de validar (:106).
- Por quê: É sucesso que não executa: a tool responde ok:true e apaga dado. O conserto é pequeno e é o mesmo que já foi feito no BacklogWriter.
- Sessão: 5 (Leitura e governança). Se a solução mandar ausências ao catálogo, convém antecipar o conserto, ou criar só entradas novas (atualizar=false) até ele sair.
