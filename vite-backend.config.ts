import { resolve } from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points.
      entry: resolve(__dirname, './src/backend/main.ts'),
      // the proper extensions will be added.
      fileName: 'backend',
      formats: ['cjs']
    },
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: false
  }
})
