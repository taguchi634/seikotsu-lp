// 全記事に安全ゲートをかける（CI用・手動執筆の記事もチェック）
import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter } from './lib/posts.mjs';
import { safetyCheck } from './lib/safety.mjs';
const dir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../content/posts');
let bad = 0;
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
const titles = files.map((f) => parseFrontmatter(fs.readFileSync(path.join(dir, f), 'utf8')).data.title);
for (const f of files) {
  const { data, body } = parseFrontmatter(fs.readFileSync(path.join(dir, f), 'utf8'));
  const r = safetyCheck({ title: data.title, description: data.description, body, tags: data.tags, existingTitles: titles.filter((t) => t !== data.title) });
  const errs = data.source === 'imported' ? r.errors.filter((e) => !/短すぎ|タイトルの長さ|ディスクリプションの長さ|H2見出し/.test(e)) : r.errors; // Studioから移行した既存記事は長さ・見出し基準を免除（表現チェックのみ）
  if (errs.length) { bad++; console.log(`⛔ ${f}\n   ${errs.join('\n   ')}`); } else if (r.warnings.length) console.log(`⚠️ ${f}: ${r.warnings.join(' / ')}`); else console.log(`✅ ${f}`);
}
if (bad) process.exit(1);
