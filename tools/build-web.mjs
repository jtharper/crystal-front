// Build the deployable website into dist/web (used by Cloudflare Pages on every push).
//   npm run build      (runs: node tools/build-web.mjs)
// - copies index.html, css/, js/, tex/ and the game's models
// - converts the embedded-glTF models (models/*.json) to binary .glb: about a third smaller, no base64 decoding in the browser
// - serves three.js r128 from the site itself (from node_modules/three) instead of public CDNs
// - adds _headers so Cloudflare caches models/textures/libraries but always revalidates the page and game code
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, 'dist', 'web');
const THREE = path.join(ROOT, 'node_modules', 'three');
const rel = (...p) => path.join(ROOT, ...p);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'models'), { recursive: true });
for (const d of ['css', 'js', 'tex']) fs.cpSync(rel(d), path.join(OUT, d), { recursive: true });

// --- models: only what the game references ---
let glb = fs.readFileSync(rel('js', 'glb.js'), 'utf8');
const refs = [...new Set([...glb.matchAll(/'models\/([A-Za-z0-9_]+\.(?:json|jpg))'/g)].map(m => m[1]))];
let bytes = 0;
for (const f of refs) {
  const src = rel('models', f);
  if (!fs.existsSync(src)) throw new Error('missing model file ' + f);
  if (f.endsWith('.jpg')) { fs.copyFileSync(src, path.join(OUT, 'models', f)); continue; }
  const g = JSON.parse(fs.readFileSync(src, 'utf8'));
  if (g.buffers.length !== 1) throw new Error('expected one buffer in ' + f);
  const bin = Buffer.from(g.buffers[0].uri.split(',', 2)[1], 'base64');
  delete g.buffers[0].uri; g.buffers[0].byteLength = bin.length;
  const pad = (b, c) => Buffer.concat([b, Buffer.alloc((4 - b.length % 4) % 4, c)]);
  const js = pad(Buffer.from(JSON.stringify(g)), 0x20), bn = pad(bin, 0);
  const head = Buffer.alloc(12), jh = Buffer.alloc(8), bh = Buffer.alloc(8);
  head.writeUInt32LE(0x46546C67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + bn.length, 8);
  jh.writeUInt32LE(js.length, 0); jh.writeUInt32LE(0x4E4F534A, 4); bh.writeUInt32LE(bn.length, 0); bh.writeUInt32LE(0x004E4942, 4);
  const out = Buffer.concat([head, jh, js, bh, bn]);
  fs.writeFileSync(path.join(OUT, 'models', f.replace(/\.json$/, '.glb')), out); bytes += out.length;
}
glb = glb.replace(/'models\/([A-Za-z0-9_]+)\.json'/g, "'models/$1.glb'");
fs.writeFileSync(path.join(OUT, 'js', 'glb.js'), glb);

// --- build id: both online players must run the same game code (a hash of every script) ---
{
  const { createHash } = await import('node:crypto');
  const h = createHash('sha1');
  for (const f of fs.readdirSync(path.join(OUT, 'js')).sort()) h.update(fs.readFileSync(path.join(OUT, 'js', f)));
  const id = h.digest('hex').slice(0, 10), np = path.join(OUT, 'js', 'net.js');
  const ns = fs.readFileSync(np, 'utf8');
  if (!ns.includes("BUILD_ID='dev'")) throw new Error('BUILD_ID marker missing in net.js');
  fs.writeFileSync(np, ns.replace("BUILD_ID='dev'", `BUILD_ID='${id}'`));
}

// --- three.js r128 served locally ---
if (!fs.existsSync(path.join(THREE, 'build', 'three.min.js'))) throw new Error('three.js not installed - run npm install first');
let html = fs.readFileSync(rel('index.html'), 'utf8');
const vend = { 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js': 'build/three.min.js' };
for (const m of html.matchAll(/src="(https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.128\.0\/examples\/js\/[^"]+)"/g)) vend[m[1]] = 'examples/js/' + m[1].split('/examples/js/')[1];
for (const [url, r] of Object.entries(vend)) {
  const dst = path.join(OUT, 'vendor', 'three', r);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(path.join(THREE, r), dst);
  html = html.split(url).join('vendor/three/' + r);
}
// a complete document (standards mode, UTF-8); the artifact preview adds this wrapper by itself
if (!/^\s*<!doctype/i.test(html)) html = '<!doctype html>\n<html lang="en">\n' + html + '\n</html>\n';
fs.writeFileSync(path.join(OUT, 'index.html'), html);

// --- Cloudflare Pages caching rules ---
fs.writeFileSync(path.join(OUT, '_headers'), `/models/*
  Cache-Control: public, max-age=86400
/tex/*
  Cache-Control: public, max-age=86400
/vendor/*
  Cache-Control: public, max-age=604800
/js/*
  Cache-Control: no-cache
/css/*
  Cache-Control: no-cache
/
  Cache-Control: no-cache
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
`);

let n = 0, total = 0;
const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else { n++; total += fs.statSync(p).size; } } };
walk(OUT);
console.log(`built ${path.relative(ROOT, OUT)}: ${n} files, ${(total / 1048576).toFixed(1)} MB (${refs.filter(f => f.endsWith('.json')).length} models)`);
