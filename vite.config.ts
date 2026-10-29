import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Port kustom (berbeda dari default 5173)
    host: true, // Membuka akses jaringan lokal (bisa dibuka dari HP/laptop lain di Wi-Fi yang sama)
  },
})
