const path = require('path');
const fs = require('fs');

// 預設設定。第一次執行會以此為基礎，使用者於設定面板修改後存到 userData/config.json。
const DEFAULTS = {
  provider: 'ollama', // 'ollama' | 'openai'
  ollama: {
    baseUrl: 'http://localhost:11434',
    model: 'qwen2.5'
  },
  openai: {
    // 任何 OpenAI 相容端點皆可：OpenAI、Gemini(OpenAI 相容)、本地相容服務…
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o-mini'
  },
  search: {
    provider: 'duckduckgo', // 'duckduckgo'(免 key) | 'tavily'(需 key)
    tavilyApiKey: '',
    maxResults: 5
  },
  webSearchEnabled: true,
  // 目前選用的 Live2D 角色（指向某個 *.model3.json，路徑相對於內建伺服器根目錄）
  character: '/assets/live2d/hiyori/Hiyori.model3.json',
  systemPrompt:
    '你是一個友善、簡潔的桌面虛擬助手，名字叫小桶（Hiyori）。一律用繁體中文（台灣用語）回答。' +
    '當問題牽涉最新資訊、時事、或你不確定的事實時，先呼叫 web_search 工具查找，再根據結果回答，' +
    '並在答案末尾以 [編號] 標註對應來源。回答盡量精簡、口語、像在跟朋友聊天。'
};

function isObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

function deepMerge(base, override) {
  const out = Array.isArray(base) ? base.slice() : { ...base };
  if (!isObject(override)) return out;
  for (const key of Object.keys(override)) {
    if (isObject(base[key]) && isObject(override[key])) {
      out[key] = deepMerge(base[key], override[key]);
    } else {
      out[key] = override[key];
    }
  }
  return out;
}

// 取得設定檔路徑。打包後存 userData；開發時若取不到（例如純 Node 測試）則退回專案根目錄。
function configPath() {
  try {
    const { app } = require('electron');
    return path.join(app.getPath('userData'), 'config.json');
  } catch (_e) {
    return path.join(__dirname, '..', '..', 'config.json');
  }
}

function loadConfig() {
  let cfg = JSON.parse(JSON.stringify(DEFAULTS));
  try {
    const p = configPath();
    if (fs.existsSync(p)) {
      const saved = JSON.parse(fs.readFileSync(p, 'utf-8'));
      cfg = deepMerge(cfg, saved);
    }
  } catch (_e) {
    /* 壞掉的設定檔就用預設 */
  }
  return cfg;
}

function saveConfig(partial) {
  const cfg = deepMerge(loadConfig(), partial || {});
  const p = configPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(cfg, null, 2), 'utf-8');
  return cfg;
}

module.exports = { DEFAULTS, deepMerge, loadConfig, saveConfig };
