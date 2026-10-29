# Troca de computador — integridade do ReviewBR (02/10/2026)

> Sessão nova: leia este arquivo e depois `DECISOES_2026-09-27.md`, antes da rota de sempre.
> Os números são de 02/10/2026. Reapure com os comandos indicados antes de usar.

## 1. Antes de qualquer manutenção

1. **Feche e reabra o editor inteiro (Antigravity/VSCode).** O Node.js e o Python foram
   instalados com o editor aberto, e ele só enxerga o PATH novo depois de reaberto. Sem isso
   o MCP `reviewbr` continua falhando com CONNECTION_CLOSED. O servidor em si já funciona:
   testado em 02/10 por stdio, responde ao `initialize` e serve 44 tools, entre elas as 8 do
   mantenedor.
   **Não é preciso reiniciar o Windows** (apurado em 02/10, 20:30): lido o ambiente do
   `explorer.exe` (PID iniciado no boot de 30/09), ele **já tem** `C:\Program Files\nodejs\`
   no PATH. Quem ficou com o PATH velho é o processo `Antigravity IDE.exe` aberto às 12:22 de
   02/10, e o `claude.exe` herda dele. Basta fechar todas as janelas, conferir no Gerenciador
   de Tarefas que não sobrou nenhum `Antigravity IDE.exe` e reabrir pelo menu Iniciar ou pela
   barra de tarefas — não por um terminal antigo, nem pelo "reiniciar" do próprio editor, que
   herdam o ambiente velho. Se mesmo assim falhar, sair da sessão do Windows e entrar de novo.
2. Confira as versões: `node --version` deve dar v24.19.0 e `python --version` 3.12.10.
3. `audit_system_debt` deve devolver 104 achados (61 ABERTO, 4 EM_CURSO, 35 RESOLVIDO,
   4 RECUSADO), com `updatedAt` 2026-09-27T02:25:28Z.
4. Suíte rodada em 02/10/2026 neste PC, com o Node 24.19.0: **211/211 em 22 arquivos**, igual
   ao último relato de 27/09, e nenhum arquivo alterado pela execução. O `dist` não foi
   recompilado: é o mesmo de 26/09 23:25.

## 2. O que foi verificado

| Item | Método | Resultado |
|---|---|---|
| Código e dados | sha256 de todos os arquivos de `C:\reviewbr` e de `D:\backupantigravity\reviewbr`, sem `.git`, sem o zip e sem `recuperar\` | 39.133 = 39.133, nenhum diferente. Controle: no `.git`, a mesma comparação acusou as 5 mudanças conhecidas (fetch e índice) |
| Backlog | contagem do `system_debt.json` por script | 104 achados (61/4/35/4), igual ao relatório final de 27/09 02:26Z |
| `dist` × `src` | mtime, preservado pela cópia | `dist/index.js` (26/09 23:25:07) é mais novo que todo `src/` |
| Histórico do Claude Code | pacote × `~/.claude` restaurado, arquivo a arquivo | 465/465 em `projects`, 151/151 em `file-history` e 8/8 em `pi_ocr`. Zip íntegro (CRC) |
| Transcrições | parse de cada linha dos `.jsonl` | 180 arquivos, 21.935 linhas, nenhuma corrompida. Controle: arquivo ruim é detectado |
| Segredos no que seria commitado | valores dos dois `.env` e padrões de chave, em 425 arquivos (stage + não rastreados) | nenhum. Controle: o próprio `.env` é detectado |

## 3. O que foi reparado

- **Git.** O pack tinha 1 objeto corrompido: o blob `d1ca437b…`
  (`reviewbr/julia/PrismAId/deps/linux-x86_64/libprismaid_linux_amd64.so`, que só existe no
  histórico). O defeito é idêntico no D:, então veio do PC antigo. O blob foi recuperado do
  GitHub (o sha1 confere) e o repositório foi reempacotado com `git repack -A -d`, com
  autorização do Vicente. Resultado: `git fsck --full` limpo; HEAD, refs, índice e stage
  idênticos antes e depois; os 1.153 blobs relidos conferem. O pack original corrompido
  continua no D:.
- **Retenção do histórico.** `cleanupPeriodDays: 3650` em `~/.claude/settings.json`. Com o
  padrão de 30 dias, as 4 sessões restauradas seriam apagadas por volta de 01/11/2026. Foi
  assim que as sessões anteriores a setembro se perderam no PC antigo.
- **Ambiente.** Node.js 24.19.0 (LTS) e Python 3.12.10 instalados via winget, com
  autorização do Vicente. O `sqlite3` nativo do `node_modules` copiado carrega no Node 24
  (N-API). Tesseract não foi instalado: só os scripts de OCR de `origem/` o usam (DEBT-102).

## 4. O que não veio e ficou no PC antigo

| Item | Para que serve |
|---|---|
| scratchpads de Temp das 4 sessões (~52 MB) | reproduções citadas por achados do backlog (ex.: `27fac9ba…\scratchpad\aud\t1_protocol.ts`) |
| `be12a326…\subagents` e `\tool-results` | transcrição do subagente que executou a manutenção de 26–27/09. O relatório final dele está na sessão principal |
| `~/.claude/projects/C--reviewbr-reviewbr-reviewbr-mcp` | sessões abertas com o cwd em `reviewbr-mcp` |
| `~/.claude/plans/confirme-que-voce-l-curried-quokka.md` | plano da integração dos protocolos A/B, citado pela memória `integracao-protocolos-a-b` |
| `C:\Users\alqui\tessdata` (29 MB) | idiomas do OCR. A pasta existe aqui, mas vazia |

Nada disso bloqueia a manutenção. Se o PC antigo ainda existir, vale copiar esses itens.

## 5. Decisões pendentes do Vicente

1. **DEBT-096/094**: a pergunta ficou aberta em 27/09 02:26Z (ver `DECISOES_2026-09-27.md`).
2. **Commit.** Nada foi commitado desde 1c697d1: 351 entradas no stage, 19 modificadas
   depois e 87 não rastreadas. O repositório no GitHub (Indalt/reviewbr) é **público**. O stage
   inclui `antigravity_conversas_export/`, com 207 arquivos de conversas de outras aplicações.
   O zip de 150 MB na raiz não é ignorado e entraria num `git add -A` (há cópia idêntica em
   Downloads).

## 6. Achados a registrar no backlog

Fila esvaziada em 02/10/2026 pela tool: DEBT-105 (evidência fora do repositório), DEBT-106 (caminhos fixos em `origem/codigo_origem/`), DEBT-107 (`found_by` sobrescrito, 11 casos, confirmado), DEBT-108 (stdout poluído), DEBT-109 (`PLANO_usabilidade.md:18`, confirmado) e a reabertura do DEBT-020 (resíduo com três portas: sem `projectPath`, sem `identifier`, texto vazio).

## 7. Insumo não verificado

`DECISOES_chat_a_conferir.md` levanta decisões do Vicente que estariam só no chat ou
divergentes do disco. Os verificadores pararam no limite de sessão, então cada item é
hipótese até ser conferido na transcrição citada. Um exemplo que merece leitura: a memória
`projeto-nao-altera-reviewbr` diz que a ferramenta quebrada "se contorna dentro do projeto",
e o `PROTOCOLO_revisao_reviewbr.md` diria o oposto.
