# 📚 Naratika Platform (Full-Stack Rust + Modern Mobile App)

Aplikasi Full Stack penerbitan dan pembaca novel modern (terinspirasi dari Naratika, GoodNovel, dan Webnovel) dengan **Backend Rust (Axum + Tokio + SQLite)** super cepat dan hemat memori, serta Mobile/Web Client dengan integrasi **Google AdMob** dan siap rilis ke **Google Play Store**.

---

## ✨ Fitur Utama

1. **Pengalaman Pembaca (Reader Experience)**:
   - Antarmuka mobile-first responsif khas Naratika.
   - Reader engine dengan 5 tema baca (Putih, Sepia, Hijau Mata, Gelap, AMOLED).
   - Pengaturan ukuran font, font-family (Serif & Sans), dan spasi baris.
   - Sinkronisasi bookmark, progres bacaan terakhir, dan navigasi cepat daftar bab.

2. **Monetisasi & Google AdMob**:
   - **Banner Ads**: Slot iklan banner non-intrusif di bagian bawah novel.
   - **Interstitial Ads**: Iklan layar penuh yang muncul setiap $N$ bab (dapat diatur frekuensinya).
   - **Rewarded Video Ads**: Video iklan berhadiah token untuk membuka bab VIP terkunci secara gratis.
   - **Live Dynamic Setting**: Ubah semua ID unit iklan Google AdMob langsung dari Panel Admin tanpa upload ulang APK ke Play Store!

3. **Studio Penulis (Author Studio)**:
   - Terbitkan karya novel baru (Judul, Genre, Sinopsis, Cover, Tags).
   - Editor bab dengan penghitung kata real-time dan opsi Bab Gratis vs Bab VIP terkunci.
   - Dashboard analitik pembaca dan estimasi bagi hasil iklan AdMob.

4. **Panel Admin (Admin Dashboard)**:
   - Pengaturan AdMob terpusat secara real-time.
   - Statistik seluruh pengguna, penulis, novel, dan total bacaan platform.

5. **Kesiapan Rilis Google Play Store**:
   - Konfigurasi Capacitor Android (`capacitor.config.json`).
   - Halaman Kebijakan Privasi (`/privacy-policy`) wajib Google Play Store.
   - Panduan lengkap Keystore dan bundle AAB di `PLAYSTORE_RELEASE_GUIDE.md`.

---

## 🚀 Cara Menjalankan Proyek

### 1. Menjalankan Backend Server (Rust)

```bash
cd server
cargo run
```
*Server akan berjalan di `http://localhost:4000` dan otomatis menginisialisasi database SQLite dengan 5 novel populer.*

### 2. Menjalankan Frontend Client (React / Vite)

```bash
cd client
npm run dev
```
*Buka browser di `http://localhost:3000`.*

---

## 🔑 Akun Demo Bawaan

| Role | Username | Password | Keterangan |
|------|----------|----------|------------|
| **Admin** | `admin` | `admin123` | Akses penuh ke panel pengaturan AdMob live |
| **Penulis 1** | `penulis_hebat` | `author123` | Penulis novel CEO & Kultivasi |
| **Penulis 2** | `nona_romansa` | `author123` | Penulis novel Romansa |

---

## 📱 Rilis ke Google Play Store

Lihat file panduan lengkap di: [`PLAYSTORE_RELEASE_GUIDE.md`](./PLAYSTORE_RELEASE_GUIDE.md)
