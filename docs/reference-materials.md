# 參考資料分析筆記（VTube 桌面助手）

> 用途：把每一筆「提供過的參考資料」記錄下來——核心內容、與本專案的關聯、分析（優點/限制）、**決定（採用/部分採用/不採用/觀望）與理由**。
> 方便日後新增資料時，照同一格式分析歸納、避免重複評估。
>
> **決定標記**：✅ 採用　🟡 部分採用（借概念，不套程式）　⛔ 不採用　🔭 觀望（日後再評估）
> **新增方式**：在「詳細條目」用最底下的範本補一條 `R#`，並更新「速查表」。

---

## 速查表

| # | 來源 / 連結 | 類型 | 決定 | 一句理由 |
|---|---|---|---|---|
| R1 | Open-LLM-VTuber | 桌面 Live2D AI 參考架構 | 🟡 部分採用 | 借其 Live2D 角色與「換角色」概念；不整包用，改自建輕量 Electron |
| R2 | （使用者提供的 mp4 影片） | 影片 | ⛔ 不採用 | 未播放分析、無可落實內容 |
| R3 | ai-avatar-bot（YuriCrystal，網頁版） | 網頁會講話虛擬人 | 🟡 部分採用 | 借「知識庫客服 / 換角色 / 對嘴 / WebLLM」概念；網頁架構不直接套到 Electron |
| R4 | 你的 AI VTuber Agent + NowaEngine | 自家更新（免 VTube Studio、會找資料） | ✅ 採用(方向) | 啟發「agent 上網找資料」方向，已自建 web_search |
| R5 | 子曰4 / Confucius4-TTS（網易有道） | 多模態 LLM + 聲音克隆 TTS | 🔭 觀望 | 跨語種聲音克隆很強，但需本地跑大模型、重；v2 先用瀏覽器 TTS |
| R6 | QwenASRMiniTool 1.0.8 | Windows 語音轉文字工具 | ⛔ 不採用 | 獨立 app、整合成本高；ASR 改用 OpenAI Whisper API（雲端）；列為離線 ASR 備選 |
| R7 | Lottie 框架（diffusionstudio/lottie） | AI 生成 Lottie 動畫 | ⛔ 不採用 | 角色動態已用 Live2D；Lottie 為替代方案、暫不需要 |
| R8 | Chrome 內建 Gemini Nano（Prompt API） | 瀏覽器本地 LLM | ⛔ 不採用 | Electron 內建 Chromium 不附模型、實測偵測 ❌ 不可用；本機走 Ollama |
| R9 | Personal AI Memory（marswangyang，Chrome 擴充） | 本地對話記憶 + Hybrid RAG | 🟡 部分採用 | 借「本地記憶 + 回想」概念自建 memory.js；擴充抓網頁、架構不相容 |
| R10 | ai-avatar-bot（更新：打字 + 換角色 2D/3D VRoid） | 同 R3 後續 | ✅ 採用(概念) | 打字本就有；「換角色」已做（Live2D 下拉）；VRoid 3D 列後續 |
| R11 | ai-avatar-bot（語音版說明：WebLLM + 瀏覽器 STT/TTS + 知識庫檢索 + 一行 script 嵌入） | 同 R3 架構細節 | ✅ 採用(概念) | 「知識庫檢索」概念→已做 kb.js 客服；WebLLM 列待辦；嵌入式網頁屬另一條路線 |
| R12 | Navi-Studio/Virtual-Human-for-Chatting（Unity） | Unity Live2D 聊天虛擬人 | 🟡 部分採用 | 借「音訊驅動對嘴(audio2face/blendshape)」優化方向；Unity/C# 程式不可重用；Azure 語音與視覺感知觀望 |
| R13 | zoollcar/live2d-AI-chat（TS+Tauri） | 與本專案最相近的同棧虛擬人 | 🟡 部分採用 | 借「會回傳音訊的 TTS（vits-web / Edge TTS）→ 真音量對嘴」+ 情緒→表情；WebLLM 待辦；Tauri 不換 |
| R14 | suzuran0y/Live2D-LLM-Chat（Python） | 本地 Live2D+ASR+LLM+TTS | 🟡 部分採用 | 借「自動眨眼+視線跟隨」(新)、音量對嘴(再確認)、記憶摘要；LM Studio 用現有 OpenAI 相容 provider 即可；CosyVoice/SenseVoice 觀望 |
| R15 | evrstr/live2d-widget-models | 角色模型素材庫（Cubism 2） | 🟡 部分採用 | 觸發「支援 Cubism 2 模型」優化（多認 model.json + 載 cubism2 core）解鎖大量舊版模型；模型多為版權角色，個人本機用、勿上 public |
| R16 | Eikanya/Live2d-model | 巨型 Live2D 模型封存庫（混 Cubism 2/3/4） | 🟡 部分採用 | Cubism 4 子集現有設定即可用；Cubism 2 子集待「Cubism 2 支援」優化；遊戲擷取素材、版權屬原廠，僅個人本機、勿 clone 全庫/勿上 public |
| R17 | moeru-ai/airi（Project AIRI） | 大型 Web 技術 AI VTuber（重現 Neuro-sama） | 🟡 部分採用 | 權威驗證整個 backlog（自動眨眼/視線/待機眼動、音訊TTS對嘴、VAD、向量記憶）；可借鏡子套件 unspeech / Live2D utilities / memory-pgvector；整套 Vue/TS monorepo 不整包採用 |
| R18 | stevenjoezhang/live2d-widget | 網頁「看板娘」掛件（GPL-3, TS, 不接 LLM） | 🟡 部分採用（借概念不抄碼） | ⚠️GPL-3 與本專案 MIT 不相容→只可借鏡。① Cubism2+3/5 依版本動態載 Core（命中我們「Cubism 2 支援」）② waifu-tips 待機/情境台詞概念 |
| R19 | Ikaros-521/AI-Vtuber（Luna AI） | Python 直播彈幕互動型 AI Vtuber（整合超多 LLM/TTS） | 🟡 部分採用（借概念不抄碼） | ⚠️商用抽成10%/需授權→僅個人非商用參考。印證 Edge-TTS 務實首選；新方向：多模態「看螢幕」助手、直播彈幕模式（超出現範圍） |
| R20 | zenghongtu/PPet | Electron 桌面 Live2D 桌寵（MIT, Mac/Win/Linux, 偏舊 Cubism2） | 🟡 部分採用（同棧、近期最實用） | 同為 Electron！可借鏡桌面整合：★點擊穿透、托盤、開機自啟、URL 載入模型。⚠️Live2D 碼源自 GPL-3 live2d-widget→非 Live2D 概念自寫採用 |
| R21 | guansss/pixi-live2d-display | 我們正在用的 Live2D 渲染函式庫（MIT, 支援 Cubism 2/3/4） | ✅ 已採用（且未用滿） | 重大：Cubism2 支援＝改用 index.js 即可（免碰 GPL）；視線跟隨＝內建 focusing/`model.focus()`；hit-testing 點擊互動可加。兩項 backlog 其實是「啟用」級 |
| R22 | Voine/ChatWaifu_Mobile | Android(Kotlin) ChatGPT 二次元聊天器（端上 VITS/Sherpa, native Live2D） | 🟡 部分採用（跨平台不抄碼） | ★實戰教訓：連 meta-lipSync 都嫌逐音素對嘴太麻煩→退回循環動畫，印證我們用音量驅動張口即可。可借：角色綁定人設；🔭離線ASR(Sherpa) |
| R23 | fagenorn/handcrafted-persona-engine | 成熟 Windows .NET9+CUDA AI Live2D 全套件（偏直播） | 🟡 部分採用（北極星、重型不抄碼） | ★新點子：LLM 輸出 `[EMOTION:😊]` 標籤→觸發表情（低成本高CP，配 R21 expression API）。印證 VAD+barge-in、待機動畫、人設檔、看螢幕 |
| R24 | morettt/my-neuro | ★同棧 Electron+pixi-live2d-display 現代 AI 角色工作台 | 🟡 部分採用（同棧、可借鏡、抄碼前確認 license） | ★唱歌＝曲庫+LLM工具(play/random/stop/list)+唱歌/麥克風動作+音量對嘴；真唱聲離線預製(GPT-SoVITS/RVC)。通用模式：LLM工具→觸發本地媒體/動作。emotion_actions.json 表情映射 |
| R25 | galnetwen/Live2D | 老舊(2017) Cubism2 部落格看板娘掛件（R18 的祖先） | ⛔ 大致不採用 | 技術上無 R18 以外新東西且更舊。唯一可順手借：點擊/觸摸角色→隨機俏皮台詞（接 R21 hit-testing）。模型為手遊解包有版權 |
| R26 | imuncle/live2d | Live2D 模型收集庫(128個:102 Cubism2+40 碧藍航線)＋陽春展示頁 | ⛔ 大致不採用 | 同 R15/R16 模型來源性質。載入方式(loadlive2d / AzurLaneL2DViewer fork)已被 R21 pixi-live2d-display 取代。僅當模型素材來源、個人非商用 |
| R27 | timi-liuliang/echo | 通用遊戲引擎(C++/Lua, Vulkan/Metal, 2D/3D, MIT) | ⛔ 不採用 | 類別完全不同：Live2D 只是其一個範例。棧/規模/目的皆相差太遠，用引擎做我們需求＝過度工程。無可借鏡具體項目 |
| R28 | Dreamer-Paul/Pio | Typecho 部落格換 Live2D 模型外掛(GPL-2.0) | ⛔ 大致不採用 | 同 R18/R25/R26 網頁看板娘類，綁 Typecho/PHP、GPL-2.0 與 MIT 不相容、無新東西。僅再指向模型站梦象 |
| R29 | JoeyBling/hexo-theme-yilia-plus | Hexo 部落格主題（Live2D 只是其 26 功能之一） | ⛔ 大致不採用 | 類別不符（部落格主題），Live2D 用舊 widget.js fork 不如 R21。僅 🔭 幾個通用網頁小特效(點擊愛心/飄雪/打字特效)可當零成本裝飾 |
| R30 | jofizcd/Soul-of-Waifu | 成熟 Python 角色扮演桌面 app(GPL-3, Live2D/VRM, 本地+雲LLM, 即時語音) | 🟡 部分採用（借概念不抄碼） | 多為再次印證(桌面透明/barge-in/對嘴/情緒/向量記憶+自動摘要)。新概念：角色卡V2標準+世界書lorebook(關鍵字觸發情境注入)。RP/NSFW 取向多超範圍 |
| R31 | P1kaj1uu/ChattyPlay-Agent | 大型多功能聚合 web 站(React/TS, Apache-2.0)，Live2D 僅裝飾 | ⛔ 大致不採用 | 類別不符（工具聚合入口站），Live2D 純裝飾。無可借鏡具體項目；僅 🔭 i18n 多語介面等通用 web 實作 |

---

## 詳細條目

### R1 — Open-LLM-VTuber（介紹圖）
- **類型**：桌面型開源 AI 虛擬夥伴（Live2D、本機離線、多 LLM：Ollama/OpenAI/Gemini/Claude/DeepSeek、Whisper、Edge/Coqui/GPT-SoVITS）。
- **與本專案關聯**：我們的桌面 Live2D 助手最直接的同類參考。
- **分析**：功能完整、本機運行；但整包是別人的架構、且偏重。
- **決定**：🟡 部分採用 — 借其 Live2D 角色資源與「引擎我做、角色你換」概念；專案改從零做輕量 Electron。
- **落實**：pixi-live2d-display + 角色自動掃描/切換；多 LLM 切換（Ollama/OpenAI 相容）。

### R2 — 使用者提供的 mp4 影片
- **類型**：影片檔。**分析**：未播放、無逐項可落實內容。**決定**：⛔ 不採用（如需要可再分析）。

### R3 — ai-avatar-bot（YuriCrystal，網頁版） · https://github.com/YuriCrystal/ai-avatar-bot
- **類型**：掛網站右下角、會講話的虛擬人；一行 `<script>` 嵌入、角色可換、後接知識庫問答。
- **與本專案關聯**：核心靈感來源之一（對嘴、知識庫、換角色）。
- **分析**：網頁路線、零後端；但靠瀏覽器/WebLLM，與桌面 Electron + API 架構不同。
- **決定**：🟡 部分採用 — 借概念（知識庫客服、換角色、對嘴、WebLLM 待辦），不直接套程式。
- **落實**：kb.js 知識庫客服、Live2D 換角色、TTS 對嘴；WebLLM 列待辦。

### R4 — 你的 AI VTuber Agent + NowaEngine · https://nowaengine.com/
- **類型**：你自家更新——免串 VTube Studio、會主動找資料。
- **決定**：✅ 採用(方向) — 「agent 找資料」已用 tool-calling + DuckDuckGo（可換 Tavily）實作，附來源。

### R5 — 子曰4 / Confucius4-TTS（網易有道） · https://github.com/netease-youdao/Confucius4-TTS
- **類型**：27B 多模態 LLM（真權重）+ 3 秒聲音克隆、跨語種不帶口音 TTS。
- **分析**：聲音克隆品質誘人；但需本地跑大模型、體積/算力重。
- **決定**：🔭 觀望 — v2 先用瀏覽器內建 TTS（零相依）；想要「自訂音色/聲音克隆」時再評估接入。

### R6 — QwenASRMiniTool 1.0.8 · https://github.com/dseditor/QwenASRMiniTool
- **類型**：Windows 即用語音轉文字，含「端點」遠端錄製、未來相容 Whisper/Breeze-ASR-26。
- **分析**：好用但是獨立 app；嵌入桌面助手成本高。
- **決定**：⛔ 不採用（直接整合）— ASR 改用 OpenAI 相容 `/audio/transcriptions`；保留為「離線 ASR」備選清單。

### R7 — Lottie 框架（diffusionstudio/lottie） · https://github.com/diffusionstudio/lottie
- **類型**：給 AI coding agent 用、自然語言生成 Lottie 動畫的 Skill。
- **決定**：⛔ 不採用 — 角色動態已用 Live2D；Lottie 屬「不走 Live2D 時」的替代，暫不需要。

### R8 — Chrome 內建 Gemini Nano（Prompt API）
- **類型**：瀏覽器端 on-device LLM（Chrome 138+、WebGPU、~4GB 模型）。
- **分析/查證**：API 為 renderer 專屬；Electron 內建 Chromium 不附模型／未開旗標。
- **決定**：⛔ 不採用 — 加了偵測鈕，實測 ❌「無 Prompt API」；本機需求走 Ollama。詳見 `docs/decisions`（playbook）。

### R9 — Personal AI Memory（marswangyang，Chrome 擴充） · https://github.com/marswangyang/personal-ai-memory
- **類型**：本地優先、被動擷取 ChatGPT/Gemini 對話、瀏覽器內 Hybrid RAG（向量+BM25）。
- **分析**：概念正中需求；但它是瀏覽器擴充、抓網頁 DOM，與桌面 API 架構不相容。
- **決定**：🟡 部分採用 — 借「本地記憶 + 回想注入」概念，自建 memory.js（關鍵字回想、純本地、可開關/清除）。

### R10 — ai-avatar-bot 更新（打字功能 + 換角色 2D Live2D / 3D VRoid）
- **決定**：✅ 採用(概念) — 打字本就有；「換角色」已做（設定下拉、自動掃描、即時套用）；VRoid 3D 列後續路線（Amica/three-vrm 參考）。

### R11 — ai-avatar-bot 語音版說明（WebLLM 本機大腦 + 瀏覽器 STT/TTS + 知識庫檢索 + 一行 script 嵌入）
- **決定**：✅ 採用(概念) — 觸發了「方案比對」（見 `docs/comparison-voice-ai-solutions.md`）與「知識庫客服」實作（kb.js）。WebLLM 列為「離線大腦」待辦；一行 script 嵌入屬網頁路線（與桌面互補）。

---

### R12 — Navi-Studio/Virtual-Human-for-Chatting · https://github.com/Navi-Studio/Virtual-Human-for-Chatting
- **類型**：Unity（C# 97.8% + Shader）做的桌面 Live2D 聊天虛擬人（南京大學，2023，701★，MIT）。用 Azure 認知服務（語音 STT/TTS）、OpenAI API、OpenCV 人臉偵測；技術標籤含 blendshapes / audio2face。
- **與本專案關聯**：同為「Live2D + 聊天」桌面虛擬人，但**異棧**（Unity vs 我們的 Electron）。
- **分析（優點 / 限制）**：
  - 優點：① audio2face/blendshape 的**音訊驅動對嘴**正好點出我們「隨機嘴型」的優化方向；② Azure TTS 提供 viseme（嘴型）事件、zh-TW 自然；③ OpenCV 人臉偵測=「視覺感知」可能性。
  - 限制：Unity/C# 整套程式與我們架構不相容，無法直接重用；Azure 需 key、視覺感知較重。
- **決定**：🟡 部分採用（借概念）⛔ 程式不採用。
  - ★ **對嘴優化**：先做輕量版——用 `speechSynthesis` 的 `onboundary` 逐詞驅動嘴型（零相依、勝過隨機）；精準版（音量/viseme 驅動）需改用會回傳音訊的 TTS（Azure/OpenAI/Edge），列後續。
  - 🔭 Azure Speech 當 TTS provider、🔭 視覺感知（看著使用者）列觀望。
- **落實 / 後續**：對嘴 onboundary 輕量版（待你點頭即做）；音訊驅動對嘴與 Azure/視覺感知列 backlog。

### R13 — zoollcar/live2d-AI-chat · https://github.com/zoollcar/live2d-AI-chat ・ Demo https://live2d-ai-chat.hitorisama.org/
- **類型**：TypeScript 91.6% + **Tauri**（桌面殼）+ Vite/Tailwind 的 Live2D 聊天虛擬人；前端 WebLLM、**vits-web**（瀏覽器內 TTS）、Web Speech STT；後端 **node-edge-tts** proxy。可瀏覽器跑或接 OpenAI/Ollama。
- **與本專案關聯**：目前**最相近的同棧**參考（web 前端 + 桌面殼 + 後端 proxy；Tauri 之於它 ≈ Electron 之於我們）。功能清單高度重疊。
- **分析（優點 / 限制）**：
  - 優點：① ★ TTS 用**會回傳音訊**的 vits-web / Edge TTS——正好解開「瀏覽器內建 speechSynthesis 不吐音訊、無法音量對嘴」的限制；② 表情/動作隨回覆自動切換（emotion→expression）；③ 前端 WebLLM 再次印證離線大腦可行。
  - 限制：程式是 TS + Tauri（非我們 Electron + plain JS），直接複製不易；多數功能（STT/字幕/找話題/記憶）我們已有，且 STT 我們用 Whisper 更準。
- **決定**：🟡 部分採用（借關鍵概念，程式重寫）。
  - ★ **對嘴最佳路線（這個 repo 證實可行）**：改用會回傳音訊的 TTS（**Edge TTS 主行程、免 key** 或 **vits-web 瀏覽器離線**）→ renderer 以 `<audio>` + Web Audio `AnalyserNode` 取音量 → 驅動 `ParamMouthOpenY`。一次得到「更好聽語音 + 真正對嘴」。
  - 🟡 情緒→表情：依回覆情緒觸發 Live2D 表情/動作。
  - 🔭 WebLLM 離線大腦（同前）；🔭 Tauri 僅參考、不換殼。
- **落實 / 後續**：建議把「Edge TTS + 音量對嘴」當下一步主要優化；情緒→表情列次之。

### R14 — suzuran0y/Live2D-LLM-Chat · https://github.com/suzuran0y/Live2D-LLM-Chat
- **類型**：Python 96%（live2d-py + OpenGL）本地桌面虛擬人。ASR=SenseVoice、TTS=CosyVoice（zero-shot 聲音克隆）、LLM=OpenAI/DeepSeek/LM Studio。Apache-2.0。
- **與本專案關聯**：功能同類（Live2D+ASR+LLM+TTS+對嘴+記憶），但 Python 異棧、模型重，程式不可重用。
- **分析（優點 / 限制）**：
  - 優點：① 明確用「**分析 TTS 即時音量**」做對嘴（第三個指向同結論的專案）；② ★**自動眨眼 + 視線跟隨**——即使模型沒內建也程式化補上（前面沒出現過的新優化）；③ 記憶每 5 輪做摘要防脈絡爆量；④ 支援 LM Studio 本地 LLM（OpenAI 相容）。
  - 限制：SenseVoice/CosyVoice 為本地重模型（conda/Python），整合成本高。
- **決定**：🟡 部分採用（借概念，程式不採用）。
  - ★ **自動眨眼 + 視線跟隨**：純 renderer、零相依（驅動 ParamEyeLOpen/ParamEyeROpen 定時眨眼；ParamAngleX/Y 或 ParamEyeBallX/Y 跟隨游標）→ 馬上有生命感。**CP 值最高之一、建議優先**。
  - 🟡 音量對嘴（同 R13 路線，需會回傳音訊的 TTS）。
  - 🔭 記憶摘要（每 N 輪壓縮）；🔭 CosyVoice/SenseVoice 本地重模型。
  - ✅ **LM Studio**：免改——現有「雲端(OpenAI 相容)」provider 填 LM Studio 本機網址（如 `http://localhost:1234/v1`）即可，補 README 說明即可。
- **落實 / 後續**：自動眨眼+視線（輕量、建議下一步之一）；音量對嘴沿用 R13 規劃；記憶摘要與 LM Studio 文件列 backlog。

### R15 — evrstr/live2d-widget-models · https://github.com/evrstr/live2d-widget-models
- **類型**：給「live2d-widget（網頁右下角掛件，L2Dwidget.js）」用的 Live2D **模型素材庫**，經 jsDelivr CDN 取用（koharu、sagiri、natori、touma… 及多個遊戲角色）。**Cubism 2 格式（`model.json`）**。
- **與本專案關聯**：是「更多可換角色」的來源；不是程式架構。
- **分析（優點 / 限制）**：
  - 優點：模型多、CDN 直接可取，能大幅擴充「換角色」選擇。
  - 限制：① **格式是 Cubism 2（model.json）**，我們目前只載 Cubism 4 Core、角色掃描只認 `*.model3.json` → 這些模型現狀**載不進來**；② 多為**遊戲/動畫版權角色**素材，公開/商用有授權風險。
- **決定**：🟡 部分採用（角色來源 + 觸發優化）；程式不採用（網頁掛件/舊 runtime）。
  - ★ **優化機會：讓 VTube 支援 Cubism 2 模型** — 載入 cubism2 core + 改用 pixi-live2d-display 的 cubism2+4 合併 bundle，角色掃描多認 `model.json`。pixi-live2d-display 本來就同時支援 Cubism 2/4，屬可行小擴充，解鎖此庫與大量舊版模型。
  - ⚠️ **授權**：模型多為版權角色 → 僅個人本機用；維持 `knowledge.md`/模型 gitignore，勿推上 public。
- **落實 / 後續**：若要用這類模型，做「Cubism 2 支援」擴充（vendor 多加 cubism2 core + 合併 bundle + 掃描器認 model.json）；否則維持只用 Cubism 4。

### R16 — Eikanya/Live2d-model · https://github.com/Eikanya/Live2d-model
- **類型**：業界最大宗的 **Live2D 模型封存庫**之一，上千個來自各遊戲/App 的模型，**混合 Cubism 2（`model.json`）與 Cubism 3/4（`*.model3.json`）**。
- **與本專案關聯**：最大宗的「換角色」素材來源（同 R15 性質、規模更大、格式混合）。
- **分析（優點 / 限制）**：
  - 優點：量極大、涵蓋廣；其中 **Cubism 4 子集（`*.model3.json`）用我們現有設定即可直接載入**（丟進 `assets/live2d/<角色>/` 就會被掃描、出現在下拉）。
  - 限制：① Cubism 2 子集（`model.json`）目前載不進來，需 R15 的「Cubism 2 支援」優化；② 多為**遊戲擷取素材、版權屬原廠，僅供學習/個人**，公開/商用風險高；③ 整庫巨大，不宜 clone 全庫。
- **決定**：🟡 部分採用（角色來源）；無程式可採用。
  - ✅ 想換角色：從此庫挑 **Cubism 4** 模型整包放 `assets/live2d/<角色>/` 即可用。
  - ★ Cubism 2 模型 → 等做「Cubism 2 支援」優化（見 R15）。
  - ⚠️ 授權：僅個人本機用；維持模型 gitignore、勿上 public；**只下載需要的單一角色資料夾**（避免 clone 全庫）。
- **落實 / 後續**：同 R15——若要 Cubism 2 模型就做「Cubism 2 支援」；Cubism 4 模型即取即用。

### R17 — moeru-ai/airi（Project AIRI） · https://github.com/moeru-ai/airi ・ Demo https://airi.moeru.ai
- **類型**：規模較大的開源 AI VTuber（「重現 Neuro-sama」）。Vue/TS monorepo，瀏覽器 + Tauri 桌面 + 手機 PWA；Web 技術為主（WebGPU/WebAudio/WASM/WebWorker），桌面可用原生 CUDA/Metal。
- **與本專案關聯**：同類但更全面、更大；**幾乎驗證了我們整個優化 backlog**，並拆出可重用子套件。
- **分析（優點 / 限制）**：
  - 優點（直接對照我們）：① **Live2D & VRM 都做了 Auto blink / Auto look at / Idle eye movement**（= R14 我建議的最高 CP 優化，獲頂級專案背書）；② Mouth 用 ElevenLabs（會回傳音訊的 TTS）→ 真對嘴（同 R13/R14）；③ client-side STT + talking detection（VAD）→ hands-free/打斷；④ 瀏覽器內 DuckDB WASM/pglite + memory-pgvector → 向量記憶；⑤ 透過 `xsai` 接 20+ LLM 供應商。
  - 可重用子專案（@proj-airi）：**`unspeech`**（/audio/transcriptions + /audio/speech 統一 proxy，ASR/TTS 版 LiteLLM）、**Live2D utilities**（眨眼/看向/待機眼動）、**webai-realtime-voice-chat**（VAD+STT+LLM+TTS 完整範例）、**memory-pgvector / drizzle-duckdb-wasm**（瀏覽器向量 DB）。
  - 限制：整套是大型 Vue/TS monorepo，與我們輕量 Electron + plain JS 不同，不宜整包採用。
- **決定**：🟡 部分採用（借概念 + 視需要用其子套件）。
  - ★ 立即印證並提升優先序：**自動眨眼 + 視線跟隨 + 待機眼動**（純前端、零相依，建議下一步先做）。
  - 🟡 真對嘴：會回傳音訊的 TTS（Edge TTS / vits-web / ElevenLabs）；統一多家可參考 `unspeech`。
  - 🔭 向量記憶（memory-pgvector）、VAD hands-free（webai-realtime-voice-chat）、VRM 3D。
- **落實 / 後續**：先做自動眨眼/視線/待機眼動；TTS/記憶/VAD 升級時回看 AIRI 對應子套件當參考實作。

### R18 — stevenjoezhang/live2d-widget · https://github.com/stevenjoezhang/live2d-widget
- **類型**：經典網頁「看板娘」掛件（一行 script 即可在部落格嵌入 Live2D）。TypeScript，除 Cubism Core 外無其他執行期相依。**本身不接 LLM**，部署模型是「嵌入網頁」而非獨立桌面 app。
- **與本專案關聯**：定位不同（網頁掛件 vs 桌面助手），不整包採用；但有兩處實作概念可借鏡。
- **分析（可借鏡 / 限制）**：
  - ★ **Cubism 2 + Cubism 3/5 依模型版本動態載入對應 Core**：為相容新舊模型，偵測版本後動態載入對應 core 並減少體積——正好是我們 backlog「Cubism 2 支援」的現成解法樣板。
  - 🟡 **`waifu-tips.json`（觸發條件→顯示文字）**：滑鼠經過/閒置時跳小對話泡泡。CSS selector 觸發是網頁專屬不適用桌面；可採用的是「**待機隨機台詞 / 情境提示**」這個低成本加個性的概念。
  - 次要：drag 拖曳、showToggleAfterQuit（關閉後重新喚起鈕）、工具按鈕（一言/截圖/切換）、`model_list.json`+`textures.cache` 換裝（我們已用資料夾掃描換角色）。
  - 附帶模型來源：`zenghongtu/live2d-model-assets`（同 R15/R16 性質，個人本機用）。
  - **⚠️ 授權限制**：本專案為 **GPL-3.0**，與本專案 **MIT 不相容**。**僅可借鏡概念、嚴禁複製其原始碼**，以免污染授權。
- **決定**：🟡 部分採用（借概念、不抄碼）。
  - 🔭 做「Cubism 2 支援」時，參考其「偵測版本→動態載 core」思路（自行用 MIT 相容方式重寫）。
  - 🔭 待機/情境台詞：可在 renderer 加「閒置隨機一句」當輕量個性功能。
- **落實 / 後續**：兩項都列入 backlog 觀望；實作一律自寫，不取其 GPL 程式碼。

### R19 — Ikaros-521/AI-Vtuber（Luna AI） · https://github.com/Ikaros-521/AI-Vtuber
- **類型**：Python（3.10+）、主打**直播彈幕互動**的整合型 AI Vtuber——接 B站/抖音/快手/視頻號/鬥魚/淘寶/YouTube/Twitch/TikTok 等平台彈幕，邊聊邊 TTS 邊播；也可本地對話。整合海量 LLM 與 TTS/變聲/數位人後端。
- **與本專案關聯**：定位差異大（直播看板娘 vs 個人桌面助手）、語言不同（Python）、且授權受限；不採用程式碼。README 為功能整合清單、無架構細節，分析停在功能目錄層級。
- **分析（可借鏡 / 限制）**：
  - 印證：超長 **TTS 清單**（Edge-TTS、GPT-SoVITS、CosyVoice、ChatTTS、fish-speech、MeloTTS、Azure TTS…）再次證實「會回傳音訊的 TTS」是對嘴關鍵，**Edge-TTS 反覆出現＝免費好接的務實首選**（同 R13/R17）。
  - 印證：超長 **LLM 供應商清單**——我們「OpenAI 相容 + Ollama」抽象層已能涵蓋多數；結構上無新東西。
  - 🔭 新方向 **多模態「看螢幕」**（Gemini/glm-4v 擷取電腦畫面分析講解）：讓助手看螢幕再回答，對個人助手實用，記為未來選項。
  - 🔭 新方向 **直播彈幕模式**：若未來想把助手變直播看板娘可參考；超出目前個人助手範圍。
  - ⛔ 變聲（so-vits-svc/DDSP-SVC）、Stable Diffusion 出圖、數位人對嘴後端（Wav2Lip/SadTalker/MuseTalk/GeneFace++…）皆超出輕量 2D 範圍。
  - **⚠️ 授權限制**：宣告「個人免費、**商用抽成 10%、需授權**」，非標準寬鬆開源。**僅個人非商用參考、不抄碼**。
- **決定**：🟡 部分採用（借概念、個人非商用、不抄碼）。
  - ✅ 強化既有結論：TTS 升級就選 Edge-TTS。
  - 🔭 backlog 新增（觀望）：多模態看螢幕、直播彈幕模式。
- **落實 / 後續**：兩個新方向列入 backlog 觀望；TTS 方向更確定走 Edge-TTS。

### R20 — zenghongtu/PPet · https://github.com/zenghongtu/PPet
- **類型**：**Electron** 做的跨平台桌面 Live2D 桌寵（Mac/Win/Linux）。MIT 授權。約 2020（v1.2.1），偏舊、走 Cubism 2（用 fghrsh/live2d_api + 魔改自 stevenjoezhang/live2d-widget）。
- **與本專案關聯**：**目前所有參考中與我們架構最接近**（同為 Electron 桌面浮窗 Live2D）。它的「桌寵桌面整合」完整，正補我們目前所缺。
- **分析（可借鏡 / 限制）**：
  - ★ **點擊穿透（忽略點擊）**：桌寵招牌功能，滑鼠點擊可穿過角色到後面程式。Electron `setIgnoreMouseEvents(true,{forward:true})`，CP 值極高，我們目前沒有。
  - ✅ **系統托盤 icon**：托盤顯示/隱藏/結束（藏窗時必備）。
  - ✅ **開機自啟**：`app.setLoginItemSettings`，簡單。
  - 🟡 **線上 Model 由網址直接載入**（貼 GitHub raw 即載，不必下載）。
  - 🟡 鍵盤快捷：按住 Alt 移動、Ctrl +/-/0 縮放。
  - 🟡 **插件中心**（如 take-a-rest 休息提醒）：可擴充但對我們範圍可能過度設計（依 senior 原則先不做），觀望。
  - 附帶模型來源：xiazeyu/live2d-widget-models、xiaoski/live2d_models_collection、QiShaoXuan/live2DModel（同 R15/R16 性質）。
  - **⚠️ 授權微妙**：PPet 宣告 MIT，但自承「部分碼魔改自 GPL-3 的 stevenjoezhang/live2d-widget」→其 Live2D 渲染碼可能帶 GPL 污染。安全做法：**只借非 Live2D 的 Electron 桌面整合概念並自行重寫**，Live2D 部分不取其碼。
- **決定**：🟡 部分採用（同棧、概念可借鏡；Live2D 部分自寫避 GPL）。
  - ✅ backlog 新增「桌寵桌面整合」一組（近期最實用、與 Live2D 動畫優化互補）：★點擊穿透 → 托盤 → 開機自啟 → URL 載入模型。
- **落實 / 後續**：這組桌面整合（尤其點擊穿透）建議排進近期；改 `main.js`（BrowserWindow/Tray/loginItem/ipc）+ renderer 小幅調整，皆可自寫、不取其碼。

### R21 — guansss/pixi-live2d-display · https://github.com/guansss/pixi-live2d-display
- **類型**：**本專案正在使用的 Live2D 渲染函式庫**（PixiJS v6 的 Live2D 整合）。MIT。支援 **Cubism 2/3/4 全版本**。
- **與本專案關聯**：不是「要不要採用」，而是「**有沒有用滿**」。讀 README 後發現前面幾項 backlog 的成本被高估。
- **重大發現（改寫成本估計）**：
  - ★ **Cubism 2 支援＝幾乎免費，且不必碰 GPL**：函式庫本身支援 Cubism 2/3/4，提供各版 bundle。要支援 Cubism 2 只需改用 `index.js`（合併版）或加 `cubism2.js`+`live2d.min.js`。→ **直接用現有函式庫即可，無需借 R18(live2d-widget, GPL) 的碼**。此結論取代 R18 對 Cubism 2 的建議。
  - ★ **視線跟隨＝內建**：README 明列「Automatic interactions: **focusing**, hit-testing」。註冊 InteractionManager 後角色自動把視線/頭轉向游標，並有 `model.focus(x,y)` API。→ 視線跟隨多半是「**啟用既有功能**」而非從零實作。
  - ✅ **hit-testing 點擊互動**：`model.on('hit', a => model.motion('tap_body'))`，點身體/頭播動作，便宜討喜。
  - 🟡 **idle motion / expression API**（`model.motion()` / `model.expression()`）做待機動作；眨眼/呼吸通常 Cubism framework 內建（待 `live2d.js` 實測確認）。
  - 🟡 **從上傳檔/zip 載入（實驗性）**：可支援 R20「URL/壓縮包載入模型」。
  - 🟡 transform API（position/scale/rotation/anchor）對應縮放/移動快捷。
- **限制 / 注意**：以上依 README＋函式庫知識推論，**實作時須對本專案 `live2d.js` 實測確認**（senior 原則：驗證後才算數）。pixi v6、Cubism core 2.1/4 為前置需求。
- **決定**：✅ 已採用（且未用滿）→ 優先「啟用既有能力」勝過自寫。
  - 重新定價：視線跟隨、Cubism 2 皆降為「啟用/設定」級；自動眨眼大概率內建。
- **落實 / 後續**：動手「生動度」優化時，先試函式庫內建 focusing + hit + motion/expression，再決定要不要自寫待機眼動。
### R22 — Voine/ChatWaifu_Mobile · https://github.com/Voine/ChatWaifu_Mobile
- **類型**：**Android**（Kotlin / Jetpack Compose、Retrofit+MVVM+Room）ChatGPT 二次元聊天器。原生 C++ Live2D、端上 VITS-ncnn TTS、Sherpa-ncnn ASR、meta-lipSync、AIDL 跨進程。
- **與本專案關聯**：平台/語言皆不同（Android/Kotlin/native C++ vs Electron/JS），不抄碼；但有重要實戰教訓與少數概念可借鏡。
- **分析（可借鏡 / 限制）**：
  - ★ **對嘴實戰教訓**：接了專業 meta-lipSync（Oculus OVRLipSync）做精準對嘴，作者自承「時長同步/映射太麻煩，目前只播一個循環動畫」。→ **連認真做的人都放棄逐音素對嘴**。印證我們務實路線：用 **Web Audio 取音量→驅動 `ParamMouthOpenY` 張口幅度** 即可，**勿追逐音素完美對嘴**。做 Edge-TTS 對嘴時照此原則。
  - 🟡 **角色綁定人設**：每個模型各有內建設定、外部模型可填 External Setting。我們目前是單一 systemPrompt → 可改成**人設跟著選到的角色走**（換角色＝換語氣），便宜的 UX 升級。
  - 🔭 **離線 ASR（Sherpa）**：端上辨識、無需雲端。我們語音輸入目前必走雲端 Whisper；未來想去雲端依賴可考慮 sherpa-onnx。
  - 次要：VITS 為日語模型故先翻日文再唸（單語言語音模型才需）；多人 VITS speaker ID；資料夾命名規則（我們已資料夾掃描）。
  - **⚠️ 授權**：聲明「模型禁止商用」，程式碼授權 README 未明列 → 概念參考、不抄碼。
- **決定**：🟡 部分採用（借概念、跨平台不抄碼）。
  - ✅ 強化結論：對嘴用音量驅動張口即可，不做逐音素。
  - 🟡 backlog 新增：角色綁定人設（小而實用）。🔭 離線 ASR。
- **落實 / 後續**：對嘴項目維持「音量→張口」設計；可順手把 systemPrompt 改為可隨角色覆寫。
### R23 — fagenorn/handcrafted-persona-engine（Persona Engine） · https://github.com/fagenorn/handcrafted-persona-engine
- **類型**：成熟的 **Windows .NET 9 + NVIDIA CUDA** AI Live2D 角色全套件，偏直播（OBS/Spout）、需 N 卡、~16GB。ONNX Runtime 跑 ASR/TTS/RVC。內附已 rig 好的 Aria 模型。
- **與本專案關聯**：棧（.NET/CUDA）與規模都和我們（輕量 Electron）差很多，不抄碼；但功能成熟、文件完整，當「北極星」與點子來源極佳。
- **分析（可借鏡 / 限制）**：
  - ★ **新點子：LLM 輸出情緒標籤 `[EMOTION:😊]` → 觸發 Live2D 表情**。便宜、相容任何 OpenAI 相容模型（system prompt 指示模型標情緒），解析後呼叫 `model.expression()`/`motion()`，唸稿/顯示時去除標籤（擴充現有 `cleanForSpeech`）。配 R21 的 expression API → 低成本讓角色「有情緒」的高 CP 升級。
  - 清晰的 **11 階段 pipeline**（Listen→VAD→fast/accurate Whisper→可選 Vision context→LLM(+personality)→profanity→TTS→RVC→Animate(phoneme lipsync+emotion+idle)→Display→Loop）——可當參考架構。
  - 印證（非新）：**VAD+雙 Whisper+barge-in 打斷**（同 AIRI）、回合間**待機動畫**（R14/R21）、**personality 檔**＝角色綁定人設（R22）、**看螢幕 Vision**（R19）。
  - 超出範圍：VBridger/Audio2Face 高精度對嘴（我們照 R22 用單一張口參數）、RVC 變聲、Spout/OBS 串流、CUDA 重型 ASR/TTS、ML 髒話過濾（客服模式或許用得到 🔭）。
- **決定**：🟡 部分採用（成熟北極星、不抄碼）。
  - ★ backlog 新增（高 CP）：**情緒標籤→表情**（system prompt + 解析 + expression 映射 + 去標籤）。
  - 🔭 看螢幕、barge-in/VAD、ML 內容過濾（客服）。
- **落實 / 後續**：做「生動度」時把「情緒標籤→表情」和 R21 的 focusing/hit 一起評估；對嘴維持 R22 單參數張口。
### R24 — morettt/my-neuro · https://github.com/morettt/my-neuro （DeepWiki: deepwiki.com/morettt/my-neuro）
- **類型**：現代、活躍開發中的「打造專屬 AI 角色」工作台（預設角色「肥牛/fake neuro」）。**與我們同棧：Electron + `pixi-live2d-display`**（live-2d/main.js、js/、package-lock）。服務化（ASR/TTS/RAG 各自進程）、GPT-SoVITS TTS、MemOS 記憶、外掛系統、barge-in、看螢幕、遊戲陪玩、B站直播等。
- **與本專案關聯**：**目前最接近的「現代同棧」參考**（繼 PPet 之後第二個 Electron，且用我們完全相同的渲染庫）。程式碼結構對我們最有直接借鏡價值。
- **使用者特別關注：AI 唱歌（music 外掛）實作拆解**：
  - **曲庫**：`song-library/output/` 放現成音檔（.mp3/.wav/.m4a/.ogg）。
  - **LLM 工具**（function call）：`list_music_files` / `play_random_music` / `play_specific_music` / `stop_music`→ 讓 AI 自己決定唱不唱、唱哪首。
  - **唱歌動作**：`emotion_actions.json` 映射——`動作13→singing.motion3.json`（唱歌姿勢）、`動作11/12→micon/micoff`（麥克風）。
  - **對嘴**：播音檔用音量驅動嘴型（同 TTS，呼應 R22）。
  - **⚠️ 期待管理**：真正「角色聲音在唱歌」是**離線預製**音檔（GPT-SoVITS/RVC 翻唱/語音轉換，那筆贊助多半做此 pipeline），**非 app 內即時生成**。對我們：app 端簡單（曲庫+工具+動作+對嘴，現有 agent 工具呼叫＋對嘴可直接做）＋ 需**自備已唱好的音檔**。
- **通用架構洞見**：唱歌／音效庫／表情皆同一模式——「**LLM 函式呼叫工具 → 觸發本地媒體/動作**」。我們已有 tool-calling，加這類能力是同一條路。
- **其他可借鏡**：
  - ✅ **emotion→motion 用 `emotion_actions.json` 設定檔**對應（可與 R23 情緒標籤合用；同棧＝做法可直接參考）。
  - ✅ **SFX 音效庫**：模型自己決定播哪個音效（同唱歌模式的工具）。
  - 🟡 外掛架構、note 外掛（顯式長期記憶 record/search/read）、web 搜尋（Tavily，同我們）。
  - ⚠️ 授權 README 未明列 → 借概念可，**抄碼前先確認 license**。
- **決定**：🟡 部分採用（同棧、概念與做法可借鏡）。
  - 🔭 backlog 新增「**才藝/媒體工具**」一類（高趣味）：唱歌（曲庫+工具+唱歌動作+對嘴）、音效庫。皆走「LLM 工具→觸發本地媒體/動作」。
  - ✅ 與既有「情緒標籤→表情(R23)」「啟用 focusing/hit(R21)」整合成「生動度＋才藝」一包。
- **落實 / 後續**：唱歌可作為一個獨立、好玩的里程碑：在 agent 加 4 個音樂工具 + 一個 song 資料夾 +（有的話）唱歌動作 + 既有對嘴；真唱聲音檔由使用者離線備齊。實作前走 QODA 確認範圍。
### R25 — galnetwen/Live2D · https://github.com/galnetwen/Live2D
- **類型**：很舊（2017–2018）、**Cubism 2 時代**的部落格「看板娘」掛件，源自 imjad.cn（貓與向日葵）部落格——即 **R18（stevenjoezhang/live2d-widget）的更早祖先**。用 `loadlive2d()`、`message.json` 滑鼠提示、一言 API、隱藏鈕、改 `model.json` 換裝。
- **與本專案關聯**：技術上**沒有 R18 以外的新東西**，且更舊（僅 Cubism 2）；定位是網頁掛件。
- **分析**：
  - 🟡 唯一增量：**點擊/觸摸角色→隨機俏皮台詞**（click 事件那串台詞）→ 可接我們 **R21 hit-testing**：點身體除了播動作，再隨機講一句，零成本加個性。
  - ⛔ `message.json` mouseover 提示是網頁 CSS selector 專屬，不適用桌面（同 R18）。
  - 已有對應：隱藏鈕（我們托盤/最小化）、換裝＝改 model.json（我們資料夾換角色）。
  - **⚠️**：程式碼出自部落格、授權未明列；示範模型自手遊解包、**版權所屬不可用**。
- **決定**：⛔ 大致不採用（僅「觸摸台詞」概念可順手併入 R21）。
- **落實 / 後續**：做 hit-testing 點擊互動時，順手加「隨機台詞」即可；其餘略過。
### R26 — imuncle/live2d · https://github.com/imuncle/live2d
- **類型**：Live2D **模型收集庫**（128 個：102 Cubism2 ＋ 40 碧藍航線 Cubism3）＋ 陽春靜態展示頁。性質同 R15/R16（模型來源）。
- **與本專案關聯**：技術上無新東西。
- **分析**：
  - ⛔ 載入方式：Cubism2 用舊 `loadlive2d()`、Cubism3 用改自 AzurLaneL2DViewer 的 loader——**皆已被我們在用的 `pixi-live2d-display`（R21，原生 Cubism 2/3/4）取代且更佳**。
  - 🟡 唯一用處：**又一個模型素材來源**（個人、非商用；版權歸原公司）。順帶指向：梦象 mx-model、summerscar/live2dDemo、EYHN/hexo-helper-live2d。
- **決定**：⛔ 大致不採用（僅當模型素材來源備查，個人非商用）。
- **落實 / 後續**：需要模型時可來此找；程式面略過。
### R27 — timi-liuliang/echo · https://github.com/timi-liuliang/echo
- **類型**：**通用遊戲引擎**（C++/Lua、Vulkan/Metal、PBR、即時光追、2D/3D、多平台、Node 樹、Shader 編輯器）。MIT。Live2D 僅是 echo-examples 的一個展示範例。
- **與本專案關聯**：類別完全不同——通用遊戲引擎 vs 輕量 Electron 桌面助手。棧（C++/Lua）、規模、目的皆相差太遠。
- **分析**：
  - ⛔ 用遊戲引擎做我們的需求＝嚴重過度工程（違反 senior「簡單優先、最小範圍」）。
  - 僅沾邊：證明 Live2D 可整合進 Node 樹引擎；MIT。對我們無可借鏡具體項目。
  - 極邊緣概念（僅記錄、不採用）：Node/NodeTree 場景模型；Timeline animate-everything + Channel References 響應式屬性綁定——優雅但遠超範圍。
- **決定**：⛔ 不採用（類別不符、超出範圍）。
- **落實 / 後續**：無。
### R28 — Dreamer-Paul/Pio · https://github.com/Dreamer-Paul/Pio
- **類型**：**Typecho 部落格外掛**，在部落格換 Live2D 看板娘模型（本地或外鏈）。基於 journey-ad/live2d_src。**GPL-2.0**。
- **與本專案關聯**：同 R18/R25/R26（網頁/部落格看板娘類），且綁 Typecho（PHP CMS）。
- **分析**：
  - ⛔ 平台不符（Typecho PHP 外掛）、技術無新東西。
  - **⚠️ GPL-2.0**：與本專案 MIT 不相容，不可抄碼（同 R18 雷點）。
  - 🟡 僅沾邊：又指向模型素材站「梦象 mx.paul.ren」（R20/R26 已提）。
- **決定**：⛔ 大致不採用。
- **落實 / 後續**：無；需模型時梦象可備查。
### R29 — JoeyBling/hexo-theme-yilia-plus · https://github.com/JoeyBling/hexo-theme-yilia-plus
- **類型**：**Hexo 部落格主題**（litten/yilia 的升級 fork）。Live2D 只是其 26 項功能之一，且用舊的 `JoeyBling/live2d-widget.js`（Cubism2 時代 autoload widget，不如我們的 pixi-live2d-display R21）。
- **與本專案關聯**：類別不符（部落格主題 vs 桌面 AI 助手）。功能多為部落格專用（訪問統計、評論、網易雲音樂、RSS、字數統計…）。
- **分析**：
  - ⛔ 主體與我們無關；Live2D 整合方式落後於 R21。
  - 🔭 唯一沾邊：幾個**通用網頁小特效**（與 Live2D 無關）可選擇性移植當零成本個性裝飾——點擊小紅心、飄雪特效、文字輸入特效(activate-power-mode)。優先序很低、非必要。
  - Live2D 設定區塊（位置/寬高/偏移/透明度/行動縮放）我們已有對應，無新東西。
- **決定**：⛔ 大致不採用（僅 🔭 記下「點擊愛心/飄雪」等可有可無的裝飾特效）。
- **落實 / 後續**：若想加節慶氛圍/趣味，可考慮這類純前端特效；否則略過。
### R30 — jofizcd/Soul-of-Waifu · https://github.com/jofizcd/Soul-of-Waifu
- **類型**：成熟的 **Python（Windows）AI 角色扮演桌面 app**，GPL-3。Live2D/VRM/靜態頭像、本地 LLM(llama.cpp GGUF + HF 內建下載)+雲端(CharacterAI/Mistral/OpenAI/OpenRouter)、即時語音(Silero VAD+Faster Whisper、全雙工可打斷、對嘴)、28 情緒、桌面透明陪伴模式、向量 RAG 記憶+自動摘要、世界書 lorebook、角色卡 V2、環境音、角色 Gateway(CharacterAI/Chub 匯入)。
- **與本專案關聯**：成熟但 **RP/waifu 取向（強調無審查/NSFW）**，棧不同(Python)、GPL-3。與我們重疊的多是「讓角色活起來」基礎設施，已captured。
- **分析**：
  - 再次印證（非新）：桌面透明模式(R20/R23)、barge-in+VAD(R17/R23)、對嘴(R22)、情緒→表情(R23/R24)、向量記憶+自動摘要(R24 藍圖 a/b/c)、本地GGUF+雲端 OpenAI 相容(我們抽象層)。
  - ★ **新概念（SillyTavern 生態）**：**角色卡 V2 標準(PNG 內嵌/JSON)** ＋ **世界書 lorebook(關鍵字觸發世界設定，含 cooldown/duration/機率/邏輯排除)**。對我們：(a) 可支援匯入標準角色卡→一鍵套人設+頭像；(b) lorebook「關鍵字觸發→注入對應背景」是比純關鍵字評分更可控的 KB/記憶檢索模式，值得借。
  - 🔭 其他：User Persona(使用者人設, 同 R22 反向)、環境音 loop(氛圍)、角色 Gateway(生態匯入, 超範圍)。
  - **⚠️ GPL-3**：與 MIT 不相容，借概念、不抄碼。
- **決定**：🟡 部分採用（借「角色卡/lorebook」概念）。
  - 🔭 backlog：角色卡匯入(互通)、lorebook 式關鍵字觸發情境注入(KB 升級選項)。
- **落實 / 後續**：KB/記憶若要升級檢索智慧度，可參考 lorebook 關鍵字觸發 + 既有向量方向(R24)。RP/NSFW 功能不納入。
### R31 — P1kaj1uu/ChattyPlay-Agent · https://github.com/P1kaj1uu/ChattyPlay-Agent
- **類型**：大型**多功能聚合 web 站**（React+TS+Vite+Tailwind+Hono，Apache-2.0）：音樂/影視解析、黃金 K 線、動漫漫畫、HF 論文、思維導圖、ChatGPT、文生圖、LaTeX 編輯、閒魚助手、MCP/Agent…。**Live2D 看板娘只是 v4.0 的小裝飾**。
- **與本專案關聯**：類別完全不符（工具聚合入口網站 vs 桌面 AI 助手）。Live2D 純裝飾。
- **分析**：
  - ⛔ 無可借鏡的具體項目；主體功能與我們無關。
  - 🔭 僅沾邊（通用 web 實作、非 Live2D 專屬、多半已有）：EventStream 串流可中斷+會話匯出、語音聊天+朗讀(reconfirm)、i18n 多語介面（未來想做 EN/JP 介面可參考）。
- **決定**：⛔ 大致不採用（類別不符）。
- **落實 / 後續**：無。
## 附：業界方案參考（由方案比對得出，詳見 `docs/comparison-voice-ai-solutions.md`）
- WebLLM（mlc-ai）、OpenAI Realtime（gpt-realtime）、Amica（VRM 3D）、Open-LLM-VTuber、awesome-ai-vtubers、faster-whisper / sherpa-onnx / Piper（離線語音）。

---

## 新增資料範本（複製貼上後填寫）

```
### R# — 名稱 · 連結
- **類型**：
- **與本專案關聯**：
- **分析**（優點 / 限制）：
- **決定**：✅/🟡/⛔/🔭 — 一句理由
- **落實 / 後續**：
```
（同時在「速查表」加一列。）


---

## 未來發展藍圖（以 R24 my-neuro 同棧深入解析為對照）

> 來源：DeepWiki 深入解析 my-neuro 的四大子系統（情緒動畫 / 主動對話 / 外掛架構 / 五層記憶）。my-neuro 與本專案**同棧（Electron + pixi-live2d-display）**，故其做法對我們有直接參考價值。以下逐項對照「它怎麼做 / 我們現況 / 建議」。僅為藍圖規劃，實作一律走 QODA。

### 一、生動度：情緒→動作/表情（近期、低成本、高 CP）
- **它怎麼做**：LLM 回覆內嵌情緒標籤（如 `<開心>`），由 `EmotionMotionMapper`/`EmotionExpressionMapper` 依 `emotion_actions.json`（**每角色一組映射**：情緒→`.motion3.json` 陣列／表情）觸發；並與 TTS 同步（唸到該句才觸發），唱歌＝特殊動作 `singing.motion3.json`。
- **我們現況**：只有對嘴，無表情/動作系統。
- **建議**：✅ 近期做。新增 `emotion_actions.json`（角色→情緒→動作）＋ system prompt 指示模型標情緒（呼應 R23）＋ renderer 解析標籤→`model.motion()/expression()`＋唸稿去標籤（擴充 `cleanForSpeech`）。可與 R21「啟用 focusing 視線跟隨 + hit 點擊互動」一起做成「生動度」一包。

### 二、主動對話（中期；先做簡單版）
- **它怎麼做**：兩套——`AutoChatModule`（閒置 N 秒→主動發話，可選自動截圖）；`MoodChatModule`（心情分數 0–100 動態調整主動頻率：>90 每5秒、>80 每30秒、>60 每60秒、≤60 靜默；初始心情由 AI 日記/記憶評估）。皆走同一條 `sendToLLM()` 管線。
- **我們現況**：純被動問答。
- **建議**：🟡 先做 **AutoChat 簡單版**（閒置計時器→送一則 prompt 主動講話；任何互動重置計時）。MoodChat（情緒狀態機）較大、需記憶/日記支撐，先觀望。

### 三、五層記憶（中期升級路線）
- **它怎麼做**：①短期對話滑動視窗（+可選 `context-compressor` 用次級 LLM 摘要舊輪，而非直接丟棄）②MemOS 語意向量記憶（獨立服務、相似度檢索 top-k、累積緩衝批次寫入）③RAG 文件檢索（qdrant 向量＋bm25 混合、支援 PDF/MD）④扁平核心記憶（BERT 判斷是否「值得記」→次級 LLM 產生摘要→寫檔→組 prompt 時前置）⑤AI 日記（閒置時 LLM 摘要當日）。
- **我們現況**：關鍵字檢索 `memory.jsonl`（同 KB 的 tokenize 評分）＋ 知識庫 `knowledge.md`。
- **建議**（漸進）：🟡(a) **上下文壓縮**：長對話用一次 LLM 摘要舊輪（便宜、立即改善長談）。🟡(b) **向量檢索**取代關鍵字（先用 embeddings + 餘弦，免上獨立服務）。🟡(c) **「是否值得記」判斷**：用一次輕量 LLM 判斷取代 BERT。🔭(d) AI 日記（趣味、需主動對話/記憶基礎）。

### 四、外掛架構（中期；勿過早引入）
- **它怎麼做**：`PluginManager` 掃描 `built-in/` 與 `community/`，用 `enabled_plugins.json` 白名單啟用；每外掛一個 `metadata.json`（`lang` 決定走 JS `require` 或 Python 子進程 JSON-RPC 橋）；生命週期 `onInit/onStart/onStop/onDestroy`＋**熱重載**（清 require 快取）；`PluginContext` 提供 `registerTool()`/`showSubtitle()`/`triggerEmotion()`/`config`；外掛可註冊 function-calling 工具供 LLM 調用；hook 可攔截/改寫訊息流。
- **我們現況**：功能寫死在 main/agent/renderer，無外掛層。
- **建議**：🔭 中期。**現在做是過度設計**（senior 原則）。但可**先借思路**：把新能力（唱歌、音效、看螢幕…）都實作成「**agent 可呼叫的工具**」，介面統一；等工具多到雜亂，再抽出 PluginManager。雙語言（JS+Python 橋）只有在要跑本地重型推理時才需要。

### 五、進階／長期（觀望）
- **barge-in 打斷**：ASR 偵測到語音→`ttsProcessor.interrupt()` 停播清佇列。我們語音是「錄音→送出」，要做 hands-free/打斷屬中大型改動。🟡/🔭
- **看螢幕/視覺**：`ScreenshotManager` ＋ BERT 判斷「何時需要視覺」＋多模態模型分析畫面（同 R19/R23）。需多模態 LLM。🔭
- **事件匯流排**：`USER_MESSAGE_RECEIVED`/`TTS_START`/`TTS_END`/`INTERACTION_UPDATED` 等事件解耦各模組。架構演進時參考。🔭
- **桌面控制/程式碼執行**：keyboard/mouse/code-executor（pyautogui／執行 Python）。強大但**安全風險高**，個人助手要謹慎。🔭
- **其他**：B站直播彈幕、遊戲陪玩（Minecraft/galgame）、行動 App、教學模式——皆超出目前個人桌面助手範圍。🔭

### 建議優先序（整合全部參考 R1–R24）
1. **桌寵桌面整合**（R20）：點擊穿透＋托盤＋開機自啟 — 純 `main.js`、最有感。
2. **生動度一包**（R21+R23+R24）：啟用 focusing 視線跟隨＋hit 點擊互動＋情緒標籤→動作/表情。
3. **Edge-TTS 音量對嘴**（R13/R17/R19/R22）＋角色綁定人設（R22）。
4. **才藝里程碑：唱歌**（R24）：agent 加點歌工具＋播放＋對嘴＋（有的話）唱歌動作；音檔離線自備。
5. **記憶升級**（R24）：上下文壓縮 → 向量檢索。
6. **主動對話 AutoChat 簡單版**（R24）。
7. Cubism 2 支援＝改 bundle（R21）。
8. 觀望：外掛化、barge-in、看螢幕、AI 日記/心情狀態機。
