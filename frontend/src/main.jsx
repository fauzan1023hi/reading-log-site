import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
// CSS yang sama persis dengan versi JS murni. Vite menyuntikkannya ke halaman.
import './style.css';

// createRoot: React mengambil alih <div id="root"> dan mengelola semua isinya.
// StrictMode (hanya di development) menjalankan efek dua kali untuk membantu
// menemukan bug — itu sebabnya request /api/auth/me terlihat 2x di tab Network saat dev.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
