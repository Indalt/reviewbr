# Plano — tornar o ReviewBR utilizável e eficaz

**Data:** 25/09/2026 · **Critério único:** uma revisão real, ponta a ponta, que um periódico aceite.

> 98 achados no backlog é paralisia, não plano. Este documento diz **o que entra agora e o que
> espera** — e o critério é sempre o mesmo: isto impede uma revisão de ser publicada?

---

## Fase 1 — parar de mentir (o que hoje reprovaria a revisão na submissão)

Ordem deliberada: o primeiro item é o que poria uma afirmação falsa no artigo de alguém.

| # | Estado | O quê | Por quê primeiro |
|---|---|---|---|
| 1 | ✅ **FEITO** 25/09 (DEBT-019, DEBT-057) | **`export_dataset` deixa de carimbar "PRISMA-S Compliant" sem verificar** | é o único achado que faz o sistema afirmar conformidade que não tem. Sai no artigo |
| 2 | ✅ **FEITO** 26/09 (DEBT-038) | **`validate_prisma_flow` (RV-05) entra no caminho do export** | o verificador existe, reprova de verdade, e ninguém o chama — o precedente do sistema, na própria trava que ele cita |
| 3 | 🟡 **PARCIAL** 26/09 (DEBT-027, 098, 099) | **Triagem auditável:** registro preservado (versão resolvida, data, prompt, entrada e saída de cada decisão) — **feito**. Concordância entre duas execuções, medida e reportada — **NÃO feito**: `compararCorridas()` existe em `screening_audit.ts:161` e nenhuma tool a chama (DEBT-101, EM_CURSO), e o sistema sequer sabe gravar duas corridas (DEBT-112) | ⚠️ **reformulado em 25/09** — ver DEBT-101. O alvo não é determinismo: nem busca humana o tem. É auditabilidade e variabilidade medida, que é o que já se exige de triador humano (dois independentes + kappa + terceiro resolve). **Corrigido em 04/10/2026 (DEBT-109):** a linha dava a concordância por FEITA; dar por feito o que não está é a mesma classe de falha que o plano existe para caçar |
| 4 | ✅ **FEITO** 26/09 (DEBT-017, 033, 034, 080, 083) | **Guardrail do RV-01 cobre aquisição**, não só busca | hoje se baixa PDF, faz snowballing e importa dataset com protocolo em rascunho |
| 5 | ⬜ **PENDENTE** — único da Fase 1 | **Motivos de exclusão padronizados (EX-01..EX-11) gravados** | o fluxograma PRISMA exige o motivo de cada exclusão em texto completo |

**Fora da ordem, por urgência:** DEBT-068 (as tools de escrita apagavam backlog e catálogo em
silêncio sobre arquivo ilegível) e DEBT-006 (o `dist` estava 2 meses atrás do `src`). Ambos
fechados; o primeiro era nas tools que o próprio mantenedor usa.

**Critério de parada da Fase 1:** rodar uma revisão de teste ponta a ponta e o export **reprovar**
quando deveria — e passar quando tudo está correto. Prova por execução, não por teste unitário.

### O que é a "fase de testes" — definido em 04/10/2026, porque o termo estava ambíguo

Não é uma fase do plano de manutenção, e **não** é a suíte do `vitest` (essa roda o tempo todo).
É o **critério de parada acima, executado de verdade**: conduzir uma revisão real ponta a ponta,
com o sistema, para ver o que o backlog não ordena.

- **Quem conduz:** o pesquisador, usando o ReviewBR como ferramenta — não o agente de manutenção.
  A manutenção para quando a fase de testes começa; ela volta com o que os testes revelarem.
- **Por que é prova e não cerimônia:** foi assim que apareceram os 5 bugs do commit `4a0e936`.
  Revisão real acha o que varredura por método não procura.
- **O que ela decide:** quais dos ~45 achados sem plano importam de fato, e se a arquitetura
  aguenta a generalização do `DEBT-100`. Planejar isso antes é decidir no escuro.
- **Entrada:** Fase 1 fechada + Fase 2 escrita + os quatro itens do corte da
  `DIRECAO_ferramenta_que_veste_metodos.md` §7.
- **Saída:** achados registrados pelo `record_system_finding`, e a manutenção recomeça por eles.

⚠️ **Aviso que precisa estar aqui:** a trava de asserção (grau de completude derivado) vai marcar
o `prisma-sr` como PARCIAL enquanto houver as 21 linhas órfãs (`DEBT-014`) e os 6 mapeamentos
suspeitos (`DEBT-045`/`DEBT-124`) — e **barrar o manuscrito**. É o comportamento correto: melhor
esbarrar nisso num teste do que num artigo submetido. Mas não se pode ser pego de surpresa.

---

## Fase 2 — impedir que a classe volte

O defeito é **um só**: capacidade construída, nada a invoca. Cinco verificações determinísticas,
como **teste**, não como auditoria — auditoria decai, teste falha na hora:

1. exportado sem chamador externo (com exceções declaradas)
2. tool no mapa de papéis que nenhum corpo de agente ou skill invoca
3. consumidor órfão — campo lido que ninguém escreve
4. gate declarado em manifest e não lido em runtime
5. verbo de ação na prosa do agente sem tool correspondente

A partir daí, **desintegrar o sistema quebra a suíte**.

---

## Fase 3 — conformidade RAISE completa (exige protocolo próprio)

Padrão-ouro de triagem, meta de recall fixada por quem não desenvolveu, avaliação de desempenho
publicada, prompts e dados abertos, declaração de interesses e limitações. É **EXTENSAO** pelo
RV-11: trabalho de método, não de conserto. Não cabe nesta fase e não deve ser improvisado.

---

## Fase 4 — o gate da pergunta

### Por que ADVERSARIAL e não procedimental — a razão que sustenta o desenho

Registrado porque, sem isto, a Fase 4 seria construída como checklist e falharia pelo mesmo
motivo que a revisão por pares falha.

**Metodologia detém o descuidado, não o determinado.** A evidência é dura: o caso Sokal e o
das *grievance studies* passaram revisão por pares em periódicos reais com textos
deliberadamente absurdos e metodologicamente bem-comportados. A crise de replicação não foi
feita de violações de método — foi feita de p-hacking, HARKing e do jardim dos caminhos que
se bifurcam, todos **dentro** do método aceito.

O método garante que o trabalho seja **conferível**. Não que seja verdadeiro nem que valha a
pena. Uma revisão pode cumprir os 27 itens do PRISMA e responder perfeitamente a uma pergunta
que ninguém precisava — e nenhum item do checklist detecta isso, porque nenhum item é sobre
isso.

**O que de fato limita, na ciência, é adversarial e não procedimental:** pré-registro (travar
a pergunta antes dos dados — a lógica do RV-01), *Registered Reports* (o periódico aceita a
**pergunta** antes de ver o resultado), replicação, e o filtro mais lento e mais implacável,
que é o uso — trabalho que ninguém consegue usar morre.

**Precedente nesta própria sessão:** a revisão adversarial do agente de manutenção, com quatro
lentes instruídas a procurar o que estava errado, devolveu 4 de 4 "não pronto" e achou o que o
procedimento não achou. E o DEBT-017 foi corrigido porque um lote foi instruído a **confirmar
ou contradizer** — e contradisse. Nenhum dos dois veio de verificação de forma.

**Consequência para o desenho:** o gate não pode ser só "o framework fecha?". Precisa de uma
passagem em que um agente é instruído a **argumentar que a pergunta não vale a pena** — que a
lacuna é lacuna de leitura, que responder reformula em vez de resolver, que o resultado não
mudaria nada.

**E o limite, que também é real:** passagem adversarial de LLM **não é revisão por pares**. É
barata e pega o óbvio — onde mora a maior parte do problema, não o mais difícil. Não substitui
comunidade, replicação nem uso. O que ela faz é mover o obstáculo para **antes de travar o
protocolo**, quando ainda dá para mudar de pergunta.

### O que o gate verifica

Antes de travar o protocolo: o framework fecha? há declaração do que contaria como resposta?
a alegação de ineditismo tem citação? mais uma passagem **adversarial** — um agente instruído a
argumentar que a pergunta não vale a pena. Também EXTENSAO.

---

## O que NÃO entra agora, e por quê

| Fica esperando | Motivo |
|---|---|
| os 12 mapeamentos PRISMA errados (DEBT-012) e os 21 subitens sem cobertura (DEBT-014) | são CONFORMIDADE e não impedem a revisão de rodar; entram com o checklist |
| religar RBAC, `logDecision`, `setStatus` | a Fase 2 dirá se são necessários ou se devem ser removidos — religar por religar é o vício inverso |
| implementar JBI, GRADE, MECIR | EXTENSAO, cada uma com protocolo próprio |
| RAG semântico no lugar do BM25 | não impede publicar; decisão de método |

**Regra durante a execução:** cada correção passa por `validate_system_change` antes, e fecha o
achado por `record_system_finding` depois. Nada entra sem tipo declarado.
