import json,re
rows=[]
for ln in open('tr.txt',encoding='utf8'):
  ln=ln.rstrip('\n')
  if not ln.strip(): continue
  p=[x.strip() for x in ln.split(' || ')]; assert len(p)==5,ln; rows.append(p)
src=open('app.js').read()+open('tail.js').read()+open('guide3.js').read()
keys=set(re.findall(r"\bt\('((?:[^'\\]|\\.)*)'",src))
keys|=set(re.findall(r"(?:sys|assign)\([^,]+,(?:[^,]+,)?'((?:[^'\\]|\\.)*)'",src))
keys|=set(re.findall(r"assign\(c,(?:n|null|to),'((?:[^'\\]|\\.)*)'",src))
have={r[0] for r in rows}
print('missing',keys-have)
for r in rows:
  ph=sorted(re.findall(r'\{\w+\}',r[0]))
  for x in r[1:]:
    if sorted(re.findall(r'\{\w+\}',x))!=ph: print('PH',r)
head=open('head.part').read().replace('<title>SAC Multilinha</title>','<title>SAC</title>').replace('.wf .pri,.wstart .pri{','.wf .pri,.wstart .pri,.wend .pri{')
head+=open('extra.css').read()
js='const ROWS='+json.dumps(rows,ensure_ascii=False)+';\n'+open('guide2.js').read()+"\n"+open('guidefix.js').read()+"\n"+open('app.js').read()+"\n"+open('tail.js').read()+"\n"+open('guide3.js').read()
assert not re.search(r'</?script|<!--',js)
out=head+"""</style>
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
"""+js+"""
}
</script>
</body>
</html>
"""
open('../index.html','w').write(out)
