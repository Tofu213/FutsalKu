# FutsalKu — Sistem Informasi Penyewaan Lapangan Futsal

Aplikasi full-stack (Next.js App Router + Prisma + PostgreSQL) untuk proyek
penyewaan lapangan futsal (APB/P3L). Mengimplementasikan sebagian besar
Functional Requirements (FR-01 s.d. FR-15) yang sudah dirancang sebelumnya,
termasuk pencegahan double booking (FR-15) lewat kolom unik di
database.

## Pemetaan ke Model OOAD (Laporan UTS Bab 6)

| Use case | Implementasi |
|---|---|
| UC-01 Registrasi Akun | `/api/auth/register`; login (`/api/auth/login`) menjadi prakondisi use case lain; peran `OWNER` / `KASIR` / `PELANGGAN` |
| UC-02 Lihat Ketersediaan Jadwal | `/api/ketersediaan` (booking aktif + slot yang diblokir) |
| UC-03 Booking Lapangan | `POST /api/booking` (booking online berstatus Menunggu Pembayaran dan slot langsung dikunci; Kasir/Owner mengonfirmasi DP lewat `PATCH /api/booking/[id]` aksi `konfirmasi_dp` sebelum batas 2 jam, DP = persentase di tabel `Pengaturan`, tercatat sebagai `Pembayaran` jenis DP; booking yang melewati batas dibatalkan otomatis dan slot dilepas) |
| UC-05 Nota | `GET /api/booking/[id]` dan halaman `/nota/[id]` (nota digital yang dapat dicetak) |
| UC-04 Batalkan Booking | `PATCH /api/booking/[id]` aksi `batal` (hanya Menunggu Pembayaran/Terkonfirmasi dan sebelum jam main dimulai; slot dilepas; perlakuan DP sesuai aturan Owner) |
| UC-05 Catat Pelunasan dan Terbitkan Nota | booking walk-in lewat `POST /api/booking` oleh Kasir/Owner, lalu `POST /api/booking/[id]/pelunasan` (validasi nominal = sisa tagihan, status Lunas, nota `NT-YYYYMMDD-0001`) |
| UC-06 Kelola Lapangan dan Jadwal | `/api/lapangan` (+ `[id]` ubah harga/nonaktifkan), `/api/blokir` (tolak jika slot sudah dibooking) |
| UC-07 Lihat Laporan Pendapatan | `GET /api/laporan?periode=harian|bulanan&tanggal=YYYY-MM-DD` (hanya Owner) |

Tabel: `User`, `Lapangan`, `Booking`, `SlotBooking`, `Pembayaran`, `Nota`, `JadwalBlokir`, `Pengaturan`.
Kelas `LaporanPendapatan` pada class diagram dihitung dari `Pembayaran`, bukan tabel.

Pencegahan double booking: pengecekan di aplikasi + unique `(lapanganId, tanggal, jam)` pada
`SlotBooking` (satu baris per jam, sehingga booking multi-jam ikut terlindungi). Baris slot
dihapus saat booking dibatalkan.

Belum dimodelkan pada fase UTS (iterasi berikutnya): riwayat lanjutan, diskon manual, log aktivitas,
sewa alat dan stok.

## Cara Menjalankan

Prasyarat: Node.js 18+ dan server PostgreSQL yang berjalan (instalasi lokal, atau Docker:
`docker run --name futsal-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16`).

```bash
# 1. Buat database kosong (lewat pgAdmin atau psql)
#    CREATE DATABASE futsalku;

# 2. Sesuaikan DATABASE_URL di file .env, format:
#    postgresql://USER:PASSWORD@HOST:5432/NAMA_DB?schema=public
#    (contoh Docker di atas: postgresql://postgres:postgres@localhost:5432/futsalku?schema=public)

# 3. Install dependency
npm install

# 4. Buat tabel-tabel di PostgreSQL sesuai schema.prisma (sekaligus generate Prisma Client)
npx prisma migrate dev --name init

# 5. Isi data awal (akun demo Owner/Kasir + 3 lapangan contoh)
npm run seed

# 6. Jalankan server pengembangan
npm run dev
```

Buka http://localhost:3000. Untuk melihat isi database lewat GUI: `npx prisma studio`.

> **Pindah dari MySQL / versi sebelumnya:** hapus folder `prisma/migrations` lama (jika ada) karena migrasi MySQL tidak kompatibel dengan PostgreSQL, lalu jalankan `npx prisma migrate dev --name init` pada database PostgreSQL yang baru.
>
> **Memperbarui dari versi sebelumnya:** skema berubah besar (enum `PENYEWA` menjadi `PELANGGAN`,
> kolom `slotKey` dan `metodeBayar` dihapus, tabel baru). Pada database pengembangan yang sudah
> pernah di-migrate, jalankan `npx prisma migrate reset` (menghapus semua data lalu membuat ulang
> dan menjalankan seed), atau hapus folder `prisma/migrations` dan database lalu ulangi langkah 1-5.

Setiap kali mengubah `prisma/schema.prisma`, jalankan lagi
`npx prisma migrate dev --name nama_perubahan`.

### Akun Demo (setelah `npm run seed`)

| Peran | No. HP | Password |
|---|---|---|
| Owner | 081200000001 | owner123 |
| Kasir | 081200000002 | kasir123 |

Akun **Penyewa** dibuat sendiri lewat halaman **Daftar**.

## Struktur Proyek

```
app/
  page.js                 -> Beranda (daftar lapangan)
  login/, register/       -> Autentikasi
  booking/                -> Form booking + kalender ketersediaan
  riwayat/                -> Riwayat booking penyewa
  admin/                  -> Dashboard Owner/Kasir
  api/
    auth/                 -> register, login, logout, me
    lapangan/             -> GET daftar lapangan, POST tambah (Owner)
    ketersediaan/         -> GET slot jam yang sudah terisi
    booking/              -> GET/POST booking, PATCH ubah status
lib/
  prisma.js               -> Prisma client singleton
  auth.js                 -> Helper sesi login (JWT + cookie)
prisma/
  schema.prisma           -> Skema database
  seed.js                 -> Data awal (akun demo + lapangan)
middleware.js             -> Proteksi rute /booking, /riwayat, /admin
```

## Catatan Keamanan untuk Pengembangan Lanjutan

- Ganti `JWT_SECRET` di file `.env` dengan string acak yang panjang sebelum
  di-deploy ke produksi (lihat NFR-02).
- Ingin pindah ke PostgreSQL? Ganti `provider` menjadi `"postgresql"` di
  `schema.prisma` dan ubah `DATABASE_URL`, lalu jalankan ulang migrasi.
- Pengecekan bentrok untuk booking multi-jam dilakukan di aplikasi; kolom unik
  hanya menjaga jam mulai. Untuk beban tinggi, pertimbangkan tabel slot per jam.
- Integrasi payment gateway sungguhan (QRIS/e-wallet) belum ditambahkan;
  saat ini pembayaran DP hanya dicatat statusnya, belum diverifikasi oleh
  pihak ketiga.
