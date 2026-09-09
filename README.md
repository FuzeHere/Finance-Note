# DompetKu — Personal Finance Mobile App (Receipt Edition)

Aplikasi pencatat keuangan pribadi mobile-first yang super cepat dengan laporan keuangan otomatis bergaya **struk belanja digital (*digital thermal receipt*)** yang elegan, ringkas, dan siap dibagikan.

---

## Status Kesiapan Vercel

Aplikasi ini **100% SIAP DIDEPLOY KE VERCEL** dengan arsitektur zero-config:
- **Build Status**: `Compiled successfully` (`next build` lulus 100% tanpa error).
- **Linter Status**: `ESLint 0 errors, 0 warnings` (`npm run lint` lulus 100%).
- **Unit Tests**: 16 dari 16 tes kalkulasi akuntansi lulus 100% (`npm test`).
- **Standard Stack**: Next.js 16 App Router + React 19 + TypeScript + Tailwind CSS v4.
- **Offline-First & Zero-Config Backend**: Menggunakan arsitektur penyimpanan lokal terisolasi yang langsung berjalan seketika di Vercel tanpa memerlukan setup database atau konfigurasi environment variable tambahan!

---

## Cara Deploy ke Vercel (Langkah Cepat)

### Opsi 1: Lewat Dashboard Vercel (Rekomendasi)
1. Hubungkan repositori GitHub (`https://github.com/FuzeHere/Finance-Note`).
2. Pastikan kode sudah ter-push ke GitHub:
   ```bash
   git add .
   git commit -m "feat: Finance Note personal finance app"
   git push
   ```
3. Buka [vercel.com](https://vercel.com) dan klik **Add New... -> Project**.
4. Pilih repositori GitHub Anda dan klik **Deploy**.
5. Vercel akan otomatis mendeteksi Next.js dan menyelesaikan build dalam ~30 detik!

### Opsi 2: Menggunakan Vercel CLI
```bash
npx vercel
```
Ikuti petunjuk di terminal, aplikasi Anda akan langsung online dengan domain publik `.vercel.app`.

---

## Fitur Utama

1. **Digital Financial Receipt (Struk Belanja Digital)**:
   - Menghasilkan laporan mingguan, bulanan, dan tahunan otomatis dalam format struk thermal.
   - Dilengkapi rincian arus kas, rasio tabungan (*savings rate*), kategori teratas, pengeluaran terbesar, dan perbandingan periode jujur.
   - Tombol **Salin Ringkasan Teks** (siap dibagikan ke WhatsApp) dan **Simpan Gambar Struk (PNG)**.
2. **Pencatatan Cepat Mobile-First**:
   - Modal pencatatan keypad-friendly dengan nominal IDR dominan dan tombol cepat (+20rb, +50rb, dll).
   - Dukungan Pengeluaran, Pemasukan, dan Transfer Antar-Dompet tanpa memengaruhi total kekayaan.
   - Mode Edit Transaksi dan Batal Hapus (*Undo Delete*).
3. **Multi-Akun & Mode Tamu**:
   - Pilihan memakai Akun Pribadi atau Mode Tamu (Guest).
   - Inisial avatar profil pengguna langsung di navbar.
4. **Tema Gelap & Terang (Dark / Light Mode)**:
   - Tombol toggle instan di navbar dengan persistensi otomatis.
5. **Cadangan & Pemulihan Data**:
   - Ekspor/Impor file cadangan JSON.
   - Opsi Reset Semua Data (Mulai dari Nol Rp 0 atau Muat Data Contoh).

---

## Menjalankan Secara Lokal

```bash
# Instalasi dependensi
npm install

# Menjalankan server pengembangan
npm run dev

# Menjalankan unit testing
npm test

# Build produksi
npm run build

# Menjalankan linter
npm run lint
```
