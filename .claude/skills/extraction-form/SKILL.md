---
name: extraction-form
description: Procedimento de extração de dados por estudo (fase F5). Use ao extrair dados estruturados dos estudos incluídos para a tabela de características, com todos os campos obrigatórios e rastreio de origem. Carregada pelo coordenador (skill conduct-review) na F5.
---

# Extraction Form — formulário de extração por estudo

Um formulário por estudo incluído. Piloto antes do uso em massa (F5.1.1).

## Colunas obrigatórias de `04_extraction/study_characteristics_table.csv`
`study_id, referencia_completa, ano, tipo_documento, fonte_repositorio, instituicao_origem, url_hospedagem, doi_ou_handle, idioma, pais_contexto, delineamento, amostra, medida_primaria, resultado_principal, conclusao_autores, limitacoes, financiamento, conflito_interesses, disponibilidade_dados, nota_resumo_escopo`

(o cabeçalho exato vem do template do método: `study_characteristics_table.template.csv`)

## Regras
- **RV-08 (inviolável)**: `fonte_repositorio`, `instituicao_origem`, `url_hospedagem` obrigatórios em cada linha. Faltando → `[TBD]` e sinalizar; a síntese fica bloqueada até resolver.
- **RV-03**: campo sem dado no texto = `[TBD]`, nunca inventado ou estimado.
- Registre o **modelo LLM** usado e a **data** de extração (auditoria).
- `study_id` gerado pelo sistema (ex.: `S001`), estável.

## Elementos por estudo (F5.2, resumo)
Identificação (referência, origem, tipo, país, idioma), características metodológicas (delineamento, n, instrumento), elementos PICOS/PCC do estudo, resultados/conclusões, e administrativos (financiamento, conflito, disponibilidade de dados). Detalhe item a item em `spec.md` F5.2.

## Traduções
`translate_document` só gera **texto de apoio**. Tradução NÃO integra o protocolo nem substitui o original para citação/análise.

## Execução da etapa F5

Procedimento que o coordenador (skill `conduct-review`) executa na F5. Até 28/11/2026 era o agente `extractor`; ele se fundiu no coordenador (linha 25 da FILA, Hipótese A). O que separa esta etapa das outras é a trava de etapa no código (linhas 24 e 25): as tools da etapa recusam fora da ordem da trilha, com decisão de etapa faltando, com insumo mudado ou passado pelo chamador.

1. Para cada estudo em `03_screening/included.json`, extraia os campos de F5.2 com `batch_llm_extract` sobre o texto
   completo. Com o projeto travado, a tool confere a ordem (a F4 fechada) e o insumo.
2. Escreva `04_extraction/study_characteristics_table.csv` seguindo exatamente o cabeçalho do template do método.
3. `batch_keyword_screen` no modo PDF (com `pdfDir`) só **localiza passagens** nos textos já incluídos para orientar a
   extração; não grava artefato do funil e não decide inclusão. O modo dos registros é da F4 e recusa aqui.

**Limite:** a tabela escrita pelo agente sem `batch_llm_extract` não passa por trava nenhuma: a trava da etapa só
existe quando uma tool dela é chamada.

### Nesta etapa, não
- Não faça julgamento de risco de viés nem síntese (F6/F7, skill `synthesis-manuscript`).
- Não altere decisões de inclusão (F4, fechada).

### Ao fechar a etapa
Mostre ao pesquisador: nº de estudos extraídos, o caminho do CSV, os campos `[TBD]` e os estudos sem origem completa
(RV-08), e o porquê da etapa.
