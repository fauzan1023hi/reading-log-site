import { useEffect, useState } from 'react';

// GANTI dengan username GitHub Anda.
const GITHUB_USERNAME = 'octocat';

async function fetchRepos(signal) {
  const url = `https://api.github.com/users/${encodeURIComponent(GITHUB_USERNAME)}/repos?sort=updated&per_page=6`;
  const response = await fetch(url, { signal });

  if (!response.ok) {
    if ((response.status === 403 || response.status === 429) &&
        response.headers.get('x-ratelimit-remaining') === '0') {
      const reset = Number(response.headers.get('x-ratelimit-reset')) * 1000;
      const time = new Date(reset).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      throw new Error(`Batas request GitHub API habis. Coba lagi sekitar pukul ${time}.`);
    }
    if (response.status === 404) throw new Error(`User GitHub "${GITHUB_USERNAME}" tidak ditemukan.`);
    throw new Error(`GitHub API membalas dengan status ${response.status}.`);
  }
  return response.json();
}

export default function GithubRepos() {
  // Tiga state = tiga kemungkinan tampilan: memuat, gagal, berhasil.
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // AbortController membatalkan request jika komponen dilepas sebelum selesai,
    // agar tidak ada setState ke komponen yang sudah tidak ada.
    const controller = new AbortController();

    fetchRepos(controller.signal)
      .then(setRepos)
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err instanceof TypeError
          ? 'Tidak bisa terhubung ke GitHub. Periksa koneksi internet Anda.'
          : err.message);
      })
      .finally(() => setLoading(false));

    // Fungsi yang dikembalikan useEffect = "cleanup", dijalankan saat komponen dilepas.
    return () => controller.abort();
  }, []);

  let status = '';
  if (loading) status = 'Memuat repo…';
  else if (error) status = error;
  else if (repos.length === 0) status = 'Belum ada repo publik.';

  return (
    <section id="repo" className="section container">
      <h2>Repo GitHub Saya</h2>
      <p className="muted" aria-live="polite">{status}</p>
      <div className="card-grid">
        {repos.map((repo) => (
          <article className="card" key={repo.id}>
            <h3>
              {/* React otomatis meng-escape teks di dalam {} → aman dari XSS,
                  setara dengan textContent di versi JS murni. */}
              <a href={repo.html_url} target="_blank" rel="noopener noreferrer">{repo.name}</a>
            </h3>
            <p>{repo.description || 'Tanpa deskripsi.'}</p>
            <div className="repo-meta">
              {repo.language && <span>{repo.language}</span>}
              <span>★ {repo.stargazers_count}</span>
              <span>Diperbarui {new Date(repo.updated_at).toLocaleDateString('id-ID')}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
