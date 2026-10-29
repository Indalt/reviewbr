#!/usr/bin/env python3
"""
medir_esforco.py — mede o consumo real de tokens deste projeto, por janela de 5 horas.

POR QUE EXISTE
--------------
O limite de uso e' de CONTA e aparece no cliente (avisos de porcentagem, /status). O agente
nao consegue le-lo. O que o agente CONSEGUE ler sao os transcritos em disco, que trazem
contabilidade completa por mensagem: input, output, escrita de cache e leitura de cache.

Medir o passado e' o unico jeito honesto de orcar o futuro. Sem isto, "regular o esforco"
seria palpite — o mesmo vicio que o RV-11 existe para impedir no plano das alteracoes.

O QUE NAO FAZ
-------------
Nao le a cota de 5h da conta e nao preve quando ela estoura. Correlacionar o total medido
aqui com a porcentagem que o cliente mostra e' tarefa do operador humano: rode o script
quando o cliente avisar "X%" e anote o par. Alguns pares bastam para calibrar.

USO
---
    python .claude/maintenance/medir_esforco.py                # janelas de 5h
    python .claude/maintenance/medir_esforco.py --sessoes      # custo por sessao
    python .claude/maintenance/medir_esforco.py --workflows    # custo dos workflows
    python .claude/maintenance/medir_esforco.py --tudo
"""
import json
import glob
import os
import sys
from datetime import datetime, timedelta

# Diretorio de transcritos do Claude Code para este projeto.
PROJ = os.path.expanduser(r"~\.claude\projects\c--reviewbr")

# Multiplicadores de PRECO da API, CONFIRMADOS na documentacao oficial em 25/09/2026
# (platform.claude.com/docs/en/about-claude/pricing):
#   escrita de cache TTL 5min = 1,25x | TTL 1h = 2,0x
#   leitura de cache = 0,1x na maioria dos modelos; Opus 5.5 usa 0,05x; Fable/Mythos 5.1 usam 0,025x
#   saida = 5x o input, na razao padrao input:output da familia Claude
#
# ATENCAO: preco != limite de uso. A contabilidade do rate limit do assinante (Pro/Max/Team)
# pode diferir e NAO foi confirmada. Estes pesos servem para ver O QUE PESA, nao para prever
# a cota. Para calibrar de verdade, anote a porcentagem que o cliente mostra e compare.
CACHE_R = 0.1   # troque para 0.05 se o modelo da sessao for Opus 5.5
PESO = {"input": 1.0, "output": 5.0, "cache_w": 1.25, "cache_r": CACHE_R}


def carregar():
    """Le todos os transcritos do projeto e devolve os registros com contabilidade."""
    regs = []
    for f in sorted(glob.glob(os.path.join(PROJ, "*.jsonl"))):
        sid = os.path.basename(f)[:8]
        for line in abrir(f):
            try:
                d = json.loads(line)
            except Exception:
                continue
            m = d.get("message")
            if not isinstance(m, dict):
                continue
            u = m.get("usage")
            if not u or not d.get("timestamp"):
                continue
            regs.append({
                "ts": d["timestamp"],
                "sessao": sid,
                "modelo": m.get("model", "") or "",
                "input": u.get("input_tokens", 0) or 0,
                "output": u.get("output_tokens", 0) or 0,
                "cache_w": u.get("cache_creation_input_tokens", 0) or 0,
                "cache_r": u.get("cache_read_input_tokens", 0) or 0,
            })
    regs.sort(key=lambda r: r["ts"])
    return regs


def abrir(f):
    with open(f, encoding="utf-8", errors="replace") as fh:
        for line in fh:
            yield line


def dt(ts):
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))


def ponderado(a):
    return sum(a[k] * PESO[k] for k in PESO)


def soma(acc, r):
    for k in PESO:
        acc[k] = acc.get(k, 0) + r[k]
    acc["msgs"] = acc.get("msgs", 0) + 1
    return acc


def tabela(titulo, linhas, col1="", largura=24):
    print(f"\n{titulo}")
    print(f"{col1:<{largura}}{'msgs':>6}{'output':>11}{'cache_w':>12}{'cache_r':>14}{'ponderado':>13}")
    print("-" * (largura + 56))
    for rot, a in linhas:
        print(f"{rot:<{largura}}{a.get('msgs',0):>6}{a['output']:>11,}"
              f"{a['cache_w']:>12,}{a['cache_r']:>14,}{int(ponderado(a)):>13,}")


def janelas_5h(regs):
    """Agrupa por janela de 5h ROLANTE a partir do primeiro registro de cada dia de uso.

    A janela real do provedor comeca no primeiro uso apos um periodo ocioso, nao num horario
    fixo. Aproximamos: uma lacuna maior que 5h inicia janela nova.
    """
    if not regs:
        return []
    out = []
    ini = dt(regs[0]["ts"])
    acc = {}
    ult = ini
    for r in regs:
        t = dt(r["ts"])
        # lacuna > 5h OU janela cheia -> fecha e abre outra
        if (t - ult).total_seconds() > 5 * 3600 or (t - ini).total_seconds() >= 5 * 3600:
            if acc:
                out.append((ini, acc))
            ini, acc = t, {}
        soma(acc, r)
        ult = t
    if acc:
        out.append((ini, acc))
    return out


def custo_workflows():
    """Soma o custo de cada corrida de workflow a partir das transcricoes dos SUBAGENTES.

    O journal.jsonl nao traz consumo: so 'launched', 'started' e 'result'. A versao anterior
    somava `usage` do journal e por isso respondia "nenhum journal encontrado" com quatro
    corridas em disco — cega justamente ao que estoura o limite sem aviso (29/10/2026).
    O consumo esta em cada agent-*.jsonl, mensagem a mensagem. `msgs` aqui e o numero de
    agentes que TERMINARAM (results no journal) sobre os que comecaram.
    """
    base = os.path.join(PROJ, "*", "subagents", "workflows", "*")
    linhas = []
    for d in sorted(glob.glob(base)):
        acc = {}
        for f in glob.glob(os.path.join(d, "agent-*.jsonl")):
            for line in abrir(f):
                try:
                    o = json.loads(line)
                except Exception:
                    continue
                m = o.get("message")
                u = m.get("usage") if isinstance(m, dict) else None
                if u:
                    soma(acc, {"input": u.get("input_tokens", 0) or 0,
                               "output": u.get("output_tokens", 0) or 0,
                               "cache_w": u.get("cache_creation_input_tokens", 0) or 0,
                               "cache_r": u.get("cache_read_input_tokens", 0) or 0})
        if not acc:
            continue
        terminaram = comecaram = 0
        j = os.path.join(d, "journal.jsonl")
        if os.path.exists(j):
            for line in abrir(j):
                tipo = (json.loads(line).get("type") if line.strip() else "")
                terminaram += tipo == "result"
                comecaram += tipo == "started"
        acc["msgs"] = terminaram
        linhas.append((f"{os.path.basename(d)[:16]} {terminaram}/{comecaram}", acc))
    return linhas


def main():
    args = set(sys.argv[1:])
    tudo = "--tudo" in args
    regs = carregar()
    if not regs:
        print(f"Nenhum transcrito com contabilidade em {PROJ}")
        return

    t0, tN = dt(regs[0]["ts"]), dt(regs[-1]["ts"])
    geral = {}
    for r in regs:
        soma(geral, r)
    print(f"Projeto: {PROJ}")
    print(f"Periodo: {t0:%d/%m/%Y %H:%M} -> {tN:%d/%m/%Y %H:%M} UTC  ({len(regs)} mensagens)")
    print(f"Total ponderado: {int(ponderado(geral)):,}  "
          f"(output {geral['output']:,} | cache_w {geral['cache_w']:,} | cache_r {geral['cache_r']:,})")
    print(f"\nPESO: output x5, cache_w x1,25, cache_r x{CACHE_R}, input x1 — proporcao de PRECO")
    print("      da API, confirmada na doc oficial. NAO e' a formula do limite do assinante.")

    if not args or tudo or "--janelas" in args:
        jan = janelas_5h(regs)
        tabela("CONSUMO POR JANELA DE ~5H (lacuna > 5h abre janela nova)",
               [(f"{i:%d/%m %H:%M}", a) for i, a in jan], "inicio da janela")
        if jan:
            pico = max(jan, key=lambda x: ponderado(x[1]))
            print(f"\nPico: janela de {pico[0]:%d/%m %H:%M} — {int(ponderado(pico[1])):,} ponderado, "
                  f"{pico[1]['output']:,} de saida em {pico[1]['msgs']} mensagens.")
            print("Anote a porcentagem que o cliente mostrou nessa janela para calibrar a regua.")

    if tudo or "--sessoes" in args:
        ses = {}
        for r in regs:
            soma(ses.setdefault(r["sessao"], {}), r)
        tabela("CONSUMO POR SESSAO", sorted(ses.items(), key=lambda x: -ponderado(x[1])), "sessao")

    if tudo or "--workflows" in args:
        wf = custo_workflows()
        if wf:
            tabela("CUSTO DOS WORKFLOWS (subagentes)", wf, "corrida")
        else:
            print("\nNenhum journal de workflow encontrado.")


if __name__ == "__main__":
    main()
