import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // GitHub Pages 部署時，base 必須對應到倉庫的名稱 (例如 /topic-learning-hub/)
  base: process.env.NODE_ENV === 'production' ? '/topic-learning-hub/' : '/'
})
