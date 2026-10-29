# Reverificação de 03/10/2026 — o erro era maior que a linha 32

> **Leia junto com `DECISOES_2026-10-03.md`.** Aquele documento decidiu os seis furos (A–F);
> este corrige o que ele deixou passar. Onde divergirem, vale este.

O pesquisador apontou, depois de aprovada a correção da skill: *"o erro aqui não se relaciona
apenas ao DEBT-094, mas sobretudo ao que vinha sendo escrito sobre o ASReview."* Estava certo.
A reverificação por sete lentes independentes, com refutação adversarial de cada achado,
levantou **80 achados**; os que sobreviveram estão no backlog como `DEBT-111` a `DEBT-119`.

Os achados brutos, com evidência e linha, estão em `achados_2026-10-03_brutos.json` — leia por
script, nunca no contexto.

---

## 1. O que o plano anterior errou

| | O plano de 03/10 dizia | O que se apurou |
|---|---|---|
| Alcance | corrigir a skill (`:32`) e a tool | a afirmação falsa estava em **9 superfícies** |
| Causa | "a skill oferece ferramenta como método" | a causa é **anterior**: o sistema não sabia representar *procedimento*, então ofereceu software |
| `project_init.ts:295` | "grava Nature Machine Intelligence no protocolo de todo projeto" | **FALSO** — `screeningMethod` nunca é atribuído; é código morto. Nenhum `protocol.md` contaminado |
| Prioridade | DEBT-101 (expor o kappa) como passo 6 | **fora de ordem**: não há duas corridas para comparar |

**Sobre o ASReview, com a doc oficial:** `asreview simulate` exige *fully labeled dataset* —
"only records containing labels are used; unlabeled records are ignored". O CSV que o próprio
sistema gera (`data.ts:93-105`) **não tem coluna de rótulo**. Logo o subprocesso ignorava todos
os registros, e respondia "✅ concluída com sucesso". O autor sabia: `asreview_bridge.ts:84-88`
documenta exatamente isso. E "validado pela *Nature Machine Intelligence*" é rótulo de prestígio
sobre software: o artigo validou **ganho de eficiência com humano no circuito**, não substituição
do triador.

---

## 2. O que foi corrigido (feito, com prova)

**A decisão do pesquisador foi: entra só a DECLARAÇÃO, não a execução de triagem dupla; e entra
só o que tem NORMA.**

### `DEBT-113` — RESOLVIDO: o protocolo não trava mais com o item 8 em branco

- `project_init.ts:303-306` — o template passou a trazer **F4.1.2** (Processo de triagem:
  Individual | Duplo independente | Duplo com desempate), **F4.1.3** (Ferramenta utilizada,
  campo **separado**) e **Resolução de discordâncias**. O ramo morto do `screeningMethod` saiu.
- `protocol_auditor.ts` — `ROTULOS_F41` + laço de conferência, espelhando `SECOES_F03`: fora do
  score 0–3, mas **bloqueando** `valid`. Novo `extrairLinhaDoRotulo()` distingue rótulo
  **ausente** de **vazio** — sem isso, protocolo de template antigo passaria por omissão.
- 6 testes novos, incluindo o controle positivo de que **triagem individual declarada é
  aceita** — é escolha legítima, não defeito.
- **Prova por execução:** `generateProtocol()` real → `auditContent()` devolve `valid=false`,
  bloqueando por F4.1; preenchido, passa. Em todos os casos `score=3/3`, provando que a trava
  antiga teria deixado passar.

### `DEBT-111` — EM_CURSO: as 9 superfícies deixaram de afirmar o falso

Corrigidos `index.ts:270,2261,2275`, `asreview_bridge.ts:175-194` (a mensagem de sucesso virou
aviso explícito de que nenhuma decisão foi produzida), `screening-rules/SKILL.md:32`,
`screener.md:18`, `SYSTEM_PROMPT.md:58`, `README.md:161` (a afirmação de que "importa os
resultados automaticamente" era falsa), `research_protocols.md:282`, `reviewbr-web route.ts:380`
e `project_init.ts:364`.

Varredura por `ML validado|para publicação|validado pela Nature|rigorosa para`: restam **4
ocorrências, todas legítimas** — qualificam *procedimento* ("pesquisa exploratória não tem
validade para publicação de alta evidência"), nunca ferramenta.

**Falta:** a tool ainda dispara o subprocesso inútil em vez de **reprovar de saída** quando o
dataset não tem rótulo. É conserto de comportamento, não de afirmação.

### Terminologia: `blinding` aposentado, `ScreeningProcess` no lugar

O campo misturava **três coisas**: cegamento real (ocultar autor/periódico — não implementado:
`screen.ts:331` envia repositório e data ao modelo), separação multiusuário (declarada em
`cannot`: *"o sistema simula separação de revisores"*) e triagem em duplicata — que é o que a
pergunta queria dizer e **não é cegamento**. A pergunta 8 da entrevista agora pergunta
**processo de triagem**; `BlindingType` está `@deprecated`; a coluna fica inerte no SQLite e
**dado gravado não migra** (traduzir resposta a pergunta mal formulada em declaração
metodológica seria inventar declaração).

**`getDesignAdvice` parou de inferir método a partir do TEMA.** Recomendava `DOUBLE_BLIND` por
palavra-chave clínica ("treatment", "therapy"...) — violação do princípio 9 (agnóstico a
domínio). Agora deriva do `researchType`, que é categoria metodológica.

**Por que cegamento não virou campo:** nenhuma norma o exige na triagem — a Cochrane discute e
conclui que raramente compensa. O que o PRISMA 2020 item 8 exige é número de triadores e
independência, que é o F4.1.2. Criar campo sem norma por trás seria a mesma classe do rótulo
"validado". Registrado como `DEBT-119`.

---

## 3. O que ficou aberto, e por quê

| id | o quê | por quê agora não |
|---|---|---|
| `DEBT-112` | sistema não sabe gravar **duas corridas**: `writeScreening` usa nomes fixos, a segunda sobrescreve a primeira em silêncio | decisão do pesquisador: executar triagem dupla fica para depois dos testes |
| `DEBT-114` | item 8 exige 4 declarações, há campo para 1 | o resto depende do `112` |
| `DEBT-115` | o `DEBT-049` foi fechado sem o **terceiro controle independente** que o pesquisador exigiu por escrito — e o fechamento **desbloqueia o DEBT-003 em cascata** (`system_debt.ts:236` trata RESOLVIDO como dependência satisfeita) sem que a condição substantiva mude | é decisão dele: ou roda o controle, ou dispensa a exigência por escrito |
| `DEBT-116` | o critério de entrada da fase de testes diz que "nenhum dos 45 sem plano impede uma revisão de rodar" — **5 estão marcados BLOQUEIA** | ou reclassificar os cinco com justificativa, ou admitir que o critério precisa incluí-los |
| `DEBT-117` | **quarta** rota de LLM sem trilha de auditoria: `batch_db_screen` decide por `startsWith("YES")`; erro de API vira exclusão silenciosa. O `DEBT-098` deu a classe por resolvida | precisa reabrir o 098 junto |
| `DEBT-118` | MAYBE contado em "Incluídos" **e** "Incertos": a soma excede o total triado | corrigir a regra de inclusão durante conserto de relatório alteraria o resultado da revisão |
| `DEBT-119` | cegamento real e separação multiusuário não existem | sem norma que exija; fica registrado para não se perder |

**Nota de ordem para a F8:** o `DEBT-046` fez a skill declarar que `órfãos > 0` impede a
finalização. As **21 linhas** de checklist PRISMA sem cobertura (`DEBT-014`, agora BLOQUEIA)
mantêm a F8 bloqueada por essa regra. Isso entra no critério de entrada da fase de testes.

---

## 4. Ordem revista para a execução

O `EXECUCAO_checklist.md` precisa ser **reordenado**: o passo 6 (expor `compararCorridas()`)
está fora de ordem.

1. ~~`DEBT-113` — protocolo declara o processo de seleção~~ **FEITO**
2. ~~9 superfícies do ASReview~~ **FEITO** (falta a tool reprovar de saída)
3. `DEBT-115` e `DEBT-116` — **decisão do pesquisador**, não execução
4. `DEBT-117` — quarta rota de LLM na trilha de auditoria, e reabrir o `DEBT-098`
5. `DEBT-021` — `screen_candidates` chama `updateScreening` (`database.ts:312`, existe e ninguém
   chama) — **reusar, não reescrever**
6. `DEBT-020` — triagem de texto completo que não lê o texto completo
7. Fase 1 item 5 — motivos de exclusão `EX-01..EX-11`
8. Fase 2 verificação 4 — gate do manifest aponta para tool registrada
9. **Só então** `DEBT-112` → `DEBT-101` (run_id e reviewer **antes** da tool de kappa)

---

## 5. Verificação desta rodada

| | resultado |
|---|---|
| `npx tsc --noEmit` | limpo |
| `npm run build` | `dist` em dia |
| `npx vitest run` | **217 testes, 22 arquivos, verdes** (eram 211) |
| prova por execução do gate | protocolo gerado **reprova** por F4.1; preenchido, passa |
| `grep -rn "F4\.1\.[235]" src/` | passou de **zero** para presente em 5 arquivos |
| `grep -rn "suggestBlinding" src/` | nenhum |
| backlog | 119 achados; 75 ABERTO + 35 RESOLVIDO + 5 EM_CURSO + 4 RECUSADO = 119; **0 abertos sem `destino`, 0 sem `gravidade`**, nenhum id duplicado |

Os **15 achados antigos sem `gravidade`** foram classificados pela tool, cada um com o motivo no
`context` — 4 BLOQUEIA, 7 SERIO, 4 MENOR.
