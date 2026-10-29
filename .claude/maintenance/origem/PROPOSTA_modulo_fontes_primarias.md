# Módulo `fontes-primarias` — busca de termo em acervo não indexado

**Origem:** pesquisa da primeira menção documental de "cajuína" no Piauí (set/2026)
**Estado:** proposta, reescrita após a crítica de que a versão anterior era centrada em scripts

---

## 0. A correção que esta versão faz

A primeira versão desta proposta listava scripts e pedia para chamá-los por subprocesso.
Estava errada em premissa.

O ReviewBR **não é um executor de scripts**. É um sistema de revisão sistemática que opera
por **travas metodológicas**: o agente produz o insumo, uma verificação determinística
aprova ou reprova, o orquestrador só avança com verde. Script é último recurso, não
arquitetura.

E há uma prova disso à mão: **esta própria investigação derivou** precisamente por não ter
travas. Ela começou como "primeira menção em jornal do Piauí" e, sem gate que a prendesse,
passou a varrer almanaques, códigos de posturas, censos, a preservar acervo, a caçar
verbete de 1975 — cada passo defensável, o conjunto sem protocolo. Foi preciso o
pesquisador intervir para reduzir escopo ("não pedi para mudar os termos"), para corrigir
premissa (as atas), para pedir visibilidade (o painel).

**O módulo existe para que a próxima investigação desse tipo não precise dessas
intervenções.** O que se aproveita do trabalho não são os scripts — é o que eles
*descobriram*, convertido em verificação determinística.

---

## 1. Por que é um braço, e não uma fase a mais

| | ReviewBR atual | Este módulo |
|---|---|---|
| Fonte | indexada, com API e metadados | acervo bruto, sem índice |
| Unidade | registro bibliográfico | **página** |
| Pergunta | quais estudos respondem à questão | **o termo ocorre ou não** |
| Resultado típico | corpus para triagem | **um zero, que precisa ser provado** |
| Risco central | viés de seleção | **falso negativo de ferramenta** |

O `librarian` busca em repositório; este módulo lida com fonte que não tem busca. São
problemas distintos, com riscos distintos — daí módulo próprio, sujeito às mesmas travas.

---

## 2. A trava que falta ao sistema: RV-09

O invariante que esta pesquisa revelou por ausência:

> ### RV-09 — Resultado negativo exige verificação
>
> **O que garante:** um zero reportado é ausência na fonte, não falha de leitura.
>
> **Verificação:** `verify_negative_result` — reprova salvo se, para cada unidade do corpus:
> 1. **termo-controle** que certamente existe na fonte foi contado e é > 0;
> 2. **qualidade de leitura** medida contra régua declarada do tipo de fonte;
> 3. **unidades efetivamente lidas** registradas (lidas ≠ tentadas);
> 4. **controle de contexto**: vocabulário do domínio da pergunta foi encontrado
>    (busca por anúncio exige `vende`/`fabrica` presentes).
>
> **Reprovação bloqueia:** reportar o resultado, sintetizar, exportar.

### Por que esta trava, e não outra

Oito falsos negativos ocorreram nesta pesquisa. **Sete produziriam um zero publicável e
falso:**

| # | Sintoma | Causa real | Qual condição da RV-09 o pegaria |
|---|---|---|---|
| 1 | zero em toda a Hemeroteca | domínio `.bn.br` morto | (1) controle = 0 |
| 2 | zero buscando com acento | índice não casa "cajuína" | (1) controle = 0 |
| 3 | 404 e títulos corrompidos | latin-1 lido como UTF-8 | (3) lidas = 0 |
| 4 | "nenhuma postagem" | busca do site quebrada | (1) controle `água` = 0 |
| 5 | 0-2 palavras por página | limiar fixo destrói o texto | (2) léxico 0,3% |
| 6 | densidade 0,3-0,9 em 8 anos | páginas giradas 270° | (2) léxico abaixo da régua |
| 7 | 12 reinícios, progresso zero | vigia matando processo são | (3) lidas não avança |
| 8 | "1906-1918: zero" | 68 erros, nenhuma página lida | (3) **lidas = 0** |

O oitavo é o mais eloquente: entraria no relatório como *"A Voz do Trabalhador, 1906-1918:
zero ocorrências"* sem que **uma única página tivesse sido lida**. Nenhuma trava atual do
ReviewBR o pegaria, porque todas pressupõem que a fonte foi lida.

---

## 3. As fases do módulo, com gate em cada uma

Espelhando F0-F8, com spec própria em `.claude/methodologies/fontes-primarias/spec.md`:

| Fase | O que trava | Verificação | Reprovação bloqueia |
|---|---|---|---|
| **P0 — Questão** | termo-alvo, correlatos aceitos e **recusados**, recorte temporal e geográfico | `submit_protocol_for_approval` | coletar qualquer acervo |
| **P1 — Fonte** | acervo declarado: estado do domínio, formato, cobertura, lacunas conhecidas | `validate_primary_source` | varrer |
| **P2 — Coleta** | manifesto por unidade: origem, hash, páginas, data | `audit_harvest` | varrer |
| **P3 — Leitura** | qualidade de OCR por unidade contra régua | `assess_ocr_quality` | contar ocorrências |
| **P4 — Varredura** | ocorrências com página, contexto e classificação | `sweep_term_in_corpus` | concluir |
| **P5 — Verificação** | **RV-09** | `verify_negative_result` | **reportar** |
| **P6 — Relato** | cobertura real declarada por unidade de tempo | `compute_coverage_map` | exportar |

### P0 é a trava que faltou a esta pesquisa

O protocolo travado deve fixar, **antes de qualquer coleta**:

- **termo-alvo**: `cajuína`
- **correlatos aceitos**: `cajuina`, `cajuína` (com e sem acento — RV descoberta na prática)
- **correlatos recusados**: `vinho de caju`, `suco de caju` — *são outra coisa; registrar
  se aparecerem, nunca contar como o termo*
- **recorte**: periódicos do Piauí, 1850-1980
- **fontes elegíveis** e **não elegíveis**

Com P0 travado, o episódio da "busca ampliada" (quando incluí `vinho`, `xarope`, `licor` por
conta própria) seria **reprovado pelo gate**, não corrigido pelo pesquisador.

### P6 é a trava que faltou ao relato

`compute_coverage_map` deriva dos logs — nunca digitado (RV-02) — a cobertura **por unidade
de tempo**, distinguindo:

| Classe | Critério |
|---|---|
| densidade real | N unidades ≥ limiar declarado |
| esparsa | 1 a N-1 unidades |
| fonte de outro tipo | anual quando a pergunta é sobre periódico |
| **sem fonte** | nenhuma |

Isto impede a frase que escrevi e tive de corrigir: *"varri a imprensa piauiense de 1924 a
1979"*, quando dos 47 anos só 10 tinham densidade de jornal, 17 tinham apenas almanaque
anual e 9 não tinham fonte alguma.

---

## 4. Ferramentas MCP — determinísticas, não interpretativas

Seguindo RV-06 (*MCP executa, não decide*):

| Ferramenta | Entrada | Saída determinística |
|---|---|---|
| `validate_primary_source` | acervo | estado do domínio, formato, cobertura, lacunas |
| `recover_dead_archive` | domínio | capturas Wayback, links recuperados |
| `audit_harvest` | coleta | manifesto verificado (hash, páginas, integridade) |
| `assess_ocr_quality` | corpus | léxico por unidade, veredicto vs. régua |
| `sweep_term_in_corpus` | corpus + protocolo P0 | ocorrências com página e contexto |
| **`verify_negative_result`** | corpus + controles | **VÁLIDO / FALSO NEGATIVO**, com causa |
| `compute_coverage_map` | logs | cobertura por unidade de tempo, por classe |

`verify_negative_result` é a ferramenta que justifica o módulo. As outras seis existem para
alimentá-la.

---

## 5. Catálogo de fontes primárias

Espelha `repositories_catalog.json`, com os campos que esta pesquisa provou necessários:

- `estado_do_dominio` — vivo / morto / intermitente (**verificado, não presumido**)
- `recuperacao` — via e carimbo da captura
- `formato` — pdf / pasta_jpg / pasta_pdf (**os três ocorreram no mesmo acervo**)
- `qualidade_ocr` — léxico medido, régua aplicada, veredicto
- `rotacao_dominante` — 0 / 90 / 180 / 270
- `cobertura` — de, até, lacunas, densidade por ano

Nenhum existe no catálogo atual. São o que evita repetir o diagnóstico a cada acervo — e
o que transforma o aprendizado desta pesquisa em ativo do sistema.

---

## 6. Agente e skill

- **agente `antiquarian`** — par do `librarian`. Coleta, corrige leitura e varre. **Não
  decide** o que é ocorrência válida: isso vem do protocolo P0 travado.
- **skill `primary-source-sweep`** — o procedimento, com os gates P0-P6, análoga a
  `prisma-s-logging` para busca bibliográfica.
- **`methodology-router`** ganha o método `fontes-primarias`, com seu `manifest.json` e
  `spec.md`, mantendo RV-01..RV-08 ativos e acrescentando RV-09.

---

## 7. Onde os scripts entram

**No fim, e só como implementação interna das tools.** O que se aproveita deles é o
conhecimento calibrado, que vira constante verificável:

| Descoberta | Vira |
|---|---|
| limiar adaptativo gaussiano (51, C=20) @ 300 dpi, até 15× sobre o render cru | parâmetro padrão de `assess_ocr_quality`, exposto e recalibrável |
| rotação decidida por léxico, não por contagem bruta | regra interna de leitura |
| OSD do Tesseract não confiável (0,37 de confiança, discorda entre páginas) | motivo documentado para não usá-lo |
| régua: jornal 14,0%, livro 16,5%, abaixo de 10% não confiável | **parâmetro de RV-09**, por tipo de fonte |
| controle positivo e de contexto | **as quatro condições de RV-09** |

A decisão de linguagem é secundária e deve seguir a do sistema. Se a tool precisar de
Tesseract/OpenCV, que seja dependência declarada — não script avulso chamado por fora.

---

## 8. Ordem de implementação

| Etapa | Entrega | Por quê primeiro |
|---|---|---|
| 1 | **RV-09 + `verify_negative_result`** | é a trava; sozinha já protege qualquer varredura |
| 2 | `assess_ocr_quality` + régua por tipo de fonte | alimenta a condição (2) da RV-09 |
| 3 | spec P0-P6 + skill `primary-source-sweep` | prende o escopo — o que faltou aqui |
| 4 | `validate_primary_source` + catálogo | evita rediagnóstico |
| 5 | `audit_harvest`, `recover_dead_archive` | preservação |
| 6 | agente `antiquarian` | orquestra o que já está travado |

A etapa 1 tem valor isolado e **independe do resto**: qualquer resultado negativo do
ReviewBR passa a exigir prova.

---

## 9. Ressalvas

- A régua de 14,0% é **empírica**, de jornal piauiense do século XX. Deve ser parâmetro por
  tipo de fonte, nunca constante do sistema.
- Os parâmetros de OCR foram calibrados neste material. Em outro acervo, exigem
  recalibração — e a RV-09 detectaria a necessidade, que é o ponto.
- O módulo responde **presença/ausência de termo**. Não desambigua homônimos, não faz
  análise semântica e não substitui leitura.
- Nada disto alcança acervo não digitalizado. O Arquivo Público do Piauí guarda **395
  títulos de jornais** que nenhuma varredura toca — e a spec deve **obrigar** a declarar
  isso em P1, como lacuna conhecida.
