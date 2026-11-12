# Anotação para a sessão de leitura e organização — Fable 5.1, esforço máximo — 10/11/2026

> **O que este arquivo é.** As ideias do Vicente em 10/11/2026, organizadas a pedido dele, sem avaliação e sem
> leitura do projeto. Nada aqui é achado nem sessão nova: é a pauta de uma sessão de leitura, organização e
> definição, que ele vai conduzir com o Fable 5.2 em esforço máximo. O que executar e como, essa sessão define.
> Origem: a mensagem dele, reproduzida inteira no fim.
Correção. não vamos usar o fable 5.1 no max, vamos usar o 5.2 esforço high.


## 1. Por que esta sessão

- Ele percebe que o Opus vem criando "issues infinitas" (achados e sessões que se multiplicam).
- Quer uma sessão de leitura, organização e definição do que executar e de como executar, de forma limpa e
  atualizada, com o Fable 5.2 no esforço high.
- a abertura de compreensão está feita; o rumo é a finalização das frentes de trabalho.

## 2. O que o ReviewBR é, na trajetória que ele descreve e devemos verificar se condiz com a sua memoria.

1. Começou como ferramenta de revisão sistemática automatizada baseada em prisma.
2. Passou a apoio à pesquisa.
3. Agora passa a ser **ferramenta de apoio à pesquisa cuja especialidade é metodologias científicas validadas e
   reconhecidas pela ciência, com a capacidade de assimilar novas metodologias** que passem a existir e a ser
   aceitas cientificamente para projetos de pesquisa.

Caminhos pensados ao longo do tempo: modular; servidor MCP; "foi pensado bastante".

Direção que pareceu mais realista e está em curso: **uma mudança geral do sistema e, ao mesmo tempo, uma
ferramenta interna de manutenção do ReviewBR**, que serve tanto à manutenção quanto à assimilação de novas
metodologias.

## 3. As tarefas que ele pede para a sessão

1. **Busca no catálogo da Anthropic** (skills, conectores e plugins): o que é seguro, o que precisa ser feito para tornar a ferramenta segura quando for a publico, assim como elas se relacionam com o
   projeto, a exemplo do plugin Bio Research, que se tentou incorporar como nativo e como guia do ReviewBR. Mas que foi compreendido que não seria útil.
   - Ponteiro, sem releitura: a análise anterior do Bio Research está em
     `triagem_backlog_2026-11-05/TRIAGEM.md` (DEBT-110, recusado em 05/11) e na memória do projeto.
2. **Análise dos trabalhos**: muitas issues foram abertas e muitas já foram concluídas.
3. **Limpeza dos trabalhos já feitos.**
4. **Avaliação e limpeza dos trabalhos que ainda estão por fazer.**
5. **Uma lógica simples de manutenção e de assimilação de metodologias novas baseando-se na ciência e na lógica.**

**Como avaliar (acrescentado por ele em 10/11):** as avaliações das tarefas 2 a 4 são feitas com reflexão
crítica com o poder atual do fable para o sistema e o maintenance — não como listagem nem como aceite do que está registrado. Origem: "as avaliações devem ser feitas com
reflexões críticas".

Onde está o material (ponteiros, não leitura): `PLANO_sessoes_2026-10-29.md` (tabela de sessões, linha "Estado",
decisões de 31/10 a 09/11); `triagem_backlog_2026-11-05/TRIAGEM.md` (proposta por achado); `system_debt.json` via
`node .claude/maintenance/sessao_2a/le_audit.mjs`; `revisao_decisoes_2026-10-31/lista_decisoes.md` (D01–D41);
`.claude/agents/maintainer.md` (procedimento de assimilação e gate RV-11).
Como foi informado existem tentativas de revisão do sistema. desta vez vicente precisa organizar as tarefas apenas com o que realmente precisa ser feito para manter o rigor, mas sem denotar overthinking.

## 4. Ideia nova, só registrada

Um **sistema independente, plugável ao ReviewBR, que ajuda os pesquisadores a fazer perguntas com ajuda de IA
que resolve as partes linguísticas**. Estado: ideia em consideração ("estou agora pensando"). Não é decisão,
não é achado (regra do backlog) e não tem sessão e nao vai ter enquanto nao terminar de finalizar o maintenance.

## 5. O que esta anotação não decide

- A posição desta sessão em relação à M e à sequência registrada (M → 36 divergências → V → 3 → 4 → 5 → 6 →
  7+): ele define na própria sessão.
- Se a "página única depois da M" (decisão de 08/11) é o mesmo trabalho das tarefas 3 e 4 acima: ele define.

## 6. Regras que seguem valendo (lembrete)

- Decisão dele vai ao disco na hora, em forma precisa; a frase dele só como origem.
- Regra do backlog (05/11): achado é só defeito de hoje; ideia e agenda vão ao plano; metodologia que falta, ao
  catálogo, mas nao da forma como vinha sendo feito. Pode-se com as reflexões trazer as inovações encontradas para limpeza se não atrapalhar o desing da ferramenta em seu potencial.
- Não perguntar a porcentagem de uso; medir (`medir_esforco.py --agora`). Nenhum subagente ou workflow sem
  custo combinado.
- Sessão termina com commit e push. Só o sistema vai ao GitHub público.

## Origem — mensagem do Vicente, 10/11/2026

> a exemplo da metodologia bio research que tentamos incorporar como nativa e um guia para o reviewbr, busque na
> base de dados disponibilizada pela antropic, skills, conectores e plugins que sejam seguras, e que se relacionem
> com o projeto que estamos construindo. vale informar que foi desenvolvida uma ferramenta para revisao sistematica
> automatizada, depois mudamos para apoio a pesquisa e agora estamos mudando para uma ferramenta de apoio a pesquisa
> com a especialidade do sistema em metodologias cientificas validadas e reconhecidas pela ciencia com a capacidade
> de assimilar novas metodologias que passa a existir e serem aceitas como cientificamente aceitas para projetos de
> pesquisa. tudo isso aqui, foi pensado em alguns momentos como modular, foi pensado em fazer um servidor de mcp,
> foi pensado bastante, mas a direcao que parecia mais realista é essa que esta sendo desenvolvida como uma mudança
> geral e ao mesmo tempo o desenvolvimento de uma ferramenta interna de manutenção do sistema reviewbr tanto para
> manutencao quanto para assimilação de novas metodologias.
>
> foram abertas muitas issues e muitas ja foram concluidas. preciso que nesta sessão seja feita uma analise dos
> trabalhos, uma limpeza de trabalhos que ja foram feitos, uma avaliacao e limpeza dos trabalhos que ainda estao
> para ser feitos, e uma logica simples de manutencao e assimilacao de metodologias novas.
>
> estou agora pensando em um sistema independente que pode ser plugado ao reviewbr que vai ajudar os pesquisadores
> a fazer perguntas com ajuda de IA que resolve as partes linguisticas.
>
> Apenas anote isso de forma organizada porque vou usar o fable com o poder maximo para leitura, organizacao e
> definição do que executar, como executar de forma limpa e atualizada. isso porque o opus parece estar criando
> issues infinitas. neste momento nao fazer nenhuma avaliacao, nenhuma leitura do projeto. apenas organizar as
> ideias.
