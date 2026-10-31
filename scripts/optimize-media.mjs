// Builds responsive WebP renditions + a manifest from the source photos.
//   assets-src/img    -> photos supplied by TravelMateVR (own media)
//   assets-src/stock  -> openly licensed photos (credits.json holds attribution)
// Output: public/media/<id>-<width>.webp and src/data/media.generated.json
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT_DIR = path.join(ROOT, 'public/media');
const MANIFEST = path.join(ROOT, 'src/data/media.generated.json');
const WIDTHS = [480, 960, 1600, 2400];

const OWN = {
  'impala': ['2gazelles.png', 'Two impala on green grass'],
  'dar-city': ['darcity.png', 'Dar es Salaam city centre'],
  'hotel-room': ['hotelroom.png', 'Ocean-view hotel room'],
  'cultural-dance': ['localdancing.png', 'Traditional dance performance in front of a thatched house'],
  'maasai': ['maasai.png', 'Maasai men performing the jumping dance'],
  'ngozi': ['ngozi.png', 'Ngozi Crater Lake, Mbeya'],
  'nungwi': ['nungwi.png', 'Coastline and village seen from above'],
  'safari-crew': ['tourcar.png', 'Safari guides beside their 4x4'],
  'zanzibar-beach': ['zanzibar.png', 'Turquoise water and beach huts, Zanzibar']
};

fs.mkdirSync(OUT_DIR, { recursive: true });
const credits = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets-src/stock/credits.json'), 'utf8'));
const jobs = [
  ...Object.entries(OWN).map(([id, [file, alt]]) => ({ id, src: path.join(ROOT, 'assets-src/img', file), alt, own: true })),
  ...Object.entries(credits).map(([id, c]) => ({ id, src: path.join(ROOT, 'assets-src/stock', `${id}.jpg`), alt: c.caption, own: false, credit: c }))
];

const manifest = {};
for (const job of jobs) {
  const meta = await sharp(job.src).metadata();
  const widths = WIDTHS.filter(w => w <= meta.width);
  if (!widths.length || widths.at(-1) < meta.width * 0.8) widths.push(Math.min(meta.width, 2400));
  for (const w of [...new Set(widths)]) {
    const file = path.join(OUT_DIR, `${job.id}-${w}.webp`);
    if (!fs.existsSync(file)) {
      await sharp(job.src).flatten({ background: '#0f2c3f' }).resize({ width: w }).webp({ quality: 72, effort: 5 }).toFile(file);
    }
  }
  const lqip = await sharp(job.src).flatten({ background: '#0f2c3f' }).resize({ width: 16 }).webp({ quality: 40 }).toBuffer();
  manifest[job.id] = {
    w: meta.width, h: meta.height, widths: [...new Set(widths)].sort((a, b) => a - b),
    alt: job.alt, own: job.own, lqip: `data:image/webp;base64,${lqip.toString('base64')}`,
    ...(job.credit ? { credit: { author: job.credit.author, license: job.credit.license, licenseUrl: job.credit.licenseUrl, source: job.credit.source, title: job.credit.title } } : {})
  };
  console.log(job.id, manifest[job.id].widths.join(','));
}
// Partner logos (square, shown small)
const LOGOS = { 'logo-katavi-fahari': 'katavi.png', 'logo-mpanda-safaris': 'mpanda.png' };
for (const [id, file] of Object.entries(LOGOS)) {
  const src = path.join(ROOT, 'assets-src/img', file);
  const meta = await sharp(src).metadata();
  for (const w of [160, 320]) {
    const out = path.join(OUT_DIR, `${id}-${w}.webp`);
    if (!fs.existsSync(out)) await sharp(src).resize({ width: w }).webp({ quality: 85 }).toFile(out);
  }
  manifest[id] = { w: meta.width, h: meta.height, widths: [160, 320], alt: '', own: true, lqip: '' };
  console.log(id, 'logo');
}

// 360° equirectangular panoramas (Poly Haven CC0, Wikimedia Commons) -> public/pano + a flat crop for cards
const PANO_DIR = path.join(ROOT, 'public/pano');
fs.mkdirSync(PANO_DIR, { recursive: true });
const panoCredits = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets-src/pano/credits.json'), 'utf8').replace(/^﻿/, ''));
const panos = {};
const licenseOf = c => ({ license: c.license ?? 'CC0', licenseUrl: c.licenseUrl ?? 'https://creativecommons.org/publicdomain/zero/1.0/' });
const panoEntry = c => ({ name: c.name, author: c.authors, source: c.source, ...licenseOf(c), widths: [2048, 4096] });
/** Card image: the band around the horizon, centred on the forward view. */
const bandCrop = (w, h) => ({ left: Math.round(w * 0.3), top: Math.round(h * 0.3), width: Math.round(w * 0.4), height: Math.round(h * 0.4) });
for (const [id, c] of Object.entries(panoCredits)) {
  const src = path.join(ROOT, 'assets-src/pano', `${id}.jpg`);
  // Originals (20–45 MB each) are not committed; download them from c.source to regenerate.
  if (!fs.existsSync(src)) {
    const mediaId = `pano-${id}`;
    const prev = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))[mediaId] : null;
    if (prev) manifest[mediaId] = prev;
    panos[id] = panoEntry(c);
    console.log(id, 'pano (source missing, kept existing renditions)');
    continue;
  }
  for (const w of [2048, 4096]) {
    const out = path.join(PANO_DIR, `${id}-${w}.jpg`);
    if (!fs.existsSync(out)) await sharp(src, { limitInputPixels: false }).resize({ width: w, height: w / 2 }).jpeg({ quality: 80, mozjpeg: true }).toFile(out);
  }
  const mediaId = `pano-${id}`;
  const srcMeta = await sharp(src, { limitInputPixels: false }).metadata();
  const crop = bandCrop(srcMeta.width, srcMeta.height);
  for (const w of [480, 960, 1600]) {
    const out = path.join(OUT_DIR, `${mediaId}-${w}.webp`);
    if (!fs.existsSync(out)) await sharp(src, { limitInputPixels: false }).extract(crop).resize({ width: w }).webp({ quality: 72 }).toFile(out);
  }
  const lqip = await sharp(src, { limitInputPixels: false }).extract(crop).resize({ width: 16 }).webp({ quality: 40 }).toBuffer();
  manifest[mediaId] = {
    w: crop.width, h: crop.height, widths: [480, 960, 1600], alt: c.name, own: false,
    lqip: `data:image/webp;base64,${lqip.toString('base64')}`,
    credit: { author: c.authors, ...licenseOf(c), source: c.source, title: c.name }
  };
  panos[id] = panoEntry(c);
  console.log(id, 'pano');
}
fs.writeFileSync(path.join(ROOT, 'src/data/panos.generated.json'), JSON.stringify(panos, null, 2) + '\n');

// 360° videos: card images cut from the poster frame written by scripts/build-videos.mjs
const VIDEOS = path.join(ROOT, 'src/data/videos.generated.json');
const videos = fs.existsSync(VIDEOS) ? JSON.parse(fs.readFileSync(VIDEOS, 'utf8')) : {};
for (const [id, v] of Object.entries(videos)) {
  const poster = path.join(ROOT, 'public', v.poster);
  const meta = await sharp(poster).metadata();
  const crop = bandCrop(meta.width, meta.height);
  const mediaId = `video-${id}`;
  const widths = [...new Set([480, Math.min(800, crop.width)])];
  for (const w of widths) {
    const out = path.join(OUT_DIR, `${mediaId}-${w}.webp`);
    if (!fs.existsSync(out)) await sharp(poster).extract(crop).resize({ width: w }).webp({ quality: 74 }).toFile(out);
  }
  const lqip = await sharp(poster).extract(crop).resize({ width: 16 }).webp({ quality: 40 }).toBuffer();
  manifest[mediaId] = {
    w: crop.width, h: crop.height, widths, alt: v.name, own: false, lqip: `data:image/webp;base64,${lqip.toString('base64')}`,
    credit: { author: v.author, license: v.license, licenseUrl: v.licenseUrl, source: v.source, title: v.name }
  };
  console.log(id, 'video card');
}

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');

// Short video loop (copied as-is; transcoding needs ffmpeg and is done in the media pipeline)
fs.copyFileSync(path.join(ROOT, 'assets-src/videos/fishing.mp4'), path.join(OUT_DIR, 'fishing.mp4'));
