import React, { useState } from 'react'

export default function ParameterForm({ appData, parameters, onSubmit, onBack, loading, taskStatus }) {
  const [inputValues, setInputValues] = useState({})
  const [parameterTypes, setParameterTypes] = useState({})

  // 初始化参数值和类型
  React.useEffect(() => {
    const values = {}
    const types = {}
    for (const [key, param] of Object.entries(parameters)) {
      values[key] = param.value
      types[key] = param.type
    }
    setInputValues(values)
    setParameterTypes(types)
  }, [parameters])

  const handleInputChange = (key, value) => {
    setInputValues(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleTypeChange = (key, newType) => {
    setParameterTypes(prev => ({
      ...prev,
      [key]: newType
    }))
  }

  const handleFileInput = (key, file) => {
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target.result
        setInputValues(prev => ({
          ...prev,
          [key]: base64
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(inputValues)
  }

  const renderInput = (key, param) => {
    const type = parameterTypes[key] || param.type
    const value = inputValues[key]

    switch (type) {
      case 'image':
        return (
          <div className="space-y-2">
            <label className="block text-sm text-purple-200">
              {param.label}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileInput(key, e.target.files?.[0])}
              className="w-full px-4 py-2 bg-white/10 border border-purple-300/30 rounded-lg text-white"
            />
            {value && (
              <div className="mt-2">
                {/* 将预览宽度放大约 1.5 倍，便于查看（从 max-w-xs -> max-w-lg） */}
                <img src={value} alt="preview" className="max-w-lg rounded-lg" />
              </div>
            )}
          </div>
        )
      
      case 'audio':
        return (
          <div className="space-y-2">
            <label className="block text-sm text-purple-200">
              {param.label}
            </label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => handleFileInput(key, e.target.files?.[0])}
              className="w-full px-4 py-2 bg-white/10 border border-purple-300/30 rounded-lg text-white"
            />
          </div>
        )
      
      case 'textarea':
        return (
          <div className="space-y-2">
            <label className="block text-sm text-purple-200">
              {param.label}
            </label>
            <textarea
              value={value}
              onChange={(e) => handleInputChange(key, e.target.value)}
              rows="4"
              className="w-full px-4 py-2 bg-white/10 border border-purple-300/30 rounded-lg text-white placeholder-purple-300/50"
            />
          </div>
        )
      
      case 'number':
        return (
          <div className="space-y-2">
            <label className="block text-sm text-purple-200">
              {param.label}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => handleInputChange(key, parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-white/10 border border-purple-300/30 rounded-lg text-white"
            />
          </div>
        )
      
      case 'float':
        return (
          <div className="space-y-2">
            <label className="block text-sm text-purple-200">
              {param.label}
            </label>
            <input
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => handleInputChange(key, parseFloat(e.target.value))}
              className="w-full px-4 py-2 bg-white/10 border border-purple-300/30 rounded-lg text-white"
            />
          </div>
        )
      
      case 'boolean':
        return (
          <div className="space-y-2">
            <label className="block text-sm text-purple-200">
              {param.label}
            </label>
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleInputChange(key, e.target.checked)}
              className="w-4 h-4"
            />
          </div>
        )
      
      case 'select':
        return (
          <div className="space-y-2">
            <label className="block text-sm text-purple-200">
              {param.label}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleInputChange(key, e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-purple-300/30 rounded-lg text-white"
              placeholder="输入选项值"
            />
          </div>
        )
      
      default:
        return (
          <div className="space-y-2">
            <label className="block text-sm text-purple-200">
              {param.label}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleInputChange(key, e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-purple-300/30 rounded-lg text-white"
            />
          </div>
        )
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          应用 ID: {appData.web_app_id}
        </h2>
        <p className="text-purple-200">编辑参数并提交</p>
      </div>

      {/* 参数表单 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(parameters).map(([key, param]) => (
          <div key={key} className="space-y-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-purple-300">{key}</span>
              <select
                value={parameterTypes[key] || param.type}
                onChange={(e) => handleTypeChange(key, e.target.value)}
                className="text-xs px-2 py-1 bg-purple-600/50 border border-purple-400 rounded text-white"
              >
                <option value="text">文本</option>
                <option value="textarea">多行文本</option>
                <option value="number">整数</option>
                <option value="float">浮点数</option>
                <option value="boolean">布尔值</option>
                <option value="image">图像</option>
                <option value="audio">音频</option>
                <option value="select">选择</option>
              </select>
            </div>
            {renderInput(key, param)}
          </div>
        ))}
      </div>

      {/* 任务状态 */}
      {taskStatus && (
        <div className="p-4 bg-blue-500/20 border border-blue-400 rounded-lg text-blue-200">
          {taskStatus === 'running' && '⏳ 任务运行中...'}
          {taskStatus === 'completed' && '✅ 任务完成！'}
          {taskStatus === 'failed' && '❌ 任务失败'}
          {taskStatus === 'timeout' && '⏱️ 任务超时'}
        </div>
      )}

      {/* 按钮 */}
      <div className="flex gap-4 pt-6">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition disabled:opacity-50"
        >
          ← 返回
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50 font-semibold"
        >
          {loading ? '处理中...' : '🚀 运行任务'}
        </button>
      </div>
    </form>
  )
}
