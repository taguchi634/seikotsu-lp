// 毎晩のレポート: 生成結果 + GSC実績 + リライト候補 を Slack に投稿（SLACK_WEBHOOK_URL 未設定なら標準出力）
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/site.json'), 'utf8'));
const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const rd = (f) => { const p = path.join(ROOT, 'content/data', f); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; };
const gen = rd(`report-${today}.json`), gsc = rd('gsc-latest.json');
const posts = fs.existsSync(path.join(ROOT, 'site/posts.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'site/posts.json'), 'utf8')) : [];
const lines = [`📊 *${site.blogName} 夜間レポート（${today}）*`, `記事数: ${posts.length}本`];
if (gen) {
  lines.push(`✍️ 生成: ${gen.generated.length}本 / ⛔ 安全ゲートNG: ${gen.rejected.length}本 / ❌ エラー: ${gen.errors.length}件`);
  gen.generated.forEach((g) => lines.push(`　・<${site.siteUrl}/blog/${g.file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '')}/|${g.title}>（${g.length}文字, in ${g.usage.in}/out ${g.usage.out} tok）`));
  gen.rejected.forEach((g) => lines.push(`　・NG: ${g.title} → ${g.errors.join(' / ')}`));
  gen.errors.forEach((g) => lines.push(`　・ERR: ${g.topic?.keyword || ''} → ${g.error}`));
} else lines.push('✍️ 今夜の生成ログなし');
if (gsc) {
  const t = gsc.total, dc = t.clicks - t.prevClicks, di = t.impressions - t.prevImpressions;
  lines.push(`🔍 Search Console（${gsc.period.start}〜${gsc.period.end}）: クリック ${t.clicks}（${dc >= 0 ? '+' : ''}${dc}） / 表示 ${t.impressions}（${di >= 0 ? '+' : ''}${di}）`);
  if (gsc.topQueries?.length) lines.push('　上位クエリ: ' + gsc.topQueries.slice(0, 5).map((q) => `${q.query}（${q.position}位/${q.clicks}cl）`).join('、'));
  if (gsc.risingQueries?.length) lines.push('　📈 伸びているクエリ: ' + gsc.risingQueries.slice(0, 5).map((q) => q.query).join('、'));
  if (gsc.rewriteQueue?.length) lines.push('　♻️ リライト候補: ' + gsc.rewriteQueue.slice(0, 3).map((p) => `${p.page.replace(site.siteUrl, '')}（${p.reason}）`).join(' / '));
} else lines.push('🔍 Search Console 未連携（GSC_SERVICE_ACCOUNT_JSON を設定すると順位・クエリが出ます）');
const text = lines.join('\n');
console.log(text);
if (process.env.SLACK_WEBHOOK_URL) await fetch(process.env.SLACK_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) }).then((r) => console.log('slack:', r.status)).catch((e) => console.warn('slack failed', e.message));
