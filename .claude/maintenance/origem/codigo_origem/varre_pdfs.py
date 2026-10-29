# -*- coding: utf-8 -*-
"""Varre PDFs do acervo MDT por cajuina, com controle positivo por documento.
Uso: python varre_pdfs.py <pasta>"""
import sys, io, os, re, json, glob
import fitz, numpy as np, cv2
from PIL import Image
import pytesseract
pytesseract.pytesseract.tesseract_cmd = 'C:/Program Files/Tesseract-OCR/tesseract.exe'
os.environ['TESSDATA_PREFIX'] = 'C:/Users/alqui/tessdata'
BASE = r'C:\reviewbr\old\curso_alquimista\01_masterclass_historia\cajuina'
OUT  = os.path.join(BASE, '02_busca_manual_pendente', 'ACERVO_MDT_resultados.tsv')
CTL  = os.path.join(BASE, '02_busca_manual_pendente', 'ACERVO_MDT_qualidade.tsv')
DONE = os.path.join(os.environ['LOCALAPPDATA'], 'Temp', 'pi_ocr', 'mdt_pdfs.json')
LEX = set('''que para casa rua com uma como mais este esta pelo pela dos das nos nas
por seu sua ser tem foi sao nao ano anos dia sem ate onde entre todos toda lei
brasil piaui parnaiba teresina cidade estado praca avenida artigo paragrafo
municipio camara intendente imposto taxa licenca multa venda vender generos
bebidas alcool agua leite carne pao mercado feira acougue armazem casas
irmaos filhos cia antonio jose joao maria francisco silva souza santos'''.split())
PAT  = re.compile(r'caju[ií]n|cajuin', re.I)
PATC = re.compile(r'caju\w*', re.I)
def lex(t):
    p = re.findall(r'[a-zA-ZÀ-ÿ]{3,}', t.lower())
    return (100.0*sum(1 for w in p if w in LEX)/len(p), len(p)) if p else (0.0, 0)
def melhor(pg):
    g = np.array(Image.open(io.BytesIO(pg.get_pixmap(dpi=300).tobytes("png"))).convert('L'))
    b = cv2.adaptiveThreshold(g,255,cv2.ADAPTIVE_THRESH_GAUSSIAN_C,cv2.THRESH_BINARY,51,20)
    base = Image.fromarray(b); mt,ms = '',-1.0
    for rot in (0,180,270,90):
        im = base.rotate(rot,expand=True) if rot else base
        t = pytesseract.image_to_string(im,lang='por')
        s,n = lex(t)
        if n<20: continue
        if s>ms: mt,ms = t,s
    return mt
feitos = json.load(io.open(DONE,encoding='utf-8')) if os.path.exists(DONE) else []
if not os.path.exists(CTL):
    io.open(CTL,'w',encoding='utf-8').write('documento\tpaginas\tchars\tlexico\tcaju\tcajuina\n')
arqs = sorted(glob.glob(os.path.join(sys.argv[1],'**','*.pdf'), recursive=True))
print('=== VARREDURA MDT: %d PDFs ===' % len(arqs), flush=True)
for a in arqs:
    nome = os.path.basename(a)
    if nome in feitos: print('[--] %s' % nome[:55], flush=True); continue
    try:
        doc = fitz.open(a); npg = doc.page_count; txt=''; hits=0
        for n in range(npg):
            if n and n%25==0: print('    .. %s pag %d/%d'%(nome[:30],n,npg), flush=True)
            t = melhor(doc[n]); txt += t
            for m in PAT.finditer(t):
                tr = re.sub(r'\s+',' ',t[max(0,m.start()-250):m.end()+250]); hits+=1
                io.open(OUT,'a',encoding='utf-8').write(chr(9).join([nome,str(n+1),tr])+chr(10))
                print('*** ACHADO *** %s p%d: %s'%(nome[:40],n+1,tr[:200]), flush=True)
            for m in PATC.finditer(t):
                tr = re.sub(r'\s+',' ',t[max(0,m.start()-200):m.end()+200])
                io.open(OUT,'a',encoding='utf-8').write(chr(9).join([nome+'|caju',str(n+1),tr])+chr(10))
        doc.close()
        pc,_ = lex(txt); ncaju = len(re.findall(r'caju',txt,re.I))
        io.open(CTL,'a',encoding='utf-8').write(chr(9).join([nome,str(npg),str(len(txt)),'%.1f'%pc,str(ncaju),str(hits)])+chr(10))
        print('[ok] %-50s %3dpgs lexico=%.1f%% caju=%d cajuina=%d'%(nome[:50],npg,pc,ncaju,hits), flush=True)
    except Exception as e:
        print('[ERRO] %s: %s'%(nome[:40],str(e)[:60]), flush=True)
    feitos.append(nome); json.dump(feitos,io.open(DONE,'w',encoding='utf-8'))
print('=== FIM VARREDURA MDT ===', flush=True)
