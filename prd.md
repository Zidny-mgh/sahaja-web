# Project Requirement Document (PRD)
# Totok Punggung Sahaja — Platform Booking Online Terapi (Versi MVP)

| Atribut | Keterangan |
|---|---|
| Dokumen | Project Requirement Document (PRD) |
| Versi | 1.0 — MVP |
| Disusun oleh | System Architect |
| Status | Draft untuk Development |

---

## Daftar Isi
1. [Project Overview & Scope](#1-project-overview--scope)
2. [Tech Stack & UI/UX Guidelines](#2-tech-stack--uiux-guidelines)
3. [Database Schema (Prisma Models)](#3-database-schema-prisma-models)
4. [Core Features & Requirements](#4-core-features--requirements)
5. [User Flow](#5-user-flow)
6. [API Endpoints Plan](#6-api-endpoints-plan)

---

## 1. Project Overview & Scope

### 1.1 Latar Belakang
"Totok Punggung Sahaja" adalah platform digital untuk layanan terapi totok punggung berbasis kunjungan (home-service). Platform ini memungkinkan pasien melakukan booking jadwal terapi secara online, melakukan pembayaran digital (QRIS), serta memantau riwayat dan perkembangan terapi mereka. Admin menggunakan platform ini sebagai pusat kendali operasional: konfirmasi booking, penugasan terapis, serta pengelolaan konten landing page.

### 1.2 Tujuan Produk (Goals)
- Menyediakan kanal booking online yang mudah, cepat, dan tanpa friksi (tanpa OTP) bagi pasien.
- Mengotomasi proses pembayaran melalui QRIS Dinamis agar status booking dapat diproses lebih cepat oleh Admin.
- Memberikan Admin satu dashboard terpusat untuk mengelola seluruh operasional: pasien, jadwal, terapis, produk herbal, konten edukasi, dan testimoni.
- Membangun fondasi data (database) yang sudah siap untuk fitur **Dashboard Terapis** di fase berikutnya, tanpa perlu migrasi struktural besar.

### 1.3 Scope MVP — In Scope
- Landing page publik (tanpa login) lengkap dengan profil, layanan, testimoni, artikel, dan kontak.
- Registrasi & login Pasien menggunakan Nomor Telepon + Password (tanpa OTP).
- Dashboard Pasien: profil, jadwal aktif, riwayat terapi, ulasan.
- Sistem booking dengan validasi bentrok jadwal (4 slot jam tetap per hari).
- Checkout dengan add-on Produk Herbal.
- Pembayaran via Payment Gateway QRIS Dinamis.
- Reschedule mandiri oleh pasien dengan batasan bisnis (maks. H-1, maks. 2x, dilarang di hari-H).
- Dashboard Admin (Super Admin) untuk seluruh manajemen data operasional & konten.
- Notifikasi email otomatis ke Admin saat ada booking baru yang sudah dibayar.

### 1.4 Scope MVP — Out of Scope (Tidak Dibangun di MVP)
- **Dashboard & Login Terapis** — terapis belum memiliki akun/akses sistem. Data terapis hanya dikelola oleh Admin (sebagai master data untuk penugasan).
- Sistem OTP / verifikasi nomor telepon.
- Multi-cabang / multi-lokasi.
- Sistem refund otomatis.
- Aplikasi mobile native (Android/iOS).
- Live chat in-app (digantikan oleh Floating Button WhatsApp ke CS).

> **Catatan Arsitektur:** Karena Dashboard Terapis termasuk roadmap fase berikutnya, model `Therapist` pada database **sengaja dirancang independen** (bukan extend dari `User`) sehingga penambahan kredensial login (email/password/role) untuk terapis nantinya tidak memerlukan migrasi data yang merusak relasi `Booking` yang sudah ada.

### 1.5 User Roles (MVP)

| Role | Akses | Login |
|---|---|---|
| **Guest** | Landing page, lihat layanan/produk/artikel/testimoni publik | Tidak perlu |
| **Pasien** | Dashboard pasien, booking, checkout, pembayaran, reschedule, ulasan | Wajib (Nomor Telepon + Password) |
| **Admin (Super Admin)** | Seluruh manajemen data & operasional | Wajib (kredensial terpisah, dibuat manual/seed, bukan via halaman register publik) |

### 1.6 Asumsi & Batasan
- Satu Admin bersifat *Super Admin* — MVP tidak membutuhkan level admin bertingkat (sub-role admin tidak dibahas di versi ini).
- Pembayaran hanya QRIS Dinamis (tidak ada transfer manual/COD pada MVP).
- Semua harga dalam mata uang Rupiah (IDR).
- Jam operasional layanan tetap: **08.00, 10.00, 12.00, 14.00**.

---

## 2. Tech Stack & UI/UX Guidelines

### 2.1 Tech Stack

| Layer | Teknologi | Catatan |
|---|---|---|
| Front-End | React + Vite + Tailwind CSS | SPA, konsumsi REST API |
| Back-End | Node.js + Express.js | Arsitektur layered (Controller–Service–Repository) |
| ORM | Prisma ORM | Migration-first, type-safe query |
| Database | PostgreSQL | Relational, mendukung enum & decimal precision untuk harga |
| Auth | JWT (Access Token + Refresh Token) | Disimpan via httpOnly cookie |
| Payment Gateway | QRIS Dinamis (mis. Midtrans/Xendit — disesuaikan saat implementasi) | Callback/webhook untuk update status pembayaran |
| Email Service | SMTP / transactional email provider (mis. Nodemailer + provider SMTP) | Notifikasi booking baru ke Admin |
| Deployment | Docploy (containerized) | Struktur disiapkan agar mudah di-refactor ke Docker Compose multiservice (FE container, BE container, DB container, reverse proxy) |

### 2.2 Prinsip Arsitektur Back-End
- **Monolith modular** di MVP (satu service Express), namun folder structure dipisah per domain (`auth`, `patients`, `bookings`, `payments`, `products`, `admin`, dll.) agar mudah dipecah menjadi microservices saat scaling.
- Environment variables terpusat di `.env`, dengan `docker-compose.yml` MVP minimal (app + db) yang nantinya dapat ditambah service baru (mis. `worker`, `notification-service`) tanpa mengubah skema database.
- Validasi input di layer Controller (mis. menggunakan Zod/Joi), business rule di layer Service.

### 2.3 Gaya Desain (Design Language)
**Tema:** Modern, Terpercaya (Trustworthy), Sehat (Healthy & Calming).

### 2.4 Color Palette (Wajib — Tidak Boleh Ditambah Warna Lain)

| Nama | Hex Code | Penggunaan |
|---|---|---|
| Primary / Dark Green | `#778873` | Tombol utama (CTA), navbar, heading penting, ikon aktif |
| Secondary / Light Green | `#A1BC98` | Hover state, badge status positif, elemen sekunder |
| Accent / Beige | `#DCCFC0` | Border, card background alternatif, divider, highlight lembut |
| Background / Off-White | `#FDF6ED` | Background utama halaman (body) |

**Panduan penerapan:**
- Teks body menggunakan warna gelap netral (mis. abu-abu gelap) di atas `#FDF6ED` agar kontras tetap nyaman dibaca — bukan warna hitam pekat agar tetap terasa "sehat & lembut".
- Tombol primer (CTA seperti "Booking Sekarang") selalu menggunakan `#778873` dengan teks putih.
- Status "Lunas" / "Selesai" menggunakan aksen `#A1BC98`; status "Dibatalkan" tetap memakai warna netral merah-muda yang **hanya dipakai sebagai indikator status**, bukan elemen UI utama (agar tidak melanggar batasan 4 warna palette untuk komponen non-status).
- Gunakan Tailwind config custom (`tailwind.config.js`) untuk mendaftarkan 4 warna ini sebagai token (`primary`, `secondary`, `accent`, `background`) sehingga tim FE tidak menulis hex code manual di komponen.

### 2.5 Tipografi & Komponen
- Font: sans-serif modern yang clean (mis. Inter / Poppins) — disarankan menggunakan satu jenis font untuk heading & body agar terasa konsisten dan tepercaya.
- Rounded corners pada card & tombol (kesan ramah, "sehat", tidak kaku).
- Gunakan ilustrasi/foto dengan nuansa hangat (beige & hijau natural) konsisten dengan tema kesehatan tradisional.
- Komponen reusable wajib: `Button`, `Card`, `Modal/Popup` (untuk detail produk herbal), `Calendar Picker`, `Status Badge`, `Floating WhatsApp Button`.

---

## 3. Database Schema (Prisma Models)

### 3.1 Ringkasan Relasi Utama
- `User` (role `PASIEN` atau `ADMIN`) — satu pasien dapat memiliki banyak `Booking`, `Review`, dan `TherapyProgress`.
- `Therapist` — master data independen (belum punya login), direlasikan ke `Booking` sebagai penugasan (assignment).
- `Booking` adalah entitas pusat: terhubung ke `User` (pasien), `Service`, `Therapist` (opsional/nullable sampai ditugaskan), `Payment` (1:1), `BookingProduct` (1:N, untuk add-on produk herbal), `Review` (1:1), `TherapyProgress` (1:1), dan `RescheduleHistory` (1:N).
- `Product` (Produk Herbal) terhubung many-to-many ke `Booking` melalui tabel pivot `BookingProduct`.
- `CompanyProfile`, `Article` digunakan untuk konten landing page yang dikelola Admin.

### 3.2 Prisma Schema Lengkap

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// =========================================
// ENUMS
// =========================================

enum Role {
  PASIEN
  ADMIN
}

enum Gender {
  LAKI_LAKI
  PEREMPUAN
}

// Status perjalanan booking (terpisah dari status pembayaran)
enum BookingStatus {
  MENUNGGU_PEMBAYARAN
  MENUNGGU_KONFIRMASI_ADMIN
  TERAPIS_DITUGASKAN
  DALAM_PERJALANAN
  SELESAI
  DIBATALKAN
}

// Status pembayaran — disimpan TERPISAH dari BookingStatus
enum PaymentStatus {
  PENDING
  PAID
  FAILED
  EXPIRED
}

enum PaymentMethod {
  QRIS
}

enum TimeSlot {
  JAM_08_00
  JAM_10_00
  JAM_12_00
  JAM_14_00
}

// =========================================
// USER & THERAPIST
// =========================================

model User {
  id                String   @id @default(uuid())
  fullName          String
  phoneNumber       String   @unique   // ID unik utama untuk login
  password          String              // hashed (bcrypt/argon2)
  role              Role     @default(PASIEN)

  // Data profil tambahan (diisi pasien setelah register)
  birthDate         DateTime?
  gender            Gender?
  mainAddress       String?
  isProfileComplete Boolean  @default(false)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  bookings          Booking[]
  reviews           Review[]
  progressAsPatient TherapyProgress[] @relation("ProgressPatient")
  progressAsAuthor  TherapyProgress[] @relation("ProgressAuthorAdmin")

  @@index([role])
}

// Master data terapis — BELUM punya akses login di MVP.
// Disiapkan agar di fase berikutnya tinggal ditambahkan field auth
// (email, password, role) tanpa mengubah relasi ke Booking.
model Therapist {
  id          String   @id @default(uuid())
  fullName    String
  phoneNumber String?
  photoUrl    String?
  isActive    Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  bookings    Booking[]
}

// =========================================
// SERVICE & PRODUCT (Add-on Herbal)
// =========================================

model Service {
  id          String   @id @default(uuid())
  name        String
  description String?
  price       Decimal  @db.Decimal(12, 2)
  durationMin Int?     // estimasi durasi terapi (menit)
  isActive    Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  bookings    Booking[]
}

model Product {
  id          String   @id @default(uuid())
  name        String
  price       Decimal  @db.Decimal(12, 2)
  photoUrl    String?
  benefits    String?  @db.Text // manfaat
  composition String?  @db.Text // komposisi
  usageGuide  String?  @db.Text // cara pakai
  isActive    Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  bookingProducts BookingProduct[]
}

// =========================================
// BOOKING (Entitas Pusat)
// =========================================

model Booking {
  id              String        @id @default(uuid())
  bookingCode     String        @unique // kode booking yang readable, mis. TPS-20260620-0001

  patientId       String
  patient         User          @relation(fields: [patientId], references: [id])

  serviceId       String
  service         Service       @relation(fields: [serviceId], references: [id])

  therapistId     String?
  therapist       Therapist?    @relation(fields: [therapistId], references: [id])

  // Jadwal
  scheduledDate   DateTime      @db.Date
  scheduledTime   TimeSlot

  // Alamat terapi bisa berbeda dari alamat utama profil (diisi saat checkout)
  therapyAddress  String

  // Status (dipisah dari status pembayaran)
  status          BookingStatus @default(MENUNGGU_PEMBAYARAN)

  // Aturan reschedule: maks 2x, maks H-1, dilarang di hari-H
  rescheduleCount Int           @default(0)

  // Snapshot harga saat checkout (agar histori tidak berubah jika harga master berubah di kemudian hari)
  servicePriceSnapshot   Decimal @db.Decimal(12, 2)
  productsTotalSnapshot  Decimal @db.Decimal(12, 2) @default(0)
  totalAmount            Decimal @db.Decimal(12, 2)

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  bookingProducts     BookingProduct[]
  payment             Payment?
  review              Review?
  therapyProgress     TherapyProgress?
  rescheduleHistories RescheduleHistory[]

  // Mencegah bentrok jadwal: kombinasi tanggal + jam tidak boleh dipakai 2x
  // untuk booking yang masih aktif (divalidasi juga di level Service/Business Logic
  // karena partial-unique constraint butuh penanganan khusus terhadap status DIBATALKAN).
  @@index([scheduledDate, scheduledTime, status])
  @@index([patientId])
}

model RescheduleHistory {
  id        String   @id @default(uuid())
  bookingId String
  booking   Booking  @relation(fields: [bookingId], references: [id])

  oldDate   DateTime @db.Date
  oldTime   TimeSlot
  newDate   DateTime @db.Date
  newTime   TimeSlot

  createdAt DateTime @default(now())
}

// Pivot table: Booking <-> Product (many-to-many dengan data tambahan)
model BookingProduct {
  id              String  @id @default(uuid())
  bookingId       String
  booking         Booking @relation(fields: [bookingId], references: [id])
  productId       String
  product         Product @relation(fields: [productId], references: [id])

  quantity        Int     @default(1)
  priceAtPurchase Decimal @db.Decimal(12, 2) // snapshot harga saat ditambahkan

  @@unique([bookingId, productId])
}

// =========================================
// PAYMENT
// =========================================

model Payment {
  id              String        @id @default(uuid())
  bookingId       String        @unique
  booking         Booking       @relation(fields: [bookingId], references: [id])

  amount          Decimal       @db.Decimal(12, 2)
  method          PaymentMethod @default(QRIS)
  status          PaymentStatus @default(PENDING)

  qrisReferenceId String?       // reference ID dari payment gateway
  qrisUrl         String?       // URL/string QR untuk ditampilkan ke pasien
  paidAt          DateTime?
  expiredAt       DateTime?

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

// =========================================
// REVIEW & THERAPY PROGRESS
// =========================================

model Review {
  id               String   @id @default(uuid())
  bookingId        String   @unique
  booking          Booking  @relation(fields: [bookingId], references: [id])

  patientId        String
  patient          User     @relation(fields: [patientId], references: [id])

  rating           Int      // 1–5
  comment          String?  @db.Text
  isShownOnLanding Boolean  @default(false) // dikurasi Admin untuk tampil di landing page

  createdAt        DateTime @default(now())
}

// Catatan perkembangan — diinput Admin berdasarkan laporan offline terapis,
// lalu tampil di Dashboard Pasien (Riwayat Terapi).
model TherapyProgress {
  id        String   @id @default(uuid())
  bookingId String   @unique
  booking   Booking  @relation(fields: [bookingId], references: [id])

  patientId String
  patient   User     @relation("ProgressPatient", fields: [patientId], references: [id])

  adminId   String
  admin     User     @relation("ProgressAuthorAdmin", fields: [adminId], references: [id])

  notes     String   @db.Text

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// =========================================
// CONTENT MANAGEMENT (Landing Page)
// =========================================

model Article {
  id          String   @id @default(uuid())
  title       String
  slug        String   @unique
  coverImage  String?
  content     String   @db.Text
  isPublished Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Singleton table (selalu hanya 1 row) untuk konten landing page & profil perusahaan
model CompanyProfile {
  id             String   @id @default(uuid())
  logoUrl        String?
  slogan         String?
  aboutText      String?  @db.Text
  heroImage      String?
  address        String?
  openingHours   String?
  phoneNumber    String?
  whatsappNumber String?  // nomor tujuan Floating WhatsApp Button
  email          String?
  instagramUrl   String?
  facebookUrl    String?
  tiktokUrl      String?

  updatedAt      DateTime @updatedAt
}
```

### 3.3 Catatan Desain Skema
| Keputusan Desain | Alasan |
|---|---|
| `phoneNumber` di-`@unique` pada `User` | Sesuai requirement: nomor telepon adalah ID unik utama, tidak boleh duplikat |
| `Therapist` terpisah dari `User` | Belum ada login terapis di MVP; menghindari kolom auth kosong/nullable yang mengotori model `User` |
| `status` (Booking) dan `Payment.status` dipisah | Sesuai requirement eksplisit — status booking & status pembayaran disimpan di field/tabel berbeda |
| `servicePriceSnapshot`, `productsTotalSnapshot`, `priceAtPurchase` | Mencegah histori transaksi berubah jika Admin mengubah harga master Service/Product di kemudian hari |
| `RescheduleHistory` sebagai tabel terpisah | Audit trail lengkap untuk validasi aturan "maksimal 2x reschedule" dan transparansi riwayat perubahan jadwal |
| `bookingCode` unik (human-readable) | Memudahkan komunikasi (CS/WhatsApp) dibanding UUID panjang |
| `CompanyProfile` sebagai singleton | Konten landing page (profil, kontak, jam buka) cukup 1 baris data yang terus di-update Admin |

---

## 4. Core Features & Requirements

### 4.1 Landing Page (Publik — Tanpa Login)

**Front-End**
- Hero Section: logo, slogan, dan tombol CTA "Booking Sekarang" (redirect ke login jika belum login, atau langsung ke flow booking jika sudah login).
- Section profil singkat perusahaan + galeri foto kegiatan (data dari `CompanyProfile`).
- Section testimoni pasien (data dari `Review` dengan `isShownOnLanding = true`).
- Section informasi layanan (`Service`), keunggulan, dan artikel edukasi (`Article` dengan `isPublished = true`).
- Footer: alamat, jam buka, kontak, sosial media (dari `CompanyProfile`).
- Floating Button WhatsApp pojok kanan bawah, selalu tampil di seluruh halaman publik, mengarah ke `https://wa.me/<whatsappNumber>` dari `CompanyProfile`.

**Back-End**
- Endpoint publik (tanpa auth) untuk mengambil data `CompanyProfile`, `Service` aktif, `Product` aktif, `Article` published, dan `Review` yang dikurasi.
- Tidak ada operasi tulis dari sisi publik pada modul ini.

### 4.2 Sistem Akun & Autentikasi Pasien

**Front-End**
- Form Register: Nama Lengkap, Nomor Telepon, Password (+ konfirmasi password).
- Form Login: Nomor Telepon + Password.
- Validasi client-side: format nomor telepon, password minimum length.

**Back-End**
- Register: validasi nomor telepon belum terdaftar → hash password (bcrypt) → buat `User` dengan `role = PASIEN` → akun langsung aktif (**tanpa OTP**) → terbitkan JWT.
- Login: validasi kredensial → terbitkan Access Token (short-lived) + Refresh Token (httpOnly cookie).
- Admin **tidak** dibuat melalui halaman register publik — akun Admin dibuat lewat seeding/migration awal atau endpoint khusus yang dilindungi.

### 4.3 Dashboard Pasien (Login Wajib)

**Menu Profil**
- Pasien dapat mengubah: Tanggal Lahir, Jenis Kelamin, Alamat Utama, Nomor Telepon.
- Back-end menghitung `isProfileComplete` (true jika `birthDate`, `gender`, `mainAddress` semua terisi).
- **Business rule:** Front-end men-disable tombol "Booking Sekarang" (state `disabled`, bukan disembunyikan, agar pasien tahu kenapa) jika `isProfileComplete = false`, dengan pesan arahan untuk melengkapi profil dahulu.
- Menampilkan ringkasan: total terapi selesai (`COUNT(Booking WHERE status = SELESAI)`) dan catatan perkembangan terakhir (`TherapyProgress` terbaru).

**Menu Jadwal Terapi (Aktif)**
- Menampilkan booking dengan status selain `SELESAI` dan `DIBATALKAN`: nama layanan, tanggal, jam, status booking (badge berwarna).
- Tombol "Beri Ulasan" hanya muncul/aktif jika `status = SELESAI` dan booking tersebut belum memiliki `Review`.
- Tombol "Reschedule" mengikuti aturan bisnis (lihat 4.4).

**Menu Riwayat Terapi**
- Menampilkan booking dengan `status = SELESAI` atau `DIBATALKAN`.
- Menampilkan `TherapyProgress.notes` terkait (catatan perkembangan dari Admin) jika ada.

### 4.4 Sistem Booking & Checkout

**Pemilihan Jadwal**
- Front-end: Calendar Picker untuk memilih tanggal (tidak boleh memilih tanggal lampau).
- Pilihan jam dibatasi tepat 4 opsi: **08.00, 10.00, 12.00, 14.00**.
- Back-end wajib melakukan validasi bentrok jadwal: query `Booking` dengan kombinasi `scheduledDate` + `scheduledTime` yang sama dan `status` masih aktif (bukan `DIBATALKAN`); jika sudah terisi, slot tersebut tidak boleh dipilih lagi (di-disable di FE berdasarkan response endpoint availability, dan divalidasi ulang di BE saat submit untuk mencegah race condition).

**Halaman Checkout**
- Menampilkan: ringkasan data diri pasien, alamat terapi (default dari `mainAddress`, tapi bisa diubah khusus untuk booking ini → disimpan di `Booking.therapyAddress`, tidak menimpa profil pasien), ringkasan layanan & harga, total pembayaran.
- **Slider Add-on Product (Produk Herbal):**
  - Menampilkan kartu produk: Foto, Nama, Harga.
  - Klik kartu → pop-up/modal detail: manfaat, komposisi, cara pakai.
  - Tombol "Tambah" di dalam pop-up → menambahkan produk ke pesanan (`BookingProduct`), update total pembayaran secara real-time di FE.
- Total pembayaran = `servicePriceSnapshot + productsTotalSnapshot`.

**Status Booking & Payment (Wajib Dipisah di Database)**

| Status Booking | Kapan Terjadi |
|---|---|
| `MENUNGGU_PEMBAYARAN` | Booking dibuat, menunggu pasien menyelesaikan pembayaran QRIS |
| `MENUNGGU_KONFIRMASI_ADMIN` | Pembayaran sukses (`Payment.status = PAID`), menunggu Admin memproses |
| `TERAPIS_DITUGASKAN` | Admin sudah memilih & menugaskan `Therapist` |
| `DALAM_PERJALANAN` | Admin update manual saat terapis berangkat |
| `SELESAI` | Terapi selesai dilaksanakan |
| `DIBATALKAN` | Dibatalkan oleh Admin (atau otomatis jika `Payment` expired) |

| Status Pembayaran | Kapan Terjadi |
|---|---|
| `PENDING` | QRIS dibuat, menunggu pembayaran |
| `PAID` | Pembayaran berhasil dikonfirmasi gateway |
| `FAILED` | Pembayaran gagal |
| `EXPIRED` | QRIS kedaluwarsa tanpa pembayaran |

**Aturan Reschedule (Mandiri oleh Pasien)**
- Maksimal dilakukan **H-1** sebelum jadwal (tidak boleh reschedule di hari-H atau setelahnya).
- Maksimal **2 kali** per booking (`rescheduleCount < 2`).
- Setiap reschedule: validasi ulang bentrok jadwal pada slot baru, catat ke `RescheduleHistory`, increment `rescheduleCount`, update `scheduledDate`/`scheduledTime` pada `Booking`.

### 4.5 Sistem Pembayaran
- Integrasi Payment Gateway untuk **QRIS Dinamis** (nominal mengikuti total checkout, generate per transaksi).
- Alur: Checkout → Back-end create `Payment` (`status = PENDING`) → request QRIS ke gateway → FE menampilkan QR code.
- Webhook/callback dari gateway → Back-end update `Payment.status = PAID` dan `paidAt`, lalu otomatis update `Booking.status = MENUNGGU_KONFIRMASI_ADMIN`.
- Setelah `Payment.status = PAID`, sistem mengirim **Email Notifikasi otomatis ke Admin** berisi ringkasan booking baru yang perlu diproses.
- Jika QRIS kedaluwarsa tanpa pembayaran → `Payment.status = EXPIRED`, dan `Booking.status` otomatis menjadi `DIBATALKAN`.

### 4.6 Dashboard Admin (Super Admin)

**Ringkasan Operasional (Dashboard Home)**
- Total pasien terdaftar.
- Jumlah booking: belum diproses (`MENUNGGU_KONFIRMASI_ADMIN`), sedang berjalan (`TERAPIS_DITUGASKAN` + `DALAM_PERJALANAN`), selesai.
- Pendapatan harian/bulanan (agregasi `totalAmount` dari `Booking` dengan `Payment.status = PAID`, dikelompokkan per tanggal/bulan).
- Statistik bisnis tambahan: layanan terlaris, produk herbal terlaris (opsional chart di FE).

**Manajemen Data**

| Modul | Operasi |
|---|---|
| Pasien | Lihat daftar & detail pasien beserta histori booking (read-only — tidak ada create/delete pasien oleh Admin di MVP) |
| Booking | Lihat semua booking, filter per status, ubah status, tugaskan terapis |
| Jadwal | Lihat kalender keseluruhan booking (read view lintas pasien untuk menghindari bentrok operasional) |
| Artikel | CRUD penuh |
| Produk Herbal | CRUD penuh (nama, harga, foto, manfaat, komposisi, cara pakai, status aktif) |
| Testimoni | Lihat semua review, toggle `isShownOnLanding` |
| Landing Page / Profil Perusahaan | Update `CompanyProfile` (logo, slogan, about, hero image, kontak, sosmed, jam buka) |
| Terapis | CRUD master data terapis (nama, nomor telepon, foto, status aktif) — **tanpa pembuatan akun login** |

**Penugasan & Update Status**
- Admin dapat mengubah `Booking.status` secara manual mengikuti urutan bisnis yang valid (mis. tidak bisa lompat dari `MENUNGGU_KONFIRMASI_ADMIN` langsung ke `SELESAI` tanpa melalui `TERAPIS_DITUGASKAN`).
- Admin memilih satu `Therapist` aktif untuk ditugaskan pada booking (`Booking.therapistId`), yang otomatis mengubah `status` menjadi `TERAPIS_DITUGASKAN`.

**Input Hasil Terapi (Catatan Perkembangan)**
- Setelah booking berstatus `SELESAI`, Admin menginput laporan hasil terapi (berdasarkan laporan offline dari terapis) ke dalam `TherapyProgress.notes`.
- Catatan ini otomatis tampil di Dashboard Pasien pada bagian Riwayat Terapi & ringkasan profil.

---

## 5. User Flow

### 5.1 Flow Registrasi & Login Pasien
```
[Landing Page] 
   → klik "Booking Sekarang" / "Masuk"
   → [Pilih: Daftar / Masuk]

DAFTAR:
   → Isi Nama Lengkap, No. Telepon, Password
   → Submit → Validasi No. Telepon unik
   → Akun langsung aktif (tanpa OTP) → Auto-login
   → Redirect ke Dashboard Pasien

MASUK:
   → Isi No. Telepon + Password
   → Submit → Validasi kredensial
   → Redirect ke Dashboard Pasien
```

### 5.2 Flow Booking & Checkout (Pasien)
```
[Dashboard Pasien]
   → Cek isProfileComplete?
        ├─ Belum lengkap → Tombol "Booking" disabled
        │      → Arahkan ke Menu Profil untuk melengkapi data
        └─ Lengkap → Tombol "Booking" aktif
   → Pilih Layanan
   → Pilih Tanggal (Calendar) → Sistem tampilkan slot jam yang masih tersedia
   → Pilih Jam (08.00 / 10.00 / 12.00 / 14.00)
   → Lanjut ke Checkout
        → Konfirmasi/ubah alamat terapi
        → Lihat ringkasan layanan & harga
        → (Opsional) Buka Slider Produk Herbal
              → Klik produk → Pop-up detail (manfaat, komposisi, cara pakai)
              → Klik "Tambah" → Produk masuk ke pesanan, total ter-update
        → Klik "Bayar Sekarang"
   → Sistem generate QRIS Dinamis (Booking.status = MENUNGGU_PEMBAYARAN)
   → Pasien scan & bayar via aplikasi e-wallet/mobile banking
        ├─ Sukses → Payment.status = PAID, Booking.status = MENUNGGU_KONFIRMASI_ADMIN
        │      → Email notifikasi terkirim ke Admin
        │      → Pasien melihat status di Menu Jadwal Terapi
        └─ Expired/Gagal → Payment.status = EXPIRED/FAILED, Booking.status = DIBATALKAN
```

### 5.3 Flow Reschedule (Pasien)
```
[Menu Jadwal Terapi] → pilih booking aktif → klik "Reschedule"
   → Sistem cek: apakah H-1 atau lebih awal? apakah rescheduleCount < 2?
        ├─ Tidak memenuhi syarat → Tombol disabled + pesan alasan
        └─ Memenuhi syarat → Pilih tanggal & jam baru
              → Sistem validasi bentrok jadwal slot baru
              → Simpan ke RescheduleHistory, increment rescheduleCount
              → Update Booking.scheduledDate / scheduledTime
```

### 5.4 Flow Operasional Admin
```
[Dashboard Admin]
   → Lihat ringkasan operasional
   → Buka daftar Booking dengan status MENUNGGU_KONFIRMASI_ADMIN
   → Pilih booking → Tugaskan Terapis aktif
        → Booking.status = TERAPIS_DITUGASKAN
   → Saat terapis berangkat → update status = DALAM_PERJALANAN
   → Setelah terapi selesai dilaksanakan (offline)
        → update status = SELESAI
        → Input "Catatan Perkembangan" (TherapyProgress) berdasarkan laporan offline terapis
              → Otomatis tampil di Dashboard Pasien
```

### 5.5 Flow Ulasan (Pasien)
```
[Menu Jadwal Terapi] → booking dengan status SELESAI & belum ada Review
   → klik "Beri Ulasan" → isi rating + komentar → submit
   → Review tersimpan (isShownOnLanding = false by default)
   → Admin dapat mengkurasi & menampilkan ulasan terbaik di Landing Page
```

---

## 6. API Endpoints Plan

> Prefix seluruh endpoint: `/api/v1`. Endpoint bertanda 🔒 membutuhkan Access Token (JWT) Pasien; 🛡️ membutuhkan Access Token Admin.

### 6.1 Auth

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/auth/register` | Registrasi pasien (Nama, No. Telepon, Password) — tanpa OTP |
| POST | `/auth/login` | Login pasien atau admin (No. Telepon/identifier + Password) |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | 🔒 Logout, invalidasi refresh token |
| GET | `/auth/me` | 🔒 Ambil data akun yang sedang login |

### 6.2 Publik (Landing Page — Tanpa Auth)

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/public/company-profile` | Ambil profil perusahaan untuk landing page & footer |
| GET | `/public/services` | Daftar layanan aktif |
| GET | `/public/products` | Daftar produk herbal aktif (untuk preview, jika dibutuhkan di luar checkout) |
| GET | `/public/testimonials` | Daftar testimoni dengan `isShownOnLanding = true` |
| GET | `/public/articles` | Daftar artikel published |
| GET | `/public/articles/:slug` | Detail artikel berdasarkan slug |

### 6.3 Pasien — Profil & Dashboard

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/patients/me` | 🔒 Ambil data profil pasien yang login |
| PUT | `/patients/me` | 🔒 Update profil (Tanggal Lahir, Jenis Kelamin, Alamat Utama, No. Telepon) |
| GET | `/patients/me/summary` | 🔒 Ringkasan: total terapi selesai + catatan perkembangan terbaru |

### 6.4 Pasien — Booking

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/services` | 🔒 Daftar layanan aktif untuk dipilih saat booking |
| GET | `/bookings/availability?date=YYYY-MM-DD` | 🔒 Cek slot jam yang masih tersedia pada tanggal tertentu |
| POST | `/bookings` | 🔒 Buat booking baru (pilih layanan, tanggal, jam, alamat terapi) → `status = MENUNGGU_PEMBAYARAN` |
| GET | `/bookings` | 🔒 Daftar booking pasien (query `?type=active` atau `?type=history`) |
| GET | `/bookings/:id` | 🔒 Detail booking |
| PUT | `/bookings/:id/reschedule` | 🔒 Reschedule booking (validasi H-1, maks. 2x) |
| POST | `/bookings/:id/products` | 🔒 Tambah produk herbal (add-on) ke booking saat checkout |
| DELETE | `/bookings/:id/products/:productId` | 🔒 Hapus produk herbal dari pesanan sebelum pembayaran |

### 6.5 Pasien — Checkout & Pembayaran

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/bookings/:id/checkout` | 🔒 Finalisasi checkout: hitung total, generate `Payment` & QRIS Dinamis |
| GET | `/payments/:id/status` | 🔒 Polling status pembayaran terkini |
| POST | `/payments/webhook` | Callback dari Payment Gateway (divalidasi via signature, bukan oleh user) — update `Payment.status` & `Booking.status` |

### 6.6 Pasien — Ulasan

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/bookings/:id/review` | 🔒 Kirim ulasan (rating + komentar) untuk booking berstatus `SELESAI` |
| GET | `/bookings/:id/review` | 🔒 Lihat ulasan yang sudah diberikan untuk booking tertentu |

### 6.7 Admin — Dashboard & Statistik

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/admin/dashboard/summary` | 🛡️ Total pasien, booking per status, pendapatan harian/bulanan, statistik bisnis |

### 6.8 Admin — Manajemen Pasien

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/admin/patients` | 🛡️ Daftar pasien (pagination, search) |
| GET | `/admin/patients/:id` | 🛡️ Detail pasien + histori booking |

### 6.9 Admin — Manajemen Booking & Penugasan

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/admin/bookings` | 🛡️ Daftar seluruh booking (filter per status, tanggal) |
| GET | `/admin/bookings/:id` | 🛡️ Detail booking |
| PUT | `/admin/bookings/:id/status` | 🛡️ Update status booking secara manual (mengikuti alur status valid) |
| PUT | `/admin/bookings/:id/assign-therapist` | 🛡️ Pilih & tugaskan terapis untuk booking |
| POST | `/admin/bookings/:id/progress-note` | 🛡️ Input catatan perkembangan/hasil terapi (`TherapyProgress`) |

### 6.10 Admin — Master Data Terapis

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/admin/therapists` | 🛡️ Daftar terapis |
| POST | `/admin/therapists` | 🛡️ Tambah terapis baru |
| PUT | `/admin/therapists/:id` | 🛡️ Update data terapis |
| DELETE | `/admin/therapists/:id` | 🛡️ Nonaktifkan/hapus terapis |

### 6.11 Admin — Layanan & Produk Herbal

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET / POST | `/admin/services` | 🛡️ Daftar / tambah layanan |
| PUT / DELETE | `/admin/services/:id` | 🛡️ Update / nonaktifkan layanan |
| GET / POST | `/admin/products` | 🛡️ Daftar / tambah produk herbal |
| PUT / DELETE | `/admin/products/:id` | 🛡️ Update / nonaktifkan produk herbal |

### 6.12 Admin — Konten (Artikel, Testimoni, Landing Page)

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET / POST | `/admin/articles` | 🛡️ Daftar / tambah artikel |
| PUT / DELETE | `/admin/articles/:id` | 🛡️ Update / hapus artikel |
| GET | `/admin/testimonials` | 🛡️ Daftar seluruh ulasan pasien |
| PUT | `/admin/testimonials/:id` | 🛡️ Toggle `isShownOnLanding` |
| GET / PUT | `/admin/company-profile` | 🛡️ Lihat / update profil perusahaan & konten landing page |

---

*Dokumen ini merupakan acuan utama untuk tim development MVP "Totok Punggung Sahaja". Setiap penambahan fitur di luar scope yang tercantum (termasuk Dashboard Terapis) harus melalui proses change request terpisah pada fase berikutnya.*