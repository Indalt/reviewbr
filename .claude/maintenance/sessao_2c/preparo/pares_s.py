import json,re,subprocess
R='C:/reviewbr/'
spec=open(R+'.claude/methodologies/prisma-sr/spec.md',encoding='utf-8').read()
rot={}; campo={}
for l in spec.splitlines():
    m=re.match(r'^\|\s*(F[0-9][A-Za-z0-9_.-]*)\s*\|',l)
    if not m: continue
    c=[x.strip() for x in l.split('|')[1:-1]]
    rot.setdefault(m.group(1),c[1])
    campo.setdefault(m.group(1),c)
json.dump(campo,open(r'%s/spec_cols.json'%'C:/Users/alqui/AppData/Local/Temp/claude/c--reviewbr/e5229a50-8b64-44b0-92d6-f34585b342d4/scratchpad/wf_2c/s2_controles','w',encoding='utf-8'),ensure_ascii=False,indent=0)
old=json.loads(subprocess.run(['git','-C',R,'show','d64067d:.claude/standards/prisma-s.json'],capture_output=True).stdout.decode('utf-8'))
new=json.load(open(R+'.claude/methodologies/prisma-sr/conformance/prisma-s.json',encoding='utf-8'))
std=json.load(open(R+'.claude/standards/prisma-s.json',encoding='utf-8'))
T={i['id']:i['title'] for i in std['items']}
newmap={}
for it in new['items']:
    for s in it['covered_by']: newmap.setdefault(s,[]).append(it['id'])
tot=mud=0; ret=[]; mov=[]; same=[]
for it in old['items']:
    for s in it['covered_by']:
        tot+=1
        dest=newmap.get(s,[])
        if it['id'] in dest: same.append((s,it['id'])); continue
        mud+=1
        lab=campo[s][2] if s.startswith('F1.2.') else rot.get(s)
        if dest: mov.append((s,lab,it['id'],T[it['id']],dest))
        else: ret.append((s,lab,it['id'],T[it['id']]))
print(tot,mud,'mov',len(mov),'ret',len(ret),'same',len(same))
print('SAME',same)
for x in mov: print('MOV',x[0],repr(x[1]),x[2],repr(x[3]),'->',x[4],[T[d] for d in x[4]])
for x in ret: print('RET',x[0],repr(x[1]),x[2],repr(x[3]))
