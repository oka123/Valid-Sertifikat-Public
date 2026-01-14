/**
 * Server Utama Valid Sertifikat
 * Mengelola Routing, CORS, dan delegasi tugas ke Worker Threads.
 */

const http = require("http");
const path = require("path");
const Piscina = require("piscina");
const os = require("os");

// Impor modul modular buatan sendiri
const { parseBody } = require("./lib/parser");
const { sendCertificateEmail } = require("./lib/mailer");

const PORT = process.env.PORT || 3000;

/**
 * Inisialisasi Thread Pool Piscina
 * Digunakan untuk menangani tugas berat seperti enkripsi/dekripsi AES
 * agar tidak memblokir event loop utama server.
 */
const piscina = new Piscina({
  filename: path.resolve(__dirname, "AES-worker.js"),
  minThreads: 2,
  maxThreads: os.cpus().length, // Menyesuaikan dengan jumlah core CPU yang tersedia
});

// Fungsi pembantu untuk mengirim respons format JSON secara konsisten
const sendJSON = (res, status, data) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
};

const server = http.createServer(async (req, res) => {
  // --- Pengaturan Kebijakan CORS ---
  // Mengizinkan akses lintas domain agar frontend bisa berkomunikasi dengan API ini
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  res.setHeader("Access-Control-Max-Age", "86400"); // Cache preflight selama 24 jam

  // Tangani request Preflight OPTIONS dari browser
  if (req.method === "OPTIONS") return sendJSON(res, 204, null);

  const { url, method } = req;

  try {
    // --- SISTEM ROUTING ---

    // 1. Health Check (GET /)
    // Digunakan untuk mengecek apakah server berjalan dengan baik
    if (url === "/" && method === "GET") {
      return sendJSON(res, 200, {
        status: "active",
        engine: "Piscina Worker Pool",
        cores: os.cpus().length,
      });
    }

    // 2. Layanan Enkripsi & Dekripsi AES (POST /)
    if (url === "/" && method === "POST") {
      const body = await parseBody(req);
      const {
        action,
        data,
        password = "PasswordDefaultAnda",
      } = body;

      // Validasi parameter wajib (action: encrypt/decrypt, data: string/array)
      if (!action || !data || !["encrypt", "decrypt"].includes(action)) {
        return sendJSON(res, 400, {
          error: "Atribut 'action' atau 'data' tidak valid.",
        });
      }

      // Normalisasi data: konversi input tunggal menjadi array agar seragam diproses oleh worker
      const dataArray = Array.isArray(data) ? data : [data];

      // Jalankan proses kriptografi di worker thread terpisah
      const resultsArray = await piscina.run({ action, dataArray, password });

      // Kembalikan format hasil sesuai dengan format input awal (array atau string tunggal)
      return sendJSON(res, 200, {
        result: Array.isArray(data) ? resultsArray : resultsArray[0],
      });
    }

    // 3. Layanan Pengiriman Email (POST /send-email)
    if (url === "/send-email" && method === "POST") {
      const body = await parseBody(req);
      const { auth, to, subject, message, image } = body;

      // Validasi kredensial login SMTP user dan data penerima
      if (!auth?.user || !auth?.pass || !to) {
        return sendJSON(res, 400, {
          error: "Kredensial email atau penerima tidak lengkap.",
        });
      }

      // Panggil service pengirim email
      await sendCertificateEmail({ auth, to, subject, message, image });
      return sendJSON(res, 200, {
        success: true,
        message: "Email berhasil dikirim ke antrean.",
      });
    }

    // 4. Penanganan Rute Tidak Ditemukan
    sendJSON(res, 404, { error: "Endpoint tidak ditemukan." });
  } catch (error) {
    console.error("Critical Server Error:", error.message);
    // Tangani kesalahan internal agar server tidak crash dan memberikan info ke klien
    sendJSON(res, 500, {
      error: "Kesalahan Internal Server",
      detail: error.message,
    });
  }
});

// Mulai dengarkan koneksi pada port yang ditentukan
server.listen(PORT, () => {
  console.log(`🚀 Backend Modular aktif di port ${PORT}`);
  console.log(
    `⚡ Menggunakan ${os.cpus().length} threads untuk pemrosesan paralel.`
  );
});
