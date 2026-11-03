// Copies the web build (../dist/web, made by `npm run build` at the repo root) into ./app for packaging.
import fs from 'node:fs';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname), src = path.join(here, '..', 'dist', 'web'), dst = path.join(here, 'app');
if (!fs.existsSync(path.join(src, 'index.html'))) { console.error('Run `npm run build` in the repo root first (dist/web is missing).'); process.exit(1); }
fs.rmSync(dst, { recursive: true, force: true });
fs.cpSync(src, dst, { recursive: true, filter: f => !/\/(_headers|_redirects)$/.test(f) });
console.log('copied', src, '->', dst);
