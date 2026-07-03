---
name: extraction-form
description: Procedimento de extração de dados por estudo (fase F5). Use ao extrair dados estruturados dos estudos incluídos para a tabela de características, com todos os campos obrigatórios e rastreio de origem. Carregada pelo agente extractor.
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
