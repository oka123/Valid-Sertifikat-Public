// src/modules/ui.js

export class UI {
  constructor(shadowRoot) {
    this.shadowRoot = shadowRoot;
    this.container = this.shadowRoot.getElementById("result-container");
    this.cameraSection = this.shadowRoot.getElementById("camera-section");
    this.instruction = this.shadowRoot.getElementById(
      "instruction-placeholder"
    );
  }

  showLoading(message = "Memproses...") {
    if (this.instruction) this.instruction.style.display = "none";
    this.container.innerHTML = `
      <div class="flex-center animate-pulse">
        <div class="loading-spinner animate-spin"></div>
        <p class="loading-text">${message}</p>
      </div>
    `;
  }

  showError(title, message) {
    this.container.innerHTML = `
      <div class="result-card" style="border-color: #fecaca;">
        <div class="result-body flex-center" style="text-align: center;">
          <div style="color: #ef4444; margin-bottom: 1rem;">
             <svg xmlns="http://www.w3.org/2000/svg" style="height: 3rem; width: 3rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
          </div>
          <p style="color: #b91c1c; font-weight: 900; font-size: 1.125rem; margin-bottom: 0.5rem;">${title}</p>
          <p style="color: #ef4444; font-size: 0.875rem;">${message}</p>
          <button id="btn-retry" style="margin-top: 1.5rem; padding: 0.5rem 1.5rem; background-color: #dc2626; color: white; border-radius: 0.75rem; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; cursor: pointer; border: none;">Coba Lagi</button>
        </div>
      </div>
    `;

    // Attach listener for retry button if needed, but it's simpler if the caller handles it via re-init
    // or we just let the user use the upload/camera buttons again.
    // The "location.reload()" in the original is bad for a component.
    // We just reset the view.
    const retryBtn = this.shadowRoot.getElementById("btn-retry");
    if (retryBtn) {
      retryBtn.addEventListener("click", () => {
        this.reset();
      });
    }
  }

  reset() {
    this.container.innerHTML = "";
    if (this.instruction) this.instruction.style.display = "block";
  }

  renderResults(decryptedDataList, originalItems) {
    this.container.innerHTML = "";

    // Ensure it's an array
    const dataList = Array.isArray(decryptedDataList)
      ? decryptedDataList
      : [decryptedDataList];

    dataList.forEach((text, index) => {
      const source = originalItems[index] || {
        fileName: "Tidak diketahui",
        code: "",
      };

      const isInvalid =
        !text ||
        text.toLowerCase().includes("error") ||
        text.toLowerCase().includes("failed") ||
        text.toLowerCase().includes("gagal");

      if (isInvalid) {
        this.renderInvalidCard(source);
      } else {
        this.renderValidCard(text, source);
      }
    });
  }

  renderInvalidCard(source) {
    const html = `
        <div class="result-card" style="border-color: #fca5a5;">
            <div class="result-header error">
                <div class="header-icon-box">
                    <svg style="height: 1.5rem; width: 1.5rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div class="header-text">
                    <h3>Sertifikat Tidak Valid</h3>
                    <p>Asal File: ${source.fileName}</p>
                </div>
            </div>
            <div class="result-body">
                <div class="data-box" style="background-color: #fef2f2; border-color: #fecaca;">
                    <p style="font-size: 0.625rem; font-weight: 900; color: #f87171; text-transform: uppercase; margin-bottom: 0.5rem;">Informasi Keamanan</p>
                    <p style="color: #991b1b; font-size: 0.875rem; margin-bottom: 1rem;">Kode enkripsi tidak dikenali oleh sistem atau telah dimodifikasi secara ilegal.</p>
                    <div style="border-top: 1px solid rgba(254, 202, 202, 0.5); padding-top: 1rem;">
                        <p style="font-size: 0.625rem; font-weight: 700; color: #f87171; text-transform: uppercase; margin-bottom: 0.25rem;">Kode/Ciphertext</p>
                        <code style="display: block; font-size: 0.625rem; color: #dc2626; font-family: monospace; word-break: break-all;">${source.code}</code>
                    </div>
                </div>
            </div>
        </div>
      `;
    this.container.insertAdjacentHTML("beforeend", html);
  }

  renderValidCard(text, source) {
    let rowsHtml = "";
    try {
      const participant = JSON.parse(text);
      rowsHtml = Object.entries(participant)
        .map(
          ([key, value]) => `
            <div class="data-row">
                <span class="data-label">${key}</span>
                <span class="data-value">${value}</span>
            </div>
          `
        )
        .join("");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      // Fallback text
      rowsHtml = text
        .split(" - ")
        .map(
          (p) => `
            <div class="data-row">
                <span class="data-value">${p}</span>
            </div>
          `
        )
        .join("");
    }

    const html = `
        <div class="result-card" style="border-color: #6ee7b7;">
            <div class="result-header success">
                <div class="header-icon-box">
                    <svg style="height: 1.5rem; width: 1.5rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <div class="header-text">
                    <h3>Sertifikat Valid</h3>
                    <p>Terverifikasi Resmi</p>
                </div>
            </div>
            <div class="result-body">
                <div class="data-box">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-light); padding-bottom: 1rem; margin-bottom: 1rem;">
                        <p class="data-label" style="margin:0;">Identitas Peserta</p>
                        <span style="font-size: 0.625rem; background-color: #d1fae5; color: #059669; padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-weight: 700;">${source.fileName}</span>
                    </div>
                    <div class="custom-scrollbar">
                        ${rowsHtml}
                    </div>
                </div>
            </div>
        </div>
      `;
    this.container.insertAdjacentHTML("beforeend", html);
  }

  toggleCamera(show) {
    if (show) {
      this.cameraSection.classList.remove("hidden");
    } else {
      this.cameraSection.classList.add("hidden");
    }
  }

  setTheme(theme) {
    if (theme === "dark") {
      this.shadowRoot.host.classList.add("dark");
      this.shadowRoot.getElementById("icon-sun").classList.remove("hidden");
      this.shadowRoot.getElementById("icon-moon").classList.add("hidden");
    } else {
      this.shadowRoot.host.classList.remove("dark");
      this.shadowRoot.getElementById("icon-sun").classList.add("hidden");
      this.shadowRoot.getElementById("icon-moon").classList.remove("hidden");
    }
  }
}
