# 2026-06-16 — vtuber-assistant GitHub 備份建置

## 背景
VTube 桌面 Live2D AI 助手已可運作，需設定 GitHub 備份。參考 personal-playbook
的 git 防護慣例（Cowork mount 會注入 null byte / CRLF 污染，本專案開發過程已實際踩到
config.js / renderer.js 等檔案被截斷的事故）。

## 決策
- Repo 名稱：`vtuber-assistant`
- 公開性：**Public**（seyen37）。backup（seyenbot）建議 Private。
- Live2D 範例模型：**不入庫**。原因：省空間（assets/live2d 達 652MB，含 545MB 編輯原始檔），
  且 Live2D 範例模型受官方授權、不宜公開散布。模型留在本機 `assets/live2d/<角色>/`，
  以 `.gitignore` 排除；只保留 `LICENSE-NOTE.md` 當說明。
- 遠端：兩個（與 playbook 一致）
  - `origin` = git@github.com:seyen37/vtuber-assistant.git
  - `backup` = git@github-backup:seyenbot/vtuber-assistant.git
- null-byte 三層防護（mirror playbook）：
  - Layer 1 `scripts/git-hooks/pre-commit`、Layer 2 `.gitattributes filter=strip-nul`
    （額外納入 `*.js *.css *.html *.json`）、Layer 3 `.github/workflows/null-byte-audit.yml`
- `.gitattributes`：`* text=auto eol=lf`、`*.bat/*.cmd eol=crlf`、影像/`moc3/cmo3/can3/psd/wav` binary
- `.gitignore`：`node_modules/`、`dist/`、`/config.json`、`assets/live2d/*`（保留 LICENSE-NOTE.md）

## 入庫範圍（精簡）
- 程式碼（src/）、vendor libs（pixi/cubism）、package*.json、scripts、docs、workflow。
- 不含：node_modules、Live2D 模型、執行期 config.json。
- 影響：clone 後需自行放入一個 Live2D 模型才會顯示角色（README 已說明）；
  文字問答 / 找資料不受影響。

## 操作（皆在 Windows 主機端執行，sandbox 無法可靠跑 git）
- 一次性：在兩帳號各建立「空的 repo」`vtuber-assistant`（seyen37 Public、seyenbot Private；不要加 README）。
- 執行 `GITHUB_SETUP_2026-06-16.bat`：清 sandbox 殘留 .git → init → 裝 hook+filter
  → 首次 commit → 加兩遠端 → push。
- 之後同步用 `GIT_COMMIT_PUSH_2026-06-16.bat`。

## 備註
- sandbox（Cowork mount）無法可靠執行 git（.git/config 被截斷、index.lock 無法 unlink），
  與 playbook 2026-05-13/14 的 sandbox_host_git_lock 事故同源 → 一律在主機端跑 git。
