import QRCodeStyling from "qr-code-styling";
import { fabric } from "fabric";
import { showAlert, showLoading, hideLoading } from "../ui/loading.js";

/**
 * Opens the QR Code configuration modal.
 * @param {Object} app - The application instance.
 */
export function openQrCodeModal(app) {
  if (app.dataHeaders.length === 0) {
    showAlert(
      app,
      "Harap upload data Excel/CSV terlebih dahulu untuk membuat Kode QR dinamis.",
      "warning"
    );
    return;
  }
  app.ui.qrCodeColumnsContainer.innerHTML = "";
  addQrCodeColumnSelector(app);
  app.ui.qrCodeModal.classList.remove("hidden");
}

/**
 * Adds a column selector for the QR Code data.
 * @param {Object} app - The application instance.
 */
export function addQrCodeColumnSelector(app) {
  const container = app.ui.qrCodeColumnsContainer;
  const count = container.children.length;
  const options = app.dataHeaders
    .map((h) => `<option value="${h}">${h}</option>`)
    .join("");

  const div = document.createElement("div");
  div.className = "flex items-center gap-2 mb-2";
  div.innerHTML = `
        <select class="flex-1 h-9 rounded-md borders bg-slate-50 dark:bg-slate-700 px-2 text-sm dark:text-slate-400" data-qr-column-index="${count}">
            <option value="">-- Pilih Kolom ${count + 1} --</option>
            ${options}
        </select>
        <button type="button" class="delete-qr-column text-red-500 hover:text-red-700 p-1 transition-colors" title="Hapus Kolom">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;

  div.querySelector(".delete-qr-column").addEventListener("click", () => {
    div.remove();
    reindexQrCodeColumns(app);
  });
  container.appendChild(div);
}

/**
 * Re-indexes the QR Code column selectors after deletion.
 * @param {Object} app - The application instance.
 */
export function reindexQrCodeColumns(app) {
  const container = app.ui.qrCodeColumnsContainer;
  const rows = container.children;

  Array.from(rows).forEach((row, index) => {
    const select = row.querySelector("select");
    if (select) {
      select.setAttribute("data-qr-column-index", index);
      const firstOption = select.querySelector('option[value=""]');
      if (firstOption) {
        firstOption.textContent = `-- Pilih Kolom ${index + 1} --`;
      }
    }
  });
}

/**
 * Saves the configuration and adds the QR Code to the canvas.
 * @param {Object} app - The application instance.
 */
export async function saveAndAddQrCode(app) {
  const columnSelectors = app.$$("[data-qr-column-index]");
  const columns = Array.from(columnSelectors)
    .map((sel) => sel.value)
    .filter(Boolean);
  if (columns.length === 0) {
    return showAlert(
      app,
      "Pilih setidaknya satu kolom untuk data Kode QR.",
      "warning"
    );
  }

  app.qrCodeConfig.columns = columns;
  // app.qrCodeConfig.validationUrl = app.ui.validationUrl.value;
  let inputUrl = app.ui.validationUrl.value.trim();

  if (inputUrl) {
    let testUrl = inputUrl;
    // tambahkan protocol jika belum ada
    if (!/^https?:\/\//i.test(testUrl)) {
      testUrl = "https://" + testUrl;
    }
    try {
      const url = new URL(testUrl);
      // hostname wajib mengandung titik (domain.tld)
      if (!url.hostname || !url.hostname.includes(".")) {
        return showAlert(app, "Silahkan masukkan URL yang benar", "warning");
      }
      // cegah hostname tidak valid
      if (!/^[a-zA-Z0-9.-]+$/.test(url.hostname)) {
        return showAlert(app, "Silahkan masukkan URL yang benar", "warning");
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return showAlert(app, "Silahkan masukkan URL yang benar", "warning");
    }
  }

  if (inputUrl) {
    if (!/^https?:\/\//i.test(inputUrl)) {
      inputUrl = "https://" + inputUrl;
    }
    const urlObj = new URL(inputUrl);
    // paksa trailing slash jika bukan file
    if (
      !urlObj.pathname.endsWith("/") &&
      !urlObj.pathname.match(/\.[a-zA-Z0-9]+$/)
    ) {
      urlObj.pathname += "/";
    }
    // hapus kode jika sudah ada
    urlObj.searchParams.delete("kode");
    // ambil parameter lama
    const oldParams = urlObj.searchParams.toString();
    // kode selalu di awal
    urlObj.search = "kode=" + (oldParams ? "&" + oldParams : "");
    app.qrCodeConfig.validationUrl = urlObj.toString();
  } else {
    // URL kosong → tetap aman
    app.qrCodeConfig.validationUrl = "";
  }

  const stylingOptions = {
    backgroundOptions: { color: app.$("#qr-bg-color").value },
    dotsOptions: { type: app.$("#qr-dots-type").value },
    cornersSquareOptions: {
      type: app.$("#qr-corners-square-type").value,
      color: app.$("#qr-corners-square-color").value,
    },
    cornersDotOptions: {
      type: app.$("#qr-corners-dot-type").value,
      color: app.$("#qr-corners-dot-color").value,
    },
    qrOptions: {
      errorCorrectionLevel: app.$("#qr-error-correction-level").value,
    },
    imageOptions: { margin: parseInt(app.$("#qr-image-margin").value) || 0 },
    image: app.uploadedLogoDataUrl || null,
  };

  if (app.$('input[name="dots-color-type"]:checked').value === "gradient") {
    stylingOptions.dotsOptions.gradient = {
      type: "linear",
      rotation: app.$("#qr-dots-gradient-rotation").value * (Math.PI / 180),
      colorStops: [
        { offset: 0, color: app.$("#qr-dots-gradient-color1").value },
        { offset: 1, color: app.$("#qr-dots-gradient-color2").value },
      ],
    };
  } else {
    stylingOptions.dotsOptions.color = app.$("#qr-dots-color").value;
  }

  app.qrCodeConfig.styling = stylingOptions;

  showLoading(app, "Membuat Kode QR...");
  try {
    const qrData = `${app.qrCodeConfig.validationUrl}[ENCRYPTED_CODE_PLACEHOLDER]`;
    const qrCode = new QRCodeStyling({ ...stylingOptions, data: qrData });
    const blob = await qrCode.getRawData("jpeg");
    const qrImageUrl = URL.createObjectURL(blob);

    if (qrImageUrl) {
      fabric.Image.fromURL(qrImageUrl, (img) => {
        img.scaleToWidth(parseInt(app.ui.canvasWidth.value * 0.2));
        img.set({
          left: parseInt(app.ui.canvasWidth.value) * 0.4,
          top: parseInt(app.ui.canvasHeight.value) * 0.3,
        });
        img.set("isQrCode", true);
        app.canvas.add(img).setActiveObject(img).renderAll();
      });
    }
    app.ui.qrCodeModal.classList.add("hidden");
  } catch (error) {
    showAlert(app, "Gagal membuat placeholder kode QR.", "error");
    console.error(error);
  } finally {
    hideLoading(app);
  }
}
