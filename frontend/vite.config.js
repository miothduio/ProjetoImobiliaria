import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // O backend libera CORS para http://localhost:5173.
    // strictPort impede o Vite de "pular" para 5174 e cair em erro de CORS.
    port: 5173,
    strictPort: true,
  },
})
