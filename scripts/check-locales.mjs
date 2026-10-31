// Verifies every locale has the same keys as English (plural suffixes normalised).
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.resolve(import.meta.dirname, '../src/locales');
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, `${p}${k}.`) : [`${p}${k}`]));
const norm = k => k.replace(/_(zero|one|two|few|many|other)$/, '');
const load = (lng, ns) => JSON.parse(fs.readFileSync(path.join(DIR, lng, `${ns}.json`), 'utf8'));

let problems = 0;
for (const ns of fs.readdirSync(path.join(DIR, 'en')).map(f => f.replace('.json', ''))) {
  const base = new Set(flat(load('en', ns)).map(norm));
  for (const lng of fs.readdirSync(DIR).filter(l => l !== 'en')) {
    const keys = new Set(flat(load(lng, ns)).map(norm));
    const missing = [...base].filter(k => !keys.has(k));
    const extra = [...keys].filter(k => !base.has(k));
    if (missing.length || extra.length) {
      problems++;
      console.log(`${lng}/${ns}: missing ${missing.length}, extra ${extra.length}`);
      missing.forEach(k => console.log(`  - ${k}`));
      extra.forEach(k => console.log(`  + ${k}`));
    }
  }
}
console.log(problems ? `${problems} locale file(s) out of sync` : 'All locales in sync');
process.exit(problems ? 1 : 0);
