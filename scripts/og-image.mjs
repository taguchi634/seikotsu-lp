// サムネ(OG画像)自動生成: 記事タイトルからカード画像を作る。Playwright(Chromium)があればPNG、無ければSVG。
import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter } from './lib/posts.mjs';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/site.json'), 'utf8'));
const OUT = path.join(ROOT, 'src/assets/og');
fs.mkdirSync(OUT, { recursive: true });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function cardHtml({ title, tag, isDefault }) {
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"><style>
  body{margin:0;width:1200px;height:630px;font-family:"Noto Sans CJK JP","Noto Sans JP","Hiragino Sans","Yu Gothic",sans-serif;background:linear-gradient(135deg,#b80016 0%,#e3001b 60%,#ff5a2e 100%);color:#fff;position:relative;overflow:hidden}
  .glow1{position:absolute;right:-200px;top:-260px;width:700px;height:700px;border-radius:50%;background:rgba(245,180,0,.28)}
  .glow2{position:absolute;left:-220px;bottom:-320px;width:640px;height:640px;border-radius:50%;background:rgba(59,26,26,.35)}
  .box{position:absolute;inset:48px;border:3px solid rgba(255,255,255,.18);border-radius:28px}
  .tag{position:absolute;left:96px;top:92px;background:#f5b400;color:#3b1b1b;font-weight:900;font-size:28px;padding:8px 28px;border-radius:999px}
  .title{position:absolute;left:96px;right:96px;top:170px;font-size:${isDefault ? 64 : 56}px;font-weight:900;line-height:1.4;letter-spacing:.02em;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
  .brand{position:absolute;left:96px;bottom:84px;font-size:30px;font-weight:800;opacity:.95}
  .brand small{display:block;font-size:22px;color:#f5b400;font-weight:800;letter-spacing:.06em}
  .logo{position:absolute;right:96px;bottom:84px;width:88px;height:88px;border-radius:22px;background:#3b1a1a;display:flex;align-items:center;justify-content:center;font-size:52px;font-weight:900}
  </style></head><body><div class="glow1"></div><div class="glow2"></div><div class="box"></div>
  <div class="tag">${esc(tag)}</div><div class="title">${esc(title)}</div>
  <div class="brand">${esc(site.siteName)}<small>${esc(site.company)}｜直営130院の経営ノウハウ</small></div><div class="logo">M</div></body></html>`;
}
function cardSvg({ title, tag }) {
  const lines = []; let cur = '';
  for (const ch of title) { cur += ch; if (cur.length >= 18) { lines.push(cur); cur = ''; } }
  if (cur) lines.push(cur);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a1010"/><stop offset=".55" stop-color="#3b1b1b"/><stop offset="1" stop-color="#5a2323"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/><circle cx="1050" cy="90" r="350" fill="#f5b400" opacity=".22"/><circle cx="100" cy="640" r="320" fill="#e3001b" opacity=".4"/><rect x="48" y="48" width="1104" height="534" rx="28" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="3"/><rect x="96" y="92" width="${tag.length * 30 + 56}" height="50" rx="25" fill="#f5b400"/><text x="${124}" y="128" font-family="Noto Sans CJK JP,Hiragino Sans,sans-serif" font-weight="900" font-size="28" fill="#3b1b1b">${esc(tag)}</text>${lines.slice(0, 4).map((l, i) => `<text x="96" y="${225 + i * 76}" font-family="Noto Sans CJK JP,Hiragino Sans,sans-serif" font-weight="900" font-size="54" fill="#fff">${esc(l)}</text>`).join('')}<text x="96" y="530" font-family="Noto Sans CJK JP,Hiragino Sans,sans-serif" font-weight="800" font-size="30" fill="#fff">${esc(site.siteName)}</text><text x="96" y="566" font-family="Noto Sans CJK JP,Hiragino Sans,sans-serif" font-weight="800" font-size="22" fill="#f5b400">${esc(site.company)}｜直営130院の経営ノウハウ</text><rect x="1016" y="458" width="88" height="88" rx="22" fill="#e3001b"/><text x="1060" y="520" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-weight="900" font-size="52" fill="#fff">M</text></svg>`;
}

const posts = fs.readdirSync(path.join(ROOT, 'content/posts')).filter((f) => f.endsWith('.md')).map((f) => {
  const { data } = parseFrontmatter(fs.readFileSync(path.join(ROOT, 'content/posts', f), 'utf8'));
  const slug = data.slug || f.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
  return { slug, title: data.title, tag: (Array.isArray(data.tags) ? data.tags[0] : '') || site.blogName };
});
const jobs = [{ slug: '../og-default', title: site.tagline, tag: site.blogName, isDefault: true }, ...posts].filter((j) => process.argv.includes('--force') || !fs.existsSync(path.join(OUT, j.slug + '.png')));
if (!jobs.length) { console.log('og: nothing to do'); process.exit(0); }

let browser = null;
try {
  let pw; try { pw = await import('playwright'); } catch { const { createRequire } = await import('node:module'); pw = createRequire(process.env.PLAYWRIGHT_RESOLVE_FROM || '/opt/node-tools/node_modules/')('playwright'); }
  browser = await pw.chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {});
} catch (e) { console.warn('og: playwright not available, falling back to SVG:', e.message.split('\n')[0]); }
for (const j of jobs) {
  const file = path.join(OUT, j.slug + (browser ? '.png' : '.svg'));
  if (browser) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    await page.setContent(cardHtml(j)); await page.waitForTimeout(150);
    await page.screenshot({ path: file, type: 'png' }); await page.close();
  } else fs.writeFileSync(file, cardSvg(j));
  console.log('og:', path.relative(ROOT, file));
}
if (browser) await browser.close();
