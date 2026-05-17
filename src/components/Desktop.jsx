import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'

export default function Desktop({
  apps = [],
  settings = {},
  onRefreshApps,
  addLog,
  onOpenApp,
  onContextMenu,
}) {
  const [dragState, setDragState] = useState(null)
  const [dragPos, setDragPos] = useState(null)
  const [dragInsertIdx, setDragInsertIdx] = useState(null)
  const containerRef = useRef(null)
  const dragRef = useRef(null)
  const itemSizeRef = useRef({ w: 0, h: 0 })
  const iconSizes = { small: 64, medium: 96, large: 128 }
  const iconSize = iconSizes[settings?.iconSize] || 96

  // 排序应用
  const sortedApps = useMemo(() => {
    if (!apps || apps.length === 0) return []
    
    // 自定义排序（手动拖拽排序），最高优先级
    if (settings?.appOrder && settings.appOrder.length > 0 && settings?.sortBy === 'custom') {
      const orderMap = {}
      settings.appOrder.forEach((id, idx) => { orderMap[id] = idx })
      return [...apps].sort((a, b) => {
        const aOrder = orderMap[a.id]
        const bOrder = orderMap[b.id]
        if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder
        if (aOrder !== undefined) return -1
        if (bOrder !== undefined) return 1
        return 0
      })
    }
    
    // 否则按 sortBy 和 sortOrder 排序
    const sortBy = settings?.sortBy || 'name'
    const sortOrder = settings?.sortOrder || 'asc'
    
    return [...apps].sort((a, b) => {
      let cmp = 0
      if (sortBy === 'name') cmp = (a.name || '').localeCompare(b.name || '')
      else if (sortBy === 'created') cmp = new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      else if (sortBy === 'updated') cmp = new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0)
      return sortOrder === 'desc' ? -cmp : cmp
    })
  }, [apps, settings?.sortBy, settings?.sortOrder, settings?.appOrder])

  // 保存排序
  const saveAppOrder = useCallback(async (newOrder) => {
    try {
      await axios.patch('/api/apps/order', { order: newOrder })
    } catch (err) {
      addLog?.('❌ 保存排序失败', 'error')
    }
  }, [])

  // 拖放处理
  const handleDrop = useCallback(async (dragId, clientX, clientY) => {
    const newOrder = [...(settings?.appOrder || apps.map(a => a.id))]
    const fromIdx = newOrder.indexOf(dragId)
    if (fromIdx === -1) return

    if (!containerRef.current) return
    const items = containerRef.current.querySelectorAll('[data-item-id]')
    let bestIndex = -1
    let bestDist = Infinity

    items.forEach((item, idx) => {
      const itemId = item.dataset.itemId
      if (itemId === dragId) return
      const rect = item.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dy = Math.abs(clientY - cy)
      if (dy > rect.height * 0.7) return
      const dx = clientX - cx
      if (Math.abs(dx) < bestDist) {
        bestDist = Math.abs(dx)
        bestIndex = dx < 0 ? idx : idx + 1
      }
    })

    // 没有匹配到任何应用项（拖到了空白区域），不改变排序
    if (bestIndex === -1) {
      setDragState(null)
      setDragPos(null)
      setDragInsertIdx(null)
      return
    }

    newOrder.splice(fromIdx, 1)
    const insertAt = bestIndex > fromIdx ? bestIndex - 1 : bestIndex
    newOrder.splice(insertAt, 0, dragId)
    // 保存排序并切换到自定义排序模式
    try { await axios.post('/api/apps/settings', { ...settings, sortBy: 'custom', appOrder: newOrder }) } catch (e) {}
    await onRefreshApps?.()
    setDragState(null)
    setDragPos(null)
    setDragInsertIdx(null)
  }, [apps, settings?.appOrder, saveAppOrder, onRefreshApps])

  // Pointer 拖拽
  const handlePointerDown = useCallback((e, id) => {
    if (e.button !== 0) return
    dragRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      moved: false
    }
  }, [])

  useEffect(() => {
    const handlePointerMove = (e) => {
      const drag = dragRef.current
      if (!drag) return
      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY
      // 5px 阈值
      if (!drag.moved && Math.abs(dx) < 5 && Math.abs(dy) < 5) return
      if (!drag.moved) {
        drag.moved = true
        setDragState({ id: drag.id })
        // 测量一个网格项的尺寸
        if (containerRef.current) {
          const first = containerRef.current.querySelector('[data-item-id]')
          if (first) {
            const r = first.getBoundingClientRect()
            itemSizeRef.current = { w: r.width, h: r.height }
          }
        }
      }
      setDragPos({ x: e.clientX, y: e.clientY })
      // 实时计算插入位置
      if (containerRef.current) {
        const items = containerRef.current.querySelectorAll('[data-item-id]')
        let bestIdx = -1, bestDist = Infinity
        items.forEach((item, idx) => {
          if (item.dataset.itemId === drag.id) return
          const rect = item.getBoundingClientRect()
          const cx = rect.left + rect.width / 2
          const cy = rect.top + rect.height / 2
          const ddy = Math.abs(e.clientY - cy)
          if (ddy > rect.height * 0.7) return
          const ddx = e.clientX - cx
          if (Math.abs(ddx) < bestDist) {
            bestDist = Math.abs(ddx)
            bestIdx = ddx < 0 ? idx : idx + 1
          }
        })
        setDragInsertIdx(bestIdx >= 0 ? bestIdx : null)
      }
    }

    const handlePointerUp = (e) => {
      const drag = dragRef.current
      if (!drag) return
      dragRef.current = null
      if (!drag.moved) {
        // 单击打开应用
        const clickedApp = sortedApps.find(a => a.id === drag.id)
        if (clickedApp) {
          onOpenApp?.(clickedApp)
          addLog?.(`🚀 启动应用：${clickedApp.name}`)
        }
        return
      }
      // 拖拽完成 - handleDrop 内部会清状态
      handleDrop(drag.id, e.clientX, e.clientY)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [handleDrop])



  // 获取图标
  const getIconSrc = (app) => {
    if (app.icon) {
      if (app.icon.startsWith('http')) return app.icon
      if (app.icon.startsWith('/')) return app.icon
      return `/icons/${app.icon}`
    }
    return '/logo002.png'
  }

  const dragApp = dragState ? sortedApps.find(a => a.id === dragState.id) : null

  return (
    <div
      className="relative w-full h-full overflow-hidden pointer-events-auto"
      onContextMenu={(e) => {
        e.preventDefault()
        onContextMenu?.(e, null, 'desktop')
      }}
    >
      {/* 应用网格 */}
        <div
          ref={containerRef}
          className="relative w-full h-full p-4 grid auto-rows-max"
          style={{
            gridTemplateColumns: `repeat(auto-fill, minmax(${iconSize + 16}px, 1fr))`,
            gap: iconSize === 64 ? '12px' : iconSize === 96 ? '18px' : '24px',
            alignContent: 'start',
          }}
        >
        {sortedApps.map((app, idx) => {
          const isDragging = dragState?.id === app.id
          const iconSrc = getIconSrc(app)
          
          // 计算拖拽时的偏移动画
          let shiftX = 0, shiftY = 0
          if (dragState && dragInsertIdx !== null && !isDragging) {
            const fromIdx = sortedApps.findIndex(a => a.id === dragState.id)
            if (fromIdx !== -1 && dragInsertIdx !== null) {
              const { w, h } = itemSizeRef.current
              if (dragInsertIdx > fromIdx && idx > fromIdx && idx < dragInsertIdx) {
                shiftX = -(w + 24)
              } else if (dragInsertIdx < fromIdx && idx >= dragInsertIdx && idx < fromIdx) {
                shiftX = w + 24
              }
            }
          }
          
          return (
            <div
              key={app.id}
              data-item-id={app.id}
              className={`relative flex flex-col items-center gap-1 select-none cursor-pointer ${isDragging ? 'opacity-30' : ''}`}
              style={{
                transform: shiftX || shiftY ? `translate(${shiftX}px, ${shiftY}px)` : '',
                transition: shiftX || shiftY ? 'transform 0.2s ease' : ''
              }}
              onPointerDown={(e) => handlePointerDown(e, app.id)}
              // 单击打开应用在 handlePointerUp 中处理
              onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onContextMenu?.(e, app, 'app')
              }}
            >
              {/* 图标 */}
              <div
                className="rounded-xl overflow-hidden shadow-lg transition-transform duration-150 hover:scale-105 relative"
                style={{ width: iconSize, height: iconSize }}
              >
                <img
                  src={iconSrc}
                  alt={app.name}
                  className="w-full h-full object-cover"
                  style={{ backgroundColor: app.iconBgColor || '#6366f1' }}
                  draggable={false}
                />
                {app.isDefault ? (
                  <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ border: '4.5px solid rgba(91,33,182,0.9)' }} />
                ) : (
                  <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ border: '4.5px solid rgba(255,255,255,0.5)' }} />
                )}
              </div>
              
              {/* 应用名 */}
              <span 
                className="text-white text-xs text-center drop-shadow-md leading-tight px-1" 
                style={{ maxWidth: iconSize + 16 }}
                title={app.name}
              >
                {app.name}
              </span>
            </div>
          )
        })}
        
        {/* 添加应用图标 - 透明背景 */}
        <div
          key="add-app-icon"
          data-item-id="add-app"
          className="relative flex flex-col items-center gap-1 select-none cursor-pointer"
          onClick={() => {
            addLog?.('➕ 打开添加应用弹窗')
            onContextMenu?.(null, null, 'add')
          }}
          onContextMenu={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <div
            className="rounded-xl overflow-hidden shadow-lg transition-transform duration-150 hover:scale-105 flex items-center justify-center"
            style={{ 
              width: iconSize, 
              height: iconSize,
              backgroundColor: 'transparent',
              border: '2px dashed rgba(255,255,255,0.3)'
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <span className="text-white/60 text-xs text-center drop-shadow-md leading-tight px-1" style={{ maxWidth: iconSize + 16 }}>添加应用</span>
        </div>
      </div>

      {/* 拖拽中的浮动图标 */}
      {dragState && dragPos && dragApp && (
        <div
          className="fixed pointer-events-none z-[9999] rounded-xl overflow-hidden shadow-2xl"
          style={{
            left: dragPos.x - iconSize / 2,
            top: dragPos.y - iconSize / 2,
            width: iconSize,
            height: iconSize,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          <img
            src={getIconSrc(dragApp)}
            alt={dragApp.name}
            className="w-full h-full object-cover"
            style={{ backgroundColor: dragApp.iconBgColor || '#6366f1' }}
            draggable={false}
          />
        </div>
      )}
    </div>
  )
}
