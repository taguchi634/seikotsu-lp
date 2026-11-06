// 安全ゲート: 医療広告ガイドライン・薬機法・景表法に抵触しやすい表現と品質をチェック。NGなら公開せず下書きへ。
const BANNED = [
  { re: /(必ず|絶対に?|100%|確実に)(治|改善|効|儲|売上が上が)/g, why: '断定的な効果・成果の保証表現' },
  { re: /完治|根治|治ります|治せます|治る/g, why: '「治る」系の表現（整骨院の施術に治療効果を断定できません）' },
  { re: /副作用(が|は)(ない|ありません)|安全性は保証/g, why: '安全性の断定' },
  { re: /日本一|No\.?1|ナンバーワン|唯一|最高の|最安/g, why: '最上級表現（客観的根拠の提示が必要）' },
  { re: /誰でも(簡単に)?(稼げ|儲か)|楽して|放置で/g, why: '誇大な収益表現' },
  { re: /癌|がんが|ガンが|糖尿病が治|うつ病が治/g, why: '疾病の治癒を示唆' },
  { re: /患者(を|様を)(騙|だま)|保険(の)?不正|水増し/g, why: '不正を示唆する内容' },
];
const WARN = [
  { re: /〇〇|○○|XX|TODO|\[要確認\]|（仮）/g, why: '未記入のプレースホルダ' },
  { re: /私はAI|言語モデル|として生成/g, why: 'AI生成の痕跡' },
  { re: /^#\s/m, why: 'H1（#）は本文に不要。タイトルが自動でH1になります' },
];
export function safetyCheck({ title, description, body, tags, existingTitles = [] }) {
  const errors = [], warnings = [];
  const text = `${title}\n${description}\n${body}`;
  for (const b of BANNED) { const m = text.match(b.re); if (m) errors.push(`${b.why}: ${[...new Set(m)].slice(0, 3).join(' / ')}`); }
  for (const w of WARN) { const m = text.match(w.re); if (m) warnings.push(`${w.why}: ${[...new Set(m)].slice(0, 3).join(' / ')}`); }
  const len = body.replace(/\s/g, '').length;
  if (len < 1800) errors.push(`本文が短すぎます（${len}文字 / 最低1800文字）`);
  if (len > 9000) warnings.push(`本文が長めです（${len}文字）`);
  if (!title || title.length < 15 || title.length > 45) errors.push(`タイトルの長さが不適切（${(title || '').length}文字 / 15〜45文字）`);
  if (!description || description.length < 60 || description.length > 140) errors.push(`ディスクリプションの長さが不適切（${(description || '').length}文字 / 60〜140文字）`);
  if ((body.match(/^##\s/gm) || []).length < 3) errors.push('H2見出しが3つ未満');
  if (!tags?.length) warnings.push('タグがありません');
  const norm = (s) => s.replace(/[\s【】\[\]｜|]/g, '');
  if (existingTitles.some((t) => norm(t) === norm(title))) errors.push('同じタイトルの記事が既にあります');
  const sim = existingTitles.filter((t) => { const a = new Set(norm(t)), b = new Set(norm(title)); const inter = [...a].filter((c) => b.has(c)).length; return inter / Math.max(a.size, b.size) > 0.75; });
  if (sim.length) warnings.push(`似たタイトルの記事があります: ${sim[0]}`);
  return { ok: errors.length === 0, errors, warnings, length: len };
}
