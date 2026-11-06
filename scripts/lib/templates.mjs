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
<link rel="stylesheet" href="/assets/style.css">
${jsonld.map((j) => `<script type="application/ld+json">${json(j)}</script>`).join('\n')}
${ga}
${extraHead}
</head>
<body class="${bodyClass}">
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
<a class="logo" href="/"><b>${esc(site.brand)}</b><small>${esc(site.siteName)}</small></a>
<nav class="nav"><a href="/#reason">選ばれる理由</a><a href="/#service">サービス</a><a href="/#seminar">セミナー</a><a href="/blog/">ブログ</a><a href="/#faq">よくある質問</a></nav>
<div class="hcta"><a class="btn btn-white tel" href="${telHref(site.tel)}">☎ ${esc(site.tel)}</a><a class="btn btn-yellow" href="/shindan/" data-cta="header_shindan">1分診断</a><a class="btn btn-red" href="/#contact" data-cta="header_contact">無料相談</a></div>
</div></header>`;
}

export function footer(site) {
  return `<footer><div class="in">
<div><b>${esc(site.company)}</b>（${esc(site.siteName)}）<br>所在地：${esc(site.address)}<br>TEL：<a href="${telHref(site.tel)}">${esc(site.tel)}</a></div>
<div class="cols">
<div><a href="/#service">サービス</a><a href="/#price">料金</a><a href="/#seminar">セミナー</a><a href="/#document">資料ダウンロード</a></div>
<div><a href="/shindan/">1分経営診断</a><a href="/blog/">ブログ（${esc(site.blogName)}）</a><a href="/#faq">よくある質問</a><a href="/#contact">お問い合わせ</a></div>
<div>${site.instagram ? `<a href="${site.instagram}" target="_blank" rel="noopener">Instagram</a>` : ''}<a href="/privacy/">プライバシーポリシー</a></div>
</div>
<div class="copy">© ${new Date().getFullYear()} ${esc(site.company)}</div>
</div></footer>`;
}

export function fixedbar(site) {
  return `<div class="fixedbar"><a class="f2" href="/shindan/" data-cta="bar_shindan">1分で無料診断</a><a class="f1" href="/#contact" data-cta="bar_contact">無料相談</a><a class="f3" href="${telHref(site.tel)}" data-cta="bar_tel">TEL</a></div>`;
}

export function contactForm(site, { type = 'contact', title = '無料相談はこちらから', lead = '専任のコンサルタントがひとつひとつ丁寧にヒアリングし、貴院に合ったプランをご提案します。', items = ['整骨院の開業', 'フランチャイズについて', '集客・リピート改善', 'スタッフ採用・教育', 'その他ご相談'], submit = '無料相談を申し込む ▶', id = 'contact' } = {}) {
  return `<section id="${id}" class="soft"><div class="wrap">
<span class="label">CONTACT</span><h2>${esc(title)}</h2>
<p class="sec-lead">${esc(lead)}</p>
<form class="form" data-api data-type="${type}" novalidate>
<div class="f"><label>お問い合わせ項目<span class="req">必須</span></label><div class="chk">${items.map((it) => `<label><input type="checkbox" name="items" value="${esc(it)}"> ${esc(it)}</label>`).join('')}</div></div>
<div class="f"><label for="${id}-name">お名前<span class="req">必須</span></label><input id="${id}-name" type="text" name="name" required placeholder="例）福岡 太郎" autocomplete="name"></div>
<div class="f"><label for="${id}-clinic">整骨院名<span class="req">必須</span></label><input id="${id}-clinic" type="text" name="clinic" required placeholder="例）○○整骨院（開業予定の場合は「未定」とご記入ください）" autocomplete="organization"></div>
<div class="f"><label for="${id}-email">メールアドレス<span class="req">必須</span></label><input id="${id}-email" type="email" name="email" required placeholder="例）info@example.com" autocomplete="email"></div>
<div class="f"><label for="${id}-tel">電話番号<span class="req">必須</span></label><input id="${id}-tel" type="tel" name="tel" required placeholder="例）090-0000-0000" autocomplete="tel"></div>
<div class="f"><label for="${id}-msg">ご相談内容</label><textarea id="${id}-msg" name="message" placeholder="現在の課題や、聞きたいことをご自由にご記入ください"></textarea></div>
<div class="hp"><label>会社URL<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
<button class="btn btn-red btn-lg" type="submit">${esc(submit)}</button>
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
  const body = `
<div class="hero"><div class="wrap in">
<div class="tags"><span class="tag">FC加盟店募集中</span><span class="tag out">集客〜経営まで本部にお任せ</span><span class="tag out">全国130院の直営運営</span></div>
<h1>整骨院の開業・集客・経営を、<br><em>直営130院の「成功の型」</em>で再現する。</h1>
<p class="lead">新規集客×リピート率80%×スタッフ教育。机上の空論ではなく、自社の直営院で毎日実証しているノウハウだけを、あなたの院に合わせて実装します。</p>
<div class="proof">${s.proof.map((p) => `<div><small>${esc(p.when)}｜${esc(p.type)}</small><b>${esc(p.label)} ${esc(p.num)}<span>${esc(p.unit)}</span></b></div>`).join('')}</div>
<div class="ctas"><a class="btn btn-yellow btn-lg" href="/shindan/" data-cta="hero_shindan">1分で無料「経営力診断」</a><a class="btn btn-ghost" href="#contact" data-cta="hero_contact">無料相談を申し込む</a></div>
<p class="note">※診断は連絡先の入力なしで結果まで見られます。レポートが必要な方のみメールアドレスをご入力ください。</p>
</div></div>

<div class="stats"><div class="wrap"><div class="grid">${s.stats.map((x) => `<div><b>${esc(x.num)}<span>${esc(x.unit)}</span></b><small>${esc(x.label)}</small></div>`).join('')}</div></div></div>

<section class="problems"><div class="wrap">
<span class="label">TROUBLE</span><h2>整骨院経営で、<br class="sp">こんなお悩みありませんか？</h2>
<ul>${s.problems.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
<div class="arrow">▼</div>
<p class="answer">そのお悩み、<em>直営130院のむさし</em>が解決します。</p>
</div></section>

<section id="reason" class="soft"><div class="wrap">
<span class="label">REASON</span><h2>むさしが選ばれる<em>6つの理由</em></h2>
<div class="grid3">${s.reasons.map((r, i) => `<div class="card"><span class="num">REASON 0${i + 1}</span><h3>${esc(r.title)}</h3><p>${esc(r.body)}</p></div>`).join('')}</div>
</div></section>

<section class="band"><div class="wrap">
<span class="label">FREE CHECK</span><h2>1分でわかる「整骨院 経営力診断」</h2>
<div class="steps"><span>8つの質問に答える</span><span>レベル判定</span><span>次にやるべき一手がわかる</span></div>
<p>新規・リピート・口コミ・自費率・スタッフ体制・数字管理を点数化。あなたの院が今どの段階で、何から手をつけるべきかを即判定します。</p>
<p style="margin-top:1.6em"><a class="btn btn-yellow btn-lg" href="/shindan/" data-cta="band_shindan">無料で診断する ▶</a></p>
</div></section>

<section id="service" class="services"><div class="wrap">
<span class="label">SERVICE</span><h2>豊富なサービス体制で<br class="sp">御社の課題を<em>根本</em>から解決</h2>
<div class="grid">${s.services.map((v) => `<div class="s"><b>${esc(v.name)}</b><span>${esc(v.desc)}</span></div>`).join('')}</div>
</div></section>

<section class="flow soft"><div class="wrap">
<span class="label">FLOW</span><h2>ご相談から成果までの流れ</h2>
<ol>${s.flow.map((f, i) => `<li><span class="n">${i + 1}</span><b>${esc(f.title)}</b><p>${esc(f.body)}</p></li>`).join('')}</ol>
</div></section>

<section id="price" class="pricing"><div class="wrap">
<span class="label">PRICE</span><h2>料金プラン</h2>
<p class="sec-lead">赤字経営の院は0円で立て直しをサポート。まずは無料相談で貴院に最適なプランをご提案します。</p>
<div class="grid">${s.pricing.map((p, i) => `<div class="price${i === 0 ? ' hot' : ''}"><div class="h">${esc(p.name)}</div><div class="t">${esc(p.target)}</div><div class="p">${esc(p.price)}</div><div class="b">${esc(p.body)}</div></div>`).join('')}</div>
</div></section>

<section id="seminar" class="seminars maroonbg"><div class="wrap">
<span class="label">SEMINAR</span><h2>売上UPが実感できる<br class="sp">セミナー開催中</h2>
<div class="grid">${s.seminars.map((m) => `<div class="sem${m.featured ? ' featured' : ''}"><div class="top"><small>${esc(m.sub)}</small><b>${esc(m.title)}</b><i>${esc(m.when)}</i></div><div class="body">${esc(m.body)}</div><div class="foot"><span>${esc(m.fee)}</span><a class="btn btn-red btn-sm" href="#seminar-form" data-cta="seminar_${esc(m.title)}">申し込む</a></div></div>`).join('')}</div>
</div></section>

<section id="document" class="docs redbg"><div class="wrap">
<span class="label">DOCUMENT</span><h2>ここまで読んだ方限定！<br class="sp">お役立ち資料を無料でダウンロード</h2>
<div class="grid">${s.documents.map((d) => `<div class="doc"><span class="badge">${esc(d.badge)}</span><h3>${esc(d.title)}</h3><p>${esc(d.body)}</p><a class="btn btn-red" href="#document-form" data-cta="doc_${esc(d.title)}">資料請求する</a></div>`).join('')}</div>
</div></section>

<section id="blog"><div class="wrap">
<span class="label">BLOG</span><h2>${esc(s.blogName)}｜現場で使える経営ノウハウ</h2>
<p class="sec-lead">直営130院の現場から、明日使える集客・リピート・採用のノウハウを発信しています。</p>
<div class="posts">${posts.slice(0, 6).map(postCard).join('')}</div>
<p style="text-align:center;margin-top:2em"><a class="btn btn-white" href="/blog/">記事をもっと見る</a></p>
</div></section>

<section id="faq" class="faq soft"><div class="wrap">
<span class="label">FAQ</span><h2>よくある質問</h2>
<div class="qa">${s.faq.map((f, i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div>
</div></section>

<section class="ceo maroonbg"><div class="wrap">
<span class="label">MESSAGE</span><h2>代表ご挨拶</h2>
<div class="box">${esc(s.ceoMessage)}<b>${esc(s.company)}</b></div>
</div></section>

${contactForm(site)}

<section id="seminar-form"><div class="wrap">
<span class="label">SEMINAR</span><h2>セミナー申し込み</h2>
<form class="form" data-api data-type="seminar" novalidate>
<div class="f"><label>参加したいセミナー<span class="req">必須</span></label><div class="chk">${s.seminars.map((m) => `<label><input type="checkbox" name="items" value="${esc(m.title)}"> ${esc(m.title)}</label>`).join('')}</div></div>
<div class="f"><label for="sem-name">お名前<span class="req">必須</span></label><input id="sem-name" type="text" name="name" required autocomplete="name"></div>
<div class="f"><label for="sem-clinic">接骨院・整骨院名<span class="req">必須</span></label><input id="sem-clinic" type="text" name="clinic" required></div>
<div class="f"><label for="sem-email">メールアドレス<span class="req">必須</span></label><input id="sem-email" type="email" name="email" required autocomplete="email"></div>
<div class="f"><label for="sem-tel">ご連絡先（携帯電話）<span class="req">必須</span></label><input id="sem-tel" type="tel" name="tel" required autocomplete="tel"></div>
<div class="f"><label for="sem-date">希望日時（随時開催のセミナーは候補を3つほど）</label><input id="sem-date" type="text" name="dates" placeholder="例）11/20 20時、11/22 21時、11/25 20時"></div>
<div class="f"><label for="sem-msg">相談したい内容</label><textarea id="sem-msg" name="message" placeholder="詳しくいただければ、よりあなたに合った内容をご提案します"></textarea></div>
<div class="hp"><label>会社URL<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
<button class="btn btn-yellow btn-lg" type="submit">セミナーに応募する ▶</button>
<div class="msg" role="status" aria-live="polite"></div>
</form>
</div></section>

<section id="document-form" class="soft"><div class="wrap">
<span class="label">DOCUMENT</span><h2>資料の無料請求</h2>
<form class="form" data-api data-type="document" novalidate>
<div class="f"><label>ご希望の資料<span class="req">必須</span></label><div class="chk">${s.documents.map((d) => `<label><input type="checkbox" name="items" value="${esc(d.title)}"> ${esc(d.title)}</label>`).join('')}</div></div>
<div class="f"><label for="doc-name">お名前<span class="req">必須</span></label><input id="doc-name" type="text" name="name" required autocomplete="name"></div>
<div class="f"><label for="doc-clinic">整骨院名<span class="req">必須</span></label><input id="doc-clinic" type="text" name="clinic" required></div>
<div class="f"><label for="doc-email">メールアドレス<span class="req">必須</span></label><input id="doc-email" type="email" name="email" required autocomplete="email"></div>
<div class="f"><label for="doc-tel">電話番号<span class="req">必須</span></label><input id="doc-tel" type="tel" name="tel" required autocomplete="tel"></div>
<div class="f"><label for="doc-addr">整骨院住所（地域分析をご希望の方）</label><input id="doc-addr" type="text" name="address" placeholder="例）福岡県大野城市○○1-2-3"></div>
<div class="hp"><label>会社URL<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
<button class="btn btn-red btn-lg" type="submit">資料を請求する ▶</button>
<div class="msg" role="status" aria-live="polite"></div>
</form>
</div></section>`;

  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'Organization', name: s.company, alternateName: s.siteName, url: s.siteUrl, logo: s.siteUrl + '/assets/favicon.svg', telephone: s.telRaw, address: { '@type': 'PostalAddress', postalCode: s.addressParts.postal, addressRegion: s.addressParts.region, addressLocality: s.addressParts.locality, streetAddress: s.addressParts.street, addressCountry: 'JP' }, sameAs: [s.instagram].filter(Boolean), description: s.description },
    { '@context': 'https://schema.org', '@type': 'WebSite', name: s.siteName, url: s.siteUrl, inLanguage: 'ja' },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: s.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    { '@context': 'https://schema.org', '@type': 'Service', serviceType: '整骨院の開業支援・経営コンサルティング・フランチャイズ', provider: { '@type': 'Organization', name: s.company }, areaServed: 'JP', hasOfferCatalog: { '@type': 'OfferCatalog', name: 'サービス一覧', itemListElement: s.services.map((v) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: v.name, description: v.desc } })) } },
  ];
  return layout(site, { title: `${s.siteName}｜整骨院の開業支援・集客コンサル・FC（直営130院の${s.company}）`, description: s.description, path: '/', body, jsonld });
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
<section class="band"><div class="wrap"><h2>あなたの院は今どのレベル？</h2><p>8つの質問で、次にやるべき一手がわかります。</p><p style="margin-top:1.4em"><a class="btn btn-yellow btn-lg" href="/shindan/" data-cta="blogindex_shindan">1分で無料診断 ▶</a></p></div></section>`;
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
<div class="cta-box"><b>あなたの院は今どのレベル？</b><p>8つの質問に答えるだけ。新規・リピート・口コミ・自費率・体制・数字管理を点数化して「次にやるべき一手」をお伝えします。</p><a class="btn btn-yellow btn-lg" href="/shindan/" data-cta="post_shindan">1分で無料「経営力診断」▶</a></div>
<div class="author"><div class="av"></div><div><b>${esc(site.author.name)}（${esc(site.author.org)}）</b>${esc(site.author.bio)}</div></div>
<div class="tags-list">${p.tags.map((t) => `<a href="/blog/tag/${encodeURIComponent(t)}/">#${esc(t)}</a>`).join('')}</div>
${related.length ? `<div class="related"><h2>関連記事</h2><div class="posts">${related.map(postCard).join('')}</div></div>` : ''}
<p style="margin-top:2em;text-align:center"><a class="btn btn-white" href="/blog/">記事一覧へ戻る</a></p>
</article>`;
  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.description, image: p.ogImageAbs, datePublished: p.date, dateModified: p.updated || p.date, author: { '@type': 'Organization', name: site.author.org, url: site.siteUrl }, publisher: { '@type': 'Organization', name: site.company, logo: { '@type': 'ImageObject', url: site.siteUrl + '/assets/favicon.svg' } }, mainEntityOfPage: site.siteUrl + p.url, keywords: p.tags.join(','), inLanguage: 'ja' },
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
