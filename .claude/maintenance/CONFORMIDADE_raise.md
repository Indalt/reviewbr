# Conformidade do ReviewBR contra o RAISE

**Data:** 25/09/2026 · **Tipo de alteração (RV-11):** CONFORMIDADE · **Produz diagnóstico, não correção**


## 0. O que é o RAISE, e a ressalva que vem antes de tudo

**RAISE** — *Responsible use of AI in Evidence SynthEsis* — é a norma que governa exatamente o
que o ReviewBR faz. Liderada por James Thomas (EPPI Centre/UCL), com autoria coletiva de
**Cochrane, JBI, Campbell, CEE, ICASR, NICE, IQWiG e OMS**. Fonte: <https://osf.io/fwaud/>


> ⚠️ **É documento VIVO e ainda marcado como rascunho para consulta** — versão 4, de
> **23/09/2026**, dois dias antes desta avaliação. Não há versão publicada em periódico.
> Conformidade contra rascunho não é o mesmo que contra norma fechada. Mas é a melhor
> declaração disponível do que a área espera, e vem de quem define a área.


O RAISE 1 §4.8 define **uso substancial** de IA — aquele que molda métodos, base de evidência
ou direção intelectual. A lista inclui, textualmente: **decisões de elegibilidade de estudo,
avaliação de risco de viés, extração de dados e síntese**. Apoio básico de escrita não conta.


**O ReviewBR faz as três primeiras por LLM.** Está integralmente dentro do escopo de uso
substancial, e portanto de tudo que o §4.9 exige declarar.


---

## 1. Item a item — RAISE 1, recomendação 4.9

| Exigência | O que o ReviewBR tem | Conforme? |
|---|---|---|
| **4.9.1** nome do modelo, **versão** e **datas** de uso | modelo fixo em código (`screen.ts:60`, `gemini-2.5-flash-lite`); nenhuma versão resolvida, nenhuma data registrada, nenhum log | **não** |
| **4.9.2** finalidade e que partes do processo foram impactadas | nada registrado; o handler descarta os resultados intermediários | **não** |
| **4.9.3.1** evidência de rigor metodológico, citando avaliações de desempenho | nenhuma; nenhuma métrica de desempenho foi medida | **não** |
| **4.9.3.2** como foi **validada nesta revisão**; tornar públicos **prompts**, saídas, dados e código | prompt é montado em memória (`screen.ts:113`) e **nunca persistido**; não há padrão-ouro nem validação | **não** |
| **4.9.3.3** interesses financeiros e não financeiros na ferramenta | nada | **não** |
| **4.9.3.4** limitações e vieses, e seu impacto | nada | **não** |

**Seis de seis não cumpridos.**


E o §4.3 exige manter **trilhas de auditoria** e o **desenvolvimento dos prompts**. A auditoria
da Frente 2 já havia registrado, por outro caminho, que `screen_candidates` não emite
`logAuditEvent` nem `logToLocalProject` — chegou ao mesmo lugar sem conhecer o RAISE.


## 2. RAISE 2 — o que se exige de quem usa a ferramenta na triagem

| Exigência | Estado |
|---|---|
| conjunto **padrão-ouro** cobrindo o escopo do caso de uso | não existe |
| meta de **recall** definida **independentemente** de quem desenvolve | não existe |
| versão específica do modelo de fundação declarada | não |
| prompts descritos em detalhe, por afetarem desempenho e replicabilidade | não persistidos |
| **variabilidade** reportada, porque IA generativa produz respostas variáveis | não medida |

O RAISE 2 cita como referência o classificador de ECR da Cochrane, cujos interessados fixaram
**99% de recall mínimo** antes do uso em revisões — aceitando precisão de 8% em troca. O
ReviewBR não tem meta de recall porque não tem como medir recall.


## 3. Um achado que só apareceu ao cruzar as duas coisas

Os dois caminhos de LLM do sistema têm propriedades de reprodutibilidade **diferentes**:


| Caminho | Temperatura | Consequência |
|---|---|---|
| Extração (`llm_provider.ts:35`) | **fixada em 0** | saída praticamente determinística |
| Triagem (`screen.ts:60`) | **não definida** — usa o padrão da API | saída variável entre execuções |

**A rota menos reprodutível é a que decide inclusão e exclusão de estudos.** Rodar a mesma
triagem duas vezes pode produzir corpora diferentes, e nada no sistema registra qual das duas
aconteceu. É a mesma classe do falso negativo que a RV-09 existe para pegar — um resultado
que ninguém consegue reproduzir nem contestar.


## 4. O que isso significa para a ordem do trabalho

A auditoria da Frente 2 registrou *"a triagem por LLM é irreprodutível"* como defeito de
reprodutibilidade. Corrigido assim, o conserto é fixar temperatura e registrar o modelo.


**Contra o RAISE, isso cumpre menos de um dos seis itens do §4.9.** Faltariam ainda: persistir
prompt, versão resolvida e datas; construir padrão-ouro; medir desempenho; fixar meta de recall
com quem não desenvolveu a ferramenta; publicar insumos, saídas, dados e código; declarar
interesses; discutir limitações.


Era exatamente o risco previsto no **DEBT-096**: consertar antes de conhecer o alvo produz
conserto que volta para a fila. A ordem escolhida — alvo primeiro — se justificou.


## 5. O que NÃO se aplica

Delimitar importa tanto quanto listar. **TRIPOD+AI, CONSORT-AI, SPIRIT-AI, DECIDE-AI,
STARD-AI, CLAIM e PROBAST+AI** governam quem **desenvolve ou avalia** modelos de IA. O
ReviewBR **usa** LLM como ferramenta de triagem — não desenvolve modelo. Essas diretrizes
entram no catálogo como conhecimento do agente, não como conformidade exigida.


Se o sistema um dia publicar avaliação de desempenho da própria triagem — o que o RAISE 2
§4.9.3.1 pede — aí o RAISE 2 passa a governar essa avaliação.


---

## 6. Estado do catálogo depois desta absorção

| | antes | depois |
|---|---|---|
| entradas | 57 | **107** |
| sobre IA em pesquisa | **0** | 50 |
| com fonte oficial | 57 | **107** |

O catálogo deixou de ser enciclopédia e virou **critério de auditoria**: dá para perguntar
"o sistema cumpre o RAISE 4.9?" com a mesma mecânica com que se pergunta "o item 16a do
PRISMA está coberto?". É o que o DEBT-096 pedia para existir antes de qualquer correção.
