"""Inline css/ and js/ back into one self-contained HTML file (for the iOS app or offline play).
usage: python3 tools/bundle.py [out.html]"""
import re,sys,os
D=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out=sys.argv[1] if len(sys.argv)>1 else os.path.join(D,'dist','crystal-front.html')
s=open(os.path.join(D,'index.html')).read()
s=s.replace('<link rel="stylesheet" href="css/style.css">','<style>\n'+open(os.path.join(D,'css','style.css')).read()+'</style>')
files=re.findall(r'<script src="(js/[^"]+)"></script>',s)
body='\n'.join(open(os.path.join(D,f)).read().replace("'use strict';\n","",1) for f in files)
s=re.sub(r'(<script src="js/[^"]+"></script>\n?)+','<script>\n(()=>{\n\'use strict\';\n'+body.replace('\\','\\\\')+'})();\n</script>\n',s,count=1)
# photo ground textures: inline as data URIs so the single file still works offline
import base64
def _tex(m):
    f=os.path.join(D,'tex',m.group(1))
    return "'data:image/jpeg;base64,"+base64.b64encode(open(f,'rb').read()).decode()+"'" if os.path.exists(f) else m.group(0)
s=re.sub(r"'tex/([a-z_]+\.jpg)'",_tex,s)
# Blender models + their baked AO maps
def _mod(m):
    f=os.path.join(D,'models',m.group(1));mime='model/gltf+json' if f.endswith('.json') else 'image/jpeg'
    return "'data:"+mime+";base64,"+base64.b64encode(open(f,'rb').read()).decode()+"'" if os.path.exists(f) else m.group(0)
s=re.sub(r"'models/([a-z_]+\.(?:json|jpg))'",_mod,s)
if not s.lstrip().lower().startswith('<!doctype'):s='<!doctype html>\n<html lang="en">\n<meta charset="utf-8">\n'+s
os.makedirs(os.path.dirname(out),exist_ok=True);open(out,'w').write(s);print('wrote',out,len(s))
