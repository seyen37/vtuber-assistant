const { contextBridge, ipcRenderer } = require('electron');

// 安全地把有限的 API 暴露給 renderer（不開放 nodeIntegration）
contextBridge.exposeInMainWorld('api', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: (cfg) => ipcRenderer.invoke('config:save', cfg),
  sendMessage: (payload) => ipcRenderer.invoke('chat:send', payload),
  listCharacters: () => ipcRenderer.invoke('live2d:list'),
  listOllamaModels: (baseUrl) => ipcRenderer.invoke('ollama:tags', baseUrl),
  onStatus: (cb) => ipcRenderer.on('chat:status', (_e, s) => cb(s)),
  minimize: () => ipcRenderer.send('window:minimize'),
  close: () => ipcRenderer.send('window:close')
});
