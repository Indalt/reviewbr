# Revisão de decisões — 31/10/2026

> **Arquivo de conferência, não de fundamento.** Pela regra 4 do "Como trabalhar" do
> `PLANO_sessoes_2026-10-29.md`, a decisão do Vicente vai ao disco escrita em forma precisa e autoexplicativa,
> e uma redação que reinterpreta o que ele disse passa por ele antes de ser gravada. Este arquivo guarda as
> redações propostas. Cada uma vai para o fundamento (plano, achado, `maintainer.md`) depois do "ok" dele, e
> o veredito fica registrado aqui. Cada item traz quatro partes:
> - **Estado**: se já foi aprovado ou ainda está a conferir.
> - **Texto proposto**.
> - **Origem**: as palavras dele, só como fonte.
> - **Precisão do acompanhamento**: o que é acréscimo nosso, para ele aprovar ou cortar.

## A. Considerações e decisões do Vicente em 31/10/2026

### A1. O método do ReviewBR e as trilhas das metodologias

**Estado:** o conteúdo foi aprovado ("ok"). Ele pediu um texto "descritivo e assertivo, para trazer a
complexidade necessária", e o texto abaixo foi reescrito assim; falta conferir a nova redação.

**Texto proposto:** O PRISMA é um conjunto de metodologias entre outras, e o ReviewBR não impõe a trilha dele
a nenhuma pesquisa (decisão de 29/10/2026). Isso não acaba com as trilhas.
- Cada metodologia científica define as etapas que pede e o que pede em cada uma. Por isso cada uma gera a
  sua própria trilha: a revisão sistemática do PRISMA gera uma, a revisão de escopo gera outra, e uma
  metodologia qualitativa geraria uma terceira.
- Método pode ser tão diverso que chega a ser individual. O ReviewBR tem o seu, que é o método da ferramenta.
  Foi esse método, construído sobre uma metodologia científica (o PRISMA), que deu origem ao percurso F0–F8.
- Para funcionar com qualquer metodologia, o método do ReviewBR precisa ser mais simples do que a trilha de
  cada uma delas. Ele não pode repetir as etapas de uma metodologia em particular.

Esta consideração soma-se à de 29/10, não a substitui. As duas juntas orientam a sessão 6 para um caminho
mais simples e funcional.

**Origem:** "não vai mais ter uma trilha baseada no prisma … isso não quer dizer que não tenhamos que ter
trilhas, até porque cada método pode gerar uma trilha diferente … o reviewbr pode ter o seu método, inclusive
baseado em alguma metodologia científica … o que nos gerou esse modo de ir de f0 a f8 … para que ele
funcione em qualquer metodologia talvez precise ser mais simples … mais uma pontuação … e não uma
substituição".

**Precisão do acompanhamento:** "talvez precise" virou "precisa", porque ele pediu um texto assertivo.

### A2. O método do ReviewBR é descrito como se descreve uma metodologia

**Estado:** a conferir.

**Texto proposto:** O método do ReviewBR, que é o da ferramenta e é distinto das metodologias que ela conduz,
é descrito como se descreve uma metodologia científica: objetivo, fundamentos, princípios, etapas, critérios
de validade e limites. Os fundamentos passam pela filosofia da ciência. O método não se apoia numa única linha
teórica sem justificativa: se adotar uma, diz por que a adota e o que ela não alcança.

**Origem:** "o metodo reviewbr tem de ser muito bem descrito do jeito que toda a metodologia normalmente se
descreve. isso é um ponto que passa pelas filosofias da ciencia (não usar apenas uma linha teorica, ou se
usar, dizer porque usa)".

**Precisão do acompanhamento (exemplo, não decisão):** o sistema já usa o vocabulário de uma linha só, a
falsificação ("o sistema falsifica, quem afirma é quem assimila"), sem dizer por que a adota.

### A3. Duas camadas, nomeadas sem ambiguidade

**Estado:** proposta do acompanhamento, em resposta à pergunta dele ("o campo da trilha do método do
reviewbr, ou o campo do método que está sendo usado? isso tem de ficar muito claro"); a conferir.

**Texto proposto:** Todo texto do sistema distingue duas camadas:
- (a) o método do ReviewBR, que vale para toda pesquisa;
- (b) a metodologia escolhida para o estudo, com a sua trilha e os seus campos.

"Campo da trilha" é sempre campo da metodologia escolhida. Hoje os campos F0.1.1 a F8.4.3 são do prisma-sr, e
a revisão de escopo os usa por `extends`. O método do ReviewBR ainda não está descrito à parte, e por isso as
duas camadas se confundem; a descrição pedida em A2 é o que resolve isso.

### A4. Campo vazio nem sempre é erro

**Estado:** a conferir. O texto anterior foi reescrito para dizer de quem é o campo.

**Texto proposto:** Um campo da trilha da metodologia escolhida que fica vazio nem sempre é erro.
- A metodologia diz, campo a campo, quando o campo se aplica. Exemplo: no prisma-sr, o método de pooling
  (F7.1.5) só se aplica se houver meta-análise.
- O estudo responde se a condição vale.
- O campo vazio só é erro quando se aplica àquele estudo.
- "Não se aplica" vem com o motivo, registrado como decisão do pesquisador.

Situação hoje: a especificação do prisma-sr já diz isso em texto ("✅ se meta-análise", "N/A +
justificativa"). Mas nenhuma tool confere o preenchimento da trilha: quem confere é o agente, pela camada 2
da skill prisma-rigor-gates. E essas condições não se ligam à resposta registrada do pesquisador.

**Origem:** "no f8 o checklist de um projeto (estudo) preencheu ou nao um campo … não preencher um campo da
nossa trilha nem sempre pode ser erro".

**Precisão do acompanhamento:** o mecanismo do item condicional da sessão 2a ("o método declara a condição, o
estudo responde") pode ser estendido dos itens da norma aos campos da trilha.

### A5. Script e agente erram: o que produzem é revisado

**Estado:** a conferir.

**Texto proposto:** Script e agente erram, e o próprio ReviewBR já mostrou isso:
- o medidor de uso contava em dobro (DEBT-148);
- o conferidor de citações da 2b não conferia a atribuição;
- a conferência automática do mapeamento se declarava capaz de detectar erro sem ser.

Por isso:
1. Resultado produzido por script ou por agente não funda decisão sem que o que ele produziu seja revisado.
2. Script que confere alguma coisa só vale como prova depois de pegar um caso conhecido (controle positivo).

**Origem:** "Scripts podem cometer erro? se sim, nao é confiável deixar na mão deles sem revisar o que é
produzido a partir deles." O ponto 2 é a regra que ele já aplica nas buscas: zero resultado só vale se a
ferramenta acha o que se sabe que existe.

### A6. Não se reverifica metodologia validada; o foco é a aplicação

**Estado:** a conferir.

**Texto proposto:** Metodologia reconhecida pela ciência não precisa ser verificada de novo pelo ReviewBR: o
PRISMA, o PRISMA-ScR e as demais normas assimiladas já foram validadas. O olhar se volta para a aplicação da
metodologia, e é o estudo que aplica a metodologia que passa por testes.

**Origem:** "como estamos trabalhando apenas com metodos reconhecidos pela ciencia, eu tenho minhas duvidas
sobre a necessidade de verificar um metodo ja verificado. o olhar deveria se voltar para a aplicacao da
metodologia? … a analise do projeto (estudo) que aplica a metodologia é quem deveria passar por testes".

**Precisão do acompanhamento:** entre a metodologia validada e o estudo há uma terceira coisa, que é obra nossa:
a transcrição da metodologia para a ferramenta, isto é, a trilha e o mapeamento dos itens da norma para os
campos. Essa transcrição já teve erros: 58 ponteiros no PRISMA-S e 23 no PRISMA 2020, achados lendo a norma,
e não por falha da norma. Ela se verifica uma vez, ao assimilar ou ao mudar, e não a cada estudo.

### A7. O propósito da ferramenta: apresentar, guiar, ensinar

**Estado:** a conferir.

**Texto proposto:** A ferramenta:
1. apresenta ao usuário as metodologias que podem servir ao projeto (estudo, pesquisa);
2. depois da escolha, guia o estudante para que ele responda, com o projeto, o que a metodologia escolhida pede;
3. faz isso com um guia compreensivo, capaz de identificar que a metodologia escolhida não é a melhor para o
   projeto;
4. é educativa por natureza: o estudante melhora a compreensão do método de que precisa, do método que vai usar
   e, por consequência, de como as ciências funcionam.

**Origem:** a resposta dele à pergunta sobre a capacidade da conferência automática, em 31/10.

**Precisão do acompanhamento:** o DEBT-145 fala em "trava" na escolha de método. Guiar e ensinar não é
travar, e o enquadramento do DEBT-145 deve ser reconferido à luz deste propósito, na sessão 6.

### A8. Estudo falso como controle na fase de testes

**Estado:** aprovado ("ok", 31/10).

**Texto:** Um estudo pode cumprir a forma da metodologia e ser falso, inclusive se for preenchido por IA. A
conferência do mapeamento não pega isso, porque confere a transcrição da metodologia, e não o estudo. Quem pega
são as conferências do próprio estudo:
- o protocolo travado antes da busca;
- os números que saem do processo gravado;
- a origem rastreável de cada estudo incluído;
- a citação com página.

Na fase de testes entra um controle no nível do estudo: um estudo falso preenchido por IA, para medir o que o
sistema percebe.

## B. Redefinição proposta para a sessão 2c (a decidir)

Os itens A5 a A7 mudam a 2c.

**O que a 2c deixa de ser:** um trabalho de uma a duas sessões para tornar a conferência por palavras forte e
honesta e usá-la como trava. O ganho seria limitado, porque comparação de palavras não pega erro sem palavra
em comum.

**O que a 2c passa a ser:**
1. **A conferência por palavras sai da trava.**
   - Os suspeitos dela viram ajuda para quem assimila a metodologia, e nunca bloqueiam o estudo.
   - O relatório diz o que ela é e quanto enxerga, por exemplo: "percebeu 30 de 885 trocas propositais".
   - O porquê de cada etapa continua sendo mostrado ao estudante.
   - Os 4 suspeitos do PRISMA-ScR deixam de travar, e os dois projetos de escopo destravam na F8. O PRISMA
     2020 continua reprovado pelos 21 itens esquecidos (DEBT-014), e não por suspeito.
2. **A transcrição passa a ser conferida ao assimilar a metodologia.**
   - Cada ponteiro (campo → item da norma) traz o trecho do texto oficial do item que o campo atende.
   - Um script testado com controle positivo confere que o trecho é literal e pertence àquele item.
   - A leitura é revisada; quem revisa é a decisão 2, abaixo.
3. **Ordem:** começa pelo PRISMA-ScR e pelo PRISMA-S, que os projetos usam. O PRISMA-P vem depois, e o PRISMA
   2020 junto com o remapeamento do DEBT-045.

**Efeito sobre a decisão de 30/10 (DEBT-149):**
- O ponto (1) muda: a conferência não se declara capaz de nada; diz o que é e quanto enxerga.
- O ponto (4), texto completo e equivalências por norma, sai.
- O ponto (2), suspeito examinado fica registrado, fica e passa a valer na assimilação.
- O ponto (3), a trava da escolha de método considera só item esquecido, fica.

**Decisões pendentes:**
1. Aprova a redefinição?
2. Quem revisa a leitura documentada?
   - (a) Uma segunda leitura independente, feita por um agente que não vê a primeira; o Vicente revisa só as
     divergências. **Recomendada.**
   - (b) O Vicente revisa todos os ponteiros (cerca de 400 nas 4 normas).
   - (c) O Vicente revisa uma amostra.

## C. Decisões antigas gravadas sem precisão

Levantamento em curso desde 31/10, com 7 agentes em só leitura sobre o plano, os DECISOES e o backlog. As
redações propostas e a conferência de fidelidade de cada uma serão acrescentadas aqui.
