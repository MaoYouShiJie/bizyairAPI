<p align="center">
  <img src="public/logo002.png" width="120" alt="BizyAir API Tool" />
</p>

<h1 align="center">🚀 BizyAir API Tool</h1>

<p align="center">
  <a href="README.md">🇨🇳 中文</a>
</p>

<p align="center">
  <b>Desktop client for BizyAir API — Call BizyAir apps through a GUI for text-to-image, image-to-image, image-to-video, text-to-video, audio cloning, and more AI content generation</b>
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

## 🎯 About

**BizyAir API Tool** is a desktop client that lets you **call BizyAir AI apps without writing any code**.

### What it does

BizyAir offers a wide range of AI apps (image generation, video generation, audio synthesis, etc.). Calling their APIs directly requires writing HTTP requests, handling parameter formats, and polling task status. This tool wraps everything into a graphical interface:

| Scenario | Traditional way | With this tool |
|----------|---------------|----------------|
| 🖼️ **Text-to-Image / Image-to-Image** | Write JSON, curl API, parse responses | Pick an app → fill params → click run → get results |
| 🎬 **Image-to-Video / Text-to-Video** | Handle Base64 encoded image/video data | Just drag & drop images, auto-upload |
| 🎵 **Audio Cloning / Generation** | Manage audio file URLs manually | Upload and use, everything handled |
| 🔄 **Batch tasks** | Write scripts with loops | Open multiple tabs, run in parallel |

### Core workflow

```
Pick a BizyAir app → Edit input parameters → Click run
    ↓
Auto-call API → Real-time progress polling → Show results when done
    ↓
          Preview / download / save to local
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🗂️ **Multi-tab Parallel** | Run multiple generation tasks simultaneously, each tab independent |
| 🧠 **Smart Parameter Detection** | Auto-detects parameter types (image, audio, text, number) with proper input controls |
| 🔑 **Auto Key Rotation** | Multiple keys + auto-switch on rate-limit/queue-full, no manual key swapping |
| 💰 **Balance Monitor** | Real-time BZ coin balance for each key, know before you run out |
| 🖼️ **Media Preview** | Preview generated images / video / audio directly, no extra tools needed |
| 📥 **Drag Result to Input** | Drag a generated image to another tab as input — chain apps together |
| 🏷️ **Parameter Memory** | Remembers your manual parameter type corrections for next time |
| 📂 **Output Archive** | Auto-saves successful generations locally with gallery browsing and thumbnails |

---

## 🛠️ Tech Stack

<table>
  <tr>
    <th align="center" colspan="2">Frontend</th>
    <th align="center" colspan="2">Backend</th>
    <th align="center">Desktop</th>
  </tr>
  <tr>
    <td align="center"><img src="https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/react.svg" width="24" /><br/><b>React 18</b></td>
    <td align="center"><img src="https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/tailwindcss.svg" width="24" /><br/><b>Tailwind CSS</b></td>
    <td align="center"><img src="https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/express.svg" width="24" /><br/><b>Express</b></td>
    <td align="center"><img src="https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/sharp.svg" width="24" /><br/><b>Sharp</b></td>
    <td align="center"><img src="https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/electron.svg" width="24" /><br/><b>Electron</b></td>
  </tr>
  <tr>
    <td align="center" colspan="2">Vite 5 Build</td>
    <td align="center">BizyAir Proxy</td>
    <td align="center">Thumbnail Generation</td>
    <td align="center">Packaging & Distribution</td>
  </tr>
</table>

---

## 📁 Project Structure

```
bizyairAPI/
├── 🗄️ backend/                  # Express backend
│   └── 📜 server.cjs           # Main server (2,083 lines)
├── ⚛️ src/                      # React frontend
│   ├── 🧩 components/          # Component library
│   ├── 📄 App.jsx              # Main app
│   └── 🚀 main.jsx             # Entry point
├── 🖥️ electron/                # Electron shell
│   ├── ⚙️ main.cjs            # Main process
│   └── 🔌 preload.cjs          # Preload script
├── 🖼️ backgrounds/              # Wallpapers (only backgrounds.jpg tracked)
├── ⬆️ uploads/                  # User uploads (gitignored)
├── 🗂️ 输出/                     # Task outputs (gitignored)
├── 📑 调用示例/                 # Example files
├── 📘 使用教程/                 # Tutorial screenshots
├── 🔑 apikey.json               # Production key config (committed, packaged)
├── 🔒 apikey_new.json           # Test keys (gitignored, not packaged)
├── 📋 apps.json                 # Production app config (committed, packaged)
├── 🗃️ apps_new.json             # Test app config (gitignored, not packaged)
├── ⚙️ config.json               # Config file
├── 🎨 icons/                    # App icons
└── 📦 package.json              # Single-root dependencies
```

---

## 🚀 Quick Start

Follow these steps to build and run the BizyAir API desktop tool, then start generating content through BizyAir apps with a graphical interface.

### 📋 Prerequisites

| Tool | Version |
|------|---------|
| ⚡ **Node.js** | 18+ |
| 📦 **npm** | 9+ |
| 🪟 **OS** | Windows 10+ |

### ⚡ Installation

```bash
git clone https://github.com/MaoYouShiJie/bizyairAPI.git
cd bizyairAPI
npm install
```

### 📦 Build Frontend

```bash
npm run build
```

### 🔑 Configure API Keys

`apikey.json` is the production key config (packaged into the exe). `apikey_new.json` is for test keys (**not tracked by git, not packaged into the exe**) — drop keys in temporarily for testing before packaging, no need to delete manually.

### ▶️ Test Locally

```bash
npm run electron:prod   # F12 opens DevTools
```

### 📦 Package

```bash
npm run dist            # exe installer → release/
npm run dist:portable   # portable version (single exe file)
```

---

## 🎮 Usage Workflow

### 0️⃣ Add API Key
> 🔑 Click the settings icon in the bottom-left → Add your BizyAir API keys in the Config panel → Add multiple keys and enable auto-rotation

### 1️⃣ Pick an App
> ➕ Click an app in the sidebar to add it to the desktop, or drag in a BizyAir `.txt` example file

### 2️⃣ Configure Parameters
> 🧠 Parameters are auto-detected with proper controls: drag & drop images, edit text directly, pick from dropdowns

### 3️⃣ Run Generation
> ▶️ Click "Run" → auto-call BizyAir API → real-time progress bar + elapsed time → multiple tabs run simultaneously

### 4️⃣ Get Results
> 🎯 Preview images / video / audio directly after generation, or download to local. Drag result images to another tab as input to chain multiple apps

---

## 🔑 API Key Management

| Feature | Description |
|---------|-------------|
| 🔑 **Multiple Keys** | Add any number of API keys, switch with one click |
| 🔄 **Auto-rotate** | Automatically cycles through keys on each submission to balance usage |
| 🔁 **Retry on Failure** | Rate-limit (429) / queue-full (30039) / parallelism exceeded (30040) / low-balance → auto switch to next key |
| 💰 **Balance Monitor** | Displays gift + charge balance for each key when settings panel opens, auto-refreshes on success |

---

## ❓ FAQ

<details>
<summary><b>❌ Backend fails to start</b></summary>

Ensure `npm install` has completed and `backend/server.cjs` exists. Default configs are copied from the install directory to the exe directory on first run.
</details>

<details>
<summary><b>🔑 API Key not working</b></summary>

- Keys in `apikey_new.json` override those in `apikey.json`
- Check that the JSON is valid and `id` values are unique
</details>

<details>
<summary><b>🌐 Network issues</b></summary>

- Check your system proxy settings
- Verify the API key has not expired
- `WSALookupServiceBegin` errors are Chromium internals — harmless
</details>

<details>
<summary><b>🪟 Window issues</b></summary>

Press **F12** to open DevTools.
</details>

---

## 📜 License

<p align="center">
  <b>MIT</b> · Made with ❤️ for BizyAir users
</p>
