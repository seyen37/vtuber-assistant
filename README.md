# 桌面 Live2D AI 助手（Desktop VTuber Assistant）

一個可獨立在 **Windows 桌面**執行的輕量虛擬助手：透明浮窗、Live2D 角色、打字問答，
並能在需要時**自己上網找資料**再回答。LLM 可在**本機 Ollama** 與**雲端（OpenAI 相容）**之間切換。

> 功能：文字問答 + 上網找資料 + Live2D 角色（可切換）+ 語音輸出（唸回覆，會對嘴）。
> 語音輸入（聽）：🎤 錄音 → Whisper 轉寫 → 自動送出（見第 9 節）。

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
- **記憶（本地）**：可開關「啟用本地記憶」。開啟後對話會存到本機（userData/memory.jsonl，不入庫），發問時以關鍵字回想最相關的幾則注入脈絡；可一鍵「清除全部記憶」。
- **知識庫客服**：可開關「啟用知識庫客服模式」。開啟後發問會先從你的知識庫（`assets/knowledge/knowledge.md`，以空行分段）關鍵字檢索最相關段落，讓助手**依知識庫回答**；勾「嚴格模式」則只依知識庫、查無就說查不到並建議轉真人。把那個檔換成你的 FAQ/產品說明即可變成客服機器人。**隱私**：`knowledge.md` 已加入 `.gitignore`（不上傳，避免機密外流）；範本見 `assets/knowledge/knowledge.example.md`，clone 後複製成 `knowledge.md` 再編輯即可。
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
- 若一個角色資料夾內含**多個 `*.model3.json`**（如 Cubism 範例的 nito、epsilon free/pro），下拉會以「**資料夾 / 模型檔名**」分別列出，不會誤判為重複。

⚠️ 授權：內附的 Hiyori / Haru 為 Live2D 官方範例，僅供示範，商用前請另取得授權。
詳見 `assets/live2d/LICENSE-NOTE.md`。

---

## 5.5 桌面 / 桌寵整合（系統匣・點擊穿透・開機自啟）

把助手當「桌寵」用的桌面整合，設定在 ⚙ 設定 → 桌面 / 桌寵，或用右下角**系統匣（托盤）圖示**右鍵選單操作：

- **點擊穿透**：開啟後滑鼠點擊會「穿過」角色，落到後面的程式——適合一邊工作一邊讓角色待在桌面上。
  - ⚠️ 穿透開啟時無法點到本視窗，請用**托盤選單**或全域快捷鍵 **Ctrl+Alt+Shift+P** 切回。
- **視窗永遠置頂**：角色是否一直浮在最上層（預設開）。
- **開機時自動啟動**：登入系統後自動開啟（用 Electron `setLoginItemSettings`）。
- **系統匣選單**：顯示/隱藏、點擊穿透、置頂、開機自啟、開啟設定、結束。左鍵點托盤圖示可快速顯示/隱藏。

以上設定存在 `config.json` 的 `desktop` 欄位，下次開啟會記得。

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

## 9. 語音

- **語音輸出（說，已完成）**：用瀏覽器內建語音合成（零依賴、離線、免費），會唸出回覆並帶動 Live2D 嘴型。
  - 設定面板「語音輸出」：開關、選語音（自動偏好 zh-TW）、調語速。
  - 標題列 🔊 / 🔇 可即時靜音。
  - 唸稿前會自動去掉網址、`[1]` 引用標記與 markdown 記號（見 `src/shared/textutil.js`）。
  - 音質取決於 Windows 內建語音；想要更自然可日後接 Edge TTS / OpenAI TTS（介面好擴充）。
- **語音輸入（聽，已完成）**：輸入列左側 🎤 點一下開始錄音、再點一下結束，會用 OpenAI 相容的
  `/audio/transcriptions`（Whisper）轉成文字並**自動送出**。
  - 需在設定的「雲端（OpenAI 相容）」填 API Key（Ollama 無轉寫端點，ASR 一律走雲端）。
  - 設定面板「語音輸入」可開關、改轉寫模型（預設 whisper-1）與語言（預設 zh）。
  - 錄音用瀏覽器 MediaRecorder（webm/opus），經主行程轉送雲端；首次會請求麥克風權限。

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
  - **日常備份（一鍵，推薦）**：在 VTube 資料夾對 `push.ps1` 按右鍵→「用 PowerShell 執行」，或 `powershell -ExecutionPolicy Bypass -File .\push.ps1`；會自動 add/commit/push 到 origin + backup。
  - 內建 null-byte 三層防護（hook + strip-nul filter + CI 稽核），對應開發時遇到的檔案截斷問題。
