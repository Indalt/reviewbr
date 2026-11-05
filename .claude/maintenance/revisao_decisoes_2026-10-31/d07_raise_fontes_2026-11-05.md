# D07 — quando o RAISE vale num projeto: perguntas do Vicente e respostas com fonte (05/11/2026)

## Por que este arquivo existe

Perguntas do Vicente, 05/11/2026, à tarde, nas palavras dele: *"é obrigatório em qualquer pesquisa que use IA em
alguma das suas etapas? o que é o uso de IA? o uso de uma página de pesquisa que usa IA também é considerada um uso
que pede RAISE? se considerar canônico pra qualquer pesquisa nenhuma pesquisa atual sai sem RAISE?"*

E a condição dele: *"a redação proposta em 08/10 é certa se o questionamento acima for respondido com qualidade"*.
A redação proposta está no D07 de `lista_decisoes.md`.

As respostas abaixo se apoiam só nos trechos citados no fim, tirados das fontes oficiais em 05/11. Onde a fonte
não diz, a resposta diz que não diz.

## Fontes consultadas em 05/11/2026

| fonte | versão | como foi lida |
|---|---|---|
| RAISE 1: *Living recommendations for practice* | "DRAFT FOR CONSULTATION AND REVISION Version 4. 23 September 2026" | PDF do OSF (`https://osf.io/download/d5ajy/`), texto extraído com `pdftotext -layout` |
| RAISE 3: *Living guidance for selecting and using AI evidence synthesis tools* | "DRAFT Version 4.0: 23 September 2026" | PDF do OSF (`https://osf.io/download/kd9q5/`), texto extraído com `pdftotext -layout` |
| Declaração conjunta de Cochrane, Campbell, JBI e CEE sobre uso de IA em síntese de evidência | 2025 (publicada nos quatro periódicos em novembro de 2025) | texto completo pela Europe PMC (`https://www.ebi.ac.uk/europepmc/webservices/rest/PMC12603384/fullTextXML`), lido pelo WebFetch. O PMC pede captcha |

Para reproduzir os PDFs:
```
curl -sL -o r.pdf <url>
pdftotext -layout r.pdf r.txt
grep -n -i "<trecho>" r.txt
```

Os PDFs não vão ao repositório, porque são documentos de terceiros. Os trechos vão.

## Respostas

### 1. É obrigatório em qualquer pesquisa que use IA?

**Não. O RAISE é recomendação, e ainda rascunho para consulta** (versão 4, 23/09/2026).

Nem as quatro organizações que o criaram o tornaram obrigatório. A declaração conjunta delas diz que *"The group
officially supports the aims of RAISE"* e recomenda a versão mais atual. Não usa "mandatory" nem "required" para o
RAISE.

O que essas quatro exigem, para revisões publicadas com elas, são os próprios itens da declaração:
- o autor responde pela síntese (1.1);
- o uso de IA é justificado, com demonstração de que a ferramenta é metodologicamente sólida (1.3);
- *"Authors should declare when they have used AI if it makes or suggests judgements"* (2.2), informando:
  - nome, versão e datas da ferramenta;
  - finalidade e etapas afetadas;
  - justificativa;
  - interesses;
  - limitações (2.3a–e).

Fora dessas quatro, quem obriga é o destino da publicação:
- o próprio RAISE 1 manda seguir os padrões de relato, como o PRISMA, que *"includes items on reporting
  automation tools used at different stages of the synthesis process"* (4.9);
- e manda seguir as políticas do periódico (4.9);
- segundo o catálogo (`icmje-ai`), os periódicos que seguem o ICMJE exigem declarar qualquer uso de tecnologia
  assistida por IA, até na escrita.

**Em resumo: declarar o uso de IA é exigido em quase todo lugar. O RAISE inteiro não é exigido, por si só, em
lugar nenhum.**

### 2. O que é uso de IA?

**Para o RAISE, "IA" tem definição larga** (RAISE 1):
- aprendizado de máquina;
- processamento de linguagem natural;
- sistemas especialistas por regras que imitam decisão humana;
- aprendizado profundo, com os LLMs;
- IA generativa.

O próprio RAISE 1 avisa que, em cada recomendação, o termo vale para a classe de tecnologia de que ela trata, e não
para toda IA indistintamente.

**O que precisa ser declarado é o uso substancial** (4.8): *"AI used to shape research methods, the evidence base
or intellectual direction"*. O RAISE 1 lista:
- elegibilidade dos estudos;
- avaliação crítica e risco de viés;
- extração;
- síntese de dois ou mais estudos;
- certeza da evidência;
- texto que resume a força da evidência e as implicações;
- resumos em linguagem simples.

Não é uso substancial:
- *"basic writing support"*, no RAISE 1;
- correção de ortografia, gramática ou estrutura, na declaração conjunta.

### 3. Uma página de pesquisa que usa IA conta?

**Conta quando a IA decide o que entra na base de evidência.** É o critério do RAISE 1: *"shape … the evidence
base"*. O RAISE 3 trata da busca com IA:

- **Plataformas de busca por agente** (Elicit, Undermind, Asta), que montam e executam a busca e devolvem uma lista
  curta:
  - *"should not be relied upon as part of any formal evidence retrieval"*;
  - categoria *Exploratory and supplementary use*;
  - numa comparação, o Elicit achou menos de 40% dos artigos relevantes.
  - Usada como busca suplementar, molda a base de evidência e se declara.
- **LLM gerando termos de busca:** *"only suitable for exploratory use"*.
- **Tradução da estratégia entre bases por LLM:** *"every translation requires line-by-line specialist checking"*.
- **Ferramentas por regra** (frequência de termos, analisador de MeSH): aceitáveis, como complemento do
  especialista.
- **Base tradicional com IA interna**, como a ordenação por relevância do PubMed ou a indexação automática: **o
  RAISE não trata disso.** Leitura do acompanhamento, a partir do critério do RAISE 1:
  - se a busca booleana roda e o conjunto inteiro é triado, a IA da base só ordena e não decide o que entra.
    Relata-se a base, a plataforma, a data e a estratégia, como o PRISMA-S já pede;
  - se o pesquisador para nos primeiros N resultados ordenados pela IA, como costuma acontecer no Google
    Acadêmico, a IA decidiu o que entrou, e o uso se declara.

### 4. Se o RAISE for canônico para toda pesquisa, nenhuma sai sem ele?

**Sim, e com uma consequência mais pesada.**

Toda pesquisa feita com o ReviewBR usa IA em etapas que moldam o método e a base de evidência:
- os agentes redigem o protocolo e as estratégias de busca;
- a triagem e a extração podem ser feitas por LLM.

Logo, todas estariam no escopo do RAISE.

Além disso, o RAISE 3 v4 dá como *Not acceptable for use* duas coisas:
- *"Agentic end-to-end evidence synthesis"*: *"AI agents perform steps which appear similar to the evidence
  synthesis process, with or without human input/refinement at each stage"*;
- o uso de LLM para sintetizar, e não só resumir, resultados entre estudos.

Com o RAISE canônico, o ReviewBR teria de demonstrar, em toda pesquisa, que não é síntese agêntica de ponta a
ponta. Isso exige duas coisas:
- cada etapa tratada como ferramenta separada, com a sua categoria, como o RAISE 3 recomenda avaliar plataformas
  integradas como o EPPI Reviewer;
- a síntese entre estudos feita por gente ou por estatística, não por LLM.

Isso é questão da descrição do método do ReviewBR (sessão M), não achado. O sistema não afirma cumprir o RAISE
(DEBT-094, recusado em 05/11).

### O mapa de uso de IA (`registry/ai_use.ts`) hoje

**O mapa não é só vocabulário.** Ele dá a cada tool de IA a categoria do RAISE 3 e age conforme a categoria:
- categoria C5 (*Not acceptable*) **bloqueia sempre**;
- categoria C3 exige limiar de validação no protocolo;
- categorias C2 e C4 passam, com aviso do que o pesquisador precisa fazer.

Isso aplica o RAISE 3 a toda pesquisa, na parte das tools. As duas saídas possíveis estão na redação abaixo.

## Redação do D07 proposta pelo acompanhamento (a conferir pelo Vicente)

> **D07 — o RAISE num projeto.**
> - **O RAISE não é norma canônica do ReviewBR.** Não sustenta as regras que valem para toda pesquisa, e não é o
>   instrumento pelo qual o sistema afirma a credibilidade do trabalho feito com IA (08/10).
> - **É recomendação viva, ainda em rascunho para consulta** (versão 4, 23/09/2026). As organizações que o criaram
>   *apoiam os seus objetivos*, sem torná-lo obrigatório (declaração conjunta de 2025).
> - **Entra num projeto como norma quando a metodologia escolhida ou o destino de publicação o exige** (opção B de
>   08/10).
> - **O uso de IA se declara em todo projeto, independentemente do RAISE.** Todo projeto feito com o ReviewBR usa
>   IA, e declarar esse uso é exigido pelas normas que o projeto já segue (PRISMA 2020, nos itens de ferramentas
>   de automação; PRISMA-S, para as fontes de busca) e pelas políticas dos periódicos. Por isso o sistema registra
>   e mostra o que a IA fez em cada etapa.
> - **O mapa de uso de IA fica como política do próprio sistema para as suas tools de IA.** O sistema não oferece
>   uso que o RAISE 3 dá como inaceitável, e exige validação onde ele a exige, porque é o melhor dado disponível
>   sobre o desempenho dessas ferramentas. Isso não torna o RAISE norma de conformidade do projeto. *Alternativa:
>   rebaixar o mapa a aviso, sem bloquear.*
> - **"Credibilidade também se sustenta a partir do que as pesquisas produzem":** a consequência operacional vai
>   à descrição do método do ReviewBR (sessão M), junto com a classificação do RAISE 3 sobre síntese agêntica de
>   ponta a ponta e sobre síntese por LLM.

## Trechos das fontes (literais)

### Declaração conjunta, 2025

Lida pela Europe PMC, por extração automática do WebFetch. Confira no original antes de citar em publicação.

- *"The group officially supports the aims of RAISE"*
- *"We recommend that the most up‐to‐date version of RAISE"* (trecho)
- 1.1 *"An author is accountable for the content, methods, and findings of their evidence synthesis"*
- 1.3 *"Use of AI should be justified and should involve demonstrating that the tools are methodologically sound"*
- 2.2 *"Authors should declare when they have used AI if it makes or suggests judgements"*, *"such as in relation
  to the eligibility of a study, appraisals (including risk of bias assessments), extraction of bibliographic,
  numerical or qualitative data from a study or its results, synthesis of data from two or more studies,
  assessments of the certainty of evidence (including GRADE domains or overall certainty ratings for an outcome
  or finding), drafting text that summarizes the overall strength of evidence, related implications for
  decision making or research, or plain language summaries."*
- *"Generally, AI used to improve spelling, grammar, or manuscript structure does not need to be listed"*
- Definição: *"advanced technologies that enable machines to do highly complex tasks effectively … which would
  require intelligence if a person were to perform them."*; *"This ranges from general automation applications,
  such as rule‐based or trained machine learning algorithms"*
- Busca: a declaração não trata de busca.

### RAISE 1, versão 4

- *"DRAFT FOR CONSULTATION AND REVISION Version 4. 23 September 2026"*
- 4.8 *"Declare substantial use of AI, which includes AI used to shape research methods, the evidence base or
  intellectual direction. This may include decisions regarding eligibility of a study, critical appraisal
  (including risk of bias assessments), extraction of bibliographic, numerical or qualitative data about a study
  or its results, synthesis of data from two or more studies, assessments of the certainty of evidence (including
  GRADE domains or overall certainty ratings for an outcome or finding), drafting text that summarises the
  overall strength of evidence, related implications for decision making or research, or dissemination outputs,
  such as plain language summaries. Employing generative AI for basic writing support is not classed as
  substantial use."*
- 4.9 *"Adhere to established reporting standards for evidence synthesis, such as … PRISMA … PRISMA, for example,
  includes items on reporting automation tools used at different stages of the synthesis process. Disclosures
  should adhere to the guidelines and policies of the intended journal or publication."*
- Definição: *"machine learning (ML) …; natural language processing (NLP) …; expert systems that use rule-based
  algorithms to mimic human decisions; deep learning, which includes LLMs …; and cross-cutting generative AI"*
- Escopo da definição: *"Where the term 'AI' appears in individual recommendations, it should be understood to
  refer to the relevant class or classes of technology described in those companion documents, not to all AI
  technologies, models or tools indiscriminately."*

### RAISE 3, versão 4.0

- *"DRAFT Version 4.0: 23 September 2026"*
- O cabeçalho da Tabela 2 diz *"current (February 2026) state"*, e o texto diz *"(September 2026)"*. A
  inconsistência é do próprio rascunho.
- Termos de busca por LLM: *"should still be considered an early starting point for scoping purposes or as a
  supplementary approach … At present, these tools are only suitable for exploratory use and do not have the
  capabilities to replace traditional search development methods."*
- Plataformas de busca por agente: *"Agentic AI search platforms (e.g., Elicit, Undermind, Asta) … pre-filtered
  into a shortlist before being returned to the user. In one comparison, searching via Elicit retrieved fewer
  than 40% of relevant articles; the reported sensitivity for traditional systematic review searches was 94.5%.
  At present, such platforms are most appropriate when used as a supplementary approach to identify studies which
  traditional searches may have missed."*
- Na Tabela 2, busca por agente: *"should not be relied upon as part of any formal evidence retrieval"*, categoria
  Exploratory and supplementary use.
- Tradução de estratégia por LLM: *"every translation requires line-by-line specialist checking"*, categoria Human
  verification required.
- Síntese por LLM, na Tabela 2: *"The use of LLMs to synthesise (as opposed to summarise) results across
  studies."*, categoria Not acceptable for use.
- Síntese agêntica de ponta a ponta, na Tabela 2: *"Agentic end-to-end evidence synthesis — Multiple tasks executed
  autonomously — Agentic AI — AI agents perform steps which appear similar to the evidence synthesis process, with
  or without human input/refinement at each stage. This may result in a final report which aims to summarise the
  findings across included studies. Generative AI is not reliable for summarising results across studies and
  should not be used for this purpose. Errors can accumulate across stages, so these tools are not appropriate
  for producing a complete evidence synthesis."*, categoria Not acceptable for use.
- No texto corrido: *"The only use currently classified as 'not acceptable' is using LLMs to synthesise findings
  across studies"*. A Tabela 2 marca também a síntese agêntica de ponta a ponta, cuja justificativa é a mesma
  (resumo de resultados entre estudos por IA generativa).
- Plataformas integradas: *"EPPI Reviewer offers … For evaluation purposes, these should each be treated as
  separate AI tools, with a nuanced understanding of their performance on specific tasks."*
