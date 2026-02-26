# Changelog - Contexto Semanal (26/02/2026)

Este documento resume as implementações, decisões arquiteturais e refatorações realizadas na sessão atual para facilitar a retomada dos trabalhos na próxima semana.

## 1. Enforcement Metodológico e Guardrails (Parâmetro 4 Concluído)

- **Bloqueio de Execução (`locked_execution`):** Implementada a máquina de estados no `registry.json`. Uma vez que a primeira busca oficial (ex: `search_repository`) é disparada, o projeto é travado, impedindo alterações na pergunta PICO ou parâmetros basilares através das "Protocol Guards" no Typescript.
- **Diretriz de Nível de Sistema (No-Code):** O `SYSTEM_PROMPT.md` foi reescrito introduzindo diretivas rígidas proibindo o LLM Coordenador de gerar scripts em Python/Go avulsos, forçando o uso do arsenal oficial do MCP para garantir auditoria.
- **Carimbos de Validação:** A função de exportação (`export_dataset`) foi aprimorada para incluir carimbos de validação metodológica (ex: conformidade PRISMA-S) nos relatórios gerados (CSV, JSON, Markdown).

## 2. Reestruturação de Escopo e Diretriz Open Science (Parâmetro 1 - Execução em Andamento)

- **Foco em Open Science:** Modificado o `SYSTEM_PROMPT.md` impondo a Ciência Aberta como diretriz inegociável, proibindo a integração ou sugestão de bases de dados com paywalls restritivos.
- **Camadas de Escopo (Scope Layers):** A arquitetura foi desregionalizada de "nacional vs internacional" para abranger as camadas globais da ciência:
  - `global_open_science` (Ex: OpenAlex, PubMed)
  - `regional_latam` (Ex: SciELO)
  - `national_br` (Ex: OasisBR, Portal CAPES Aberto)
  - `institutional_br` (Ex: Repositórios de Universidades como USP, UFSC)
- **Refatoração do Catálogo Primitivo:**
  - O arquivo `repositorios_brasileiros.json` foi renomeado e globalizado para `repositories_catalog.json` e alocado em `data/sources/`.
  - O banco de 93 repositórios ativos (majoritariamente DSpace) foi programaticamente categorizado com os escopos `institutional_br` e `national_br`.
  - O Schema Zod no Typescript (`src/types.ts`) foi devidamente atualizado com o atributo `scope`.
- **Workflow Interativo:** O `SYSTEM_PROMPT.md` agora obriga o Agente Coordenador a perguntar ativamente ao usuário qual Lente de Observação (Escopo) deseja usar antes de buscar.

## 3. Novas Integrações Implementadas e Revisadas

- **OpenAlex (`search_openalex`):** Validamos que a estrutura global do OpenAlex e do Snowballing continua perfeitamente operante.
- **SciELO (`search_scielo`):** Criamos uma *tool* autônoma para a rede SciELO. Em vez de depender de scrapers frágeis, arquitetamos a busca passando silenciosamente pelo OpenAlex (via filtro do Publisher ID do SciELO `P4310312277`), o que nos dá as metragens completas, confiáveis e rápidas de toda a América Latina.
- **Modo Preview ("Consulta Rápida"):** O Coordenador foi instruído (via `SYSTEM_PROMPT.md`) a permitir que o usuário faça consultas prévias para testar palavras-chaves *sem* travar o projeto. O Agente faz isso simplesmente omitindo a declaração de `projectId`/`projectPath` nas buscas, garantindo testagem livre de penalidades metodológicas.

## Próximos Passos (A Fazer na Próxima Semana)

1. Construir os adaptadores nativos para o **Portal de Periódicos CAPES** (via rota Open Access).
2. Construir adaptadores para **BVS / LILACS** e **BDENF**.
3. Avançar para o Refinamento da Extração de PDFs e Triagem com Chunking Inteligente (Parâmetro 2).
4. Implementar a telemetria simples em arquivo plano (Parâmetro 3).
