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

## Dois princípios decididos em 12/11/2026

- **Metodologia e norma se apontam, não se copiam.** O ReviewBR guarda a fonte oficial e a data em que ela foi
  lida, e mantém um mapa central para sugerir ao pesquisador a metodologia mais adequada. Não se transcreve
  norma nova nem se confere mapeamento item a item. As cinco normas já transcritas ficam como ajuda, sem crescer.
  - **Para que serve o mapa** (Vicente, 12/11/2026, ao autorizar apagar duplicatas do catálogo): quando um projeto
    de pesquisa começa, o ReviewBR sugere a metodologia mais adequada a partir do que o pesquisador deu de entrada,
    incluindo a pesquisa exploratória. O log da pesquisa exploratória é mantido, como referência para entender o
    projeto mais depressa e guiar o pesquisador no projeto iniciado, depois de formulado o objeto e desenhado o
    projeto. Por isso o catálogo tem uma entrada por documento: duplicata se apaga.
    Origem: "apagar as duplicatas se mantiver a ideia de ter as entradas de metodologias como um mapa e quando um
    projeto de pesquisa for iniciado sugerir a melhor metodologia de acordo com o conjunto de informações que foi
    dado nos inputs".
- **O controle por código vale em todo o ReviewBR**, da busca exploratória à formulação do objeto de pesquisa e
  à publicação: contagem, trava, registro, deduplicação e persistência não se simplificam.

## Fila

| ordem | sessão | FAZER | DECLARAR | estado |
|---|---|---|---|---|
| 0 | Limpeza dos documentos e rota do `maintainer.md` | — | — | **feita em 12/11/2026** |
| 1 | A — Texto completo e leitura | 089 (primeiro) · 062 · 031 | — | **feita em 12/11/2026** (commit `71ce06b`) |
| 2 | B — Registro da busca | 056 · 139 · 087 · 093 | 058 · 077 | **feita em 12/11/2026** (commit `bf9e156`) |
| 3 | C — Triagem, deduplicação e tools em lote | 021 · 025 · 112 · 030 | 026 | **feita em 12/11/2026** (commit `6456a4a`) |
| 4 | D — Funil e gates | 138 · 071 | 003 · 002 · 066 · os 21 subitens do 014 como `[NÃO COBERTO]` | **feita em 12/11/2026** (commit `83bf50f`) |
| 5 | E — Trava do protocolo | 018 · 133 (mesmo conserto) · 042 | 060 | **feita em 12/11/2026** (commit `4a2c082`) |
| 6 | F — Ferramentas da manutenção | 141 | 016 · 153 (depois do 141) | **feita em 12/11/2026** (commit `c436b28`) |
| 7 | G — Textos que prendem o sistema à revisão sistemática | 135 | 137 · 151 · 008 | **feita em 12/11/2026** (commit `6cf7ae8`) |
| 8 | H — Normas por ponteiro | ver abaixo | 045 · ver abaixo | **feita em 12/11/2026** (commits `fe53fb8`, `36e687a`, `c0cefbf`, `e61d713`) |
| 9 | M — Descrição do método, com o Vicente | — | — | **em curso:** rascunho em 12/11/2026 (`.claude/METODO_ReviewBR.md`); faltam as 6 escolhas do Vicente, na seção 7 dele |
| 10 | Fase de testes | — | — | depois da M |

Os números são ids `DEBT-NNN`. Cada linha de 1 a 8 cabe numa janela de 5 h. As linhas 1 a 7 não dependem uma
da outra; a ordem é a do dano a uma pesquisa em andamento.

Decisões de 29/10 que valem nos consertos: 021 (a saturação lê a triagem do disco), 025 (similaridade de 90%
ou mais só sinaliza o par), 031 (a página é guardada na extração), 056 (o código grava o log de busca), 018 (a
trava vale só pelo `project_state.json`), 138 (a exportação recalcula o funil e bloqueia divergência), 016 (aviso
na tool sobre `targets`).

### Linha 8 — o que a H faz, e só isto

1. **DEBT-045:** corrigir, na spec do `prisma-sr`, os números de item do PRISMA 2020 que o `analyst` lê para
   escrever o relato. Sem remapeamento.
2. **DEBT-014:** fecha na linha 4, com a declaração. Aqui, só se ainda estiver aberto. Sem mapear os 21
   subitens.
3. **Relatório do `check_standard_coverage`:** passa a dizer que o mapeamento é do sistema, não foi conferido
   contra a fonte, e que o pesquisador preenche o formulário oficial da norma.
4. **`sessao_2c/divergencias_prisma_s.md`:** fica como está. As 36 divergências não se decidem item a item, e o
   mapeamento de 30/10 segue valendo como ajuda.
5. **Data de leitura:** a entrada do catálogo guarda a data em que a fonte foi lida; quando um projeto escolhe o
   método, o protocolo dele grava o método, a fonte e essa data.
6. **Mapa de uma página:** um arquivo gerado do catálogo, com uma linha por metodologia (nome, quando usar,
   fonte, data de leitura). Não se escreve à mão.
7. **`maintainer.md`:** a assimilação passa a dois passos (fonte oficial; entrada no catálogo com a data), e a
   leitura documentada deixa de ser exigida para norma nova.

A linha 9 (M) redige o `METODO_ReviewBR.md` com o que já está decidido e leva ao Vicente só as escolhas dele. As
três perguntas da sessão 2c deixaram de ser necessárias.

## O que não é fila

Trilha executável para metodologia nova, OCR, validação da IA dentro da revisão, trava da escolha de método,
abrir o ReviewBR numa IDE, a arquitetura de agentes por papel, a rota para o Sci-Hub. Acontecem quando o
Vicente pedir.

## Visto de passagem — não avaliado

- `reviewbr/reviewbr-mcp/src/index.ts.tmp` segue no disco.
- Cinco skills dizem a que agente pertencem, e nenhum desses cinco agentes nomeia a sua skill: `reader` e
  `evidence-reading`, `extractor` e `extraction-form`, `librarian` e `prisma-s-logging`, `screener` e
  `screening-rules`, `analyst` e `synthesis-manuscript`.
- `reviewbr/projects/` tem cerca de 380 arquivos rastreados no repositório público.
- `PASSAGEM.md` ficou na pasta da manutenção porque `tests/porta_do_backlog.test.ts` lê o texto dele.
- (linha 1) `scihub_bridge.ts` monta o comando do python interpolando o DOI numa string de shell (`exec`,
  `--doi "${doi}"`).
- (linha 1) Nenhum código grava `03_screening/fulltext_not_retrieved.json`; o `retrieve_fulltexts` não registra
  os que falharam. Desde a linha 1, o BYOS só aceita DOI que esteja nesse arquivo.
- (linha 1) DOI recuperado pelo BYOS continua em `fulltext_not_retrieved.json`, que o funil conta como não
  recuperado.
- (linha 1) `download_and_extract_pdfs` pula o texto já gravado como `[NATIVE PDF EXTRACTED]`: texto extraído
  antes de 12/11/2026 não ganha página quando a tool roda de novo.
- (linha 1) `logToLocalProject` (`index.ts`) monta o caminho com `path.join(process.cwd(), projectPath)`, sem
  tratar `projectPath` absoluto.
- (linha 1) Pelo Git Bash com a unidade em minúscula (`c:/`), o `npx vitest run` acusa "No test suite found" em
  todo arquivo; pelo PowerShell em `C:\` a suíte roda.
- (linha 2) `snowball.ts:147` (`fetchCitations`) pede só a primeira página de `filter=cites:`, sem `per_page` nem
  paginação, e trata a resposta de erro do `fetchJson` (`__error`) como lista vazia.
- (linha 2) `harvest_records` não grava em `01_raw` nem com `projectPath`; a descrição do parâmetro diz "Sem ele,
  a coleta é exploratória e nada é persistido". Desde a linha 2 a coleta entra no log PRISMA-S.
- (linha 2) `librarian.md` passo 2 manda o agente salvar o JSON bruto em `01_raw/[fonte]_[data]_[hash].json`; as
  tools de busca já gravam em `01_raw`.
- (linha 2) `data.ts:333` grava `provenanceSource: "Local File Import"` quando a origem do RIS vem vazia; o
  comentário de `data.ts:156` diz que a origem fica vazia nesse caso.
- (linha 3) Decisão do Vicente em 12/11/2026, na sessão C, sobre a deduplicação: nível 2 = título normalizado + mesmo
  ano; nível 3 = título + 1º autor quando um dos dois registros não tem ano. Gravada no DEBT-025 e na skill.
- (linha 3) `reviewbr-web/src/app/api/chat/route.ts:365` declara o `get_screening_report` com `projectId`
  obrigatório e sem `stage`; desde a linha 3 a tool exige `projectPath`.
- (linha 3) `screen_candidates` com `candidates` em lotes e `projectPath`: cada lote substitui o anterior nos
  artefatos canônicos, sem acumular; desde a linha 3, o segundo lote pede `substituicao`.
- (linha 3) `screener.md` passo 3 manda salvar `03_screening/included.json` e `excluded.json`; o `screen_candidates`
  grava `excluded_fulltext.json`.
- (linha 3) `prisma-rigor-gates/SKILL.md:29` lista "F4.3 (motivos EX-01..EX-11 derivados de F1.3)" entre o que a
  verificação de completude confere.
- (linha 5) `initializeWorkspace` segue reescrevendo o `protocol.md` e zerando as decisões de um projeto em DRAFT
  quando se replaneja no mesmo caminho; desde a linha 5 só o protocolo travado é protegido.
- (linha 5) `plan_research_protocol` registra a linha no SQLite antes do `initializeWorkspace`; quando a
  re-inicialização é recusada, a linha nova fica no banco.
- (linha 5) `data_mining/caju_beverages` (protocol.md `[LOCKED]`, sem `project_state.json`) é o único projeto do
  repositório que perdeu a busca com a trava só pelo estado; `plan_research_protocol` também recusa o caminho dele.
- (linha 6) A `absorb_methodology` não remove entrada. As duas duplicatas da declaração conjunta de 2025
  (`position-statement-ia-sintese-2025` e `declaracao-conjunta-ia-sintese-evidencia`) foram apagadas editando o
  arquivo, com autorização do Vicente em 12/11/2026; o catálogo tem 106 entradas.
- (linha 7) Os `protocol_template.md` dos métodos têm a F0.2 com campos próprios (`[TBD]`), e nenhum código os lê
  para gerar o protocolo; o auditor confere a linha `**Registro:**` do protocolo que o `project_init` gera.
- (linha 7) O servidor do ReviewBR aberto antes do build de 12/11 segue com o texto antigo (registro
  "OBRIGATÓRIO") até ser reiniciado.
- (linha 8) As 106 entradas do catálogo estão sem `read_at`: o `MAPA.md` mostra `[sem data]` em todas.
- (linha 8) Nenhuma tool lê o `MAPA.md`: o `assess_research_design` sugere o método pelos que servem ao tipo
  (`serves_research_types`), não pelo mapa.
- (linha 8) Pedido do Vicente em 12/11/2026, para verificar depois de finalizar a fila. (1) Antes de sugerir uma
  metodologia ao pesquisador, o sistema confere na fonte oficial se ela mudou desde a data de leitura (`read_at`).
  Isso muda a decisão de 09/10/2026 (DEBT-010), que conferia a obsolescência só quando o maintainer roda; a
  mudança foi decidida por ele em 12/11/2026. (2) A `absorb_methodology` grava os passos de cada metodologia e o
  mapa os mostra, para a tool que sugere informar os passos ao pesquisador ou ao projeto. A regeneração do mapa a
  cada uso da tool já é da linha 8. Em aberto: quem confere a fonte (tool ou `designer`) e o que fazer se ela não
  abrir; se os passos são resumo com ponteiro ou lista completa ("metodologia se aponta, não se copia"); a data de
  leitura das 106 entradas. Origem: "absorb_methodology deve manter o catalogo atualizado sempre que for
  utilizado. verificar se a metodologia escolhida sofreu alteracoes ou atualizacoes antes de ser sugerida. Essa
  tool também deve ficar responsável por detalhar o mapa (…)"; "se nao teve duplicidade muda-se a decisao de 09/10".
- (linha 9) Nenhuma tool do `registry/ai_use.ts` tem a categoria C5 ("não aceitável"); a síntese entre estudos (F7)
  está com o agente `analyst`, que o mapa de uso de IA não cobre.
