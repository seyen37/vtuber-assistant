const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { loadConfig, saveConfig } = require('./config');
const { runAgent } = require('./agent');

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
  try {
    const result = await runAgent(history, cfg, (status) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('chat:status', status);
      }
    });
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
        const name = path.relative(baseDir, full).split(path.sep)[0]; // 角色資料夾名
        out.push({ name, path: rel });
      }
    }
  }
  walk(baseDir);
  return out;
}

ipcMain.handle('live2d:list', () => listCharacters());

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
