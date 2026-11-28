# O que foi para `old/` — e onde achar no git

`old/` fica fora do git (`.gitignore`). Esta lista é rastreada para que nada do que saiu dali seja esquecido. Origem:
linha 20 da `.claude/maintenance/FILA.md`, decisão do Vicente de 26/11/2026 ("pode mover para old mas sem esquecer que
existem"). Movido em 27/11/2026 para `C:\reviewbr\old\legado_2026-11-27\`, com o mesmo caminho relativo à raiz.

Para recuperar uma coisa pelo git: `git show <commit>:<caminho>` (o commit é o último em que o arquivo estava). Mover
não tira nada do histórico público do repositório.

## Por que saiu

- **Código Go do prismAId** (`reviewbr/*.go`, `go.mod`, `go.sum`, e as pastas `cmd/`, `conversion/`, `download/`, `init/`,
  `review/`, `screening/`, `sharedlib/`, que só tinham Go): nenhuma tool do servidor (`reviewbr/reviewbr-mcp/`) chama
  código Go. O crédito ao prismAId segue no `reviewbr/README.md` e no `reviewbr/CITATION.cff`; a licença do ReviewBR
  inteiro é a AGPL-3.0 (`reviewbr/LICENSE`), também nos `package.json` desde a mesma linha. Ficaram em `reviewbr/`:
  documentação, figuras, `.github/`, `test.sh`, `tika-service.sh`, o `prismaid.exe` (fora do git) e o PDF de
  `download/` (fora do git): não são Go, e a decisão não os alcança.
- **`reviewbr/reviewbr-mcp/src/index.ts.tmp`**: cópia solta do `index.ts`, sem uso.
- **`reviewbr/reviewbr-mcp/src/run_search_pubmed.ts` e `run_search_repository.ts`**: scripts com projeto e busca fixos
  num tema, que nada importava (DEBT-103). Foram junto os compilados deles em `dist/` (fora do git).
- **`reviewbr-web/`**: a interface web; não acompanhou o servidor desde março de 2026 (`GUIA.md`). Foi a pasta
  inteira, com `node_modules/` e `.next/` (fora do git).

## Fora do git, sem commit

| caminho | o que é |
|---|---|
| `antigravity_conversas_export/` | export das conversas do Antigravity; nunca esteve no git |
| `claude-20261002T101131Z-1-001.zip` | o `.zip` de ~150 MB da raiz; nunca esteve no git |
| `reviewbr/reviewbr-mcp/dist/run_search_pubmed.*` e `run_search_repository.*` | compilados dos dois scripts acima |

## Rastreados: caminho e último commit em que estavam

| caminho | último commit (data) |
|---|---|
| `reviewbr/cmd/main.go` | `f2b0349` (2026-02-19) |
| `reviewbr/cmd/main_test.go` | `f2b0349` (2026-02-19) |
| `reviewbr/conversion/doc.go` | `f2b0349` (2026-02-19) |
| `reviewbr/conversion/doc/docx2txt.go` | `f2b0349` (2026-02-19) |
| `reviewbr/conversion/doc/docx2txt_test.go` | `f2b0349` (2026-02-19) |
| `reviewbr/conversion/html/html2txt.go` | `f2b0349` (2026-02-19) |
| `reviewbr/conversion/html/html2txt_test.go` | `f2b0349` (2026-02-19) |
| `reviewbr/conversion/logic.go` | `f2b0349` (2026-02-19) |
| `reviewbr/conversion/logic_test.go` | `f2b0349` (2026-02-19) |
| `reviewbr/conversion/ocr/tika.go` | `f2b0349` (2026-02-19) |
| `reviewbr/conversion/ocr/tika_test.go` | `f2b0349` (2026-02-19) |
| `reviewbr/conversion/pdf/pdf2txt.go` | `f2b0349` (2026-02-19) |
| `reviewbr/conversion/pdf/pdf2txt_test.go` | `f2b0349` (2026-02-19) |
| `reviewbr/doc.go` | `f2b0349` (2026-02-19) |
| `reviewbr/download/list/doc.go` | `f2b0349` (2026-02-19) |
| `reviewbr/download/list/url_list.go` | `4c58caa` (2026-07-02) |
| `reviewbr/download/list/url_list_test.go` | `f2b0349` (2026-02-19) |
| `reviewbr/download/zotero/api.go` | `f2b0349` (2026-02-19) |
| `reviewbr/download/zotero/api_test.go` | `f2b0349` (2026-02-19) |
| `reviewbr/download/zotero/doc.go` | `f2b0349` (2026-02-19) |
| `reviewbr/init/doc.go` | `f2b0349` (2026-02-19) |
| `reviewbr/init/terminal.go` | `f2b0349` (2026-02-19) |
| `reviewbr/init/terminal_test.go` | `f2b0349` (2026-02-19) |
| `reviewbr/prismAId.go` | `f2b0349` (2026-02-19) |
| `reviewbr/prismAId_test.go` | `f2b0349` (2026-02-19) |
| `reviewbr/review/config/configuration.go` | `f2b0349` (2026-02-19) |
| `reviewbr/review/config/configuration_test.go` | `f2b0349` (2026-02-19) |
| `reviewbr/review/config/doc.go` | `f2b0349` (2026-02-19) |
| `reviewbr/review/debug/doc.go` | `f2b0349` (2026-02-19) |
| `reviewbr/review/debug/duplicate.go` | `f2b0349` (2026-02-19) |
| `reviewbr/review/debug/duplicate_test.go` | `f2b0349` (2026-02-19) |
| `reviewbr/review/logic/doc.go` | `f2b0349` (2026-02-19) |
| `reviewbr/review/logic/review_logic.go` | `f2b0349` (2026-02-19) |
| `reviewbr/review/logic/review_logic_test.go` | `f2b0349` (2026-02-19) |
| `reviewbr/review/prompt/doc.go` | `f2b0349` (2026-02-19) |
| `reviewbr/review/prompt/generator.go` | `f2b0349` (2026-02-19) |
| `reviewbr/review/prompt/generator_test.go` | `f2b0349` (2026-02-19) |
| `reviewbr/review/results/csv.go` | `f2b0349` (2026-02-19) |
| `reviewbr/review/results/csv_test.go` | `f2b0349` (2026-02-19) |
| `reviewbr/review/results/doc.go` | `f2b0349` (2026-02-19) |
| `reviewbr/review/results/json.go` | `f2b0349` (2026-02-19) |
| `reviewbr/review/results/json_test.go` | `f2b0349` (2026-02-19) |
| `reviewbr/review/results/save.go` | `f2b0349` (2026-02-19) |
| `reviewbr/review/results/save_test.go` | `f2b0349` (2026-02-19) |
| `reviewbr/screening/filters/article_type.go` | `f2b0349` (2026-02-19) |
| `reviewbr/screening/filters/article_type_test.go` | `f2b0349` (2026-02-19) |
| `reviewbr/screening/filters/deduplication.go` | `f2b0349` (2026-02-19) |
| `reviewbr/screening/filters/deduplication_test.go` | `f2b0349` (2026-02-19) |
| `reviewbr/screening/filters/language.go` | `f2b0349` (2026-02-19) |
| `reviewbr/screening/filters/language_test.go` | `f2b0349` (2026-02-19) |
| `reviewbr/screening/filters/topic_relevance.go` | `f2b0349` (2026-02-19) |
| `reviewbr/screening/filters/topic_relevance_test.go` | `f2b0349` (2026-02-19) |
| `reviewbr/screening/logic/screening.go` | `f2b0349` (2026-02-19) |
| `reviewbr/screening/logic/screening_test.go` | `f2b0349` (2026-02-19) |
| `reviewbr/sharedlib/export.go` | `f2b0349` (2026-02-19) |
| `reviewbr/sharedlib/export_test.go` | `f2b0349` (2026-02-19) |
| `reviewbr/go.mod` | `f2b0349` (2026-02-19) |
| `reviewbr/go.sum` | `f2b0349` (2026-02-19) |
| `reviewbr/reviewbr-mcp/src/index.ts.tmp` | `9943f66` (2026-02-26) |
| `reviewbr/reviewbr-mcp/src/run_search_pubmed.ts` | `9943f66` (2026-02-26) |
| `reviewbr/reviewbr-mcp/src/run_search_repository.ts` | `9943f66` (2026-02-26) |
| `reviewbr-web/.gitignore` | `7f4177c` (2026-03-01) |
| `reviewbr-web/README.md` | `7f4177c` (2026-03-01) |
| `reviewbr-web/eslint.config.mjs` | `7f4177c` (2026-03-01) |
| `reviewbr-web/next.config.ts` | `7f4177c` (2026-03-01) |
| `reviewbr-web/package-lock.json` | `7f4177c` (2026-03-01) |
| `reviewbr-web/package.json` | `7f4177c` (2026-03-01) |
| `reviewbr-web/public/file.svg` | `7f4177c` (2026-03-01) |
| `reviewbr-web/public/globe.svg` | `7f4177c` (2026-03-01) |
| `reviewbr-web/public/next.svg` | `7f4177c` (2026-03-01) |
| `reviewbr-web/public/vercel.svg` | `7f4177c` (2026-03-01) |
| `reviewbr-web/public/window.svg` | `7f4177c` (2026-03-01) |
| `reviewbr-web/src/app/(app)/chat/page.tsx` | `7f4177c` (2026-03-01) |
| `reviewbr-web/src/app/(app)/dashboard/page.tsx` | `7f4177c` (2026-03-01) |
| `reviewbr-web/src/app/(app)/layout.tsx` | `7f4177c` (2026-03-01) |
| `reviewbr-web/src/app/(app)/setup/page.tsx` | `7f4177c` (2026-03-01) |
| `reviewbr-web/src/app/api/chat/route.ts` | `a2391e4` (2026-10-29) |
| `reviewbr-web/src/app/api/config/route.ts` | `7f4177c` (2026-03-01) |
| `reviewbr-web/src/app/favicon.ico` | `7f4177c` (2026-03-01) |
| `reviewbr-web/src/app/globals.css` | `7f4177c` (2026-03-01) |
| `reviewbr-web/src/app/layout.tsx` | `7f4177c` (2026-03-01) |
| `reviewbr-web/src/app/page.tsx` | `7f4177c` (2026-03-01) |
| `reviewbr-web/src/lib/llm-providers.ts` | `7f4177c` (2026-03-01) |
| `reviewbr-web/tsconfig.json` | `7f4177c` (2026-03-01) |

## Agentes de etapa (linha 25, 28/11/2026)

Origem: linha 25 da `.claude/maintenance/FILA.md`, ponto 6.4 (Hipótese A), aprovado pelo Vicente em 26/11/2026 ("6.4
ok"; "preferindo a hipotese A se isso nao implicar nos desvios comuns de IA"). Movidos em 28/11/2026 para
`C:\reviewbr\old\agentes_2026-11-28\`, com o mesmo caminho relativo à raiz.

**Por que saíram:** os seis agentes de etapa se fundiram no coordenador (skill `conduct-review`). O procedimento de
cada um foi para a skill da etapa, que o `manifest.json` nomeia em `role`: `designer` → `protocol-design` (skill nova,
com o corpo do agente); `librarian` → `prisma-s-logging` (a aquisição de texto completo foi para a `screening-rules`,
F4.3); `screener` → `screening-rules`; `extractor` → `extraction-form`; `reader` → `evidence-reading`; `analyst` →
`synthesis-manuscript`. Antes de saírem, as sete tools que só a lista `tools:` de um deles prendia entraram na trilha
(commit `2d83e43`). Ficaram em `.claude/agents/`: `scout` (fora da trilha) e `maintainer` (o próprio sistema).

| caminho | último commit que o alterou |
|---|---|
| `.claude/agents/designer.md` | `e25af55` (2026-11-28) |
| `.claude/agents/librarian.md` | `a5a077c` (2026-11-27) |
| `.claude/agents/screener.md` | `e25af55` (2026-11-28) |
| `.claude/agents/extractor.md` | `4a2c082` (2026-11-12) |
| `.claude/agents/reader.md` | `4a2c082` (2026-11-12) |
| `.claude/agents/analyst.md` | `4a2c082` (2026-11-12) |
