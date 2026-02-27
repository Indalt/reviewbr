# ReviewBR: Open Science AI Tools for Systematic Literature Reviews

**ReviewBR** é um ecossistema avançado de inteligência artificial projetado para atuar como um **Coordenador Metodológico Implacável** na condução de Revisões Sistemáticas da Literatura e Mapeamentos Científicos.

Construído como um *fork* especializado e uma evolução arquitetural do aclamado projeto [prismAId](https://github.com/Open-and-Sustainable/prismAId), o ReviewBR adapta a automação de ponta a ponta para as necessidades do ecossistema científico brasileiro, operando sob uma matriz estrita de **Ciência Aberta (Open Science)** e rastreabilidade PRISMA.

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

## 📖 Fluxo Clássico de Uso no Terminal / Chat

Um pesquisador deve simplesmente abrir seu ambiente de Inteligência Artificial pareado com o conector MCP do ReviewBR e instruir em linguagem natural:

1. **"Inicialize um projeto para pesquisar sobre o desenvolvimento de embalagens biodegrádaveis a partir de casca de abacaxi."**
   *(O sistema criará o planejamento metodológico de forma autônoma na máquina).*
2. **"Faça uma amostra rápida no portal do SciELO usando os termos (pineapple AND biodegradable) para vermos o que retorna."**
   *(O sistema mostrará tendências sem congelar o protocolo).*
3. **"Os termos parecem bons. Oficialize a pesquisa na base Global e Institucional Brasileira."**
   *(O projeto travará a matriz, o log de auditoria será gerado, e os dados brutos salvos).*
4. **"Execute a triagem e dedup para remover artigos falhos."**
   *(O robô local executará a filtragem técnica dos metadados).*
5. **"Baixe ospdfs elegíveis e indique quais de fato atendem ao tema utilizando a inteligência Gemini Pro."**
   *(O motor Go entrará em ação, convertendo e delegando a leitura de milhares de páginas num curto período de tempo).*

---

### Mantenha o Rigor Científico

O ReviewBR atua em ambiente de *No-Code*. Qualquer requisição para que o Agent de IA construa gambiarras (scripts soltos em Python/R) na máquina para tabular dados será rejeitada a favor das *Tools* nativas auditadas do repositório, mantendo o estuário da ciência totalmente limpo e reprodutivel por pares no futuro.

---

## Agradecimentos & Licença

As ferramentas basais de mineração foram idealizadas no projeto `prismAId` (Criado por Riccardo Boero). Modificações profundas neste ecossistema refletem o núcleo especializado do ReviewBR para indexação da ciência latino-americana.
**Licença:** GNU AFFERO GENERAL PUBLIC LICENSE, Version 3.
