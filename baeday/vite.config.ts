import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  // Set base path to match the subdomain folder name
  // This ensures assets are loaded from /baeday/assets instead of /assets
  base: '/baeday/',
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  resolve: {
    alias: {
      '@utilities': path.resolve(__dirname, '../utilities'),
      // Ensure React resolves from project's node_modules, not utilities
      'react': path.resolve(__dirname, './node_modules/react'),
      'react/jsx-runtime': path.resolve(__dirname, './node_modules/react/jsx-runtime')
    }
  }
})
