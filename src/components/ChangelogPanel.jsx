import React, { useState, useEffect, useRef } from 'react'

export default function ChangelogPanel({ onClose, onMinimize, onMaximize, maximized, zIndex, onBringToFront }) {
  const [position, setPosition] = useState({ x: Math.max(0, (window.innerWidth - 560) / 2), y: 100 })
  const [size, setSize] = useState({ width: 560, height: 500 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDir, setResizeDir] = useState('')
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 })

  const isMaximized = maximized || false
  const maximizedStyle = { left: 0, top: 48, width: '100vw', height: 'calc(100vh - 48px - 56px)' }
  const windowStyle = isMaximized ? maximizedStyle : { left: position.x, top: position.y, width: size.width, height: size.height }

  const handleMouseDown = (e) => {
    if (e.target.closest('.window-controls')) return
    if (isMaximized) return
    e.preventDefault()
    setIsDragging(true)
    setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleResizeStart = (e, dir) => {
    if (isMaximized) return
    e.stopPropagation()
    e.preventDefault()
    setIsResizing(true)
    setResizeDir(dir)
    setResizeStart({ x: e.clientX, y: e.clientY, width: size.width, height: size.height, posX: position.x, posY: position.y })
  }

  useEffect(() => {
    const maxY = window.innerHeight - 56
    const handleMouseMove = (e) => {
      if (isDragging && !isMaximized) {
        let ny = Math.max(48, e.clientY - dragOffset.y)
        ny = Math.min(ny, maxY - size.height)
        let nx = Math.max(0, e.clientX - dragOffset.x)
        nx = Math.min(nx, window.innerWidth - size.width)
        setPosition({ x: nx, y: ny })
      } else if (isResizing && !isMaximized) {
        const dx = e.clientX - resizeStart.x
        const dy = e.clientY - resizeStart.y
        let nw = resizeStart.width, nh = resizeStart.height, nx = resizeStart.posX, ny = resizeStart.posY
        if (resizeDir.includes('e')) nw = Math.max(300, resizeStart.width + dx)
        if (resizeDir.includes('s')) nh = Math.min(Math.max(200, resizeStart.height + dy), maxY - resizeStart.posY)
        if (resizeDir.includes('w')) { nw = Math.max(300, resizeStart.width - dx); nx = resizeStart.posX + resizeStart.width - nw }
        if (resizeDir.includes('n')) { nh = Math.max(200, resizeStart.height - dy); ny = Math.max(48, resizeStart.posY + resizeStart.height - nh) }
        setSize({ width: nw, height: nh })
        setPosition({ x: nx, y: ny })
      }
    }
    const handleMouseUp = () => { setIsDragging(false); setIsResizing(false) }
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp) }
    }
  }, [isDragging, isResizing, dragOffset, resizeStart, resizeDir, isMaximized, size.height])

  return (
    <div
      className="fixed rounded-lg shadow-2xl overflow-hidden pointer-events-auto"
      style={{
        ...windowStyle,
        zIndex,
        background: 'linear-gradient(180deg, #FFF9C4 0%, #FFF176 100%)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.15)',
      }}
      onMouseDown={() => onBringToFront?.()}
    >
      {/* 标题栏 */}
      <div
        className={`h-10 flex items-center justify-between px-4 select-none ${isMaximized ? '' : 'cursor-move'}`}
        style={{ background: '#FFF9C4', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
        onMouseDown={handleMouseDown}
      >
        <span className="text-sm font-semibold text-amber-900/60">更新日志</span>
        <div className="flex items-center gap-2 window-controls">
          <button onClick={(e) => { e.stopPropagation(); onMinimize() }} className="w-3 h-3 rounded-full bg-yellow-400 hover:bg-yellow-300 transition-colors border border-yellow-500/30" title="最小化" />
          <button onClick={(e) => { e.stopPropagation(); onMaximize && onMaximize() }} className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors border border-green-600/30" title="最大化" />
          <button onClick={(e) => { e.stopPropagation(); onClose() }} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors border border-red-600/30" title="关闭" />
        </div>
      </div>

      {/* 内容 */}
      <div className="px-5 py-4 text-amber-900 space-y-4 overflow-y-auto" style={{ height: 'calc(100% - 40px)' }}>
        <div>
          <h3 className="font-bold text-base flex items-center gap-2">
            v0.0.1
            <span className="text-xs bg-amber-200/60 px-2 py-0.5 rounded-full font-normal">初始版本</span>
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm leading-relaxed pl-4">
            <li className="list-disc list-outside">基础应用管理系统：添加、编辑、删除应用</li>
            <li className="list-disc list-outside">多标签页运行：支持同时运行多个任务</li>
            <li className="list-disc list-outside">API Key 管理：支持多 Key 和自动切换</li>
            <li className="list-disc list-outside">桌面背景自定义：支持图片、颜色和透明度</li>
            <li className="list-disc list-outside">应用图标拖拽排序</li>
            <li className="list-disc list-outside">Electron 桌面应用打包</li>
          </ul>
        </div>

        <div className="border-t border-amber-800/15 pt-3">
          <p className="text-xs text-amber-800/60">
            BizyAir API Desktop · 基于 BizyAir 平台构建
          </p>
        </div>
      </div>

      {/* 拖拽缩放手柄 */}
      <div className="absolute top-0 left-0 w-1 h-full cursor-w-resize hover:bg-amber-400/30" onMouseDown={(e) => handleResizeStart(e, 'w')} />
      <div className="absolute top-0 right-0 w-1 h-full cursor-e-resize hover:bg-amber-400/30" onMouseDown={(e) => handleResizeStart(e, 'e')} />
      <div className="absolute bottom-0 left-0 w-full h-1 cursor-s-resize hover:bg-amber-400/30" onMouseDown={(e) => handleResizeStart(e, 's')} />
      <div className="absolute top-0 left-0 w-full h-1 cursor-n-resize hover:bg-amber-400/30" onMouseDown={(e) => handleResizeStart(e, 'n')} />
      <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize" onMouseDown={(e) => handleResizeStart(e, 'se')} />
    </div>
  )
}
