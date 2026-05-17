import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function HistoryWindow({ currentImage, onClose, onSelect }) {
  const [historyImages, setHistoryImages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/apps/backgrounds')
      .then(r => { setHistoryImages(r.data.backgrounds); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10001]">
      <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">历史图片</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : historyImages.length === 0 ? (
            <p className="text-sm text-white/40 text-center py-12">暂无历史图片</p>
          ) : (
            <div className="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto">
              {historyImages.map((img, idx) => (
                <div 
                  key={idx} 
                  onClick={() => onSelect(img.url)} 
                  className={"relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500 transition " + (currentImage === img.url ? 'ring-2 ring-green-500' : '')}
                >
                  <img src={img.url} alt={img.name} className="w-full h-full object-contain pointer-events-none" />
                  {currentImage === img.url && (
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
      </div>
    </div>
  )
}
