const { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage, globalShortcut } = require('electron');
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
const ICON_PATH = path.join(ROOT, 'assets', 'icon.png');

let mainWindow = null;
let tray = null;
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
  const cfg = loadConfig();
  const desktop = cfg.desktop || {};
  mainWindow = new BrowserWindow({
    width: 380,
    height: 660,
    minWidth: 300,
    minHeight: 420,
    frame: false,
    transparent: true,
    resizable: true,
    alwaysOnTop: desktop.alwaysOnTop !== false,
    skipTaskbar: false,
    icon: fs.existsSync(ICON_PATH) ? ICON_PATH : undefined,
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

  // 開機時套用持久化的點擊穿透設定（置頂於建立視窗時已套用）
  mainWindow.webContents.once('did-finish-load', () => {
    applyClickThrough(!!desktop.clickThrough);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ---- 桌面/桌寵整合 ----
function applyAlwaysOnTop(on) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setAlwaysOnTop(!!on);
}

// 點擊穿透：滑鼠點擊穿過角色落到後面的程式。forward:true 仍轉發滑鼠移動，
// 讓 Live2D 視線跟隨之類仍可運作。穿透開啟時無法點到本視窗，故一律提供
// 系統托盤選單與全域快捷鍵（預設 Ctrl/Cmd+Alt+Shift+P）切回，避免「點不回來」。
function applyClickThrough(on) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setIgnoreMouseEvents(!!on, { forward: true });
  }
}

function applyAutoLaunch(on) {
  try {
    app.setLoginItemSettings({ openAtLogin: !!on });
  } catch (_e) {
    /* 某些平台/打包方式可能不支援，忽略 */
  }
}

// 統一入口：套用 + 持久化 + 更新托盤勾選狀態
function setDesktop(partial) {
  const cur = (loadConfig().desktop) || {};
  const p = partial || {};
  const next = Object.assign({}, cur, p);
  if ('alwaysOnTop' in p) applyAlwaysOnTop(next.alwaysOnTop);
  if ('clickThrough' in p) applyClickThrough(next.clickThrough);
  if ('autoLaunch' in p) applyAutoLaunch(next.autoLaunch);
  saveConfig({ desktop: next });
  updateTrayMenu();
  return next;
}

function showWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function toggleWindowVisible() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isVisible() && !mainWindow.isMinimized()) mainWindow.hide();
  else showWindow();
}

function toggleClickThrough() {
  const cur = (loadConfig().desktop) || {};
  setDesktop({ clickThrough: !cur.clickThrough });
}

// 切換點擊穿透的全域快捷鍵：依序嘗試候選組合，註冊成功的第一個才生效。
// 避免與 Windows/輸入法/顯卡既有快捷鍵衝突（例如 Ctrl+Alt+L 常被即時字幕/Intel 佔用）。
// 註：托盤選單的「點擊穿透」勾選為主要切回路徑，快捷鍵僅為備援。
const TOGGLE_HOTKEYS = [
  'CommandOrControl+Alt+Shift+P',
  'CommandOrControl+Alt+Shift+O',
  'CommandOrControl+Shift+F9'
];
let activeToggleHotkey = null;
function registerToggleHotkey() {
  for (const acc of TOGGLE_HOTKEYS) {
    try {
      if (globalShortcut.register(acc, toggleClickThrough)) { activeToggleHotkey = acc; break; }
    } catch (_e) {}
  }
  console.log('[hotkey] 點擊穿透切換鍵 =', activeToggleHotkey || '(無法註冊，請用托盤選單)');
}

function buildTrayMenu() {
  const d = (loadConfig().desktop) || {};
  return Menu.buildFromTemplate([
    { label: '顯示 / 隱藏', click: toggleWindowVisible },
    { type: 'separator' },
    { label: '點擊穿透（滑鼠穿過角色）', type: 'checkbox', checked: !!d.clickThrough, click: (mi) => setDesktop({ clickThrough: mi.checked }) },
    { label: '視窗置頂', type: 'checkbox', checked: d.alwaysOnTop !== false, click: (mi) => setDesktop({ alwaysOnTop: mi.checked }) },
    { label: '開機時自動啟動', type: 'checkbox', checked: !!d.autoLaunch, click: (mi) => setDesktop({ autoLaunch: mi.checked }) },
    { type: 'separator' },
    { label: '開啟設定…', click: () => { showWindow(); if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('ui:open-settings'); } },
    { label: '結束', click: () => { app.quit(); } }
  ]);
}

function updateTrayMenu() {
  if (tray && !tray.isDestroyed()) tray.setContextMenu(buildTrayMenu());
}

function createTray() {
  try {
    let img = nativeImage.createFromPath(ICON_PATH);
    if (img.isEmpty()) img = nativeImage.createEmpty();
    tray = new Tray(img);
    tray.setToolTip('桌面助手');
    tray.setContextMenu(buildTrayMenu());
    // 左鍵點托盤圖示：切換顯示/隱藏
    tray.on('click', toggleWindowVisible);
  } catch (e) {
    console.error('[tray] 建立失敗', e);
  }
}

app.whenReady().then(async () => {
  await startServer();
  createWindow();

  // 套用開機自啟（依設定）；建立托盤；註冊全域快捷鍵切換點擊穿透
  const d = (loadConfig().desktop) || {};
  applyAutoLaunch(!!d.autoLaunch);
  createTray();
  registerToggleHotkey();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (server) try { server.close(); } catch (_e) {}
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  try { globalShortcut.unregisterAll(); } catch (_e) {}
  if (tray && !tray.isDestroyed()) try { tray.destroy(); } catch (_e) {}
});

// ---- IPC ----
ipcMain.handle('config:get', () => loadConfig());
ipcMain.handle('config:save', (_e, cfg) => saveConfig(cfg));

// 桌面/桌寵設定：讀取目前值 / 套用並持久化
ipcMain.handle('desktop:get', () => (loadConfig().desktop) || {});
ipcMain.handle('desktop:set', (_e, partial) => setDesktop(partial || {}));

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
