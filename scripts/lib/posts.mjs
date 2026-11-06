// frontmatter の読み書き（YAMLの最小サブセット: 文字列 / 数値 / 日付 / [a, b] / 真偽 / faq配列）
export function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const data = {}; let curKey = null;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) {
      curKey = kv[1]; let v = kv[2].trim();
      if (v === '') { data[curKey] = []; continue; }
      if (/^\[.*\]$/.test(v)) data[curKey] = v.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      else if (v === 'true' || v === 'false') data[curKey] = v === 'true';
      else data[curKey] = v.replace(/^["'](.*)["']$/, '$1').replace(/\\"/g, '"');
    } else if (curKey && /^\s+-\s*q:/.test(line)) {
      data[curKey].push({ q: line.replace(/^\s+-\s*q:\s*/, '').replace(/^["'](.*)["']$/, '$1'), a: '' });
    } else if (curKey && /^\s+a:/.test(line) && Array.isArray(data[curKey]) && data[curKey].length) {
      data[curKey][data[curKey].length - 1].a = line.replace(/^\s+a:\s*/, '').replace(/^["'](.*)["']$/, '$1');
    }
  }
  return { data, body: m[2] };
}

export function stringifyFrontmatter(data, body) {
  const q = (s) => `"${String(s).replace(/"/g, '\\"')}"`;
  const lines = ['---'];
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null) continue;
    if (k === 'faq' && Array.isArray(v)) { lines.push('faq:'); for (const f of v) { lines.push(`  - q: ${q(f.q)}`); lines.push(`    a: ${q(f.a)}`); } }
    else if (Array.isArray(v)) lines.push(`${k}: [${v.join(', ')}]`);
    else if (typeof v === 'boolean' || /^\d{4}-\d{2}-\d{2}$/.test(String(v))) lines.push(`${k}: ${v}`);
    else lines.push(`${k}: ${q(v)}`);
  }
  lines.push('---', '');
  return lines.join('\n') + body.trim() + '\n';
}
