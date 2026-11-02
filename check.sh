#!/bin/bash
# build, then refuse to go further unless the JavaScript parses and no comment has swallowed code
cd /home/claude/lastsurvivor && python3 build.py >/dev/null && node -e "const h=require('fs').readFileSync('dist/index.html','utf8');new Function(h.split('<script>')[1].split('</script>')[0]);console.log('build ok, syntax ok')" && python3 - <<'PY'
import re,glob
bad=0
for f in sorted(glob.glob('/home/claude/lastsurvivor/src/*.js')+glob.glob('/home/claude/lastsurvivor/tests/t*.js')):
    for i,line in enumerate(open(f),1):
        m=re.search(r'(?<![:"\'/])//(.*)$',line)
        if not m: continue
        before=line[:m.start()]
        if before.strip()=='' or before.count("'")%2 or before.count('"')%2 or before.count('`')%2: continue
        t=m.group(1)
        if re.search(r';\s*[a-zA-Z_$][\w.$]*\s*[=(]',t) or re.search(r'[a-z][A-Z]?\w*\.\w+\s*[-+]?=',t) or re.search(r'\w\(.*\);',t) or re.search(r'[a-z][a-zA-Z]+\([a-z.,0-9 ]*\)',t) or re.search(r'\)\s*[a-z]\w*\(',t) or re.search(r'\b(if|else|for|while)\b\s*[({]',t): print('SWALLOWED?',f.split('/')[-1],i,t[:90]);bad+=1
print('comment scan:',bad,'suspicious')
PY
# and the real page must start: title buttons present, no script errors
cd /home/claude/lastsurvivor/tests && timeout 60 node smoke.js
# no two functions may share a name: a later one silently replaces the earlier one everywhere
python3 - <<'PY'
import re,glob,collections,sys
names=collections.defaultdict(list)
for f in sorted(glob.glob('/home/claude/lastsurvivor/src/*.js')):
    for m in re.finditer(r'(?<![\w.$])function\s+([A-Za-z_$][\w$]*)\s*\(',open(f).read()):names[m.group(1)].append(f.split('/')[-1])
d={k:v for k,v in names.items() if len(v)>1};print('duplicate function names:',d or 'none')
PY
