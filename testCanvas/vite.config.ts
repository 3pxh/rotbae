import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: '/testCanvas/',
  plugins: [react()],
  resolve: {
    alias: {
      '@utilities': path.resolve(__dirname, '../utilities')
    }
  }
})

