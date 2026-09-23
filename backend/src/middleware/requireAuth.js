import jwt from 'jsonwebtoken';

// Middleware = fungsi yang berjalan SEBELUM handler route.
// Ditaruh di depan route yang perlu login, sehingga pengecekan token
// ditulis sekali di sini, tidak diulang di setiap route.
export function requireAuth(req, res, next) {
  // Token dibaca dari cookie httpOnly (bukan dari localStorage),
  // karena JavaScript di halaman — termasuk script jahat hasil XSS — tidak bisa membacanya.
  const token = req.cookies?.token;

  if (!token) {
    // 401 = "saya tidak tahu kamu siapa" → silakan login.
    return res.status(401).json({ error: 'Silakan login terlebih dahulu.' });
  }

  try {
    // verify() mengecek tanda tangan DAN masa berlaku.
    // Jika token diubah sedikit saja oleh pengguna, tanda tangannya tidak cocok → error.
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = Number(payload.sub); // sub disimpan sebagai string (standar JWT), id di DB berupa angka
    next();
  } catch {
    return res.status(401).json({ error: 'Sesi tidak valid atau kedaluwarsa. Silakan login ulang.' });
  }
}
