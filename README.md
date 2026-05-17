# 🚀 BizyAir API 工具

一个功能强大的网页应用，用于轻松调用 BizyAir 应用生成内容。

## ✨ 功能特性

- 📁 **拖入示例文件** - 支持拖入 BizyAir 应用的调用示例 .txt 文件
- 🧠 **智能参数识别** - 自动识别参数类型（图像、音频、文本、数字等）
- 📝 **友好表单生成** - 根据参数类型自动生成对应的输入控件
- 🎨 **实时预览** - 支持图像、视频、音频的实时预览
- 💾 **自动保存** - 成功调用后自动保存示例文件到对应分类文件夹
- 🔄 **任务轮询** - 自动轮询任务状态，实时显示进度
- 🏷️ **参数学习** - 记住参数类型，下次自动应用

## 🛠️ 技术栈

- **前端**: React 18 + TypeScript + Tailwind CSS + Vite
- **后端**: Node.js + Express
- **API**: BizyAir OpenAPI

## 📦 项目结构

```
bizyairAPI/
├── frontend/                 # React 前端应用
│   ├── src/
│   │   ├── components/      # React 组件
│   │   ├── App.jsx          # 主应用
│   │   └── index.css        # 样式
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/                  # Node.js 后端
│   ├── server.js            # 主服务器
│   └── package.json
├── 调用示例/                 # 示例文件存储
│   ├── 图像/
│   │   ├── 文生图/
│   │   └── 图生图/
│   ├── 视频/
│   │   ├── 图生视频/
│   │   └── 文生视频/
│   └── 音频/
│       ├── 克隆/
│       └── 其他/
├── config.json              # 配置文件（API Key）
├── parameter-types.json     # 参数类型库
└── README.md
```

## 🚀 快速开始

### 前置要求

- Node.js 16+
- npm 或 yarn

### 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 配置 API Key

编辑 `config.json`，填入你的 BizyAir API Key：

```json
{
  "apiKey": "sk-your-api-key-here",
  "apiBaseUrl": "https://api.bizyair.cn/w/v1/webapp/task/openapi",
  "pollInterval": 2000,
  "maxPollAttempts": 300,
  "examplesDir": "./调用示例"
}
```

### 启动应用

**终端 1 - 启动后端：**
```bash
cd backend
npm start
```

**终端 2 - 启动前端：**
```bash
cd frontend
npm run dev
```

访问 `http://localhost:3000` 即可使用工具。

## 📖 使用指南

### 1. 上传示例文件

- 拖入或选择 BizyAir 应用的调用示例 .txt 文件
- 工具会自动解析文件中的 JSON 数据

### 2. 编辑参数

- 工具自动识别参数类型并生成对应的输入控件
- 支持修改参数类型（如果识别错误）
- 支持上传图像、音频文件

### 3. 运行任务

- 点击"运行任务"按钮
- 工具自动调用 BizyAir API 并轮询结果
- 任务完成后显示输出结果

### 4. 查看结果

- 支持预览图像、视频、音频
- 显示详细的执行统计信息
- 可下载原始文件

### 5. 自动保存

- 成功调用后，示例文件自动保存到对应分类文件夹
- 参数类型自动更新到参数类型库

## 🔧 参数类型识别

工具使用以下优先级识别参数类型：

1. **精确匹配** - 查询已知参数库
2. **模糊匹配** - 去掉前缀数字，匹配其他示例中的相同参数
3. **智能推断** - 根据参数名和值类型推断
4. **用户修改** - 用户可手动修改参数类型

### 支持的参数类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `text` | 单行文本 | 参数值 |
| `textarea` | 多行文本 | 长提示词 |
| `number` | 整数 | 种子、宽度、高度 |
| `float` | 浮点数 | 去噪强度 |
| `boolean` | 布尔值 | true/false |
| `image` | 图像 | 图像 URL 或 Base64 |
| `audio` | 音频 | 音频 URL 或 Base64 |
| `select` | 选择 | 采样器名称 |

## 📁 应用分类规则

工具根据输入和输出类型自动分类应用：

- **输入有图像 + 输出有视频** → `视频/图生视频/`
- **输入有图像 + 输出只有图像** → `图像/图生图/`
- **输入有音频 + 输出有音频** → `音频/克隆/`
- **其他** → 对应的分类文件夹

## 🔐 安全性

- API Key 仅保存在本地 `config.json` 文件中
- 所有文件操作都在本地进行
- 支持在工具中更新 API Key

## 🐛 故障排除

### 问题：无法连接到后端

**解决方案：**
- 确保后端服务已启动（`npm start`）
- 检查后端是否运行在 `http://localhost:3003`
- 检查防火墙设置

### 问题：参数类型识别错误

**解决方案：**
- 在表单中手动修改参数类型
- 工具会记住你的选择
- 下次相同参数会自动应用

### 问题：任务超时

**解决方案：**
- 检查网络连接
- 增加 `config.json` 中的 `maxPollAttempts`
- 尝试使用更简单的应用

## 📝 API 端点

### 后端 API

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/parse-example` | 解析示例文件 |
| POST | `/api/run-task` | 运行任务 |
| GET | `/api/task-status/:request_id` | 获取任务状态 |
| POST | `/api/save-example` | 保存示例文件 |
| POST | `/api/config/api-key` | 更新 API Key |
| GET | `/api/config` | 获取配置 |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📞 支持

如有问题，请提交 Issue 或联系开发者。

---

**祝你使用愉快！** 🎉
