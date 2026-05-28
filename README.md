# リタウン 管理画面バックエンド

Next.js 14 (App Router) + JSON ファイルストレージのシンプル構成。
無料見積もり・加盟店募集フォームの受付と、エリア別管理画面を提供します。

## 起動方法

```bash
cd backend
npm install
npm run dev          # http://localhost:3001 で起動
```

本番ビルド:
```bash
npm run build
npm start            # ポート 3001
```

## 管理画面 URL

- ログイン: `http://localhost:3001/admin`
- ダッシュボード: `http://localhost:3001/admin/dashboard`（ログイン後）

## パスワード（初期値）

| エリア | パスワード | 表示できる申込 |
|---|---|---|
| 東京・神奈川 | `tokyo2026`   | tokyo の申込のみ |
| 大阪・神戸   | `osaka2026`   | osaka の申込のみ |
| 名古屋       | `nagoya2026`  | nagoya の申込のみ |
| 札幌         | `sapporo2026` | sapporo の申込のみ |
| 福岡         | `fukuoka2026` | fukuoka の申込のみ |
| 全エリア管理 | `admin2026`   | 全エリア閲覧＋削除権限 |

本番運用時は `.env.local` で上書きしてください：

```env
PASSWORD_TOKYO=...
PASSWORD_OSAKA=...
PASSWORD_NAGOYA=...
PASSWORD_SAPPORO=...
PASSWORD_FUKUOKA=...
PASSWORD_ADMIN=...
AUTH_SECRET=長めのランダム文字列
```

## API

### `POST /api/submit`
フォーム送信受付（CORS開放済み）

リクエストボディ:
```json
{
  "type": "quote" | "partner",
  "region": "tokyo" | "osaka" | "nagoya" | "sapporo" | "fukuoka",
  "name": "...", "email": "...", "tel": "...",
  ...任意のフィールド
}
```

### `POST /api/admin/login`
管理画面ログイン

### `POST /api/admin/logout`
ログアウト

### `GET /api/admin/submissions?type=...&region=...&status=...`
申込一覧取得（要ログイン）

### `PATCH /api/admin/submissions`
ステータス更新（既読/アーカイブ/メモ）

### `DELETE /api/admin/submissions`
削除（admin のみ）

## データ保存先

`backend/data/submissions.json` に追記方式で保存。
バックアップは適宜このファイルをコピーしてください。

## 静的サイトとの連携

静的HTML（contact.html / partner-contact.html）は、同一ドメインの `/api/submit` に POST します。
別ドメインで運用する場合は HTML 内の `API_ENDPOINT` を絶対URLに変更してください。

### Vercel 等にデプロイする場合

1. `backend/` ディレクトリをVercelプロジェクトとしてデプロイ
2. 静的サイト側のHTMLで `API_ENDPOINT = "https://your-backend.vercel.app/api/submit"` に書き換え
3. （または静的HTMLも同じNext.jsプロジェクトの `public/` に配置して一元運用）

### 同一サーバーで運用する場合

Nginx などで以下のようにリバースプロキシ：
```nginx
location /api/ {
  proxy_pass http://localhost:3001;
}
location /admin {
  proxy_pass http://localhost:3001;
}
```
