# Organização da manutenção do ReviewBR — 11/11/2026

> **O que este arquivo é.** O resultado da sessão de leitura e organização pedida no
> `BRIEFING_fable_2026-11-10.md` (Fable 5.2, esforço high). Diz o que foi feito, o que falta de verdade e o que
> sai da fila. É escrito bloco a bloco; cada bloco fecha com commit.
>
> **Estado: blocos 1 e 2 de 3 feitos (11/11).** Falta o bloco 3: as decisões do Vicente (parte 10) e a limpeza
> que ele aprovar. Nada aqui está decidido: as propostas esperam o Vicente na parte 10.
>
> **Regras desta sessão.** Não cria achado, sessão nem frente. O número de achados abertos só pode cair. O que
> aparecer de passagem vira uma linha na parte 11, sem avaliação.

## 1. Resumo

- **A fila não é infinita.** São 32 defeitos distintos: 17 consertos de código, 13 correções de texto e 2
  mapeamentos de norma. Os 43 abertos do backlog incluem 10 duplicatas e 1 já consertado.
- **O backlog parou de crescer.** Achados registrados por mês: 102 em setembro, 50 em outubro, 1 em novembro. A
  regra do backlog (05/11) e a porta da sessão P (08/11) funcionam.
- **O que cresce é a camada em volta dos consertos**: rodadas de triagem não aplicadas, perguntas empurradas para
  a sessão M e o balde "7+" (parte 4).
- **Dos 32 defeitos, 26 não dependem da sessão M.** Hoje a M (duas janelas, sem tocar em código) está na frente
  de todos eles.
- **Proposta:** oito sessões, uma função do ReviewBR em cada, com todo defeito aberto numa delas (parte 5).

## 2. A trajetória do briefing confere com o que está gravado

O §2 do briefing descreve três momentos: revisão sistemática automatizada baseada em PRISMA; apoio à pesquisa;
apoio à pesquisa especializado em metodologias validadas, capaz de assimilar novas. Confere com o disco:

| o que o briefing diz | onde está gravado |
|---|---|
| deixou de ser aplicador de PRISMA e passou a "vestir" métodos | `DIRECAO_ferramenta_que_veste_metodos.md`, 04/10 |
| PRISMA é um conjunto de metodologias, não o esqueleto da ferramenta | plano, respostas de 29/10 |
| só se assimila metodologia validada cientificamente | plano, pergunta 10 (29/10); `maintainer.md` |
| mudança geral do sistema junto com uma ferramenta interna de manutenção e assimilação | DIRECAO §3 e §4; agente `maintainer` e as tools `absorb_methodology`, `scaffold_methodology`, `validate_methodology` |
| "servidor MCP" e "modular" | o sistema já é um servidor MCP (`reviewbr/reviewbr-mcp`); o modular existe como um manifest por método |

Três pontos em que o registro é mais preciso que o briefing:

1. **A natureza não está mudando agora.** Em 08/11 o Vicente corrigiu: a função "continua a ser apoio para
   pesquisa com atividade principal especializado em metodologias científicas podendo assimilar as que vão
   surgindo. Isso não mudou". O terceiro momento do briefing já vale desde 04/10.
2. **Duas funções gravadas que o briefing não cita:** conduzir o projeto de pesquisa indicando a metodologia
   mais adequada (08/11) e educar o pesquisador pelo uso (04/10; A7).
3. **O tamanho real hoje:** 107 entradas no catálogo, 5 normas assimiladas (`prisma-2020`, `prisma-s`,
   `prisma-scr`, `prisma-p`, `raise-3`) e 2 métodos que executam (`prisma-sr`, `scoping-prisma-scr`).

## 3. O que foi feito

- **Backlog:** 153 achados registrados. 79 resolvidos, 31 recusados, 43 abertos (41 abertos e 2 em curso).
  Audit válido.
- **Sessões fechadas de 29/10 a 08/11:** 0 (troca de computador), 1 (escopo e PRISMA-S), 2a (declarações por
  método), 2b (itens condicionais), 2c (conferência do mapeamento e leitura documentada), P (porta do backlog).
  Suíte em 474 de 474 testes, 38 arquivos.
- **Três construções que valem ser mantidas, porque encurtam o que falta:**
  - a regra do backlog e a porta (`record_system_finding` recusa achado sem a "mentira de hoje");
  - as declarações por método (2a), que permitem consertar uma promessa falsa declarando a verdade, sem
    construir a capacidade;
  - a leitura documentada (2c), que é o procedimento para conferir a transcrição de uma norma.

## 4. Por que a fila parecia infinita

Quatro mecanismos, todos fora do backlog:

1. **Proposta aprovada e não aplicada.** A mesma fila foi triada cinco vezes (04/10, 08/10, 18/10, 31/10 e
   05/11). A de 18/10 diz "nada aqui foi executado"; a de 05/11 deixou 10 fusões e 16 enxugamentos para "cada
   sessão conferir quando tocar". Cada rodada nova relê as anteriores.
2. **Pergunta empurrada para uma sessão futura.** A sessão M recebeu, uma a uma: A1 a A9, as três perguntas
   da 2c, D01, D09 e D17, três princípios vindos do backlog, o critério do D07, a posição sobre o RAISE 3 e os
   fundamentos na filosofia da ciência. Passou a duas janelas e ficou na frente de tudo.
3. **O balde "7+".** Dezesseis dos 32 defeitos não têm sessão nomeada: estão no "7+" ou fora da tabela do
   plano. Entre eles o de maior dano a uma pesquisa:
   o DEBT-089 (`retrieve_fulltexts` reescreve o dataset de entrada e pode truncar o corpus), aberto desde 25/09.
4. **O rito custa mais que o conserto.** Cada sessão tem prompt preparado no acompanhamento, abertura, carta e
   conferência. Exemplo: o DEBT-139 (BLOQUEIA, aberto desde 09/10) se conserta trocando duas linhas de
   `index.ts` (:107 e :2344) pela função `resolveProjectDir`, que já existe e já é usada em seis pontos do
   mesmo arquivo.

Conferi no código de hoje cinco dos defeitos de maior dano (DEBT-089, 133, 135, 139 e 141): os cinco seguem
vivos, nas linhas que a triagem de 05/11 aponta.

## 5. O que falta de verdade — 32 defeitos em oito sessões

Critério de ordem: o da DIRECAO §10 — o que mais prejudica uma pesquisa conduzida hoje vem primeiro (perder
dado elegível, publicar algo falso, decidir errado). "(+NNN)" é duplicata que se funde no achado (parte 6).
Tipo do conserto: **C** código com teste; **T** texto (declarar a verdade); **M** mapeamento contra a norma.

| # | função do ReviewBR | achados | tipo | depende da M? |
|---|---|---|---|---|
| A | Texto completo e leitura | 089 · 062 (+090) · 031 | C C C | não |
| B | Registro da busca | 056 (+091) · 139 (+085) · 087 · 093 · 030 · 058 · 077 | C C C C C T T | não |
| C | Triagem e deduplicação | 021 · 025 · 112 · 026 | C C C T | não |
| D | Funil e gates | 138 (+039, +040) · 071 (+105) · 003 (+036) · 002 · 066 (+063) | C C T T T | não |
| E | Trava do protocolo | 018 · 133 · 042 · 060 | C C C T | não |
| F | Ferramentas da manutenção | 141 · 016 · 153 | C T T | não |
| G | Papéis e métodos fora do esqueleto PRISMA | 137 · 151 · 135 · 008 | T T T T | sim (decisão de 05/11) |
| H | Mapeamento das normas | 045 (+012) · 014 (+054) · as 36 divergências do PRISMA-S | M M | sim (as três perguntas da 2c) |

Observações por linha, só onde há algo a dizer:

- **A.** O 089 é o único defeito aberto que pode apagar dado de um projeto em andamento. O DEBT-102 fecha
  aqui como RESOLVIDO (a guarda contra texto vazio já existe; o OCR é funcionalidade, não defeito).
- **B.** O 058 (snowball "para trás" anunciado e nunca executado) e o 077 se consertam dizendo o que a tool faz,
  sem construir o que falta. O 030 a sessão confere: registrar por código ou declarar.
- **D.** É a antiga sessão 3. Os três de texto são uma passada só nos dois manifests e na skill de gates.
- **F.** O 141 vem antes de qualquer atualização do catálogo: hoje `absorb_methodology` com `atualizar=true`
  apaga os campos não reenviados.
- **G.** É a antiga sessão 6, reduzida aos quatro textos. As correções são de descrição: cada skill e cada
  agente passa a dizer o que cobre hoje.
- **H.** Junta o remapeamento do PRISMA 2020 (hoje declarado "deslocado", o que é verdade) com a antiga sessão
  V. É o único trabalho que pede leitura de norma e decisão item a item do Vicente.

**O que não é fila** (regra do backlog, 05/11): assimilar metodologia validada (JBI, GRADE, CERQual,
instrumentos de risco de viés), OCR, validação da IA dentro da revisão, trava da escolha de método e a forma de
abrir o ReviewBR numa IDE. Acontecem quando o Vicente pedir. A fase de testes vem depois das oito sessões, como
decidido em 27/09.

## 6. Limpeza proposta

### 6.1 Backlog — 43 abertos passam a 32, sem tocar em código

Onze gravações pela `record_system_finding`. As dez fusões são da triagem de 05/11 (e já estavam na
reclassificação de 18/10); nenhuma foi contestada nem aplicada.

| sai | fica em | por quê |
|---|---|---|
| DEBT-012 | DEBT-045 | mesmo remapeamento do PRISMA 2020, mesmos ponteiros |
| DEBT-054 | DEBT-014 | as 39 referências são material do mesmo conserto |
| DEBT-036 | DEBT-003 | mesma declaração de invariantes sem gate |
| DEBT-039, DEBT-040 | DEBT-138 | mesmas duas metades dos gates que não travam |
| DEBT-105 | DEBT-071 | reprodução perdida do mesmo defeito |
| DEBT-063 | DEBT-066 | a F6 por autocertificação é a mesma promessa de verificação inexistente |
| DEBT-085 | DEBT-139 | é a parte (1) do 139 |
| DEBT-091 | DEBT-056 | rotas de busca sem log são o escopo do log gravado por código |
| DEBT-090 | DEBT-062 | mesma restrição que só existe na descrição da tool |
| DEBT-102 | RESOLVIDO | a guarda contra texto vazio existe; o OCR vai para "quando o Vicente pedir" |

Cada duplicata sai como RECUSADO, com a resolution apontando o achado que fica. O achado que fica recebe o
conteúdo quando a sessão dele abrir (a porta exige a "mentira de hoje", que a triagem já propõe para cada um).

### 6.2 Documentos — nada se move nesta sessão

`.claude/maintenance/` tem 24 documentos `.md` e 5 `.json` na raiz. Dois fatos impedem movê-los agora:

- `maintainer.md` (linhas 187 a 248) manda toda sessão nova ler 13 deles em ordem fixa, a maioria de setembro e
  outubro. O plano diz o contrário desde 29/10: "uma porta de entrada", o resto é histórico ("Como trabalhar",
  item 1).
- `tests/integracao.test.ts` reprova documento que a rota do `maintainer.md` não alcança.

Mover arquivo exige mudar agente e teste, e isso é trabalho da sessão F (parte 8.3), pelo gate RV-11. O que
está vivo hoje:

| documento | para que serve |
|---|---|
| este arquivo | estado e fila de sessões |
| `system_debt.json`, lido por `audit_system_debt` | a fila de defeitos |
| `triagem_backlog_2026-11-05/TRIAGEM.md` | a "mentira de hoje" proposta para cada achado aberto |
| `revisao_decisoes_2026-10-31/lista_decisoes.md` | consulta: redação proposta de cada decisão (parte 7) |
| `sessao_2c/divergencias_prisma_s.md` | entrada da sessão H |
| `PLANO_sessoes_2026-10-29.md` | registro das decisões de 29/10 a 10/11 e cartas das sessões fechadas |
| `DIRECAO_ferramenta_que_veste_metodos.md` | o rumo de 04/10; os §2, §3, §4 e §6 valem, o §1 e o §7 estão vencidos |

Exemplo de parte vencida: a DIRECAO §1 diz que há 3 normas assimiladas e que nada lê o manifest do método. Hoje
são 5 normas, e desde a sessão 2a o mapeamento e as declarações são lidos do método. Documento vencido na rota
de leitura é fonte de achado repetido.

## 7. As 41 decisões e as 36 divergências não são fila

### 7.1 D01 a D41

A lista de 31/10 traz 41 decisões gravadas sem precisão, cada uma com uma redação proposta. A regra já existe
(09/11): vai a cada sessão só a que pesa nela. Distribuídas pelo título — a sessão confere na abertura:

| destino | decisões | quantas |
|---|---|---|
| já decididas ou cobertas | D04, D07, D14 | 3 |
| parte curta da M | D01, D09, D17 | 3 |
| sessão A | D23, D39 (pergunta 8) | 2 |
| sessão B | D02, D20, D30 | 3 |
| sessão C | D19, D24, D35, D37, D39 (pergunta 7) | 5 |
| sessão D | D29, D36 | 2 |
| sessão E | D06, D39 (pergunta 9) | 2 |
| sessão F | D03, D05, D08, D16, D21, D22 | 6 |
| sessão G | D10, D11, D12, D13, D26 | 5 |
| sessão H | D15, D27 | 2 |
| nenhuma sessão: só se o assunto voltar | D18, D25, D28, D31, D32, D33, D34, D38, D40, D41 | 10 |

A D39 aparece em três sessões porque junta três perguntas. Nenhuma sessão abre com mais de seis redações a
conferir, e dez decisões não pedem nada de ninguém.

### 7.2 As 36 divergências do PRISMA-S

Pelos temas do próprio arquivo, são uma definição e 21 decisões:

- **15 dependem de uma definição só** (13 de seções do manuscrito e 2 de suplementos): o lugar onde o item é
  relatado conta como cobertura? É a primeira das três perguntas da 2c ("o que é cobrir um item da norma").
  Respondida, as 15 se resolvem de uma vez.
- **14 são ponteiros para campos de coleta** e **7 são juízos de cobertura** (completa, parcial ou nenhuma):
  essas 21 o Vicente decide item a item, na sessão H.

## 8. Lógica de manutenção e de assimilação

Nada aqui é regra nova. É o que já está decidido, reduzido ao que se usa.

### 8.1 Manutenção — quatro perguntas

1. **É defeito de hoje?** O sistema afirma, exige ou entrega algo que não se sustenta, e dá para apontar o
   arquivo e a linha. Se não for, não entra no backlog:
   - metodologia ou norma que falta vai ao catálogo;
   - decisão do Vicente vai ao registro de decisões;
   - ideia e agenda vão à lista "quando o Vicente pedir";
   - problema só futuro não se registra.
2. **Qual é o menor conserto que faz o sistema dizer a verdade?** Declarar (texto, manifest, `[NÃO COBERTO]`)
   ou construir (código com teste). Constrói-se quando a falta prejudica uma pesquisa — perder dado elegível,
   publicar algo falso, decidir errado — ou quando o Vicente já decidiu construir.
3. **Em que função do ReviewBR ele cai?** O conserto entra na sessão dessa função. Sessão abre e fecha
   conferindo: `git status`, testes, `audit_system_debt`; alteração pelo gate RV-11, com o tipo declarado
   (correção, conformidade ou extensão); commit.
4. **A fila é o `audit_system_debt`.** Nenhum outro documento é fila.

### 8.2 Assimilação de metodologia — seis passos

O fundamento científico: a validade de uma metodologia vem da literatura que a publica, não da ferramenta. O
ReviewBR não julga mérito; confere que a transcrição é fiel (A6, A9). O fundamento lógico: a máquina não sabe
gerar o mapeamento certo, mas sabe provar que um mapeamento proposto está errado (DIRECAO §2). Por isso a
máquina transcreve e confere, e o juízo fica com o pesquisador.

| passo | o que acontece | quem decide | como se confere |
|---|---|---|---|
| 0. Pedido | o Vicente pede a metodologia | Vicente | nunca é automático |
| 1. Elegibilidade | há fonte oficial publicada (norma, manual, diretriz) | — | a fonte abre e é citável; sem fonte, não entra |
| 2. Catálogo | resumo e ponteiro para a fonte (`absorb_methodology`) | — | a tool recusa entrada sem `source_url` externo |
| 3. Norma como dado | transcrição em `.claude/standards/` | Vicente, só nas divergências | contagem de itens fecha; trecho literal por item; segunda leitura independente |
| 4. Mapeamento | cada item da norma apontado para a trilha, com trecho literal; o que a trilha não cobre se declara | Vicente, só nas divergências | `check_standard_coverage` |
| 5. Trilha que executa | `scaffold_methodology`; entra completa ou não entra | — | `validate_methodology` e a suíte |

Três regras já decididas valem em todos os passos: o que a metodologia torna obrigatório é obrigatório, e o que
torna opcional é opcional (08/11); um método não herda de outro o que é próprio dele (D14); pergunta que o
protocolo do método não tem não é feita ao projeto.

Duas pendências de definição, ambas na parte curta da M: se a leitura documentada confere também o que a
ferramenta garante por código, e se o gate RV-11 a exige quando um mapeamento muda.

### 8.3 Onde o procedimento de hoje pesa mais que o necessário

Tudo cabe na sessão F, sem achado novo:

- A rota de leitura do `maintainer.md` cai de 13 documentos para três passos: este arquivo, o
  `audit_system_debt` e, quando pedido, a conferência de versão das normas assimiladas. Os outros documentos
  viram histórico, e o teste de integração passa a conferir a rota nova.
- O fechamento de sessão do `maintainer.md` manda atualizar o `EXECUCAO_checklist.md` e o manifesto de
  conformidade a cada alteração. O primeiro não é atualizado desde 09/10: as sessões fecham pela carta no plano.

## 9. Catálogo da Anthropic — o que serve, o que é seguro, o que falta para ir a público

Consultado em 11/11/2026. O Bio Research não foi relido: segue a análise de 05/11 (DEBT-110, recusado).

### 9.1 O que existe e como se relaciona com o ReviewBR

| item | o que é | relação com o ReviewBR |
|---|---|---|
| Conectores de literatura: PubMed, bioRxiv e medRxiv, Scholar Gateway (só conteúdo da Wiley), Consensus, Elicit | servidores de terceiros listados no diretório | **Não substituem as tools de busca do ReviewBR.** Busca por conector não grava a string exata, a data e a contagem que o PRISMA-S exige, e a Anthropic avisa que não verifica se o conector funciona como descrito nem se muda. Servem só ao modo exploratório (`scout`). |
| Plugins `knowledge-work-plugins` (11: produtividade, vendas, suporte, produto, marketing, jurídico, finanças, dados, busca corporativa, bio-research, gestão de plugins) | pacotes de skills e conectores, só markdown e JSON | Nenhum trata de metodologia de pesquisa. O `bio-research` já foi recusado. O de gestão de plugins só interessa se o ReviewBR for empacotado como plugin. |
| Skills de documento: `pdf`, `docx`, `xlsx`, `pptx` | skills da Anthropic, licença Apache 2.0 | A `pdf` faz OCR de PDF digitalizado: é o caminho mais curto para o OCR que saiu do DEBT-102, se o Vicente pedir. A `docx` serve à exportação do manuscrito. |
| `skill-creator` e `claude plugin eval` | medem se uma skill melhora o resultado, com e sem ela | Servem à fase de testes: comparar as 9 skills do ReviewBR com e sem cada uma. |

A Anthropic publica as skills "para demonstração e fins educacionais" e pede teste no próprio ambiente antes de
uso crítico. Nada do catálogo dispensa a conferência do ReviewBR.

### 9.2 O que é seguro usar

Quatro condições, tiradas da política do diretório e do método do ReviewBR:

1. vem da Anthropic ou tem o selo Verified do diretório (o selo Community passa só por varredura automática);
2. só lê: não grava no projeto nem decide etapa;
3. não manda dado de pesquisa a terceiro além do que a função pede;
4. o que ele traz entra na trilha pelo caminho do ReviewBR, com origem registrada.

Um risco no ambiente de hoje: a sessão do ReviewBR carrega mais de dez plugins sem relação com pesquisa
(marketing, vendas, finanças, raspagem de dados). Um deles se descreve como substituto obrigatório de toda
busca e leitura na web. Isso custa contexto em cada resposta e pode desviar uma consulta de fonte oficial para
um serviço de terceiro. Desligar esses plugins na pasta do ReviewBR é configuração, não manutenção do sistema.

### 9.3 O que falta para o ReviewBR ir a público

Conferido contra a política do diretório (15/04/2026) e as listas de pré-submissão. Não é defeito de hoje: é o
que a decisão de publicar vai pedir.

| exigência | estado do ReviewBR | já está na fila? |
|---|---|---|
| a descrição de cada tool corresponde exatamente ao que ela faz | é a classe de defeito das sessões A a E | sim |
| cada tool declara se só lê ou se altera dado (`readOnlyHint`, `destructiveHint`) e tem título | nenhuma das 44 tools declara | não; entra quando houver decisão de publicar |
| não infringir propriedade intelectual de terceiros | o código tem uma rota para o Sci-Hub (`scihub_bridge.ts`), e o repositório já é público | em parte: DEBT-062 trata só do consentimento; manter ou retirar a rota é decisão do Vicente |
| nenhuma credencial em arquivo; chave pedida ao usuário na instalação | os `.env` existem e estão fora do git | — |
| política de privacidade, README, licença, três exemplos de uso | há LICENSE, README e SECURITY.md; falta a política de privacidade | não |
| como plugin: manifesto, tudo dentro da pasta do plugin, servidor local iniciado por `node` com caminho fixo, dependências com versão exata | hoje agentes e skills ficam em `.claude/` e o servidor em `reviewbr/reviewbr-mcp` | não; é o assunto da D31 |
| conteúdo de terceiros não pode dar instrução ao modelo | PDFs e resumos baixados entram em tools que usam IA | não avaliado nesta sessão |

Fontes: [política do diretório](https://support.claude.com/en/articles/13145358-anthropic-software-directory-policy) ·
[lista de pré-submissão de conectores](https://claude.com/docs/connectors/building/review-criteria.md) ·
[lista de pré-submissão de plugins](https://claude.com/docs/plugins/pre-submission-checklist.md) ·
[knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins) ·
[skills da Anthropic](https://github.com/anthropics/skills) ·
[Scholar Gateway](https://claude.com/connectors/scholar-gateway) ·
[Bio Research](https://claude.com/plugins/bio-research)

## 10. Decisões para o Vicente — bloco 3

Nenhuma foi tomada. Cada uma diz o que muda se a resposta for sim.

1. **Posição em relação à M.** As sessões A a F (26 defeitos) passam à frente da M, que fica antes só de G e H?
2. **A M se divide?** Uma parte curta responde às três perguntas da 2c e a D01, D09 e D17, e destrava a
   sessão H. A descrição completa do método (A2), com os fundamentos na filosofia da ciência, segue no ritmo da
   leitura do Vicente, sem prender nenhum conserto.
3. **Esta página é a "página única" decidida em 08/11?** Se sim, as sessões passam a ler só ela, e o
   `PLANO_sessoes_2026-10-29.md` vira histórico.
4. **O balde "7+" deixa de existir?** Os defeitos dele já estão nas linhas A a H; o resto vira "quando o
   Vicente pedir".
5. **Aplicar a limpeza do backlog** (parte 6.1): 43 abertos passam a 32.
6. **A rota de leitura do `maintainer.md` cai para três passos** (parte 8.3), na sessão F?
7. **A rota para o Sci-Hub fica no repositório público?** Só a pergunta; não há prazo (parte 9.3).

## 11. Visto de passagem — não avaliado

- `reviewbr/reviewbr-mcp/src/index.ts.tmp` segue no disco (já anotado na triagem de 05/11).

## 12. Custo medido

Unidade `c` do medidor de `~/.claude/uso/` (0,44% da semana por c; janela de 5 h ≈ 38 c). Teto da sessão
inteira: 113 c (50% da semana).

| bloco | previsto | medido | acumulado |
|---|---|---|---|
| cálculo e plano | 3,5 c | 2,6 c | 2,6 c |
| 1 — leitura e diagnóstico | 21 c | 2,5 c | 5,1 c (2,2% da semana; 13% da janela de 5 h) |
| 2 — decisões, lógica de manutenção e catálogo | 19 c | 2,3 c | 7,4 c (3,3% da semana; 20% da janela de 5 h) |

Sinal sobre a virada da semana: a última leitura declarada era 99% (10/11). Esta sessão já gastou o
equivalente a 2% da semana sem corte, o que indica que a semana virou em 11/11 por volta das 23h30.
