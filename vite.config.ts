import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true
  },
  build: {
    chunkSizeWarningLimit: 1600, // Increase the chunk size warning limit to 1600 KB
  }
})
