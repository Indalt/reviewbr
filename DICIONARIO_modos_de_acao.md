# Dicionário de modos de ação — ReviewBR

> **O que é:** um apoio de leitura, não um regulamento. Serve para o agente entender o que o
> Vicente está dizendo quando uma palavra, sozinha, poderia ter mais de um sentido.
>
> **Princípio:** todo pedido está ligado a um contexto. Uma palavra só é ambígua se o contexto
> não resolver o sentido. Por isso, **leia o contexto antes de consultar este dicionário**. Use
> o dicionário quando o contexto não bastar.

---

## 1. Onde está o contexto

O que mais ajuda a entender um pedido, em ordem aproximada de peso:

1. **A conversa até aqui.** Mensagens curtas costumam continuar a anterior.
   "mude para público" só faz sentido porque o repositório tinha acabado de ser criado privado.
2. **Restrições já ditas no chat.** "não pode gerar mudança na lógica", dito uma vez, continua
   valendo nas mensagens seguintes até ser revogado.
3. **O que o agente acabou de propor.** Um "ok" logo depois de uma proposta é uma resposta a ela.
4. **O arquivo aberto e a posição do cursor.** Indicam do que se está falando quando o alvo
   não é nomeado.
5. **Em que ambiente se está.** O Claude Code (plano Teams) é o ambiente principal e guarda o
   contexto longo. O Antigravity funciona como **agente suplente**: na maioria das vezes cuida de
   questões operacionais e de arquivos novos enquanto os tokens do principal não voltam.
6. **O estado registrado no disco.** O `DECISOES_*` mais recente em `.claude/maintenance/` e o
   estado da pesquisa (`protocol.md`, `project_state.json`).

---

## 2. Como o Vicente costuma escrever

- **Mensagens curtas e encadeadas.** O sentido completo está na sequência, não em cada frase.
- **Quase sem acento nem pontuação.** É hábito de digitação, não indica pressa nem descuido com
  o conteúdo.
- **Pedido e restrição na mesma frase.** Ex.: "apenas adicionar novos arquivos usando o que temos".
  A parte que limita é tão importante quanto a parte que pede.
- **Aprovação com condição.** "ok, se isso for seguro… podemos realizar" aprova, mas só se a
  condição for verdadeira. Vale confirmar a condição antes de executar.
- **Encerramento embutido.** "finalizada a questão da pasta" fecha um tema e abre espaço para o
  próximo, que normalmente vem na mensagem seguinte.
- **Decisões são dele.** Quando ele diz "decido", "sim" ou "declare o maybe", é decisão. O agente
  registra a decisão com as palavras dele e não a reinterpreta.

---

## 3. Modos de ação

Cada linha traz a **leitura mais comum** e os **sinais de contexto** que podem mudá-la.

| Modo | Expressões que costumam indicar | Leitura mais comum | Sinais de contexto que mudam a leitura |
|---|---|---|---|
| **CONSULTAR** | "me diga", "explica", "é possível?", "conseguimos…?" | Responder no chat | Se vier com "faça um arquivo", vale a entrega pedida |
| **RELATAR** | "relatório", "me traga", "levantamento", "onde está cada…" | Criar um `.md` novo com o que foi encontrado | "completo" pede leitura ampla; "sem olhar todo o projeto" pede leitura rasa |
| **APURAR** | "verificar", "conferir", "checar", "reverificar" | Ler e comprovar com evidência, de preferência com controle positivo | Num chat de correção já aprovada, pode emendar com a correção |
| **PLANEJAR** | "propor", "como faríamos", "preparar o terreno" | Montar o caminho e apresentar | "para outros modelos atuarem" pede instruções operacionais por escrito |
| **APROVAR** | "pode seguir", "ok, pode realizar", "sim" | Executar o que foi proposto logo antes | "ok" depois de uma explicação, sem proposta pendente, costuma ser só "entendi" |
| **REGISTRAR** | "anota", "salvar contexto", "virar dado" | Gravar em `DECISOES_*`, `system_debt.json` ou log | Na pesquisa, o registro vai para `decisoes/` ou `diario/` do projeto |
| **ADICIONAR** | "apenas adicionar", "arquivo novo", "usando o que temos" | Criar arquivos sem editar os existentes | Comum quando o Antigravity está como suplente |
| **ORGANIZAR** | "organizar", "uma pasta só com…", "separar" | Copiar ou mover sem alterar conteúdo | "organizar os dados do evento" é trabalho na pesquisa, não no sistema |
| **CORRIGIR** | "corrigir", "resolver o DEBT-xxx" | Mudar o mínimo necessário naquele item | Se a correção revelar um problema maior, apurar e reportar antes de ampliar |
| **ALTERAR** | "mudar a lógica", "refatorar", "reescrever" | Mudar o comportamento do sistema | Só faz sentido quando não há restrição de lógica ativa no chat |
| **SUPRIMIR** | "suprimir", "aposentar", "tirar", "remover" | Mover para `old/` | Apagar de fato só quando ele disser isso com essas palavras |
| **PUBLICAR** | "colocar no github", "commit", "mudar para público" | A operação git/GitHub pedida | Conta: `Indalt` |
| **RETOMAR** | "continuar", "retomar", "sessão nova", "outro PC" | Ler o documento de entrada e seguir de onde parou | O que estiver marcado como "não reapurar" já está fechado |
| **CONDUZIR** | "conduzir a revisão", "rodar a fase", "continuar a pesquisa" | Operar a pesquisa usando as tools MCP | Não envolve mexer no código do sistema |

---

## 4. "Projeto": de que se está falando

A palavra serve para duas coisas. O contexto quase sempre resolve qual:

| Se o contexto tem… | "projeto" provavelmente é… | Pasta |
|---|---|---|
| Código aberto, MCP, tools, skills, DEBT, manutenção | **o SISTEMA** (ReviewBR) | `reviewbr/reviewbr-mcp/`, `.claude/` |
| Um tema de pesquisa, um evento, dados, fases F0–F8 | **a PESQUISA** em questão (ex.: `roda_de_aromas`) | `reviewbr/projects/<nome>/` |
| "esta pasta", "o repositório", GitHub | **a RAIZ** inteira | `c:\reviewbr` |
| Site, interface | **a WEB** | `reviewbr-web/` |

Outras referências: `old/` e o `skills/` da raiz são **legado**. Servem como histórico, não como
modelo a seguir.

---

## 5. Expressões abertas: como ler cada uma

Estas expressões não estão erradas. Elas apenas dependem mais do contexto para fazer sentido.

| Expressão | Como ler |
|---|---|
| **"tratar"** | Com restrição de lógica ativa: **ADICIONAR** ou **REGISTRAR**. Com um DEBT nomeado: **CORRIGIR**. Sem nenhum desses sinais, sugira uma leitura ao Vicente em uma linha. |
| **"ver" / "olhar"** | Quase sempre **CONSULTAR** ou **APURAR**. Também pode ser um pedido de atenção, como em "veja isso antes de julgar": considere aquilo antes de concluir. |
| **"mexer"** | O tamanho da mudança vem do alvo: um arquivo citado indica **CORRIGIR**; "a lógica" indica **ALTERAR**. |
| **"organizar a questão"** | Depende do que vem depois: pasta (**ORGANIZAR**), dados de evento (pesquisa) ou "para outros modelos" (**PLANEJAR + REGISTRAR**). |
| **"preparar o terreno"** | Deixar pronto para outra pessoa ou outro modelo executar: estrutura, instruções e dados no lugar. |
| **"ok"** | Com proposta pendente, é aprovação. Sem proposta, é "entendi". Com "se…", é aprovação condicional. |
| **"finalizada a questão X"** | Tema X encerrado. O próximo assunto é o que vier na mesma mensagem ou na seguinte. |
| **"atualizar" (dados)** | Na pesquisa, costuma ser **acrescentar** o que é novo, mantendo o que já existe. Se for sobrescrever, ele costuma dizer. |
| **"seguro"** | Que não perde contexto, não quebra o fluxo do outro ambiente e não muda a lógica. |

---

## 6. Termos do domínio com mais de um sentido

| Termo | Sentidos possíveis | Pista no contexto |
|---|---|---|
| **revisão** | Revisão de literatura (o produto) **ou** revisão de código/documento | Fala de pesquisa, protocolo ou fases → literatura. Fala de DEBT ou código → auditoria |
| **protocolo** | `protocol.md` de uma pesquisa **ou** `PROTOCOLO_revisao_reviewbr.md` (manutenção) | Qual frente está ativa no chat |
| **fase** | F0–F8 da pesquisa **ou** etapa do plano de manutenção | Com "F" e número → pesquisa |
| **método** | Metodologia científica (PRISMA, integrativa…) | Não se refere a software |
| **ferramenta** | O ReviewBR **ou** um software externo (ex.: ASReview) | Não é sinônimo de método (`DEBT-022`) |
| **tool** | Função do servidor MCP (`mcp__reviewbr__*`) | Executa e não decide |
| **skill / agente** | Skill: procedimento. Agente: especialista | Skill se multiplica por método; agente não (decisão de 08/10) |
| **rigor** | **Aplicado** (verificado) **ou** **declarado** (só escrito) | A distinção importa para ele; vale explicitar qual |
| **decisão** | Fala do Vicente **ou** escolha técnica | A do Vicente se registra; a do agente se propõe |
| **vestir método** | O sistema assimilar um método novo | Direção decidida em 04/10 |

---

## 7. Documentos de retomada

`RETOMAR.md`, `CONTINUAR.md`, `PASSAGEM.md` e `TRANSICAO_PC_*.md` se sobrepõem. Uma leitura que
costuma funcionar:

- O `DECISOES_*` mais recente tende a prevalecer (hoje: `DECISOES_2026-10-08.md`). Ele mesmo
  diz onde diverge dos anteriores.
- Os outros documentos servem de mapa do caminho percorrido.
- "não reapurar" indica fato já verificado. Refazer só gasta tokens.

---

## 8. Pedidos reais lidos no contexto

| Pedido | Contexto | Leitura |
|---|---|---|
| "me traga um relatório completo da aplicação desta pasta" | Primeiro contato com o código | **RELATAR** o sistema, leitura ampla, num `.md` novo |
| "não modifique o projeto, apenas crie relatórios sobre as propostas" | Havia propostas de mudança em discussão | **RELATAR** as propostas, só leitura |
| "vamos colocar essa pasta no github" → "tem de criar o repositório" → "mude para público" | Sequência no mesmo chat | **PUBLICAR**: criar o repositório em `Indalt` e depois mudar a visibilidade |
| "preciso tratar alguns pontos… não podem gerar mudanças na lógica" | Antigravity como suplente, tokens do Claude esgotados | **ADICIONAR**: arquivos novos que os chats do Claude consigam ler |
| "ok, se isso for seguro para salvar contexto podemos realizar. finalizada a questão da pasta" | O agente tinha proposto algo e a pasta `backupdecodigos` estava pronta | **APROVAR** com condição + encerrar o tema da pasta |
| "tivemos um evento no dia 18/09… preparar o terreno para modelos mais simples" | Pesquisa `roda_de_aromas` | **ORGANIZAR** os dados do evento + **PLANEJAR/REGISTRAR** instruções operacionais |
| "sem olhar todo o projeto, mas olhando o modo como eu ajo nesta pasta" | Pedido sobre o próprio jeito de trabalhar | Leitura rasa do código; o foco são o histórico e os documentos de manutenção |
| "todo input se relaciona a um contexto, veja isso antes de julgar" | Correção ao rascunho anterior deste arquivo | Rever a abordagem: contexto antes de regra |

---

## 9. Quando o contexto não resolve

Pergunte em uma linha e já ofereça a leitura mais provável, para o Vicente só confirmar ou
corrigir. Exemplo:

> "Entendi 'tratar' como criar arquivos novos sem mexer na lógica — é isso?"
