# DompetKu — Personal Finance Mobile App (Cloud & Docker Edition)

Aplikasi pencatat keuangan pribadi mobile-first yang super cepat dengan laporan keuangan otomatis bergaya **struk belanja digital (*digital thermal receipt*)** yang elegan, ringkas, dan siap dibagikan.

Kini dilengkapi dengan fitur **Login Akun Google (Gmail) dengan Sinkronisasi Cloud Otomatis** serta dukungan penuh untuk **Docker & Docker Compose**.

---

## Fitur Baru: Login Google & Cloud Sync

1. **Masuk Menggunakan Akun Google (Gmail)**:
   - Terintegrasi dengan Google OAuth 2.0 resmi.
   - Mengambil nama, email, dan foto profil Google secara otomatis.
   - Sesi terproteksi dengan HTTP-Only Cookie yang aman.
2. **Penyimpanan Cloud Otomatis (Cloud Sync)**:
   - Ketika login dengan Google, semua akun dompet, kategori, dan transaksi tersimpan otomatis di database server/cloud (SQLite persistent).
   - Auto-sync terjadi setiap ada perubahan transaksi, penambahan akun, atau edit kategori (dengan *debounced sync* hemat bandwidth).
   - Data tersinkronisasi antar-perangkat: buka dari laptop atau HP, data Anda langsung muncul secara real-time!
   - Tetap mendukung **Mode Tamu (Offline / Guest)** menggunakan LocalStorage bagi yang tidak ingin login.
3. **Mode Demo Cloud Cepat**:
   - Tersedia tombol satu klik *"Login Gmail Simulasi (Demo Cloud)"* pada modal profil sehingga Anda dapat menguji fitur penyimpanan cloud seketika tanpa harus menyiapkan Google Cloud Console terlebih dahulu!

## Scan Foto Struk (OCR Lokal)

- Dari formulir pengeluaran, pilih **Pindai foto struk**. Aplikasi mencoba mengisi tanggal transaksi, item, harga item, dan total sebagai draf.
- Periksa atau edit hasilnya di formulir sebelum menekan **Simpan Transaksi**. Hasil scan tidak pernah otomatis membuat transaksi.
- OCR berjalan di server aplikasi menggunakan Tesseract dengan data bahasa Indonesia dan Inggris. Foto diproses sementara di VPS lalu dihapus; layanan OCR eksternal tidak digunakan.
- Docker memasang Tesseract saat image dibangun. Koneksi internet tidak dibutuhkan untuk pemindaian saat aplikasi sudah berjalan. Unggah JPG, PNG, atau WebP hingga 10 MB.
- Bentuk dan kualitas cetakan struk memengaruhi hasil. Jika tanggal, nama item, atau total belum terbaca, isi atau koreksi secara manual.

---

## Menjalankan dengan Docker (Rekomendasi Production / VPS)

Aplikasi ini telah disiapkan dengan **Multi-stage Dockerfile** berbasis `node:22-bookworm-slim`, Tesseract OCR, dan pengguna non-root.

### 1. Menggunakan Docker Compose (Satu Perintah)

```bash
# Salin konfigurasi environment jika ingin mengubah konfigurasi
cp .env.example .env

# Jalankan container di latar belakang
docker compose up -d --build
```

Aplikasi langsung dapat diakses di browser pada:
👉 `http://localhost:3100`

> **Catatan Persistensi Data:** Data database cloud tersimpan secara permanen di named volume `finance_data` (`/app/data/finance.sqlite`), sehingga data tidak akan pernah hilang meskipun container di-stop, di-restart, atau di-rebuild!

### 2. Perintah Docker Berguna

```bash
# Melihat log aplikasi
docker compose logs -f

# Menghentikan aplikasi
docker compose down

# Merestart aplikasi
docker compose restart
```

## Deploy di Ubuntu VPS dengan PM2

Mode ini menjalankan aplikasi Next.js standalone di PM2, Tesseract untuk OCR lokal, dan SQLite pada disk VPS. Jalankan proses PM2 dengan satu instance agar tidak terjadi konflik akses SQLite. Gunakan Ubuntu 22.04 atau 24.04.

### 1. Pasang Node.js 22, Tesseract, dan Nginx

```bash
sudo apt update
sudo apt install -y curl ca-certificates tesseract-ocr tesseract-ocr-ind tesseract-ocr-eng nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install --global pm2
node --version
tesseract --list-langs
```

Pastikan versi Node.js menunjukkan `v22.x`, dan daftar bahasa Tesseract berisi `eng` serta `ind`.

### 2. Siapkan aplikasi dan database

Clone repo ke lokasi tetap (contoh `/opt/finance-note`) dan jalankan perintah berikut dari direktori repo:

```bash
sudo mkdir -p /var/lib/finance-note
sudo chown -R "$USER":"$USER" /var/lib/finance-note
npm ci
cp .env.example .env
nano .env
npm run build
```

Isi `NEXT_PUBLIC_APP_URL` dengan URL HTTPS yang akan dipakai. Jika memakai login Google, masukkan `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET`, lalu daftarkan callback `https://domain-anda.com/api/auth/google/callback` di Google Cloud Console. Tanpa kredensial Google, aplikasi tetap dapat digunakan dalam mode lokal/tamu. Database production memakai `/var/lib/finance-note/finance.sqlite` dan tidak berada di dalam folder build.

### 3. Jalankan dengan PM2 dan aktifkan saat boot

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd
```

PM2 akan menampilkan satu perintah `sudo` untuk mengaktifkan service saat Ubuntu boot. Jalankan perintah yang ditampilkan. Cek status dan log dengan `pm2 status` serta `pm2 logs finance-note`.

Saat merilis versi baru:

```bash
git pull
npm ci
npm run build
pm2 restart finance-note --update-env
```

### 4. Hubungkan domain dengan Nginx dan HTTPS

Salin `deploy/nginx-finance-note.conf.example` ke `/etc/nginx/sites-available/finance-note`, ganti `domain-anda.com` dengan domain sendiri, lalu aktifkan konfigurasi dan pasang sertifikat HTTPS:

```bash
sudo ln -s /etc/nginx/sites-available/finance-note /etc/nginx/sites-enabled/finance-note
sudo nginx -t
sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d domain-anda.com -d www.domain-anda.com
```

Port aplikasi yang bisa diakses pengguna adalah **1000** (`http://domain-anda.com:1000`); port backend PM2 **3100** hanya terikat ke `127.0.0.1`. Setelah sertifikat dipasang, HTTPS standar tersedia di `https://domain-anda.com` melalui port 443. Ubah `NEXT_PUBLIC_APP_URL` di `.env` menjadi `https://domain-anda.com`, sesuaikan redirect URI Google OAuth jika dipakai, lalu rebuild dan restart PM2. Buka port 1000 untuk akses HTTP, serta port 80/443 jika memakai HTTPS. Port 3000, 8000, dan 8080 tidak dipakai oleh konfigurasi ini.

Untuk deployment PM2, `npm run build` juga menyalin aset statis dan folder `public` ke output standalone. Entrypoint `scripts/start-production.cjs` memuat `.env` sebelum memulai server Next.js. Panduan ini mengikuti mode standalone Next.js dan startup persistence PM2 ([Next.js](https://nextjs.org/docs/15/app/api-reference/config/next-config-js/output), [PM2](https://pm2.keymetrics.io/docs/usage/startup/)); paket Node.js 22 tersedia untuk Ubuntu melalui NodeSource ([petunjuk NodeSource](https://github.com/nodesource/distributions/blob/master/DEV_README.md)).

---

## Konfigurasi Login Google OAuth (Gmail)

Jika Anda ingin menggunakan login Google OAuth resmi milik Anda sendiri:

1. Buka [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Buat Project baru (atau pilih project yang sudah ada).
3. Buka **APIs & Services** > **OAuth consent screen**:
   - Pilih User Type: **External**, isi Nama Aplikasi dan Email Dukungan.
4. Buka **Credentials** > **Create Credentials** > **OAuth client ID**:
   - Application type: **Web application**.
   - Tambahkan **Authorized redirect URIs**:
     - `http://localhost:3100/api/auth/google/callback` (untuk lokal / Docker lokal)
     - `https://domain-anda.com/api/auth/google/callback` (untuk domain production Anda)
5. Salin **Client ID** dan **Client Secret** ke file `.env`:
   ```env
   NEXT_PUBLIC_APP_URL=http://localhost:3100
   GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxx
   ```
6. Restart aplikasi (`docker compose restart` atau restart dev server).

---

## Menjalankan Secara Lokal (Node.js)

```bash
# 1. Instalasi dependensi
npm install

# 2. Menjalankan server pengembangan
npm run dev

# 3. Menjalankan unit tests (18 tests lulus 100%)
npm test

# 4. Memeriksa linter (0 errors, 0 warnings)
npm run lint

# 5. Build produksi mandiri
npm run build
```

---

## Arsitektur Teknis

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript.
- **Styling**: Tailwind CSS v4 (Mobile-first, Glassmorphism, Dark & Light Mode).
- **Cloud Database**: Node.js 22+ Built-in SQLite (`node:sqlite`) dengan Write-Ahead Logging (WAL) untuk performa tinggi & zero-native compilation errors.
- **Authentication**: Native Google OAuth 2.0 + Secure HTTP-Only Cookie Session.
- **Containerization**: Multi-stage Docker Alpine + Next.js Standalone Output.
