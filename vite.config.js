import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  // SPA fallback: all routes serve index.html (for React Router)
  server: {
    historyApiFallback: true,
  },
})
