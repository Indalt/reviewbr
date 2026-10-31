# Gera a lista das decisões imprecisas (parte C da revisão de 31/10/2026) a partir do resultado dos agentes.
import json, sys
sys.stdout.reconfigure(encoding="utf-8")
ORIG, DEST = sys.argv[1], sys.argv[2]
r = json.load(open(ORIG, encoding="utf-8"))
c = r["consolidado"]
v = {x["id"]: x for conf in r["conferencias"] for x in conf["verificacoes"]}
ORIGEM = {"FRASE_DELE": "frase dele", "ROTULO_DE_OPCAO": "rótulo de opção escrito pelo agente",
          "PARAFRASE": "paráfrase do agente", "INCERTO": "incerta"}
PESO = {"FUNDACAO": "fundação", "OPERACIONAL": "operacional", "MENOR": "menor"}
L = ["# Decisões gravadas sem precisão — lista (31/10/2026)", "",
     "Parte C de `../REVISAO_decisoes_2026-10-31.md`. Levantamento de 4 agentes leitores, consolidado por um quinto e",
     "conferido por dois agentes independentes contra o registro e as transcrições originais, todos só lendo. A",
     "\"redação proposta\" é a que saiu da conferência (o ajuste, quando o veredito foi AJUSTAR). Nada aqui é",
     "fundamento: cada item espera o Vicente. Resultado bruto: `resultado_agentes.json`.", ""]
for x in c["decisoes"]:
    vv = v.get(x["id"], {})
    L.append(f"## {x['id']} — {x['titulo']}")
    L.append("")
    L.append(f"- **Peso:** {PESO.get(x['peso'], x['peso'])} · **Data:** {x.get('data') or '—'} · "
             f"**Origem do texto gravado:** {ORIGEM.get(x['origem'], x['origem'])}")
    L.append(f"- **Onde está gravada:** {'; '.join(x['locais'])}")
    L.append(f"- **Texto gravado:** {x['texto_gravado']}")
    if x.get("contexto_original"):
        L.append(f"- **Contexto original:** {x['contexto_original']}")
    L.append(f"- **Problema:** {x['problema']}")
    if x.get("leituras_possiveis"):
        L.append("- **Leituras possíveis:** " + " ".join(x["leituras_possiveis"]))
    proposta = vv.get("ajuste") or x["proposta"]
    L.append(f"- **Redação proposta:** {proposta}")
    if x.get("precisa_conferir"):
        L.append(f"- **Só o Vicente responde:** {x['precisa_conferir']}")
    if x.get("superada_por"):
        L.append(f"- **Superada por:** {x['superada_por']}")
    L.append(f"- **Conferência de fidelidade:** {vv.get('veredito', 'não conferida')} — {vv.get('evidencia', '')}")
    L.append("")
L.append("## Superadas (31)")
L.append("")
L += [f"- {s}" for s in c["superadas"]]
L.append("")
L.append(f"Precisas, só contadas: {c['precisas_contadas']} (aproximado; a mesma decisão pode ter sido contada por mais de um leitor).")
open(DEST, "w", encoding="utf-8").write("\n".join(L) + "\n")
print("gravado", DEST, len(L), "linhas")
