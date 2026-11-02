import os, glob,os,shutil
root=os.path.dirname(os.path.abspath(__file__))
parts=[open(f).read() for f in sorted(glob.glob(os.path.join(root,'src','*.js')))]
js="(function(){\n'use strict';\n"+"\n".join(parts)+"\n})();"
html=open(os.path.join(root,'template.html')).read().replace('/*SCRIPT*/',js)
os.makedirs(os.path.join(root,'dist'),exist_ok=True)   # works in a fresh copy too
out=os.path.join(root,'dist','index.html');open(out,'w').write(html)
os.makedirs('/mnt/user-data/outputs',exist_ok=True)
shutil.copy(out,'/mnt/user-data/outputs/index.html')
print('built',out,len(html)//1024,'KB,',js.count('\n'),'lines of JS from',len(parts),'modules')
