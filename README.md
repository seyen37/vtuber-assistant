# 桌面 Live2D AI 助手（Desktop VTuber Assistant）

一個可獨立在 **Windows 桌面**執行的輕量虛擬助手：透明浮窗、Live2D 角色、打字問答，
並能在需要時**自己上網找資料**再回答。LLM 可在**本機 Ollama** 與**雲端（OpenAI 相容）**之間切換。

> v1 範圍：文字問答 + 上網找資料 + Live2D 角色（可切換）。
> 語音（聽 / 說）已預留接口，列在 v2（見最後）。

---

## 1. 系統需求

- **Node.js 18 以上**（建議 20+）。下載：https://nodejs.org
- LLM 二選一（或都設定，於介面切換）：
  - **本機 Ollama**：安裝 https://ollama.com ，並先拉一個**支援工具呼叫**的模型，例如：
    `ollama pull qwen2.5`（`qwen2.5`、`llama3.1` 等支援 tools；找資料功能需要這類模型）
  - **雲端 OpenAI 相容端點**：準備好 baseUrl + apiKey + 模型名。

---

## 2. 安裝與啟動

```
npm install
npm start
```

啟動後右上角有三顆鈕：⚙ 設定、—（最小化）、✕（關閉）。拖曳標題列或角色區可移動視窗。

---

## 3. 設定（⚙）

- **角色（Live2D）**：下拉選單可切換角色（見第 5 節），存檔後立即套用。
- **LLM 來源**：選「本機 Ollama」或「雲端（OpenAI 相容）」。
  - Ollama：填 Base URL（預設 `http://localhost:11434`）。模型旁有 **↻ 偵測**鈕，
    按一下會列出本機已安裝的模型（讀 Ollama `/api/tags`），點輸入框即可挑選，不用手打。
  - 雲端：填 Base URL（如 `https://api.openai.com/v1`）、API Key、模型名。
  - 註：若選到的本地模型**不支援工具呼叫**，程式會自動改用純對話（不會卡住、不會報錯），
    只是該模型不會幫你上網找資料。想要找資料功能，請用支援 tools 的模型（如 `qwen2.5`、`llama3.1`）。
- **找資料**：可開關「上網找資料」；搜尋來源預設 DuckDuckGo（免 key），也可切到 Tavily（需 key）。
- **人設 / System Prompt**：調整助手的語氣與行為。

設定存在使用者資料夾（`%APPDATA%` 下的 config.json），不會動到原始碼。

---

## 4. 打包成 .exe（免安裝版）

```
npm run build
```

產生的檔案在 `dist/`。建議在 Windows 本機執行打包，產出的 .exe 最穩定。

---

## 5. 換角色（角色是可抽換的）

最簡單：把你的 Cubism 模型整包放到 `assets/live2d/<你的角色>/`（可含子資料夾，如 `runtime/`），
程式會**自動掃描**到。打開 ⚙ 設定 → 角色（Live2D）下拉選單就能切換，儲存後**立即套用、不必重開**。

- 對嘴會用模型的 `ParamMouthOpenY` 參數（大多數 Live2D 模型都有）。
- 選用的角色記在設定檔的 `character`，下次開啟會記得。

⚠️ 授權：內附的 Hiyori / Haru 為 Live2D 官方範例，僅供示範，商用前請另取得授權。
詳見 `assets/live2d/LICENSE-NOTE.md`。

---

## 6. 專案結構

```
VTube/
├─ package.json
├─ src/
│  ├─ main/                # Electron 主行程（Node）
│  │  ├─ main.js           #   視窗、內建靜態伺服器、IPC、角色掃描、Ollama 模型列舉
│  │  ├─ preload.js        #   安全橋接（contextBridge）
│  │  ├─ config.js         #   設定載入 / 儲存 / 預設值
│  │  ├─ llm.js            #   LLM 抽象層（Ollama + OpenAI 相容）
│  │  ├─ search.js         #   網路搜尋（DuckDuckGo / Tavily）
│  │  └─ agent.js          #   tool-calling 迴圈（含不支援工具自動降級）
│  └─ renderer/            # 畫面（Chromium）
│     ├─ index.html
│     ├─ style.css
│     ├─ live2d.js         #   Live2D 載入 / 對嘴 / 換角色
│     └─ renderer.js       #   對話 UI / 設定面板 / 角色與模型下拉
├─ assets/
│  ├─ vendor/              # pixi.js、Live2D Cubism Core、cubism4 外掛（已內附）
│  └─ live2d/              # Live2D 角色（hiyori、haru…；僅示範用）
└─ test/test-backend.cjs   # 後端邏輯單元測試
```

設計重點：所有 LLM 與搜尋呼叫都在主行程（Node）執行，API key 不進畫面層、也避開瀏覽器 CORS。

---

## 7. 測試

```
npm test
```

涵蓋：設定合併、LLM 格式轉換與呼叫解析、Ollama 模型切換、DuckDuckGo 解析、
agent tool-calling 迴圈、以及「本地模型不支援工具時自動降級」。另含一個實連 DuckDuckGo 的整合測試。

---

## 8. 已知限制 / 驗證狀態

- 後端邏輯（LLM 切換、搜尋、agent 迴圈、不支援工具降級）已通過單元測試。
- Live2D 視窗畫面需在你的 Windows 上實際執行驗證。若角色沒出現，按 Ctrl+Shift+I 看 Console。
- 找資料功能需要支援工具呼叫的模型；不支援 tools 的模型只會純文字回答。

---

## 9. v2 預留（語音）

- 語音輸入（聽）：Whisper / QwenASRMiniTool
- 語音輸出（說）：Edge TTS / Confucius4-TTS（可做聲音克隆）

---

## 授權

- 程式碼：MIT。
- Live2D 範例模型與 Cubism Core：屬 Live2D 授權，非 MIT，商用前請自行確認（見 `assets/live2d/LICENSE-NOTE.md`）。

---

## 10. Git 備份 / Live2D 模型說明

- 本 repo **不包含 Live2D 模型**（省空間、避免範例模型公開散布的授權問題）。
  模型放在你本機的 `assets/live2d/<角色>/`，已由 `.gitignore` 排除。
- **clone 後要顯示角色**：自行放一個 Cubism 模型到 `assets/live2d/<角色>/`，
  並在 ⚙ 設定 → 角色 選用（或改 `config.js` 的 `DEFAULT_MODEL`）。文字問答/找資料不受影響。
- **備份到 GitHub**（Windows 主機端執行；sandbox 無法可靠跑 git）：
  - 一次性：建立空 repo 後執行 `GITHUB_SETUP_2026-06-16.bat`。
  - 日常同步：執行 `GIT_COMMIT_PUSH_2026-06-16.bat`（推 origin=seyen37 + backup=seyenbot）。
  - 內建 null-byte 三層防護（hook + strip-nul filter + CI 稽核），對應開發時遇到的檔案截斷問題。
