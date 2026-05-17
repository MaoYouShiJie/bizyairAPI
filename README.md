# BizyAir API 工具

BizyAir 应用的桌面客户端，支持多 Tab 任务管理、API Key 自动切换、余额查询、相册管理等功能。

## 功能特性

- **多 Tab 任务管理** — 同时提交多个任务，每个 Tab 独立运行
- **智能参数识别** — 自动识别参数类型（图像、音频、文本、数字等）
- **API Key 管理** — 多 Key 管理、自动轮换、失败自动重试
- **余额查询** — 实时查看 BZ 币余额
- **桌面应用** — 原生窗口体验，Electron 打包
- **相册管理** — 任务输出自动归档，支持缩略图预览

## 技术栈

- **前端**: React 18 + Tailwind CSS + Vite
- **后端**: Node.js + Express + Sharp
- **桌面**: Electron (目标迁移 Tauri)
- **API**: BizyAir OpenAPI

## 项目结构

```
bizyairAPI/
├── backend/                  # Express 后端
│   └── server.cjs           # 主服务器（2,083 行）
├── electron/                 # Electron 桌面壳
│   ├── main.cjs             # 主进程
│   └── preload.cjs          # 预加载脚本
├── src/                      # React 前端
│   ├── components/          # React 组件
│   ├── App.jsx              # 主应用
│   └── main.jsx             # 入口
├── backgrounds/              # 桌面背景（只跟踪 backgrounds.jpg）
├── uploads/                  # 用户上传文件（git 忽略）
├── 输出/                     # 任务输出（git 忽略）
├── 调用示例/                 # 示例文件
├── 使用教程/                 # 使用教程截图
├── apikey.json               # API Key 模板（提交到 git）
├── apikey_new.json           # 你的真实 Key（git 忽略）
├── apps.json                 # 应用配置模板
├── apps_new.json             # 你的应用配置（git 忽略）
├── config.json               # 配置文件
├── icons/                    # 应用图标
└── package.json              # 单根 package.json
```

## 快速开始

### 前置要求

- Node.js 18+
- npm

### 安装依赖

```bash
npm install
```

### 配置 API Key

1. 编辑 `apikey.json`（模板，已提交 git）或 `apikey_new.json`（你的真实 Key，git 忽略）：

```json
[
  {
    "id": "key-1",
    "name": "我的 Key",
    "apiKey": "sk-your-api-key-here",
    "baseUrl": "https://api.bizyair.cn"
  }
]
```

2. 后端自动合并 `apikey.json` + `apikey_new.json`，`saveBizConfig` 写入 `apikey_new.json`。

### 启动应用

**开发模式：**
```bash
npm run dev
```

**生产模式（Electron）：**
```bash
npm run electron:prod
```

**打包 exe：**
```bash
npm run dist
```

## 使用指南

### 1. 添加应用

- 从左侧应用列表点击添加到桌面
- 或拖入 BizyAir 调用示例 `.txt` 文件

### 2. 编辑参数

- 工具自动识别参数类型并生成对应输入控件
- 支持上传图像、音频文件

### 3. 运行任务

- 点击"运行"按钮
- 自动调用 BizyAir API 并轮询结果
- 支持多 Tab 并行任务
- 失败时自动切换其他 Key 重试

### 4. 查看结果

- 支持预览图像、视频、音频
- 显示运行时间等统计信息
- 可下载原始文件

## API Key 管理

- **多 Key 支持** — 可添加多个 API Key
- **自动轮换** — 开启后任务自动轮换使用不同 Key
- **失败重试** — 限流/排队/余额不足时自动用下一个 Key 重试
- **余额查询** — 实时显示各 Key 的 BZ 币余额

## 构建部署

```bash
# 构建前端
npm run build

# 测试生产构建
npm run electron:prod     # 快捷测试，F12 打开 DevTools

# 打包 exe 安装包
npm run dist              # 输出到 release/

# 打包便携版
npm run dist:portable
```

## 常见问题

### 后端启动失败

确保 `backend/server.cjs` 存在且 `npm install` 已完成。

### API Key 不生效

- `apikey_new.json` 中的 Key 会覆盖 `apikey.json`
- 检查 `apikey_new.json` 格式是否正确

### 网络连接问题

如果无法连接 BizyAir：
- 检查网络代理设置
- 确认 API Key 有效且未过期

### Electron DevTools

运行后按 **F12** 打开开发者工具。

## 许可证

MIT
