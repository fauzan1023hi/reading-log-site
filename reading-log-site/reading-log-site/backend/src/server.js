import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pool } from './db.js';
import authRouter from './routes/auth.js';
import booksRouter from './routes/books.js';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET belum diisi di .env / environment variable hosting.');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Daftar origin (skema + domain + port) yang boleh memanggil API dari browser.
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// ---------- Middleware global (urutan penting: dijalankan dari atas ke bawah) ----------

// CORS: browser memblokir JavaScript membaca respons dari origin lain,
// kecuali server mengizinkan lewat header Access-Control-Allow-Origin.
// credentials: true → izinkan cookie ikut dalam request lintas origin.
// Dengan credentials, origin TIDAK boleh "*", harus disebut satu per satu.
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Mengubah body JSON mentah menjadi objek req.body. Tanpa ini req.body = undefined.
// limit mencegah orang mengirim body raksasa untuk membebani server.
app.use(express.json({ limit: '10kb' }));

// Mengubah header "Cookie: token=..." menjadi objek req.cookies.
app.use(cookieParser());

// ---------- Routes ----------

// Health check: dipakai Render untuk mengecek server hidup, dan cek koneksi DB.
app.get('/api/health', async (req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/books', booksRouter);

// Route yang tidak dikenal → 404 dalam format JSON (bukan halaman HTML bawaan Express).
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Endpoint ${req.method} ${req.originalUrl} tidak ada.` });
});

// ---------- Error handler (4 parameter = penanda error handler bagi Express) ----------
// Express 5 otomatis meneruskan error dari handler async ke sini.
app.use((err, req, res, next) => {
  // JSON yang rusak dari client adalah kesalahan client (400), bukan server.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Body bukan JSON yang valid.' });
  }
  // Detail error hanya dicatat di log server (terlihat di dashboard Render),
  // tidak dikirim ke client agar struktur internal tidak bocor.
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, err);
  res.status(500).json({ error: 'Terjadi kesalahan di server.' });
});

app.listen(PORT, () => {
  console.log(`API berjalan di http://localhost:${PORT} (mode: ${process.env.NODE_ENV || 'development'})`);
  console.log(`CORS diizinkan untuk: ${allowedOrigins.join(', ') || '(tidak ada)'}`);
});
