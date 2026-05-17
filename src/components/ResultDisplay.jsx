import React from 'react'

export default function ResultDisplay({ result, onReset }) {
  const renderOutput = (output) => {
    const ext = output.output_ext.toLowerCase()
    const url = output.object_url

    if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-purple-200">📷 图像输出</p>
          <img src={url} alt="output" className="max-w-full rounded-lg" />
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
          >
            🔗 打开原图
          </a>
        </div>
      )
    } else if (['.mp4', '.webm', '.mov', '.avi'].includes(ext)) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-purple-200">🎬 视频输出</p>
          <video
            src={url}
            controls
            className="max-w-full rounded-lg"
            style={{ maxHeight: '400px' }}
          />
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
          >
            🔗 下载视频
          </a>
        </div>
      )
    } else if (['.mp3', '.wav', '.aac', '.flac'].includes(ext)) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-purple-200">🎵 音频输出</p>
          <audio src={url} controls className="w-full" />
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
          >
            🔗 下载音频
          </a>
        </div>
      )
    } else {
      return (
        <div className="space-y-2">
          <p className="text-sm text-purple-200">📄 文件输出 ({ext})</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
          >
            🔗 下载文件
          </a>
        </div>
      )
    }
  }

  const formatTime = (ms) => {
    return (ms / 1000).toFixed(2) + 's'
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">✨</div>
        <h2 className="text-3xl font-bold text-white mb-2">任务完成！</h2>
        <p className="text-purple-200">结果已生成，示例已自动保存</p>
      </div>

      {/* 输出结果 */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">📦 输出结果</h3>
        <div className="grid grid-cols-1 gap-6">
          {result.outputs?.map((output, idx) => (
            <div key={idx} className="p-6 bg-white/5 border border-purple-300/30 rounded-lg">
              {renderOutput(output)}
              <div className="mt-4 text-xs text-purple-300 space-y-1">
                <p>⏱️ 推理耗时: {formatTime(output.cost_time)}</p>
                <p>🔍 审核状态: {output.audit_status === 2 ? '✅ 通过' : '⏳ 审核中'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 统计信息 */}
      <div className="p-6 bg-white/5 border border-purple-300/30 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">📊 执行统计</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-purple-300">总耗时</p>
            <p className="text-white font-semibold">
              {formatTime(result.cost_times?.total_cost_time)}
            </p>
          </div>
          <div>
            <p className="text-purple-300">推理耗时</p>
            <p className="text-white font-semibold">
              {formatTime(result.cost_times?.inference_cost_time)}
            </p>
          </div>
          <div>
            <p className="text-purple-300">GPU 耗时</p>
            <p className="text-white font-semibold">
              {formatTime(result.cost_times?.real_gpu_cost_time)}
            </p>
          </div>
          <div>
            <p className="text-purple-300">CPU 耗时</p>
            <p className="text-white font-semibold">
              {formatTime(result.cost_times?.real_cpu_cost_time)}
            </p>
          </div>
        </div>
      </div>

      {/* 任务信息 */}
      <div className="p-4 bg-white/5 border border-purple-300/30 rounded-lg text-sm text-purple-300 space-y-1">
        <p>📋 请求 ID: <span className="text-white font-mono">{result.request_id}</span></p>
        <p>⏰ 创建时间: {result.created_at}</p>
        <p>✅ 完成时间: {result.ended_at}</p>
      </div>

      {/* 按钮 */}
      <div className="flex gap-4 pt-6">
        <button
          onClick={onReset}
          className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-semibold"
        >
          🔄 处理新应用
        </button>
      </div>
    </div>
  )
}
