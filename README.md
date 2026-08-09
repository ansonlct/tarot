# Arcana Mirror — 純規則式塔羅占卜網站

這是一個**完全不使用 AI / LLM / OpenAI API / 外部 AI 服務**的前端塔羅網站。所有牌義、位置修飾、主題修飾、牌組合與句式均在本專案的 JavaScript 資料及規則引擎中完成。

## 啟動

需要 Node.js 18+（只用 Node 內建 HTTP server，沒有 npm 套件依賴）。

```bash
npm start
```

然後開啟：`http://localhost:5173`

也可部署到任意靜態網站空間（GitHub Pages、Cloudflare Pages、Netlify 等）；本網站沒有應用後端。

## 自動檢查

```bash
npm run check
```

檢查項目包括：78 張牌數量與唯一性、22/56 分類、完整欄位、正逆位與四主題內容非空、牌陣數量、特殊組合、隨機抽牌無重複、localStorage 模組存在、禁止 AI/API 關鍵依賴、TODO/空白資料掃描。

## 架構

- `data/tarotCards.js`：78 張牌資料生成與完整欄位
- `data/spreads.js`：1 / 3 / 5 張牌陣
- `data/interpretations.js`：主題、位置、句式、子題規則
- `data/combinations.js`：特殊牌組合 + fallback 設定
- `engine/random.js`：Web Crypto 隨機數與洗牌
- `engine/draw.js`：抽牌與正逆位
- `engine/interpreter.js`：單牌解讀、位置與主題規則
- `engine/resultComposer.js`：多牌組合、綜合結論與文字變化
- `storage/history.js`：localStorage 歷史紀錄
- `ui/render.js`：所有畫面及互動 UI
- `assets/cards/`：78 張本地 SVG 牌面

## 隱私

問題與結果只保存在目前瀏覽器的 localStorage，不會上傳到第三方伺服器。

## Immersive v2.7
- Main page / draw room immersive transitions retained.
- Result page card-by-card view is simplified to English name, Chinese name, orientation and 4 key terms only.
- Added a car-dashboard inspired score area for 成功／不成功、好運／厄運.
- Added a summary-analysis preview with the opening text visible and the remaining analysis blurred/locked, ready for a future paid unlock flow.
- Dashboard scores are rule-based reading tendencies, not scientific probabilities or guarantees.

- v2.7 儀錶指針修正為 0=左、50=上、100=右，並加入汽車著車式掃錶回彈動畫。


## v2.8
- 結果頁每張牌固定顯示 4 個核心關鍵詞；完整牌義仍可在塔羅牌指南查看。
- 儀錶改用同一條 SVG 半圓 path 計算填色與指針，修正分數位置視覺錯位。
- 保留汽車著車式掃錶動畫，最後準確停在分數位置。
- REMEMBER 區改為「占卜師介紹／真人深入分析」。
- 加入 PayMe 與 PayPal 圖示付款入口。ui/render.js 內 PAYMENT_LINKS 目前指向服務商入口頁，正式上線前必須替換成實際收款連結。
- 目前為純靜態網站，不能自動確認 PayMe / PayPal 是否付款成功，也不能自動把付款者資料傳給真人占卜師；若要做到「付款後自動聯絡」，需再接後端、表單或付款 webhook。
