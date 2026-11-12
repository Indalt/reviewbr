# Método do ReviewBR

> **Estado em 12/11/2026:** rascunho da linha 9 da `.claude/maintenance/FILA.md` (sessão M). Nenhuma seção foi
> aprovada como texto ainda.
> - **Decidido:** entra como o Vicente aprovou, com a data e a origem. Não se reabre.
> - **[PROPOSTA]:** redação do agente. Não vale até o Vicente aprovar o texto que leu.
> - **[PENDENTE]:** só se escreve depois da escolha dele.
> - **Hoje:** fato conferido no sistema em 12/11/2026. Não é decisão.
>
> As escolhas que faltam estão na seção 7.

**Duas camadas (A3, aprovada em 31/10/2026).** Este documento descreve (a) o método do ReviewBR, que é o da
ferramenta e vale para toda pesquisa. Não descreve (b) a metodologia escolhida para o estudo, com a trilha e os
campos dela: essa fica no catálogo e no protocolo do projeto. "Campo da trilha" é sempre campo da metodologia
escolhida.

Onde estão as decisões citadas: A1 a A9 em `.claude/maintenance/REVISAO_decisoes_2026-10-31.md`, parte A; D01 a
D41 em `.claude/maintenance/revisao_decisoes_2026-10-31/lista_decisoes.md`; as de 08/11 em
`.claude/maintenance/PLANO_sessoes_2026-10-29.md` ("Decisões de 31/10 a 05/11/2026"); as de 12/11 em
`.claude/maintenance/FILA.md`. RV-01 a RV-08 são os invariantes de rigor (skill `prisma-rigor-gates`).

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

**[PROPOSTA — D01] Alcance.** O ReviewBR não se limita à revisão de literatura: serve à pesquisa em geral, desde
que ela siga uma metodologia do catálogo. "Pesquisa protocolada" quer dizer duas coisas:
- cada pesquisa segue o protocolo da sua metodologia, no que ela torna obrigatório (P2); metodologia sem
  protocolo não ganha um do ReviewBR;
- toda busca, com projeto ou sem, fica registrada de forma reprodutível (P5 e o log da exploratória, acima).

Origem: "pode ser um sistema para pesquisa de uma forma geral se pudermos usar as metodologias existentes" (25/09);
"perfeito. é isso que se quer. modelo de sistematizacao de pesquisa protocolada" (26/09). A escolha está na
seção 7, pergunta 2.

## 2. Fundamentos

**Decidido (A2, aprovada em 31/10/2026).** O método do ReviewBR é descrito como se descreve uma metodologia
científica: objetivo, fundamentos, princípios, etapas, critérios de validade e limites. Os fundamentos passam pela
filosofia da ciência. O método não se apoia numa única linha teórica sem justificativa: se adotar uma, diz por que
a adota e o que ela não alcança.

**Decidido (D04, coberta em 08/11/2026).** Os fundamentos desta seção são do método da ferramenta (camada a). A
âncora científica de cada metodologia e a isenção da ferramenta são da metodologia do projeto (camada b), onde vale
o P2: segue-se o que a metodologia pede, e não se pergunta nada além do protocolo dela. São camadas diferentes, e
não há contradição.

**[PENDENTE].** Os fundamentos são leitura e escolha do Vicente; as candidatas estão na seção 7, pergunta 1.
Hoje o sistema já usa o vocabulário de uma linha só, a falsificação ("o sistema falsifica, quem afirma é quem
assimila"), sem dizer por que a adota.

## 3. Princípios

### 3.1 Decididos

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

**P6. Todo projeto declara o uso de IA; o RAISE não é norma canônica** (D07, decidido em 05/11/2026). Todo projeto
conduzido com o ReviewBR declara, no relato, onde a IA foi usada e como. Quando a metodologia escolhida, a norma de
relato ou o periódico de destino exigem mais, o projeto declara todas as informações exigidas. O RAISE não é a norma
de conformidade de todo projeto; entra como norma quando a metodologia ou o destino de publicação o exigem. O
sistema fornece, para todo projeto, o registro de onde e como a IA foi usada, por etapa e por tool, e o texto da
declaração no relato; quando exigido, os campos completos. Também decidido: o mapa de uso de IA das tools
(`registry/ai_use.ts`) é política do próprio sistema para as suas ferramentas, e não torna o RAISE norma do projeto;
a citação do RAISE 1 no `maintainer.md` fica. Origem: "todas as pesquisas que usam o reviewbr devem declarar onde
foi usado IA, como, e quando exigido, todas as informações que se pede. Levamos as metodologias a sério".

**P7. Script e agente erram: o que produzem é revisado** (A5, aprovada em 31/10/2026). Resultado produzido por
script ou por agente não funda decisão sem que o que ele produziu seja revisado. Script que confere alguma coisa só
vale como prova depois de pegar um caso conhecido (controle positivo).

**P8. Campo vazio nem sempre é erro** (A4, aprovada em 31/10/2026). A metodologia diz, campo a campo, quando o campo
se aplica; o estudo responde se a condição vale; o campo vazio só é erro quando se aplica àquele estudo; "não se
aplica" vem com o motivo, registrado como decisão do pesquisador.

### 3.2 Propostos (seção 7, perguntas 3 e 4)

**P9. [PROPOSTA — D09 e DEBT-132] Modo de agir.** O ReviewBR executa etapas assistidas com supervisão humana por
etapa. Cada etapa encerra gravando artefato, e a seguinte não abre sem decisão registrada do pesquisador com
contribuição específica. A ferramenta não produz entrega autônoma (04/10/2026, `maintainer.md`). O que isso faz,
em três níveis que não se confundem:
- **garante**, contra acidente e atalho: gate que falha fechado, verificação determinística, nada entra no corpus
  sem o protocolo que a metodologia exige, pelo caminho legítimo;
- **torna visível** a adulteração: decisão registrada com quem, quando e o quê (RV-04); funil recomputável do
  corpus; trilha de auditoria por corrida de IA;
- **não protege** contra fraude deliberada: quem tem acesso ao disco escreve nele. O autor humano responde pelo
  conteúdo, pelos métodos e pelos achados (RAISE 1, recomendação 4.1); cabe à ferramenta não deixá-lo burlar sem
  saber que está burlando. Por isso se prioriza detectar e registrar, e não prometer bloqueio impossível.

"Simplificar o modo de agir" (D09, 08/10) quer dizer tirar dele o que é próprio do PRISMA, sem deixar de ser
"bastante criterioso e rigoroso sobre como as ciências funcionam e como as pesquisas devem funcionar"; o controle
por código não se simplifica (P5). Hoje o `maintainer.md` diz "nada entra no funil sem protocolo travado", que é o
resíduo PRISMA apontado em 08/10; o texto acima o troca por "sem o protocolo que a metodologia exige" (P11).

**P10. [PROPOSTA — DEBT-101 e D01] Quando a IA faz o papel de um avaliador, o alvo é auditabilidade e variação
medida, não determinismo.** A ciência não exige que dois avaliadores humanos concordem: exige medir quanto
discordam e que um terceiro resolva. Da IA que faz esse papel (triagem, extração) o ReviewBR exige o mesmo: cada
decisão registrada com modelo e versão, data, prompt, entrada e saída; a variação medida e relatada; as
discordâncias levadas ao pesquisador. Não exige que a IA dê sempre a mesma resposta. Hoje: o registro existe
(DEBT-027, 098 e 099) e há uma função que compara duas corridas (concordância e kappa de Cohen), mas nenhuma tool
roda a triagem duas vezes e relata a concordância; a validação da IA dentro da revisão está em "O que não é fila".

**P11. [PROPOSTA — DEBT-134] A auditoria de protocolo antes da busca vale para a metodologia que exige protocolo.**
Projeto que assumiu uma metodologia passa pelo protocolo dela, auditado antes da busca e travado antes da execução,
quando a metodologia o exige. Projeto sem metodologia declarada não tem protocolo a auditar; se depois assumir uma,
passa pelo protocolo dela naquele momento, e a auditoria posterior cobre o resto. O modo de agir (P9) e o controle
por código (P5) valem para os dois. Origem: "o auditor tem a funcao de que? Se for apenas para protocolagem de
metodologias que estao sendo seguidas, ele continua nestas. Para as outras talvez nao precise de auditoria" (08/10).
Hoje: a exigência não alcança ninguém indevidamente, porque tipo de pesquisa sem método assimilado é recusado e os
dois métodos instalados exigem protocolo.

## 4. Etapas

**[PROPOSTA]** Montadas só com o que já está decidido; a origem vai em cada etapa. Pelo P1, são mais simples do que
a trilha de qualquer metodologia e não repetem as etapas de nenhuma.

1. **Exploração (opcional).** Busca sem projeto, para entender o campo e formular o objeto. Não entra no corpus de
   projeto nenhum; o log é mantido (12/11).
2. **Escolha da metodologia.** O ReviewBR sugere a mais adequada a partir das entradas, dizendo o porquê (A7, 12/11);
   o pesquisador escolhe. O protocolo grava o método, a fonte oficial e a data de leitura (FILA, linha 8, item 5).
3. **Protocolo da metodologia.** Pede o que ela torna obrigatório, registra a escolha no que é opcional e não faz
   pergunta que o protocolo dela não tem (P2). Auditoria e trava antes da busca quando ela as exige (P11).
4. **Execução da trilha da metodologia,** etapa por etapa, no modo de agir (P9), com o controle por código (P5) e o
   registro do uso de IA por etapa e por tool (P6).
5. **Relato,** pela norma de relato da metodologia, com o formulário oficial preenchido pelo pesquisador (FILA,
   linha 8, item 3), e com a declaração de onde e como a IA foi usada (P6).

Hoje:
- só duas metodologias têm trilha executável (`prisma-sr` e `scoping-prisma-scr`); as demais entradas do catálogo
  apontam a fonte;
- nenhuma tool lê o `MAPA.md`: a sugestão vem do `assess_research_design`, pelos métodos que servem ao tipo de
  pesquisa (`serves_research_types`);
- as 106 entradas do catálogo estão sem data de leitura (`read_at`).

## 5. Critérios de validade

**Decidido (A6, aprovada em 31/10/2026).** Metodologia reconhecida pela ciência não é verificada de novo pelo
ReviewBR. O olhar se volta para a aplicação da metodologia, e é o estudo que a aplica que passa por testes.

**Decidido (A8, aprovada em 31/10/2026).** Um estudo pode cumprir a forma da metodologia e ser falso, inclusive se
for preenchido por IA. A conferência do mapeamento não pega isso, porque confere a transcrição da metodologia, e
não o estudo. Quem pega são as conferências do próprio estudo: o protocolo travado antes da busca; os números que
saem do processo gravado; a origem rastreável de cada estudo incluído; a citação com página. Na fase de testes
entra, como controle no nível do estudo, um estudo falso preenchido por IA, para medir o que o sistema percebe.

**[A CONFERIR — critério de credibilidade do D07, redação do acompanhamento de 05/11/2026].** A credibilidade de
uma pesquisa feita com o ReviewBR não vem só de declarar o uso de IA. Vem também de o produto poder ser conferido
por quem lê:
- protocolo travado antes da busca (RV-01);
- números que emergem do processo e podem ser recomputados (RV-02, RV-05);
- nada inventado onde falta dado (RV-03);
- decisões registradas com autor, data e fundamento (RV-04);
- origem de cada dado rastreável até a fonte (RV-08);
- aplicação da metodologia conferida a cada uso (A6).

O pesquisador responde pelo resultado. Onde o sistema ainda não confere isso por código, o backlog registra.
Origem: "ignore a frase ou a reformule para se adequar a critérios científicos que foi pensado" (05/11), sobre
"credibilidade também se sustenta a partir do que as pesquisas produzem" (08/10).

**[PROPOSTA — "quem verifica o verificador?", resposta do acompanhamento de 04/11/2026].** Nenhum verificador se
certifica sozinho. O que dá segurança à ferramenta:
1. teste com resposta conhecida antes de usar um conferidor como prova: um erro que ele tem de pegar e um acerto
   que ele não pode acusar;
2. independência: quem confere não é quem produziu; duas leituras independentes que concordam valem mais que uma;
3. evidência à vista: toda conclusão cita o trecho, o arquivo e a fonte, e qualquer pessoa pode refazer a
   conferência;
4. simplicidade: o conferidor é simples o bastante para uma pessoa lê-lo inteiro; heurística e IA servem de
   alerta, não de prova;
5. decisão final de uma pessoa, que olha onde as conferências independentes divergem ou onde um teste falhou.

## 6. Limites

**Decididos.**
- O ReviewBR não valida metodologia (A6) e não prova que um estudo é verdadeiro: a forma cumprida não pega estudo
  falso (A8).
- O RAISE não é a norma de conformidade de todo projeto (P6).
- O mapeamento dos itens das normas para o sistema é do sistema e não foi conferido contra a fonte; o pesquisador
  preenche o formulário oficial da norma (12/11, FILA linha 8, item 3).

**[PROPOSTA]** O ReviewBR não protege contra fraude deliberada de quem tem acesso ao disco (P9, terceiro nível).

**[PROPOSTA — posição sobre o RAISE 3].** O RAISE 3 dá como não aceitável:
- (a) a síntese agêntica de ponta a ponta: agentes que executam passos semelhantes aos da síntese de evidência,
  *"with or without human input/refinement at each stage"*, podendo chegar a um relatório que resume os achados
  entre os estudos incluídos;
- (b) o uso de LLM para sintetizar, e não só resumir, resultados entre estudos.

Como o RAISE não é canônico (P6), isso não é exigência de conformidade de todo projeto: é limite que o ReviewBR
adota para as suas ferramentas, como o mapa de uso de IA já faz. A posição proposta:
1. a síntese de resultados entre estudos é do pesquisador, ou de método estatístico que ele escolhe; o LLM pode
   resumir cada estudo e redigir a partir da síntese do pesquisador, citando estudo e página, mas não sintetiza
   entre estudos;
2. cada etapa é uma ferramenta separada, com a sua categoria no mapa de uso de IA, como o RAISE 3 recomenda avaliar
   plataformas integradas;
3. a decisão registrada do pesquisador a cada etapa (P9) não basta para ficar fora de (a), porque o RAISE 3 inclui
   o caso com intervenção humana em cada etapa; o que deixa o ReviewBR fora é o item 1.

Hoje: nenhuma tool do mapa de uso de IA tem a categoria "não aceitável" (C5), e o bloqueio dela nunca dispara; a
síntese entre estudos (F7 do `prisma-sr`) e o manuscrito (F8) estão com o agente `analyst`, que se descreve como
quem sintetiza os achados, e o mapa cobre tools, não agentes. Fonte: RAISE 3, *Living guidance for selecting and
using AI evidence synthesis tools*, DRAFT Version 4.0, 23/09/2026, OSF (`https://osf.io/download/kd9q5/`), Tabela 2;
lida em 05/11/2026 (`.claude/maintenance/revisao_decisoes_2026-10-31/d07_raise_fontes_2026-11-05.md`).

## 7. O que falta: as escolhas do Vicente

Cada resposta muda o texto da seção indicada; o resto do documento não se reabre.

**1. Fundamentos (seção 2).** Escolha uma ou mais, ou indique outra. A A2 pede que, se for uma só linha, o texto
diga por que e o que ela não alcança. As referências abaixo foram dadas de memória e não foram lidas nesta sessão:
a edição se confere antes de entrar no texto.
- **Popper, Karl R.** *The Logic of Scientific Discovery.* Londres: Hutchinson, 1959 (original: *Logik der
  Forschung*, Viena: Springer, 1934). Uma hipótese é científica se pode ser refutada por um teste fixado antes.
  Sustentaria: o protocolo travado antes da busca e o vocabulário que o sistema já usa ("o sistema falsifica").
  Não alcança: a dimensão social da conferência.
- **Merton, Robert K.** "The Normative Structure of Science" [1942]. In: *The Sociology of Science: Theoretical and
  Empirical Investigations.* Chicago: University of Chicago Press, 1973, p. 267–278. O ethos da ciência:
  comunalismo, universalismo, desinteresse e ceticismo organizado. Sustentaria: evidência à vista, origem
  rastreável, números recomputáveis e a isenção da ferramenta. Não alcança: é descrição normativa, não critério
  de teste.
- **Longino, Helen E.** *Science as Social Knowledge: Values and Objectivity in Scientific Inquiry.* Princeton:
  Princeton University Press, 1990. A objetividade vem da crítica entre pares, com padrões públicos. Sustentaria:
  quem confere não é quem produziu, e a decisão final de uma pessoa onde as conferências divergem (seção 5). Não
  alcança: trata de comunidades, não de um procedimento.
- **Mayo, Deborah G.** *Error and the Growth of Experimental Knowledge.* Chicago: University of Chicago Press, 1996.
  Um teste só conta se teria acusado o erro caso ele existisse (teste severo). Sustentaria: o controle positivo
  (P7), o zero que só vale com controle e o estudo falso como controle (A8). Não alcança: nasce da inferência
  experimental e estatística.

**2. D01 (seção 1).** (a) "Metodologias existentes" quer dizer qualquer uma do catálogo (que aponta a fonte) ou
só as que têm trilha executável (hoje duas)? (b) "Pesquisa protocolada" é o que a proposta diz (protocolo da
metodologia e toda busca registrada) ou protocolo travado em toda pesquisa? Consequência: (b) decide se uma busca
simples, sem metodologia, cabe no ReviewBR fora da exploração.

**3. D09 (P9).** "Simplificar o modo de agir" é só tirar dele o que é próprio do PRISMA (proposta) ou também reduzir
as regras ao mínimo comum a toda metodologia? O controle por código não entra na escolha (P5).

**4. Os três princípios vindos do backlog (P9, P10, P11).** Aprovar, corrigir ou recusar cada texto.

**5. Critérios de validade (seção 5).** Conferir o critério de credibilidade do D07 e a resposta a "quem verifica
o verificador?".

**6. RAISE 3 (seção 6).** Aprovar a posição, em especial o item 1: quem sintetiza resultados entre estudos é o
pesquisador (ou a estatística), e não o LLM. Consequência, se aprovado: o texto do agente `analyst` e o mapa de uso
de IA ficam em desacordo com o método, e isso vai à fila quando o Vicente pedir.
