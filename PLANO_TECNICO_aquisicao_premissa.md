# Plano Técnico — Premissa de Aquisição e Coleta Máxima no ReviewBR

**Autor:** Coordenador ReviewBR (assistente)
**Data:** 2026-07-12
**Escopo:** transformar o ReviewBR num sistema que (a) coleta o máximo possível de artigos científicos em Ciência Aberta — no mundo e no Brasil — e (b) quando o projeto assim exigir, recupera também material fora da Ciência Aberta (Sci-Hub, Anna's Archive, Internet Archive e afins), **com a premissa decidida no início do planejamento** e a proveniência de cada item registrada de forma separável e auditável.
**Decisões do pesquisador que este plano implementa:** entrega = *plano técnico detalhado*; autonomia = *premissa e nível de coleta selecionáveis por projeto (trilha rigorosa OU coleta exploratória ampla)*; camada não-OA = *premissa do projeto, com registro auditável*.

> **Aviso de escopo deste documento:** é um plano de engenharia (arquitetura, contratos de dados, arquivos e funções a mexer, roadmap). Não altera código ainda. As implicações legais/éticas das fontes não-OA estão tratadas na seção 9.

---

## 1. Como o sistema está construído hoje (diagnóstico)

O ReviewBR é um fork do prismAId com três camadas que já funcionam de forma integrada:

**Camada de orquestração (IA + MCP).** O cérebro é o servidor MCP em TypeScript (`reviewbr/reviewbr-mcp/src/index.ts`, ~2.334 linhas) que expõe as ferramentas de busca, triagem, extração, RAG e gates PRISMA. Acima dele, no cliente (Claude Code), a skill `conduct-review` é o **Coordenador** e os subagentes (`.claude/agents/`: `designer`, `librarian`, `screener`, `extractor`, `reader`, `analyst`, `scout`) executam cada fase F0→F8. O estado da verdade vive **no disco** de cada projeto: `protocol.md`, `project_state.json`, `prisma_flow.json` e logs.

**Camada de dados/fontes.** Buscas globais em OpenAlex, PubMed, Crossref, Semantic Scholar, CORE e Europe PMC; regionais em SciELO e BVS/LILACS; nacionais/institucionais via OAI-PMH em ~100 repositórios brasileiros (OasisBR, BDTD, repositórios universitários), com catálogo próprio e "healer" de repositórios. Os provedores ficam em `reviewbr-mcp/src/services/` (`openalex`, `pubmed`, `crossref`, `semantic_scholar`, `core`, `europe_pmc`, `bvs`, `search.ts`, `universal_provider.ts`, `snowball.ts`).

**Camada de aquisição de texto.** Hoje a recuperação de PDF acontece em dois lugares: (1) a tool `retrieve_fulltexts` / `download_and_extract_pdfs` (index.ts ~889/656) que tenta `pdfUrl` direto → Unpaywall → PDF do repositório; e (2) o **BYOS Sci-Hub** (`retrieve_fulltext_byos`, index.ts ~1480; serviço `scihub_bridge.ts`; plugin `plugins/scihub_extractor.py`), que é **opt-in, item-a-item, nunca automático** e grava proveniência `"Sci-Hub (BYOS)"` num sidecar `.meta.json`.

### 1.1. Onde a premissa "Ciência Aberta" está *hardcoded* hoje

Este é o ponto central do pedido. A Ciência Aberta não é uma escolha de projeto — é uma **diretiva de nível de sistema**, repetida em vários pontos, e o não-OA existe só como exceção manual:

| Lugar | O que diz hoje | Consequência |
|---|---|---|
| `reviewbr-mcp/SYSTEM_PROMPT.md` (§ Diretivas) | "Open Science: proibido usar/sugerir bases com paywall estrutural… Sci-Hub/BYOS é desligado por padrão e NUNCA automático" | O modelo trata OA como lei fixa; não há premissa de projeto. |
| `.claude/agents/librarian.md` | "Acesso aberto primeiro; Sci-Hub só perguntando" — item-a-item | A aquisição não-OA depende de um "sim" humano por artigo, sem plano prévio. |
| `services/project_init.ts` → `getSearchSourcesSection`, `getSearchStrategy`, `getProjectQuestions` | Fontes e estratégia sempre "globais, todas as fontes OA"; `searchScope` está `@deprecated` | O planejamento (F0) **não pergunta** sobre premissa de aquisição nem sobre grau de coleta. |
| `services/scihub_bridge.ts` + `plugins/scihub_extractor.py` | Único caminho não-OA; só Sci-Hub; scraping frágil de `embed/iframe` | Não há Anna's Archive nem Internet Archive; a decisão nunca é "de projeto". |
| `types.ts` / `project_state.ts` | `ProjectState` não tem campo de política de aquisição | Não há onde gravar/auditar a premissa. |

**Conclusão do diagnóstico:** a arquitetura é excelente para rigor e proveniência, mas foi desenhada com a premissa OA *fundida ao sistema*. O pedido exige **promover a premissa a uma dimensão de projeto**, decidida em F0, com a camada não-OA deixando de ser "exceção manual" para virar "política declarada e registrada".

---

## 2. Princípio de design da mudança

Três eixos passam a ser escolhidos **no início do planejamento (fase F0, pelo `designer`)** e gravados em `project_state.json` como fonte da verdade:

1. **`acquisition_policy`** — a premissa de aquisição de texto completo:
   - `open_science_only` (padrão, comportamento atual): só OA; nunca fontes cinzas.
   - `open_first_then_ask`: OA primeiro; se falhar, **pergunta** por item antes de acionar fonte cinza (é o BYOS de hoje, agora generalizado às três fontes).
   - `maximal`: OA primeiro; se falhar, aciona **automaticamente** a cadeia de fontes cinzas na ordem configurada, **registrando a proveniência separável** de cada item (é a opção "premissa do projeto, com registro" escolhida pelo pesquisador).

2. **`collection_mode`** — o grau de autonomia da coleta:
   - `rigorous` (padrão): trilha PRISMA travada, gates RV-01..RV-08, decisões humanas nos pontos-chave. Coleta exaustiva **dentro** da trilha auditável.
   - `exploratory_broad`: trilha do `scout` — varre o máximo (OA + cinza, conforme a política) sem gates, para reunir corpus rápido, à parte da trilha reprodutível.

3. **`gray_sources`** — quais fontes não-OA estão habilitadas e em que ordem (só relevante se `acquisition_policy ≠ open_science_only`): lista ordenada de `unpaywall_plus | scihub | annas_archive | internet_archive`, mais parâmetros (mirrors, timeouts, e-mail de contato para APIs educadas).

Esses três eixos são **ortogonais**: pode-se ter `rigorous` + `maximal` (revisão sistemática que assume aquisição cinza declarada) ou `exploratory_broad` + `open_science_only` (varredura ampla só de OA). Isso satisfaz "os dois, selecionáveis".

**Invariante inegociável:** mudar `acquisition_policy` **depois** do protocolo travado (`[LOCKED]`) é mudança de escopo → exige emenda registrada ou novo projeto (RV-01). A premissa é congelada junto com o protocolo, exatamente como as strings de busca.

---

## 3. Mudança 1 — Premissa e modo de coleta como decisão de F0

### 3.1. Esquema de estado (`services/project_state.ts`)

Estender `ProjectState` (hoje `schemaVersion: 1`) para `schemaVersion: 2`, com migração tolerante (ler v1 e preencher defaults):

```ts
export type AcquisitionPolicy = "open_science_only" | "open_first_then_ask" | "maximal";
export type CollectionMode = "rigorous" | "exploratory_broad";
export type GraySource = "unpaywall_plus" | "scihub" | "annas_archive" | "internet_archive";

export interface AcquisitionConfig {
  policy: AcquisitionPolicy;              // default "open_science_only"
  collectionMode: CollectionMode;         // default "rigorous"
  graySources: GraySource[];              // ordem de fallback; [] se open_science_only
  contactEmail?: string;                  // para Unpaywall/APIs educadas
  lockedAt?: string;                      // congela junto com o protocolo (RV-01)
}

export interface ProjectState {
  schemaVersion: 2;
  // ...campos atuais...
  acquisition: AcquisitionConfig;         // NOVO
}
```

`ProjectStateService.init(...)` recebe `acquisition` (com defaults) e o grava. Adicionar `ProjectStateService.migrateV1toV2()` que injeta `acquisition` default em projetos antigos ao primeiro `read`.

### 3.2. Config e tool de planejamento (`services/project_init.ts` + `index.ts`)

- **`ProjectConfig`**: remover o `@deprecated searchScope` do fluxo principal e adicionar `acquisition?: AcquisitionConfig`.
- **`plan_research_protocol`** (index.ts ~1269): adicionar parâmetros Zod opcionais `acquisitionPolicy`, `collectionMode`, `graySources`, `contactEmail`, todos com default seguro (`open_science_only` / `rigorous` / `[]`). O `designer` os coleta na entrevista de F0.
- **`generateProtocol(...)`**: incluir uma **seção nova no `protocol.md`**, "Premissa de Aquisição e Coleta", que documenta a política escolhida, as fontes cinzas habilitadas (se houver) e uma nota de responsabilidade/proveniência. Essa seção nasce `[DRAFT]` e é congelada em `[LOCKED]`.
- **`getProjectQuestions()`**: acrescentar duas perguntas obrigatórias de F0 (ver 3.4).

### 3.3. Gate de aprovação (`index.ts` → `submit_protocol_for_approval` + `services/protocol_auditor.ts`)

Ao travar o protocolo, gravar `acquisition.lockedAt` no `project_state.json`. O `protocol_auditor` passa a **exigir** que a seção "Premissa de Aquisição" esteja preenchida (não pode ficar `[TBD]`) — assim a premissa vira item auditável de RV-01. Se `acquisition_policy = maximal`, o auditor exige também a nota de responsabilidade preenchida.

### 3.4. Onde o pesquisador decide (agente `designer` + SYSTEM_PROMPT)

Reescrever a diretiva de Open Science no `SYSTEM_PROMPT.md` e em `.claude/agents/designer.md`: de "lei fixa" para "**premissa de projeto perguntada em F0**". O `designer` passa a fazer duas perguntas novas, logo após o tipo de pesquisa:

> **Premissa de aquisição:** este projeto deve trabalhar **só com Ciência Aberta** (padrão), **OA primeiro e perguntar** antes de recorrer a fontes fora do acesso aberto, ou **coleta máxima** (OA primeiro e, no que faltar, recuperar automaticamente via fontes fora do acesso aberto, registrando a origem de cada item)?
>
> **Modo de coleta:** trilha **rigorosa** (PRISMA travado, auditável — padrão) ou **exploratória ampla** (varredura rápida para montar corpus, sem gates)?

Se o pesquisador escolher `maximal` ou `open_first_then_ask`, o `designer` mostra a nota de responsabilidade (seção 9) e pede confirmação explícita antes de gravar.

---

## 4. Mudança 2 — Camada de aquisição unificada com proveniência separável

Hoje a aquisição está espalhada (Unpaywall dentro do handler de `retrieve_fulltexts`, Sci-Hub num bridge à parte). A proposta é um **orquestrador único** que aplica a política do projeto e uma **cadeia de resolvedores** (resolver chain), cada um com proveniência própria.

### 4.1. Novo serviço: `services/acquisition_orchestrator.ts`

Interface de resolvedor (Strategy pattern, espelhando o `scihub_bridge` atual):

```ts
export type AcquisitionMethod =
  | "OA_direct" | "OA_unpaywall" | "OA_repository"
  | "SciHub" | "AnnasArchive" | "InternetArchive";

export interface AcquisitionProvenance {
  study_id: string;
  doi?: string;
  method: AcquisitionMethod;      // COMO foi obtido
  source_label: string;           // rótulo humano p/ PRISMA-S (ex.: "Anna's Archive")
  is_open_access: boolean;        // separa OA de cinza de forma binária e auditável
  url_hospedagem?: string;
  retrievedAt: string;
}

export interface AcquisitionResult {
  success: boolean;
  pdfPath?: string; textPath?: string;
  provenance?: AcquisitionProvenance;
  error?: string;
}

export interface Resolver {
  method: AcquisitionMethod;
  isOpenAccess: boolean;
  tryResolve(item, projectDir, cfg): Promise<AcquisitionResult>;
}
```

O orquestrador recebe a lista de incluídos + o `AcquisitionConfig` do projeto e, para cada item:

1. Roda sempre os resolvedores **OA** primeiro (`OA_direct` → `OA_unpaywall` → `OA_repository`) — refatorando o que já existe em `retrieve_fulltexts`.
2. Se OA falhou, decide pela política:
   - `open_science_only`: marca o item como "sem OA" e **para** (registra no funil como não recuperado).
   - `open_first_then_ask`: devolve ao Coordenador uma lista de "candidatos a fonte cinza" e **pergunta** (o Coordenador chama a tool cinza só após "sim").
   - `maximal`: percorre `graySources` na ordem configurada até um resolver ter sucesso, **automaticamente**.
3. Grava proveniência separável para todo item recuperado: sidecar `<study_id>.meta.json` (já existe no padrão BYOS) **e** uma linha em `logs/acquisition_log.csv` com colunas `study_id, doi, method, source_label, is_open_access, retrievedAt, pdf_path`.

### 4.2. Novos resolvedores (bridges)

- **`services/annas_archive_bridge.ts`** + `plugins/annas_archive_extractor.py`: resolve por DOI/ISBN/título contra `https://annas-archive.gl/` (e mirrors configuráveis). Segue o mesmo contrato do `scihub_bridge`: subprocesso Python, salva PDF em `03_screening/pdfs/`, extrai texto para `04_extraction/fulltext/`, grava `.meta.json` com `source_label: "Anna's Archive"`, `is_open_access: false`. Trata os formatos que Anna's serve (PDF, EPUB → converter via camada Go/Tika já existente quando necessário).
- **`services/internet_archive_bridge.ts`**: usa a **API pública oficial** do Internet Archive (Advanced Search + Metadata + download de itens; `archive.org/advancedsearch.php` e `archive.org/metadata/<id>`). É a fonte não-OA mais "limpa" legalmente (muitos itens são de domínio público / acesso legítimo), então pode ser o **primeiro** da ordem de fallback cinza por padrão. Marca `is_open_access: false` por conservadorismo, mas com `source_label: "Internet Archive"` distinto.
- **Generalizar `scihub_bridge.ts`**: mantê-lo, mas fazer implementar a interface `Resolver` (`method: "SciHub"`). Endurecer o `scihub_extractor.py` (ver 7.2).

### 4.3. Ferramentas MCP novas/alteradas (`index.ts`)

| Tool | Mudança |
|---|---|
| `retrieve_fulltexts` | Refatorar para delegar ao `acquisition_orchestrator`, respeitando `acquisition_policy`. Em `open_science_only`/`rigorous` o comportamento observável fica igual ao de hoje. |
| `acquire_fulltexts` (NOVA, ou renomear) | Ponto único de entrada. Parâmetros: `projectPath`, `datasetPath?`, `onlyIncluded=true`. Lê a política do `project_state.json`; não recebe premissa por parâmetro (a premissa é do projeto, não da chamada) — isso previne "burlar" a premissa travada. |
| `retrieve_fulltext_byos` | Mantida por retrocompatibilidade, mas passa a ser o caminho do modo `open_first_then_ask` e agora aceita `source: scihub|annas_archive|internet_archive`. |
| `get_acquisition_report` (NOVA) | Lê `acquisition_log.csv` e devolve o balanço OA × cinza (quantos por método), para o painel do Coordenador e para o manuscrito. |

### 4.4. Proveniência no funil, no PRISMA-S e no manuscrito

- **`services/flow_computer.ts`** (`compute_flow_counts`, RV-02): passa a contar full-texts **separando** `retrieved_oa` de `retrieved_gray` a partir do `acquisition_log.csv`. O número de incluídos não muda; o que muda é a *transparência* de como o texto foi obtido.
- **`services/methodology_auditor.ts`** (`audit_methodology`, RV-08): valida que todo estudo com full-text tem proveniência com `method` e `is_open_access` preenchidos; sinaliza itens cinzas explicitamente.
- **Manuscrito (`.claude/skills/synthesis-manuscript` + agente `analyst`)**: a seção PRISMA-S de "acesso ao texto completo" passa a reportar, por padrão, "X de N textos completos obtidos via acesso aberto; Y via fontes complementares fora do acesso aberto (Sci-Hub/Anna's Archive/Internet Archive), listadas no apêndice de proveniência". Nunca mistura OA e cinza numa contagem única.

---

## 5. Mudança 3 — Coleta máxima ("faça todo o trabalho")

O pedido "coletar o máximo possível de artigos em ciência aberta no mundo e no Brasil" pede ampliar cobertura e usar melhor a IA. Propostas, em ordem de impacto/custo:

### 5.1. Ampliar fontes de descoberta (OA, alto impacto)

Adicionar provedores em `services/` e tools em `index.ts`, seguindo o padrão dos existentes:

- **BASE** (Bielefeld Academic Search Engine) — maior índice OA por volume; API pública.
- **DOAJ** — periódicos OA revisados por pares.
- **OpenAIRE** — agrega repositórios europeus + ligações a dados/financiamento; forte para rastreabilidade.
- **LA Referencia** e **Redalyc** — cobertura latino-americana complementar ao SciELO (crucial para o eixo Brasil/AL).
- **The Lens** (lens.org) — scholarly + patentes, bom para grafo de citações.
- **Preprints**: arXiv, bioRxiv/medRxiv, SSRN, e **OSF Preprints/Preprints.org** — literatura cinza *aberta* (não confundir com fontes não-OA).
- **Brasil**: além de OasisBR/BDTD, cobrir **Portal de Periódicos CAPES (metadados OA)**, **SciELO Preprints**, e catálogos estaduais quando existirem.

Cada provedor entra também na `getSearchStrategy()` e no bloco de fontes do `protocol.md`.

### 5.2. Snowballing bidirecional e saturação (médio)

`services/snowball.ts` / `expand_search_snowball` hoje é profundidade 1 e ótimo. Ampliar para **forward citations** (quem citou as sementes, via OpenAlex `cited_by`) além de backward (referências), mantendo poda por descritores e teto — já previsto no `librarian.md`. Automatizar a checagem de saturação (`get_screening_report`) para, no modo `maximal`, sugerir parar quando o ganho marginal cai abaixo de um limiar.

### 5.3. Uso de IA para maximizar recall (médio/alto — "com o desenvolvimento das IAs")

- **Expansão/tradução de query dirigida por LLM**: gerar automaticamente sinônimos, termos MeSH/DeCS/Emtree e variações pt/en/es a partir do PICOS travado, propondo strings por base — sempre com *preview* sem gravar (o guardrail atual de "amostragem rápida") antes de oficializar. Não fere RV-07 porque a string derivada é **aprovada pelo pesquisador** antes do lock.
- **Aquisição agêntica via navegador quando a API falha**: para itens sem PDF por API, um sub-passo pode usar o Claude in Chrome (tools `mcp__claude-in-chrome__*`) para resolver landing pages OA que exigem JS — mantendo-se **dentro da política** (só OA, ou cinza conforme premissa).
- **Dedup semântico**: complementar o dedup por DOI+título (`services/dedupe.ts`) com similaridade de embeddings para pegar duplicatas com metadados sujos (comum em OAI-PMH brasileiro).

### 5.4. Modo `exploratory_broad` (o "scout" turbinado)

Formalizar o agente `scout` como a trilha `collection_mode = exploratory_broad`: roda todas as fontes habilitadas (incluindo cinzas, se a política permitir) em paralelo, sem gates, gravando em uma pasta `00_scout/` separada da trilha auditável, com um relatório de cobertura. Serve para "reunir o máximo rápido"; se o pesquisador quiser depois promover a corpus rigoroso, migra-se para a trilha travada (novo protocolo).

---

## 6. Matriz de mudanças por arquivo

| Arquivo | Tipo | O que muda |
|---|---|---|
| `reviewbr-mcp/src/services/project_state.ts` | Alterar | `schemaVersion:2`, `AcquisitionConfig`, migração v1→v2. |
| `reviewbr-mcp/src/services/project_init.ts` | Alterar | `ProjectConfig.acquisition`; seção "Premissa de Aquisição" no `protocol.md`; novas perguntas em `getProjectQuestions`; estratégia/fontes ampliadas. |
| `reviewbr-mcp/src/index.ts` | Alterar | `plan_research_protocol` (params novos); `submit_protocol_for_approval` (congela premissa); `retrieve_fulltexts` (delega ao orquestrador); novas tools `acquire_fulltexts`, `get_acquisition_report`; `retrieve_fulltext_byos` aceita `source`. |
| `reviewbr-mcp/src/services/acquisition_orchestrator.ts` | **Novo** | Cadeia de resolvedores, política, log de proveniência. |
| `reviewbr-mcp/src/services/annas_archive_bridge.ts` | **Novo** | Resolver Anna's Archive. |
| `reviewbr-mcp/src/services/internet_archive_bridge.ts` | **Novo** | Resolver Internet Archive (API oficial). |
| `reviewbr-mcp/src/services/scihub_bridge.ts` | Alterar | Implementar interface `Resolver`; endurecer. |
| `plugins/annas_archive_extractor.py` | **Novo** | Extrator Python de Anna's Archive. |
| `plugins/scihub_extractor.py` | Alterar | Robustez (mirrors dinâmicos, verificação de PDF, TLS). |
| `reviewbr-mcp/src/services/flow_computer.ts` | Alterar | Separar `retrieved_oa`/`retrieved_gray` no funil. |
| `reviewbr-mcp/src/services/methodology_auditor.ts` | Alterar | RV-08 exige `method`+`is_open_access`; sinaliza cinza. |
| `reviewbr-mcp/src/services/protocol_auditor.ts` | Alterar | Exigir seção de premissa preenchida no lock. |
| Provedores novos: `services/base.ts`, `doaj.ts`, `openaire.ts`, `lareferencia.ts`, `redalyc.ts`, `preprints.ts` | **Novos** | Fontes OA adicionais + tools correspondentes. |
| `services/snowball.ts` | Alterar | Forward citations (OpenAlex `cited_by`). |
| `services/dedupe.ts` | Alterar | Dedup semântico opcional. |
| `reviewbr-mcp/SYSTEM_PROMPT.md` | Alterar | Open Science vira *premissa de projeto*, não lei fixa; regras da camada cinza por política. |
| `.claude/agents/designer.md` | Alterar | Perguntar premissa+modo em F0; mostrar nota de responsabilidade. |
| `.claude/agents/librarian.md` | Alterar | Aquisição governada por `acquisition_policy`; três fontes cinzas. |
| `.claude/agents/scout.md` | Alterar | Formalizar `exploratory_broad`. |
| `.claude/methodologies/prisma-sr/spec.md` + `protocol_template.md` | Alterar | Campo de premissa em F0/F1; PRISMA-S separando OA×cinza. |
| `.claude/skills/synthesis-manuscript/SKILL.md` | Alterar | Relato separável OA×cinza + apêndice de proveniência. |
| `reviewbr-web/src/*` | Alterar | UI de F0: seletor de premissa e modo (ver 8). |
| Testes: `*_test.go` / `*.test.ts` | **Novos/alterar** | Cobrir orquestrador, política, migração de estado, proveniência. |

---

## 7. Robustez e segurança das fontes não-OA

### 7.1. Estado atual (frágil)
`plugins/scihub_extractor.py` faz scraping de `embed`/`iframe` em mirrors fixos com `verify=False` (ignora TLS) e `sys.exit(1)` em falha. Funciona, mas quebra fácil quando o mirror muda o HTML, e o `verify=False` é um risco.

### 7.2. Endurecimento proposto
- **Mirrors dinâmicos e configuráveis** por `AcquisitionConfig.graySourcesConfig` (não hardcoded no script).
- **Validação de conteúdo**: conferir *magic bytes* de PDF (`%PDF`) e tamanho mínimo antes de dar sucesso — evita salvar páginas de erro como ".pdf".
- **Retorno estruturado (JSON no stdout)** em vez de `print`+`exit`, para o bridge distinguir "não encontrado" de "erro de rede".
- **TLS**: preferir `verify=True`; só relaxar com flag explícita e aviso registrado no log.
- **Rate limiting / backoff** e *user-agent* honesto onde as fontes pedem (Internet Archive e Unpaywall têm etiqueta de uso; respeitar).
- **Timeouts e isolamento**: cada resolver com timeout próprio; falha de um não derruba o batch (já é o padrão do `retrieve_fulltexts`).

---

## 8. Interface web (reviewbr-web)

Na tela de criação de projeto (F0), adicionar dois seletores logo após "tipo de pesquisa":

- **Premissa de aquisição** (rádio): Ciência Aberta • OA primeiro, perguntar • Coleta máxima.
- **Modo de coleta** (rádio): Rigoroso (PRISMA) • Exploratório amplo.
- Se premissa ≠ Ciência Aberta: expandir um bloco com checkboxes ordenáveis das fontes cinzas (Internet Archive, Anna's Archive, Sci-Hub) + o texto da nota de responsabilidade (seção 9), com um checkbox de "li e assumo a responsabilidade".

Esses valores viram os parâmetros de `plan_research_protocol`. O painel do projeto passa a exibir o balanço OA×cinza vindo de `get_acquisition_report`.

---

## 9. Considerações legais, éticas e de proveniência

Este é o ponto que justifica "a premissa decidida no início": o sistema não deve tratar acesso aberto e fontes cinzas como equivalentes.

- **Legalidade varia por jurisdição e por item.** Sci-Hub e Anna's Archive distribuem, em grande parte, obras protegidas por direitos autorais sem autorização; o Internet Archive hospeda muito material legítimo/domínio público, mas também conteúdo sob disputa. O sistema **não deve** afirmar que qualquer download é legal; deve deixar a decisão e a responsabilidade explícitas com o pesquisador, registradas no protocolo (o checkbox "assumo a responsabilidade" + a nota em `protocol.md`).
- **Transparência científica primeiro.** A separação OA×cinza no PRISMA-S e no manuscrito não é só rigor — é o que permite a um revisor/leitor entender como o corpus foi montado. Nunca esconder a origem cinza numa contagem agregada.
- **Padrão conservador.** O default do sistema permanece `open_science_only`. A camada cinza só existe por escolha ativa e informada, e o Internet Archive (mais defensável) vem antes na ordem sugerida de fallback.
- **Preferir vias legítimas antes de cinza.** A cadeia sempre esgota OA (Unpaywall, repositórios, preprints) e pode incluir vias legítimas de acesso pago que o pesquisador já tenha (ex.: proxy institucional/Zotero, já suportado) antes de recorrer a fontes cinzas.

---

## 10. Roadmap sugerido (fases incrementais)

**Fase A — Fundação da premissa (sem novas fontes cinzas).**
Estado v2 + `AcquisitionConfig`; params em `plan_research_protocol`; seção no `protocol.md`; auditoria da premissa no lock; perguntas do `designer`; UI web de F0. Resultado: a premissa já é decidida e travada em F0, mesmo que a única política operante ainda seja OA. *Baixo risco, entrega valor imediato de rigor.*

**Fase B — Orquestrador de aquisição + proveniência separável.**
`acquisition_orchestrator.ts`; refatorar `retrieve_fulltexts`; `acquisition_log.csv`; `get_acquisition_report`; funil e auditoria separando OA×cinza. Ainda usando só Sci-Hub como fonte cinza (já existente), agora governado por política. *Torna o BYOS de hoje uma política de projeto.*

**Fase C — Novas fontes não-OA.**
`internet_archive_bridge` (API oficial, primeiro) → `annas_archive_bridge` + plugin. Endurecimento do `scihub_extractor.py`. *Entrega o pedido específico das três fontes.*

**Fase D — Coleta máxima (recall).**
Novos provedores OA (BASE, DOAJ, OpenAIRE, LA Referencia, Redalyc, preprints); snowball forward; expansão de query por LLM; dedup semântico; formalizar `exploratory_broad`. *Entrega o "coletar o máximo possível".*

**Fase E — Verificação.**
Testes unitários do orquestrador e da migração de estado; teste de que `open_science_only` nunca aciona cinza; teste de proveniência (todo item cinza tem `is_open_access:false` e rótulo correto); revisão de segurança dos plugins Python; validação ponta-a-ponta num projeto de exemplo.

---

## 11. Perguntas em aberto para o pesquisador (antes de implementar)

1. **Ordem de fallback cinza padrão:** confirmo a sugestão Internet Archive → Anna's Archive → Sci-Hub (do mais para o menos defensável)? Ou você prefere priorizar taxa de sucesso (Sci-Hub costuma ter maior hit para artigos com DOI)?
2. **`maximal` totalmente automático x teto:** no modo `maximal`, quer um teto de itens/tempo por segurança (ex.: parar após N tentativas) ou realmente "vai até onde der"?
3. **Anna's Archive:** usar o site (`annas-archive.gl`, scraping, mais frágil) ou, se você tiver, uma chave de API/mirror específico? Isso muda a robustez do bridge.
4. **Acesso institucional legítimo:** você tem proxy institucional / credenciais que o sistema poderia usar como camada intermediária (legítima) antes das cinzas?
5. **Começamos pela Fase A** (fundação da premissa) na próxima sessão, ou prefere que eu já detalhe o código de um módulo específico?
