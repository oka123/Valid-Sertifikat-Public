// src/modules/scanner.js
import jsQR from "jsqr";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js Worker
// In a real UMD build, we might need to bundle the worker or point to a CDN.
// For this task, we will try to use the CDN version if not bundled, or assume the environment handles it.
// To be safe and follow the "Module" approach, we should set it up dynamically.
const PDF_WORKER_URL =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs";

// Handle different import structures (ESM vs CJS/UMD default)
const pdfLib = pdfjsLib.default || pdfjsLib;

if (
  typeof window !== "undefined" &&
  pdfLib &&
  pdfLib.GlobalWorkerOptions &&
  !pdfLib.GlobalWorkerOptions.workerSrc
) {
  pdfLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
}

export class Scanner {
  constructor() {
    this.videoStream = null;
    this.animationFrameId = null;
  }

  /**
   * Scans an image file for QR codes.
   * @param {File} file
   * @returns {Promise<string|null>}
   */
  scanImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          try {
            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            );
            const code = jsQR(
              imageData.data,
              imageData.width,
              imageData.height
            );
            canvas.width = 0; // cleanup
            canvas.height = 0;
            resolve(code ? code.data : null);
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Scans a PDF file for QR codes (page by page).
   * @param {File} file
   * @returns {Promise<Array<string>>}
   */
  async scanPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const pagePromises = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      pagePromises.push(
        (async (pageNum) => {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({ canvasContext: ctx, viewport: viewport }).promise;
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          // Cleanup
          canvas.width = 0;
          canvas.height = 0;
          return code ? code.data : null;
        })(i)
      );
    }

    const results = await Promise.all(pagePromises);
    return results.filter((res) => res !== null);
  }

  /**
   * Starts the camera scan.
   * @param {HTMLVideoElement} videoElement
   * @param {Function} onScanFound - Callback when QR is found.
   * @returns {Promise<void>}
   */
  async startCamera(videoElement, onScanFound) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      this.videoStream = stream;
      videoElement.srcObject = stream;
      videoElement.play();

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const tick = () => {
        if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            this.stopCamera();
            onScanFound(code.data);
            return;
          }
        }
        this.animationFrameId = requestAnimationFrame(tick);
      };

      this.animationFrameId = requestAnimationFrame(tick);
    } catch (err) {
      console.error("Camera Error:", err);
      throw new Error("Gagal mengakses kamera. Pastikan izin diberikan.");
    }
  }

  stopCamera() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach((track) => track.stop());
      this.videoStream = null;
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
