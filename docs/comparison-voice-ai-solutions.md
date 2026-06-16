# 語音 AI 助手方案比對（含可參考的優良解決方案）

> 比較對象：本專案 VTube（Electron 桌面）、ai-avatar-bot（網頁 WebLLM）、及業界其他優良方案。
> 日期：2026-06-17

## 逐元件比對

| 元件 | VTube 現況（本專案） | ai-avatar-bot（網頁） | 其他優良方案（值得參考） |
|---|---|---|---|
| 大腦 LLM | Ollama(本機) / OpenAI 相容(雲端)，跑在主行程 | WebLLM：瀏覽器 WebGPU 跑本機 LLM、OpenAI 相容、零金鑰 | **WebLLM (mlc-ai)** — 真能在 Electron renderer 跑的離線 LLM（自帶模型、不靠 Google，與 Gemini Nano 不同）。function-calling 仍 WIP |
| 聽 STT | 雲端 Whisper(/audio/transcriptions) | 瀏覽器語音辨識（實際送 Google 雲端） | faster-whisper / sherpa-onnx（真離線）；OpenAI Realtime(gpt-realtime) 串流語音 |
| 說 TTS | 瀏覽器內建語音合成 | Edge TTS 經輕量 proxy | Piper(離線、輕、品質佳)；OpenAI TTS；Edge TTS |
| 對嘴 | 講話時隨機嘴型 | 即時對嘴 | **音量驅動對嘴**（Web Audio AnalyserNode 取音量 → ParamMouthOpenY） |
| 角色 | Live2D (pixi-live2d-display) | Live2D | VRM 3D（Amica / three-vrm）+ 情緒→表情 |
| 檢索/記憶 | web_search 工具 + 本地關鍵字記憶 + 知識庫客服 | knowledge.js（RAG 檢索） | 向量檢索升級、Personal AI Memory |
| 互動模式 | 點 🎤 錄音、再點結束 | 按鈕觸發 | hands-free（VAD）+ 打斷(barge-in)：Open-LLM-VTuber / Pipecat / LiveKit Agents / OpenAI Realtime |
| 部署 | Electron 桌面 .exe | 一行 <script> 嵌任何網站 | 桌面 vs 網頁嵌入，各有取捨 |

## 最值得借鏡進 VTube（依 CP 值）

1. 音量驅動對嘴（最快最有感、零相依）：用 Web Audio AnalyserNode 把 TTS 即時音量映射到 ParamMouthOpenY。
2. WebLLM 當第三個 LLM provider（真離線、Electron 真的跑得起來）：代價是首次下載模型、需 WebGPU、function-calling 受限。
3. hands-free + 打斷：VAD 自動偵測說話、開口即停嘴；體驗最像真人，但工程較重。
4. 真離線語音：faster-whisper / sherpa-onnx（聽）+ Piper（說），完全不靠雲端。
5. VRM 3D 角色（Amica）：升 3D + 情緒表情的參考架構。

## 參考清單與來源
- WebLLM: https://github.com/mlc-ai/web-llm ・ https://webllm.mlc.ai/docs/
- OpenAI Realtime(gpt-realtime): https://openai.com/index/introducing-gpt-realtime/
- Amica(VRM 3D): https://github.com/semperai/amica
- Open-LLM-VTuber: https://github.com/Open-LLM-VTuber/Open-LLM-VTuber
- awesome-ai-vtubers: https://github.com/proj-airi/awesome-ai-vtubers
