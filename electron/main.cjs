const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const http = require('http');



let mainWindow;
let electronServer;
let userDataPath;

// ── 创建 Electron 窗口 ──────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 650,
    title: 'BizyAir API 工具',
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    show: false,
    backgroundColor: '#0f172a',
  });

  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          `default-src 'self'; ` +
          `script-src 'self' 'unsafe-inline'${process.env.ELECTRON_PROD ? '' : ` 'unsafe-eval'`}; ` +
          `style-src 'self' 'unsafe-inline'; ` +
          `img-src 'self' data: https://*.aliyuncs.com; ` +
          `media-src 'self' https://*.aliyuncs.com; ` +
          `connect-src 'self' https://*.aliyuncs.com ws://localhost:5173; ` +
          `font-src 'self' data:`
        ]
      }
    });
  });

  mainWindow.loadURL('http://localhost:30000').catch(err => {
    // If page load fails, show anyway with an error page
    mainWindow.loadURL(`data:text/html,<h2>Error loading app: ${err.message}</h2>`);
    mainWindow.show();
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith('http://localhost')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── 生产模式：Electron 内置 HTTP 服务器（代理后端+静态前端）──
function startElectronServer(up) {
  return new Promise((resolve) => {
    const distDir = path.join(__dirname, '..', 'dist');
    const outputDir = path.join(up, '输出');
    const uploadsDir = path.join(up, 'uploads');
    const backgroundsDir = path.join(up, 'backgrounds');
    const iconsDir = path.join(__dirname, '..', 'icons');

    electronServer = http.createServer((req, res) => {
      const url = req.url.split('?')[0];

      // ── API 代理到后端 ──────────────────────────────────────────
      if (url.startsWith('/api')) {
        const options = {
          hostname: 'localhost',
          port: 3003,
          path: req.url,
          method: req.method,
          headers: { ...req.headers, host: 'localhost:3003' },
        };
        const proxyReq = http.request(options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res, { end: true });
        });
        proxyReq.on('error', (err) => {
          console.error('Proxy error:', err.message);
          res.writeHead(502);
          res.end('Backend unavailable');
        });
        req.pipe(proxyReq, { end: true });
        return;
      }

      // ── 输出目录 ────────────────────────────────────────────────
      if (url.startsWith('/%E8%BE%93%E5%87%BA') || url.startsWith('/输出')) {
        const decoded = url.startsWith('/%E8%BE%93%E5%87%BA') ? decodeURIComponent(url) : url;
        const filePath = decoded.replace(/^\/\u8F93\u51FA/, '');
        serveStaticFile(path.join(outputDir, filePath), req, res);
        return;
      }

      // ── 静态资源路径映射 ──────────────────────────────────────
      const staticPaths = [
        ['/uploads', uploadsDir],
        ['/backgrounds', backgroundsDir],
        ['/icons', iconsDir],
      ];
      for (const [prefix, dir] of staticPaths) {
        if (url.startsWith(prefix)) {
          serveStaticFile(path.join(dir, url.slice(prefix.length)), req, res);
          return;
        }
      }

      // ── 前端 dist 静态文件 ─────────────────────────────────────
      const ext = path.extname(url);
      if (ext && ext !== '/') {
        serveStaticFile(path.join(distDir, url), req, res);
        return;
      }

      // SPA fallback: index.html
      serveStaticFile(path.join(distDir, 'index.html'), req, res);
    });

    electronServer.listen(30000, () => {
      console.log('BizyAir Electron server running on http://localhost:30000');
      resolve();
    });

    electronServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log('Port 30000 in use, trying 30001...');
        electronServer.listen(30001, resolve);
      }
    });
  });
}

function serveStaticFile(filePath, req, res) {
  const fs = require('fs');
  const urlPath = require('url').parse(req.url).pathname;
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.m4v': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.flac': 'audio/flac',
    '.aac': 'audio/aac',
    '.opus': 'audio/opus',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.csv': 'text/csv',
    '.log': 'text/plain',
  };

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found: ' + urlPath);
      return;
    }
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

// ── 关闭清理 ───────────────────────────────────────────────────────
function cleanup() {
  if (electronServer) electronServer.close();
  app.quit();
}

// ── 启动 ───────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  if (app.isPackaged) {
    userDataPath = path.dirname(process.execPath);
  } else {
    userDataPath = path.join(__dirname, '..');
  }
  if (!require('fs').existsSync(userDataPath)) {
    require('fs').mkdirSync(userDataPath, { recursive: true });
  }
  console.log('User data path:', userDataPath);

  // 首次运行：从安装目录复制默认配置和数据到 exe 同级目录
  ['apps.json', 'apps_new.json', 'config.json', 'apikey.json'].forEach(file => {
    const src = path.join(__dirname, '..', file);
    const dst = path.join(userDataPath, file);
    if (!require('fs').existsSync(dst) && require('fs').existsSync(src)) {
      require('fs').copyFileSync(src, dst);
      console.log('Copied default', file, 'to', dst);
    }
  });
  // 复制 apikey_new.json（用户自定义 key，只复制已存在的文件）
  const srcApiNew = path.join(__dirname, '..', 'apikey_new.json');
  const dstApiNew = path.join(userDataPath, 'apikey_new.json');
  if (require('fs').existsSync(srcApiNew) && !require('fs').existsSync(dstApiNew)) {
    require('fs').copyFileSync(srcApiNew, dstApiNew);
    console.log('Copied apikey_new.json to', dstApiNew);
  }
  // 复制 backgrounds 目录（只复制不存在的文件）
  const srcBg = path.join(__dirname, '..', 'backgrounds');
  const dstBg = path.join(userDataPath, 'backgrounds');
  if (require('fs').existsSync(srcBg)) {
    if (!require('fs').existsSync(dstBg)) require('fs').mkdirSync(dstBg, { recursive: true });
    require('fs').readdirSync(srcBg).forEach(f => {
      const d = path.join(dstBg, f);
      if (!require('fs').existsSync(d)) {
        require('fs').copyFileSync(path.join(srcBg, f), d);
        console.log('Copied backgrounds/' + f);
      }
    });
  }

  const isProd = app.isPackaged || process.env.ELECTRON_PROD;
  if (isProd) {
    // 直接加载后端（同一进程），传入用户数据目录
    let backendPath = path.join(__dirname, '..', 'backend', 'server.cjs');
    if (!require('fs').existsSync(backendPath)) backendPath = path.join(__dirname, '..', 'backend', 'server.js');
    console.log('Loading backend from:', backendPath);
    const mod = require(backendPath);
    const startServer = mod.startServer || mod;
    startServer({ userDataPath });

    // 短暂等待后端启动
    await new Promise(r => setTimeout(r, 2000));
    await startElectronServer(userDataPath);
    createWindow();

    // ELECTRON_PROD 环境下按 F12 打开 DevTools 方便调试
    if (process.env.ELECTRON_PROD && mainWindow) {
      mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F12') {
          mainWindow.webContents.toggleDevTools();
        }
      });
    }
  }
});

app.on('window-all-closed', cleanup);
app.on('before-quit', cleanup);
