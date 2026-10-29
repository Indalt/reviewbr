# -*- coding: utf-8 -*-
"""Almanaques, versao 3. Corrige dois erros das versoes anteriores:
 1) rotacao escolhida por PALAVRAS REAIS em portugues, nao por contagem bruta
    (contagem bruta premiava texto espelhado: 'opelgior Coauop sp nl opsfo');
 2) qualidade medida contra regua real (jornal=14,0%, livro=16,5%), nao por
    densidade de 'que', que mede volume e nao acerto.
Uso: python varre_alm_v3.py <ano> [<ano> ...]"""
import sys, io, os, json, re, urllib.request
import fitz, numpy as np, cv2
from PIL import Image
import pytesseract
pytesseract.pytesseract.tesseract_cmd = 'C:/Program Files/Tesseract-OCR/tesseract.exe'
os.environ['TESSDATA_PREFIX'] = 'C:/Users/alqui/tessdata'

LEX = set('''que para casa rua com uma como mais este esta pelo pela dos das nos nas
por seu sua ser tem foi sao nao ano anos dia rio sem ate onde entre todos toda
brasil piaui parnaiba teresina almanaque cidade estado norte sul praca avenida
telefone caixa postal deposito vendas preco precos generos produtos comercio
irmaos filhos cia limitada sociedade antonio jose joao maria francisco silva souza
santos oliveira pereira costa carvalho rodrigues almeida lima araujo fernandes
rica casas artigos fazendas secos molhados exportacao importacao vapor porto'''.split())
REGUA_JORNAL = 14.0

ANOS = sys.argv[1:]
BASE = r'C:\reviewbr\old\curso_alquimista\01_masterclass_historia\cajuina'
INV  = os.path.join(BASE, '02_busca_manual_pendente', 'ALMANAQUE_PARNAIBA_inventario.json')
OUT  = os.path.join(BASE, '02_busca_manual_pendente', 'ALMANAQUE_resultados.tsv')
CTLF = os.path.join(BASE, '02_busca_manual_pendente', 'ALMANAQUE_qualidade_v3.tsv')
CAJU = os.path.join(BASE, '02_busca_manual_pendente', 'ALMANAQUE_caju_contextos.tsv')
TMPD = os.path.join(os.environ['LOCALAPPDATA'], 'Temp', 'pi_ocr')
DONE = os.path.join(TMPD, 'almv3.json')

PAT  = re.compile(r'caju[ií]n|cajuin', re.I)
PATC = re.compile(r'caju\w*', re.I)
COM  = re.compile(r'vende|venda|fabric|deposit|litro|garrafa|pre[çc]o|armaz[ée]m|mercearia|r[ée]is|cruzeiro|industria|com[ée]rcio', re.I)

def lexico(t):
    p = re.findall(r'[a-zA-ZÀ-ÿ]{3,}', t.lower())
    if not p: return 0.0, 0
    return 100.0 * sum(1 for w in p if w in LEX) / len(p), len(p)

def melhor(pg):
    g = np.array(Image.open(io.BytesIO(pg.get_pixmap(dpi=300).tobytes("png"))).convert('L'))
    b = cv2.adaptiveThreshold(g, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 51, 20)
    base = Image.fromarray(b)
    mt, mr, ms = '', 0, -1.0
    for rot in (0, 180, 270, 90):
        im = base.rotate(rot, expand=True) if rot else base
        t = pytesseract.image_to_string(im, lang='por')
        s, n = lexico(t)
        if n < 20: continue                     # pagina quase vazia: ignora
        if s > ms: mt, mr, ms = t, rot, s
    return mt, mr

alm = {a['ano']: a for a in json.load(io.open(INV, encoding='utf-8'))}
feitos = json.load(io.open(DONE, encoding='utf-8')) if os.path.exists(DONE) else []
if not os.path.exists(CTLF):
    io.open(CTLF, 'w', encoding='utf-8').write(
        'ano\tpaginas\tchars\tpalavras\tpct_lexico\tvs_jornal\trot_dominante\tcaju\tcajuina\n')

print('=== ALMANAQUES v3 (criterio lexico) : %s ===' % ' '.join(ANOS), flush=True)
for ano in ANOS:
    if ano in feitos:
        print('[--] %s ja feito' % ano, flush=True); continue
    if ano not in alm:
        print('[--] %s fora do inventario' % ano, flush=True); continue
    tmp = os.path.join(TMPD, 'v3_%s.pdf' % ano)
    try:
        req = urllib.request.Request('https://drive.google.com/uc?export=download&id=' + alm[ano]['id'],
                                     headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=300) as r, io.open(tmp, 'wb') as w:
            w.write(r.read())
        doc = fitz.open(tmp); npg = doc.page_count
        txt = ''; rots = {}; hits = 0
        for n in range(npg):
            if n and n % 25 == 0:
                print('    .. %s pagina %d/%d' % (ano, n, npg), flush=True)
            t, rot = melhor(doc[n])
            txt += t; rots[rot] = rots.get(rot, 0) + 1
            for m in PAT.finditer(t):
                tr = re.sub(r'\s+', ' ', t[max(0, m.start()-250):m.end()+250])
                com = bool(COM.search(tr)); hits += 1
                io.open(OUT, 'a', encoding='utf-8').write(
                    chr(9).join([ano+'v3', str(n+1), 'SIM' if com else 'nao', tr, alm[ano]['id']]) + chr(10))
                print('%s ALMANAQUE %s p%d: %s' % ('*** ANUNCIO ***' if com else '(mencao)',
                      ano, n+1, tr[:200]), flush=True)
            for m in PATC.finditer(t):
                trc = re.sub(r'\s+', ' ', t[max(0, m.start()-200):m.end()+200])
                io.open(CAJU, 'a', encoding='utf-8').write(
                    chr(9).join([ano+'v3', str(n+1), m.group(0), trc]) + chr(10))
        doc.close(); os.remove(tmp)
        pct, npal = lexico(txt)
        ncaju = len(re.findall(r'caju', txt, re.I))
        dom = max(rots, key=rots.get) if rots else 0
        io.open(CTLF, 'a', encoding='utf-8').write(
            chr(9).join([ano, str(npg), str(len(txt)), str(npal), '%.1f' % pct,
                         '%.0f%%' % (100*pct/REGUA_JORNAL), str(dom), str(ncaju), str(hits)]) + chr(10))
        print('[ok] %s %dpgs | lexico=%.1f%% (%.0f%% da regua do jornal) | rot=%d (%d/%d) | caju=%d cajuina=%d'
              % (ano, npg, pct, 100*pct/REGUA_JORNAL, dom, rots.get(dom,0), npg, ncaju, hits), flush=True)
    except Exception as e:
        print('[ERRO] %s: %s %s' % (ano, type(e).__name__, str(e)[:70]), flush=True)
    feitos.append(ano)
    json.dump(feitos, io.open(DONE, 'w', encoding='utf-8'))
print('=== FIM v3 ===', flush=True)
