import json,re,unicodedata
R='C:/reviewbr/'
src=open(R+'reviewbr/reviewbr-mcp/src/services/mapping_coherence.ts',encoding='utf-8').read()
eq=dict()
for m in re.finditer(r'\["(\w+)",\s*\[([^\]]*)\]\]',src):
    eq[m.group(1)]=re.findall(r'"(\w+)"',m.group(2))
VAZ=set(re.findall(r'"(\w+)"',re.search(r'const VAZIAS = new Set\(\[(.*?)\]\);',src,re.S).group(1)))
def termos(t):
    t=unicodedata.normalize('NFD',t); t=''.join(ch for ch in t if not unicodedata.combining(ch)).lower()
    t=re.sub(r'[^a-z0-9\s]',' ',t)
    return {x for x in t.split() if len(x)>3 and x not in VAZ}
print('EQUIV keys',len(eq))
for sid in ['prisma-2020','prisma-p','prisma-s','prisma-scr']:
    s=json.load(open(R+f'.claude/standards/{sid}.json',encoding='utf-8'))
    tt=set(); te={}
    for i in s['items']:
        tt|=termos(i['title'])
        for w in termos(i.get('text','')): te[w]=te.get(w,0)+1
    print('==',sid)
    print(' titulos sem par:',sorted(w for w in tt if w not in eq))
    print(' titulos com par:',sorted(w for w in tt if w in eq))
    sem=sorted([(c,w) for w,c in te.items() if w not in eq],reverse=True)
    print(' enunciado: termos distintos',len(te),'sem par',len(sem))
    print(' top sem par:',[w for c,w in sem[:70]])
print('#### alcancaveis a partir de PT (valores do EQUIV):')
vals=set(v for vs in eq.values() for v in vs)
for sid in ['prisma-2020','prisma-p','prisma-s','prisma-scr']:
    s=json.load(open(R+f'.claude/standards/{sid}.json',encoding='utf-8'))
    tt=set()
    for i in s['items']: tt|=termos(i['title'])
    print(sid,'titulo EN sem PT que leve a ele:',sorted(w for w in tt if w not in vals))
print('VAZIAS',sorted(VAZ))
