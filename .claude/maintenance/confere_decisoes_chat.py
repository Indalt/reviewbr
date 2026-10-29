# Confere cada citação do DECISOES_chat_a_conferir.md na transcrição citada (sessão e linha).
#
# Sessão 0 de 29/10/2026 (PLANO_sessoes_2026-10-29.md): o arquivo a conferir foi montado na troca de
# computador e os verificadores pararam no limite de sessão, então cada item era hipótese. Este script
# é o verificador determinístico da parte que se mecaniza: a citação existe, com essas palavras, na
# linha apontada? Se não está na linha, procura no arquivo inteiro e diz onde está.
#
# Uso: python .claude/maintenance/confere_decisoes_chat.py [--controle]
#   --controle  roda também o controle positivo (citação inventada tem de dar NAO_ACHADA).
import json, os, re, sys, unicodedata

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DOC = os.path.join(RAIZ, ".claude", "maintenance", "DECISOES_chat_a_conferir.md")
TRANSCRICOES = os.path.join(os.path.expanduser("~"), ".claude", "projects", "C--reviewbr")
SESSOES = {
    "27fac9ba": "27fac9ba-6bd0-4e9e-a829-ba83125299f0",
    "be12a326": "be12a326-1306-43b3-a197-591af05c0876",
    "153e5b05": "153e5b05-39f6-48e0-bff4-755901768e04",
    "bbfd7ac8": "bbfd7ac8-9d5e-4f86-909d-ec2c0ee9bf3b",
}


def norm(s):
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c)).lower()
    s = re.sub(r"[`*_\"“”'’]", "", s)
    return re.sub(r"\s+", " ", s).strip()


def textos(o, acc):
    if isinstance(o, str):
        acc.append(o)
    elif isinstance(o, dict):
        for v in o.values():
            textos(v, acc)
    elif isinstance(o, list):
        for v in o:
            textos(v, acc)
    return acc


_cache = {}


def linhas(sessao):
    if sessao not in _cache:
        caminho = os.path.join(TRANSCRICOES, SESSOES[sessao] + ".jsonl")
        out = {}
        with open(caminho, encoding="utf-8") as f:
            for n, l in enumerate(f, 1):
                try:
                    out[n] = norm(" ".join(textos(json.loads(l), [])))
                except Exception:
                    out[n] = ""
        _cache[sessao] = out
    return _cache[sessao]


def achar(trecho, sessao, alvo):
    """Devolve ('NA_LINHA', n) | ('OUTRA_LINHA', [n...]) | ('NAO_ACHADA', [])."""
    partes = [norm(p) for p in re.split(r"…|\.\.\.", trecho) if len(norm(p)) >= 6]
    if not partes:
        return ("CURTA", [])
    L = linhas(sessao)
    for n in alvo:
        if all(p in L.get(n, "") for p in partes):
            return ("NA_LINHA", [n])
    outras = [n for n, t in L.items() if all(p in t for p in partes)]
    return ("OUTRA_LINHA", outras[:5]) if outras else ("NAO_ACHADA", [])


def itens():
    sessao_secao, na_lista = None, False
    for linha in open(DOC, encoding="utf-8"):
        # Só as tabelas do §3 (a lista completa); o §7, de resolução, também tem linhas "| DEC-".
        if linha.startswith("## "):
            na_lista = linha.startswith("## 3.")
        if not na_lista:
            continue
        m = re.match(r"### 3\.\d .*?\b([0-9a-f]{8})\b", linha)
        if m:
            sessao_secao = m.group(1)
        elif linha.startswith("### 3.5"):
            sessao_secao = None
        if not linha.startswith("| DEC-"):
            continue
        cols = [c.strip() for c in linha.strip().strip("|").split("|")]
        dec, ancora, citacao, classe = cols[0], cols[1], cols[2], cols[-1]
        # Cada Lnnn pertence à última sessão nomeada antes dele na âncora; sem nome, à da seção.
        alvos, atual = {}, sessao_secao
        for tok in re.finditer(r"\b([0-9a-f]{8})\b|L(\d+)", ancora):
            if tok.group(1):
                atual = tok.group(1) if tok.group(1) in SESSOES else atual
            elif atual:
                alvos.setdefault(atual, []).append(int(tok.group(2)))
        yield dec, classe, alvos, re.findall(r'"([^"]{6,})"', citacao)


def main():
    sys.stdout.reconfigure(encoding="utf-8")  # console do Windows não é UTF-8
    totais = {}
    for dec, classe, alvos, citacoes in itens():
        if not alvos:
            print(f"{dec:7} {classe[:24]:24} SEM_TRANSCRICAO (item de memória, fora das quatro sessões)")
            totais["SEM_TRANSCRICAO"] = totais.get("SEM_TRANSCRICAO", 0) + 1
            continue
        if not citacoes:
            print(f"{dec:7} {classe[:24]:24} SEM_CITACAO_LITERAL")
            totais["SEM_CITACAO_LITERAL"] = totais.get("SEM_CITACAO_LITERAL", 0) + 1
            continue
        res = []
        for c in citacoes:
            achado = None
            for s, ns in alvos.items():
                r = achar(c, s, ns)
                if r[0] == "NA_LINHA" or achado is None or (achado[0] == "NAO_ACHADA" and r[0] != "NAO_ACHADA"):
                    achado = (r[0], s, r[1])
                if r[0] == "NA_LINHA":
                    break
            res.append(achado)
        pior = "NA_LINHA"
        for r in res:
            if r[0] == "NAO_ACHADA":
                pior = "NAO_ACHADA"
            elif r[0] in ("OUTRA_LINHA", "CURTA") and pior == "NA_LINHA":
                pior = r[0]
        totais[pior] = totais.get(pior, 0) + 1
        det = "; ".join(f"{r[0]}@{r[1]}:{','.join(map(str, r[2])) or '-'}" for r in res)
        print(f"{dec:7} {classe[:24]:24} {pior:11} {len(citacoes)} citação(ões) — {det}")
    print("TOTAL:", totais)

    if "--controle" in sys.argv:
        inventada = "esta frase nunca foi dita pelo vicente em nenhuma sessao"
        real = "deixar na fila e seguir com o trabalho"
        a, b = achar(inventada, "27fac9ba", [359]), achar(real, "27fac9ba", [359])
        ok = a[0] == "NAO_ACHADA" and b[0] in ("NA_LINHA", "OUTRA_LINHA")
        print(f"CONTROLE: inventada={a[0]} real={b[0]}@{b[1]} -> {'OK' if ok else 'FALHOU'}")


if __name__ == "__main__":
    main()
