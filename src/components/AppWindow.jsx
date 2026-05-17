import React, { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'

// ============ AudioUploader - 音频上传组件 ============
function AudioUploader({ paramKey, value, onChange }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [preview, setPreview] = useState(value || '')
  const [uploading, setUploading] = useState(false)
  const [audioName, setAudioName] = useState('')

  useEffect(() => {
    setPreview(value || '')
    // 从URL中提取文件名
    if (value && typeof value === 'string') {
      const name = value.split('/').pop() || ''
      setAudioName(decodeURIComponent(name))
    }
  }, [value])

  const uploadFile = async (file) => {
    if (!file) return
    setUploading(true)
    setAudioName(file.name)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', file.name)
      formData.append('size', file.size)
      const response = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const url = response.data.url
      setPreview(url)
      onChange(paramKey, url)
    } catch (err) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target.result)
        onChange(paramKey, e.target.result)
      }
      reader.readAsDataURL(file)
    } finally {
      setUploading(false)
    }
  }

  const handleClick = (e) => {
    e.stopPropagation()
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'audio/*'
    input.style.display = 'none'
    document.body.appendChild(input)
    input.onchange = (ev) => {
      const file = ev.target.files && ev.target.files[0]
      if (file) uploadFile(file)
      document.body.removeChild(input)
    }
    input.click()
  }

  const handleClear = (e) => {
    e.stopPropagation()
    setPreview('')
    setAudioName('')
    onChange(paramKey, '')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  const hasAudio = preview && (
    preview.startsWith('data:audio') ||
    preview.startsWith('http') ||
    preview.startsWith('/')
  )

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg overflow-hidden cursor-pointer transition-all ${
        isDragOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/20 hover:border-indigo-400'
      }`}
      style={{ height: '60px' }}
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
      onDragLeave={() => setIsDragOver(false)}
    >
      {uploading && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
          <span className="text-white text-xs">上传中..</span>
        </div>
      )}
      {hasAudio ? (
        <div className="flex items-center gap-3 p-3 group relative h-full">
          <div className="w-10 h-10 bg-indigo-600/30 rounded-lg flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-400">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs truncate">{audioName || '音频文件'}</div>
            <div className="text-slate-500 text-xs">点击更换</div>
          </div>
          {preview.startsWith('http') || preview.startsWith('/') ? (
            <audio
              src={preview}
              controls
              className="h-8 max-w-[120px]"
              onClick={(e) => e.stopPropagation()}
            />
          ) : null}
          {/* 清除按钮 */}
          <button
            onClick={handleClear}
            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/50 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10"
            title="清除"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-slate-500">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </div>
      )}
    </div>
  )
}

// ============ ImageUploader - 图像上传组件 ============
function ImageUploader({ paramKey, value, onChange, onDragStart, onDropOver, isDragOver, isDropTarget, showDropPopup, hideSwapBtn, onDropAction, leftAlign = false }) {
  const [localDragOver, setLocalDragOver] = useState(false)
  const [preview, setPreview] = useState(value || '')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    setPreview(value || '')
  }, [value])

  const uploadFile = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', file.name)
      formData.append('size', file.size)
      const response = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const url = response.data.url
      setPreview(url)
      onChange(paramKey, url)
    } catch (err) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target.result)
        onChange(paramKey, e.target.result)
      }
      reader.readAsDataURL(file)
    } finally {
      setUploading(false)
    }
  }

  const handleClick = (e) => {
    e.stopPropagation()
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.style.display = 'none'
    document.body.appendChild(input)
    input.onchange = (ev) => {
      const file = ev.target.files && ev.target.files[0]
      if (file) uploadFile(file)
      document.body.removeChild(input)
    }
    input.click()
  }

  const handleClear = (e) => {
    e.stopPropagation()
    setPreview('')
    onChange(paramKey, '')
  }

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', paramKey)
    e.dataTransfer.effectAllowed = 'move'
    onDragStart && onDragStart(paramKey)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    setLocalDragOver(true)
    onDropOver && onDropOver(paramKey)
  }

  const handleDragLeave = (e) => {
    e.stopPropagation()
    setLocalDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setLocalDragOver(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        uploadFile(file)
        return
      }
    }
    const fromKey = e.dataTransfer.getData('text/plain')
    if (fromKey && fromKey !== paramKey) {
      onDropAction && onDropAction(fromKey, paramKey)
    }
  }

  const showPreview = preview && (
    preview.startsWith('data:') ||
    preview.startsWith('http') ||
    preview.startsWith('/')
  )

  const isBeingDragged = isDragOver === paramKey
  const isDropHighlight = localDragOver || isDropTarget === paramKey

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg overflow-hidden cursor-pointer transition-all ${
        isBeingDragged ? 'opacity-50' : ''
      } ${
        isDropHighlight ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/50' : 'border-white/20 hover:border-indigo-400'
      }`}
      // 放大 1.5 倍以提高图像预览可见性（从 280px -> 420px）
      // 当 leftAlign 为 true 时（单图输入），不要水平居中，保持和多图时一致的左对齐
      style={{ aspectRatio: '9/16', maxHeight: '420px', margin: leftAlign ? '0' : '0 auto' }}
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      draggable={!!showPreview}
      onDragStart={handleDragStart}
    >
      {uploading && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
          <span className="text-white text-xs">上传中..</span>
        </div>
      )}
      {showPreview ? (
        <div className="relative group w-full h-full">
          <img src={preview.startsWith('http') ? '/api/proxy-image?url=' + encodeURIComponent(preview) : preview} alt="" className="w-full h-full object-contain" />
          {/* 悬停遮罩 */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="text-white text-xs bg-black/70 px-2 py-1 rounded">点击替换</span>
          </div>
          {/* 清除按钮 */}
          <button
            onClick={handleClear}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10"
            title="清除"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-slate-500">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </div>
      )}

      {/* Drop action popup */}
      {showDropPopup && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-2">
            {!hideSwapBtn && (
              <button
                onClick={(e) => { e.stopPropagation(); onDropAction && onDropAction('swap', paramKey) }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded"
              >
                交换
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDropAction && onDropAction('cover', paramKey) }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
            >
              覆盖
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDropAction && onDropAction('cancel', paramKey) }}
              className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white text-xs rounded"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============ VideoUploader - 视频上传组件 ============
function VideoUploader({ paramKey, value, onChange }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [preview, setPreview] = useState(value || '')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    setPreview(value || '')
  }, [value])

  const uploadFile = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', file.name)
      formData.append('size', file.size)
      const response = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const url = response.data.url
      setPreview(url)
      onChange(paramKey, url)
    } catch (err) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target.result)
        onChange(paramKey, e.target.result)
      }
      reader.readAsDataURL(file)
    } finally {
      setUploading(false)
    }
  }

  const handleClick = (e) => {
    e.stopPropagation()
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'video/*'
    input.style.display = 'none'
    document.body.appendChild(input)
    input.onchange = (ev) => {
      const file = ev.target.files && ev.target.files[0]
      if (file) uploadFile(file)
      document.body.removeChild(input)
    }
    input.click()
  }

  const handleClear = (e) => {
    e.stopPropagation()
    setPreview('')
    onChange(paramKey, '')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  const hasVideo = preview && (
    preview.startsWith('data:video') ||
    preview.startsWith('http') ||
    preview.startsWith('/')
  )

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg overflow-hidden cursor-pointer transition-all ${
        isDragOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/20 hover:border-indigo-400'
      }`}
      style={{ aspectRatio: '9/16', maxHeight: '420px' }}
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
      onDragLeave={() => setIsDragOver(false)}
    >
      {uploading && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
          <span className="text-white text-xs">上传中..</span>
        </div>
      )}
      {hasVideo ? (
        <div className="relative group w-full h-full">
          <video src={preview} className="w-full h-full object-contain" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="text-white text-xs bg-black/70 px-2 py-1 rounded">点击替换</span>
          </div>
          <button
            onClick={handleClear}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10"
            title="清除"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-slate-500">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </div>
      )}
    </div>
  )
}

// ============ 尺寸预设 ============
const SIZE_PRESETS = [
  { label: '1:1 方形', width: 1024, height: 1024 },
  { label: '16:9 横版', width: 1920, height: 1080 },
  { label: '9:16 竖版', width: 1080, height: 1920 },
  { label: '4:3 横版', width: 1024, height: 768 },
  { label: '3:4 竖版', width: 768, height: 1024 },
  { label: '自定义', width: null, height: null },
]

// ============ 滑块+输入框组件 ============
function SliderInput({ label, value, onChange, min = 256, max = 2048, step = 8, paramKey, locked, onLockToggle, counterpartKey, counterpartValue, aspectRatio }) {
  const numVal = parseInt(value) || min
  const showLock = onLockToggle !== undefined

  // 计算锁定时的边界限制
  const getConstrainedValue = (newVal) => {
    if (!locked || !aspectRatio) return newVal

    // 如果是宽度，检查对应高度是否在范围
    if (label === '宽度') {
      const newHeight = Math.round(newVal / aspectRatio)
      if (newHeight < min) return Math.round(min * aspectRatio)
      if (newHeight > max) return Math.round(max * aspectRatio)
    }
    // 如果是高度，检查对应宽度是否在范围
    if (label === '高度') {
      const newWidth = Math.round(newVal * aspectRatio)
      if (newWidth < min) return Math.round(min / aspectRatio)
      if (newWidth > max) return Math.round(max / aspectRatio)
    }
    return newVal
  }

  const handleChange = (newVal) => {
    const constrained = getConstrainedValue(newVal)
    onChange(paramKey, constrained)
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs text-slate-400">{label}</label>
        {showLock && (
          <button
            onClick={(e) => { e.stopPropagation(); onLockToggle() }}
            className={`p-1 rounded transition ${locked ? 'text-indigo-400 bg-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            title={locked ? '解锁宽高比' : '锁定宽高比'}
          >
            {locked ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
              </svg>
            )}
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={numVal}
          onChange={(e) => handleChange(parseInt(e.target.value))}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
        <input
          type="number"
          value={numVal}
          onChange={(e) => handleChange(parseInt(e.target.value) || min)}
          onClick={(e) => e.stopPropagation()}
          className="w-16 px-2 py-1 bg-slate-800 border border-white/20 rounded text-white text-sm text-center"
        />
      </div>
    </div>
  )
}

// ============ 输出结果项组件 ============
function OutputItem({ item, index, appName, onSave, onDelete, onView }) {
  const [showActions, setShowActions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [textContent, setTextContent] = useState(null)
  const [textLoading, setTextLoading] = useState(false)
  const [textCopied, setTextCopied] = useState(false)

  // 检测媒体类型
  const ext = item.object_url ? item.object_url.split('.').pop().toLowerCase() : ''
  const isVideo = item.object_url && ['mp4', 'webm', 'mov', 'avi', 'm4v'].includes(ext)
  const isAudio = item.object_url && ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'opus'].includes(ext)
  const isTextFile = item.object_url && ['json', 'txt', 'csv', 'md', 'log'].includes(ext)
  const isImage = item.object_url && !isVideo && !isAudio && !isTextFile

  // 获取文本文件内容
  React.useEffect(() => {
    if (isTextFile && item.object_url && !textContent && !textLoading) {
      setTextLoading(true)
      fetch(item.object_url)
        .then(r => r.text())
        .then(text => {
          // JSON 可能是纯字符串或对象
          try {
            const parsed = JSON.parse(text)
            setTextContent(typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2))
          } catch {
            setTextContent(text)
          }
        })
        .catch(err => setTextContent(`[加载失败: ${translateError(err.message)}]`))
        .finally(() => setTextLoading(false))
    }
  }, [isTextFile, item.object_url])

  const handleCopyText = () => {
    if (textContent) {
      navigator.clipboard.writeText(textContent)
      setTextCopied(true)
      setTimeout(() => setTextCopied(false), 2000)
    }
  }

  const handleSave = async (e) => {
    e.stopPropagation()
    setSaving(true)
    try {
      await onSave(item)
      setSaved(true)
    } catch (err) {
      console.error('保存失败:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = (e) => {
    e.stopPropagation()
    const link = document.createElement('a')
    link.href = item.object_url
    link.download = item.object_url.split('/').pop() || `output-${index}`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div
      className="bg-black/30 rounded-lg overflow-hidden relative group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {item.object_url && isVideo && (
        <video src={item.object_url} controls className="w-full" />
      )}
      {item.object_url && isAudio && (
        <div className="bg-slate-800 p-4 flex flex-col items-center gap-3">
          <audio src={item.object_url} controls className="w-full" />
          <span className="text-slate-400 text-xs">音频文件 · {ext.toUpperCase()}</span>
        </div>
      )}
      {item.object_url && isImage && (
        <img
          src={item.object_url}
          alt=""
          className="w-full object-contain cursor-pointer hover:opacity-90 transition"
          style={{ maxHeight: '60vh' }}
          onClick={() => onView && onView(item)}
        />
      )}
      {item.object_url && isTextFile && (
        <div className="bg-slate-800/80 p-4 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-xs flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              文本输出 · {ext.toUpperCase()}
            </span>
            {textContent && (
              <button
                onClick={handleCopyText}
                className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition flex items-center gap-1"
              >
                {textCopied ? (
                  <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> 已复制</>
                ) : (
                  <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> 复制</>
                )}
              </button>
            )}
          </div>
          {textLoading ? (
            <div className="text-slate-400 text-sm animate-pulse">加载中..</div>
          ) : textContent ? (
            <pre className="text-sm text-slate-200 whitespace-pre-wrap break-words leading-relaxed font-sans">{textContent}</pre>
          ) : (
            <div className="text-slate-500 text-xs">无法加载文本内容</div>
          )}
        </div>
      )}

      {/* 操作按钮 */}
      {showActions && (
        <div className="absolute top-2 right-2 flex gap-1.5">
          {(isImage || isAudio || isTextFile) && (
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className={`p-1.5 rounded-lg transition ${
                saved
                  ? 'bg-green-600 text-white'
                  : saving
                    ? 'bg-slate-600 text-slate-400'
                    : 'bg-black/70 hover:bg-black/90 text-white'
              }`}
              title={saved ? '已保存' : '保存到本地'}
            >
              {saved ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
              )}
            </button>
          )}
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white transition"
            title="下载"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(item) }}
              className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition"
              title="删除"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          )}
        </div>
      )}

      {item.cost_time && (
        <div className="p-2 text-xs text-slate-500 border-t border-white/10">
          耗时: {item.cost_time}ms
        </div>
      )}
      {!item.object_url && (
        <div className="p-3">
          {item.content && <div className="text-sm text-slate-300 whitespace-pre-wrap">{item.content}</div>}
          {item.prompt && <div className="text-sm text-slate-300 whitespace-pre-wrap">{item.prompt}</div>}
          {item.text && <div className="text-sm text-slate-300 whitespace-pre-wrap">{item.text}</div>}
          {!item.content && !item.prompt && !item.text && (
            <div className="text-xs text-slate-500">无预览内容</div>
          )}
        </div>
      )}
    </div>
  )
}

// 错误消息中文翻译
function translateError(msg) {
  if (!msg || typeof msg !== 'string') return msg || ''
  const map = [
    [/ConnectionClosedError[^)]*\)/gi, '连接已关闭'],
    [/no close frame received or sent/gi, '未收到或发送关闭帧'],
    [/timed? ?out/gi, '超时'],
    [/CUDA out of memory/i, 'GPU 显存不足'],
    [/OutOfMemoryError/i, '显存不足'],
    [/out of memory/i, '内存不足'],
    [/Killed/i, '进程被终止'],
    [/Connection refused/i, '连接被拒绝'],
    [/Cannot connect/i, '无法连接'],
    [/Execution error/i, '执行错误'],
    [/internal server error/i, '服务器内部错误'],
    [/unexpected error/i, '意外错误'],
    [/prompt execution got unexpected error/i, '提示词执行遇到意外错误'],
    [/Wait ComfyUl/i, 'ComfyUI 等待'],
    [/File not found/i, '文件未找到'],
    [/Permission denied/i, '权限不足'],
    [/Invalid input/i, '无效输入'],
    [/Invalid parameter/i, '无效参数'],
    [/Invalid /i, '无效的'],
    [/Network Error/i, '网络错误'],
    [/Failed to fetch/i, '请求失败'],
    [/Failed to /i, '失败：'],
    [/Unable to /i, '无法'],
    [/Error: /i, '错误：'],
    [/Request failed with status code (\d+)/gi, (_, code) => `请求失败 (状态码 ${code})`],
    [/connect ETIMEDOUT/i, '连接超时'],
    [/connect ECONNREFUSED/i, '连接被拒绝'],
    [/read ECONNRESET/i, '连接已断开'],
    [/socket hang up/i, '连接已断开'],
    [/(\d+)x\s+above recommended limit/i, '超出推荐限制'],
  ]
  let result = msg
  for (const [pattern, replacement] of map) {
    result = result.replace(pattern, replacement)
  }
  // 如果结果中包含大量英文，保留原始信息前加上中文说明
  if (result === msg && /[a-z]{4,}/i.test(msg) && !/[\u4e00-\u9fa5]/.test(msg)) {
    return `执行出错：${msg}`
  }
  return result
}

// ============ AppWindow 主组件 ============
export default function AppWindow({ app, onClose, onMinimize, onMaximize, onBringToFront }) {
  const [isEditing, setIsEditing] = useState(app.isEditing || false)
  const [appName, setAppName] = useState(app.name)
  const [exampleCode, setExampleCode] = useState(app.exampleCode || '')
  const [parameters, setParameters] = useState({})
  const [inputValues, setInputValues] = useState({})
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')
  const progressRef = useRef({})      // 按标签页存储进度值: { tabId: number }
  const progressRafRef = useRef({}) // 按标签页存储动画帧 ID: { tabId: rafId }
  const progressTargetRef = useRef({}) // 按标签页存储目标进度: { tabId: number }
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [logs, setLogs] = useState([])
  const [position, setPosition] = useState({ x: 80, y: 60 })
  const [size, setSize] = useState(() => {
    const w = Math.min(1200, Math.max(900, window.innerWidth - 160))
    const h = Math.min(700, Math.max(600, window.innerHeight - 56 - 120))
    return { width: w, height: h }
  })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDir, setResizeDir] = useState('')
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 })
  const [appIcon, setAppIcon] = useState(app.icon || '')
  const [webAppId, setWebAppId] = useState(app.web_app_id || '')
  const [editedParamTypes, setEditedParamTypes] = useState({})
  const [newOptionInputs, setNewOptionInputs] = useState({})
  const [editedParamLabels, setEditedParamLabels] = useState({})

  // 宽高比锁定
  const [aspectLocked, setAspectLocked] = useState(false)
  const [aspectRatio, setAspectRatio] = useState(1)

  // 尺寸预设选择
  const [selectedPreset, setSelectedPreset] = useState(0)

  // 图片查看器
  const [viewingImage, setViewingImage] = useState(null)

  // 图片拖放交换状态
  const [dragFromKey, setDragFromKey] = useState(null)
  const [dropTargetKey, setDropTargetKey] = useState(null)
  const [pendingSwap, setPendingSwap] = useState(null) // { from, to }

  // 输入框右键菜单
  const [inputContextMenu, setInputContextMenu] = useState(null)
  const [renamingParam, setRenamingParam] = useState(null)
  const [logsExpanded, setLogsExpanded] = useState(false)
  const [loadingParams, setLoadingParams] = useState(true)
  const runningTabRef = useRef(null) // 当前正在运行任务的标签页ID

  // 标签页系统（多开支持）
  const [tabs, setTabs] = useState([{ id: 'tab_1', name: app.name }])
  const [activeTabId, setActiveTabId] = useState('tab_1')
  const tabDataRef = useRef({ tab_1: { inputValues: {}, result: null, loading: false, progress: 0, progressText: '', error: null, logs: [] } })
  const nextTabIdRef = useRef(2)
  const [tabVersion, setTabVersion] = useState(0) // 递增计数器，触发重渲染

  const getActiveTabData = () => tabDataRef.current[activeTabId] || tabDataRef.current['tab_1'] || {}
  
  // 标签页切换时同步 tabDataRef → React state
  useEffect(() => {
    const data = getActiveTabData()
    setInputValues(data.inputValues || {})
    setResult(data.result)
    setLoading(data.loading || false)
    setProgress(data.progress || 0)
    setProgressText(data.progressText || '')
    setError(translateError(data.error))
    setLogs(data.logs || [])
  }, [activeTabId, tabVersion])

  const updateTabData = (tabId, updates) => {
    if (!tabDataRef.current[tabId]) return
    Object.assign(tabDataRef.current[tabId], updates)
    if (tabId === activeTabId) setTabVersion(v => v + 1)
  }

  const saveActiveTabData = useCallback(() => {
    updateTabData(activeTabId, { inputValues, result, loading, progress, progressText, error, logs })
  }, [activeTabId, inputValues, result, loading, progress, progressText, error, logs])

  const loadTabData = useCallback((tabId) => {
    setTabVersion(v => v + 1)
  }, [])

  const addTab = useCallback(() => {
    saveActiveTabData()
    const id = `tab_${nextTabIdRef.current++}`
    // 用当前参数的默认值初始化新标签页
    const defaultValues = {}
    Object.entries(parameters).forEach(([k, p]) => { defaultValues[k] = p.value })
    tabDataRef.current[id] = {
      inputValues: { ...defaultValues },
      result: null,
      loading: false,
      progress: 0,
      progressText: '',
      error: null,
      logs: []
    }
    setTabs(prev => [...prev, { id, name: appName }])
    setActiveTabId(id)
    // 标签页切换的 useEffect 会自动从 tabDataRef 同步数据到 React state
  }, [appName, saveActiveTabData])

  const closeTab = useCallback((tabId) => {
    if (tabs.length <= 1) return
    const idx = tabs.findIndex(t => t.id === tabId)
    saveActiveTabData()
    delete tabDataRef.current[tabId]
    const newTabs = tabs.filter(t => t.id !== tabId)
    setTabs(newTabs)
    if (activeTabId === tabId) {
      const nextIdx = Math.min(idx, newTabs.length - 1)
      setActiveTabId(newTabs[nextIdx].id)
      loadTabData(newTabs[nextIdx].id)
    }
  }, [tabs, activeTabId, saveActiveTabData, loadTabData])

  const switchTab = useCallback((tabId) => {
    if (tabId === activeTabId) return
    saveActiveTabData()
    setActiveTabId(tabId)
    // 立即同步 loading，确保按钮状态即时更新
    const data = tabDataRef.current[tabId]
    if (data) setLoading(data.loading || false)
    loadTabData(tabId)
  }, [activeTabId, saveActiveTabData, loadTabData])

  // 初始化第一个标签页的数据
  useEffect(() => {
    const firstTab = tabDataRef.current['tab_1']
    if (firstTab) {
      // 从现有 inputValues 复制到标签数据
      firstTab.inputValues = inputValues
    }
  }, [])

  const windowRef = useRef(null)

  const isMaximized = app.maximized || false
  const maximizedStyle = { left: 0, top: 48, width: '100vw', height: 'calc(100vh - 48px - 56px)' }
  const windowStyle = isMaximized ? maximizedStyle : { left: position.x, top: position.y, width: size.width, height: size.height }

  const addLog = (msg, type = 'info') => {
    const entry = { time: new Date().toLocaleTimeString(), msg, type }
    setLogs(prev => [...prev, entry])
    // 同步写入 tabData 避免 useEffect 覆盖
    const tab = tabDataRef.current[activeTabId]
    if (tab) {
      tab.logs = [...(tab.logs || []), entry]
      if (!runningTabRef.current || runningTabRef.current === activeTabId) {
        setTabVersion(v => v + 1)
      }
    }
  }

  // 初始化
  useEffect(() => {
    if (app.exampleCode) {
      parseExampleCode(app.exampleCode)
    } else {
      setLoadingParams(false)
    }
    // 组件卸载时清理进度动画帧
    return () => {
      Object.values(progressRafRef.current).forEach(rafId => {
        if (rafId) cancelAnimationFrame(rafId)
      })
    }
  }, [])

  const parseExampleCode = async (code) => {
    setLoadingParams(true)
    try {
      const formData = new FormData()
      const blob = new Blob([code], { type: 'text/plain' })
      formData.append('file', blob, 'example.txt')
      const response = await axios.post('/api/parse-example-direct?appId=' + app.id, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setParameters(response.data.parameters || {})
      setWebAppId(response.data.web_app_id || app.web_app_id || '')
      const vals = {}
      Object.entries(response.data.parameters || {}).forEach(([k, p]) => {
        vals[k] = p.value
      })
      setInputValues(vals)

      // 初始化宽高比
      const w = vals['width'] || vals['image_width'] || 1024
      const h = vals['height'] || vals['image_height'] || 1024
      setAspectRatio(w / h)
    } catch (err) {
      addLog('解析失败: ' + translateError(err.response?.data?.error || err.message), 'error')
    }
    setLoadingParams(false)
  }

  // 找出宽高参数的key
  const getWidthKey = () => Object.keys(inputValues).find(k =>
    k.toLowerCase().includes('width') && !k.toLowerCase().includes('height')
  )
  const getHeightKey = () => Object.keys(inputValues).find(k =>
    k.toLowerCase().includes('height') && !k.toLowerCase().includes('width')
  )

  // 获取参数显示名称（优先自定义名称，其次 label，最后原始 key）
  const getParamLabel = (key, param) => {
    if (editedParamLabels[key]) return editedParamLabels[key]
    if (param && param.label) return param.label
    return key
  }

  // 参数修改 - 处理宽高比锁定（双向同步）
  const handleParamChange = useCallback((key, value) => {
    setInputValues(prev => {
      let next = { ...prev, [key]: value }
      // 同步到 tabDataRef，防止 tabVersion effect 读回旧值覆盖用户编辑
      if (tabDataRef.current[activeTabId]) {
        tabDataRef.current[activeTabId].inputValues = next
      }

      // 宽高比锁定逻辑 - 双向同步
      if (aspectLocked && aspectRatio) {
        const widthKey = getWidthKey()
        const heightKey = getHeightKey()

        const minSize = 256
        const maxSize = 2048

        if (key === widthKey && heightKey) {
          // 修改了宽度，同步调整高度（考虑边界）
          let newHeight = Math.round(value / aspectRatio)
          newHeight = Math.max(minSize, Math.min(maxSize, newHeight))
          next[heightKey] = newHeight

          // 如果高度被限制，也要限制宽度
          if (newHeight === minSize || newHeight === maxSize) {
            next[key] = Math.round(newHeight * aspectRatio)
          }
        } else if (key === heightKey && widthKey) {
          // 修改了高度，同步调整宽度（考虑边界）
          let newWidth = Math.round(value * aspectRatio)
          newWidth = Math.max(minSize, Math.min(maxSize, newWidth))
          next[widthKey] = newWidth

          // 如果宽度被限制，也要限制高度
          if (newWidth === minSize || newWidth === maxSize) {
            next[key] = Math.round(newWidth / aspectRatio)
          }
        }
      }

      return next
    })
  }, [aspectLocked, aspectRatio, activeTabId])

  // 尺寸预设选择
  const handlePresetSelect = (idx) => {
    setSelectedPreset(idx)
    const preset = SIZE_PRESETS[idx]
    if (preset.width && preset.height) {
      const widthKey = getWidthKey()
      const heightKey = getHeightKey()

      if (widthKey && heightKey) {
        setInputValues(prev => {
          const next = {
            ...prev,
            [widthKey]: preset.width,
            [heightKey]: preset.height
          }
          // 同步到 tabDataRef 防止 addLog 触发 tabVersion 覆盖
          if (tabDataRef.current[activeTabId]) {
            tabDataRef.current[activeTabId].inputValues = next
          }
          return next
        })
        setAspectRatio(preset.width / preset.height)
      }
    }
  }

  // 拖拽窗口
  const handleMouseDown = (e) => {
    if (e.target.closest('.window-controls') || e.target.closest('input') || e.target.closest('textarea') || e.target.closest('select') || e.target.closest('button')) return
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
        if (resizeDir.includes('e')) nw = Math.max(500, resizeStart.width + dx)
        if (resizeDir.includes('s')) nh = Math.min(Math.max(400, resizeStart.height + dy), maxY - resizeStart.posY)
        if (resizeDir.includes('w')) { nw = Math.max(500, resizeStart.width - dx); nx = resizeStart.posX + resizeStart.width - nw }
        if (resizeDir.includes('n')) { nh = Math.max(400, resizeStart.height - dy); ny = Math.max(48, resizeStart.posY + resizeStart.height - nh) }
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
  }, [isDragging, isResizing, dragOffset, resizeStart, resizeDir, isMaximized])

  // 保存单个输出到本地
  const saveOutputToLocal = async (item) => {
    try {
      const response = await axios.post('/api/save-output', {
        object_url: item.object_url,
        output_ext: item.output_ext || path.extname(item.object_url || '.png'),
        app_name: appName
      })
      addLog(`已保存 ${response.data.fileName}`, 'success')
      return response.data
    } catch (err) {
      addLog(`保存失败: ${translateError(err.message)}`, 'error')
      throw err
    }
  }

  // 自动保存所有输出
  const autoSaveOutputs = async (outputs, forTabId) => {
    if (!outputs || outputs.length === 0) return
    try {
      const response = await axios.post('/api/save-outputs', {
        outputs: outputs,
        app_name: appName
      })
      const data = response.data
      addLog(`自动保存 ${data.savedCount}/${data.totalCount} 个输出`, 'success')
      // 用本地路径替换 CDN URL，确保结果图能正常显示
      if (data.results && data.results.length > 0) {
        const updatedOutputs = outputs.map((item, i) => {
          const saved = data.results[i]
          if (saved && saved.success && saved.url) {
            return { ...item, object_url: saved.url }
          }
          return item
        })
        if (forTabId === activeTabId) setResult(updatedOutputs)
        if (tabDataRef.current[forTabId]) tabDataRef.current[forTabId].result = updatedOutputs
      }
    } catch (err) {
      addLog(`自动保存失败: ${translateError(err.message)}`, 'error')
    }
  }

  // 运行任务
  const handleRun = async () => {
    const tabId = activeTabId
    runningTabRef.current = tabId
    setLoading(true); setError(null); setResult(null); setProgress(0); setProgressText('')
    // 同步清空 tabDataRef，防止后续 tabVersion effect 读回旧值
    if (tabDataRef.current[tabId]) {
      Object.assign(tabDataRef.current[tabId], {
        loading: true, error: null, result: null, progress: 0, progressText: ''
      })
    }
    // 把当前 inputValues 同步到 tabDataRef，再触发重渲染，防止旧值覆盖
    if (tabDataRef.current[tabId]) {
      tabDataRef.current[tabId].inputValues = { ...inputValues }
    }
    if (tabId === activeTabId) setTabVersion(v => v + 1)
    const wid = webAppId || app.web_app_id
    if (!wid) { setError('无法获取 web_app_id'); return }
    // 每个标签页独立进度 ref
    if (!progressRef.current[tabId]) progressRef.current[tabId] = 0
    if (!progressTargetRef.current[tabId]) progressTargetRef.current[tabId] = 0
    progressRef.current[tabId] = 0
    progressTargetRef.current[tabId] = 0
    if (progressRafRef.current[tabId]) { cancelAnimationFrame(progressRafRef.current[tabId]); progressRafRef.current[tabId] = null }
    addLog('开始运行..')
    try {
      const resp = await axios.post('/api/run-task', { web_app_id: wid, input_values: inputValues })
      const taskId = resp.data.task_id || resp.data.requestId
      addLog(`任务ID: ${taskId}`)
      const poll = async () => {
        try {
          const s = await axios.get(`/api/task-status/${taskId}`)
          addLog(`收到: ${JSON.stringify(s.data)}`)
          const rawStatus = s.data?.data?.status || s.data?.status || ''
          const st = String(rawStatus).toLowerCase()
          const serverProgress = s.data?.progress ?? -1
          const elapsedSec = s.data?.inference_cost_time

          const isCurrentTab = tabId === activeTabId
          const setProgressForTab = (val, text) => {
            if (isCurrentTab) { setProgress(val); if (text) setProgressText(text) }
            updateTabData(tabId, { progress: val, ...(text ? { progressText: text } : {}) })
          }
          const formatElapsed = (sec) => {
            if (!sec || sec < 0) return ''
            if (sec < 60) return `${sec}秒`
            const m = Math.floor(sec / 60); const s = sec % 60
            return s > 0 ? `${m}分${s}秒` : `${m}分`
          }

          if (st === 'success' || st === 'completed') {
            setProgressForTab(100, '完成'); progressTargetRef.current[tabId] = 100
            if (progressRafRef.current[tabId]) { cancelAnimationFrame(progressRafRef.current[tabId]); progressRafRef.current[tabId] = null }
          } else if (st === 'failed' || st === 'error') {
            setProgressForTab(0, '失败')
            if (progressRafRef.current[tabId]) { cancelAnimationFrame(progressRafRef.current[tabId]); progressRafRef.current[tabId] = null }
          } else if (st === 'pending' || st === 'queued' || st === 'queuing') {
            setProgressForTab(8, '排队中..'); progressTargetRef.current[tabId] = 8
          } else if (st === 'preparing') {
            if (isCurrentTab) setProgressText('准备中..')
            updateTabData(tabId, { progressText: '准备中..' })
            if (serverProgress >= 0 && serverProgress <= 100) {
              progressTargetRef.current[tabId] = Math.min(serverProgress, 20)
              setProgressForTab(Math.min(serverProgress, 20))
            } else {
              progressTargetRef.current[tabId] = 15
              setProgressForTab(15)
            }
          } else if (st === 'running' || st === 'processing' || st === 'in_progress') {
            const elapsed = formatElapsed(elapsedSec)
            const runningText = elapsed ? `生成中.. (已运行 ${elapsed})` : '生成中..'
            if (isCurrentTab) setProgressText(runningText)
            updateTabData(tabId, { progressText: runningText })
            if (serverProgress >= 0 && serverProgress <= 100) {
              progressTargetRef.current[tabId] = Math.min(serverProgress, 95)
              setProgressForTab(Math.min(serverProgress, 95))
            } else {
              if (!progressRafRef.current[tabId]) {
                const startVal = progressRef.current[tabId] || 10
                progressTargetRef.current[tabId] = Math.min(startVal + 20, 80)
                const startTime = performance.now()
                const duration = 30000
                const animate = (now) => {
                  const elapsed = now - startTime
                  const t = Math.min(elapsed / duration, 1)
                  const eased = 1 - Math.pow(1 - t, 3)
                  const val = Math.round(startVal + (progressTargetRef.current[tabId] - startVal) * eased)
                  progressRef.current[tabId] = val
                  setProgressForTab(val)
                  if (t < 1) {
                    progressRafRef.current[tabId] = requestAnimationFrame(animate)
                  } else {
                    progressRafRef.current[tabId] = null
                  }
                }
                progressRafRef.current[tabId] = requestAnimationFrame(animate)
              }
            }
          } else {
            addLog(`未知状态: ${rawStatus}`, 'error')
            if (serverProgress >= 0) setProgressForTab(Math.min(serverProgress, 95))
            if (isCurrentTab) setProgressText('处理中..')
            updateTabData(tabId, { progressText: '处理中..' })
          }
          if (st === 'success' || st === 'completed') {
            const outputs = s.data.data?.outputs || s.data.outputs || []
            if (isCurrentTab) { setResult(outputs); setLoading(false) }
            addLog(`完成! 共${outputs.length}个输出`, 'success')
            updateTabData(tabId, { result: outputs, loading: false, progress: 100, progressText: '完成' })
            if (outputs.length > 0) autoSaveOutputs(outputs, tabId)
            window.dispatchEvent(new CustomEvent('bizyair-balance-refresh'))
          } else if (st === 'failed' || st === 'error') {
            const inner = s.data?.data || {}
            const errorOutput = inner?.outputs?.[0]
            const rawErr = errorOutput?.error_msg || inner?.error || s.data?.message || '失败'
            const errMsg = translateError(rawErr)
            if (isCurrentTab) { setError(errMsg); setLoading(false) }
            addLog('失败', 'error')
            updateTabData(tabId, { error: errMsg, loading: false })
            if (progressRafRef.current[tabId]) { cancelAnimationFrame(progressRafRef.current[tabId]); progressRafRef.current[tabId] = null }
          } else {
            addLog(`状态: ${rawStatus}`); setTimeout(poll, 2000)
          }
        } catch (err) {
          const msg = translateError(err.response?.data?.error || err.message || '未知错误')
          addLog(`轮询异常: ${msg}`, 'error')
          setError('轮询失败: ' + msg)
          setLoading(false)
          setProgressText('异常')
          setProgress(0)
          if (progressRafRef.current[tabId]) { cancelAnimationFrame(progressRafRef.current[tabId]); progressRafRef.current[tabId] = null }
        }
      }
      poll()
    } catch (err) {
      setError(translateError(err.response?.data?.error || err.message))
      addLog('启动失败', 'error')
      setLoading(false)
      updateTabData(tabId, { loading: false })
    }
  }

  // 保存应用
  const handleSave = async () => {
    try {
      await axios.put(`/api/apps/${app.id}`, { name: appName, exampleCode, icon: appIcon })
      // 合并类型和自定义名称
      const merged = {}
      Object.entries(editedParamTypes).forEach(([key, val]) => {
        merged[key] = val
      })
      Object.entries(editedParamLabels).forEach(([key, label]) => {
        if (label && label !== key) {
          if (merged[key]) {
            const existing = merged[key]
            if (typeof existing === 'string') {
              merged[key] = { type: existing, label }
            } else {
              merged[key] = { ...existing, label }
            }
          } else {
            merged[key] = { label }
          }
        }
      })
      if (Object.keys(merged).length > 0) {
        try {
          await axios.put('/api/parameter-types', { types: merged, appId: app.id })
          addLog('参数类型和名称已保存')
        } catch (err) { addLog('参数类型保存失败: ' + translateError(err.message)) }
      }
      setError(null)
      setIsEditing(false)
      addLog('已保存')
      saveActiveTabData()
      parseExampleCode(exampleCode)
    } catch (err) {
      setError('保存失败: ' + translateError(err.response?.data?.error || err.message))
      console.error('保存失败:', err)
    }
  }

  // 上传图标
  const handleIconUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) return
    try {
      const formData = new FormData()
      formData.append('file', file)
      const resp = await axios.post(`/api/apps/${app.id}/icon`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setAppIcon(resp.data.url)
    } catch (err) { setError('上传图标失败') }
  }

  // 动态识别媒体参数（不依赖后端 type 标记）
  const getEffectiveType = (key) => {
    return (typeof editedParamTypes[key] === 'object' ? editedParamTypes[key].type : editedParamTypes[key]) || parameters[key]?.type || ''
  }
  const isImageLike = (key, p) => {
    const effectiveType = getEffectiveType(key)
    if (effectiveType === 'image') return true
    if (effectiveType && effectiveType !== 'image') return false
    const name = key.toLowerCase()
    const val = String(p.value || '')
    const suffix = name.split('.').pop() || ''
    if (suffix === 'image' || suffix === 'img') return true
    if (val.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) || val.startsWith('data:image')) return true
    return false
  }
  const isAudioLike = (key, p) => {
    const effectiveType = getEffectiveType(key)
    if (effectiveType === 'audio') return true
    if (effectiveType && effectiveType !== 'audio') return false
    const name = key.toLowerCase()
    const val = String(p.value || '')
    const suffix = name.split('.').pop() || ''
    if (suffix === 'audio' || suffix === 'sound') return true
    if (val.match(/\.(mp3|wav|ogg|m4a|flac|aac|opus)$/i) || val.startsWith('data:audio')) return true
    return false
  }
  const isVideoLike = (key, p) => {
    const effectiveType = getEffectiveType(key)
    if (effectiveType === 'video') return true
    if (effectiveType && effectiveType !== 'video') return false
    const name = key.toLowerCase()
    const val = String(p.value || '')
    const suffix = name.split('.').pop() || ''
    if (suffix === 'video' || suffix === 'vid') return true
    if (val.match(/\.(mp4|webm|mov|avi|mkv|flv)$/i) || val.startsWith('data:video')) return true
    return false
  }

  const imageKeys = Object.entries(parameters).filter(([key, p]) => isImageLike(key, p))
  const audioKeys = Object.entries(parameters).filter(([key, p]) => isAudioLike(key, p))
  const videoKeys = Object.entries(parameters).filter(([key, p]) => isVideoLike(key, p))
  const otherParams = Object.entries(parameters).filter(([key, p]) => !isImageLike(key, p) && !isAudioLike(key, p) && !isVideoLike(key, p))

  // 找出宽高参数
  const widthParamKey = Object.keys(parameters).find(k =>
    k.toLowerCase().includes('width') && !k.toLowerCase().includes('height')
  )
  const heightParamKey = Object.keys(parameters).find(k =>
    k.toLowerCase().includes('height') && !k.toLowerCase().includes('width')
  )
  const sizeParams = [widthParamKey, heightParamKey].filter(Boolean)
  const nonSizeParams = otherParams.filter(([k]) => !sizeParams.includes(k))

  // 辅助函数：获取路径扩展名
  const path = { extname: (url) => { try { return url.substring(url.lastIndexOf('.')) } catch { return '.png' } } }

  // 处理图片拖放交换的完整流程
  const handleImageDropAction = (fromKey, toKey) => {
    // If fromKey is 'swap' or 'cover' or 'cancel', it's from the popup
    if (fromKey === 'swap') {
      setInputValues(prev => {
        const next = { ...prev }
        if (pendingSwap?.isResult) {
          next[toKey] = pendingSwap.from  // 结果图 URL 覆盖到目标
        } else {
          const temp = next[pendingSwap.from]
          next[pendingSwap.from] = next[toKey]
          next[toKey] = temp
        }
        return next
      })
      setPendingSwap(null)
      setDropTargetKey(null)
      setDragFromKey(null)
    } else if (fromKey === 'cover') {
      setInputValues(prev => {
        const next = { ...prev }
        next[toKey] = pendingSwap.isResult ? pendingSwap.from : (next[pendingSwap.from] ?? '')
        return next
      })
      setPendingSwap(null)
      setDropTargetKey(null)
      setDragFromKey(null)
    } else if (fromKey === 'cancel') {
      setPendingSwap(null)
      setDropTargetKey(null)
      setDragFromKey(null)
    } else {
      // First drop - detect if fromKey is a URL (result image drag)
      const isResult = typeof fromKey === 'string' && (fromKey.startsWith('http://') || fromKey.startsWith('https://'))
      setPendingSwap({ from: fromKey, to: toKey, isResult })
      setDropTargetKey(toKey)
    }
  }

  return (
    <div
      ref={windowRef}
      className="fixed bg-slate-900 border border-white/20 rounded-lg shadow-2xl overflow-hidden"
      style={{ ...windowStyle, zIndex: app.zIndex }}
      onMouseDown={(e) => { onBringToFront(); }}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      {/* 标题栏 */}
      <div
        className={`h-10 bg-black flex items-center justify-between px-4 select-none ${isMaximized ? '' : 'cursor-move'}`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-3">
          <img src={appIcon || app.icon || '/logo002.png'} alt="" className="w-6 h-6 rounded" />
          <span className="text-white text-sm font-medium">{appName}</span>
        </div>
        <div className="flex items-center gap-2 window-controls">
          <button onClick={(e) => { e.stopPropagation(); onMinimize() }} className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400" title="最小化" />
          <button onClick={(e) => { e.stopPropagation(); onMaximize && onMaximize() }} className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400" title="最大化" />
          <button onClick={(e) => { e.stopPropagation(); onClose() }} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400" title="关闭" />
        </div>
      </div>

      {/* 标签栏 */}
      {!isEditing && (
        <div className="h-9 bg-slate-950 border-b border-white/10 flex items-center gap-0.5 px-2 overflow-x-auto shrink-0">
          {tabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`group flex items-center gap-1.5 px-3 h-7 rounded-t cursor-pointer text-xs shrink-0 transition ${
                tab.id === activeTabId
                  ? 'bg-slate-800 text-white border-t border-x border-white/10 rounded-sm'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <span className="truncate max-w-[100px]">{tab.name}</span>
              {tabs.length > 1 && (
                <svg
                  onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
                  className="w-3 h-3 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition shrink-0"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              )}
            </div>
          ))}
          <button
            onClick={addTab}
            className="flex items-center justify-center w-6 h-6 rounded text-slate-500 hover:text-white hover:bg-slate-700 transition shrink-0"
            title="新增标签页"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1 px-2 h-6 rounded text-xs text-slate-500 hover:text-indigo-400 hover:bg-slate-800 transition shrink-0"
            title={isEditing ? '退出编辑模式' : '编辑模式'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            编辑
          </button>
        </div>
      )}

      {/* 内容 */}
      <div className={`flex overflow-y-auto ${isEditing ? 'h-[calc(100%-40px)]' : 'h-[calc(100%-76px)]'}`}>
        {isEditing ? (
          /* 编辑模式 */
          <div className="flex w-full">
            {/* 左栏：图标 + 名称 + 操作按钮 */}
            <div className="w-48 p-4 border-r border-white/10 flex flex-col items-center shrink-0">
              <div
                className="w-24 h-24 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-indigo-500 overflow-hidden bg-white/5"
                onClick={(e) => { e.stopPropagation(); const inp = document.createElement('input'); inp.type='file'; inp.accept='image/*'; inp.onchange=(ev)=>{ if(ev.target.files[0]) handleIconUpload(ev.target.files[0]) }; inp.click() }}
                onDrop={(e) => { e.preventDefault(); const f=e.dataTransfer.files[0]; if(f) handleIconUpload(f) }}
                onDragOver={(e) => e.preventDefault()}
              >
                <img src={appIcon || '/logo002.png'} alt="" className="w-full h-full object-cover" />
              </div>
              <p className="text-slate-400 text-xs mt-2">点击上传图标</p>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="mt-3 w-full px-2 py-1.5 bg-slate-800 border border-white/20 rounded text-white text-sm text-center"
                placeholder="应用名称"
              />
              <div className="mt-4 w-full space-y-2">
                <button onClick={handleSave} className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm">保存</button>
                <button onClick={() => { setError(null); setIsEditing(false); setAppName(app.name); setExampleCode(app.exampleCode||''); setAppIcon(app.icon||'') }} className="w-full px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm">取消</button>
              </div>
            </div>
            {/* 中栏：参数类型编辑 */}
            <div className="w-72 border-r border-white/10 flex flex-col shrink-0">
              <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-white text-sm font-medium">参数类型</h3>
                <span className="text-slate-500 text-xs">{Object.keys(parameters).length} 个</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {Object.entries(parameters).length === 0 ? (
                  <p className="text-slate-500 text-xs text-center py-4">请先解析示例代码</p>
                ) : (
                  Object.entries(parameters).map(([key, param]) => {
                    const typeVal = typeof editedParamTypes[key] === 'object' ? editedParamTypes[key].type : editedParamTypes[key] || param.type
                    const options = typeof editedParamTypes[key] === 'object' ? editedParamTypes[key].options : param.options || []
                    return (
                      <div key={key} className="bg-slate-800/50 rounded-lg p-2.5 space-y-2">
                        {/* 自定义参数显示名称 */}
                        <div className="flex items-center gap-1.5 min-h-6">
                          <span className="text-xs text-indigo-400 shrink-0 font-medium">名称</span>
                          {renamingParam === key ? (
                            <input
                              type="text"
                              value={editedParamLabels[key] || ''}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setEditedParamLabels(prev => ({ ...prev, [key]: e.target.value }))}
                              onBlur={() => setRenamingParam(null)}
                              onKeyDown={(e) => { if (e.key === 'Enter') setRenamingParam(null) }}
                              placeholder={getParamLabel(key, param)}
                              autoFocus
                              className="flex-1 px-2 py-0.5 bg-slate-900 border border-indigo-500/50 rounded text-xs text-indigo-300 placeholder-slate-600"
                            />
                          ) : (
                            <span
                              className="flex-1 text-xs text-white/80 truncate cursor-pointer hover:text-white border border-white/10 hover:border-indigo-400/30 rounded px-1 py-0.5"
                              onClick={(e) => {
                                if (e.detail === 2) { e.stopPropagation(); setRenamingParam(key) }
                              }}
                              title="双击编辑名称"
                            >
                              {getParamLabel(key, param)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 truncate flex-1" title={key}>原始: {key}</span>
                          <select
                            value={typeVal}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const val = e.target.value
                              setEditedParamTypes(prev => {
                                const next = { ...prev }
                                if (val === 'select') {
                                  next[key] = { type: 'select', options: options.length > 0 ? [...options] : ['选项1'] }
                                } else {
                                  next[key] = val
                                }
                                return next
                              })
                            }}
                            className="px-2 py-1 bg-slate-900 border border-white/20 rounded text-xs text-white"
                          >
                            {['text','number','float','select','boolean','image','audio','video'].map(t => (
                              <option key={t} value={t}>
                                {(() => { switch(t) { case 'text': return '文本'; case 'number': return '整数'; case 'float': return '小数'; case 'select': return '枚举'; case 'boolean': return '布尔'; case 'image': return '图片'; case 'audio': return '音频'; case 'video': return '视频'; default: return t; } })()}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="text-xs text-slate-500 truncate" title={String(param.value)}>
                          值: {String(param.value).substring(0, 40)}{String(param.value).length > 40 ? '...' : ''}
                        </div>
                        {typeVal === 'select' && (
                          <div className="space-y-1">
                            {(options || []).map((opt, idx) => (
                              <div key={idx} className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={opt}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    setEditedParamTypes(prev => {
                                      const next = { ...prev }
                                      const opts = [...(typeof next[key] === 'object' ? next[key].options : options)]
                                      opts[idx] = e.target.value
                                      next[key] = { type: 'select', options: opts }
                                      return next
                                    })
                                  }}
                                  className="flex-1 px-2 py-0.5 bg-slate-900 border border-white/10 rounded text-xs text-white"
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditedParamTypes(prev => {
                                      const next = { ...prev }
                                      const opts = [...(typeof next[key] === 'object' ? next[key].options : options)]
                                      opts.splice(idx, 1)
                                      next[key] = { type: 'select', options: opts }
                                      return next
                                    })
                                  }}
                                  className="text-red-400 hover:text-red-300 text-xs px-1"
                                >×</button>
                              </div>
                            ))}
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={newOptionInputs[key] || ''}
                                placeholder="添加选项..."
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => setNewOptionInputs(prev => ({ ...prev, [key]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && (newOptionInputs[key] || '').trim()) {
                                    e.stopPropagation()
                                    setEditedParamTypes(prev => {
                                      const next = { ...prev }
                                      const opts = [...(typeof next[key] === 'object' ? next[key].options : options)]
                                      opts.push(newOptionInputs[key].trim())
                                      next[key] = { type: 'select', options: opts }
                                      return next
                                    })
                                    setNewOptionInputs(prev => ({ ...prev, [key]: '' }))
                                  }
                                }}
                                className="flex-1 px-2 py-0.5 bg-slate-900 border border-white/10 rounded text-xs text-white"
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if ((newOptionInputs[key] || '').trim()) {
                                    setEditedParamTypes(prev => {
                                      const next = { ...prev }
                                      const opts = [...(typeof next[key] === 'object' ? next[key].options : options)]
                                      opts.push(newOptionInputs[key].trim())
                                      next[key] = { type: 'select', options: opts }
                                      return next
                                    })
                                    setNewOptionInputs(prev => ({ ...prev, [key]: '' }))
                                  }
                                }}
                                className="text-indigo-400 hover:text-indigo-300 text-xs px-1"
                              >+</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
            {/* 右栏：调用示例编辑 */}
            <div className="flex-1 p-4 flex flex-col min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-medium">调用示例</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setError(null); setIsEditing(false) }} className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded text-xs">返回使用模式</button>
                  <button onClick={() => parseExampleCode(exampleCode)} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs">重新解析</button>
                </div>
              </div>
              <textarea
                value={exampleCode}
                onChange={(e) => setExampleCode(e.target.value)}
                className="flex-1 w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-green-400 font-mono text-xs resize-none"
                placeholder="在此编辑调用示例..."
              />
            </div>
          </div>
        ) : (
          /* 运行模式 - SD WebUI 风格布局 */
          <div className="flex w-full">
            {/* 左侧：参数设置 */}
            <div className="min-w-[420px] flex-[1.2] border-r border-white/10 flex flex-col shrink-0">
              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto space-y-3 px-4 py-4">
                  {error && (
                    <div className="p-3 bg-red-500/20 border border-red-500/50 rounded text-red-300 text-sm flex justify-between items-start gap-2">
                      <span>{error}</span>
                      <button onClick={() => setError(null)} className="text-red-300/50 hover:text-red-300 shrink-0">✕</button>
                    </div>
                  )}

                  {loadingParams ? (
                    <div className="text-center py-8">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    </div>
                  ) : Object.keys(parameters).length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-slate-500 mb-4">暂无参数</p>
                      <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded">编辑应用</button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* 图像参数 */}
                      {imageKeys.length > 0 && (
                        <div>
                          <h3 className="text-white text-sm font-medium mb-2">输入图像</h3>
                          <div className={`grid gap-3 ${imageKeys.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                            {imageKeys.map(([key, param]) => (
                              <div key={key}>
                                <label className="block text-xs text-slate-400 mb-1 truncate">{getParamLabel(key, param)}</label>
                                <ImageUploader
                                  paramKey={key}
                                  value={inputValues[key] !== undefined ? String(inputValues[key]) : String(param.value || '')}
                                  onChange={handleParamChange}
                                  dragFromKey={dragFromKey}
                                  onDragStart={(key) => setDragFromKey(key)}
                                  isDragOver={dragFromKey}
                                  isDropTarget={dropTargetKey}
                                  onDropOver={(key) => setDropTargetKey(key)}
                                  showDropPopup={!!(pendingSwap && pendingSwap.to === key)}
                                  hideSwapBtn={pendingSwap?.isResult}
                                  onDropAction={handleImageDropAction}
                                  /* 当仅有一个输入图像时，保持与多图相同的左对齐而非居中 */
                                  leftAlign={imageKeys.length === 1}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 音频参数 */}
                      {audioKeys.length > 0 && (
                        <div>
                          <h3 className="text-white text-sm font-medium mb-2">输入音频</h3>
                          <div className="space-y-3">
                            {audioKeys.map(([key, param]) => (
                              <div key={key}>
                                <label className="block text-xs text-slate-400 mb-1 truncate">{getParamLabel(key, param)}</label>
                                <AudioUploader
                                  paramKey={key}
                                  value={inputValues[key] !== undefined ? String(inputValues[key]) : String(param.value || '')}
                                  onChange={handleParamChange}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 视频参数 */}
                      {videoKeys.length > 0 && (
                        <div>
                          <h3 className="text-white text-sm font-medium mb-2">输入视频</h3>
                          <div className="space-y-3">
                            {videoKeys.map(([key, param]) => (
                              <div key={key}>
                                <label className="block text-xs text-slate-400 mb-1 truncate">{getParamLabel(key, param)}</label>
                                <VideoUploader
                                  paramKey={key}
                                  value={inputValues[key] !== undefined ? String(inputValues[key]) : String(param.value || '')}
                                  onChange={handleParamChange}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 尺寸预设 + 宽高参数 */}
                      {widthParamKey && heightParamKey && (
                        <div>
                          <h3 className="text-white text-sm font-medium mb-2">图像尺寸</h3>
                          {/* 预设按钮组 */}
                          <div className="grid grid-cols-3 gap-1.5 mb-3">
                            {SIZE_PRESETS.map((preset, idx) => (
                              <button
                                key={idx}
                                onClick={(e) => { e.stopPropagation(); handlePresetSelect(idx) }}
                                className={`px-2 py-1.5 text-xs rounded transition ${
                                  selectedPreset === idx
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                          {/* 宽度滑块 */}
                          <div className="mb-3">
                            <SliderInput
                              label="宽度"
                              value={inputValues[widthParamKey] || 1024}
                              onChange={handleParamChange}
                              paramKey={widthParamKey}
                              min={256}
                              max={2048}
                              step={8}
                              locked={aspectLocked}
                              onLockToggle={() => setAspectLocked(!aspectLocked)}
                              counterpartKey={heightParamKey}
                              counterpartValue={inputValues[heightParamKey]}
                              aspectRatio={aspectRatio}
                            />
                          </div>
                          {/* 高度滑块 */}
                          <div>
                            <SliderInput
                              label="高度"
                              value={inputValues[heightParamKey] || 1024}
                              onChange={handleParamChange}
                              paramKey={heightParamKey}
                              min={256}
                              max={2048}
                              step={8}
                              counterpartKey={widthParamKey}
                              counterpartValue={inputValues[widthParamKey]}
                              aspectRatio={aspectRatio}
                            />
                          </div>
                        </div>
                      )}

                      {/* 其他参数 */}
                      {nonSizeParams.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="text-white text-sm font-medium">其他参数</h3>
                          {nonSizeParams.map(([key, param]) => {
                            const val = inputValues[key] !== undefined ? inputValues[key] : param.value
                            const strVal = val !== undefined && val !== null ? String(val) : ''
                            const effectiveType = (typeof editedParamTypes[key] === 'object' ? editedParamTypes[key].type : editedParamTypes[key]) || param.type
                            const effectiveOptions = (typeof editedParamTypes[key] === 'object' ? editedParamTypes[key].options : param.options) || []
                            return (
                              <div key={key}>
                                <label className="block text-xs text-slate-400 mb-1">
                                  {getParamLabel(key, param)}
                                  {param.required && <span className="text-red-400 ml-1">*</span>}
                                </label>
                                {effectiveType === 'select' && effectiveOptions.length > 0 ? (
                                  <select
                                    value={strVal}
                                    onChange={(e) => handleParamChange(key, e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full px-3 py-2 bg-slate-800 border border-white/20 rounded text-white text-sm"
                                  >
                                    {effectiveOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                  </select>
                                ) : effectiveType === 'number' || effectiveType === 'integer' || effectiveType === 'float' ? (
                                  <input
                                    type="number"
                                    value={strVal}
                                    onChange={(e) => handleParamChange(key, e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full px-3 py-2 bg-slate-800 border border-white/20 rounded text-white text-sm"
                                  />
                                ) : effectiveType === 'boolean' ? (
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={val === true || val === 'true'}
                                      onChange={(e) => handleParamChange(key, e.target.checked)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-4 h-4"
                                    />
                                    <span className="text-white text-sm">启用</span>
                                  </label>
                                ) : effectiveType === 'image' ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={strVal}
                                      onChange={(e) => handleParamChange(key, e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex-1 px-3 py-2 bg-slate-800 border border-white/20 rounded text-white text-sm"
                                      placeholder="图片 URL"
                                    />
                                    <span className="text-xs text-slate-500 shrink-0">📷</span>
                                  </div>
                                ) : effectiveType === 'video' ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={strVal}
                                      onChange={(e) => handleParamChange(key, e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex-1 px-3 py-2 bg-slate-800 border border-white/20 rounded text-white text-sm"
                                      placeholder="视频 URL"
                                    />
                                    <span className="text-xs text-slate-500 shrink-0">🎬</span>
                                  </div>
                                ) : effectiveType === 'audio' ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={strVal}
                                      onChange={(e) => handleParamChange(key, e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex-1 px-3 py-2 bg-slate-800 border border-white/20 rounded text-white text-sm"
                                      placeholder="音频 URL"
                                    />
                                    <span className="text-xs text-slate-500 shrink-0">🎵</span>
                                  </div>
                                ) : effectiveType === 'textarea' || effectiveType === 'text' || (typeof val === 'string' && val.length > 80) ? (
                                  <ContextInput
                                    type="textarea"
                                    value={strVal}
                                    onChange={(v) => handleParamChange(key, v)}
                                    rows={3}
                                    className="w-full px-3 py-2 bg-slate-800 border border-white/20 rounded text-white text-sm resize-y"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  <ContextInput
                                    type="textarea"
                                    value={strVal}
                                    onChange={(v) => handleParamChange(key, v)}
                                    rows={3}
                                    className="w-full px-3 py-2 bg-slate-800 border border-white/20 rounded text-white text-sm resize-y"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* 固定底部：运行按钮 */}
                <div className="shrink-0 border-t border-white/10 px-4 py-3 bg-slate-900">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRun() }}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 text-white rounded-lg font-medium transition shrink-0"
                  >
                    {loading ? '⏳ 运行中..' : '▶ 生成'}
                  </button>
                </div>
              </div>
            </div>

            {/* 右侧：输出结果 */}
            <div key={'results-' + activeTabId} className="flex-1 relative overflow-hidden">
              {/* 输出内容 */}
              <div className="absolute inset-0 overflow-y-auto p-4" style={{ bottom: logsExpanded ? '220px' : '36px' }}>
                <h3 className="text-white text-sm font-medium mb-3">输出结果</h3>
                <div>
                  {result ? (
                    Array.isArray(result) ? (
                      <div className="grid grid-cols-1 gap-4">
                        {result.map((item, i) => (
                          <OutputItem
                            key={i}
                            item={item}
                            index={i}
                            appName={appName}
                            onSave={saveOutputToLocal}
                            onView={(item) => setViewingImage(item.object_url)}
                          />
                        ))}
                      </div>
                    ) : (
                      <pre className="text-xs text-green-400 bg-black/30 rounded p-3 whitespace-pre-wrap overflow-x-auto">
                        {typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}
                      </pre>
                    )
                  ) : (
                    <div className="flex items-center justify-center py-16">
                      <div className="text-center text-slate-600">
                        {loading && (
                          <div className="mb-4 w-full max-w-sm mx-auto">
                            {/* 进度条 */}
                            <div className="relative w-full h-3 bg-slate-700/80 rounded-full overflow-hidden mb-2 border border-slate-600/50">
                              <div
                                className="h-full rounded-full transition-all duration-700 ease-out"
                                style={{
                                  width: `${progress}%`,
                                  background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)',
                                  boxShadow: progress > 0 ? '0 0 12px rgba(139,92,246,0.5)' : 'none'
                                }}
                              />
                              {/* 闪烁效果 */}
                              {progress > 0 && progress < 100 && (
                                <div
                                  className="absolute top-0 left-0 h-full w-1/3 rounded-full opacity-40"
                                  style={{
                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                                    animation: 'shimmer 2s infinite'
                                  }}
                                />
                              )}
                            </div>
                            {/* 状态文字 */}
                            <div className="flex justify-between items-center px-1">
                              <div className="flex items-center gap-2">
                                <svg className="animate-spin text-indigo-400" width="14" height="14" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                </svg>
                                <span className="text-xs text-slate-400">{progressText || '生成中..'}</span>
                              </div>
                              <span className="text-xs text-indigo-400 font-mono font-semibold">{Math.round(progress)}%</span>
                            </div>
                            {/* shimmer keyframes */}
                            <style>{`
                              @keyframes shimmer {
                                0% { transform: translateX(-100%); }
                                100% { transform: translateX(400%); }
                              }
                            `}</style>
                          </div>
                        )}
                        <svg className="w-16 h-16 mx-auto mb-3 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <path d="M21 15l-5-5L5 21"/>
                        </svg>
                        <p className="text-sm">{loading ? '正在生成...' : '等待生成结果...'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* 日志区域 - 固定在底部，不挤压输出内容 */}
              <div className="absolute bottom-0 left-0 right-0 border-t border-white/10" style={{ height: logsExpanded ? '220px' : '36px', display: 'flex', flexDirection: 'column' }}>
                <div
                  className="flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-white/5 shrink-0"
                  onClick={() => setLogsExpanded(!logsExpanded)}
                >
                  <span className="text-slate-400 text-xs font-medium">运行日志</span>
                  <div className="flex items-center gap-2">
                    {logsExpanded && (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); const text = logs.map(l => `[${l.time}] ${l.msg}`).join('\n'); navigator.clipboard.writeText(text) }}
                          className="text-xs text-slate-500 hover:text-white px-2 py-0.5 rounded border border-white/10 hover:border-white/30"
                        >
                          复制
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setLogs([]) }}
                          className="text-xs text-slate-500 hover:text-white px-2 py-0.5 rounded border border-white/10 hover:border-white/30"
                        >
                          清除
                        </button>
                      </div>
                    )}
                    <svg
                      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className={`text-slate-500 transition-transform ${logsExpanded ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </div>
                {logsExpanded && (
                  <div className="overflow-y-auto font-mono text-xs space-y-0.5 px-3" style={{ height: 'calc(100% - 32px)' }}>
                    {logs.length === 0
                      ? <div className="text-slate-600 italic">等待运行...</div>
                      : logs.map((log, i) => (
                        <div key={i} className={log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-slate-400'}>
                          <span className="text-slate-600">[{log.time}]</span> {log.msg}
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 图片查看器 */}
      {viewingImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center cursor-zoom-out"
          onClick={() => setViewingImage(null)}
        >
          <img src={viewingImage} alt="" className="max-w-[90vw] object-contain" style={{ maxHeight: 'calc(100vh - 56px - 32px)' }} />
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white"
            onClick={() => setViewingImage(null)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* 调整大小手柄 */}
      {!isMaximized && (
        <>
          <div className="absolute top-0 left-0 w-1 h-full cursor-w-resize hover:bg-indigo-500/30" onMouseDown={(e) => handleResizeStart(e, 'w')} />
          <div className="absolute top-0 right-0 w-1 h-full cursor-e-resize hover:bg-indigo-500/30" onMouseDown={(e) => handleResizeStart(e, 'e')} />
          <div className="absolute bottom-0 left-0 w-full h-1 cursor-s-resize hover:bg-indigo-500/30" onMouseDown={(e) => handleResizeStart(e, 's')} />
          <div className="absolute top-0 left-0 w-full h-1 cursor-n-resize hover:bg-indigo-500/30" onMouseDown={(e) => handleResizeStart(e, 'n')} />
          <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize" onMouseDown={(e) => handleResizeStart(e, 'se')} />
        </>
      )}
    </div>
  )
}

// ============ 带右键菜单的输入框 ============
function ContextInput({ type = 'text', value, onChange, placeholder, rows, className, onClick }) {
  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const [contextMenu, setContextMenu] = useState(null)
  const inputRef = useRef(null)

  const handleContextMenu = (e) => {
    e.preventDefault()
    e.stopPropagation()

    const input = inputRef.current
    const hasSelection = input && input.selectionStart !== input.selectionEnd

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      hasSelection
    })
  }

  const handleClick = (e) => {
    setContextMenu(null)
    onClick && onClick(e)
  }

  const handleCut = () => {
    const input = inputRef.current
    if (!input) return
    const start = input.selectionStart
    const end = input.selectionEnd
    const text = value.substring(start, end)
    navigator.clipboard.writeText(text)
    onChange(value.substring(0, start) + value.substring(end))
    setContextMenu(null)
  }

  const handleCopy = () => {
    const input = inputRef.current
    if (!input) return
    const text = value.substring(input.selectionStart, input.selectionEnd)
    navigator.clipboard.writeText(text)
    setContextMenu(null)
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const input = inputRef.current
      if (!input) {
        onChange(text)
      } else {
        const start = input.selectionStart
        const end = input.selectionEnd
        onChange(value.substring(0, start) + text + value.substring(end))
      }
    } catch (err) {
      console.error('粘贴失败:', err)
    }
    setContextMenu(null)
  }

  const inputProps = {
    ref: inputRef,
    value,
    onChange: (e) => onChange(e.target.value),
    onClick: handleClick,
    onContextMenu: handleContextMenu,
    placeholder,
    className: className + ' context-input',
  }

  return (
    <>
      {type === 'textarea' ? (
        <textarea {...inputProps} rows={rows} />
      ) : (
        <input {...inputProps} type={type} />
      )}

      {contextMenu && (
        <div
          className="fixed bg-slate-800 border border-white/20 rounded-lg shadow-xl py-1 z-[100] min-w-[120px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleCut}
            disabled={!contextMenu.hasSelection}
            className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 ${
              contextMenu.hasSelection ? 'text-white hover:bg-white/10' : 'text-slate-500 cursor-not-allowed'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            剪切
          </button>
          <button
            onClick={handleCopy}
            disabled={!contextMenu.hasSelection}
            className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 ${
              contextMenu.hasSelection ? 'text-white hover:bg-white/10' : 'text-slate-500 cursor-not-allowed'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M9 12h6"/>
            </svg>
            复制
          </button>
          <button
            onClick={handlePaste}
            className="w-full px-3 py-1.5 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
            </svg>
            粘贴
          </button>
        </div>
      )}
    </>
  )
}