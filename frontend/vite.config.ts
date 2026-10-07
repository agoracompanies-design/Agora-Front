import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
// La extensión es obligatoria: el `tsconfig` de la configuración resuelve
// módulos como Node 16, y ahí un import relativo sin extensión no vale.
import { csp } from './vite-csp.js'

export default defineConfig({
  // `csp` solo actúa al construir: pone la política de seguridad en el HTML.
  // Ver `vite-csp.ts`, que explica también lo que hay que poner en el servidor.
  plugins: [react(), tailwindcss(), csp()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
})
