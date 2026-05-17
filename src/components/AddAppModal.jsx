import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'

export default function AddAppModal({ onClose, onSuccess, onMinimize, hidden, zIndex }) {
  const [newAppName, setNewAppName] = useState('')
  const [newAppCode, setNewAppCode] = useState('')
  const [codeType, setCodeType] = useState('javascript')
  const [error, setError] = useState('')
  const [maximized, setMaximized] = useState(false)
  const windowRef = useRef(null)
  const [pos, setPos] = useState(() => {
    if (typeof window !== 'undefined') {
      return { x: Math.max(0, (window.innerWidth - 560) / 2), y: Math.max(0, (window.innerHeight - 560) / 2) }
    }
    return { x: 100, y: 80 }
  })
  const [size, setSize] = useState({ w: 560, h: 560 })
  const dragRef = useRef(null)

  const handleMouseDown = (e) => {
    if (maximized) return
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const startPos = { ...pos }
    const onMove = (ev) => {
      setPos({ x: startPos.x + ev.clientX - startX, y: startPos.y + ev.clientY - startY })
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const toggleMinimize = () => onMinimize && onMinimize()
  const codeTypeHeaders = { javascript: '// JavaScript 示例代码\n', python: '# Python 示例代码\n', shell: '# Shell 示例代码\n' }

  const handleManualAdd = async () => {
    if (!newAppName.trim() || !newAppCode.trim()) {
      setError('请填写应用名称和示例代码')
      return
    }
    try {
      setError('')
      const header = codeTypeHeaders[codeType]
      const fullCode = newAppCode.trim().startsWith('#') || newAppCode.trim().startsWith('//') ? newAppCode.trim() : header + newAppCode.trim()
      await axios.post('/api/apps', {
        name: newAppName.trim(),
        exampleCode: fullCode
      })
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error || '添加失败')
    }
  }
  const toggleMaximize = () => setMaximized(!maximized)

  return (
    <div
      ref={windowRef}
      className="fixed bg-slate-900 border border-white/20 rounded-lg shadow-2xl overflow-hidden"
      style={{
        left: maximized ? 0 : pos.x,
        top: maximized ? 0 : pos.y,
        width: maximized ? '100vw' : size.w,
        height: maximized ? '100vh' : size.h,
        zIndex: zIndex || 1,
        display: hidden ? 'none' : 'block'
      }}
      onMouseDown={() => {}}      
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation() }}
    >
      {/* 标题栏 */}
      <div
        className={`h-10 bg-black flex items-center justify-between px-4 select-none ${maximized ? '' : 'cursor-move'}`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-400">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span className="text-white text-sm font-medium">添加应用</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); toggleMinimize() }} className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400" title="最小化" />
          <button onClick={(e) => { e.stopPropagation(); toggleMaximize() }} className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400" title="最大化" />
          <button onClick={(e) => { e.stopPropagation(); onClose() }} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400" title="关闭" />
        </div>
      </div>

      {/* 内容 */}
      <div className="h-[calc(100%-40px)] flex flex-col p-4 overflow-y-auto">
        {error && (
          <div className="mb-3 p-3 bg-red-500/20 border border-red-500 rounded text-red-300 text-sm shrink-0">{error}</div>
        )}

        <div className="flex-1 flex flex-col gap-3 min-h-0">
          <div>
            <label className="block text-white/70 text-sm mb-1">应用名称</label>
            <input
              type="text"
              value={newAppName}
              onChange={(e) => setNewAppName(e.target.value)}
              placeholder="输入应用名称"
              className="w-full px-4 py-2 bg-slate-800 border border-white/20 rounded text-white"
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm mb-1">代码类型</label>
            <select
              value={codeType}
              onChange={(e) => setCodeType(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-full px-4 py-2 bg-slate-800 border border-white/20 rounded text-white text-sm"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="shell">Shell</option>
            </select>
          </div>
          <div className="flex-1 min-h-0">
            <label className="block text-white/70 text-sm mb-1">示例代码</label>
            <textarea
              value={newAppCode}
              onChange={(e) => setNewAppCode(e.target.value)}
              placeholder='curl -X POST "https://api.bizyair.cn/w/v1/webapp/task/openapi/create" ...'
              className="w-full h-[calc(100%-22px)] px-4 py-2 bg-slate-800 border border-white/20 rounded text-white font-mono text-sm resize-none"
            />
          </div>
          <button
            onClick={handleManualAdd}
            className="w-full shrink-0 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-medium text-sm"
          >
            添加应用
          </button>
        </div>
      </div>
  </div>
  )
}
