# -*- coding: utf-8 -*-
"""Varre os Almanaques da Parnaiba (Google Drive) por cajuina.
Uso: python varre_almanaque.py <ANO_INI> <ANO_FIM>
Registra CONTROLE POSITIVO por edicao: se os controles vierem zerados, o zero nao vale."""
import sys, io, os, json, re, urllib.request
import fitz
import numpy as np
import cv2
from PIL import Image
import pytesseract
pytesseract.pytesseract.tesseract_cmd = 'C:/Program Files/Tesseract-OCR/tesseract.exe'
os.environ['TESSDATA_PREFIX'] = 'C:/Users/alqui/tessdata'

INI, FIM = int(sys.argv[1]), int(sys.argv[2])
BASE = r'C:\reviewbr\old\curso_alquimista\01_masterclass_historia\cajuina'
INV  = os.path.join(BASE, '02_busca_manual_pendente', 'ALMANAQUE_PARNAIBA_inventario.json')
OUT  = os.path.join(BASE, '02_busca_manual_pendente', 'ALMANAQUE_resultados.tsv')
CTLF = os.path.join(BASE, '02_busca_manual_pendente', 'ALMANAQUE_controle.tsv')
TMPDIR = os.path.join(os.environ['LOCALAPPDATA'], 'Temp', 'pi_ocr')
TMP  = os.path.join(TMPDIR, 'almB_%d_%d.pdf' % (INI, FIM))
DONE = os.path.join(TMPDIR, 'almB_%d_%d.json' % (INI, FIM))

def prep(pg):
    """300 dpi + cinza + limiar adaptativo gaussiano.
    Testado contra: cru, Otsu, CLAHE, denoise. adapt51 deu 14x mais palavras
    que o cru nestes digitalizados de baixo contraste (CamScanner, ~77 dpi de origem)."""
    px = pg.get_pixmap(dpi=300)
    g = np.array(Image.open(io.BytesIO(px.tobytes("png"))).convert('L'))
    b = cv2.adaptiveThreshold(g, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 51, 20)
    return Image.fromarray(b)

PAT = re.compile(r'caju[ií]n|cajuin', re.I)
PATCAJU = re.compile(r'caju\w*', re.I)
OUTCAJU = os.path.join(BASE, '02_busca_manual_pendente', 'ALMANAQUE_caju_contextos.tsv')
COM = re.compile(r'vende|venda|fabric|deposit|dep[óo]sito|litro|garrafa|pre[çc]o|casa\s|armaz[ée]m|mercearia|r[ée]is|cruzeiro|industria|f[áa]brica|comercio|com[ée]rcio', re.I)
CTL = ['Parna', 'Piau', 'que', 'para', 'casa', 'rua']

alm = json.load(io.open(INV, encoding='utf-8'))
alvo = [a for a in alm if a['ano'] != '?' and INI <= int(a['ano']) <= FIM]
alvo.sort(key=lambda a: int(a['ano']))
feitos = json.load(io.open(DONE, encoding='utf-8')) if os.path.exists(DONE) else []
if not os.path.exists(CTLF):
    io.open(CTLF, 'w', encoding='utf-8').write('ano\tpaginas\tchars\t' + '\t'.join(CTL) + '\tcaju\tcajuina\n')

print('=== ALMANAQUE %d-%d: %d edicoes, %d ja feitas ===' % (INI, FIM, len(alvo), len(feitos)), flush=True)
for a in alvo:
    if a['id'] in feitos:
        continue
    try:
        url = 'https://drive.google.com/uc?export=download&id=' + a['id']
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=300) as resp, io.open(TMP, 'wb') as w:
            w.write(resp.read())
        doc = fitz.open(TMP)
        npg = doc.page_count
        txt_all = ''
        hits = 0
        for n in range(npg):
            if n and n % 25 == 0:
                print('    .. %s pagina %d/%d' % (a['ano'], n, npg), flush=True)
            t = pytesseract.image_to_string(prep(doc[n]), lang="por")
            txt_all += t
            for m in PAT.finditer(t):
                tr = re.sub(r'\s+', ' ', t[max(0, m.start()-250):m.end()+250])
                comercial = bool(COM.search(tr))
                io.open(OUT, 'a', encoding='utf-8').write(
                    "%s\t%d\t%s\t%s\t%s\n" % (a['ano'], n+1, 'SIM' if comercial else 'nao', tr, a['id']))
                hits += 1
                print('%s ALMANAQUE %s p%d: %s' % ('*** ANUNCIO ***' if comercial else '(mencao)',
                      a['ano'], n+1, tr[:200]), flush=True)
            for m in PATCAJU.finditer(t):
                trc = re.sub(r'\s+', ' ', t[max(0, m.start()-200):m.end()+200])
                io.open(OUTCAJU, 'a', encoding='utf-8').write(
                    chr(9).join([a['ano'], str(n+1), m.group(0), trc]) + chr(10))
        doc.close()
        c = {k: len(re.findall(k, txt_all, re.I)) for k in CTL}
        ncaju = len(re.findall(r'caju', txt_all, re.I))
        io.open(CTLF, 'a', encoding='utf-8').write('%s\t%d\t%d\t%s\t%d\t%d\n' % (
            a['ano'], npg, len(txt_all), '\t'.join(str(c[k]) for k in CTL), ncaju, hits))
        ok = 'OCR-OK' if c['que'] > 30 else '!!OCR-FRACO!!'
        print('[ok] %s %dpgs %dchars | %s | %s | caju=%d cajuina=%d' % (
            a['ano'], npg, len(txt_all), ok,
            ' '.join('%s=%d' % (k, c[k]) for k in CTL), ncaju, hits), flush=True)
    except Exception as e:
        print('[ERRO] %s: %s %s' % (a['ano'], type(e).__name__, str(e)[:70]), flush=True)
    feitos.append(a['id'])
    json.dump(feitos, io.open(DONE, 'w', encoding='utf-8'))
print('=== FIM ALMANAQUE %d-%d: %d/%d ===' % (INI, FIM, len(feitos), len(alvo)), flush=True)
