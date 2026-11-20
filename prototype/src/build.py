# Gera os arquivos finais a partir de src/:
#   prototype/index.html        -> protótipo que roda só no navegador (dados no localStorage)
#   server/public/app.html      -> SAC ligado ao servidor
#   server/public/w.html        -> janela de chat do cliente (dentro do iframe do widget)
#   server/public/widget.js     -> código que os sites carregam
#   server/public/demo.html     -> site de demonstração com o widget real
import json, re, os, shutil
here = os.path.dirname(os.path.abspath(__file__))
os.chdir(here)
pub = os.path.join(here, '..', '..', 'server', 'public')
os.makedirs(pub, exist_ok=True)

rows = []
for ln in open('tr.txt', encoding='utf8'):
    ln = ln.rstrip('\n')
    if not ln.strip():
        continue
    p = [x.strip() for x in ln.split(' || ')]
    assert len(p) == 5, ln
    rows.append(p)

src = ''.join(open(f, encoding='utf8').read() for f in ['app.js', 'tail.js', 'guide3.js', 'net.js', 'w.js'])
keys = set(re.findall(r"\bt\('((?:[^'\\]|\\.)*)'", src))
keys |= set(re.findall(r"(?:sys|assign)\([^,]+,(?:[^,]+,)?'((?:[^'\\]|\\.)*)'", src))
keys |= set(re.findall(r"assign\(c,(?:n|null|to),'((?:[^'\\]|\\.)*)'", src))
srv = ''.join(open(os.path.join(here, '..', '..', 'server', 'src', f), encoding='utf8').read() for f in ['core.js', 'index.js'])
keys |= set(re.findall(r"fail\('((?:[^'\\]|\\.)*)'", srv))
keys |= set(re.findall(r"error: '((?:[^'\\]|\\.)*)'", srv))
keys |= set(re.findall(r"this\.(?:sys|assign)\([^,]+,(?:[^,]+, )?'((?:[^'\\]|\\.)*)'", srv))
have = {r[0] for r in rows}
missing = sorted(k for k in keys - have if not k.startswith('{'))
print('missing', set(missing))
for r in rows:
    ph = sorted(re.findall(r'\{\w+\}', r[0]))
    for x in r[1:]:
        if sorted(re.findall(r'\{\w+\}', x)) != ph:
            print('PH', r)

ROWS = 'const ROWS=' + json.dumps(rows, ensure_ascii=False) + ';\n'
head = open('head.part', encoding='utf8').read().replace('<title>SAC Multilinha</title>', '<title>SAC</title>').replace('.wf .pri,.wstart .pri{', '.wf .pri,.wstart .pri,.wend .pri{')
head += open('extra.css', encoding='utf8').read()

def bundle(net):
    js = (f'const NET={"true" if net else "false"};\n' + ROWS + open('guide2.js', encoding='utf8').read() + '\n' + open('guidefix.js', encoding='utf8').read() + '\n'
          + open('app.js', encoding='utf8').read() + '\n' + open('tail.js', encoding='utf8').read() + '\n' + open('guide3.js', encoding='utf8').read()
          + ('\n' + open('net.js', encoding='utf8').read() if net else ''))
    assert not re.search(r'</?script|<!--', js)
    return head + """</style>
</head>
<body>
<div id="warn" hidden></div>
<div id="login" hidden></div>
<div id="app" hidden></div>
<div id="site" hidden></div>
<div id="modal" hidden></div>
<div id="toast" hidden></div>
<script>
{
""" + js + """
}
</script>
</body>
</html>
""", js

out, js = bundle(False)
open('../index.html', 'w', encoding='utf8').write(out)
open('/tmp/x.js', 'w', encoding='utf8').write(js)
out, js = bundle(True)
open(os.path.join(pub, 'app.html'), 'w', encoding='utf8').write(out)
open('/tmp/xnet.js', 'w', encoding='utf8').write(js)

wjs = ROWS + open('w.js', encoding='utf8').read()
assert not re.search(r'</?script|<!--', wjs)
open('/tmp/xw.js', 'w', encoding='utf8').write(wjs)
open(os.path.join(pub, 'w.html'), 'w', encoding='utf8').write("""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Chat</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">
<style>
""" + open('w.css', encoding='utf8').read() + """</style>
</head>
<body>
<div id="app"></div>
<div id="toast" hidden></div>
<script>
{
""" + wjs + """
}
</script>
</body>
</html>
""")
shutil.copy('widget.js', os.path.join(pub, 'widget.js'))
shutil.copy('demo.html', os.path.join(pub, 'demo.html'))
print('ok')
