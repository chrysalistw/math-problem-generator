# 加法練習題生成器

產生可列印的加法練習卷：m 位數 + m 位數（或 m-1 位數），m = 1–3。
可選題數、橫式／直式、計算格、進位（隨機／不進位／必進位），並附答案頁。

## 開發

```bash
npm install
npm run dev      # 本機開發
npm test         # 出題邏輯測試
npm run build    # 輸出到 dist/
```

設定與隨機種子會寫在網址上，重新整理或分享連結會得到同一份卷子。
「列印 / 存成 PDF」使用瀏覽器列印，在列印對話框選「另存為 PDF」即可。

## 部署到 Cloudflare Pages

- Build command：`npm run build`
- Build output directory：`dist`
- `functions/` 會自動部署成 Pages Functions（目前 `/api/checkout` 回 501）。

本機模擬 Pages（含 Functions）：

```bash
npm run build && npx wrangler pages dev dist
```

## 付費功能（預留）

- `src/premium.ts`：`isPremium()`（目前恆為 false）與 `startCheckout()`。
- `functions/api/checkout.ts`：之後在此建立金流結帳，回傳 `{ url }`。
- 金鑰放在 Pages 環境變數，不要放前端。
