"""Convert a .glb into an embedded glTF (JSON with a base64 buffer), served as .json by the artifact host.
usage: python3 tools/glb2json.py models/x.glb [...]"""
import sys,json,struct,base64
for p in sys.argv[1:]:
    b=open(p,'rb').read();assert b[:4]==b'glTF'
    jl,=struct.unpack_from('<I',b,12);js=json.loads(b[20:20+jl]);o=20+jl
    bl,=struct.unpack_from('<I',b,o);binc=b[o+8:o+8+bl]
    js['buffers'][0]['uri']='data:application/octet-stream;base64,'+base64.b64encode(binc).decode()
    out=p[:-4]+'.json';open(out,'w').write(json.dumps(js,separators=(',',':')));print(out,len(json.dumps(js)))
