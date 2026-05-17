import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Desktop from './components/Desktop'
import AppWindow from './components/AppWindow'
import DesktopContextMenu from './components/DesktopContextMenu'
import DesktopSettings from './components/DesktopSettings'
import ConfigPanel from './components/ConfigPanel'
import AddAppModal from './components/AddAppModal'
import Gallery from './components/Gallery'
import ChangelogPanel from './components/ChangelogPanel'

const APP_VERSION = '0.0.1'

export default function App() {
  const [apps, setApps] = useState([])
  const [settings, setSettings] = useState(null)
  const [openWindows, setOpenWindows] = useState([])
  const [showSettings, setShowSettings] = useState(false)
  const [showApiKeys, setShowApiKeys] = useState(false)
  const [showAddApp, setShowAddApp] = useState(false)
  const [addAppMinimized, setAddAppMinimized] = useState(false)
  const [addAppZIndex, setAddAppZIndex] = useState(1)
  const [showGallery, setShowGallery] = useState(false)
  const [changelogMaximized, setChangelogMaximized] = useState(false)
  const [contextMenu, setContextMenu] = useState(null)
  const [showDebug, setShowDebug] = useState(false)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const desktopRef = useRef(null)

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { timestamp, message, type }])
  }

  useEffect(() => {
    loadData()
    
    // 监听添加应用事件（用 ref 避免闭包捕获过期函数）
    const handler = () => setShowAddApp(true)
    window.addEventListener('showAddApp', handler)
    return () => window.removeEventListener('showAddApp', handler)
  }, [])

  // 当 showAddApp 变为 true 时更新 z-index（避免 stale closure）
  useEffect(() => {
    if (showAddApp) {
      setAddAppZIndex(getMaxZIndex() + 1)
    }
  }, [showAddApp])

  const loadData = async () => {
    try {
      const response = await axios.get('/api/apps')
      setApps(response.data.apps)
      setSettings(response.data.settings || {})
      addLog('✅ 应用列表加载成功，共 ' + response.data.apps.length + ' 个应用')
    } catch (err) {
      console.error('Failed to load data:', err)
      addLog('❌ 加载失败: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenApp = (app) => {
    addLog('📱 打开应用: ' + app.name)
    const existingWindow = openWindows.find(w => w.id === app.id)
    
    if (existingWindow) {
      // 如果已打开
      if (existingWindow.minimized) {
        // 最小化了则恢复
        handleRestoreWindow(app.id)
      } else {
        // 未最小化则提升到最前
        bringToFront(app.id)
      }
    } else {
      // 新打开应用
      setOpenWindows([...openWindows, { ...app, zIndex: getMaxZIndex() + 1 }])
    }
  }

  const handleCloseWindow = (appId) => {
    addLog('❌ 关闭应用')
    setOpenWindows(openWindows.filter(w => w.id !== appId))
  }

  const handleMinimizeWindow = (appId) => {
    setOpenWindows(openWindows.map(w => 
      w.id === appId ? { ...w, minimized: true } : w
    ))
  }

  const handleMaximizeWindow = (appId) => {
    setOpenWindows(openWindows.map(w => 
      w.id === appId ? { ...w, maximized: !w.maximized } : w
    ))
  }

  const handleRestoreWindow = (appId) => {
    setOpenWindows(openWindows.map(w => 
      w.id === appId ? { ...w, minimized: false, zIndex: getMaxZIndex() + 1 } : w
    ))
  }

  // 任务栏点击处理：最上层应用点击最小化，下层应用点击置顶
  const handleTaskbarClick = (w) => {
    if (w.minimized) {
      handleRestoreWindow(w.id)
    } else {
      // 看是否有比当前窗口更高的窗口（包括添加应用弹窗）
      const hasHigherActive = openWindows.some(x => !x.minimized && (x.zIndex || 0) > (w.zIndex || 0))
      const addAppHigher = showAddApp && !addAppMinimized && addAppZIndex > (w.zIndex || 0)
      if (hasHigherActive || addAppHigher) {
        bringToFront(w.id)
      } else {
        handleMinimizeWindow(w.id)
      }
    }
  }

  const bringToFront = (appId) => {
    setOpenWindows(openWindows.map(w => 
      w.id === appId ? { ...w, zIndex: getMaxZIndex() + 1 } : w
    ))
  }

  const getMaxZIndex = () => {
    const windowMax = Math.max(0, ...openWindows.map(w => w.zIndex || 0))
    return showAddApp ? Math.max(windowMax, addAppZIndex) : windowMax
  }

  const handleContextMenu = (e, app = null, type = 'app') => {
    // 如果是添加应用图标点击，直接打开弹窗
    if (type === 'add') {
      setShowAddApp(true)
      setAddAppZIndex(getMaxZIndex() + 1)
      return
    }
    // 如果有弹窗打开（资产库、API Key、设置、添加应用），不显示桌面右键菜单
    if (showGallery || showApiKeys || showSettings || showAddApp) {
      return
    }
    if (e) e.preventDefault()
    setContextMenu({
      x: e?.clientX || 100,
      y: e?.clientY || 100,
      app: app
    })
  }

  const closeContextMenu = () => {
    setContextMenu(null)
  }

  useEffect(() => {
    const handleClick = () => closeContextMenu()
    if (contextMenu) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [contextMenu])

  const refreshApps = async () => {
    addLog('🔄 刷新应用列表...')
    await loadData()
  }

  const clearLogs = () => {
    setLogs([])
  }

  const handleSaveSettings = async (newSettings) => {
    try {
      await axios.post('/api/apps/settings', newSettings)
      setSettings(newSettings)
      addLog('✅ 设置已保存')
    } catch (err) {
      console.error('Failed to save settings:', err)
      addLog('❌ 保存设置失败', 'error')
    }
  }

  // 桌面设置实时预览（不保存到后端）
  const settingsSnapshotRef = useRef(null)
  const handlePreviewSettings = (newSettings) => {
    if (!settingsSnapshotRef.current) {
      settingsSnapshotRef.current = settings
    }
    setSettings(newSettings)
  }
  const handleCancelSettings = () => {
    if (settingsSnapshotRef.current) {
      setSettings(settingsSnapshotRef.current)
      settingsSnapshotRef.current = null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </div>
    )
  }

  const desktopOpacity = settings?.desktopOpacity ?? 100
  const actualOpacity = desktopOpacity / 100

  return (
    <div 
      ref={desktopRef}
      className="min-h-screen overflow-hidden select-none"
      style={{
        backgroundImage: settings?.backgroundImage ? `url(${settings.backgroundImage})` : 'none',
        backgroundColor: '#1a1a2e',
        backgroundSize: settings?.backgroundSize || 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: settings?.backgroundSize === 'repeat' ? 'repeat' : 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
      onContextMenu={(e) => handleContextMenu(e, null)}
      onClick={() => closeContextMenu()}
    >
      {/* 桌面内容 */}
      <div className="fixed inset-0 pointer-events-none" onClick={(e) => { if (e.target === e.currentTarget) closeContextMenu() }}>
        {/* 顶部栏 */}
        <div className="h-12 bg-black/80 flex items-center justify-between px-4 border-b border-white/10 pointer-events-auto" style={{ opacity: actualOpacity }}>
          <div className="flex items-center gap-4">
            <img src="/logo002.png" alt="Logo" className="h-8 w-auto" />
            <div>
              <span className="text-white font-bold">BizyAir</span>
              <span className="text-white/60 text-sm ml-2">API 工具</span>
              <a href={settings?.githubReleasesUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-gray-400 text-xs underline underline-offset-2 ml-2 hover:text-white transition">v{APP_VERSION}</a>
            </div>
          </div>
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className={`px-3 py-1.5 rounded flex items-center gap-2 border transition ${
                showDebug 
                  ? 'bg-black border-white/30 text-white' 
                  : 'bg-white/10 border-white/20 hover:bg-white/20 text-white'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M6 8l4 4-4 4"/>
                <line x1="12" y1="16" x2="18" y2="16"/>
              </svg>
              调试
            </button>
            
            <button
              onClick={() => setShowSettings(true)}
              className="px-3 py-1.5 bg-white/10 border border-white/20 hover:bg-white/20 text-white rounded flex items-center gap-2 transition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18M9 21V9"/>
              </svg>
              桌面
            </button>

            <button
              onClick={() => setShowApiKeys(true)}
              className="px-3 py-1.5 bg-white/10 border border-white/20 hover:bg-white/20 text-white rounded flex items-center gap-2 transition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
              </svg>
              API Key
            </button>

            <button
              onClick={() => setShowGallery(true)}
              className="px-3 py-1.5 bg-white/10 border border-white/20 hover:bg-white/20 text-white rounded flex items-center gap-2 transition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              资产库
            </button>
          </div>
        </div>

        {/* 调试日志面板 */}
        {showDebug && (
          <div className="absolute bottom-16 left-4 right-4 h-48 bg-black border border-white/20 rounded-xl overflow-hidden z-50 pointer-events-auto">
            <div className="flex justify-between items-center px-4 py-2 bg-black border-b border-white/20">
              <div className="flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M6 8l4 4-4 4"/>
                  <line x1="12" y1="16" x2="18" y2="16"/>
                </svg>
                <span className="text-white text-sm font-medium">调试日志</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { navigator.clipboard.writeText(logs.map(l => `[${l.timestamp}] ${l.message}`).join('\n')); addLog('📋 调试日志已复制') }}
                  className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 text-white/80 rounded transition pointer-events-auto"
                >
                  复制
                </button>
                <button
                  onClick={clearLogs}
                  className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 text-white/80 rounded transition pointer-events-auto"
                >
                  清除
                </button>
              </div>
            </div>
            <div className="h-[calc(100%-36px)] p-2 overflow-y-auto font-mono text-xs space-y-0.5">
              {logs.length === 0 ? (
                <div className="text-slate-500 italic p-2">暂无日志...</div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className={
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'success' ? 'text-green-400' :
                    'text-slate-400'
                  }>
                    <span className="text-slate-600">[{log.timestamp}]</span> {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 桌面区域 */}
        <Desktop
          apps={apps}
          settings={settings}
          onOpenApp={handleOpenApp}
          onContextMenu={handleContextMenu}
          onRefreshApps={refreshApps}
          addLog={addLog}
          showAddApp={showAddApp}
          onShowAddApp={() => setShowAddApp(false)}
        />
        
        {/* 添加应用弹窗（由 Desktop 内部或右键菜单触发） */}
        {/* 打开的窗口 - 不过滤最小化的窗口，保持组件挂载以保留状态 */}
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9998 }}>
          {showAddApp && (
            <div className="pointer-events-auto">
              <AddAppModal zIndex={addAppZIndex} hidden={addAppMinimized} onClose={() => { setShowAddApp(false); setAddAppMinimized(false) }} onSuccess={() => { setShowAddApp(false); setAddAppMinimized(false); refreshApps() }} onMinimize={() => setAddAppMinimized(true)} />
            </div>
          )}
          {openWindows.map(window => (
            window.id === '__changelog__' ? (
              <div key={window.id} className="pointer-events-auto" style={{ display: window.minimized ? 'none' : 'block' }}>
                <ChangelogPanel
                  zIndex={window.zIndex}
                  onClose={() => handleCloseWindow('__changelog__')}
                  onMinimize={() => handleMinimizeWindow('__changelog__')}
                  onMaximize={() => setChangelogMaximized(v => !v)}
                  maximized={changelogMaximized}
                  onBringToFront={() => bringToFront('__changelog__')}
                />
              </div>
            ) : (
              <div key={window.id} className="pointer-events-auto" style={{ display: window.minimized ? 'none' : 'block' }}>
                <AppWindow
                  app={window}
                  onClose={() => handleCloseWindow(window.id)}
                  onMinimize={() => handleMinimizeWindow(window.id)}
                  onMaximize={() => handleMaximizeWindow(window.id)}
                  onBringToFront={() => bringToFront(window.id)}
                  addLog={addLog}
                />
              </div>
            )
          ))}
        </div>
      </div>

      {/* 任务栏 */}
      {(openWindows.length > 0 || showAddApp || addAppMinimized) && (
        <div className="fixed bottom-0 left-0 right-0 h-14 bg-black/90 backdrop-blur border-t border-white/20 z-[10001] flex items-center px-4 gap-1" style={{ opacity: actualOpacity }}>
          {showAddApp && (
            <button
              onClick={() => {
                if (addAppMinimized) {
                  setAddAppMinimized(false)
                  setAddAppZIndex(getMaxZIndex() + 1)
                } else {
                  const hasHigher = openWindows.some(x => !x.minimized && (x.zIndex || 0) > addAppZIndex)
                  if (hasHigher) {
                    setAddAppZIndex(getMaxZIndex() + 1)
                  } else {
                    setAddAppMinimized(true)
                  }
                }
              }}
              className={`h-10 px-3 rounded-lg flex items-center gap-2 transition-all ${
                !addAppMinimized ? 'bg-indigo-600/80 text-white' : 'bg-white/10 hover:bg-white/20 text-white/80'
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={!addAppMinimized ? 'text-white' : 'text-white/70'}>
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span className="text-sm truncate max-w-[120px]">添加应用</span>
            </button>
          )}
          {openWindows.map(w => {
            const isActive = !w.minimized
            const isChangelog = w.id === '__changelog__'
            return (
              <button
                key={w.id}
                onClick={() => handleTaskbarClick(w)}
                className={`h-10 px-3 rounded-lg flex items-center gap-2 transition-all ${
                  isActive
                    ? (isChangelog ? 'bg-amber-600/80 text-white' : 'bg-indigo-600/80 text-white')
                    : 'bg-white/10 hover:bg-white/20 text-white/80'
                }`}
              >
                {isChangelog ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isActive ? 'text-white' : 'text-white/70'}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                ) : (
                  <img src={w.icon || '/logo002.png'} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" style={{backgroundColor: w.iconBgColor || '#6366f1'}} />
                )}
                <span className="text-sm truncate max-w-[120px]">{w.name}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* 右键菜单（在外面，不受透明度影响） */}
      {contextMenu && (
        <DesktopContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          app={contextMenu.app}
          settings={settings}
          onClose={closeContextMenu}
          onShowSettings={() => setShowSettings(true)}
          onOpenApp={handleOpenApp}
          onEditApp={(app) => {
            closeContextMenu()
            setOpenWindows([...openWindows, { ...app, zIndex: getMaxZIndex() + 1, isEditing: true }])
          }}
          onUninstallApp={async (app) => {
            try {
              await axios.delete(`/api/apps/${app.id}`)
              addLog(`✅ 已卸载: ${app.name}`)
              await refreshApps()
            } catch (err) {
              addLog(`❌ 卸载失败: ${err.message}`, 'error')
            }
          }}
          onRefreshApps={refreshApps}
          onSaveSettings={handleSaveSettings}
          onShowChangelog={() => {
            const existing = openWindows.find(w => w.id === '__changelog__')
            if (existing) {
              if (existing.minimized) {
                handleRestoreWindow('__changelog__')
              } else {
                bringToFront('__changelog__')
              }
            } else {
              setOpenWindows([...openWindows, { id: '__changelog__', name: '更新日志', minimized: false, zIndex: getMaxZIndex() + 1 }])
            }
          }}
          onShowAppDetails={(app) => {
            closeContextMenu()
            alert(`应用详情\n\n名称: ${app.name}\nID: ${app.id}\n创建时间: ${app.createdAt ? new Date(app.createdAt).toLocaleString() : '未知'}\n类型: ${app.isDefault ? '默认应用' : '自定义应用'}\n示例代码: ${app.exampleCode ? '有' : '无'}`)
          }}
        />
      )}

      {/* 设置面板（不受透明度影响） */}
      {showSettings && (
        <DesktopSettings
          settings={settings}
          onClose={() => { handleCancelSettings(); setShowSettings(false) }}
          onSave={handleSaveSettings}
          onPreview={handlePreviewSettings}
          onCancel={handleCancelSettings}
        />
      )}

      {showApiKeys && (
        <ConfigPanel onClose={() => setShowApiKeys(false)} />
      )}

      {/* 资产库 */}
      {showGallery && (
        <Gallery onClose={() => setShowGallery(false)} />
      )}
    </div>
  )
}
