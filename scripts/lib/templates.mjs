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
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@500;700;900&family=Zen+Kaku+Gothic+New:wght@700;900&family=Oswald:wght@600;700&display=swap">
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

export function header(site) {
  return `<header class="header"><div class="in">
<a class="logo" href="/"><img src="/assets/img/logo-white.webp" alt="${esc(site.brand)}" width="600" height="150"><small>${esc(site.siteName)}</small></a>
<nav class="nav"><a href="/#seminar">セミナー情報</a><a href="/#success">成功事例紹介</a><a href="/#strong">弊社の強み</a><a href="/blog/">ブログ</a><a href="/#question">よくある質問</a></nav>
<div class="hcta"><a class="c1" href="/#document-form" data-cta="header_document">資料請求は<br>こちら</a><a class="c2" href="/#form" data-cta="header_contact">無料相談は<br>こちら</a><a class="c3" href="/#seminar-form" data-cta="header_seminar">セミナー参加は<br>こちら</a></div>
</div></header>
<a class="teltab" href="${telHref(site.tel)}" data-cta="teltab">TEL</a>`;
}

export function footer(site) {
  return `<footer><div class="in">
<div class="co">運営：<br>${esc(site.company)}<span>所在地：<br>${esc(site.address)}</span><span>TEL：<br><a href="${telHref(site.tel)}">${esc(site.tel)}</a></span></div>
<img class="emb" src="/assets/img/emblem.webp" alt="${esc(site.brand)}" width="228" height="285" loading="lazy">
<div class="links"><a href="/#strong">サービス</a><a href="/#seminar">セミナー</a><a href="/#document">資料ダウンロード</a><a href="/shindan/">1分経営診断</a><a href="/blog/">ブログ</a><a href="/#question">よくある質問</a><a href="/#form">お問い合わせ</a>${site.instagram ? `<a href="${site.instagram}" target="_blank" rel="noopener">Instagram</a>` : ''}<a href="/privacy/">プライバシーポリシー</a></div>
</div><div class="copy">Copyright © ${esc(site.company)} All Rights Reserved.</div></footer>`;
}

export function fixedbar(site) {
  return `<div class="fixedbar"><a class="f2" href="/shindan/" data-cta="bar_shindan">1分で無料診断</a><a class="f1" href="/#form" data-cta="bar_contact">無料相談</a><a class="f3" href="${telHref(site.tel)}" data-cta="bar_tel">TEL</a></div>`;
}

export function contactForm(site, { type = 'contact', id = 'form' } = {}) {
  return `<section id="${id}" class="contact2"><div class="wrap">
<p class="lead1">活動実績の長い企業だからこそ安心！<br>整骨院の<em>長期経営ノウハウ</em>をお伝え出来ます。</p>
<h2 class="ttl2">無料相談はコチラから</h2>
<form class="form" data-api data-type="${type}" novalidate>
<div class="f"><label>お問い合わせ項目<span class="req">*</span></label><div class="chk"><label><input type="checkbox" name="items" value="整骨院の開業"> 整骨院の開業</label><label><input type="checkbox" name="items" value="フランチャイズについて"> フランチャイズについて</label><label><input type="checkbox" name="items" value="その他ご相談"> その他ご相談</label></div></div>
<div class="f"><label for="${id}-name">お名前<span class="req">*</span></label><input id="${id}-name" type="text" name="name" required placeholder="例）福岡 太郎" autocomplete="name"></div>
<div class="f"><label for="${id}-kana">お名前（フリガナ）<span class="req">*</span></label><input id="${id}-kana" type="text" name="kana" placeholder="例）フクオカ タロウ"></div>
<div class="f"><label for="${id}-clinic">整骨院名<span class="req">*</span></label><input id="${id}-clinic" type="text" name="clinic" required placeholder="例）○○整骨院（出店予定の場合は「未定」とご記入ください）" autocomplete="organization"></div>
<div class="f"><label for="${id}-email">メールアドレス<span class="req">*</span></label><input id="${id}-email" type="email" name="email" required placeholder="例）000@gmail.com" autocomplete="email"></div>
<div class="f"><label for="${id}-tel">電話番号<span class="req">*</span></label><input id="${id}-tel" type="tel" name="tel" required placeholder="例）000-000-0000" autocomplete="tel"></div>
<div class="f"><label for="${id}-msg">お問い合わせ内容<span class="req">*</span></label><textarea id="${id}-msg" name="message"></textarea></div>
<div class="hp"><label>会社URL<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
<button class="btn btn-red btn-lg" type="submit">メッセージを送信する　▶</button>
<p class="priv">送信いただいた情報は、ご相談への対応およびサービス案内にのみ使用します。</p>
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
  const [feat, ...others] = s.seminars;
  const body = `
<div class="hero">
  <div class="pc"><img src="/assets/img/hero-full.webp" alt="FC加盟店募集中！集客〜経営まで本部にお任せ！ 2024年10月開業 1人先生治療院 初月売上250万円 / 2026年3月開業 複数名治療院 初月売上570万円 整骨院の開業ならむさし鍼灸整骨院グループ！" width="2000" height="1062" fetchpriority="high"></div>
  <div class="sp-in">
    <div class="tags"><span class="tag">FC加盟店募集中！</span><span class="tag">集客〜経営まで本部にお任せ！</span></div>
    <div class="nums">${s.proof.map((p) => `<div class="num"><small>${esc(p.when)}</small><b>${esc(p.label)}<br><span>${esc(p.num)}</span>${esc(p.unit)}</b><i>${esc(p.type)}</i></div>`).join('')}</div>
    <img class="brand" src="/assets/img/hero-brand.webp" alt="整骨院の開業なら むさし鍼灸整骨院グループ！" width="1200" height="324">
    <div class="ctas"><a class="btn btn-yellow" href="/shindan/" data-cta="hero_shindan">1分で無料「経営力診断」</a><a class="btn btn-red" href="#form" data-cta="hero_contact">無料相談はこちら</a></div>
  </div>
</div>

<div class="stats"><div class="grid">${s.stats.map((x) => `<div class="rv"><b data-count="${esc(x.num)}">${esc(x.num)}<span>${esc(x.unit)}</span></b><small>${esc(x.label)}</small></div>`).join('')}</div></div>

<div class="yband" id="seminar">売上爆増!?整骨院向けセミナー</div>
<div class="semsec"><div class="wrap">
  <div class="feat card-hover rv"><img src="/assets/img/${semImg[0]}.webp" alt="${esc(feat.title)}" width="800" height="1000" loading="lazy"><div class="t"><span class="chip">参加費無料</span><span class="chip">ZOOM</span><b>${esc(feat.sub)}</b><i>${esc(feat.when)}</i><p>${esc(feat.body)}</p></div></div>
  <div class="two">${others.map((m, i) => `<div class="card2 card-hover rv"><img src="/assets/img/${semImg[i + 1]}.webp" alt="${esc(m.title)}" width="900" height="656" loading="lazy"><div class="t"><b>${esc(m.title)}</b><i>${esc(m.when)}‼</i><p>${esc(m.body)}</p></div></div>`).join('')}</div>
  <a class="imgbtn" href="#seminar-form" data-cta="seminar_imgbtn"><img src="/assets/img/btn-seminar.webp" alt="セミナーで集客・求人・経営に関する悩みを無料相談！" width="1200" height="300" loading="lazy"></a>
</div></div>

<div class="point"><img class="woman" src="/assets/img/pointing-woman.webp" alt="" width="900" height="601" loading="lazy"><div class="box">ここがポイント‼</div><p>全国130院の直営運営で培った「成功の型」を完全再現！</p></div>

<section class="nayami2" id="success"><div class="wrap">
  <span class="eyebrow">Trouble</span><h2 class="ttl">整骨院経営をやっていて<br><em>こんなお悩みありませんか？</em></h2>
  <img class="bubbles" src="/assets/img/worries-bubbles.webp" alt="昔に比べて新規数が減りカルテ枚数が減少している／自費メニューを作ったけどなかなか上手く提案できない／スタッフ教育が苦手でどうしていいかわからない" width="1600" height="310" loading="lazy">
  <ul>${s.problems.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
</div></section>

<div class="solve" id="strong"><div class="wrap">
  <p class="h">そのお悩み、むさしが<em>解決</em>します！</p>
  <img class="circles" src="/assets/img/merit-circles.webp" alt="マーケティングチームが集客を徹底的にサポート！新規増加率100%／担当サポーターが勉強会を開催！平均月1回／実店舗で成果を出している運営方法をご提案 42店舗以上" width="1400" height="1049" loading="lazy">
  <p class="h2">むさしで開業する<em style="color:var(--yellow);font-style:normal">メリット</em></p>
  <div class="merits">
    <div class="merit rv"><div class="im"><img src="/assets/img/store-queue.webp" alt="" width="600" height="450" loading="lazy"></div><b>${esc(s.reasons[0].title)}</b><p>${esc(s.reasons[0].body)}</p></div>
    <div class="merit rv"><div class="im"><img src="/assets/img/svc-operation.webp" alt="" width="600" height="399" loading="lazy"></div><b>${esc(s.reasons[1].title)}</b><p>${esc(s.reasons[1].body)}</p></div>
    <div class="merit rv"><div class="im"><img src="/assets/img/svc-zaimu.webp" alt="" width="600" height="405" loading="lazy"></div><b>${esc(s.reasons[2].title)}</b><p>${esc(s.reasons[2].body)}</p></div>
  </div>
  <p class="omakase">整骨院の開業は、整骨院を運営している<b>我々“<em>むさし</em>”におまかせください！</b></p>
  <div class="consult">
    <div class="present"><img src="/assets/img/doc-jakuten-mock.webp" alt="" width="429" height="469" loading="lazy">弱点分析シートを<br>先着10社様に<br>プレゼント‼</div>
    <h3>無料相談はコチラ！</h3>
    <p>専任のコンサルタントがひとつひとつ丁寧にヒアリングをさせていただき、適切なプランをご提案させていただきます。</p>
    <a class="btn" href="#form" data-cta="solve_contact">まずはお気軽にご相談を！ ▶</a>
  </div>
</div></div>

<div class="yband" id="shindan">1分でわかる！整骨院 経営力診断</div>
<section class="shindan-sec"><div class="wrap">
  <span class="eyebrow">Free Check</span><h2 class="ttl">8つの質問に答えるだけ。<br>あなたの院の<em>「今のレベル」と「次の一手」</em>がわかります</h2>
  <div class="steps"><div class="step rv"><span>1</span>質問に答える<small>新規・リピート・口コミ・自費率・体制・数字管理の8問。約1分</small></div><div class="step rv"><span>2</span>レベル判定<small>4段階で今の経営力を点数化。連絡先なしで結果まで見られます</small></div><div class="step rv"><span>3</span>次の一手がわかる<small>優先順位つきの改善策と、詳細レポートをメールでお届け</small></div></div>
  <p style="margin-top:2em"><a class="btn btn-red btn-lg" href="/shindan/" data-cta="shindan_sec">無料で診断する ▶</a></p>
</div></section>

<section class="daikohyo"><div class="wrap">
  <p class="kazari">大好評‼</p>
  <h2 class="ttl" style="font-size:clamp(1.05rem,3.4vw,1.4rem)">売上UPが実感できるセミナー開催中！</h2>
  <div class="ba"><div class="b"><img src="/assets/img/before.webp" alt="改善前の整骨院" width="304" height="295" loading="lazy"></div><img class="arrow" src="/assets/img/arrow.webp" alt="" width="286" height="254" loading="lazy"><div class="a"><img src="/assets/img/after.webp" alt="改善後の整骨院" width="473" height="425" loading="lazy"></div></div>
  <p style="margin-top:2.2em"><a class="btn btn-yellow btn-lg" href="#seminar-form" data-cta="daikohyo_seminar">セミナーに参加する ▶</a></p>
</div></section>

<section class="svc" id="service"><div class="wrap">
  <span class="eyebrow">Service</span><h2 class="ttl"><em>豊富なサービス体制</em>で<br>御社の課題を<em>根本</em>から解決します！</h2>
  <div class="grid">${s.services.map((v) => `<div class="tile rv"><img src="/assets/img/${svcImg[v.slug] || 'svc-unei'}.webp" alt="" width="432" height="322" loading="lazy"><b>${esc(v.name).replace('・', '<br>')}<small>${esc(v.desc)}</small></b></div>`).join('')}</div>
  <img class="compare" src="/assets/img/compare-table.webp" alt="むさし鍼灸整骨院サポート事業部とA社・WEB制作会社の比較：実店舗運営◎、技術◎、集客力◎、スタッフ育成◎、採用○、費用○" width="1200" height="790" loading="lazy">
</div></section>

<section class="docs2" id="document"><div class="wrap">
  <p class="lim">ここまで読んだ方限定！</p>
  <p class="lim2">お役立ち資料を無料でダウンロード</p>
  <div class="grid">
    <div class="paper rv"><img src="/assets/img/doc-jakuten-cover.webp" alt="弱点分析シート" width="445" height="600" loading="lazy"><div><b>${esc(s.documents[0].title)}</b><p>${esc(s.documents[0].body)}</p><a class="btn btn-outline-y" href="#document-form" data-cta="doc_jakuten">資料請求する</a></div></div>
    <div class="paper rv"><img src="/assets/img/doc-chiiki.webp" alt="地域分析無料診断" width="330" height="459" loading="lazy"><div><b>${esc(s.documents[1].title)}</b><p>${esc(s.documents[1].body)}</p><a class="btn btn-outline-y" href="#document-form" data-cta="doc_chiiki">資料請求する</a></div></div>
  </div>
</div></section>

<div class="yband" id="blog">${esc(s.blogName)}｜現場で使える整骨院経営ノウハウ</div>
<section class="blogsec"><div class="wrap">
  <p class="sub" style="margin-top:0">直営130院の現場から、明日使える集客・リピート・採用のノウハウを発信しています。</p>
  <div class="posts">${posts.slice(0, 6).map(postCard).join('')}</div>
  <p style="text-align:center;margin-top:2em"><a class="btn btn-white" href="/blog/">記事をもっと見る</a></p>
</div></section>

<section class="faq2" id="question"><div class="wrap">
  <span class="eyebrow">FAQ</span><h2 class="ttl u">よくある質問</h2>
  <div class="qa">${s.faq.map((f, i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div>
</div></section>

<div class="ceo2"><div class="in"><div class="t"><h2>代表ご挨拶</h2><p>${esc(s.ceoMessage)}</p></div><img src="/assets/img/ceo.webp" alt="代表取締役" width="690" height="576" loading="lazy"></div></div>

${contactForm(site)}

<div class="yband" id="seminar-form">セミナー申し込みはコチラから</div>
<section class="formsec"><div class="wrap">
<form class="form" data-api data-type="seminar" novalidate style="margin-top:0">
<div class="f"><label for="sem-company">会社名</label><input id="sem-company" type="text" name="company" autocomplete="organization"></div>
<div class="f"><label for="sem-clinic">接骨院・整骨院名<span class="req">*</span></label><input id="sem-clinic" type="text" name="clinic" required></div>
<div class="f"><label for="sem-name">お名前<span class="req">*</span></label><input id="sem-name" type="text" name="name" required autocomplete="name"></div>
<div class="f"><label for="sem-tel">ご連絡先（携帯電話）<span class="req">*</span></label><input id="sem-tel" type="tel" name="tel" required autocomplete="tel"></div>
<div class="f"><label for="sem-email">メールアドレス<span class="req">*</span></label><input id="sem-email" type="email" name="email" required autocomplete="email"></div>
<div class="f"><label>どのセミナーに参加しますか？<span class="req">*</span></label><div class="chk">${s.seminars.map((m) => `<label><input type="checkbox" name="items" value="${esc(m.title)}"> ${esc(m.title)}</label>`).join('')}</div></div>
<div class="f"><label for="sem-date">セミナー希望日時を3つほど候補をお願いします<span class="req">*</span></label><input id="sem-date" type="text" name="dates" placeholder="例）11/20 20時、11/22 21時、11/25 20時"></div>
<div class="f"><label for="sem-msg">相談したい内容など詳しくいただければ、よりあなたに合った内容をご提案します！</label><textarea id="sem-msg" name="message"></textarea></div>
<div class="hp"><label>会社URL<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
<button class="btn btn-yellow btn-lg" type="submit">セミナーに応募する</button>
<div class="msg" role="status" aria-live="polite"></div>
</form>
</div></section>

<div class="yband" id="document-form">資料の無料請求はコチラから</div>
<section class="formsec" style="padding-top:36px"><div class="wrap">
<form class="form" data-api data-type="document" novalidate style="margin-top:0">
<div class="f"><label>ご希望の資料をご選択ください<span class="req">*</span></label><div class="chk">${s.documents.map((d) => `<label><input type="checkbox" name="items" value="${esc(d.title)}"> ${esc(d.title)}</label>`).join('')}</div></div>
<div class="f"><label for="doc-name">お名前<span class="req">*</span></label><input id="doc-name" type="text" name="name" required autocomplete="name"></div>
<div class="f"><label for="doc-clinic">整骨院名<span class="req">*</span></label><input id="doc-clinic" type="text" name="clinic" required></div>
<div class="f"><label for="doc-email">メールアドレス<span class="req">*</span></label><input id="doc-email" type="email" name="email" required autocomplete="email"></div>
<div class="f"><label for="doc-tel">電話番号<span class="req">*</span></label><input id="doc-tel" type="tel" name="tel" required autocomplete="tel"></div>
<div class="f"><label for="doc-addr">整骨院住所<span class="req">*</span></label><input id="doc-addr" type="text" name="address" placeholder="例）福岡県大野城市○○1-2-3"></div>
<div class="f"><label for="doc-msg">その他伝えたい内容がございましたらご記入ください</label><textarea id="doc-msg" name="message"></textarea></div>
<div class="hp"><label>会社URL<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
<button class="btn btn-red btn-lg" type="submit">資料を請求する　▶</button>
<div class="msg" role="status" aria-live="polite"></div>
</form>
</div></section>`;

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
<div class="pagehead"><div class="wrap"><h1>${esc(sh.title)}（無料・1分）</h1><p>${esc(sh.lead)}</p></div></div>
<section class="soft" style="padding-top:36px"><div class="wrap">
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
<form class="form" id="shindan-form" data-api data-type="shindan" novalidate style="margin-top:0;box-shadow:none;border:0;padding:0">
<div class="f"><label for="sh-name">お名前<span class="req">必須</span></label><input id="sh-name" type="text" name="name" required autocomplete="name"></div>
<div class="f"><label for="sh-clinic">整骨院名<span class="req">必須</span></label><input id="sh-clinic" type="text" name="clinic" required placeholder="開業予定の場合は「未定」"></div>
<div class="f"><label for="sh-email">メールアドレス<span class="req">必須</span></label><input id="sh-email" type="email" name="email" required autocomplete="email"></div>
<div class="f"><label for="sh-tel">電話番号</label><input id="sh-tel" type="tel" name="tel" autocomplete="tel"></div>
<div class="hp"><label>会社URL<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
<button class="btn btn-red btn-lg" type="submit">診断レポートを受け取る（無料）▶</button>
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
<section><div class="wrap">
<div class="tags-list" style="justify-content:center"><a href="/blog/">すべて</a>${tags.map((t) => `<a href="/blog/tag/${encodeURIComponent(t)}/">${esc(t)}</a>`).join('')}</div>
<div class="posts">${posts.map(postCard).join('')}</div>
</div></section>
<section class="band"><div class="wrap"><h2>あなたの院は今<em>どのレベル</em>？</h2><p>8つの質問で、次にやるべき一手がわかります。</p><p style="margin-top:1.4em"><a class="btn btn-yellow btn-lg" href="/shindan/" data-cta="blogindex_shindan">1分で無料診断 ▶</a></p></div></section>`;
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
<div class="cta-box"><b>あなたの院は今<em>どのレベル</em>？</b><p>8つの質問に答えるだけ。新規・リピート・口コミ・自費率・体制・数字管理を点数化して「次にやるべき一手」をお伝えします。</p><a class="btn btn-yellow btn-lg" href="/shindan/" data-cta="post_shindan">1分で無料「経営力診断」▶</a></div>
<div class="author"><div class="av"></div><div><b>${esc(site.author.name)}（${esc(site.author.org)}）</b>${esc(site.author.bio)}</div></div>
<div class="tags-list">${p.tags.map((t) => `<a href="/blog/tag/${encodeURIComponent(t)}/">#${esc(t)}</a>`).join('')}</div>
${related.length ? `<div class="related"><h2>関連記事</h2><div class="posts">${related.map(postCard).join('')}</div></div>` : ''}
<p style="margin-top:2em;text-align:center"><a class="btn btn-white" href="/blog/">記事一覧へ戻る</a></p>
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
  const body = `<div class="pagehead"><div class="wrap"><h1>ページが見つかりません</h1><p>URLが変更されたか、削除された可能性があります。</p></div></div><section style="text-align:center"><a class="btn btn-red" href="/">トップへ戻る</a> <a class="btn btn-white" href="/blog/">ブログ一覧</a></section>`;
  return layout(site, { title: `404｜${site.siteName}`, description: 'ページが見つかりません', path: '/404.html', body, extraHead: '<meta name="robots" content="noindex">' });
}
