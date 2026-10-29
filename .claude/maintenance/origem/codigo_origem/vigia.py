# -*- coding: utf-8 -*-
"""Vigia as varreduras: se um log parar de crescer, mata o processo e reinicia.
Registra tudo em vigia.log para auditoria."""
import io, os, re, time, subprocess, datetime
P = os.path.join(os.environ['LOCALAPPDATA'], 'Temp', 'pi_ocr')
TMP = os.path.join(os.environ['LOCALAPPDATA'], 'Temp')
LOG = os.path.join(P, 'vigia.log')
LIMITE = 2700         # 45 min sem QUALQUER escrita (ha batimento por pagina)
TAREFAS = [
    ('almC.log',     'varre_almanaque.py', ['varre_almanaque.py', '1924', '1950']),
    ('anun1930.log', 'varre_anuncio.py 1930', ['varre_anuncio.py', '1930']),
    ('anun1940.log', 'varre_anuncio.py 1940', ['varre_anuncio.py', '1940']),
    ('anun1950.log', 'varre_anuncio.py 1950', ['varre_anuncio.py', '1950']),
    ('anun1960.log', 'varre_anuncio.py 1960', ['varre_anuncio.py', '1960']),
]
def reg(m):
    io.open(LOG, 'a', encoding='utf-8').write(
        datetime.datetime.now().strftime('%d/%m %H:%M:%S') + '  ' + m + chr(10))
def pids(assinatura):
    o = subprocess.run(['wmic','process','where',"name='python.exe'",
                        'get','ProcessId,CommandLine','/format:csv'],
                       capture_output=True, text=True).stdout
    r = []
    for l in o.splitlines():
        if assinatura in l:
            p = l.strip().split(',')
            if p and p[-1].isdigit(): r.append(int(p[-1]))
    return r
reg('vigia iniciado (limite %ds sem escrita)' % LIMITE)
while True:
    for log, assin, cmd in TAREFAS:
        f = os.path.join(P, log)
        if not os.path.exists(f):
            continue
        s = io.open(f, encoding='utf-8', errors='replace').read()
        if '=== FIM' in s:                       # ja terminou
            continue
        parado = time.time() - os.path.getmtime(f)
        vivos = pids(assin)
        if parado > LIMITE and vivos:
            for pid in vivos:
                subprocess.run(['taskkill','/PID',str(pid),'/F'],
                               capture_output=True)
            reg('TRAVADO %s (%.0fs sem escrever) - matei %s e reiniciei' %
                (log, parado, vivos))
            with io.open(f, 'a', encoding='utf-8') as w:
                subprocess.Popen(['python','-u'] + cmd, cwd=TMP, stdout=w,
                                 stderr=subprocess.STDOUT,
                                 creationflags=subprocess.DETACHED_PROCESS)
        elif parado > LIMITE and not vivos:
            reg('MORTO %s (%.0fs) - reiniciei' % (log, parado))
            with io.open(f, 'a', encoding='utf-8') as w:
                subprocess.Popen(['python','-u'] + cmd, cwd=TMP, stdout=w,
                                 stderr=subprocess.STDOUT,
                                 creationflags=subprocess.DETACHED_PROCESS)
    time.sleep(120)
