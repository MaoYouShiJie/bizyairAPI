import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'

export default function DesktopSettings({ settings, onClose, onSave, onPreview, onCancel }) {
  const [localSettings, setLocalSettings] = useState({
    iconSize: 'medium',
    sortBy: 'name',
    sortOrder: 'asc',
    backgroundImage: null,
    backgroundSize: 'cover',
    desktopOpacity: 100,
  })
  const [message, setMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [historyImages, setHistoryImages] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const sliderRef = useRef(null)

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        iconSize: settings.iconSize || 'medium',
        sortBy: settings.sortBy || 'name',
        sortOrder: settings.sortOrder || 'asc',
        backgroundImage: settings.backgroundImage || null,
        backgroundSize: settings.backgroundSize || 'cover',
        desktopOpacity: settings.desktopOpacity ?? 100,
      })
    }
    setLoadingHistory(true)
    axios.get('/api/apps/backgrounds')
      .then(r => { setHistoryImages(r.data.backgrounds); setLoadingHistory(false) })
      .catch(() => setLoadingHistory(false))
  }, [])

  const handleSave = async () => {
    try {
      await axios.post('/api/apps/settings', localSettings)
      onSave(localSettings)
      onCancel?.()
      onClose()
    } catch (err) {
      setMessage('❌ 保存失败')
    }
  }

  const handleImageUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', file.name)
    formData.append('size', file.size)
    try {
      const response = await axios.post('/api/apps/background', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setLocalSettings(prev => ({ ...prev, backgroundImage: response.data.url }))
      setMessage('✅ 背景图片已设置')
      setTimeout(() => setMessage(''), 2000)
    } catch (err) {
      setMessage('❌ 上传失败')
    }
  }

  const handleFileSelect = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) handleImageUpload(file)
    }
    input.click()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleImageUpload(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleSliderInteraction = (e) => {
    if (!sliderRef.current) return
    const rect = sliderRef.current.getBoundingClientRect()
    let x = e.clientX - rect.left
    x = Math.max(0, Math.min(x, rect.width))
    const value = Math.round((x / rect.width) * 100)
    setLocalSettings(prev => {
      const next = { ...prev, desktopOpacity: value }
      onPreview?.(next)
      return next
    })
  }

  const handleMouseDown = (e) => {
    e.stopPropagation()
    setIsDragging(true)
    handleSliderInteraction(e)
  }

  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e) => {
        e.stopPropagation()
        handleSliderInteraction(e)
      }
      const handleMouseUp = () => setIsDragging(false)
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging])

  const opacity = localSettings.desktopOpacity ?? 100
  const sliderLeft = opacity + '%'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
      <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">桌面设置</h2>
          <button onClick={() => { onCancel?.(); onClose() }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {message && (
            <div className="p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-300 text-sm">{message}</div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-white/80 font-medium shrink-0">桌面背景</h3>
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-xs shrink-0">显示方式</span>
                <select
                  value={localSettings.backgroundSize || 'cover'}
                  onChange={(e) => {
                    const next = { ...localSettings, backgroundSize: e.target.value }
                    setLocalSettings(next)
                    onPreview?.(next)
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="px-2 py-1.5 bg-slate-800 border border-white/20 rounded text-white/70 text-xs"
                >
                  <option value="cover">填充</option>
                  <option value="contain">适应</option>
                  <option value="repeat">平铺</option>
                </select>
              </div>
            </div>

            <div 
              className={"relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 " + (isDragOver ? 'ring-2 ring-indigo-500' : '')} 
              style={{ height: '200px' }}
            >
              {localSettings.backgroundImage ? (
                <>
                  <img src={localSettings.backgroundImage} alt="桌面背景" className="w-full h-full object-contain pointer-events-none" draggable={false} style={{ objectPosition: 'center' }} />
                  <div 
                    className="absolute inset-0 group" 
                    onClick={handleFileSelect} 
                    onDrop={handleDrop} 
                    onDragOver={handleDragOver} 
                    onDragLeave={handleDragLeave}
                  >
                    <div className="absolute inset-0 hover:bg-black/30 transition-colors duration-200" />
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); const next = { ...localSettings, backgroundImage: null }; setLocalSettings(next); onPreview?.(next) }} 
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition z-10"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs bg-black/60 px-3 py-1 rounded-lg">点击更换图片</span>
                  </div>
                </>
              ) : (
                <div 
                  className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-white/20 transition-colors" 
                  onClick={handleFileSelect} 
                  onDrop={handleDrop} 
                  onDragOver={handleDragOver} 
                  onDragLeave={handleDragLeave}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/40">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                  <div className="text-center">
                    <p className="text-white/60 text-sm">点击上传或拖放图片</p>
                    <p className="text-white/30 text-xs mt-1">推荐 1920×1080</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-white/60 text-xs">历史图片</p>
            {loadingHistory ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : historyImages.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-4">暂无历史图片</p>
            ) : (
              <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto">
                {historyImages.map((img, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => {
                      const next = { ...localSettings, backgroundImage: img.url }
                      setLocalSettings(next)
                      onPreview?.(next)
                    }} 
                    className={"relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500 transition " + (localSettings.backgroundImage === img.url ? 'ring-2 ring-green-500' : '')}
                  >
                    <img src={img.url} alt={img.name} className="w-full h-full object-contain pointer-events-none" />
                    {localSettings.backgroundImage === img.url && (
                      <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white/80 font-medium">主界面透明度</h3>
              <span className="text-indigo-400 font-mono text-sm">{opacity}%</span>
            </div>
            <div 
              ref={sliderRef} 
              className="relative h-6 cursor-pointer select-none" 
              onMouseDown={handleMouseDown}
            >
              <div 
                className="absolute inset-0 rounded-lg overflow-hidden" 
                style={{ 
                  background: 'linear-gradient(to right, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.02) 100%)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)'
                }}
              >
                <div 
                  className="absolute inset-0" 
                  style={{ 
                    backgroundImage: 'linear-gradient(45deg, #1a1a2e 25%, transparent 25%), linear-gradient(-45deg, #1a1a2e 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a2e 75%), linear-gradient(-45deg, transparent 75%, #1a1a2e 75%)',
                    backgroundSize: '8px 8px',
                    backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                    opacity: 0.3 
                  }} 
                />
              </div>
              <div 
                className="absolute top-0 bottom-0 w-2 rounded-full cursor-grab active:cursor-grabbing" 
                style={{ 
                  left: `calc(${sliderLeft} - 4px)`,
                  background: 'linear-gradient(to right, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.15) 100%)',
                  boxShadow: '-2px 0 4px rgba(0,0,0,0.4), 2px 0 4px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.9)'
                }} 
              />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-white/20 rounded-full" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-white/10 rounded-full" />
            </div>
            <div className="flex justify-between text-xs text-white/40 px-1">
              <span>不透明</span><span>透明</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10 bg-black/20 shrink-0">
          <button onClick={() => { onCancel?.(); onClose() }} className="px-5 py-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition">取消</button>
          <button onClick={handleSave} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition font-medium">保存</button>
        </div>
      </div>
    </div>
  )
}
