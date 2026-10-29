# Decisões do Vicente sobre o sistema ReviewBR: chat × disco

> **NÃO VERIFICADO — insumo para conferência, não registro de decisão.**
> Levantamento automático feito em 02/10/2026, na troca de computador (ver
> `TRANSICAO_PC_2026-10-02.md`). Ele lista decisões do Vicente que estariam só no chat ou
> divergentes do disco. Os verificadores adversariais pararam no limite de sessão, então trate
> cada item como hipótese até conferir na transcrição citada (sessão e linha).
> Os scripts e arquivos de trabalho que o texto diz estarem "nesta pasta" ficaram no
> scratchpad temporário da sessão 00a84351 e não foram preservados. As transcrições citadas
> estão em `~/.claude/projects/C--reviewbr/`.


Levantamento feito em 02/10/2026, só leitura. Todos os horários estão em UTC e vêm do campo `timestamp` dos `.jsonl`.
`Lnnn` é o número da linha no `.jsonl` da sessão (`C:\Users\alqui\.claude\projects\C--reviewbr\<sessão>.jsonl`).
As 11 decisões de 2026-09-27T02:19:38Z (be12a326 L259) ficaram **fora** deste levantamento, porque outro agente cuida delas.

## 1. Método

1. **Prompts humanos.** Para as quatro sessões foram extraídos: (a) as mensagens `user` com texto, inclusive as que começam com `<ide_opened_file>`, que o `sess_summary.pl` filtrava. Essa falha escondia cinco prompts da 27fac9ba (L3, L155, L1054, L1846 e L2384) e um da be12a326 (L35); (b) os anexos `queued_command`, que são mensagens digitadas enquanto o assistente trabalhava: 8 na 27fac9ba, 1 na be12a326 e 1 na 153e5b05; (c) as respostas a `AskUserQuestion`: 10 na 27fac9ba, 1 na 153e5b05 (rejeitada) e 3 na bbfd7ac8.
   Scripts usados: `prompts_all.pl`, `ask2.pl` e `dialog_text.pl`, nesta pasta.
2. **Contexto da resposta.** O diálogo da 27fac9ba foi lido inteiro (texto, sem tools), em `f27.txt`. Da be12a326 foi lido o trecho até 02:19Z (`tbe.txt`). A 153e5b05 foi lida inteira. Da bbfd7ac8 foi lido o trecho de 25/09 00:00Z a 00:52Z, onde estão as diretrizes de sistema (`tbbfd_fim.txt`).
3. **Busca em disco.** O `busca.sh` faz grep (`LC_ALL=C.UTF-8`) em `.claude/maintenance/*.md`, `origem/*.md`, `maintainer.md`, `system-audit/SKILL.md`, `.claude/README.md` e `memory/*.md`. O `debt.pl --grep` procura nos campos summary, context, resolution, evidence, reproduction e location do `system_debt.json`. Em pontos específicos também foram lidos `.gitignore`, `git ls-files`, `git check-ignore` e `git status --porcelain`.
4. **Controles positivos do método.**
   - `'proibido corrigir'` encontra `PASSAGEM.md:123` e `CONTINUAR.md:190` (é o DEBT-049, sabidamente registrado).
   - `'n[uú]mero herdado'` encontra `PASSAGEM.md:35` e `PROTOCOLO_revisao_reviewbr.md:190`. Esse controle valida regex com acento. **A primeira rodada sem `LC_ALL=C.UTF-8` dava zero aqui, e foi descartada.**
   - `debt.pl --grep 'compararCorridas'` encontra DEBT-027, 098, 099 e 101. `'Nao corrigir enquanto'` encontra DEBT-049.
   - Na memória, `'descart[aá]vel'` encontra `manutencao-reviewbr-estado-em-disco.md:11`.
   - Toda ausência abaixo foi obtida com esse mesmo script, na mesma rodada em que os controles acharam algo.
5. **Cruzamento.** Os achados foram conferidos contra a "lente 5 — decisões" da verificação de 26/09 (`27fac9ba-…/subagents/workflows/wf_2c86c0ca-8b8/journal.jsonl` L8, extraída em `lente5_decisoes.json`). As 8 decisões que ela confirmou estão abaixo como REGISTRADO. As divergências que ela apontou e que continuam no disco reaparecem aqui (DEC-17).

**Limitações.** As resoluções dos `DEBT-*` não foram lidas uma a uma, só pelos termos-chave. `DIAGNOSTICO_frente_2.md` e `MANIFESTO_conformidade.md` foram lidos só por grep. Da bbfd7ac8, nada anterior a 25/09 foi lido, porque é pesquisa.

## 2. Contagem

| Classificação | Qtde |
|---|---|
| REGISTRADO_NO_REPO | 37 |
| REGISTRADO_MAS_DIVERGENTE (disco diz outra coisa, ou memória diverge do repositório) | 7 |
| SO_NO_CHAT | 12 (1 é pendência do assistente, não decisão do Vicente; 3 sem efeito: executadas ou superadas) |
| SO_NA_MEMORIA | 2 (uma de sessão anterior às quatro analisadas) |
| **Total** | **58** |

## 3. Lista completa

### 3.1 Sessão 27fac9ba (25–27/09: construção do agente `maintainer`)

| ID | Âncora | Citação literal do Vicente | O que ficou decidido | Registro em disco | Classe |
|---|---|---|---|---|---|
| DEC-01 | 2026-09-25T00:52:29Z L38 (Ask) | "RV-11 e manifesto primeiro (Recomendado)" | RV-11 e manifesto vêm antes de RV-09/RV-10 | `PROTOCOLO_revisao_reviewbr.md:77-78`, `:228` | REGISTRADO |
| DEC-02 | 00:52:29Z L38 (Ask) | "Sim, conferir antes (Recomendado)" | números do briefing conferidos contra o código antes do protocolo | `PROTOCOLO:14-17`, `:190-191`; `PASSAGEM.md:35` | REGISTRADO |
| DEC-03 | 00:58:36Z L110 | "não, vamos seguir." | a resposta foi a "o chat faz só o agente e para?"; ficou decidido seguir as três frentes do briefing | `PROTOCOLO:67-73`, `:85-95` | REGISTRADO |
| DEC-04 | 01:04:54Z L155 | "se o trabalho nao se reduzir a uma pesquisa ou a pesquisas já feitas vamos continuar." | condição de que este chat não vire pesquisa; superada por DEC-17 | `PROTOCOLO:236` ("é pesquisa, o que este chat vinha evitando") | REGISTRADO |
| DEC-05 | 01:14:36Z L353 + 01:17:05Z L359 (Ask) | "se precisa ser corrigido esse é dos papei do agente de manutenção" / "Backlog versionado + gate de dívida (Recomendado)" | backlog estruturado com gate de saída | `PROTOCOLO:157-165`, `:235`, `:247`; `maintainer.md:116-134` | REGISTRADO |
| DEC-06 | 01:17:05Z L359 (Ask) | "deixar na fila e seguir com o trabalho." | o `toolHandlers` (DEBT-001) fica na fila, para o mantenedor corrigir depois | DEBT-001.context: "não corrigido **por decisão do pesquisador: fora do escopo**" | **DIVERGENTE** |
| DEC-07 | 01:17:05Z L359 (Ask) | "o sistema deve ser capaz de abrir novos chats para manutencao do reviewbr sem ter de abrir este chat especifico" | o chat é descartável; o estado vive em disco | `PROTOCOLO:235`; `MANIFESTO_conformidade.md:199-200`; `maintainer.md:89`, `:113-114` | REGISTRADO |
| DEC-07m | (memória gravada às 01:21:52Z) | — | cópia de DEC-07 na memória | `memory/manutencao-reviewbr-estado-em-disco.md:15-18,25` aponta para `reviewbr/docs/modulos/`, que não existe mais | **DIVERGENTE** |
| DEC-08 | 01:23:07Z L476 + 01:27:00Z L495 (Ask) | "`.claude/maintenance/` na raiz (Recomendado)" | estado da manutenção sai de `reviewbr/docs/` (site do prismAId) para `.claude/maintenance/` e `origem/` | só de fato: os arquivos estão lá. Decisão e razão não estão escritas | SO_NO_CHAT |
| DEC-09 | 01:27:00Z L495 (Ask) | "esse nosso sistema nao precisa de instalacao, ele é uma pasta que pode ser aberta em qualquer IA e a partir desta abertura de produto em uma ide ser possivel agir sem quebrar o sistema" | requisito: abrir a pasta e funcionar, sem instalação | só uma menção de passagem em DEBT-006.context. O disco diz o contrário em `.claude/README.md:27-32` (`npm install && npm run build`) e `.gitignore:7` (`dist/`) | **SO_NO_CHAT** |
| DEC-10 | 01:29:41Z L539 (Ask) | "Mover para old/descarte/ (Recomendado)" | lixo da raiz vai para o descarte, de forma reversível | executado: `old/descarte_2026-09-24/` existe e é ignorado por `.gitignore:28`. Nenhum documento registra | SO_NO_CHAT (sem efeito) |
| DEC-11 | 01:29:41Z L539 + 01:31:36Z L565 (Ask) | "É material de pesquisa — virar projeto" / "Mover o projeto, ignorar o acervo (Recomendado)" | curso vira projeto; o acervo de 1,7 GB fica fora do git | `.gitignore:45-46` (regra e razão); pasta `reviewbr/projects/masterclass_historia/` existe | REGISTRADO |
| DEC-12 | 01:37:18Z L624 (Ask) | "Todas as metodologias de pesquisa devem estar no escopo do agente. O que não precisa é que o o reviewbr já tenha todas as metodologias prontas." | escopo do agente cobre todas; o sistema implementa duas | `maintainer.md:49-61`; DEBT-007..011.context | REGISTRADO |
| DEC-13 | 01:40:59Z L650 | "o que está em old fica em old se nao é projeto de pesquisa." | regra de organização de `old/` | nenhuma ocorrência (`fica em old`, `não é projeto de pesquisa`) | SO_NO_CHAT |
| DEC-14 | 01:40:59Z L650 + 01:43:35Z L688 (Ask) | "precisamos ter todas as diretrizes prisma incluindo suas variacoes e subitens" / "`.claude/standards/<padrao>.json`" / "Gerar o template a partir do dado" | padrão como dado; checklist gerado a partir do dado | `MANIFESTO:243`, `:257`; `PROTOCOLO:240` | REGISTRADO |
| DEC-15 | 01:53:21Z L789 | "existem itens e subitens que talcez totalizem 27 - talvez seja menos que 27 sendo por exemplo 12 12a 12b" | PRISMA tem subitens (48 nós / 42 linhas) | `PROTOCOLO:245`; DEBT-013 RESOLVIDO | REGISTRADO |
| DEC-16 | 01:56:45Z L825 (Ask) | "até o presente momento eu estava preparando o ambiente para o trabalho." | marco: preparação ≠ execução | `PROTOCOLO:125-131`, `:244`; `RETOMAR.md:20` | REGISTRADO |
| DEC-17 | 02:02:25Z L891 (Ask) | "Saber o que ela exige, sem implementar (Recomendado)" / "Abrir o escopo para consultar as fontes oficiais" | catálogo sem implementar; §4 revogado | `PROTOCOLO:111`, `:176`, `:236`. Mas `PROTOCOLO:149-150` ainda afirma "o rastreio externo está fora de escopo" | **DIVERGENTE** |
| DEC-18 | 02:09:00Z L934 + 02:09:45Z L942 (fila) | "nenhuma parte do trabalho pode ficar quebrada porque acabou o limite de tokens" | parar e registrar onde parou | `CONTINUAR.md:143-144`; `system-audit/SKILL.md:161-163` | REGISTRADO |
| DEC-19 | 11:05:15Z L1054 + be12a326 2026-09-26T13:56:55Z L3 | "podemos nao precisar do ultracode para tudo, mas nunca deixar de usar o opus pela complexidade das tarefas." / (26/09) "como baixei o modelo para o sonnet high" | política de modelo | `CONTINUAR.md:57` ("Opus para tudo, sempre: **não**") e `:69` (`opts.model`). "Nunca rebaixar o modelo" (assistente, L1457) tem zero ocorrências em disco | **DIVERGENTE** |
| DEC-20 | 11:12:41Z L1129 | "uso o claude team." | régua calibrada para o plano Team | `CONTINUAR.md:14` | REGISTRADO |
| DEC-21 | 11:17:12Z L1211 | "todas as ferramentas incluindo as que mudam metodologias e a criacao e a absorção de novas metodologias" | 4 tools de escrita; alterar metodologia = editar e depois `validate_methodology` | `PROTOCOLO:242`; `maintainer.md:136-148` (`:145`) | REGISTRADO |
| DEC-22 | 11:35:03Z L1355 | "os metodos quando usados precisam ser travados como harness?" | hook vira decisão pendente | DEBT-018.context ("Decisao do pesquisador pendente") | REGISTRADO |
| DEC-23 | 11:39:32Z L1418 | "em 5h5 dispare nova frente de trabalho para complementar. use os toeksn com inteligencia" | régua de tokens e política de esforço | `CONTINUAR.md:12-32`, `:55-79` | REGISTRADO |
| DEC-24 | 22:15:18Z L1564 | "disso ainda se tira algo para auditoria tardia antes de aplicar correções?" | conformidade externa antes de corrigir | DEBT-094/095/096 (DEBT-096.found_by e context) | REGISTRADO |
| DEC-25 | 22:17:12Z L1588 (fila) | "como fariamos esta verificacao completa e integrar tudo para que o sistema tenha o seu potencial maximo utilizavel" | teste de integração (Fase 2) | `PLANO_usabilidade.md:31-42`; `CONTINUAR.md:176-180` | REGISTRADO |
| DEC-26 | 22:19:23Z L1603 (Ask) | "Alvo primeiro: absorver as diretrizes de IA (Recomendado)" | ordem (a): diretrizes de IA antes de corrigir as tools de IA | `PASSAGEM.md:41`; `CONFORMIDADE_raise.md:92-93`. Mas DEBT-096.context diz "Decisao do pesquisador **pendente** sobre a ordem: (a)… ou (b)" | **DIVERGENTE** |
| DEC-27 | 22:26:23Z L1613 | "talvez se possa pensar em um modulo que eduque o pesquisador para como funciona a ciencia." | o assistente trocou por um gate (L1634: "não uma aula, um gate"); o Vicente respondeu "isso me parece relevante" (L1637) | o gate está registrado (DEBT-097; `PLANO:54-96`). A proposta original tem zero ocorrências (`eduque|educa|aula`) | SO_NO_CHAT |
| DEC-28 | 22:33:01Z L1637 | "alguem determinado em escrever qualquer coisa deveria ter limitação a partir das metodologias e assercao das perguntas." | gate da pergunta adversarial | `PLANO_usabilidade.md:56-90` | REGISTRADO |
| DEC-29 | 22:40:38Z L1686 | "o que será feito para que o reviewbr se torne uma ferramenta utilizavel e eficaz?" | critério: uma revisão real ponta a ponta | `PLANO_usabilidade.md:1-6` | REGISTRADO |
| DEC-30 | 23:01:31Z L1762 + 2026-09-26T02:31:39Z L1783 | "pode ser um sistema para pesquisa de uma forma geral" / "perfeito. é isso que se quer. modelo de sistematizacao de pesquisa protocolada." | DEBT-100 endossado; DEBT-099; alvo da triagem = registro e variabilidade medida (DEBT-101) | DEBT-100; `PASSAGEM.md:111` ("Endossado em conversa"); `:43-44`; DEBT-101.evidence | REGISTRADO |
| DEC-31 | 2026-09-26T02:38:50Z L1799 | "como sao muitos debt talvez algum deles entrem em conflito. acredito que valha verificar antes de executar" | análise de conflito antes de executar | `ORDEM_correcoes.md`; `PASSAGEM.md:97-98` | REGISTRADO |
| DEC-32 | 03:39:11Z L1899 (fila) | "esta funcionalidade herdada poderia servir para conferencia de artigos que sobram apos todas as triagens." | OCR na conferência final | DEBT-102.context | REGISTRADO |
| DEC-33 | 03:41:59Z L1939 + 03:49:56Z L2004 | "sim e execute tudo o que falamos com todas as questoes debatidas com o cuidado necessario." | autoriza executar a Fase 1 | a execução está datada (`PLANO:16-20`). A autorização e o alcance dela não estão escritos. Superada pelas decisões de 27/09 | SO_NO_CHAT (sem efeito) |
| DEC-34 | 11:55:15Z L2168 | "continue se todos os debts e todas as questoes tratadas estejam sendo consideradas" | `destino` obrigatório em todo achado | `COBERTURA_achados.md:17-33`; `PASSAGEM.md:45-46` | REGISTRADO |
| DEC-35 | 12:00:30Z L2213 + 12:01:15Z L2225 (fila) | "vamos verificar tudo o que foi programado de acordo com o que pensamos." / "nao apenas a fase 2" | verificação de integridade por cinco lentes | `CONTINUAR.md:150-153` | REGISTRADO |
| DEC-36 | 12:24:01Z L2365 (fila) | "o que nao foi discutido foi entendido como nao necessario de discussao por voce. se nao há problemas, continue" | regra de delegação para itens não discutidos | zero ocorrências (`não foi discutido|não discutimos|desnecessári`) | SO_NO_CHAT |
| DEC-37 | 12:28:05Z L2384 | "sim. vamos executar e rastrear o que se fez contando os tokens" | medir o custo por item executado (ex.: L2453 "~17,7 mil tokens de saída") | existem a régua e o script (`CONTINUAR §1`), mas não o rastreio por item | SO_NO_CHAT |
| DEC-38 | 13:33:10Z L2513 + 13:35:17Z L2547 (fila) | "nunca usar o sistema apenas para um tipo de pesquisa ou tema." | agnosticidade de domínio | `PASSAGEM.md:49-50`; DEBT-103 | REGISTRADO |
| DEC-39 | 13:37:20Z L2565 | "continue sem sair da trilha de acao do agente de manutencao … sem ignorar conflitos como ja relatado" | seguir a ordem apurada | `PASSAGEM.md:97-101`; `maintainer.md:104-106` | REGISTRADO |
| DEC-40 | 13:40:26Z L2622 | "precisamos apurar tudo o que foi decidido para usar um novo chat para execucao da manutencao" | documento de passagem | `PASSAGEM.md`; `maintainer.md:92-94` | REGISTRADO |
| DEC-41 | 13:47:02Z L2669 | "nao se deve temer envelhecimento." | `gravidade`, `destino` e `depende_de` viram dado derivado | `PASSAGEM.md:77-79`; `COBERTURA_achados.md:8-25` | REGISTRADO |
| DEC-42 | 2026-09-27T02:17:23Z L2747 | "quando terminar tudo e nao houver mais pendencias passamos para fase de testes do sistema pois manutencao e depois de testes analisamos os resultados de todo este trabalho." | sequência: manutenção → testes do sistema → análise. Critério de entrada sugerido pelo assistente (L2768/L2779): DEBT-014, 020, 021 e 022 fechados | zero ocorrências (`fase de testes|testes do sistema|critério de entrada`). Não foi levado à be12a326: o repasse de 02:19:38Z (L259) tem zero ocorrências de "fase de testes" e contém DEBT-020 | **SO_NO_CHAT** |
| DEC-43 | 02:17:23Z L2747 → resposta 02:23:20Z L2779 | "precisamos verificar se o que foi resolvido foi implementado" | **pendência do assistente, não decisão do Vicente.** Resultado: 9/12 confirmados. DEBT-046, 061 e 065 estão parciais (falta teste de regressão do corpo dos `.md`). "o F8 de qualquer revisão está bloqueado até o `DEBT-014` ser feito"; decisão (a)/(b) pendente | a regra que bloqueia existe (`prisma-rigor-gates/SKILL.md:43`; `synthesis-manuscript/SKILL.md:22`) e o DEBT-014 está ABERTO. A consequência, a decisão pendente e o resultado da verificação não estão em disco nem foram levados à be12a326 | **SO_NO_CHAT** |

### 3.2 Sessão be12a326 (26–27/09: execução da manutenção)

| ID | Âncora | Citação literal | O que ficou decidido | Registro em disco | Classe |
|---|---|---|---|---|---|
| DEC-44 | 2026-09-26T13:56:55Z L3 + 20:48:26Z L87 + 20:48:35Z L95 (fila) | "se algum problema for detecado deve-se apenas anotar o problema e para a manutencao para correcao em outra chat antes de continuar." / "a instrução inicial é: realizar manutenção até que apareça um problema ou até que os tokens da sessao acabem." / "apareceu problema?" | chat só de execução; diante de problema, parar | o disco manda o contrário: `PASSAGEM.md:26-27` ("Registre … e siga; não interrompa a correção em curso") e `maintainer.md:126` | **DIVERGENTE** |
| DEC-45 | 13:56:55Z L3 + 14:02:09Z L35 | "vamos executar a manutencao com base nesse limite de tokens de 5h30 em 5h30" / "1% de tokens. apenas avisando ja que nas proximas situacoes nao vou avisar." | janela de 5h30; o agente mede o consumo sozinho | `CONTINUAR.md:24-32` fala em janela de 5h; "5h30" e "não vou avisar" têm zero ocorrências | SO_NO_CHAT |
| DEC-46 | 2026-09-27T01:48:48Z L113 + 01:56:04Z L173 + 01:57:02Z L192 | "debt 050 o conteudo oficial deve estar em alguma das pastas do sistema." / "verificar o pdf prisma src na pasta download dentro da pasta reviewbr" / "sim" | `prisma-scr.json` montado a partir do PDF oficial | DEBT-050.resolution cita `reviewbr/download/PRISMA-ScR-Fillable-Checklist_11Sept2019.pdf` | REGISTRADO (ver §5) |
| DEC-47 | 02:25:00Z L273 | "pode parar quando for coveniente, depois de finalizar tarefas em execucao agora, e que nao quebre o trabalho posterior." | parada segura | `CONTINUAR.md:143-144` (regra geral) | REGISTRADO |

### 3.3 Sessão 153e5b05 (29/09–02/10: preparação da troca de PC)

| ID | Âncora | Citação literal | O que ficou decidido | Registro em disco | Classe |
|---|---|---|---|---|---|
| DEC-48 | 2026-09-29T19:50:06Z L3 (+ L36: Ask rejeitado; L42: imagem) | "quero que apenas analise uma habilidade baixada da propria antropic, é uma pasta inteira que se chama: Bio Research-1.2.0-v39" | analisar depois do reset, como possível insumo para a pergunta de pesquisa | `memory/skill-bio-research-pendente-analise.md:11-27`; `MEMORY.md:13`. Repositório: zero ocorrências (`bio.?research`). A pasta existe sem rastreio no git (`??`) | **SO_NA_MEMORIA** |
| DEC-49 | 2026-09-30T00:01:15Z L73 + 00:02:22Z L126 (fila) | "gostaria de ter o historico de acoes do claude code (voce) nesse outro computador como se estivessemos aqui." / "amigo, apenas do reviewbr" | migração do histórico, restrita ao ReviewBR | não está em disco; é o trabalho em curso nesta sessão | SO_NO_CHAT (sem efeito; fora do sistema) |

### 3.4 Sessão bbfd7ac8 (só diretrizes sobre o sistema)

| ID | Âncora | Citação literal | O que ficou decidido | Registro em disco | Classe |
|---|---|---|---|---|---|
| DEC-50 | 2026-09-25T00:03:57Z L4152 | "eu desejo primeiro registrar de forma organizada o que foi criado e produzido e em segundo lugar pensar nessa sistematica como mais um "braço" do reviewbr." | registro e proposta de módulo | `origem/REGISTRO_producao.md`; `origem/PROPOSTA_modulo_fontes_primarias.md:1-4` | REGISTRADO |
| DEC-51 | 00:11:23Z L4193 | "scripts só são usados em último caso. o reviewbr é uma ferramenta de revisão sistematica que funciona a partir de travas metodologicas." | o módulo se adequa ao modelo ReviewBR, e não a scripts | `PROPOSTA:13-16` ("Script é último recurso, não arquitetura"); `.claude/README.md:24` | REGISTRADO |
| DEC-52 | 00:21:12Z L4230 (Ask) | "investigar os 3 em ordem. porém, o que é mais importante é que criemos um novo chat apenas para esse trabalho." | três frentes, em chat próprio | `origem/BRIEFING_revisao_reviewbr.md:5`, `:251` | REGISTRADO |
| DEC-53 | 00:26:10Z L4267 + 00:31:01Z L4296 | "antes seria necessario pesquisar melhor sobre o jev e buscar se as solucoes criadas pela typesafe poderia ser replicadas por nosso poder com IA" | Jev investigado e não adotado | `BRIEFING:279-350`; `PROTOCOLO:182` | REGISTRADO |
| DEC-54 | 00:46:36Z L4388 | "um agente de manutenção do reviewbr que consolide o que existe, que está bem feito, e que possa também usar avancos em metodologias" | agente com duas faces | `BRIEFING:161-169`; `maintainer.md:29-38` | REGISTRADO |
| DEC-55 | 00:50:02Z L4420 | "os falsos negativos nao deveriam ser canonicos. eles deveriam ser vistas como um dado." | os 8 falsos negativos são dado, não cânone | `BRIEFING:59`, `:258`; `PROTOCOLO:195-197` | REGISTRADO |

### 3.5 Diretrizes de sistema que vivem só na memória (origem fora das quatro sessões)

| ID | Onde | Conteúdo | Situação no repositório | Classe |
|---|---|---|---|---|
| DEC-M1 | `memory/projeto-nao-altera-reviewbr.md:3,12-15`; `MEMORY.md:8` | "ferramenta quebrada se contorna dentro do projeto" ("o Vicente pediu isso explicitamente") | `PROTOCOLO:184` diz o oposto: "ferramenta quebrada se conserta na ferramenta, **nunca se contorna dentro do projeto**". Esse texto foi escrito pelo assistente na 27fac9ba L121 (00:59Z). Nenhum prompt humano das quatro sessões contém "contorn" | **DIVERGENTE** |
| DEC-M3 | `memory/integracao-protocolos-a-b.md:10,20` | "Regra mestra: nada substitui, tudo se adiciona atrás de portão desligável… nasce DESLIGADO"; plano em `C:\Users\alqui\.claude\plans\confirme-que-voce-l-curried-quokka.md` | os termos têm zero ocorrências em `.claude` e `reviewbr/docs` (controle `proibido corrigir`: ok). `~/.claude/plans/` não existe neste PC. `*quokka*` não aparece no pacote zip (controle: `*be12a326*` → 3) nem em `D:\backupantigravity` (profundidade 6; controle: `PASSAGEM.md` achado) | **SO_NA_MEMORIA** |

## 4. Detalhe dos não registrados e divergentes: ação e responsável

**DEC-06 · DEBT-001: "deixar na fila" virou "fora de escopo"** (DIVERGENTE, DEGRADA, Vicente)
- O que o Vicente disse: em 2026-09-25T01:14:36Z, "se precisa ser corrigido esse é dos papei do agente de manutenção"; em 01:17:05Z, "deixar na fila e seguir com o trabalho".
- O que o disco diz: DEBT-001.context traz "Registrado e não corrigido **por decisão do pesquisador: fora do escopo** do PROTOCOLO_revisao_reviewbr.md §2". O enquadramento "fora do §2" foi do assistente, às 01:10–01:13Z, antes da resposta do Vicente.
- Efeito: na be12a326, o subagente (20:46:11Z) registrou "deixei intocado", e o assistente disse ao Vicente (2026-09-27T01:50:09Z): "Você já decidiu antes que isso é fora de escopo… Não é pendência de fato, é só nota histórica". DEBT-001 segue ABERTO/FASE_1 e nunca é tratado.
- Ação: o Vicente confirma se o DEBT-001 deve ser corrigido pelo mantenedor. Se sim, a próxima sessão troca o context por "Decisão do pesquisador (25/09 01:17Z): deixar na fila; correção é papel do mantenedor", via `record_system_finding atualizar=true`.

**DEC-07m · a memória aponta para pasta que não existe** (DIVERGENTE, DEGRADA, próxima sessão)
- `manutencao-reviewbr-estado-em-disco.md:15-18,25` manda abrir `reviewbr/docs/modulos/MANIFESTO…`, `…/PROTOCOLO…` e `…/system_debt.json`. A pasta não existe (`ls reviewbr/docs/modulos` → No such file; controle: `reviewbr/docs` existe).
- A rota também não traz `PASSAGEM.md` nem `CONTINUAR.md`, que o `maintainer.md:92-96` põe como passos 0 e 0b.
- Ação: atualizar os caminhos para `.claude/maintenance/` e a ordem para PASSAGEM → CONTINUAR → `audit_system_debt`. Isso é edição de memória, proibida nesta sessão.

**DEC-08 · por que o estado saiu de `reviewbr/docs/`** (SO_NO_CHAT, COSMETICO, próxima sessão)
- A razão, dita pelo assistente às 01:28:39Z, era: "`docs/` é o site publicado do prismAId… se sincronizado com o upstream, esses arquivos vão junto ou somem". A escolha foi do Vicente (Ask de 01:27:00Z).
- Em disco só há o efeito. Sem a razão escrita, uma sessão futura pode voltar a guardar estado em `reviewbr/docs/`, e o próprio BRIEFING ainda manda ir lá (`origem/BRIEFING:369`).
- Ação: uma linha no `PROTOCOLO §7`.

**DEC-09 · "o sistema não precisa de instalação"** (SO_NO_CHAT, com o disco dizendo o contrário; DEGRADA; Vicente)
- O requisito do Vicente nunca foi escrito como requisito. Só aparece de passagem no DEBT-006.context ("Descoberto ao verificar se a pasta funciona ao ser aberta sem instalacao").
- `.claude/README.md:27-32` exige `npm install && npm run build` e `~/.reviewbr/.env`. `dist/` está no `.gitignore:7` (0 arquivos rastreados).
- Neste PC não há Node: `command -v node npm tsx` não devolve nada, e `where node` responde "não foi possível localizar". Por isso o MCP `reviewbr` dá CONNECTION_CLOSED. O requisito e o estado real divergem exatamente no ponto que trava a retomada aqui.
- Ação: o Vicente decide se o requisito continua valendo, ou o que ele quer dizer com "sem instalação" (por exemplo, `dist` versionado ou runtime embarcado). Depois, registrar como achado ou requisito.

**DEC-10 · lixo para `old/descarte/`** (SO_NO_CHAT, OK, ninguém): executada; a pasta é o rastro. Nada a fazer.

**DEC-13 · "o que está em old fica em old se não é projeto de pesquisa"** (SO_NO_CHAT, COSMETICO, próxima sessão)
- Regra de organização com zero ocorrências em disco.
- Fato, sem inferência: `old/` contém hoje `EGSIDB`, `curso_alquimista`, `descarte_2026-09-24`, `garruti`, `reviewbr-mcp-cruft`, `skills-legacy` e `vicente`. Não está registrado quais deles são projetos de pesquisa.
- Ação: transcrever a regra no PROTOCOLO §4 ou §7.

**DEC-17 · escopo aberto, mas o §3.1 diz que está fechado** (DIVERGENTE, DEGRADA, próxima sessão)
- `PROTOCOLO:176` e `:236` registram a revogação do §4. `PROTOCOLO:149-150` continua: "Ambas esbarram no §4: **o rastreio externo está fora de escopo**". DEBT-013.context repete "o rastreio externo esta fora de escopo (protocolo §4)", mas o DEBT-013 já está RESOLVIDO.
- A lente 5 já apontava isso em 26/09 (`lente5_decisoes.json`, 3ª divergência). Continua lá: o mtime do PROTOCOLO é 25/09 16:49.
- Ação: corrigir o §3.1 sob RV-11.

**DEC-19 · política de modelo** (DIVERGENTE, DEGRADA, Vicente)
- Em 25/09 o Vicente disse: "nunca deixar de usar o opus pela complexidade das tarefas"; o assistente transcreveu no chat (L1457) "Nunca rebaixar o modelo — só o esforço", e isso tem zero ocorrências em disco.
- `CONTINUAR.md:57` diz "Opus para tudo, sempre: **não**", e `:69` cita `opts.model`.
- Em 26/09 o Vicente rodou a execução com "sonnet high" (be12a326 L3). O subagente foi a `claude-sonnet-5` (be12a326 L41: "model sent to the API: claude-sonnet-5").
- Ação: o Vicente diz qual regra vale (Opus sempre, com esforço regulado, ou Sonnet na execução) e ela é escrita no CONTINUAR §2.

**DEC-26 · "Alvo primeiro" já escolhido, mas o DEBT-096 diz "pendente"** (DIVERGENTE, DEGRADA, próxima sessão)
- A escolha está em 2026-09-25T22:19:23Z (L1603) e é a opção (a) do DEBT-096. `PASSAGEM.md:41` e `CONFORMIDADE_raise.md:93` ("A ordem escolhida — alvo primeiro — se justificou") a registram.
- DEBT-096.context continua "Decisao do pesquisador pendente sobre a ordem: (a)… ou (b)". Por isso o relatório de 27/09 voltou a pedir essa decisão (be12a326 L253; 27fac9ba L2729).
- Relação: a decisão nº 8 de 27/09 (fora desta tarefa) também trata do DEBT-096. Coordenar com o agente das 11 decisões para não registrar duas vezes.
- Ação: incluir no context do DEBT-096 a escolha de 25/09 22:19Z.

**DEC-27 · módulo educativo trocado por gate** (SO_NO_CHAT, COSMETICO, próxima sessão)
- O disco tem o gate (DEBT-097, Fase 4), mas não registra que ele substitui a proposta do Vicente de "um modulo que eduque o pesquisador".
- Ação: uma linha em DEBT-097.context ou no PLANO Fase 4.

**DEC-33 · autorização para executar** (SO_NO_CHAT, OK, ninguém): superada pelas decisões de 27/09.

**DEC-36 · "o que não foi discutido foi entendido como não necessário de discussão por você"** (SO_NO_CHAT, COSMETICO, Vicente)
- É uma regra de delegação sem registro. Fica em tensão com `maintainer.md:207` ("Não decida pelo pesquisador").
- Ação: o Vicente confirma se é regra permanente; se for, entra no PASSAGEM §1.

**DEC-37 · rastrear tokens por item** (SO_NO_CHAT, COSMETICO, próxima sessão)
- Os custos por item (por exemplo, DEBT-069 + DEBT-097 ≈ 17,7 mil tokens de saída, L2453) só existem no chat.
- Ação: se a regra continuar, anotar o custo na resolution de cada achado ou no CONTINUAR.

**DEC-42 · depois da manutenção vêm os testes do sistema** (SO_NO_CHAT, DEGRADA, próxima sessão)
- A sequência decidida pelo Vicente não está em disco e não chegou ao chat de execução.
- O critério de entrada (DEBT-014, 020, 021 e 022 fechados) é sugestão do assistente (L2768, L2779) e precisa do aval do Vicente.
- Ação: transcrever no PASSAGEM §4, marcando o critério como "proposto, a confirmar".

**DEC-43 · pendências da verificação de 27/09 02:23Z** (SO_NO_CHAT, DEGRADA, Vicente)
- Não é decisão do Vicente; é resultado e recomendação do assistente que ficaram só no chat:
  1. 9/12 implementações confirmadas: DEBT-023, 024, 029, 044, 050, 051, 059, 084, 086.
  2. DEBT-046, 061 e 065 estão parciais: falta o teste que compara o corpo dos agentes com o frontmatter e trava o texto de `reader.md`.
  3. O F8 de qualquer revisão fica bloqueado enquanto o DEBT-014 (21 órfãos) estiver aberto, pela regra de `prisma-rigor-gates/SKILL.md:43`.
  4. Está pendente a escolha entre (a) fazer o DEBT-014 antes dos testes, que o assistente recomenda, e (b) aceitar o bloqueio.
- Ação: o Vicente escolhe (a) ou (b); a próxima sessão registra os itens 2 e 3 no backlog.

**DEC-44 · parar ao detectar problema × "registre e siga"** (DIVERGENTE, DEGRADA, Vicente)
- A regra do Vicente para o chat de execução era parar a manutenção diante de problema e corrigir em outro chat.
- `PASSAGEM.md:26-27` e `maintainer.md:126` mandam registrar e seguir.
- Na prática a be12a326 interpretou "problema" como "bloqueante" (L32: "parar e registrar … qualquer problema novo que exija decisão ou terceiro controle"). Essa interpretação também não está em disco.
- Ação: o Vicente define o que conta como "problema" e qual regra vale; o resultado é escrito no PASSAGEM §0.

**DEC-45 · janela de 5h30 e "não vou avisar"** (SO_NO_CHAT, COSMETICO, próxima sessão)
- Ação: acrescentar ao CONTINUAR §1 que o pesquisador não avisa o consumo de tokens e que o agente mede sozinho.

**DEC-48 · Bio Research** (SO_NA_MEMORIA, COSMETICO, Vicente)
- A memória foi restaurada neste PC, e `C:\reviewbr\Bio Research-1.2.0-v39\` existe, mas não é rastreada pelo git.
- Ação: quando o Vicente liberar a análise, registrar o resultado como achado (EXTENSAO) e não só em memória.

**DEC-49 · histórico no novo PC** (SO_NO_CHAT, OK, ninguém): é o trabalho desta sessão.

**DEC-M1 · "projeto não altera o ReviewBR": a memória e o protocolo divergem** (DIVERGENTE, DEGRADA, Vicente)
- Os dois textos concordam que o projeto de pesquisa não mexe no sistema.
- Divergem no que fazer quando a ferramenta quebra. A memória, carregada em toda sessão, diz "contorna dentro do projeto". O `PROTOCOLO:184`, escrito pelo assistente, diz "conserta na ferramenta, nunca se contorna dentro do projeto".
- DEC-51 ("scripts só são usados em último caso") pode pesar, mas não decide sozinha.
- Ação: o Vicente diz qual versão vale; a outra é corrigida.

**DEC-M3 · plano de integração dos protocolos A/B só na memória** (SO_NA_MEMORIA, DEGRADA, Vicente)
- A "regra mestra" e as fases do plano não estão no repositório.
- O arquivo de plano citado não existe neste PC, nem no pacote, nem no backup (com os controles da tabela §3.5).
- A sessão de origem (`30e407db…`, segundo o frontmatter da memória) não está entre as restauradas. Não reportado se o plano continua vigente.
- Ação: o Vicente diz se o plano A/B segue vivo. Se seguir, é preciso recuperar o arquivo de plano no PC antigo ou registrar a regra no repositório.

## 5. Observações laterais (fora do escopo desta tarefa, registradas para quem cuida da continuidade)

- A fonte oficial do DEC-46 só existe na cópia de trabalho. `git check-ignore` mostra que `reviewbr/download/PRISMA-ScR-Fillable-Checklist_11Sept2019.pdf` é ignorado por `.gitignore:25` (`*.pdf`), e `.claude/standards/prisma-scr.json` não é rastreado (`git status --porcelain` → `??`).
- Não há `CLAUDE.md` na raiz nem em `.claude/`. A rota de entrada só existe dentro do `maintainer.md`. O comando que o assistente sugeriu ao Vicente (27fac9ba 13:45:18Z L2666: "Leia `.claude/maintenance/PASSAGEM.md` e execute a manutenção do ReviewBR pelo agente `maintainer`") tem zero ocorrências em disco. A lente 5 já apontava a falta do CLAUDE.md.
- A pergunta aberta do assistente sobre o DEBT-100 (27fac9ba 23:03:34Z L1780: "**os agentes ficariam?**" — papéis abstratos ou declarados junto com a metodologia) nunca foi respondida e não está em disco (zero ocorrências de `agentes ficariam|papéis abstratos`). Vai ser necessária quando o protocolo do DEBT-100 for escrito, que é a decisão nº 7 de 27/09, fora desta tarefa.
- `RETOMAR.md` está velho: diz "57 metodologias" (`:15`, `:29`) e manda auditar a Frente 2 (`:44-45`), que já foi concluída. A lente 5 já apontava; não é problema de decisão.
- A memória `pesquisa-cajuina-piaui.md:20` aponta para `old/curso_alquimista/01_masterclass_historia/cajuina/`, mas o projeto foi movido para `reviewbr/projects/masterclass_historia/` (bbfd7ac8 23:15:11Z). É pesquisa, fora do escopo, mas é uma memória velha que vai para todo contexto.
- O prompt de 2026-09-25T17:17:11Z (27fac9ba L1467, "Regras desta frente, já acordadas com o pesquisador") **não é do Vicente**: veio do agendamento (`queue-operation enqueue` L1465) que o assistente criou às 11:40Z. Não foi tratado como decisão.

## 6. Reprodução

```bash
D=/c/Users/alqui/AppData/Local/Temp/claude/c--reviewbr/00a84351-3335-4c55-bbc9-f18cc25d45e9/scratchpad/wf/decisoes
P=/c/Users/alqui/.claude/projects/C--reviewbr
perl $D/prompts_all.pl $P/27fac9ba-6bd0-4e9e-a829-ba83125299f0.jsonl 9000   # prompts + fila (queued_command)
perl $D/ask2.pl        $P/27fac9ba-6bd0-4e9e-a829-ba83125299f0.jsonl        # AskUserQuestion + respostas
perl $D/dialog_text.pl $P/27fac9ba-6bd0-4e9e-a829-ba83125299f0.jsonl "2026-09-25T22:00" "2026-09-25T22:40"
$D/busca.sh 'fase de testes|testes do sistema'      # busca em disco (exporta LC_ALL=C.UTF-8)
$D/busca.sh 'proibido corrigir'                     # controle positivo
perl $D/debt.pl /c/reviewbr/.claude/maintenance/system_debt.json 3000 DEBT-001 DEBT-096
```
