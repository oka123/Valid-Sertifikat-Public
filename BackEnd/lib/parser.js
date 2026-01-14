/**
 * Modul untuk menangani parsing body dari berbagai tipe Content-Type.
 * Mendukung JSON, x-www-form-urlencoded, dan multipart/form-data secara biner.
 */

// Fungsi pembantu untuk mengatur nilai pada objek bersarang (misal: "auth.user")
const setNestedValue = (obj, path, value) => {
  const keys = path.split(".");
  let current = obj;
  while (keys.length > 1) {
    const key = keys.shift();
    if (!current[key]) current[key] = {};
    current = current[key];
  }
  current[keys.shift()] = value;
};

/**
 * Fungsi utama untuk mengekstrak data dari request stream.
 */
const parseBody = (req) => {
  return new Promise((resolve, reject) => {
    const contentType = req.headers["content-type"] || "";
    let chunks = [];

    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const buffer = Buffer.concat(chunks);
      const result = {};

      try {
        // 1. Penanganan format JSON mentah
        if (contentType.includes("application/json")) {
          return resolve(JSON.parse(buffer.toString()));
        }

        // 2. Penanganan format x-www-form-urlencoded
        if (contentType.includes("application/x-www-form-urlencoded")) {
          const params = new URLSearchParams(buffer.toString());
          for (const [key, value] of params) {
            let val = value;
            // Coba parse jika isinya string JSON (seperti array/object)
            try {
              if (val.startsWith("[") || val.startsWith("{"))
                val = JSON.parse(val);
            } catch (e) {}
            setNestedValue(result, key, val);
          }
          return resolve(result);
        }

        // 3. Penanganan Multipart Form-Data (Aman untuk data biner/gambar)
        if (contentType.includes("multipart/form-data")) {
          const boundaryMatch = contentType.match(
            /boundary=(?:"([^"]+)"|([^;]+))/
          );
          if (!boundaryMatch) return reject(new Error("No boundary found"));

          const boundary = Buffer.from(
            `--${boundaryMatch[1] || boundaryMatch[2]}`
          );
          const parts = [];
          let start = 0;

          // Mencari pembatas (boundary) secara biner dalam buffer
          while (true) {
            const index = buffer.indexOf(boundary, start);
            if (index === -1) break;
            const nextBoundary = buffer.indexOf(
              boundary,
              index + boundary.length
            );
            if (nextBoundary === -1) break;
            const part = buffer.slice(
              index + boundary.length + 2,
              nextBoundary - 2
            );
            parts.push(part);
            start = nextBoundary;
          }

          parts.forEach((part) => {
            const headerEnd = part.indexOf("\r\n\r\n");
            if (headerEnd === -1) return;
            const header = part.slice(0, headerEnd).toString();
            const content = part.slice(headerEnd + 4);
            const nameMatch = header.match(/name="([^"]+)"/);

            if (nameMatch) {
              const name = nameMatch[1];
              const filenameMatch = header.match(/filename="([^"]+)"/);
              // Jika ada filename, simpan sebagai Buffer mentah
              let finalValue = filenameMatch
                ? content
                : content.toString().trim();

              // Parsing otomatis jika field teks berisi string JSON
              try {
                if (
                  typeof finalValue === "string" &&
                  (finalValue.startsWith("[") || finalValue.startsWith("{"))
                ) {
                  finalValue = JSON.parse(finalValue);
                }
              } catch (e) {}

              setNestedValue(result, name, finalValue);
            }
          });
          return resolve(result);
        }

        // Fallback jika format tidak dikenali
        resolve(buffer.toString());
      } catch (error) {
        reject(new Error("Gagal melakukan parsing body: " + error.message));
      }
    });
  });
};

module.exports = { parseBody };
