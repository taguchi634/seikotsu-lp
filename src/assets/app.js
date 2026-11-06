/* 共通: フォーム送信（API → 失敗時はGoogleフォームへ誘導）, GA4イベント */
(function () {
  const cfg = window.__SITE__ || {};
  const track = (name, params) => { try { if (window.gtag) gtag('event', name, params || {}); } catch (e) {} };

  // CTAクリック計測
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-cta]');
    if (a) track('cta_click', { cta: a.dataset.cta, href: a.getAttribute('href') });
  });

  // フォーム
  document.querySelectorAll('form[data-api]').forEach((form) => {
    const started = Date.now();
    const msg = form.querySelector('.msg');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type=submit]');
      const fd = new FormData(form);
      const data = Object.fromEntries(fd.entries());
      // チェックボックス（複数）
      form.querySelectorAll('input[type=checkbox]').forEach((c) => {
        if (!data[c.name] || typeof data[c.name] === 'string') data[c.name] = [];
      });
      form.querySelectorAll('input[type=checkbox]:checked').forEach((c) => data[c.name].push(c.value));
      data.type = form.dataset.type || 'contact';
      data.t = Date.now() - started;        // 入力にかかった時間（ボット判定用）
      data.page = location.pathname;
      data.ref = document.referrer;
      if (form.dataset.extra) { try { Object.assign(data, JSON.parse(form.dataset.extra)); } catch (_) {} }
      const extraFn = form.__extra; if (typeof extraFn === 'function') Object.assign(data, extraFn());

      btn.disabled = true; const orig = btn.textContent; btn.textContent = '送信中…';
      msg.className = 'msg';
      try {
        const res = await fetch(cfg.apiEndpoint || '/api/contact', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.ok) throw new Error(json.error || 'send_failed');
        track('generate_lead', { type: data.type });
        form.dispatchEvent(new CustomEvent('lead:sent', { detail: json }));
        msg.className = 'msg ok';
        msg.innerHTML = json.message || '送信できました。確認メールをお送りしましたのでご確認ください。' +
          (cfg.bookingUrl ? ` <a href="${cfg.bookingUrl}" target="_blank" rel="noopener">日程調整はこちら</a>` : '');
        form.querySelectorAll('input:not([type=hidden]),textarea,select').forEach((i) => { if (i.type === 'checkbox') i.checked = false; else i.value = ''; });
      } catch (err) {
        msg.className = 'msg ng';
        msg.innerHTML = '送信に失敗しました。お手数ですが' +
          (cfg.googleForm ? ` <a href="${cfg.googleForm}" target="_blank" rel="noopener">こちらのフォーム</a>` : '') +
          `、またはお電話（<a href="tel:${(cfg.tel || '').replace(/-/g, '')}">${cfg.tel || ''}</a>）でご連絡ください。`;
        track('lead_error', { type: data.type });
      } finally { btn.disabled = false; btn.textContent = orig; }
    });
  });

})();
