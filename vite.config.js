import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true
      },
      '/backgrounds': {
        target: 'http://localhost:3003',
        changeOrigin: true
      },
      '/icons': {
        target: 'http://localhost:3003',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3003',
        changeOrigin: true
      },
      '/输出': {
        target: 'http://localhost:3003',
        changeOrigin: true
      },
      // 处理浏览器自动编码后的中文路径
      '/%E8%BE%93%E5%87%BA': {
        target: 'http://localhost:3003',
        changeOrigin: true
      }
    }
  }
})
