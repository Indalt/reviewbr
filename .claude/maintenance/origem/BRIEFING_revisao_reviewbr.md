# Briefing — revisão do ReviewBR

**Para:** o chat dedicado a este trabalho
**De:** sessão da pesquisa da cajuína (set/2026)
**Decisão do pesquisador:** investigar as três frentes **em ordem**, em chat próprio.

---

## 0. Como usar este documento

Este é o ponto de entrada. Não repita o levantamento — ele está feito. Leia também:

| Arquivo | O que traz |
|---|---|
| `REGISTRO_producao.md` | o que foi produzido: 11 scripts, método de OCR, régua, escala |
| `PROPOSTA_modulo_fontes_primarias.md` | o módulo proposto, já reescrito no modelo de travas |
| `codigo_origem/` | os 11 scripts, 819 linhas, validados em ~9.150 páginas |

---

## 1. O que o ReviewBR é hoje (verificado, não presumido)

| Camada | Conteúdo |
|---|---|
| Ferramentas MCP | **14** |
| Repositórios catalogados | **93** |
| Agentes | 7 — `designer`, `librarian`, `screener`, `extractor`, `reader`, `analyst`, `scout` |
| Skills | 8 — incluindo `prisma-rigor-gates`, `conduct-review`, `methodology-router` |
| Serviços | ~30 em `src/services/` |
| Invariantes | **RV-01..RV-08**, nunca desligáveis |

**Princípio central**, na própria skill de gates:

> *"Rigor não é autocertificação do agente: cada gate é uma verificação determinística. O
> agente produz o insumo; a verificação aprova ou reprova; o orquestrador só avança com
> verde."*

E o diagnóstico que o sistema faz de si mesmo:

> *"Foi a ausência de um agente que **chamasse** essas verificações no momento certo (não a
> ausência delas) que travou o sistema antigo."*

---

## 2. As três lacunas provadas por uso real

Não são hipóteses. Vieram de uma investigação que rodou semanas e ~9.150 páginas.

| # | Lacuna | Seção |
|---|---|---|
| 1 | nenhuma trava sobre **resultado negativo** | 2.1 → RV-09 |
| 2 | nenhuma trava sobre **sentido dos termos** | 2.2 → RV-10 |
| 3 | **nenhum agente** constrói/mantém o sistema | 2.4 → RV-11 |

### 2.1 Nenhuma trava sobre resultado negativo

**Oito falsos negativos ocorreram. Sete produziriam um zero publicável e falso.**

⚠️ Esta tabela é **dado de uma investigação**, não cânone. Documenta que a classe de falha
é real e variada; não esgota as formas que ela pode ter.

| # | Sintoma | Causa real |
|---|---|---|
| 1 | zero em toda a Hemeroteca BN | domínio `.bn.br` morto; é `.gov.br` |
| 2 | zero buscando com acento | índice não casa "cajuína" |
| 3 | 404 e títulos corrompidos | HTML latin-1 lido como UTF-8 |
| 4 | "nenhuma postagem" | busca do site quebrada — zero até para `água` |
| 5 | 0-2 palavras/página | limiar fixo destrói o texto |
| 6 | densidade 0,3-0,9 em 8 anos | páginas giradas 270° |
| 7 | 12 reinícios, progresso zero | watchdog matando processo saudável |
| 8 | **"1906-1918: zero ocorrências"** | **68 erros, nenhuma página lida** |

O nº 8 entraria no relatório sem que **uma página** tivesse sido lida. Nenhuma RV atual o
pega: todas pressupõem que a fonte foi lida.

→ Proposta: **RV-09**, detalhada em `PROPOSTA_modulo_fontes_primarias.md` §2.

### 2.2 Nenhuma trava sobre o sentido dos termos

**F1.4.2 já prevê `NOT`** — mas `NOT` exclui **registro**, não **acepção**.
`cajuína NOT "vinho de caju"` descartaria o documento inteiro, quando o necessário era ler
o documento e **classificar cada ocorrência**.

Não há campo estruturado para termo recusado: a string é texto, e a decisão de significado
fica implícita nela.

**Evidência de uso:** a certa altura ampliei os termos por conta própria (`vinho`, `suco`,
`xarope`, `licor`, `gasosa`). O pesquisador precisou intervir — *"não pedi para mudar os
termos"*. Um gate deveria ter reprovado, em vez de exigir intervenção humana.

→ Proposta a desenvolver: **RV-10** — protocolo deve declarar, antes da busca, termos
**aceitos** e termos **recusados com registro obrigatório** (aparece → anota, nunca conta).

---

### 2.3 Onde a compreensão de documento vive hoje — e por que o módulo não a duplica

Capacidade repartida entre quatro agentes:

| Agente | Que compreensão | Ferramenta |
|---|---|---|
| `screener` (F3/F4) | decide **relevância** por título/resumo | `screen_candidates` |
| `extractor` (F5) | extrai **campos** estruturados | `batch_llm_extract` |
| **`reader` (F5.5)** | **lê e responde** com evidência citada | `rag_index_corpus`, `rag_query` |
| `analyst` (F6-F8) | **sintetiza** o conjunto | `rag_query` |

O `reader` é o agente de compreensão profunda. Três limites relevantes à revisão:

1. **Opera sobre "corpus curado".** Só entra na F5.5, depois da triagem. Pressupõe que o
   documento chegou legível e relevante — **nada nele verifica se o texto foi de fato
   lido**. É a lacuna da RV-09.
2. **Usa RAG — busca semântica.** `rag_query` recupera por similaridade. Ótimo para "o que
   os estudos dizem sobre X"; **inadequado** para "a palavra X ocorre ou não", porque RAG
   não garante exaustividade. Para presença/ausência de termo é a ferramenta errada.
3. **Nenhum dos quatro desambigua sentido.** `screener` decide inclusão do registro;
   `extractor` preenche campo; `reader` responde pergunta. Nenhum classifica *"esta
   ocorrência do termo conta ou não conta"* — a lacuna 2.2.

**Consequência:** o agente `antiquarian` proposto **não duplica o `reader`**. São camadas
distintas:

| | pergunta | natureza | corpus |
|---|---|---|---|
| `reader` | o que estes documentos dizem? | semântica | curado |
| `antiquarian` | este termo ocorre, e há prova de que li? | literal e exaustiva | bruto |

Uma revisão que confunda as duas usará RAG onde precisa de varredura exaustiva — e
produzirá o falso negativo nº 8 da tabela acima com aparência de rigor.

---

### 2.4 Não existe agente construtor — verificado

Os **7 agentes são todos de execução de revisão**: `designer`, `librarian`, `screener`,
`extractor`, `reader`, `analyst`, `scout`. **Nenhum tem escopo de construir, auditar ou
manter o próprio ReviewBR.**

O sistema foi construído pelo pesquisador com IA, em sessões comuns — sem agente dedicado,
sem protocolo travado, sem gates.

### Por que isso é a terceira lacuna

O ReviewBR **trava a revisão de literatura, mas não trava o trabalho sobre si mesmo**.
É a mesma ausência que fez a investigação da cajuína derivar (§3).

Precedente registrado na própria skill de gates:

> *"Foi a ausência de um agente que **chamasse** essas verificações no momento certo (não a
> ausência delas) que travou o sistema antigo — `validate_prisma_flow` (RV-05) já existia e
> nunca era chamada."*

O sistema já sofreu de ferramenta existente que ninguém invocava. **Um construtor sem travas
pode criar a próxima.**

### Consequência direta para a Frente 2

A auditoria do sistema **não tem quem a execute com rigor**. Antes de auditar, decidir se
haverá um agente responsável — senão a auditoria é feita do mesmo modo informal que produziu
o que ela deveria auditar.

### Decisão do pesquisador: criar um agente de manutenção metodológica

**Escopo definido por ele:** consolidar o que existe e está bem feito **e** incorporar
avanços de metodologia para que o sistema avance.

⚠️ **Correção a um esboço anterior deste briefing:** a primeira versão descrevia o agente
só pelo lado negativo — não reescrever, não ampliar, não portar. Isso trava a deriva mas
**impede o avanço**. Um sistema que só se defende apodrece. O escopo correto tem as duas
faces.

#### Por que é vigilância metodológica, não manutenção de software

Metodologia científica é **normalizada e versionada**. O PRISMA 2020 substituiu o de 2009;
haverá sucessor. Hoje **nada no sistema detectaria isso** — nem sabe declarar de que versão
de cada padrão depende.

Ancoragem atual (levantada em 24/09/2026):

| Padrão | Situação |
|---|---|
| **PRISMA 2020** (27 itens) | implementado |
| **PRISMA-S** (16 itens) | implementado |
| PRISMA-ScR | citado; metodologia `scoping-prisma-scr` existe |
| **GRADE**, **CERQual** | citados na spec |
| **JBI** | citado, **não implementado** |
| Cochrane Handbook, **MECIR** | ausentes |
| EQUATOR Network (registro de guidelines) | ausente |

Metodologias implementadas: **apenas duas** — `prisma-sr` e `scoping-prisma-scr`.
A versão do padrão aparece **só em prosa de descrição**, nunca como dado verificável.

A pergunta do agente não é *"o código está bom?"* e sim **"o sistema ainda corresponde ao
estado da metodologia?"**

#### Duas funções que decorrem de tratar isto como ciência

**1. Versionamento de padrão.** Cada trava declara contra que versão de que padrão verifica:
`RV-05 ⟵ PRISMA 2020, item 16a`. Sem isso não há como saber o que revisar quando o padrão
mudar. Deveria existir um manifesto de conformidade, legível por máquina.

**2. Três tipos de mudança, com gates distintos:**

| Tipo | O que é | Exige |
|---|---|---|
| **Correção** | o sistema não faz o que promete | **falha documentada e reproduzível** |
| **Conformidade** | o padrão mudou | **citação do padrão novo e do item afetado** |
| **Extensão** | método novo (ex.: fontes primárias) | **protocolo próprio**, como qualquer revisão |

O módulo `fontes-primarias` é do tipo Extensão. RV-09 e RV-10 são Correção.
**Misturar os três é o que vira reescrita sem fim.**

#### Esboço do agente

| Pode | Não pode |
|---|---|
| auditar coerência entre RV declaradas e tools que as chamam | reescrever o que funciona sem falha documentada |
| verificar tool que decide quando deveria executar (RV-06) | ampliar escopo para "melhorar em geral" |
| **rastrear evolução de padrão** (PRISMA, JBI, GRADE, MECIR, EQUATOR) | adotar padrão novo sem gate de conformidade |
| **propor extensão** com protocolo próprio | implementar sem protocolo travado |
| manter catálogo, spec, changelog, **manifesto de conformidade** | portar linguagem por homogeneidade |

**Gate próprio — RV-11:** toda alteração declara seu **tipo** (correção / conformidade /
extensão) e satisfaz o requisito daquele tipo. Simétrico ao RV-09: assim como toda
ocorrência exige controle positivo, toda mudança exige justificativa do tipo declarado.

#### Primeira tarefa sugerida ao agente

Produzir o **manifesto de conformidade** do estado atual: para cada RV, cada skill e cada
metodologia, contra que padrão e que versão ela verifica. É o que torna a Frente 2 auditável
e a Frente 3 comparável — sem isso, "o sistema está atualizado?" não tem resposta possível.

---

## 3. A ressalva metodológica que vale para este próprio trabalho

A investigação da cajuína **derivou por falta de trava**. Começou como "primeira menção em
jornal do Piauí" e virou: varredura de almanaques, códigos de posturas, censos, preservação
de acervo morto, caça a verbete de 1975. Cada passo defensável; o conjunto, sem protocolo.

Foram necessárias **três intervenções** do pesquisador para corrigir rumo: reduzir escopo,
corrigir premissa sobre as atas, exigir visibilidade do progresso.

**"Revisar o ReviewBR" tem exatamente o mesmo perfil de risco.** Motivado por "a IA
melhorou", sem critério de parada, vira reescrita sem fim.

Por isso este trabalho deve começar **travando o próprio protocolo**: o que será revisado,
contra que critério, o que está explicitamente fora.

---

## 4. As três frentes, na ordem decidida

### Frente 1 — Lacunas provadas
Escopo fechado, evidência documentada. Implementar **RV-09**, **RV-10** e **RV-11** e as
tools que as verificam. Critério de parada: as duas travas existem, são chamadas no momento certo, e
reprovam os casos conhecidos de falha.

⚠️ **Os 8 falsos negativos são dado, não cânone.** São evidência de que a lacuna existe —
não a definição do que a trava deve cobrir. Vieram de **uma** investigação, num acervo, num
idioma, num tipo de fonte. Desenhar RV-09 para passar nesses oito casos produziria uma
trava ajustada a eles e cega para o resto.

A trava deve derivar do **princípio** — um negativo precisa de prova de leitura — e os oito
servem apenas para conferir que o princípio, uma vez implementado, os teria pego.

### Frente 2 — Auditoria do sistema
Rodar o `prisma-rigor-gates` **contra o próprio ReviewBR**:
- as 8 RV verificam o que prometem, ou há RV declarada sem tool que a chame?
  *(o sistema já sofreu disso: `validate_prisma_flow` existia e nunca era chamada)*
- as 14 tools são determinísticas, ou alguma decide em vez de executar (RV-06)?
- os 7 agentes respeitam seus limites?
Produz **diagnóstico**, não reescrita.

### Frente 3 — Estado da arte
Comparar com Rayyan, ASReview, Elicit, Covidence e com capacidades de modelo surgidas
depois da criação do sistema. Pode revelar partes obsoletas — ou confirmar que a arquitetura
de travas é diferencial, já que essas ferramentas em geral **não travam metodologia**.

#### Nota da Frente 3 — o **Jev** (TypeSafe AI) já foi investigado: **não adotar**

Lançado em 15/09/2026. Pesquisa feita em 24/09/2026.

**Veredicto: é replicável com ferramentas abertas, e já foi replicado com vantagem.**

#### Replicação aberta que supera o original

**openJev-verdict-2.0** — ModernBERT 151M, **Apache 2.0**:

| | openJev aberto | Jev 1.13.0 |
|---|---|---|
| Acurácia | **77,10%** | 72,70% |
| Brier | **0,0636** | 0,1480 |
| ECE | **0,0144** | não publicado |
| Latência | **20-25 ms** | ~140 ms (p95 real: 653-693 ms) |
| Custo | **zero** (local/WebGPU) | API |

Treinado em **8,8 h numa GTX 1660 Ti de 6 GB**. Mais de 30 alternativas abertas
catalogadas; várias servem `/v1/systemone`, compatível com a API do Jev.

#### O mecanismo é trivial

"Erro de tipo matematicamente impossível" é verdadeiro e banal: o espaço de resposta é
**fixo e enumerado antes da inferência** (booleano; escolha até 255; escala 2-10). É o que
uma cabeça softmax faz. Não é invenção — é propriedade padrão de classificador.

⚠️ **Não significa que não erra.** Não alucina o *schema*; pode escolher a categoria errada
com alta confiança. O próprio CEO reconheceu isso no Hacker News.

#### Números de marketing não confirmados

| Alegação do fornecedor | Medido por terceiros |
|---|---|
| 193,6× mais rápido | **0,5× a 12,1×** |
| 444,6× mais barato | 0,6× a 478×, **sem comparador nomeado** |
| 70-500 ms | p95 real **653-693 ms** |

Contra Gemma 4 26B local: **mais lento** e custo empatado. Em spam (18.514 e-mails), um
**baseline TF-IDF venceu** (98,39% vs 98,33%). Em Banking77: 72,5% contra 84,0% do Claude
Fable 5.1.

#### Por que isso desqualifica o Jev como trava metodológica

O ReviewBR opera por **verificação determinística e auditável**. O Jev é modelo **sem paper,
sem pesos, sem arquitetura divulgada, sem métrica de calibração publicada pelo fornecedor,
e sem auto-hospedagem**. Depender dele para um gate contradiz o princípio do sistema.

**Alternativa melhor para o mesmo fim:** *conformal prediction* entrega garantia estatística
**provada** de cobertura (distribution-free, finite-sample), enquanto o Jev oferece
calibração empírica não publicada. Aplicável sobre qualquer modelo.

#### A única vantagem real, e é efêmera

Desempenho **zero-shot** sem rotulagem por tarefa. Mas um encoder de 310M superou o Jev em
**12 pontos com 200 linhas de treino**. A vantagem desaparece com algumas centenas de
rótulos.

#### Recomendação para a Frente 1 (RV-10 — desambiguação de ocorrência)

Não usar Jev. Avaliar, nesta ordem:
1. **ModernBERT fine-tunado** com rótulos derivados do próprio corpus (as ocorrências de
   `caju` desta pesquisa — bebida / topônimo / sobrenome / ruído — são dado de treino real);
2. **conformal prediction** por cima, para garantia de cobertura;
3. structured output de LLM já em uso, se o volume não justificar treinar.

Todos auditáveis, locais e sem dependência de fornecedor.

⚠️ **Alerta de fontes:** a maior parte da cobertura sobre o Jev é SEO de fornecedores de
ferramentas de IA reproduzindo press release. As fontes com dado próprio são poucas:
`jevals-data`, `openJev-verdict-2.0`, `jevbench`, Ibrahim & Zaki (arXiv 2609.24574),
The Register, KDnuggets e a thread do Hacker News.


---

## 5. O que este trabalho NÃO deve fazer

- reescrever o que funciona sem falha documentada
- portar linguagem por gosto de homogeneidade
- ampliar escopo para "melhorar o sistema em geral"
- confundir capacidade nova de modelo com necessidade do sistema

---

## 6. Primeiro passo sugerido ao novo chat

Travar o protocolo da própria revisão: escopo, critério de parada por frente, o que fica
fora. Só então começar pela Frente 1.

O material de entrada está em `reviewbr/docs/modulos/`.
