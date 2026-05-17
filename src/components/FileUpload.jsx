import React, { useState } from 'react'

export default function FileUpload({ onFileUpload, loading }) {
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      const file = files[0]
      if (file.name.endsWith('.txt')) {
        onFileUpload(file)
      } else {
        alert('请上传 .txt 文件')
      }
    }
  }

  const handleChange = (e) => {
    const files = e.target.files
    if (files && files[0]) {
      onFileUpload(files[0])
    }
  }

  return (
    <div className="text-center">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 transition ${
          dragActive
            ? 'border-purple-400 bg-purple-500/20'
            : 'border-purple-300/50 hover:border-purple-300'
        }`}
      >
        <div className="mb-4 text-5xl">📁</div>
        <h2 className="text-2xl font-bold text-white mb-2">拖入示例文件</h2>
        <p className="text-purple-200 mb-6">
          将 BizyAir 应用的调用示例 .txt 文件拖到这里
        </p>

        <label className="inline-block">
          <input
            type="file"
            accept=".txt"
            onChange={handleChange}
            disabled={loading}
            className="hidden"
          />
          <span className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer transition inline-block disabled:opacity-50">
            {loading ? '处理中...' : '或点击选择文件'}
          </span>
        </label>

        <div className="mt-8 text-sm text-purple-300">
          <p>✨ 支持的文件格式：Shell 示例代码 (.txt)</p>
          <p>📝 示例文件应包含 web_app_id 和 input_values</p>
        </div>
      </div>
    </div>
  )
}
