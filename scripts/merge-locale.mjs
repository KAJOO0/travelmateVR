// Deep-merges a JSON file of additions into src/locales/<lang>/<ns>.json (creates it if needed).
//   node scripts/merge-locale.mjs <lang> <ns> <additions.json>
import fs from 'node:fs';
import path from 'node:path';

const [lang, ns, addPath] = process.argv.slice(2);
const target = path.resolve(import.meta.dirname, `../src/locales/${lang}/${ns}.json`);
const read = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^﻿/, ''));
const base = fs.existsSync(target) ? read(target) : {};
const add = read(addPath);
const merge = (a, b) => {
  for (const [k, v] of Object.entries(b)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) merge(a[k], v);
    else a[k] = v;
  }
  return a;
};
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, JSON.stringify(merge(base, add), null, 2) + '\n');
console.log(`merged ${addPath} -> ${lang}/${ns}.json`);
