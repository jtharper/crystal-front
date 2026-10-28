"""One-off: split the single-file build into index.html + css + js modules."""
import re,sys,os
SRC=sys.argv[1];OUT=sys.argv[2]
s=open(SRC).read()
css=re.search(r'<style>\n(.*?)</style>\n',s,re.S)
head,rest=s[:css.start()],s[css.end():]
start=rest.index("<script>\n(()=>{\n'use strict';\n")
end=rest.index("})();\n</script>")
markup=rest[:start];js=rest[start+len("<script>\n(()=>{\n'use strict';\n"):end];tail=rest[end+len("})();\n</script>"):]
lines=js.split('\n')
cuts=[('core',None),('terrain','terrain height'),('audio','audio (synthesized'),('map','map ----'),('sim','entities'),('ai','AI ----'),
      ('game','game flow'),('input','input ----'),('hud','sidebar'),('render','3D rendering'),('models','faction emblems'),('world','outlands:'),('main','main loop')]
idx=[0]
for name,key in cuts[1:]:
    i=next(k for k,l in enumerate(lines) if l.startswith('/* ---------- ') and key in l);idx.append(i)
idx.append(len(lines))
tags=[]
for n,(name,_) in enumerate(cuts):
    body='\n'.join(lines[idx[n]:idx[n+1]]).strip('\n')+'\n'
    open(os.path.join(OUT,'js',name+'.js'),'w').write("'use strict';\n"+body)
    tags.append('<script src="js/%s.js"></script>'%name)
open(os.path.join(OUT,'css','style.css'),'w').write(css.group(1))
open(os.path.join(OUT,'index.html'),'w').write(head+'<link rel="stylesheet" href="css/style.css">\n'+markup+'\n'.join(tags)+tail)
print('ok',[c[0] for c in cuts])
