// Validasi di SERVER adalah pertahanan yang sesungguhnya.
// Validasi di frontend hanya untuk kenyamanan pengguna (pesan cepat),
// karena siapa pun bisa melewati browser dan mengirim request langsung
// dengan curl/Postman. Jadi server tidak boleh percaya data yang masuk.

export const BOOK_STATUSES = ['want', 'reading', 'done'];

// Mengembalikan { errors, value }. value berisi data yang sudah dibersihkan
// (di-trim), sehingga route tidak memakai req.body mentah.
export function validateBook(body) {
  const errors = {};
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const author = typeof body?.author === 'string' ? body.author.trim() : '';
  const status = body?.status;

  if (!title) errors.title = 'Judul wajib diisi.';
  else if (title.length > 200) errors.title = 'Judul maksimal 200 karakter.';

  if (!author) errors.author = 'Penulis wajib diisi.';
  else if (author.length > 200) errors.author = 'Penulis maksimal 200 karakter.';

  if (!BOOK_STATUSES.includes(status)) {
    errors.status = `Status harus salah satu dari: ${BOOK_STATUSES.join(', ')}.`;
  }

  return { errors, value: { title, author, status } };
}

export function validateCredentials(body) {
  const errors = {};
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  // Regex sederhana: cukup untuk menolak salah ketik, tidak mencoba sempurna.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Format email tidak valid.';

  if (password.length < 8) errors.password = 'Password minimal 8 karakter.';
  // bcrypt hanya memakai 72 byte pertama; lebih dari itu diam-diam diabaikan.
  else if (Buffer.byteLength(password) > 72) errors.password = 'Password maksimal 72 byte.';

  return { errors, value: { email, password } };
}

// Parameter URL selalu berupa string. "abc" atau "-1" harus ditolak dengan 400,
// bukan diteruskan ke database lalu menghasilkan error 500.
export function parseId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
