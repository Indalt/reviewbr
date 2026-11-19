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

> **Decidido pelo Vicente em 19/11/2026:** Opus 5.5, Opus 5, Sonnet 5.5 e Fable 5.2 passam a usar o esforço padrão
> oficial, `medium`. As entradas `xhigh` de `modelSettings` saíram do `~/.claude/settings.json`. A mudança vale para
> todos os projetos desta máquina; o Fable 5.1 continua em `high`. Consequência: a sessão que precisar de mais
> profundidade sobe por `/effort` na própria sessão ou por `ultrathink` numa pergunta. O prompt de abertura deve
> declarar o esforço sempre que não for `medium`. As regras deny (item 2) não foram escolhidas, e o
> `/doctor prompt-audit` (item 3) continua opcional. Origem: a opção "Esforço padrão (medium)" na pergunta desta
> sessão.

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

## Code Mode (pergunta do Vicente, 19/11/2026)

Conferido na página oficial `code-mode` e no CHANGELOG oficial (lidos em 19/11/2026), nos `settings.json` global e do
projeto, e no binário e no `extension.js` da extensão 2.1.327 instalada.

**Resposta.** Está desligado e não roda no painel do Antigravity. Pode rodar numa sessão no terminal. Recomendação:
não ligar na 2.1.327; reavaliar quando a extensão chegar à 2.1.328 ou mais, com um teste medido.

**O que é.** Sem o Code Mode, o Claude pede cada ferramenta (Bash, Read, Edit) e lê cada resultado antes do passo
seguinte. Com ele, o Claude escreve um trecho de JavaScript que faz várias chamadas, usa um resultado na chamada
seguinte e devolve só a parte que precisa ler. O código roda pela ferramenta `REPL`. É experimental, vem desligado e
"may change or be removed in any release". Entrou na 2.1.323.

**Por que está desligado.**

- `CLAUDE_CODE_EXPERIMENTAL_CODE_MODE` não está no `~/.claude/settings.json`, nos settings do projeto nem no ambiente.
- Esta sessão roda no painel (`CLAUDE_CODE_ENTRYPOINT=claude-vscode`). Para esse caso o binário responde "for now it
  only works in the interactive terminal", e a documentação exclui o "VS Code panel".
- A sessão não tem a ferramenta `REPL`.

**O que faltaria para ligar.** Já atendido: versão 2.1.323 ou mais, Opus 5.5, assinatura, Git for Windows, nenhum
`apiKeyHelper`, nenhuma exportação OpenTelemetry. Faltaria:

1. pôr `"CLAUDE_CODE_EXPERIMENTAL_CODE_MODE": "1"` no `env` do `~/.claude/settings.json`, ou só no shell para um
   teste. Os settings do projeto não valem para essa variável;
2. abrir o Claude no terminal. No Antigravity, `claudeCode.useTerminal: true` faz a extensão abrir o Claude no
   terminal integrado, e nesse modo ela não marca a sessão como painel. O comando `claude` não está no PATH;
3. desligar o Remote Control nessa sessão. O settings global tem `remoteControlAtStartup: true`, e o binário recusa o
   Code Mode "with Remote Control";
4. confirmar na primeira vez ("Yes, turn on Code Mode"). A sessão reinicia.

Se a telemetria do Antigravity for desligada, a extensão passa `DISABLE_TELEMETRY=1` ao Claude, e o Code Mode também
não abre ("it needs settings that Claude Code downloads from Anthropic").

**Consequências.**

- **Custo.** A documentação não dá número. O mecanismo corta idas e vindas e resultado bruto no contexto, que pesam na
  leitura e na escrita de cache (34% e 31% do gasto medido, em `ESTADO.md`). O ganho fica nas tarefas de muitas
  chamadas relacionadas: a mesma mudança em muitos arquivos, busca cujo resultado precisa ser filtrado, comandos
  independentes ao mesmo tempo. Em sessão de leitura e decisão quase nada muda.
- **O que se perde.** O painel, porque a sessão fica no terminal. O Remote Control. A retomada fora do terminal: uma
  sessão de Code Mode só se retoma no terminal e com ele ligado. Claude in Chrome e computer use.
- **Permissões.** No modo automático o classificador lê o código, não cada chamada, e não vê valores calculados
  durante a execução, como um caminho tirado de uma busca. As regras `deny` e `ask` e os hooks `PreToolUse`
  continuam valendo para cada chamada. A documentação manda manter regras ou hooks para as chamadas que precisam de
  controle; com isso, as regras deny do item 2 voltam a pesar.
- **Hooks.** Um `PreToolUse` que estoura o tempo passa a recusar a chamada (o de `Agent|Task|Workflow` tem 30 s). Na
  2.1.327 o `UserPromptSubmit` da linha de uso também roda na saída de cada script; a 2.1.328 tirou isso.
- **Tempo.** Um script que o Claude espera para em 10 minutos. Em segundo plano, que o modo automático permite, vai
  até 2 horas.
- **Maturidade.** A 2.1.328 traz 22 entradas de Code Mode no CHANGELOG, e a extensão instalada está na 2.1.327. Três
  pegam este ambiente:
  - "Fixed Claude in Code Mode not being told to run workflows only when you ask, or the workflow size you set in
    `/config`": na 2.1.327 há risco de fan-out sem o OK do Vicente;
  - o `UserPromptSubmit` rodando na saída dos scripts;
  - no Windows, o Claude não era avisado de que os comandos dos scripts rodam no Git Bash.

**Teste, se o Vicente quiser, com a extensão na 2.1.328 ou mais.** Uma sessão no terminal, com a variável só naquele
shell e o Remote Control desligado só nela; uma tarefa de muitas chamadas; o custo da sessão comparado no medidor com
o de uma sessão parecida no painel. O settings global não muda antes do resultado.

> **Decidido pelo Vicente em 19/11/2026:** o Remote Control deixa de ligar ao abrir as sessões
> (`remoteControlAtStartup: false` no `~/.claude/settings.json`), em todas as sessões desta máquina. Ele disse que
> perder o Remote Control não é problema. A extensão já está na 2.1.328. A variável do Code Mode não entrou no
> settings global: o teste a liga só no shell do terminal. Consequência: as sessões deixam de poder ser acompanhadas
> de outro aparelho até alguém religar a chave. Origem: "nao tem problema desativar o modo remote control".

**Teste de 19/11/2026 (2.1.328, Opus 5.5, esforço high, mesma tarefa, mesma pasta).** A tarefa: "Leia todos os
arquivos .md dentro de .claude/ e liste os links para arquivos locais que não existem. Não altere nenhum arquivo."

| | terminal com Code Mode (`14e2f5cf`) | painel sem Code Mode (`85cdee6f`) |
|---|---|---|
| resultado | 2 links quebrados, linhas 434 e 455 da DIRECAO | os mesmos 2 |
| chamadas ao modelo | 4 | 4 |
| contexto na 1ª chamada | 41,5 mil tokens | 56,6 mil tokens |
| saída | 2.532 | 2.871 |
| escrita de cache | 31.293 | 34.261 |
| leitura de cache | 144.164 | 216.765 |
| custo a preço de lista (US$ 5/25/6,25/0,50 por M) | ~US$ 0,33 | ~US$ 0,39 |

Leitura: ~16% mais barato, quase todo pela leitura de cache, porque cada chamada parte de um contexto ~15 mil tokens
menor. As duas sessões tiveram o mesmo número de chamadas, porque o painel também juntou o trabalho num script. Os
limites: é uma amostra só, e a diferença mistura o Code Mode com a troca de painel por terminal. O painel também
injeta contexto do editor.
