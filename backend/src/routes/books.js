import { Router } from 'express';
import { query } from '../db.js';
import { validateBook, parseId, hasErrors } from '../validation.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

// Semua route di file ini butuh login. Dipasang sekali di level router.
router.use(requireAuth);

// Kolom dipilih eksplisit (bukan SELECT *) agar kolom sensitif yang
// mungkin ditambah nanti tidak ikut terkirim tanpa sengaja.
const COLUMNS = 'id, title, author, status, created_at, updated_at';

// Mengambil buku berdasarkan id lalu memastikan pemiliknya benar.
// Mengembalikan buku, atau null setelah mengirim respons error.
async function findOwnedBook(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ error: 'ID buku harus bilangan bulat positif.' });
    return null;
  }

  const { rows } = await query(`SELECT ${COLUMNS}, user_id FROM books WHERE id = $1`, [id]);
  const book = rows[0];

  if (!book) {
    res.status(404).json({ error: 'Buku tidak ditemukan.' });
    return null;
  }
  if (book.user_id !== req.userId) {
    // 403 = "saya tahu kamu siapa, tapi kamu tidak berhak atas data ini".
    // (Catatan: sebagian aplikasi memilih 404 di sini agar tidak membocorkan
    //  bahwa id tersebut ada. 403 dipakai agar perbedaan 401/403 terlihat jelas.)
    res.status(403).json({ error: 'Anda tidak berhak mengakses buku ini.' });
    return null;
  }

  delete book.user_id;
  return book;
}

// GET /api/books — hanya buku milik user yang login.
router.get('/', async (req, res) => {
  const { rows } = await query(
    `SELECT ${COLUMNS} FROM books WHERE user_id = $1 ORDER BY created_at DESC`,
    [req.userId],
  );
  res.json(rows);
});

// GET /api/books/:id
router.get('/:id', async (req, res) => {
  const book = await findOwnedBook(req, res);
  if (book) res.json(book);
});

// POST /api/books
router.post('/', async (req, res) => {
  const { errors, value } = validateBook(req.body);
  if (hasErrors(errors)) return res.status(400).json({ error: 'Data tidak valid.', details: errors });

  // $1, $2, ... = parameterized query. Nilai dikirim TERPISAH dari teks SQL,
  // sehingga judul seperti  x'); DROP TABLE books; --  hanya dianggap teks biasa,
  // tidak pernah dieksekusi sebagai perintah SQL.
  // user_id diambil dari token (req.userId), BUKAN dari body — user tidak bisa
  // membuat buku atas nama orang lain.
  const { rows } = await query(
    `INSERT INTO books (user_id, title, author, status)
     VALUES ($1, $2, $3, $4)
     RETURNING ${COLUMNS}`,
    [req.userId, value.title, value.author, value.status],
  );
  res.status(201).json(rows[0]); // 201 Created: resource baru berhasil dibuat
});

// PUT /api/books/:id — PUT = mengganti seluruh data buku (semua field wajib dikirim).
router.put('/:id', async (req, res) => {
  const { errors, value } = validateBook(req.body);
  if (hasErrors(errors)) return res.status(400).json({ error: 'Data tidak valid.', details: errors });

  const existing = await findOwnedBook(req, res);
  if (!existing) return;

  const { rows } = await query(
    `UPDATE books SET title = $1, author = $2, status = $3, updated_at = now()
     WHERE id = $4 AND user_id = $5
     RETURNING ${COLUMNS}`,
    [value.title, value.author, value.status, existing.id, req.userId],
  );
  res.json(rows[0]);
});

// DELETE /api/books/:id
router.delete('/:id', async (req, res) => {
  const existing = await findOwnedBook(req, res);
  if (!existing) return;

  await query('DELETE FROM books WHERE id = $1 AND user_id = $2', [existing.id, req.userId]);
  res.status(204).end(); // 204 No Content: berhasil, tidak ada isi yang perlu dikirim balik
});

export default router;
