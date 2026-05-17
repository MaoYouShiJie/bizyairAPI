import React, { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'

export default function ConfigPanel({ onClose }) {
  const [apiKeys, setApiKeys] = useState([])
  const [currentKeyId, setCurrentKeyId] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingKey, setEditingKey] = useState(null)
  const [message, setMessage] = useState('')
  const [autoSwitch, setAutoSwitch] = useState(false)

  const [formName, setFormName] = useState('')
  const [formKey, setFormKey] = useState('')
  const [balances, setBalances] = useState({}) // { keyId: { loading, data, error } }

  const queryBalance = async (keyItem) => {
    setBalances(prev => ({ ...prev, [keyItem.id]: { loading: true, data: null, error: null } }))
    try {
      const res = await axios.get('/api/balance', { params: { key: keyItem.key } })
      setBalances(prev => ({ ...prev, [keyItem.id]: { loading: false, data: res.data, error: null } }))
    } catch (err) {
      setBalances(prev => ({ ...prev, [keyItem.id]: { loading: false, data: null, error: err.response?.data?.error || err.message } }))
    }
  }

  const fetchAllBalances = useCallback(async (keys) => {
    if (!keys || keys.length === 0) return
    await Promise.all(keys.map(k => queryBalance(k)))
  }, [])

  // 拖拽 — 纯鼠标事件 + 浮层
  const dragState = useRef(null) // { item, dragIdx, offsetX, offsetY, ghostWidth } when active
  const [ghostStyle, setGhostStyle] = useState(null) // { left, top, width }
  const [insertIdx, setInsertIdx] = useState(null)
  const insertPos = useRef(null)
  const listRef = useRef(null)
  const keysRef = useRef([])

  useEffect(() => { keysRef.current = apiKeys }, [apiKeys])

  useEffect(() => {
    fetchApiKeys()
    fetchSettings()
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  // 自动查询所有 key 的余额
  useEffect(() => {
    if (apiKeys.length > 0) {
      fetchAllBalances(apiKeys)
    }
  }, [apiKeys, fetchAllBalances])

  // 监听应用运行成功后的余额刷新事件
  useEffect(() => {
    const handler = () => fetchAllBalances(keysRef.current)
    window.addEventListener('bizyair-balance-refresh', handler)
    return () => window.removeEventListener('bizyair-balance-refresh', handler)
  }, [fetchAllBalances])

  const handleMouseDown = (e, idx) => {
    if (e.button !== 0) return
    if (e.target.closest('button, input, textarea, select')) return
    e.preventDefault()
    const el = e.currentTarget.closest('[data-key-item]')
    if (!el) return
    const rect = el.getBoundingClientRect()
    const item = apiKeys[idx]

    dragState.current = {
      item,
      dragIdx: idx,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      ghostWidth: rect.width,
      ghostHeight: rect.height,
    }
    insertPos.current = idx
    setInsertIdx(idx)
    setGhostStyle({ left: rect.left, top: rect.top, width: rect.width })

    setApiKeys(prev => prev.filter((_, i) => i !== idx))

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = (e) => {
    const ds = dragState.current
    if (!ds) return
    setGhostStyle(prev => prev ? {
      ...prev,
      left: e.clientX - ds.offsetX,
      top: e.clientY - ds.offsetY,
    } : null)

    const items = listRef.current?.querySelectorAll('[data-key-item]')
    if (!items || items.length === 0) {
      if (insertPos.current !== 0) { insertPos.current = 0; setInsertIdx(0) }
      return
    }
    let newIdx = items.length
    for (let i = 0; i < items.length; i++) {
      const r = items[i].getBoundingClientRect()
      if (e.clientY < r.top + r.height / 2) { newIdx = i; break }
      if (e.clientY >= r.top && e.clientY <= r.bottom) { newIdx = i + 1; break }
    }
    if (newIdx !== insertPos.current) {
      insertPos.current = newIdx
      setInsertIdx(newIdx)
    }
  }

  const handleMouseUp = () => {
    const ds = dragState.current
    const insertAt = insertPos.current
    dragState.current = null
    insertPos.current = null
    setGhostStyle(null)
    setInsertIdx(null)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)

    if (ds && insertAt !== null) {
      setApiKeys(prev => {
        const newKeys = [...prev]
        newKeys.splice(insertAt, 0, ds.item)
        setTimeout(() => saveKeysOrder(newKeys), 0)
        return newKeys
      })
    }
  }

  const saveKeysOrder = async (keys) => {
    try {
      await axios.put('/api/config/keys/order', { order: keys.map(k => k.id) })
    } catch (err) {
      console.error('Failed to save key order:', err)
    }
  }

  const fetchApiKeys = async () => {
    try {
      const res = await axios.get('/api/config/keys')
      setApiKeys(res.data.apiKeys || [])
      setCurrentKeyId(res.data.currentKeyId)
    } catch (err) {
      console.error('Failed to fetch API keys:', err)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/apps')
      if (res.data.settings?.autoSwitch !== undefined) {
        setAutoSwitch(res.data.settings.autoSwitch)
      }
    } catch (e) {
      console.error('Failed to fetch settings:', e)
    }
  }

  const handleAddKey = async () => {
    if (!formName.trim() || !formKey.trim()) {
      setMessage('❌ 名称和 Key 不能为空')
      return
    }
    try {
      await axios.post('/api/config/keys', { name: formName.trim(), key: formKey.trim() })
      setMessage('✅ 添加成功')
      setFormName(''); setFormKey(''); setShowAddForm(false)
      fetchApiKeys()
    } catch (err) {
      setMessage('❌ 添加失败: ' + (err.response?.data?.error || err.message))
    }
  }

  const handleUpdateKey = async () => {
    if (!formName.trim() || !formKey.trim()) {
      setMessage('❌ 名称和 Key 不能为空')
      return
    }
    try {
      await axios.put(`/api/config/keys/${editingKey.id}`, { name: formName.trim(), key: formKey.trim() })
      setMessage('✅ 更新成功')
      setFormName(''); setFormKey(''); setEditingKey(null)
      fetchApiKeys()
    } catch (err) {
      setMessage('❌ 更新失败: ' + (err.response?.data?.error || err.message))
    }
  }

  const handleDeleteKey = async (id) => {
    if (!confirm('确定要删除这个 API Key 吗？')) return
    try {
      await axios.delete(`/api/config/keys/${id}`)
      setMessage('✅ 删除成功')
      fetchApiKeys()
    } catch (err) {
      setMessage('❌ 删除失败: ' + (err.response?.data?.error || err.message))
    }
  }

  const handleSelectKey = async (id) => {
    try {
      await axios.post(`/api/config/keys/${id}/select`)
      setMessage('✅ 已切换为当前使用')
      setCurrentKeyId(id)
    } catch (err) {
      setMessage('❌ 切换失败: ' + (err.response?.data?.error || err.message))
    }
  }

  const maskKey = (key) => {
    if (!key) return ''
    return '•'.repeat(Math.min(key.length, 20))
  }

  const startEditing = (keyItem) => {
    setEditingKey(keyItem); setFormName(keyItem.name); setFormKey(keyItem.key)
  }

  const cancelEditing = () => {
    setEditingKey(null); setFormName(''); setFormKey('')
  }

  // 浮层 ghost 内容
  const renderGhostContent = (item) => (
    <div className="p-4 space-y-2">
      <div className="flex items-center gap-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500 shrink-0">
          <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
        </svg>
        <span className="text-white font-semibold">{item.name}</span>
        {currentKeyId === item.id && <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded">当前使用</span>}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-8 px-3 py-1.5 bg-black/30 rounded border border-white/10 flex items-center overflow-hidden">
          <code className="text-slate-400 font-mono text-sm whitespace-nowrap overflow-hidden text-ellipsis">{maskKey(item.key)}</code>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-slate-500 text-xs">创建于: {item.createdAt}</span>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-purple-300/30 rounded-xl w-full max-w-2xl flex flex-col" style={{ height: '90vh', maxHeight: '750px' }}>
        
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-purple-400">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
            </svg>
            API Key 管理
          </h2>
          <button onClick={onClose} className="text-purple-300 hover:text-white text-2xl">✕</button>
        </div>

        <div className="mx-6 shrink-0" style={{ minHeight: message ? '54px' : '0px' }}>
          {message ? (
            <div className="mt-4 p-3 bg-blue-500/20 border border-blue-400 rounded-lg text-blue-200 text-sm flex justify-between items-center">
              <span>{message}</span>
              <button onClick={() => setMessage('')} className="text-blue-300 hover:text-white">✕</button>
            </div>
          ) : null}
        </div>

        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-6 relative"
        >
          <div className="space-y-3 relative">
            {apiKeys.map((keyItem, idx) => (
              <React.Fragment key={keyItem.id}>
                {insertIdx === idx && (
                  <div
                    className="border-2 border-dashed border-purple-400/40 rounded-xl bg-purple-500/5"
                    style={{ height: dragState.current ? (dragState.current.ghostHeight + 12) + 'px' : '140px' }}
                  />
                )}
                <div
                  data-key-item="true"
                  onMouseDown={(e) => handleMouseDown(e, idx)}
                  className={`p-4 border rounded-xl transition-colors cursor-grab active:cursor-grabbing ${
                    currentKeyId === keyItem.id
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-purple-300/30 bg-white/5'
                  } hover:bg-white/10`}
                >
                  {editingKey?.id === keyItem.id ? (
                    <div className="space-y-3">
                      <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Key 名称" autoFocus className="w-full px-4 py-2 bg-white/10 border border-purple-300/30 rounded-lg text-white" />
                      <input type="text" value={formKey} onChange={(e) => setFormKey(e.target.value)} placeholder="API Key" className="w-full px-4 py-2 bg-white/10 border border-purple-300/30 rounded-lg text-white font-mono text-sm" />
                      <div className="flex gap-2">
                        <button onClick={handleUpdateKey} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition">保存</button>
                        <button onClick={cancelEditing} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition">取消</button>
                      </div>
                    </div>
                  ) : (
                      <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap justify-between">
                        <div className="flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500 shrink-0">
                            <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
                          </svg>
                          <span className="text-white font-semibold">{keyItem.name}</span>
                          {currentKeyId === keyItem.id && <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded">当前使用</span>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {balances[keyItem.id]?.loading && !balances[keyItem.id]?.data ? (
                            <span className="text-slate-400 text-xs">查询中..</span>
                          ) : balances[keyItem.id]?.data ? (() => {
                            const d = balances[keyItem.id].data?.data || {}
                            return (
                              <>
                                <span className="text-slate-300 text-xs mr-0.5">BZ币余额:</span>
                                <img src="/icons/yinbi.webp" className="w-[14px] h-[14px]" />
                                <span className="text-slate-300 text-xs font-mono">{d.gift_balance_amount ?? d.gift_balance ?? '?'}</span>
                                <img src="/icons/jinbi.webp" className="w-[14px] h-[14px] ml-1.5" />
                                <span className="text-yellow-300 text-xs font-mono">{d.charge_balance_amount ?? d.charge_balance ?? '?'}</span>
                              </>
                            )
                          })() : balances[keyItem.id]?.error ? (
                            <span className="text-red-400 text-xs" title={balances[keyItem.id].error}>查询失败</span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-8 px-3 py-1.5 bg-black/30 rounded border border-white/10 flex items-center overflow-hidden">
                          <code className="text-slate-400 font-mono text-sm whitespace-nowrap overflow-hidden text-ellipsis">{maskKey(keyItem.key)}</code>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-xs">创建于: {keyItem.createdAt}</span>
                        <div className="flex items-center gap-2">
                          {currentKeyId !== keyItem.id && <button onClick={() => handleSelectKey(keyItem.id)} className="px-3 py-1.5 bg-green-600/50 hover:bg-green-600 text-white text-sm rounded-lg transition">设为当前</button>}
                          <button onClick={() => startEditing(keyItem)} className="px-3 py-1.5 bg-blue-600/50 hover:bg-blue-600 text-white text-sm rounded-lg transition">编辑</button>
                          <button onClick={() => handleDeleteKey(keyItem.id)} className="px-3 py-1.5 bg-red-600/50 hover:bg-red-600 text-white text-sm rounded-lg transition">删除</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </React.Fragment>
            ))}
            {insertIdx === apiKeys.length && (
              <div className="border-2 border-dashed border-purple-400/40 rounded-xl bg-purple-500/5" style={{ height: dragState.current ? (dragState.current.ghostHeight + 12) + 'px' : '140px' }} />
            )}
          </div>
        </div>
        
        <div className="shrink-0 px-6 pb-4 pt-2 space-y-3">
          {showAddForm ? (
            <div className="p-4 border border-purple-300/30 rounded-lg bg-white/5 space-y-3">
              <h3 className="text-lg font-semibold text-white">添加新 API Key</h3>
              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Key 名称" autoFocus className="w-full px-4 py-2 bg-white/10 border border-purple-300/30 rounded-lg text-white" />
              <input type="text" value={formKey} onChange={(e) => setFormKey(e.target.value)} placeholder="sk-xxxxxxxxxx" className="w-full px-4 py-2 bg-white/10 border border-purple-300/30 rounded-lg text-white font-mono text-sm" />
              <div className="flex gap-2">
                <button onClick={handleAddKey} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition">添加</button>
                <button onClick={() => { setShowAddForm(false); setFormName(''); setFormKey('') }} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition">取消</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddForm(true)} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium">
              + 添加新 API Key
            </button>
          )}
          
          <button
            title="开启后，连续提交多个任务时系统自动轮换使用不同的 API Key，避免单个 Key 频繁调用受限"
            onClick={async () => {
              const next = !autoSwitch
              setAutoSwitch(next)
              try { await axios.post('/api/apps/settings', { autoSwitch: next }) } catch (e) {}
            }}
            className={`w-full h-11 flex items-center justify-between px-4 rounded-lg transition-all duration-200 text-sm ${
              autoSwitch
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-white/5 text-purple-300/70 border border-purple-300/20 shadow-inner'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              多任务自动切换 API Key
            </span>
            <span className={`text-xs px-2 py-0.5 rounded ${autoSwitch ? 'bg-white/20 text-white' : 'bg-purple-500/20 text-purple-400'}`}>
              {autoSwitch ? '已开启' : '已关闭'}
            </span>
          </button>
        </div>

        <div className="px-6 py-4 border-t border-white/10 bg-purple-500/5 shrink-0">
          <p className="text-purple-300/70 text-xs leading-relaxed text-center">
            <strong>API Key 使用说明：</strong> BizyAir API Key 用于调用 AI 服务。请从 BizyAir 平台获取 API Key，点击"设为当前"选择使用哪个 Key 进行调用。支持添加、编辑、删除多个 Key，系统会自动使用当前选中的 Key。
          </p>
        </div>
      </div>

      {/* 拖拽浮层 — 跟随鼠标 */}
      {ghostStyle && dragState.current && (
        <div
          className="fixed pointer-events-none z-[9999] opacity-90 scale-[1.02] shadow-2xl rounded-xl overflow-hidden bg-slate-900 border border-purple-400/50"
          style={{
            left: ghostStyle.left,
            top: ghostStyle.top,
            width: ghostStyle.width,
            transition: 'none',
          }}
        >
          {renderGhostContent(dragState.current.item)}
        </div>
      )}
    </div>
  )
}
