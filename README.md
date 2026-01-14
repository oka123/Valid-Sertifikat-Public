# ValidSertifikat

**Sistem Pembuatan & Validasi Sertifikat Digital Berbasis Enkripsi AES-256**

ValidSertifikat adalah aplikasi berbasis web untuk **pembuatan sertifikat massal** dan **validasi keaslian sertifikat digital** secara aman menggunakan teknologi **enkripsi AES-256-CBC** yang terintegrasi dengan **QR Code**.

🔗 **Live Demo:** https://validsertifikat.site

---

## 📌 Daftar Isi

1. [Pendahuluan](#-pendahuluan)
2. [Fitur Utama](#-fitur-utama)
3. [Arsitektur Sistem](#-arsitektur-sistem)
4. [Panduan Instalasi](#-panduan-instalasi)
5. [Panduan Development](#-panduan-development)
6. [Panduan Penggunaan](#-panduan-penggunaan)
7. [Keamanan Sistem](#-keamanan-sistem)
8. [Kontribusi & Lisensi](#-kontribusi--lisensi)

---

## 📖 Pendahuluan

ValidSertifikat merupakan platform digital terpadu yang dirancang untuk mengotomatisasi **produksi sertifikat dalam jumlah besar** sekaligus menjamin **keaslian dan kredibilitas sertifikat** tersebut.

Aplikasi ini dikembangkan menggunakan teknologi **Web Components**, sehingga bersifat **modular, reusable, dan mudah diintegrasikan** ke berbagai website tanpa ketergantungan framework tertentu.

---

## 🚀 Fitur Utama

- 🔐 **Keamanan Tingkat Tinggi**
  Data peserta dienkripsi menggunakan algoritma **AES-256-CBC** dan disematkan langsung ke dalam QR Code.

- ⚡ **Pembuatan Sertifikat Massal**
  Mendukung _batch upload_ data peserta melalui file **Excel / CSV**.

- 🔍 **Validasi Multi-Metode**
  Sertifikat dapat diverifikasi melalui:

  - Kamera (QR Scanner)
  - Upload file (PDF / Gambar)
  - Paste gambar dari clipboard

- 🧩 **Web Component Modular**
  Dapat digunakan di berbagai website hanya dengan menyisipkan file JavaScript.

- 📧 **Pengiriman Email Otomatis**
  Sertifikat dikirim langsung ke email masing-masing peserta secara otomatis.

---

## 🏗️ Arsitektur Sistem

- **Frontend**

  - Web Components
  - Vite (Build Tool)
  - Vanilla JavaScript

- **Backend**

  - Node.js
  - API Gateway (Vercel Serverless)
  - Piscina (Thread Pool)
  - Nodemailer (Email Service)

- **Deployment**

  - Frontend: Static Build
  - Backend: Vercel Serverless Functions

---

## ⚙️ Panduan Instalasi

### 1️⃣ Frontend (Web Components)

Web component dapat digunakan **melalui CDN** atau **dipasang secara lokal** di server / project Anda.

---

## 🔹 Opsi A — Menggunakan CDN (Direkomendasikan)

Tambahkan script berikut ke dalam halaman HTML Anda.

### Generator Sertifikat

```html
<script src="https://cdn.jsdelivr.net/gh/oka123/Valid-Sertifikat-Public@main/FrontEnd/Generate/dist/validsertifikat-generate.js"></script>
<validsertifikat-generate></validsertifikat-generate>
```

### Validator Sertifikat

```html
<script src="https://cdn.jsdelivr.net/gh/oka123/Valid-Sertifikat-Public@main/FrontEnd/Validasi/dist/validsertifikat-validasi.js"></script>
<validsertifikat-validasi></validsertifikat-validasi>
```

---

## 🔹 Opsi B — Menggunakan File Lokal (Offline / Server Sendiri)

Opsi ini cocok jika:

* Aplikasi berjalan **tanpa internet**
* Ingin **kontrol penuh** atas file
* Menghindari ketergantungan CDN pihak ketiga

### 1️⃣ Unduh Repository

Clone repository ini:

```bash
git clone https://github.com/oka123/Valid-Sertifikat-Public.git
```

Atau unduh manual melalui tombol **Download ZIP** di GitHub.

---

### 2️⃣ Ambil File Build Web Component

Lokasi file yang dibutuhkan:

```text
Valid-Sertifikat-Public/
├── FrontEnd/
│   ├── Generate/
│   │   └── dist/
│   │       └── validsertifikat-generate.js
│   └── Validasi/
│       └── dist/
│           └── validsertifikat-validasi.js
```

Salin file `.js` tersebut ke folder project web Anda, contoh:

```text
public/
└── web-components/
    ├── validsertifikat-generate.js
    └── validsertifikat-validasi.js
```

---

### 3️⃣ Panggil Web Component di HTML

#### Generator Sertifikat

```html
<script src="./web-components/validsertifikat-generate.js"></script>
<validsertifikat-generate></validsertifikat-generate>
```

#### Validator Sertifikat

```html
<script src="./web-components/validsertifikat-validasi.js"></script>
<validsertifikat-validasi></validsertifikat-validasi>
```

---
### 2️⃣ Backend (Deployment di Vercel)

Backend bertugas untuk:

- Enkripsi & dekripsi data
- Validasi sertifikat
- Pengiriman email otomatis

#### Langkah Deployment:

1. Upload repository backend ke GitHub
2. Hubungkan repository ke **Vercel**
3. Lakukan **Deploy**

---

## 🧑‍💻 Panduan Development

### 🔧 Persiapan Lingkungan

Pastikan telah terinstal:

- Node.js (disarankan ≥ v18)
- NPM

---

### A. Backend

```bash
cd Backend
npm install
node app.js
```

Server akan berjalan di:

```
http://localhost:3000
```

Backend menggunakan **Piscina** untuk mendukung pemrosesan paralel (_True Thread Pool_).

---

### B. Frontend

```bash
cd Frontend
npm install
npm run dev
```

Untuk build produksi:

```bash
npm run build
```

Output hasil build akan tersedia di folder:

```
/dist
```

---

## 📘 Panduan Penggunaan

Panduan lengkap mengenai:

- Penggunaan antarmuka
- Pemetaan kolom Excel
- Desain sertifikat
- Konfigurasi QR Code

📎 Akses melalui tautan berikut:
👉 **[User Manual ValidSertifikat](https://docs.google.com/document/d/18pW-TMMO2WTyZshfO05Sh6IVERmVeSTO6YS4xWSn5nI/edit?tab=t.0)**

---

## 🔐 Keamanan Sistem

- Enkripsi **AES-256-CBC**
- QR Code berisi data terenkripsi
- Validasi dilakukan melalui backend server
- Tidak menyimpan data sensitif di sisi klien

---

## 🤝 Kontribusi & Lisensi

© 2025 **ValidSertifikat**
Dikembangkan oleh **Kelompok 2 – Kelas A**
**IF24 - Universitas Udayana**

---

