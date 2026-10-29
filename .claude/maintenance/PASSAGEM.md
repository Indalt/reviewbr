# Passagem — tudo o que foi decidido, para executar em sessão nova


> **Atualização de 08/10/2026 — leia ANTES de tudo:** o Vicente decidiu nove pontos que
> mudam o alvo da manutenção — entre eles que **atualizar o MCP para instalar método novo não
> é defeito**, que **registro de protocolo deixa de ser pré-condição**, que o **RAISE não é
> canônico** e que **agente não se multiplica por método, skill sim**. O grave passou a ser o
> **resíduo de PRISMA no modo de agir**. Está tudo em `DECISOES_2026-10-08.md`, com os fatos
> apurados com controle positivo (não reapurar) e o que lá diverge deste documento.
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

> **Atualização de 03/10/2026 — leia PRIMEIRO:** os seis furos que travavam a execução
> (A–F) estão decididos em `DECISOES_2026-10-03.md`. Dois mudaram de natureza na verificação:
> o `DEBT-049` estava resolvido por evidência, e o `DEBT-022` foi reenquadrado (a causa é a
> skill oferecer ferramenta como se fosse método, não a tool). Onde este documento divergir,
> vale aquele.
>
> **Atualização de 02/10/2026 — leia antes deste documento:** a manutenção continuou depois
> dele. As 11 decisões do Vicente de 27/09 e onde a execução parou estão em
> `DECISOES_2026-09-27.md`. A troca de computador e o que precisa estar instalado estão em
> `TRANSICAO_PC_2026-10-02.md`. Onde este documento divergir deles, valem eles.
> **A ordem de execução, o estado de cada passo e os furos do plano estão em
> `EXECUCAO_checklist.md`.** É por ele que a execução se retoma.

> **Pendente de registro (02/10/2026) — proposta de extensão, aprovada para entrar na fila:**
> registrar pelo `record_system_finding` como **extensão (RV-11)**. Não foi registrada na
> origem porque o MCP `reviewbr` não conectou naquela sessão (`CONNECTION_CLOSED`).
> - **Lacuna:** não há etapa antes do F0. `assess_research_design` só escolhe o tipo de revisão;
>   ninguém avalia se a pergunta é viável nem para quem o resultado importa.
> - **Fonte:** skill `scientific-problem-selection` do plugin Anthropic em
>   `Bio Research-1.2.0-v39/skills/` (raiz do repo), baseada em Fischbach & Walsh, *Cell*
>   187:1828–1833 (2024). O resto do plugin (bioinformática, conectores) não serve.
> - **Proposta — etapa pré-F0 no `designer`, adaptando três referências:**
>   1. `02-risk-assessment` → listar premissas da revisão ("existe literatura?", "as bases a
>      devolvem?"), nota de risco 1–5, e teste de seguir ou parar = busca-piloto com controle
>      positivo antes de travar o protocolo (princípio 2 acima).
>   2. `03-optimization-function` → declarar tipo de contribuição e quem precisa do resultado;
>      alimenta justificativa e objetivos (PRISMA 2020 itens 3 e 4).
>   3. `04-parameter-strategy` → diagnóstico de PICOS/PCC antes das strings (RV-07): fixar tudo
>      gera string que devolve zero; não fixar nada devolve milhares.
> - **Limite:** a estratégia 3 de `07-problem-inversion` ("tenho a resposta, qual a pergunta?")
>   muda a pergunta depois de ver os dados — fere o RV-01. Só cabe no `scout`.
> - **Não lidas ainda:** referências 01, 06, 08 e 09 da skill.

**Data:** 26/09/2026 · **Origem:** sessão longa que construiu o agente de manutenção
**Para:** a sessão que vai **executar** a manutenção, sem refazer o diagnóstico

> Este documento existe para que a execução não derive de novo sobre os mesmos erros.
> Ele consolida o que foi **decidido**. O que foi **encontrado** está no backlog; o que foi
> **planejado** está no plano; o que **depende de ordem** está em `ORDEM_correcoes.md`.

---

## 0. Antes de tudo: exaurimos os erros do sistema?

**Não.** E vale saber por quê, porque a resposta orienta a execução.

| O que aconteceu | O que isso diz |
|---|---|
| A auditoria sistemática achou **75** | varredura por método funciona |
| A conversa depois achou **~28 a mais** | pergunta certa acha o que a varredura não procurou |
| O teste de integração achou **2 que eu procurei manualmente e não vi** | instrumento acha o que o olho não vê |
| **DEBT-049** segue contestado | duas leituras do código se contradizem, e nenhuma venceu |

O que temos não é exaustão — são **instrumentos que encontram**: a skill `system-audit`,
`tests/integracao.test.ts`, a análise de conflito e a revisão adversarial por lentes.

**Consequência prática: espere achar mais durante a execução.** Registre pelo
`record_system_finding` e siga; não interrompa a correção em curso para caçar o novo.

---

## 1. Os princípios decididos — valem para toda ação futura

Cada um nasceu de um erro real desta sessão, não de teoria.

1. **Número herdado é hipótese.** Reapure contra o código antes de usar. O briefing dizia
   14 tools; eram 36, depois 40, depois 44 — no mesmo mês.
2. **Zero exige controle positivo.** "Não encontrei X" só vale com um caso que certamente
   existe encontrado pelo mesmo método. Já evitou dois falsos achados aqui, um deles meu.
3. **Conclua do código, nunca do nome.** `rag_query` soa semântico e é BM25 léxico.
4. **Nada se corrige durante auditoria.** O que se corrige deixa de ser medido.
5. **O alvo antes do conserto.** Corrigir sem saber contra que padrão conformar produz
   conserto pela metade (foi o que o RAISE mostrou sobre a triagem).
6. **Não é determinismo, é registro preservado.** Nem busca humana é reprodutível no sentido
   forte. O padrão da área é dois triadores com concordância **medida**.
7. **Seleção sem registro é falha.** Escolher no que trabalhar é legítimo; não declarar o que
   ficou de fora, não. Foi assim que 57 achados sumiram do radar.
8. **O que depende de alguém lembrar, decai.** Por isso verificação vira **teste**, não
   relatório. Auditoria acha uma vez; teste falha na hora.
9. **Agnóstico a método E a domínio.** O primeiro estava declarado e funcionava; o segundo
   nunca foi declarado, logo nunca foi verificado.
10. **A leitura e a decisão são do pesquisador.** Aponte, corrija, proponha — não feche
    achado que ele não leu, nem decida rumo por ele.

---

## 2. O agente existe e está operante

**8 tools.** Leitura: `audit_system_debt`, `check_standard_coverage`,
`query_methodology_catalog`. Gate: `validate_system_change` (RV-11). Escrita:
`record_system_finding`, `absorb_methodology`, `scaffold_methodology`, `validate_methodology`.

**Sempre a tool, nunca o arquivo.** Editar `system_debt.json` ou o catálogo à mão contorna a
verificação — e há precedente: as tools chegaram a **apagar o backlog em silêncio** quando o
arquivo não passava no schema (DEBT-068, corrigido).

**Rota de entrada**, na ordem, dentro de `.claude/maintenance/`: `CONTINUAR.md` →
`audit_system_debt` → `MANIFESTO_conformidade.md` → `PROTOCOLO_revisao_reviewbr.md` →
**`ORDEM_correcoes.md`** → `PLANO_usabilidade.md` → `COBERTURA_achados.md`.

**Para auditar:** carregue a skill `system-audit`. Não audite sem ela — achado de passagem
é subproduto, não auditoria.

---

## 3. Estado apurado em 26/09/2026

> **Sobre envelhecer:** não tema. O agente **deriva** cada linha abaixo — e desde 26/09
> também o mapa de destinos e a ordem de correção, que eram documento e viraram campo do
> dado. Se um número aqui divergir, o dado vence. Reapure e siga.

| Item | Valor | Reapure com |
|---|---|---|
| Backlog | 103 achados, 80 abertos/em curso | `audit_system_debt` |
| Destino de cada achado | derivado: `by_destino` | `audit_system_debt` |
| Ordem de correção | derivada: `bloqueados_por_dependencia` | `audit_system_debt` |
| Testes | 165, verdes | `npx vitest run` |
| Tools MCP | 44, `dist` em dia com `src` | `tests/build_frescor.test.ts` |
| Catálogo | 107 metodologias, todas com fonte oficial | `query_methodology_catalog` |
| Padrões como dado | PRISMA 2020 (48 nós, 42 linhas), PRISMA-S | `check_standard_coverage` |

**Fase 1: 9 de 14 feitos.** Fase 2 (teste de integração): feita.

---

## 4. O que executar, na ordem

**Regra antes de qualquer correção:** consulte `ORDEM_correcoes.md`. Há 13 dependências e
1 exclusão mútua apuradas. Corrigir na ordem errada gera retrabalho já mapeado.

**Regra durante:** submeta a `validate_system_change` **antes**, feche por
`record_system_finding` **depois**. Nada entra sem tipo declarado.

### Fase 1 — os 5 que faltam
Estão em `COBERTURA_achados.md`, seção "Fase 1". O único do plano original ainda aberto é
os **motivos de exclusão padronizados (EX-01..EX-11)** — `grep -rn "EX-01" src/` não devolve
nada, com controle positivo nas skills, onde os códigos existem.

### Decisões do pesquisador — não execute sem elas
| id | o quê |
|---|---|
| DEBT-100 | modelo de fases como **dado** — faria o sistema ser motor de pesquisa protocolada em geral, não ferramenta de revisão sistemática. **Endossado em conversa**, sem protocolo ainda |
| DEBT-101 | tool que roda a triagem duas vezes e reporta o kappa. `compararCorridas()` já existe e **nenhuma tool a chama** |
| DEBT-102 | OCR com controle positivo para o corpus final. A capacidade existe, testada em ~9.150 páginas, em `origem/codigo_origem/` |
| DEBT-103 | remover ou parametrizar `src/run_search_*.ts` — mexe no `dist` |
| DEBT-081 | `projectPath` obrigatório nas tools que persistem — muda assinatura de 17 tools |
| DEBT-016 | o RV-11 valida a **prosa** da proposta, nunca a alteração real |

**Fase 4 (gate da pergunta)** tem a razão do desenho registrada em `PLANO_usabilidade.md`:
por que a passagem precisa ser **adversarial** e não procedimental, com o limite dessa
escolha. Sem ler aquela seção, a Fase 4 seria construída como checklist — e falharia pelo
mesmo motivo que a revisão por pares falha.

### ⛔ DEBT-049 — proibido corrigir
Duas leituras do código se contradizem sobre se o array `gates` do manifest é lido em runtime.
Exige **terceiro controle** antes de qualquer ação. O precedente do DEBT-017 mostra que o
achado pode estar errado — mas o revisor também.

---

## 5. As fragilidades dos nossos próprios instrumentos

Registrado porque instrumento não verificado acusa o sistema inocente.

- **Fatiar `index.ts` por `server.tool(` atribui handlers nomeados à tool errada.** Produziu a
  versão errada do DEBT-017 e me enganou **duas vezes**. Seis handlers (`openAlexHandler`,
  `crossrefHandler`…) são declarados fora do `server.tool` e passados por referência.
- **O teste de integração já teve dois falsos positivos meus**: universo de busca sem as
  skills, e "menção" confundida com "alcançabilidade". Ambos corrigidos, com o motivo no
  comentário.
- **Grep manual não substitui o teste.** Procurei termos temáticos à mão e passei batido no
  template de protocolo — o pior caso, porque vai para todo `protocol.md` gerado.
- **O ramo legado do guardrail (SQLite) não tem teste.** Vive no `index.ts` e depende do banco.
  Extrair para serviço, como foi feito com `ProtocolGate`, é o conserto certo.

---

## 6. Orçamento

**~410–425 mil tokens de saída por janela de 5h**, calibrado com dois pontos reais. Pare em
85%. Meça com `python .claude/maintenance/medir_esforco.py`.

**A maior alavanca não é trocar de modelo: é não carregar arquivo grande no contexto.**
A leitura de cache foi 67% do custo da janela de pico, e ela vem de contexto × turnos.
Processe por script. A política de esforço está em `CONTINUAR.md` §2.

---

## 7. O que NÃO fazer

- Reescrever o que funciona sem falha documentada.
- Corrigir durante auditoria.
- Confiar em número escrito em documento — inclusive neste. **Todos são deriváveis:** reapure.
- Tratar `DEBT-100`, `101`, `102`, `081`, `016` como tarefa: são decisões.
- Tocar `DEBT-049`.
- Declarar a Frente 2 ou a Fase 1 "concluída" sem reapurar o denominador na hora.
