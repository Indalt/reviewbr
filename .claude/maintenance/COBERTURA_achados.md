# Mapa de cobertura — agora é DADO, não documento

**Desde 26/09/2026 este arquivo não contém mais o mapa.** Ele existia como snapshot gerado à
mão, e snapshot decai — exatamente o que este sistema recusa em todo lugar.

## Onde o mapa está agora

Rode **`audit_system_debt`**. Ele deriva, do próprio backlog:

| O que devolve | O que era antes |
|---|---|
| `by_destino` | as seções deste documento |
| `by_gravidade` | a coluna de gravidade |
| `bloqueados_por_dependencia` | a tabela de `ORDEM_correcoes.md` |
| `sem_destino` | a lacuna que ninguém via |

Três campos passaram a existir em cada achado de `system_debt.json`:

- **`destino`** — FASE_1 | FASE_2 | CONFORM_EXTERNA | METODOLOGIA_NOVA | AGENTE_SKILL |
  DECISAO_PESQ | BLOQUEADO | DIAGNOSTICO. **Obrigatório:** `record_system_finding` recusa
  achado aberto sem ele, e a auditoria reprova o backlog que o tenha.
- **`gravidade`** — BLOQUEIA | SERIO | MENOR. Antes vivia enterrada no texto de `evidence`
  como prefixo.
- **`depende_de`** — ids a corrigir ANTES deste. A auditoria aponta quem espera quem, e para
  de apontar sozinha quando a dependência é resolvida.

## Por que isso importa

Foi assim que **57 de 85 achados abertos sumiram do radar**: registrados sem destino, nunca
classificados, nunca planejados. Não por descuido — porque *"para onde isto vai"* não era um
campo, era a lembrança de alguém.

**O que depende de alguém lembrar, decai.** Agora o achado não nasce órfão: o escritor recusa.

> `ORDEM_correcoes.md` permanece pelo raciocínio de cada dependência — por que A vem antes de
> B, com a evidência de código. As dependências em si estão no dado.
