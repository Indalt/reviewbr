import json, sys
sys.stdout.reconfigure(encoding="utf-8")
BASE = "C:/reviewbr/.claude/maintenance/triagem_backlog_2026-11-05/"
d = json.load(open(BASE + "classificadores.json", encoding="utf-8"))
debt = {f["id"]: f for f in json.load(open("C:/reviewbr/.claude/maintenance/system_debt.json", encoding="utf-8"))["findings"]}
itens = d["itens"]
assert len(itens) == 58 and len({i["id"] for i in itens}) == 58

def resumo(i, n=170):
    s = " ".join(str(debt[i]["summary"]).split())
    return s if len(s) <= n else s[:n].rsplit(" ", 1)[0] + "…"

def limpa(t):
    return " ".join(str(t or "").split())

CAB = """# Triagem do backlog: defeito × ausência — 05/11/2026

> **Estado: proposta sem contestação. Nada foi aplicado ao backlog nem ao sistema.** Os 4 classificadores do
> workflow `wf_69aa6db2-8ea` terminaram. Os 4 contestadores e o crítico não rodaram: o limite de 5h estourou,
> porque o fan-out foi lançado sem custo combinado (regra 6 do "Como trabalhar" do plano; a régua não mede
> subagente). Saída bruta: `classificadores.json`, gerado da journal do workflow.

## Por que

Pedido do Vicente, 05/11/2026. Origem, nas palavras dele: *"você colocou uma tarefa com detalhamentos como se
fosse uma metodologia desconhecida ou heterodoxa. como se não já soubéssemos quais as metodologias de escopo
[...] esse comentário não deveria gerar um debt 'empurrando com a barriga' problemas que não existem. me entregue
solução para este e para outros problemas como esse sem ter de revisar todo o código para cada problema [...]
o sistema já iria adicionar a(s) metodologia(s). Se eu estiver errado me corrija"*.

**O caso.** O DEBT-151 tinha um defeito pequeno: a trilha do escopo mostra rótulos do PICOS nos campos que o
template usa para o PCC. Em 05/11 o acompanhamento acrescentou a ele a decisão D14 como "consequência". Com isso,
abriu a sessão 2d, de duas janelas, para assimilar uma metodologia de escopo e migrar os dois projetos. Três
coisas já existiam:
- o catálogo já tinha a entrada `jbi-scoping-review`: capítulo 10 do JBI Manual 2024, com o PCC, os 9 passos
  de Peters (que expandem Arksey e O'Malley e Levac) e o PRISMA-ScR como norma de relato;
- a DIRECAO §9, de 04/10, já dizia que ausência não é achado;
- o plano já tinha a assimilação de métodos validados na 7+.

**O teste aplicado** usa só fundamentos já gravados:
- DIRECAO §9: defeito é o sistema afirmar o que não cumpre; ausência é escopo.
- DIRECAO §10: o critério do prejuízo a uma pesquisa (publicar algo falso, perder dado elegível, decidir
  errado).
- Regra de 09/10: o que é defeito, sempre, é o sistema mentir.
- Diretriz de 17/10, precisada em 29/10: assimilar metodologia validada é manutenção com protocolo próprio.

Classes: DEFEITO, AUSÊNCIA, PRINCÍPIO, ADIAMENTO e MISTO. Ações: MANTER, ENXUGAR (fica o defeito, sai o
acréscimo), FUNDIR e RECUSAR.

## Resultado (58 achados abertos)

| ação | quantos | o que significa |
|---|---|---|
| MANTER | {MANTER} | defeito vivo, sem acréscimo |
| ENXUGAR | {ENXUGAR} | fica o defeito; sai o acréscimo de decisão, agenda ou ausência (o DEBT-102 fecha como RESOLVIDO) |
| FUNDIR | {FUNDIR} | o mesmo defeito já está em outro achado aberto |
| RECUSAR | {RECUSAR} | não é achado: {rec_aus} ausências, {rec_pri} princípios, {rec_adi} adiamentos |

Aplicada, a proposta deixa cerca de 32 abertos (58 − 10 fundidos − 15 recusados − o DEBT-102 resolvido).

## O que a varredura achou além do caso

1. **O erro tem duas direções, com a mesma raiz.**
   - **Uma direção: ausência e decisão gravadas como achado.** Esse é o caso do Vicente: DEBT-007 (JBI), parte 2
     do DEBT-008 (GRADE e CERQual), DEBT-094 (RAISE), DEBT-110, DEBT-101, DEBT-132, DEBT-145 e DEBT-147. O
     catálogo já tem todas as metodologias citadas.
   - **A outra direção: defeito de hoje escondido como escopo.**
     - Defeito de texto empacotado com uma assimilação. No DEBT-008, a skill de síntese amarra GRADE e CERQual à
       metanálise. No DEBT-151, a F7.3 (certeza da evidência) e o motivo EX-03 ("desfecho não reportado") valem
       na revisão de escopo. Esses consertos ficariam esperando a metodologia.
     - Defeito rotulado como escopo. Dos 15 abertos com destino `METODOLOGIA_NOVA`, 14 são defeito pela
       classificação, e só uma parte do DEBT-008 é assimilação de verdade. Em 08/10, a DIRECAO §11 deu 23 dos 35
       achados marcados como "travando" por escopo, só pelo destino `METODOLOGIA_NOVA` ou `CONFORM_EXTERNA`. Hoje,
       defeitos com esse destino estão na 7+, sem sessão nomeada (conferido na tabela de sessões do plano):
       - DEBT-089: o `retrieve_fulltexts` reescreve o dataset e pode truncar o corpus;
       - DEBT-060: os agentes têm `Bash` e `Write` apesar da proibição;
       - DEBT-062: o consentimento do Sci-Hub só existe na descrição.
   - **A raiz**: um campo que mistura o que o achado é com onde ele será feito.
2. **A causa está em três pontos do sistema, e corrigi-los não exige revisar achado por achado.**
   - `maintainer.md:118-125` manda registrar no backlog, como EXTENSÃO, toda metodologia ausente. Isso contraria
     a DIRECAO §9.
   - `record_system_finding` aceita achado sem perguntar onde o sistema afirma ou exige algo hoje.
   - Os acréscimos DECISÃO, CONSEQUÊNCIA e REAGENDADO, escritos no `context` dos achados, transformaram o
     DEBT-149 e o DEBT-151 em sessões de duas janelas.
3. **A reclassificação de 18/10 já propunha quase todas as fusões e enxugamentos.** O arquivo é
   `RECLASSIFICACAO_fila_2026-10-18.md`, que diz "nada aqui foi executado".
4. **O DEBT-141 vem antes da rota "ausência vai ao catálogo".** A `absorb_methodology` com `atualizar=true` apaga
   campos. Até o conserto, só criar entrada nova.

## Decisões pedidas ao Vicente (05/11/2026)

1. **A regra do backlog**, em forma precisa (a conferir):
   > O backlog de manutenção (`system_debt.json`) registra só defeito: o que o sistema afirma, exige ou entrega
   > hoje e não se sustenta (DIRECAO §9, 04/10). Não entram nele:
   > - (a) metodologia ou norma consolidada e validada que o sistema ainda não tem. Ela fica no catálogo e é
   >   assimilada pelo procedimento de manutenção quando o Vicente decidir, sem achado nem sessão desenhada
   >   para ela;
   > - (b) decisão do Vicente. Vai ao registro de decisões, e a agenda que dela decorre vai ao plano. O texto
   >   do achado recebe só o que decide o conserto do defeito daquele achado;
   > - (c) problema que só existiria no futuro.

   Consequências:
   - corrigir o `maintainer.md:118-125`;
   - precisar o item 4 do "Como trabalhar" do plano ("pela tool, no achado"), que levou a D14 para dentro do
     DEBT-151.

   Correção ao que foi dito: o sistema não adiciona metodologia sozinho. Cada assimilação é uma rodada de
   manutenção (esqueleto, spec a partir da fonte oficial, leitura documentada, `validate_methodology`). O que não
   precisa existir é achado, sessão desenhada e migração.
2. **DEBT-151 e sessão 2d.**
   - O DEBT-151 fica só com o defeito de hoje:
     - rótulos do PICOS nos campos do PCC;
     - o Contexto sem subitem;
     - o motivo EX-03 e a F7.3 valendo no escopo.
   - A D14 vai ao registro de decisões e à sessão M.
   - A 2d sai do plano. Assimilar o `jbi-scoping-review` volta para a 7+, quando o Vicente decidir.
   - Nenhuma migração: os dois projetos de escopo seguem no método travado deles.
   - O RAISE (DEBT-094) espera a resposta ao D07.
3. **Sessão 2c.**
   - Sai o item 4, sobre o DEBT-145. O ponto "a trava considera só item esquecido" já está no DEBT-149 e vai ao
     D15.
   - O DEBT-149 fecha no item 1 da 2c: a conferência por palavras sai da trava, e o relatório fica honesto.
   - Os itens 2 e 3 (leitura documentada) seguem na 2c, como decidido em B1 e B2. Contam como construção do
     procedimento de assimilação, não como condição de fechar o achado.
4. **Os outros 55 achados, antes de aplicar a proposta.** Três caminhos:
   - (a) **recomendado, sem agente agora.** Cada sessão confere, na abertura, a proposta dos achados dela, e já
     lê esse código para consertá-los. As 15 saídas, que nenhuma sessão toca, o Vicente decide pela lista
     abaixo;
   - (b) um contestador só para as 15 saídas, com custo combinado antes;
   - (c) aplicar sem contestar. Não recomendado: em 04/10, 5 de 13 recusas eram achados reais.
5. **A trava na entrada**, numa sessão curta depois da 2c.
   - A `record_system_finding` recusa achado novo ou atualizado sem a "mentira de hoje" (arquivo:linha e o que a
     contradiz). Isso transforma o teste em trava de escrita.
   - O destino `METODOLOGIA_NOVA` deixa de ser usado para defeito.

## Vistos de passagem, fora dos 58 (a conferir antes de registrar)

- `.claude/skills/methodology-router/SKILL.md:13` diz que o `prisma-sr` serve "a revisão sistemática e a
  exploratória". O manifest dele declara só `systematic_review`. Isso foi notado em 18/10 e não tem achado.
  Conferido em 05/11 pelo acompanhamento: a frase está lá.
- `harvest_records`: a descrição do `projectPath` sugere persistência, e o handler não chama
  `appendRawRecords`. É a mesma classe do DEBT-087, sem achado aberto que a cubra. Não conferido.
- A descrição do manifest do `prisma-sr` ("Trilha completa ... com rastreabilidade PRISMA 2020") afirma mais do
  que os 21 itens órfãos e os 5 deslocados sustentam. Não conferido.
- Há um arquivo solto, `reviewbr/reviewbr-mcp/src/index.ts.tmp`. Conferido: existe.
- A DIRECAO termina na linha 469 com a primeira linha de uma tabela sem cabeçalho. A lista dos 12 que "sobram"
  no §11 não está no disco. Conferido.

## Proposta por achado
"""

cont = {}
for i in itens:
    cont[i["acao"]] = cont.get(i["acao"], 0) + 1
rec = [i for i in itens if i["acao"] == "RECUSAR"]
cab = (CAB.replace("{MANTER}", str(cont.get("MANTER", 0)))
          .replace("{ENXUGAR}", str(cont.get("ENXUGAR", 0)))
          .replace("{FUNDIR}", str(cont.get("FUNDIR", 0)))
          .replace("{RECUSAR}", str(cont.get("RECUSAR", 0)))
          .replace("{rec_aus}", str(sum(1 for i in rec if i["classe"] == "AUSENCIA")))
          .replace("{rec_pri}", str(sum(1 for i in rec if i["classe"] == "PRINCIPIO")))
          .replace("{rec_adi}", str(sum(1 for i in rec if i["classe"] == "ADIAMENTO"))))

out = [cab]
titulos = [("RECUSAR", "Saem do backlog (RECUSAR)"), ("FUNDIR", "Fundem-se em outro achado (FUNDIR)"),
           ("ENXUGAR", "Ficam só com o defeito (ENXUGAR)"), ("MANTER", "Ficam como estão (MANTER)")]
for acao, tit in titulos:
    grupo = sorted([i for i in itens if i["acao"] == acao], key=lambda x: x["id"])
    out.append(f"\n### {tit} — {len(grupo)}\n")
    for i in grupo:
        f = debt[i["id"]]
        out.append(f"**{i['id']}** ({f['status']}, {f.get('gravidade','-')}, destino {f.get('destino','-')}) — {resumo(i['id'])}\n")
        out.append(f"- Classe: {i['classe']} · confiança: {i['confianca']}" + (f" · fundir em: {i.get('fundir_em')}" if i.get('fundir_em') else ""))
        if acao == "MANTER":
            out.append(f"- Mentira de hoje: {limpa(i['mentira_hoje'])}")
            out.append(f"- Por quê: {limpa(i['justificativa'])}")
            out.append(f"- Sessão: {limpa(i.get('sessao_afetada'))}\n")
            continue
        out.append(f"- Mentira de hoje: {limpa(i['mentira_hoje'])}")
        out.append(f"- Fica: {limpa(i['o_que_fica'])}")
        out.append(f"- Sai: {limpa(i['o_que_sai'])}")
        out.append(f"- Vai para: {limpa(i.get('destino_do_que_sai'))}")
        out.append(f"- Sessão: {limpa(i.get('sessao_afetada'))}")
        out.append(f"- Por quê: {limpa(i['justificativa'])}\n")

open(BASE + "TRIAGEM.md", "w", encoding="utf-8").write("\n".join(out))
print("ok", cont)
