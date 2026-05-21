import React, { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'

// 缩略图 URL 辅助函数
function getThumbUrl(filePath) {
  if (!filePath) return ''
  const normalized = filePath.startsWith('/') ? filePath : '/' + filePath
  return `/api/thumbnail?path=${encodeURIComponent(normalized)}`
}

// 统一媒体类型判断
function getMediaType(file) {
  if (file.type === 'video') return 'video'
  if (file.type === 'audio') return 'audio'
  if (file.type === 'text') return 'text'
  const ext = (file.name || '').split('.').pop().toLowerCase()
  if (['mp4', 'webm', 'mov', 'avi', 'm4v', 'mkv', 'flv', 'wmv', '3gp'].includes(ext)) return 'video'
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'opus', 'wma', 'aiff'].includes(ext)) return 'audio'
  if (['json', 'txt', 'csv', 'md', 'log', 'html', 'xml'].includes(ext)) return 'text'
  return 'image'
}

// 文本文件便利贴卡片（用于文件夹内列表）
const TextFileCard = React.memo(({ file }) => {
  const [preview, setPreview] = useState('')
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    fetch(file.path)
      .then(r => r.text())
      .then(text => {
        const snippet = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').substring(0, 200)
        setPreview(snippet + (text.length > 200 ? '...' : ''))
        setLoaded(true)
      })
      .catch(() => { setPreview('?'); setLoaded(true) })
  }, [file.path])
  return (
    <div className="w-full h-full bg-gradient-to-br from-yellow-300 to-yellow-400 p-2 flex flex-col group-hover:scale-105 transition-transform duration-200 rounded-lg shadow-sm ring-1 ring-yellow-500/10">
      <svg className="w-4 h-4 text-yellow-600/60 mb-1 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 2H8c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 18H9v-2h6v2zm0-4H9v-2h6v2zm0-4H9V8h6v4z"/>
      </svg>
      {loaded ? (
        <p className="text-xs text-yellow-900 leading-relaxed break-all overflow-hidden flex-1">{preview}</p>
      ) : (
        <div className="text-xs text-yellow-700/50 animate-pulse">...</div>
      )}
    </div>
  )
})

// 文本文件查看器组件
function TextFileViewer({ filePath, fileName }) {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setLoading(true)
    setContent(null)
    fetch(filePath)
      .then(r => r.text())
      .then(text => {
        try {
          const parsed = JSON.parse(text)
          setContent(typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2))
        } catch {
          setContent(text)
        }
        setLoading(false)
      })
      .catch(() => {
        setContent('无法加载文件内容')
        setLoading(false)
      })
  }, [filePath])

  const handleCopy = () => {
    if (content) {
      navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const ext = (fileName || '').split('.').pop().toUpperCase()

  return (
    <div className="bg-gradient-to-br from-yellow-200 to-yellow-300 rounded-xl shadow-lg overflow-hidden max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between px-4 py-3 bg-yellow-400/30 border-b border-yellow-500/20">
        <div className="flex items-center gap-2 min-w-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-700 shrink-0">
            <path d="M16 2H8c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 18H9v-2h6v2zm0-4H9v-2h6v2zm0-4H9V8h6v4z"/>
          </svg>
          <span className="text-yellow-900 text-sm font-medium truncate">{fileName}</span>
          <span className="text-yellow-700/60 text-xs shrink-0">{ext}</span>
        </div>
        <button
          onClick={handleCopy}
          className="text-xs px-3 py-1.5 rounded-lg bg-yellow-500/40 hover:bg-yellow-500/60 text-yellow-900 transition flex items-center gap-1.5 shrink-0 font-medium"
        >
          {copied ? (
            <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> 已复制</>
          ) : (
            <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> 复制</>
          )}
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="text-yellow-700/50 text-sm animate-pulse">加载中...</div>
        ) : (
          <pre className="text-sm text-yellow-900 whitespace-pre-wrap break-words leading-relaxed font-mono">{content}</pre>
        )}
      </div>
    </div>
  )
}

// 带懒加载的文件缩略图组件
const MediaThumb = React.memo(({ file, index, onClick }) => {
  const thumbRef = useRef(null)
  const [inView, setInView] = useState(false)
  const mediaType = getMediaType(file)

  useEffect(() => {
    const el = thumbRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={thumbRef}
      className="group relative aspect-[9/16] overflow-hidden cursor-pointer" style={{ borderRadius: '8px', contentVisibility: 'auto' }}
      onClick={onClick}
    >
      {mediaType === 'image' ? (
        inView ? (
          <img
            src={getThumbUrl(file.path)}
            alt={file.name}
            loading="eager"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
            style={{ padding: '4px' }}
            onError={(e) => { e.target.style.background = '#334155' }}
          />
        ) : (
          <div className="w-full h-full bg-slate-800" />
        )
      ) : mediaType === 'video' ? (
        inView ? (
          <video
            src={file.path}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
            style={{ padding: '4px' }}
            preload="metadata"
            muted
            playsInline
            onError={(e) => {
              e.target.style.display = 'none'
              const parent = e.target.parentElement
              if (parent) {
                const fallback = document.createElement('div')
                fallback.className = 'absolute inset-0 bg-slate-700 flex items-center justify-center'
                fallback.innerHTML = '<svg class="w-10 h-10 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/></svg>'
                parent.appendChild(fallback)
              }
            }}
          />
        ) : (
          <div className="w-full h-full bg-slate-700" />
        )
      ) : mediaType === 'text' ? (
        inView ? <div className="absolute inset-0 p-3"><TextFileCard file={file} /></div> : <div className="w-full h-full bg-yellow-300/60" />
      ) : (
        <div className="absolute inset-0 bg-slate-700 flex flex-col items-center justify-center gap-2 group-hover:bg-slate-600 transition">
          <svg className="w-10 h-10 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
          <span className="text-white/60 text-xs">{file.name.split('.').pop().toUpperCase()}</span>
        </div>
      )}
      {/* 悬停类型指示 */}
      {mediaType === 'video' && (
        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 rounded text-white text-xs">{file.name.split('.').pop().toUpperCase()}</div>
      )}
    </div>
  )
})

export default function Gallery({ onClose }) {
  const [folders, setFolders] = useState([])
  const [currentFolder, setCurrentFolder] = useState(null)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [saveDir, setSaveDir] = useState('')

  // 前端缓存：文件夹内容按名称缓存，返回时不重新请求
  const folderCacheRef = useRef({})
  const foldersLoadedRef = useRef(false)

  // 图片查看器状态
  const [viewerIndex, setViewerIndex] = useState(null) // 当前查看的图片索引
  const [zoom, setZoom] = useState(1)
  const zoomRef = useRef(1)
  const baseZoomRef = useRef(1) // 自适应全图时的基准缩放率
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const panRef = useRef({ x: 0, y: 0 })
  const isPanningRef = useRef(false)
  const [isPanning, setIsPanning] = useState(false) // 只用于 cursor 样式渲染
  const panStartRef = useRef({ x: 0, y: 0 })

  // 重命名状态
  const [renamingIndex, setRenamingIndex] = useState(null)
  const [newName, setNewName] = useState('')

  // 排序状态
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')

  // 图片查看器 refs
  const imgRef = useRef(null)
  const viewerOverlayRef = useRef(null) // 查看器 overlay div ref（用于绑定非passive wheel事件）
  const viewerContentRef = useRef(null) // flex-1 图片容器 ref
  const displaySizeRef = useRef({ w: 0, h: 0 }) // 图像原始尺寸
  const thumbStripRef = useRef(null) // 底部缩略图导航容器

  // 排序后的文件列表 - 必须在 useEffect 之前定义
  const sortedFiles = React.useMemo(() => {
    if (!files.length) return []
    const sorted = [...files].sort((a, b) => {
      let cmp = 0
      if (sortBy === 'date') cmp = new Date(a.mtime) - new Date(b.mtime)
      else if (sortBy === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortBy === 'size') cmp = a.size - b.size
      return sortOrder === 'desc' ? -cmp : cmp
    })
    return sorted
  }, [files, sortBy, sortOrder])

  // 排序后的文件夹列表
  const sortedFolders = React.useMemo(() => {
    if (!folders.length) return []
    const sorted = [...folders].sort((a, b) => {
      let cmp = 0
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortBy === 'size') cmp = a.count - b.count
      else cmp = a.count - b.count
      return sortOrder === 'desc' ? -cmp : cmp
    })
    return sorted
  }, [folders, sortBy, sortOrder])

  useEffect(() => {
    loadFolders()
    loadSaveDir()
  }, [])

  const loadSaveDir = async () => {
    try {
      const res = await axios.get('/api/config/save-dir')
      setSaveDir(res.data.saveDir || '')
    } catch {}
  }

  const handleSelectDir = async () => {
    try {
      if (!window.electronAPI?.selectFolder) return
      const result = await window.electronAPI.selectFolder()
      if (!result.success) return
      const res = await axios.put('/api/config/save-dir', { dir: result.folder })
      setSaveDir(res.data.saveDir)
      foldersLoadedRef.current = false
      folderCacheRef.current = {}
      loadFolders()
    } catch (err) {
      console.error('选择目录失败:', err)
    }
  }

  // 绑定非 passive wheel 事件，防止浏览器默认滚动行为
  useEffect(() => {
    const el = viewerOverlayRef.current
    if (!el) return
    const handler = (e) => {
      e.preventDefault()
      handleWheel(e)
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  })

  // 键盘导航
  useEffect(() => {
    if (viewerIndex === null) return

    const handleKeyDown = (e) => {
      if (renamingIndex !== null) return // 重命名时不响应
      if (e.target.closest('input, textarea, select')) return

      const mediaFiles = sortedFiles.filter(f => {
        const t = getMediaType(f)
        return t === 'image' || t === 'video' || t === 'audio' || t === 'text'
      })

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        setViewerIndex(i => Math.max(0, i - 1))
        resetForNavigation()
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        setViewerIndex(i => Math.min(mediaFiles.length - 1, i + 1))
        resetForNavigation()
      } else if (e.key === 'Escape') {
        setViewerIndex(null)
        setRenamingIndex(null)
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        zoomAtCenter(1)
      } else if (e.key === '-') {
        e.preventDefault()
        zoomAtCenter(-1)
      } else if (e.key === '0') {
        resetZoom()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewerIndex, renamingIndex, sortedFiles])

  // 图片查看器初始化：对于浏览器缓存的图片，onLoad 可能在 React 挂载 handler 之前就触发了
  // 导致 displaySizeRef 保持初始值 {0,0}，图片不居中。此 effect 作为 fallback。
  useEffect(() => {
    if (viewerIndex === null) return
    const img = imgRef.current
    if (!img || !img.complete) return
    const container = viewerContentRef.current
    if (!container) return
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    if (!nw || !nh) return

    const cw = container.clientWidth
    const ch = container.clientHeight
    const initZoom = Math.min(cw / nw, ch / nh, 1)
    const cx = (cw - nw * initZoom) / 2
    const cy = (ch - nh * initZoom) / 2
    displaySizeRef.current = { w: nw, h: nh }
    baseZoomRef.current = initZoom
    zoomRef.current = initZoom
    panRef.current = { x: cx, y: cy }
    setZoom(initZoom)
    setPan({ x: cx, y: cy })
  }, [viewerIndex])

  // 底部缩略图导航：自动滚动到当前选中的缩略图
  useEffect(() => {
    if (viewerIndex === null || !thumbStripRef.current) return
    const strip = thumbStripRef.current
    const thumbs = strip.children
    if (thumbs[viewerIndex]) {
      thumbs[viewerIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [viewerIndex])

  // 以指定点为基准缩放（transform-origin: 0 0）
  const zoomAtPoint = (ratio, mx, my) => {
    const container = viewerContentRef.current
    const { w: nw, h: nh } = displaySizeRef.current
    setPan(prevPan => {
      const oldZoom = zoomRef.current
      const newZoom = Math.max(baseZoomRef.current * 0.1, Math.min(baseZoomRef.current * 10, oldZoom * ratio))
      const scale = newZoom / oldZoom
      let newPanX = prevPan.x * scale + mx * (1 - scale)
      let newPanY = prevPan.y * scale + my * (1 - scale)

      // 缩放后边界约束：图像任何边缘都不能超出视口边缘
      if (container && nw > 0 && nh > 0) {
        const cw = container.clientWidth
        const ch = container.clientHeight
        let xMin, xMax, yMin, yMax
        if (nw * newZoom > cw) {
          xMin = cw - nw * newZoom
          xMax = 0
        } else {
          xMin = xMax = (cw - nw * newZoom) / 2
        }
        if (nh * newZoom > ch) {
          yMin = ch - nh * newZoom
          yMax = 0
        } else {
          yMin = yMax = (ch - nh * newZoom) / 2
        }
        newPanX = Math.max(xMin, Math.min(xMax, newPanX))
        newPanY = Math.max(yMin, Math.min(yMax, newPanY))
      }

      zoomRef.current = newZoom
      panRef.current = { x: newPanX, y: newPanY }
      setZoom(newZoom)
      return { x: newPanX, y: newPanY }
    })
  }

  // 以视口为中心缩放（ratio > 1 放大，< 1 缩小）
  const zoomAtCenter = (direction) => {
    const container = viewerContentRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const ratio = direction > 0 ? 1.3 : 0.77
    zoomAtPoint(ratio, rect.width / 2, rect.height / 2)
  }

  const loadFolders = async () => {
    if (foldersLoadedRef.current) return
    setLoading(true)
    try {
      const response = await axios.get('/api/gallery/folders')
      const list = response.data.folders
      setFolders(list)
      foldersLoadedRef.current = true
    } catch (err) {
      console.error('加载文件夹列表失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadFolderContent = async (folderName) => {
    // 如果已经缓存了这个文件夹的内容，直接使用缓存
    if (folderCacheRef.current[folderName]) {
      setFiles(folderCacheRef.current[folderName])
      setCurrentFolder(folderName)
      return
    }
    setLoading(true)
    try {
      const response = await axios.get(`/api/gallery/folder/${encodeURIComponent(folderName)}`)
      folderCacheRef.current[folderName] = response.data.files
      setFiles(response.data.files)
      setCurrentFolder(folderName)
    } catch (err) {
      console.error('加载文件夹内容失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    setCurrentFolder(null)
    setViewerIndex(null)
    loadFolders()
  }

  // 重新居中当前图片（用于重置按钮/按0键）
  const resetZoom = () => {
    const { w: nw, h: nh } = displaySizeRef.current
    const container = viewerContentRef.current
    let initZoom = 1
    let cx = 0, cy = 0
    if (container && nw > 0 && nh > 0) {
      const cw = container.clientWidth
      const ch = container.clientHeight
      initZoom = Math.min(cw / nw, ch / nh, 1)
      cx = (cw - nw * initZoom) / 2
      cy = (ch - nh * initZoom) / 2
    }
    setZoom(initZoom)
    zoomRef.current = initZoom
    setPan({ x: cx, y: cy })
    panRef.current = { x: cx, y: cy }
    isPanningRef.current = false
    setIsPanning(false)
  }

  // 切换图片时快速重置，等 onLoad / useEffect 在新图片加载后自动居中
  const resetForNavigation = () => {
    isPanningRef.current = false
    setIsPanning(false)
  }

  const handleDelete = async (filePath) => {
    if (!confirm('确定要删除这个文件吗？')) return

    try {
      await axios.delete('/api/gallery', { data: { file_path: filePath } })
      setFiles(files.filter(f => f.path !== filePath))
      if (viewerIndex !== null) setViewerIndex(null)
      if (currentFolder) delete folderCacheRef.current[currentFolder]
      foldersLoadedRef.current = false
      if (currentFolder) loadFolderContent(currentFolder)
    } catch (err) {
      alert('删除失败: ' + err.message)
    }
  }

  const handleDownload = (filePath, fileName) => {
    const link = document.createElement('a')
    link.href = filePath
    link.download = fileName
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 重命名
  const handleRename = async (file, index) => {
    if (!newName.trim() || newName === file.name) {
      setRenamingIndex(null)
      return
    }

    try {
      await axios.post('/api/gallery/rename', {
        old_path: file.path,
        new_name: newName.trim()
      })
      // 更新本地状态
      setFiles(files.map(f =>
        f.path === file.path
          ? { ...f, name: newName.trim(), path: file.path.replace(file.name, newName.trim()) }
          : f
      ))
      setRenamingIndex(null)
    } catch (err) {
      alert('重命名失败: ' + err.message)
    }
  }

  const startRename = (file, index) => {
    setRenamingIndex(index)
    setNewName(file.name)
  }

  // 滚轮缩放（鼠标居中）
  const handleWheel = (e) => {
    if (viewerIndex === null) return
    e.preventDefault()
    const container = viewerContentRef.current
    if (!container) return

    const ratio = e.deltaY > 0 ? 0.9 : 1.1
    const rect = container.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    zoomAtPoint(ratio, mx, my)
  }

  // 拖拽平移
  const handleMouseDown = (e) => {
    if (viewerIndex === null) return
    const img = imgRef.current
    if (!img) return
    if (e.target !== img && !img.contains(e.target)) return
    // 只有当图片在当前缩放级别下完全适配视口时才禁止拖动
    const z = zoomRef.current
    const { w: nw, h: nh } = displaySizeRef.current
    const container = viewerContentRef.current
    if (container && nw * z <= container.clientWidth && nh * z <= container.clientHeight) return
    e.preventDefault()
    isPanningRef.current = true
    setIsPanning(true)
    panStartRef.current = { x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y }
  }

  const handleMouseMove = (e) => {
    if (!isPanningRef.current) return
    const container = viewerContentRef.current
    if (!container) return
    const z = zoomRef.current
    const { w: nw, h: nh } = displaySizeRef.current

    const newX = e.clientX - panStartRef.current.x
    const newY = e.clientY - panStartRef.current.y
    const cw = container.clientWidth
    const ch = container.clientHeight

    // 边界：图像任何边缘都不能超出视口边缘
    let xMin, xMax, yMin, yMax
    if (nw * z > cw) {
      // 图片宽于视口：可水平拖动，边缘锁定在视口边缘
      xMin = cw - nw * z  // 图片右边对齐视口右边
      xMax = 0             // 图片左边对齐视口左边
    } else {
      // 图片完全在视口内：水平居中，不可拖动
      xMin = xMax = (cw - nw * z) / 2
    }
    if (nh * z > ch) {
      // 图片高于视口：可垂直拖动，边缘锁定在视口边缘
      yMin = ch - nh * z  // 图片下边对齐视口下边
      yMax = 0             // 图片上边对齐视口上边
    } else {
      // 图片完全在视口内：垂直居中，不可拖动
      yMin = yMax = (ch - nh * z) / 2
    }

    const clampedX = Math.max(xMin, Math.min(xMax, newX))
    const clampedY = Math.max(yMin, Math.min(yMax, newY))
    setPan({ x: clampedX, y: clampedY })
    panRef.current = { x: clampedX, y: clampedY }
  }

  const handleMouseUp = () => {
    isPanningRef.current = false
    setIsPanning(false)
  }

  // 文本文件便利贴封面预览
  const TextCoverPreview = ({ url }) => {
    const [preview, setPreview] = useState('')
    const [loading, setLoading] = useState(true)
    useEffect(() => {
      fetch(url)
        .then(r => r.text())
        .then(text => {
          const snippet = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').substring(0, 200)
          setPreview(snippet + (text.length > 200 ? '...' : ''))
          setLoading(false)
        })
        .catch(() => { setPreview('?'); setLoading(false) })
    }, [url])
  return (
    <div className="w-full h-full bg-gradient-to-br from-yellow-300 to-yellow-400 p-2 flex flex-col relative overflow-hidden rounded-lg shadow-sm ring-1 ring-yellow-500/10">
      <svg className="w-4 h-4 text-yellow-600/60 mb-1 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 2H8c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 18H9v-2h6v2zm0-4H9v-2h6v2zm0-4H9V8h6v4z"/>
      </svg>
        {loading ? (
          <div className="text-xs text-yellow-700/50 animate-pulse">...</div>
        ) : (
        <p className="text-xs text-yellow-900 leading-relaxed break-all overflow-hidden flex-1">{preview}</p>
        )}
      </div>
    )
  }

  // 音频文件波形封面
  const AudioCoverPreview = () => (
    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
      <svg className="w-10 h-10 text-white/70" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8.5v7a4.47 4.47 0 0 0 2.5-3.5zM14 3.23v2.06a7.007 7.007 0 0 1 0 13.42v2.06A9.01 9.01 0 0 0 14 3.23z"/>
      </svg>
    </div>
  )

  // 根据 URL 检测封面媒体类型
  const getCoverType = (url) => {
    if (!url) return null
    const ext = url.split('.').pop().toLowerCase()
    if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv'].includes(ext)) return 'video'
    if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'opus', 'wma'].includes(ext)) return 'audio'
    if (['json', 'txt', 'csv', 'md', 'log', 'html', 'xml'].includes(ext)) return 'text'
    return 'image'
  }

  // 文件夹堆叠组件（类扑克牌扇面展开效果）
  const StackedFolder = ({ folder }) => {
    // 取最多3个封面（最新生成的在最前面）
    const coverImages = (folder.covers || []).slice().reverse()
    // 补齐到3个，不足的用 null 占位
    const layers = []
    for (let i = 0; i < 3; i++) {
      layers.push(coverImages[i] || null)
    }

    const EDGE = 4
    const GAP = 18
    const hasRealCovers = layers.filter(Boolean).length
    const [glow, setGlow] = useState(false)

    return (
      <div
        className="relative w-full aspect-[9/14] cursor-pointer transition-all duration-200 hover:scale-[1.04]"
        onClick={() => loadFolderContent(folder.name)}
        onMouseEnter={() => setGlow(true)}
        onMouseLeave={() => setGlow(false)}
        style={{
          filter: glow ? 'drop-shadow(0 0 2px rgba(40,100,255,1)) drop-shadow(0 0 10px rgba(50,140,255,0.8))' : 'none',
          transition: 'filter 0.25s ease'
        }}
      >
        {layers.map((url, i) => {
          const left = EDGE + i * GAP
          const right = EDGE + (2 - i) * GAP
          if (i >= hasRealCovers) return null
          return (
            <div
              key={i}
              className="absolute"
              style={{
                top: `${EDGE}px`,
                left: `${left}px`,
                right: `${right}px`,
                bottom: `${EDGE}px`,
                transform: `translateY(${i * GAP}px)`,
                zIndex: 2 - i
              }}
            >
              <div className="w-full h-full">
                {(() => {
                  const type = getCoverType(url)
                  if (type === 'video') {
                    return (
                      <div className="w-full h-full flex items-center justify-center relative rounded-xl overflow-hidden">
                        <video src={url} className="w-full h-full object-contain" preload="metadata" muted playsInline />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <svg className="w-8 h-8 text-white/70 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" viewBox="0 0 24 24" fill="white">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                          </svg>
                        </div>
                      </div>
                    )
                  } else if (type === 'text') {
                    return <TextCoverPreview url={url} />
                  } else if (type === 'audio') {
                    return <AudioCoverPreview />
                  } else {
                    return <img src={getThumbUrl(url)} alt="" className="w-full h-full object-contain rounded-xl" loading="eager" />
                  }
                })()}
              </div>
            </div>
          )
        })}
        <div className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-indigo-500 rounded-full text-white text-xs font-bold shadow-lg z-10">
          {folder.count}
        </div>
      </div>
    )
  }

  // 当前查看的图片
  const imageFiles = sortedFiles.filter(f => {
    const t = getMediaType(f)
    return t === 'image' || t === 'video' || t === 'audio' || t === 'text'
  })
  const currentImage = viewerIndex !== null ? imageFiles[viewerIndex] : null

  return (
    <div
      className="fixed inset-0 bg-black z-50 flex flex-col"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 头部 */}
      <div className="h-12 bg-slate-900/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          {currentFolder ? (
            <>
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs transition"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                返回资产库
              </button>
              <span className="text-white font-medium text-sm">{currentFolder === '__root__' ? saveDir.split('\\').pop() || saveDir : currentFolder}</span>
              <span className="text-slate-500 text-xs">· {imageFiles.length} 个文件</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="5" width="18" height="14" rx="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
              </svg>
              <span className="text-white font-medium text-sm">资产库</span>
              <span className="text-slate-500 text-xs">· {folders.length} 个文件夹</span>
            </>
          )}
        </div>

        {/* 保存目录路径栏（资产库根视图时显示） */}
        {!currentFolder && (
          <div className="flex items-center gap-2 flex-1 max-w-3xl mx-6">
            <button
              onClick={handleSelectDir}
              className="flex items-center gap-2 px-3 h-8 rounded-md bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 hover:border-slate-600/50 text-indigo-300 text-sm transition shrink-0"
              title="选择保存目录"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <span className="text-slate-400">选择</span>
            </button>
            <div className="flex-1 flex items-center h-8 px-3 bg-slate-800/60 border border-slate-700/40 rounded-md text-slate-300 text-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-500 shrink-0 mr-2">
                <rect x="3" y="5" width="18" height="14" rx="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
              </svg>
              <input
                type="text"
                value={saveDir}
                readOnly
                className="flex-1 bg-transparent outline-none text-slate-300 text-sm truncate cursor-default"
              />
            </div>
          </div>
        )}

        {/* 排序控制 */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="date">按时间</option>
            <option value="name">按名称</option>
            <option value="size">按大小</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="p-1.5 bg-slate-800 border border-white/10 rounded-lg text-slate-400 hover:text-white transition"
            title={sortOrder === 'desc' ? '降序' : '升序'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ transform: sortOrder === 'asc' ? 'rotate(180deg)' : '' }}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition ml-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-y-scroll p-4 bg-black">
        {/* 文件夹列表 — 始终挂载，用 hidden 切换避免 DOM 卸载导致图片重新加载 */}
        <div className={currentFolder ? 'hidden' : ''}>
          {loading && !foldersLoadedRef.current ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-slate-500 text-sm">加载中...</span>
              </div>
            </div>
          ) : sortedFolders.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-slate-500">
                <svg className="w-16 h-16 mx-auto mb-3 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="3" y="5" width="18" height="14" rx="2"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                </svg>
                <p>暂无资产</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-x-4 gap-y-8">
              {sortedFolders.map((folder, i) => (
                <div key={folder.name} className="group" style={{ paddingBottom: '40px' }}>
                  <StackedFolder folder={folder} />
                  <div className="mt-2">
                    <p className="text-white text-xs font-medium truncate text-center">{folder.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 文件列表 — 始终挂载，用 hidden 切换 */}
        <div className={!currentFolder ? 'hidden' : ''}>
          {imageFiles.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-slate-500">此文件夹为空</div>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-1">
              {imageFiles.map((file, i) => (
                <MediaThumb
                  key={file.path}
                  file={file}
                  index={i}
                  onClick={() => { setViewerIndex(i); resetForNavigation() }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 图片查看器 */}
      {currentImage && (
        <div
          className="fixed inset-0 bg-black z-60 flex flex-col"
          ref={viewerOverlayRef}
          onClick={(e) => { e.stopPropagation() }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            cursor: (() => {
              const container = viewerContentRef.current
              if (!container) return 'default'
              const { w: nw, h: nh } = displaySizeRef.current
              if (nw * zoom > container.clientWidth || nh * zoom > container.clientHeight) {
                return isPanning ? 'grabbing' : 'grab'
              }
              return 'zoom-out'
            })()
          }}
        >
          {/* 顶部工具栏 */}
          <div className="h-12 shrink-0 bg-slate-900/90 flex items-center justify-between px-4 z-10 border-b border-white/10">
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); setViewerIndex(null) }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs transition"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                返回相册
              </button>
              <span className="text-white text-sm">{viewerIndex + 1} / {imageFiles.length}</span>
              <span className="text-slate-400 text-xs">{currentImage.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {/* 缩放控制（仅图片显示） */}
              {getMediaType(currentImage) === 'image' && (
                <>
                      <button
                        onClick={(e) => { e.stopPropagation(); zoomAtCenter(-1) }}
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="11" cy="11" r="8"/>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                          <line x1="8" y1="11" x2="14" y2="11"/>
                        </svg>
                      </button>
                      <span className="text-white text-xs w-12 text-center">{Math.round(zoom / baseZoomRef.current * 100)}%</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); zoomAtCenter(1) }}
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white"
                      >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      <line x1="11" y1="8" x2="11" y2="14"/>
                      <line x1="8" y1="11" x2="14" y2="11"/>
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); resetZoom() }}
                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white"
                    title="重置"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                      <path d="M3 3v5h5"/>
                    </svg>
                  </button>

                  <div className="w-px h-6 bg-white/20 mx-2" />
                </>
              )}

              <button
                onClick={(e) => { e.stopPropagation(); startRename(currentImage, viewerIndex) }}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white"
                title="重命名"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDownload(currentImage.path, currentImage.name) }}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white"
                title="下载"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(currentImage.path) }}
                className="p-1.5 bg-red-500/60 hover:bg-red-500 rounded-lg text-white"
                title="删除"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setViewerIndex(null) }}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {/* 媒体展示 */}
          <div className="flex-1 relative overflow-hidden" ref={viewerContentRef}>
            {(() => {
              const mediaType = getMediaType(currentImage)
              if (mediaType === 'video') {
                return (
                  <div className="w-full h-full flex items-center justify-center">
                    <video
                      key={currentImage.path}
                      src={currentImage.path}
                      controls
                      preload="auto"
                      className="max-w-full max-h-full object-contain"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )
              } else if (mediaType === 'audio') {
                return (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4 w-full max-w-lg px-8">
                      <div className="w-32 h-32 rounded-full bg-slate-800 border-2 border-indigo-500 flex items-center justify-center">
                        <svg className="w-16 h-16 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M9 18V5l12-2v13"/>
                          <circle cx="6" cy="18" r="3"/>
                          <circle cx="18" cy="16" r="3"/>
                        </svg>
                      </div>
                      <span className="text-white text-lg font-medium">{currentImage.name}</span>
                      <audio
                        src={currentImage.path}
                        controls
                        className="w-full"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                )
              } else if (mediaType === 'text') {
                return (
                  <div className="w-full h-full flex items-center justify-center">
                    <TextFileViewer filePath={currentImage.path} fileName={currentImage.name} />
                  </div>
                )
              } else {
                return (
                  <img
                    ref={imgRef}
                    src={currentImage.path}
                    alt=""
                    className=""
                    style={{
                      transformOrigin: '0 0',
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                      maxWidth: 'none',
                      maxHeight: 'none'
                    }}
                    onClick={(e) => e.stopPropagation()}
                    draggable={false}
                    onLoad={(e) => {
                      const img = e.target
                      const container = viewerContentRef.current
                      if (!container) return
                      const cw = container.clientWidth
                      const ch = container.clientHeight
                      const nw = img.naturalWidth || 1
                      const nh = img.naturalHeight || 1
                      const initZoom = Math.min(cw / nw, ch / nh, 1)
                      const cx = (cw - nw * initZoom) / 2
                      const cy = (ch - nh * initZoom) / 2
                      displaySizeRef.current = { w: nw, h: nh }
                      baseZoomRef.current = initZoom
                      zoomRef.current = initZoom
                      panRef.current = { x: cx, y: cy }
                      setZoom(initZoom)
                      setPan({ x: cx, y: cy })
                    }}
                  />
                )
              }
            })()}
          </div>

          {/* 左右切换按钮 */}
          {imageFiles.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setViewerIndex(i => Math.max(0, i - 1)); resetForNavigation() }}
                disabled={viewerIndex === 0}
                className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition ${
                  viewerIndex === 0 ? 'bg-white/5 text-white/30' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setViewerIndex(i => Math.min(imageFiles.length - 1, i + 1)); resetForNavigation() }}
                disabled={viewerIndex === imageFiles.length - 1}
                className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition ${
                  viewerIndex === imageFiles.length - 1 ? 'bg-white/5 text-white/30' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </>
          )}

          {/* 底部缩略图导航 */}
          <div className="h-20 shrink-0 bg-slate-900/90 border-t border-white/10 flex items-center justify-start gap-1 px-4 overflow-x-auto"
            ref={thumbStripRef}>
            {imageFiles.map((file, i) => {
              const mediaType = getMediaType(file)
              return (
                <div
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setViewerIndex(i); resetForNavigation() }}
                  className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 cursor-pointer transition-all relative ${
                    i === viewerIndex ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  {mediaType === 'image' ? (
                    <img src={getThumbUrl(file.path)} alt="" className="w-full h-full object-cover" />
                  ) : mediaType === 'video' ? (
                    <>
                      <video
                        src={file.path}
                        className="w-full h-full object-cover absolute inset-0"
                        preload="metadata"
                        muted
                        playsInline
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white drop-shadow" viewBox="0 0 24 24" fill="white">
                          <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                      </div>
                    </>
                  ) : mediaType === 'text' ? (
                    <div className="w-full h-full bg-gradient-to-br from-yellow-300 to-yellow-400 flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-700" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 2H8c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 18H9v-2h6v2zm0-4H9v-2h6v2zm0-4H9V8h6v4z"/>
                      </svg>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                      <svg className="w-6 h-6 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 18V5l12-2v13"/>
                        <circle cx="6" cy="18" r="3"/>
                        <circle cx="18" cy="16" r="3"/>
                      </svg>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 重命名弹窗 */}
      {renamingIndex !== null && currentImage && (
        <div
          className="fixed inset-0 bg-black/80 z-70 flex items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setRenamingIndex(null) }}
        >
          <div className="bg-slate-800 rounded-xl p-4 w-80 border border-white/10">
            <h3 className="text-white font-medium mb-3">重命名</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename(currentImage, renamingIndex)
                if (e.key === 'Escape') setRenamingIndex(null)
              }}
              className="w-full px-3 py-2 bg-slate-700 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setRenamingIndex(null)}
                className="px-3 py-1.5 text-slate-400 hover:text-white transition"
              >
                取消
              </button>
              <button
                onClick={() => handleRename(currentImage, renamingIndex)}
                className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}