---
name: screening-rules
description: Procedimento de deduplicação e triagem (fases F3/F4). Use ao deduplicar e decidir inclusão/exclusão de registros com critérios do protocolo, convenção de motivos de exclusão (EX-01..EX-11, atribuídos pelo pesquisador — nenhuma tool grava o código) e regra de saturação. Carregada pelo coordenador (skill conduct-review) na F3 e na F4.
---

# Screening Rules — deduplicação e triagem rigorosas

## F3 — Deduplicação (hierarquia)
O `deduplicate_dataset` aplica, nesta ordem:
1. DOI ou Handle idêntico (sem o resolvedor `https://doi.org/`, sem `doi:`, sem caixa) → remove.
2. Título normalizado idêntico (acento transliterado) **e mesmo ano** → remove.
3. Título normalizado + sobrenome do 1º autor, **quando um dos dois registros não tem ano** → remove.
4. Similaridade de título ≥ 0,90 (Dice sobre bigramas) + mesmo ano → **só sinaliza** o par; os dois ficam.

Dois registros com DOIs diferentes nunca se juntam pelo título. O rastro de cada remoção (ID mantido, ID removido,
critério, fontes) vai para `02_deduplicated/dedupe_pairs.json`; os pares sinalizados, para `pares_sinalizados` em
`dedupe_report.json`. Cada par sinalizado é decisão do pesquisador (RV-04): apresente a lista, não resolva por ele.

## F4 — Triagem (duas fases)
- **F4.1 Título/Resumo** e **F4.2 Texto completo**. O método pede para cada exclusão um **motivo padronizado** derivado dos
  critérios F1.3 (tabela abaixo). **Nenhuma tool atribui, grava ou agrega esse código**: o `screen_candidates` guarda o
  motivo em texto livre (`reasoning`). Atribuir o código e montar a tabela de frequências (F4.1.4, F4.2.4) é do
  pesquisador, sem conferência do sistema — [NÃO COBERTO] (DEBT-026).

| Código | Motivo | Origem |
|---|---|---|
| EX-01 | Fora do escopo — P | F1.3.2.1 |
| EX-02 | Intervenção não elegível — I | F1.3.1.2 |
| EX-03 | Desfecho não reportado — O | F1.3.1.3 |
| EX-04 | Tipo de estudo inelegível — S | F1.3.1.4 |
| EX-05 | Tipo de documento inelegível | F1.3.2.2 |
| EX-06 | Período fora do recorte | F1.3.2.3 |
| EX-07 | Idioma não elegível | F1.3.2.4 |
| EX-08 | Texto completo indisponível | F1.3.2.6 |
| EX-09 | Duplicata não capturada | F1.3.2.5 |
| EX-10 | Qualidade insuficiente | F1.3.2.7 |
| EX-11 | Outro (descrição obrigatória) | — |

Full-text não recuperado (F4.2.2): registre por registro com motivo — entra em `fulltext_not_retrieved` no funil. Com
revisores humanos, quem grava `03_screening/fulltext_not_retrieved.json` é o `record_screening_decisions` (`gerar` do
texto completo), a partir do "conseguiu ler o texto completo?"; o `screen_candidates` não o grava.

**Camada por palavras antes da leitura humana** (quando o protocolo a declara): é o `batch_keyword_screen` sobre os
registros do projeto (com `projectPath`, sem `pdfDir`). Os termos são os do protocolo, sem mudar nada, e a tool confere
cada um no `protocol.md`. Passa o registro com ao menos um termo no título, no resumo ou nas palavras-chave — as do
registro e as que o `complete_record_keywords` completou pela fonte em `02_deduplicated/palavras_chave.json` —, e todo
registro com o resumo vazio. Curinga `*` só no fim; termo sem `*` é a palavra inteira; sem diferença de maiúscula nem de
acento. Grava `03_screening/passed_keywords.json` (insumo da leitura por título e resumo), `excluded_keywords.json` (o
`compute_flow_counts` os soma aos excluídos na triagem, com as duas parcelas) e `keywords_report.json` (termos, regra,
contagens por fonte e a conferência passados + excluídos = entrada). Regravar exige a autorização do pesquisador.

## Processo de triagem — método, não menu de ferramenta
A triagem depende do **método declarado no protocolo**, não do software. Antes de triar, leia do `protocol.md` e **obedeça**:

- **F4.1.2 Processo de triagem** — Individual | Duplo independente | Duplo com desempate. Define *quantos* aplicam os critérios a cada registro e *se* trabalham sem ver a decisão do outro.
- **F4.1.3 Ferramenta utilizada** — que sistema executa. É detalhe de execução: **nenhuma ferramenta torna a triagem mais ou menos publicável**.
- **Resolução de discordâncias** — como as divergências se resolvem (ou "não se aplica").

O gate do protocolo (`submit_protocol_for_approval`) **reprova** se os três não estiverem preenchidos: um protocolo travado sem eles permitiria escolher o método depois de ver os registros. Se o protocolo divergir do que você for executar, **pare e avise** — o protocolo manda (RV-01).

**Revisores humanos — `record_screening_decisions`** (quando o protocolo manda que pessoas decidam; padrão das fontes
oficiais lidas em 23/11/2026: PRISMA 2020 itens 8 e 16a, PRISMA-ScR itens 9 e 14, JBI 2024 10.2.6, Cochrane 6.5.1 4.6.4):
1. Antes, a procedência dos links é conferida (`verify_record_links`). O link que não confere ou não abre vai
   para `03_screening/revisores/falhas_procedencia.json` como limitação registrada (decisão do Vicente de 26/11/2026):
   o registro entra na planilha como os outros, com a situação à vista, e as contagens vão ao relatório do estágio.
2. `formulario`: uma planilha `.xlsx` por revisor, todas com o insumo inteiro do estágio; as perguntas copiadas do
   protocolo (a tool confere). No título e resumo, cada pergunta admite sim, não ou dúvida (dúvida exige observação);
   no texto completo, sim ou não, depois de "conseguiu ler o texto completo?".
3. `importar`: grava, por registro e revisor, as respostas e a decisão que sai delas por regra fixa — um "não" exclui;
   sem "não", segue (no título e resumo) ou inclui (no texto completo); "conseguiu ler?" não = não recuperado. O "não" no
   link fica registrado e não decide nada: com ele, a pergunta em branco conta como dúvida no título e resumo; no texto
   completo, sem "conseguiu ler?", o registro é não recuperado.
4. `consenso`: a planilha só das divergências; o resultado, o motivo e quem decidiu (consenso ou o pesquisador).
5. `gerar`: os artefatos do funil (no texto completo, também `fulltext_not_retrieved.json`) e o relatório, com a
   limitação de procedência para o relato; recusa enquanto houver revisor faltando, registro fora de planilha ou
   divergência sem consenso.

Limites declarados: o sistema não garante a independência entre os revisores (não separa usuários; o relato diz como
foi feita); a trava das colunas da planilha evita edição acidental, e a importação confere pelo id, pelo hash do insumo
e pela linha de controle, não pelo que uma célula travada mostra. Nenhuma IA propõe nem decide nessas planilhas.


## MAYBE — dúvida declarada, não inclusão
`MAYBE` entra no conjunto de incluídos, e isso é **declarado**: `screen_candidates` responde a
composição (quantos SIM, quantos MAYBE) e cada registro carrega `decision` no artefato, então o
número dá para recontar do disco.

- **F4.1 (título/resumo)** — "não dá para saber pelo resumo" é a resposta **certa**: segue para
  texto completo, onde se decide. Não force SIM nem NÃO para zerar a coluna.
- **F4.2 (texto completo)** — MAYBE que sobra é estudo **indeciso dentro dos incluídos finais**,
  e o funil o contaria como decisão. Resolva cada um antes de fechar a F4: incluir, ou excluir
  com motivo `EX-01..EX-11`. **A decisão é do pesquisador** (RV-04) — apresente a lista, não
  resolva por ele.

## Saturação (stopping rule)
Após cada batch de `screen_candidates`, chame `get_screening_report` com `projectPath` (e `stage`): ele lê a triagem
gravada em `03_screening/`, na ordem do insumo do estágio (DEBT-021). Se `saturationAlert:true` (últimos 3 batches <5% de novos relevantes), apresente os números e pergunte se encerra. **A decisão de parar é do pesquisador** (RV-04), nunca automática. Se cobertura de alguma fonte <50%, avise a lacuna.

## Artefatos canônicos que você DEVE gravar (para o funil emergir — RV-02)
O `compute_flow_counts` conta estes arrays JSON. Grave-os com estes nomes exatos:
- `02_deduplicated/dataset.json` — registros após dedup.
- `03_screening/excluded_ta.json` — exclusões na fase Título/Resumo.
- `03_screening/fulltext_not_retrieved.json` — não recuperados (com motivo).
- `03_screening/excluded_fulltext.json` — exclusões na fase texto completo.
- `03_screening/included.json` — incluídos finais (usado como checagem cruzada).

## Justificativa por decisão
Registro aceito/rejeitado carrega a **justificativa textual real** (não só "SIM/NÃO") e o modelo LLM usado, quando triagem automatizada (auditoria).

## Execução das etapas F3 e F4

Procedimento que o coordenador (skill `conduct-review`) executa na F3 e na F4. Até 28/11/2026 era o agente `screener`; ele se fundiu no coordenador (linha 25 da FILA, Hipótese A). O que separa esta etapa das outras é a trava de etapa no código (linhas 24 e 25): as tools da etapa recusam fora da ordem da trilha, com decisão de etapa faltando, com insumo mudado ou passado pelo chamador.

1. **F3** com `deduplicate_dataset` (hierarquia acima). Grava `02_deduplicated/dataset.json` e o relatório de pares.
2. **F4.1 Título/Resumo**, **conforme o processo declarado no protocolo** — leia de lá o **F4.1.2** (Individual |
   Duplo independente | Duplo com desempate), o **F4.1.3** (ferramenta) e a resolução de discordâncias — e conforme as
   decisões de etapa gravadas na trava (quem decide a triagem, quantos revisores, camada por palavras): a tool recusa
   o que a decisão gravada recusa. Não pergunte "qual tool?" — se o protocolo estiver omisso, pergunte qual processo
   ele declara, e pare se não declarar nenhum (RV-01).
   - **Palavras-chave que faltam** aos registros deduplicados: `complete_record_keywords`, antes da camada por
     palavras (consulta a fonte pelo id e grava à parte, sem mudar o dataset nem os totais).
   - **Camada por palavras** (quando o protocolo a declara): `batch_keyword_screen` com `projectPath` e sem `pdfDir`,
     com os termos copiados do protocolo sem mudar nada.
   - **Procedência dos links**, antes da leitura humana: `verify_record_links`; o que não confere ou não abre é
     limitação registrada e vai à planilha com a situação à vista. Existência e retratação dos registros do insumo:
     `verify_references` com `origem: "estagio"` (mostra e grava, não exclui ninguém).
   - **Revisores humanos**: `record_screening_decisions` (`formulario`, `pendentes`, `importar`, `consenso`,
     `gerar`), como descrito acima. Nenhuma IA propõe nem decide.
3. **F4.3 Texto completo** dos que passaram no título e resumo (era do agente `librarian`): acesso aberto primeiro,
   `retrieve_fulltexts` (Unpaywall/OA) e `download_and_extract_pdfs`, guardando em `03_screening/pdfs/` (e o texto em
   `04_extraction/fulltext/`, que a leitura da F5.5 indexa). **Sci-Hub / BYOS é desligado por padrão**: quando um
   artigo não vier por acesso aberto, **pare e pergunte** ao pesquisador se aciona o Sci-Hub para aquele item; só com o
   sim explícito dele use `retrieve_fulltext_byos`, passando a resposta nas palavras dele em `consentimento` (a tool
   recusa sem ela e recusa DOI fora de `03_screening/fulltext_not_retrieved.json`). Registre a forma de aquisição de
   cada texto (OA ou BYOS), separável no log. As cinco tools da F4 que eram do `librarian` (`complete_record_keywords`,
   `verify_record_links`, `retrieve_fulltexts`, `download_and_extract_pdfs`, `retrieve_fulltext_byos`) pertencem à
   etapa na trilha (linha 25): recusam antes de a F3 fechar e depois que a F5 começa — texto que faltar depois disso é
   emenda com `reabrir: "F4"`.
4. **F4.2 Texto completo**: sobre os recuperados. Registre os não recuperados com motivo (F4.2.2). O artefato que
   fecha a etapa é `03_screening/included.json`.
5. **MAYBE** é dúvida declarada, não inclusão; o que sobra na F4.2 vai ao pesquisador para incluir ou excluir com
   motivo (RV-04). **Saturação**: depois de cada lote, `get_screening_report` com `projectPath`; com
   `saturationAlert: true`, mostre os números ao pesquisador — parar é decisão dele.

### Nesta etapa, não
- Não faça busca nova: a F2 já fechou e as tools dela recusam; o caminho é a emenda com `reabrir: "F2"`.
- Não invente contagens de fluxo: elas vêm de `compute_flow_counts` (RV-02).

### Ao fechar a etapa
Mostre ao pesquisador: total deduplicado, excluídos no título e resumo por motivo, incluídos para o texto completo,
recuperados e não recuperados (OA × BYOS), incluídos finais, saturação e o porquê da etapa.
