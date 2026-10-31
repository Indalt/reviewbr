# Sessão 2c — preparo do acompanhamento (31/10/2026)

Material montado no chat de acompanhamento, com 4 agentes em só leitura, para o prompt da 2c (DEBT-149,
falsificador com poder). É ponto de partida **a conferir na abertura**, não verdade: agente erra no mesmo tom
em que acerta. Os números foram medidos no dist de 31/10 00:05, em dia com o src. Os scripts desta pasta só
leem: usam caminhos absolutos (`C:/reviewbr`) e rodam de qualquer pasta.

| arquivo | o que é |
|---|---|
| `resultado_agentes.json` | saída bruta dos 4 agentes: `fonte` e `diff` (conferência da 2b), `codigo` (mapa do falsificador), `controles` (verdade de referência) |
| `poder_plantado.mjs` | mede o poder por plantio: cada subitem do mapeamento real posto em cada outro item, um por vez |
| `experimento_enunciado.mjs`, `assimetrico.mjs`, `assimetrico_extra.mjs` | comparação com o enunciado nos dois lados, só no item declarado, e com equivalências extras |
| `rotulos.mjs` | os rótulos que o falsificador lê de cada subitem |
| `antigo.mjs`, `roda.mjs`, `pares_s.py`, `equiv.py` | o PRISMA-S de antes do remapeamento contra o falsificador; os pares e as lacunas da EQUIV |
| `mutacao_teste_2b.mjs` | as 4 mutações com que o teste novo da 2b foi posto à prova (todas o derrubam) |

## O falsificador hoje (medido)

- Compara o rótulo do subitem (spec, em português) só com o **título** do item (em inglês), pela tabela global
  `EQUIV` de `mapping_coherence.ts`, feita para o PRISMA 2020: não trata plural e põe "data" entre as palavras
  vazias.
- `com_poder = titulos_oficiais` (`standard_coverage.ts:217`). Sem poder, o resultado é o **erro** (b) e
  `valid: false` (`:221`). O fundamento por etapa (`itens_por_etapa`) só sai com `com_poder` (`:250`) e
  alimenta a `conduct-review/SKILL.md:61`. Hoje `com_poder` tem, portanto, dois sentidos: "o falsificador
  vale" e "o título é da fonte".
- Com `valid: false`, a declaração do checklist completo na F8 fica bloqueada: `prisma-rigor-gates/SKILL.md:60`,
  `synthesis-manuscript/SKILL.md:22` e `analyst.md:23`. O DEBT-149 ainda cita `:184` e `:56`, que mudaram de
  linha.
- O enunciado (`text`) existe no JSON do PRISMA-S, do PRISMA-ScR, do PRISMA-P e do RAISE 3, mas o zod o
  **remove** na leitura (`StandardItemSchema`). O PRISMA 2020 não tem enunciado nenhum: os dos itens 15 e 22
  estão só em `sessao_2b/fontes_certeza.md`. Pela mesma regra, campo novo no mapeamento (por exemplo, um
  descarte) é ignorado em silêncio até entrar no schema.
- Estado de cada padrão:
  - PRISMA-ScR (escopo): `valid: false` só pelos 4 falsos positivos; 12/22.
  - PRISMA-S: 9/16, `valid: true`, sem suspeito.
  - PRISMA-P: 12/26, `valid: true`, sem suspeito.
  - PRISMA 2020: 16/42, `valid: false` pelos 21 órfãos do DEBT-014 e pelos 15 suspeitos do DEBT-045.
- **Poder por plantio** (`poder_plantado.mjs`), em recall:
  - PRISMA-S: 3,4%. Só 2 de 43 subitens são acusáveis em algum plantio.
  - PRISMA-ScR: 13,1%.
  - PRISMA-P: 14,4%.

  Quando acusa, a sugestão de item acerta.
- **Enunciado:**
  - Só no item declarado: tira os 2 falsos positivos do item 7 do ScR, sem criar novos, mas não dá poder.
  - Nos dois lados: cria falsos positivos (Status, `url_item`, Filtros adicionais), derruba o PRISMA-P para
    `valid: false` e baixa o recall.
  - Também esconde deslocamento real: o enunciado do S13 tem "search strategy", e o F8.3.7 casa com ele.
- **Equivalências:** idioma→language e restrição→restrictions/limits pegam os 3 ponteiros antigos do S11. O S13
  ("Vocabulários controlados" em *Dates of searches*) não tem âncora de palavra nem no título nem no enunciado,
  e comparação de palavras nenhuma o pega.
- Nenhuma tool escreve descarte. A trava do DEBT-145 não existe em código (`methods_for_type.ts` não consulta a
  cobertura). Uma trava "só omissão" recusaria hoje o prisma-sr, pelos 21 órfãos do DEBT-014.

## Verdade de referência (controles)

Só vale o par que o enunciado oficial sustenta. Par cuja verdade foi dada pelo próprio falsificador, ou só por
opinião de sessão anterior, é circular.

**Positivos:**
- **PRISMA-S antigo.** Transcrito em `tests/prisma_s_scr_oficial.test.ts:81-98`; é o mesmo de
  `git show d64067d`. Dos 58 pares mudados:
  - 43 são seguros pelo enunciado: 12 retirados sem destino e 5 não conferíveis;
  - 7 são plausíveis e 8, incertos.
  - Entre os seguros estão o S11 (F2.1.2.3 → S9; F1.3.1.6 e F1.3.2.4 retirados) e o S13 (F1.4.3 e
    F2.1.2.5 → S8).
- **PRISMA 2020**, mapeamento atual, ainda não remapeado (DEBT-045): 23 pares deslocados com fonte.
  - O dist acusa 15.
  - Escapam F0.2.5, F7.3.1, F7.3.2, F8.3.14, F8.4.1–3 e F8.3.27 (destino incerto).
  - Congelar no teste antes do remapeamento das sessões 7+.
- **PRISMA-P:** o único "deslocamento" (F2.1.1.4, item 9 para 10) foi dado pelo próprio falsificador. É
  circular e não serve. **PRISMA-ScR:** nenhum positivo no material.

**Negativos:**
- **Os 4 falsos positivos do ScR**, que não são da mesma classe:
  - F2.1.2.1 e F2.2.5 são do item 7, que pede "the date the most recent search was executed" e todas as
    fontes.
  - F5.2.5.1 é variável de extração, ponteiro duplo legítimo: está também no item 22.
  - F8.1.5 é seleção (item 14): o nome de variável em inglês casa por identidade com *Title*.
- **Pares certos com enunciado verbatim** no PRISMA-S, no ScR, no PRISMA-P e no PRISMA 2020 (itens 15 e 22).

**Lacunas da EQUIV:** padrão a padrão, em `resultado_agentes.json` (`controles.padroes[].lacunas_equiv`).
Homônimos perigosos: data (date × dados), registro (record/registry/registration), limitações (busca ×
*Limitations*), plataforma, "Critério nível N", justificativa.

## Armadilhas

1. Controle escolhido pelo próprio código acerta sempre. O controle vem de fora (deslocamento lido na norma), e o
   relatório traz acusados/plantados e a fonte.
2. `com_poder` tem dois sentidos (falsificador × título da fonte): separar antes de mudar, ou o fundamento de
   cada etapa some.
3. "Sem poder" é erro hoje: o que ele passa a fazer é decisão do Vicente (pendente em 31/10, ver o plano).
4. O mapa antigo do PRISMA-S só existe no teste: se a 2c o usar em tempo de execução, ele vira dado versionado.
5. Para o ScR voltar a `valid: true`, os 4 suspeitos têm de sair, não só os 2 que contestam: suspeito em linha
   [NÃO COBERTO] reprova sem contestar.
6. No PRISMA 2020, parte dos pares vem da coluna "Item N" da spec, não do mapeamento: descarte só no arquivo
   de mapeamento não os alcança.
7. Zod remove chave desconhecida: provar com controle positivo que o campo novo chega ao serviço.
8. O descarte caduca quando o rótulo, o texto comparado ou o ponteiro mudam. A chave só "subitem→item"
   deixaria um descarte velho calar um deslocamento novo.
9. Textos que mentiriam depois da mudança, e que os testes não pegam:
   - `standard_coverage.ts:40-49` (premissa e limite) e o cabeçalho de `mapping_coherence.ts:18-32`;
   - a descrição da tool, em `index.ts:2658`;
   - `prisma-rigor-gates/SKILL.md:48-49`.
10. Testes que vão mudar, e mudar não é regressão: `prisma_s_scr_oficial` (o bloco SEM PODER e os 4 falsos
    positivos), `condicionais_em_uso` (12/22 → 14/22), `cobertura_verificavel`, `declaracao_por_metodo`,
    `trilha_como_dado` e `mapping_coherence` (chama `checar` e `extrairPares`, privados).
11. Integração: serviço público novo precisa de chamador externo, e equivalência PT–EN não pode trazer termo de
    tema (`tests/integracao.test.ts`).
12. A tool MCP do chat roda o dist da abertura. Medir antes × depois com node no dist recompilado
    (`sessao_2a/retrato_cobertura.mjs` com `DIR=`).
