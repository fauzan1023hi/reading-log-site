import { useRef, useState } from 'react';

const EMPTY = { title: '', author: '', status: 'want' };

export default function BookForm({ onAdd, onError }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  // useRef: akses langsung ke elemen DOM, dipakai hanya untuk memindahkan fokus.
  const titleRef = useRef(null);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const clientErrors = {};
    if (!form.title.trim()) clientErrors.title = 'Judul wajib diisi.';
    if (!form.author.trim()) clientErrors.author = 'Penulis wajib diisi.';
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;

    setSubmitting(true);
    try {
      await onAdd(form); // penyimpanan diurus induk (ReadingLog)
      setForm(EMPTY);    // mengosongkan form = mengosongkan state, bukan form.reset()
      titleRef.current?.focus();
    } catch (err) {
      setErrors(err.details || {});
      onError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <h3>Tambah buku</h3>
      <div className="field">
        <label htmlFor="book-title">Judul</label>
        <input
          id="book-title" name="title" type="text" maxLength={200} ref={titleRef}
          value={form.title} onChange={handleChange} aria-invalid={Boolean(errors.title)}
        />
        <span className="field-error">{errors.title}</span>
      </div>
      <div className="field">
        <label htmlFor="book-author">Penulis</label>
        <input
          id="book-author" name="author" type="text" maxLength={200}
          value={form.author} onChange={handleChange} aria-invalid={Boolean(errors.author)}
        />
        <span className="field-error">{errors.author}</span>
      </div>
      <div className="field">
        <label htmlFor="book-status">Status</label>
        <select id="book-status" name="status" value={form.status} onChange={handleChange}>
          <option value="want">Ingin dibaca</option>
          <option value="reading">Sedang dibaca</option>
          <option value="done">Selesai</option>
        </select>
      </div>
      <button type="submit" className="btn" disabled={submitting}>Tambah</button>
    </form>
  );
}
