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

> **Vereditos dele, 31/10 (depois desta redação).** A1 a A6 e A8: "ok". O "Estado" de cada item abaixo é de
> antes do veredito.
>
> **A7 corrigido por ele:** "ensinar não é o propósito. o propósito é aplicar com certeza científica e
> publicável como um guia. o que eu disse é que há aprendizado quando se faz e quando um guia ajuda a escolher
> dizendo o porquê". Texto a conferir:
>
> *O propósito do ReviewBR é aplicar a metodologia escolhida com certeza científica, de forma publicável,
> funcionando como um guia. O aprendizado é consequência, não propósito: aprende-se ao fazer, e quando o guia
> ajuda a escolher a metodologia dizendo o porquê.*
>
> **A9, novo, dele:** "Assimilar uma metodologia deve ser uma tarefa com transcrição precisa e descrição."
>
> **Pergunta dele, a responder na volta:** "quem verifica o verificador? o que de fato pode nos dar segurança
> enquanto ferramenta?" (sobre o A5: script e agente erram).

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

**Como foi feito (31/10):** 4 agentes leram, só lendo, o plano, os DECISOES, os documentos de direção, o
`maintainer.md` e os 40 achados do backlog que citam decisão do Vicente. Um quinto juntou tudo em uma linha por
decisão. Dois agentes independentes conferiram cada redação proposta contra o registro e contra as transcrições
originais das conversas.

A lista completa, com a redação proposta, o que só o Vicente responde e o veredito da conferência, está em
`revisao_decisoes_2026-10-31/lista_decisoes.md`. O resultado bruto está em `resultado_agentes.json`, na mesma
pasta.

**Números:**
- 41 decisões gravadas sem precisão: 17 de fundação, 14 operacionais e 10 menores.
- 31 superadas por decisão posterior.
- Cerca de 105 já precisas.
- Na conferência, 31 propostas foram ajustadas e 10 saíram fiéis.

### C.1 Como a imprecisão aconteceu — quatro padrões

1. **Resposta curta gravada como aprovação do conteúdo.** Um "sim", "ok" ou "sim para todas" respondia a outra
   coisa (D11, D15, D29, D30). Exemplos:
   - D11: o "sim" de 08/10 respondia "quer que eu registre isso como achado?" e foi gravado como aprovação do
     desenho "agentes por papel".
   - D29, D30 e D39: o "sim para todas" de 29/10 respondia às perguntas como foram feitas no chat, e não às
     recomendações mais longas do `RECLASSIFICACAO_fila_2026-10-18.md`.
2. **Leitura do agente que passou a valer como "já decidido" sem ser conferida** (D08, D10, D14 e D13, este no
   ponto "perguntada na F1", que é do acompanhamento, de 30/10).
3. **Citação cortada, ou pergunta gravada como afirmação** (D03, D12, D21, D25).
4. **Datas trocadas:** falas de 08/10 gravadas como de 04/10 (D41: DEBT-037, 126, 127, 131, 132 e a DIRECAO §4).

### C.2 O que pesa nas próximas sessões

- **2c:** nenhuma decisão antiga a bloqueia. Só as duas decisões da parte B.
- **2d (escopo como método completo):** **D14**. "Escopo sem `extends`, com spec própria" foi derivado pelo
  agente da frase "cada metodologia com as suas regras", e ele nunca respondeu a esse ponto. Em 09/10 ele
  tinha aceitado encarar cada método na sua completude "mesmo que no código sobre o método isso seja
  repetido". Precisa de resposta antes de a 2d abrir.
- **3 (funil e gates):** D29. O "sim" da pergunta 3 é bloquear a exportação quando o funil diverge.
- **4 (busca e triagem):**
  - D30: o código grava o log de busca PRISMA-S — construir já, ou só declarar e enfileirar?
  - D39: o plano da sessão 4 inclui "dedup com DOI/acentos", que vem da recomendação do .md e vai além do
    que ele aprovou.
- **5 (leitura e governança):** D39 (perguntas 8 e 9) e D06 (o que é o RV-04 "estar no código", e os
  "ensaios").
- **6 (sair do esqueleto PRISMA), junto com A1–A4 e A7:**
  - D17 e D09: o que a ferramenta mantém de comum a todo método — só o modo de agir, ou um método próprio
    mais simples.
  - D11: agentes por papel.
  - D12: a lista da abertura do projeto oferece métodos e tipos.
  - D13 e D02: campo em branco e "omissão declarada".
  - D15: o critério da trava do DEBT-145.
  - D10, D16, D01, D04 e D05: rigor, validação, protocolo, âncora científica e "assimilada completa".
- **Fase de testes:** D18 (critério de entrada).

### C.3 Para saber já

- **Recusas a rever (D03).** Em 04/10, 14 achados foram recusados por um critério tirado de uma frase dele
  cortada ("o reviewbr não prejudicando uma pesquisa", sem "não focar em uma pesquisa qualquer em particular").
  Entre eles, o DEBT-041 e o DEBT-072 contrariam as decisões 5 e 3 dele de 27/09, e não há registro de que ele
  tenha visto essa reversão. Pelo contexto que a conferência achou, o critério valia só para a classe
  "exagero" da triagem daquele dia.
- **Regra generalizada sem ele (D02).** A regra "omissão declarada é método, omissão silenciosa é falha" é
  formulação do agente, de 03/10, sobre a busca sem projeto. Em 08/10 virou regra do modo de agir de toda
  pesquisa sem passar por ele, e toca o A4 (campo em branco).
- **"Não se aplica" pelo projeto (D13).** A recomendação de 17/10 deixava o próprio projeto declarar "não se
  aplica". A paráfrase confirmada com "ok" a inverteu: hoje só o método declara a condição. Isso toca
  diretamente o A4.
- **Superada, mas não executada:** a citação do RAISE 1 continua em `maintainer.md:30`, embora a decisão 6 de
  08/10 a tire do modo de agir.
- **Correções só de fato,** que o acompanhamento faz depois do "ok" desta revisão sem reinterpretar nada: as
  datas trocadas (D41).
