# Método do ReviewBR

> **Estado em 12/11/2026:** texto da linha 9 da `.claude/maintenance/FILA.md` (sessão M). O Vicente respondeu às
> seis escolhas em 12/11/2026 e, no mesmo dia, aos textos propostos na conferência delas.
> - **Decidido:** vale. Traz a data e a origem. Não se reabre.
> - **[PROPOSTA]:** redação do agente. Não vale até o Vicente aprovar o texto que leu.
> - **Hoje:** fato conferido no sistema em 12/11/2026. Não é decisão.
>
> As decisões de 12/11 foram dadas sobre o resumo levado a ele. A redação é do agente, com a frase dele como
> origem, e ele a confere na leitura. O que falta está na seção 7.

**Duas camadas (A3, aprovada em 31/10/2026).** Este documento descreve (a) o método do ReviewBR, que é o da
ferramenta e vale para toda pesquisa. Não descreve (b) a metodologia escolhida para o estudo, com a trilha e os
campos dela: essa fica no catálogo e no protocolo do projeto. "Campo da trilha" é sempre campo da metodologia
escolhida.

Onde estão as decisões citadas: A1 a A9 em `.claude/maintenance/REVISAO_decisoes_2026-10-31.md`, parte A; D01 a
D41 em `.claude/maintenance/revisao_decisoes_2026-10-31/lista_decisoes.md`; as de 08/11 em
`.claude/maintenance/PLANO_sessoes_2026-10-29.md` ("Decisões de 31/10 a 05/11/2026"); as de 12/11 em
`.claude/maintenance/FILA.md` e neste documento. RV-01 a RV-08 são os invariantes de rigor (skill
`prisma-rigor-gates`).

## 1. Objetivo

**Decidido (A7, terceira versão, aprovada em 05/11/2026).** O propósito do ReviewBR é aplicar a metodologia
escolhida com certeza científica e de forma publicável, funcionando como um guia. O simples uso do ReviewBR educa o
pesquisador: ele aprende ao fazer, e aprende quando o guia o ajuda a escolher a metodologia dizendo o porquê.
Origem: "ensinar não é o propósito. o propósito é aplicar com certeza científica e publicável como um guia" (31/10);
"o simples uso do reviewbr educa o pesquisador" (04/11).

**Decidido (12/11/2026, "Para que serve o mapa").** Quando um projeto de pesquisa começa, o ReviewBR sugere a
metodologia mais adequada a partir do que o pesquisador deu de entrada, inclusive a pesquisa exploratória. O log
da pesquisa exploratória é mantido, como referência para entender o projeto mais depressa e guiar o pesquisador
depois de formulado o objeto e desenhado o projeto.

**Decidido (D01; 12/11/2026). Alcance.** O ReviewBR não se limita à revisão de literatura: serve à pesquisa em
geral, com qualquer metodologia do catálogo. O catálogo recebe metodologia nova pelas tools que já existem. O que
cada pesquisa tem de protocolo é o que a metodologia dela torna obrigatório (P2), e o registro vale em todo o
ReviewBR (P5). Metodologia do catálogo a que falta fundamento declarado ou validação pode ser usada, com o alerta
da seção 2. Origem: "pode ser um sistema para pesquisa de uma forma geral se pudermos usar as metodologias
existentes" (25/09); "Qualquer uma do catálogo, e temos ferramentas para que novas metodologias possam ser
catalogadas" (12/11).

## 2. Fundamentos

**Decidido (A2, aprovada em 31/10/2026).** O método do ReviewBR é descrito como se descreve uma metodologia
científica: objetivo, fundamentos, princípios, etapas, critérios de validade e limites. Os fundamentos passam pela
filosofia da ciência. O método não se apoia numa única linha teórica sem justificativa: se adotar uma, diz por que
a adota e o que ela não alcança.

**Decidido (D04, coberta em 08/11/2026).** Os fundamentos desta seção são do método da ferramenta (camada a). A
âncora científica de cada metodologia e a isenção da ferramenta são da metodologia do projeto (camada b), onde vale
o P2: segue-se o que a metodologia pede, e não se pergunta nada além do protocolo dela. São camadas diferentes, e
não há contradição.

**Decidido (12/11/2026). Os fundamentos são uma camada de segurança.**
- Fundamento não é metodologia: é a base científica com que uma metodologia é vista, para o ReviewBR poder
  sugeri-la a um projeto.
- O ReviewBR tem os seus fundamentos científicos, os canônicos (lista abaixo), e a lista pode crescer.
- Cada metodologia deve declarar os seus fundamentos. A entrada do catálogo aponta onde, como aponta a própria
  metodologia: fonte oficial e data de leitura (P4).
- O catálogo é um mapa: pode listar toda metodologia que existe e tem fonte oficial. Cada entrada diz duas coisas:
  - se a metodologia é **legitimada**: declara os fundamentos em que se apoia;
  - se é **validada**: tem demonstração externa, apontada na entrada — publicação do método com revisão por
    pares, ou adoção por organização reconhecida da área (Cochrane, JBI, EQUATOR e afins).
- A metodologia a que falta uma das duas fica no catálogo com um alerta ao pesquisador: ela existe, e não está
  legitimada ou não tem validação. Que falta mesmo, confere-se antes de afirmar. O ReviewBR sugere outra mais
  adequada quando a troca não descaracteriza o projeto, isto é, não muda a pergunta nem o objeto da pesquisa
  (definição do agente, a conferir na leitura).
- Trilha executável, só para metodologia validada. A D05 (08/10) e a D16 (29/10) não mudam; ganham alcance
  escrito: "só entra metodologia validada" vale para a trilha executável e para a sugestão sem alerta, não para a
  entrada no mapa.
- Esta camada é incorporada às tools que mapeiam as metodologias.

Origem: "fundamentos metodologicos, epistemologias, não são metodologias em si"; "o reviewbr tem essa camada de
segurança que deve ser incorporada as tools responsaveis por mapear as metodologias. se uma metodologia nao declara
seus fundamentos pode-se informar que a metodologia nao é legitimada (…) sabemos que existe, nao tem validacao (se
nao tiver mesmo e isso tem de ser conferido) e sugerir outra metodologia mais adequada se o projeto nao é
descaracterizado. os fundamentos cientificos do reviewbr sao os canonicos e podemos incluir mais se necessario";
"confirmo o que falta confirmar" (12/11).

Hoje: o catálogo tem 106 entradas, com o campo `confidence` (67 alta, 34 média, 5 baixa) e sem campo de
fundamentos nem de validação. Nenhuma tool emite o alerta.

**Decidido (12/11/2026). Os canônicos — lista inicial.** São quatro linhas, e nenhuma é a única (A2). De cada uma,
o que sustenta no ReviewBR e o que não alcança:
- **Popper, Karl R.** *The Logic of Scientific Discovery.* Londres: Hutchinson, 1959 (original: *Logik der
  Forschung*, Viena: Springer, 1935). Uma hipótese é científica se pode ser refutada por um teste fixado antes.
  Sustenta: o protocolo fixado antes da busca e o vocabulário que o sistema já usa ("o sistema falsifica, quem
  afirma é quem assimila"). Não alcança: a dimensão social da conferência.
- **Merton, Robert K.** "The Normative Structure of Science" [1942]. In: *The Sociology of Science: Theoretical and
  Empirical Investigations.* Chicago: University of Chicago Press, 1973, p. 267–278. O ethos da ciência:
  comunalismo, universalismo, desinteresse e ceticismo organizado. Sustenta: evidência à vista, origem rastreável,
  números recomputáveis e a isenção da ferramenta. Não alcança: é descrição normativa, não critério de teste.
- **Longino, Helen E.** *Science as Social Knowledge: Values and Objectivity in Scientific Inquiry.* Princeton:
  Princeton University Press, 1990. A objetividade vem da crítica entre pares, com padrões públicos. Sustenta: quem
  confere não é quem produziu, e a decisão final de uma pessoa onde as conferências divergem (seção 5). Não
  alcança: trata de comunidades, não de um procedimento.
- **Mayo, Deborah G.** *Error and the Growth of Experimental Knowledge.* Chicago: University of Chicago Press, 1996.
  Um teste só conta se teria acusado o erro caso ele existisse (teste severo). Sustenta: o controle positivo (P7),
  o zero que só vale com controle e o estudo falso como controle (A8). Não alcança: nasce da inferência
  experimental e estatística.

Origem: "o que falta: aprovar e incluir outros fundamentos canonicos" (12/11). Conferência das referências em
12/11/2026: editora e ano dos quatro livros, pelo catálogo da Open Library (o original de Popper aparece lá com
1935; o rascunho dizia 1934). Não foram conferidos o intervalo de páginas do capítulo de Merton nem a data de
1942. As obras não foram lidas nesta sessão: o resumo de cada uma é do agente.

Os outros fundamentos que ele pediu para incluir estão na seção 7, item 1.

## 3. Princípios

**P1. As trilhas são das metodologias** (A1, aprovada em 31/10/2026; soma-se à direção de 29/10/2026). O PRISMA é
um conjunto de metodologias entre outras, e o ReviewBR não impõe a trilha dele a nenhuma pesquisa. Cada metodologia
científica define as etapas que pede e o que pede em cada uma, e por isso gera a sua própria trilha. O ReviewBR tem
o seu método, que é o da ferramenta; foi ele, construído sobre o PRISMA, que deu origem ao percurso F0–F8. Para
funcionar com qualquer metodologia, o método do ReviewBR precisa ser mais simples do que a trilha de cada uma delas,
e não pode repetir as etapas de uma metodologia em particular.

**P2. Opcional e obrigatório seguem a metodologia** (08/11/2026, redação corrigida pelo Vicente). O ReviewBR segue
o que cada metodologia diz: o que ela torna obrigatório é obrigatório, e o que torna opcional é opcional. Vale para
todas. Opcional não deixa o protocolo em branco: o protocolo registra a escolha, conforme os objetivos do projeto de
pesquisa. Pergunta que o protocolo do método não tem não é feita ao projeto.

**P3. Um método não herda de outro o que é próprio dele** (D14, aprovada em 05/11/2026). O ReviewBR não usa o modelo
da revisão sistemática como espelho do seu próprio modo de trabalhar. O PRISMA não é proibido: os seus conjuntos de
metodologias são importantes e vão existir no sistema. Origem: "achei que fosse mais uma contaminação do prisma e
por isso pontuei"; "a palavra prisma não é proibida e tem conjuntos de metodologias importantes que vão existir".

**P4. Metodologia e norma se apontam, não se copiam** (12/11/2026). O ReviewBR guarda a fonte oficial e a data em
que ela foi lida, e mantém um mapa central para sugerir ao pesquisador a metodologia mais adequada. Não se
transcreve norma nova nem se confere mapeamento item a item. As cinco normas já transcritas ficam como ajuda, sem
crescer. O catálogo tem uma entrada por documento. Para norma nova, isto substitui a "transcrição precisa" da A9
(31/10: "Assimilar uma metodologia deve ser uma tarefa com transcrição precisa e descrição").

**P5. O controle por código vale em todo o ReviewBR** (12/11/2026), da busca exploratória à formulação do objeto de
pesquisa e à publicação: contagem, trava, registro, deduplicação e persistência não se simplificam.

**P6. Todo projeto declara o uso de IA; o RAISE não é norma canônica** (D07, decidido em 05/11/2026; alterado em
12/11/2026).
- Todo projeto conduzido com o ReviewBR declara, no relato, onde a IA foi usada e como. Quando a metodologia
  escolhida, a norma de relato ou o periódico de destino exigem mais, o projeto declara todas as informações
  exigidas.
- O RAISE não é a norma de conformidade de todo projeto; entra como norma quando a metodologia ou o destino de
  publicação o exigem. A citação do RAISE 1 no `maintainer.md` fica.
- **Alterado em 12/11/2026 — o mapa de uso de IA é abandonado.** O ReviewBR deixa de classificar as suas tools
  pelas categorias do RAISE 3 (`registry/ai_use.ts`). Muda o item 1 da decisão de 05/11 ("o mapa fica como política
  do sistema"). Origem: "o mapa de uso de Ia parece nao ser mais necessario porque ele nunca ficou bom e pdoe ser
  abandonado".
- **Alterado em 12/11/2026 — o registro segue a metodologia.** O sistema tem de ter o registro do uso de IA quando
  a metodologia escolhida o torna obrigatório, e no que ela obriga. Substitui, na consequência escrita em 05/11, "o
  sistema fornece, para todo projeto, o registro (…) por etapa e por tool". Origem: "tem de ter registro quando é
  obrigatorio por metodologia escolhida no que a metodologia obriga". Leitura do agente, a conferir por ele: a
  declaração simples de todo projeto (primeiro item, frase dele de 05/11) continua.

Origem de 05/11: "todas as pesquisas que usam o reviewbr devem declarar onde foi usado IA, como, e quando exigido,
todas as informações que se pede. Levamos as metodologias a sério".

Hoje:
- o registro que existe não depende do mapa: `03_screening/ia_audit/` (triagem pelo `screen_candidates`: modelo,
  versão, temperatura, prompt e saída por decisão); `logs/lote/` e a tabela `audit_logs` (tools em lote:
  parâmetros e resultado por item); as decisões gravadas do pesquisador;
- não achei, por busca de texto, tool, skill ou agente que monte o registro por etapa nem o texto da declaração
  para o relato;
- o mapa continua no código, com o aviso do RAISE 3 em duas tools e um teste próprio.

**P7. Script e agente erram: o que produzem é revisado** (A5, aprovada em 31/10/2026). Resultado produzido por
script ou por agente não funda decisão sem que o que ele produziu seja revisado. Script que confere alguma coisa só
vale como prova depois de pegar um caso conhecido (controle positivo).

**P8. Campo vazio nem sempre é erro** (A4, aprovada em 31/10/2026). A metodologia diz, campo a campo, quando o campo
se aplica; o estudo responde se a condição vale; o campo vazio só é erro quando se aplica àquele estudo; "não se
aplica" vem com o motivo, registrado como decisão do pesquisador.

**P9. Modo de agir** (D09 e DEBT-132; aprovado em 12/11/2026). O modo de agir é o método do ReviewBR. Não se baseia
no PRISMA, a não ser no projeto cuja metodologia é do PRISMA. Simplificar o modo de agir é tirar dele o que é
próprio de uma metodologia, e não empobrecê-lo: o controle por código não se simplifica (P5). A A1 (P1) registra de
onde veio o percurso F0–F8; ela não faz do PRISMA a base do modo de agir.

O ReviewBR executa etapas assistidas com supervisão humana por etapa. Cada etapa encerra gravando artefato, e a
seguinte não abre sem decisão registrada do pesquisador com contribuição específica. A ferramenta não produz entrega
autônoma (04/10/2026). O que isso faz, em três níveis que não se confundem:
- **garante**, contra acidente e atalho: gate que falha fechado, verificação determinística, nada entra no corpus
  sem o protocolo que a metodologia exige, pelo caminho legítimo;
- **torna visível** a adulteração: decisão registrada com quem, quando e o quê (RV-04); funil recomputável do
  corpus; trilha de auditoria por corrida de IA;
- **não protege** contra fraude deliberada: quem tem acesso ao disco escreve nele. O autor humano responde pelo
  conteúdo, pelos métodos e pelos achados (RAISE 1, recomendação 4.1); cabe à ferramenta não deixá-lo burlar sem
  saber que está burlando. Por isso se prioriza detectar e registrar, e não prometer bloqueio impossível.

Origem: "nao usamos o metodo prisma como base unica do metodo reviewbr para apoio a pesquisa. Simplificar é
diferente de empobrecer. modo de agir = metodo do reviewbr que nao se baseia no prisma a nao ser que o metodo
escolhido para um projeto N seja o prisma"; "aprovo modo de agir" (12/11). Hoje: o `maintainer.md` ainda diz "nada
entra no funil sem protocolo travado".

**P10. Quando a IA faz o papel de um avaliador, o alvo é auditabilidade, não determinismo** (DEBT-101; aprovado em
12/11/2026, com ressalva). A ciência não exige que dois avaliadores humanos concordem: exige medir quanto discordam
e que um terceiro resolva. Da IA que faz esse papel (triagem, extração) o ReviewBR exige: cada decisão registrada
com modelo e versão, data, prompt, entrada e saída; as discordâncias levadas ao pesquisador. Não exige que a IA dê
sempre a mesma resposta. A variação medida e relatada é exigida quando a metodologia ou o destino de publicação a
exigem (P2). Origem: "aprovo com a ressalva de se analisar como as melhores ferramentas de apoio a pesquisa agem
nesse caso" (12/11).

Hoje: o registro existe na triagem pelo `screen_candidates`, e há uma função que compara duas corridas
(concordância e kappa de Cohen); nenhuma tool roda a triagem duas vezes nem relata a concordância. A validação da
IA dentro da revisão está em "O que não é fila".

A ressalva — primeira conferência, em 12/11/2026. Li o resumo que a busca na web devolveu, e não as páginas; quase
tudo é material do fabricante. Não fecha a análise que ele pediu.
- Nested Knowledge (Robot Screener): a IA entra só como segundo revisor, em triagem dupla; um revisor humano e um
  árbitro humano decidem; a ferramenta dá, por projeto, a revocação e a precisão da IA.
- DistillerSR: as decisões da IA ficam numa conta de revisor separada, e entram no relatório de conflitos e no
  kappa como as de qualquer revisor; há uma checagem que aponta exclusão provavelmente errada. Num estudo de 2019
  (*Systematic Reviews*), a IA no lugar de um dos dois triadores, com um humano resolvendo os conflitos, rendeu
  perto da triagem por um só revisor, e a IA sozinha foi mal.
- Covidence: a ordenação por relevância e o classificador de ensaios randomizados não tiram estudo da triagem pela
  nota; quem tria são as pessoas.
- Elicit: recomenda conferir numa amostra aleatória do projeto ou refazendo uma revisão já pronta, e arbitrar as
  discordâncias.
- O que se repete: nenhuma exige a mesma resposta sempre. A IA é tratada como um revisor: a decisão dela fica
  registrada, é comparada com a de pessoas nos registros do próprio projeto (revocação, precisão, kappa), e uma
  pessoa decide onde divergem. Mede-se a IA contra a pessoa, não a IA contra ela mesma.

Fontes devolvidas pela busca: `https://about.nested-knowledge.com/docs/screening-model-robot-screener`;
`https://www.distillersr.com/wp-content/uploads/Purpose-built-GenAI-for-Literature-Reviews-DistillerSR.pdf`;
`https://link.springer.com/article/10.1186/s13643-019-1221-3`;
`https://www.covidence.org/release-notes-december-2022-machine-learning/`;
`https://support.elicit.com/en/articles/2357185`.

**P11. A auditoria de protocolo antes da busca vale para a metodologia que exige protocolo** (DEBT-134; aprovado em
12/11/2026). Projeto que assumiu uma metodologia passa pelo protocolo dela, auditado antes da busca e travado antes
da execução, quando a metodologia o exige. Projeto sem metodologia declarada não tem protocolo a auditar; se depois
assumir uma, passa pelo protocolo dela naquele momento, e a auditoria posterior cobre o resto. O modo de agir (P9) e
o controle por código (P5) valem para os dois. Origem: "o auditor tem a funcao de que? Se for apenas para
protocolagem de metodologias que estao sendo seguidas, ele continua nestas. Para as outras talvez nao precise de
auditoria" (08/10); "ok" (12/11). Hoje: a exigência não alcança ninguém indevidamente, porque tipo de pesquisa sem
método assimilado é recusado e os dois métodos instalados exigem protocolo.

## 4. Etapas

**[PROPOSTA]** Montadas só com o que já está decidido; a origem vai em cada etapa. Pelo P1, são mais simples do que
a trilha de qualquer metodologia e não repetem as etapas de nenhuma.

1. **Exploração (opcional).** Busca sem projeto, para entender o campo e formular o objeto. Não entra no corpus de
   projeto nenhum; o log é mantido (12/11).
2. **Escolha da metodologia.** O ReviewBR sugere a mais adequada a partir das entradas, dizendo o porquê (A7, 12/11),
   com o alerta quando a metodologia não é legitimada ou validada (seção 2); o pesquisador escolhe. O protocolo
   grava o método, a fonte oficial e a data de leitura (FILA, linha 8, item 5).
3. **Protocolo da metodologia.** Pede o que ela torna obrigatório, registra a escolha no que é opcional e não faz
   pergunta que o protocolo dela não tem (P2). Auditoria e trava antes da busca quando ela as exige (P11).
4. **Execução da trilha da metodologia,** etapa por etapa, no modo de agir (P9), com o controle por código (P5) e o
   registro do uso de IA no que a metodologia obriga (P6).
5. **Relato,** pela norma de relato da metodologia, com o formulário oficial preenchido pelo pesquisador (FILA,
   linha 8, item 3), e com a declaração de onde e como a IA foi usada (P6).

Hoje:
- só duas metodologias têm trilha executável (`prisma-sr` e `scoping-prisma-scr`); as demais entradas do catálogo
  apontam a fonte;
- nenhuma tool lê o `MAPA.md`: a sugestão vem do `assess_research_design`, por palavra-chave e sem IA, pelos
  métodos que servem ao tipo de pesquisa (`serves_research_types`). O protocolo grava a escolha; a sugestão não
  fica gravada;
- as 106 entradas do catálogo estão sem data de leitura (`read_at`).

## 5. Critérios de validade

**Decidido (A6, aprovada em 31/10/2026).** Metodologia reconhecida pela ciência não é verificada de novo pelo
ReviewBR. O olhar se volta para a aplicação da metodologia, e é o estudo que a aplica que passa por testes.

**Decidido (A8, aprovada em 31/10/2026; ajuste de 12/11/2026).** Um estudo pode cumprir a forma da metodologia e
ser falso, inclusive se for preenchido por IA. A conferência do mapeamento não pega isso, porque confere a
transcrição da metodologia, e não o estudo. Quem pega são as conferências do próprio estudo: o protocolo travado
antes da busca, quando a metodologia o exige; os números que saem do processo gravado; a origem rastreável de cada
estudo incluído; a citação com página. Na fase de testes entra, como controle no nível do estudo, um estudo falso
preenchido por IA, para medir o que o sistema percebe. O ajuste é a ressalva "quando a metodologia o exige", que
vem do P2.

**Decidido (critério de credibilidade do D07; aprovado em 12/11/2026).** A credibilidade de uma pesquisa feita com
o ReviewBR não vem só de declarar o uso de IA. Vem também de o produto poder ser conferido por quem lê:
- protocolo travado antes da busca, quando a metodologia o exige (RV-01, P2);
- números que emergem do processo e podem ser recomputados (RV-02, RV-05);
- nada inventado onde falta dado (RV-03);
- decisões registradas com autor, data e fundamento (RV-04);
- origem de cada dado rastreável até a fonte (RV-08);
- aplicação da metodologia conferida a cada uso (A6).

O pesquisador responde pelo resultado. Onde o sistema não confere isso por código, a skill `prisma-rigor-gates` o
declara. Origem: "ignore a frase ou a reformule para se adequar a critérios científicos que foi pensado" (05/11),
sobre "credibilidade também se sustenta a partir do que as pesquisas produzem" (08/10); "ok" (12/11).

Hoje:
- por tool: o protocolo (RV-01), os números (RV-02) e a aritmética do funil (RV-05);
- a decisão do pesquisador é gravada por tool (RV-04); a trava de avanço só vale sob o nível "estrito";
- a origem (RV-08) só é conferida na exportação; a síntese não é barrada;
- "nada inventado" (RV-03) é conduta dos agentes, sem tool;
- a aplicação da metodologia (A6): o `check_standard_coverage` relata o mapeamento do sistema, que não foi
  conferido contra a fonte; o pesquisador preenche o formulário oficial.

**Decidido ("quem verifica o verificador?"; aprovado em 12/11/2026).** Nenhum verificador se certifica sozinho. O
que dá segurança à ferramenta:
1. teste com resposta conhecida antes de usar um conferidor como prova: um erro que ele tem de pegar e um acerto
   que ele não pode acusar;
2. independência: quem confere não é quem produziu;
3. evidência à vista: toda conclusão cita o trecho, o arquivo e a fonte, e qualquer pessoa pode refazer a
   conferência;
4. simplicidade: o conferidor é simples o bastante para uma pessoa lê-lo inteiro; heurística e IA servem de
   alerta, não de prova;
5. decisão final de uma pessoa, que olha onde as conferências divergem ou onde um teste falhou.

Saiu do item 2, em 12/11, "duas leituras independentes que concordam valem mais que uma": a segunda leitura de
norma deixou de ser exigida (P4), e nenhuma tool roda a triagem duas vezes.

## 6. Limites

**Decididos.**
- O ReviewBR não valida metodologia (A6) e não prova que um estudo é verdadeiro: a forma cumprida não pega estudo
  falso (A8).
- O RAISE não é a norma de conformidade de todo projeto (P6).
- O mapeamento dos itens das normas para o sistema é do sistema e não foi conferido contra a fonte; o pesquisador
  preenche o formulário oficial da norma (12/11, FILA linha 8, item 3).
- O ReviewBR não protege contra fraude deliberada de quem tem acesso ao disco (P9, terceiro nível; 12/11).

**Decidido (12/11/2026). A síntese proposta por agente e o RAISE 3.**
- O agente `analyst` não compete com o pesquisador. O que ele propõe e o pesquisador aprova é decisão do
  pesquisador: fica registrada (RV-04) e é revisada por ele (P7).
- Quando a metodologia, a norma de relato ou o periódico exigem o RAISE, o ReviewBR informa ao pesquisador que o
  RAISE 3 dá como não aceitável (a) a síntese de resultados entre estudos feita por LLM e (b) a síntese por
  agentes de ponta a ponta, *"with or without human input/refinement at each stage"*. Nesse projeto a aprovação
  dele não muda a classificação, e o ReviewBR pede que ele traga a síntese entre estudos.

Origem: "o agente analyst nao compete com o pesquisador. o pesquisador pode aprovar o que o agente analyst propoe e
isso é considerada uma decisao do pesquisador"; "se quando é exigido raise a sintese como nao aceitavel deve ser
informado isso ao pesquisador e pedir que ele traga" (12/11). Esta decisão substitui a posição proposta no rascunho
(a síntese entre estudos seria sempre do pesquisador ou da estatística).

Hoje: nenhuma tool, skill ou agente informa isso ao pesquisador; a síntese entre estudos (F7 do `prisma-sr`) e o
manuscrito (F8) estão com o agente `analyst`, que se descreve como quem sintetiza os achados. Fonte: RAISE 3,
*Living guidance for selecting and using AI evidence synthesis tools*, DRAFT Version 4.0, 23/09/2026, OSF
(`https://osf.io/download/kd9q5/`), Tabela 2; lida em 05/11/2026
(`.claude/maintenance/revisao_decisoes_2026-10-31/d07_raise_fontes_2026-11-05.md`). É rascunho de um guia vivo: a
classificação pode mudar.

## 7. O que falta

**1. Outros fundamentos canônicos (seção 2).** Ele pediu para incluir outros; quais, é escolha dele. Candidatas do
agente, dadas de memória e não lidas nesta sessão, cada uma para o que as quatro não alcançam:
- **Kuhn, Thomas S.** *The Structure of Scientific Revolutions.* Chicago: University of Chicago Press, 1962. Cada
  tradição de pesquisa tem os seus padrões do que é um bom trabalho. Sustentaria: as trilhas são das metodologias
  e um método não herda de outro (P1, P3). Não alcança: não dá critério para comparar tradições. O ano não foi
  conferido (a Open Library traz 1955 e 1962).
- **Lincoln, Yvonna S.; Guba, Egon G.** *Naturalistic Inquiry.* Beverly Hills: Sage, 1985. Critérios de confiança
  da pesquisa qualitativa (credibilidade, transferibilidade, dependência, confirmabilidade) e a trilha de
  auditoria. Sustentaria: a decisão registrada e a origem rastreável numa pesquisa qualitativa, que Popper e Mayo
  não alcançam. Não alcança: a pesquisa experimental. Autores, editora e ano conferidos na Open Library; a cidade,
  não.
- **Munafò, Marcus R. et al.** "A manifesto for reproducible science." *Nature Human Behaviour*, v. 1, 0021, 2017.
  Medidas contra o resultado que não se reproduz: pré-registro, transparência, dados e métodos abertos.
  Sustentaria: o protocolo antes da busca e os números recomputáveis. Não alcança: é programa de prática, não
  teoria do conhecimento. Referência conferida na Crossref (DOI 10.1038/s41562-016-0021).

**2. Etapas (seção 4).** O texto segue como proposta: aprovar ou corrigir.

**3. Duas leituras a confirmar.**
- P6: a declaração simples de uso de IA continua valendo para todo projeto, e só o registro por etapa e por tool
  passa a seguir o que a metodologia obriga?
- P10: "variação medida" passa a dizer "concordância entre a IA e o pesquisador numa amostra do próprio projeto",
  como fazem as ferramentas conferidas?
