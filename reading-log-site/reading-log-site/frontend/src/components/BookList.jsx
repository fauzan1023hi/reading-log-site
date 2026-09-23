import { STATUS_LABELS } from '../api.js';

// BookItem & BookList tidak punya state: murni "props masuk → tampilan keluar".
// Aksi (ubah status, hapus) dilaporkan ke atas lewat fungsi callback.
function BookItem({ book, onStatusChange, onDelete }) {
  return (
    <li className="book-item">
      <div className="book-info">
        <p className="book-title">{book.title}</p>
        <p className="book-author">{book.author}</p>
        <span className={`badge badge-${book.status}`}>{STATUS_LABELS[book.status]}</span>
      </div>
      <div className="book-actions">
        <label className="book-status">
          <span className="visually-hidden">Ubah status {book.title}</span>
          <select value={book.status} onChange={(e) => onStatusChange(book, e.target.value)}>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn btn-danger btn-small"
          aria-label={`Hapus ${book.title}`}
          onClick={() => onDelete(book)}
        >
          Hapus
        </button>
      </div>
    </li>
  );
}

export default function BookList({ books, emptyMessage, onStatusChange, onDelete }) {
  return (
    <ul className="book-list">
      {books.length === 0 ? (
        <li className="empty-state">{emptyMessage}</li>
      ) : (
        books.map((book) => (
          // key = id dari database: stabil & unik, sehingga React tahu item mana yang dihapus.
          <BookItem key={book.id} book={book} onStatusChange={onStatusChange} onDelete={onDelete} />
        ))
      )}
    </ul>
  );
}
