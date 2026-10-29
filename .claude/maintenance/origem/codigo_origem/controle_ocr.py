# -*- coding: utf-8 -*-
"""Controle positivo do OCR: reprocessa amostra e conta termos que DEVEM existir."""
import sys, io, os, json, re, random, urllib.request, urllib.parse
import fitz
from PIL import Image
import pytesseract
pytesseract.pytesseract.tesseract_cmd = 'C:/Program Files/Tesseract-OCR/tesseract.exe'
os.environ['TESSDATA_PREFIX'] = r'C:/Users/alqui/tessdata'
DEC = sys.argv[1]; N = int(sys.argv[2]) if len(sys.argv) > 2 else 5
TMPDIR = os.path.join(os.environ['LOCALAPPDATA'], 'Temp', 'pi_ocr')
TMP = os.path.join(TMPDIR, 'ctl_' + DEC + '.pdf')
INV = r'C:\reviewbr\old\curso_alquimista\01_masterclass_historia\cajuina\02_busca_manual_pendente\PIAUI_inventario_pdfs.tsv'
rows = []
with io.open(INV, encoding='utf-8') as f:
    hdr = f.readline().rstrip('\n').split('\t')
    for ln in f:
        p = ln.rstrip('\n').split('\t')
        if len(p) < len(hdr): continue
        r = dict(zip(hdr, p))
        if r['decada'] == DEC and r['url'].startswith('http'): rows.append(r)
random.seed(42); amostra = random.sample(rows, min(N, len(rows)))
CTL = ['Teresina','Piau','que','para','casa','rua']
ALVO = ['cajuin','caju','refrigerante','guaran','fabrica','vende']
tot = {k:0 for k in CTL+ALVO}; pgs = 0
print('=== CONTROLE OCR %s: %d edicoes amostradas ===' % (DEC, len(amostra)), flush=True)
for r in amostra:
    try:
        req = urllib.request.Request(urllib.parse.quote(r['url'], safe=':/?=&%'),
                                     headers={'User-Agent':'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=300) as resp, io.open(TMP,'wb') as w:
            w.write(resp.read())
        doc = fitz.open(TMP)
        txt = ''
        for n in range(doc.page_count):
            img = Image.open(io.BytesIO(doc[n].get_pixmap(dpi=150).tobytes("png")))
            txt += pytesseract.image_to_string(img, lang="por"); pgs += 1
        doc.close()
        c = {k: len(re.findall(k, txt, re.I)) for k in CTL+ALVO}
        for k in c: tot[k] += c[k]
        print('%s %s ed%s: chars=%d | %s' % (r['data'], r['titulo'][:20], r['edicao'], len(txt),
              ' '.join('%s=%d'%(k,c[k]) for k in CTL)), flush=True)
    except Exception as e:
        print('[ERRO] %s: %s' % (r['data'], str(e)[:60]), flush=True)
print('\n=== TOTAL (%d paginas) ===' % pgs)
print('CONTROLE:', ' '.join('%s=%d'%(k,tot[k]) for k in CTL))
print('ALVO    :', ' '.join('%s=%d'%(k,tot[k]) for k in ALVO))
veredicto = 'OCR VALIDO' if tot['que'] > 50 and tot['Teresina'] > 0 else 'OCR SUSPEITO - ZERO NAO CONFIAVEL'
print('VEREDICTO:', veredicto)
