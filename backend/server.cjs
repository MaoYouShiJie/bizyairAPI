const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const multer = require('multer');
const axios = require('axios');
try { require('dotenv').config(); } catch (e) { /* dotenv optional */ }

const app = express();
const PORT = process.env.PORT || 3003;

// ── 数据目录（用户持久化） ──────────────────────────────────────────
let dataDir = path.join(__dirname, '..'); // 默认：源码根目录

// 路径变量（在 startServer 中通过 reloadDataDirPaths 重新计算）
let configPath = path.join(dataDir, 'apps.json');
let configNewPath = path.join(dataDir, 'apps_new.json');
let uploadsDir = path.join(dataDir, 'uploads');
let bizConfigPath = path.join(dataDir, 'apikey.json');
let bizNewConfigPath = path.join(dataDir, 'apikey_new.json');
let settingsPath = path.join(dataDir, 'config.json');
let saveDir;
let CACHE_FILE;
let watchDir;
let watchTimer = null;
let THUMB_DIR;

function reloadDataDirPaths() {
  configPath = path.join(dataDir, 'apps.json');
  configNewPath = path.join(dataDir, 'apps_new.json');
  uploadsDir = path.join(dataDir, 'uploads');
  bizConfigPath = path.join(dataDir, 'apikey.json');
  bizNewConfigPath = path.join(dataDir, 'apikey_new.json');
  settingsPath = path.join(dataDir, 'config.json');
  saveDir = getSaveDir();
  CACHE_FILE = path.join(saveDir, '..', '.gallery-cache.json');
  watchDir = saveDir;
  THUMB_DIR = path.join(saveDir, '..', '.thumbcache');
}

function startServer(options = {}) {
  return new Promise((resolve) => {
    if (options.userDataPath) dataDir = options.userDataPath;
    const startPort = options.port || PORT;

    reloadDataDirPaths();

    // 确保用户数据目录存在
    const userDirs = [
      saveDir, path.join(dataDir, 'uploads'),
      THUMB_DIR, path.join(dataDir, 'backgrounds'),
    ];
    userDirs.forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    // 动态注册背景图和上传文件静态服务（使用 dataDir）
    app.use('/backgrounds', express.static(path.join(dataDir, 'backgrounds')));
    app.use('/uploads', express.static(path.join(dataDir, 'uploads')));

    function tryListen(port) {
      const server = app.listen(port, () => {
        console.log(`Backend server running on port ${port}`);
        console.log(`Data directory: ${dataDir}`);
        // 确保缓存和监听使用正确的 dataDir
        loadCache();
        if (fs.existsSync(watchDir)) {
          setupWatcher();
        }
        resolve({ port, server });
      });
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${port} in use, trying ${port + 1}`);
          server.close();
          tryListen(port + 1);
        } else {
          console.error('Server error:', err);
          resolve({ port: 0, server: null });
        }
      });
    }
    tryListen(startPort);
  });
}

// 自动启动：当直接 node server.js 运行时
// （Electron 打包版由 main.cjs 的 startServer() 启动，dev 模式由 startDev() spawn 启动）
if (require.main === module && !process.env.ELECTRON_PROD) {
  console.log('Starting backend directly via node server.js');
  startServer().then(({ port }) => console.log(`Backend started on port ${port}`));
}

module.exports = { startServer };

// ── 中间件 ──────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 输出目录的静态文件服务
app.use('/输出', (req, res, next) => {
  try {
    const decodedPath = decodeURIComponent(req.path);
    const filePath = path.join(saveDir, decodedPath);

    if (!filePath.startsWith(saveDir)) {
      return res.status(403).send('Forbidden');
    }

    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath, {
        acceptRanges: true,
        cacheControl: true,
        maxAge: '1h'
      });
    }
    next();
  } catch (err) {
    next();
  }
});

// 处理编码后的中文路径
app.get(/^\/%E8%BE%93%E5%87%BA\/(.*)/, (req, res, next) => {
  try {
    const encodedPath = req.params[0];
    const decodedPath = decodeURIComponent(encodedPath);
    const filePath = path.join(saveDir, decodedPath);

    if (!filePath.startsWith(saveDir)) {
      return res.status(403).send('Forbidden');
    }

    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath, {
        acceptRanges: true,
        cacheControl: true,
        maxAge: '1h'
      });
    }
    res.status(404).send('File not found');
  } catch (err) {
    next();
  }
});

// 文件上传配置
const upload = multer({ storage: multer.memoryStorage() });

// 文件路径
const examplesDir = path.join(__dirname, '..', '调用示例');
const iconsDir = path.join(__dirname, '..', 'icons');

// 确保资源目录存在
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

// 图标静态文件服务
app.use('/icons', express.static(iconsDir));

// 加载配置
function loadAppsConfig() {
  const base = { apps: [], settings: {}, version: '1.0.0' };
  // 读取内置 apps.json
  try {
    if (fs.existsSync(configPath)) {
      const builtin = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      base.apps = builtin.apps || [];
      base.settings = builtin.settings || {};
      base.version = builtin.version || '1.0.0';
    }
  } catch (err) {
    console.error('Failed to load config:', err);
  }
  // 读取用户 apps_new.json，按 id 去重（用户版本优先）
  try {
    if (fs.existsSync(configNewPath)) {
      const userData = JSON.parse(fs.readFileSync(configNewPath, 'utf8'));
      const userApps = userData.apps || [];
      const baseIds = new Set(base.apps.map(a => a.id));
      // 用户新增的应用
      for (const app of userApps) {
        const idx = base.apps.findIndex(a => a.id === app.id);
        if (idx >= 0) {
          base.apps[idx] = app; // 覆盖内置应用
        } else {
          base.apps.push(app);
        }
      }
    }
  } catch (err) {}
  return base;
}

// 保存配置（仅内置 apps.json）
function saveAppsConfig(config) {
  // 只写 apps 和 version，settings 由 config.json 管理
  fs.writeFileSync(configPath, JSON.stringify({ apps: config.apps, version: config.version || '1.0.0' }, null, 2), 'utf8');
}

// 保存用户应用到 apps_new.json
function saveUserApp(appData) {
  let userData = { apps: [] };
  try {
    if (fs.existsSync(configNewPath)) {
      userData = JSON.parse(fs.readFileSync(configNewPath, 'utf8'));
    }
  } catch (err) {}
  const idx = userData.apps.findIndex(a => a.id === appData.id);
  if (idx >= 0) {
    userData.apps[idx] = { ...userData.apps[idx], ...appData };
  } else {
    userData.apps.push(appData);
  }
  fs.writeFileSync(configNewPath, JSON.stringify(userData, null, 2), 'utf8');
}

// 从 apps_new.json 删除用户应用
function removeUserApp(appId) {
  try {
    if (fs.existsSync(configNewPath)) {
      const userData = JSON.parse(fs.readFileSync(configNewPath, 'utf8'));
      userData.apps = userData.apps.filter(a => a.id !== appId);
      fs.writeFileSync(configNewPath, JSON.stringify(userData, null, 2), 'utf8');
    }
  } catch (err) {}
}

// 从合并后的配置中加载应用的参数类型覆盖
function loadParameterTypes(appId) {
  try {
    if (appId) {
      const config = loadAppsConfig();
      const app = config.apps.find(a => a.id === appId);
      if (app && app.parameterTypeOverrides) {
        return app.parameterTypeOverrides;
      }
    }
  } catch (err) {}
  return {};
}

// 保存参数类型到 apps_new.json 中的应用条目
function saveParameterTypes(appId, types) {
  if (!appId) return;
  const config = loadAppsConfig();
  const app = config.apps.find(a => a.id === appId);
  if (app) {
    saveUserApp({ ...app, parameterTypeOverrides: types });
  }
}

// 获取当前 API Key
function getCurrentApiKey() {
  const config = loadAppsConfig();
  const configPath2 = path.join(dataDir, 'config.json');
  try {
    const bizConfig = JSON.parse(fs.readFileSync(configPath2, 'utf8'));
    if (bizConfig.apiKeys && bizConfig.currentKeyId) {
      const currentKey = bizConfig.apiKeys.find(k => k.id === bizConfig.currentKeyId);
      return currentKey ? currentKey.key : null;
    }
  } catch (err) {}
  return null;
}

// 初始化默认应用
function initializeDefaultApps() {
  const config = loadAppsConfig();
  
  if (config.apps.length === 0) {
    console.log('正在初始化默认应用...');
    
    const defaultApps = [];
    
    // 添加 API 工具应用
    defaultApps.push({
      id: 'app_api_tool',
      name: 'API 调用工具',
      web_app_id: 0,
      icon: '/logo001.png',
      iconBgColor: '#10b981',
      isApiTool: true,
      isDefault: true,
      createdAt: new Date().toISOString().split('T')[0]
    });
    
    // 扫描示例文件夹
    if (fs.existsSync(examplesDir)) {
      const walkDir = (dir) => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            walkDir(filePath);
          } else if (file.endsWith('.txt')) {
            try {
              const content = fs.readFileSync(filePath, 'utf8');
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              
              if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                const webAppId = data.web_app_id;
                const appName = path.basename(file, '.txt');
                
                // 生成唯一 ID
                const id = 'app_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                
                defaultApps.push({
                  id: id,
                  name: appName,
                  web_app_id: webAppId,
                  icon: null,
                  iconBgColor: '#6366f1',
                  exampleCode: content,
                  isDefault: true,
                  createdAt: new Date().toISOString().split('T')[0]
                });
                
                console.log(`  ✓ 添加应用: ${appName}`);
              }
            } catch (err) {
              console.error(`  ✗ 解析失败 ${file}:`, err.message);
            }
          }
        });
      };
      
      walkDir(examplesDir);
    }
    
    config.apps = defaultApps;
    saveAppsConfig(config);
    console.log(`初始化完成，共 ${defaultApps.length} 个应用`);
  }
}

// 启动时初始化
initializeDefaultApps();

// ============= API 路由 =============

// 1. 获取应用列表和设置
app.get('/api/apps', (req, res) => {
  const config = loadAppsConfig();
  const settings = loadSettings();
  res.json({ ...config, settings });
});

// 2. 添加应用
app.post('/api/apps', (req, res) => {
  try {
    const { name, exampleCode } = req.body;
    
    if (!exampleCode || typeof exampleCode !== 'string') {
      return res.status(400).json({ error: '缺少示例代码' });
    }
    
    const jsonText = extractJsonFromCode(exampleCode);
    if (!jsonText) {
      return res.status(400).json({ error: '示例代码中未找到有效的 JSON' });
    }
    
    const cleanJson = stripJsonComments(jsonText);
    const data = JSON.parse(cleanJson);
    
    const config = loadAppsConfig();
    
    const newApp = {
      id: 'app_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name: name,
      web_app_id: data.web_app_id,
      icon: null,
      iconBgColor: '#6366f1',
      exampleCode: exampleCode,
      isDefault: false,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    saveUserApp(newApp);
    
    res.json({ success: true, app: newApp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. 从文件添加应用
app.post('/api/apps/from-file', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const content = req.file.buffer.toString('utf8');
    const originalName = req.file.originalname;
    const appName = path.basename(originalName, '.txt');
    
    // 解析示例代码
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(400).json({ error: '无效的示例代码' });
    }
    
    const data = JSON.parse(jsonMatch[0]);
    
    const config = loadAppsConfig();
    
    const newApp = {
      id: 'app_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name: appName,
      web_app_id: data.web_app_id,
      icon: null,
      iconBgColor: '#6366f1',
      exampleCode: content,
      isDefault: false,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    saveUserApp(newApp);
    
    res.json({ success: true, app: newApp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= API Key 管理路由 =============

// 加载 BizyAir 配置（合并 apikey.json 模板 + apikey_new.json 用户自定义）
function loadBizConfig() {
  const configs = [];
  try {
    if (fs.existsSync(bizConfigPath)) {
      configs.push(JSON.parse(fs.readFileSync(bizConfigPath, 'utf8')));
    }
  } catch (err) {}
  try {
    if (fs.existsSync(bizNewConfigPath)) {
      configs.push(JSON.parse(fs.readFileSync(bizNewConfigPath, 'utf8')));
    }
  } catch (err) {}
  // 合并：后面的覆盖前面的
  return Object.assign({ apiKeys: [], currentKeyId: null }, ...configs);
}

// 保存 Bizyair 配置（写入 apikey_new.json，不影响 apikey.json 模板）
function saveBizConfig(config) {
  fs.writeFileSync(bizNewConfigPath, JSON.stringify(config, null, 2), 'utf8');
}

// 加载桌面设置
function loadSettings() {
  const bgPath = path.join(dataDir, 'backgrounds', 'backgrounds.jpg');
  const defaultBg = { backgroundImage: '/backgrounds/backgrounds.jpg', backgroundSize: 'cover' };
  try {
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      if (!settings.backgroundImage && fs.existsSync(bgPath)) {
        Object.assign(settings, defaultBg);
        saveSettings(settings);
      }
      return settings;
    }
  } catch (err) {}
  // 首次运行：设置默认背景
  if (fs.existsSync(bgPath)) {
    saveSettings(defaultBg);
    return { ...defaultBg };
  }
  return {};
}

// 保存桌面设置
function saveSettings(settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
}

function getSaveDir() {
  const settings = loadSettings();
  if (settings.saveDir && fs.existsSync(settings.saveDir)) {
    return settings.saveDir;
  }
  return path.join(dataDir, '输出');
}

// 更新 saveDir 并持久化
function setSaveDir(dir) {
  saveDir = dir;
  const settings = loadSettings();
  settings.saveDir = dir;
  saveSettings(settings);
}

// 获取当前 API Key
function getCurrentApiKey() {
  const config = loadBizConfig();
  if (!config.currentKeyId || !config.apiKeys) return null;
  const currentKey = config.apiKeys.find(k => k.id === config.currentKeyId);
  return currentKey ? currentKey.key : null;
}

// 获取当前任务使用的 API Key（支持自动切换）
function getTaskApiKey() {
  const bizConfig = loadBizConfig();
  const settings = loadSettings();
  
  if (!bizConfig.apiKeys || bizConfig.apiKeys.length === 0) return null;
  
  // 如果启用了自动切换
  if (settings.autoSwitch) {
    const idx = settings.autoSwitchIndex || 0;
    const key = bizConfig.apiKeys[idx % bizConfig.apiKeys.length];
    // 保存下一个索引
    settings.autoSwitchIndex = (idx + 1) % bizConfig.apiKeys.length;
    saveSettings(settings);
    return key ? key.key : null;
  }
  
  // 未启用自动切换，使用当前选中的 Key
  if (bizConfig.currentKeyId) {
    const currentKey = bizConfig.apiKeys.find(k => k.id === bizConfig.currentKeyId);
    return currentKey ? currentKey.key : null;
  }
  
  return bizConfig.apiKeys[0] ? bizConfig.apiKeys[0].key : null;
}

// 获取所有 API Key 列表
function getAllApiKeys() {
  const bizConfig = loadBizConfig();
  return bizConfig.apiKeys || [];
}

// 判断是否可自动换 key 重试的错误（key 级别问题，换 key 可解决）
function isRetryableBizyairError(err) {
  const status = err.response?.status;
  const bizCode = err.response?.data?.code;
  // HTTP 429（网关限流）或 402（余额不足）
  if (status === 429 || status === 402) return true;
  // BizyAir 业务错误码：排队上限、并行度上限、余额不足、节点不可用
  const retryableCodes = [
    20049, 20050, 20051,  // 余额不足
    30039,                // 达到最大排队数量
    30040,                // 达到最大并行度
    30015, 30016, 30018,  // 无可用节点
    50600, 50601, 50602, 50603, 50604, // 限流
  ];
  return retryableCodes.includes(bizCode);
}

// 1. 获取 API Key 列表
app.get('/api/config/keys', (req, res) => {
  const config = loadBizConfig();
  res.json({
    apiKeys: config.apiKeys || [],
    currentKeyId: config.currentKeyId
  });
});

// 2. 添加新 API Key
app.post('/api/config/keys', (req, res) => {
  try {
    const { name, key } = req.body;
    
    if (!name || !key) {
      return res.status(400).json({ error: '名称和 Key 不能为空' });
    }
    
    const config = loadBizConfig();
    
    const id = 'key_' + Date.now();
    const newKey = {
      id: id,
      name: name,
      key: key,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    if (!config.apiKeys) config.apiKeys = [];
    config.apiKeys.push(newKey);
    
    if (!config.currentKeyId) {
      config.currentKeyId = id;
    }
    
    saveBizConfig(config);
    
    res.json({
      success: true,
      key: { ...newKey, key: '***' + key.slice(-10) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. API Key 排序
app.put('/api/config/keys/order', (req, res) => {
  try {
    const { order } = req.body;
    const config = loadBizConfig();
    const keyMap = {};
    config.apiKeys.forEach(k => { keyMap[k.id] = k; });
    config.apiKeys = order.filter(id => keyMap[id]).map(id => keyMap[id]);
    saveBizConfig(config);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. 更新 API Key
app.put('/api/config/keys/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, key } = req.body;
    const config = loadBizConfig();
    
    const keyIndex = config.apiKeys.findIndex(k => k.id === id);
    if (keyIndex === -1) {
      return res.status(404).json({ error: 'API Key 不存在' });
    }
    
    if (name) config.apiKeys[keyIndex].name = name;
    if (key) config.apiKeys[keyIndex].key = key;
    
    saveBizConfig(config);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. 删除 API Key
app.delete('/api/config/keys/:id', (req, res) => {
  try {
    const { id } = req.params;
    const config = loadBizConfig();
    
    const keyIndex = config.apiKeys.findIndex(k => k.id === id);
    if (keyIndex === -1) {
      return res.status(404).json({ error: 'API Key 不存在' });
    }
    
    config.apiKeys.splice(keyIndex, 1);
    
    if (config.currentKeyId === id) {
      config.currentKeyId = config.apiKeys.length > 0 ? config.apiKeys[0].id : null;
    }
    
    saveBizConfig(config);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. 切换当前 API Key
app.post('/api/config/keys/:id/select', (req, res) => {
  try {
    const { id } = req.params;
    const config = loadBizConfig();
    
    const keyExists = config.apiKeys.some(k => k.id === id);
    if (!keyExists) {
      return res.status(404).json({ error: 'API Key 不存在' });
    }
    
    config.currentKeyId = id;
    saveBizConfig(config);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. 获取保存目录
app.get('/api/config/save-dir', (req, res) => {
  res.json({ saveDir });
});

// 7. 设置保存目录
app.put('/api/config/save-dir', (req, res) => {
  try {
    const { dir } = req.body;
    if (!dir) return res.status(400).json({ error: '缺少目录路径' });
    // 如果选择的目录下有输出子目录，就使用输出目录；否则直接用选择的路径
    const outputDir = path.join(dir, '输出');
    const effectiveDir = fs.existsSync(outputDir) ? outputDir : dir;
    setSaveDir(effectiveDir);
    reloadDataDirPaths();
    clearCache();
    res.json({ success: true, saveDir });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 查询 Balance（代理 BizyAir 钱包接口）
app.get('/api/balance', async (req, res) => {
  try {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: '缺少 API Key' });
    const response = await axios.get('https://api.bizyair.cn/y/v1/wallet', {
      headers: { 'Authorization': `Bearer ${key}` },
      timeout: 15000
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data?.message || err.message });
  }
});

// 4. 更新应用
app.put('/api/apps/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, iconBgColor, exampleCode, parameters } = req.body;
    
    const config = loadAppsConfig();
    const appIndex = config.apps.findIndex(a => a.id === id);
    
    if (appIndex === -1) {
      return res.status(404).json({ error: '应用不存在' });
    }
    
    const updatedApp = { ...config.apps[appIndex] };
    if (name) updatedApp.name = name;
    if (icon !== undefined) updatedApp.icon = icon;
    if (iconBgColor) updatedApp.iconBgColor = iconBgColor;
    if (exampleCode) {
      updatedApp.exampleCode = exampleCode;
      const jsonText = extractJsonFromCode(exampleCode);
      if (jsonText) {
        const data = JSON.parse(stripJsonComments(jsonText));
        updatedApp.web_app_id = data.web_app_id;
      }
    }
    if (parameters) updatedApp.parameters = parameters;
    
    saveUserApp(updatedApp);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. 删除应用
app.delete('/api/apps/:id', (req, res) => {
  try {
    const { id } = req.params;
    const config = loadAppsConfig();
    
    const app = config.apps.find(a => a.id === id);
    if (app && app.isDefault) {
      return res.status(400).json({ error: '默认应用不能卸载' });
    }
    
    removeUserApp(id);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. 保存设置
app.post('/api/apps/settings', (req, res) => {
  try {
    const newSettings = req.body;
    const existing = loadSettings();
    saveSettings({ ...existing, ...newSettings });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 保存应用排序
app.patch('/api/apps/order', (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'order 必须是数组' });
    }
    const config = loadAppsConfig();
    config.settings = config.settings || {};
    config.settings.appOrder = order;
    saveAppsConfig(config);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取参数类型库
app.get('/api/parameter-types', (req, res) => {
  try {
    const { appId } = req.query;
    const types = loadParameterTypes(appId);
    res.json(types);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 批量更新参数类型
app.put('/api/parameter-types', (req, res) => {
  try {
    const { types: newTypes, appId } = req.body;
    if (!newTypes || typeof newTypes !== 'object') {
      return res.status(400).json({ error: 'types object required' });
    }
    if (!appId) {
      return res.status(400).json({ error: 'appId required' });
    }
    const types = loadParameterTypes(appId);
    // 合并：新类型覆盖旧类型
    for (const [key, value] of Object.entries(newTypes)) {
      types[key] = value;
    }
    saveParameterTypes(appId, types);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新参数类型（单个参数）
app.put('/api/parameter-types/:key', (req, res) => {
  try {
    const { key } = req.params;
    const { type, options, appId } = req.body;
    if (!appId) {
      return res.status(400).json({ error: 'appId required' });
    }
    const types = loadParameterTypes(appId);
    
    if (options && Array.isArray(options) && options.length >= 2) {
      types[key] = { type: type || 'select', options };
    } else {
      types[key] = type || 'text';
    }
    
    saveParameterTypes(appId, types);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取已有背景图片列表
app.get('/api/apps/backgrounds', (req, res) => {
  try {
    const files = fs.readdirSync(path.join(dataDir, 'backgrounds'));
    const images = files
      .filter(f => /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(f))
      .map(f => ({
        name: f,
        url: `/backgrounds/${encodeURIComponent(f)}`,
        size: fs.statSync(path.join(path.join(dataDir, 'backgrounds'), f)).size
      }));
    res.json({ backgrounds: images });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. 上传背景图片
app.post('/api/apps/background', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const originalName = req.body.name || req.file.originalname;
    const fileSize = parseInt(req.body.size) || req.file.size;
    const ext = path.extname(originalName).toLowerCase();
    const baseName = path.basename(originalName, ext).replace(/[^\w\u4e00-\u9fa5-]/g, '_'); // 替换特殊字符
    
    // 检查是否已存在完全相同的文件（同名 + 同大小）
    const existingFiles = fs.readdirSync(path.join(dataDir, 'backgrounds'));
    const existingFile = existingFiles.find(f => {
      const fBaseName = path.basename(f, ext).replace(/[^\w\u4e00-\u9fa5-]/g, '_');
      if (fBaseName === baseName) {
        const existingStats = fs.statSync(path.join(path.join(dataDir, 'backgrounds'), f));
        return existingStats.size === fileSize;
      }
      return false;
    });
    
    let fileName;
    let url;
    
    if (existingFile) {
      // 文件已存在且内容相同，直接使用
      fileName = existingFile;
      url = `/backgrounds/${encodeURIComponent(fileName)}`;
      console.log(`[背景] 检测到已有相同文件，直接使用: ${fileName}`);
    } else {
      // 检查同名文件（可能不同内容）
      const sameNameFiles = existingFiles.filter(f => {
        const fBaseName = path.basename(f, ext).replace(/[^\w\u4e00-\u9fa5-]/g, '_');
        return fBaseName === baseName || fBaseName.startsWith(baseName + '_');
      });
      
      if (sameNameFiles.length > 0) {
        // 找到同名文件，检查内容是否相同
        const sameFile = sameNameFiles.find(f => {
          const existingStats = fs.statSync(path.join(path.join(dataDir, 'backgrounds'), f));
          return existingStats.size === fileSize;
        });
        
        if (sameFile) {
          fileName = sameFile;
        } else {
          // 同名但不同内容，添加副本后缀
          fileName = baseName + '_副本' + ext;
        }
      } else {
        fileName = baseName + ext;
      }
      
      const filePath = path.join(path.join(dataDir, 'backgrounds'), fileName);
      fs.writeFileSync(filePath, req.file.buffer);
      url = `/backgrounds/${encodeURIComponent(fileName)}`;
      console.log(`[背景] 上传新文件: ${fileName}`);
    }
    
    res.json({ success: true, url: url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. 上传应用图标
app.post('/api/apps/:id/icon', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { id } = req.params;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const fileName = id + ext;
    const filePath = path.join(iconsDir, fileName);
    
    fs.writeFileSync(filePath, req.file.buffer);
    
    const url = `/icons/${fileName}`;
    
    // 更新应用
    const config = loadAppsConfig();
    const app = config.apps.find(a => a.id === id);
    if (app) {
      app.icon = url;
      saveAppsConfig(config);
    }
    
    res.json({ success: true, url: url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. 通用文件上传
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const originalName = req.body.name || req.file.originalname;
    const ext = path.extname(originalName).toLowerCase();
    const baseName = path.basename(originalName, ext);
    
    // 使用原始文件名，同名文件直接覆盖
    const fileName = baseName + ext;
    const filePath = path.join(uploadsDir, fileName);
    
    fs.writeFileSync(filePath, req.file.buffer);
    
    const url = `/uploads/${encodeURIComponent(fileName)}`;
    
    res.json({ success: true, url: url, fileName: fileName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 图片代理（用于加载远程图片避免跨域问题）
app.get('/api/proxy-image', async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'stream',
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const contentType = response.headers['content-type'] || 'image/png';
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=3600');
    response.data.pipe(res);
  } catch (err) {
    console.error('图片代理失败:', imageUrl, err.message);
    res.status(502).json({ error: 'Failed to proxy image', detail: err.message });
  }
});

// ============= BizyAir API 路由 =============

// 从任意格式的代码中提取 JSON 对象（Shell / JavaScript / Python）
function extractJsonFromCode(content) {
  const webAppIdPos = content.indexOf('"web_app_id"');
  if (webAppIdPos === -1) return null;
  const jsonStart = content.lastIndexOf('{', webAppIdPos);
  if (jsonStart === -1) return null;
  let depth = 0, jsonEnd = -1;
  for (let i = jsonStart; i < content.length; i++) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') {
      depth--;
      if (depth === 0) { jsonEnd = i; break; }
    }
  }
  if (jsonEnd === -1) return null;
  let extracted = content.substring(jsonStart, jsonEnd + 1);
  // 将 Python 风格的 True/False/None 转换为 JSON 格式
  extracted = extracted.replace(/(?::\s*)True\b/g, ': true').replace(/(?::\s*)False\b/g, ': false').replace(/(?::\s*)None\b/g, ': null');
  return extracted;
}

// 解析示例
app.post('/api/parse-example', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const content = req.file.buffer.toString('utf8');
    const jsonText = extractJsonFromCode(content);
    
    if (!jsonText) {
      return res.status(400).json({ error: '无效的示例代码' });
    }
    
    // 先提取注释中的枚举选项，再移除注释后解析 JSON
    const cleanJson = stripJsonComments(jsonText);
    const data = JSON.parse(cleanJson);
    const parameters = buildParameters(data, content, req.query.appId);
    
    res.json({
      web_app_id: data.web_app_id,
      parameters: parameters
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 直接解析 JSON 代码
app.post('/api/parse-example-direct', upload.single('file'), (req, res) => {
  try {
    const content = req.file.buffer.toString('utf8');
    const jsonText = extractJsonFromCode(content);
    
    if (!jsonText) {
      return res.status(400).json({ error: '无效的示例代码' });
    }
    
    // 先提取注释中的枚举选项，再移除注释后解析 JSON
    const cleanJson = stripJsonComments(jsonText);
    const data = JSON.parse(cleanJson);
    const parameters = buildParameters(data, content, req.query.appId);
    
    res.json({
      web_app_id: data.web_app_id,
      parameters: parameters
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 运行任务（自动重试：key 级别错误时换 key）
app.post('/api/run-task', async (req, res) => {
  const { web_app_id, input_values } = req.body;
  const allKeys = getAllApiKeys();
  
  if (allKeys.length === 0) {
    return res.status(400).json({ error: '请先配置 API Key' });
  }
  
  // 确定起始 key 索引
  const bizConfig = loadBizConfig();
  const settings = loadSettings();
  let startIdx;
  if (settings.autoSwitch) {
    startIdx = settings.autoSwitchIndex || 0;
  } else {
    const curIdx = bizConfig.currentKeyId ? allKeys.findIndex(k => k.id === bizConfig.currentKeyId) : -1;
    startIdx = curIdx >= 0 ? curIdx : 0;
  }
  
  // 处理 input_values 中的本地文件路径，转成 base64 data URL（与 key 无关，只做一次）
  const processedValues = {};
  for (const [key, value] of Object.entries(input_values || {})) {
    if (typeof value === 'string' && value.startsWith('/uploads/')) {
      const filePath = path.join(dataDir, decodeURIComponent(value));
      if (fs.existsSync(filePath)) {
        const fileBuffer = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase().replace('.', '');
        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
        const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'wma'];
        let mimeType;
        if (imageExts.includes(ext)) {
          mimeType = ext === 'jpg' ? 'jpeg' : ext;
          processedValues[key] = `data:image/${mimeType};base64,${fileBuffer.toString('base64')}`;
          console.log(`🖼️ 参数 [${key}]: 图片转 base64 (${(fileBuffer.length / 1024).toFixed(1)}KB)`);
        } else if (audioExts.includes(ext)) {
          mimeType = ext === 'mp3' ? 'mpeg' : ext;
          processedValues[key] = `data:audio/${mimeType};base64,${fileBuffer.toString('base64')}`;
          console.log(`🎵 参数 [${key}]: 音频转 base64 (${(fileBuffer.length / 1024).toFixed(1)}KB)`);
        } else {
          mimeType = ext === 'jpg' ? 'jpeg' : ext;
          processedValues[key] = `data:image/${mimeType};base64,${fileBuffer.toString('base64')}`;
          console.log(`📎 参数 [${key}]: 文件转 base64 (${(fileBuffer.length / 1024).toFixed(1)}KB)`);
        }
      } else {
        processedValues[key] = value;
        console.log(`⚠️ 参数 [${key}]: 文件不存在 ${filePath}`);
      }
    } else {
      processedValues[key] = value;
    }
  }
  
  const payload = {
    web_app_id,
    suppress_preview_output: true,
    input_values: processedValues
  };
  
  // 轮询所有 key 尝试提交，最多尝试全部 key
  let lastError = null;
  const maxAttempts = allKeys.length;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const idx = (startIdx + attempt) % allKeys.length;
    const keyItem = allKeys[idx];
    const apiKey = keyItem.key;
    
    // 首次尝试时推进 autoSwitchIndex（保持正常轮换）
    if (attempt === 0 && settings.autoSwitch) {
      settings.autoSwitchIndex = (startIdx + 1) % maxAttempts;
      saveSettings(settings);
    }
    
    try {
      const response = await axios.post(
        'https://api.bizyair.cn/w/v1/webapp/task/openapi/create',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'X-Bizyair-Task-Async': 'enable'
          },
          timeout: 30000
        }
      );
      
      const requestId = response.data.request_id;
      console.log(`✅ Key [${keyItem.name}] 提交成功: ${requestId}`);
      return res.json({ requestId, message: '任务已提交' });
      
    } catch (err) {
      lastError = err;
      const bizCode = err.response?.data?.code;
      const httpStatus = err.response?.status;
      const errMsg = err.response?.data?.message || err.message;
      console.log(`❌ Key [${keyItem.name}] 提交失败 (code=${bizCode}, http=${httpStatus}): ${errMsg}`);
      
      if (isRetryableBizyairError(err)) {
        console.log(`🔄 自动换 Key 重试...`);
        continue; // 换下一个 key
      }
      // 非可重试错误，立即中断
      break;
    }
  }
  
  // 全部 key 都失败或遇到不可重试错误
  console.error('任务提交失败（所有 Key 已用完或不可重试）:', lastError.response?.data || lastError.message);
  res.status(500).json({
    error: lastError.response?.data?.message || lastError.message
  });
});

// 查询任务状态
app.get('/api/task-status/:request_id', async (req, res) => {
  try {
    const { request_id } = req.params;
    const apiKey = getCurrentApiKey();
    
    if (!apiKey) {
      return res.status(400).json({ error: '请先配置 API Key' });
    }

    // 1. 先查询任务状态（detail 接口）
    const detailResp = await axios.get(
      `https://api.bizyair.cn/w/v1/webapp/task/openapi/detail?requestId=${request_id}`,
      {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        timeout: 30000
      }
    );
    
    const detailData = detailResp.data;
    const rawStatus = detailData?.data?.status || detailData?.status || '';
    const st = String(rawStatus).toLowerCase();
    const inferenceCostTime = detailData?.data?.inference_cost_time;

    let mergedData = { ...(detailData.data || {}) };

    // 2. 任务已结束时，补充 outputs 信息（输出结果或错误详情）
    if (st === 'success' || st === 'completed' || st === 'failed' || st === 'error') {
      try {
        const outputsResp = await axios.get(
          `https://api.bizyair.cn/w/v1/webapp/task/openapi/outputs?requestId=${request_id}`,
          {
            headers: { 'Authorization': `Bearer ${apiKey}` },
            timeout: 30000
          }
        );
        if (outputsResp.data?.data) {
          mergedData = { ...mergedData, ...outputsResp.data.data };
        }
      } catch (e) {
        // outputs 接口仅在完成时才有数据，非完成阶段忽略错误
      }
    }

    // 3. 估算 progress
    let progress;
    if (st === 'success' || st === 'completed') progress = 100;
    else if (st === 'failed' || st === 'error') progress = 0;
    else if (st === 'pending' || st === 'queued' || st === 'queuing') progress = 8;
    else if (st === 'preparing') progress = 15;
    else if (st === 'running' || st === 'processing' || st === 'in_progress') progress = -1;
    else progress = -1;

    res.json({ ...detailData, data: mergedData, progress, inference_cost_time: inferenceCostTime });
  } catch (err) {
    console.error('Status check failed:', err.response?.data || err.message);
    res.status(500).json({ 
      error: err.response?.data?.message || err.message 
    });
  }
});

// 保存单个输出文件
app.post('/api/save-output', async (req, res) => {
  try {
    const { object_url, output_ext, app_name } = req.body;
    
    if (!object_url) {
      return res.status(400).json({ error: '缺少 object_url' });
    }
    
    const today = new Date().toISOString().split('T')[0];
    const appName = app_name || '未知应用';
    const baseDir = path.join(saveDir, appName, today);
    
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    
    // 确定文件扩展名
    let ext = output_ext || '.png';
    if (!ext.startsWith('.')) ext = '.' + ext;
    
    // 生成文件名 — 从现有文件名中提取最大序号+1
    const existingFiles = fs.existsSync(baseDir) ? fs.readdirSync(baseDir).filter(f => !f.startsWith('.')) : [];
    let maxCounter = 0;
    existingFiles.forEach(f => {
      const match = f.match(/-(\d{5})\.[^.]+$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxCounter) maxCounter = num;
      }
    });
    const counter = maxCounter + 1;
    
    const fileName = `${appName}-${today}-${counter.toString().padStart(5, '0')}${ext}`;
    const filePath = path.join(baseDir, fileName);
    
    // 下载并保存
    const response = await axios.get(object_url, {
      responseType: 'arraybuffer',
      timeout: 60000
    });
    fs.writeFileSync(filePath, Buffer.from(response.data));
    
    res.json({
      success: true,
      fileName,
      filePath,
      url: `/输出/${encodeURIComponent(appName)}/${today}/${encodeURIComponent(fileName)}`,
      relativePath: path.join('输出', appName, today, fileName)
    });
  } catch (err) {
    console.error('保存输出失败:', err);
    res.status(500).json({ error: err.message });
  }
});

// 保存输出文件（批量）
app.post('/api/save-outputs', async (req, res) => {
  try {
    const { outputs, web_app_id, app_name } = req.body;
    
    if (!outputs || !Array.isArray(outputs)) {
      return res.status(400).json({ error: '无效的输出数据' });
    }
    
    const results = [];
    const today = new Date().toISOString().split('T')[0];
    const appName = app_name || '未知应用';
    const baseDir = path.join(saveDir, appName, today);
    
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    
    for (const output of outputs) {
      const { object_url, output_ext } = output;
      if (!object_url) continue;
      
      let ext = output_ext || '.png';
      if (!ext.startsWith('.')) ext = '.' + ext;
      if (['.mp4', '.webm', '.mov', '.avi'].includes(output_ext?.toLowerCase())) {
        category = '视频';
      } else if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'].includes(output_ext?.toLowerCase())) {
        category = '图像';
      } else if (['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a'].includes(output_ext?.toLowerCase())) {
        category = '音频';
      } else {
        category = '文本';
      }
      
      // 从现有文件名中提取最大序号+1
      const existingFiles = fs.existsSync(baseDir) ? fs.readdirSync(baseDir).filter(f => !f.startsWith('.')) : [];
      let maxCounter = 0;
      existingFiles.forEach(f => {
        const match = f.match(/-(\d{5})\.[^.]+$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxCounter) maxCounter = num;
        }
      });
      const counter = maxCounter + results.length + 1;
      
      const fileName = `${appName}-${today}-${counter.toString().padStart(5, '0')}${ext}`;
      const filePath = path.join(baseDir, fileName);
      
      try {
        const response = await axios.get(object_url, {
          responseType: 'arraybuffer',
          timeout: 60000
        });
        fs.writeFileSync(filePath, Buffer.from(response.data));
        results.push({ success: true, fileName, filePath, url: `/输出/${encodeURIComponent(appName)}/${today}/${encodeURIComponent(fileName)}` });
        console.log(`[保存] ${filePath}`);
      } catch (downloadErr) {
        results.push({ success: false, error: downloadErr.message, url: object_url });
      }
    }
    
    res.json({
      success: true,
      savedCount: results.filter(r => r.success).length,
      totalCount: results.length,
      results: results
    });
  } catch (err) {
    console.error('保存输出失败:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============= 相册缓存（持久化 + fs.watch 监听） =============
let galleryCacheData = null; // 内存缓存，启动时从文件加载

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
      galleryCacheData = JSON.parse(raw);
      console.log('[CACHE] 已加载持久化缓存');
      return true;
    }
  } catch (e) {
    console.warn('[CACHE] 缓存文件损坏，将重新扫描');
  }
  galleryCacheData = {};
  return false;
}

function saveCache() {
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(galleryCacheData));
  } catch (e) {
    console.error('[CACHE] 保存缓存失败:', e.message);
  }
}

function getCache(key) {
  return galleryCacheData ? galleryCacheData[key] || null : null;
}

function setCache(key, data) {
  if (!galleryCacheData) galleryCacheData = {};
  galleryCacheData[key] = data;
  saveCache();
}

function clearCache() {
  galleryCacheData = {};
  saveCache();
}

// 监听输出目录变化，自动更新缓存
function setupWatcher() {
  if (!fs.existsSync(watchDir)) return;
  try {
    fs.watch(watchDir, { recursive: true }, (eventType, filename) => {
      // 防抖：连续文件变化只触发一次清缓存
      if (watchTimer) clearTimeout(watchTimer);
      watchTimer = setTimeout(() => {
        console.log('[CACHE] 检测到文件变化，清空缓存');
        clearCache();
      }, 2000);
    });
    console.log('[CACHE] 已启用文件监听');
  } catch (e) {
    console.warn('[CACHE] 无法监听文件变化（可能文件太多）:', e.message);
  }
}

// ============= 缩略图 API =============
const sharp = require('sharp');

// 生成缩略图：长边 360px，保持比例，缓存到 .thumbcache 目录
app.get('/api/thumbnail', async (req, res) => {
  try {
    const { path: imgPath } = req.query;
    if (!imgPath) return res.status(400).send('Missing path');

    // 安全检查：只允许输出目录下的文件
    const decodedPath = decodeURIComponent(imgPath.replace(/^\/输出\//, ''));
    const sourceFile = path.join(saveDir, decodedPath);
    if (!sourceFile.startsWith(saveDir)) {
      return res.status(403).send('Forbidden');
    }
    if (!fs.existsSync(sourceFile)) {
      return res.status(404).send('Not found');
    }

    // 只允许图片文件生成缩略图
    const imgExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg', '.tiff', '.tif', '.avif'];
    if (!imgExts.includes(path.extname(sourceFile).toLowerCase())) {
      return res.status(400).send('Not an image file');
    }

    // 缩略图缓存路径（无扩展名，避免在系统中可见）
    const thumbRelPath = decodedPath.replace(/[\\\/:]/g, '_');
    const thumbFile = path.join(THUMB_DIR, thumbRelPath);

    if (fs.existsSync(thumbFile)) {
      return res.sendFile(thumbFile, { maxAge: '7d', cacheControl: true });
    }

    // 确保缓存目录存在，并设为隐藏+系统属性（Windows）
    if (!fs.existsSync(THUMB_DIR)) {
      fs.mkdirSync(THUMB_DIR, { recursive: true });
      try {
        execSync(`attrib +H +S "${THUMB_DIR}"`, { stdio: 'ignore' });
      } catch (e) { /* ignore on non-Windows */ }
    }

    // 用 sharp 生成缩略图：长边 360px，webp 格式
    await sharp(sourceFile)
      .resize(360, 360, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 60 })
      .toFile(thumbFile);

    res.sendFile(thumbFile, { maxAge: '7d', cacheControl: true });
  } catch (err) {
    console.error('生成缩略图失败:', err);
    res.status(500).send('Thumbnail error');
  }
});

// 获取相册列表
app.get('/api/gallery', async (req, res) => {
  try {
    const { app_name, date, sort_by = 'date', sort_order = 'desc' } = req.query;
    const cacheKey = 'all:' + JSON.stringify({ app_name, date, sort_by, sort_order });
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const outputDir = saveDir;
    
    if (!fs.existsSync(outputDir)) {
      return res.json({ files: [], apps: [], dates: [] });
    }
    
    const files = [];
    const apps = new Set();
    const dates = new Set();
    
    // 递归读取所有文件
    const scanDir = (dir, currentApp = '', currentDate = '') => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        if (item.name.startsWith('.')) continue;
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          // 判断是应用名还是日期
          if (/^\d{4}-\d{2}-\d{2}$/.test(item.name)) {
            scanDir(fullPath, currentApp, item.name);
            dates.add(item.name);
          } else {
            scanDir(fullPath, item.name, currentDate);
            apps.add(item.name);
          }
        } else {
          // 是文件
          const ext = path.extname(item.name).toLowerCase();
          const mediaType = getMediaTypeByExt(ext);
          
          if (mediaType) {
            const stat = fs.statSync(fullPath);
            // 构建相对路径
            let relativePath = item.name;
            if (currentDate) relativePath = currentDate + '/' + relativePath;
            if (currentApp) relativePath = currentApp + '/' + relativePath;
            
            files.push({
              name: item.name,
              path: `/输出/${relativePath.split('/').map(encodeURIComponent).join('/')}`,
              app: currentApp || '未分类',
              date: currentDate || '未知日期',
              size: stat.size,
              mtime: stat.mtime,
              type: mediaType
            });
          }
        }
      }
    };
    
    scanDir(outputDir);
    
    // 过滤
    let filtered = files;
    if (app_name) filtered = filtered.filter(f => f.app === app_name);
    if (date) filtered = filtered.filter(f => f.date === date);
    
    // 排序
    filtered.sort((a, b) => {
      let cmp = 0;
      if (sort_by === 'date') cmp = new Date(a.mtime) - new Date(b.mtime);
      else if (sort_by === 'name') cmp = a.name.localeCompare(b.name);
      else if (sort_by === 'app') cmp = a.app.localeCompare(b.app);
      else if (sort_by === 'size') cmp = a.size - b.size;
      return sort_order === 'desc' ? -cmp : cmp;
    });
    
    const result = {
      files: filtered,
      apps: Array.from(apps).sort(),
      dates: Array.from(dates).sort().reverse()
    };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('获取相册失败:', err);
    res.status(500).json({ error: err.message });
  }
});

// 删除相册文件
app.delete('/api/gallery', async (req, res) => {
  try {
    const { file_path } = req.body;
    
    if (!file_path) {
      return res.status(400).json({ error: '缺少文件路径' });
    }
    
    // 安全检查：只允许删除输出目录下的文件
    const outputDir = saveDir;
    const relativePath = file_path.replace(/^\/输出\//, '').split('/').map(decodeURIComponent).join('/');
    const fullPath = path.join(outputDir, relativePath);
    
    if (!fullPath.startsWith(outputDir)) {
      return res.status(403).json({ error: '无权删除此文件' });
    }
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      clearCache(); // 清空缓存
      res.json({ success: true });
    } else {
      res.status(404).json({ error: '文件不存在' });
    }
  } catch (err) {
    console.error('删除文件失败:', err);
    res.status(500).json({ error: err.message });
  }
});

// 重命名相册文件
app.post('/api/gallery/rename', async (req, res) => {
  try {
    const { old_path, new_name } = req.body;
    
    if (!old_path || !new_name) {
      return res.status(400).json({ error: '缺少参数' });
    }
    
    // 安全检查：只允许重命名输出目录下的文件
    const outputDir = saveDir;
    const oldFullPath = path.join(outputDir, old_path.replace(/^\/输出\//, ''));
    
    if (!oldFullPath.startsWith(outputDir)) {
      return res.status(403).json({ error: '无权重命名此文件' });
    }
    
    if (!fs.existsSync(oldFullPath)) {
      return res.status(404).json({ error: '文件不存在' });
    }
    
    // 构建新路径
    const dir = path.dirname(oldFullPath);
    const newFullPath = path.join(dir, new_name);
    
    // 检查是否已存在
    if (fs.existsSync(newFullPath)) {
      return res.status(400).json({ error: '文件名已存在' });
    }
    
    // 重命名
    fs.renameSync(oldFullPath, newFullPath);
    clearCache(); // 清空缓存
    res.json({ success: true });
  } catch (err) {
    console.error('重命名文件失败:', err);
    res.status(500).json({ error: err.message });
  }
});

// 获取文件夹列表（应用名）
app.get('/api/gallery/folders', async (req, res) => {
  try {
    const cached = getCache('folders')
    if (cached) {
      return res.json(cached)
    }

    const outputDir = saveDir;

    if (!fs.existsSync(outputDir)) {
      return res.json({ folders: [] });
    }

    const folders = [];
    const items = fs.readdirSync(outputDir, { withFileTypes: true });

    for (const item of items) {
      if (!item.isDirectory() || item.name.startsWith('.')) continue;

      const folderPath = path.join(outputDir, item.name);
      let count = 0;
      let cover = null;
      // 收集所有媒体文件以便取最新的几张作为封面
      const allMedia = [];

      // 递归统计文件数并收集媒体文件
      const scanFolder = (dir) => {
        const subItems = fs.readdirSync(dir, { withFileTypes: true });
        for (const subItem of subItems) {
          if (subItem.name.startsWith('.')) continue;
          const subPath = path.join(dir, subItem.name);
          if (subItem.isDirectory()) {
            scanFolder(subPath);
          } else {
            const ext = path.extname(subItem.name).toLowerCase();
            const mediaType = getMediaTypeByExt(ext);
            if (mediaType) {
              // 跳过缩略图文件
              if (subItem.name.match(/\.thumb\.(jpg|jpeg|png)$/i)) continue;
              count++;
              const stat = fs.statSync(subPath);
              // 构建相对路径
              const relativePath = path.relative(outputDir, subPath).replace(/\\/g, '/');
              const url = `/输出/${relativePath.split('/').map(encodeURIComponent).join('/')}`;
              // cover 优先选择图片，其次视频，最后才是文本/音频
              if (!cover || (mediaType === 'image' && coverType !== 'image')) {
                cover = url;
                coverType = mediaType;
              }
              allMedia.push({ url, fullPath: subPath, mtime: stat.mtime, mediaType });
            }
          }
        }
      };

      let coverType = null;
      scanFolder(folderPath);

      if (count > 0) {
        // 按时间排序，取最后三项作为封面（最新）
        allMedia.sort((a, b) => new Date(a.mtime) - new Date(b.mtime));
        const lastThree = allMedia.slice(-3).map(m => m.url);

        folders.push({
          name: item.name,
          count: count,
          cover: cover,
          covers: lastThree,
          coverType: coverType || 'image'
        });
      }
    }

    // 按文件数排序
    folders.sort((a, b) => b.count - a.count);

    // 如果没有子文件夹，检查根目录是否有文件（扁平目录）
    if (folders.length === 0) {
      const rootFiles = fs.readdirSync(outputDir).filter(f => {
        if (f.startsWith('.')) return false;
        const ext = path.extname(f).toLowerCase();
        return !!getMediaTypeByExt(ext);
      });
      if (rootFiles.length > 0) {
        // 找封面
        let cover = null;
        const covers = [];
        rootFiles.sort();
        for (const f of rootFiles) {
          const ext = path.extname(f).toLowerCase();
          if (getMediaTypeByExt(ext) === 'image') {
            const url = `/输出/${encodeURIComponent(f)}`;
            if (!cover) cover = url;
            covers.push(url);
            if (covers.length >= 3) break;
          }
        }
        folders.push({
          name: '__root__',
          count: rootFiles.length,
          cover: cover,
          covers: covers.length > 0 ? covers : null,
          coverType: 'image',
          _isRoot: true
        });
      }
    }

    const result = { folders };
    setCache('folders', result);
    res.json(result);
  } catch (err) {
    console.error('获取文件夹列表失败:', err);
    res.status(500).json({ error: err.message });
  }
});

// 获取日期子文件夹列表（模型文件夹下的日期子目录）
app.get('/api/gallery/subfolders/:name', async (req, res) => {
  try {
    const folderName = decodeURIComponent(req.params.name);
    const outputDir = saveDir;
    const folderPath = path.join(outputDir, folderName);

    if (!fs.existsSync(folderPath)) {
      return res.json({ folders: [] });
    }

    const subfolders = [];
    const items = fs.readdirSync(folderPath, { withFileTypes: true });

    for (const item of items) {
      if (!item.isDirectory() || item.name.startsWith('.')) continue;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(item.name)) continue;

      const datePath = path.join(folderPath, item.name);
      let count = 0;
      let cover = null;
      let coverType = null;
      const allCovers = [];

      const dateFiles = fs.readdirSync(datePath, { withFileTypes: true });
      for (const file of dateFiles) {
        if (file.name.startsWith('.')) continue;
        if (file.name.match(/\.thumb\.(jpg|jpeg|png)$/i)) continue;
        const ext = path.extname(file.name).toLowerCase();
        const type = getMediaTypeByExt(ext);
        if (!type) continue;
        count++;
        const url = `/输出/${encodeURIComponent(folderName)}/${encodeURIComponent(item.name)}/${encodeURIComponent(file.name)}`;
        allCovers.push({ url, type, mtime: fs.statSync(path.join(datePath, file.name)).mtime });
        if (!cover || (type === 'image' && coverType !== 'image')) {
          cover = url;
          coverType = type;
        }
      }

      if (count > 0) {
        allCovers.sort((a, b) => a.mtime - b.mtime);
        const lastThreeUrls = allCovers.slice(-3).map(c => c.url);
        subfolders.push({
          name: item.name,
          count,
          cover,
          covers: lastThreeUrls,
          coverType: coverType || 'image'
        });
      }
    }

    subfolders.sort((a, b) => b.name.localeCompare(a.name));
    res.json({ folders: subfolders });
  } catch (err) {
    console.error('获取子文件夹列表失败:', err);
    res.status(500).json({ error: err.message });
  }
});

// 获取文件夹内容
app.get('/api/gallery/folder/:name', async (req, res) => {
  try {
    const folderName = decodeURIComponent(req.params.name);
    const cacheKey = 'folder:' + folderName;

    const cached = getCache(cacheKey)
    if (cached) {
      return res.json(cached)
    }

    const outputDir = saveDir;
    // __root__ 表示扁平目录，直接扫描 saveDir
    const folderPath = folderName === '__root__' ? outputDir : path.join(outputDir, folderName);
    
    if (!fs.existsSync(folderPath)) {
      return res.json({ files: [] });
    }
    
    const files = [];
    
    // 递归读取文件
    const scanFolder = (dir, currentDate = '') => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        if (item.name.startsWith('.')) continue;
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          // 判断是否是日期目录
          if (/^\d{4}-\d{2}-\d{2}$/.test(item.name)) {
            scanFolder(fullPath, item.name);
          } else {
            scanFolder(fullPath, currentDate);
          }
        } else {
          const ext = path.extname(item.name).toLowerCase();
          const mediaType = getMediaTypeByExt(ext);

          // 跳过缩略图文件
          if (mediaType && !item.name.match(/\.thumb\.(jpg|jpeg|png)$/i)) {
            const stat = fs.statSync(fullPath);
            const relativePath = path.relative(outputDir, fullPath).replace(/\\/g, '/');
            const fileObj = {
              name: item.name,
              path: `/输出/${relativePath.split('/').map(encodeURIComponent).join('/')}`,
              date: currentDate || '未知日期',
              size: stat.size,
              mtime: stat.mtime,
              type: mediaType
            };

            files.push(fileObj);
          }
        }
      }
    };
    
    scanFolder(folderPath);
    
    // 按修改时间排序（新到旧）
    files.sort((a, b) => new Date(b.mtime) - new Date(a.mtime));

    const result = { files };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('获取文件夹内容失败:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============= 辅助函数 =============

// 统一媒体类型判断
function getMediaTypeByExt(ext) {
  const e = ext.toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg', '.tiff', '.tif', '.avif'].includes(e)) return 'image';
  if (['.mp4', '.webm', '.mov', '.avi', '.m4v', '.mkv', '.flv', '.wmv', '.3gp'].includes(e)) return 'video';
  if (['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac', '.opus', '.wma', '.aiff', '.mid', '.midi'].includes(e)) return 'audio';
  if (['.json', '.txt', '.csv', '.md', '.log', '.html', '.xml'].includes(e)) return 'text';
  return null; // 未知类型不显示
}

function identifyParameterType(paramKey, paramValue, allExamples, parameterTypes, enumOptionsMap) {
  const paramNameWithoutPrefix = paramKey.replace(/^\d+:/, '');
  
  // 1. 精确匹配参数类型库（最高优先级，用户编辑保存的覆盖注释）
  if (parameterTypes[paramKey]) {
    const typeDef = parameterTypes[paramKey];
    if (typeof typeDef === 'object' && typeDef.type) {
      return typeDef; // { type: 'select', options: [...] }
    }
    return typeDef; // 'text' / 'number' / etc.
  }
  
  // 2. 检查注释中的枚举选项
  if (enumOptionsMap && enumOptionsMap[paramKey] && enumOptionsMap[paramKey].length >= 2) {
    return { type: 'select', options: enumOptionsMap[paramKey] };
  }
  
  // 3. 检查同类参数名（去掉数字前缀）是否有对象类型定义
  for (const [key, typeDef] of Object.entries(parameterTypes)) {
    const keyWithoutPrefix = key.replace(/^\d+:/, '');
    if (keyWithoutPrefix === paramNameWithoutPrefix && key !== paramKey) {
      if (typeof typeDef === 'object' && typeDef.type) {
        return typeDef;
      }
    }
  }
  
  // 4. 检查注释中按无前缀名匹配
  if (enumOptionsMap) {
    for (const [enumKey, options] of Object.entries(enumOptionsMap)) {
      const enumNameWithoutPrefix = enumKey.replace(/^\d+:/, '');
      if (enumNameWithoutPrefix === paramNameWithoutPrefix && enumKey !== paramKey && options.length >= 2) {
        return { type: 'select', options };
      }
    }
  }
  
  // 5. 常见枚举类参数自动识别（优先于跨示例匹配）
  const commonEnums = {
    'resolution': {},
    'ratio': {},
    'choice': {},
    'sampler_name': {},
    'language': {}
  };
  const lowerName = paramNameWithoutPrefix.toLowerCase();
  for (const [keyword, config] of Object.entries(commonEnums)) {
    if (lowerName === keyword || lowerName.endsWith('.' + keyword) || lowerName.endsWith('_' + keyword) || lowerName.includes('.' + keyword + '.') || lowerName.includes('_' + keyword + '_')) {
      return { type: 'select', options: [String(paramValue)] };
    }
  }
  
  // 6. 跨示例匹配
  for (const example of allExamples) {
    for (const [key, value] of Object.entries(example.input_values || {})) {
      const exampleParamName = key.replace(/^\d+:/, '');
      if (exampleParamName === paramNameWithoutPrefix) {
        return inferTypeFromValue(value);
      }
    }
  }
  
  // 7. 从名称和值推断
  return inferTypeFromNameAndValue(paramNameWithoutPrefix, paramValue);
}

// 从原始示例代码文本中提取注释里的枚举选项
// 格式: "value" #可选: A 和 B 和 C  或  #可选: A, B, C
function extractEnumOptionsFromContent(content) {
  const enumOptionsMap = {};
  // 匹配 JSON key:value 行后面的 #可选 注释
  const enumRegex = /"([^"]+)"\s*:\s*"([^"]*?)"\s*,?\s*#可选\s*[:：]\s*(.+)/g;
  let match;
  while ((match = enumRegex.exec(content)) !== null) {
    const paramKey = match[1];
    const optionsStr = match[3].trim();
    // 支持 "和" 或 "," 分隔
    const options = optionsStr.split(/\s*(?:和|,)\s*/).map(s => s.trim()).filter(Boolean);
    if (options.length >= 2) {
      enumOptionsMap[paramKey] = options;
    }
  }
  return enumOptionsMap;
}

// 加载所有示例文件的参数数据
function loadAllExamples() {
  const allExamples = [];
  if (fs.existsSync(examplesDir)) {
    const walkDir = (dir) => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else if (file.endsWith('.txt')) {
          try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const match = fileContent.match(/\{[\s\S]*\}/);
            if (match) {
              const parsed = JSON.parse(match[0]);
              allExamples.push(parsed);
            }
          } catch (err) {}
        }
      });
    };
    walkDir(examplesDir);
  }
  return allExamples;
}

// 从原始内容和解析数据构建参数对象
function buildParameters(data, content, appId) {
  const allExamples = loadAllExamples();
  // 内置默认参数类型覆盖（随代码发布，不依赖外部文件）
  const builtinTypes = {
    "76:LoadImage.image": "image",
    "99:LoadImage.image": "image",
    "98:LoadImage.image": "image",
    "143:LoadImage.image": "image",
    "133:LoadImage.image": "image",
    "1:LoadImage.image": "image",
    "155:CustomCombo.choice": { type: "select", options: ["Flux2_Klein_官方", "Flux2_Klein_黑兽"] }
  };
  const appTypes = loadParameterTypes(appId);
  const parameterTypes = { ...builtinTypes, ...appTypes };
  const enumOptionsMap = content ? extractEnumOptionsFromContent(content) : {};
  
  const parameters = {};
  for (const [key, value] of Object.entries(data.input_values || {})) {
    const typeResult = identifyParameterType(key, value, allExamples, parameterTypes, enumOptionsMap);
    
    // 统一处理: 字符串格式 → { type, value, label }
    // 对象格式 → { type, options, value, label }
    let resolvedType, resolvedOptions, customLabel;
    if (typeof typeResult === 'object') {
      resolvedType = typeResult.type;
      resolvedOptions = typeResult.options;
      customLabel = typeResult.label;
      // 如果对象没有 type 字段（仅保存了 label），回退到推断类型
      if (!resolvedType) {
        const fallback = identifyParameterType(key, value, allExamples, {}, null);
        resolvedType = typeof fallback === 'object' ? fallback.type : fallback;
        resolvedOptions = typeof fallback === 'object' ? fallback.options : undefined;
      }
    } else {
      resolvedType = typeResult;
    }
    
    parameters[key] = {
      value: value,
      type: resolvedType,
      label: customLabel || generateLabel(key),
      ...(resolvedOptions ? { options: resolvedOptions } : {})
    };
  }
  return parameters;
}

// 从原始文本中移除 JSON 注释 (# 开头的行内注释)
function stripJsonComments(text) {
  // 移除字符串值后面的 # 注释 (如 "value", #可选: ...)
  // 注意不能移除字符串内部的 #
  let result = '';
  let inString = false;
  let escape = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escape) {
      result += ch;
      escape = false;
      continue;
    }
    if (ch === '\\') {
      result += ch;
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }
    if (!inString && ch === '#') {
      // 跳过到行尾
      while (i < text.length && text[i] !== '\n' && text[i] !== '\r') {
        i++;
      }
      i--; // for loop will i++
      continue;
    }
    result += ch;
  }
  return result;
}

function inferTypeFromValue(value) {
  if (typeof value === 'boolean') return 'boolean';
  if (Number.isInteger(value)) return 'number';
  if (typeof value === 'number') return 'float';
  if (typeof value === 'string') {
    if (value === 'true' || value === 'false') return 'boolean';
    if (/^-?\d+$/.test(value) && value.length < 10) return 'number';
    if (/^-?\d+\.\d+$/.test(value)) return 'float';
    if (value.startsWith('http') || value.startsWith('data:') || value.startsWith('/')) {
      const ext = value.split('?')[0].split('.').pop().toLowerCase();
      if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(ext)) return 'image';
      if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'].includes(ext)) return 'video';
      if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'opus', 'wma'].includes(ext)) return 'audio';
      if (value.includes('image')) return 'image';
      if (value.includes('audio')) return 'audio';
      if (value.includes('video')) return 'video';
    }
    if (value.length > 100) return 'textarea';
    return 'text';
  }
  return 'text';
}

function inferTypeFromNameAndValue(paramName, paramValue) {
  const lowerName = paramName.toLowerCase();
  
  // 优先根据值类型推断（boolean 不能被名称覆盖）
  if (typeof paramValue === 'boolean') return 'boolean';
  
  // 图像参数 - 只在明确是图像相关且值为 URL 时
  if ((lowerName.endsWith('.image') || lowerName.includes('image') || lowerName === 'image') && 
      (String(paramValue).startsWith('http') || String(paramValue).startsWith('/') || String(paramValue).startsWith('data:'))) {
    return 'image';
  }
  
  // 音频参数
  if ((lowerName.includes('audio') || lowerName.includes('sound') || lowerName.includes('voice')) && 
      (String(paramValue).startsWith('http') || String(paramValue).startsWith('/'))) {
    return 'audio';
  }
  
  // 视频参数
  if ((lowerName.includes('video') || lowerName === 'video') && 
      (String(paramValue).startsWith('http') || String(paramValue).startsWith('/'))) {
    return 'video';
  }

  // 先检测值是否为文件 URL（通过扩展名判断）
  const strVal = String(paramValue);
  if (strVal.startsWith('http') || strVal.startsWith('/') || strVal.startsWith('data:')) {
    const ext = strVal.split('?')[0].split('.').pop().toLowerCase();
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(ext)) return 'image';
    if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'opus', 'wma'].includes(ext)) return 'audio';
  }
  
  // 文本类参数
  if (lowerName.includes('text') || lowerName.includes('prompt') || lowerName.includes('description')) {
    return 'textarea';
  }
  
  // 数字类参数
  if (lowerName.includes('width') || lowerName.includes('height') || 
      lowerName.includes('seed') || lowerName.includes('size') || 
      lowerName.includes('step') || lowerName.includes('batch') ||
      lowerName.includes('fps') || lowerName.includes('frame') ||
      lowerName.includes('scale') ||
      lowerName.includes('num') || lowerName.includes('count')) {
    return 'number';
  }
  
  return inferTypeFromValue(paramValue);
}

function generateLabel(paramKey) {
  const paramName = paramKey.replace(/^\d+:/, '');
  const labelMap = {
    'LoadImage.image': '输入图像',
    'LoadImage.mask': '蒙版图像',
    'LoadAudio.audio': '输入音频',
    'LoadVideo.video': '输入视频',
    'CLIPTextEncode.text': '正向提示词',
    'CLIPTextEncodeBypass.text': '反向提示词',
    'KSampler.seed': '随机种子',
    'KSampler.denoise': '去噪强度',
    'KSampler.steps': '采样步数',
    'KSampler.cfg': '引导强度',
    'KSampler.sampler_name': '采样器',
    'EmptySD3LatentImage.width': '宽度',
    'EmptySD3LatentImage.height': '高度',
    'EmptySD3LatentImage.batch_size': '批次大小',
    'EmptyImage.width': '宽度',
    'EmptyImage.height': '高度',
    'EmptyImage.batch_size': '批次大小',
    'PrimitiveBoolean.value': '启用',
    'PrimitiveInt.value': '整数值',
    'PrimitiveString.value': '字符串',
    'PrimitiveStringMultiline.value': '多行文本',
    'PrimitiveFloat.value': '浮点数',
    'KSamplerSelect.sampler_name': '采样器',
    'JjkText.text': '提示词',
    'JWInteger.value': '整数值',
    'INTConstant.value': '整数值',
    'Float.Number': '浮点数值',
    'CR Prompt Text.prompt': '提示词',
    'CR Text.text': '文本',
    'ImageResizeKJv2.width': '输出宽度',
    'ImageResizeKJv2.height': '输出高度',
    'ImageScaleToTotalPixels.megapixels': '目标像素',
    'ImageScaleToTotalPixels.resolution_steps': '调整步数',
    'WanVideoImageToVideoEncode.num_frames': '帧数',
    'WanVideoTextEncode.positive_prompt': '正向提示词',
    'BizyAirJoyCaption3.extra_options': '额外选项',
    'BizyAirJoyCaption3.custom_prompt': '自定义提示词',
    'IndexTTS2Run.emo_text': '情绪文本',
    'FB_Qwen3TTSVoiceDesign.text': '设计文本',
    'FB_Qwen3TTSVoiceDesign.instruct': '指令',
    'FB_Qwen3TTSVoiceDesign.language': '语言',
    'CustomCombo.choice': '模型选择',
    'EmptyFlux2LatentImage.batch_size': '批次大小',
    'Flux2Scheduler.steps': '采样步数'
  };
  
  return labelMap[paramName] || paramName.split('.').pop();
}



