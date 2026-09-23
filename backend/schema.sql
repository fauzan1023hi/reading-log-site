-- Skema database Pencatat Bacaan.
-- Jalankan sekali: lewat "npm run db:init" atau tempel di SQL Editor Neon.
-- IF NOT EXISTS membuat file ini aman dijalankan berulang kali.

CREATE TABLE IF NOT EXISTS users (
  -- IDENTITY: nomor urut dibuat database, bukan aplikasi,
  -- sehingga dua request bersamaan tidak mungkin mendapat id yang sama.
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- UNIQUE: database sendiri yang menolak email ganda,
  -- lebih andal daripada hanya mengecek di kode.
  email         VARCHAR(254) NOT NULL UNIQUE,
  -- Yang disimpan hanya HASH bcrypt (±60 karakter), tidak pernah password asli.
  password_hash TEXT         NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- FOREIGN KEY: buku wajib milik user yang benar-benar ada.
  -- ON DELETE CASCADE: jika user dihapus, bukunya ikut terhapus (tidak ada data yatim).
  user_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(200) NOT NULL,
  author     VARCHAR(200) NOT NULL,
  -- CHECK: lapisan validasi terakhir. Walau kode server lupa memvalidasi,
  -- database tetap menolak status di luar tiga nilai ini.
  status     VARCHAR(10)  NOT NULL CHECK (status IN ('want', 'reading', 'done')),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Hampir setiap query memfilter "WHERE user_id = ...".
-- Index membuat pencarian itu tidak perlu membaca seluruh tabel.
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
