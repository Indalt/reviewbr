# Passo 1 — O que já existe: roda de aromas, léxico ou descrição de aroma de produtos do Ceará

Agente `scout`, 12/11/2026. É um levantamento exploratório, não uma revisão sistemática.
Log das 43 buscas: `01_buscas_log.md`. Falhas do ReviewBR: `01_falhas_reviewbr.md` (F1 a F8).

**Aviso de leitura.** Nenhuma tool devolveu resumo dos itens: o OpenAlex traz só título, autores, ano e DOI, e a BDTD traz título, autor, tipo e palavras-chave (F3). A coluna "o que descreve" diz **apenas o que está no título ou nas palavras-chave**. Nada aqui foi lido no texto completo.

## 1. Resposta curta

Nas fontes consultadas, **não apareceu nenhuma roda de aromas (flavor ou aroma wheel) nem léxico sensorial publicado para um produto do Ceará.**

- A única "roda" ligada a um produto cearense é uma **roda de emoções do provador de café**, não uma roda de aromas. Ela vem de cafés do Maciço de Baturité (Souza, UFC, 2019; artigo de 2021).
- Há **descrições sistemáticas de perfil sensorial** para:
  - o queijo coalho do Ceará (análise descritiva quantitativa, 2006);
  - méis do Ceará de diferentes floradas (análise descritiva quantitativa, UFC);
  - o café sombreado de Baturité (perfil sensorial e de voláteis, UFC, 2022).
- Para o caju há muitos estudos de compostos voláteis e de aroma: suco, suco concentrado, vinho, fermentados espumantes de clones e fibra. Os grupos são Embrapa, Unicamp, UFC e UECE. Pelos títulos, o produto estudado é o caju, sem vínculo declarado com a origem cearense.
- Para a **cajuína**, nenhum perfil descritivo de aroma nem estudo de voláteis apareceu. Há apenas produtos derivados (fermentado tipo sidra, kombucha, isotônico) e estudos de processo.

## 2. Itens relevantes (29)

Legenda de tipo: art = artigo; dis = dissertação; tese = tese; doc = documento técnico ou capítulo. "Grau" segue o que a BDTD informa.

| # | título (resumido) | autores | ano | tipo | produto | o que descreve sobre aroma (só pelo título/palavras-chave) | origem |
|---|---|---|---|---|---|---|---|
| 1 | Perfil emocional de cafés (Coffea arabica L.) produzidos no maciço de Baturité – CE e desenvolvimento da roda de emoções do provador de café | Souza, Clarisse Machado de | 2019 | dis | café, Baturité | roda de **emoções**, não de aromas; "ciências sensoriais", "análise multivariada" | BDTD → http://www.repositorio.ufc.br/handle/riufc/52125 ; também no OpenAlex, sem DOI |
| 2 | Development of the coffee Taster's emotion wheel for the coffee drinking experience | Souza, C. M.; Rodrigues, D. C.; Sousa, P. H. M. | 2021 | art | café (o título não cita Baturité) | roda de emoções do provador | OpenAlex → https://doi.org/10.1016/j.ijgfs.2021.100451 |
| 3 | Café arábica do tipo sombreado produzido no Maciço de Baturité-CE: perfil dos consumidores, sensorial e de voláteis | Penha (a BDTD dá "Maria Flávia Azevedo da"; o OpenAlex dá "Maria Roseane dos Santos") | 2022 | tese | café sombreado, Baturité | perfil sensorial (CATA) e perfil de voláteis | BDTD → http://www.repositorio.ufc.br/handle/riufc/70321 ; OpenAlex, sem DOI. **Autoria diverge entre as bases** |
| 4 | Cafés cultivados em sistemas agroflorestais e seus condicionantes de qualidade química, sensorial e dos fungos micorrízicos arbusculares na região do Maciço do Baturité, Ceará | Martins, Eloisio de Oliveira | s/d (a tool não deu) | dis (IFES) | café, Baturité | qualidade sensorial; "terroir" | BDTD → https://repositorio.ifes.edu.br/handle/123456789/4661 |
| 5 | Desenvolvimento do perfil sensorial de queijo de coalho produzido no Estado do Ceará | Andrade, A. A.; Nassu, R. T.; Rodrigues, M. C. P.; Silva, G. J. F.; Fernandes, R.; Silva, A. C. | 2006 | doc/art (a tool não diz) | queijo coalho, CE | desenvolvimento de perfil sensorial | OpenAlex, **sem DOI e sem URL** (F1) |
| 6 | Estudo do perfil sensorial, físico-químico e aceitação de queijo de coalho produzido no estado do Ceará | Andrade, Alex-Sandra Alexandre de | 2006 | dis | queijo coalho, CE | análise descritiva quantitativa | BDTD → http://www.repositorio.ufc.br/handle/riufc/17217 |
| 7 | Perfil do consumidor e aceitação sensorial de queijo de coalho | Andrade, A. A.; Nassu, R. T. et al. | 2006 | doc/art | queijo coalho (o título não cita o CE) | aceitação, não descrição | OpenAlex, sem DOI |
| 8 | Caracterização físico-química, avaliação sensorial, proteômica e bioquímica do queijo coalho do Jaguaribe-CE visando o processo de indicação geográfica | Fontenele, Maria Alves | s/d | tese | queijo coalho do Jaguaribe, CE | avaliação sensorial; voltado à indicação geográfica | BDTD → https://siduece.uece.br/siduece/trabalhoAcademicoPublico.jsf?id=88276 e http://www.alice.cnptia.embrapa.br/alice/handle/doc/1123469 |
| 9 | Qualidade sensorial e físico-química de méis de abelha melífera produzidos a partir de diferentes origens florais no Estado do Ceará | Queiroz, Herlene Greyce da Silveira | s/d | dis | mel, CE | análise descritiva quantitativa por origem floral | BDTD → http://www.repositorio.ufc.br/handle/riufc/17564 |
| 10 | Compostos voláteis responsáveis pela qualidade sensorial de fermentados espumantes de diferentes clones de caju | Oberg, Milena Lidiani Bomfim de Melo | s/d | tese | fermentado espumante de caju | voláteis ligados à qualidade sensorial, por clone | BDTD → https://siduece.uece.br/siduece/trabalhoAcademicoPublico.jsf?id=84200 |
| 11 | Análise dos compostos voláteis da fibra do caju e de seus coprodutos | Nobre, Ana Carolina de Oliveira | s/d | dis/tese | fibra de caju | voláteis | BDTD → https://siduece.uece.br/siduece/trabalhoAcademicoPublico.jsf?id=84862 e http://www.alice.cnptia.embrapa.br/alice/handle/doc/1104397 |
| 12 | Chemometric analysis of the volatile profile in peduncles of cashew clones and its correlation with sensory attributes | Freitas, A. S.; Magalhães, H. C. R.; Alves Filho, E. G.; Garruti, D. S. | 2021 | art | pedúnculo de caju (clones) | perfil volátil × atributos sensoriais | OpenAlex → https://doi.org/10.1111/1750-3841.15957 |
| 13 | Suitability of peduncles of new cashew tree clones for commercial purposes | Freitas, A. S.; Dantas, B. S.; Araújo, I. M. S.; Garruti, D. S. | 2020 | art | pedúnculo de caju | não dá para saber pelo título se descreve aroma | OpenAlex → https://doi.org/10.5935/1806-6690.20200050 |
| 14 | Composição de voláteis e qualidade de aroma do vinho de caju | Garruti, Deborah dos Santos | s/d | tese (Unicamp) | vinho de caju | voláteis e qualidade de aroma | BDTD → https://hdl.handle.net/20.500.12733/1590362 |
| 15 | Identificação do perfil de voláteis e caracterização de seus impactos odoríferos em water phase e essências naturais de caju | Sampaio, Karina de Lemos | 2007 | tese (Unicamp) | essências e water phase de caju | perfil volátil e impacto odorífero | OpenAlex → https://doi.org/10.47749/t/unicamp.2007.401849 ; BDTD → https://hdl.handle.net/20.500.12733/1605058 |
| 16 | Dinâmica da perda e formação de compostos voláteis durante a concentração de suco de caju e impacto sobre o perfil sensorial da bebida | Biasoto, Aline Camarão Telles | 2013 | tese (Unicamp) | suco de caju concentrado | voláteis, olfatometria, perfil sensorial | OpenAlex → https://doi.org/10.47749/t/unicamp.2013.905699 |
| 17 | Dynamics of the loss and emergence of volatile compounds during the concentration of cashew apple juice and the impact on juice sensory quality | Biasoto, A. C. T.; Sampaio, K. L.; Marques, E. J. N.; Da Silva, M. A. A. P. | 2015 | art | suco de caju | voláteis e qualidade sensorial | OpenAlex → https://doi.org/10.1016/j.foodres.2014.12.038 |
| 18 | Aroma volatiles recovered in the water phase of cashew apple juice during concentration | Sampaio, K. L.; Garruti, D. S.; Franco, M. R. B.; Janzantti, N. S.; Da Silva, M. A. A. P. | 2011 | art | suco de caju | voláteis de aroma | OpenAlex → https://doi.org/10.1002/jsfa.4385 |
| 19 | Aroma compounds derived from the thermal degradation of carotenoids in a cashew apple juice model | Zepka, L. Q.; Garruti, D. S.; Sampaio, K. L.; Mercadante, A. Z.; Da Silva, M. A. A. P. | 2013 | art | suco de caju (modelo) | compostos de aroma | OpenAlex → https://doi.org/10.1016/j.foodres.2013.12.015 |
| 20 | Influence of Glow Discharge Plasma Treatment on Cashew Apple Juice's Aroma Profile and Volatile Compounds | Maia, D. L. H.; Rodrigues, S.; Fernandes, F. A. N. | 2023 | art | suco de caju | perfil de aroma e voláteis sob processamento | OpenAlex → https://doi.org/10.1155/2023/7740638 (da mesma série: https://doi.org/10.1016/j.fbio.2024.104244 e https://doi.org/10.1021/acsfoodscitech.4c00152, 2024) |
| 21 | Chemometric evaluation of the volatile profile of probiotic melon and probiotic cashew juice | Alves Filho, E. G. et al. | 2017 | art | suco de caju probiótico | perfil volátil | OpenAlex → https://doi.org/10.1016/j.foodres.2017.05.030 |
| 22 | Perfil sensorial, aceitação e caracterização em compostos bioativos de néctares mistos de frutas tropicais | Fonseca, Ana Valquiria Vasconcelos da | s/d | tese | néctares mistos de frutas tropicais | análise descritiva quantitativa | BDTD → http://www.repositorio.ufc.br/handle/riufc/18641 |
| 23 | Extração, composição química e perfil sensorial de óleos de amêndoa de castanha de caju quebrada | Leal, Amanda Rodrigues | s/d | tese | óleo de amêndoa de castanha de caju | perfil sensorial | BDTD → http://repositorio.ufc.br/handle/riufc/78547 |
| 24 | Fermentado alcoólico acidificado de cajuína, tipo sidra, como proposta de aproveitamento do pedúnculo de caju | Machado Matias, Fernando | 2024 | dis | fermentado de cajuína | o título não fala de aroma | BDTD → http://repositorio.ufc.br/handle/riufc/78207 ; OpenAlex, sem DOI |
| 25 | Efeito da adição de suco clarificado de caju nas características tecnológicas e propriedades sensoriais da kombucha | Freitas, Ana Karoline Nogueira | 2022 | dis | kombucha com cajuína | "propriedades sensoriais"; palavras-chave citam cajuína | BDTD → http://www.repositorio.ufc.br/handle/riufc/67712 e http://www.alice.cnptia.embrapa.br/alice/handle/doc/1152668 |
| 26 | Perfil sensorial de cachaça utilizando diferentes metodologias com consumidores | Costa, Vanderson da Silva | s/d | tese | cachaça (o título não diz que é cearense) | perfil sensorial com consumidores (CATA, escala de intensidade) | BDTD → http://www.repositorio.ufc.br/handle/riufc/40816 |
| 27 | Physicochemical characterization, antioxidant activity, and sensory analysis of beers brewed with cashew peduncle and orange peel | Pereira, I. M. C. et al. | 2020 | art | cerveja com pedúnculo de caju | análise sensorial | OpenAlex → https://doi.org/10.1590/fst.17319 ; dissertação correlata: Menezes, N. V. S., BDTD → http://www.repositorio.ufc.br/handle/riufc/39653 |
| 28 | Effects of Seriguela (Spondias purpurea) and Orange Peel on the Physicochemical and Sensory Properties ... of Wheat Beer | Silva, A. A.; Sousa, P. H. M.; Oliveira, L. S.; Gaban, S. V. F. | 2024 | art | cerveja de trigo com seriguela | propriedades sensoriais | OpenAlex → https://doi.org/10.1021/acsfoodscitech.4c00453 |
| 29 | Perceptions of local food consumption and sensory acceptance of cashew products among tourists in Ceará, Brazil | Araújo, I. M. S.; Garruti, D. S. et al. | 2025 | art | produtos de caju, CE | aceitação, não descrição | OpenAlex → https://doi.org/10.1590/1981-6723.14224 |

Itens vistos, mas laterais e fora da tabela:
- documentos técnicos de produção: "Cajuína: como produzir com qualidade" (Abreu & Souza, 2004, OpenAlex, sem DOI); "Processo agroindustrial: elaboração de fermentado de caju" (Garruti et al., 2003);
- outros estudos de café de Baturité: espectroscopia NIR e qualidade (Nogueira, UNILAB, https://repositorio.unilab.edu.br/jspui/handle/123456789/5673); Martins et al. 2023 (https://doi.org/10.1007/s00217-023-04228-7), cujo título não cita Baturité;
- mel do Ceará só em físico-química ou polínica: Vasconcelos & Liberato 2021 (https://doi.org/10.36229/978-65-5866-043-9.cap.03); Sodré 2005 (https://doi.org/10.11606/t.11.2005.tde-22102007-084952);
- abacaxi: perfil sensorial e de voláteis de suco concentrado (Facundo, Embrapa, http://www.alice.cnptia.embrapa.br/alice/handle/doc/573054), produto não ligado ao CE pelo título.

Para comparação, fora do Ceará apareceram rodas ou léxicos de outros produtos brasileiros:
- roda sensorial de cachaça (Galdino, UFLA, https://repositorio.ufla.br/handle/1/60396);
- léxico de cachaça artesanal não envelhecida (Caetano et al. 2021, https://doi.org/10.1111/joss.12645);
- flavour wheel de Coffea canephora (Carvalho et al. 2025, https://doi.org/10.1038/s41598-025-99921-w).

## 3. O que NÃO foi encontrado e com que controle

| procurado | onde | resultado | controle |
|---|---|---|---|
| roda de aromas ou flavor wheel de produto do CE | OpenAlex (buscas 1, 15); BDTD (22) | nenhuma; só a roda de emoções do café | válido: as mesmas buscas trouxeram rodas de outros produtos (Galdino; Carvalho 2025), então a base acha "roda" quando existe |
| léxico sensorial de produto do CE | OpenAlex (16); BDTD (23) | nenhum | válido: a BDTD achou léxicos de cachaça (MG) e de vinho na mesma busca |
| perfil descritivo de aroma de cajuína | OpenAlex (2, 4, 14); BDTD (21) | nenhum | positivo: "cajuína" retorna 100 (OpenAlex) e 25 (BDTD) registros, mas nenhum desse tipo |
| léxico, roda ou ADQ de castanha de caju (amêndoa) | OpenAlex (10) | nenhum no topo 10 | parcial: só se viu o perfil sensorial do **óleo** de amêndoa (item 23) |
| perfil sensorial ou voláteis de cachaça cearense | OpenAlex (8); BDTD (34) | nenhum que diga "Ceará" no título | positivo: a base traz cachaças da Paraíba e de MG |
| perfil sensorial de frutas regionais do CE (cajá, seriguela, murici, umbu) | OpenAlex (17) | nada do CE no topo 10 | positivo: a busca trouxe umbu de MG |
| perfil sensorial de rapadura | OpenAlex (18) | nenhum | — |
| qualquer coisa no SciELO | SciELO (40–43) | sem uso | **inválido**: falso negativo da ferramenta (F8) |
| busca direta nos repositórios da UFC, da UECE, da Alice/Embrapa e do IFCE | `search_repository` (25–31) | zero | **inválido**: zero até para "caju", que a BDTD mostra existir nesses repositórios (F7). Esses acervos só foram vistos através da BDTD |

## 4. Lacunas observadas (sem recomendar recorte)

- Nenhuma roda de aromas nem léxico sensorial para produto cearense apareceu. A única roda é de emoções (café de Baturité).
- Os perfis descritivos de produtos do CE encontrados (queijo coalho 2006, méis por florada, café sombreado 2022) têm, pelo título, a forma de ADQ, CATA ou voláteis. Nenhum deles diz ter organizado os descritores em roda ou léxico.
- Para o caju, a química de voláteis é abundante (suco, concentrado, vinho, espumante, fibra, clones). Para a cajuína especificamente, não apareceu estudo de aroma.
- Não apareceu nada sobre cachaça, cerveja artesanal ou frutas nativas que seja descrito como cearense quanto ao aroma. As cervejas encontradas usam frutas regionais como ingrediente.
- Nada foi visto sobre outros produtos possíveis do CE: rapadura, licores regionais, peixes e frutos do mar, mel de abelhas nativas do CE.

## 5. Limites

- **Exploratório, não exaustivo.** Foram 43 execuções em OpenAlex, BDTD, SciELO e repositórios, sem protocolo, sem triagem dupla e sem fluxograma.
- **Só títulos e palavras-chave.** Nenhum resumo nem texto completo foi lido (F3). A coluna "o que descreve" pode errar para mais ou para menos.
- **Visibilidade parcial.** O OpenAlex só mostra os 10 primeiros resultados de cada busca; o resto fica num JSON que não é gravado sem projeto (F2). Itens relevantes podem estar além do topo 10.
- **Repositórios do Ceará só por via indireta.** A busca direta na UFC, UECE, Alice/Embrapa e IFCE não funciona (F7). A Infoteca-e está inativa no catálogo. O SciELO não serviu (F8). Tudo o que veio desses acervos chegou pela BDTD, que só cobre teses e dissertações. Artigos, documentos técnicos e comunicados da Embrapa ficaram em grande parte fora.
- **Ano ausente nos itens da BDTD** (marcados "s/d"): a tool não devolve a data.
- **Divergência de metadados**: a autoria do item 3 difere entre o OpenAlex e a BDTD.
- Fontes não consultadas por decisão do pesquisador: web aberta. Por escolha deste passo: PubMed e Europe PMC, por não serem o foco.
