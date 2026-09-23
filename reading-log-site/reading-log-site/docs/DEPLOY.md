# Panduan Deploy (Tahap 8)

Urutan: **Neon (database) → Render (backend) → Vercel (frontend) → sambungkan**.
Semua langkah yang butuh akun dilakukan oleh Anda sendiri.

```
Browser ──HTTPS──▶ Vercel (React build statis)
                     │  /api/*  (rewrite, lihat frontend/vercel.json)
                     ▼
                   Render (Node.js + Express)  ──SSL──▶  Neon (PostgreSQL)
```

---

## 0. Persiapan

1. Pastikan semua sudah di-push ke GitHub (`git push`).
2. Pastikan `.env` **tidak** ikut ter-push: `git ls-files | grep .env` hanya boleh
   menampilkan `.env.example`.

---

## 1. Neon — database

1. Daftar di <https://neon.tech> (bisa login dengan GitHub).
2. **Create project** → nama bebas (misal `reading-log`), region terdekat
   (misal *AWS Asia Pacific (Singapore)*).
3. Di dashboard project → **Connect** → salin *connection string*
   (bentuknya `postgresql://USER:PASSWORD@HOST/neondb?sslmode=require`).
4. Buat tabel — pilih salah satu:
   - **SQL Editor** di dashboard Neon → tempel isi `backend/schema.sql` → **Run**, atau
   - dari laptop: isi `DATABASE_URL` di `backend/.env`, lalu `npm run db:init`.
5. Cek di menu **Tables**: ada `users` dan `books`.

> Connection string berisi password. Hanya boleh ada di `backend/.env` (lokal) dan
> di Environment Render. Jangan ditempel di kode, chat, atau screenshot.

---

## 2. Render — backend

1. Daftar di <https://render.com> dengan akun GitHub.
2. **New → Web Service** → pilih repo `reading-log-site`.
3. Isi pengaturan:

   | Kolom | Nilai |
   |---|---|
   | Root Directory | `backend` |
   | Runtime | Node |
   | Build Command | `npm install` |
   | Start Command | `npm start` |
   | Instance Type | Free |

4. Bagian **Environment Variables** (tombol *Add Environment Variable*):

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | connection string dari Neon |
   | `JWT_SECRET` | string acak baru (**jangan** pakai yang di laptop). Buat dengan `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
   | `NODE_ENV` | `production` |
   | `COOKIE_SAMESITE` | `lax` |
   | `CORS_ORIGIN` | kosongkan dulu (lihat langkah 4) |

5. **Advanced → Health Check Path**: `/api/health`.
6. **Create Web Service**. Tunggu sampai status **Live**.
7. Uji: buka `https://NAMA-ANDA.onrender.com/api/health` → harus `{"status":"ok"}`.

> Paket gratis Render "tidur" setelah ±15 menit tanpa request. Request pertama
> sesudahnya butuh ±30–60 detik. Itu normal, bukan error.

---

## 3. Vercel — frontend

1. Edit `frontend/vercel.json`: ganti `GANTI-DENGAN-URL-RENDER` dengan nama service
   Render Anda. Commit & push.
2. Daftar di <https://vercel.com> dengan akun GitHub.
3. **Add New → Project** → import repo `reading-log-site`.
4. Pengaturan:

   | Kolom | Nilai |
   |---|---|
   | Root Directory | `frontend` (klik *Edit*) |
   | Framework Preset | Vite (terdeteksi otomatis) |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |
   | Environment Variables | **tidak perlu** (VITE_API_URL dibiarkan kosong) |

5. **Deploy**. Buka URL `https://NAMA-ANDA.vercel.app`, lalu coba daftar, tambah buku, refresh.

---

## 4. Mengapa memakai rewrite, bukan memanggil Render langsung?

Frontend (`*.vercel.app`) dan backend (`*.onrender.com`) berada di **situs berbeda**.
Jika browser memanggil Render langsung, cookie token menjadi **cookie pihak ketiga**:

- wajib `SameSite=None; Secure`, dan
- tetap bisa diblokir: Safari memblokir cookie pihak ketiga secara default, dan pengguna
  browser lain bisa mengaktifkan pemblokiran yang sama → login "berhasil" tapi request berikutnya 401.

Dengan **rewrite** di `vercel.json`, browser hanya berbicara dengan `vercel.app`.
Vercel meneruskan `/api/*` ke Render di sisi server. Bagi browser, cookie itu
cookie **pihak pertama**, sehingga `SameSite=Lax` cukup dan CORS tidak diperlukan.

### Jika tetap ingin memanggil Render langsung (untuk belajar CORS production)

| Tempat | Setelan |
|---|---|
| Vercel → Environment Variables | `VITE_API_URL=https://NAMA-ANDA.onrender.com` (lalu *Redeploy*: nilai VITE_* ditanam saat build) |
| Render → Environment | `CORS_ORIGIN=https://NAMA-ANDA.vercel.app` (tanpa `/` di akhir) |
| Render → Environment | `COOKIE_SAMESITE=none` (browser menolak `none` tanpa `Secure`; `Secure` otomatis aktif karena `NODE_ENV=production`) |

---

## 5. Membaca log saat terjadi error

| Gejala | Tempat melihat | Kemungkinan penyebab |
|---|---|---|
| Halaman putih / aset 404 | Vercel → Deployments → *Build Logs* | Root Directory bukan `frontend`, build gagal |
| `Server tidak bisa dihubungi` | DevTools → Network → request `/api/...` | URL di `vercel.json` salah, Render masih tidur/deploy |
| 500 dari `/api/...` | Render → service → **Logs** | `DATABASE_URL` salah, tabel belum dibuat (`relation "users" does not exist`) |
| Render gagal start | Render → Logs | `JWT_SECRET belum diisi` / `DATABASE_URL belum diisi` (pesan dari kode kita) |
| Login OK tapi lalu 401 | DevTools → Application → Cookies | Pakai cara langsung tanpa `SameSite=None`, atau browser memblokir cookie pihak ketiga |
| Error CORS di Console | DevTools → Console | `CORS_ORIGIN` tidak sama persis dengan origin Vercel (cek `https`, tanpa `/`) |

Pesan detail error sengaja **hanya** ditulis ke log server (`console.error` di
`server.js`). Client hanya menerima `Terjadi kesalahan di server.` agar struktur
internal tidak bocor.
