<p align="center">
  <img src="public/logo002.png" width="120" alt="BizyAir API Tool" />
</p>

<h1 align="center">🚀 BizyAir API Tool</h1>

<p align="center">
  <a href="README.md">🇨🇳 中文</a>
</p>

<p align="center">
  <b>Desktop client for BizyAir — Multi-tab task management · Auto-switch API Keys · Balance query</b>
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

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📑 **Multi-tab** | Each tab runs independently — parallel task execution |
| 🧠 **Smart Parameter Detection** | Auto-detects parameter types (image, audio, text, number, etc.) |
| 🔑 **API Key Management** | Multiple keys, auto-rotate, automatic retry on failure |
| 💰 **Balance Query** | Real-time BZ coin balance for each key |
| 🖼️ **Desktop App** | Native window experience, Electron packaging, F12 DevTools |
| 🖥️ **Custom Wallpaper** | Custom background image with transparent taskbar |
| 📂 **Gallery** | Auto-archived task outputs with thumbnail preview |
| 🔄 **Auto Retry** | Rate-limit / queue-full / low-balance → auto switch to next key |

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
├── 📦 backend/                  # Express backend
│   └── 📜 server.cjs           # Main server (2,083 lines)
├── ⚛️ src/                      # React frontend
│   ├── 🧩 components/          # Component library
│   ├── 📄 App.jsx              # Main app
│   └── 🚀 main.jsx             # Entry point
├── 🖥️ electron/                # Electron shell
│   ├── ⚙️ main.cjs            # Main process
│   └── 🔌 preload.cjs          # Preload script
├── 🖼️ backgrounds/              # Wallpapers (only backgrounds.jpg tracked)
├── 📤 uploads/                  # User uploads (gitignored)
├── 📁 输出/                     # Task outputs (gitignored)
├── 📚 调用示例/                 # Example files
├── 📖 使用教程/                 # Tutorial screenshots
├── 🔑 apikey.json               # API key template (committed)
├── 🔒 apikey_new.json           # Your real keys (gitignored)
├── 📋 apps.json                 # App template (committed)
├── 📋 apps_new.json             # Your apps (gitignored)
├── ⚙️ config.json               # Config file
├── 🎨 icons/                    # App icons
└── 📦 package.json              # Single-root dependencies
```

---

## 🚀 Quick Start

### 📋 Prerequisites

| Tool | Version |
|------|---------|
| ⚡ **Node.js** | 18+ |
| 📦 **npm** | 9+ |
| 🪟 **OS** | Windows 10+ |

### 💿 Installation

```bash
git clone https://github.com/MaoYouShiJie/bizyairAPI.git
cd bizyairAPI
npm install
```

### 🔑 Configure API Keys

Edit `apikey_new.json` (your keys, **not tracked by git**):

```json
[
  {
    "id": "my-key",
    "name": "Primary Key",
    "apiKey": "sk-your-api-key-here",
    "baseUrl": "https://api.bizyair.cn"
  }
]
```

The backend merges `apikey.json` (template) + `apikey_new.json` (your keys) on load, and saves to `apikey_new.json` — the template is never modified.

### ▶️ Run

```bash
# 🔬 Development mode (HMR)
npm run dev

# 🏭 Production mode (Electron, recommended)
npm run electron:prod

# 📦 Package as exe installer
npm run dist
```

---

## 🎮 Usage Guide

### 1️⃣ Add an App
> 📥 Click an app in the sidebar to add it to the desktop, or drag in a `.txt` example file

### 2️⃣ Edit Parameters
> 🧠 Parameters are auto-detected with proper input controls; upload images / audio as needed

### 3️⃣ Run a Task
> ▶️ Click "Run" → API call → real-time progress polling → multi-tab parallel execution

### 4️⃣ View Results
> 👁️ Preview images / video / audio, view elapsed time, download original files

---

## 🔑 API Key Management

| Feature | Description |
|---------|-------------|
| 🔑 **Multiple Keys** | Add any number of API keys, switch freely |
| 🔄 **Auto-rotate** | Tasks automatically cycle through keys when enabled |
| 🔁 **Retry on Failure** | Rate-limit (429) / queue-full (30039) / low-balance → auto switch |
| 💰 **Balance Query** | Real-time BZ coin balance (gift + charge) for each key |

---

## 🏗️ Build & Deploy

```bash
# Build frontend
npm run build

# Test production build
npm run electron:prod       # Quick test, F12 opens DevTools

# Package as exe installer
npm run dist                # Output to release/

# Package as portable exe
npm run dist:portable       # Single exe file
```

---

## ❓ FAQ

<details>
<summary><b>❌ Backend fails to start</b></summary>

Ensure `npm install` has completed and `backend/server.cjs` exists. Default configs are copied from resources on first run.
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

- Press **F12** to open DevTools
- Window right edge is automatically clamped
- Click taskbar icon to restore from minimized state
</details>

---

## 📜 License

<p align="center">
  <b>MIT</b> · Made with ❤️ for BizyAir users
</p>
