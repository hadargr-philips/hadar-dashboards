import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Dev: serve from root. Build: serve from the GitHub Pages sub-path.
  base: command === 'build' ? '/hadar-dashboards/org-chart/' : '/',
  build: {
    // Output built files to hadar-dashboards/org-chart/ so GitHub Pages serves them
    outDir: '../org-chart',
    emptyOutDir: true,
  },
  optimizeDeps: {
    include: ['xlsx', 'reactflow'],
  },
}))
