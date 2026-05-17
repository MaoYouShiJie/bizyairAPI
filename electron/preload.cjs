// preload.js - 安全桥接上下文
const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  quit: () => require('electron').app.quit(),
});
