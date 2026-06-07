import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// classroom апп нь GitHub Pages дээр /classroom/ дэд замаар, эсвэл
// Netlify/Vercel дээр үндсэн домэйн дээр deploy хийгдэж болно.
// BASE_PATH env-ээр base-ийг тохируулна (default '/').
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5174,
    // Локал хөгжүүлэлтэд /api дуудлагыг dev-server (4000) руу проксидоно.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
  build: {
    outDir: 'dist',
  },
});
