# Extensões Locais Privadas (BYOS - Bring Your Own Script)

Esta pasta (`plugins/`) foi adicionada ao `.gitignore` do projeto ReviewBR e \*\*NUNCA\*\* será sincronizada com o GitHub.

## Por que esta pasta existe?

Ferramentas oficiais do ReviewBR conectam-se exclusivamente a APIs lícitas de Ciência Aberta (OpenAlex, CORE, Unpaywall). No entanto, como pesquisador independente, você pode precisar extrair artigos de redes Shadow Library (como o **Sci-Hub**) para quebrar paywalls de grandes editoras (Elsevier, Springer).

Se incluíssemos o Sci-Hub no código principal (`reviewbr-mcp`), o projeto ReviewBR seria **banido do GitHub** por violação de Direitos Autorais (DMCA).

## Como usar a arquitetura de Plugins

Aqui você pode salvar seus próprios scripts em Python, Node ou Bash que o agente de Inteligência Artificial poderá acessar localmente no seu computador, blindando o repositório público.

### Exemplo: `scihub_extractor.py` (Incluído nesta pasta)

No chat com a IA, você pode simplesmente pedir:
> *"Temos 5 artigos elegíveis que o Unpaywall não achou PDF (estão com paywall). Use o script local na pasta plugins/scihub_extractor.py para baixar esses PDFs via Sci-Hub informando os DOIs, e salve na minha pasta de downloads locais."*

Como a IA (Gemini/Claude) tem acesso ao seu terminal local através do servidor MCP, ela saberá ler esse script privado, executá-lo passando os DOIs, e baixar os arquivos sob sua tutela.
