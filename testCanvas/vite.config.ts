import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: '/testCanvas/',
  plugins: [react()],
  resolve: {
    alias: {
      '@utilities': path.resolve(__dirname, '../utilities'),
      // Ensure React resolves from project's node_modules, not utilities
      'react': path.resolve(__dirname, './node_modules/react'),
      'react/jsx-runtime': path.resolve(__dirname, './node_modules/react/jsx-runtime')
    }
  }
})

