# -*- coding: utf-8 -*-
"""Baixa a serie completa do Almanack da Parnaiba do Drive orfao.
Verifica cada arquivo (PDF valido + paginas) e registra manifesto com tamanho e hash."""
import io, os, json, re, time, hashlib, urllib.request
import fitz

BASE = r'C:\reviewbr\old\curso_alquimista\01_masterclass_historia\cajuina'
INV  = os.path.join(BASE, '02_busca_manual_pendente', 'ALMANAQUE_PARNAIBA_inventario.json')
DEST = os.path.join(BASE, '01_fontes_primarias', 'almanaque_parnaiba', 'serie_completa')
MAN  = os.path.join(DEST, 'MANIFESTO.tsv')
os.makedirs(DEST, exist_ok=True)

alm = json.load(io.open(INV, encoding='utf-8'))
alm = [a for a in alm if a['ano'] != '?']
alm.sort(key=lambda a: int(a['ano']))

feitos = {}
if os.path.exists(MAN):
    for l in io.open(MAN, encoding='utf-8'):
        c = l.rstrip('\n').split('\t')
        if c[0] != 'ano' and len(c) >= 5: feitos[c[0]] = c
else:
    io.open(MAN, 'w', encoding='utf-8').write('ano\tarquivo\tMB\tpaginas\tsha256\n')

print('=== SERIE ALMANACK: %d volumes ===' % len(alm), flush=True)
ok = falha = 0
for a in alm:
    ano = a['ano']
    dest = os.path.join(DEST, 'Almanack_Parnahyba_%s.pdf' % ano)
    if ano in feitos and os.path.exists(dest):
        print('[--] %s ja baixado' % ano, flush=True); ok += 1; continue
    try:
        req = urllib.request.Request('https://drive.google.com/uc?export=download&id=' + a['id'],
                                     headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=300) as r:
            d = r.read()
        if not d.startswith(b'%PDF'):
            print('[ERRO] %s: nao e PDF (%d bytes) - talvez pagina de aviso do Drive' % (ano, len(d)), flush=True)
            falha += 1; continue
        io.open(dest, 'wb').write(d)
        doc = fitz.open(dest); npg = doc.page_count; doc.close()
        h = hashlib.sha256(d).hexdigest()[:16]
        io.open(MAN, 'a', encoding='utf-8').write(
            chr(9).join([ano, os.path.basename(dest), '%.1f' % (len(d)/1048576), str(npg), h]) + chr(10))
        print('[ok] %s  %.1f MB  %d pgs' % (ano, len(d)/1048576, npg), flush=True)
        ok += 1
        time.sleep(1)
    except Exception as e:
        print('[ERRO] %s: %s %s' % (ano, type(e).__name__, str(e)[:70]), flush=True)
        falha += 1
print('=== FIM SERIE: %d baixados, %d falhas ===' % (ok, falha), flush=True)
