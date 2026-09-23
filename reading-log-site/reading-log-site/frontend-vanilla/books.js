// =========================================================
// books.js — Pencatat Bacaan versi JavaScript murni
// Tahap 2: data di localStorage  → Tahap 4: data dari REST API
// → Tahap 6: login/register, cookie httpOnly.
// =========================================================

// Alamat backend. Halaman ini harus dibuka lewat http://localhost:5500
// (bukan 127.0.0.1) agar dianggap "satu situs" dengan localhost:3000,
// sehingga cookie SameSite=Lax ikut terkirim. Lihat README.
const API_BASE = 'http://localhost:3000/api';

const STATUS_LABELS = {
  want: 'Ingin dibaca',
  reading: 'Sedang dibaca',
  done: 'Selesai',
};

// ---------------------------------------------------------
// STATE — satu sumber kebenaran.
// Semua perubahan ubah variabel ini dulu, lalu panggil render().
// Tampilan TIDAK pernah diubah langsung tanpa lewat state.
// ---------------------------------------------------------
const state = {
  user: null,        // null = belum login
  books: [],
  filter: 'all',
  authMode: 'login', // 'login' | 'register'
  loading: true,
};

// Referensi elemen diambil sekali, bukan dicari ulang setiap render.
const el = {
  alert: document.getElementById('books-alert'),
  authPanel: document.getElementById('auth-panel'),
  appPanel: document.getElementById('app-panel'),
  authForm: document.getElementById('auth-form'),
  authTitle: document.getElementById('auth-title'),
  authSubmit: document.getElementById('auth-submit'),
  authSwitch: document.getElementById('auth-switch'),
  authSwitchText: document.getElementById('auth-switch-text'),
  authPassword: document.getElementById('auth-password'),
  userEmail: document.getElementById('user-email'),
  logoutBtn: document.getElementById('logout-btn'),
  bookForm: document.getElementById('book-form'),
  bookSubmit: document.getElementById('book-submit'),
  filter: document.getElementById('filter-status'),
  list: document.getElementById('book-list'),
  count: document.getElementById('book-count'),
};

// ---------------------------------------------------------
// HELPER API
// ---------------------------------------------------------
class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details || {};
  }
}

// Semua request ke backend lewat fungsi ini, sehingga aturan umum
// (header JSON, cookie, penanganan error) ditulis sekali saja.
async function api(path, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      // credentials: 'include' → kirim & terima cookie walau beda origin (port 5500 → 3000).
      // Tanpa ini, cookie token tidak pernah terkirim dan semua request mendapat 401.
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Server tidak bisa dihubungi. Pastikan backend berjalan (npm run dev di folder backend).');
  }

  if (response.status === 204) return null; // No Content: tidak ada JSON untuk dibaca

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(response.status, data.error || `Error ${response.status}`, data.details);
  }
  return data;
}

// ---------------------------------------------------------
// RENDER — menggambar ulang tampilan dari state
// ---------------------------------------------------------
function render() {
  const loggedIn = Boolean(state.user);
  el.authPanel.hidden = loggedIn || state.loading;
  el.appPanel.hidden = !loggedIn;

  const isLogin = state.authMode === 'login';
  el.authTitle.textContent = isLogin ? 'Masuk' : 'Daftar akun';
  el.authSubmit.textContent = isLogin ? 'Masuk' : 'Daftar';
  el.authSwitchText.textContent = isLogin ? 'Belum punya akun?' : 'Sudah punya akun?';
  el.authSwitch.textContent = isLogin ? 'Daftar' : 'Masuk';
  el.authPassword.autocomplete = isLogin ? 'current-password' : 'new-password';

  if (loggedIn) {
    el.userEmail.textContent = state.user.email;
    renderBooks();
  }
}

function renderBooks() {
  const visible = state.filter === 'all'
    ? state.books
    : state.books.filter((b) => b.status === state.filter);

  el.count.textContent = `${visible.length} dari ${state.books.length} buku`;
  el.list.replaceChildren(); // hapus semua <li> lama, lalu buat ulang dari data

  if (visible.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = state.books.length === 0
      ? 'Belum ada buku. Tambahkan lewat form.'
      : 'Tidak ada buku dengan status ini.';
    el.list.append(empty);
    return;
  }

  for (const book of visible) {
    el.list.append(createBookItem(book));
  }
}

function createBookItem(book) {
  const li = document.createElement('li');
  li.className = 'book-item';

  const info = document.createElement('div');
  info.className = 'book-info';
  const title = document.createElement('p');
  title.className = 'book-title';
  title.textContent = book.title; // textContent: aman dari XSS
  const author = document.createElement('p');
  author.className = 'book-author';
  author.textContent = book.author;
  const badge = document.createElement('span');
  badge.className = `badge badge-${book.status}`;
  badge.textContent = STATUS_LABELS[book.status];
  info.append(title, author, badge);

  const actions = document.createElement('div');
  actions.className = 'book-actions';

  // Dropdown ubah status → PUT /api/books/:id
  const statusWrap = document.createElement('label');
  statusWrap.className = 'book-status';
  const statusLabel = document.createElement('span');
  statusLabel.className = 'visually-hidden';
  statusLabel.textContent = `Ubah status ${book.title}`;
  const select = document.createElement('select');
  for (const [value, label] of Object.entries(STATUS_LABELS)) {
    select.append(new Option(label, value, false, value === book.status));
  }
  select.addEventListener('change', () => updateStatus(book, select.value));
  statusWrap.append(statusLabel, select);

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'btn btn-danger btn-small';
  del.textContent = 'Hapus';
  del.setAttribute('aria-label', `Hapus ${book.title}`);
  del.addEventListener('click', () => deleteBook(book));

  actions.append(statusWrap, del);
  li.append(info, actions);
  return li;
}

function showAlert(message) {
  el.alert.textContent = message || '';
  el.alert.hidden = !message;
}

// Menampilkan/menghapus pesan error di bawah setiap input.
function showFieldErrors(form, prefix, errors) {
  for (const input of form.querySelectorAll('input')) {
    const msg = errors[input.name] || '';
    input.setAttribute('aria-invalid', String(Boolean(msg)));
    const errorEl = document.getElementById(`${prefix}-${input.name}-error`);
    if (errorEl) errorEl.textContent = msg;
  }
}

// Jika server membalas 401 (token habis/terhapus), kembali ke form login.
function handleError(err) {
  if (err.status === 401) {
    state.user = null;
    state.books = [];
    render();
    showAlert('Sesi berakhir. Silakan masuk lagi.');
    return;
  }
  showAlert(err.message);
}

// ---------------------------------------------------------
// AKSI
// ---------------------------------------------------------
async function loadBooks() {
  state.books = await api('/books');
}

async function init() {
  try {
    // Cek apakah cookie token yang valid sudah ada (misal: habis refresh halaman).
    const { user } = await api('/auth/me');
    state.user = user;
    await loadBooks();
  } catch (err) {
    if (err.status !== 401) showAlert(err.message); // 401 di sini normal: memang belum login
  } finally {
    state.loading = false;
    render();
  }
}

el.authSwitch.addEventListener('click', () => {
  state.authMode = state.authMode === 'login' ? 'register' : 'login';
  showFieldErrors(el.authForm, 'auth', {});
  showAlert('');
  render();
});

el.authForm.addEventListener('submit', async (event) => {
  // Mencegah perilaku bawaan form (reload halaman) — kita kirim lewat fetch.
  event.preventDefault();
  const data = Object.fromEntries(new FormData(el.authForm));

  // Validasi di frontend: cepat & ramah, tapi TIDAK menggantikan validasi server.
  const errors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.email = 'Format email tidak valid.';
  if (data.password.length < 8) errors.password = 'Password minimal 8 karakter.';
  showFieldErrors(el.authForm, 'auth', errors);
  if (Object.keys(errors).length) return;

  el.authSubmit.disabled = true; // cegah klik ganda saat request berjalan
  showAlert('');
  try {
    const path = state.authMode === 'login' ? '/auth/login' : '/auth/register';
    const { user } = await api(path, { method: 'POST', body: data });
    state.user = user;
    await loadBooks();
    el.authForm.reset();
    render();
  } catch (err) {
    showFieldErrors(el.authForm, 'auth', err.details);
    showAlert(err.message);
  } finally {
    el.authSubmit.disabled = false;
  }
});

el.logoutBtn.addEventListener('click', async () => {
  try {
    await api('/auth/logout', { method: 'POST' });
  } finally {
    state.user = null;
    state.books = [];
    showAlert('');
    render();
  }
});

el.bookForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(el.bookForm));

  const errors = {};
  if (!data.title.trim()) errors.title = 'Judul wajib diisi.';
  if (!data.author.trim()) errors.author = 'Penulis wajib diisi.';
  showFieldErrors(el.bookForm, 'book', errors);
  if (Object.keys(errors).length) return;

  el.bookSubmit.disabled = true;
  showAlert('');
  try {
    const created = await api('/books', { method: 'POST', body: data });
    state.books.unshift(created); // tambah di awal: buku terbaru tampil paling atas
    el.bookForm.reset();
    el.bookForm.querySelector('input').focus();
    render();
  } catch (err) {
    showFieldErrors(el.bookForm, 'book', err.details);
    handleError(err);
  } finally {
    el.bookSubmit.disabled = false;
  }
});

async function updateStatus(book, status) {
  showAlert('');
  try {
    // PUT mengganti seluruh data, jadi title & author ikut dikirim.
    const updated = await api(`/books/${book.id}`, {
      method: 'PUT',
      body: { title: book.title, author: book.author, status },
    });
    state.books = state.books.map((b) => (b.id === updated.id ? updated : b));
  } catch (err) {
    handleError(err);
  }
  render(); // jika gagal, render ulang mengembalikan dropdown ke status lama
}

async function deleteBook(book) {
  showAlert('');
  try {
    await api(`/books/${book.id}`, { method: 'DELETE' });
    state.books = state.books.filter((b) => b.id !== book.id);
    render();
  } catch (err) {
    handleError(err);
  }
}

el.filter.addEventListener('change', () => {
  state.filter = el.filter.value;
  render();
});

init();
