// After packaging: keep only the English Chromium locale (the game is English-only), saving ~45 MB.
import fs from 'node:fs';
import path from 'node:path';
const out = path.join(path.dirname(new URL(import.meta.url).pathname), 'out');
for (const d of fs.existsSync(out) ? fs.readdirSync(out) : []) {
  const loc = path.join(out, d, 'locales');
  if (!fs.existsSync(loc)) continue;
  let n = 0;
  for (const f of fs.readdirSync(loc)) if (f !== 'en-US.pak') { fs.rmSync(path.join(loc, f)); n++; }
  console.log(d + ': removed ' + n + ' unused locales');
}
