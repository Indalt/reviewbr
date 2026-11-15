# Desenho do artigo 1 — conteúdo para o protocolo v0.2

Escrito em 15/11/2026. Reúne o que o Vicente decidiu até essa data e o que o assistente propõe. A sessão seguinte
copia este conteúdo para o `protocol.md` (hoje v0.1), sem reabrir o que está marcado DECIDIDO. O que está marcado
PROPOSTA só vale depois que o Vicente ler e aprovar, no travamento.

## 1. O que o artigo é

Revisão de escopo (PRISMA-ScR) sobre rodas de aroma e descritores sensoriais da cajuína. **Não encontrar é um
resultado** (DECIDIDO, 15/11): o artigo relata o que existe, o que não existe e onde se procurou.

Consequência para o método: como o resultado esperado é pouco ou nada, a força do artigo está na busca. Cada fonte
precisa de uma busca de controle (algo que se sabe existir nela), e a busca tem de ser a mais aberta possível.

## 2. Questão e PCC

| campo | conteúdo | estado |
|---|---|---|
| título | Rodas de aroma e descritores sensoriais da cajuína: revisão de escopo | PROPOSTA |
| questão principal | Que rodas de aroma, léxicos ou descritores de aroma e sabor já foram publicados para a cajuína, e com que métodos foram obtidos? | PROPOSTA de redação; o conteúdo é DECIDIDO |
| P, produto | **só a cajuína** | DECIDIDO, 15/11 (troca a decisão de 12/11, que incluía as bebidas do pedúnculo e o pedúnculo in natura) |
| C, conceito | a fonte trata **expressamente** de aroma ou sabor da cajuína: roda, léxico, perfil descritivo, descritores, ou compostos de aroma | DECIDIDO, 15/11; ver a dúvida 1 da seção 9 |
| C, contexto | qualquer estado ou país; o Ceará é destacado na análise; registra-se o que houver do Piauí e de outros estados produtores | DECIDIDO, 12/11 |

Questões secundárias (PROPOSTA; as três de 12/11 falavam de vários produtos e não servem mais):
1. De que estados e instituições vêm as fontes (Ceará, Piauí, outros)?
2. Com que métodos os descritores foram obtidos (painel treinado, consumidores, análise instrumental)?
3. Alguma fonte liga descritores sensoriais a compostos de aroma?

## 3. Critérios

Inclusão:
- produto: cajuína (DECIDIDO);
- conceito: trata expressamente de aroma ou sabor (DECIDIDO);
- período: sem limite; idiomas: português, inglês e espanhol (DECIDIDO, 12/11);
- tipo de documento: artigos, teses, dissertações, trabalhos em anais, documentos técnicos e capítulos de livro.
  Resumos de congresso entram se aparecerem nas buscas, contados à parte. O critério restringe pelo conteúdo, não
  pelo tipo de documento. (O Vicente disse em 15/11 "sobre os criterios nao vejo objecao se for declarado que a
  parte 'mecanica' da conducao foi feita com a ferramenta reviewbr". O assistente leu isso como aceite desta
  recomendação. Confirmar no travamento.)

Exclusão:
- qualquer outro produto do caju: suco, néctar, polpa, fermentados, vinho, pedúnculo in natura (DECIDIDO, 15/11);
- produtos em que a cajuína ou o caju é ingrediente: cerveja, kombucha, néctar misto (DECIDIDO, 15/11);
- coprodutos: fibra, essências, *water phase* (DECIDIDO, 15/11);
- fontes sobre cajuína que não tratam de aroma nem de sabor: processo, físico-química, mercado, história;
- patentes, notícias, páginas web, material de divulgação.

## 4. Fontes, por relevância (DECIDIDO, 15/11: as de baixa relevância saem)

| fonte | por que é relevante | como se busca | situação |
|---|---|---|---|
| Scopus, Web of Science, FSTA | artigos de ciência de alimentos; a FSTA é a base da área | o Vicente busca à mão no Portal CAPES e exporta em RIS; o ReviewBR importa | sem bloqueio |
| SciELO | revistas brasileiras | `search_scielo` | falha F8; a busca espera o conserto |
| BDTD | teses e dissertações | `search_repository` com `BR-AGG-0001` | funciona |
| Embrapa (Alice, Infoteca-e) | principal grupo de pesquisa do caju; documentos técnicos | `search_repository` | falha F7; Infoteca-e inativa no catálogo |
| repositórios da UFC, UECE e UFPI | os estados da cajuína | `search_repository` | UFC e UECE: falha F7; UFPI: falha F5 |
| OpenAlex | cobertura ampla, pega o que escapa | `search_openalex` | funciona; conferir F2 e F3 na primeira busca |

Saem: PubMed, Europe PMC, CORE, Semantic Scholar e Crossref.

Para cada fonte, o protocolo registra o motivo acima e o período que ela cobre. O período tem de ser lido na
própria fonte no dia da busca; não foi conferido ainda.

## 5. Busca (PROPOSTA)

**Buscar só pelo produto, sem o bloco do conceito.** A literatura sobre cajuína é pequena (na busca exploratória,
"cajuína" deu 100 registros no OpenAlex e 25 na BDTD). Trazer tudo o que fala de cajuína e separar na triagem é o
que mais sustenta a afirmação de que algo não existe.

String do produto, a adaptar à sintaxe de cada base:

```
cajuína OR cajuina OR "suco de caju clarificado" OR "clarified cashew apple juice" OR "clarified cashew juice"
```

Para os repositórios brasileiros, consultas simples e sem acento: `cajuina`; `suco de caju clarificado`.

Controle positivo de cada fonte, antes de aceitar o resultado dela:
- a busca por `cajuina` tem de dar mais que zero;
- onde couber, um registro que se sabe existir tem de aparecer. Vistos na busca exploratória: na BDTD, a
  dissertação do fermentado de cajuína (`riufc/78207`) e a da kombucha (`riufc/67712`); no OpenAlex, "Cajuína:
  como produzir com qualidade" (Abreu e Souza, 2004).

## 6. Triagem (PROPOSTA, a partir da ideia do Vicente de 15/11: "a triagem poderia ser sobre os boleanos que
poderiam encontrar roda de aroma da cajuina")

Duas camadas:

1. **Camada mecânica, por palavras.** Depois de tirar os repetidos, o ReviewBR marca os registros cujo título,
   resumo ou palavras-chave trazem algum termo do conceito:
   `aroma*`, `sabor*`, `flavor`/`flavour`, `sensor*`, `descritor*`/`descriptor*`, `léxico`/`lexicon`,
   `roda`/`wheel`, `volát*`/`volatil*`, `odor*`, `olfat*`, `perfil`/`profile`.
   A tool candidata é a `batch_keyword_screen`; conferir o contrato dela em `.claude/TOOL_CONTRACTS.md` antes.
   **Registro sem resumo não é excluído por falta de palavra: vai para a leitura humana.**
2. **Camada humana.** Os registros que passaram, mais os sem resumo, são lidos e decididos pelo Vicente, primeiro
   pelo título e resumo, depois pelo texto completo.

## 7. Revisores (DECIDIDO, 15/11: até dois humanos)

- Revisor 1: Vicente. Revisor 2: um estagiário, que entra como coautor. No protocolo, escrever "estagiário" no
  lugar do nome.
- A IA e o ReviewBR não contam como revisores. O artigo declara que a parte mecânica da condução foi feita com o
  ReviewBR (DECIDIDO, 15/11).

O que cada humano revisa (PROPOSTA, a decidir no travamento; ideia do Vicente: "talvez escolher o que revisar no
travamento"):

| o quê | revisor 1 | revisor 2 |
|---|---|---|
| buscas feitas pela máquina | não refaz; confere uma vez se a contagem do registro da busca bate com os arquivos | não refaz |
| buscas na CAPES | executa e exporta | — |
| registros que passaram na camada mecânica, e os sem resumo | decide todos | decide todos, sem ver as decisões do revisor 1 |
| registros excluídos pela camada mecânica | — | confere uma amostra (sugestão: 20%, mínimo de 30) |
| texto completo dos que ficaram | decide todos | decide todos |
| discordância | conversa entre os dois; o resultado fica registrado | |

Por que os humanos não refazem as buscas: o que torna a busca reproduzível é o registro dela (texto exato, base,
data, contagem), não a repetição. O segundo revisor serve à seleção.

## 8. Extração e discussão (DECIDIDO em linhas gerais, 15/11)

- **Extração:** a descrição de cada fonte incluída. Campos propostos: referência; tipo de documento; estado e
  instituição; origem da cajuína estudada; método (painel, consumidores, instrumental); descritores de aroma e
  sabor relatados, com as palavras da fonte; compostos relatados; se organiza os descritores em roda ou léxico;
  onde a fonte está (base, repositório, endereço).
- **Discussão:** cabem comentários sobre o debate científico em torno do aroma e do sabor da cajuína. A literatura
  de fora do recorte (aroma do caju e das outras bebidas) pode aparecer aí como contexto, citada como tal, nunca
  como resultado da revisão.

## 9. O que o Vicente decide no travamento

1. Estudo só de compostos voláteis da cajuína, sem análise sensorial, entra? Proposta: entra, se a fonte o
   apresenta como estudo de aroma.
2. "Suco de caju clarificado" conta como cajuína? Proposta: só quando a fonte chama o produto de cajuína ou
   descreve a clarificação seguida do cozimento. Os outros casos ficam anotados como fronteira.
3. Buscar só pelo produto e usar as palavras do conceito como primeira camada da triagem (seções 5 e 6)?
4. A divisão do que cada humano revisa (seção 7).
5. O título e as três questões secundárias (seção 2).
6. Resumos de congresso contados à parte (seção 3).
7. O passo 1 (busca exploratória) fica registrado como parcial, e serve só de contexto.

## 10. O que "relato" quer dizer aqui

O PRISMA-ScR é uma lista do que o texto do artigo tem de conter: 22 itens, 20 neste projeto (os itens 12 e 16
saíram com a resposta "não" à avaliação crítica). O "relato" é o próprio artigo. Os registros, os logs e as
decisões gravadas são o material que preenche esses itens, e o ReviewBR os produz no caminho. O trabalho a mais é
conferir a lista no fim; esse preenchimento é do Vicente, com apoio da ferramenta.

## 11. Respostas do Vicente ao travamento (15/11/2026) — valem sobre as seções 3, 7 e 9 onde houver conflito

Resolvido:
- **Dúvida 1, compostos voláteis.** Entram os estudos de compostos voláteis da cajuína, sem condição. Motivo dele:
  "para identificar o estado da arte em relacao a estudos sensoriais da cajuina".
- **Dúvida 3, busca e triagem.** Aceita: a busca é só pelo produto, e os estudos que contêm as palavras de aroma e
  sabor formam a primeira camada da triagem.
- **Dúvida 5.** O título e as três questões secundárias ficam como na seção 2.
- **Dúvida 7.** A busca exploratória de 12/11 fica registrada como parcial e como motivação da revisão de escopo.
  Entra na justificativa (F0.3.1).
- **Conferência de 20%** dos excluídos pela camada de palavras: recusada ("nao me parece razoavel"). Sai da seção 7.
- **Os humanos não refazem as buscas**, com uma condição dele: "é necessario provar que o reviewbr usa exatamente o
  que um humano usaria caso tivesse tempo para realizar as buscas de escopo".

Como se prova a condição (PROPOSTA):
- o registro de cada busca guarda o texto exato, a fonte, a data e a contagem, de modo que um humano pode colar o
  mesmo texto no site da fonte e comparar;
- no lugar dos 20%, o controle positivo: a busca tem de trazer registros que se sabe existirem, e a camada de
  palavras tem de deixar passar fontes de aroma que se sabe existirem;
- hoje a prova **não** pode ser dada para SciELO, UFC, UECE e Embrapa: nelas a ferramenta devolve menos do que um
  humano acharia no site (falhas F7 e F8). É o que o passo A do `RETOMAR.md` tem de resolver.

Aberto, à espera dele:
- **Dúvida 2, suco de caju clarificado.** Posição dele: o insumo (suco clarificado, antes do cozimento) não é
  cajuína; há produção que usa a expressão por força legal, embora o processo seja o da cajuína; os produtos
  definidos como suco de caju clarificado não são desconsiderados neste trabalho. O termo fica na string de busca.
  Falta a regra da triagem para a fonte que estuda o suco clarificado **sem** o processo da cajuína, e para a que
  não descreve o processo.
- **Dúvida 4, o que os humanos decidem.** A frase "nao há necessidade de refazer buscas ou decidir o que entra ou
  nao de acordo com os criterios da triagem" tem duas leituras: (i) os humanos não redecidem o que a camada de
  palavras excluiu; (ii) os humanos não decidem inclusão nenhuma. A (ii) o ReviewBR não aceita: a lista final de
  incluídos é decisão do pesquisador (RV-04), em qualquer nível de controle.
- **Dúvida 6, resumos de congresso.** Ele perguntou se entram como literatura cinzenta. Resposta: sim, resumos e
  anais de congresso são literatura cinzenta, como teses e documentos técnicos. Proposta: entram com o tipo de
  documento anotado na extração, sem contagem à parte. Falta o aceite.
- **Ponto novo, produtos que usam o nome "cajuína" sem ser o produto cultural** (ele citou o refrigerante São
  Geraldo). A busca por "cajuína" vai trazê-los. Proposta: ficam fora da revisão, contados e anotados como uso do
  termo, para a discussão.

## 12. Fechamento das dúvidas (15/11/2026) — o protocolo v0.2 já traz tudo isto

- **Suco de caju clarificado.** "suco clarificado sem cozimento e sem o uso do termo cajuina saem por criterio de
  busca". A string passa a ser só `cajuína OR cajuina` (a da seção 5 não vale mais). O produto é definido pelo
  termo. Limite declarado: fonte que não usa a palavra não é encontrada.
- **O que os humanos decidem.** Há revisão humana ("então vai ter de ter revisao"): os dois revisores decidem os
  registros que passam pela camada de palavras. Ele quer fazê-la fora do ReviewBR, com ferramenta aceita pelas
  revistas. Proposta: Rayyan.
- **Produtos que usam o nome "cajuína"** sem ser a bebida (refrigerante): fora, contados e anotados. "correto".
- **Resumos de congresso:** entram, como literatura cinzenta. "entram".
- Pergunta dele que **não** entra na trava: "o que podemos decidir quando a decisao aconteceu nos criterios de
  busca?". Resposta dada no chat: a busca decide o que chega; resta decidir se o que chegou atende ao conceito.
