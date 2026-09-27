import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname
    }
  },
  server: {
    host: true, // 모바일 기기에서 개발 서버 접속 테스트를 위해 네트워크에 노출
    port: 5173
  }
})
