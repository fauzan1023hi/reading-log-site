// Helper fetch ke backend — logikanya sama dengan api() di frontend-vanilla/books.js.
// React tidak mengurus komunikasi HTTP; itu tetap tugas kita.

// Default '' → URL relatif "/api/...", diteruskan oleh proxy Vite (dev) / rewrite Vercel (prod).
const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api`;

export const STATUS_LABELS = {
  want: 'Ingin dibaca',
  reading: 'Sedang dibaca',
  done: 'Selesai',
};

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details || {};
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: 'include', // kirim cookie token (dibutuhkan jika VITE_API_URL beda domain)
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Server tidak bisa dihubungi. Pastikan backend berjalan.');
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(response.status, data.error || `Error ${response.status}`, data.details);
  }
  return data;
}
