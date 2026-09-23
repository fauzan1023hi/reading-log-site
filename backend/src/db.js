import pg from 'pg';

if (!process.env.DATABASE_URL) {
  // Gagal cepat dengan pesan jelas, daripada error samar saat query pertama.
  throw new Error('DATABASE_URL belum diisi. Salin .env.example menjadi .env lalu isi nilainya.');
}

// Pool = kumpulan koneksi yang dipakai ulang.
// Membuka koneksi baru ke Neon untuk setiap request itu lambat (handshake TLS),
// jadi pool menyimpan beberapa koneksi terbuka dan meminjamkannya bergantian.
// Pengaturan SSL dibaca dari connection string (?sslmode=require dari Neon).
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Satu pintu untuk semua query: memudahkan jika nanti ingin menambah logging.
// SELALU kirim nilai dari user lewat "params", jangan disambung ke string SQL.
export function query(text, params) {
  return pool.query(text, params);
}
