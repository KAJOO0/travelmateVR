// Lists translation keys used in src/ that are missing from src/locales/en.
// Static keys are checked exactly; template keys (`a.${x}.b`) are reported as patterns to review.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../src');
const LOC = path.join(ROOT, 'locales/en');
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { if (f !== 'locales' && f !== 'data') walk(p); } else if (/\.tsx?$/.test(f)) files.push(p); } })(ROOT);

const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? flat(v, `${p}${k}.`) : [`${p}${k}`]));
const en = {};
for (const f of fs.readdirSync(LOC)) en[f.replace('.json', '')] = new Set(flat(JSON.parse(fs.readFileSync(path.join(LOC, f), 'utf8'))).map(k => k.replace(/_(zero|one|two|few|many|other)$/, '')));
const has = (ns, key) => en[ns]?.has(key) || [...(en[ns] ?? [])].some(k => k.startsWith(`${key}.`));

const missing = new Map();
const patterns = new Set();
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const nsDecl = /useTranslation\(\s*(\[[^\]]*\]|'[^']*')?\s*\)/.exec(src);
  let defNs = 'common';
  if (nsDecl?.[1]) { const m = /'([^']+)'/.exec(nsDecl[1]); if (m) defNs = m[1]; }
  const re = /\bt\(\s*(['`])((?:(?!\1).)+)\1/g;
  let m;
  while ((m = re.exec(src))) {
    const raw = m[2];
    if (m[1] === '`' && raw.includes('${')) { patterns.add(`${path.relative(ROOT, file)}: ${raw}`); continue; }
    const [ns, key] = raw.includes(':') ? raw.split(':') : [defNs, raw];
    if (!has(ns, key) && !has('common', raw)) missing.set(`${ns}:${key}`, path.relative(ROOT, file));
  }
}
const byNs = {};
for (const [k, f] of missing) { const [ns] = k.split(':'); (byNs[ns] ??= []).push(`${k}   (${f})`); }
for (const ns of Object.keys(byNs).sort()) { console.log(`\n## ${ns} (${byNs[ns].length})`); byNs[ns].sort().forEach(l => console.log(l)); }
if (process.argv.includes('--patterns')) { console.log('\n## template keys'); [...patterns].sort().forEach(p => console.log(p)); }
console.log(`\n${missing.size} missing static keys`);
