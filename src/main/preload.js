const { contextBridge, ipcRenderer } = require('electron');

// 安全地把有限的 API 暴露給 renderer（不開放 nodeIntegration）
contextBridge.exposeInMainWorld('api', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: (cfg) => ipcRenderer.invoke('config:save', cfg),
  sendMessage: (payload) => ipcRenderer.invoke('chat:send', payload),
  listCharacters: () => ipcRenderer.invoke('live2d:list'),
  listOllamaModels: (baseUrl) => ipcRenderer.invoke('ollama:tags', baseUrl),
  transcribe: (payload) => ipcRenderer.invoke('asr:transcribe', payload),
  synthesizeTTS: (payload) => ipcRenderer.invoke('tts:synthesize', payload),
  clearMemory: () => ipcRenderer.invoke('memory:clear'),
  memoryStats: () => ipcRenderer.invoke('memory:stats'),
  kbStats: () => ipcRenderer.invoke('kb:stats'),
  // 桌面/桌寵整合
  getDesktop: () => ipcRenderer.invoke('desktop:get'),
  setDesktop: (partial) => ipcRenderer.invoke('desktop:set', partial),
  onStatus: (cb) => ipcRenderer.on('chat:status', (_e, s) => cb(s)),
  onOpenSettings: (cb) => ipcRenderer.on('ui:open-settings', () => cb()),
  minimize: () => ipcRenderer.send('window:minimize'),
  close: () => ipcRenderer.send('window:close')
});
