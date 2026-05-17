<p align="center">
  <img src="public/logo002.png" width="120" alt="BizyAir API 工具" />
</p>

<h1 align="center">🚀 BizyAir API 工具</h1>

<p align="center">
  <b>BizyAir 应用的桌面客户端 — 多 Tab 任务管理 · API Key 自动切换 · 余额查询</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React 18" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white" alt="Vite 5" />
  <img src="https://img.shields.io/badge/Electron-33-47848F?logo=electron&logoColor=white" alt="Electron 33" />
  <img src="https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white" alt="Express 4" />
  <img src="https://img.shields.io/badge/Sharp-0.34-99CC00?logo=sharp&logoColor=white" alt="Sharp" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" />
</p>

---

## ✨ 功能特性

| 特性 | 说明 |
|------|------|
| 📑 **多 Tab 并行** | 每个 Tab 独立运行任务，互不干扰 |
| 🧠 **智能参数识别** | 自动识别参数类型（图像、音频、文本、数字等） |
| 🔑 **API Key 管理** | 多 Key 管理、自动轮换、失败自动重试 |
| 💰 **余额查询** | 实时查看各 Key 的 BZ 币余额 |
| 🖼️ **桌面应用** | 原生窗口体验，Electron 打包，F12 开发者工具 |
| 🖥️ **桌面背景** | 自定义背景图，透明任务栏 |
| 📂 **相册管理** | 任务输出自动归档，缩略图预览 |
| 🔄 **自动重试** | 限流 / 排队 / 余额不足时自动切换 Key 重试 |

---

## 🛠️ 技术栈

<table>
  <tr>
    <th align="center" colspan="2">前端</th>
    <th align="center" colspan="2">后端</th>
    <th align="center">桌面</th>
  </tr>
  <tr>
    <td align="center"><img src="https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/react.svg" width="24" /><br/><b>React 18</b></td>
    <td align="center"><img src="https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/tailwindcss.svg" width="24" /><br/><b>Tailwind CSS</b></td>
    <td align="center"><img src="https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/express.svg" width="24" /><br/><b>Express</b></td>
    <td align="center"><img src="https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/sharp.svg" width="24" /><br/><b>Sharp</b></td>
    <td align="center"><img src="https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/electron.svg" width="24" /><br/><b>Electron</b></td>
  </tr>
  <tr>
    <td align="center" colspan="2">Vite 5 构建</td>
    <td align="center">BizyAir Proxy</td>
    <td align="center">缩略图生成</td>
    <td align="center">打包分发</td>
  </tr>
</table>

---

## 📁 项目结构

```
bizyairAPI/
├── 📦 backend/                  # Express 后端
│   └── 📜 server.cjs           # 主服务器 (2,083 行)
├── ⚛️ src/                      # React 前端
│   ├── 🧩 components/          # 组件库
│   ├── 📄 App.jsx              # 主应用
│   └── 🚀 main.jsx             # 入口
├── 🖥️ electron/                # Electron 桌面壳
│   ├── ⚙️ main.cjs            # 主进程
│   └── 🔌 preload.cjs          # 预加载脚本
├── 🖼️ backgrounds/              # 桌面背景（仅 backgrounds.jpg）
├── 📤 uploads/                  # 用户上传（git 忽略）
├── 📁 输出/                     # 任务输出（git 忽略）
├── 📚 调用示例/                 # 示例文件
├── 📖 使用教程/                 # 教程截图
├── 🔑 apikey.json               # API Key 模板（提交 git）
├── 🔒 apikey_new.json           # 你的真实 Key（git 忽略）
├── 📋 apps.json                 # 应用模板（提交 git）
├── 📋 apps_new.json             # 你的应用（git 忽略）
├── ⚙️ config.json               # 配置文件
├── 🎨 icons/                    # 应用图标
└── 📦 package.json              # 单根依赖
```

---

## 🚀 快速开始

### 📋 前置要求

| 工具 | 版本 |
|------|------|
| ⚡ **Node.js** | 18+ |
| 📦 **npm** | 9+ |
| 🪟 **OS** | Windows 10+ |

### 💿 安装

```bash
git clone https://github.com/MaoYouShiJie/bizyairAPI.git
cd bizyairAPI
npm install
```

### 🔑 配置 API Key

编辑 `apikey_new.json`（你的 Key，**不会被 git 追踪**）：

```json
[
  {
    "id": "my-key",
    "name": "主 Key",
    "apiKey": "sk-your-api-key-here",
    "baseUrl": "https://api.bizyair.cn"
  }
]
```

后端会自动合并 `apikey.json`（模板）和 `apikey_new.json`（你的 Key），保存时写入 `apikey_new.json`，永不触碰模板。

### ▶️ 启动

```bash
# 🔬 开发模式（热更新）
npm run dev

# 🏭 生产模式（Electron，推荐）
npm run electron:prod

# 📦 打包 exe 安装包
npm run dist
```

---

## 🎮 使用指南

### 1️⃣ 添加应用
> 📥 从左侧应用列表点击添加到桌面，或直接拖入调用示例 `.txt` 文件

### 2️⃣ 编辑参数
> 🧠 自动识别参数类型并生成对应输入控件，支持上传图像 / 音频

### 3️⃣ 运行任务
> ▶️ 点击"运行" → 自动调用 BizyAir API → 实时轮询进度 → 多 Tab 并行

### 4️⃣ 查看结果
> 👁️ 预览图像 / 视频 / 音频，查看运行时间，下载原始文件

---

## 🔑 API Key 管理

| 功能 | 说明 |
|------|------|
| 🔑 **多 Key 支持** | 添加多个 API Key，随时切换 |
| 🔄 **自动轮换** | 开启后任务自动轮换使用不同 Key |
| 🔁 **失败重试** | 限流 (429) / 排队满 (30039) / 余额不足自动用下一 Key 重试 |
| 💰 **余额查询** | 实时显示各 Key 的 BZ 币余额（赠送 + 充值） |

---

## 🏗️ 构建部署

```bash
# 构建前端
npm run build

# 测试生产构建
npm run electron:prod       # 快捷测试，F12 打开 DevTools

# 打包 exe 安装包
npm run dist                # 输出到 release/

# 打包便携版
npm run dist:portable       # 单 exe 文件
```

---

## ❓ 常见问题

<details>
<summary><b>❌ 后端启动失败</b></summary>

确保 `npm install` 已完成，`backend/server.cjs` 存在。首次运行会自动从资源目录复制默认配置。
</details>

<details>
<summary><b>🔑 API Key 不生效</b></summary>

- `apikey_new.json` 中的 Key 会覆盖 `apikey.json`
- 检查 JSON 格式是否正确，`id` 不能重复
</details>

<details>
<summary><b>🌐 网络连接问题</b></summary>

- 检查系统代理设置
- 确认 API Key 未过期
- `WSALookupServiceBegin` 错误是 Chromium 内部信息，不影响使用
</details>

<details>
<summary><b>🪟 窗口相关问题</b></summary>

- 按 **F12** 打开开发者工具
- 拖拽窗口时右边界自动限制
- 最小化到任务栏后点击图标恢复
</details>

---

## 📜 许可证

<p align="center">
  <b>MIT</b> · 用 ❤️ 为 BizyAir 用户打造
</p>
