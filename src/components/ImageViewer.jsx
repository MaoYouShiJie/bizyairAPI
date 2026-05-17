import React, { useState, useRef, useEffect, useCallback } from 'react'

export default function ImageViewer({ src, onClose }) {
  const [zoom, setZoom] = useState(1)
  const zoomRef = useRef(1)
  const baseZoomRef = useRef(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const panRef = useRef({ x: 0, y: 0 })
  const isPanningRef = useRef(false)
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0 })
  const imgRef = useRef(null)
  const overlayRef = useRef(null)
  const contentRef = useRef(null)
  const displaySizeRef = useRef({ w: 0, h: 0 })

  const zoomAtPoint = useCallback((ratio, mx, my) => {
    const container = contentRef.current
    const { w: nw, h: nh } = displaySizeRef.current
    setPan(prevPan => {
      const oldZoom = zoomRef.current
      const newZoom = Math.max(baseZoomRef.current * 0.1, Math.min(baseZoomRef.current * 10, oldZoom * ratio))
      const scale = newZoom / oldZoom
      let newPanX = prevPan.x * scale + mx * (1 - scale)
      let newPanY = prevPan.y * scale + my * (1 - scale)

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
  }, [])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const container = contentRef.current
    if (!container) return
    const ratio = e.deltaY > 0 ? 0.9 : 1.1
    const rect = container.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    zoomAtPoint(ratio, mx, my)
  }, [zoomAtPoint])

  useEffect(() => {
    const el = overlayRef.current
    if (!el) return
    const handler = (e) => {
      e.preventDefault()
      handleWheel(e)
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [handleWheel])

  const handleMouseDown = (e) => {
    const img = imgRef.current
    if (!img) return
    if (e.target !== img && !img.contains(e.target)) return
    const z = zoomRef.current
    const { w: nw, h: nh } = displaySizeRef.current
    const container = contentRef.current
    if (container && nw * z <= container.clientWidth && nh * z <= container.clientHeight) return
    e.preventDefault()
    isPanningRef.current = true
    setIsPanning(true)
    panStartRef.current = { x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y }
  }

  const handleMouseMove = (e) => {
    if (!isPanningRef.current) return
    const container = contentRef.current
    const { w: nw, h: nh } = displaySizeRef.current
    const newPanX = e.clientX - panStartRef.current.x
    const newPanY = e.clientY - panStartRef.current.y
    const z = zoomRef.current

    if (container && nw > 0 && nh > 0) {
      const cw = container.clientWidth
      const ch = container.clientHeight
      let xMin, xMax, yMin, yMax
      if (nw * z > cw) {
        xMin = cw - nw * z
        xMax = 0
      } else {
        xMin = xMax = (cw - nw * z) / 2
      }
      if (nh * z > ch) {
        yMin = ch - nh * z
        yMax = 0
      } else {
        yMin = yMax = (ch - nh * z) / 2
      }
      panRef.current = {
        x: Math.max(xMin, Math.min(xMax, newPanX)),
        y: Math.max(yMin, Math.min(yMax, newPanY)),
      }
    } else {
      panRef.current = { x: newPanX, y: newPanY }
    }
    setPan({ ...panRef.current })
  }

  const handleMouseUp = () => {
    isPanningRef.current = false
    setIsPanning(false)
  }

  useEffect(() => {
    if (!src) return
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [src])

  useEffect(() => {
    if (!src) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose && onClose()
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        const container = contentRef.current
        if (container) {
          const rect = container.getBoundingClientRect()
          zoomAtPoint(1.3, rect.width / 2, rect.height / 2)
        }
      } else if (e.key === '-') {
        e.preventDefault()
        const container = contentRef.current
        if (container) {
          const rect = container.getBoundingClientRect()
          zoomAtPoint(0.77, rect.width / 2, rect.height / 2)
        }
      } else if (e.key === '0') {
        resetZoom()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [src, onClose, zoomAtPoint])

  const resetZoom = () => {
    const { w: nw, h: nh } = displaySizeRef.current
    const container = contentRef.current
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

  const handleImgLoad = (e) => {
    const img = e.target
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    displaySizeRef.current = { w: nw, h: nh }
    const container = contentRef.current
    if (!container) return
    const cw = container.clientWidth
    const ch = container.clientHeight
    const initZoom = Math.min(cw / nw, ch / nh, 1)
    baseZoomRef.current = initZoom
    zoomRef.current = initZoom
    setZoom(initZoom)
    const cx = (cw - nw * initZoom) / 2
    const cy = (ch - nh * initZoom) / 2
    setPan({ x: cx, y: cy })
    panRef.current = { x: cx, y: cy }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/90 z-50 flex flex-col"
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
    >
      <div className="h-12 bg-transparent flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={resetZoom}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition"
            title="重置缩放 (0)"
          >
            重置
          </button>
          <span className="text-white/60 text-xs">滚轮缩放 · 拖拽平移</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
          title="关闭 (Esc)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div
        ref={contentRef}
        className="flex-1 relative overflow-hidden"
        onMouseDown={handleMouseDown}
      >
        <img
          ref={imgRef}
          src={src}
          alt=""
          onLoad={handleImgLoad}
          draggable={false}
          style={{
            transformOrigin: '0 0',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            position: 'absolute',
            left: 0,
            top: 0,
          }}
          className="max-w-none"
        />
      </div>
    </div>
  )
}
