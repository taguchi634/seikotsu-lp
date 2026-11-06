// プレビュー用エクスポート: site/ を相対リンク化して preview/ に出力（Vercel 以外の場所で見た目を確認するため）
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(ROOT, 'site'), OUT = path.join(ROOT, 'preview');
fs.rmSync(OUT, { recursive: true, force: true });
const tagSlug = (t) => 't-' + Buffer.from(t).toString('hex').slice(0, 24);
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const banner = `<div style="position:sticky;top:0;z-index:999;background:#222;color:#fff;font-size:12px;padding:6px 12px;text-align:center;font-family:sans-serif">プレビュー版（公開前の確認用）。フォーム送信・メール・Slack通知は本番環境でのみ動作します。</div>`;
let n = 0;
for (const f of walk(SRC)) {
  let rel = path.relative(SRC, f);
  // 日本語タグのディレクトリ名をASCIIに
  rel = rel.replace(/^blog\/tag\/([^/]+)\//, (_, t) => `blog/tag/${tagSlug(t)}/`);
  const dst = path.join(OUT, rel); fs.mkdirSync(path.dirname(dst), { recursive: true });
  if (!rel.endsWith('.html')) { fs.copyFileSync(f, dst); n++; continue; }
  const depth = rel.split('/').length - 1; const pre = depth ? '../'.repeat(depth) : './';
  let html = fs.readFileSync(f, 'utf8');
  const fix = (p) => {
    let [pathPart, hash] = p.split('#'); hash = hash ? '#' + hash : '';
    pathPart = pathPart.replace(/^\/blog\/tag\/([^/]+)\//, (_, t) => `/blog/tag/${tagSlug(decodeURIComponent(t))}/`);
    if (pathPart === '/' || pathPart === '') return pre + 'index.html' + hash;
    if (pathPart.endsWith('/')) return pre + pathPart.slice(1) + 'index.html' + hash;
    return pre + pathPart.slice(1) + hash;
  };
  html = html.replace(/(href|src)="(\/[^"]*)"/g, (m, attr, p) => p.startsWith('//') ? m : `${attr}="${fix(p)}"`);
  html = html.replace(/"apiEndpoint":"[^"]*"/, '"apiEndpoint":"api-preview"');
  html = html.replace(/<body([^>]*)>/, `<body$1>${banner}`);
  fs.writeFileSync(dst, html); n++;
}
console.log(`preview: ${n} files → preview/`);
