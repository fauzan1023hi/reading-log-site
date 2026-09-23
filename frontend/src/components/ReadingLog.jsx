import { useEffect, useState } from 'react';
import { api } from '../api.js';
import BookForm from './BookForm.jsx';
import BookList from './BookList.jsx';

// ReadingLog MEMILIKI state "books". State ini diangkat (lifted up) ke sini
// karena dua komponen saudara membutuhkannya:
//   BookForm  → menambah buku   (mengirim buku baru ke atas lewat onAdd)
//   BookList  → menampilkan buku (menerima daftar dari atas lewat props)
// Saudara tidak bisa saling berbicara langsung; mereka lewat induk yang sama.
export default function ReadingLog({ user, onLogout, onSessionExpired }) {
  const [books, setBooks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dijalankan sekali saat komponen muncul (yaitu tepat setelah login).
  useEffect(() => {
    api('/books')
      .then(setBooks)
      .catch(handleError)
      .finally(() => setLoading(false));
  }, []);

  function handleError(err) {
    if (err.status === 401) return onSessionExpired(); // App akan menampilkan AuthForm lagi
    setError(err.message);
  }

  async function addBook(data) {
    setError('');
    const created = await api('/books', { method: 'POST', body: data });
    // State tidak boleh diubah langsung (books.unshift). Buat array BARU,
    // agar React tahu ada perubahan dan menggambar ulang.
    setBooks((prev) => [created, ...prev]);
  }

  async function changeStatus(book, status) {
    setError('');
    try {
      const updated = await api(`/books/${book.id}`, {
        method: 'PUT',
        body: { title: book.title, author: book.author, status },
      });
      setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    } catch (err) {
      handleError(err);
    }
  }

  async function deleteBook(book) {
    setError('');
    try {
      await api(`/books/${book.id}`, { method: 'DELETE' });
      setBooks((prev) => prev.filter((b) => b.id !== book.id));
    } catch (err) {
      handleError(err);
    }
  }

  // Nilai turunan: dihitung ulang setiap render, TIDAK disimpan sebagai state terpisah
  // (menyimpannya akan membuat dua sumber kebenaran yang bisa tidak sinkron).
  const visibleBooks = filter === 'all' ? books : books.filter((b) => b.status === filter);

  return (
    <>
      {error && <p className="alert alert-error" role="alert">{error}</p>}

      <div className="session-bar">
        <span className="muted">Masuk sebagai <strong>{user.email}</strong></span>
        <button type="button" className="btn btn-ghost btn-small" onClick={onLogout}>Keluar</button>
      </div>

      <div className="reading-layout">
        <BookForm onAdd={addBook} onError={handleError} />

        <div>
          <div className="list-toolbar">
            <span className="muted">{visibleBooks.length} dari {books.length} buku</span>
            <div className="filter">
              <label htmlFor="filter-status">Filter</label>
              <select id="filter-status" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">Semua</option>
                <option value="want">Ingin dibaca</option>
                <option value="reading">Sedang dibaca</option>
                <option value="done">Selesai</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p className="muted">Memuat buku…</p>
          ) : (
            <BookList
              books={visibleBooks}
              emptyMessage={books.length === 0
                ? 'Belum ada buku. Tambahkan lewat form.'
                : 'Tidak ada buku dengan status ini.'}
              onStatusChange={changeStatus}
              onDelete={deleteBook}
            />
          )}
        </div>
      </div>
    </>
  );
}
