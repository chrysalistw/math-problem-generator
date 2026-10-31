# 部署說明：Cloudflare Pages

這個專案是純靜態網站（Vite 建置），外加 `functions/` 裡的 Pages Functions（目前只有 `/api/checkout` 預留）。
下面兩種方式擇一即可：

| 方式 | 適合 | 之後更新 |
|---|---|---|
| **A. 連接 GitHub（推薦）** | 長期維護 | `git push` 後自動部署，PR 有預覽網址 |
| **B. Wrangler 指令直接上傳** | 不想用 GitHub、想馬上上線 | 每次手動執行一行指令 |

> 不要用 Cloudflare 後台的「拖曳上傳資料夾」：那種方式不會部署 `functions/`。

---

## 事前準備

- Cloudflare 帳號（免費方案即可）
- Node.js 18 以上（本機已用 22 測試）
- 本機先確認能建置：

```bash
npm install
```

```bash
npm test
```

```bash
npm run build
```

成功後會產生 `dist/` 資料夾。

---

## 方式 A：連接 GitHub（推薦）

### 1. 把專案推上 GitHub

專案目前還不是 git repo，先初始化並推到一個新的 GitHub repository（public 或 private 都可以）：

```bash
git init
```

```bash
git add .
```

```bash
git commit -m "Initial commit"
```

```bash
git branch -M main
```

```bash
git remote add origin https://github.com/<你的帳號>/math-problem-generator.git
```

```bash
git push -u origin main
```

`.gitignore` 已排除 `node_modules`、`dist`、`.wrangler`。

### 2. 在 Cloudflare 建立 Pages 專案

1. 登入 Cloudflare 後台 → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. 授權 GitHub，選擇 `math-problem-generator` repository
3. 建置設定填：

| 欄位 | 值 |
|---|---|
| Production branch | `main` |
| Framework preset | `None`（或 `Vite`） |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | 留空 |

4. （建議）**Environment variables** 加一個 `NODE_VERSION` = `22`，固定 Node 版本
5. 按 **Save and Deploy**

約 1 分鐘後會拿到網址，例如 `https://math-problem-generator.pages.dev`。

### 3. 之後更新

```bash
git push
```

推到 `main` 會更新正式站；推到其他分支或開 PR 會產生獨立的預覽網址。

---

## 方式 B：Wrangler 指令直接上傳

### 1. 登入（第一次）

```bash
npx wrangler login
```

會開瀏覽器請你授權 Cloudflare 帳號。

### 2. 建立專案（第一次）

```bash
npx wrangler pages project create math-problem-generator --production-branch main
```

### 3. 建置並部署（每次更新都執行）

一定要在**專案根目錄**執行，Wrangler 才會一起部署 `functions/`：

```bash
npm run build && npx wrangler pages deploy dist --project-name math-problem-generator --branch main
```

完成後終端機會顯示網址。

---

## 部署後檢查

1. 打開網址，確認練習卷預覽正常顯示
2. 改幾個設定、按「重新出題」，確認網址上的參數會跟著變
3. 複製網址在新分頁打開，確認是同一份卷子
4. 按「列印 / 存成 PDF」，在列印視窗選「另存為 PDF」，檢查分頁與答案頁
5. 確認預留的 API 有部署（應該回 `501` 和 `{"error":"not_implemented"}`）：

```bash
curl -i -X POST https://<你的網址>.pages.dev/api/checkout
```

---

## 綁定自己的網域（選用）

Pages 專案 → **Custom domains** → **Set up a custom domain** → 輸入網域，照畫面指示設定 DNS。
網域若已在 Cloudflare 管理，會自動完成並配發 HTTPS 憑證。

---

## 本機模擬正式環境（選用）

`npm run dev` 不會跑 `functions/`。要連同 Functions 一起在本機測：

```bash
npm run build && npx wrangler pages dev dist
```

預設網址是 `http://localhost:8788`。

---

## 之後接金流時

- 金流金鑰（例如 Stripe secret key）放在 Pages 專案 → **Settings** → **Variables and Secrets**，選 **Encrypt**，不要寫進程式碼或前端
- 在 `functions/api/checkout.ts` 透過 `context.env.<變數名>` 讀取
- 本機測試用的金鑰放在專案根目錄的 `.dev.vars`（記得加進 `.gitignore`）
- 正式站與預覽環境（Production / Preview）可以設不同的金鑰，預覽用測試金鑰

---

## 常見問題

| 狀況 | 處理 |
|---|---|
| 建置失敗，錯誤訊息提到 Node 版本 | 設定環境變數 `NODE_VERSION=22` 後重新部署 |
| `/api/checkout` 回 404 | 方式 B 沒在專案根目錄執行 `wrangler pages deploy`，或用了拖曳上傳 |
| 頁面空白 | 確認 Build output directory 是 `dist`，不是 `/` |
| 改了程式但網站沒更新 | 方式 A 確認有 push 到 `main`；方式 B 確認有重新 `npm run build` |
