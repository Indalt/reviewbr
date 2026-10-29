# -*- coding: utf-8 -*-
"""Gera painel HTML do estado das varreduras. Roda sozinho a cada 60s."""
import io, os, re, json, time, glob, datetime
P = os.path.join(os.environ['LOCALAPPDATA'], 'Temp', 'pi_ocr')
BASE = r'C:\reviewbr\old\curso_alquimista\01_masterclass_historia\cajuina'
SAIDA = os.path.join(BASE, 'PAINEL.html')

FRENTES = [
    ('anun1930', 'Jornais do Piauí — 1930', 105),
    ('anun1940', 'Jornais do Piauí — 1940', 102),
    ('anun1950', 'Jornais do Piauí — 1950', 98),
    ('anun1960', 'Jornais do Piauí — 1960', 53),
    ('almC',     'Almanaques da Parnaíba 1924-1950', 27),
]

def ler(nome, total):
    f = os.path.join(P, nome + '.log')
    if not os.path.exists(f):
        return dict(feitas=0, total=total, achados=0, erros=0, ultima='—', ativo=False, pgs=0)
    s = io.open(f, encoding='utf-8', errors='replace').read()
    feitas = len(re.findall(r'^\[ok\]', s, re.M))
    achados = len(re.findall(r'^\*\*\* ANUNCIO|^\(mencao\)', s, re.M))
    erros = len(re.findall(r'^\[ERRO\]', s, re.M))
    pgs = sum(int(x) for x in re.findall(r'(\d+)pgs', s))
    ult = re.findall(r'^\[ok\] (.+)$', s, re.M)
    fim = '=== FIM' in s
    mtime = os.path.getmtime(f)
    ativo = (time.time() - mtime) < 300 and not fim
    return dict(feitas=feitas, total=total, achados=achados, erros=erros,
                ultima=(ult[-1][:60] if ult else '—'), ativo=ativo, fim=fim, pgs=pgs,
                idade=int(time.time()-mtime))

dados = [(nome, rot, ler(nome, tot)) for nome, rot, tot in FRENTES]
tot_pgs = sum(d['pgs'] for _,_,d in dados)
tot_ach = sum(d['achados'] for _,_,d in dados)
agora = datetime.datetime.now().strftime('%d/%m/%Y %H:%M:%S')

linhas = []
for nome, rot, d in dados:
    pct = 100.0*d['feitas']/max(1,d['total'])
    if d.get('fim'): est, cor = 'concluída', '#2d6a4f'
    elif d['ativo']: est, cor = 'rodando', '#1d4ed8'
    else: est, cor = 'parada (%dmin)' % (d['idade']//60), '#9a3412'
    linhas.append(f"""<tr>
<td><b>{rot}</b><br><span class=u>{d['ultima']}</span></td>
<td class=n>{d['feitas']}/{d['total']}<div class=bar><i style="width:{pct:.0f}%"></i></div></td>
<td class=n>{d['pgs']}</td>
<td class=n style="color:{'#b91c1c' if d['achados'] else '#555'};font-weight:{'700' if d['achados'] else '400'}">{d['achados']}</td>
<td class=n>{d['erros']}</td>
<td style="color:{cor};font-weight:600">{est}</td></tr>""")

html = f"""<!doctype html><meta charset=utf-8>
<meta http-equiv=refresh content=60>
<title>Cajuína — varreduras</title>
<style>
body{{font:14px/1.5 system-ui,sans-serif;margin:0;background:#faf9f7;color:#1a1a1a}}
.w{{max-width:940px;margin:0 auto;padding:28px 20px}}
h1{{font-size:20px;margin:0 0 4px}}
.sub{{color:#666;font-size:13px;margin-bottom:22px}}
table{{border-collapse:collapse;width:100%;background:#fff;border:1px solid #e5e3df}}
th{{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#777;
padding:9px 12px;border-bottom:1px solid #e5e3df;font-weight:600}}
td{{padding:11px 12px;border-bottom:1px solid #f0efec;vertical-align:top}}
td.n{{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}}
.u{{color:#888;font-size:11px}}
.bar{{height:3px;background:#e8e6e1;margin-top:5px;border-radius:2px;overflow:hidden}}
.bar i{{display:block;height:100%;background:#1d4ed8}}
.tot{{margin-top:20px;padding:14px 16px;background:#fff;border:1px solid #e5e3df;
display:flex;gap:32px;flex-wrap:wrap}}
.tot div span{{display:block;font-size:11px;color:#777;text-transform:uppercase;letter-spacing:.05em}}
.tot div b{{font-size:22px;font-variant-numeric:tabular-nums}}
.nota{{margin-top:18px;font-size:12px;color:#666;line-height:1.6}}
@media(prefers-color-scheme:dark){{
body{{background:#151513;color:#e8e6e1}} table,.tot{{background:#1e1e1c;border-color:#333}}
td{{border-color:#2a2a28}} th{{border-color:#333;color:#999}} .u{{color:#777}}
.bar{{background:#333}} .nota{{color:#999}}}}
</style>
<div class=w>
<h1>Cajuína — estado das varreduras</h1>
<div class=sub>atualizado {agora} · recarrega sozinho a cada minuto</div>
<table>
<tr><th>frente</th><th>edições</th><th>páginas</th><th>achados</th><th>erros</th><th>estado</th></tr>
{''.join(linhas)}
</table>
<div class=tot>
<div><span>páginas lidas</span><b>{tot_pgs}</b></div>
<div><span>ocorrências de cajuína</span><b style="color:{'#b91c1c' if tot_ach else 'inherit'}">{tot_ach}</b></div>
</div>
<div class=nota>
Cada frente lê <b>todas as páginas</b> de cada edição, não só capa e contracapa.<br>
Um achado aparece marcado <b>*** ANUNCIO ***</b> quando o contexto traz palavra de
comércio (vende, fabrica, preço, litro, garrafa), e <b>(menção)</b> quando não traz.<br>
Zero só vale com controle positivo: ver <b>PIAUI_RESULTADO_JORNAIS.md</b>.
</div>
</div>"""
io.open(SAIDA, 'w', encoding='utf-8').write(html)

# --- versao Markdown, para pre-visualizar dentro do editor ---
md = ['# Cajuina - estado das varreduras', '',
      '*atualizado ' + agora + '*', '',
      '| frente | edicoes | paginas | achados | erros | estado |',
      '|---|---:|---:|---:|---:|---|']
for nome, rot, d in dados:
    if d.get('fim'): est = 'concluida'
    elif d['ativo']: est = '**rodando**'
    else: est = 'parada (' + str(d['idade']//60) + 'min)'
    ach = ('**' + str(d['achados']) + '**') if d['achados'] else '0'
    md.append('| ' + rot + ' | ' + str(d['feitas']) + '/' + str(d['total']) +
              ' | ' + str(d['pgs']) + ' | ' + ach + ' | ' + str(d['erros']) + ' | ' + est + ' |')
md += ['', '**' + str(tot_pgs) + ' paginas lidas** | **' + str(tot_ach) + ' ocorrencias de cajuina**', '',
       'Ultima edicao processada por frente:', '']
for nome, rot, d in dados:
    md.append('- ' + rot + ': `' + d['ultima'] + '`')
md += ['', '---', '',
       'Cada frente le *todas as paginas* de cada edicao, nao so capa e contracapa.',
       'Zero so vale com controle positivo - ver `PIAUI_RESULTADO_JORNAIS.md`.']
io.open(os.path.join(BASE, 'PAINEL.md'), 'w', encoding='utf-8').write(chr(10).join(md))
