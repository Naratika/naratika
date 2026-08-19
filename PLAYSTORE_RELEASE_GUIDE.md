# 🚀 Panduan Rilis "Naratika" ke Google Play Store

## ✅ Apa yang sudah disiapkan di paket ini

- Folder `client/android/` — proyek Android native (Capacitor) **sudah di-generate**, tidak perlu jalankan `npx cap add android` lagi.
- `client/dist/` — hasil build web (React/Vite) versi terbaru sudah ada di dalamnya.
- `AndroidManifest.xml` sudah dilengkapi:
  - `INTERNET`, `ACCESS_NETWORK_STATE`
  - `com.google.android.gms.permission.AD_ID` (wajib untuk AdMob di Android 13+)
  - `meta-data` AdMob App ID (masih ID **test/demo** dari Google — WAJIB diganti, lihat langkah 2)
- Bug keamanan diperbaiki: JWT secret di backend **tidak lagi hardcode**. Sekarang dibaca dari environment variable `JWT_SECRET` (lihat langkah 5). Kalau env var tidak diset, server tetap jalan pakai default lama supaya `cargo run` lokal tidak rusak — tapi jangan pernah deploy produksi tanpa mengatur `JWT_SECRET`.

⚠️ **Catatan jujur soal batasan saya**: saya tidak punya Android SDK, Gradle, maupun akses ke Google Play Console di lingkungan kerja saya — jadi saya tidak bisa meng-compile file `.aab`/`.apk` final atau meng-upload ke Play Store dari sini. Langkah-langkah di bawah ini yang perlu Anda jalankan sendiri di komputer (dengan Android Studio terpasang), karena proses signing & upload memang mengharuskan kredensial dan mesin Anda sendiri.

---

## 1. Siapkan environment lokal

Install di komputer Anda:
- **Node.js** 18+
- **Android Studio** (sudah termasuk Android SDK & Gradle)
- **Rust** (via [rustup.rs](https://rustup.rs)) — untuk backend

## 2. Ganti ID AdMob dengan milik Anda sendiri

ID yang ada sekarang (`ca-app-pub-3940256099942544~3347511713` dkk.) adalah **ID uji coba/demo dari Google** — aplikasi akan ditolak Play Store kalau ID demo ini dipakai untuk rilis publik.

1. Buat akun di [admob.google.com](https://admob.google.com/), buat App + Ad Units (Banner, Interstitial, Rewarded).
2. Update App ID di `client/android/app/src/main/AndroidManifest.xml` (tag `meta-data`) dan di `client/capacitor.config.json`.
3. Update masing-masing Ad Unit ID di kode frontend: `client/src/services/admobService.js` (atau lewat Panel Admin di dalam aplikasi — fitur ini sudah dibuat sesuai README, jadi ID bisa diubah live tanpa build ulang).

## 3. Build web assets & sinkronkan ke Android

```bash
cd client
npm install
npm run build
npx cap sync android
```

## 4. Buat ikon aplikasi & splash screen (opsional tapi disarankan)

Icon yang ada sekarang masih ikon default Capacitor. Siapkan logo 1024×1024px, lalu:

```bash
npm install -D @capacitor/assets
npx capacitor-assets generate --android
```

## 5. Jalankan & deploy backend Rust

```bash
cd server
export JWT_SECRET="ganti-dengan-string-acak-yang-panjang-dan-rahasia"
cargo run --release
```

Untuk produksi, deploy ke VPS/Fly.io (sudah ada `Dockerfile` & `fly.toml`) dan pastikan `JWT_SECRET` diset sebagai environment variable di sana juga, bukan nilai default.

Setelah backend online, update base URL API di `client/src/services/api.js` agar menunjuk ke domain server produksi Anda (bukan `localhost`), lalu ulangi langkah 3 (`npm run build && npx cap sync android`).

## 6. Buat Keystore (kunci signing rilis)

```bash
keytool -genkey -v -keystore release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias novelkey
```

Simpan `release-key.jks` dan password-nya di tempat aman — **jika hilang, Anda tidak bisa update aplikasi yang sudah live di Play Store lagi.**

Konfigurasikan signing di `client/android/app/build.gradle` (tambahkan `signingConfigs` yang mengarah ke keystore ini), atau lakukan signing manual setelah build lewat Android Studio (Build → Generate Signed Bundle).

## 7. Build Android App Bundle (.aab)

Buka folder `client/android` di **Android Studio** (biarkan Gradle sync selesai), lalu:

```bash
cd client/android
./gradlew bundleRelease
```

File hasil: `client/android/app/build/outputs/bundle/release/app-release.aab`

## 8. Checklist wajib Google Play Console

- **Privacy Policy URL** aktif — endpoint `/privacy-policy` sudah tersedia di kode (`client/src/pages/PrivacyPolicy.jsx`), tinggal host di domain produksi Anda.
- **Ads declaration**: pilih "Ya, aplikasi saya berisi iklan".
- **Data Safety**: deklarasikan pengumpulan User ID (akun & rak buku) dan Advertising ID (AdMob); data terenkripsi saat transit (HTTPS); sediakan mekanisme penghapusan akun.
- **Content rating**: isi kuesioner rating konten (13+ atau 16+/Mature jika ada kategori novel dewasa).
- **App icon, screenshots (min. 2), feature graphic 1024×500** — belum ada di paket ini, perlu dibuat.
- **Target API level**: proyek sudah diset `targetSdkVersion 34`; cek [persyaratan target API terbaru Google Play](https://support.google.com/googleplay/android-developer/answer/11926878) saat Anda rilis, karena Google menaikkan syarat ini tiap tahun.
- **versionCode/versionName**: masih `1` / `"1.0"` di `client/android/app/build.gradle` — naikkan `versionCode` setiap kali upload build baru.

## 9. Akun demo bawaan (untuk testing sebelum rilis — hapus/ubah untuk produksi!)

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Penulis | `penulis_hebat` | `author123` |
| Penulis | `nona_romansa` | `author123` |

**Ganti password default ini sebelum aplikasi digunakan publik.**
