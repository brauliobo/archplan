import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import yaml from '@rollup/plugin-yaml'

const base = process.env.VITE_BASE || '/'

export default defineConfig({
  base,
  plugins: [
    react({
      include: /\.(js|jsx)$/,
      babel: {
        plugins: ['babel-plugin-transform-react-pug'],
      },
    }),
    yaml(),
  ],
  esbuild: {
    loader: 'jsx',
    include: /\.(js|jsx)$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  server: { port: 5173, open: false },
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    sourcemap: false,
  },
})
