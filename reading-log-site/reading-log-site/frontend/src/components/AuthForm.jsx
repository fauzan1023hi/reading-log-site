import { useState } from 'react';
import { api } from '../api.js';

function validate({ email, password }) {
  const errors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Format email tidak valid.';
  if (password.length < 8) errors.password = 'Password minimal 8 karakter.';
  return errors;
}

// onAuthenticated datang dari App (props). Komponen ini tidak menyimpan "user"
// sendiri — ia melapor ke atas, dan App yang memutuskan tampilan berikutnya.
export default function AuthForm({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  // Controlled input: nilai input disimpan di state, bukan dibaca dari DOM.
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isLogin = mode === 'login';

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const clientErrors = validate(form);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;

    setSubmitting(true);
    setMessage('');
    try {
      const { user } = await api(isLogin ? '/auth/login' : '/auth/register', {
        method: 'POST',
        body: form,
      });
      onAuthenticated(user);
    } catch (err) {
      setErrors(err.details);
      setMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode() {
    setMode(isLogin ? 'register' : 'login');
    setErrors({});
    setMessage('');
  }

  return (
    <>
      {message && <p className="alert alert-error" role="alert">{message}</p>}
      <form className="form form-narrow" onSubmit={handleSubmit} noValidate>
        <h3>{isLogin ? 'Masuk' : 'Daftar akun'}</h3>
        <div className="field">
          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email" name="email" type="email" autoComplete="email"
            value={form.email} onChange={handleChange} aria-invalid={Boolean(errors.email)}
          />
          <span className="field-error">{errors.email}</span>
        </div>
        <div className="field">
          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password" name="password" type="password"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            value={form.password} onChange={handleChange} aria-invalid={Boolean(errors.password)}
          />
          <span className="field-error">{errors.password}</span>
        </div>
        <button type="submit" className="btn" disabled={submitting}>
          {isLogin ? 'Masuk' : 'Daftar'}
        </button>
        <p className="auth-switch">
          {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
          <button type="button" className="link-button" onClick={switchMode}>
            {isLogin ? 'Daftar' : 'Masuk'}
          </button>
        </p>
      </form>
    </>
  );
}
