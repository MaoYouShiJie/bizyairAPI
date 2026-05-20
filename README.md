<p align="center">
  <img src="public/logo002.png" width="120" alt="BizyAir API 工具" />
</p>

<h1 align="center">🚀 BizyAir API 工具</h1>

<p align="center">
  <a href="README_EN.md">🇺🇸 English</a>
</p>

<p align="center">
  <b>BizyAir API 的桌面客户端 — 通过图形界面调用 BizyAir 应用，实现文生图、图生图、图生视频、文生视频、音频克隆等 AI 内容生成</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React 18" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white" alt="Vite 5" />
  <img src="https://img.shields.io/badge/Electron-33-47848F?logo=electron&logoColor=white" alt="Electron 33" />
  <img src="https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white" alt="Express 4" />
  <img src="https://img.shields.io/badge/Sharp-0.34-99CC00?logo=sharp&logoColor=white" alt="Sharp" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" />
  <a href="#-赞助"><img src="https://img.shields.io/badge/☕-赞助-orange" alt="Donate" /></a>
</p>

---

## 🎯 项目介绍

**BizyAir API 工具** 是一个桌面客户端，让你**无需编写代码**即可调用 BizyAir 上的 AI 应用。

### 它能做什么？

BizyAir 提供了丰富的 AI 应用（图像生成、视频生成、音频合成等），但直接调用它们的 API 需要手动编写 HTTP 请求、处理参数格式、轮询任务状态。这个工具把这些全部封装成图形界面：

| 场景 | 传统方式 | 使用本工具 |
|------|----------|-----------|
| 🖼️ **文生图/图生图** | 手写 JSON，curl 调用 API，解析返回结果 | 选应用 → 填参数 → 点运行 → 出结果 |
| 🎬 **图生视频/文生视频** | 处理 Base64 编码的图像/视频数据 | 直接拖入图片，自动上传 |
| 🎵 **音频克隆/生成** | 手动管理音频文件的 URL | 上传即用，自动处理 |
| 🔄 **批量任务** | 写脚本循环调用 | 开多个 Tab 并行运行 |

### 核心工作流

```
选择一个 BizyAir 应用 → 编辑输入参数 → 点击运行
    ↓
自动调用 API → 实时轮询进度 → 完成后展示结果
    ↓
           可预览/下载/保存到本地
```

---

## 🌐 关于 BizyAir.cn

[BizyAir.cn](https://bizyair.cn) — **基于 ComfyUI 的即开即用云端 AI 创作空间**，由北京硅基流动科技有限公司（SiliconFlow）运营。它将云端 GPU 资源与本地 ComfyUI 无缝连接，解决本地算力不足问题，内置众多精选模型与节点，无需复杂配置，开箱即用。

### 主要功能板块

| 板块 | 说明 |
|------|------|
| 🤖 **AI 应用** | 基于 ComfyUI 工作流的即开即用 AI 应用（文生图、文生视频、图生视频、海报生成等） |
| 🧠 **模型库** | 最新模型 LoRA、Checkpoint，涵盖 FLUX、LTX-2、WanVideo、Illustrious 等 |
| 🔧 **工作流广场** | 全球创作者分享的 ComfyUI 工作流 |
| ⚡ **MCP 服务器** | 快速配置即调用的 MCP 服务（千问文生海报、即梦文生图、Wan2.5 图生视频等） |
| 🔌 **BizyAirPlus 插件** | ComfyUI 插件，连接本地 ComfyUI 到云端 GPU（[GitHub](https://github.com/siliconflow/BizyAirPlus)） |
| 🌍 **生态社区** | 基于 BizyAir API 二次开发的开源项目展示 |

> 文档中心：[docs.bizyair.cn](https://docs.bizyair.cn)

---

## ☕ 赞助

如果这个工具对你有帮助，欢迎扫码赞助，支持项目持续维护：

<p align="center">
  <img src="赞助支付宝二维码.jpg" width="250" alt="支付宝赞助二维码" />
</p>

---

## ✨ 功能特性

| 特性 | 说明 |
|------|------|
| 🗂️ **多 Tab 并行** | 同时运行多个生成任务，每个 Tab 独立互不干扰 |
| 🧠 **智能参数识别** | 自动识别参数类型（图像、音频、文本、数字），生成对应输入控件 |
| 🔑 **API Key 自动轮换** | 多 Key 管理 + 限流/排队时自动切换，避免手动换 Key |
| 💰 **余额监控** | 实时显示各 Key 的 BZ 币余额，欠费前及时知晓 |
| 🖼️ **多媒体预览** | 生成结果直接预览图像 / 视频 / 音频，无需额外工具 |
| 📥 **结果拖入输入** | 生成好的图片直接拖到另一个 Tab 作为输入，串联工作流 |
| 🏷️ **参数类型记忆** | 记住你手动修正的参数类型，下次自动匹配 |
| 📂 **输出归档** | 成功生成后自动保存到本地，支持相册浏览和缩略图 |

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
├── 🗄️ backend/                  # Express 后端
│   └── 📜 server.cjs           # 主服务器 (2,083 行)
├── ⚛️ src/                      # React 前端
│   ├── 🧩 components/          # 组件库
│   ├── 📄 App.jsx              # 主应用
│   └── 🚀 main.jsx             # 入口
├── 🖥️ electron/                # Electron 桌面壳
│   ├── ⚙️ main.cjs            # 主进程
│   └── 🔌 preload.cjs          # 预加载脚本
├── 🖼️ backgrounds/              # 桌面背景（仅 backgrounds.jpg）
├── ⬆️ uploads/                  # 用户上传（git 忽略）
├── 🗂️ 输出/                     # 任务输出（git 忽略）
├── 📑 调用示例/                 # 示例文件
├── 📘 使用教程/                 # 教程截图
├── 🔑 apikey.json               # API Key 配置（提交 git，打包进 exe）
├── 📋 apps.json                 # 应用配置（提交 git，打包进 exe）
├── 🗃️ apps_new.json             # 用户新增应用配置（覆盖 apps.json）
├── ⚙️ config.json               # 配置文件
├── 🎨 icons/                    # 应用图标
└── 📦 package.json              # 单根依赖
```

---

## 🚀 快速开始

以下步骤帮你从源码构建并运行 BizyAir API 桌面工具，安装后即可通过图形界面调用 BizyAir 应用进行内容生成。

### 📋 前置要求

| 工具 | 版本 |
|------|------|
| ⚡ **Node.js** | 18+ |
| 📦 **npm** | 9+ |
| 🪟 **OS** | Windows 10+ |

### ⚡ 安装依赖

```bash
git clone https://github.com/MaoYouShiJie/bizyairAPI.git
cd bizyairAPI
npm install
```

### 📦 构建前端

```bash
npm run build
```

### 🔑 配置 API Key

`apikey.json` 是 API Key 配置文件（会被打包进 exe），编辑它填入你的 Key 即可使用。

### ▶️ 本地测试

```bash
npm run electron:prod   # F12 打开 DevTools
```

### 📦 打包分发

```bash
npm run dist            # exe 安装包 → release/
npm run dist:portable   # 便携版（单 exe 文件）
```

---

## 🎮 使用流程

### 0️⃣ 添加 API Key
> 🔑 点击左下角设置图标 → 在 Config 面板中添加你的 BizyAir API Key → 支持添加多个 Key，开启自动轮换

### 1️⃣ 选择应用
> ➕ 从左侧应用列表点击添加到桌面，或拖入 BizyAir 调用示例 `.txt` 文件快速导入

### 2️⃣ 配置参数
> 🧠 自动识别参数类型并生成对应控件：图像拖入即上传，文本直接编辑，下拉选项自动填充

### 3️⃣ 运行生成
> ▶️ 点击"运行"→ 自动调用 BizyAir API → 实时进度条 + 运行时长 → 多 Tab 可同时运行

### 4️⃣ 获取结果
> 🎯 生成完成后直接预览图像/视频/音频，或下载到本地。结果图片可拖拽到其他 Tab 作为输入，串联多个应用

---

## 🔑 API Key 管理

| 功能 | 说明 |
|------|------|
| 🔑 **多 Key 支持** | 添加任意数量 API Key，一键切换当前使用的 Key |
| 🔄 **自动轮换** | 开启后每次提交任务自动切换 Key，分摊用量 |
| 🔁 **失败重试** | 遇限流 (429) / 队列满 (30039) / 并行超限 (30040) / 余额不足时，自动用下一个 Key 重试 |
| 💰 **余额监控** | 打开设置面板自动显示各 Key 的赠送余额和充值余额，生成成功自动刷新 |

---

## ❓ 常见问题

<details>
<summary><b>❌ 后端启动失败</b></summary>

确保 `npm install` 已完成，`backend/server.cjs` 存在。首次运行时会从安装目录复制默认配置到 exe 所在目录。
</details>

<details>
<summary><b>🔑 API Key 不生效</b></summary>

检查 `apikey.json` 格式是否正确，`id` 不能重复。
</details>

<details>
<summary><b>🌐 网络连接问题</b></summary>

- 检查系统代理设置
- 确认 API Key 未过期
- `WSALookupServiceBegin` 错误是 Chromium 内部信息，不影响使用
</details>

<details>
<summary><b>🪟 窗口相关问题</b></summary>

按 **F12** 打开开发者工具。
</details>

---

## 📜 许可证

<p align="center">
  <b>MIT</b> · 用 ❤️ 为 BizyAir 用户打造
</p>
