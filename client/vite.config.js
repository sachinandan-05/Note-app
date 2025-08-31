import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  css: {
    preprocessorOptions: {
      tailwind: {
        config: './tailwind.config.js',
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  optimizeDeps: {
    exclude: ['electron'],
  },
  define: {
    'process.env': {},
    'process.platform': JSON.stringify(process.platform),
  },
  resolve: {
    alias: {
      'electron': 'electron',
      'path': 'path-browserify',
    },
  },
  server: {
    port: 5173,
    strictPort: true, 
  }
})
