import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { validateCredentials, hasErrors } from '../validation.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 hari
// Cost 12 = 2^12 putaran hashing. Sengaja lambat (±200ms) agar
// menebak jutaan password dari hash yang bocor menjadi sangat mahal.
const BCRYPT_COST = 12;

// Opsi cookie dikumpulkan di satu tempat karena logout WAJIB memakai
// opsi yang sama persis agar browser menganggapnya cookie yang sama.
function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,                                // tidak bisa dibaca document.cookie
    secure: isProd,                                // production: hanya dikirim lewat HTTPS
    sameSite: process.env.COOKIE_SAMESITE || 'lax', // lihat penjelasan di docs/DEPLOY.md
    path: '/',
  };
}

function issueToken(res, userId) {
  // "sub" (subject) = standar JWT untuk identitas pemilik token.
  // Hanya id yang disimpan: payload JWT bisa DIBACA siapa pun (base64), hanya tidak bisa DIUBAH.
  const token = jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET, { expiresIn: TOKEN_TTL_SECONDS });
  res.cookie('token', token, { ...cookieOptions(), maxAge: TOKEN_TTL_SECONDS * 1000 });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { errors, value } = validateCredentials(req.body);
  if (hasErrors(errors)) return res.status(400).json({ error: 'Data tidak valid.', details: errors });

  const passwordHash = await bcrypt.hash(value.password, BCRYPT_COST);

  try {
    const { rows } = await query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [value.email, passwordHash],
    );
    issueToken(res, rows[0].id);
    return res.status(201).json({ user: rows[0] });
  } catch (err) {
    // 23505 = kode PostgreSQL untuk pelanggaran UNIQUE (email sudah dipakai).
    if (err.code === '23505') return res.status(409).json({ error: 'Email sudah terdaftar.' });
    throw err; // error lain diteruskan ke error handler → 500
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { errors, value } = validateCredentials(req.body);
  if (hasErrors(errors)) return res.status(400).json({ error: 'Data tidak valid.', details: errors });

  const { rows } = await query('SELECT id, email, password_hash FROM users WHERE email = $1', [value.email]);
  const user = rows[0];

  // bcrypt.compare meng-hash ulang input dengan salt yang tersimpan di hash, lalu membandingkan.
  const ok = user && (await bcrypt.compare(value.password, user.password_hash));

  // Pesan sengaja sama untuk "email tidak ada" dan "password salah"
  // agar penyerang tidak bisa mengetahui email mana yang terdaftar.
  if (!ok) return res.status(401).json({ error: 'Email atau password salah.' });

  issueToken(res, user.id);
  return res.json({ user: { id: user.id, email: user.email } });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // JWT tidak bisa "dibatalkan" di server (tidak disimpan di mana pun).
  // Logout = menyuruh browser menghapus cookie-nya.
  res.clearCookie('token', cookieOptions());
  res.status(204).end();
});

// GET /api/auth/me — dipakai frontend saat halaman dibuka untuk tahu "sudah login atau belum".
router.get('/me', requireAuth, async (req, res) => {
  const { rows } = await query('SELECT id, email FROM users WHERE id = $1', [req.userId]);
  if (!rows[0]) return res.status(401).json({ error: 'User tidak ditemukan.' });
  res.json({ user: rows[0] });
});

export default router;
