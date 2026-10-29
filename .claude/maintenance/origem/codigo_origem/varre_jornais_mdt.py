# -*- coding: utf-8 -*-
"""Baixa e varre os jornais comerciais do acervo MDT (pastas de JPG por pagina).
Baixa cada JPG, faz OCR com limiar adaptativo + melhor rotacao por lexico, e apaga.
Uso: python varre_jornais_mdt.py"""
import io, os, re, json, time, urllib.request
import numpy as np, cv2, fitz
from PIL import Image
import pytesseract
pytesseract.pytesseract.tesseract_cmd = 'C:/Program Files/Tesseract-OCR/tesseract.exe'
os.environ['TESSDATA_PREFIX'] = 'C:/Users/alqui/tessdata'
Image.MAX_IMAGE_PIXELS = None

BASE = r'C:\reviewbr\old\curso_alquimista\01_masterclass_historia\cajuina'
PAGS = os.path.join(BASE, '02_busca_manual_pendente', 'ACERVO_MDT_paginas.json')
OUT  = os.path.join(BASE, '02_busca_manual_pendente', 'JORNAIS_MDT_resultados.tsv')
CTL  = os.path.join(BASE, '02_busca_manual_pendente', 'JORNAIS_MDT_qualidade.tsv')
TMPD = os.path.join(os.environ['LOCALAPPDATA'], 'Temp', 'pi_ocr')
DONE = os.path.join(TMPD, 'jornais_mdt.json')

# escolhidos: perfil comercial
ALVOS = ['A Praça', 'O Monitor', 'A Voz do Trabalhador', 'O Tempo', 'O Commercio']

LEX = set('''que para casa rua com uma como mais este esta pelo pela dos das nos nas
por seu sua ser tem foi sao nao ano anos dia sem ate onde entre todos toda
brasil piaui parnaiba parnahyba teresina therezina cidade estado praca avenida
rica casa casas artigos generos seccos molhados estivas vende vendem venda
deposito preco precos litro garrafa caixa duzia kilo armazem mercearia mercado
commercio comercio negocio firma irmaos filhos cia limitada sociedade
antonio jose joao maria francisco silva souza santos oliveira pereira costa'''.split())
PAT  = re.compile(r'caju[ií]n|cajuin', re.I)
PATC = re.compile(r'caju\w*', re.I)
COM  = re.compile(r'vende|venda|fabric|deposit|litro|garrafa|pre[çc]o|armaz[ée]m|mercearia|r[ée]is|cruzeiro|industria|com[ée]rcio', re.I)

def lex(t):
    p = re.findall(r'[a-zA-ZÀ-ÿ]{3,}', t.lower())
    return (100.0*sum(1 for w in p if w in LEX)/len(p), len(p)) if p else (0.0, 0)

def ocr_pdf(caminho):
    """PDF de pagina unica ou multiplas: OCR de todas."""
    doc = fitz.open(caminho); out = ''
    for n in range(doc.page_count):
        g = np.array(Image.open(io.BytesIO(doc[n].get_pixmap(dpi=300).tobytes("png"))).convert('L'))
        b = cv2.adaptiveThreshold(g,255,cv2.ADAPTIVE_THRESH_GAUSSIAN_C,cv2.THRESH_BINARY,51,20)
        base = Image.fromarray(b); mt, ms = '', -1.0
        for rot in (0,180,270,90):
            x = base.rotate(rot,expand=True) if rot else base
            t = pytesseract.image_to_string(x,lang='por'); sc,n2 = lex(t)
            if n2 < 20: continue
            if sc > ms: mt, ms = t, sc
        out += mt
    doc.close(); return out

def ocr(caminho):
    if caminho.lower().endswith('.pdf') or io.open(caminho,'rb').read(4) == b'%PDF':
        return ocr_pdf(caminho)
    im = Image.open(caminho).convert('L')
    if max(im.size) > 4000:
        r = 4000.0/max(im.size); im = im.resize((int(im.width*r), int(im.height*r)))
    g = np.array(im)
    b = cv2.adaptiveThreshold(g,255,cv2.ADAPTIVE_THRESH_GAUSSIAN_C,cv2.THRESH_BINARY,51,20)
    base = Image.fromarray(b); mt, ms = '', -1.0
    for rot in (0,180,270,90):
        x = base.rotate(rot,expand=True) if rot else base
        t = pytesseract.image_to_string(x,lang='por'); s,n = lex(t)
        if n < 20: continue
        if s > ms: mt, ms = t, s
    return mt

d = json.load(io.open(PAGS, encoding='utf-8'))
sel = [v for v in d.values() if any(a.lower() in v['titulo'].lower() for a in ALVOS) and v['n'] > 0]
sel.sort(key=lambda v: -v['n'])
feitos = json.load(io.open(DONE, encoding='utf-8')) if os.path.exists(DONE) else []
if not os.path.exists(CTL):
    io.open(CTL,'w',encoding='utf-8').write('jornal\tpaginas\tchars\tlexico\tcaju\tcajuina\n')

print('=== JORNAIS COMERCIAIS MDT: %d titulos, %d paginas ===' %
      (len(sel), sum(v['n'] for v in sel)), flush=True)
for v in sel:
    print('--- %s (%d pgs) ---' % (v['titulo'][:60], v['n']), flush=True)
    txt = ''; hits = 0; lidas = 0
    for k, it in enumerate(v['itens']):
        chave = v['titulo'] + '|' + it['nome']
        if chave in feitos: continue
        tmp = os.path.join(TMPD, 'j_%s' % re.sub(r'[^\w.]','_',it['nome'])[:40])
        try:
            req = urllib.request.Request('https://drive.google.com/uc?export=download&id='+it['id'],
                                         headers={'User-Agent':'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=180) as r: b = r.read()
            if len(b) < 2000:
                print('    [pula] %s: %d bytes' % (it['nome'], len(b)), flush=True); continue
            io.open(tmp,'wb').write(b)
            t = ocr(tmp); txt += t; lidas += 1
            os.remove(tmp)
            for m in PAT.finditer(t):
                tr = re.sub(r'\s+',' ',t[max(0,m.start()-250):m.end()+250]); hits += 1
                com = bool(COM.search(tr))
                io.open(OUT,'a',encoding='utf-8').write(
                    chr(9).join([v['titulo'], it['nome'], 'SIM' if com else 'nao', tr])+chr(10))
                print('%s %s / %s: %s' % ('*** ANUNCIO ***' if com else '(mencao)',
                      v['titulo'][:30], it['nome'], tr[:200]), flush=True)
            for m in PATC.finditer(t):
                tr = re.sub(r'\s+',' ',t[max(0,m.start()-200):m.end()+200])
                io.open(OUT,'a',encoding='utf-8').write(
                    chr(9).join([v['titulo']+'|caju', it['nome'], 'caju', tr])+chr(10))
            if lidas and lidas % 20 == 0:
                print('    .. %s %d/%d' % (v['titulo'][:28], lidas, v['n']), flush=True)
        except Exception as e:
            print('    [ERRO] %s: %s' % (it['nome'], str(e)[:50]), flush=True)
        feitos.append(chave)
        if len(feitos) % 20 == 0: json.dump(feitos, io.open(DONE,'w',encoding='utf-8'))
    json.dump(feitos, io.open(DONE,'w',encoding='utf-8'))
    if lidas == 0:
        print('[--] %s: nada novo a ler (ja varrido)' % v['titulo'][:50], flush=True)
        continue
    pc,_ = lex(txt); ncaju = len(re.findall(r'caju',txt,re.I))
    io.open(CTL,'a',encoding='utf-8').write(
        chr(9).join([v['titulo'],str(lidas),str(len(txt)),'%.1f'%pc,str(ncaju),str(hits)])+chr(10))
    print('[ok] %-50s %3d pgs lexico=%.1f%% caju=%d cajuina=%d'
          % (v['titulo'][:50], lidas, pc, ncaju, hits), flush=True)
print('=== FIM JORNAIS MDT ===', flush=True)
