# -*- coding: utf-8 -*-
"""Varre TODAS as paginas de TODOS os jornais piauienses de uma decada, procurando
o vocabulo cajuina — alvo: anuncios de fabricacao/venda, que ficam nas paginas internas.
Uso: python varre_anuncio.py <DECADA>
"""
import pytesseract, fitz, io, re, os, sys, csv, json, urllib.request, urllib.parse, warnings
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
warnings.filterwarnings('ignore')
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
os.environ['TESSDATA_PREFIX'] = r'C:/Users/alqui/tessdata'

BASE = r'C:\reviewbr\old\curso_alquimista\01_masterclass_historia\cajuina\02_busca_manual_pendente'
INV = os.path.join(BASE, 'PIAUI_inventario_pdfs.tsv')
OUT = os.path.join(BASE, 'PIAUI_anuncios_resultados.tsv')

DEC = sys.argv[1]
TMPDIR = os.path.join(os.environ['LOCALAPPDATA'], 'Temp', 'pi_ocr')
TMP = os.path.join(TMPDIR, 'anun_' + DEC + '.pdf')
DONE = os.path.join(TMPDIR, 'anun_' + DEC + '.json')

# vocabulo alvo, tolerante a erro de OCR
PAT = re.compile(r'caj[uüo][ií1l]?n[haos]?', re.I)
# contexto comercial: se o vocabulo aparecer perto disso, e anuncio
COM = re.compile(r'vende|venda|fabric|deposito|dep.sito|litro|garrafa|pre[cç]o|casa\s|loja|arma[zs]em|mercearia|bar\b|r[eé]is|cruzeiro', re.I)


def dkey(d):
    p = d.split('/')
    return (p[2], p[1], p[0]) if len(p) == 3 else ('9999', '99', '99')


rows = [r for r in csv.DictReader(io.open(INV, encoding='utf-8'), delimiter='\t')
        if r['decada'] == DEC and r['url'].startswith('http')]
rows.sort(key=lambda r: dkey(r['data']))
feitos = json.load(io.open(DONE, encoding='utf-8')) if os.path.exists(DONE) else []
if not os.path.exists(OUT):
    io.open(OUT, 'w', encoding='utf-8').write('data\ttitulo\tedicao\tpagina\tcomercial\ttrecho\turl\n')

print('=== ANUNCIOS %s: %d edicoes, %d ja feitas ===' % (DEC, len(rows), len(feitos)), flush=True)
for r in rows:
    if r['url'] in feitos:
        continue
    try:
        req = urllib.request.Request(urllib.parse.quote(r['url'], safe=':/?=&%'),
                                     headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=300) as resp, io.open(TMP, 'wb') as w:
            w.write(resp.read())
        doc = fitz.open(TMP)
        npg = doc.page_count
        hits = 0
        for n in range(npg):                      # TODAS as paginas
            img = Image.open(io.BytesIO(doc[n].get_pixmap(dpi=150).tobytes("png")))
            t = pytesseract.image_to_string(img, lang="por")
            for m in PAT.finditer(t):
                ini, fim = max(0, m.start() - 200), m.end() + 200
                tr = re.sub(r'\s+', ' ', t[ini:fim])
                comercial = bool(COM.search(tr))
                io.open(OUT, 'a', encoding='utf-8').write(
                    "%s\t%s\t%s\t%d\t%s\t%s\t%s\n" % (r['data'], r['titulo'], r['edicao'], n + 1,
                                                      'SIM' if comercial else 'nao', tr, r['url']))
                hits += 1
                tag = '*** ANUNCIO ***' if comercial else '(mencao)'
                print('%s %s | %s ed%s p%d: %s' % (tag, r['data'], r['titulo'][:22], r['edicao'], n + 1, tr[:190]), flush=True)
        doc.close()
        print('[ok] %s %s ed%s %dpgs hits=%d' % (r['data'], r['titulo'][:22], r['edicao'], npg, hits), flush=True)
    except Exception as e:
        print('[ERRO] %s %s: %s %s' % (r['data'], r['titulo'][:22], type(e).__name__, str(e)[:60]), flush=True)
    feitos.append(r['url'])
    json.dump(feitos, io.open(DONE, 'w', encoding='utf-8'))
print('=== FIM ANUNCIOS %s: %d/%d ===' % (DEC, len(feitos), len(rows)), flush=True)
