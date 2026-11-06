# seikotsu-lp

- `site/` 以下: むさし鍼灸整骨院サポート事業部（株式会社ONE FOR ALL）の集客用サイト。LP・1分経営診断・ブログ・問い合わせ自動化・ブログ自動生成。
- ルート直下の `*.html`（ハッシュ名）: 宮崎市の整骨院向け提案用サンプルLP（noindex）。

セットアップ手順は [docs/SETUP.md](docs/SETUP.md) を参照。

```bash
npm install
npm run dev            # ローカル確認 http://localhost:3000
npm run build          # content/ → site/
npm run post:generate  # AIで記事を1本生成（ANTHROPIC_API_KEY が必要）
DRY_RUN=1 npm run post:generate  # APIを呼ばずに流れだけ確認
npm run post:og        # サムネ生成
```
