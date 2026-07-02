---
name: evidence-reading
description: Procedimento de leitura orientada a objetivo sobre o corpus curado (fase F5.5, RAG). Use ao ler em profundidade os textos completos incluídos para responder às perguntas de pesquisa com evidência citada e rastreável a estudo e página. Carregada pelo agente reader.
---

# Evidence Reading — leitura/RAG orientada aos objetivos

Coletar e triar não é ler. Esta fase usa o corpus curado para **responder às perguntas do projeto** — com evidência ancorada, nunca com conhecimento próprio da IA.

## Fluxo
1. **Indexar**: `rag_index_corpus` → `<projeto>/rag/index.json` (retriever léxico BM25). Indexa arquivos **`.txt`/`.md`** — se só houver PDFs, extraia o texto antes (a tool reporta os PDFs como `skipped`). Proveniência de cada trecho (RV-08) vem de um sidecar `<arquivo>.meta.json` (`{study_id, fonte_repositorio, url_hospedagem}`) ou do match com `03_screening/included.json`. Confira `missingProvenance` no retorno — trechos sem origem não podem ser citados.
2. **Decompor objetivos**: pegue F0.3 (justificativa/lacuna) e F1.1 (questão principal + secundárias) do `protocol.md` e quebre em subperguntas concretas e verificáveis.
3. **Recuperar + ler**: para cada subpergunta, `rag_query` (top-k). A tool recupera; **você** julga relevância e sintetiza.
4. **Redigir** `04_extraction/evidence_synthesis.md`: matriz **objetivo → evidência → estudo(s)**, cada afirmação com citação `[study_id, p.X]`.

## Regras anti-alucinação (críticas)
- **Nada sem âncora**: toda afirmação precisa de um trecho recuperado com origem. Sem trecho → não afirme.
- **Lacuna = `[TBD]`** explícito (RV-03): onde o corpus não responde, diga que não responde — não preencha com conhecimento externo.
- Não faça busca externa nova (isso é do `librarian`/`scout`).
- Distinga o que os autores afirmam do que você infere; marque inferências.

## Saída
`evidence_synthesis.md` com: por objetivo, a resposta sintetizada + estudos que a sustentam (com página), e um mapa de cobertura (objetivos respondidos × `[TBD]`). Alimenta a síntese do `analyst` (F7).
