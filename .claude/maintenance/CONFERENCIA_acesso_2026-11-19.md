# Conferência jurídica e ética do acesso por robô — 19/11/2026

> Pedida pelo Vicente em 19/11/2026, antes de qualquer estratégia de acesso a UECE, Alice e Infoteca-e. Origem: "ciencia
> aberta deve ser ciencia aberta e estrategias para a minha compreensao nao sao burlar etica. ver isso em juridico
> antes de fazer algo". Citada pela linha 14 da `FILA.md`. Não é parecer de advogado: é a leitura das fontes abaixo,
> feita na manutenção, para decidir o que o ReviewBR faz.

## A pergunta

O ReviewBR pode buscar por robô num repositório que recusa o robô (HTTP 403, ou `robots.txt` que proíbe o caminho)?
Pode se apresentar como navegador para ser atendido?

## Fontes lidas em 19/11/2026

| # | fonte | o que diz, no que importa aqui |
|---|---|---|
| 1 | Código Penal, art. 154-A (Lei 12.737/2012, redação da Lei 14.155/2021), texto consolidado da Câmara: `camara.leg.br/legin/fed/declei/1940-1949/decreto-lei-2848-7-dezembro-1940-412868-normaatualizada-pe.html` | crime "invadir dispositivo informático de uso alheio (…) com o fim de obter (…) dados ou informações sem autorização expressa ou tácita do usuário do dispositivo"; reclusão de 1 a 4 anos |
| 2 | Lei 9.610/1998 (direitos autorais), arts. 8º e 87, texto consolidado da Câmara (`…/lei-9610-19-fevereiro-1998-365399-normaatualizada-pl.html`) | art. 87: o titular da base de dados tem o direito exclusivo de autorizar ou proibir a reprodução total ou parcial dela; art. 8º, V e VI: informação de uso comum e nomes e títulos isolados não são protegidos |
| 3 | Lei 12.527/2011 (LAI), arts. 1º, 7º e 8º, texto consolidado da Câmara (`…/lei-12527-18-novembro-2011-611802-normaatualizada-pl.html`) | empresa pública e autarquia estão sujeitas (art. 1º, par. único, II); os sítios de transparência devem "possibilitar o acesso automatizado por sistemas externos em formatos abertos, estruturados e legíveis por máquina" (art. 8º, § 3º, III); o cidadão pode pedir a informação (art. 10) |
| 4 | Lei 13.709/2018 (LGPD), art. 7º, IV e § 4º, texto consolidado da Câmara | tratamento para estudo por órgão de pesquisa; dispensa de consentimento para dado tornado manifestamente público |
| 5 | RFC 9309 (IETF, 2022), *Robots Exclusion Protocol*, seção 1: `rfc-editor.org/rfc/rfc9309` | "These rules are not a form of access authorization": o `robots.txt` pede, não tranca |
| 6 | `robots.txt` lidos em 19/11/2026 | Alice e Infoteca-e: `Disallow: /simple-search`, `/discover`, `/browse`; o `/oai` não é proibido. UFC: `Disallow: /simple-search`. UFPI e IFCE: `Disallow: /search` (a interface), a API REST não é proibida. BDTD: `Disallow: /vufind/Search/`, a API (`/vufind/api/v1/search`) não é proibida. SciELO (`search.scielo.org`): só os buscadores (Google, Bing e outros) podem; `User-agent: *` → `Disallow: /`. UECE: o `robots.txt` não existe (página de erro) |
| 7 | OAI-PMH `Identify` de Alice e Infoteca-e, lidos em 19/11/2026 | respondem; contato `cg-riaa@embrapa.br`; 149.622 e 59.751 registros (`completeListSize`). UECE: o OAI do catálogo dá 404 |
| 8 | Krotov, Johnson e Silva (2020), *Tutorial: Legality and Ethics of Web Scraping*, CAIS 47, doi:10.17705/1CAIS.04724 (lido o resumo) | quem raspa a web tem de responder, antes, às questões legais e éticas do site; ignorá-las leva a controvérsia ética e a processo |

## O que as fontes permitem concluir

1. **Ler página pública não é invasão.** Mas o art. 154-A gira em torno da autorização "expressa ou tácita". Um 403
   dado ao robô, junto com um `robots.txt` que proíbe o caminho, é recusa expressa ao acesso automatizado. Contornar a
   recusa (trocar o User-Agent para parecer navegador) tira o argumento da autorização tácita. Não li decisão judicial
   sobre o caso; o risco não é nulo, e o ReviewBR não o assume pelo pesquisador.
2. **O repositório é uma base de dados (Lei 9.610, art. 87).** Registros isolados não são protegidos, mas a extração
   sistemática depende de autorização do titular. O canal que o titular abre para robôs — OAI-PMH, API — é essa
   autorização. A página de busca proibida no `robots.txt` não é.
3. **A LAI não autoriza contornar.** O § 3º do art. 8º fala dos sítios de transparência; serve de argumento para pedir
   à instituição um acesso por máquina (art. 10), não para forçá-lo.
4. **LGPD não é obstáculo** para metadados bibliográficos com nome de autor (art. 7º, IV e § 4º).
5. **Ética.** A ciência aberta abre o conteúdo: qualquer pessoa lê e busca nesses sites pelo navegador. Ela não obriga
   o servidor a atender robô; quem recusa o robô decide sobre a própria infraestrutura. Um robô que se diz navegador
   anula o único meio que o site tem para aplicar essa decisão. É o que o Vicente chamou de burlar.

## Consequência para o ReviewBR

- **Feito nesta sessão:** o cliente HTTP da camada de acesso (`src/utils/http.ts`) e o `heal_repositories` passam a se
  identificar como `ReviewBR-MCP/1.0 (+https://github.com/Indalt/reviewbr)`, como já faziam o CORE, o Europe PMC e o
  Semantic Scholar. Antes, sorteavam um User-Agent de navegador. Conferido em 19/11/2026, com o User-Agent
  identificado, as APIs da BDTD (25 para "cajuina"), da UFPI (41) e do IFCE (1) respondem como antes.
- **Permitido:** API ou OAI-PMH que o repositório oferece; agregador com API (BDTD, OpenAlex); busca feita à mão pelo
  pesquisador, no navegador (o `robots.txt` vale para robô), depois importada; pedido à instituição.
- **Não permitido:** User-Agent de navegador; busca por robô em caminho que o `robots.txt` proíbe ou que o servidor
  recusa.
- **`heal_repositories`:** não é estratégia de busca. Só procura endereço OAI-PMH de repositório cujo OAI está marcado
  como indisponível ou sem endereço (`repository_healer.ts:18`, não pelo `status` "inactive"), e reescreve o catálogo.
  Alice e Infoteca-e têm OAI que responde, e ele não as examina. Muda o sistema e está entre as tools do `librarian`.

## O que isso decide, e o que espera o Vicente

Para as três fontes, as estratégias legítimas são: (a) o Vicente busca à mão no site, como fez no Portal CAPES, e a
busca é importada; (b) Alice e Infoteca-e por OAI-PMH, colhendo tudo (cerca de 210 mil registros) e filtrando no
ReviewBR — o total não será o que o site mostra; (c) pedir à Embrapa (`cg-riaa@embrapa.br`) e à UECE um acesso por
máquina. Qualquer uma muda o "Como se busca" do protocolo travado: é emenda.

Duas coisas a regra atinge além das três: a **UFC**, cuja busca a linha 11 faz pela página `/simple-search`, que o
`robots.txt` da UFC proíbe; e o **SciELO** (linha 12, item 2), cuja busca no site proíbe robôs.

Nota de conduta: esta conferência fez um pedido à `/alice/simple-search` (para confirmar o 403 com o User-Agent
identificado) e um à `/simple-search` da UFC (antes de ler o `robots.txt` dela), caminhos que o `robots.txt` proíbe.
Um pedido em cada; não se repete.
