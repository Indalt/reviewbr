# ReviewBR: Open Science AI Tools for Academic Research

**ReviewBR** é um ecossistema avançado de inteligência artificial projetado para atuar como o seu principal assistente científico, abrangendo todo o espectro da pesquisa acadêmica: desde o apoio em pesquisas básicas ágeis até a coordenação inflexível do mais alto grau de busca por evidências (Revisões Sistemáticas).

Construído como um *fork* especializado e uma evolução arquitetural do aclamado projeto [prismAId](https://github.com/Open-and-Sustainable/prismAId), o ReviewBR adapta a automação de ponta a ponta para as necessidades do ecossistema científico latino-americano e global, operando sempre sob a premissa da **Ciência Aberta (Open Science)**.

---

## 🚀 O Potencial do Sistema

O ReviewBR transcende a simples automação de buscas. Ele é um motor de processamento distribuído onde a orquestração de Inteligência Artificial opera localmente via protocolo MCP (Model Context Protocol), conectando LLMs a bibliotecas potentes escritas em Go, Python e TypeScript.

O sistema elimina o atrito entre a pesquisa acadêmica e a programação, oferecendo um arsenal completo *"no-code"* para pesquisadores, guiado puramente através de um Agente de Inteligência Artificial.

### 1. Modelagem Metodológica e Trava de Auditoria (Protocol Guards)

O sistema garante a integridade científica impedindo que o escopo mude silenciosamente.

* **Planejamento Dinâmico:** Inicialização estruturada de projetos baseados na metodologia PICO (População, Intervenção, Comparação, Desfechos).
* **Previews Computacionais Mapeados:** LLMs são programados para, obrigatoriamente, testarem as queries de busca através de uma "Amostragem Rápida" (que não escreve no banco de dados) permitindo ao pesquisador validar os descritores.
* **Locked Execution (Execução Travada):** No momento em que uma busca bibliográfica oficial é disparada nas bases, o protocolo bloqueia o sistema. Nenhuma modificação nos metadados primários é permitida, forçando a transparência nos relatórios finais.

### 2. Hub de Repositórios Multi-Camada

Total integração via API nativa com repositórios e agregadores globais, filtrados através das lentes da Ciência Aberta:

* **Camada Institucional e Nacional (OasisBR):** Buscas distribuídas via OAI-PMH em quase 100 repositórios universitários brasileiros (como USP, UFSC, Unicamp, Teses CAPES).
* **Camada Regional Latino-Americana (SciELO):** Conector robusto que extrai a totalidade de metadados da Rede SciELO via OpenAlex.
* **Visão Global:** Consultas automatizadas no OpenAlex, PubMed, Crossref e agora **Semantic Scholar** (com filtro em nível de API garantindo PDFs de Acesso Aberto).

### 3. Pipeline de Triagem (Screening)

Não dependa da leitura cega. O motor ReviewBR aplica triagem algorítmica e por IA em escala:

* **Deduplicação Inteligente.**
* **Corte por Metadados:** Classificação automática do tipo do artigo e corte por idioma.
* **Leitura Seletiva Estruturada:** O LLM não engole lixo. O sistema fraciona artigos brutos em Introdução, Metodologia e Conclusão, decidindo a inclusão/exclusão da literatura primária embasado estritamente no seu protocolo PICO original.

### 4. Extração Nativa de PDFs e Text Mining

O calcanhar de aquiles das pesquisas resolvido via back-end super otimizado em Go:

* Conexão integrada (ou manual via Zotero) para realizar downloads síncronos da literatura elegível diretamente dos links nativos OA.
* Conversão robusta de PDF, DOCX, e HTML através do Apache Tika nativo.

---

## 📦 Instalação e Compartilhamento

O ReviewBR é uma ferramenta local — seus dados, chaves e projetos **nunca saem do seu computador**.

### Pré-requisitos

* **Node.js** ≥ 18
* **npm** ≥ 9
* **Git**

### Instalação (para quem recebe o sistema)

```bash
git clone https://github.com/Indalt/reviewbr.git
cd reviewbr/reviewbr-web
npm install
npm run dev
```

Acesse `http://localhost:3000`, informe seu nome e (opcionalmente) a sua API key. Pronto.

### Onde ficam os seus dados?

| O que | Onde fica | Vai no repositório? |
|-------|-----------|-------------------|
| Código da aplicação | `reviewbr-web/` | ✅ Sim |
| Código do MCP | `reviewbr/reviewbr-mcp/` | ✅ Sim |
| Suas API keys | `~/.reviewbr/.env` | ❌ Nunca |
| Seus projetos/dados | `~/.reviewbr/{usuario}/` | ❌ Nunca |
| `node_modules` | dentro de cada pasta | ❌ (.gitignore) |

> **Segurança:** Suas chaves de API ficam exclusivamente no seu computador em `~/.reviewbr/.env`. A IA na nuvem nunca as vê diretamente — o servidor local as carrega em tempo de execução.

### Para o desenvolvedor (MCP Server)

```bash
cd reviewbr/reviewbr-mcp
npm install
npm run build
```

---

## 🌐 Interface Web (ReviewBR Web)

A interface web oferece acesso completo ao sistema via chat com IA:

* **Login sem senha** — apenas identificador de workspace (cada usuário tem seus projetos isolados)
* **Multi-Modelo LLM** — suporte a Google Gemini, OpenAI (GPT-4o) e Anthropic (Claude)
* **23 ferramentas** expostas via chat hermético (a IA só acessa o que está declarado)
* **Ações rápidas** — cards para Planejar, Importar, Deduplicar, Triar, Auditar, Exportar
* **Auditoria visual** com apontamento de debilidades e score de conformidade

---

## 🛠️ Especificações Técnicas

* **Padrão de Revisão:** Suporte end-to-end do [Prisma 2020](https://www.prisma-statement.org/prisma-2020) e Prisma-S.
* **Integração de LLMs Suportadas via MCP/PrismAId:**
  * **OpenAI:** GPT-4o, o1, o3, etc.
  * **GoogleAI:** Gemini 1.5 Pro, Flash, Gemini 2.0 (Motores recomendados do ReviewBR).
  * **Anthropic:** Claude 3.5 Sonnet, Claude 3 Opus.
  * **Provedores Abertos/Cloud:** Cohere, DeepSeek, AWS e Groq.
* **Engines Base:**
  * Orquestrador de Contexto escrito em TypeScript / Node (MCP Server).
  * Backend de Mineração e Extrator de PDF processado através binários compilados em **Go**.
* **Saída Estruturada:** Dados tabulados entregues em CSV, JSON ou RIS puro, facilitando o consumo em softwares genéricos ou bibliotecários (SciVal, Zotero, Mendeley).

---

## 🤖 Arquitetura MCP e Ferramentas do Sistema

O coração do ReviewBR é o **Servidor MCP (Model Context Protocol)**. Ele funciona como uma "API Local" segura e padronizada que expõe capacidades reais da sua máquina para um modelo de Inteligência Artificial (como Claude ou Gemini).

**Como a IA se comunica com o Servidor?**

1. O usuário digita uma instrução no seu chat para a IA.
2. A IA decide, baseada no seu Raciocínio (Prompt), qual ação tomar.
3. Em vez de *"alucinar"* ou tentar navegar na web sozinha, a IA solicita silenciosamente ao servidor MCP: *"Ei servidor, execute a ferramenta `search_core` com os termos 'renewable energy'"*.
4. O servidor TypeScript (Node.js) captura essa requisição, vai até a internet, extrai e padroniza os dados (Open Science), salva no seu HD, e devolve apenas um resumo limpo para a IA.
5. A IA, em posse desses dados confiáveis, os entrega a você processados.

**🔒 Privacidade Total e Segurança no seu PC Local**
Uma preocupação comum de segurança é: *"Como uma IA na nuvem salva milhares de PDFs e planilhas na minha máquina? E como sei que ela não vai ler meus arquivos pessoais?"*

1. **A IA não acessa o seu HD diretamente.** A LLM (Gemini/Claude) é "cega e sem mãos" no seu sistema operacional. Todo o processo de criação de arquivos `.json`, gravação de CSVs ou downloads ocorre **integralmente pelo código do Servidor MCP que você instala localmente no seu computador**.
2. **Ambiente "Enjaulado" (Sandbox de Segurança):** Ao rodar o nosso servidor Node.js no terminal do seu computador, ele estabelece uma fronteira. As ferramentas (Tools API) construídas por nós **apenas permitem que a IA atue dentro das pastas do projeto** (`reviewbr/projects/`). A IA não possui ferramentas para "vasculhar o drive C:\", ler seus documentos ou instalar programas. Ela está completamente contida no escopo da pesquisa científica delimitada pelo servidor.

### Arsenal de Ferramentas Ativas (Tools API)

O sistema conta hoje com **25 ferramentas auditadas em TypeScript (Node.js)** divididas em suas responsabilidades essenciais:

#### Busca Global e Regional (Alcance Mundial)

* `search_papers_optimized`: Busca unificada em provedores sem restrição de escopo regional.
* `search_openalex`: Extração focada na gigantesca base do OpenAlex.
* `search_semanticscholar`: Extração focada em Semantic Scholar com filtro nativo de Open Access e links do Unpaywall.
* `search_core`: Interação com o maior agregador de repositórios Open Access do mundo (CORE).
* `search_crossref`: Busca precisa em metadados puros do Crossref.
* `search_europe_pmc`: Conexão com repositório líder europeu em ciências da vida e biomédicas.
* `search_pubmed`: Extração focada em dados médicos do PubMed NCBI.
* `search_scielo`: Busca direta no SciELO (América Latina, Open Access).
* `search_repository`: Busca abrangente e sem restrições regionais em repositórios institucionais (OAI-PMH, DSpace).
* `harvest_records`: Coleta em massa via OAI-PMH.
* `get_record_metadata`: Obtém metadados Dublin Core completos de registros individuais.
* `validate_repository`: Verifica saúde e capacidades de repositórios (conectividade, OAI-PMH, REST).
* `heal_repositories`: Motor de auto-cura (Auto-Healer). Lê o HTML da raiz das instituições com falha e varre ativamente em busca de links OAI-PMH ocultos, restaurando a conexão no catálogo mestre.

#### Triagem e Mineração Profunda

* `screen_candidates`: Triagem por IA generativa — envia metadados (ou PDFs extraídos completos, via **Smart Chunking**) para o LLM decidir "Sim, Não ou Talvez" com base no protocolo PICO. Ideal para exploração ágil.
* `screen_with_asreview`: **Triagem por ASReview ML (Active Learning ELAS)** — validada pela *Nature Machine Intelligence* (2021). O ReviewBR exporta o dataset, chama o ASReview como subprocesso, e importa os resultados automaticamente. O pesquisador escolhe uma trilha por projeto: LLM (rápida) ou ASReview ML (rigorosa para publicação). Requer `pip install asreview`.
* `snowball_search`: Rastreio passivo que minera as referências (para trás e para frente) dos seus melhores artigos elegíveis (Zotero ou OpenAlex) descobrindo a literatura oculta. **Tática de Extração e Fallback:** O sistema tenta primeiramente consultar Grafos de Conhecimento (APIs estruturadas como OpenAlex/Crossref), onde as referências já existem como identificadores atômicos estruturados, garantindo precisão absoluta e poupando custos computacionais de leitura textual.
* `deduplicate_dataset`: Motor avançado que compara DOI, Autores, e similaridade matemática de títulos para fundir e eliminar repetições na velocidade da luz.
* `get_screening_report`: **Métricas de Saturação (Stopping Rule)** — analisa a progressão da triagem batch a batch, calculando taxas de relevância cumulativas e detectando saturação. Quando os últimos 3 batches apresentam <5% de novos artigos relevantes, o sistema alerta que a triagem pode ser encerrada com base em evidência estatística.

#### Extração de Textos Brutos (Fallback Metodológico)

* `download_and_extract_pdfs`: Uma ferramenta cega e implacável para a IA chamar quando precisar baixar arquivos reais. Usa validações nativas e a biblioteca `pdf-parse` (Node) para ler os PDFs, rejeitando páginas de "Paywall disfarçadas de PDF" localmente. Essa esteira atua como a "força bruta computacional" final: caso o artigo (comum em teses nacionais) não tenha referências já padronizadas nos grandes grafos globais, a IA pode baixar o arquivo PDF e varrer o campo das bibliografias textuais com LLMs em busca das chaves semânticas.

#### Gestão de Dados e Ambiente

* `plan_research_protocol`: Cria um novo projeto de pesquisa, registra no banco central e gera a estrutura de pastas com protocolo PRISMA.
* `import_dataset_ris`: Importa dados de arquivo RIS (Zotero/EndNote) para normalização.
* `import_bvs_export`: Importa resultados exportados do portal BVS/LILACS (CSV).
* `export_dataset`: Formata em Markdown, CSV ou JSON rigorosamente auditável com selos PRISMA-S.
* `retrieve_fulltexts`: Verifica acesso aberto e baixa PDFs via Unpaywall.
* `audit_methodology`: Audita conformidade metodológica de pesquisa já concluída (5 checks: cobertura de bases, estratégia de busca, PRISMA, duplicatas, viés de seleção).
* `validate_prisma_flow`: Valida a consistência matemática do Fluxograma PRISMA (10 campos obrigatórios).

### 🎭 Orquestração de Agentes (Skills e Perfis)

Para lidar com a complexidade de uma pesquisa pesada, o ReviewBR não entrega todo o poder do sistema de uma vez. Ele impõe um **Controle de Acesso Baseado em Papéis (RBAC)** através do seu `AgentOrchestrator`. A IA (como Gemini ou Claude) "veste diferentes chapéus" *(skills)* durante o processo, garantindo isolamento de contexto e segurança:

1. **COORDINATOR (Coordenador Metodológico):** O agente líder. É o único com permissão para travar protocolos, modificar a estrutura do projeto (`registry.json`) e apagar arquivos. Ele planeja a pesquisa dialogando com você.
2. **LIBRARIAN (Bibliotecário):** Possui permissão exclusiva de Busca e Download. O agente bibliotecário mapeia as bases (OpenAlex, PubMed, OasisBR), mas ele **não julga** o conteúdo do que está baixando, evitando viés prematuro.
3. **SCREENER (Triador):** Lê os metadados brutos e os PDFs (usando *Smart Chunking*). A única missão do Screener é disparar queries puras contra a base para aceitar ou rejeitar arquivos cruzando com os critérios PICO. Ele é proibido de fazer downloads.
4. **EXTRACTOR (Minerador de Dados):** Lê as "pastas dos artigos elegíveis" e constrói planilhas formatadas, extraindo respostas cirúrgicas do corpo de texto para a pesquisa.
5. **ANALYST (Estatístico/Sintetizador):** Avalia os datasets finais exportados, montando sínteses bibliométricas (Tabelas e Gráficos Mentais) de tudo o que foi publicado.

Ao fragmentar a responsabilidade em agentes hiperfocados, o ReviewBR aniquila a "alucinação de IA", pois cada agente trabalha em um estuário de dados enclausurado.

---

## 📖 Fluxos de Uso Adaptativo no Chat

O ReviewBR é construído para operar de forma orgânica. O usuário não precisa dominar os jargões metodológicos no prompt; a Inteligência Artificial intuirá o grau de rigor necessário, guiando o pesquisador desde uma curiosidade inicial até a construção de um protocolo de alta evidência.

### O Espectro Científico (Da Descoberta ao Rigor PRISMA)

A interação ocorre em linguagem natural, e a IA escala automaticamente as ferramentas do servidor MCP conforme a complexidade evolui:

1. **Investigação Inicial (Descoberta Ágil)**
   * *Exemplo de Uso:* "Me traga os 5 artigos mais recentes sobre vacinas de RNA mensageiro no Europe PMC."
   * *Ação da IA:* A extração ocorre em tempo real. A IA busca na base global, baixa os PDFs em background, lê usando *Smart Chunking* e fornece os insights cirurgicamente.

2. **Escalonamento para Evidência Metodológica**
   * Quando a pesquisa exige prova de exaustividade e validade (para publicações ou teses rigorosas), a IA sugere e orquestra a criação de um ambiente controlado.
   * *Ação da IA:* O sistema pede para inicializar o projeto.
   * A requisição testa tendências via amostragem e, mediante validação, **trava a matriz de busca oficial em múltiplas bases (Locked Execution)**.
   * O robô local roda mineração e triagem massiva. Ao final, gera um log auditável com selo PRISMA-S, pronto para peer-review.

3. **Auditoria Retroativa (Post-Hoc Validation)**
   * *Exemplo de Uso:* "Já terminei minha revisão sistemática. Tenho 47 artigos no meu RIS. Quero saber se minha metodologia está boa."
   * *Ação da IA:* Reconhece que o usuário já completou a pesquisa e sugere o modo `methodological_audit`. O sistema **não busca novos artigos** — apenas ingere o dataset do pesquisador e roda 5 verificações de conformidade (Cobertura de Bases, Documentação de Estratégia, Consistência PRISMA, Duplicatas Residuais e Viés de Seleção), entregando um relatório estruturado com score e sugestões.

---

### 🔑 Configuração de Chaves (API Keys)

O ReviewBR foi arquitetado para minimizar o custo do pesquisador usando o poder do **Acesso Aberto (Open Access)**.

1. **Buscas Livres de Chaves:** 99% das extrações (PubMed, OpenAlex, SciELO, CORE, Europe PMC, BVS) são conectadas usando rotas acadêmicas públicas e gratuitas. O usuário **não precisa** configurar chaves para baixar milhares de PDFs e metadados.
2. **Chave de Triagem (Obrigatória):** Para que o servidor consiga triar artigos via LLM, você precisará de uma chave de **um dos provedores suportados**: Google Gemini, OpenAI, ou Anthropic.
3. **Chave Zotero (Opcional):** Para exportar para a nuvem do Zotero acadêmico.

#### Provedores de LLM Suportados

| Provedor | Modelos | Chave |
|----------|---------|-------|
| **Google Gemini** | Gemini 2.0 Flash (grátis), 2.5 Pro, 2.5 Flash | `GOOGLE_API_KEY` |
| **OpenAI** | GPT-4o, GPT-4o Mini, GPT-4.1, GPT-4.1 Mini | `OPENAI_API_KEY` |
| **Anthropic** | Claude Sonnet 4, 3.5 Sonnet, 3.5 Haiku | `ANTHROPIC_API_KEY` |

A seleção do provedor e modelo é feita na tela de **Configuração** da interface web.

#### Onde ficam as chaves?

| Modo | Local do `.env` | Quem usa |
|------|-----------------|----------|
| **Interface Web** | `~/.reviewbr/.env` (cada usuário no seu computador) | Qualquer pessoa que receba o sistema |
| **MCP Server (dev)** | `reviewbr-mcp/.env` | Desenvolvimento via terminal |

Na **primeira execução** da interface web, o sistema mostra uma tela de login. O usuário configura sua chave em **Configuração**, e ela é gravada localmente em `~/.reviewbr/.env`.

Formato do arquivo `~/.reviewbr/.env`:

```env
GOOGLE_API_KEY="AIzaSyA..."
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
LLM_PROVIDER="gemini"
LLM_MODEL="gemini-2.0-flash"
ZOTERO_USER_ID="123456"
ZOTERO_API_KEY="abcd..."
```

Essas chaves residem exclusivamente no hardware do usuário. A IA da nuvem nunca as vê; ela apenas instrui o servidor, que saca a chave da máquina local para abrir a porta.

---

### Mantenha o Rigor Científico

O ReviewBR atua em ambiente de *No-Code*. Qualquer requisição para que o Agent de IA construa gambiarras (scripts soltos em Python/R) na máquina para tabular dados será rejeitada a favor das *Tools* nativas auditadas do repositório, mantendo o estuário da ciência totalmente limpo e reprodutivel por pares no futuro.

### 🧩 Extensões Privadas (Local Plugins / BYOS)

Para necessidades específicas que violam políticas estritas de servidores públicos ou repositórios como o GitHub (ex: extração de PDFs em *Shadow Libraries* como o **Sci-Hub** para furar paywalls das grandes editoras), o ReviewBR adota a arquitetura corporativa **Bring Your Own Script (BYOS)**.

1. **Pasta Blindada:** Qualquer script criado dentro da pasta raiz `plugins/` é automaticamente ignorado pelo controle de versão. Eles nunca vão parar no GitHub (evitando *takedowns* via DMCA).
2. **Execução Supervisionada:** A Inteligência Artificial (Gemini/Claude) tem visibilidade e permissão para executar seus scripts de forma controlada no terminal local do seu PC.
3. **Casamento Perfeito:** Você pode instruir a IA no chat orgânico: *"Notei que temos 5 artigos com paywall. Acione o plugin local `scihub_extractor.py` enviando os DOIs deles para baixar forçadamente as cópias."*
4. **Python First para Scraping:** Embora o *core* do servidor funcione em altíssima performance no ecossistema Node.js / Go, recomendamos fortemente o uso do **Python** para a escrita desses plugins piratas (ex: usando `requests` e `beautifulsoup4`). A linguagem Python domina de forma absoluta as rotinas e quebras de captcha e anti-bots exigidas nesses cenários.

---

## Agradecimentos & Licença

As ferramentas basais de mineração foram idealizadas no projeto `prismAId` (Criado por Riccardo Boero). Modificações profundas neste ecossistema refletem o núcleo especializado do ReviewBR para indexação da ciência latino-americana.
**Licença:** GNU AFFERO GENERAL PUBLIC LICENSE, Version 3.
