// 静的サイトビルド: content/ → site/
import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import { lpPage, shindanPage, blogIndexPage, postPage, privacyPage, notFoundPage, esc } from './lib/templates.mjs';
import { parseFrontmatter } from './lib/posts.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'site');
const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/site.json'), 'utf8'));
const dateJa = (d) => { const [y, m, dd] = d.split('-'); return `${y}年${+m}月${+dd}日`; };
const write = (rel, content) => { const f = path.join(OUT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, content); };
const copyDir = (src, dst) => { fs.mkdirSync(dst, { recursive: true }); for (const e of fs.readdirSync(src, { withFileTypes: true })) { const s = path.join(src, e.name), d = path.join(dst, e.name); e.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d); } };

// 1. 記事読み込み
marked.setOptions({ gfm: true, breaks: false });
const postDir = path.join(ROOT, 'content/posts');
const posts = fs.readdirSync(postDir).filter((f) => f.endsWith('.md')).map((f) => {
  const raw = fs.readFileSync(path.join(postDir, f), 'utf8');
  const { data, body } = parseFrontmatter(raw);
  const slug = data.slug || f.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
  const date = String(data.date);
  const ogFile = `/assets/og/${slug}.png`;
  const hasOg = fs.existsSync(path.join(ROOT, 'src', ogFile)) || fs.existsSync(path.join(OUT, ogFile));
  return {
    slug, file: f, title: data.title, description: data.description || '', date, dateJa: dateJa(date), updated: data.updated ? String(data.updated) : null, updatedJa: data.updated ? dateJa(String(data.updated)) : null,
    tags: Array.isArray(data.tags) ? data.tags : (data.tags ? String(data.tags).split(',').map((t) => t.trim()) : []), draft: !!data.draft, faq: data.faq || [],
    url: `/blog/${slug}/`, html: marked.parse(body), ogImage: hasOg ? ogFile : '/assets/og-default.png', ogImageAbs: site.siteUrl + (hasOg ? ogFile : '/assets/og-default.png'),
  };
}).filter((p) => !p.draft).sort((a, b) => (a.date < b.date ? 1 : -1));

// 2. 出力先を作り直し（既存ハッシュHTML群には触れない）
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
copyDir(path.join(ROOT, 'src/assets'), path.join(OUT, 'assets'));

// 3. ページ生成
write('index.html', lpPage(site, posts));
write('shindan/index.html', shindanPage(site));
write('blog/index.html', blogIndexPage(site, posts));
for (const t of new Set(posts.flatMap((p) => p.tags))) write(`blog/tag/${t}/index.html`, blogIndexPage(site, posts.filter((p) => p.tags.includes(t)), { tag: t }));
for (const p of posts) {
  const related = posts.filter((o) => o.slug !== p.slug).map((o) => ({ o, score: o.tags.filter((t) => p.tags.includes(t)).length })).sort((a, b) => b.score - a.score).slice(0, 3).map((x) => x.o);
  write(`blog/${p.slug}/index.html`, postPage(site, p, related));
}
write('privacy/index.html', privacyPage(site));
write('404.html', notFoundPage(site));

// 4. sitemap / robots / RSS / 記事インデックス
const urls = [{ loc: '/', pri: '1.0', freq: 'weekly' }, { loc: '/shindan/', pri: '0.9', freq: 'monthly' }, { loc: '/blog/', pri: '0.8', freq: 'daily', mod: posts[0]?.date }, ...posts.map((p) => ({ loc: p.url, pri: '0.7', freq: 'monthly', mod: p.updated || p.date })), { loc: '/privacy/', pri: '0.2', freq: 'yearly' }];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${site.siteUrl}${u.loc}</loc>${u.mod ? `<lastmod>${u.mod}</lastmod>` : ''}<changefreq>${u.freq}</changefreq><priority>${u.pri}</priority></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${site.siteUrl}/sitemap.xml\n`);
write('feed.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${esc(site.blogName)}</title><link>${site.siteUrl}/blog/</link><description>${esc(site.description)}</description><language>ja</language>\n${posts.slice(0, 20).map((p) => `<item><title>${esc(p.title)}</title><link>${site.siteUrl}${p.url}</link><guid>${site.siteUrl}${p.url}</guid><pubDate>${new Date(p.date).toUTCString()}</pubDate><description>${esc(p.description)}</description></item>`).join('\n')}\n</channel></rss>\n`);
write('posts.json', JSON.stringify(posts.map(({ html, ...p }) => p), null, 1));
// IndexNow キー
const keyFile = path.join(ROOT, 'content/data/indexnow-key.txt');
if (fs.existsSync(keyFile)) { const k = fs.readFileSync(keyFile, 'utf8').trim(); write(`${k}.txt`, k); }

console.log(`build ok: ${posts.length} posts, ${urls.length} urls → ${path.relative(ROOT, OUT)}/`);
