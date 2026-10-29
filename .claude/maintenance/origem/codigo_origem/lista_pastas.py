# -*- coding: utf-8 -*-
"""Lista o conteudo das pastas do Drive do acervo MDT via embeddedfolderview
(endpoint publico, sem autenticacao). Os itens sao JPGs por pagina, nao PDFs."""
import io, os, re, json, time, urllib.request
BASE = r'C:\reviewbr\old\curso_alquimista\01_masterclass_historia\cajuina'
INV  = os.path.join(BASE, '02_busca_manual_pendente', 'ACERVO_MundosDoTrabalho_inventario.json')
OUT  = os.path.join(BASE, '02_busca_manual_pendente', 'ACERVO_MDT_paginas.json')
def lista(fid):
    u = 'https://drive.google.com/embeddedfolderview?id=%s#list' % fid
    r = urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent':'Mozilla/5.0'}), timeout=120)
    s = r.read().decode('utf-8', errors='replace')
    tit = re.findall(r'<div class="flip-entry-title">([^<]+)</div>', s)
    ids = re.findall(r'id="entry-([\w-]{20,})"', s)
    return [{'nome':t,'id':i} for t,i in zip(tit,ids)]
d = json.load(io.open(INV, encoding='utf-8'))
res = json.load(io.open(OUT, encoding='utf-8')) if os.path.exists(OUT) else {}
for col in ['JORNAIS','CODIGOS_POSTURAS','CENSOS_ESTATISTICAS','ATAS_ASSOC_COMERCIAL',
            'RELATORIOS_PRESIDENTES','COPIADOR']:
    for it in d.get(col, []):
        chave = col + '|' + it['titulo']
        if chave in res: continue
        try:
            itens = lista(it['id'])
            res[chave] = {'id':it['id'], 'colecao':col, 'titulo':it['titulo'],
                          'n':len(itens), 'itens':itens}
            ext = {}
            for x in itens:
                e = x['nome'].rsplit('.',1)[-1].lower() if '.' in x['nome'] else '?'
                ext[e] = ext.get(e,0)+1
            print('[ok] %-58s %4d itens %s' % (it['titulo'][:58], len(itens),
                  ' '.join('%s=%d'%(k,v) for k,v in sorted(ext.items(), key=lambda kv:-kv[1])[:3])), flush=True)
            json.dump(res, io.open(OUT,'w',encoding='utf-8'), ensure_ascii=False)
            time.sleep(1)
        except Exception as e:
            print('[ERRO] %s: %s' % (it['titulo'][:50], str(e)[:60]), flush=True)
tot = sum(v['n'] for v in res.values())
print('=== FIM LISTAGEM: %d pastas, %d paginas no total ===' % (len(res), tot), flush=True)
