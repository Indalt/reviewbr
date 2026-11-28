---
name: evidence-reading
description: Procedimento de leitura orientada a objetivo sobre o corpus curado (fase F5.5, RAG). Use ao ler em profundidade os textos completos incluídos para responder às perguntas de pesquisa com evidência citada e rastreável a estudo e página. Carregada pelo coordenador (skill conduct-review) na F5.5.
---

# Evidence Reading — leitura/RAG orientada aos objetivos

Coletar e triar não é ler. Esta fase usa o corpus curado para **responder às perguntas do projeto** — com evidência ancorada, nunca com conhecimento próprio da IA.

## Fluxo
1. **Indexar**: `rag_index_corpus` → `<projeto>/rag/index.json` (retriever léxico BM25). Indexa arquivos **`.txt`/`.md`** — se só houver PDFs, extraia o texto antes (a tool reporta os PDFs como `skipped`). Proveniência de cada trecho (RV-08) vem de um sidecar `<arquivo>.meta.json` (`{study_id, fonte_repositorio, url_hospedagem}`) ou do match com `03_screening/included.json`. Confira `missingProvenance` no retorno — trechos sem origem não podem ser citados — e `semPagina`, os estudos cujo texto foi gravado sem marca de página.
2. **Decompor objetivos**: pegue F0.3 (justificativa/lacuna) e F1.1 (questão principal + secundárias) do `protocol.md` e quebre em subperguntas concretas e verificáveis.
3. **Recuperar + ler**: para cada subpergunta, `rag_query` (top-k). A tool recupera; **você** julga relevância e sintetiza.
4. **Redigir** `04_extraction/evidence_synthesis.md`: matriz **objetivo → evidência → estudo(s)**, cada afirmação com citação `[study_id, p.X]`, com X tirado do campo `page` do trecho que o `rag_query` devolveu. Trecho com `page: null` se cita `[study_id, seção "<section>", p. não registrada]` — nunca deduza o número.

## Regras anti-alucinação (críticas)
- **Nada sem âncora**: toda afirmação precisa de um trecho recuperado com origem. Sem trecho → não afirme.
- **Lacuna = `[TBD]`** explícito (RV-03): onde o corpus não responde, diga que não responde — não preencha com conhecimento externo.
- Não faça busca externa nova: a F2 já fechou (o caminho é a emenda com `reabrir: "F2"`), e a busca fora da trilha é do agente `scout`.
- Distinga o que os autores afirmam do que você infere; marque inferências.

## Saída
`evidence_synthesis.md` com: por objetivo, a resposta sintetizada + estudos que a sustentam (com página), e um mapa de cobertura (objetivos respondidos × `[TBD]`). Alimenta a síntese da F7 (skill `synthesis-manuscript`).

## Execução da etapa F5.5

Procedimento que o coordenador (skill `conduct-review`) executa na F5.5. Até 28/11/2026 era o agente `reader`; ele se fundiu no coordenador (linha 25 da FILA, Hipótese A). O que separa esta etapa das outras é a trava de etapa no código (linhas 24 e 25): as tools da etapa recusam fora da ordem da trilha, com decisão de etapa faltando, com insumo mudado ou passado pelo chamador.

- Se só houver PDFs em `03_screening/pdfs/` (texto ainda não extraído), **pare e diga ao pesquisador**: a extração de
  texto é da F4.3 (`download_and_extract_pdfs`), que já fechou — o caminho é a emenda com `reabrir: "F4"`. Seguir em
  frente produz um índice de zero trechos que parece lacuna do corpus, não falha de procedimento.
- **Limite:** o `evidence_synthesis.md` é escrito pelo agente; a trava da etapa só existe quando o `rag_index_corpus`
  é chamado.

### Ao fechar a etapa
Mostre ao pesquisador: o caminho de `evidence_synthesis.md`, a cobertura dos objetivos (respondidos × `[TBD]`), os
estudos mais citados e o porquê da etapa.
