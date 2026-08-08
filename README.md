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
