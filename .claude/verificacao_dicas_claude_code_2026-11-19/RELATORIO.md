# Dicas de Claude Code de outra LLM — o que é verdade e o que serve aqui

Conferido em 19/11/2026 na documentação oficial (code.claude.com/docs), no CHANGELOG oficial e no binário instalado
(Claude Code 2.1.325, Windows 11 nativo). Origem do texto: uma LLM resumindo a palestra "Rethinking Claude Code Best
Practices", de Lydia Hallie (Anthropic), de 11/11/2026. A transcrição foi colada pelo Vicente nesta sessão.

## Resposta curta

- De 23 afirmações, **9 são verdadeiras, 12 são parciais, 1 é falsa e 1 não tem fonte oficial**.
- A palestra trata de tirar o humano do laço com segurança; não fala de custo. O ângulo "gastar menos" e o número
  "30% a 50% a menos de tokens" vêm da outra LLM, e o número não aparece em nenhuma fonte oficial.
- O erro grave do texto está na segurança. Ele diz que a regra deny impede até um script de ler a chave de API.
  Nem a palestra diz isso (7:55: as permissões "cannot limit what it can reach once it's running"). Só o sandbox
  faz esse bloqueio, e o sandbox não existe no Windows nativo.
- A afirmação verdadeira que mais mexe no custo é o esforço: a documentação dá **medium** como padrão do Opus 5.5 e
  do Fable 5.2. Aqui o padrão salvo é **xhigh**.

## O que vale para este repositório

**Decisões do Vicente:**

1. **Esforço.** O `~/.claude/settings.json` fixa `xhigh` (em `modelSettings`) para Opus 5.5, Opus 5, Sonnet 5.5 e
   Fable 5.2. Pela documentação, `medium` basta no trabalho de rotina e `max` pensa demais em tarefa comum. Para
   subir, há duas vias: `/effort` na sessão ou `ultrathink` só numa pergunta (vale para aquele turno). Medido aqui, a
   saída (pensamento e texto) é 33% do gasto das 12 últimas sessões e 52% nesta. A documentação não dá número de
   economia. O que fica em jogo é a profundidade nas sessões de decisão, que hoje rodam em max de propósito.
2. **Regras deny no `.claude/settings.json` do projeto.** Pelo critério da palestra (6:38, "se errar uma vez, dá para
   desfazer?"), duas ações não se desfazem:
   - ler `reviewbr/.env` ou `reviewbr/reviewbr-mcp/.env`, porque a chave fica na transcrição. Os dois arquivos estão
     fora do git;
   - um `git push --force` num repositório público em que `Bash(git push *)` está liberado.

   A regra deny vale antes do classificador do modo automático e custa zero token. Limites: a regra de Bash casa só
   o texto escrito do comando, e sem sandbox um script ainda consegue ler o `.env`.
3. **`/doctor prompt-audit` (opcional, uma vez).** Ele procura instrução escrita para modelo antigo, referência a
   arquivo inexistente e contradição entre arquivos, nos 9 agentes e nas skills de `.claude/`. O que ele propuser é
   alteração do sistema e passa pelo gate `validate_system_change`.

**Não aplicar:**

- **Sandbox.** Só roda em macOS, Linux e WSL2. No Windows nativo os comandos rodam sem sandbox (`sandboxing.md`).
- **O Stop hook do texto.** O Stop não usa matcher e dispara a cada fim de resposta, inclusive nas sessões de leitura
  e de organização. Pelo Git Bash, o `npx vitest run` deste repositório falha com "No test suite found" (FILA,
  Visto de passagem). Ou seja, todo fim de resposta daria exit 2 e mandaria o Claude de volta. O teto de 8
  continuações zera a cada chamada de ferramenta, então o laço pode ir além de 8 e gastar mais do que economiza.
- **Abandonar o plano antes do código.** A documentação manda planejar a tarefa complexa para evitar retrabalho. Ela
  também descreve o fluxo de especificação seguida de sessão nova, que é o que o chat de acompanhamento já faz.
- **`blockReadsOutsideWorkingDirectories`.** A chave existe (v2.1.257+), mas faria Read, Grep e Glob recusarem
  leituras fora da pasta: cofre do Obsidian, conversas do Antigravity, scratchpad. Serve à segurança, não ao custo.
- **Enxugar o CLAUDE.md e os `@imports`.** Este repositório não tem CLAUDE.md de projeto. O global tem cerca de 20
  linhas e nenhum import.

**Já em prática** (nada a mudar): chat novo por sessão, que equivale ao `/clear`; critério de pronto verificável (a
FILA fecha com build e suíte verdes); fan-out só com custo aprovado.

## Vereditos

Fontes em `https://code.claude.com/docs/en/<página>`. V = verdadeiro, P = parcial, F = falso, NV = sem fonte oficial.

| id | afirmação do texto | | fonte oficial e observação |
|---|---|---|---|
| A1 | CLAUDE.md com menos de 200 linhas | V | `memory`: "target under 200 lines per CLAUDE.md file" |
| A2 | `/doctor` e `/doctor prompt-audit` existem e apontam instrução obsoleta, redundante ou dedutível | V | `memory`, `skills`, CHANGELOG: subcomando do `/doctor` desde a 2.1.283 (alias `/checkup`) |
| A3 | toda linha do CLAUDE.md e das skills é cobrada em cada chamada | P | `prompt-caching`, `skills`: o CLAUDE.md fica no prefixo em cache, relido a preço de cache; das skills entra só a descrição até serem chamadas |
| A4 | `@import` carrega o arquivo inteiro; texto simples evita | P | `memory`: o import carrega junto e não reduz custo. Texto simples só funciona se o Claude decidir ler; carga sob demanda oficial: rules com `paths`, skills, CLAUDE.md de subpasta |
| A5 | `/clear` entre tarefas; janela de 1 M e compactação automática | V | `best-practices`: "/clear between tasks is still worth doing" |
| A6 | faxina reduz de 30% a 50% os tokens de entrada | NV | nenhuma fonte dá número |
| A7 | apagar arquitetura de pastas, framework, regras em CAIXA ALTA | P | `memory`, `best-practices`: cortar o que se deduz do código e a ênfase. Framework não é citado, e regra inegociável deve virar hook |
| B1 | "think" e "think hard" viraram texto comum | V | `model-config`. No binário: "think hard" 0 ocorrências |
| B2 | o controle é o `/effort`, padrão medium no Opus 5.5 | V | `model-config`: "Fable 5.2, Opus 5.5, Sonnet 5.5, and Haiku 5.5 default to medium" |
| B3 | só `ultrathink` dá esforço extra, só naquele turno | V | `model-config`: o turno sobe para xhigh sem mudar o esforço da sessão |
| B4 | manter medium e usar `ultrathink` no caso difícil | V | `best-practices`: "put ultrathink in that prompt instead of changing the setting" |
| B5 | cada subagente abre contexto novo e multiplica o custo | P | `sub-agents`: o fork, que é o padrão, herda a conversa e reaproveita o cache. "Multiplica" exagera, e o uso em paralelo também é recomendado |
| B6 | pedir plano dobra a leitura; melhor tarefa, limites e critério de pronto | P | `costs`, `best-practices`: o plano evita retrabalho caro. O critério pass/fail é oficial; os três blocos são só um formato |
| C1 | exit 0 aprova, 1 não bloqueia, só o 2 bloqueia e devolve o stderr | P | `hooks`: 1 não bloqueia e 2 bloqueia. Mas JSON (`decision`, `continue:false`) também bloqueia, e exit 0 não aprova permissão |
| C2 | `/goal` e Stop hooks seguem até uma condição determinística | P | `goal`: existe desde a 2.1.139, mas é avaliado por um modelo pequeno, que não roda comandos, então não é determinístico |
| C3 | o Stop hook com `npm run lint && npm test … exit 2` garante testes verdes | P | `hooks`: o Stop não usa matcher, dispara a cada resposta e tem timeout de 600 s. O teto de 8 continuações zera a cada chamada de ferramenta |
| C4 | hooks e regras custam zero token | P | `features-overview`: "Zero, unless the hook returns output that gets added as messages". Cada continuação forçada é um turno novo |
| D1 | o modo automático virou padrão em agosto de 2026 | V | `whats-new/2026-w32`: "Starting August 14, auto mode is the default permission mode for new sessions on Pro, Max, and Team plans"; em todos os planos desde a 2.1.283 |
| D2 | deny vale antes do classificador | V | `permission-modes`: "Deny rules block in every mode". A palestra, 6:15: o classificador nem vê a chamada |
| D3 | sandbox desligado por padrão, liga por `/sandbox` | P | `sandboxing`: correto, mas "On native Windows, Claude Code runs commands unsandboxed" |
| D4 | as regras do JSON e `blockReadsOutsideWorkingDirectories` são válidas | P | `permissions`: a sintaxe é válida, mas "Bash permission patterns that try to constrain command arguments are fragile" |
| D5 | com as regras, nenhum script lê as chaves | F | `permissions`: a regra não vale para "arbitrary subprocesses that read or write files indirectly"; para isso, só o sandbox |
| D6 | regra no settings dá 100% de garantia | P | `permissions`: "enforced by Claude Code, not by the model", mas a regra de Bash "isn't a security boundary" |

A palestra não fala de `/effort`, `ultrathink`, 200 linhas, `@imports`, `/clear`, `/goal`, nem do pedido em três
blocos. Esses pontos vêm da outra LLM.

## Como foi conferido

- Quatro verificadores, um por tema (Sonnet 5.5, esforço médio), e dois contestadores independentes (Opus 5.5,
  esforço alto). Cada um gravou item a item nesta pasta: `tema_*.jsonl` e `contestacao_par*.jsonl`.
- Prova local: contagem de termos no binário 2.1.325, com controle positivo (ver `ESTADO.md`).
- Seis divergências, resolvidas assim:
  - **A2**, de P para V: o `/doctor` aponta o conteúdo dedutível do código (`skills`), e o `prompt-audit` o resto.
  - **B5**, de V para P: o fork reaproveita o cache.
  - **C3**: o teto de continuações zera a cada ferramenta.
  - **C4**, de F para P: conforme `features-overview`.
  - **D1**: fica V para o plano do Vicente. O contestador manteve P porque Enterprise, API e nuvem ficaram fora em
    agosto.
  - **D2**, de F para V: o próprio trecho citado pelo verificador confirma a afirmação.
- Custo desta verificação: o workflow usou ~539 mil tokens de subagente.
