// Transcodes the 360° videos in assets-src/video360 (credits.json lists them) into web-friendly
// H.264/AAC MP4s plus an equirectangular poster frame:
//   public/video/<id>-<width>.mp4, public/video/<id>-poster.jpg, src/data/videos.generated.json
// Needs ffmpeg on PATH (or FFMPEG=/path/to/ffmpeg). Originals are not committed; missing ones are
// downloaded from the `file` URL in credits.json. Run `npm run media` afterwards for card images.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'assets-src/video360');
const OUT = path.join(ROOT, 'public/video');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const UA = 'TravelMateVR-media/0.1 (info@travelmatevr.com)';
const credits = JSON.parse(fs.readFileSync(path.join(SRC, 'credits.json'), 'utf8'));
fs.mkdirSync(OUT, { recursive: true });

const probe = file => {
  let text = '';
  try { execFileSync(FFMPEG, ['-hide_banner', '-i', file], { stdio: 'pipe' }); } catch (e) { text = String(e.stderr); }
  const [, w, h] = text.match(/Video:.*?(\d{3,5})x(\d{3,5})/) ?? [];
  const [, hh, mm, ss] = text.match(/Duration: (\d+):(\d+):([\d.]+)/) ?? [];
  return { width: Number(w), height: Number(h), duration: Number(hh) * 3600 + Number(mm) * 60 + Number(ss), audio: /Audio:/.test(text) };
};

const manifest = {};
for (const [id, c] of Object.entries(credits)) {
  const original = path.join(SRC, `${id}.webm`);
  if (!fs.existsSync(original)) {
    console.log(id, 'downloading original');
    const res = await fetch(c.file, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`${id}: ${res.status}`);
    fs.writeFileSync(original, Buffer.from(await res.arrayBuffer()));
  }
  const info = probe(original);
  const width = Math.min(info.width, c.maxWidth ?? 2560);
  const height = width / 2;
  const mp4 = path.join(OUT, `${id}-${width}.mp4`);
  if (!fs.existsSync(mp4)) {
    execFileSync(FFMPEG, [
      '-hide_banner', '-loglevel', 'error', '-y', '-i', original,
      '-vf', `scale=${width}:${height}:flags=lanczos`, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(c.crf ?? 24),
      '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      ...(info.audio ? ['-c:a', 'aac', '-b:a', '96k'] : ['-an']), mp4
    ], { stdio: 'inherit' });
  }
  const poster = path.join(OUT, `${id}-poster.jpg`);
  if (!fs.existsSync(poster)) {
    execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(c.posterAt ?? 1), '-i', original, '-frames:v', '1', '-vf', `scale=${Math.min(2048, width)}:-2`, '-q:v', '3', poster], { stdio: 'inherit' });
  }
  manifest[id] = {
    name: c.name, author: c.author, license: c.license, licenseUrl: c.licenseUrl, source: c.source,
    src: `/video/${id}-${width}.mp4`, poster: `/video/${id}-poster.jpg`, width, height,
    duration: Math.round(info.duration * 10) / 10, audio: info.audio, bytes: fs.statSync(mp4).size,
    // CC BY requires indicating changes.
    modified: 'Transcoded to H.264/MP4 and resized for web playback'
  };
  console.log(id, `${width}x${height}`, `${(manifest[id].bytes / 1e6).toFixed(1)} MB`, `${manifest[id].duration}s`);
}
fs.writeFileSync(path.join(ROOT, 'src/data/videos.generated.json'), JSON.stringify(manifest, null, 2) + '\n');
