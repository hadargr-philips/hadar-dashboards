import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/hadar-dashboards/release-timeline/' : '/',
  build: {
    outDir: '../release-timeline',
    emptyOutDir: true,
  },
}))
