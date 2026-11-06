// HTMLテンプレート群。site.json の内容からLP・診断・ブログを生成する。
export const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const telHref = (t) => 'tel:' + t.replace(/-/g, '');

export function layout(site, { title, description, path, body, jsonld = [], ogImage, type = 'website', extraHead = '', bodyClass = '' }) {
  const url = site.siteUrl + path;
  const og = ogImage || site.siteUrl + '/assets/og-default.png';
  const ga = site.ga4Id ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${site.ga4Id}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${site.ga4Id}');</script>` : '';
  const gsc = site.gscVerification ? `<meta name="google-site-verification" content="${esc(site.gscVerification)}">` : '';
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="${type}"><meta property="og:site_name" content="${esc(site.siteName)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${og}"><meta property="og:locale" content="ja_JP">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="${esc(site.blogName)}" href="${site.siteUrl}/feed.xml">
${gsc}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@500;700;900&family=Oswald:wght@600;700&display=swap">
<link rel="stylesheet" href="/assets/style.css">
${jsonld.map((j) => `<script type="application/ld+json">${json(j)}</script>`).join('\n')}
${ga}
${extraHead}
</head>
<body class="${bodyClass}"><script>document.documentElement.classList.add('js')</script>
<script>window.__SITE__=${json({ apiEndpoint: site.apiEndpoint, bookingUrl: site.bookingUrl, googleForm: site.googleForm, tel: site.tel })}</script>
${header(site)}
${body}
${footer(site)}
${fixedbar(site)}
<script src="/assets/app.js" defer></script>
</body>
</html>`;
}

const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

export function header(site) {
  return `<header class="header"><div class="in">
<a class="logo" href="/"><img src="/assets/img/logo-white.webp" alt="${esc(site.brand)}" width="600" height="150"><small>${esc(site.siteName)}</small></a>
<nav class="nav"><a href="/#strong">むさしの強み</a><a href="/#service">サービス</a><a href="/#price">料金</a><a href="/#seminar">セミナー</a><a href="/blog/">ブログ</a><a href="/#question">よくある質問</a></nav>
<div class="hcta"><a class="tel" href="${telHref(site.tel)}">${esc(site.tel)}</a><a class="btn btn-white" href="/shindan/" data-cta="header_shindan">1分診断</a><a class="btn btn-red" href="/#form" data-cta="header_contact">無料相談</a></div>
</div></header>`;
}

export function footer(site) {
  return `<footer><div class="in">
<div class="co"><b>${esc(site.company)}</b>${esc(site.siteName)}<br>${esc(site.address)}<br>TEL <a href="${telHref(site.tel)}">${esc(site.tel)}</a></div>
<img class="emb" src="/assets/img/emblem.webp" alt="" width="228" height="285" loading="lazy">
<div class="links"><a href="/#strong">むさしの強み</a><a href="/#service">サービス</a><a href="/#price">料金</a><a href="/#seminar">セミナー</a><a href="/#document">資料ダウンロード</a><a href="/shindan/">1分経営診断</a><a href="/blog/">ブログ</a><a href="/#question">よくある質問</a><a href="/#form">お問い合わせ</a>${site.instagram ? `<a href="${site.instagram}" target="_blank" rel="noopener">Instagram</a>` : ''}<a href="/privacy/">プライバシーポリシー</a></div>
<div class="copy">© ${new Date().getFullYear()} ${esc(site.company)}</div>
</div></footer>`;
}

export function fixedbar(site) {
  return `<div class="fixedbar"><a class="f1" href="/#form" data-cta="bar_contact">無料相談</a><a class="f2" href="/shindan/" data-cta="bar_shindan">1分診断</a><a class="f3" href="${telHref(site.tel)}" data-cta="bar_tel">電話</a></div>`;
}

export function contactForm(site, { type = 'contact', id = 'form' } = {}) {
  return `<section id="${id}" class="contact"><div class="wrap">
<div class="sec-h"><h2>無料相談</h2><p>現在の集客・売上・体制をお聞きし、課題と打ち手を整理してお返しします。開業前の方も、他社のコンサルを受けている方もご相談いただけます。担当者から1営業日以内にご連絡します。</p></div>
<form class="form" data-api data-type="${type}" novalidate>
<div class="f"><label>ご相談の内容<span class="req">必須</span></label><div class="chk"><label><input type="checkbox" name="items" value="整骨院の開業"> 整骨院の開業</label><label><input type="checkbox" name="items" value="フランチャイズについて"> フランチャイズ加盟</label><label><input type="checkbox" name="items" value="集客・リピート改善"> 集客・リピート改善</label><label><input type="checkbox" name="items" value="採用・スタッフ教育"> 採用・スタッフ教育</label><label><input type="checkbox" name="items" value="その他ご相談"> その他</label></div></div>
<div class="f"><label for="${id}-name">お名前<span class="req">必須</span></label><input id="${id}-name" type="text" name="name" required placeholder="福岡 太郎" autocomplete="name"></div>
<div class="f"><label for="${id}-kana">フリガナ</label><input id="${id}-kana" type="text" name="kana" placeholder="フクオカ タロウ"></div>
<div class="f"><label for="${id}-clinic">整骨院名<span class="req">必須</span></label><input id="${id}-clinic" type="text" name="clinic" required placeholder="○○整骨院（開業前の方は「未定」）" autocomplete="organization"></div>
<div class="f"><label for="${id}-email">メールアドレス<span class="req">必須</span></label><input id="${id}-email" type="email" name="email" required placeholder="info@example.com" autocomplete="email"></div>
<div class="f"><label for="${id}-tel">電話番号<span class="req">必須</span></label><input id="${id}-tel" type="tel" name="tel" required placeholder="090-0000-0000" autocomplete="tel"></div>
<div class="f"><label for="${id}-msg">ご相談内容</label><textarea id="${id}-msg" name="message" placeholder="今いちばん困っていること、聞きたいことをご自由にどうぞ"></textarea></div>
<div class="hp"><label>会社URL<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
<button class="btn btn-red btn-lg" type="submit">無料相談を申し込む ${ARROW}</button>
<p class="priv">送信いただいた情報は、ご相談への対応とサービスのご案内にのみ使用します。</p>
<div class="msg" role="status" aria-live="polite"></div>
</form>
</div></section>`;
}

export function postCard(p) {
  return `<a class="post" href="${p.url}"><img src="${p.ogImage}" alt="" loading="lazy" width="1200" height="630"><div class="b"><div class="meta"><time datetime="${p.date}">${p.dateJa}</time>${p.tags.slice(0, 2).map((t) => `<span>${esc(t)}</span>`).join('')}</div><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p></div></a>`;
}

export function lpPage(site, posts) {
  const s = site;
  const svcImg = { shukyaku: 'svc-shukyaku', operation: 'svc-operation', unei: 'svc-unei', jiko: 'svc-jiko', bukken: 'svc-bukken', naigaisou: 'svc-naigaisou', novelty: 'svc-novelty', zaimu: 'svc-zaimu', saiyou: 'svc-saiyou' };
  const semImg = ['seminar-sagi', 'seminar-kaigyo', 'seminar-shukyaku'];
  const featImg = ['store-queue', 'svc-operation', 'svc-zaimu'];
  const featPts = [
    ['SNS・MEO・紹介を組み合わせた集客の型', '広告費に頼らない導線設計', '直営院で毎月検証している施策だけを提供'],
    ['問診・説明・次回提案のオペレーション', '新人でも再現できるチェック項目', '院長が現場を離れても回る仕組み'],
    ['複数の金融機関への本部からの打診', '補助金・融資の資料づくり', '開業後の数字の見える化まで伴走'],
  ];
  const body = `
<div class="hero"><div class="in">
  <div class="copy">
    <div class="tags"><span class="tag">FC加盟店募集中</span><span class="tag">赤字院の立て直しは0円</span></div>
    <h1>整骨院の開業と経営を、<br><span class="red">直営130院</span>の現場から支える。</h1>
    <p class="lead">新規集客、リピート、スタッフ教育、資金調達。机上の空論ではなく、自社の整骨院で毎日実証しているやり方を、あなたの院に合わせて実装します。</p>
    <div class="acts"><a class="btn btn-red btn-lg" href="#form" data-cta="hero_contact">無料で相談する ${ARROW}</a><a class="btn btn-white btn-lg" href="/shindan/" data-cta="hero_shindan">1分で経営力を診断</a><span class="tel">お電話でも<b>${esc(s.tel)}</b></span></div>
    <div class="brand"><img src="/assets/img/hero-brand.webp" alt="むさし鍼灸整骨院グループ" width="1200" height="324" loading="lazy"><span>運営：${esc(s.company)}</span></div>
  </div>
  <div class="visual">
    <div class="photo"><img src="/assets/img/hero-collage.webp" alt="むさし鍼灸整骨院の店舗と、開業セミナーの様子" width="2000" height="1062" fetchpriority="high"></div>
    <div class="proofs">${s.proof.map((p) => `<div class="proof"><small>${esc(p.when)}｜${esc(p.type)}</small><b>${esc(p.num)}<span>${esc(p.unit)}</span></b><i>${esc(p.label)}</i></div>`).join('')}</div>
  </div>
</div></div>

<div class="numbers"><div class="in">${s.stats.map((x) => `<div><b>${esc(x.num)}<span>${esc(x.unit)}</span></b><small>${esc(x.label)}</small></div>`).join('')}</div></div>

<section class="problems" id="success"><div class="wrap"><div class="grid">
  <div class="sec-h"><h2>整骨院経営の悩みは、<br>だいたい同じところで止まる。</h2><p>新規が減った、2回目につながらない、スタッフが育たない。原因は院長の努力不足ではなく、仕組みがないことです。直営130院で同じ壁を越えてきました。</p>
  <p class="answer">その悩み、<span class="hl">むさしが一緒に解決します。</span></p></div>
  <ul>${s.problems.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
</div></div></section>

<section class="features" id="strong"><div class="wrap">
  <div class="sec-h"><h2>むさしで開業・改善する3つの理由</h2><p>コンサル会社でも制作会社でもなく、整骨院を運営している会社だからできることがあります。</p></div>
  ${s.reasons.slice(0, 3).map((r, i) => `<div class="row"><div class="ph"><img src="/assets/img/${featImg[i]}.webp" alt="" width="600" height="450" loading="lazy"></div><div class="tx"><span class="n">0${i + 1}</span><h3>${esc(r.title)}</h3><p>${esc(r.body)}</p><ul>${featPts[i].map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div></div>`).join('')}
  <div class="compare"><img src="/assets/img/compare-table.webp" alt="むさし鍼灸整骨院サポート事業部とA社・WEB制作会社の比較。実店舗運営・技術・集客力・スタッフ育成はむさしが◎" width="1200" height="790" loading="lazy"></div>
</div></section>

<section id="shindan"><div class="wrap"><div class="panel">
  <div><h2>1分でわかる、<br>あなたの院の経営力。</h2><p>8つの質問に答えるだけで、今の段階と次にやるべき一手を判定します。連絡先の入力なしで結果まで見られます。</p>
  <ol><li><span>1</span><div><b>質問に答える</b><small>新規・リピート・口コミ・自費率・体制・数字管理。約1分</small></div></li><li><span>2</span><div><b>レベルを判定</b><small>4段階で点数化し、同じ段階の院が次に取り組むことを提示</small></div></li><li><span>3</span><div><b>レポートを受け取る</b><small>必要な方だけメールで詳細レポートと面談の日程調整</small></div></li></ol>
  <div class="acts"><a class="btn btn-red btn-lg" href="/shindan/" data-cta="panel_shindan">無料で診断する ${ARROW}</a></div></div>
  <div class="mock" aria-hidden="true"><small>診断結果のイメージ</small><b>レベル2：集客強化期　<span class="sc"><span class="num" style="font-family:var(--font-num);font-weight:600;color:var(--red)">11</span><span style="font-size:.7em;color:var(--mute)"> / 21点</span></span></b><div class="bars">${['新規集客', 'リピート', '来院経路', '口コミ', '自費率', '体制', '数字管理'].map((l, i) => `<div class="bar"><span>${l}</span><i><b style="width:${[66, 33, 66, 33, 66, 33, 66][i]}%"></b></i><span>${[2, 1, 2, 1, 2, 1, 2][i]}/3</span></div>`).join('')}</div></div>
</div></div></section>

<section class="services" id="service"><div class="wrap">
  <div class="sec-h"><h2>開業から運営まで、<br>窓口ひとつで。</h2><p>必要なものを必要な順番で。単体のご依頼も、組み合わせも可能です。</p></div>
  <div class="grid">${s.services.map((v) => `<div class="svc"><img src="/assets/img/${svcImg[v.slug] || 'svc-unei'}.webp" alt="" width="432" height="322" loading="lazy"><div class="t"><b>${esc(v.name)}</b><p>${esc(v.desc)}</p></div></div>`).join('')}</div>
</div></section>

<section class="flow"><div class="wrap">
  <div class="sec-h"><h2>ご相談から成果までの流れ</h2></div>
  <ol>${s.flow.map((f) => `<li><b>${esc(f.title)}</b><p>${esc(f.body)}</p></li>`).join('')}</ol>
</div></section>

<section class="pricing" id="price"><div class="wrap">
  <div class="sec-h"><h2>料金</h2><p>赤字経営の院は0円で立て直しをサポートします。まずは無料相談で現状を伺い、合うプランをご提案します。</p></div>
  <div class="grid">${s.pricing.map((p, i) => `<div class="price${i === 0 ? ' hot' : ''}"><div class="nm">${esc(p.name)}</div><div class="tg">${esc(p.target)}</div><div class="pr">${esc(p.price)}</div><p class="bd">${esc(p.body)}</p><a class="btn ${i === 0 ? 'btn-red' : 'btn-white'}" href="#form" data-cta="price_${i}">相談する</a></div>`).join('')}</div>
</div></section>

<section class="seminars" id="seminar"><div class="wrap">
  <div class="sec-h"><h2>セミナー・相談会</h2><p>参加費無料。オンラインで参加できます。</p></div>
  <div class="grid">${s.seminars.map((m, i) => `<div class="sem"><div class="img"><img src="/assets/img/${semImg[i]}.webp" alt="${esc(m.title)}" width="900" height="656" loading="lazy"></div><div class="t"><span class="when">${esc(m.when)}</span><b>${esc(m.title)}</b><p>${esc(m.body)}</p><div class="foot"><span>${esc(m.fee)}</span><a class="btn btn-dark btn-sm" href="#seminar-form" data-cta="seminar_${i}">申し込む</a></div></div></div>`).join('')}</div>
</div></section>

<section class="docs" id="document"><div class="wrap">
  <div class="sec-h"><h2>無料の資料</h2><p>自院の数字を業界平均と見比べるためのシートと、商圏の分析レポートです。</p></div>
  <div class="grid">
    <div class="doc"><img src="/assets/img/doc-jakuten-cover.webp" alt="弱点分析シート" width="445" height="600" loading="lazy"><div><b>${esc(s.documents[0].title)}</b><p>${esc(s.documents[0].body)}</p><a class="btn btn-white" href="#document-form" data-cta="doc_0">資料を請求する</a></div></div>
    <div class="doc"><img src="/assets/img/doc-chiiki.webp" alt="地域分析無料診断" width="330" height="459" loading="lazy"><div><b>${esc(s.documents[1].title)}</b><p>${esc(s.documents[1].body)}</p><a class="btn btn-white" href="#document-form" data-cta="doc_1">資料を請求する</a></div></div>
  </div>
</div></section>

<section class="blogsec" id="blog"><div class="wrap">
  <div class="sec-h"><h2>${esc(s.blogName)}</h2><p>直営130院の現場から、明日使える集客・リピート・採用のノウハウを発信しています。</p></div>
  <div class="posts">${posts.slice(0, 6).map(postCard).join('')}</div>
  <p style="margin-top:28px"><a class="link" href="/blog/">記事をもっと見る</a></p>
</div></section>

<section class="faq" id="question"><div class="wrap">
  <div class="sec-h center" style="margin:0 auto"><h2>よくある質問</h2></div>
  <div class="qa">${s.faq.map((f, i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div>
</div></section>

<section class="ceo"><div class="wrap"><div class="grid"><div><h2>代表ご挨拶</h2><p>${esc(s.ceoMessage)}</p></div><div class="ph"><img src="/assets/img/ceo.webp" alt="代表取締役" width="690" height="576" loading="lazy"></div></div></div></section>

${contactForm(site)}

<section class="formsec"><div class="wrap"><div class="two-forms">
<div id="seminar-form"><div class="sec-h"><h2>セミナー申し込み</h2><p>日程が決まっているものはそのまま、随時開催のものは候補日を3つほどご記入ください。</p></div>
<form class="form" data-api data-type="seminar" novalidate>
<div class="f"><label>参加したいセミナー<span class="req">必須</span></label><div class="chk">${s.seminars.map((m) => `<label><input type="checkbox" name="items" value="${esc(m.title)}"> ${esc(m.title)}</label>`).join('')}</div></div>
<div class="f"><label for="sem-name">お名前<span class="req">必須</span></label><input id="sem-name" type="text" name="name" required autocomplete="name"></div>
<div class="f"><label for="sem-clinic">接骨院・整骨院名<span class="req">必須</span></label><input id="sem-clinic" type="text" name="clinic" required></div>
<div class="f"><label for="sem-tel">携帯電話<span class="req">必須</span></label><input id="sem-tel" type="tel" name="tel" required autocomplete="tel"></div>
<div class="f"><label for="sem-email">メールアドレス<span class="req">必須</span></label><input id="sem-email" type="email" name="email" required autocomplete="email"></div>
<div class="f"><label for="sem-date">希望日時（候補を3つほど）</label><input id="sem-date" type="text" name="dates" placeholder="11/20 20時、11/22 21時、11/25 20時"></div>
<div class="f"><label for="sem-msg">相談したい内容</label><textarea id="sem-msg" name="message"></textarea></div>
<div class="hp"><label>会社URL<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
<button class="btn btn-dark" type="submit">セミナーに申し込む ${ARROW}</button>
<div class="msg" role="status" aria-live="polite"></div>
</form></div>
<div id="document-form"><div class="sec-h"><h2>資料請求</h2><p>地域分析をご希望の方は、院の住所もご記入ください。</p></div>
<form class="form" data-api data-type="document" novalidate>
<div class="f"><label>ご希望の資料<span class="req">必須</span></label><div class="chk">${s.documents.map((d) => `<label><input type="checkbox" name="items" value="${esc(d.title)}"> ${esc(d.title)}</label>`).join('')}</div></div>
<div class="f"><label for="doc-name">お名前<span class="req">必須</span></label><input id="doc-name" type="text" name="name" required autocomplete="name"></div>
<div class="f"><label for="doc-clinic">整骨院名<span class="req">必須</span></label><input id="doc-clinic" type="text" name="clinic" required></div>
<div class="f"><label for="doc-email">メールアドレス<span class="req">必須</span></label><input id="doc-email" type="email" name="email" required autocomplete="email"></div>
<div class="f"><label for="doc-tel">電話番号<span class="req">必須</span></label><input id="doc-tel" type="tel" name="tel" required autocomplete="tel"></div>
<div class="f"><label for="doc-addr">整骨院住所</label><input id="doc-addr" type="text" name="address" placeholder="福岡県大野城市○○1-2-3"></div>
<div class="f"><label for="doc-msg">その他</label><textarea id="doc-msg" name="message"></textarea></div>
<div class="hp"><label>会社URL<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
<button class="btn btn-dark" type="submit">資料を請求する ${ARROW}</button>
<div class="msg" role="status" aria-live="polite"></div>
</form></div>
</div></div></section>`;

  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'Organization', name: s.company, alternateName: s.siteName, url: s.siteUrl, logo: s.siteUrl + '/assets/img/emblem.webp', telephone: s.telRaw, address: { '@type': 'PostalAddress', postalCode: s.addressParts.postal, addressRegion: s.addressParts.region, addressLocality: s.addressParts.locality, streetAddress: s.addressParts.street, addressCountry: 'JP' }, sameAs: [s.instagram].filter(Boolean), description: s.description },
    { '@context': 'https://schema.org', '@type': 'WebSite', name: s.siteName, url: s.siteUrl, inLanguage: 'ja' },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: s.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    { '@context': 'https://schema.org', '@type': 'Service', serviceType: '整骨院の開業支援・経営コンサルティング・フランチャイズ', provider: { '@type': 'Organization', name: s.company }, areaServed: 'JP', hasOfferCatalog: { '@type': 'OfferCatalog', name: 'サービス一覧', itemListElement: s.services.map((v) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: v.name, description: v.desc } })) } },
  ];
  return layout(site, { title: `${s.siteName}｜整骨院の開業支援・集客コンサル・FC（直営130院の${s.company}）`, description: s.description, path: '/', body, jsonld, ogImage: s.siteUrl + '/assets/og-default.png' });
}

export function shindanPage(site) {
  const sh = site.shindan;
  const body = `
<div class="pagehead"><div class="wrap"><h1>${esc(sh.title)}</h1><p>${esc(sh.lead)}</p></div></div>
<section style="padding-top:0;background:var(--bg-2)"><div class="wrap">
<div class="quiz" id="quiz">
<div class="prog"><i id="prog"></i></div>
<div class="qn" id="qn"></div><div class="qt" id="qt"></div>
<div class="opts" id="opts"></div>
<button class="back" id="back" type="button">← 前の質問に戻る</button>
</div>
<div class="result" id="result">
<div class="quiz">
<div class="lv"><small>あなたの院の診断結果</small><b id="lv-name"></b><div class="score" id="lv-score"></div></div>
<p style="margin-top:1.2em;font-weight:700" id="lv-summary"></p>
<div class="bars" id="bars"></div>
<div class="advice"><h3>今すぐできる3つのアクション</h3><ul id="advice"></ul><p style="margin-top:.8em;font-size:.9rem;font-weight:700" id="issue-note"></p></div>
<div class="lock" id="lock">詳細レポート（PDF相当の解説＋業界平均との比較＋優先順位つきの改善策）をメールでお送りします。下記にご入力ください。</div>
<p style="font-size:.9rem;color:#444;margin:.6em 0 1em" id="lv-cta"></p>
<form class="form" id="shindan-form" data-api data-type="shindan" novalidate>
<div class="f"><label for="sh-name">お名前<span class="req">必須</span></label><input id="sh-name" type="text" name="name" required autocomplete="name"></div>
<div class="f"><label for="sh-clinic">整骨院名<span class="req">必須</span></label><input id="sh-clinic" type="text" name="clinic" required placeholder="開業予定の場合は「未定」"></div>
<div class="f"><label for="sh-email">メールアドレス<span class="req">必須</span></label><input id="sh-email" type="email" name="email" required autocomplete="email"></div>
<div class="f"><label for="sh-tel">電話番号</label><input id="sh-tel" type="tel" name="tel" autocomplete="tel"></div>
<div class="hp"><label>会社URL<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
<button class="btn btn-red btn-lg" type="submit">診断レポートを受け取る（無料）</button>
<p class="priv">レポート送付とご相談対応のためにのみ使用します。営業電話はいたしません。</p>
<div class="msg" role="status" aria-live="polite"></div>
</form>
</div>
</div>
</div></section>`;
  const jsonld = [{ '@context': 'https://schema.org', '@type': 'WebPage', name: sh.title, url: site.siteUrl + '/shindan/', description: sh.lead, isPartOf: { '@type': 'WebSite', url: site.siteUrl } }];
  return layout(site, { title: `${sh.title}｜1分で無料・${site.siteName}`, description: `${sh.lead} 新規・リピート・口コミ・自費率・スタッフ体制・数字管理を点数化し、今やるべき一手をお伝えします。`, path: '/shindan/', body, jsonld, extraHead: `<script>window.__SHINDAN__=${json({ questions: sh.questions.map((q) => ({ ...q, label: q.label || labelOf(q.id) })), levels: sh.levels, issueNotes: sh.issueNotes })}</script><script src="/assets/shindan.js" defer></script>` });
}
const labelOf = (id) => ({ new: '新規集客', repeat: 'リピート', channel: '来院経路', reviews: '口コミ', jihi: '自費率', staff: '体制', kpi: '数字管理' }[id] || id);

export function blogIndexPage(site, posts, { tag } = {}) {
  const path = tag ? `/blog/tag/${encodeURIComponent(tag)}/` : '/blog/';
  const title = tag ? `「${tag}」の記事一覧｜${site.blogName}` : `${site.blogName}｜整骨院の集客・リピート・採用ノウハウ`;
  const tags = [...new Set(posts.flatMap((p) => p.tags))];
  const body = `
<div class="pagehead"><div class="wrap"><h1>${esc(tag ? `「${tag}」の記事` : site.blogName)}</h1><p>直営130院の現場から、明日使える整骨院経営のノウハウをお届けします。</p></div></div>
<section style="padding-top:32px"><div class="wrap">
<div class="tags-list"><a href="/blog/">すべて</a>${tags.map((t) => `<a href="/blog/tag/${encodeURIComponent(t)}/">${esc(t)}</a>`).join('')}</div>
<div class="posts">${posts.map(postCard).join('')}</div>
</div></section>
<section class="band"><div class="wrap"><h2>あなたの院は今どのレベル？</h2><p>8つの質問で、次にやるべき一手がわかります。</p><p style="margin-top:1.4em"><a class="btn btn-red btn-lg" href="/shindan/" data-cta="blogindex_shindan">1分で無料診断</a></p></div></section>`;
  const jsonld = [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, url: site.siteUrl + path, isPartOf: { '@type': 'WebSite', url: site.siteUrl } }];
  return layout(site, { title, description: `${site.blogName}の記事一覧。整骨院の集客・リピート率向上・スタッフ教育・開業の実践ノウハウを、直営130院を運営する${site.company}が発信。`, path, body, jsonld });
}

export function postPage(site, p, related) {
  const body = `
<article class="article">
<div class="crumbs"><a href="/">ホーム</a> › <a href="/blog/">${esc(site.blogName)}</a> › ${esc(p.title)}</div>
<h1>${esc(p.title)}</h1>
<div class="meta"><time datetime="${p.date}">${p.dateJa}</time>${p.updated && p.updated !== p.date ? `<time datetime="${p.updated}">更新 ${p.updatedJa}</time>` : ''}${p.tags.map((t) => `<span>${esc(t)}</span>`).join('')}<span style="background:none;color:var(--mute);padding:0">執筆：${esc(site.author.name)}</span></div>
<img class="cover" src="${p.ogImage}" alt="" width="1200" height="630">
<div class="prose">${p.html}</div>
<div class="cta-box"><b>あなたの院は今どのレベル？</b><p>8つの質問に答えるだけ。新規・リピート・口コミ・自費率・体制・数字管理を点数化して「次にやるべき一手」をお伝えします。</p><a class="btn btn-red btn-lg" href="/shindan/" data-cta="post_shindan">1分で無料「経営力診断」</a></div>
<div class="author"><div class="av"></div><div><b>${esc(site.author.name)}（${esc(site.author.org)}）</b>${esc(site.author.bio)}</div></div>
<div class="tags-list">${p.tags.map((t) => `<a href="/blog/tag/${encodeURIComponent(t)}/">#${esc(t)}</a>`).join('')}</div>
${related.length ? `<div class="related"><h2>関連記事</h2><div class="posts">${related.map(postCard).join('')}</div></div>` : ''}
<p style="margin-top:2em"><a class="link" href="/blog/">記事一覧へ戻る</a></p>
</article>`;
  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.description, image: p.ogImageAbs, datePublished: p.date, dateModified: p.updated || p.date, author: { '@type': 'Organization', name: site.author.org, url: site.siteUrl }, publisher: { '@type': 'Organization', name: site.company, logo: { '@type': 'ImageObject', url: site.siteUrl + '/assets/img/emblem.webp' } }, mainEntityOfPage: site.siteUrl + p.url, keywords: p.tags.join(','), inLanguage: 'ja' },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'ホーム', item: site.siteUrl + '/' }, { '@type': 'ListItem', position: 2, name: site.blogName, item: site.siteUrl + '/blog/' }, { '@type': 'ListItem', position: 3, name: p.title, item: site.siteUrl + p.url }] },
  ];
  if (p.faq?.length) jsonld.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: p.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
  return layout(site, { title: `${p.title}｜${site.blogName}`, description: p.description, path: p.url, body, jsonld, ogImage: p.ogImageAbs, type: 'article' });
}

export function privacyPage(site) {
  const body = `<div class="pagehead"><div class="wrap"><h1>プライバシーポリシー</h1></div></div>
<section><div class="wrap narrow prose">
<p>${esc(site.company)}（以下「当社」）は、お問い合わせ・資料請求・セミナー申込・経営診断を通じて取得した個人情報を、以下の目的で利用します。</p>
<ul><li>ご相談・資料送付・セミナー案内への対応</li><li>診断レポートの送付およびサービスのご案内</li><li>サービス改善のための統計分析（個人を特定しない形）</li></ul>
<p>法令に基づく場合を除き、ご本人の同意なく第三者に提供することはありません。個人情報の開示・訂正・削除をご希望の場合は、下記までご連絡ください。</p>
<p>${esc(site.company)}　${esc(site.address)}　TEL：${esc(site.tel)}</p>
<p>当サイトはアクセス解析のためにGoogle アナリティクスを利用する場合があります。Cookieによりデータが収集されますが、個人を特定するものではありません。</p>
</div></section>`;
  return layout(site, { title: `プライバシーポリシー｜${site.siteName}`, description: `${site.company}の個人情報の取り扱いについて。`, path: '/privacy/', body });
}

export function notFoundPage(site) {
  const body = `<div class="pagehead"><div class="wrap"><h1>ページが見つかりません</h1><p>URLが変更されたか、削除された可能性があります。</p></div></div><section><div class="wrap"><a class="btn btn-red" href="/">トップへ戻る</a> <a class="btn btn-white" href="/blog/">ブログ一覧</a></div></section>`;
  return layout(site, { title: `404｜${site.siteName}`, description: 'ページが見つかりません', path: '/404.html', body, extraHead: '<meta name="robots" content="noindex">' });
}
