import { Scanner } from "./modules/scanner.js";
import { UI } from "./modules/ui.js";
import { validateCodes } from "./modules/api.js";
import { extractCode } from "./modules/utils.js";

export class ValidasiSertifikatApp {
  constructor(shadowRoot, hostElement) {
    this.shadowRoot = shadowRoot;
    this.host = hostElement;
    this.scanner = new Scanner();
    this.ui = new UI(shadowRoot);

    document.head.appendChild(
      Object.assign(document.createElement("link"), {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Poppins&display=swap",
      })
    );
    document.querySelector("body").style.margin = "0px";
    document.querySelector("body").style.padding = "0px";
    document.querySelector("body").style.minHeight = "100vh";

    // State
    this.theme = localStorage.getItem("theme") || "light";

    this.init();
  }

  init() {
    this.setupTheme();
    this.setupEventListeners();
    this.checkUrlParams();
  }

  setupTheme() {
    // Apply initial theme
    if (
      this.theme === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      this.theme = "dark";
    }
    this.ui.setTheme(this.theme);

    const themeBtn = this.shadowRoot.getElementById("theme-toggle");
    themeBtn.addEventListener("click", () => {
      this.theme = this.theme === "dark" ? "light" : "dark";
      localStorage.setItem("theme", this.theme);
      this.ui.setTheme(this.theme);
    });
  }

  setupEventListeners() {
    // File Input
    const fileInput = this.shadowRoot.getElementById("file-input");
    fileInput.addEventListener("change", (e) =>
      this.handleFiles(e.target.files)
    );

    // Camera Buttons
    const btnCamera = this.shadowRoot.getElementById("btn-camera");
    btnCamera.addEventListener("click", () => this.startCamera());

    const btnCloseCamera = this.shadowRoot.getElementById("btn-close-camera");
    btnCloseCamera.addEventListener("click", () => this.stopCamera());

    // Paste Event (Global on document, but scoped to this app logic)
    // Note: 'paste' event is usually attached to document or focused element.
    // To make it work, the component or something inside needs focus, or we listen globally.
    // For a web component, listening on document might be side-effecty,
    // but the requirement is "Upload File / Paste (CTRL + V)".
    // We will listen on document but check if the component is connected.
    this.pasteHandler = (e) => this.handlePaste(e);
    document.addEventListener("paste", this.pasteHandler);
  }

  disconnectedCallback() {
    // Clean up global listener when removed
    document.removeEventListener("paste", this.pasteHandler);
    this.stopCamera();
  }

  checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const firstParamKey = Array.from(urlParams.keys())[0];
    const codeFromUrl = firstParamKey
      ? urlParams.get(firstParamKey)?.replace(/ /g, "+")
      : null;

    if (codeFromUrl) {
      this.validateItems([
        { code: codeFromUrl, fileName: "Tautan URL Langsung" },
      ]);
    }
    console.log(codeFromUrl);
  }

  async handlePaste(event) {
    const clipboardItems = (
      event.clipboardData || event.originalEvent.clipboardData
    ).items;
    const pastedFiles = [];

    for (let i = 0; i < clipboardItems.length; i++) {
      if (clipboardItems[i].type.indexOf("image") !== -1) {
        const file = clipboardItems[i].getAsFile();
        const renamedFile = new File(
          [file],
          `Hasil Paste (${new Date().toLocaleTimeString()})`,
          { type: file.type }
        );
        pastedFiles.push(renamedFile);
      }
    }

    if (pastedFiles.length > 0) {
      this.handleFiles(pastedFiles);
    }
  }

  async handleFiles(files) {
    if (!files || files.length === 0) return;

    this.ui.showLoading("Menganalisis Sertifikat...");

    let detectedItems = [];
    const scanPromises = Array.from(files).map(async (file) => {
      try {
        if (file.type === "application/pdf") {
          const pdfCodes = await this.scanner.scanPDF(file);
          pdfCodes.forEach((c) =>
            detectedItems.push({ code: c, fileName: file.name })
          );
        } else {
          const imgCode = await this.scanner.scanImage(file);
          if (imgCode)
            detectedItems.push({ code: imgCode, fileName: file.name });
        }
      } catch (err) {
        console.error("Gagal membaca file:", file.name, err);
      }
    });

    await Promise.all(scanPromises);

    if (detectedItems.length > 0) {
      this.validateItems(detectedItems);
    } else {
      this.ui.showError(
        "QR Code Tidak Ditemukan",
        "Pastikan gambar jelas dan tidak terpotong."
      );
    }

    // Reset input
    const fileInput = this.shadowRoot.getElementById("file-input");
    if (fileInput) fileInput.value = null;
  }

  async startCamera() {
    const video = this.shadowRoot.getElementById("camera-video");
    this.ui.toggleCamera(true);
    try {
      await this.scanner.startCamera(video, (code) => {
        this.validateItems([{ code: code, fileName: "Scan Kamera" }]);
      });
    } catch (err) {
      this.ui.toggleCamera(false);
      alert(err.message);
    }
  }

  stopCamera() {
    this.scanner.stopCamera();
    this.ui.toggleCamera(false);
  }

  async validateItems(items) {
    this.ui.showLoading("Validasi ke Server...");
    const cleanCodes = items.map((item) => extractCode(item.code));

    try {
      const result = await validateCodes(cleanCodes);
      this.ui.renderResults(result.result, items);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      this.ui.showError(
        "Gagal Menghubungi Server",
        "Periksa koneksi internet Anda."
      );
    }
  }
}
