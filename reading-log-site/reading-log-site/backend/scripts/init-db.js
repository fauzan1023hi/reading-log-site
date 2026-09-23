// Menjalankan schema.sql ke database di DATABASE_URL.
// Alternatif jika tidak ingin memakai SQL Editor di dashboard Neon.
import { readFile } from 'node:fs/promises';
import { pool } from '../src/db.js';

const sql = await readFile(new URL('../schema.sql', import.meta.url), 'utf8');

try {
  await pool.query(sql);
  console.log('Skema berhasil dibuat (tabel users & books).');
} catch (err) {
  console.error('Gagal membuat skema:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
