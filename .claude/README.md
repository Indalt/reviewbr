# Camada agêntica do ReviewBR (`.claude/`)

Esta pasta é o **cockpit nativo** do ReviewBR no Claude Code: conduz revisões de literatura acionando subagentes especializados que usam as tools do servidor MCP `reviewbr`. Substitui o modelo antigo (blueprints em `skills/` que pediam handoff manual + dezenas de scripts avulsos).

## Como funciona

1. O pesquisador pede para conduzir/continuar uma revisão → o loop principal carrega a skill **`conduct-review`** e vira o **Coordenador**.
2. O Coordenador lê o **estado no disco** do projeto, mostra um **painel** legível, decide a próxima fase e aciona o **subagente especialista** certo via a ferramenta `Agent`.
3. Entre fases, roda **gates de rigor** (tools determinísticas do MCP). Um gate vermelho para o avanço.
4. Respeita um **nível de controle configurável** (`estrito`/`fluido`) e travas humanas obrigatórias — anti-deriva.

O estado vive em arquivos (`protocol.md`, `project_state.json`, `prisma_flow.json`, `logs/`), então o pesquisador pode pausar, digredir ou abrir outro chat sem perder o rigor: ao voltar, o Coordenador relê o disco e retoma.

## Estrutura

- **`agents/`** — 7 subagentes especialistas (julgamento, contexto isolado):
  `designer` (F0/F1) · `librarian` (F2) · `screener` (F3/F4) · `extractor` (F5) · `reader` (F5.5 leitura/RAG) · `analyst` (F6/F7/F8) · `scout` (exploratório, fora da trilha PRISMA).
- **`skills/`** — procedimento/conhecimento carregável:
  `conduct-review` (orquestrador+interface) · `methodology-router` · `prisma-rigor-gates` · `prisma-s-logging` · `screening-rules` · `extraction-form` · `evidence-reading` · `synthesis-manuscript`.
- **`methodologies/`** — metodologia **plugável** (dado, não código). `prisma-sr/` = revisão sistemática (PRISMA 2020 + PRISMA-S). Cada método tem `spec.md` (fases F0–F8 + invariantes RV), `manifest.json` (fases ativas/gates/framework) e templates.

## Fronteiras (regra que evita recair no problema antigo)
- **Subagente** = decide. **Skill** = como fazer. **Tool MCP** = executa (efeito colateral/cálculo auditável), nunca decide (RV-06).
- **Nada de scripts avulsos** para o pipeline: cada capacidade é uma tool do MCP.
- **Rigor** = invariantes `RV-01..RV-08` (nunca desligáveis) + completude granular da spec + checklists PRISMA/PRISMA-S, verificados por gates.

## Pré-requisitos para o MCP conectar
Antes de conduzir uma revisão real, no diretório `reviewbr/reviewbr-mcp/`:
```
npm install && npm run build
```
e configurar as chaves em `~/.reviewbr/.env` (ver README principal). O servidor é registrado em `../.mcp.json` como `reviewbr` → tools expostas como `mcp__reviewbr__<tool>`.

## Relação com o legado
- `skills/` (raiz do repo) = blueprints antigos, a serem aposentados após a migração (conteúdo já consolidado aqui).
- `reviewbr/reviewbr-mcp/` = camada de tools (madura). Limpeza do RBAC/scripts e bridge Go↔MCP são fases posteriores do plano.
