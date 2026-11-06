// ローカル確認用: site/ を配信しつつ /api/contact を Vercel と同じ形で動かす（npm run dev）
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SITE = path.join(ROOT, 'site');
const PORT = Number(process.env.PORT || 3000);
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain', '.json': 'application/json' };
const handler = (await import(path.join(ROOT, 'api/contact.js'))).default;
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/contact') {
    let body = ''; for await (const c of req) body += c;
    const r = { _s: 200, _h: {}, setHeader(k, v) { this._h[k] = v; }, status(c) { this._s = c; return this; }, json(o) { res.writeHead(this._s, { 'Content-Type': 'application/json', ...this._h }); res.end(JSON.stringify(o)); }, end() { res.writeHead(this._s, this._h); res.end(); } };
    return handler({ method: req.method, headers: req.headers, body, socket: req.socket }, r);
  }
  let f = path.join(SITE, decodeURIComponent(url.pathname));
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { f = path.join(SITE, '404.html'); res.statusCode = 404; }
  res.setHeader('Content-Type', MIME[path.extname(f)] || 'application/octet-stream');
  fs.createReadStream(f).pipe(res);
}).listen(PORT, () => console.log(`dev: http://localhost:${PORT}`));
