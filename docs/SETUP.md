# むさし鍼灸整骨院サポート事業部｜集客装置 セットアップ手順

このリポジトリには「LP + 1分経営診断 + ブログ自動更新 + 問い合わせ自動化」が入っています。
公開までの作業は **(A) 公開先の設定 → (B) 通知系のキー設定 → (C) ブログ自動生成のキー設定 → (D) 計測の設定** の4段階です。
A だけでもサイトは公開でき、B〜D は後から追加できます。

## 全体像

```
[検索/SNS] → LP(/) ─┬→ 1分診断(/shindan/) ─┐
                    ├→ 無料相談フォーム ────┤→ /api/contact ─┬→ 自動返信メール(診断レポート付き)
                    ├→ セミナー申込 ────────┤                 ├→ 社内通知メール
                    └→ 資料請求 ───────────┘                 ├→ Slack通知
                                                              └→ スプレッドシート(ファネル可視化)
[毎晩03:00 GitHub Actions] Search Console取得 → AI執筆 → 安全ゲート → サムネ生成 → ビルド → commit/push → IndexNow通知 → Slackレポート
```

## フォルダ構成

| パス | 役割 |
|---|---|
| `content/site.json` | 会社情報・サービス・FAQ・診断の質問とレベル判定。**文言はここを直せば全ページに反映** |
| `content/posts/*.md` | ブログ記事（Markdown + frontmatter）。手書きもOK |
| `content/drafts/` | 安全ゲートで止まった記事。人が直して `posts/` に移す |
| `content/topics.json` | 自動執筆のネタ帳（キーワード・切り口・キュー） |
| `src/assets/` | CSS / JS / サムネ画像 |
| `scripts/build.mjs` | `content/` → `site/` を生成（sitemap・RSS・構造化データ含む） |
| `scripts/generate-post.mjs` | Claude で記事を書き、安全ゲートを通す |
| `scripts/og-image.mjs` | 記事タイトルからサムネ(1200×630 PNG)を生成 |
| `scripts/gsc-report.mjs` | Search Console から順位・クエリを取得し、伸びているワードとリライト候補を出す |
| `scripts/notify-search.mjs` | IndexNow で新規URLを検索エンジンに通知 |
| `scripts/nightly-report.mjs` | 毎晩の成果を Slack に投稿 |
| `api/contact.js` | 問い合わせAPI（Vercel Serverless Function） |
| `gas/Code.gs` | スプレッドシート記録 + 営業ファネル集計（Google Apps Script） |
| `.github/workflows/nightly-blog.yml` | 夜間自動実行 |
| `site/` | ビルド結果（公開するファイル） |

## A. 公開する（Vercel 推奨）

フォームのAPIが動くので Vercel を推奨します。GitHub Pages でも LP とブログは動きますが、フォームは Google フォームへの誘導になります。

1. https://vercel.com で GitHub 連携し、このリポジトリを Import
2. 設定はリポジトリの `vercel.json` が自動で使われます（Build: `npm run build` / Output: `site`）
3. Deploy 後、Settings → Domains で `musashi-seikotsuinsupport.com` を追加し、画面に出る DNS（A または CNAME）を現在のドメイン管理画面に設定
   - Studio 側の公開を止めるのは DNS 切り替え後に
4. `content/site.json` の `siteUrl` が本番ドメインになっていることを確認

ローカルで確認する場合:
```bash
npm install
npm run dev      # http://localhost:3000  (/api/contact もローカルで動きます)
```

## B. 問い合わせの自動化（メール・Slack・スプレッドシート）

Vercel → Settings → Environment Variables に以下を設定して再デプロイ。

| 変数 | 必須 | 取得先 |
|---|---|---|
| `RESEND_API_KEY` | ◎ | https://resend.com（無料枠 3,000通/月）。Domains で送信ドメインを認証 |
| `MAIL_FROM` | ◎ | 例 `むさし鍼灸整骨院サポート事業部 <info@musashi-seikotsuinsupport.com>`（Resendで認証したドメイン） |
| `MAIL_TO` | ◎ | 社内通知先。カンマ区切りで複数可 |
| `SLACK_WEBHOOK_URL` | ○ | Slack → アプリ「Incoming Webhooks」→ 通知チャンネルを選んで発行 |
| `BOOKING_URL` | ○ | 日程調整ページのURL（Google カレンダーの予約スケジュール、TimeRex、Calendly など）。設定すると送信完了画面と自動返信メールにリンクが出ます |
| `SHEETS_WEBHOOK_URL` | ○ | 下記 GAS をデプロイした「ウェブアプリURL」 |
| `SHEETS_TOKEN` | ○ | `gas/Code.gs` の `TOKEN` と同じ文字列 |
| `TURNSTILE_SECRET` | △ | スパムが増えたら Cloudflare Turnstile を導入（フォームにウィジェット追加が必要） |

ボット対策は最初から入っています: ハニーポット項目 / 入力時間2.5秒未満を拒否 / 同一IPの連投制限（10分5件）。

### スプレッドシート（営業ファネル）
1. 新規スプレッドシート → 拡張機能 → Apps Script → `gas/Code.gs` を貼り付け、`TOKEN` を変更
2. 関数 `setup` を一度実行（「リード」「ファネル」シートが作られる）
3. デプロイ → 新しいデプロイ → ウェブアプリ / 実行ユーザー: 自分 / アクセス: 全員 → URL を `SHEETS_WEBHOOK_URL` に
4. 「リード」シートの「ステータス」列（新規→連絡済→相談済→提案中→受注）を更新すると「ファネル」に転換率と日別リード数が出ます

## C. ブログ自動生成（毎晩1本）

GitHub → Settings → Secrets and variables → Actions に設定:

| Secret | 必須 | 内容 |
|---|---|---|
| `ANTHROPIC_API_KEY` | ◎ | https://console.anthropic.com で発行。モデルは `claude-opus-5-5`（`POST_MODEL` で変更可） |
| `SLACK_WEBHOOK_URL` | ○ | 夜間レポートの投稿先 |
| `GSC_SERVICE_ACCOUNT_JSON` | ○ | 下記 D-2 のサービスアカウント鍵JSONの中身をそのまま |

- 実行は毎日 03:00 JST。手動実行は Actions → nightly-blog → Run workflow（本数を指定可）
- 流れ: ネタ選定（GSCで伸びているクエリ → `topics.json` のキュー → キーワード×切り口）→ 執筆 → **安全ゲート**（医療広告ガイドライン・薬機法の断定表現、文字数、見出し数、重複タイトル）→ 合格だけ `content/posts/` に保存 → サムネ生成 → ビルド → push → IndexNow 通知 → Slack レポート
- 不合格は `content/drafts/` に入ります。直して `posts/` に移動すれば次のビルドで公開されます
- 目安コスト: 1記事あたり数十円程度（入力約3千トークン・出力約5千トークン）。月30本でも数百〜千円台
- 安全ゲートで止まる表現を増やしたいときは `scripts/lib/safety.mjs` の `BANNED` に追加

記事を手で書く場合は `content/posts/YYYY-MM-DD-slug.md` に次の形式で:
```markdown
---
title: "記事タイトル"
date: 2026-01-15
description: "検索結果に出る説明文（80〜120文字）"
tags: [集客, MEO]
faq:
  - q: "よくある質問"
    a: "答え"
---
本文（## 見出しを使う。# は使わない）
```

## D. 計測（GA4・Search Console）

1. **GA4**: プロパティを作り、測定ID（`G-XXXXXXX`）を `content/site.json` の `ga4Id` に。CTAクリック・診断完了・送信完了が自動でイベント送信されます
2. **Search Console**:
   - プロパティ追加 → HTMLタグ認証の `content` 値を `site.json` の `gscVerification` に → ビルド/デプロイ → 認証
   - サイトマップに `https://musashi-seikotsuinsupport.com/sitemap.xml` を登録
   - API連携: Google Cloud でプロジェクト作成 → Search Console API を有効化 → サービスアカウント作成 → 鍵(JSON)発行 → Search Console の「設定 → ユーザーと権限」にサービスアカウントのメールを**フル**で追加 → JSONの中身を GitHub Secret `GSC_SERVICE_ACCOUNT_JSON` に
   - 連携後、夜間レポートに「クリック/表示」「上位クエリ」「伸びているクエリ」「リライト候補」が出て、記事ネタにも自動反映されます

## 運用のコツ

- 問い合わせが減ったら: Slack の夜間レポートで「リライト候補」を見て、`content/posts/` の該当記事に見出しと具体例を足す（`updated:` を frontmatter に追加すると更新日が反映）
- セミナー日程や料金の変更: `content/site.json` を編集 → push（build-check が通れば Vercel が自動デプロイ）
- 診断の質問・レベル判定・アドバイスも `site.json` の `shindan` で変更できます
- 既存のサンプルLP（ルート直下のハッシュ名 HTML）はこの仕組みと独立しており、そのまま残っています
