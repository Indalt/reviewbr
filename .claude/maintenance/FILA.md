# Fila da manutenção do ReviewBR — página única

> Aprovada pelo Vicente em 12/11/2026. **Substitui a tabela de sessões do `PLANO_sessoes_2026-10-29.md`** (M, V,
> 3, 4, 5, 6 e 7+): os 32 achados abertos estão todos numa linha daqui, e nada mais é fila.
> Uma sessão lê esta página e o que a linha dela aponta. A análise que a justifica está em
> `ORGANIZACAO_2026-11-11.md` e não é leitura de sessão.

## Regras — valem para qualquer modelo

1. **Uma sessão faz uma linha, e só ela.** Não lê outros documentos de `.claude/maintenance/` além dos que esta
   página cita.
2. **Não cria achado, sessão, frente nem documento.** O que aparecer de passagem vira uma linha em "Visto de
   passagem", no fim desta página, sem avaliação. Quem decide se vira achado é o Vicente.
3. **Para cada achado da linha:** leia a "mentira de hoje" na entrada dele em
   `triagem_backlog_2026-11-05/TRIAGEM.md` e o registro por `node .claude/maintenance/sessao_2a/le_audit.mjs
   <ids>`; confira no código; aplique o veredito.
   - **FAZER:** conserto de código, com teste que falha antes e passa depois.
   - **DECLARAR:** corrigir o texto ou o dado para dizer o que o sistema faz hoje. Não construir a capacidade.
4. **Veredito e decisão já dados não se reavaliam.** Não troque DECLARAR por FAZER. Dúvida que o disco não
   resolve: pare e pergunte ao Vicente em até 3 linhas.
5. **Abrir conferindo:** `git status` limpo, `npx vitest run` verde (em `reviewbr/reviewbr-mcp`), audit válido.
6. **Fechar conferindo:** `npm run build`, suíte verde, cada achado fechado pela `record_system_finding`
   (RESOLVIDO, com `resolution`), audit válido, a linha marcada aqui com data e commit, commit e push.
7. **Sem subagente nem workflow.** Alteração do sistema passa pelo gate `validate_system_change`, com o tipo
   declarado.
8. **Resposta ao Vicente em até 5 linhas, com a decisão primeiro.**

## Fila

| ordem | sessão | FAZER | DECLARAR | estado |
|---|---|---|---|---|
| 0 | Limpeza dos documentos e rota do `maintainer.md` | lista fechada em `ORGANIZACAO_2026-11-11.md`, parte 6.3 | — | espera o Vicente confirmar a lista |
| 1 | A — Texto completo e leitura | 089 (primeiro) · 062 · 031 | — | a fazer |
| 2 | B — Registro da busca | 056 · 139 · 087 · 093 | 058 · 077 | a fazer |
| 3 | C — Triagem, deduplicação e tools em lote | 021 · 025 · 112 · 030 | 026 | a fazer |
| 4 | D — Funil e gates | 138 · 071 | 003 · 002 · 066 · os 21 subitens do 014 como `[NÃO COBERTO]` | a fazer |
| 5 | E — Trava do protocolo | 018 · 133 (mesmo conserto) · 042 | 060 | a fazer |
| 6 | F — Ferramentas da manutenção | 141 | 016 · 153 (depois do 141) | a fazer |
| 7 | G — Textos que prendem o sistema à revisão sistemática | 135 | 137 · 151 · 008 | a fazer |
| 8 | H — Mapeamento das normas | — | — | **não começar**: espera a decisão do Vicente sobre a parte 13 do `ORGANIZACAO_2026-11-11.md` |
| 9 | M — Descrição do método, com o Vicente | — | — | depois da H |
| 10 | Fase de testes | — | — | depois da M |

Os números são ids `DEBT-NNN`. Cada linha de 1 a 7 cabe numa janela de 5 h. As linhas 1 a 7 não dependem uma
da outra nem da linha 0; a ordem é a do dano a uma pesquisa em andamento.

Decisões de 29/10 que valem nos consertos: 021 (a saturação lê a triagem do disco), 025 (similaridade de 90%
ou mais só sinaliza o par), 031 (a página é guardada na extração), 056 (o código grava o log de busca), 018 (a
trava vale só pelo `project_state.json`), 138 (a exportação recalcula o funil e bloqueia divergência), 016 (aviso
na tool sobre `targets`).

## O que não é fila

Assimilar metodologia, OCR, validação da IA dentro da revisão, trava da escolha de método, abrir o ReviewBR
numa IDE, a arquitetura de agentes por papel. Acontecem quando o Vicente pedir.

## Visto de passagem — não avaliado

- `reviewbr/reviewbr-mcp/src/index.ts.tmp` segue no disco.
