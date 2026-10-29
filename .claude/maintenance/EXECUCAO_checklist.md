# Checklist de execução — ordem única, do começo ao fim

> **Estado em 09/10/2026 — leia ANTES desta tabela:** a ordem de trabalho mudou em 09/10
> (`DECISOES_2026-10-08.md` §8–§9). O que se executa agora está em
> `ESPECIFICACAO_vestir_metodos.md`, e o estado de cada item está no topo dela. Os quatro itens
> aprovados (DEBT-140, DEBT-100, DEBT-010, DEBT-095 + DEBT-126) foram executados em 09/10. O
> furo B abaixo (protocolo do DEBT-100 antes de implementar) foi suprido pela especificação de
> 09/10, que o Vicente aprovou como o plano a executar.
>

> **Direção decidida em 04/10/2026 — leia junto:** o sistema deixa de ser aplicador de PRISMA e
> passa a ser ferramenta de pesquisa que **veste** métodos, com assimilação **automatizada**.
> O rumo, o pipeline de assimilação, a fronteira do que é modular e o CORTE do que entra antes
> da fase de testes estão em `DIRECAO_ferramenta_que_veste_metodos.md`.
>

> **Atualização de 03/10/2026 (reverificação) — leia ANTES de tudo:** a correção da skill
> `screening-rules:32` foi aprovada e revelou que o erro era maior: a afirmação falsa sobre o
> ASReview estava em **9 superfícies**, e a causa era o sistema não saber representar
> *procedimento* de triagem. O protocolo já **não trava** com o item 8 do PRISMA em branco
> (`DEBT-113`, resolvido). Ver `DECISOES_2026-10-03b_reverificacao.md`, que corrige o que o
> `DECISOES_2026-10-03.md` deixou passar — inclusive a ordem de execução.
>

**Criado em 02/10/2026**, combinado com o Vicente. **Este é o rastreador de estado da execução.**
**Os seis furos (A–F) deste checklist estão decididos em `DECISOES_2026-10-03.md`, com a
ordem de execução resultante.** O texto das decisões anteriores continua em `DECISOES_2026-09-27.md`. O plano de fundo está em
`PLANO_usabilidade.md`, e as dependências entre achados estão em `ORDEM_correcoes.md`.

## Papel deste checklist

O chat de **execução** cumpre os passos abaixo, na ordem. Planejamento e decisão ficam com o
chat de **briefing**. Quando a execução encontra um furo do plano, isto é, algo que o plano
não decide, ela registra o achado pela tool, fecha o passo em curso com segurança e para com o
aviso "FURO DO PLANO — levar ao chat de briefing". O furo entra na seção "Furos" abaixo.

Regras de cada passo: `validate_system_change` antes, `record_system_finding` depois, build
limpo e suíte verde ao fechar. Ao concluir um passo, atualize a coluna Estado aqui.

## Passos

| # | Passo | Estado |
|---|---|---|
| 1 | Reapurar o backlog (`audit_system_debt`) | ▶ em andamento |
| 2 | Gravar no backlog o que foi anotado com o MCP fora do ar: a seção 6 de `TRANSICAO_PC_2026-10-02.md` (os itens "a conferir" só depois de verificados) e a proposta de etapa pré-F0 no topo de `PASSAGEM.md` (extensão, RV-11). Depois de gravar, trocar cada bloco por uma linha com os ids | ▶ em andamento |
| 3 | Gravar no `context` dos achados as decisões de 27/09 que só estão em documento: DEBT-103, 101, 016, 072, 081, 041, 076, 018, 100, 102 e 043; e `depende_de: [DEBT-081]` no DEBT-018 | ▶ em andamento |
| 4 | DEBT-020: recusar a triagem de texto completo também quando faltar `projectPath` ou `identifier` (`screen.ts:300`) | ⬜ |
| 5 | DEBT-103: remover `src/run_search_pubmed.ts` e `src/run_search_repository.ts`, as sobras compiladas em `dist/` e as exceções no teste de integração | ⬜ |
| — | **Parada: aguardar o retorno do chat de briefing (furo A) antes do passo 6** | ⬜ |
| 6 | DEBT-101: tool que roda a triagem duas vezes e reporta concordância e kappa (`compararCorridas()`, em `screening_audit.ts`) | ⬜ |
| 7 | DEBT-016 + DEBT-072: o gate confere cada `target` no disco e lê o protocolo, em vez de aceitar `protocol_locked: true` declarado | ⬜ |
| 8 | DEBT-081: `projectPath` obrigatório nas tools que gravam e opcional nas que só devolvem dado; em seguida o DEBT-093, que depende dele | ⬜ |
| 9 | DEBT-041 + DEBT-076: manter `TOOL_PERMISSIONS`; remover os métodos de runtime que só são chamados em teste, junto com o `guardedHandler` | ⬜ |
| 10 | DEBT-018: hook `PreToolUse`, só depois do passo 8 | ⬜ |
| 11 | DEBT-043: testes dos invariantes RV-01 a RV-08. Conferir antes a premissa: já há testes de RV-01, RV-05 e RV-08 | ⬜ |
| 12 | DEBT-026: motivos de exclusão EX-01 a EX-11 gravados no código, o único item pendente da Fase 1 do plano. Reclassificar o destino de METODOLOGIA_NOVA para FASE_1 | ⬜ |
| 13 | Critério de parada da Fase 1: uma revisão de teste ponta a ponta em que a exportação reprova quando deve e passa quando está tudo certo | ⬜ |
| 14 | Fase 2 do plano: criar as verificações 3 (campo lido que ninguém escreve) e 5 (ação descrita na instrução do agente sem tool correspondente). As verificações 1 e 2 já existem em `tests/integracao.test.ts` | ⬜ |

Depois do passo 14, o plano em disco acaba (ver furo E).

## Furos do plano — para o chat de briefing

| | Furo | Afeta |
|---|---|---|
| A | DEBT-096: a decisão de 27/09 deu o DEBT-094 por fechado, mas ele está EM_CURSO. Faltam os itens §4.9.3.1 a 4 do RAISE (desempenho e recall, padrão-ouro, interesses, limitações). O DEBT-096 pergunta se as tools de IA se corrigem antes ou depois disso | passo 6 (DEBT-101 é tool de IA na triagem) |
| B | Protocolos do DEBT-100 (fases como dado) e do DEBT-102 (OCR na conferência final). A decisão 7 de 27/09 manda escrevê-los antes de implementar; escrever protocolo é planejamento | nenhum passo |
| C | DEBT-021 (a regra de saturação não enxerga decisões gravadas) e DEBT-022 (`screen_with_asreview` não produz decisão): estão na Fase 1 como BLOQUEIA, mas nenhuma decisão diz como corrigir. O 022 não tem conserto óbvio sem rótulos humanos | nenhum passo; seguem abertos |
| D | A verificação 4 da Fase 2 (gate declarado no manifest e não lido em runtime) é a pergunta do DEBT-049, intocável até um terceiro controle. O teste atual só confere que a tool do gate existe | passo 14 (fica fora dele) |
| E | Depois da Fase 2, o plano acaba. As Fases 3 (RAISE completo) e 4 (gate da pergunta) exigem protocolo, e cerca de 45 achados abertos (conformidade externa, metodologia nova, agentes e skills) não têm plano | o que vem depois do passo 14 |
| F | DEBT-001 (modo CLI `--tool` morto): decidido como fora de escopo, mas segue ABERTO na Fase 1. Recusar formalmente, com o motivo, ou manter aberto? | nenhum passo |
