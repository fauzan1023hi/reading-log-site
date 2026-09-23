# reading-log-site

Personal site **Fauzan Hidayat** + mini app **Pencatat Bacaan** (Reading Log).
Proyek belajar web dari HTML statis sampai deploy, dibangun dalam 8 tahap.

## Arsitektur akhir

```
┌──────────────────────────┐        ┌───────────────────────────┐        ┌────────────────────┐
│ BROWSER                  │ HTTPS  │ VERCEL                    │        │                    │
│ React (hasil build)      │───────▶│ • file statis (dist/)     │        │                    │
│ cookie "token" (httpOnly)│◀───────│ • rewrite /api/* ─────────┼──┐     │                    │
└──────────────────────────┘        └───────────────────────────┘  │     │                    │
          │                                                        │     │                    │
          │ fetch langsung ke api.github.com (Tahap 3)             ▼     │ NEON               │
          ▼                         ┌───────────────────────────┐  SQL   │ PostgreSQL         │
   GitHub REST API                  │ RENDER                    │  +SSL  │ • users            │
                                    │ Node.js + Express         │───────▶│ • books (user_id)  │
                                    │ cors → json → cookieParser│◀───────│                    │
                                    │ → requireAuth → routes    │        │                    │
                                    └───────────────────────────┘        └────────────────────┘
```

## Struktur folder

```
reading-log-site/
├── frontend/            React + Vite (Tahap 7) — versi yang di-deploy
│   ├── src/components/  Header, ThemeToggle, About, Projects, GithubRepos,
│   │                    AuthForm, ReadingLog, BookForm, BookList, Footer
│   ├── src/api.js       helper fetch ke backend
│   ├── src/style.css    CSS yang sama dengan frontend-vanilla
│   ├── vite.config.js   proxy /api → localhost:3000 (development)
│   └── vercel.json      rewrite /api → Render (production)
├── frontend-vanilla/    HTML/CSS/JS murni (Tahap 1–6), disimpan sebagai pembanding
│   ├── index.html, style.css
│   ├── script.js        dark mode + repo GitHub
│   └── books.js         Pencatat Bacaan (API + login)
├── backend/             Node.js + Express (Tahap 4–6)
│   ├── src/server.js    setup app, middleware, error handler
│   ├── src/db.js        pool koneksi PostgreSQL
│   ├── src/validation.js
│   ├── src/middleware/requireAuth.js
│   ├── src/routes/auth.js, books.js
│   ├── schema.sql       definisi tabel
│   ├── scripts/init-db.js
│   ├── requests.http    uji endpoint via REST Client
│   └── .env.example     contoh isi .env (tanpa secret)
└── docs/DEPLOY.md       panduan Neon, Render, Vercel
```

## Menjalankan di laptop

Butuh Node.js ≥ 22.9 (Anda: v24) dan database Neon (lihat `docs/DEPLOY.md` langkah 1).

**Terminal 1 — backend**
```bash
cd backend
npm install
cp .env.example .env        # lalu isi DATABASE_URL & JWT_SECRET
npm run db:init             # sekali saja: membuat tabel
npm run dev                 # http://localhost:3000 (restart otomatis saat file diubah)
```

**Terminal 2 — frontend React**
```bash
cd frontend
npm install
npm run dev                 # buka http://localhost:5173
```

**Opsional — frontend-vanilla** (untuk membandingkan): buka folder `frontend-vanilla`
dengan ekstensi *Live Server*, lalu akses lewat **http://localhost:5500**
(bukan `127.0.0.1:5500` — lihat catatan cookie di bawah).

## Endpoint API

| Method | Path | Butuh login | Sukses | Error |
|---|---|---|---|---|
| GET | `/api/health` | – | 200 | 500 |
| POST | `/api/auth/register` | – | 201 | 400, 409 |
| POST | `/api/auth/login` | – | 200 | 400, 401 |
| POST | `/api/auth/logout` | – | 204 | |
| GET | `/api/auth/me` | ✓ | 200 | 401 |
| GET | `/api/books` | ✓ | 200 | 401 |
| GET | `/api/books/:id` | ✓ | 200 | 400, 401, 403, 404 |
| POST | `/api/books` | ✓ | 201 | 400, 401 |
| PUT | `/api/books/:id` | ✓ | 200 | 400, 401, 403, 404 |
| DELETE | `/api/books/:id` | ✓ | 204 | 400, 401, 403, 404 |

Uji dengan `backend/requests.http` (REST Client) atau curl:
```bash
curl -i -c cookie.txt -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" -d "{\"email\":\"a@b.com\",\"password\":\"rahasia123\"}"
curl -i -b cookie.txt http://localhost:3000/api/books
```

---

## Yang dipelajari per tahap

### Tahap 1 — Halaman profil statis
- HTML semantik (`header`, `nav`, `main`, `section`, `article`, `footer`, `address`) memberi *makna*, bukan hanya bentuk — dibaca screen reader & mesin pencari.
- **Flexbox** untuk susunan satu dimensi (navigasi), **Grid** untuk dua dimensi (kartu).
- **Mobile-first**: gaya dasar untuk HP, lalu `@media (min-width: …)` menambah aturan untuk layar lebar.
- **CSS custom properties** (`--color-primary`) → satu sumber nilai warna.

### Tahap 2 — Interaktivitas
- DOM: `getElementById`, `createElement`, `textContent`, `replaceChildren`.
- Event listener: `click`, `submit` (+ `preventDefault()`), `change`.
- Pola **data → tampilan**: ubah `state`, lalu `render()` menggambar ulang semuanya.
- `localStorage` untuk tema. Dark mode hanya menimpa variabel CSS lewat `data-theme="dark"`.
- `textContent` (bukan `innerHTML`) untuk data dari luar → mencegah XSS.

### Tahap 3 — Data dari API publik
- `fetch` + `async/await`, `response.json()`.
- `fetch` **tidak** melempar error untuk 4xx/5xx → cek `response.ok` sendiri.
- Tiga keadaan UI: memuat, gagal (termasuk rate limit 60 req/jam GitHub), berhasil.
- Tab **Network** DevTools: lihat URL, status, header `x-ratelimit-remaining`, isi respons.

### Tahap 4 — Backend REST API
- Method = aksi: GET baca, POST buat, PUT ganti, DELETE hapus.
- Status code = hasil: 200 OK, 201 Created, 204 No Content, 400 input salah, 404 tidak ada, 500 kesalahan server.
- **Middleware** berjalan berurutan sebelum route: `cors` → `express.json` → `cookieParser` → route → error handler.
- **Validasi frontend** = kenyamanan (cepat). **Validasi server** = keamanan (tidak bisa dilewati, karena siapa pun bisa memanggil API dengan curl).
- (Di tahap ini data masih di array memori → hilang saat server restart. Diganti database di Tahap 5.)

### Tahap 5 — Database
- Tabel, tipe data (`VARCHAR`, `INTEGER`, `TIMESTAMPTZ`), `PRIMARY KEY`, `UNIQUE`, `CHECK`, `FOREIGN KEY`.
- **SQL injection**: jika input disambung ke string SQL, input `'); DROP TABLE books; --` ikut dieksekusi. **Parameterized query** (`$1, $2`) mengirim SQL dan data secara terpisah, sehingga data tidak pernah dianggap perintah.
- Connection string di `.env`, dibaca dengan `node --env-file` (fitur bawaan Node, tanpa library).

### Tahap 6 — Autentikasi
- **Hashing ≠ enkripsi**. Enkripsi bisa dibalik dengan kunci; hashing satu arah. Password disimpan sebagai hash bcrypt (+ salt, sengaja lambat), jadi jika database bocor password asli tidak ikut bocor.
- **Session vs JWT**: session menyimpan data login di server; JWT menyimpan klaim yang ditandatangani di sisi client, dan server cukup memverifikasi tanda tangannya.
- Token di **cookie httpOnly** → tidak bisa dibaca JavaScript (termasuk script XSS).
- **401** = belum login / token tidak valid. **403** = sudah login tapi bukan pemilik data.
- `user_id` diambil dari token, bukan dari body → user tidak bisa memalsukan pemilik.
- CORS dengan cookie: `credentials: true` di server + `credentials: 'include'` di fetch, dan origin harus disebut spesifik (bukan `*`).
- Cookie `SameSite=Lax` ikut terkirim antara `localhost:5500` → `localhost:3000` (situs sama, port beda), tapi **tidak** dari `127.0.0.1:5500` (situs berbeda).

### Tahap 7 — React
Yang dulu ditulis manual di `books.js`, sekarang diurus React:

| JavaScript murni | React |
|---|---|
| `getElementById` + menyimpan referensi elemen | JSX langsung di komponen |
| `render()` dipanggil manual setelah setiap perubahan | otomatis setiap `setState` |
| `el.list.replaceChildren()` + `createElement` per item | `books.map(book => <BookItem … />)` |
| `el.authPanel.hidden = …` | conditional rendering `{user ? … : …}` |
| `textContent` agar aman dari XSS | teks di `{}` otomatis di-escape |
| `addEventListener('submit', …)` | `onSubmit={…}` |
| `init()` di akhir file | `useEffect(…, [])` |
| satu objek `state` global | state lokal per komponen, diangkat ke induk bila dibagi (lifting state up) |

Yang **tidak** berubah: CSS, backend, logika fetch (`api.js`), dan validasi.

### Tahap 8 — Deploy
- **Development** (`npm run dev`): server Vite, hot reload, kode belum diperkecil. **Production** (`npm run build`): file statis di `dist/`, diperkecil & di-hash untuk cache.
- Environment variable diatur di dashboard hosting, bukan di file yang di-commit. `VITE_*` ditanam saat build dan terlihat publik → jangan untuk secret.
- Rewrite Vercel membuat frontend & API satu situs → cookie pihak pertama, tanpa CORS.
- Cookie production: `Secure` (hanya HTTPS). `SameSite=None` hanya jika benar-benar lintas situs.
- Membaca log: Vercel (build), Render (runtime), DevTools (Network/Console/Cookies). Lihat tabel di `docs/DEPLOY.md`.

## Keamanan yang diterapkan
- Secret hanya di `.env` (di-ignore git) / environment hosting.
- Password → bcrypt cost 12. Pesan login gagal tidak membedakan "email tidak ada" dan "password salah".
- Semua query parameterized. Validasi di server + `CHECK` constraint di database.
- JWT di cookie httpOnly. Error 500 tidak membocorkan detail ke client.
