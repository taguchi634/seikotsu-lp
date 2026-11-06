// 検索エンジンへの通知: IndexNow(Bing/Yahoo/Yandex等) に新規・更新URLを送信。Google は sitemap.xml の自動巡回 + Search Console 登録で拾う。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/site.json'), 'utf8'));
const keyFile = path.join(ROOT, 'content/data/indexnow-key.txt');
if (!fs.existsSync(keyFile)) { fs.mkdirSync(path.dirname(keyFile), { recursive: true }); fs.writeFileSync(keyFile, crypto.randomBytes(16).toString('hex')); console.log('indexnow: 鍵を生成しました → 再ビルドで site/<key>.txt が出力されます'); }
const key = fs.readFileSync(keyFile, 'utf8').trim();
const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'site/posts.json'), 'utf8'));
const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const changed = posts.filter((p) => p.date === today || p.updated === today).map((p) => site.siteUrl + p.url);
const urls = [...new Set([site.siteUrl + '/', site.siteUrl + '/blog/', ...changed, ...process.argv.slice(2)])];
if (process.env.SKIP_NOTIFY) { console.log('notify: skipped'); process.exit(0); }
const host = new URL(site.siteUrl).host;
const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host, key, keyLocation: `${site.siteUrl}/${key}.txt`, urlList: urls }) }).catch((e) => ({ status: 'ERR', text: async () => e.message }));
console.log('indexnow:', r.status, urls.length, 'urls', r.status >= 400 ? await r.text() : '');
