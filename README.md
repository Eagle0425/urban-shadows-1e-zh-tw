# 城市之影 Urban Shadows 第一版繁體中文手冊

[公開網站](https://eagle0425.github.io/urban-shadows-1e-zh-tw/)提供《城市之影》第一版核心書與《黑街》的完整繁中譯文、全文搜尋、原型索引、一版術語、章節頁碼及校訂紀錄。完整譯文已取得公開授權；英文原書 PDF 與既有中文參考 PDF 不隨網站發布。

## 本機校對版

在本專案的上一層放置原有的 `Urban Shadows 1st` 資料夾。使用 Python 3.10 以上執行：

```sh
python build-local.py
```

開啟 `local-preview/index.html` 即可閱讀。資料如位於別處，可用 `--sources` 指定資料夾。本機版會匯入 Word 翻譯參考，並依頁碼連至既有的 16 份中文扮演書，以及中文動作速查表。`local-preview/` 存放生成產物、中文參考 PDF 和來源雜湊。

補譯稿由 `Urban Shadows 1st/翻譯參考/core-supplement.json` 匯入。每個小節標有一版核心書的印刷頁碼，並以原書的 SHA-256 核對版次。既有 Word 檔的對應段落如已填入正文，建置會出錯，以免覆蓋原稿。

## 編修

本機「來源與校訂」頁提供101項原書目錄與實際正文起點對照；原目錄的舊頁碼保留。14個兩書原型的獨立頁面使用與章節相同的校訂譯文。不死者與龍族為既有參考稿，另標示不屬本次兩書。

- `content.js` 維護章節、印刷頁碼、扮演書來源與中英術語。
- `build-local.py` 按原有 Word 段落、標題和扮演書起點收錄文字。調整既有 Word 檔的段落位置時，重新對照匯入對應。
- 新補譯保存在 `翻譯參考/batches/*.md`，以印刷頁標記和段落錨點匯入；先執行 `translation-workflow.py` 更新 445 個 PDF 實體頁的盤點表，再重建網站。進度分開記錄初譯與獨立複校；複校需逐頁重讀原文、核對譯文與視覺盤點頁面，未覆核頁不能因有初稿而算完成。
- `validate.mjs --local` 驗證資料與路由；`validate-local-browser.cjs` 使用 Playwright 與本機 Edge 驗證所有章節、搜尋、段落連結及手機版，結果僅存 `local-preview/`。如套件不在預設路徑，可設定 `CODEX_NODE_MODULES` 指向套件目錄。
- 核心書與《黑街》445個實體頁現均有對齊初稿或無文字頁紀錄；150批譯稿共6175個對齊單位已完成逐頁複校及已列跨章對讀。核心PDF38（印刷37）店面與橢圓兩處小招牌依使用者2026-11-24指示略過，明列於page-reviews.json的scopeExceptions；HOTEL＝旅館保留。完成證據以completion-audit.json與本機進度頁為準。
- 核心書索引的161條目／202查閱位置保存在`翻譯參考/index-references.json`，以原索引及目標頁譯文雜湊驗證；本機索引保留原列頁碼，在後方另附正文連結與錯引說明。正文63處顯式頁碼引用已另核，無頁碼轉介另有具名章節對讀紀錄。
- 正文63處顯式頁碼引用另存`翻譯參考/body-cross-references.json`，原列數字保留、後附67個核定查閱連結，來源與目標頁雜湊均須有效。外部書籍頁碼另記，避免誤連本書；無頁碼轉介與中文卡差異另存相應對讀紀錄。
- 中文動作表的27區對照在`翻譯參考/basic-moves-card-comparison.json`，原型卡逐份對照在`playbook-card-comparison.json`；來源與對應譯文頁雜湊通過才匯入本機來源頁。卡片差異也可全文搜尋，原PDF維持原樣。
- 目錄人工對應保存在`翻譯參考/contents-reviews.json`，綁定原書與目標頁譯文雜湊；`translation-workflow.py`重建`contents-inventory.json`時驗證這些紀錄。目錄起點核對與完整頁面複校分開計算。
- 獨立複校記錄在`翻譯參考/page-reviews.json`，每頁列元素與文字、版面、規則數字、術語檢查，並綁定來源和當頁譯文雜湊。譯文變更後原頁狀態會失效，須重新核對；本機進度頁分列已複校實體頁數。
- 核心基本動作先依原 Word 標題拆為獨立小節，拆分以原段落雜湊保護，便於逐一補齊選項解說與範例。未完成的小節繼續保留既有正文；原始 Word 不改寫。
- 維護方式參考 [game-doc-template](https://github.com/wayne930242/game-doc-template)、[Root RPG](https://github.com/Eagle0425/root-rpg-player-reference) 與 [Epyllion](https://github.com/Eagle0425/epyllion-zh-tw-reference)。

## GitHub Pages

網站為免建置靜態檔案。Settings → Pages 設為從 `main` 的根目錄部署。所有資源使用相對路徑。

Urban Shadows © Magpie Games。原作 Andrew Medeiros、Mark Diaz Truman。非官方繁體中文專案。

