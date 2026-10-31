# Sessão 2b — leitura da fonte: a abordagem de certeza tira item do denominador?

Armadilha 1 do prompt da sessão 2b: *"A resposta só tira item do denominador onde a FONTE faz o item depender
dela. Antes de ligar a condição de certeza a algum item, leia na fonte oficial os itens 15 e 22 do PRISMA 2020
e o 17 do PRISMA-P (checklist e explicação e elaboração)."* Lido na virada de 30 para 31/10/2026. Trechos
transcritos verbatim do texto obtido e conferidos por `confere_citacoes.mjs`; o que está fora das aspas é leitura
desta sessão.

## Fontes

| documento | onde foi lido | SHA-256 do arquivo lido | licença |
|---|---|---|---|
| Page MJ et al. The PRISMA 2020 statement. BMJ 2021;372:n71 (doi:10.1136/bmj.n71) | Europe PMC, PMC8005924, `rest/PMC8005924/fullTextXML` | `c5e3b4a1892f0cb97ea0360d5e5b4b51ab4ea8b4e8ddabe7b441b5d464f18758` | CC BY 4.0 |
| Page MJ et al. PRISMA 2020 explanation and elaboration. BMJ 2021;372:n160 (doi:10.1136/bmj.n160) | Europe PMC, PMC8005925, `rest/PMC8005925/fullTextXML` | `c056a0fdb0cbb76eead718d7ee16981bc21e1db7e535d5261b83f31e7b66eb37` | CC BY 4.0 |
| Moher D et al. PRISMA-P 2015 statement. Syst Rev 2015;4:1 (doi:10.1186/2046-4053-4-1) | Europe PMC, PMC4320440, `rest/PMC4320440/fullTextXML` — a mesma fonte do `version_source` de `.claude/standards/prisma-p.json` | `c251b01d9809d36e0b7f4ffc46c717a1a9df6e263b98166f80f4885beeeb4b14` | CC BY 4.0 |
| Shamseer L et al. PRISMA-P 2015: elaboration and explanation. BMJ 2015;349:g7647 (doi:10.1136/bmj.g7647) | White Rose Research Online, eprint 91310 (`bmj.g7647.full.pdf`, "Version: Published Version"); bmj.com recusa acesso automatizado (403) e o Europe PMC não tem o texto | `f418869a05784299999b46d3fb512776b3cbaf05fae18b4afc4f6245882731b1` | © BMJ, "No commercial reuse": só citação curta aqui |

Os arquivos não ficam no repositório (público; `*.pdf` está no `.gitignore`, e o E&E do PRISMA-P não é de
licença aberta). O hash permite conferir que outra cópia é a mesma.

## PRISMA 2020 — itens 15 e 22

Checklist (statement, n71):
- Item 15, *Certainty assessment*: "Describe any methods used to assess certainty (or confidence) in the body
  of evidence for an outcome."
- Item 22, *Certainty of evidence*: "Present assessments of certainty (or confidence) in the body of evidence
  for each outcome assessed."

Nenhum dos dois traz "If done" — ao contrário dos itens 12 e 16 do PRISMA-ScR ("If done, …"; DEBT-150).

Explicação e elaboração (n160), a regra de leitura dos elementos, que vale para todo item:
> "Essential elements should be reported in the main report or as supplementary material for all systematic
> reviews (except for those preceded by "If…," which should only be reported where applicable)."

> "The essential and additional elements are framed in terms of reporting the "presence" of a method or result
> (such as reporting if individuals were contacted to identify studies) rather than reporting on their absence.
> In some instances, however, reporting the absence of a method may be helpful (for example, "We did not
> contact individuals to identify studies"). We leave these decisions to the judgment of authors."

Os elementos essenciais do item 15 que não começam por "If…": "Specify the tool or system (and version) used
to assess certainty in the body of evidence."; "Report the factors considered (…) and the criteria used to
assess each factor (…)"; "Describe the decision rules used to arrive at an overall judgment of the level of
certainty (…)"; "Report how many reviewers assessed the certainty of evidence (…)"; "Report any processes used
to obtain or confirm relevant information from investigators."; "Describe methods for reporting the results of
assessments of certainty (…) (see item #22)." Os que começam por "If…" (*If applicable*, *If any adaptations*,
*If an automation tool*, *If standard phrases*) são detalhes do método escolhido, não a aplicabilidade do item.

Os elementos essenciais do item 22, nenhum com "If…": "Report the overall level of certainty in the body of
evidence (such as high, moderate, low, or very low) for each important outcome."; "Provide an explanation of
reasons for rating down (or rating up) the certainty of evidence (…)"; "Communicate certainty in the evidence
wherever results are reported (…)".

**Leitura:** pela regra do próprio E&E, os itens 15 e 22 se relatam em **toda** revisão sistemática. Não há
resposta da revisão que os torne inaplicáveis. Revisão que não avalia a certeza fica sem o que eles pedem, e
dizer que não houve avaliação é decisão do autor ("We leave these decisions to the judgment of authors") — não
tira o item do checklist.

## PRISMA-P 2015 — item 17

Checklist (statement, Syst Rev 2015, Table 3): *Confidence in cumulative evidence*, 17 — "Describe how the
strength of the body of evidence will be assessed (e.g., GRADE)".

O statement define a revisão sistemática por, entre outras, "(c) an assessment of the validity of the findings
of the included studies (e.g., assessment of risk of bias and confidence in cumulative estimates)".

Explicação e elaboração (g7647, item 17, *Explanation*):
> "Authors should describe which approach they plan on using to summarize the confidence they have in the
> resulting body of evidence, ideally using an established and validated approach. (…) If no such assessments
> are planned, the authors should state this with a rationale for why not."

**Leitura:** o item 17 vale sempre: o protocolo descreve a abordagem, ou declara que não haverá avaliação, com
o motivo. "Nenhuma" é resposta legítima, e o item continua pedindo o relato.

## Conclusão — a fonte decide

A condição `abordagem_certeza` (GRADE / CERQual / nenhuma) **não tira item algum do denominador**: nenhuma
das três fontes condiciona os itens 15 e 22 do PRISMA 2020 nem o 17 do PRISMA-P à resposta. Por isso
nenhuma linha do mapeamento do `prisma-sr` traz `condicao: abordagem_certeza`; os itens ficam no
denominador como o método já os declara (15 deslocado e [NÃO COBERTO], DEBT-045; 22 e o 17 do PRISMA-P com
correspondência). A condição grava a escolha a priori, no protocolo (RV-01), como o item 17 do PRISMA-P
pede — e "nenhuma" vem com o motivo, na contribuição do pesquisador.
