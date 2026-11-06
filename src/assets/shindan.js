/* 1分診断: 質問 → スコア → レベル判定 → 連絡先入力 → レポート送付 */
(function () {
  const S = window.__SHINDAN__; if (!S) return;
  const qs = S.questions, levels = S.levels;
  const el = (id) => document.getElementById(id);
  const quiz = el('quiz'), result = el('result'), form = el('shindan-form');
  const answers = {}; let i = 0;
  const scored = qs.filter((q) => q.scored !== false);
  const max = scored.length * 3;

  function render() {
    const q = qs[i];
    el('prog').style.width = Math.round((i / qs.length) * 100) + '%';
    el('qn').textContent = `Q${i + 1} / ${qs.length}`;
    el('qt').textContent = q.q;
    const box = el('opts'); box.innerHTML = '';
    q.opts.forEach(([label, val]) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'opt'; b.textContent = label;
      b.onclick = () => { answers[q.id] = { label, val }; i++; i < qs.length ? render() : finish(); };
      box.appendChild(b);
    });
    el('back').style.visibility = i ? 'visible' : 'hidden';
  }
  el('back').onclick = () => { if (i > 0) { i--; render(); } };

  function finish() {
    const score = scored.reduce((s, q) => s + (answers[q.id]?.val || 0), 0);
    const lv = levels.find((l) => score >= l.min && score <= l.max) || levels[0];
    const issue = answers.issue?.val;
    quiz.style.display = 'none'; result.style.display = 'block';
    el('lv-name').textContent = lv.name;
    el('lv-score').textContent = `スコア ${score} / ${max}点`;
    el('lv-summary').textContent = lv.summary;
    const bars = el('bars'); bars.innerHTML = '';
    scored.forEach((q) => {
      const v = answers[q.id]?.val || 0;
      const d = document.createElement('div'); d.className = 'bar';
      d.innerHTML = `<span>${q.label || q.q.slice(0, 7)}</span><i><b style="width:${(v / 3) * 100}%"></b></i><span>${v}/3</span>`;
      bars.appendChild(d);
    });
    el('advice').innerHTML = lv.advice.map((a) => `<li>${a}</li>`).join('');
    el('issue-note').textContent = issue && S.issueNotes[issue] ? S.issueNotes[issue] : '';
    el('lv-cta').textContent = lv.cta;
    window.__SHINDAN_RESULT__ = { score, max, level: lv.name, levelIndex: levels.indexOf(lv) + 1, issue, answers: Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, v.label])) };
    try { if (window.gtag) gtag('event', 'shindan_complete', { level: lv.name, score }); } catch (e) {}
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (form) form.__extra = () => ({ shindan: window.__SHINDAN_RESULT__ });
  if (form) form.addEventListener('lead:sent', () => { el('lock').style.display = 'none'; });
  render();
})();
