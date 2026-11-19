# Verificação das dicas de Claude Code — estado

Pedido (19/11/2026): conferir se as afirmações de um texto de outra LLM sobre Claude Code são verdadeiras na
documentação oficial e, só as verdadeiras, aplicar ao repositório para gastar menos. O texto comenta a palestra
"Rethinking Claude Code Best Practices", de Lydia Hallie (Anthropic), no canal AI Engineer, publicada em 11/11/2026
(https://www.youtube.com/watch?v=vlfCjWuv4es). A transcrição não pôde ser baixada: o YouTube devolve as legendas
vazias e o classificador do modo automático barrou a outra via. Valem só o título e a descrição do vídeo.

## Ambiente conferido

- Claude Code 2.1.325, binário nativo da extensão do Antigravity, no Windows 11 (sem WSL).
- Não há `CLAUDE.md` de projeto na raiz. Carregam o global (`~/.claude/CLAUDE.md`, cerca de 20 linhas) e o
  `MEMORY.md` da memória.
- `~/.claude/settings.json`: `modelSettings` com Opus 5.5 em esforço `xhigh`. Hooks: `UserPromptSubmit` (linha de
  uso), `PreToolUse` em `Agent|Task|Workflow` (pede confirmação acima de 90%), `StopFailure` em `rate_limit`.
- `.claude/settings.json` do projeto: só regras `allow`. Nenhuma regra `deny`, nenhum `sandbox`.

## Provas tiradas do binário 2.1.325 (contagem de ocorrências, com controle positivo)

Controles positivos: `cleanupPeriodDays` (37 ocorrências), `additionalDirectories` (84), `effortLevel` (95).

| termo | ocorrências | o que mostra |
|---|---|---|
| `prompt-audit` | 20 | subcomando com a descrição "Scope: only the Claude Code configuration that loads into sessions in this project": CLAUDE.md e imports, rules/, skills/, commands/, agents/, output-styles/ |
| `blockReadsOutsideWorkingDirectories` | 133 | a chave existe, em `permissions`; a mensagem diz "Reads outside the working directories are blocked (permissions.blockReadsOutsideWorkingDirectories)" |
| `stop_hook_active` | 10 | e há um teto embutido para bloqueios seguidos do Stop: "check stop_hook_active ... Set CLAUDE_CODE_STOP_HOOK_BLOCK_CAP to raise this limit" |
| `goal_active`, `activeGoal` | presentes | há um objetivo ativo de sessão ligado ao Stop hook |
| `ultrathink` | 75 | `ultrathink_boost`, `ultrathink_effort` |
| `think hard`, `megathink` | 0 | as palavras antigas saíram do código |
| `disableAutoMode`, `useAutoModeDuringPlan` | presentes | o modo automático tem chaves próprias |

Scripts de varredura: scratchpad da sessão, `bin/strscan.py` e `bin/strctx.py` (temporários).

## Para onde vai o gasto (medido nas 12 últimas sessões desta pasta, a preço de lista)

Os números saem do campo `usage` das transcrições, com os preços do medidor global (`~/.claude/uso`).

- Total de ~286 c: saída (pensamento e texto) 33%, escrita de cache 31%, leitura de cache 34%, entrada sem cache ~0%.
- Leitura de cache: 492 M de tokens. O custo cresce com o tamanho do contexto multiplicado pelo número de respostas.
  Sessão longa e contexto grande pesam mais que qualquer arquivo de instrução.
- Escrita de cache: 15,6 M de tokens. Entra cada conteúdo novo (resultado de ferramenta, arquivo lido) e cada
  prefixo de sessão ou subagente. Uma sessão com workflow (`e5229a50`) gastou 61 c só em subagentes (765 respostas).
- Prefixo fixo de cada sessão: ~57–62 mil tokens. Cada subagente Sonnet parte de ~46 mil.
- A lista de skills tem teto embutido no binário: `skillListingBudgetFraction`, padrão de 1% da janela de contexto,
  e `skillListingMaxDescChars`, padrão de 1536 caracteres. As 216 skills dos plugins sincronizados do claude.ai
  ficam dentro desse teto.
- Esta sessão, com esforço máximo, tem 52% do custo na saída.

## Situação

Conferência feita em 19/11/2026: o resultado está em `RELATORIO.md`. O Vicente depois colou a transcrição da palestra.
Ficaram duas decisões para ele, o esforço padrão e as regras deny, e uma opção, o `/doctor prompt-audit`.
