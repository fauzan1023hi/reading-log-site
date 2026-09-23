import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy: request ke http://localhost:5173/api/... diteruskan oleh server Vite
    // ke backend di port 3000. Bagi browser, semuanya berasal dari origin yang sama,
    // sehingga tidak perlu CORS dan cookie berperilaku seperti first-party.
    // Pola yang sama dipakai di production lewat rewrite Vercel (vercel.json).
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
