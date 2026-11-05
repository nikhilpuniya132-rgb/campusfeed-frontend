import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  define: {
    'import.meta.env.VITE_SPOTIFY_CLIENT_ID': JSON.stringify(process.env.VITE_SPOTIFY_CLIENT_ID || '89e25dda422048b6847b20c322ce9197'),
    'import.meta.env.VITE_SPOTIFY_CLIENT_SECRET': JSON.stringify(process.env.VITE_SPOTIFY_CLIENT_SECRET || '16a4002448f74f7497fe1e08b3de7eb0')
  },
  server: { port: 3000 }
})
