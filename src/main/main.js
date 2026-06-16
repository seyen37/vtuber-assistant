const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { loadConfig, saveConfig } = require('./config');
const { runAgent } = require('./agent');
const { transcribe } = require('./asr');
const memory = require('./memory');
const kb = require('./kb');

// 專案根目錄（src/main/ 往上兩層）。打包後 __dirname 位於 app.asar 內，路徑仍正確。
const ROOT = path.join(__dirname, '..', '..');

let mainWindow = null;
let server = null;
let serverPort = 0;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.moc3': 'application/octet-stream',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg'
};

// 本機靜態檔伺服器：避免 file:// 協定下 Live2D 資產 fetch 受限的問題。
function startServer() {
  return new Promise((resolve, reject) => {
    server = http.createServer((req, res) => {
      try {
        const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
        const rel = urlPath === '/' ? '/src/renderer/index.html' : urlPath;
        const filePath = path.normalize(path.join(ROOT, rel));
        if (!filePath.startsWith(ROOT)) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }
        fs.readFile(filePath, (err, data) => {
          if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
          }
          const ext = path.extname(filePath).toLowerCase();
          res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
          res.end(data);
        });
      } catch (e) {
        res.writeHead(500);
        res.end('Server error');
      }
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      serverPort = server.address().port;
      resolve(serverPort);
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 380,
    height: 660,
    minWidth: 300,
    minHeight: 420,
    frame: false,
    transparent: true,
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadURL('http://127.0.0.1:' + serverPort + '/src/renderer/index.html');

  // 來源連結用系統預設瀏覽器開啟，而不是在 app 內開新視窗
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  // 麥克風權限（語音輸入需要）：本機桌面 app，放行媒體權限
  mainWindow.webContents.session.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(true);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await startServer();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (server) try { server.close(); } catch (_e) {}
  if (process.platform !== 'darwin') app.quit();
});

// ---- IPC ----
ipcMain.handle('config:get', () => loadConfig());
ipcMain.handle('config:save', (_e, cfg) => saveConfig(cfg));

ipcMain.handle('chat:send', async (_e, payload) => {
  const cfg = loadConfig();
  const history = (payload && payload.history) || [];
  // 依最後一則使用者訊息，注入「知識庫客服」與「本地記憶」脈絡（皆為額外 system 訊息）
  const lastUser = [...history].reverse().find((m) => m.role === 'user');
  const pre = [];
  if (lastUser && cfg.kb && cfg.kb.enabled) {
    try {
      const block = kb.formatKbBlock(kb.retrieve(cfg, lastUser.content));
      const instr = cfg.kb.strict
        ? '你現在是客服助理。請「只根據下方知識庫內容」回答使用者問題；若知識庫沒有相關資訊，請禮貌說明目前查不到、建議聯絡真人客服，切勿自行編造或臆測。'
        : '你是客服助理，請優先依下方知識庫內容回答；知識庫未涵蓋的部分可補充一般說明，但要清楚標示那並非來自知識庫。';
      pre.push({ role: 'system', content: instr + (block ? ('\n\n' + block) : '\n\n（目前知識庫沒有找到相關內容）') });
    } catch (_e) {}
  }
  if (lastUser && cfg.memory && cfg.memory.enabled) {
    try {
      const block = memory.formatMemoryBlock(memory.recall(cfg, lastUser.content));
      if (block) pre.push({ role: 'system', content: block });
    } catch (_e) {}
  }
  const augmented = pre.length ? [...pre, ...history] : history;
  try {
    const result = await runAgent(augmented, cfg, (status) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('chat:status', status);
      }
    });
    // 成功後把這一輪存進記憶
    if (cfg.memory && cfg.memory.enabled && lastUser) {
      try {
        memory.appendMemory(cfg, [
          { role: 'user', text: lastUser.content },
          { role: 'assistant', text: result.content }
        ]);
      } catch (_e) {}
    }
    return { ok: true, content: result.content, sources: result.sources };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
});

// 掃描 assets/live2d 下所有角色（找 *.model3.json，含子資料夾如 runtime/）
function listCharacters() {
  const baseDir = path.join(ROOT, 'assets', 'live2d');
  const out = [];
  function walk(dir) {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (_e) {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(full);
      } else if (e.name.toLowerCase().endsWith('.model3.json')) {
        const rel = '/' + path.relative(ROOT, full).split(path.sep).join('/');
        // 有些角色資料夾內含多個 *.model3.json（如 nito_ja 有 5 個、epsilon/miku 有 free/pro）。
        // 用「資料夾名 / 模型檔名」當顯示名稱，避免同名重複；單一模型則只顯示資料夾名。
        const folder = path.relative(baseDir, full).split(path.sep)[0];
        const stem = e.name.replace(/\.model3\.json$/i, '');
        const name = stem.toLowerCase() === folder.toLowerCase() ? folder : folder + ' / ' + stem;
        out.push({ name, path: rel });
      }
    }
  }
  walk(baseDir);
  return out;
}

ipcMain.handle('live2d:list', () => listCharacters());

// 本地記憶：清除 / 統計
ipcMain.handle('memory:clear', () => memory.clearMemory());
ipcMain.handle('memory:stats', () => memory.stats());
ipcMain.handle('kb:stats', () => kb.stats(loadConfig()));

// 語音輸入：把 renderer 錄到的音訊轉成文字（OpenAI 相容轉寫端點）
ipcMain.handle('asr:transcribe', async (_e, payload) => {
  const cfg = loadConfig();
  try {
    const r = await transcribe(cfg, payload || {});
    return { ok: true, text: r.text };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
});

// 列出本機 Ollama 已安裝的模型，讓使用者用下拉選而不用手打
ipcMain.handle('ollama:tags', async (_e, baseUrl) => {
  try {
    const url = String(baseUrl || 'http://localhost:11434').replace(/\/+$/, '') + '/api/tags';
    const res = await fetch(url);
    if (!res.ok) return { ok: false, error: 'HTTP ' + res.status, models: [] };
    const data = await res.json();
    return { ok: true, models: (data.models || []).map((m) => m.name) };
  } catch (e) {
    return { ok: false, error: String((e && e.message) || e), models: [] };
  }
});

ipcMain.on('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});
ipcMain.on('window:close', () => {
  if (mainWindow) mainWindow.close();
});
