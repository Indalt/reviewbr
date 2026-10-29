# Registro do que foi produzido — sistemática de varredura de fontes primárias

**Período:** setembro de 2026
**Contexto:** pesquisa da primeira menção documental de "cajuína" em periódicos do Piauí
**Autor da sistemática:** Vicente

Este documento registra **o que existe**. A proposta de transformá-lo em módulo do ReviewBR
está em `PROPOSTA_modulo_fontes_primarias.md`.

---

## 1. Código

**11 scripts, 819 linhas**, arquivados em `codigo_origem/`.

### Varredura

| Script | Entrada | O que faz |
|---|---|---|
| `varre_anuncio.py` | década | todas as páginas de todas as edições; marca contexto comercial |
| `varre_alm_v3.py` | lista de anos | série anual; rotação decidida por léxico; régua de qualidade |
| `varre_almanaque.py` | intervalo | versão anterior (rotação por contagem bruta — **superada**) |
| `varre_jornais_mdt.py` | — | coleta remota e varre; trata JPG **e** PDF; apaga após ler |
| `varre_pdfs.py` | pasta | PDFs locais com controle positivo embutido |

### Verificação

| Script | O que faz |
|---|---|
| `controle_ocr.py` | **verificador independente**: reprocessa amostra sorteada (semente fixa) e conta termos que obrigatoriamente existem. Emite `OCR VALIDO` ou `OCR SUSPEITO` |

### Preservação

| Script | O que faz |
|---|---|
| `baixa_serie.py` | baixa série; valida assinatura `%PDF`; conta páginas; manifesto com hash |
| `baixa_acervo.py` | idem, multi-coleção; trata confirmação antivírus do Drive |
| `lista_pastas.py` | lista pasta do Drive via `embeddedfolderview` — **sem autenticação** |

### Operação

| Script | O que faz |
|---|---|
| `vigia.py` | detecta varredura travada, reinicia de onde parou, registra em log auditável |
| `painel.py` | gera painel HTML (auto-refresh) e Markdown do estado de todas as frentes |

---

## 2. Conhecimento de método

Documentado em `01_masterclass_historia/cajuina/00_metodo/`.

### 2.1 OCR de digitalização ruim

Sete pipelines testados em páginas de ~77 DPI fotografadas com CamScanner:

| Pipeline | Palavras reconhecidas | Veredicto |
|---|---:|---|
| **limiar adaptativo gaussiano (51, C=20) @ 300dpi** | **57** | ✅ vencedor |
| denoise + CLAHE | 57 | empata, 4× mais lento |
| CLAHE + Otsu | 51 | |
| CLAHE cru | 51 | |
| adaptativo bloco 31 | 48 | bloco pequeno demais |
| render cru @ 300dpi | 4 | ❌ |
| Otsu global | 4 | ❌ |
| limiar fixo | 0-37 | ❌ **destrói o texto** |

**Ganho de até 15×.** Aumentar DPI sozinho rende 83%; o pré-processamento rende 1.300%.

### 2.2 Rotação decidida por léxico

Contar "palavras" premia texto espelhado: `opelgior Coauop sp nl opsfo` conta 5 palavras e
vence a orientação correta. A decisão correta é por **fração de palavras que existem no
idioma**.

O detector automático do Tesseract (OSD) foi **descartado**: recomendou rotações diferentes
para páginas do mesmo documento, com confiança de 0,37.

### 2.3 Régua de qualidade empírica

| Referência | Léxico reconhecível |
|---|---|
| Livro digitalizado | 16,5% |
| **Jornal bem digitalizado** | **14,0%** |
| Códigos de posturas (melhor caso obtido) | 15,9% |
| Almanaques (mediana) | 5,9% |

Abaixo de ~10%, o zero não é confiável. **A métrica anterior — densidade de `que` por mil
caracteres — era ruim: media volume, não acerto**, e aprovou páginas ilegíveis.

### 2.4 Controle positivo

Todo zero precisa vir acompanhado de:
- contagem de termo-controle que **certamente existe** no corpus
- medida de qualidade de leitura contra régua
- número de unidades **efetivamente lidas**

E, em busca comercial, um **controle de contexto**: medir `vende`/`fabrica` prova que o OCR
lê anúncio, não apenas texto corrido.

---

## 3. Os oito falsos negativos

| # | Sintoma | Causa real |
|---|---|---|
| 1 | zero em toda a Hemeroteca BN | domínio `.bn.br` morto; é `.gov.br` |
| 2 | zero buscando com acento | índice não casa "cajuína" |
| 3 | 404 e títulos corrompidos (UFPI) | HTML em latin-1 lido como UTF-8 |
| 4 | "nenhuma postagem" num blog | busca quebrada — zero até para `água` |
| 5 | 0-2 palavras por página | contraste; limiar fixo |
| 6 | densidade 0,3-0,9 em 8 anos | páginas **giradas 270°** |
| 7 | 12 reinícios, progresso zero | vigia matando processo saudável |
| 8 | "1906-1918: zero ocorrências" | **68 erros, nenhuma página lida** |

**Sete dos oito produziriam um zero publicável e falso.**

---

## 4. Escala executada

| Corpus | Unidades | Páginas |
|---|---:|---:|
| Jornais UFPI, 1930-1979 | 404 edições | 2.353 |
| Almanaques da Parnaíba, 1924-1950 | 27 volumes | 4.683 |
| Hemeroteca BN | 35 periódicos | — |
| Códigos de posturas (7 cidades) | 7 documentos | 220 |
| Censos e estatísticas | 5 documentos | 1.669 |
| *A Praça* (1927-28) | 1 título | 126 |
| *O Monitor* (1908-10) | 1 título | 100 |
| **Total aproximado** | | **~9.150** |

Preservados localmente: **61 volumes do Almanaque** (11.282 páginas, 1,3 GB) e **18
documentos** do acervo Mundos do Trabalho — ambos com manifesto e hash, de um acervo cujo
site saiu do ar.

---

## 5. Produtos de pesquisa

Além do código e do método:

- **Anúncio da Casa Vieira (1927)** — *"VINHO DE CAJÚ, fabricado no Sitio Jaboty"*,
  Parnaíba. Localizado no *Almanack* e em **duas edições** de *A Praça*, com endereço
  (Rua Affonso Vizeu, 7). Recua em quase meio século o registro comercial de bebida de
  caju no Piauí — **sem ser cajuína**.
- **Mapa de cobertura real** — dos 47 anos varridos, só 10 têm densidade de jornal;
  17 têm apenas almanaque anual; 9 não têm fonte alguma.
- **Recuperação de acervo morto** — inventário completo do Mundos do Trabalho (ANPUH-PI)
  reconstruído por Wayback Machine após a queda do domínio.

---

## 6. Limites declarados

- A régua de 14,0% é **empírica**, derivada de jornal piauiense do século XX. Outro tipo de
  fonte ou outro idioma exige recalibração.
- Os parâmetros de OCR (bloco 51, C=20, 300 dpi) foram calibrados nesse material. Não há
  garantia de que sejam ótimos em outro acervo.
- A sistemática responde **presença/ausência de termo**. Não faz análise semântica, não
  desambigua homônimos e não substitui leitura.
- Nada disto substitui acervo não digitalizado. O Arquivo Público do Piauí guarda **395
  títulos de jornais** que nenhuma varredura alcança.
