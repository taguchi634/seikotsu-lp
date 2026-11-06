// Search Console 連携: 直近28日のクエリ/ページ実績を取得し、伸びているクエリ・リライト候補を content/data/gsc-latest.json に保存
// 環境変数: GSC_SERVICE_ACCOUNT_JSON（サービスアカウント鍵JSONの中身）/ 任意: GSC_SITE_URL（既定: site.json の siteUrl + '/'）
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/site.json'), 'utf8'));
const OUT = path.join(ROOT, 'content/data/gsc-latest.json');
const saJson = process.env.GSC_SERVICE_ACCOUNT_JSON;
if (!saJson) { console.log('gsc: GSC_SERVICE_ACCOUNT_JSON 未設定のためスキップ'); process.exit(0); }
const sa = JSON.parse(saJson);
const SITE = process.env.GSC_SITE_URL || site.siteUrl + '/';

const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
async function token() {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
  const sig = crypto.sign('RSA-SHA256', Buffer.from(unsigned), sa.private_key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${unsigned}.${sig}` });
  if (!r.ok) throw new Error('token ' + r.status + ' ' + await r.text());
  return (await r.json()).access_token;
}
const fmt = (d) => d.toISOString().slice(0, 10);
async function query(tok, body) {
  const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`, { method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error('query ' + r.status + ' ' + await r.text());
  return (await r.json()).rows || [];
}
const tok = await token();
const end = new Date(Date.now() - 3 * 86400e3), start = new Date(end - 28 * 86400e3), prevStart = new Date(start - 28 * 86400e3);
const [cur, prev, pages, daily] = await Promise.all([
  query(tok, { startDate: fmt(start), endDate: fmt(end), dimensions: ['query'], rowLimit: 500 }),
  query(tok, { startDate: fmt(prevStart), endDate: fmt(start), dimensions: ['query'], rowLimit: 500 }),
  query(tok, { startDate: fmt(start), endDate: fmt(end), dimensions: ['page'], rowLimit: 200 }),
  query(tok, { startDate: fmt(start), endDate: fmt(end), dimensions: ['date'] }),
]);
const prevMap = new Map(prev.map((r) => [r.keys[0], r]));
const queries = cur.map((r) => { const p = prevMap.get(r.keys[0]); return { query: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: +(r.ctr * 100).toFixed(1), position: +r.position.toFixed(1), prevImpressions: p?.impressions || 0, growth: p ? +(r.impressions / Math.max(p.impressions, 1)).toFixed(2) : null }; });
const risingQueries = queries.filter((q) => q.impressions >= 20 && (q.growth === null || q.growth >= 1.5)).sort((a, b) => b.impressions - a.impressions).slice(0, 20);
const lowCtr = queries.filter((q) => q.impressions >= 100 && q.position <= 15 && q.ctr < 2).sort((a, b) => b.impressions - a.impressions).slice(0, 20);
const pageRows = pages.map((r) => ({ page: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: +(r.ctr * 100).toFixed(1), position: +r.position.toFixed(1) }));
// リライト候補: 表示は多いのに順位が6〜20位 / CTRが低い記事
const rewriteQueue = pageRows.filter((p) => p.page.includes('/blog/') && p.impressions >= 50 && (p.position > 6 || p.ctr < 2)).sort((a, b) => b.impressions - a.impressions).slice(0, 10).map((p) => ({ ...p, reason: p.position > 6 ? `順位${p.position}位: 見出し追加・内容拡充で上位を狙う` : `CTR${p.ctr}%: タイトル/ディスクリプションを改善` }));
const total = { clicks: daily.reduce((s, r) => s + r.clicks, 0), impressions: daily.reduce((s, r) => s + r.impressions, 0), prevClicks: prev.reduce((s, r) => s + r.clicks, 0), prevImpressions: prev.reduce((s, r) => s + r.impressions, 0) };
fs.writeFileSync(OUT, JSON.stringify({ fetchedAt: new Date().toISOString(), period: { start: fmt(start), end: fmt(end) }, total, topQueries: queries.sort((a, b) => b.clicks - a.clicks).slice(0, 30), risingQueries, lowCtr, topPages: pageRows.sort((a, b) => b.clicks - a.clicks).slice(0, 30), rewriteQueue, daily: daily.map((r) => ({ date: r.keys[0], clicks: r.clicks, impressions: r.impressions })) }, null, 2));
fs.writeFileSync(path.join(ROOT, 'content/data/rewrite-queue.json'), JSON.stringify(rewriteQueue, null, 2));
console.log(`gsc ok: ${total.clicks} clicks / ${total.impressions} imp (28d), rising ${risingQueries.length}, rewrite ${rewriteQueue.length}`);
