# -*- coding: utf-8 -*-
"""Baixa o acervo Mundos do Trabalho - Piaui (colecoes fora dos almanaques).
Verifica PDF valido, conta paginas, grava manifesto."""
import io, os, json, re, time, hashlib, urllib.request
import fitz
BASE = r'C:\reviewbr\old\curso_alquimista\01_masterclass_historia\cajuina'
INV  = os.path.join(BASE, '02_busca_manual_pendente', 'ACERVO_MundosDoTrabalho_inventario.json')
DEST = os.path.join(BASE, '01_fontes_primarias', 'acervo_mundos_do_trabalho')
MAN  = os.path.join(DEST, 'MANIFESTO.tsv')
ORDEM = ['CODIGOS_POSTURAS','CENSOS_ESTATISTICAS','ATAS_ASSOC_COMERCIAL','COPIADOR']
def limpa(s):
    s = re.sub(r'[^\w\s.()-]', '', s, flags=re.U)
    s = re.sub(r'\s+', '_', s.strip())
    return s[:90]
d = json.load(io.open(INV, encoding='utf-8'))
if not os.path.exists(MAN):
    os.makedirs(DEST, exist_ok=True)
    io.open(MAN, 'w', encoding='utf-8').write('colecao\ttitulo\tarquivo\tMB\tpaginas\tsha256\n')
feitos = set()
for l in io.open(MAN, encoding='utf-8'):
    c = l.rstrip('\n').split('\t')
    if len(c) >= 3 and c[0] != 'colecao': feitos.add(c[2])
tot = sum(len(d.get(k, [])) for k in ORDEM)
print('=== ACERVO MDT: %d documentos ===' % tot, flush=True)
ok = falha = 0
for col in ORDEM:
    itens = d.get(col, [])
    if not itens: continue
    pasta = os.path.join(DEST, col.lower())
    os.makedirs(pasta, exist_ok=True)
    print('--- %s (%d) ---' % (col, len(itens)), flush=True)
    for it in itens:
        nome = limpa(it['titulo']) + '.pdf'
        dest = os.path.join(pasta, nome)
        if nome in feitos and os.path.exists(dest):
            print('[--] %s' % it['titulo'][:60], flush=True); ok += 1; continue
        try:
            req = urllib.request.Request('https://drive.google.com/uc?export=download&id=' + it['id'],
                                         headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=300) as r: b = r.read()
            if not b.startswith(b'%PDF') and b'confirm' in b[:4000]:
                import re as _re
                tk = _re.search(rb'confirm=([\w-]+)', b)
                uu = _re.search(rb'action="([^"]+)"', b)
                if tk:
                    u2 = ('https://drive.usercontent.google.com/download?id=%s&export=download&confirm=%s'
                          % (it['id'], tk.group(1).decode()))
                    with urllib.request.urlopen(urllib.request.Request(
                            u2, headers={'User-Agent':'Mozilla/5.0'}), timeout=600) as r2:
                        b = r2.read()
            if not b.startswith(b'%PDF'):
                print('[ERRO] %s: nao e PDF (%d bytes)' % (it['titulo'][:50], len(b)), flush=True)
                falha += 1; continue
            io.open(dest, 'wb').write(b)
            doc = fitz.open(dest); npg = doc.page_count; doc.close()
            io.open(MAN, 'a', encoding='utf-8').write(chr(9).join([
                col, it['titulo'], nome, '%.1f' % (len(b)/1048576), str(npg),
                hashlib.sha256(b).hexdigest()[:16]]) + chr(10))
            print('[ok] %-58s %6.1f MB %4d pgs' % (it['titulo'][:58], len(b)/1048576, npg), flush=True)
            ok += 1; time.sleep(1)
        except Exception as e:
            print('[ERRO] %s: %s' % (it['titulo'][:50], str(e)[:60]), flush=True); falha += 1
print('=== FIM ACERVO: %d ok, %d falhas ===' % (ok, falha), flush=True)
