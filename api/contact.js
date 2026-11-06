// 問い合わせAPI (Vercel Serverless Function)
// 受付 → ボット判定 → 自動返信メール(診断レポート含む) → 社内通知メール → Slack通知 → スプレッドシート(GAS) 記録
// 必要な環境変数: RESEND_API_KEY, MAIL_FROM, MAIL_TO / 任意: SLACK_WEBHOOK_URL, SHEETS_WEBHOOK_URL, SHEETS_TOKEN, BOOKING_URL, SITE_URL, TURNSTILE_SECRET
import fs from 'node:fs';
import path from 'node:path';

const site = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content/site.json'), 'utf8'));
const env = (k, d = '') => process.env[k] || d;
const SITE_URL = env('SITE_URL', site.siteUrl);
const BOOKING_URL = env('BOOKING_URL', site.bookingUrl);
const TYPE_LABEL = { contact: '無料相談', shindan: '経営力診断', seminar: 'セミナー申込', document: '資料請求' };

// 簡易レート制限（同一インスタンス内。目安: 1IPあたり10分に5件）
const hits = globalThis.__hits || (globalThis.__hits = new Map());
function rateLimited(ip) {
  const now = Date.now(), win = 10 * 60 * 1000;
  const arr = (hits.get(ip) || []).filter((t) => now - t < win);
  arr.push(now); hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > 5;
}
const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nl2br = (s = '') => esc(s).replace(/\n/g, '<br>');

async function sendMail({ to, subject, html, replyTo }) {
  const key = env('RESEND_API_KEY'); if (!key) { console.warn('RESEND_API_KEY missing: mail skipped'); return { skipped: true }; }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env('MAIL_FROM', `${site.siteName} <noreply@example.com>`), to: Array.isArray(to) ? to : [to], subject, html, reply_to: replyTo }),
  });
  if (!res.ok) throw new Error(`resend ${res.status}: ${await res.text()}`);
  return res.json();
}
async function slack(text, blocks) {
  const url = env('SLACK_WEBHOOK_URL'); if (!url) return;
  await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(blocks ? { text, blocks } : { text }) }).catch((e) => console.warn('slack failed', e.message));
}
async function sheet(row) {
  const url = env('SHEETS_WEBHOOK_URL'); if (!url) return;
  await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: env('SHEETS_TOKEN'), ...row }) }).catch((e) => console.warn('sheet failed', e.message));
}
async function verifyTurnstile(token, ip) {
  const secret = env('TURNSTILE_SECRET'); if (!secret) return true;
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secret, response: token, remoteip: ip }) });
  return (await r.json().catch(() => ({}))).success === true;
}

function wrap(title, inner) {
  return `<!DOCTYPE html><html lang="ja"><body style="margin:0;background:#f6f3f0;font-family:'Hiragino Sans','Yu Gothic',Meiryo,sans-serif;color:#222;line-height:1.8">
<div style="max-width:620px;margin:0 auto;padding:24px 16px">
<div style="background:#3b1b1b;color:#fff;border-radius:14px 14px 0 0;padding:20px 24px"><div style="font-size:12px;color:#f5b400;font-weight:700;letter-spacing:.08em">${esc(site.company)}</div><div style="font-size:20px;font-weight:900">${esc(title)}</div></div>
<div style="background:#fff;padding:24px;border-radius:0 0 14px 14px;border:1px solid #e9e4e0;border-top:0">${inner}</div>
<p style="font-size:12px;color:#888;margin-top:16px">${esc(site.company)}（${esc(site.siteName)}）<br>${esc(site.address)}<br>TEL ${esc(site.tel)}</p>
</div></body></html>`;
}
const btn = (href, label, color = '#e3001b') => `<a href="${href}" style="display:inline-block;background:${color};color:#fff;font-weight:800;text-decoration:none;padding:12px 26px;border-radius:999px;margin:6px 6px 6px 0">${esc(label)}</a>`;

function shindanReport(d) {
  const r = d.shindan || {}; const lv = site.shindan.levels[(r.levelIndex || 1) - 1] || site.shindan.levels[0];
  const rows = Object.entries(r.answers || {}).map(([k, v]) => { const q = site.shindan.questions.find((q) => q.id === k); return q ? `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:13px;color:#666">${esc(q.q)}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;font-weight:700;font-size:13px">${esc(v)}</td></tr>` : ''; }).join('');
  return `
<p>${esc(d.name)} 様</p><p>「${esc(site.shindan.title)}」をご利用いただきありがとうございます。診断結果をお送りします。</p>
<div style="background:linear-gradient(135deg,#3b1b1b,#5a2323);color:#fff;border-radius:12px;padding:18px 20px;text-align:center"><div style="font-size:12px;opacity:.9">あなたの院の診断結果</div><div style="font-size:22px;font-weight:900;color:#f5b400">${esc(r.level || lv.name)}</div><div style="font-size:14px">スコア ${esc(r.score)} / ${esc(r.max)} 点</div></div>
<p style="margin-top:16px;font-weight:700">${esc(lv.summary)}</p>
<h3 style="color:#e3001b;font-size:15px;margin:18px 0 6px">今すぐできる3つのアクション</h3><ol style="padding-left:20px">${lv.advice.map((a) => `<li>${esc(a)}</li>`).join('')}</ol>
${r.issue && site.shindan.issueNotes[r.issue] ? `<p style="background:#fff3cc;border-radius:10px;padding:10px 14px;font-weight:700">${esc(site.shindan.issueNotes[r.issue])}</p>` : ''}
<h3 style="font-size:14px;margin:18px 0 6px;color:#666">ご回答内容</h3><table style="width:100%;border-collapse:collapse">${rows}</table>
<h3 style="color:#e3001b;font-size:15px;margin:22px 0 6px">業界平均との比較（直営130院のデータより）</h3>
<ul style="padding-left:20px;font-size:14px"><li>リピート率（2回目来院）：平均 60〜70%、むさし直営院の仕組み導入後 80%</li><li>Googleマップ口コミ：上位表示の目安は地域内で30件以上・返信率100%</li><li>自費率：安定経営ラインは 50%以上</li><li>新規患者：1人院で月15名以上、複数名院で月30名以上が成長ライン</li></ul>
<p style="margin-top:18px">${esc(lv.cta)}</p>
<p style="text-align:center;margin:18px 0">${BOOKING_URL ? btn(BOOKING_URL, '無料相談の日程を選ぶ') : btn(SITE_URL + '/#contact', '無料相談を申し込む')} ${btn(SITE_URL + '/#document', '弱点分析シートを請求', '#3b1b1b')}</p>
<p style="font-size:13px;color:#666">参考記事：<a href="${SITE_URL}/blog/">${esc(site.blogName)}</a>（問診・紹介・スタッフ教育のノウハウ）</p>`;
}
function autoReply(d) {
  if (d.type === 'shindan') return { subject: `【診断結果】${d.shindan?.level || ''}｜${site.shindan.title}`, html: wrap('経営力診断レポート', shindanReport(d)) };
  const label = TYPE_LABEL[d.type] || 'お問い合わせ';
  const items = (d.items || []).join('、');
  const body = `<p>${esc(d.name)} 様</p><p>${esc(label)}のお申し込みを受け付けました。担当者より1営業日以内にご連絡いたします。</p>
<table style="width:100%;border-collapse:collapse;font-size:14px"><tr><td style="padding:6px 8px;color:#666;width:9em">項目</td><td style="padding:6px 8px;font-weight:700">${esc(items || '-')}</td></tr><tr><td style="padding:6px 8px;color:#666">整骨院名</td><td style="padding:6px 8px">${esc(d.clinic || '-')}</td></tr>${d.dates ? `<tr><td style="padding:6px 8px;color:#666">希望日時</td><td style="padding:6px 8px">${esc(d.dates)}</td></tr>` : ''}${d.message ? `<tr><td style="padding:6px 8px;color:#666;vertical-align:top">内容</td><td style="padding:6px 8px">${nl2br(d.message)}</td></tr>` : ''}</table>
${d.type === 'document' ? `<p style="margin-top:14px">資料は担当者が内容を確認のうえ、このメールアドレス宛にお送りします。</p>` : ''}
<p style="text-align:center;margin:18px 0">${BOOKING_URL ? btn(BOOKING_URL, '先に日程を押さえる') : ''} ${btn(SITE_URL + '/shindan/', '1分で経営力診断', '#f5b400')}</p>
<p style="font-size:13px;color:#666">お急ぎの場合はお電話（${esc(site.tel)}）でもご相談いただけます。</p>`;
  return { subject: `【${site.siteName}】${label}を受け付けました`, html: wrap(`${label}を受け付けました`, body) };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method' });
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || '?';
  let d = req.body; if (typeof d === 'string') { try { d = JSON.parse(d); } catch { d = {}; } } d = d || {};

  // --- ボット対策 ---
  if (d.website) return res.status(200).json({ ok: true });                    // ハニーポット: 黙って成功扱い
  if (typeof d.t === 'number' && d.t < 2500) return res.status(400).json({ ok: false, error: 'too_fast' });
  if (rateLimited(ip)) return res.status(429).json({ ok: false, error: 'rate_limited' });
  if (!(await verifyTurnstile(d.turnstile, ip))) return res.status(400).json({ ok: false, error: 'captcha' });
  const email = String(d.email || '').trim();
  if (!d.name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ ok: false, error: 'invalid' });
  if (!['contact', 'shindan', 'seminar', 'document'].includes(d.type)) d.type = 'contact';
  for (const k of ['name', 'clinic', 'tel', 'message', 'dates', 'address', 'page', 'ref']) d[k] = String(d[k] || '').slice(0, 2000);

  const label = TYPE_LABEL[d.type]; const when = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
  const summary = [`種別: ${label}`, `お名前: ${d.name}`, `院名: ${d.clinic}`, `メール: ${email}`, `TEL: ${d.tel}`, d.items?.length ? `項目: ${d.items.join('、')}` : '', d.dates ? `希望日時: ${d.dates}` : '', d.shindan ? `診断: ${d.shindan.level}（${d.shindan.score}/${d.shindan.max}点）課題: ${d.shindan.issue || '-'}` : '', d.message ? `内容: ${d.message}` : '', `ページ: ${d.page}  参照元: ${d.ref || '-'}`].filter(Boolean).join('\n');

  const results = await Promise.allSettled([
    sendMail({ to: email, ...autoReply(d) }),
    env('MAIL_TO') ? sendMail({ to: env('MAIL_TO').split(','), subject: `【新規リード】${label}｜${d.name}（${d.clinic || '院名未記入'}）`, replyTo: email, html: wrap(`新規リード: ${label}`, `<pre style="white-space:pre-wrap;font-family:inherit;font-size:14px">${esc(summary)}</pre><p>${btn(`mailto:${email}`, 'メールで返信')} ${d.tel ? btn(`tel:${d.tel.replace(/-/g, '')}`, '電話する', '#3b1b1b') : ''}</p>`) }) : null,
    slack(`🔔 新規リード【${label}】${d.name}（${d.clinic || '-'}）`, [
      { type: 'header', text: { type: 'plain_text', text: `🔔 新規リード：${label}` } },
      { type: 'section', fields: [{ type: 'mrkdwn', text: `*お名前*\n${d.name}` }, { type: 'mrkdwn', text: `*院名*\n${d.clinic || '-'}` }, { type: 'mrkdwn', text: `*メール*\n${email}` }, { type: 'mrkdwn', text: `*TEL*\n${d.tel || '-'}` }] },
      ...(d.shindan ? [{ type: 'section', text: { type: 'mrkdwn', text: `*診断結果* ${d.shindan.level}（${d.shindan.score}/${d.shindan.max}点）／課題: ${d.shindan.issue || '-'}` } }] : []),
      ...(d.items?.length || d.message || d.dates ? [{ type: 'section', text: { type: 'mrkdwn', text: [d.items?.length ? `*項目* ${d.items.join('、')}` : '', d.dates ? `*希望日時* ${d.dates}` : '', d.message ? `*内容* ${d.message.slice(0, 500)}` : ''].filter(Boolean).join('\n') } }] : []),
      { type: 'context', elements: [{ type: 'mrkdwn', text: `${when}｜${d.page}｜参照元 ${d.ref || '-'}` }] },
    ]),
    sheet({ when, type: label, name: d.name, clinic: d.clinic, email, tel: d.tel, items: (d.items || []).join('、'), level: d.shindan?.level || '', score: d.shindan?.score ?? '', issue: d.shindan?.issue || '', message: d.message, dates: d.dates, page: d.page, ref: d.ref, status: '新規' }),
  ]);
  results.forEach((r, i) => { if (r.status === 'rejected') console.error('step', i, 'failed:', r.reason?.message); });
  if (results[0].status === 'rejected' && results[1]?.status === 'rejected') return res.status(502).json({ ok: false, error: 'mail_failed' });

  const message = d.type === 'shindan' ? '診断レポートをメールでお送りしました。' + (BOOKING_URL ? ` <a href="${BOOKING_URL}" target="_blank" rel="noopener">無料相談の日程調整はこちら</a>` : '') : `${label}を受け付けました。確認メールをお送りしましたのでご確認ください。` + (BOOKING_URL ? ` <a href="${BOOKING_URL}" target="_blank" rel="noopener">日程調整はこちら</a>` : '');
  return res.status(200).json({ ok: true, message });
}
