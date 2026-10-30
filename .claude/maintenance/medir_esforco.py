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
Nao le a cota de 5h da conta. O --agora ESTIMA a porcentagem por uma regua calibrada com
pares (porcentagem que o Vicente leu x ponderado medido aqui), e a estimativa e' piso: o uso
no claude.ai e em outra maquina nao deixa transcrito neste disco. O Vicente pediu, em
29/10/2026, para nao precisar informar a porcentagem; quando ele informar, anote o par e
recalibre (CONTINUAR.md §1).

USO
---
    python .claude/maintenance/medir_esforco.py                # janelas de 5h (este projeto)
    python .claude/maintenance/medir_esforco.py --agora        # % estimada da janela da CONTA
    python .claude/maintenance/medir_esforco.py --agora --em=2026-10-24T14:40:00Z   # ate um instante
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

# O limite de 5h e' da CONTA, e o Vicente usa o Claude Code em outros projetos: a estimativa
# (--agora) le todas as pastas de projeto desta maquina (DEBT-148).
TODOS = os.path.expanduser(r"~\.claude\projects")

# Regua da janela de 5h em ponderado DEDUPLICADO (uma vez por resposta), todos os projetos.
# Dois pares limpos concordam em ~10,4 M para 100%: 24/10 14:40Z, 20% com 2,08 M; 29/10 19:50Z,
# 5% com 0,52 M. A faixa de +-10% cobre o arredondamento da porcentagem lida. Os pares que
# discordam (setembro e a manha de 29/10) e o porque estao no CONTINUAR.md §1. Ao ganhar um
# par novo, recalcule e atualize os dois lugares.
REGUA_5H = (9.5e6, 11.5e6)

# A leitura EXATA do painel (barra de status global, 29/10/2026) foi retirada em 30/10: no
# Antigravity a barra nunca rodou. Vale a estimativa, que e piso (CONTINUAR.md §1).


def respostas(f):
    """Uma entrada por RESPOSTA da API num transcrito: (timestamp, modelo, usage).

    O Claude Code grava uma linha por bloco de conteudo (thinking, texto, tool_use) da mesma
    resposta, e todas repetem o mesmo usage. Somar por linha contava a mesma resposta 2 a 3
    vezes (DEBT-148, medido em 29/10/2026: 150 linhas para 65 respostas numa sessao, com o
    usage identico nas 61 repetidas). Conta-se uma vez por message.id.
    """
    vistos = set()
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
        mid = m.get("id") or d.get("uuid")
        if mid in vistos:
            continue
        vistos.add(mid)
        yield d["timestamp"], m.get("model", "") or "", u


def registro(ts, rotulo, modelo, u):
    return {
        "ts": ts,
        "sessao": rotulo,
        "modelo": modelo,
        "input": u.get("input_tokens", 0) or 0,
        "output": u.get("output_tokens", 0) or 0,
        "cache_w": u.get("cache_creation_input_tokens", 0) or 0,
        "cache_r": u.get("cache_read_input_tokens", 0) or 0,
    }


def carregar(proj=PROJ):
    """Le os transcritos das sessoes principais do projeto e devolve os registros."""
    regs = []
    for f in sorted(glob.glob(os.path.join(proj, "*.jsonl"))):
        sid = os.path.basename(f)[:8]
        regs.extend(registro(ts, sid, mod, u) for ts, mod, u in respostas(f))
    regs.sort(key=lambda r: r["ts"])
    return regs


def carregar_subagentes(proj=PROJ):
    """Subagentes do Agent tool E de workflows: <sessao>/subagents/**/agent-*.jsonl.

    Ate 29/10/2026 os do Agent tool (fora de workflows/) nao entravam em conta nenhuma (DEBT-148).
    """
    regs = []
    for f in sorted(glob.glob(os.path.join(proj, "*", "subagents", "**", "agent-*.jsonl"), recursive=True)):
        rot = "sub " + os.path.basename(f)[6:14]
        regs.extend(registro(ts, rot, mod, u) for ts, mod, u in respostas(f))
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
            for ts, mod, u in respostas(f):
                soma(acc, registro(ts, "", mod, u))
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


def agora(ate=None):
    """Estima quanto da janela de 5h da conta ja foi usado, ate `ate` (padrao: o ultimo registro).

    Soma sessoes principais e subagentes de TODOS os projetos desta maquina. Nao ve o uso no
    claude.ai (web/app) nem em outra maquina: o numero e' piso, nao teto.
    """
    regs = []
    for p in sorted(glob.glob(os.path.join(TODOS, "*"))):
        if not os.path.isdir(p):
            continue
        nome = os.path.basename(p)
        for r in carregar(p):
            r["grupo"] = f"{nome[:28]} principal"
            regs.append(r)
        for r in carregar_subagentes(p):
            r["grupo"] = f"{nome[:28]} subagentes"
            regs.append(r)
    regs.sort(key=lambda r: r["ts"])
    if ate is not None:
        regs = [r for r in regs if dt(r["ts"]) <= ate]
    if not regs:
        print("Nenhum registro.")
        return
    ini, acc = janelas_5h(regs)[-1]
    grupos = {}
    for r in regs:
        if dt(r["ts"]) >= ini:
            soma(grupos.setdefault(r["grupo"], {}), r)
    fim = dt(regs[-1]["ts"])
    tabela(f"JANELA DE 5H DA CONTA (aprox.) desde {ini:%d/%m %H:%M} UTC, ate {fim:%d/%m %H:%M} UTC"
           f" — fecha por volta de {ini + timedelta(hours=5):%H:%M} UTC",
           sorted(grupos.items(), key=lambda x: -ponderado(x[1])), "projeto", largura=40)
    tot = ponderado(acc)
    lo, hi = (100 * tot / REGUA_5H[1], 100 * tot / REGUA_5H[0])
    print(f"\nTotal: {int(tot):,} ponderado -> estimativa {lo:.0f}% a {hi:.0f}% da janela de 5h"
          f" (regua {REGUA_5H[0]/1e6:.1f}-{REGUA_5H[1]/1e6:.1f} M; CONTINUAR.md §1).")
    print("Piso, nao teto: o uso no claude.ai (web/app) e em outra maquina nao aparece aqui.")


def main():
    args = set(sys.argv[1:])
    tudo = "--tudo" in args
    if "--agora" in args:
        em = [a for a in sys.argv[1:] if a.startswith("--em=")]
        agora(dt(em[0][5:]) if em else None)
        return
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
