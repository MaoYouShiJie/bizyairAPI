import React, { useState } from 'react'

export default function DesktopContextMenu({ 
  x, y, app, settings, onClose, onOpenApp, onEditApp, onUninstallApp, onRefreshApps, onSaveSettings, onShowChangelog, onShowAppDetails, onShowSettings
}) {
  const [activeSubmenu, setActiveSubmenu] = useState(null)

  // 应用右键菜单
  if (app) {
    return (
      <div 
        className="fixed bg-slate-800/95 backdrop-blur-sm border border-white/20 rounded-xl shadow-2xl py-1 min-w-[200px] z-[10000] animate-fadeIn"
        style={{ 
          left: Math.min(x, window.innerWidth - 220), 
          top: Math.min(y, window.innerHeight - 300)
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-2 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img src={app.icon || '/logo002.png'} alt="" className="w-10 h-10 rounded-lg" style={{ backgroundColor: app.iconBgColor || '#6366f1' }} />
            <div>
              <p className="text-white font-medium">{app.name}</p>
              <p className="text-white/50 text-xs">{app.isDefault ? '默认应用' : '自定义应用'}</p>
            </div>
          </div>
        </div>
        
        <div className="py-1">
          <MenuItem 
            label="打开" 
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            }
            onClick={() => { onOpenApp && onOpenApp(app); onClose() }}
          />
          <MenuItem 
            label="编辑" 
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            }
            onClick={() => { onEditApp && onEditApp(app); onClose() }}
          />
          <MenuItem 
            label="详情" 
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            }
            onClick={() => { onShowAppDetails && onShowAppDetails(app); onClose() }}
          />
          
          {!app.isDefault && (
            <>
              <MenuDivider />
              <MenuItem 
                label="卸载" 
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                }
                danger
                onClick={() => { 
                  onClose()
                  setTimeout(() => {
                    const confirmed = window.confirm(`确定要卸载 "${app.name}" 吗？`)
                    if (confirmed && onUninstallApp) {
                      onUninstallApp(app)
                    }
                  }, 50)
                }}
              />
            </>
          )}
        </div>
      </div>
    )
  }

  // 桌面空白处右键菜单
  return (
    <div 
      className="fixed bg-slate-800/95 backdrop-blur-sm border border-white/20 rounded-xl shadow-2xl py-1 min-w-[200px] z-[10000] animate-fadeIn"
      style={{ 
        left: Math.min(x, window.innerWidth - 220), 
        top: Math.min(y, window.innerHeight - 350)
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="py-1">
        <MenuDivider />
        
        {/* 查看子菜单 */}
        <div className="relative">
          <MenuItem 
            label="查看" 
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            }
            hasSubmenu
            onHover={() => setActiveSubmenu('view')}
            onClick={() => setActiveSubmenu(activeSubmenu === 'view' ? null : 'view')}
          />
          {activeSubmenu === 'view' && (
            <Submenu x={190} y={-8}>
              <MenuItem 
                label="小图标" 
                icon={settings?.iconSize === 'small' ? <CheckIcon /> : <span className="w-4" />}
                onClick={() => { onSaveSettings({ ...settings, iconSize: 'small' }); onClose() }}
              />
              <MenuItem 
                label="中等图标" 
                icon={settings?.iconSize === 'medium' || !settings?.iconSize ? <CheckIcon /> : <span className="w-4" />}
                onClick={() => { onSaveSettings({ ...settings, iconSize: 'medium' }); onClose() }}
              />
              <MenuItem 
                label="大图标" 
                icon={settings?.iconSize === 'large' ? <CheckIcon /> : <span className="w-4" />}
                onClick={() => { onSaveSettings({ ...settings, iconSize: 'large' }); onClose() }}
              />
            </Submenu>
          )}
        </div>

        {/* 排序子菜单 */}
        <div className="relative">
          <MenuItem 
            label="排序方式" 
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
              </svg>
            }
            hasSubmenu
            onHover={() => setActiveSubmenu('sort')}
            onClick={() => setActiveSubmenu(activeSubmenu === 'sort' ? null : 'sort')}
          />
          {activeSubmenu === 'sort' && (
            <Submenu x={190} y={-8}>
              <MenuItem 
                label="按名称" 
                icon={settings?.sortBy === 'name' || !settings?.sortBy ? <CheckIcon /> : <span className="w-4" />}
                onClick={() => { onSaveSettings({ ...settings, sortBy: 'name', appOrder: null }); onRefreshApps(); onClose() }}
              />
              <MenuItem 
                label="按创建时间" 
                icon={settings?.sortBy === 'created' ? <CheckIcon /> : <span className="w-4" />}
                onClick={() => { onSaveSettings({ ...settings, sortBy: 'created', appOrder: null }); onRefreshApps(); onClose() }}
              />
              <MenuItem 
                label="自定义排序" 
                icon={settings?.sortBy === 'custom' ? <CheckIcon /> : <span className="w-4" />}
                onClick={() => { onSaveSettings({ ...settings, sortBy: 'custom', appOrder: settings?.appOrder || null }); onRefreshApps(); onClose() }}
              />
              <MenuDivider />
              <MenuItem 
                label="升序" 
                icon={settings?.sortOrder === 'asc' || !settings?.sortOrder ? <CheckIcon /> : <span className="w-4" />}
                onClick={() => { onSaveSettings({ ...settings, sortOrder: 'asc' }); onRefreshApps(); onClose() }}
              />
              <MenuItem 
                label="降序" 
                icon={settings?.sortOrder === 'desc' ? <CheckIcon /> : <span className="w-4" />}
                onClick={() => { onSaveSettings({ ...settings, sortOrder: 'desc' }); onRefreshApps(); onClose() }}
              />
            </Submenu>
          )}
        </div>

        <MenuDivider />
        
        <MenuItem 
          label="桌面设置" 
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .35 1.65l1.35 1.35a1.65 1.65 0 0 1-2.2 2.2l-1.35-1.35a1.65 1.65 0 0 0-1.65-.35 12.02 12.02 0 0 1-6.9 0 1.65 1.65 0 0 0-1.65.35l-1.35 1.35a1.65 1.65 0 0 1-2.2-2.2l1.35-1.35a1.65 1.65 0 0 0 .35-1.65 12.02 12.02 0 0 1 0-6.9A1.65 1.65 0 0 0 4.6 6.45L3.25 5.1a1.65 1.65 0 0 1 2.2-2.2l1.35 1.35a1.65 1.65 0 0 0 1.65.35 12.02 12.02 0 0 1 6.9 0 1.65 1.65 0 0 0 1.65-.35l1.35-1.35a1.65 1.65 0 0 1 2.2 2.2l-1.35 1.35a1.65 1.65 0 0 0-.35 1.65 12.02 12.02 0 0 1 0 6.9z"/>
            </svg>
          }
          onClick={() => { onShowSettings?.(); onClose() }}
        />
        <MenuItem 
          label="刷新" 
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 0 17 0"/><path d="M20.49 9A9 9 0 1 0 21 12"/>
            </svg>
          }
          onClick={() => { onRefreshApps(); onClose(); window.location.reload() }}
        />
        <MenuDivider />
        <MenuItem 
          label="更新日志" 
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
          }
          onClick={() => { onShowChangelog && onShowChangelog(); onClose() }}
        />
      </div>
    </div>
  )
}

function MenuItem({ label, icon, hasSubmenu, danger, onClick, onHover }) {
  return (
    <button
      className={`
        w-full px-4 py-2 flex items-center gap-3 text-sm transition-colors
        ${danger ? 'text-red-400 hover:bg-red-500/20' : 'text-white hover:bg-white/10'}
      `}
      onClick={onClick}
      onMouseEnter={onHover}
    >
      <span className="w-4 h-4 flex items-center justify-center text-white/70">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {hasSubmenu && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/50">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      )}
    </button>
  )
}

function MenuDivider() {
  return <div className="h-px bg-white/10 my-1" />
}

function Submenu({ x, y, children }) {
  return (
    <div 
      className="absolute bg-slate-800/95 backdrop-blur-sm border border-white/20 rounded-xl shadow-2xl py-1 min-w-[160px]"
      style={{ left: x, top: y }}
    >
      {children}
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}
