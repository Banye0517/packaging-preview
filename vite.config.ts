import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: ['terminal.local'],
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: './src/test/setup.ts',
  },
})
