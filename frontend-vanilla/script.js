// =========================================================
// script.js — Tahap 2 (dark mode) & Tahap 3 (repo GitHub)
// =========================================================

// Satu-satunya tempat mengganti username. Diletakkan di atas agar mudah ditemukan.
// GANTI dengan username GitHub Anda.
const GITHUB_USERNAME = 'octocat';

// ---------------------------------------------------------
// Tahap 2 — DARK MODE
// ---------------------------------------------------------
const themeToggle = document.getElementById('theme-toggle');

function currentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

// Tampilan tombol selalu diturunkan dari data (tema saat ini),
// bukan diubah manual di banyak tempat — pola "data → tampilan".
function renderThemeButton() {
  const isDark = currentTheme() === 'dark';
  themeToggle.textContent = isDark ? 'Mode terang' : 'Mode gelap';
  themeToggle.setAttribute('aria-pressed', String(isDark));
}

themeToggle.addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try {
    // localStorage menyimpan string per origin, bertahan walau browser ditutup.
    localStorage.setItem('theme', next);
  } catch {
    // Mode privat/penyimpanan diblokir: tema tetap berganti, hanya tidak diingat.
  }
  renderThemeButton();
});

renderThemeButton();

// ---------------------------------------------------------
// Tahap 3 — REPO GITHUB (fetch + async/await)
// ---------------------------------------------------------
const repoStatus = document.getElementById('repo-status');
const repoList = document.getElementById('repo-list');

// async function: boleh memakai "await" di dalamnya.
// await = "tunggu Promise ini selesai" tanpa membekukan halaman;
// selama menunggu, browser tetap responsif (bisa scroll, klik, dll).
async function loadRepos() {
  // 1) LOADING STATE: beri tahu pengguna bahwa sesuatu sedang terjadi.
  repoStatus.textContent = 'Memuat repo…';

  try {
    const url = `https://api.github.com/users/${encodeURIComponent(GITHUB_USERNAME)}/repos?sort=updated&per_page=6`;
    const response = await fetch(url);

    // fetch() TIDAK melempar error untuk status 404/403/500 — hanya untuk
    // gangguan jaringan. Jadi status HTTP harus dicek sendiri.
    if (!response.ok) {
      // GitHub membatasi 60 request/jam per IP tanpa login.
      // Saat habis: status 403/429 dan header x-ratelimit-remaining = 0.
      if ((response.status === 403 || response.status === 429) &&
          response.headers.get('x-ratelimit-remaining') === '0') {
        const reset = Number(response.headers.get('x-ratelimit-reset')) * 1000;
        const time = new Date(reset).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        throw new Error(`Batas request GitHub API habis. Coba lagi sekitar pukul ${time}.`);
      }
      if (response.status === 404) {
        throw new Error(`User GitHub "${GITHUB_USERNAME}" tidak ditemukan.`);
      }
      throw new Error(`GitHub API membalas dengan status ${response.status}.`);
    }

    // Body respons berupa teks JSON; .json() mengubahnya menjadi array objek JS.
    const repos = await response.json();
    renderRepos(repos);
  } catch (err) {
    // 2) ERROR STATE: tampilkan pesan yang bisa dipahami, bukan halaman kosong.
    repoStatus.textContent = err instanceof TypeError
      ? 'Tidak bisa terhubung ke GitHub. Periksa koneksi internet Anda.'
      : err.message;
  }
}

function renderRepos(repos) {
  repoList.replaceChildren(); // kosongkan dulu, lalu gambar ulang dari data

  if (repos.length === 0) {
    repoStatus.textContent = 'Belum ada repo publik.';
    return;
  }
  repoStatus.textContent = '';

  for (const repo of repos) {
    const card = document.createElement('article');
    card.className = 'card';

    const title = document.createElement('h3');
    const link = document.createElement('a');
    link.href = repo.html_url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    // textContent (bukan innerHTML): teks dari luar tidak pernah dianggap HTML,
    // sehingga deskripsi berisi <script> tidak bisa dijalankan (mencegah XSS).
    link.textContent = repo.name;
    title.append(link);

    const desc = document.createElement('p');
    desc.textContent = repo.description || 'Tanpa deskripsi.';

    const meta = document.createElement('div');
    meta.className = 'repo-meta';
    if (repo.language) meta.append(span(repo.language));
    meta.append(span(`★ ${repo.stargazers_count}`));
    meta.append(span(`Diperbarui ${new Date(repo.updated_at).toLocaleDateString('id-ID')}`));

    card.append(title, desc, meta);
    repoList.append(card);
  }
}

function span(text) {
  const el = document.createElement('span');
  el.textContent = text;
  return el;
}

loadRepos();
