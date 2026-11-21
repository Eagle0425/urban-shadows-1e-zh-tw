# 城市之影 Urban Shadows 第一版繁體中文手冊

[公開網站](https://eagle0425.github.io/urban-shadows-1e-zh-tw/)提供玩家與主持人查閱入口、原型與扮演書索引、一版術語、章節頁碼和翻譯進度。

## 本機校對版

在本專案的上一層放置原有的 `Urban Shadows 1st` 資料夾。使用 Python 3.10 以上執行：

```sh
python build-local.py
```

開啟 `local-preview/index.html` 即可閱讀。資料如位於別處，可用 `--sources` 指定資料夾。本機版會匯入 Word 翻譯參考，並依頁碼連至既有的 16 份中文扮演書，以及中文動作速查表。`local-preview/` 存放生成產物、中文參考 PDF 和來源雜湊。

## 編修

- `content.js` 維護章節、印刷頁碼、扮演書來源與中英術語。
- `build-local.py` 按原有 Word 段落、標題和扮演書起點收錄文字。調整既有 Word 檔的段落位置時，重新對照匯入對應。
- 網站標示的是現有中文資料能覆蓋的範圍。複核使用一版核心書與《黑街》，另記錄英文空節、規則措辭分歧與待查來源。核心書已有部分翻譯，《黑街》現有成果主要是四份中文扮演書。
- 維護方式參考 [game-doc-template](https://github.com/wayne930242/game-doc-template)、[Root RPG](https://github.com/Eagle0425/root-rpg-player-reference) 與 [Epyllion](https://github.com/Eagle0425/epyllion-zh-tw-reference)。

## GitHub Pages

網站為免建置靜態檔案。Settings → Pages 設為從 `main` 的根目錄部署。所有資源使用相對路徑。

Urban Shadows © Magpie Games。原作 Andrew Medeiros、Mark Diaz Truman。非官方繁體中文專案。

