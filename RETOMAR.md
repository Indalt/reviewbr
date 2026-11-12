# RETOMAR — FILA linha 8 (H), 12/11/2026

Parado em ~80% da janela de 5 h (regra do CLAUDE.md global).

Feito e commitado:
- item 1 (DEBT-045, commit fe53fb8): números de item do PRISMA 2020 corrigidos na spec do prisma-sr, sem remapear.
- item 3 (commit 36e687a): check_standard_coverage diz que o mapeamento é do sistema e o relato é o formulário oficial.
- item 5 (commit seguinte a 36e687a): catálogo com `read_at` (obrigatória em entrada nova); o protocolo grava
  método, fonte e data (`MethodologyCatalogService.fonteDoMetodo`). Teste: tests/data_de_leitura.test.ts.
- itens 2 e 4: nada a fazer (DEBT-014 fechado na linha 4; divergencias_prisma_s.md fica como está).

Falta:
- item 6: mapa de uma página GERADO do catálogo (uma linha por metodologia: nome, quando usar, fonte, data de
  leitura). Sugestão: função em methodology_catalog.ts que escreve .claude/catalog/MAPA.md, chamada pelo
  CatalogWriter.absorver depois de gravar; teste que confere que o MAPA.md do repositório é igual ao gerado.
- item 7: maintainer.md — assimilação em dois passos (fonte oficial; entrada no catálogo com a data); a leitura
  documentada deixa de ser exigida para norma nova.
- fechar: npm run build, npx vitest run (PowerShell, em reviewbr/reviewbr-mcp), audit válido
  (node .claude/maintenance/sessao_2a/le_audit.mjs), marcar a linha 8 na FILA com data e commit, commit e push,
  apagar este RETOMAR.md.

Próximo comando, em chat novo: "Faça a linha 8 da .claude/maintenance/FILA.md a partir do RETOMAR.md."
