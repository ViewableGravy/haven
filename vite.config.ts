import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'assets': path.resolve(__dirname, 'src/assets'),
      'components': path.resolve(__dirname, 'src/components'),
      'objects': path.resolve(__dirname, 'src/objects'),
      'server': path.resolve(__dirname, 'src/server'),
      'shared': path.resolve(__dirname, 'src/shared'),
      'spriteSheets': path.resolve(__dirname, 'src/spriteSheets'),
      'systems': path.resolve(__dirname, 'src/systems'),
      'types': path.resolve(__dirname, 'src/types'),
      'utilities': path.resolve(__dirname, 'src/utilities'),
    }
  },
  server: {
    host: true
  },
  build: {
    chunkSizeWarningLimit: 1600, // Increase the chunk size warning limit to 1600 KB
  }
})
