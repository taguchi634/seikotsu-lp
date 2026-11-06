// ブログ記事の自動執筆: ネタ選定 → Claude で執筆(構造化出力) → 安全ゲート → content/posts/ へ保存（NGは content/drafts/）
// 環境変数: ANTHROPIC_API_KEY（または ant auth login のプロファイル）/ 任意: POST_MODEL, POSTS_PER_RUN
import fs from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { parseFrontmatter, stringifyFrontmatter } from './lib/posts.mjs';
import { safetyCheck } from './lib/safety.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/site.json'), 'utf8'));
const topicsFile = path.join(ROOT, 'content/topics.json');
const topics = JSON.parse(fs.readFileSync(topicsFile, 'utf8'));
const POSTS = path.join(ROOT, 'content/posts'), DRAFTS = path.join(ROOT, 'content/drafts'), DATA = path.join(ROOT, 'content/data');
fs.mkdirSync(DRAFTS, { recursive: true }); fs.mkdirSync(DATA, { recursive: true });
const MODEL = process.env.POST_MODEL || 'claude-opus-5-5';
const PER_RUN = Number(process.env.POSTS_PER_RUN || 1);
const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10); // JST

const existing = fs.readdirSync(POSTS).filter((f) => f.endsWith('.md')).map((f) => { const { data } = parseFrontmatter(fs.readFileSync(path.join(POSTS, f), 'utf8')); return { file: f, title: data.title, tags: data.tags || [], slug: data.slug || f.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, ''), keyword: data.keyword || '' }; });

// ネタ選定: 1) GSCで伸びているクエリ(未執筆) 2) queue 3) keywords×angles からランダム
function pickTopic() {
  const gscFile = path.join(DATA, 'gsc-latest.json');
  if (fs.existsSync(gscFile)) {
    const g = JSON.parse(fs.readFileSync(gscFile, 'utf8'));
    const cand = (g.risingQueries || []).find((q) => !existing.some((p) => p.keyword === q.query || p.title.includes(q.query)));
    if (cand) return { keyword: cand.query, angle: '検索意図に正面から答える', source: 'gsc' };
  }
  if (topics.queue?.length) { const t = topics.queue.shift(); fs.writeFileSync(topicsFile, JSON.stringify(topics, null, 2)); return { ...t, source: 'queue' }; }
  const used = new Set(existing.map((p) => p.keyword));
  const kws = topics.keywords.filter((k) => !used.has(k)); const kw = kws[Math.floor(Math.random() * kws.length)] || topics.keywords[Math.floor(Math.random() * topics.keywords.length)];
  return { keyword: kw, angle: topics.angles[Math.floor(Math.random() * topics.angles.length)], source: 'random' };
}

const Post = z.object({
  title: z.string().describe('記事タイトル。検索キーワードを前方に含め、15〜40文字。【治療家ONLINE】などの装飾は付けない'),
  slug: z.string().describe('URL用の英小文字とハイフンのみ。例: seikotsuin-meo-taisaku'),
  description: z.string().describe('メタディスクリプション 80〜120文字。検索結果でクリックしたくなる要約'),
  tags: z.array(z.string()).describe('既存タグを優先して2〜3個: 集客 / リピート / 採用・教育 / 開業 / 経営 / 交通事故 / 問診 / MEO / SNS / 財務'),
  body: z.string().describe('本文Markdown。H1は書かない。## 見出しを4〜6個。2500〜4500文字。導入→本文→「明日からできること」→まとめ の順'),
  faq: z.array(z.object({ q: z.string(), a: z.string() })).describe('記事内容に関するよくある質問 2〜3個（FAQ構造化データ用）'),
});

const SYSTEM = `あなたは「${site.blogName}」の編集者です。運営は${site.company}（${site.siteName}）。全国130院の整骨院を直営運営し、整骨院オーナー向けに開業支援・集客コンサル・フランチャイズを提供しています。
読者: 整骨院・接骨院の院長、開業予定の柔道整復師。
目的: 検索で見つけてもらい、読んで役に立ち、最後に「無料相談」「1分経営力診断」につながること。

執筆ルール:
- 既存記事と同じ文体（「こんにちは。治療家ONLINEです。」で始め、丁寧語、短い段落、具体例、「明日からできること」と「まとめ」で締める）
- 現場の具体例・数字の目安・チェック項目を入れる。抽象論で終わらせない
- 直営130院での実践を「当社の直営院では〜」と一人称で語ってよいが、具体的な院名・個人名・金額の捏造はしない
- 医療広告ガイドライン・薬機法に配慮: 「治る」「完治」「必ず」「100%」「日本一」などの断定・最上級表現は使わない。施術の効果を保証しない
- 保険診療の不正や患者を欺く手法は書かない
- 文末に自然な形で ${site.siteName} の無料相談と経営力診断への導線を1〜2文入れる（URLは書かない。ビルド側で付与）
- Markdownのみ。HTMLタグは使わない。H1(#)は書かない`;

async function writePost(topic) {
  if (process.env.DRY_RUN) { // APIを呼ばずにパイプラインを確認する
    const body = ['こんにちは。治療家ONLINEです。', `「${topic.keyword}」で悩む院長様へ、現場で効いた型をお伝えします。`, '## なぜうまくいかないのか', 'あ'.repeat(600), '## 直営院で効いた3つの型', 'い'.repeat(700), '## 数字の目安', 'う'.repeat(500), '## 明日からできること', 'え'.repeat(300), '## まとめ', 'まずは無料相談と経営力診断から始めてみてください。'].join('\n\n');
    return { post: { title: `${topic.keyword.replace(/ /g, 'の')}｜直営130院で効いた3つの型`, slug: 'dry-run-' + Date.now(), description: `${topic.keyword}について、直営130院の現場で効いた型を3つにまとめました。数字の目安と明日からできるチェック項目つきで、院長様がすぐ動ける内容です。`, tags: ['集客'], body, faq: [{ q: 'どれくらいで成果が出ますか？', a: '早い院で1〜3か月が目安です。' }] }, usage: { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0 }, model: 'dry-run' };
  }
  const client = new Anthropic();
  const refTitles = existing.map((p) => `- ${p.title}`).join('\n');
  const stream = client.beta.messages.stream({
    model: MODEL, max_tokens: 16000, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    output_config: { format: zodOutputFormat(Post), effort: 'high' },
    messages: [{ role: 'user', content: `次の条件でブログ記事を1本書いてください。\n\n検索キーワード: ${topic.keyword}\n切り口: ${topic.angle || '読者が最初に知りたいことに答える'}${topic.title ? `\nタイトル案: ${topic.title}（改善してよい）` : ''}\n\n既存記事（重複を避け、関連があれば本文中で「関連記事」として触れてよい）:\n${refTitles}\n\n今日の日付: ${today}` }],
  });
  const msg = await stream.finalMessage();
  if (msg.stop_reason === 'refusal') throw new Error(`refused: ${msg.stop_details?.category || ''}`);
  if (msg.stop_reason === 'max_tokens') throw new Error('max_tokens: 出力が途中で切れました');
  const text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  const parsed = Post.safeParse(JSON.parse(text));
  if (!parsed.success) throw new Error('schema: ' + parsed.error.message);
  return { post: parsed.data, usage: msg.usage, model: msg.model };
}

const log = { date: today, generated: [], rejected: [], errors: [] };
for (let n = 0; n < PER_RUN; n++) {
  const topic = pickTopic();
  console.log(`[${n + 1}/${PER_RUN}] topic:`, topic);
  try {
    const { post, usage, model } = await writePost(topic);
    const check = safetyCheck({ ...post, existingTitles: existing.map((p) => p.title) });
    const slug = (post.slug || topic.keyword).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || `post-${Date.now()}`;
    const uniqueSlug = existing.some((p) => p.slug === slug) ? `${slug}-${today.replace(/-/g, '')}` : slug;
    const fm = { title: post.title, date: today, description: post.description, tags: post.tags, slug: uniqueSlug, keyword: topic.keyword, source: `ai:${model}`, faq: post.faq };
    const md = stringifyFrontmatter(check.ok ? fm : { ...fm, draft: true }, post.body);
    const file = `${today}-${uniqueSlug}.md`;
    if (check.ok) {
      fs.writeFileSync(path.join(POSTS, file), md); existing.push({ file, title: post.title, tags: post.tags, slug: uniqueSlug, keyword: topic.keyword });
      log.generated.push({ file, title: post.title, keyword: topic.keyword, length: check.length, warnings: check.warnings, usage: { in: usage.input_tokens, out: usage.output_tokens, cached: usage.cache_read_input_tokens }, model });
      console.log('✅ published:', file, check.warnings.length ? 'warnings: ' + check.warnings.join(' | ') : '');
    } else {
      fs.writeFileSync(path.join(DRAFTS, file), `<!-- 安全ゲートNG:\n${check.errors.join('\n')}\n-->\n` + md);
      log.rejected.push({ file, title: post.title, errors: check.errors, warnings: check.warnings });
      console.log('⛔ rejected → drafts:', file, check.errors.join(' | '));
    }
  } catch (e) { console.error('❌ error:', e.message); log.errors.push({ topic, error: e.message }); }
}
fs.writeFileSync(path.join(DATA, `report-${today}.json`), JSON.stringify(log, null, 2));
if (!log.generated.length && log.errors.length) process.exit(1);
