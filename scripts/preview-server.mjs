// Preview server with a visitor log, used by share-preview.cmd.
//   node scripts/preview-server.mjs [port]
// Serves the production build (dist/) like `vite preview`, and records each page visit
// (time, country, IP, device, page) to .tunnel/visitors.csv. The list is shown at
// http://localhost:4173/__visitors, only on this computer: requests through the public link are refused.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');
const LOG = path.join(ROOT, '.tunnel', 'visitors.csv');
const PORT = Number(process.argv[2] ?? 4173);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.txt': 'text/plain'
};

fs.mkdirSync(path.dirname(LOG), { recursive: true });
if (!fs.existsSync(LOG)) fs.writeFileSync(LOG, 'time,country,ip,device,browser,page,referrer\n');

const csv = v => `"${String(v ?? '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ').slice(0, 300)}"`;
const device = ua => (/iPad|Tablet/i.test(ua) ? 'Tablet' : /Mobi|Android|iPhone/i.test(ua) ? 'Phone' : 'Computer');
const browser = ua => (/Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : /bot|crawl|spider|preview/i.test(ua) ? 'Bot / link preview' : 'Other');
/** Requests that came through the Cloudflare tunnel carry these headers; local ones don't. */
const viaTunnel = req => !!(req.headers['cf-connecting-ip'] || req.headers['cf-ray']);

function logVisit(req, page, referrer) {
  const ua = req.headers['user-agent'] ?? '';
  const row = [new Date().toISOString(), req.headers['cf-ipcountry'] ?? (viaTunnel(req) ? '' : 'local'), req.headers['cf-connecting-ip'] ?? req.socket.remoteAddress, device(ua), browser(ua), page, referrer ?? '' ];
  fs.appendFile(LOG, row.map(csv).join(',') + '\n', () => {});
  console.log(`${row[0].slice(11, 19)}  ${String(row[1]).padEnd(5)} ${String(row[3]).padEnd(8)} ${page}`);
}

function visitorsPage(res) {
  const rows = fs.readFileSync(LOG, 'utf8').trim().split('\n').slice(1).reverse().slice(0, 500)
    .map(l => l.match(/"((?:[^"]|"")*)"/g)?.map(c => c.slice(1, -1).replace(/""/g, '"')) ?? []);
  const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
  const external = rows.filter(r => r[1] !== 'local');
  const flag = cc => (/^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map(c => 0x1f1a5 + c.charCodeAt(0))) : '');
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="30"><title>Preview visitors</title>
<style>body{font:14px system-ui,sans-serif;margin:24px;background:#0b1f33;color:#eaf4ff}h1{font-size:20px}table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #2b4f6e}th{color:#9cc3e4;font-weight:600}tr.local td{color:#7f9bb4}.muted{color:#9cc3e4}</style></head><body>
<h1>Preview visitors</h1><p class="muted">${external.length} visits through the public link (newest first, last 500 shown). Refreshes every 30 seconds. Full log: .tunnel/visitors.csv. Grey rows are your own visits on this computer or Wi-Fi.</p>
<table><thead><tr><th>Time</th><th>Country</th><th>IP address</th><th>Device</th><th>Browser</th><th>Page</th></tr></thead><tbody>
${rows.map(r => `<tr class="${r[1] === 'local' ? 'local' : ''}"><td>${esc(new Date(r[0]).toLocaleString())}</td><td>${flag(r[1])} ${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td>${esc(r[4])}</td><td>${esc(r[5])}</td></tr>`).join('')}
</tbody></table></body></html>`);
}

function sendFile(req, res, file) {
  const stat = fs.statSync(file);
  const type = TYPES[path.extname(file)] ?? 'application/octet-stream';
  const cache = file.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache';
  const range = req.headers.range?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    // Videos are streamed in parts (needed for seeking in the 360° player).
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), stat.size - 1) : stat.size - 1;
    if (start >= stat.size || start > end) { res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }); res.end(); return; }
    res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Cache-Control': cache });
    fs.createReadStream(file, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': stat.size, 'Accept-Ranges': 'bytes', 'Cache-Control': cache });
  if (req.method === 'HEAD') { res.end(); return; }
  fs.createReadStream(file).pipe(res);
}

http.createServer((req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    if (pathname === '/__visit' && req.method === 'POST') {
      // Page view reported by the app (works even when the page itself came from the offline cache).
      let body = '';
      req.on('data', c => { if (body.length < 2000) body += c; });
      req.on('end', () => { let page = '/'; let ref = ''; try { const j = JSON.parse(body); page = String(j.page ?? '/'); ref = String(j.referrer ?? ''); } catch { /* ignore */ } logVisit(req, page, ref); res.writeHead(204); res.end(); });
      return;
    }
    if (pathname === '/__visitors') {
      if (viaTunnel(req)) { res.writeHead(404); res.end('Not found'); return; }
      visitorsPage(res); return;
    }
    const file = path.normalize(path.join(DIST, pathname));
    if (!file.startsWith(DIST)) { res.writeHead(403); res.end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isFile()) { sendFile(req, res, file); return; }
    if (path.extname(pathname)) { res.writeHead(404); res.end('Not found'); return; }
    // App page (single-page app). Visits through the public link are logged by the page itself (/__visit);
    // local visits are logged here.
    if (!viaTunnel(req) && req.method === 'GET' && (req.headers.accept ?? '').includes('text/html')) logVisit(req, pathname + url.search, '');
    sendFile(req, res, path.join(DIST, 'index.html'));
  } catch {
    res.writeHead(500); res.end();
  }
}).listen(PORT, () => console.log(`Preview with visitor log on http://localhost:${PORT}  (visitors: http://localhost:${PORT}/__visitors)`));
