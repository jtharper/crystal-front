"""Build the Raspberry Pi deploy kit: dist/crystal-front-pi.zip
usage: python3 tools/build_pi.py [path/to/three/node_modules/three]
The kit holds the site (only what the browser needs, with three.js r128 served locally instead of from CDNs),
setup.sh (Caddy web server + firewall + automatic security updates), update.sh and README.md."""
import os, re, shutil, sys, zipfile, glob

D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THREE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.environ.get('THREE_DIR', ''), '')
OUT = os.path.join(D, 'dist', 'crystal-front-pi')
shutil.rmtree(OUT, ignore_errors=True)
SITE = os.path.join(OUT, 'site')
os.makedirs(SITE)

# --- site files ---
for d in ('css', 'js', 'tex'):
    shutil.copytree(os.path.join(D, d), os.path.join(SITE, d))
os.makedirs(os.path.join(SITE, 'models'))
import json, base64, struct, gzip
def json_to_glb(src, dst):
    """embedded-buffer glTF (.json, base64) -> binary .glb: about a third smaller and no base64 decoding in the browser"""
    g = json.load(open(src)); bins = []
    for b in g['buffers']:
        bins.append(base64.b64decode(b['uri'].split(',', 1)[1])); del b['uri']
    if len(bins) != 1: raise SystemExit('expected one buffer in ' + src)
    blob = bins[0]; blob += b'\0' * (-len(blob) % 4); g['buffers'][0]['byteLength'] = len(bins[0])
    js = json.dumps(g, separators=(',', ':')).encode(); js += b' ' * (-len(js) % 4)
    with open(dst, 'wb') as fh:
        fh.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(blob)))
        fh.write(struct.pack('<II', len(js), 0x4E4F534A)); fh.write(js)
        fh.write(struct.pack('<II', len(blob), 0x004E4942)); fh.write(blob)
for f in glob.glob(os.path.join(D, 'models', '*.json')):
    json_to_glb(f, os.path.join(SITE, 'models', os.path.basename(f)[:-5] + '.glb'))
for f in glob.glob(os.path.join(D, 'models', '*_ao.jpg')):
    shutil.copy(f, os.path.join(SITE, 'models'))
# the game asks for models/<name>.glb instead of .json
gp = os.path.join(SITE, 'js', 'glb.js'); gs = open(gp).read()
gs2 = re.sub(r"'models/([a-z0-9_]+)\.json'", r"'models/\1.glb'", gs)
assert gs2 != gs; open(gp, 'w').write(gs2)

# --- vendor three.js r128 (exact versions the game was built against) ---
VEND = {'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js': 'build/three.min.js'}
html = open(os.path.join(D, 'index.html')).read()
for u in re.findall(r'src="(https://cdn\.jsdelivr\.net/npm/three@0\.128\.0/examples/js/[^"]+)"', html):
    VEND[u] = 'examples/js/' + u.split('/examples/js/')[1]
for url, rel in VEND.items():
    src = os.path.join(THREE, rel)
    if not os.path.exists(src):
        sys.exit('missing ' + src + ' (pass the three@0.128.0 package folder)')
    dst = os.path.join(SITE, 'vendor', 'three', rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copy(src, dst)
    html = html.replace(url, 'vendor/three/' + rel)
# a complete document (standards mode, UTF-8) - the artifact host adds this wrapper itself
if not html.lstrip().lower().startswith('<!doctype'):
    html = '<!doctype html>\n<html lang="en">\n' + html + '\n</html>\n'
open(os.path.join(SITE, 'index.html'), 'w', encoding='utf-8').write(html)

# --- pre-compressed copies (.gz) so the Pi never compresses on the fly ---
for root, _, files in os.walk(SITE):
    for f in files:
        if f.endswith(('.glb', '.js', '.css', '.html', '.json')):
            p = os.path.join(root, f); raw = open(p, 'rb').read()
            with gzip.open(p + '.gz', 'wb', compresslevel=9) as z: z.write(raw)
# --- scripts + docs ---
for f in ('setup.sh', 'update.sh', 'ddns-ionos.sh', 'README.md'):
    shutil.copy(os.path.join(D, 'tools', 'pi', f), os.path.join(OUT, f))
for f in ('setup.sh', 'update.sh', 'ddns-ionos.sh'):
    os.chmod(os.path.join(OUT, f), 0o755)

# --- zip (keeps the executable bit) ---
zp = os.path.join(D, 'dist', 'crystal-front-pi.zip')
with zipfile.ZipFile(zp, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk(OUT):
        for f in files:
            p = os.path.join(root, f); arc = os.path.relpath(p, os.path.dirname(OUT))
            zi = zipfile.ZipInfo.from_file(p, arc); zi.compress_type = zipfile.ZIP_DEFLATED
            with open(p, 'rb') as fh: z.writestr(zi, fh.read())
n = sum(len(fs) for _, _, fs in os.walk(SITE))
print('wrote', zp, os.path.getsize(zp) // 1024, 'KB,', n, 'site files')
